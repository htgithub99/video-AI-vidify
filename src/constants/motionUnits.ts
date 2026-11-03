import type { MotionObjectKind } from "./motionObjectKinds.js";
import type { MotionAnimal } from "./motionProfiles/sceneSpec.js";
export const MOTION_UNITS = ["riderOnHorse", "riderOnCamel", "riderOnElephant", "horseLeader", "gunCrew", "heavyGunCrew", "machineGunCrew", "cartWithDriver", "wagonWithDriver", "boatWithRowers", "chariotCrew", "siegeCrew", "ramCrew", "palanquinBearers", "galleyWithOarsmen"] as const;
export type MotionUnit = (typeof MOTION_UNITS)[number];
export const MOTION_UNIT_PARTS: Record<MotionUnit, readonly string[]> = {
  riderOnHorse: ["rider", "horse"],
  riderOnCamel: ["rider", "camel"],
  riderOnElephant: ["rider", "elephant"],
  horseLeader: ["leader", "horse"],
  gunCrew: ["crew_1", "gun", "crew_2"],
  heavyGunCrew: ["crew_1", "gun", "crew_2"],
  machineGunCrew: ["crew_1", "gun"],
  cartWithDriver: ["driver", "cart", "ox"],
  wagonWithDriver: ["driver", "wagon", "horse"],
  boatWithRowers: ["rower_1", "boat", "rower_2"],
  chariotCrew: ["driver", "archer", "chariot", "horse"],
  siegeCrew: ["crew_1", "engine", "crew_2"],
  ramCrew: ["bearer_1", "bearer_2", "bearer_3", "ram"],
  palanquinBearers: ["bearer_1", "bearer_2", "palanquin"],
  galleyWithOarsmen: ["rower_1", "rower_2", "rower_3", "galley"],
};
export const MOTION_UNIT_SEAT: Partial<Record<MotionUnit, { person: string; carrier: string }>> = {
  riderOnHorse: { person: "rider", carrier: "horse" },
  riderOnCamel: { person: "rider", carrier: "camel" },
  riderOnElephant: { person: "rider", carrier: "elephant" },
};
export const MOTION_UNIT_CREW: Partial<Record<MotionUnit, { people: readonly string[]; object: string }>> = {
  gunCrew: { people: ["crew_1", "crew_2"], object: "gun" },
  heavyGunCrew: { people: ["crew_1", "crew_2"], object: "gun" },
  machineGunCrew: { people: ["crew_1"], object: "gun" },
  boatWithRowers: { people: ["rower_1", "rower_2"], object: "boat" },
  chariotCrew: { people: ["driver", "archer"], object: "chariot" },
  siegeCrew: { people: ["crew_1", "crew_2"], object: "engine" },
  ramCrew: { people: ["bearer_1", "bearer_2", "bearer_3"], object: "ram" },
  palanquinBearers: { people: ["bearer_1", "bearer_2"], object: "palanquin" },
  galleyWithOarsmen: { people: ["rower_1", "rower_2", "rower_3"], object: "galley" },
};
export const MOTION_UNIT_NOTES: Record<MotionUnit, string> = {
  riderOnHorse: "Rider on a horse: the rider's hips sit in the saddle on the horse's back, the near leg along its flank, the far leg hidden; rider and horse are one group and move together.",
  riderOnCamel: "Rider on a camel: the rider sits on or just behind the hump, legs along the camel's side; rider and camel are one group.",
  riderOnElephant: "Rider on an elephant: the rider sits on the elephant's neck behind the head or in a seat on its back; rider and elephant are one group.",
  horseLeader: "Person leading a horse: the person walks at the horse's head holding the reins; the horse follows half a step behind.",
  gunCrew: "Gun crew: two or three gunners around one field gun, hands on its wheels, trail or rammer, pushing or serving it; they stand on the ground beside or behind the gun, never in front of the muzzle.",
  heavyGunCrew: "Heavy gun crew: gunners behind the shield and at the trail of a modern field gun or howitzer, hands on the trail, breech or shells.",
  machineGunCrew: "Machine-gun crew: one gunner sitting or kneeling behind the gun with both hands on the grips, a loader beside him with the belt or box.",
  cartWithDriver: "Ox cart with driver: the ox in front is harnessed to the shafts of the two-wheeled cart; the driver walks beside the ox with a stick or sits on the front of the cart.",
  wagonWithDriver: "Wagon with driver: the horse in front is harnessed to the shafts; the driver sits on the front seat of the wagon holding the reins.",
  boatWithRowers: "Boat with rowers: two people sit inside the hull, their lower bodies hidden by it, each pulling an oar.",
  chariotCrew: "War chariot: the driver and an archer or spearman stand inside the chariot box holding the reins and weapons; the horse in front is harnessed to the pole; one group that moves together.",
  siegeCrew: "Siege engine crew: two or more soldiers working a catapult, trebuchet or ballista, hands on its rope, lever or winch, standing on the ground beside or behind it.",
  ramCrew: "Battering ram crew: three or more soldiers walk in step on both sides of the heavy log, holding it at waist height by its handles, the iron head pointing forward.",
  palanquinBearers: "Palanquin with bearers: the carrying poles rest on the shoulders of the bearers at the front and back; the noble sits inside the cabin, seen through its window.",
  galleyWithOarsmen: "Galley or war boat with oarsmen: the rowers sit in a row inside the hull, their lower bodies hidden by it, all pulling their oars together.",
};
export const MOTION_UNIT_LABEL: Record<MotionUnit, string> = {
  riderOnHorse: "rider on horse",
  riderOnCamel: "rider on camel",
  riderOnElephant: "rider on elephant",
  horseLeader: "horse leader",
  gunCrew: "gun crew",
  heavyGunCrew: "heavy gun crew",
  machineGunCrew: "machine gun crew",
  cartWithDriver: "cart with driver",
  wagonWithDriver: "wagon with driver",
  boatWithRowers: "boat with rowers",
  chariotCrew: "war chariot",
  siegeCrew: "siege engine crew",
  ramCrew: "battering ram crew",
  palanquinBearers: "palanquin with bearers",
  galleyWithOarsmen: "galley with oarsmen",
};
export const MOTION_UNIT_BY_ANIMAL: Partial<Record<MotionAnimal, MotionUnit>> = { horse: "riderOnHorse", camel: "riderOnCamel", elephant: "riderOnElephant", donkey: "riderOnHorse" };
export const MOTION_UNIT_BY_KIND: Partial<Record<MotionObjectKind, MotionUnit>> = { fieldGun: "gunCrew", gatling: "gunCrew", catapult: "siegeCrew", ballista: "siegeCrew", batteringRam: "ramCrew", chariot: "chariotCrew", palanquin: "palanquinBearers", galley: "galleyWithOarsmen", longship: "galleyWithOarsmen", trebuchet: "siegeCrew", howitzer: "heavyGunCrew", mortar: "heavyGunCrew", machineGun: "machineGunCrew", cart: "cartWithDriver", wagon: "wagonWithDriver", carriage: "wagonWithDriver", rowboat: "boatWithRowers", canoe: "boatWithRowers", sampan: "boatWithRowers" };
export const MOTION_UNIT_LEAD: MotionUnit = "horseLeader";
export const MOTION_UNIT_VISIBLE: Record<string, number> = { wide: 6, establishing: 6, medium: 3, over_shoulder: 2, medium_close: 2, close: 1, detail: 1 };
export const MOTION_UNIT_MAX_FRAMES = 1;
export const MOTION_UNIT_SEAT_DEPTH = 0.6;
export const MOTION_UNIT_TOUCH = 0.04;
