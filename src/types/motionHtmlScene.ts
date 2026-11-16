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
  // Drawn on the figure table: shown with either "Cách dựng" choice without a new drawing. Scenes without it are redrawn.
  figures?: boolean;
  // The "Cách dựng" choice the thumbnail was captured with (motionFigureRenderKey).
  render?: string;
  cast?: string;
  continuity?: string;
  status: "received" | "ready" | "rendered" | "retry_wait" | "waiting_external";
  error?: string;
  warnings?: string[];
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
  motionEnabled: boolean;
  sceneEffectsEnabled: boolean;
  cameraEnabled?: boolean;
  seed: string;
  speaking: { entityId: string; start: number; end: number }[];
  places?: string[];
  header?: boolean;
  cues?: number[];
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
  // The figure proportion the plan describes (the drawing style and the layout are applied when the video is shown).
  visualProportion?: string;
  requestedParts: number;
}
export interface MotionHtmlMark {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Recorded by the figure table (FIG.<fn> with a mark), with the figure function and kind.
  src?: "fig";
  fn?: string;
  kind?: string;
  look?: Record<string, string | number | boolean>;
  // A large building, vehicle, tree, bridge or wall (unmarked ones are recorded as ~fn:kind) for the frame-cut check.
  large?: boolean;
}
export interface MotionHtmlChange {
  mean: number;
  changed: number;
  cells: number[];
  width: number;
  height: number;
}
