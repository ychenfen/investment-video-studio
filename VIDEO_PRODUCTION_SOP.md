# Mantle Demo 视频制作 SOP（可复用规格 + 硬约束）

适用对象：每次为本项目（Agentic Wallet Treasury）或同类 Mantle Hackathon 链上 demo 制作视频的 AI agent。本文是规格与硬约束，照做即可；它不替代 `VIDEO_SCRIPT.md`（这一支的逐句脚本）和 `VIDEO_PRODUCTION_BRIEF.md`（这一支的一次性 brief），三者关系见第 8 章。

证据强度声明：技术规格、ffmpeg/ffprobe 命令均在本机 macOS + ffmpeg/ffprobe 8.0.1（`/opt/homebrew/bin/`）实测；本 SOP 第 7 章的转码、48k 重封装、faststart 校验、loudnorm measure、码率与流参数 ffprobe 命令均在 baseline/HEVC 素材上跑通后才写入。pyJianYingDraft 能力来自 main 分支源码逐文件核对；Anthropic B 套品牌身份由 `anthropics/skills` brand-guidelines SKILL.md 明文逐条核对，A 套 hex 为公开站目视取色的惯例推断（无官方规格文件，强度低于 B 套，§2.2 单列）；链上证据 URL 已逐一开图核验。标注「软指引」「惯例推断」「未核验假设」的条目无官方明文，最终以剪辑 GUI 目视或现场页面为准。

---

## 1. 适用范围与产出目标

这支片的定位：投 Mantle Turing Test Hackathon Track 6（Agentic Wallets & Economy）DoraHacks 部署奖的技术 demo。主角是 5 个 ERC-8004 agent 在 Mantle Sepolia 测试网跑完一个完整 treasury cycle，全程链上可独立核验。清晰度优先于电影感——技术 demo 不上复杂调色和定制动效。

### 1.1 硬指标一览表（主版 16:9，DoraHacks 交付）

| 维度 | 硬指标 | 判定/来源 |
|---|---|---|
| 时长 | ≥ 2:00（硬门槛 ≥120s），目标 2:30–3:00 | 部署奖底线 ≥2 分钟；现成 `final/agentic-wallet-treasury-demo.mp4` 为 2:59（179s） |
| 画幅 | 16:9 | DoraHacks 主投 |
| 分辨率 | 1920×1080 起，可上 4K 3840×2160 | 本片定 1920×1080 |
| 视频编码 | H.264 / High Profile，`codec_tag=avc1` | 禁 HEVC（`hvc1`/`hev1` 即不合格） |
| 编码细节 | 2 连续 B 帧 / Closed GOP / 4:2:0（yuv420p）色度抽样 | YouTube 官方 recommended upload；§7.1 给 ffprobe 复核命令 |
| 容器 | MP4 + moov atom 前置（Fast Start） | YouTube 官方；§7.1 给 faststart 校验命令、转码命令统一加 `-movflags +faststart` |
| 帧率 | 30fps（UI 演示理想 60fps 捕获后交付，见 §2.1） | 本片底片为 30fps，统一 30 |
| 音频编码 | AAC-LC，48 kHz，立体声 | YouTube 官方；48k 为硬指标（§7.1 对非 48k 判 FAIL），源为单声道时塞立体声才需 `dual_mono=true`（见 §7.3） |
| 音频码率 | 192–384 kbps | 384 为 YouTube 官方上限值，192 足够 |
| 视频码率 | 1080p SDR 标准帧率 8 Mbps / 高帧率 12 Mbps；想留源冗余可上 10–20（惯例非官方） | 含可读小字的交付一律 ≥8 Mbps；§7.1 给 ffprobe 码率复核 |
| 响度 | integrated −14 LUFS | YouTube/抖音/Reels/Shorts 一致参考点 |
| 真峰值 | True Peak ≤ −1 dBTP | 防有损转码削波，与 −14 LUFS 互补 |
| 交付位置 | `artifacts/video/final/` | 完成后回报录制路线 + 时长 + 导出参数 |

baseline 现状必须知道（实测，别当「零改动可交付」）：`agentic-wallet-treasury-demo.mp4` 的视频流合规（h264/avc1/High/yuv420p/2 B 帧/1920×1080/30fps，moov 已前置），但有两处过不了本 SOP 自己的验收——音频是 44100 Hz（差 48k）、尾部 174.6s→178.98s 有约 4.36s 静音。交付前必须先把音频重封装到 48k（§7.3 命令，`-c:v copy` 不重编码视频）并裁掉/补上尾部静音；视频码率 ~1.93 Mbps 偏低，含可读小字的版本建议重导到 ≥8 Mbps（见 §1.1 取舍）。

### 1.2 可选竖版（社媒，9:16）

| 维度 | 硬指标 |
|---|---|
| 画幅/分辨率 | 9:16 / 1080×1920 |
| 时长 | ≤ 60s（保留钩子 + 大白话流程 + DeFi 动作 + 收尾） |
| 其余编码/响度 | 同主版（H.264/avc1、AAC 48k、−14 LUFS、−1 dBTP） |
| 节奏 | 走快节奏线，见 §2.4 |
| 验收 | §7.1 脚本顶部变量改竖版取值（`WANT_W=1080 WANT_H=1920 DUR_MIN=10 DUR_MAX=60`），见 §7.1 |

边界取舍：YouTube 官方 1080p SDR 推荐码率仅 8 Mbps，网传 16–20 Mbps 是博客的「源文件冗余」建议而非官方数。本片选 8–12 Mbps 即合规。这里有个真实张力：项目内 `strategy/06-demo-storyboard.md:72` 说「< 60 MB 才能直接传 DoraHacks」（未核验假设，非官方数字），而 ~3 分钟片重导到 8–12 Mbps 体积约 180–270 MB，可能超这条内部经验线。baseline 47 MB 在 60 MB 内但码率太低。处理办法：清晰度优先，先按 ≥8 Mbps 重导，体积若真超 DoraHacks 实际上限再用 DoraHacks 给的方式（外链/分块）解决，不要为凑 60 MB 主动牺牲小字可读性；DoraHacks 真实上限值需投稿前在平台确认（见 §1.3）。

### 1.3 DoraHacks 上传规格（未核验假设，投稿前确认）

本 SOP 多处以「DoraHacks 上传困难」做码率/体积取舍，但没有官方明文支撑，必须当假设处理：

- [ ] DoraHacks BUIDL 提交页的视频上传方式（直传文件 or 仅接 YouTube/外链 URL）投稿前在平台核对
- [ ] 若直传，确认单文件大小上限（项目内经验值「< 60 MB」来自 `strategy/06-demo-storyboard.md`，未经官方证实，不可当硬数字）
- [ ] 若仅接外链，则码率/体积无平台上限，直接按 ≥8 Mbps 清晰度优先
- [ ] 把确认到的真实上限回填本节，替换掉「未核验假设」标注

---

## 2. 对标基准：Anthropic 视频标准

核心判断：本片走「Anthropic 慢调」，竖版走「短视频快调」，节奏分两条线，但工艺四铁律两条线同标。

### 2.1 技术规格硬约束（YouTube 官方 + 摄制规范）

- [ ] 容器 MP4 + moov atom 前置（Fast Start）；校验见 §7.1，转码生成用 `-movflags +faststart`
- [ ] 视频 H.264 / High Profile / 2 连续 B 帧 / Closed GOP / 4:2:0（yuv420p）
- [ ] 音频 AAC-LC，48 kHz，立体声
- [ ] integrated −14 LUFS（YouTube 只衰减比 −14 响的、不提升比 −14 轻的，所以必须主动压到 −14，混到 −20 会被永久变小声）
- [ ] True Peak ≤ −1 dBTP
- [ ] 帧率按内容分：叙事/品牌片 24fps，讲解/口播 30fps，**屏幕录制/UI 演示 60fps**；且以录制帧率编码上传，禁混帧/禁强行变速到非整除帧率

