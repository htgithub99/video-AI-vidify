import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, IMAGE_PROMPT_METADATA_CONFIG, VISUAL_CONTINUITY_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { CharacterConfig, ShotPurpose, StoryboardScene, TextInImageMode, VisualBible } from "../types";
import { resolveSceneCharacterIds } from "./sceneReferenceService";

const SHOT_PURPOSES = Object.values(ShotPurpose);
const PHYSICAL_ACTION_PATTERN = /\b(?:walks?|steps?|sits?|stands?|turns?|reaches?|opens?|closes?|places?|picks?|sets?|holds?|puts?|counts?|sorts?|reads?|checks?|reviews?|types?|writes?|calls?|speaks?|asks?|answers?|hands?|receives?|pays?|hides?|removes?|packs?|leaves?|enters?|exits?|looks?|watches?|waits?|leans?|covers?|wipes?|pushes?|pulls?|carries?|drops?|tears?|folds?|points?|gestures?|shakes?|nods?|runs?|stops?|scrolls?|taps?|locks?|unlocks?|sends?|shows?|faces?)\b/i;

const normalizePlanningText = (value: unknown): string => _.join(_.words(_.deburr(_.toLower(_.toString(value)))), " ");

export const getVisualShotPlanIssues = (
  source: Partial<StoryboardScene>,
  baseScene: StoryboardScene,
): string[] => {
  const issues: string[] = [];
  const requiredFields: Array<keyof Pick<StoryboardScene, "visualIntent" | "visibleAction" | "reaction" | "storyEvidence" | "visualHook" | "composition">> = [
    "visualIntent", "visibleAction", "reaction", "storyEvidence", "visualHook", "composition",
  ];
  _.forEach(requiredFields, field => {
    const value = _.trim(_.toString(source[field]));
    if (_.isEmpty(value)) issues.push(`${baseScene.id}:${field}:missing`);
    else if (DETECTOR_VIETNAMESE_REGEX.test(value)) issues.push(`${baseScene.id}:${field}:must_be_english`);
  });
  const action = _.trim(_.toString(source.visibleAction));
  const normalizedAction = normalizePlanningText(action);
  const normalizedScript = normalizePlanningText(baseScene.script || baseScene.subtitle);
  if (!_.isEmpty(normalizedAction) && _.isEqual(normalizedAction, normalizedScript)) {
    issues.push(`${baseScene.id}:visibleAction:copied_from_script`);
  }
  if (!_.isEmpty(action) && !PHYSICAL_ACTION_PATTERN.test(action)) {
    issues.push(`${baseScene.id}:visibleAction:no_observable_physical_verb`);
  }
  return _.uniq(issues);
};

export interface VisualPlanningOptions {
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  textMode?: TextInImageMode;
}

const extractCharacterVisualDetails = (character: Partial<CharacterConfig>): string[] => _.compact([
  character.genderPresentation,
  character.ageRange,
  character.ethnicitySkinTone,
  character.bodyBuild,
  character.faceShape,
  character.hair,
  character.eyes,
]);

export const createVisualCharacterCards = (characters: Array<Partial<CharacterConfig>>): Record<string, unknown>[] => _.map(
  characters,
  character => {
    const visualDetails = extractCharacterVisualDetails(character);
    const identityLock = !_.isEmpty(visualDetails)
      ? _.join(visualDetails, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR)
      : (character.description || character.name || IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING);

    return {
      id: character.id || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_ID,
      name: character.name || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_NAME,
      narrativeRole: character.narrativeRole || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_ROLE,
      description: identityLock,
      identityLock,
      usesSharedStyleCore: true,
    };
  },
);

export const normalizeVisualShotPlan = (
  source: Partial<StoryboardScene>,
  baseScene: StoryboardScene,
  options: VisualPlanningOptions = {},
): StoryboardScene => {
  const shotPurpose = _.includes(SHOT_PURPOSES, source.shotPurpose as ShotPurpose)
    ? source.shotPurpose
    : ShotPurpose.Action;
  const validCharacterIds = new Set(_.map(options.characters, "id"));
  const explicitCharacterIds = _.filter(
    _.uniq(_.map(_.castArray(source.characterIds), _.toString)),
    id => validCharacterIds.has(id),
  );
  const inferredCharacterIds = _.isArray(source.characterIds)
    ? []
    : resolveSceneCharacterIds({
        characterIds: explicitCharacterIds,
        prompt: _.toString(source.prompt || baseScene.prompt),
        script: baseScene.script,
        subtitle: baseScene.subtitle,
      }, _.defaultTo(options.characters, []));
  const characterIds = _.uniq(_.concat(explicitCharacterIds, inferredCharacterIds));
  const expectedSubjectCount = _.isNumber(source.expectedSubjectCount)
    ? _.clamp(
      _.max([_.toInteger(source.expectedSubjectCount), _.size(characterIds)])!,
      IMAGE_PROMPT_METADATA_CONFIG.MIN_SUBJECT_COUNT,
      IMAGE_PROMPT_METADATA_CONFIG.MAX_SUBJECT_COUNT,
    )
    : undefined;

  return {
    ...baseScene,
    ..._.pick(source, [
      "narrativeBeatId", "characterStage", "visualIntent", "visibleAction", "reaction",
      "storyEvidence", "visualHook",
      "characterStateBefore", "characterStateAfter", "shotSize", "cameraAngle", "composition",
      "continuityFrom", "continuityNotes", "callbackId", "lighting", "textOverlay",
      "cameraMotion", "effects", "lightingEffect", "transition", "prompt",
    ]),
    shotPurpose,
    characterIds,
    locationId: _.toString(source.locationId),
    propIds: _.uniq(_.map(_.castArray(source.propIds), _.toString)),
    expectedSubjectCount,
    allowBackgroundPeople: Boolean(source.allowBackgroundPeople),
    layout: _.includes(IMAGE_PROMPT_METADATA_CONFIG.ALLOWED_LAYOUTS, source.layout)
      ? source.layout
      : IMAGE_PROMPT_METADATA_CONFIG.DEFAULT_LAYOUT as StoryboardScene["layout"],
    textAllowed: _.isEqual(options.textMode, TextInImageMode.Auto)
      ? Boolean(source.textAllowed)
      : !_.isEqual(options.textMode, TextInImageMode.NoText),
  };
};

export const createVisualPlanningPayload = (scenes: StoryboardScene[]): Record<string, unknown>[] => _.map(
  scenes,
  (scene, index) => ({
    ..._.pick(scene, [
      "id", "chapterId", "script", "subtitle", "narrativeBeatId", "characterStateBefore",
      "characterStateAfter", "callbackId", "characterIds", "characterStage", "locationId", "propIds",
      "visualIntent", "visibleAction", "reaction", "storyEvidence", "visualHook", "expectedSubjectCount",
    ]),
    previousNarration: _.toString(scenes[index - 1]?.script || scenes[index - 1]?.subtitle),
    nextNarration: _.toString(scenes[index + 1]?.script || scenes[index + 1]?.subtitle),
  }),
);
