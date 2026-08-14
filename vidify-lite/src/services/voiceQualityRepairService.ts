import { AudioQualityReport, StoryboardScene } from "../types";
import { createAdvisoryAudioQuality } from "./audioQualityService";
import { getVoiceTimelineDuration } from "./voiceTimelineService";

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

export const assessVoiceAdvisory = ({
  audioBase64,
  audioUrl,
  provider,
  scenes,
  targetDurationSeconds,
}: VoiceQualityRepairOptions): VoiceQualityRepairResult => {
  const quality = createAdvisoryAudioQuality(
    getVoiceTimelineDuration(scenes),
    targetDurationSeconds,
  );

  return {
    audioBase64,
    audioUrl,
    provider,
    scenes,
    quality,
  };
};
