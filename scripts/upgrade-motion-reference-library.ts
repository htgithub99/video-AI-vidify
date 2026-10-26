import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { REFERENCE_LIBRARY as R } from "./motionReferenceCatalog.js";
import { referenceSvg } from "./motionReferenceArt.js";
import { modularDoor } from "./motionModularArt.js";
import { MOTION_LIBRARY_RELEASE as C } from "../src/constants/motionLibraryRelease.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { activePuppetLibrary, releasedPuppetAssetAllowed } from "../src/server/services/puppet/libraryRelease.js";
import { resolvePuppetSetPlan } from "../src/server/services/puppet/setPlan.js";
import { puppetPackAssetIssues } from "../src/server/services/puppet/packInventory.js";
import { puppetPackAssetAllowed } from "../src/server/services/puppet/packPolicy.js";
import { writeMotionJsonAtomic } from "../src/server/services/motionFileUtils.js";
import type { PuppetAsset, PuppetBase, PuppetPiece, PuppetProp, PuppetSpot } from "../src/types/motionPuppet.js";
const root = path.resolve(R.ROOT),
  destination = path.resolve(root, C.RELEASES, R.ID),
  scratch = path.resolve(R.SCRATCH);
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const id = (prefix: string, style: string, key: string) => prefix + digest(style + ":reference:" + key).slice(0, 16);
const filesIn = (folder: string) =>
  C.TYPES.flatMap((type) =>
    fs
      .readdirSync(path.join(folder, type))
      .filter((file) => file.endsWith(".json"))
      .map((file) => ({ file: path.join(type, file), hash: digest(fs.readFileSync(path.join(folder, type, file))) })),
  );
if (process.argv.includes("--activate")) {
  const report = JSON.parse(fs.readFileSync(path.join(destination, C.REPORT), "utf8"));
  assert.equal(report.validated, true);
  assert.deepEqual(filesIn(destination), report.files);
  const audit = JSON.parse(fs.readFileSync(path.join(scratch, "verified", "audit.json"), "utf8"));
  assert.equal(audit.testedInventoryHash, report.inventoryHash);
  assert.ok(audit.probes.length >= 88 && audit.probes.every((probe: any) => probe.status === "choices_generated"));
  assert.equal(
    audit.packs.every((pack: any) => !pack.invalid.length),
    true,
  );
  const verification = JSON.parse(fs.readFileSync(path.join(scratch, "upgrade-verification.json"), "utf8"));
  assert.equal(verification.passed, true);
  assert.equal(verification.testedInventoryHash, report.inventoryHash);
  assert.equal(verification.cases, audit.probes.length);
  assert.equal(verification.coverRenders, 4);
  const visual = JSON.parse(fs.readFileSync(path.join(scratch, "visual-review.json"), "utf8"));
  assert.equal(visual.completed, true);
  assert.equal(visual.testedInventoryHash, report.inventoryHash);
  assert.equal(visual.sheets.length, Math.ceil(audit.probes.length / 8));
  for (const sheet of visual.sheets) {
    assert.match(sheet.file, /^geometry-\d+\.jpg$/);
    assert.equal(digest(fs.readFileSync(path.join(scratch, "verified", sheet.file))), sheet.hash);
  }
  const pointer = path.join(root, C.POINTER);
  if (!fs.existsSync(path.join(scratch, "previous-release.json"))) fs.copyFileSync(pointer, path.join(scratch, "previous-release.json"));
  for (const type of C.TYPES) {
    const link = path.resolve(root, type),
      target = path.resolve(destination, type);
    assert.equal(path.dirname(link), root);
    assert.equal(path.dirname(target), destination);
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
    const previous = fs.realpathSync(link);
    assert.ok(previous.toLowerCase().startsWith(path.join(root, C.RELEASES).toLowerCase() + path.sep));
  }
  writeMotionJsonAtomic(pointer, { version: C.VERSION, release: R.ID });
  for (const type of C.TYPES) {
    const link = path.join(root, type);
    fs.unlinkSync(link);
    fs.symlinkSync(path.join(destination, type), link, "junction");
  }
  assert.equal(activePuppetLibrary(root).directory, destination);
  console.log(JSON.stringify({ activated: R.ID, videoCreated: false }));
  process.exit(0);
}
if (fs.existsSync(destination) && process.argv.includes("--rebuild")) {
  assert.notEqual(activePuppetLibrary(root).directory, destination);
  assert.equal(path.dirname(destination), path.join(root, C.RELEASES));
  fs.renameSync(destination, destination + "-staged-" + Date.now());
}
assert.equal(fs.existsSync(destination), false, destination);
const source = activePuppetLibrary(root).directory;
const assets = new Map<string, PuppetAsset>();
for (const type of C.TYPES)
  for (const file of fs.readdirSync(path.join(source, type)))
    if (file.endsWith(".json")) {
      const a = JSON.parse(fs.readFileSync(path.join(source, type, file), "utf8"));
      assets.set(a.id, a);
    }
