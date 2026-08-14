import _ from "lodash";
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

const resolveCinematicCameraMotion = (
  scene: StoryboardScene,
  index: number,
  totalScenes: number,
): string => {
  const explicitMotion = _.trim(scene.cameraMotion || "");
  const normalizedExplicit = _.replace(_.toLower(explicitMotion), /[ -]+/g, "_");
  const VALID_MOTIONS = new Set([
    "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "drift", "static",
  ]);
  if (VALID_MOTIONS.has(normalizedExplicit) && normalizedExplicit !== "zoom_in") {
    return explicitMotion;
  }

  // Smart narrative motion assignment:
  // 1. Opening hook (Scene 1): Zoom In to pull audience in
  if (index === 0) return "Zoom In";
  // 2. Final resolution (Last scene): Slow Zoom Out for reflective closure
  if (index === totalScenes - 1) return "Zoom Out";

  // 3. Narrative & Shot size context
  const shotSize = _.toLower(_.toString(scene.shotSize));
  if (/wide|establishing/i.test(shotSize)) {
    return index % 2 === 0 ? "Pan Left" : "Pan Right";
  }
  if (/close|extreme/i.test(shotSize)) {
    return "Zoom In";
  }

  // 4. Alternating dynamic rhythm
  const motionRhythm = [
    "Zoom In",
    "Pan Right",
    "Zoom In",
    "Pan Left",
    "Zoom Out",
    "Pan Up",
    "Zoom In",
    "Pan Down",
  ];
  return motionRhythm[index % motionRhythm.length];
};

const resolveCinematicShotSize = (
  currentShotSize: string | undefined,
  previousShotSize: string | undefined,
  index: number,
): string => {
  const normalizedCurrent = _.toLower(_.trim(currentShotSize || ""));
  const normalizedPrev = _.toLower(_.trim(previousShotSize || ""));

  // Prevent Jump-Cuts (Consecutive identical close-ups or identical wide shots)
  if (normalizedCurrent && normalizedCurrent !== normalizedPrev) {
    return currentShotSize!;
  }

  const SHOT_LADDER = ["Wide shot", "Medium shot", "Close-up", "Medium shot"];
  return SHOT_LADDER[index % SHOT_LADDER.length];
};

export const applyProfessionalEditingPolicy = (
  scenes: StoryboardScene[],
  visualBible?: VisualBible,
): StoryboardScene[] => {
  const flatStyle = isFlatVisualStyle(visualBible);
  const total = scenes.length;

  let lastShotSize: string | undefined = undefined;

  return _.map(scenes, (scene, index) => {
    const requestedEffect = _.toLower(_.trim(scene.effects || ""));
    const effects = flatStyle && !SAFE_FLAT_EFFECTS.has(requestedEffect) ? "" : scene.effects;
    const lightingEffect = flatStyle ? "natural_light" : scene.lightingEffect;

    const cameraMotion = resolveCinematicCameraMotion(scene, index, total);
    const shotSize = resolveCinematicShotSize(scene.shotSize, lastShotSize, index);
    lastShotSize = shotSize;

    return {
      ...scene,
      shotSize: shotSize as StoryboardScene["shotSize"],
      effects,
      lightingEffect,
      cameraMotion,
      transition: normalizeTransition(scene, scenes[index + 1], index),
    };
  });
};
