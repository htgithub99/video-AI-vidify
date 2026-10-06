import {
  MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64,
  MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8,
  MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT,
  MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED,
  MOTION_TEMPLATE_JSON,
  MOTION_TEMPLATE_MISSING,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_16,
  MOTION_TEMPLATE_SYMBOL_42,
  MOTION_TEXT_400_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_500_24PX_OSWALD,
  MOTION_TEXT_600_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_700_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_700_24PX_OSWALD,
  MOTION_TEXT_700_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_800_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_ID,
  MOTION_TEXT_ITALIC_600_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_ITALIC_700_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_SPAGGIARI,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_28,
  MOTION_TEXT_SYMBOL_29,
  MOTION_TEXT_U003C,
  MOTION_TEXT_UTF8,
} from "../../constants/motionRuntime.js";
import { parseJson, cloneJson, stringifyJson } from "../../lib/jsonStringify.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import vm from "vm";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import type { MotionCatalog, MotionCharacterDef, MotionSpec } from "../../types/motionVideo.js";
import { getStaticResourcePath } from "../utils/paths.js";
import { designsScript, designsSignature } from "./motionDesignStore.js";
interface FontEntry {
  family: string;
  weight: number;
  style: string;
  file: string;
  unicodeRange: string;
}
interface EngineCache {
  signature: string;
  script: string;
  fontCss: string;
  fontFaces: { family: string; weight: number; style: string; src: string; unicodeRange: string }[];
  catalog: MotionCatalog;
  registryInfo: MotionRegistryInfo;
  engine: any;
}
export interface MotionAfford {
  seat?: { dx: number; h: number }[];
  faces?: "left" | "right";
  role?: string;
  work?: { mode: "behind" | "beside"; seated?: boolean; dx?: number };
  bed?: { dx: number; h: number };
  door?: { dx: number; param: string };
  cover?: { h: number };
  climb?: { x0: number; y0: number; x1: number; top?: number; param?: string; vertical?: boolean };
  slide?: { x0: number; x1: number; y1: number; param?: string };
  surface?: { h: number; w: number };
  entry?: { dx: number; y: number; param: string }[];
  window?: { dx: number; y: number; param: string }[];
}
export interface MotionActionNeed {
  seat?: boolean | string[];
  work?: string[];
  optional?: boolean;
  bed?: boolean;
  door?: boolean;
  cover?: boolean;
  climb?: boolean;
  slide?: boolean;
  tools?: string[];
  spawn?: { asset: string; dx: number; scale?: number; near?: number; cue?: string; params?: Record<string, unknown> };
}
export interface MotionEnvProp {
  asset: string;
  x: number;
  lane: string;
  y?: number;
  scale?: number;
  facing?: string;
}
export interface MotionInteractInfo {
  needs: Record<string, MotionActionNeed>;
  seatedVariant: Record<string, string>;
  prefer: Record<string, string>;
  roles: Record<string, string[]>;
  tabletop: string[];
  roleWords: Record<string, { re: string; flags: string; who: string }>;
}
export interface MotionRegistryInfo {
  envs: Record<string, { width: number; time?: string; category?: string; builtins?: string[]; lanes?: string[]; frame?: { zoom?: number; x?: number }; staging?: Record<string, any>; props?: MotionEnvProp[] }>;
  assets: Record<string, { category?: string; size?: number[]; realSize?: number; holdable?: boolean; heldKind?: string | null; afford?: MotionAfford | null; place?: string; mountY?: number }>;
  interact: MotionInteractInfo;
}
let cache: EngineCache | null = null;
export const getMotionEngineDir = (): string => {
  const resource = getStaticResourcePath(MOTION_VIDEO_CONSTANTS.ENGINE_DIR);
  if (fs.existsSync(resource)) return resource;
  return path.join(process.cwd(), MOTION_VIDEO_CONSTANTS.ENGINE_DIR);
};
const engineSignature = (dir: string): string =>
  _.map(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (file) => {
    try {
      return MOTION_TEMPLATE_SYMBOL_11(`${file}`, `${fs.statSync(path.join(dir, file)).mtimeMs}`);
    } catch {
      return MOTION_TEMPLATE_MISSING(`${file}`);
    }
  }).join(MOTION_TEXT_SYMBOL_28);
