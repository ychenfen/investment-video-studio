p='build.mjs'; s=open(p).read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)>=1, "MISSING: "+a[:70]
    s=s.replace(a,b) if cnt==0 else s.replace(a,b,cnt)

# ---------- avatar generator + char captions (node side) ----------
rep('// ---------- captions ----------', r'''// ---------- avatars (original characters) ----------
function avatar(id, who, cls = "") {
  const Y = who === "xiaoyu";
  const skin = "#f6d3b3", bg = Y ? "#12325e" : "#4a3208", top = Y ? "#2b7bff" : "#c98a2b";
  const hair = Y
    ? `<path d="M44 92 Q40 36 100 32 Q160 36 156 92 Q152 66 138 62 Q132 48 114 56 Q102 42 88 56 Q70 50 62 64 Q48 70 44 92Z" fill="#1b1e2c"/>`
    : `<path d="M50 86 Q50 42 100 38 Q150 42 150 86 Q146 60 128 56 Q100 48 72 56 Q54 60 50 86Z" fill="#2c2c34"/><path d="M50 88 Q47 72 55 60" stroke="#b7bdc9" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M150 88 Q153 72 145 60" stroke="#b7bdc9" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const glasses = Y ? `<g stroke="#1b1e2c" stroke-width="3.5" fill="rgba(255,255,255,.12)"><circle cx="81" cy="98" r="15"/><circle cx="119" cy="98" r="15"/><path d="M96 98 H104"/></g>` : "";
  const beard = Y ? "" : `<path d="M66 110 Q100 156 134 110 Q132 142 100 150 Q68 142 66 110Z" fill="rgba(70,55,45,.22)"/>`;
  const brows = Y
    ? `<g id="${id}-br"><path d="M68 78 L92 82" stroke="#1b1e2c" stroke-width="5" stroke-linecap="round"/><path d="M132 78 L108 82" stroke="#1b1e2c" stroke-width="5" stroke-linecap="round"/></g>`
    : `<g id="${id}-br"><path d="M66 80 Q79 74 92 80" stroke="#2c2c34" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M108 80 Q121 74 134 80" stroke="#2c2c34" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  const body = Y
    ? `<path d="M26 206 Q30 150 100 146 Q170 150 174 206Z" fill="${top}"/><path d="M84 150 Q100 166 116 150" stroke="#1d5ed8" stroke-width="6" fill="none"/><path d="M90 160 V184 M110 160 V184" stroke="#e8f0ff" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M26 206 Q30 150 100 146 Q170 150 174 206Z" fill="${top}"/><path d="M84 148 L100 176 L116 148Z" fill="#f4efe6"/><path d="M100 176 L94 200 L106 200Z" fill="#7a1f1f"/>`;
  return `<svg class="avatar ${cls}" id="${id}" viewBox="0 0 200 200"><defs><clipPath id="${id}-c"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#${id}-c)"><circle cx="100" cy="100" r="100" fill="${bg}"/>${body}<g id="${id}-h"><rect x="88" y="128" width="24" height="24" fill="#e9bf9b"/><circle cx="48" cy="100" r="11" fill="${skin}"/><circle cx="152" cy="100" r="11" fill="${skin}"/><circle cx="100" cy="96" r="54" fill="${skin}"/>${beard}${hair}${brows}<ellipse cx="81" cy="99" rx="5.5" ry="6.5" fill="#1b1e2c"/><ellipse cx="119" cy="99" rx="5.5" ry="6.5" fill="#1b1e2c"/>${glasses}<circle cx="70" cy="118" r="8" fill="#ff8a8a" opacity=".25"/><circle cx="130" cy="118" r="8" fill="#ff8a8a" opacity=".25"/><ellipse id="${id}-m" cx="100" cy="126" rx="12" ry="7" fill="#7b2d2d"/></g></g></svg>`;
}
const PUNC = "，。？！、：；,.?!";
function charSpans(text, hl) {
  const mark = new Array(text.length).fill(false);
  for (const w of hl || []) { let k = text.indexOf(w); while (k >= 0) { for (let j = k; j < k + w.length; j++) mark[j] = true; k = text.indexOf(w, k + 1); } }
  return [...text].map((c, i) => `<i class="ch${mark[i] ? " k" : ""}${PUNC.includes(c) ? " pu" : ""}">${esc(c)}</i>`).join("");
}

// ---------- captions ----------''')
rep('''    const chip = SPK[p.s] ? `<span class="spk spk-${p.s}">${SPK[p.s]}</span>` : "";
    return `<div id="cap-${i}" class="clip cap" data-start="${p.start}" data-duration="${dur}" data-track-index="20"><div class="cap-in">${chip}<span class="cap-t">${hlText(p.text, p.hl)}</span></div></div>`;''',
'''    const chip = SPK[p.s] ? `<div class="cav">${avatar("cav-" + i, p.s, "mini")}<b class="cav-n cav-${p.s}">${SPK[p.s]}</b></div>` : "";
    return `<div id="cap-${i}" class="clip cap" data-start="${p.start}" data-duration="${dur}" data-pend="${p.end}" data-spk="${p.s}" data-track-index="20"><div class="cap-in">${chip}<span class="cap-t">${charSpans(p.text, p.hl)}</span></div></div>`;''')

