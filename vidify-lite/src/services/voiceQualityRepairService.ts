import _ from "lodash";
import { AUDIO_QUALITY_CONFIG, REFACTOR_CONSTANTS } from "../constants";
import { AudioQualityReport, StoryboardScene } from "../types";
import { validateAudioQuality } from "./audioQualityService";
import { clearSceneVoiceData, getVoiceTimelineDuration } from "./voiceTimelineService";

interface GeneratedVoice {
  audioBase64: string;
  provider: string;
}

export interface VoiceQualityRepairOptions {
  audioBase64: string;
  audioUrl: string;
  provider: string;
  script: string;
  scenes: StoryboardScene[];
  targetDurationSeconds: number;
  regenerateVoice: () => Promise<GeneratedVoice>;
  alignVoice: (audioBase64: string, scenes: StoryboardScene[]) => Promise<StoryboardScene[]>;
}

export interface VoiceQualityRepairResult {
  audioBase64: string;
  audioUrl: string;
  provider: string;
  scenes: StoryboardScene[];
  quality: AudioQualityReport;
  repairAttempted: boolean;
  repaired: boolean;
  repairError?: string;
}

export const validateAndRepairVoice = async ({
  audioBase64,
  audioUrl,
  provider,
  script,
  scenes,
  targetDurationSeconds,
  regenerateVoice,
  alignVoice,
}: VoiceQualityRepairOptions): Promise<VoiceQualityRepairResult> => {
  let finalAudioBase64 = audioBase64;
  let finalAudioUrl = audioUrl;
  let finalProvider = provider;
  let finalScenes = scenes;
  let quality = await validateAudioQuality(
    finalAudioBase64,
    script,
    getVoiceTimelineDuration(finalScenes),
    targetDurationSeconds,
  );
  let repairAttempted = false;
  let repaired = false;
  let repairError: string | undefined;

  for (let attempt = 0; attempt < AUDIO_QUALITY_CONFIG.MAX_REPAIR_ATTEMPTS && !quality.passed; attempt++) {
    repairAttempted = true;
    try {
      const regeneratedVoice = await regenerateVoice();
      if (_.isEmpty(regeneratedVoice.audioBase64)) {
        throw new Error(AUDIO_QUALITY_CONFIG.GENERATED_AUDIO_REQUIRED_ERROR);
      }
      finalAudioBase64 = regeneratedVoice.audioBase64;
      finalAudioUrl = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      finalProvider = regeneratedVoice.provider || finalProvider;
      finalScenes = await alignVoice(finalAudioBase64, clearSceneVoiceData(finalScenes));
      quality = await validateAudioQuality(
        finalAudioBase64,
        script,
        getVoiceTimelineDuration(finalScenes),
        targetDurationSeconds,
        true,
      );
      repaired = true;
    } catch (error) {
      repairError = error instanceof Error ? error.message : AUDIO_QUALITY_CONFIG.REPAIR_FAILED_WARNING;
      quality = {
        ...quality,
        warnings: _.uniq([...quality.warnings, AUDIO_QUALITY_CONFIG.REPAIR_FAILED_WARNING]),
      };
    }
  }

  return {
    audioBase64: finalAudioBase64,
    audioUrl: finalAudioUrl,
    provider: finalProvider,
    scenes: finalScenes,
    quality,
    repairAttempted,
    repaired,
    repairError,
  };
};
