# 08 · Claude 云端视频工作流

目标：连接 GitHub 后，在 Claude Code 云端只给一段文案，或者只给“公司 / 股票 / 行业主题”，Agent 就能完成研究、脚本、素材、配音、渲染和本地验收。上传或发布仍是独立授权门槛。

这不是“照着某条视频复刻”的单模板。仓库保留两种生产线：

- `FupanStory`：人物对话、剧情化复盘，适合固定结构的知识短剧。
- `CloudVideo`：热点事件和基本面优先，可放真人、产品、工厂、公告、发布会图片及静音背景视频，适合日常投研内容。

## 一、云端能力与边界

Anthropic 托管的 Claude Code 云端当前使用 Ubuntu 24.04 x86_64，每个会话约 4 vCPU、16GB 内存、30GB 磁盘。仓库中的 `CLAUDE.md`、`.claude/settings.json`、`.claude/agents/` 和 `.claude/commands/` 会随 GitHub 克隆进入单仓库会话；本机 `~/.claude/` 不会自动带过去。

官方区分两层初始化：

1. Cloud Environment setup script：在 Claude 启动前以 root 执行，适合安装 ffmpeg、CJK 字体和 Chrome 运行库；环境会缓存，脚本约须在 5 分钟内结束。
2. 仓库 SessionStart hook：每次启动或恢复会话执行，适合 `npm ci`、Python venv 和 Remotion Browser 检查。本仓库已经配置 `.claude/settings.json`。

云端只克隆已推送的 GitHub 状态。要让云端看到本地更改，先提交并推送；或按官方规则用 `CCR_FORCE_BUNDLE=1 claude --cloud` 上传本地 bundle。

## 二、Claude Cloud 一次性配置

### 1. GitHub 授权

在 `claude.ai/code` 连接 GitHub，并确认 Claude GitHub App 已安装到：

```text
ychenfen/investment-video-studio
```

如果用本机 Claude CLI，也可以按官方方式运行 `/web-setup`。云端能否克隆与推送，以新会话实际验证为准；旧会话不会自动获得刚新增的仓库授权。

### 2. 新建 Cloud Environment

建议名称：`investment-video`。

- Network：日常渲染用 Trusted；需要 Agent 广泛检索新闻和下载授权素材时，使用 Full，或在 Trusted 中逐项添加来源域名。
- Environment variables：

```dotenv
TTS_ENGINE=edge
CONCURRENCY=2
```

不要把 API Key 直接放普通环境变量或仓库。Pro/Max 可使用 Cloud Environment 的 API credentials；其他套餐使用组织允许的密钥方案。

把 [`scripts/cloud/environment-setup.sh`](../scripts/cloud/environment-setup.sh) 的内容粘贴进 Setup script。它安装：

- ffmpeg / ffprobe
- Noto Sans CJK 字体
- Remotion Chrome Headless Shell 所需 Linux 库

### 3. 网络域名

默认 Trusted 已允许 npm、PyPI、GitHub 和 `storage.googleapis.com`，足够安装 Node/Python 依赖及下载 Remotion Chrome。本仓库的 SessionStart 会把 npmmirror lockfile 临时按官方 npm registry 解析，不改 lockfile。

Edge TTS 和内容研究通常还需要放行以下域名；实际端点变化时，以失败日志中的精确主机为准：

```text
speech.platform.bing.com
api.msedgeservices.com
r.bing.com
*.speech.microsoft.com
```

研究与素材域名只按任务增加，常见候选：交易所/公司 IR/监管机构，以及 `commons.wikimedia.org`、`upload.wikimedia.org`、`pexels.com`、`images.pexels.com`、`videos.pexels.com`、`pixabay.com`、`cdn.pixabay.com`。Full 网络更省事，但仍必须记录来源与许可。

## 三、用户只需要给什么

### 模式 A：给完整文案

示例：

```text
/make-video 把下面这段文案做成 60 秒竖屏投研视频：……
```

Agent 会保留原始文案，然后核对其中的当前数字、时间和因果结论。它不会因为文案已经写完就跳过证据和版权清单。

### 模式 B：只给主题

示例：

```text
/make-video 找一下机器人板块今天最值得讲的基本面热点，做成 60 秒视频
```

`trend-researcher` 会先给三个候选角度，排序维度是：

1. 新鲜度；
2. 原始证据强度；
3. 用户关注度；
4. 可视化素材；
5. 能否讲清反例和风险。

