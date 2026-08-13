import _ from "lodash";
import { VISUAL_CONTINUITY_CONFIG } from "../constants/config";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";

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
  return _.some(VISUAL_CONTINUITY_CONFIG.PROTAGONIST_SECOND_PERSON_NAMES, name => _.includes(identity, name));
};

export const normalizeCharacterLibrary = (characters: CharacterConfig[]): CharacterConfig[] => _.map(
  _.uniqBy(_.compact(characters), character => _.toLower(_.trim(character.name))),
  (character, index) => {
    const secondPersonProtagonist = isSecondPersonProtagonist(character);
    const sourceTimelineStages = (_.isEmpty(character.timelineStages)
      ? VISUAL_CONTINUITY_CONFIG.TIMELINE_STAGES
      : character.timelineStages) as ReadonlyArray<Partial<NonNullable<CharacterConfig["timelineStages"]>[number]>>;
    return {
      ...character,
      id: _.trim(character.id) || normalizeIdentifier(character.name, VISUAL_CONTINUITY_CONFIG.CHARACTER_ID_PREFIX, index),
      name: secondPersonProtagonist ? VISUAL_CONTINUITY_CONFIG.PROTAGONIST_DEFAULT_NAME : _.trim(character.name),
      narrativeRole: secondPersonProtagonist ? VISUAL_CONTINUITY_CONFIG.PROTAGONIST_ROLE : character.narrativeRole,
      images: _.uniq(_.compact(character.images)),
      referenceViews: _.uniq(_.defaultTo(character.referenceViews, [])),
      timelineStages: _.map(sourceTimelineStages, stage => ({
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
  previousScene: _.pick(_.get(scenes, startIndex - 1), [
    "id", "characterIds", "characterStage", "locationId", "propIds", "visibleAction",
    "characterStateAfter", "shotSize", "cameraAngle", "composition", "callbackId",
  ]),
  nextScene: _.pick(_.get(scenes, startIndex + batchLength), [
    "id", "characterIds", "characterStage", "locationId", "propIds", "visibleAction",
    "characterStateBefore", "shotSize", "cameraAngle", "composition", "callbackId",
  ]),
});

export const validateVisualContinuity = (
  scenes: StoryboardScene[],
  characters: CharacterConfig[],
  visualBible?: VisualBible,
): VisualContinuityReport => {
  const recurringCharacterIds = new Set(_.flatMap(scenes, scene => scene.characterIds));
  const characterIds = new Set(_.map(characters, "id"));
  const locationIds = new Set(_.map(visualBible?.locations, "id"));
  const propIds = new Set(_.map(visualBible?.props, "id"));
  const blockingErrors = _.uniq(_.compact([
    ..._.map(_.filter([...recurringCharacterIds], id => !characterIds.has(id)), id => `unknown_character:${id}`),
    ..._.map(_.filter(scenes, scene => !_.isEmpty(scene.locationId) && !locationIds.has(scene.locationId)), scene => `unknown_location:${scene.id}`),
    ..._.flatMap(scenes, scene => _.map(_.filter(scene.propIds, id => !propIds.has(id)), id => `unknown_prop:${scene.id}:${id}`)),
    ..._.map(_.filter(characters, character => recurringCharacterIds.has(character.id) && !character.referenceApproved), character => `character_reference_required:${character.id}`),
  ]));
  return { blockingErrors, passed: _.isEmpty(blockingErrors) };
};
