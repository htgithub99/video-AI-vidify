import { MOTION_OBJECT_KINDS, MOTION_OBJECT_KIND_CLASS, MOTION_OBJECT_KIND_MATCH, MOTION_OBJECT_KIND_PARTS, type MotionObjectKind } from "../constants/motionObjectKinds.js";
import { MOTION_OBJECT_CLASS_PARTS } from "../constants/motionObjectClasses.js";
import { MOTION_SCENE_SPEC as SPEC, type MotionAnimal } from "../constants/motionProfiles/sceneSpec.js";
import type { MotionSceneObject } from "../types/motionVisual.js";
const PART = (name: string): RegExp => new RegExp(`(?:^|[_-])(?:${name})s?(?:[_-]|$)`, "i");
export const motionObjectKind = (item: Pick<MotionSceneObject, "kind" | "term" | "description" | "class">): MotionObjectKind | undefined => {
  if (item.kind && (MOTION_OBJECT_KINDS as readonly string[]).includes(item.kind)) return item.kind;
  for (const text of [item.description || "", item.term || ""]) {
    const found = MOTION_OBJECT_KIND_MATCH.find(([kind, pattern]) => MOTION_OBJECT_KIND_CLASS[kind] === item.class && pattern.test(text));
    if (found) return found[0];
  }
  return undefined;
};
export const motionAnimalLegs = (animal: MotionAnimal | undefined): number => (animal ? (SPEC.ANIMAL_LEGS[animal] ?? SPEC.ANIMAL_LEGS_DEFAULT) : SPEC.ANIMAL_LEGS_DEFAULT);
export const motionObjectPartNames = (item: Pick<MotionSceneObject, "kind" | "term" | "description" | "class">, classNames: readonly string[], animal?: MotionAnimal): readonly string[] => {
  const kind = motionObjectKind(item);
  const names = (kind && MOTION_OBJECT_KIND_PARTS[kind]) || classNames;
  return animal && !motionAnimalLegs(animal) ? names.filter((name) => name !== SPEC.LEGS_PART) : names;
};
export const motionObjectPartChecks = (item: Pick<MotionSceneObject, "kind" | "term" | "description" | "class">, animal?: MotionAnimal): readonly { name: string; match: RegExp }[] => {
  const kind = motionObjectKind(item);
  const override = kind && MOTION_OBJECT_KIND_PARTS[kind];
  const checks = override ? override.map((name) => ({ name, match: PART(name) })) : MOTION_OBJECT_CLASS_PARTS[item.class] || [];
  return animal && !motionAnimalLegs(animal) ? checks.filter((entry) => entry.name !== SPEC.LEGS_PART) : checks;
};
