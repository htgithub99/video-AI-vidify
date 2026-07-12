import { cn } from "../lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { Search, Play, Square, Check, Globe2, User, Activity, Mic, Heart } from "lucide-react";
import { Modal } from "./ui/Modal";
import _ from 'lodash';
import { Button } from "./ui/Button";
import { translations } from "../lib/lang.js";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { appError } from "../lib/logger.js";
import { 
  VOICE_PROVIDER_OPTIONS, 
  VOICE_LANGUAGE_OPTIONS, 
  VOICE_AGE_OPTIONS, 
  ErrorMessage,
  VOICE_OWNERSHIP_KEY,
  VOICE_OWNERSHIP_COMMUNITY,
  VBEE_PROVIDER_ID,
  VOICE_PAGE_SIZE,
  GENDER_OPTIONS,
  AUDIO_PLAYBACK_FAILED_ERR,
  APP_LOCALES,
  DEFAULT_PROVIDER,
  API_HEADERS,
  API_QUERY_PARAMS,
  API_ROUTES,
  STORAGE_KEYS
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

const getReadableLanguage = (code: string, lang: "vi" | "en", isLocale: boolean = false) => {
  if (_.isEmpty(code)) return "";
  try {
    const localeToUse = _.isEqual(lang, APP_LOCALES.VI_SHORT) ? APP_LOCALES.VI : APP_LOCALES.EN;
    if (isLocale && _.includes(code, "-")) {
      const regionCode = _.split(code, "-")[1];
      if (regionCode) {
        const regionNames = new Intl.DisplayNames([localeToUse], {
          type: "region",
        });
        return regionNames.of(regionCode) || code;
      }
    }
    const displayNames = new Intl.DisplayNames([localeToUse], {
      type: "language",
    });
    return displayNames.of(code) || code;
  } catch (e) {
    return code;
  }
};

export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({ isOpen, onClose, onSelectVoice, currentLang, selectedVoiceId, favoriteVoices = [], onToggleFavoriteVoice }) => {
  const t = translations[currentLang];
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchVoices = async (pageNumber: number, overrideVoices = false) => {
    if (loading) return;
    if (overrideVoices) {
      setVoices([]);
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        [API_QUERY_PARAMS.PROVIDER]: provider,
        [API_QUERY_PARAMS.PAGE]: String(pageNumber),
        [API_QUERY_PARAMS.PAGE_SIZE]: VOICE_PAGE_SIZE,
      });
      if (_.isEqual(provider, VBEE_PROVIDER_ID)) {
        params.append(VOICE_OWNERSHIP_KEY, VOICE_OWNERSHIP_COMMUNITY);
      }

      if (!_.isEmpty(language)) params.append(API_QUERY_PARAMS.LANGUAGE, language);
      if (!_.isEmpty(gender)) params.append(API_QUERY_PARAMS.GENDER, gender);
      if (!_.isEmpty(age)) params.append(API_QUERY_PARAMS.AGE, age);
      if (!_.isEmpty(search)) params.append(API_QUERY_PARAMS.SEARCH, search);

      const res = await fetch(`${API_ROUTES.VOICES}?${params.toString()}`, {
        headers: {
          [API_HEADERS.AI33_API_KEY]: getStoredApiKey(STORAGE_KEYS.AI33_API_KEY),
        },
      });
      if (!res.ok) throw new Error(ErrorMessage.FAILED_TO_FETCH);
      const json = await res.json();

      if (json.success && json.data) {
        if (overrideVoices) {
          setVoices(json.data);
        } else {
          setVoices((prev) => _.unionBy(prev, json.data, "voice_id"));
        }
        setHasMore(json.pagination?.has_more ?? false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      appError("FAILED_FETCH_VOICES_REGISTRY", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchVoices(1, true);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    }
  }, [isOpen, language, gender, age, search, provider]);

  useEffect(() => {
    if (page > 1) {
      fetchVoices(page, false);
    }
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

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
    audio.play().catch((e) => appError(AUDIO_PLAYBACK_FAILED_ERR, e));
    audioRef.current = audio;
    setPlayingId(voice.voice_id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-rose-500" />
          <span>{t.Voice_Library}</span>
        </div>
      }
    >
      <div className="flex flex-col h-full min-h-[500px] bg-slate-900">
        <div className="w-full bg-slate-950/40 border-b border-slate-800/80 p-5 shrink-0 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              {t.Search_2}
            </label>
            <div className="relative">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.Name_description} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all shadow-sm" />
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              {t.Provider}
            </label>
            <div className="relative">
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm">
                {_.map(VOICE_PROVIDER_OPTIONS, (opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {t[opt.labelKey as keyof typeof t] || opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              {t.Language}
            </label>
            <div className="relative">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm">
                {_.map(VOICE_LANGUAGE_OPTIONS, (opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {t[opt.labelKey as keyof typeof t] || opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t.Gender}
            </label>
            <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
              {_.map(GENDER_OPTIONS, (g) => {
                const isActive = _.isEqual(gender, g);
                return (
                  <Button variant="unstyled"
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${isActive ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}
                  >
                    {_.isEmpty(g) ? t.All : _.isEqual(g, "male") ? t.Male_5 : t.Female_6}
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
            <div className="relative">
              <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm">
                {_.map(VOICE_AGE_OPTIONS, (opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                    {t[opt.labelKey as keyof typeof t] || opt.value}
                  </option>
                ))}
              </select>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative p-5">
          {_.isEmpty(voices) && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Mic className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm mt-1 opacity-70">{t.No_voices_found}</p>
            </div>
          )}

          {_.isEmpty(voices) && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse">{t.Loading_7}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {_.map(voices, (voice) => {
              const isSelected = _.isEqual(selectedVoiceId, voice.voice_id);
              const isPlaying = _.isEqual(playingId, voice.voice_id);

              return (
                <div key={voice.voice_id} className={cn(`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/20" : "bg-slate-900 border-slate-700/80 hover:border-slate-500 hover:bg-slate-850 shadow-sm"}`)} onClick={() => onSelectVoice(voice)}>
                  <Button
                    variant={isPlaying ? "primary" : "secondary"}
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(voice);
                    }}
                    className={cn(`shrink-0 w-12 h-12 rounded-full p-0 flex items-center justify-center ${isPlaying ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-300"}`)}
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </Button>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-slate-100 truncate">{voice.name}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteVoice(voice.voice_id, voice.name, voice.category || "Custom");
                          }}
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-955/30 border border-slate-200/50 dark:border-slate-700/50 hover:border-rose-200/60 dark:hover:border-rose-900/30 shadow-none p-0"
                          title={t.favorite}
                        >
                          <Heart className={cn(`w-4 h-4 transition-all duration-200 ${_.some(favoriteVoices, (v) => _.isEqual(v.voiceURI, voice.voice_id)) ? "text-rose-500 fill-rose-500 scale-110" : "text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:scale-110"}`)} />
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
                            <span key={`tag-${idx}`} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize whitespace-nowrap">
                              {tag}
                            </span>
                          )
                        );
                      })()}
                      {_.map(_.take(voice.descriptives, 2), (desc, idx) => (
                        <span key={`desc-${idx}`} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-850 border border-slate-700/50 text-slate-400 capitalize whitespace-nowrap">
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

          {loading && !_.isEmpty(voices) && (
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
