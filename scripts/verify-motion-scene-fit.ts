import { MOTION_VERIFICATION_TEXTS as VT, MOTION_VERIFICATION_FORMATS as VF } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.APP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), VT.MOTION_SCENE_FIT));
const lib = await import("../src/server/services/motionSceneLibraryService.ts");
const { normalizeBeats } = await import("../src/server/services/motionStoryService.ts");
const { prepareMotionGen, stageBeats, withBeatPlaces } = await import("../src/server/services/motionGenService.ts");
const quiet = () => {};
const analysis: any = {
  title: VT.FIT,
  logline: VT.EMPTY_2,
  cast: [
    { key: VT.BA_TU, name: VT.BA_TU_2, gender: VT.FEMALE },
    { key: VT.BA_LAM, name: VT.BA_LAM_2, gender: VT.MALE },
    { key: VT.LAN, name: VT.CO_LAN, gender: VT.FEMALE },
  ],
  places: [
    { key: VT.NHA, name: VT.NHA_2, interior: true, time: VT.INTERIOR },
    { key: VT.NHA_THO, name: VT.NHA_THO_2, interior: true, time: VT.INTERIOR },
  ],
};
const beats = normalizeBeats(
  [
    { narration: VT.MOT, visual: VT.SCENE, place: VT.NHA_2, cast: [VT.CO_LAN] },
    { narration: VT.HAI, visual: VT.SCENE, place: VT.CHO_QUE, cast: [VT.BA], action: VT.LAN_MUA_RAU },
    { narration: VT.BA_2, visual: VT.SCENE, place: VT.EMPTY_2, cast: [VT.LAN] },
  ],
  VT.C1,
  analysis,
);
assert.equal(beats[0].place, VT.NHA, VT.EXACT_PLACE_NAME_MATCHES_ITS_OWN_PLACE_NOT_NHA_THO);
assert.deepEqual(beats[0].cast, [VT.LAN]);
assert.ok(beats[1].place && ![VT.NHA, VT.NHA_THO].includes(beats[1].place), VT.AN_UNLISTED_PLACE_KEEPS_ITS_OWN_KEY_INSTEAD_OF_BORROWING_A_LISTED_ONE);
assert.equal(beats[1].placeName, VT.CHO_QUE);
assert.deepEqual(beats[1].cast, [], VT.AN_AMBIGUOUS_SPEAKER_BA_BA_TU_OR_BA_LAM_IS_NOT_GUESSED);
assert.equal(beats[2].place, VT.NHA, VT.NO_PLACE_GIVEN_FIRST_PLACE_AS_BEFORE);
const added = withBeatPlaces(analysis, beats, { log: quiet } as any);
assert.ok(
  added.places.some((p: any) => p.key === beats[1].place && p.name === VT.CHO_QUE),
  VT.THE_UNLISTED_PLACE_IS_ADDED_SO_IT_GETS_DRAWN,
);
const fixture = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const room = fixture.gen.locations.studio;
const gen = prepareMotionGen(undefined, analysis, VT.VALUE_2D);
gen.locations.nha = room;
gen.locations.nha_tho = JSON.parse(JSON.stringify(room));
gen.cast.lan = { ...fixture.gen.cast.person0, poses: { sit: {}, cry: {} }, expressions: { sad: {}, happy: {} } };
const beat: any = { id: VT.B1, chapterId: VT.C1, visual: VT.SCENE, place: VT.NHA, cast: [VT.LAN], narration: VT.LAN_NGOI_KHOC, action: VT.LAN_SITS_AND_CRIES, utterances: [{ id: VT.U, speaker: VT.LAN, role: VT.DIALOGUE, text: VT.LAN_NGOI_KHOC, emotion: VT.SAD, speed: 1, pauseBefore: 0, pauseAfter: 0.2, emphasis: [] }] };
const logs: string[] = [];
await stageBeats([beat], { title: VT.FIT, language: VT.VI, beats: [beat], gen } as any, analysis, gen, { exec: {}, log: (line: string) => logs.push(line), ai: async () => ({ beats: [{ id: VT.B1, location: VT.NHA_THO, actors: [{ cast: VT.LAN, action: VT.DANCE, at: [0, 0], expression: VT.ANGRY }], cameras: [{ shot: VT.MEDIUM, at: 0 }], soundEvents: [] }] }) } as any);
const staged: any = gen.staging.b1;
assert.equal(staged.location, VT.NHA, VT.THE_AI_CANNOT_MOVE_THE_BEAT_TO_ANOTHER_LOCATION);
assert.ok([VT.SIT, VT.CRY].includes(staged.actors[0].action), VF.POSE_FALLBACK_MESSAGE(staged.actors[0].action));
assert.equal(staged.actors[0].expression, VT.SAD, VT.A_FACE_THE_CHARACTER_DOES_NOT_HAVE_FALLS_BACK_TO_THE_LINE_EMOTION);
assert.ok(logs.some((line) => line.includes(VT.NHA_THO)));
const style = VT.PLAIN_2D;
const woman = lib.saveSceneAsset({ kind: VT.CHARACTER, styleKey: style, name: VT.CO_GAI, type: VT.YOUNG_WOMAN, gender: VT.FEMALE }, { parts: [] });
const temple = lib.saveSceneAsset({ kind: VT.LOCATION, styleKey: style, name: VT.CHUA, type: VT.TEMPLE, interior: false }, { stage: {} });
const picked = lib.assignSceneLibrary({ ...analysis, cast: [{ key: VT.NAM, name: VT.ANH_NAM, gender: VT.MALE, type: VT.YOUNG_MAN, reuse: woman.id }], places: [{ key: VT.SAN, name: VT.SAN_2, interior: true, reuse: temple.id }] } as any, style, VT.AI);
assert.equal(picked.cast[0].reuse, undefined, VT.A_FEMALE_ASSET_IS_NOT_GIVEN_TO_A_MALE_ROLE_EVEN_IF_THE_AI_PICKED_IT);
assert.equal(picked.places[0].reuse, undefined, VT.AN_EXTERIOR_ASSET_IS_NOT_GIVEN_TO_AN_INTERIOR_PLACE);
const market = (key: string) => ({ key, name: VT.CHO + key, type: VT.MARKET, interior: false });
const budget = lib.assignSceneLibrary({ ...analysis, cast: [], places: [market(VT.A_2), market(VT.B), { key: VT.C, name: VT.CHO_C, type: VT.MARKET, interior: false }] } as any, style, VT.AUTO, false, { drawBudget: 1, log: quiet });
assert.ok(
  budget.places.every((p: any) => p.reuse !== temple.id),
  VT.OVER_BUDGET_A_MARKET_NEVER_BORROWS_THE_TEMPLE,
);
fs.rmSync(process.env.APP_DATA_DIR!, { recursive: true, force: true });
process.stdout.write(VT.SCENE_FIT_PASSED_EXACT_UNAMBIGUOUS_PLACE_AND_SPEAKER_MATCHING_UNLISTED_P + VT.EMPTY);
