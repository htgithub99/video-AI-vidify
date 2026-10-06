import _ from "lodash";
import { Car, Home, Loader2, Mountain, Sofa, TreePine, Users } from "lucide-react";
import { FC, useMemo, useState } from "react";
import { MOTION_TEXT_BUTTON, MOTION_TEXT_DAY, MOTION_TEXT_ID, MOTION_TEXT_LAZY, MOTION_TEXT_STAND, MOTION_TEXT_TOON_CAT_CHARACTERS, MOTION_TEXT_TOON_CAT_ENVS, MOTION_TEXT_TOON_CAT_INTERIOR, MOTION_TEXT_TOON_CAT_NATURE, MOTION_TEXT_TOON_CAT_URBAN, MOTION_TEXT_TOON_CAT_VEHICLES, MOTION_TEXT_TOON_FLAT, MOTION_TEXT_TOON_LINE, MOTION_TOON_GROUPS } from "../../constants/motionRuntime.js";
import type { MotionVideoTexts } from "../../constants/motionVideoTexts.js";
import { cn } from "../../lib/utils";
import type { MotionCatalog, MotionCatalogItem, MotionCharacterDef } from "../../types/motionVideo.js";
import { MotionThumbnail } from "./MotionThumbnail.js";
import type { MotionEngineGlobal } from "./motionApi";
import { getMotionToonActions, getMotionToonTimes } from "./motionOptions.js";
import { toonApi, toonAssetThumb, toonCharacterThumb, toonEnvironmentThumb } from "./motionThumbs";
type Cat = typeof MOTION_TEXT_TOON_CAT_CHARACTERS | typeof MOTION_TEXT_TOON_CAT_ENVS | typeof MOTION_TEXT_TOON_CAT_VEHICLES | typeof MOTION_TEXT_TOON_CAT_NATURE | typeof MOTION_TEXT_TOON_CAT_URBAN | typeof MOTION_TEXT_TOON_CAT_INTERIOR;
const Thumb: FC<{ load: () => Promise<string>; deps: unknown[]; wide?: boolean }> = ({ load, deps, wide }) => (
  <MotionThumbnail
    load={load}
    deps={deps}
    alt=""
    className={cn("w-full flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-sky-50 to-slate-100 dark:from-slate-800 dark:to-slate-900", wide ? "aspect-video" : "aspect-[4/5]")}
    imageClassName={cn("max-w-full max-h-full", wide ? "w-full h-full object-cover" : "object-contain")}
    imageLoading={MOTION_TEXT_LAZY}
    placeholder={<Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
  />
);
export const MotionToonLibraryPanel: FC<{ ME: MotionEngineGlobal | null; catalog: MotionCatalog | null; text: MotionVideoTexts; style: string; onStyle: (style: string) => void }> = ({ ME, catalog, text, style, onStyle }) => {
  const [cat, setCat] = useState<Cat>(MOTION_TEXT_TOON_CAT_CHARACTERS);
  const [action, setAction] = useState<string>(MOTION_TEXT_STAND);
  const [time, setTime] = useState<string>(MOTION_TEXT_DAY);
  const api = toonApi(ME);
  const groups = useMemo(() => {
    if (!catalog || !api) return null;
    const byId = _.keyBy(catalog.assets, MOTION_TEXT_ID);
    const assets = _.compact(_.map(api.list.assets, (id) => byId[id])) as MotionCatalogItem[];
    const inGroup = (key: string) => _.filter(assets, (a) => _.includes(MOTION_TOON_GROUPS[key as keyof typeof MOTION_TOON_GROUPS], a.category || ""));
    const envById = _.keyBy(catalog.environments, MOTION_TEXT_ID);
    const toonChars = new Set(api.characters);
    return {
      characters: _.sortBy(catalog.characters, (c: MotionCharacterDef) => (toonChars.has(c.id) ? 0 : 1)),
      envs: _.compact(_.map(api.list.envs, (id) => envById[id])) as MotionCatalogItem[],
      vehicles: inGroup(MOTION_TEXT_TOON_CAT_VEHICLES),
      nature: inGroup(MOTION_TEXT_TOON_CAT_NATURE),
      urban: inGroup(MOTION_TEXT_TOON_CAT_URBAN),
      interior: inGroup(MOTION_TEXT_TOON_CAT_INTERIOR),
      toonChars,
    };
  }, [catalog, api]);
  const tabs: { id: Cat; label: string; icon: typeof Users; count: number }[] = [
    { id: MOTION_TEXT_TOON_CAT_CHARACTERS, label: text.TOON_CAT_CHARACTERS, icon: Users, count: groups?.characters.length || 0 },
    { id: MOTION_TEXT_TOON_CAT_ENVS, label: text.TOON_CAT_ENVS, icon: Mountain, count: groups?.envs.length || 0 },
    { id: MOTION_TEXT_TOON_CAT_VEHICLES, label: text.TOON_CAT_VEHICLES, icon: Car, count: groups?.vehicles.length || 0 },
    { id: MOTION_TEXT_TOON_CAT_NATURE, label: text.TOON_CAT_NATURE, icon: TreePine, count: groups?.nature.length || 0 },
    { id: MOTION_TEXT_TOON_CAT_URBAN, label: text.TOON_CAT_URBAN, icon: Home, count: groups?.urban.length || 0 },
    { id: MOTION_TEXT_TOON_CAT_INTERIOR, label: text.TOON_CAT_INTERIOR, icon: Sofa, count: groups?.interior.length || 0 },
  ];
  const chip = (active: boolean) => cn("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none flex items-center gap-1.5", active ? "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-md shadow-purple-600/20" : "border-slate-800/80 bg-slate-955/70 text-slate-300 hover:text-slate-100 hover:border-purple-500/40 hover:bg-slate-900/80");
  if (!ME || !groups)
    return (
      <div className="h-64 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
        {text.TOON_LOADING}
      </div>
    );
  const actions: [string, string][] = getMotionToonActions(text);
  const times: [string, string][] = getMotionToonTimes(text);
  const items = cat === MOTION_TEXT_TOON_CAT_CHARACTERS ? [] : (groups[cat] as MotionCatalogItem[]);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-base font-black text-slate-100">{text.TOON_TITLE}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{text.TOON_SUB}</p>
          </div>
          <div className="flex gap-1.5">
            <button type={MOTION_TEXT_BUTTON} className={chip(style !== MOTION_TEXT_TOON_FLAT)} onClick={() => onStyle(MOTION_TEXT_TOON_LINE)}>
              {text.TOON_STYLE_LINE}
            </button>
            <button type={MOTION_TEXT_BUTTON} className={chip(style === MOTION_TEXT_TOON_FLAT)} onClick={() => onStyle(MOTION_TEXT_TOON_FLAT)}>
              {text.TOON_STYLE_FLAT}
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {_.map(tabs, (t) => (
            <button key={t.id} type={MOTION_TEXT_BUTTON} className={chip(cat === t.id)} onClick={() => setCat(t.id)}>
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span className="opacity-70 font-mono">{t.count}</span>
            </button>
          ))}
        </div>
        {cat === MOTION_TEXT_TOON_CAT_CHARACTERS && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">{text.TOON_ACTION}</span>
            {_.map(actions, ([a, label]) => (
              <button key={a} type={MOTION_TEXT_BUTTON} className={chip(action === a)} onClick={() => setAction(a)}>
                {label}
              </button>
            ))}
          </div>
        )}
        {cat === MOTION_TEXT_TOON_CAT_ENVS && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">{text.TOON_TIME}</span>
            {_.map(times, ([id, label]) => (
              <button key={id} type={MOTION_TEXT_BUTTON} className={chip(time === id)} onClick={() => setTime(id)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {cat === MOTION_TEXT_TOON_CAT_CHARACTERS ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
          {_.map(groups.characters, (c) => (
            <div key={c.id} className="rounded-2xl border border-slate-800/80 bg-slate-955/60 p-2 space-y-1.5" title={c.id}>
              <Thumb load={() => toonCharacterThumb(ME, c.id, style, action)} deps={[c.id, style, action]} />
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-100 truncate">{c.name}</span>
                {groups.toonChars.has(c.id) && <span className="shrink-0 px-1.5 rounded-full bg-purple-500/15 text-purple-300 text-[9px] font-bold">{text.TOON_NEW}</span>}
              </div>
              <div className="text-[9px] font-mono text-slate-400 truncate">{c.id}</div>
            </div>
          ))}
        </div>
      ) : cat === MOTION_TEXT_TOON_CAT_ENVS ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {_.map(items, (e) => (
            <div key={e.id} className="rounded-2xl border border-slate-800/80 bg-slate-955/60 p-2 space-y-1.5">
              <Thumb wide load={() => toonEnvironmentThumb(ME, e.id, style, time)} deps={[e.id, style, time]} />
              <div className="text-xs font-bold text-slate-100 truncate">{e.name}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">{e.id}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-3">
          {_.map(items, (a) => (
            <div key={a.id} className="rounded-2xl border border-slate-800/80 bg-slate-955/60 p-2 space-y-1.5" title={a.id}>
              <Thumb wide load={() => toonAssetThumb(ME, a.id, style)} deps={[a.id, style]} />
              <div className="text-[11px] font-bold text-slate-100 truncate">{a.name}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">{a.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
