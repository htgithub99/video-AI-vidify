import { canReuseRemotionCharacter } from "./legacy-motion-remotion/characterReuse.js";
import assert from "node:assert/strict";
import { layoutRemotionNodes } from "../src/lib/motionRemotion.js";
import { remotionMountRegion, remotionPoint, remotionVisibleRect } from "../src/lib/motionRemotionGeometry.js";
import { assignRemotionStaging, normalizeRemotionRelations, prepareRemotionScene, remotionAtomicDescription, remotionIdentityDescription, remotionLegacyAssetIssue } from "../src/lib/motionRemotionStaging.js";
import { motionSceneCameraScale, motionNodeFrame, remotionSceneView } from "../src/features/motion/lib/motionRemotionEffects.js";
import { motionStoryEventLedger } from "../src/lib/motionStoryContinuity.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { MOTION_REMOTION_STAGING as S } from "../src/constants/motionRemotionStaging.js";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { remotionObjectCatalog, resolveRemotionContinuity } from "./legacy-motion-remotion/sceneContinuity.js";
import { motionInputKey } from "../src/server/services/motionFileUtils.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionVectorAsset } from "../src/types/motionVisual.js";
const vector = (key: string, w: number, h: number, extra: Partial<MotionVectorAsset> = {}): MotionVectorAsset => ({
  ...normalizeMotionVector(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path d="M${w * 0.1} ${h * 0.1}H${w * 0.9}V${h * 0.9}H${w * 0.1}Z" fill="#796555"/></svg>`, key, key, key),
  anchors: { base: { x: 0.5, y: 0.9 }, surface: { x: 0.5, y: 0.2 }, inside: { x: 0.5, y: 0.5 }, grip: { x: 0.6, y: 0.5 }, body: { x: 0.5, y: 0.5 } },
  bounds: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
  ...extra,
});
const assets = { background: vector("background", 1000, 600, { regions: { floor: { x: 0, y: 0.7, width: 1, height: 0.28 }, wall: { x: 0, y: 0.2, width: 1, height: 0.2 } } }), gate: vector("gate", 360, 600), person: vector("person", 300, 800), table: vector("table", 500, 300), bowl: vector("bowl", 100, 80), mat: vector("mat", 500, 100), lying: vector("lying", 800, 250) };
const node = (id: string, kind: MotionRemotionNode["kind"], assetKey: string, extra: Partial<MotionRemotionNode> = {}): MotionRemotionNode => ({ id, kind, assetKey, description: id, pose: "neutral", slot: "center", evidence: id, ...extra });
const scene = (nodes: MotionRemotionNode[], extra: Partial<MotionRemotionScene> = {}): MotionRemotionScene => ({ id: "shot", beatId: "beat", fromLineId: "a", toLineId: "a", purpose: "fixture", text: "", environment: "yard", sourceKey: "fixture", place: "yard", nodes, ...extra });
const annotated = scene([node("person", "character", "person"), node("annotation", "label", "", { description: "hands on knees" })], { focus: ["annotation", "person"] });
const explainer = structuredClone(annotated);
prepareRemotionScene(annotated, "horror");
assert.deepEqual(
  annotated.nodes.map((n) => n.id),
  ["person"],
);
assert.deepEqual(annotated.focus, ["person"]);
prepareRemotionScene(explainer, "explainer");
assert.equal(explainer.nodes.length, 2);
const dressed = scene([node("girl", "character", "person", { description: "Linh, white shirt" }), node("shirt", "prop", "", { description: "áo trắng", relation: "on", target: "girl", state: "Linh đang mặc" }), node("tiles", "prop", "", { description: "Nền gạch hoa mờ" })], { focus: ["shirt"] });
prepareRemotionScene(dressed, "horror");
assert.deepEqual(
  dressed.nodes.map((n) => n.id),
  ["girl"],
);
assert.deepEqual(dressed.focus, ["girl"]);
const wrist = scene([node("person", "character", "person"), node("print", "prop", "bowl", { description: "Vết hằn ướt trên cổ tay", relation: "on", target: "person" })]);
prepareRemotionScene(wrist, "horror");
assert.equal(wrist.nodes[1].role, "decal");
assert.equal(wrist.nodes[1].attachmentAnchor, "wrist");
const wristAssets = { ...assets, person: { ...assets.person, anchors: { ...assets.person.anchors, wrist: { x: 0.64, y: 0.55 } } } };
const wristPlaced = layoutRemotionNodes(wrist.nodes, wristAssets, 1920, 1080, assets.background);
const wristPerson = wristPlaced.find((n) => n.id === "person")!,
  wristMark = remotionVisibleRect(wristPlaced.find((n) => n.id === "print")!, assets.bowl);
assert.ok(Math.abs(wristMark.x + wristMark.width / 2 - (wristPerson.x + wristPerson.width * 0.64)) < 0.001);
assert.ok(Math.abs(wristMark.y + wristMark.height / 2 - (wristPerson.y + wristPerson.height * 0.55)) < 0.001);
const continuity: any = {
  beats: [
    { id: "first", place: "house" },
    { id: "second", place: "house" },
  ],
  gen: {
    remotion: {
      settings: { mode: "remotion", profileId: "history" },
      scenes: {
        first: [scene([node("altar", "prop", "table", { description: "altar table", objectId: "altar", persistent: true }), node("lamp", "prop", "bowl", { description: "oil lamp", objectId: "lamp", relation: "on", target: "altar", persistent: true })], { id: "first", place: "house" })],
        second: [scene([node("lamp-detail", "prop", "bowl", { description: "oil lamp", objectId: "lamp", persistent: true })], { id: "second", place: "house", view: "detail", focus: ["lamp-detail"] })],
      },
    },
  },
};
continuity.gen.remotion.scenes.first[0].nodes.push(node("rear-door", "prop", "gate", { description: "closed wooden door", objectId: "rear-door", persistent: true, role: "fixture", mount: "doorway", state: "closed" }));
resolveRemotionContinuity(continuity, { cast: [], places: [] } as any);
const lampDetail = continuity.gen.remotion.scenes.second[0];
assert.equal(lampDetail.nodes.find((n: MotionRemotionNode) => n.id === "lamp-detail").target, "altar");
assert.ok(lampDetail.nodes.some((n: MotionRemotionNode) => n.id === "altar"));
assert.equal(lampDetail.nodes.find((n: MotionRemotionNode) => n.id === "rear-door")?.state, "closed");
const catalog = remotionObjectCatalog({ illustrationNeeds: [{ place: "house", objects: [{ key: "coffin", word: "quan tài", description: "dark wooden coffin" }] }] } as any, { beats: [{ place: "house", scenePlan: { requiredProps: ["quan tài bà Tư"] } }] } as any, "house");
assert.equal(catalog.length, 1);
assert.ok(catalog[0].aliases.includes(`object_${motionInputKey("quan tài bà Tư".normalize("NFC").toLowerCase()).slice(0, 12)}`));
const nestedCatalog = remotionObjectCatalog({ illustrationNeeds: [{ place: "house", objects: [{ key: "portrait", word: "di ảnh", description: "framed portrait" }] }] } as any, { beats: [{ place: "house", scenePlan: { requiredProps: ["bàn thờ có di ảnh bà Tư", "di ảnh bà Tư"] } }] } as any, "house");
assert.equal(nestedCatalog.length, 2);
assert.equal(nestedCatalog.find((item) => item.id === "portrait")!.aliases.length, 1);
assert.equal(remotionIdentityDescription("short hair, brown shirt, holding a small broom"), "short hair, brown shirt");
assert.equal(remotionIdentityDescription("long hair, gray-brown blouse; in white shirt with hollow eyes after the change"), "long hair, gray-brown blouse");
assert.equal(canReuseRemotionCharacter(node("ghost", "character", "person", { description: "white shirt" }), "gray-brown blouse; in white shirt after the change"), false);
assert.equal(canReuseRemotionCharacter(node("boy", "character", "person", { description: "Em trai, mặt lem tro" }), "boy, pale blue shirt"), false);
assert.equal(remotionAtomicDescription(node("table", "prop", "table", { description: "altar table with a bowl holding incense" })), "altar table");
assert.equal(remotionAtomicDescription(node("table", "prop", "table", { description: "bàn thờ có di ảnh bà ngoại" })), "bàn thờ");
assert.ok(remotionLegacyAssetIssue(node("table", "prop", "table", { mount: "floor", role: "support" }), assets.table));
assert.equal(remotionLegacyAssetIssue(node("table", "prop", "table", { mount: "floor", role: "support" }), { ...assets.table, stagingRevision: S.REVISION }), undefined);
const table = node("table", "prop", "table", { description: "altar table", role: "support", mount: "floor", objectId: "altar", slot: "left" });
const lamp = node("lamp", "prop", "bowl", { description: "oil lamp on the altar table" });
assert.equal(normalizeRemotionRelations([table, lamp])[1].target, "table");
assert.equal(normalizeRemotionRelations([table, { ...table, id: "other" }, lamp])[2].target, undefined);
const holder = node("holder", "character", "person", { pose: "standing, holding a bowl" });
const reversed = normalizeRemotionRelations([node("bowl", "prop", "bowl", { description: "white bowl" }), { ...holder, relation: "heldBy", target: "bowl" }]);
assert.equal(reversed[0].relation, "heldBy");
assert.equal(reversed[0].target, holder.id);
assert.equal(reversed[1].relation, undefined);
assert.equal(reversed[1].target, undefined);
assert.deepEqual(normalizeRemotionRelations(reversed), reversed);
const peers = normalizeRemotionRelations([
  { ...holder, id: "a", relation: "beside", target: "b" },
  { ...holder, id: "b", relation: "beside", target: "a" },
]);
assert.equal(peers[0].relation, undefined);
assert.equal(peers[1].target, "a");
const depthPeers = normalizeRemotionRelations([
  { ...holder, id: "a", relation: "beside", target: "b" },
  { ...holder, id: "b", relation: "behind", target: "a" },
]);
assert.equal(depthPeers[0].relation, undefined);
assert.equal(depthPeers[1].relation, "behind");
const wrongAltar = node("altar", "prop", "table", { description: "Bàn thờ gỗ thấp kê cạnh cửa", role: "fixture", mount: "wall" });
const normalizedAltar = normalizeRemotionRelations([wrongAltar])[0];
assert.equal(normalizedAltar.role, "support");
assert.equal(normalizedAltar.mount, "floor");
const realistic = layoutRemotionNodes([wrongAltar, holder], assets, 1920, 1080, assets.background);
assert.ok(realistic.find((n) => n.id === "altar")!.height < realistic.find((n) => n.id === "holder")!.height * 0.8);
const smallPlaced = layoutRemotionNodes([holder, table, node("small-bowl", "prop", "bowl", { description: "Bát sứ trắng đựng tro", relation: "on", target: table.id })], assets, 1920, 1080, assets.background);
assert.ok(remotionVisibleRect(smallPlaced.find((n) => n.id === "small-bowl")!, assets.bowl).width <= remotionVisibleRect(smallPlaced.find((n) => n.id === holder.id)!, assets.person).height * S.SMALL_SIZE.width + 1e-6);
const outdoorBackground = { ...assets.background, regions: { ...assets.background.regions, outdoors: { x: 0.6, y: 0.2, width: 0.25, height: 0.55 } } };
const farGate = node("far-gate", "prop", "gate", { description: "Cổng tre ở xa ngoài sân", role: "object" });
const farRegion = remotionMountRegion(farGate, outdoorBackground);
assert.ok(farRegion.x >= 0.6 && farRegion.x + farRegion.width <= 0.85);
const farPlaced = layoutRemotionNodes([farGate, node("spirit", "character", "person", { relation: "behind", target: farGate.id })], assets, 1920, 1080, outdoorBackground);
assert.ok(farPlaced.find((n) => n.id === "spirit")!.height < realistic.find((n) => n.id === "holder")!.height * 0.7);
assert.equal(farPlaced.find((n) => n.id === farGate.id)!.role, "fixture");
const outdoorPerson = normalizeRemotionRelations([farGate, node("spirit", "character", "person", { pose: "Standing still outside the gate, facing the house" })])[1];
assert.equal(outdoorPerson.relation, "behind");
assert.equal(outdoorPerson.target, farGate.id);
assert.equal(normalizeRemotionRelations([farGate, node("boy", "character", "person", { pose: "Pointing toward the gate" })])[1].relation, undefined);
const carried = layoutRemotionNodes([holder, node("held-bowl", "prop", "bowl", { description: "white bowl", relation: "heldBy", target: holder.id }), node("mark", "prop", "bowl", { description: "Dấu bàn tay in trong tro", relation: "inside", target: "held-bowl", role: "decal" })], assets, 1920, 1080, assets.background);
const animated = { ...scene(carried), nodes: carried, startFrame: 0, endFrame: 210 };
const behavior = { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" } as const;
const movingHolder = carried.find((n) => n.id === holder.id)!,
  movingBowl = carried.find((n) => n.id === "held-bowl")!;
const before = motionNodeFrame(animated, movingHolder, assets, behavior, 0),
  after = motionNodeFrame(animated, movingHolder, assets, behavior, 3);
assert.notEqual(before.height, after.height);
const hand = assets.person.anchors!.grip,
  grip = assets.bowl.anchors!.grip;
for (const seconds of [0, 1, 3, 6]) {
  const a = motionNodeFrame(animated, movingHolder, assets, behavior, seconds),
    b = motionNodeFrame(animated, movingBowl, assets, behavior, seconds);
  assert.ok(Math.abs(a.y + a.height * hand.y - b.y - b.height * grip.y) < 1e-6);
}
assert.deepEqual(motionNodeFrame(animated, movingHolder, assets, { ...behavior, actors: "fixed" }, 3), { y: movingHolder.y, height: movingHolder.height });
assert.ok(carried.find((n) => n.id === "mark")!.height < movingBowl.height * 0.2);
const surfaceMark = layoutRemotionNodes([holder, node("held-bowl", "prop", "bowl", { description: "white bowl", relation: "heldBy", target: holder.id }), node("mark", "prop", "bowl", { description: "Dấu bàn tay in trong tro", relation: "on", target: "held-bowl", role: "decal" })], assets, 1920, 1080, assets.background);
assert.ok(surfaceMark.find((n) => n.id === "mark")!.height < surfaceMark.find((n) => n.id === "held-bowl")!.height * 0.2);
const closeClue = { ...animated, view: "detail" as const, focus: [movingBowl.id], nodes: [...carried, { ...movingHolder, id: "far-person", x: 1700, essential: true }] };
const clueView = remotionSceneView(closeClue, 1920, 1080, assets);
assert.ok(clueView.scale > 3);
const clueRect = remotionVisibleRect(movingBowl, assets.bowl);
assert.ok(Math.abs((clueRect.x + clueRect.width / 2) * clueView.scale + clueView.x - 960) < 1);
const held = normalizeRemotionRelations([table, holder, node("bowl", "prop", "bowl", { description: "white bowl", relation: "on", target: "table", pose: "held in my hands" })])[2];
assert.equal(held.relation, "heldBy");
assert.equal(held.target, "holder");
const mat = node("mat", "prop", "mat", { description: "woven mat", role: "support", slot: "right" });
const lying = node("sleeper", "character", "lying", { pose: "lying on his side on the mat", poseEssential: true });
assert.equal(normalizeRemotionRelations([mat, lying])[1].target, "mat");
const smoky = scene([node("bowl", "prop", "bowl", { description: "Bát nhang" }), node("smoke", "prop", "bowl", { description: "Làn khói xám tụt xuống sát miệng bát", target: "bowl", relation: "on", essential: true })], { text: "Khói là đà sát đất", effects: [{ id: "fx", kind: "smoke", source: "smoke" }] });
prepareRemotionScene(smoky);
assert.equal(smoky.nodes.length, 1);
assert.equal(smoky.effects![0].source, "bowl");
assert.equal(smoky.effects![0].direction, "ground");
const crowd = scene([holder], { text: "Ba người thật đứng lẫn trong đám cô hồn ngoài đường." });
prepareRemotionScene(crowd);
const prepared = JSON.stringify(crowd);
prepareRemotionScene(crowd);
assert.equal(JSON.stringify(crowd), prepared);
assert.equal(crowd.nodes.length, 2);
const noCrowd = scene([], { text: "Không có đám cô hồn nào cả." });
prepareRemotionScene(noCrowd);
const redundantWall = scene([holder, node("wall", "prop", "table", { description: "Vách gỗ ghép dọc sau bàn thờ.", role: "fixture", mount: "wall" })]);
prepareRemotionScene(redundantWall);
assert.equal(redundantWall.nodes.length, 1);
const markedWall = scene([node("wall", "prop", "table", { description: "Vách gỗ", role: "fixture", mount: "wall" }), node("blood", "prop", "bowl", { description: "Vết máu", relation: "on", target: "wall", role: "decal" })]);
prepareRemotionScene(markedWall);
assert.equal(markedWall.nodes.length, 2);
assert.equal(noCrowd.nodes.length, 0);
for (const [width, height] of [
  [1920, 1080],
  [562.5, 1000],
  [1000, 1000],
  [800, 1000],
]) {
  const gate = node("gate", "prop", "gate", { description: "Cổng gỗ phía sau", mount: "wall", role: "fixture", slot: "right" });
  assert.ok(remotionMountRegion(gate, assets.background).width < 0.4);
  for (const relation of ["behind", "inside", "beside"] as const) {
    const placed = layoutRemotionNodes([gate, node("adult", "character", "person", { relation, target: "gate", age: "adult" })], assets, width, height, assets.background);
    const adult = placed.find((n) => n.id === "adult")!;
    assert.ok(Math.abs(adult.y + adult.height * assets.person.anchors!.base.y - height * 0.88) < 1e-6, `${relation}: feet on ground`);
    assert.ok(adult.depth > placed.find((n) => n.id === "gate")!.depth || relation === "behind");
  }
  const first = scene([table, node("child", "character", "person", { entityId: "child", slot: "right" })]);
  const second = scene([{ ...table, pose: "standing" }, node("adult", "character", "person", { entityId: "adult", slot: "center" }), node("ghost", "character", "person", { entityId: "ghost", slot: "right" })]);
  assignRemotionStaging(
    [first, second],
    [
      { key: "child", age: "child" },
      { key: "adult", age: "adult" },
      { key: "ghost", appearanceOf: "child" },
    ],
  );
  const a = layoutRemotionNodes(first.nodes, assets, width, height, assets.background),
    b = layoutRemotionNodes(second.nodes, assets, width, height, assets.background);
  assert.equal(a.find((n) => n.id === "table")!.x, b.find((n) => n.id === "table")!.x);
  const adult = b.find((n) => n.id === "adult")!,
    child = b.find((n) => n.id === "ghost")!;
  assert.ok(child.height < adult.height * 0.85);
  const surface = layoutRemotionNodes([table, node("bowl-a", "prop", "bowl", { relation: "on", target: "table" }), node("bowl-b", "prop", "bowl", { relation: "on", target: "table" })], assets, width, height, assets.background);
  const dishes = surface
    .filter((n) => n.id.startsWith("bowl-"))
    .map((n) => remotionVisibleRect(n, assets.bowl))
    .sort((a, b) => a.x - b.x);
  assert.ok(dishes[0].x + dishes[0].width <= dishes[1].x + 0.01, "separate props on one support");
  const closedDoor = layoutRemotionNodes([node("door", "prop", "gate", { description: "Khung cửa gỗ", role: "fixture", mount: "doorway", slot: "right" }), node("witness", "character", "person", { relation: "behind", target: "door" })], assets, width, height, assets.background);
  const doorRect = remotionVisibleRect(closedDoor.find((n) => n.id === "door")!, assets.gate),
    witnessRect = remotionVisibleRect(closedDoor.find((n) => n.id === "witness")!, assets.person);
  assert.ok(witnessRect.x + witnessRect.width <= doorRect.x || witnessRect.x >= doorRect.x + doorRect.width, "door cannot hide the witness");
  const timed = { ...second, view: "detail" as const, focus: ["table"], startFrame: 0, endFrame: 300, nodes: b };
  const view = remotionSceneView(timed, width, height, assets);
  for (const seconds of [0, 5, 10]) {
    const camera = motionSceneCameraScale({ version: 1, actors: "fixed", sceneEffects: "off", camera: "gentle" }, seconds, timed, width, height, 30, [timed], assets);
    for (const n of b.filter((item) => timed.focus.includes(item.id))) {
      const r = remotionVisibleRect(n, assets[n.assetKey! as keyof typeof assets]);
      const left = width / 2 + (r.x * view.scale + view.x - width / 2) * camera,
        right = width / 2 + ((r.x + r.width) * view.scale + view.x - width / 2) * camera;
      const top = height / 2 + (r.y * view.scale + view.y - height / 2) * camera,
        bottom = height / 2 + ((r.y + r.height) * view.scale + view.y - height / 2) * camera;
      assert.ok(left >= -0.01 && top >= -0.01 && right <= width + 0.01 && bottom <= height + 0.01, `camera ${width}x${height}`);
    }
  }
}
const ledger = motionStoryEventLedger([{ id: "prior", chapterId: "chapter", narration: "Anh không chôn chiếc hộp. Anh ném nó xuống sông.", visual: "scene", place: "river" }]);
assert.ok(ledger.includes("không chôn chiếc hộp") && ledger.includes("ném nó xuống sông"));
assert.ok(ledger.length <= S.FACT_BUDGET + S.FACT_POLICY.length + 30);
console.log("Legacy staging: identity, relations, floor contact, camera, smoke source, crowd and event ledger passed. Whole-scene build/recovery is covered by verify-motion-composition.ts.");
