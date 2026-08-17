import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, IMAGE_PROMPT_METADATA_CONFIG, STYLE_REFERENCE_DIRECTIVES } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
import {
  appendImagePromptAspectRatio,
  deduplicatePromptSentences,
  sanitizeImagePrompt,
} from "./imagePromptQualityService";
import {
  createMasterStylePrefix,
  createMasterStyleSuffix,
  createSoftStyleDirective,
  removeConflictingStyleTerms,
} from "./styleReferenceService";

export interface ImagePromptCompilerOptions {
  aspectRatio?: string;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  referenceLocked?: boolean;
}

const applyTemplate = (template: string, values: Record<string, string>): string => _.reduce(
  values,
  (result, value, key) => _.replace(result, `{${key}}`, value),
  template,
);

const compactWords = (value: string, maximumWords: number): string => _.join(
  _.take(_.words(value, IMAGE_PROMPT_COMPILER_CONFIG.NON_WHITESPACE_REGEX), maximumWords),
  IMAGE_PROMPT_COMPILER_CONFIG.SPACE_SEPARATOR,
);

const compactSceneField = (value: unknown): string => {
  const str = _.trim(_.toString(value));
  if (_.isEmpty(str) || DETECTOR_VIETNAMESE_REGEX.test(str)) {
    return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  }
  return compactWords(str, IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS);
};

const buildSingleCharacterIdentity = (
  character: CharacterConfig,
  stageId?: string,
): string => {
  const stage = _.find(character.timelineStages, { id: stageId });
  const identityAnchors = _.join(
    _.compact([
      character.genderPresentation,
      character.hair,
      character.signatureClothing,
      character.accessories,
      character.silhouette,
      character.colorPalette,
    ]),
    IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR,
  );
  const identityDetails = _.compact([
    identityAnchors || character.prompt || character.description,
    stage?.outfit,
    stage?.expressionRange,
    stage?.posture,
    stage?.visibleCondition,
  ]);
  const formattedIdentity = compactWords(
    _.join(identityDetails, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS,
  );
  return applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_TEMPLATE, {
    name: character.name,
    identity: formattedIdentity,
  });
};

const createCharacterClause = (
  scene: StoryboardScene,
  characters: CharacterConfig[],
): string => {
  const matchedCharacters = _.filter(characters, character => _.includes(scene.characterIds, character.id));
  const activeCharacters = !_.isEmpty(matchedCharacters)
    ? matchedCharacters
    : (!_.isEmpty(characters) ? [_.first(characters)!] : []);

  const renderedCharacters = _.map(activeCharacters, character =>
    buildSingleCharacterIdentity(character, scene.characterStage),
  );

  return compactWords(
    _.join(renderedCharacters, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS,
  );
};

const createLocationClause = (
  scene: StoryboardScene,
  visualBible?: VisualBible,
): string => {
  const location = _.find(visualBible?.locations, { id: scene.locationId });
  if (!location) {
    return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  }
  const anchors = compactWords(
    _.join(location.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS,
  );
  return compactWords(
    applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_TEMPLATE, {
      name: location.name,
      anchors,
    }),
    IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS,
  );
};

const createPropClause = (
  scene: StoryboardScene,
  visualBible?: VisualBible,
): string => {
  const matchedProps = _.filter(visualBible?.props, prop => _.includes(scene.propIds, prop.id));
  const renderedProps = _.map(matchedProps, prop =>
    applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.PROP_TEMPLATE, {
      name: prop.name,
      anchors: _.join(prop.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    }),
  );
  return compactWords(
    _.join(renderedProps, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.PROP_MAX_WORDS,
  );
};

const createStyleClause = (options: ImagePromptCompilerOptions): string => {
  const visualBible = options.visualBible;
  const style = visualBible?.styleProfile
    ? createSoftStyleDirective(visualBible.styleProfile)
    : compactWords(
      _.trim(options.targetStyle || visualBible?.visualStyle || IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING),
      IMAGE_PROMPT_COMPILER_CONFIG.STYLE_MAX_WORDS,
    );
  return style ? applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.STYLE_TEMPLATE, { value: style }) : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const createConstraintClauses = (scene: StoryboardScene): string[] => {
  const hasSubjectCount = _.isFinite(scene.expectedSubjectCount);
  const subjectCount = hasSubjectCount
    ? _.clamp(
      _.toInteger(scene.expectedSubjectCount),
      IMAGE_PROMPT_METADATA_CONFIG.MIN_SUBJECT_COUNT,
      IMAGE_PROMPT_METADATA_CONFIG.MAX_SUBJECT_COUNT,
    )
    : undefined;
  const isMultiPerson = (subjectCount && subjectCount > IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_SUBJECT_COUNT)
    || (_.size(scene.characterIds) > IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_SUBJECT_COUNT);

  return _.compact([
    hasSubjectCount && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.SUBJECT_COUNT_TEMPLATE, {
      count: _.toString(subjectCount),
      plural: _.isEqual(subjectCount, IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_SUBJECT_COUNT)
        ? IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING
        : IMAGE_PROMPT_COMPILER_CONFIG.PLURAL_SUFFIX,
    }),
    isMultiPerson && IMAGE_PROMPT_COMPILER_CONFIG.DISTINCT_CHARACTER_VISUALS_DIRECTIVE,
    _.isEqual(scene.layout, IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LAYOUT) && IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
    _.isEqual(scene.allowBackgroundPeople, false) && IMAGE_PROMPT_COMPILER_CONFIG.NO_EXTRA_PEOPLE_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.UNIFORM_CHARACTER_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.NATURAL_LIMB_DIRECTIVE,
    IMAGE_PROMPT_COMPILER_CONFIG.NO_GRID_DIRECTIVE,
  ]) as string[];
};

const createNarrativeClause = (scene: StoryboardScene): string => {
  const candidates = [scene.visualIntent, scene.visibleAction, scene.prompt];
  for (const item of candidates) {
    const raw = _.trim(_.toString(item));
    if (!_.isEmpty(raw) && !_.startsWith(raw, IMAGE_PROMPT_COMPILER_CONFIG.NARRATIVE_IGNORE_PREFIX) && !DETECTOR_VIETNAMESE_REGEX.test(raw)) {
      return compactWords(raw, IMAGE_PROMPT_COMPILER_CONFIG.NARRATIVE_MAX_WORDS);
    }
  }
  return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const createCompositionClause = (scene: StoryboardScene): string => {
  const compositionText = _.replace(
    _.toString(scene.composition),
    IMAGE_PROMPT_COMPILER_CONFIG.RULE_OF_THIRDS_REGEX,
    IMAGE_PROMPT_COMPILER_CONFIG.RULE_OF_THIRDS_REPLACEMENT,
  );
  return compactWords(
    applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.COMPOSITION_TEMPLATE, {
      shotSize: _.toString(scene.shotSize),
      cameraAngle: _.toString(scene.cameraAngle),
      composition: compositionText,
    }),
    IMAGE_PROMPT_COMPILER_CONFIG.COMPOSITION_MAX_WORDS,
  );
};

const buildStateChangeClause = (scene: StoryboardScene): string => {
  const beforeState = _.trim(_.toString(scene.characterStateBefore));
  const afterState = _.trim(_.toString(scene.characterStateAfter));
  const hasStateChange = !_.isEmpty(beforeState) && !_.isEmpty(afterState) && !_.isEqual(_.toLower(beforeState), _.toLower(afterState));
  if (!hasStateChange) {
    return IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
  }
  return applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.BEFORE_AFTER_TEMPLATE, {
    before: compactSceneField(beforeState),
    after: compactSceneField(afterState),
  });
};

