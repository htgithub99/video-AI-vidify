import { SKIN_PART_HELMET_MODERN, SKIN_PART_HELMET_ROMAN } from "./head.js";
import { SKIN_PART_HORSE_REAL } from "./horse.js";
import { SKIN_PART_TREE } from "./tree.js";
import { SKIN_PART_QUAD } from "./quad.js";
import { SKIN_PART_HAIR } from "./hair.js";
import { SKIN_PART_QUAD_VIEW } from "./quadView.js";
import { SKIN_PART_CART_RIG } from "./cartRig.js";
import { SKIN_PART_BUILDING } from "./building.js";
import { SKIN_PART_VEHICLE } from "./vehicle.js";
import { SKIN_PART_EFFECT } from "./effect.js";
import { SKIN_PART_PROP } from "./prop.js";
import { SKIN_PART_SCENERY } from "./scenery.js";
import { SKIN_PART_VEHICLE2 } from "./vehicle2.js";
import { SKIN_PART_PROP2 } from "./prop2.js";
import { SKIN_PART_SCENERY2 } from "./scenery2.js";
import { SKIN_PART_EFFECT2 } from "./effect2.js";
import { SKIN_PART_ICON } from "./icon.js";
import { SKIN_PART_WATER } from "./water.js";
import { SKIN_PART_PROPX } from "./propx.js";
import { SKIN_PART_TOOL } from "./tool.js";
import { SKIN_PART_GOODS } from "./goods.js";
import { SKIN_PART_CRAFT } from "./craft.js";
import { SKIN_PART_THINGS } from "./things.js";
import { SKIN_PART_BIRD } from "./bird.js";
import { SKIN_PART_MOTOR } from "./motor.js";
import { MOTION_LIBRARY_PARTS } from "../library/index.js";
export const MOTION_KIT_SKIN_PARTS: Record<string, string> = {
  horse: SKIN_PART_HORSE_REAL,
  helmetRoman: SKIN_PART_HELMET_ROMAN,
  helmetModern: SKIN_PART_HELMET_MODERN,
  tree: SKIN_PART_TREE,
  quad: SKIN_PART_QUAD,
  hair: SKIN_PART_HAIR,
  quadView: SKIN_PART_QUAD_VIEW,
  cartRig: SKIN_PART_CART_RIG,
  building: SKIN_PART_BUILDING,
  vehicle: SKIN_PART_VEHICLE,
  effect: SKIN_PART_EFFECT,
  prop: SKIN_PART_PROP,
  scenery: SKIN_PART_SCENERY,
  vehicle2: SKIN_PART_VEHICLE2,
  prop2: SKIN_PART_PROP2,
  scenery2: SKIN_PART_SCENERY2,
  effect2: SKIN_PART_EFFECT2,
  icon: SKIN_PART_ICON,
  water: SKIN_PART_WATER,
  propx: SKIN_PART_PROPX,
  tool: SKIN_PART_TOOL,
  goods: SKIN_PART_GOODS,
  craft: SKIN_PART_CRAFT,
  things: SKIN_PART_THINGS,
  bird: SKIN_PART_BIRD,
  motor: SKIN_PART_MOTOR,
  ...Object.fromEntries(MOTION_LIBRARY_PARTS.map((part) => [part.part, part.js])),
};