帧率纠正点：不能写「24–30 随便」。产品 UI 演示理想是 60fps 捕获，界面滚动/交互才不拖影。本片若沿用现成 30fps 底片则全程 30fps（已统一，不混帧即可）；若重录 dashboard 走屏幕捕获，优先 60fps 捕获，交付时再按需处理。

Closed GOP 实现说明（实测）：用 libx264 时 `-g 60 -keyint_min 60 -sc_threshold 0` 固定 GOP 长度、关掉场景切换插入的额外 I 帧，即得固定间隔的 closed GOP（30fps 下 GOP=60 即每 2 秒一个关键帧）。完整转码 recipe 见 §7.0，已实测产出 `has_b_frames=2`/`pix_fmt=yuv420p`/`avc1`/moov 前置。

### 2.2 品牌色值与字体表（两套，按用途分清，二选一不混搭）

Anthropic 有两套并行视觉身份，用途不同，证据强度不同：

A 套 — 公开官方品牌（anthropic.com / claude.ai / 官方发布片）。软指引/取色推断：以下 hex 为公开站目视取色，无官方规格文档背书，精确值以官网为准，与 B 套（skill 明文）不同级：

| 项 | 值 |
|---|---|
| 标题/UI 字体 | Styrene B（窄利落）/ Styrene A（宽几何）；近年迁移自有 Anthropic Sans |
| 衬线正文/标题 | Tiempos Text（Klim）；自有 Anthropic Serif |
| 奶白 Pampas | `#F4F3EE`（取色推断） |
| 赤陶橙 Crail | `#C15F3C`（≈ Claude logo 橙，取色推断） |
| 暖灰 Cloudy | `#B1ADA1`（取色推断） |
| 近黑 | `#191817`（取色推断） |

B 套 — brand-guidelines skill 可移植近似（生成 PPT/海报/字幕板用，Anthropic 官方 skill 明文，逐条核对一致）：

| 项 | 值 |
|---|---|
| 标题字体 | Poppins（回退 Arial），≥24pt |
| 正文字体 | Lora（回退 Georgia） |
| 主色 Dark / Light | `#141413` / `#faf9f5` |
| 中灰 / 浅灰 | `#b0aea5` / `#e8e6dc` |
| 强调橙 / 蓝 / 绿 | `#d97757` / `#6a9bcc` / `#788c5d` |

字体取用规则：
- [ ] 字体 A 套或 B 套二选一，禁两套混搭
- [ ] 本地无 Styrene/Tiempos（商业付费字体，剪映/CapCut 不内置）时，回退 B 套是「正确动作」不是将就（这本就是 Anthropic 给的可移植近似）
- [ ] 非文字形状取强调色按 橙→蓝→绿 循环（skill 明文规则）
- [ ] 文字颜色随背景明暗选取以保对比

### 2.3 观感/节奏哲学（软指引，无官方明文，从发布片归纳）

Anthropic 发布片特征：sophisticated minimalism、大量留白、垂直清晰分区、真实产品 UI 居中清晰呈现、高对比文字、专业又亲和。一个反面信号：堆默认动效（动画状态点、teal 点缀）会被批为 slop——克制 ≠ 堆默认动效，动效要服务上下文而非装饰。

### 2.4 两条线分线（这是产出重点）

对立只在「节奏/钩子」层，不在「工艺」层。

| 维度 | Anthropic 慢调（本片 16:9） | 短视频快调（竖版 9:16） |
|---|---|---|
| 前 3 秒 | 自信留白、缓入、可先沉默 | 必须强钩子，2–3s 抓住，目标 intro 留存 70%+ |
| 视觉变化频率 | 每 15–25s 一次，长稳镜 | 每 2–3s pattern interrupt（切/推/字/音效） |
| 停顿 | 留白做呼吸 | 强停顿 + 反差做记忆点 |
| 字幕 | 克制 | 大字幕常驻 |
| 首帧 | 可放 logo/品牌 | 禁 logo / 禁「hey guys」，4–7 词高对比大字 |

竖版用 Anthropic 的色与字包装快节奏（暖底 + 赤陶橙 + 衬线大字），做「高级的快」而非「廉价的快」。

工艺四铁律（两条线同标，不分线）：
- [ ] 品牌色字一致（A 套优先 / B 套回退，二选一不混搭）
- [ ] 运动平滑：所有位移/缩放/转场用缓动曲线（ease-in-out 或自定义贝塞尔），禁线性运动、禁生硬瞬切（竖版的「快」靠剪辑节奏不靠丑切）
- [ ] 音频 −14 LUFS integrated + −1 dBTP
- [ ] 产品 UI 真实清晰、可读、不糊、不假（含可读小字的版本码率 ≥8 Mbps，别用 2.1 Mbps 底片直交）

工艺铁律与代码管线的冲突（必须知道的取舍）：第 3 章推荐的 pyJianYingDraft 关键帧只有线性插值，无缓动曲线。这与「运动平滑」铁律直接冲突。处理办法见 §4.2——位移/缩放幅度小且时长短时线性肉眼可接受；要真缓动则在剪映 GUI 手动改关键帧曲线，或缩短动效时长把线性感藏掉。这是代码管线最硬的一处局限，不要假装不存在。

---

## 3. 推荐制作管线

总原则：能代码化的全代码化，GUI 步骤压到最小，最后过验收。

### 3.1 管线四阶段

1. 外部 TTS + 字幕时间轴对齐
   - 旁白用 `VIDEO_SCRIPT.md` 文案，外部 TTS（云端 API 或剪映「文本朗读」）生成音频文件。pyJianYingDraft 和 jianying-mcp 都不提供 TTS/ASR，这是剪映 App 云端功能。
   - 字幕只能 `import_srt`（仅 SRT 格式）导入已有文案。先把旁白切成带时间戳的 SRT。
2. 用 pyJianYingDraft 拼草稿（位置/层级/节奏全代码化）
   - `script.save()`/`dump()` 写 `draft_content.json`，全平台可用。
   - 主轨 B-roll、字幕轨、强调动效、音频轨、卡点全部代码化。
3. 仅导出留最小 GUI 步
   - 非 Windows 只能生成草稿，渲染出 mp4 必须在 Windows + 剪映 6 及以下 + uiautomation（见 §3.3）。
   - 或彻底绕开剪映渲染，用 ffmpeg 流水线转码/烧字幕/归一（见 §7.0 + 第 7 章命令，幂等性更好）。
4. 验收（第 7 章全打勾才算过）

### 3.2 代码管线消除哪些 GUI 脆弱点

纯 GUI 手剪的脆弱点 → 代码管线如何消除：

| GUI 脆弱点 | 代码管线 |
|---|---|
| 焦点丢失（点错面板/输入框） | 无 UI 焦点概念，参数直接写 JSON |
| 坐标误点 | 位置用 `transform_x/y`、`position_x/y` 数值写定 |
| 播放头错位 | `target_timerange(start, duration)` 微秒精确，不靠拖动 |
| Y 轴负值反直觉（字幕往下要负值） | 代码里写死 `transform_y=-0.8`，注释清楚，不靠手感 |
| 层级遮挡（图层顺序乱） | `add_track(relative_index=)` 越大越靠前景，显式声明 |
| 重做参数漂移 | 同一脚本跑出同一草稿，可版本控制 |

代码管线消不掉、仍须 GUI/换平台的：渲染出 mp4（非 Windows/剪映 7+）、封面、关键词单词级高亮、滤镜/特效参数动画、缓动曲线、曲线变速、自动 ducking、响度归一、节拍检测、ASR 字幕、TTS 配音、色轮/曲线/LUT 精细调色、箭头逐帧生长。降级路径见第 4 章。

