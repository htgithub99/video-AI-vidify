import type { MotionStyleFinish } from "../constants/motionStyleFinish.js";
import type { MotionCostume } from "../constants/motionCostume.js";
import type { MotionTraits } from "../constants/motionSceneTraits.js";
export interface MotionMusicSegment { start: number; mood: string; }
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
export interface MotionStyleShotMix { wide: number; medium: number; close: number; }
export interface MotionStyleMetrics { headAspect?: number; bodyToHead?: number; bodyWidth?: number; bodyShape?: "dome" | "capsule" | "box" | "trapezoid"; eyeHeight?: number; eyeWidth?: number; eyeGap?: number; eyeY?: number; mouthHeight?: number; mouthWidth?: number; mouthY?: number; armThickness?: number; armLength?: number; outlinePx?: number; horizon?: number; groundView?: "front" | "tilted"; groundTilt?: number; wideFigure?: number; shotMix?: MotionStyleShotMix; calibrated?: boolean; }
export interface MotionReferenceStyle { description: string; palette: string[]; outlineColor?: string; outlineWidth?: number; kit?: MotionStyleKit; images?: MotionReferenceImageInfo[]; metrics?: MotionStyleMetrics; }
export type MotionDrawingMode = "2d" | "3d";
export interface MotionGenSpec { board2d?: MotionBoard2dSpec; characterMotion?: boolean; characterMode?: "drawn"; videoDna?: MotionVideoDna; drawingMode?: MotionDrawingMode; style?: MotionGenStyle; cast?: Record<string, unknown>; locations?: Record<string, unknown>; }
export interface MotionHudBar { label: string; value: number; color?: string; }
export interface MotionHud { counter?: string; date?: string; label?: string; bars?: MotionHudBar[]; clear?: boolean; }
export interface MotionHudSegment { counter?: string; date?: string; label?: string; bars?: MotionHudBar[]; start: number; end: number; }
export interface MotionSpec {
  fxCues?: { t: number; kind: string }[];
  fadeIn?: number;
  fadeOut?: number;
  title?: string;
  aspect?: MotionAspect | string;
  fps?: number;
  look?: string;
  accent?: string;
  letterbox?: boolean;
  subtitleStyle?: string;
  gen?: MotionGenSpec;
  shots: MotionShot[];
  subtitles?: { start: number; end: number; text: string; speaker?: string; dialogue?: boolean }[];
  hud?: MotionHudSegment[];
  music?: { mood: string; cues: number[]; segments?: MotionMusicSegment[]; instrument?: string; ambience?: string };
  finish?: MotionStyleFinish;
  duration?: number;
  audio?: { id?: string; volume?: number };
}
export type MotionSoundLayer = "ambience" | "action" | "character" | "accent";
export interface MotionSoundGenrePalette { bed?: { kind: string; gainDb: number; always: boolean }; suppress?: string[]; accents?: { kind: string; layer: MotionSoundLayer; pattern: RegExp; moods?: { mood: string; min: number }[]; description: string; gainDb: number; gap: number; at: number | "word" }[]; chapter?: { kind: string; layer: MotionSoundLayer; gainDb: number; description: string }; }
export interface MotionSoundEvent { id: string; kind: string; layer: MotionSoundLayer; at?: number; t?: number; anchor?: "beat" | "cut"; camera?: number; utterance?: string; edge?: "start" | "end"; duration?: number; description?: string; source?: "visible" | "offscreen"; actor?: string; prop?: string; part?: string; assetId?: string; gainDb?: number; pan?: number; }
export interface MotionSoundCue extends MotionSoundEvent { speakerGender?: "male" | "female"; t: number; beatId: string; duration: number; loop?: boolean; position?: number[]; priority?: number; }
export interface MotionSoundOverride { muted?: boolean; assetId?: string; gainDb?: number; }
export interface MotionSoundAsset { id: string; file: string; name: string; duration: number; kinds: string[]; tags: string[]; sources: { source: string; file: string; license: string }[]; }
export interface MotionSoundSelection { cue: MotionSoundCue; asset?: Pick<MotionSoundAsset, "id" | "name" | "duration">; alternatives: Pick<MotionSoundAsset, "id" | "name" | "duration">[]; previewStart?: number; previewDuration?: number; skipped?: boolean; }
export interface MotionCompiledPreview { spec: MotionSpec; sfxCues: MotionSoundCue[]; missing: string[]; compilationKey?: string; audioPreviewId?: string; sfxId?: string; soundSelections?: MotionSoundSelection[]; }
export interface MotionRenderOptions { quality: MotionQuality; aspect: MotionAspect | string; fps?: number; encoder: MotionEncoderPreference; title?: string; audioId?: string; audioVolume?: number; sfxId?: string; sfxVolume?: number; mixedAudioId?: string; sfx?: { cues: (MotionSoundCue | { t: number; kind: string })[]; mood?: string }; music?: { mood: string; volume: number }; }
export interface MotionJobState { id: string; status: MotionJobStatus; progress: number; stage?: string; framesDone: number; framesTotal: number; fpsRender?: number; etaSeconds?: number; workers?: number; encoder?: string; browser?: string; error?: string; result?: MotionResultItem; startedAt: number; log: string[]; }
export interface MotionResultItem { id: string; title: string; fileName: string; videoUrl: string; aspect: string; quality: string; width: number; height: number; fps: number; durationSeconds: number; sizeBytes: number; renderSeconds: number; encoder: string; createdAt: string; }
export interface MotionStorySegment { t: number; text: string; }
export interface MotionStorySource { kind?: "brief" | "transcript" | "article"; title: string; notes?: string; fetched?: { kind: "youtube" | "page"; ok: boolean; note: string; url: string }; cleaned?: { splitNumbers: number; soundCues: number; missingQuotes: number }; url?: string; text: string; segments: MotionStorySegment[]; words: number; sourceSeconds: number; }
export interface MotionCastMember { key: string; name: string; alias?: string; role?: string; description?: string; look?: string; gender?: "male" | "female"; age?: "child" | "adult" | "senior"; narrator?: boolean; reuse?: string; tags?: string[]; type?: string; colors?: Record<string, string>; variant?: number; costume?: MotionCostume; traits?: MotionTraits; }
export interface MotionPlace { key: string; name: string; description: string; interior?: boolean; time?: string; reuse?: string; tags?: string[]; type?: string; traits?: MotionTraits; redress?: boolean; }
export interface MotionChapter { id: string; title: string; summary: string; from?: number; to?: number; targetSeconds?: number; weight?: number; mustKeep?: boolean; hook?: string; keyPoints?: string[]; handoff?: string; musicMood?: string; }
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
  stylePreset?: string;
  musicMood?: string;
  libraryMode?: string;
  genre2?: string;
  factual?: boolean;
  genreReason?: string;
  creativeBlueprint?: MotionCreativeBlueprint;
  videoDna?: MotionVideoDna;
  sfxMood?: string;
  look: string;
  accent?: string;
  era?: string;
  series?: MotionSeriesInfo;
  chapters: MotionChapter[];
  cast: MotionCastMember[];
  places: MotionPlace[];
  facts: MotionFact[];
}
export interface MotionSceneMood { mood: MotionUtterance["emotion"]; intensity: number; }
export interface MotionVoiceDelivery { mood: MotionUtterance["emotion"]; strength: number; temperature: number; silence: number; tempo: number; pause: number; gain: number; }
export interface MotionBeat {
  sceneMood?: MotionSceneMood;
  utterances?: MotionUtterance[];
  placeName?: string;
  id: string;
  chapterId: string;
  narration: string;
  visual: string;
  place?: string;
  time?: string;
  weather?: string;
  shot?: string;
  cast?: string[];
  action?: string;
  label?: string;
  emphasis?: boolean;
  data?: Record<string, unknown>;
  duration?: number;
  audioFile?: string;
  scenePlan?: MotionScenePlan;
  hud?: MotionHud;
}
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
export interface MotionFlatCamera { pitch: number; wideFigure?: number; horizon?: number; }
export interface MotionGenStyle { metrics?: MotionStyleMetrics; outlineColor?: string; outlineWidth?: number; grade?: string; palette?: string[]; notes?: string; outlineSilhouette?: boolean; faceShading?: boolean; framing?: string; flatCamera?: MotionFlatCamera; }
export interface MotionGenPreview { file?: string; files?: string[]; issues?: string[]; score?: number; note?: string; at?: string; }
export interface MotionBoard2dObject { key: string; color?: string | null; count?: number; state?: string | null; }
export interface MotionBoard2dActor { cast: string; pose: string; expression?: string; face?: string; wear?: string | null; hold?: string | null; small?: boolean; }
export interface MotionBoard2dItem { key: string; x: number; y: number; scale: number; }
export interface MotionBoard2dDetail { text: string; key: string; as: string; who?: string | null; }
export interface MotionBoard2dSentence { mode: "people" | "vignette" | "cutaway" | "place"; place?: string | null; placeDesc?: string | null; details?: MotionBoard2dDetail[]; fixed?: number; kind?: string | null; subject?: string | null; target?: string | null; objects: MotionBoard2dObject[]; actors: MotionBoard2dActor[]; camera?: string; light?: string | null; items?: MotionBoard2dItem[]; text?: string; redo?: boolean; }
export interface MotionBoard2dProp { svg: string; grip: number[]; base: number[]; height: number; }
export interface MotionBoard2dSet { svg: string; code?: string; time?: string; floorY: number; marks: number[][]; lights: { x: number; y: number; color: string; kind: string }[]; }
export interface MotionCast2d { skin: string; top: string; bottom?: string | null; shoes?: string | null; hair?: string | null; hairKind?: string | null; beard?: string | null; hat?: string | null; hatKind?: string | null; glasses?: boolean; scarf?: string | null; skirt?: boolean; buttons?: boolean; eye?: string; legs?: boolean; arms?: boolean; animal?: boolean; species?: string | null; brows?: boolean; height: number; template?: boolean; ghost?: boolean; }
export interface MotionBoard2dSheetItem { t: number; text: string; file: string; }
export interface MotionBoard2dReport { sentences: number; fallback: number; sets: number; codeSets: string[]; cast: number; }
export interface MotionBoard2d { version: number; styleKey: string; sentences: Record<string, MotionBoard2dSentence>; props: string[]; sets: Record<string, string>; codeSets?: Record<string, string>; cast?: Record<string, MotionCast2d>; sheet?: MotionBoard2dSheetItem[]; report?: MotionBoard2dReport; }
export interface MotionBoard2dSpec { sentences: Record<string, MotionBoard2dSentence>; props: Record<string, MotionBoard2dProp>; sets: Record<string, MotionBoard2dSet>; }
export interface MotionGenState {
  board2d?: MotionBoard2d;
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
  voiceCast?: Record<string, string>;
}
export interface MotionSeriesInfo { index: number; count: number; previous?: string; next?: string; }
export interface MotionSeriesPart { index: number; chapterIds: string[]; seconds: number; }
export interface MotionSeriesRecord { index: number; title: string; videoUrl?: string; fileName?: string; }
export interface MotionSeriesState { analysis: MotionStoryAnalysis; parts: MotionSeriesPart[]; index: number; done: MotionSeriesRecord[]; carryGen?: Partial<MotionGenState>; }
export interface MotionStoryScript { voiceTrack?: MotionVoiceTrack; voiceSettings?: MotionVoiceSettings; voiceChannel?: string; title: string; language: string; beats: MotionBeat[]; gen?: MotionGenState; edit?: { reviewed: number; rewritten: number; notes: string[] }; }
export interface MotionSeoOption { title: string; description: string; hashtags: string[]; tags: string[]; seoScore: number; }
export interface MotionThumbnail { image: string; prompt: string; optionIndex?: number; }
export interface MotionSeoPack { options: MotionSeoOption[]; chapters: { id: string; t: number; title: string }[]; timingFrom: "estimate" | "voice"; scriptKey: string; }
export interface MotionVoiceTrack { provider?: "vieneu"; signature?: string; plan?: MotionVoicePlan; clips?: MotionVoiceClip[]; subtitles?: { start: number; end: number; text: string; speaker?: string }[]; audioId: string; voiceId: string; durations: number[]; totalSeconds: number; }
export interface MotionUtterance { id: string; speaker: string; role: "narration" | "dialogue" | "thought" | "offscreen"; text: string; emotion: "neutral" | "warm" | "serious" | "tense" | "surprised" | "sad" | "excited" | "scared" | "angry"; intensity?: number; speed: number; pauseBefore: number; pauseAfter: number; emphasis: string[]; }
export interface MotionVoiceSettings { voices?: Record<string, string>; utterances?: Record<string, MotionUtterance[]>; }
export interface MotionVoicePreset { id: string; name: string; gender?: string; description?: string; age?: string; custom?: boolean; source?: string; language?: string; speed?: number; }
export interface MotionVoiceSpeedTarget { rate: number; url: string; title: string; window?: number; pauses?: { clause?: number; sentence: number; suspense: number; beat: number; articulation: number }; source?: "captions" | "audio"; phrase?: number; speechRatio?: number; at: number; }
export interface MotionVoiceSpeedSettings { target?: MotionVoiceSpeedTarget; correction: number; rates: Record<string, number>; }
export type MotionVoiceGroup = "male_adult" | "female_adult" | "child" | "senior_male" | "senior_female";
export interface MotionVoiceChannel { id: string; name: string; narratorVoiceId: string; roleVoices?: Partial<Record<MotionVoiceGroup, string>>; updatedAt: number; }
export interface MotionVoiceChannels { channels: MotionVoiceChannel[]; defaultId?: string; }
export interface MotionVoiceTiming { signature: string; beats: Record<string, { duration: number; lines: { id: string; speaker: string; text: string; from: number; to: number }[] }>; }
export interface MotionVoicePlan { direction?: MotionAudioDirection; version: number; signature: string; roles: { speaker: string; name: string; voiceId: string; gender?: string; age?: string; locked?: boolean }[]; beats: { id: string; utterances: MotionUtterance[] }[]; }
export interface MotionAudioDirection { mode: "film" | "storytelling" | "documentary" | "explainer" | "mixed"; factual: boolean; narrationStyle: string; soundStyle: string; dialect: string; }
export interface MotionVoiceClip { id: string; beatId: string; speaker: string; voiceId: string; text: string; audioId: string; start: number; end: number; words?: [number, number][]; delivery?: MotionVoiceDelivery; }
export enum MotionStoryLength {
  FULL = "full",
  TEN = "10min",
  FIVE = "5min",
  FIFTEEN = "15min",
  TWENTY = "20min",
  THIRTY = "30min",
  FORTY = "40min",
  FIFTY = "50min",
  SIXTY = "60min",
  SEVENTY_FIVE = "75min",
  NINETY = "90min",
  ONE_HUNDRED_FIVE = "105min",
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
  TRAIN_VOICE = "train_voice",
}
export interface MotionLogEntry { id: string; kind: string; lines: string[]; }
export interface MotionAiExecution { provider?: string; model?: string; mode?: string; chromeHeadless?: boolean; strictProvider?: boolean; role?: string; chained?: boolean; }
export interface MotionStoryJobState { id: string; kind: MotionStoryJobKind; status: MotionJobStatus; progress: number; stage?: string; log: string[]; error?: string; result?: unknown; startedAt: number; }
export type MotionSceneAssetKind = "location" | "character" | "prop";
export interface MotionSceneAsset { id: string; kind: MotionSceneAssetKind; styleKey: string; type?: string; name: string; description: string; tags: string[]; time?: string; interior?: boolean; gender?: string; role?: string; motion?: boolean; size?: number[]; from?: string; story?: string; thumb?: boolean; fingerprint?: string; sourceFingerprint?: string; uses: number; createdAt: number; updatedAt?: number; usedAt?: number; }
export interface MotionStyleCalibration { at: number; image?: boolean; notes?: string; changes?: string[]; }
export interface MotionSceneStyleSet { key: string; name: string; drawingMode: MotionDrawingMode; images: string[]; referenceStyle?: MotionReferenceStyle; genStyle?: MotionGenStyle; calibration?: MotionStyleCalibration; createdAt: number; usedAt?: number; }
export interface MotionSceneLibraryList { items: MotionSceneAsset[]; styles: MotionSceneStyleSet[]; base?: { characters: number; locations: number; props: number }; pending?: Partial<Record<MotionDrawingMode, number>>; }
export interface MotionSceneCustomItem { group: string; type: string; name: string; description: string; time?: string; interior?: boolean; gender?: "male" | "female"; }
