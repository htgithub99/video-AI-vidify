import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import {
  MOTION_TEMPLATE_ASSETS_T,
  MOTION_TEMPLATE_BO_QUA,
  MOTION_TEMPLATE_CHE_DO_CHAN_THUC_TAI_TAI_NGUYEN_3D,
  MOTION_TEMPLATE_FILES,
  MOTION_TEMPLATE_HDRI_HDR,
  MOTION_TEMPLATE_HDRI_THIEU_FILE,
  MOTION_TEMPLATE_HTTPS_CDN_POLYHAVEN_COM_ASSET_IMG_THUMBS_PNG,
  MOTION_TEMPLATE_IMP,
  MOTION_TEMPLATE_IMPORTS,
  MOTION_TEMPLATE_JPG,
  MOTION_TEMPLATE_LOI_MUC,
  MOTION_TEMPLATE_MODELS,
  MOTION_TEMPLATE_MODEL_GLB,
  MOTION_TEMPLATE_MODEL_KHONG_CO_BAN_GLTF,
  MOTION_TEMPLATE_PART,
  MOTION_TEMPLATE_PH,
  MOTION_TEMPLATE_PH_JSON,
  MOTION_TEMPLATE_POLY_HAVEN,
  MOTION_TEMPLATE_POLY_HAVEN_KHONG_CO,
  MOTION_TEMPLATE_POLY_HAVEN_LOI,
  MOTION_TEMPLATE_SYMBOL_17,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEMPLATE_TAI,
  MOTION_TEMPLATE_TAI_LOI,
  MOTION_TEMPLATE_TEXTURES,
  MOTION_TEMPLATE_TEXTURE_THIEU_ANH_MAU,
  MOTION_TEMPLATE_THUMB,
  MOTION_TEXT_1K,
  MOTION_TEXT_2K,
  MOTION_TEXT_3D_THAT,
  MOTION_TEXT_ACTIONMAP,
  MOTION_TEXT_ANIMATION,
  MOTION_TEXT_APPLICATION_OCTET_STREAM,
  MOTION_TEXT_ARM,
  MOTION_TEXT_ASCII,
  MOTION_TEXT_AUTHOR,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_BAU_TROI,
  MOTION_TEXT_BIND,
  MOTION_TEXT_BYTES,
  MOTION_TEXT_CACHE,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CARDS,
  MOTION_TEXT_CATEGORY,
  MOTION_TEXT_CC0_POLY_HAVEN,
  MOTION_TEXT_CHARACTER,
  MOTION_TEXT_CHAT_LIEU,
  MOTION_TEXT_COMPLETED,
  MOTION_TEXT_CRATE,
  MOTION_TEXT_CTRL,
  MOTION_TEXT_DATA,
  MOTION_TEXT_DESC,
  MOTION_TEXT_DIFF,
  MOTION_TEXT_DIFFUSE,
  MOTION_TEXT_DOWNLOADS,
  MOTION_TEXT_ERROR,
  MOTION_TEXT_FILE_KHONG_PHAI_GLB_HOP_LE,
  MOTION_TEXT_GLTF,
  MOTION_TEXT_GRASS,
  MOTION_TEXT_GROUND,
  MOTION_TEXT_HDRI,
  MOTION_TEXT_HDRIS,
  MOTION_TEXT_HTTPS_API_POLYHAVEN_COM,
  MOTION_TEXT_ID,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_IMAGE_KTX2,
  MOTION_TEXT_IMAGE_PNG,
  MOTION_TEXT_IMAGE_WEBP,
  MOTION_TEXT_IMPORT,
  MOTION_TEXT_INSTALLED,
  MOTION_TEXT_JPEG,
  MOTION_TEXT_JPG,
  MOTION_TEXT_KIND,
  MOTION_TEXT_LICENSE,
  MOTION_TEXT_MANIFEST_JSON,
  MOTION_TEXT_MODEL,
  MOTION_TEXT_MODELS,
  MOTION_TEXT_MODEL_GLB,
  MOTION_TEXT_MODEL_GLTF_BINARY,
  MOTION_TEXT_MODEL_GLTF_JSON,
  MOTION_TEXT_MOTION_REAL,
  MOTION_TEXT_MO_HINH,
  MOTION_TEXT_MO_HINH_2,
  MOTION_TEXT_NAME,
  MOTION_TEXT_NGUOI_DUNG_NHAP,
  MOTION_TEXT_NOR,
  MOTION_TEXT_NOR_GL,
  MOTION_TEXT_POLYHAVEN,
  MOTION_TEXT_PROP,
  MOTION_TEXT_ROAD,
  MOTION_TEXT_ROUGH,
  MOTION_TEXT_RUNNING,
  MOTION_TEXT_SET,
  MOTION_TEXT_SIZE,
  MOTION_TEXT_SKY,
  MOTION_TEXT_SOURCEID,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_30,
  MOTION_TEXT_SYMBOL_31,
  MOTION_TEXT_SYMBOL_32,
  MOTION_TEXT_TAGS,
  MOTION_TEXT_TEXTURE,
  MOTION_TEXT_TEXTURES,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VIDIFY_MOTION_1_0,
  MOTION_TEXT_YAW,
} from "../../constants/motionRuntime.js";
import type { MotionCatalog, MotionPolyHavenAsset, MotionRealAsset, MotionRealEnvOverride, MotionRealJob, MotionRealKind, MotionRealManifest, MotionSpec } from "../../types/motionVideo.js";
import { getDataDirectory } from "../utils/paths.js";
import { getRealDefaults, getRealRequirements } from "./motionEngineService.js";
import { writeMotionJsonAtomic as writeJsonAtomic } from "./motionFileUtils.js";
import { listMotionCharacters, saveMotionCharacter } from "./motionLibraryService.js";
const PH_API = MOTION_TEXT_HTTPS_API_POLYHAVEN_COM;
const PH_THUMB = (id: string) => MOTION_TEMPLATE_HTTPS_CDN_POLYHAVEN_COM_ASSET_IMG_THUMBS_PNG(`${encodeURIComponent(id)}`);
type PhType = "hdris" | "textures" | "models";
const KIND_OF: Record<PhType, MotionRealKind> = { hdris: MOTION_TEXT_HDRI, textures: MOTION_TEXT_TEXTURE, models: MOTION_TEXT_MODEL };
export const REAL_RES = { hdris: MOTION_TEXT_2K, textures: MOTION_TEXT_1K, models: MOTION_TEXT_1K } as const;
export const getRealDirectory = (): string => {
  const dir = path.join(getDataDirectory(), MOTION_TEXT_MOTION_REAL);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const manifestFile = () => path.join(getRealDirectory(), MOTION_TEXT_MANIFEST_JSON);
let manifestCache: { mtime: number; data: MotionRealManifest } | null = null;
export const readRealManifest = (): MotionRealManifest => {
  const file = manifestFile();
  try {
    const st = fs.statSync(file);
    if (manifestCache && manifestCache.mtime === st.mtimeMs) return manifestCache.data;
    const data = parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as MotionRealManifest;
    data.items = _.filter(data.items || [], (it) => !!it && !!it.id);
    data.envs = data.envs || {};
    manifestCache = { mtime: st.mtimeMs, data };
    return data;
  } catch {
    return { version: 1, items: [], envs: {} };
  }
};
const saveManifest = (m: MotionRealManifest) => {
  writeJsonAtomic(manifestFile(), m);
  manifestCache = null;
};
const updateManifest = (fn: (m: MotionRealManifest) => void): MotionRealManifest => {
  const m = _.cloneDeep(readRealManifest());
  fn(m);
  saveManifest(m);
  return m;
};
export const resolveRealFile = (rel: string): string | null => {
  const root = getRealDirectory();
  const full = path.resolve(root, _.trimStart(decodeURIComponent(_.toString(rel)), MOTION_TEXT_SYMBOL_31));
  if (!full.startsWith(path.resolve(root) + path.sep)) return null;
  return fs.existsSync(full) && fs.statSync(full).isFile() ? full : null;
};
export const realContentType = (file: string): string => {
  const ext = path.extname(file).toLowerCase();
  return (
    ({ ".gltf": MOTION_TEXT_MODEL_GLTF_JSON, ".glb": MOTION_TEXT_MODEL_GLTF_BINARY, ".bin": MOTION_TEXT_APPLICATION_OCTET_STREAM, ".jpg": MOTION_TEXT_IMAGE_JPEG, ".jpeg": MOTION_TEXT_IMAGE_JPEG, ".png": MOTION_TEXT_IMAGE_PNG, ".webp": MOTION_TEXT_IMAGE_WEBP, ".hdr": MOTION_TEXT_APPLICATION_OCTET_STREAM, ".ktx2": MOTION_TEXT_IMAGE_KTX2 } as Record<string, string>)[ext] ||
    MOTION_TEXT_APPLICATION_OCTET_STREAM
  );
};
const listCache = new Map<string, { at: number; data: Record<string, any> }>();
const phList = async (type: PhType): Promise<Record<string, any>> => {
  const hit = listCache.get(type);
  if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.data;
  const diskCache = path.join(getRealDirectory(), MOTION_TEXT_CACHE, MOTION_TEMPLATE_PH_JSON(`${type}`));
  try {
    const res = await fetch(MOTION_TEMPLATE_ASSETS_T(`${PH_API}`, `${type}`), { headers: { "User-Agent": MOTION_TEXT_VIDIFY_MOTION_1_0 } });
    if (!res.ok) throw new Error(MOTION_TEMPLATE_POLY_HAVEN(`${res.status}`));
    const data = (await res.json()) as Record<string, any>;
    listCache.set(type, { at: Date.now(), data });
    fs.mkdirSync(path.dirname(diskCache), { recursive: true });
    fs.writeFileSync(diskCache, stringifyJson(data));
    return data;
  } catch (e) {
    if (fs.existsSync(diskCache)) return parseJson(fs.readFileSync(diskCache, MOTION_TEXT_UTF8));
    throw e;
  }
};
export const listPolyHaven = async (type: PhType, opts: { category?: string; search?: string; limit?: number } = {}): Promise<MotionPolyHavenAsset[]> => {
  const all = await phList(type);
  const installed = new Set(_.map(_.filter(readRealManifest().items, { source: MOTION_TEXT_POLYHAVEN }), MOTION_TEXT_SOURCEID));
  const q = _.toLower(_.trim(opts.search || ""));
  return _.take(
    _.orderBy(
      _.compact(
        _.map(all, (v: any, id: string) => {
          const cats: string[] = v.categories || [];
          if (opts.category && !_.includes(cats, opts.category)) return null;
          if (q && !_.includes(_.toLower(MOTION_TEMPLATE_SYMBOL_17(`${id}`, `${v.name}`, `${(v.tags || []).join(MOTION_TEXT_SYMBOL_13)}`, `${cats.join(MOTION_TEXT_SYMBOL_13)}`)), q)) return null;
          return { id, name: v.name || id, type, categories: cats, tags: v.tags || [], thumb: v.thumbnail_url || PH_THUMB(id), downloads: v.download_count || 0, authors: _.keys(v.authors || {}), installed: installed.has(id) } as MotionPolyHavenAsset;
        }),
      ),
      [MOTION_TEXT_INSTALLED, MOTION_TEXT_DOWNLOADS],
      [MOTION_TEXT_DESC, MOTION_TEXT_DESC],
    ),
    opts.limit || 300,
  );
};
const download = async (url: string, dest: string, signal?: AbortSignal, onBytes?: (n: number) => void): Promise<number> => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return fs.statSync(dest).size;
  const res = await fetch(url, { signal, headers: { "User-Agent": MOTION_TEXT_VIDIFY_MOTION_1_0 } });
  if (!res.ok || !res.body) throw new Error(MOTION_TEMPLATE_TAI_LOI(`${res.status}`, `${path.basename(url)}`));
  const tmp = MOTION_TEMPLATE_PART(`${dest}`);
  let n = 0;
  const body = Readable.fromWeb(res.body as any);
  body.on(MOTION_TEXT_DATA, (chunk: Buffer) => {
    n += chunk.length;
    onBytes?.(chunk.length);
  });
  await pipeline(body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  return n;
};
const safeName = (s: string) => _.toString(s).replace(/[^a-zA-Z0-9_.-]/g, MOTION_TEXT_SYMBOL_30);
export const downloadPolyHaven = async (type: PhType, id: string, signal?: AbortSignal, onBytes?: (n: number) => void): Promise<MotionRealAsset> => {
  const existing = _.find(readRealManifest().items, { source: MOTION_TEXT_POLYHAVEN, sourceId: id });
  if (existing) return existing;
  const [files, list] = await Promise.all([fetch(MOTION_TEMPLATE_FILES(`${PH_API}`, `${encodeURIComponent(id)}`), { signal }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? MOTION_TEMPLATE_POLY_HAVEN_KHONG_CO(`${id}`) : MOTION_TEMPLATE_POLY_HAVEN_LOI(`${r.status}`))))), phList(type).catch(() => ({}) as Record<string, any>)]);
  const info = (list as Record<string, any>)[id] || {};
  const res = REAL_RES[type];
  const root = getRealDirectory();
  let bytes = 0;
  const item: MotionRealAsset = {
    id: MOTION_TEMPLATE_PH(`${safeName(id)}`),
    name: info.name || id,
    kind: KIND_OF[type],
    source: MOTION_TEXT_POLYHAVEN,
    sourceId: id,
    license: MOTION_TEXT_CC0_POLY_HAVEN,
    author: _.keys(info.authors || {}).join(MOTION_TEXT_SYMBOL_14) || undefined,
    thumb: info.thumbnail_url || PH_THUMB(id),
    bytes: 0,
    bind: [],
    tags: _.take(info.tags || [], 12),
    category: _.first(info.categories || []),
    createdAt: new Date().toISOString(),
  };
  if (type === MOTION_TEXT_HDRIS) {
    const entry = files?.hdri?.[res]?.hdr || files?.hdri?.[MOTION_TEXT_1K]?.hdr;
    if (!entry?.url) throw new Error(MOTION_TEMPLATE_HDRI_THIEU_FILE(`${id}`, `${res}`));
    const rel = MOTION_TEMPLATE_HDRI_HDR(`${safeName(id)}`, `${res}`);
    bytes += await download(entry.url, path.join(root, rel), signal, onBytes);
    item.file = rel;
  } else if (type === MOTION_TEXT_TEXTURES) {
    const pick = (key: string) => files?.[key]?.[res]?.jpg?.url || files?.[key]?.[MOTION_TEXT_1K]?.jpg?.url;
    const maps: MotionRealAsset["maps"] = {};
    const dir = MOTION_TEMPLATE_TEXTURES(`${safeName(id)}`);
    for (const [k, key] of [
      [MOTION_TEXT_DIFF, MOTION_TEXT_DIFFUSE],
      [MOTION_TEXT_NOR, MOTION_TEXT_NOR_GL],
      [MOTION_TEXT_ARM, MOTION_TEXT_ARM],
    ] as const) {
      const url = pick(key) || (k === MOTION_TEXT_ARM ? pick(MOTION_TEXT_ROUGH) : null);
      if (!url) continue;
      const rel = MOTION_TEMPLATE_JPG(`${dir}`, `${k}`);
      bytes += await download(url, path.join(root, rel), signal, onBytes);
      maps[k] = rel;
    }
    if (!maps.diff) throw new Error(MOTION_TEMPLATE_TEXTURE_THIEU_ANH_MAU(`${id}`));
    item.maps = maps;
  } else {
    const entry = files?.gltf?.[res]?.gltf || files?.gltf?.[MOTION_TEXT_1K]?.gltf;
    if (!entry?.url) throw new Error(MOTION_TEMPLATE_MODEL_KHONG_CO_BAN_GLTF(`${id}`));
    const dir = MOTION_TEMPLATE_MODELS(`${safeName(id)}`);
    const mainRel = MOTION_TEMPLATE_SYMBOL_4(`${dir}`, `${path.basename(new URL(entry.url).pathname)}`);
    bytes += await download(entry.url, path.join(root, mainRel), signal, onBytes);
    for (const [rel, inc] of _.toPairs<any>(entry.include || {})) {
      const clean = _.filter(rel.split(/[\\/]/), (p) => p && p !== MOTION_TEXT_SYMBOL_32).join(MOTION_TEXT_SYMBOL_16);
      bytes += await download(inc.url, path.join(root, dir, clean), signal, onBytes);
    }
    item.file = mainRel;
  }
  item.bytes = bytes;
  updateManifest((m) => {
    m.items = [..._.reject(m.items, { id: item.id }), item];
  });
  return item;
};
const jobs = new Map<string, MotionRealJob & { ctrl: AbortController }>();
const publicJob = (j: MotionRealJob & { ctrl: AbortController }): MotionRealJob => _.omit(j, MOTION_TEXT_CTRL) as MotionRealJob;
export const getRealJob = (id: string): MotionRealJob | null => {
  const j = jobs.get(id);
  return j ? publicJob(j) : null;
};
export const cancelRealJob = (id: string) => jobs.get(id)?.ctrl.abort();
export const startRealDownloadJob = (label: string, list: { type: PhType; id: string }[]): MotionRealJob => {
  const ctrl = new AbortController();
  const job: MotionRealJob & { ctrl: AbortController } = { id: randomUUID(), status: MOTION_TEXT_RUNNING, label, done: 0, total: list.length, bytes: 0, log: [], ctrl };
  jobs.set(job.id, job);
  void ensurePolyHaven(
    list,
    (msg) => job.log.push(msg),
    ctrl.signal,
    (n) => (job.bytes += n),
    () => job.done++,
  )
    .then((r) => {
      job.status = ctrl.signal.aborted ? MOTION_TEXT_CANCELLED : MOTION_TEXT_COMPLETED;
      if (r.failed.length) job.log.push(MOTION_TEMPLATE_LOI_MUC(`${r.failed.length}`, `${_.map(r.failed, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`));
    })
    .catch((e) => {
      job.status = ctrl.signal.aborted ? MOTION_TEXT_CANCELLED : MOTION_TEXT_ERROR;
      job.error = e?.message;
    });
  return publicJob(job);
};
export const ensurePolyHaven = async (list: { type: PhType; id: string }[], log?: (msg: string) => void, signal?: AbortSignal, onBytes?: (n: number) => void, onDone?: () => void): Promise<{ downloaded: number; failed: { id: string; error: string }[] }> => {
  const have = new Set(_.map(_.filter(readRealManifest().items, { source: MOTION_TEXT_POLYHAVEN }), MOTION_TEXT_SOURCEID));
  const todo = _.uniqBy(
    _.filter(list, (x) => !!x?.id && !have.has(x.id)),
    MOTION_TEXT_ID,
  );
  const failed: { id: string; error: string }[] = [];
  let downloaded = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length && !signal?.aborted) {
      const x = todo[next++];
      try {
        log?.(MOTION_TEMPLATE_TAI(`${x.type === MOTION_TEXT_HDRIS ? MOTION_TEXT_BAU_TROI : x.type === MOTION_TEXT_TEXTURES ? MOTION_TEXT_CHAT_LIEU : MOTION_TEXT_MO_HINH_2}`, `${x.id}`));
        await downloadPolyHaven(x.type, x.id, signal, onBytes);
        downloaded++;
      } catch (e: any) {
        if (signal?.aborted) return;
        failed.push({ id: x.id, error: _.toString(e?.message) });
        log?.(MOTION_TEMPLATE_BO_QUA(`${x.id}`, `${e?.message}`));
      } finally {
        onDone?.();
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { downloaded, failed };
};
export const ensureRealForSpec = async (spec: MotionSpec, log?: (msg: string) => void, signal?: AbortSignal) => {
  const reqs = getRealRequirements(spec, readRealManifest());
  const have = new Set(_.map(_.filter(readRealManifest().items, { source: MOTION_TEXT_POLYHAVEN }), MOTION_TEXT_SOURCEID));
  const missing = _.filter(reqs, (r) => !have.has(r.id));
  if (!missing.length) return { downloaded: 0, failed: [] as { id: string; error: string }[] };
  log?.(MOTION_TEMPLATE_CHE_DO_CHAN_THUC_TAI_TAI_NGUYEN_3D(`${missing.length}`));
  return ensurePolyHaven(missing, log, signal);
};
export const starterPackList = (): { type: PhType; id: string }[] => {
  const d = getRealDefaults();
  return [..._.map(d.hdris, (id) => ({ type: MOTION_TEXT_HDRIS, id })), ..._.map(d.textures, (id) => ({ type: MOTION_TEXT_TEXTURES, id })), ..._.map(d.models, (id) => ({ type: MOTION_TEXT_MODELS, id }))];
};
export interface RealImportMeta {
  name?: string;
  kind?: MotionRealKind;
  license?: string;
  author?: string;
  bind?: string[];
  size?: number;
  yaw?: number;
  category?: string;
  tags?: string[];
  clips?: string[];
  actionMap?: Record<string, string>;
  thumb?: string;
  newCharacter?: boolean;
  newId?: string;
  base?: string;
}
const sanitizeMeta = (meta: RealImportMeta) => ({
  name: _.truncate(_.toString(meta.name || MOTION_TEXT_MO_HINH), { length: 80 }),
  kind: (_.includes([MOTION_TEXT_MODEL, MOTION_TEXT_CHARACTER, MOTION_TEXT_ANIMATION], meta.kind) ? meta.kind : MOTION_TEXT_MODEL) as MotionRealKind,
  license: _.truncate(_.toString(meta.license || MOTION_TEXT_NGUOI_DUNG_NHAP), { length: 120 }),
  author: meta.author ? _.truncate(_.toString(meta.author), { length: 80 }) : undefined,
  bind: _.take(
    _.filter(_.map(_.castArray(meta.bind || []), _.toString), (b) => /^[*a-z0-9_-]{1,64}$/i.test(b)),
    40,
  ),
  size: _.clamp(_.toNumber(meta.size) || 0, 0, 500),
  yaw: _.toNumber(meta.yaw) || 0,
  category: meta.category ? _.toString(meta.category) : undefined,
  tags: _.take(
    _.map(_.castArray(meta.tags || []), (t) => _.truncate(_.toString(t), { length: 30 })),
    12,
  ),
  clips: _.take(_.map(_.castArray(meta.clips || []), _.toString), 80),
  actionMap: _.pickBy(_.mapValues(meta.actionMap || {}, _.toString), (v, k) => /^[a-z_]{2,30}$/.test(k) && !!v) as Record<string, string>,
});
export const importRealModel = (glb: Buffer, metaIn: RealImportMeta): MotionRealAsset => {
  if (glb.length < 20 || glb.toString(MOTION_TEXT_ASCII, 0, 4) !== MOTION_TEXT_GLTF) throw new Error(MOTION_TEXT_FILE_KHONG_PHAI_GLB_HOP_LE);
  const meta = sanitizeMeta(metaIn);
  const id = MOTION_TEMPLATE_IMP(`${randomUUID().slice(0, 8)}`);
  const dir = MOTION_TEMPLATE_IMPORTS(`${id}`);
  const root = getRealDirectory();
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, dir, MOTION_TEXT_MODEL_GLB), glb);
  let thumb: string | undefined;
  const m = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(_.toString(metaIn.thumb));
  if (m) {
    thumb = MOTION_TEMPLATE_THUMB(`${dir}`, `${m[1] === MOTION_TEXT_JPEG ? MOTION_TEXT_JPG : m[1]}`);
    fs.writeFileSync(path.join(root, thumb), Buffer.from(m[2], MOTION_TEXT_BASE64));
  }
  const item: MotionRealAsset = { id, source: MOTION_TEXT_IMPORT, file: MOTION_TEMPLATE_MODEL_GLB(`${dir}`), bytes: glb.length, createdAt: new Date().toISOString(), thumb, ...meta };
  if (meta.kind === MOTION_TEXT_CHARACTER && metaIn.newCharacter) {
    const base = _.find(listMotionCharacters(), { id: metaIn.base }) || {};
    const ch = saveMotionCharacter({ ...(base as object), name: meta.name, tags: [...meta.tags, MOTION_TEXT_3D_THAT], realModel: id });
    item.bind = _.uniq([...item.bind, ch.id]);
  } else if (meta.kind !== MOTION_TEXT_CHARACTER && metaIn.newId && /^[a-z0-9_]{2,40}$/.test(metaIn.newId)) {
    item.newId = metaIn.newId;
    item.base = _.toString(metaIn.base || MOTION_TEXT_CRATE);
  }
  updateManifest((mf) => {
    mf.items.push(item);
  });
  return item;
};
export const updateRealItem = (id: string, patch: RealImportMeta): MotionRealAsset | null => {
  let out: MotionRealAsset | null = null;
  updateManifest((m) => {
    const it = _.find(m.items, { id });
    if (!it) return;
    const clean = sanitizeMeta({ ...it, ...patch } as RealImportMeta);
    _.assign(it, _.pick(clean, [MOTION_TEXT_NAME, MOTION_TEXT_LICENSE, MOTION_TEXT_AUTHOR, MOTION_TEXT_BIND, MOTION_TEXT_SIZE, MOTION_TEXT_YAW, MOTION_TEXT_CATEGORY, MOTION_TEXT_TAGS, MOTION_TEXT_ACTIONMAP]));
    if (it.source === MOTION_TEXT_IMPORT) it.kind = clean.kind;
    out = it;
  });
  return out;
};
export const deleteRealItem = (id: string): boolean => {
  const it = _.find(readRealManifest().items, { id });
  if (!it) return false;
  const root = getRealDirectory();
  const target = it.source === MOTION_TEXT_IMPORT ? MOTION_TEMPLATE_IMPORTS(`${it.id}`) : it.kind === MOTION_TEXT_HDRI ? it.file : it.kind === MOTION_TEXT_TEXTURE ? MOTION_TEMPLATE_TEXTURES(`${safeName(_.toString(it.sourceId))}`) : path.dirname(_.toString(it.file));
  if (target) {
    const full = path.resolve(root, target);
    if (full.startsWith(path.resolve(root) + path.sep)) fs.rmSync(full, { recursive: true, force: true });
  }
  updateManifest((m) => {
    m.items = _.reject(m.items, { id });
  });
  return true;
};
export const setRealEnvOverride = (envId: string, over: MotionRealEnvOverride | null): MotionRealManifest =>
  updateManifest((m) => {
    if (!/^[a-z0-9_]{2,40}$/.test(envId)) return;
    if (!over || _.isEmpty(over)) delete m.envs[envId];
    else m.envs[envId] = _.pick(over, [MOTION_TEXT_HDRI, MOTION_TEXT_SKY, MOTION_TEXT_GROUND, MOTION_TEXT_ROAD, MOTION_TEXT_GRASS, MOTION_TEXT_SET, MOTION_TEXT_CARDS]);
  });
export const realStats = () => {
  const m = readRealManifest();
  return { count: m.items.length, bytes: _.sumBy(m.items, MOTION_TEXT_BYTES), byKind: _.countBy(m.items, MOTION_TEXT_KIND) };
};
export const withRealCatalog = (catalog: MotionCatalog): MotionCatalog => {
  const extra = _.filter(readRealManifest().items, (it) => !!it.newId && it.kind !== MOTION_TEXT_CHARACTER && !_.some(catalog.assets, { id: it.newId }));
  if (!extra.length) return catalog;
  return { ...catalog, assets: [...catalog.assets, ..._.map(extra, (it) => ({ id: it.newId as string, name: it.name, category: it.category || MOTION_TEXT_PROP, tags: [...(it.tags || []), MOTION_TEXT_3D_THAT] }))] };
};
