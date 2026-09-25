# Hypit 试验（复盘故事视频前 25 秒）

把 `scripts/fupan` 的已验收画面接进 [Hypit](https://github.com/hypit-ai/hypit)：事件绑在 Script 的词上，改文案自动重排。
试验结论、指标和坑见 [docs/07-Hypit试验.md](../docs/07-Hypit试验.md)。

| 文件 | 作用 |
|---|---|
| `run.sh` | 一键：配音 → 分轨 → 打包画面 → 生成 Script → 启动对齐替身 → Hypit 构建导出 |
| `gen-script.mjs` | `script.json` → `authors/script.svml`(Selection/Moment/Cue/Dual Text) + `main.svml` |
| `gen-assets.mjs` | 把 Remotion 版的 DOM/CSS/GSAP 编排/字体打包进组件(不重画) |
| `packages/fupan-scene` | Hypit 项目组件：Phrase(句窗口) + Moment(词锚点) → browser program |
| `stub/whisperx-stub.mjs` | WhisperX 协议替身：把 TTS 已知的逐字时间交给 Hypit(离线、免费) |
| `stems.py` | 同一混音拆成 人声 / 配乐+音效 两轨 |
| `look.svs` | 画布底色 + Caption Fine 中文逐字字幕样式 |
| `hypit.runtime.json` | 本地 Profile：workers 2、Mac Chrome 路径、whisperx 绑定到替身 |

```bash
git clone https://github.com/hypit-ai/hypit.git ~/code/hypit
cd ~/code/hypit && corepack enable && pnpm install --frozen-lockfile && pnpm build:public-types
cd <本仓库> && HYPIT_HOME=~/code/hypit ./hypit-trial/run.sh            # 原文案
HYPIT_HOME=~/code/hypit ./hypit-trial/run.sh 改过的script.json           # 改文案重排测试
```
