import {
  SOURCE_TEMPLATE_ARCHIVALRATIONALE_MISSING,
  SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_COPIED_FROM_SCRIPT,
  SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_MISSING,
  SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_MUST_BE_ENGLISH,
  SOURCE_TEMPLATE_MISSING,
  SOURCE_TEMPLATE_MUST_BE_ENGLISH,
  SOURCE_TEMPLATE_VISIBLEACTION_COPIED_FROM_SCRIPT,
  SOURCE_TEMPLATE_VISIBLEACTION_NO_OBSERVABLE_PHYSICAL_VERB,
  SOURCE_TEXT_ACTIONENDSTATE,
  SOURCE_TEXT_ACTIONSTARTSTATE,
  SOURCE_TEXT_ARCHIVAL,
  SOURCE_TEXT_BACKGROUND,
  SOURCE_TEXT_CALLBACKID,
  SOURCE_TEXT_CHAPTERID,
  SOURCE_TEXT_CHARACTERBLOCKING,
  SOURCE_TEXT_CHARACTERIDS,
  SOURCE_TEXT_CHARACTERSTAGE,
  SOURCE_TEXT_CHARACTERSTATEAFTER,
  SOURCE_TEXT_CHARACTERSTATEBEFORE,
  SOURCE_TEXT_CINEMATICBEATS,
  SOURCE_TEXT_COLORMODE,
  SOURCE_TEXT_COLORPALETTE,
  SOURCE_TEXT_COMPOSITION,
  SOURCE_TEXT_DIALOGUEMODE,
  SOURCE_TEXT_EXPECTEDSUBJECTCOUNT,
  SOURCE_TEXT_EYELINEDIRECTION,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_INTROTITLE,
  SOURCE_TEXT_ISFILMINTRO,
  SOURCE_TEXT_LANDSCAPESPECS,
  SOURCE_TEXT_LIGHTINGMOOD,
  SOURCE_TEXT_LIPSYNCREQUIRED,
  SOURCE_TEXT_LOCATIONID,
  SOURCE_TEXT_LOCATIONSTATE,
  SOURCE_TEXT_NARRATIVEBEATID,
  SOURCE_TEXT_NARRATIVEROLE,
  SOURCE_TEXT_NEGATIVESTYLEPROMPT,
  SOURCE_TEXT_PROPIDS,
  SOURCE_TEXT_PROPSTATE,
  SOURCE_TEXT_REACTION,
  SOURCE_TEXT_SCREENDIRECTION,
  SOURCE_TEXT_SCRIPT,
  SOURCE_TEXT_SEQUENCEID,
  SOURCE_TEXT_SHADING,
  SOURCE_TEXT_SHOTID,
  SOURCE_TEXT_SHOTROLE,
  SOURCE_TEXT_SOUNDDESIGNCUES,
  SOURCE_TEXT_SPEAKERCHARACTERID,
  SOURCE_TEXT_SPOKENDIALOGUE,
  SOURCE_TEXT_STORYCHANGE,
  SOURCE_TEXT_STORYEVIDENCE,
  SOURCE_TEXT_STORYQUESTION,
  SOURCE_TEXT_SUBTITLE,
  SOURCE_TEXT_TEXTPOLICY,
  SOURCE_TEXT_VISIBLEACTION,
  SOURCE_TEXT_VISUALHOOK,
  SOURCE_TEXT_VISUALINTENT,
  SOURCE_TEXT_VISUALSTYLE,
  SOURCE_TEXT_WARDROBESTATE,
} from "../constants/sourceText";
import _ from "lodash";
import { IMAGE_PROMPT_COMPILER_CONFIG } from "../constants/config";
import { DETECTOR_VIETNAMESE_REGEX } from "../constants/regexes";
import { CharacterConfig, StoryboardScene, VisualBible } from "../types";
const PHYSICAL_ACTION_PATTERN =
  /\b(?:walks?|steps?|sits?|stands?|turns?|reaches?|opens?|closes?|places?|picks?|sets?|holds?|puts?|counts?|sorts?|reads?|checks?|reviews?|types?|writes?|calls?|speaks?|asks?|answers?|hands?|receives?|pays?|hides?|removes?|packs?|leaves?|enters?|exits?|looks?|watches?|waits?|leans?|covers?|wipes?|pushes?|pulls?|carries?|drops?|tears?|folds?|points?|gestures?|shakes?|nods?|runs?|stops?|scrolls?|taps?|locks?|unlocks?|sends?|shows?|faces?|moves?|crosses?|lifts?|raises?|lowers?|strikes?|hits?|swings?|fires?|shoots?|dodges?|falls?|kneels?|rises?|grabs?|releases?|throws?|catches?|breaks?|shatters?|cracks?|collapses?|explodes?|burns?|glows?|flashes?|swirls?|billows?|rolls?|spreads?|envelops?|obscures?|blocks?|reveals?|emerges?|appears?|disappears?|pours?|flows?|splashes?|ripples?|trembles?|vibrates?|bends?|circles?|advances?|retreats?|follows?|chases?|attacks?|deflects?|struggles?|winces?|smiles?|frowns?)\b/i;
