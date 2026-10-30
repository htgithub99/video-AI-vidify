import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
process.env.APP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), VT.MOTION_LIBRARY_IDENTITY));
const libraryDir = path.join(process.env.APP_DATA_DIR, VT.DATA, VT.OUTPUT, VT.MOTION_VIDEO, VT.SCENE_LIBRARY);
const legacyName = VT.BA_LAO;
const legacyDesign = { parts: [{ id: VT.BODY, pos: [0, 0, 0], nodes: [{ shape: VT.BOX, size: [0.4, 1, 0.3], mat: { color: VT.VALUE_123456 } }] }] };
fs.mkdirSync(path.join(libraryDir, VT.ITEMS), { recursive: true });
fs.writeFileSync(path.join(libraryDir, VT.ITEMS, VT.CHR_LEGACY0001_JSON), JSON.stringify(legacyDesign));
fs.writeFileSync(path.join(libraryDir, VT.INDEX_JSON), JSON.stringify({ version: 1, items: [{ id: VT.CHR_LEGACY0001, kind: VT.CHARACTER, styleKey: VT.SHARED_3D, type: VT.ELDER, gender: VT.FEMALE, name: legacyName, description: VT.EMPTY_2, tags: [], uses: 0, createdAt: 1 }] }));
const lib = await import("../src/server/services/motionSceneLibraryService.ts");
const { normalizeAnalysis } = await import("../src/features/motion/server/services/motionStoryService.ts");
const design = (color: string) => ({ parts: [{ id: VT.BODY, pos: [0, 0, 0], nodes: [{ shape: VT.BOX, size: [0.4, 1, 0.3], mat: { color } }] }] });
const room = (w: number) => ({ stage: { center: [0, 0], size: [w, w] }, camera: { pos: [0, 2, 5], target: [0, 1, 0] }, nodes: [] });
const shared2d = lib.sharedStyleKeyOf(VT.VALUE_2D);
lib.saveSceneAsset({ kind: VT.LOCATION, styleKey: shared2d, name: VT.SAN_GACH, type: VT.HOUSE }, room(5));
assert.equal(lib.listSceneAssets(VT.PLAIN_3D, VT.LOCATION).length, 0, VT.A_3D_PROJECT_MUST_NOT_RECEIVE_SHARED_2D_ASSETS);
assert.equal(lib.listSceneAssets(VT.PLAIN_2D, VT.LOCATION).length, 1, VT.THE_SHARED_SET_OF_THE_SAME_DRAWING_MODE_STILL_FITS);
assert.equal(lib.sceneStyleFits(shared2d, VT.PLAIN_3D), false);
const style = VT.PLAIN_2D;
const a = lib.saveSceneAsset({ kind: VT.LOCATION, styleKey: style, name: VT.NHA_TREN_GIAN_GIUA }, room(6));
assert.equal(lib.findSameSceneAsset(VT.LOCATION, style, VT.NHA_TREN_GIAN_GIUA, room(6)), a.id, VT.IDENTICAL_CONTENT_IS_RECOGNISED);
assert.equal(lib.findSameSceneAsset(VT.LOCATION, style, VT.NHA_TREN_GIAN_GIUA, room(7)), undefined, VT.SAME_NAME_WITH_DIFFERENT_GEOMETRY_IS_A_DIFFERENT_ASSET);
assert.equal(lib.findSameSceneAsset(VT.LOCATION, style, VT.TEN_KHAC, { nodes: [], camera: { target: [0, 1, 0], pos: [0, 2, 5] }, stage: { size: [6, 6], center: [0, 0] } }), a.id, VT.KEY_ORDER_AND_DISPLAY_NAME_DO_NOT_CHANGE_IDENTITY);
const elder = { name: VT.ONG_LAO_AO_BA_BA_TRANG, type: VT.ELDER, gender: VT.MALE, role: VT.EMPTY_2, look: VT.EMPTY_2, tags: [], design: design(VT.FFFFFF) };
lib.saveSceneAsset({ kind: VT.CHARACTER, styleKey: lib.sharedStyleKeyOf(VT.VALUE_3D), name: elder.name, type: elder.type, gender: elder.gender, sourceFingerprint: lib.sceneAssetFingerprint(elder.design) }, elder.design);
const pending = (characters: any[]) => lib.pendingBaseLibrary(VT.VALUE_3D, { characters, locations: [], props: [] }).characters.length;
assert.equal(pending([elder]), 0, VT.RE_IMPORTING_THE_SAME_CONTENT_IS_SKIPPED);
assert.equal(pending([{ ...elder, design: design(VT.VALUE_000000) }]), 1, VT.SAME_NAME_WITH_A_DIFFERENT_DESIGN_IS_STILL_IMPORTED);
assert.equal(pending([{ ...elder, gender: VT.FEMALE, type: VT.ADULT, design: design(VT.EEEEEE) }]), 1, VT.SAME_NAME_WITH_CHANGED_TYPE_GENDER_IS_STILL_IMPORTED);
const legacy = { name: legacyName, type: VT.ELDER, gender: VT.FEMALE, role: VT.EMPTY_2, look: VT.EMPTY_2, tags: [], design: design(VT.ABCDEF) };
assert.equal(pending([legacy]), 0, VT.LEGACY_ITEMS_WITHOUT_FINGERPRINTS_KEEP_MATCHING_BY_KIND_NAME_TYPE_AND_GE);
assert.equal(pending([{ ...legacy, gender: VT.MALE }]), 1);
assert.equal(lib.findSameSceneAsset(VT.CHARACTER, VT.PLAIN_3D, legacyName, legacyDesign), VT.CHR_LEGACY0001, VT.LEGACY_CONTENT_IS_READ_AND_FINGERPRINTED_WHEN_THE_NAME_MATCHES);
const source = { kind: VT.BRIEF, title: VT.T_3, text: VT.X, segments: [], words: 3, sourceSeconds: 60 } as any;
const places = normalizeAnalysis(
  {
    places: [
      { key: VT.ROOM, name: VT.ROOM_A },
      { key: VT.ROOM, name: VT.ROOM_B },
      { key: VT.ROOM, name: VT.ROOM_A },
    ],
  },
  source,
  60,
).places;
assert.deepEqual(
  places.map((p) => [p.key, p.name]),
  [
    [VT.ROOM, VT.ROOM_A],
    [VT.ROOM_2_2, VT.ROOM_B],
  ],
  VT.A_SECOND_PLACE_REUSING_A_KEY_IS_KEPT_UNDER_ITS_OWN_KEY_EXACT_REPEATS_ARE,
);
fs.rmSync(process.env.APP_DATA_DIR!, { recursive: true, force: true });
process.stdout.write(VT.LIBRARY_IDENTITY_PASSED_NO_2D_3D_MIXING_CONTENT_FINGERPRINTS_OVER_NAMES_ + VT.EMPTY);
