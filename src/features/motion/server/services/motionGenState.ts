import fs from "fs";
import path from "path";
import _ from "lodash";
import { MOTION_GEN_STATE as G } from "../../../../constants/motionGenState.js";
import type { MotionGenState } from "../../../../types/motionVideo.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
export const emptyGen = (): MotionGenState => ({ style: {}, cast: {}, locations: {}, locationInfo: {}, staging: {}, previews: {}, failed: [] });
const previewRoot = (): string => {
  const dir = path.join(getMotionRootDirectory(), G.PREVIEW_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const genPreviewDir = (...parts: string[]): string => path.join(previewRoot(), ...parts);
export const genPreviewRel = (file: string): string => path.relative(previewRoot(), file).split(path.sep).join(G.PATH_SEP);
export const resolveGenPreview = (rel: string): string | null => {
  const root = path.resolve(previewRoot());
  const file = path.resolve(root, _.toString(rel));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return null;
  return file;
};
