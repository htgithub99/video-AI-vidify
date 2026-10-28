import { stringifyJson } from "../../lib/jsonStringify.js";
import { execFile } from "child_process";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { STORAGE_CONFIG, STORAGE_JUNK_DATA, STORAGE_JUNK_MOTION, STORAGE_JUNK_ROOT, STORAGE_JUNK_ROOT_CHILDREN, STORAGE_MOVES, STORAGE_MOVES_LOCALAPPDATA, STORAGE_POWERSHELL_ARGS, STORAGE_RECYCLE_SCRIPT, STORAGE_TEXTS, StorageJunkGroup } from "../../constants/storage.js";
import { logger } from "../../lib/logger.js";
import type { StorageCleanResult, StorageJunkReport } from "../../types/storage.js";
import { getDataDirectory, getTempDirectory, usesProjectStorage } from "../utils/paths.js";
interface Candidate {
  abs: string;
  group: StorageJunkGroup;
}
const projectRoot = (): string => path.resolve(process.cwd());
const sizeOf = (target: string, budget = { left: STORAGE_CONFIG.MAX_SCAN_ENTRIES }): number => {
  try {
    const st = fs.lstatSync(target);
    if (!st.isDirectory() || st.isSymbolicLink()) return st.size;
    let total = 0;
    for (const name of fs.readdirSync(target)) {
      if (--budget.left <= 0) break;
      total += sizeOf(path.join(target, name), budget);
    }
    return total;
  } catch {
    return 0;
  }
};
const ageMs = (target: string): number => {
  try {
    return Date.now() - fs.lstatSync(target).mtimeMs;
  } catch {
    return 0;
  }
};
const movePath = (from: string, to: string): boolean => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try {
    fs.renameSync(from, to);
    return true;
  } catch {
    try {
      fs.cpSync(from, to, { recursive: true, force: false, errorOnExist: false });
      fs.rmSync(from, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return true;
    } catch {
      return false;
    }
  }
};
const mergeMove = (from: string, to: string): boolean => {
  if (!fs.existsSync(to)) return movePath(from, to);
  const fromDir = fs.statSync(from).isDirectory(),
    toDir = fs.statSync(to).isDirectory();
  if (!fromDir || !toDir) return false;
  let ok = true;
  for (const name of fs.readdirSync(from)) ok = mergeMove(path.join(from, name), path.join(to, name)) && ok;
  if (ok) fs.rmSync(from, { recursive: true, force: true });
  return ok;
};
const removeEmptyDir = (dir: string): void => {
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory() && _.isEmpty(fs.readdirSync(dir))) fs.rmdirSync(dir);
  } catch {}
};
const runMoves = (base: string, data: string, moves: { from: string; to: string; exclusive?: boolean }[]): void => {
  for (const move of moves) {
    const from = path.join(base, move.from);
    if (!fs.existsSync(from)) continue;
    const to = path.join(data, move.to);
    if (move.exclusive && fs.existsSync(to)) continue;
    if (mergeMove(from, to)) logger.log(STORAGE_TEXTS.MIGRATED, from);
    else logger.warn(STORAGE_TEXTS.MIGRATE_FAILED, from);
  }
};
export const migrateLegacyStorage = (): void => {
  const data = path.resolve(getDataDirectory());
  const localAppData = process.env[STORAGE_TEXTS.LOCALAPPDATA];
  if (localAppData) runMoves(localAppData, data, STORAGE_MOVES_LOCALAPPDATA);
  if (!usesProjectStorage()) return;
  const root = projectRoot();
  if (data === root) return;
  runMoves(root, data, STORAGE_MOVES);
  removeEmptyDir(path.join(root, STORAGE_TEXTS.TEMPLATES_DIR));
  fs.writeFileSync(path.join(data, STORAGE_CONFIG.MARKER), stringifyJson({ version: STORAGE_CONFIG.LAYOUT_VERSION, updatedAt: new Date().toISOString() }), STORAGE_TEXTS.ENCODING);
};
const isTempGroup = (group: StorageJunkGroup) => group === StorageJunkGroup.TEMP || group === StorageJunkGroup.RENDER_WORK;
const listCandidates = (): Candidate[] => {
  const out: Candidate[] = [];
  const data = path.resolve(getDataDirectory());
  const scanDir = (dir: string, rules: { group: StorageJunkGroup; match: RegExp; dir?: boolean }[]) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      if (path.resolve(abs) === data) continue;
      const rule = _.find(rules, (r) => r.match.test(name));
      if (!rule) continue;
      let isDir = false;
      try {
        isDir = fs.lstatSync(abs).isDirectory();
      } catch {
        continue;
      }
      if (!!rule.dir !== isDir) continue;
      if (isTempGroup(rule.group) && ageMs(abs) < STORAGE_CONFIG.TEMP_MIN_AGE_MS) continue;
      out.push({ abs, group: rule.group });
    }
  };
  if (usesProjectStorage() && projectRoot() !== data) scanDir(projectRoot(), STORAGE_JUNK_ROOT);
  if (usesProjectStorage() && projectRoot() !== data)
    for (const rule of STORAGE_JUNK_ROOT_CHILDREN) {
      const dir = path.join(projectRoot(), rule.path);
      if (!fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) if (rule.match.test(name) && !(rule.keep && rule.keep.test(name))) out.push({ abs: path.join(dir, name), group: rule.group });
    }
  scanDir(data, STORAGE_JUNK_DATA);
  for (const rule of STORAGE_JUNK_MOTION) {
    const dir = path.join(data, rule.path);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!rule.match.test(name)) continue;
      const abs = path.join(dir, name);
      if (isTempGroup(rule.group) && ageMs(abs) < STORAGE_CONFIG.TEMP_MIN_AGE_MS) continue;
      out.push({ abs, group: rule.group });
    }
  }
  return out;
};
const displayPath = (abs: string): string => {
  const root = projectRoot();
  const rel = path.relative(root, abs);
  return rel && !rel.startsWith(STORAGE_TEXTS.PARENT) ? rel : abs;
};
export const scanStorageJunk = (): StorageJunkReport => {
  const items = _.map(listCandidates(), (c) => ({ ...c, bytes: sizeOf(c.abs) }));
  const groups = _.map(_.groupBy(items, STORAGE_TEXTS.GROUP), (list, group) => ({ group: group as StorageJunkGroup, bytes: _.sumBy(list, STORAGE_TEXTS.BYTES), count: list.length, items: _.map(_.orderBy(list, [STORAGE_TEXTS.BYTES], [STORAGE_TEXTS.DESC]), (c) => ({ path: displayPath(c.abs), bytes: c.bytes })) }));
  return { storageDir: getDataDirectory(), totalBytes: _.sumBy(groups, STORAGE_TEXTS.BYTES), groups: _.orderBy(groups, [STORAGE_TEXTS.BYTES], [STORAGE_TEXTS.DESC]) };
};
const recycleWindows = (items: { path: string; big: boolean }[]): Promise<void> =>
  new Promise((resolve) => {
    const list = path.join(getTempDirectory(), STORAGE_TEXTS.RECYCLE_LIST);
    const script = path.join(getTempDirectory(), STORAGE_TEXTS.RECYCLE_SCRIPT_FILE);
    fs.writeFileSync(list, stringifyJson(items), STORAGE_TEXTS.ENCODING);
    fs.writeFileSync(script, STORAGE_RECYCLE_SCRIPT, STORAGE_TEXTS.ENCODING);
    execFile(STORAGE_TEXTS.POWERSHELL, [...STORAGE_POWERSHELL_ARGS, script, list], { windowsHide: false, maxBuffer: 16 * 1024 * 1024 }, () => {
      fs.rmSync(list, { force: true });
      fs.rmSync(script, { force: true });
      resolve();
    });
  });
export const cleanStorageJunk = async (groups: string[]): Promise<StorageCleanResult> => {
  const wanted = new Set(groups);
  const root = projectRoot();
  const data = path.resolve(getDataDirectory());
  const inside = (abs: string, base: string) => abs !== base && abs.startsWith(base + path.sep);
  const targets = _.map(
    _.filter(listCandidates(), (c) => wanted.has(c.group) && (inside(path.resolve(c.abs), root) || inside(path.resolve(c.abs), data))),
    (c) => {
      const abs = path.resolve(c.abs);
      return { abs, bytes: sizeOf(abs) };
    },
  );
  if (process.platform === STORAGE_TEXTS.WIN32) await recycleWindows(_.map(targets, (t) => ({ path: t.abs, big: t.bytes >= STORAGE_TEXTS.BIG_ITEM_BYTES })));
  else
    for (const t of targets)
      try {
        fs.rmSync(t.abs, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      } catch {}
  const [gone, left] = _.partition(targets, (t) => !fs.existsSync(t.abs));
  return { freedBytes: _.sumBy(gone, STORAGE_TEXTS.BYTES), removed: gone.length, failed: _.map(left, (t) => displayPath(t.abs)), recycled: process.platform === STORAGE_TEXTS.WIN32 };
};
