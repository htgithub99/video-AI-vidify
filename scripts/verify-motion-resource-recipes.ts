import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveMotionResourceRecipe, motionRecipeSources } from "../src/lib/motionResourceRecipe.js";
import { puppetPackAssetIssues } from "../src/features/motion/server/services/puppet/packInventory.js";
import { runWithPuppetPack, capturePuppetPack, withPuppetPackSnapshot } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import type { PuppetAsset, PuppetSet } from "../src/types/motionPuppet.js";
const root = path.resolve(process.argv[2] || "scratch/motion-scene-components-20261026/staged");
const library = path.resolve("storage/output/motion-video/kit-library");
const readAll = (folder: string): PuppetAsset[] =>
  [T.STYLE, T.SET, T.BASE, T.PIECE].flatMap((type) =>
    fs.existsSync(path.join(folder, type))
      ? fs
          .readdirSync(path.join(folder, type))
          .filter((name) => name.endsWith(".json"))
          .map((name) => JSON.parse(fs.readFileSync(path.join(folder, type, name), "utf8")))
      : [],
  );
const original = readAll(library);
const staged = readAll(root);
const assets = new Map([...original, ...staged].map((asset) => [asset.id, asset]));
let scenes = 0;
for (const asset of staged) {
  assert.deepEqual(puppetPackAssetIssues(asset), [], asset.id);
  if (asset.type !== T.SET || !asset.recipe) continue;
  const resolved = resolveMotionResourceRecipe(asset, (type, id) => {
    const value = assets.get(id);
    return value?.type === type ? value : null;
  });
  const before = original.find((row) => row.id === asset.id) as PuppetSet;
  assert.equal(resolved.svg, before.svg, asset.id);
  const missing = new Map(assets);
  missing.delete(asset.recipe.pieces[0].assetId);
  assert.throws(() => resolveMotionResourceRecipe(asset, (_, id) => missing.get(id) || null));
  scenes++;
}
assert.ok(scenes > 0);
for (const styleId of Object.values(K.PRESETS)) {
  const scene = staged.find((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === styleId && !!asset.recipe)!;
  runWithPuppetPack(styleId, [...assets.values()], () => {
    const snapshot = capturePuppetPack({ styleId, characters: {}, props: {}, sets: { scene: scene.id } })!;
    for (const id of motionRecipeSources(scene)) assert.ok(snapshot.assets[id], id);
    withPuppetPackSnapshot(snapshot, () => undefined);
  });
}
console.log(JSON.stringify({ passed: true, scenes, assets: staged.length, exactSvg: true, snapshots: true, missingReferencesBlocked: true, videoCreated: false }));
