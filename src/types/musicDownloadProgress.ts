export type MusicUploadPhase = 'queued' | 'selecting' | 'selected' | 'uploading' | 'ready' | 'submitted' | 'failed' | 'verification-waiting' | 'verification-resumed';
export interface MusicUploadProgress {
  phase: MusicUploadPhase;
  expected: number;
  selected?: number;
  ready?: number;
  processing?: number;
  failed?: number;
  namesMatch?: boolean;
  pending?: number;
  elapsedMs?: number;
  message?: string;
}
export interface MusicDownloadProgress extends Omit<MusicUploadProgress, 'phase'> {
  phase: MusicUploadPhase | 'preparing' | 'evaluating' | 'evaluated' | 'evaluation-failed' | 'retrying' | 'exporting' | 'exported';
  room?: number;
  rooms?: number;
  attempt?: number;
}
