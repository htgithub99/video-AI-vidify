import _ from "lodash";
import { StoryboardScene, VisualBible } from "../types";

const FLAT_STYLE_PATTERN = /stickman|flat(?: solid)? colors?|minimalist|no gradients?|no shading/i;
const SAFE_FLAT_EFFECTS = new Set(["", "none", "sharpen", "soft_focus"]);
const GENTLE_TRANSITIONS = new Set(["cut", "cross_dissolve", "fade_black"]);

const MOTION_ZOOM_IN = "Zoom In";
const MOTION_ZOOM_OUT = "Zoom Out";
const MOTION_PAN_LEFT = "Pan Left";
const MOTION_PAN_RIGHT = "Pan Right";
const MOTION_PAN_UP = "Pan Up";
const MOTION_PAN_DOWN = "Pan Down";

const MOTION_RHYTHM = [
  MOTION_ZOOM_IN,
  MOTION_PAN_RIGHT,
  MOTION_ZOOM_IN,
  MOTION_PAN_LEFT,
  MOTION_ZOOM_OUT,
  MOTION_PAN_UP,
  MOTION_ZOOM_IN,
  MOTION_PAN_DOWN,
];

const SHOT_LADDER = ["Wide shot", "Medium shot", "Close-up", "Medium shot"];

const isFlatVisualStyle = (visualBible?: VisualBible): boolean => FLAT_STYLE_PATTERN.test(
  _.join([
    visualBible?.visualStyle,
    visualBible?.colorPalette,
    visualBible?.lightingMood,
    visualBible?.shading,
    visualBible?.lineStyle,
  ], " "),
);

const normalizeTransition = (
  scene: StoryboardScene,
  nextScene: StoryboardScene | undefined,
  index: number,
): string => {
  if (!nextScene) return "cut";
  if (scene.chapterId && nextScene.chapterId && !_.isEqual(scene.chapterId, nextScene.chapterId)) {
    return "fade_black";
  }
  const requested = _.replace(_.toLower(scene.transition || "cut"), /[ -]+/g, "_");
  if (!GENTLE_TRANSITIONS.has(requested) || _.isEqual(requested, "fade_black")) {
    return "cut";
  }
  if (_.isEqual(requested, "cross_dissolve") && index % 4 !== 2) {
    return "cut";
  }
  return requested;
};

const resolveCinematicCameraMotion = (
  scene: StoryboardScene,
  index: number,
  totalScenes: number,
  flatStyle: boolean = false,
): string => {
  if (flatStyle) return "drift";
  const explicitMotion = _.trim(scene.cameraMotion || "");
  const normalizedExplicit = _.replace(_.toLower(explicitMotion), /[ -]+/g, "_");
  const VALID_MOTIONS = new Set([
    "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "drift", "static",
  ]);
  if (VALID_MOTIONS.has(normalizedExplicit) && !_.isEqual(normalizedExplicit, "zoom_in")) {
    return explicitMotion;
  }

  if (index === 0) return MOTION_ZOOM_IN;
  if (index === totalScenes - 1) return MOTION_ZOOM_OUT;

  const shotSize = _.toLower(_.toString(scene.shotSize));
  if (/wide|establishing/i.test(shotSize)) {
    return index % 2 === 0 ? MOTION_PAN_LEFT : MOTION_PAN_RIGHT;
  }
  if (/close|extreme/i.test(shotSize)) {
    return MOTION_ZOOM_IN;
  }

  return MOTION_RHYTHM[index % MOTION_RHYTHM.length];
};

const resolveCinematicShotSize = (
  currentShotSize: string | undefined,
  previousShotSize: string | undefined,
  index: number,
): string => {
  const normalizedCurrent = _.toLower(_.trim(currentShotSize || ""));
  const normalizedPrev = _.toLower(_.trim(previousShotSize || ""));

  if (!_.isEmpty(normalizedCurrent) && !_.isEqual(normalizedCurrent, normalizedPrev)) {
    return currentShotSize!;
  }

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

    const cameraMotion = resolveCinematicCameraMotion(scene, index, total, flatStyle);
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
