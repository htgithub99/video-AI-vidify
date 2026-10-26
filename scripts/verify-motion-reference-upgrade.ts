import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { REFERENCE_LIBRARY as R } from "./motionReferenceCatalog.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { MOTION_STAGE_GEOMETRY as G } from "../src/constants/motionStageGeometry.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { puppetPackAssetAllowed, runWithPuppetPack } from "../src/server/services/puppet/packPolicy.js";
import { puppetFramePlacementIssues } from "../src/server/services/puppet/packPlacement.js";
import { puppetSetFeatureEvidence, puppetSceneFeatureFits } from "../src/lib/motionPuppetAssets.js";
import { composePuppetSet, piecePlacement } from "../src/server/services/puppet/setComposition.js";
import { layoutPuppetFrame } from "../src/server/services/puppet/layout.js";
import { puppetKitSpec } from "../src/server/services/puppet/compilePuppet.js";
import { chromium } from "playwright";
import { COMFORT_QA as ENGINE } from "./motionComfortVerificationTexts.js";
import { STAGE_QA as STAGE } from "./motionStageConstraintsVerificationTexts.js";
import { puppetSpotGeometryValid } from "../src/lib/motionPlacement.js";
import type { PuppetAsset, PuppetBase, PuppetPiece, PuppetStylePack } from "../src/types/motionPuppet.js";
const assets = JSON.parse(fs.readFileSync(path.join(R.SCRATCH, R.INVENTORY), "utf8")) as PuppetAsset[];
const audit = JSON.parse(fs.readFileSync(path.join(R.SCRATCH, "verified", "audit.json"), "utf8"));
const covers: { preset: string; kit: any }[] = [];
assert.equal(audit.testedInventoryHash, createHash("sha256").update(JSON.stringify(assets)).digest("hex"));
assert.ok(audit.probes.length >= 84);
assert.ok(audit.probes.every((probe: any) => probe.status === "choices_generated"));
assert.equal(new Set(assets.map((asset) => asset.id)).size, assets.length);
assert.equal(new Set(assets.map((asset) => ["styleId" in asset ? asset.styleId : asset.id, asset.type, "key" in asset ? asset.key : asset.id].join(":"))).size, assets.length);
for (const [preset, styleId] of Object.entries(K.PRESETS)) {
  const pack = assets.filter((asset) => ("styleId" in asset ? asset.styleId : asset.id) === styleId);
  for (const asset of pack) assert.ok(puppetPackAssetAllowed(asset, styleId), asset.id);
  for (const spec of [...R.NEW_PIECES, ...R.NEW_PROPS]) assert.equal(pack.filter((asset) => "key" in asset && asset.key === spec.key).length, 1, spec.key);
  const base = pack.find((asset) => asset.type === T.BASE && asset.key === "room_plain") as PuppetBase;
  const raised = pack.find((asset) => asset.type === T.PIECE && asset.key === "folk_raised_daybed") as PuppetPiece;
  const style = pack.find((asset) => asset.type === T.STYLE) as PuppetStylePack;
  const ctx = { body: style.body, heights: { a: 1, b: 1 } };
  const actor = { char: "a", pose: "idle", expr: "neutral", face: "front", x: 0.5, y: 950, k: 1 };
  assert.deepEqual(puppetFramePlacementIssues({ shot: "wide", actors: [actor] }, ctx), []);
  assert.ok(puppetFramePlacementIssues({ shot: "wide", actors: [{ ...actor, x: 0.001 }] }, ctx).length);
  assert.ok(puppetFramePlacementIssues({ shot: "wide", actors: [{ ...actor, k: 0.05 }] }, ctx).length);
  assert.ok(puppetFramePlacementIssues({ shot: "wide", actors: [actor, { ...actor, char: "b" }] }, ctx).length);
  const objects = { shot: "wide", actors: [], prop: "bowl_a", propX: 0.5, propY: 950, propH: 100, items: [{ prop: "bowl_b", propX: 0.5, propY: 950, propH: 100 }] };
  assert.ok(puppetFramePlacementIssues(objects, ctx).length);
  assert.deepEqual(puppetFramePlacementIssues({ ...objects, propParent: "bowl_b" }, ctx), []);
  assert.equal(puppetSpotGeometryValid({ key: "bad", kind: "stand", x: 900, y: 900, label: "bad", scale: -1 }), false);
  const composed = runWithPuppetPack(styleId, assets, () => composePuppetSet(base, [{ piece: raised, slot: "scene_center" }], false, false));
  const spot = composed.spots.find((point) => point.relation === "on")!;
  const placed = layoutPuppetFrame({ shot: "wide", layoutLocked: true, actors: [{ ...actor, support: "on_daybed", spot: spot.key }] }, { ...ctx, set: composed });
  assert.equal(placed.actors[0].y, spot.y);
  assert.equal(placed.actors[0].k, +spot.scale!.toFixed(3));
  assert.notEqual(spot.y, spot.groundY);
  assert.equal(puppetSceneFeatureFits("hospital_bed", puppetSetFeatureEvidence({ name: "hospital bed", desc: "hospital bed", tags: ["hospital_bed"], svg: '<svg><rect width="1" height="1"/></svg>', features: ["room_plain"] })), false);
  for (const key of ["wardrobe", "modular_door"]) {
    const piece = pack.find((asset) => asset.type === T.PIECE && asset.key === key) as PuppetPiece;
    assert.ok(piece.states?.closed && piece.states.open && piece.states.ajar);
    const slot = piece.slots.find((candidate) => piecePlacement(base, candidate, piece))!;
    const variants = ["closed", "open", "ajar"].map((state) => runWithPuppetPack(styleId, assets, () => composePuppetSet(base, [{ piece, slot }], false, false, { [piece.stateKey!]: state })));
    assert.equal(new Set(variants.map((variant) => variant.svg)).size, 3);
    for (const variant of variants) assert.ok(variant.spots.every(puppetSpotGeometryValid));
    assert.deepEqual(variants[0].spots, variants[1].spots);
  }
  const boat = audit.probes.find((probe: any) => probe.pack === preset && probe.probe === "two_in_one_boat");
  assert.equal(boat.pieces.filter((piece: any) => piece.piece === "rowboat").length, 1);
  assert.equal(new Set(boat.frame.actors.map((person: any) => person.spot)).size, 2);
  const covered = audit.probes.find((probe: any) => probe.pack === preset && probe.probe === "body_shroud");
  assert.ok(covered.frame.actors.find((person: any) => person.char === "actor_0").wear.includes("cloth_0"));
  const kit = runWithPuppetPack(styleId, assets, () => puppetKitSpec({ styleId, characters: covered.characters, props: covered.props, sets: {}, reads: {} } as any, false))!;
  assert.equal(kit.props.cloth_0.bodyCover, true);
  covers.push({ preset, kit });
  const camera = audit.probes.find((probe: any) => probe.pack === preset && probe.probe === "new_camera_tripod");
  assert.equal(camera.frame.propParent, "tripod_0");
}
const browser = await chromium.launch({ headless: true });
let coverRenders = 0;
try {
  const page = await browser.newPage();
  await page.setContent(STAGE.HTML);
  for (const file of ENGINE.MOTION_ENGINE) await page.addScriptTag({ content: fs.readFileSync(file, "utf8").replace(STAGE.HOOK, R.COVER_EXPOSE) });
  const bounds = await page.evaluate(async (samples) => {
    const me = (window as any).MotionEngine;
    const results = [];
    for (const sample of samples) {
      await me.PUPPET_PRELOAD({ kit: sample.kit });
      for (const pose of ["idle", "lie"]) {
        const canvas = document.createElement("canvas"),
          cover = document.createElement("canvas");
        canvas.width = cover.width = 1920;
        canvas.height = cover.height = 1080;
        const g = canvas.getContext("2d")!,
          output = cover.getContext("2d")!;
        const original = g.drawImage.bind(g);
        g.drawImage = ((img: HTMLImageElement, ...args: number[]) => {
          if (img.src === me.PUPPET2D.K.SVG_URL + encodeURIComponent(sample.kit.props.cloth_0.svg)) {
            output.setTransform(g.getTransform());
            (output.drawImage as any)(img, ...args);
          }
          (original as any)(img, ...args);
        }) as any;
        g.translate(960, 800);
        const state = me.PUPPET2D.init({ spec: { kit: sample.kit }, params: { frames: [] } });
        me.testDrawPuppet(g, state, { char: "actor_0", pose, face: "right", wear: ["cloth_0"] }, 0, { tint: 1 });
        const pixels = output.getImageData(0, 0, cover.width, cover.height).data;
        let left = Infinity,
          top = Infinity,
          right = -Infinity,
          bottom = -Infinity;
        for (let y = 0; y < cover.height; y++)
          for (let x = 0; x < cover.width; x++)
            if (pixels[(y * cover.width + x) * 4 + 3] > 48) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        results.push({ preset: sample.preset, pose, left, top, right, bottom, width: right - left, height: bottom - top });
      }
    }
    return results;
  }, covers);
  for (const box of bounds) {
    assert.ok(box.width > 0 && box.height > 0, JSON.stringify(box));
    assert.ok(box.pose === "lie" ? box.width > box.height : box.height > box.width, JSON.stringify(box));
  }
  coverRenders = bounds.length;
  fs.writeFileSync(path.join(R.SCRATCH, "cover-bounds.json"), JSON.stringify(bounds, null, 2));
} finally {
  await browser.close();
}
const verification = { passed: true, cases: audit.probes.length, coverRenders, testedInventoryHash: audit.testedInventoryHash, libraryChanged: false, aiCalls: 0, videoCreated: false };
fs.writeFileSync(path.join(R.SCRATCH, "upgrade-verification.json"), JSON.stringify(verification, null, 2));
console.log(JSON.stringify(verification));
