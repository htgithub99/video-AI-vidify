import { SOURCE_TEXT_DATA, SOURCE_TEXT_ERROR, SOURCE_TEXT_EXIT, SOURCE_TEXT_FRAMES_V, SOURCE_TEXT_I, SOURCE_TEXT_IGNORE, SOURCE_TEXT_SYMBOL_21, SOURCE_TEXT_VF, SOURCE_TEXT_Y } from "../../constants/sourceText";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import _ from "lodash";
import { BASE64_VIDEO_MIME_REGEX, FFMPEG_RENDER_CONSTANTS, REFACTOR_CONSTANTS, VISUAL_QA_MEDIA_CONFIG } from "../../constants/index.js";
import { getStaticResourcePath, getTempDirectory } from "../utils/paths.js";
import { EncodedImageAsset, readEncodedProjectImage, resolveLocalProjectAssetPath } from "./imageAssetService.js";
const runFrameExtraction = (inputPath: string, outputPattern: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const bundledFfmpeg = getStaticResourcePath(FFMPEG_RENDER_CONSTANTS.FFMPEG_BINARY_NAME);
    const executable = fs.existsSync(bundledFfmpeg) ? bundledFfmpeg : VISUAL_QA_MEDIA_CONFIG.FFMPEG_FALLBACK_COMMAND;
    const process = spawn(executable, [SOURCE_TEXT_Y, SOURCE_TEXT_I, inputPath, SOURCE_TEXT_VF, VISUAL_QA_MEDIA_CONFIG.FRAME_FILTER, SOURCE_TEXT_FRAMES_V, _.toString(VISUAL_QA_MEDIA_CONFIG.MAX_FRAMES), outputPattern], { windowsHide: true, stdio: SOURCE_TEXT_IGNORE });
    process.once(SOURCE_TEXT_ERROR, reject);
    process.once(SOURCE_TEXT_EXIT, (code) => (_.isEqual(code, 0) ? resolve() : reject(new Error(VISUAL_QA_MEDIA_CONFIG.EXTRACTION_FAILED))));
  });
const extractVideoFrames = async (assetUrl: string): Promise<EncodedImageAsset[]> => {
  const tempDir = path.join(getTempDirectory(), `${VISUAL_QA_MEDIA_CONFIG.TEMP_DIR_PREFIX}${randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const dataUrlMatch = assetUrl.match(BASE64_VIDEO_MIME_REGEX);
    const inputPath = dataUrlMatch ? path.join(tempDir, VISUAL_QA_MEDIA_CONFIG.INPUT_FILE_NAME) : resolveLocalProjectAssetPath(assetUrl);
    if (!inputPath) return [];
    if (dataUrlMatch) fs.writeFileSync(inputPath, Buffer.from(dataUrlMatch[2], REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding));
    const outputPattern = path.join(tempDir, VISUAL_QA_MEDIA_CONFIG.FRAME_FILE_PATTERN);
    await runFrameExtraction(inputPath, outputPattern);
    return _.map(_.take(_.sortBy(_.filter(fs.readdirSync(tempDir), (file) => _.endsWith(file, VISUAL_QA_MEDIA_CONFIG.FRAME_EXTENSION))), VISUAL_QA_MEDIA_CONFIG.MAX_FRAMES), (file) => ({ mimeType: VISUAL_QA_MEDIA_CONFIG.FRAME_MIME_TYPE, data: fs.readFileSync(path.join(tempDir, file)).toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding) }));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};
export const readVisualQaAssets = async (assetUrl: string): Promise<EncodedImageAsset[]> => {
  const dataUrlVideo = Boolean(assetUrl.match(BASE64_VIDEO_MIME_REGEX));
  const localAssetPath = _.startsWith(assetUrl, SOURCE_TEXT_DATA) ? undefined : resolveLocalProjectAssetPath(assetUrl);
  const isVideo = dataUrlVideo || VISUAL_QA_MEDIA_CONFIG.VIDEO_EXTENSION_PATTERN.test(_.first(_.split(localAssetPath || assetUrl, SOURCE_TEXT_SYMBOL_21)) || assetUrl);
  if (isVideo) return extractVideoFrames(assetUrl);
  return _.compact([readEncodedProjectImage(assetUrl)]);
};
