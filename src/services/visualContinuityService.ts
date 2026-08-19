import _ from "lodash";
import { VISUAL_CONTINUITY_CONFIG } from "../constants/config.js";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types.js";

export interface VisualContinuityReport {
  blockingErrors: string[];
  passed: boolean;
}

const normalizeIdentifier = (value: string, prefix: string, index: number): string => {
  const normalized = _.kebabCase(value);
  return normalized ? `${prefix}${normalized}` : `${prefix}${_.add(index, 1)}`;
};

const isSecondPersonProtagonist = (character: CharacterConfig): boolean => {
  const identity = _.toLower(_.join([character.name, character.narrativeRole], " "));
  return _.some(VISUAL_CONTINUITY_CONFIG.PROTAGONIST_SECOND_PERSON_NAMES, (name) => _.includes(identity, name));
};

const getFallbackProperName = (character: CharacterConfig, index: number): string => {
  const presentation = _.toLower(_.trim(character.genderPresentation));
  const baseName = _.includes(presentation, VISUAL_CONTINUITY_CONFIG.GENDER_FEMALE_KEYWORD)
    ? VISUAL_CONTINUITY_CONFIG.FALLBACK_NAMES.FEMALE
    : _.includes(presentation, VISUAL_CONTINUITY_CONFIG.GENDER_MALE_KEYWORD)
      ? VISUAL_CONTINUITY_CONFIG.FALLBACK_NAMES.MALE
      : VISUAL_CONTINUITY_CONFIG.FALLBACK_NAMES.DEFAULT;
  return _.isEqual(index, 0) ? baseName : `${baseName} ${_.add(index, 1)}`;
};

const resolveStableCharacterName = (character: CharacterConfig, index: number): string => {
  const name = _.trim(character.name);
  return _.isEmpty(name) || VISUAL_CONTINUITY_CONFIG.GENERIC_CHARACTER_NAME_PATTERN.test(name) || isSecondPersonProtagonist(character)
    ? getFallbackProperName(character, index)
    : name;
};

export const normalizeCharacterLibrary = (characters: CharacterConfig[]): CharacterConfig[] =>
  _.map(
    _.uniqBy(_.compact(characters), (character) => _.toLower(_.trim(character.name))),
    (character, index) => {
      const secondPersonProtagonist = isSecondPersonProtagonist(character);
      const stableName = resolveStableCharacterName(character, index);
      const sourceTimelineStages = (_.isEmpty(character.timelineStages)
        ? VISUAL_CONTINUITY_CONFIG.TIMELINE_STAGES
        : character.timelineStages) as ReadonlyArray<Partial<NonNullable<CharacterConfig["timelineStages"]>[number]>>;
      return {
        ...character,
        id: _.trim(character.id) || normalizeIdentifier(stableName, VISUAL_CONTINUITY_CONFIG.CHARACTER_ID_PREFIX, index),
        name: stableName,
        narrativeRole: secondPersonProtagonist ? VISUAL_CONTINUITY_CONFIG.PROTAGONIST_ROLE : character.narrativeRole,
        images: _.uniq(_.compact(character.images)),
        timelineStages: _.map(sourceTimelineStages, (stage) => ({
          id: _.trim(stage.id) || VISUAL_CONTINUITY_CONFIG.EMPTY_STAGE_ID,
          label: _.trim(_.toString(stage.label)),
          outfit: _.trim(_.toString(stage.outfit)) || _.trim(_.toString(character.signatureClothing)),
          expressionRange: _.trim(_.toString(stage.expressionRange)),
          posture: _.trim(_.toString(stage.posture)),
          visibleCondition: _.trim(_.toString(stage.visibleCondition)),
        })),
      };
    },
  );

export const createVisualContinuityContext = (
  scenes: Array<Partial<StoryboardScene>>,
  startIndex: number,
  batchLength: number,
): Record<string, unknown> => ({
  previousScene: _.pick(_.get(scenes, _.subtract(startIndex, 1)), VISUAL_CONTINUITY_CONFIG.CONTEXT_PICK_PREVIOUS_KEYS),
  nextScene: _.pick(_.get(scenes, _.add(startIndex, batchLength)), VISUAL_CONTINUITY_CONFIG.CONTEXT_PICK_NEXT_KEYS),
});

export const validateVisualContinuity = (
  scenes: StoryboardScene[],
  characters: CharacterConfig[],
  visualBible?: VisualBible,
): VisualContinuityReport => {
  const recurringCharacterIds = new Set(_.flatMap(scenes, (scene) => scene.characterIds));
  const characterIds = new Set(_.map(characters, "id"));
  const locationIds = new Set(_.map(visualBible?.locations, "id"));
  const propIds = new Set(_.map(visualBible?.props, "id"));
  const blockingErrors = _.uniq(
    _.compact([
      ..._.map(_.filter([...recurringCharacterIds], (id) => !characterIds.has(id)), (id) => `${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_CHARACTER}${id}`),
      ..._.map(_.filter(scenes, (scene) => !_.isEmpty(scene.locationId) && !locationIds.has(scene.locationId)), (scene) => `${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_LOCATION}${scene.id}`),
      ..._.flatMap(scenes, (scene) => _.map(_.filter(scene.propIds, (id) => !propIds.has(id)), (id) => `${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_PROP}${scene.id}:${id}`)),
    ]),
  );
  return { blockingErrors, passed: _.isEmpty(blockingErrors) };
};
