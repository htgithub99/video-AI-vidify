import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_PROFILE_SCENES } from "../constants/motionProfiles/scenes.js";
import { MOTION_SCENE_SPEC as SPEC, type MotionAnimal, type MotionPosture } from "../constants/motionProfiles/sceneSpec.js";
import { motionNodeAnimal, motionNodeStance } from "./motionScenePlanGuard.js";
import type { MotionRemotionNode, MotionRemotionProfile } from "../types/motionVisual.js";
const BACK_VIEW = RT_MAINTENANCE.OVER_SHOULDER;
const MOUNTED: MotionPosture = RT_MAINTENANCE.MOUNTED;
const BACK: MotionPosture = RT_MAINTENANCE.BACK;
const HORSE: MotionAnimal = RT_MAINTENANCE.HORSE;
export const motionNodeStanceOf = (node: MotionRemotionNode): MotionPosture => node.stance ?? motionNodeStance(node);
export const motionNodeAnimalOf = (node: MotionRemotionNode, cast: ReadonlySet<string>): MotionAnimal | undefined => node.animal ?? motionNodeAnimal(node, cast);
export const motionPoseNotes = (profileId: MotionRemotionProfile, nodes: MotionRemotionNode[], view: string | undefined, cast: ReadonlySet<string>): string[] => {
  const spec = MOTION_PROFILE_SCENES[profileId];
  const stances = nodes.filter((node) => node.kind === RT_MAINTENANCE.CHARACTER && !motionNodeAnimalOf(node, cast)).map(motionNodeStanceOf);
  if (view === BACK_VIEW) stances.push(BACK);
  if (stances.includes(MOUNTED) && !nodes.some((node) => motionNodeAnimalOf(node, cast) === HORSE)) stances.push(MOUNTED);
  return [...new Set(stances)].flatMap((stance) => (spec.postures[stance] ? [spec.postures[stance]!] : [])).slice(0, SPEC.MAX_POSE_NOTES);
};
export const motionAnimalFrames = (profileId: MotionRemotionProfile, nodes: MotionRemotionNode[], cast: ReadonlySet<string>): { animal: MotionAnimal; svg: string; note: string }[] => {
  const spec = MOTION_PROFILE_SCENES[profileId];
  const animals = [
    ...new Set(
      nodes.flatMap((node) => {
        const animal = motionNodeAnimalOf(node, cast);
        return animal ? [animal] : [];
      }),
    ),
  ];
  if (nodes.some((node) => node.kind === RT_MAINTENANCE.CHARACTER && motionNodeStanceOf(node) === MOUNTED) && !animals.includes(HORSE)) animals.unshift(HORSE);
  return animals.slice(0, SPEC.MAX_ANIMAL_FRAMES).map((animal) => ({ animal, svg: spec.animals[animal], note: spec.animalNotes[animal] }));
};