# ---------- CSS ----------
rep('.spk { flex: none; font-size: 26px; font-weight: 900; padding: 6px 14px; border-radius: 12px; }',
'''.cav { flex: none; position: relative; width: 104px; height: 104px; }
      .cav .avatar { width: 104px; height: 104px; display: block; border-radius: 50%; box-shadow: 0 0 0 4px rgba(255,255,255,.14); }
      .cav-n { position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%); font-size: 20px; font-weight: 900; padding: 2px 10px; border-radius: 8px; white-space: nowrap; }
      .cav-aben { background: var(--gold); color: #231800; } .cav-xiaoyu { background: var(--cyan); color: #04202c; }
      .ch { font-style: normal; display: inline-block; opacity: .32; }
      .ch.k { color: var(--gold); }
      .ch.pu { opacity: 1; }
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
      /* cta */
      #ct-q { position: absolute; left: 60px; right: 60px; top: 80px; font-size: 70px; font-weight: 900; line-height: 1.25; }
      .opts { position: absolute; left: 60px; right: 60px; top: 300px; display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
      .opt { display: flex; align-items: center; gap: 18px; padding: 24px 26px; border-radius: 22px; background: #13224a; border: 2px solid rgba(140,170,255,.25); font-size: 44px; font-weight: 900; }
      .opt b { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: var(--gold); color: #231800; font-family: "Num"; font-size: 44px; }
      #ct-box { position: absolute; left: 60px; right: 60px; top: 560px; height: 110px; border-radius: 55px; background: #0a1430; border: 2px solid rgba(255,255,255,.2); display: flex; align-items: center; padding: 0 36px; gap: 16px; font-size: 40px; font-weight: 700; color: var(--mute); }
      #ct-typed { color: var(--ink); }
      #ct-caret { width: 4px; height: 50px; background: var(--cyan); }
      #ct-follow { position: absolute; left: 50%; top: 740px; width: 560px; margin-left: -280px; height: 120px; border-radius: 60px; background: linear-gradient(90deg,#ff3d5a,#ff6a3d); display: flex; align-items: center; justify-content: center; gap: 18px; font-size: 50px; font-weight: 900; box-shadow: 0 12px 40px rgba(255,61,90,.35); overflow: hidden; }
      #ct-follow .done { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #243152; color: #c9d4f1; opacity: 0; }
      #ct-rip { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border-radius: 50%; background: rgba(255,255,255,.55); }
      #ct-hand { position: absolute; left: 600px; top: 820px; width: 110px; height: 110px; }
      #ct-sub { position: absolute; left: 0; right: 0; top: 890px; text-align: center; font-size: 34px; font-weight: 700; color: var(--mute); }''')

