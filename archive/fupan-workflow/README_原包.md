# 视频工作流全套 · 复盘故事视频（小于 & 阿本 · 赚钱效应）

2026-09-23 ～ 09-25 全过程的代码、文档、成片和经验。从"参考一条小红书视频"开始，到"全代码生成、改文案一键重排、接入 Hypit 试验"结束。

**先读 [`经验总结.md`](经验总结.md)**：选型结论、架构、实测数据、21 条踩坑（症状→原因→修法）、下一步。

## 目录

| 文件夹 | 内容 | 什么时候用 |
|---|---|---|
| `经验总结.md` | 选型、架构、数据、踩坑、建议 | 先读这个 |
| `参考视频分析.md` | 原参考视频（纪总视频）的拆解：结构、逐句字幕、可复刻/不可复刻部分 | 做新一期对标时 |
| `01-HyperFrames原型/` | v1 → v2 → v3 三版的完整源码（HyperFrames + GSAP），每版一个目录 | 看每一步加了什么；HyperFrames 路线的参考 |
| `02-Remotion仓库集成(investment-video-studio)/` | 已并入你仓库的版本：`scripts_fupan`(管线) + `remotion/src/fupan`(合成) + `remotion/public/fupan`(字体/混音) + docs/06、07 + `git/`(未推送提交的 bundle) | **日常生产用这个** |
| `03-Hypit试验/` | Hypit 接入试验（前 25 秒）：组件、Script 生成器、WhisperX 替身、一键脚本；改文案测试用的 script | 真人口播 / 批量变体时 |
| `04-验收对照图/` | 参考视频拆帧、各版成片抽帧、Remotion vs Hypit 并排、原文案 vs 改文案 | 对照验收 |
| `05-成片/` | v1(48s)、v2(56s)、v3(56s)、Remotion 版、Hypit 两段试验、v2 封面 | 直接看效果 |
| `06-配音试听/` | Kokoro 中文 6 个男声试听（一号～六号） | 选音色 |

## 最快上手（日常生产）

仓库 `investment-video-studio` 里（`fupan-story` 分支合并后）：

```bash
# 改文案
vim scripts/fupan/script.json
# 一键: 配音(edge-tts) → 句级时间轴 → 画面 → 字体子集 → 混音 → Remotion 渲染
./scripts/fupan/run.sh
# 离线配音 / 只改画面 / 只生成不渲染
TTS_ENGINE=kokoro ./scripts/fupan/run.sh
SKIP_VO=1 ./scripts/fupan/run.sh
SKIP_RENDER=1 ./scripts/fupan/run.sh   # 然后 npx remotion studio 预览 FupanStory
```

## 未推送的提交

`02-.../git/fupan-hypit.bundle` = Hypit 试验那 1 个提交（已变基到你 master 的 `4ee53dc` 之上）：

```bash
cd investment-video-studio && git checkout master && git pull
git fetch <路径>/fupan-hypit.bundle fupan-story:fupan-story
git merge --ff-only fupan-story && git push
```
