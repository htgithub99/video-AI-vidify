import { MOTION_STYLE_FONT_PROBES } from "../../../../constants/motionStyleFinish.js";
import { MOTION_PATTERNS as MP } from "../../../../constants/motionPatterns.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import {
  MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64,
  MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8_2,
  MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT,
  MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED_2,
  MOTION_TEMPLATE_JSON,
  MOTION_TEMPLATE_MISSING,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_16,
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
} from "../../../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../../../constants/motionVideo.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { motionCameraBrowserSource, MOTION_CAMERA_REVISION } from "../../../../lib/motionCamera.js";
import { MOTION_CAMERA } from "../../../../constants/motionCamera.js";
import type { MotionSpec } from "../../../../types/motionVideo.js";
import { getStaticResourcePath } from "../../../../server/utils/paths.js";
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
}
export interface MotionValidation<T> {
  value: T;
  errors: string[];
  warnings?: string[];
  stats?: Record<string, number>;
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
      const st = fs.statSync(path.join(dir, file));
      return MOTION_TEMPLATE_SYMBOL_11(String(file), MOTION_TEMPLATE_SYMBOL_11(String(st.mtimeMs), String(st.size)));
    } catch {
      return MOTION_TEMPLATE_MISSING(String(file));
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
      return { family: font.family, weight: font.weight, style: font.style, unicodeRange: font.unicodeRange, src: MOTION_TEMPLATE_DATA_FONT_WOFF2_BASE64(String(fs.readFileSync(filePath).toString(MOTION_TEXT_BASE64))) };
    }),
  );
};
export const loadMotionEngine = (): EngineCache => {
  const dir = getMotionEngineDir();
  const signature = MOTION_CAMERA.SIGNATURE(engineSignature(dir), MOTION_CAMERA_REVISION);
  if (cache && cache.signature === signature) return cache;
  const script = _.map(MOTION_VIDEO_CONSTANTS.ENGINE_FILES, (file) => fs.readFileSync(path.join(dir, file), MOTION_TEXT_UTF8)).join(MOTION_TEXT_SYMBOL_29) + MOTION_CAMERA.ENGINE_SCRIPT(motionCameraBrowserSource());
  const fontFaces = readFonts(dir);
  const fontCss = _.map(fontFaces, (f) => MOTION_TEMPLATE_FONT_FACE_FONT_FAMILY_FONT_STYLE_FONT_WEIGHT(String(f.family), String(f.style), String(f.weight), String(f.src), String(f.unicodeRange))).join(MOTION_TEXT_SYMBOL_27);
  const built = { signature, script, fontCss, fontFaces };
  cache = MOTION_CAMERA.SIGNATURE(engineSignature(dir), MOTION_CAMERA_REVISION) === signature ? built : null;
  return built;
};
export const getMotionEngineClientScript = (): string => {
  const engine = loadMotionEngine();
  const fontLoader = MOTION_TEMPLATE_FUNCTION_IF_TYPEOF_FONTFACE_UNDEFINED_TYPEOF_DOCUMENT_UNDEFINED_2(String(stringifyJson(_.map(engine.fontFaces, (f) => ({ family: f.family, weight: String(f.weight), style: f.style, src: f.src, unicodeRange: f.unicodeRange })))));
  return MOTION_TEMPLATE_SYMBOL_16(String(engine.script), String(fontLoader));
};
const FONT_PROBES = [MOTION_TEXT_400_24PX_BE_VIETNAM_PRO, MOTION_TEXT_600_24PX_BE_VIETNAM_PRO, MOTION_TEXT_700_24PX_BE_VIETNAM_PRO, MOTION_TEXT_800_24PX_BE_VIETNAM_PRO, MOTION_TEXT_500_24PX_OSWALD, MOTION_TEXT_700_24PX_OSWALD, MOTION_TEXT_700_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_600_24PX_PLAYFAIR_DISPLAY, MOTION_TEXT_ITALIC_700_24PX_PLAYFAIR_DISPLAY];
export const buildMotionRenderHtml = (spec: MotionSpec): string => {
  const engine = loadMotionEngine();
  const safeJson = (value: unknown) => stringifyJson(value).replace(MP.HTML_TAG_OPEN, MOTION_TEXT_U003C);
  return MOTION_TEMPLATE_DOCTYPE_HTML_HTML_HEAD_META_CHARSET_UTF_8_2(String(engine.fontCss), String(engine.script), String(safeJson(spec)), String(stringifyJson([...FONT_PROBES, ...MOTION_STYLE_FONT_PROBES])));
};
export const getMotionDemoSpec = (name: string): MotionSpec | null => {
  const file = path.join(getMotionEngineDir(), MOTION_VIDEO_CONSTANTS.DEMO_DIR, MOTION_TEMPLATE_JSON(String(path.basename(name || MOTION_TEXT_DEMO))));
  if (!fs.existsSync(file)) return null;
  return parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8)) as MotionSpec;
};
