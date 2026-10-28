import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { MODULAR_RELEASE as M } from "./motionModularReleaseCatalog.js";
import { MOTION_LIBRARY_RELEASE as C } from "../src/constants/motionLibraryRelease.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { motionRecipeSources } from "../src/lib/motionResourceRecipe.js";
import { activePuppetLibrary, releasedPuppetAssetAllowed } from "../src/server/services/puppet/libraryRelease.js";
import { resolvePuppetSetPlan } from "../src/server/services/puppet/setPlan.js";
import type { PuppetAsset, PuppetSet } from "../src/types/motionPuppet.js";
import { piecePlacement } from "../src/server/services/puppet/setComposition.js";
const source = path.resolve(M.ROOT, C.RELEASES, M.ID);
const output = path.resolve("scratch/modular-library-release-20261026");
fs.mkdirSync(output, { recursive: true });
const storage = fs.mkdtempSync(path.join(output, "storage-"));
const root = path.join(storage, "output/motion-video/kit-library");
const target = path.join(root, C.RELEASES, M.ID);
const report = JSON.parse(fs.readFileSync(path.join(source, C.REPORT), "utf8"));
assert.equal(report.validated, true);
for (const row of report.files)
  assert.equal(
    createHash("sha256")
      .update(fs.readFileSync(path.join(source, row.file)))
      .digest("hex"),
    row.hash,
    row.file,
  );
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
fs.writeFileSync(path.join(root, C.POINTER), JSON.stringify({ version: C.VERSION, release: M.ID }));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = storage;
const { listPuppets, readPuppet, writePuppet } = await import("../src/server/services/puppet/kitLibrary.js");
const { capturePuppetPack, runWithPuppetPack, withPuppetPackSnapshot } = await import("../src/server/services/puppet/packPolicy.js");
const { seedPuppetKit } = await import("../src/features/motion/server/services/puppet/kitSeed.js");
const assets = C.TYPES.flatMap((type) => listPuppets(type));
for (const type of C.TYPES) assert.equal(assets.filter((asset) => asset.type === type).length, report.counts[type]);
const plans = assets.filter((asset): asset is PuppetSet => asset.type === T.SET);
assert.equal(new Set(plans.map((asset) => JSON.stringify([asset.styleId, asset.locationFamily, asset.time, asset.plan]))).size, plans.length);
const byId = new Map(assets.map((asset) => [asset.id, asset]));
for (const asset of assets) {
  assert.ok(releasedPuppetAssetAllowed(asset), asset.id);
  if (asset.type === T.SET) {
    assert.equal(asset.recipe, undefined);
    assert.equal(asset.plan?.version, C.PLAN_VERSION);
    for (const reference of [...motionRecipeSources(asset), ...Object.values(asset.variants || {})]) assert.ok(byId.has(reference), reference);
  }
  if (asset.type === T.CHARACTER && asset.styleId === K.PRESETS.chibi_folk) assert.equal(asset.chibiDesignVersion, 3);
}
for (const styleId of Object.values(K.PRESETS)) {
  const stock = assets.filter((asset) => "styleId" in asset && asset.styleId === styleId);
  const riverBase = stock.find((asset) => asset.type === T.BASE && asset.key === "riverside")!;
  const yardBase = stock.find((asset) => asset.type === T.BASE && asset.key === "yard_earth")!;
  const boatPiece = stock.find((asset) => asset.type === T.PIECE && asset.key === "rowboat")!;
  assert.equal(piecePlacement(yardBase as any, "water_center", boatPiece as any), null);
  assert.equal(piecePlacement(riverBase as any, "mid_center", boatPiece as any), null);
  const boatPlacement = piecePlacement(riverBase as any, "water_center", boatPiece as any)!;
  assert.ok(boatPlacement.ty >= 630 && boatPlacement.ty <= 770);
  assert.deepEqual([...new Set(stock.filter((asset) => asset.type === T.SET).map((asset) => asset.locationFamily))].sort(), M.PROFILES.map(([family]) => family).sort());
  const set = stock.find((asset): asset is PuppetSet => asset.type === T.SET && asset.locationFamily === "bedroom")!;
  const read = (type: string, key: string) => {
    const value = byId.get(key);
    return value?.type === type ? value : null;
  };
  for (const plan of [
    { ...set.plan, baseId: "bas-0000000000000000" },
    { ...set.plan, pieces: [null] },
    { ...set.plan, pieces: [{ slot: "not_a_slot", piece: "bed", assetId: set.plan!.pieces[0].assetId }] },
    { ...set.plan, pieces: [set.plan!.pieces[0], set.plan!.pieces[0]] },
  ])
    assert.throws(() => resolvePuppetSetPlan({ ...set, plan } as any, read));
  await assert.rejects(
    seedPuppetKit(styleId, "horror", {} as any, () => {}),
    new RegExp(C.CLOSED_SEED),
  );
  const legacy = { ...set, id: "set-0000000000000000", libraryVersion: undefined, plan: undefined };
  assert.throws(() => writePuppet(legacy), new RegExp(C.WRITE_BLOCKED));
  fs.writeFileSync(path.join(target, T.SET, legacy.id + ".json"), JSON.stringify(legacy));
  assert.equal(readPuppet(T.SET, legacy.id), null);
  fs.unlinkSync(path.join(target, T.SET, legacy.id + ".json"));
  const before = fs.readFileSync(path.join(target, T.SET, set.id + ".json"), "utf8");
  assert.throws(() => writePuppet({ ...set, plan: { ...set.plan!, baseId: "bas-0000000000000000" } }));
  assert.equal(fs.readFileSync(path.join(target, T.SET, set.id + ".json"), "utf8"), before);
  runWithPuppetPack(styleId, assets, () => {
    const snapshot = capturePuppetPack({ styleId, sets: { scene: set.id }, characters: {}, props: {} })!;
    for (const reference of motionRecipeSources(set)) assert.ok(snapshot.assets[reference]);
    withPuppetPackSnapshot(snapshot, () => assert.equal(readPuppet<PuppetSet>(T.SET, set.id)!.svg, set.svg));
  });
}
const legacyRoot = fs.existsSync(path.join(path.resolve(M.ROOT), T.SET)) && !fs.lstatSync(path.join(path.resolve(M.ROOT), T.SET)).isSymbolicLink() ? path.resolve(M.ROOT) : path.resolve(M.ARCHIVE, M.ID);
const legacySets = fs
  .readdirSync(path.join(legacyRoot, T.SET))
  .map((file) => JSON.parse(fs.readFileSync(path.join(legacyRoot, T.SET, file), "utf8")) as PuppetAsset)
  .filter((asset): asset is PuppetSet => asset.type === T.SET && !asset.recipe && !asset.plan && "tags" in asset && asset.tags.includes(K.SEED));
