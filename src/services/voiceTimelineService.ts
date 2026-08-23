import _ from "lodash";
import { API_ROUTES, AUTO_GENERATOR_CONSTANTS, REFACTOR_CONSTANTS, VOICE_ALIGNMENT_CONFIG } from "../constants";
import { safeSystemFetch } from "../lib/shared-utils";
import { StoryboardScene } from "../types";
import { formatTimeHelper } from "../utils/helpers";

interface VoiceAlignment {
  id: string;
  start: number;
  end: number;
  duration: number;
  audioBase64?: string;
  audioUrl?: string;
}

export interface VoiceTimelineResult {
  scenes: StoryboardScene[];
  backendAligned: boolean;
  warning?: string;
}

export interface AlignVoiceTimelineOptions {
  audioBase64: string;
  scenes: StoryboardScene[];
  projectId: string;
  projectName: string;
  signal?: AbortSignal;
}

export const clearSceneVoiceData = (scenes: StoryboardScene[]): StoryboardScene[] => _.map(
  scenes,
  scene => _.omit(scene, VOICE_ALIGNMENT_CONFIG.SCENE_VOICE_RESET_FIELDS),
) as StoryboardScene[];

// A complete narration track is the render source of truth. Keeping every
// aligned clip as base64 as well multiplies checkpoint payloads and can stall
// browser-to-server project saves after image generation.
export const removeRedundantSceneAudioBase64 = (
  scenes: StoryboardScene[],
  hasGlobalNarration: boolean,
): StoryboardScene[] => hasGlobalNarration
  ? _.map(scenes, scene => _.omit(scene, "audioBase64") as StoryboardScene)
  : scenes;

export const applyVoiceAlignments = (
  scenes: StoryboardScene[],
  alignments: VoiceAlignment[],
): StoryboardScene[] => _.map(scenes, scene => {
  const alignment = _.find(alignments, item => _.isEqual(item.id, scene.id));
  return alignment
    ? {
      ...scene,
      duration: alignment.duration,
      startTime: formatTimeHelper(alignment.start),
      endTime: formatTimeHelper(alignment.end),
      _start: alignment.start,
      _end: alignment.end,
      audioBase64: alignment.audioBase64,
      audioUrl: alignment.audioUrl,
    }
    : scene;
});

export const getVoiceTimelineDuration = (scenes: StoryboardScene[]): number => (
  _.max(_.map(scenes, scene => _.toNumber(_.get(scene, "_end", 0))))
  || _.sumBy(scenes, scene => _.toNumber(scene.duration) || 0)
);

export const decodeAudioDuration = async (audioBase64: string): Promise<number> => {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return 0;
  const encodedAudio = _.last(_.split(audioBase64, VOICE_ALIGNMENT_CONFIG.BASE64_DELIMITER)) || audioBase64;
  const binaryAudio = window.atob(encodedAudio);
  const bytes = Uint8Array.from(binaryAudio, character => character.charCodeAt(0));
  const audioContext = new AudioContextConstructor();
  try {
    const decodedAudio = await audioContext.decodeAudioData(bytes.buffer.slice(0));
    return _.toNumber(decodedAudio.duration);
  } finally {
    await audioContext.close();
  }
};

const createProportionalVoiceTimeline = (
  scenes: StoryboardScene[],
  totalDurationSeconds: number,
): StoryboardScene[] => {
  const weights = _.map(scenes, scene => (
    _.size(_.toString(scene.script || scene.subtitle).match(VOICE_ALIGNMENT_CONFIG.WORD_PATTERN))
    || _.toNumber(scene.duration)
  ));
  const totalWeight = _.sum(weights);
  if (totalWeight <= 0 || totalDurationSeconds <= 0) return scenes;
  let cursor = 0;
  return _.map(scenes, (scene, index) => {
    const isLastScene = _.isEqual(index, _.subtract(_.size(scenes), 1));
    const duration = isLastScene
      ? _.subtract(totalDurationSeconds, cursor)
      : _.multiply(totalDurationSeconds, _.divide(weights[index], totalWeight));
    const end = _.add(cursor, duration);
    const alignedScene = {
      ...scene,
      duration,
      startTime: formatTimeHelper(cursor),
      endTime: formatTimeHelper(end),
      _start: cursor,
      _end: end,
    };
    cursor = end;
    return alignedScene;
  });
};

export const alignVoiceTimeline = async ({
  audioBase64,
  scenes,
  projectId,
  projectName,
  signal,
}: AlignVoiceTimelineOptions): Promise<VoiceTimelineResult> => {
  const cleanScenes = clearSceneVoiceData(scenes);
  const response = await safeSystemFetch(API_ROUTES.PIPELINE_ALIGN_VOICE, {
    audioBase64,
    scenes: _.map(cleanScenes, scene => ({
      id: scene.id,
      script: scene.script || scene.subtitle || REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    })),
    segment: true,
    projectId,
    projectName,
  }, signal);
  if (response.success && response.data?.success && _.isArray(response.data.alignments)) {
    return {
      scenes: applyVoiceAlignments(cleanScenes, response.data.alignments),
      backendAligned: true,
    };
  }
  try {
    const audioDuration = await decodeAudioDuration(audioBase64);
    if (audioDuration >= VOICE_ALIGNMENT_CONFIG.MIN_AUDIO_DURATION_SECONDS) {
      return {
        scenes: createProportionalVoiceTimeline(cleanScenes, audioDuration),
        backendAligned: false,
        warning: _.toString(response.error || response.data?.error || VOICE_ALIGNMENT_CONFIG.BACKEND_WARNING),
      };
    }
  } catch {
    return {
      scenes: cleanScenes,
      backendAligned: false,
      warning: VOICE_ALIGNMENT_CONFIG.DURATION_WARNING,
    };
  }
  return {
    scenes: cleanScenes,
    backendAligned: false,
    warning: _.toString(response.error || response.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED),
  };
};
