import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { RESPONSE_QA as V } from "./motionResponseContractVerificationTexts.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_DNA_CORE_SCHEMA, MOTION_THUMBNAIL_SCHEMA } from "../src/constants/motionResponseContract.js";
import { MOTION_THUMBNAIL } from "../src/constants/motionThumbnail.js";
import { motionResponsePrompt, motionResponseIssues, withMotionResponsePrompt } from "../src/lib/motionResponseContract.js";
import { normalizeMotionDnaResponse, videoDnaErrors } from "../src/lib/motionVideoDna.js";
import { motionDnaRepairDraft, motionDnaRepairPrompt } from "../src/lib/motionDnaRepair.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { requestMotionEditorResponse } from "../src/lib/motionEditorResponse.js";
import { MotionStoryLength } from "../src/types/motionVideo.js";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), V.ROOT));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousApp = process.env.APP_DATA_DIR;
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = directory;
try {
  const arrayDna = { ...structuredClone(V.ANALYSIS.videoDna), environment: { ...V.ANALYSIS.videoDna.environment, propRules: [...V.RULES] } };
  const before = JSON.stringify(arrayDna);
  assert.ok(videoDnaErrors(arrayDna).some((error) => error.includes("videoDna.environment.propRules: expected string") && error.includes("received array")));
  const normalized = normalizeMotionDnaResponse(arrayDna);
  assert.equal(normalized.environment.propRules, V.RULES.join("\n"));
  assert.deepEqual(normalized.mustPreserve, arrayDna.mustPreserve);
  assert.equal(JSON.stringify(arrayDna), before);
  assert.deepEqual(videoDnaErrors(normalized), []);
  for (const invalid of [[], [V.RULES[0], null], { rule: V.RULES[0] }, 7, true]) {
    const result = normalizeMotionDnaResponse({ ...normalized, environment: { ...normalized.environment, propRules: invalid } });
    assert.ok(videoDnaErrors(result).length);
  }
  const invalidEvidence = { ...normalized, evidence: [{ ...normalized.evidence[0], confidence: "100" }] };
  assert.ok(videoDnaErrors(normalizeMotionDnaResponse(invalidEvidence)).some((error) => error.includes("evidence[0].confidence")));
  const draft = { ...structuredClone(V.ANALYSIS), videoDna: { ...normalized, environment: { ...normalized.environment, propRules: null } } };
  const errors = videoDnaErrors(draft.videoDna);
  const repairPrompt = motionDnaRepairPrompt(draft, errors);
  assert.equal(withMotionResponsePrompt("motion-story-analysis", repairPrompt), repairPrompt);
  const typedPrompt = withMotionResponsePrompt("motion-story-analysis", V.SOURCE);
  assert.ok(typedPrompt.length > V.SOURCE.length);
  assert.equal(withMotionResponsePrompt("motion-story-analysis", typedPrompt), typedPrompt);
  assert.ok(repairPrompt.includes('"expected":"string(min 1 chars)"'));
  assert.ok(repairPrompt.includes('"actual":"null"'));
  const repaired = motionDnaRepairDraft(draft, { title: "wrong", videoDna: { intent: "wrong", environment: { propRules: [...V.RULES], space: "wrong" } } }, errors);
  assert.equal(repaired.title, draft.title);
  assert.equal(repaired.videoDna.intent, draft.videoDna.intent);
  assert.equal(repaired.videoDna.environment.space, draft.videoDna.environment.space);
  assert.equal(repaired.videoDna.environment.propRules, V.RULES.join("\n"));
  assert.ok(motionResponseIssues(normalized, MOTION_DNA_CORE_SCHEMA).length === 0);
  assert.ok(motionResponseIssues({ imagePrompt: [V.THUMBNAIL] }, MOTION_THUMBNAIL_SCHEMA).length > 0);
  assert.ok(motionResponseIssues({ imagePrompt: V.THUMBNAIL }, MOTION_THUMBNAIL_SCHEMA).length === 0);
  assert.equal(motionResponseIssues({ chapterId: "c1", checked: true, reviewedNeedIds: [], reviewedClues: [], needs: [] }, MOTION_RESPONSE_SCHEMAS["motion-illustration-coverage"]).length, 0);
  assert.equal(motionResponseIssues({ cast: [], places: [] }, MOTION_RESPONSE_SCHEMAS["motion-illustration-plan-repair"]).length, 0);
  assert.equal(motionSpeechResponseIssues(V.LINES[0], ["narrator", "nam"], V.NARRATION[0]).length, 0);
  assert.ok(motionSpeechResponseIssues([{ speaker: "unknown", text: V.NARRATION[0] }], ["narrator", "nam"], V.NARRATION[0]).some((issue) => issue.path.endsWith("speaker")));
  assert.ok(motionSpeechResponseIssues([{ speaker: "nam", text: "Tôi đi." }], ["narrator", "nam"], V.NARRATION[0]).some((issue) => issue.path === "utterances"));
  for (const artifact of Object.keys(MOTION_RESPONSE_SCHEMAS)) assert.ok(motionResponsePrompt(artifact).length < 7500, artifact);
  const { analyzeStory, parseStorySource, writeChapterBeats } = await import("../src/server/services/motionStoryService.js");
  const { directMotionVoice } = await import("../src/server/services/motionVoiceDirectionService.js");
  const source = parseStorySource(V.SOURCE);
  let saved: import("../src/server/services/motionStoryService.js").MotionAnalysisDraft | undefined;
  let analysisCalls = 0;
  const settings = { language: "vi", length: MotionStoryLength.ONE, exec: {} as any };
  const analysis = await analyzeStory(source, {
    ...settings,
    ai: async () => {
      analysisCalls++;
      return { ...structuredClone(V.ANALYSIS), videoDna: arrayDna };
    },
    onDraft: (value) => {
      saved = value;
    },
  });
  assert.equal(analysisCalls, 1);
  assert.equal(analysis.videoDna!.environment.propRules, V.RULES.join("\n"));
  assert.ok(saved?.raw);
  delete saved!.base;
  delete saved!.completed;
  saved!.raw.videoDna = arrayDna;
  saved!.core!.state.rejected = saved!.core!.budget;
  saved!.core!.state.errors = videoDnaErrors(arrayDna);
  const recovered = await analyzeStory(source, {
    ...settings,
    draft: saved,
    ai: async () => {
      throw new Error(V.NO_LIVE_AI);
    },
  });
  assert.equal(recovered.videoDna!.environment.propRules, V.RULES.join("\n"));
  let profileCalls = 0;
  const partialProfile: any = structuredClone(V.ANALYSIS.videoDna);
  delete partialProfile.narrativeDna.vocabulary;
  const profiled = await analyzeStory(source, {
    ...settings,
    ai: async () => {
      profileCalls++;
      return { ...structuredClone(V.ANALYSIS), videoDna: partialProfile };
    },
  });
  assert.equal(profileCalls, 1);
  assert.equal(profiled.videoDna!.audienceProfile!.country, V.ANALYSIS.videoDna.audienceProfile.country);
  assert.equal(profiled.videoDna!.narrativeDna!.vocabulary, V.ANALYSIS.videoDna.narrative.voice);
  let sourceFieldCalls = 0;
  const malformedAnalysis: any = structuredClone(V.ANALYSIS);
  malformedAnalysis.chapters[0].summary = 8;
  const fixedAnalysis = await analyzeStory(source, {
    ...settings,
    ai: async (prompt) => {
      sourceFieldCalls++;
      if (sourceFieldCalls === 1) return malformedAnalysis;
      assert.equal(sourceFieldCalls, 2);
      assert.ok(prompt.includes("chapters[0].summary"));
      assert.ok(prompt.includes('"actual":"number"'));
      return { title: "wrong", chapters: [{ id: "wrong", title: "wrong", summary: V.ANALYSIS.chapters[0].summary }] };
    },
  });
  assert.equal(fixedAnalysis.title, V.ANALYSIS.title);
  assert.equal(fixedAnalysis.chapters[0].id, V.ANALYSIS.chapters[0].id);
  assert.equal(fixedAnalysis.chapters[0].summary, V.ANALYSIS.chapters[0].summary);
  let chapterCalls = 0;
  const chapterAnalysis: any = { ...analysis, videoDna: undefined, cast: [{ key: "nam", name: "Nam", gender: "male", age: "adult" }] };
  const chapterRows = await writeChapterBeats(source, chapterAnalysis, chapterAnalysis.chapters[0], {
    language: "vi",
    exec: {},
    ai: async (prompt) => {
      chapterCalls++;
      if (chapterCalls === 1) return { beats: [{ narration: V.NARRATION[0], visual: "scene", place: "unknown", cast: ["unknown"], action: { wrong: true }, shot: "unknown" }] };
      assert.equal(chapterCalls, 2);
      assert.ok(prompt.includes("unknown cast key"));
      assert.ok(prompt.includes("unknown place key"));
      return { beats: [{ id: "c1:beat:1", narration: "wrong", place: "river", cast: ["nam"], action: V.ANALYSIS.places[0].description, shot: "wide" }] };
    },
  });
  assert.equal(chapterCalls, 2);
  assert.equal(chapterRows[0].narration, V.NARRATION[0]);
  assert.equal(chapterRows[0].place, "river");
  assert.deepEqual(chapterRows[0].cast, ["nam"]);
  assert.equal(chapterRows[0].shot, "medium");
  const script: any = { title: V.TITLE, language: "vi", beats: V.NARRATION.map((narration, index) => ({ id: `b${index + 1}`, chapterId: "c1", narration, visual: "scene" })), gen: { voiceCast: { narrator: "voice_narrator", nam: "voice_nam" } } };
  const voiceAnalysis: any = { title: V.TITLE, cast: [{ key: "nam", name: "Nam", gender: "male", age: "adult" }], places: [], chapters: [] };
  let speechCalls = 0;
  const plan = await directMotionVoice(script, voiceAnalysis, [...V.VOICES] as any, {
    exec: {},
    scope: "response-contract-voice",
    ai: async (prompt) => {
      speechCalls++;
      if (speechCalls === 1)
        return {
          beats: [
            { id: "b1", utterances: V.LINES[0] },
            { id: "b2", utterances: V.LINES[1].map((line) => ({ ...line, speaker: "unknown" })) },
          ],
        };
      assert.equal(speechCalls, 2);
      assert.ok(!prompt.includes('"id":"b1"'));
      assert.ok(prompt.includes('"id":"b2"'));
      assert.ok(prompt.includes("utterances[0].speaker"));
      return { beats: [{ id: "b2", utterances: V.LINES[1] }] };
    },
  });
  assert.equal(speechCalls, 2);
  assert.equal(plan.beats[0].utterances[1].speaker, "nam");
  assert.equal(plan.beats[1].utterances[1].speaker, "nam");
  assert.equal(plan.beats[0].utterances[1].text, V.LINES[0][1].text);
  let editorCalls = 0;
  const edited = await requestMotionEditorResponse(
    V.TITLE,
    script.beats.map((beat: any, index: number) => ({ ...beat, utterances: V.LINES[index] })),
    ["narrator", "nam"],
    true,
    async (prompt) => {
      editorCalls++;
      if (editorCalls === 1)
        return {
          edits: [
            { id: "b1", narration: V.NARRATION[0], utterances: V.LINES[0] },
            { id: "b2", narration: V.NARRATION[1] },
          ],
        };
      assert.equal(editorCalls, 2);
      const pending = JSON.parse(prompt.slice(prompt.indexOf('{"pending"')));
      assert.deepEqual(
        pending.pending.map((row: any) => row.id),
        ["b2"],
      );
      assert.ok(prompt.includes("preserve count, order, speakers"));
      return { edits: [{ id: "b2", narration: "wrong", utterances: V.LINES[1] }] };
    },
  );
  assert.equal(editorCalls, 2);
  assert.deepEqual(
    edited.edits.map((edit: any) => edit.id),
    ["b1", "b2"],
  );
  assert.equal(edited.edits[0].narration, V.NARRATION[0]);
  assert.equal(edited.edits[1].narration, V.NARRATION[1]);
  let thumbnailCalls = 0;
  (globalThis as any).__responseContractAi = async (prompt: string) => {
    thumbnailCalls++;
    if (thumbnailCalls === 1) return { imagePrompt: [V.THUMBNAIL] };
    assert.equal(thumbnailCalls, 2);
    assert.ok(prompt.includes('"actual":"array"'));
    assert.ok(prompt.includes('"path":"imagePrompt"'));
    return { imagePrompt: V.THUMBNAIL };
  };
  const bundled = await build({
    stdin: { contents: V.THUMB_ENTRY, loader: "ts", resolveDir: process.cwd() },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: V.STUB_NAMESPACE,
        setup(builder) {
          builder.onResolve({ filter: V.STORY_IMPORT }, () => ({ path: "story", namespace: V.STUB_NAMESPACE }));
          builder.onResolve({ filter: V.IMAGE_IMPORT }, () => ({ path: "image", namespace: V.STUB_NAMESPACE }));
          builder.onLoad({ filter: /.*/, namespace: V.STUB_NAMESPACE }, (args) => ({ loader: "js", contents: args.path === "story" ? V.STORY_STUB : V.IMAGE_STUB }));
        },
      },
    ],
  });
  const bundlePath = path.resolve("scratch", `${V.ROOT}${process.pid}.mjs`);
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  try {
    fs.writeFileSync(bundlePath, bundled.outputFiles[0].text);
    const service = await import(pathToFileURL(bundlePath).href);
    const result = await service.generateMotionThumbnail(analysis, undefined, { language: "vi", exec: {} });
    assert.ok(result.prompt.startsWith(V.THUMBNAIL + "\n"));
    assert.ok(result.prompt.includes(MOTION_THUMBNAIL.LAYOUT));
    assert.ok(result.prompt.includes(MOTION_THUMBNAIL.STYLE_RULE));
    assert.equal(thumbnailCalls, 2);
  } finally {
    fs.rmSync(bundlePath, { force: true });
    delete (globalThis as any).__responseContractAi;
  }
  process.stdout.write(V.PASSED);
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousApp === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousApp;
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith(V.ROOT));
  fs.rmSync(directory, { recursive: true, force: true });
}
