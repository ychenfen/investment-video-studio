#!/usr/bin/env python3
"""Fail if a rendered CloudVideo misses its media contract."""

import argparse
import json
import subprocess
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1920)
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    video = Path(args.video).resolve()
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)
        ],
        check=True,
        text=True,
        capture_output=True,
    )
    data = json.loads(probe.stdout)
    streams = data.get("streams", [])
    video_streams = [stream for stream in streams if stream.get("codec_type") == "video"]
    audio_streams = [stream for stream in streams if stream.get("codec_type") == "audio"]
    errors = []
    if not video_streams:
        errors.append("missing video stream")
    else:
        stream = video_streams[0]
        if stream.get("codec_name") != "h264":
            errors.append(f"video codec is {stream.get('codec_name')}, expected h264")
        if (stream.get("width"), stream.get("height")) != (args.width, args.height):
            errors.append(f"size is {stream.get('width')}x{stream.get('height')}")
        if stream.get("r_frame_rate") != f"{args.fps}/1":
            errors.append(f"fps is {stream.get('r_frame_rate')}")
    if not audio_streams:
        errors.append("missing audio stream")
    elif audio_streams[0].get("codec_name") != "aac":
        errors.append(f"audio codec is {audio_streams[0].get('codec_name')}, expected aac")
    duration = float(data.get("format", {}).get("duration", 0))
    if duration <= 1:
        errors.append(f"duration is {duration}")
    if video.stat().st_size < 100_000:
        errors.append("file is unexpectedly small")

    summary = {
        "path": str(video),
        "duration": duration,
        "size": video.stat().st_size,
        "video": video_streams[0] if video_streams else None,
        "audio": audio_streams[0] if audio_streams else None,
        "errors": errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
