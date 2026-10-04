export enum ShortsReframeMode {
  BLUR_BACKGROUND = "blur_background",
  CENTER_CROP = "center_crop",
  SMART_TRACKING = "smart_tracking",
}
export enum ShortsAspectRatio {
  VERTICAL_9_16 = "9:16",
  HORIZONTAL_16_9 = "16:9",
  SQUARE_1_1 = "1:1",
}
export enum ShortsDurationOption {
  AUTO = "auto",
  RANGE_15_30 = "15_30",
  RANGE_30_60 = "30_60",
  RANGE_60_90 = "60_90",
}
export enum ShortsProgressStage {
  IDLE = "idle",
  EXTRACTING_AUDIO = "extracting_audio",
  AI_ANALYZING = "ai_analyzing",
  RENDERING_CLIPS = "rendering_clips",
  COMPLETED = "completed",
  ERROR = "error",
}
export type ShortsGenerationConfig = {
  sourceVideoPath: string;
  aspectRatio: ShortsAspectRatio;
  reframeMode: ShortsReframeMode;
  clipCount: number;
  durationMode: ShortsDurationOption;
  enableSubtitles?: boolean;
};
export type HighlightClipItem = {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  title: string;
  hookReason: string;
  viralScore: number;
  outputVideoPath: string;
  videoUrl: string;
  thumbnailUrl?: string;
};
export type ShortsSourceMetadata = {
  duration: number;
  width: number;
  height: number;
  fps: number;
  formatName?: string;
  bitrate?: number;
  fileSizeBytes: number;
  fileName: string;
  filePath: string;
};
export type ShortsProgressState = {
  stage: ShortsProgressStage;
  percent: number;
  currentClipIndex?: number;
  totalClips?: number;
  message: string;
};
export type ShortsAnalysisPayload = {
  sourceMetadata: ShortsSourceMetadata;
  clips: HighlightClipItem[];
};
