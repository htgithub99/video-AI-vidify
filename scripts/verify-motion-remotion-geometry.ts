import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { layoutRemotionNodes, remotionSceneReadiness, validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { remotionContact, remotionNodeFitsFrame, remotionPoint, remotionRole, remotionVisibleRect } from "../src/lib/motionRemotionGeometry.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { MOTION_REMOTION_LAYOUT as L } from "../src/constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../src/constants/motionRemotionStaging.js";
import { MOTION_ASPECT_BASE } from "../src/constants/motionVideo.js";
import type { MotionRemotionNode, MotionRemotionPlacedNode, MotionRemotionScene, MotionRemotionSpec, MotionRemotionState, MotionVectorAsset } from "../src/types/motionVisual.js";
const vector = (key: string, width: number, height: number, shape: string, extra: Partial<MotionVectorAsset> = {}): MotionVectorAsset => ({ ...normalizeMotionVector(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${shape}</svg>`, key, key, key), ...extra });
const assets: Record<string, MotionVectorAsset> = {
  background: vector("background", 1000, 600, '<rect width="1000" height="600" fill="#39424c"/>', { regions: { floor: { x: 0, y: 0.7222, width: 1, height: 0.2778 }, doorway: { x: 0, y: 0.12, width: 0.2, height: 0.6 } } }),
  floor: vector("floor", 1000, 300, '<path d="M20 90H980V250H20Z" fill="#453a2c"/>', { bounds: { x: 0.02, y: 0.3, width: 0.96, height: 0.54 } }),
  door: vector("door", 300, 600, '<path d="M20 30H280V570H20Z" fill="#291e18"/>', { bounds: { x: 0.06, y: 0.04, width: 0.88, height: 0.92 } }),
  table: vector("table", 800, 400, '<path d="M80 120H720V170H80ZM120 170H160V350H120ZM640 170H680V350H640Z" fill="#644c36"/>', { bounds: { x: 0.09, y: 0.29, width: 0.82, height: 0.6 }, anchors: { base: { x: 0.5, y: 0.875 }, surface: { x: 0.5, y: 0.3 } } }),
  person: vector("person", 300, 900, '<path d="M120 130H180V850H120Z" fill="#987656"/>', { bounds: { x: 0.38, y: 0.14, width: 0.24, height: 0.81 }, anchors: { base: { x: 0.5, y: 0.94 }, seat: { x: 0.5, y: 0.6 }, grip: { x: 0.55, y: 0.5 } } }),
  seated: vector("seated", 600, 600, '<path d="M120 90H280V350H480V570H400V420H120Z" fill="#987656"/>', { bounds: { x: 0.19, y: 0.14, width: 0.62, height: 0.82 }, anchors: { base: { x: 0.7, y: 0.95 }, seat: { x: 0.3, y: 0.65 }, grip: { x: 0.45, y: 0.5 } } }),
  bowl: vector("bowl", 200, 200, '<path d="M50 100H150L125 175H75Z" fill="#b5b4ab"/>', { bounds: { x: 0.24, y: 0.49, width: 0.52, height: 0.4 }, anchors: { base: { x: 0.5, y: 0.875 }, grip: { x: 0.5, y: 0.65 } } }),
};
const node = (id: string, kind: MotionRemotionNode["kind"], assetKey: string, extra: Partial<MotionRemotionNode> = {}): MotionRemotionNode => ({ id, kind, assetKey, description: id, pose: "neutral", slot: "center", evidence: id, ...extra });
const nodes = [node("floor", "prop", "floor", { role: "fixture", mount: "floor" }), node("door", "prop", "door", { role: "fixture", mount: "doorway" }), node("table", "prop", "table", { description: "Altar shelf with a ceramic bowl", mount: "floor", slot: "left" }), node("person", "character", "person", { slot: "right" }), node("bowl", "prop", "bowl", { relation: "on", target: "table" })];
assert.equal(remotionRole(nodes[2]), "support");
assert.equal(remotionRole({ ...nodes[2], description: "wooden door frame" }), "fixture");
assert.equal(remotionRole({ ...nodes[2], description: "Small oil lamp on altar shelf" }), "object");
const furnishings = layoutRemotionNodes([node("stool", "prop", "table", { description: "Low stool" }), node("coffin", "prop", "table", { description: "Wooden coffin", slot: "right" })], assets, 1920, 1080);
assert.ok(remotionVisibleRect(furnishings.find((n) => n.id === "stool")!, assets.table).height <= 1080 * S.CHARACTER_HEIGHT.adult * S.LOW_SEAT_SIZE.height);
assert.ok(remotionVisibleRect(furnishings.find((n) => n.id === "coffin")!, assets.table).width > remotionVisibleRect(furnishings.find((n) => n.id === "stool")!, assets.table).width);
const checkContacts = (placed: MotionRemotionPlacedNode[], vectors: Record<string, MotionVectorAsset>, height?: number, background?: MotionVectorAsset) => {
  for (const n of placed) {
    const anchorName = n.relation === "on" ? "surface" : n.relation === "inside" ? "inside" : n.relation === "heldBy" ? "grip" : undefined;
    if (!anchorName) continue;
    const target = placed.find((other) => other.id === n.target)!;
    if (n.kind === "character" && n.relation === "inside" && remotionRole(target) === "fixture" && S.ARCHITECTURE.test(target.description)) {
      assert.ok(height);
      const floor = background?.regions?.floor;
      const ground = Math.min(floor ? floor.y + floor.height * 0.65 : 0.82, L.GROUND_BOTTOM) * height!;
      assert.ok(Math.abs(n.y + n.height * remotionPoint(vectors[n.assetKey!], "base").y - ground) < 1e-6);
      continue;
    }
    const anchor = vectors[target.assetKey!].anchors?.[anchorName] || (anchorName === "surface" && S.MAT.test(target.description) ? remotionPoint(vectors[target.assetKey!], "surface") : undefined);
    assert.ok(anchor);
    const own = remotionPoint(vectors[n.assetKey!], n.relation === "inside" ? "inside" : n.relation === "heldBy" ? "grip" : remotionContact(n));
    if (n.relation === "on" && n.kind === "prop" && placed.filter((other) => other.kind === "prop" && other.relation === "on" && other.target === target.id).length > 1) {
      const visible = remotionVisibleRect(target, vectors[target.assetKey!]),
        contact = n.x + n.width * own.x;
      assert.ok(contact >= visible.x && contact <= visible.x + visible.width, `${n.id}: contact on support span`);
    } else assert.ok(Math.abs(n.x + n.width * own.x - target.x - target.width * anchor.x) < 1e-6, `${n.id}: x contact`);
    assert.ok(Math.abs(n.y + n.height * own.y - target.y - target.height * anchor.y) < 1e-6, `${n.id}: y contact`);
  }
};
const specFor = (placed: MotionRemotionPlacedNode[], width: number, height: number): MotionRemotionSpec => ({
  engine: "remotion",
  version: 1,
  profileId: "horror",
  title: "Geometry regression",
  aspect: "16:9",
  fps: 30,
  duration: 1,
  width,
  height,
  motion: false,
  assets,
  subtitles: [],
  scenes: [{ id: "scene", beatId: "beat", fromLineId: "line", toLineId: "line", purpose: "Geometry", text: "", environment: "", sourceKey: "fixture", backgroundKey: "background", startFrame: 0, endFrame: 30, nodes: placed }],
});
for (const { w: width, h: height } of Object.values(MOTION_ASPECT_BASE)) {
  const placed = layoutRemotionNodes(nodes, assets, width, height, assets.background);
  checkContacts(placed, assets);
  validateRemotionSpec(specFor(placed, width, height));
  const floor = placed.find((n) => n.id === "floor")!,
    table = placed.find((n) => n.id === "table")!,
    person = placed.find((n) => n.id === "person")!;
  assert.ok(floor.y + floor.height > height);
  const door = placed.find((n) => n.id === "door")!;
  const paddedDoor = { ...door, x: -door.width * assets.door.bounds!.x };
  assert.ok(paddedDoor.x < 0 && remotionNodeFitsFrame(paddedDoor, assets.door, width, height));
  validateRemotionSpec(
    specFor(
      placed.map((n) => (n.id === door.id ? paddedDoor : n)),
      width,
      height,
    ),
  );
  assert.ok(Math.abs(remotionVisibleRect(floor, assets.floor).y + remotionVisibleRect(floor, assets.floor).height - height) < 1e-6);
  assert.ok(Math.abs(table.y + table.height * assets.table.anchors!.base.y - height * L.GROUND_BOTTOM) < 1e-6);
  assert.ok(table.x + table.width * 0.5 < person.x + person.width * 0.5);
  assert.ok(remotionVisibleRect(table, assets.table).width < width * 0.39);
  const clipped = placed.map((n) => (n.id === "floor" ? { ...n, x: -n.width * assets.floor.bounds!.x - width * 0.1 } : n));
  assert.throws(() => validateRemotionSpec(specFor(clipped, width, height)));
  assert.ok(!remotionNodeFitsFrame({ ...person, y: height * 0.9 }, assets.person, width, height));
  assert.throws(() =>
    validateRemotionSpec(
      specFor(
        placed.map((n) => (n.id === person.id ? { ...n, y: height * 0.9 } : n)),
        width,
        height,
      ),
    ),
  );
  const contacts = layoutRemotionNodes([nodes[2], { ...nodes[3], assetKey: "seated", pose: "seated", relation: "on", target: "table", contact: "seat" }, { ...nodes[4], relation: "heldBy", target: "person" }], assets, width, height, assets.background);
  checkContacts(contacts, assets);
  validateRemotionSpec(specFor(contacts, width, height));
}
assert.throws(() => layoutRemotionNodes(nodes, { ...assets, person: { ...assets.person, bounds: { x: -0.2, y: 0, width: 1, height: 1 } } }, 1000, 600, assets.background));
assert.throws(() =>
  layoutRemotionNodes(
    nodes.map((n) => (n.id === "bowl" ? { ...n, target: "missing" } : n)),
    assets,
    1000,
    600,
    assets.background,
  ),
);
assert.throws(() => layoutRemotionNodes(nodes, { ...assets, table: { ...assets.table, anchors: {} } }, 1000, 600, assets.background));
assert.throws(() => layoutRemotionNodes([node("a", "prop", "bowl", { relation: "on", target: "b" }), node("b", "prop", "bowl", { relation: "on", target: "a" })], assets, 1000, 600, assets.background));
const jobPath = process.argv[2];
if (jobPath) {
  const original = fs.readFileSync(path.resolve(jobPath), "utf8");
  const saved = JSON.parse(original);
  const state: MotionRemotionState = (saved.job?.result || saved.result || saved).gen.remotion;
  const scenes: MotionRemotionScene[] = Object.values(state.scenes).flat();
  let missing = 0,
    complete = 0;
  for (const scene of scenes) {
    if (!state.assets[scene.backgroundKey!] || scene.nodes.some((n) => n.kind !== "label" && !state.assets[n.assetKey!])) {
      missing++;
      continue;
    }
    for (const aspect of Object.keys(MOTION_ASPECT_BASE)) {
      const readiness = remotionSceneReadiness({ ...scene, aspect }, state);
      assert.ok(readiness.preview, `${scene.id} ${aspect}: ${readiness.error}`);
      validateRemotionSpec(readiness.preview);
      checkContacts(readiness.preview.scenes[0].nodes, state.assets, readiness.preview.height, state.assets[scene.backgroundKey!]);
    }
    complete++;
  }
  assert.ok(complete > 0);
  assert.equal(fs.readFileSync(path.resolve(jobPath), "utf8"), original);
  console.log(JSON.stringify({ savedScenes: scenes.length, complete, missing, aspects: Object.keys(MOTION_ASPECT_BASE).length }));
}
console.log("Remotion geometry verification passed.");
