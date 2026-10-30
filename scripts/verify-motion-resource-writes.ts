import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeMotionResourceSemantics } from "../src/lib/motionResourceSemantics.js";
import SCHEMA from "../src/constants/motionResourceSchema.json";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { MotionResourceError } from "../src/lib/motionResourceFailure.js";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-resource-writes-"));
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const { writePuppet, readPuppet, puppetLibDir } = await import("../src/features/motion/server/services/puppet/kitLibrary.js");
const { renamePuppetKit } = await import("../src/features/motion/server/services/puppet/kitAdmin.js");
const { runWithPuppetPack } = await import("../src/features/motion/server/services/puppet/packPolicy.js");
const { MOTION_PACK: K } = await import("../src/constants/motionPack.js");
const library = path.resolve("storage/output/motion-video/kit-library");
const all = (type: string) =>
  fs
    .readdirSync(path.join(library, type))
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(library, type, file), "utf8")));
const tray = all("prop").find((asset) => asset.key === "wooden_tray" && asset.styleId === K.PRESETS.minimal_mask)!;
const table = all("set_piece").find((asset) => asset.key === "fixed_component_table")!;
const extracted = { ...table, tags: ["seed", "extracted_component", "table"] };
const fixtures: any[] = [
  tray,
  {
    ...extracted,
    name: "Tên bàn đã đổi",
    spots: [
      { key: "own", fixture: "table", kind: "surface", x: 800, y: 700 },
      { key: "wrong", fixture: "bed", kind: "surface", x: 800, y: 700 },
    ],
  },
  { type: "set_piece", key: "fixed_component_table", name: "Table", environment: "interior" },
  ...["Bến sông trước nhà", "Đền cổ", "Bóng đèn dầu trong phòng ngủ", "Phòng khách", "river", "Nền trống"].map((name) => ({ type: "set", name, desc: "", tags: [] })),
  { type: "set_base", family: "courtyard", desc: "", tags: [] },
  { type: "set", name: "Nền trống", desc: V.FIXTURES + "bed", tags: [] },
  { type: "set", name: "Bến sông", locationFamily: "forest", tags: [] },
];
const python = spawnSync("python", ["-c", "import sys,json; sys.path.insert(0,'python_scripts/kit_seed'); from seed_utils import resource_semantics; print(json.dumps([resource_semantics(row) for row in json.load(sys.stdin)],ensure_ascii=False))"], { input: JSON.stringify(fixtures), encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
assert.equal(python.status, 0, python.stderr);
assert.deepEqual(JSON.parse(python.stdout), fixtures.map(normalizeMotionResourceSemantics));
assert.deepEqual(
  fixtures[1].spots.map((spot: any) => spot.key),
  ["own", "wrong"],
);
assert.deepEqual(
  normalizeMotionResourceSemantics(fixtures[1]).spots.map((spot: any) => spot.key),
  ["own"],
);
const saved = writePuppet({ ...tray, id: "prp-1234567890123456", semanticVersion: undefined, surface: undefined });
assert.equal(saved.semanticVersion, SCHEMA.version);
assert.deepEqual(saved.surface, SCHEMA.propSurfaces.wooden_tray);
assert.equal(renamePuppetKit("prop", saved.id, "Khay đã đổi tên"), true);
assert.equal((readPuppet("prop", saved.id) as any).name, "Khay đã đổi tên");
const file = path.join(puppetLibDir("prop"), saved.id + ".json");
const accepted = fs.readFileSync(file, "utf8");
assert.throws(() => writePuppet({ ...saved, height: -1 }), MotionResourceError);
assert.throws(() => writePuppet({ ...saved, semanticVersion: SCHEMA.version + 1 }), MotionResourceError);
assert.equal(fs.readFileSync(file, "utf8"), accepted);
assert.throws(() => writePuppet({ ...saved, id: "../outside" }), MotionResourceError);
const legacy = { ...saved, id: "prp-2234567890123456", key: "legacy", surface: undefined, height: -1, semanticVersion: undefined };
fs.writeFileSync(path.join(puppetLibDir("prop"), legacy.id + ".json"), JSON.stringify(legacy));
assert.equal(renamePuppetKit("prop", legacy.id, "Giữ bản cũ để kiểm"), true);
assert.throws(() => writePuppet({ ...legacy, height: -2 }), MotionResourceError);
runWithPuppetPack(tray.styleId, [tray], () => {
  assert.throws(() => writePuppet({ ...tray, name: "Không được sửa trong sản xuất" }));
  assert.deepEqual(writePuppet(tray), tray);
});
console.log(JSON.stringify({ passed: true, equivalenceCases: fixtures.length, seedAndTypeScript: true, adminWrites: true, invalidWritePreservesFile: true, legacyReadAndRename: true, closedPackGuard: true, videoCreated: false }));
