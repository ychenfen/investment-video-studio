// Original character generator (no real people, no existing IP).
// person(id, o) -> <svg> bust, 200x200 viewBox. Animatable parts: #id-h (head group), #id-m (mouth), #id-br (brows), #id-sw (sweat).
const HAIR = {
  spiky: (c) => `<path d="M44 92 Q40 36 100 32 Q160 36 156 92 Q152 66 138 62 Q132 48 114 56 Q102 42 88 56 Q70 50 62 64 Q48 70 44 92Z" fill="${c}"/>`,
  grey: (c) => `<path d="M50 86 Q50 42 100 38 Q150 42 150 86 Q146 60 128 56 Q100 48 72 56 Q54 60 50 86Z" fill="${c}"/><path d="M50 88 Q47 72 55 60" stroke="#b7bdc9" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M150 88 Q153 72 145 60" stroke="#b7bdc9" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  bob: (c) => `<path d="M40 128 Q34 34 100 30 Q166 34 160 128 L146 128 Q150 72 128 60 Q104 74 72 62 Q52 74 54 128Z" fill="${c}"/>`,
  cap: (c) => `<path d="M46 82 Q48 30 100 30 Q152 30 154 82Z" fill="${c}"/><path d="M122 74 Q176 72 184 88 L120 86Z" fill="${c}"/><circle cx="100" cy="34" r="6" fill="#fff" opacity=".5"/>`,
  bald: () => `<path d="M50 96 Q46 76 56 64" stroke="#8a8f99" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M150 96 Q154 76 144 64" stroke="#8a8f99" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="84" cy="54" rx="14" ry="6" fill="#fff" opacity=".35"/>`,
  side: (c) => `<path d="M46 92 Q42 38 104 34 Q160 38 156 90 Q140 50 94 58 Q62 62 46 92Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="100" cy="26" r="20" fill="${c}"/><path d="M46 96 Q42 38 100 36 Q158 38 154 96 Q146 60 100 58 Q54 60 46 96Z" fill="${c}"/>`,
};
const BODY = {
  hoodie: (c) => `<path d="M26 206 Q30 150 100 146 Q170 150 174 206Z" fill="${c}"/><path d="M84 150 Q100 166 116 150" stroke="rgba(0,0,0,.25)" stroke-width="6" fill="none"/><path d="M90 160 V184 M110 160 V184" stroke="#e8f0ff" stroke-width="4" stroke-linecap="round"/>`,
  shirt: (c) => `<path d="M26 206 Q30 150 100 146 Q170 150 174 206Z" fill="${c}"/><path d="M84 148 L100 176 L116 148Z" fill="#f4efe6"/><path d="M100 176 L94 200 L106 200Z" fill="#7a1f1f"/>`,
  tee: (c) => `<path d="M26 206 Q30 150 100 146 Q170 150 174 206Z" fill="${c}"/><path d="M82 150 Q100 162 118 150" stroke="rgba(0,0,0,.2)" stroke-width="5" fill="none"/>`,
};
export function person(id, o = {}) {
  const skin = o.skin || "#f6d3b3";
  const hair = (HAIR[o.hair || "side"])(o.hairColor || "#2a2230");
  const body = (BODY[o.body || "tee"])(o.top || "#4a5a8a");
  const glasses = o.glasses ? `<g stroke="#1b1e2c" stroke-width="3.5" fill="rgba(255,255,255,.12)"><circle cx="81" cy="98" r="15"/><circle cx="119" cy="98" r="15"/><path d="M96 98 H104"/></g>` : "";
  const beard = o.beard ? `<path d="M66 110 Q100 156 134 110 Q132 142 100 150 Q68 142 66 110Z" fill="rgba(70,55,45,.22)"/>` : "";
  const brows = `<g id="${id}-br"><path d="M68 80 Q80 75 92 81" stroke="#241c20" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M132 80 Q120 75 108 81" stroke="#241c20" stroke-width="5.5" fill="none" stroke-linecap="round"/></g>`;
  const bg = o.bg ? `<circle cx="100" cy="100" r="100" fill="${o.bg}"/>` : "";
  const clipA = o.bg ? `<defs><clipPath id="${id}-c"><circle cx="100" cy="100" r="100"/></clipPath></defs><g clip-path="url(#${id}-c)">` : "<g>";
  const sweat = o.sweat ? `<path id="${id}-sw" d="M150 60 Q158 74 150 80 Q142 74 150 60Z" fill="#8fdcff" opacity="0"/>` : "";
  return `<svg class="avatar ${o.cls || ""}" id="${id}" viewBox="0 0 200 200" overflow="visible">${clipA}${bg}${body}<g id="${id}-h"><rect x="88" y="128" width="24" height="24" fill="#e2b48f"/><circle cx="48" cy="100" r="11" fill="${skin}"/><circle cx="152" cy="100" r="11" fill="${skin}"/><circle cx="100" cy="96" r="54" fill="${skin}"/>${beard}${hair}${brows}<ellipse cx="81" cy="99" rx="5.5" ry="6.5" fill="#1b1e2c"/><ellipse cx="119" cy="99" rx="5.5" ry="6.5" fill="#1b1e2c"/>${glasses}<circle cx="70" cy="118" r="8" fill="#ff8a8a" opacity=".25"/><circle cx="130" cy="118" r="8" fill="#ff8a8a" opacity=".25"/><ellipse id="${id}-m" cx="100" cy="126" rx="12" ry="7" fill="#7b2d2d"/>${sweat}</g></g></svg>`;
}
export const XIAOYU = { hair: "spiky", hairColor: "#1b1e2c", body: "hoodie", top: "#2b7bff", glasses: true };
export const ABEN = { hair: "grey", hairColor: "#2c2c34", body: "shirt", top: "#c98a2b", beard: true };
export function avatar(id, who, cls = "") {
  const base = who === "xiaoyu" ? XIAOYU : ABEN;
  return person(id, { ...base, bg: who === "xiaoyu" ? "#12325e" : "#4a3208", cls });
}
// retail crowd — five distinct invented investors
export const CROWD = [
  { hair: "cap", hairColor: "#e0282c", body: "tee", top: "#2f9e6e", skin: "#f1c9a5" },
  { hair: "bob", hairColor: "#5a2e1e", body: "tee", top: "#d9468f", skin: "#f7d7bd" },
  { hair: "bald", body: "shirt", top: "#6b7280", glasses: true, skin: "#eec39c" },
  { hair: "side", hairColor: "#3b2a20", body: "hoodie", top: "#7c5cff", skin: "#f3cfae" },
  { hair: "bun", hairColor: "#1f1a24", body: "tee", top: "#ff8a3d", skin: "#f6d3b3" },
];
