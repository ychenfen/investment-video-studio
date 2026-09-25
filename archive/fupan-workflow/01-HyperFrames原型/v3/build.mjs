// Generates index.html from timing.json (voiceover phrase timings).
import fs from "node:fs";
import { person, avatar, XIAOYU, ABEN, CROWD } from "./chars.mjs";
const T = JSON.parse(fs.readFileSync(new URL("./timing.json", import.meta.url)));
const D = Math.ceil(T.duration * 10) / 10;
const S = Object.fromEntries(T.scenes.map((s) => [s.id, s]));
const PH = (id) => T.phrases.filter((p) => p.scene === id);
const XF = 0.08; // scene crossfade overlap

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function hlText(text, hl) {
  let out = esc(text);
  for (const w of hl || []) out = out.split(esc(w)).join(`<em>${esc(w)}</em>`);
  return out;
}

// ---------- avatars (original characters) ----------
const PUNC = "，。？！、：；,.?!";
function charSpans(text, hl) {
  const mark = new Array(text.length).fill(false);
  for (const w of hl || []) { let k = text.indexOf(w); while (k >= 0) { for (let j = k; j < k + w.length; j++) mark[j] = true; k = text.indexOf(w, k + 1); } }
  return [...text].map((c, i) => `<i class="cc${mark[i] ? " k" : ""}${PUNC.includes(c) ? " pu" : ""}">${esc(c)}</i>`).join("");
}

// ---------- captions ----------
const SPK = { aben: "阿本", xiaoyu: "小于" };
const caps = T.phrases
  .map((p, i) => {
    const next = T.phrases[i + 1];
    const end = next && next.start - p.end < 0.5 ? next.start : p.end + 0.35;
    const dur = (end - p.start).toFixed(3);
    const chip = SPK[p.s] ? `<div class="cav">${avatar("cav-" + i, p.s, "mini")}<b class="cav-n cav-${p.s}">${SPK[p.s]}</b></div>` : "";
    return `<div id="cap-${i}" class="clip cap" data-start="${p.start}" data-duration="${dur}" data-pend="${p.end}" data-spk="${p.s}" data-track-index="20"><div class="cap-in">${chip}<span class="cap-t">${charSpans(p.text, p.hl)}</span></div></div>`;
  })
  .join("\n      ");

function sceneAttrs(id) {
  const s = S[id];
  const start = s.start;
  const end = Math.min(D, s.end + XF);
  return `data-start="${start.toFixed(3)}" data-duration="${(end - start).toFixed(3)}" data-track-index="10"`;
}

// ---------- scene markup ----------
const hotList = [
  ["机器人", "+10.02%"], ["算力", "+9.98%"], ["固态电池", "+8.61%"], ["低空经济", "+7.35%"],
  ["创新药", "+6.90%"], ["消费电子", "+6.12%"], ["军工", "+5.47%"], ["半导体", "+5.03%"],
  ["光模块", "+4.88%"], ["稀土", "+4.21%"], ["券商", "+3.96%"], ["储能", "+3.50%"],
];
const listRows = [...hotList, ...hotList]
  .map(([n, v], i) => `<div class="row"><span class="rk">${(i % 12) + 1}</span><span class="nm">${n}</span><span class="spark"></span><span class="pct">${v}</span></div>`)
  .join("");

// mini charts for mode cards (SVG, viewBox 0 0 360 150)
function candles(list) {
  // list: [open, close, high, low] in 0..140 (y up)
  const w = 360 / list.length;
  return list
    .map(([o, c, h, l], i) => {
      const x = i * w + w / 2;
      const up = c >= o;
      const col = up ? "var(--up)" : "var(--down)";
      const top = 150 - Math.max(o, c), bot = 150 - Math.min(o, c);
      return `<line x1="${x}" x2="${x}" y1="${150 - h}" y2="${150 - l}" stroke="${col}" stroke-width="3"/><rect x="${x - w * 0.3}" y="${top}" width="${w * 0.6}" height="${Math.max(3, bot - top)}" rx="2" fill="${col}"/>`;
    })
    .join("");
}
const modeCharts = {
  high: candles([[10, 22, 24, 8], [22, 38, 40, 21], [38, 56, 58, 37], [56, 76, 78, 55], [76, 98, 100, 75], [98, 122, 124, 97], [122, 138, 140, 118]]),
  low: candles([[20, 22, 26, 16], [22, 19, 25, 16], [19, 21, 24, 15], [21, 20, 25, 17], [20, 23, 26, 18], [23, 60, 62, 22], [60, 96, 98, 58]]),
  trend: `<polyline points="0,130 40,118 80,112 120,96 160,90 200,74 240,66 280,50 320,40 360,24" fill="none" stroke="var(--up)" stroke-width="5" stroke-linejoin="round" class="draw"/><polyline points="0,138 60,128 120,114 180,100 240,84 300,66 360,50" fill="none" stroke="var(--gold)" stroke-width="3" stroke-dasharray="8 8" opacity=".8"/>`,
  rebound: candles([[30, 70, 72, 28], [70, 110, 112, 68], [108, 60, 110, 56], [60, 52, 64, 48], [52, 100, 102, 50], [100, 132, 134, 98]]),
};
const modes = [
  ["high", "高位股", "连板高度 · 情绪龙头"],
  ["low", "低位新方向", "首板启动 · 新题材"],
  ["trend", "趋势", "均线多头 · 机构抱团"],
  ["rebound", "反包", "断板次日 · 再度走强"],
];
const modeCards = modes
  .map(([k, name, sub], i) => `<div class="mcard" id="mc-${k}"><div class="mc-h"><span class="mc-idx">0${i + 1}</span><span class="mc-n">${name}</span></div><svg class="mc-svg" viewBox="0 0 360 150" preserveAspectRatio="none">${modeCharts[k]}</svg><div class="mc-sub">${sub}</div></div>`)
  .join("");

// premium bars (next-day premium, illustrative)
const prem = [3.2, 4.6, 2.8, 5.4, 4.1];
const premBars = prem
  .map((v, i) => `<div class="bcol"><div class="bval up-t" id="pv-${i}">+${v.toFixed(1)}%</div><div class="bbar up-b" id="pb-${i}" style="height:${v * 58}px"></div><div class="blab">D${i + 1}</div></div>`)
  .join("");
const fail = [-2.1, -3.8, -4.6, -3.2, -5.3, -2.7];
const failBars = fail
  .map((v, i) => `<div class="fcol"><div class="fbar dn-b" id="fb-${i}" style="height:${-v * 36}px"></div><div class="fval dn-t" id="fv-${i}">${v.toFixed(1)}%</div></div>`)
  .join("");

const segs = T.scenes.map((s, i) => `<i id="seg-${i}"><b id="segf-${i}"></b></i>`).join("");

