import React, { useEffect, useRef, useState, useMemo } from "react";
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
} from "lucide-react";
import _ from "lodash";
import { toast } from "sonner";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Tooltip } from "./ui/Tooltip";
import { Modal } from "./ui/Modal";
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
  stylePrompt: string;
  lyrics: string;
  genre: string;
  mood: string;
  tempoBpm: number;
  structure: string[];
  originalityNotes: string[];
  seoOptions: SongSeoOption[];
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
        <button
          type="button"
          onClick={onToggleAiConfig}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs",
            isAiConfigOpen
              ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-purple-500/10"
              : "bg-slate-955/90 border-slate-800 text-slate-400 hover:border-purple-500/40 hover:text-slate-200",
          )}>
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
          <span>{texts.AI_CONFIG_TITLE}</span>
          {isAiConfigOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </Tooltip>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* SONG CARD COMPONENT (LYRICS & SUNO PROMPT)                                 */
/* -------------------------------------------------------------------------- */
interface SongCardProps {
  song: GeneratedSong;
  index: number;
  texts: MusicCreatorTexts;
}

const SongCard: React.FC<SongCardProps> = ({ song, index, texts }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-3.5 hover:border-purple-500/40 transition-all text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm shadow-purple-600/30">
            #{index + 1}
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-100 truncate max-w-[220px] sm:max-w-md" title={song.title}>
            {song.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {song.genre && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300">
              {song.genre}
            </span>
          )}
          {song.tempoBpm > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {song.tempoBpm} BPM
            </span>
          )}
          {song.mood && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              {song.mood}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-purple-400 uppercase tracking-wider font-bold">
            <Sparkles className="w-3 h-3" />
            {texts.PROMPT_LABEL}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(song.stylePrompt, `prompt-${index}`, texts.COPY_PROMPT_SUCCESS)}
            className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-bold cursor-pointer">
            {copiedKey === `prompt-${index}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedKey === `prompt-${index}` ? texts.COPIED_LABEL : texts.COPY_PROMPT_BTN}</span>
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-955/90 border border-slate-800/90 text-xs font-mono text-purple-200 select-all leading-relaxed break-words shadow-inner">
          {song.stylePrompt}
        </div>
      </div>

      {song.lyrics && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-pink-400 uppercase tracking-wider font-bold">
              <FileText className="w-3 h-3" />
              {texts.LYRICS_TITLE}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(song.lyrics, `lyrics-${index}`, texts.COPY_LYRICS_SUCCESS)}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-bold transition-colors">
              {copiedKey === `lyrics-${index}` ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === `lyrics-${index}` ? texts.COPIED_LABEL : texts.COPY_LYRICS_BTN}</span>
            </button>
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
/* SONG SEO CARD COMPONENT                                                    */
/* -------------------------------------------------------------------------- */
interface SongSeoCardProps {
  song: GeneratedSong;
  songIndex: number;
  texts: MusicCreatorTexts;
}

const SongSeoCard: React.FC<SongSeoCardProps> = ({ song, songIndex, texts }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, successMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(successMsg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyOption = (opt: SongSeoOption, optIndex: number) => {
    const formatted = `[${texts.STYLE_MODAL_FIELD_TITLE}]: ${opt.title}\n[Mô tả]: ${opt.description}\n[Hashtags]: ${opt.hashtags.join(" ")}\n[Tags]: ${opt.tags.join(", ")}`;
    handleCopy(formatted, `opt-${songIndex}-${optIndex}`, texts.COPY_SEO_OPTION_SUCCESS);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 shadow-lg space-y-3.5 hover:border-fuchsia-500/40 transition-all text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white font-mono text-xs font-black flex items-center justify-center shrink-0 shadow-sm shadow-fuchsia-600/30">
            #{songIndex + 1}
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-100 truncate max-w-[220px] sm:max-w-md" title={song.title}>
            {song.title}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2 py-0.5 rounded-lg">
          {texts.SEO_OPTIONS_COUNT_BADGE}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {_.map(song.seoOptions, (opt, sIdx) => {
          const key = `opt-${songIndex}-${sIdx}`;
          const isCopied = copiedKey === key;
          return (
            <div
              key={sIdx}
              className="p-3 rounded-xl bg-slate-955/90 border border-slate-800/80 space-y-2 transition-all hover:border-slate-700 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300">
                    {texts.formatOptionLabel(sIdx + 1)}
                  </span>
                  <span className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded shadow-xs">
                    {texts.formatScoreLabel(opt.seoScore)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyOption(opt, sIdx)}
                  className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-bold cursor-pointer shrink-0 transition-colors">
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? texts.COPIED_LABEL : texts.COPY_SEO_OPTION_BTN}</span>
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug line-clamp-2" title={opt.title}>
                  {opt.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2" title={opt.description}>
                  {opt.description}
                </p>
              </div>

              {opt.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/70">
                  {_.map(opt.hashtags, (tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[9px] text-purple-300 font-mono bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
          viewMode,
          selectedSeoSongIndex,
        } satisfies PersistedMusicCreatorState),
      );
    }, 250);
    return () => window.clearTimeout(saveTimer);
  }, [style, outputCount, referenceSongs, provider, model, executionMode, chromeHeadless, isAiConfigOpen, songs, viewMode, selectedSeoSongIndex]);

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
        `=== ${texts.SONG_UNIT.toUpperCase()} ${i + 1}: ${s.title} ===\n[${texts.PROMPT_LABEL}]: ${s.stylePrompt}\n\n[${texts.LYRICS_TITLE}]:\n${s.lyrics}\n`,
    ).join("\n----------------------------------------\n\n");
    navigator.clipboard.writeText(allContent);
    toast.success(texts.COPY_ALL_SUCCESS);
  };

  const handleCopyAllSeo = () => {
    if (_.isEmpty(songs)) return;
    const allContent = _.map(songs, (s, i) => {
      const seoBlocks = _.map(
        s.seoOptions,
        (opt, idx) =>
          `  [${texts.formatOptionLabel(idx + 1)}] (${texts.formatScoreLabel(opt.seoScore)}):\n  ${texts.STYLE_MODAL_FIELD_TITLE}: ${opt.title}\n  Mô tả: ${opt.description}\n  Hashtags: ${opt.hashtags.join(" ")}\n`,
      ).join("\n");
      return `=== ${texts.SONG_UNIT.toUpperCase()} ${i + 1}: ${s.title} ===\n${seoBlocks}`;
    }).join("\n----------------------------------------\n\n");
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
      setSongs(generatedSongs);
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
                    <button
                      type="button"
                      onClick={handleSaveStyle}
                      disabled={isLoading}
                      className="h-8 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all shadow-xs [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white">
                      <Save className="w-3 h-3" />
                      <span>{editingStyleIndex === null ? texts.STYLE_SAVE_CURRENT_BTN : texts.STYLE_UPDATE_BTN}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelStyleEdit}
                      disabled={isLoading}
                      className="h-8 px-2.5 rounded-lg border border-slate-300 hover:border-rose-500/50 bg-transparent hover:bg-rose-500/10 dark:border-slate-700/80 !text-[#475569] hover:!text-rose-600 dark:!text-slate-400 dark:hover:!text-rose-400 text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-center">
                      {currentLang === "vi" ? "Hủy" : "Cancel"}
                    </button>
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
                          <button
                            type="button"
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
                          </button>
                        </Tooltip>

                        <div className="flex items-center gap-1 ml-1.5 shrink-0 self-center">
                          <Tooltip content={texts.STYLE_UPDATE_BTN} align="center" className="w-5.5 h-5.5 min-w-5.5 min-h-5.5 max-w-5.5 max-h-5.5 shrink-0 self-center p-0 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStyle(styleIndex);
                              }}
                              disabled={isLoading}
                              title={texts.STYLE_UPDATE_BTN}
                              style={{
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                minHeight: 22,
                                maxWidth: 22,
                                maxHeight: 22,
                                borderRadius: 5,
                                padding: 0,
                                margin: 0,
                                boxSizing: "border-box",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                backgroundColor: "rgba(168, 85, 247, 0.15)",
                                border: "1px solid rgba(168, 85, 247, 0.4)",
                                color: "#7e22ce",
                              }}
                              className="!w-[22px] !h-[22px] !min-w-[22px] !min-h-[22px] !max-w-[22px] !max-h-[22px] !p-0 aspect-square flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0">
                              <Pencil style={{ width: 11, height: 11 }} />
                            </button>
                          </Tooltip>

                          <Tooltip content={texts.STYLE_DELETE_BTN} align="center" className="w-5.5 h-5.5 min-w-5.5 min-h-5.5 max-w-5.5 max-h-5.5 shrink-0 self-center p-0 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStyleToDelete(savedStyle);
                              }}
                              disabled={isLoading}
                              title={texts.STYLE_DELETE_BTN}
                              style={{
                                width: 22,
                                height: 22,
                                minWidth: 22,
                                minHeight: 22,
                                maxWidth: 22,
                                maxHeight: 22,
                                borderRadius: 5,
                                padding: 0,
                                margin: 0,
                                boxSizing: "border-box",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                backgroundColor: "rgba(244, 63, 94, 0.15)",
                                border: "1px solid rgba(244, 63, 94, 0.4)",
                                color: "#e11d48",
                              }}
                              className="!w-[22px] !h-[22px] !min-w-[22px] !min-h-[22px] !max-w-[22px] !max-h-[22px] !p-0 aspect-square flex items-center justify-center cursor-pointer transition-all shadow-2xs shrink-0">
                              <Trash2 style={{ width: 11, height: 11 }} />
                            </button>
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

                <button
                  type="button"
                  onClick={handleFillSampleReferences}
                  disabled={isLoading}
                  className="text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 shadow-xs !text-[#6b21a8] hover:!text-white dark:!text-purple-300 dark:hover:!text-white [&>svg]:text-[#6b21a8] dark:[&>svg]:text-purple-300 hover:[&>svg]:!text-white dark:hover:[&>svg]:!text-white">
                  <Sparkles className="w-3 h-3" />
                  <span>{texts.QUICK_FILL_LABEL}</span>
                </button>
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
                      <button
                        key={count}
                        type="button"
                        onClick={() => setOutputCount(count)}
                        disabled={isLoading}
                        className={cn(
                          "relative h-9 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs",
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]"
                            : "bg-slate-955/90 border-slate-800 text-slate-300 hover:border-purple-500/40 hover:text-white",
                        )}>
                        <span>{texts.formatSongCount(count)}</span>
                        {isRecommended && !isSelected && (
                          <span className="absolute -top-1 px-1 rounded text-[7px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {texts.RECOMMENDED_BADGE}
                          </span>
                        )}
                      </button>
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
                  <button
                    type="button"
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
                  </button>

                  {isLoading && (
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      className="h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 shrink-0">
                      <X className="w-4 h-4 shrink-0" />
                      <span>{currentLang === "vi" ? "Dừng" : "Stop"}</span>
                    </button>
                  )}
                </div>

                {!isLoading && _.isEmpty(songs) && (
                  <button
                    type="button"
                    onClick={handleTrySampleTemplate}
                    className="w-full py-2 text-center text-xs font-bold text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 hover:underline cursor-pointer transition-colors flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{texts.TRY_SAMPLE_BTN}</span>
                  </button>
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
                  <button
                    type="button"
                    onClick={() => setViewMode("lyrics")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      viewMode === "lyrics"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200",
                    )}>
                    <Music2 className="w-3 h-3" />
                    <span>{texts.TAB_LYRICS}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("seo")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      viewMode === "seo"
                        ? "bg-fuchsia-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200",
                    )}>
                    <Search className="w-3 h-3" />
                    <span>{texts.TAB_SEO}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("split")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      viewMode === "split"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200",
                    )}>
                    <Columns className="w-3 h-3" />
                    <span>{texts.TAB_SPLIT}</span>
                  </button>
                </div>
              )}

              {!_.isEmpty(songs) && (
                <button
                  type="button"
                  onClick={viewMode === "seo" ? handleCopyAllSeo : handleCopyAllLyrics}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs">
                  <Copy className="w-3 h-3 text-purple-400" />
                  <span>{texts.COPY_ALL_BTN}</span>
                </button>
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
              <button
                type="button"
                onClick={handleTrySampleTemplate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{texts.TRY_SAMPLE_BTN}</span>
              </button>
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
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    {_.map(songs, (song, idx) => {
                      const isSelected = selectedSeoSongIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSeoSongIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                            isSelected
                              ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-sm"
                              : "bg-slate-955/90 border-slate-800 text-slate-300 hover:border-fuchsia-500/40 hover:text-white",
                          )}>
                          #{idx + 1}: {_.truncate(song.title, { length: 18 })}
                        </button>
                      );
                    })}
                  </div>

                  {songs[selectedSeoSongIndex] && (
                    <SongSeoCard
                      song={songs[selectedSeoSongIndex]}
                      songIndex={selectedSeoSongIndex}
                      texts={texts}
                    />
                  )}
                </div>
              )}

              {viewMode === "split" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    {_.map(songs, (song, idx) => {
                      const isSelected = selectedSeoSongIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSeoSongIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-sm"
                              : "bg-slate-955/90 border-slate-800 text-slate-300 hover:border-indigo-500/40 hover:text-white",
                          )}>
                          #{idx + 1}: {_.truncate(song.title, { length: 18 })}
                        </button>
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
                      <SongSeoCard
                        song={songs[selectedSeoSongIndex]}
                        songIndex={selectedSeoSongIndex}
                        texts={texts}
                      />
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
          <div className="flex items-center gap-2 uppercase tracking-wider font-extrabold text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>{texts.STYLE_DELETE_BTN}</span>
          </div>
        }>
        <div className="space-y-4 bg-slate-900 text-slate-100">
          <p className="text-xs text-slate-300">
            {currentLang === "vi" ? "Xác nhận xóa mẫu" : "Confirm delete"}{" "}
            <span className="font-bold text-white">“{styleToDelete?.title}”</span>?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs font-bold">
            {currentLang === "vi" ? "Không thể hoàn tác." : "Cannot be undone."}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStyleToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer">
              {currentLang === "vi" ? "Hủy" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={confirmDeleteStyle}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
              {texts.STYLE_DELETE_BTN}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
