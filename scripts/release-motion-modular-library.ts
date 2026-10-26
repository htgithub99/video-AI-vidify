import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { MOTION_LIBRARY_RELEASE as C } from "../src/constants/motionLibraryRelease.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import type { PuppetAsset, PuppetBase, PuppetPiece, PuppetSet, MotionLocationFamily } from "../src/types/motionPuppet.js";
import { normalizeMotionResourceSemantics } from "../src/lib/motionResourceSemantics.js";
import { motionRecipeSources } from "../src/lib/motionResourceRecipe.js";
import { composePuppetSet, piecePlacement, pieceSpots } from "../src/server/services/puppet/setComposition.js";
import { resolvePuppetSetPlan } from "../src/server/services/puppet/setPlan.js";
import { activePuppetLibrary, releasedPuppetAssetAllowed } from "../src/server/services/puppet/libraryRelease.js";
import { puppetPackAssetAllowed } from "../src/server/services/puppet/packPolicy.js";
import { puppetPackAssetIssues } from "../src/server/services/puppet/packInventory.js";
import { puppetSpotGeometryValid } from "../src/lib/motionPlacement.js";
import { writeMotionJsonAtomic } from "../src/server/services/motionFileUtils.js";
import { MODULAR_RELEASE as M } from "./motionModularReleaseCatalog.js";
import { modularShell, modularBridge, modularDoor } from "./motionModularArt.js";
const root = path.resolve(M.ROOT);
const release = M.ID;
const destination = path.join(root, C.RELEASES, release);
const argument = process.argv.find((value) => value.startsWith("--source="));
const source = argument ? path.resolve(argument.slice(9)) : root;
const closed = (asset: PuppetAsset) => Object.values(K.PRESETS).includes(asset.type === T.STYLE ? asset.id : "styleId" in asset ? asset.styleId : "");
const digest = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const workspace = path.resolve(".");
const withinWorkspace = (target: string) => assert.ok(!path.relative(workspace, target).startsWith("..") && path.isAbsolute(target) && target !== workspace, target);
const inventory = (directory: string, directories: string[]) => {
  const output: { file: string; hash: string }[] = [];
  const visit = (folder: string) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(file);
      else output.push({ file: path.relative(directory, file), hash: digest(fs.readFileSync(file)) });
    }
  };
  for (const folder of [...directories].sort()) visit(path.join(directory, folder));
  return output.sort((a, b) => a.file.localeCompare(b.file));
};
const finishArchive = (archive: string, directories: string[]) => {
  for (const directory of directories) {
    const from = path.resolve(root, directory),
      to = path.resolve(archive, directory),
      active = path.resolve(destination, directory);
    assert.equal(path.dirname(from), root);
    assert.equal(path.dirname(to), archive);
    assert.equal(path.dirname(active), destination);
    if (fs.existsSync(from) && fs.lstatSync(from).isSymbolicLink()) {
      assert.equal(fs.realpathSync(from).toLowerCase(), fs.realpathSync(active).toLowerCase());
      assert.ok(fs.existsSync(to));
      continue;
    }
    if (fs.existsSync(from)) {
      assert.equal(fs.existsSync(to), false);
      fs.renameSync(from, to);
    }
    assert.ok(fs.existsSync(to));
    fs.mkdirSync(active, { recursive: true });
    fs.symlinkSync(active, from, "junction");
  }
};
const activate = () => {
  const report = JSON.parse(fs.readFileSync(path.join(destination, C.REPORT), "utf8"));
  assert.equal(report.validated, true);
  assert.equal(report.version, C.VERSION);
  assert.equal(report.release, release);
  assert.equal(report.source, root);
  for (const row of report.files) assert.equal(digest(fs.readFileSync(path.join(destination, row.file))), row.hash, row.file);
  assert.deepEqual(inventory(root, report.sourceDirectories), report.sourceFiles, M.FAILURE);
  const archive = path.resolve(M.ARCHIVE, release);
  for (const target of [root, destination, archive]) withinWorkspace(target);
  fs.mkdirSync(archive, { recursive: true });
  for (const directory of report.sourceDirectories) assert.equal(fs.existsSync(path.join(archive, directory)), false);
  writeMotionJsonAtomic(path.join(archive, "retirement-manifest.json"), { ...report, archive });
  writeMotionJsonAtomic(path.join(root, C.POINTER), { version: C.VERSION, release });
  assert.equal(activePuppetLibrary(root).directory, destination);
  finishArchive(archive, report.sourceDirectories);
  console.log(JSON.stringify({ active: true, directory: destination, archive, counts: report.counts, rejected: report.rejected.length, videoCreated: false }));
};
const id = (prefix: string, key: string) => prefix + digest(key).slice(0, 16);
const rows = (type: string): PuppetAsset[] =>
  fs.existsSync(path.join(source, type))
    ? fs
        .readdirSync(path.join(source, type))
        .filter((file) => file.endsWith(".json"))
        .map((file) => JSON.parse(fs.readFileSync(path.join(source, type, file), "utf8")))
    : [];
