#!/usr/bin/env python3
"""Create one narration track and scene timing from a CloudVideo project."""

import argparse
import asyncio
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000


def trim(audio: np.ndarray, threshold: float = 0.012) -> np.ndarray:
    indices = np.where(np.abs(audio) > threshold)[0]
    if len(indices) == 0:
        return audio
    start = max(0, indices[0] - int(0.02 * SR))
    end = min(len(audio), indices[-1] + int(0.06 * SR))
    return audio[start:end]


def edge_synth(text: str, voice: dict) -> np.ndarray:
    import edge_tts

    proxy = os.environ.get("EDGE_PROXY") or None
    with tempfile.TemporaryDirectory() as temp_dir:
        mp3 = Path(temp_dir) / "speech.mp3"
        wav = Path(temp_dir) / "speech.wav"
        communicator = edge_tts.Communicate(
            text,
            voice.get("name", "zh-CN-YunyangNeural"),
            rate=voice.get("rate", "+8%"),
            proxy=proxy,
        )
        asyncio.run(communicator.save(str(mp3)))
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR), str(wav)],
            check=True,
        )
        audio, sample_rate = sf.read(wav, dtype="float32")
        if sample_rate != SR:
            raise RuntimeError(f"unexpected sample rate: {sample_rate}")
        return audio


def kokoro_factory(voice: dict):
    from kokoro_onnx import Kokoro
    from misaki import zh

    model_dir = Path(os.environ.get("KOKORO_DIR", "/opt/kokoro"))
    model = Kokoro(model_dir / "kokoro-v1.1-zh.onnx", model_dir / "voices-v1.1-zh.bin")
    g2p = zh.ZHG2P(version="1.1")

    def synth(text: str) -> np.ndarray:
        phonemes, _ = g2p(text)
        audio, sample_rate = model.create(
            phonemes,
            voice=voice.get("name", "zm_009"),
            speed=float(voice.get("speed", 1.42)),
            is_phonemes=True,
        )
        if sample_rate != SR:
            raise RuntimeError(f"unexpected sample rate: {sample_rate}")
        return audio.astype(np.float32)

    return synth


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project")
    parser.add_argument("out_dir")
    parser.add_argument("--engine", choices=["edge", "kokoro"])
    args = parser.parse_args()

    project_path = Path(args.project).resolve()
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    project = json.loads(project_path.read_text(encoding="utf-8"))
    voice = dict(project.get("voice", {}))
    engine = args.engine or os.environ.get("TTS_ENGINE") or voice.get("engine", "edge")

    if engine == "kokoro":
        kokoro_synth = kokoro_factory(voice)
        synth = lambda text: kokoro_synth(text)
    else:
        synth = lambda text: edge_synth(text, voice)

    head = float(voice.get("head_silence", 0.15))
    gap = float(voice.get("scene_gap", 0.22))
    tail = float(voice.get("tail_silence", 0.8))
    chunks = [np.zeros(int(head * SR), np.float32)]
    cursor = head
    timings = []

    for index, scene in enumerate(project["scenes"]):
        text = scene["narration"].strip()
        audio = trim(synth(text))
        duration = len(audio) / SR
        start = cursor
        end = start + duration
        timings.append({
            "id": scene["id"],
            "text": text,
            "start": round(start, 3),
            "end": round(end, 3),
        })
        print(f"{start:6.2f}s {scene['id']:<16} {text}", file=sys.stderr)
        chunks.append(audio)
        cursor = end
        if index < len(project["scenes"]) - 1:
            chunks.append(np.zeros(int(gap * SR), np.float32))
            cursor += gap

    chunks.append(np.zeros(int(tail * SR), np.float32))
    cursor += tail
    combined = np.concatenate(chunks)
    combined = combined / max(1e-6, float(np.abs(combined).max())) * 0.89
    sf.write(out_dir / "voice.wav", combined, SR)
    (out_dir / "timing.json").write_text(
        json.dumps({"engine": engine, "duration": round(cursor, 3), "scenes": timings}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"voice {cursor:.2f}s -> {out_dir / 'voice.wav'}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
