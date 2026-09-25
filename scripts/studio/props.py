#!/usr/bin/env python3
"""通用讲解视频 · 合成 Remotion props + 字体子集

script.json + timing.json + manifest.json → <public>/props.json (Explainer 组件的唯一输入)
再按实际用字给思源黑体做子集 → <public>/fonts/hs-{500,700,900}.woff2

用法: python3 props.py projects/<slug>/script.json <public_dir> <slug>
字体: 默认找 /usr/share/fonts/opentype/noto/NotoSansCJK-*.ttc (apt: fonts-noto-cjk fonts-noto-cjk-extra)
      其他位置用 CJK_TTC_DIR 指定
"""
import json, os, string, sys

script_path, pub, slug = sys.argv[1], sys.argv[2], sys.argv[3]
cfg = json.load(open(script_path, encoding="utf8"))
T = json.load(open(os.path.join(pub, "timing.json"), encoding="utf8"))
mf_path = os.path.join(pub, "manifest.json")
media = {m["seg"]: m for m in (json.load(open(mf_path, encoding="utf8")) if os.path.exists(mf_path) else [])}
src = {s["id"]: s for s in cfg.get("sources", [])}
tseg = {s["id"]: s for s in T["segments"]}

segments = []
for sg in cfg["segments"]:
    ts = tseg[sg["id"]]
    lines = [{"text": p["text"], "hl": p["hl"], "start": p["start"], "end": p["end"]}
             for p in T["phrases"] if p["seg"] == sg["id"]]
    vis = dict(sg.get("visual", {"type": "media"}))
    if vis.get("source") in src:
        s = src[vis["source"]]
        vis["sourceText"] = s.get("title") or s.get("url", "")
    m = media.get(sg["id"])
    if m:
        m = {**m, "file": f"studio/{slug}/{m['file']}"}
    segments.append({"id": sg["id"], "start": ts["start"], "end": ts["end"], "visual": vis,
                     "media": m, "lines": lines})

props = {
    "slug": slug,
    "title": cfg["title"],
    "subtitle": cfg.get("subtitle", ""),
    "brand": cfg.get("brand", "投研笔记"),
    "tag": cfg.get("tag", ""),
    "disclaimer": cfg["disclaimer"],
    "accent": cfg.get("style", {}).get("accent", "#FFC83D"),
    "duration": T["duration"],
    "voEngine": T["engine"],
    "audio": f"studio/{slug}/mix.mp3",
    "fonts": f"studio/{slug}/fonts",
    "segments": segments,
}
json.dump(props, open(os.path.join(pub, "props.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)

# ---------- 字体子集 ----------
from fontTools.ttLib import TTCollection  # noqa: E402
from fontTools import subset  # noqa: E402

chars = set(json.dumps(props, ensure_ascii=False)) | set(string.printable) | set("，。？！：「」·…—✓✕→↑↓▲▼¥%+-／")
text = "".join(sorted(chars))
ttc = os.environ.get("CJK_TTC_DIR", "/usr/share/fonts/opentype/noto")
out = os.path.join(pub, "fonts"); os.makedirs(out, exist_ok=True)
for w, f in [(500, "Medium"), (700, "Bold"), (900, "Black")]:
    font = TTCollection(os.path.join(ttc, f"NotoSansCJK-{f}.ttc")).fonts[2]  # [2] = SC
    o = subset.Options(); o.flavor = "woff2"; o.layout_features = ["*"]
    s = subset.Subsetter(o); s.populate(text=text); s.subset(font)
    font.flavor = "woff2"; font.save(os.path.join(out, f"hs-{w}.woff2"))
print(f"[props] {len(segments)} 段, {T['duration']:.1f}s, 字体 {len(text)} 字 → {pub}/props.json", file=sys.stderr)
