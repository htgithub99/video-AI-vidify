import { cn } from "../lib/utils";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  Play,
  Square,
  Check,
  Globe2,
  User,
  Activity,
  Mic,
  Heart,
  ChevronDown,
} from "lucide-react";
import { Modal } from "./ui/Modal";
import _ from "lodash";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { useVoices } from "../hooks/useVoices";
import { logger } from "../utils/logger";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { VOICE_DIALOG_TEXTS } from "../constants/texts";
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
  STORAGE_KEYS,
  VOICE_GENDER,
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
  provider?: string;
}

interface VoiceSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voice: Voice) => void;
  currentLang: "vi" | "en";
  selectedVoiceId?: string;
  favoriteVoices: any[];
  onToggleFavoriteVoice: (
    voiceId: string,
    name: string,
    providerName?: string,
  ) => void;
  persistenceScope: string;
}

interface VoiceDialogFilterState {
  search: string;
  language: string;
  gender: string;
  age: string;
  provider: string;
}

const DEFAULT_FILTER_STATE: VoiceDialogFilterState = {
  search: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
  language: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
  gender: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
  age: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
  provider: DEFAULT_PROVIDER,
};

const getFilterStorageKey = (scope: string): string =>
  _.join(
    [STORAGE_KEYS.VOICE_DIALOG_FILTERS, scope],
    REFACTOR_CONSTANTS.VOICE_DIALOG_SCOPE_SEPARATOR,
  );

const getStoredFilters = (storageKey: string): VoiceDialogFilterState => {
  const storedFilters = jsonUtils.safeParse<Partial<VoiceDialogFilterState>>(
    storageUtils.get(storageKey),
    DEFAULT_FILTER_STATE,
  );
  return _.assign({}, DEFAULT_FILTER_STATE, storedFilters);
};

const normalizeText = (text: string): string => {
  if (_.isEmpty(text)) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  return text
    .normalize(REFACTOR_CONSTANTS.VD_NORMALIZE_FORM)
    .replace(
      REFACTOR_CONSTANTS.VD_NORMALIZE_REGEX,
      REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    )
    .toLowerCase()
    .trim();
};

const getReadableLanguage = (
  code: string,
  lang: "vi" | "en",
  isLocale: boolean = false,
) => {
  if (_.isEmpty(code)) return REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  try {
    const localeToUse = _.isEqual(lang, COMMON_STRINGS.VI)
      ? APP_LOCALES.VI
      : APP_LOCALES.EN;
    if (isLocale && _.includes(code, REFACTOR_CONSTANTS.VD_HYPHEN)) {
      const regionCode = _.split(code, REFACTOR_CONSTANTS.VD_HYPHEN)[1];
      if (regionCode) {
        const regionNames = new Intl.DisplayNames([localeToUse], {
          type: REFACTOR_CONSTANTS.VD_REGION_TYPE as any,
        });
        return regionNames.of(regionCode) || code;
      }
    }
    const displayNames = new Intl.DisplayNames([localeToUse], {
      type: REFACTOR_CONSTANTS.VD_LANG_TYPE as any,
    });
    return displayNames.of(code) || code;
  } catch (e) {
    return code;
  }
};

const LANGUAGE_LABEL_MAP: Record<string, Record<"vi" | "en", string>> = {
  "": { vi: "Tất cả", en: "All" },
  en: { vi: "Tiếng Anh", en: "English" },
  vi: { vi: "Tiếng Việt", en: "Vietnamese" },
  fr: { vi: "Tiếng Pháp", en: "French" },
  de: { vi: "Tiếng Đức", en: "German" },
  es: { vi: "Tiếng Tây Ban Nha", en: "Spanish" },
  ja: { vi: "Tiếng Nhật", en: "Japanese" },
  ko: { vi: "Tiếng Hàn", en: "Korean" },
  zh: { vi: "Tiếng Trung", en: "Chinese" },
};

const AGE_LABEL_MAP: Record<string, Record<"vi" | "en", string>> = {
  "": { vi: "Tất cả", en: "All" },
  young: { vi: "Trẻ tuổi", en: "Young" },
  middle_aged: { vi: "Trung niên", en: "Middle Aged" },
  old: { vi: "Cao tuổi", en: "Elderly" },
};

