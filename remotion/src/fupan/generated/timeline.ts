// ⚠️ 自动生成, 勿手改 —— 源在 scripts/fupan/build.mjs
// @ts-nocheck
export function buildTimeline(gsap) {

      const T = {"scenes":[{"id":"hook","start":0,"end":5.585},{"id":"struggle","start":5.585,"end":11.058},{"id":"dialog","start":11.058,"end":16.004},{"id":"money","start":16.004,"end":21.563},{"id":"modes","start":21.563,"end":25.301},{"id":"premium","start":25.301,"end":30.393},{"id":"fail","start":30.393,"end":36.724},{"id":"realize","start":36.724,"end":43.53},{"id":"close","start":43.53,"end":49.877},{"id":"cta","start":49.877,"end":56.375}],"phrases":[{"scene":"hook","start":0.12,"end":1.046,"text":"复盘三小时","s":"narr"},{"scene":"hook","start":1.086,"end":2.518,"text":"第二天还是不知道买什么？","s":"narr"},{"scene":"hook","start":2.718,"end":3.733,"text":"问题可能出在","s":"narr"},{"scene":"hook","start":3.773,"end":5.265,"text":"你一开始就看错了东西","s":"narr"},{"scene":"struggle","start":5.585,"end":6.803,"text":"小于每天收盘后","s":"narr"},{"scene":"struggle","start":6.843,"end":7.917,"text":"都会复盘很久","s":"narr"},{"scene":"struggle","start":8.117,"end":9.275,"text":"可第二天一开盘","s":"narr"},{"scene":"struggle","start":9.315,"end":10.738,"text":"他还是不知道该做什么","s":"narr"},{"scene":"dialog","start":11.058,"end":11.741,"text":"阿本问他","s":"narr"},{"scene":"dialog","start":11.781,"end":13.175,"text":"你昨天到底看了什么？","s":"aben"},{"scene":"dialog","start":13.375,"end":13.936,"text":"小于说","s":"narr"},{"scene":"dialog","start":13.976,"end":15.684,"text":"看哪些股票涨得好啊","s":"xiaoyu"},{"scene":"money","start":16.004,"end":16.98,"text":"阿本摇了摇头","s":"narr"},{"scene":"money","start":17.18,"end":18.179,"text":"我更关心的是","s":"aben"},{"scene":"money","start":18.219,"end":18.946,"text":"今天的钱","s":"aben"},{"scene":"money","start":18.986,"end":21.243,"text":"到底是在哪一类股票上赚出来的","s":"aben"},{"scene":"modes","start":21.563,"end":22.348,"text":"是高位股","s":"aben"},{"scene":"modes","start":22.388,"end":23.526,"text":"是低位新方向","s":"aben"},{"scene":"modes","start":23.566,"end":24.158,"text":"是趋势","s":"aben"},{"scene":"modes","start":24.198,"end":24.981,"text":"还是反包","s":"aben"},{"scene":"premium","start":25.301,"end":26.402,"text":"如果一种模式","s":"aben"},{"scene":"premium","start":26.442,"end":28.06,"text":"第二天还能继续有溢价","s":"aben"},{"scene":"premium","start":28.1,"end":28.872,"text":"说明资金","s":"aben"},{"scene":"premium","start":28.912,"end":30.073,"text":"还愿意继续做它","s":"aben"},{"scene":"fail","start":30.393,"end":32.05,"text":"但如果今天看起来很强","s":"aben"},{"scene":"fail","start":32.09,"end":33.496,"text":"第二天却集体低开","s":"aben"},{"scene":"fail","start":33.536,"end":34.818,"text":"那其实已经说明","s":"aben"},{"scene":"fail","start":34.858,"end":36.404,"text":"这种模式开始不好做了","s":"aben"},{"scene":"realize","start":36.724,"end":37.798,"text":"小于这才发现","s":"narr"},{"scene":"realize","start":37.998,"end":39.914,"text":"复盘不是为了猜明天哪只会涨","s":"narr"},{"scene":"realize","start":39.954,"end":40.903,"text":"而是先看清","s":"narr"},{"scene":"realize","start":40.943,"end":42.032,"text":"现在什么样的机会","s":"narr"},{"scene":"realize","start":42.072,"end":43.21,"text":"更容易被资金认可","s":"narr"},{"scene":"close","start":43.53,"end":44.43,"text":"别先猜明天","s":"aben"},{"scene":"close","start":44.47,"end":45.573,"text":"先看今天的钱","s":"aben"},{"scene":"close","start":45.613,"end":46.907,"text":"到底是怎么赚出来的","s":"aben"},{"scene":"close","start":47.107,"end":47.923,"text":"赚钱效应","s":"narr"},{"scene":"close","start":47.963,"end":49.557,"text":"才是市场最直接的信号","s":"narr"},{"scene":"cta","start":49.877,"end":50.754,"text":"你复盘的时候","s":"narr"},{"scene":"cta","start":50.794,"end":51.765,"text":"先看的是哪一类？","s":"narr"},{"scene":"cta","start":51.805,"end":52.656,"text":"评论区聊聊","s":"narr"},{"scene":"cta","start":52.856,"end":53.927,"text":"关注复盘观察","s":"narr"},{"scene":"cta","start":53.967,"end":55.275,"text":"每天拆一个复盘信号","s":"narr"}]};
      const D = 56.4;
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

      return tl;

}
