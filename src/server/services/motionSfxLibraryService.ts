import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { MOTION_SOUND_CONFIG as C, MOTION_SOUND_KINDS } from "../../constants/motionSound.js";
import { soundAssetKinds, soundText } from "../../lib/motionSound.js";
import { motionSpeakerTraits } from "../../lib/motionAudioDirection.js";
import type { MotionSoundAsset, MotionSoundCue } from "../../types/motionVideo.js";
import { getDataDirectory } from "../utils/paths.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
let pending: Promise<MotionSoundAsset[]> | undefined;
let cachedRoot: string = C.EMPTY;
let cached: MotionSoundAsset[] | undefined;
export const motionSfxRoot = (): string => path.join(getDataDirectory(), C.FOLDER);
const hash = (value: Buffer | string): string => createHash(C.HASH).update(value).digest(C.HEX);
export const ensureMotionSfxLibrary = async (source = process.env[C.SOURCE_ENV] || C.SOURCE): Promise<MotionSoundAsset[]> => {
  const root = motionSfxRoot(),
    sourceRoot = path.resolve(source),
    manifest = path.join(sourceRoot, C.MANIFEST);
  let sourceSignature: string | undefined;
  try {
    const stat = fs.statSync(manifest);
    sourceSignature = hash(JSON.stringify([sourceRoot, stat.size, stat.mtimeMs]));
  } catch {}
  const cacheKey = root + (sourceSignature || C.EMPTY);
  if (cachedRoot === cacheKey && cached) return cached;
  if (cachedRoot === cacheKey && pending) return pending;
  cachedRoot = cacheKey;
  pending = (async () => {
    fs.mkdirSync(path.join(root, C.ASSETS), { recursive: true });
    const indexFile = path.join(root, C.INDEX);
    try {
      const index = JSON.parse(await fs.promises.readFile(indexFile, C.UTF8));
      if (index.version === C.VERSION && (!sourceSignature || index.sourceSignature === sourceSignature) && Array.isArray(index.assets) && index.assets.length)
        return index.assets.filter((asset: MotionSoundAsset) => /^[a-f0-9]{64}$/.test(asset.id) && fs.existsSync(path.join(root, C.ASSETS, asset.id + C.MP3))).map((asset: MotionSoundAsset) => ({ ...asset, kinds: soundAssetKinds(asset.name, asset.sources?.[0]?.file) }));
    } catch {}
    if (!fs.existsSync(manifest)) return [];
    const list = JSON.parse(await fs.promises.readFile(manifest, C.UTF8)),
      assets = new Map<string, MotionSoundAsset>();
    for (const entry of (Array.isArray(list) ? list : []).slice(0, C.IMPORT_LIMIT)) {
      if (!entry || typeof entry.file !== "string" || !entry.file.toLowerCase().endsWith(C.MP3)) continue;
      const file = path.resolve(sourceRoot, entry.file);
      if (!file.startsWith(sourceRoot + path.sep) || !fs.existsSync(file) || !fs.realpathSync(file).startsWith(fs.realpathSync(sourceRoot) + path.sep)) continue;
      try {
        const data = await fs.promises.readFile(file),
          id = hash(data),
          origin = { source: String(entry.nguon || C.EMPTY), file: entry.file, license: String(entry.giay_phep || C.EMPTY) };
        const existing = assets.get(id);
        if (existing) {
          existing.sources.push(origin);
          continue;
        }
        const name = path
            .basename(entry.file, C.MP3)
            .replace(/^.*?__\d+_/, C.EMPTY)
            .replace(/[_-]/g, MR.MOTION_TEXT_SYMBOL_13)
            .trim(),
          text = soundText(name);
        const kinds = soundAssetKinds(name, entry.file);
        if (!(Number(entry.giay) > 0)) continue;
        const target = path.join(root, C.ASSETS, id + C.MP3);
        if (!fs.existsSync(target)) await fs.promises.writeFile(target, data);
        assets.set(id, { id, file: id + C.MP3, name, duration: Number(entry.giay), kinds, tags: [...new Set(text.split(/\W+/).filter((word) => word.length > 2))], sources: [origin] });
      } catch {}
    }
    const result = [...assets.values()];
    writeMotionJsonAtomic(indexFile, { version: C.VERSION, sourceSignature, importedAt: new Date().toISOString(), source: sourceRoot, assets: result });
    return result;
  })();
  try {
    cached = await pending;
    return cached;
  } finally {
    pending = undefined;
  }
};
export const resolveMotionSfxAsset = async (id: string): Promise<string | undefined> => {
  if (!/^[a-f0-9]{64}$/.test(id)) return undefined;
  const assets = await ensureMotionSfxLibrary();
  if (!assets.some((asset) => asset.id === id)) return undefined;
  const file = path.join(motionSfxRoot(), C.ASSETS, id + C.MP3);
  return fs.existsSync(file) ? file : undefined;
};
export const soundCandidates = (cue: Pick<MotionSoundCue, "kind" | "description" | "layer" | "assetId" | "speakerGender">, assets: MotionSoundAsset[], limit = 4): MotionSoundAsset[] => {
  const text = soundText(cue.description),
    words = new Set(text.split(/\W+/).filter((word) => word.length > 2)),
    stems = new Set([...words].filter((word) => word.length >= 4).map((word) => word.slice(0, 4)));
  return assets
    .flatMap((asset) => {
      if (!asset.kinds.includes(cue.kind)) return [];
      const name = soundText(asset.name);
      if (([MR.MOTION_TEXT_BREATH, MR.MOTION_TEXT_GASP, MR.MOTION_TEXT_LAUGH, MR.MOTION_TEXT_CRY, MR.MOTION_TEXT_COUGH] as readonly string[]).includes(cue.kind) && cue.speakerGender) {
        const gender = motionSpeakerTraits({ description: asset.name }).gender;
        if (gender && gender !== cue.speakerGender) return [];
      }
      if (cue.layer === MR.MOTION_TEXT_AMBIENCE && (asset.duration < 5 || (asset.kinds.some((kind) => MOTION_SOUND_KINDS.find((k) => k.kind === kind)?.layer === MR.MOTION_TEXT_ACTION) && !/ambien|atmospher|background|soundscape|\bloop\b/.test(name)))) return [];
      if (([MR.MOTION_TEXT_BREATH, MR.MOTION_TEXT_GASP] as readonly string[]).includes(cue.kind) && /dragon|creature|monster|sleep/.test(name) && !/dragon|creature|monster|sleep/.test(text)) return [];
      if (cue.kind === MR.MOTION_TEXT_FOOTSTEP && /\bwood(?:en)?\b|\bplanks?\b|\btimber\b|san go/.test(text) && /forest|woods|leaves|gravel|snow|sand/.test(name)) return [];
      if (cue.kind === MR.MOTION_TEXT_FOOTSTEP && /forest|leaves|gravel|snow|sand/.test(text) && /wood(?:en)? floor|concrete|stairs/.test(name)) return [];
      if (cue.kind === MR.MOTION_TEXT_DOOR && /knock|go cua/.test(text) && !/knock/.test(name)) return [];
      if (cue.kind === MR.MOTION_TEXT_DOOR && /open|mo cua/.test(text) && /clos|slam|knock|bell/.test(name)) return [];
      if (cue.kind === MR.MOTION_TEXT_DOOR && /clos|dong cua/.test(text) && /open|knock|bell/.test(name)) return [];
      if (cue.kind === MR.MOTION_TEXT_PHONE && /vibrat|rung/.test(text) && !/vibrat/.test(name)) return [];
      const score = 100 + asset.tags.reduce((sum, word) => sum + (words.has(word) ? 6 : word.length >= 4 && stems.has(word.slice(0, 4)) ? 4 : 0), 0) + (cue.assetId === asset.id ? 1000 : 0) + (cue.layer !== MR.MOTION_TEXT_AMBIENCE && asset.duration < 8 ? 2 : 0);
      return [{ asset, score }];
    })
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id))
    .slice(0, limit)
    .map((item) => item.asset);
};
export const motionSoundCatalogPrompt = async (context: string): Promise<string> => {
  try {
    const assets = await ensureMotionSfxLibrary(),
      text = soundText(context);
    const relevant = MOTION_SOUND_KINDS.filter((kind) => kind.pattern.test(text));
    const selected = relevant.flatMap((kind) => soundCandidates({ kind: kind.kind, layer: kind.layer, description: context }, assets, 2));
    return C.CATALOGUE + JSON.stringify([...new Map(selected.map((asset) => [asset.id, { id: asset.id, name: asset.name, seconds: asset.duration, kinds: asset.kinds }])).values()].slice(0, 32));
  } catch {
    return C.EMPTY;
  }
};
