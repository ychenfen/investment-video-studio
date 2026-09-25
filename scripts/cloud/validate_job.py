#!/usr/bin/env python3
"""Validate evidence, rights, copy, and local assets before CloudVideo rendering."""

import argparse
import hashlib
import json
import re
from pathlib import Path

BANNED_PROMISES = ("稳赚", "必涨", "保证赚钱", "翻倍股", "无风险", "闭眼买", "一定上涨")
TRUTH_LABELS = {"真实资料", "示意素材"}
SAFE_ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}")


def unfinished(value: object) -> bool:
    return not isinstance(value, str) or not value.strip() or "TODO" in value.upper()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("job_dir")
    args = parser.parse_args()
    job = Path(args.job_dir).resolve()
    errors: list[str] = []
    warnings: list[str] = []

    def load(name: str) -> dict:
        path = job / name
        if not path.is_file():
            errors.append(f"missing {name}")
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            errors.append(f"invalid {name}: {exc}")
            return {}

    project = load("project.json")
    source_doc = load("sources.json")
    asset_doc = load("assets.json")
    brief_path = job / "brief.md"
    if not brief_path.is_file():
        errors.append("missing brief.md")
    else:
        brief = brief_path.read_text(encoding="utf-8")
        if not brief.strip() or "TODO" in brief.upper():
            errors.append("brief.md is unfinished")
    if errors:
        print("\n".join(f"ERROR {item}" for item in errors))
        return 1

    if project.get("schema_version") != 1:
        errors.append("project.schema_version must be 1")
    slug = project.get("slug", "")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,62}", slug):
        errors.append("project.slug must be a 2-63 character lowercase slug")
    if job.name != slug:
        errors.append(f"project.slug {slug!r} must match directory {job.name!r}")
    if project.get("mode") not in {"fundamental", "hybrid", "technical", "story"}:
        errors.append("project.mode must be fundamental, hybrid, technical, or story")
    if (project.get("width"), project.get("height"), project.get("fps")) != (1080, 1920, 30):
        errors.append("CloudVideo currently requires width=1080, height=1920, fps=30")
    if "不构成投资建议" not in project.get("disclaimer", ""):
        errors.append("project.disclaimer must contain 不构成投资建议")

    for key in ("title", "subtitle"):
        value = project.get(key, "")
        if unfinished(value):
            errors.append(f"project.{key} is unfinished")

    sources = source_doc.get("sources", [])
    if unfinished(source_doc.get("as_of", "")):
        errors.append("sources.as_of is required and must not contain TODO")
    source_ids: set[str] = set()
    primary_count = 0
    for index, source in enumerate(sources):
        prefix = f"sources[{index}]"
        source_id = source.get("id")
        if not source_id or source_id in source_ids:
            errors.append(f"{prefix}.id is missing or duplicated")
            continue
        if not SAFE_ID.fullmatch(str(source_id)):
            errors.append(f"{prefix}.id must use letters, digits, underscores, or hyphens")
        source_ids.add(source_id)
        if source.get("primary") is True:
            primary_count += 1
        if source.get("status") != "verified":
            errors.append(f"{prefix} must have status=verified")
        if not str(source.get("url", "")).startswith(("http://", "https://")):
            errors.append(f"{prefix}.url must be http(s)")
        for key in ("title", "publisher", "published_at", "accessed_at"):
            if unfinished(source.get(key)):
                errors.append(f"{prefix}.{key} is required and must not contain TODO")
        claims = source.get("claims", [])
        if not claims:
            errors.append(f"{prefix}.claims must list supported claims")
        elif any(unfinished(claim) for claim in claims):
            errors.append(f"{prefix}.claims contains an unfinished claim")
    if not sources:
        errors.append("sources.json must contain verified sources")
    if project.get("mode") in {"fundamental", "hybrid"} and primary_count < 1:
        errors.append("fundamental/hybrid jobs require at least one primary source")

    assets = asset_doc.get("assets", [])
    asset_by_id: dict[str, dict] = {}
    cleared_count = 0
    real_count = 0
    video_count = 0
    for index, asset in enumerate(assets):
        prefix = f"assets[{index}]"
        asset_id = asset.get("id")
        if not asset_id or asset_id in asset_by_id:
            errors.append(f"{prefix}.id is missing or duplicated")
            continue
        if not SAFE_ID.fullmatch(str(asset_id)):
            errors.append(f"{prefix}.id must use letters, digits, underscores, or hyphens")
        asset_by_id[asset_id] = asset
        if asset.get("type") not in {"image", "video"}:
            errors.append(f"{prefix}.type must be image or video")
        if asset.get("type") == "video":
            video_count += 1
        if asset.get("rights_status") != "cleared":
            errors.append(f"{prefix} must have rights_status=cleared")
        else:
            cleared_count += 1
        if asset.get("truth_label") not in TRUTH_LABELS:
            errors.append(f"{prefix}.truth_label must be 真实资料 or 示意素材")
        if asset.get("truth_label") == "真实资料":
            real_count += 1
        for key in ("path", "source_url", "provider", "creator", "license", "credit", "sha256"):
            if unfinished(asset.get(key)):
                errors.append(f"{prefix}.{key} is required and must not contain TODO")
        if not str(asset.get("source_url", "")).startswith(("http://", "https://")):
            errors.append(f"{prefix}.source_url must be http(s)")
        source_path = (job / str(asset.get("path", ""))).resolve()
        try:
            source_path.relative_to(job)
        except ValueError:
            errors.append(f"{prefix}.path escapes the job directory")
            continue
        if not source_path.is_file():
            errors.append(f"{prefix}.path does not exist: {asset.get('path')}")
        else:
            expected = str(asset.get("sha256", "")).lower()
            if not re.fullmatch(r"[0-9a-f]{64}", expected):
                errors.append(f"{prefix}.sha256 must be 64 lowercase hex characters")
            elif sha256(source_path) != expected:
                errors.append(f"{prefix}.sha256 does not match the file")

    scenes = project.get("scenes", [])
    if not 4 <= len(scenes) <= 10:
        errors.append("project.scenes must contain 4-10 scenes")
    scene_ids: set[str] = set()
    used_assets: set[str] = set()
    narration_text = ""
    for index, scene in enumerate(scenes):
        prefix = f"scenes[{index}]"
        scene_id = scene.get("id")
        if not scene_id or scene_id in scene_ids:
            errors.append(f"{prefix}.id is missing or duplicated")
        else:
            if not SAFE_ID.fullmatch(str(scene_id)):
                errors.append(f"{prefix}.id must use letters, digits, underscores, or hyphens")
            scene_ids.add(scene_id)
        for key in ("eyebrow", "headline", "narration"):
            value = scene.get(key, "")
            if unfinished(value):
                errors.append(f"{prefix}.{key} is unfinished")
        narration_text += str(scene.get("narration", ""))
        linked_sources = scene.get("source_ids", [])
        if index < len(scenes) - 1 and not linked_sources:
            errors.append(f"{prefix}.source_ids is required before the CTA scene")
        for source_id in linked_sources:
            if source_id not in source_ids:
                errors.append(f"{prefix} references unknown source {source_id}")
        asset_id = scene.get("asset_id")
        if asset_id:
            used_assets.add(asset_id)
            if asset_id not in asset_by_id:
                errors.append(f"{prefix} references unknown asset {asset_id}")
        if len(scene.get("bullets", [])) > 3:
            errors.append(f"{prefix}.bullets supports at most 3 items")
        elif any(unfinished(item) for item in scene.get("bullets", [])):
            errors.append(f"{prefix}.bullets contains an unfinished item")
        if len(scene.get("metrics", [])) > 3:
            errors.append(f"{prefix}.metrics supports at most 3 items")
        else:
            for metric in scene.get("metrics", []):
                if unfinished(metric.get("label")) or unfinished(metric.get("value")):
                    errors.append(f"{prefix}.metrics contains an unfinished metric")

    for phrase in BANNED_PROMISES:
        if phrase in narration_text or phrase in project.get("title", ""):
            errors.append(f"prohibited guaranteed-return phrase: {phrase}")

    minimum_assets = int(project.get("asset_policy", {}).get("min_media_assets", 0))
    if cleared_count < minimum_assets:
        errors.append(f"job requires at least {minimum_assets} cleared media assets, found {cleared_count}")
    unused = set(asset_by_id) - used_assets
    if unused:
        warnings.append(f"unused assets: {', '.join(sorted(unused))}")
    if real_count == 0:
        warnings.append("no 真实资料 asset; the video will rely on illustrative/code visuals")
    if video_count == 0:
        warnings.append("no background video asset; images will use Ken Burns motion")

    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"job validation: FAIL ({len(errors)} errors, {len(warnings)} warnings)")
        return 1
    print(
        f"job validation: PASS ({len(scenes)} scenes, {len(sources)} sources, "
        f"{cleared_count} cleared assets, {len(warnings)} warnings)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
