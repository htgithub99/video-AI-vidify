import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import { analyzeStory, parseStorySource } from "../src/server/services/motionStoryService.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeMotionReferences, normalizeMotionReferenceStyle, hasMotionRenderFailure, needsMotionPreview } from "../src/lib/motionReference.ts";
import { MOTION_REFERENCE_CONFIG, MOTION_REFERENCE_PROMPTS } from "../src/constants/motionReference.ts";
import { MOTION_STORY_CONFIG } from "../src/constants/motionVideo.ts";
import { withMotionReferenceFiles } from "../src/server/services/motionReferenceService.ts";
import { prepareMotionGen } from "../src/server/services/motionGenService.ts";
import { compileStorySpec } from "../src/server/services/motionDirectorService.ts";
import type { MotionStoryAnalysis } from "../src/types/motionVideo.ts";
const image = { name: VT.REFERENCE_PNG, dataUrl: VT.DATA_IMAGE_PNG_BASE64_IVBORW0KGGOAAAANSUHEUGAAAAEAAAABCAQAAA };
assert.equal(normalizeMotionReferences(Array(4).fill(image)).length, 4);
assert.throws(() => normalizeMotionReferences(Array(5).fill(image)));
assert.throws(() => normalizeMotionReferences([{ dataUrl: VT.DATA_IMAGE_SVG_XML_BASE64_PHN2ZZ4 }]));
assert.throws(() => normalizeMotionReferences([{ dataUrl: VT.HTTPS_EXAMPLE_COM_IMAGE_PNG }]));
assert.throws(() => normalizeMotionReferences([{ dataUrl: VT.DATA_IMAGE_PNG_BASE64 + VT.A.repeat(5_000_000) }]));
let temporary = VT.EMPTY_2;
await withMotionReferenceFiles([image], async (images) => {
  temporary = images[0].path;
  assert.ok(fs.existsSync(temporary));
  assert.equal(images[0].mimeType, MOTION_REFERENCE_CONFIG.MIME_JPEG);
  assert.ok(
    fs
      .readFileSync(temporary)
      .subarray(0, 3)
      .equals(Buffer.from([255, 216, 255])),
  );
  assert.ok(images[0].name.startsWith(VT.STYLE_REFERENCE));
});
assert.equal(fs.existsSync(temporary), false);
await assert.rejects(
  withMotionReferenceFiles([image], async (images) => {
    temporary = images[0].path;
    throw new Error(VT.CANCELLED);
  }),
);
assert.equal(fs.existsSync(temporary), false);
await assert.rejects(withMotionReferenceFiles([{ dataUrl: VT.DATA_IMAGE_PNG_BASE64_AAAA, name: VT.INVALID }], async () => assert.fail(VT.INVALID_BYTES_MUST_NOT_REACH_AI)));
const profile = normalizeMotionReferenceStyle({ description: VT.FLAT_CARTOON_WITH_BOLD_INK, palette: [VT.AABBCC, VT.INVALID], outlineWidth: 4, outlineColor: VT.VALUE_101010, kit: { render: { mode: VT.FLAT_CARTOON_WITH_BOLD_INK } }, images: [{ name: MOTION_REFERENCE_CONFIG.NAME_PREFIX + 1, role: MOTION_REFERENCE_CONFIG.IMAGE_ROLES[4], subjects: [], details: VT.FLAT_CARTOON_WITH_BOLD_INK }] })!;
assert.equal(profile.outlineWidth, 0.06);
assert.deepEqual(profile.palette, [VT.AABBCC]);
const analysis = { title: VT.STYLE_TEST, logline: VT.OBJECTS, look: VT.CLEAN, cast: [], places: [], chapters: [], facts: [], referenceStyle: profile } as MotionStoryAnalysis;
const gen = prepareMotionGen(undefined, analysis, VT.VALUE_2D, VT.REFERENCE_A);
gen.locations.room = { nodes: [] };
assert.ok(prepareMotionGen(gen, analysis, VT.VALUE_2D, VT.REFERENCE_A).locations.room);
assert.deepEqual(prepareMotionGen(gen, analysis, VT.VALUE_2D, VT.REFERENCE_B).locations, {});
gen.characterMotion = true;
assert.equal(compileStorySpec({ title: VT.TEST, language: VT.EN, beats: [{ id: VT.INTRO, chapterId: VT.C1, narration: VT.A_STYLE_REFERENCE_TEST, visual: VT.TITLE }], gen }, analysis, { aspect: VT.VALUE_16_9 }).spec.gen?.characterMotion, true);
assert.equal(hasMotionRenderFailure([VT.STYLE_SIMILARITY_IS_LOW, VT.OUT_OF_FRAME]), false);
assert.equal(hasMotionRenderFailure([VT.MOTION_DRAW_FAILED_MISSING_GEOMETRY]), true);
assert.equal(needsMotionPreview(), true);
assert.equal(needsMotionPreview({ file: image.name, issues: [VT.MOTION_DRAW_FAILED_MISSING_GEOMETRY] }), true);
assert.equal(needsMotionPreview({ file: image.name, issues: [VT.STYLE_SIMILARITY_IS_LOW] }), false);
let attached = 0;
let motionDirected = false;
const extracted = await analyzeStory(parseStorySource(VT.DRAW_A_CARTOON_DINNER_SCENE_IN_A_DARK_ROOM), {
  styleReferences: [image],
  characterMotion: true,
  language: VT.EN,
  length: VT.VALUE_1MIN as any,
  exec: {},
  ai: async (prompt, artifact, _exec, _signal, _log, images) => {
    if (artifact === MOTION_STORY_CONFIG.ARTIFACT_STYLE) {
      assert.ok(prompt.includes(MOTION_REFERENCE_PROMPTS.STYLE_ONLY));
      assert.ok(images?.[0].path && fs.existsSync(images[0].path));
      attached++;
      return { referenceStyle: profile };
    }
    assert.ok(prompt.includes(MOTION_REFERENCE_PROMPTS.PROFILE(profile)));
    motionDirected ||= prompt.includes(VT.AUTHORITATIVE_CHARACTER_MOTION_ENABLED);
    assert.equal(images, undefined);
    return { title: VT.DINNER, chapters: [{ title: VT.DINNER, summary: VT.PEOPLE_AT_A_TABLE }], referenceStyle: profile };
  },
});
assert.equal(attached, 1);
assert.equal(motionDirected, true);
assert.deepEqual(extracted.referenceStyle, profile);
assert.equal(extracted.characterMotion, true);
process.stdout.write(VT.STYLE_REFERENCES_PASSED_LIMITS_VALIDATION_ATTACHMENT_FILES_C);
