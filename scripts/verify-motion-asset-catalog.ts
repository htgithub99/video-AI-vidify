import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AV as V } from "./motionAssetVerificationTexts.js";
import { visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import { PA } from "../src/constants/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_TYPES } from "../src/constants/motionPuppet.js";
import { puppetObjectClass, puppetObjectIsGeometry, puppetObjectNeedsSpot, puppetPropFits, puppetPropReferenceFits, preferredPuppetProps, puppetSceneFeatureFits, puppetObjectRequirements } from "../src/lib/motionPuppetAssets.js";
import { cleanPuppetSpots, puppetSetMissingRequirements, puppetSetPlacementNeeds } from "../src/server/services/puppet/layout.js";
import { englishPuppetAnalysis } from "../src/server/services/puppet/assetProfiles.js";
import { drawPuppetProps, drawPuppetSets, matchLibraryProps, matchArchetypes } from "../src/server/services/puppet/kitDraw.js";
import { readPuppetLines } from "../src/server/services/puppet/director.js";
import { newPuppetId, writePuppet, puppetLibDir } from "../src/server/services/puppet/kitLibrary.js";
import { STORAGE_CONFIG } from "../src/constants/storage.js";
import type { PuppetObject, PuppetProp } from "../src/types/motionPuppet.js";
const out = path.resolve(V.OUT);
fs.mkdirSync(out, { recursive: true });
const temp = fs.mkdtempSync(path.join(out, V.PREFIX));
const env = process.env[STORAGE_CONFIG.ENV_DIR],
  app = process.env.APP_DATA_DIR;
process.env[STORAGE_CONFIG.ENV_DIR] = temp;
delete process.env.APP_DATA_DIR;
const style = { ...JSON.parse(fs.readFileSync(path.resolve(V.STYLE), PA.UTF8)), refs: [], refKinds: {} };
const ob = (key: string, type = VT.OTHER): PuppetObject => ({ key, type, word: key, note: key, description: key, mount: VT.HELD, size: 0.3 });
const prop = (key: string, extra: Partial<PuppetProp> = {}): PuppetProp => ({ id: newPuppetId(PUPPET_TYPES.PROP), type: PUPPET_TYPES.PROP, styleId: style.id, key, name: key, desc: key, tags: [key], svg: V.SVG, base: [256, 480], height: 0.3, size: 0.3, uses: 0, updatedAt: VT.VALUE_2026_10_21T00_00_00Z, ...extra });
try {
  assert.deepEqual(puppetObjectRequirements({ word: "Dải chỉ tang đen", requirements: [] }), ["black"]);
  assert.deepEqual(puppetObjectRequirements({ word: "đồng tiền", requirements: [] }), []);
  assert.equal(puppetPropFits({ ...ob("red_binding_thread"), word: "Dải chỉ tang đen" }, prop("red_binding_thread")), false);
  assert.equal(puppetPropFits({ ...ob("white_mourning_sash"), word: "khăn trắng" }, prop("white_mourning_sash")), true);
  const contacts = Array.from({ length: V.CONTACT_COUNT }, (_, index) => ({ key: V.CONTACT_PREFIX + index, kind: P.SPOT_SIT, x: 100 + index * 20, y: 900 }));
  assert.equal(cleanPuppetSpots(contacts).length, contacts.length);
  const seating = {
    states: [
      { char: VT.A, action: P.SPOT_SIT, support: V.BED },
      { char: VT.B, action: P.SPOT_SIT, support: V.BED },
    ],
  } as any;
  assert.deepEqual(puppetSetPlacementNeeds([seating, seating, { states: [seating.states[0]] } as any]), [{ support: V.BED, kind: P.SPOT_SIT, count: 2 }]);
  const geometry = V.GEOMETRY.map((key) => ({ ...ob(key, P.OBJECT_TYPE_DEFAULT), type: P.ANCHORED_FEATURE_TYPES[1], category: PA.SCENE_FEATURE }));
  assert.ok(geometry.every(puppetObjectIsGeometry));
  assert.ok(geometry.every((item) => !puppetObjectNeedsSpot(item)));
  assert.ok(puppetObjectNeedsSpot({ key: V.BED, type: P.ANCHORED_FEATURE_TYPES[0], category: PA.SCENE_FEATURE }));
  assert.ok(puppetSceneFeatureFits(V.GEOMETRY[0], V.GEOMETRY_DESC));
  assert.equal(puppetSceneFeatureFits(V.GEOMETRY[0], V.WRONG_WALL), false);
  const set: any = { name: V.ROOM, desc: V.ROOM, tags: [], svg: V.GEOMETRY_SVG, spots: [], floorY: 900 };
  assert.deepEqual(puppetSetMissingRequirements(set, [{ states: [], objects: geometry } as any]), []);
  assert.ok(puppetSetMissingRequirements({ ...set, svg: V.EMPTY_SVG }, [{ states: [], objects: geometry } as any]).length);
  assert.ok(puppetSetMissingRequirements(set, [{ states: [], object: { ...ob(V.BED), type: P.ANCHORED_FEATURE_TYPES[0], category: PA.SCENE_FEATURE } } as any]).includes(V.BED));
  let setDrafts = 0;
  const place: any = { key: V.ROOM_KEY, name: V.ROOM, desc: V.ROOM, interior: true, time: P.DAY };
  const setOptions: any = { exec: {}, log() {}, ai: async (_prompt: string, artifact: string) => (artifact === P.ARTIFACT_SET ? (setDrafts++, { svg: V.SET_SVG }) : V.MINOR_REVIEW) };
  const illustrative = await drawPuppetSets(style, [{ key: place.key, place, uses: V.ROOM }], setOptions);
  assert.ok(illustrative[place.key]);
  assert.equal(setDrafts, 1);
  setDrafts = 0;
  setOptions.ai = async (_prompt: string, artifact: string) => (artifact === P.ARTIFACT_SET ? (setDrafts++, { svg: V.SET_SVG }) : V.CRITICAL_REVIEW);
  await assert.rejects(drawPuppetSets(style, [{ key: place.key, place, uses: V.ROOM }], setOptions));
  assert.equal(setDrafts, P.DRAW_TRIES);
  let mentionedCalls = 0;
  const mentionedLine: any = { key: V.MENTIONED_KEY, text: V.MENTIONED_LINE };
  const mentionedRead = await readPuppetLines(
    [mentionedLine],
    [mentionedLine],
    V.VI as any,
    {},
    {},
    {
      exec: {} as any,
      log() {},
      ai: async () => {
        mentionedCalls++;
        return { lines: [{ i: 0, visual: visualReadFixture(V.MENTIONED_KEY, V.MENTIONED_LINE), focus: P.FOCUS_OBJECT, object: { ...ob(V.MENTIONED_KEY), presence: PA.MENTIONED } }] };
      },
    },
  );
  assert.equal(mentionedRead.reads[V.MENTIONED_KEY].object, null);
  assert.equal(mentionedRead.reads[V.MENTIONED_KEY].objects?.length, 0);
  assert.equal(mentionedCalls, 1);
  for (const test of V.OBJECTS) {
    assert.equal(puppetObjectClass(test), test.expected);
    const line: any = { key: test.key, text: test.word, place: VT.BUONG_NGU };
    const result = await readPuppetLines([line], [line], V.VI as any, {}, {}, { exec: {} as any, log: () => {}, ai: async () => ({ lines: [{ i: 0, visual: visualReadFixture(VT.BUONG_NGU, test.word), focus: VT.OBJECT, object: { ...test, size: 1, mount: VT.HELD } }] }) });
    const read = result.reads[test.key];
    if (test.expected === PA.EXCLUDED) assert.equal(read.object, null);
    else {
      assert.equal(read.object?.key, test.key);
      if (test.expected === PA.SCENERY) assert.equal(read.object?.type, PA.SCENERY);
    }
  }
  assert.equal(puppetPropFits(ob(VT.CHISEL, VT.TOOL), prop(VT.KNIFE, { tags: [VT.CHISEL, VT.KNIFE] })), false);
  assert.equal(puppetPropReferenceFits(VT.CHISEL, prop(VT.KNIFE)), false);
  assert.equal(puppetPropReferenceFits(VT.RED_BILLED_CROW, prop(VT.CROW)), false);
  assert.equal(puppetPropReferenceFits(VT.RED_BILLED_CROW, prop(VT.BLACK_CROW_RED_BEAK)), true);
  assert.equal(puppetPropFits(ob(VT.RED_BILLED_CROW, VT.CREATURE), prop(VT.CROW)), false);
  assert.equal(puppetPropFits(ob(VT.RED_BILLED_CROW, VT.CREATURE), prop(VT.BLACK_CROW_RED_BEAK)), true);
  assert.equal(puppetPropFits(ob(VT.INTACT_RED_THREAD), prop(VT.SNAPPED_RED_THREAD)), false);
  assert.equal(puppetPropFits(ob(VT.RUSTY_COIN), prop(VT.ANCIENT_BRONZE_COINS)), false);
  assert.equal(puppetPropFits(ob(VT.CRUSHED_GARLIC), prop(VT.GARLIC)), false);
  assert.equal(puppetPropFits(ob(VT.HAMMER, VT.TOOL), prop(VT.HAMMER, { catalogStatus: PA.QUARANTINE })), false);
  const older = prop(VT.HAMMER),
    seed = prop(VT.HAMMER, { tags: [VT.SEED], catalogVersion: PA.VERSION, updatedAt: VT.VALUE_2026_10_22T00_00_00Z });
  assert.equal(preferredPuppetProps([older, seed])[0].id, seed.id);
  assert.equal(preferredPuppetProps([seed, older])[0].id, seed.id);
  assert.equal(
    preferredPuppetProps([
      { ...older, catalogVersion: PA.VERSION },
      { ...seed, catalogVersion: undefined },
    ])[0].id,
    seed.id,
  );
  writePuppet(older);
  writePuppet(seed);
  writePuppet(prop(VT.KNIFE, { tags: [VT.CHISEL] }));
  const hit = await matchLibraryProps(style, [ob(VT.HAMMER, VT.TOOL), ob(VT.CHISEL, VT.TOOL)], {
    exec: {} as any,
    log: () => {},
    ai: async () => {
      throw new Error(VT.UNEXPECTED_AI_MATCH);
    },
  });
  assert.equal(hit.hammer.id, seed.id);
  assert.equal(hit.chisel, undefined);
  writePuppet({ id: newPuppetId(PUPPET_TYPES.CHARACTER), type: PUPPET_TYPES.CHARACTER, styleId: style.id, archetype: VT.VILLAGE_WOMAN, group: VT.VILLAGER_WOMAN, gender: VT.FEMALE, age: VT.ADULT, name: VT.VILLAGE_WOMAN_5DECF6C3, desc: VT.ADULT_WOMAN_IN_BROWN_CLOTHES, tags: [], height: 1, colors: {}, head: {}, body: {}, sprites: {}, uses: 0, updatedAt: new Date().toISOString() });
  const stockOptions: any = { exec: {}, log: () => {}, ai: async () => ({ matches: [{ key: VT.PERSON, archetype: VT.VILLAGE_WOMAN }] }) };
  assert.deepEqual(await matchArchetypes(style, [{ key: VT.PERSON, name: VT.MAN, gender: VT.MALE, age: VT.ADULT } as any], stockOptions), {});
  assert.deepEqual(await matchArchetypes(style, [{ key: VT.PERSON, name: VT.GIRL, gender: VT.FEMALE, age: VT.CHILD } as any], stockOptions), {});
  const input = structuredClone(V.VI) as any;
  let translations = 0;
  const drawing: any = { provider: VT.DRAW };
  const options: any = {
    exec: drawing,
    mainExec: { provider: VT.MAIN },
    log: () => {},
    ai: async (_p: string, artifact: string, exec: any) => {
      assert.equal(artifact, PA.ARTIFACT);
      assert.equal(exec, drawing);
      translations++;
      return V.EN;
    },
  };
  const translated = await englishPuppetAnalysis(input, options);
  assert.equal(translated.cast[0].name, V.EN.cast[0].name);
  assert.equal(translated.cast[0].key, V.VI.cast[0].key);
  assert.equal(translated.cast[0].gender, V.VI.cast[0].gender);
  assert.equal(translated.cast[0].age, V.VI.cast[0].age);
  assert.equal(translated.places[0].interior, V.VI.places[0].interior);
  assert.equal(translated.places[0].time, V.VI.places[0].time);
  assert.deepEqual(input, V.VI);
  await englishPuppetAnalysis(input, options);
  assert.equal(translations, 1);
  let failedTranslations = 0;
  await assert.rejects(
    englishPuppetAnalysis(
      { ...input, title: input.title + VT.EXCLAMATION },
      {
        ...options,
        ai: async () => {
          failedTranslations++;
          return { ...V.EN, cast: [] };
        },
      },
    ),
    (error: Error) => error.message.includes(V.PROFILE_INVALID_FIELD) && error.message.includes(V.PROFILE_MISSING_ROLE),
  );
  assert.equal(failedTranslations, PA.PROFILE_ATTEMPTS);
  const profileCase = (suffix: string): any => ({ ...structuredClone(input), title: input.title + suffix });
  let punctuationCalls = 0;
  const punctuation = await englishPuppetAnalysis(profileCase(VT.VALUE_2), {
    ...options,
    ai: async () => {
      punctuationCalls++;
      return { ...V.EN, look: V.PROFILE_PUNCTUATION };
    },
  });
  assert.equal(punctuation.look, V.PROFILE_PUNCTUATION_EN);
  assert.equal(punctuationCalls, 1);
  let repairCalls = 0;
  const repairLogs: string[] = [];
  const repairOptions = {
    ...options,
    log: (line: string) => repairLogs.push(line),
    ai: async (prompt: string) => {
      repairCalls++;
      if (repairCalls === 1) return { ...V.EN, cast: [{ ...V.EN.cast[0], name: V.PROFILE_UNTRANSLATED_NAME }] };
      assert.ok(prompt.includes(V.PROFILE_INVALID_FIELD));
      return { cast: [{ key: V.VI.cast[0].key, name: V.PROFILE_FIXED_NAME }] };
    },
  };
  const repaired = await englishPuppetAnalysis(profileCase(VT.VALUE_3), repairOptions);
  assert.equal(repairCalls, 2);
  assert.equal(repaired.cast[0].name, V.PROFILE_FIXED_NAME);
  assert.equal(repaired.cast[0].look, V.EN.cast[0].look);
  assert.equal(repaired.cast[0].gender, V.VI.cast[0].gender);
  assert.equal(repaired.cast[0].age, V.VI.cast[0].age);
  assert.equal(repaired.places[0].description, V.EN.places[0].description);
  assert.ok(repairLogs.some((line) => line.includes(V.PROFILE_INVALID_FIELD)));
  await englishPuppetAnalysis(profileCase(VT.VALUE_3), repairOptions);
  assert.equal(repairCalls, 2);
  let duplicateCalls = 0;
  const duplicate = await englishPuppetAnalysis(profileCase(VT.VALUE_4), {
    ...options,
    ai: async () => {
      duplicateCalls++;
      return duplicateCalls === 1 ? { ...V.EN, cast: [V.EN.cast[0], { ...V.EN.cast[0], name: V.PROFILE_FIXED_NAME }] } : V.EN;
    },
  });
  assert.equal(duplicateCalls, 2);
  assert.equal(duplicate.cast[0].name, V.EN.cast[0].name);
  let wrongKeyCalls = 0;
  await assert.rejects(
    englishPuppetAnalysis(profileCase(VT.VALUE_5), {
      ...options,
      ai: async () => {
        wrongKeyCalls++;
        return { ...V.EN, cast: [{ ...V.EN.cast[0], key: V.PROFILE_DIFFERENT_KEY }] };
      },
    }),
    (error: Error) => error.message.includes(V.PROFILE_INVALID_FIELD),
  );
  assert.equal(wrongKeyCalls, PA.PROFILE_ATTEMPTS);
  const diagnostics = path.join(puppetLibDir(PA.PROFILES_DIR), PA.PROFILE_DIAGNOSTICS);
  const reports = fs.readdirSync(diagnostics).map((name) => JSON.parse(fs.readFileSync(path.join(diagnostics, name), PA.UTF8)));
  assert.ok(reports.some((report) => report.attempts[0].response.cast?.[0]?.name === V.PROFILE_UNTRANSLATED_NAME && report.attempts[1].issues.length === 0));
  assert.ok(reports.some((report) => report.attempts.length === PA.PROFILE_ATTEMPTS && report.attempts.at(-1).issues.includes(V.PROFILE_INVALID_FIELD)));
  const englishInput = { ...structuredClone(V.EN), title: V.EN.title + VT.VALUE_6 } as any;
  const english = await englishPuppetAnalysis(englishInput, {
    ...options,
    ai: async () => {
      throw new Error(VT.UNEXPECTED_TRANSLATION);
    },
  });
  assert.deepEqual(
    english.cast.map((c) => c.key),
    englishInput.cast.map((c: any) => c.key),
  );
  const aborted = new AbortController();
  let cancelledCalls = 0;
  await assert.rejects(
    englishPuppetAnalysis(profileCase(VT.VALUE_7), {
      ...options,
      signal: aborted.signal,
      ai: async () => {
        cancelledCalls++;
        aborted.abort();
        return null;
      },
    }),
    { name: VT.ABORTERROR },
  );
  assert.equal(cancelledCalls, 1);
  const artifacts: string[] = [];
  let tries = 0;
  const drawn = await drawPuppetProps(
    style,
    [VT.CHISEL, VT.LAGOON],
    {},
    VT.RURAL_WORKSHOP,
    {
      exec: {} as any,
      log: () => {},
      ai: async (_prompt, artifact) => {
        artifacts.push(artifact);
        tries++;
        return { props: [{ key: VT.CHISEL, svg: tries === 1 ? VT.BAD_SVG : V.SVG }] };
      },
    },
    { chisel: ob(VT.CHISEL, VT.TOOL), lagoon: ob(VT.LAGOON) },
  );
  assert.ok(drawn.chisel);
  assert.equal(drawn.lagoon, undefined);
  assert.deepEqual(artifacts, [P.ARTIFACT_PROPS, P.ARTIFACT_PROPS]);
  await assert.rejects(drawPuppetProps(style, [VT.MISSING], {}, VT.EMPTY, { exec: {} as any, log: () => {}, ai: async () => ({ props: [] }) }));
  await assert.rejects(drawPuppetProps(style, [VT.CHISEL], {}, VT.EMPTY, { exec: {} as any, log: () => {}, ai: async () => ({ props: [{ key: VT.CHISEL, svg: V.EMPTY_SVG }] }) }));
  process.stdout.write(V.PASSED);
} finally {
  if (env === undefined) delete process.env[STORAGE_CONFIG.ENV_DIR];
  else process.env[STORAGE_CONFIG.ENV_DIR] = env;
  if (app === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = app;
  fs.rmSync(temp, { recursive: true, force: true });
}
