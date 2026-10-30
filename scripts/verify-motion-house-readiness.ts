import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { motionPieceContactSpots, motionPieceEnvironmentFits, motionPieceContextFits, motionPlaceLocationFamily, normalizeMotionResourceSemantics } from "../src/lib/motionResourceSemantics.js";
import { puppetSupportCompatible, puppetSpotGeometryValid } from "../src/lib/motionPlacement.js";
import { puppetSceneFeatureFits, puppetSetFeatureEvidence } from "../src/lib/motionPuppetAssets.js";
import { checkPuppetPlanReadiness } from "../src/features/motion/server/services/puppet/planReadiness.js";
import { listPuppets } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { withPuppetPackSnapshot } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { puppetSetMissingRequirements, puppetSetPlacementNeeds, puppetPropSpotCandidates, puppetSpots, layoutPuppetFrame } from "../src/features/motion/server/services/puppet/layout.js";
import { HOUSE_READINESS_QA as Q } from "./motionHouseReadinessVerificationTexts.js";
import FIXTURE from "./fixtures/motion-house-altar-20261026.json";
import type { MotionStoryAnalysis } from "../src/types/motionVideo.js";
import type { PuppetPlace, PuppetPiece, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
const inventory = () => JSON.stringify(K.TYPES.flatMap((type) => listPuppets(type as any)));
const before = inventory();
const place: PuppetPlace = { key: Q.HOUSE_KEY, name: Q.HOUSE, desc: Q.HOUSE_DESC, interior: false, time: P.DAY };
assert.equal(motionPlaceLocationFamily(place), Q.COURTYARD);
assert.equal(motionPlaceLocationFamily({ ...place, interior: true, desc: Q.LIVING_DESC }), Q.LIVING);
assert.equal(motionPlaceLocationFamily({ ...place, name: "Phòng ngủ", interior: true, desc: Q.BEDROOM_DESC }), Q.BEDROOM);
assert.equal(motionPlaceLocationFamily({ ...place, name: Q.RIVER, desc: Q.RIVER_DESC }), "river");
assert.equal(motionPlaceLocationFamily({ ...place, name: "Cockpit", key: "cockpit", desc: Q.UNKNOWN }), undefined);
assert.equal(motionPlaceLocationFamily({ ...place, locationFamily: "river" }), "river");
assert.ok(puppetSupportCompatible(Q.ALTAR, Q.RITUAL));
assert.ok(!puppetSupportCompatible(Q.ALTAR, Q.TABLE));
assert.ok(!puppetSupportCompatible(Q.BELOW_ALTAR, Q.RITUAL));
assert.ok(!puppetSupportCompatible(Q.BESIDE_ALTAR, Q.RITUAL));
assert.ok(!puppetSupportCompatible(Q.LEFT_ALTAR, Q.RIGHT_ALTAR));
assert.ok(puppetSupportCompatible(Q.DOORSTEP, Q.DOOR));
const fixturePiece = listPuppets<PuppetPiece>(T.PIECE).find((piece) => piece.key === Q.OFFERING)!;
assert.ok(fixturePiece);
assert.ok(motionPieceEnvironmentFits(fixturePiece, Q.EXTERIOR));
assert.deepEqual(
  fixturePiece.spots.map((spot) => [spot.x, spot.y]),
  motionPieceContactSpots(fixturePiece).map((spot) => [spot.x, spot.y]),
);
assert.ok(motionPieceEnvironmentFits({ ...fixturePiece, allowedEnvironments: [Q.INTERIOR] }, Q.EXTERIOR) === false);
for (const key of [Q.RUINED, Q.SHOP]) {
  const piece = listPuppets<PuppetPiece>(T.PIECE).find((candidate) => candidate.key === key)!;
  assert.ok(!motionPieceContextFits(piece, place));
  assert.ok(motionPieceContextFits(piece, { ...place, desc: key === Q.RUINED ? Q.DAMAGED : Q.MARKET }));
}
const python = spawnSync("python", ["-c", "import sys,json; sys.path.insert(0,'python_scripts/kit_seed'); from seed_utils import resource_semantics; print(json.dumps(resource_semantics(json.load(sys.stdin))))"], { input: JSON.stringify(fixturePiece), encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
assert.equal(python.status, 0, python.stderr);
assert.deepEqual(JSON.parse(python.stdout), normalizeMotionResourceSemantics(fixturePiece));
for (const preset of Object.keys(K.PRESETS)) {
  const analysis = { ...structuredClone(FIXTURE), stylePreset: preset } as MotionStoryAnalysis;
  const ready = (await checkPuppetPlanReadiness(analysis))!;
  assert.equal(Object.keys(ready.places).length, 3);
  assert.equal(ready.declaredNeeds, 4);
  withPuppetPackSnapshot(ready.pack, () => {
    for (const entry of analysis.places) {
      const set = listPuppets<PuppetSet>(T.SET).find((candidate) => candidate.id === ready.places[entry.key])!;
      const needs = analysis.illustrationNeeds!.filter((need) => need.place === entry.key);
      assert.ok(set);
      assert.ok(set.spots.every(puppetSpotGeometryValid));
      assert.ok(set.plan?.pieces.every((piece) => ![Q.RUINED, Q.SHOP].some((key) => key === piece.piece)));
      const reads = needs.map((need) => ({ states: need.states, objects: need.objects })) as any;
      assert.deepEqual(
        puppetSetMissingRequirements(
          set,
          reads,
          needs.flatMap((need) => [...need.states.flatMap((state) => (state.placement?.anchor ? [state.placement.anchor] : [])), ...need.objects.flatMap((object) => (object.placement?.anchor ? [object.placement.anchor] : []))]),
        ),
        [],
      );
      if (entry.key !== Q.HOUSE_KEY) continue;
      assert.equal(set.locationFamily, Q.COURTYARD);
      assert.ok(puppetSceneFeatureFits(Q.ALTAR, puppetSetFeatureEvidence(set)));
      assert.equal(puppetSetPlacementNeeds(reads).find((contact) => contact.support === Q.ALTAR && contact.kind === P.SPOT_SURFACE)?.count, 3);
      const objects = needs[0].objects;
      const candidates = objects.map((object) => puppetPropSpotCandidates(puppetSpots(set), object));
      assert.ok(candidates.every((spots) => spots.length >= 3));
      const props = Object.fromEntries(Object.entries(ready.props!).map(([key, id]) => [key, ready.pack!.assets[id]]));
      const style = ready.pack!.assets[ready.pack!.styleId] as PuppetStylePack;
      const frame = layoutPuppetFrame({ shot: P.SHOT_DEFAULT, set: entry.key, actors: [], prop: objects[0].key, propMount: objects[0].mount, propSupport: objects[0].support, items: objects.slice(1).map((object) => ({ prop: object.key, propMount: object.mount, propSupport: object.support })) } as any, { set, body: style.body, heights: {}, props: props as any, prop: props[objects[0].key] as any });
      const spots = [frame.propAt, ...frame.items.map((item) => item.propAt)];
      assert.equal(new Set(spots).size, 3);
      assert.ok(spots.every((key) => set.spots.some((spot) => spot.key === key && spot.kind === P.SPOT_SURFACE)));
      assert.ok(puppetPropSpotCandidates(puppetSpots(set), needs[1].objects[0]).length);
    }
  });
  const invalid = structuredClone(analysis);
  invalid.illustrationNeeds![0].objects[0].support = Q.UNKNOWN_SUPPORT;
  await assert.rejects(checkPuppetPlanReadiness(invalid));
}
assert.equal(inventory(), before);
console.log(JSON.stringify(Q.RESULT));
