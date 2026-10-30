import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { parseJson, stringifyJson } from "../../../../../lib/jsonStringify.js";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { createHash, randomUUID } from "crypto";
import { PUPPET, PUPPET_LIB as L, PUPPET_TYPES, type PuppetType } from "../../../../../constants/motionPuppet.js";
import { PA } from "../../../../../constants/motionPuppetAssets.js";
import { MOTION_PLACEMENT as M } from "../../../../../constants/motionPlacement.js";
import type { PuppetAsset, PuppetSet } from "../../../../../types/motionPuppet.js";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { writeMotionJsonAtomic } from "../motionFileUtils.js";
import { guardPuppetAssetWrite, scopedPuppetAsset, scopedPuppetAssets, scopedPuppetLightVariant, puppetPackActive } from "./packPolicy.js";
import { MOTION_PACK as PACK } from "../../../../../constants/motionPack.js";
import { motionRecipeSources, resolveMotionResourceRecipe } from "../../../../../lib/motionResourceRecipe.js";
import { isMotionResourceError, MotionResourceError } from "../../../../../lib/motionResourceFailure.js";
import { normalizeMotionResourceSemantics } from "../../../../../lib/motionResourceSemantics.js";
import { puppetPackAssetIssues } from "./packInventory.js";
import SCHEMA from "../../../../../constants/motionResourceSchema.json";
import { MOTION_RESOURCE_WRITE as W } from "../../../../../constants/motionResourceSemantics.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../../../../../constants/motionLibraryRelease.js";
import { activePuppetLibrary, releasedPuppetAssetAllowed } from "./libraryRelease.js";
import { resolvePuppetSetPlan } from "./setPlan.js";
export const livePuppetLibrary = () => activePuppetLibrary(path.join(getMotionRootDirectory(), L.DIR));
export const puppetLibDir = (type: string): string => {
  const dir = path.join(livePuppetLibrary().directory, type);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const puppetHash = (s: string): string => createHash(L.SHA).update(s).digest(L.HEX).slice(0, L.ID_LEN);
export const newPuppetId = (type: PuppetType, seed?: string): string => (L.ID_PREFIX[type] || type) + puppetHash(seed || randomUUID());
const CACHE = new Map<string, { mtime: number; asset: PuppetAsset }>();
export const readPuppet = <T extends PuppetAsset>(type: PuppetType, id: string): T | null => {
  const resolve = (asset: PuppetAsset): T =>
    resolvePuppetSetPlan(
      resolveMotionResourceRecipe(asset, (type, id) => readPuppet(type as PuppetType, id)),
      (type, id) => readPuppet(type as PuppetType, id),
    ) as T;
  const scoped = scopedPuppetAsset(type, id);
  if (scoped.active) return scoped.asset ? resolve(scoped.asset) : null;
  if (!L.ID_RE.test(id)) return null;
  const file = path.join(puppetLibDir(type), id + L.JSON);
  try {
    const mtime = fs.statSync(file).mtimeMs;
    const hit = CACHE.get(file);
    if (hit && hit.mtime === mtime) return resolve(hit.asset);
    const asset = parseJson(fs.readFileSync(file, L.UTF8)) as T;
    if (asset.type !== type || asset.id !== id || (livePuppetLibrary().version === RELEASE.VERSION && !releasedPuppetAssetAllowed(asset))) return null;
    CACHE.set(file, { mtime, asset });
    return resolve(asset);
  } catch (error) {
    if (isMotionResourceError(error)) throw error;
    return null;
  }
};
export const writePuppet = <T extends PuppetAsset>(asset: T): T => {
  if (guardPuppetAssetWrite(asset)) return asset;
  if (livePuppetLibrary().version === RELEASE.VERSION && !releasedPuppetAssetAllowed(asset)) throw new Error(RELEASE.WRITE_BLOCKED);
  if (!Object.values(PUPPET_TYPES).includes(asset.type) || !L.ID_RE.test(asset.id)) throw new MotionResourceError({ kind: asset.type, reason: RT_SERVER.METADATA, name: asset.id, details: [W.IDENTITY] });
  const normalized = normalizeMotionResourceSemantics(asset);
  const file = path.join(puppetLibDir(asset.type), asset.id + L.JSON);
  let previous: PuppetAsset | undefined;
  if (fs.existsSync(file)) previous = parseJson(fs.readFileSync(file, L.UTF8));
  const structural = (value: PuppetAsset): string => stringifyJson(Object.fromEntries(Object.entries(value).filter(([key]) => !(W.DISPLAY_FIELDS as readonly string[]).includes(key))));
  const legacyUnchanged = previous && structural(normalizeMotionResourceSemantics(previous)) === structural(normalized);
  const issues = legacyUnchanged ? [] : puppetPackAssetIssues(normalized);
  if (RT_SERVER.SEMANTICVERSION in asset && asset.semanticVersion !== undefined && asset.semanticVersion !== SCHEMA.version) issues.push(W.VERSION);
  if (!legacyUnchanged && normalized.type === PUPPET_TYPES.PIECE && !SCHEMA.pieceKinds.includes(normalized.kind)) issues.push(W.KIND);
  if (RT_SERVER.LOCATIONFAMILY in normalized && normalized.locationFamily && !Object.hasOwn(SCHEMA.locationPatterns, normalized.locationFamily)) issues.push(W.LOCATION);
  if (issues.length) throw new MotionResourceError({ kind: asset.type, reason: RT_SERVER.METADATA, name: asset.id, details: [...new Set(issues)] });
  resolvePuppetSetPlan(normalized, (type, id) => readPuppet(type as PuppetType, id));
  writeMotionJsonAtomic(file, normalized);
  CACHE.delete(file);
  return normalized;
};
export const puppetSetForLight = (set: PuppetSet, light?: string): PuppetSet => {
  if (!light) return set;
  const night = M.NIGHT_LIGHT_RE.test(light);
  if (night === PUPPET.DARK_RE.test(set.time || PUPPET.EMPTY)) return set;
  const want = night ? PUPPET.NIGHT : PUPPET.DAY;
  const id = set.variants?.[want];
  const direct = id && readPuppet<PuppetSet>(PUPPET_TYPES.SET, id);
  if (direct && direct.styleId === set.styleId && direct.time === want) return direct;
  if (puppetPackActive()) return scopedPuppetLightVariant(set, want) || set;
  return listPuppets<PuppetSet>(PUPPET_TYPES.SET, (candidate) => candidate.styleId === set.styleId && candidate.time === want && Object.values(candidate.variants || {}).includes(set.id)).sort((a, b) => a.id.localeCompare(b.id))[0] || set;
};
export const writePuppetDiagnostic = (kind: string, key: string, data: unknown): void => writeMotionJsonAtomic(path.join(puppetLibDir(PA.DIAGNOSTICS), kind + PUPPET.DASH + puppetHash(key) + L.JSON), data);
export const deletePuppet = (type: PuppetType, id: string): boolean => {
  if (puppetPackActive()) throw new Error(PACK.WRITE_BLOCKED(id));
  if ((type === PUPPET_TYPES.BASE || type === PUPPET_TYPES.PIECE) && listPuppets<PuppetSet>(PUPPET_TYPES.SET).some((set) => motionRecipeSources(set).includes(id))) return false;
  if (!L.ID_RE.test(id)) return false;
  try {
    fs.rmSync(path.join(puppetLibDir(type), id + L.JSON), { force: true });
    return true;
  } catch {
    return false;
  }
};
export const listPuppets = <T extends PuppetAsset>(type: PuppetType, filter?: (a: T) => boolean): T[] => {
  const scoped = scopedPuppetAssets(type) as T[] | undefined;
  if (scoped) return scoped.filter((asset) => !filter || filter(asset));
  const dir = puppetLibDir(type);
  const out: T[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(L.JSON) || out.length >= L.LIST_MAX) continue;
    const a = readPuppet<T>(type, f.slice(0, -L.JSON.length));
    if (a && (!filter || filter(a))) out.push(a);
  }
  return _.orderBy(out, (a: any) => a.updatedAt || PUPPET.EMPTY, L.DESC);
};
export const puppetRefsDir = (styleId: string): string => {
  const dir = path.join(puppetLibDir(PUPPET_TYPES.STYLE), styleId, L.REFS_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const currentPuppetSet = (id?: string): PuppetSet | null => {
  if (!id) return null;
  let current = readPuppet<PuppetSet>(PUPPET_TYPES.SET, id);
  if (!current) return null;
  if (puppetPackActive()) return current;
  const seen = new Set([id]);
  const candidates = listPuppets<PuppetSet>(PUPPET_TYPES.SET, (set) => set.styleId === current!.styleId);
  for (;;) {
    const replacement = _.orderBy(
      candidates.filter((set) => !seen.has(set.id) && set.replaces?.includes(current!.id)),
      [(set) => set.placementVersion || 0, (set) => set.updatedAt],
      [RT_SHARED.DESC, RT_SHARED.DESC],
    )[0];
    if (!replacement) return current;
    current = replacement;
    seen.add(current.id);
  }
};
export const puppetPlacementKey = (set: PuppetSet): string =>
  puppetHash(
    stringifyJson([
      set.id,
      set.svg,
      set.spots,
      set.compositions,
      set.floorY,
      set.horizonY,
      set.placementVersion,
      set.sceneCondition,
      _.map(set.variants, (id, time) => {
        const variant = readPuppet<PuppetSet>(PUPPET_TYPES.SET, id);
        return [time, id, variant?.svg, variant?.spots, variant?.compositions, variant?.floorY, variant?.horizonY];
      }),
    ]),
  );
