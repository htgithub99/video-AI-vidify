import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { MOTION_PRODUCTION as P } from "../src/constants/motionProduction.js";
import { PRODUCTION_QA as Q } from "./motionProductionVerificationTexts.js";
import { checkPuppetPlanReadiness } from "../src/features/motion/server/services/puppet/planReadiness.js";
import { motionTaskCheckpoint } from "../src/features/motion/server/services/motionTaskCheckpoint.js";
import { listPuppets } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { puppetPackReadCatalog } from "../src/features/motion/server/services/puppet/packCatalog.js";
import { puppetPackAssetAllowed } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { motionSemanticText } from "../src/lib/motionResourceSemantics.js";
import { motionIllustrationNeedsErrors, motionIllustrationNeedsValid } from "../src/lib/motionIllustrationNeeds.js";
import { normalizeAnalysis } from "../src/features/motion/server/services/motionStoryService.js";
const analysis: any = {
  title: Q.TITLE,
  logline: Q.BEAT.narration,
  cast: [
    { key: "nam", name: "Nam", role: "villager", gender: "male", age: "adult" },
    { key: "ba", name: "Bà", role: "villager", gender: "female", age: "senior" },
    { key: "ghost", name: "Hồn bà", appearanceOf: "ba", gender: "female", age: "senior" },
  ],
  places: [
    { key: "bedroom", name: "Buồng ngủ", description: "Phòng ngủ có giường", interior: true, time: "night" },
    { key: "temple", name: "Chùa", description: "Gian chùa", interior: true, time: "day" },
  ],
};
const assets = () => JSON.stringify(K.TYPES.flatMap((type) => listPuppets(type as any)));
const before = assets();
for (const preset of Object.keys(K.PRESETS)) {
  const catalog = puppetPackReadCatalog(preset);
  const encoded = JSON.parse(catalog.slice(catalog.indexOf('{"props":')));
  const compact = encoded.props.map((row: any[]) => [row[0], ...encoded.profiles[row[1]].slice(0, 3), row[2]]);
  const expected = listPuppets<any>("prop").filter((asset) => puppetPackAssetAllowed(asset, K.PRESETS[preset]));
  assert.equal(compact.length, expected.length);
  for (const asset of expected) {
    const description = asset.desc.replace(K.READ_CATALOG_BOILERPLATE, "").trim();
    assert.ok(compact.some((row: any[]) => row[0] === asset.key && row[1] === asset.mount && JSON.stringify(row[3]) === JSON.stringify(asset.requirements || []) && (row[4] || asset.key.replace(/_/g, " ")) && motionSemanticText(row[4] || asset.key) === motionSemanticText(description)));
  }
  const result = await checkPuppetPlanReadiness({ ...analysis, stylePreset: preset });
  assert.equal(Object.keys(result!.characters).length, 3);
  assert.equal(result!.characters.ghost, result!.characters.ba);
  assert.equal(Object.keys(result!.places).length, 2);
  const evidence = "Bà nằm trên giường, Nam đứng bên cạnh cầm bát cháo.";
  const need: any = {
    id: "bedside",
    chapterId: "one",
    place: "bedroom",
    evidence,
    states: [
      { char: "ba", action: "stand", posture: "lie", support: "bed" },
      { char: "nam", action: "stand", posture: "idle" },
    ],
    objects: [{ key: "porridge", catalogKey: "rice_porridge_bowl", word: "bát cháo", type: "other", mount: "held", owner: "nam", size: 1, note: "" }],
    features: [],
  };
  const declared = { ...analysis, stylePreset: preset, chapters: [{ id: "one", summary: evidence }], illustrationNeeds: [need] };
  const misplaced = motionIllustrationNeedsErrors({ ...declared, illustrationNeeds: [{ ...need, states: [{ ...need.states[0], support: need.place }], objects: [{ ...need.objects[0], word: "đèn dầu", owner: undefined }] }] });
  assert.ok(misplaced.some((error) => error.startsWith("illustrationNeeds[0].objects[0].word:")));
  assert.ok(misplaced.some((error) => error.startsWith("illustrationNeeds[0].states[0].support:")));
  assert.deepEqual(motionIllustrationNeedsErrors(declared), []);
  const ready = await checkPuppetPlanReadiness(declared);
  assert.equal(ready!.declaredNeeds, 1);
  assert.ok(ready!.props!.porridge);
  assert.ok(ready!.pack?.assets[ready!.props!.porridge]);
  assert.ok(ready!.pack?.assets[ready!.places.bedroom]);
  await assert.rejects(checkPuppetPlanReadiness({ ...declared, illustrationNeeds: [{ ...need, evidence: "Invented evidence" }] }));
  await assert.rejects(checkPuppetPlanReadiness({ ...declared, illustrationNeeds: [{ ...need, objects: [{ ...need.objects[0], catalogKey: "spaceship_dashboard" }] }] }));
  await assert.rejects(checkPuppetPlanReadiness({ ...declared, illustrationNeeds: [{ ...need, states: [{ ...need.states[0], support: "airplane_seat" }] }] }));
  for (const invalid of [
    { ...need, states: [{ ...need.states[0], action: "fly_unknown" }] },
    { ...need, objects: [{ ...need.objects[0], type: "unknown" }] },
    { ...need, objects: [need.objects[0], need.objects[0]] },
    { ...need, objects: [{ ...need.objects[0], key: "fear", word: "bát cháo" }] },
    { ...need, objects: [{ ...need.objects[0], owner: "unknown" }] },
  ])
    assert.equal(motionIllustrationNeedsValid({ ...declared, illustrationNeeds: [invalid] }), false);
  const normalized = normalizeAnalysis({ ...declared, chapters: [{ id: "original-chapter", summary: "Mở đầu. ".repeat(80) + evidence }], illustrationNeeds: [{ ...need, chapterId: "original-chapter" }] }, { kind: "brief", title: "Source", text: evidence, segments: [], sourceSeconds: 120 } as any, 120);
  assert.equal(normalized.illustrationNeeds![0].chapterId, normalized.chapters[0].id);
  assert.equal(motionIllustrationNeedsValid(normalized), true);
  await assert.rejects(checkPuppetPlanReadiness({ ...analysis, stylePreset: preset, places: [{ key: "airplane_cabin", name: "Airplane cabin", description: "Airplane cabin", interior: true }] }));
}
assert.equal(assets(), before);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-task-checkpoint-"));
try {
  const store = motionTaskCheckpoint<any>(Q.TITLE, Q.READ, analysis, directory);
  store.save({ rejected: 2, rows: [{ id: Q.BEAT.id, value: Q.BEAT }] });
  assert.deepEqual(motionTaskCheckpoint<any>(Q.TITLE, Q.READ, analysis, directory).read(), store.read());
  assert.equal(motionTaskCheckpoint(Q.TITLE, Q.READ, { ...analysis, title: Q.LOG }, directory).read(), undefined);
  assert.equal(motionTaskCheckpoint(Q.LOG, Q.READ, analysis, directory).read(), undefined);
  const file = path.join(directory, fs.readdirSync(directory)[0]);
  fs.writeFileSync(file, "{");
  assert.throws(() => store.read(), { message: P.TASK_INVALID });
  assert.equal(fs.readFileSync(file, "utf8"), "{");
} finally {
  assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(directory, { recursive: true, force: true });
}
process.stdout.write(Q.PASSED);
