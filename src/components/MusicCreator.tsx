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
  Loader2,
  X,
  Columns,
  Clock,
  AlertTriangle,
} from "lucide-react";
import _ from "lodash";
import { toast } from "sonner";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Tooltip } from "./ui/Tooltip";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
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
} from "../constants";
import { cn } from "../lib/utils";
import { storageUtils } from "../lib/storage";

const MUSIC_STYLE_LIBRARY_KEY = "music_creator_style_library";
const MUSIC_CREATOR_STATE_KEY = "music_creator_workspace_state_v1";

interface SavedMusicStyle {
  title: string;
  content: string;
}

const readSavedStyles = (): SavedMusicStyle[] => {
  try {
    const value = storageUtils.get(MUSIC_STYLE_LIBRARY_KEY);
    if (!value) return [];
    return _.compact(
      _.map(JSON.parse(value), (item) =>
        _.isString(item)
          ? { title: _.split(item, ",")[0], content: item }
          : item?.title && item?.content
            ? item
            : undefined,
      ),
    );
  } catch {
    return [];
  }
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

type ResultViewMode = "lyrics" | "seo" | "split";

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
  playlistSeoOptions?: SongSeoOption[];
  viewMode?: ResultViewMode;
  selectedSeoSongIndex?: number;
}

const readMusicCreatorState = (): PersistedMusicCreatorState => {
  try {
    const value = storageUtils.get(MUSIC_CREATOR_STATE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

interface MusicCreatorProps {
  currentLang?: "vi" | "en";
}

type MusicCreatorTexts = (typeof MUSIC_CREATOR_TEXTS)[keyof typeof MUSIC_CREATOR_TEXTS];

/* -------------------------------------------------------------------------- */
/* HEADER COMPONENT                                                           */
/* -------------------------------------------------------------------------- */
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
  <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-md shadow-purple-500/20 shrink-0">
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400">
          <Music2 className="w-5 h-5" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans">
            {texts.HEADER_TITLE}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            {texts.HEADER_BADGE}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {texts.HEADER_DESC}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 self-start sm:self-auto">
      <Tooltip content={texts.AI_CONFIG_TOOLTIP} align="end">
        <Button
          type="button"
          variant="unstyled"
          onClick={onToggleAiConfig}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs",
            isAiConfigOpen
              ? "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10"
              : "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-slate-700 hover:!text-slate-950 dark:!text-slate-400 dark:hover:!text-slate-200 hover:border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-slate-900",
          )}>
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
          <span>{texts.AI_CONFIG_TITLE}</span>
          {isAiConfigOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </Button>
      </Tooltip>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* SONG CARD COMPONENT                                                       */
/* -------------------------------------------------------------------------- */
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
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 shadow-lg space-y-2 hover:border-purple-500/40 transition-all text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-mono text-xs sm:text-sm font-black shrink-0 select-none shadow-2xs">
            #{index + 1}
          </span>
          <h3 className="text-sm sm:text-base font-black !text-[#0f172a] dark:!text-slate-100 truncate max-w-[200px] sm:max-w-md" title={displayTitle}>
            {displayTitle}
          </h3>
          <Button
            type="button"
            variant="unstyled"
            onClick={() => handleCopy(displayTitle, `title-${index}`, texts.COPY_TITLE_SUCCESS)}
            className="text-[11px] !text-[#7e22ce] hover:!text-[#4c1d95] dark:!text-purple-300 dark:hover:!text-purple-100 flex items-center gap-1 cursor-pointer font-bold transition-colors shrink-0"
            title={texts.COPY_TITLE_BTN}>
            {copiedKey === `title-${index}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedKey === `title-${index}` ? texts.COPIED_LABEL : texts.COPY_TITLE_BTN}</span>
          </Button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {song.genre && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 !text-[#0369a1] dark:!text-sky-300 select-none">
              {song.genre}
            </span>
          )}
          {song.tempoBpm > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 !text-[#9a3412] dark:!text-amber-300 inline-flex items-center gap-1 select-none">
              <Clock className="w-3 h-3 !text-[#c2410c] dark:!text-amber-400 shrink-0" />
              <span>{song.tempoBpm} BPM</span>
            </span>
          )}
          {song.mood && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 !text-[#065f46] dark:!text-emerald-300 select-none">
              {song.mood}
            </span>
          )}
        </div>
      </div>

      {song.lyrics && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-pink-600 dark:text-pink-400 uppercase tracking-wider font-bold">
              <FileText className="w-3 h-3" />
              {texts.LYRICS_TITLE}
            </span>
            <Button
              type="button"
              variant="unstyled"
              onClick={() => handleCopy(song.lyrics, `lyrics-${index}`, texts.COPY_LYRICS_SUCCESS)}
              className="text-[11px] !text-[#7e22ce] hover:!text-[#4c1d95] dark:!text-purple-300 dark:hover:!text-purple-100 flex items-center gap-1 cursor-pointer font-bold transition-colors shrink-0">
              {copiedKey === `lyrics-${index}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === `lyrics-${index}` ? texts.COPIED_LABEL : texts.COPY_LYRICS_BTN}</span>
            </Button>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-955/90 border border-slate-800/90 text-xs font-sans whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar text-slate-200 leading-relaxed shadow-inner">
            {song.lyrics}
          </pre>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PLAYLIST SEO CARD COMPONENT                                                */
/* -------------------------------------------------------------------------- */
interface PlaylistSeoCardProps {
  seoOptions: SongSeoOption[];
  texts: MusicCreatorTexts;
}

const PlaylistSeoCard: React.FC<PlaylistSeoCardProps> = ({ seoOptions, texts }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFullOption = (opt: SongSeoOption, index: number) => {
    const fullText = `=== ${texts.formatOptionLabel(index + 1)} (${texts.formatScoreLabel(opt.seoScore)}) ===\n\n[${texts.SEO_FIELD_TITLE}]:\n${opt.title}\n\n[${texts.SEO_FIELD_DESCRIPTION}]:\n${opt.description}\n\n[HASHTAGS]:\n${opt.hashtags.join(" ")}\n\n[TAGS / KEYWORDS]:\n${opt.tags.join(", ")}`;
    handleCopy(fullText, `seo-all-${index}`, texts.COPY_SEO_OPTION_SUCCESS);
  };

  const CopyFieldButton = ({ text, field, optionIndex, label }: { text: string; field: string; optionIndex: number; label?: string }) => {
    const key = `seo-${optionIndex}-${field}`;
    return (
      <Button
        type="button"
        variant="unstyled"
        onClick={() => handleCopy(text, key, texts.COPY_SEO_FIELD_SUCCESS)}
        className="text-xs font-bold !text-[#7e22ce] hover:!text-[#4c1d95] dark:!text-purple-300 dark:hover:!text-purple-100 flex items-center gap-1 cursor-pointer transition-colors shrink-0 select-none"
        title={texts.COPY_FIELD_BTN}>
        {copiedKey === key ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        <span>{copiedKey === key ? texts.COPIED_LABEL : label || texts.COPY_FIELD_BTN}</span>
      </Button>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-4 hover:border-fuchsia-500/40 transition-all text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-500 shrink-0" />
          <h3 className="text-sm sm:text-base font-extrabold !text-[#0f172a] dark:!text-slate-100">{texts.PLAYLIST_SEO_TITLE}</h3>
        </div>
        <span className="text-[11px] font-mono font-bold !text-[#a21caf] dark:!text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-0.5 rounded-lg shadow-2xs">
          {texts.SEO_OPTIONS_COUNT_BADGE}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {_.map(seoOptions, (opt, sIdx) => {
          return (
            <div
              key={sIdx}
              className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-955/90 border border-slate-200 dark:border-slate-800/80 space-y-3.5 transition-all hover:border-purple-400/50 dark:hover:border-slate-700 shadow-sm">
              {/* Header của phương án SEO */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 !text-[#a21caf] dark:!text-fuchsia-300 font-mono text-xs font-black shadow-2xs">
                    {texts.formatOptionLabel(sIdx + 1)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 !text-[#047857] dark:!text-emerald-300 font-mono text-xs font-black shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{texts.formatScoreLabel(opt.seoScore)}</span>
                  </span>
                </div>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => handleCopyFullOption(opt, sIdx)}
                  className="text-xs font-bold !text-[#7e22ce] hover:!text-[#4c1d95] dark:!text-purple-300 dark:hover:!text-purple-100 flex items-center gap-1.5 cursor-pointer transition-colors px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 shadow-2xs">
                  {copiedKey === `seo-all-${sIdx}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === `seo-all-${sIdx}` ? texts.COPIED_LABEL : texts.COPY_SEO_OPTION_BTN}</span>
                </Button>
              </div>

              {/* Các khối thông tin SEO */}
              <div className="space-y-3">
                {/* Khối 1: Tiêu đề YouTube */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-purple-500" />
                      <span>{texts.SEO_FIELD_TITLE}</span>
                    </span>
                    <CopyFieldButton text={opt.title} field="title" optionIndex={sIdx} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black !text-[#0f172a] dark:!text-slate-100 leading-snug break-words">
                    {opt.title}
                  </h4>
                </div>

                {/* Khối 2: Mô tả video */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3 h-3 text-sky-500" />
                      <span>{texts.SEO_FIELD_DESCRIPTION}</span>
                    </span>
                    <CopyFieldButton text={opt.description} field="description" optionIndex={sIdx} />
                  </div>
                  <p className="text-xs !text-[#334155] dark:!text-slate-300 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-line break-words">
                    {opt.description}
                  </p>
                </div>

                {/* Khối 3 & 4: Hashtag và Tag chia 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Cột Hashtags */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="font-bold text-purple-600 dark:text-purple-400">#</span>
                          <span>Hashtags ({opt.hashtags.length})</span>
                        </span>
                        <CopyFieldButton text={opt.hashtags.join(" ")} field="hashtags" optionIndex={sIdx} />
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                        {_.map(opt.hashtags, (tag, i) => (
                          <span key={i} className="text-[11px] font-mono font-bold !text-[#7e22ce] dark:!text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/25 px-2 py-0.5 rounded-md select-all">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cột Tags (Keywords) */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Search className="w-3 h-3 text-emerald-500" />
                          <span>Từ khóa / Tags ({opt.tags.length})</span>
                        </span>
                        <CopyFieldButton text={opt.tags.join(", ")} field="tags" optionIndex={sIdx} />
                      </div>
                      <p className="text-[11px] font-mono !text-[#475569] dark:!text-slate-300 leading-relaxed max-h-28 overflow-y-auto custom-scrollbar break-words select-all">
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

/* -------------------------------------------------------------------------- */
/* MAIN MUSIC CREATOR COMPONENT                                               */
/* -------------------------------------------------------------------------- */
export default function MusicCreator({ currentLang = "vi" }: MusicCreatorProps) {
  const texts = MUSIC_CREATOR_TEXTS[currentLang] || MUSIC_CREATOR_TEXTS.vi;
  const [initialState] = useState<PersistedMusicCreatorState>(readMusicCreatorState);
  const [initialSavedStyles] = useState<SavedMusicStyle[]>(readSavedStyles);
  const [style, setStyle] = useState(() => initialState.style || initialSavedStyles[0]?.content || "");
  const [savedStyles, setSavedStyles] = useState<SavedMusicStyle[]>(initialSavedStyles);
  const [editingStyleIndex, setEditingStyleIndex] = useState<number | null>(null);
  const [editingOriginalStyle, setEditingOriginalStyle] = useState("");
  const [styleToDelete, setStyleToDelete] = useState<SavedMusicStyle | null>(null);
  const [copiedStyleIndex, setCopiedStyleIndex] = useState<number | null>(null);
  const [outputCount, setOutputCount] = useState<number>(initialState.outputCount || MUSIC_CREATOR_CONSTANTS.DEFAULT_SONG_COUNT);
  const [referenceSongs, setReferenceSongs] = useState(initialState.referenceSongs || "");
  const [provider, setProvider] = useState<AiPlanningFallbackProvider>(initialState.provider || AiPlanningFallbackProvider.ChatGptUi);
  const [model, setModel] = useState<AiPlanningChatModel>(initialState.model || AiPlanningChatModel.ChatGptAuto);
  const [executionMode, setExecutionMode] = useState<AiPlanningExecutionMode>(initialState.executionMode || AiPlanningExecutionMode.RoomOnly);
  const [chromeHeadless, setChromeHeadless] = useState(initialState.chromeHeadless ?? true);
  const musicRunIdRef = useRef<string | null>(null);
  const musicAbortControllerRef = useRef<AbortController | null>(null);

  const [isAiConfigOpen, setIsAiConfigOpen] = useState(initialState.isAiConfigOpen ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [songs, setSongs] = useState<GeneratedSong[]>(initialState.songs || []);
  const [playlistSeoOptions, setPlaylistSeoOptions] = useState<SongSeoOption[]>(initialState.playlistSeoOptions || []);
  const [viewMode, setViewMode] = useState<ResultViewMode>(initialState.viewMode || "lyrics");
  const [selectedSeoSongIndex, setSelectedSeoSongIndex] = useState<number>(initialState.selectedSeoSongIndex || 0);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      storageUtils.set(
        MUSIC_CREATOR_STATE_KEY,
        JSON.stringify({
          style,
          outputCount,
          referenceSongs,
          provider,
          model,
          executionMode,
          chromeHeadless,
          isAiConfigOpen,
          songs,
          playlistSeoOptions,
          viewMode,
          selectedSeoSongIndex,
        } satisfies PersistedMusicCreatorState),
      );
    }, 250);
    return () => window.clearTimeout(saveTimer);
  }, [style, outputCount, referenceSongs, provider, model, executionMode, chromeHeadless, isAiConfigOpen, songs, playlistSeoOptions, viewMode, selectedSeoSongIndex]);

  const persistStyles = (nextStyles: SavedMusicStyle[]) => {
    setSavedStyles(nextStyles);
    storageUtils.set(MUSIC_STYLE_LIBRARY_KEY, JSON.stringify(nextStyles));
  };

  const handleEditStyle = (index: number) => {
    if (!savedStyles[index]) return;
    setEditingStyleIndex(index);
    setEditingOriginalStyle(style);
    setStyle(savedStyles[index].content);
  };

  const handleCopyStyle = (savedStyle: SavedMusicStyle, index: number) => {
    navigator.clipboard.writeText(savedStyle.content);
    setCopiedStyleIndex(index);
    toast.success(texts.COPY_STYLE_SUCCESS);
    window.setTimeout(() => setCopiedStyleIndex(null), 2000);
  };

  const handleCancelStyleEdit = () => {
    setStyle(editingStyleIndex === null ? "" : editingOriginalStyle);
    setEditingStyleIndex(null);
    setEditingOriginalStyle("");
  };

  const handleSaveStyle = () => {
    const nextContent = _.trim(style);
    if (_.isEmpty(nextContent)) return;
    const nextTitle = _.truncate(_.split(nextContent, /[,.;\n]/)[0], { length: 32 });
    const nextItem = { title: nextTitle, content: nextContent };
    const nextStyles =
      editingStyleIndex === null
        ? [...savedStyles, nextItem]
        : _.map(savedStyles, (item, index) => (index === editingStyleIndex ? nextItem : item));
    persistStyles(nextStyles);
    setEditingStyleIndex(null);
    setEditingOriginalStyle("");
    toast.success(texts.STYLE_SAVE_SUCCESS);
  };

  const handleDeleteStyle = (savedStyle: SavedMusicStyle) => {
    const nextStyles = _.reject(savedStyles, (item) => _.isEqual(item.content, savedStyle.content));
    persistStyles(nextStyles);
    if (_.isEqual(style, savedStyle.content)) {
      setStyle(nextStyles[0]?.content || "");
      setEditingStyleIndex(null);
    }
  };

  const confirmDeleteStyle = () => {
    if (!styleToDelete) return;
    handleDeleteStyle(styleToDelete);
    setStyleToDelete(null);
    toast.success(currentLang === "vi" ? "Đã xóa style." : "Style deleted.");
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
    if (_.isEmpty(songs)) return;
    const allContent = _.map(
      songs,
      (s, i) =>
        `=== ${texts.SONG_UNIT.toUpperCase()} ${i + 1}: ${toSentenceCase(s.title)} ===\n[${texts.LYRICS_TITLE}]:\n${s.lyrics}\n`,
    ).join("\n----------------------------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SUCCESS);
  };

  const handleCopyAllSeo = () => {
    if (_.isEmpty(playlistSeoOptions)) return;
    const allContent = _.map(playlistSeoOptions, (opt, idx) =>
      `[${texts.formatOptionLabel(idx + 1)}] (${texts.formatScoreLabel(opt.seoScore)})\n${texts.SEO_FIELD_TITLE}: ${opt.title}\n${texts.SEO_FIELD_DESCRIPTION}: ${opt.description}\nHashtags: ${opt.hashtags.join(" ")}\nTags: ${opt.tags.join(", ")}`,
    ).join("\n----------------------------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SEO_SUCCESS);
  };

  const handleGenerate = async () => {
    const trimmedStyle = _.trim(style);
    if (_.isEmpty(trimmedStyle)) {
      toast.error(texts.VALIDATION_STYLE_REQUIRED);
      return;
    }

    const referenceSource = _.trim(referenceSongs);

    setIsLoading(true);
    const runId = `music_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    musicRunIdRef.current = runId;
    const abortController = new AbortController();
    musicAbortControllerRef.current = abortController;
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_PLAN, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: JSON.stringify({
          requestedSongCount: outputCount,
          style: trimmedStyle,
          referenceSongs: _.isEmpty(referenceSource) ? [] : [referenceSource],
          projectId: runId,
          requestId: runId,
          aiExecution: {
            provider,
            model,
            executionMode,
            chromeHeadless,
          },
        }),
        signal: abortController.signal,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || texts.ERROR_GENERATION_FAILED);
      }

      const generatedSongs = _.get(result, "data.songs", []) as GeneratedSong[];
      const generatedPlaylistSeo = _.get(result, "data.playlistSeoOptions", []) as SongSeoOption[];
      setSongs(generatedSongs);
      setPlaylistSeoOptions(generatedPlaylistSeo);
      setSelectedSeoSongIndex(0);
      toast.success(texts.formatGenerateBtn(generatedSongs.length));
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error(_.toString(err?.message || texts.ERROR_GENERATION_FAILED));
      }
    } finally {
      musicAbortControllerRef.current = null;
      musicRunIdRef.current = null;
      setIsLoading(false);
    }
  };

  const handleCancelGeneration = () => {
    if (!isLoading) return;
    const runId = musicRunIdRef.current;
    musicAbortControllerRef.current?.abort();
    if (runId) {
      void fetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: JSON.stringify({ pipelineRunId: runId, closeBrowser: true }),
      }).catch(() => undefined);
    }
    toast.info(currentLang === "vi" ? "Đã dừng tạo." : "Stopped generation.");
  };

  const isFormValid = !_.isEmpty(_.trim(style));

  return (
    <div className="creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar">
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80">
        <MusicCreatorHeader
          texts={texts}
          isAiConfigOpen={isAiConfigOpen}
          onToggleAiConfig={() => setIsAiConfigOpen(!isAiConfigOpen)}
          isLoading={isLoading}
        />

        {isAiConfigOpen && (
          <div className="glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4">
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
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-5 min-w-0">
            <div className="glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full">
              <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20">
                    01
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{texts.STYLE_LABEL}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">
                      {texts.STYLE_BADGE}
                    </span>
                  </h3>
                </div>

                {!_.isEmpty(_.trim(style)) && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={handleSaveStyle}
                      disabled={isLoading}
                      className="h-8 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all shadow-xs [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white">
                      <Save className="w-3 h-3" />
                      <span>{editingStyleIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={handleCancelStyleEdit}
                      disabled={isLoading}
                      className="h-8 px-2.5 rounded-lg border border-slate-300 hover:border-rose-500/50 bg-transparent hover:bg-rose-500/10 dark:border-slate-700/80 !text-[#475569] hover:!text-rose-600 dark:!text-slate-400 dark:hover:!text-rose-400 text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-center">
                      {currentLang === "vi" ? "Hủy" : "Cancel"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="relative z-10">
                <textarea
                  rows={4}
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder={texts.STYLE_PLACEHOLDER}
                  disabled={isLoading}
                  className="w-full min-h-[100px] sm:min-h-[110px] bg-slate-955/90 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-y shadow-inner transition-all placeholder:text-slate-500 font-sans border border-slate-800/80 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/60 relative z-10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{texts.STYLE_YOUR_STYLES}</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                  {_.map(savedStyles, (savedStyle, styleIndex) => {
                    const isSelected = _.isEqual(style, savedStyle.content);
                    return (
                      <div
                        key={`${styleIndex}-${savedStyle.title}`}
                        className={cn(
                          "group relative inline-flex items-center pl-3 pr-2 rounded-xl border transition-all duration-200 shadow-2xs backdrop-blur-sm shrink-0 h-[38px] min-h-[38px]",
                          isSelected
                            ? "bg-purple-100/90 dark:bg-purple-950/70 border-purple-500/80 ring-1 ring-purple-500/30 shadow-2xs"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-purple-400",
                        )}>
                        <Tooltip content={savedStyle.content} align="start">
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setStyle(savedStyle.content)}
                            disabled={isLoading}
                            className="text-[11px] font-black truncate max-w-[120px] cursor-pointer text-left flex items-center gap-1.5 !text-[#1e1b4b] dark:!text-white leading-none h-full"
                            title={savedStyle.content}>
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                                isSelected
                                  ? "bg-purple-600 dark:bg-purple-400 ring-1 ring-purple-400/40"
                                  : "bg-slate-400 dark:bg-slate-500 group-hover:bg-purple-500",
                              )}
                            />
                            <span
                              className="truncate font-black !text-[#1e1b4b] dark:!text-white text-[11px] leading-none">
                              {savedStyle.title}
                            </span>
                          </Button>
                        </Tooltip>

                        <div className="flex items-center gap-1 ml-1.5 shrink-0 self-center">
                          <Tooltip content={texts.COPY_STYLE_BTN} align="center" className="w-5.5 h-5.5 min-w-5.5 min-h-5.5 max-w-5.5 max-h-5.5 shrink-0 self-center p-0 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyStyle(savedStyle, styleIndex);
                              }}
                              disabled={isLoading}
                              title={texts.COPY_STYLE_BTN}
                              className="btn-icon-tiny !w-[22px] !h-[22px] !min-w-[22px] !min-h-[22px] !max-w-[22px] !max-h-[22px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-700 dark:text-sky-300">
                              {copiedStyleIndex === styleIndex ? <Check className="w-[11px] h-[11px] shrink-0 text-emerald-500" /> : <Copy className="w-[11px] h-[11px] shrink-0" />}
                            </Button>
                          </Tooltip>

                          <Tooltip content={texts.STYLE_UPDATE_BTN} align="center" className="w-5.5 h-5.5 min-w-5.5 min-h-5.5 max-w-5.5 max-h-5.5 shrink-0 self-center p-0 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStyle(styleIndex);
                              }}
                              disabled={isLoading}
                              title={texts.STYLE_UPDATE_BTN}
                              className="btn-icon-tiny !w-[22px] !h-[22px] !min-w-[22px] !min-h-[22px] !max-w-[22px] !max-h-[22px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-[#7e22ce] dark:text-purple-300">
                              <Pencil className="w-[11px] h-[11px] shrink-0" />
                            </Button>
                          </Tooltip>

                          <Tooltip content={texts.STYLE_DELETE_BTN} align="center" className="w-5.5 h-5.5 min-w-5.5 min-h-5.5 max-w-5.5 max-h-5.5 shrink-0 self-center p-0 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="unstyled"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStyleToDelete(savedStyle);
                              }}
                              disabled={isLoading}
                              title={texts.STYLE_DELETE_BTN}
                              className="btn-icon-tiny !w-[22px] !h-[22px] !min-w-[22px] !min-h-[22px] !max-w-[22px] !max-h-[22px] !p-0 aspect-square rounded-[5px] inline-flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-[#e11d48] dark:text-rose-400">
                              <Trash2 className="w-[11px] h-[11px] shrink-0" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                  {_.isEmpty(savedStyles) && (
                    <span className="text-[11px] text-slate-500 italic py-1">
                      {texts.STYLE_EMPTY_HINT}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20">
                    02
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>{texts.REFERENCE_LABEL}</span>
                  </h3>
                </div>

                <Button
                  type="button"
                  variant="unstyled"
                  onClick={handleFillSampleReferences}
                  disabled={isLoading}
                  className="text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 shadow-xs !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white">
                  <Sparkles className="w-3 h-3" />
                  <span>{texts.QUICK_FILL_LABEL}</span>
                </Button>
              </div>

              <div className="relative z-10">
                <textarea
                  rows={4}
                  value={referenceSongs}
                  onChange={(e) => setReferenceSongs(e.target.value)}
                  placeholder={texts.REFERENCE_PLACEHOLDER}
                  disabled={isLoading}
                  className="w-full min-h-[90px] sm:min-h-[100px] bg-slate-955/90 text-slate-100 p-3.5 rounded-2xl text-xs leading-relaxed outline-none resize-y shadow-inner transition-all placeholder:text-slate-500 font-sans border border-slate-800/80 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-5 min-w-0">
            <div className="glass-card bg-slate-900/90 border border-slate-800/80 p-5 space-y-4 text-left relative overflow-hidden backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-xs shadow-amber-500/20 shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                      {texts.STUDIO_CONFIG_TITLE}
                    </h2>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black tracking-normal">
                  {texts.STUDIO_CONFIG_BADGE}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {texts.COUNT_LABEL}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {_.map(MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS, (count) => {
                    const isSelected = _.isEqual(outputCount, count);
                    const isRecommended = _.isEqual(count, MUSIC_CREATOR_CONSTANTS.RECOMMENDED_SONG_COUNT);
                    return (
                      <Button
                        key={count}
                        type="button"
                        variant="unstyled"
                        onClick={() => setOutputCount(count)}
                        disabled={isLoading}
                        className={cn(
                          "relative h-9 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs select-none",
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]"
                            : "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90",
                        )}>
                        <span>{texts.formatSongCount(count)}</span>
                        {isRecommended && !isSelected && (
                          <span className="absolute -top-1 px-1 rounded text-[7px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {texts.RECOMMENDED_BADGE}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-955/70 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>{texts.COUNT_LABEL}:</span>
                  <span className="font-bold text-slate-200">{outputCount} {texts.SONG_UNIT}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Engine:</span>
                  <span className="font-bold text-purple-300">{texts.HEADER_BADGE}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mô hình:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[130px]">{model}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={handleGenerate}
                    disabled={!isFormValid || isLoading}
                    className={cn(
                      "h-11 min-h-[44px] px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg tracking-wider uppercase font-sans border",
                      isLoading
                        ? "flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse"
                        : isFormValid
                          ? "w-full bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer"
                          : "w-full bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none",
                    )}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span className="truncate">{texts.BLOCK_LYRICS_LOADING}</span>
                      </>
                    ) : (
                      <>
                        <WandSparkles className="w-4 h-4 shrink-0" />
                        <span>{texts.formatGenerateBtn(outputCount)}</span>
                      </>
                    )}
                  </Button>

                  {isLoading && (
                    <Button
                      type="button"
                      variant="unstyled"
                      onClick={handleCancelGeneration}
                      className="h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 shrink-0">
                      <X className="w-4 h-4 shrink-0" />
                      <span>{currentLang === "vi" ? "Dừng" : "Stop"}</span>
                    </Button>
                  )}
                </div>

                {!isLoading && _.isEmpty(songs) && (
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={handleTrySampleTemplate}
                    className="w-full py-2 text-center text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline cursor-pointer transition-colors flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{texts.TRY_SAMPLE_BTN}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-100 uppercase tracking-tight">
                  {texts.RESULTS_TITLE}
                </h2>
                {!_.isEmpty(songs) && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    {songs.length} {texts.SONG_UNIT}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
              {!_.isEmpty(songs) && (
                <div className="flex items-center p-1 rounded-xl bg-slate-955/90 border border-slate-800/90 shadow-inner">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => setViewMode("lyrics")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none",
                      viewMode === "lyrics"
                        ? "bg-purple-600 !text-white shadow-sm"
                        : "!text-slate-700 hover:!text-purple-700 dark:!text-slate-400 dark:hover:!text-slate-100",
                    )}>
                    <Music2 className="w-3 h-3" />
                    <span>{texts.TAB_LYRICS}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => setViewMode("seo")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none",
                      viewMode === "seo"
                        ? "bg-fuchsia-600 !text-white shadow-sm"
                        : "!text-slate-700 hover:!text-fuchsia-700 dark:!text-slate-400 dark:hover:!text-slate-100",
                    )}>
                    <Search className="w-3 h-3" />
                    <span>{texts.TAB_SEO}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() => setViewMode("split")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none",
                      viewMode === "split"
                        ? "bg-indigo-600 !text-white shadow-sm"
                        : "!text-slate-700 hover:!text-indigo-700 dark:!text-slate-400 dark:hover:!text-slate-100",
                    )}>
                    <Columns className="w-3 h-3" />
                    <span>{texts.TAB_SPLIT}</span>
                  </Button>
                </div>
              )}

              {!_.isEmpty(songs) && (
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={viewMode === "seo" ? handleCopyAllSeo : handleCopyAllLyrics}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs">
                  <Copy className="w-3 h-3 text-purple-400" />
                  <span>{texts.COPY_ALL_BTN}</span>
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Disc3 className="w-7 h-7 text-purple-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-200">
                  {texts.BLOCK_LYRICS_LOADING}
                </p>
                <p className="text-xs text-slate-400">
                  {texts.HEADER_BADGE} • {outputCount} {texts.SONG_UNIT}
                </p>
              </div>
            </div>
          ) : _.isEmpty(songs) ? (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-inner">
                <Music2 className="w-7 h-7 text-purple-400/80" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-extrabold text-slate-200">
                  {texts.BLOCK_LYRICS_EMPTY_TITLE}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {texts.BLOCK_LYRICS_EMPTY_DESC}
                </p>
              </div>
              <Button
                type="button"
                variant="unstyled"
                onClick={handleTrySampleTemplate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{texts.TRY_SAMPLE_BTN}</span>
              </Button>
            </div>
          ) : (
            <div>
              {viewMode === "lyrics" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(songs, (song, idx) => (
                    <SongCard key={song.songId || idx} song={song} index={idx} texts={texts} />
                  ))}
                </div>
              )}

              {viewMode === "seo" && (
                <PlaylistSeoCard seoOptions={playlistSeoOptions} texts={texts} />
              )}

              {viewMode === "split" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    {_.map(songs, (song, idx) => {
                      const isSelected = selectedSeoSongIndex === idx;
                      return (
                        <Button
                          key={idx}
                          type="button"
                          variant="unstyled"
                          onClick={() => setSelectedSeoSongIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 inline-flex items-center gap-1.5 group select-none shadow-2xs",
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 !text-white border-indigo-400 shadow-sm shadow-indigo-600/20"
                              : "bg-white/80 dark:bg-slate-955/90 border-slate-200/90 dark:border-slate-800 !text-[#1e293b] hover:!text-[#4338ca] dark:!text-slate-300 dark:hover:!text-white hover:border-indigo-400/60 dark:hover:border-indigo-500/40 hover:bg-indigo-50/70 dark:hover:bg-slate-900/90",
                          )}>
                          <span
                            className={cn(
                              "font-mono font-black",
                              isSelected
                                ? "!text-indigo-100"
                                : "!text-indigo-600 group-hover:!text-indigo-800 dark:!text-indigo-400 dark:group-hover:!text-indigo-300",
                            )}>
                            #{idx + 1}
                          </span>
                          <span>{_.truncate(toSentenceCase(song.title), { length: 18 })}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {songs[selectedSeoSongIndex] && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                      <SongCard
                        song={songs[selectedSeoSongIndex]}
                        index={selectedSeoSongIndex}
                        texts={texts}
                      />
                      <PlaylistSeoCard seoOptions={playlistSeoOptions} texts={texts} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(styleToDelete)}
        onClose={() => setStyleToDelete(null)}
        maxWidth="max-w-md"
        title={
          <span className="inline-flex items-center gap-2 leading-none text-slate-900 dark:text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0 self-center -translate-y-[1px]" />
            <span className="leading-none text-sm font-extrabold">{texts.STYLE_DELETE_BTN}</span>
          </span>
        }>
        <div className="space-y-4 text-left">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentLang === "vi" ? "Xác nhận xóa mẫu" : "Confirm delete"}{" "}
            <span className="font-extrabold !text-[#1e1b4b] dark:!text-white">“{styleToDelete?.title}”</span>?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{currentLang === "vi" ? "Không thể hoàn tác." : "Cannot be undone."}</span>
          </div>
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStyleToDelete(null)}
              className="h-9 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs">
              {currentLang === "vi" ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmDeleteStyle}
              className="h-9 px-5 rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 active:scale-95 transition-all">
              {texts.STYLE_DELETE_BTN}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
