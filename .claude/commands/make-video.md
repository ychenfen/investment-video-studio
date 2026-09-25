---
description: Research, script, source media, render, and verify one investment video from a topic or job path.
argument-hint: <topic, supplied copy, or content/jobs/<slug>>
---

Follow `CLAUDE.md` and create one video job for: `$ARGUMENTS`.

If the argument is an existing job path, continue that job from its highest completed gate. Otherwise create a collision-safe slug with `scripts/cloud/new-job.sh`, preserve the user's wording in `brief.md`, and decide whether it is finished copy or a research topic.

For a topic, invoke the `trend-researcher` subagent first. For finished copy, verify current claims without silently rewriting the user's position. Then invoke the `video-producer` subagent.

Do not skip `sources.json`, `assets.json`, job validation, representative-frame inspection, or final `ffprobe`. End with the completed gate, MP4 path, unresolved claims or rights, and the next external action.
