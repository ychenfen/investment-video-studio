# HyperFrames 原型（v1 → v2 → v3）

| 版本 | 时长 | 加了什么 |
|---|---|---|
| v1 | 48.2s | 复刻原片模板 + 全代码图解替代实拍；旁白/阿本/小于三音色；逐句字幕；合成配乐+音效 |
| v2 | 56.4s | 开头悬念钩子、第0帧封面、逐字点亮字幕、原创人物头像+口型、镜头推拉/punch-in/闪光、剧情配乐与人声闪避、结尾 A/B/C/D 评论引导 + 关注 |
| v3 | 56.4s | 深夜书房/茶室两个实景、散户群像(欢呼→惊恐)、资金接力小人、结尾双人同框；通用人物生成器 chars.mjs |

每版目录：`build.mjs`(生成 index.html) · `timing.json`(配音句级时间轴) · `mix*.py`(混音) · `subset.py`(字体子集) · `v2patch.py/v3patch.py`(该版在上一版基础上的改动脚本, 可读作 changelog)。
`assets/mix.wav` 未打包(体积大), 用 `mix*.py` + 配音重新生成。

运行(需 Node 22 + FFmpeg + Chrome):
```bash
npm i hyperframes gsap@3.14.2
node build.mjs && python3 subset.py && npx hyperframes check && npx hyperframes render --quality high -o video.mp4
```
生产请用 `02-Remotion仓库集成` 里的版本(同一套画面, 已参数化、改文案一键重排)。
