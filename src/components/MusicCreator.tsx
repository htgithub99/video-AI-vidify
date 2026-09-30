import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Music2,
  WandSparkles,
  Sparkles,
  Copy,
  Check,
  Disc3,
  SlidersHorizontal,
  Flame,
  FileText,
  Search,
  Save,
  Trash2,
  Pencil,
  X,
  Columns,
  Clock,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ExternalLink,
  Link2,
  Globe,
  Users,
  Lock,
} from "lucide-react";
import _ from "lodash";
import { toast } from "sonner";
import { recordWorkflowActivity } from "../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../constants/workflowActivity";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Tooltip } from "./ui/Tooltip";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ImagePreviewModal } from "./auto-video/ImagePreviewModal";
import {
  AiPlanningChatModel,
  AiPlanningExecutionMode,
  AiPlanningFallbackProvider,
} from "../types";
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
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(_.toString(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const response = await fetch(API_ROUTES.PIPELINE_SAVE_FILE, {
    method: HTTP_METHODS.POST,
    headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
    body: jsonUtils.safeStringify({ suggestedName, dataUrl }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || SUNO_AUTOMATION_TEXTS.SAVE_FILE_FAILED_ERR);
  return !result.cancelled;
};



const openMusicMediaDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
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
    const request = db.transaction(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME, "readonly").objectStore(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME).get(key);
    request.onsuccess = () => resolve(_.toString(request.result));
    request.onerror = () => reject(request.error);
  });
};

const writeMusicMedia = async (key: string, value: string): Promise<void> => {
  const db = await openMusicMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SUNO_AUTOMATION_CONFIG.MUSIC_MEDIA_STORE_NAME, "readwrite");
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
  return _.compact(
    _.map(items, (item) =>
      _.isString(item)
        ? { title: _.split(item, ",")[0], content: item }
        : item?.title && item?.content
          ? item
          : undefined,
    ),
  );
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
const formatStyleAnalysisItems = (items: unknown[]): string => _.chain(items)
  .map((item) => {
    if (_.isString(item)) return _.trim(item);
    if (!_.isPlainObject(item)) return "";
    return _.chain(item as Record<string, unknown>)
      .values()
      .filter((value) => _.isString(value) || _.isNumber(value))
      .map((value) => _.trim(_.toString(value)))
      .compact()
      .join(" — ")
      .value();
  })
  .compact()
  .join("; ")
  .value();
interface CuratedDownloadedTrack { songId: string; title: string; qualityScore: number; durationSeconds: number; startSeconds: number }
interface DownloadedMusicTrack { songId: string; title: string }
interface SunoSettings { excludeStyles: string; vocalGender: "male" | "female" | "auto"; duration: "auto"; maxMode: boolean; weirdness: number; styleInfluence: number; audioInfluence: number; variety: number; personalize: boolean }
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
    <div className={cn("space-y-1.5 pt-1.5 border-t border-slate-800/60 min-w-0")}>
      {rows.map(([label, value]) => value && (
        <p key={label} className={cn("text-[10px] text-slate-300 leading-relaxed break-words")}><span className={cn("font-bold text-slate-500")}>{label}: </span>{value}</p>
      ))}
      <span className={cn("inline-flex text-[9px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded")}>{texts.SUNO_SETTINGS_CONFIDENCE_LABEL}: {analysis.confidence}%</span>
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
  return hours > 0
    ? `${_.padStart(_.toString(hours), 2, "0")}:${_.padStart(_.toString(minutes), 2, "0")}:${_.padStart(_.toString(remainingSeconds), 2, "0")}`
    : `${_.padStart(_.toString(minutes), 2, "0")}:${_.padStart(_.toString(remainingSeconds), 2, "0")}`;
};

const replaceSeoTracklistWithTimestamps = (description: string, tracks: CuratedDownloadedTrack[]): string => {
  const heading = SUNO_AUTOMATION_CONFIG.SEO_HEADING_TRACKLIST;
  const headingIndex = description.indexOf(heading);
  const timestampLines = _.map(tracks, (track) => `${formatPlaylistTimestamp(track.startSeconds)} ${track.title}`).join("\n");
  if (headingIndex < 0) {
    const lines = description.split("\n");
    const existingTimestamps = _.findIndex(lines, (line) => MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(line));
    if (existingTimestamps < 0) return _.compact([_.trim(description), timestampLines]).join("\n\n");
    let afterTimestamps = existingTimestamps;
    while (afterTimestamps < lines.length && MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(lines[afterTimestamps])) afterTimestamps += 1;
    return _.compact([
      _.trim(lines.slice(0, existingTimestamps).join("\n")),
      timestampLines,
      _.trim(lines.slice(afterTimestamps).join("\n")),
    ]).join("\n\n");
  }
  const beforeTracklist = description.slice(0, headingIndex + heading.length);
  const afterHeading = description.slice(headingIndex + heading.length);
  const remainingLines = afterHeading.split("\n");
  let lineIndex = 0;
  while (lineIndex < remainingLines.length && (
    _.isEmpty(_.trim(remainingLines[lineIndex])) ||
    MUSIC_CREATOR_REGEXES.NUMBERED_LINE.test(remainingLines[lineIndex]) ||
    MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE.test(remainingLines[lineIndex])
  )) lineIndex += 1;
  const suffix = remainingLines.slice(lineIndex).join("\n").trim();
  return `${beforeTracklist}\n${timestampLines}${suffix ? `\n\n${suffix}` : ""}`;
};

const restoreSeoTimestampTitles = (description: string, songs: Array<{ title: string }>): string => {
  let songIndex = 0;
  return _.map(description.split("\n"), (line) => {
    const match = line.match(MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE);
    if (!match) return line;
    const title = _.trim(songs[songIndex]?.title);
    songIndex += 1;
    return title ? `${match[1]} ${title}` : line;
  }).join("\n");
};

const getSeoTrackOrder = (description: string): string =>
  _.compact(_.map(description.split("\n"), (line) => {
    const match = line.match(MUSIC_CREATOR_REGEXES.TIMESTAMP_LINE);
    return match ? _.trim(line.slice(match[1].length)) : "";
  })).join(" / ");

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
  return {
    ...state,
    songs: _.map(state.songs || [], (song) => ({
      ...song,
      title: VIETNAMESE_MUSIC_TITLE_RESTORATIONS[_.toLower(_.trim(song.title))] || song.title,
    })),
    songTitleSchemaVersion: SUNO_AUTOMATION_CONFIG.MUSIC_SONG_TITLE_SCHEMA_VERSION,
  };
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

