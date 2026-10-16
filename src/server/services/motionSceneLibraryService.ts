import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import * as SRT from "../../constants/sourceText.js";
import { createHash, randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_REFERENCE_CONFIG as RC } from "../../constants/motionReference.js";
import { MOTION_SCENE_LIBRARY as C, MOTION_SCENE_LIBRARY_PROMPT as P } from "../../constants/motionSceneLibrary.js";
import { normalizeMotionReferences } from "../../lib/motionReference.js";
import { MOTION_SCENE_CATALOG_PROMPT, MOTION_SCENE_LIBRARY_MODES as MODES, MOTION_SCENE_TYPE_OTHER, motionSceneType, motionSceneTypesPrompt, type MotionSceneLibraryMode } from "../../constants/motionSceneCatalog.js";
import { characterVariantLook } from "../../lib/motionCharacterVariant.js";
import type { MotionCastMember, MotionDrawingMode, MotionGenStyle, MotionPlace, MotionStoryAnalysis, MotionReferenceStyle, MotionSceneAsset, MotionSceneAssetKind, MotionSceneStyleSet, MotionStyleReference } from "../../types/motionVideo.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { getMotionEngineDir } from "./motionEngineService.js";
interface SceneIndex { version: number; items: MotionSceneAsset[]; }
const SHA = SRT.SOURCE_TEXT_SHA256;
const HEX = SRT.SOURCE_TEXT_HEX;
const B64 = SRT.SOURCE_TEXT_BASE64;
const ensureDir = (dir: string): string => {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
const libraryRoot = (): string => ensureDir(path.join(getMotionRootDirectory(), C.FOLDER));
const subDir = (name: string): string => ensureDir(path.join(libraryRoot(), name));
const indexFile = (): string => path.join(libraryRoot(), C.INDEX_FILE);
const itemFile = (id: string): string => path.join(subDir(C.ITEMS_FOLDER), id + C.TEXT.JSON_EXT);
const thumbFile = (id: string): string => path.join(subDir(C.THUMBS_FOLDER), id + C.THUMB_EXT);
const styleDir = (key: string): string => path.join(subDir(C.STYLES_FOLDER), key);
const readJson = <T>(file: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(file, MR.MOTION_TEXT_UTF8)) as T;
  } catch {
    return fallback;
  }
};
let indexCache: SceneIndex | null = null;
const readIndex = (): SceneIndex => {
  if (indexCache) return indexCache;
  const data = readJson<SceneIndex>(indexFile(), { version: C.VERSION, items: [] });
  indexCache = { version: C.VERSION, items: Array.isArray(data.items) ? data.items.filter((item) => C.ID_RE.test(item?.id || MR.MOTION_TEXT_EMPTY)) : [] };
  return indexCache;
};
const writeIndex = (index: SceneIndex): void => {
  indexCache = index;
  writeMotionJsonAtomic(indexFile(), index);
};
const cleanText = (value: unknown, max: number): string =>
  _.truncate(
    _.toString(value ?? MR.MOTION_TEXT_EMPTY)
      .replace(/\s+/g, C.TEXT.SPACE)
      .trim(),
    { length: max },
  );
export const cleanSceneTags = (value: unknown): string[] =>
  _.take(
    _.uniq(
      _.castArray(value || [])
        .map((tag) => cleanText(tag, 32).toLowerCase())
        .filter(Boolean),
    ),
    C.TAGS_MAX,
  );
