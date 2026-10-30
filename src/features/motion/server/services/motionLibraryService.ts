import fs from "fs";
import _ from "lodash";
import path from "path";
import { MOTION_TEXT_SFX_PREFIX, MOTION_TEXT_UTF8 } from "../../../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../../../constants/motionVideo.js";
import { parseJson } from "../../../../lib/jsonStringify.js";
import type { MotionResultItem } from "../../../../types/motionVideo.js";
import { getDataDirectory } from "../../../../server/utils/paths.js";
import { writeMotionJsonAtomic as writeJsonAtomic } from "./motionFileUtils.js";
export const getMotionRootDirectory = (): string => {
  const dir = path.join(getDataDirectory(), MOTION_VIDEO_CONSTANTS.OUTPUT_FOLDER, MOTION_VIDEO_CONSTANTS.MOTION_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const getMotionWorkDirectory = (id: string): string => {
  const dir = path.join(getMotionRootDirectory(), MOTION_VIDEO_CONSTANTS.WORK_FOLDER, path.basename(id));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const getMotionAudioDirectory = (): string => {
  const dir = path.join(getMotionRootDirectory(), MOTION_VIDEO_CONSTANTS.AUDIO_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const resultsFile = (): string => path.join(getMotionRootDirectory(), MOTION_VIDEO_CONSTANTS.RESULTS_FILE);
const readJson = <T>(file: string, fallback: T): T => {
  try {
    if (!fs.existsSync(file)) return fallback;
    return parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as T;
  } catch {
    return fallback;
  }
};
export const listMotionResults = (): MotionResultItem[] => _.filter(readJson<MotionResultItem[]>(resultsFile(), []), (item) => fs.existsSync(path.join(getMotionRootDirectory(), path.basename(item.fileName))));
export const addMotionResult = (item: MotionResultItem): void => {
  const all = readJson<MotionResultItem[]>(resultsFile(), []);
  writeJsonAtomic(resultsFile(), _.take([item, ..._.reject(all, { id: item.id })], MOTION_VIDEO_CONSTANTS.MAX_RESULTS));
};
const removePath = (target: string): number => {
  const bytes = pathSize(target);
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    return 0;
  }
  return fs.existsSync(target) ? 0 : bytes;
};
const pathSize = (target: string): number => {
  try {
    const stat = fs.statSync(target);
    if (!stat.isDirectory()) return stat.size;
    return _.sumBy(fs.readdirSync(target), (name) => pathSize(path.join(target, name)));
  } catch {
    return 0;
  }
};
export const deleteMotionResult = (id: string): { success: boolean; freedBytes: number } => {
  const all = readJson<MotionResultItem[]>(resultsFile(), []);
  const item = _.find(all, { id });
  if (!item) return { success: false, freedBytes: 0 };
  const root = getMotionRootDirectory();
  const freedBytes = removePath(path.join(root, path.basename(item.fileName))) + removePath(path.join(root, MOTION_VIDEO_CONSTANTS.WORK_FOLDER, path.basename(item.id)));
  writeJsonAtomic(resultsFile(), _.reject(all, { id }));
  return { success: true, freedBytes };
};
export const clearMotionResults = (busyIds: string[] = []): { removed: number; freedBytes: number } => {
  const root = getMotionRootDirectory();
  const all = readJson<MotionResultItem[]>(resultsFile(), []);
  const videos = _.filter(fs.readdirSync(root), (name) => _.endsWith(_.toLower(name), MOTION_VIDEO_CONSTANTS.EXT_MP4));
  const workRoot = path.join(root, MOTION_VIDEO_CONSTANTS.WORK_FOLDER);
  const works = fs.existsSync(workRoot) ? _.reject(fs.readdirSync(workRoot), (name) => _.includes(busyIds, name)) : [];
  const audioDir = getMotionAudioDirectory();
  const sfx = _.filter(fs.readdirSync(audioDir), (name) => _.startsWith(name, MOTION_TEXT_SFX_PREFIX));
  const freedBytes = _.sum([..._.map(videos, (name) => removePath(path.join(root, name))), ..._.map(works, (name) => removePath(path.join(workRoot, name))), ..._.map(sfx, (name) => removePath(path.join(audioDir, name)))]);
  writeJsonAtomic(resultsFile(), []);
  return { removed: Math.max(all.length, videos.length), freedBytes };
};
