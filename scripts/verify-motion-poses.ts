import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { motionCastNeeds, motionLimbParts, motionPoseBounds, motionPoseNamesIn, motionProceduralPose, motionSanitizePoses, motionCastSummary } from "../src/lib/motionPoses.ts";
import { completeCastPoses, prepareMotionGen, stageBeats } from "../src/server/services/motionGenService.ts";
import { MOTION_GEN_CONFIG } from "../src/constants/motionGenPrompts.ts";
const box = (pos: number[], size: number[]) => ({ shape: VT.BOX, pos, size, mat: { color: VT.C08060 } });
const design = (): any => ({
  parts: [
    { id: VT.BODY, pos: [0, 0, 0], nodes: [box([0, 0.95, 0], [0.4, 0.8, 0.25])] },
    { id: VT.HEAD, parent: VT.BODY, pos: [0, 1.5, 0], nodes: [{ shape: VT.SPHERE, radius: 0.15, pos: [0, 0, 0], mat: { color: VT.C08060 } }] },
    { id: VT.ARM_R, parent: VT.BODY, pos: [0.25, 1.3, 0], nodes: [box([0, -0.3, 0], [0.08, 0.6, 0.08])] },
    { id: VT.ARM_L, parent: VT.BODY, pos: [-0.25, 1.3, 0], nodes: [box([0, -0.3, 0], [0.08, 0.6, 0.08])] },
    { id: VT.LEG_R, parent: VT.BODY, pos: [0.1, 0.55, 0], nodes: [box([0, -0.275, 0], [0.12, 0.55, 0.12])] },
    { id: VT.LEG_L, parent: VT.BODY, pos: [-0.1, 0.55, 0], nodes: [box([0, -0.275, 0], [0.12, 0.55, 0.12])] },
  ],
  anchors: { body: VT.BODY, head: VT.HEAD },
  poses: { idle: {} },
  expressions: { sad: { head: { rot: [5, 0, 0] } } },
  motions: {},
});
const limbs = motionLimbParts(design());
assert.deepEqual([limbs.armRight, limbs.armLeft, limbs.legRight, limbs.legLeft, limbs.head], [VT.ARM_R, VT.ARM_L, VT.LEG_R, VT.LEG_L, VT.HEAD]);
const rest = motionPoseBounds(design());
assert.ok(Math.abs(rest.minY) < 1e-6 && rest.maxY > 1.6);
const walk = motionProceduralPose(design(), VT.WALK)!;
assert.ok(walk.leg_r.rot![0] < 0 && walk.leg_l.rot![0] > 0, VT.LEGS_SWING_OPPOSITE_WAYS);
assert.ok(Math.abs(motionPoseBounds(design(), walk).minY) < 0.04 * rest.maxY, VT.GENERATED_STANDING_POSES_KEEP_THE_FEET_ON_THE_FLOOR);
assert.equal(motionProceduralPose(design(), VT.POINT)!.arm_r.rot![0], -80);
const sit = motionProceduralPose(design(), VT.SIT)!;
assert.ok(motionPoseBounds(design(), sit).minY >= -1e-6, VT.A_SEATED_POSE_NEVER_SINKS_BELOW_THE_FLOOR);
const lie = motionProceduralPose(design(), VT.LIE)!;
assert.ok(Math.abs(motionPoseBounds(design(), lie).minY) < 0.05, VT.A_LYING_POSE_RESTS_ON_THE_FLOOR);
assert.equal(motionProceduralPose({ parts: [{ id: VT.BLOB, pos: [0, 0, 0], nodes: [box([0, 0.5, 0], [1, 1, 1])] }] }, VT.WAVE), undefined, VT.NO_LIMBS_NOTHING_IS_INVENTED);
const checked = motionSanitizePoses({ ...design(), poses: { idle: {}, look_back: { head: { rot: [0, 170, 0] } }, float: { body: { pos: [0, 0.5, 0] } }, ghost: { tail: { rot: [0, 0, 10] } }, grow: { body: { scale: [9, 9, 9] } } } });
assert.equal(checked.design.poses.look_back.head.rot[1], 70, VT.HEAD_TURN_IS_LIMITED);
assert.ok(Math.abs(motionPoseBounds(checked.design, checked.design.poses.float).minY) < 0.05, VT.A_FLOATING_STANDING_POSE_IS_PUT_BACK_ON_THE_FLOOR);
assert.deepEqual(checked.design.poses.ghost, {}, VT.TRANSFORMS_OF_PARTS_THAT_DO_NOT_EXIST_ARE_DROPPED);
assert.equal(checked.design.poses.grow.body.scale[0], 2.5);
assert.ok(checked.changes.length >= 4);
assert.deepEqual(
  motionPoseNamesIn(VT.LAN_NGOI_XUONG_ROI_KHOC),
  [VT.SIT, VT.CRY].sort((a, b) => [VT.SIT, VT.CRY].indexOf(a) - [VT.SIT, VT.CRY].indexOf(b)),
);
assert.ok(!motionPoseNamesIn(VT.NAM_DUNG_NHIN_RA_CUA).includes(VT.LIE));
const beats: any[] = [
  { id: VT.B1, visual: VT.SCENE, cast: [VT.LAN], action: VT.LAN_NGOI_XUONG_BAC_THEM_VA_KHOC, narration: VT.LAN_NGOI_KHOC, utterances: [{ speaker: VT.LAN, emotion: VT.SAD }] },
  { id: VT.B2, visual: VT.SCENE, cast: [VT.LAN, VT.NAM], action: VT.NAM_CHAY_TOI_LAN_VAY_TAY, narration: VT.NAM_CHAY_TOI_LAN_VAY_TAY_2 },
];
const needs = motionCastNeeds(
  beats,
  [
    { key: VT.LAN, name: VT.LAN_2 },
    { key: VT.NAM, name: VT.NAM_2 },
  ] as any,
  MOTION_GEN_CONFIG.AUTO_EMOTION_EXPRESSION,
);
assert.deepEqual(needs.lan.poses.sort(), [VT.CRY, VT.SIT, VT.WAVE].sort());
assert.deepEqual(needs.lan.expressions, [VT.SAD]);
assert.deepEqual(needs.nam.poses, [VT.RUN], VT.ONLY_THE_SENTENCES_NAMING_NAM_COUNT_FOR_NAM);
const analysis: any = {
  title: VT.P,
  logline: VT.EMPTY_2,
  cast: [
    { key: VT.LAN, name: VT.LAN_2 },
    { key: VT.NAM, name: VT.NAM_2 },
  ],
  places: [],
};
const gen = prepareMotionGen(undefined, analysis, VT.VALUE_2D);
gen.cast.lan = design();
gen.cast.nam = design();
const prompts: string[] = [];
await completeCastPoses(analysis, gen, { lan: { poses: [VT.SIT, VT.CRY], expressions: [VT.SAD], lines: [VT.LAN_NGOI_KHOC_2] }, nam: { poses: [VT.RUN], expressions: [], lines: [VT.NAM_CHAY_TOI] } }, {
  exec: {},
  log: () => {},
  ai: async (prompt: string) => {
    prompts.push(prompt);
    return { poses: { sit: { leg_r: { rot: [-80, 0, 0] }, leg_l: { rot: [-80, 0, 0] } }, cry: { head: { rot: [20, 0, 0] }, arm_r: { rot: [-120, 0, 0] } } } };
  },
} as any);
assert.equal(prompts.length, 1, VT.NAM_S_RUN_IS_GENERATED_BY_CODE_ONLY_LAN_S_CRY_NEEDS_THE_AI);
assert.match(prompts[0], VT.MISSING_POSES_RE);
assert.doesNotMatch(prompts[0], VT.GEOMETRY_NODES_RE, VT.THE_PATCH_REQUEST_DESCRIBES_PARTS_IT_DOES_NOT_RESEND_GEOMETRY);
assert.ok((gen.cast.lan as any).poses.cry && (gen.cast.lan as any).poses.sit && (gen.cast.nam as any).poses.run);
assert.ok((gen.cast.lan as any).expressions.sad, VT.EXISTING_EXPRESSIONS_ARE_KEPT);
const fixture = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
gen.locations.room = fixture.gen.locations.studio;
let staging = VT.EMPTY_2;
const beat: any = { id: VT.S1, chapterId: VT.C, visual: VT.SCENE, place: VT.ROOM, cast: [VT.LAN], narration: VT.LAN_NGOI_KHOC, action: VT.LAN_NGOI_KHOC_2 };
await stageBeats([beat], { title: VT.P, language: VT.VI, beats: [beat], gen } as any, analysis, gen, { exec: {}, log: () => {}, ai: async (prompt: string) => ((staging = prompt), { beats: [{ id: VT.S1, location: VT.ROOM, actors: [{ cast: VT.LAN, action: VT.SIT, at: [0, 0] }], cameras: [{ shot: VT.MEDIUM }], soundEvents: [] }] }) } as any);
assert.match(staging, VT.STAGING_POSE_NAMES_RE, VT.STAGING_SEES_THE_CHARACTER_S_POSE_NAMES);
assert.doesNotMatch(staging.slice(staging.indexOf(VT.CAST), staging.indexOf(VT.LOCATIONS)), VT.GEOMETRY_NODES_RE, VT.STAGING_NO_LONGER_RECEIVES_CHARACTER_GEOMETRY);
assert.ok((motionCastSummary(gen.cast.lan, false).height as number) > 1.6);
process.stdout.write(VT.POSES_PASSED_SCRIPT_DRIVEN_NEEDS_STANDARD_NAMES_SLIM_STAGING_MISSING_POS + VT.EMPTY);
