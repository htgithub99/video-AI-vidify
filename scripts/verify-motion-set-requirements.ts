import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { puppetSetMissingRequirements } from "../src/server/services/puppet/layout.js";
import { drawPuppetSets } from "../src/server/services/puppet/kitDraw.js";
import type { PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
const wall: PuppetRead = { focus: VT.PLACE, who: [], action: VT.STAND, emotion: VT.NEUTRAL, overlays: [], object: { word: VT.VACH_DAT, key: VT.EARTHEN_WALL, type: VT.WALL, category: VT.SCENE_FEATURE, mount: VT.FLOOR, size: 2, note: VT.EARTHEN_WALL_041874A4 } };
const rest: PuppetRead = { focus: VT.A, who: [VT.A], action: VT.LIE, emotion: VT.NEUTRAL, overlays: [], states: [{ char: VT.A, action: VT.LIE, support: VT.BED }] };
const set = { id: VT.TEST, type: VT.SET, styleId: VT.TEST, name: VT.KITCHEN, desc: VT.A_KITCHEN_WITH_AN_EARTHEN_WALL, tags: [], spots: [], svg: VT.EMPTY, floorY: 980, lights: [], interior: true, time: VT.DAY, uses: 0, updatedAt: VT.EMPTY } as PuppetSet;
assert.deepEqual(puppetSetMissingRequirements(set, [wall]), []);
assert.ok(puppetSetMissingRequirements(set, [{ ...wall, object: { ...wall.object!, key: VT.TALISMAN, category: VT.PROP, mount: VT.HANG } }]).includes(VT.TALISMAN));
assert.ok(puppetSetMissingRequirements({ ...set, desc: VT.A_KITCHEN_WITH_A_STONE_WALL }, [wall]).includes(VT.EARTHEN_WALL));
assert.ok(puppetSetMissingRequirements(set, [rest]).length);
const valid = { ...set, spots: [{ key: VT.BED, kind: VT.LIE, x: 500, y: 800, label: VT.ON_THE_BED }] };
assert.deepEqual(puppetSetMissingRequirements(valid, [wall, rest]), []);
assert.ok(puppetSetMissingRequirements(valid, [{ ...rest, states: [...rest.states!, { char: VT.B, action: VT.LIE, support: VT.BED }] }]).length);
const requests: string[] = [];
const abort = new AbortController();
const style: PuppetStylePack = { ...JSON.parse(fs.readFileSync(VT.STORAGE_OUTPUT_MOTION_VIDEO_KIT_LIBRARY_STYLE_PACK_STL_BA8CA635C716C880_JSON, VT.UTF8)), refs: [], refKinds: {} };
await assert.rejects(
  drawPuppetSets(style, [{ key: VT.ROOM, place: { key: VT.ROOM, name: set.name, desc: set.desc, interior: true, time: VT.DAY }, uses: VT.A_LIES_ON_THE_BED, validate: (value) => puppetSetMissingRequirements(value, [rest]) }], {
    exec: {} as any,
    signal: abort.signal,
    log: () => {},
    ai: async (prompt) => {
      requests.push(prompt);
      if (requests.length === 2) {
        abort.abort();
        throw new Error(VT.VERIFICATION_COMPLETE);
      }
      return { svg: VT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_1920_1080 + VT.RECT_WIDTH_100_HEIGHT_100_FILL_BLACK.repeat(100) + VT.SVG, spots: [] };
    },
  }),
  /verification complete/,
);
assert.equal(requests.length, 2);
assert.ok(requests[1].includes(VT.MISSING_BACKGROUND_PLACEMENT_REQUIREMENTS));
assert.ok(requests[1].includes(VT.SUPPORT_BED));
process.stdout.write(VT.SET_REQUIREMENTS_WALL_GEOMETRY_REQUIRED_BED_CONTACTS_SEPARATE_OCCUPANTS_AND);
