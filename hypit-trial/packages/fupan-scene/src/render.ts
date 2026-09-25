import { sealVisualTrack } from "@hypit/hypit/composition";
import { browserProgram } from "@hypit/hypit/hyperframes";
import type { Timeline } from "@hypit/hypit/timeline";
import type { CanvasSpace } from "@hypit/hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/hypit/temporal";
import { fonts, gsapSource, markup, styles, timelineBody } from "./assets.js";

/** One spoken phrase: which scene it belongs to, who says it, and its semantic window (a Script Selection). */
export type Phrase = { id: string; scene: string; speaker: string; window: TemporalWindow };
/** A word-anchored event (a Script Moment) keyed the way the GSAP choreography asks for it: "scene|phrase|word". */
export type Moment = { id: string; key: string; at: TemporalInstant };
export type FupanOptions = { id: string; fps: number };

/**
 * 复盘故事场景: 已验收的 DOM + CSS + GSAP 编排, 作为一个 HyperFrames browser program。
 * 所有事件时刻都来自 Script: 句子窗口 = Selection, 关键词 = Moment。改文案/换配音后由 Hypit 重新对齐,
 * 这里只把对齐结果(帧)换算成秒交给原编排, 不再写死任何秒数。
 */
export function renderFupan(timeline: Timeline, canvas: CanvasSpace, window: TemporalWindow,
  phrases: readonly Phrase[], moments: readonly Moment[], options: FupanOptions) {
  assertTemporalWindowFor(window, { subjectId: options.id, space: timeline });
  const f0 = window.span.startFrame, fps = options.fps;
  const sec = (frame: number) => Math.round(((frame - f0) / fps) * 1000) / 1000;
  const data = {
    fps,
    D: sec(window.span.endFrameExclusive),
    phrases: phrases.map((p) => ({ scene: p.scene, s: p.speaker, start: sec(p.window.span.startFrame), end: sec(p.window.span.endFrameExclusive) })),
    moments: Object.fromEntries(moments.map((m) => [m.key, sec(m.at.frame)])),
    fonts,
  };
  const setup = `
if (!window.gsap) { ${gsapSource} }
const gsap = window.gsap;
if (!window.__fpFonts) { window.__fpFonts = true;
  for (const f of data.fonts) { const b = Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0));
    const face = new FontFace(f.family, b.buffer, { weight: f.weight }); document.fonts.add(face); face.load(); } }
const ph = data.phrases, order = [];
ph.forEach((p) => { if (!order.includes(p.scene)) order.push(p.scene); });
const scenes = order.map((id, i) => ({ id, start: i === 0 ? 0 : ph.find((p) => p.scene === id).start }));
scenes.forEach((s, i) => { s.end = i + 1 < scenes.length ? scenes[i + 1].start : data.D; });
const __T = { scenes, phrases: ph }, __D = data.D, __M = data.moments;
root.querySelectorAll(".cap").forEach((e) => e.remove());   // 字幕交给 Hypit Caption Fine
for (const s of scenes) { const el = root.querySelector("#sc-" + s.id); el.dataset.fs = s.start; el.dataset.fd = Math.min(__D, s.end + 0.08) - s.start; }
["#bg", "#frame"].forEach((q) => { const el = root.querySelector(q); el.dataset.fs = 0; el.dataset.fd = __D; });
const clips = [...root.querySelectorAll("[data-fs]")].map((el) => ({ el, s: +el.dataset.fs, e: +el.dataset.fs + +el.dataset.fd }));
const tl = (function () { ${timelineBody} })();
return (frame) => { const t = frame / data.fps;
  for (const c of clips) c.el.style.visibility = t >= c.s && t < c.e ? "visible" : "hidden";
  tl.seek(t, false); };`;
  const program = browserProgram({ html: `<div class="fp-scope">${markup}</div>`, css: styles, setup, data });
  return sealVisualTrack({ id: options.id, programSpaceId: timeline.id, visualIr: "hypit.visual-ir@1",
    presents: [{ id: options.id, span: window.span, stacking: { order: 0, tieBreak: options.id },
      elements: [{ id: "fupan", kind: "program", order: 0, program,
        style: [{ name: "position", value: "absolute" }, { name: "inset", value: 0 },
          { name: "width", value: `${canvas.widthPx}px` }, { name: "height", value: `${canvas.heightPx}px` }] }] }] });
}
