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
export interface MotionMusicInstrument { pad: "warm" | "square" | "saw" | "sine" | "none"; padGain: number; lead: "pluck" | "chip" | "bell" | "piano" | "flute"; leadOctave: number; minArp: number; arpStep?: number; pentatonic?: boolean; bpmScale: number; swing: number; detuneCents?: number; brightness: number; bass: number; }
export const MOTION_MUSIC_INSTRUMENTS: Record<string, MotionMusicInstrument> = {
  default: { pad: "warm", padGain: 1, lead: "pluck", leadOctave: 12, minArp: 0, bpmScale: 1, swing: 0, brightness: 1, bass: 1 },
  chiptune: { pad: "square", padGain: 0.45, lead: "chip", leadOctave: 12, minArp: 0.3, arpStep: 0.25, bpmScale: 1.15, swing: 0, brightness: 2.2, bass: 0.8 },
  ragtime: { pad: "none", padGain: 0, lead: "piano", leadOctave: 12, minArp: 0.35, arpStep: 0.5, bpmScale: 1.2, swing: 0.18, brightness: 1.4, bass: 1.2 },
  jazz: { pad: "sine", padGain: 0.5, lead: "piano", leadOctave: 0, minArp: 0.22, arpStep: 1, bpmScale: 0.9, swing: 0.22, brightness: 0.8, bass: 1.3 },
  synth80s: { pad: "saw", padGain: 0.8, lead: "chip", leadOctave: 12, minArp: 0.22, arpStep: 0.25, bpmScale: 1.05, swing: 0, detuneCents: 14, brightness: 1.6, bass: 1.1 },
  pentatonic: { pad: "sine", padGain: 0.6, lead: "flute", leadOctave: 12, minArp: 0.2, arpStep: 1, pentatonic: true, bpmScale: 0.8, swing: 0, brightness: 0.9, bass: 0.5 },
  musicbox: { pad: "sine", padGain: 0.4, lead: "bell", leadOctave: 24, minArp: 0.28, arpStep: 0.5, bpmScale: 0.95, swing: 0, brightness: 1.2, bass: 0.4 },
  piano: { pad: "warm", padGain: 0.55, lead: "piano", leadOctave: 12, minArp: 0.25, arpStep: 0.5, bpmScale: 0.9, swing: 0, brightness: 1, bass: 0.8 },
  strings: { pad: "warm", padGain: 1.2, lead: "flute", leadOctave: 12, minArp: 0.1, arpStep: 1, bpmScale: 0.9, swing: 0, brightness: 1.1, bass: 1 },
  brass: { pad: "saw", padGain: 0.9, lead: "chip", leadOctave: 0, minArp: 0.15, arpStep: 0.5, bpmScale: 1, swing: 0, brightness: 1.4, bass: 1.3 },
  ukulele: { pad: "sine", padGain: 0.4, lead: "pluck", leadOctave: 12, minArp: 0.35, arpStep: 0.25, bpmScale: 1.05, swing: 0.1, brightness: 1.3, bass: 0.7 },
  playful: { pad: "square", padGain: 0.3, lead: "pluck", leadOctave: 12, minArp: 0.3, arpStep: 0.25, bpmScale: 1.1, swing: 0.1, brightness: 1.5, bass: 0.9 },
  ambient: { pad: "sine", padGain: 1, lead: "bell", leadOctave: 24, minArp: 0.08, arpStep: 2, bpmScale: 0.75, swing: 0, brightness: 0.8, bass: 0.5 },
  drone: { pad: "sine", padGain: 0.7, lead: "bell", leadOctave: 24, minArp: 0, bpmScale: 0.7, swing: 0, brightness: 0.6, bass: 0.6 },
};
export const MOTION_MUSIC_AMBIENCE: Record<string, { gain: number }> = { projector: { gain: 0.22 }, vinyl: { gain: 0.2 }, paper: { gain: 0.16 }, chalk: { gain: 0.16 }, night: { gain: 0.2 } };
export const MOTION_MUSIC_VOICES = { NONE: "none", PLUCK: "pluck", CHIP: "chip", BELL: "bell", PIANO: "piano", PROJECTOR: "projector", VINYL: "vinyl", NIGHT: "night", CHALK: "chalk" } as const;
export const MOTION_MUSIC_SCALES = { MAJOR_PENTATONIC: [0, 2, 4, 7, 9], MINOR_PENTATONIC: [0, 3, 5, 7, 10], MINOR_THIRD: 3 };
export const MOTION_MUSIC = {
  VERSION: 3,
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
  BLOCK_SECONDS: 180,
  BLOCK_SEED_STRIDE: 1000,
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
export const MOTION_MUSIC_PAD_SHAPES: Record<string, readonly number[]> = { warm: MOTION_MUSIC.PAD_PARTIALS, square: [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7], saw: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6], sine: [1] };
export const MOTION_MUSIC_LEAD_SECONDS: Record<string, number> = { pluck: 1.2, chip: 0.35, bell: 2.2, piano: 1.6, flute: 0.9 };
