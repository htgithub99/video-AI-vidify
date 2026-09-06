import _ from "lodash";
import { StoryboardScene, VisualBible } from "../types";

const EDITING_POLICY_CONSTANTS = {
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
  TRANSITION_CROSS_DISSOLVE_INTERVAL: 4,
  LIGHTING_NATURAL: "natural_light",
  EMPTY_STRING: "",
  SPACE_SEPARATOR: " ",
  NORMALIZE_REGEX: /[ -]+/g,
  FLAT_STYLE_PATTERN: /stickman|flat(?: solid)? colors?|minimalist|no gradients?|no shading/i,
  SHOT_WIDE_PATTERN: /wide|establishing/i,
  SHOT_CLOSE_PATTERN: /close|extreme/i,
  SHORT_SCENE_SECONDS: 2.75,
  INTENSE_EFFECT_COOLDOWN_SCENES: 6,
} as const;

const SAFE_FLAT_EFFECTS = new Set<string>([EDITING_POLICY_CONSTANTS.EMPTY_STRING, "none", "sharpen", "soft_focus"]);

const GENTLE_TRANSITIONS = new Set<string>([
  EDITING_POLICY_CONSTANTS.TRANSITION_CUT,
  EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE,
  EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK,
]);

const normalizeContinuityValue = (value: unknown): string => _.toLower(_.trim(_.toString(value || "")));

const isSameContinuousSequence = (scene: StoryboardScene, nextScene: StoryboardScene): boolean => {
  const sequenceId = normalizeContinuityValue(scene.sequenceId);
  const nextSequenceId = normalizeContinuityValue(nextScene.sequenceId);
  if (sequenceId && nextSequenceId) return _.isEqual(sequenceId, nextSequenceId);

  const locationId = normalizeContinuityValue(scene.locationId);
  const nextLocationId = normalizeContinuityValue(nextScene.locationId);
  const locationState = normalizeContinuityValue(scene.locationState);
  const nextLocationState = normalizeContinuityValue(nextScene.locationState);
  return Boolean((locationId && nextLocationId && _.isEqual(locationId, nextLocationId)) || (locationState && nextLocationState && _.isEqual(locationState, nextLocationState)));
};

const hasObservableActionHandoff = (scene: StoryboardScene, nextScene: StoryboardScene): boolean => {
  const endState = normalizeContinuityValue(scene.actionEndState);
  const startState = normalizeContinuityValue(nextScene.actionStartState);
  const continuityFrom = normalizeContinuityValue(nextScene.continuityFrom);
  return Boolean(
    (endState && startState && (_.isEqual(endState, startState) || _.includes(startState, endState) || _.includes(endState, startState))) ||
    (endState && continuityFrom && (_.includes(continuityFrom, endState) || _.includes(endState, continuityFrom))),
  );
};

const DISRUPTIVE_EFFECTS = new Set<string>(["glitch", "vhs", "pixelate", "chromatic_aberration"]);
const DISRUPTIVE_LIGHTING = new Set<string>(["strobe", "flicker", "exposure_pulse"]);
const EMPHATIC_SHOT_PURPOSES = new Set<string>(["reveal", "punchline"]);

const SAFE_GENTLE_MOTIONS = new Set<string>(["zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", EDITING_POLICY_CONSTANTS.MOTION_STATIC]);

const UNCOMFORTABLE_MOTION_PATTERN = /(?:shake|shaky|jitter|jerk|handheld|drift|whip|bounce|pulse|random)/i;

const GENTLE_MOTION_RHYTHM = [
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_RIGHT,
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_IN,
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_LEFT,
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_OUT,
];

const REPEATED_MOTION_ALTERNATIVES = [
  EDITING_POLICY_CONSTANTS.MOTION_PAN_RIGHT,
  EDITING_POLICY_CONSTANTS.MOTION_STATIC,
  EDITING_POLICY_CONSTANTS.MOTION_PAN_LEFT,
  EDITING_POLICY_CONSTANTS.MOTION_ZOOM_OUT,
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
      [visualBible?.visualStyle, visualBible?.colorPalette, visualBible?.lightingMood, visualBible?.shading, visualBible?.lineStyle],
      EDITING_POLICY_CONSTANTS.SPACE_SEPARATOR,
    ),
  );

const normalizeTransition = (scene: StoryboardScene, nextScene: StoryboardScene | undefined, index: number): string => {
  if (!nextScene) return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  const sameSequence = isSameContinuousSequence(scene, nextScene);
  const actionHandoff = hasObservableActionHandoff(scene, nextScene);
  const chapterChanged = Boolean(scene.chapterId && nextScene.chapterId && !_.isEqual(scene.chapterId, nextScene.chapterId));
  if (chapterChanged && !sameSequence) return EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK;
  const requested = _.replace(_.toLower(scene.transition || EDITING_POLICY_CONSTANTS.TRANSITION_CUT), EDITING_POLICY_CONSTANTS.NORMALIZE_REGEX, "_");
  if (!GENTLE_TRANSITIONS.has(requested)) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  }
  if (sameSequence || actionHandoff) return EDITING_POLICY_CONSTANTS.TRANSITION_CUT;
  if (_.isEqual(requested, EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE)) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE;
  }
  if (_.isEqual(requested, EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK)) {
    return EDITING_POLICY_CONSTANTS.TRANSITION_FADE_BLACK;
  }
  if (_.isEqual(requested, EDITING_POLICY_CONSTANTS.TRANSITION_CUT) && _.isEqual((index + 1) % EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE_INTERVAL, 0))
    return EDITING_POLICY_CONSTANTS.TRANSITION_CROSS_DISSOLVE;
  return requested;
};

