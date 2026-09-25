import re
p='build.mjs'; s=open(p).read()
def rep(a,b):
    global s
    assert a in s, "MISSING: "+a[:80]; s=s.replace(a,b,1)
# import chars, drop inline avatar
a=s.index('function avatar(id, who, cls = "") {'); b=s.index('const PUNC =')
s=s[:a]+s[b:]
rep('import fs from "node:fs";','import fs from "node:fs";\nimport { person, avatar, XIAOYU, ABEN, CROWD } from "./chars.mjs";')

# ---------- CSS ----------
rep('      /* cta */','''      /* v3 rooms */
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
      #dg-b2 { right: 40px; top: 380px; background: #2b67ff; color: #fff; }
      #dg-b2::after { right: 110px; border-top: 16px solid #2b67ff; border-right: 16px solid #2b67ff; }
      .dots3 { position: absolute; display: flex; gap: 10px; padding: 22px 26px; border-radius: 24px; background: rgba(255,255,255,.14); }
      .dots3 i { width: 14px; height: 14px; border-radius: 50%; background: #fff; display: block; opacity: .7; }
      /* crowd + relay + duo */
      .crowd { position: absolute; left: 40px; right: 40px; top: 810px; height: 170px; display: flex; justify-content: space-between; }
      .crowd .p { width: 170px; height: 170px; position: relative; }
      .crowd .avatar { width: 170px; height: 170px; }
      .crowd-lab { position: absolute; left: 0; right: 0; top: 776px; text-align: center; font-size: 26px; font-weight: 700; color: var(--mute); }
      .relay { position: absolute; left: 40px; right: 40px; top: 800px; height: 170px; }
      .relay .p { position: absolute; top: 0; width: 170px; height: 170px; }
      .relay .avatar { width: 170px; height: 170px; }
      .relay-lab { position: absolute; left: 0; right: 0; top: 780px; text-align: center; font-size: 28px; font-weight: 900; color: var(--up); }
      #pr-baton { position: absolute; top: 880px; left: 0; width: 70px; height: 34px; border-radius: 17px; background: linear-gradient(90deg, #ffd666, #ff9f1a); color: #231800; font-family: "Num"; font-weight: 700; font-size: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px rgba(255,197,61,.7); }
      .duo { position: absolute; top: 810px; width: 190px; height: 190px; }
      .duo .avatar { width: 190px; height: 190px; }
      /* cta */''')
rep('#fa-stamp { position: absolute; right: 90px; top: 840px;','#fa-stamp { position: absolute; right: 90px; top: 200px;')

# ---------- struggle markup ----------
a=s.index('      <section id="sc-struggle"'); b=s.index('</section>',a)+len('</section>')
stars=''.join(f'<i class="star" style="left:{x}px;top:{y}px"></i>' for x,y in [(30,30),(90,110),(140,60),(40,170),(250,150),(210,200),(110,220)])
s=s[:a]+'''      <section id="sc-struggle" class="clip scene" ${sceneAttrs("struggle")}><div class="sin" id="st-in"><div class="cam" id="st-cam"><div class="pun" id="st-pun">
        <div class="room" id="st-room">
          <div class="wall"></div>
          <div class="win"><div class="sky-n"></div><div class="sky-d" id="st-day"></div>'''+stars+'''<div id="st-moon"></div><div id="st-sun"></div><div class="bar1"></div><div class="bar2"></div></div>
          <div class="clockw"><svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="76" fill="#f4f1ea" stroke="#26324f" stroke-width="10"/>${[0,1,2,3,4,5,6,7,8,9,10,11].map(k=>`<line x1="85" y1="16" x2="85" y2="${k%3?26:32}" stroke="#26324f" stroke-width="${k%3?3:6}" transform="rotate(${k*30} 85 85)"/>`).join("")}<line id="st-hh" x1="85" y1="85" x2="85" y2="44" stroke="#1b1e2c" stroke-width="9" stroke-linecap="round"/><line id="st-mh" x1="85" y1="85" x2="85" y2="28" stroke="#e0282c" stroke-width="6" stroke-linecap="round"/><circle cx="85" cy="85" r="7" fill="#1b1e2c"/></svg>
            <div class="clab"><span id="st-l1">收盘 15:00</span><span id="st-l2" style="color:#9fb3ff">深夜 23:47</span><span id="st-l3" style="color:var(--gold)">次日 09:30</span></div></div>
          <div class="lampc" id="st-lamp"></div>
          <div class="mon" data-layout-allow-overlap data-layout-allow-occlusion><div class="lh2">今日涨幅榜<span>示意</span></div><div class="rows" id="st-rows">${listRows}</div><div id="st-dim"></div></div>
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
      </div></div></div></section>'''+s[b:]

