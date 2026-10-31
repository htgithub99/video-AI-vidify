export interface SavedMusicStyle {
  title: string;
  content: string;
}
export interface MusicStyleAnalysis {
  title?: string;
  sunoStylePrompt?: string;
  market: { country: string; region: string; language: string; dialect: string; audienceAge: string; lyricalCharacterAge: string; contentSuitability: string; confidence: number };
  era: { songwritingEra: string; productionEra: string };
  genre: { primary: string; secondary: string[]; influences: string[] };
  musicalDna: { tempoRange: string; rhythm: string; harmony: string; melodicLanguage: string; hookPlacement: string; songForms: string[]; instrumentation: string[]; vocalCharacter: string; listeningContext: string };
  lyricalDna: { themes: string[]; narrativeVoice: string; vocabulary: string; imagery: string[]; rhymeBehavior: string };
  historicalInfluences: Array<{ name: string; role: string; relevance: string }>;
  creativeProfile: { role: string; strengths: string[]; writingPrinciples: string[]; productionPrinciples: string[] };
  mustPreserve: string[];
  mustVary: string[];
  mustNotCopy: string[];
  uncertainties: string[];
}
export interface MusicEditorialReview {
  version: number;
  impact: number;
  wording: number;
  singability: number;
  originality: number;
  fit: number;
  hook: string;
  strength: string;
  risk: string;
}
export interface MusicPlanProgress {
  stage: string;
  completedSongs: number;
  totalSongs: number;
  attempt?: number;
  warning?: string;
}
export interface MusicPlanPartial {
  songs?: any[];
  styleAnalysis?: any;
  sunoSettings?: any;
  sunoSettingsAnalysis?: any;
  playlistSeoOptions?: any[];
}
export type MusicPlanEvent = { type: "progress"; progress: MusicPlanProgress; data?: MusicPlanPartial } | { type: "result"; result: any };
