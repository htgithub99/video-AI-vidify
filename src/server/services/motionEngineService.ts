import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import vm from "vm";
import { MOTION_GEN_CONFIG } from "../../constants/motionGenPrompts.js";
import {
  MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64,
  MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8_2,
  MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT,
  MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED_2,
  MOTION_TEMPLATE_JSON,
  MOTION_TEMPLATE_MISSING,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_16,
  MOTION_TEMPLATE_SYMBOL_19,
  MOTION_TEXT_400_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_500_24PX_OSWALD,
  MOTION_TEXT_600_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_700_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_700_24PX_OSWALD,
  MOTION_TEXT_700_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_800_24PX_BE_VIETNAM_PRO,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_DEMO,
  MOTION_TEXT_ITALIC_600_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_ITALIC_700_24PX_PLAYFAIR_DISPLAY,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_28,
  MOTION_TEXT_SYMBOL_29,
  MOTION_TEXT_U003C,
  MOTION_TEXT_UTF8,
} from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { cloneJson, parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import type { MotionSpec } from "../../types/motionVideo.js";
import { getStaticResourcePath } from "../utils/paths.js";
import { libraryEngineMap, resolveLibraryAsset } from "./motionAssetLibraryService.js";
interface FontEntry { family: string; weight: number; style: string; file: string; unicodeRange: string; }
interface EngineCache { signature: string; script: string; fontCss: string; fontFaces: { family: string; weight: number; style: string; src: string; unicodeRange: string; }[]; engine: any; }
export interface MotionValidation<T> { value: T; errors: string[]; warnings?: string[]; stats?: Record<string, number>; }
let cache: EngineCache | null = null;
export const getMotionEngineDir = (): string => { const resource = getStaticResourcePath(MOTION_VIDEO_CONSTANTS.ENGINE_DIR); if (fs.existsSync(resource)) return resource; return path.join(process.cwd(), MOTION_VIDEO_CONSTANTS.ENGINE_DIR); };
const engineSignature = (dir: string): string =>
  _.map(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (file) => {
    try {
      const st = fs.statSync(path.join(dir, file));
      return MOTION_TEMPLATE_SYMBOL_11(MR.MOTION_TEMPLATE_SYMBOL_118(file), MOTION_TEMPLATE_SYMBOL_11(MR.MOTION_TEMPLATE_SYMBOL_119(st.mtimeMs), MR.MOTION_TEMPLATE_SYMBOL_120(st.size)));
    } catch {
      return MOTION_TEMPLATE_MISSING(MR.MOTION_TEMPLATE_SYMBOL_121(file));
    }
  }).join(MOTION_TEXT_SYMBOL_28);
const readFonts = (dir: string): EngineCache["fontFaces"] => {
  const fontsDir = path.join(dir, MOTION_VIDEO_CONSTANTS.FONTS_DIR);
  const manifestPath = path.join(fontsDir, MOTION_VIDEO_CONSTANTS.FONTS_MANIFEST);
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = parseJson(fs.readFileSync(manifestPath, MOTION_TEXT_UTF8)) as FontEntry[];
  return _.compact( _.map(manifest, (font) => { const filePath = path.join(fontsDir, path.basename(font.file)); if (!fs.existsSync(filePath)) return null; return { family: font.family, weight: font.weight, style: font.style, unicodeRange: font.unicodeRange, src: MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64(MR.MOTION_TEMPLATE_SYMBOL_122(fs.readFileSync(filePath).toString(MOTION_TEXT_BASE64))) }; }), );
};
const sandboxEngine = (script: string): any => { const sandbox: Record<string, unknown> = { console: { warn: _.noop, log: _.noop } }; sandbox.globalThis = sandbox; vm.createContext(sandbox); vm.runInContext(script, sandbox, { timeout: 8000 }); return sandbox.MotionEngine; };
export const loadMotionEngine = (): EngineCache => {
  const dir = getMotionEngineDir();
  const signature = engineSignature(dir);
  if (cache && cache.signature === signature) return cache;
  const script = _.map(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (file) => fs.readFileSync(path.join(dir, file), MOTION_TEXT_UTF8)).join(MOTION_TEXT_SYMBOL_29);
  const fontFaces = readFonts(dir);
  const fontCss = _.map(fontFaces, (f) => MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT(MR.MOTION_TEMPLATE_SYMBOL_123(f.family), MR.MOTION_TEMPLATE_SYMBOL_124(f.style), MR.MOTION_TEMPLATE_SYMBOL_125(f.weight), MR.MOTION_TEMPLATE_SYMBOL_126(f.src), MR.MOTION_TEMPLATE_SYMBOL_127(f.unicodeRange))).join(MOTION_TEXT_SYMBOL_27);
  const serverScript = _.map( _.filter(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (f) => !_.includes(MOTION_VIDEO_CONSTANTS.CLIENT_ONLY_FILES as readonly string[], f)), (file) => fs.readFileSync(path.join(dir, file), MOTION_TEXT_UTF8), ).join(MOTION_TEXT_SYMBOL_29);
  const built = { signature, script, fontCss, fontFaces, engine: sandboxEngine(serverScript) };
  cache = engineSignature(dir) === signature ? built : null;
  return built;
};
const GEN = () => { const gen = loadMotionEngine().engine?.GEN; const map = libraryEngineMap(); if (gen && gen.library !== map) gen.setLibrary(map); return gen; };
export const validateGenLocation = (raw: unknown): MotionValidation<any> => cloneJson(GEN().validateLocation(cloneJson(raw ?? {})));
export const validateGenOutfit = (raw: unknown): MotionValidation<any> => cloneJson(GEN().validateOutfit(cloneJson(raw ?? {}), {}));
export const validateGenStaging = ( raw: unknown, ctx: { locations: Record<string, unknown>; cast: string[]; }, ): MotionValidation<any> => cloneJson(GEN().validateStaging(cloneJson(raw ?? {}), cloneJson(ctx)));
export const genActionIds = (): string[] => cloneJson(GEN().ACTION_IDS || []);
export const getMotionEngineClientScript = (): string => {
  const engine = loadMotionEngine();
  const fontLoader = MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED_2(MR.MOTION_TEMPLATE_SYMBOL_128(stringifyJson(_.map(engine.fontFaces, (f) => ({ family: f.family, weight: String(f.weight), style: f.style, src: f.src, unicodeRange: f.unicodeRange })))));
  return MOTION_TEMPLATE_SYMBOL_16(MR.MOTION_TEMPLATE_SYMBOL_129(engine.script), MR.MOTION_TEMPLATE_SYMBOL_130(fontLoader));
};
const FONT_PROBES = [MOTION_TEXT_400_24PX_BE_VIETNAM_PRO, MOTION_TEXT_600_24PX_BE_VIETNAM_PRO, MOTION_TEXT_700_24PX_BE_VIETNAM_PRO, MOTION_TEXT_800_24PX_BE_VIETNAM_PRO, MOTION_TEXT_500_24PX_OSWALD, MOTION_TEXT_700_24PX_OSWALD, MOTION_TEXT_700_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_600_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_700_24PX_PLAYFAIR_DISPLAY];
export const MOTION_ASSET_BASE = MOTION_TEMPLATE_SYMBOL_19(MR.MOTION_TEMPLATE_SYMBOL_131(MOTION_GEN_CONFIG.ASSET_ORIGIN));
export const buildMotionRenderHtml = (spec: MotionSpec): string => {
  const engine = loadMotionEngine();
  const safeJson = (value: unknown) => stringifyJson(value).replace(/</g, MOTION_TEXT_U003C);
  return MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8_2(MR.MOTION_TEMPLATE_SYMBOL_132(engine.fontCss), MR.MOTION_TEMPLATE_SYMBOL_133(engine.script), MR.MOTION_TEMPLATE_SYMBOL_134(safeJson(spec)), MR.MOTION_TEMPLATE_SYMBOL_135(stringifyJson(FONT_PROBES)), MR.MOTION_TEMPLATE_SYMBOL_136(safeJson(MOTION_ASSET_BASE)));
};
export const resolveMotionAsset = (rel: string): string | null => {
  const lib = resolveLibraryAsset(rel);
  if (lib) return lib;
  const clean = path.normalize(_.toString(rel).replace(/^\/+/, "")).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!clean.startsWith(MOTION_GEN_CONFIG.MANNEQUIN_DIR)) return null;
  const file = path.join(getMotionEngineDir(), clean);
  if (!file.startsWith(path.join(getMotionEngineDir(), MOTION_GEN_CONFIG.MANNEQUIN_DIR))) return null;
  return fs.existsSync(file) ? file : null;
};
export const getMotionDemoSpec = (name: string): MotionSpec | null => { const file = path.join(getMotionEngineDir(), MOTION_VIDEO_CONSTANTS.DEMO_DIR, MOTION_TEMPLATE_JSON(MR.MOTION_TEMPLATE_SYMBOL_137(path.basename(name || MOTION_TEXT_DEMO)))); if (!fs.existsSync(file)) return null; return parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as MotionSpec; };