if (fs.existsSync(path.join(root, C.POINTER))) {
  const active = activePuppetLibrary(root);
  assert.equal(active.directory, destination, M.ACTIVE_EXISTS);
  const archive = path.resolve(M.ARCHIVE, release);
  withinWorkspace(archive);
  const manifestFile = path.join(archive, "retirement-manifest.json");
  if (fs.existsSync(manifestFile)) finishArchive(archive, JSON.parse(fs.readFileSync(manifestFile, "utf8")).sourceDirectories);
  console.log(JSON.stringify({ alreadyActive: true, directory: destination, report: path.join(destination, C.REPORT) }));
  process.exit(0);
}
assert.ok(fs.existsSync(path.join(source, T.BASE)), M.SOURCE_REQUIRED);
if (fs.existsSync(destination)) {
  if (fs.existsSync(path.join(destination, C.REPORT)) && !process.argv.includes("--rebuild")) {
    if (process.argv.includes("--activate")) activate();
    else console.log(JSON.stringify({ staged: true, alreadyBuilt: true, directory: destination }));
    process.exit(0);
  }
  const failed = path.resolve(M.ARCHIVE, release + "-incomplete-" + Date.now());
  withinWorkspace(destination);
  withinWorkspace(failed);
  fs.mkdirSync(path.dirname(failed), { recursive: true });
  fs.renameSync(destination, failed);
}
const sourceDirectories = fs
  .readdirSync(source, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== C.RELEASES)
  .map((entry) => entry.name);
