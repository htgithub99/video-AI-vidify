import fs from "fs";
import JSZip from "jszip";
import _ from "lodash";
import path from "path";
import { MOTION_LIB_CONFIG as C, MOTION_LIB_EXCLUDE_WORDS, MOTION_LIB_KENNEY_PACKS, MOTION_LIB_MIME, MOTION_LIB_MODEL_DIR, MOTION_LIB_SYNONYMS, MOTION_LIB_ZIP_LINK, MOTION_LIB_TEXT as T } from "../../constants/motionAssetLibrary.js";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { getMotionErrorSummary } from "../../lib/motionUtils.js";
import { getDataDirectory } from "../utils/paths.js";
export interface MotionLibItem {
  id: string;
  src: string;
  name: string;
  cat: string;
  tags: string[];
  size: [number, number, number];
  file?: string;
  pack?: string;
  desc?: string;
}
interface MotionLibCatalog {
  version: number;
  items: MotionLibItem[];
  packs: Record<string, number>;
}
type Log = (line: string) => void;
const libRoot = (): string => {
  const dir = path.join(getDataDirectory(), C.ROOT);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const catalogFile = (): string => path.join(libRoot(), C.CATALOG_FILE);
let heavy: Set<string> | null = null;
const heavyFile = (): string => path.join(libRoot(), C.PH_HEAVY_FILE);
const heavySet = (): Set<string> => {
  if (heavy) return heavy;
  try {
    heavy = new Set(_.map(parseJson(fs.readFileSync(heavyFile(), T.UTF8)) as string[], _.toString));
  } catch {
    heavy = new Set();
  }
  return heavy;
};
const markHeavy = (ref: string): void => {
  heavySet().add(ref);
  fs.mkdirSync(path.dirname(heavyFile()), { recursive: true });
  fs.writeFileSync(heavyFile(), stringifyJson([...heavySet()]));
  engineMap = { catalog: null, map: {} };
};
const dirBytes = (dir: string): number => {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? dirBytes(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size;
  return n;
};
const scanHeavy = (): void => {
  const root = path.join(libRoot(), C.PH_DIR);
  if (!fs.existsSync(root)) return;
  for (const id of fs.readdirSync(root)) {
    const ref = T.PH_PREFIX + id;
    if (!heavySet().has(ref) && dirBytes(path.join(root, id)) > C.PH_MAX_BYTES) markHeavy(ref);
  }
};
let cached: MotionLibCatalog | null = null;
let installing: Promise<void> | null = null;
const request = async (url: string, signal?: AbortSignal): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), C.DOWNLOAD_TIMEOUT_MS);
  const relay = () => ctrl.abort();
  signal?.addEventListener(T.ABORT, relay, { once: true });
  try {
    const res = await fetch(url, { headers: { [T.UA_HEADER]: C.USER_AGENT }, signal: ctrl.signal });
    if (!res.ok) throw new Error(T.HTTP(res.status));
    return res;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener(T.ABORT, relay);
  }
};
type Mat = number[];
const IDENTITY: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const multiply = (a: Mat, b: Mat): Mat => {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
};
const localMatrix = (node: any): Mat => {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) return node.matrix;
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0, 2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
};
export const gltfSize = (json: any): [number, number, number] | null => {
  const lo = [Infinity, Infinity, Infinity],
    hi = [-Infinity, -Infinity, -Infinity];
  const visit = (index: number, parent: Mat, depth: number) => {
    const node = json.nodes?.[index];
    if (!node || depth > 64) return;
    const m = multiply(parent, localMatrix(node));
    if (node.mesh != null)
      for (const prim of json.meshes?.[node.mesh]?.primitives || []) {
        const acc = json.accessors?.[prim.attributes?.POSITION];
        if (!acc?.min || !acc?.max) continue;
        for (let i = 0; i < 8; i++) {
          const p = [i & 1 ? acc.max[0] : acc.min[0], i & 2 ? acc.max[1] : acc.min[1], i & 4 ? acc.max[2] : acc.min[2]];
          for (let r = 0; r < 3; r++) {
            const v = m[r] * p[0] + m[4 + r] * p[1] + m[8 + r] * p[2] + m[12 + r];
            lo[r] = Math.min(lo[r], v);
            hi[r] = Math.max(hi[r], v);
          }
        }
      }
    for (const child of node.children || []) visit(child, m, depth + 1);
  };
  const scene = json.scenes?.[json.scene ?? 0];
  for (const n of scene?.nodes || []) visit(n, IDENTITY, 0);
  if (!Number.isFinite(lo[0])) return null;
  return [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]].map((v) => Math.round(v * 1000) / 1000) as [number, number, number];
};
export const glbSize = (buf: Buffer): [number, number, number] | null => {
  if (buf.length < 20 || buf.readUInt32LE(0) !== T.GLB_MAGIC) return null;
  const len = buf.readUInt32LE(12);
  return gltfSize(parseJson(buf.subarray(20, 20 + len).toString(T.UTF8)));
};
const installKenney = async (slug: string, log: Log, signal?: AbortSignal): Promise<void> => {
  const dir = path.join(libRoot(), C.KENNEY_DIR, slug);
  if (fs.existsSync(path.join(dir, C.DONE))) return;
  log(T.INSTALLING(slug));
  const html = await (await request(C.KENNEY_PAGE + slug, signal)).text();
  const link = html.match(MOTION_LIB_ZIP_LINK);
  if (!link) throw new Error(T.NO_ZIP);
  const zip = await JSZip.loadAsync(Buffer.from(await (await request(C.KENNEY_HOST + link[0], signal)).arrayBuffer()));
  let count = 0;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const m = name.match(MOTION_LIB_MODEL_DIR);
    if (!m) continue;
    const rel = name.slice((m.index || 0) + m[0].length);
    if (!rel || rel.includes(T.DOTDOT)) continue;
    const out = path.join(dir, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await entry.async(T.NODEBUFFER));
    if (T.EXT_GLB.test(rel)) count++;
  }
  if (!count) throw new Error(T.NO_MODELS);
  fs.writeFileSync(path.join(dir, C.DONE), String(count));
  log(T.INSTALLED(slug, count));
};
const words = (s: string): string[] => _.uniq(_.compact(_.toLower(s).split(T.WORD_SPLIT)));
const walk = (dir: string, out: string[] = []): string[] => {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (T.EXT_GLB.test(f)) out.push(p);
  }
  return out;
};
const toPosix = (p: string): string => p.split(path.sep).join(T.SLASH);
const kenneyItems = (): MotionLibItem[] => {
  const items: MotionLibItem[] = [];
  for (const pack of MOTION_LIB_KENNEY_PACKS) {
    const dir = path.join(libRoot(), C.KENNEY_DIR, pack.slug);
    if (!fs.existsSync(path.join(dir, C.DONE))) continue;
    for (const file of walk(dir)) {
      let size: [number, number, number] | null = null;
      try {
        size = file.toLowerCase().endsWith(T.GLB) ? glbSize(fs.readFileSync(file)) : gltfSize(parseJson(fs.readFileSync(file, T.UTF8)));
      } catch {
        size = null;
      }
      if (!size) continue;
      const rel = toPosix(path.relative(dir, file)).replace(T.EXT_GLB, "");
      const base = path.basename(rel);
      items.push({ id: T.K_PREFIX + pack.slug + T.SLASH + rel, src: T.KENNEY, name: base.replace(T.SEPARATORS, T.SPACE), cat: pack.cat, tags: _.uniq([...words(base), ...words(pack.slug), ...words(pack.label)]), size: size.map((v) => Math.round(v * pack.unit * 100) / 100) as [number, number, number], file: toPosix(path.relative(libRoot(), file)), pack: pack.slug });
    }
  }
  return items;
};
const phCatalog = async (signal?: AbortSignal): Promise<Record<string, any>> => {
  const file = path.join(libRoot(), C.PH_CACHE);
  if (fs.existsSync(file)) {
    try {
      return parseJson(fs.readFileSync(file, T.UTF8));
    } catch {}
  }
  const data = await (await request(C.PH_API + T.ASSETS_MODELS, signal)).json();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stringifyJson(data));
  return data;
};
const phItems = (data: Record<string, any>): MotionLibItem[] =>
  _.compact(
    _.map(data, (v: any, id: string) => {
      const d = v?.dimensions;
      if (!Array.isArray(d) || d.length < 3) return null;
      const cats = _.filter(v.categories || [], (c: string) => !c.startsWith(T.COLLECTION));
      return {
        id: T.PH_PREFIX + id,
        src: T.POLYHAVEN,
        name: _.toString(v.name || id),
        cat: _.toString(cats[0] || T.PROPS),
        tags: _.uniq([...words(id), ...words(_.toString(v.name)), ..._.flatMap(cats, words), ..._.flatMap(v.tags || [], words)]),
        size: [d[0] / 1000, d[2] / 1000, d[1] / 1000].map((x) => Math.round(x * 100) / 100) as [number, number, number],
        desc: _.truncate(_.toString(v.description), { length: 110 }),
      };
    }),
  );
