import _ from "lodash";
import { StoryboardScene, VisualBible } from "../types";

export const EDITING_POLICY_CONSTANTS = {
  MOTION_ZOOM_IN: "Zoom In",
  MOTION_ZOOM_OUT: "Zoom Out",
  MOTION_PAN_LEFT: "Pan Left",
  MOTION_PAN_RIGHT: "Pan Right",
  MOTION_PAN_UP: "Pan Up",
  MOTION_PAN_DOWN: "Pan Down",
  MOTION_DRIFT: "drift",
  MOTION_STATIC: "static",
  TRANSITION_CUT: "cut",
  TRANSITION_FADE_BLACK: "fade_black",
  TRANSITION_CROSS_DISSOLVE: "cross_dissolve",
  LIGHTING_NATURAL: "natural_light",
  EMPTY_STRING: "",
  SPACE_SEPARATOR: " ",
  NORMALIZE_REGEX: /[ -]+/g,
  FLAT_STYLE_PATTERN: /stickman|flat(?: solid)? colors?|minimalist|no gradients?|no shading/i,
  SHOT_WIDE_PATTERN: /wide|establishing/i,
  SHOT_CLOSE_PATTERN: /close|extreme/i,
  DISSOLVE_INTERVAL_MOD: 4,
  DISSOLVE_TARGET_INDEX: 2,
} as const;

const SAFE_FLAT_EFFECTS = new Set<string>([
  EDITING_POLICY_CONSTANTS.EMPTY_STRING,
  "none",
  "sharpen",
  "soft_focus",
]);

const GENTLE_TRANSITIONS = new Set<string>([
  EDITING_POLICY_CONSTANTS.TRANSITION_CUT,
  EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE,
  EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK,
]);

const VALID_MOTIONS = new Set<string>([
  "zoom_in",
  "zoom_out",
  "pan_left",
  "pan_right",
  "pan_up",
  "pan_down",
  EDITING_POLICY_CONSTANTS.MOTION_DRIFT,
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
]);

const MOTION_RHYTHM = [
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_RIGHT,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_LEFT,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_OUT,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_UP,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_DOWN,
];

const SHOT_LADDER = ["Wide shot", "Medium shot", "Close-up", "Medium shot"];
const CAMERA_ANGLE_LADDER = ["eye-level angle", "three-quarter angle", "side angle", "slightly low angle"];
const COMPOSITION_LADDER = [
  "rule of thirds with foreground context",
  "over-the-shoulder depth with the focal prop visible",
  "asymmetrical side composition with clear negative space",
  "layered foreground, subject, and background composition",
];

const isFlatVisualStyle = (visualBible?: VisualBible): boolean =>
  EDITING_POLICY_CONSTANTS.FLAT_STYLE_PATTERN.test(
    _.join(
      [
        visualBible?.visualStyle,
        visualBible?.colorPalette,
        visualBible?.lightingMood,
        visualBible?.shading,
        visualBible?.lineStyle,
      ],
      EDITING_POLICY_CONSTANTS.SPACE_SEPARATOR,
    ),
  );

const normalizeTransition = (
  scene: StoryboardScene,
  nextScene: StoryboardScene | undefined,
  index: number,
): string => {
  if (!nextScene) return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  if (scene.chapterId && nextScene.chapterId && !_.isEqual(scene.chapterId, nextScene.chapterId)) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK;
  }
  const requested = _.replace(
    _.toLower(scene.transition || EDITING_POLICY_CONSTANTS.TRANSITION_CUT),
    EDITING_POLICY_CONSTANTS.NORMALIZE_REGEX,
    "_",
  );
  if (!GENTLE_TRANSITIONS.has(requested) || _.isEqual(requested, EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK)) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  }
  if (
    _.isEqual(requested, EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE) &&
    index % EDITING_POLICY_CONSTANTS.DISSOLVE_INTERVAL_MOD !== EDITING_POLICY_CONSTANTS.DISSOLVE_TARGET_INDEX
  ) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  }
  return requested;
};

