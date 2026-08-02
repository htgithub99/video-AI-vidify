import _ from "lodash";
import { VideoProject, StoryboardScene, VoiceConfig } from "../types";
import { COMMON_STRINGS, ERROR_MESSAGES, REFACTOR_CONSTANTS, STORAGE_KEYS } from "../constants";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_CONFIG } from "../constants/config";
import { blobToBase64 } from "../lib/fileUtils";
import { logger } from "../utils/logger";

export interface CachedVoiceAudio {
  audioBase64: string;
  audioUrl: string;
  isCached: boolean;
}

export interface ReferenceChangeState {
  hasVisualOverrides: boolean;
  shouldRegenerateSceneAssets: boolean;
}

export const fetchCachedVoiceAudio = async (voiceConfig: VoiceConfig): Promise<CachedVoiceAudio> => {
  const audioUrl = _.get(voiceConfig, AUTO_GENERATOR_CONSTANTS.AVG_AUDIO_URL_KEY, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  let audioBase64 = _.get(voiceConfig, AUTO_GENERATOR_CONSTANTS.VOICE_CONFIG_AUDIO_BASE64_PATH, REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  if (_.isEmpty(audioBase64) && !_.isEmpty(audioUrl)) {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(ERROR_MESSAGES.FETCH_AUDIO_URL_FOR_ALIGN_ERR);
      audioBase64 = await blobToBase64(await response.blob());
    } catch (error) {
      logger.error(ERROR_MESSAGES.FETCH_AUDIO_URL_FOR_ALIGN_ERR, error);
    }
  }

  return {
    audioBase64,
    audioUrl,
    isCached: _.some([audioBase64, audioUrl], (value) => !_.isEmpty(value)),
  };
};

export interface ResolvedTargetProject {
  selectedAutoProject: VideoProject | null;
  existingTargetProject: VideoProject | null;
}

export const resolveTargetProject = (
  projects: VideoProject[],
  selectedProjectId: string | null | undefined,
  activeProject: VideoProject | null,
  projectName: string,
  scriptContent: string,
): ResolvedTargetProject => {
  const selectedProject = _.defaultTo(_.find(projects, { id: selectedProjectId }), null);
  const selectedAutoProject = selectedProject
    ? (_.endsWith(selectedProject.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)
      ? selectedProject
      : _.defaultTo(_.find(projects, (project) => {
        const parentId = _.defaultTo(selectedProject.parentId, selectedProject.id);
        return _.isEqual(project.parentId, parentId) && _.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX);
      }), selectedProject))
    : null;

  const existingTargetProject = _.defaultTo(
    selectedAutoProject,
    _.defaultTo(
      selectedProjectId ? null : activeProject,
      _.defaultTo(
        _.find(projects, (project) => !_.isEmpty(projectName) && _.isEqual(_.trim(project.name), _.trim(projectName))),
        _.defaultTo(
          _.find(projects, (project) => !_.isEmpty(scriptContent) && _.isEqual(_.trim(_.get(project, "input.content", "")), _.trim(scriptContent))),
          _.defaultTo(_.first(projects), null),
        ),
      ),
    ),
  );

  return { selectedAutoProject, existingTargetProject };
};

export const getReferenceChangeState = (
  project: VideoProject | null,
  styleImages: string[],
  thumbnailImages: string[],
  characterImages: string[],
): ReferenceChangeState => {
  const styleChanged = !_.isEqual(styleImages, _.defaultTo(project?.visualConfig?.styleReferenceImages, []));
  const thumbnailChanged = !_.isEqual(thumbnailImages, _.defaultTo(project?.visualConfig?.thumbnailReferenceImages, []));
  const characterChanged = !_.isEqual(characterImages, _.defaultTo(project?.visualConfig?.characters?.[0]?.images, []));

  return {
    hasVisualOverrides: _.some([styleChanged, thumbnailChanged, characterChanged]),
    shouldRegenerateSceneAssets: styleChanged || characterChanged,
  };
};

export const hasCompleteSceneAlignment = (scenes: StoryboardScene[]): boolean => _.every(
  scenes,
  (scene) => _.every([
    !_.isEmpty(scene.startTime),
    !_.isEmpty(scene.endTime),
    !_.isUndefined(scene.duration),
    _.some([scene.audioBase64, scene.audioUrl], (audio) => !_.isEmpty(audio)),
  ]),
);

export const applyGeneratedMediaLanguage = (prompt: string, directive: string): string => (
  _.includes(prompt, AUTO_VIDEO_PIPELINE_CONFIG.GENERATED_MEDIA_LANGUAGE_MARKER)
    ? prompt
    : _.join([prompt, directive], REFACTOR_CONSTANTS.AVG_BLANK)
);

export const calculateSceneDuration = (scenes: StoryboardScene[]): number => _.sumBy(
  scenes,
  (scene) => _.toNumber(scene.duration) || 0,
);

export const getAutoVideoConfigStorageKey = (projectId?: string | null): string => (
  projectId
    ? _.join([STORAGE_KEYS.AUTO_GENERATOR_CONFIG, projectId], REFACTOR_CONSTANTS.VD_UNDERSCORE)
    : STORAGE_KEYS.AUTO_GENERATOR_CONFIG
);
