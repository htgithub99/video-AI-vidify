import { MOTION_LANGUAGE_CODES } from "../../../constants/motionLanguages/index.js";
import { REUP_DIR, REUP_LIMITS, REUP_THUMBS } from "../constants/reupConfig.js";
import { REUP_LENGTHS, reupPresetDefaults } from "../constants/reupPresets.js";
import type { ReupAiChoice, ReupLanguage, ReupMusicChoice, ReupSettings } from "../types/reup.js";
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);
const str = (value: unknown, max: number, fallback = ""): string => (typeof value === "string" ? value.slice(0, max) : fallback);
const ai = (value: any, fallback: ReupAiChoice): ReupAiChoice => ({
  provider: str(value?.provider, 40, fallback.provider) || fallback.provider,
  model: str(value?.model, 60, fallback.model) || fallback.model,
  mode: str(value?.mode, 20, fallback.mode) || fallback.mode,
  chromeHeadless: bool(value?.chromeHeadless, fallback.chromeHeadless),
  allowFallback: bool(value?.allowFallback, fallback.allowFallback),
  multiRoom: bool(value?.multiRoom, fallback.multiRoom),
});
export const REUP_LANGUAGES = MOTION_LANGUAGE_CODES as readonly ReupLanguage[];
export const REUP_MUSIC_CHOICES: readonly ReupMusicChoice[] = ["off", "library"];
export const reupMusicChoice = (value: unknown, legacyMood: unknown, fallback: ReupMusicChoice): ReupMusicChoice => (REUP_MUSIC_CHOICES.includes(value as ReupMusicChoice) ? (value as ReupMusicChoice) : typeof legacyMood === "string" && legacyMood ? (legacyMood === "off" ? "off" : "library") : fallback);
export const cleanReupSettings = (raw: unknown, preset: unknown): ReupSettings => {
  const d = reupPresetDefaults(preset);
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const language = pick(v.language, REUP_LANGUAGES, d.language);
  return {
    language,
    languageAlt: pick(
      v.languageAlt,
      REUP_LANGUAGES.filter((l) => l !== language),
      d.languageAlt !== language ? d.languageAlt : REUP_LANGUAGES.find((l) => l !== language)!,
    ),
    targetSeconds: REUP_LENGTHS.includes(Number(v.targetSeconds)) ? Number(v.targetSeconds) : d.targetSeconds,
    aspect: pick(v.aspect, ["16:9", "9:16"], d.aspect),
    voiceChannel: str(v.voiceChannel, 120, d.voiceChannel),
    voiceChannelAlt: str(v.voiceChannelAlt, 120, d.voiceChannelAlt),
    music: reupMusicChoice(v.music, v.musicMood, d.music),
    natural: pick(v.natural, ["keep", "low", "off"], d.natural),
    subtitles: bool(v.subtitles, d.subtitles),
    logo: pick(v.logo, ["off", "crop", "blur"], d.logo),
    logoCorner: pick(v.logoCorner, ["tl", "tr", "bl", "br"], d.logoCorner),
    stopScript: bool(v.stopScript, d.stopScript),
    angle: str(v.angle, REUP_LIMITS.NOTE, d.angle),
    sourceLink: str(v.sourceLink, 300, d.sourceLink),
    logoFile: str(v.logoFile, REUP_LIMITS.PATH, d.logoFile),
    thumbStyles: Array.isArray(v.thumbStyles) ? [...new Set(v.thumbStyles.filter((u: unknown): u is string => typeof u === "string" && u.startsWith(`${REUP_DIR.ASSETS_URL}${REUP_THUMBS.STYLE.DIR}/`) && !u.includes("..")))].slice(0, REUP_THUMBS.STYLE.MAX) : d.thumbStyles,
    quality: pick(v.quality, ["auto", "draft", "standard", "high", "ultra"], d.quality),
    encoder: pick(v.encoder, ["auto", "gpu", "cpu"], d.encoder),
    highlights: pick(v.highlights, ["off", "few", "normal"], d.highlights),
    fps: pick(String(v.fps), ["24", "25", "30", "60"], String(d.fps)) === String(v.fps) ? Number(v.fps) : d.fps,
    visionAi: ai(v.visionAi, d.visionAi),
    scriptAi: ai(v.scriptAi, d.scriptAi),
  };
};
