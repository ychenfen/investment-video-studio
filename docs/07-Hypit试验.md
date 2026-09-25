# 07 · Hypit 低成本试验（复盘故事视频前 25 秒）

**结论先行**：Hypit 适合**接入**，但不替代现有 Remotion 管线。它最值钱的是"事件绑在词上、改文案自动重排"，对**真人口播**（时间事先不知道）价值最大；对我们现在的 **TTS 配音**，逐句时间本来就是精确已知的，Remotion 管线已经能自动重排，Hypit 的增量主要在：Script 成为唯一权威、按词锚点（Moment）比按句内比例估算更可控、同结构批量变体。

- 试验代码：`hypit-trial/`（一键：`HYPIT_HOME=~/code/hypit ./hypit-trial/run.sh [script.json]`）
- 成片对照：`output/hypit试验-前25秒.mp4`（原文案）、`output/hypit试验-改文案后.mp4`（改了 3 句），对照组 `output/复盘看赚钱效应.mp4`（Remotion）

## 试验约束（按计划执行）

| 约束 | 做法 |
|---|---|
| 只取前 20–30 秒 | 渲染 frame 0–750（25 秒）：开头钩子 → 深夜书房 → 茶室对话 → 阿本的角度 → 四种模式开头 |
| 不调用图片/视频生成模型 | `hypit plan` 显示 9 个请求全部本地执行、无 Provider 费用 |
| 复用现有配音/数据/字体/图卡 | 同一个 `make_vo.py` 配音；画面 = Remotion 版同一份 DOM/CSS/GSAP 编排，打包成 Hypit browser program；同一份子集字体 |
| 并发 1–2 | `workers: 2, defaultConcurrency: 1`，不照搬官方的 64 个 Chromium |
| 保留 Remotion 作对照/回滚 | Remotion 版原样保留，Hypit 版单独目录 |

## 怎么接的

```
script.json ──gen-script.mjs──▶ Hypit Script
   每句 → Selection @{pN}…@{/pN} + 字幕 Cue(||)
   按词触发的 7 个事件 → Moment @{kN!}（"三小时""看错了""今天的钱""集体低开""资金认可""赚钱效应""哪一类"）
   发音修正 → Dual Text <只|支>
          │
make_vo.py 配音 ──▶ whisperx-stub（本地回环, 按 WhisperX 格式返回逐字时间）──▶ Hypit 对齐 Script
          │
@example/fupan-scene 组件：拿到对齐后的 Selection 窗口/Moment 帧 → 换算成秒交给原 GSAP 编排（不写死任何秒数）
Caption Fine：中文逐字卡拉OK字幕（Hypit 原生）
```

**为什么要"WhisperX 替身"**：Hypit 自己不做对齐，词级时间只来自 `whisperx-alignment` 能力（本地 WhisperX 需要从 Hugging Face 下载 ASR + 中文对齐模型，或走 HypiHub 付费）。沙箱里连不上 Hugging Face，所以写了一个 60 行的本地服务，把 TTS 逐句合成时量出的时间（句内逐字等分）按 WhisperX 返回格式交给 Hypit。**这意味着指标 1 测的是"Hypit 把中文 Script 映射到逐字证据的准确度"，不是声学对齐准确度**——后者要在你 Mac 上接真 WhisperX（或 edge-tts 的 WordBoundary）再测。

## 三个指标

### 1. 中文词级对齐
- 43 句的 Selection 窗口与配音实际起止：**最大偏差 0.033 秒（= 1 帧，帧量化）**，无漂移、无错位。
- 7 个 Moment 全部落在对应词上；`<只|支>`（显示"只"、读"支"）正确对齐。
- Caption Fine 的中文逐字点亮正常（每个汉字一个时间单元）。
- ⚠️ 声学准确度未测（见上）。

### 2. 改文案后自动重排
改了 3 句（"复盘三小时"→"你每天复盘三小时"，"你昨天到底看了什么？"→"你昨天晚上到底看了些什么？"，"我更关心的是"→"我真正关心的其实是"），重新配音后只重跑一条命令：

| 事件 | 原文案 | 改文案后 |
|---|---|---|
| "三小时"锚点（数字弹跳） | 0.467s | 0.900s |
| "今天的钱"锚点（¥ 核心出现） | 18.200s | 19.633s |
| 茶室对话场景起点 | 11.058s | 11.373s |
| 阿本角度场景起点 | 16.004s | 16.809s |
| 四种模式场景起点 | 21.563s | 23.007s |

字幕、口型窗口、场景切换、关键词动效全部跟随，**没有手改任何时间点**。

**试验暴露的真问题（已修）**：茶室对话气泡的文字原来写死在 `build.mjs` 里，改文案后字幕变了、气泡没变。已改为从 `script.json` 读取（Remotion 版同样受益）。

### 3. 人工修正时间
- 时间点修正：**0 分钟**（两轮都没有手调）。
- 一次性接入成本：组件 ~150 行（`packages/fupan-scene`）+ 两个生成器 + 替身服务；之后每期文案零代码改动。
- 每次重跑耗时（沙箱，2 workers）：配音 ~40s + Hypit 构建 ~4.5 分钟（25 秒成片，其中渲染 750 帧 ~2 分 20 秒）。

## 发现的限制 / 坑

1. **Caption Fine 是"统一样式"字幕**：做不了我们 Remotion 版的"关键词金色弹跳 + 说话人头像 + 口型"，要这些得写一个项目自己的 Caption 家族（Hypit 支持，但是额外工作量）。
2. **音效/配乐仍按我们自己的时间轴烘焙成一条轨**：真正 Hypit 化应把每个音效做成 `audio:Item at={copy.story.moment.xxx}`，改文案时音效也按词移动。
3. **内存**：残留的 Hypit 后台 worker 会一直占内存，叠加后在 8GB 沙箱里触发 OOM，把构建执行器杀掉（`Build executor exited (SIGKILL)`）。连续多次构建前先 `hypit runtime down` 或清理旧 worker。
4. 程序（browser program）里的元素**不能用 `data-start/data-duration/data-composition-id`**，这些属性归 HyperFrames 宿主管；打包时改成 `data-fs/data-fd`。
5. 场景里写死的文字不会跟随 Script：任何"复述台词"的画面文字都要从文案读取（见上面已修的气泡）。
6. 许可证：Apache 2.0 附加条件——给自己/公司/客户做视频可以；做多租户 SaaS、出售衍生软件需商业授权。产出的视频归你。

## 建议的下一步

- **真人口播**（比如纪总本人出镜录音）是 Hypit 的主战场：接真 WhisperX（Mac 上配 HF 镜像，或 HypiHub），把"放量/缩量/突破"等词设成 Moment，K 线图卡按词出现。
- TTS 内容继续用 Remotion 管线出主片；Hypit 用于批量变体（换股票/换人物/换画幅）和需要按词精确卡点的片段。
- 若接 Hypit，抖音转写服务加一个可选的"保留参考视频"开关（当前下载后删视频只留音频），便于做 clone/参考分析。
