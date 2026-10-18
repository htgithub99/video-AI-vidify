import { MOTION_STYLE_VERIFICATION_TEXTS as ST, MOTION_STYLE_VERIFICATION_FORMATS as SF } from "./motionStyleVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import { designBible, designLocation, prepareMotionGen, stageBeats } from "../src/server/services/motionGenService.ts";
import { productionPreamble } from "../src/lib/motionDirection.ts";
import { motionEnforceStyle, motionStyleConstraints } from "../src/lib/motionStyleConstraints.ts";
import { MOTION_STYLE_RULES as R } from "../src/constants/motionStyleConstraints.ts";
import { MOTION_GEN_DRAW_MODE, MOTION_GEN_POSE_PROMPTS } from "../src/constants/motionGenPrompts.ts";
import { MOTION_SCENE_CATALOG_PROMPT } from "../src/constants/motionSceneCatalog.ts";
import { readMotionStyleFixture as kit } from "./helpers/motionStyleFixture.ts";
const fixture = JSON.parse(fs.readFileSync(ST.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, ST.UTF8));
const box = (pos: number[], size: number[], mat: string = ST.BODY) => ({ shape: ST.BOX, pos, size, mat });
const design = {
  materials: { skin: { color: ST.F4C29E }, body: { color: ST.VALUE_5A6068 }, hair: { color: ST.VALUE_111111 } },
  parts: [
    { id: ST.BODY, pos: [0, 0, 0], nodes: [box([0, 0.6, 0], [0.5, 1.2, 0.3])] },
    { id: ST.HEAD, parent: ST.BODY, pos: [0, 1.4, 0], nodes: [{ shape: ST.SPHERE, radius: 0.3, pos: [0, 0, 0], mat: ST.SKIN }] },
    { id: ST.HAIR, parent: ST.HEAD, pos: [0, 0.2, -0.05], nodes: [box([0, 0, 0], [0.5, 0.2, 0.4], ST.HAIR)] },
    { id: ST.NOSE, parent: ST.HEAD, pos: [0, 0, 0.3], nodes: [box([0, 0, 0], [0.04, 0.06, 0.04], ST.SKIN)] },
    { id: ST.ARM_R, parent: ST.BODY, pos: [0.3, 1.1, 0], nodes: [box([0, -0.3, 0], [0.1, 0.6, 0.1])] },
  ],
  anchors: { body: ST.BODY, head: ST.HEAD },
  poses: { idle: {}, look: { hair: { rot: [0, 10, 0] } } },
  expressions: { sad: { head: { rot: [5, 0, 0] } } },
};
const analysisFor = (style: unknown): any => ({
  title: ST.STYLE,
  logline: ST.A_TEST,
  era: ST.EMPTY_3,
  look: ST.MOODY_HORROR_FOGGY_NIGHTS,
  cast: [
    { key: ST.AN, name: ST.AN_2, gender: ST.MALE },
    { key: ST.BINH, name: ST.BINH_2, gender: ST.FEMALE },
  ],
  places: [{ key: ST.YARD, name: ST.YARD_2, description: ST.A_YARD }],
  chapters: [],
  facts: [],
  videoGenre: ST.HORROR,
  ...(style ? { referenceStyle: style } : {}),
});
const bible = async (style: unknown, mode: "2d" | "3d") => {
  const analysis = analysisFor(style);
  const gen = prepareMotionGen(undefined, analysis, mode);
  let prompt: string = ST.EMPTY_3;
  await designBible(analysis, gen, { exec: {}, log: () => {}, preamble: productionPreamble(analysis, ST.VISUAL, false), ai: async (text: string) => ((prompt = text), { style: { notes: ST.N }, cast: { an: JSON.parse(JSON.stringify(design)), binh: JSON.parse(JSON.stringify(design)) } }) } as any);
  return { prompt, gen };
};
const location = async (style: unknown, mode: "2d" | "3d") => {
  const analysis = analysisFor(style);
  const gen = prepareMotionGen(undefined, analysis, mode);
  let prompt: string = ST.EMPTY_3;
  const session: any = { render: async () => [{ file: ST.TMP_PREVIEW_JPG, issues: [] }] };
  await designLocation(analysis.places[0], { title: ST.S, language: ST.EN, beats: [] } as any, analysis, gen, session, { exec: {}, log: () => {}, preamble: productionPreamble(analysis, ST.VISUAL, false), ai: async (text: string) => ((prompt = text), { location: fixture.gen.locations.studio }) } as any);
  return prompt;
};
for (const mode of [ST.VALUE_2D, ST.VALUE_3D] as const) {
  const mask = await bible(kit(ST.MASK_FLAT), mode);
  assert.ok(mask.prompt.includes(R.SHARED(ST.BODY_OR_CLOTHING_COLOUR)), SF.CONTEXT(mode, ST.IDENTICAL_FIGURES_ARE_TOLD_APART_BY_COLOUR_ONLY));
  assert.ok(!mask.prompt.includes(R.DISTINGUISH_DEFAULT), SF.CONTEXT(mode, ST.NO_DIFFERENT_SILHOUETTE_DEMAND_AGAINST_THE_KIT));
  assert.ok(!mask.prompt.includes(ST.USE_A_REAL_SKIN_TONE), SF.CONTEXT(mode, ST.NO_REAL_SKIN_DEFAULT_WHEN_THE_KIT_GIVES_THE_FACE_FILL));
  assert.ok(mask.prompt.includes(ST.EEF3F6));
  assert.match(mask.prompt, ST.PATTERN_NOT_IN_THIS_STYLE_NEVER_DRAW_THESE_NOT_EVEN_AS_HIDDEN_PARTS_N_HAIR);
  assert.ok(mask.prompt.includes(R.GLIDE), SF.CONTEXT(mode, ST.LEGLESS_FIGURES_GLIDE_INSTEAD_OF_GETTING_LEGS));
  assert.ok(!mask.prompt.includes(ST.SHOES) && !mask.prompt.includes(ST.OPT_BEARD), SF.CONTEXT(mode, ST.NO_HAIR_CLOTHING_ACCESSORY_MATERIAL_HINTS));
  assert.ok(mask.prompt.includes(MOTION_GEN_POSE_PROMPTS.ANCHORS_ARMS), SF.CONTEXT(mode, ST.ARMS_ONLY_NO_LEG_ANCHORS));
  assert.doesNotMatch(mask.prompt, ST.PATTERN_STANDARD_NAMES_WHENEVER_THE_ACTION_MATCHES_BWALK_B, SF.CONTEXT(mode, ST.NO_LEG_POSES_REQUESTED));
  assert.match(mask.prompt, ST.PATTERN_EFFECTS_THIS_STYLE_NEVER_USES_FOG);
  assert.ok(mask.prompt.includes(R.NIGHT_TINT));
  assert.equal((mask.prompt.match(ST.PATTERN_REFERENCE_DRAWING_REQUIREMENTS_G) || []).length, 1, SF.CONTEXT(mode, ST.THE_KIT_IS_SENT_ONCE));
  assert.equal((mask.prompt.match(ST.PATTERN_PROJECT_STYLE_KIT_FROM_THE_USER_G) || []).length, 0, SF.CONTEXT(mode, ST.NO_SECOND_COPY_OF_THE_KIT_IN_THE_PREAMBLE));
  const an: any = mask.gen.cast.an;
  assert.equal(an.parts.find((p: any) => p.id === ST.HAIR).visible, false, SF.CONTEXT(mode, ST.A_DRAWN_PART_THE_STYLE_LACKS_IS_HIDDEN_BY_CODE));
  assert.equal(an.parts.find((p: any) => p.id === ST.NOSE).nodes.length, 0);
  assert.equal(an.materials.skin.color, ST.EEF3F6, SF.CONTEXT(mode, ST.FACE_FILL_FOLLOWS_THE_KIT));
  assert.equal(an.poses.look.hair, undefined);
  assert.equal(mask.gen.style.faceShading, false, SF.CONTEXT(mode, ST.FLAT_KIT_NO_FACE_SHADING));
  assert.ok((mask.gen.style.outlineWidth || 0) >= 0.028, SF.CONTEXT(mode, ST.THICK_OUTLINE_FROM_THE_KIT_DESCRIPTION));
  const cel = await bible(kit(ST.CEL_FAMILY), mode);
  assert.ok(cel.prompt.includes(R.DISTINGUISH_DEFAULT), SF.CONTEXT(mode, ST.A_STYLE_WITH_VARIED_FIGURES_KEEPS_THE_VARIETY_RULE));
  assert.ok(cel.prompt.includes(ST.HAIR_2) && cel.prompt.includes(ST.SHOES));
  assert.ok(cel.prompt.includes(MOTION_GEN_POSE_PROMPTS.ANCHORS_FULL));
  assert.ok(!cel.prompt.includes(ST.NOT_IN_THIS_STYLE));
  assert.equal(cel.gen.style.faceShading, true, SF.CONTEXT(mode, ST.TWO_TONE_CEL_KEEPS_FACE_SHADING_2));
  assert.ok((cel.gen.cast.an as any).parts.find((p: any) => p.id === ST.HAIR).nodes.length > 0, SF.CONTEXT(mode, ST.HAIR_STAYS_WHEN_THE_STYLE_HAS_HAIR));
  const peg = await bible(kit(ST.PEG_DOLL), mode);
  assert.ok(peg.prompt.includes(R.NO_ARMS));
  assert.ok(peg.prompt.includes(MOTION_GEN_POSE_PROMPTS.ANCHORS_NONE));
  assert.doesNotMatch(peg.prompt, ST.PATTERN_STANDARD_NAMES_WHENEVER_THE_ACTION_MATCHES_B_WAVE_POINT_B);
  const none = await bible(undefined, mode);
  for (const rule of [R.DISTINGUISH_DEFAULT, R.FACE_DEFAULT, R.ARMS_DEFAULT, MOTION_SCENE_CATALOG_PROMPT.CHARACTER_SCHEMA, MOTION_GEN_POSE_PROMPTS.ANCHORS_FULL]) assert.ok(none.prompt.includes(rule), SF.CONTEXT(mode, ST.WITHOUT_A_KIT_THE_DEFAULTS_ARE_UNCHANGED));
  assert.ok(!none.prompt.includes(ST.STYLE_PRECEDENCE));
  const place = await location(kit(ST.MASK_FLAT), mode);
  assert.ok(place.includes(mode === ST.VALUE_2D ? MOTION_GEN_DRAW_MODE.ROLE_2D : MOTION_GEN_DRAW_MODE.ROLE_3D), SF.CONTEXT(mode, ST.LOCATION_ROLE_FOLLOWS_THE_DRAWING_MODE));
  assert.equal(place.includes(MOTION_GEN_DRAW_MODE.EXAMPLE_NOTE_2D), mode === ST.VALUE_2D);
  assert.equal(place.includes(MOTION_GEN_DRAW_MODE.GUIDE_HEAD_2D), mode === ST.VALUE_2D);
  assert.match(place, ST.PATTERN_EFFECTS_THIS_STYLE_NEVER_USES_FOG, SF.CONTEXT(mode, ST.THE_GENRE_S_FOG_CANNOT_OVERRIDE_THE_KIT));
  assert.match(place, ST.PATTERN_FX_NO_PARTICLES_RAIN_OR_FOG_SHOWN, SF.CONTEXT(mode, ST.LOCATION_REQUIREMENTS_CARRY_THE_KIT_EFFECTS));
}
assert.equal(motionStyleConstraints(kit(ST.CEL_FAMILY_BRIEF), ST.VALUE_2D).shading.kind, ST.CEL);
assert.equal(motionEnforceStyle(design, motionStyleConstraints(undefined)).changes.length, 0, ST.NO_KIT_DESIGNS_ARE_NEVER_TOUCHED);
const analysis = analysisFor(kit(ST.MASK_FLAT));
const gen = prepareMotionGen(undefined, analysis, ST.VALUE_2D);
gen.cast.an = design as any;
gen.locations.yard = fixture.gen.locations.studio;
let staging: string = ST.EMPTY_3;
const beat: any = { id: ST.S1, chapterId: ST.C, visual: ST.SCENE, place: ST.YARD, cast: [ST.AN], narration: ST.AN_WAITS_IN_THE_FOG, action: ST.AN_WAITS };
await stageBeats([beat], { title: ST.S, language: ST.EN, beats: [beat], gen } as any, analysis, gen, { exec: {}, log: () => {}, ai: async (text: string) => ((staging = text), { beats: [{ id: ST.S1, location: ST.YARD, actors: [{ cast: ST.AN, action: ST.IDLE, at: [0, 0] }], cameras: [{ shot: ST.MEDIUM }], soundEvents: [] }] }) } as any);
assert.ok(staging.includes(ST.STYLE_PRECEDENCE) && ST.PATTERN_EFFECTS_THIS_STYLE_NEVER_USES_FOG.test(staging), ST.STAGING_ALSO_KEEPS_GENRE_STORY_EFFECTS_INSIDE_THE_KIT);
process.stdout.write(ST.STYLE_PROMPTS_PASSED_KIT_DRIVEN_CHARACTER_LOCATION_STAGING_RULES_FOR_FLAT_ + ST.EMPTY);
