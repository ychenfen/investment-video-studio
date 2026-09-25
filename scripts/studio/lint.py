#!/usr/bin/env python3
"""通用讲解视频 · 文案体检 (结构 + 合规 + 可追溯)

硬错误(exit 1): 结构不对 / 数据类画面没标来源 / 出现承诺收益类用语 / 缺免责声明
警告: 单句过长(字幕放不下) / 热点卡片没日期 / 敏感但可用的词
用法: python3 lint.py projects/<slug>/script.json
"""
import json, re, sys

p = sys.argv[1]
cfg = json.load(open(p, encoding="utf8"))
err, warn = [], []
VIS = {"title", "news", "numbers", "bars", "line", "compare", "point", "poll", "media"}
DATA_VIS = {"numbers", "bars", "line"}
# 承诺收益 / 荐股 / 内幕 —— 直接判错
BAN = ["稳赚", "必涨", "保证收益", "保本", "无风险", "翻倍股", "内幕", "带你赚钱", "跟我买", "推荐买入",
       "明天必", "一定涨", "闭眼买", "满仓干", "目标价", "包赚"]
# 能说但要小心 —— 警告
CARE = ["抄底", "满仓", "牛股", "妖股", "暴涨", "起飞", "财富自由", "龙头"]

src_ids = {s.get("id") for s in cfg.get("sources", [])}
for s in cfg.get("sources", []):
    if not s.get("url") and not s.get("title"):
        err.append(f'sources.{s.get("id")}: 至少要有 title 或 url')

for k in ("title", "segments"):
    if k not in cfg:
        err.append(f"缺少顶层字段 {k}")
if not cfg.get("disclaimer"):
    err.append("缺少 disclaimer(例: 个人观点, 仅供参考, 不构成投资建议)")

seen = set()
for sg in cfg.get("segments", []):
    sid = sg.get("id", "?")
    if sid in seen:
        err.append(f"segment id 重复: {sid}")
    seen.add(sid)
    v = sg.get("visual", {"type": "media"})
    t = v.get("type")
    if t not in VIS:
        err.append(f"{sid}: visual.type={t} 不认识, 可选 {sorted(VIS)}")
    if t in DATA_VIS:
        if v.get("source") not in src_ids:
            err.append(f"{sid}: {t} 是数据画面, visual.source 必须指向 sources 里的 id (现在是 {v.get('source')})")
        if not v.get("asof"):
            warn.append(f"{sid}: 数据画面建议写 asof(数据截至日期/报告期)")
    if t in ("bars", "line"):
        ser = v.get("series") or []
        if not ser or not all(s.get("data") for s in ser):
            err.append(f"{sid}: {t} 需要 series[].data = [[标签, 数值], ...]")
    if t == "numbers" and not v.get("items"):
        err.append(f"{sid}: numbers 需要 items")
    if t == "news":
        if v.get("source") not in src_ids:
            err.append(f"{sid}: 热点卡片必须有 source(指向 sources 的 id)")
        if not v.get("date"):
            warn.append(f"{sid}: 热点卡片建议写 date, 过期热点要删")
    if t == "poll" and not (v.get("question") and 2 <= len(v.get("options") or []) <= 4):
        err.append(f"{sid}: poll 需要 question + 2~4 个 options")
    if not sg.get("lines"):
        err.append(f"{sid}: lines 为空")
    for ln in sg.get("lines", []):
        txt = ln.get("t", "")
        n = len(re.sub(r"[，。？！、：；,.?!\s]", "", txt))
        if n > 22:
            warn.append(f"{sid}: 句子 {n} 字偏长, 字幕会换两行以上, 建议拆句: {txt}")
        for h in ln.get("hl", []):
            if h not in txt:
                err.append(f"{sid}: 高亮词「{h}」不在句子里: {txt}")

blob = json.dumps(cfg, ensure_ascii=False)
for w in BAN:
    if w in blob:
        err.append(f"合规: 出现禁用语「{w}」")
for w in CARE:
    if w in blob:
        warn.append(f"合规: 出现敏感词「{w}」, 确认语境不是荐股/承诺收益")

for w in warn:
    print("WARN ", w)
for e in err:
    print("ERROR", e)
print(f"体检: {len(err)} 个错误, {len(warn)} 个警告 ({p})")
sys.exit(1 if err else 0)
