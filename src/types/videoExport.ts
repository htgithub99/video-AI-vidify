import { ShortsReframeMode } from "./shorts.js";
export enum VideoExportAspectRatio {
  HORIZONTAL_16_9 = "16:9",
  VERTICAL_9_16 = "9:16",
  SQUARE_1_1 = "1:1",
}
export enum VideoExportEffect {
  NONE = "none",
  ZOOM_IN = "zoom_in",
  ZOOM_OUT = "zoom_out",
  PAN_LEFT = "pan_left",
  PAN_RIGHT = "pan_right",
  PAN_UP = "pan_up",
  PAN_DOWN = "pan_down",
  KEN_BURNS = "ken_burns",
  PULSE = "pulse",
  SHAKE = "shake",
  SWING = "swing",
  ZOOM_ROTATE = "zoom_rotate",
  FLASH_WHITE = "flash_white",
  GLITCH_RGB = "glitch_rgb",
  HEART_BEAT = "heart_beat",
  DISCO_STROBE = "disco_strobe",
  VINTAGE_FILM = "vintage_film",
  DREAMY_GLOW = "dreamy_glow",
  BOUNCE_ZOOM = "bounce_zoom",
  NEON_CYBER = "neon_cyber",
  CINEMA_DRAMA = "cinema_drama",
  BLACK_WHITE = "black_white",
  RETRO_DECADES = "retro_decades",
  WHITE_NOISE = "white_noise",
  RANDOM = "random",
}
export enum VideoExportTransition {
  NONE = "none",
  FADE = "fade",
  FADE_BLACK = "fadeblack",
  DISSOLVE = "dissolve",
  SLIDE_LEFT = "slideleft",
  SLIDE_RIGHT = "slideright",
  WIPE_LEFT = "wipeleft",
  CIRCLE_OPEN = "circleopen",
  RADIAL = "radial",
  SMOOTH_LEFT = "smoothleft",
  FADE_WHITE = "fadewhite",
  BLUR = "hblur",
  FADE_GRAYS = "fadegrays",
  SLIDE_UP = "slideup",
  SLIDE_DOWN = "slidedown",
  COVER_LEFT = "coverleft",
  REVEAL_RIGHT = "revealright",
  CIRCLE_CLOSE = "circleclose",
  HORZ_OPEN = "horzopen",
  DIAG_TL = "diagtl",
  SLICE = "hlslice",
  ZOOM_IN = "zoomin",
  PIXELIZE = "pixelize",
  SQUEEZE = "squeezeh",
  WIND = "hlwind",
  DISTANCE = "distance",
  RANDOM = "random",
}
export enum VideoExportSlideMode {
  EVEN = "even",
  FIXED = "fixed",
}
export enum VideoExportResolution {
  RES_720P = "720p",
  RES_1080P = "1080p",
  RES_2K = "2k",
  RES_4K = "4k",
}
export enum VideoExportFps {
  FPS_24 = 24,
  FPS_30 = 30,
  FPS_60 = 60,
}
export enum VideoExportBitrate {
  STANDARD = "standard",
  HIGH = "high",
}
export enum VideoExportCodec {
  H264 = "h264",
  HEVC = "hevc",
}
export enum VideoExportJobStatus {
  IDLE = "idle",
  RENDERING = "rendering",
  COMPLETED = "completed",
  ERROR = "error",
  CANCELLED = "cancelled",
}
export enum VideoExportJobStage {
  PREPARING = "preparing",
  AUDIO = "audio",
  SEGMENTS = "segments",
  MERGING = "merging",
  DONE = "done",
}
export enum VideoExportCancelTarget {
  RENDER = "render",
  PREVIEW = "preview",
}
export enum VideoExportMediaKind {
  AUDIO = "audio",
  IMAGE = "image",
}
export type VideoExportAudioItem = {
  id: string;
  index: number;
  name: string;
  relativePath: string;
  sourcePath: string;
  url: string;
  sizeBytes: number;
  durationSeconds: number;
  aiScore?: number;
};
export type VideoExportImageItem = {
  id: string;
  index: number;
  name: string;
  relativePath: string;
  sourcePath: string;
  url: string;
  sizeBytes: number;
};
export type VideoExportSource = {
  token: string;
  folderName: string;
  folderPath: string;
  audios: VideoExportAudioItem[];
  images: VideoExportImageItem[];
};
export type VideoExportConfig = {
  aspectRatio: VideoExportAspectRatio;
  reframeMode?: ShortsReframeMode;
  effect: VideoExportEffect;
  transition: VideoExportTransition;
  slideMode: VideoExportSlideMode;
  slideSeconds: number;
  transitionSeconds: number;
  resolution: VideoExportResolution;
  fps: VideoExportFps;
  bitrate: VideoExportBitrate;
  codec: VideoExportCodec;
};
export type VideoExportRenderRequest = VideoExportConfig & {
  token: string;
  title: string;
  audioIndexes: number[];
  imageIndexes: number[];
};
export type VideoExportResultItem = {
  id: string;
  title: string;
  fileName: string;
  outputVideoPath: string;
  videoUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  trackCount: number;
  imageCount: number;
  aspectRatio: VideoExportAspectRatio;
  createdAt: string;
};
export type VideoExportJobState = {
  jobId: string;
  status: VideoExportJobStatus;
  stage: VideoExportJobStage;
  percent: number;
  message: string;
  error?: string;
  result?: VideoExportResultItem;
};
export type VideoExportPreviewResult = {
  previewUrl: string;
  durationSeconds: number;
};
export type VideoExportMultiPreviews = Partial<Record<VideoExportAspectRatio, VideoExportPreviewResult>>;
export enum VideoExportSourceTab {
  AUDIO = "audio",
  IMAGE = "image",
}