// ---------- html ----------
const html = `<!doctype html>
<html lang="zh-CN" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>复盘看赚钱效应</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "HS"; src: url("assets/fonts/hs-500.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "HS"; src: url("assets/fonts/hs-700.woff2") format("woff2"); font-weight: 700; }
      @font-face { font-family: "HS"; src: url("assets/fonts/hs-900.woff2") format("woff2"); font-weight: 900; }
      @font-face { font-family: "Num"; src: url("assets/fonts/num-600.woff2") format("woff2"); font-weight: 600; }
      @font-face { font-family: "Num"; src: url("assets/fonts/num-700.woff2") format("woff2"); font-weight: 700; }
      :root {
        --bg: #070d1c; --panel: #0d1830; --panel2: #13213f; --line: rgba(120,160,255,.16);
        --ink: #eef3ff; --mute: #8a9bc2; --gold: #ffc53d; --gold2: #ff9f1a;
        --up: #ff4d4f; --down: #19c37d; --cyan: #4cc9f0; --violet: #6d5dfc;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: var(--bg); }
      body { font-family: "HS", sans-serif; color: var(--ink); }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--bg); }
      .full { position: absolute; inset: 0; }
      em { font-style: normal; color: var(--gold); }
      .num { font-family: "Num", "HS", sans-serif; }

      /* background */
      #bg .grid { position: absolute; inset: -40px; background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 60px 60px; opacity: .35; }
      #bg .glow1 { position: absolute; width: 900px; height: 900px; left: -300px; top: -250px; border-radius: 50%; background: radial-gradient(circle, rgba(109,93,252,.35), transparent 65%); }
      #bg .glow2 { position: absolute; width: 1000px; height: 1000px; right: -420px; top: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(255,77,79,.18), transparent 65%); }
      #bg .vig { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.65)); }

      /* frame */
      #frame { pointer-events: none; }
      .brand { position: absolute; right: 40px; top: 92px; display: flex; align-items: center; gap: 12px; padding: 12px 26px; border-radius: 40px; background: #f4f6fb; color: #16213d; font-weight: 900; font-size: 30px; box-shadow: 0 8px 30px rgba(0,0,0,.35); }
      .brand i { width: 20px; height: 20px; border-radius: 50%; border: 5px solid var(--violet); background: var(--gold); display: block; }
      .hdr { position: absolute; left: 40px; right: 40px; top: 172px; height: 104px; border-radius: 28px 28px 0 0; background: linear-gradient(180deg, #16254a, #101c38); border: 1px solid rgba(140,170,255,.22); border-bottom: none; }
      .dots { position: absolute; left: 30px; top: 26px; display: flex; gap: 12px; }
      .dots i { width: 14px; height: 14px; border-radius: 50%; display: block; }
      .live { position: absolute; left: 30px; top: 58px; display: flex; align-items: center; gap: 12px; font-size: 26px; color: #9fd8ff; font-weight: 700; }
      .live b { width: 14px; height: 14px; border-radius: 50%; background: var(--cyan); display: block; box-shadow: 0 0 14px var(--cyan); }
      .chip { position: absolute; right: 26px; top: 18px; padding: 8px 20px; border-radius: 14px; background: linear-gradient(90deg, #5b4cf5, #7b6bff); font-size: 28px; font-weight: 900; color: #fff; }
      .segs { position: absolute; right: 26px; top: 72px; display: flex; gap: 8px; }
      .segs i { display: block; width: 44px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.12); overflow: hidden; }
      .segs b { display: block; width: 100%; height: 100%; background: linear-gradient(90deg, var(--cyan), var(--gold)); transform-origin: 0 50%; transform: scaleX(0); }
      .stage { position: absolute; left: 40px; right: 40px; top: 276px; height: 960px; background: linear-gradient(180deg, #0c1630, #0a1226); border-left: 1px solid rgba(140,170,255,.22); border-right: 1px solid rgba(140,170,255,.22); overflow: hidden; }
      .stage .sgrid { position: absolute; inset: 0; background-image: radial-gradient(rgba(140,170,255,.18) 1.5px, transparent 1.5px); background-size: 34px 34px; opacity: .5; }
      .tcard { position: absolute; left: 40px; right: 40px; top: 1236px; height: 330px; border-radius: 0 0 28px 28px; background: linear-gradient(180deg, #111d3a, #0e1832); border: 1px solid rgba(140,170,255,.22); border-top: 1px solid rgba(255,197,61,.35); }
      .tcard .tag { position: absolute; left: 36px; top: 170px; padding: 6px 16px; border: 2px solid rgba(76,201,240,.6); border-radius: 10px; color: var(--cyan); font-size: 26px; font-weight: 700; }
      .tcard .ttl { position: absolute; left: 36px; top: 222px; width: 640px; font-size: 40px; line-height: 1.32; font-weight: 900; }
      .tcard .ttl u { text-decoration: none; border-bottom: 5px solid var(--violet); color: var(--gold); }
      .badge { position: absolute; right: 34px; top: 168px; width: 230px; height: 136px; border-radius: 20px; background: var(--gold); color: #1b1200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: 8px 8px 0 #2a1d00; }
      .badge .b1 { font-size: 28px; font-weight: 900; }
      .badge .b2 { font-size: 30px; font-weight: 900; padding: 2px 18px; border-radius: 12px; background: #fff; color: #3a2cff; border: 3px solid #3a2cff; }
      .disc { position: absolute; left: 0; right: 0; top: 1592px; text-align: center; font-size: 22px; color: #8f9dbd; letter-spacing: 2px; }

      /* captions (inside tcard top area) */
      .cap { position: absolute; left: 40px; right: 40px; top: 1250px; height: 120px; display: flex; align-items: center; justify-content: center; }
      .cap-in { display: flex; align-items: center; gap: 16px; max-width: 960px; }
      .cap-t { font-size: 56px; font-weight: 900; line-height: 1.15; letter-spacing: 1px; text-shadow: 0 4px 0 rgba(0,0,0,.45); white-space: nowrap; }
      .cav { flex: none; position: relative; width: 104px; height: 104px; }
      .cav .avatar { width: 104px; height: 104px; display: block; border-radius: 50%; box-shadow: 0 0 0 4px rgba(255,255,255,.14); }
      .cav-n { position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%); font-size: 20px; font-weight: 900; padding: 2px 10px; border-radius: 8px; white-space: nowrap; }
      .cav-aben { background: var(--gold); color: #231800; } .cav-xiaoyu { background: var(--cyan); color: #04202c; }
      .cc { font-style: normal; display: inline-block; opacity: .32; }
      .cc.k { color: var(--gold); }
      .cc.pu { opacity: 1; }
      .cam, .pun { position: absolute; inset: 0; }
      .avatar { display: block; }
      #hk-head { position: absolute; left: 60px; right: 60px; top: 70px; }
      #hk-head .h1 { display: flex; align-items: flex-end; gap: 20px; font-size: 120px; font-weight: 900; line-height: 1; }
      #hk-3 { font-family: "Num"; font-size: 250px; font-weight: 700; color: var(--gold); line-height: .8; display: inline-block; text-shadow: 0 0 60px rgba(255,197,61,.35); }
      #hk-head .h1 small { font-size: 96px; color: var(--gold); }
      #hk-clock { width: 150px; height: 150px; margin-left: auto; margin-bottom: 20px; }
      #hk-head .h2 { margin-top: 36px; font-size: 100px; font-weight: 900; line-height: 1.15; }
      #hk-head .h2 em { position: relative; }
      #hk-yu { position: absolute; left: 70px; top: 560px; width: 300px; height: 300px; }
      #hk-yu .avatar { width: 300px; height: 300px; }
      .sweat { position: absolute; width: 34px; height: 46px; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: linear-gradient(180deg,#bfe9ff,#4cc9f0); }
      .qm { position: absolute; font-family: "Num"; font-weight: 700; color: var(--gold); }
      #hk-stamp { position: absolute; right: 50px; top: 620px; padding: 18px 30px; border: 8px solid var(--up); border-radius: 22px; color: var(--up); font-size: 76px; font-weight: 900; transform: rotate(-8deg); background: rgba(255,77,79,.08); }
      #hk-stamp small { display: block; font-size: 34px; color: #ffb3b3; margin-bottom: 6px; }
      .flash { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, #fff6d6, rgba(255,197,61,.2) 60%, transparent 80%); opacity: 0; }
      #mo-ab { position: absolute; left: 410px; top: 70px; width: 180px; height: 180px; }
      #mo-ab .avatar { width: 180px; height: 180px; }
      #st-yu { position: absolute; right: 60px; top: 650px; width: 210px; height: 210px; }
      #st-yu .avatar { width: 210px; height: 210px; }
      #re-yu { position: absolute; right: 80px; top: 6px; width: 130px; height: 130px; }
      #re-yu .avatar { width: 130px; height: 130px; }
      #re-bulb { position: absolute; right: 214px; top: 10px; width: 70px; height: 90px; }
      .dav .avatar { width: 120px; height: 120px; }
      .dav { flex: none; width: 120px; height: 120px; }
      /* v3 rooms */
      .room { position: absolute; inset: 0; overflow: hidden; }
      .wall { position: absolute; inset: 0; background: linear-gradient(180deg, #111a33 0%, #0c1328 70%); }
      .win { position: absolute; left: 50px; top: 60px; width: 300px; height: 290px; border-radius: 16px; overflow: hidden; border: 10px solid #26324f; }
      .sky-n { position: absolute; inset: 0; background: linear-gradient(180deg, #050a1f, #1a2350); }
      .sky-d { position: absolute; inset: 0; background: linear-gradient(180deg, #7cc4ff, #ffe2a8); }
      .win .bar1 { position: absolute; left: 50%; top: 0; bottom: 0; width: 10px; margin-left: -5px; background: #26324f; }
      .win .bar2 { position: absolute; top: 50%; left: 0; right: 0; height: 10px; margin-top: -5px; background: #26324f; }
      .star { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #fff; }
      #st-moon { position: absolute; left: 180px; top: 40px; width: 70px; height: 70px; border-radius: 50%; background: #fff3c4; box-shadow: 0 0 40px rgba(255,243,196,.6); }
      #st-sun { position: absolute; left: 60px; top: 60px; width: 90px; height: 90px; border-radius: 50%; background: #ffcf4d; box-shadow: 0 0 60px rgba(255,207,77,.9); }
      .clockw { position: absolute; right: 60px; top: 60px; width: 220px; text-align: center; }
      .clockw svg { width: 170px; height: 170px; }
      .clab { position: relative; height: 44px; margin-top: 6px; }
      .clab span { position: absolute; left: 0; right: 0; font-size: 30px; font-weight: 900; }
      .desk { position: absolute; left: -20px; right: -20px; top: 720px; height: 260px; background: linear-gradient(180deg, #6b4a32, #4a3222); border-top: 8px solid #8a6446; }
      .mon { position: absolute; left: 400px; top: 290px; width: 540px; height: 360px; border-radius: 20px; background: #0a0f1e; border: 14px solid #1f2638; box-shadow: 0 0 80px rgba(76,201,240,.25); overflow: hidden; }
      .mon .lh2 { position: absolute; left: 0; right: 0; top: 0; height: 52px; display: flex; align-items: center; padding: 0 20px; background: #1b2238; color: var(--gold); font-size: 24px; font-weight: 900; z-index: 2; }
      .mon .lh2 span { margin-left: auto; color: var(--mute); font-size: 18px; font-weight: 500; }
      .mon .rows { top: 52px; }
      .mon .row { height: 56px; font-size: 26px; padding: 0 20px; gap: 14px; }
      .mon .rk { font-size: 24px; width: 30px; } .mon .nm { width: 170px; } .mon .pct { font-size: 30px; width: 120px; }
      #st-dim { position: absolute; inset: 0; background: rgba(5,8,18,.75); z-index: 3; }
      .stand { position: absolute; left: 640px; top: 650px; width: 60px; height: 76px; background: #1f2638; }
      .kbd { position: absolute; left: 330px; top: 748px; width: 340px; height: 34px; border-radius: 8px; background: #2a3148; box-shadow: inset 0 -6px 0 rgba(0,0,0,.3); }
      .mug { position: absolute; left: 780px; top: 700px; width: 70px; height: 80px; border-radius: 0 0 14px 14px; background: #e8e2d6; }
      .mug::after { content: ""; position: absolute; right: -24px; top: 16px; width: 28px; height: 36px; border: 8px solid #e8e2d6; border-left: none; border-radius: 0 18px 18px 0; }
      .steam { position: absolute; width: 10px; height: 60px; border-radius: 10px; background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.35)); }
      #st-me { position: absolute; left: 20px; top: 390px; width: 380px; height: 380px; }
      #st-me .avatar, #dg-abp .avatar, #dg-yup .avatar { width: 100%; height: 100%; }
      #st-arm { position: absolute; left: 250px; top: 640px; width: 190px; height: 120px; }
      #st-bigq { position: absolute; left: 250px; top: 300px; font-family: "Num"; font-size: 160px; font-weight: 700; color: var(--gold); }
      .lampc { position: absolute; left: 330px; top: 240px; width: 360px; height: 500px; background: radial-gradient(ellipse at 50% 0%, rgba(255,220,140,.22), transparent 70%); }
      .room2 .wall { background: linear-gradient(180deg, #2a2138 0%, #1c1628 75%); }
      .city { position: absolute; left: 60px; top: 60px; width: 420px; height: 260px; border-radius: 16px; overflow: hidden; border: 10px solid #3a2e4a; background: linear-gradient(180deg, #ff9a6b, #6b4bb8 70%); }
      .bld { position: absolute; bottom: 0; background: #2a1f3d; }
      .tv { position: absolute; right: 50px; top: 60px; width: 380px; height: 220px; border-radius: 14px; background: #070b17; border: 10px solid #111; overflow: hidden; }
      .tv svg { width: 100%; height: 100%; }
      .plant { position: absolute; left: 470px; top: 560px; width: 70px; height: 160px; }
      .table { position: absolute; left: -20px; right: -20px; top: 790px; height: 200px; background: linear-gradient(180deg, #7a5436, #5a3b25); border-top: 10px solid #9a7050; }
      .cup { position: absolute; top: 752px; width: 64px; height: 46px; border-radius: 0 0 26px 26px; background: #f2ede3; }
      .pot { position: absolute; left: 468px; top: 730px; width: 110px; height: 70px; border-radius: 40px 40px 30px 30px; background: #b85c38; }
      #dg-abp { position: absolute; left: 10px; top: 470px; width: 380px; height: 380px; }
      #dg-yup { position: absolute; right: 10px; top: 480px; width: 360px; height: 360px; }
      .sb { position: absolute; padding: 26px 34px; border-radius: 30px; font-size: 48px; font-weight: 900; line-height: 1.3; }
      .sb::after { content: ""; position: absolute; bottom: -26px; width: 0; height: 0; border: 16px solid transparent; }
      #dg-b1 { left: 40px; top: 360px; background: #fff7e0; color: #1d1400; }
      #dg-b1::after { left: 120px; border-top: 16px solid #fff7e0; border-left: 16px solid #fff7e0; }
      #dg-b2 { right: 40px; top: 395px; background: #2b67ff; color: #fff; }
      #dg-b2::after { right: 110px; border-top: 16px solid #2b67ff; border-right: 16px solid #2b67ff; }
      .dots3 { position: absolute; display: flex; gap: 10px; padding: 22px 26px; border-radius: 24px; background: rgba(255,255,255,.14); }
      .dots3 i { width: 14px; height: 14px; border-radius: 50%; background: #fff; display: block; opacity: .7; }
      /* crowd + relay + duo */
      .crowd { position: absolute; left: 40px; right: 40px; top: 832px; height: 170px; display: flex; justify-content: space-between; }
      .crowd .p { width: 170px; height: 170px; position: relative; }
      .crowd .avatar { width: 170px; height: 170px; }
      .crowd-lab { position: absolute; left: 0; right: 0; top: 796px; text-align: center; font-size: 26px; font-weight: 700; color: var(--mute); }
      .relay { position: absolute; left: 40px; right: 40px; top: 840px; height: 170px; }
      .relay .p { position: absolute; top: 0; width: 170px; height: 170px; }
      .relay .avatar { width: 170px; height: 170px; }
      .relay-lab { position: absolute; left: 0; right: 0; top: 800px; text-align: center; font-size: 28px; font-weight: 900; color: var(--up); }
      #pr-baton { position: absolute; top: 915px; left: 0; width: 70px; height: 34px; border-radius: 17px; background: linear-gradient(90deg, #ffd666, #ff9f1a); color: #231800; font-family: "Num"; font-weight: 700; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px rgba(255,197,61,.7); }
      .duo { position: absolute; top: 810px; width: 190px; height: 190px; }
      .duo .avatar { width: 190px; height: 190px; }
      /* cta */
      #ct-q { position: absolute; left: 60px; right: 60px; top: 70px; font-size: 70px; font-weight: 900; line-height: 1.25; }
      .opts { position: absolute; left: 60px; right: 60px; top: 220px; display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
      .opt { display: flex; align-items: center; gap: 18px; padding: 24px 26px; border-radius: 22px; background: #13224a; border: 2px solid rgba(140,170,255,.25); font-size: 44px; font-weight: 900; }
      .opt b { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: var(--gold); color: #231800; font-family: "Num"; font-size: 44px; }
      #ct-box { position: absolute; left: 60px; right: 60px; top: 500px; height: 110px; border-radius: 55px; background: #0a1430; border: 2px solid rgba(255,255,255,.2); display: flex; align-items: center; padding: 0 36px; gap: 16px; font-size: 40px; font-weight: 700; color: var(--mute); }
      #ct-typed { color: var(--ink); }
      #ct-caret { width: 4px; height: 50px; background: var(--cyan); }
      #ct-follow { position: absolute; left: 50%; top: 670px; width: 560px; margin-left: -280px; height: 120px; border-radius: 60px; background: linear-gradient(90deg,#ff3d5a,#ff6a3d); display: flex; align-items: center; justify-content: center; gap: 18px; font-size: 50px; font-weight: 900; box-shadow: 0 12px 40px rgba(255,61,90,.35); overflow: hidden; }
      #ct-follow .done { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #243152; color: #c9d4f1; opacity: 0; }
      #ct-rip { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,.55); }
      #ct-hand { position: absolute; left: 620px; top: 740px; width: 110px; height: 110px; }
      #ct-sub { position: absolute; left: 0; right: 0; top: 860px; text-align: center; font-size: 34px; font-weight: 700; color: var(--mute); }
      .spk-aben { background: var(--gold); color: #231800; }
      .spk-xiaoyu { background: var(--cyan); color: #04202c; }

      /* scenes live in the stage box */
      .scene { position: absolute; left: 40px; top: 276px; width: 1000px; height: 960px; overflow: hidden; }
      .sin { position: absolute; inset: 0; }
      .kick { position: absolute; left: 50px; top: 44px; font-size: 26px; font-weight: 700; color: var(--mute); letter-spacing: 3px; }
      .kick b { color: var(--cyan); margin-right: 10px; }

      /* hook */
      #hk-ring { position: absolute; left: 290px; top: 110px; width: 420px; height: 420px; }
      #hk-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .hk-mid { position: absolute; left: 290px; top: 110px; width: 420px; height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .hk-mid .l1 { font-size: 40px; font-weight: 700; color: var(--mute); }
      .hk-mid .l2 { font-size: 150px; font-weight: 700; line-height: 1; }
      .hk-mid .l2 small { font-size: 60px; margin-left: 8px; color: var(--gold); }
      #hk-q { position: absolute; left: 0; right: 0; top: 620px; text-align: center; }
      #hk-q .a { font-size: 58px; font-weight: 900; color: var(--mute); }
      #hk-q .b { font-size: 84px; font-weight: 900; margin-top: 10px; }
      #hk-qm { position: absolute; right: 70px; top: 90px; font-size: 220px; font-weight: 900; color: var(--gold); font-family: "Num"; }

      /* struggle */
      .tline { position: absolute; left: 60px; right: 60px; top: 110px; height: 110px; }
      .tline .bar { position: absolute; left: 30px; right: 30px; top: 22px; height: 6px; background: rgba(255,255,255,.12); border-radius: 3px; }
      .tline .fill { position: absolute; left: 30px; width: 820px; top: 22px; height: 6px; background: linear-gradient(90deg, var(--cyan), var(--gold)); border-radius: 3px; transform-origin: 0 50%; }
      .tnode { position: absolute; top: 10px; width: 200px; margin-left: -100px; text-align: center; }
      .tnode i { display: block; width: 30px; height: 30px; margin: 0 auto; border-radius: 50%; background: #0a1226; border: 5px solid var(--cyan); }
      .tnode .tt { margin-top: 14px; font-size: 34px; font-weight: 700; }
      .tnode .ts { font-size: 24px; color: var(--mute); margin-top: 2px; }
      .list { position: absolute; left: 90px; right: 90px; top: 290px; height: 600px; border-radius: 22px; background: rgba(8,14,30,.8); border: 1px solid var(--line); overflow: hidden; }
      .list .lh { position: absolute; left: 0; right: 0; top: 0; height: 70px; display: flex; align-items: center; padding: 0 30px; font-size: 28px; font-weight: 900; color: var(--gold); background: #1b2238; z-index: 2; }
      .list .lh span { margin-left: auto; font-size: 22px; color: var(--mute); font-weight: 500; }
      .rows { position: absolute; left: 0; right: 0; top: 70px; }
      .row { height: 74px; display: flex; align-items: center; padding: 0 30px; gap: 22px; border-bottom: 1px solid rgba(255,255,255,.05); font-size: 32px; }
      .rk { width: 40px; color: var(--mute); font-family: "Num"; font-size: 30px; }
      .nm { width: 250px; font-weight: 700; }
      .spark { flex: 1; height: 4px; background: linear-gradient(90deg, rgba(255,77,79,0), rgba(255,77,79,.6)); border-radius: 2px; }
      .pct { font-family: "Num"; font-weight: 700; font-size: 38px; color: var(--up); width: 150px; text-align: right; }
      #st-fog { position: absolute; left: 90px; right: 90px; top: 290px; height: 600px; border-radius: 22px; background: rgba(7,13,28,.72); display: flex; align-items: center; justify-content: center; }
      #st-fog .qq { font-size: 200px; font-weight: 900; color: var(--gold); font-family: "Num"; }
      .qpill { position: absolute; padding: 14px 28px; border-radius: 40px; background: #1a2a52; border: 2px solid rgba(255,255,255,.18); font-size: 34px; font-weight: 700; }

      /* dialog */
      .chat { position: absolute; left: 50px; right: 50px; top: 120px; bottom: 60px; }
      .msg { position: absolute; left: 0; right: 0; display: flex; gap: 22px; align-items: flex-start; }
      .msg.r { flex-direction: row-reverse; }
      .av { flex: none; width: 110px; height: 110px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 50px; font-weight: 900; }
      .av-b { background: linear-gradient(135deg, #ffd666, #ff9f1a); color: #2a1800; box-shadow: 0 0 0 6px rgba(255,197,61,.18); }
      .av-y { background: linear-gradient(135deg, #7ee0ff, #3a8dff); color: #04192c; box-shadow: 0 0 0 6px rgba(76,201,240,.18); }
      .who { font-size: 26px; color: var(--mute); margin-bottom: 10px; font-weight: 700; }
      .msg.r .who { text-align: right; }
      .bub { padding: 30px 38px; border-radius: 30px; font-size: 50px; font-weight: 900; line-height: 1.3; max-width: 640px; }
      .bub-b { background: #fff7e0; color: #1d1400; border-top-left-radius: 8px; }
      .bub-y { background: #2b67ff; color: #fff; border-top-right-radius: 8px; }
      .typing { display: flex; gap: 10px; padding: 26px 30px; border-radius: 26px; background: rgba(255,255,255,.12); width: 140px; }
      .typing i { width: 16px; height: 16px; border-radius: 50%; background: #fff; display: block; opacity: .6; }
      .mini { margin-top: 18px; width: 420px; border-radius: 16px; background: #0a1430; border: 1px solid var(--line); padding: 12px 18px; margin-left: auto; }
      .mini div { display: flex; justify-content: space-between; font-size: 24px; padding: 4px 0; }
      .mini b { color: var(--up); font-family: "Num"; font-size: 28px; }

      /* money */
      #mo-core { position: absolute; left: 300px; top: 280px; width: 400px; height: 400px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,197,61,.28), rgba(255,197,61,.03) 62%, transparent 70%); }
      #mo-core .yen { font-size: 140px; font-weight: 700; color: var(--gold); font-family: "Num"; line-height: 1; }
      #mo-core .t { font-size: 58px; font-weight: 900; margin-top: 6px; }
      .mbox { position: absolute; width: 230px; height: 130px; border-radius: 22px; border: 3px dashed rgba(255,255,255,.3); display: flex; align-items: center; justify-content: center; font-size: 70px; font-weight: 900; color: rgba(255,255,255,.5); font-family: "Num"; }
      .coin { position: absolute; width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff2b8, #ffb400); box-shadow: 0 0 12px rgba(255,197,61,.8); left: 487px; top: 467px; }
      #mo-ask { position: absolute; left: 0; right: 0; top: 790px; text-align: center; font-size: 48px; font-weight: 900; }

      /* modes */
      .mgrid { position: absolute; left: 40px; right: 40px; top: 110px; bottom: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
      .mcard { position: relative; border-radius: 26px; background: linear-gradient(180deg, #152650, #0f1b3a); border: 2px solid rgba(140,170,255,.2); padding: 26px 26px 20px; overflow: hidden; }
      .mc-h { display: flex; align-items: baseline; gap: 14px; }
      .mc-idx { font-family: "Num"; font-size: 34px; color: var(--cyan); font-weight: 700; }
      .mc-n { font-size: 50px; font-weight: 900; }
      .mc-svg { display: block; width: 100%; height: 190px; margin-top: 30px; }
      .mc-sub { margin-top: 18px; font-size: 27px; color: var(--mute); font-weight: 700; }

      /* premium / fail charts */
      .ch { position: absolute; left: 60px; right: 60px; top: 120px; height: 540px; border-radius: 24px; background: rgba(8,14,30,.75); border: 1px solid var(--line); }
      .ch .ct { position: absolute; left: 30px; top: 22px; font-size: 30px; font-weight: 900; }
      .ch .cs { position: absolute; right: 30px; top: 28px; font-size: 22px; color: var(--mute); }
      .base { position: absolute; left: 30px; right: 30px; height: 3px; background: rgba(255,255,255,.35); }
      .bars { position: absolute; left: 60px; right: 60px; bottom: 60px; height: 360px; display: flex; align-items: flex-end; justify-content: space-between; }
      .bcol { width: 110px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
      .bbar, .fbar { width: 100%; border-radius: 12px 12px 0 0; transform-origin: 50% 100%; }
      .up-b { background: linear-gradient(180deg, #ff7a7a, #e0282c); box-shadow: 0 0 24px rgba(255,77,79,.35); }
      .dn-b { background: linear-gradient(0deg, #52e0a4, #0d9b60); border-radius: 0 0 12px 12px; transform-origin: 50% 0%; box-shadow: 0 0 24px rgba(25,195,125,.3); }
      .bval { font-family: "Num"; font-weight: 700; font-size: 38px; margin-bottom: 10px; }
      .up-t { color: var(--up); } .dn-t { color: var(--down); }
      .blab { position: absolute; bottom: -48px; font-family: "Num"; font-size: 28px; color: var(--mute); }
      .bcol { position: relative; }
      .tagrow { position: absolute; left: 60px; right: 60px; top: 690px; display: flex; align-items: center; gap: 18px; }
      .tg1 { display: flex; align-items: center; gap: 14px; padding: 16px 26px; border-radius: 18px; background: #0f1b3a; border: 2px solid rgba(255,255,255,.2); font-size: 44px; font-weight: 900; }
      .ic { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; color: #fff; }
      .ic-ok { background: #0d9b60; } .ic-no { background: #e0282c; }
      .arrow { font-size: 50px; color: var(--mute); font-weight: 900; }
      .tg2 { padding: 16px 30px; border-radius: 18px; font-size: 48px; font-weight: 900; }
      .tg2-g { background: linear-gradient(90deg, var(--gold2), var(--gold)); color: #231800; }
      .tg2-x { background: #2a3552; color: #c9d4f1; }

      #pr-relay b { color: var(--up); font-size: 40px; }
      .today { position: absolute; left: 70px; bottom: 250px; width: 150px; display: flex; flex-direction: column; align-items: center; }
      .today .tv { font-family: "Num"; font-weight: 700; font-size: 40px; color: var(--up); margin-bottom: 8px; }
      .today .tb { width: 120px; height: 140px; border-radius: 12px 12px 0 0; background: linear-gradient(180deg, #ff7a7a, #e0282c); transform-origin: 50% 100%; }
      .today .tl2 { position: absolute; bottom: -44px; font-size: 26px; color: var(--mute); font-weight: 700; white-space: nowrap; }
      .fzone { position: absolute; left: 290px; right: 40px; top: 293px; height: 150px; display: flex; justify-content: space-between; }
      .fcol { width: 70px; display: flex; flex-direction: column; align-items: center; }
      .fval { font-family: "Num"; font-weight: 700; font-size: 26px; margin-top: 6px; }
      .flab { position: absolute; left: 290px; right: 40px; top: 240px; text-align: center; font-size: 26px; color: var(--mute); font-weight: 700; }
      #fa-stamp { position: absolute; right: 90px; top: 200px; padding: 10px 26px; border: 6px solid var(--up); color: var(--up); font-size: 54px; font-weight: 900; border-radius: 14px; transform: rotate(-10deg); }

      /* realize */
      .rc { position: absolute; left: 70px; right: 70px; height: 250px; border-radius: 28px; padding: 36px 44px; }
      #re-a { top: 150px; background: #121c33; border: 2px solid rgba(255,255,255,.12); }
      #re-b { top: 520px; background: linear-gradient(135deg, #1c2f63, #16244c); border: 2px solid rgba(255,197,61,.55); box-shadow: 0 0 60px rgba(255,197,61,.12); }
      .rc .rk2 { font-size: 30px; font-weight: 700; color: var(--mute); }
      .rc .rt { position: relative; display: inline-block; margin-top: 22px; font-size: 64px; font-weight: 900; }
      #re-strike { position: absolute; left: -10px; right: -10px; top: 52%; height: 10px; border-radius: 5px; background: var(--up); transform-origin: 0 50%; }
      #re-a .rt { color: #7f8aa6; }
      .rbadge { position: absolute; right: 44px; top: 36px; width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 50px; font-weight: 900; }
      #re-arrow { position: absolute; left: 0; right: 0; top: 430px; text-align: center; font-size: 60px; color: var(--gold); font-weight: 900; }

      /* close */
      .cl-lines { position: absolute; left: 70px; right: 70px; top: 90px; }
      .cl-l { font-size: 60px; font-weight: 900; line-height: 1.5; }
      .cl-l .n { font-family: "Num"; color: var(--cyan); margin-right: 18px; }
      #cl-big { position: absolute; left: 0; right: 0; top: 420px; text-align: center; }
      #cl-big .w { position: relative; display: inline-block; font-size: 150px; font-weight: 900; letter-spacing: 8px; color: var(--gold); text-shadow: 0 0 60px rgba(255,197,61,.35); }
      #cl-big .s { font-size: 46px; font-weight: 900; margin-top: 8px; }
      .cl-chips { position: absolute; left: 50px; right: 50px; top: 760px; display: flex; justify-content: center; gap: 18px; }
      .cl-chips div { padding: 14px 22px; border-radius: 16px; background: #15254d; border: 2px solid rgba(76,201,240,.35); font-size: 30px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="1080" data-height="1920">

      <div id="bg" class="clip full" data-start="0" data-duration="${D}" data-track-index="0">
        <div class="grid" id="bg-grid"></div><div class="glow1" id="bg-g1"></div><div class="glow2" id="bg-g2"></div><div class="vig"></div>
      </div>

      <div id="frame" class="clip full" data-start="0" data-duration="${D}" data-track-index="1">
        <div class="brand"><i></i>复盘观察</div>
        <div class="hdr">
          <div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
          <div class="live"><b id="live-dot"></b>实时研判中</div>
          <div class="chip">股市复盘 · 行情看板</div>
          <div class="segs">${segs}</div>
        </div>
        <div class="stage"><div class="sgrid"></div></div>
        <div class="tcard">
          <div class="tag">复盘核心逻辑</div>
          <div class="ttl">复盘到底该看什么？看懂<u>「赚钱效应」</u>才算入门</div>
          <div class="badge" id="badge"><div class="b1">核心信号</div><div class="b2">抓主线</div></div>
        </div>
        <div class="disc">交易认知分享 · 图表均为示意 · 不构成投资建议</div>
      </div>

      <!-- 1 hook -->
      <section id="sc-hook" class="clip scene" ${sceneAttrs("hook")}><div class="sin" id="hk-in"><div class="cam" id="hk-cam"><div class="pun" id="hk-pun">
        <div id="hk-head">
          <div class="h1"><span>复盘</span><span id="hk-3">3</span><small>小时</small>
            <svg id="hk-clock" viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="8"/><circle cx="75" cy="75" r="6" fill="#ffc53d"/><line id="hk-hand1" x1="75" y1="75" x2="75" y2="26" stroke="#ffc53d" stroke-width="8" stroke-linecap="round"/><line id="hk-hand2" x1="75" y1="75" x2="110" y2="75" stroke="#eef3ff" stroke-width="8" stroke-linecap="round"/></svg></div>
          <div class="h2" id="hk-h2">第二天还是<em id="hk-mc">不知道买什么</em></div>
        </div>
        <div id="hk-yu">${avatar("yu0", "xiaoyu")}<div class="sweat" id="hk-sw" style="left:236px;top:40px"></div><div class="qm" id="hk-q1" style="left:250px;top:-40px;font-size:110px">?</div><div class="qm" id="hk-q2" style="left:-20px;top:-10px;font-size:80px">?</div></div>
        <div id="hk-stamp"><small>问题出在</small>看错了东西</div>
      </div></div></div></section>

      <!-- 2 struggle -->
      <section id="sc-struggle" class="clip scene" ${sceneAttrs("struggle")}><div class="sin" id="st-in"><div class="cam" id="st-cam"><div class="pun" id="st-pun">
        <div class="room" id="st-room">
          <div class="wall"></div>
          <div class="win"><div class="sky-n"></div><div class="sky-d" id="st-day"></div><i class="star" style="left:30px;top:30px"></i><i class="star" style="left:90px;top:110px"></i><i class="star" style="left:140px;top:60px"></i><i class="star" style="left:40px;top:170px"></i><i class="star" style="left:250px;top:150px"></i><i class="star" style="left:210px;top:200px"></i><i class="star" style="left:110px;top:220px"></i><div id="st-moon"></div><div id="st-sun"></div><div class="bar1"></div><div class="bar2"></div></div>
          <div class="clockw"><svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="76" fill="#f4f1ea" stroke="#26324f" stroke-width="10"/>${[0,1,2,3,4,5,6,7,8,9,10,11].map(k=>`<line x1="85" y1="16" x2="85" y2="${k%3?26:32}" stroke="#26324f" stroke-width="${k%3?3:6}" transform="rotate(${k*30} 85 85)"/>`).join("")}<line id="st-hh" x1="85" y1="85" x2="85" y2="44" stroke="#1b1e2c" stroke-width="9" stroke-linecap="round"/><line id="st-mh" x1="85" y1="85" x2="85" y2="28" stroke="#e0282c" stroke-width="6" stroke-linecap="round"/><circle cx="85" cy="85" r="7" fill="#1b1e2c"/></svg>
            <div class="clab"><span id="st-l1">收盘 15:00</span><span id="st-l2" style="color:#9fb3ff">深夜 23:47</span><span id="st-l3" style="color:var(--gold)">次日 09:30</span></div></div>
          <div class="lampc" id="st-lamp"></div>
          <div class="mon" data-layout-allow-overlap data-layout-allow-occlusion><div class="lh2" data-layout-allow-overlap data-layout-allow-occlusion>今日涨幅榜<span>示意</span></div><div class="rows" id="st-rows" data-layout-allow-overlap data-layout-allow-occlusion>${listRows}</div><div id="st-dim"></div></div>
          <div class="stand"></div>
          <div id="st-me">${person("st-yuv", { ...XIAOYU, sweat: true })}</div>
          <div class="desk"></div>
          <div class="kbd"></div>
          <svg id="st-arm" viewBox="0 0 190 120"><path d="M10 20 Q80 20 150 80" stroke="#2b7bff" stroke-width="44" stroke-linecap="round" fill="none"/><circle cx="160" cy="88" r="22" fill="#f6d3b3"/></svg>
          <div class="mug"></div><i class="steam" id="st-s1" style="left:790px;top:630px"></i><i class="steam" id="st-s2" style="left:815px;top:620px"></i><i class="steam" id="st-s3" style="left:840px;top:635px"></i>
          <div id="st-bigq">?</div>
          <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q1" style="left:470px;top:330px">追哪个？</div>
          <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q2" style="left:600px;top:450px">低吸哪个？</div>
          <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q3" style="left:500px;top:570px">还是空仓？</div>
        </div>
      </div></div></div></section>

      <!-- 3 dialog -->
      <section id="sc-dialog" class="clip scene" ${sceneAttrs("dialog")}><div class="sin" id="dg-in"><div class="cam" id="dg-cam"><div class="pun" id="dg-pun">
        <div class="room room2">
          <div class="wall"></div>
          <div class="city"><i class="bld" style="left:0px;width:60px;height:120px"></i><i class="bld" style="left:55px;width:50px;height:180px"></i><i class="bld" style="left:100px;width:70px;height:90px"></i><i class="bld" style="left:165px;width:40px;height:210px"></i><i class="bld" style="left:200px;width:80px;height:140px"></i><i class="bld" style="left:275px;width:50px;height:170px"></i><i class="bld" style="left:320px;width:90px;height:110px"></i></div>
          <div class="tv"><svg viewBox="0 0 360 200"><rect x="20" y="120" width="20" height="40" fill="#ff4d4f"/><rect x="54" y="100" width="20" height="40" fill="#ff4d4f"/><rect x="88" y="110" width="20" height="30" fill="#19c37d"/><rect x="122" y="80" width="20" height="50" fill="#ff4d4f"/><rect x="156" y="70" width="20" height="30" fill="#ff4d4f"/><rect x="190" y="80" width="20" height="40" fill="#19c37d"/><rect x="224" y="60" width="20" height="40" fill="#ff4d4f"/><rect x="258" y="40" width="20" height="40" fill="#ff4d4f"/><rect x="292" y="50" width="20" height="30" fill="#19c37d"/><rect x="326" y="30" width="20" height="40" fill="#ff4d4f"/><polyline points="10,150 60,140 110,130 160,110 210,100 260,80 310,60 350,50" fill="none" stroke="#ffc53d" stroke-width="4"/></svg></div>
          <svg class="plant" viewBox="0 0 70 160"><path d="M35 110 Q10 60 20 20 Q40 60 35 110Z M35 110 Q60 50 55 10 Q30 60 35 110Z M35 110 Q0 90 5 50 Q30 80 35 110Z" fill="#2f9e6e"/><rect x="12" y="105" width="46" height="55" rx="8" fill="#c26a3a"/></svg>
          <div id="dg-abp">${person("dg-ab", ABEN)}</div>
          <div id="dg-yup">${person("dg-yu", { ...XIAOYU, sweat: true })}</div>
          <div class="table"></div>
          <div class="cup" style="left:300px"></div><div class="cup" style="left:640px"></div><div class="pot"></div>
          <i class="steam" id="dg-s1" style="left:320px;top:690px"></i><i class="steam" id="dg-s2" style="left:660px;top:690px"></i>
          <div class="dots3" id="dg-t1" style="left:60px;top:380px"><i></i><i></i><i></i></div>
          <div class="sb" id="dg-b1">你昨天到底看了什么？</div>
          <div class="dots3" id="dg-t2" style="right:60px;top:400px"><i></i><i></i><i></i></div>
          <div class="sb" id="dg-b2">看哪些股票涨得好啊</div>
        </div>
      </div></div></div></section>

      <!-- 4 money -->
      <section id="sc-money" class="clip scene" ${sceneAttrs("money")}><div class="sin" id="mo-in"><div class="cam" id="mo-cam"><div class="pun" id="mo-pun">
        <div class="kick"><b>●</b>阿本的复盘角度</div>
        <div id="mo-ab">${avatar("mo-abv", "aben")}</div>
        <div class="mbox" id="mo-b1" style="left:60px;top:130px">?</div>
        <div class="mbox" id="mo-b2" style="right:60px;top:130px">?</div>
        <div class="mbox" id="mo-b3" style="left:60px;top:600px">?</div>
        <div class="mbox" id="mo-b4" style="right:60px;top:600px">?</div>
        ${Array.from({ length: 16 }, (_, i) => `<div class="coin" id="mo-c${i}"></div>`).join("")}
        <div id="mo-core"><div class="yen">¥</div><div class="t">今天的钱</div></div>
        <div id="mo-ask">是从<em>哪一类</em>股票上赚出来的？</div>
      </div></div></div></section>

      <!-- 5 modes -->
      <section id="sc-modes" class="clip scene" ${sceneAttrs("modes")}><div class="sin" id="md-in"><div class="cam" id="md-cam"><div class="pun" id="md-pun">
        <div class="kick"><b>●</b>今天的钱来自哪种模式</div>
        <div class="mgrid">${modeCards}</div>
      </div></div></div></section>

      <!-- 6 premium -->
      <section id="sc-premium" class="clip scene" ${sceneAttrs("premium")}><div class="sin" id="pr-in"><div class="cam" id="pr-cam"><div class="pun" id="pr-pun">
        <div class="kick"><b>●</b>验证一：次日还有没有溢价</div>
        <div class="ch"><div class="ct">同一模式 · 次日平均溢价</div><div class="cs">示意数据</div>
          <div class="base" style="bottom:60px"></div>
          <div class="bars">${premBars}</div>
        </div>
        <div class="tagrow" id="pr-tags"><div class="tg1" id="pr-t1"><span class="ic ic-ok">✓</span>持续溢价</div><div class="arrow" id="pr-ar">→</div><div class="tg2 tg2-g" id="pr-t2">资金认可</div></div>
        <div class="relay-lab" id="pr-rl">资金继续接力 ▶</div>
        <div class="relay" id="pr-relay"><div class="p" id="pr-p0" style="left:40px">${person("pr-a0", { ...CROWD[0], top: "#e0282c" })}</div><div class="p" id="pr-p1" style="left:375px">${person("pr-a1", { ...CROWD[3], top: "#e0282c" })}</div><div class="p" id="pr-p2" style="left:710px">${person("pr-a2", { ...CROWD[1], top: "#e0282c" })}</div></div>
        <div id="pr-baton">¥</div>
      </div></div></div></section>

      <!-- 7 fail -->
      <section id="sc-fail" class="clip scene" ${sceneAttrs("fail")}><div class="sin" id="fa-in"><div class="cam" id="fa-cam"><div class="pun" id="fa-pun">
        <div class="kick"><b>●</b>验证二：强势之后是否集体低开</div>
        <div class="ch"><div class="ct">今天 vs 次日开盘</div><div class="cs">示意数据</div>
          <div class="base" style="top:290px;left:260px" id="fa-base"></div>
          <div class="today"><div class="tv" id="fa-tv">+10%</div><div class="tb" id="fa-tb"></div><div class="tl2">今天看起来很强</div></div>
          <div class="flab" id="fa-lab">次日开盘 · 同类个股</div>
          <div class="fzone">${failBars}</div>
        </div>
        <div class="tagrow" id="fa-tags"><div class="tg1" id="fa-t1"><span class="ic ic-no">✕</span>集体低开</div><div class="arrow" id="fa-ar">→</div><div class="tg2 tg2-x" id="fa-t2">模式失效</div></div>
        <div id="fa-stamp">不好做了</div>
        <div class="crowd-lab">昨天追进去的人</div>
        <div class="crowd" id="fa-crowd">${CROWD.map((c, i) => `<div class="p" id="fa-p${i}">${person("fa-c" + i, { ...c, sweat: true })}</div>`).join("")}</div>
      </div></div></div></section>

      <!-- 8 realize -->
      <section id="sc-realize" class="clip scene" ${sceneAttrs("realize")}><div class="sin" id="re-in"><div class="cam" id="re-cam"><div class="pun" id="re-pun">
        <div class="kick"><b>●</b>小于这才发现</div>
        <svg id="re-bulb" viewBox="0 0 70 90"><circle id="re-glow" cx="35" cy="32" r="34" fill="rgba(255,197,61,.35)"/><path d="M35 6 C18 6 8 18 8 32 C8 44 18 50 22 60 H48 C52 50 62 44 62 32 C62 18 52 6 35 6Z" id="re-bb" fill="#56607a"/><rect x="23" y="62" width="24" height="8" rx="3" fill="#8a9bc2"/><rect x="25" y="72" width="20" height="7" rx="3" fill="#8a9bc2"/></svg>
        <div id="re-yu">${avatar("re-yuv", "xiaoyu")}</div>
        <div class="rc" id="re-a"><div class="rk2">复盘不是为了</div><div class="rt">猜明天哪只会涨<div id="re-strike"></div></div><div class="rbadge" style="background:#3a2230;color:var(--up)" id="re-x">✕</div></div>
        <div id="re-arrow">↓</div>
        <div class="rc" id="re-b"><div class="rk2">而是先看清</div><div class="rt">什么机会更易被<em>资金认可</em></div><div class="rbadge" style="background:var(--gold);color:#231800" id="re-ok">✓</div></div>
      </div></div></div></section>

      <!-- 9 close -->
      <section id="sc-close" class="clip scene" ${sceneAttrs("close")}><div class="sin" id="cl-in"><div class="cam" id="cl-cam"><div class="pun" id="cl-pun">
        <div class="cl-lines">
          <div class="cl-l" id="cl-l1"><span class="n">01</span>别先猜明天</div>
          <div class="cl-l" id="cl-l2"><span class="n">02</span>先看今天的钱怎么赚出来</div>
        </div>
        <div id="cl-big"><div class="w" id="cl-w">赚钱效应</div><div class="s" id="cl-s">才是市场最直接的信号</div></div>
        <div class="duo" id="cl-yu" style="left:20px">${person("cl-yuv", XIAOYU)}</div><div class="duo" id="cl-ab" style="right:20px">${person("cl-abv", ABEN)}</div>
        <div class="flash" id="cl-flash"></div>
        <div class="cl-chips" id="cl-chips"><div>钱在哪类股</div><div>次日有无溢价</div><div>模式强还是弱</div></div>
      </div></div></div></section>

      <!-- 10 cta -->
      <section id="sc-cta" class="clip scene" ${sceneAttrs("cta")}><div class="sin" id="ct-in"><div class="cam" id="ct-cam"><div class="pun" id="ct-pun">
        <div id="ct-q">你复盘时，<em>先看哪一类</em>？</div>
        <div class="opts"><div class="opt" id="ct-o1"><b>A</b>高位股</div><div class="opt" id="ct-o2"><b>B</b>低位新方向</div><div class="opt" id="ct-o3"><b>C</b>趋势</div><div class="opt" id="ct-o4"><b>D</b>反包</div></div>
        <div id="ct-box"><span style="color:#b4c0dc">评论区：</span><span id="ct-typed">我先看 B</span><i id="ct-caret"></i></div>
        <div id="ct-follow"><span data-layout-allow-overlap data-layout-allow-occlusion>＋ 关注 复盘观察</span><div class="done" id="ct-done" data-layout-allow-overlap>✓ 已关注</div><div id="ct-rip"></div></div>
        <svg id="ct-hand" viewBox="0 0 110 110"><circle cx="40" cy="36" r="22" fill="rgba(255,255,255,.25)"/><path d="M36 20 C36 12 48 12 48 20 V52 L70 56 C80 58 84 64 82 74 L76 100 H40 L22 70 C18 64 26 58 32 64 L36 68Z" fill="#f6d3b3" stroke="#1b1e2c" stroke-width="4"/></svg>
        <div id="ct-sub">每天拆一个复盘信号</div>
      </div></div></div></section>

      ${caps}

      <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="${D}" data-track-index="30" data-volume="1"></audio>
    </div>

    <script>
      const T = ${JSON.stringify({ scenes: T.scenes, phrases: T.phrases.map((p) => ({ scene: p.scene, start: p.start, end: p.end, text: p.text, s: p.s })) })};
      const D = ${D};
      const S = {}; T.scenes.forEach((s) => (S[s.id] = s));
      const P = (id, i) => T.phrases.filter((p) => p.scene === id)[i].start;
      const PE = (id, i) => T.phrases.filter((p) => p.scene === id)[i].end;
      const tl = gsap.timeline({ paused: true });

      // ambient
      tl.fromTo("#bg-grid", { y: 0 }, { y: 60, duration: D, ease: "none" }, 0);
      tl.fromTo("#bg-g1", { x: 0, y: 0 }, { x: 160, y: 120, duration: D, ease: "sine.inOut" }, 0);
      tl.fromTo("#bg-g2", { x: 0, y: 0 }, { x: -140, y: -200, duration: D, ease: "sine.inOut" }, 0);
      tl.fromTo("#live-dot", { opacity: 1 }, { opacity: 0.25, duration: 0.6, repeat: Math.max(0, Math.floor(D / 0.6) - 1), yoyo: true, ease: "sine.inOut" }, 0);
      tl.fromTo("#badge", { rotation: -4 }, { rotation: 3, duration: 1.6, repeat: Math.max(0, Math.floor(D / 1.6) - 1), yoyo: true, ease: "sine.inOut" }, 0);
      T.scenes.forEach((s, i) => tl.fromTo("#segf-" + i, { scaleX: 0 }, { scaleX: 1, duration: s.end - s.start, ease: "none" }, s.start));

      // scene in/out
      T.scenes.forEach((s, i) => {
        const el = "#" + ({hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl",cta:"ct"})[s.id] + "-in";
        if (i > 0) tl.fromTo(el, { opacity: 0, x: 90, scale: 0.97 }, { opacity: 1, x: 0, scale: 1, duration: 0.42, ease: "power3.out" }, s.start);
        if (i < T.scenes.length - 1) tl.to(el, { opacity: 0, x: -90, scale: 0.97, duration: 0.26, ease: "power2.in" }, s.end - 0.28);
      });

      // helpers
      const PU = "，。？！、：；,.?!";
      const PH = (id, i) => T.phrases.filter((p) => p.scene === id)[i];
      function KT(id, i, word) { const p = PH(id, i); const k = p.text.indexOf(word); const n = [...p.text].filter((c) => !PU.includes(c)).length; const pre = [...p.text.slice(0, Math.max(0, k))].filter((c) => !PU.includes(c)).length; return p.start + (pre / n) * (p.end - p.start); }
      function flap(sel, a, b) { const n = Math.max(1, Math.floor((b - a) / 0.13)); tl.fromTo(sel, { scaleY: 0.35 }, { scaleY: 1.25, duration: 0.065, repeat: n * 2 - 1, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 50%", immediateRender: false }, a); tl.to(sel, { scaleY: 0.45, duration: 0.06, transformOrigin: "50% 50%" }, b); }
      function punch(code, t, amt) { tl.to("#" + code + "-pun", { scale: amt || 1.06, duration: 0.12, ease: "power2.out" }, t); tl.to("#" + code + "-pun", { scale: 1, duration: 0.55, ease: "power2.inOut" }, t + 0.12); }
      const CODE = {hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl",cta:"ct"};
      document.querySelectorAll('[id$="-m"]').forEach((m) => tl.set(m, { scaleY: 0.45, transformOrigin: "50% 50%" }, 0));
      // slow camera drift per scene
      T.scenes.forEach((s) => tl.fromTo("#" + CODE[s.id] + "-cam", { scale: 1 }, { scale: 1.045, duration: s.end - s.start + 0.1, ease: "none" }, s.start));

      // captions
      document.querySelectorAll(".cap").forEach((c) => {
        const st = parseFloat(c.dataset.start);
        tl.fromTo(c.querySelector(".cap-in"), { y: 26, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2)" }, st);
        const pe = parseFloat(c.dataset.pend);
        const chs = [...c.querySelectorAll(".cc")];
        const real = chs.filter((x) => !x.classList.contains("pu"));
        real.forEach((x, j) => {
          const t = st + (j / real.length) * (pe - st);
          tl.fromTo(x, { opacity: 0.32 }, { opacity: 1, duration: 0.08, immediateRender: false }, t);
          if (x.classList.contains("k")) tl.fromTo(x, { scale: 1.45, y: -10 }, { scale: 1, y: 0, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t);
        });
        tl.set(real, { opacity: 0.32 }, 0);
        const av = c.querySelector(".avatar");
        if (av) { flap("#" + av.id + "-m", st, pe); tl.fromTo(av, { rotation: -3 }, { rotation: 3, duration: 0.35, repeat: Math.max(0, Math.floor((pe - st) / 0.35) - 1), yoyo: true, ease: "sine.inOut", transformOrigin: "50% 90%", immediateRender: false }, st); }
      });

      // 1 hook (frame 0 is the cover: everything visible)
      tl.fromTo("#hk-hand1", { rotation: 0 }, { rotation: 1080, svgOrigin: "75 75", duration: 1.6, ease: "power2.inOut" }, 0);
      tl.fromTo("#hk-hand2", { rotation: 0 }, { rotation: 90, svgOrigin: "75 75", duration: 1.6, ease: "power2.inOut" }, 0);
      tl.fromTo("#hk-3", { scale: 1 }, { scale: 1.18, duration: 0.14, ease: "power2.out", yoyo: true, repeat: 1 }, KT("hook", 0, "三小时"));
      tl.fromTo("#hk-mc", { color: "#ffc53d" }, { color: "#ffffff", duration: 0.2, yoyo: true, repeat: 3 }, PH("hook", 1).start + 0.6);
      tl.fromTo("#hk-sw", { y: 0, opacity: 1 }, { y: 70, opacity: 0, duration: 0.9, repeat: 2, ease: "power1.in" }, 0.2);
      tl.fromTo("#hk-q1", { rotation: -10 }, { rotation: 12, duration: 0.4, repeat: 7, yoyo: true, ease: "sine.inOut" }, 0);
      tl.fromTo("#hk-q2", { rotation: 10, y: 0 }, { rotation: -12, y: -10, duration: 0.5, repeat: 5, yoyo: true, ease: "sine.inOut" }, 0);
      tl.fromTo("#yu0-br", { rotation: 0 }, { rotation: -6, svgOrigin: "100 80", duration: 0.3, repeat: 3, yoyo: true }, 0.3);
      tl.to("#hk-head", { opacity: 0.35, scale: 0.94, transformOrigin: "50% 0%", duration: 0.35 }, PH("hook", 2).start);
      tl.fromTo("#hk-stamp", { scale: 2.6, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.28, ease: "power4.in" }, KT("hook", 3, "看错了") - 0.2);
      punch("hk", KT("hook", 3, "看错了") + 0.08, 1.07);

      // 2 struggle — night study
      const st0 = S.struggle.start, st2 = PH("struggle", 2).start, st3 = PH("struggle", 3).start;
      tl.set(["#st-day", "#st-sun", "#st-l2", "#st-l3", "#st-dim", "#st-bigq", "#st-q1", "#st-q2", "#st-q3"], { opacity: 0 }, 0);
      tl.fromTo("#st-hh", { rotation: 90 }, { rotation: 353, svgOrigin: "85 85", duration: st2 - st0 - 0.3, ease: "power1.inOut" }, st0);
      tl.fromTo("#st-mh", { rotation: 0 }, { rotation: 360 * 8 + 282, svgOrigin: "85 85", duration: st2 - st0 - 0.3, ease: "power1.inOut" }, st0);
      tl.to("#st-l1", { opacity: 0, duration: 0.2 }, PH("struggle", 1).start);
      tl.to("#st-l2", { opacity: 1, duration: 0.2 }, PH("struggle", 1).start);
      tl.fromTo("#st-rows", { y: 0 }, { y: -56 * 12, duration: st2 - st0 + 0.5, ease: "none" }, st0);
      tl.fromTo("#st-arm", { rotation: 0 }, { rotation: -5, transformOrigin: "10% 20%", duration: 0.12, repeat: Math.floor((st2 - st0) / 0.12) - 1, yoyo: true, ease: "sine.inOut" }, st0);
      ["#st-s1", "#st-s2", "#st-s3"].forEach((q, i) => tl.fromTo(q, { y: 20, opacity: 0 }, { y: -40, opacity: 0.8, duration: 1.2, repeat: 3, ease: "sine.out" }, st0 + i * 0.35));
      tl.fromTo("#st-yuv-h", { rotation: 0, y: 0 }, { rotation: 6, y: 8, svgOrigin: "100 140", duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, PH("struggle", 1).start + 0.2);
      // next morning
      tl.to("#st-day", { opacity: 1, duration: 0.5 }, st2);
      tl.to("#st-moon", { y: 200, duration: 0.6, ease: "power2.in" }, st2);
      tl.fromTo("#st-sun", { y: 120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, st2 + 0.2);
      tl.to(".star", { opacity: 0, duration: 0.3 }, st2);
      tl.to("#st-lamp", { opacity: 0, duration: 0.3 }, st2);
      tl.to("#st-hh", { rotation: 360 + 285, svgOrigin: "85 85", duration: 0.5, ease: "power2.inOut" }, st2);
      tl.to("#st-mh", { rotation: 360 * 9 + 180, svgOrigin: "85 85", duration: 0.5, ease: "power2.inOut" }, st2);
      tl.to("#st-l2", { opacity: 0, duration: 0.2 }, st2 + 0.3);
      tl.to("#st-l3", { opacity: 1, duration: 0.2 }, st2 + 0.3);
      punch("st", st2 + 0.35, 1.04);
      // lost
      tl.to("#st-dim", { opacity: 1, duration: 0.3 }, st3);
      tl.fromTo("#st-bigq", { scale: 0.2, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: 8, duration: 0.45, ease: "back.out(2.4)", immediateRender: false }, st3 + 0.05);
      tl.fromTo("#st-yuv-sw", { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: 0.8, repeat: 2, ease: "power1.in", immediateRender: false }, st3 + 0.2);
      tl.fromTo("#st-yuv-br", { rotation: 0 }, { rotation: 8, svgOrigin: "100 80", duration: 0.25, repeat: 3, yoyo: true, immediateRender: false }, st3 + 0.3);
      ["#st-q1", "#st-q2", "#st-q3"].forEach((q, i) => tl.fromTo(q, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)", immediateRender: false }, st3 + 0.25 + i * 0.28));
      punch("st", st3 + 0.05, 1.05);

      // 3 dialog — tea room
      tl.set(["#dg-b1", "#dg-b2", "#dg-t2"], { opacity: 0 }, 0);
      tl.fromTo("#dg-abp", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, S.dialog.start + 0.02);
      tl.fromTo("#dg-yup", { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, S.dialog.start + 0.12);
      ["#dg-s1", "#dg-s2"].forEach((q, i) => tl.fromTo(q, { y: 20, opacity: 0 }, { y: -40, opacity: 0.7, duration: 1.3, repeat: 3, ease: "sine.out" }, S.dialog.start + i * 0.5));
      tl.fromTo("#dg-t1 i", { y: 0 }, { y: -8, duration: 0.15, stagger: 0.07, repeat: 3, yoyo: true }, S.dialog.start + 0.2);
      tl.to("#dg-t1", { opacity: 0, duration: 0.05 }, P("dialog", 1) - 0.05);
      tl.fromTo("#dg-b1", { scale: 0, opacity: 0, transformOrigin: "20% 100%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, P("dialog", 1));
      tl.to("#dg-b1", { opacity: 0.4, scale: 0.85, y: -120, duration: 0.3 }, P("dialog", 2));
      tl.fromTo("#dg-t2", { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, P("dialog", 2));
      tl.fromTo("#dg-t2 i", { y: 0 }, { y: -8, duration: 0.15, stagger: 0.07, repeat: 1, yoyo: true }, P("dialog", 2));
      tl.to("#dg-t2", { opacity: 0, duration: 0.05 }, P("dialog", 3) - 0.05);
      tl.fromTo("#dg-b2", { scale: 0, opacity: 0, transformOrigin: "80% 100%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, P("dialog", 3));
      flap("#dg-ab-m", PH("dialog", 1).start, PH("dialog", 1).end);
      flap("#dg-yu-m", PH("dialog", 3).start, PH("dialog", 3).end);
      tl.fromTo("#dg-ab-h", { rotation: 0 }, { rotation: 5, svgOrigin: "100 140", duration: 0.4, yoyo: true, repeat: 3, ease: "sine.inOut" }, PH("dialog", 1).start);
      tl.fromTo("#dg-yu-h", { rotation: 0 }, { rotation: -6, svgOrigin: "100 140", duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" }, PH("dialog", 3).start);
      tl.to("#dg-ab-br", { y: 5, duration: 0.2 }, PH("dialog", 3).end - 0.2);

      // 4 money
      tl.fromTo("#mo-ab", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, S.money.start + 0.05);
      tl.fromTo("#mo-abv-h", { rotation: -9 }, { rotation: 9, svgOrigin: "100 140", duration: 0.2, repeat: 4, yoyo: true, ease: "sine.inOut", immediateRender: false }, PH("money", 0).start + 0.1);
      tl.to("#mo-abv-h", { rotation: 0, svgOrigin: "100 140", duration: 0.15 }, PH("money", 0).start + 1.1);
      [1, 2, 3].forEach((i) => flap("#mo-abv-m", PH("money", i).start, PH("money", i).end));
      punch("mo", KT("money", 2, "今天的钱"), 1.06);
      tl.fromTo("#mo-core", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }, P("money", 2) - 0.15);
      tl.fromTo("#mo-core", { scale: 1 }, { scale: 1.06, duration: 0.5, repeat: 5, yoyo: true, ease: "sine.inOut", immediateRender: false }, P("money", 2) + 0.4);
      ["#mo-b1", "#mo-b2", "#mo-b3", "#mo-b4"].forEach((b, i) => tl.fromTo(b, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, S.money.start + 0.2 + i * 0.12));
      const targets = [[-330, -270], [330, -270], [-330, 200], [330, 200]];
      for (let i = 0; i < 16; i++) {
        const [tx, ty] = targets[i % 4];
        const t0 = P("money", 3) + (i % 8) * 0.14 + Math.floor(i / 8) * 0.5;
        tl.fromTo("#mo-c" + i, { x: 0, y: 0, opacity: 0, scale: 0.4 }, { x: tx, y: ty, opacity: 1, scale: 1, duration: 0.7, ease: "power2.in" }, t0);
        tl.to("#mo-c" + i, { opacity: 0, duration: 0.12 }, t0 + 0.7);
      }
      tl.fromTo("#mo-ask", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, P("money", 3));
      ["#mo-b1", "#mo-b2", "#mo-b3", "#mo-b4"].forEach((b) => tl.to(b, { borderColor: "#ffc53d", color: "#ffc53d", duration: 0.3 }, P("money", 3) + 1.2));

      // 5 modes
      ["high", "low", "trend", "rebound"].forEach((k, i) => {
        const t0 = i === 0 ? S.modes.start + 0.1 : P("modes", i);
        tl.fromTo("#mc-" + k, { opacity: 0, y: 50, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, t0);
        tl.fromTo("#mc-" + k, { borderColor: "rgba(140,170,255,.2)" }, { borderColor: "#ffc53d", duration: 0.2, immediateRender: false }, t0 + 0.1);
        tl.fromTo("#mc-" + k + " .mc-svg > *", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, stagger: 0.05 }, t0 + 0.15);
        if (i < 3) tl.to("#mc-" + k, { borderColor: "rgba(140,170,255,.2)", duration: 0.2 }, P("modes", i + 1));
      });

      // 6 premium
      for (let i = 0; i < 5; i++) {
        tl.fromTo("#pb-" + i, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: "power3.out" }, S.premium.start + 0.2 + i * 0.16);
        tl.fromTo("#pv-" + i, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, S.premium.start + 0.45 + i * 0.16);
      }
      tl.fromTo("#pr-t1", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("premium", 1) + 0.4);
      tl.fromTo("#pr-ar", { opacity: 0 }, { opacity: 1, duration: 0.2 }, P("premium", 2));
      tl.fromTo("#pr-t2", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }, P("premium", 2) + 0.1);
      const r0 = PH("premium", 2).start;
      tl.set(["#pr-baton", "#pr-relay", "#pr-rl"], { opacity: 0 }, 0);
      tl.fromTo(["#pr-relay", "#pr-rl"], { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, r0);
      [0, 1, 2].forEach((i) => tl.fromTo("#pr-p" + i, { y: 0 }, { y: -18, duration: 0.18, repeat: Math.floor((S.premium.end - r0) / 0.18) - 1, yoyo: true, ease: "sine.inOut" }, r0 + i * 0.09));
      tl.fromTo("#pr-baton", { x: 160, opacity: 0 }, { x: 180, opacity: 1, duration: 0.2 }, r0 + 0.2);
      tl.to("#pr-baton", { x: 515, duration: 0.7, ease: "power2.inOut" }, r0 + 0.6);
      tl.to("#pr-baton", { x: 850, duration: 0.7, ease: "power2.inOut" }, r0 + 1.5);
      tl.to("#pr-baton", { x: 980, opacity: 0, duration: 0.4, ease: "power2.in" }, r0 + 2.4);
      [0, 1, 2].forEach((i) => tl.to("#pr-a" + i + "-m", { scaleY: 1.3, scaleX: 1.3, transformOrigin: "50% 50%", duration: 0.2 }, r0 + 0.3));

      punch("pr", PH("premium", 2).start + 0.15, 1.05);

      // 7 fail
      tl.fromTo("#fa-tb", { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "power3.out" }, S.fail.start + 0.15);
      tl.fromTo("#fa-tv", { opacity: 0 }, { opacity: 1, duration: 0.3 }, S.fail.start + 0.6);
      tl.fromTo("#fa-lab", { opacity: 0 }, { opacity: 1, duration: 0.3 }, P("fail", 1) - 0.1);
      for (let i = 0; i < 6; i++) {
        tl.fromTo("#fb-" + i, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: "power3.in" }, P("fail", 1) + i * 0.09);
        tl.fromTo("#fv-" + i, { opacity: 0 }, { opacity: 1, duration: 0.2 }, P("fail", 1) + 0.3 + i * 0.09);
      }
      tl.to("#fa-tb", { opacity: 0.35, duration: 0.4 }, P("fail", 1) + 0.4);
      tl.fromTo("#fa-t1", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("fail", 1) + 0.5);
      tl.fromTo("#fa-ar", { opacity: 0 }, { opacity: 1, duration: 0.2 }, P("fail", 2));
      tl.fromTo("#fa-t2", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" }, P("fail", 2) + 0.1);
      tl.fromTo("#fa-stamp", { scale: 2.4, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: -10, duration: 0.3, ease: "power4.in" }, P("fail", 3) + 0.2);
      tl.fromTo("#fa-in", { x: 0 }, { x: 10, duration: 0.05, repeat: 5, yoyo: true, immediateRender: false }, P("fail", 3) + 0.5);

      // crowd: cheer first, then shock at 集体低开
      tl.fromTo("#fa-crowd .p", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "back.out(1.6)" }, S.fail.start + 0.3);
      tl.fromTo(".crowd-lab", { opacity: 0 }, { opacity: 1, duration: 0.3 }, S.fail.start + 0.4);
      tl.fromTo("#fa-crowd .p", { y: 0 }, { y: -14, duration: 0.2, stagger: 0.05, repeat: 3, yoyo: true, ease: "sine.inOut", immediateRender: false }, S.fail.start + 0.8);
      const fk = KT("fail", 1, "集体低开");
      for (let i = 0; i < 5; i++) {
        tl.to("#fa-c" + i + "-m", { scaleY: 2.1, scaleX: 0.7, transformOrigin: "50% 50%", duration: 0.12 }, fk + i * 0.05);
        tl.to("#fa-c" + i + "-br", { y: -7, duration: 0.12 }, fk + i * 0.05);
        tl.fromTo("#fa-c" + i + "-sw", { opacity: 1, y: 0 }, { opacity: 0, y: 36, duration: 0.8, repeat: 2, immediateRender: false }, fk + 0.2 + i * 0.05);
        tl.to("#fa-p" + i, { y: 14, duration: 0.25, ease: "power2.in" }, fk + i * 0.05);
        tl.to("#fa-c" + i + "-h", { rotation: i % 2 ? 7 : -7, svgOrigin: "100 140", duration: 0.25 }, PH("fail", 3).start + i * 0.04);
      }
      tl.set(["#fa-c0-sw", "#fa-c1-sw", "#fa-c2-sw", "#fa-c3-sw", "#fa-c4-sw"], { opacity: 0 }, 0);

      // 8 realize
      tl.fromTo("#re-a", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, S.realize.start + 0.15);
      tl.fromTo("#re-strike", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, P("realize", 1) + 1.1);
      tl.fromTo("#re-x", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)" }, P("realize", 1) + 1.4);
      tl.to("#re-a", { opacity: 0.55, scale: 0.97, duration: 0.3 }, P("realize", 2));
      tl.fromTo("#re-arrow", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3 }, P("realize", 2));
      tl.fromTo("#re-b", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, P("realize", 2) + 0.1);
      tl.fromTo("#re-ok", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, P("realize", 4) + 0.3);
      tl.fromTo("#re-b", { boxShadow: "0 0 0px rgba(255,197,61,0)" }, { boxShadow: "0 0 90px rgba(255,197,61,.45)", duration: 0.5, immediateRender: false }, P("realize", 4) + 0.2);

      tl.fromTo("#re-yu", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, S.realize.start + 0.05);
      tl.fromTo("#re-bb", { fill: "#56607a" }, { fill: "#ffc53d", duration: 0.15, immediateRender: false }, PH("realize", 0).start + 0.5);
      tl.fromTo("#re-glow", { opacity: 0, scale: 0.5, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1.2, duration: 0.3, ease: "back.out(2)" }, PH("realize", 0).start + 0.5);
      tl.set("#re-glow", { opacity: 0 }, 0);
      punch("re", KT("realize", 4, "资金认可"), 1.05);

      // 9 close
      tl.fromTo("#cl-l1", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("close", 0));
      tl.fromTo("#cl-l2", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("close", 1));
      tl.to(["#cl-l1", "#cl-l2"], { opacity: 0.4, duration: 0.3 }, P("close", 3) - 0.1);
      tl.fromTo("#cl-w", { scale: 2.2, opacity: 0, filter: "blur(18px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power4.out" }, P("close", 3));
      tl.fromTo("#cl-s", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, P("close", 4));
      tl.fromTo("#cl-chips > div", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.15, ease: "back.out(1.8)" }, P("close", 4) + 0.5);
      tl.fromTo("#cl-w", { textShadow: "0 0 40px rgba(255,197,61,.3)" }, { textShadow: "0 0 90px rgba(255,197,61,.8)", duration: 0.8, repeat: 2, yoyo: true, immediateRender: false }, P("close", 4));

      tl.fromTo("#cl-flash", { opacity: 0 }, { opacity: 0.85, duration: 0.08 }, KT("close", 3, "赚钱效应"));
      tl.to("#cl-flash", { opacity: 0, duration: 0.6, ease: "power2.out" }, KT("close", 3, "赚钱效应") + 0.08);
      punch("cl", KT("close", 3, "赚钱效应") + 0.05, 1.08);

      const zq = KT("close", 3, "赚钱效应");
      tl.fromTo("#cl-yu", { y: 200 }, { y: 0, duration: 0.45, ease: "back.out(1.6)" }, zq + 0.3);
      tl.fromTo("#cl-ab", { y: 200 }, { y: 0, duration: 0.45, ease: "back.out(1.6)" }, zq + 0.45);
      tl.fromTo("#cl-yuv-h", { rotation: 0, y: 0 }, { rotation: 0, y: 8, svgOrigin: "100 140", duration: 0.22, repeat: 5, yoyo: true, ease: "sine.inOut" }, zq + 0.8);
      tl.to("#cl-abv-m", { scaleX: 1.4, scaleY: 0.6, transformOrigin: "50% 50%", duration: 0.2 }, zq + 0.8);
      [0, 1, 2].forEach((i) => flap("#cl-abv-m", PH("close", i).start, PH("close", i).end));
      tl.set(["#cl-yu", "#cl-ab"], { y: 200 }, 0);

      // 10 cta
      tl.fromTo("#ct-q", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, S.cta.start + 0.05);
      ["#ct-o1", "#ct-o2", "#ct-o3", "#ct-o4"].forEach((o, i) => tl.fromTo(o, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }, KT("cta", 1, "哪一类") + i * 0.1));
      tl.fromTo("#ct-box", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, PH("cta", 2).start);
      tl.fromTo("#ct-typed", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(5)" }, PH("cta", 2).start + 0.3);
      tl.to("#ct-o2", { borderColor: "#ffc53d", backgroundColor: "#2a2a1a", duration: 0.2 }, PH("cta", 2).start + 0.9);
      tl.fromTo("#ct-caret", { opacity: 1 }, { opacity: 0, duration: 0.25, repeat: 13, yoyo: true }, S.cta.start);
      tl.fromTo("#ct-follow", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }, PH("cta", 3).start - 0.1);
      tl.fromTo("#ct-hand", { x: 160, y: 160, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, PH("cta", 3).start + 0.2);
      tl.to("#ct-hand", { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 }, PH("cta", 3).start + 0.7);
      tl.fromTo("#ct-rip", { scale: 0, opacity: 0.8 }, { scale: 14, opacity: 0, duration: 0.6, ease: "power2.out" }, PH("cta", 3).start + 0.75);
      tl.fromTo("#ct-done", { opacity: 0 }, { opacity: 1, duration: 0.2 }, PH("cta", 3).start + 0.95);
      tl.fromTo("#ct-sub", { opacity: 0 }, { opacity: 1, duration: 0.3 }, PH("cta", 4).start);
      punch("ct", PH("cta", 3).start + 0.75, 1.04);

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(new URL("./index.html", import.meta.url), html);
// dump text for font subsetting
fs.writeFileSync(new URL("./.chars.txt", import.meta.url), html.replace(/<script[\s\S]*?<\/script>/g, "") + T.phrases.map((p) => p.text).join(""));
console.log("built, duration", D);
