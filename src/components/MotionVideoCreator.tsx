import { stringifyJson } from "../lib/jsonStringify.js";
import _ from "lodash";
import { AlertTriangle, BookOpen, Box, Check, ChevronDown, ChevronUp, Clapperboard, Clock, Download, FileText, Film, FolderKanban, Image as ImageIcon, Layers, Loader2, Mic, Monitor, PlayCircle, RefreshCw, ScanSearch, SlidersHorizontal, Smartphone, Sparkles, Square, Trash2, Tv, Upload, Users, Wand2 } from "lucide-react";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { API_ROUTES } from "../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_ART_BADGE,
  MOTION_TEMPLATE_ART_TOOLTIP,
  MOTION_TEMPLATE_BEATS,
  MOTION_TEMPLATE_GEMINI_MODEL,
  MOTION_TEMPLATE_JOIN_SPACE,
  MOTION_TEMPLATE_JUNK_GROUP_KEY,
  MOTION_TEMPLATE_JUNK_MORE,
  MOTION_TEMPLATE_SHOT_TOOLTIP_LINE,
  MOTION_TEMPLATE_SYMBOL,
  MOTION_TEMPLATE_SYMBOL_2,
  MOTION_TEMPLATE_SYMBOL_3,
  MOTION_TEMPLATE_SYMBOL_6,
  MOTION_TEMPLATE_SYMBOL_7,
  MOTION_TEMPLATE_S_2,
  MOTION_TEXT_0,
  MOTION_TEXT_01,
  MOTION_TEXT_02,
  MOTION_TEXT_03,
  MOTION_TEXT_04,
  MOTION_TEXT_05,
  MOTION_TEXT_16_9,
  MOTION_TEXT_1_1,
  MOTION_TEXT_2D,
  MOTION_TEXT_3D,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_AI_2,
  MOTION_TEXT_AI_VOICE,
  MOTION_TEXT_ANALYZE,
  MOTION_TEXT_ART,
  MOTION_TEXT_ART_FAILED_MARK,
  MOTION_TEXT_ASSETS_MOTION_VIDEO_AUDIO,
  MOTION_TEXT_AUDIO,
  MOTION_TEXT_BG_GRADIENT_TO_R_FROM_AMBER_500_VIA,
  MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT,
  MOTION_TEXT_BG_SLATE_100_DARK_BG_SLATE_800_80,
  MOTION_TEXT_BUTTON,
  MOTION_TEXT_BYTES,
  MOTION_TEXT_CAST,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CHAPTERS,
  MOTION_TEXT_CHECKBOX,
  MOTION_TEXT_DA_DOC_NGUON,
  MOTION_TEXT_DOAN,
  MOTION_TEXT_EN,
  MOTION_TEXT_END,
  MOTION_TEXT_ENTITIES_CAST,
  MOTION_TEXT_FACTS,
  MOTION_TEXT_FILE,
  MOTION_TEXT_FPS,
  MOTION_TEXT_FPS_2,
  MOTION_TEXT_GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P,
  MOTION_TEXT_GROUP,
  MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC,
  MOTION_TEXT_LAZY,
  MOTION_TEXT_LIVE_2_5D_CANVAS,
  MOTION_TEXT_MAX_W_MD,
  MOTION_TEXT_METADATA,
  MOTION_TEXT_MODAL_2XL,
  MOTION_TEXT_MOTION_VIDEO,
  MOTION_TEXT_MOTION_VIDEO_MP4,
  MOTION_TEXT_NHAP_NOI_DUNG_LOI_DAN_CHO_PHAN_CANH,
  MOTION_TEXT_OK,
  MOTION_TEXT_OUTPUT_MP4,
  MOTION_TEXT_PHUT,
  MOTION_TEXT_PRIMARY,
  MOTION_TEXT_RANGE,
  MOTION_TEXT_REAL,
  MOTION_TEXT_RENDER,
  MOTION_TEXT_RENDER_VIDEO_MP4,
  MOTION_TEXT_S,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SCENE_2,
  MOTION_TEXT_SCRIPT,
  MOTION_TEXT_STATS,
  MOTION_TEXT_STATS_2,
  MOTION_TEXT_STOPPING,
  MOTION_TEXT_SYMBOL,
  MOTION_TEXT_SYMBOL_10,
  MOTION_TEXT_SYMBOL_11,
  MOTION_TEXT_SYMBOL_12,
  MOTION_TEXT_SYMBOL_2,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_3,
  MOTION_TEXT_SYMBOL_4,
  MOTION_TEXT_SYMBOL_43,
  MOTION_TEXT_SYMBOL_44,
  MOTION_TEXT_SYMBOL_45,
  MOTION_TEXT_SYMBOL_46,
  MOTION_TEXT_SYMBOL_5,
  MOTION_TEXT_SYMBOL_6,
  MOTION_TEXT_SYMBOL_7,
  MOTION_TEXT_SYMBOL_8,
  MOTION_TEXT_SYMBOL_9,
  MOTION_TEXT_S_2,
  MOTION_TEXT_TIEN_TRINH,
  MOTION_TEXT_TIEU_DE_CAU_CHUYEN,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TITLE_2,
  MOTION_TEXT_TOON,
  MOTION_TEXT_TOON_FLAT,
  MOTION_TEXT_TOON_LINE,
  MOTION_TEXT_TRANSCRIPT,
  MOTION_TEXT_TU,
  MOTION_TEXT_UNSTYLED,
  MOTION_TEXT_VI,
  MOTION_TEXT_VOICE,
  MOTION_TEXT_WRONG,
  MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL,
  MOTION_TEXT_XOA,
} from "../constants/motionRuntime.js";
import { MOTION_VIDEO_TEXTS, type MotionVideoTexts } from "../constants/motionVideoTexts.js";
import { useMotionStudio, type MotionStudio } from "../hooks/useMotionStudio.js";
import { Lang } from "../lib/lang.js";
import { cn } from "../lib/utils";
import { GeminiChatModelName, ImageGeneratorEngine } from "../types.js";
import { MotionAspect, MotionEncoderPreference, MotionQuality, MotionStoryLength, MotionWorkspaceTab, type MotionBeat, type MotionCharacterDef, type MotionResultItem } from "../types/motionVideo.js";
import type { StorageJunkReport } from "../types/storage.js";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock.js";
import { formatBytes, formatSeconds, motionRequest } from "./motion-video/motionApi";
import { MotionLibraryPanel } from "./motion-video/MotionLibraryPanel";
import { MotionLazyThumb } from "./motion-video/MotionLivePreview";
import { realFileUrl } from "./motion-video/motionReal";
import { MotionRealAssetsPanel } from "./motion-video/MotionRealAssetsPanel";
import { MotionSpecPlayer } from "./motion-video/MotionSpecPlayer";
import { characterThumb } from "./motion-video/motionThumbs";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Tooltip } from "./ui/Tooltip";
import { VoiceSelectionDialog } from "./VoiceSelectionDialog.js";
const AUDIO_URL = (id?: string) => (id ? `${MOTION_VIDEO_AUDIO_PREFIX}${encodeURIComponent(id)}` : undefined);
const MOTION_VIDEO_AUDIO_PREFIX = MOTION_TEXT_ASSETS_MOTION_VIDEO_AUDIO;
const cardCls = MOTION_TEXT_GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P;
const inputCls = MOTION_TEXT_W_FULL_PX_3_PY_2_ROUNDED_XL;
const StepHeader: FC<{
  n: string;
  icon: typeof Film;
  title: string;
  badge?: string;
  right?: React.ReactNode;
}> = ({ n, icon: Icon, title, badge, right }) => (
  <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-600 p-0.5 shadow-xs shadow-purple-500/20 shrink-0">
        <div className="w-full h-full bg-slate-955 rounded-[6px] flex items-center justify-center">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-5 h-5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-[10px] shadow-2xs">{n}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5">{title}</h2>
        {badge && <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-mono font-bold tracking-normal">{badge}</span>}
      </div>
    </div>
    {right && <div className="flex items-center gap-2">{right}</div>}
  </div>
);
const ChipButton: FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ active, onClick, children, disabled, className }) => (
  <button
    type={MOTION_TEXT_BUTTON}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer select-none shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed",
      active ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.01]" : "border-slate-800 bg-slate-955/80 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900",
      className,
    )}>
    {children}
  </button>
);
const ActionBtn: FC<{
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  icon: typeof Film;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}> = ({ onClick, disabled, busy, icon: Icon, children, className, variant = MOTION_TEXT_PRIMARY }) => {
  const styles = {
    primary: MOTION_TEXT_BG_GRADIENT_TO_R_FROM_AMBER_500_VIA,
    secondary: MOTION_TEXT_BG_SLATE_100_DARK_BG_SLATE_800_80,
    danger: MOTION_TEXT_BG_ROSE_600_HOVER_BG_ROSE_500_TEXT,
  };
  return (
    <button type={MOTION_TEXT_BUTTON} onClick={onClick} disabled={disabled || busy} className={cn("inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", styles[variant], className)}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
};
const StopBtn: FC<{
  onClick: () => void;
  label: string;
  stopping?: boolean;
  className?: string;
}> = ({ onClick, label, stopping, className }) => (
  <button type={MOTION_TEXT_BUTTON} onClick={onClick} disabled={stopping} className={cn("inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-60", className)}>
    {stopping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
    <span>{label}</span>
  </button>
);
const ElapsedLine: FC<{ since: number; label: string; suffix: string }> = ({ since, label, suffix }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-purple-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span>
        {label}
        {MOTION_TEXT_SYMBOL}
      </span>
      <span className="font-mono text-slate-400">
        {suffix} {formatSeconds((now - since) / 1000)}
      </span>
    </div>
  );
};
const MotionVideoCreator: FC<{ currentLang?: Lang }> = ({ currentLang = MOTION_TEXT_VI as Lang }) => {
  const text = (MOTION_VIDEO_TEXTS as any)[currentLang] || MOTION_VIDEO_TEXTS.vi;
  const studio = useMotionStudio();
  const [tab, setTab] = useState<MotionWorkspaceTab>(MotionWorkspaceTab.CREATE);
  const [aiOpen, setAiOpen] = useState(false);
  const { state, patch } = studio;
  return (
    <div className="creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar">
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80">
        <div className="glass-card rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-sm shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400">
                <Clapperboard className="w-4 h-4" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-slate-100 tracking-tight uppercase font-sans">{text.TITLE}</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  {text.BADGE}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight truncate hidden md:block">{text.SUBTITLE}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto ml-auto">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-955/80 border border-slate-800">
              {_.map(
                [
                  { id: MotionWorkspaceTab.CREATE, label: text.TAB_CREATE, icon: Wand2 },
                  { id: MotionWorkspaceTab.LIBRARY, label: text.TAB_LIBRARY, icon: Users },
                  { id: MotionWorkspaceTab.REAL, label: text.TAB_REAL, icon: Box },
                  { id: MotionWorkspaceTab.RESULTS, label: MOTION_TEMPLATE_SYMBOL(`${text.TAB_RESULTS}`, `${studio.results.length}`), icon: FolderKanban },
                ],
                ({ id, label, icon: Icon }) => (
                  <button key={id} type={MOTION_TEXT_BUTTON} onClick={() => setTab(id)} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", tab === id ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm shadow-purple-500/20" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900")}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
            <Tooltip content={text.AI_CONFIG_TOOLTIP || text.AI_CONFIG} align={MOTION_TEXT_END}>
              <Button
                variant={MOTION_TEXT_UNSTYLED}
                type={MOTION_TEXT_BUTTON}
                onClick={() => setAiOpen(!aiOpen)}
                disabled={studio.storyBusy}
                className={cn("group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none select-none", aiOpen ? "bg-purple-600/15 border-purple-500/50 text-purple-300 shadow-purple-500/10" : "bg-slate-955/80 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-purple-300")}>
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:scale-105 transition-transform" />
                <span className="inline-flex items-center leading-none text-slate-200 group-hover:text-purple-300 transition-colors">{text.AI_CONFIG}</span>
                {aiOpen ? <ChevronUp className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              </Button>
            </Tooltip>
          </div>
        </div>
        {aiOpen && (
          <fieldset disabled={studio.storyBusy} className="glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800 shadow-xl text-left animate-in fade-in duration-200">
            <ChatPlanningSettingsBlock provider={state.aiProvider} model={state.aiModel} executionMode={state.aiMode} chromeHeadless={state.aiHeadless} onProviderChange={(v) => patch({ aiProvider: v })} onModelChange={(v) => patch({ aiModel: v })} onExecutionModeChange={(v) => patch({ aiMode: v })} onChromeHeadlessChange={(v) => patch({ aiHeadless: v })} currentLang={currentLang} allowHybrid />
          </fieldset>
        )}
        {studio.engineError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{studio.engineError}</span>
          </div>
        )}
        <div className="w-full">
          {tab === MotionWorkspaceTab.CREATE && <CreateWorkspace studio={studio} text={text} currentLang={currentLang} />}
          {tab === MotionWorkspaceTab.LIBRARY &&
            (studio.ME && studio.catalog ? (
              <MotionLibraryPanel ME={studio.ME} catalog={studio.catalog} custom={studio.custom} onCustomChange={studio.updateCustom} text={text} toonStyle={state.toonStyle} onToonStyle={(v) => patch({ toonStyle: v as typeof state.toonStyle })} />
            ) : (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ))}
          {tab === MotionWorkspaceTab.REAL &&
            (studio.ME && studio.catalog ? (
              <MotionRealAssetsPanel ME={studio.ME} catalog={studio.catalog} custom={studio.custom} envInfo={studio.envInfo} text={text} onCustomChange={() => void studio.reloadCustom()} />
            ) : (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ))}
          {tab === MotionWorkspaceTab.RESULTS && <ResultsPanel studio={studio} text={text} />}
        </div>
      </div>
    </div>
  );
};
export default MotionVideoCreator;
const CreateWorkspace: FC<{ studio: MotionStudio; text: MotionVideoTexts; currentLang: Lang }> = ({ studio, text, currentLang }) => {
  const { state, patch } = studio;
  const [voiceDialog, setVoiceDialog] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<"cast" | "chapters" | "facts">(MOTION_TEXT_CAST);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const busyKind = studio.storyBusy ? studio.storyJob?.kind : null;
  const storyStopping = studio.storyJob?.stage === MOTION_TEXT_STOPPING;
  const renderStopping = studio.renderJob?.stage === MOTION_TEXT_STOPPING;
  const stopAi = <StopBtn onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />;
  const beatsByChapter = useMemo(() => _.groupBy(state.script?.beats || [], MOTION_TEXT_CHAPTERID), [state.script]);
  const artItems = useMemo(
    () =>
      _.flatMap(state.script?.beats || [], (b) => {
        const shots = _.take(
          _.filter(b.shots || [], (sh) => !!sh?.visual),
          4,
        );
        if (shots.length >= 2) return _.compact(_.map(shots, (sh, k) => (sh.art ? { ...sh.art, id: MOTION_TEMPLATE_S_2(`${b.id}`, `${k + 1}`), words: sh.text } : null)));
        const art = shots.length === 1 ? shots[0].art : b.art;
        return art ? [{ ...art, id: b.id, words: b.narration }] : [];
      }),
    [state.script],
  );
  const estimateTotal = studio.compiled?.spec.duration || 0;
  const updateBeat = (id: string, patchBeat: Partial<MotionBeat>) => {
    if (!state.script) return;
    patch({ script: { ...state.script, beats: _.map(state.script.beats, (b) => (b.id === id ? { ...b, ...patchBeat } : b)) } });
  };
  const removeBeat = (id: string) => state.script && patch({ script: { ...state.script, beats: _.reject(state.script.beats, { id }) } });
  const setCast = (key: string, characterId: string) => state.analysis && patch({ analysis: { ...state.analysis, cast: _.map(state.analysis.cast, (c) => (c.key === key ? { ...c, characterId } : c)) } });
  const saveSuggested = async (key: string) => {
    const member = _.find(state.analysis?.cast, { key });
    if (!member?.suggested) return;
    try {
      const res = await motionRequest<{ item: MotionCharacterDef }>(API_ROUTES.MOTION_VIDEO_LIBRARY, {
        item: { ...member.suggested, name: member.name, tags: _.compact([member.role]) },
      });
      studio.updateCustom([res.item, ...studio.custom]);
      setCast(key, res.item.id);
      toast.success(text.DONE);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  const allCharacters = useMemo(() => [...studio.custom, ...(studio.catalog?.characters || [])], [studio.custom, studio.catalog]);
  const job = studio.storyJob;
  const rj = studio.renderJob;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
      <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
        <div className={cardCls}>
          <StepHeader
            n={MOTION_TEXT_01}
            icon={BookOpen}
            title={text.STEP_SOURCE}
            badge={MOTION_TEXT_TRANSCRIPT}
            right={
              <div className="flex items-center gap-2">
                <button type={MOTION_TEXT_BUTTON} onClick={() => void studio.loadDemo()} disabled={studio.storyBusy} className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-colors cursor-pointer disabled:opacity-40">
                  {text.LOAD_DEMO}
                </button>
                {state.rawText && (
                  <button type={MOTION_TEXT_BUTTON} onClick={() => studio.parseSource("")} disabled={studio.storyBusy} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            }
          />
          <div className="space-y-3">
            <textarea value={state.rawText} onChange={(e) => void studio.parseSource(e.target.value)} placeholder={text.SOURCE_PLACEHOLDER} rows={8} className={cn(inputCls, "font-mono text-xs leading-relaxed resize-y min-h-[170px]")} disabled={studio.storyBusy} />
            {state.source ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-200">
                <div className="bg-slate-955/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{text.WORDS}</div>
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {state.source.words}
                      {MOTION_TEXT_TU}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-955/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{text.SEGMENTS}</div>
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {state.source.segments.length}
                      {MOTION_TEXT_DOAN}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-955/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{text.ESTIMATED}</div>
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {MOTION_TEXT_SYMBOL_2}
                      {Math.round(state.source.sourceSeconds / 60)}
                      {MOTION_TEXT_PHUT}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-955/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
                  <Film className="w-4 h-4 text-pink-500 dark:text-pink-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{MOTION_TEXT_TIEN_TRINH}</div>
                    <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 truncate">{MOTION_TEXT_DA_DOC_NGUON}</div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{text.LANGUAGE}</label>
                <div className="flex gap-2">
                  <ChipButton active={state.language === MOTION_TEXT_VI} onClick={() => patch({ language: MOTION_TEXT_VI })}>
                    {MOTION_TEXT_SYMBOL_3}
                    {text.LANG_VI}
                  </ChipButton>
                  <ChipButton active={state.language === MOTION_TEXT_EN} onClick={() => patch({ language: MOTION_TEXT_EN })}>
                    {MOTION_TEXT_SYMBOL_4}
                    {text.LANG_EN}
                  </ChipButton>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{text.LENGTH}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {_.map(
                    [
                      [MotionStoryLength.FULL, text.LENGTH_FULL],
                      [MotionStoryLength.TEN, text.LENGTH_10],
                      [MotionStoryLength.FIVE, text.LENGTH_5],
                      [MotionStoryLength.SHORT, text.LENGTH_SHORT],
                      [MotionStoryLength.ONE, text.LENGTH_1],
                    ],
                    ([id, label]) => (
                      <ChipButton key={id} active={state.length === id} onClick={() => patch({ length: id as MotionStoryLength })}>
                        {label}
                      </ChipButton>
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input type={MOTION_TEXT_CHECKBOX} checked={state.autoContinue !== false} onChange={(e) => patch({ autoContinue: e.target.checked })} className="accent-purple-500 w-4 h-4 rounded" />
                <span>{text.AUTO_CONTINUE}</span>
              </label>
              {busyKind === MOTION_TEXT_ANALYZE ? (
                stopAi
              ) : (
                <ActionBtn icon={Sparkles} onClick={() => void studio.analyze()} disabled={!state.source || studio.storyBusy} className="px-5 py-2.5">
                  {state.analysis ? text.REANALYZE_BTN : text.ANALYZE_BTN}
                </ActionBtn>
              )}
            </div>
          </div>
        </div>
        {state.analysis && (
          <div className={cardCls}>
            <StepHeader
              n={MOTION_TEXT_02}
              icon={Users}
              title={text.STEP_ANALYSIS}
              badge={MOTION_TEXT_ENTITIES_CAST}
              right={
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-955/80 border border-slate-800 shadow-2xs">
                  <button type={MOTION_TEXT_BUTTON} onClick={() => setAnalysisTab(MOTION_TEXT_CAST)} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", analysisTab === MOTION_TEXT_CAST ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60")}>
                    {MOTION_TEXT_SYMBOL_5}
                    {text.CAST}
                    {MOTION_TEXT_SYMBOL_6}
                    {state.analysis.cast.length}
                    {MOTION_TEXT_SYMBOL_7}
                  </button>
                  <button type={MOTION_TEXT_BUTTON} onClick={() => setAnalysisTab(MOTION_TEXT_CHAPTERS)} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", analysisTab === MOTION_TEXT_CHAPTERS ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60")}>
                    {MOTION_TEXT_SYMBOL_8}
                    {text.CHAPTERS}
                    {MOTION_TEXT_SYMBOL_6}
                    {state.analysis.chapters.length}
                    {MOTION_TEXT_SYMBOL_7}
                  </button>
                  {!_.isEmpty(state.analysis.facts) && (
                    <button type={MOTION_TEXT_BUTTON} onClick={() => setAnalysisTab(MOTION_TEXT_FACTS)} className={cn("px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", analysisTab === MOTION_TEXT_FACTS ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60")}>
                      {MOTION_TEXT_SYMBOL_9}
                      {text.FACTS}
                    </button>
                  )}
                </div>
              }
            />
            <div className="space-y-3">
              <input value={state.analysis.title} onChange={(e) => patch({ analysis: { ...state.analysis!, title: e.target.value } })} placeholder={MOTION_TEXT_TIEU_DE_CAU_CHUYEN} className={cn(inputCls, "text-sm font-bold")} />
              {analysisTab === MOTION_TEXT_CAST && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(state.analysis.cast, (c) => {
                    const ch = _.find(allCharacters, { id: c.characterId });
                    return (
                      <div key={c.key} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-955/70 p-3 shadow-2xs">
                        {studio.ME && ch ? (
                          <MotionLazyThumb load={() => characterThumb(studio.ME!, ch)} deps={[ch]} alt={c.name} className="w-12 h-16 rounded-xl bg-slate-900 shrink-0 object-cover shadow-xs" />
                        ) : (
                          <div className="w-12 h-16 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100 truncate">{c.name}</span>
                            <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{c.key}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{c.role || c.description}</p>
                          <div className="flex items-center gap-1.5">
                            <select value={c.characterId} onChange={(e) => setCast(c.key, e.target.value)} className={cn(inputCls, "py-1 text-[11px] flex-1")}>
                              {_.map(allCharacters, (o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}
                                  {MOTION_TEXT_SYMBOL_6}
                                  {o.id}
                                  {MOTION_TEXT_SYMBOL_7}
                                </option>
                              ))}
                            </select>
                            {c.suggested && (
                              <button type={MOTION_TEXT_BUTTON} onClick={() => void saveSuggested(c.key)} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 shrink-0 cursor-pointer" title={stringifyJson(c.suggested)}>
                                {text.SAVE_SUGGESTED}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {analysisTab === MOTION_TEXT_CHAPTERS && (
                <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(state.analysis.chapters, (c, i) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-955/70 p-3 shadow-2xs">
                      <span className="font-mono text-xs font-bold text-purple-400 w-6 shrink-0 mt-0.5">{String(i + 1).padStart(2, MOTION_TEXT_0)}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100">{c.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                            {MOTION_TEXT_SYMBOL_2}
                            {c.targetSeconds}
                            {MOTION_TEXT_S}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{c.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {analysisTab === MOTION_TEXT_FACTS && !_.isEmpty(state.analysis.facts) && (
                <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(state.analysis.facts, (f, i) => (
                    <div key={i} className="text-xs flex gap-2.5 rounded-xl border border-slate-800 bg-slate-955/70 p-3 shadow-2xs">
                      <span
                        className={cn(
                          "shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase h-fit",
                          f.status === MOTION_TEXT_OK ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : f.status === MOTION_TEXT_WRONG ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30" : "bg-purple-500/15 text-purple-300 border border-purple-500/30",
                        )}>
                        {f.status === MOTION_TEXT_OK ? text.FACT_OK : f.status === MOTION_TEXT_WRONG ? text.FACT_WRONG : text.FACT_UNCERTAIN}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="text-slate-100 font-medium">{f.claim}</div>
                        {f.note && <div className="text-[11px] text-slate-400">{f.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-2">
                {busyKind === MOTION_TEXT_SCRIPT ? (
                  stopAi
                ) : (
                  <ActionBtn icon={Wand2} onClick={() => void studio.writeScript()} disabled={studio.storyBusy} className="px-5 py-2.5">
                    {text.SCRIPT_BTN}
                  </ActionBtn>
                )}
              </div>
            </div>
          </div>
        )}
        {state.script && state.analysis && (
          <div className={cardCls}>
            <StepHeader
              n={MOTION_TEXT_03}
              icon={Film}
              title={text.STEP_SCRIPT}
              badge={MOTION_TEMPLATE_BEATS(`${state.script.beats.length}`)}
              right={
                <span className="text-[10px] font-mono text-slate-400">
                  {formatSeconds(estimateTotal)} {!studio.voiceValid && !state.uploadedAudio ? MOTION_TEMPLATE_SYMBOL_2(`${text.ESTIMATED}`) : ""}
                </span>
              }
            />
            <div className="space-y-4 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {_.map(state.analysis.chapters, (chapter, ci) => (
                <div key={chapter.id} className="space-y-3">
                  <div className="flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 z-10 shadow-sm">
                    <div className="text-xs font-black uppercase tracking-wide flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-mono font-black shadow-xs">{ci + 1}</span>
                      <span className="text-purple-400 font-extrabold">{chapter.title}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 lowercase">
                        {MOTION_TEXT_SYMBOL_43}
                        {chapter.targetSeconds}
                        {MOTION_TEXT_S_2}
                      </span>
                    </div>
                    <button type={MOTION_TEXT_BUTTON} onClick={() => void studio.writeScript([chapter.id])} disabled={studio.storyBusy} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-955/80 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-purple-500/40 shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all">
                      <RefreshCw className="w-3 h-3" /> <span>{text.SCRIPT_REGEN_CHAPTER}</span>
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {_.map(beatsByChapter[chapter.id] || [], (b, bi) => (
                      <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 shadow-xs hover:border-purple-500/40 transition-all space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-2xs">
                              {MOTION_TEXT_SYMBOL_44}
                              {bi + 1}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wide border shadow-2xs flex items-center gap-1",
                                b.visual === MOTION_TEXT_SCENE
                                  ? "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300"
                                  : b.visual === MOTION_TEXT_TITLE
                                    ? "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300"
                                    : b.visual === MOTION_TEXT_STATS
                                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                      : "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300",
                              )}>
                              {b.visual === MOTION_TEXT_SCENE ? MOTION_TEXT_SCENE_2 : b.visual === MOTION_TEXT_TITLE ? MOTION_TEXT_TITLE_2 : b.visual === MOTION_TEXT_STATS ? MOTION_TEXT_STATS_2 : b.visual}
                            </span>
                            {b.visual === MOTION_TEXT_SCENE && (b.env || b.time) && (
                              <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-955/80 px-2 py-0.5 rounded-lg border border-slate-800 max-w-[240px] truncate" title={MOTION_TEMPLATE_SYMBOL_7(`${b.env || ""}`, `${b.time || ""}`)}>
                                {MOTION_TEXT_SYMBOL_45}
                                {b.env}
                                {b.time ? MOTION_TEMPLATE_SYMBOL_6(`${b.time}`) : ""}
                              </span>
                            )}
                            {_.size(b.shots) > 1 && (
                              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-lg" title={_.map(b.shots, (sh, k) => MOTION_TEMPLATE_SHOT_TOOLTIP_LINE(`${k + 1}`, `${sh.text}`, `${sh.visual}`)).join(MOTION_TEXT_SYMBOL_27)}>
                                {MOTION_TEXT_SYMBOL_46}
                                {_.size(b.shots)} {text.SCRIPT_SHOTS}
                              </span>
                            )}
                          </div>
                          <button type={MOTION_TEXT_BUTTON} onClick={() => removeBeat(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer" title={text.DELETE || MOTION_TEXT_XOA} disabled={studio.storyBusy}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          value={b.narration}
                          onChange={(e) => updateBeat(b.id, { narration: e.target.value })}
                          rows={2}
                          placeholder={MOTION_TEXT_NHAP_NOI_DUNG_LOI_DAN_CHO_PHAN_CANH}
                          className="w-full bg-slate-955/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:bg-slate-955 focus:border-purple-500/80 outline-none resize-y leading-relaxed font-sans font-medium transition-all shadow-2xs"
                          disabled={studio.storyBusy}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={cardCls}>
          <StepHeader n={MOTION_TEXT_SYMBOL_11} icon={PlayCircle} title={text.PREVIEW} badge={MOTION_TEXT_LIVE_2_5D_CANVAS} />
          {studio.ME ? (
            <MotionSpecPlayer ME={studio.ME} spec={studio.compiled?.spec || null} audioUrl={AUDIO_URL(studio.audioId)} />
          ) : (
            <div className="w-full h-[340px] sm:h-[380px] md:h-[420px] flex items-center justify-center rounded-2xl bg-black border border-slate-800">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-6 min-w-0">
        {state.script && state.analysis && (
          <div className={cardCls}>
            <StepHeader n={MOTION_TEXT_AI_2} icon={ImageIcon} title={text.STEP_ART} badge={artItems.length ? MOTION_TEMPLATE_ART_BADGE(`${_.size(_.filter(artItems, (a) => !!a.image && !a.failed))}`, `${artItems.length}`, `${text.ART_COUNT}`) : undefined} />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                <ChipButton active={state.useArt} onClick={() => patch({ useArt: true })} disabled={studio.renderBusy}>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{text.ART_MODE_ART}</span>
                </ChipButton>
                <ChipButton active={!state.useArt} onClick={() => patch({ useArt: false })} disabled={studio.renderBusy}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>{text.ART_MODE_DRAWN}</span>
                </ChipButton>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">{text.ART_HINT}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0">{text.ART_ENGINE}</span>
                <select value={state.artEngine} onChange={(e) => patch({ artEngine: e.target.value })} className={cn(inputCls, "py-1.5")} disabled={studio.storyBusy}>
                  <option value={ImageGeneratorEngine.Veo3}>{MOTION_TEMPLATE_GEMINI_MODEL(`${GeminiChatModelName.Flash}`)}</option>
                  <option value={ImageGeneratorEngine.LabsSandbox}>{MOTION_TEMPLATE_GEMINI_MODEL(`${GeminiChatModelName.FlashLite}`)}</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type={MOTION_TEXT_CHECKBOX} checked={state.artReview} onChange={(e) => patch({ artReview: e.target.checked })} className="accent-purple-500" disabled={studio.storyBusy} />
                <span>{text.ART_REVIEW}</span>
              </label>
              {busyKind === MOTION_TEXT_ART ? (
                <StopBtn className="w-full" onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />
              ) : (
                <div className="flex items-center gap-2">
                  <ActionBtn icon={Wand2} className="flex-1" onClick={() => void studio.illustrate(false)} disabled={studio.storyBusy}>
                    {state.script.art ? text.ART_BTN_CONTINUE : text.ART_BTN}
                  </ActionBtn>
                  {state.script.art && (
                    <button type={MOTION_TEXT_BUTTON} onClick={() => void studio.illustrate(true)} disabled={studio.storyBusy} className="text-[10px] font-bold text-slate-500 hover:text-purple-300 flex items-center gap-1 cursor-pointer disabled:opacity-40 shrink-0">
                      <RefreshCw className="w-3 h-3" /> {text.ART_RESTART}
                    </button>
                  )}
                </div>
              )}
              {!_.isEmpty(state.script.art?.cast) && (
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {_.map(state.script.art!.cast, (c) => (
                    <div key={c.key} className="shrink-0 w-14 text-center" title={c.appearance}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">{c.image && <img src={realFileUrl(c.image)} alt={c.key} className="w-full h-full object-cover object-top" loading={MOTION_TEXT_LAZY} />}</div>
                      <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{c.key}</div>
                    </div>
                  ))}
                </div>
              )}
              {!_.isEmpty(artItems) && (
                <div className="grid grid-cols-3 gap-1.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(artItems, (a) => (
                    <div key={a.id} className={cn("relative aspect-video rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-900", a.failed ? "border-rose-500/60" : "border-slate-200 dark:border-slate-800")} title={MOTION_TEMPLATE_ART_TOOLTIP(`${a.id}`, `${a.words}`, `${a.prompt}`, `${a.note || ""}`, `${a.failed || ""}`)}>
                      {a.image ? <img src={realFileUrl(a.image)} alt={a.id} className="w-full h-full object-cover" loading={MOTION_TEXT_LAZY} /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-mono text-slate-400">{a.failed ? MOTION_TEXT_ART_FAILED_MARK : MOTION_TEXT_SYMBOL}</div>}
                      <span className="absolute left-1 bottom-1 px-1 rounded bg-black/60 text-[8px] font-mono text-white">{a.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className={cardCls}>
          <StepHeader n={MOTION_TEXT_04} icon={Mic} title={text.STEP_VOICE} badge={MOTION_TEXT_AI_VOICE} />
          <div className="space-y-3">
            <button type={MOTION_TEXT_BUTTON} onClick={() => setVoiceDialog(true)} className={cn(inputCls, "text-left flex items-center justify-between cursor-pointer py-2.5")}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span className="truncate font-bold text-slate-100">{state.voiceName || text.VOICE_PICK}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>{text.VOICE_SPEED}</span>
                <span className="font-mono font-bold text-purple-400">
                  {state.voiceSpeed.toFixed(2)}
                  {MOTION_TEXT_SYMBOL_12}
                </span>
              </div>
              <input type={MOTION_TEXT_RANGE} min={0.8} max={1.2} step={0.05} value={state.voiceSpeed} onChange={(e) => patch({ voiceSpeed: _.toNumber(e.target.value) })} className="w-full accent-purple-500" />
            </div>
            {busyKind === MOTION_TEXT_VOICE ? (
              <StopBtn className="w-full" onClick={() => void studio.cancelStory()} label={storyStopping ? text.STOPPING : text.STOP_AI} stopping={storyStopping} />
            ) : (
              <ActionBtn icon={Mic} className="w-full" onClick={() => void studio.generateVoice()} disabled={!state.script?.beats?.length || !state.voiceId || studio.storyBusy}>
                {text.VOICE_BTN}
              </ActionBtn>
            )}
            {state.voice && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {text.VOICE_READY}
                  {MOTION_TEXT_SYMBOL_10}
                  {formatSeconds(state.voice.totalSeconds)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <button type={MOTION_TEXT_BUTTON} onClick={() => fileRef.current?.click()} className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-1.5 cursor-pointer font-bold transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{text.VOICE_UPLOAD}</span>
              </button>
              <input ref={fileRef} type={MOTION_TEXT_FILE} accept={MOTION_TEXT_AUDIO} className="hidden" onChange={(e) => e.target.files?.[0] && void studio.uploadVoice(e.target.files[0])} />
            </div>
          </div>
        </div>
        <div className={cardCls}>
          <StepHeader n={MOTION_TEXT_05} icon={Clapperboard} title={text.STEP_RENDER} badge={MOTION_TEXT_OUTPUT_MP4} />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{text.ASPECT}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {_.map(
                  [
                    { aspect: MotionAspect.LANDSCAPE, label: MOTION_TEXT_16_9, icon: Tv },
                    { aspect: MotionAspect.PORTRAIT, label: MOTION_TEXT_9_16, icon: Smartphone },
                    { aspect: MotionAspect.SQUARE, label: MOTION_TEXT_1_1, icon: Square },
                    { aspect: MotionAspect.FOUR_FIVE, label: MOTION_TEXT_4_5, icon: Monitor },
                  ],
                  ({ aspect, label, icon: Icon }) => (
                    <ChipButton key={aspect} active={state.aspect === aspect} onClick={() => patch({ aspect })} disabled={studio.renderBusy} className="h-9">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </ChipButton>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{text.RENDER_MODE}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {_.map(
                  [
                    [MOTION_TEXT_2D, MOTION_TEXT_TOON_LINE, text.RENDER_MODE_2D],
                    [MOTION_TEXT_TOON, MOTION_TEXT_TOON_LINE, text.RENDER_MODE_TOON_LINE],
                    [MOTION_TEXT_TOON, MOTION_TEXT_TOON_FLAT, text.RENDER_MODE_TOON_FLAT],
                    [MOTION_TEXT_3D, MOTION_TEXT_TOON_LINE, text.RENDER_MODE_3D],
                    [MOTION_TEXT_REAL, MOTION_TEXT_TOON_LINE, text.RENDER_MODE_REAL],
                  ] as const,
                  ([mode, toon, label]) => (
                    <ChipButton key={label} active={state.renderMode === mode && (mode !== MOTION_TEXT_TOON || state.toonStyle === toon)} onClick={() => patch(mode === MOTION_TEXT_TOON ? { renderMode: mode, toonStyle: toon } : { renderMode: mode })} disabled={studio.renderBusy}>
                      {label}
                    </ChipButton>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{text.QUALITY}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {_.map(
                  [
                    [MotionQuality.DRAFT, text.QUALITY_DRAFT],
                    [MotionQuality.STANDARD, text.QUALITY_STANDARD],
                    [MotionQuality.HIGH, text.QUALITY_HIGH],
                    [MotionQuality.ULTRA, text.QUALITY_ULTRA],
                  ],
                  ([q, label]) => (
                    <ChipButton key={q} active={state.quality === q} onClick={() => patch({ quality: q as MotionQuality })} disabled={studio.renderBusy}>
                      {label}
                    </ChipButton>
                  ),
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{text.FPS}</span>
                <select value={state.fps} onChange={(e) => patch({ fps: _.toNumber(e.target.value) })} className={inputCls} disabled={studio.renderBusy}>
                  {_.map([24, 25, 30, 60], (f) => (
                    <option key={f} value={f}>
                      {f}
                      {MOTION_TEXT_FPS}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{text.ENCODER}</span>
                <select value={state.encoder} onChange={(e) => patch({ encoder: e.target.value as MotionEncoderPreference })} className={inputCls} disabled={studio.renderBusy}>
                  <option value={MotionEncoderPreference.AUTO}>{text.ENCODER_AUTO}</option>
                  <option value={MotionEncoderPreference.GPU}>{text.ENCODER_GPU}</option>
                  <option value={MotionEncoderPreference.CPU}>{text.ENCODER_CPU}</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type={MOTION_TEXT_CHECKBOX} checked={state.sfx} onChange={(e) => patch({ sfx: e.target.checked })} className="accent-purple-500 w-4 h-4 rounded" />
              <span>{text.SFX}</span>
            </label>
            <div className="grid grid-cols-[auto_1fr] gap-2 pt-2">
              <button type={MOTION_TEXT_BUTTON} onClick={() => void studio.check()} disabled={!studio.compiled || studio.checking || studio.renderBusy} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-955/80 text-slate-300 hover:text-white hover:border-purple-500/40 disabled:opacity-40 cursor-pointer transition-all shadow-2xs">
                {studio.checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                <span>{text.CHECK_BTN}</span>
              </button>
              {studio.renderBusy ? (
                <StopBtn onClick={() => void studio.cancelRender()} label={renderStopping ? text.STOPPING : text.STOP_RENDER} stopping={renderStopping} />
              ) : (
                <ActionBtn icon={Clapperboard} onClick={() => void studio.render()} disabled={!studio.compiled}>
                  {text.RENDER_BTN}
                </ActionBtn>
              )}
            </div>
          </div>
        </div>
        {(job || rj) && (
          <div className={cardCls}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">{rj ? MOTION_TEXT_RENDER_VIDEO_MP4 : job?.kind === MOTION_TEXT_ANALYZE ? text.STEP_ANALYSIS : job?.kind === MOTION_TEXT_SCRIPT ? text.STEP_SCRIPT : job?.kind === MOTION_TEXT_ART ? text.STEP_ART : text.STEP_VOICE}</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{rj ? MOTION_TEMPLATE_SYMBOL_3(`${Math.round((rj.progress || 0) * 100)}`) : MOTION_TEMPLATE_SYMBOL_3(`${Math.round((job?.progress || 0) * 100)}`)}</span>
            </div>
            {studio.storyBusy && job?.startedAt && <ElapsedLine since={job.startedAt} label={job.kind === MOTION_TEXT_VOICE ? text.STEP_VOICE : text.WAITING_AI} suffix={text.ELAPSED} />}
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-300"
                style={{
                  width: `${Math.max(8, Math.round(((rj ? rj.progress : job?.progress) || 0) * 100))}%`,
                }}
              />
            </div>
            <div className="max-h-36 overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-400 bg-slate-955/90 p-2.5 rounded-xl border border-slate-800 space-y-1">
              {_.map(_.takeRight((rj ? rj.log : job?.log) || [], 15), (l, i) => (
                <div key={i} className="truncate">
                  {l}
                </div>
              ))}
            </div>
            {rj?.result && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <video src={rj.result.videoUrl} controls className="w-full rounded-xl bg-black shadow-lg" />
                <a href={rj.result.videoUrl} download={MOTION_TEXT_MOTION_VIDEO_MP4} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  <span>{text.SAVE_AS}</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <VoiceSelectionDialog
        isOpen={voiceDialog}
        onClose={() => setVoiceDialog(false)}
        currentLang={currentLang === MOTION_TEXT_EN ? MOTION_TEXT_EN : MOTION_TEXT_VI}
        selectedVoiceId={state.voiceId}
        favoriteVoices={[]}
        onToggleFavoriteVoice={_.noop}
        persistenceScope={MOTION_TEXT_MOTION_VIDEO}
        onSelectVoice={(v) => {
          patch({ voiceId: v.voice_id, voiceName: v.name });
          setVoiceDialog(false);
        }}
      />
    </div>
  );
};
const JunkDialog: FC<{ studio: MotionStudio; text: MotionVideoTexts; onClose: () => void }> = ({ studio, text, onClose }) => {
  const [report, setReport] = useState<StorageJunkReport | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const load = async () => {
    setReport(null);
    try {
      const r = await studio.scanJunk();
      setReport(r);
      setPicked(new Set(_.map(r.groups, MOTION_TEXT_GROUP)));
    } catch (e: any) {
      toast.error(e?.message);
      onClose();
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const total = report
    ? _.sumBy(
        _.filter(report.groups, (g) => picked.has(g.group)),
        MOTION_TEXT_BYTES,
      )
    : 0;
  const run = async () => {
    setBusy(true);
    try {
      const r = await studio.cleanJunk([...picked]);
      toast.success(MOTION_TEMPLATE_JOIN_SPACE(r.recycled ? text.JUNK_RECYCLED : text.RESULTS_FREED, formatBytes(r.freedBytes)));
      setFailed(r.failed);
      await load();
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setBusy(false);
    }
  };
  const label = (g: string) => (text as unknown as Record<string, string>)[MOTION_TEMPLATE_JUNK_GROUP_KEY(g)] || g;
  return (
    <Modal isOpen onClose={() => !busy && onClose()} title={text.JUNK_TITLE} maxWidth={MOTION_TEXT_MODAL_2XL}>
      {!report ? (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          {text.JUNK_SCANNING}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <div>{text.JUNK_STORAGE}</div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all">{report.storageDir}</div>
          </div>
          {_.isEmpty(report.groups) ? (
            <div className="py-6 text-center text-sm text-slate-500">{text.JUNK_EMPTY}</div>
          ) : (
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {_.map(report.groups, (g) => (
                <label key={g.group} className="flex gap-3 items-start rounded-xl border border-slate-200 dark:border-slate-800 p-3 cursor-pointer hover:border-purple-500/40">
                  <input
                    type={MOTION_TEXT_CHECKBOX}
                    className="mt-1 accent-purple-500"
                    checked={picked.has(g.group)}
                    onChange={(e) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(g.group);
                        else next.delete(g.group);
                        return next;
                      })
                    }
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label(g.group)}</span>
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0">{formatBytes(g.bytes)}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
                      {_.map(_.take(g.items, 4), (it) => (
                        <div key={it.path} className="truncate">
                          {it.path}
                          {MOTION_TEXT_SYMBOL_10}
                          {formatBytes(it.bytes)}
                        </div>
                      ))}
                      {g.items.length > 4 && <div>{MOTION_TEMPLATE_JUNK_MORE(`${g.items.length - 4}`, text.JUNK_MORE)}</div>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {!_.isEmpty(failed) && (
            <div className="text-[11px] text-purple-300">
              <div className="font-bold">{text.JUNK_FAILED}</div>
              {_.map(_.take(failed, 5), (f) => (
                <div key={f} className="font-mono truncate">
                  {f}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{text.JUNK_NOTE}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{MOTION_TEMPLATE_JOIN_SPACE(text.JUNK_TOTAL, formatBytes(total))}</div>
            <div className="flex gap-2">
              <button type={MOTION_TEXT_BUTTON} onClick={onClose} disabled={busy} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                {text.RESULTS_CANCEL}
              </button>
              <button type={MOTION_TEXT_BUTTON} onClick={() => void run()} disabled={busy || !total} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{text.JUNK_CLEAN}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
const ResultsPanel: FC<{ studio: MotionStudio; text: MotionVideoTexts }> = ({ studio, text }) => {
  const [confirm, setConfirm] = useState<MotionResultItem | true | null>(null);
  const [busy, setBusy] = useState(false);
  const [junkOpen, setJunkOpen] = useState(false);
  const junkButton = (
    <button type={MOTION_TEXT_BUTTON} onClick={() => setJunkOpen(true)} disabled={studio.renderBusy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-500/40 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
      <Sparkles className="w-3.5 h-3.5" />
      <span>{text.JUNK_BUTTON}</span>
    </button>
  );
  const junkDialog = junkOpen && <JunkDialog studio={studio} text={text} onClose={() => setJunkOpen(false)} />;
  const runDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const freed = confirm === true ? await studio.deleteAllResults() : await studio.deleteResult(confirm.id);
      toast.success(MOTION_TEMPLATE_JOIN_SPACE(text.RESULTS_FREED, formatBytes(freed)));
      setConfirm(null);
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setBusy(false);
    }
  };
  if (_.isEmpty(studio.results)) {
    return (
      <div className={cn(cardCls, "text-center text-xs text-slate-500 dark:text-slate-400 py-20 flex-1 flex flex-col items-center justify-center gap-2")}>
        <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-700 stroke-1" />
        <span>{text.RESULTS_EMPTY}</span>
        <div className="pt-3">{junkButton}</div>
        {junkDialog}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 w-full pb-16 text-left">
      <div className={cn(cardCls, "px-4 py-3 flex items-center justify-between gap-3 flex-wrap")}>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{MOTION_TEMPLATE_JOIN_SPACE(MOTION_TEMPLATE_JOIN_SPACE(`${studio.results.length}`, text.RESULTS_SUMMARY), formatBytes(_.sumBy(studio.results, (r) => r.sizeBytes || 0)))}</div>
        <div className="flex gap-2 flex-wrap">
          {junkButton}
          <button type={MOTION_TEXT_BUTTON} onClick={() => setConfirm(true)} disabled={studio.renderBusy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5" />
            <span>{text.RESULTS_DELETE_ALL}</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 pb-8">
        {_.map(studio.results, (r) => (
          <div key={r.id} className={cn(cardCls, "p-4 space-y-3 bg-white/95 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 shadow-md")}>
            <video src={r.videoUrl} controls preload={MOTION_TEXT_METADATA} className="w-full rounded-xl bg-black max-h-[380px] shadow-md" />
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{r.title}</div>
            <div className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400">
              {r.width}
              {MOTION_TEXT_SYMBOL_12}
              {r.height}
              {MOTION_TEXT_SYMBOL_10}
              {r.fps}
              {MOTION_TEXT_FPS_2}
              {r.quality}
              {MOTION_TEXT_SYMBOL_10}
              {formatSeconds(r.durationSeconds)}
              {MOTION_TEXT_SYMBOL_10}
              {formatBytes(r.sizeBytes)}
              {MOTION_TEXT_SYMBOL_10}
              {r.encoder}
              {MOTION_TEXT_RENDER}
              {formatSeconds(r.renderSeconds)}
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-800/60">
              <button type={MOTION_TEXT_BUTTON} onClick={() => void studio.saveResult(r)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 transition-colors cursor-pointer shadow-2xs">
                <Download className="w-3.5 h-3.5" />
                <span>{text.SAVE_AS}</span>
              </button>
              <button type={MOTION_TEXT_BUTTON} onClick={() => setConfirm(r)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
                <span>{text.RESULTS_DELETE}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      {junkDialog}
      <Modal
        isOpen={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        maxWidth={MOTION_TEXT_MAX_W_MD}
        title={
          <div className="flex items-center gap-2 uppercase tracking-wider font-extrabold text-slate-900 dark:text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="uppercase font-extrabold tracking-wider">{text.RESULTS_CONFIRM_TITLE}</span>
          </div>
        }>
        <div className="space-y-4 text-left">
          {confirm && confirm !== true && <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{confirm.title}</div>}
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{confirm === true ? text.RESULTS_CONFIRM_ALL : text.RESULTS_CONFIRM_ONE}</p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold leading-relaxed">{MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC}</div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type={MOTION_TEXT_BUTTON} onClick={() => setConfirm(null)} disabled={busy} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              {text.RESULTS_CANCEL}
            </button>
            <button type={MOTION_TEXT_BUTTON} onClick={() => void runDelete()} disabled={busy} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-md shadow-rose-600/20 disabled:opacity-60">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{text.RESULTS_CONFIRM_YES}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