const readFonts = (dir: string): EngineCache["fontFaces"] => {
  const fontsDir = path.join(dir, MOTION_VIDEO_CONSTANTS.FONTS_DIR);
  const manifestPath = path.join(fontsDir, MOTION_VIDEO_CONSTANTS.FONTS_MANIFEST);
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = parseJson(fs.readFileSync(manifestPath, MOTION_TEXT_UTF8)) as FontEntry[];
  return _.compact(
    _.map(manifest, (font) => {
      const filePath = path.join(fontsDir, path.basename(font.file));
      if (!fs.existsSync(filePath)) return null;
      return { family: font.family, weight: font.weight, style: font.style, unicodeRange: font.unicodeRange, src: MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64(`${fs.readFileSync(filePath).toString(MOTION_TEXT_BASE64)}`) };
    }),
  );
};
const buildCatalog = (script: string): { catalog: MotionCatalog; registryInfo: MotionRegistryInfo; engine: any } => {
  const sandbox: Record<string, unknown> = { console: { warn: _.noop, log: _.noop } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { timeout: 5000 });
  const engine = sandbox.MotionEngine as {
    catalog: () => MotionCatalog;
    registry: { environments: Record<string, any>; assets: Record<string, any>; characters?: Record<string, any> };
    affordOf?: (id: string) => MotionAfford | null;
    rolesOf?: (def: unknown) => string[];
    envProps?: (id: string) => MotionEnvProp[];
    INTERACT?: { ACTION_NEEDS?: Record<string, MotionActionNeed>; SEATED_VARIANT?: Record<string, string>; DEFAULT_PREFER?: Record<string, string>; TABLETOP?: string[]; ROLE_WORDS?: Record<string, { re: RegExp; who: string }> };
    envBuiltins?: (id: string) => string[];
    REAL_SIZE?: Record<string, number>;
    HOLDABLE?: Record<string, string | null>;
  };
  const builtins = (id: string): string[] => {
    try {
      return _.uniq(_.map(engine.envBuiltins ? engine.envBuiltins(id) : [], _.toString));
    } catch {
      return [];
    }
  };
  const registryInfo: MotionRegistryInfo = {
    envs: _.mapValues(engine.registry.environments, (e, id) => ({
      width: _.toNumber(e.width) || 3200,
      time: e.time,
      category: e.category,
      builtins: builtins(id),
      lanes: _.isArray(e.lanes) ? _.map(e.lanes, _.toString) : undefined,
      frame: _.isPlainObject(e.frame) ? { zoom: _.toNumber(e.frame.zoom) || undefined, x: _.toNumber(e.frame.x) || undefined } : undefined,
      staging: _.isPlainObject(e.staging) ? cloneJson(e.staging) : undefined,
      props: engine.envProps ? cloneJson(engine.envProps(id)) : undefined,
    })),
    assets: _.mapValues(engine.registry.assets, (a, id) => ({
      category: a.category,
      size: _.isArray(a.size) ? _.map(a.size, _.toNumber) : undefined,
      realSize: engine.REAL_SIZE?.[id],
      holdable: !!engine.HOLDABLE && _.has(engine.HOLDABLE, id),
      heldKind: engine.HOLDABLE?.[id] ?? null,
      afford: engine.affordOf ? cloneJson(engine.affordOf(id)) : null,
      place: a.place,
      mountY: a.mountY,
    })),
    interact: {
      needs: cloneJson(engine.INTERACT?.ACTION_NEEDS || {}),
      seatedVariant: cloneJson(engine.INTERACT?.SEATED_VARIANT || {}),
      prefer: cloneJson(engine.INTERACT?.DEFAULT_PREFER || {}),
      roles: _.mapValues(engine.registry.characters || {}, (c) => (engine.rolesOf ? engine.rolesOf(c) : [])),
      tabletop: cloneJson(engine.INTERACT?.TABLETOP || []),
      roleWords: _.mapValues(engine.INTERACT?.ROLE_WORDS || {}, (w) => ({ re: w.re.source, flags: w.re.flags, who: w.who })),
    },
  };
  return { catalog: cloneJson(engine.catalog()), registryInfo: cloneJson(registryInfo), engine };
};
export const loadMotionEngine = (): EngineCache => {
  const dir = getMotionEngineDir();
  const signature = MOTION_TEMPLATE_SYMBOL_42(`${engineSignature(dir)}`, `${designsSignature()}`);
  if (cache && cache.signature === signature) return cache;
  const script = _.map(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (file) => fs.readFileSync(path.join(dir, file), MOTION_TEXT_UTF8)).join(MOTION_TEXT_SYMBOL_29) + designsScript();
  const fontFaces = readFonts(dir);
  const fontCss = _.map(fontFaces, (f) => MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT(`${f.family}`, `${f.style}`, `${f.weight}`, `${f.src}`, `${f.unicodeRange}`)).join(MOTION_TEXT_SYMBOL_27);
  cache = { signature, script, fontCss, fontFaces, ...buildCatalog(script) };
  return cache;
};
export const getMotionEngineClientScript = (): string => {
  const engine = loadMotionEngine();
  const fontLoader = MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED(`${stringifyJson(_.map(engine.fontFaces, (f) => ({ family: f.family, weight: String(f.weight), style: f.style, src: f.src, unicodeRange: f.unicodeRange })))}`);
  return MOTION_TEMPLATE_SYMBOL_16(`${engine.script}`, `${fontLoader}`);
};
const FONT_PROBES = [MOTION_TEXT_400_24PX_BE_VIETNAM_PRO, MOTION_TEXT_600_24PX_BE_VIETNAM_PRO, MOTION_TEXT_700_24PX_BE_VIETNAM_PRO, MOTION_TEXT_800_24PX_BE_VIETNAM_PRO, MOTION_TEXT_500_24PX_OSWALD, MOTION_TEXT_700_24PX_OSWALD, MOTION_TEXT_700_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_600_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_700_24PX_PLAYFAIR_DISPLAY];
export const buildMotionRenderHtml = (spec: MotionSpec, customCharacters: MotionCharacterDef[], real?: { manifest: unknown; base: string; prepare?: boolean } | null): string => {
  const engine = loadMotionEngine();
  const safeJson = (value: unknown) => stringifyJson(value).replace(/</g, MOTION_TEXT_U003C);
  return MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8(`${engine.fontCss}`, `${engine.script}`, `${safeJson(spec)}`, `${safeJson(customCharacters)}`, `${safeJson(real || null)}`, `${stringifyJson(FONT_PROBES)}`);
};
export const getRealRequirements = (spec: MotionSpec, manifest: unknown): { type: "hdris" | "textures" | "models"; id: string }[] => {
  const engine = loadMotionEngine().engine;
  const R = engine?.REAL;
  if (!R?.requirements) return [];
  R.setManifest(cloneJson(manifest || { items: [], envs: {} }), "");
  return cloneJson(R.requirements(cloneJson(spec)));
};
export const getRealDefaults = (): { hdris: string[]; textures: string[]; models: string[] } => {
  const R = loadMotionEngine().engine?.REAL;
  if (!R) return { hdris: [], textures: [], models: [] };
  const hdris = _.uniq(_.flatMap(_.values(R.SKY), (s: Record<string, string>) => _.values(s)));
  const textures = _.uniq(_.map(_.values(R.TEX), MOTION_TEXT_ID));
  const models = _.keys(R.MODELS);
  return { hdris, textures, models };
};
export const getMotionDemoSpec = (name: string): MotionSpec | null => {
  const file = path.join(getMotionEngineDir(), MOTION_VIDEO_CONSTANTS.DEMO_DIR, MOTION_TEMPLATE_JSON(`${path.basename(name || MOTION_TEXT_SPAGGIARI)}`));
  if (!fs.existsSync(file)) return null;
  return parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as MotionSpec;
};
