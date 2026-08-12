import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
import { appendImagePromptAspectRatio, sanitizeImagePrompt } from "./imagePromptQualityService";

export interface ImagePromptCompilerOptions {
  aspectRatio?: string;
  targetStyle?: string;
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
}

const applyTemplate = (template: string, values: Record<string, string>): string => _.reduce(
  values,
  (result, value, key) => _.replace(result, `{${key}}`, value),
  template,
);

const createCharacterClause = (scene: StoryboardScene, characters: CharacterConfig[]): string => _.join(
  _.map(
    _.filter(characters, character => _.includes(scene.characterIds, character.id)),
    character => {
      const stage = _.find(character.timelineStages, { id: scene.characterStage });
      const identity = _.join(_.compact([
        character.prompt || character.description,
        stage?.outfit,
        stage?.expressionRange,
        stage?.posture,
        stage?.visibleCondition,
      ]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
      return applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_TEMPLATE, { name: character.name, identity });
    },
  ),
  IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR,
);

const createLocationClause = (scene: StoryboardScene, visualBible?: VisualBible): string => {
  const location = _.find(visualBible?.locations, { id: scene.locationId });
  if (!location) return "";
  return applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.LOCATION_TEMPLATE, {
    name: location.name,
    anchors: _.join(location.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
  });
};

const createPropClause = (scene: StoryboardScene, visualBible?: VisualBible): string => _.join(
  _.map(
    _.filter(visualBible?.props, prop => _.includes(scene.propIds, prop.id)),
    prop => applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.PROP_TEMPLATE, {
      name: prop.name,
      anchors: _.join(prop.visualAnchors, IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR),
    }),
  ),
  IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR,
);

const createConstraintClauses = (scene: StoryboardScene): string[] => {
  const subjectCount = _.toInteger(scene.expectedSubjectCount);
  return _.compact([
    subjectCount >= 0 && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.SUBJECT_COUNT_TEMPLATE, {
      count: _.toString(subjectCount),
      plural: _.isEqual(subjectCount, 1) ? "" : "s",
    }),
    _.isEqual(scene.layout, IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LAYOUT) && IMAGE_PROMPT_COMPILER_CONFIG.SINGLE_FRAME_DIRECTIVE,
    _.isEqual(scene.allowBackgroundPeople, false) && IMAGE_PROMPT_COMPILER_CONFIG.NO_EXTRA_PEOPLE_DIRECTIVE,
    _.isEqual(scene.textAllowed, false) && IMAGE_PROMPT_COMPILER_CONFIG.NO_TEXT_DIRECTIVE,
  ]) as string[];
};

export const compileImagePrompt = (
  scene: StoryboardScene,
  options: ImagePromptCompilerOptions = {},
): string => {
  const visualBible = options.visualBible;
  const style = _.join(_.compact([
    options.targetStyle,
    visualBible?.visualStyle,
    visualBible?.lineStyle,
    visualBible?.colorMode,
    visualBible?.shading,
    visualBible?.colorPalette,
  ]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
  const stateChange = _.every([scene.characterStateBefore, scene.characterStateAfter], value => !_.isEmpty(value))
    ? applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.BEFORE_AFTER_TEMPLATE, {
      before: scene.characterStateBefore!,
      after: scene.characterStateAfter!,
    })
    : "";
  const continuity = _.join(_.compact([scene.continuityFrom, scene.continuityNotes, scene.callbackId]), IMAGE_PROMPT_COMPILER_CONFIG.LIST_SEPARATOR);
  const clauses = _.compact([
    scene.visualIntent,
    scene.visibleAction,
    createCharacterClause(scene, _.defaultTo(options.characters, [])),
    scene.reaction && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.REACTION_TEMPLATE, { value: scene.reaction }),
    stateChange,
    createLocationClause(scene, visualBible),
    createPropClause(scene, visualBible),
    scene.lighting || visualBible?.lightingMood || IMAGE_PROMPT_COMPILER_CONFIG.DEFAULT_LIGHTING,
    style && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.STYLE_TEMPLATE, { value: style }),
    applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.COMPOSITION_TEMPLATE, {
      shotSize: _.toString(scene.shotSize),
      cameraAngle: _.toString(scene.cameraAngle),
      composition: _.toString(scene.composition),
    }),
    continuity && applyTemplate(IMAGE_PROMPT_COMPILER_CONFIG.CONTINUITY_TEMPLATE, { value: continuity }),
    ...createConstraintClauses(scene),
  ]);
  return appendImagePromptAspectRatio(
    sanitizeImagePrompt(_.join(clauses, IMAGE_PROMPT_COMPILER_CONFIG.CLAUSE_SEPARATOR)),
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
