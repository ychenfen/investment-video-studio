# Agent instructions (scope: this directory and subdirectories)

## Scope and layout

- This repository turns a topic or supplied Chinese copy into reproducible investment videos.
- `content/jobs/<slug>/` is the source of truth for one video. Never mix two topics in one job.
- `scripts/cloud/` owns cloud setup, validation, narration, staging, rendering, and QA.
- `remotion/src/cloud/` owns the generic evidence-led composition.
- `scripts/fupan/` and `remotion/src/fupan/` remain the story-format pipeline.
- `hypit-trial/` is experimental. Do not silently promote it to the default renderer.

## Modules / subprojects

| Module | Type | Path | What it owns | How to run | Verification | Docs |
|---|---|---|---|---|---|---|
| cloud workflow | Bash/Python | `scripts/cloud/` | topic-to-video job lifecycle | `scripts/cloud/render-job.sh content/jobs/<slug>` | `scripts/cloud/doctor.sh` and `validate_job.py` | `docs/08-Claude云端视频工作流.md` |
| cloud composition | Remotion/React | `remotion/src/cloud/` | generic fundamental/hot-event visual template | `npx remotion compositions src/index.ts` | render stills, then full MP4 | `docs/08-Claude云端视频工作流.md` |
| story composition | Remotion/GSAP | `scripts/fupan/`, `remotion/src/fupan/` | FupanStory dialogue format | `scripts/fupan/run.sh` | full render + `ffprobe` | `docs/06-复盘故事视频.md` |
| Hypit experiment | Hypit | `hypit-trial/` | word-anchor experiment | see its README | compare both 25-second clips | `docs/07-Hypit试验.md` |

## Content workflow

1. Create a job with `scripts/cloud/new-job.sh <slug>`.
2. If the user supplied only a topic, research current hot events and primary evidence before writing copy.
3. Fill `brief.md`, `sources.json`, `assets.json`, and `project.json`. These are separate gates, not one free-form note.
4. Prefer the structure: hot-event hook -> fundamental event chain -> quantified evidence -> impact mechanism -> technical confirmation -> risk boundary.
5. Run `validate_job.py`. Do not render a final video with unverified claims, uncleared assets, missing credits, or guaranteed-return language.
6. Render, inspect representative frames, run media QA, and report the highest evidenced gate only.

## Evidence and asset rules

- Current primary sources outrank reposts. For material claims, use at least one primary source and one independent corroborating source when available.
- Every scene lists `source_ids`; every downloaded image or video lists an entry in `assets.json` with URL, creator/provider, license, rights status, and SHA-256.
- A real person, product, factory, document, or event image must be labeled `真实资料`; generated or generic footage must be labeled `示意素材`.
- Do not scrape paywalled, watermarked, private, or license-unclear media. Do not imply that illustrative footage depicts the named event.
- Keep factual claims, market prices, publication times, and source access times explicit. Never invent a quotation or financial result.
- Keep the investment disclaimer visible. Avoid promises such as `稳赚`, `必涨`, `翻倍`, or deterministic buy/sell instructions.

## Verification

- Quiet checks first: `bash -n`, `python3 -m py_compile`, `node --check`, `git diff --check`.
- Cloud readiness: `scripts/cloud/doctor.sh`.
- Job gate: `python3 scripts/cloud/validate_job.py content/jobs/<slug>`.
- Remotion gate: from `remotion/`, run `npx remotion compositions src/index.ts`, then render representative stills and the full composition.
- MP4 gate: use `ffprobe`; verify H.264, AAC, 1080x1920, 30fps, expected duration, and non-empty audio/video streams.
- Do not treat a running render, generated file, or pushed branch as external acceptance.

## Do not

- Do not modify existing finished MP4s as a substitute for changing their reproducible sources.
- Do not commit credentials, cookies, raw API keys, downloaded copyrighted media without clearance, `node_modules`, virtual environments, or job `work/` directories.
- Do not use the macOS-only Chrome path or localhost proxy in cloud scripts.
- Do not delete an existing job or its evidence manifest to reuse its slug.
