// 把 investment-video-studio 里已验收的画面资产(DOM/CSS/GSAP 编排/字体)打包进 Hypit 组件 —— 不重画任何东西
// 用法: node gen-assets.mjs <investment-video-studio 仓库路径>
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const REPO = path.resolve(process.argv[2] || "../../../ivs");
const GEN = path.resolve(process.env.FUPAN_GEN || path.join(REPO, "remotion/src/fupan/generated"));
const load = (f, name) => { const s = fs.readFileSync(path.join(GEN, f), "utf8"); return JSON.parse(s.slice(s.indexOf("=", s.indexOf(name)) + 1).trim().replace(/;\s*$/, "")); };
let markup = load("markup.ts", "markup"), styles = load("styles.ts", "styles");
// HyperFrames 自己用 data-start/data-duration/data-composition-id 管理片段, 程序内部改用 data-fs/data-fd, 避免被宿主接管
markup = markup.replace(/ data-composition-id="[^"]*"| data-width="[^"]*"| data-height="[^"]*"/g, "")
  .replace(/ data-start="/g, ' data-fs="').replace(/ data-duration="/g, ' data-fd="').replace(/ data-track-index="[^"]*"/g, "");
let tl = fs.readFileSync(path.join(GEN, "timeline.ts"), "utf8");
tl = tl.slice(tl.indexOf("{", tl.indexOf("export function buildTimeline")) + 1, tl.lastIndexOf("}"));
tl = tl.replace(/const T = \{[\s\S]*?\};\n/, "const T = __T;\n").replace(/const D = [0-9.]+;/, "const D = __D;")
  .replace(/function KT\(id, i, word\) \{[^\n]*\}/, 'function KT(id, i, word) { const k = id + "|" + i + "|" + word; if (!(k in __M)) throw new Error("missing Moment " + k); return __M[k]; }');
if (!tl.includes("const T = __T;") || !tl.includes("__M[k]")) throw new Error("timeline patch failed");
const require = createRequire(path.join(REPO, "remotion/package.json"));
const gsapSrc = fs.readFileSync(require.resolve("gsap/dist/gsap.min.js"), "utf8");
const F = path.resolve(process.env.FUPAN_FONTS || path.join(REPO, "remotion/public/fupan/fonts"));
const fonts = [["HS", "500", "hs-500"], ["HS", "700", "hs-700"], ["HS", "900", "hs-900"], ["Num", "600", "num-600"], ["Num", "700", "num-700"]]
  .map(([family, weight, f]) => ({ family, weight, b64: fs.readFileSync(path.join(F, f + ".woff2")).toString("base64") }));
const out = `// ⚠️ 自动生成(gen-assets.mjs), 源在 investment-video-studio/scripts/fupan
export const markup = ${JSON.stringify(markup)};
export const styles = ${JSON.stringify(styles)};
export const timelineBody = ${JSON.stringify(tl)};
export const gsapSource = ${JSON.stringify(gsapSrc)};
export const fonts: { family: string; weight: string; b64: string }[] = ${JSON.stringify(fonts)};
`;
fs.writeFileSync("packages/fupan-scene/src/assets.ts", out);
console.log("assets.ts", (out.length / 1024).toFixed(0), "KB");
