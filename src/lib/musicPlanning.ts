import { MUSIC_PLANNING as P } from "../constants/musicPlanning.js";
import type { MusicEditorialReview, MusicPlanEvent } from "../types/musicPlanning.js";
const text = (value: unknown, length: number) =>
  String(value ?? "")
    .trim()
    .slice(0, length);
const scores = ["impact", "wording", "singability", "originality", "fit"] as const;
export const validMusicEditorialReview = (review: any): review is MusicEditorialReview => review?.version === P.REVIEW_VERSION && scores.every((key) => Number.isInteger(review[key]) && review[key] >= 0 && review[key] <= 100) && ["hook", "strength", "risk"].every((key) => typeof review[key] === "string" && review[key].trim().length > 0);
export const compactMusicSongs = (songs: any[]) =>
  songs.map((song) => ({
    songId: song.songId,
    title: text(song.title, 100),
    genre: text(song.genre, 50),
    mood: text(song.mood, 40),
    tempoBpm: song.tempoBpm,
    lyricExcerpt: text(String(song.lyrics || "").match(/\[(?:chorus|refrain|điệp khúc)[^\]]*\]([^]*?)(?=\[|$)/i)?.[1] || song.lyrics || song.lyricExcerpt, P.SONG_EXCERPT_CHARS),
    ...(validMusicEditorialReview(song.editorialReview) ? { editorialReview: { ...Object.fromEntries(scores.map((key) => [key, song.editorialReview[key]])), hook: text(song.editorialReview.hook, 80), strength: text(song.editorialReview.strength, 80), risk: text(song.editorialReview.risk, 80) } } : {}),
  }));
export const musicReviewOrder = <T extends { editorialReview?: unknown }>(songs: T[]): T[] =>
  songs
    .map((song, index) => ({ song, index, score: validMusicEditorialReview(song.editorialReview) ? scores.reduce((sum, key) => sum + song.editorialReview[key], 0) : -1 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ song }) => song);
export const compactMusicSource = (source: string) => source.slice(0, P.SOURCE_EXCERPT_CHARS);
export const musicSeoSongs = (songs: any[]) => compactMusicSongs(songs).map((song) => ({ songId: song.songId, title: song.title, genre: song.genre, mood: song.mood, lyricExcerpt: text(song.lyricExcerpt, 100), hook: song.editorialReview?.hook }));
export const musicSettingsSongs = (songs: any[]) => compactMusicSongs(songs).map(({ songId, title, genre, mood, tempoBpm, editorialReview }) => ({ songId, title, genre, mood, tempoBpm, hook: editorialReview?.hook }));
export const compactMusicProfile = (profile: unknown): unknown => {
  const compact = (value: unknown, depth: number): unknown => {
    if (typeof value === "string") return text(value, 140);
    if (Array.isArray(value)) return value.slice(0, 5).map((item) => compact(item, depth + 1));
    if (value && typeof value === "object" && depth < 4)
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !["evidence", "historicalInfluences", "requestId", "artifactType"].includes(key))
          .map(([key, item]) => [key, compact(item, depth + 1)]),
      );
    return typeof value === "number" || typeof value === "boolean" ? value : undefined;
  };
  return compact(profile, 0);
};
export const readMusicPlanResponse = async (response: Response, onProgress: (event: Extract<MusicPlanEvent, { type: "progress" }>) => void): Promise<any> => {
  if (!response.headers.get(P.STREAM_HEADER)?.includes(P.STREAM_TYPE) || !response.body) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: any;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as MusicPlanEvent;
    if (event.type === "progress") onProgress(event);
    else if (event.type === "result") result = event.result;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() || "";
      lines.forEach(consume);
      if (done) break;
    }
    consume(pending);
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error(P.STREAM_ENDED);
  return result;
};