const normalizePlanningText = (value: unknown): string => _.join(_.words(_.deburr(_.toLower(_.toString(value)))), " ");
const hasObservablePhysicalAction = (value: unknown): boolean => PHYSICAL_ACTION_PATTERN.test(_.toString(value));
export const getVisualShotPlanIssues = (source: Partial<StoryboardScene>, baseScene: StoryboardScene): string[] => {
  const issues: string[] = [];
  const requiredFields: Array<keyof Pick<StoryboardScene, "visualIntent" | "visibleAction" | "reaction" | "storyEvidence" | "visualHook" | "composition">> = [SOURCE_TEXT_VISUALINTENT, SOURCE_TEXT_VISIBLEACTION, SOURCE_TEXT_REACTION, SOURCE_TEXT_STORYEVIDENCE, SOURCE_TEXT_VISUALHOOK, SOURCE_TEXT_COMPOSITION];
  _.forEach(requiredFields, (field) => {
    const value = _.trim(_.toString(source[field]));
    if (_.isEmpty(value)) issues.push(SOURCE_TEMPLATE_MISSING(`${baseScene.id}`, `${field}`));
    else if (DETECTOR_VIETNAMESE_REGEX.test(value)) issues.push(SOURCE_TEMPLATE_MUST_BE_ENGLISH(`${baseScene.id}`, `${field}`));
  });
  const action = _.trim(_.toString(source.visibleAction));
  const normalizedAction = normalizePlanningText(action);
  const normalizedScript = normalizePlanningText(baseScene.script || baseScene.subtitle);
  if (!_.isEmpty(normalizedAction) && _.isEqual(normalizedAction, normalizedScript)) {
    issues.push(SOURCE_TEMPLATE_VISIBLEACTION_COPIED_FROM_SCRIPT(`${baseScene.id}`));
  }
  if (!_.isEmpty(action) && !hasObservablePhysicalAction(action)) {
    issues.push(SOURCE_TEMPLATE_VISIBLEACTION_NO_OBSERVABLE_PHYSICAL_VERB(`${baseScene.id}`));
  }
  if (_.isEqual(source.assetStrategy, SOURCE_TEXT_ARCHIVAL)) {
    const query = _.trim(_.toString(source.archivalSearchQuery));
    const normalizedQuery = normalizePlanningText(query);
    if (_.isEmpty(query)) issues.push(SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_MISSING(`${baseScene.id}`));
    else if (DETECTOR_VIETNAMESE_REGEX.test(query)) issues.push(SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_MUST_BE_ENGLISH(`${baseScene.id}`));
    else if (_.isEqual(normalizedQuery, normalizedScript)) issues.push(SOURCE_TEMPLATE_ARCHIVALSEARCHQUERY_COPIED_FROM_SCRIPT(`${baseScene.id}`));
    if (_.isEmpty(_.trim(_.toString(source.archivalRationale)))) issues.push(SOURCE_TEMPLATE_ARCHIVALRATIONALE_MISSING(`${baseScene.id}`));
  }
  return _.uniq(issues);
};
const extractCharacterVisualDetails = (character: Partial<CharacterConfig>): string[] => _.uniq(_.compact([character.genderPresentation, character.ageRange, character.ethnicitySkinTone, character.bodyBuild, character.faceShape, character.eyes, character.nose, character.hair, character.silhouette, character.signatureClothing, character.colorPalette, character.accessories]));
export const createVisualCharacterCards = (characters: Array<Partial<CharacterConfig>>): Record<string, unknown>[] =>
  _.map(characters, (character) => {
    const visualDetails = extractCharacterVisualDetails(character);
    const identityLock = _.join(visualDetails, IMAGE_PROMPT_COMPILER_CONFIG.CHARACTER_SEPARATOR);
    return {
      id: character.id,
      name: character.name,
      narrativeRole: character.narrativeRole,
      description: identityLock,
      identityLock,
      usesSharedStyleCore: true,
    };
  });