### 3.3 平台分工红线（必须当两个独立阶段）

- [ ] 「保存草稿」（`script.save`/`dump` 写 `draft_content.json`）：Mac/Linux/Windows 全平台可用
- [ ] 「渲染导出 mp4」：必须 Windows + 剪映 6 及以下 + uiautomation；`JianyingController` 仅在 `sys.platform=='win32'` 导入，非 Windows import 即不可用
- [ ] 渲染前提：窗口名须为「剪映专业版」（国内版，非 CapCut，CapCut 用作者另一仓库 pyCapCut）；必须有导出权限（不用 VIP 功能或已开 VIP）否则可能死循环；`export_draft` 默认 timeout=1200s；会置顶并接管光标，建议夜间无人值守跑
- [ ] 替代方案：本机就在 macOS，且 ffmpeg 8.0.1 已就绪，强烈建议渲染/转码/烧字幕/归一全走 ffmpeg 流水线（§7.0 + 第 7 章命令实测通过），比 uiautomation 稳且幂等

类名一律驼峰：`ClipSettings`/`VideoSegment`/`AudioSegment`/`TextSegment`/`TextStyle`/`KeyframeProperty`/`MaskType`/`TransitionType`/`FilterType`。下划线名（`Clip_settings` 等）是 deprecated 代理类，调用发 `DeprecationWarning`，禁用。

---

## 4. 能力清单速查

### 4.1 可代码化的剪辑能力（pyJianYingDraft / jianying-mcp）

画面变换与动画：
- 静态变换 `VideoSegment(..., clip_settings=ClipSettings(...))`：`alpha`(0-1)、`flip_horizontal`/`flip_vertical`、`rotation`(顺时针角度可负)、`scale_x`/`scale_y`(1.0=原始)、`transform_x`/`transform_y`(单位=半画布，0=居中，1=画布边缘；字幕惯用 `transform_y=-0.8`)
- 关键帧动画 `seg.add_keyframe(KeyframeProperty.X, time_offset, value)`：`time_offset` 相对片段头部，`int`(微秒) 或 `"1.5s"`。属性含 `position_x/y`、`rotation`、`scale_x/y`、`uniform_scale`、`alpha`(仅 Video)、`saturation/contrast/brightness`(范围 −1~1，仅 Video)、`volume`
- 关键帧优先级高于 clip_settings，覆盖同属性静态值
- 配方：数据放大/推拉 = `uniform_scale` 两帧(1.0→1.5)；Ken Burns = `uniform_scale` + `position_x/y` 同打；淡出 = `alpha` 两帧(1.0→0.0)

转场/动画：`video_segment.add_transition(TransitionType.X, duration)` 加在前一片段上；`segment.add_animation(IntroType/OutroType/GroupAnimationType.X, duration)` 可叠加。

蒙版/滤镜/特效：`add_mask(MaskType.X, ...)`、`add_filter(FilterType.X, intensity=0~100)`、`add_effect(VideoSceneEffectType/VideoCharacterEffectType, params=[0~100有序数组])`。独立轨道版 `script.add_track(TrackType.effect/filter)` + `script.add_effect/add_filter`。

文本：`TextSegment(text, timerange, font=, style=TextStyle(size, bold, color=(r,g,b)[0-1], align=0/1/2, ...), border=TextBorder, background=TextBackground(color="#RRGGBB"必填), shadow=TextShadow)`；lower-third = TextSegment + `ClipSettings(transform_y=±0.8)` + 可选 background + add_animation。

音频：`AudioSegment(path, target_timerange, source_timerange=, speed=, volume=, change_pitch=)`；`add_fade(in, out)` 每片段一次；音量关键帧 `audio_seg.add_keyframe(time_offset, volume)`；多轨 `add_track(TrackType.audio, name)`。

画中画/分屏/补画幅：多视频轨 + `ClipSettings(scale/transform)`；`set_mix_mode(MixModeType.X)`（10 种混合模式）；`add_background_filling("blur"/"color", blur=0.0625/0.375/0.75/1.0)`（仅最底层视频轨）。

logo 角标：透明 PNG 走前景视频轨，`ClipSettings` 定位角落、缩小，`target_timerange` = 全片时长。

枚举取成员技巧：`VideoSceneEffectType.from_name("全息扫描")`（忽略大小写/空格/下划线），适合 agent 用字符串拼名。

### 4.2 不能代码化、必须 GUI / 换平台兜底的边界

| 能力 | 限制 | 降级路径 |
|---|---|---|
| 缓动曲线 | 关键帧只有线性插值（`curveType:"Line"`），无贝塞尔 | 剪映 GUI 手改曲线；或缩短动效时长藏掉线性感 |
| 滤镜/特效/转场/蒙版参数动画 | 不能给这些参数打关键帧 | GUI；或整段定值不动效 |
| 曲线变速 | 仅 `speed=` 定速，`curve_speed=None` | GUI |
| 关键词单词级高亮 | 文本 styles 只有一个覆盖全文 `range:[0,len]` 的 fill | 把高亮词拆成独立 TextSegment 叠放（见 §5.3）；或 GUI |
| 花字/气泡/贴纸 | 无枚举、未导出 | 剪映手做模板草稿 → `inspect_material()` 抠 effect_id/resource_id → `add_effect(id)`/`add_bubble(effect_id, resource_id)`/`StickerSegment(resource_id)` |
| 箭头/圈选/标注 | 无原生对象，无法逐帧改 PNG 生成「箭头生长」 | 透明 PNG 当 VideoSegment 放前景轨 + `ClipSettings` 定位 + `add_keyframe(alpha/scale/position)` + `add_animation` 弹入 |
| 旁白 ducking | 无自动原语 | 旁白时段对 BGM 手打 4 个音量关键帧（降-保持-保持-升） |
| 卡点节拍检测 | 库不做检测 | 外部 librosa 算节拍微秒，再设 `target_timerange` |
| 响度归一 | 无 loudnorm/EBU R128 接口 | 外部 ffmpeg `loudnorm`（§7.3）或剪映「响度统一」 |
| 调色 | 仅 brightness/contrast/saturation 关键帧(−1~1) + 滤镜 + 混合模式 | 无色轮/曲线/LUT 代码接口，须 GUI |
| 封面 | `draft_cover` 机制本库不碰 | GUI 手设 |
| 渲染出 mp4 | 非 Windows/剪映 7+ 不可 | Windows+剪映6 跑 uiautomation；或 ffmpeg/MoviePy 流水线 |
| TTS/ASR 字幕 | 库不提供 | 云端 API 产出音频文件再 `AudioSegment` 挂轨；字幕 `import_srt`(仅 SRT) |

互斥与版本红线（违反抛 ValueError 或加载失败）：
- [ ] scale 关键帧二选一：`uniform_scale`(锁 XY) 或 `scale_x/scale_y`(分轴)，互斥
- [ ] 文本/贴纸关键帧只支持位置和大小，不支持 alpha/调色；音频关键帧只控 volume
- [ ] 每片段每类动画只能一个；组合动画不能与入/出场共存；文本同时用循环+出入场须先加出入场再加循环；视频动画只能加 VideoSegment
- [ ] 每片段只能一个转场、一个蒙版、一次 add_fade；转场必须加在「前一个」片段上
- [ ] 主视频轨（最底层）片段必须从 0s 开始，否则被剪映强制对齐
- [ ] 草稿生成支持剪映 5+；模板模式（加载/inspect/替换）仅剪映 5.9 及以下（6+ 加密 draft_content.json）；GUI 自动导出仅剪映 6 及以下（7+ 隐藏控件）
- [ ] 素材时间一律微秒，`trange(start, duration)` 第二参是时长不是结束时间；`source_timerange` 超出素材时长抛 ValueError
- [ ] jianying-mcp 底层就是 pyJianYingDraft，不新增任何能力，其 README「无平台限制」是包装层措辞，真实约束以底层库为准

