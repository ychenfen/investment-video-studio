// Generates index.html from timing.json (voiceover phrase timings).
import fs from "node:fs";
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

// ---------- captions ----------
const SPK = { aben: "阿本", xiaoyu: "小于" };
const caps = T.phrases
  .map((p, i) => {
    const next = T.phrases[i + 1];
    const end = next && next.start - p.end < 0.5 ? next.start : p.end + 0.35;
    const dur = (end - p.start).toFixed(3);
    const chip = SPK[p.s] ? `<span class="spk spk-${p.s}">${SPK[p.s]}</span>` : "";
    return `<div id="cap-${i}" class="clip cap" data-start="${p.start}" data-duration="${dur}" data-track-index="20"><div class="cap-in">${chip}<span class="cap-t">${hlText(p.text, p.hl)}</span></div></div>`;
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
      .spk { flex: none; font-size: 26px; font-weight: 900; padding: 6px 14px; border-radius: 12px; }
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
      .tagrow { position: absolute; left: 60px; right: 60px; top: 710px; display: flex; align-items: center; gap: 18px; }
      .tg1 { display: flex; align-items: center; gap: 14px; padding: 16px 26px; border-radius: 18px; background: #0f1b3a; border: 2px solid rgba(255,255,255,.2); font-size: 44px; font-weight: 900; }
      .ic { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 900; color: #fff; }
      .ic-ok { background: #0d9b60; } .ic-no { background: #e0282c; }
      .arrow { font-size: 50px; color: var(--mute); font-weight: 900; }
      .tg2 { padding: 16px 30px; border-radius: 18px; font-size: 48px; font-weight: 900; }
      .tg2-g { background: linear-gradient(90deg, var(--gold2), var(--gold)); color: #231800; }
      .tg2-x { background: #2a3552; color: #c9d4f1; }
      #pr-relay { position: absolute; left: 60px; right: 60px; top: 860px; display: flex; align-items: center; justify-content: center; gap: 16px; font-size: 32px; font-weight: 700; color: var(--mute); }
      #pr-relay b { color: var(--up); font-size: 40px; }
      .today { position: absolute; left: 70px; bottom: 250px; width: 150px; display: flex; flex-direction: column; align-items: center; }
      .today .tv { font-family: "Num"; font-weight: 700; font-size: 40px; color: var(--up); margin-bottom: 8px; }
      .today .tb { width: 120px; height: 140px; border-radius: 12px 12px 0 0; background: linear-gradient(180deg, #ff7a7a, #e0282c); transform-origin: 50% 100%; }
      .today .tl2 { position: absolute; bottom: -44px; font-size: 26px; color: var(--mute); font-weight: 700; white-space: nowrap; }
      .fzone { position: absolute; left: 290px; right: 40px; top: 293px; height: 150px; display: flex; justify-content: space-between; }
      .fcol { width: 70px; display: flex; flex-direction: column; align-items: center; }
      .fval { font-family: "Num"; font-weight: 700; font-size: 26px; margin-top: 6px; }
      .flab { position: absolute; left: 290px; right: 40px; top: 240px; text-align: center; font-size: 26px; color: var(--mute); font-weight: 700; }
      #fa-stamp { position: absolute; right: 90px; top: 840px; padding: 10px 26px; border: 6px solid var(--up); color: var(--up); font-size: 54px; font-weight: 900; border-radius: 14px; transform: rotate(-10deg); }

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
      <section id="sc-hook" class="clip scene" ${sceneAttrs("hook")}><div class="sin" id="hk-in">
        <div id="hk-ring"><svg viewBox="0 0 420 420"><circle cx="210" cy="210" r="186" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="22"/><circle id="hk-arc" cx="210" cy="210" r="186" fill="none" stroke="url(#hkg)" stroke-width="22" stroke-linecap="round" stroke-dasharray="1169" stroke-dashoffset="1169"/><defs><linearGradient id="hkg"><stop offset="0" stop-color="#4cc9f0"/><stop offset="1" stop-color="#ffc53d"/></linearGradient></defs></svg></div>
        <div class="hk-mid"><div class="l1">每天复盘</div><div class="l2 num"><span id="hk-n">0</span><small>小时</small></div></div>
        <div id="hk-qm">?</div>
        <div id="hk-q"><div class="a">第二天开盘</div><div class="b">还是不知道<em>买什么</em></div></div>
      </div></section>

      <!-- 2 struggle -->
      <section id="sc-struggle" class="clip scene" ${sceneAttrs("struggle")}><div class="sin" id="st-in">
        <div class="tline"><div class="bar"></div><div class="fill" id="st-fill"></div>
          <div class="tnode" style="left:30px"><i></i><div class="tt num">15:00</div><div class="ts">收盘</div></div>
          <div class="tnode" style="left:440px"><i></i><div class="tt">复盘到深夜</div><div class="ts">翻涨幅榜</div></div>
          <div class="tnode" style="left:850px"><i id="st-n3"></i><div class="tt num">09:30</div><div class="ts">次日开盘</div></div>
        </div>
        <div class="list" data-layout-allow-overlap data-layout-allow-occlusion><div class="lh">今日涨幅榜<span>示意</span></div><div class="rows" id="st-rows">${listRows}</div></div>
        <div id="st-fog"><div class="qq">?</div></div>
        <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q1" style="left:70px;top:330px">追哪个？</div>
        <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q2" style="right:70px;top:470px">低吸哪个？</div>
        <div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q3" style="left:120px;top:690px">还是空仓？</div>
      </div></section>

      <!-- 3 dialog -->
      <section id="sc-dialog" class="clip scene" ${sceneAttrs("dialog")}><div class="sin" id="dg-in">
        <div class="kick"><b>●</b>复盘对话</div>
        <div class="chat">
          <div class="msg" id="dg-m1" style="top:0"><div class="av av-b">本</div><div><div class="who">阿本</div><div class="typing" id="dg-t1"><i></i><i></i><i></i></div><div class="bub bub-b" id="dg-b1">你昨天到底看了什么？</div></div></div>
          <div class="msg r" id="dg-m2" style="top:340px"><div class="av av-y">于</div><div><div class="who">小于</div><div class="typing" id="dg-t2" style="margin-left:auto"><i></i><i></i><i></i></div><div class="bub bub-y" id="dg-b2">看哪些股票涨得好啊</div>
            <div class="mini" id="dg-mini"><div><span>机器人</span><b>+10.02%</b></div><div><span>算力</span><b>+9.98%</b></div><div><span>固态电池</span><b>+8.61%</b></div></div></div></div>
        </div>
      </div></section>

      <!-- 4 money -->
      <section id="sc-money" class="clip scene" ${sceneAttrs("money")}><div class="sin" id="mo-in">
        <div class="kick"><b>●</b>阿本的复盘角度</div>
        <div class="mbox" id="mo-b1" style="left:60px;top:130px">?</div>
        <div class="mbox" id="mo-b2" style="right:60px;top:130px">?</div>
        <div class="mbox" id="mo-b3" style="left:60px;top:600px">?</div>
        <div class="mbox" id="mo-b4" style="right:60px;top:600px">?</div>
        ${Array.from({ length: 16 }, (_, i) => `<div class="coin" id="mo-c${i}"></div>`).join("")}
        <div id="mo-core"><div class="yen">¥</div><div class="t">今天的钱</div></div>
        <div id="mo-ask">是从<em>哪一类</em>股票上赚出来的？</div>
      </div></section>

      <!-- 5 modes -->
      <section id="sc-modes" class="clip scene" ${sceneAttrs("modes")}><div class="sin" id="md-in">
        <div class="kick"><b>●</b>今天的钱来自哪种模式</div>
        <div class="mgrid">${modeCards}</div>
      </div></section>

      <!-- 6 premium -->
      <section id="sc-premium" class="clip scene" ${sceneAttrs("premium")}><div class="sin" id="pr-in">
        <div class="kick"><b>●</b>验证一：次日还有没有溢价</div>
        <div class="ch"><div class="ct">同一模式 · 次日平均溢价</div><div class="cs">示意数据</div>
          <div class="base" style="bottom:60px"></div>
          <div class="bars">${premBars}</div>
        </div>
        <div class="tagrow" id="pr-tags"><div class="tg1" id="pr-t1"><span class="ic ic-ok">✓</span>持续溢价</div><div class="arrow" id="pr-ar">→</div><div class="tg2 tg2-g" id="pr-t2">资金认可</div></div>
        <div id="pr-relay"><span>资金</span><b id="pr-r1">▶</b><b id="pr-r2">▶</b><b id="pr-r3">▶</b><span>继续接力</span></div>
      </div></section>

      <!-- 7 fail -->
      <section id="sc-fail" class="clip scene" ${sceneAttrs("fail")}><div class="sin" id="fa-in">
        <div class="kick"><b>●</b>验证二：强势之后是否集体低开</div>
        <div class="ch"><div class="ct">今天 vs 次日开盘</div><div class="cs">示意数据</div>
          <div class="base" style="top:290px;left:260px" id="fa-base"></div>
          <div class="today"><div class="tv" id="fa-tv">+10%</div><div class="tb" id="fa-tb"></div><div class="tl2">今天看起来很强</div></div>
          <div class="flab" id="fa-lab">次日开盘 · 同类个股</div>
          <div class="fzone">${failBars}</div>
        </div>
        <div class="tagrow" id="fa-tags"><div class="tg1" id="fa-t1"><span class="ic ic-no">✕</span>集体低开</div><div class="arrow" id="fa-ar">→</div><div class="tg2 tg2-x" id="fa-t2">模式失效</div></div>
        <div id="fa-stamp">不好做了</div>
      </div></section>

      <!-- 8 realize -->
      <section id="sc-realize" class="clip scene" ${sceneAttrs("realize")}><div class="sin" id="re-in">
        <div class="kick"><b>●</b>小于这才发现</div>
        <div class="rc" id="re-a"><div class="rk2">复盘不是为了</div><div class="rt">猜明天哪只会涨<div id="re-strike"></div></div><div class="rbadge" style="background:#3a2230;color:var(--up)" id="re-x">✕</div></div>
        <div id="re-arrow">↓</div>
        <div class="rc" id="re-b"><div class="rk2">而是先看清</div><div class="rt">什么机会更易被<em>资金认可</em></div><div class="rbadge" style="background:var(--gold);color:#231800" id="re-ok">✓</div></div>
      </div></section>

      <!-- 9 close -->
      <section id="sc-close" class="clip scene" ${sceneAttrs("close")}><div class="sin" id="cl-in">
        <div class="cl-lines">
          <div class="cl-l" id="cl-l1"><span class="n">01</span>别先猜明天</div>
          <div class="cl-l" id="cl-l2"><span class="n">02</span>先看今天的钱怎么赚出来</div>
        </div>
        <div id="cl-big"><div class="w" id="cl-w">赚钱效应</div><div class="s" id="cl-s">才是市场最直接的信号</div></div>
        <div class="cl-chips" id="cl-chips"><div>钱在哪类股</div><div>次日有无溢价</div><div>模式强还是弱</div></div>
      </div></section>

      ${caps}

      <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="${D}" data-track-index="30" data-volume="1"></audio>
    </div>

    <script>
      const T = ${JSON.stringify({ scenes: T.scenes, phrases: T.phrases.map((p) => ({ scene: p.scene, start: p.start, end: p.end })) })};
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
        const el = "#" + ({hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl"})[s.id] + "-in";
        if (i > 0) tl.fromTo(el, { opacity: 0, x: 90, scale: 0.97 }, { opacity: 1, x: 0, scale: 1, duration: 0.42, ease: "power3.out" }, s.start);
        if (i < T.scenes.length - 1) tl.to(el, { opacity: 0, x: -90, scale: 0.97, duration: 0.26, ease: "power2.in" }, s.end - 0.28);
      });

      // captions
      document.querySelectorAll(".cap").forEach((c) => {
        const st = parseFloat(c.dataset.start);
        tl.fromTo(c.querySelector(".cap-in"), { y: 26, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2)" }, st);
        c.querySelectorAll("em").forEach((e) => tl.fromTo(e, { color: "#ffffff" }, { color: "#ffc53d", duration: 0.25 }, st + 0.12));
      });

      // 1 hook
      tl.fromTo("#hk-ring", { scale: 0.85, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.05);
      tl.fromTo(".hk-mid", { scale: 0.85, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)" }, 0.1);
      tl.to("#hk-arc", { strokeDashoffset: 1169 * 0.75, duration: 1.1, ease: "power2.out" }, P("hook", 0));
      tl.to("#hk-n", { innerText: 3, snap: { innerText: 1 }, duration: 1.0, ease: "power2.out" }, P("hook", 0));
      tl.fromTo("#hk-q .a", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("hook", 1));
      tl.fromTo("#hk-q .b", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, P("hook", 1) + 0.25);
      tl.fromTo("#hk-qm", { scale: 0, rotation: -30, opacity: 0 }, { scale: 1, rotation: 12, opacity: 1, duration: 0.55, ease: "back.out(2.4)" }, P("hook", 1) + 0.5);
      tl.to(["#hk-ring", ".hk-mid"], { scale: 0.92, opacity: 0.45, duration: 0.4 }, P("hook", 1));

      // 2 struggle
      tl.fromTo("#st-fill", { scaleX: 0 }, { scaleX: 0.5, duration: 1.4, ease: "power2.inOut" }, S.struggle.start + 0.2);
      tl.fromTo("#st-rows", { y: 0 }, { y: -74 * 12, duration: 5.2, ease: "none" }, S.struggle.start);
      tl.to("#st-fill", { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, P("struggle", 2));
      tl.to("#st-n3", { backgroundColor: "#ffc53d", scale: 1.3, duration: 0.3 }, P("struggle", 2) + 0.7);
      tl.fromTo("#st-fog", { opacity: 0 }, { opacity: 1, duration: 0.4 }, P("struggle", 3) - 0.1);
      tl.fromTo("#st-fog .qq", { scale: 0.3 }, { scale: 1, duration: 0.5, ease: "back.out(2.2)" }, P("struggle", 3));
      ["#st-q1", "#st-q2", "#st-q3"].forEach((q, i) => tl.fromTo(q, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, P("struggle", 3) + 0.25 + i * 0.28));

      // 3 dialog
      tl.fromTo("#dg-m1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, S.dialog.start + 0.05);
            tl.fromTo("#dg-t1 i", { y: 0 }, { y: -8, duration: 0.18, stagger: 0.08, repeat: 3, yoyo: true }, S.dialog.start + 0.1);
      tl.fromTo("#dg-b1", { scale: 0, opacity: 0, transformOrigin: "0% 0%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, P("dialog", 1));
      tl.set("#dg-t1", { display: "none" }, P("dialog", 1));
      tl.fromTo("#dg-m2", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, P("dialog", 2) - 0.1);
      tl.fromTo("#dg-t2 i", { y: 0 }, { y: -8, duration: 0.18, stagger: 0.08, repeat: 1, yoyo: true }, P("dialog", 2));
      tl.set("#dg-t2", { display: "none" }, P("dialog", 3));
      tl.fromTo("#dg-b2", { scale: 0, opacity: 0, transformOrigin: "100% 0%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)" }, P("dialog", 3));
      tl.fromTo("#dg-mini", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, P("dialog", 3) + 0.5);

      // 4 money
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
      tl.fromTo("#pr-relay", { opacity: 0 }, { opacity: 1, duration: 0.3 }, P("premium", 3));
      ["#pr-r1", "#pr-r2", "#pr-r3"].forEach((r, i) => tl.fromTo(r, { opacity: 0.2 }, { opacity: 1, duration: 0.2, repeat: 3, yoyo: true }, P("premium", 3) + i * 0.12));

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

      // 8 realize
      tl.fromTo("#re-a", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, S.realize.start + 0.15);
      tl.fromTo("#re-strike", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, P("realize", 1) + 1.1);
      tl.fromTo("#re-x", { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)" }, P("realize", 1) + 1.4);
      tl.to("#re-a", { opacity: 0.55, scale: 0.97, duration: 0.3 }, P("realize", 2));
      tl.fromTo("#re-arrow", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3 }, P("realize", 2));
      tl.fromTo("#re-b", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, P("realize", 2) + 0.1);
      tl.fromTo("#re-ok", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }, P("realize", 4) + 0.3);
      tl.fromTo("#re-b", { boxShadow: "0 0 0px rgba(255,197,61,0)" }, { boxShadow: "0 0 90px rgba(255,197,61,.45)", duration: 0.5, immediateRender: false }, P("realize", 4) + 0.2);

      // 9 close
      tl.fromTo("#cl-l1", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("close", 0));
      tl.fromTo("#cl-l2", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, P("close", 1));
      tl.to(["#cl-l1", "#cl-l2"], { opacity: 0.4, duration: 0.3 }, P("close", 3) - 0.1);
      tl.fromTo("#cl-w", { scale: 2.2, opacity: 0, filter: "blur(18px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power4.out" }, P("close", 3));
      tl.fromTo("#cl-s", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, P("close", 4));
      tl.fromTo("#cl-chips > div", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.15, ease: "back.out(1.8)" }, P("close", 4) + 0.5);
      tl.fromTo("#cl-w", { textShadow: "0 0 40px rgba(255,197,61,.3)" }, { textShadow: "0 0 90px rgba(255,197,61,.8)", duration: 0.8, repeat: 2, yoyo: true, immediateRender: false }, P("close", 4));

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(new URL("./index.html", import.meta.url), html);
// dump text for font subsetting
fs.writeFileSync(new URL("./.chars.txt", import.meta.url), html.replace(/<script[\s\S]*?<\/script>/g, "") + T.phrases.map((p) => p.text).join(""));
console.log("built, duration", D);
