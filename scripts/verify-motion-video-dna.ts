import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { MotionStoryLength } from "../src/types/motionVideo.ts";
import { bindVideoDnaSettings, sceneExecutionKey, normalizeScenePlan, scenePlanErrors, scenePlanStagingErrors, videoDnaErrors, videoDnaSourceKey } from "../src/lib/motionVideoDna.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { analyzeStory, parseStorySource, writeChapterBeats } from "../src/server/services/motionStoryService.ts";
import { beatPreviewSpec, prepareMotionGen, previewBeats, reviewBeats, stageBeats } from "../src/server/services/motionGenService.ts";
import { compileStorySpec } from "../src/server/services/motionDirectorService.ts";
import { openStillSession } from "../src/server/services/motionRenderService.ts";
import { getMotionRootDirectory } from "../src/server/services/motionLibraryService.ts";
const rawDna = (style: string) => ({
  intent: `Explain ${style}`,
  audience: "Viewers requested by the input",
  narrative: { voice: "Natural English", structure: "Show, compare, explain", pacing: "One idea at a time" },
  visualDna: { style, composition: "Keep objects separated", camera: "Overhead and detail views", lighting: "Readable surfaces", palette: "Input-derived colours", materials: "Matte", subjectHierarchy: "Object first" },
  creativeProfile: { role: "Visual educator", writingPrinciples: ["Explain with visible evidence"], productionPrinciples: ["Objects remain readable"] },
  mustPreserve: [style],
  mustVary: ["View size"],
  mustNotCopy: ["Reference compositions"],
  uncertainties: [],
  evidence: [{ claim: style, sourceClue: "user guidance", confidence: 100 }],
  characters: { design: "No people needed", proportions: "Object-only", poseLanguage: "No human actions", continuity: ["Do not introduce cast"] },
  environment: { space: "Open tabletop", scale: "Two palm-sized objects", propRules: "Give objects stable node names", continuity: ["Same objects between views"] },
  cinematography: { framing: "Wide then insert", focus: "Named hero", movement: "Slow camera push", editing: "Cut for evidence" },
  audioText: { narration: "English", sound: "Restrained", subtitles: "Existing subtitle style; no floating labels" },
  opening: { visual: "Show both objects", purpose: "Make the comparison clear immediately", acceptance: ["Both objects are visible from the first frame"] },
  qualityChecks: ["Hero is not cropped", "No added explanatory text"],
});
const source = parseStorySource("Explain colour mixing through two pastel objects. No people, clear overhead composition and detailed views.");
const raw = { title: "Mixing", logline: "Compare two objects", cast: [], places: [{ key: "studio", name: "Tabletop", description: "Two forms" }], chapters: [{ title: "Comparison", summary: "Compare objects" }] };
const prompts: string[] = [];
const analysis = await analyzeStory(source, { language: "en", length: MotionStoryLength.ONE, drawingMode: "2d", aspect: "9:16", exec: {} as any, ai: async (prompt) => { prompts.push(prompt); return { ...raw, videoDna: rawDna("Pastel forms") }; }, });
assert.ok(analysis?.videoDna);
assert.equal(prompts.length, 1);
assert.deepEqual(analysis.videoDna.settings, { language: "en", length: MotionStoryLength.ONE, targetSeconds: 60, drawingMode: "2d", characterMode: "drawn", aspect: "9:16" });
assert.equal(analysis.videoDna.sourceKey, videoDnaSourceKey(source));
assert.notEqual(videoDnaSourceKey({ ...source, text: source.text + " Changed ending" }), videoDnaSourceKey(source));
assert.ok(prompts[0].includes("USER SETTINGS ARE AUTHORITATIVE"));
assert.ok(productionPreamble(analysis, "visual").includes("APPROVED VIDEO DNA"));
assert.ok(videoDnaErrors({ ...rawDna("Forms"), opening: {} }).some((error) => error.includes("opening")));
assert.ok(videoDnaErrors({ ...rawDna("Forms"), evidence: [{ claim: "Form", sourceClue: "Input", confidence: 101 }] }).length);
let corrections = 0;
const other = await analyzeStory(parseStorySource("Teach safe workshop observation with restrained realistic materials and a readable pressure gauge."), {
  language: "vi",
  length: MotionStoryLength.FIVE,
  drawingMode: "3d",
  exec: {} as any,
  ai: async (prompt) => {
    corrections++;
    if (corrections === 1) return { ...raw, videoDna: { ...rawDna("Workshop"), qualityChecks: [] } };
    assert.ok(prompt.includes("videoDna.qualityChecks"));
    return { ...raw, videoDna: { ...rawDna("Workshop"), settings: { drawingMode: "2d", language: "en" } } };
  },
});
assert.equal(corrections, 2);
assert.equal(other.videoDna?.settings.drawingMode, "3d", "AI cannot override user controls");
assert.equal(other.videoDna?.settings.language, "vi");
assert.equal(other.videoDna?.settings.targetSeconds, 300);
assert.notEqual(productionPreamble(analysis, "visual"), productionPreamble(other, "visual"));
await assert.rejects(analyzeStory(source, { language: "en", length: MotionStoryLength.ONE, exec: {} as any, ai: async () => raw }), /Invalid source-derived Video DNA/);
for (const [length, target] of [
  [MotionStoryLength.TEN, 600],
  [MotionStoryLength.SHORT, 75],
  [MotionStoryLength.FULL, 60],
] as const) {
  const result = await analyzeStory(source, { language: "en", length, exec: {} as any, ai: async () => ({ ...raw, videoDna: rawDna("Forms") }) });
  assert.equal(result.videoDna?.settings.length, length);
  assert.equal(result.videoDna?.settings.targetSeconds, target);
}
const plan = { purpose: "Compare objects", subject: "hero", before: "Both objects are visible", after: "Both objects remain visible", composition: "Hero left of comparison", spatialRelations: ["Hero left of comparison"], requiredProps: ["hero", "comparison"], continuity: ["Same positions"], acceptance: ["Hero and comparison are separate"] };
assert.deepEqual(scenePlanErrors(plan), []);
assert.equal(normalizeScenePlan({ ...plan, after: "" }), undefined);
let chapterCalls = 0;
const beats = await writeChapterBeats(
  source,
  analysis,
  { ...analysis.chapters[0], targetSeconds: 8 },
  {
    language: "en",
    exec: {} as any,
    isFirst: true,
    isLast: true,
    ai: async (prompt) => {
      chapterCalls++;
      assert.ok(prompt.includes("APPROVED VIDEO DNA"));
      assert.ok(prompt.includes("scenePlan"));
      return { beats: [{ visual: "scene", narration: "These two forms have different shapes and colours. We can compare their outlines while both remain clearly visible.", place: "studio", cast: [], action: "Keep both objects separated", scenePlan: chapterCalls === 1 ? undefined : plan }] };
    },
  },
);
assert.equal(chapterCalls, 2, "Writing must correct missing scene execution plans");
await assert.rejects(writeChapterBeats(source, analysis, { ...analysis.chapters[0], targetSeconds: 60 }, { language: "en", exec: {} as any, isFirst: true, isLast: true, ai: async () => ({ beats: [{ visual: "scene", narration: "Two forms remain visible.", scenePlan: plan }] }) }), /Narration length does not respect/);
assert.deepEqual(beats[0].scenePlan, plan);
assert.notEqual(sceneExecutionKey(beats[0]), sceneExecutionKey({ ...beats[0], scenePlan: { ...plan, after: "New state" } }), "Editing execution plans must invalidate scene assets");
beats[0].duration = 8;
const fixture = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
const location = fixture.gen.locations.studio;
location.nodes = [
  { shape: "sphere", name: "hero", radius: 0.3, pos: [-0.6, 0.6, 0], mat: { color: "#e69dab" } },
  { shape: "box", name: "comparison", size: [0.5, 0.5, 0.5], pos: [0.6, 0.6, 0], mat: { color: "#99ceb6" } },
];
location.camera = { pos: [0, 3, 4], target: [0, 0.6, 0], fov: 40 };
const comparison = location.nodes.pop();
const gen = prepareMotionGen(undefined, analysis, true, "2d");
gen.locations.studio = location;
const script: any = { title: "DNA test", language: "en", beats, gen };
let stageCalls = 0;
const staging = { location: "studio", actors: [], cameras: [ { shot: "wide", at: 0, move: "static", pos: [0, 3, 4], target: [0, 0.6, 0] }, { shot: "insert", at: 0.5, focusProp: "hero", move: "dolly_in", amount: 0.2 }, ], };
await stageBeats(beats, script, analysis, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (prompt) => {
    stageCalls++;
    assert.ok(prompt.includes("SCENE EXECUTION PLAN"));
    return { beats: [{ id: beats[0].id, ...staging, props: stageCalls === 1 ? [] : [comparison] }] };
  },
});
assert.equal(stageCalls, 2, "Staging must correct a missing required prop before accepting the scene");
gen.cast.unrequested = { body: "male", height: 1.8, layers: [] };
let actorCalls = 0;
await stageBeats(beats, script, analysis, gen, {
  exec: {} as any,
  log: () => {},
  ai: async () => {
    actorCalls++;
    return { beats: [{ id: beats[0].id, ...staging, props: [comparison], actors: actorCalls === 1 ? [{ cast: "unrequested", action: "stand", at: [0, 0] }] : [] }] };
  },
});
assert.equal(actorCalls, 2, "Object-only beats must reject even a known cast member");
assert.deepEqual((gen.staging[beats[0].id] as any).actors, []);
delete gen.cast.unrequested;
assert.deepEqual(scenePlanStagingErrors(plan, gen.staging[beats[0].id], location), []);
assert.ok(scenePlanStagingErrors({ ...plan, requiredProps: ["missing"] }, staging, location).length);
const preview = beatPreviewSpec(beats[0], gen, "en", "9:16");
assert.equal(preview.spec.shots.length, 2);
assert.equal(preview.picks.length, 4, "Review must include first frame, every camera slot and last frame");
assert.equal(preview.picks[0].t, 0.04);
assert.equal(preview.spec.fadeIn, 0);
assert.equal(preview.spec.gen?.videoDna?.sourceKey, analysis.videoDna.sourceKey);
const compiled = compileStorySpec(script, analysis, { aspect: "9:16" }).spec;
assert.equal(compiled.gen?.videoDna?.version, 1);
assert.equal(compiled.fadeIn, 0);
assert.deepEqual(compiled.shots[0].transition, { type: "cut", duration: 0 });
const bound = bindVideoDnaSettings(analysis, { drawingMode: "3d", characterMode: "drawn" });
assert.equal(bound.videoDna?.settings.drawingMode, "3d");
assert.equal(analysis.videoDna.settings.drawingMode, "2d", "Binding must not mutate previous analysis");
assert.deepEqual(prepareMotionGen(gen, bound).locations, {}, "Changed DNA invalidates assets and their reviews");
const session = await openStillSession();
try {
  const runId = `video-dna-check-${Date.now()}`;
  await previewBeats(beats, script, gen, session, { exec: {} as any, log: () => {}, runId, aspect: "9:16" });
  assert.equal(gen.previews[beats[0].id].files?.length, 4);
  assert.equal(gen.previews[beats[0].id].score, undefined);
  assert.ok(gen.previews[beats[0].id].file);
  assert.ok(!gen.previews[beats[0].id].issues?.some((issue) => /failed|render error/.test(issue)));
  const review = await reviewBeats(beats, gen, {
    exec: {} as any,
    log: () => {},
    openingBeatId: beats[0].id,
    preamble: productionPreamble(analysis, "visual"),
    ai: async (prompt, _artifact, _exec, _signal, _log, images) => {
      assert.equal(images?.length, 4);
      assert.ok(prompt.includes("Both objects are visible from the first frame"));
      assert.ok(prompt.includes("SCENE EXECUTION PLAN"));
      assert.ok(prompt.includes("hero"));
      return { beats: [{ id: beats[0].id, ok: false, fix: "The detail camera must show the hero unobstructed." }] };
    },
  });
  assert.ok(review.staging[beats[0].id]);
  assert.equal(gen.previews[beats[0].id].score, 4, "A failed angle must fail the whole beat");
  const missingVerdict = await reviewBeats(beats, gen, { exec: {} as any, log: () => {}, ai: async () => ({ beats: [] }) });
  assert.ok(missingVerdict.staging[beats[0].id], "Missing verdicts must not silently approve scenes");
  const output = "scratch/video-dna-check";
  fs.mkdirSync(output, { recursive: true });
  for (const file of gen.previews[beats[0].id].files || []) fs.copyFileSync(path.join(getMotionRootDirectory(), "gen-preview", file), path.join(output, path.basename(file)));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const image = fs.readFileSync(path.join(output, `${beats[0].id}-opening.jpg`)).toString("base64");
    const stats = await page.evaluate(async (image) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${image}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 32, 32);
      const pixels = ctx.getImageData(0, 0, 32, 32).data;
      let brightness = 0;
      for (let i = 0; i < pixels.length; i += 4) brightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      return { brightness: brightness / 1024, width: img.width, height: img.height };
    }, image);
    assert.ok(stats.brightness > 15, `Opening image must not be covered by a black fade: ${stats.brightness}`);
    assert.equal(stats.width / stats.height, 9 / 16, "Review must use the selected aspect ratio");
  } finally {
    await browser.close();
  }
} finally {
  await session.close();
}
console.log("Video DNA passed: authoritative controls, two input styles, correction/failure paths, scene plans, prop contract, cache invalidation, real portrait previews for all angles and review propagation.");