环境建议：Python 3.8 或 3.11（库作者测试版本），3.13 下 uiautomation 有依赖坑。剪映 5.9 有自动升级到 6+ 风险，一旦升级模板模式失效，需锁版本或关自动更新。`TrackType.adjust` 未实测能否挂片段，不要用。`TextBorder.width` 源码自带注释「映射可能不完全正确」，描边宽度须实测微调。

---

## 5. 这支 Mantle Demo 的具体落地

### 5.1 粗略分镜（精确到秒以 `VIDEO_SCRIPT.md` 为准）

本表是粗略分镜，看的是镜头顺序和画面区块对应，不是逐帧时间码。精确秒数、逐句旁白、每段「Show 什么」一律以 `VIDEO_SCRIPT.md` 为准（见 §8 冲突优先级）。下面「脚本段」一列直接抄 `VIDEO_SCRIPT.md` 的实际段头，剪辑照那个切；旧版 `strategy/06-demo-storyboard.md`（terminal 录制、score 91/41、6 cycles、USDY、QR）**不照它录**。

| 脚本段（VIDEO_SCRIPT.md 段头） | 镜头 | 画面（底片对应区块） | 旁白要点 |
|---|---|---|---|
| 0:00–0:15 Hook | 钩子 | 顶部 hero「The first wallet that grades its own employees」 | 多数 agent 钱包停在「AI 能点按钮」，我们解决更难的：授权/执行/验证/声誉 |
| 0:12–0:32 What each agent did | 大白话流程 | 「What just happened, in plain English」面板 | 一个 cycle：Scout 提案→Guard 批→Claw 执行→Sentinel 复核拿 MNT→Ledger 写声誉 |
| 0:32–0:44 Architecture | 架构 | 5 张 agent 卡片 | 5 个 ERC-8004 身份，3 个链上注册表 |
| 0:40–1:15 Live Run | 实跑 + x402 | Risk Verdict / Execution Proof / Sentinel Validation | Guard 过 4 项检查；Claw 发真链上 tx；Sentinel 复核打分并拿 x402 MNT 费 |
| 1:16–1:34 Byreal capability | Byreal 能力 | 「Byreal Skills Probe」+「Which Byreal capability?」必答面板 | 真实 RealClaw CLI，36 capabilities / 5 (top) pools，Scout 与 Sentinel 用它做研究 |
| 1:34–1:50 Verified contracts | 合约已验证 | 「Contract Verification」绿章 | 两个合约 Sourcify/Mantlescan exact-match，源码对得上链上字节码 |
| 1:50–2:15 ERC-8004 Evidence | 链上证据 | Live Chain / Event Log | 链上事件回填，点 tx 跳 Mantlescan 独立核验 |
| 2:15–2:38 Why This Fits Track 6 | 契合度 | control loop 收束 | identity → authorization → execution → verification → reputation 可复用 |
| 2:38–2:54 Close | 收尾 | GitHub + dashboard URL | 开源、公开 dashboard、链上可查；control loop 可复用于 RWA/DeFi rebalance/treasury |

注：`VIDEO_SCRIPT.md` 自身相邻段有 2–4s 重叠（如 0:00–0:15 与 0:12–0:32），那是脚本的问题，建议 owner 顺手修脚本段界；本表不重复制造「看似精确」的边界值，统一回脚本对齐。

5 个 agent 职责（旁白事实底座，措辞照此勿改）：Scout researcher 提 bounded action；Guard risk officer 跑 4 项 policy 检查（allowlist / trade cap / drawdown guard + policy gate）通过则签 EIP-712 ApprovedAction；Claw executor 用与 Guard 不同的钱包通过 AgenticTreasury 调 `executeApprovedAction` 链上验签；Ledger auditor 写 ReputationRegistry `giveFeedback` 并发起 validationRequest；Sentinel validator 独立 re-simulate 给 0–100 分（本次 92/100），写 ValidationRegistry，通过 ValidatorPaymaster 拿 x402 式 MNT 费（0.001 MNT）。收尾必须点 control loop：identity → authorization → execution → verification → reputation。

必须全覆盖的核心用例（缺一不可）：① 5 个 ERC-8004 agent（5 卡片 + agentId）② 1 笔执行 tx（Claw 通过 AgenticTreasury）③ 1 笔 x402 支付（Sentinel 0.001 MNT）④ 1 笔验证（92/100）⑤ 1 笔 WMNT DeFi 动作（0.01 MNT → WMNT）⑥ Sourcify/Mantlescan 验证绿章（两合约 exact-match）⑦ 至少点开一个 Mantlescan tx/合约页做现场可独立核验。

### 5.2 证明镜头（带 tx/合约/URL，已逐一开图核验）

| 用途 | URL / 值 | 核验状态 |
|---|---|---|
| 公开 dashboard（必展示，非 localhost） | `https://ychenfen.github.io/agentic-wallet-treasury/` | 近期 commit 已部署 GitHub Pages + 合约验证，公开站应为新版，录前仍肉眼确认 |
| 执行 tx | `https://sepolia.mantlescan.xyz/tx/0xa3d26423e3ab39e4303009d862d2e3f9f6d50fcc8139f93c3d73821999a4ca8a` | proof 图 `execution-tx-browser.png`：Success、Block 38204505、method `0xbadb5004`（来自 proof 截图，未在 SUBMISSION_HASHES.md 文本中，录前以 Mantlescan 现场为准）、To=Treasury `0x739862…` |
| Wrap tx（WMNT Deposit） | `https://sepolia.mantlescan.xyz/tx/0x7a856a4f4c8d2a9d9d4f61af8877d2e630cd73828c9d7c83a75f19eaff234499` | proof 图 `wrap-tx-browser.png`：Transfer 0.01 MNT to WMNT `0xc0ee…1ac7`、Success、Block 39378744；与 SUBMISSION_HASHES.md 一致 |
| Sourcify 验证 | `https://sourcify.dev/#/lookup/0x739862C3Cf9b5f9Fe6A8ecd95E75714A20116fE9` | proof 图 `sourcify-browser.png`：Chain ID 5003、Creation+Runtime 双绿章、Verified 2026-06-01 |
| ValidatorPaymaster 合约（第二个已验证） | `0x1b94af58b27203bc74ab749e4916d854758c7475` | Mantlescan + Sourcify verified, solc 0.8.35 |
| 证据报告 | `https://github.com/ychenfen/agentic-wallet-treasury/blob/main/SUBMISSION_HASHES.md` | proof 图 `github-evidence.png` |
| GitHub 仓库（收尾） | `https://github.com/ychenfen/agentic-wallet-treasury` | — |

proof 截图全在 `artifacts/video/final/work/proof/`（execution-tx-browser / wrap-tx-browser / sourcify-browser / github-evidence / execution-tail-captioned / proof-contact-sheet.jpg）。备用真实 tx（来自 SUBMISSION_HASHES.md，可作交互镜头）：x402 Payment tx `0x20406118…4e7571`（amountWei 1000000000000000）、ValidationResponse(=92) tx `0x9429939a…fbfd74`。

