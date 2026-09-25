---
name: make-video
description: 把用户给的文案(或只给一个股票/公司/主题)做成竖屏投研讲解成片。用户说"做视频""出片""用这段文案做个视频""做一期XX的视频"时使用。流程: 研究(可选) → 写 projects/<slug>/script.json → 体检 → run.sh 出片 → 抽帧目视验收 → 提交推送。
---

# 给文案 → 出片

全流程跑在云端也能跑在本机。代码都在仓库里，你只需要**写一个 JSON**，然后跑一条命令。

## 0. 先确认环境（每个会话一次）

```bash
./scripts/cloud/doctor.sh
```
- 工具有 ✗ → 跑 `./scripts/cloud/setup.sh`
- `speech.platform.bing.com` 被拦 → 配音只能用 `TTS_ENGINE=espeak`（机械音）或 `silent` 出**排版预览**，
  必须告诉用户：在环境设置 → Network access 里放行这个域名，才能出可发布的成片
- 素材域名被拦 / 没有 key → 该段自动退回代码背景，不影响出片；告诉用户哪些段没有实拍素材

## 1. 判断输入

| 用户给了什么 | 你做什么 |
|---|---|
| 完整文案 | 直接进第 2 步。**不改用户的观点和数字**，只做拆句、配画面；文案里的数字要能找到来源，找不到就问用户或标注 |
| 只给股票/公司/主题 | 先用 `hot-topics` skill 找热点钩子 + 基本面数据，写 `projects/<slug>/research.md`，再按"推荐结构"写文案 |
| 给了参考视频链接 | 只借鉴结构和节奏，不搬运文案和画面 |

## 2. 写 `projects/<slug>/script.json`

slug 用英文短横线（如 `cambricon-fundamentals`）。完整示例: `projects/cambricon-fundamentals/script.json`（照抄结构）。

```jsonc
{
 "title": "封面标题", "brand": "投研笔记", "tag": "基本面拆解 · 688256",
 "disclaimer": "个人观点 · 仅供参考 · 不构成投资建议",          // 必填
 "voice": {"edge": "zh-CN-YunyangNeural", "rate": "+8%"},
 "style": {"accent": "#FFC83D"},
 "sources": [{"id": "fy25", "title": "XX 2025年年报", "url": "https://..."}],
 "segments": [
  {"id": "hook",
   "visual": {...},                                  // 这一段的画面卡片, 见下表
   "media": {"query": "chip factory", "kind": "video", "label": "资料画面"},   // 可选: 背景实拍
   "lines": [{"t": "字幕文本", "hl": ["关键词"], "tts": "可选:读音修正"}, ...]}
 ]
}
```

### visual 类型（每段选一个）

| type | 用途 | 字段 |
|---|---|---|
| `title` | 开头封面（第 0 帧即完整封面） | `kicker` `headline`(可用 `\n` 换行) `sub` |
| `news` | 热点事件钩子 | `outlet` `date` `headline` `sub` `source`(必填) |
| `numbers` | 1–4 个关键指标 | `title` `items:[{label,value,unit,delta}]` `source`(必填) `asof` |
| `bars` | 营收/利润等年度对比，负数自动画绿柱 | `title` `unit` `series:[{name,data:[[标签,数值]]}]` `note` `source`(必填) `asof` |
| `line` | 走势 | 同 bars |
| `compare` | 多空/新旧/两家公司对比 | `title` `left:{title,points}` `right:{title,points}` |
| `point` | 金句/结论 | `text` `sub` |
| `poll` | 结尾选项式评论引导（比"评论区聊聊"更容易让人留言） | `question` `options`(2–4 个) `reply`(评论框打字示范) |
| `media` | 纯实拍背景 + 大字幕 | 无（配合 `media` 字段） |

### media（背景实拍/实物）
- `{"file": "assets/x.mp4"}` 用户上传的素材（放 `projects/<slug>/assets/`），最优先
- `{"url": "...", "credit": "作者 / 来源", "license": "CC BY-SA 4.0", "source": "页面链接"}` 你找到的具体图片（Wikimedia 等，许可必须允许商用/转载）
- `{"query": "英文关键词", "kind": "video"|"photo"}` 自动搜 Pexels → Pixabay → Wikimedia
- `label`: `实拍`（真是该公司/事件的画面）/ `资料画面`（相关但非本事件）/ `示意`（泛化画面）。**不许把泛化画面标成实拍**
- 公司/人物照片优先 Wikimedia（真实），氛围 B-roll 用 Pexels/Pixabay 视频（英文关键词效果最好）

### 写文案的规则
- 每句 ≤ 16 字最好（>22 字 lint 会警告），一句一个信息点
- 阿拉伯数字年份/金额加 `tts` 读法（"2025年" → "二零二五年"），否则可能读成"两千零二十五"
- `hl` 只放句子里原样出现的词
- 数字画面一律写 `source` + `asof`；数字必须来自 `sources` 里能打开的链接
- 禁用承诺收益/荐股用语（lint 会拦），结尾不给买卖建议

### 推荐结构（基本面向，45–75 秒）
1. `title` 钩子：一个反常识问题或最新数字（前 3 秒）
2. `news` 热点：最近 1–2 周的真实事件，带日期来源
3. `bars`/`line` 基本面：营收、利润、毛利率的趋势（2–3 段）
4. `numbers` 质量：扣非、现金流、毛利率、估值
5. `compare` 风险：积极面 vs 要盯的风险（必须有风险段）
6. `point` 结论 → `poll` 选项式提问引导评论（不给买卖建议）
技术面（K线/量价）可作为第 5 段后的"确认"补充，不做主线。

更多手法（第 0 帧封面、3 秒钩子、推镜、音效等）和踩坑记录见 `docs/09-复盘视频经验总结.md`。

## 3. 出片

```bash
./.venv/bin/python scripts/studio/lint.py projects/<slug>/script.json   # 先体检, 0 错误再继续
./scripts/studio/run.sh <slug>                                         # 成片 → output/<slug>.mp4
```
配音不通时: `TTS_ENGINE=silent ./scripts/studio/run.sh <slug>` 出排版预览（成片会带警告）。
只改画面: `SKIP_VO=1`；只改素材以外: `SKIP_MEDIA=1`。

## 4. 验收（必须做，不能只看命令成功）
- run.sh 最后一步输出"验收通过"（h264 1080×1920 30fps / aac 48k / 时长对齐 / -14 LUFS）
- 用 Read 看 `projects/<slug>/build/check-*.png` 四张抽帧：封面完整、字不出框、卡片不挡字幕、素材角标和署名在
- 数字抽查：画面上的数和 sources 里的原文一致

## 5. 交付
- 提交 `projects/<slug>/`（script.json、research.md、assets）+ `remotion/public/studio/<slug>/`（props/timing/manifest/字体/mix.mp3/media）+ `output/<slug>.mp4`
- 用 SendUserFile 把 mp4 发给用户，并列出：配音引擎、哪些段用了实拍素材（来源/许可）、哪些段退回代码背景、数据来源
- 配音引擎不是 edge/kokoro 时，明确说"这是排版预览，不能发布"
