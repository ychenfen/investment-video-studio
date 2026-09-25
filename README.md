# 投研视频工作台

全代码生成竖屏投研号视频（黄仁勋 GTC 解读 + 个股行情分析 + 复盘故事短剧）的完整工作台。不用剪映，用 Remotion（React 写视频）+ WebGL shader + 真实数据 + TTS 配音，全程命令行可复现。

本工作台 = 一套**能直接跑**的项目（含 node_modules）+ 把今晚趟通的每一步、每个依赖、每个坑都写明白的文档。

## 为什么不用剪映

最初的问题是"剪映 codex 能操作、claudecode 不行"。实测结论：**剪映 6.0+ 把草稿核心文件 `draft_info.json` 加密了**（base64 + 对称加密，密钥在 app 二进制里），用户机器上是剪映 10.3.0。所有第三方草稿库（pyJianYingDraft 等）只支持剪映 ≤5.9 的明文草稿，对加密版无解（连看雪逆向社区也没公开破解）。亲手用 cliclick + accessibility 操作剪映验证过：双击自制草稿，剪映直接弹"无法打开草稿"。

详见 [docs/05-剪映为什么走不通.md](docs/05-剪映为什么走不通.md)。

绕开剪映改用 Remotion 全代码管线后，反而做出了剪映难做的东西：爬 YouTube 真实视频、抓真实股票数据画精确 K 线、WebGL 水波背景、TTS 配音自动对齐字幕，全自动、可复现、不碰 GUI。

## 文件夹结构

```
投研视频工作台/
├── README.md                     本文件
├── VIDEO_PRODUCTION_SOP.md       视频制作硬约束规格(对标 Anthropic 标准 + ffprobe 验收)
├── docs/                         极详细文档
│   ├── 00-完整流程.md            从零到成片每一步命令
│   ├── 01-依赖与下载清单.md      所有装的/下的东西 + 版本 + 来源 + 命令
│   ├── 02-踩坑与解决方案.md      今晚趟过的全部坑(最有价值)
│   ├── 03-环境配置.md            node/python/代理/chrome/字体
│   ├── 04-数据与素材来源.md      视频URL/股票数据/BGM/配音 全部来源
│   ├── 05-剪映为什么走不通.md    加密结论 + 验证过程
│   ├── 06-复盘故事视频.md        小于&阿本 剧情复盘视频: 改文案一键重排
│   ├── 07-Hypit试验.md           Hypit 接入试验: 词级锚点/改文案重排/三项指标
│   ├── 08-云端工作流.md          云端: 给文案就出片 / 网络白名单 / 素材 key
│   ├── 09-复盘视频经验总结.md    选型/抓人手法/21 条踩坑
│   └── 10-参考视频分析.md        对标视频拆解
├── scripts/                      可复用脚本
│   ├── 1-fetch-jensen-video.sh   爬 YouTube 黄仁勋演讲片段
│   ├── 2-fetch-stock-data.py     akshare 抓 A股/美股 真实 OHLCV
│   ├── 3-gen-voiceover.sh        edge-tts 生成配音 + 拿每句时长
│   ├── 4-gen-bgm-sfx.sh          下无版权 BGM + 合成卡点音效
│   ├── 5-render-and-concat.sh    渲染各段 + ffmpeg 拼接完整片
│   └── fupan/                    复盘故事视频管线(script.json → run.sh)
├── hypit-trial/                  Hypit 接入试验(前25秒, 不调生成模型, 并发2)
├── remotion/                     Remotion 项目(含 node_modules, 可直接跑)
│   ├── src/                      组件
│   │   ├── Root.tsx              注册所有 composition
│   │   ├── Main.tsx              Anthropic 极简横屏(TransitionSeries)
│   │   ├── NewsStyle.tsx         黄仁勋 Agent 解读段(竖屏)
│   │   ├── StockAnalysis.tsx     NVDA K线段
│   │   ├── StockCambricon.tsx    寒武纪折线段
│   │   ├── fupan/                复盘故事视频(FupanStory, GSAP 按帧 seek)
│   │   ├── WebGLGrid.tsx         WebGL shader 水波背景(关键)
│   │   ├── FlowGrid.tsx          CSS 流动网格(WebGL 的轻量备选)
│   │   ├── theme.ts              品牌色 + 本地字体加载
│   │   ├── stockData.json        真实股票 OHLCV 数据
│   │   └── scenes/               Hook/Tension/DataCards(Anthropic 段场景)
│   ├── public/                   素材(字体/配音/BGM/中央视频)
│   ├── remotion.config.ts        渲染配置(concurrency=1 等关键)
│   └── package.json
└── output/                       全部成片(18个,见下)
```

