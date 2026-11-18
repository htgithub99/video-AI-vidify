import _ from "lodash";
import { MOTION_LANGUAGE_CODES } from "../../../constants/motionLanguages/index.js";
import { MOTION_MUSIC, MOTION_MUSIC_MOODS } from "../../../constants/motionMusic.js";
import { REUP_LIMITS } from "../constants/reupConfig.js";
import { reupPreset, reupPresetDefaults } from "../constants/reupPresets.js";
import type { ReupAiChoice, ReupLanguage, ReupPresetId, ReupSettings } from "../types/reup.js";
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
export const REUP_MUSIC_MOODS = [MOTION_MUSIC.AUTO, ...Object.keys(MOTION_MUSIC_MOODS), MOTION_MUSIC.OFF];
/** Clean the screen's choices from the client or storage; anything missing or not offered falls back to the type's default. */
export const cleanReupSettings = (raw: unknown, preset: ReupPresetId): ReupSettings => {
  const d = reupPresetDefaults(preset);
  const def = reupPreset(preset);
  const v = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const language = pick(v.language, REUP_LANGUAGES, d.language);
  return {
    language,
    languageAlt: pick(v.languageAlt, REUP_LANGUAGES.filter((l) => l !== language), d.languageAlt !== language ? d.languageAlt : REUP_LANGUAGES.find((l) => l !== language)!),
    targetSeconds: def.lengths.includes(Number(v.targetSeconds)) ? Number(v.targetSeconds) : d.targetSeconds,
    shortsCount: _.clamp(Math.round(Number(v.shortsCount) || d.shortsCount), 1, 5),
    aspect: pick(v.aspect, ["16:9", "9:16"], d.aspect),
    voiceChannel: str(v.voiceChannel, 120, d.voiceChannel),
    voiceChannelAlt: str(v.voiceChannelAlt, 120, d.voiceChannelAlt),
    musicMood: pick(v.musicMood, REUP_MUSIC_MOODS, d.musicMood),
    natural: pick(v.natural, ["keep", "low", "off"], d.natural),
    subtitles: bool(v.subtitles, d.subtitles),
    logo: pick(v.logo, ["off", "crop", "blur"], d.logo),
    logoCorner: pick(v.logoCorner, ["tl", "tr", "bl", "br"], d.logoCorner),
    stopScript: bool(v.stopScript, d.stopScript),
    sourceLink: str(v.sourceLink, 300, d.sourceLink),
    brandName: str(v.brandName, 60, d.brandName),
    hotline: str(v.hotline, 40, d.hotline),
    cta: str(v.cta, 120, d.cta),
    logoFile: str(v.logoFile, REUP_LIMITS.PATH, d.logoFile),
    quality: pick(v.quality, ["draft", "standard", "high", "ultra"], d.quality),
    fps: pick(String(v.fps), ["24", "25", "30", "60"], String(d.fps)) === String(v.fps) ? Number(v.fps) : d.fps,
    visionAi: ai(v.visionAi, d.visionAi),
    scriptAi: ai(v.scriptAi, d.scriptAi),
  };
};