export const createVisualPlanningPayload = (scenes: StoryboardScene[]): Record<string, unknown>[] =>
  _.map(scenes, (scene, index) => ({
    ..._.pick(scene, [
      SOURCE_TEXT_ID,
      SOURCE_TEXT_CHAPTERID,
      SOURCE_TEXT_SCRIPT,
      SOURCE_TEXT_SUBTITLE,
      SOURCE_TEXT_NARRATIVEROLE,
      SOURCE_TEXT_STORYQUESTION,
      SOURCE_TEXT_STORYCHANGE,
      SOURCE_TEXT_ISFILMINTRO,
      SOURCE_TEXT_INTROTITLE,
      SOURCE_TEXT_NARRATIVEBEATID,
      SOURCE_TEXT_CHARACTERSTATEBEFORE,
      SOURCE_TEXT_CHARACTERSTATEAFTER,
      SOURCE_TEXT_CALLBACKID,
      SOURCE_TEXT_CHARACTERIDS,
      SOURCE_TEXT_CHARACTERSTAGE,
      SOURCE_TEXT_LOCATIONID,
      SOURCE_TEXT_PROPIDS,
      SOURCE_TEXT_VISUALINTENT,
      SOURCE_TEXT_VISIBLEACTION,
      SOURCE_TEXT_REACTION,
      SOURCE_TEXT_STORYEVIDENCE,
      SOURCE_TEXT_VISUALHOOK,
      SOURCE_TEXT_EXPECTEDSUBJECTCOUNT,
      SOURCE_TEXT_SEQUENCEID,
      SOURCE_TEXT_SHOTID,
      SOURCE_TEXT_SHOTROLE,
      SOURCE_TEXT_DIALOGUEMODE,
      SOURCE_TEXT_SPOKENDIALOGUE,
      SOURCE_TEXT_SPEAKERCHARACTERID,
      SOURCE_TEXT_LIPSYNCREQUIRED,
      SOURCE_TEXT_CHARACTERBLOCKING,
      SOURCE_TEXT_EYELINEDIRECTION,
      SOURCE_TEXT_SCREENDIRECTION,
      SOURCE_TEXT_ACTIONSTARTSTATE,
      SOURCE_TEXT_ACTIONENDSTATE,
      SOURCE_TEXT_LOCATIONSTATE,
      SOURCE_TEXT_WARDROBESTATE,
      SOURCE_TEXT_PROPSTATE,
      SOURCE_TEXT_SOUNDDESIGNCUES,
      SOURCE_TEXT_CINEMATICBEATS,
    ]),
    previousNarration: _.toString(scenes[index - 1]?.script || scenes[index - 1]?.subtitle),
    nextNarration: _.toString(scenes[index + 1]?.script || scenes[index + 1]?.subtitle),
  }));
export const createScopedVisualBibleContext = (visualBible: VisualBible, scenes: StoryboardScene[]): Partial<VisualBible> => {
  const locationIds = new Set(_.compact(_.map(scenes, SOURCE_TEXT_LOCATIONID)));
  const propIds = new Set(_.flatMap(scenes, (scene) => scene.propIds || []));
  const locations = _.defaultTo(visualBible.locations, []);
  const props = _.defaultTo(visualBible.props, []);
  return {
    ..._.pick(visualBible, [SOURCE_TEXT_COLORPALETTE, SOURCE_TEXT_LANDSCAPESPECS, SOURCE_TEXT_LIGHTINGMOOD, SOURCE_TEXT_VISUALSTYLE, SOURCE_TEXT_BACKGROUND, SOURCE_TEXT_COLORMODE, SOURCE_TEXT_SHADING, SOURCE_TEXT_TEXTPOLICY, SOURCE_TEXT_NEGATIVESTYLEPROMPT]),
    locations: _.isEmpty(locationIds) ? locations : _.filter(locations, (location) => locationIds.has(location.id)),
    props: _.isEmpty(propIds) ? props : _.filter(props, (prop) => propIds.has(prop.id)),
  };
};
