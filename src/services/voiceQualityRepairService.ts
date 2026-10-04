import { AudioQualityReport, StoryboardScene } from "../types";
import { createAdvisoryAudioQuality } from "./audioQualityService";
import { decodeAudioDuration, getVoiceTimelineDuration } from "./voiceTimelineService";
export interface VoiceQualityRepairOptions {
  audioBase64: string;
  audioUrl: string;
  provider: string;
  scenes: StoryboardScene[];
  targetDurationSeconds: number;
}
export interface VoiceQualityRepairResult {
  audioBase64: string;
  audioUrl: string;
  provider: string;
  scenes: StoryboardScene[];
  quality: AudioQualityReport;
}
export const assessVoiceAdvisory = async ({ audioBase64, audioUrl, provider, scenes, targetDurationSeconds }: VoiceQualityRepairOptions): Promise<VoiceQualityRepairResult> => {
  let actualDurationSeconds = getVoiceTimelineDuration(scenes);
  if (audioBase64) {
    try {
      const decodedDuration = await decodeAudioDuration(audioBase64);
      if (decodedDuration > 0) actualDurationSeconds = decodedDuration;
    } catch {}
  }
  const quality = createAdvisoryAudioQuality(actualDurationSeconds, targetDurationSeconds);
  return { audioBase64, audioUrl, provider, scenes, quality };
};
