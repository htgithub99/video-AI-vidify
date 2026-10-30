import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { parseJson } from "../../../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { MOTION_LIBRARY_RELEASE as C } from "../../../../../constants/motionLibraryRelease.js";
import { MOTION_PACK as PACK } from "../../../../../constants/motionPack.js";
import { PUPPET_TYPES as T } from "../../../../../constants/motionPuppet.js";
import type { PuppetAsset } from "../../../../../types/motionPuppet.js";
const validatedReports = new Map<string, { mtime: number; size: number; release: string }>();
export const releasedPuppetAssetAllowed = (asset: PuppetAsset): boolean => {
  if (!(RT_SERVER.STYLEID in asset) || !Object.values(PACK.PRESETS).includes(asset.styleId) || asset.type === T.SERIES) return true;
  if (asset.libraryVersion !== C.VERSION) return false;
  if (asset.type === T.SET) return !asset.recipe && asset.plan?.version === C.PLAN_VERSION && !!asset.plan.baseId && Array.isArray(asset.plan.pieces) && asset.plan.pieces.every((piece) => !!piece?.assetId);
  if (asset.type === T.BASE) return !asset.recipeOnly && asset.decomposition === RT_SERVER.CLEAN && !asset.recipeTemplate;
  if (asset.type === T.PIECE) return !asset.recipeOnly && !asset.recipeSvg && !asset.tags.includes(RT_SHARED.EXTRACTED_COMPONENT);
  return true;
};
export const activePuppetLibrary = (root: string): { directory: string; version?: number } => {
  const pointer = path.join(root, C.POINTER);
  if (!fs.existsSync(pointer)) return { directory: root };
  const saved = parseJson(fs.readFileSync(pointer, RT_SERVER.UTF8));
  if (saved.version !== C.VERSION || typeof saved.release !== "string" || !C.ID.test(saved.release)) throw new Error(C.INVALID);
  const directory = path.join(root, C.RELEASES, saved.release);
  const reportFile = path.join(directory, C.REPORT);
  const stat = fs.statSync(reportFile);
  const cached = validatedReports.get(reportFile);
  if (!cached || cached.mtime !== stat.mtimeMs || cached.size !== stat.size || cached.release !== saved.release) {
    const report = parseJson(fs.readFileSync(reportFile, RT_SERVER.UTF8));
    if (report.version !== C.VERSION || report.release !== saved.release || report.validated !== true) throw new Error(C.INVALID);
    validatedReports.set(reportFile, { mtime: stat.mtimeMs, size: stat.size, release: saved.release });
  }
  return { directory, version: saved.version };
};
