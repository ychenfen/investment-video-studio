#!/usr/bin/env python3
"""通用讲解视频 · 实拍/实物素材 (背景视频 + 照片)

每个 segment 的 "media" 字段决定背景素材, 三种写法(优先级从上到下):
  {"file": "assets/fab.mp4"}                      项目里自带的文件(用户上传/自己拍的)
  {"url": "https://...jpg", "credit": "...", "license": "CC BY-SA 4.0", "source": "https://..."}
                                                   直接给链接(Agent 在 Wikimedia 等处找到的)
  {"query": "semiconductor factory", "kind": "video"|"photo"}
                                                   按关键词自动搜: Pexels → Pixabay → Wikimedia Commons
可选: "label": "实拍"|"资料图"|"示意" (画面角标, 默认: 视频/照片=资料画面, 无素材=无角标)

每个素材都会记下 来源/作者/许可, 写到 manifest.json, 画面底部自动打"素材: xxx / 许可"小字。
没有 key、网络不通、搜不到 → 该段退回纯代码背景, 不中断流水线。

环境变量: PEXELS_API_KEY / PIXABAY_API_KEY (可选, 免费申请); Wikimedia 不需要 key。
用法: python3 media.py projects/<slug>/script.json <public_dir>
"""
import json, os, re, shutil, subprocess, sys, tempfile
import requests

UA = {"User-Agent": "investment-video-studio/1.0 (educational explainer videos)"}
script_path, pub = sys.argv[1], sys.argv[2]
proj = os.path.dirname(os.path.abspath(script_path))
cfg = json.load(open(script_path, encoding="utf8"))
mdir = os.path.join(pub, "media"); os.makedirs(mdir, exist_ok=True)
MAX_SEC = float(os.environ.get("BROLL_MAX_SEC", "14"))
used = set()


def log(*a):
    print("[media]", *a, file=sys.stderr)


def get(url, **kw):
    r = requests.get(url, headers=UA, timeout=25, **kw); r.raise_for_status(); return r


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


# ---------- providers: 返回 [{"url","kind","credit","license","source"}] ----------
def pexels(q, kind):
    key = os.environ.get("PEXELS_API_KEY")
    if not key:
        return []
    h = {**UA, "Authorization": key}
    if kind == "video":
        j = requests.get("https://api.pexels.com/videos/search", headers=h, timeout=25,
                         params={"query": q, "per_page": 8, "orientation": "portrait"}).json()
        out = []
        for v in j.get("videos", []):
            files = sorted([f for f in v["video_files"] if f.get("width") and f["width"] <= 1440],
                           key=lambda f: -f["width"] * f["height"])
            if files:
                out.append({"url": files[0]["link"], "kind": "video", "credit": f'{v["user"]["name"]} / Pexels',
                            "license": "Pexels License", "source": v["url"]})
        return out
    j = requests.get("https://api.pexels.com/v1/search", headers=h, timeout=25,
                     params={"query": q, "per_page": 8, "orientation": "portrait"}).json()
    return [{"url": p["src"]["large2x"], "kind": "photo", "credit": f'{p["photographer"]} / Pexels',
             "license": "Pexels License", "source": p["url"]} for p in j.get("photos", [])]


def pixabay(q, kind):
    key = os.environ.get("PIXABAY_API_KEY")
    if not key:
        return []
    if kind == "video":
        j = get("https://pixabay.com/api/videos/", params={"key": key, "q": q, "per_page": 8}).json()
        return [{"url": h["videos"]["medium"]["url"], "kind": "video", "credit": f'{h["user"]} / Pixabay',
                 "license": "Pixabay Content License", "source": h["pageURL"]} for h in j.get("hits", [])]
    j = get("https://pixabay.com/api/", params={"key": key, "q": q, "per_page": 8, "image_type": "photo"}).json()
    return [{"url": h["largeImageURL"], "kind": "photo", "credit": f'{h["user"]} / Pixabay',
             "license": "Pixabay Content License", "source": h["pageURL"]} for h in j.get("hits", [])]