const resolveCinematicCameraMotion = (
  scene: StoryboardScene,
  index: number,
  totalScenes: number,
  flatStyle: boolean = false,
  previousMotion: string = EDITING_POLICY_CONSTANTS.EMPTY_STRING,
): string => {
  if (index === 0 || index === totalScenes - 1) return EDITING_POLICY_CONSTANTS.MOTION_STATIC;
  if (_.lt(_.defaultTo(scene.duration, 0), EDITING_POLICY_CONSTANTS.SHORT_SCENE_SECONDS)) return EDITING_POLICY_CONSTANTS.MOTION_STATIC;

  const explicitMotion = _.trim(scene.cameraMotion || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
  const normalizedExplicit = _.replace(_.toLower(explicitMotion), EDITING_POLICY_CONSTANTS.NORMALIZE_REGEX, "_");
  if (UNCOMFORTABLE_MOTION_PATTERN.test(explicitMotion)) return EDITING_POLICY_CONSTANTS.MOTION_STATIC;
  if (SAFE_GENTLE_MOTIONS.has(normalizedExplicit)) {
    if (!_.isEqual(_.toLower(explicitMotion), _.toLower(previousMotion))) return explicitMotion;
    return REPEATED_MOTION_ALTERNATIVES[index % REPEATED_MOTION_ALTERNATIVES.length];
  }

  if (flatStyle && index % 6 !== 3) return EDITING_POLICY_CONSTANTS.MOTION_STATIC;
  return GENTLE_MOTION_RHYTHM[index % GENTLE_MOTION_RHYTHM.length];
};

const resolveCinematicShotSize = (currentShotSize: string | undefined, previousShotSize: string | undefined, index: number): string => {
  const normalizedCurrent = _.toLower(_.trim(currentShotSize || EDITING_POLICY_CONSTANTS.EMPTY_STRING));
  const normalizedPrev = _.toLower(_.trim(previousShotSize || EDITING_POLICY_CONSTANTS.EMPTY_STRING));

  if (!_.isEmpty(normalizedCurrent) && !_.isEqual(normalizedCurrent, normalizedPrev)) {
    return currentShotSize!;
  }

  return SHOT_LADDER[index % SHOT_LADDER.length];
};

export const applyProfessionalEditingPolicy = (scenes: StoryboardScene[], visualBible?: VisualBible): StoryboardScene[] => {
  const flatStyle = isFlatVisualStyle(visualBible);
  const total = scenes.length;

  let lastShotSize: string | undefined = undefined;
  let lastCameraAngle: string | undefined = undefined;
  let lastComposition: string | undefined = undefined;
  let lastCameraMotion: string = EDITING_POLICY_CONSTANTS.EMPTY_STRING;
  let lastIntenseEffectIndex = -EDITING_POLICY_CONSTANTS.INTENSE_EFFECT_COOLDOWN_SCENES;

  return _.map(scenes, (scene, index) => {
    const requestedEffect = _.toLower(_.trim(scene.effects || EDITING_POLICY_CONSTANTS.EMPTY_STRING));
    const intenseEffectAllowed =
      _.gte(index - lastIntenseEffectIndex, EDITING_POLICY_CONSTANTS.INTENSE_EFFECT_COOLDOWN_SCENES) &&
      _.gte(_.defaultTo(scene.duration, 0), EDITING_POLICY_CONSTANTS.SHORT_SCENE_SECONDS) &&
      EMPHATIC_SHOT_PURPOSES.has(_.toLower(_.toString(scene.shotPurpose)));
    const disruptiveEffectRequested = DISRUPTIVE_EFFECTS.has(requestedEffect);
    const effects =
      (flatStyle && !SAFE_FLAT_EFFECTS.has(requestedEffect)) || (disruptiveEffectRequested && !intenseEffectAllowed) ? EDITING_POLICY_CONSTANTS.EMPTY_STRING : scene.effects;
    if (disruptiveEffectRequested && intenseEffectAllowed && effects) lastIntenseEffectIndex = index;
    const requestedLighting = _.toLower(_.trim(scene.lightingEffect || EDITING_POLICY_CONSTANTS.EMPTY_STRING));
    const lightingEffect =
      flatStyle || DISRUPTIVE_LIGHTING.has(requestedLighting) ? EDITING_POLICY_CONSTANTS.LIGHTING_NATURAL : scene.lightingEffect || EDITING_POLICY_CONSTANTS.LIGHTING_NATURAL;

    const cameraMotion = resolveCinematicCameraMotion(scene, index, total, flatStyle, lastCameraMotion);
    const shotSize = resolveCinematicShotSize(scene.shotSize, lastShotSize, index);
    const requestedAngle = _.trim(scene.cameraAngle || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
    const requestedComposition = _.trim(scene.composition || EDITING_POLICY_CONSTANTS.EMPTY_STRING);
    const cameraAngle =
      !_.isEmpty(requestedAngle) && !_.isEqual(_.toLower(requestedAngle), _.toLower(lastCameraAngle || EDITING_POLICY_CONSTANTS.EMPTY_STRING))
        ? requestedAngle
        : CAMERA_ANGLE_LADDER[index % CAMERA_ANGLE_LADDER.length];
    const composition =
      !_.isEmpty(requestedComposition) && !_.isEqual(_.toLower(requestedComposition), _.toLower(lastComposition || EDITING_POLICY_CONSTANTS.EMPTY_STRING))
        ? requestedComposition
        : COMPOSITION_LADDER[index % COMPOSITION_LADDER.length];
    lastShotSize = shotSize;
    lastCameraAngle = cameraAngle;
    lastComposition = composition;
    lastCameraMotion = cameraMotion;

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