const buildContinuityClause = (scene: StoryboardScene): string => {
  const continuity = compactWords(
    _.join(_.compact([scene.continuityFrom, scene.continuityNotes, scene.callbackId]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.CONTINUITY_MAX_WORDS,
  );
  return continuity
    ? applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CONTINUITY_TEMPLATE, { value: continuity })
    : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING;
};

const buildPromptClauses = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions,
): string[] => {
  const visualBible = options.visualBible;
  const isReferenceLocked = Boolean(options.referenceLocked || visualBible?.styleReferenceLocked);

  const masterPrefix = isReferenceLocked
    ? STYLE_REFERENCE_DIRECTIVES.REFERENCE_MATCH_DIRECTIVE
    : (visualBible?.styleProfile ? createMasterStylePrefix(visualBible.styleProfile) : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING);

  const masterSuffix = isReferenceLocked
    ? IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING
    : (visualBible?.styleProfile ? createMasterStyleSuffix(visualBible.styleProfile) : IMAGE_PROMPT_COMPILER_CONFIG.EMPTY_STRING);

  const constraints = isReferenceLocked
    ? [
      _.isEqual(scene.layout, IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LAYOUT) && IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
      IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
      IMAGE_PROMPT_COMPILER_CONFIG.NO_GRID_DIRECTIVE,
    ]
    : createConstraintClauses(scene);

  return _.compact([
    masterPrefix,
    createNarrativeClause(scene),
    compactSceneField(scene.visibleAction),
    !isReferenceLocked && createCharacterClause(scene, _.defaultTo(options.characters, [])),
    scene.reaction && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.REACTION_TEMPLATE, { value: compactSceneField(scene.reaction) }),
    buildStateChangeClause(scene),
    createLocationClause(scene, visualBible),
    createPropClause(scene, visualBible),
    !isReferenceLocked && (compactSceneField(scene.lighting) || IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LIGHTING),
    createCompositionClause(scene),
    !isReferenceLocked && createStyleClause(options),
    buildContinuityClause(scene),
    masterSuffix,
    ...constraints,
  ]);
};

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const existingPrompt = _.trim(_.toString(scene.prompt || scene.generationPrompt));
  if (!_.isEmpty(existingPrompt) && !DETECTOR_VIETNAMESE_REGEX.test(existingPrompt)) {
    return appendImagePromptAspectRatio(sanitizeImagePrompt(existingPrompt), options.aspectRatio);
  }

  const clauses = buildPromptClauses(scene, options);
  let rawPrompt = _.join(clauses, IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  if (_.size(_.trim(rawPrompt)) < 15) {
    const fallbackBase = _.compact([
      options.targetStyle || options.visualBible?.visualStyle || "2D minimalist cartoon illustration",
      scene.shotSize,
      scene.cameraAngle,
      "Universal character consistency, no text, no frame",
    ]);
    rawPrompt = _.join(fallbackBase, IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR);
  }
  const cleanedPrompt = deduplicatePromptSentences(removeConflictingStyleTerms(rawPrompt, Boolean(options.referenceLocked)));
  return appendImagePromptAspectRatio(sanitizeImagePrompt(cleanedPrompt), options.aspectRatio);
};

export const compileStoryboardPrompts = (
  scenes: StoryboardScene[],
  options: ImagePromptCompilerOptions = {},
): StoryboardScene[] => _.map(scenes, scene => ({
  ...scene,
  prompt: compileImagePrompt(scene, options),
}));
