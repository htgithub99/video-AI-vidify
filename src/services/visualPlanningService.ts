import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, IMAGE_PROMPT_METADATA_CONFIG, VISUAL_CONTINUITY_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { CharacterConfig, ShotPurpose, StoryboardScene, TextInImageMode, VisualBible } from "../types";
import { resolveSceneCharacterIds } from "./sceneReferenceService";

const SHOT_PURPOSES = Object.values(ShotPurpose);
const PHYSICAL_ACTION_PATTERN =
  /\b(?:walks?|steps?|sits?|stands?|turns?|reaches?|opens?|closes?|places?|picks?|sets?|holds?|puts?|counts?|sorts?|reads?|checks?|reviews?|types?|writes?|calls?|speaks?|asks?|answers?|hands?|receives?|pays?|hides?|removes?|packs?|leaves?|enters?|exits?|looks?|watches?|waits?|leans?|covers?|wipes?|pushes?|pulls?|carries?|drops?|tears?|folds?|points?|gestures?|shakes?|nods?|runs?|stops?|scrolls?|taps?|locks?|unlocks?|sends?|shows?|faces?|moves?|crosses?|lifts?|raises?|lowers?|strikes?|hits?|swings?|fires?|shoots?|dodges?|falls?|kneels?|rises?|grabs?|releases?|throws?|catches?|breaks?|shatters?|cracks?|collapses?|explodes?|burns?|glows?|flashes?|swirls?|billows?|rolls?|spreads?|envelops?|obscures?|blocks?|reveals?|emerges?|appears?|disappears?|pours?|flows?|splashes?|ripples?|trembles?|vibrates?|bends?|circles?|advances?|retreats?|follows?|chases?|attacks?|deflects?|struggles?|winces?|smiles?|frowns?)\b/i;

const normalizePlanningText = (value: unknown): string => _.join(_.words(_.deburr(_.toLower(_.toString(value)))), " ");

const hasObservablePhysicalAction = (value: unknown): boolean => PHYSICAL_ACTION_PATTERN.test(_.toString(value));

