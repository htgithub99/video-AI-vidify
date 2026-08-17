import _ from "lodash";
import { IMAGE_GENERATION_CONTINUITY_CONFIG } from "../constants/config";
import { CharacterConfig, StoryboardScene } from "../types";

export interface ContinuityBatchItem {
  continuityKey?: string;
}

const resolvePrimaryCharacter = (
  characterIds: string[],
  characters: CharacterConfig[],
): CharacterConfig | undefined => {
  const presentCharacters = _.filter(characters, character => _.includes(characterIds, character.id));
  return _.find(presentCharacters, character => !IMAGE_GENERATION_CONTINUITY_CONFIG.SUPPORTING_ROLE_PATTERN.test(character.narrativeRole))
    || _.first(presentCharacters);
};

export const createSceneContinuityKey = (
  scene: Pick<StoryboardScene, "characterIds">,
  characters: CharacterConfig[] = [],
): string => {
  const characterIds = _.uniq(_.compact(scene.characterIds));
  if (_.isEmpty(characterIds)) return IMAGE_GENERATION_CONTINUITY_CONFIG.ENVIRONMENT_LANE;
  const primaryCharacter = resolvePrimaryCharacter(characterIds, characters);
  if (primaryCharacter && IMAGE_GENERATION_CONTINUITY_CONFIG.SUPPORTING_ROLE_PATTERN.test(primaryCharacter.narrativeRole)) {
    return IMAGE_GENERATION_CONTINUITY_CONFIG.SUPPORTING_LANE;
  }
  return `${IMAGE_GENERATION_CONTINUITY_CONFIG.CHARACTER_PREFIX}${primaryCharacter?.id || _.first(characterIds)}`;
};

export const createThumbnailContinuityKey = (): string => IMAGE_GENERATION_CONTINUITY_CONFIG.THUMBNAIL_LANE;

export const distributeItemsByContinuity = <T extends ContinuityBatchItem>(
  items: T[],
  requestedWorkerCount: number,
): T[][] => {
  const totalItems = _.size(items);
  if (totalItems === 0) return [];

  const workerCount = _.clamp(
    _.toInteger(requestedWorkerCount),
    IMAGE_GENERATION_CONTINUITY_CONFIG.MIN_WORKER_COUNT,
    _.max([totalItems, IMAGE_GENERATION_CONTINUITY_CONFIG.MIN_WORKER_COUNT])!,
  );

  const workerQueues = _.times(workerCount, () => [] as T[]);

  _.forEach(items, (item, index) => {
    const targetWorkerIndex = index % workerCount;
    workerQueues[targetWorkerIndex].push(item);
  });

  return workerQueues;
};