# ---------- dialog markup ----------
a=s.index('      <section id="sc-dialog"'); b=s.index('</section>',a)+len('</section>')
blds=''.join(f'<i class="bld" style="left:{x}px;width:{w}px;height:{h}px"></i>' for x,w,h in [(0,60,120),(55,50,180),(100,70,90),(165,40,210),(200,80,140),(275,50,170),(320,90,110)])
tvc=''.join(f'<rect x="{20+i*34}" y="{y}" width="20" height="{h}" fill="{c}"/>' for i,(y,h,c) in enumerate([(120,40,"#ff4d4f"),(100,40,"#ff4d4f"),(110,30,"#19c37d"),(80,50,"#ff4d4f"),(70,30,"#ff4d4f"),(80,40,"#19c37d"),(60,40,"#ff4d4f"),(40,40,"#ff4d4f"),(50,30,"#19c37d"),(30,40,"#ff4d4f")]))
s=s[:a]+'''      <section id="sc-dialog" class="clip scene" ${sceneAttrs("dialog")}><div class="sin" id="dg-in"><div class="cam" id="dg-cam"><div class="pun" id="dg-pun">
        <div class="room room2">
          <div class="wall"></div>
          <div class="city">'''+blds+'''</div>
          <div class="tv"><svg viewBox="0 0 360 200">'''+tvc+'''<polyline points="10,150 60,140 110,130 160,110 210,100 260,80 310,60 350,50" fill="none" stroke="#ffc53d" stroke-width="4"/></svg></div>
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
      </div></div></div></section>'''+s[b:]

# premium relay
rep('<div id="pr-relay"><span>资金</span><b id="pr-r1">▶</b><b id="pr-r2">▶</b><b id="pr-r3">▶</b><span>继续接力</span></div>',
'''<div class="relay-lab" id="pr-rl">资金继续接力 ▶</div>
        <div class="relay" id="pr-relay"><div class="p" id="pr-p0" style="left:40px">${person("pr-a0", { ...CROWD[0], top: "#e0282c" })}</div><div class="p" id="pr-p1" style="left:375px">${person("pr-a1", { ...CROWD[3], top: "#e0282c" })}</div><div class="p" id="pr-p2" style="left:710px">${person("pr-a2", { ...CROWD[1], top: "#e0282c" })}</div></div>
        <div id="pr-baton">¥</div>''')
rep('#pr-relay { position: absolute; left: 60px; right: 60px; top: 860px; display: flex; align-items: center; justify-content: center; gap: 16px; font-size: 32px; font-weight: 700; color: var(--mute); }','')
# fail crowd
rep('<div id="fa-stamp">不好做了</div>','''<div id="fa-stamp">不好做了</div>
        <div class="crowd-lab">昨天追进去的人</div>
        <div class="crowd" id="fa-crowd">${CROWD.map((c, i) => `<div class="p" id="fa-p${i}">${person("fa-c" + i, { ...c, sweat: true })}</div>`).join("")}</div>''')
rep('.tagrow { position: absolute; left: 60px; right: 60px; top: 710px;','.tagrow { position: absolute; left: 60px; right: 60px; top: 690px;')
# close duo
rep('<div class="flash" id="cl-flash"></div>','''<div class="duo" id="cl-yu" style="left:20px">${person("cl-yuv", XIAOYU)}</div><div class="duo" id="cl-ab" style="right:20px">${person("cl-abv", ABEN)}</div>
        <div class="flash" id="cl-flash"></div>''')