const resolveCinematicCameraMotion = (
  scene: StoryboardScene,
  index: number,
  totalScenes: number,
  flatStyle: boolean = false,
): string => {
  if (flatStyle) return EDITING_POLICY_CONSTANTS.MOTION_DRIFT;
  const explicitMotion = _.trim(scene.cameraMotion || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
  const normalizedExplicit = _.replace(
    _.toLower(explicitMotion),
    EDITING_POLICY_CONSTANTS.NORMALIZE_REGEX,
    "_",
  );
  if (VALID_MOTIONS.has(normalizedExplicit) && !_.isEqual(normalizedExplicit, "zoom_in")) {
    return explicitMotion;
  }

  if (index === 0) return EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN;
  if (index === totalScenes - 1) return EDITING_POLICY_CONSTANTS.MOTION_ZOOM_OUT;

  const shotSize = _.toLower(_.toString(scene.shotSize));
  if (EDITING_POLICY_CONSTANTS.SHOT_WIDE_PATTERN.test(shotSize)) {
    return index % 2 === 0
      ? EDITING_POLICY_CONSTANTS.MOTION_PAN_LEFT
      : EDITING_POLICY_CONSTANTS.MOTION_PAN_RIGHT;
  }
  if (EDITING_POLICY_CONSTANTS.SHOT_CLOSE_PATTERN.test(shotSize)) {
    return EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN;
  }

  return MOTION_RHYTHM[index % MOTION_RHYTHM.length];
};

const resolveCinematicShotSize = (
  currentShotSize: string | undefined,
  previousShotSize: string | undefined,
  index: number,
): string => {
  const normalizedCurrent = _.toLower(_.trim(currentShotSize || EDITING_POLICY_CONSTANTS.EMPTY_STRING));
  const normalizedPrev = _.toLower(_.trim(previousShotSize || EDITING_POLICY_CONSTANTS.EMPTY_STRING));

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
  let lastCameraAngle: string | undefined = undefined;
  let lastComposition: string | undefined = undefined;

  return _.map(scenes, (scene, index) => {
    const requestedEffect = _.toLower(_.trim(scene.effects || EDITING_POLICY_CONSTANTS.EMPTY_STRING));
    const effects = flatStyle && !SAFE_FLAT_EFFECTS.has(requestedEffect)
      ? EDITING_POLICY_CONSTANTS.EMPTY_STRING
      : scene.effects;
    const lightingEffect = flatStyle
      ? EDITING_POLICY_CONSTANTS.LIGHTING_NATURAL
      : scene.lightingEffect;

    const cameraMotion = resolveCinematicCameraMotion(scene, index, total, flatStyle);
    const shotSize = resolveCinematicShotSize(scene.shotSize, lastShotSize, index);
    const requestedAngle = _.trim(scene.cameraAngle || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
    const requestedComposition = _.trim(scene.composition || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
    const cameraAngle = !_.isEmpty(requestedAngle) && !_.isEqual(_.toLower(requestedAngle), _.toLower(lastCameraAngle || EDITING_POLICY_CONSTANTS.EMPTY_STRING))
      ? requestedAngle
      : CAMERA_ANGLE_LADDER[index % CAMERA_ANGLE_LADDER.length];
    const composition = !_.isEmpty(requestedComposition) && !_.isEqual(_.toLower(requestedComposition), _.toLower(lastComposition || EDITING_POLICY_CONSTANTS.EMPTY_STRING))
      ? requestedComposition
      : COMPOSITION_LADDER[index % COMPOSITION_LADDER.length];
    lastShotSize = shotSize;
    lastCameraAngle = cameraAngle;
    lastComposition = composition;

    return {
      ...scene,
      shotSize: shotSize as StoryboardScene["shotSize"],
      cameraAngle,
      composition,
      effects,
      lightingEffect,
      cameraMotion,
      transition: normalizeTransition(scene, scenes[index + 1], index),
    };
  });
};