数字口径校准（写错即被评委抓）：
- chainId = 5003（Mantle Sepolia 测试网，SUBMISSION_HASHES.md 确认）；README「关键数字」区写的 5000 是主网，别混
- 合约编译器统一 solc 0.8.35：AgenticTreasury（需 via-IR）与 ValidatorPaymaster 均为 `0.8.35`（Etherscan/Sourcify 实测 `v0.8.35+commit.47b9dedd`，SUBMISSION_HASHES.md 中 0.8.26 出现 0 次）。`VIDEO_SCRIPT.md` L79 仍写「AgenticTreasury 0.8.26 via-IR」是已废弃错标（commit 59164fc 已根因修正：实为 solc-js 0.8.35 + via-IR，旧 forge 0.8.26 路径作废），旁白/字幕一律念 0.8.35，以 SUBMISSION_HASHES.md 为准。建议 owner 直接改 `VIDEO_SCRIPT.md` L79
- Byreal 措辞用「36 capabilities + 5 (top) pools」最安全，别说「5 个池子 = 全部池子」（probe overview pools 实为 104，top-pools 返回 5）
- Validation 分数 = 92/100；旧 storyboard 的 91/41 已废弃

需 owner 裁定的执行 tx hash 不一致（不在本片可解决范围）：脚本+proof 图用 `0xa3d26423…99a4ca8a`（block 38204505，To=Treasury），SUBMISSION_HASHES.md 里它和 `0xf7d2c2fa…701e2f`（block 38212699）都是 `TreasuryActionExecuted` 事件、同 executor/同 target，但报告把 `0xf7d2c2fa…` 列为 canonical「Execution」。剪辑时只能用一个 hash 且全片一致——建议沿用脚本+proof 图的 `0xa3d26423…`（有现成证明截图），但评委对照 SUBMISSION_HASHES.md 的 canonical 行会看到不同 hash。是否统一证据报告由 owner 决定。

### 5.3 关键词高亮表（字幕花字）

这些 token 在字幕里换色/加粗/花字突出（来自 TEAM_HANDOFF.md §4）：

| 关键词 | 备注 |
|---|---|
| `ERC-8004` | 身份标准 |
| `Sourcify verified` | 验证绿章配套 |
| `WMNT` | DeFi 动作 |
| `x402` | validator 支付 |
| `EIP-712` | Guard 签名 |
| `Mantle Sepolia` | 测试网标注，诚实关键 |
| `+0.01 WMNT` | DeFi 结果，卡点处 |
| `92/100` | 验证分数 |

代码管线注意：单词级高亮 pyJianYingDraft 不支持（§4.2）。要做高亮须把这些词拆成独立 TextSegment 叠在主字幕上、单独配色定位，或这一步走剪映 GUI。

### 5.4 强调放大与卡点时刻

- 对这些元素做 zoom-in 关键帧（`uniform_scale` 1.0→1.5）2–3 秒突出：tx hash、合约地址、验证绿章、`+0.01 WMNT`、`92/100`
- 关键数据放画面中上区，别压最底部（横屏字幕安全区见 §7.4）
- 三处卡点配轻「叮」音效：tx 链接点击、验证绿章出现、`+0.01 WMNT` 出现

### 5.5 现成素材清单（已逐一 ffprobe / 开图核验）

| 素材 | 路径 | 规格（实测） | 用途与注意 |
|---|---|---|---|
| baseline 成片 | `artifacts/video/final/agentic-wallet-treasury-demo.mp4` | 1920×1080 / 30fps / h264 / avc1 / High / yuv420p / 2 B 帧 / 2:59(179s) / 47M / 视频 ~1.93Mbps；**音频 44100Hz stereo**；moov 已前置 | 视频流合规但两处过不了本 SOP 验收：①音频 44.1k（差 48k，§7.3 重封装到 48k）②尾部约 4.4s 静音（174.6→178.98s，§7.2 抓出，须裁尾/补声）。含可读小字版本码率偏低，建议重导 ≥8Mbps。不是「零改动可交付」 |
| 无声底片（B-roll） | `artifacts/video/dashboard-walkthrough.mp4` | 1600×900 / 25fps / h264 / 无音频流 / 186s | 按脚本时序平移每区块。**1600×900→1920×1080 放大约 1.2× 且 25→30fps 变帧会引入重复帧/不平滑，tx hash 等小字可能不可读**；若该底片入镜含关键数字段落，优先用本表分段 PNG 定格或重录 1920×1080 |
| 同源 webm | `artifacts/video/dashboard-walkthrough.webm` | 20M | 补料 |
| HEVC 版（禁直接交付） | `final/…-final.mp4` / `…-draft.mp4` | 1920×1080 / 30fps / **hevc / hvc1** / Main / 音频 44100Hz / 192s / ~170–178M | 不满足 H.264 硬指标，须走 §7.0 转码到 H.264（顺带把音频转 48k） |
| 分段截图（新版，对齐当前 dashboard） | `artifacts/screenshots/00-topbar…10-evidence.png`（多数 Jun 1 16:53+；`05-verification/06-live-chain/07-event-log/08-readiness/09-evidence` 这组是 16:16–16:17 旧帧，用前肉眼比对当前 dashboard） | — | 封面/补帧/定格放大 |
| 旧旁白（仅参考勿用） | `artifacts/video/demo-voiceover.{txt,m4a,aiff}` | — | 文案对不上新脚本，须按 VIDEO_SCRIPT.md 重生成 |

重录命令（VIDEO_SCRIPT.md 末尾）：`npm run record` 产 `dashboard-walkthrough.{webm,mp4}` + 分段 PNG，可设 `VIEWPORT_WIDTH/HEIGHT=1920/1080`、`DASHBOARD_URL`、`HEADLESS=0`；`npm run record:screens` 仅出图。录前可选 `npm run demo` 刷新链上数据。

---

## 6. 红线（逐条照搬项目红线，违反即毁提交）

密钥/登录态 — 画面/字幕/旁白绝不出现：
- [ ] `.env`、`.env.generated`
- [ ] 助记词 / 私钥 / 钱包密码
- [ ] API key、登录态
- [ ] 含密钥的终端回滚、MetaMask 助记词生成器（即使缩小也不行）、VSCode/源码、terminal 输出
- [ ] 录制全程关闭 MetaMask；Mantlescan 链接预先在新标签页打开避免加载白屏录进密钥页

措辞不夸大 — 必须诚实：
- [ ] 不说「盈利交易 / alpha 收益」——这是 agent 钱包经济，不是赚钱机器人
- [ ] 不说 Byreal 已在 Mantle 上执行——实际是 RealClaw CLI 能力 + 池子探针；链上执行在 Mantle Sepolia
- [ ] 不暗示掌管主网真实资金——全程测试网，金额 0.01 MNT
- [ ] WMNT wrap 是测试网真实动作可展示，但必须说清是 Mantle Sepolia 测试网（tx 页本身有红色 testnet 横幅，是利好证据，可保留入镜）
- [ ] 合约编译器一律说 0.8.35，不照念脚本旧标 0.8.26（与链上 verified 版本不符，评委对照源码会抓）

secret handoff（来自 TEAM_HANDOFF.md）：私钥/助记词/API key/钱包密码绝不进 GitHub/DoraHacks/公开频道/AI 聊天/截图/视频/README。控制真实资金的 secret 一律不分享，用全新限额钱包或多签。

---

## 7. 验收清单（导出后照做，全打勾才算过）

前置：所有命令在本机 ffmpeg/ffprobe 8.0.1（`/opt/homebrew/bin/`）实测通过。先设变量：

```bash
F="artifacts/video/final/final-video.mp4"   # 改成你的成片路径
REPO="/Users/yuchenxu/Desktop/mantle-hackathon"
```

实测踩坑（直接支撑硬约束）：仓库底片 `dashboard-walkthrough.mp4` 实测 1600×900/25fps 且无音频流，三项全挂；baseline `agentic-wallet-treasury-demo.mp4` 实测音频 44.1k + 尾部 4.36s 静音——证明「只看剪映时间线/导出界面不够，必须 ffprobe 核实成片」。剪映选 MP4 ≠ 编码是 H.264（MP4 是容器，可能是 HEVC），判定靠 `codec_name`+`codec_tag_string`。