## 快速开始

```bash
cd remotion
# node_modules 已含, 直接渲染(用系统 Chrome, 单并发)
npx remotion render src/index.ts StockAnalysis out/test.mp4 \
  --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --concurrency=1 --crf 16

# 在 Remotion Studio 里预览(改组件实时看)
npx remotion studio
```

环境要求 + 关键配置见 [docs/03-环境配置.md](docs/03-环境配置.md)。完整制作流程见 [docs/00-完整流程.md](docs/00-完整流程.md)。

## 最终成品

`output/full-video-flow.mp4` —— 完整投研视频，60s，1080×1920，三段：

1. 黄仁勋 Agent 解读(24s)：真实 GTC 演讲画面 + "Agent = LLM + 工具框架" + 四步循环
2. NVDA 行情(16s)：真蜡烛 K 线 + 量柱 + 缩量企稳/放量反弹标注
3. 寒武纪行情(20s)：红涨折线 + 量柱 + 放量/缩量/突破标注 + 免责

全程：WebGL 水波背景（网格随波扭曲 + 流光斑，中央内容不透明挡波浪）、云扬 TTS 配音、字幕逐句对齐、BGM ducking、真实行情数据。

## 给文案就出片（通用讲解视频 · 云端可跑）

在 Claude Code 云端对 Claude 说"用这段文案做个视频"或"做一期XX基本面"，它会：WebSearch 找热点和财报数据 →
写 `projects/<slug>/script.json` → 配音 → 抓实拍视频/照片素材（记录许可）→ 渲染 → 抽帧验收 → 推送。

```bash
./scripts/cloud/doctor.sh              # 环境 + 网络体检
./scripts/studio/run.sh <slug>         # projects/<slug>/script.json → output/<slug>.mp4
```

画面：封面 / 热点卡 / 指标卡 / 柱状 / 折线 / 多空对比 / 金句 / 选项投票 / 纯实拍，均可叠背景实拍素材。
示例：`projects/cambricon-fundamentals/`。详见 [docs/08-云端工作流.md](docs/08-云端工作流.md) 和 `CLAUDE.md`。

## 复盘故事视频（FupanStory）

`output/复盘看赚钱效应.mp4` —— 56s，1080×1920：两个原创角色小于 & 阿本，深夜书房 / 茶室两个实景，散户群像、资金接力、逐字字幕 + 口型、按剧情走的配乐。画面 100% 代码生成，不调用任何图片/视频生成模型。

```bash
# 改 scripts/fupan/script.json 的文案, 然后:
./scripts/fupan/run.sh                    # 配音 → 时间轴 → 画面 → 字体 → 混音 → 渲染
```

详见 [docs/06-复盘故事视频.md](docs/06-复盘故事视频.md)。同一套画面接入 Hypit(事件绑在词上、改文案自动重排)的试验见 [docs/07-Hypit试验.md](docs/07-Hypit试验.md)。

## 可复用性

换中央视频(`scripts/1`)、换股票标的(`scripts/2`)、换旁白脚本(`scripts/3`)，重跑 `scripts/5`，就能产出新的投研视频。这是个模板，不是一次性产物。

## 红线(投研内容合规)

- 所有股票内容是**行情解读 + 投资知识讲解**，每段带"个人观点·仅供参考·不构成投资建议"
- 不做"保证买X赚钱"的个人投资建议
- 行情数据真实(akshare 实时抓)，不编造