const sourceFiles = inventory(source, sourceDirectories);
fs.mkdirSync(destination, { recursive: true });
const before = new Map<string, PuppetAsset>();
const assets = new Map<string, PuppetAsset>();
const rejected: { id: string; type: string; reason: string }[] = [];
const now = new Date().toISOString();
const oldCharacters = rows(T.CHARACTER).filter((asset) => asset.type === T.CHARACTER && asset.styleId === K.PRESETS.chibi_folk && puppetPackAssetAllowed(asset, asset.styleId) && asset.chibiDesignVersion !== 3);
const upgrades = new Map<string, PuppetAsset>();
if (oldCharacters.length) {
  const result = spawnSync("python", ["python_scripts/kit_seed/upgrade_modular_characters.py"], { input: JSON.stringify(oldCharacters), encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  assert.equal(result.status, 0, result.stderr);
  for (const asset of JSON.parse(result.stdout) as PuppetAsset[]) upgrades.set(asset.id, asset);
}
const save = (asset: PuppetAsset) => {
  const normalized = normalizeMotionResourceSemantics(asset);
  assert.equal(assets.has(normalized.id), false, normalized.id);
  assert.deepEqual(puppetPackAssetIssues(normalized), [], normalized.id);
  assert.equal(releasedPuppetAssetAllowed(normalized), true, normalized.id);
  fs.mkdirSync(path.join(destination, normalized.type), { recursive: true });
  writeMotionJsonAtomic(path.join(destination, normalized.type, normalized.id + ".json"), normalized);
  assets.set(normalized.id, normalized);
  return normalized;
};
for (const type of C.TYPES) {
  for (const original of rows(type)) {
    before.set(original.id, original);
    const asset = upgrades.get(original.id) || original;
    if (!closed(asset)) {
      save(asset);
      continue;
    }
    if (asset.type === T.STYLE) {
      save(asset);
      continue;
    }
    if (asset.type === T.SET) {
      rejected.push({ id: asset.id, type, reason: "replaced_by_modular_plans" });
      continue;
    }
    let keep = puppetPackAssetAllowed(asset, asset.styleId);
    if (asset.type === T.BASE) keep &&= !!M.BASES[asset.key] && !asset.recipeOnly && !asset.recipeTemplate;
    if (asset.type === T.PIECE) keep &&= !asset.recipeOnly && !asset.recipeSvg && !asset.tags.includes("extracted_component") && !(M.EXCLUDED_PIECES as readonly string[]).includes(asset.key);
    if (asset.type === T.CHARACTER && asset.styleId === K.PRESETS.chibi_folk) keep &&= asset.chibiDesignVersion === 3;
    if (!keep) {
      rejected.push({ id: asset.id, type, reason: "legacy_or_unverified" });
      continue;
    }
    const next = { ...asset, libraryVersion: C.VERSION };
    if (next.type === T.BASE) {
      next.decomposition = "clean";
      next.locationFamily = M.BASES[next.key] as MotionLocationFamily;
      if (next.key === "riverside") next.regions = { water: { bounds: [0, 630, 1920, 140] } };
      if (["yard_earth", "yard_brick", "hill_grass", "stone_yard"].includes(next.key)) next.adaptableLocationFamilies = [...M.ADAPTABLE] as MotionLocationFamily[];
    }
    if (next.type === T.PIECE && ["rowboat", "fishing_boat", "folk_river_ferry"].includes(next.key)) {
      next.placementSurface = "water";
      next.slots = ["water_center", "water_left", "water_right"];
    }
    if (next.type === T.PIECE && next.key === "fixed_component_bed") {
      const patient = next.spots.find((spot) => spot.kind === "lie" && spot.fixture === "bed")!;
      next.compositions = [...(next.compositions || []), ...next.spots.filter((spot) => spot.kind === "stand" && spot.relation === "beside" && spot.fixture === "bed").map((spot) => ({ key: "modular_bedside_" + spot.key, kind: "bedside", roles: { patient: patient.key, caregiver: spot.key } }))];
    }
    save(next);
  }
}
for (const styleId of Object.values(K.PRESETS)) {
  const select = <A extends PuppetAsset>(type: A["type"], key: string): A => [...assets.values()].find((asset) => asset.type === type && "styleId" in asset && asset.styleId === styleId && "key" in asset && asset.key === key) as A;
  for (const family of ["pond", "ditch", "cave", "attic", "porch", "roof"]) {
    const shell = modularShell(select<PuppetBase>(T.BASE, "room_plain"), "modular_" + family, family);
    save({ ...shell, id: id("bas-", release + styleId + shell.key), updatedAt: now });
  }
  const bridge = modularBridge(select<PuppetPiece>(T.PIECE, "fixed_component_table"));
  save({ ...bridge, id: id("pcs-", release + styleId + bridge.key), updatedAt: now });
  const door = modularDoor(select<PuppetPiece>(T.PIECE, "fixed_component_table"));
  save({ ...door, id: id("pcs-", release + styleId + door.key), updatedAt: now });
  for (const [family, baseKey, essential] of M.PROFILES) {
    const base = select<PuppetBase>(T.BASE, baseKey);
    assert.ok(base, baseKey);
    const extras = family === "bedroom" ? [[], ["fixed_component_chair"]] : [[], ["fixed_component_table"], ["fixed_component_chair"]];
    const seen = new Set<string>();
    for (const [variant, extra] of extras.entries()) {
      const pieces = [...new Set([...essential, ...extra])].map((key) => select<PuppetPiece>(T.PIECE, key));
      const signature = pieces
        .map((piece) => piece?.id)
        .sort()
        .join(",");
      if (seen.has(signature)) continue;
      seen.add(signature);
      assert.ok(pieces.every(Boolean), [family, ...essential, ...extra].join(","));
      const placements = pieces.map((piece) =>
        piece.slots.flatMap((slot) => {
          const placement = piecePlacement(base, slot, piece);
          return placement && pieceSpots(placement).every((spot) => puppetSpotGeometryValid(spot) && spot.x >= 0 && spot.x <= 1920 && spot.y >= 0 && spot.y <= 1080) ? [{ slot, piece }] : [];
        }),
      );
      let chosen: { slot: string; piece: PuppetPiece }[] | undefined;
      const search = (index: number, placed: { slot: string; piece: PuppetPiece }[]): void => {
        if (chosen) return;
        if (index === placements.length) {
          try {
            composePuppetSet(base, placed, false, false);
            chosen = [...placed];
          } catch {
            return;
          }
          return;
        }
        for (const placement of placements[index]) if (!placed.some((entry) => entry.slot === placement.slot)) search(index + 1, [...placed, placement]);
      };
      search(0, []);
      if (!chosen) {
        if (variant === 0) throw new Error(M.FAILURE + family);
        continue;
      }
      const group = id("group-", styleId + family + variant);
      const dayId = id("set-", release + group + "day"),
        nightId = id("set-", release + group + "night");
      for (const time of ["day", "night"]) {
        const composed = composePuppetSet(base, chosen, time === "night", false);
        const set: PuppetSet = {
          ...composed,
          id: time === "day" ? dayId : nightId,
          type: T.SET,
          styleId,
          libraryVersion: C.VERSION,
          name: `${family} illustration ${variant + 1} ${time}`,
          desc: `${family} setting; ${pieces.map((piece) => piece.key).join(", ") || "empty stage"}; ready for fixed character and prop placement.`,
          tags: [K.SEED, M.TAG, family],
          locationFamily: family as MotionLocationFamily,
          group,
          time,
          interior: base.interior,
          plan: { version: C.PLAN_VERSION, base: base.key, baseId: base.id, pieces: chosen.map(({ slot, piece }) => ({ slot, piece: piece.key, assetId: piece.id })), mirror: false },
          variants: { [time === "day" ? "night" : "day"]: time === "day" ? nightId : dayId },
          uses: 0,
          updatedAt: now,
        };
        save(set);
      }
    }
  }
}
for (const asset of assets.values())
  if (asset.type === T.SET && closed(asset)) {
    for (const reference of [...motionRecipeSources(asset), ...Object.values(asset.variants || {})]) assert.ok(assets.has(reference), M.REF_FAILURE + reference);
    const resolved = resolvePuppetSetPlan(asset, (type, key) => {
      const value = assets.get(key);
      return value?.type === type ? value : null;
    });
    assert.equal(resolved.svg, asset.svg, asset.id);
    assert.deepEqual(resolved.spots, asset.spots, asset.id);
  }
for (const directory of sourceDirectories) {
  if ((C.TYPES as readonly string[]).includes(directory)) {
    for (const entry of fs.readdirSync(path.join(source, directory), { withFileTypes: true })) if (entry.isDirectory()) fs.cpSync(path.join(source, directory, entry.name), path.join(destination, directory, entry.name), { recursive: true });
  } else if (directory === T.SERIES) {
    for (const asset of rows(directory)) {
      if (asset.type !== T.SERIES) continue;
      const filtered = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([, key]) => assets.has(key)));
      save(closed(asset) ? { ...asset, characters: filtered(asset.characters), sets: filtered(asset.sets), props: filtered(asset.props) } : asset);
    }
  } else fs.cpSync(path.join(source, directory), path.join(destination, directory), { recursive: true });
}
const counts = Object.fromEntries([...new Set([...assets.values()].map((asset) => asset.type))].map((type) => [type, [...assets.values()].filter((asset) => asset.type === type).length]));
const files: { file: string; hash: string }[] = [];
const walk = (directory: string) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push({ file: path.relative(destination, file), hash: digest(fs.readFileSync(file)) });
  }
};
walk(destination);
const report = { version: C.VERSION, release, validated: true, createdAt: now, source, sourceDirectories, sourceFiles, counts, rejected, files, preservedIds: [...assets.keys()].filter((key) => before.has(key)), upgradedCharacters: [...upgrades.keys()], videoCreated: false };
writeMotionJsonAtomic(path.join(destination, C.REPORT), report);
if (process.argv.includes("--activate")) {
  activate();
} else console.log(JSON.stringify({ staged: true, directory: destination, counts, rejected: rejected.length, videoCreated: false }));
