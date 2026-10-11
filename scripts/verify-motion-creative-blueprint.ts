import assert from "node:assert/strict";
import { creativeBlueprintErrors, normalizeCreativeBlueprint } from "../src/lib/motionCreativeBlueprint.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { MOTION_GEN_ANALYSIS_PROMPT } from "../src/constants/motionGenPrompts.ts";
import { analyzeStory, normalizeAnalysis, parseStorySource, resolveTargetSeconds } from "../src/server/services/motionStoryService.ts";
import { stageBeats, emptyGen, prepareMotionGen, designBible, designLocation } from "../src/server/services/motionGenService.ts";
import { planMotionCoverage } from "../src/lib/motionCoverage.ts";
import { MotionStoryLength } from "../src/types/motionVideo.ts";
const makeBlueprint = (style: string) => ({
  intent: `Create an original ${style} video`,
  audience: "Audience specified by source",
  narrative: { voice: "Natural and playful", structure: "Observation, comparison, payoff", pacing: "Slow, one uninterrupted view per scene" },
  visualDna: { style, composition: "Object-led, no people", camera: "Locked overhead views", lighting: "Bright diffuse light", palette: "Pastel pink and mint", materials: "Stylized translucent forms", subjectHierarchy: "The object is the hero" },
  creativeProfile: { role: "Visual designer explaining through shape", writingPrinciples: ["Use clear comparisons"], productionPrinciples: ["Keep objects legible"] },
  mustPreserve: [style],
  mustVary: ["Object scale"],
  mustNotCopy: ["Reference-specific compositions"],
  uncertainties: [],
  evidence: [{ claim: style, sourceClue: "input asks for playful pastel objects" }],
});
const blueprint = makeBlueprint("Playful abstract demonstration");
const input = "Explain colour mixing through playful pastel objects with locked overhead views and no people.";
assert.equal(parseStorySource(input).text, input, "A single creative input must not be discarded as a title");
assert.equal(resolveTargetSeconds(parseStorySource(input), MotionStoryLength.FIVE), 300, "Brief word count must not truncate the requested duration");
assert.equal(parseStorySource("Objects in motion").words, 3, "Short creative briefs do not require a transcript");
assert.deepEqual(creativeBlueprintErrors(blueprint), []);
assert.equal(normalizeCreativeBlueprint({ ...blueprint, mustPreserve: [] }), undefined);
const source: any = { title: "Shapes", text: "A playful demonstration with pastel objects. Use overhead views, no people and slow pacing.", segments: [{ t: 0, text: "A playful demonstration with pastel objects. Use overhead views, no people and slow pacing." }], words: 18, sourceSeconds: 60 };
const base = { title: "Shapes", logline: "Compare forms", genre: "history", cast: [], places: [{ key: "space", name: "Abstract space", description: "Pastel objects in open space" }], chapters: [{ title: "Comparison", summary: "Compare forms" }], creativeBlueprint: blueprint };
const analysis = normalizeAnalysis(base, source, 60);
assert.equal(analysis.factual, undefined, "Genre metadata must not determine factuality");
assert.equal(analysis.look, "clean", "Genre metadata must not determine rendering look");
const preamble = productionPreamble(analysis, "visual");
assert.ok(preamble.includes(blueprint.visualDna.style));
assert.ok(!preamble.includes("history documentary scriptwriter"));
const prompt = MOTION_GEN_ANALYSIS_PROMPT({ preamble: "", title: source.title, seconds: 60, language: "English", chapters: 1, transcript: source.text });
assert.ok(!prompt.includes("Choose exactly one id"));
let calls = 0;
const requests: string[] = [];
const dnaFields = {
  characters: { design: "No people", proportions: "Object-only", poseLanguage: "No human poses", continuity: ["No cast"] },
  environment: { space: "Open space", scale: "Readable objects", propRules: "Named forms", continuity: ["Same shapes"] },
  cinematography: { framing: "Overhead", focus: "Objects", movement: "Locked", editing: "One view" },
  audioText: { narration: "Natural English", sound: "Quiet", subtitles: "Readable subtitles" },
  opening: { visual: "Two forms visible", purpose: "Establish comparison", acceptance: ["Both forms fit"] },
  qualityChecks: ["No object is cropped"],
  evidence: [{ claim: "Pastel objects", sourceClue: "input asks for pastel objects", confidence: 100 }],
};
const generated = await analyzeStory(source, { language: "en", length: MotionStoryLength.ONE, exec: {} as any, ai: async (request: string) => { requests.push(request); calls++; return calls === 1 ? { ...base, videoDna: {} } : { ...base, videoDna: { ...blueprint, ...dnaFields } }; }, });
assert.equal(calls, 2);
assert.ok(requests[1].includes("Correct these exact contract failures"));
assert.equal(generated.videoDna?.visualDna.style, blueprint.visualDna.style);
assert.equal(generated.videoDna?.version, 1);
assert.equal(generated.creativeBlueprint, undefined, "New analyses must not store duplicate planning data");
assert.equal((generated as any).dna, undefined);
assert.ok(requests.every((request) => !request.includes('"dna" =')));
await assert.rejects(analyzeStory(source, { language: "en", length: MotionStoryLength.ONE, exec: {} as any, ai: async () => ({ ...base, creativeBlueprint: {} }) }), /Invalid source-derived Video DNA/);
const gen = emptyGen();
gen.locations.space = { name: "Abstract space", stage: { center: [0, 0], size: [10, 10] }, camera: { pos: [0, 8, 1], target: [0, 0, 0] }, materials: {}, marks: {} };
const beat: any = { id: "b1", visual: "scene", place: "space", narration: "Compare these forms", cast: [], duration: 9 };
await stageBeats([beat], { language: "en", beats: [beat] } as any, generated, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (request: string) => {
    assert.ok(request.includes(blueprint.visualDna.style));
    assert.ok(request.includes(blueprint.mustPreserve[0]));
    return { beats: [{ id: "b1", location: "space", actors: [], cameras: [{ shot: "high", at: 0, move: "static", amount: 0, pos: [0, 8, 1], target: [0, 0, 0] }] }] };
  },
});
const cameras = planMotionCoverage(gen.staging.b1, 9);
assert.equal(cameras.length, 1, "A long locked scene must not acquire compulsory cuts");
assert.equal(cameras[0].move, "static");
assert.equal(cameras[0].shot, "high");
assert.equal(gen.staging.b1.actors.length, 0);
const other = normalizeAnalysis({ ...base, creativeBlueprint: makeBlueprint("Warm handcrafted miniature") }, source, 60);
assert.notEqual(productionPreamble(other, "visual"), preamble, "Different input blueprints must produce different direction despite identical metadata");
const cached = prepareMotionGen(undefined, generated);
cached.locations.old = { name: "old style" };
assert.ok(prepareMotionGen(cached, generated).locations.old);
assert.deepEqual(prepareMotionGen(cached, other).locations, {}, "A new blueprint must not reuse previous style assets");
await designBible(generated, gen, {
  exec: {} as any,
  log: () => {},
  ai: async (request: string) => {
    assert.ok(request.includes(blueprint.visualDna.style));
    return { style: { grade: "neutral", notes: blueprint.visualDna.style }, cast: {} };
  },
});
let locationRequests = 0, previewRequests = 0;
await designLocation(
  { key: "aircraft_cabin", name: "Aircraft cabin", description: "Input asks for a stylized cabin", interior: true },
  { language: "en", beats: [] } as any,
  generated,
  gen,
  {
    render: async (spec: any) => {
      assert.ok(
        spec.shots.every((shot: any) => !shot.params.actors?.length),
        "Environment previews must not inject a scale mannequin",
      );
      previewRequests++;
      return [{ file: "test-preview.jpg", issues: [] }];
    },
  } as any,
  {
    exec: {} as any,
    log: () => {},
    review: false,
    runId: "blueprint-contract-test",
    ai: async (request: string) => {
      locationRequests++;
      assert.ok(request.includes(blueprint.visualDna.style));
      return { name: "User-designed cabin", materials: { surface: { color: "#e3aac8" } }, nodes: [{ shape: "box", name: "hero", size: [1, 1, 1], pos: [0, 0.5, 0], mat: "surface" }], stage: { center: [0, 0], size: [8, 8] }, camera: { pos: [0, 2, 5], target: [0, 0.5, 0] } };
    },
  },
);
assert.equal(locationRequests, 1, "A cabin name must not bypass AI with an automatic fixed preset");
assert.equal(previewRequests, 2);
assert.equal((gen.locations.aircraft_cabin as any).name, "User-designed cabin");
console.log("Creative blueprint passed: source-derived contract, correction and failure paths, genre-independent direction, propagation to staging, object-only locked scenes.");
