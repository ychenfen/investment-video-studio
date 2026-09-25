// script.json(投研工作台的文案单一来源) → Hypit Script(authors/script.svml) + 主 Source(main.svml)
// 每句 = 一个 Selection @{pN}…@{/pN} + 一个 Caption Cue(||); 按词触发的事件 = Moment @{kN!}; 发音修正 = Dual Text <显示|读音>
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
// 编排里所有"按词触发"的事件(与 timeline 的 KT 调用一一对应)
const KT = [["hook", 0, "三小时"], ["hook", 3, "看错了"], ["money", 2, "今天的钱"], ["fail", 1, "集体低开"], ["realize", 4, "资金认可"], ["close", 3, "赚钱效应"], ["cta", 1, "哪一类"]];
const ROLE = { narr: "NARR", aben: "ABEN", xiaoyu: "XIAOYU" };
let n = 0, role = "", body = "", phrases = [], moments = [];
for (const sc of cfg.scenes) sc.lines.forEach((ln, i) => {
  const t = [...ln.t], s = [...(ln.tts || ln.t)];
  if (s.length !== t.length) throw new Error("tts must keep length for this generator: " + ln.t);
  const marks = {};
  KT.filter(([a, b]) => a === sc.id && b === i).forEach(([a, b, w], j) => {
    const k = ln.t.indexOf(w); if (k < 0) throw new Error(`keyword ${w} not in ${ln.t}`);
    const id = `k${moments.length}`; moments.push({ id, key: `${a}|${b}|${w}` }); marks[k] = (marks[k] || "") + `@{${id}!}`;
  });
  let out = "";
  t.forEach((c, k) => { out += marks[k] || ""; out += c === s[k] ? c : `<${c}|${s[k]}>`; });
  const id = `p${n++}`; phrases.push({ id, scene: sc.id, speaker: ln.s });
  if (ROLE[ln.s] !== role) { role = ROLE[ln.s]; body += `\n      <${role}>`; }
  body += ` @{${id}}${out}@{/${id}} ||`;
});
body = body.replace(/ \|\|$/, "");
fs.writeFileSync("authors/script.svml", `<?svml using="@hypit/markup@1"?>
<!-- 自动生成(gen-script.mjs), 文案源: investment-video-studio/scripts/fupan/script.json -->
<svml>
  <import from="@hypit/script@1"/>
  <script id="story">
    <all>${body}
    </all>
  </script>
</svml>
`);
const kids = [...phrases.map((p) => `    <fs:Phrase id="${p.id}" scene="${p.scene}" speaker="${p.speaker}" during={copy.story.selection.${p.id}}/>`),
  ...moments.map((m) => `    <fs:Moment id="${m.id}" key="${m.key}" at={copy.story.moment.${m.id}}/>`)].join("\n");
fs.writeFileSync("main.svml", `<?svml using="@hypit/markup@1"?>
<!-- 自动生成(gen-script.mjs) -->
<svml>
  <import as="copy" source="./authors/script.svml"/>
  <import as="asset" from="@hypit/media@1"/>
  <import as="pipeline" from="@hypit/media-pipeline@1"/>
  <import as="whisperx" from="@hypit/whisperx@1"/>
  <import as="time" from="@hypit/timeline-author@1"/>
  <import as="spatial" from="@hypit/spatial@1"/>
  <import as="fonts" from="@hypit/fonts-open@1"/>
  <import as="sound" from="@hypit/sound@1"/>
  <import as="audio" from="@hypit/audio-track@1"/>
  <import as="caption-fine" from="@hypit/caption-fine@1"/>
  <import as="film" from="@hypit/film@1"/>
  <import as="render" from="@hypit/render-hyperframes@1"/>
  <import as="fs" from="@example/fupan-scene@1"/>
  <import as="look" source="./look.svs"/>

  <time:Clock id="clock" frame-rate="30"/>
  <spatial:Canvas id="canvas" width="1080" height="1920"/>
  <asset:Audio id="voice" src="./assets/voice.wav"/>
  <asset:Audio id="bed" src="./assets/music-sfx.wav"/>
  <pipeline:Normalize id="voice-media" source={voice} clock={clock} video="none" audio="default" span-authority="audio"/>
  <pipeline:Normalize id="bed-media" source={bed} clock={clock} video="none" audio="default" span-authority="audio"/>
  <whisperx:SemanticTake id="all" narrative={copy.story} segment={copy.story.segment.all} media={voice-media.media} language="zh"/>
  <time:Timeline id="program" clock={clock} end="content.end">
    <time:Take source={all.take}/>
  </time:Timeline>

  <fs:Scene id="story" timeline={program.timeline} canvas={canvas} during="program">
${kids}
  </fs:Scene>

  <fonts:Stack id="cap-font" family="noto-sans-sc" weight="900" style="normal"/>
  <caption-fine:Style id="cap" recipe={look.caption.primary} font={cap-font}/>
  <caption-fine:Track id="captions" document={copy.story.caption} timeline={program.timeline}>
    <caption-fine:Use style={cap}/>
  </caption-fine:Track>
  <sound:Style id="voice-style"/>
  <sound:Track id="voice-track" timeline={program.timeline}>
    <sound:Use style={voice-style}/>
  </sound:Track>
  <audio:Track id="bed-track" timeline={program.timeline}>
    <audio:Item id="bed-item" source={bed-media.media} during="program" playback="once" gain="1"/>
  </audio:Track>
  <film:Film id="main" canvas={canvas} timeline={program.timeline} appearance={look.film.main}>
    <film:Track source={story.track}/>
    <film:Track source={captions.track}/>
    <film:Track source={voice-track.audio}/>
    <film:Track source={bed-track.audio}/>
  </film:Film>
  <render:Video id="trial" composition={main.composition} timeline={program.timeline} start-frame="0" end-frame-exclusive="750"/>
  <render:Video id="full" composition={main.composition} timeline={program.timeline}/>
</svml>
`);
console.log(phrases.length, "phrases,", moments.length, "moments");