const now = new Date().toISOString();
const changed: string[] = [];
const contact = (key: string, kind: string, x: number, y: number, fixture: string, groundY: number, relation?: string): PuppetSpot => ({ key, kind, x, y, fixture, groundY, ...(relation ? { relation } : {}), label: R.CONTACT(key) });
for (const [preset, styleId] of Object.entries(K.PRESETS)) {
  const list = [...assets.values()].filter((a) => "styleId" in a && a.styleId === styleId);
  const pieces = list.filter((a): a is PuppetPiece => a.type === T.PIECE);
  const props = list.filter((a): a is PuppetProp => a.type === T.PROP);
  const bases = list.filter((a): a is PuppetBase => a.type === T.BASE);
  const chibi = preset === "chibi_folk";
  const art = (key: string, night = false, state?: string) => referenceSvg(key, chibi, night, state);
  const save = (asset: PuppetAsset) => {
    assets.set(asset.id, asset);
    changed.push(asset.id);
  };
  const template = pieces.find((a) => a.key === "modular_door")!;
  const propTemplate = props.find((a) => a.key === "earthen_water_bowl")!;
  assert.ok(template && propTemplate);
  for (const spec of R.NEW_PIECES) {
    const spots =
      spec.key === "scaffold"
        ? [contact("scaffold_upper", "stand", 256, 225, "scaffold", 475, "on"), contact("beside_scaffold", "stand", 500, 480, "scaffold", 480, "beside")]
        : spec.key === "bus"
          ? [contact("beside_bus", "stand", 490, 450, "bus", 450, "beside")]
          : [contact("inside_funeral_canopy", "stand", 256, 475, "funeral_canopy", 475, "inside"), contact("beside_funeral_canopy", "stand", 500, 480, "funeral_canopy", 480, "beside")];
    save({
      ...template,
      id: id("pcs-", styleId, spec.key),
      key: spec.key,
      name: spec.name,
      desc: spec.desc,
      kind: spec.kind,
      environment: spec.environment,
      allowedEnvironments: [spec.environment],
      locationFamily: spec.family,
      slots: [...spec.slots],
      box: [0, 0, 512, 512],
      anchor: [256, spec.key === "bus" ? 433 : 480],
      native: undefined,
      size: spec.size,
      svg: art(spec.key),
      night: art(spec.key, true),
      states: undefined,
      stateKey: undefined,
      spots,
      compositions: [],
      lights: [],
      tags: [spec.key, R.TAG],
      uses: 0,
      updatedAt: now,
    });
  }
  for (const spec of R.NEW_PROPS)
    save({
      ...propTemplate,
      id: id("prp-", styleId, spec.key),
      key: spec.key,
      name: spec.name,
      desc: spec.desc,
      requirements: [],
      objectType: "other",
      category: "prop",
      svg: art(spec.key),
      base: [256, spec.key === "tripod" ? 480 : spec.key === "laptop" ? 425 : 391],
      height: spec.size,
      size: spec.size,
      mount: spec.mount,
      surface: spec.key === "tripod" ? { bounds: [173, 25, 166, 40], maxRatio: 0.45 } : undefined,
      attachment: undefined,
      grip: undefined,
      emitter: undefined,
      tags: [spec.key, R.TAG],
      uses: 0,
      updatedAt: now,
    });
  const shroud = props.find((prop) => prop.key === "white_burial_shroud")!;
  save({ ...shroud, svg: art("body_shroud"), attachment: "body", mount: "body", size: 1.6, requirements: [...new Set([...(shroud.requirements || []), "unfolded", "body_cover"])], desc: R.BODY_SHROUD, updatedAt: now });
  const hospital = bases.find((a) => a.key === "room_modern")!;
  save({ ...hospital, id: id("bas-", styleId, R.HOSPITAL.key), key: R.HOSPITAL.key, locationFamily: "hospital", desc: R.HOSPITAL.desc, tags: [R.HOSPITAL.key, R.TAG], updatedAt: now });
  for (const base of bases) if (!base.interior && base.locationFamily === "courtyard") save({ ...base, adaptableLocationFamilies: [...new Set([...(base.adaptableLocationFamilies || []), "workshop", "funeral"])] as PuppetBase["adaptableLocationFamilies"], updatedAt: now });
  for (const piece of pieces) {
    if (piece.key === "modular_door") save({ ...modularDoor(piece), updatedAt: now });
    if (piece.key === "coffin") save({ ...piece, allowedEnvironments: ["interior", "exterior"], updatedAt: now });
    if (["baby_cradle", "folk_wooden_cradle"].includes(piece.key)) save({ ...piece, locationFamily: "bedroom", updatedAt: now });
    if (piece.key === "baby_cradle") save({ ...piece, locationFamily: "bedroom", spots: [contact("cradle_lie", "lie", 960, 780, "cradle", 920), contact("beside_cradle", "stand", 1430, 950, "cradle", 950, "beside"), contact("cradle_pillow", "surface", 820, 780, "cradle", 920)], updatedAt: now });
    if (piece.key === "stilt_house") save({ ...piece, spots: [...piece.spots, contact("upper_platform", "stand", 940, 545, "upper_platform", 750, "on")], updatedAt: now });
    if (["bed", "low_bed", "fixed_component_bed", "daybed"].includes(piece.key)) {
      const lie = piece.spots.find((spot) => spot.kind === "lie")!;
      save({ ...piece, slots: [...new Set([...piece.slots, "mid_left", "mid_right", "back_left", "back_right"])], locationFamily: "bedroom", spots: [...piece.spots, contact("bed_cover_surface", "surface", lie.x, lie.y, "bed", lie.groundY ?? piece.anchor[1])], updatedAt: now });
    }
    if (piece.key === "hammock") save({ ...piece, desc: R.HAMMOCK_DESC, allowedEnvironments: ["interior", "exterior"], spots: [contact("hammock_lie", "lie", 940, 790, "hammock", 950), { ...contact("hammock", "sit", 940, 850, "hammock", 950), seatY: 790 }, contact("beside_hammock", "stand", 1480, 970, "hammock", 970, "beside")], updatedAt: now });
    if (piece.key === "hospital_bed") save({ ...piece, locationFamily: "hospital", spots: [contact("hospital_bed_lie", "lie", 1010, 795, "hospital_bed", 940), contact("beside_hospital_bed", "stand", 500, 960, "hospital_bed", 960, "beside")], updatedAt: now });
    if (piece.key === "folk_raised_daybed") save({ ...piece, spots: piece.spots.map((spot) => (spot.key === "raised_platform_stand" ? { ...spot, relation: "on" } : spot)), updatedAt: now });
    if (piece.key === "wardrobe")
      save({
        ...piece,
        desc: R.WARDROBE_DESC,
        native: undefined,
        box: [0, 20, 512, 482],
        anchor: [256, 502],
        size: 2.1,
        svg: art("wardrobe"),
        night: art("wardrobe", true),
        stateKey: "wardrobe",
        states: Object.fromEntries(["closed", "open", "ajar"].map((state) => [state, { svg: art("wardrobe", false, state), night: art("wardrobe", true, state) }])),
        spots: [contact("wardrobe", "stand", 256, 502, "wardrobe", 502), contact("beside_wardrobe", "stand", 600, 502, "wardrobe", 502, "beside")],
        updatedAt: now,
      });
  }
  for (const [key, name, size] of [
    ["red_liquid_bowl", R.RED_BOWL, 0.22],
    ["red_liquid_plate", R.RED_PLATE, 0.3],
    ["covered_mirror", R.COVERED_MIRROR, 0.85],
  ] as const)
    save({ ...propTemplate, id: id("prp-", styleId, key), key, name, desc: name, requirements: [], objectType: "other", category: "prop", svg: art(key), base: [256, key === "covered_mirror" ? 488 : 457], height: size, size, mount: key === "covered_mirror" ? "floor" : "table", tags: [key, R.TAG], uses: 0, updatedAt: now });
}
for (const asset of [...assets.values()])
  if (asset.type === T.SET)
    assets.set(
      asset.id,
      resolvePuppetSetPlan(asset, (_type, key) => assets.get(key) || null),
    );
