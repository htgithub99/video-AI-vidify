import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Play,
  Square,
  Check,
  Globe2,
  User,
  Activity,
  Mic,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import { translations } from "../lib/lang.js";
import { getStoredApiKey } from "../lib/shared-utils.js";
import { appError } from "../lib/logger.js";

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
}

const getReadableLanguage = (
  code: string,
  lang: "vi" | "en",
  isLocale: boolean = false,
) => {
  if (!code) return "";
  try {
    const localeToUse = lang === "vi" ? "vi-VN" : "en-US";
    if (isLocale && code.includes("-")) {
      const regionCode = code.split("-")[1];
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

export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  currentLang,
  selectedVoiceId,
}) => {
  const t = translations[currentLang];
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [provider, setProvider] = useState("edge");

  
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
        provider: provider,
        page: pageNumber.toString(),
        page_size: "30",
      });

      if (language) params.append("language", language);
      if (gender) params.append("gender", gender);
      if (age) params.append("age", age);
      if (search) params.append("search", search);

      const res = await fetch(`/api/voices?${params.toString()}`, {
        headers: {
          'x-ai33-api-key': getStoredApiKey('AI33_API_KEY')
        }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      if (json.success && json.data) {
        if (overrideVoices) {
          setVoices(json.data);
        } else {
          setVoices((prev) => {
            const existingIds = new Set(prev.map((v) => v.voice_id));
            const newVoices = json.data.filter(
              (v: Voice) => !existingIds.has(v.voice_id),
            );
            return [...prev, ...newVoices];
          });
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
    if (playingId === voice.voice_id) {
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
    audio.play().catch((e) => appError("AUDIO_PLAYBACK_FAILED", e));
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
          <span>
            {t.Voice_Library}
          </span>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row h-full min-h-[500px] bg-slate-900">
        {}
        <div className="w-full md:w-72 bg-slate-950/40 border-r border-slate-800/80 p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              {t.Search_2}
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  t.Name_description
                }
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
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm"
              >
                <option value="edge">{t.Edge_Microsoft}</option>
                <option value="elevenlabs">{t.ElevenLabs}</option>
                <option value="minimax">{t.Minimax}</option>
                <option value="kokoro">{t.Kokoro}</option>
                <option value="clone">{t.Clone}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              {t.Language}
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm"
              >
                <option value="">
                  {t.All}
                </option>
                <option value="en">{t.English_3}</option>
                <option value="vi">{t.Vietnamese_4}</option>
                <option value="fr">{t.French}</option>
                <option value="de">{t.German}</option>
                <option value="es">{t.Spanish}</option>
                <option value="ja">{t.Japanese}</option>
                <option value="ko">{t.Korean}</option>
                <option value="zh">{t.Chinese}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t.Gender}
            </label>
            <div className="flex gap-2">
              {["", "male", "female"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${gender === g ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-sm" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300 shadow-sm"}`}
                >
                  {g === ""
                    ? t.All
                    : g === "male"
                      ? t.Male_5
                      : t.Female_6}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              {t.Age}
            </label>
            <div className="relative">
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-200 outline-none appearance-none transition-all shadow-sm"
              >
                <option value="">
                  {t.All}
                </option>
                <option value="young">
                  {t.Young}
                </option>
                <option value="middle_aged">
                  {t.Middle_aged}
                </option>
                <option value="old">
                  {t.Elderly}
                </option>
              </select>
            </div>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto relative p-5">
          {voices.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Mic className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm mt-1 opacity-70">
                {t.No_voices_found}
              </p>
            </div>
          )}

          {voices.length === 0 && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse">{t.Loading_7}</p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.voice_id;
              const isPlaying = playingId === voice.voice_id;

              return (
                <div
                  key={voice.voice_id}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? "bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/20" : "bg-slate-900 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/50 shadow-sm"}`}
                  onClick={() => onSelectVoice(voice)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(voice);
                    }}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105"}`}
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-slate-100 truncate">
                        {voice.name}
                      </h3>
                      {isSelected && (
                        <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                          <Check className="w-3 h-3" />
                          {t.Selected}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {(() => {
                        const displayTags = new Set<string>();
                        if (voice.language)
                          displayTags.add(
                            getReadableLanguage(voice.language, currentLang),
                          );
                        if (voice.locale)
                          displayTags.add(
                            getReadableLanguage(
                              voice.locale,
                              currentLang,
                              true,
                            ),
                          );
                        if (voice.gender) displayTags.add(voice.gender);
                        if (voice.age) displayTags.add(voice.age);
                        if (voice.accent) displayTags.add(voice.accent);
                        if (voice.tags)
                          voice.tags.forEach((t) => displayTags.add(t));

                        return Array.from(displayTags)
                          .filter(Boolean)
                          .filter((tag) => {
                            const lowerTag = String(tag).toLowerCase();
                            const lowerLocale = voice.locale?.toLowerCase();
                            const lowerLang = voice.language?.toLowerCase();
                            return (
                              lowerTag !== lowerLocale && lowerTag !== lowerLang
                            );
                          })
                          .map((tag, idx) => (
                            <span
                              key={`tag-${idx}`}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ));
                      })()}
                      {voice.descriptives?.slice(0, 2).map((desc, idx) => (
                        <span
                          key={`desc-${idx}`}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-400 capitalize whitespace-nowrap"
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

          {loading && voices.length > 0 && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400 animate-pulse">
                {t.Loading_8}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
