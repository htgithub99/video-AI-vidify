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
