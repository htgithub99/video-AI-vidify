import { cn } from "../lib/utils";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, Play, Square, Check, Globe2, User, Activity, Mic, Heart, ChevronDown } from "lucide-react";
import { Modal } from "./ui/Modal";
import _ from "lodash";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { translations } from "../lib/lang.js";
import { VOICE_DIALOG_TEXTS } from "../constants/texts";
import { logger } from "../utils/logger";
import { useVoices } from "../hooks/useVoices";
import {
  VOICE_PROVIDER_OPTIONS,
  VOICE_LANGUAGE_OPTIONS,
  VOICE_AGE_OPTIONS,
  VOICE_PAGE_SIZE,
  GENDER_OPTIONS,
  AUDIO_PLAYBACK_FAILED_ERR,
  APP_LOCALES,
  DEFAULT_PROVIDER,
  REFACTOR_CONSTANTS,
  SecurityConstants,
  COMMON_STRINGS,
  VOICE_GENDER
} from "../constants";

export interface Voice {
  voice_id: string;
  name: string;
  description: string;
  language: string;
  locale: string;
  gender: string;
  age: string;
  accent: string;
  category: string;
  use_cases: string[];
  descriptives: string[];
  tags: string[];
  preview_url: string;
}

interface VoiceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voice: Voice) => void;
  currentLang: "vi" | "en";
  selectedVoiceId?: string;
  favoriteVoices: any[];
  onToggleFavoriteVoice: (voiceId: string, name: string, providerName?: string) => void;
}

const normalizeText = (text: string): string => {
  if (_.isEmpty(text)) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  return text.normalize(REFACTOR_CONSTANTS.VD_NORMALIZE_FORM).replace(REFACTOR_CONSTANTS.VD_NORMALIZE_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING).toLowerCase().trim();
};

const getReadableLanguage = (code: string, lang: "vi" | "en", isLocale: boolean = false) => {
  if (_.isEmpty(code)) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  try {
    const localeToUse = _.isEqual(lang, COMMON_STRINGS.VI) ? APP_LOCALES.VI : APP_LOCALES.EN;
    if (isLocale && _.includes(code, REFACTOR_CONSTANTS.VD_HYPHEN)) {
      const regionCode = _.split(code, REFACTOR_CONSTANTS.VD_HYPHEN)[1];
      if (regionCode) {
        const regionNames = new Intl.DisplayNames([localeToUse], { type: REFACTOR_CONSTANTS.VD_REGION_TYPE as any });
        return regionNames.of(regionCode) || code;
      }
    }
    const displayNames = new Intl.DisplayNames([localeToUse], { type: REFACTOR_CONSTANTS.VD_LANG_TYPE as any });
    return displayNames.of(code) || code;
  } catch (e) {
    return code;
  }
};

