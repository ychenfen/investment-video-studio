import { assertAttributes, assertEmptyElement, canonicalize, createMarkupSurfaceHostFacet, sameType, sealGraphFragment, textAttribute } from "@hypit/hypit/author-kit";
import type { ComponentPackage, FragmentOperation, ModuleManifest, StructuredSurfaceHandler, SurfaceResolvedReference, TypeRef } from "@hypit/hypit/author-kit";
import { compositionTypes } from "@hypit/hypit/composition";
import type { Timeline } from "@hypit/hypit/timeline";
import { timelineTypes } from "@hypit/hypit/timeline";
import { spatialTypes } from "@hypit/hypit/spatial";
import type { CanvasSpace } from "@hypit/hypit/spatial";
import { assertTemporalInstantFor, assertTemporalWindowFor, temporalTypes } from "@hypit/hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/hypit/temporal";
import { createTemporalInstantProjection, createTemporalWindowProjection, resolveTemporalContext,
  temporalContextAttributeVocabulary, temporalInstantAttributeNames, temporalInstantAttributeVocabulary,
  temporalWindowAttributeNames, temporalWindowAttributeVocabulary } from "@hypit/hypit/temporal-markup";
import { renderFupan } from "./render.js";
import type { FupanOptions, Moment, Phrase } from "./render.js";

const module = { name: "@example/fupan-scene", version: "1" } as const;
const types = Object.fromEntries(["Options", "PhraseInfo", "MomentInfo", "Items"].map((name) => [name, { module, name }])) as
  Record<"Options" | "PhraseInfo" | "MomentInfo" | "Items", TypeRef>;
const producers = Object.fromEntries(["empty", "phrase", "moment", "render"].map((name) => [name, { module, name }])) as
  Record<"empty" | "phrase" | "moment" | "render", { module: typeof module; name: string }>;
type Items = { phrases: Phrase[]; moments: Moment[] };

export const manifest: ModuleManifest = { format: "hypit.module@1", ...module,
  dependencies: [...new Map([compositionTypes.visualTrack, timelineTypes.track, spatialTypes.canvas, temporalTypes.instant].map((type) => [JSON.stringify(type.module), { module: type.module }])).values()],
  types: Object.values(types).map((type) => ({ name: type.name })), capabilities: [], producers: [
    { name: "empty", inputs: [], outputs: [{ name: "items", type: types.Items }], needs: [] },
    { name: "phrase", inputs: [{ name: "items", type: types.Items }, { name: "info", type: types.PhraseInfo },
      { name: "window", type: temporalTypes.window }, { name: "timeline", type: timelineTypes.track }], outputs: [{ name: "items", type: types.Items }], needs: [] },
    { name: "moment", inputs: [{ name: "items", type: types.Items }, { name: "info", type: types.MomentInfo },
      { name: "at", type: temporalTypes.instant }, { name: "timeline", type: timelineTypes.track }], outputs: [{ name: "items", type: types.Items }], needs: [] },
    { name: "render", inputs: [{ name: "items", type: types.Items }, { name: "options", type: types.Options },
      { name: "timeline", type: timelineTypes.track }, { name: "canvas", type: spatialTypes.canvas },
      { name: "window", type: temporalTypes.window }], outputs: [{ name: "track", type: compositionTypes.visualTrack }], needs: [] },
  ],
};
const inline = <T>(record: { value: { kind: string; value?: unknown } } | undefined): T => {
  if (record?.value.kind !== "inline") throw new Error("Fupan scene inputs must be inline values.");
  return record.value.value as T;
};
const value = (data: unknown) => ({ kind: "inline" as const, value: canonicalize(data) });
const component: ComponentPackage = { producers: [
  { producer: producers.empty, handler: () => ({ outputs: { items: value({ phrases: [], moments: [] }) }, needs: {} }) },
  { producer: producers.phrase, handler: ({ inputs }) => {
    const info = inline<Omit<Phrase, "window">>(inputs.info), window = inline<TemporalWindow>(inputs.window), items = inline<Items>(inputs.items);
    assertTemporalWindowFor(window, { subjectId: info.id, space: inline<Timeline>(inputs.timeline) });
    return { outputs: { items: value({ ...items, phrases: [...items.phrases, { ...info, window }] }) }, needs: {} };
  } },
  { producer: producers.moment, handler: ({ inputs }) => {
    const info = inline<Omit<Moment, "at">>(inputs.info), at = inline<TemporalInstant>(inputs.at), items = inline<Items>(inputs.items);
    assertTemporalInstantFor(at, { subjectId: info.id, space: inline<Timeline>(inputs.timeline) });
    return { outputs: { items: value({ ...items, moments: [...items.moments, { ...info, at }] }) }, needs: {} };
  } },
  { producer: producers.render, handler: ({ inputs }) => {
    const items = inline<Items>(inputs.items);
    return { outputs: { track: value(renderFupan(inline<Timeline>(inputs.timeline), inline<CanvasSpace>(inputs.canvas),
      inline<TemporalWindow>(inputs.window), items.phrases, items.moments, inline<FupanOptions>(inputs.options))) }, needs: {} };
  } },
] };

