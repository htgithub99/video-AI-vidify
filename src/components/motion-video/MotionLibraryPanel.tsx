import _ from "lodash";
import { Box, Car, Check, Clapperboard, Copy, Footprints, Landmark, Mountain, Package, Palette, Pencil, Plus, Search, Trash2, Trees, User, X } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_2,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEMPLATE_SYMBOL_5,
  MOTION_TEMPLATE_SYMBOL_6,
  MOTION_TEMPLATE_SYMBOL_7,
  MOTION_TEXT_2D,
  MOTION_TEXT_2D3748,
  MOTION_TEXT_2D_2_5D,
  MOTION_TEXT_2_5D,
  MOTION_TEXT_3D,
  MOTION_TEXT_3D_2,
  MOTION_TEXT_3D_MODEL_2,
  MOTION_TEXT_3D_MO_HINH,
  MOTION_TEXT_4A5568,
  MOTION_TEXT_888888,
  MOTION_TEXT_ACTIONS,
  MOTION_TEXT_ADULT,
  MOTION_TEXT_AGE,
  MOTION_TEXT_ASSET,
  MOTION_TEXT_BAN_CO_CHAC_CHAN_MUON_XOA_NHAN_VAT,
  MOTION_TEXT_BUILD,
  MOTION_TEXT_BUILTIN,
  MOTION_TEXT_BUTTON,
  MOTION_TEXT_CASUAL,
  MOTION_TEXT_CHARACTER,
  MOTION_TEXT_CHARACTERS,
  MOTION_TEXT_CHON_MOT_NHAN_VAT_HOAC_DO_VAT_DE,
  MOTION_TEXT_COLOR,
  MOTION_TEXT_CREATEDAT,
  MOTION_TEXT_DANH_MUC_KHO,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DELETE,
  MOTION_TEXT_DONG_TAC,
  MOTION_TEXT_DONG_TAC_VA_HANG_TRAM_BOI_CANH_2,
  MOTION_TEXT_ENVIRONMENTS,
  MOTION_TEXT_GENDER,
  MOTION_TEXT_HAIR,
  MOTION_TEXT_HANH_DONG_MAU,
  MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC,
  MOTION_TEXT_HEADWEAR,
  MOTION_TEXT_HOAT_HINH,
  MOTION_TEXT_HUY,
  MOTION_TEXT_ID,
  MOTION_TEXT_KHO_CHUA_HON,
  MOTION_TEXT_KHO_HOAT_HINH,
  MOTION_TEXT_LIB_ACTIONS,
  MOTION_TEXT_LIB_CHARACTERS,
  MOTION_TEXT_LIB_ENVIRONMENTS,
  MOTION_TEXT_LIB_NATURE,
  MOTION_TEXT_LIB_PROPS,
  MOTION_TEXT_LIB_TEMPLATES,
  MOTION_TEXT_LIB_URBAN,
  MOTION_TEXT_LIB_VEHICLES,
  MOTION_TEXT_MALE,
  MOTION_TEXT_MAN_CASUAL,
  MOTION_TEXT_MAX_W_MD,
  MOTION_TEXT_MOI,
  MOTION_TEXT_MOTION_LIBRARY_VIEW,
  MOTION_TEXT_NATURE,
  MOTION_TEXT_NHAN_VAT,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NORMAL,
  MOTION_TEXT_OUTFIT,
  MOTION_TEXT_PHANG_ANH_SANG_MEM,
  MOTION_TEXT_PHOTOGRAPHER,
  MOTION_TEXT_POST,
  MOTION_TEXT_PREVIEW,
  MOTION_TEXT_PROPS,
  MOTION_TEXT_PUT,
  MOTION_TEXT_RANGE,
  MOTION_TEXT_SHORT,
  MOTION_TEXT_STAND,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_15,
  MOTION_TEXT_SYMBOL_25,
  MOTION_TEXT_SYMBOL_39,
  MOTION_TEXT_SYMBOL_47,
  MOTION_TEXT_SYMBOL_6,
  MOTION_TEXT_SYMBOL_7,
  MOTION_TEXT_TAG_PHAN_LOAI_CACH_NHAU_BANG_DAU_PHAY,
  MOTION_TEXT_TEMPLATES,
  MOTION_TEXT_TEN_NHAN_VAT,
  MOTION_TEXT_THOI_DIEM,
  MOTION_TEXT_TOON,
  MOTION_TEXT_TOON_FLAT,
  MOTION_TEXT_TOON_LINE,
  MOTION_TEXT_UPDATEDAT,
  MOTION_TEXT_URBAN,
  MOTION_TEXT_VEHICLES,
  MOTION_TEXT_VIEN_NET,
  MOTION_TEXT_WALK,
  MOTION_TEXT_XAC_NHAN_XOA,
  MOTION_TEXT_XEM_THU_MO_HINH,
  MOTION_TEXT_XEM_TRUOC_CHI_TIET,
  MOTION_TEXT_XOA,
} from "../../constants/motionRuntime.js";
import { MOTION_FORM_CONTROL_CLASSNAME as selectCls } from "../../constants/motionVideo.js";
import { MOTION_CHARACTER_OPTIONS, MOTION_LIBRARY_GROUPS, type MotionVideoTexts } from "../../constants/motionVideoTexts.js";
import { cn } from "../../lib/utils";
import type { MotionCatalog, MotionCharacterDef } from "../../types/motionVideo.js";
import { Modal } from "../ui/Modal";
import { motionRequest, type MotionEngineGlobal } from "./motionApi";
import { MotionModalActions } from "./MotionModalActions";
import { MotionField as Field } from "./MotionField.js";
import { MotionCharacterLive, MotionLazyThumb, MotionLive3D } from "./MotionLivePreview";
import { getMotionToonActions, getMotionToonTimes } from "./motionOptions.js";
import { assetThumb, assetThumb3D, characterThumb, characterThumb3D, environmentThumb, environmentThumb3D, has3D, toonApi, toonAssetThumb, toonCharacterThumb, toonEnvironmentThumb } from "./motionThumbs";
type Category = "characters" | "actions" | "vehicles" | "nature" | "urban" | "props" | "environments" | "templates";
const CATS: { id: Category; icon: typeof User; key: keyof MotionVideoTexts }[] = [
  { id: MOTION_TEXT_CHARACTERS, icon: User, key: MOTION_TEXT_LIB_CHARACTERS },
  { id: MOTION_TEXT_ACTIONS, icon: Footprints, key: MOTION_TEXT_LIB_ACTIONS },
  { id: MOTION_TEXT_VEHICLES, icon: Car, key: MOTION_TEXT_LIB_VEHICLES },
  { id: MOTION_TEXT_NATURE, icon: Trees, key: MOTION_TEXT_LIB_NATURE },
  { id: MOTION_TEXT_URBAN, icon: Landmark, key: MOTION_TEXT_LIB_URBAN },
  { id: MOTION_TEXT_PROPS, icon: Package, key: MOTION_TEXT_LIB_PROPS },
  { id: MOTION_TEXT_ENVIRONMENTS, icon: Mountain, key: MOTION_TEXT_LIB_ENVIRONMENTS },
  { id: MOTION_TEXT_TEMPLATES, icon: Clapperboard, key: MOTION_TEXT_LIB_TEMPLATES },
];
interface Props {
  ME: MotionEngineGlobal;
  catalog: MotionCatalog;
  custom: MotionCharacterDef[];
  onCustomChange: (items: MotionCharacterDef[]) => void;
  text: MotionVideoTexts;
  toonStyle?: string;
  onToonStyle?: (style: string) => void;
}
type View = "2d" | "3d" | "toon";
const VIEW_KEY = MOTION_TEXT_MOTION_LIBRARY_VIEW;
const readView = (): View => {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === MOTION_TEXT_TOON) return MOTION_TEXT_TOON;
    if (saved === MOTION_TEXT_3D) return MOTION_TEXT_3D;
    return MOTION_TEXT_2D;
  } catch {
    return MOTION_TEXT_2D;
  }
};
const has3DModel = (ME: MotionEngineGlobal, id: string) => !!(ME as unknown as { T3?: { has3D?: (id: string) => boolean } }).T3?.has3D?.(id);
const matches = (q: string, ...fields: unknown[]) => {
  if (!q) return true;
  const hay = _.toLower(_.deburr(_.flattenDeep(fields as any[]).join(MOTION_TEXT_SYMBOL_13)));
  return _.every(_.compact(_.toLower(_.deburr(q)).split(/\s+/)), (w) => _.includes(hay, w));
};
export const MotionLibraryPanel: FC<Props> = ({ ME, catalog, custom, onCustomChange, text, toonStyle, onToonStyle }) => {
  const [cat, setCat] = useState<Category>(MOTION_TEXT_CHARACTERS);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MotionCharacterDef | null>(null);
  const [previewAction, setPreviewAction] = useState<string>(MOTION_TEXT_WALK);
  const [editing, setEditing] = useState<Partial<MotionCharacterDef> | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MotionCharacterDef | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoverAction, setHoverAction] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<{ id: string; name: string } | null>(null);
  const [toonAction, setToonAction] = useState<string>(MOTION_TEXT_STAND);
  const [toonTime, setToonTime] = useState<string>(MOTION_TEXT_DAY);
  const can3D = useMemo(() => has3D(ME), [ME]);
  const [viewRaw, setViewRaw] = useState<View>(readView);
  const view: View = viewRaw;
  const currentToonStyle = toonStyle || MOTION_TEXT_TOON_FLAT;
  const toon = useMemo(() => toonApi(ME), [ME]);
  const toonChars = useMemo(() => new Set(toon?.characters || []), [toon]);
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, viewRaw);
    } catch {}
  }, [viewRaw]);
  const counts = useMemo(() => {
    const inGroup = (g: string) => _.filter(catalog.assets, (a) => _.includes(MOTION_LIBRARY_GROUPS[g], a.category)).length;
    return {
      characters: catalog.characters.length + custom.length,
      actions: catalog.actions.length,
      vehicles: inGroup(MOTION_TEXT_VEHICLES),
      nature: inGroup(MOTION_TEXT_NATURE),
      urban: inGroup(MOTION_TEXT_URBAN),
      props: inGroup(MOTION_TEXT_PROPS),
      environments: catalog.environments.length,
      templates: catalog.templates.length,
    } as Record<Category, number>;
  }, [catalog, custom]);
  const characters = useMemo(() => {
    const list = [...custom, ...catalog.characters];
    if (view === MOTION_TEXT_TOON) {
      return _.sortBy(
        _.filter(list, (c) => matches(q, c.name, c.id, c.tags || [])),
        (c) => (toonChars.has(c.id) ? 0 : 1),
      );
    }
    return _.filter(list, (c) => matches(q, c.name, c.id, c.tags || []));
  }, [catalog, custom, q, view, toonChars]);
  useEffect(() => {
    if (!selected && characters.length > 0 && cat === MOTION_TEXT_CHARACTERS) {
      setSelected(characters[0]);
    }
  }, [characters, cat, selected]);
  const assets = useMemo(() => (_.includes([MOTION_TEXT_VEHICLES, MOTION_TEXT_NATURE, MOTION_TEXT_URBAN, MOTION_TEXT_PROPS], cat) ? _.filter(catalog.assets, (a) => _.includes(MOTION_LIBRARY_GROUPS[cat], a.category) && matches(q, a.name, a.id, a.tags || [])) : []), [catalog, cat, q]);
  const saveCharacter = async () => {
    if (!editing) return;
    try {
      const isUpdate = !!editing.id && _.some(custom, { id: editing.id });
      const res = await motionRequest<{ item: MotionCharacterDef }>(isUpdate ? MOTION_TEMPLATE_SYMBOL_4(`${API_ROUTES.MOTION_VIDEO_LIBRARY}`, `${editing.id}`) : API_ROUTES.MOTION_VIDEO_LIBRARY, { item: editing }, isUpdate ? MOTION_TEXT_PUT : MOTION_TEXT_POST);
      const next = [res.item, ..._.reject(custom, { id: res.item.id })];
      onCustomChange(next);
      setSelected(res.item);
      setEditing(null);
      toast.success(text.DONE);
    } catch (e: any) {
      toast.error(e?.message || text.ERROR);
    }
  };
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await motionRequest(MOTION_TEMPLATE_SYMBOL_4(`${API_ROUTES.MOTION_VIDEO_LIBRARY}`, `${itemToDelete.id}`), undefined, MOTION_TEXT_DELETE);
      onCustomChange(_.reject(custom, { id: itemToDelete.id }));
      if (selected?.id === itemToDelete.id) setSelected(null);
      setItemToDelete(null);
      toast.success(text.DONE);
    } catch (e: any) {
      toast.error(e?.message || text.ERROR);
    } finally {
      setIsDeleting(false);
    }
  };
  const toonActionsList: [string, string][] = getMotionToonActions(text, true);
  const toonTimesList: [string, string][] = getMotionToonTimes(text, true);
  const viewSwitcher = (
    <div className="h-10 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-955/80 p-1 shadow-2xs">
      <button type={MOTION_TEXT_BUTTON} onClick={() => setViewRaw(MOTION_TEXT_2D)} className={cn("h-full flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all select-none", view === MOTION_TEXT_2D ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900")}>
        <span>{text.LIB_VIEW_2D || MOTION_TEXT_2D_2_5D}</span>
      </button>
      {can3D && (
        <button type={MOTION_TEXT_BUTTON} onClick={() => setViewRaw(MOTION_TEXT_3D)} className={cn("h-full flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all select-none", view === MOTION_TEXT_3D ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900")}>
          <Box className="w-3.5 h-3.5" />
          <span>{text.LIB_VIEW_3D || MOTION_TEXT_3D_MO_HINH}</span>
        </button>
      )}
      <button type={MOTION_TEXT_BUTTON} onClick={() => setViewRaw(MOTION_TEXT_TOON)} className={cn("h-full flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all select-none", view === MOTION_TEXT_TOON ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900")}>
        <Palette className="w-3.5 h-3.5" />
        <span>{text.TAB_TOON || MOTION_TEXT_KHO_HOAT_HINH}</span>
      </button>
    </div>
  );
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[230px_1fr_340px] gap-5 w-full text-left">
      <div className="glass-card rounded-2xl p-3 border border-slate-800/80 bg-slate-900/60 flex xl:flex-col gap-1.5 overflow-x-auto shrink-0 shadow-lg">
        <div className="text-[11px] font-mono font-black uppercase tracking-wider text-purple-400 px-3 py-1 hidden xl:block">{MOTION_TEXT_DANH_MUC_KHO}</div>
        {_.map(CATS, ({ id, icon: Icon, key }) => {
          const isCatActive = cat === id;
          return (
            <button
              key={id}
              type={MOTION_TEXT_BUTTON}
              onClick={() => setCat(id)}
              className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer select-none", isCatActive ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300 shadow-xs scale-[1.01]" : "border-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/60")}>
              <Icon className={cn("w-4 h-4 shrink-0", isCatActive ? "text-purple-400" : "text-slate-400")} />
              <span className="flex-1 text-left font-bold">{text[key] as string}</span>
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
              placeholder={text.LIB_SEARCH}
              className="flex-1 h-full bg-transparent text-xs text-slate-900 dark:text-slate-100 font-bold outline-none border-0 border-none shadow-none placeholder:text-slate-500 dark:placeholder:text-slate-400 font-sans search-input-clean"
              style={{ background: "transparent", backgroundColor: "transparent", border: "none", boxShadow: "none", outline: "none" }}
            />
            {q && (
              <button type={MOTION_TEXT_BUTTON} onClick={() => setQ("")} className="text-slate-400 hover:text-slate-100 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {viewSwitcher}
          {view === MOTION_TEXT_TOON && (
            <div className="h-10 flex items-center gap-1 bg-slate-955/80 border border-slate-800 rounded-xl p-1 shadow-2xs">
              <button type={MOTION_TEXT_BUTTON} onClick={() => onToonStyle?.(MOTION_TEXT_TOON_LINE)} className={cn("h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", currentToonStyle !== MOTION_TEXT_TOON_FLAT ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100")}>
                {text.TOON_STYLE_LINE || MOTION_TEXT_VIEN_NET}
              </button>
              <button type={MOTION_TEXT_BUTTON} onClick={() => onToonStyle?.(MOTION_TEXT_TOON_FLAT)} className={cn("h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", currentToonStyle === MOTION_TEXT_TOON_FLAT ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs font-black" : "text-slate-400 hover:text-slate-100")}>
                {text.TOON_STYLE_FLAT || MOTION_TEXT_PHANG_ANH_SANG_MEM}
              </button>
            </div>
          )}
          {cat === MOTION_TEXT_CHARACTERS && (
            <button
              type={MOTION_TEXT_BUTTON}
              onClick={() =>
                setEditing({
                  name: "",
                  gender: MOTION_TEXT_MALE,
                  age: MOTION_TEXT_ADULT,
                  build: MOTION_TEXT_NORMAL,
                  height: 1,
                  hair: MOTION_TEXT_SHORT,
                  headwear: MOTION_TEXT_NONE,
                  outfit: MOTION_TEXT_CASUAL,
                  accessories: [],
                  colors: { top: MOTION_TEXT_4A5568, bottom: MOTION_TEXT_2D3748 },
                  tags: [],
                })
              }
              className="h-10 flex items-center gap-1.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-purple-600/20 shrink-0">
              <Plus className="w-4 h-4" />
              <span>{text.LIB_NEW_CHARACTER}</span>
            </button>
          )}
        </div>
        {view === MOTION_TEXT_TOON && cat === MOTION_TEXT_CHARACTERS && (
          <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5 bg-slate-955/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2">
              {text.TOON_ACTION || MOTION_TEXT_DONG_TAC}
              {MOTION_TEXT_SYMBOL_39}
            </span>
            {_.map(toonActionsList, ([a, label]) => (
              <button key={a} type={MOTION_TEXT_BUTTON} onClick={() => setToonAction(a)} className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", toonAction === a ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-2xs font-extrabold" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60")}>
                {label}
              </button>
            ))}
          </div>
        )}
        {view === MOTION_TEXT_TOON && cat === MOTION_TEXT_ENVIRONMENTS && (
          <div className="flex items-center gap-1.5 flex-wrap px-2 py-1.5 bg-slate-955/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2">
              {text.TOON_TIME || MOTION_TEXT_THOI_DIEM}
              {MOTION_TEXT_SYMBOL_39}
            </span>
            {_.map(toonTimesList, ([id, label]) => (
              <button key={id} type={MOTION_TEXT_BUTTON} onClick={() => setToonTime(id)} className={cn("px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none", toonTime === id ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-2xs font-extrabold" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60")}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="w-full max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 pb-4">
            {cat === MOTION_TEXT_CHARACTERS &&
              _.map(characters, (c) => {
                const isSel = selected?.id === c.id;
                const isToonNew = view === MOTION_TEXT_TOON && toonChars.has(c.id);
                return (
                  <button
                    key={c.id}
                    type={MOTION_TEXT_BUTTON}
                    onClick={() => {
                      setSelected(c);
                      setSelectedAsset(null);
                      setSelectedEnv(null);
                    }}
                    className={cn(
                      "group rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 text-left cursor-pointer transition-all duration-200 shadow-2xs relative",
                      isSel ? "border-2 border-purple-500 ring-4 ring-purple-500/25 bg-purple-500/15 dark:bg-purple-500/20 shadow-xl shadow-purple-500/20 scale-[1.03] z-10" : "border-slate-800/80 bg-slate-955/80 hover:border-purple-500/60 hover:bg-slate-900 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                    )}>
                    {isSel && (
                      <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40 animate-in zoom-in-50">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center relative border border-slate-800/60 group-hover:border-purple-500/30 transition-all">
                      <MotionLazyThumb load={() => (view === MOTION_TEXT_TOON ? toonCharacterThumb(ME, c, currentToonStyle, toonAction) : view === MOTION_TEXT_3D ? characterThumb3D(ME, c) : characterThumb(ME, c))} deps={[c, view, currentToonStyle, toonAction]} alt={c.name} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <span className={cn("text-xs font-extrabold truncate w-full text-center transition-colors", isSel ? "text-purple-600 dark:text-purple-300 font-black" : "text-slate-100 group-hover:text-purple-400")}>{c.name}</span>
                    <div className="flex items-center gap-1">
                      {isToonNew ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">{text.TOON_NEW || MOTION_TEXT_MOI}</span>
                      ) : (
                        <span className={cn("text-[9px] font-mono px-2 py-0.5 rounded-full font-bold", isSel ? "bg-purple-500/30 text-purple-200 border border-purple-400/50" : c.builtin ? "bg-slate-900 border border-slate-800 text-slate-400" : "bg-purple-500/15 text-purple-300 border border-purple-500/30")}>{c.builtin ? text.LIB_BUILTIN : text.LIB_CUSTOM}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            {cat === MOTION_TEXT_ACTIONS &&
              _.map(
                _.filter(catalog.actions, (a) => matches(q, a.name, a.id)),
                (a) => {
                  const isSel = previewAction === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setPreviewAction(a.id)}
                      onMouseEnter={() => setHoverAction(a.id)}
                      onMouseLeave={() => setHoverAction(null)}
                      className={cn(
                        "group rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs relative",
                        isSel ? "border-2 border-purple-500 ring-4 ring-purple-500/25 bg-purple-500/15 dark:bg-purple-500/20 shadow-xl shadow-purple-500/20 scale-[1.03] z-10" : "border-slate-800/80 bg-slate-955/80 hover:border-purple-500/60 hover:bg-slate-900 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                      )}>
                      {isSel && (
                        <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40 animate-in zoom-in-50">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center border border-slate-800/60 group-hover:border-purple-500/30 transition-all">
                        {hoverAction === a.id ? (
                          <MotionCharacterLive ME={ME} character={selected || MOTION_TEXT_MAN_CASUAL} action={a.id} height={128} />
                        ) : (
                          <MotionLazyThumb
                            load={() => (view === MOTION_TEXT_TOON ? toonCharacterThumb(ME, selected || MOTION_TEXT_MAN_CASUAL, currentToonStyle, a.id) : characterThumb(ME, selected || MOTION_TEXT_MAN_CASUAL, a.id, 0.35))}
                            deps={[a.id, selected?.id, view, currentToonStyle]}
                            alt={a.name}
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <span className={cn("text-xs font-extrabold truncate w-full text-center transition-colors", isSel ? "text-purple-600 dark:text-purple-300 font-black" : "text-slate-100 group-hover:text-purple-400")}>{a.name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 truncate w-full text-center">{a.id}</span>
                    </div>
                  );
                },
              )}
            {_.map(assets, (a) => {
              const isSel = selectedAsset?.id === a.id;
              return (
                <button
                  key={a.id}
                  type={MOTION_TEXT_BUTTON}
                  onClick={() => {
                    setSelectedAsset({ id: a.id, name: a.name, description: a.description });
                    setSelected(null);
                    setSelectedEnv(null);
                  }}
                  className={cn(
                    "group relative rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-2xs",
                    isSel ? "border-2 border-purple-500 ring-4 ring-purple-500/25 bg-purple-500/15 dark:bg-purple-500/20 shadow-xl shadow-purple-500/20 scale-[1.03] z-10" : "border-slate-800/80 bg-slate-955/80 hover:border-purple-500/60 hover:bg-slate-900 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                  )}
                  title={a.description || a.name}>
                  {isSel && (
                    <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40 animate-in zoom-in-50">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  {view === MOTION_TEXT_3D && <span className={cn("absolute top-2 right-2 z-10 text-[8px] font-black px-1.5 py-0.5 rounded-md", has3DModel(ME, a.id) ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" : "bg-slate-900 border border-slate-800 text-slate-400")}>{has3DModel(ME, a.id) ? MOTION_TEXT_3D_2 : MOTION_TEXT_2_5D}</span>}
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-900/90 flex items-center justify-center border border-slate-800/60 group-hover:border-purple-500/30 transition-all">
                    <MotionLazyThumb load={() => (view === MOTION_TEXT_TOON ? toonAssetThumb(ME, a.id, currentToonStyle) : view === MOTION_TEXT_3D ? assetThumb3D(ME, a.id) : assetThumb(ME, a.id))} deps={[a.id, view, currentToonStyle]} alt={a.name} className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className={cn("text-xs font-extrabold truncate w-full text-center transition-colors", isSel ? "text-purple-600 dark:text-purple-300 font-black" : "text-slate-100 group-hover:text-purple-400")}>{a.name}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 truncate w-full text-center">{a.id}</span>
                </button>
              );
            })}
            {cat === MOTION_TEXT_ENVIRONMENTS &&
              _.map(
                _.filter(catalog.environments, (e) => matches(q, e.name, e.id, e.tags || [])),
                (e) => {
                  const isSel = selectedEnv?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      type={MOTION_TEXT_BUTTON}
                      onClick={() => {
                        setSelectedEnv({ id: e.id, name: e.name });
                        setSelected(null);
                        setSelectedAsset(null);
                      }}
                      className={cn(
                        "group rounded-2xl border p-2.5 flex flex-col gap-1.5 shadow-2xs text-left cursor-pointer transition-all duration-200 relative",
                        isSel ? "border-2 border-purple-500 ring-4 ring-purple-500/25 bg-purple-500/15 dark:bg-purple-500/20 shadow-xl shadow-purple-500/20 scale-[1.03] z-10" : "border-slate-800/80 bg-slate-955/80 hover:border-purple-500/60 hover:bg-slate-900 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
                      )}>
                      {isSel && (
                        <div className="absolute top-2 right-2 z-20 w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/40 animate-in zoom-in-50">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800/60 group-hover:border-purple-500/30 transition-all">
                        <MotionLazyThumb load={() => (view === MOTION_TEXT_TOON ? toonEnvironmentThumb(ME, e.id, currentToonStyle, toonTime) : view === MOTION_TEXT_3D ? environmentThumb3D(ME, e.id) : environmentThumb(ME, e.id))} deps={[e.id, view, currentToonStyle, toonTime]} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <span className={cn("text-xs font-extrabold truncate px-1 transition-colors", isSel ? "text-purple-600 dark:text-purple-300 font-black" : "text-slate-100 group-hover:text-purple-400")}>{e.name}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 truncate px-1">{e.id}</span>
                    </button>
                  );
                },
              )}
            {cat === MOTION_TEXT_TEMPLATES &&
              _.map(
                _.filter(catalog.templates, (t) => matches(q, t.name, t.id, t.description || "")),
                (t) => (
                  <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-955/80 p-4 flex flex-col gap-2 col-span-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-black text-purple-300">{t.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{t.id}</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{t.description}</p>
                  </div>
                ),
              )}
          </div>
        </div>
      </div>
      <div className="glass-card rounded-2xl p-4 border border-slate-800/80 bg-slate-900/60 flex flex-col gap-3.5 shadow-lg shrink-0">
        <div className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>{MOTION_TEXT_XEM_TRUOC_CHI_TIET}</span>
          <span className="text-[9px] font-black text-purple-300 uppercase bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">{view === MOTION_TEXT_TOON ? MOTION_TEXT_HOAT_HINH : view === MOTION_TEXT_3D ? MOTION_TEXT_3D_2 : MOTION_TEXT_2D_2_5D}</span>
        </div>
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-100 truncate">{selected.name}</h3>
                <p className="text-[10px] font-mono font-bold text-slate-400">{selected.id}</p>
              </div>
              <div className="flex gap-1">
                {!selected.builtin && (
                  <button type={MOTION_TEXT_BUTTON} title={text.LIB_EDIT} onClick={() => setEditing(_.cloneDeep(selected))} className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type={MOTION_TEXT_BUTTON}
                  title={text.LIB_DUPLICATE}
                  onClick={() =>
                    setEditing({
                      ..._.omit(_.cloneDeep(selected), [MOTION_TEXT_ID, MOTION_TEXT_BUILTIN, MOTION_TEXT_CREATEDAT, MOTION_TEXT_UPDATEDAT]),
                      name: MOTION_TEMPLATE_2(`${selected.name}`),
                    })
                  }
                  className="p-1.5 text-slate-400 hover:text-purple-400 transition-colors cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {!selected.builtin && (
                  <button type={MOTION_TEXT_BUTTON} title={text.DELETE} onClick={() => setItemToDelete(selected)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-955/90 border border-slate-800 py-3 flex items-center justify-center shadow-inner min-h-[280px]">
              {view === MOTION_TEXT_TOON ? (
                <MotionLazyThumb load={() => toonCharacterThumb(ME, selected, currentToonStyle, previewAction)} deps={[selected, currentToonStyle, previewAction]} alt={selected.name} className="h-64 w-full object-contain" />
              ) : view === MOTION_TEXT_3D ? (
                <MotionLive3D ME={ME} kind={MOTION_TEXT_CHARACTER} item={selected} action={previewAction} height={280} />
              ) : (
                <MotionCharacterLive ME={ME} character={selected} action={previewAction} height={280} />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{MOTION_TEXT_HANH_DONG_MAU}</label>
              <select value={previewAction} onChange={(e) => setPreviewAction(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-955/90 border border-slate-800 text-xs text-slate-100 font-bold outline-none cursor-pointer">
                {_.map(catalog.actions, (a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-slate-100">
                    {a.name}
                    {MOTION_TEXT_SYMBOL_6}
                    {a.id}
                    {MOTION_TEXT_SYMBOL_7}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {_.map(_.compact([selected.gender, selected.age, selected.build, selected.hair, selected.headwear !== MOTION_TEXT_NONE && selected.headwear, selected.outfit, ...(selected.accessories || []), ...(selected.tags || [])]), (tag, i) => (
                <span key={MOTION_TEMPLATE_SYMBOL_5(`${tag}`, `${i}`)} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-955 border border-slate-800 text-slate-300 font-mono font-bold">
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : selectedAsset ? (
          <>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-100 truncate">{selectedAsset.name}</h3>
              <p className="text-[10px] font-mono font-bold text-slate-400">
                {selectedAsset.id}
                {can3D && view === MOTION_TEXT_3D && MOTION_TEMPLATE_SYMBOL_6(`${has3DModel(ME, selectedAsset.id) ? MOTION_TEXT_3D_MODEL_2 : text.LIB_3D_CARD}`)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-955/90 border border-slate-800 p-3 flex items-center justify-center min-h-[220px] shadow-inner">
              {view === MOTION_TEXT_TOON ? (
                <MotionLazyThumb load={() => toonAssetThumb(ME, selectedAsset.id, currentToonStyle)} deps={[selectedAsset.id, currentToonStyle]} alt={selectedAsset.name} className="h-52 w-full object-contain" />
              ) : view === MOTION_TEXT_3D ? (
                <MotionLive3D ME={ME} kind={MOTION_TEXT_ASSET} item={selectedAsset.id} width={280} height={220} />
              ) : (
                <MotionLazyThumb load={() => assetThumb(ME, selectedAsset.id)} deps={[selectedAsset.id]} alt={selectedAsset.name} className="h-52 w-full object-contain" />
              )}
            </div>
            {selectedAsset.description && <p className="text-xs text-slate-200 leading-relaxed bg-slate-955/80 p-2.5 rounded-xl border border-slate-800 font-medium">{selectedAsset.description}</p>}
          </>
        ) : selectedEnv ? (
          <>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-100 truncate">{selectedEnv.name}</h3>
              <p className="text-[10px] font-mono font-bold text-slate-400">{selectedEnv.id}</p>
            </div>
            <div className="rounded-2xl bg-slate-955/90 border border-slate-800 overflow-hidden aspect-video flex items-center justify-center shadow-inner">
              <MotionLazyThumb load={() => (view === MOTION_TEXT_TOON ? toonEnvironmentThumb(ME, selectedEnv.id, currentToonStyle, toonTime) : view === MOTION_TEXT_3D ? environmentThumb3D(ME, selectedEnv.id) : environmentThumb(ME, selectedEnv.id))} deps={[selectedEnv.id, view, currentToonStyle, toonTime]} alt={selectedEnv.name} className="w-full h-full object-cover" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2.5 text-slate-400 text-xs py-12">
            <MotionCharacterLive ME={ME} character={MOTION_TEXT_PHOTOGRAPHER} action={MOTION_TEXT_WALK} height={180} />
            <span className="font-extrabold text-slate-100">{MOTION_TEXT_CHON_MOT_NHAN_VAT_HOAC_DO_VAT_DE}</span>
            <span className="text-[11px] font-medium leading-relaxed max-w-[240px] text-slate-400">
              {MOTION_TEXT_KHO_CHUA_HON}
              {counts.characters}
              {MOTION_TEXT_NHAN_VAT}
              {counts.actions}
              {MOTION_TEXT_DONG_TAC_VA_HANG_TRAM_BOI_CANH_2}
            </span>
          </div>
        )}
      </div>
      {editing && <MotionCharacterEditor ME={ME} value={editing} onChange={setEditing} onSave={saveCharacter} onClose={() => setEditing(null)} text={text} />}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => {
          if (!isDeleting) setItemToDelete(null);
        }}
        maxWidth={MOTION_TEXT_MAX_W_MD}
        title={
          <div className="flex items-center gap-2 uppercase tracking-wider font-extrabold text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="uppercase font-extrabold tracking-wider">{text.DELETE || MOTION_TEXT_XAC_NHAN_XOA}</span>
          </div>
        }>
        <div className="space-y-4 text-left">
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            {MOTION_TEXT_BAN_CO_CHAC_CHAN_MUON_XOA_NHAN_VAT}
            {MOTION_TEXT_SYMBOL_13}
            <span className="font-extrabold text-slate-100 px-1">
              {MOTION_TEXT_SYMBOL_47}
              {itemToDelete?.name}
              {MOTION_TEXT_SYMBOL_47}
            </span>
            {MOTION_TEXT_SYMBOL_25}
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">{MOTION_TEXT_HANH_DONG_NAY_KHONG_THE_HOAN_TAC}</div>
          <MotionModalActions onCancel={() => setItemToDelete(null)} onConfirm={() => void handleConfirmDelete()} cancelLabel={text.CLOSE || MOTION_TEXT_HUY} confirmLabel={text.DELETE || MOTION_TEXT_XOA} busy={isDeleting} danger />
        </div>
      </Modal>
    </div>
  );
};
export const MotionCharacterEditor: FC<{
  ME: MotionEngineGlobal;
  value: Partial<MotionCharacterDef>;
  onChange: (v: Partial<MotionCharacterDef>) => void;
  onSave: () => void;
  onClose: () => void;
  text: MotionVideoTexts;
}> = ({ ME, value, onChange, onSave, onClose, text }) => {
  const [action, setAction] = useState<string>(MOTION_TEXT_WALK);
  const set = (patch: Partial<MotionCharacterDef>) => onChange({ ...value, ...patch });
  const opt = MOTION_CHARACTER_OPTIONS;
  const sel = (key: "gender" | "age" | "build" | "hair" | "headwear" | "outfit", label: string) => (
    <Field label={label}>
      <select value={_.toString(value[key] || "")} onChange={(e) => set({ [key]: e.target.value } as any)} className={selectCls}>
        {_.map(opt[key] as readonly string[], (o) => (
          <option key={o} value={o} className="bg-slate-900 text-slate-100">
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 max-h-[92vh] overflow-y-auto text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span>{value.id ? text.LIB_EDIT : text.LIB_NEW_CHARACTER}</span>
            </h3>
            <button type={MOTION_TEXT_BUTTON} onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Field label={text.FIELD_NAME}>
            <input value={value.name || ""} onChange={(e) => set({ name: e.target.value })} placeholder={MOTION_TEXT_TEN_NHAN_VAT} className={selectCls} />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sel(MOTION_TEXT_GENDER, text.FIELD_GENDER)}
            {sel(MOTION_TEXT_AGE, text.FIELD_AGE)}
            {sel(MOTION_TEXT_BUILD, text.FIELD_BUILD)}
            {sel(MOTION_TEXT_HAIR, text.FIELD_HAIR)}
            {sel(MOTION_TEXT_HEADWEAR, text.FIELD_HEADWEAR)}
            {sel(MOTION_TEXT_OUTFIT, text.FIELD_OUTFIT)}
          </div>
          <Field label={MOTION_TEMPLATE_SYMBOL_7(`${text.FIELD_HEIGHT}`, `${(value.height || 1).toFixed(2)}`)}>
            <input type={MOTION_TEXT_RANGE} min={0.6} max={1.3} step={0.01} value={value.height || 1} onChange={(e) => set({ height: _.toNumber(e.target.value) })} className="accent-purple-500 cursor-pointer w-full" />
          </Field>
          <Field label={text.FIELD_ACCESSORIES}>
            <div className="flex flex-wrap gap-1.5">
              {_.map(opt.accessories, (a) => {
                const on = _.includes(value.accessories || [], a);
                return (
                  <button
                    key={a}
                    type={MOTION_TEXT_BUTTON}
                    onClick={() =>
                      set({
                        accessories: on ? _.without(value.accessories || [], a) : [...(value.accessories || []), a],
                      })
                    }
                    className={cn("px-2.5 py-1 rounded-xl text-xs border cursor-pointer transition-all shadow-2xs", on ? "bg-purple-500/15 border-purple-500/40 text-purple-300 font-bold" : "border-slate-800 text-slate-400 hover:text-slate-100")}>
                    {a}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label={text.FIELD_COLORS}>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {_.map(opt.colors, (k) => (
                <label key={k} className="flex flex-col items-center gap-1 text-[10px] text-slate-400 font-mono font-bold">
                  <input type={MOTION_TEXT_COLOR} value={value.colors?.[k] || MOTION_TEXT_888888} onChange={(e) => set({ colors: { ...(value.colors || {}), [k]: e.target.value } })} className="w-10 h-10 rounded-xl bg-transparent border border-slate-800 cursor-pointer shadow-2xs" />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label={text.FIELD_TAGS}>
            <input value={(value.tags || []).join(MOTION_TEXT_SYMBOL_14)} onChange={(e) => set({ tags: _.compact(_.map(e.target.value.split(MOTION_TEXT_SYMBOL_15), _.trim)) })} placeholder={MOTION_TEXT_TAG_PHAN_LOAI_CACH_NHAU_BANG_DAU_PHAY} className={selectCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type={MOTION_TEXT_BUTTON} onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-955 hover:text-slate-100 cursor-pointer transition-colors border border-slate-800">
              {text.CLOSE}
            </button>
            <button type={MOTION_TEXT_BUTTON} onClick={onSave} disabled={!_.trim(value.name)} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 disabled:opacity-40 cursor-pointer transition-all shadow-md shadow-purple-600/20">
              {text.SAVE}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-mono font-bold uppercase text-slate-400">{MOTION_TEXT_XEM_THU_MO_HINH}</div>
          <div className="rounded-2xl bg-slate-955 border border-slate-800 py-4 flex items-center justify-center shadow-inner">
            <MotionCharacterLive ME={ME} character={{ id: MOTION_TEXT_PREVIEW, ...value }} action={action} height={320} />
          </div>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={selectCls}>
            {_.map(ME.catalog().actions, (a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 text-slate-100">
                {a.name}
                {MOTION_TEXT_SYMBOL_6}
                {a.id}
                {MOTION_TEXT_SYMBOL_7}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