### 7.0 权威转码 / 重封装命令（先于验收，把硬指标落进 flags）

HEVC→H.264 完整转码（把 §2.1 全部编码硬约束一次落地，已实测产出 avc1/High/yuv420p/2 B 帧/48k/moov 前置）：

```bash
ffmpeg -i IN.mp4 \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -bf 2 -g 60 -keyint_min 60 -sc_threshold 0 \
  -b:v 8M -maxrate 12M -bufsize 16M \
  -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart OUT.mp4
```

各 flag 对应哪条硬指标：`libx264`+`-profile:v high`=H.264 High Profile；`-pix_fmt yuv420p`=4:2:0；`-bf 2`=2 连续 B 帧；`-g 60 -keyint_min 60 -sc_threshold 0`=Closed GOP（30fps 下每 2s 一关键帧，关掉场景切换额外 I 帧）；`-b:v 8M -maxrate 12M`=1080p 标准帧率 8 / 高帧率 12 的码率带；`-c:a aac -ar 48000 -b:a 192k`=AAC-LC 48k 192kbps；`-movflags +faststart`=moov 前置。需 4K 把 `-b:v` 提到 35–45M。

44.1k→48k 重封装（baseline 专用：视频已是合规 H.264，不重编码，只换音频采样率，速度快很多）：

```bash
ffmpeg -i "$F" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  artifacts/video/final/final-video-48k.mp4
```

注：`-c:v copy` 直拷视频流，避免二次压缩掉画质；只有视频本身不合规（HEVC/分辨率错）才用上面的全转码。

### 7.1 ffprobe 技术规格（含码率 / B 帧 / GOP / pix_fmt / faststart 复核）

脚本参数提到顶部，主版默认值如下；竖版把 `WANT_W/WANT_H` 对调、`DUR_MIN/DUR_MAX` 改 `10/60`：

```bash
F="artifacts/video/final/final-video.mp4"
WANT_W=1920; WANT_H=1080            # 竖版: WANT_W=1080; WANT_H=1920
FPS_OK="30.00 29.97"                # 允许的帧率(小数)
DUR_HARD=120                        # 部署奖硬门槛，低于即 FAIL
DUR_MIN=150; DUR_MAX=180            # 目标区间，超出仅 WARN；竖版 10/60
VBR_MIN=8000000                     # 含可读小字交付的码率下限 8Mbps
```

一条命令打出视频流关键字段（人工先扫一眼）：

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,codec_tag_string,profile,width,height,r_frame_rate,avg_frame_rate,pix_fmt,has_b_frames,bit_rate \
  -of default=nw=1 "$F"
```

帧率换算成小数：

```bash
ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 \
  -show_entries stream=r_frame_rate "$F" | awk -F/ '{printf "%.3f\n", $1/$2}'
```

faststart 校验（moov 偏移须早于 mdat；实测 baseline moov=40 < mdat=194598 通过）：

```bash
ffmpeg -v trace -i "$F" 2>&1 | grep -m2 -nE "type:'moov'|type:'mdat'"
# 看输出里 moov 那行的字节偏移 < mdat 那行 → faststart 已开；反之未开，重导加 -movflags +faststart
```

一把梭自动判定（退出码 0=通过，bash 3.2 兼容；48k 与时长<120 升为 FAIL，码率/B帧/pix_fmt 纳入检查）：

```bash
fail=0
vcodec=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=codec_name "$F")
vtag=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=codec_tag_string "$F")
prof=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=profile "$F")
pf=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=pix_fmt "$F")
bframes=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=has_b_frames "$F")
w=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=width "$F")
h=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=height "$F")
fps=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=r_frame_rate "$F" | awk -F/ '{printf "%.2f",$1/$2}')
vbr=$(ffprobe -v error -select_streams v:0 -of default=nw=1:nk=1 -show_entries stream=bit_rate "$F")
[ -n "$vbr" ] && [ "$vbr" != "N/A" ] || vbr=$(ffprobe -v error -of default=nw=1:nk=1 -show_entries format=bit_rate "$F")   # 部分容器视频流无 bit_rate，退回 format
acodec=$(ffprobe -v error -select_streams a:0 -of default=nw=1:nk=1 -show_entries stream=codec_name "$F")
asr=$(ffprobe -v error -select_streams a:0 -of default=nw=1:nk=1 -show_entries stream=sample_rate "$F")
ach=$(ffprobe -v error -select_streams a:0 -of default=nw=1:nk=1 -show_entries stream=channels "$F")
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | cut -d. -f1)
[ "$vcodec" = "h264" ] || { echo "FAIL video codec=$vcodec (need h264)"; fail=1; }
case "$vtag" in hvc1|hev1|hvc*|hev*) echo "FAIL codec_tag=$vtag = HEVC, not H.264"; fail=1;; esac
echo "$prof" | grep -qi "High" || echo "WARN profile=$prof (want High)"
[ "$pf" = "yuv420p" ] || { echo "FAIL pix_fmt=$pf (need yuv420p / 4:2:0)"; fail=1; }
[ "$bframes" -ge 1 ] 2>/dev/null || echo "WARN has_b_frames=$bframes (want >=1，理想 2 连续B帧；精确连续数需 -show_frames 看 pict_type=B)"
[ "$w" = "$WANT_W" ] && [ "$h" = "$WANT_H" ] || { echo "FAIL resolution=${w}x${h} (need ${WANT_W}x${WANT_H})"; fail=1; }
echo "$FPS_OK" | grep -qw "$fps" || { echo "FAIL fps=$fps (need one of: $FPS_OK)"; fail=1; }
awk "BEGIN{exit !($vbr>=$VBR_MIN)}" && : || echo "WARN video bit_rate=$vbr (<$VBR_MIN; 含 tx hash/地址等小字的交付应 >=8Mbps，否则二次压缩易糊)"
[ "$acodec" = "aac" ] || { echo "FAIL audio codec=$acodec (need aac)"; fail=1; }
[ "$asr" = "48000" ] || { echo "FAIL sample_rate=$asr (need 48000)"; fail=1; }
[ "$ach" = "2" ] || echo "WARN channels=$ach (want stereo=2)"
[ "$dur" -ge "$DUR_HARD" ] || { echo "FAIL duration=${dur}s <${DUR_HARD}s 不达部署底线"; fail=1; }
[ "$dur" -ge "$DUR_MIN" ] && [ "$dur" -le "$DUR_MAX" ] || echo "WARN duration=${dur}s (目标 ${DUR_MIN}-${DUR_MAX})"
[ "$fail" = 0 ] && echo "PASS ffprobe spec check"
```

判定清单（竖版改顶部变量）：
- [ ] `codec_name=h264` 且 `codec_tag_string=avc1`（出现 hvc1/hev1 不合格）
- [ ] `profile=High`、`pix_fmt=yuv420p`、`has_b_frames>=1`（理想 2，精确连续 B 帧数用 `ffprobe -show_frames -select_streams v:0 -show_entries frame=pict_type` 数 B 段）
- [ ] `width/height` 匹配目标画幅
- [ ] 帧率换算 ∈{30.000, 29.97}（29.97 需明确记录）
- [ ] 视频/format 码率 ≥8 Mbps（含可读小字时；纯动效片可放宽，但 2.1 Mbps 这种偏低值不许直交含小字段落，见 §1.1）
- [ ] faststart：moov 偏移 < mdat 偏移
- [ ] 存在 aac 音频流，sample_rate=48000、stereo
- [ ] 时长 ≥120s（硬门槛），目标 150–180s

### 7.2 抽帧检查（黑帧 / 尾部空画面 / 异常静音）

全片黑帧（任何输出人工看一眼）：

```bash
ffmpeg -hide_banner -nostats -i "$F" -vf "blackdetect=d=0.1:pix_th=0.10" -an -f null - 2>&1 | grep blackdetect
```

尾部空画面 / 尾部静音（baseline 实测就有 4.36s 尾静音，只看时间线发现不了）：

```bash
ffmpeg -hide_banner -nostats -y -sseof -0.5 -i "$F" -frames:v 1 /tmp/tailframe.png   # 人眼确认尾帧非纯黑
ffmpeg -hide_banner -nostats -sseof -3 -i "$F" -vf "blackdetect=d=0.05:pix_th=0.10" -an -f null - 2>&1 | grep blackdetect
ffmpeg -hide_banner -nostats -i "$F" -af "silencedetect=n=-40dB:d=1.5" -f null - 2>&1 | grep silence_   # 看尾部是否出现 silence_start 接近片长
```

Contact sheet（每 10s 抽 1 帧拼 4×4，整片一眼扫）：

```bash
ffmpeg -hide_banner -nostats -y -i "$F" -vf "fps=1/10,scale=480:-1,tile=4x4" -frames:v 1 /tmp/contactsheet.png
```

- [ ] 全片无异常黑帧
- [ ] 尾部不空画面/黑屏，尾部无贴近片长的长静音（baseline 须先裁掉 174.6s 后那段）
- [ ] contact sheet 整片扫过无空镜/错位
- [ ] 旁白时段无 ≥1.5s 长静音

阈值边界：`pix_th`/`silencedetect n` 是按本项目浅色 dashboard 调的，深色/转场多的素材需放宽阈值避免误报。

### 7.3 音频响度归一（两遍 loudnorm，目标 −14 LUFS；本项目低 LRA 会回退 Dynamic）

第一遍 measure：

```bash
ffmpeg -hide_banner -i "$F" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | tail -16
```

linear vs dynamic 的真实坑（实测）：baseline measure 出 `input_lra=2.10`、`input_i=-17.19`、`input_tp=-3.81`，第二遍即使写 `linear=true`，ffmpeg 也会因 measured_LRA(2.1) 远小于 target LRA(11) 而**静默回退 `normalization_type:dynamic`**——拿不到承诺的线性、动态被改、不可逐字节复现（直接影响 §7.6 幂等）。口播/窄 LRA 素材的稳妥做法：把 apply 的 `LRA` 设成接近或不低于 measured 值（口播常见设 7，或直接填 measured_LRA），别死写 11 还指望 linear。LRA=11 只是上限/参考。最终以「验收重测 input_i 回到 −14±1」为准，不假定一定 linear。

最易抄错的点 — measure 的 JSON 键 ≠ 第二遍参数名，映射：`input_i→measured_I`、`input_tp→measured_TP`、`input_lra→measured_LRA`、`input_thresh→measured_thresh`、`target_offset→offset`。

第二遍 apply（把 `<...>` 换成第一遍实测值；`LRA` 取接近 measured 的值如 7；仅当源音频 channels=1 时才加 `dual_mono=true`——baseline 已是 stereo，不要加；顺带把采样率统一 48k）：

```bash
ffmpeg -hide_banner -y -i "$F" \
  -af loudnorm=I=-14:TP=-1:LRA=7:measured_I=<input_i>:measured_TP=<input_tp>:measured_LRA=<input_lra>:measured_thresh=<input_thresh>:offset=<target_offset>:print_format=summary \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  artifacts/video/final/final-video-normalized.mp4
