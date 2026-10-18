import { MOTION_STYLE_VERIFICATION_TEXTS as ST, MOTION_STYLE_VERIFICATION_FORMATS as SF } from "./motionStyleVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import { designBible, designLocation, designLocationGroup, prepareMotionGen, withBeatPlaces } from "../src/server/services/motionGenService.ts";
import { validateGenLocation } from "../src/server/services/motionEngineService.ts";
import { createMotionDrawBudget, motionDrawSummary, motionDrawUsed } from "../src/lib/motionDrawBudget.ts";
import { motionFallbackLocation, motionLocationGroups, motionMatchPlace, motionTrimRepeats } from "../src/lib/motionDrawEconomy.ts";
import { MOTION_DRAW_BUDGET } from "../src/constants/motionDrawBudget.ts";
const fixture = JSON.parse(fs.readFileSync(ST.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, ST.UTF8));
const studio = fixture.gen.locations.studio;
const kit = JSON.parse(fs.readFileSync(ST.SCRIPTS_FIXTURES_MOTION_STYLE_KITS_MASK_FLAT_JSON, ST.UTF8));
const places = [
  { key: ST.SAN_NHA, name: ST.SAN_NHA_2, description: ST.FRONT_YARD_OF_A_RURAL_HOUSE, interior: false, time: ST.DAY },
  { key: ST.GIAN_NHA_TREN, name: ST.GIAN_NHA_TREN_2, description: ST.MAIN_ROOM_WITH_THE_FAMILY_ALTAR, interior: true, time: ST.INTERIOR },
  { key: ST.BO_SONG, name: ST.BO_SONG_2, description: ST.A_QUIET_RIVER_BANK, interior: false, time: ST.NIGHT },
];
const analysisFor = (extra: any = {}): any => ({
  title: ST.S,
  logline: ST.L,
  era: ST.VALUE_1980S,
  look: ST.FLAT,
  cast: [
    { key: ST.AN, name: ST.AN_2, gender: ST.MALE },
    { key: ST.BINH, name: ST.BINH_2, gender: ST.FEMALE },
  ],
  places,
  chapters: [],
  facts: [],
  libraryMode: ST.OFF,
  referenceStyle: kit,
  ...extra,
});
const script: any = { title: ST.S, language: ST.VI, beats: [] };
const session: any = { render: async () => [{ file: ST.TMP_X_JPG, issues: [] }] };
const quiet = { exec: {}, log: () => {} };
assert.equal(motionMatchPlace({ key: ST.SAN_TRUOC_NHA, name: ST.SAN_TRUOC_NHA_2 }, places), ST.SAN_NHA, ST.A_WORDIER_KEY_FOR_THE_SAME_YARD_REUSES_THE_DRAWN_YARD);
assert.equal(motionMatchPlace({ key: ST.NHA_BEP, name: ST.NHA_BEP_2 }, places), undefined, ST.A_DIFFERENT_ROOM_IS_NOT_MERGED);
assert.equal(motionMatchPlace({ key: ST.SONG, name: ST.SONG_2 }, places), undefined, ST.ONE_SHARED_WORD_IS_NOT_ENOUGH);
const beats: any[] = [
  { id: ST.B1, visual: ST.SCENE, place: ST.SAN_TRUOC_NHA, placeName: ST.SAN_TRUOC_NHA_2 },
  { id: ST.B2, visual: ST.SCENE, place: ST.NHA_BEP, placeName: ST.NHA_BEP_2 },
];
const logs: string[] = [];
const merged = withBeatPlaces(analysisFor(), beats, { ...quiet, log: (s: string) => logs.push(s) } as any);
assert.equal(beats[0].place, ST.SAN_NHA);
assert.deepEqual(
  merged.places.map((p: any) => p.key),
  [ST.SAN_NHA, ST.GIAN_NHA_TREN, ST.BO_SONG, ST.NHA_BEP],
  ST.ONLY_THE_TRULY_NEW_PLACE_IS_ADDED,
);
assert.ok(
  logs.some((line) => line.includes(ST.SAN_NHA)),
  ST.MERGES_ARE_LOGGED,
);
const groups = motionLocationGroups([...places, { key: ST.X, name: ST.X_2, description: ST.X }], (p) => (p.key === ST.BO_SONG ? 5 : 1));
assert.equal(groups[0][0].key, ST.BO_SONG, ST.BUSIEST_PLACE_IS_DRAWN_FIRST);
assert.ok(groups.every((g) => g.length <= MOTION_DRAW_BUDGET.LOCATION_BATCH));
const tile = (i: number) => ({ shape: ST.REPEAT, count: [20, 1, 20], step: [0.5, 0, 0.5], pos: [i, 0, 0], node: { shape: ST.BOX, size: [0.1, 0.1, 0.1], mat: { color: ST.VALUE_888888 } } });
const repeated = { ...studio, nodes: [...studio.nodes, ...Array.from({ length: 12 }, (_, i) => tile(i))] };
const oversized = validateGenLocation(motionTrimRepeats({ ...studio, nodes: [...studio.nodes, { ...tile(0), count: [40, 1, 40] }] }, 0));
assert.ok((oversized.stats?.instances || 0) > 0 && (oversized.stats?.instances || 0) <= MOTION_DRAW_BUDGET.MAX_REPEAT, ST.AN_OVERSIZED_REPEAT_IS_SHRUNK_INSTEAD_OF_DROPPED);
const before = validateGenLocation(repeated);
assert.ok((before.stats?.instances || 0) > MOTION_DRAW_BUDGET.MAX_INSTANCES);
const trimmed = validateGenLocation(motionTrimRepeats(repeated, before.stats!.instances));
assert.ok((trimmed.stats?.instances || 0) <= MOTION_DRAW_BUDGET.MAX_INSTANCES, ST.TOO_MANY_COPIES_ARE_TRIMMED_INSTEAD_OF_REDRAWN);
for (const place of places) assert.equal(validateGenLocation(motionFallbackLocation(place, kit.palette)).errors.length, 0, SF.CONTEXT(place.key, ST.CODE_BUILT_FALLBACK_LOCATION_IS_VALID));
{
  const analysis = analysisFor();
  const gen = prepareMotionGen(undefined, analysis, ST.VALUE_2D);
  const budget = createMotionDrawBudget();
  let calls = 0;
  const ai = async (text: string) => {
    calls++;
    if (text.includes(ST.LOCATIONS)) return { locations: { san_nha: studio, gian_nha_tren: studio } };
    return { location: studio };
  };
  await designLocationGroup(places as any, script, analysis, gen, session, { ...quiet, ai, drawBudget: budget } as any);
  assert.equal(calls, 2, ST.VALUE_3_LOCATIONS_ONE_BATCHED_REQUEST_PLUS_ONE_SINGLE_REQUEST_FOR_THE_MISSING_ON);
  assert.ok(
    places.every((p) => gen.locations[p.key]),
    ST.EVERY_LOCATION_ENDS_UP_DRAWN,
  );
  assert.equal(budget.used.location, 2);
  assert.ok(motionDrawSummary(budget).includes(ST.VALUE_2_15), ST.SUMMARY_REPORTS_THE_REQUEST_COUNT);
}
{
  const analysis = analysisFor();
  const gen = prepareMotionGen(undefined, analysis, ST.VALUE_2D);
  let calls = 0;
  const broken = { ...studio, nodes: [...studio.nodes, { shape: ST.BLOB, pos: [0, 0, 0] }] };
  await designLocation(places[0] as any, script, analysis, gen, session, { ...quiet, ai: async () => (calls++, { location: broken }), drawBudget: createMotionDrawBudget() } as any);
  assert.equal(calls, 1, ST.A_LOCATION_WITH_ONE_BAD_NODE_IS_KEPT_BAD_NODE_DROPPED_NOT_REDRAWN);
}
{
  const analysis = analysisFor();
  const gen = prepareMotionGen(undefined, analysis, ST.VALUE_2D);
  const budget = createMotionDrawBudget(1);
  let calls = 0;
  const ai = async () => (calls++, { location: { nodes: [] } });
  await designLocation(places[0] as any, script, analysis, gen, session, { ...quiet, ai, drawBudget: budget, retryDelayMs: 0 } as any);
  assert.equal(calls, 1, ST.BUDGET_OF_1_NO_SECOND_ATTEMPT);
  assert.ok(gen.locations.san_nha?.nodes?.length, ST.OUT_OF_BUDGET_A_CODE_BUILT_LOCATION_IS_USED);
  await designLocation(places[1] as any, script, analysis, gen, session, { ...quiet, ai, drawBudget: budget } as any);
  assert.equal(calls, 1, ST.EXHAUSTED_BUDGET_NO_MORE_AI_REQUESTS);
  assert.equal(motionDrawUsed(budget), 1);
}
{
  const analysis = analysisFor();
  const gen = prepareMotionGen(undefined, analysis, ST.VALUE_2D);
  const budget = createMotionDrawBudget(0);
  let calls = 0;
  await designBible(analysis, gen, { ...quiet, ai: async () => (calls++, {}), drawBudget: budget } as any);
  assert.equal(calls, 0);
  for (const key of [ST.AN, ST.BINH]) {
    const design: any = gen.cast[key];
    assert.ok(design?.parts?.length, SF.CONTEXT(key, ST.FALLBACK_CHARACTER_DRAWN_BY_CODE));
    assert.equal(design.materials.skin.color.toUpperCase(), ST.EEF3F6, SF.CONTEXT(key, ST.FALLBACK_FACE_FOLLOWS_THE_KIT));
  }
  assert.notEqual((gen.cast.an as any).materials.body.color, (gen.cast.binh as any).materials.body.color, ST.FALLBACK_CHARACTERS_DIFFER_BY_THE_KIT_S_BODY_COLOURS);
}
process.stdout.write(ST.DRAW_ECONOMY_PASSED_DUPLICATE_PLACES_MERGED_BUSIEST_FIRST_BATCHED_LOCATION + ST.EMPTY);