export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  currentLang,
  selectedVoiceId,
  favoriteVoices = [],
  onToggleFavoriteVoice,
  persistenceScope,
}) => {
  const filterStorageKey = getFilterStorageKey(persistenceScope);
  const initialFilters = useMemo(
    () => getStoredFilters(filterStorageKey),
    [filterStorageKey],
  );
  const [voices, setVoices] = useState<Voice[]>([]);
  const [page, setPage] = useState<number>(REFACTOR_CONSTANTS.PAGE_ONE);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState<string>(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    initialFilters.search,
  );
  const [language, setLanguage] = useState<string>(initialFilters.language);
  const [gender, setGender] = useState<string>(initialFilters.gender);
  const [age, setAge] = useState<string>(initialFilters.age);
  const [provider, setProvider] = useState(initialFilters.provider);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const userRequestedNextPageRef = useRef(false);

  const debouncedSetSearch = useCallback(
    _.debounce((val: string) => {
      setDebouncedSearch(val);
    }, REFACTOR_CONSTANTS.DEBOUNCE_DELAY_MS),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    debouncedSetSearch(val);
  };

  useEffect(() => {
    storageUtils.set(
      filterStorageKey,
      jsonUtils.safeStringify({ search, language, gender, age, provider }),
    );
  }, [filterStorageKey, search, language, gender, age, provider]);

  useEffect(
    () => () => {
      debouncedSetSearch.cancel();
    },
    [debouncedSetSearch],
  );

  const {
    data: queryData,
    isLoading,
    isFetching,
  } = useVoices(
    {
      provider,
      page,
      pageSize: parseInt(VOICE_PAGE_SIZE, SecurityConstants.RADIX_10),
      language,
      gender,
      age,
      search: debouncedSearch,
    },
    isOpen,
  );

  const loading = isLoading || isFetching;

  useEffect(() => {
    if (
      _.get(queryData, SecurityConstants.SUCCESS_KEY) &&
      _.get(queryData, SecurityConstants.DATA_KEY)
    ) {
      if (_.isEqual(page, REFACTOR_CONSTANTS.PAGE_ONE)) {
        setVoices(_.get(queryData, SecurityConstants.DATA_KEY));
      } else {
        setVoices((prev) =>
          _.unionBy(
            prev,
            _.get(queryData, SecurityConstants.DATA_KEY),
            REFACTOR_CONSTANTS.VD_VOICE_ID_KEY,
          ),
        );
      }
      setHasMore(
        _.get(queryData, REFACTOR_CONSTANTS.VD_PAGINATION_HAS_MORE, false),
      );
    } else if (
      _.isEqual(_.get(queryData, SecurityConstants.SUCCESS_KEY), false)
    ) {
      setHasMore(false);
    }
  }, [queryData, page]);

  useEffect(() => {
    setPage(REFACTOR_CONSTANTS.PAGE_ONE);
    userRequestedNextPageRef.current = false;
  }, [language, gender, age, debouncedSearch, provider]);

  useEffect(() => {
    if (!isOpen) {
      setPage(REFACTOR_CONSTANTS.PAGE_ONE);
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = _.first(entries);
        if (
          _.every(
            [
              firstEntry?.isIntersecting,
              hasMore,
              !loading,
              userRequestedNextPageRef.current,
            ],
            Boolean,
          )
        ) {
          userRequestedNextPageRef.current = false;
          setPage((prev) => _.add(prev, REFACTOR_CONSTANTS.INDEX_ONE));
        }
      },
      { threshold: REFACTOR_CONSTANTS.OBSERVER_THRESHOLD },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const filteredVoices = useMemo(() => {
    if (_.isEmpty(voices)) return [];

    return _.filter(voices, (v) => {
      if (
        !_.isEmpty(gender) &&
        !_.isEqual(_.toLower(v.gender), _.toLower(gender))
      ) {
        return false;
      }

      if (!_.isEmpty(age) && !_.isEqual(_.toLower(v.age), _.toLower(age))) {
        return false;
      }

      if (!_.isEmpty(language)) {
        const langLower = _.toLower(language);
        const matchLang =
          _.includes(_.toLower(v.language), langLower) ||
          _.includes(_.toLower(v.locale), langLower);
        if (!matchLang) return false;
      }

      if (!_.isEmpty(debouncedSearch)) {
        const cleanQuery = normalizeText(debouncedSearch);
        const cleanName = normalizeText(v.name);
        const cleanDesc = normalizeText(v.description);
        const cleanTags = normalizeText(
          _.join(v.tags || [], REFACTOR_CONSTANTS.VD_BLANK),
        );
        const cleanCategory = normalizeText(v.category);

        const match = _.some(
          [cleanName, cleanDesc, cleanTags, cleanCategory],
          (field) => _.includes(field, cleanQuery),
        );
        if (!match) return false;
      }

      return true;
    });
  }, [voices, gender, age, language, debouncedSearch]);

  const handlePlay = (voice: Voice) => {
    if (
      _.isEqual(playingId, _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY))
    ) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(
      _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_PREVIEW_PATH),
    );
    audio.onended = () => setPlayingId(null);
    audio.play().catch((e) => logger.error(AUDIO_PLAYBACK_FAILED_ERR, e));
    audioRef.current = audio;
    setPlayingId(_.get(voice, "voice_id"));
  };

  const dialogTexts =
    VOICE_DIALOG_TEXTS[currentLang as "vi" | "en"] || VOICE_DIALOG_TEXTS.vi;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <Tooltip
          content={dialogTexts.TITLE_TOOLTIP}
          position={REFACTOR_CONSTANTS.POSITION_BOTTOM}
          align={REFACTOR_CONSTANTS.ALIGN_START}
        >
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
                {dialogTexts.searchLabel}
              </label>
              <div className="relative">
                <input
                  type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={dialogTexts.searchPlaceholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                {dialogTexts.providerLabel}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={provider}
                  onChange={(e) => setProvider(_.get(e, "target.value"))}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_PROVIDER_OPTIONS, (opt) => (
                    <option
                      key={_.get(opt, "value")}
                      value={_.get(opt, "value")}
                      className="bg-slate-900 text-slate-200"
                    >
                      {_.get(opt, "value")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                {dialogTexts.languageLabel}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_LANGUAGE_OPTIONS, (opt) => (
                    <option
                      key={_.get(opt, "value")}
                      value={_.get(opt, "value")}
                      className="bg-slate-900 text-slate-200"
                    >
                      {LANGUAGE_LABEL_MAP[_.get(opt, "value")]?.[currentLang] ||
                        _.get(opt, "value")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {dialogTexts.genderLabel}
              </label>
              <div className="flex gap-1 bg-slate-955 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                {_.map(GENDER_OPTIONS, (g) => {
                  const isActive = _.isEqual(gender, g);
                  return (
                    <Button
                      variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                      key={g}
                      type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                      onClick={() => setGender(g)}
                      className={cn(
                        `flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${
                          isActive
                            ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10"
                            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        }`,
                      )}
                    >
                      {_.isEmpty(g)
                        ? dialogTexts.allGender
                        : _.isEqual(g, VOICE_GENDER.MALE)
                          ? dialogTexts.maleGender
                          : dialogTexts.femaleGender}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                {dialogTexts.ageLabel}
              </label>
              <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-0.5">
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-slate-200 outline-none appearance-none pr-6 cursor-pointer"
                >
                  {_.map(VOICE_AGE_OPTIONS, (opt) => (
                    <option
                      key={_.get(opt, "value")}
                      value={_.get(opt, "value")}
                      className="bg-slate-900 text-slate-200"
                    >
                      {AGE_LABEL_MAP[_.get(opt, "value")]?.[currentLang] ||
                        _.get(opt, "value")}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-450 w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={REFACTOR_CONSTANTS.VOICE_DIALOG_SCROLL_CLASS}
          onScroll={(event) => {
            if (_.gt(event.currentTarget.scrollTop, SecurityConstants.ZERO)) {
              userRequestedNextPageRef.current = true;
            }
          }}
        >
          {loading && _.isEqual(page, REFACTOR_CONSTANTS.PAGE_ONE) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm text-slate-500">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-rose-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
              <p className="text-sm font-bold animate-pulse text-rose-400">
                {dialogTexts.loading}
              </p>
            </div>
          )}

          {_.isEmpty(filteredVoices) && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Mic className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm mt-1 opacity-70">{dialogTexts.noVoices}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {_.map(filteredVoices, (voice) => {
              const isSelected = _.isEqual(
                selectedVoiceId,
                _.get(voice, "voice_id"),
              );
              const isPlaying = _.isEqual(
                playingId,
                _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY),
              );

              return (
                <div
                  key={_.get(voice, "voice_id")}
                  className={cn(
                    `flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] ring-1 ring-rose-500/20"
                        : "bg-slate-900 border-slate-700/80 hover:border-slate-500 hover:bg-slate-850 shadow-sm"
                    }`,
                  )}
                  onClick={() => onSelectVoice({ ...voice, provider })}
                >
                  <Button
                    variant={
                      isPlaying
                        ? REFACTOR_CONSTANTS.VARIANT_PRIMARY
                        : REFACTOR_CONSTANTS.VARIANT_SECONDARY
                    }
                    size={REFACTOR_CONSTANTS.SIZE_MD}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(voice);
                    }}
                    className={cn(
                      `shrink-0 w-12 h-12 rounded-full p-0 flex items-center justify-center ${
                        isPlaying
                          ? "bg-rose-500 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`,
                    )}
                  >
                    {isPlaying ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-1" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-slate-100 truncate">
                        {_.get(voice, "name")}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                          variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                          size={REFACTOR_CONSTANTS.SIZE_XS}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteVoice(
                              _.get(voice, "voice_id"),
                              _.get(voice, "name"),
                              _.get(voice, "category") ||
                                REFACTOR_CONSTANTS.VD_CATEGORY_CUSTOM,
                            );
                          }}
                          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-955/30 border border-slate-200/50 dark:border-slate-700/50 hover:border-rose-200/60 dark:hover:border-rose-900/30 shadow-none p-0"
                          title={dialogTexts.favoriteTooltip}
                        >
                          <Heart
                            className={cn(
                              `w-4 h-4 transition-all duration-200 ${
                                _.some(favoriteVoices, (v) =>
                                  _.isEqual(
                                    _.get(v, "voiceURI"),
                                    _.get(voice, "voice_id"),
                                  ),
                                )
                                  ? "text-rose-500 fill-rose-500 scale-110"
                                  : "text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:scale-110"
                              }`,
                            )}
                          />
                        </Button>
                        {isSelected && (
                          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                            <Check className="w-3 h-3" />
                            {dialogTexts.selectedLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {(() => {
                        const rawTags = [
                          _.get(voice, "language") &&
                            getReadableLanguage(
                              _.get(voice, "language"),
                              currentLang,
                            ),
                          _.get(voice, "locale") &&
                            getReadableLanguage(
                              _.get(voice, "locale"),
                              currentLang,
                              true,
                            ),
                          _.get(voice, "gender"),
                          _.get(voice, "age"),
                          _.get(voice, "accent"),
                          ...(_.get(voice, "tags") || []),
                        ];
                        const displayTags = _.uniq(
                          _.filter(rawTags, Boolean) as string[],
                        );

                        return _.map(
                          _.filter(displayTags, (tag) => {
                            const lowerTag = _.toLower(String(tag));
                            const lowerLocale = _.toLower(
                              _.get(voice, "locale"),
                            );
                            const lowerLang = _.toLower(
                              _.get(voice, "language"),
                            );
                            return !_.includes(
                              [lowerLocale, lowerLang],
                              lowerTag,
                            );
                          }),
                          (tag, idx) => (
                            <span
                              key={_.join(
                                [REFACTOR_CONSTANTS.VD_TAG_PREFIX, idx],
                                REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                              )}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 capitalize whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ),
                        );
                      })()}
                      {_.map(
                        _.take(
                          _.get(voice, "descriptives"),
                          REFACTOR_CONSTANTS.TAKE_DESC_COUNT,
                        ),
                        (desc, idx) => (
                          <span
                            key={_.join(
                              [REFACTOR_CONSTANTS.VD_DESC_PREFIX, idx],
                              REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                            )}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-850 border border-slate-700/50 text-slate-400 capitalize whitespace-nowrap"
                          >
                            {desc}
                          </span>
                        ),
                      )}
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
              <span className="text-sm text-slate-400 animate-pulse">
                {dialogTexts.loadingMore}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
