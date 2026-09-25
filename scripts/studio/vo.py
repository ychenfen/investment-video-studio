#!/usr/bin/env python3
"""通用讲解视频 · 配音 + 句级时间轴

读 projects/<slug>/script.json, 逐句合成 → 去首尾静音 → 按句间/段间停顿拼接, 输出:
  <out>/vo.wav        24kHz 单声道配音
  <out>/timing.json   每句 start/end + 每段 start/end (秒), 字幕/卡片/图表全部按它对齐

引擎 (--engine, 默认 auto = 依次尝试 edge → kokoro → espeak):
  edge    微软 edge-tts, 音质最好. 需能连 speech.platform.bing.com
          本机: EDGE_PROXY=http://127.0.0.1:7897 ; 云端: 自动走 HTTPS_PROXY + SSL_CERT_FILE
  kokoro  离线 Kokoro-v1.1-zh, 需 KOKORO_DIR 下有 kokoro-v1.1-zh.onnx + voices-v1.1-zh.bin
  espeak  espeak-ng 普通话, 机械音, 只用于排版预览 (不要发布)
  silent  不出声, 按 5.2 字/秒估时长, 只用于排版预览

用法: python3 vo.py projects/<slug>/script.json <out_dir> [--engine auto|edge|kokoro|espeak|silent]
"""
import argparse, asyncio, json, os, shutil, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

SR = 24000
PUN = "，。？！、：；,.?!“”\"'「」…—"
ap = argparse.ArgumentParser()
ap.add_argument("script"); ap.add_argument("out_dir")
ap.add_argument("--engine", default=os.environ.get("TTS_ENGINE", "auto"),
                choices=["auto", "edge", "kokoro", "espeak", "silent"])
args = ap.parse_args()
cfg = json.load(open(args.script, encoding="utf8"))
voice = cfg.get("voice", {})
os.makedirs(args.out_dir, exist_ok=True)


def ffmpeg_to_wav(src, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", str(SR), dst], check=True)
    a, _ = sf.read(dst, dtype="float32")
    return a


def make_edge():
    import ssl
    import edge_tts
    import edge_tts.communicate as ec
    # 云端代理会重签 TLS; edge-tts 默认只信 certifi, 这里改信系统/代理 CA
    if os.environ.get("SSL_CERT_FILE"):
        ec._SSL_CTX = ssl.create_default_context(cafile=os.environ["SSL_CERT_FILE"])
    proxy = os.environ.get("EDGE_PROXY") or os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    v, rate = voice.get("edge", "zh-CN-YunyangNeural"), voice.get("rate", "+8%")

    def synth(text):
        with tempfile.TemporaryDirectory() as d:
            mp3 = os.path.join(d, "s.mp3")
            asyncio.run(edge_tts.Communicate(text, v, rate=rate, proxy=proxy).save(mp3))
            return ffmpeg_to_wav(mp3, os.path.join(d, "s.wav"))
    return synth


def make_kokoro():
    from kokoro_onnx import Kokoro
    from misaki import zh
    kd = os.environ.get("KOKORO_DIR", os.path.expanduser("~/models/kokoro"))
    g2p = zh.ZHG2P(version="1.1")
    k = Kokoro(os.path.join(kd, "kokoro-v1.1-zh.onnx"), os.path.join(kd, "voices-v1.1-zh.bin"))

    def synth(text):
        ph, _ = g2p(text)
        a, sr = k.create(ph, voice=voice.get("kokoro", "zm_009"), speed=voice.get("kokoro_speed", 1.4), is_phonemes=True)
        return a.astype(np.float32)
    return synth


def make_espeak():
    exe = shutil.which("espeak-ng")
    if not exe:
        raise RuntimeError("espeak-ng 未安装 (apt-get install espeak-ng)")

    def synth(text):
        with tempfile.TemporaryDirectory() as d:
            w = os.path.join(d, "e.wav")
            subprocess.run([exe, "-v", "cmn", "-s", "230", "-w", w, text], check=True)
            return ffmpeg_to_wav(w, os.path.join(d, "s.wav"))
    return synth


def make_silent():
    def synth(text):
        n = len([c for c in text if c not in PUN and not c.isspace()])
        return np.zeros(int(max(0.6, n / 5.2) * SR), np.float32) + 1e-4
    return synth


FACTORIES = {"edge": make_edge, "kokoro": make_kokoro, "espeak": make_espeak, "silent": make_silent}
order = ["edge", "kokoro", "espeak"] if args.engine == "auto" else [args.engine]
engine, synth = None, None
for name in order:
    try:
        s = FACTORIES[name]()
        s("测试")  # 探活: 连不上/缺模型会在这里抛错
        engine, synth = name, s
        break
    except Exception as e:  # noqa: BLE001
        print(f"[vo] 引擎 {name} 不可用: {type(e).__name__}: {str(e)[:160]}", file=sys.stderr)
if synth is None:
    sys.exit("[vo] 没有可用的配音引擎。云端请在环境网络设置里放行 speech.platform.bing.com, 或用 --engine silent 先排版预览")
if engine in ("espeak",):
    print("[vo] 警告: 当前是 espeak 预览配音(机械音), 不可发布", file=sys.stderr)


def trim(a, th=0.012):
    idx = np.where(np.abs(a) > th)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.02 * SR)); e = min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]


GAP_IN, GAP_END, GAP_SEG, HEAD, TAIL = 0.06, 0.22, 0.28, 0.25, 1.2
buf = [np.zeros(int(HEAD * SR), np.float32)]; t = HEAD; phrases = []; segs = []
for si, sg in enumerate(cfg["segments"]):
    if si > 0:
        buf.append(np.zeros(int(GAP_SEG * SR), np.float32)); t += GAP_SEG
    s0 = t
    for li, ln in enumerate(sg["lines"]):
        a = synth(ln.get("tts", ln["t"]))
        a = a if engine == "silent" else trim(a)
        d = len(a) / SR
        phrases.append({"seg": sg["id"], "i": li, "text": ln["t"], "hl": ln.get("hl", []),
                        "start": round(t, 3), "end": round(t + d, 3)})
        print(f'{t:6.2f}s [{sg["id"]}] {ln["t"]}', file=sys.stderr)
        buf.append(a); t += d
        g = GAP_END if (ln.get("end") or li == len(sg["lines"]) - 1) else GAP_IN
        buf.append(np.zeros(int(g * SR), np.float32)); t += g
    segs.append({"id": sg["id"], "start": round(s0, 3)})
buf.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
for i, s in enumerate(segs):
    s["end"] = segs[i + 1]["start"] if i + 1 < len(segs) else round(t, 3)
segs[0]["start"] = 0
audio = np.concatenate(buf)
if engine != "silent":
    audio = audio / max(1e-6, np.abs(audio).max()) * 0.89
sf.write(os.path.join(args.out_dir, "vo.wav"), audio, SR)
json.dump({"duration": round(t, 3), "engine": engine, "segments": segs, "phrases": phrases},
          open(os.path.join(args.out_dir, "timing.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(f"[vo] {engine} 配音 {t:.2f}s → {args.out_dir}/vo.wav + timing.json", file=sys.stderr)
