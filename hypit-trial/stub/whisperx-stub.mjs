// WhisperX 替身服务(本地回环, 协议 hypit.whisperx-service@1)
//
// 为什么: 沙箱/离线环境下载不到 WhisperX 的 ASR 与中文对齐模型(Hugging Face)。Hypit 自己不做对齐,
// 词级时间只来自 whisperx-alignment 能力。这个替身把"我们自己已经知道的时间"按 WhisperX 的返回格式交给 Hypit:
//   - 每句的起止来自 TTS 逐句合成时量出的 timing.json(精确到采样点);
//   - 句内每个汉字按等分插值(与 Remotion 版逐字字幕同一近似);
//   - 输出的是"读音"文本(script.json 的 tts 字段), 让 Hypit 自己完成 显示/读音 的 M:N 对齐。
// 换成真 WhisperX 或 edge-tts WordBoundary 时, 只替换这里的数据来源, Hypit 侧不用改。
//
// 用法: FUPAN_TIMING=assets/timing.json FUPAN_SCRIPT=assets/script.json node stub/whisperx-stub.mjs
import http from "node:http";
import fs from "node:fs";

const PORT = Number(process.env.HYPIT_WHISPERX_PORT || 8765);
const PUNC = "，。？！、：；,.?!“”\"' ";
const health = { ok: true, protocol: "hypit.whisperx-service@1", serviceVersion: "0.1.0", whisperxVersion: "3.8.6",
  model: "small", device: "cpu", compute: "int8", batchSize: 8 };

function transcript() {
  const T = JSON.parse(fs.readFileSync(process.env.FUPAN_TIMING, "utf8"));
  const cfg = JSON.parse(fs.readFileSync(process.env.FUPAN_SCRIPT, "utf8"));
  const spoken = cfg.scenes.flatMap((sc) => sc.lines.map((ln) => ln.tts || ln.t));
  if (spoken.length !== T.phrases.length) throw new Error(`script has ${spoken.length} lines, timing has ${T.phrases.length}`);
  const segments = T.phrases.map((p, i) => {
    const chars = [...spoken[i]].filter((c) => !PUNC.includes(c));
    const step = (p.end - p.start) / chars.length;
    const r = (x) => Math.round(x * 1000) / 1000;
    const words = chars.map((c, k) => ({ word: c, start: r(p.start + k * step), end: r(p.start + (k + 1) * step), score: 0.9 }));
    return { start: r(p.start), end: r(p.end), text: spoken[i], words };
  });
  return { language: "zh", segments };
}

http.createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (req.method === "GET" && req.url === "/health") return send(200, health);
  if (req.method === "POST" && req.url === "/transcribe") {
    let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => {
      try { const q = JSON.parse(body); console.error("[stub] transcribe", q.language, q.audio_path); send(200, transcript()); }
      catch (e) { console.error(e); send(500, { error: String(e) }); }
    });
    return;
  }
  send(404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.error(`[stub] whisperx stub on 127.0.0.1:${PORT}`));
