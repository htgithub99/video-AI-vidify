import _ from "lodash";
import { EDITOR_REPAIR_CONFIG } from "../constants/config";
import { StoryboardScene, VisualBible } from "../types";

const FLAT_STYLE_PATTERN = /stickman|flat(?: solid)? colors?|minimalist|no gradients?|no shading/i;
const SAFE_FLAT_EFFECTS = new Set(["", "none", "sharpen", "soft_focus"]);
const GENTLE_TRANSITIONS = new Set(["cut", "cross_dissolve", "fade_black"]);

const isFlatVisualStyle = (visualBible?: VisualBible): boolean => FLAT_STYLE_PATTERN.test(_.join([
  visualBible?.visualStyle,
  visualBible?.colorPalette,
  visualBible?.lightingMood,
  visualBible?.shading,
  visualBible?.lineStyle,
], " "));

const normalizeTransition = (
  scene: StoryboardScene,
  nextScene: StoryboardScene | undefined,
  index: number,
): string => {
  if (!nextScene) return "cut";
  if (scene.chapterId && nextScene.chapterId && scene.chapterId !== nextScene.chapterId) return "fade_black";
  const requested = _.replace(_.toLower(scene.transition || "cut"), /[ -]+/g, "_");
  if (!GENTLE_TRANSITIONS.has(requested)) return "cut";
  if (requested === "fade_black") return "cut";
  if (requested === "cross_dissolve" && index % 4 !== 2) return "cut";
  return requested;
};

export const applyProfessionalEditingPolicy = (
  scenes: StoryboardScene[],
  visualBible?: VisualBible,
): StoryboardScene[] => {
  const flatStyle = isFlatVisualStyle(visualBible);
  return _.map(scenes, (scene, index) => {
    const requestedEffect = _.toLower(_.trim(scene.effects || ""));
    const effects = flatStyle && !SAFE_FLAT_EFFECTS.has(requestedEffect) ? "" : scene.effects;
    const lightingEffect = flatStyle ? "natural_light" : scene.lightingEffect;
    const cameraMotion = flatStyle && /handheld|shake|glitch/i.test(scene.cameraMotion || "")
      ? "drift"
      : scene.cameraMotion;
    return {
      ...scene,
      effects,
      lightingEffect,
      cameraMotion,
      transition: normalizeTransition(scene, scenes[index + 1], index),
    };
  });
};

export const repairEditingPlan = (
  scenes: StoryboardScene[],
  visualBible?: VisualBible,
): StoryboardScene[] => applyProfessionalEditingPolicy(
  _.map(scenes, (scene, index) => ({
    ...scene,
    cameraMotion: EDITOR_REPAIR_CONFIG.CAMERA_MOTIONS[index % EDITOR_REPAIR_CONFIG.CAMERA_MOTIONS.length],
    transition: EDITOR_REPAIR_CONFIG.TRANSITIONS[index % EDITOR_REPAIR_CONFIG.TRANSITIONS.length],
  })),
  visualBible,
);
