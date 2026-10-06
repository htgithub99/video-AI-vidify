import {
  MOTION_TEMPLATE_DESIGN_REDRAWN,
  MOTION_TEXT_2_DIGIT,
  MOTION_TEXT_ALL,
  MOTION_TEXT_ASPECT_VIDEO,
  MOTION_TEXT_ASSET,
  MOTION_TEXT_BUTTON,
  MOTION_TEXT_CREATEDAT,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_DESC,
  MOTION_TEXT_DESIGNED,
  MOTION_TEXT_ENV_2,
  MOTION_TEXT_LAZY,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NUMERIC,
  MOTION_TEXT_PREVIEW,
  MOTION_TEXT_RESIZE_NONE_LEADING_RELAXED,
  MOTION_TEXT_SYMBOL_22,
  MOTION_TEXT_TOP,
  MOTION_TEXT_TRANSPARENT,
  MOTION_TEXT_VI_VN,
  MOTION_TEXT_XEM_TRUOC_CHI_TIET,
} from "../../constants/motionRuntime.js";
import _ from "lodash";
import { Check, Loader2, Mountain, Package, Plus, RefreshCw, Search, Sparkles, Star, Trash2, Wand2, X } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { MOTION_DESIGN_TEXTS, MOTION_VIDEO_TEXTS, type MotionVideoTexts } from "../../constants/motionVideoTexts.js";
import { jsonUtils } from "../../lib/json.js";
import { cn } from "../../lib/utils";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
import { MotionJobStatus, type MotionStoryJobState } from "../../types/motionVideo.js";
import { Modal } from "../ui/Modal";
import { motionDesignFileUrl, motionDesignUrl, motionRequest, pollMotionJob, type MotionEngineGlobal } from "./motionApi";
import { MotionLazyThumb } from "./MotionLivePreview";
import { assetThumb, environmentThumb } from "./motionThumbs";
import { MotionModalActions } from "./MotionModalActions";
import { isMotionJobTerminal } from "../../lib/motionJob.js";
interface DesignSummary {
  id: string;
  kind: "asset" | "env";
  name: string;
  score: number;
  brief: string;
  createdAt: string;
}
interface DesignDetail extends DesignSummary {
  design: Record<string, unknown>;
  rounds?: number;
}
interface DesignPreviewRound {
  round: string;
  files: string[];
}
interface Props {
  ME: MotionEngineGlobal;
  onLibraryChange?: () => void;
  text?: MotionVideoTexts;
}
type DesignCategory = "all" | "asset" | "env" | "top";
const scoreClass = (s: number) => (s >= 8 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : s >= 7 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-rose-500/15 text-rose-400 border-rose-500/30");
const kindLabel = (k: string) => (k === MOTION_TEXT_ENV_2 ? MOTION_DESIGN_TEXTS.KIND_ENV : MOTION_DESIGN_TEXTS.KIND_ASSET);
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString(MOTION_TEXT_VI_VN, {
        day: MOTION_TEXT_2_DIGIT,
        month: MOTION_TEXT_2_DIGIT,
        year: MOTION_TEXT_NUMERIC,
        hour: MOTION_TEXT_2_DIGIT,
        minute: MOTION_TEXT_2_DIGIT,
      });
};
const readAiExecution = async () => {
  const saved = await jsonUtils.getAsyncItem<Record<string, unknown>>(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
  return {
    provider: _.toString(saved?.aiProvider || AiPlanningFallbackProvider.GeminiChat),
    model: _.toString(saved?.aiModel || AiPlanningChatModel.GeminiFlash),
    mode: _.toString(saved?.aiMode || AiPlanningExecutionMode.RoomOnly),
    chromeHeadless: saved?.aiHeadless !== false,
  };
};
const registerDesign = (ME: MotionEngineGlobal, design: Record<string, unknown>) => {
  ME.registerDesigned?.([design]);
};
export const MotionDesignsPanel: FC<Props> = ({ ME, onLibraryChange, text = MOTION_VIDEO_TEXTS.vi }) => {
  const [items, setItems] = useState<DesignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<DesignCategory>(MOTION_TEXT_ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DesignDetail | null>(null);
  const [previews, setPreviews] = useState<DesignPreviewRound[]>([]);
  const [zoom, setZoom] = useState<string | null>(null);
  const [job, setJob] = useState<MotionStoryJobState | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    kind: MOTION_TEXT_ASSET as "asset" | "env",
    name: "",
    brief: "",
    width: "",
    height: "",
    use: "",
  });
  const [redesignBrief, setRedesignBrief] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<DesignSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [version, setVersion] = useState(0);
  const pollAbort = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await motionRequest<{ items: DesignSummary[] }>(API_ROUTES.MOTION_VIDEO_DESIGNS);
      setItems(_.orderBy(res.items || [], [MOTION_TEXT_CREATEDAT], [MOTION_TEXT_DESC]));
    } catch (e: any) {
      toast.error(e?.message || MOTION_DESIGN_TEXTS.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    return () => pollAbort.current?.abort();
  }, [load]);
  useEffect(() => {
    if (!selectedId && items.length) setSelectedId(items[0].id);
  }, [items, selectedId]);
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setPreviews([]);
      return;
    }
    let cancelled = false;
    motionRequest<{ item: DesignDetail; previews: DesignPreviewRound[] }>(motionDesignUrl(selectedId))
      .then((res) => {
        if (cancelled) return;
        registerDesign(ME, res.item.design);
        setDetail(res.item);
        setPreviews(res.previews || []);
      })
      .catch(() => !cancelled && setDetail(null));
    return () => {
      cancelled = true;
    };
  }, [selectedId, ME, version]);
  const counts = useMemo(() => {
    return {
      all: items.length,
      asset: _.filter(items, { kind: MOTION_TEXT_ASSET }).length,
      env: _.filter(items, { kind: MOTION_TEXT_ENV_2 }).length,
      top: _.filter(items, (d) => d.score >= 8).length,
    };
  }, [items]);
  const filtered = useMemo(() => {
    const query = _.toLower(_.deburr(q));
    return _.filter(items, (d) => {
      if (cat === MOTION_TEXT_ASSET && d.kind !== MOTION_TEXT_ASSET) return false;
      if (cat === MOTION_TEXT_ENV_2 && d.kind !== MOTION_TEXT_ENV_2) return false;
      if (cat === MOTION_TEXT_TOP && d.score < 8) return false;
      if (!query) return true;
      const hay = _.toLower(_.deburr(`${d.name} ${d.id} ${d.brief}`));
      return _.includes(hay, query);
    });
  }, [items, cat, q]);
  const running = !!job && !isMotionJobTerminal(job.status);
  const followJob = async (jobState: MotionStoryJobState, okMessage: string) => {
    pollAbort.current?.abort();
    const ctrl = new AbortController();
    pollAbort.current = ctrl;
    setJob(jobState);
    try {
      const final = await pollMotionJob<MotionStoryJobState>(`${API_ROUTES.MOTION_STORY_STATUS}${jobState.id}`, setJob, (j) => isMotionJobTerminal(j.status), ctrl.signal, 1500);
      if (final.status === MotionJobStatus.COMPLETED) {
        const made = _.get(final.result, MOTION_TEXT_DESIGNED, []) as string[];
        if (made.length) toast.success(okMessage);
        else toast.info(MOTION_DESIGN_TEXTS.NO_APPROVED_DESIGN);
        await load();
        if (made.length) {
          setSelectedId(made[made.length - 1]);
          setVersion((v) => v + 1);
          onLibraryChange?.();
        }
      } else if (final.status === MotionJobStatus.ERROR) {
        toast.error(final.error || MOTION_DESIGN_TEXTS.DESIGN_ERROR);
      }
    } catch {}
  };
  const submitNew = async () => {
    if (!_.trim(form.name) || _.trim(form.brief).length < 10) {
      toast.error(MOTION_DESIGN_TEXTS.VALIDATION_ERROR);
      return;
    }
    try {
      const size = form.kind === MOTION_TEXT_ASSET && _.toNumber(form.width) > 0 && _.toNumber(form.height) > 0 ? [_.toNumber(form.width), _.toNumber(form.height)] : undefined;
      const res = await motionRequest<{ job: MotionStoryJobState }>(API_ROUTES.MOTION_VIDEO_DESIGNS, {
        items: [
          {
            kind: form.kind,
            id: form.name,
            name: form.name,
            brief: form.brief,
            size,
            use: form.use || undefined,
          },
        ],
        aiExecution: await readAiExecution(),
      });
      setCreating(false);
      setForm({ kind: MOTION_TEXT_ASSET, name: "", brief: "", width: "", height: "", use: "" });
      void followJob(res.job, MOTION_DESIGN_TEXTS.CREATE_SUCCESS);
    } catch (e: any) {
      toast.error(e?.message || MOTION_DESIGN_TEXTS.REQUEST_ERROR);
    }
  };
  const submitRedesign = async () => {
    if (!detail) return;
    try {
      const res = await motionRequest<{ job: MotionStoryJobState }>(motionDesignUrl(detail.id, true), {
        brief: redesignBrief && redesignBrief !== detail.brief ? redesignBrief : "",
        aiExecution: await readAiExecution(),
      });
      setRedesignBrief(null);
      void followJob(res.job, MOTION_TEMPLATE_DESIGN_REDRAWN(String(detail.name)));
    } catch (e: any) {
      toast.error(e?.message || MOTION_DESIGN_TEXTS.REQUEST_ERROR);
    }
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await motionRequest(motionDesignUrl(toDelete.id), undefined, MOTION_TEXT_DELETE);
      if (selectedId === toDelete.id) setSelectedId(null);
      setToDelete(null);
      await load();
      onLibraryChange?.();
      toast.success(MOTION_DESIGN_TEXTS.DELETE_SUCCESS);
    } catch (e: any) {
      toast.error(e?.message || MOTION_DESIGN_TEXTS.DELETE_ERROR);
    } finally {
      setDeleting(false);
    }
  };
  const thumb = (d: { id: string; kind: string }) => (d.kind === MOTION_TEXT_ENV_2 ? environmentThumb(ME, d.id) : assetThumb(ME, d.id));
  const inputCls = "w-full px-3 py-2 rounded-xl bg-slate-955/90 border border-slate-800 text-xs text-slate-100 font-bold outline-none focus:border-purple-500/60";
  const categoriesConfig: { id: DesignCategory; label: string; icon: typeof Sparkles }[] = [
    { id: MOTION_TEXT_ALL, label: MOTION_DESIGN_TEXTS.CATEGORY_ALL, icon: Sparkles },
    { id: MOTION_TEXT_ASSET, label: MOTION_DESIGN_TEXTS.CATEGORY_ASSET, icon: Package },
    { id: MOTION_TEXT_ENV_2, label: MOTION_DESIGN_TEXTS.CATEGORY_ENV, icon: Mountain },
    { id: MOTION_TEXT_TOP, label: MOTION_DESIGN_TEXTS.CATEGORY_TOP, icon: Star },
  ];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[230px_1fr_340px] gap-5 w-full text-left">
      <div className="glass-card rounded-2xl p-3 border border-slate-800/80 bg-slate-900/60 flex xl:flex-col gap-1.5 overflow-x-auto shrink-0 shadow-lg">
        <div className="text-[11px] font-mono font-black uppercase tracking-wider text-purple-400 px-3 py-1 hidden xl:block">{MOTION_DESIGN_TEXTS.CATEGORY_TITLE}</div>
        {_.map(categoriesConfig, ({ id, label, icon: Icon }) => {
          const isCatActive = cat === id;
          return (
            <button
              key={id}
              type={MOTION_TEXT_BUTTON}
              onClick={() => setCat(id)}
              className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer select-none", isCatActive ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300 shadow-xs scale-[1.01]" : "border-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/60")}>
              <Icon className={cn("w-4 h-4 shrink-0", isCatActive ? "text-purple-400" : "text-slate-400")} />
              <span className="flex-1 text-left font-bold">{label}</span>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded-full font-bold", isCatActive ? "bg-purple-500/25 text-purple-300 border border-purple-500/30" : "bg-slate-955 border border-slate-800 text-slate-400")}>{counts[id]}</span>
            </button>
          );
        })}
      </div>
      <div className="glass-card rounded-2xl p-4 border border-slate-800/80 bg-slate-900/60 min-w-0 flex flex-col gap-3.5 shadow-lg min-h-[560px]">
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="h-10 flex-1 min-w-[200px] flex items-center gap-2 px-3.5 rounded-xl bg-slate-955/80 border border-slate-800 focus-within:border-purple-500/60 transition-colors shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={MOTION_DESIGN_TEXTS.SEARCH_PLACEHOLDER}
              className="flex-1 h-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-bold outline-none border-0 placeholder:text-slate-500 search-input-clean"
              style={{ background: MOTION_TEXT_TRANSPARENT, border: MOTION_TEXT_NONE, boxShadow: MOTION_TEXT_NONE, outline: MOTION_TEXT_NONE }}
            />
            {q && (
              <button type={MOTION_TEXT_BUTTON} onClick={() => setQ("")} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button type={MOTION_TEXT_BUTTON} disabled={running} onClick={() => setCreating(true)} className="h-10 flex items-center gap-1.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-purple-600/20 shrink-0 disabled:opacity-50">
            <Plus className="w-4 h-4" />
            <span>{MOTION_DESIGN_TEXTS.CREATE_BUTTON}</span>
          </button>
        </div>
        {job && (
          <div className={cn("rounded-xl border p-3 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200", running ? "border-purple-500/40 bg-purple-500/10" : job.status === MotionJobStatus.COMPLETED ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10")}>
            <div className="flex items-center gap-2 font-extrabold text-slate-100">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{running ? MOTION_DESIGN_TEXTS.JOB_RUNNING : job.status === MotionJobStatus.COMPLETED ? MOTION_DESIGN_TEXTS.JOB_COMPLETED : job.error || MOTION_DESIGN_TEXTS.JOB_STOPPED}</span>
              {!running && (
                <button type={MOTION_TEXT_BUTTON} onClick={() => setJob(null)} className="ml-auto text-slate-400 hover:text-slate-100 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="max-h-28 overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-300 leading-relaxed">
              {_.map(_.takeRight(job.log, 8), (l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        )}
        <div className="w-full max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              {MOTION_DESIGN_TEXTS.LOADING}
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center text-center gap-2 py-20 text-slate-400 text-xs">
              <Sparkles className="w-10 h-10 text-purple-400/80 stroke-1" />
              <span className="font-extrabold text-slate-100 text-sm">{MOTION_DESIGN_TEXTS.EMPTY_TITLE}</span>
              <span className="max-w-[340px] leading-relaxed text-slate-400">{MOTION_DESIGN_TEXTS.EMPTY_HINT}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
              {_.map(filtered, (d) => {
                const isSel = selectedId === d.id;
                return (
                  <button
                    key={d.id}
                    type={MOTION_TEXT_BUTTON}
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "group relative rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 text-left cursor-pointer transition-all duration-200 shadow-2xs",
                      isSel ? "border-2 border-purple-500 ring-4 ring-purple-500/25 bg-purple-500/15 dark:bg-purple-500/20 shadow-xl shadow-purple-500/20 scale-[1.03] z-10" : "border-slate-800/80 bg-slate-955/80 hover:border-purple-500/60 hover:bg-slate-900 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                    )}>
                    {isSel && (
                      <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40 animate-in zoom-in-50">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <span className={cn("absolute top-2 left-2 z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-slate-300 shadow-2xs")}>{kindLabel(d.kind)}</span>
                    {!isSel && (
                      <span className={cn("absolute top-2 right-2 z-10 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md border shadow-2xs", scoreClass(d.score))}>
                        {d.score}
                        {MOTION_DESIGN_TEXTS.SCORE_SUFFIX}
                      </span>
                    )}
                    <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center relative border border-slate-800/60 group-hover:border-purple-500/30 transition-all">
                      <MotionLazyThumb load={() => thumb(d)} deps={[d.id, version]} alt={d.name} className={cn("h-full w-full group-hover:scale-105 transition-transform duration-300", d.kind === MOTION_TEXT_ENV_2 ? "object-cover" : "object-contain")} />
                    </div>
                    <span className={cn("text-xs font-extrabold truncate w-full text-center transition-colors", isSel ? "text-purple-600 dark:text-purple-300 font-black" : "text-slate-100 group-hover:text-purple-400")}>{d.name}</span>
                    <div className="flex items-center justify-center gap-1 w-full">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-full">{d.id}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-4 border border-slate-800/80 bg-slate-900/60 flex flex-col gap-3.5 shadow-lg shrink-0">
        <div className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>{MOTION_TEXT_XEM_TRUOC_CHI_TIET}</span>
          <span className="text-[9px] font-black text-purple-300 uppercase bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            {MOTION_DESIGN_TEXTS.BADGE}
          </span>
        </div>
        {detail ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-100 truncate">{detail.name}</h3>
                <p className="text-[10px] font-mono font-bold text-slate-400 truncate">{detail.id}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type={MOTION_TEXT_BUTTON} title={MOTION_DESIGN_TEXTS.REDESIGN_TOOLTIP} disabled={running} onClick={() => setRedesignBrief(detail.brief)} className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors cursor-pointer disabled:opacity-40">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button type={MOTION_TEXT_BUTTON} title={MOTION_DESIGN_TEXTS.DELETE_TOOLTIP} disabled={running} onClick={() => setToDelete(detail)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className={cn("rounded-2xl bg-slate-955/90 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner", detail.kind === MOTION_TEXT_ENV_2 ? MOTION_TEXT_ASPECT_VIDEO : "min-h-[220px] p-3")}>
              <MotionLazyThumb load={() => thumb(detail)} deps={[detail.id, version]} alt={detail.name} className={cn("w-full", detail.kind === MOTION_TEXT_ENV_2 ? "h-full object-cover" : "h-52 object-contain")} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-lg border font-mono font-black", scoreClass(detail.score))}>
                {MOTION_DESIGN_TEXTS.SCORE_PREFIX}
                {detail.score}
                {MOTION_DESIGN_TEXTS.SCORE_SUFFIX}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-955 border border-slate-800 text-slate-300 font-mono font-bold">{kindLabel(detail.kind)}</span>
              {_.isArray(detail.design?.size) && (
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-955 border border-slate-800 text-slate-300 font-mono font-bold">
                  {(detail.design.size as number[]).join(MOTION_TEXT_SYMBOL_22)}
                  {MOTION_DESIGN_TEXTS.SIZE_SUFFIX}
                </span>
              )}
              {!!detail.design?.place && <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-955 border border-slate-800 text-slate-300 font-mono font-bold">{_.toString(detail.design.place)}</span>}
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-955 border border-slate-800 text-slate-400 font-mono font-bold">{formatDate(detail.createdAt)}</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{MOTION_DESIGN_TEXTS.BRIEF_LABEL}</label>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-955/80 p-2.5 rounded-xl border border-slate-800 font-medium">{detail.brief}</p>
            </div>
            {previews.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{MOTION_DESIGN_TEXTS.PREVIEW_ROUNDS}</label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {_.map(previews, (r) => (
                    <div key={r.round} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black text-purple-300 w-6 shrink-0">{_.toUpper(r.round)}</span>
                      {_.map(r.files, (f) => (
                        <button key={f} type={MOTION_TEXT_BUTTON} onClick={() => setZoom(f)} className="flex-1 rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500/60 cursor-pointer shadow-2xs">
                          <img src={motionDesignFileUrl(f)} alt={r.round} loading={MOTION_TEXT_LAZY} className="w-full aspect-video object-cover" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 text-slate-400 text-xs py-16">
            <Wand2 className="w-10 h-10 text-purple-400/70" />
            <span className="font-extrabold text-slate-100">{MOTION_DESIGN_TEXTS.SELECT_TITLE}</span>
            <span className="text-[11px] text-slate-500 max-w-[220px]">{MOTION_DESIGN_TEXTS.SELECT_HINT}</span>
          </div>
        )}
      </div>
      <Modal
        isOpen={creating}
        onClose={() => setCreating(false)}
        maxWidth="max-w-lg"
        title={
          <span className="flex items-center gap-2 font-black uppercase text-sm tracking-wide">
            <Sparkles className="w-4 h-4 text-purple-400" />
            {MOTION_DESIGN_TEXTS.CREATE_TITLE}
          </span>
        }>
        <div className="space-y-3 text-left">
          <div className="flex gap-1.5">
            {_.map(
              [
                [MOTION_TEXT_ASSET, MOTION_DESIGN_TEXTS.ASSET_LABEL, Package],
                [MOTION_TEXT_ENV_2, MOTION_DESIGN_TEXTS.KIND_ENV, Mountain],
              ] as const,
              ([id, label, Icon]) => (
                <button
                  key={id}
                  type={MOTION_TEXT_BUTTON}
                  onClick={() => setForm({ ...form, kind: id })}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all", form.kind === id ? "border-purple-500/60 bg-purple-500/15 text-purple-300 shadow-2xs font-extrabold" : "border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-900")}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ),
            )}
          </div>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.kind === MOTION_TEXT_ENV_2 ? MOTION_DESIGN_TEXTS.ENV_NAME_PLACEHOLDER : MOTION_DESIGN_TEXTS.ASSET_NAME_PLACEHOLDER} className={inputCls} />
          <textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} rows={4} placeholder={MOTION_DESIGN_TEXTS.BRIEF_PLACEHOLDER} className={cn(inputCls, MOTION_TEXT_RESIZE_NONE_LEADING_RELAXED)} />
          {form.kind === MOTION_TEXT_ASSET && (
            <div className="grid grid-cols-3 gap-2">
              <input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} placeholder={MOTION_DESIGN_TEXTS.WIDTH_PLACEHOLDER} inputMode={MOTION_TEXT_NUMERIC} className={inputCls} />
              <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder={MOTION_DESIGN_TEXTS.HEIGHT_PLACEHOLDER} inputMode={MOTION_TEXT_NUMERIC} className={inputCls} />
              <input value={form.use} onChange={(e) => setForm({ ...form, use: e.target.value })} placeholder={MOTION_DESIGN_TEXTS.USE_PLACEHOLDER} className={inputCls} />
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-relaxed">{MOTION_DESIGN_TEXTS.CREATE_HINT}</p>
          <MotionModalActions onCancel={() => setCreating(false)} onConfirm={() => void submitNew()} cancelLabel={text.RESULTS_CANCEL} confirmLabel={MOTION_DESIGN_TEXTS.CREATE_CONFIRM} icon={<Wand2 className="w-3.5 h-3.5" />} />
        </div>
      </Modal>
      <Modal
        isOpen={redesignBrief != null}
        onClose={() => setRedesignBrief(null)}
        maxWidth="max-w-lg"
        title={
          <span className="flex items-center gap-2 font-black uppercase text-sm tracking-wide">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            {MOTION_DESIGN_TEXTS.REDESIGN_TITLE_PREFIX}
            {detail?.name}
            {MOTION_DESIGN_TEXTS.QUOTE_END}
          </span>
        }>
        <div className="space-y-3 text-left">
          <textarea value={redesignBrief || ""} onChange={(e) => setRedesignBrief(e.target.value)} rows={5} className={cn(inputCls, MOTION_TEXT_RESIZE_NONE_LEADING_RELAXED)} />
          <p className="text-[11px] text-slate-400 leading-relaxed">{MOTION_DESIGN_TEXTS.REDESIGN_HINT}</p>
          <MotionModalActions onCancel={() => setRedesignBrief(null)} onConfirm={() => void submitRedesign()} cancelLabel={text.RESULTS_CANCEL} confirmLabel={MOTION_DESIGN_TEXTS.REDESIGN_CONFIRM} icon={<RefreshCw className="w-3.5 h-3.5" />} />
        </div>
      </Modal>
      <Modal
        isOpen={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        maxWidth="max-w-md"
        title={
          <span className="flex items-center gap-2 font-black uppercase text-sm tracking-wide text-rose-500">
            <Trash2 className="w-4 h-4 text-rose-500" />
            {MOTION_DESIGN_TEXTS.DELETE_TITLE}
          </span>
        }>
        <div className="space-y-4 text-left">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {MOTION_DESIGN_TEXTS.DELETE_PREFIX}
            <span className="font-extrabold text-slate-100">
              {MOTION_DESIGN_TEXTS.QUOTE_START}
              {toDelete?.name}
              {MOTION_DESIGN_TEXTS.QUOTE_END}
            </span>
            {MOTION_DESIGN_TEXTS.DELETE_HINT}
          </p>
          <MotionModalActions onCancel={() => setToDelete(null)} onConfirm={() => void confirmDelete()} cancelLabel={text.RESULTS_CANCEL} confirmLabel={text.DELETE} busy={deleting} danger />
        </div>
      </Modal>
      <Modal isOpen={!!zoom} onClose={() => setZoom(null)} maxWidth="max-w-4xl" title={MOTION_DESIGN_TEXTS.ZOOM_TITLE}>
        {zoom && <img src={motionDesignFileUrl(zoom)} alt={MOTION_TEXT_PREVIEW} className="w-full rounded-xl border border-slate-800" />}
      </Modal>
    </div>
  );
};