```

验收归一结果（重新 measure，确认 input_i 回到 −14±1、TP ≤ −1）：

```bash
ffmpeg -hide_banner -i artifacts/video/final/final-video-normalized.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | tail -16
```

- [ ] 第一遍 input_i 在 −14±1 LUFS，否则做归一（别只查静音——`silencedetect` 只告诉「有没有声音」不告诉「响度对不对」，baseline 实测 input_i=−17.19 偏轻）
- [ ] 归一后重测 input_i 回到 −14±1，TP ≤ −1
- [ ] 看 summary/json 的 `normalization_type`：若为 dynamic 且需要逐字节复现，按上面把 LRA 调到接近 measured 再跑，或在 §7.6 诚实标注「dynamic，非逐字节可复现」

口径边界：−14 LUFS 是短视频平台主流值（TikTok/抖音/Reels/Shorts），AES/EBU 广播标准是 −16；本 SOP 按投放取 −14/TP=−1。改投 YouTube 长视频 TP 可放宽 −1.5。

### 7.4 字幕安全区与平台 UI 遮挡

横屏 16:9（投 DoraHacks，无平台 UI）：
- [ ] 字幕底部居中，下边距 1080p 下 75–108px（画面高 7%–10%），字号 ≥36px（手机能看清）
- [ ] 关键数据（tx hash / 合约地址 / `+0.01 WMNT` / `92/100`）放中上区，别压最底部

竖屏 9:16 / 1080×1920（投抖音/TikTok，必须把平台 UI 算进遮挡区，2026 实测经验值）：
- [ ] 顶部 ~200px（用户名/声音标签/刘海）、右侧 120–164px（点赞/评论/分享按钮列）、底部 ~324px（文案/作者/CTA）一律不放字幕和关键数据
- [ ] 内容居中放 x∈[60,960]、y∈[200,1600]（保守 900×1442 居中框），字幕左右各留 ≥150px padding，竖向位置比 Reels 更高

抽查（不能只看第一条，开头/中段/尾段各抽一帧；竖版可叠 drawbox 红框比对）：

```bash
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | cut -d. -f1)
ffmpeg -hide_banner -y -ss 5          -i "$F" -frames:v 1 /tmp/sub_head.png
ffmpeg -hide_banner -y -ss $((DUR/2)) -i "$F" -frames:v 1 /tmp/sub_mid.png
ffmpeg -hide_banner -y -ss $((DUR-5)) -i "$F" -frames:v 1 /tmp/sub_tail.png
ffmpeg -hide_banner -y -ss $((DUR/2)) -i "$F" \
  -vf "drawbox=x=0:y=0:w=iw:h=200:color=red@0.4:t=fill,drawbox=x=iw-164:y=0:w=164:h=ih:color=red@0.4:t=fill,drawbox=x=0:y=ih-324:w=iw:h=324:color=red@0.4:t=fill" \
  -frames:v 1 /tmp/sub_safezone_overlay.png
```

竖屏像素是 2026 多家工具经验值，随文案长度/机型浮动，给的是保守区间，最终须真机/平台预览肉眼复核——这步 GUI 兜底无法用命令替代。

### 7.5 字幕校对（逐句对脚本）

剪映「识别字幕」是自动 ASR，专有名词机器常错。必须逐句对照 `VIDEO_SCRIPT.md` 校对。grep 扫 SRT 专名出现次数兜底（只能发现「漏词/拼错到识别不出」，听成相近词如 Byreal→by real 它发现不了，必须人工逐句对脚本）：

```bash
SRT="artifacts/video/final/final.srt"
for kw in "ERC-8004" "Sourcify" "WMNT" "x402" "EIP-712" "Mantle Sepolia" "AgenticTreasury" "ValidatorPaymaster" "Byreal" "RealClaw" "0.8.35"; do
  n=$(grep -c -- "$kw" "$SRT" 2>/dev/null || echo 0)
  printf "%-22s %s\n" "$kw" "$n"
