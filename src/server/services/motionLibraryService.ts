import { parseJson } from "../../lib/jsonStringify.js";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { MOTION_TEMPLATE_USER, MOTION_TEXT_ACCESSORIES, MOTION_TEXT_AGE, MOTION_TEXT_BUILD, MOTION_TEXT_COLORS, MOTION_TEXT_FACIAL, MOTION_TEXT_GENDER, MOTION_TEXT_HAIR, MOTION_TEXT_HEADWEAR, MOTION_TEXT_HEIGHT, MOTION_TEXT_NAME, MOTION_TEXT_NHAN_VAT_MOI, MOTION_TEXT_OUTFIT, MOTION_TEXT_REALMODEL, MOTION_TEXT_SFX_PREFIX, MOTION_TEXT_TAGS, MOTION_TEXT_UTF8 } from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import type { MotionCharacterDef, MotionResultItem } from "../../types/motionVideo.js";
import { getDataDirectory } from "../utils/paths.js";
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
const libraryFile = (): string => path.join(getDataDirectory(), MOTION_VIDEO_CONSTANTS.LIBRARY_FILE);
const resultsFile = (): string => path.join(getMotionRootDirectory(), MOTION_VIDEO_CONSTANTS.RESULTS_FILE);
const readJson = <T>(file: string, fallback: T): T => {
  try {
    if (!fs.existsSync(file)) return fallback;
    return parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as T;
  } catch {
    return fallback;
  }
};
const ALLOWED_KEYS = [MOTION_TEXT_NAME, MOTION_TEXT_TAGS, MOTION_TEXT_GENDER, MOTION_TEXT_AGE, MOTION_TEXT_BUILD, MOTION_TEXT_HEIGHT, MOTION_TEXT_HAIR, MOTION_TEXT_HEADWEAR, MOTION_TEXT_OUTFIT, MOTION_TEXT_FACIAL, MOTION_TEXT_ACCESSORIES, MOTION_TEXT_COLORS, MOTION_TEXT_REALMODEL] as const;
const sanitizeCharacter = (input: Partial<MotionCharacterDef>): Partial<MotionCharacterDef> => {
  const picked = _.pick(input || {}, ALLOWED_KEYS) as Partial<MotionCharacterDef>;
  picked.name = _.truncate(_.toString(picked.name || MOTION_TEXT_NHAN_VAT_MOI), { length: 60 });
  picked.tags = _.take(
    _.map(_.castArray(picked.tags || []), (t) => _.truncate(_.toString(t), { length: 30 })),
    12,
  );
  picked.accessories = _.take(_.map(_.castArray(picked.accessories || []), _.toString), 12);
  picked.height = _.clamp(_.toNumber(picked.height) || 1, 0.5, 1.4);
  picked.colors = _.pickBy(picked.colors || {}, (v) => /^#[0-9a-fA-F]{3,8}$/.test(_.toString(v))) as Record<string, string>;
  if (picked.realModel !== undefined) picked.realModel = /^[a-z0-9_-]{1,64}$/i.test(_.toString(picked.realModel)) ? _.toString(picked.realModel) : undefined;
  return picked;
};
export const listMotionCharacters = (): MotionCharacterDef[] => readJson<MotionCharacterDef[]>(libraryFile(), []);
export const saveMotionCharacter = (input: Partial<MotionCharacterDef>, id?: string): MotionCharacterDef => {
  const all = listMotionCharacters();
  const now = new Date().toISOString();
  const clean = sanitizeCharacter(input);
  const existing = id ? _.find(all, { id }) : undefined;
  const next: MotionCharacterDef = existing ? _.assign({}, existing, clean, { id: existing.id, builtin: false, updatedAt: now }) : (_.assign({ id: MOTION_TEMPLATE_USER(`${randomUUID().slice(0, 8)}`), builtin: false, createdAt: now, updatedAt: now }, clean) as MotionCharacterDef);
  const rest = _.reject(all, { id: next.id });
  writeJsonAtomic(libraryFile(), [next, ...rest]);
  return next;
};
export const deleteMotionCharacter = (id: string): boolean => {
  const all = listMotionCharacters();
  const rest = _.reject(all, { id });
  if (rest.length === all.length) return false;
  writeJsonAtomic(libraryFile(), rest);
  return true;
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
