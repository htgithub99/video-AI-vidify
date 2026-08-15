import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG, IMAGE_PROMPT_METADATA_CONFIG } from "../constants/config";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
import { appendImagePromptAspectRatio, sanitizeImagePrompt } from "./imagePromptQualityService";
import { createMasterStylePrefix, createMasterStyleSuffix, createSoftStyleDirective, removeConflictingStyleTerms } from "./styleReferenceService";

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
  _.take(_.words(value, /[^\s]+/g), maximumWords),
  " ",
);

const compactSceneField = (value: unknown): string => compactWords(
  _.trim(_.toString(value)),
  IMAGE_PROMPT_COMPILER_CONFIG.SCENE_FIELD_MAX_WORDS,
);

const createCharacterClause = (scene: StoryboardScene, characters: CharacterConfig[]): string => {
  const matchedCharacters = _.filter(characters, character => _.includes(scene.characterIds, character.id));
  const activeCharacters = !_.isEmpty(matchedCharacters)
    ? matchedCharacters
    : (!_.isEmpty(characters) ? [_.first(characters)!] : []);

  return compactWords(_.join(
    _.map(
      activeCharacters,
      character => {
        const stage = _.find(character.timelineStages, { id: scene.characterStage });
        const identityAnchors = _.join(_.compact([
          character.hair,
          character.signatureClothing,
          character.accessories,
          character.silhouette,
          character.colorPalette,
        ]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
        const identity = compactWords(_.join(_.compact([
          identityAnchors || character.prompt || character.description,
          stage?.outfit,
          stage?.expressionRange,
          stage?.posture,
          stage?.visibleCondition,
        ]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS);
        return applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_TEMPLATE, { name: character.name, identity });
      },
    ),
    IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR,
  ), IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_IDENTITY_MAX_WORDS);
};

const createLocationClause = (scene: StoryboardScene, visualBible?: VisualBible): string => {
  const location = _.find(visualBible?.locations, { id: scene.locationId });
  if (!location) return "";
  return compactWords(applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_TEMPLATE, {
    name: location.name,
    anchors: compactWords(
      _.join(location.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
      IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS,
    ),
  }), IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_MAX_WORDS);
};

const createPropClause = (scene: StoryboardScene, visualBible?: VisualBible): string => compactWords(_.join(
  _.map(
    _.filter(visualBible?.props, prop => _.includes(scene.propIds, prop.id)),
    prop => applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.PROP_TEMPLATE, {
      name: prop.name,
      anchors: _.join(prop.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    }),
  ),
  IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR,
), IMAGE_PROMPT_COMPILER_CONFIG.PROP_MAX_WORDS);

const createStyleClause = (options: ImagePromptCompilerOptions): string => {
  const visualBible = options.visualBible;
  const style = visualBible?.styleProfile
    ? createSoftStyleDirective(visualBible.styleProfile)
    : compactWords(
      _.trim(options.targetStyle || visualBible?.visualStyle || ""),
      IMAGE_PROMPT_COMPILER_CONFIG.STYLE_MAX_WORDS,
    );
  return style && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.STYLE_TEMPLATE, { value: style });
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
  const isMultiPerson = (subjectCount && subjectCount > 1) || (scene.characterIds && scene.characterIds.length > 1);
  return _.compact([
    hasSubjectCount && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.SUBJECT_COUNT_TEMPLATE, {
      count: _.toString(subjectCount),
      plural: _.isEqual(subjectCount, 1) ? "" : "s",
    }),
    isMultiPerson && "Distinct character visuals: secondary characters, mentors, or clients must wear contrasting clothing colors (e.g. navy, grey, green, or brown) to clearly distinguish them from the main protagonist",
    _.isEqual(scene.layout, IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LAYOUT) && IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
    _.isEqual(scene.allowBackgroundPeople, false) && IMAGE_PROMPT_COMPILER_CONFIG.NO_EXTRA_PEOPLE_DIRECTIVE,
    _.isEqual(scene.textAllowed, false) && IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
    "Strictly no grid lines, no alignment guide overlays, no framing lines on the final image",
  ]) as string[];
};

const createNarrativeClause = (scene: StoryboardScene): string => compactWords(
  _.trim(scene.visualIntent || scene.script || scene.subtitle || ""),
  IMAGE_PROMPT_COMPILER_CONFIG.NARRATIVE_MAX_WORDS,
);

const createCompositionClause = (scene: StoryboardScene): string => {
  const compositionText = _.replace(
    _.toString(scene.composition),
    /rule of thirds/gi,
    "balanced third-division subject placement without visible grid lines",
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

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const visualBible = options.visualBible;
  const beforeState = _.trim(_.toString(scene.characterStateBefore));
  const afterState = _.trim(_.toString(scene.characterStateAfter));
  const stateChange = !_.isEmpty(beforeState) && !_.isEmpty(afterState) && !_.isEqual(_.toLower(beforeState), _.toLower(afterState))
    ? applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.BEFORE_AFTER_TEMPLATE, {
      before: compactSceneField(beforeState),
      after: compactSceneField(afterState),
    })
    : "";
  const continuity = compactWords(
    _.join(_.compact([scene.continuityFrom, scene.continuityNotes, scene.callbackId]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    IMAGE_PROMPT_COMPILER_CONFIG.CONTINUITY_MAX_WORDS,
  );
  const masterPrefix = visualBible?.styleProfile ? createMasterStylePrefix(visualBible.styleProfile) : "";
  const masterSuffix = visualBible?.styleProfile ? createMasterStyleSuffix(visualBible.styleProfile) : "";

  const clauses = _.compact([
    masterPrefix,
    createNarrativeClause(scene),
    compactSceneField(scene.visibleAction),
    createCharacterClause(scene, _.defaultTo(options.characters, [])),
    scene.reaction && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.REACTION_TEMPLATE, { value: compactSceneField(scene.reaction) }),
    stateChange,
    createLocationClause(scene, visualBible),
    createPropClause(scene, visualBible),
    compactSceneField(scene.lighting) || IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LIGHTING,
    createCompositionClause(scene),
    createStyleClause(options),
    continuity && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CONTINUITY_TEMPLATE, { value: continuity }),
    masterSuffix,
    ...createConstraintClauses(scene),
  ]);
  return appendImagePromptAspectRatio(
    sanitizeImagePrompt(removeConflictingStyleTerms(
      _.join(clauses, IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR),
      Boolean(options.referenceLocked || visualBible?.styleReferenceLocked),
    )),
    options.aspectRatio,
  );
};

export const compileStoryboardPrompts = (
  scenes: StoryboardScene[],
  options: ImagePromptCompilerOptions = {},
): StoryboardScene[] => _.map(scenes, scene => ({
  ...scene,
  prompt: compileImagePrompt(scene, options),
}));
