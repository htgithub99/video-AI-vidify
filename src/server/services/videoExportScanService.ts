import { VIDEO_EXPORT_TEMPLATE_A_3, VIDEO_EXPORT_TEMPLATE_I, VIDEO_EXPORT_TEMPLATE_SYMBOL_11, VIDEO_EXPORT_TEXT_BASE } from "../../constants/videoExportText";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { randomUUID } from "crypto";
import _ from "lodash";
import { probeMediaDurationSeconds } from "./videoExportFfmpegService.js";
import { getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
import { logger } from "../../lib/logger.js";
import { VIDEO_EXPORT_CONSTANTS, VIDEO_EXPORT_LOG_MESSAGES, VIDEO_EXPORT_REGEX, VIDEO_EXPORT_SERVER_TEXTS } from "../../constants/videoExport.js";
import { VideoExportAudioItem, VideoExportImageItem, VideoExportMediaKind, VideoExportSource } from "../../types/videoExport.js";
type SourceEntry = {
  folderPath: string;
  audios: VideoExportAudioItem[];
  images: VideoExportImageItem[];
};
const sourceEntries = new Map<string, SourceEntry>();
const naturalCompare = (left: string, right: string): number => left.localeCompare(right, undefined, { numeric: true, sensitivity: VIDEO_EXPORT_TEXT_BASE });
const collectMediaFiles = async (directory: string, audioFiles: string[], imageFiles: string[]): Promise<void> => {
  try {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await collectMediaFiles(fullPath, audioFiles, imageFiles);
      else if (entry.isFile() && VIDEO_EXPORT_REGEX.AUDIO_EXT.test(entry.name)) audioFiles.push(fullPath);
      else if (entry.isFile() && VIDEO_EXPORT_REGEX.IMAGE_EXT.test(entry.name)) imageFiles.push(fullPath);
    }
  } catch (error: any) {
    logger.error(VIDEO_EXPORT_LOG_MESSAGES.SCAN_ERROR(directory, error?.message || ""));
  }
};
const readFileSize = async (filePath: string): Promise<number> => {
  try {
    return (await fs.promises.stat(filePath)).size;
  } catch {
    return 0;
  }
};
const probeDurationsInBatches = async (files: string[]): Promise<number[]> => {
  const durations: number[] = [];
  for (const batch of _.chunk(files, VIDEO_EXPORT_CONSTANTS.DURATION_PROBE_CONCURRENCY)) {
    durations.push(...(await Promise.all(_.map(batch, (filePath) => probeMediaDurationSeconds(filePath)))));
  }
  return durations;
};
const buildMediaUrl = (token: string, kind: VideoExportMediaKind, index: number): string => VIDEO_EXPORT_TEMPLATE_SYMBOL_11(`${VIDEO_EXPORT_CONSTANTS.MEDIA_URL_PREFIX}`, `${token}`, `${kind}`, `${index}`);
export const pickVideoExportFolder = (): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(getPythonCommand(), [getStaticResourcePath(VIDEO_EXPORT_CONSTANTS.PICKER_SCRIPT)], { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        logger.error(VIDEO_EXPORT_LOG_MESSAGES.PICKER_ERROR(`${error.message} ${stderr || ""}`));
        reject(new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_PICKER_FAILED));
        return;
      }
      const output = _.trim(stdout);
      if (!output) {
        resolve("");
        return;
      }
      try {
        resolve(_.toString(JSON.parse(output)?.folderPath));
      } catch {
        reject(new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_PICKER_FAILED));
      }
    });
  });
export const scanVideoExportFolder = async (folderPath: string): Promise<VideoExportSource> => {
  const stat = await fs.promises.stat(folderPath).catch(() => null);
  if (!stat?.isDirectory()) throw new Error(VIDEO_EXPORT_SERVER_TEXTS.ERR_SOURCE_MISSING);
  const audioFiles: string[] = [];
  const imageFiles: string[] = [];
  await collectMediaFiles(folderPath, audioFiles, imageFiles);
  audioFiles.sort((left, right) => naturalCompare(path.relative(folderPath, left), path.relative(folderPath, right)));
  imageFiles.sort((left, right) => naturalCompare(path.relative(folderPath, left), path.relative(folderPath, right)));
  const token = randomUUID();
  const [durations, audioSizes, imageSizes] = await Promise.all([probeDurationsInBatches(audioFiles), Promise.all(_.map(audioFiles, readFileSize)), Promise.all(_.map(imageFiles, readFileSize))]);
  const audios: VideoExportAudioItem[] = _.map(audioFiles, (filePath, index) => ({
    id: VIDEO_EXPORT_TEMPLATE_A_3(`${token}`, `${index}`),
    index,
    name: path.basename(filePath),
    relativePath: path.relative(folderPath, filePath),
    sourcePath: filePath,
    url: buildMediaUrl(token, VideoExportMediaKind.AUDIO, index),
    sizeBytes: audioSizes[index] ?? 0,
    durationSeconds: durations[index] ?? 0,
  }));
  const images: VideoExportImageItem[] = _.map(imageFiles, (filePath, index) => ({
    id: VIDEO_EXPORT_TEMPLATE_I(`${token}`, `${index}`),
    index,
    name: path.basename(filePath),
    relativePath: path.relative(folderPath, filePath),
    sourcePath: filePath,
    url: buildMediaUrl(token, VideoExportMediaKind.IMAGE, index),
    sizeBytes: imageSizes[index] ?? 0,
  }));
  sourceEntries.set(token, { folderPath, audios, images });
  setTimeout(() => sourceEntries.delete(token), VIDEO_EXPORT_CONSTANTS.SOURCE_TTL_MS).unref();
  return { token, folderName: path.basename(folderPath), folderPath, audios, images };
};
export const getVideoExportSource = (token: string): SourceEntry | undefined => sourceEntries.get(token);
export const resolveVideoExportMediaPath = (token: string, kind: string, index: number): string | null => {
  const entry = sourceEntries.get(token);
  if (!entry || !Number.isInteger(index) || index < 0) return null;
  if (kind === VideoExportMediaKind.AUDIO) return entry.audios[index]?.sourcePath ?? null;
  if (kind === VideoExportMediaKind.IMAGE) return entry.images[index]?.sourcePath ?? null;
  return null;
};