export const decodeSurface: StructuredSurfaceHandler = ({ element, resolveReference }) => {
  assertAttributes(element, ["id", "timeline", "canvas", ...temporalWindowAttributeNames]);
  const id = textAttribute(element, "id"), context = resolveTemporalContext({ element, resolveReference });
  const window = createTemporalWindowProjection({ id: `${id}.window`, subjectId: id, element, ...context, resolveReference });
  const reference = (name: string, type: TypeRef): SurfaceResolvedReference => {
    const raw = element.attributes[name];
    if (typeof raw !== "object" || raw.kind !== "reference") throw new Error(`${name} must be a reference.`);
    const found = resolveReference(raw.path);
    if (found === undefined || !sameType(found.type, type)) throw new Error(`${name} has the wrong Type.`);
    return found;
  };
  const options: FupanOptions = { id, fps: 30 };
  const records = [...window.records, { id: `${id}.options`, type: types.Options, value: value(options), range: element.range }];
  const components = [...window.components], fragments = [...window.fragments];
  const inputs = [{ name: "timeline", type: timelineTypes.track }, { name: "canvas", type: spatialTypes.canvas },
    { name: "window", type: temporalTypes.window }, { name: "options", type: types.Options }];
  const bindings: Record<string, SurfaceResolvedReference["ref"]> = { timeline: context.timeline.ref,
    canvas: reference("canvas", spatialTypes.canvas).ref, window: window.ref, options: { kind: "record", id: `${id}.options` } };
  const input = (name: string) => ({ kind: "fragment-input" as const, name });
  const operation = (name: string) => ({ kind: "fragment-operation" as const, operation: name });
  const operations: FragmentOperation[] = [{ id: "empty", producer: producers.empty, inputs: {}, result: { kind: "output", name: "items" } }];
  let previous = "empty", index = 0;
  for (const child of element.children) {
    if (child.kind === "text") { if (child.value.trim()) throw new Error("Fupan Scene accepts Phrase and Moment children."); continue; }
    const tag = child.name.split(":").at(-1);
    const key = `item-${++index}`, childId = textAttribute(child, "id");
    if (tag === "Phrase") {
      assertAttributes(child, ["id", "scene", "speaker", ...temporalWindowAttributeNames]); assertEmptyElement(child);
      const w = createTemporalWindowProjection({ id: `${id}.${childId}`, subjectId: childId, element: child, ...context, resolveReference });
      records.push(...w.records); components.push(...w.components); fragments.push(...w.fragments);
      records.push({ id: `${id}.${key}`, type: types.PhraseInfo, value: value({ id: childId, scene: textAttribute(child, "scene"), speaker: textAttribute(child, "speaker") }), range: child.range });
      inputs.push({ name: key, type: types.PhraseInfo }, { name: `${key}-w`, type: temporalTypes.window });
      bindings[key] = { kind: "record", id: `${id}.${key}` }; bindings[`${key}-w`] = w.ref;
      operations.push({ id: key, producer: producers.phrase, inputs: { items: operation(previous), info: input(key), window: input(`${key}-w`), timeline: input("timeline") }, result: { kind: "output", name: "items" } });
    } else if (tag === "Moment") {
      assertAttributes(child, ["id", "key", ...temporalInstantAttributeNames]); assertEmptyElement(child);
      const at = createTemporalInstantProjection({ id: `${id}.${childId}`, subjectId: childId, element: child, ...context, resolveReference });
      records.push(...at.records); components.push(...at.components); fragments.push(...at.fragments);
      records.push({ id: `${id}.${key}`, type: types.MomentInfo, value: value({ id: childId, key: textAttribute(child, "key") }), range: child.range });
      inputs.push({ name: key, type: types.MomentInfo }, { name: `${key}-at`, type: temporalTypes.instant });
      bindings[key] = { kind: "record", id: `${id}.${key}` }; bindings[`${key}-at`] = at.ref;
      operations.push({ id: key, producer: producers.moment, inputs: { items: operation(previous), info: input(key), at: input(`${key}-at`), timeline: input("timeline") }, result: { kind: "output", name: "items" } });
    } else throw new Error("Fupan Scene accepts Phrase and Moment children.");
    previous = key;
  }
  if (!index) throw new Error("Fupan Scene requires Phrase children.");
  operations.push({ id: "render", producer: producers.render, inputs: { items: operation(previous), options: input("options"),
    timeline: input("timeline"), canvas: input("canvas"), window: input("window") }, result: { kind: "output", name: "track" } });
  const fragment = sealGraphFragment({ inputs, operations, exports: [{ name: "track", type: compositionTypes.visualTrack, root: operation("render") }] });
  return { records, fragments: [...fragments, fragment], components: [...components,
    { id, fragment: fragment.id, inputs: bindings, outputs: { track: `${id}.track` }, range: element.range }], exports: [`${id}.track`] };
};
const declaration = { name: "scene", tag: "Scene", mode: "structured" as const,
  outputs: [compositionTypes.visualTrack, timelineTypes.track, temporalTypes.window, temporalTypes.instant, temporalTypes.windowSpec, temporalTypes.instantSpec, ...Object.values(types)],
  vocabulary: { summary: "复盘故事: 已验收的 HTML/GSAP 场景, 句子窗口与关键词时刻全部来自 Script。", attributes: [
    ...temporalContextAttributeVocabulary, ...temporalWindowAttributeVocabulary,
    ...["id", "canvas"].map((name) => ({ name, kind: "expression" as const, required: true, summary: name })),
  ], children: [
    { tag: "Phrase", cardinality: "many" as const, summary: "一句话: 所属场景、说话人, 以及它的 Script Selection 窗口。", attributes: [
      ...["id", "scene", "speaker"].map((name) => ({ name, kind: "literal" as const, required: true, summary: name })), ...temporalWindowAttributeVocabulary] },
    { tag: "Moment", cardinality: "many" as const, summary: "一个按词触发的事件, key 形如 scene|phrase|word。", attributes: [
      ...["id", "key"].map((name) => ({ name, kind: "literal" as const, required: true, summary: name })), ...temporalInstantAttributeVocabulary] },
  ], ports: [{ name: "track", type: compositionTypes.visualTrack, summary: "The complete story scene." }],
    example: '<fs:Scene id="story" timeline={program.timeline} canvas={canvas} during="program"><fs:Phrase id="p0" scene="hook" speaker="narr" during={copy.story.selection.p0}/><fs:Moment id="m0" key="hook|0|三小时" at={copy.story.moment.m0}/></fs:Scene>',
  },
};
export const hypitPackage = { format: "hypit.node-package@1" as const, modules: [{ manifest }], components: [component],
  hostFacets: [createMarkupSurfaceHostFacet({ module, declaration, handler: decodeSurface })] };
export default hypitPackage;