def wikimedia(q, kind):
    # 真实公司/人物/产品照片最靠谱的免费来源; 只取明确 CC/公有领域许可的
    j = get("https://commons.wikimedia.org/w/api.php", params={
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 10,
        "gsrsearch": f"{q} filetype:bitmap", "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 1600}).json()
    out = []
    for p in sorted(j.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0)):
        ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        lic = md.get("LicenseShortName", {}).get("value", "")
        if not re.search(r"CC|Public domain|PD", lic, re.I):
            continue
        out.append({"url": ii.get("thumburl") or ii["url"], "kind": "photo",
                    "credit": f'{strip_html(md.get("Artist", {}).get("value", "佚名"))[:40]} / Wikimedia Commons',
                    "license": lic, "source": ii.get("descriptionurl", "")})
    return out


PROVIDERS = [("pexels", pexels), ("pixabay", pixabay), ("wikimedia", wikimedia)]


# ---------- 下载 + 规格化 (视频: ≤1440 宽 H.264 无音轨 ≤MAX_SEC 秒; 照片: 长边 ≤1600 jpg) ----------
def normalize(src, dst_base, kind):
    if kind == "video":
        dst = dst_base + ".mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-t", str(MAX_SEC), "-an",
                        "-vf", "scale='min(1440,iw)':-2,fps=30", "-c:v", "libx264", "-preset", "veryfast",
                        "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst], check=True)
    else:
        dst = dst_base + ".jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src,
                        "-vf", "scale='if(gt(iw,ih),min(1600,iw),-2)':'if(gt(iw,ih),-2,min(1600,ih))'",
                        "-q:v", "3", dst], check=True)
    return dst


def fetch(url, dst_base, kind):
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "raw")
        with get(url, stream=True) as r, open(raw, "wb") as f:
            shutil.copyfileobj(r.raw, f)
        return normalize(raw, dst_base, kind)


def kind_of(path):
    return "video" if path.lower().endswith((".mp4", ".mov", ".webm", ".mkv")) else "photo"


manifest = []
for sg in cfg["segments"]:
    m = sg.get("media")
    if not m:
        continue
    base = os.path.join(mdir, sg["id"]); ent = None
    try:
        if m.get("file"):
            src = os.path.join(proj, m["file"]); k = kind_of(src)
            ent = {"file": normalize(src, base, k), "kind": k, "credit": m.get("credit", "自有素材"),
                   "license": m.get("license", ""), "source": m.get("source", "")}
        elif m.get("url"):
            k = m.get("kind") or kind_of(m["url"].split("?")[0])
            ent = {"file": fetch(m["url"], base, k), "kind": k, "credit": m.get("credit", ""),
                   "license": m.get("license", ""), "source": m.get("source", m["url"])}
        elif m.get("query"):
            k = m.get("kind", "video")
            kinds = [k, "photo"] if k == "video" else [k]
            for kk in kinds:
                for name, fn in PROVIDERS:
                    try:
                        cands = [c for c in fn(m["query"], kk) if c["source"] not in used]
                    except Exception as e:  # noqa: BLE001
                        log(f'{sg["id"]}: {name} 失败 {type(e).__name__}: {str(e)[:120]}'); continue
                    if cands:
                        c = cands[0]; used.add(c["source"])
                        ent = {**c, "file": fetch(c["url"], base, c["kind"])}
                        break
                if ent:
                    break
    except Exception as e:  # noqa: BLE001
        log(f'{sg["id"]}: 素材处理失败 {type(e).__name__}: {str(e)[:160]}')
    if ent:
        if ent["kind"] == "video":
            ent["dur"] = float(subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ent["file"]],
                capture_output=True, text=True, check=True).stdout.strip())
        ent.update(seg=sg["id"], file=os.path.relpath(ent["file"], pub),
                   label=m.get("label", "资料画面"), focus=m.get("focus", "center"))
        manifest.append(ent); log(f'{sg["id"]}: {ent["kind"]} ← {ent["credit"]} ({ent["license"]})')
    else:
        log(f'{sg["id"]}: 无素材, 用代码背景')

json.dump(manifest, open(os.path.join(pub, "manifest.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
log(f"{len(manifest)} 个素材 → {pub}/manifest.json")
