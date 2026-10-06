import _ from "lodash";
import { Box, Cpu, Download, ExternalLink, HardDrive, Image as ImageIcon, Layers, Loader2, Mountain, Pencil, Play, Search, Sparkles, Trash2, Upload, User, X } from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_MUC,
  MOTION_TEMPLATE_SYMBOL_2,
  MOTION_TEMPLATE_SYMBOL_7,
  MOTION_TEMPLATE_SYMBOL_8,
  MOTION_TEMPLATE_SYMBOL_9,
  MOTION_TEMPLATE_THANH_CONG,
  MOTION_TEMPLATE_TYPE_SEARCH_CATEGORY_LIMIT_240,
  MOTION_TEXT_3D_MODEL,
  MOTION_TEXT_ALL,
  MOTION_TEXT_ANIMATION,
  MOTION_TEXT_ANIMATIONS,
  MOTION_TEXT_ASC,
  MOTION_TEXT_ATTACK,
  MOTION_TEXT_BAM,
  MOTION_TEXT_BAN_CO_CHAC_CHAN_MUON_XOA_MO_HINH,
  MOTION_TEXT_BAU_TROI_HDRI,
  MOTION_TEXT_BLANK,
  MOTION_TEXT_BUTTON,
  MOTION_TEXT_CATEGORIES,
  MOTION_TEXT_CC0_POLYHAVEN_COM,
  MOTION_TEXT_CHARACTER,
  MOTION_TEXT_CHARACTERS_2,
  MOTION_TEXT_CHARGE,
  MOTION_TEXT_CHAT_LIEU_PBR,
  MOTION_TEXT_CHEER,
  MOTION_TEXT_CHON_FILE_NHAN_VAT_LOAI,
  MOTION_TEXT_CHON_NHAN_VAT_YEU_THICH,
  MOTION_TEXT_CHON_WALKING_RUNNING_IDLE_TALKING_BAT,
  MOTION_TEXT_CHUA_CO_MO_HINH_CA_NHAN_NAO,
  MOTION_TEXT_COMPLETED,
  MOTION_TEXT_CO_LOI_XAY_RA_KHI_XOA,
  MOTION_TEXT_CRATE,
  MOTION_TEXT_CREATEDAT,
  MOTION_TEXT_DANCE,
  MOTION_TEXT_DANG_NHAP_ADOBE_MIEN_PHI_TAB,
  MOTION_TEXT_DA_LUU_BOI_CANH,
  MOTION_TEXT_DA_XOA_THANH_CONG,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_DESC,
  MOTION_TEXT_DIE,
  MOTION_TEXT_DOWNLOAD,
  MOTION_TEXT_DOWNLOAD_2,
  MOTION_TEXT_ENV,
  MOTION_TEXT_ENVS,
  MOTION_TEXT_FBX,
  MOTION_TEXT_FBX_BINARY,
  MOTION_TEXT_FIGHT,
  MOTION_TEXT_FILE,
  MOTION_TEXT_FORMAT,
  MOTION_TEXT_FREE,
  MOTION_TEXT_GLB_GLTF_FBX_ZIP_BIN_PNG_JPG_JPEG,
  MOTION_TEXT_GLTF_ZIP,
  MOTION_TEXT_GUIDE,
  MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC,
  MOTION_TEXT_HDRI,
  MOTION_TEXT_HDRIS,
  MOTION_TEXT_HDRI_2,
  MOTION_TEXT_HTTPS_POLYHAVEN_COM_LICENSE,
  MOTION_TEXT_HUY,
  MOTION_TEXT_ID_TEN,
  MOTION_TEXT_IMPORT,
  MOTION_TEXT_IN_PLACE,
  MOTION_TEXT_KEO_CA_FILE_ZIP_VAO_APP,
  MOTION_TEXT_KHONG_DOC_DUOC_MO_HINH,
  MOTION_TEXT_LAZY,
  MOTION_TEXT_LOC_DOWNLOADABLE_CC_BY_CC0_TAI_FILE,
  MOTION_TEXT_LOI,
  MOTION_TEXT_LUU,
  MOTION_TEXT_M,
  MOTION_TEXT_MAN_CASUAL,
  MOTION_TEXT_MAX_W_MD,
  MOTION_TEXT_MESH,
  MOTION_TEXT_MINE,
  MOTION_TEXT_MIXAMO_CC_BY,
  MOTION_TEXT_MIXAMO_COM,
  MOTION_TEXT_MODEL,
  MOTION_TEXT_MODELS,
  MOTION_TEXT_MOI_MO_HINH_NEN_DUOI_50_MB_DE,
  MOTION_TEXT_M_2,
  MOTION_TEXT_NAME,
  MOTION_TEXT_NHAN_VAT_2,
  MOTION_TEXT_NHAN_VAT_NGUOI_THAT_CHUYEN_DONG_MIEN_PHI,
  MOTION_TEXT_NHAP_MO_HINH,
  MOTION_TEXT_NOREFERRER,
  MOTION_TEXT_NUMBER,
  MOTION_TEXT_OK,
  MOTION_TEXT_POINT,
  MOTION_TEXT_POLYHAVEN,
  MOTION_TEXT_POLY_HAVEN,
  MOTION_TEXT_POSE,
  MOTION_TEXT_PUT,
  MOTION_TEXT_RUN,
  MOTION_TEXT_RUNNING,
  MOTION_TEXT_SIT,
  MOTION_TEXT_SKETCHFAB,
  MOTION_TEXT_SOFT,
  MOTION_TEXT_SOURCEID,
  MOTION_TEXT_STAND,
  MOTION_TEXT_SYMBOL,
  MOTION_TEXT_SYMBOL_10,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_17,
  MOTION_TEXT_SYMBOL_18,
  MOTION_TEXT_SYMBOL_19,
  MOTION_TEXT_SYMBOL_20,
  MOTION_TEXT_SYMBOL_21,
  MOTION_TEXT_SYMBOL_22,
  MOTION_TEXT_SYMBOL_23,
  MOTION_TEXT_SYMBOL_25,
  MOTION_TEXT_SYMBOL_47,
  MOTION_TEXT_SYMBOL_6,
  MOTION_TEXT_SYMBOL_7,
  MOTION_TEXT_TAB,
  MOTION_TEXT_TAB_THU_VIEN_MIEN_PHI_CAY_COI_BAU,
  MOTION_TEXT_TALK,
  MOTION_TEXT_TAM_GIAC,
  MOTION_TEXT_TAT_CA,
  MOTION_TEXT_TEXTURE,
  MOTION_TEXT_TEXTURES,
  MOTION_TEXT_TEXTURE_2,
  MOTION_TEXT_TRONG_UNG_DUNG_BAM,
  MOTION_TEXT_T_POSE,
  MOTION_TEXT_UNKNOWN,
  MOTION_TEXT_VAO,
  MOTION_TEXT_WALK,
  MOTION_TEXT_WITHOUT_SKIN,
  MOTION_TEXT_WITH_SKIN,
  MOTION_TEXT_XAC_NHAN_XOA,
  MOTION_TEXT_XE_CO_NHA_CUA_VU_KHI_CANH_QUAN,
  MOTION_TEXT_XOA,
  MOTION_TEXT_XUONG,
} from "../../constants/motionRuntime.js";
import { MOTION_FORM_CONTROL_CLASSNAME as inputCls } from "../../constants/motionVideo.js";
import type { MotionVideoTexts } from "../../constants/motionVideoTexts.js";
import { cn } from "../../lib/utils";
import type { MotionCatalog, MotionCharacterDef, MotionEnvironmentInfo, MotionPolyHavenAsset, MotionRealAsset, MotionRealJob, MotionRealKind, MotionRealManifest } from "../../types/motionVideo.js";
import { Modal } from "../ui/Modal";
import { formatBytes, motionRequest, type MotionEngineGlobal } from "./motionApi";
import { MotionField } from "./MotionField.js";
import { RealModelPreview, guessActionMap, guessKind, loadModelFiles, loadRealManifest, realFileUrl, toGLB, uploadRealModel, type LoadedModel } from "./motionReal";
type Tab = "mine" | "free" | "envs" | "guide";
type PhType = "hdris" | "textures" | "models";
const chip = (on: boolean) =>
  cn("px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer whitespace-nowrap transition-all shadow-2xs select-none", on ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-md shadow-purple-600/30 scale-[1.01]" : "border-slate-800 bg-slate-955/80 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900");
interface Props {
  ME: MotionEngineGlobal;
  catalog: MotionCatalog;
  custom: MotionCharacterDef[];
  envInfo: MotionEnvironmentInfo | null;
  text: MotionVideoTexts;
  onCustomChange?: () => void;
}
export const MotionRealAssetsPanel: FC<Props> = ({ ME, catalog, custom, envInfo, text, onCustomChange }) => {
  const T = text.REAL;
  const [tab, setTab] = useState<Tab>(MOTION_TEXT_MINE);
  const [data, setData] = useState<{
    manifest: MotionRealManifest;
    stats: { count: number; bytes: number };
    defaults: { hdris: string[]; textures: string[]; models: string[] };
  } | null>(null);
  const [job, setJob] = useState<MotionRealJob | null>(null);
  const [dialog, setDialog] = useState<{ model?: LoadedModel; item?: MotionRealAsset } | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<MotionRealAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const refresh = useCallback(async () => {
    try {
      setData(await loadRealManifest(ME));
    } catch (e: any) {
      toast.error(e?.message);
    }
  }, [ME]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!job || job.status !== MOTION_TEXT_RUNNING) return;
    const t = setTimeout(async () => {
      try {
        const r = await motionRequest<{ job: MotionRealJob }>(`${API_ROUTES.MOTION_REAL_JOB}${job.id}`);
        setJob(r.job);
        if (r.job.status !== MOTION_TEXT_RUNNING) {
          void refresh();
          if (r.job.status === MOTION_TEXT_COMPLETED) toast.success(MOTION_TEMPLATE_SYMBOL_8(`${r.job.label}`, `${r.job.done}`, `${r.job.total}`));
          else if (r.job.error) toast.error(r.job.error);
        } else if (r.job.done !== job.done) void refresh();
      } catch {
        setJob(null);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [job, refresh]);
  const startDownload = async (items: { type: PhType; id: string }[], label: string) => {
    try {
      const r = await motionRequest<{ job: MotionRealJob }>(API_ROUTES.MOTION_REAL_DOWNLOAD, { items, label });
      setJob(r.job);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  const starter = async () => {
    try {
      const r = await motionRequest<{ job: MotionRealJob }>(API_ROUTES.MOTION_REAL_STARTER, {});
      setJob(r.job);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoadingFile(true);
    try {
      const model = await loadModelFiles(Array.from(files));
      setDialog({ model });
    } catch (e: any) {
      toast.error(e?.message || MOTION_TEXT_KHONG_DOC_DUOC_MO_HINH);
    } finally {
      setLoadingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    try {
      await motionRequest(`${API_ROUTES.MOTION_REAL_ITEM}${assetToDelete.id}`, undefined, MOTION_TEXT_DELETE);
      setAssetToDelete(null);
      void refresh();
      toast.success(text.DONE || MOTION_TEXT_DA_XOA_THANH_CONG);
    } catch (e: any) {
      toast.error(e?.message || MOTION_TEXT_CO_LOI_XAY_RA_KHI_XOA);
    } finally {
      setIsDeleting(false);
    }
  };
  const items = data?.manifest.items || [];
  const gpu = envInfo?.browser ? (envInfo.gpu3d ? MOTION_TEXT_OK : MOTION_TEXT_SOFT) : MOTION_TEXT_UNKNOWN;
  return (
    <div className="w-full space-y-3.5 text-left">
      <div className="flex flex-wrap gap-2 shrink-0 items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-955/80 border border-slate-800">
          {_.map(
            [
              [MOTION_TEXT_MINE, T.MINE, User],
              [MOTION_TEXT_FREE, T.FREE, Download],
              [MOTION_TEXT_ENVS, T.ENVS, Mountain],
              [MOTION_TEXT_GUIDE, T.GUIDE, ExternalLink],
            ] as const,
            ([id, label, Icon]) => (
              <button key={id} type={MOTION_TEXT_BUTTON} onClick={() => setTab(id)} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", tab === id ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30 font-extrabold" : "text-slate-400 hover:text-white hover:bg-slate-900")}>
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-300 px-2.5 py-1 bg-slate-955/80 rounded-xl border border-slate-800">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>{data ? MOTION_TEMPLATE_MUC(`${data.stats.count}`, `${formatBytes(data.stats.bytes)}`) : MOTION_TEXT_SYMBOL}</span>
          </span>
          <span className={cn("hidden md:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-xl border", gpu === MOTION_TEXT_OK ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-bold" : gpu === MOTION_TEXT_SOFT ? "bg-purple-500/15 border-purple-500/30 text-purple-300 font-bold" : "bg-slate-955 border-slate-800 text-slate-400")}>
            <Cpu className="w-3.5 h-3.5" />
            <span>{gpu === MOTION_TEXT_OK ? T.GPU_OK : gpu === MOTION_TEXT_SOFT ? T.GPU_SOFT : T.GPU_UNKNOWN}</span>
          </span>
          <button type={MOTION_TEXT_BUTTON} onClick={starter} disabled={job?.status === MOTION_TEXT_RUNNING} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all cursor-pointer disabled:opacity-50">
            {job?.status === MOTION_TEXT_RUNNING ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{T.STARTER}</span>
          </button>
          <input ref={fileRef} type={MOTION_TEXT_FILE} multiple accept={MOTION_TEXT_GLB_GLTF_FBX_ZIP_BIN_PNG_JPG_JPEG} className="hidden" onChange={(e) => void onFiles(e.target.files)} />
          <button type={MOTION_TEXT_BUTTON} onClick={() => fileRef.current?.click()} disabled={loadingFile} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/25">
            {loadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{T.IMPORT}</span>
          </button>
        </div>
      </div>

      {job && (
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 shrink-0 shadow-xs">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all" style={{ width: `${(job.done / Math.max(1, job.total)) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>
              {job.status === MOTION_TEXT_RUNNING ? T.DOWNLOADING : job.status}
              {MOTION_TEXT_SYMBOL_10}
              {job.done}
              {MOTION_TEXT_SYMBOL_16}
              {job.total}
              {MOTION_TEXT_SYMBOL_10}
              {formatBytes(job.bytes)} {_.last(job.log) ? MOTION_TEMPLATE_SYMBOL_2(`${_.last(job.log)}`) : ""}
            </span>
            {job.status === MOTION_TEXT_RUNNING && (
              <button type={MOTION_TEXT_BUTTON} className="text-rose-500 hover:text-rose-400 cursor-pointer" onClick={() => motionRequest(`${API_ROUTES.MOTION_REAL_JOB}${job.id}`, undefined, MOTION_TEXT_DELETE).catch(_.noop)}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 w-full">
        {tab === MOTION_TEXT_MINE && <MineGrid items={items} T={T} onEdit={(item) => setDialog({ item })} onDelete={(it) => setAssetToDelete(it)} />}
        {tab === MOTION_TEXT_FREE && <PolyHavenBrowser T={T} job={job} onDownload={startDownload} installed={items} onEdit={(item) => setDialog({ item })} />}
        {tab === MOTION_TEXT_ENVS && data && <EnvOverrides ME={ME} catalog={catalog} manifest={data.manifest} T={T} onSaved={refresh} />}
        {tab === MOTION_TEXT_GUIDE && <Guide />}
      </div>

      {dialog && (
        <ImportDialog
          model={dialog.model}
          item={dialog.item}
          catalog={catalog}
          custom={custom}
          T={T}
          onClose={() => {
            dialog.model?.revoke();
            setDialog(null);
          }}
          onSaved={() => {
            dialog.model?.revoke();
            setDialog(null);
            void refresh();
            onCustomChange?.();
          }}
        />
      )}

      <Modal
        isOpen={Boolean(assetToDelete)}
        onClose={() => {
          if (!isDeleting) setAssetToDelete(null);
        }}
        maxWidth={MOTION_TEXT_MAX_W_MD}
        title={
          <div className="flex items-center gap-2 uppercase tracking-wider font-extrabold text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="uppercase font-extrabold tracking-wider">{MOTION_TEXT_XOA || MOTION_TEXT_XAC_NHAN_XOA}</span>
          </div>
        }>
        <div className="space-y-4 text-left">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {T.DELETE_CONFIRM || MOTION_TEXT_BAN_CO_CHAC_CHAN_MUON_XOA_MO_HINH}
            {MOTION_TEXT_SYMBOL_13}
            <span className="font-extrabold text-slate-100 px-1">
              {MOTION_TEXT_SYMBOL_47}
              {assetToDelete?.name}
              {MOTION_TEXT_SYMBOL_47}
            </span>
            {MOTION_TEXT_SYMBOL_25}
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">{MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC}</div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button type={MOTION_TEXT_BUTTON} disabled={isDeleting} onClick={() => setAssetToDelete(null)} className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 bg-slate-955 text-slate-300 hover:text-slate-100 cursor-pointer transition-colors">
              {text.RESULTS_CANCEL || MOTION_TEXT_HUY}
            </button>
            <button type={MOTION_TEXT_BUTTON} disabled={isDeleting} onClick={() => void handleConfirmDelete()} className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 inline-flex items-center gap-1.5">
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{MOTION_TEXT_XOA || MOTION_TEXT_XOA}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
const kindLabel = (T: MotionVideoTexts["REAL"], k: MotionRealKind) => ({ character: T.KIND_CHARACTER, model: T.KIND_MODEL, animation: T.KIND_ANIMATION, hdri: T.KIND_HDRI, texture: T.KIND_TEXTURE })[k] || k;
const MineGrid: FC<{
  items: MotionRealAsset[];
  T: MotionVideoTexts["REAL"];
  onEdit: (it: MotionRealAsset) => void;
  onDelete: (it: MotionRealAsset) => void;
}> = ({ items, T, onEdit, onDelete }) => {
  const [kind, setKind] = useState<MotionRealKind | "all">(MOTION_TEXT_ALL);
  const list = _.orderBy(
    _.filter(items, (it) => kind === MOTION_TEXT_ALL || it.kind === kind),
    [(it) => (it.source === MOTION_TEXT_IMPORT ? 0 : 1), MOTION_TEXT_CREATEDAT],
    [MOTION_TEXT_ASC, MOTION_TEXT_DESC],
  );
  if (!items.length) {
    return (
      <div className="glass-card rounded-2xl p-12 border border-slate-800/80 bg-slate-900/60 text-center text-xs text-slate-400 flex-1 min-h-[420px] flex items-center justify-center flex-col gap-3 shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-slate-955 border border-slate-800 flex items-center justify-center mb-1">
          <Box className="w-7 h-7 text-purple-400" />
        </div>
        <span className="font-extrabold text-slate-100 text-sm">{MOTION_TEXT_CHUA_CO_MO_HINH_CA_NHAN_NAO}</span>
        <span className="max-w-md leading-relaxed text-slate-400">{T.EMPTY_MINE}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap gap-1.5 shrink-0 items-center">
        {_.map([MOTION_TEXT_ALL, MOTION_TEXT_CHARACTER, MOTION_TEXT_MODEL, MOTION_TEXT_ANIMATION, MOTION_TEXT_HDRI, MOTION_TEXT_TEXTURE] as const, (k) => (
          <button key={k} type={MOTION_TEXT_BUTTON} className={chip(kind === k)} onClick={() => setKind(k)}>
            {k === MOTION_TEXT_ALL ? MOTION_TEXT_TAT_CA : kindLabel(T, k)}
            {MOTION_TEXT_SYMBOL_6}
            {k === MOTION_TEXT_ALL ? items.length : _.filter(items, { kind: k }).length}
            {MOTION_TEXT_SYMBOL_7}
          </button>
        ))}
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5 pb-4">
          {_.map(list, (it) => (
            <div key={it.id} className="rounded-2xl border border-slate-800 bg-slate-955/80 overflow-hidden flex flex-col shadow-xs hover:border-purple-500/50 hover:shadow-lg transition-all group">
              <div className="h-36 sm:h-40 bg-slate-900/90 flex items-center justify-center relative overflow-hidden shrink-0 border-b border-slate-800/60">
                {it.thumb ? <img src={realFileUrl(it.thumb)} alt={it.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading={MOTION_TEXT_LAZY} /> : <Box className="w-8 h-8 text-slate-600" />}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-950/80 text-purple-300 border border-purple-500/30 backdrop-blur-md font-mono font-bold shadow-xs">{kindLabel(T, it.kind)}</span>
                </div>
                <div className="absolute bottom-2 right-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-slate-200 backdrop-blur-md font-mono">{formatBytes(it.bytes)}</span>
                </div>
              </div>

              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-100 line-clamp-1 group-hover:text-purple-400 transition-colors" title={it.name}>
                    {it.name}
                  </div>
                  {!!(it.bind?.length || it.newId) && (
                    <div className="text-[10px] text-purple-300 font-mono font-bold truncate mt-1 bg-purple-500/15 px-1.5 py-0.5 rounded-md border border-purple-500/30" title={_.filter([...(it.bind || []), it.newId], Boolean).join(MOTION_TEXT_SYMBOL_14)}>
                      {MOTION_TEXT_SYMBOL_17}
                      {_.filter([...(it.bind || []), it.newId], Boolean).join(MOTION_TEXT_SYMBOL_14)}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  {it.kind !== MOTION_TEXT_HDRI && it.kind !== MOTION_TEXT_TEXTURE ? (
                    <button type={MOTION_TEXT_BUTTON} title={T.EDIT} onClick={() => onEdit(it)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 hover:border-purple-400/60 cursor-pointer transition-all text-[11px] font-bold shadow-2xs">
                      <Pencil className="w-3.5 h-3.5 text-purple-400" />
                      <span>{T.EDIT}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono italic">{it.kind === MOTION_TEXT_HDRI ? MOTION_TEXT_BAU_TROI_HDRI : MOTION_TEXT_CHAT_LIEU_PBR}</span>
                  )}
                  <button type={MOTION_TEXT_BUTTON} title={MOTION_TEXT_XOA} onClick={() => onDelete(it)} className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors shrink-0 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const PolyHavenBrowser: FC<{
  T: MotionVideoTexts["REAL"];
  job: MotionRealJob | null;
  installed: MotionRealAsset[];
  onDownload: (items: { type: PhType; id: string }[], label: string) => void;
  onEdit: (it: MotionRealAsset) => void;
}> = ({ T, job, installed, onDownload, onEdit }) => {
  const [type, setType] = useState<PhType>(MOTION_TEXT_MODELS);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [list, setList] = useState<MotionPolyHavenAsset[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let off = false;
    setList(null);
    setErr("");
    const t = setTimeout(async () => {
      try {
        const r = await motionRequest<{ items: MotionPolyHavenAsset[] }>(MOTION_TEMPLATE_TYPE_SEARCH_CATEGORY_LIMIT_240(`${API_ROUTES.MOTION_REAL_POLYHAVEN}`, `${type}`, `${encodeURIComponent(q)}`, `${encodeURIComponent(cat)}`));
        if (!off) setList(r.items);
      } catch (e: any) {
        if (!off) setErr(e?.message || MOTION_TEXT_POLY_HAVEN);
      }
    }, 300);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [type, q, cat]);
  const cats = useMemo(() => _.take(_.map(_.orderBy(_.toPairs(_.countBy(_.flatMap(list || [], MOTION_TEXT_CATEGORIES))), [1], [MOTION_TEXT_DESC]), 0), 18), [list]);
  const have = useMemo(() => _.keyBy(_.filter(installed, { source: MOTION_TEXT_POLYHAVEN }), MOTION_TEXT_SOURCEID), [installed]);
  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap gap-2 items-center shrink-0">
        {_.map(
          [
            [MOTION_TEXT_MODELS, T.MODELS, Layers],
            [MOTION_TEXT_HDRIS, T.HDRI, Mountain],
            [MOTION_TEXT_TEXTURES, T.TEXTURES, ImageIcon],
          ] as const,
          ([id, label, Icon]) => (
            <button key={id} type={MOTION_TEXT_BUTTON} className={chip(type === id)} onClick={() => (setType(id), setCat(""))}>
              <Icon className="w-3.5 h-3.5 inline -mt-0.5 mr-1.5" />
              <span>{label}</span>
            </button>
          ),
        )}
        <div className="h-10 flex-1 min-w-[200px] flex items-center gap-2 px-3.5 rounded-xl bg-slate-955/80 border border-slate-800 focus-within:border-purple-500/60 transition-colors shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={T.SEARCH}
            className="flex-1 h-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-bold outline-none border-0 border-none shadow-none placeholder:text-slate-500 dark:placeholder:text-slate-400 search-input-clean"
            style={{ background: "transparent", backgroundColor: "transparent", border: "none", boxShadow: "none", outline: "none" }}
          />
        </div>
        <a href={MOTION_TEXT_HTTPS_POLYHAVEN_COM_LICENSE} target={MOTION_TEXT_BLANK} rel={MOTION_TEXT_NOREFERRER} className="text-xs text-slate-400 hover:text-purple-300 font-mono flex items-center gap-1 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>{MOTION_TEXT_CC0_POLYHAVEN_COM}</span>
        </a>
      </div>

      <div className="flex flex-wrap gap-1.5 shrink-0">
        <button type={MOTION_TEXT_BUTTON} className={chip(!cat)} onClick={() => setCat("")}>
          {MOTION_TEXT_TAT_CA}
        </button>
        {_.map(cats, (c) => (
          <button key={c} type={MOTION_TEXT_BUTTON} className={chip(cat === c)} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {err && <div className="text-xs text-rose-400 shrink-0 font-bold">{err}</div>}
      {!list && !err && (
        <div className="flex-1 flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
        </div>
      )}

      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pb-4">
          {_.map(list || [], (a) => {
            const it = have[a.id];
            return (
              <div key={a.id} className="rounded-2xl border border-slate-800 bg-slate-955/80 overflow-hidden shadow-xs hover:border-purple-500/50 hover:shadow-lg transition-all flex flex-col group">
                <div className={cn("bg-slate-900/90 overflow-hidden relative shrink-0", type === MOTION_TEXT_HDRIS ? "h-28" : "h-36 sm:h-40")}>
                  <img src={a.thumb} alt={a.name} loading={MOTION_TEXT_LAZY} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-950/80 text-purple-300 border border-purple-500/30 backdrop-blur-md font-mono font-bold shadow-xs capitalize">{type === MOTION_TEXT_HDRIS ? MOTION_TEXT_HDRI_2 : type === MOTION_TEXT_TEXTURES ? MOTION_TEXT_TEXTURE_2 : MOTION_TEXT_3D_MODEL}</span>
                  </div>
                </div>

                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="text-xs font-extrabold text-slate-100 line-clamp-1 group-hover:text-purple-400 transition-colors" title={MOTION_TEMPLATE_SYMBOL_7(`${a.name}`, `${a.categories.join(MOTION_TEXT_SYMBOL_14)}`)}>
                    {a.name}
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    {it ? (
                      <div className="flex gap-1.5">
                        <span className="flex-1 text-center text-[10px] py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center justify-center gap-1">
                          {MOTION_TEXT_SYMBOL_18}
                          {T.INSTALLED}
                        </span>
                        {it.kind === MOTION_TEXT_MODEL && (
                          <button type={MOTION_TEXT_BUTTON} title={T.EDIT} onClick={() => onEdit(it)} className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-300 hover:text-purple-300 border border-slate-800 cursor-pointer transition-colors shadow-2xs font-bold">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type={MOTION_TEXT_BUTTON}
                        disabled={job?.status === MOTION_TEXT_RUNNING}
                        onClick={() => onDownload([{ type, id: a.id }], a.name)}
                        className="w-full text-xs py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white hover:brightness-110 disabled:opacity-40 cursor-pointer font-black shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>{T.DOWNLOAD}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
const EnvOverrides: FC<{
  ME: MotionEngineGlobal;
  catalog: MotionCatalog;
  manifest: MotionRealManifest;
  T: MotionVideoTexts["REAL"];
  onSaved: () => void;
}> = ({ ME, catalog, manifest, T, onSaved }) => {
  const R = (ME as any).REAL;
  const hdris = _.filter(manifest.items, { kind: MOTION_TEXT_HDRI });
  const textures = _.filter(manifest.items, { kind: MOTION_TEXT_TEXTURE });
  const save = async (envId: string, patch: Record<string, unknown>) => {
    const cur = { ...(manifest.envs[envId] || {}), ...patch };
    const clean = _.omitBy(cur, (v) => v === "" || v == null);
    try {
      await motionRequest(API_ROUTES.MOTION_REAL_ENV, { envId, override: clean });
      onSaved();
      toast.success(T.SAVE ? MOTION_TEMPLATE_THANH_CONG(`${T.SAVE}`) : MOTION_TEXT_DA_LUU_BOI_CANH);
    } catch (e: any) {
      toast.error(e?.message);
    }
  };
  const groundKeyOf = (texId: string) => _.findKey(R?.TEX || {}, (v: any) => v.id === texId) || "";
  return (
    <div className="space-y-3 flex-1 flex flex-col min-h-0 w-full">
      <p className="text-xs text-slate-400 shrink-0 leading-relaxed font-medium">{T.ENV_HINT}</p>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-slate-800 rounded-2xl bg-slate-900/60 shadow-sm">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase font-mono font-bold text-slate-400 sticky top-0 bg-slate-900/95 z-10 border-b border-slate-800">
            <tr>
              <th className="text-left py-3 px-4">{MOTION_TEXT_ENV}</th>
              <th className="text-left py-3 px-4">{T.ENV_SKY}</th>
              <th className="text-left py-3 px-4">{T.ENV_GROUND}</th>
            </tr>
          </thead>
          <tbody>
            {_.map(catalog.environments, (e) => {
              const recipe = R?.recipe ? R.recipe(e.id) : null;
              const over = manifest.envs[e.id] || {};
              if (!recipe) return null;
              return (
                <tr key={e.id} className="border-b border-slate-800/70 hover:bg-slate-950/40">
                  <td className="py-3 px-4">
                    <div className="text-slate-100 font-extrabold">{e.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-bold">{e.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select className={inputCls} value={over.hdri || ""} onChange={(ev) => void save(e.id, { hdri: ev.target.value })}>
                      <option value="">
                        {T.DEFAULT}
                        {MOTION_TEXT_SYMBOL_6}
                        {recipe.sky || MOTION_TEXT_SYMBOL_19}
                        {MOTION_TEXT_SYMBOL_7}
                      </option>
                      {_.map(hdris, (h) => (
                        <option key={h.id} value={h.sourceId}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select className={inputCls} value={over.ground || ""} onChange={(ev) => void save(e.id, { ground: ev.target.value })}>
                      <option value="">
                        {T.DEFAULT}
                        {MOTION_TEXT_SYMBOL_6}
                        {recipe.ground}
                        {MOTION_TEXT_SYMBOL_7}
                      </option>
                      {_.map(textures, (t) => {
                        const key = groundKeyOf(_.toString(t.sourceId));
                        return key ? (
                          <option key={t.id} value={key}>
                            {t.name}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const Guide: FC = () => (
  <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/60 grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed flex-1 min-h-[380px] shadow-lg">
    <div className="space-y-3 bg-slate-955/80 p-5 rounded-2xl border border-slate-800">
      <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
        <User className="w-4 h-4 text-purple-400" />
        <span>{MOTION_TEXT_NHAN_VAT_NGUOI_THAT_CHUYEN_DONG_MIEN_PHI}</span>
      </h3>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          {MOTION_TEXT_VAO}
          <b className="text-purple-300">{MOTION_TEXT_MIXAMO_COM}</b>
          {MOTION_TEXT_DANG_NHAP_ADOBE_MIEN_PHI_TAB}
          <b className="text-purple-300">{MOTION_TEXT_CHARACTERS_2}</b>
          {MOTION_TEXT_CHON_NHAN_VAT_YEU_THICH}
        </li>
        <li>
          {MOTION_TEXT_BAM}
          <b className="text-purple-300">{MOTION_TEXT_DOWNLOAD}</b>
          {MOTION_TEXT_FORMAT}
          <b className="text-purple-300">{MOTION_TEXT_FBX_BINARY}</b>
          {MOTION_TEXT_POSE}
          <b className="text-purple-300">{MOTION_TEXT_T_POSE}</b>
          {MOTION_TEXT_SYMBOL_14}
          <b className="text-purple-300">{MOTION_TEXT_WITH_SKIN}</b>
          {MOTION_TEXT_SYMBOL_20}
        </li>
        <li>
          {MOTION_TEXT_TAB}
          <b className="text-purple-300">{MOTION_TEXT_ANIMATIONS}</b>
          {MOTION_TEXT_CHON_WALKING_RUNNING_IDLE_TALKING_BAT}
          <b className="text-purple-300">{MOTION_TEXT_IN_PLACE}</b>
          {MOTION_TEXT_DOWNLOAD_2}
          <b className="text-purple-300">{MOTION_TEXT_FBX}</b>
          {MOTION_TEXT_SYMBOL_14}
          <b className="text-purple-300">{MOTION_TEXT_WITHOUT_SKIN}</b>
          {MOTION_TEXT_SYMBOL_20}
        </li>
        <li>
          {MOTION_TEXT_TRONG_UNG_DUNG_BAM}
          <b className="text-purple-300">{MOTION_TEXT_NHAP_MO_HINH}</b>
          {MOTION_TEXT_CHON_FILE_NHAN_VAT_LOAI}
          <b className="text-purple-300">{MOTION_TEXT_NHAN_VAT_2}</b>
          {MOTION_TEXT_LUU}
        </li>
      </ol>
    </div>

    <div className="space-y-3 bg-slate-955/80 p-5 rounded-2xl border border-slate-800">
      <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
        <Box className="w-4 h-4 text-purple-400" />
        <span>{MOTION_TEXT_XE_CO_NHA_CUA_VU_KHI_CANH_QUAN}</span>
      </h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <b className="text-purple-300">{MOTION_TEXT_SKETCHFAB}</b>
          {MOTION_TEXT_LOC_DOWNLOADABLE_CC_BY_CC0_TAI_FILE}
          <b className="text-purple-300">{MOTION_TEXT_GLTF_ZIP}</b>
          {MOTION_TEXT_KEO_CA_FILE_ZIP_VAO_APP}
        </li>
        <li>
          <b className="text-purple-300">{MOTION_TEXT_POLY_HAVEN}</b>
          {MOTION_TEXT_TAB_THU_VIEN_MIEN_PHI_CAY_COI_BAU}
        </li>
        <li>{MOTION_TEXT_MOI_MO_HINH_NEN_DUOI_50_MB_DE}</li>
      </ul>
    </div>
  </div>
);
const ImportDialog: FC<{
  model?: LoadedModel;
  item?: MotionRealAsset;
  catalog: MotionCatalog;
  custom: MotionCharacterDef[];
  T: MotionVideoTexts["REAL"];
  onClose: () => void;
  onSaved: () => void;
}> = ({ model, item, catalog, custom, T, onClose, onSaved }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<RealModelPreview | null>(null);
  const clips = useMemo(() => (model ? _.map(model.animations, MOTION_TEXT_NAME) : item?.clips || []), [model, item]);
  const [form, setForm] = useState(() => ({
    name: item?.name || model?.name || "",
    kind: (item?.kind || (model ? guessKind(model) : MOTION_TEXT_MODEL)) as MotionRealKind,
    size: item?.size ?? (model ? (guessKind(model) === MOTION_TEXT_CHARACTER ? 1.78 : 0) : 0),
    yaw: item?.yaw || 0,
    bind: item?.bind || [],
    newEntry: false,
    newId: "",
    base: "",
    license: item?.license || "",
    author: item?.author || "",
    actionMap: item?.actionMap || guessActionMap(clips),
  }));
  const [clip, setClip] = useState<string>("");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));
  useEffect(() => {
    if (!model || !canvasRef.current) return;
    const pv = new RealModelPreview(canvasRef.current);
    previewRef.current = pv;
    return () => {
      pv.dispose();
      previewRef.current = null;
    };
  }, [model]);
  useEffect(() => {
    if (!model || !previewRef.current) return;
    previewRef.current.setModel(model, { size: form.size, yaw: form.yaw, kind: form.kind });
    previewRef.current.playClip(model, clip || form.actionMap.walk || clips[0]);
  }, [model, form.size, form.yaw, form.kind, clip, form.actionMap.walk, clips]);
  const charOptions = useMemo(() => [...custom, ...catalog.characters], [custom, catalog]);
  const assetOptions = catalog.assets;
  const options = form.kind === MOTION_TEXT_CHARACTER ? charOptions : assetOptions;
  const filtered = _.take(
    _.filter(options, (o: any) => !q || _.includes(_.toLower(MOTION_TEMPLATE_SYMBOL_9(`${o.id}`, `${o.name}`, `${(o.tags || []).join(MOTION_TEXT_SYMBOL_13)}`)), _.toLower(q))),
    120,
  );
  const toggleBind = (id: string) => set({ bind: _.includes(form.bind, id) ? _.without(form.bind, id) : [...form.bind, id] });
  const save = async () => {
    setSaving(true);
    try {
      const meta: Record<string, unknown> = {
        name: form.name,
        kind: form.kind,
        size: form.size,
        yaw: form.yaw,
        bind: form.bind,
        license: form.license,
        author: form.author,
        actionMap: form.kind === MOTION_TEXT_CHARACTER ? form.actionMap : undefined,
        clips,
      };
      if (form.newEntry) {
        if (form.kind === MOTION_TEXT_CHARACTER) _.assign(meta, { newCharacter: true, base: form.base || MOTION_TEXT_MAN_CASUAL });
        else
          _.assign(meta, {
            newId: form.newId,
            base: form.base || MOTION_TEXT_CRATE,
            category: _.find(assetOptions, { id: form.base })?.category,
          });
      }
      if (model) {
        meta.thumb = previewRef.current?.snapshot(256, 256);
        const glb = await toGLB(model);
        await uploadRealModel(glb, meta);
      } else if (item) {
        await motionRequest(`${API_ROUTES.MOTION_REAL_ITEM}${item.id}`, { item: meta }, MOTION_TEXT_PUT);
      }
      toast.success(form.name);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || MOTION_TEXT_LOI);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 text-left" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Box className="w-4 h-4 text-purple-400" />
              <span>{model ? T.IMPORT : T.EDIT}</span>
            </h3>
            <button type={MOTION_TEXT_BUTTON} onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {model ? (
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-955 shadow-inner">
              <canvas ref={canvasRef} className="w-full block" style={{ height: 340 }} />
            </div>
          ) : (
            item?.thumb && <img src={realFileUrl(item.thumb)} alt={item.name} className="w-56 rounded-2xl border border-slate-800 shadow-md" />
          )}

          {model && (
            <div className="text-[11px] font-mono text-slate-300 bg-slate-955 p-2.5 rounded-xl border border-slate-800 font-medium">
              {T.STATS}
              {MOTION_TEXT_SYMBOL_21}
              {model.stats.meshes}
              {MOTION_TEXT_MESH}
              {model.stats.triangles.toLocaleString()}
              {MOTION_TEXT_TAM_GIAC}
              {model.stats.bones}
              {MOTION_TEXT_XUONG}
              {_.map(model.stats.size, (v) => v.toFixed(2)).join(MOTION_TEXT_SYMBOL_22)}
              {MOTION_TEXT_M}
            </div>
          )}

          {!!clips.length && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{T.CLIPS}</div>
              <div className="flex flex-wrap gap-1.5">
                {_.map(clips, (c) => (
                  <button key={c} type={MOTION_TEXT_BUTTON} className={chip(clip === c)} onClick={() => setClip(c)}>
                    <Play className="w-3 h-3 inline -mt-0.5 mr-1" />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.kind === MOTION_TEXT_CHARACTER && !_.isEmpty(clips) && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{T.ACTION_MAP}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {_.map([MOTION_TEXT_STAND, MOTION_TEXT_WALK, MOTION_TEXT_RUN, MOTION_TEXT_TALK, MOTION_TEXT_SIT, MOTION_TEXT_POINT, MOTION_TEXT_FIGHT, MOTION_TEXT_ATTACK, MOTION_TEXT_CHARGE, MOTION_TEXT_DIE, MOTION_TEXT_CHEER, MOTION_TEXT_DANCE], (act) => (
                  <label key={act} className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                    <span className="w-12 font-mono">{act}</span>
                    <select
                      className={inputCls}
                      value={form.actionMap[act] || ""}
                      onChange={(e) =>
                        set({
                          actionMap: _.omitBy({ ...form.actionMap, [act]: e.target.value }, (v) => !v) as Record<string, string>,
                        })
                      }>
                      <option value="">{MOTION_TEXT_SYMBOL_19}</option>
                      {_.map(clips, (c) => (
                        <option key={c} value={c} className="bg-slate-900 text-slate-100">
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3.5">
          <MotionField className="block space-y-1" labelClassName="text-[10px] font-mono font-bold uppercase text-slate-400" label={<>{T.NAME}</>}>
            <input className={inputCls} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </MotionField>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{T.KIND}</span>
            <div className="flex flex-wrap gap-1.5">
              {_.map([MOTION_TEXT_CHARACTER, MOTION_TEXT_MODEL, MOTION_TEXT_ANIMATION] as const, (k) => (
                <button key={k} type={MOTION_TEXT_BUTTON} className={chip(form.kind === k)} onClick={() => set({ kind: k, bind: [] })} disabled={!!item && item.source !== MOTION_TEXT_IMPORT}>
                  {kindLabel(T, k)}
                </button>
              ))}
            </div>
          </div>

          {form.kind !== MOTION_TEXT_ANIMATION && (
            <>
              <MotionField
                className="block space-y-1"
                labelClassName="text-[10px] font-mono font-bold uppercase text-slate-400"
                label={
                  <>
                    {T.SIZE}
                    {MOTION_TEXT_M_2}
                  </>
                }>
                <input type={MOTION_TEXT_NUMBER} min={0} step={0.05} className={inputCls} value={form.size} onChange={(e) => set({ size: _.toNumber(e.target.value) || 0 })} />
              </MotionField>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{T.FACING}</span>
                <div className="flex gap-1.5">
                  {_.map([0, 90, 180, 270], (y) => (
                    <button key={y} type={MOTION_TEXT_BUTTON} className={chip(((form.yaw % 360) + 360) % 360 === y)} onClick={() => set({ yaw: y })}>
                      {y}
                      {MOTION_TEXT_SYMBOL_23}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{T.BIND}</span>
                <p className="text-[10px] text-slate-400">{T.BIND_HINT}</p>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-955 border border-slate-800">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent text-xs text-slate-100 font-bold outline-none placeholder:text-slate-500" placeholder={MOTION_TEXT_ID_TEN} />
                </div>
                <div className="max-h-36 overflow-y-auto custom-scrollbar flex flex-wrap gap-1 pt-1">
                  {_.map(filtered, (o: any) => (
                    <button key={o.id} type={MOTION_TEXT_BUTTON} className={chip(_.includes(form.bind, o.id))} onClick={() => toggleBind(o.id)} title={o.id}>
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <MotionField className="block space-y-1" labelClassName="text-[10px] font-mono font-bold uppercase text-slate-400" label={<>{T.LICENSE}</>}>
              <input className={inputCls} value={form.license} onChange={(e) => set({ license: e.target.value })} placeholder={MOTION_TEXT_MIXAMO_CC_BY} />
            </MotionField>
            <MotionField className="block space-y-1" labelClassName="text-[10px] font-mono font-bold uppercase text-slate-400" label={<>{T.AUTHOR}</>}>
              <input className={inputCls} value={form.author} onChange={(e) => set({ author: e.target.value })} />
            </MotionField>
          </div>

          <button type={MOTION_TEXT_BUTTON} onClick={() => void save()} disabled={saving || !form.name} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/25 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{saving ? T.SAVING : T.SAVE}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
