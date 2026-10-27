import { useMotionClipboard } from "../hooks/useMotionClipboard.js";
import { MUSIC_PLANNING as MUSIC_PLAN } from "../constants/musicPlanning.js";
import { readMusicPlanResponse } from "../lib/musicPlanning.js";
import type { MusicPlanProgress } from "../types/musicPlanning.js";
import { MusicPlanProgressPanel } from "./music/MusicPlanProgressPanel.js";
import * as SRT from "../constants/sourceText.js";
import * as MCS from "../constants/musicCreatorStyles.js";
import { MUSIC_CREATOR_FORMAT as MCF } from "../constants/musicCreator.js";
import { StudioLoadingState, StudioSegmentedControl, StudioSegmentButton, StudioHeader, StudioDisclosureButton, StudioPage, StudioCanvas, StudioFieldset, StudioCard, StudioInput, StudioTextarea } from "./ui/Studio.js";
import {
  SOURCE_TEMPLATE_1_1,
  SOURCE_TEMPLATE_HTTP,
  SOURCE_TEMPLATE_LYRICS,
  SOURCE_TEMPLATE_MUSIC,
  SOURCE_TEMPLATE_MUSIC_BACKGROUND,
  SOURCE_TEMPLATE_MUSIC_COVER,
  SOURCE_TEMPLATE_MUSIC_TRACK_EVALUATION,
  SOURCE_TEMPLATE_SEO,
  SOURCE_TEMPLATE_SEO_2,
  SOURCE_TEMPLATE_SEO_ALL,
  SOURCE_TEMPLATE_SYMBOL_10,
  SOURCE_TEMPLATE_SYMBOL_11,
  SOURCE_TEMPLATE_SYMBOL_12,
  SOURCE_TEMPLATE_SYMBOL_13,
  SOURCE_TEMPLATE_SYMBOL_14,
  SOURCE_TEMPLATE_SYMBOL_15,
  SOURCE_TEMPLATE_SYMBOL_16,
  SOURCE_TEMPLATE_SYMBOL_17,
  SOURCE_TEMPLATE_SYMBOL_5,
  SOURCE_TEMPLATE_SYMBOL_7,
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEMPLATE_SYMBOL_9,
  SOURCE_TEMPLATE_TITLE,
  SOURCE_TEXT_0,
  SOURCE_TEXT_16_9_HD,
  SOURCE_TEXT_ALERT,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_CAN_TAI_FILE_NHAC_TU_DANH,
  SOURCE_TEXT_CENTER,
  SOURCE_TEXT_CHECKBOX,
  SOURCE_TEXT_COUNT,
  SOURCE_TEXT_COVER,
  SOURCE_TEXT_DANGER,
  SOURCE_TEXT_DATA_PLAYLISTSEOOPTIONS,
  SOURCE_TEXT_DATA_SEOWARNING,
  SOURCE_TEXT_DATA_SONGS,
  SOURCE_TEXT_DATA_STYLEANALYSIS,
  SOURCE_TEXT_DATA_SUNOSETTINGS,
  SOURCE_TEXT_DATA_SUNOSETTINGSANALYSIS,
  SOURCE_TEXT_DESCRIPTION,
  SOURCE_TEXT_END,
  SOURCE_TEXT_EXCLUDESTYLES,
  SOURCE_TEXT_FILE,
  SOURCE_TEXT_FOLDER,
  SOURCE_TEXT_FROM_AMBER_500_TO_ORANGE_500,
  SOURCE_TEXT_FROM_FUCHSIA_500_TO_PINK_500,
  SOURCE_TEXT_FROM_INDIGO_500_TO_CYAN_500,
  SOURCE_TEXT_FROM_PURPLE_500_TO_INDIGO_500,
  SOURCE_TEXT_GRID_COLS_1,
  SOURCE_TEXT_GRID_COLS_1_LG_GRID_COLS,
  SOURCE_TEXT_GRID_COLS_1_MD_GRID_COLS,
  SOURCE_TEXT_HASHTAGS,
  SOURCE_TEXT_KHOP,
  SOURCE_TEXT_LYRICS,
  SOURCE_TEXT_MAXMODE,
  SOURCE_TEXT_MAX_W_MD,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_MP3,
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_NOOPENER_NOREFERRER,
  SOURCE_TEXT_OUTLINE,
  SOURCE_TEXT_PERSONALIZE,
  SOURCE_TEXT_POLITE,
  SOURCE_TEXT_READONLY,
  SOURCE_TEXT_READWRITE,
  SOURCE_TEXT_SEO,
  SOURCE_TEXT_SETTINGKEY,
  SOURCE_TEXT_SM,
  SOURCE_TEXT_SPLIT,
  SOURCE_TEXT_START,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_SWITCH,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_11,
  SOURCE_TEXT_SYMBOL_12,
  SOURCE_TEXT_SYMBOL_13,
  SOURCE_TEXT_SYMBOL_14,
  SOURCE_TEXT_SYMBOL_15,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_SYMBOL_17,
  SOURCE_TEXT_SYMBOL_18,
  SOURCE_TEXT_SYMBOL_19,
  SOURCE_TEXT_SYMBOL_2,
  SOURCE_TEXT_SYMBOL_20,
  SOURCE_TEXT_SYMBOL_21,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_SYMBOL_5,
  SOURCE_TEXT_SYMBOL_6,
  SOURCE_TEXT_SYMBOL_7,
  SOURCE_TEXT_SYMBOL_8,
  SOURCE_TEXT_SYMBOL_9,
  SOURCE_TEXT_TAGS,
  SOURCE_TEXT_TAI_NHAC_SUNO,
  SOURCE_TEXT_TEXT,
  SOURCE_TEXT_TEXT_EMERALD_300_BG_EMERALD_500,
  SOURCE_TEXT_TEXT_FUCHSIA_300_BG_FUCHSIA_500,
  SOURCE_TEXT_TEXT_SLATE_300_BG_SLATE_800,
  SOURCE_TEXT_TEXT_SLATE_400_BG_SLATE_800,
  SOURCE_TEXT_TITLE,
  SOURCE_TEXT_TRACK_ORDER,
  SOURCE_TEXT_TRUE,
  SOURCE_TEXT_UNSTYLED,
  SOURCE_TEXT_URL,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_WAV,
} from "../constants/sourceText";
import { readBlobAsDataUrl } from "../lib/fileUtils";
import { DestructiveActionNotice } from "./common/DestructiveActionNotice";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Music2, WandSparkles, Sparkles, Copy, Check, Disc3, SlidersHorizontal, Flame, FileText, Search, Save, Trash2, Pencil, X, Columns, Clock, AlertTriangle, Upload, Image as ImageIcon, Download, RefreshCw, ExternalLink, Link2, Globe, Users, Lock } from "lucide-react";
import _ from "lodash";
import { toast } from "sonner";
import { recordWorkflowActivity } from "../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../constants/workflowActivity";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Tooltip } from "./ui/Tooltip";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ImagePreviewModal } from "./auto-video/ImagePreviewModal";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types";
import {
  API_ROUTES,
  HTTP_METHODS,
  CONTENT_TYPE_HEADER,
  CONTENT_TYPES,
  MUSIC_CREATOR_CONSTANTS,
  MUSIC_CREATOR_TEXTS,
  SUNO_AUTOMATION_CONFIG,
  SUNO_AUTOMATION_PATTERNS,
  SUNO_AUTOMATION_TEXTS,
  formatSunoPlaylistName,
  VIETNAMESE_MUSIC_TITLE_RESTORATIONS,
  REFACTOR_CONSTANTS,
  AUDIO_FORMATS,
  COPY_KEYS,
  MUSIC_VIEW_MODES,
  SUNO_VOCAL_GENDERS,
  MUSIC_CREATOR_RUNTIME,
  MUSIC_CREATOR_REGEXES,
} from "../constants";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
const saveMusicBlobWithDialog = async (blob: Blob, suggestedName: string): Promise<boolean> => {
  const dataUrl = await readBlobAsDataUrl(blob);
  const response = await fetch(API_ROUTES.PIPELINE_SAVE_FILE, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ suggestedName, dataUrl }) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || SUNO_AUTOMATION_TEXTS.SAVE_FILE_FAILED_ERR);
  return !result.cancelled;
};
const openMusicMediaDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME)) request.result.createObjectStore(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const readMusicMedia = async (key: string): Promise<string> => {
  const db = await openMusicMediaDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME, SOURCE_TEXT_READONLY).objectStore(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME).get(key);
    request.onsuccess = () => resolve(_.toString(request.result));
    request.onerror = () => reject(request.error);
  });
};
const writeMusicMedia = async (key: string, value: string): Promise<void> => {
  const db = await openMusicMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME, SOURCE_TEXT_READWRITE);
    transaction.objectStore(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
interface SavedMusicStyle {
  title: string;
  content: string;
}
type SavedMusicInspo = SavedMusicStyle;
const readSavedInspos = (): SavedMusicInspo[] => {
  const items = jsonUtils.getItem<SavedMusicInspo[]>(SUNO_AUTOMATION_CONFIG.MUSIC_INSPO_LIBRARY_KEY, []);
  return _.filter(items, (item) => !_.isEmpty(_.trim(item?.title)) && !_.isEmpty(_.trim(item?.content)));
};
const readSavedStyles = (): SavedMusicStyle[] => {
  const items = jsonUtils.getItem<any[]>(SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY, []);
  return _.compact(_.map(items, (item) => (_.isString(item) ? { title: _.split(item, SOURCE_TEXT_SYMBOL_4)[0], content: item } : item?.title && item?.content ? item : undefined)));
};
interface SongSeoOption {
  title: string;
  description: string;
  hashtags: string[];
  tags: string[];
  seoScore: number;
}
interface GeneratedSong {
  songId: string;
  title: string;
  lyrics: string;
  genre: string;
  mood: string;
  tempoBpm: number;
  structure: string[];
  originalityNotes: string[];
}
interface MusicStyleAnalysis {
  market: { country: string; region: string; language: string; dialect: string; audienceAge: string; lyricalCharacterAge: string; contentSuitability: string; confidence: number };
  era: { songwritingEra: string; productionEra: string };
  genre: { primary: string; secondary: string[]; influences: string[] };
  musicalDna: { tempoRange: string; rhythm: string; harmony: string; melodicLanguage: string; hookPlacement: string; songForms: string[]; instrumentation: string[]; vocalCharacter: string; listeningContext: string };
  lyricalDna: { themes: string[]; narrativeVoice: string; vocabulary: string; imagery: string[]; rhymeBehavior: string };
  historicalInfluences: Array<{ name: string; role: string; relevance: string }>;
  creativeProfile: { role: string; strengths: string[]; writingPrinciples: string[]; productionPrinciples: string[] };
  mustPreserve: string[];
  mustVary: string[];
  mustNotCopy: string[];
  uncertainties: string[];
}
const formatStyleAnalysisItems = (items: unknown[]): string =>
  _.chain(items)
    .map((item) => {
      if (_.isString(item)) return _.trim(item);
      if (!_.isPlainObject(item)) return MUSIC_CREATOR_RUNTIME.EMPTY;
      return _.chain(item as Record<string, unknown>)
        .values()
        .filter((value) => _.isString(value) || _.isNumber(value))
        .map((value) => _.trim(_.toString(value)))
        .compact()
        .join(SOURCE_TEXT_SYMBOL_5)
        .value();
    })
    .compact()
    .join(SOURCE_TEXT_SYMBOL_6)
    .value();
interface CuratedDownloadedTrack {
  songId: string;
  title: string;
  qualityScore: number;
  durationSeconds: number;
  startSeconds: number;
}
interface DownloadedMusicTrack {
  songId: string;
  title: string;
}
interface SunoSettings {
  excludeStyles: string;
  vocalGender: "male" | "female" | "auto";
  duration: "auto";
  maxMode: boolean;
  weirdness: number;
  styleInfluence: number;
  audioInfluence: number;
  variety: number;
  personalize: boolean;
}
interface SunoSettingsAnalysis {
  productionAssessment: { syntheticRole: string; cultureAndMarket: string; eraAndGenre: string; vocalProfile: string; songAndArrangementProfile: string; productionGoal: string; risks: string[] };
  parameterRationale: { excludeStyles: string; vocalGender: string; maxMode: string; weirdness: string; styleInfluence: string; audioInfluence: string; variety: string; personalize: string };
  parameterAnalysis?: Record<string, { evidence: string; expectedEffect: string; risk: string; interactions: string; confidence: number }>;
}
type SunoParameterAnalysis = NonNullable<SunoSettingsAnalysis["parameterAnalysis"]>[string];
const SunoParameterAnalysisDetails = ({ analysis, texts }: { analysis?: SunoParameterAnalysis; texts: any }) => {
  if (!analysis) return null;
  const rows = [
    [texts.SUNO_SETTINGS_EVIDENCE_LABEL, analysis.evidence],
    [texts.SUNO_SETTINGS_EFFECT_LABEL, analysis.expectedEffect],
    [texts.SUNO_SETTINGS_RISK_LABEL, analysis.risk],
    [texts.SUNO_SETTINGS_INTERACTION_LABEL, analysis.interactions],
  ];
  return (
    <div className={cn(MCS.SPACE_Y_1_5_PT_1_5_BORDER_T_BORDER_SLATE_800_60_MIN_W_0)}>
      {_.map(
        rows,
        ([label, value]) =>
          value && (
            <p key={label} className={cn(MCS.TEXT_10PX_TEXT_SLATE_300_LEADING_RELAXED_BREAK_WORDS)}>
              <span className={cn(MCS.FONT_BOLD_TEXT_SLATE_500)}>
                {label}
                {SOURCE_TEXT_SYMBOL_7}
              </span>
              {value}
            </p>
          ),
      )}
      <span className={cn(MCS.INLINE_FLEX_TEXT_9PX_FONT_BOLD_TEXT_CYAN_300_BG_CYAN_500_10_BORDER_BORDER_C)}>
        {texts.SUNO_SETTINGS_CONFIDENCE_LABEL}
        {SOURCE_TEXT_SYMBOL_7}
        {analysis.confidence}
        {SOURCE_TEXT_SYMBOL_8}
      </span>
    </div>
  );
};
type SunoDownloadFormat = "mp3" | "wav";
type ResultViewMode = "lyrics" | "seo" | "split";
const formatPlaylistTimestamp = (seconds: number): string => {
  const wholeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
  return hours > 0 ? SOURCE_TEMPLATE_SYMBOL_7(String(_.padStart(_.toString(hours), 2, SOURCE_TEXT_0)), String(_.padStart(_.toString(minutes), 2, SOURCE_TEXT_0)), String(_.padStart(_.toString(remainingSeconds), 2, SOURCE_TEXT_0))) : SOURCE_TEMPLATE_SYMBOL_8(String(_.padStart(_.toString(minutes), 2, SOURCE_TEXT_0)), String(_.padStart(_.toString(remainingSeconds), 2, SOURCE_TEXT_0)));
};
const replaceSeoTracklistWithTimestamps = (description: string, tracks: CuratedDownloadedTrack[]): string => {
  const heading = SUNO_AUTOMATION_CONFIG.SEO_HEADING_TRACKLIST;
  const headingIndex = description.indexOf(heading);
  const timestampLines = _.map(tracks, (track) => MCF.JOIN_WITH_SPACE(formatPlaylistTimestamp(track.startSeconds), track.title)).join(SRT.SOURCE_TEXT_SYMBOL_56);
  if (headingIndex < 0) {
    const lines = description.split(SRT.SOURCE_TEXT_SYMBOL_56);
    const existingTimestamps = _.findIndex(lines, (line) => MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(line));
    if (existingTimestamps < 0) return _.compact([_.trim(description), timestampLines]).join(MUSIC_CREATOR_RUNTIME.SEO_SECTION_SEPARATOR);
    let afterTimestamps = existingTimestamps;
    while (afterTimestamps < lines.length && MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(lines[afterTimestamps])) afterTimestamps += 1;
    return _.compact([_.trim(_.slice(lines, 0, existingTimestamps).join(SRT.SOURCE_TEXT_SYMBOL_56)), timestampLines, _.trim(_.slice(lines, afterTimestamps).join(SRT.SOURCE_TEXT_SYMBOL_56))]).join(MUSIC_CREATOR_RUNTIME.SEO_SECTION_SEPARATOR);
  }
  const beforeTracklist = description.slice(0, headingIndex + heading.length);
  const afterHeading = description.slice(headingIndex + heading.length);
  const remainingLines = afterHeading.split(SRT.SOURCE_TEXT_SYMBOL_56);
  let lineIndex = 0;
  while (lineIndex < remainingLines.length && (_.isEmpty(_.trim(remainingLines[lineIndex])) || MUSIC_CREATOR_REGEXES.NUMBERED_LINE.test(remainingLines[lineIndex]) || MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(remainingLines[lineIndex]))) lineIndex += 1;
  const suffix = _.slice(remainingLines, lineIndex).join(SRT.SOURCE_TEXT_SYMBOL_56).trim();
  return MCF.TRACKLIST(beforeTracklist, timestampLines, suffix ? MCF.PARAGRAPH(suffix) : MUSIC_CREATOR_RUNTIME.EMPTY);
};
const restoreSeoTimestampTitles = (description: string, songs: Array<{ title: string }>): string => {
  let songIndex = 0;
  return _.map(description.split(SRT.SOURCE_TEXT_SYMBOL_56), (line) => {
    const match = line.match(MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE);
    if (!match) return line;
    const title = _.trim(songs[songIndex]?.title);
    songIndex += 1;
    return title ? MCF.JOIN_WITH_SPACE(match[1], title) : line;
  }).join(SRT.SOURCE_TEXT_SYMBOL_56);
};
const getSeoTrackOrder = (description: string): string =>
  _.compact(
    _.map(description.split(SRT.SOURCE_TEXT_SYMBOL_56), (line) => {
      const match = line.match(MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE);
      return match ? _.trim(line.slice(match[1].length)) : MUSIC_CREATOR_RUNTIME.EMPTY;
    }),
  ).join(SOURCE_TEXT_SYMBOL_2);
interface PersistedMusicCreatorState {
  style?: string;
  outputCount?: number;
  referenceSongs?: string;
  provider?: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  executionMode?: AiPlanningExecutionMode;
  chromeHeadless?: boolean;
  isAiConfigOpen?: boolean;
  songs?: GeneratedSong[];
  songTitleSchemaVersion?: number;
  styleAnalysis?: MusicStyleAnalysis;
  playlistSeoOptions?: SongSeoOption[];
  seoSchemaVersion?: number;
  thumbnailDescription?: string;
  thumbnailReferenceName?: string;
  viewMode?: ResultViewMode;
  selectedSeoSongIndex?: number;
  sunoPlaylistUrl?: string;
  sunoTestPlaylistUrl?: string;
  sunoTestTrackIds?: string[];
  downloadPlaylistUrl?: string;
  sunoTrackIds?: string[];
  curatedDownloadedTracks?: CuratedDownloadedTrack[];
  sunoDownloadFormat?: SunoDownloadFormat;
  sunoEvaluateTracks?: boolean;
  sunoInspo?: string;
  sunoSettings?: SunoSettings;
  sunoSettingsAnalysis?: SunoSettingsAnalysis;
  downloadedMusicTracks?: DownloadedMusicTrack[];
  videoBackgroundDescription?: string;
  videoBackgroundReferenceName?: string;
  showVideoTrackList?: boolean;
}
const readMusicCreatorState = (): PersistedMusicCreatorState => {
  const state = jsonUtils.getItem<PersistedMusicCreatorState>(SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY, {});
  if (state.songTitleSchemaVersion === SUNO_AUTOMATION_CONFIG.MUSIC_SONG_TITLE_SCHEMA_VERSION) return state;
  return { ...state, songs: _.map(state.songs || [], (song) => ({ ...song, title: VIETNAMESE_MUSIC_TITLE_RESTORATIONS[_.toLower(_.trim(song.title))] || song.title })), songTitleSchemaVersion: SUNO_AUTOMATION_CONFIG.MUSIC_SONG_TITLE_SCHEMA_VERSION };
};
interface MusicCreatorProps {
  currentLang?: "vi" | "en";
}
type MusicCreatorTexts = (typeof MUSIC_CREATOR_TEXTS)[keyof typeof MUSIC_CREATOR_TEXTS];
interface HeaderProps {
  texts: MusicCreatorTexts;
  isAiConfigOpen: boolean;
  onToggleAiConfig: () => void;
  isLoading: boolean;
}
const MusicCreatorHeader: React.FC<HeaderProps> = ({ texts, isAiConfigOpen, onToggleAiConfig, isLoading }) => (
  <StudioHeader
    icon={Music2}
    title={<>{texts.HEADER_TITLE}</>}
    description={<>{texts.HEADER_DESC}</>}
    badge={<>{texts.HEADER_BADGE}</>}
    actions={
      <>
        <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_SELF_START)}>
          <Tooltip content={texts.AI_CONFIG_TOOLTIP} align={SOURCE_TEXT_END}>
            <StudioDisclosureButton type={SOURCE_TEXT_BUTTON} onClick={onToggleAiConfig} disabled={isLoading} expanded={isAiConfigOpen} label={<>{texts.AI_CONFIG_TITLE}</>} />
          </Tooltip>
        </div>
      </>
    }></StudioHeader>
);
interface SongCardProps {
  song: GeneratedSong;
  index: number;
  texts: MusicCreatorTexts;
}
const toSentenceCase = (text: string): string => {
  const trimmed = _.trim(text);
  if (!trimmed) return MUSIC_CREATOR_RUNTIME.EMPTY;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
const SongCard: React.FC<SongCardProps> = ({ song, index, texts }) => {
  const { copiedKey, copyText: handleCopy } = useMotionClipboard();
  const displayTitle = toSentenceCase(song.title);
  return (
    <StudioCard className={cn(MCS.ROUNDED_2XL_BORDER_BORDER_SLATE_800_80_BG_SLATE_900_60_P_3_5_SM_P_4_SHADOW)}>
      <div className={cn(MCS.FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_200)}>
        <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0_FLEX_WRAP)}>
          <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_PX_2_PY_0_5_ROUNDED_LG_BG_PURPLE_50)}>
            {SOURCE_TEXT_SYMBOL_9}
            {index + 1}
          </span>
          <h3 className={cn(MCS.TEXT_SM_SM_TEXT_BASE_FONT_BLACK_TEXT_0F172A_DARK_TEXT_SLATE_100_TRUNCATE_MA)} title={displayTitle}>
            {displayTitle}
          </h3>
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopy(displayTitle, SOURCE_TEMPLATE_TITLE(String(index)), texts.COPY_TITLE_SUCCESS)} className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC)} title={copiedKey === SOURCE_TEMPLATE_TITLE(String(index)) ? texts.COPIED_LABEL : texts.COPY_TITLE_BTN}>
            {copiedKey === SOURCE_TEMPLATE_TITLE(String(index)) ? <Check className={cn(MCS.W_3_5_H_3_5_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
          </Button>
        </div>
        <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_FLEX)}>
          {song.genre && <span className={cn(MCS.TEXT_XS_FONT_MEDIUM_PX_2_PY_0_5_ROUNDED_MD_BG_SKY_50_DARK_BG_SKY_950_50_BOR)}>{song.genre}</span>}
          {song.tempoBpm > 0 && (
            <span className={cn(MCS.TEXT_XS_FONT_MEDIUM_PX_2_PY_0_5_ROUNDED_MD_BG_AMBER_50_DARK_BG_AMBER_950_50)}>
              <Clock className={cn(MCS.W_3_H_3_TEXT_C2410C_DARK_TEXT_AMBER_400_SHRINK_0)} />
              <span>
                {song.tempoBpm} {texts.BPM_UNIT}
              </span>
            </span>
          )}
          {song.mood && <span className={cn(MCS.TEXT_XS_FONT_MEDIUM_PX_2_PY_0_5_ROUNDED_MD_BG_EMERALD_50_DARK_BG_EMERALD_95)}>{song.mood}</span>}
        </div>
      </div>
      {song.lyrics && (
        <div className={cn(MCS.SPACE_Y_1_5_PT_0_5)}>
          <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_XS_FONT_BOLD_TEXT_SLATE_700_DARK_TEX)}>
            <span className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_FONT_MONO_TEXT_10PX_TEXT_PINK_600_DARK_TEXT_PINK)}>
              <FileText className={cn(SRT.SOURCE_TEXT_W_3_H_3)} />
              {texts.LYRICS_TITLE}
            </span>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopy(song.lyrics, SOURCE_TEMPLATE_LYRICS(String(index)), texts.COPY_LYRICS_SUCCESS)} className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC)} title={copiedKey === SOURCE_TEMPLATE_LYRICS(String(index)) ? texts.COPIED_LABEL : texts.COPY_LYRICS_BTN}>
              {copiedKey === SOURCE_TEMPLATE_LYRICS(String(index)) ? <Check className={cn(MCS.W_3_5_H_3_5_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
            </Button>
          </div>
          <pre className={cn(MCS.P_3_5_ROUNDED_XL_BG_SLATE_955_90_BORDER_BORDER_SLATE_800_90_TEXT_XS_FONT_SA)}>{song.lyrics}</pre>
        </div>
      )}
    </StudioCard>
  );
};
interface PlaylistSeoCardProps {
  seoOptions: SongSeoOption[];
  texts: MusicCreatorTexts;
  playlistUrl: string;
  columns?: 1 | 2 | 3;
}
const PlaylistSeoCard: React.FC<PlaylistSeoCardProps> = ({ seoOptions, texts, playlistUrl, columns = 3 }) => {
  const { copiedKey, copyText: handleCopy } = useMotionClipboard();
  const handleCopyFullOption = (opt: SongSeoOption, index: number) => {
    const trackOrder = getSeoTrackOrder(opt.description);
    const trackOrderSection = trackOrder ? SOURCE_TEMPLATE_SYMBOL_9(String(texts.SEO_TRACK_ORDER), String(trackOrder)) : MUSIC_CREATOR_RUNTIME.EMPTY;
    const fullText = SOURCE_TEMPLATE_SYMBOL_10(
      String(texts.formatOptionLabel(index + 1)),
      String(texts.formatScoreLabel(opt.seoScore)),
      String(texts.SEO_FIELD_TITLE),
      String(opt.title),
      String(texts.SEO_FIELD_DESCRIPTION),
      String(opt.description),
      String(trackOrderSection),
      String(texts.SEO_HASHTAGS_SECTION),
      String(opt.hashtags.join(SRT.SOURCE_TEXT_SYMBOL_52)),
      String(texts.SEO_TAGS_SECTION),
      String(opt.tags.join(SOURCE_TEXT_SYMBOL_10)),
    );
    handleCopy(fullText, SOURCE_TEMPLATE_SEO_ALL(String(index)), texts.COPY_SEO_OPTION_SUCCESS);
  };
  const handleExportText = async () => {
    const optionSections = _.map(seoOptions, (opt, index) => {
      const trackOrder = getSeoTrackOrder(opt.description);
      const trackOrderSection = trackOrder ? SOURCE_TEMPLATE_SYMBOL_9(String(texts.SEO_TRACK_ORDER), String(trackOrder)) : MUSIC_CREATOR_RUNTIME.EMPTY;
      return SOURCE_TEMPLATE_SYMBOL_10(
        String(texts.formatOptionLabel(index + 1)),
        String(texts.formatScoreLabel(opt.seoScore)),
        String(texts.SEO_FIELD_TITLE),
        String(opt.title),
        String(texts.SEO_FIELD_DESCRIPTION),
        String(opt.description),
        String(trackOrderSection),
        String(texts.SEO_HASHTAGS_SECTION),
        String(opt.hashtags.join(SRT.SOURCE_TEXT_SYMBOL_52)),
        String(texts.SEO_TAGS_SECTION),
        String(opt.tags.join(SOURCE_TEXT_SYMBOL_10)),
      );
    });
    const exportText = SOURCE_TEMPLATE_SYMBOL_11(String(texts.SEO_EXPORT_TITLE), String(texts.SEO_PLAYLIST_URL_LABEL), String(_.trim(playlistUrl) || texts.SEO_PLAYLIST_URL_EMPTY), String(optionSections.join(SUNO_AUTOMATION_CONFIG.SECTION_DIVIDER)));
    try {
      const saved = await saveMusicBlobWithDialog(new Blob([MCF.UTF8_BOM(exportText)], { type: SUNO_AUTOMATION_CONFIG.TEXT_PLAIN_UTF8 }), String(SUNO_AUTOMATION_CONFIG.SEO_EXPORT_FILENAME));
      if (saved) toast.success(texts.SEO_EXPORT_TXT_SUCCESS);
    } catch (error) {
      if (_.get(error, SOURCE_TEXT_NAME) !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
    }
  };
  const CopyFieldButton = ({ text, field, optionIndex, titleText }: { text: string; field: string; optionIndex: number; titleText?: string }) => {
    const key = SOURCE_TEMPLATE_SEO(String(optionIndex), String(field));
    const isCopied = copiedKey === key;
    return (
      <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopy(text, key, texts.COPY_SEO_FIELD_SUCCESS)} className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC)} title={isCopied ? texts.COPIED_LABEL : titleText || texts.COPY_FIELD_BTN}>
        {isCopied ? <Check className={cn(MCS.W_3_5_H_3_5_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
      </Button>
    );
  };
  const gridColumnsClass = columns === 3 ? SOURCE_TEXT_GRID_COLS_1_MD_GRID_COLS : columns === 2 ? SOURCE_TEXT_GRID_COLS_1_LG_GRID_COLS : SOURCE_TEXT_GRID_COLS_1;
  return (
    <StudioCard className={cn(MCS.ROUNDED_2XL_BORDER_BORDER_SLATE_800_80_BG_SLATE_900_60_P_4_SM_P_5_SHADOW_LG)}>
      <div className={cn(MCS.FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_200_2)}>
        <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2)}>
          <Sparkles className={cn(MCS.W_4_H_4_TEXT_FUCHSIA_500_SHRINK_0)} />
          <h3 className={cn(MCS.TEXT_SM_SM_TEXT_BASE_FONT_EXTRABOLD_TEXT_0F172A_DARK_TEXT_SLATE_100)}>{texts.PLAYLIST_SEO_TITLE}</h3>
        </div>
        <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(MCS.TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_A21CAF_DARK_TEXT_FUCHSIA_300_BG_FUCHSIA)}>{texts.SEO_OPTIONS_COUNT_BADGE}</span>
          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleExportText} disabled={_.isEmpty(seoOptions)} title={texts.SEO_EXPORT_TXT_TOOLTIP} className={cn(MCS.H_8_PX_3_ROUNDED_LG_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1_5_TEXT_XS)}>
            <Download className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
            <span>{texts.SEO_EXPORT_TXT_BTN}</span>
          </Button>
        </div>
      </div>
      <div className={cn(MCS.GRID_GAP_4_ITEMS_STRETCH, gridColumnsClass)}>
        {_.map(seoOptions, (opt, sIdx) => {
          const trackOrder = getSeoTrackOrder(opt.description);
          return (
            <StudioCard key={sIdx} className={cn(MCS.P_4_ROUNDED_2XL_BG_WHITE_70_DARK_BG_SLATE_955_90_BORDER_BORDER_SLATE_200_DA)}>
              <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_200_80_DARK_B)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W)}>
                  <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_PX_2_5_PY_0_5_ROUNDED_LG_BG_FUCHSIA)}>{texts.formatOptionLabel(sIdx + 1)}</span>
                  <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_1_PX_2_5_PY_0_5_ROUNDED_LG_BG_EMERALD_500_15_B)}>
                    <Sparkles className={cn(MCS.W_3_H_3_TEXT_EMERALD_600_DARK_TEXT_EMERALD_400)} />
                    <span>{texts.formatScoreLabel(opt.seoScore)}</span>
                  </span>
                </div>
                <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopyFullOption(opt, sIdx)} className={cn(MCS.BTN_ICON_TINY_W_7_H_7_MIN_W_28PX_MAX_W_28PX_MIN_H_28PX_MAX_H_28PX_P_0_ASPEC)} title={copiedKey === SOURCE_TEMPLATE_SEO_ALL(String(sIdx)) ? texts.COPIED_LABEL : texts.COPY_SEO_OPTION_BTN}>
                  {copiedKey === SOURCE_TEMPLATE_SEO_ALL(String(sIdx)) ? <Check className={cn(MCS.W_4_H_4_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_4_H_4_SHRINK_0)} />}
                </Button>
              </div>
              <div className={cn(MCS.SPACE_Y_2_5_FLEX_1_FLEX_FLEX_COL_JUSTIFY_BETWEEN)}>
                <div className={cn(MCS.SPACE_Y_2_5)}>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_SLATE_200)}>
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                      <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_500_DARK)}>
                        <FileText className={cn(MCS.W_3_H_3_TEXT_PURPLE_500)} />
                        <span>{texts.SEO_FIELD_TITLE}</span>
                      </span>
                      <CopyFieldButton text={opt.title} field={SOURCE_TEXT_TITLE} optionIndex={sIdx} />
                    </div>
                    <h4 className={cn(MCS.TEXT_XS_SM_TEXT_13PX_FONT_BLACK_TEXT_0F172A_DARK_TEXT_SLATE_100_LEADING_SNU)}>{opt.title}</h4>
                  </StudioCard>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_SLATE_200)}>
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                      <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_500_DARK)}>
                        <SlidersHorizontal className={cn(MCS.W_3_H_3_TEXT_SKY_500)} />
                        <span>{texts.SEO_FIELD_DESCRIPTION}</span>
                      </span>
                      <CopyFieldButton text={opt.description} field={SOURCE_TEXT_DESCRIPTION} optionIndex={sIdx} />
                    </div>
                    <p className={cn(MCS.TEXT_XS_TEXT_334155_DARK_TEXT_SLATE_300_LEADING_RELAXED_MAX_H_32_OVERFLOW_Y)}>{opt.description}</p>
                  </StudioCard>
                  {!_.isEmpty(trackOrder) && (
                    <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_SLATE_200)}>
                      <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                        <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_500_DARK)}>
                          <Music2 className={cn(MCS.W_3_H_3_TEXT_FUCHSIA_500)} />
                          <span>{texts.SEO_TRACK_ORDER}</span>
                        </span>
                        <CopyFieldButton text={trackOrder} field={SOURCE_TEXT_TRACK_ORDER} optionIndex={sIdx} />
                      </div>
                      <p className={cn(MCS.TEXT_XS_TEXT_334155_DARK_TEXT_SLATE_300_LEADING_RELAXED_MAX_H_24_OVERFLOW_Y)}>{trackOrder}</p>
                    </StudioCard>
                  )}
                </div>
                <div className={cn(MCS.GRID_GRID_COLS_1_2XL_GRID_COLS_2_GAP_2_5_PT_1)}>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_SLATE_200_2)}>
                    <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_2)}>
                      <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                        <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_500_DARK)}>
                          <span className={cn(MCS.FONT_BOLD_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400)}>{texts.HASH_SYMBOL}</span>
                          <span>
                            {texts.HASHTAGS_LABEL}
                            {SOURCE_TEXT_SYMBOL_11}
                            {opt.hashtags.length}
                            {SOURCE_TEXT_SYMBOL_12}
                          </span>
                        </span>
                        <CopyFieldButton text={opt.hashtags.join(SRT.SOURCE_TEXT_SYMBOL_52)} field={SOURCE_TEXT_HASHTAGS} optionIndex={sIdx} />
                      </div>
                      <div className={cn(MCS.FLEX_FLEX_WRAP_GAP_X_2_5_GAP_Y_2_MAX_H_24_OVERFLOW_Y_AUTO_SCROLLBAR_NONE_SC)}>
                        {_.map(opt.hashtags, (tag, i) => (
                          <span key={i} className={cn(MCS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_7E22CE_DARK_TEXT_PURPLE_300_SELECT_ALL_H)}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </StudioCard>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_SLATE_200_2)}>
                    <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_2)}>
                      <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                        <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_500_DARK)}>
                          <Search className={cn(MCS.W_3_H_3_TEXT_EMERALD_500)} />
                          <span>
                            {texts.TAGS_LABEL}
                            {SOURCE_TEXT_SYMBOL_11}
                            {opt.tags.length}
                            {SOURCE_TEXT_SYMBOL_12}
                          </span>
                        </span>
                        <CopyFieldButton text={opt.tags.join(SOURCE_TEXT_SYMBOL_10)} field={SOURCE_TEXT_TAGS} optionIndex={sIdx} />
                      </div>
                      <p className={cn(MCS.TEXT_10PX_FONT_MONO_TEXT_475569_DARK_TEXT_SLATE_300_LEADING_RELAXED_MAX_H_2)}>{opt.tags.join(SOURCE_TEXT_SYMBOL_10)}</p>
                    </div>
                  </StudioCard>
                </div>
              </div>
            </StudioCard>
          );
        })}
      </div>
    </StudioCard>
  );
};
export default function MusicCreator({ currentLang = SOURCE_TEXT_VI }: MusicCreatorProps) {
  const texts = MUSIC_CREATOR_TEXTS[currentLang] || MUSIC_CREATOR_TEXTS.vi;
  const [initialState] = useState<PersistedMusicCreatorState>(readMusicCreatorState);
  const [initialSavedStyles] = useState<SavedMusicStyle[]>(readSavedStyles);
  const [style, setStyle] = useState(() => initialState.style || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [styleDraft, setStyleDraft] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [savedStyles, setSavedStyles] = useState<SavedMusicStyle[]>(initialSavedStyles);
  const [styleName, setStyleName] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [editingStyleIndex, setEditingStyleIndex] = useState<number | null>(null);
  const [styleToDelete, setStyleToDelete] = useState<SavedMusicStyle | null>(null);
  const [copiedStyleIndex, setCopiedStyleIndex] = useState<number | null>(null);
  const [copiedInspoIndex, setCopiedInspoIndex] = useState<number | null>(null);
  const [outputCount, setOutputCount] = useState<number>(initialState.outputCount || MUSIC_CREATOR_CONSTANTS.DEFAULT_SONG_COUNT);
  const [referenceSongs, setReferenceSongs] = useState(initialState.referenceSongs || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [provider, setProvider] = useState<AiPlanningFallbackProvider>(initialState.provider || AiPlanningFallbackProvider.ChatGptUi);
  const [model, setModel] = useState<AiPlanningChatModel>(initialState.model || AiPlanningChatModel.ChatGptAuto);
  const [executionMode, setExecutionMode] = useState<AiPlanningExecutionMode>(initialState.executionMode || AiPlanningExecutionMode.RoomOnly);
  const [chromeHeadless, setChromeHeadless] = useState(initialState.chromeHeadless ?? true);
  const musicRunIdRef = useRef<string | null>(null);
  const musicResumeRef = useRef<{ signature: string; runId: string } | null>(null);
  const musicAbortControllerRef = useRef<AbortController | null>(null);
  const thumbnailAbortControllerRef = useRef<AbortController | null>(null);
  const thumbnailRunIdRef = useRef<string | null>(null);
  const thumbnailStoppedRef = useRef(false);
  const videoBackgroundAbortControllerRef = useRef<AbortController | null>(null);
  const videoBackgroundRunIdRef = useRef<string | null>(null);
  const musicStoppedByUserRef = useRef(false);
  const sunoAbortControllerRef = useRef<AbortController | null>(null);
  const sunoPendingPlaylistRef = useRef<{ songIds: string[]; playlistName: string; sourceTitle: string; testOnly: boolean } | null>(null);
  const sunoDownloadAbortControllerRef = useRef<AbortController | null>(null);
  const sunoDownloadStoppedByUserRef = useRef(false);
  const sunoDownloadRunIdRef = useRef<string | null>(null);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(initialState.isAiConfigOpen ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicProgress, setMusicProgress] = useState<MusicPlanProgress[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [generationError, setGenerationError] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [isRegeneratingSeo, setIsRegeneratingSeo] = useState(false);
  const [songs, setSongs] = useState<GeneratedSong[]>(initialState.songs || []);
  const [styleAnalysis, setStyleAnalysis] = useState<MusicStyleAnalysis | undefined>(initialState.styleAnalysis);
  const [playlistSeoOptions, setPlaylistSeoOptions] = useState<SongSeoOption[]>(initialState.seoSchemaVersion === SUNO_AUTOMATION_CONFIG.MUSIC_SEO_SCHEMA_VERSION ? initialState.playlistSeoOptions || [] : []);
  const [curatedDownloadedTracks, setCuratedDownloadedTracks] = useState<CuratedDownloadedTrack[]>(initialState.curatedDownloadedTracks || []);
  const displayedSeoOptions = _.isEqual(curatedDownloadedTracks.length, songs.length) && !_.isEmpty(curatedDownloadedTracks) ? _.map(playlistSeoOptions, (option) => ({ ...option, description: replaceSeoTracklistWithTimestamps(option.description, curatedDownloadedTracks) })) : playlistSeoOptions;
  useEffect(() => {
    if (_.isEmpty(songs) || _.isEmpty(playlistSeoOptions)) return;
    if (_.isEqual(curatedDownloadedTracks.length, songs.length)) return;
    const restoredOptions = _.map(playlistSeoOptions, (option) => ({ ...option, description: restoreSeoTimestampTitles(option.description, songs) }));
    if (!_.isEqual(restoredOptions, playlistSeoOptions)) setPlaylistSeoOptions(restoredOptions);
  }, [songs, playlistSeoOptions, curatedDownloadedTracks]);
  const [thumbnailDescription, setThumbnailDescription] = useState(initialState.thumbnailDescription || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [thumbnailReference, setThumbnailReference] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [thumbnailReferenceName, setThumbnailReferenceName] = useState(initialState.thumbnailReferenceName || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isNormalizingThumbnailNote, setIsNormalizingThumbnailNote] = useState(false);
  const [isCreatingSuno, setIsCreatingSuno] = useState(false);
  const [isCreatingSunoTest, setIsCreatingSunoTest] = useState(false);
  const [sunoTestPlaylistUrl, setSunoTestPlaylistUrl] = useState(initialState.sunoTestPlaylistUrl || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [sunoTestTrackIds, setSunoTestTrackIds] = useState<string[]>(initialState.sunoTestTrackIds || []);
  const [sunoPlaylistUrl, setSunoPlaylistUrl] = useState(initialState.sunoPlaylistUrl || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [downloadPlaylistUrl, setDownloadPlaylistUrl] = useState(initialState.downloadPlaylistUrl || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [sunoTrackIds, setSunoTrackIds] = useState<string[]>(initialState.sunoTrackIds || []);
  const [sunoDownloadFormat, setSunoDownloadFormat] = useState<SunoDownloadFormat>(initialState.sunoDownloadFormat || SOURCE_TEXT_WAV);
  const [sunoEvaluateTracks, setSunoEvaluateTracks] = useState(initialState.sunoEvaluateTracks ?? true);
  const [isDownloadingSuno, setIsDownloadingSuno] = useState(false);
  const [sunoDownloadError, setSunoDownloadError] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [isCopiedPlaylistUrl, setIsCopiedPlaylistUrl] = useState(false);
  const [sunoInspo, setSunoInspo] = useState(initialState.sunoInspo || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [sunoInspoDraft, setSunoInspoDraft] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [savedInspos, setSavedInspos] = useState<SavedMusicInspo[]>(readSavedInspos);
  const [inspoName, setInspoName] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [editingInspoIndex, setEditingInspoIndex] = useState<number | null>(null);
  const [inspoToDelete, setInspoToDelete] = useState<SavedMusicInspo | null>(null);
  const [sunoSettings, setSunoSettings] = useState<SunoSettings | undefined>(initialState.sunoSettings);
  const [sunoSettingsAnalysis, setSunoSettingsAnalysis] = useState<SunoSettingsAnalysis | undefined>(initialState.sunoSettingsAnalysis);
  const [downloadedMusicTracks, setDownloadedMusicTracks] = useState<DownloadedMusicTrack[]>(initialState.downloadedMusicTracks || []);
  const [videoBackgroundDescription, setVideoBackgroundDescription] = useState(initialState.videoBackgroundDescription || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [videoBackgroundReference, setVideoBackgroundReference] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [videoBackgroundReferenceName, setVideoBackgroundReferenceName] = useState(initialState.videoBackgroundReferenceName || MUSIC_CREATOR_RUNTIME.EMPTY);
  const [showVideoTrackList, setShowVideoTrackList] = useState(initialState.showVideoTrackList ?? true);
  const [generatedVideoBackground, setGeneratedVideoBackground] = useState<string>(MUSIC_CREATOR_RUNTIME.EMPTY);
  const [isGeneratingVideoBackground, setIsGeneratingVideoBackground] = useState(false);
  const [isNormalizingVideoBackgroundNote, setIsNormalizingVideoBackgroundNote] = useState(false);
  const { copiedKey, copyText } = useMotionClipboard();
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoBackgroundFileInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    void Promise.all([readMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_REFERENCE), readMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED), readMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND), readMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND_REFERENCE)])
      .then(([reference, generated, videoBackground, videoReference]) => {
        if (reference) setThumbnailReference(reference);
        if (generated) setGeneratedThumbnail(generated);
        if (videoBackground) setGeneratedVideoBackground(videoBackground);
        if (videoReference) setVideoBackgroundReference(videoReference);
      })
      .catch(() => undefined);
  }, []);
  const [viewMode, setViewMode] = useState<ResultViewMode>(initialState.viewMode || SOURCE_TEXT_LYRICS);
  const [selectedSeoSongIndex, setSelectedSeoSongIndex] = useState<number>(initialState.selectedSeoSongIndex || 0);
  useEffect(() => {
    const saveState = _.debounce(() => {
      jsonUtils.setItem(SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY, {
        style,
        outputCount,
        referenceSongs,
        provider,
        model,
        executionMode,
        chromeHeadless,
        isAiConfigOpen,
        songs,
        songTitleSchemaVersion: SUNO_AUTOMATION_CONFIG.MUSIC_SONG_TITLE_SCHEMA_VERSION,
        styleAnalysis,
        playlistSeoOptions,
        seoSchemaVersion: SUNO_AUTOMATION_CONFIG.MUSIC_SEO_SCHEMA_VERSION,
        thumbnailDescription,
        thumbnailReferenceName,
        viewMode,
        selectedSeoSongIndex,
        sunoPlaylistUrl,
        sunoTestPlaylistUrl,
        sunoTestTrackIds,
        downloadPlaylistUrl,
        sunoTrackIds,
        curatedDownloadedTracks,
        sunoDownloadFormat,
        sunoEvaluateTracks,
        sunoInspo,
        sunoSettings,
        sunoSettingsAnalysis,
        downloadedMusicTracks,
        videoBackgroundDescription,
        videoBackgroundReferenceName,
        showVideoTrackList,
      } satisfies PersistedMusicCreatorState);
    }, 250);
    saveState();
    return () => saveState.cancel();
  }, [
    style,
    outputCount,
    referenceSongs,
    provider,
    model,
    executionMode,
    chromeHeadless,
    isAiConfigOpen,
    songs,
    styleAnalysis,
    playlistSeoOptions,
    thumbnailDescription,
    thumbnailReferenceName,
    viewMode,
    selectedSeoSongIndex,
    sunoPlaylistUrl,
    sunoTestPlaylistUrl,
    sunoTestTrackIds,
    downloadPlaylistUrl,
    sunoTrackIds,
    curatedDownloadedTracks,
    sunoDownloadFormat,
    sunoEvaluateTracks,
    sunoInspo,
    sunoSettings,
    sunoSettingsAnalysis,
    downloadedMusicTracks,
    videoBackgroundDescription,
    videoBackgroundReferenceName,
    showVideoTrackList,
  ]);
  const persistStyles = (nextStyles: SavedMusicStyle[]) => {
    setSavedStyles(nextStyles);
    jsonUtils.setItem(SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY, nextStyles);
  };
  const handleEditStyle = (index: number) => {
    if (!savedStyles[index]) return;
    setEditingStyleIndex(index);
    setStyle(savedStyles[index].content);
    setStyleDraft(savedStyles[index].content);
    setStyleName(savedStyles[index].title);
  };
  const handleCopyStyle = (savedStyle: SavedMusicStyle, index: number) => {
    navigator.clipboard.writeText(savedStyle.content);
    setCopiedStyleIndex(index);
    toast.success(texts.COPY_STYLE_SUCCESS);
    window.setTimeout(() => setCopiedStyleIndex(null), 2000);
  };
  const handleCancelStyleEdit = () => {
    setEditingStyleIndex(null);
    setStyleDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
    setStyleName(MUSIC_CREATOR_RUNTIME.EMPTY);
  };
  const handleSaveStyle = () => {
    const nextContent = _.trim(styleDraft);
    if (_.isEmpty(nextContent)) return;
    const nextTitle = _.trim(styleName) || _.truncate(_.split(nextContent, SUNO_AUTOMATION_PATTERNS.STYLE_SPLIT_SEPARATORS)[0], { length: 32 });
    const nextItem = { title: nextTitle, content: nextContent };
    const nextStyles = editingStyleIndex === null ? [...savedStyles, nextItem] : _.map(savedStyles, (item, index) => (index === editingStyleIndex ? nextItem : item));
    persistStyles(nextStyles);
    setStyle(nextContent);
    setEditingStyleIndex(null);
    setStyleDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
    setStyleName(MUSIC_CREATOR_RUNTIME.EMPTY);
    toast.success(texts.STYLE_SAVE_SUCCESS);
  };
  const persistInspos = (items: SavedMusicInspo[]) => {
    setSavedInspos(items);
    jsonUtils.setItem(SUNO_AUTOMATION_CONFIG.MUSIC_INSPO_LIBRARY_KEY, items);
  };
  const handleSaveInspo = () => {
    const content = _.trim(sunoInspoDraft);
    if (_.isEmpty(content)) return;
    const item = { title: _.trim(inspoName) || content, content };
    persistInspos(editingInspoIndex === null ? [...savedInspos, item] : _.map(savedInspos, (value, index) => (index === editingInspoIndex ? item : value)));
    setSunoInspo(content);
    setEditingInspoIndex(null);
    setSunoInspoDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
    setInspoName(MUSIC_CREATOR_RUNTIME.EMPTY);
    toast.success(texts.INSPO_SAVE_SUCCESS);
  };
  const handleCancelInspoEdit = () => {
    setEditingInspoIndex(null);
    setInspoName(MUSIC_CREATOR_RUNTIME.EMPTY);
    setSunoInspoDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
  };
  const confirmDeleteInspo = () => {
    if (!inspoToDelete) return;
    persistInspos(_.reject(savedInspos, (item) => _.isEqual(item, inspoToDelete)));
    if (_.isEqual(sunoInspo, inspoToDelete.content)) setSunoInspo(MUSIC_CREATOR_RUNTIME.EMPTY);
    setInspoToDelete(null);
  };
  const handleDeleteStyle = (savedStyle: SavedMusicStyle) => {
    const nextStyles = _.reject(savedStyles, (item) => _.isEqual(item.content, savedStyle.content));
    persistStyles(nextStyles);
    if (_.isEqual(style, savedStyle.content)) {
      setStyle(MUSIC_CREATOR_RUNTIME.EMPTY);
      setStyleDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
      setStyleName(MUSIC_CREATOR_RUNTIME.EMPTY);
      setEditingStyleIndex(null);
    }
  };
  const confirmDeleteStyle = () => {
    if (!styleToDelete) return;
    handleDeleteStyle(styleToDelete);
    setStyleToDelete(null);
    toast.success(texts.STYLE_DELETE_SUCCESS);
  };
  const handleFillSampleReferences = () => {
    setReferenceSongs(_.join(MUSIC_CREATOR_CONSTANTS.SAMPLE_REFERENCES, SRT.SOURCE_TEXT_SYMBOL_56));
    toast.success(texts.QUICK_FILL_LABEL);
  };
  const handleTrySampleTemplate = () => {
    setStyle(MUSIC_CREATOR_CONSTANTS.PRESET_STYLES[0]);
    setReferenceSongs(_.join(MUSIC_CREATOR_CONSTANTS.SAMPLE_REFERENCES, SRT.SOURCE_TEXT_SYMBOL_56));
    setOutputCount(MUSIC_CREATOR_CONSTANTS.DEFAULT_SONG_COUNT);
    toast.success(texts.TRY_SAMPLE_BTN);
  };
  const handleCopyAllLyrics = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCopy);
    if (_.isEmpty(songs)) return;
    const allContent = _.map(songs, (song) => song.lyrics).join(SOURCE_TEXT_SYMBOL_13);
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SUCCESS);
  };
  const handleCopyAllSeo = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCopy);
    if (_.isEmpty(displayedSeoOptions)) return;
    const allContent = _.map(displayedSeoOptions, (opt, idx) =>
      SOURCE_TEMPLATE_SYMBOL_12(String(texts.formatOptionLabel(idx + 1)), String(texts.formatScoreLabel(opt.seoScore)), String(texts.SEO_FIELD_TITLE), String(opt.title), String(texts.SEO_FIELD_DESCRIPTION), String(opt.description), String(texts.HASHTAGS_LABEL), String(opt.hashtags.join(SRT.SOURCE_TEXT_SYMBOL_52)), String(texts.TAGS_LABEL), String(opt.tags.join(SOURCE_TEXT_SYMBOL_10))),
    ).join(SOURCE_TEXT_SYMBOL_14);
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SEO_SUCCESS);
  };
  const handleGenerate = async () => {
    if (isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanStart, outputCount);
    musicStoppedByUserRef.current = false;
    thumbnailStoppedRef.current = false;
    setGenerationError(MUSIC_CREATOR_RUNTIME.EMPTY);
    const trimmedStyle = _.trim(style);
    const referenceSource = _.trim(referenceSongs);
    const previousSongs = songs;
    const previousStyleAnalysis = styleAnalysis;
    const previousSunoSettings = sunoSettings;
    const previousSunoSettingsAnalysis = sunoSettingsAnalysis;
    const previousPlaylistSeoOptions = playlistSeoOptions;
    const previousCuratedDownloadedTracks = curatedDownloadedTracks;
    const previousGeneratedThumbnail = generatedThumbnail;
    const previousDownloadedMusicTracks = downloadedMusicTracks;
    const previousGeneratedVideoBackground = generatedVideoBackground;
    setViewMode(SOURCE_TEXT_LYRICS);
    setIsLoading(true);
    setMusicProgress([{ stage: MUSIC_PLAN.STAGES.INITIALIZE, completedSongs: 0, totalSongs: outputCount }]);
    setSunoPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
    setDownloadPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
    setSunoTestPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
    setSunoTrackIds([]);
    const runSignature = jsonUtils.safeStringify([outputCount, trimmedStyle, referenceSource, sunoInspo, provider, model]);
    const runId = musicResumeRef.current?.signature === runSignature ? musicResumeRef.current.runId : SOURCE_TEMPLATE_MUSIC(String(Date.now()), String(Math.random().toString(36).slice(2)));
    musicResumeRef.current = { signature: runSignature, runId };
    musicRunIdRef.current = runId;
    const abortController = new AbortController();
    musicAbortControllerRef.current = abortController;
    let receivedSongs = false;
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_PLAN, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ requestedSongCount: outputCount, streamProgress: true, style: trimmedStyle, referenceSongs: _.isEmpty(referenceSource) ? [] : [referenceSource], projectId: runId, requestId: runId, thumbnailReference, thumbnailReferenceName, thumbnailDescription, sunoInspo, aiExecution: { provider, model, executionMode, chromeHeadless } }),
        signal: abortController.signal,
      });
      const result = await readMusicPlanResponse(response, ({ progress, data }) => {
        if (abortController.signal.aborted) return;
        setMusicProgress((items) => [...items.filter((item) => item.stage !== progress.stage), { ...items.find((item) => item.stage === progress.stage), ...progress }]);
        if (data?.styleAnalysis) setStyleAnalysis(data.styleAnalysis);
        if (data?.songs?.length) {
          if (!receivedSongs) {
            receivedSongs = true;
            setPlaylistSeoOptions([]);
            setSunoSettings(undefined);
            setSunoSettingsAnalysis(undefined);
            setCuratedDownloadedTracks([]);
            setDownloadedMusicTracks([]);
            setGeneratedThumbnail(MUSIC_CREATOR_RUNTIME.EMPTY);
            setGeneratedVideoBackground(MUSIC_CREATOR_RUNTIME.EMPTY);
            setPreviewThumbnail(null);
            void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
            void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
          }
          setSongs(data.songs);
        }
        if (data?.sunoSettings) setSunoSettings(data.sunoSettings);
        if (data?.sunoSettingsAnalysis) setSunoSettingsAnalysis(data.sunoSettingsAnalysis);
      });
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || SOURCE_TEMPLATE_HTTP(String(texts.ERROR_GENERATION_FAILED), String(response.status)));
      }
      const generatedSongs = _.get(result, SOURCE_TEXT_DATA_SONGS, []) as GeneratedSong[];
      const generatedStyleAnalysis = _.get(result, SOURCE_TEXT_DATA_STYLEANALYSIS) as MusicStyleAnalysis;
      const generatedPlaylistSeo = _.get(result, SOURCE_TEXT_DATA_PLAYLISTSEOOPTIONS, []) as SongSeoOption[];
      const seoWarning = _.toString(_.get(result, SOURCE_TEXT_DATA_SEOWARNING, MUSIC_CREATOR_RUNTIME.EMPTY));
      setSunoSettings(_.get(result, SOURCE_TEXT_DATA_SUNOSETTINGS) as SunoSettings);
      setSunoSettingsAnalysis(_.get(result, SOURCE_TEXT_DATA_SUNOSETTINGSANALYSIS) as SunoSettingsAnalysis);
      setSongs(generatedSongs);
      setStyleAnalysis(generatedStyleAnalysis);
      setCuratedDownloadedTracks([]);
      setDownloadedMusicTracks([]);
      setSunoDownloadError(MUSIC_CREATOR_RUNTIME.EMPTY);
      setPlaylistSeoOptions(generatedPlaylistSeo);
      setGeneratedThumbnail(MUSIC_CREATOR_RUNTIME.EMPTY);
      setGeneratedVideoBackground(MUSIC_CREATOR_RUNTIME.EMPTY);
      setShowVideoTrackList(true);
      setPreviewThumbnail(null);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
      setSelectedSeoSongIndex(0);
      musicResumeRef.current = null;
      sunoPendingPlaylistRef.current = null;
      toast.success(texts.formatGenerateBtn(generatedSongs.length));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanDone, generatedSongs.length);
      if (seoWarning && _.isEmpty(generatedPlaylistSeo)) toast.error(seoWarning);
      if (thumbnailStoppedRef.current) {
        setIsGeneratingThumbnail(false);
      } else
        void (async () => {
          setIsGeneratingThumbnail(true);
          const imageAbortController = new AbortController();
          const imageRunId = SOURCE_TEMPLATE_MUSIC_COVER(String(Date.now()), String(Math.random().toString(36).slice(2)));
          thumbnailAbortControllerRef.current = imageAbortController;
          thumbnailRunIdRef.current = imageRunId;
          try {
            const thumbnailResponse = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
              method: HTTP_METHODS.POST,
              headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
              body: jsonUtils.safeStringify({ songs: generatedSongs, style: trimmedStyle, styleAnalysis: generatedStyleAnalysis, sourceContext: referenceSource, playlistSeoOptions: generatedPlaylistSeo, thumbnailDescription, thumbnailReference, thumbnailReferenceName, chromeHeadless, aiExecution: { provider, model }, imageRunId }),
              signal: imageAbortController.signal,
            });
            const thumbnailResult = await thumbnailResponse.json();
            imageAbortController.signal.throwIfAborted();
            const imageUrl = _.toString(thumbnailResult.thumbnail);
            if (!thumbnailResponse.ok || !thumbnailResult.success || _.isEmpty(imageUrl)) {
              throw new Error(thumbnailResult.warning || texts.THUMBNAIL_GENERATE_ERROR);
            }
            setGeneratedThumbnail(imageUrl);
            await writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, imageUrl);
            toast.success(texts.THUMBNAIL_GENERATE_SUCCESS);
            recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverDone);
          } catch (error: any) {
            if (!imageAbortController.signal.aborted) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverFail);
            if (!imageAbortController.signal.aborted) toast.error(_.toString(error?.message || texts.THUMBNAIL_GENERATE_ERROR));
          } finally {
            if (thumbnailAbortControllerRef.current === imageAbortController) {
              thumbnailAbortControllerRef.current = null;
              thumbnailRunIdRef.current = null;
              setIsGeneratingThumbnail(false);
            }
          }
        })();
    } catch (err: any) {
      if (!musicStoppedByUserRef.current) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanFail);
      if (!receivedSongs) {
        setSongs(previousSongs);
        setStyleAnalysis(previousStyleAnalysis);
        setSunoSettings(previousSunoSettings);
        setSunoSettingsAnalysis(previousSunoSettingsAnalysis);
        setPlaylistSeoOptions(previousPlaylistSeoOptions);
        setCuratedDownloadedTracks(previousCuratedDownloadedTracks);
        setGeneratedThumbnail(previousGeneratedThumbnail);
        setDownloadedMusicTracks(previousDownloadedMusicTracks);
        setGeneratedVideoBackground(previousGeneratedVideoBackground);
      }
      setMusicProgress((items) => [...items.filter((item) => item.stage !== MUSIC_PLAN.STAGES.ERROR), { stage: musicStoppedByUserRef.current ? MUSIC_PLAN.STAGES.STOPPED : MUSIC_PLAN.STAGES.ERROR, completedSongs: items.at(-1)?.completedSongs || 0, totalSongs: outputCount }]);
      setIsGeneratingThumbnail(false);
      if (musicStoppedByUserRef.current) musicResumeRef.current = null;
      else {
        const message = _.toString(err?.message || texts.ERROR_GENERATION_FAILED);
        setGenerationError(message);
        toast.error(message, { duration: 10000 });
      }
    } finally {
      musicAbortControllerRef.current = null;
      musicRunIdRef.current = null;
      setIsLoading(false);
    }
  };
  const handleRegenerateSeo = async () => {
    const activeStyle = _.trim(style);
    if (_.isEmpty(songs) || isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicSeoStart);
    setViewMode(SOURCE_TEXT_SEO);
    setIsRegeneratingSeo(true);
    const runId = SOURCE_TEMPLATE_SEO_2(String(SUNO_AUTOMATION_CONFIG.RUN_ID_PREFIX), String(Date.now()), String(Math.random().toString(36).slice(2)));
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SEO_REGENERATE, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ songs, style: activeStyle, referenceSource: referenceSongs, styleAnalysis, projectId: runId, requestId: runId, aiExecution: { provider, model, executionMode, chromeHeadless } }) });
      const result = await response.json();
      const regeneratedOptions = _.castArray(result.playlistSeoOptions || []) as SongSeoOption[];
      if (!response.ok || !result.success || _.isEmpty(regeneratedOptions)) throw new Error(result.error || texts.SEO_REGENERATE_ERROR);
      setPlaylistSeoOptions(regeneratedOptions);
      setSelectedSeoSongIndex(0);
      toast.success(texts.SEO_REGENERATE_SUCCESS);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicSeoDone);
    } catch (error: any) {
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicSeoFail);
      toast.error(_.toString(error?.message || texts.SEO_REGENERATE_ERROR));
    } finally {
      setIsRegeneratingSeo(false);
    }
  };
  const handleCancelGeneration = async () => {
    if (!isLoading || isStopping) return;
    setIsStopping(true);
    musicStoppedByUserRef.current = true;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanStop);
    musicResumeRef.current = null;
    const runId = musicRunIdRef.current;
    musicAbortControllerRef.current?.abort();
    try {
      if (runId) {
        const response = await fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ pipelineRunId: runId, closeBrowser: true, roomProvider: provider, roomProjectId: runId }) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || texts.STOP_BROWSER_CLOSE_ERROR);
      }
      toast.info(texts.STOPPED_TOAST);
    } catch (error) {
      const message = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, texts.STOP_BROWSER_CLOSE_ERROR));
      setGenerationError(message);
      toast.error(message);
    } finally {
      setIsStopping(false);
    }
  };
  const createSunoMusic = async (testOnly: boolean) => {
    if (_.isEmpty(songs) || isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, testOnly ? WORKFLOW_ACTIVITY_EVENT.musicTestStart : WORKFLOW_ACTIVITY_EVENT.musicSunoStart, testOnly ? 1 : songs.length);
    const abortController = new AbortController();
    sunoAbortControllerRef.current = abortController;
    setIsCreatingSuno(true);
    setIsCreatingSunoTest(testOnly);
    if (testOnly) {
      setSunoTestPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
      setSunoTestTrackIds([]);
    } else {
      setSunoPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
      setDownloadPlaylistUrl(MUSIC_CREATOR_RUNTIME.EMPTY);
      setCuratedDownloadedTracks([]);
    }
    try {
      const requestedSongs = testOnly ? _.take(songs, 1) : songs;
      const sourceTitle = testOnly ? requestedSongs[0]?.title : playlistSeoOptions[0]?.title || requestedSongs[0]?.title;
      const pending = sunoPendingPlaylistRef.current;
      const canResume = pending?.sourceTitle === sourceTitle && pending.testOnly === testOnly;
      const playlistName = canResume ? pending.playlistName : formatSunoPlaylistName(sourceTitle, testOnly, _.slice(crypto.randomUUID().split(SOURCE_TEXT_SYMBOL_15), 0, 2).join(MUSIC_CREATOR_RUNTIME.EMPTY).toUpperCase());
      const resumeSongIds = canResume ? pending.songIds : [];
      if (_.isEmpty(resumeSongIds) && !testOnly) setSunoTrackIds([]);
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_CREATE, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ songs: _.isEmpty(resumeSongIds) ? requestedSongs : [], initialSongIds: resumeSongIds, style, inspo: sunoInspo, sunoSettings, evaluateTracks: testOnly ? false : sunoEvaluateTracks, playlistName }),
        signal: abortController.signal,
      });
      const result = await response.json();
      const createdSongIds = _.map(_.castArray(result.createdSongIds || []), _.toString);
      if (!response.ok && !_.isEmpty(createdSongIds)) {
        sunoPendingPlaylistRef.current = { songIds: createdSongIds, playlistName, sourceTitle, testOnly };
        if (!testOnly) setSunoTrackIds(createdSongIds);
      }
      if (!response.ok || !result.success || _.isEmpty(result.playlistUrl)) throw new Error(result.error || texts.SUNO_CREATE_ERROR);
      sunoPendingPlaylistRef.current = null;
      const createdPlaylistUrl = _.toString(result.playlistUrl);
      if (testOnly) {
        setSunoTestPlaylistUrl(createdPlaylistUrl);
        setSunoTestTrackIds(createdSongIds);
        toast.success(texts.SUNO_TEST_CREATE_SUCCESS);
        recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicTestDone);
      } else {
        setSunoPlaylistUrl(createdPlaylistUrl);
        setDownloadPlaylistUrl(createdPlaylistUrl);
        setSunoTrackIds(createdSongIds);
        toast.success(texts.SUNO_CREATE_SUCCESS);
        recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicSunoDone);
      }
    } catch (error: any) {
      if (error?.name !== MUSIC_CREATOR_RUNTIME.ABORT_ERROR_NAME) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, testOnly ? WORKFLOW_ACTIVITY_EVENT.musicTestFail : WORKFLOW_ACTIVITY_EVENT.musicSunoFail, undefined, _.toString(error?.message || texts.SUNO_CREATE_ERROR));
      if (error?.name !== MUSIC_CREATOR_RUNTIME.ABORT_ERROR_NAME) toast.error(_.toString(error?.message || texts.SUNO_CREATE_ERROR));
    } finally {
      sunoAbortControllerRef.current = null;
      setIsCreatingSuno(false);
      setIsCreatingSunoTest(false);
    }
  };
  const handleCreateSunoMusic = () => createSunoMusic(false);
  const handleCreateSunoTest = () => createSunoMusic(true);
  const handleCancelSunoMusic = () => {
    if (!isCreatingSuno) return;
    sunoAbortControllerRef.current?.abort();
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicSunoStop);
    void fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_CANCEL, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON } }).catch(() => undefined);
    toast.info(texts.SUNO_CANCELLED_TOAST);
  };
  const handleCopyPlaylistUrl = () => {
    const activePlaylistUrl = _.trim(downloadPlaylistUrl) || sunoPlaylistUrl;
    if (!activePlaylistUrl) return;
    navigator.clipboard.writeText(activePlaylistUrl);
    setIsCopiedPlaylistUrl(true);
    toast.success(texts.SUNO_PLAYLIST_COPY_SUCCESS);
    setTimeout(() => setIsCopiedPlaylistUrl(false), 2000);
  };
  const handleDownloadSunoMusic = async () => {
    if (isBusy) return;
    const requestedPlaylistUrl = _.trim(downloadPlaylistUrl);
    const isTestPlaylistDownload = !requestedPlaylistUrl && !sunoPlaylistUrl && Boolean(sunoTestPlaylistUrl);
    const activePlaylistUrl = requestedPlaylistUrl || sunoPlaylistUrl || sunoTestPlaylistUrl;
    if (_.isEmpty(activePlaylistUrl) || isDownloadingSuno) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicDownloadStart);
    if (sunoEvaluateTracks && !isTestPlaylistDownload && provider !== AiPlanningFallbackProvider.GeminiChat) {
      setSunoDownloadError(SUNO_AUTOMATION_TEXTS.TRACK_EVALUATION_ROOM_REQUIRED_ERR);
      toast.error(SUNO_AUTOMATION_TEXTS.TRACK_EVALUATION_ROOM_REQUIRED_ERR);
      return;
    }
    sunoDownloadStoppedByUserRef.current = false;
    setSunoDownloadError(MUSIC_CREATOR_RUNTIME.EMPTY);
    const abortController = new AbortController();
    sunoDownloadAbortControllerRef.current = abortController;
    setIsDownloadingSuno(true);
    try {
      const folderResponse = await fetch(API_ROUTES.PIPELINE_SELECT_FOLDER, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, signal: abortController.signal });
      const folderResult = await folderResponse.json();
      const folderPath = _.trim(_.toString(folderResult.folderPath));
      if (!folderResponse.ok || !folderResult.success || _.isEmpty(folderPath)) return;
      const tracks = isTestPlaylistDownload
        ? _.map(_.take(sunoTestTrackIds, 1), (songId) => ({ songId, title: SOURCE_TEMPLATE_1_1(String(songs[0]?.title || texts.SUNO_TRACK_LABEL)) }))
        : requestedPlaylistUrl
          ? []
          : _.map(sunoTrackIds, (songId, index) => {
              const songIndex = Math.floor(index / 2);
              const songNumber = songIndex + 1;
              const variantSuffix = SOURCE_TEMPLATE_SYMBOL_13(String((index % 2) + 1));
              return { songId, title: SOURCE_TEMPLATE_SYMBOL_14(String(songNumber), String(songs[songIndex]?.title || MCF.JOIN_WITH_SPACE(texts.SUNO_TRACK_LABEL, songNumber)), String(variantSuffix)) };
            });
      const evaluationProjectId = SOURCE_TEMPLATE_MUSIC_TRACK_EVALUATION(String(Date.now()));
      sunoDownloadRunIdRef.current = evaluationProjectId;
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_DOWNLOAD, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          folderPath,
          tracks,
          maxTracks: isTestPlaylistDownload ? 1 : undefined,
          playlistUrl: activePlaylistUrl,
          songTitles: _.map(songs, SOURCE_TEXT_TITLE),
          format: sunoDownloadFormat,
          evaluateTracks: isTestPlaylistDownload ? false : sunoEvaluateTracks,
          style,
          styleAnalysis,
          aiExecution: sunoEvaluateTracks && !isTestPlaylistDownload ? { mode: AiPlanningExecutionMode.RoomOnly, provider: AiPlanningFallbackProvider.GeminiChat, model, projectId: evaluationProjectId, chromeHeadless: false } : undefined,
        }),
        signal: abortController.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || texts.SUNO_DOWNLOAD_ERROR);
      const downloadedTracks = _.castArray(result.downloadedTracks || []) as DownloadedMusicTrack[];
      if (!_.isEmpty(downloadedTracks)) setDownloadedMusicTracks(downloadedTracks);
      if (sunoEvaluateTracks && !isTestPlaylistDownload) {
        const curatedTracks = _.castArray(result.curatedTracks || []) as CuratedDownloadedTrack[];
        if (_.size(curatedTracks) === _.size(songs)) {
          setCuratedDownloadedTracks(curatedTracks);
          setSelectedSeoSongIndex(0);
        }
      }
      toast.success(texts.SUNO_DOWNLOAD_SUCCESS.replace(SOURCE_TEXT_COUNT, _.toString(_.size(result.downloadedPaths))).replace(SOURCE_TEXT_FOLDER, folderPath));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicDownloadDone, _.size(result.downloadedPaths));
    } catch (error: any) {
      if (!sunoDownloadStoppedByUserRef.current) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicDownloadFail);
      if (!sunoDownloadStoppedByUserRef.current) {
        const message = _.toString(error?.message || texts.SUNO_DOWNLOAD_ERROR);
        setSunoDownloadError(message);
        toast.error(message, { duration: 10000 });
      }
    } finally {
      sunoDownloadAbortControllerRef.current = null;
      sunoDownloadRunIdRef.current = null;
      setIsDownloadingSuno(false);
    }
  };
  const handleCancelSunoDownload = () => {
    if (!isDownloadingSuno) return;
    sunoDownloadStoppedByUserRef.current = true;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicDownloadStop);
    sunoDownloadAbortControllerRef.current?.abort();
    const runId = sunoDownloadRunIdRef.current;
    if (runId) {
      void fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ pipelineRunId: runId, closeBrowser: true }) }).catch(() => undefined);
    }
    setIsDownloadingSuno(false);
    toast.info(texts.SUNO_DOWNLOAD_CANCELLED_TOAST);
  };
  const handleThumbnailReferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith(SUNO_AUTOMATION_CONFIG.MIME_IMAGE_PREFIX)) {
      toast.error(texts.THUMBNAIL_IMAGE_INVALID);
      return;
    }
    void readBlobAsDataUrl(file)
      .then((reference) => {
        setThumbnailReference(reference);
        setThumbnailReferenceName(file.name);
        setGeneratedThumbnail(MUSIC_CREATOR_RUNTIME.EMPTY);
        void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_REFERENCE, reference).catch(() => undefined);
        void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
      })
      .catch(() => undefined);
  };
  const handleVideoBackgroundReferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith(SUNO_AUTOMATION_CONFIG.MIME_IMAGE_PREFIX)) {
      toast.error(texts.THUMBNAIL_IMAGE_INVALID);
      return;
    }
    void readBlobAsDataUrl(file)
      .then((reference) => {
        setVideoBackgroundReference(reference);
        setVideoBackgroundReferenceName(file.name);
        setGeneratedVideoBackground(MUSIC_CREATOR_RUNTIME.EMPTY);
        void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND_REFERENCE, reference).catch(() => undefined);
        void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, MUSIC_CREATOR_RUNTIME.EMPTY).catch(() => undefined);
      })
      .catch(() => undefined);
  };
  const handleDownloadThumbnail = async () => {
    if (_.isEmpty(generatedThumbnail)) return;
    const extension = generatedThumbnail.startsWith(SUNO_AUTOMATION_CONFIG.JPEG_DATA_PREFIX) ? SUNO_AUTOMATION_CONFIG.JPG_EXTENSION : SUNO_AUTOMATION_CONFIG.PNG_EXTENSION;
    try {
      const blob = await fetch(generatedThumbnail).then((response) => response.blob());
      const saved = await saveMusicBlobWithDialog(blob, SOURCE_TEMPLATE_SYMBOL_15(String(SUNO_AUTOMATION_CONFIG.THUMBNAIL_EXPORT_FILENAME), String(extension)));
      if (saved) toast.success(texts.THUMBNAIL_SAVE_SUCCESS);
    } catch (error) {
      if (_.get(error, SOURCE_TEXT_NAME) !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
    }
  };
  const handleNormalizeImageNote = async (assetPurpose: "cover" | "video-background") => {
    if (isBusy) return;
    const isVideoBackground = assetPurpose === SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO;
    const note = isVideoBackground ? videoBackgroundDescription : thumbnailDescription;
    if (_.isEmpty(_.trim(note))) return;
    const setNormalizing = isVideoBackground ? setIsNormalizingVideoBackgroundNote : setIsNormalizingThumbnailNote;
    setNormalizing(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_IMAGE_NOTE_NORMALIZE, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          note,
          assetPurpose,
          styleAnalysis,
          thumbnailReference: isVideoBackground ? undefined : thumbnailReference,
          thumbnailReferenceName: isVideoBackground ? undefined : thumbnailReferenceName,
          videoBackgroundReference: isVideoBackground ? videoBackgroundReference : undefined,
          videoBackgroundReferenceName: isVideoBackground ? videoBackgroundReferenceName : undefined,
          showTrackList: showVideoTrackList,
          chromeHeadless,
        }),
      });
      const result = await response.json();
      const normalizedNote = _.trim(_.toString(result.normalizedNote));
      if (!response.ok || !result.success || _.isEmpty(normalizedNote)) throw new Error(result.error || texts.IMAGE_NOTE_NORMALIZE_ERROR);
      if (isVideoBackground) setVideoBackgroundDescription(normalizedNote);
      else setThumbnailDescription(normalizedNote);
      toast.success(texts.IMAGE_NOTE_NORMALIZED);
    } catch (error) {
      toast.error(_.toString(_.get(error, SOURCE_TEXT_MESSAGE, texts.IMAGE_NOTE_NORMALIZE_ERROR)));
    } finally {
      setNormalizing(false);
    }
  };
  const handleRegenerateThumbnail = async () => {
    if (_.isEmpty(songs) || isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverStart);
    thumbnailStoppedRef.current = false;
    const imageAbortController = new AbortController();
    const imageRunId = SOURCE_TEMPLATE_MUSIC_COVER(String(Date.now()), String(Math.random().toString(36).slice(2)));
    thumbnailAbortControllerRef.current = imageAbortController;
    thumbnailRunIdRef.current = imageRunId;
    setIsGeneratingThumbnail(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ songs, style, styleAnalysis, sourceContext: referenceSongs, playlistSeoOptions, thumbnailDescription, thumbnailReference, thumbnailReferenceName, chromeHeadless, aiExecution: { provider, model }, imageRunId }),
        signal: imageAbortController.signal,
      });
      const result = await response.json();
      imageAbortController.signal.throwIfAborted();
      const imageUrl = _.toString(result.thumbnail);
      if (!response.ok || !result.success || _.isEmpty(imageUrl)) throw new Error(result.warning || texts.THUMBNAIL_GENERATE_ERROR);
      setGeneratedThumbnail(imageUrl);
      await writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, imageUrl);
      toast.success(texts.THUMBNAIL_GENERATE_SUCCESS);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverDone);
    } catch (error: any) {
      if (!imageAbortController.signal.aborted) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverFail);
      if (!imageAbortController.signal.aborted) toast.error(_.toString(error?.message || texts.THUMBNAIL_GENERATE_ERROR));
    } finally {
      if (thumbnailAbortControllerRef.current === imageAbortController) {
        thumbnailAbortControllerRef.current = null;
        thumbnailRunIdRef.current = null;
        setIsGeneratingThumbnail(false);
      }
    }
  };
  const cancelMusicImageRun = (runId: string | null) => {
    if (!runId) return;
    void fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ pipelineRunId: runId }) }).catch(() => undefined);
  };
  const handleStopThumbnail = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverStop);
    thumbnailStoppedRef.current = true;
    thumbnailAbortControllerRef.current?.abort();
    cancelMusicImageRun(thumbnailRunIdRef.current);
    thumbnailAbortControllerRef.current = null;
    thumbnailRunIdRef.current = null;
    setIsGeneratingThumbnail(false);
    toast.info(texts.THUMBNAIL_STOPPED);
  };
  const handleStopVideoBackground = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicBackgroundStop);
    videoBackgroundAbortControllerRef.current?.abort();
    cancelMusicImageRun(videoBackgroundRunIdRef.current);
    videoBackgroundAbortControllerRef.current = null;
    videoBackgroundRunIdRef.current = null;
    setIsGeneratingVideoBackground(false);
    toast.info(texts.VIDEO_BACKGROUND_STOPPED);
  };
  const handleGenerateVideoBackground = async () => {
    if (_.isEmpty(downloadedMusicTracks) || _.isEmpty(videoBackgroundReference) || isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicBackgroundStart);
    const imageAbortController = new AbortController();
    const imageRunId = SOURCE_TEMPLATE_MUSIC_BACKGROUND(String(Date.now()), String(Math.random().toString(36).slice(2)));
    videoBackgroundAbortControllerRef.current = imageAbortController;
    videoBackgroundRunIdRef.current = imageRunId;
    setIsGeneratingVideoBackground(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ songs: downloadedMusicTracks, style, styleAnalysis, videoBackgroundDescription, videoBackgroundReference, videoBackgroundReferenceName, chromeHeadless, aiExecution: { provider, model }, assetPurpose: SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO, showTrackList: showVideoTrackList, imageRunId }),
        signal: imageAbortController.signal,
      });
      const result = await response.json();
      imageAbortController.signal.throwIfAborted();
      const imageUrl = _.toString(result.thumbnail);
      if (!response.ok || !result.success || _.isEmpty(imageUrl)) throw new Error(result.warning || texts.VIDEO_BACKGROUND_ERROR);
      setGeneratedVideoBackground(imageUrl);
      await writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, imageUrl);
      toast.success(texts.VIDEO_BACKGROUND_SUCCESS);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicBackgroundDone);
    } catch (error: any) {
      if (!imageAbortController.signal.aborted) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicBackgroundFail);
      if (!imageAbortController.signal.aborted) toast.error(_.toString(error?.message || texts.VIDEO_BACKGROUND_ERROR));
    } finally {
      if (videoBackgroundAbortControllerRef.current === imageAbortController) {
        videoBackgroundAbortControllerRef.current = null;
        videoBackgroundRunIdRef.current = null;
        setIsGeneratingVideoBackground(false);
      }
    }
  };
  const handleDownloadVideoBackground = async () => {
    if (_.isEmpty(generatedVideoBackground)) return;
    const extension = generatedVideoBackground.startsWith(SUNO_AUTOMATION_CONFIG.JPEG_DATA_PREFIX) ? SUNO_AUTOMATION_CONFIG.JPG_EXTENSION : SUNO_AUTOMATION_CONFIG.PNG_EXTENSION;
    try {
      const blob = await fetch(generatedVideoBackground).then((response) => response.blob());
      const saved = await saveMusicBlobWithDialog(blob, SOURCE_TEMPLATE_SYMBOL_15(String(SUNO_AUTOMATION_CONFIG.VIDEO_BACKGROUND_EXPORT_FILENAME), String(extension)));
      if (saved) toast.success(texts.VIDEO_BACKGROUND_SUCCESS);
    } catch (error) {
      if (_.get(error, SOURCE_TEXT_NAME) !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
    }
  };
  const isFormValid = true;
  const isBusy = isLoading || isStopping || isRegeneratingSeo || isCreatingSuno || isDownloadingSuno || isGeneratingThumbnail || isNormalizingThumbnailNote || isGeneratingVideoBackground || isNormalizingVideoBackgroundNote;
  const isTrackListUnavailable = isBusy || _.isEmpty(downloadedMusicTracks);
  return (
    <StudioPage aria-busy={isBusy}>
      <StudioCanvas>
        <MusicCreatorHeader texts={texts} isAiConfigOpen={isAiConfigOpen} onToggleAiConfig={() => setIsAiConfigOpen(!isAiConfigOpen)} isLoading={isBusy} />
        {isAiConfigOpen && (
          <StudioFieldset disabled={isBusy} className={cn(SRT.SOURCE_TEXT_GLASS_CARD_ROUNDED_2XL_P_4_BG)}>
            <ChatPlanningSettingsBlock provider={provider} model={model} executionMode={executionMode} chromeHeadless={chromeHeadless} onProviderChange={setProvider} onModelChange={setModel} onExecutionModeChange={setExecutionMode} onChromeHeadlessChange={setChromeHeadless} currentLang={currentLang} />
          </StudioFieldset>
        )}
        <div className={cn(SRT.SOURCE_TEXT_GRID_GRID_COLS_1_LG_GRID_COLS_2)}>
          <div className={cn(MCS.LG_COL_SPAN_2_FLEX_FLEX_COL_GAP_5_MIN_W_0_H_FULL)}>
            <StudioCard className={cn(MCS.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE_Y_4_SHADOW_XL_BORDER_BORDER)}>
              <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_RELATIVE_Z)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN)}>
                  <span className={cn(SRT.SOURCE_TEXT_W_6_H_6_ROUNDED_XL_BG)}>{texts.STEP_01}</span>
                  <h3 className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER)}>
                    <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT)} />
                    <span>{texts.STYLE_LABEL}</span>
                    <span className={cn(SRT.SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED_3)}>{texts.STYLE_BADGE}</span>
                  </h3>
                </div>
                {!_.isEmpty(_.trim(styleDraft)) && (
                  <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5)}>
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleSaveStyle} disabled={isBusy} className={cn(MCS.H_8_PX_2_5_ROUNDED_LG_BORDER_BORDER_PURPLE_500_30_BG_PURPLE_500_15_HOVER_BG)}>
                      <Save className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                      <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{editingStyleIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                    </Button>
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelStyleEdit} disabled={isBusy} className={cn(MCS.H_8_PX_2_5_ROUNDED_LG_BORDER_BORDER_SLATE_300_HOVER_BORDER_ROSE_500_50_BG_T)}>
                      <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.CANCEL_BTN}</span>
                    </Button>
                  </div>
                )}
              </div>
              <div className={cn(MCS.GRID_GRID_COLS_1_SM_GRID_COLS_12_GAP_2_RELATIVE_Z_10)}>
                <div className={cn(MCS.SM_COL_SPAN_4)}>
                  <StudioInput type={SOURCE_TEXT_TEXT} value={styleName} onChange={(event) => setStyleName(event.target.value)} placeholder={texts.STYLE_NAME_PLACEHOLDER} disabled={isBusy} className={cn(MCS.W_FULL_H_8_5_BG_SLATE_955_90_TEXT_SLATE_100_PX_3_ROUNDED_XL_TEXT_XS_OUTLINE)} />
                </div>
                <div className={cn(MCS.SM_COL_SPAN_8)}>
                  <StudioInput
                    type={SOURCE_TEXT_TEXT}
                    value={styleDraft}
                    onChange={(e) => {
                      setStyleDraft(e.target.value);
                      if (editingStyleIndex === null) setStyle(e.target.value);
                    }}
                    placeholder={texts.STYLE_PLACEHOLDER}
                    disabled={isBusy}
                    className={cn(MCS.W_FULL_H_8_5_BG_SLATE_955_90_TEXT_SLATE_100_PX_3_ROUNDED_XL_TEXT_XS_OUTLINE_2)}
                  />
                </div>
              </div>
              <div className={cn(MCS.SPACE_Y_1_5_PT_0_5_RELATIVE_Z_10)}>
                <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_10PX_FONT_MONO_UPPERCASE_TRACKING_WIDER_TEXT)}>
                  <Flame className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT_12)} />
                  <span>{texts.STYLE_YOUR_STYLES}</span>
                </div>
                <div className={cn(MCS.FLEX_FLEX_WRAP_GAP_1_5_MAX_H_28_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_P_0_5)}>
                  {_.map(savedStyles, (savedStyle, styleIndex) => {
                    const isSelected = _.isEqual(style, savedStyle.content);
                    return (
                      <div key={SOURCE_TEMPLATE_SYMBOL_5(String(styleIndex), String(savedStyle.title))} className={cn(MCS.GROUP_RELATIVE_INLINE_FLEX_ITEMS_CENTER_PL_2_5_PR_1_5_ROUNDED_XL_BORDER_TRA, { [MCS.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_BORDER_PURPLE_400_TEXT_WHITE_S]: isSelected, [MCS.BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_SLATE_200_DARK_BORDER_SLATE_800_TEX]: !isSelected })}>
                        <Tooltip content={savedStyle.content} align={SOURCE_TEXT_START}>
                          <Button
                            variant={SOURCE_TEXT_UNSTYLED}
                            type={SOURCE_TEXT_BUTTON}
                            onClick={() => {
                              const shouldClear = _.isEqual(style, savedStyle.content);
                              setStyle(shouldClear ? MUSIC_CREATOR_RUNTIME.EMPTY : savedStyle.content);
                              setEditingStyleIndex(null);
                              setStyleDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
                              setStyleName(MUSIC_CREATOR_RUNTIME.EMPTY);
                            }}
                            disabled={isBusy}
                            className={cn(MCS.TEXT_11PX_FONT_BLACK_TRUNCATE_MAX_W_120PX_CURSOR_POINTER_TEXT_LEFT_FLEX_ITE)}
                            title={savedStyle.content}>
                            <span className={cn(MCS.W_1_5_H_1_5_ROUNDED_FULL_SHRINK_0_TRANSITION_ALL, { [MCS.BG_WHITE_RING_2_RING_WHITE_40_SHADOW_XS]: isSelected, [MCS.BG_SLATE_400_DARK_BG_SLATE_500_GROUP_HOVER_BG_PURPLE_400]: !isSelected })} />
                            <span className={cn(MCS.TRUNCATE_FONT_BLACK_TEXT_11PX_LEADING_NONE_TRANSITION_COLORS, { [MCS.TEXT_WHITE]: isSelected, [MCS.TEXT_1E1B4B_GROUP_HOVER_TEXT_6B21A8_DARK_TEXT_SLATE_200_DARK_GROUP_HOVER_TE]: !isSelected })}>{savedStyle.title}</span>
                          </Button>
                        </Tooltip>
                        <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_ML_1_5_SHRINK_0_SELF_CENTER)}>
                          <Tooltip content={texts.COPY_STYLE_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                            <Button
                              variant={SOURCE_TEXT_UNSTYLED}
                              type={SOURCE_TEXT_BUTTON}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyStyle(savedStyle, styleIndex);
                              }}
                              disabled={isBusy}
                              title={texts.COPY_STYLE_BTN}
                              className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_WHITE_20_HOVER_BG_WHITE_30_BORDER_BORDER_WHITE_30_TEXT_WHITE]: isSelected, [MCS.BG_SKY_500_15_HOVER_BG_SKY_500_25_BORDER_BORDER_SKY_500_40_TEXT_SKY_700_DAR]: !isSelected })}>
                              {copiedStyleIndex === styleIndex ? <Check className={cn(MCS.W_2_5_H_2_5_SHRINK_0, { [MCS.TEXT_EMERALD_300]: isSelected, [SRT.SOURCE_TEXT_TEXT_EMERALD_500]: !isSelected })} /> : <Copy className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />}
                            </Button>
                          </Tooltip>
                          <Tooltip content={texts.STYLE_UPDATE_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                            <Button
                              variant={SOURCE_TEXT_UNSTYLED}
                              type={SOURCE_TEXT_BUTTON}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStyle(styleIndex);
                              }}
                              disabled={isBusy}
                              title={texts.STYLE_UPDATE_BTN}
                              className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_WHITE_20_HOVER_BG_WHITE_30_BORDER_BORDER_WHITE_30_TEXT_WHITE]: isSelected, [MCS.BG_PURPLE_500_15_HOVER_BG_PURPLE_500_25_BORDER_BORDER_PURPLE_500_40_TEXT_7E]: !isSelected })}>
                              <Pencil className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />
                            </Button>
                          </Tooltip>
                          <Tooltip content={texts.STYLE_DELETE_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                            <Button
                              variant={SOURCE_TEXT_UNSTYLED}
                              type={SOURCE_TEXT_BUTTON}
                              onClick={(e) => {
                                e.stopPropagation();
                                setStyleToDelete(savedStyle);
                              }}
                              disabled={isBusy}
                              title={texts.STYLE_DELETE_BTN}
                              className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_ROSE_500_30_HOVER_BG_ROSE_500_50_BORDER_BORDER_ROSE_300_40_TEXT_WHITE]: isSelected, [MCS.BG_ROSE_500_15_HOVER_BG_ROSE_500_25_BORDER_BORDER_ROSE_500_40_TEXT_E11D48_D]: !isSelected })}>
                              <Trash2 className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                  {_.isEmpty(savedStyles) && <span className={cn(MCS.TEXT_11PX_TEXT_SLATE_500_ITALIC_PY_1)}>{texts.STYLE_EMPTY_HINT}</span>}
                </div>
              </div>
              <div className={cn(MCS.SPACE_Y_2_5_RELATIVE_Z_10_BORDER_T_BORDER_SLATE_800_60_PT_3)}>
                <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP)}>
                  <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W)}>
                    <Disc3 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT)} />
                    <span className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER)}>
                      <span>{texts.SUNO_INSPO_LABEL}</span>
                      <span className={cn(SRT.SOURCE_TEXT_PX_1_5_PY_0_2_ROUNDED_3)}>{texts.SUNO_INSPO_BADGE}</span>
                    </span>
                  </div>
                  {!_.isEmpty(_.trim(sunoInspoDraft)) && (
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5)}>
                      <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleSaveInspo} disabled={isBusy} className={cn(MCS.H_7_5_PX_2_5_ROUNDED_LG_BORDER_BORDER_PURPLE_500_30_BG_PURPLE_500_15_HOVER)}>
                        <Save className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                        <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{editingInspoIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                      </Button>
                      <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelInspoEdit} disabled={isBusy} className={cn(MCS.H_7_5_PX_2_5_ROUNDED_LG_BORDER_BORDER_SLATE_300_HOVER_BORDER_ROSE_500_50_BG)}>
                        <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.CANCEL_BTN}</span>
                      </Button>
                    </div>
                  )}
                </div>
                <div className={cn(MCS.GRID_GRID_COLS_1_SM_GRID_COLS_12_GAP_2)}>
                  <div className={cn(MCS.SM_COL_SPAN_4)}>
                    <StudioInput type={SOURCE_TEXT_TEXT} value={inspoName} onChange={(event) => setInspoName(event.target.value)} disabled={isBusy} placeholder={texts.INSPO_NAME_PLACEHOLDER} className={cn(MCS.W_FULL_H_8_5_BG_SLATE_955_90_TEXT_SLATE_100_PX_3_ROUNDED_XL_TEXT_XS_OUTLINE)} />
                  </div>
                  <div className={cn(MCS.SM_COL_SPAN_8)}>
                    <StudioInput
                      type={SOURCE_TEXT_TEXT}
                      value={sunoInspoDraft}
                      onChange={(event) => {
                        setSunoInspoDraft(event.target.value);
                        if (editingInspoIndex === null) setSunoInspo(event.target.value);
                      }}
                      disabled={isBusy}
                      placeholder={texts.SUNO_INSPO_PLACEHOLDER}
                      className={cn(MCS.W_FULL_H_8_5_BG_SLATE_955_90_TEXT_SLATE_100_PX_3_ROUNDED_XL_TEXT_XS_OUTLINE_2)}
                    />
                  </div>
                </div>
                {!_.isEmpty(savedInspos) && (
                  <div className={cn(MCS.SPACE_Y_1_5_PT_0_5)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_10PX_FONT_MONO_UPPERCASE_TRACKING_WIDER_TEXT)}>
                      <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT)} />
                      <span>{texts.INSPO_YOUR_INSPOS}</span>
                    </div>
                    <div className={cn(MCS.FLEX_FLEX_WRAP_GAP_1_5_MAX_H_28_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_P_0_5)}>
                      {_.map(savedInspos, (item, index) => {
                        const isSelected = _.isEqual(sunoInspo, item.content);
                        return (
                          <div key={SOURCE_TEMPLATE_SYMBOL_5(String(item.title), String(index))} className={cn(MCS.GROUP_RELATIVE_INLINE_FLEX_ITEMS_CENTER_PL_2_5_PR_1_5_ROUNDED_XL_BORDER_TRA, { [MCS.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_BORDER_PURPLE_400_TEXT_WHITE_S]: isSelected, [MCS.BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_SLATE_200_DARK_BORDER_SLATE_800_TEX]: !isSelected })}>
                            <Tooltip content={item.content} align={SOURCE_TEXT_START}>
                              <Button
                                variant={SOURCE_TEXT_UNSTYLED}
                                type={SOURCE_TEXT_BUTTON}
                                onClick={() => {
                                  const shouldClear = _.isEqual(sunoInspo, item.content);
                                  setSunoInspo(shouldClear ? MUSIC_CREATOR_RUNTIME.EMPTY : item.content);
                                  setEditingInspoIndex(null);
                                  setSunoInspoDraft(MUSIC_CREATOR_RUNTIME.EMPTY);
                                  setInspoName(MUSIC_CREATOR_RUNTIME.EMPTY);
                                }}
                                disabled={isBusy}
                                className={cn(MCS.TEXT_11PX_FONT_BLACK_TRUNCATE_MAX_W_130PX_CURSOR_POINTER_TEXT_LEFT_FLEX_ITE)}
                                title={item.content}>
                                <span className={cn(MCS.W_1_5_H_1_5_ROUNDED_FULL_SHRINK_0_TRANSITION_ALL, { [MCS.BG_WHITE_RING_2_RING_WHITE_40_SHADOW_XS]: isSelected, [MCS.BG_SLATE_400_DARK_BG_SLATE_500_GROUP_HOVER_BG_PURPLE_400]: !isSelected })} />
                                <span className={cn(MCS.TRUNCATE_FONT_BLACK_TEXT_11PX_LEADING_NONE_TRANSITION_COLORS, { [MCS.TEXT_WHITE]: isSelected, [MCS.TEXT_1E1B4B_GROUP_HOVER_TEXT_6B21A8_DARK_TEXT_SLATE_200_DARK_GROUP_HOVER_TE]: !isSelected })}>{item.title}</span>
                              </Button>
                            </Tooltip>
                            <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_ML_1_5_SHRINK_0_SELF_CENTER)}>
                              <Tooltip content={texts.INSPO_COPY_NAME_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                                <Button
                                  variant={SOURCE_TEXT_UNSTYLED}
                                  type={SOURCE_TEXT_BUTTON}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await navigator.clipboard.writeText(item.title);
                                    setCopiedInspoIndex(index);
                                    toast.success(texts.INSPO_COPY_NAME_SUCCESS);
                                    window.setTimeout(() => setCopiedInspoIndex(null), 2000);
                                  }}
                                  title={texts.INSPO_COPY_NAME_BTN}
                                  aria-label={texts.INSPO_COPY_NAME_BTN}
                                  disabled={isBusy}
                                  className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_WHITE_20_HOVER_BG_WHITE_30_BORDER_BORDER_WHITE_30_TEXT_WHITE]: isSelected, [MCS.BG_SKY_500_15_HOVER_BG_SKY_500_25_BORDER_BORDER_SKY_500_40_TEXT_SKY_700_DAR]: !isSelected })}>
                                  {copiedInspoIndex === index ? <Check className={cn(MCS.W_2_5_H_2_5_SHRINK_0, { [MCS.TEXT_EMERALD_300]: isSelected, [SRT.SOURCE_TEXT_TEXT_EMERALD_500]: !isSelected })} /> : <Copy className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />}
                                </Button>
                              </Tooltip>
                              <Tooltip content={texts.STYLE_UPDATE_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                                <Button
                                  variant={SOURCE_TEXT_UNSTYLED}
                                  type={SOURCE_TEXT_BUTTON}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingInspoIndex(index);
                                    setInspoName(item.title);
                                    setSunoInspo(item.content);
                                    setSunoInspoDraft(item.content);
                                  }}
                                  disabled={isBusy}
                                  title={texts.STYLE_UPDATE_BTN}
                                  className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_WHITE_20_HOVER_BG_WHITE_30_BORDER_BORDER_WHITE_30_TEXT_WHITE]: isSelected, [MCS.BG_PURPLE_500_15_HOVER_BG_PURPLE_500_25_BORDER_BORDER_PURPLE_500_40_TEXT_7E]: !isSelected })}>
                                  <Pencil className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />
                                </Button>
                              </Tooltip>
                              <Tooltip content={texts.STYLE_DELETE_BTN} align={SOURCE_TEXT_CENTER} className={cn(MCS.W_5_H_5_MIN_W_5_MIN_H_5_MAX_W_5_MAX_H_5_SHRINK_0_SELF_CENTER_P_0_FLEX_ITEMS)}>
                                <Button
                                  variant={SOURCE_TEXT_UNSTYLED}
                                  type={SOURCE_TEXT_BUTTON}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspoToDelete(item);
                                  }}
                                  disabled={isBusy}
                                  title={texts.STYLE_DELETE_BTN}
                                  className={cn(MCS.BTN_ICON_TINY_W_20PX_H_20PX_MIN_W_20PX_MIN_H_20PX_MAX_W_20PX_MAX_H_20PX_P_0, { [MCS.BG_ROSE_500_30_HOVER_BG_ROSE_500_50_BORDER_BORDER_ROSE_300_40_TEXT_WHITE]: isSelected, [MCS.BG_ROSE_500_15_HOVER_BG_ROSE_500_25_BORDER_BORDER_ROSE_500_40_TEXT_E11D48_D]: !isSelected })}>
                                  <Trash2 className={cn(MCS.W_2_5_H_2_5_SHRINK_0)} />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </StudioCard>
            <StudioCard className={cn(MCS.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE_Y_4_SHADOW_XL_BORDER_BORDER_2)}>
              <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_RELATIVE_Z_10_SHRINK_0)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN)}>
                  <span className={cn(SRT.SOURCE_TEXT_W_6_H_6_ROUNDED_XL_BG)}>{texts.STEP_02}</span>
                  <h3 className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER)}>
                    <FileText className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT)} />
                    <span>{texts.REFERENCE_LABEL}</span>
                  </h3>
                </div>
                <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleFillSampleReferences} disabled={isBusy} className={cn(MCS.TEXT_XS_FONT_BOLD_TRANSITION_ALL_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GA)}>
                  <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                  <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.QUICK_FILL_LABEL}</span>
                </Button>
              </div>
              <div className={cn(MCS.RELATIVE_Z_10_FLEX_1_FLEX_FLEX_COL_MIN_H_0)}>
                <StudioTextarea rows={4} value={referenceSongs} onChange={(e) => setReferenceSongs(e.target.value)} placeholder={texts.REFERENCE_PLACEHOLDER} disabled={isBusy} className={cn(MCS.W_FULL_FLEX_1_MIN_H_140PX_SM_MIN_H_180PX_BG_SLATE_955_90_TEXT_SLATE_100_P_3)} />
              </div>
            </StudioCard>
          </div>
          <div className={cn(SRT.SOURCE_TEXT_LG_COL_SPAN_1_FLEX_FLEX_COL)}>
            <StudioCard className={cn(SRT.SOURCE_TEXT_GLASS_CARD_BG_SLATE_900_90_BORDER)}>
              <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN)}>
                  <div className={cn(SRT.SOURCE_TEXT_W_8_H_8_ROUNDED_LG_BG)}>
                    <div className={cn(SRT.SOURCE_TEXT_W_FULL_H_FULL_BG_SLATE_950_3)}>
                      <SlidersHorizontal className={cn(SRT.SOURCE_TEXT_W_4_H_4_TEXT_AMBER_400)} />
                    </div>
                  </div>
                  <div>
                    <h2 className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER)}>{texts.STUDIO_CONFIG_TITLE}</h2>
                  </div>
                </div>
                <span className={cn(SRT.SOURCE_TEXT_PX_2_PY_0_5_ROUNDED_FULL_4)}>{texts.STUDIO_CONFIG_BADGE}</span>
              </div>
              <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_2)}>
                <label className={cn(MCS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE_TRACKING_WIDER_BLOCK)}>{texts.COUNT_LABEL}</label>
                <div className={cn(MCS.GRID_GRID_COLS_3_GAP_2)}>
                  {_.map(MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS, (count) => {
                    const isSelected = _.isEqual(outputCount, count);
                    const isRecommended = _.isEqual(count, MUSIC_CREATOR_CONSTANTS.RECOMMENDED_SONG_COUNT);
                    return (
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        key={count}
                        type={SOURCE_TEXT_BUTTON}
                        onClick={() => setOutputCount(count)}
                        disabled={isBusy}
                        className={cn(MCS.RELATIVE_H_9_ROUNDED_XL_BORDER_FONT_BOLD_TEXT_XS_FLEX_FLEX_COL_ITEMS_CENTER, { [MCS.BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_BORDER_PURPLE_400_TEXT_WHITE_S]: isSelected, [MCS.BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_SLATE_200_DARK_BORDER_SLATE_800_TEX]: !isSelected })}>
                        <span>{texts.formatSongCount(count)}</span>
                        {isRecommended && !isSelected && <span className={cn(MCS.ABSOLUTE_TOP_1_PX_1_ROUNDED_TEXT_7PX_FONT_MONO_UPPERCASE_BG_AMBER_500_20_TE)}>{texts.RECOMMENDED_BADGE}</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className={cn(SRT.SOURCE_TEXT_P_3_ROUNDED_XL_BG_SLATE_955)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <span>
                    {texts.COUNT_LABEL}
                    {SOURCE_TEXT_SYMBOL_16}
                  </span>
                  <span className={cn(SRT.SOURCE_TEXT_FONT_BOLD_TEXT_SLATE_200)}>
                    {outputCount} {texts.SONG_UNIT}
                  </span>
                </div>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <span>
                    {texts.ENGINE_LABEL}
                    {SOURCE_TEXT_SYMBOL_16}
                  </span>
                  <span className={cn(SRT.SOURCE_TEXT_FONT_BOLD_TEXT_PURPLE_300)}>{texts.HEADER_BADGE}</span>
                </div>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <span>
                    {texts.MODEL_LABEL}
                    {SOURCE_TEXT_SYMBOL_16}
                  </span>
                  <span className={cn(MCS.FONT_BOLD_TEXT_SLATE_200_TRUNCATE_MAX_W_130PX)}>{model}</span>
                </div>
              </div>
              <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_2_PT_1)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2)}>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={handleGenerate}
                    disabled={!isFormValid || isBusy}
                    className={cn(MCS.H_11_MIN_H_44PX_PX_4_ROUNDED_XL_FONT_EXTRABOLD_TEXT_XS_INLINE_FLEX_ITEMS_CE, {
                      [MCS.FLEX_1_BG_GRADIENT_TO_R_FROM_PURPLE_600_VIA_PINK_600_TO_INDIGO_600_BORDER_P]: isLoading,
                      [MCS.W_FULL_BG_GRADIENT_TO_R_FROM_ROSE_600_VIA_PURPLE_600_TO_INDIGO_600_HOVER_FR]: !isLoading && isFormValid,
                      [MCS.W_FULL_BG_SLATE_800_80_BORDER_SLATE_700_TEXT_SLATE_500_CURSOR_NOT_ALLOWED_S]: !isLoading && !isFormValid,
                    })}>
                    {isLoading ? (
                      <>
                        <Sparkles className={cn(SRT.SOURCE_TEXT_W_4_H_4_ANIMATE_SPIN_TEXT_2)} />
                        <span className={cn(SRT.SOURCE_TEXT_TRUNCATE_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.BLOCK_LYRICS_LOADING}</span>
                      </>
                    ) : (
                      <>
                        <WandSparkles className={cn(SRT.SOURCE_TEXT_W_4_H_4_SHRINK_0)} />
                        <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.formatGenerateBtn(outputCount)}</span>
                      </>
                    )}
                  </Button>
                  {(isLoading || isStopping) && (
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelGeneration} disabled={isStopping} className={cn(MCS.H_11_MIN_H_44PX_PX_4_ROUNDED_XL_BORDER_BORDER_ROSE_500_50_BG_GRADIENT_TO_R)}>
                      <X className={cn(SRT.SOURCE_TEXT_W_4_H_4_SHRINK_0)} />
                      <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isStopping ? texts.STOPPING_BTN : texts.STOP_BTN}</span>
                    </Button>
                  )}
                </div>
                {generationError && (
                  <div role={SOURCE_TEXT_ALERT} className={cn(MCS.ROUNDED_XL_BORDER_BORDER_ROSE_500_40_BG_ROSE_500_10_PX_3_PY_2_TEXT_XS_TEXT)}>
                    <AlertTriangle className={cn(MCS.MR_1_5_INLINE_H_3_5_W_3_5)} />
                    {generationError}
                  </div>
                )}
                {!isLoading && _.isEmpty(songs) && (
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleTrySampleTemplate} disabled={isBusy} className={cn(MCS.W_FULL_PY_2_TEXT_CENTER_TEXT_XS_FONT_BOLD_TEXT_PURPLE_700_HOVER_TEXT_PURPLE)}>
                    <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.TRY_SAMPLE_BTN}</span>
                  </Button>
                )}
              </div>
            </StudioCard>
            <StudioCard className={cn(MCS.GLASS_CARD_BG_SLATE_900_90_BORDER_BORDER_SLATE_800_80_P_5_SPACE_Y_3_TEXT_LE)}>
              <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_800_80_PB_3)}>
                <h3 className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER)}>
                  <ImageIcon className={cn(MCS.W_3_5_H_3_5_TEXT_FUCHSIA_400)} />
                  {texts.THUMBNAIL_TITLE}
                </h3>
                <span className={cn(MCS.TEXT_9PX_FONT_BOLD_TEXT_FUCHSIA_300_BG_FUCHSIA_500_15_BORDER_BORDER_FUCHSIA)}>{texts.THUMBNAIL_RATIO_BADGE}</span>
              </div>
              <StudioInput ref={thumbnailFileInputRef} type={SOURCE_TEXT_FILE} accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL} onChange={handleThumbnailReferenceChange} disabled={isBusy} className={cn(SRT.SOURCE_TEXT_HIDDEN)} />
              <div className={cn(MCS.GRID_GRID_COLS_2_GAP_2_5_ITEMS_START)}>
                {thumbnailReference ? (
                  <div className={cn(MCS.RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_SLATE_700_BG)}>
                    <img
                      src={thumbnailReference}
                      alt={texts.THUMBNAIL_REFERENCE_ALT}
                      title={texts.CLICK_TO_ZOOM}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewThumbnail(thumbnailReference);
                      }}
                      className={cn(MCS.ABSOLUTE_INSET_0_W_FULL_H_FULL_OBJECT_CONTAIN_CURSOR_ZOOM_IN)}
                    />
                    <div className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_BLACK_70_VIA_TRA)}>
                      <span className={cn(MCS.TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_WHITE_90_BG_BLACK_60_PX_1_5_PY_0_2_ROUNDE)}>{texts.THUMBNAIL_REFERENCE_BADGE}</span>
                      <span className={cn(MCS.TEXT_9PX_FONT_MONO_TEXT_WHITE_80_BG_BLACK_60_PX_1_5_PY_0_2_ROUNDED_BACKDROP)}>{texts.THUMBNAIL_RATIO_OVERLAY}</span>
                    </div>
                    <Button
                      variant={SOURCE_TEXT_UNSTYLED}
                      type={SOURCE_TEXT_BUTTON}
                      onClick={(e) => {
                        e.stopPropagation();
                        thumbnailFileInputRef.current?.click();
                      }}
                      title={texts.CHANGE_IMAGE_BTN}
                      disabled={isBusy}
                      className={cn(MCS.BTN_ICON_TINY_ABSOLUTE_TOP_2_RIGHT_2_W_7_H_7_MIN_W_28PX_MAX_W_28PX_MIN_H_28)}>
                      <Upload className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                    </Button>
                  </div>
                ) : (
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => thumbnailFileInputRef.current?.click()} disabled={isBusy} className={cn(MCS.RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_DASHED_BORDER)}>
                    <Upload className={cn(MCS.W_4_H_4_TEXT_SLATE_400_GROUP_HOVER_TEXT_FUCHSIA_300_TRANSITION_COLORS)} />
                    <span className={cn(MCS.TEXT_10PX_FONT_BOLD_TEXT_SLATE_300_GROUP_HOVER_TEXT_FUCHSIA_200_LEADING_TIG)}>{texts.THUMBNAIL_UPLOAD}</span>
                    <span className={cn(MCS.TEXT_8PX_FONT_MONO_TEXT_SLATE_500)}>{texts.THUMBNAIL_SAMPLE_RATIO}</span>
                  </Button>
                )}
                {generatedThumbnail && !isGeneratingThumbnail ? (
                  <div className={cn(MCS.RELATIVE_GROUP_BLOCK_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_F)}>
                    <img
                      src={generatedThumbnail}
                      alt={texts.THUMBNAIL_RESULT_ALT}
                      title={texts.CLICK_TO_ZOOM}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewThumbnail(generatedThumbnail);
                      }}
                      className={cn(MCS.ABSOLUTE_INSET_0_W_FULL_H_FULL_OBJECT_CONTAIN_CURSOR_ZOOM_IN)}
                    />
                    <div className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_BLACK_70_VIA_TRA)}>
                      <span className={cn(MCS.TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_FUCHSIA_300_BG_BLACK_60_PX_1_5_PY_0_2_ROU)}>{texts.THUMBNAIL_AI_BADGE}</span>
                      <span className={cn(MCS.TEXT_9PX_FONT_MONO_TEXT_WHITE_80_BG_BLACK_60_PX_1_5_PY_0_2_ROUNDED_BACKDROP)}>{texts.THUMBNAIL_RATIO_HD}</span>
                    </div>
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleDownloadThumbnail} disabled={isBusy} title={texts.THUMBNAIL_DOWNLOAD} aria-label={texts.THUMBNAIL_DOWNLOAD} className={cn(MCS.BTN_ICON_TINY_ABSOLUTE_TOP_2_RIGHT_2_Z_10_W_7_H_7_P_0_ROUNDED_LG_BG_BLACK_7)}>
                      <Download className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                    </Button>
                  </div>
                ) : isGeneratingThumbnail ? (
                  <div className={cn(MCS.MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_FUCHSIA_500_40_BG_GRAD)}>
                    <div className={cn(MCS.W_7_H_7_ROUNDED_LG_BG_GRADIENT_TO_TR_FROM_FUCHSIA_500_TO_PURPLE_600_P_0_5_S)}>
                      <div className={cn(MCS.W_FULL_H_FULL_BG_WHITE_DARK_BG_SLATE_900_ROUNDED_6PX_FLEX_ITEMS_CENTER_JUST)}>
                        <Sparkles className={cn(MCS.W_3_5_H_3_5_TEXT_FUCHSIA_600_DARK_TEXT_FUCHSIA_400_ANIMATE_SPIN)} />
                      </div>
                    </div>
                    <p className={cn(MCS.TEXT_10PX_FONT_BLACK_TRACKING_TIGHT_TEXT_86198F_DARK_TEXT_FUCHSIA_300_LEADI)}>{texts.THUMBNAIL_GENERATING}</p>
                    <p className={cn(MCS.TEXT_8PX_FONT_MEDIUM_TEXT_SLATE_500_DARK_TEXT_SLATE_400)}>{texts.THUMBNAIL_MODEL_TAG}</p>
                  </div>
                ) : (
                  <div className={cn(MCS.RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_DASHED_BORDER_2)}>
                    <Sparkles className={cn(MCS.W_4_H_4_TEXT_SLATE_600_DARK_TEXT_SLATE_500)} />
                    <span className={cn(MCS.TEXT_10PX_FONT_SEMIBOLD_TEXT_SLATE_400_DARK_TEXT_SLATE_400_LEADING_TIGHT)}>{texts.THUMBNAIL_AI_TITLE}</span>
                    <span className={cn(MCS.TEXT_8PX_FONT_MONO_TEXT_SLATE_500)}>{texts.THUMBNAIL_NOT_CREATED}</span>
                  </div>
                )}
              </div>
              <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_1)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                  <span className={cn(MCS.TEXT_11PX_FONT_SEMIBOLD_TEXT_SLATE_300)}>{texts.COVER_IMAGE_NOTE_LABEL}</span>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={() => {
                      void handleNormalizeImageNote(SOURCE_TEXT_COVER);
                    }}
                    disabled={isBusy || _.isEmpty(_.trim(thumbnailDescription))}
                    className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC_2)}
                    title={isNormalizingThumbnailNote ? texts.IMAGE_NOTE_NORMALIZING : texts.IMAGE_NOTE_NORMALIZE}>
                    {isNormalizingThumbnailNote ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_ANIMATE_SPIN_TEXT_FUCHSIA_400)} /> : <WandSparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                  </Button>
                </div>
                <StudioTextarea rows={4} value={thumbnailDescription} onChange={(event) => setThumbnailDescription(event.target.value)} disabled={isBusy} placeholder={texts.THUMBNAIL_DESCRIPTION_PLACEHOLDER} className={cn(MCS.W_FULL_MIN_H_95PX_SM_MIN_H_110PX_BG_SLATE_955_90_TEXT_SLATE_100_P_3_ROUNDED)} />
              </div>
              {!_.isEmpty(songs) && (
                <div className={cn(MCS.GRID_GRID_COLS_2_GAP_2)}>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={handleRegenerateThumbnail}
                    disabled={isBusy}
                    className={cn(MCS.H_9_PX_3_ROUNDED_XL_BORDER_TEXT_XS_FONT_BOLD_INLINE_FLEX_ITEMS_CENTER_JUSTI, { [MCS.BORDER_FUCHSIA_500_40_BG_FUCHSIA_100_90_DARK_BG_FUCHSIA_950_70_TEXT_86198F]: isGeneratingThumbnail, [MCS.BORDER_FUCHSIA_500_40_BG_FUCHSIA_500_10_HOVER_BG_FUCHSIA_600_DARK_BG_FUCHSI]: !isGeneratingThumbnail })}>
                    {isGeneratingThumbnail ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_ANIMATE_SPIN_TEXT_FUCHSIA_600_DARK_TEXT_FUCHSIA_400)} /> : <WandSparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isGeneratingThumbnail ? texts.THUMBNAIL_CREATING_SHORT : generatedThumbnail ? texts.THUMBNAIL_REGENERATE : texts.THUMBNAIL_CREATE_BTN}</span>
                  </Button>
                  {isGeneratingThumbnail ? (
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleStopThumbnail} title={texts.THUMBNAIL_STOP_TOOLTIP} aria-label={texts.THUMBNAIL_STOP_TOOLTIP} className={cn(MCS.H_9_PX_3_ROUNDED_XL_BORDER_BORDER_ROSE_500_50_BG_ROSE_500_10_HOVER_BG_ROSE)}>
                      <X className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                      <span>{texts.THUMBNAIL_STOP}</span>
                    </Button>
                  ) : null}
                </div>
              )}
              <div className={cn(MCS.PT_4_BORDER_T_BORDER_SLATE_800_80_SPACE_Y_3)}>
                <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP)}>
                  <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W)}>
                    <div className={cn(MCS.W_6_H_6_ROUNDED_LG_BG_CYAN_500_15_BORDER_BORDER_CYAN_500_30_TEXT_CYAN_400_F)}>
                      <ImageIcon className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                    </div>
                    <h3 className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BLACK_UPPERCASE_TRACKING_WIDER)}>{texts.VIDEO_BACKGROUND_TITLE}</h3>
                  </div>
                  <label
                    className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_2_5_PY_1_ROUNDED_LG_BORDER_TEXT_11PX_FO, {
                      [MCS.BORDER_SLATE_800_80_BG_SLATE_900_40_TEXT_SLATE_500_CURSOR_NOT_ALLOWED_OPACI]: isTrackListUnavailable,
                      [MCS.BORDER_CYAN_500_40_BG_CYAN_500_15_TEXT_CYAN_300_CURSOR_POINTER_SHADOW_XS]: !isTrackListUnavailable && showVideoTrackList,
                      [MCS.BORDER_SLATE_800_HOVER_BORDER_SLATE_700_BG_SLATE_900_80_TEXT_SLATE_300_HOVE]: !isTrackListUnavailable && !showVideoTrackList,
                    })}>
                    <StudioInput type={SOURCE_TEXT_CHECKBOX} checked={showVideoTrackList} onChange={(event) => setShowVideoTrackList(event.target.checked)} disabled={isTrackListUnavailable} className={cn(MCS.H_3_5_W_3_5_ROUNDED_BORDER_SLATE_600_ACCENT_CYAN_500_CURSOR_POINTER_DISABLE)} />
                    <span>{texts.VIDEO_BACKGROUND_TRACKLIST}</span>
                  </label>
                </div>
                {isLoading || isCreatingSuno || _.isEmpty(downloadedMusicTracks) ? (
                  <StudioCard className={cn(MCS.ROUNDED_2XL_BORDER_BORDER_DASHED_BORDER_SLATE_800_BG_GRADIENT_TO_B_FROM_SLA)}>
                    <div className={cn(MCS.W_9_H_9_ROUNDED_XL_BG_SLATE_800_60_BORDER_BORDER_SLATE_700_60_TEXT_SLATE_40)}>
                      <Lock className={cn(MCS.W_4_H_4_TEXT_SLATE_400)} />
                    </div>
                    <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_1)}>
                      <p className={cn(SRT.SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_300)}>{texts.VIDEO_BACKGROUND_LOCKED}</p>
                      <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED_MAX_W_XS_MX_AUTO)}>{SOURCE_TEXT_CAN_TAI_FILE_NHAC_TU_DANH}</p>
                    </div>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PT_1)}>
                      <div className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_2_5_PY_1_ROUNDED_MD_TEXT_10PX_FONT_MONO, { [MCS.BG_EMERALD_500_10_TEXT_EMERALD_300_BORDER_EMERALD_500_20]: !isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks), [MCS.BG_SLATE_900_TEXT_SLATE_400_BORDER_SLATE_800]: !(isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks)) })}>
                        {!isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks) ? <Check className={cn(SRT.SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400)} /> : <Disc3 className={cn(MCS.W_3_H_3_TEXT_SLATE_500)} />}
                        <span>{SOURCE_TEXT_TAI_NHAC_SUNO}</span>
                      </div>
                      <div className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_2_5_PY_1_ROUNDED_MD_TEXT_10PX_FONT_MONO, { [MCS.BG_EMERALD_500_10_TEXT_EMERALD_300_BORDER_EMERALD_500_20]: !_.isEmpty(videoBackgroundReference), [MCS.BG_SLATE_900_TEXT_SLATE_400_BORDER_SLATE_800]: !_.isEmpty(videoBackgroundReference) })}>
                        {!_.isEmpty(videoBackgroundReference) ? <Check className={cn(SRT.SOURCE_TEXT_W_3_H_3_TEXT_EMERALD_400)} /> : <ImageIcon className={cn(MCS.W_3_H_3_TEXT_SLATE_500)} />}
                        <span>{texts.VIDEO_BACKGROUND_REFERENCE_ALT}</span>
                      </div>
                    </div>
                  </StudioCard>
                ) : (
                  <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_3)}>
                    <StudioInput ref={videoBackgroundFileInputRef} type={SOURCE_TEXT_FILE} accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL} onChange={handleVideoBackgroundReferenceChange} disabled={isBusy} className={cn(SRT.SOURCE_TEXT_HIDDEN)} />
                    <div className={cn(MCS.GRID_GRID_COLS_2_GAP_2_5_ITEMS_START)}>
                      {videoBackgroundReference ? (
                        <div className={cn(MCS.RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_SLATE_700_BG_2)}>
                          <img src={videoBackgroundReference} alt={texts.VIDEO_BACKGROUND_REFERENCE_ALT} title={texts.CLICK_TO_ZOOM} onClick={() => setPreviewThumbnail(videoBackgroundReference)} className={cn(MCS.ABSOLUTE_INSET_0_W_FULL_H_FULL_OBJECT_CONTAIN_CURSOR_ZOOM_IN)} />
                          <div className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_BLACK_70_VIA_TRA_2)}>
                            <span className={cn(MCS.TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_WHITE_BG_BLACK_60_PX_1_5_PY_0_5_ROUNDED)}>{texts.VIDEO_BACKGROUND_REFERENCE_ALT}</span>
                          </div>
                          <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => videoBackgroundFileInputRef.current?.click()} disabled={isBusy} title={texts.CHANGE_IMAGE_BTN} className={cn(MCS.BTN_ICON_TINY_ABSOLUTE_TOP_2_RIGHT_2_W_7_H_7_P_0_ROUNDED_LG_BG_BLACK_70_HOV)}>
                            <Upload className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                          </Button>
                        </div>
                      ) : (
                        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => videoBackgroundFileInputRef.current?.click()} disabled={isBusy} className={cn(MCS.RELATIVE_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_DASHED_BORDER_3)}>
                          <Upload className={cn(MCS.W_4_H_4_TEXT_SLATE_400)} />
                          <span className={cn(MCS.TEXT_10PX_FONT_BOLD_TEXT_SLATE_300)}>{texts.THUMBNAIL_UPLOAD}</span>
                          <span className={cn(MCS.TEXT_8PX_FONT_MONO_TEXT_SLATE_500)}>{texts.THUMBNAIL_SAMPLE_RATIO}</span>
                        </Button>
                      )}
                      {(generatedVideoBackground || isGeneratingVideoBackground) && (
                        <div className={cn(MCS.RELATIVE_GROUP_MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_CYAN_50)}>
                          {generatedVideoBackground && (
                            <img
                              src={generatedVideoBackground}
                              alt={texts.VIDEO_BACKGROUND_ALT}
                              title={isGeneratingVideoBackground ? undefined : texts.CLICK_TO_ZOOM}
                              onClick={isGeneratingVideoBackground ? undefined : () => setPreviewThumbnail(generatedVideoBackground)}
                              className={cn(MCS.ABSOLUTE_INSET_0_W_FULL_H_FULL_OBJECT_CONTAIN, { [MCS.OPACITY_35]: isGeneratingVideoBackground, [MCS.CURSOR_ZOOM_IN]: !isGeneratingVideoBackground })}
                            />
                          )}
                          {isGeneratingVideoBackground ? (
                            <div role={SOURCE_TEXT_STATUS} aria-live={SOURCE_TEXT_POLITE} className={cn(MCS.ABSOLUTE_INSET_0_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_BG_SLATE_9)}>
                              <Sparkles className={cn(MCS.W_7_H_7_ANIMATE_SPIN)} />
                              <span className={cn(MCS.TEXT_XS_FONT_BOLD)}>{texts.VIDEO_BACKGROUND_CREATING}</span>
                            </div>
                          ) : (
                            <div className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_BLACK_70_VIA_TRA)}>
                              <span className={cn(MCS.TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_CYAN_300_BG_BLACK_60_PX_1_5_PY_0_2_ROUNDE)}>{SOURCE_TEXT_16_9_HD}</span>
                              <span className={cn(MCS.TEXT_9PX_FONT_MONO_TEXT_WHITE_80_BG_BLACK_60_PX_1_5_PY_0_2_ROUNDED_BACKDROP)}>{texts.CLICK_TO_ZOOM}</span>
                            </div>
                          )}
                          {generatedVideoBackground && !isGeneratingVideoBackground && (
                            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleDownloadVideoBackground} disabled={isBusy} title={texts.VIDEO_BACKGROUND_DOWNLOAD} aria-label={texts.VIDEO_BACKGROUND_DOWNLOAD} className={cn(MCS.BTN_ICON_TINY_ABSOLUTE_TOP_2_RIGHT_2_Z_10_W_7_H_7_P_0_ROUNDED_LG_BG_BLACK_7)}>
                              <Download className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                            </Button>
                          )}
                        </div>
                      )}
                      {!generatedVideoBackground && !isGeneratingVideoBackground && (
                        <div className={cn(MCS.MIN_W_0_W_FULL_ASPECT_VIDEO_ROUNDED_XL_BORDER_BORDER_DASHED_BORDER_SLATE_70)}>
                          <Sparkles className={cn(MCS.W_4_H_4_TEXT_SLATE_500)} />
                          <span className={cn(MCS.TEXT_10PX_FONT_SEMIBOLD_TEXT_SLATE_400)}>{texts.VIDEO_BACKGROUND_TITLE}</span>
                          <span className={cn(MCS.TEXT_8PX_FONT_MONO_TEXT_SLATE_500)}>{texts.THUMBNAIL_NOT_CREATED}</span>
                        </div>
                      )}
                    </div>
                    <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_1)}>
                      <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                        <span className={cn(MCS.TEXT_11PX_FONT_SEMIBOLD_TEXT_SLATE_300)}>{texts.VIDEO_BACKGROUND_NOTE_LABEL}</span>
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          type={SOURCE_TEXT_BUTTON}
                          onClick={() => {
                            void handleNormalizeImageNote(SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO);
                          }}
                          disabled={isBusy || _.isEmpty(_.trim(videoBackgroundDescription))}
                          className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC_3)}
                          title={isNormalizingVideoBackgroundNote ? texts.IMAGE_NOTE_NORMALIZING : texts.IMAGE_NOTE_NORMALIZE}>
                          {isNormalizingVideoBackgroundNote ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_ANIMATE_SPIN_TEXT_CYAN_400)} /> : <WandSparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                        </Button>
                      </div>
                      <StudioTextarea rows={3} value={videoBackgroundDescription} onChange={(event) => setVideoBackgroundDescription(event.target.value)} disabled={isBusy} placeholder={texts.VIDEO_BACKGROUND_DESCRIPTION_PLACEHOLDER} className={cn(MCS.W_FULL_MIN_H_78PX_BG_SLATE_955_90_TEXT_SLATE_100_P_3_ROUNDED_XL_TEXT_XS_LEA)} />
                    </div>
                    <div className={cn(MCS.GRID_GRID_COLS_2_GAP_2)}>
                      <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleGenerateVideoBackground} disabled={isBusy || _.isEmpty(videoBackgroundReference)} className={cn(MCS.H_9_PX_3_ROUNDED_XL_BORDER_BORDER_CYAN_500_40_BG_CYAN_500_10_HOVER_BG_CYAN, { [MCS.COL_SPAN_2]: !isGeneratingVideoBackground })}>
                        {isGeneratingVideoBackground ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_ANIMATE_SPIN_TEXT_CYAN_300)} /> : <WandSparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                        <span>{isGeneratingVideoBackground ? texts.VIDEO_BACKGROUND_CREATING : generatedVideoBackground ? texts.VIDEO_BACKGROUND_REGENERATE : texts.VIDEO_BACKGROUND_CREATE}</span>
                      </Button>
                      {isGeneratingVideoBackground ? (
                        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleStopVideoBackground} title={texts.VIDEO_BACKGROUND_STOP_TOOLTIP} aria-label={texts.VIDEO_BACKGROUND_STOP_TOOLTIP} className={cn(MCS.H_9_PX_3_ROUNDED_XL_BORDER_BORDER_ROSE_500_50_BG_ROSE_500_10_HOVER_BG_ROSE)}>
                          <X className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5)} />
                          <span>{texts.VIDEO_BACKGROUND_STOP}</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </StudioCard>
          </div>
        </div>
        <StudioCard className={cn(MCS.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_4_SM_P_6_SHADOW_XL_BORDER_BORDER_SL)}>
          <div className={cn(MCS.FLEX_FLEX_COL_SM_FLEX_ROW_SM_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_BORDER_B_BO)}>
            <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN)}>
              <div className={cn(MCS.W_8_H_8_ROUNDED_XL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_TEXT_PURPLE)}>
                <Music2 className={cn(SRT.SOURCE_TEXT_W_4_H_4)} />
              </div>
              <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2)}>
                <h2 className={cn(MCS.TEXT_SM_SM_TEXT_BASE_FONT_EXTRABOLD_TEXT_SLATE_100_UPPERCASE_TRACKING_TIGHT)}>{texts.RESULTS_TITLE}</h2>
                {!_.isEmpty(songs) && (
                  <span className={cn(MCS.TEXT_10PX_FONT_MONO_FONT_BOLD_PX_2_PY_0_5_ROUNDED_FULL_BG_PURPLE_500_15_BOR)}>
                    {songs.length} {texts.SONG_UNIT}
                  </span>
                )}
              </div>
            </div>
            <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_JUSTIFY_BETWEEN_SM_JUSTIFY_END)}>
              {!_.isEmpty(songs) && (
                <StudioSegmentedControl>
                  <StudioSegmentButton selected={viewMode === MUSIC_VIEW_MODES.LYRICS} onClick={() => setViewMode(SOURCE_TEXT_LYRICS)} disabled={isBusy}>
                    <Music2 className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.TAB_LYRICS}</span>
                  </StudioSegmentButton>
                  <StudioSegmentButton selected={viewMode === MUSIC_VIEW_MODES.SEO} onClick={() => setViewMode(SOURCE_TEXT_SEO)} disabled={isBusy}>
                    <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.TAB_SEO}</span>
                  </StudioSegmentButton>
                  <StudioSegmentButton selected={viewMode === MUSIC_VIEW_MODES.SPLIT} onClick={() => setViewMode(SOURCE_TEXT_SPLIT)} disabled={isBusy}>
                    <Columns className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.TAB_SPLIT}</span>
                  </StudioSegmentButton>
                </StudioSegmentedControl>
              )}
              {!_.isEmpty(songs) && (
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_SHRINK_0)}>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleGenerate} disabled={isBusy} className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_PURPLE_100_HOVER_BG_PURPLE_200)} title={texts.MUSIC_RECOMPOSE_BTN_TOOLTIP}>
                    {isLoading ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_PURPLE_600_DARK_TEXT_PURPLE_300_ANIMATE_SPIN)} /> : <WandSparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_PURPLE_600_DARK_TEXT_PURPLE_300)} />}
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isLoading ? texts.MUSIC_RECOMPOSING_BTN : texts.MUSIC_RECOMPOSE_BTN}</span>
                  </Button>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleRegenerateSeo} disabled={isBusy} className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_FUCHSIA_100_HOVER_BG_FUCHSIA_20)} title={texts.SEO_REGENERATE_BTN_TOOLTIP}>
                    {isRegeneratingSeo ? <Sparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_FUCHSIA_600_DARK_TEXT_FUCHSIA_300_ANIMATE_SPIN)} /> : <WandSparkles className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_FUCHSIA_600_DARK_TEXT_FUCHSIA_300)} />}
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isRegeneratingSeo ? texts.SEO_REGENERATING_BTN : texts.SEO_REGENERATE_BTN}</span>
                  </Button>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCreateSunoTest} disabled={isBusy} className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_CYAN_100_HOVER_BG_CYAN_200_80_D)}>
                    {isCreatingSunoTest ? <Disc3 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_3)} /> : <Music2 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isCreatingSunoTest ? texts.SUNO_TEST_CREATING_BTN : texts.SUNO_TEST_CREATE_BTN}</span>
                  </Button>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCreateSunoMusic} disabled={isBusy} className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_GRADIENT_TO_R_FROM_ORANGE_500_T)}>
                    {isCreatingSuno && !isCreatingSunoTest ? <Disc3 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_ANIMATE_3)} /> : <Music2 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                    <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isCreatingSuno && !isCreatingSunoTest ? texts.SUNO_CREATING_BTN : texts.SUNO_CREATE_BTN}</span>
                  </Button>
                  {isCreatingSuno && (
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelSunoMusic} className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_ROSE_500_50_BG_GRADI)}>
                      <X className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_CANCEL_BTN}</span>
                    </Button>
                  )}
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={viewMode === MUSIC_VIEW_MODES.SEO ? handleCopyAllSeo : handleCopyAllLyrics} disabled={isBusy} className={cn(MCS.BTN_ICON_TINY_W_8_H_8_MIN_W_32PX_MAX_W_32PX_MIN_H_32PX_MAX_H_32PX_P_0_ASPEC)} title={texts.COPY_ALL_BTN}>
                    <Copy className={cn(SRT.SOURCE_TEXT_W_4_H_4_SHRINK_0)} />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className={cn(SRT.SOURCE_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_GAP_2)}>
            <div className={cn(MCS.RELATIVE_MIN_W_240PX_FLEX_1)}>
              <Link2 className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_LEFT_3_TOP_1_2_H_4_W_4_TRANSLATE_Y_1_2_TEXT_PU)} />
              <StudioInput type={SOURCE_TEXT_URL} value={downloadPlaylistUrl} onChange={(event) => setDownloadPlaylistUrl(event.target.value)} placeholder={texts.SUNO_DOWNLOAD_PLAYLIST_PLACEHOLDER} disabled={isBusy} className={cn(MCS.H_9_W_FULL_ROUNDED_XL_BORDER_BORDER_SLATE_700_80_BG_SLATE_950_70_PL_10_PR_3)} />
            </div>
            <StudioSegmentedControl>
              <Tooltip content={texts.SUNO_EVALUATE_ON_TOOLTIP} align={SOURCE_TEXT_CENTER}>
                <StudioSegmentButton selected={sunoEvaluateTracks} onClick={() => setSunoEvaluateTracks(true)} disabled={isBusy}>
                  <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_H_3_SHRINK_0)} />
                  <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_EVALUATE_ON}</span>
                </StudioSegmentButton>
              </Tooltip>
              <Tooltip content={texts.SUNO_EVALUATE_OFF_TOOLTIP} align={SOURCE_TEXT_CENTER}>
                <StudioSegmentButton selected={!sunoEvaluateTracks} onClick={() => setSunoEvaluateTracks(false)} disabled={isBusy}>
                  <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_EVALUATE_OFF}</span>
                </StudioSegmentButton>
              </Tooltip>
            </StudioSegmentedControl>
            <StudioSegmentedControl>
              {_.map([SOURCE_TEXT_MP3, SOURCE_TEXT_WAV] as SunoDownloadFormat[], (format) => (
                <Tooltip key={format} content={format === AUDIO_FORMATS.MP3 ? texts.FORMAT_MP3_TOOLTIP : texts.FORMAT_WAV_TOOLTIP} align={SOURCE_TEXT_CENTER}>
                  <StudioSegmentButton selected={sunoDownloadFormat === format} onClick={() => setSunoDownloadFormat(format)} disabled={isBusy}>
                    {format}
                  </StudioSegmentButton>
                </Tooltip>
              ))}
            </StudioSegmentedControl>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              type={SOURCE_TEXT_BUTTON}
              onClick={handleDownloadSunoMusic}
              disabled={isBusy || _.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl || sunoTestPlaylistUrl)}
              className={cn(MCS.H_9_PX_3_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CE, { [MCS.BG_GRADIENT_TO_R_FROM_AMBER_600_VIA_ORANGE_600_TO_ROSE_600_BORDER_AMBER_400]: isDownloadingSuno, [MCS.BG_GRADIENT_TO_R_FROM_AMBER_500_VIA_ORANGE_500_TO_ROSE_600_HOVER_FROM_AMBER]: !isDownloadingSuno })}>
              {isDownloadingSuno ? <Disc3 className={cn(MCS.W_3_5_H_3_5_SHRINK_0_ANIMATE_SPIN_TEXT_AMBER_200)} /> : <Download className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{isDownloadingSuno ? texts.SUNO_DOWNLOADING_BTN : texts.SUNO_DOWNLOAD_BTN}</span>
            </Button>
            {isDownloadingSuno && (
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelSunoDownload} className={cn(MCS.H_9_PX_3_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_ROSE_500_50_BG_ROSE_600)}>
                <X className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_DOWNLOAD_CANCEL_BTN}</span>
              </Button>
            )}
            <Tooltip content={isCopiedPlaylistUrl ? texts.COPIED_LABEL : texts.SUNO_PLAYLIST_COPY_BTN} align={SOURCE_TEXT_CENTER}>
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCopyPlaylistUrl} disabled={_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl)} className={cn(MCS.H_9_W_7_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_SLATE_400_HOVER_TEXT_A)}>
                {isCopiedPlaylistUrl ? <Check className={cn(MCS.W_4_H_4_SHRINK_0_TEXT_EMERALD_400)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_4_H_4_SHRINK_0)} />}
              </Button>
            </Tooltip>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => window.open(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl, SUNO_AUTOMATION_CONFIG.TARGET_BLANK, SOURCE_TEXT_NOOPENER_NOREFERRER)} disabled={_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl)} className={cn(MCS.H_9_PX_3_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_SLATE_800_90_HOVER_BG_SLATE_700_90)}>
              <ExternalLink className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_AMBER_400)} />
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_PLAYLIST_OPEN_BTN}</span>
            </Button>
            <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => window.open(sunoTestPlaylistUrl, SUNO_AUTOMATION_CONFIG.TARGET_BLANK, SUNO_AUTOMATION_CONFIG.OPENER_POLICY)} disabled={_.isEmpty(sunoTestPlaylistUrl)} className={cn(MCS.H_9_PX_3_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_CYAN_950_70_HOVER_BG_CYAN_900_80_T)}>
              <ExternalLink className={cn(MCS.W_3_5_H_3_5_SHRINK_0_TEXT_CYAN_400)} />
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.SUNO_TEST_OPEN_BTN}</span>
            </Button>
          </div>
          {sunoDownloadError && (
            <div role={SOURCE_TEXT_ALERT} className={cn(MCS.ROUNDED_XL_BORDER_BORDER_ROSE_500_40_BG_ROSE_500_10_PX_3_PY_2_TEXT_XS_TEXT)}>
              <AlertTriangle className={cn(MCS.MR_1_5_INLINE_H_3_5_W_3_5)} />
              {sunoDownloadError}
            </div>
          )}
          {styleAnalysis && !isLoading && (
            <details className={cn(MCS.ROUNDED_2XL_BORDER_BORDER_SLATE_800_90_BG_SLATE_900_80_BACKDROP_BLUR_MD_SHA)}>
              <summary className={cn(MCS.FLEX_CURSOR_POINTER_LIST_NONE_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_PX_4_PY_3)}>
                <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN)}>
                  <div className={cn(MCS.W_6_H_6_ROUNDED_LG_BG_AMBER_500_15_BORDER_BORDER_AMBER_500_30_FLEX_ITEMS_CE)}>
                    <Sparkles className={cn(MCS.H_3_5_W_3_5_TEXT_AMBER_400)} />
                  </div>
                  <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP)}>
                    <span className={cn(MCS.FONT_BOLD_TEXT_XS_SM_TEXT_SM_TEXT_SLATE_100_TRACKING_TIGHT)}>{texts.DNA_ANALYSIS_TITLE}</span>
                    <span className={cn(MCS.PX_2_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD_BG_EMERALD_500_15_TE)}>
                      {styleAnalysis.market.confidence}
                      {SOURCE_TEXT_SYMBOL_17}
                      {texts.RECOMMENDED_BADGE || SOURCE_TEXT_KHOP}
                    </span>
                  </div>
                </div>
                <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_TEXT_XS_TEXT_SLATE_400_GROUP_HOVER_TEXT_SLATE_200)}>
                  <ChevronDown className={cn(MCS.H_4_W_4_TRANSITION_TRANSFORM_DURATION_200_GROUP_OPEN_ROTATE_180)} />
                </div>
              </summary>
              <div className={cn(MCS.P_4_SM_P_5_SPACE_Y_4_TEXT_LEFT)}>
                <div className={cn(MCS.GRID_GRID_COLS_1_SM_GRID_COLS_2_LG_GRID_COLS_4_GAP_3)}>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_1_5_FLEX)}>
                    <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400_FLEX)}>
                      <Globe className={cn(SRT.SOURCE_TEXT_W_3_H_3_TEXT_INDIGO_400)} />
                      <span>{texts.MARKET_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </span>
                    <p className={cn(MCS.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG)}>{_.compact([styleAnalysis.market.country, styleAnalysis.market.region, styleAnalysis.market.language]).join(SOURCE_TEXT_SYMBOL_18)}</p>
                  </StudioCard>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_1_5_FLEX)}>
                    <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400_FLEX)}>
                      <Users className={cn(MCS.W_3_H_3_TEXT_VIOLET_400_SHRINK_0)} />
                      <span>{texts.AUDIENCE_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </span>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1_5_FLEX_WRAP)}>
                      <span className={cn(MCS.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG)}>{styleAnalysis.market.audienceAge}</span>
                      <span className={cn(MCS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_EMERALD_300_BG_EMERALD_950_60_BORDER_BOR)}>
                        {styleAnalysis.market.confidence}
                        {SOURCE_TEXT_SYMBOL_8}
                      </span>
                    </div>
                  </StudioCard>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_1_5_FLEX)}>
                    <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400_FLEX)}>
                      <Music2 className={cn(MCS.W_3_H_3_TEXT_PURPLE_400_SHRINK_0)} />
                      <span>{texts.GENRE_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </span>
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_FLEX)}>
                      <span className={cn(MCS.TEXT_11PX_FONT_BOLD_TEXT_PURPLE_300_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_5)}>{styleAnalysis.genre.primary}</span>
                      {_.map(_.slice(styleAnalysis.genre.secondary, 0, 2), (sec, idx) => (
                        <span key={idx} className={cn(MCS.TEXT_10PX_TEXT_SLATE_300_BG_SLATE_800_PX_1_5_PY_0_5_ROUNDED_BORDER_BORDER_S)}>
                          {sec}
                        </span>
                      ))}
                    </div>
                  </StudioCard>
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_1_5_FLEX)}>
                    <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400_FLEX)}>
                      <Clock className={cn(MCS.W_3_H_3_TEXT_AMBER_400_SHRINK_0)} />
                      <span>{texts.ERA_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </span>
                    <p className={cn(MCS.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG)}>
                      {styleAnalysis.era.songwritingEra}
                      {SOURCE_TEXT_SYMBOL_2}
                      {styleAnalysis.era.productionEra}
                    </p>
                  </StudioCard>
                </div>
                <div className={cn(MCS.GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_3)}>
                  <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_INDIGO_950_20_BORDER_BORDER_INDIGO_500_30_SPACE_Y_1_5_S)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_INDIGO_300_FONT_MONO_FONT_BOLD_TEXT_11PX_UPP)}>
                      <SlidersHorizontal className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.CREATIVE_ROLE_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_XS_TEXT_SLATE_200_LEADING_RELAXED_FONT_NORMAL)}>{styleAnalysis.creativeProfile.role}</p>
                  </div>
                  <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_PURPLE_950_20_BORDER_BORDER_PURPLE_500_30_SPACE_Y_1_5_S)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_PURPLE_300_FONT_MONO_FONT_BOLD_TEXT_11PX_UPP)}>
                      <Music2 className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.MUSIC_DNA_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_XS_TEXT_SLATE_200_LEADING_RELAXED_FONT_NORMAL)}>{_.compact([styleAnalysis.musicalDna.rhythm, styleAnalysis.musicalDna.tempoRange, styleAnalysis.musicalDna.vocalCharacter]).join(SOURCE_TEXT_SYMBOL_18)}</p>
                  </div>
                </div>
                <div className={cn(MCS.GRID_GRID_COLS_1_MD_GRID_COLS_3_GAP_3)}>
                  <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_EMERALD_950_20_BORDER_BORDER_EMERALD_500_30_SPACE_Y_1_5)}>
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_2)}>
                      <Check className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.PRESERVE_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_200_LEADING_RELAXED)}>{styleAnalysis.mustPreserve.join(SOURCE_TEXT_SYMBOL_6)}</p>
                  </div>
                  <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_AMBER_950_20_BORDER_BORDER_AMBER_500_30_SPACE_Y_1_5_SHA)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_AMBER_400_FONT_BOLD_TEXT_XS)}>
                      <RefreshCw className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.MUST_VARY_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_200_LEADING_RELAXED)}>{styleAnalysis.mustVary.join(SOURCE_TEXT_SYMBOL_6)}</p>
                  </div>
                  <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_ROSE_950_20_BORDER_BORDER_ROSE_500_30_SPACE_Y_1_5_SHADO)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_ROSE_400_FONT_BOLD_TEXT_XS)}>
                      <AlertTriangle className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.MUST_NOT_COPY_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_200_LEADING_RELAXED)}>{styleAnalysis.mustNotCopy.join(SOURCE_TEXT_SYMBOL_6)}</p>
                  </div>
                </div>
                {!_.isEmpty(styleAnalysis.uncertainties) && (
                  <StudioCard className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_40_BORDER_BORDER_SLATE_800_80_SPACE_Y_1_SHADOW)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_SLATE_400_FONT_BOLD_TEXT_11PX)}>
                      <AlertTriangle className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                      <span>{texts.UNCERTAINTIES_LABEL.replace(SOURCE_TEXT_SYMBOL_16, MUSIC_CREATOR_RUNTIME.EMPTY)}</span>
                    </div>
                    <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_300_LEADING_RELAXED)}>{formatStyleAnalysisItems(styleAnalysis.uncertainties)}</p>
                  </StudioCard>
                )}
                {sunoSettings && (
                  <div className={cn(MCS.PT_4_BORDER_T_BORDER_FUCHSIA_500_20_SPACE_Y_3_5)}>
                    <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_2_TEXT_FUCHSIA_300)}>
                      <SlidersHorizontal className={cn(MCS.H_4_W_4_SHRINK_0)} />
                      <span className={cn(MCS.TEXT_XS_SM_TEXT_SM_FONT_BOLD)}>{texts.SUNO_SETTINGS_ANALYSIS_TITLE}</span>
                    </div>
                    {sunoSettingsAnalysis && (
                      <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_PURPLE_950_20_BORDER_BORDER_PURPLE_500_25_SPACE_Y_2_SHA)}>
                        <div className={cn(MCS.TEXT_11PX_UPPERCASE_TRACKING_WIDER_FONT_MONO_FONT_BOLD_TEXT_PURPLE_300_FLEX)}>
                          <WandSparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT_8)} />
                          <span>{texts.SUNO_PRODUCTION_ASSESSMENT_LABEL}</span>
                        </div>
                        <div className={cn(MCS.FLEX_FLEX_WRAP_GAP_1_5_TEXT_XS_TEXT_SLATE_200)}>
                          {_.map(
                            _.compact([sunoSettingsAnalysis.productionAssessment.syntheticRole, sunoSettingsAnalysis.productionAssessment.cultureAndMarket, sunoSettingsAnalysis.productionAssessment.eraAndGenre, sunoSettingsAnalysis.productionAssessment.vocalProfile, sunoSettingsAnalysis.productionAssessment.songAndArrangementProfile, sunoSettingsAnalysis.productionAssessment.productionGoal]),
                            (assessment, idx) => (
                              <span key={idx} className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_PX_2_5_PY_1_ROUNDED_LG_BG_PURPLE_500_10_BORDER_BOR)}>
                                {assessment}
                              </span>
                            ),
                          )}
                        </div>
                        {!_.isEmpty(sunoSettingsAnalysis.productionAssessment.risks) && (
                          <div className={cn(MCS.FLEX_ITEMS_START_GAP_1_5_PT_1_TEXT_11PX_TEXT_AMBER_300_LEADING_RELAXED_BORD)}>
                            <AlertTriangle className={cn(MCS.W_3_5_H_3_5_TEXT_AMBER_400_SHRINK_0_MT_0_5)} />
                            <span>{sunoSettingsAnalysis.productionAssessment.risks.join(SOURCE_TEXT_SYMBOL_6)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={cn(MCS.P_3_5_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_2_SHADO)}>
                      <div className={cn(MCS.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP)}>
                        <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_ROSE_400_FONT_MONO_FONT_BOLD_TEXT_11PX_UPPER)}>
                          <X className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />
                          <span>{texts.SUNO_EXCLUDE_STYLES_LABEL}</span>
                        </div>
                        {sunoSettings.excludeStyles && (
                          <Button
                            variant={SOURCE_TEXT_UNSTYLED}
                            type={SOURCE_TEXT_BUTTON}
                            onClick={() => copyText(sunoSettings.excludeStyles, SOURCE_TEXT_EXCLUDESTYLES, texts.SUNO_COPY_EXCLUDE_STYLES_SUCCESS)}
                            className={cn(MCS.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX_P_0_ASPEC_4)}
                            title={copiedKey === COPY_KEYS.EXCLUDE_STYLES ? texts.COPIED_LABEL : texts.SUNO_COPY_EXCLUDE_STYLES_BTN}>
                            {copiedKey === COPY_KEYS.EXCLUDE_STYLES ? <Check className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT_4)} /> : <Copy className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_SHRINK_3)} />}
                          </Button>
                        )}
                      </div>
                      {sunoSettings.excludeStyles ? (
                        <div className={cn(MCS.FLEX_FLEX_WRAP_GAP_1_5_MAX_H_36_OVERFLOW_Y_AUTO_PR_1_PY_0_5)}>
                          {_.map(sunoSettings.excludeStyles.split(SOURCE_TEXT_SYMBOL_4), (styleItem, idx) => {
                            const trimmed = _.trim(styleItem);
                            if (!trimmed) return null;
                            return (
                              <span key={idx} className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_PX_2_PY_0_5_ROUNDED_MD_TEXT_11PX_FONT_MEDIUM_BG_RO)}>
                                {trimmed}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={cn(MCS.TEXT_11PX_FONT_BOLD_TEXT_SLATE_400_BG_SLATE_800_60_PX_2_PY_0_5_ROUNDED_MD_I)}>{texts.SUNO_AUTO_VALUE}</span>
                      )}
                      {sunoSettingsAnalysis?.parameterRationale.excludeStyles && (
                        <div className={cn(MCS.SPACE_Y_0_5_PT_1_5_BORDER_T_BORDER_SLATE_800_60_MIN_W_0)}>
                          <span className={cn(MCS.TEXT_9PX_UPPERCASE_TRACKING_WIDER_FONT_BOLD_TEXT_SLATE_500)}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                          <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_300_LEADING_RELAXED_BREAK_WORDS)}>{sunoSettingsAnalysis.parameterRationale.excludeStyles}</p>
                        </div>
                      )}
                      <SunoParameterAnalysisDetails analysis={sunoSettingsAnalysis?.parameterAnalysis?.excludeStyles} texts={texts} />
                    </div>
                    <div className={cn(SRT.SOURCE_TEXT_GRID_GRID_COLS_2_SM_GRID_COLS)}>
                      {_.map(
                        [
                          {
                            label: texts.SUNO_VOCAL_GENDER_LABEL,
                            value: sunoSettings.vocalGender === SUNO_VOCAL_GENDERS.MALE ? texts.SUNO_MALE_VALUE : sunoSettings.vocalGender === SUNO_VOCAL_GENDERS.FEMALE ? texts.SUNO_FEMALE_VALUE : texts.SUNO_AUTO_VALUE,
                            reason: sunoSettingsAnalysis?.parameterRationale.vocalGender,
                            analysis: sunoSettingsAnalysis?.parameterAnalysis?.vocalGender,
                            badgeClass: SOURCE_TEXT_TEXT_FUCHSIA_300_BG_FUCHSIA_500,
                          },
                          { label: texts.SUNO_DURATION_LABEL, value: texts.SUNO_AUTO_VALUE, reason: MUSIC_CREATOR_RUNTIME.EMPTY, analysis: sunoSettingsAnalysis?.parameterAnalysis?.duration, badgeClass: SOURCE_TEXT_TEXT_SLATE_300_BG_SLATE_800 },
                          {
                            label: texts.SUNO_MAX_MODE_LABEL,
                            value: sunoSettings.maxMode ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE,
                            settingKey: SOURCE_TEXT_MAXMODE,
                            enabled: sunoSettings.maxMode,
                            reason: sunoSettingsAnalysis?.parameterRationale.maxMode,
                            analysis: sunoSettingsAnalysis?.parameterAnalysis?.maxMode,
                            badgeClass: sunoSettings.maxMode ? SOURCE_TEXT_TEXT_EMERALD_300_BG_EMERALD_500 : SOURCE_TEXT_TEXT_SLATE_400_BG_SLATE_800,
                          },
                          {
                            label: texts.SUNO_PERSONALIZE_LABEL,
                            value: sunoSettings.personalize ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE,
                            settingKey: SOURCE_TEXT_PERSONALIZE,
                            enabled: sunoSettings.personalize,
                            reason: sunoSettingsAnalysis?.parameterRationale.personalize,
                            analysis: sunoSettingsAnalysis?.parameterAnalysis?.personalize,
                            badgeClass: sunoSettings.personalize ? SOURCE_TEXT_TEXT_EMERALD_300_BG_EMERALD_500 : SOURCE_TEXT_TEXT_SLATE_400_BG_SLATE_800,
                          },
                        ],
                        (item) => (
                          <StudioCard key={item.label} className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_2_SHADOW)}>
                            <div className={cn(MCS.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_1_5)}>
                              <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400_SHRIN)}>{item.label}</span>
                              {SOURCE_TEXT_SETTINGKEY in item && item.settingKey ? (
                                <button
                                  type={SOURCE_TEXT_BUTTON}
                                  role={SOURCE_TEXT_SWITCH}
                                  aria-checked={item.enabled}
                                  aria-label={item.label}
                                  title={SOURCE_TEMPLATE_SYMBOL_16(String(item.label), String(item.enabled ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE))}
                                  disabled={isBusy}
                                  onClick={() => setSunoSettings((current) => (current ? { ...current, [item.settingKey]: !current[item.settingKey] } : current))}
                                  className={cn(MCS.TOGGLE_SWITCH_SELECT_NONE_FOCUS_OUTLINE_NONE_FOCUS_VISIBLE_RING_2_FOCUS_VIS, item.enabled ? MCS.BG_EMERALD_500_BORDER_BORDER_EMERALD_400_60_SHADOW_SM_SHADOW_EMERALD_500_30 : SRT.SOURCE_TEXT_BG_SLATE_800_BORDER_BORDER_SLATE_700)}>
                                  <span aria-hidden={SOURCE_TEXT_TRUE} className={cn(MCS.TOGGLE_SWITCH_THUMB_SHADOW_MD, item.enabled ? SRT.SOURCE_TEXT_TRANSLATE_X_20PX_BG_WHITE : SRT.SOURCE_TEXT_TRANSLATE_X_0_BG_SLATE_300)} />
                                </button>
                              ) : (
                                <span className={cn(MCS.TEXT_11PX_FONT_BOLD_BORDER_PX_2_PY_0_5_ROUNDED_MD_SHRINK_0, item.badgeClass)}>{item.value}</span>
                              )}
                            </div>
                            {item.reason && (
                              <div className={cn(MCS.SPACE_Y_0_5_MIN_W_0)}>
                                <span className={cn(MCS.TEXT_9PX_UPPERCASE_TRACKING_WIDER_FONT_BOLD_TEXT_SLATE_500)}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                                <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_300_LEADING_RELAXED_BREAK_WORDS)}>{item.reason}</p>
                              </div>
                            )}
                            <SunoParameterAnalysisDetails analysis={item.analysis} texts={texts} />
                          </StudioCard>
                        ),
                      )}
                    </div>
                    <div className={cn(MCS.GRID_GRID_COLS_1_SM_GRID_COLS_2_LG_GRID_COLS_4_GAP_3)}>
                      {_.map(
                        [
                          { label: texts.SUNO_WEIRDNESS_LABEL, value: sunoSettings.weirdness, reason: sunoSettingsAnalysis?.parameterRationale.weirdness, analysis: sunoSettingsAnalysis?.parameterAnalysis?.weirdness, gradient: SOURCE_TEXT_FROM_PURPLE_500_TO_INDIGO_500 },
                          { label: texts.SUNO_STYLE_INFLUENCE_LABEL, value: sunoSettings.styleInfluence, reason: sunoSettingsAnalysis?.parameterRationale.styleInfluence, analysis: sunoSettingsAnalysis?.parameterAnalysis?.styleInfluence, gradient: SOURCE_TEXT_FROM_FUCHSIA_500_TO_PINK_500 },
                          { label: texts.SUNO_AUDIO_INFLUENCE_LABEL, value: sunoSettings.audioInfluence, reason: sunoSettingsAnalysis?.parameterRationale.audioInfluence, analysis: sunoSettingsAnalysis?.parameterAnalysis?.audioInfluence, gradient: SOURCE_TEXT_FROM_AMBER_500_TO_ORANGE_500 },
                          { label: texts.SUNO_VARIETY_LABEL, value: sunoSettings.variety, reason: sunoSettingsAnalysis?.parameterRationale.variety, analysis: sunoSettingsAnalysis?.parameterAnalysis?.variety, gradient: SOURCE_TEXT_FROM_INDIGO_500_TO_CYAN_500 },
                        ],
                        (item) => (
                          <StudioCard key={item.label} className={cn(MCS.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_SLATE_800_80_SPACE_Y_2_5_SHADO)}>
                            <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                              <span className={cn(MCS.TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_SLATE_400)}>{item.label}</span>
                              <span className={cn(MCS.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_FUCHSIA_300_BG_FUCHSIA_500_10_BORDER_BORDE)}>
                                {item.value}
                                {SOURCE_TEXT_SYMBOL_8}
                              </span>
                            </div>
                            <div className={cn(MCS.W_FULL_BG_SLATE_800_80_ROUNDED_FULL_H_1_5_OVERFLOW_HIDDEN)}>
                              <div className={cn(MCS.H_FULL_ROUNDED_FULL_TRANSITION_ALL_DURATION_300_BG_GRADIENT_TO_R, item.gradient)} style={{ width: MCF.PERCENTAGE(Math.min(100, Math.max(0, item.value))) }} />
                            </div>
                            {item.reason && (
                              <div className={cn(MCS.SPACE_Y_0_5_MIN_W_0)}>
                                <span className={cn(MCS.TEXT_9PX_UPPERCASE_TRACKING_WIDER_FONT_BOLD_TEXT_SLATE_500)}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                                <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_300_LEADING_RELAXED_BREAK_WORDS)}>{item.reason}</p>
                              </div>
                            )}
                            <SunoParameterAnalysisDetails analysis={item.analysis} texts={texts} />
                          </StudioCard>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
          <MusicPlanProgressPanel progress={musicProgress} language={currentLang} />
          {(isLoading && _.isEmpty(songs)) || (isRegeneratingSeo && viewMode === MUSIC_VIEW_MODES.SEO) ? (
            <StudioLoadingState secondary={isRegeneratingSeo} icon={isRegeneratingSeo ? Search : Disc3} title={isRegeneratingSeo ? texts.BLOCK_SEO_LOADING : texts.BLOCK_LYRICS_LOADING} description={isRegeneratingSeo ? texts.SEO_OPTIONS_COUNT_BADGE : SOURCE_TEMPLATE_SYMBOL_17(String(texts.HEADER_BADGE), String(outputCount), String(texts.SONG_UNIT))} />
          ) : _.isEmpty(songs) ? (
            <div className={cn(SRT.SOURCE_TEXT_PY_14_FLEX_FLEX_COL_ITEMS_CENTER)}>
              <div className={cn(SRT.SOURCE_TEXT_W_14_H_14_ROUNDED_2XL_BG)}>
                <Music2 className={cn(SRT.SOURCE_TEXT_W_7_H_7_TEXT_PURPLE_400_2)} />
              </div>
              <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_1_MAX_W_SM)}>
                <h3 className={cn(SRT.SOURCE_TEXT_TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_200)}>{texts.BLOCK_LYRICS_EMPTY_TITLE}</h3>
                <p className={cn(SRT.SOURCE_TEXT_TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_2)}>{texts.BLOCK_LYRICS_EMPTY_DESC}</p>
              </div>
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleTrySampleTemplate} disabled={isBusy} className={cn(MCS.PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_BG_PURPLE_600_20_HOVER_BG_PURPLE_600)}>
                <Sparkles className={cn(SRT.SOURCE_TEXT_W_3_5_H_3_5_TEXT_8)} />
                <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.TRY_SAMPLE_BTN}</span>
              </Button>
            </div>
          ) : (
            <div>
              {!_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl) && (
                <div className={cn(MCS.RELATIVE_MB_5_OVERFLOW_HIDDEN_ROUNDED_2XL_BORDER_BORDER_AMBER_500_30_BG_GRA)}>
                  <div className={cn(MCS.POINTER_EVENTS_NONE_ABSOLUTE_INSET_X_0_TOP_0_H_1PX_BG_GRADIENT_TO_R_FROM_TR)} />
                  <div className={cn(MCS.FLEX_FLEX_COL_MD_FLEX_ROW_MD_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_5)}>
                    <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_3_MIN_W)}>
                      <div className={cn(MCS.W_10_H_10_ROUNDED_XL_BG_GRADIENT_TO_TR_FROM_AMBER_500_VIA_ORANGE_500_TO_ROS)}>
                        <div className={cn(MCS.W_FULL_H_FULL_BG_SLATE_950_ROUNDED_10PX_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TE)}>
                          <Disc3 className={cn(MCS.W_5_H_5_ANIMATE_SPIN_ANIMATION_DURATION_8S)} />
                        </div>
                      </div>
                      <div className={cn(MCS.MIN_W_0_SPACE_Y_0_5)}>
                        <div className={cn(SRT.SOURCE_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP)}>
                          <span className={cn(MCS.FONT_BLACK_TEXT_SLATE_100_TEXT_SM_SM_TEXT_BASE_TRACKING_TIGHT)}>{texts.SUNO_PLAYLIST_LABEL}</span>
                          <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_1_PX_2_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_BOLD)}>
                            <span className={cn(MCS.W_1_5_H_1_5_ROUNDED_FULL_BG_EMERALD_400_ANIMATE_PULSE)} />
                            {texts.SUNO_PLAYLIST_STATUS_READY}
                          </span>
                          {!_.isEmpty(sunoTrackIds) && <span className={cn(MCS.PX_2_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD_BG_AMBER_500_15_BORD)}>{texts.formatTrackCount(sunoTrackIds.length)}</span>}
                        </div>
                        <p className={cn(MCS.TEXT_11PX_TEXT_SLATE_400_LEADING_NORMAL_TRUNCATE_MAX_W_MD_SM_MAX_W_XL)}>{texts.SUNO_PLAYLIST_SUBTITLE}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {viewMode === MUSIC_VIEW_MODES.LYRICS && (
                <div className={cn(MCS.GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_4_MAX_H_700PX_OVERFLOW_Y_AUTO_CUSTOM_SC)}>
                  {_.map(songs, (song, idx) => (
                    <SongCard key={song.songId || idx} song={song} index={idx} texts={texts} />
                  ))}
                </div>
              )}
              {viewMode === MUSIC_VIEW_MODES.SEO && <PlaylistSeoCard seoOptions={displayedSeoOptions} texts={texts} playlistUrl={_.trim(downloadPlaylistUrl) || sunoPlaylistUrl} />}
              {viewMode === MUSIC_VIEW_MODES.SPLIT && (
                <div className={cn(SRT.SOURCE_TEXT_SPACE_Y_4)}>
                  <div className={cn(MCS.FLEX_ITEMS_CENTER_GAP_1_5_OVERFLOW_X_AUTO_PB_2_CUSTOM_SCROLLBAR)}>
                    {_.map(songs, (song, idx) => {
                      const isSelected = selectedSeoSongIndex === idx;
                      return (
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          key={idx}
                          type={SOURCE_TEXT_BUTTON}
                          onClick={() => setSelectedSeoSongIndex(idx)}
                          className={cn(MCS.PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_FONT_BOLD_WHITESPACE_NOWRAP_TRANSITION_ALL_C, { [MCS.BG_GRADIENT_TO_R_FROM_INDIGO_600_TO_PURPLE_600_TEXT_WHITE_BORDER_INDIGO_400]: isSelected, [MCS.BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800]: !isSelected })}>
                          <span className={cn(MCS.FONT_MONO_FONT_BLACK_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE, { [MCS.TEXT_INDIGO_100]: isSelected, [MCS.TEXT_INDIGO_600_GROUP_HOVER_TEXT_INDIGO_800_DARK_TEXT_INDIGO_400_DARK_GROUP]: !isSelected })}>{texts.formatTrackBadge(idx + 1)}</span>
                          <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{_.truncate(toSentenceCase(song.title), { length: 18 })}</span>
                        </Button>
                      );
                    })}
                  </div>
                  {songs[selectedSeoSongIndex] && (
                    <div className={cn(MCS.GRID_GRID_COLS_1_LG_GRID_COLS_2_GAP_4_ITEMS_START)}>
                      <SongCard song={songs[selectedSeoSongIndex]} index={selectedSeoSongIndex} texts={texts} />
                      <PlaylistSeoCard seoOptions={displayedSeoOptions} texts={texts} playlistUrl={_.trim(downloadPlaylistUrl) || sunoPlaylistUrl} columns={1} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </StudioCard>
      </StudioCanvas>
      <ImagePreviewModal imageUrl={previewThumbnail} onClose={() => setPreviewThumbnail(null)} />
      <Modal
        isOpen={Boolean(styleToDelete)}
        onClose={() => setStyleToDelete(null)}
        maxWidth={SOURCE_TEXT_MAX_W_MD}
        title={
          <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_2_LEADING_NONE_TEXT_SLATE_900_DARK_TEXT_SLATE)}>
            <Trash2 className={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0_SELF_CENTER_TRANSLATE_Y_1PX)} />
            <span className={cn(MCS.LEADING_NONE_TEXT_SM_FONT_EXTRABOLD)}>{texts.STYLE_DELETE_BTN}</span>
          </span>
        }>
        <div className={cn(MCS.SPACE_Y_4_TEXT_LEFT)}>
          <p className={cn(MCS.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_700_DARK_TEXT_SLATE_300_LEADING_RELAXED)}>
            {texts.STYLE_DELETE_CONFIRM}
            {SRT.SOURCE_TEXT_SYMBOL_52}
            <span className={cn(MCS.FONT_EXTRABOLD_TEXT_1E1B4B_DARK_TEXT_WHITE)}>
              {SOURCE_TEXT_SYMBOL_19}
              {styleToDelete?.title}
              {SOURCE_TEXT_SYMBOL_20}
            </span>
            {SOURCE_TEXT_SYMBOL_21}
          </p>
          <DestructiveActionNotice className={cn(MCS.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER_ROSE_500_20_TEXT_ROSE_700_DARK)} iconClassName={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0)}>
            {texts.CANNOT_BE_UNDONE}
          </DestructiveActionNotice>
          <div className={cn(MCS.FLEX_JUSTIFY_END_ITEMS_CENTER_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_200_DARK_B)}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_OUTLINE} size={SOURCE_TEXT_SM} onClick={() => setStyleToDelete(null)} className={cn(MCS.H_9_PX_4_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_SLATE_300_DARK_BORDER_S)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.CANCEL_BTN}</span>
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmDeleteStyle} className={cn(MCS.H_9_PX_5_ROUNDED_XL_TEXT_XS_FONT_EXTRABOLD_SHADOW_MD_SHADOW_ROSE_600_20_ACT)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.STYLE_DELETE_BTN}</span>
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(inspoToDelete)}
        onClose={() => setInspoToDelete(null)}
        maxWidth={SOURCE_TEXT_MAX_W_MD}
        title={
          <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_2_LEADING_NONE_TEXT_SLATE_900_DARK_TEXT_SLATE)}>
            <Trash2 className={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0_SELF_CENTER_TRANSLATE_Y_1PX)} />
            <span className={cn(MCS.LEADING_NONE_TEXT_SM_FONT_EXTRABOLD)}>{texts.INSPO_DELETE_CONFIRM}</span>
          </span>
        }>
        <div className={cn(MCS.SPACE_Y_4_TEXT_LEFT)}>
          <p className={cn(MCS.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_700_DARK_TEXT_SLATE_300_LEADING_RELAXED)}>
            {texts.INSPO_DELETE_CONFIRM}
            {SRT.SOURCE_TEXT_SYMBOL_52}
            <span className={cn(MCS.FONT_EXTRABOLD_TEXT_1E1B4B_DARK_TEXT_WHITE)}>
              {SOURCE_TEXT_SYMBOL_19}
              {inspoToDelete?.title}
              {SOURCE_TEXT_SYMBOL_20}
            </span>
            {SOURCE_TEXT_SYMBOL_21}
          </p>
          <DestructiveActionNotice className={cn(MCS.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER_ROSE_500_20_TEXT_ROSE_700_DARK)} iconClassName={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0)}>
            {texts.CANNOT_BE_UNDONE}
          </DestructiveActionNotice>
          <div className={cn(MCS.FLEX_JUSTIFY_END_ITEMS_CENTER_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_200_DARK_B)}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_OUTLINE} size={SOURCE_TEXT_SM} onClick={() => setInspoToDelete(null)} className={cn(MCS.H_9_PX_4_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_SLATE_300_DARK_BORDER_S)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.CANCEL_BTN}</span>
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmDeleteInspo} className={cn(MCS.H_9_PX_5_ROUNDED_XL_TEXT_XS_FONT_EXTRABOLD_SHADOW_MD_SHADOW_ROSE_600_20_ACT)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{texts.STYLE_DELETE_BTN}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </StudioPage>
  );
}
