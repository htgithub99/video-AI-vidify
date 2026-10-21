import fs from "fs";
import path from "path";
import _ from "lodash";
import { createHash, randomUUID } from "crypto";
import { PUPPET, PUPPET_LIB as L, PUPPET_TYPES, type PuppetType } from "../../../constants/motionPuppet.js";
import type { PuppetAsset } from "../../../types/motionPuppet.js";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { writeMotionJsonAtomic } from "../motionFileUtils.js";

export const puppetLibDir = (type: string): string => {
  const dir = path.join(getMotionRootDirectory(), L.DIR, type);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const puppetHash = (s: string): string => createHash(L.SHA).update(s).digest(L.HEX).slice(0, L.ID_LEN);
export const newPuppetId = (type: PuppetType, seed?: string): string => (L.ID_PREFIX[type] || type) + puppetHash(seed || randomUUID());
const CACHE = new Map<string, { mtime: number; asset: PuppetAsset }>();
export const readPuppet = <T extends PuppetAsset>(type: PuppetType, id: string): T | null => {
  if (!L.ID_RE.test(id)) return null;
  const file = path.join(puppetLibDir(type), id + L.JSON);
  try {
    const mtime = fs.statSync(file).mtimeMs;
    const hit = CACHE.get(file);
    if (hit && hit.mtime === mtime) return hit.asset as T;
    const asset = JSON.parse(fs.readFileSync(file, L.UTF8)) as T;
    CACHE.set(file, { mtime, asset });
    return asset;
  } catch {
    return null;
  }
};
export const writePuppet = <T extends PuppetAsset>(asset: T): T => {
  writeMotionJsonAtomic(path.join(puppetLibDir(asset.type), asset.id + L.JSON), asset);
  return asset;
};
export const deletePuppet = (type: PuppetType, id: string): boolean => {
  if (!L.ID_RE.test(id)) return false;
  try {
    fs.rmSync(path.join(puppetLibDir(type), id + L.JSON), { force: true });
    return true;
  } catch {
    return false;
  }
};
export const listPuppets = <T extends PuppetAsset>(type: PuppetType, filter?: (a: T) => boolean): T[] => {
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