for (const asset of assets.values()) {
  if ("tags" in asset && changed.includes(asset.id)) asset.tags = [...new Set([K.SEED, ...asset.tags])];
  assert.deepEqual(puppetPackAssetIssues(asset), [], asset.id);
  assert.ok(releasedPuppetAssetAllowed(asset), asset.id);
  assert.ok(puppetPackAssetAllowed(asset, asset.type === T.STYLE ? asset.id : "styleId" in asset ? asset.styleId : ""), asset.id);
}
for (const type of C.TYPES) fs.mkdirSync(path.join(destination, type), { recursive: true });
for (const asset of assets.values()) writeMotionJsonAtomic(path.join(destination, asset.type, asset.id + ".json"), asset);
const inventory = C.TYPES.flatMap((type) => [...assets.values()].filter((asset) => asset.type === type).sort((a, b) => a.id.localeCompare(b.id)));
fs.mkdirSync(scratch, { recursive: true });
writeMotionJsonAtomic(path.join(scratch, R.INVENTORY), inventory);
writeMotionJsonAtomic(path.join(destination, C.REPORT), { version: C.VERSION, release: R.ID, source, validated: true, createdAt: now, changed, inventoryHash: digest(JSON.stringify(inventory)), files: filesIn(destination), counts: Object.fromEntries(C.TYPES.map((type) => [type, inventory.filter((asset) => asset.type === type).length])) });
console.log(JSON.stringify({ staged: destination, changed: changed.length, assets: inventory.length, videoCreated: false }));
