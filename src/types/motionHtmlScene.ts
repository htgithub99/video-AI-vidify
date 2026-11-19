export interface MotionHtmlArtifact {
  version: 1;
  html: string;
  hash: string;
  prompt: string;
  file?: string;
  manifest?: string;
  scope?: string;
  language?: string;
  execution?: import("./motionVideo.js").MotionAiExecution;
  thumbnail?: string;
  seed: string;
  duration: number;
  attempts: number;
  spec?: number;
  gaps?: import("../lib/motionObjectCatalog.js").MotionCatalogGap[];
  engine?: number;
  render?: string;
  cast?: string;
  continuity?: string;
  status: "received" | "ready" | "rendered" | "retry_wait" | "waiting_external";
  error?: string;
  warnings?: string[];
  notes?: string[];
  fallback?: boolean;
}
export interface MotionHtmlPendingSubmission {
  prompt: string;
  initialCount: number;
  initialResponseSnapshots: { identity: string; text: string }[];
  expectedSceneIds: string[];
  completionMarker?: string;
  artifactType?: string;
  requestId?: string;
  responseSelector: string;
  busySelector: string;
  url: string;
  regenerating?: boolean;
  retryClicks?: number;
  recoveryAttempt?: number;
}
export interface MotionHtmlRequest {
  id: string;
  attempt: number;
  status: "running" | "received" | "retry_wait" | "waiting_external";
  error?: string;
  raw?: string;
  worker?: string;
  provider?: string;
  model?: string;
  submission?: { attempted: boolean; completed: boolean; abandoned?: boolean; pending?: MotionHtmlPendingSubmission };
}
export interface MotionHtmlFrameInput {
  time: number;
  progress: number;
  frame: number;
  fps: number;
  duration: number;
  width: number;
  height: number;
  mode: "preview" | "export";
  format?: "jpeg" | "png";
  quality?: number;
  subtitle?: { text: string; font: string };
  motionEnabled: boolean;
  sceneEffectsEnabled: boolean;
  cameraEnabled?: boolean;
  seed: string;
  speaking: { entityId: string; start: number; end: number }[];
  places?: string[];
  header?: boolean;
  cues?: number[];
  dip?: number;
  headerTime?: number;
  titleCard?: import("./motionVisual.js").MotionTitleCard & { t: number };
}
export interface MotionAuthoringSettings {
  version: 1;
  videoGenre: string;
  storytelling: string;
  selectedLength: string;
  selectedTargetSeconds: number;
  picturePacing: string;
  targetPictureSeconds: number;
  language: string;
  visualProportion?: string;
  requestedParts: number;
}
export interface MotionHtmlMark {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  src?: "fig";
  fn?: string;
  kind?: string;
  look?: Record<string, string | number | boolean>;
  large?: boolean;
}
export interface MotionHtmlChange {
  mean: number;
  changed: number;
  cells: number[];
  width: number;
  height: number;
}
