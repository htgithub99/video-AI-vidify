// Drawing style and layout are applied when scenes are shown: one scene set serves every choice, and saved state from
// when each choice kept its own scene set keeps the newest built one.
import assert from "node:assert/strict";
import { motionHtmlPlanSource, motionHtmlPlanSourceMatches } from "../src/lib/motionHtmlScene.js";
import { mergeMotionVisualDrafts, motionVisualDraftKey } from "../src/features/motion/lib/motionVisualDraft.js";
import { stringifyJson } from "../src/lib/jsonStringify.js";
const base: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "medium" };
assert.equal(motionVisualDraftKey({ ...base, profileId: "comic", layout: "close", figureKit: true }), motionVisualDraftKey(base), "one draft for every style, layout and renderer");
assert.notEqual(motionVisualDraftKey({ ...base, pacing: "few" }), motionVisualDraftKey(base), "pacing still changes the plan");
// A plan stored with the style and layout in its settings is still the current plan.
const beats: any = [{ id: "b1", chapterId: "c1", narration: "A rider crosses the bridge." }];
const analysis: any = { title: "T", cast: [], places: [], chapters: [] };
const source = motionHtmlPlanSource(beats, analysis, { ...base, profileId: "sketch", layout: "close" });
const legacy = JSON.parse(source);
legacy.settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "comic", componentRevision: 1, pacing: "medium", layout: "stage" };
assert.ok(motionHtmlPlanSourceMatches(stringifyJson(legacy), source), "an older plan of any style or layout matches");
legacy.settings.pacing = "few";
assert.ok(!motionHtmlPlanSourceMatches(stringifyJson(legacy), source), "a plan for another pacing does not");
// Saved drafts per style: the shown one wins when it has scenes, otherwise the newest built one becomes the shown one.
const oldKey = (s: any) => stringifyJson({ ...s, figureKit: undefined, proportion: undefined });
const gen = (at: number) => ({ cast: {}, locations: {}, remotion: { updatedAt: at, scenes: { g1: [{ id: "s" }] } } }) as any;
const comic = { ...base, profileId: "comic" }, sketch = { ...base, profileId: "sketch", layout: "close" };
const merged = mergeMotionVisualDrafts({ visualSettings: base, script: { gen: undefined }, visualDrafts: { [oldKey(base)]: { contextKey: "c" } as any, [oldKey(comic)]: { contextKey: "c", gen: gen(5) } as any, [oldKey(sketch)]: { contextKey: "c", gen: gen(9), thumbnail: "t9" } as any } });
assert.deepEqual(Object.keys(merged.visualDrafts!), [motionVisualDraftKey(base)]);
assert.equal(merged.script?.gen?.remotion?.updatedAt, 9, "the newest built set is shown");
assert.equal((merged as any).thumbnail, "t9");
const kept = mergeMotionVisualDrafts({ visualSettings: base, script: { gen: gen(1) }, visualDrafts: { [oldKey(base)]: { contextKey: "c" } as any, [oldKey(sketch)]: { contextKey: "c", gen: gen(9) } as any } });
assert.equal(kept.script?.gen?.remotion?.updatedAt, 1, "the shown set stays when it has scenes");
const fresh = { visualSettings: base, visualDrafts: { [motionVisualDraftKey(base)]: { contextKey: "c" } as any } };
assert.equal(mergeMotionVisualDrafts(fresh), fresh, "state saved after the change is left as it is");
console.log("style switch ok");
