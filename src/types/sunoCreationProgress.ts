export interface SunoCreationProgress {
  phase: "recovered" | "submitting" | "saved" | "waiting" | "playlist" | "completed";
  songCount: number;
  acceptedSongs: number;
  completedSongs: number;
  songIndex?: number;
  selectedTracks?: number;
  createdSongIds: string[];
  playlistName: string;
}
