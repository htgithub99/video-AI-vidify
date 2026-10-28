import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { SOURCE_TEMPLATE_SYMBOL_74, SOURCE_TEXT_FEMALE, SOURCE_TEXT_ID, SOURCE_TEXT_MALE } from "../constants/sourceText";
import _ from "lodash";
import { VISUAL_CONTINUITY_CONFIG } from "../constants/config.js";
import { EXPLICIT_FEMALE_SOURCE_PATTERN, EXPLICIT_MALE_SOURCE_PATTERN } from "../constants/regexes.js";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types.js";
export interface VisualContinuityReport {
  blockingErrors: string[];
  passed: boolean;
}
const STYLE_CONTAMINATED_CHARACTER_PATTERN = /\b(?:rendering language|visual language|graphic outlines?|flat color fills?|cel shading|deadpan|anime-influenced|dot nose|rounded facial plane|chibi|stick[- ]figure|panda|mascot|donghua|xianxia|cinematic lighting)\b/i;
export const hasStyleContaminatedCharacterLibrary = (characters?: CharacterConfig[]): boolean => _.some(_.defaultTo(characters, []), (character) => STYLE_CONTAMINATED_CHARACTER_PATTERN.test(_.join(_.compact([character.description, character.prompt, character.faceShape, character.eyes, character.nose, character.hair, character.silhouette]), RT_SHARED.SYMBOL_36A9E7)));
export const hasSourceGenderConflict = (source: string, characters?: CharacterConfig[]): boolean => {
  const hasFemaleSource = EXPLICIT_FEMALE_SOURCE_PATTERN.test(source);
  const hasMaleSource = EXPLICIT_MALE_SOURCE_PATTERN.test(source);
  if (_.isEqual(hasFemaleSource, hasMaleSource)) return false;
  const primaryGender = _.toLower(_.trim(_.toString(_.first(characters)?.genderPresentation)));
  return (hasFemaleSource && _.includes(primaryGender, SOURCE_TEXT_MALE) && !_.includes(primaryGender, SOURCE_TEXT_FEMALE)) || (hasMaleSource && _.includes(primaryGender, SOURCE_TEXT_FEMALE));
};
export const createVisualContinuityContext = (scenes: Array<Partial<StoryboardScene>>, startIndex: number, batchLength: number): Record<string, unknown> => ({ previousScene: _.pick(_.get(scenes, _.subtract(startIndex, 1)), VISUAL_CONTINUITY_CONFIG.CONTEXT_PICK_PREVIOUS_KEYS), nextScene: _.pick(_.get(scenes, _.add(startIndex, batchLength)), VISUAL_CONTINUITY_CONFIG.CONTEXT_PICK_NEXT_KEYS) });
export const validateVisualContinuity = (scenes: StoryboardScene[], characters: CharacterConfig[], visualBible?: VisualBible): VisualContinuityReport => {
  const recurringCharacterIds = new Set(_.flatMap(scenes, (scene) => scene.characterIds));
  const characterIds = new Set(_.map(characters, SOURCE_TEXT_ID));
  const locationIds = new Set(_.map(visualBible?.locations, SOURCE_TEXT_ID));
  const propIds = new Set(_.map(visualBible?.props, SOURCE_TEXT_ID));
  const blockingErrors = _.uniq(
    _.compact([
      ..._.map(
        _.filter([...recurringCharacterIds], (id) => !characterIds.has(id)),
        (id) => `${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_CHARACTER}${id}`,
      ),
      ..._.map(
        _.filter(scenes, (scene) => !_.isEmpty(scene.locationId) && !locationIds.has(scene.locationId)),
        (scene) => `${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_LOCATION}${scene.id}`,
      ),
      ..._.flatMap(scenes, (scene) =>
        _.map(
          _.filter(scene.propIds, (id) => !propIds.has(id)),
          (id) => SOURCE_TEMPLATE_SYMBOL_74(`${VISUAL_CONTINUITY_CONFIG.ERROR_PREFIXES.UNKNOWN_PROP}`, `${scene.id}`, `${id}`),
        ),
      ),
    ]),
  );
  return { blockingErrors, passed: _.isEmpty(blockingErrors) };
};
