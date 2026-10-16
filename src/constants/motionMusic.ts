export interface MotionMusicMood { scale: number[]; root: number; progression: number[]; bpm: number; brightness: number; pad: number; bass: number; arp: number; arpStep: number; pulse: number; pulseEvery: number; drone: number; pings: number; }
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const WHOLE = [0, 2, 4, 6, 8, 10];
export const MOTION_MUSIC_MOODS: Record<string, MotionMusicMood> = {
  warm: { scale: MAJOR, root: 48, progression: [0, 5, 3, 4], bpm: 80, brightness: 2600, pad: 0.5, bass: 0.35, arp: 0.22, arpStep: 0.5, pulse: 0, pulseEvery: 0, drone: 0, pings: 0 },
  sad: { scale: MINOR, root: 45, progression: [0, 5, 2, 6], bpm: 64, brightness: 1800, pad: 0.6, bass: 0.3, arp: 0.14, arpStep: 1, pulse: 0, pulseEvery: 0, drone: 0, pings: 0 },
  tense: { scale: MINOR, root: 43, progression: [0, 0, 5, 4], bpm: 96, brightness: 1400, pad: 0.45, bass: 0.45, arp: 0, arpStep: 0.25, pulse: 0.4, pulseEvery: 1, drone: 0.15, pings: 0 },
  epic: { scale: MINOR, root: 45, progression: [0, 5, 2, 6], bpm: 100, brightness: 3200, pad: 0.6, bass: 0.5, arp: 0.12, arpStep: 0.5, pulse: 0.55, pulseEvery: 2, drone: 0, pings: 0 },
  eerie: { scale: WHOLE, root: 40, progression: [0, 0, 1, 0], bpm: 48, brightness: 1200, pad: 0.35, bass: 0, arp: 0, arpStep: 1, pulse: 0, pulseEvery: 0, drone: 0.4, pings: 0.18 },
  playful: { scale: MAJOR, root: 53, progression: [0, 3, 4, 0], bpm: 112, brightness: 3600, pad: 0.3, bass: 0.35, arp: 0.3, arpStep: 0.25, pulse: 0.2, pulseEvery: 1, drone: 0, pings: 0 },
  neutral: { scale: MAJOR, root: 50, progression: [0, 3, 5, 4], bpm: 88, brightness: 2400, pad: 0.4, bass: 0.3, arp: 0.15, arpStep: 0.5, pulse: 0.12, pulseEvery: 2, drone: 0, pings: 0 },
};
export const MOTION_MUSIC = {
  VERSION: 1,
  AUTO: "auto",
  DEFAULT_MOOD: "neutral",
  DEFAULT_VOLUME: 0.35,
  SAMPLE_RATE: 24000,
  CHANNELS: 2,
  TABLE_SIZE: 4096,
  PAD_PARTIALS: [1, 0.5, 0.33, 0.2, 0.12],
  DETUNE_CENTS: 7,
  BEATS_PER_CHORD: 4,
  FADE_IN: 2,
  FADE_OUT: 3,
  CROSSFADE: 2,
  MOOD_JOIN: " → ",
  PEAK: 0.7,
  REVERB: { COMBS: [1116, 1188, 1277, 1356], SPREAD: 23, ALLPASS: [556, 441], FEEDBACK: 0.8, DAMP: 0.3, WET: 0.28, ALLPASS_GAIN: 0.5 },
  CUE: { SWELL: 1.6, BOOM: 1.8, GAIN: 0.5 },
  PREFIX: "music-",
  MIX_PREFIX: "music-mix-",
  WAV: ".wav",
  MIX_GRAPH: (volume: number): string => `[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${volume.toFixed(3)}[m];[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[v][k];[m][k]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=400[d];[v][d]amix=inputs=2:duration=first:normalize=0[out]`,
  MIX_OUT: "[out]",
  GENRE_MOOD: { horror: "eerie", history_map: "tense", what_if: "tense", story: "warm", kids: "playful", explainer: "neutral", documentary: "neutral" } as Record<string, string>,
  SFX_MOOD: { dark: "tense", horror: "eerie", sad: "sad", warm: "warm", epic: "epic", playful: "playful", tense: "tense" } as Record<string, string>,
  CUE_TEMPLATES: ["title", "chapter", "verdict", "ending", "scoreboard"],
  LOG: { BUILT: (mood: string): string => `Đã soạn nhạc nền (${mood})` },
  UI: {
    vi: { LABEL: "Nhạc nền", OFF: "Tắt", HINT: "AI đọc nội dung và tự chọn tâm trạng nhạc cho cả video và từng chương; nhạc tự hạ nhỏ khi có lời đọc. Chọn tâm trạng khác để ép một kiểu nhạc cho toàn video.", MOODS: { auto: "AI tự chọn", warm: "Ấm áp", sad: "Buồn", tense: "Căng thẳng", epic: "Hùng tráng", eerie: "Rùng rợn", playful: "Vui nhộn", neutral: "Trung tính" } },
    en: { LABEL: "Music", OFF: "Off", HINT: "AI reads the content and picks the score mood for the video and each chapter, ducked under narration. Pick a mood to force one score for the whole video.", MOODS: { auto: "AI picks", warm: "Warm", sad: "Sad", tense: "Tense", epic: "Epic", eerie: "Eerie", playful: "Playful", neutral: "Neutral" } },
  },
  OFF: "off",
  PROMPT: (moods: string[]): string =>
    `BACKGROUND MUSIC: choose the score that fits this video's topic and emotional arc. Return root field "musicMood": one of ${moods.join("|")} for the whole video, and on each chapter an optional "musicMood" (same list) only where that chapter's mood clearly differs (e.g. a calm opening, a tense battle, a sad aftermath). Judge from the content itself, not from keywords.`,
} as const;