export const getVisualShotPlanIssues = (source: Partial<StoryboardScene>, baseScene: StoryboardScene): string[] => {
  const issues: string[] = [];
  const requiredFields: Array<keyof Pick<StoryboardScene, "visualIntent" | "visibleAction" | "reaction" | "storyEvidence" | "visualHook" | "composition">> = [
    "visualIntent",
    "visibleAction",
    "reaction",
    "storyEvidence",
    "visualHook",
    "composition",
  ];
  _.forEach(requiredFields, (field) => {
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
  if (!_.isEmpty(action) && !hasObservablePhysicalAction(action)) {
    issues.push(`${baseScene.id}:visibleAction:no_observable_physical_verb`);
  }
  if (_.isEqual(source.assetStrategy, "archival")) {
    const query = _.trim(_.toString(source.archivalSearchQuery));
    const normalizedQuery = normalizePlanningText(query);
    if (_.isEmpty(query)) issues.push(`${baseScene.id}:archivalSearchQuery:missing`);
    else if (DETECTOR_VIETNAMESE_REGEX.test(query)) issues.push(`${baseScene.id}:archivalSearchQuery:must_be_english`);
    else if (_.isEqual(normalizedQuery, normalizedScript)) issues.push(`${baseScene.id}:archivalSearchQuery:copied_from_script`);
    if (_.isEmpty(_.trim(_.toString(source.archivalRationale)))) issues.push(`${baseScene.id}:archivalRationale:missing`);
  }
  return _.uniq(issues);
};

export interface VisualPlanningOptions {
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  textMode?: TextInImageMode;
}

const extractCharacterVisualDetails = (character: Partial<CharacterConfig>): string[] =>
  _.compact([character.genderPresentation, character.ageRange, character.ethnicitySkinTone, character.bodyBuild, character.faceShape, character.hair, character.eyes]);

export const createVisualCharacterCards = (characters: Array<Partial<CharacterConfig>>): Record<string, unknown>[] =>
  _.map(characters, (character) => {
    const visualDetails = extractCharacterVisualDetails(character);
    const identityLock = !_.isEmpty(visualDetails)
      ? _.join(visualDetails, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR)
      : character.description || character.name || IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;

    return {
      id: character.id || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_ID,
      name: character.name || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_NAME,
      narrativeRole: character.narrativeRole || VISUAL_CONTINUITY_CONFIG.DEFAULT_CHARACTER_ROLE,
      description: identityLock,
      identityLock,
      usesSharedStyleCore: true,
    };
  });

export const normalizeVisualShotPlan = (source: Partial<StoryboardScene>, baseScene: StoryboardScene, options: VisualPlanningOptions = {}): StoryboardScene => {
  const shotPurpose = _.includes(SHOT_PURPOSES, source.shotPurpose as ShotPurpose) ? source.shotPurpose : ShotPurpose.Action;
  const validCharacterIds = new Set(_.map(options.characters, "id"));
  const explicitCharacterIds = _.filter(_.uniq(_.map(_.castArray(source.characterIds), _.toString)), (id) => validCharacterIds.has(id));
  const inferredCharacterIds = _.isArray(source.characterIds)
    ? []
    : resolveSceneCharacterIds(
        {
          characterIds: explicitCharacterIds,
          prompt: _.toString(source.prompt || baseScene.prompt),
          script: baseScene.script,
          subtitle: baseScene.subtitle,
        },
        _.defaultTo(options.characters, []),
      );
  const characterIds = _.uniq(_.concat(explicitCharacterIds, inferredCharacterIds));
  const expectedSubjectCount = _.isNumber(source.expectedSubjectCount)
    ? _.clamp(
        _.max([_.toInteger(source.expectedSubjectCount), _.size(characterIds)])!,
        IMAGE_PROMPT_METADATA_CONFIG.MIN_SUBJECT_COUNT,
        IMAGE_PROMPT_METADATA_CONFIG.MAX_SUBJECT_COUNT,
      )
    : undefined;
  const sourcePrompt = _.trim(_.toString(source.prompt || baseScene.prompt));
  const characterNames = _.compact(_.map(characterIds, (id) => _.find(options.characters, { id })?.name));
  const missingCharacterNames = _.filter(characterNames, (name) => !_.includes(_.lowerCase(sourcePrompt), _.lowerCase(name)));
  const prompt = _.isEmpty(missingCharacterNames)
    ? sourcePrompt
    : _.join([_.join(missingCharacterNames, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR), sourcePrompt], IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  const requestedVisibleAction = _.trim(_.toString(source.visibleAction));
  const visibleAction = hasObservablePhysicalAction(requestedVisibleAction)
    ? requestedVisibleAction
    : hasObservablePhysicalAction(prompt)
      ? prompt
      : IMAGE_PROMPT_COMPILER_CONFIG.OBSERVABLE_ACTION_FALLBACK;

  return {
    ...baseScene,
    ..._.pick(source, [
      "narrativeBeatId",
      "characterStage",
      "visualIntent",
      "visibleAction",
      "reaction",
      "storyEvidence",
      "visualHook",
      "characterStateBefore",
      "characterStateAfter",
      "shotSize",
      "cameraAngle",
      "composition",
      "continuityFrom",
      "continuityNotes",
      "callbackId",
      "lighting",
      "textOverlay",
      "cameraMotion",
      "effects",
      "lightingEffect",
      "transition",
      "prompt",
      "assetStrategy",
      "archivalSearchQuery",
      "archivalRationale",
      "sequenceId",
      "shotId",
      "shotRole",
      "dialogueMode",
      "spokenDialogue",
      "speakerCharacterId",
      "lipSyncRequired",
      "characterBlocking",
      "eyelineDirection",
      "screenDirection",
      "actionStartState",
      "actionEndState",
      "locationState",
      "wardrobeState",
      "propState",
      "soundDesignCues",
      "cinematicBeats",
      "generationPrompt",
    ]),
    shotPurpose,
    characterIds,
    locationId: _.toString(source.locationId),
    propIds: _.uniq(_.map(_.castArray(source.propIds), _.toString)),
    expectedSubjectCount,
    allowBackgroundPeople: Boolean(source.allowBackgroundPeople),
    layout: _.includes(IMAGE_PROMPT_METADATA_CONFIG.ALLOWED_LAYOUTS, source.layout) ? source.layout : (IMAGE_PROMPT_METADATA_CONFIG.DEFAULT_LAYOUT as StoryboardScene["layout"]),
    textAllowed: _.isEqual(options.textMode, TextInImageMode.Auto) ? Boolean(source.textAllowed) : !_.isEqual(options.textMode, TextInImageMode.NoText),
    assetStrategy: _.isEqual(source.assetStrategy, "archival") ? "archival" : "ai_generated",
    archivalSearchQuery: _.isEqual(source.assetStrategy, "archival") ? _.trim(_.toString(source.archivalSearchQuery)) : "",
    archivalRationale: _.trim(_.toString(source.archivalRationale)),
    prompt,
    visibleAction,
  };
};

export const createVisualPlanningPayload = (scenes: StoryboardScene[]): Record<string, unknown>[] =>
  _.map(scenes, (scene, index) => ({
    ..._.pick(scene, [
      "id",
      "chapterId",
      "script",
      "subtitle",
      "narrativeBeatId",
      "characterStateBefore",
      "characterStateAfter",
      "callbackId",
      "characterIds",
      "characterStage",
      "locationId",
      "propIds",
      "visualIntent",
      "visibleAction",
      "reaction",
      "storyEvidence",
      "visualHook",
      "expectedSubjectCount",
      "sequenceId",
      "shotId",
      "shotRole",
      "dialogueMode",
      "spokenDialogue",
      "speakerCharacterId",
      "lipSyncRequired",
      "characterBlocking",
      "eyelineDirection",
      "screenDirection",
      "actionStartState",
      "actionEndState",
      "locationState",
      "wardrobeState",
      "propState",
      "soundDesignCues",
      "cinematicBeats",
    ]),
    previousNarration: _.toString(scenes[index - 1]?.script || scenes[index - 1]?.subtitle),
    nextNarration: _.toString(scenes[index + 1]?.script || scenes[index + 1]?.subtitle),
  }));

export const createScopedVisualBibleContext = (visualBible: VisualBible, scenes: StoryboardScene[]): Partial<VisualBible> => {
  const locationIds = new Set(_.compact(_.map(scenes, "locationId")));
  const propIds = new Set(_.flatMap(scenes, (scene) => scene.propIds || []));
  const locations = _.defaultTo(visualBible.locations, []);
  const props = _.defaultTo(visualBible.props, []);
  return {
    ..._.pick(visualBible, ["colorPalette", "landscapeSpecs", "lightingMood", "visualStyle", "background", "colorMode", "shading", "textPolicy", "negativeStylePrompt"]),
    locations: _.isEmpty(locationIds) ? locations : _.filter(locations, (location) => locationIds.has(location.id)),
    props: _.isEmpty(propIds) ? props : _.filter(props, (prop) => propIds.has(prop.id)),
  };
};
