import { RUNTIME_TEXT as RT_UI } from "../constants/runtime/ui.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { StudioSegmentedControl, StudioSegmentButton, StudioInput, StudioSelect } from "./ui/Studio.js";
import _ from "lodash";
import { Activity, Check, ChevronDown, Globe2, Heart, Mic, Play, Search, Square, User } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_LOCALES, AUDIO_PLAYBACK_FAILED_ERR, COMMON_STRINGS, DEFAULT_PROVIDER, GENDER_OPTIONS, REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS, VOICE_AGE_OPTIONS, VOICE_GENDER, VOICE_LANGUAGE_OPTIONS, VOICE_PAGE_SIZE, VOICE_PROVIDER_OPTIONS } from "../constants";
import { MOTION_TEXT_VALUE } from "../constants/motionRuntime.js";
import { SOURCE_TEXT_6XL, SOURCE_TEXT_AGE, SOURCE_TEXT_BUTTON, SOURCE_TEXT_CATEGORY, SOURCE_TEXT_GENDER, SOURCE_TEXT_LANGUAGE, SOURCE_TEXT_LOCALE, SOURCE_TEXT_NAME, SOURCE_TEXT_TAGS, SOURCE_TEXT_TARGET_VALUE, SOURCE_TEXT_UNSTYLED, SOURCE_TEXT_VALUE, SOURCE_TEXT_VOICE_ID } from "../constants/sourceText";
import { VOICE_DIALOG_AGE_LABELS, VOICE_DIALOG_LANGUAGE_LABELS, VOICE_DIALOG_TEXTS } from "../constants/texts";
import { useVoices } from "../hooks/useVoices";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { cn } from "../lib/utils";
import { logger } from "../utils/logger";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { PageLoadingSpinner } from "./ui/Skeleton";
import { Tooltip } from "./ui/Tooltip";
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
  onToggleFavoriteVoice: (voiceId: string, name: string, providerName?: string) => void;
  persistenceScope: string;
}
interface VoiceDialogFilterState {
  search: string;
  language: string;
  gender: string;
  age: string;
  provider: string;
}
const DEFAULT_FILTER_STATE: VoiceDialogFilterState = { search: REFACTOR_CONSTANTS.VD_EMPTY_STRING, language: REFACTOR_CONSTANTS.VD_EMPTY_STRING, gender: REFACTOR_CONSTANTS.VD_EMPTY_STRING, age: REFACTOR_CONSTANTS.VD_EMPTY_STRING, provider: DEFAULT_PROVIDER };
const getFilterStorageKey = (scope: string): string => _.join([STORAGE_KEYS.VOICE_DIALOG_FILTERS, scope], REFACTOR_CONSTANTS.VOICE_DIALOG_SCOPE_SEPARATOR);
const getStoredFilters = (storageKey: string): VoiceDialogFilterState => {
  const storedFilters = jsonUtils.safeParse<Partial<VoiceDialogFilterState>>(storageUtils.get(storageKey), DEFAULT_FILTER_STATE);
  const merged = _.assign({}, DEFAULT_FILTER_STATE, storedFilters);
  const providerValues = _.map(VOICE_PROVIDER_OPTIONS, (opt) => _.toString(_.get(opt, MOTION_TEXT_VALUE)));
  if (!_.includes(providerValues, merged.provider)) merged.provider = _.first(providerValues) || merged.provider;
  return merged;
};
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
export const VoiceSelectionDialog: React.FC<VoiceSelectionDialogProps> = ({ isOpen, onClose, onSelectVoice, currentLang, selectedVoiceId, favoriteVoices = [], onToggleFavoriteVoice, persistenceScope }) => {
  const filterStorageKey = getFilterStorageKey(persistenceScope);
  const initialFilters = useMemo(() => getStoredFilters(filterStorageKey), [filterStorageKey]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [page, setPage] = useState<number>(REFACTOR_CONSTANTS.PAGE_ONE);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState<string>(initialFilters.search);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialFilters.search);
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
    storageUtils.set(filterStorageKey, jsonUtils.safeStringify({ search, language, gender, age, provider }));
  }, [filterStorageKey, search, language, gender, age, provider]);
  useEffect(
    () => () => {
      debouncedSetSearch.cancel();
    },
    [debouncedSetSearch],
  );
  const { data: queryData, isLoading, isFetching } = useVoices({ provider, page, pageSize: parseInt(VOICE_PAGE_SIZE, SecurityConstants.RADIX_10), language, gender, age, search: debouncedSearch }, isOpen);
  const loading = isLoading || isFetching;
  useEffect(() => {
    if (_.get(queryData, SecurityConstants.SUCCESS_KEY) && _.get(queryData, SecurityConstants.DATA_KEY)) {
      if (_.isEqual(page, REFACTOR_CONSTANTS.PAGE_ONE)) {
        setVoices(_.get(queryData, SecurityConstants.DATA_KEY));
      } else {
        setVoices((prev) => _.unionBy(prev, _.get(queryData, SecurityConstants.DATA_KEY), REFACTOR_CONSTANTS.VD_VOICE_ID_KEY));
      }
      setHasMore(_.get(queryData, REFACTOR_CONSTANTS.VD_PAGINATION_HAS_MORE, false));
    } else if (_.isEqual(_.get(queryData, SecurityConstants.SUCCESS_KEY), false)) {
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
        if (_.every([firstEntry?.isIntersecting, hasMore, !loading, userRequestedNextPageRef.current], Boolean)) {
          userRequestedNextPageRef.current = false;
          setPage((prev) => _.add(prev, REFACTOR_CONSTANTS.INDEX_ONE));
        }
      },
      { threshold: REFACTOR_CONSTANTS.OBSERVER_THRESHOLD },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
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
        const cleanTags = normalizeText(_.join(v.tags || [], REFACTOR_CONSTANTS.VD_BLANK));
        const cleanCategory = normalizeText(v.category);
        const match = _.some([cleanName, cleanDesc, cleanTags, cleanCategory], (field) => _.includes(field, cleanQuery));
        if (!match) return false;
      }
      return true;
    });
  }, [voices, gender, age, language, debouncedSearch]);
  const handlePlay = (voice: Voice) => {
    if (_.isEqual(playingId, _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY))) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(_.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_PREVIEW_PATH));
    audio.onended = () => setPlayingId(null);
    audio.play().catch((e) => logger.error(AUDIO_PLAYBACK_FAILED_ERR, e));
    audioRef.current = audio;
    setPlayingId(_.get(voice, SOURCE_TEXT_VOICE_ID));
  };
  const dialogTexts = VOICE_DIALOG_TEXTS[currentLang as "vi" | "en"] || VOICE_DIALOG_TEXTS.vi;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={SOURCE_TEXT_6XL}
      title={
        <Tooltip content={dialogTexts.TITLE_TOOLTIP} position={REFACTOR_CONSTANTS.POSITION_BOTTOM} align={REFACTOR_CONSTANTS.ALIGN_START}>
          <div className={cn(RT_UI.FLEX_ITEMS_CENTER_GAP_3_CURSOR_HELP_UPPERCASE_TRACKING_WIDER)}>
            <Mic className={cn(RT_UI.W_5_H_5_TEXT_ROSE_500)} />
            <span className={cn(RT_UI.UPPERCASE_FONT_EXTRABOLD_TRACKING_WIDER)}>{String(dialogTexts.TITLE).toUpperCase()}</span>
          </div>
        </Tooltip>
      }>
      <div className={cn(RT_UI.FLEX_FLEX_COL_H_FULL_MIN_H_520PX_BG_SLATE)}>
        <div className={cn(RT_UI.W_FULL_BG_SLATE_900_90_BORDER_B_BORDER_SLATE)}>
          <div className={cn(RT_UI.GRID_GRID_COLS_1_SM_GRID_COLS_2_MD_GRID)}>
            <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
              <label className={cn(RT_UI.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER)}>
                <Search className={cn(RT_UI.W_3_5_H_3_5_TEXT_ROSE_500)} />
                {dialogTexts.searchLabel}
              </label>
              <div className={cn(RT_UI.RELATIVE)}>
                <StudioInput type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT} value={search} onChange={handleSearchChange} placeholder={dialogTexts.searchPlaceholder} className={cn(RT_UI.W_FULL_H_10_BG_SLATE_955_BORDER_BORDER_SLATE)} />
                <Search className={cn(RT_UI.ABSOLUTE_LEFT_3_TOP_1_2_TRANSLATE_Y_1_2)} />
              </div>
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
              <label className={cn(RT_UI.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER)}>
                <Globe2 className={cn(RT_UI.W_3_5_H_3_5_TEXT_SKY_500)} />
                {dialogTexts.providerLabel}
              </label>
              <div className={cn(RT_UI.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_BORDER_BORDER_SLATE)}>
                <StudioSelect value={provider} onChange={(e) => setProvider(_.get(e, SOURCE_TEXT_TARGET_VALUE))} className={cn(RT_UI.W_FULL_BG_TRANSPARENT_TEXT_XS_FONT_MEDIUM_TEXT_SLATE)}>
                  {_.map(VOICE_PROVIDER_OPTIONS, (opt) => (
                    <option key={_.get(opt, SOURCE_TEXT_VALUE)} value={_.get(opt, SOURCE_TEXT_VALUE)} className={cn(RT_UI.BG_SLATE_900_TEXT_SLATE_100)}>
                      {_.get(opt, SOURCE_TEXT_VALUE)}
                    </option>
                  ))}
                </StudioSelect>
                <ChevronDown className={cn(RT_UI.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_3_TEXT_SLATE_400_W)} />
              </div>
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
              <label className={cn(RT_UI.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER)}>
                <Globe2 className={cn(RT_UI.W_3_5_H_3_5_TEXT_EMERALD_500)} />
                {dialogTexts.languageLabel}
              </label>
              <div className={cn(RT_UI.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_BORDER_BORDER_SLATE)}>
                <StudioSelect value={language} onChange={(e) => setLanguage(e.target.value)} className={cn(RT_UI.W_FULL_BG_TRANSPARENT_TEXT_XS_FONT_MEDIUM_TEXT_SLATE)}>
                  {_.map(VOICE_LANGUAGE_OPTIONS, (opt) => (
                    <option key={_.get(opt, SOURCE_TEXT_VALUE)} value={_.get(opt, SOURCE_TEXT_VALUE)} className={cn(RT_UI.BG_SLATE_900_TEXT_SLATE_100)}>
                      {VOICE_DIALOG_LANGUAGE_LABELS[_.get(opt, SOURCE_TEXT_VALUE)]?.[currentLang] || _.get(opt, SOURCE_TEXT_VALUE)}
                    </option>
                  ))}
                </StudioSelect>
                <ChevronDown className={cn(RT_UI.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_3_TEXT_SLATE_400_W)} />
              </div>
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
              <label className={cn(RT_UI.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER)}>
                <User className={cn(RT_UI.W_3_5_H_3_5_TEXT_AMBER_500)} />
                {dialogTexts.genderLabel}
              </label>
              <StudioSegmentedControl>
                {_.map(GENDER_OPTIONS, (g) => {
                  const isActive = _.isEqual(gender, g);
                  return (
                    <StudioSegmentButton selected={isActive} key={g} onClick={() => setGender(g)}>
                      {_.isEmpty(g) ? dialogTexts.allGender : _.isEqual(g, VOICE_GENDER.MALE) ? dialogTexts.maleGender : dialogTexts.femaleGender}
                    </StudioSegmentButton>
                  );
                })}
              </StudioSegmentedControl>
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
              <label className={cn(RT_UI.TEXT_10PX_FONT_EXTRABOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER)}>
                <Activity className={cn(RT_UI.W_3_5_H_3_5_TEXT_PURPLE_500)} />
                {dialogTexts.ageLabel}
              </label>
              <div className={cn(RT_UI.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_BORDER_BORDER_SLATE)}>
                <StudioSelect value={age} onChange={(e) => setAge(e.target.value)} className={cn(RT_UI.W_FULL_BG_TRANSPARENT_TEXT_XS_FONT_MEDIUM_TEXT_SLATE)}>
                  {_.map(VOICE_AGE_OPTIONS, (opt) => (
                    <option key={_.get(opt, SOURCE_TEXT_VALUE)} value={_.get(opt, SOURCE_TEXT_VALUE)} className={cn(RT_UI.BG_SLATE_900_TEXT_SLATE_100)}>
                      {VOICE_DIALOG_AGE_LABELS[_.get(opt, SOURCE_TEXT_VALUE)]?.[currentLang] || _.get(opt, SOURCE_TEXT_VALUE)}
                    </option>
                  ))}
                </StudioSelect>
                <ChevronDown className={cn(RT_UI.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_3_TEXT_SLATE_400_W)} />
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(REFACTOR_CONSTANTS.VOICE_DIALOG_SCROLL_CLASS)}
          onScroll={(event) => {
            if (_.gt(event.currentTarget.scrollTop, SecurityConstants.ZERO)) {
              userRequestedNextPageRef.current = true;
            }
          }}>
          {loading && _.isEqual(page, REFACTOR_CONSTANTS.PAGE_ONE) ? (
            <div className={cn(RT_UI.FLEX_1_MIN_H_420PX_FLEX_ITEMS_CENTER_JUSTIFY_CENTER)}>
              <PageLoadingSpinner />
            </div>
          ) : (
            <>
              {_.isEmpty(filteredVoices) && !loading && (
                <div className={cn(RT_UI.FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_500)}>
                  <Mic className={cn(RT_UI.W_16_H_16_MB_3_OPACITY_20)} />
                  <p className={cn(RT_UI.TEXT_XS_FONT_SEMIBOLD_OPACITY_70)}>{dialogTexts.noVoices}</p>
                </div>
              )}
              <div className={cn(RT_UI.GRID_GRID_COLS_1_LG_GRID_COLS_2_XL_GRID)}>
                {_.map(filteredVoices, (voice) => {
                  const isSelected = _.isEqual(selectedVoiceId, _.get(voice, SOURCE_TEXT_VOICE_ID));
                  const isPlaying = _.isEqual(playingId, _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY));
                  return (
                    <div key={_.get(voice, SOURCE_TEXT_VOICE_ID)} className={cn(RT_UI.RELATIVE_FLEX_ITEMS_CENTER_GAP_3_5_P_3_5, { "bg-rose-500/15 border-rose-500 shadow-md ring-1 ring-rose-500/60": isSelected, "bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-rose-400/50 hover:shadow-md hover:-translate-y-0.5": !isSelected })} onClick={() => onSelectVoice({ ...voice, provider })}>
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        type={SOURCE_TEXT_BUTTON}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(voice);
                        }}
                        className={cn(RT_UI.SHRINK_0_W_11_H_11_ROUNDED_2XL_FLEX_ITEMS, { "bg-rose-600 text-white animate-pulse": isPlaying, "bg-slate-955 text-rose-400 group-hover:bg-rose-600 group-hover:text-white": !isPlaying })}>
                        {isPlaying ? <Square className={cn(RT_UI.W_4_H_4_FILL_CURRENT)} /> : <Play className={cn(RT_SHARED.W_4_H_4_FILL_CURRENT_ML_0_5)} />}
                      </Button>
                      <div className={cn(RT_SHARED.FLEX_1_MIN_W_0)}>
                        <div className={cn(RT_UI.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_MB_1_5)}>
                          <h3 className={cn(RT_UI.FONT_EXTRABOLD_TEXT_SM_TEXT_SLATE_100_TRUNCATE_VOICE_ITEM)}>{_.get(voice, SOURCE_TEXT_NAME)}</h3>
                          <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5_SHRINK_0)}>
                            {isSelected && (
                              <span className={cn(RT_UI.SHRINK_0_FLEX_ITEMS_CENTER_GAP_1_TEXT_10PX_FONT)}>
                                <Check className={cn(RT_UI.W_3_H_3_STROKE_3)} />
                                {dialogTexts.selectedLabel}
                              </span>
                            )}
                            <Button
                              variant={SOURCE_TEXT_UNSTYLED}
                              type={SOURCE_TEXT_BUTTON}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavoriteVoice(_.get(voice, SOURCE_TEXT_VOICE_ID), _.get(voice, SOURCE_TEXT_NAME), _.get(voice, SOURCE_TEXT_CATEGORY) || REFACTOR_CONSTANTS.VD_CATEGORY_CUSTOM);
                              }}
                              className={cn(RT_UI.W_8_H_8_ROUNDED_XL_FLEX_ITEMS_CENTER_JUSTIFY)}
                              title={dialogTexts.favoriteTooltip}>
                              <Heart className={cn(RT_UI.W_4_H_4_TRANSITION_ALL_DURATION_200, { "text-rose-500 fill-rose-500 scale-110": _.some(favoriteVoices, (v) => _.isEqual(_.get(v, RT_UI.VOICEURI), _.get(voice, RT_UI.VOICE_ID))), "text-slate-400 hover:text-rose-500": !_.some(favoriteVoices, (v) => _.isEqual(_.get(v, RT_UI.VOICEURI), _.get(voice, RT_UI.VOICE_ID))) })} />
                            </Button>
                          </div>
                        </div>
                        <div className={cn(RT_UI.FLEX_FLEX_WRAP_GAP_1_ITEMS_CENTER)}>
                          {_.get(voice, SOURCE_TEXT_GENDER) && <span className={cn(RT_UI.TEXT_9_5PX_FONT_BOLD_PX_2_PY_0_5)}>{_.get(voice, SOURCE_TEXT_GENDER)}</span>}
                          {_.get(voice, SOURCE_TEXT_AGE) && <span className={cn(RT_UI.TEXT_9_5PX_FONT_BOLD_PX_2_PY_0_5_32B043)}>{_.get(voice, SOURCE_TEXT_AGE)}</span>}
                          {(_.get(voice, SOURCE_TEXT_LOCALE) || _.get(voice, SOURCE_TEXT_LANGUAGE)) && <span className={cn(RT_UI.TEXT_9_5PX_FONT_BOLD_PX_2_PY_0_5_6051C4)}>{getReadableLanguage(_.get(voice, SOURCE_TEXT_LOCALE) || _.get(voice, SOURCE_TEXT_LANGUAGE), currentLang, true)}</span>}
                          {_.map(_.take(_.get(voice, SOURCE_TEXT_TAGS) || [], 2), (tag, idx) => (
                            <span key={_.join([REFACTOR_CONSTANTS.VD_TAG_PREFIX, idx], REFACTOR_CONSTANTS.VD_EMPTY_STRING)} className={cn(RT_UI.TEXT_9_5PX_FONT_BOLD_PX_2_PY_0_5_2402CE)}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={observerTarget} className={cn(RT_UI.H_4_W_FULL_MT_4)} />
              {loading && !_.isEmpty(filteredVoices) && (
                <div className={cn(RT_UI.PY_6_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP)}>
                  <div className={cn(RT_UI.W_6_H_6_BORDER_2_BORDER_SLATE_700_BORDER)} />
                  <span className={cn(RT_UI.TEXT_XS_TEXT_SLATE_400_ANIMATE_PULSE_FONT_MONO)}>{dialogTexts.loadingMore}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