const MusicCreatorHeader: React.FC<HeaderProps> = ({
  texts,
  isAiConfigOpen,
  onToggleAiConfig,
  isLoading,
}) => (
  <div className={cn("glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
    <div className={cn("flex items-center gap-3 min-w-0")}>
      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-md shadow-purple-500/20 shrink-0")}>
        <div className={cn("w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400")}>
          <Music2 className={cn("w-5 h-5")} />
        </div>
      </div>
      <div className={cn("min-w-0")}>
        <div className={cn("flex items-center gap-2 flex-wrap")}>
          <h1 className={cn("text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans")}>
            {texts.HEADER_TITLE}
          </h1>
          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs")}>
            <Sparkles className={cn("w-2.5 h-2.5 text-purple-400")} />
            {texts.HEADER_BADGE}
          </span>
        </div>
        <p className={cn("text-[11px] text-slate-400 mt-0.5")}>
          {texts.HEADER_DESC}
        </p>
      </div>
    </div>

    <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
      <Tooltip content={texts.AI_CONFIG_TOOLTIP} align="end">
        <Button variant="unstyled"
          type="button"
          onClick={onToggleAiConfig}
          disabled={isLoading}
          className={cn(
            "group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none",
            {
              "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10": isAiConfigOpen,
              "bg-white/95 hover:bg-purple-50/90 border-slate-200/90 hover:border-purple-300/80 text-slate-800 hover:text-purple-700 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-slate-800 dark:hover:border-purple-500/40 dark:text-slate-200 dark:hover:text-purple-300": !isAiConfigOpen,
            },
          )}>
          <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform")} />
          <span className={cn("inline-flex items-center leading-none text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors")}>
            {texts.AI_CONFIG_TITLE}
          </span>
          {isAiConfigOpen ? (
            <ChevronUp className={cn("w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-colors")} />
          ) : (
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 shrink-0 transition-colors")} />
          )}
        </Button>
      </Tooltip>
    </div>
  </div>
);

interface SongCardProps {
  song: GeneratedSong;
  index: number;
  texts: MusicCreatorTexts;
}

const toSentenceCase = (text: string): string => {
  const trimmed = _.trim(text);
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const SongCard: React.FC<SongCardProps> = ({ song, index, texts }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const displayTitle = toSentenceCase(song.title);

  return (
    <div className={cn("rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 shadow-lg space-y-2 hover:border-purple-500/40 transition-all text-left backdrop-blur-md")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800/80")}>
        <div className={cn("flex items-center gap-2.5 min-w-0 flex-wrap")}>
          <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs sm:text-sm font-black shrink-0 select-none shadow-2xs")}>
            #{index + 1}
          </span>
          <h3 className={cn("text-sm sm:text-base font-black !text-[#0f172a] dark:!text-slate-100 truncate max-w-[200px] sm:max-w-md")} title={displayTitle}>
            {displayTitle}
          </h3>
          <Button variant="unstyled"
            type="button"
            onClick={() => handleCopy(displayTitle, `title-${index}`, texts.COPY_TITLE_SUCCESS)}
            className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none")}
            title={copiedKey === `title-${index}` ? texts.COPIED_LABEL : texts.COPY_TITLE_BTN}>
            {copiedKey === `title-${index}` ? (
              <Check className={cn("w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0")} />
            ) : (
              <Copy className={cn("w-3.5 h-3.5 shrink-0")} />
            )}
          </Button>
        </div>
        <div className={cn("flex items-center gap-1.5 flex-wrap")}>
          {song.genre && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 !text-[#0369a1] dark:!text-sky-300 select-none")}>
              {song.genre}
            </span>
          )}
          {song.tempoBpm > 0 && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 !text-[#9a3412] dark:!text-amber-300 inline-flex items-center gap-1 select-none")}>
              <Clock className={cn("w-3 h-3 !text-[#c2410c] dark:!text-amber-400 shrink-0")} />
              <span>{song.tempoBpm} {texts.BPM_UNIT}</span>
            </span>
          )}
          {song.mood && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 !text-[#065f46] dark:!text-emerald-300 select-none")}>
              {song.mood}
            </span>
          )}
        </div>
      </div>

      {song.lyrics && (
        <div className={cn("space-y-1.5 pt-0.5")}>
          <div className={cn("flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300")}>
            <span className={cn("flex items-center gap-1.5 font-mono text-[10px] text-pink-600 dark:text-pink-400 uppercase tracking-wider font-bold")}>
              <FileText className={cn("w-3 h-3")} />
              {texts.LYRICS_TITLE}
            </span>
            <Button variant="unstyled"
              type="button"
              onClick={() => handleCopy(song.lyrics, `lyrics-${index}`, texts.COPY_LYRICS_SUCCESS)}
              className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none")}
              title={copiedKey === `lyrics-${index}` ? texts.COPIED_LABEL : texts.COPY_LYRICS_BTN}>
              {copiedKey === `lyrics-${index}` ? (
                <Check className={cn("w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0")} />
              ) : (
                <Copy className={cn("w-3.5 h-3.5 shrink-0")} />
              )}
            </Button>
          </div>
          <pre className={cn("p-3.5 rounded-xl bg-slate-955/90 border border-slate-800/90 text-xs font-sans whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar text-slate-200 leading-relaxed shadow-inner")}>
            {song.lyrics}
          </pre>
        </div>
      )}
    </div>
  );
};

interface PlaylistSeoCardProps {
  seoOptions: SongSeoOption[];
  texts: MusicCreatorTexts;
  playlistUrl: string;
  columns?: 1 | 2 | 3;
}

const PlaylistSeoCard: React.FC<PlaylistSeoCardProps> = ({ seoOptions, texts, playlistUrl, columns = 3 }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullOption = (opt: SongSeoOption, index: number) => {
    const trackOrder = getSeoTrackOrder(opt.description);
    const trackOrderSection = trackOrder ? `\n\n[${texts.SEO_TRACK_ORDER}]:\n${trackOrder}` : "";
    const fullText = `=== ${texts.formatOptionLabel(index + 1)} (${texts.formatScoreLabel(opt.seoScore)}) ===\n\n[${texts.SEO_FIELD_TITLE}]:\n${opt.title}\n\n[${texts.SEO_FIELD_DESCRIPTION}]:\n${opt.description}${trackOrderSection}\n\n[${texts.SEO_HASHTAGS_SECTION}]:\n${opt.hashtags.join(" ")}\n\n[${texts.SEO_TAGS_SECTION}]:\n${opt.tags.join(", ")}`;
    handleCopy(fullText, `seo-all-${index}`, texts.COPY_SEO_OPTION_SUCCESS);
  };

  const handleExportText = async () => {
    const optionSections = _.map(seoOptions, (opt, index) => {
      const trackOrder = getSeoTrackOrder(opt.description);
      const trackOrderSection = trackOrder ? `\n\n[${texts.SEO_TRACK_ORDER}]:\n${trackOrder}` : "";
      return `=== ${texts.formatOptionLabel(index + 1)} (${texts.formatScoreLabel(opt.seoScore)}) ===\n\n[${texts.SEO_FIELD_TITLE}]:\n${opt.title}\n\n[${texts.SEO_FIELD_DESCRIPTION}]:\n${opt.description}${trackOrderSection}\n\n[${texts.SEO_HASHTAGS_SECTION}]:\n${opt.hashtags.join(" ")}\n\n[${texts.SEO_TAGS_SECTION}]:\n${opt.tags.join(", ")}`;
    });
    const exportText = `${texts.SEO_EXPORT_TITLE}\n\n[${texts.SEO_PLAYLIST_URL_LABEL}]:\n${_.trim(playlistUrl) || texts.SEO_PLAYLIST_URL_EMPTY}\n\n${optionSections.join(SUNO_AUTOMATION_CONFIG.SECTION_DIVIDER)}`;
    try {
      const saved = await saveMusicBlobWithDialog(new Blob([`\uFEFF${exportText}`], { type: SUNO_AUTOMATION_CONFIG.TEXT_PLAIN_UTF8 }), `${SUNO_AUTOMATION_CONFIG.SEO_EXPORT_FILENAME}${SUNO_AUTOMATION_CONFIG.TXT_EXTENSION}`);
      if (saved) toast.success(texts.SEO_EXPORT_TXT_SUCCESS);
    } catch (error) {
      if (_.get(error, "name") !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
    }
  };

  const CopyFieldButton = ({ text, field, optionIndex, titleText }: { text: string; field: string; optionIndex: number; titleText?: string }) => {
    const key = `seo-${optionIndex}-${field}`;
    const isCopied = copiedKey === key;
    return (
      <Button variant="unstyled"
        type="button"
        onClick={() => handleCopy(text, key, texts.COPY_SEO_FIELD_SUCCESS)}
        className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none")}
        title={isCopied ? texts.COPIED_LABEL : (titleText || texts.COPY_FIELD_BTN)}>
        {isCopied ? (
          <Check className={cn("w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0")} />
        ) : (
          <Copy className={cn("w-3.5 h-3.5 shrink-0")} />
        )}
      </Button>
    );
  };

  const gridColumnsClass = columns === 3
    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    : columns === 2
      ? "grid-cols-1 lg:grid-cols-2"
      : "grid-cols-1";

  return (
    <div className={cn("rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-4 hover:border-fuchsia-500/40 transition-all text-left backdrop-blur-md")}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3")}>
        <div className={cn("flex items-center gap-2")}>
          <Sparkles className={cn("w-4 h-4 text-fuchsia-500 shrink-0")} />
          <h3 className={cn("text-sm sm:text-base font-extrabold !text-[#0f172a] dark:!text-slate-100")}>{texts.PLAYLIST_SEO_TITLE}</h3>
        </div>
        <div className={cn("flex items-center gap-2")}>
          <span className={cn("text-[11px] font-mono font-bold !text-[#a21caf] dark:!text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-0.5 rounded-lg shadow-2xs")}>{texts.SEO_OPTIONS_COUNT_BADGE}</span>
          <Button variant="unstyled" type="button" onClick={handleExportText} disabled={_.isEmpty(seoOptions)} title={texts.SEO_EXPORT_TXT_TOOLTIP} className={cn("h-8 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 border border-fuchsia-400/40 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer")}>
            <Download className={cn("w-3.5 h-3.5")} />
            <span>{texts.SEO_EXPORT_TXT_BTN}</span>
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-4 items-stretch", gridColumnsClass)}>
        {_.map(seoOptions, (opt, sIdx) => {
          const trackOrder = getSeoTrackOrder(opt.description);
          return (
            <div
              key={sIdx}
              className={cn("p-4 rounded-2xl bg-white/70 dark:bg-slate-955/90 border border-slate-200 dark:border-slate-800/80 space-y-3 transition-all hover:border-purple-400/50 dark:hover:border-slate-700 shadow-sm flex flex-col justify-between")}>
              <div className={cn("flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5")}>
                <div className={cn("flex items-center gap-2 min-w-0")}>
                  <span className={cn("inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 !text-[#a21caf] dark:!text-fuchsia-300 font-mono text-xs font-black shadow-2xs")}>
                    {texts.formatOptionLabel(sIdx + 1)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 !text-[#047857] dark:!text-emerald-300 font-mono text-xs font-black shadow-2xs")}>
                    <Sparkles className={cn("w-3 h-3 text-emerald-600 dark:text-emerald-400")} />
                    <span>{texts.formatScoreLabel(opt.seoScore)}</span>
                  </span>
                </div>

                <Button variant="unstyled"
                  type="button"
                  onClick={() => handleCopyFullOption(opt, sIdx)}
                  className={cn("btn-icon-tiny w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 aspect-square rounded-lg flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer")}
                  title={copiedKey === `seo-all-${sIdx}` ? texts.COPIED_LABEL : texts.COPY_SEO_OPTION_BTN}>
                  {copiedKey === `seo-all-${sIdx}` ? (
                    <Check className={cn("w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0")} />
                  ) : (
                    <Copy className={cn("w-4 h-4 shrink-0")} />
                  )}
                </Button>
              </div>

              <div className={cn("space-y-2.5 flex-1 flex flex-col justify-between")}>
                <div className={cn("space-y-2.5")}>
                  <div className={cn("p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center justify-between gap-2")}>
                      <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
                        <FileText className={cn("w-3 h-3 text-purple-500")} />
                        <span>{texts.SEO_FIELD_TITLE}</span>
                      </span>
                      <CopyFieldButton text={opt.title} field="title" optionIndex={sIdx} />
                    </div>
                    <h4 className={cn("text-xs sm:text-[13px] font-black !text-[#0f172a] dark:!text-slate-100 leading-snug break-words")}>
                      {opt.title}
                    </h4>
                  </div>

                  <div className={cn("p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center justify-between gap-2")}>
                      <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
                        <SlidersHorizontal className={cn("w-3 h-3 text-sky-500")} />
                        <span>{texts.SEO_FIELD_DESCRIPTION}</span>
                      </span>
                      <CopyFieldButton text={opt.description} field="description" optionIndex={sIdx} />
                    </div>
                    <p className={cn("text-xs !text-[#334155] dark:!text-slate-300 leading-relaxed max-h-32 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-pre-line break-words")}>
                      {opt.description}
                    </p>
                  </div>

                  {!_.isEmpty(trackOrder) && (
                    <div className={cn("p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 shadow-2xs")}>
                      <div className={cn("flex items-center justify-between gap-2")}>
                        <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
                          <Music2 className={cn("w-3 h-3 text-fuchsia-500")} />
                          <span>{texts.SEO_TRACK_ORDER}</span>
                        </span>
                        <CopyFieldButton text={trackOrder} field="track-order" optionIndex={sIdx} />
                      </div>
                      <p className={cn("text-xs !text-[#334155] dark:!text-slate-300 leading-relaxed max-h-24 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden break-words")}>
                        {trackOrder}
                      </p>
                    </div>
                  )}
                </div>

                <div className={cn("grid grid-cols-1 2xl:grid-cols-2 gap-2.5 pt-1")}>
                  <div className={cn("p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs flex flex-col justify-between")}>
                    <div className={cn("space-y-2")}>
                      <div className={cn("flex items-center justify-between gap-2")}>
                        <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
                          <span className={cn("font-bold text-purple-600 dark:text-purple-400")}>{texts.HASH_SYMBOL}</span>
                          <span>{texts.HASHTAGS_LABEL} ({opt.hashtags.length})</span>
                        </span>
                        <CopyFieldButton text={opt.hashtags.join(" ")} field="hashtags" optionIndex={sIdx} />
                      </div>
                      <div className={cn("flex flex-wrap gap-x-2.5 gap-y-2 max-h-24 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}>
                        {_.map(opt.hashtags, (tag, i) => (
                          <span key={i} className={cn("text-[10px] font-mono font-bold !text-[#7e22ce] dark:!text-purple-300 select-all hover:underline cursor-pointer")}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={cn("p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs flex flex-col justify-between")}>
                    <div className={cn("space-y-2")}>
                      <div className={cn("flex items-center justify-between gap-2")}>
                        <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
                          <Search className={cn("w-3 h-3 text-emerald-500")} />
                          <span>{texts.TAGS_LABEL} ({opt.tags.length})</span>
                        </span>
                        <CopyFieldButton text={opt.tags.join(", ")} field="tags" optionIndex={sIdx} />
                      </div>
                      <p className={cn("text-[10px] font-mono !text-[#475569] dark:!text-slate-300 leading-relaxed max-h-24 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden break-words select-all")}>
                        {opt.tags.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MusicCreator({ currentLang = "vi" }: MusicCreatorProps) {
  const texts = MUSIC_CREATOR_TEXTS[currentLang] || MUSIC_CREATOR_TEXTS.vi;
  const [initialState] = useState<PersistedMusicCreatorState>(readMusicCreatorState);
  const [initialSavedStyles] = useState<SavedMusicStyle[]>(readSavedStyles);
  const [style, setStyle] = useState(() => initialState.style || "");
  const [styleDraft, setStyleDraft] = useState("");
  const [savedStyles, setSavedStyles] = useState<SavedMusicStyle[]>(initialSavedStyles);
  const [styleName, setStyleName] = useState("");
  const [editingStyleIndex, setEditingStyleIndex] = useState<number | null>(null);
  const [styleToDelete, setStyleToDelete] = useState<SavedMusicStyle | null>(null);
  const [copiedStyleIndex, setCopiedStyleIndex] = useState<number | null>(null);
  const [copiedInspoIndex, setCopiedInspoIndex] = useState<number | null>(null);
  const [outputCount, setOutputCount] = useState<number>(initialState.outputCount || MUSIC_CREATOR_CONSTANTS.DEFAULT_SONG_COUNT);
  const [referenceSongs, setReferenceSongs] = useState(initialState.referenceSongs || "");
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
  const [isStopping, setIsStopping] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [isRegeneratingSeo, setIsRegeneratingSeo] = useState(false);
  const [songs, setSongs] = useState<GeneratedSong[]>(initialState.songs || []);
  const [styleAnalysis, setStyleAnalysis] = useState<MusicStyleAnalysis | undefined>(initialState.styleAnalysis);
  const [playlistSeoOptions, setPlaylistSeoOptions] = useState<SongSeoOption[]>(
    initialState.seoSchemaVersion === SUNO_AUTOMATION_CONFIG.MUSIC_SEO_SCHEMA_VERSION ? initialState.playlistSeoOptions || [] : [],
  );
  const [curatedDownloadedTracks, setCuratedDownloadedTracks] = useState<CuratedDownloadedTrack[]>(initialState.curatedDownloadedTracks || []);
  const displayedSeoOptions = _.isEqual(curatedDownloadedTracks.length, songs.length) && !_.isEmpty(curatedDownloadedTracks)
    ? _.map(playlistSeoOptions, (option) => ({ ...option, description: replaceSeoTracklistWithTimestamps(option.description, curatedDownloadedTracks) }))
    : playlistSeoOptions;
  useEffect(() => {
    if (_.isEmpty(songs) || _.isEmpty(playlistSeoOptions)) return;
    if (_.isEqual(curatedDownloadedTracks.length, songs.length)) return;
    const restoredOptions = _.map(playlistSeoOptions, (option) => ({
      ...option,
      description: restoreSeoTimestampTitles(option.description, songs),
    }));
    if (!_.isEqual(restoredOptions, playlistSeoOptions)) setPlaylistSeoOptions(restoredOptions);
  }, [songs, playlistSeoOptions, curatedDownloadedTracks]);
  const [thumbnailDescription, setThumbnailDescription] = useState(initialState.thumbnailDescription || "");
  const [thumbnailReference, setThumbnailReference] = useState<string>("");
  const [thumbnailReferenceName, setThumbnailReferenceName] = useState(initialState.thumbnailReferenceName || "");
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string>("");
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isNormalizingThumbnailNote, setIsNormalizingThumbnailNote] = useState(false);
  const [isCreatingSuno, setIsCreatingSuno] = useState(false);
  const [isCreatingSunoTest, setIsCreatingSunoTest] = useState(false);
  const [sunoTestPlaylistUrl, setSunoTestPlaylistUrl] = useState(initialState.sunoTestPlaylistUrl || "");
  const [sunoTestTrackIds, setSunoTestTrackIds] = useState<string[]>(initialState.sunoTestTrackIds || []);
  const [sunoPlaylistUrl, setSunoPlaylistUrl] = useState(initialState.sunoPlaylistUrl || "");
  const [downloadPlaylistUrl, setDownloadPlaylistUrl] = useState(initialState.downloadPlaylistUrl || "");
  const [sunoTrackIds, setSunoTrackIds] = useState<string[]>(initialState.sunoTrackIds || []);
  const [sunoDownloadFormat, setSunoDownloadFormat] = useState<SunoDownloadFormat>(initialState.sunoDownloadFormat || "wav");
  const [sunoEvaluateTracks, setSunoEvaluateTracks] = useState(initialState.sunoEvaluateTracks ?? true);
  const [isDownloadingSuno, setIsDownloadingSuno] = useState(false);
  const [sunoDownloadError, setSunoDownloadError] = useState("");
  const [isCopiedPlaylistUrl, setIsCopiedPlaylistUrl] = useState(false);
  const [sunoInspo, setSunoInspo] = useState(initialState.sunoInspo || "");
  const [sunoInspoDraft, setSunoInspoDraft] = useState("");
  const [savedInspos, setSavedInspos] = useState<SavedMusicInspo[]>(readSavedInspos);
  const [inspoName, setInspoName] = useState("");
  const [editingInspoIndex, setEditingInspoIndex] = useState<number | null>(null);
  const [inspoToDelete, setInspoToDelete] = useState<SavedMusicInspo | null>(null);
  const [sunoSettings, setSunoSettings] = useState<SunoSettings | undefined>(initialState.sunoSettings);
  const [sunoSettingsAnalysis, setSunoSettingsAnalysis] = useState<SunoSettingsAnalysis | undefined>(initialState.sunoSettingsAnalysis);
  const [downloadedMusicTracks, setDownloadedMusicTracks] = useState<DownloadedMusicTrack[]>(initialState.downloadedMusicTracks || []);
  const [videoBackgroundDescription, setVideoBackgroundDescription] = useState(initialState.videoBackgroundDescription || "");
  const [videoBackgroundReference, setVideoBackgroundReference] = useState("");
  const [videoBackgroundReferenceName, setVideoBackgroundReferenceName] = useState(initialState.videoBackgroundReferenceName || "");
  const [showVideoTrackList, setShowVideoTrackList] = useState(initialState.showVideoTrackList ?? true);
  const [generatedVideoBackground, setGeneratedVideoBackground] = useState("");
  const [isGeneratingVideoBackground, setIsGeneratingVideoBackground] = useState(false);
  const [isNormalizingVideoBackgroundNote, setIsNormalizingVideoBackgroundNote] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
  const [viewMode, setViewMode] = useState<ResultViewMode>(initialState.viewMode || "lyrics");
  const [selectedSeoSongIndex, setSelectedSeoSongIndex] = useState<number>(initialState.selectedSeoSongIndex || 0);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      jsonUtils.setItem(
        SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY,
        {
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
        } satisfies PersistedMusicCreatorState,
      );
    }, 250);
    return () => window.clearTimeout(saveTimer);
  }, [
    style, outputCount, referenceSongs, provider, model, executionMode, chromeHeadless, isAiConfigOpen, songs,
    styleAnalysis, playlistSeoOptions, thumbnailDescription, thumbnailReferenceName, viewMode, selectedSeoSongIndex,
    sunoPlaylistUrl, sunoTestPlaylistUrl, sunoTestTrackIds, downloadPlaylistUrl, sunoTrackIds, curatedDownloadedTracks, sunoDownloadFormat, sunoEvaluateTracks,
    sunoInspo, sunoSettings, sunoSettingsAnalysis, downloadedMusicTracks, videoBackgroundDescription, videoBackgroundReferenceName, showVideoTrackList,
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
    setStyleDraft("");
    setStyleName("");
  };

  const handleSaveStyle = () => {
    const nextContent = _.trim(styleDraft);
    if (_.isEmpty(nextContent)) return;
    const nextTitle = _.trim(styleName) || _.truncate(_.split(nextContent, SUNO_AUTOMATION_PATTERNS.STYLE_SPLIT_SEPARATORS)[0], { length: 32 });
    const nextItem = { title: nextTitle, content: nextContent };
    const nextStyles =
      editingStyleIndex === null
        ? [...savedStyles, nextItem]
        : _.map(savedStyles, (item, index) => (index === editingStyleIndex ? nextItem : item));
    persistStyles(nextStyles);
    setStyle(nextContent);
    setEditingStyleIndex(null);
    setStyleDraft("");
    setStyleName("");
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
    persistInspos(editingInspoIndex === null ? [...savedInspos, item] : _.map(savedInspos, (value, index) => index === editingInspoIndex ? item : value));
    setSunoInspo(content);
    setEditingInspoIndex(null);
    setSunoInspoDraft("");
    setInspoName("");
    toast.success(texts.INSPO_SAVE_SUCCESS);
  };

  const handleCancelInspoEdit = () => {
    setEditingInspoIndex(null);
    setInspoName("");
    setSunoInspoDraft("");
  };

  const confirmDeleteInspo = () => {
    if (!inspoToDelete) return;
    persistInspos(_.reject(savedInspos, (item) => _.isEqual(item, inspoToDelete)));
    if (_.isEqual(sunoInspo, inspoToDelete.content)) setSunoInspo("");
    setInspoToDelete(null);
  };

  const handleDeleteStyle = (savedStyle: SavedMusicStyle) => {
    const nextStyles = _.reject(savedStyles, (item) => _.isEqual(item.content, savedStyle.content));
    persistStyles(nextStyles);
    if (_.isEqual(style, savedStyle.content)) {
      setStyle("");
      setStyleDraft("");
      setStyleName("");
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
    setReferenceSongs(_.join(MUSIC_CREATOR_CONSTANTS.SAMPLE_REFERENCES, "\n"));
    toast.success(texts.QUICK_FILL_LABEL);
  };

  const handleTrySampleTemplate = () => {
    setStyle(MUSIC_CREATOR_CONSTANTS.PRESET_STYLES[0]);
    setReferenceSongs(_.join(MUSIC_CREATOR_CONSTANTS.SAMPLE_REFERENCES, "\n"));
    setOutputCount(MUSIC_CREATOR_CONSTANTS.DEFAULT_SONG_COUNT);
    toast.success(texts.TRY_SAMPLE_BTN);
  };

  const handleCopyAllLyrics = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCopy);
    if (_.isEmpty(songs)) return;
    const allContent = _.map(songs, (song) => song.lyrics).join("\n\n----------------------------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SUCCESS);
  };

  const handleCopyAllSeo = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCopy);
    if (_.isEmpty(displayedSeoOptions)) return;
    const allContent = _.map(displayedSeoOptions, (opt, idx) =>
      `[${texts.formatOptionLabel(idx + 1)}] (${texts.formatScoreLabel(opt.seoScore)})\n${texts.SEO_FIELD_TITLE}: ${opt.title}\n${texts.SEO_FIELD_DESCRIPTION}: ${opt.description}\n${texts.HASHTAGS_LABEL}: ${opt.hashtags.join(" ")}\n${texts.TAGS_LABEL}: ${opt.tags.join(", ")}`,
    ).join("\n----------------------------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SEO_SUCCESS);
  };

  const handleGenerate = async () => {
    if (isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanStart, outputCount);
    musicStoppedByUserRef.current = false;
    thumbnailStoppedRef.current = false;
    setGenerationError("");
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

    setViewMode("lyrics");
    setIsLoading(true);
    setIsGeneratingThumbnail(true);
    setSunoPlaylistUrl("");
    setDownloadPlaylistUrl("");
    setSunoTestPlaylistUrl("");
    setSunoTrackIds([]);
    const runSignature = jsonUtils.safeStringify([outputCount, trimmedStyle, referenceSource, sunoInspo, provider, model]);
    const runId = musicResumeRef.current?.signature === runSignature
      ? musicResumeRef.current.runId
      : `music_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    musicResumeRef.current = { signature: runSignature, runId };
    musicRunIdRef.current = runId;
    const abortController = new AbortController();
    musicAbortControllerRef.current = abortController;
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_PLAN, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          requestedSongCount: outputCount,
          style: trimmedStyle,
          referenceSongs: _.isEmpty(referenceSource) ? [] : [referenceSource],
          projectId: runId,
          requestId: runId,
          thumbnailReference,
          thumbnailReferenceName,
          thumbnailDescription,
          sunoInspo,
          aiExecution: {
            provider,
            model,
            executionMode,
            chromeHeadless,
          },
        }),
        signal: abortController.signal,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `${texts.ERROR_GENERATION_FAILED} (HTTP ${response.status})`);
      }

      const generatedSongs = _.get(result, "data.songs", []) as GeneratedSong[];
      const generatedStyleAnalysis = _.get(result, "data.styleAnalysis") as MusicStyleAnalysis;
      const generatedPlaylistSeo = _.get(result, "data.playlistSeoOptions", []) as SongSeoOption[];
      const seoWarning = _.toString(_.get(result, "data.seoWarning", ""));
      setSunoSettings(_.get(result, "data.sunoSettings") as SunoSettings);
      setSunoSettingsAnalysis(_.get(result, "data.sunoSettingsAnalysis") as SunoSettingsAnalysis);
      setSongs(generatedSongs);
      setStyleAnalysis(generatedStyleAnalysis);
      setCuratedDownloadedTracks([]);
      setDownloadedMusicTracks([]);
      setSunoDownloadError("");
      setPlaylistSeoOptions(generatedPlaylistSeo);
      setGeneratedThumbnail("");
      setGeneratedVideoBackground("");
      setShowVideoTrackList(true);
      setPreviewThumbnail(null);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, "").catch(() => undefined);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, "").catch(() => undefined);
      setSelectedSeoSongIndex(0);
      musicResumeRef.current = null;
      sunoPendingPlaylistRef.current = null;
      toast.success(texts.formatGenerateBtn(generatedSongs.length));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicPlanDone, generatedSongs.length);
      if (seoWarning && _.isEmpty(generatedPlaylistSeo)) toast.error(seoWarning);
      if (thumbnailStoppedRef.current) {
        setIsGeneratingThumbnail(false);
      } else void (async () => {
        const imageAbortController = new AbortController();
        const imageRunId = `music-cover-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        thumbnailAbortControllerRef.current = imageAbortController;
        thumbnailRunIdRef.current = imageRunId;
        try {
          const thumbnailResponse = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
            method: HTTP_METHODS.POST,
            headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
            body: jsonUtils.safeStringify({
              songs: generatedSongs,
              style: trimmedStyle,
              styleAnalysis: generatedStyleAnalysis,
              sourceContext: referenceSource,
              playlistSeoOptions: generatedPlaylistSeo,
              thumbnailDescription,
              thumbnailReference,
              thumbnailReferenceName,
              chromeHeadless,
              aiExecution: { provider, model },
              imageRunId,
            }),
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
      setSongs(previousSongs);
      setStyleAnalysis(previousStyleAnalysis);
      setSunoSettings(previousSunoSettings);
      setSunoSettingsAnalysis(previousSunoSettingsAnalysis);
      setPlaylistSeoOptions(previousPlaylistSeoOptions);
      setCuratedDownloadedTracks(previousCuratedDownloadedTracks);
      setGeneratedThumbnail(previousGeneratedThumbnail);
      setDownloadedMusicTracks(previousDownloadedMusicTracks);
      setGeneratedVideoBackground(previousGeneratedVideoBackground);
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
    setViewMode("seo");
    setIsRegeneratingSeo(true);
    const runId = `${SUNO_AUTOMATION_CONFIG.RUN_ID_PREFIX}seo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SEO_REGENERATE, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          songs,
          style: activeStyle,
          referenceSource: referenceSongs,
          styleAnalysis,
          projectId: runId,
          requestId: runId,
          aiExecution: { provider, model, executionMode, chromeHeadless },
        }),
      });
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
        const response = await fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, {
          method: HTTP_METHODS.POST,
          headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
          body: jsonUtils.safeStringify({ pipelineRunId: runId, closeBrowser: true, roomProvider: provider, roomProjectId: runId }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || texts.STOP_BROWSER_CLOSE_ERROR);
      }
      toast.info(texts.STOPPED_TOAST);
    } catch (error) {
      const message = _.toString(_.get(error, "message", texts.STOP_BROWSER_CLOSE_ERROR));
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
      setSunoTestPlaylistUrl("");
      setSunoTestTrackIds([]);
    } else {
      setSunoPlaylistUrl("");
      setDownloadPlaylistUrl("");
      setCuratedDownloadedTracks([]);
    }
    try {
      const requestedSongs = testOnly ? _.take(songs, 1) : songs;
      const sourceTitle = testOnly ? requestedSongs[0]?.title : playlistSeoOptions[0]?.title || requestedSongs[0]?.title;
      const pending = sunoPendingPlaylistRef.current;
      const canResume = pending?.sourceTitle === sourceTitle && pending.testOnly === testOnly;
      const playlistName = canResume ? pending.playlistName : formatSunoPlaylistName(sourceTitle, testOnly, crypto.randomUUID().split("-").slice(0, 2).join("").toUpperCase());
      const resumeSongIds = canResume ? pending.songIds : [];
      if (_.isEmpty(resumeSongIds) && !testOnly) setSunoTrackIds([]);
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_CREATE, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          songs: _.isEmpty(resumeSongIds) ? requestedSongs : [],
          initialSongIds: resumeSongIds,
          style,
          inspo: sunoInspo,
          sunoSettings,
          evaluateTracks: testOnly ? false : sunoEvaluateTracks,
          playlistName,
        }),
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
    void fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_CANCEL, {
      method: HTTP_METHODS.POST,
      headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
    }).catch(() => undefined);
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
    setSunoDownloadError("");
    const abortController = new AbortController();
    sunoDownloadAbortControllerRef.current = abortController;
    setIsDownloadingSuno(true);
    try {
      const folderResponse = await fetch(API_ROUTES.PIPELINE_SELECT_FOLDER, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        signal: abortController.signal,
      });
      const folderResult = await folderResponse.json();
      const folderPath = _.trim(_.toString(folderResult.folderPath));
      if (!folderResponse.ok || !folderResult.success || _.isEmpty(folderPath)) return;
      const tracks = isTestPlaylistDownload ? _.take(sunoTestTrackIds, 1).map((songId) => ({
        songId,
        title: `1. ${songs[0]?.title || texts.SUNO_TRACK_LABEL} - 1`,
      })) : requestedPlaylistUrl ? [] : _.map(sunoTrackIds, (songId, index) => {
        const songIndex = Math.floor(index / 2);
        const songNumber = songIndex + 1;
        const variantSuffix = ` - ${(index % 2) + 1}`;
        return { songId, title: `${songNumber}. ${songs[songIndex]?.title || `${texts.SUNO_TRACK_LABEL} ${songNumber}`}${variantSuffix}` };
      });
      const evaluationProjectId = `music-track-evaluation-${Date.now()}`;
      sunoDownloadRunIdRef.current = evaluationProjectId;
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_SUNO_DOWNLOAD, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          folderPath,
          tracks,
          maxTracks: isTestPlaylistDownload ? 1 : undefined,
          playlistUrl: activePlaylistUrl,
          songTitles: _.map(songs, "title"),
          format: sunoDownloadFormat,
          evaluateTracks: isTestPlaylistDownload ? false : sunoEvaluateTracks,
          style,
          styleAnalysis,
          aiExecution: sunoEvaluateTracks && !isTestPlaylistDownload
            ? {
              mode: AiPlanningExecutionMode.RoomOnly,
              provider: AiPlanningFallbackProvider.GeminiChat,
              model,
              projectId: evaluationProjectId,
              chromeHeadless: false,
            }
            : undefined,
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
      toast.success(texts.SUNO_DOWNLOAD_SUCCESS.replace("{count}", _.toString(_.size(result.downloadedPaths))).replace("{folder}", folderPath));
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
      void fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ pipelineRunId: runId, closeBrowser: true }),
      }).catch(() => undefined);
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
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailReference(_.toString(reader.result));
      setThumbnailReferenceName(file.name);
      setGeneratedThumbnail("");
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_REFERENCE, _.toString(reader.result)).catch(() => undefined);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_GENERATED, "").catch(() => undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoBackgroundReferenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith(SUNO_AUTOMATION_CONFIG.MIME_IMAGE_PREFIX)) {
      toast.error(texts.THUMBNAIL_IMAGE_INVALID);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const reference = _.toString(reader.result);
      setVideoBackgroundReference(reference);
      setVideoBackgroundReferenceName(file.name);
      setGeneratedVideoBackground("");
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND_REFERENCE, reference).catch(() => undefined);
      void writeMusicMedia(SUNO_AUTOMATION_CONFIG.MEDIA_KEY_VIDEO_BACKGROUND, "").catch(() => undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadThumbnail = async () => {
    if (_.isEmpty(generatedThumbnail)) return;
    const extension = generatedThumbnail.startsWith(SUNO_AUTOMATION_CONFIG.JPEG_DATA_PREFIX) ? SUNO_AUTOMATION_CONFIG.JPG_EXTENSION : SUNO_AUTOMATION_CONFIG.PNG_EXTENSION;
    try {
      const blob = await fetch(generatedThumbnail).then((response) => response.blob());
      const saved = await saveMusicBlobWithDialog(blob, `${SUNO_AUTOMATION_CONFIG.THUMBNAIL_EXPORT_FILENAME}.${extension}`);
      if (saved) toast.success(texts.THUMBNAIL_SAVE_SUCCESS);
    } catch (error) {
      if (_.get(error, "name") !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
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
      toast.error(_.toString(_.get(error, "message", texts.IMAGE_NOTE_NORMALIZE_ERROR)));
    } finally {
      setNormalizing(false);
    }
  };

  const handleRegenerateThumbnail = async () => {
    if (_.isEmpty(songs) || isBusy) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, WORKFLOW_ACTIVITY_EVENT.musicCoverStart);
    thumbnailStoppedRef.current = false;
    const imageAbortController = new AbortController();
    const imageRunId = `music-cover-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    thumbnailAbortControllerRef.current = imageAbortController;
    thumbnailRunIdRef.current = imageRunId;
    setIsGeneratingThumbnail(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          songs,
          style,
          styleAnalysis,
          sourceContext: referenceSongs,
          playlistSeoOptions,
          thumbnailDescription,
          thumbnailReference,
          thumbnailReferenceName,
          chromeHeadless,
          aiExecution: { provider, model },
          imageRunId,
        }),
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
    void fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, {
      method: HTTP_METHODS.POST,
      headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
      body: jsonUtils.safeStringify({ pipelineRunId: runId }),
    }).catch(() => undefined);
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
    const imageRunId = `music-background-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    videoBackgroundAbortControllerRef.current = imageAbortController;
    videoBackgroundRunIdRef.current = imageRunId;
    setIsGeneratingVideoBackground(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_THUMBNAIL, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({
          songs: downloadedMusicTracks,
          style,
          styleAnalysis,
          videoBackgroundDescription,
          videoBackgroundReference,
          videoBackgroundReferenceName,
          chromeHeadless,
          aiExecution: { provider, model },
          assetPurpose: SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO,
          showTrackList: showVideoTrackList,
          imageRunId,
        }),
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
      const saved = await saveMusicBlobWithDialog(blob, `${SUNO_AUTOMATION_CONFIG.VIDEO_BACKGROUND_EXPORT_FILENAME}.${extension}`);
      if (saved) toast.success(texts.VIDEO_BACKGROUND_SUCCESS);
    } catch (error) {
      if (_.get(error, "name") !== SUNO_AUTOMATION_CONFIG.ABORT_ERROR_NAME) toast.error(texts.FILE_SAVE_ERROR);
    }
  };

  const isFormValid = true;
  const isBusy = isLoading || isStopping || isRegeneratingSeo || isCreatingSuno || isDownloadingSuno
    || isGeneratingThumbnail || isNormalizingThumbnailNote || isGeneratingVideoBackground || isNormalizingVideoBackgroundNote;
  const isTrackListUnavailable = isBusy || _.isEmpty(downloadedMusicTracks);

  return (
    <div aria-busy={isBusy} className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80")}>
        <MusicCreatorHeader
          texts={texts}
          isAiConfigOpen={isAiConfigOpen}
          onToggleAiConfig={() => setIsAiConfigOpen(!isAiConfigOpen)}
          isLoading={isBusy}
        />

        {isAiConfigOpen && (
          <fieldset disabled={isBusy} className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4")}>
            <ChatPlanningSettingsBlock
              provider={provider}
              model={model}
              executionMode={executionMode}
              chromeHeadless={chromeHeadless}
              onProviderChange={setProvider}
              onModelChange={setModel}
              onExecutionModeChange={setExecutionMode}
              onChromeHeadlessChange={setChromeHeadless}
              currentLang={currentLang}
            />
          </fieldset>
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch")}>
          <div className={cn("lg:col-span-2 flex flex-col gap-5 min-w-0 h-full")}>
            <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full shrink-0")}>
              <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>
                    {texts.STEP_01}
                  </span>
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                    <Sparkles className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>{texts.STYLE_LABEL}</span>
                    <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
                      {texts.STYLE_BADGE}
                    </span>
                  </h3>
                </div>

                {!_.isEmpty(_.trim(styleDraft)) && (
                  <div className={cn("flex items-center gap-1.5")}>
                    <Button variant="unstyled"
                      type="button"
                      onClick={handleSaveStyle}
                      disabled={isBusy}
                      className={cn("h-8 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white inline-flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all shadow-xs leading-none [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white")}>
                      <Save className={cn("w-3 h-3 shrink-0")} />
                      <span className={cn("inline-flex items-center leading-none")}>{editingStyleIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                    </Button>
                    <Button variant="unstyled"
                      type="button"
                      onClick={handleCancelStyleEdit}
                      disabled={isBusy}
                      className={cn("h-8 px-2.5 rounded-lg border border-slate-300 hover:border-rose-500/50 bg-transparent hover:bg-rose-500/10 dark:border-slate-700/80 !text-[#475569] hover:!text-rose-600 dark:!text-slate-400 dark:hover:!text-rose-400 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center leading-none")}>
                      <span className={cn("inline-flex items-center leading-none")}>{texts.CANCEL_BTN}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className={cn("grid grid-cols-1 sm:grid-cols-12 gap-2 relative z-10")}>
                <div className={cn("sm:col-span-4")}>
                  <input
                    type="text"
                    value={styleName}
                    onChange={(event) => setStyleName(event.target.value)}
                    placeholder={texts.STYLE_NAME_PLACEHOLDER}
                    disabled={isBusy}
                    className={cn("w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs outline-none shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-purple-500/80")}
                  />
                </div>
                <div className={cn("sm:col-span-8")}>
                  <input
                    type="text"
                    value={styleDraft}
                    onChange={(e) => {
                      setStyleDraft(e.target.value);
                      if (editingStyleIndex === null) setStyle(e.target.value);
                    }}
                    placeholder={texts.STYLE_PLACEHOLDER}
                    disabled={isBusy}
                    className={cn("w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs outline-none shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20")}
                  />
                </div>
              </div>

              <div className={cn("space-y-1.5 pt-0.5 relative z-10")}>
                <div className={cn("flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold")}>
                  <Flame className={cn("w-3.5 h-3.5 text-amber-400")} />
                  <span>{texts.STYLE_YOUR_STYLES}</span>
                </div>
                <div className={cn("flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-0.5")}>
                  {_.map(savedStyles, (savedStyle, styleIndex) => {
                    const isSelected = _.isEqual(style, savedStyle.content);
                    return (
                      <div
                        key={`${styleIndex}-${savedStyle.title}`}
                        className={cn("group relative inline-flex items-center pl-2.5 pr-1.5 rounded-xl border transition-all duration-200 shadow-2xs backdrop-blur-sm shrink-0 h-[32px] min-h-[32px]", { "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected, "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90": !(isSelected) })}>
                        <Tooltip content={savedStyle.content} align="start">
                          <Button variant="unstyled"
                            type="button"
                            onClick={() => {
                              const shouldClear = _.isEqual(style, savedStyle.content);
                              setStyle(shouldClear ? "" : savedStyle.content);
                              setEditingStyleIndex(null);
                              setStyleDraft("");
                              setStyleName("");
                            }}
                            disabled={isBusy}
                            className={cn("text-[11px] font-black truncate max-w-[120px] cursor-pointer text-left flex items-center gap-1.5 !text-[#1e1b4b] dark:!text-white leading-none h-full")}
                            title={savedStyle.content}>
                            <span
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-all", { "bg-white ring-2 ring-white/40 shadow-xs": isSelected, "bg-slate-400 dark:bg-slate-500 group-hover:bg-purple-400": !(isSelected) })}
                            />
                            <span
                              className={cn("truncate font-black text-[11px] leading-none transition-colors", { "!text-white": isSelected, "!text-[#1e1b4b] group-hover:!text-[#6b21a8] dark:!text-slate-200 dark:group-hover:!text-white": !(isSelected) })}>
                              {savedStyle.title}
                            </span>
                          </Button>
                        </Tooltip>

                        <div className={cn("flex items-center gap-1 ml-1.5 shrink-0 self-center")}>
                          <Tooltip content={texts.COPY_STYLE_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                            <Button variant="unstyled"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyStyle(savedStyle, styleIndex);
                              }}
                              disabled={isBusy}
                              title={texts.COPY_STYLE_BTN}
                              className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-white/20 hover:bg-white/30 border border-white/30 text-white": isSelected, "bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-700 dark:text-sky-300": !(isSelected) })}>
                              {copiedStyleIndex === styleIndex ? (
                                <Check className={cn("w-2.5 h-2.5 shrink-0", { "text-emerald-300": isSelected, "text-emerald-500": !isSelected })} />
                              ) : (
                                <Copy className={cn("w-2.5 h-2.5 shrink-0")} />
                              )}
                            </Button>
                          </Tooltip>

                          <Tooltip content={texts.STYLE_UPDATE_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                            <Button variant="unstyled"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStyle(styleIndex);
                              }}
                              disabled={isBusy}
                              title={texts.STYLE_UPDATE_BTN}
                              className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-white/20 hover:bg-white/30 border border-white/30 text-white": isSelected, "bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[#7e22ce] dark:text-purple-300": !(isSelected) })}>
                              <Pencil className={cn("w-2.5 h-2.5 shrink-0")} />
                            </Button>
                          </Tooltip>

                          <Tooltip content={texts.STYLE_DELETE_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                            <Button variant="unstyled"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStyleToDelete(savedStyle);
                              }}
                              disabled={isBusy}
                              title={texts.STYLE_DELETE_BTN}
                              className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-rose-500/30 hover:bg-rose-500/50 border border-rose-300/40 text-white": isSelected, "bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-[#e11d48] dark:text-rose-400": !(isSelected) })}>
                              <Trash2 className={cn("w-2.5 h-2.5 shrink-0")} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                  {_.isEmpty(savedStyles) && (
                    <span className={cn("text-[11px] text-slate-500 italic py-1")}>
                      {texts.STYLE_EMPTY_HINT}
                    </span>
                  )}
                </div>
              </div>

              <div className={cn("space-y-2.5 relative z-10 border-t border-slate-800/60 pt-3")}>
                <div className={cn("flex items-center justify-between gap-2 flex-wrap")}>
                  <div className={cn("flex items-center gap-2 min-w-0")}>
                    <Disc3 className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                      <span>{texts.SUNO_INSPO_LABEL}</span>
                      <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
                        {texts.SUNO_INSPO_BADGE}
                      </span>
                    </span>
                  </div>
                  {!_.isEmpty(_.trim(sunoInspoDraft)) && (
                    <div className={cn("flex items-center gap-1.5")}>
                      <Button variant="unstyled"
                        type="button"
                        onClick={handleSaveInspo}
                        disabled={isBusy}
                        className={cn("h-7.5 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white inline-flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer transition-all shadow-xs leading-none [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white")}>
                        <Save className={cn("w-3 h-3 shrink-0")} />
                        <span className={cn("inline-flex items-center leading-none")}>{editingInspoIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                      </Button>
                      <Button variant="unstyled"
                        type="button"
                        onClick={handleCancelInspoEdit}
                        disabled={isBusy}
                        className={cn("h-7.5 px-2.5 rounded-lg border border-slate-300 hover:border-rose-500/50 bg-transparent hover:bg-rose-500/10 dark:border-slate-700/80 !text-[#475569] hover:!text-rose-600 dark:!text-slate-400 dark:hover:!text-rose-400 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center justify-center leading-none")}>
                        <span className={cn("inline-flex items-center leading-none")}>{texts.CANCEL_BTN}</span>
                      </Button>
                    </div>
                  )}
                </div>

                <div className={cn("grid grid-cols-1 sm:grid-cols-12 gap-2")}>
                  <div className={cn("sm:col-span-4")}>
                    <input
                      type="text"
                      value={inspoName}
                      onChange={(event) => setInspoName(event.target.value)}
                      disabled={isBusy}
                      placeholder={texts.INSPO_NAME_PLACEHOLDER}
                      className={cn("w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs outline-none shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-purple-500/80")}
                    />
                  </div>
                  <div className={cn("sm:col-span-8")}>
                    <input
                      type="text"
                      value={sunoInspoDraft}
                      onChange={(event) => {
                        setSunoInspoDraft(event.target.value);
                        if (editingInspoIndex === null) setSunoInspo(event.target.value);
                      }}
                      disabled={isBusy}
                      placeholder={texts.SUNO_INSPO_PLACEHOLDER}
                      className={cn("w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs outline-none shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20")}
                    />
                  </div>
                </div>

                {!_.isEmpty(savedInspos) && (
                  <div className={cn("space-y-1.5 pt-0.5")}>
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold")}>
                      <Sparkles className={cn("w-3.5 h-3.5 text-purple-400")} />
                      <span>{texts.INSPO_YOUR_INSPOS}</span>
                    </div>
                    <div className={cn("flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-0.5")}>
                      {_.map(savedInspos, (item, index) => {
                        const isSelected = _.isEqual(sunoInspo, item.content);
                        return (
                          <div
                            key={`${item.title}-${index}`}
                            className={cn("group relative inline-flex items-center pl-2.5 pr-1.5 rounded-xl border transition-all duration-200 shadow-2xs backdrop-blur-sm shrink-0 h-[32px] min-h-[32px]", { "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected, "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90": !(isSelected) })}>
                            <Tooltip content={item.content} align="start">
                              <Button variant="unstyled"
                                type="button"
                                onClick={() => {
                                  const shouldClear = _.isEqual(sunoInspo, item.content);
                                  setSunoInspo(shouldClear ? "" : item.content);
                                  setEditingInspoIndex(null);
                                  setSunoInspoDraft("");
                                  setInspoName("");
                                }}
                                disabled={isBusy}
                                className={cn("text-[11px] font-black truncate max-w-[130px] cursor-pointer text-left flex items-center gap-1.5 leading-none h-full")}
                                title={item.content}>
                                <span
                                  className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-all", { "bg-white ring-2 ring-white/40 shadow-xs": isSelected, "bg-slate-400 dark:bg-slate-500 group-hover:bg-purple-400": !(isSelected) })}
                                />
                                <span
                                  className={cn("truncate font-black text-[11px] leading-none transition-colors", { "!text-white": isSelected, "!text-[#1e1b4b] group-hover:!text-[#6b21a8] dark:!text-slate-200 dark:group-hover:!text-white": !(isSelected) })}>
                                  {item.title}
                                </span>
                              </Button>
                            </Tooltip>

                            <div className={cn("flex items-center gap-1 ml-1.5 shrink-0 self-center")}>
                              <Tooltip content={texts.INSPO_COPY_NAME_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                                <Button variant="unstyled"
                                  type="button"
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
                                  className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-white/20 hover:bg-white/30 border border-white/30 text-white": isSelected, "bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-700 dark:text-sky-300": !isSelected })}>
                                  {copiedInspoIndex === index ? (
                                    <Check className={cn("w-2.5 h-2.5 shrink-0", { "text-emerald-300": isSelected, "text-emerald-500": !isSelected })} />
                                  ) : (
                                    <Copy className={cn("w-2.5 h-2.5 shrink-0")} />
                                  )}
                                </Button>
                              </Tooltip>

                              <Tooltip content={texts.STYLE_UPDATE_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                                <Button variant="unstyled"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingInspoIndex(index);
                                    setInspoName(item.title);
                                    setSunoInspo(item.content);
                                    setSunoInspoDraft(item.content);
                                  }}
                                  disabled={isBusy}
                                  title={texts.STYLE_UPDATE_BTN}
                                  className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-white/20 hover:bg-white/30 border border-white/30 text-white": isSelected, "bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[#7e22ce] dark:text-purple-300": !(isSelected) })}>
                                  <Pencil className={cn("w-2.5 h-2.5 shrink-0")} />
                                </Button>
                              </Tooltip>

                              <Tooltip content={texts.STYLE_DELETE_BTN} align="center" className={cn("w-5 h-5 min-w-5 min-h-5 max-w-5 max-h-5 shrink-0 self-center p-0 flex items-center justify-center")}>
                                <Button variant="unstyled"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspoToDelete(item);
                                  }}
                                  disabled={isBusy}
                                  title={texts.STYLE_DELETE_BTN}
                                  className={cn("btn-icon-tiny !w-[20px] !h-[20px] !min-w-[20px] !min-h-[20px] !max-w-[20px] !max-h-[20px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0", { "bg-rose-500/30 hover:bg-rose-500/50 border border-rose-300/40 text-white": isSelected, "bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-[#e11d48] dark:text-rose-400": !(isSelected) })}>
                                  <Trash2 className={cn("w-2.5 h-2.5 shrink-0")} />
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
            </div>

            <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full flex-1 flex flex-col")}>
              <div className={cn("flex items-center justify-between relative z-10 shrink-0")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>
                    {texts.STEP_02}
                  </span>
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                    <FileText className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>{texts.REFERENCE_LABEL}</span>
                  </h3>
                </div>

                <Button variant="unstyled"
                  type="button"
                  onClick={handleFillSampleReferences}
                  disabled={isBusy}
                  className={cn("text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 shadow-xs leading-none !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white")}>
                  <Sparkles className={cn("w-3 h-3 shrink-0")} />
                  <span className={cn("inline-flex items-center leading-none")}>{texts.QUICK_FILL_LABEL}</span>
                </Button>
              </div>

              <div className={cn("relative z-10 flex-1 flex flex-col min-h-0")}>
                <textarea
                  rows={4}
                  value={referenceSongs}
                  onChange={(e) => setReferenceSongs(e.target.value)}
                  placeholder={texts.REFERENCE_PLACEHOLDER}
                  disabled={isBusy}
                  className={cn("w-full flex-1 min-h-[140px] sm:min-h-[180px] bg-slate-955/90 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-y shadow-inner transition-all placeholder:text-slate-500 font-sans border border-slate-800/80 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20 custom-scrollbar")}
                />
              </div>
            </div>

          </div>

          <div className={cn("lg:col-span-1 flex flex-col gap-5 min-w-0 h-full")}>
            <div className={cn("glass-card bg-slate-900/90 border border-slate-800/80 p-5 space-y-4 text-left relative overflow-hidden backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl")}>
              <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-xs shadow-amber-500/20 shrink-0")}>
                    <div className={cn("w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center")}>
                      <SlidersHorizontal className={cn("w-4 h-4 text-amber-400")} />
                    </div>
                  </div>
                  <div>
                    <h2 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                      {texts.STUDIO_CONFIG_TITLE}
                    </h2>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black tracking-normal")}>
                  {texts.STUDIO_CONFIG_BADGE}
                </span>
              </div>

              <div className={cn("space-y-2")}>
                <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block")}>
                  {texts.COUNT_LABEL}
                </label>
                <div className={cn("grid grid-cols-3 gap-2")}>
                  {_.map(MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS, (count) => {
                    const isSelected = _.isEqual(outputCount, count);
                    const isRecommended = _.isEqual(count, MUSIC_CREATOR_CONSTANTS.RECOMMENDED_SONG_COUNT);
                    return (
                      <Button variant="unstyled"
                        key={count}
                        type="button"
                        onClick={() => setOutputCount(count)}
                        disabled={isBusy}
                        className={cn("relative h-9 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs select-none", { "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected, "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90": !(isSelected) })}>
                        <span>{texts.formatSongCount(count)}</span>
                        {isRecommended && !isSelected && (
                          <span className={cn("absolute -top-1 px-1 rounded text-[7px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30")}>
                            {texts.RECOMMENDED_BADGE}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className={cn("p-3 rounded-xl bg-slate-955/70 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400")}>
                <div className={cn("flex items-center justify-between")}>
                  <span>{texts.COUNT_LABEL}:</span>
                  <span className={cn("font-bold text-slate-200")}>{outputCount} {texts.SONG_UNIT}</span>
                </div>
                <div className={cn("flex items-center justify-between")}>
                  <span>{texts.ENGINE_LABEL}:</span>
                  <span className={cn("font-bold text-purple-300")}>{texts.HEADER_BADGE}</span>
                </div>
                <div className={cn("flex items-center justify-between")}>
                  <span>{texts.MODEL_LABEL}:</span>
                  <span className={cn("font-bold text-slate-200 truncate max-w-[130px]")}>{model}</span>
                </div>
              </div>

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center gap-2")}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleGenerate}
                    disabled={!isFormValid || isBusy}
                    className={cn("h-11 min-h-[44px] px-4 rounded-xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-lg tracking-wider uppercase font-sans border leading-none", { "flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": isLoading, "w-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer": !(isLoading) && isFormValid, "w-full bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none": !(isLoading) && !(isFormValid) })}>
                    {isLoading ? (
                      <>
                        <Sparkles className={cn("w-4 h-4 animate-spin text-white shrink-0")} />
                        <span className={cn("truncate inline-flex items-center leading-none")}>{texts.BLOCK_LYRICS_LOADING}</span>
                      </>
                    ) : (
                      <>
                        <WandSparkles className={cn("w-4 h-4 shrink-0")} />
                        <span className={cn("inline-flex items-center leading-none")}>{texts.formatGenerateBtn(outputCount)}</span>
                      </>
                    )}
                  </Button>

                  {(isLoading || isStopping) && (
                    <Button variant="unstyled"
                      type="button"
                      onClick={handleCancelGeneration}
                      disabled={isStopping}
                      className={cn("h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-wait disabled:opacity-60 shadow-md transition-all active:scale-95 shrink-0 leading-none")}>
                      <X className={cn("w-4 h-4 shrink-0")} />
                      <span className={cn("inline-flex items-center leading-none")}>{isStopping ? texts.STOPPING_BTN : texts.STOP_BTN}</span>
                    </Button>
                  )}
                </div>

                {generationError && (
                  <div role="alert" className={cn("rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 break-words")}>
                    <AlertTriangle className={cn("mr-1.5 inline h-3.5 w-3.5")} />
                    {generationError}
                  </div>
                )}

                {!isLoading && _.isEmpty(songs) && (
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleTrySampleTemplate}
                    disabled={isBusy}
                    className={cn("w-full py-2 text-center text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline cursor-pointer transition-colors inline-flex items-center justify-center gap-1 leading-none")}>
                    <Sparkles className={cn("w-3 h-3 shrink-0")} />
                    <span className={cn("inline-flex items-center leading-none")}>{texts.TRY_SAMPLE_BTN}</span>
                  </Button>
                )}
              </div>
            </div>

            <div className={cn("glass-card bg-slate-900/90 border border-slate-800/80 p-5 space-y-3 text-left backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl")}>
              <div className={cn("flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3")}>
                <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                  <ImageIcon className={cn("w-3.5 h-3.5 text-fuchsia-400")} />
                  {texts.THUMBNAIL_TITLE}
                </h3>
                <span className={cn("text-[9px] font-bold text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2 py-0.5 rounded-full")}>{texts.THUMBNAIL_RATIO_BADGE}</span>
              </div>

              <input ref={thumbnailFileInputRef} type="file" accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL} onChange={handleThumbnailReferenceChange} disabled={isBusy} className={cn("hidden")} />

              <div className={cn("grid grid-cols-2 gap-2.5 items-start")}>
                {thumbnailReference ? (
                  <div className={cn("relative min-w-0 w-full aspect-video rounded-xl border border-slate-700 bg-black/90 overflow-hidden group shadow-md flex items-center justify-center")}>
                    <img
                      src={thumbnailReference}
                      alt={texts.THUMBNAIL_REFERENCE_ALT}
                      title={texts.CLICK_TO_ZOOM}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewThumbnail(thumbnailReference);
                      }}
                      className={cn("absolute inset-0 w-full h-full object-contain cursor-zoom-in")}
                    />
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5")}>
                      <span className={cn("text-[9px] font-mono font-bold text-white/90 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>{texts.THUMBNAIL_REFERENCE_BADGE}</span>
                      <span className={cn("text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>{texts.THUMBNAIL_RATIO_OVERLAY}</span>
                    </div>
                    <Button variant="unstyled"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        thumbnailFileInputRef.current?.click();
                      }}
                      title={texts.CHANGE_IMAGE_BTN}
                      disabled={isBusy}
                      className={cn("btn-icon-tiny absolute top-2 right-2 w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 rounded-lg bg-black/70 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md flex items-center justify-center")}>
                      <Upload className={cn("w-3.5 h-3.5 shrink-0")} />
                    </Button>
                  </div>
                ) : (
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    disabled={isBusy}
                    className={cn("relative min-w-0 w-full aspect-video rounded-xl border border-dashed border-slate-700 hover:border-fuchsia-500/70 bg-slate-955/80 overflow-hidden transition-colors flex flex-col items-center justify-center gap-1 group cursor-pointer shadow-inner p-2 text-center")}>
                    <Upload className={cn("w-4 h-4 text-slate-400 group-hover:text-fuchsia-300 transition-colors")} />
                    <span className={cn("text-[10px] font-bold text-slate-300 group-hover:text-fuchsia-200 leading-tight")}>{texts.THUMBNAIL_UPLOAD}</span>
                    <span className={cn("text-[8px] font-mono text-slate-500")}>{texts.THUMBNAIL_SAMPLE_RATIO}</span>
                  </Button>
                )}

                {generatedThumbnail && !isGeneratingThumbnail ? (
                  <div className={cn("relative group block min-w-0 w-full aspect-video rounded-xl border border-fuchsia-500/40 bg-black/90 overflow-hidden shadow-md flex items-center justify-center")}>
                    <img
                      src={generatedThumbnail}
                      alt={texts.THUMBNAIL_RESULT_ALT}
                      title={texts.CLICK_TO_ZOOM}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewThumbnail(generatedThumbnail);
                      }}
                      className={cn("absolute inset-0 w-full h-full object-contain cursor-zoom-in")}
                    />
                    <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5")}>
                      <span className={cn("text-[9px] font-mono font-bold text-fuchsia-300 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>{texts.THUMBNAIL_AI_BADGE}</span>
                      <span className={cn("text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>{texts.THUMBNAIL_RATIO_HD}</span>
                    </div>
                    <Button variant="unstyled" type="button" onClick={handleDownloadThumbnail} disabled={isBusy} title={texts.THUMBNAIL_DOWNLOAD} aria-label={texts.THUMBNAIL_DOWNLOAD} className={cn("btn-icon-tiny absolute top-2 right-2 z-10 w-7 h-7 !p-0 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center cursor-pointer")}>
                      <Download className={cn("w-3.5 h-3.5")} />
                    </Button>
                  </div>
                ) : isGeneratingThumbnail ? (
                  <div className={cn("min-w-0 w-full aspect-video rounded-xl border border-fuchsia-500/40 bg-gradient-to-b from-fuchsia-500/10 via-purple-500/5 to-slate-900/40 dark:from-fuchsia-950/40 dark:to-slate-955/80 overflow-hidden flex flex-col items-center justify-center gap-1 p-2 text-center shadow-inner")}>
                    <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-purple-600 p-0.5 shadow-xs")}>
                      <div className={cn("w-full h-full bg-white dark:bg-slate-900 rounded-[6px] flex items-center justify-center")}>
                        <Sparkles className={cn("w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 animate-spin")} />
                      </div>
                    </div>
                    <p className={cn("text-[10px] font-black tracking-tight !text-[#86198f] dark:!text-fuchsia-300 leading-tight")}>
                      {texts.THUMBNAIL_GENERATING}
                    </p>
                    <p className={cn("text-[8px] font-medium !text-slate-500 dark:!text-slate-400")}>
                      {texts.THUMBNAIL_MODEL_TAG}
                    </p>
                  </div>
                ) : (
                  <div className={cn("relative min-w-0 w-full aspect-video rounded-xl border border-dashed border-slate-700/60 dark:border-slate-800 bg-slate-955/50 flex flex-col items-center justify-center gap-1 p-2 text-center text-slate-500")}>
                    <Sparkles className={cn("w-4 h-4 text-slate-600 dark:text-slate-500")} />
                    <span className={cn("text-[10px] font-semibold text-slate-400 dark:text-slate-400 leading-tight")}>
                      {texts.THUMBNAIL_AI_TITLE}
                    </span>
                    <span className={cn("text-[8px] font-mono text-slate-500")}>
                      {texts.THUMBNAIL_NOT_CREATED}
                    </span>
                  </div>
                )}
              </div>

              <div className={cn("space-y-1")}>
                <div className={cn("flex items-center justify-between gap-2")}>
                  <span className={cn("text-[11px] font-semibold text-slate-300")}>{texts.COVER_IMAGE_NOTE_LABEL}</span>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => { void handleNormalizeImageNote("cover"); }}
                    disabled={isBusy || _.isEmpty(_.trim(thumbnailDescription))}
                    className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-fuchsia-600 hover:text-fuchsia-800 dark:text-fuchsia-400 dark:hover:text-fuchsia-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none disabled:opacity-40 disabled:cursor-not-allowed")}
                    title={isNormalizingThumbnailNote ? texts.IMAGE_NOTE_NORMALIZING : texts.IMAGE_NOTE_NORMALIZE}
                  >
                    {isNormalizingThumbnailNote ? (
                      <Sparkles className={cn("w-3.5 h-3.5 shrink-0 animate-spin text-fuchsia-400")} />
                    ) : (
                      <WandSparkles className={cn("w-3.5 h-3.5 shrink-0")} />
                    )}
                  </Button>
                </div>
                <textarea
                  rows={4}
                  value={thumbnailDescription}
                  onChange={(event) => setThumbnailDescription(event.target.value)}
                  disabled={isBusy}
                  placeholder={texts.THUMBNAIL_DESCRIPTION_PLACEHOLDER}
                  className={cn("w-full min-h-[95px] sm:min-h-[110px] bg-slate-955/90 text-slate-100 p-3 rounded-xl text-xs leading-relaxed outline-none resize-y shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-fuchsia-500/80 custom-scrollbar")}
                />
              </div>

              {!_.isEmpty(songs) && (
                <div className={cn("grid grid-cols-2 gap-2")}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleRegenerateThumbnail}
                    disabled={isBusy}
                    className={cn("h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all select-none shadow-2xs leading-none", { "border-fuchsia-500/40 bg-fuchsia-100/90 dark:bg-fuchsia-950/70 !text-[#86198f] dark:!text-fuchsia-300 cursor-wait": isGeneratingThumbnail, "border-fuchsia-500/40 bg-fuchsia-500/10 hover:bg-fuchsia-600 dark:bg-fuchsia-500/20 dark:hover:bg-fuchsia-600 !text-[#86198f] hover:!text-white dark:!text-fuchsia-300 dark:hover:!text-white cursor-pointer active:scale-95 col-span-2": !isGeneratingThumbnail })}>
                    {isGeneratingThumbnail ? (
                      <Sparkles className={cn("w-3.5 h-3.5 shrink-0 animate-spin text-fuchsia-600 dark:text-fuchsia-400")} />
                    ) : (
                      <WandSparkles className={cn("w-3.5 h-3.5 shrink-0")} />
                    )}
                    <span className={cn("inline-flex items-center leading-none")}>
                      {isGeneratingThumbnail
                        ? texts.THUMBNAIL_CREATING_SHORT
                        : (generatedThumbnail ? texts.THUMBNAIL_REGENERATE : texts.THUMBNAIL_CREATE_BTN)}
                    </span>
                  </Button>

                  {isGeneratingThumbnail ? (
                    <Button variant="unstyled" type="button" onClick={handleStopThumbnail} title={texts.THUMBNAIL_STOP_TOOLTIP} aria-label={texts.THUMBNAIL_STOP_TOOLTIP} className={cn("h-9 px-3 rounded-xl border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer")}>
                      <X className={cn("w-3.5 h-3.5")} />
                      <span>{texts.THUMBNAIL_STOP}</span>
                    </Button>
                  ) : null}
                </div>
              )}

              <div className={cn("pt-4 border-t border-slate-800/80 space-y-3")}>
                <div className={cn("flex items-center justify-between gap-2 flex-wrap")}>
                  <div className={cn("flex items-center gap-2 min-w-0")}>
                    <div className={cn("w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0")}>
                      <ImageIcon className={cn("w-3.5 h-3.5")} />
                    </div>
                    <h3 className={cn("text-xs font-black uppercase tracking-wider text-slate-100 font-mono")}>
                      {texts.VIDEO_BACKGROUND_TITLE}
                    </h3>
                  </div>

                  <label
                    className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all select-none", { "border-slate-800/80 bg-slate-900/40 text-slate-500 cursor-not-allowed opacity-60": isTrackListUnavailable, "border-cyan-500/40 bg-cyan-500/15 text-cyan-300 cursor-pointer shadow-xs": !isTrackListUnavailable && showVideoTrackList, "border-slate-800 hover:border-slate-700 bg-slate-900/80 text-slate-300 hover:text-slate-100 cursor-pointer": !isTrackListUnavailable && !showVideoTrackList })}
                  >
                    <input
                      type="checkbox"
                      checked={showVideoTrackList}
                      onChange={(event) => setShowVideoTrackList(event.target.checked)}
                      disabled={isTrackListUnavailable}
                      className={cn("h-3.5 w-3.5 rounded border-slate-600 accent-cyan-500 cursor-pointer disabled:cursor-not-allowed")}
                    />
                    <span>{texts.VIDEO_BACKGROUND_TRACKLIST}</span>
                  </label>
                </div>

                {isLoading || isCreatingSuno || _.isEmpty(downloadedMusicTracks) ? (
                  <div className={cn("rounded-2xl border border-dashed border-slate-800 bg-gradient-to-b from-slate-950/60 to-slate-900/30 p-4 text-center space-y-2.5 shadow-inner")}>
                    <div className={cn("w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto shadow-xs")}>
                      <Lock className={cn("w-4 h-4 text-slate-400")} />
                    </div>
                    <div className={cn("space-y-1")}>
                      <p className={cn("text-xs font-bold text-slate-300")}>
                        {texts.VIDEO_BACKGROUND_LOCKED}
                      </p>
                      <p className={cn("text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto")}>
                        Cần tải file nhạc từ danh sách Suno để lấy thông tin bài hát và thời lượng cho khung hình video.
                      </p>
                    </div>

                    <div className={cn("flex items-center justify-center gap-2 pt-1")}>
                      <div
                        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border", { "bg-emerald-500/10 text-emerald-300 border-emerald-500/20": !isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks), "bg-slate-900 text-slate-400 border-slate-800": !(isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks)) })}
                      >
                        {!isLoading && !isCreatingSuno && !_.isEmpty(downloadedMusicTracks) ? <Check className={cn("w-3 h-3 text-emerald-400")} /> : <Disc3 className={cn("w-3 h-3 text-slate-500")} />}
                        <span>Tải nhạc Suno</span>
                      </div>
                      <div
                        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border", { "bg-emerald-500/10 text-emerald-300 border-emerald-500/20": !_.isEmpty(videoBackgroundReference), "bg-slate-900 text-slate-400 border-slate-800": !(_.isEmpty(videoBackgroundReference)) })}
                      >
                        {!_.isEmpty(videoBackgroundReference) ? <Check className={cn("w-3 h-3 text-emerald-400")} /> : <ImageIcon className={cn("w-3 h-3 text-slate-500")} />}
                        <span>{texts.VIDEO_BACKGROUND_REFERENCE_ALT}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={cn("space-y-3")}>
              <input ref={videoBackgroundFileInputRef} type="file" accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL} onChange={handleVideoBackgroundReferenceChange} disabled={isBusy} className={cn("hidden")} />
                    <div className={cn("grid grid-cols-2 gap-2.5 items-start")}>
                      {videoBackgroundReference ? (
                        <div className={cn("relative min-w-0 w-full aspect-video rounded-xl border border-slate-700 bg-black/90 overflow-hidden group shadow-md")}>
                          <img src={videoBackgroundReference} alt={texts.VIDEO_BACKGROUND_REFERENCE_ALT} title={texts.CLICK_TO_ZOOM} onClick={() => setPreviewThumbnail(videoBackgroundReference)} className={cn("absolute inset-0 w-full h-full object-contain cursor-zoom-in")} />
                          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5")}>
                            <span className={cn("text-[9px] font-mono font-bold text-white bg-black/60 px-1.5 py-0.5 rounded")}>{texts.VIDEO_BACKGROUND_REFERENCE_ALT}</span>
                          </div>
                          <Button variant="unstyled" type="button" onClick={() => videoBackgroundFileInputRef.current?.click()} disabled={isBusy} title={texts.CHANGE_IMAGE_BTN} className={cn("btn-icon-tiny absolute top-2 right-2 w-7 h-7 !p-0 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/20 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center")}>
                            <Upload className={cn("w-3.5 h-3.5")} />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="unstyled" type="button" onClick={() => videoBackgroundFileInputRef.current?.click()} disabled={isBusy} className={cn("relative min-w-0 w-full aspect-video rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/70 bg-slate-955/80 flex flex-col items-center justify-center gap-1 p-2 text-center cursor-pointer")}>
                          <Upload className={cn("w-4 h-4 text-slate-400")} />
                          <span className={cn("text-[10px] font-bold text-slate-300")}>{texts.THUMBNAIL_UPLOAD}</span>
                          <span className={cn("text-[8px] font-mono text-slate-500")}>{texts.THUMBNAIL_SAMPLE_RATIO}</span>
                        </Button>
                      )}
                    {(generatedVideoBackground || isGeneratingVideoBackground) && (
                      <div className={cn("relative group min-w-0 w-full aspect-video rounded-xl border border-cyan-500/40 bg-black/90 overflow-hidden shadow-md flex items-center justify-center")}>
                        {generatedVideoBackground && (
                          <img
                            src={generatedVideoBackground}
                            alt={texts.VIDEO_BACKGROUND_ALT}
                            title={isGeneratingVideoBackground ? undefined : texts.CLICK_TO_ZOOM}
                            onClick={isGeneratingVideoBackground ? undefined : () => setPreviewThumbnail(generatedVideoBackground)}
                            className={cn("absolute inset-0 w-full h-full object-contain", { "opacity-35": isGeneratingVideoBackground, "cursor-zoom-in": !isGeneratingVideoBackground })}
                          />
                        )}
                        {isGeneratingVideoBackground ? (
                          <div role="status" aria-live="polite" className={cn("absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/45 text-cyan-200")}>
                            <Sparkles className={cn("w-7 h-7 animate-spin")} />
                            <span className={cn("text-xs font-bold")}>{texts.VIDEO_BACKGROUND_CREATING}</span>
                          </div>
                        ) : (
                          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5")}>
                            <span className={cn("text-[9px] font-mono font-bold text-cyan-300 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>16:9 HD</span>
                            <span className={cn("text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur-xs")}>{texts.CLICK_TO_ZOOM}</span>
                          </div>
                        )}
                        {generatedVideoBackground && !isGeneratingVideoBackground && (
                          <Button variant="unstyled" type="button" onClick={handleDownloadVideoBackground} disabled={isBusy} title={texts.VIDEO_BACKGROUND_DOWNLOAD} aria-label={texts.VIDEO_BACKGROUND_DOWNLOAD} className={cn("btn-icon-tiny absolute top-2 right-2 z-10 w-7 h-7 !p-0 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity flex items-center justify-center cursor-pointer")}>
                            <Download className={cn("w-3.5 h-3.5")} />
                          </Button>
                        )}
                      </div>
                    )}
                    {!generatedVideoBackground && !isGeneratingVideoBackground && (
                      <div className={cn("min-w-0 w-full aspect-video rounded-xl border border-dashed border-slate-700/60 bg-slate-955/50 flex flex-col items-center justify-center gap-1 p-2 text-center text-slate-500")}>
                        <Sparkles className={cn("w-4 h-4 text-slate-500")} />
                        <span className={cn("text-[10px] font-semibold text-slate-400")}>{texts.VIDEO_BACKGROUND_TITLE}</span>
                        <span className={cn("text-[8px] font-mono text-slate-500")}>{texts.THUMBNAIL_NOT_CREATED}</span>
                      </div>
                    )}
                    </div>
                    <div className={cn("space-y-1")}>
                      <div className={cn("flex items-center justify-between gap-2")}>
                        <span className={cn("text-[11px] font-semibold text-slate-300")}>{texts.VIDEO_BACKGROUND_NOTE_LABEL}</span>
                        <Button variant="unstyled"
                          type="button"
                          onClick={() => { void handleNormalizeImageNote(SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO); }}
                          disabled={isBusy || _.isEmpty(_.trim(videoBackgroundDescription))}
                          className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none disabled:opacity-40 disabled:cursor-not-allowed")}
                          title={isNormalizingVideoBackgroundNote ? texts.IMAGE_NOTE_NORMALIZING : texts.IMAGE_NOTE_NORMALIZE}
                        >
                          {isNormalizingVideoBackgroundNote ? (
                            <Sparkles className={cn("w-3.5 h-3.5 shrink-0 animate-spin text-cyan-400")} />
                          ) : (
                            <WandSparkles className={cn("w-3.5 h-3.5 shrink-0")} />
                          )}
                        </Button>
                      </div>
                      <textarea
                        rows={3}
                        value={videoBackgroundDescription}
                        onChange={(event) => setVideoBackgroundDescription(event.target.value)}
                        disabled={isBusy}
                        placeholder={texts.VIDEO_BACKGROUND_DESCRIPTION_PLACEHOLDER}
                        className={cn("w-full min-h-[78px] bg-slate-955/90 text-slate-100 p-3 rounded-xl text-xs leading-relaxed outline-none resize-y shadow-inner placeholder:text-slate-500 border border-slate-800/80 focus:border-cyan-500/80 custom-scrollbar")}
                      />
                    </div>
                    <div className={cn("grid grid-cols-2 gap-2")}>
                      <Button variant="unstyled"
                        type="button"
                        onClick={handleGenerateVideoBackground}
                        disabled={isBusy || _.isEmpty(videoBackgroundReference)}
                        className={cn("h-9 px-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-wait", { "col-span-2": !isGeneratingVideoBackground })}
                      >
                        {isGeneratingVideoBackground ? (
                          <Sparkles className={cn("w-3.5 h-3.5 shrink-0 animate-spin text-cyan-300")} />
                        ) : (
                          <WandSparkles className={cn("w-3.5 h-3.5 shrink-0")} />
                        )}
                        <span>{isGeneratingVideoBackground ? texts.VIDEO_BACKGROUND_CREATING : generatedVideoBackground ? texts.VIDEO_BACKGROUND_REGENERATE : texts.VIDEO_BACKGROUND_CREATE}</span>
                      </Button>
                      {isGeneratingVideoBackground ? (
                        <Button variant="unstyled" type="button" onClick={handleStopVideoBackground} title={texts.VIDEO_BACKGROUND_STOP_TOOLTIP} aria-label={texts.VIDEO_BACKGROUND_STOP_TOOLTIP} className={cn("h-9 px-3 rounded-xl border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer")}>
                          <X className={cn("w-3.5 h-3.5")} />
                          <span>{texts.VIDEO_BACKGROUND_STOP}</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full space-y-4")}>
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5")}>
            <div className={cn("flex items-center gap-2.5 min-w-0")}>
              <div className={cn("w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0")}>
                <Music2 className={cn("w-4 h-4")} />
              </div>
              <div className={cn("flex items-center gap-2")}>
                <h2 className={cn("text-sm sm:text-base font-extrabold text-slate-100 uppercase tracking-tight")}>
                  {texts.RESULTS_TITLE}
                </h2>
                {!_.isEmpty(songs) && (
                  <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300")}>
                    {songs.length} {texts.SONG_UNIT}
                  </span>
                )}
              </div>
            </div>

            <div className={cn("flex items-center gap-2 flex-wrap justify-between sm:justify-end")}>
              {!_.isEmpty(songs) && (
                <div className={cn("flex items-center p-1 rounded-xl bg-slate-955/90 border border-slate-800/90 shadow-inner")}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setViewMode("lyrics")}
                    disabled={isBusy}
                    className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 select-none leading-none", { "bg-purple-600 !text-white shadow-sm": viewMode === MUSIC_VIEW_MODES.LYRICS, "!text-slate-700 hover:!text-purple-700 dark:!text-slate-400 dark:hover:!text-slate-100": !(viewMode === MUSIC_VIEW_MODES.LYRICS) })}>
                    <Music2 className={cn("w-3 h-3 shrink-0")} />
                    <span className={cn("inline-flex items-center leading-none")}>{texts.TAB_LYRICS}</span>
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setViewMode("seo")}
                    disabled={isBusy}
                    className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 select-none leading-none", { "bg-fuchsia-600 !text-white shadow-sm": viewMode === MUSIC_VIEW_MODES.SEO, "!text-slate-700 hover:!text-fuchsia-700 dark:!text-slate-400 dark:hover:!text-slate-100": !(viewMode === MUSIC_VIEW_MODES.SEO) })}>
                    <Sparkles className={cn("w-3 h-3 shrink-0")} />
                    <span className={cn("inline-flex items-center leading-none")}>{texts.TAB_SEO}</span>
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={() => setViewMode("split")}
                    disabled={isBusy}
                    className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 select-none leading-none", { "bg-indigo-600 !text-white shadow-sm": viewMode === MUSIC_VIEW_MODES.SPLIT, "!text-slate-700 hover:!text-indigo-700 dark:!text-slate-400 dark:hover:!text-slate-100": !(viewMode === MUSIC_VIEW_MODES.SPLIT) })}>
                    <Columns className={cn("w-3 h-3 shrink-0")} />
                    <span className={cn("inline-flex items-center leading-none")}>{texts.TAB_SPLIT}</span>
                  </Button>
                </div>
              )}

              {!_.isEmpty(songs) && (
                <div className={cn("flex items-center gap-2 shrink-0")}>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleGenerate}
                    disabled={isBusy}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200/80 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600/50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-95 leading-none")}
                    title={texts.MUSIC_RECOMPOSE_BTN_TOOLTIP}>
                    {isLoading ? (
                      <Sparkles className={cn("w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-300 animate-spin")} />
                    ) : (
                      <WandSparkles className={cn("w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-300")} />
                    )}
                    <span className={cn("inline-flex items-center leading-none")}>{isLoading ? texts.MUSIC_RECOMPOSING_BTN : texts.MUSIC_RECOMPOSE_BTN}</span>
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleRegenerateSeo}
                    disabled={isBusy}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold bg-fuchsia-100 hover:bg-fuchsia-200/80 dark:bg-fuchsia-950/60 dark:hover:bg-fuchsia-900/80 text-fuchsia-700 dark:text-fuchsia-200 border border-fuchsia-300 dark:border-fuchsia-600/50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-95 leading-none")}
                    title={texts.SEO_REGENERATE_BTN_TOOLTIP}>
                    {isRegeneratingSeo ? (
                      <Sparkles className={cn("w-3.5 h-3.5 shrink-0 text-fuchsia-600 dark:text-fuchsia-300 animate-spin")} />
                    ) : (
                      <WandSparkles className={cn("w-3.5 h-3.5 shrink-0 text-fuchsia-600 dark:text-fuchsia-300")} />
                    )}
                    <span className={cn("inline-flex items-center leading-none")}>{isRegeneratingSeo ? texts.SEO_REGENERATING_BTN : texts.SEO_REGENERATE_BTN}</span>
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleCreateSunoTest}
                    disabled={isBusy}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-100 hover:bg-cyan-200/80 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-600/50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-95 leading-none")}>
                    {isCreatingSunoTest ? <Disc3 className={cn("w-3.5 h-3.5 animate-spin shrink-0")} /> : <Music2 className={cn("w-3.5 h-3.5 shrink-0")} />}
                    <span className={cn("inline-flex items-center leading-none")}>{isCreatingSunoTest ? texts.SUNO_TEST_CREATING_BTN : texts.SUNO_TEST_CREATE_BTN}</span>
                  </Button>
                  <Button variant="unstyled"
                    type="button"
                    onClick={handleCreateSunoMusic}
                    disabled={isBusy}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 disabled:opacity-60 text-white border border-orange-400/50 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm leading-none")}>
                    {isCreatingSuno && !isCreatingSunoTest ? <Disc3 className={cn("w-3.5 h-3.5 animate-spin shrink-0")} /> : <Music2 className={cn("w-3.5 h-3.5 shrink-0")} />}
                    <span className={cn("inline-flex items-center leading-none")}>{isCreatingSuno && !isCreatingSunoTest ? texts.SUNO_CREATING_BTN : texts.SUNO_CREATE_BTN}</span>
                  </Button>
                  {isCreatingSuno && (
                    <Button variant="unstyled"
                      type="button"
                      onClick={handleCancelSunoMusic}
                      className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/50 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 leading-none")}>
                      <X className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_CANCEL_BTN}</span>
                    </Button>
                  )}
                  <Button variant="unstyled"
                    type="button"
                    onClick={viewMode === MUSIC_VIEW_MODES.SEO ? handleCopyAllSeo : handleCopyAllLyrics}
                    disabled={isBusy}
                    className={cn("btn-icon-tiny w-8 h-8 min-w-[32px] max-w-[32px] min-h-[32px] max-h-[32px] !p-0 aspect-square rounded-xl flex items-center justify-center text-purple-400 hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-95")}
                    title={texts.COPY_ALL_BTN}>
                    <Copy className={cn("w-4 h-4 shrink-0")} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className={cn("flex flex-wrap items-center gap-2")}>
            <div className={cn("relative min-w-[240px] flex-1")}>
              <Link2 className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400")} />
              <input
                type="url"
                value={downloadPlaylistUrl}
                onChange={(event) => setDownloadPlaylistUrl(event.target.value)}
                placeholder={texts.SUNO_DOWNLOAD_PLAYLIST_PLACEHOLDER}
                disabled={isBusy}
                className={cn("h-9 w-full rounded-xl border border-slate-700/80 bg-slate-950/70 pl-10 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-purple-500/60 disabled:cursor-wait disabled:opacity-60")}
              />
            </div>
            <div className={cn("inline-flex items-center p-0.5 rounded-xl bg-slate-955/90 border border-slate-800/90 shadow-inner h-9 box-border")}>
              <Tooltip content={texts.SUNO_EVALUATE_ON_TOOLTIP} align="center">
                <Button variant="unstyled" type="button" onClick={() => setSunoEvaluateTracks(true)} disabled={isBusy} className={cn("h-7.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none inline-flex items-center justify-center gap-1 leading-none", { "bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-xs": sunoEvaluateTracks, "text-slate-400 hover:text-slate-200 border border-transparent": !sunoEvaluateTracks })}>
                  <Sparkles className={cn("w-3 h-3 shrink-0")} /><span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_EVALUATE_ON}</span>
                </Button>
              </Tooltip>
              <Tooltip content={texts.SUNO_EVALUATE_OFF_TOOLTIP} align="center">
                <Button variant="unstyled" type="button" onClick={() => setSunoEvaluateTracks(false)} disabled={isBusy} className={cn("h-7.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none inline-flex items-center justify-center leading-none", { "bg-slate-700/80 border border-slate-600/80 text-slate-200 shadow-xs": !sunoEvaluateTracks, "text-slate-400 hover:text-slate-200 border border-transparent": sunoEvaluateTracks })}>
                  <span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_EVALUATE_OFF}</span>
                </Button>
              </Tooltip>
            </div>
            <div className={cn("inline-flex items-center p-0.5 rounded-xl bg-slate-955/90 border border-slate-800/90 shadow-inner h-9 box-border")}>
              {(["mp3", "wav"] as SunoDownloadFormat[]).map((format) => (
                <Tooltip key={format} content={format === AUDIO_FORMATS.MP3 ? texts.FORMAT_MP3_TOOLTIP : texts.FORMAT_WAV_TOOLTIP} align="center">
                  <Button variant="unstyled" type="button" onClick={() => setSunoDownloadFormat(format)} disabled={isBusy} className={cn("h-7.5 px-2.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer select-none inline-flex items-center justify-center leading-none", { "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-xs": sunoDownloadFormat === format, "text-slate-400 hover:text-slate-200 border border-transparent": sunoDownloadFormat !== format })}>{format}</Button>
                </Tooltip>
              ))}
            </div>
            <Button variant="unstyled" type="button" onClick={handleDownloadSunoMusic} disabled={isBusy || _.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl || sunoTestPlaylistUrl)} className={cn("h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 leading-none transition-all border cursor-pointer active:scale-95 shadow-md shrink-0 select-none", { "bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 border-amber-400/60 text-white cursor-wait shadow-lg shadow-orange-500/30": isDownloadingSuno, "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500 text-white border-amber-400/50 shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed": !isDownloadingSuno })}>
              {isDownloadingSuno ? <Disc3 className={cn("w-3.5 h-3.5 shrink-0 animate-spin text-amber-200")} /> : <Download className={cn("w-3.5 h-3.5 shrink-0")} />}
              <span className={cn("inline-flex items-center leading-none")}>{isDownloadingSuno ? texts.SUNO_DOWNLOADING_BTN : texts.SUNO_DOWNLOAD_BTN}</span>
            </Button>
            {isDownloadingSuno && (
              <Button variant="unstyled" type="button" onClick={handleCancelSunoDownload} className={cn("h-9 px-3 rounded-xl text-xs font-bold border border-rose-500/50 bg-rose-600 hover:bg-rose-500 text-white inline-flex items-center justify-center gap-1.5 leading-none transition-all cursor-pointer active:scale-95 shadow-sm shrink-0 select-none")}>
                <X className={cn("w-3.5 h-3.5 shrink-0")} />
                <span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_DOWNLOAD_CANCEL_BTN}</span>
              </Button>
            )}
            <Tooltip content={isCopiedPlaylistUrl ? texts.COPIED_LABEL : texts.SUNO_PLAYLIST_COPY_BTN} align="center">
              <Button variant="unstyled" type="button" onClick={handleCopyPlaylistUrl} disabled={_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl)} className={cn("h-9 w-7 inline-flex items-center justify-center text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer bg-transparent border-none p-0 shrink-0 select-none active:scale-90 shadow-none")}>
                {isCopiedPlaylistUrl ? <Check className={cn("w-4 h-4 shrink-0 text-emerald-400")} /> : <Copy className={cn("w-4 h-4 shrink-0")} />}
              </Button>
            </Tooltip>
            <Button variant="unstyled" type="button" onClick={() => window.open(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl, SUNO_AUTOMATION_CONFIG.TARGET_BLANK, "noopener,noreferrer")} disabled={_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl)} className={cn("h-9 px-3 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 hover:border-amber-500/50 inline-flex items-center justify-center gap-1.5 leading-none disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none active:scale-95 shrink-0 shadow-xs")}>
              <ExternalLink className={cn("w-3.5 h-3.5 shrink-0 text-amber-400")} />
              <span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_PLAYLIST_OPEN_BTN}</span>
            </Button>
            <Button variant="unstyled" type="button" onClick={() => window.open(sunoTestPlaylistUrl, SUNO_AUTOMATION_CONFIG.TARGET_BLANK, SUNO_AUTOMATION_CONFIG.OPENER_POLICY)} disabled={_.isEmpty(sunoTestPlaylistUrl)} className={cn("h-9 px-3 rounded-xl text-xs font-bold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 hover:text-white border border-cyan-600/40 hover:border-cyan-400/60 inline-flex items-center justify-center gap-1.5 leading-none disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer select-none active:scale-95 shrink-0 shadow-xs")}>
              <ExternalLink className={cn("w-3.5 h-3.5 shrink-0 text-cyan-400")} />
              <span className={cn("inline-flex items-center leading-none")}>{texts.SUNO_TEST_OPEN_BTN}</span>
            </Button>
          </div>

          {sunoDownloadError && (
            <div role="alert" className={cn("rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 break-words")}>
              <AlertTriangle className={cn("mr-1.5 inline h-3.5 w-3.5")} />
              {sunoDownloadError}
            </div>
          )}

          {styleAnalysis && !isLoading && (
            <details className={cn("rounded-2xl border border-slate-800/90 bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden group transition-all")}>
              <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900/90 hover:bg-slate-800/80 transition-colors border-b border-transparent group-open:border-slate-800/80 select-none")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <div className={cn("w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0")}>
                    <Sparkles className={cn("h-3.5 w-3.5 text-amber-400")} />
                  </div>
                  <div className={cn("flex items-center gap-2 flex-wrap")}>
                    <span className={cn("font-bold text-xs sm:text-sm text-slate-100 tracking-tight")}>{texts.DNA_ANALYSIS_TITLE}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-2xs")}>
                      {styleAnalysis.market.confidence}% {texts.RECOMMENDED_BADGE || "Khớp"}
                    </span>
                  </div>
                </div>
                <div className={cn("flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-200")}>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 group-open:rotate-180")} />
                </div>
              </summary>

              <div className={cn("p-4 sm:p-5 space-y-4 text-left")}>
                <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3")}>
                  <div className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-2xs")}>
                    <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5")}>
                      <Globe className={cn("w-3 h-3 text-indigo-400 shrink-0")} />
                      <span>{texts.MARKET_LABEL.replace(":", "")}</span>
                    </span>
                    <p className={cn("text-xs font-semibold text-slate-100 leading-snug")}>
                      {[styleAnalysis.market.country, styleAnalysis.market.region, styleAnalysis.market.language].filter(Boolean).join(" • ")}
                    </p>
                  </div>

                  <div className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-2xs")}>
                    <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5")}>
                      <Users className={cn("w-3 h-3 text-violet-400 shrink-0")} />
                      <span>{texts.AUDIENCE_LABEL.replace(":", "")}</span>
                    </span>
                    <div className={cn("flex items-center justify-between gap-1.5 flex-wrap")}>
                      <span className={cn("text-xs font-semibold text-slate-100 leading-snug")}>{styleAnalysis.market.audienceAge}</span>
                      <span className={cn("text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded shadow-2xs")}>
                        {styleAnalysis.market.confidence}%
                      </span>
                    </div>
                  </div>

                  <div className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-2xs")}>
                    <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5")}>
                      <Music2 className={cn("w-3 h-3 text-purple-400 shrink-0")} />
                      <span>{texts.GENRE_LABEL.replace(":", "")}</span>
                    </span>
                    <div className={cn("flex items-center gap-1.5 flex-wrap")}>
                      <span className={cn("text-[11px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md shadow-2xs")}>
                        {styleAnalysis.genre.primary}
                      </span>
                      {styleAnalysis.genre.secondary.slice(0, 2).map((sec, idx) => (
                        <span key={idx} className={cn("text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60")}>
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 flex flex-col justify-between shadow-2xs")}>
                    <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5")}>
                      <Clock className={cn("w-3 h-3 text-amber-400 shrink-0")} />
                      <span>{texts.ERA_LABEL.replace(":", "")}</span>
                    </span>
                    <p className={cn("text-xs font-semibold text-slate-100 leading-snug")}>
                      {styleAnalysis.era.songwritingEra} / {styleAnalysis.era.productionEra}
                    </p>
                  </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3")}>
                  <div className={cn("p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-indigo-300 font-mono font-bold text-[11px] uppercase tracking-wider")}>
                      <SlidersHorizontal className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.CREATIVE_ROLE_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-xs text-slate-200 leading-relaxed font-normal")}>
                      {styleAnalysis.creativeProfile.role}
                    </p>
                  </div>

                  <div className={cn("p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-purple-300 font-mono font-bold text-[11px] uppercase tracking-wider")}>
                      <Music2 className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.MUSIC_DNA_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-xs text-slate-200 leading-relaxed font-normal")}>
                      {[styleAnalysis.musicalDna.rhythm, styleAnalysis.musicalDna.tempoRange, styleAnalysis.musicalDna.vocalCharacter].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3")}>
                  <div className={cn("p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-emerald-400 font-bold text-xs")}>
                      <Check className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.PRESERVE_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-[11px] text-slate-200 leading-relaxed")}>
                      {styleAnalysis.mustPreserve.join("; ")}
                    </p>
                  </div>

                  <div className={cn("p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-amber-400 font-bold text-xs")}>
                      <RefreshCw className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.MUST_VARY_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-[11px] text-slate-200 leading-relaxed")}>
                      {styleAnalysis.mustVary.join("; ")}
                    </p>
                  </div>

                  <div className={cn("p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-rose-400 font-bold text-xs")}>
                      <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.MUST_NOT_COPY_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-[11px] text-slate-200 leading-relaxed")}>
                      {styleAnalysis.mustNotCopy.join("; ")}
                    </p>
                  </div>
                </div>

                {!_.isEmpty(styleAnalysis.uncertainties) && (
                  <div className={cn("p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1 shadow-2xs")}>
                    <div className={cn("flex items-center gap-1.5 text-slate-400 font-bold text-[11px]")}>
                      <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0")} />
                      <span>{texts.UNCERTAINTIES_LABEL.replace(":", "")}</span>
                    </div>
                    <p className={cn("text-[11px] text-slate-300 leading-relaxed")}>
                      {formatStyleAnalysisItems(styleAnalysis.uncertainties)}
                    </p>
                  </div>
                )}
                {sunoSettings && (
                  <div className={cn("pt-4 border-t border-fuchsia-500/20 space-y-3.5")}>
                    <div className={cn("flex items-center gap-2 text-fuchsia-300")}>
                      <SlidersHorizontal className={cn("h-4 w-4 shrink-0")} />
                      <span className={cn("text-xs sm:text-sm font-bold")}>{texts.SUNO_SETTINGS_ANALYSIS_TITLE}</span>
                    </div>

                    {sunoSettingsAnalysis && (
                      <div className={cn("p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2 shadow-2xs")}>
                        <div className={cn("text-[11px] uppercase tracking-wider font-mono font-bold text-purple-300 flex items-center gap-1.5")}>
                          <WandSparkles className={cn("w-3.5 h-3.5 text-purple-400 shrink-0")} />
                          <span>{texts.SUNO_PRODUCTION_ASSESSMENT_LABEL}</span>
                        </div>
                        <div className={cn("flex flex-wrap gap-1.5 text-xs text-slate-200")}>
                          {[
                            sunoSettingsAnalysis.productionAssessment.syntheticRole,
                            sunoSettingsAnalysis.productionAssessment.cultureAndMarket,
                            sunoSettingsAnalysis.productionAssessment.eraAndGenre,
                            sunoSettingsAnalysis.productionAssessment.vocalProfile,
                            sunoSettingsAnalysis.productionAssessment.songAndArrangementProfile,
                            sunoSettingsAnalysis.productionAssessment.productionGoal,
                          ].filter(Boolean).map((assessment, idx) => (
                            <span key={idx} className={cn("inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-slate-200 text-[11px] leading-relaxed")}>
                              {assessment}
                            </span>
                          ))}
                        </div>
                        {!_.isEmpty(sunoSettingsAnalysis.productionAssessment.risks) && (
                          <div className={cn("flex items-start gap-1.5 pt-1 text-[11px] text-amber-300 leading-relaxed border-t border-amber-500/20")}>
                            <AlertTriangle className={cn("w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5")} />
                            <span>{sunoSettingsAnalysis.productionAssessment.risks.join("; ")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={cn("p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 shadow-2xs min-w-0")}>
                      <div className={cn("flex items-center justify-between gap-2 flex-wrap")}>
                        <div className={cn("flex items-center gap-1.5 text-rose-400 font-mono font-bold text-[11px] uppercase tracking-wider")}>
                          <X className={cn("w-3.5 h-3.5 shrink-0")} />
                          <span>{texts.SUNO_EXCLUDE_STYLES_LABEL}</span>
                        </div>
                        {sunoSettings.excludeStyles && (
                          <Button variant="unstyled"
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(sunoSettings.excludeStyles);
                              setCopiedKey("excludeStyles");
                              toast.success(texts.SUNO_COPY_EXCLUDE_STYLES_SUCCESS);
                              setTimeout(() => setCopiedKey(null), 2000);
                            }}
                            className={cn(
                              "btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-rose-400 hover:text-rose-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none",
                            )}
                            title={copiedKey === COPY_KEYS.EXCLUDE_STYLES ? texts.COPIED_LABEL : texts.SUNO_COPY_EXCLUDE_STYLES_BTN}
                          >
                            {copiedKey === COPY_KEYS.EXCLUDE_STYLES ? (
                              <Check className={cn("w-3.5 h-3.5 text-emerald-400 shrink-0")} />
                            ) : (
                              <Copy className={cn("w-3.5 h-3.5 shrink-0")} />
                            )}
                          </Button>
                        )}
                      </div>

                      {sunoSettings.excludeStyles ? (
                        <div className={cn("flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-0.5")}>
                          {sunoSettings.excludeStyles.split(",").map((styleItem, idx) => {
                            const trimmed = _.trim(styleItem);
                            if (!trimmed) return null;
                            return (
                              <span
                                key={idx}
                                className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-950/40 text-rose-200 border border-rose-500/20")}
                              >
                                {trimmed}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={cn("text-[11px] font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md inline-block")}>
                          {texts.SUNO_AUTO_VALUE}
                        </span>
                      )}

                      {sunoSettingsAnalysis?.parameterRationale.excludeStyles && (
                        <div className={cn("space-y-0.5 pt-1.5 border-t border-slate-800/60 min-w-0")}>
                          <span className={cn("text-[9px] uppercase tracking-wider font-bold text-slate-500")}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                          <p className={cn("text-[11px] text-slate-300 leading-relaxed break-words")}>{sunoSettingsAnalysis.parameterRationale.excludeStyles}</p>
                        </div>
                      )}
                      <SunoParameterAnalysisDetails analysis={sunoSettingsAnalysis?.parameterAnalysis?.excludeStyles} texts={texts} />
                    </div>

                    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3")}>
                      {[
                        {
                          label: texts.SUNO_VOCAL_GENDER_LABEL,
                          value: sunoSettings.vocalGender === SUNO_VOCAL_GENDERS.MALE ? texts.SUNO_MALE_VALUE : sunoSettings.vocalGender === SUNO_VOCAL_GENDERS.FEMALE ? texts.SUNO_FEMALE_VALUE : texts.SUNO_AUTO_VALUE,
                          reason: sunoSettingsAnalysis?.parameterRationale.vocalGender,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.vocalGender,
                          badgeClass: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/25",
                        },
                        {
                          label: texts.SUNO_DURATION_LABEL,
                          value: texts.SUNO_AUTO_VALUE,
                          reason: "",
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.duration,
                          badgeClass: "text-slate-300 bg-slate-800/80 border-slate-700/60",
                        },
                        {
                          label: texts.SUNO_MAX_MODE_LABEL,
                          value: sunoSettings.maxMode ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE,
                          settingKey: "maxMode" as const,
                          enabled: sunoSettings.maxMode,
                          reason: sunoSettingsAnalysis?.parameterRationale.maxMode,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.maxMode,
                          badgeClass: sunoSettings.maxMode ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" : "text-slate-400 bg-slate-800/60 border-slate-700/40",
                        },
                        {
                          label: texts.SUNO_PERSONALIZE_LABEL,
                          value: sunoSettings.personalize ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE,
                          settingKey: "personalize" as const,
                          enabled: sunoSettings.personalize,
                          reason: sunoSettingsAnalysis?.parameterRationale.personalize,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.personalize,
                          badgeClass: sunoSettings.personalize ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" : "text-slate-400 bg-slate-800/60 border-slate-700/40",
                        },
                      ].map((item) => (
                        <div key={item.label} className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 shadow-2xs flex flex-col justify-between min-w-0")}>
                          <div className={cn("flex items-start justify-between gap-1.5")}>
                            <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 shrink-0")}>{item.label}</span>
                            {"settingKey" in item && item.settingKey ? (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={item.enabled}
                                aria-label={item.label}
                                title={`${item.label}: ${item.enabled ? texts.SUNO_ON_VALUE : texts.SUNO_OFF_VALUE}`}
                                disabled={isBusy}
                                onClick={() => setSunoSettings((current) => current ? { ...current, [item.settingKey]: !current[item.settingKey] } : current)}
                                className={cn(
                                  "toggle-switch select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-40 disabled:cursor-not-allowed",
                                  item.enabled
                                    ? "!bg-emerald-500 border border-emerald-400/60 shadow-sm shadow-emerald-500/30"
                                    : "!bg-slate-800 border border-slate-700/80 hover:border-slate-600"
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "toggle-switch-thumb shadow-md",
                                    item.enabled ? "translate-x-[20px] bg-white" : "translate-x-0 !bg-slate-300"
                                  )}
                                />
                              </button>
                            ) : (
                              <span className={cn("text-[11px] font-bold border px-2 py-0.5 rounded-md shrink-0", item.badgeClass)}>{item.value}</span>
                            )}
                          </div>
                          {item.reason && (
                            <div className={cn("space-y-0.5 min-w-0")}>
                              <span className={cn("text-[9px] uppercase tracking-wider font-bold text-slate-500")}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                              <p className={cn("text-[11px] text-slate-300 leading-relaxed break-words")}>{item.reason}</p>
                            </div>
                          )}
                          <SunoParameterAnalysisDetails analysis={item.analysis} texts={texts} />
                        </div>
                      ))}
                    </div>

                    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3")}>
                      {[
                        {
                          label: texts.SUNO_WEIRDNESS_LABEL,
                          value: sunoSettings.weirdness,
                          reason: sunoSettingsAnalysis?.parameterRationale.weirdness,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.weirdness,
                          gradient: "from-purple-500 to-indigo-500",
                        },
                        {
                          label: texts.SUNO_STYLE_INFLUENCE_LABEL,
                          value: sunoSettings.styleInfluence,
                          reason: sunoSettingsAnalysis?.parameterRationale.styleInfluence,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.styleInfluence,
                          gradient: "from-fuchsia-500 to-pink-500",
                        },
                        {
                          label: texts.SUNO_AUDIO_INFLUENCE_LABEL,
                          value: sunoSettings.audioInfluence,
                          reason: sunoSettingsAnalysis?.parameterRationale.audioInfluence,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.audioInfluence,
                          gradient: "from-amber-500 to-orange-500",
                        },
                        {
                          label: texts.SUNO_VARIETY_LABEL,
                          value: sunoSettings.variety,
                          reason: sunoSettingsAnalysis?.parameterRationale.variety,
                          analysis: sunoSettingsAnalysis?.parameterAnalysis?.variety,
                          gradient: "from-indigo-500 to-cyan-500",
                        },
                      ].map((item) => (
                        <div key={item.label} className={cn("p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 shadow-2xs min-w-0")}>
                          <div className={cn("flex items-center justify-between gap-2")}>
                            <span className={cn("text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400")}>{item.label}</span>
                            <span className={cn("text-xs font-mono font-bold text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/25 px-2 py-0.5 rounded-md shrink-0")}>
                              {item.value}%
                            </span>
                          </div>

                          <div className={cn("w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden")}>
                            <div
                              className={cn("h-full rounded-full transition-all duration-300 bg-gradient-to-r", item.gradient)}
                              style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                            />
                          </div>

                          {item.reason && (
                            <div className={cn("space-y-0.5 min-w-0")}>
                              <span className={cn("text-[9px] uppercase tracking-wider font-bold text-slate-500")}>{texts.SUNO_SETTINGS_REASON_LABEL}</span>
                              <p className={cn("text-[11px] text-slate-300 leading-relaxed break-words")}>{item.reason}</p>
                            </div>
                          )}
                          <SunoParameterAnalysisDetails analysis={item.analysis} texts={texts} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          {isLoading || (isRegeneratingSeo && viewMode === MUSIC_VIEW_MODES.SEO) ? (
            <div className={cn("py-16 flex flex-col items-center justify-center text-center space-y-4")}>
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg", { "bg-fuchsia-500/15 border-fuchsia-500/30 shadow-fuchsia-500/20": isRegeneratingSeo, "bg-purple-500/15 border-purple-500/30 shadow-purple-500/20": !isRegeneratingSeo })}>
                {isRegeneratingSeo ? <Search className={cn("w-7 h-7 text-fuchsia-400 animate-pulse")} /> : <Disc3 className={cn("w-7 h-7 text-purple-400 animate-spin")} />}
              </div>
              <div className={cn("space-y-1")}>
                <p className={cn("text-sm font-extrabold text-slate-200")}>
                  {isRegeneratingSeo ? texts.BLOCK_SEO_LOADING : texts.BLOCK_LYRICS_LOADING}
                </p>
                <p className={cn("text-xs text-slate-400")}>
                  {isRegeneratingSeo ? texts.SEO_OPTIONS_COUNT_BADGE : `${texts.HEADER_BADGE} • ${outputCount} ${texts.SONG_UNIT}`}
                </p>
              </div>
            </div>
          ) : _.isEmpty(songs) ? (
            <div className={cn("py-14 flex flex-col items-center justify-center text-center space-y-3.5")}>
              <div className={cn("w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-inner")}>
                <Music2 className={cn("w-7 h-7 text-purple-400/80")} />
              </div>
              <div className={cn("space-y-1 max-w-sm")}>
                <h3 className={cn("text-sm font-extrabold text-slate-200")}>
                  {texts.BLOCK_LYRICS_EMPTY_TITLE}
                </h3>
                <p className={cn("text-xs text-slate-400 leading-relaxed")}>
                  {texts.BLOCK_LYRICS_EMPTY_DESC}
                </p>
              </div>
              <Button variant="unstyled"
                type="button"
                onClick={handleTrySampleTemplate}
                disabled={isBusy}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 inline-flex items-center justify-center gap-1.5 leading-none transition-all cursor-pointer shadow-xs")}>
                <Sparkles className={cn("w-3.5 h-3.5 text-purple-400 shrink-0")} />
                <span className={cn("inline-flex items-center leading-none")}>{texts.TRY_SAMPLE_BTN}</span>
              </Button>
            </div>
          ) : (
            <div>
              {!_.isEmpty(_.trim(downloadPlaylistUrl) || sunoPlaylistUrl) && (
                <div className={cn("relative mb-5 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-amber-955/20 to-slate-900/95 p-3.5 sm:p-4 backdrop-blur-xl shadow-xl shadow-black/40 transition-all hover:border-amber-500/40")}>
                  <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent")} />
                  <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-3.5")}>
                    <div className={cn("flex items-center gap-3 min-w-0")}>
                      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-orange-500/20 shrink-0")}>
                        <div className={cn("w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400")}>
                          <Disc3 className={cn("w-5 h-5 animate-spin [animation-duration:8s]")} />
                        </div>
                      </div>
                      <div className={cn("min-w-0 space-y-0.5")}>
                        <div className={cn("flex items-center gap-2 flex-wrap")}>
                          <span className={cn("font-black text-slate-100 text-sm sm:text-base tracking-tight")}>
                            {texts.SUNO_PLAYLIST_LABEL}
                          </span>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xs")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse")} />
                            {texts.SUNO_PLAYLIST_STATUS_READY}
                          </span>
                          {!_.isEmpty(sunoTrackIds) && (
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-xs")}>
                              {texts.formatTrackCount(sunoTrackIds.length)}
                            </span>
                          )}
                        </div>
                        <p className={cn("text-[11px] text-slate-400 leading-normal truncate max-w-md sm:max-w-xl")}>
                          {texts.SUNO_PLAYLIST_SUBTITLE}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
              {viewMode === MUSIC_VIEW_MODES.LYRICS && (
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-1")}>
                  {_.map(songs, (song, idx) => (
                    <SongCard key={song.songId || idx} song={song} index={idx} texts={texts} />
                  ))}
                </div>
              )}

              {viewMode === MUSIC_VIEW_MODES.SEO && (
                <PlaylistSeoCard seoOptions={displayedSeoOptions} texts={texts} playlistUrl={_.trim(downloadPlaylistUrl) || sunoPlaylistUrl} />
              )}

              {viewMode === MUSIC_VIEW_MODES.SPLIT && (
                <div className={cn("space-y-4")}>
                  <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar")}>
                    {_.map(songs, (song, idx) => {
                      const isSelected = selectedSeoSongIndex === idx;
                      return (
                        <Button variant="unstyled"
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSeoSongIndex(idx)}
                          className={cn("px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 inline-flex items-center justify-center gap-1.5 group select-none shadow-2xs leading-none", { "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white border-indigo-400 shadow-sm shadow-indigo-600/20": isSelected, "bg-white/80 dark:bg-slate-955/90 border-slate-200/90 dark:border-slate-800 !text-[#1e293b] hover:!text-[#4338ca] dark:!text-slate-300 dark:hover:!text-white hover:border-indigo-400/60 dark:hover:border-indigo-500/40 hover:bg-indigo-50/70 dark:hover:bg-slate-900/90": !(isSelected) })}>
                          <span
                            className={cn("font-mono font-black inline-flex items-center leading-none", { "!text-indigo-100": isSelected, "!text-indigo-600 group-hover:!text-indigo-800 dark:!text-indigo-400 dark:group-hover:!text-indigo-300": !(isSelected) })}>
                            {texts.formatTrackBadge(idx + 1)}
                          </span>
                          <span className={cn("inline-flex items-center leading-none")}>{_.truncate(toSentenceCase(song.title), { length: 18 })}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {songs[selectedSeoSongIndex] && (
                    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4 items-start")}>
                      <SongCard
                        song={songs[selectedSeoSongIndex]}
                        index={selectedSeoSongIndex}
                        texts={texts}
                      />
                      <PlaylistSeoCard seoOptions={displayedSeoOptions} texts={texts} playlistUrl={_.trim(downloadPlaylistUrl) || sunoPlaylistUrl} columns={1} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal imageUrl={previewThumbnail} onClose={() => setPreviewThumbnail(null)} />

      <Modal
        isOpen={Boolean(styleToDelete)}
        onClose={() => setStyleToDelete(null)}
        maxWidth="max-w-md"
        title={
          <span className={cn("inline-flex items-center gap-2 leading-none text-slate-900 dark:text-slate-100")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500 shrink-0 self-center -translate-y-[1px]")} />
            <span className={cn("leading-none text-sm font-extrabold")}>{texts.STYLE_DELETE_BTN}</span>
          </span>
        }>
        <div className={cn("space-y-4 text-left")}>
          <p className={cn("text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed")}>
            {texts.STYLE_DELETE_CONFIRM}{" "}
            <span className={cn("font-extrabold !text-[#1e1b4b] dark:!text-white")}>“{styleToDelete?.title}”</span>?
          </p>
          <div className={cn("p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2")}>
            <AlertTriangle className={cn("w-4 h-4 text-rose-500 shrink-0")} />
            <span>{texts.CANNOT_BE_UNDONE}</span>
          </div>
          <div className={cn("flex justify-end items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800")}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStyleToDelete(null)}
              className={cn("h-9 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs inline-flex items-center justify-center leading-none")}>
              <span className={cn("inline-flex items-center leading-none")}>{texts.CANCEL_BTN}</span>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmDeleteStyle}
              className={cn("h-9 px-5 rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 active:scale-95 transition-all inline-flex items-center justify-center leading-none")}>
              <span className={cn("inline-flex items-center leading-none")}>{texts.STYLE_DELETE_BTN}</span>
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(inspoToDelete)}
        onClose={() => setInspoToDelete(null)}
        maxWidth="max-w-md"
        title={texts.INSPO_DELETE_CONFIRM}>
        <div className={cn("space-y-4 text-left")}>
          <p className={cn("text-sm text-slate-300")}>{texts.INSPO_DELETE_CONFIRM} <span className={cn("font-extrabold text-white")}>“{inspoToDelete?.title}”</span>?</p>
          <div className={cn("flex justify-end gap-2.5 pt-3 border-t border-slate-800")}>
            <Button type="button" variant="outline" size="sm" onClick={() => setInspoToDelete(null)}>{texts.CANCEL_BTN}</Button>
            <Button type="button" variant="danger" size="sm" onClick={confirmDeleteInspo}>{texts.STYLE_DELETE_BTN}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
