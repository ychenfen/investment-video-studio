# 投研视频工作台 · Claude 工作说明

这个仓库用代码生成竖屏投研短视频（Remotion + TTS + 真实数据），不用剪映。云端和本机都能跑。

## 用户说"做视频"时

- **给了文案** → 用 `make-video` skill：写 `projects/<slug>/script.json` → `./scripts/studio/run.sh <slug>` → 验收 → 交付
- **只给主题/股票，或要找热点** → 先用 `hot-topics` skill 研究（WebSearch），写 `projects/<slug>/research.md`，再 `make-video`
- **要改"小于&阿本"剧情复盘片** → 旧管线 `scripts/fupan/`（见 docs/06），场景写死在 build.mjs，不适合新题材

内容方向：以**基本面 + 热点事件**为主线，技术面只做补充确认。

## 目录

| 路径 | 作用 |
|---|---|
| `scripts/studio/` | 通用"文案→成片"管线：lint / vo / media / props / run / check |
| `remotion/src/studio/Explainer.tsx` | 通用讲解组件（title/news/numbers/bars/line/compare/point/media 八种画面） |
| `projects/<slug>/` | 每支视频一个目录：script.json(唯一输入) · research.md · assets/(用户素材) · build/(中间产物, 不提交) |
| `remotion/public/studio/<slug>/` | 生成物：props/timing/manifest/字体子集/mix.mp3/media |
| `output/` | 成片 |
| `scripts/cloud/` | 云端环境：setup.sh(SessionStart 自动跑) / doctor.sh(体检) |
| `docs/08-云端工作流.md` | 云端工作流、网络白名单、密钥 |

## 命令

```bash
./scripts/cloud/doctor.sh                               # 环境 + 网络体检
./.venv/bin/python scripts/studio/lint.py projects/<slug>/script.json
./scripts/studio/run.sh <slug>                          # 全流程
TTS_ENGINE=silent ./scripts/studio/run.sh <slug>        # 配音服务不通时的排版预览
cd remotion && npx tsc --noEmit                         # 改组件后类型检查
```

## 规则

- 数字必须有来源（script.json 的 `sources` + 画面 `source`/`asof`），不编数据；lint 0 错误才能渲染
- 不写承诺收益/荐股用语；每支片带免责声明；结尾引导评论，不给买卖建议
- 素材标签如实：`实拍` 只用于该公司/事件本身的画面，泛化画面标 `资料画面`/`示意`；记录作者和许可
- 配音引擎是 espeak/silent 的成片只能叫"排版预览"，不能说成可发布
- 出片后必须用 Read 看 `projects/<slug>/build/check-*.png` 抽帧，不能只凭命令退出码说"完成"
- 云端渲染用 `/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell`（run.sh 自动找）；不要下载 Chrome
- npm 安装用 `--registry=https://registry.npmjs.org/ --replace-registry-host=registry.npmmirror.com`（锁文件是 npmmirror 地址，云端被拦）
