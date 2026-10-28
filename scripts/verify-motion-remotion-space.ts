import assert from "node:assert/strict";
import { assignRemotionSpace, remotionSpaceGuide, normalizeRemotionSpacePose } from "../src/lib/motionRemotionSpace.js";
import { layoutRemotionNodes } from "../src/lib/motionRemotion.js";
import { remotionPoint, remotionVisibleRect } from "../src/lib/motionRemotionGeometry.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { MOTION_REMOTION_SPACE as C } from "../src/constants/motionRemotionSpace.js";
import { remotionClosedCoffin, remotionClosedCoffinAsset, remotionSimpleInterior, remotionInteriorAsset } from "../src/lib/motionRemotionStructure.js";
import { remotionDetailNodes } from "../src/lib/motionRemotionVisibility.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionVectorAsset } from "../src/types/motionVisual.js";
const node = (id: string, kind: MotionRemotionNode["kind"], description: string, extra: Partial<MotionRemotionNode> = {}): MotionRemotionNode => ({ id, kind, description, pose: "standing", slot: "center", evidence: "still here", assetKey: id, ...extra });
const first: MotionRemotionScene = {
  id: "first",
  beatId: "beat",
  fromLineId: "line",
  toLineId: "line",
  purpose: "room",
  environment: "room",
  place: "house",
  sourceKey: "fixture",
  nodes: [node("altar", "prop", "wooden altar", { layoutX: 0.5 }), node("coffin", "prop", "wooden coffin", { layoutX: 0.24, slot: "left" }), node("door", "prop", "wooden door", { slot: "right", role: "fixture", mount: "doorway" }), node("adult", "character", "adult", { entityId: "a", slot: "left", relation: "beside", target: "coffin" })],
};
const second = structuredClone(first);
second.id = "second";
second.nodes.find((n) => n.id === "adult")!.slot = "right";
assignRemotionSpace([first, second]);
assert.equal(first.nodes.at(-1)!.layoutX, second.nodes.at(-1)!.layoutX);
assert.ok(first.nodes[0].layoutY! < first.nodes.at(-1)!.layoutY!);
const space = remotionSpaceGuide([first, second]);
assert.equal(space.regions.floor.y, C.HORIZON);
assert.ok(space.regions.doorway.y + space.regions.doorway.height < C.FRONT_GROUND);
assert.ok(Math.abs((space.regions.doorway.width * 16 / 9) / space.regions.doorway.height - 0.58) < 0.001);
const portraitSpace = remotionSpaceGuide([first], "9:16");
assert.ok(portraitSpace.regions.doorway.width > space.regions.doorway.width);
const entrances = structuredClone(first);
entrances.nodes.push(node("front-door", "prop", "front wooden door", { objectId: "front", slot: "left", role: "fixture", mount: "doorway" }), node("step", "prop", "ngưỡng cửa", { slot: "left", role: "fixture", mount: "doorway" }));
assignRemotionSpace([entrances]);
const entranceSpace = remotionSpaceGuide([entrances]);
assert.ok(entranceSpace.regions.doorway_1 && entranceSpace.regions.doorway_2);
assert.notEqual(entranceSpace.regions.doorway_1.x, entranceSpace.regions.doorway_2.x);
assert.equal(entranceSpace.regions.threshold.height, 0.025);
assert.ok(entranceSpace.regions.threshold.y > 0.8);
const vector = (id: string, w: number, h: number): MotionVectorAsset => ({
  ...normalizeMotionVector(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path d="M10 10H${w - 10}V${h - 10}H10Z" fill="#555e69"/></svg>`, id, id, id),
  bounds: { x: 10 / w, y: 10 / h, width: (w - 20) / w, height: (h - 20) / h },
  anchors: { base: { x: 0.5, y: (h - 10) / h }, surface: { x: 0.5, y: 10 / h } },
});
const background = { ...vector("background", 1920, 1080), regions: space.regions, space };
const assets = { adult: vector("adult", 200, 600), altar: vector("altar", 400, 240), coffin: vector("coffin", 220, 400), door: vector("door", 220, 500) };
const placed = layoutRemotionNodes(first.nodes, assets, 1920, 1080, background);
const doorway = remotionVisibleRect(placed.find((n) => n.id === "door")!, assets.door);
assert.ok(Math.abs(doorway.x - space.regions.doorway.x * 1920) < 0.001);
assert.ok(Math.abs(doorway.y - space.regions.doorway.y * 1080) < 0.001);
assert.ok(Math.abs(doorway.width - space.regions.doorway.width * 1920) < 0.001);
assert.ok(Math.abs(doorway.height - space.regions.doorway.height * 1080) < 0.001);
assert.equal(remotionPoint({ ...assets.adult, spaceRevision: C.REVISION, anchors: { base: { x: 0.5, y: 0.8 } } }, "base").y, assets.adult.bounds!.y + assets.adult.bounds!.height);
const altar = placed.find((n) => n.id === "altar")!,
  adult = placed.find((n) => n.id === "adult")!,
  coffin = placed.find((n) => n.id === "coffin")!;
assert.ok(altar.y + altar.height * remotionPoint(assets.altar, "base").y < adult.y + adult.height * remotionPoint(assets.adult, "base").y);
assert.ok(altar.depth < adult.depth);
assert.ok(remotionVisibleRect(coffin, assets.coffin).height > 1080 * 0.4);
assert.ok(remotionVisibleRect(adult, assets.adult).height > 1080 * 0.55);
const paired = structuredClone(first.nodes);
paired.push({ ...paired.at(-1)!, id: "second-adult", entityId: "b", assetKey: "adult", layoutX: 0.75 });
const pairedPlaced = layoutRemotionNodes(paired, assets, 1920, 1080, background);
assert.equal(pairedPlaced.find((n) => n.id === "adult")!.x, adult.x);
const footwear: MotionRemotionNode = node("sandals", "prop", "pair of wet sandals", { slot: "right", relation: "beside", target: "adult" });
const simplified = node("actor", "character", "adult", { pose: "Upper body over-shoulder, turned toward sister" });
normalizeRemotionSpacePose([simplified]);
assert.equal(simplified.pose, C.SIMPLE_VIEW);
assert.equal(simplified.assetKey, undefined);
const seatedScene = structuredClone(first);
seatedScene.nodes = [node("mat", "prop", "woven mat", { mount: "floor" }), node("actor", "character", "adult", { slot: "left", pose: "seated on mat", relation: "on", target: "mat" })];
assignRemotionSpace([seatedScene]);
const seatedAsset = { ...vector("actor", 300, 700), anchors: { base: { x: 0.5, y: 0.985 }, seat: { x: 0.5, y: 0.66 } } };
const seatedPlaced = layoutRemotionNodes(seatedScene.nodes, { actor: seatedAsset, mat: vector("mat", 600, 100) }, 1920, 1080, background);
assert.ok(remotionVisibleRect(seatedPlaced.find((n) => n.id === "actor")!, seatedAsset).height < 1080 * 0.45);
const seatedActor = seatedPlaced.find((n) => n.id === "actor")!;
assert.ok(seatedActor.depth >= seatedScene.nodes[1].layoutDepth!);
assert.ok(Math.abs(seatedActor.x + seatedActor.width * remotionPoint(seatedAsset, "base").x - seatedScene.nodes[1].layoutX! * 1920) < 0.01);
assert.ok(remotionVisibleRect(seatedPlaced.find((n) => n.id === "mat")!, vector("mat", 600, 100)).width > 1920 * 0.3);
assert.equal(seatedScene.nodes[0].layoutX, seatedScene.nodes[1].layoutX);
assert.ok(remotionClosedCoffin(node("coffin", "prop", "wooden coffin")));
assert.ok(!remotionClosedCoffin(node("coffin", "prop", "open wooden coffin")));
assert.ok(!remotionClosedCoffin(node("coffin", "prop", "white coffin")));
const solidCoffin = remotionClosedCoffinAsset("solid", "wooden coffin");
assert.ok(solidCoffin.width > solidCoffin.height * 1.8);
assert.equal(solidCoffin.projectionRevision, C.COFFIN_REVISION);
assert.ok(remotionSimpleInterior("Old Vietnamese house interior; slate blue-gray walls"));
assert.ok(!remotionSimpleInterior("Old house interior; red wooden walls"));
assert.ok(!remotionSimpleInterior("Temple room interior; gray walls"));
const structuredRoom = remotionInteriorAsset("room", "slate room", space);
assert.equal(structuredRoom.backgroundRevision, C.BACKGROUND_REVISION);
assert.deepEqual(structuredRoom.regions?.doorway, space.regions.doorway);
assert.ok(!structuredRoom.svg.includes("coffin"));
const detail = { ...seatedScene, view: "detail" as const, focus: ["actor"], startFrame: 0, endFrame: 30, nodes: [...seatedPlaced, { ...coffin, id: "unrelated-coffin" }] };
assert.deepEqual(remotionDetailNodes(detail).map((node) => node.id).sort(), ["actor", "mat"]);
const withShoes = layoutRemotionNodes([...first.nodes, footwear], { ...assets, sandals: vector("sandals", 300, 120) }, 1920, 1080, background);
assert.ok(remotionVisibleRect(withShoes.find((n) => n.id === "sandals")!, vector("sandals", 300, 120)).width < 150);
const edge = structuredClone(first.nodes);
edge.find((n) => n.id === "adult")!.layoutX = 0.995;
const clamped = layoutRemotionNodes(edge, assets, 1920, 1080, background);
assert.equal(clamped.find((n) => n.id === "coffin")!.height, coffin.height);
assert.equal(clamped.find((n) => n.id === "adult")!.height, adult.height);
assert.ok(
  remotionVisibleRect(
    clamped.find((n) => n.id === "adult")!,
    assets.adult,
  ).x +
    remotionVisibleRect(
      clamped.find((n) => n.id === "adult")!,
      assets.adult,
    ).width <=
    1920.001,
);
console.log("Space verified: shared camera/socket guide, stable people across cuts, foreground/background size and depth, coffin footprint, local bounds correction without shrinking the room. No live AI or production run.");