export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  currentLang,
  selectedVoiceId,
  favoriteVoices = [],
  onToggleFavoriteVoice
}) => {
  const t = translations[currentLang];
  const dialogTexts = VOICE_DIALOG_TEXTS[currentLang];
  const [voices, setVoices] = useState<Voice[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [language, setLanguage] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [gender, setGender] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [age, setAge] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const debouncedSetSearch = useCallback(
    _.debounce((val: string) => {
      setDebouncedSearch(val);
    }, 350),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    debouncedSetSearch(val);
  };

  const { data: queryData, isLoading, isFetching } = useVoices({
    provider,
    page,
    pageSize: parseInt(VOICE_PAGE_SIZE, SecurityConstants.RADIX_10),
    language,
    gender,
    age,
    search: debouncedSearch
  }, isOpen);

  const loading = isLoading || isFetching;

  useEffect(() => {
    if (queryData?.success && queryData?.data) {
      if (page === 1) {
        setVoices(queryData.data);
      } else {
        setVoices((prev) => _.unionBy(prev, queryData.data, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY));
      }
      setHasMore(_.get(queryData, REFACTOR_CONSTANTS.VD_PAGINATION_HAS_MORE, false));
    } else if (queryData?.success === false) {
      setHasMore(false);
    }
  }, [queryData, page]);

  useEffect(() => {
    setPage(1);
  }, [language, gender, age, debouncedSearch, provider]);

  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const filteredVoices = useMemo(() => {
    if (_.isEmpty(voices)) return [];

    return _.filter(voices, (v) => {
      if (!_.isEmpty(gender) && !_.isEqual(_.toLower(v.gender), _.toLower(gender))) {
        return false;
      }

      if (!_.isEmpty(age) && !_.isEqual(_.toLower(v.age), _.toLower(age))) {
        return false;
      }

      if (!_.isEmpty(language)) {
        const langLower = _.toLower(language);
        const matchLang = _.includes(_.toLower(v.language), langLower) || _.includes(_.toLower(v.locale), langLower);
        if (!matchLang) return false;
      }

      if (!_.isEmpty(debouncedSearch)) {
        const cleanQuery = normalizeText(debouncedSearch);
        const cleanName = normalizeText(v.name);
        const cleanDesc = normalizeText(v.description);
        const cleanTags = normalizeText(_.join(v.tags || [], REFACTOR_CONSTANTS.VD_BLANK || " "));
        const cleanCategory = normalizeText(v.category);

        const match = _.some([cleanName, cleanDesc, cleanTags, cleanCategory], (field) => _.includes(field, cleanQuery));
        if (!match) return false;
      }

      return true;
    });
  }, [voices, gender, age, language, debouncedSearch]);

  const handlePlay = (voice: Voice) => {
    if (_.isEqual(playingId, voice.voice_id)) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch((e) => logger.error(AUDIO_PLAYBACK_FAILED_ERR, e));
    audioRef.current = audio;
    setPlayingId(voice.voice_id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <Tooltip content={dialogTexts.TITLE_TOOLTIP} position={REFACTOR_CONSTANTS.POSITION_BOTTOM} align={REFACTOR_CONSTANTS.ALIGN_START}>
          <div className="flex items-center gap-3 cursor-help">
            <Mic className="w-5 h-5 text-rose-500" />
            <span>{dialogTexts.TITLE}</span>
          </div>
        </Tooltip>
      }
    >
      <div className="flex flex-col h-full min-h-[500px] bg-slate-900">
        <div className="w-full bg-slate-955/40 border-b border-slate-800/80 p-5 shrink-0 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                {t.Search_2}
              </label>
              <div className="relative">
                <input
                  type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t.Name_description}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                {t.Provider}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_PROVIDER_OPTIONS, (opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                      {t[opt.labelKey as keyof typeof t] || opt.value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                {t.Language}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_LANGUAGE_OPTIONS, (opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                      {t[opt.labelKey as keyof typeof t] || opt.value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t.Gender}
              </label>
              <div className="flex gap-1 bg-slate-955 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                {_.map(GENDER_OPTIONS, (g) => {
                  const isActive = _.isEqual(gender, g);
                  return (
                    <Button
                      variant="unstyled"
                      key={g}
                      type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                      onClick={() => setGender(g)}
                      className={cn(
                        `flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${isActive
                          ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        }`
                      )}
                    >
                      {_.isEmpty(g) ? t.All : _.isEqual(g, VOICE_GENDER.MALE) ? t.Male_5 : t.Female_6}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {t.Age}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_AGE_OPTIONS, (opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                      {t[opt.labelKey as keyof typeof t] || opt.value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative p-5">
          {_.isEmpty(filteredVoices) && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Mic className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm mt-1 opacity-70">{t.No_voices_found}</p>
            </div>
          )}

          {_.isEmpty(filteredVoices) && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse">{t.Loading_7}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {_.map(filteredVoices, (voice) => {
              const isSelected = _.isEqual(selectedVoiceId, voice.voice_id);
              const isPlaying = _.isEqual(playingId, voice.voice_id);

              return (
                <div
                  key={voice.voice_id}
                  className={cn(
                    `flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                      ? "bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/20"
                      : "bg-slate-900 border-slate-700/80 hover:border-slate-500 hover:bg-slate-850 shadow-sm"
                    }`
                  )}
                  onClick={() => onSelectVoice(voice)}
                >
                  <Button
                    variant={isPlaying ? REFACTOR_CONSTANTS.VARIANT_PRIMARY : REFACTOR_CONSTANTS.VARIANT_SECONDARY}
                    size={REFACTOR_CONSTANTS.SIZE_MD}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(voice);
                    }}
                    className={cn(
                      `shrink-0 w-12 h-12 rounded-full p-0 flex items-center justify-center ${isPlaying ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-300"
                      }`
                    )}
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </Button>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-slate-100 truncate">{voice.name}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                          variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                          size={REFACTOR_CONSTANTS.SIZE_XS}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteVoice(voice.voice_id, voice.name, voice.category || REFACTOR_CONSTANTS.VD_CATEGORY_CUSTOM);
                          }}
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-955/30 border border-slate-200/50 dark:border-slate-700/50 hover:border-rose-200/60 dark:hover:border-rose-900/30 shadow-none p-0"
                          title={t.favorite}
                        >
                          <Heart
                            className={cn(
                              `w-4 h-4 transition-all duration-200 ${_.some(favoriteVoices, (v) => _.isEqual(v.voiceURI, voice.voice_id))
                                ? "text-rose-500 fill-rose-500 scale-110"
                                : "text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:scale-110"
                              }`
                            )}
                          />
                        </Button>
                        {isSelected && (
                          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                            <Check className="w-3 h-3" />
                            {t.Selected}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {(() => {
                        const rawTags = [
                          voice.language && getReadableLanguage(voice.language, currentLang),
                          voice.locale && getReadableLanguage(voice.locale, currentLang, true),
                          voice.gender,
                          voice.age,
                          voice.accent,
                          ...(voice.tags || [])
                        ];
                        const displayTags = _.uniq(_.filter(rawTags, Boolean) as string[]);

                        return _.map(
                          _.filter(displayTags, (tag) => {
                            const lowerTag = _.toLower(String(tag));
                            const lowerLocale = _.toLower(voice.locale);
                            const lowerLang = _.toLower(voice.language);
                            return !_.includes([lowerLocale, lowerLang], lowerTag);
                          }),
                          (tag, idx) => (
                            <span
                              key={_.join([REFACTOR_CONSTANTS.VD_TAG_PREFIX, idx], REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          )
                        );
                      })()}
                      {_.map(_.take(voice.descriptives, 2), (desc, idx) => (
                        <span
                          key={_.join([REFACTOR_CONSTANTS.VD_DESC_PREFIX, idx], REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-850 border border-slate-700/50 text-slate-400 capitalize whitespace-nowrap"
                        >
                          {desc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={observerTarget} className="h-4 w-full mt-4" />

          {loading && !_.isEmpty(filteredVoices) && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400 animate-pulse">{t.Loading_8}</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
