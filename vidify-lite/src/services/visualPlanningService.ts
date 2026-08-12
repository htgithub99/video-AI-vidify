import _ from "lodash";
import { IMAGE_PROMPT_METADATA_CONFIG } from "../constants/config";
import { CharacterConfig, ShotPurpose, StoryboardScene, TextInImageMode, VisualBible } from "../types";

const CHARACTER_CARD_FIELDS = ["id", "name", "narrativeRole", "prompt", "hair", "signatureClothing", "accessories", "colorPalette", "silhouette", "timelineStages"] as const;
const SHOT_PURPOSES = Object.values(ShotPurpose);

export interface VisualPlanningOptions {
  characters?: CharacterConfig[];
  visualBible?: VisualBible;
  textMode?: TextInImageMode;
}

export const createVisualCharacterCards = (characters: Array<Partial<CharacterConfig>>): Record<string, unknown>[] => _.map(
  characters,
  character => _.pick(character, CHARACTER_CARD_FIELDS),
);

export const normalizeVisualShotPlan = (
  source: Partial<StoryboardScene>,
  baseScene: StoryboardScene,
  options: VisualPlanningOptions = {},
): StoryboardScene => {
  const shotPurpose = _.includes(SHOT_PURPOSES, source.shotPurpose as ShotPurpose)
    ? source.shotPurpose
    : ShotPurpose.Action;
  return {
    ...baseScene,
    ..._.pick(source, [
      "narrativeBeatId", "characterStage", "visualIntent", "visibleAction", "reaction",
      "characterStateBefore", "characterStateAfter", "shotSize", "cameraAngle", "composition",
      "continuityFrom", "continuityNotes", "callbackId", "lighting", "textOverlay",
      "cameraMotion", "effects", "lightingEffect", "transition",
    ]),
    shotPurpose,
    characterIds: _.uniq(_.map(_.castArray(source.characterIds), _.toString)),
    locationId: _.toString(source.locationId),
    propIds: _.uniq(_.map(_.castArray(source.propIds), _.toString)),
    expectedSubjectCount: _.isNumber(source.expectedSubjectCount)
      ? _.clamp(
        _.toInteger(source.expectedSubjectCount),
        IMAGE_PROMPT_METADATA_CONFIG.MIN_SUBJECT_COUNT,
        IMAGE_PROMPT_METADATA_CONFIG.MAX_SUBJECT_COUNT,
      )
      : undefined,
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
  scene => _.pick(scene, [
    "id", "chapterId", "script", "subtitle", "narrativeBeatId", "characterStateBefore",
    "characterStateAfter", "callbackId", "characterIds", "characterStage", "locationId", "propIds",
  ]),
);
