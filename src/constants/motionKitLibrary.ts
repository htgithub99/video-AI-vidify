import { MOTION_KIT_BIRD_KINDS } from "./motionKitSkins/parts/bird.js";
import { MOTION_KIT_CRAFT_KINDS } from "./motionKitSkins/parts/craft.js";
import { MOTION_KIT_GOODS_KINDS } from "./motionKitSkins/parts/goods.js";
import { MOTION_KIT_MOTOR_KINDS } from "./motionKitSkins/parts/motor.js";
import { MOTION_KIT_THING_KINDS } from "./motionKitSkins/parts/things.js";
import { MOTION_KIT_TOOL_KINDS } from "./motionKitSkins/parts/tool.js";
import { MOTION_LIBRARY_PARTS } from "./motionKitSkins/library/index.js";
const GROUND_PROPS: Record<string, string> = { rock: "scenery", boulder: "scenery", stump: "scenery", log: "scenery", grass: "scenery", reeds: "scenery2", flowers: "scenery2", lotus: "scenery2" };
const PROPX = ["spear", "axe", "scroll", "bow", "bucket", "stonePile", "chain", "pyramid"];
const QUADS = ["rabbit", "leopard", "giraffe", "hippo", "rhino", "reindeer", "moose", "yak", "bison", "llama"];
const BUILDINGS = ["stall", "watchtower", "gatehouse", "cityGate", "mosque", "communalHouse", "stockadeGate", "mudHouse"];
const familyKinds = (fn: string): string[] => MOTION_LIBRARY_PARTS.filter((part) => part.fn === fn).flatMap((part) => part.items.map((item) => item.id));
export const MOTION_KIT_LIBRARY = {
  prop: [...MOTION_KIT_TOOL_KINDS, ...MOTION_KIT_GOODS_KINDS, ...MOTION_KIT_THING_KINDS, ...PROPX, ...Object.keys(GROUND_PROPS), ...familyKinds("prop")],
  building: [...BUILDINGS, "pyramid", ...familyKinds("building")],
  vehicle: [...MOTION_KIT_CRAFT_KINDS, ...MOTION_KIT_MOTOR_KINDS, ...familyKinds("vehicle")],
  animal: [...MOTION_KIT_BIRD_KINDS, ...QUADS, ...familyKinds("animal")],
  tree: familyKinds("tree"),
};
export const MOTION_KIT_LIBRARY_DRAW: Record<string, string> = Object.fromEntries([
  ...MOTION_KIT_TOOL_KINDS.map((kind) => [`prop:${kind}`, "tool"]),
  ...MOTION_KIT_GOODS_KINDS.map((kind) => [`prop:${kind}`, "goods"]),
  ...MOTION_KIT_THING_KINDS.map((kind) => [`prop:${kind}`, "things"]),
  ...PROPX.map((kind) => [`prop:${kind}`, "propx"]),
  ["building:pyramid", "propx"],
  ...Object.entries(GROUND_PROPS).map(([kind, part]) => [`prop:${kind}`, part]),
  ...BUILDINGS.map((kind) => [`building:${kind}`, "building"]),
  ...MOTION_KIT_CRAFT_KINDS.map((kind) => [`vehicle:${kind}`, "craft"]),
  ...MOTION_KIT_MOTOR_KINDS.map((kind) => [`vehicle:${kind}`, "motor"]),
  ...MOTION_KIT_BIRD_KINDS.map((kind) => [`animal:${kind}`, "bird"]),
  ...QUADS.map((kind) => [`animal:${kind}`, "quad"]),
  ...MOTION_LIBRARY_PARTS.flatMap((part) => part.items.map((item) => [`${part.fn}:${item.id}`, part.part])),
]);
export const MOTION_KIT_LIBRARY_JS = JSON.stringify(MOTION_KIT_LIBRARY);
