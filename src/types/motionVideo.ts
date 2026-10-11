export enum MotionQuality {
  DRAFT = "draft",
  STANDARD = "standard",
  HIGH = "high",
  ULTRA = "ultra",
}
export enum MotionAspect {
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16",
  SQUARE = "1:1",
  FOUR_FIVE = "4:5",
}
export enum MotionEncoderPreference {
  AUTO = "auto",
  CPU = "cpu",
  GPU = "gpu",
}
export enum MotionJobStatus {
  QUEUED = "queued",
  PREPARING = "preparing",
  RENDERING = "rendering",
  ENCODING = "encoding",
  COMPLETED = "completed",
  ERROR = "error",
  CANCELLED = "cancelled",
}
export enum MotionWorkspaceTab {
  CREATE = "create",
  RESULTS = "results",
}
export interface MotionShot { id?: string; start: number; end: number; template: string; params?: Record<string, unknown>; transition?: { type: string; duration?: number; direction?: string; }; overlays?: Record<string, unknown>[]; }
export type MotionDrawingMode = "2d" | "3d";
export interface MotionGenSpec { characterMode?: "mannequin" | "drawn"; videoDna?: MotionVideoDna; drawingMode?: MotionDrawingMode; style?: MotionGenStyle; cast?: Record<string, unknown>; locations?: Record<string, unknown>; }
export interface MotionSpec { fadeIn?: number; fadeOut?: number; title?: string; aspect?: MotionAspect | string; fps?: number; look?: string; accent?: string; letterbox?: boolean; subtitleStyle?: string; gen?: MotionGenSpec; shots: MotionShot[]; subtitles?: { start: number; end: number; text: string; }[]; duration?: number; audio?: { id?: string; volume?: number; }; }
export interface MotionRenderOptions { quality: MotionQuality; aspect: MotionAspect | string; fps?: number; encoder: MotionEncoderPreference; title?: string; audioId?: string; audioVolume?: number; sfxId?: string; sfxVolume?: number; sfx?: { cues: { t: number; kind: string; }[]; mood?: string; }; }
export interface MotionJobState { id: string; status: MotionJobStatus; progress: number; stage?: string; framesDone: number; framesTotal: number; fpsRender?: number; etaSeconds?: number; workers?: number; encoder?: string; browser?: string; error?: string; result?: MotionResultItem; startedAt: number; log: string[]; }
export interface MotionResultItem { id: string; title: string; fileName: string; videoUrl: string; aspect: string; quality: string; width: number; height: number; fps: number; durationSeconds: number; sizeBytes: number; renderSeconds: number; encoder: string; createdAt: string; }
export interface MotionStorySegment { t: number; text: string; }
export interface MotionStorySource { kind?: "brief" | "transcript" | "article"; title: string; notes?: string; fetched?: { kind: "youtube" | "page"; ok: boolean; note: string; url: string; }; cleaned?: { splitNumbers: number; soundCues: number; missingQuotes: number; }; url?: string; text: string; segments: MotionStorySegment[]; words: number; sourceSeconds: number; }
export interface MotionCastMember { key: string; name: string; role?: string; description?: string; look?: string; gender?: "male" | "female"; }
export interface MotionPlace { key: string; name: string; description: string; interior?: boolean; time?: string; }
export interface MotionChapter { id: string; title: string; summary: string; from?: number; to?: number; targetSeconds?: number; weight?: number; mustKeep?: boolean; hook?: string; keyPoints?: string[]; handoff?: string; }
export interface MotionFact { claim: string; status: "ok" | "uncertain" | "wrong"; note?: string; }
export interface MotionCreativeBlueprint {
  intent: string;
  audience: string;
  narrative: { voice: string; structure: string; pacing: string; };
  visualDna: { style: string; composition: string; camera: string; lighting: string; palette: string; materials: string; subjectHierarchy: string; };
  creativeProfile: { role: string; writingPrinciples: string[]; productionPrinciples: string[]; strengths?: string[]; };
  mustPreserve: string[];
  mustVary: string[];
  mustNotCopy: string[];
  uncertainties: string[];
  evidence: { claim: string; sourceClue: string; }[];
}
export interface MotionStoryAnalysis { title: string; logline: string; genre?: string; genre2?: string; factual?: boolean; genreReason?: string; creativeBlueprint?: MotionCreativeBlueprint; videoDna?: MotionVideoDna; sfxMood?: string; look: string; accent?: string; era?: string; chapters: MotionChapter[]; cast: MotionCastMember[]; places: MotionPlace[]; facts: MotionFact[]; }
export interface MotionBeat { id: string; chapterId: string; narration: string; visual: string; place?: string; time?: string; weather?: string; shot?: string; cast?: string[]; action?: string; label?: string; emphasis?: boolean; data?: Record<string, unknown>; duration?: number; audioFile?: string; scenePlan?: MotionScenePlan; }
export interface MotionVideoDnaSettings { length: MotionStoryLength; targetSeconds: number; language: "vi" | "en"; aspect: string; drawingMode: MotionDrawingMode; characterMode: "mannequin" | "drawn"; }
export interface MotionVideoDna extends MotionCreativeBlueprint {
  version: 1;
  sourceKey: string;
  settings: MotionVideoDnaSettings;
  characters: { design: string; proportions: string; poseLanguage: string; continuity: string[]; };
  environment: { space: string; scale: string; propRules: string; continuity: string[]; };
  cinematography: { framing: string; focus: string; movement: string; editing: string; };
  audioText: { narration: string; sound: string; subtitles: string; };
  opening: { visual: string; purpose: string; acceptance: string[]; };
  qualityChecks: string[];
  evidence: { claim: string; sourceClue: string; confidence: number; }[];
  audienceProfile?: { country: string; language: string; dialect: string; ageRange: string; suitability: string; viewingContext: string; confidence: number; };
  era?: { storyPeriod: string; productionStyle: string; };
  format?: { primary: string; secondary: string[]; factual: boolean; reason: string; };
  editDna?: { pace: string; rhythm: string; hookPlacement: string; segmentForms: string[]; visualToolkit: string[]; narratorVoice: string; soundBed: string; };
  narrativeDna?: { themes: string[]; imagery: string[]; narrativeVoice: string; vocabulary: string; callbacks: string[]; };
  influences?: { name: string; role: string; relevance: string; }[];
}
export interface MotionScenePlan { purpose: string; subject: string; before: string; after: string; composition: string; spatialRelations: string[]; requiredProps: string[]; continuity: string[]; acceptance: string[]; }
export interface MotionGenStyle { grade?: string; skin?: string; gloss?: number; palette?: string[]; notes?: string; }
export interface MotionGenPreview { file?: string; files?: string[]; issues?: string[]; score?: number; note?: string; at?: string; }
export interface MotionGenState {
  videoDna?: MotionVideoDna;
  drawingMode?: MotionDrawingMode;
  characterMode?: "mannequin" | "drawn";
  creativeSignature?: string;
  scenePlanKeys?: Record<string, string>;
  style: MotionGenStyle;
  cast: Record<string, unknown>;
  locations: Record<string, unknown>;
  locationInfo: Record<
    string,
    MotionGenPreview & { files?: string[]; }
  >;
  staging: Record<string, unknown>;
  previews: Record<string, MotionGenPreview>;
  failed: string[];
  castPreview?: string;
  updatedAt?: string;
}
export interface MotionStoryScript { title: string; language: string; beats: MotionBeat[]; gen?: MotionGenState; edit?: { reviewed: number; rewritten: number; notes: string[]; }; }
export interface MotionSeoOption { title: string; description: string; hashtags: string[]; tags: string[]; seoScore: number; }
export interface MotionThumbnail { image: string; prompt: string; optionIndex?: number; }
export interface MotionSeoPack { options: MotionSeoOption[]; chapters: { id: string; t: number; title: string; }[]; timingFrom: "estimate" | "voice"; scriptKey: string; }
export interface MotionVoiceTrack { audioId: string; voiceId: string; durations: number[]; totalSeconds: number; }
export enum MotionStoryLength {
  FULL = "full",
  TEN = "10min",
  FIVE = "5min",
  THIRTY = "30min",
  SIXTY = "60min",
  SHORT = "short",
  ONE = "1min",
}
export enum MotionStoryJobKind {
  ANALYZE = "analyze",
  SCRIPT = "script",
  VOICE = "voice",
  SCENES = "scenes",
  SEO = "seo",
  THUMBNAIL = "thumbnail",
}
export interface MotionAiExecution { provider?: string; model?: string; mode?: string; chromeHeadless?: boolean; }
export interface MotionStoryJobState { id: string; kind: MotionStoryJobKind; status: MotionJobStatus; progress: number; stage?: string; log: string[]; error?: string; result?: unknown; startedAt: number; }
