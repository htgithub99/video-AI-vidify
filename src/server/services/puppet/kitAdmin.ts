import fs from "fs";
import path from "path";
import _ from "lodash";
import { puppetAssetName, puppetPropAllowed } from "../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_KIT_API as A, PUPPET_TYPES, type PuppetType } from "../../../constants/motionPuppet.js";
import type { PuppetAsset, PuppetCharacter, PuppetProp, PuppetSeries, PuppetSet, PuppetStylePack, PuppetPackSnapshot } from "../../../types/motionPuppet.js";
import { deletePuppet, listPuppets, puppetLibDir, puppetRefsDir, readPuppet, writePuppet } from "./kitLibrary.js";
import { characterSheetSvg, proceduralViews } from "./svg.js";
import { ensurePuppetPresets } from "./stylePack.js";
import { closedPuppetPackId, puppetPackAssetAllowed, withPuppetPackSnapshot } from "./packPolicy.js";
export interface PuppetKitItem {
  id: string;
  type: string;
  name: string;
  desc: string;
  styleId?: string;
  uses?: number;
  updatedAt: string;
  source?: string;
  preset?: string;
  counts?: Record<string, number>;
  variants?: string[];
  construction?: string;
}
const typeOf = (v: unknown): PuppetType | null => (_.includes(_.values(PUPPET_TYPES), v) ? (v as PuppetType) : null);
const summary = (a: PuppetAsset): PuppetKitItem => {
  const any = a as any;
  const base: PuppetKitItem = { id: a.id, type: a.type, name: any.name || (any.key ? puppetAssetName(any.key) : a.id), desc: _.truncate(any.desc || any.description || P.EMPTY, { length: 200 }), styleId: any.styleId, uses: any.uses, updatedAt: any.updatedAt || P.EMPTY };
  if (a.type === PUPPET_TYPES.STYLE) return { ...base, source: (a as PuppetStylePack).source, preset: (a as PuppetStylePack).preset };
  if (a.type === PUPPET_TYPES.SERIES) {
    const s = a as PuppetSeries;
    return { ...base, counts: { characters: _.size(s.characters), sets: _.size(s.sets), props: _.size(s.props) } };
  }
  if (a.type === PUPPET_TYPES.SET) return { ...base, variants: _.keys((a as PuppetSet).variants || {}), construction: a.recipe ? "recipe" : a.plan ? "composed" : "legacy" };
  if (a.type === PUPPET_TYPES.BASE && a.recipeOnly) return { ...base, construction: "review" };
  return base;
};
export const listPuppetKit = (type: unknown, styleId?: unknown): PuppetKitItem[] => {
  const t = typeOf(type);
  if (!t) return [];
  if (t === PUPPET_TYPES.STYLE) ensurePuppetPresets();
  const sid = _.toString(styleId || P.EMPTY);
  const closed = closedPuppetPackId(sid);
  return _.map(
    listPuppets<PuppetAsset>(t, (a: any) => (!sid || t === PUPPET_TYPES.STYLE || a.styleId === sid) && (!closed || t === PUPPET_TYPES.SERIES || puppetPackAssetAllowed(a, closed)) && !(t === PUPPET_TYPES.SET && _.includes(a.name, P.VARIANT_SEP)) && (t !== PUPPET_TYPES.PROP || puppetPropAllowed(a))),
    summary,
  );
};
export const renamePuppetKit = (type: unknown, id: unknown, name: unknown): boolean => {
  const t = typeOf(type);
  const a = t ? readPuppet<PuppetAsset>(t, _.toString(id)) : null;
  const n = _.truncate(_.trim(_.toString(name)), { length: A.NAME_MAX, omission: P.EMPTY });
  if (!a || !n) return false;
  writePuppet({ ...(a as any), name: n, updatedAt: new Date().toISOString() });
  return true;
};
export const removePuppetKit = (type: unknown, ids: unknown): number => {
  const t = typeOf(type);
  if (!t) return 0;
  let n = 0;
  for (const id of _.map(_.castArray(ids || []), _.toString)) {
    const a = readPuppet<PuppetAsset>(t, id);
    if (!a) continue;
    if (t === PUPPET_TYPES.SET) for (const v of _.values((a as PuppetSet).variants || {})) deletePuppet(t, v);
    if (t === PUPPET_TYPES.STYLE) fs.rmSync(path.join(puppetLibDir(t), id), { recursive: true, force: true });
    if (deletePuppet(t, id)) n++;
  }
  return n;
};
export const puppetKitThumb = (type: unknown, id: unknown, pack?: PuppetPackSnapshot): { svg?: string; file?: string } | null => {
  if (pack) return withPuppetPackSnapshot(pack, () => puppetKitThumb(type, id));
  const t = typeOf(type);
  const a = t ? readPuppet<PuppetAsset>(t, _.toString(id)) : null;
  if (!a) return null;
  if (a.type === PUPPET_TYPES.SET || a.type === PUPPET_TYPES.BASE || a.type === PUPPET_TYPES.PIECE) return { svg: a.svg };
  if (a.type === PUPPET_TYPES.PROP) return { svg: (a as PuppetProp).svg };
  if (a.type === PUPPET_TYPES.CHARACTER) {
    const c = a as PuppetCharacter;
    const style = c.head?.front ? null : readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, c.styleId);
    return { svg: characterSheetSvg(style ? proceduralViews(c, style) : c, 0.4) };
  }
  if (a.type === PUPPET_TYPES.STYLE) {
    const s = a as PuppetStylePack;
    const ref = _.first(s.refs || []);
    const file = ref ? path.join(puppetRefsDir(s.id), path.basename(ref)) : null;
    if (file && fs.existsSync(file)) return { file };
    const c = _.first(listPuppets<PuppetCharacter>(PUPPET_TYPES.CHARACTER, (x) => x.styleId === s.id && !!x.head?.front));
    return c ? { svg: characterSheetSvg(c, 0.4) } : { svg: P.SWATCH_SVG(s.palette.length ? s.palette : [s.line.color]) };
  }
  if (a.type === PUPPET_TYPES.SERIES) {
    const first = _.first(_.values((a as PuppetSeries).characters));
    const c = first ? readPuppet<PuppetCharacter>(PUPPET_TYPES.CHARACTER, first) : null;
    return c ? { svg: characterSheetSvg(c, 0.4) } : null;
  }
  return null;
};