# ---------- hook markup ----------
import re
a=s.index('      <section id="sc-hook"'); b=s.index('</div></section>',a)+len('</div></section>')
s=s[:a]+'''      <section id="sc-hook" class="clip scene" ${sceneAttrs("hook")}><div class="sin" id="hk-in">
        <div id="hk-head">
          <div class="h1"><span>复盘</span><span id="hk-3">3</span><small>小时</small>
            <svg id="hk-clock" viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="8"/><circle cx="75" cy="75" r="6" fill="#ffc53d"/><line id="hk-hand1" x1="75" y1="75" x2="75" y2="26" stroke="#ffc53d" stroke-width="8" stroke-linecap="round"/><line id="hk-hand2" x1="75" y1="75" x2="110" y2="75" stroke="#eef3ff" stroke-width="8" stroke-linecap="round"/></svg></div>
          <div class="h2" id="hk-h2">第二天还是<em id="hk-mc">不知道买什么</em></div>
        </div>
        <div id="hk-yu">${avatar("yu0", "xiaoyu")}<div class="sweat" id="hk-sw" style="left:236px;top:40px"></div><div class="qm" id="hk-q1" style="left:250px;top:-40px;font-size:110px">?</div><div class="qm" id="hk-q2" style="left:-20px;top:-10px;font-size:80px">?</div></div>
        <div id="hk-stamp"><small>问题出在</small>看错了东西</div>
      </div></section>'''+s[b:]

# dialog avatars
rep('<div class="av av-b">本</div>','<div class="dav">${avatar("dg-ab", "aben")}</div>')
rep('<div class="av av-y">于</div>','<div class="dav">${avatar("dg-yu", "xiaoyu")}</div>')
# money avatar
rep('<div class="kick"><b>●</b>阿本的复盘角度</div>','<div class="kick"><b>●</b>阿本的复盘角度</div>\n        <div id="mo-ab">${avatar("mo-abv", "aben")}</div>')
# struggle avatar
rep('<div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q3" style="left:120px;top:690px">还是空仓？</div>',
    '<div class="qpill" data-layout-allow-overlap data-layout-allow-occlusion id="st-q3" style="left:120px;top:690px">还是空仓？</div>\n        <div id="st-yu" data-layout-allow-overlap>${avatar("st-yuv", "xiaoyu")}</div>')
# realize avatar + bulb
rep('<div class="kick"><b>●</b>小于这才发现</div>','''<div class="kick"><b>●</b>小于这才发现</div>
        <svg id="re-bulb" viewBox="0 0 70 90"><circle id="re-glow" cx="35" cy="32" r="34" fill="rgba(255,197,61,.35)"/><path d="M35 6 C18 6 8 18 8 32 C8 44 18 50 22 60 H48 C52 50 62 44 62 32 C62 18 52 6 35 6Z" id="re-bb" fill="#56607a"/><rect x="23" y="62" width="24" height="8" rx="3" fill="#8a9bc2"/><rect x="25" y="72" width="20" height="7" rx="3" fill="#8a9bc2"/></svg>
        <div id="re-yu">${avatar("re-yuv", "xiaoyu")}</div>''')
