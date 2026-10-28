import { parseJson } from "../../lib/jsonStringify.js";
import { MUSIC_PLANNING as P } from "../../constants/musicPlanning.js";
import { validMusicEditorialReview, compactMusicProfile } from "../../lib/musicPlanning.js";
export const reviewMusicSongBatch = async (songs: any[], context: unknown, requestId: string, send: (prompt: string, artifact: string, id: string) => Promise<{ text: string }>, signal: AbortSignal, retryable: (error: unknown) => boolean): Promise<any[]> => {
  const reviews = new Map(songs.filter((song) => validMusicEditorialReview(song.editorialReview)).map((song) => [song.songId, song.editorialReview]));
  for (let attempt = 0; attempt < P.REVIEW_ATTEMPTS; attempt++) {
    signal.throwIfAborted();
    const missing = songs.filter((song) => !reviews.has(song.songId));
    if (!missing.length) break;
    try {
      const response = await send(P.REVIEW_PROMPT(requestId, missing, compactMusicProfile(context)), P.REVIEW_ARTIFACT, requestId);
      const parsed = parseJson(response.text);
      if (parsed?.artifactType !== P.REVIEW_ARTIFACT || parsed.requestId !== requestId || !Array.isArray(parsed.reviews)) continue;
      for (const item of parsed.reviews) {
        if (missing.some((song) => song.songId === item.songId) && parsed.reviews.filter((review: any) => review.songId === item.songId).length === 1 && validMusicEditorialReview(item.editorialReview)) reviews.set(item.songId, item.editorialReview);
      }
    } catch (error) {
      signal.throwIfAborted();
      if (!retryable(error)) throw error;
    }
  }
  return songs.map((song) => (reviews.has(song.songId) ? { ...song, editorialReview: reviews.get(song.songId) } : song));
};