done
```

- [ ] 逐句对照脚本校对完成，专名 `ERC-8004`/`Sourcify`/`WMNT`/`x402`/`EIP-712`/`Mantle Sepolia`/`AgenticTreasury`/`ValidatorPaymaster`/`Byreal`/`RealClaw`/`+0.01 WMNT`/`92/100` 无错
- [ ] 若旁白提到编译器，是 `0.8.35` 不是 0.8.26
- [ ] grep 出现次数明显偏少/为 0 的去字幕里找被听错的拼写

### 7.6 幂等性（同输入→同成片）

纯 GUI 手剪无法保证幂等（重做参数会漂）。能保证幂等的是脚本管线（底片 `npm run record` 生成、转码/重封装/归一/烧字幕全走 §7.0 + 本章 ffmpeg 命令）。每次导出连同成片记录环境+命令+参数：

```bash
{
  echo "## build $(date -u +%FT%TZ)"
  echo "ffmpeg: $(ffmpeg -version | head -1)"
  echo "src: $F  sha256: $(shasum -a 256 "$F" | awk '{print $1}')"
  echo "out sha256: $(shasum -a 256 artifacts/video/final/final-video.mp4 | awk '{print $1}')"
  echo "git: $(git -C "$REPO" rev-parse --short HEAD)"
  echo "loudnorm measured: input_i=... input_tp=... input_lra=... normalization_type=... (粘第一遍 JSON)"
  echo "export params: 1920x1080 30fps H.264 avc1 yuv420p bf2 g60 AAC48k 8-12Mbps +faststart"
} >> artifacts/video/final/BUILD_LOG.md
```

- [ ] BUILD_LOG.md 记录 ffmpeg 版本 + 源/成片 sha256 + git commit + loudnorm 实测值（含 normalization_type）+ 导出参数
- [ ] 两次同输入跑出成片 sha256 一致才算幂等达标；若 loudnorm 回退 dynamic 或用了 GUI 手剪，诚实标注「不可逐字节复现」并保存工程草稿文件

幂等是本任务最硬局限：纯剪映手剪给不了逐字节可复现；即便走 ffmpeg，loudnorm 在低 LRA 素材回退 dynamic 时也不保证逐字节一致（见 §7.3）。真要严格幂等须把转码/重封装/归一/烧字幕全迁到 ffmpeg 脚本管线，且 loudnorm 参数固定到能稳定走 linear。

### 7.7 红线复检（与第 6 章对应，抽帧后再过一遍）

- [ ] 抽出的所有帧与字幕中无 `.env`/助记词/私钥/API key/钱包密码/localhost 地址栏
- [ ] 措辞无「盈利交易 / Byreal 已在 Mantle 执行 / 掌管主网资金」等夸大；测试网动作均标注 Mantle Sepolia
- [ ] 编译器口径为 0.8.35（无 0.8.26 残留）

### 7.8 核心用例覆盖复检

- [ ] 5 个 ERC-8004 agent + 1 笔执行 tx + 1 笔 x402 支付 + 1 笔验证(92/100) + 1 笔 WMNT DeFi 动作(0.01 MNT) + Sourcify/Mantlescan 验证绿章 全覆盖
- [ ] 至少点开一个 Mantlescan tx/合约页做可独立核验
- [ ] 展示公开 dashboard（或本地录制但已裁掉/不特写 localhost 地址栏）
- [ ] 前 3 秒有钩子（hero 大字 + 1–2 个关键数字如 5 agents / 92/100）
- [ ] 结尾给出 GitHub 仓库 + dashboard URL
- [ ] 成片放 `artifacts/video/final/`，回报录制路线（A 公开站 / B 本地）+ 最终时长 + 导出参数

---

## 8. 与 VIDEO_SCRIPT.md / VIDEO_PRODUCTION_BRIEF.md 的关系

三份文档分工不重复：

| 文档 | 性质 | 内容 | 寿命 |
|---|---|---|---|
| 本 SOP | 可复用规格 + 硬约束 | 编码/响度/帧率硬指标、转码/重封装/校验命令、Anthropic 对标、代码管线、能力边界、验收 | 跨这一支及同类 Mantle demo 长期复用 |
| `VIDEO_SCRIPT.md` | 这一支的逐句脚本 | 逐段时间轴 + 旁白原文 + 每段「Show 什么」 + 录制 checklist + `npm run record` | 这支片专用，内容更新就改它 |
| `VIDEO_PRODUCTION_BRIEF.md` | 这一支的一次性 brief | 给执行方（Codex/剪辑 agent）的录制路线选择、现成素材表、剪映操作清单、交付验收 | 一次性，做完即归档 |

衔接方式：
- 做新一支同类 demo → 先读本 SOP 拿规格和验收，再写一份新的逐句 script（仿 `VIDEO_SCRIPT.md`）和一次性 brief（仿 `VIDEO_PRODUCTION_BRIEF.md`）
- 做现在这一支 → 本 SOP 第 5 章是落地参数，旁白逐字与精确时间码以 `VIDEO_SCRIPT.md` 为准，录制路线/素材以 `VIDEO_PRODUCTION_BRIEF.md` 为准
- 三者冲突时优先级：硬指标/红线/验收以本 SOP 为准（已纠正 brief 里「码率 16-20」「帧率 24-30 随便」「Sourcify 25 条事件」等说法，并补上 True Peak、转码/faststart 命令、编译器 0.8.35）；逐句旁白与「Show 什么」、精确秒数以 `VIDEO_SCRIPT.md` 为准；不照旧版 `strategy/06-demo-storyboard.md`

时间轴权威源更正：旧稿写「时间轴以 VIDEO_SCRIPT.md + TEAM_HANDOFF §2 为准」，但 `TEAM_HANDOFF.md` §2 并无分钟级时间轴，真正权威是 `VIDEO_SCRIPT.md` 的段头。§5.1 已改为复制 `VIDEO_SCRIPT.md` 实际段头的粗略分镜，精确到秒回脚本对齐。

本 SOP 对 brief 的修正需执行方知道：brief §4 写「码率 ~10 Mbps」可保留但 YouTube 官方推荐 1080p 仅 8 Mbps（高帧率 12），且含可读小字一律 ≥8 Mbps；brief 没提 True Peak ≤ −1 dBTP，本 SOP 补上为硬指标；HEVC→H.264 转码、faststart 校验、44.1k→48k 重封装命令本 SOP §7.0 已给齐；编译器一律 0.8.35。

---

附：本 SOP 落地相关文件（绝对路径）
- 逐句脚本：`/Users/yuchenxu/Desktop/mantle-hackathon/VIDEO_SCRIPT.md`（L79 编译器旧标 0.8.26 待 owner 改为 0.8.35）
- 一次性 brief：`/Users/yuchenxu/Desktop/mantle-hackathon/VIDEO_PRODUCTION_BRIEF.md`
- 权威时间轴 + 红线：`/Users/yuchenxu/Desktop/mantle-hackathon/TEAM_HANDOFF.md`（§5 红线；§2 无分钟级时间轴，时间码看 VIDEO_SCRIPT.md）
- 证据报告：`/Users/yuchenxu/Desktop/mantle-hackathon/SUBMISSION_HASHES.md`（两合约 solc 0.8.35、chainId 5003、canonical 执行 tx 0xf7d2c2fa…）
- baseline 成片（视频合规/音频 44.1k+尾静音，须修后交付）：`/Users/yuchenxu/Desktop/mantle-hackathon/artifacts/video/final/agentic-wallet-treasury-demo.mp4`
- 无声底片 B-roll（1600×900/25fps/无音频）：`/Users/yuchenxu/Desktop/mantle-hackathon/artifacts/video/dashboard-walkthrough.mp4`
- HEVC 版（须 §7.0 转码）：`/Users/yuchenxu/Desktop/mantle-hackathon/artifacts/video/final/agentic-wallet-treasury-demo-final.mp4`
- proof 截图：`/Users/yuchenxu/Desktop/mantle-hackathon/artifacts/video/final/work/proof/`
- 旧版 storyboard（勿照录）：`/Users/yuchenxu/Desktop/mantle-hackathon/strategy/06-demo-storyboard.md`