默认内容结构不是纯 K 线，而是：

```text
热点钩子 → 基本面事件链 → 量化证据 → 影响机制 → 技术面确认 → 风险边界 → 互动问题
```

财报、订单、新产品、客户、政策、产能、价格、成本、现金流和管理层表态优先；技术面只负责确认市场是否认可这个逻辑。

## 四、每条视频的四份权威输入

创建任务：

```bash
scripts/cloud/new-job.sh robot-order-20260925
```

目录：

```text
content/jobs/robot-order-20260925/
├── brief.md       用户原话、受众、截止时点、研究问题
├── sources.json   每条事实对应的网页/公告/报告
├── assets.json    图片/视频的许可、署名、真伪标签、SHA-256
├── project.json   画面、旁白、数据卡、source_ids、asset_id
├── assets/        实际下载的已清权素材
└── work/          配音/时间轴/渲染 props，已 gitignore
```

不同任务不得共用同一个 job 目录，也不得把旧来源当作“当前热点”。

## 五、热点研究门槛

- 优先级：交易所公告 / 公司 IR / 监管或政府原文 / 财报与电话会原文 > 权威媒体 > 聚合与社交热词。
- 重要结论尽量有一条 primary source 加一条独立 corroboration。
- `sources.json` 必须写 publication time、access time、supported claims 和 status。
- 搜索热度只决定选题，不证明事实，也不证明股价因果。
- 若来源相互冲突，保留冲突、降低信心，不做顺滑但虚假的单线叙事。

## 六、真人、实物和背景视频

可以加，而且基本面内容通常更需要这些画面。推荐顺序：

1. 公司官方 newsroom / IR / 发布会媒体包；
2. 政府、交易所或监管机构公开材料；
3. Wikimedia Commons 等有明确逐项许可的资料；
4. Pexels / Pixabay 等明确许可的通用 B-roll；
5. 代码生成图表作为无版权风险的回退。

每项素材都要在 `assets.json` 记录 source URL、provider、creator、license、credit、truth label 和 SHA-256。画面标签有两种：

- `真实资料`：确实是被讲述的人、产品、工厂、文件或事件。
- `示意素材`：通用机房、城市、生产线或 AI 生成画面；不得暗示它就是该事件现场。

禁止使用来源不明的搜索引擎缩略图、带水印视频、付费媒体截取、私人照片或“网上随便找的”素材。

## 七、验证与渲染

```bash
scripts/cloud/doctor.sh
python3 scripts/cloud/validate_job.py content/jobs/robot-order-20260925
scripts/cloud/render-job.sh content/jobs/robot-order-20260925
```

`validate_job.py` 会拒绝：

- 未核验来源；
- 基本面内容没有 primary source；
- 素材未清权、未署名、文件哈希不一致；
- scene 引用不存在的来源/素材；
- `稳赚`、`必涨`、`无风险` 等确定性承诺；
- 缺少“不构成投资建议”；
- 未完成的 TODO。

`render-job.sh` 会：

1. Edge TTS（默认直连，不使用本机 7897 代理）或 Kokoro 配音；
2. 生成句级时间轴；
3. 把本任务已清权素材暂存进 Remotion public 目录；
4. 用 input props 渲染 `CloudVideo`；
5. 用 `ffprobe` 检查 H.264、AAC、1080×1920、30fps 和音视频流。

成片默认写到：

```text
output/<slug>.mp4
```

渲染成功不等于发布成功。上传、发布、平台审核和实际触达必须分别确认。

## 八、离线配音回退

Edge TTS 云端连接失败时，可以改 `TTS_ENGINE=kokoro`。Kokoro 需要额外安装：

```bash
.venv-cloud/bin/pip install kokoro-onnx soundfile "misaki[zh]"
mkdir -p /opt/kokoro
curl -fL -o /opt/kokoro/kokoro-v1.1-zh.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.1-zh.onnx
curl -fL -o /opt/kokoro/voices-v1.1-zh.bin \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.1-zh.bin
```

把 `KOKORO_DIR=/opt/kokoro` 加到 Cloud Environment。它不联网，但音质通常低于 Edge TTS。

## 九、官方依据

本工作流按 2026-09-25 可见的 Anthropic 官方说明设计：

- [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Configure cloud environments](https://code.claude.com/docs/en/cloud-environments)

平台能力、资源上限和默认域名可能变化；遇到漂移时先按官方页面更新本文件，再修改 setup/hook。
