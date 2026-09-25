# Claude cloud video workflow

Read `AGENTS.md` first. The default objective is: accept Chinese copy or a topic, build an evidence-backed investment video job, render it in the Claude cloud VM, and leave an inspectable result.

## When the user gives finished copy

1. Run `scripts/cloud/new-job.sh <slug>`.
2. Put the user copy in `content/jobs/<slug>/brief.md` without changing its claims.
3. Verify every time-sensitive claim and record sources before turning the copy into `project.json`.
4. Source only cleared media, fill `assets.json`, then run validation and rendering.

## When the user gives only a company, stock, sector, or topic

1. Delegate research to the `trend-researcher` agent.
2. Rank candidate angles by freshness, primary-source strength, audience relevance, and visual evidence—not by sensationalism alone.
3. Prefer fundamental angles: earnings, orders, products, policy, supply chain, customers, capacity, cash flow, management statements, and material risks.
4. Use technical analysis only as confirmation after the fundamental event chain, unless the user explicitly requests a technical-only video.
5. Save the research trail in `sources.json`; then delegate production to the `video-producer` agent.

## Required gates

- Research gate: claim-to-source mapping is complete.
- Rights gate: every external visual is cleared and credited.
- Script gate: the hook, evidence, causal mechanism, counter-risk, and disclaimer agree with the sources.
- Local/cloud render gate: composition enumeration, representative stills, full render, and `ffprobe` all pass.
- Delivery gate: report the MP4 path and remaining upload/publish step. Do not publish unless explicitly requested.

## Primary commands

```bash
scripts/cloud/doctor.sh
scripts/cloud/new-job.sh <slug>
python3 scripts/cloud/validate_job.py content/jobs/<slug>
scripts/cloud/render-job.sh content/jobs/<slug>
```

The slash command `/make-video <topic or job path>` provides the same workflow interactively.