# close flash
rep('<div class="cl-chips" id="cl-chips">','<div class="flash" id="cl-flash"></div>\n        <div class="cl-chips" id="cl-chips">')
# CTA scene
rep('      ${caps}','''      <!-- 10 cta -->
      <section id="sc-cta" class="clip scene" ${sceneAttrs("cta")}><div class="sin" id="ct-in">
        <div id="ct-q">你复盘时，<em>先看哪一类</em>？</div>
        <div class="opts"><div class="opt" id="ct-o1"><b>A</b>高位股</div><div class="opt" id="ct-o2"><b>B</b>低位新方向</div><div class="opt" id="ct-o3"><b>C</b>趋势</div><div class="opt" id="ct-o4"><b>D</b>反包</div></div>
        <div id="ct-box"><span>评论区：</span><span id="ct-typed">我先看 B</span><i id="ct-caret"></i></div>
        <div id="ct-follow"><span>＋ 关注 复盘观察</span><div class="done" id="ct-done">✓ 已关注</div><div id="ct-rip"></div></div>
        <svg id="ct-hand" viewBox="0 0 110 110"><circle cx="40" cy="36" r="22" fill="rgba(255,255,255,.25)"/><path d="M36 20 C36 12 48 12 48 20 V52 L70 56 C80 58 84 64 82 74 L76 100 H40 L22 70 C18 64 26 58 32 64 L36 68Z" fill="#f6d3b3" stroke="#1b1e2c" stroke-width="4"/></svg>
        <div id="ct-sub">每天拆一个复盘信号</div>
      </div></section>

      ${caps}''')

# camera wrappers: sin > cam > pun
s=re.sub(r'<div class="sin" id="(\w+)-in">', r'<div class="sin" id="\1-in"><div class="cam" id="\1-cam"><div class="pun" id="\1-pun">', s)
s=s.replace('</div></section>','</div></div></div></section>')

# ---------- JS ----------
rep('phrases: T.phrases.map((p) => ({ scene: p.scene, start: p.start, end: p.end }))','phrases: T.phrases.map((p) => ({ scene: p.scene, start: p.start, end: p.end, text: p.text, s: p.s }))')
rep('({hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl"})',
    '({hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl",cta:"ct"})')
rep('      // captions', r'''      // helpers
      const PU = "，。？！、：；,.?!";
      const PH = (id, i) => T.phrases.filter((p) => p.scene === id)[i];
      function KT(id, i, word) { const p = PH(id, i); const k = p.text.indexOf(word); const n = [...p.text].filter((c) => !PU.includes(c)).length; const pre = [...p.text.slice(0, Math.max(0, k))].filter((c) => !PU.includes(c)).length; return p.start + (pre / n) * (p.end - p.start); }
      function flap(sel, a, b) { const n = Math.max(1, Math.floor((b - a) / 0.13)); tl.fromTo(sel, { scaleY: 0.35 }, { scaleY: 1.25, duration: 0.065, repeat: n * 2 - 1, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 50%", immediateRender: false }, a); tl.to(sel, { scaleY: 0.45, duration: 0.06, transformOrigin: "50% 50%" }, b); }
      function punch(code, t, amt) { tl.to("#" + code + "-pun", { scale: amt || 1.06, duration: 0.12, ease: "power2.out" }, t); tl.to("#" + code + "-pun", { scale: 1, duration: 0.55, ease: "power2.inOut" }, t + 0.12); }
      const CODE = {hook:"hk",struggle:"st",dialog:"dg",money:"mo",modes:"md",premium:"pr",fail:"fa",realize:"re",close:"cl",cta:"ct"};
      document.querySelectorAll('[id$="-m"]').forEach((m) => tl.set(m, { scaleY: 0.45, transformOrigin: "50% 50%" }, 0));
      // slow camera drift per scene
      T.scenes.forEach((s) => tl.fromTo("#" + CODE[s.id] + "-cam", { scale: 1 }, { scale: 1.045, duration: s.end - s.start + 0.1, ease: "none" }, s.start));

      // captions''')