export const isSceneAssetId = (value: unknown): value is string => typeof value === MR.MOTION_TEXT_STRING && C.ID_RE.test(value as string);
export const isSceneStyleKey = (value: unknown): value is string => typeof value === MR.MOTION_TEXT_STRING && C.STYLE_RE.test(value as string);
const drawingModeOf = (mode: unknown): MotionDrawingMode => (mode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D);
const imageBytes = (reference: MotionStyleReference): { mime: string; bytes: Buffer } => {
  const match = RC.DATA_URL.exec(reference.dataUrl)!;
  return { mime: match[1], bytes: Buffer.from(match[2], B64) };
};
export const motionAssetStyleKey = (references: unknown, drawingMode: unknown): string => {
  const mode = drawingModeOf(drawingMode);
  const list = normalizeMotionReferences(references);
  if (!list.length) return C.STYLE_PLAIN + mode;
  const prints = list.map((reference) => createHash(SHA).update(imageBytes(reference).bytes).digest(HEX)).sort();
  return mode + C.TEXT.DASH + createHash(SHA).update(JSON.stringify(prints)).digest(HEX).slice(0, C.STYLE_KEY_LENGTH);
};
export const sharedStyleKey = (styleKey: string): string => C.STYLE_SHARED + (styleKey.startsWith(MR.MOTION_TEXT_2D + C.TEXT.DASH) || styleKey.endsWith(C.TEXT.DASH + MR.MOTION_TEXT_2D) ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D);
export const sharedStyleKeyOf = (drawingMode: unknown): string => C.STYLE_SHARED + drawingModeOf(drawingMode);
export const sceneStyleFits = (itemKey: string, styleKey: string): boolean => itemKey === styleKey || itemKey === sharedStyleKey(styleKey);
export const listSceneAssets = (styleKey?: string, kind?: MotionSceneAssetKind): MotionSceneAsset[] => readIndex().items.filter((item) => (!styleKey || sceneStyleFits(item.styleKey, styleKey)) && (!kind || item.kind === kind));
export const clearSceneLibrary = (): void => {
  [C.ITEMS_FOLDER, C.THUMBS_FOLDER, C.STYLES_FOLDER].forEach((name) => fs.rmSync(path.join(libraryRoot(), name), { recursive: true, force: true }));
  writeIndex({ version: C.VERSION, items: [] });
};
export const getSceneAsset = (id: unknown): { item: MotionSceneAsset; data: any } | null => {
  if (!isSceneAssetId(id)) return null;
  const item = readIndex().items.find((entry) => entry.id === id);
  if (!item) return null;
  const data = readJson<any>(itemFile(id), null);
  return data ? { item, data } : null;
};
export const saveSceneAsset = (input: { kind: MotionSceneAssetKind; styleKey: string; type?: string; name: string; description?: string; tags?: unknown; time?: string; interior?: boolean; gender?: string; role?: string; motion?: boolean; size?: number[]; from?: string }, data: unknown, thumb?: string | null): MotionSceneAsset => {
  const id = C.ID_PREFIX[input.kind] + randomUUID().replace(/-/g, MR.MOTION_TEXT_EMPTY).slice(0, 10);
  writeMotionJsonAtomic(itemFile(id), data);
  let hasThumb = false;
  if (thumb && fs.existsSync(thumb)) {
    fs.copyFileSync(thumb, thumbFile(id));
    hasThumb = true;
  }
  const item: MotionSceneAsset = _.omitBy(
    {
      id,
      kind: input.kind,
      styleKey: input.styleKey,
      type: input.type,
      name: cleanText(input.name, C.NAME_MAX) || id,
      description: cleanText(input.description, C.DESCRIPTION_MAX),
      tags: cleanSceneTags(input.tags),
      time: input.time,
      interior: input.interior,
      gender: input.gender,
      role: input.role ? cleanText(input.role, C.NAME_MAX) : undefined,
      motion: input.motion,
      size: input.size,
      from: input.from ? cleanText(input.from, C.NAME_MAX) : undefined,
      thumb: hasThumb,
      uses: 0,
      createdAt: Date.now(),
    },
    _.isUndefined,
  ) as unknown as MotionSceneAsset;
  const index = readIndex();
  writeIndex({ ...index, items: [...index.items, item] });
  return item;
};
export const touchSceneAssets = (ids: string[]): void => {
  if (!ids.length) return;
  const now = Date.now();
  const index = readIndex();
  writeIndex({ ...index, items: index.items.map((item) => (ids.includes(item.id) ? { ...item, uses: (item.uses || 0) + 1, usedAt: now } : item)) });
};
export const removeSceneAsset = (id: unknown): void => {
  if (!isSceneAssetId(id) || !getSceneAsset(id)) throw new Error(C.ERRORS.NOT_FOUND);
  fs.rmSync(itemFile(id), { force: true });
  fs.rmSync(thumbFile(id), { force: true });
  const index = readIndex();
  writeIndex({ ...index, items: index.items.filter((item) => item.id !== id) });
};
export const renameSceneAsset = (id: unknown, name: unknown): MotionSceneAsset => {
  const clean = cleanText(name, C.NAME_MAX);
  if (!clean) throw new Error(C.ERRORS.NAME_REQUIRED);
  const index = readIndex();
  const item = index.items.find((entry) => entry.id === id);
  if (!item) throw new Error(C.ERRORS.NOT_FOUND);
  const next = { ...item, name: clean };
  writeIndex({ ...index, items: index.items.map((entry) => (entry.id === item.id ? next : entry)) });
  return next;
};
export const sceneAssetThumbPath = (id: unknown): string | null => (isSceneAssetId(id) && fs.existsSync(thumbFile(id)) ? thumbFile(id) : null);
const foldText = (value: string): string => value.normalize(MR.MOTION_TEXT_NFD).replace(/[̀-ͯ]/g, MR.MOTION_TEXT_EMPTY).replace(/đ/g, MR.MOTION_TEXT_D).toLowerCase();
const tokensOf = (value: string): Set<string> =>
  new Set(
    foldText(value)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
const assetTokens = (item: MotionSceneAsset): Set<string> => tokensOf(_.compact([item.name, item.role, item.description, ...(item.tags || [])]).join(C.TEXT.SPACE));
const tokenMatches = (wanted: Set<string>, offered: Set<string>): number => _.sumBy([...wanted], (token) => (offered.has(token) ? 1 : 0));
const assetFit = (words: (string | undefined)[]): ((item: MotionSceneAsset) => number) => {
  const wanted = tokensOf(_.compact(words).join(C.TEXT.SPACE));
  return (item) => -tokenMatches(wanted, assetTokens(item));
};
const rankAssets = (items: MotionSceneAsset[], context: string, limit: number): MotionSceneAsset[] => {
  const words = tokensOf(context);
  const score = (item: MotionSceneAsset): number => {
    const hits = tokenMatches(words, assetTokens(item));
    return hits * 10 + Math.min(item.uses || 0, 20) + (item.usedAt || item.createdAt) / 1e13;
  };
  return _.take(_.orderBy(items, [score], [MR.MOTION_TEXT_DESC]), limit);
};
const catalogLine = (item: MotionSceneAsset): string => {
  const details = item.kind === C.KIND_LOCATION ? [item.time, item.interior ? MR.MOTION_TEXT_TOON_CAT_INTERIOR : MR.MOTION_TEXT_EXTERIOR, item.tags.join(C.TEXT.LIST), item.description] : [item.gender, item.role, item.tags.join(C.TEXT.LIST), item.description];
  return [item.id, item.type || item.kind, item.name, _.truncate(_.compact(details).join(C.TEXT.SEP), { length: C.CATALOG_TEXT_MAX })].join(C.TEXT.PIPE);
};
export const sceneTypeOf = (value: unknown): string | undefined => (motionSceneType(value) ? (value as string) : value === MOTION_SCENE_TYPE_OTHER ? MOTION_SCENE_TYPE_OTHER : undefined);
export const sceneLibraryCatalog = (styleKey: string, context: string, options: { characterMotion?: boolean; items?: boolean } = {}): { prompt: string; locations: number; characters: number } => {
  const base = [MOTION_SCENE_CATALOG_PROMPT.TYPES(motionSceneTypesPrompt()), MOTION_SCENE_CATALOG_PROMPT.COLOURS];
  if (!options.items) return { prompt: [...base, P.NO_CATALOG].join(C.TEXT.NEWLINE), locations: 0, characters: 0 };
  const locations = rankAssets(listSceneAssets(styleKey, C.KIND_LOCATION), context, C.CATALOG_LOCATIONS);
  const characters = rankAssets(
    listSceneAssets(styleKey, C.KIND_CHARACTER).filter((item) => !options.characterMotion || item.motion),
    context,
    C.CATALOG_CHARACTERS,
  );
  if (!locations.length && !characters.length) return { prompt: [...base, P.NO_CATALOG].join(C.TEXT.NEWLINE), locations: 0, characters: 0 };
  return { prompt: [...base, P.CATALOG_HEADER, ...locations.map(catalogLine), ...characters.map(catalogLine)].join(C.TEXT.NEWLINE), locations: locations.length, characters: characters.length };
};
export const scenePropCatalog = (styleKey: string, context: string): string => {
  const props = rankAssets(listSceneAssets(styleKey, C.KIND_PROP), context, C.CATALOG_PROPS);
  if (!props.length) return MR.MOTION_TEXT_EMPTY;
  return [P.PROP_HEADER, ...props.map((item) => [item.id, motionSceneType(item.type)?.en || item.name, item.name, (item.size || []).join(C.TEXT.TIMES), item.from || MR.MOTION_TEXT_EMPTY].join(C.TEXT.PIPE))].join(C.TEXT.NEWLINE);
};
const usedRefs = (value: unknown, found: Set<string> = new Set()): Set<string> => {
  if (Array.isArray(value)) value.forEach((entry) => usedRefs(entry, found));
  else if (value && typeof value === MR.MOTION_TEXT_OBJECT) {
    const node = value as Record<string, unknown>;
    if (node.shape === MR.MOTION_TEXT_USE && isSceneAssetId(node.ref)) found.add(node.ref as string);
    Object.values(node).forEach((entry) => usedRefs(entry, found));
  }
  return found;
};
export const attachSceneProps = (location: any, styleKey: string): string[] => {
  if (!location || typeof location !== MR.MOTION_TEXT_OBJECT) return [];
  const refs = [...usedRefs(location.nodes || [])].filter((ref) => !location.defs?.[ref]);
  const added: string[] = [];
  for (const ref of refs) {
    const asset = getSceneAsset(ref);
    if (!asset || asset.item.kind !== C.KIND_PROP || !sceneStyleFits(asset.item.styleKey, styleKey) || !Array.isArray(asset.data)) continue;
    location.defs = { [ref]: asset.data, ...(location.defs || {}) };
    added.push(ref);
  }
  touchSceneAssets(added);
  return added;
};
const inlineNodes = (nodes: unknown, location: any, depth: number): any[] => {
  if (!Array.isArray(nodes) || depth > C.PROP_MAX_DEPTH) return [];
  return nodes.flatMap((raw) => {
    if (!raw || typeof raw !== MR.MOTION_TEXT_OBJECT) return [];
    const node: any = _.cloneDeep(raw);
    if (typeof node.mat === MR.MOTION_TEXT_STRING && location.materials?.[node.mat]) node.mat = _.cloneDeep(location.materials[node.mat]);
    if (node.shape === MR.MOTION_TEXT_USE && typeof node.ref === MR.MOTION_TEXT_STRING && Array.isArray(location.defs?.[node.ref])) {
      const children = inlineNodes(location.defs[node.ref], location, depth + 1);
      return [_.omitBy({ shape: MR.MOTION_TEXT_GROUP, name: node.name || node.ref, pos: node.pos, rot: node.rot, scale: node.scale, mat: node.mat, children }, _.isUndefined)];
    }
    if (Array.isArray(node.children)) node.children = inlineNodes(node.children, location, depth + 1);
    if (node.node) node.node = inlineNodes([node.node], location, depth + 1)[0];
    return [node];
  });
};
const countNodes = (nodes: any[]): number => _.sumBy(nodes, (node) => 1 + countNodes(node?.children || []) + (node?.node ? 1 : 0));
export const extractSceneProps = (location: any, measure: (nodes: any[]) => number[] | null, keepAll = false): { name: string; nodes: any[]; size: number[] }[] => {
  const defs: Record<string, unknown> = location?.defs || {};
  const nested = new Set<string>();
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === MR.MOTION_TEXT_OBJECT) {
      const node = value as Record<string, unknown>;
      if (node.shape === MR.MOTION_TEXT_USE && typeof node.ref === MR.MOTION_TEXT_STRING) nested.add(node.ref as string);
      Object.values(node).forEach(collect);
    }
  };
  Object.values(defs).forEach(collect);
  return Object.entries(defs).flatMap(([name, nodes]) => {
    if ((!keepAll && nested.has(name)) || isSceneAssetId(name) || !Array.isArray(nodes)) return [];
    const inlined = inlineNodes(nodes, location, 0);
    const size = measure(inlined);
    if (!size || (!keepAll && (countNodes(inlined) < C.PROP_MIN_NODES || Math.max(...size) < C.PROP_MIN_SIZE))) return [];
    return [{ name, nodes: inlined, size: size.map((value) => Math.round(value * 100) / 100) }];
  });
};
const styleFile = (key: string): string => path.join(styleDir(key), C.STYLE_FILE);
export const readSceneStyle = (key: unknown): MotionSceneStyleSet | null => (isSceneStyleKey(key) ? readJson<MotionSceneStyleSet | null>(styleFile(key), null) : null);
export const saveSceneStyle = (key: string, patch: { references?: MotionStyleReference[]; drawingMode: MotionDrawingMode; referenceStyle?: MotionReferenceStyle; genStyle?: MotionGenStyle; name?: string }): MotionSceneStyleSet => {
  if (!isSceneStyleKey(key)) throw new Error(C.ERRORS.INVALID);
  const dir = ensureDir(styleDir(key));
  const previous = readSceneStyle(key);
  let images = previous?.images || [];
  if (!images.length && patch.references?.length) {
    images = patch.references.map((reference, index) => {
      const { mime, bytes } = imageBytes(reference);
      const file = RC.NAME_PREFIX + (index + 1) + (RC.EXTENSIONS[mime as keyof typeof RC.EXTENSIONS] || C.REF_EXT);
      fs.writeFileSync(path.join(dir, file), bytes);
      return file;
    });
  }
  const next: MotionSceneStyleSet = _.omitBy(
    {
      key,
      name: cleanText(patch.name || previous?.name, C.NAME_MAX) || key,
      drawingMode: patch.drawingMode,
      images,
      referenceStyle: patch.referenceStyle || previous?.referenceStyle,
      genStyle: patch.genStyle && !_.isEmpty(patch.genStyle) ? patch.genStyle : previous?.genStyle,
      createdAt: previous?.createdAt || Date.now(),
      usedAt: Date.now(),
    },
    _.isUndefined,
  ) as unknown as MotionSceneStyleSet;
  writeMotionJsonAtomic(styleFile(key), next);
  return next;
};
export const listSceneStyles = (): MotionSceneStyleSet[] => {
  const root = subDir(C.STYLES_FOLDER);
  return _.orderBy(
    fs
      .readdirSync(root)
      .map((key) => readSceneStyle(key))
      .filter((style): style is MotionSceneStyleSet => !!style)
      .map((style) => _.omit(style, [C.TEXT.REFERENCE_STYLE]) as MotionSceneStyleSet),
    [(style) => style.usedAt || style.createdAt],
    [MR.MOTION_TEXT_DESC],
  );
};
const mimeOf = (file: string): string => _.findKey(RC.EXTENSIONS, (ext) => file.endsWith(ext)) || C.MIME_JPEG;
export const sceneStyleImagePath = (key: unknown, index = 0): string | null => {
  const style = readSceneStyle(key);
  const file = style?.images?.[index];
  if (!style || !file) return null;
  const full = path.join(styleDir(style.key), path.basename(file));
  return fs.existsSync(full) ? full : null;
};
export const sceneStyleReferences = (key: unknown): MotionStyleReference[] => {
  const style = readSceneStyle(key);
  if (!style) throw new Error(C.ERRORS.NOT_FOUND);
  return style.images.flatMap((file, index) => {
    const full = path.join(styleDir(style.key), path.basename(file));
    if (!fs.existsSync(full)) return [];
    return [{ name: RC.NAME_PREFIX + (index + 1), dataUrl: C.TEXT.DATA_PREFIX + mimeOf(file) + C.TEXT.BASE64_SUFFIX + fs.readFileSync(full).toString(B64) }];
  });
};
export const removeSceneStyle = (key: unknown): void => {
  if (!readSceneStyle(key)) throw new Error(C.ERRORS.NOT_FOUND);
  fs.rmSync(styleDir(key as string), { recursive: true, force: true });
};
export const renameSceneStyle = (key: unknown, name: unknown): MotionSceneStyleSet => {
  const style = readSceneStyle(key);
  const clean = cleanText(name, C.NAME_MAX);
  if (!style) throw new Error(C.ERRORS.NOT_FOUND);
  if (!clean) throw new Error(C.ERRORS.NAME_REQUIRED);
  const next = { ...style, name: clean };
  writeMotionJsonAtomic(styleFile(style.key), next);
  return next;
};
const REUSE_FIELDS = [XRT.REUSE, XRT.VARIANT];
const genderFits = (item: MotionSceneAsset, gender?: string): boolean => !!motionSceneType(item.type)?.animal || !item.gender || !gender || item.gender === gender;
export const assignSceneLibrary = (analysis: MotionStoryAnalysis, styleKey: string, mode: MotionSceneLibraryMode, characterMotion?: boolean): MotionStoryAnalysis => {
  const strip = <T extends object>(entry: T): T => _.omit(entry, REUSE_FIELDS) as T;
  if (mode === MODES.OFF) return { ...analysis, cast: analysis.cast.map(strip), places: analysis.places.map(strip) };
  const characters = listSceneAssets(styleKey, C.KIND_CHARACTER).filter((item) => !characterMotion || item.motion);
  const locations = listSceneAssets(styleKey, C.KIND_LOCATION);
  const usedCharacters = new Map<string, number>();
  const usedLocations = new Map<string, number>();
  const leastUsed = (items: MotionSceneAsset[], used: Map<string, number>, prefer: (item: MotionSceneAsset) => number = () => 0): MotionSceneAsset | undefined => _.orderBy(items, [(item) => used.get(item.id) || 0, prefer, (item) => item.uses || 0, (item) => item.createdAt], [C.TEXT.ASC, C.TEXT.ASC, C.TEXT.ASC, C.TEXT.ASC])[0];
  const cast = analysis.cast.map((member): MotionCastMember => {
    const chosen =
      mode === MODES.AI
        ? characters.find((item) => item.id === member.reuse)
        : member.type && member.type !== MOTION_SCENE_TYPE_OTHER
          ? leastUsed(
              characters.filter((item) => item.type === member.type && genderFits(item, member.gender)),
              usedCharacters,
              assetFit([member.role, member.description, member.look, ...(member.tags || [])]),
            )
          : undefined;
    if (!chosen) return strip(member);
    const variant = usedCharacters.get(chosen.id) || 0;
    usedCharacters.set(chosen.id, variant + 1);
    const look = _.compact([chosen.description, characterVariantLook(member.type || chosen.type, { index: variant, colors: member.colors })]).join(C.TEXT.SENTENCE);
    return { ...member, reuse: chosen.id, variant, look: _.truncate(look, { length: C.LOOK_MAX }) };
  });
  const places = analysis.places.map((place): MotionPlace => {
    const fit = assetFit([place.name, place.description, ...(place.tags || [])]);
    const chosen =
      mode === MODES.AI
        ? locations.find((item) => item.id === place.reuse)
        : place.type && place.type !== MOTION_SCENE_TYPE_OTHER
          ? leastUsed(
              locations.filter((item) => item.type === place.type),
              usedLocations,
              (item) => (item.interior === !!place.interior ? 0 : 20) + (item.time === place.time ? 0 : 10) + fit(item),
            )
          : undefined;
    if (!chosen) return strip(place);
    usedLocations.set(chosen.id, (usedLocations.get(chosen.id) || 0) + 1);
    return { ...place, reuse: chosen.id };
  });
  return { ...analysis, cast, places };
};
export interface MotionBaseLibrary {
  characters: { type: string; name: string; gender: "male" | "female"; role: string; look: string; tags: string[]; design: any }[];
  locations: { type: string; name: string; time: string; interior: boolean; description: string; tags: string[]; location: any }[];
  props: { type: string; key: string; name: string; description: string; tags: string[]; nodes: any[]; size: number[] }[];
}
let baseCache: { stamp: number; data: MotionBaseLibrary } | null = null;
export const readBaseLibrary = (): MotionBaseLibrary => {
  const file = path.join(getMotionEngineDir(), ...C.BASE_FILE);
  const stamp = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0;
  if (baseCache?.stamp === stamp) return baseCache.data;
  const data = readJson<Partial<MotionBaseLibrary>>(file, {});
  baseCache = { stamp, data: { characters: data.characters || [], locations: data.locations || [], props: data.props || [] } };
  return baseCache.data;
};
const packArray = (value: unknown): any[] => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === MR.MOTION_TEXT_OBJECT && typeof entry.name === MR.MOTION_TEXT_STRING) : []);
export const parseLibraryPack = (value: unknown): MotionBaseLibrary => {
  const data: any = value && typeof value === MR.MOTION_TEXT_OBJECT ? value : {};
  const pack: MotionBaseLibrary = {
    characters: packArray(data.characters).filter((entry) => entry.design && typeof entry.design === MR.MOTION_TEXT_OBJECT),
    locations: packArray(data.locations).filter((entry) => entry.location && typeof entry.location === MR.MOTION_TEXT_OBJECT),
    props: packArray(data.props).filter((entry) => Array.isArray(entry.nodes) && entry.nodes.length),
  };
  if (!pack.characters.length && !pack.locations.length && !pack.props.length) throw new Error(C.ERRORS.PACK_EMPTY);
  return pack;
};
export const exportSceneLibrary = (styleKey?: string): MotionBaseLibrary => {
  const items = readIndex()
    .items.filter((item) => !styleKey || item.styleKey === styleKey)
    .map((item) => ({ item, data: isSceneAssetId(item.id) ? readJson<any>(itemFile(item.id), null) : null }));
  const common = (item: MotionSceneAsset) => ({ type: item.type || MOTION_SCENE_TYPE_OTHER, name: item.name, tags: item.tags || [] });
  return {
    characters: items.filter(({ item, data }) => item.kind === C.KIND_CHARACTER && data).map(({ item, data }) => ({ ...common(item), gender: item.gender === MR.MOTION_TEXT_FEMALE ? MR.MOTION_TEXT_FEMALE : MR.MOTION_TEXT_MALE, role: item.role || MR.MOTION_TEXT_EMPTY, look: item.description || MR.MOTION_TEXT_EMPTY, design: data })),
    locations: items.filter(({ item, data }) => item.kind === C.KIND_LOCATION && data).map(({ item, data }) => ({ ...common(item), time: item.time || MR.MOTION_TEXT_EMPTY, interior: !!item.interior, description: item.description || MR.MOTION_TEXT_EMPTY, location: data })),
    props: items.filter(({ item, data }) => item.kind === C.KIND_PROP && Array.isArray(data)).map(({ item, data }) => ({ ...common(item), key: item.id, description: item.description || MR.MOTION_TEXT_EMPTY, nodes: data, size: item.size || [] })),
  };
};
export const baseLibraryCounts = (): { characters: number; locations: number; props: number } => {
  const base = readBaseLibrary();
  return { characters: base.characters.length, locations: base.locations.length, props: base.props.length };
};