export const rebuildLibraryCatalog = async (signal?: AbortSignal): Promise<MotionLibCatalog> => {
  let ph: MotionLibItem[] = [];
  try {
    ph = phItems(await phCatalog(signal));
  } catch {
    ph = [];
  }
  const kenney = kenneyItems();
  const catalog: MotionLibCatalog = { version: C.CATALOG_VERSION, items: [...kenney, ...ph], packs: _.countBy(kenney, T.PACK) };
  catalog.packs[T.POLYHAVEN] = ph.length;
  fs.writeFileSync(catalogFile(), stringifyJson(catalog));
  cached = catalog;
  return catalog;
};
export const getLibraryCatalog = (): MotionLibCatalog => {
  if (cached) return cached;
  try {
    const data = parseJson(fs.readFileSync(catalogFile(), T.UTF8)) as MotionLibCatalog;
    if (data.version === C.CATALOG_VERSION) cached = data;
  } catch {}
  return cached || { version: C.CATALOG_VERSION, items: [], packs: {} };
};
export const ensureMotionLibrary = (log: Log = _.noop, signal?: AbortSignal): Promise<void> => {
  if (installing) return installing;
  installing = (async () => {
    let changed = !getLibraryCatalog().items.length;
    for (const pack of MOTION_LIB_KENNEY_PACKS) {
      if (signal?.aborted) break;
      const done = fs.existsSync(path.join(libRoot(), C.KENNEY_DIR, pack.slug, C.DONE));
      if (done) continue;
      try {
        await installKenney(pack.slug, log, signal);
        changed = true;
      } catch (e) {
        log(T.INSTALL_FAIL(pack.slug, getMotionErrorSummary(e)));
      }
    }
    const catalog = changed ? await rebuildLibraryCatalog(signal) : getLibraryCatalog();
    if (!catalog.items.length) await rebuildLibraryCatalog(signal);
    scanHeavy();
    log(T.READY(getLibraryCatalog().items.length));
  })().finally(() => {
    installing = null;
  });
  return installing;
};
export const findLibraryItem = (ref: string): MotionLibItem | undefined => _.find(getLibraryCatalog().items, { id: ref });
export const ensureLibraryModel = async (ref: string, log: Log = _.noop, signal?: AbortSignal): Promise<string> => {
  const item = findLibraryItem(ref);
  if (!item) throw new Error(T.UNKNOWN(ref));
  if (item.file) return C.ASSET_PREFIX + item.file;
  if (heavySet().has(item.id)) throw new Error(T.PH_HEAVY(item.id, 0));
  const id = item.id.slice(T.PH_PREFIX.length);
  const dir = path.join(libRoot(), C.PH_DIR, id);
  const name = id + T.UNDERSCORE + C.PH_RES + T.GLTF;
  const rel = toPosix(path.join(C.PH_DIR, id, name));
  if (fs.existsSync(path.join(dir, name))) {
    const bytes = dirBytes(dir);
    if (bytes > C.PH_MAX_BYTES) {
      markHeavy(item.id);
      throw new Error(T.PH_HEAVY(id, bytes / T.MB));
    }
    return C.ASSET_PREFIX + rel;
  }
  log(T.PH_FETCH(id));
  try {
    const files = await (await request(C.PH_API + T.FILES + encodeURIComponent(id), signal)).json();
    const entry = files?.[T.GLTF_KEY]?.[C.PH_RES]?.[T.GLTF_KEY];
    if (!entry?.url) throw new Error(T.NO_GLTF);
    const total = (_.toNumber(entry.size) || 0) + _.sumBy(Object.values<any>(entry.include || {}), (inc) => _.toNumber(inc?.size) || 0);
    if (total > C.PH_MAX_BYTES) {
      markHeavy(item.id);
      throw new Error(T.PH_HEAVY(id, total / T.MB));
    }
    const tmp = path.join(dir, T.TMP_DIR);
    fs.mkdirSync(tmp, { recursive: true });
    for (const [incRel, inc] of Object.entries<any>(entry.include || {})) {
      if (incRel.includes(T.DOTDOT)) continue;
      const out = path.join(tmp, incRel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(await (await request(inc.url, signal)).arrayBuffer()));
    }
    fs.writeFileSync(path.join(tmp, name), Buffer.from(await (await request(entry.url, signal)).arrayBuffer()));
    for (const f of fs.readdirSync(tmp)) fs.renameSync(path.join(tmp, f), path.join(dir, f));
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch (e) {
    throw new Error(T.PH_FAIL(id, getMotionErrorSummary(e)));
  }
  return C.ASSET_PREFIX + rel;
};
export const resolveLibraryAsset = (rel: string): string | null => {
  const clean = _.toString(rel).replace(T.LEADING_SLASH, "");
  if (!clean.startsWith(C.ASSET_PREFIX)) return null;
  const root = path.resolve(libRoot());
  const file = path.resolve(root, clean.slice(C.ASSET_PREFIX.length));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return null;
  return file;
};
export const libraryMime = (file: string): string => MOTION_LIB_MIME[path.extname(file).toLowerCase()] || MOTION_LIB_MIME[T.DEFAULT_MIME];
const allowed = (it: MotionLibItem): boolean => !heavySet().has(it.id) && !_.some(words(it.name), (w) => MOTION_LIB_EXCLUDE_WORDS.includes(w));
const phUrl = (id: string): string => C.ASSET_PREFIX + C.PH_DIR + T.SLASH + id + T.SLASH + id + T.UNDERSCORE + C.PH_RES + T.GLTF;
let engineMap: { catalog: MotionLibCatalog | null; map: Record<string, { url: string; size: number[] }> } = { catalog: null, map: {} };
export const libraryEngineMap = (): Record<string, { url: string; size: number[] }> => {
  const catalog = getLibraryCatalog();
  if (engineMap.catalog === catalog) return engineMap.map;
  const map: Record<string, { url: string; size: number[] }> = {};
  for (const it of catalog.items) if (allowed(it)) map[it.id] = { url: it.file ? C.ASSET_PREFIX + it.file : phUrl(it.id.slice(T.PH_PREFIX.length)), size: it.size };
  engineMap = { catalog, map };
  return map;
};
export const libraryPromptList = (items: MotionLibItem[]): string => _.map(items, (it) => T.LIST_LINE(it)).join(T.NEWLINE);
export const libraryCandidates = (text: string, limit: number = C.CANDIDATES): MotionLibItem[] => {
  const items = _.filter(getLibraryCatalog().items, allowed);
  if (!items.length) return [];
  const stem = (w: string): string => (w.length > 3 && w.endsWith(T.PLURAL) ? w.slice(0, -1) : w);
  const query = _.map(words(text), stem);
  const expanded = _.uniq([...query, ..._.flatMap(query, (w) => _.map(MOTION_LIB_SYNONYMS[w] || [], stem))]).filter((w) => w.length >= 3);
  const labels: Record<string, string[]> = _.fromPairs(_.map(MOTION_LIB_KENNEY_PACKS, (p) => [p.slug, _.map(words(p.label), stem)]));
  const scored = _.map(items, (it) => {
    const nameWords = _.map(words(it.name), stem);
    const tags = _.map(it.tags, stem);
    const label = it.pack ? labels[it.pack] || [] : [];
    let score = 0;
    for (const w of expanded) {
      if (nameWords.includes(w)) score += 3;
      else if (label.includes(w)) score += 2;
      else if (tags.includes(w)) score += 1;
    }
    return { it, score };
  });
  const ranked = _.orderBy(
    _.filter(scored, (s) => s.score > 0),
    [T.SCORE],
    [T.DESC],
  );
  const perPack: Record<string, number> = {};
  const out: MotionLibItem[] = [];
  for (const { it } of ranked) {
    const key = it.pack || it.cat;
    if ((perPack[key] || 0) >= C.PER_PACK) continue;
    perPack[key] = (perPack[key] || 0) + 1;
    out.push(it);
    if (out.length >= limit) break;
  }
  return out;
};
export const libraryStatus = () => {
  const c = getLibraryCatalog();
  return { items: c.items.length, packs: c.packs, installing: !!installing };
};