# caption char animation
rep('''        c.querySelectorAll("em").forEach((e) => tl.fromTo(e, { color: "#ffffff" }, { color: "#ffc53d", duration: 0.25 }, st + 0.12));''',
'''        const pe = parseFloat(c.dataset.pend);
        const chs = [...c.querySelectorAll(".ch")];
        const real = chs.filter((x) => !x.classList.contains("pu"));
        real.forEach((x, j) => {
          const t = st + (j / real.length) * (pe - st);
          tl.fromTo(x, { opacity: 0.32 }, { opacity: 1, duration: 0.08, immediateRender: false }, t);
          if (x.classList.contains("k")) tl.fromTo(x, { scale: 1.45, y: -10 }, { scale: 1, y: 0, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t);
        });
        tl.set(real, { opacity: 0.32 }, 0);
        const av = c.querySelector(".avatar");
        if (av) { flap("#" + av.id + "-m", st, pe); tl.fromTo(av, { rotation: -3 }, { rotation: 3, duration: 0.35, repeat: Math.max(0, Math.floor((pe - st) / 0.35) - 1), yoyo: true, ease: "sine.inOut", transformOrigin: "50% 90%", immediateRender: false }, st); }''')

# hook JS replace
a=s.index('      // 1 hook'); b=s.index('      // 2 struggle')
s=s[:a]+r'''      // 1 hook (frame 0 is the cover: everything visible)
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

'''+s[b:]

# dialog: lip flap on big avatars
rep('      // 4 money', '''      flap("#dg-ab-m", PH("dialog", 1).start, PH("dialog", 1).end);
      flap("#dg-yu-m", PH("dialog", 3).start, PH("dialog", 3).end);

      // 4 money
      tl.fromTo("#mo-ab", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, S.money.start + 0.05);
      tl.fromTo("#mo-abv-h", { rotation: -9 }, { rotation: 9, svgOrigin: "100 140", duration: 0.2, repeat: 4, yoyo: true, ease: "sine.inOut", immediateRender: false }, PH("money", 0).start + 0.1);
      tl.to("#mo-abv-h", { rotation: 0, svgOrigin: "100 140", duration: 0.15 }, PH("money", 0).start + 1.1);
      [1, 2, 3].forEach((i) => flap("#mo-abv-m", PH("money", i).start, PH("money", i).end));
      punch("mo", KT("money", 2, "今天的钱"), 1.06);''')
# struggle avatar + premium/realize/close punches
rep('      // 3 dialog','''      tl.fromTo("#st-yu", { y: 260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, PH("struggle", 3).start + 0.1);
      tl.fromTo("#st-yuv-br", { rotation: 0 }, { rotation: 8, svgOrigin: "100 80", duration: 0.25, repeat: 3, yoyo: true, immediateRender: false }, PH("struggle", 3).start + 0.5);
      punch("st", PH("struggle", 3).start + 0.05, 1.05);

      // 3 dialog''')
rep('      // 7 fail','      punch("pr", PH("premium", 2).start + 0.15, 1.05);\n\n      // 7 fail')
rep('      // 9 close','''      tl.fromTo("#re-yu", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }, S.realize.start + 0.05);
      tl.fromTo("#re-bb", { fill: "#56607a" }, { fill: "#ffc53d", duration: 0.15, immediateRender: false }, PH("realize", 0).start + 0.5);
      tl.fromTo("#re-glow", { opacity: 0, scale: 0.5, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1.2, duration: 0.3, ease: "back.out(2)" }, PH("realize", 0).start + 0.5);
      tl.set("#re-glow", { opacity: 0 }, 0);
      punch("re", KT("realize", 4, "资金认可"), 1.05);

      // 9 close''')
rep('      window.__timelines["main"] = tl;','''      tl.fromTo("#cl-flash", { opacity: 0 }, { opacity: 0.85, duration: 0.08 }, KT("close", 3, "赚钱效应"));
      tl.to("#cl-flash", { opacity: 0, duration: 0.6, ease: "power2.out" }, KT("close", 3, "赚钱效应") + 0.08);
      punch("cl", KT("close", 3, "赚钱效应") + 0.05, 1.08);

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

      window.__timelines["main"] = tl;''')
open(p,'w').write(s); print("patched")