# ---------- JS: struggle + dialog replace ----------
a=s.index('      // 2 struggle'); b=s.index('      // 4 money')
s=s[:a]+r'''      // 2 struggle — night study
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
      tl.to("#dg-b1", { opacity: 0.45, scale: 0.9, y: -20, duration: 0.3 }, P("dialog", 2));
      tl.fromTo("#dg-t2", { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, P("dialog", 2));
      tl.fromTo("#dg-t2 i", { y: 0 }, { y: -8, duration: 0.15, stagger: 0.07, repeat: 1, yoyo: true }, P("dialog", 2));
      tl.to("#dg-t2", { opacity: 0, duration: 0.05 }, P("dialog", 3) - 0.05);
      tl.fromTo("#dg-b2", { scale: 0, opacity: 0, transformOrigin: "80% 100%" }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)", immediateRender: false }, P("dialog", 3));
      flap("#dg-ab-m", PH("dialog", 1).start, PH("dialog", 1).end);
      flap("#dg-yu-m", PH("dialog", 3).start, PH("dialog", 3).end);
      tl.fromTo("#dg-ab-h", { rotation: 0 }, { rotation: 5, svgOrigin: "100 140", duration: 0.4, yoyo: true, repeat: 3, ease: "sine.inOut" }, PH("dialog", 1).start);
      tl.fromTo("#dg-yu-h", { rotation: 0 }, { rotation: -6, svgOrigin: "100 140", duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" }, PH("dialog", 3).start);
      tl.to("#dg-ab-br", { y: 5, duration: 0.2 }, PH("dialog", 3).end - 0.2);

'''+s[b:]

# premium relay JS
rep('''      tl.fromTo("#pr-relay", { opacity: 0 }, { opacity: 1, duration: 0.3 }, P("premium", 3));
      ["#pr-r1", "#pr-r2", "#pr-r3"].forEach((r, i) => tl.fromTo(r, { opacity: 0.2 }, { opacity: 1, duration: 0.2, repeat: 3, yoyo: true }, P("premium", 3) + i * 0.12));''',
'''      const r0 = PH("premium", 2).start;
      tl.fromTo(["#pr-relay", "#pr-rl"], { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, r0);
      [0, 1, 2].forEach((i) => tl.fromTo("#pr-p" + i, { y: 0 }, { y: -18, duration: 0.18, repeat: Math.floor((S.premium.end - r0) / 0.18) - 1, yoyo: true, ease: "sine.inOut" }, r0 + i * 0.09));
      tl.fromTo("#pr-baton", { x: 160, opacity: 0 }, { x: 180, opacity: 1, duration: 0.2 }, r0 + 0.2);
      tl.to("#pr-baton", { x: 515, duration: 0.7, ease: "power2.inOut" }, r0 + 0.6);
      tl.to("#pr-baton", { x: 850, duration: 0.7, ease: "power2.inOut" }, r0 + 1.5);
      tl.to("#pr-baton", { x: 980, opacity: 0, duration: 0.4, ease: "power2.in" }, r0 + 2.4);
      [0, 1, 2].forEach((i) => tl.to("#pr-a" + i + "-m", { scaleY: 1.3, scaleX: 1.3, transformOrigin: "50% 50%", duration: 0.2 }, r0 + 0.3));''')
rep('<div id="pr-baton">¥</div>','<div id="pr-baton" style="opacity:0">¥</div>') if False else None

# fail crowd JS
rep('      // 8 realize','''      // crowd: cheer first, then shock at 集体低开
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

      // 8 realize''')
# close duo JS
rep('      // 10 cta','''      const zq = KT("close", 3, "赚钱效应");
      tl.fromTo("#cl-yu", { y: 200 }, { y: 0, duration: 0.45, ease: "back.out(1.6)" }, zq + 0.3);
      tl.fromTo("#cl-ab", { y: 200 }, { y: 0, duration: 0.45, ease: "back.out(1.6)" }, zq + 0.45);
      tl.fromTo("#cl-yuv-h", { rotation: 0, y: 0 }, { rotation: 0, y: 8, svgOrigin: "100 140", duration: 0.22, repeat: 5, yoyo: true, ease: "sine.inOut" }, zq + 0.8);
      tl.to("#cl-abv-m", { scaleX: 1.4, scaleY: 0.6, transformOrigin: "50% 50%", duration: 0.2 }, zq + 0.8);
      [0, 1, 2].forEach((i) => flap("#cl-abv-m", PH("close", i).start, PH("close", i).end));
      tl.set(["#cl-yu", "#cl-ab"], { y: 200 }, 0);

      // 10 cta''')
open(p,'w').write(s); print('ok')