const legacySet = legacySets[0];
assert.ok(legacySet);
const style = byId.get(legacySet.styleId)!;
runWithPuppetPack(style.id, [style, ...legacySets], () => {
  const snapshot = capturePuppetPack({ styleId: style.id, characters: {}, sets: { old: legacySet.id }, props: {} })!;
  withPuppetPackSnapshot(snapshot, () => assert.equal(readPuppet<PuppetSet>(T.SET, legacySet.id)!.svg, legacySet.svg));
});
const pointer = fs.readFileSync(path.join(root, C.POINTER));
fs.writeFileSync(path.join(root, C.POINTER), JSON.stringify({ version: C.VERSION, release: "../legacy" }));
assert.throws(() => activePuppetLibrary(root));
fs.writeFileSync(path.join(root, C.POINTER), pointer);
let historicalSnapshots = 0;
const visit = (value: any): void => {
  if (!value || typeof value !== "object") return;
  if (value.policy && value.fingerprint && value.assets && value.assemblies) {
    withPuppetPackSnapshot(value, () => {
      for (const asset of Object.values(value.assets) as PuppetAsset[]) assert.ok(readPuppet(asset.type, asset.id), asset.id);
    });
    historicalSnapshots++;
  } else for (const nested of Object.values(value)) visit(nested);
};
for (const file of fs.readdirSync(path.resolve("storage/output/motion-video/productions"))) if (file.endsWith(".json")) visit(JSON.parse(fs.readFileSync(path.resolve("storage/output/motion-video/productions", file), "utf8")));
fs.writeFileSync(path.join(output, "verification.json"), JSON.stringify({ passed: true, assets: assets.length, familiesPerPack: M.PROFILES.length, invalidPlansRejected: true, legacyWritesBlocked: true, legacySnapshotsPreserved: true, historicalSnapshots, videoCreated: false, storage }, null, 2));
console.log(JSON.stringify({ passed: true, assets: assets.length, familiesPerPack: M.PROFILES.length, storage, videoCreated: false }));
