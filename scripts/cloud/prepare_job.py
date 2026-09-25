#!/usr/bin/env python3
"""Stage a validated job for Remotion and create CLI input props."""

import argparse
import json
import shutil
from pathlib import Path


def inside(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("job_dir")
    parser.add_argument("--repo", required=True)
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    job = Path(args.job_dir).resolve()
    work = job / "work"
    project = json.loads((job / "project.json").read_text(encoding="utf-8"))
    timings = json.loads((work / "timing.json").read_text(encoding="utf-8"))
    assets = json.loads((job / "assets.json").read_text(encoding="utf-8"))
    asset_by_id = {entry["id"]: entry for entry in assets.get("assets", [])}
    timing_by_id = {entry["id"]: entry for entry in timings["scenes"]}

    slug = project["slug"]
    public_root = (repo / "remotion/public/cloud/current").resolve()
    stage = (public_root / slug).resolve()
    if not inside(stage, public_root):
        raise RuntimeError("unsafe staging path")
    if stage.exists():
        shutil.rmtree(stage)
    stage.mkdir(parents=True)

    shutil.copy2(work / "voice.wav", stage / "voice.wav")
    rendered_scenes = []
    project_scenes = project["scenes"]
    for index, scene in enumerate(project_scenes):
        current = dict(scene)
        voice_timing = timing_by_id[scene["id"]]
        visual_start = 0 if index == 0 else voice_timing["start"]
        visual_end = (
            timing_by_id[project_scenes[index + 1]["id"]]["start"]
            if index + 1 < len(project_scenes)
            else timings["duration"]
        )
        current.update({
            "start": visual_start,
            "end": visual_end,
            "voice_start": voice_timing["start"],
            "voice_end": voice_timing["end"],
        })
        asset_id = scene.get("asset_id")
        if asset_id:
            asset = asset_by_id[asset_id]
            source = (job / asset["path"]).resolve()
            if not inside(source, job):
                raise RuntimeError(f"asset escapes job directory: {asset_id}")
            target = stage / f"{asset_id}{source.suffix.lower()}"
            shutil.copy2(source, target)
            current["asset"] = {
                "type": asset["type"],
                "src": f"cloud/current/{slug}/{target.name}",
                "truth_label": asset["truth_label"],
                "credit": asset.get("credit") or asset.get("provider") or asset.get("creator", ""),
            }
        rendered_scenes.append(current)

    render_project = dict(project)
    render_project["duration"] = timings["duration"]
    render_project["audio_src"] = f"cloud/current/{slug}/voice.wav"
    render_project["scenes"] = rendered_scenes
    props_path = work / "render-props.json"
    props_path.write_text(json.dumps({"project": render_project}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(props_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
