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
  VOICES = "voices",
  LIBRARY = "library",
  RESULTS = "results",
}
export interface MotionShot { id?: string; start: number; end: number; template: string; params?: Record<string, unknown>; transition?: { type: string; duration?: number; direction?: string }; overlays?: Record<string, unknown>[]; }
export interface MotionStyleReference { name: string; dataUrl: string; }
export interface MotionStyleKit { render?: Record<string, string>; character?: Record<string, string>; animals?: string; background?: Record<string, string>; fx?: string; typography?: string; camera?: string; }
export interface MotionReferenceImageInfo { name: string; role: "character" | "scene" | "prop" | "screen" | "style"; subjects: string[]; details?: string; }
export interface MotionReferenceStyle { description: string; palette: string[]; outlineColor?: string; outlineWidth?: number; kit?: MotionStyleKit; images?: MotionReferenceImageInfo[]; }
export type MotionDrawingMode = "2d" | "3d";
export interface MotionGenSpec { characterMotion?: boolean; characterMode?: "drawn"; videoDna?: MotionVideoDna; drawingMode?: MotionDrawingMode; style?: MotionGenStyle; cast?: Record<string, unknown>; locations?: Record<string, unknown>; }
export interface MotionHudBar { label: string; value: number; color?: string; }
export interface MotionHud { counter?: string; date?: string; label?: string; bars?: MotionHudBar[]; clear?: boolean; }
export interface MotionHudSegment { counter?: string; date?: string; label?: string; bars?: MotionHudBar[]; start: number; end: number; }
export interface MotionSpec { fadeIn?: number; fadeOut?: number; title?: string; aspect?: MotionAspect | string; fps?: number; look?: string; accent?: string; letterbox?: boolean; subtitleStyle?: string; gen?: MotionGenSpec; shots: MotionShot[]; subtitles?: { start: number; end: number; text: string }[]; hud?: MotionHudSegment[]; duration?: number; audio?: { id?: string; volume?: number }; }
export type MotionSoundLayer = "ambience" | "action" | "character" | "accent";
export interface MotionSoundEvent { id: string; kind: string; layer: MotionSoundLayer; at?: number; t?: number; anchor?: "beat" | "cut"; camera?: number; duration?: number; description?: string; source?: "visible" | "offscreen"; actor?: string; prop?: string; part?: string; assetId?: string; gainDb?: number; pan?: number; }
export interface MotionSoundCue extends MotionSoundEvent { speakerGender?: "male" | "female"; t: number; beatId: string; duration: number; loop?: boolean; position?: number[]; priority?: number; }
export interface MotionSoundOverride { muted?: boolean; assetId?: string; gainDb?: number; }
export interface MotionSoundAsset { id: string; file: string; name: string; duration: number; kinds: string[]; tags: string[]; sources: { source: string; file: string; license: string }[]; }
export interface MotionSoundSelection { cue: MotionSoundCue; asset?: Pick<MotionSoundAsset, "id" | "name" | "duration">; alternatives: Pick<MotionSoundAsset, "id" | "name" | "duration">[]; previewStart?: number; previewDuration?: number; skipped?: boolean; }
export interface MotionCompiledPreview { spec: MotionSpec; sfxCues: MotionSoundCue[]; missing: string[]; compilationKey?: string; audioPreviewId?: string; sfxId?: string; soundSelections?: MotionSoundSelection[]; }
export interface MotionRenderOptions { quality: MotionQuality; aspect: MotionAspect | string; fps?: number; encoder: MotionEncoderPreference; title?: string; audioId?: string; audioVolume?: number; sfxId?: string; sfxVolume?: number; mixedAudioId?: string; sfx?: { cues: (MotionSoundCue | { t: number; kind: string })[]; mood?: string }; }
export interface MotionJobState { id: string; status: MotionJobStatus; progress: number; stage?: string; framesDone: number; framesTotal: number; fpsRender?: number; etaSeconds?: number; workers?: number; encoder?: string; browser?: string; error?: string; result?: MotionResultItem; startedAt: number; log: string[]; }
export interface MotionResultItem { id: string; title: string; fileName: string; videoUrl: string; aspect: string; quality: string; width: number; height: number; fps: number; durationSeconds: number; sizeBytes: number; renderSeconds: number; encoder: string; createdAt: string; }
export interface MotionStorySegment { t: number; text: string; }
export interface MotionStorySource { kind?: "brief" | "transcript" | "article"; title: string; notes?: string; fetched?: { kind: "youtube" | "page"; ok: boolean; note: string; url: string }; cleaned?: { splitNumbers: number; soundCues: number; missingQuotes: number }; url?: string; text: string; segments: MotionStorySegment[]; words: number; sourceSeconds: number; }
export interface MotionCastMember { key: string; name: string; role?: string; description?: string; look?: string; gender?: "male" | "female"; reuse?: string; tags?: string[]; type?: string; colors?: Record<string, string>; variant?: number; }
export interface MotionPlace { key: string; name: string; description: string; interior?: boolean; time?: string; reuse?: string; tags?: string[]; type?: string; }
export interface MotionChapter { id: string; title: string; summary: string; from?: number; to?: number; targetSeconds?: number; weight?: number; mustKeep?: boolean; hook?: string; keyPoints?: string[]; handoff?: string; }
export interface MotionFact { claim: string; status: "ok" | "uncertain" | "wrong"; note?: string; }
export interface MotionCreativeBlueprint {
  intent: string;
  audience: string;
  narrative: { voice: string; structure: string; pacing: string };
  visualDna: { style: string; composition: string; camera: string; lighting: string; palette: string; materials: string; subjectHierarchy: string };
  creativeProfile: { role: string; writingPrinciples: string[]; productionPrinciples: string[]; strengths?: string[] };
  mustPreserve: string[];
  mustVary: string[];
  mustNotCopy: string[];
  uncertainties: string[];
  evidence: { claim: string; sourceClue: string }[];
}
export interface MotionStoryAnalysis {
  characterMotion?: boolean;
  referenceStyle?: MotionReferenceStyle;
  title: string;
  logline: string;
  genre?: string;
  videoGenre?: string;
  genre2?: string;
  factual?: boolean;
  genreReason?: string;
  creativeBlueprint?: MotionCreativeBlueprint;
  videoDna?: MotionVideoDna;
  sfxMood?: string;
  look: string;
  accent?: string;
  era?: string;
  chapters: MotionChapter[];
  cast: MotionCastMember[];
  places: MotionPlace[];
  facts: MotionFact[];
}
export interface MotionBeat { utterances?: MotionUtterance[]; id: string; chapterId: string; narration: string; visual: string; place?: string; time?: string; weather?: string; shot?: string; cast?: string[]; action?: string; label?: string; emphasis?: boolean; data?: Record<string, unknown>; duration?: number; audioFile?: string; scenePlan?: MotionScenePlan; hud?: MotionHud; }
export interface MotionVideoDnaSettings { length: MotionStoryLength; targetSeconds: number; language: "vi" | "en"; aspect: string; drawingMode: MotionDrawingMode; characterMode: "drawn"; }
export interface MotionVideoDna extends MotionCreativeBlueprint {
  version: 1;
  sourceKey: string;
  settings: MotionVideoDnaSettings;
  characters: { design: string; proportions: string; poseLanguage: string; continuity: string[] };
  environment: { space: string; scale: string; propRules: string; continuity: string[] };
  cinematography: { framing: string; focus: string; movement: string; editing: string };
  audioText: { narration: string; sound: string; subtitles: string };
  opening: { visual: string; purpose: string; acceptance: string[] };
  qualityChecks: string[];
  evidence: { claim: string; sourceClue: string; confidence: number }[];
  audienceProfile?: { country: string; language: string; dialect: string; ageRange: string; suitability: string; viewingContext: string; confidence: number };
  era?: { storyPeriod: string; productionStyle: string };
  format?: { primary: string; secondary: string[]; factual: boolean; reason: string };
  editDna?: { pace: string; rhythm: string; hookPlacement: string; segmentForms: string[]; visualToolkit: string[]; narratorVoice: string; soundBed: string };
  narrativeDna?: { themes: string[]; imagery: string[]; narrativeVoice: string; vocabulary: string; callbacks: string[] };
  influences?: { name: string; role: string; relevance: string }[];
}
export interface MotionScenePlan { purpose: string; subject: string; before: string; after: string; composition: string; spatialRelations: string[]; requiredProps: string[]; continuity: string[]; acceptance: string[]; }
export interface MotionCharacterTransform { pos?: number[]; rot?: number[]; scale?: number[]; }
export interface MotionCharacterDesign {
  materials?: Record<string, unknown>;
  parts: (MotionCharacterTransform & { id: string; parent?: string; nodes: Record<string, unknown>[] })[];
  anchors?: Record<string, string>;
  poses?: Record<string, Record<string, MotionCharacterTransform>>;
  motions?: Record<string, { duration: number; loop?: boolean; events?: MotionSoundEvent[]; tracks: { part: string; keys: (MotionCharacterTransform & { t: number })[] }[] }>;
}
export interface MotionGenStyle { outlineColor?: string; outlineWidth?: number; grade?: string; palette?: string[]; notes?: string; outlineSilhouette?: boolean; faceShading?: boolean; }
export interface MotionGenPreview { file?: string; files?: string[]; issues?: string[]; score?: number; note?: string; at?: string; }
export interface MotionGenState {
  soundDirectionKey?: string;
  soundPlanVersion?: number;
  characterMotion?: boolean;
  referenceKey?: string;
  videoDna?: MotionVideoDna;
  drawingMode?: MotionDrawingMode;
  characterMode?: "drawn";
  creativeSignature?: string;
  scenePlanKeys?: Record<string, string>;
  style: MotionGenStyle;
  cast: Record<string, unknown>;
  locations: Record<string, unknown>;
  locationInfo: Record<string, MotionGenPreview & { files?: string[] }>;
  staging: Record<string, unknown>;
  previews: Record<string, MotionGenPreview>;
  failed: string[];
  castPreview?: string;
  updatedAt?: string;
  assetStyleKey?: string;
  assetSources?: Record<string, string>;
}
export interface MotionStoryScript { voiceTrack?: MotionVoiceTrack; voiceSettings?: MotionVoiceSettings; voiceChannel?: string; title: string; language: string; beats: MotionBeat[]; gen?: MotionGenState; edit?: { reviewed: number; rewritten: number; notes: string[] }; }
export interface MotionSeoOption { title: string; description: string; hashtags: string[]; tags: string[]; seoScore: number; }
export interface MotionThumbnail { image: string; prompt: string; optionIndex?: number; }
export interface MotionSeoPack { options: MotionSeoOption[]; chapters: { id: string; t: number; title: string }[]; timingFrom: "estimate" | "voice"; scriptKey: string; }
export interface MotionVoiceTrack { provider?: "vieneu"; signature?: string; plan?: MotionVoicePlan; clips?: MotionVoiceClip[]; subtitles?: { start: number; end: number; text: string; speaker?: string }[]; audioId: string; voiceId: string; durations: number[]; totalSeconds: number; }
export interface MotionUtterance { id: string; speaker: string; role: "narration" | "dialogue" | "thought" | "offscreen"; text: string; emotion: "neutral" | "warm" | "serious" | "tense" | "surprised" | "sad" | "excited"; speed: number; pauseBefore: number; pauseAfter: number; emphasis: string[]; }
export interface MotionVoiceSettings { voices?: Record<string, string>; utterances?: Record<string, MotionUtterance[]>; }
export interface MotionVoicePreset { id: string; name: string; gender?: string; description?: string; age?: string; custom?: boolean; source?: string; language?: string; }
export type MotionVoiceGroup = "male_adult" | "female_adult" | "child" | "senior_male" | "senior_female";
export interface MotionVoiceChannel { id: string; name: string; narratorVoiceId: string; roleVoices?: Partial<Record<MotionVoiceGroup, string>>; updatedAt: number; }
export interface MotionVoiceChannels { channels: MotionVoiceChannel[]; defaultId?: string; }
export interface MotionVoicePlan { direction?: MotionAudioDirection; version: number; signature: string; roles: { speaker: string; name: string; voiceId: string; gender?: string; age?: string; locked?: boolean }[]; beats: { id: string; utterances: MotionUtterance[] }[]; }
export interface MotionAudioDirection { mode: "film" | "storytelling" | "documentary" | "explainer" | "mixed"; factual: boolean; narrationStyle: string; soundStyle: string; dialect: string; }
export interface MotionVoiceClip { id: string; beatId: string; speaker: string; voiceId: string; text: string; audioId: string; start: number; end: number; }
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
  LIBRARY = "library",
}
export interface MotionAiExecution { provider?: string; model?: string; mode?: string; chromeHeadless?: boolean; }
export interface MotionStoryJobState { id: string; kind: MotionStoryJobKind; status: MotionJobStatus; progress: number; stage?: string; log: string[]; error?: string; result?: unknown; startedAt: number; }
export type MotionSceneAssetKind = "location" | "character" | "prop";
export interface MotionSceneAsset { id: string; kind: MotionSceneAssetKind; styleKey: string; type?: string; name: string; description: string; tags: string[]; time?: string; interior?: boolean; gender?: string; role?: string; motion?: boolean; size?: number[]; from?: string; thumb?: boolean; uses: number; createdAt: number; usedAt?: number; }
export interface MotionSceneStyleSet { key: string; name: string; drawingMode: MotionDrawingMode; images: string[]; referenceStyle?: MotionReferenceStyle; genStyle?: MotionGenStyle; createdAt: number; usedAt?: number; }
export interface MotionSceneLibraryList { items: MotionSceneAsset[]; styles: MotionSceneStyleSet[]; base?: { characters: number; locations: number; props: number }; pending?: Partial<Record<MotionDrawingMode, number>>; }
export interface MotionSceneCustomItem { group: string; type: string; name: string; description: string; time?: string; interior?: boolean; gender?: "male" | "female"; }
