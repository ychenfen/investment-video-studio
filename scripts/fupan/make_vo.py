#!/usr/bin/env python3
"""复盘故事视频 · 配音 + 句级时间轴

逐句合成(每句一个角色音色) → 去首尾静音 → 按句间/场景间停顿拼接 → 输出:
  <out>/vo.wav        24kHz 单声道配音
  <out>/timing.json   每句 start/end(秒) + 每个场景 start/end —— 字幕逐字点亮、人物口型、
                      画面动效全部由它驱动, 改文案重跑即可自动重排。

两个引擎:
  edge   (默认) 微软 edge-tts, 音质最好, 需能连 speech.platform.bing.com
         代理: export EDGE_PROXY=http://127.0.0.1:7897
  kokoro 本地离线 Kokoro-v1.1-zh, 不联网, 需先下载模型(见 docs/06)
         export KOKORO_DIR=/path/to/models  (含 kokoro-v1.1-zh.onnx + voices-v1.1-zh.bin)

用法: python3 make_vo.py script.json <out_dir> [--engine edge|kokoro]
"""
import argparse, asyncio, json, os, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

SR = 24000
ap = argparse.ArgumentParser()
ap.add_argument("script"); ap.add_argument("out_dir")
ap.add_argument("--engine", default=os.environ.get("TTS_ENGINE", "edge"), choices=["edge", "kokoro"])
args = ap.parse_args()
cfg = json.load(open(args.script, encoding="utf8"))
eng = cfg["engines"][args.engine]
os.makedirs(args.out_dir, exist_ok=True)

# ---------- engines ----------
if args.engine == "kokoro":
    from kokoro_onnx import Kokoro
    from misaki import zh
    kd = os.environ.get("KOKORO_DIR", os.path.expanduser("~/models/kokoro"))
    _g2p = zh.ZHG2P(version="1.1")
    _k = Kokoro(os.path.join(kd, "kokoro-v1.1-zh.onnx"), os.path.join(kd, "voices-v1.1-zh.bin"))

    def synth(text, spk):
        ph, _ = _g2p(text)
        a, sr = _k.create(ph, voice=eng["voices"][spk], speed=eng["speed"][spk], is_phonemes=True)
        assert sr == SR
        return a.astype(np.float32)
else:
    import ssl
    import edge_tts
    import edge_tts.communicate as _ec
    # 云端代理会重签 TLS; edge-tts 默认只信 certifi, 这里改信系统/代理 CA
    if os.environ.get("SSL_CERT_FILE"):
        _ec._SSL_CTX = ssl.create_default_context(cafile=os.environ["SSL_CERT_FILE"])

    def synth(text, spk):
        with tempfile.TemporaryDirectory() as d:
            mp3, wav = os.path.join(d, "s.mp3"), os.path.join(d, "s.wav")
            c = edge_tts.Communicate(text, eng["voices"][spk], rate=eng["rate"][spk], proxy=os.environ.get("EDGE_PROXY"))
            asyncio.run(c.save(mp3))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ac", "1", "-ar", str(SR), wav], check=True)
            a, _ = sf.read(wav, dtype="float32")
            return a


def trim(a, th=0.012):
    idx = np.where(np.abs(a) > th)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.02 * SR)); e = min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]


GAP_IN, GAP_END, GAP_SCENE, HEAD, TAIL = 0.04, 0.20, 0.12, 0.12, 0.9
buf = [np.zeros(int(HEAD * SR), np.float32)]; t = HEAD; phrases = []; scenes = []
for si, sc in enumerate(cfg["scenes"]):
    if si > 0:
        buf.append(np.zeros(int(GAP_SCENE * SR), np.float32)); t += GAP_SCENE
    s0 = t
    for ln in sc["lines"]:
        # tts: 发音修正用(例: 字幕"哪只"→读"哪支"), 字幕仍显示 t
        a = trim(synth(ln.get("tts", ln["t"]), ln["s"])); d = len(a) / SR
        phrases.append({"scene": sc["id"], "text": ln["t"], "s": ln["s"], "hl": ln.get("hl", []),
                        "start": round(t, 3), "end": round(t + d, 3)})
        print(f'{t:6.2f}s {ln["s"]:>6} {ln["t"]}', file=sys.stderr)
        buf.append(a); t += d
        g = GAP_END if ln.get("end") else GAP_IN
        buf.append(np.zeros(int(g * SR), np.float32)); t += g
    scenes.append({"id": sc["id"], "start": round(s0, 3)})
buf.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
for i, s in enumerate(scenes):
    s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else round(t, 3)
scenes[0]["start"] = 0
audio = np.concatenate(buf); audio = audio / max(1e-6, np.abs(audio).max()) * 0.89
sf.write(os.path.join(args.out_dir, "vo.wav"), audio, SR)
json.dump({"duration": round(t, 3), "engine": args.engine, "scenes": scenes, "phrases": phrases},
          open(os.path.join(args.out_dir, "timing.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"配音 {t:.2f}s → {args.out_dir}/vo.wav + timing.json", file=sys.stderr)
