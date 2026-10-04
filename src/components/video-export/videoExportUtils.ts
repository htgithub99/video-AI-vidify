import { VIDEO_EXPORT_TEMPLATE_GB, VIDEO_EXPORT_TEMPLATE_MB, VIDEO_EXPORT_TEXT_0_MB, VIDEO_EXPORT_TEXT_ABORTERROR, VIDEO_EXPORT_TEXT_APPLICATION_JSON, VIDEO_EXPORT_TEXT_ID, VIDEO_EXPORT_TEXT_NAME, VIDEO_EXPORT_TEXT_POST, VIDEO_EXPORT_TEXT_READONLY, VIDEO_EXPORT_TEXT_READWRITE } from "../../constants/videoExportText";
import _ from "lodash";
import { VIDEO_EXPORT_CONSTANTS } from "../../constants/videoExport.js";
import { VIDEO_EXPORT_TEXTS } from "../../constants/texts.js";
import { VideoExportResultItem } from "../../types/videoExport.js";
import type { VideoExportOptionItem, VideoExportOptionSection } from "./VideoExportOptionGrid";
export const getVideoExportOptions = <T extends string | number>(options: VideoExportOptionItem<T>[] = [], sections?: VideoExportOptionSection<T>[]): VideoExportOptionItem<T>[] => (_.isEmpty(sections) ? options : _.flatMap(sections, (section) => section.options));
export type VideoExportTexts = (typeof VIDEO_EXPORT_TEXTS)[keyof typeof VIDEO_EXPORT_TEXTS];
const BYTES_IN_MB = 1024 * 1024;
const BYTES_IN_GB = BYTES_IN_MB * 1024;
const JSON_HEADERS = { "Content-Type": VIDEO_EXPORT_TEXT_APPLICATION_JSON };
export class VideoExportRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export const formatFileSize = (bytes?: number): string => {
  const safeBytes = _.toNumber(bytes) || 0;
  if (safeBytes <= 0) return VIDEO_EXPORT_TEXT_0_MB;
  if (safeBytes >= BYTES_IN_GB) return VIDEO_EXPORT_TEMPLATE_GB(`${(safeBytes / BYTES_IN_GB).toFixed(2)}`);
  return VIDEO_EXPORT_TEMPLATE_MB(`${(safeBytes / BYTES_IN_MB).toFixed(1)}`);
};
export const requestJson = async <T = any>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, body === undefined ? { signal } : { method: VIDEO_EXPORT_TEXT_POST, headers: JSON_HEADERS, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) throw new VideoExportRequestError(_.toString(data?.error) || response.statusText, response.status);
  return data as T;
};
export const isAbortRequest = (error: unknown): boolean => _.get(error, VIDEO_EXPORT_TEXT_NAME) === VIDEO_EXPORT_TEXT_ABORTERROR;
const openResultsDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_EXPORT_CONSTANTS.DB_NAME, VIDEO_EXPORT_CONSTANTS.DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS)) {
        request.result.createObjectStore(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS, { keyPath: VIDEO_EXPORT_TEXT_ID });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export const loadStoredResults = async (): Promise<VideoExportResultItem[]> => {
  try {
    const db = await openResultsDatabase();
    return await new Promise((resolve) => {
      const request = db.transaction(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS, VIDEO_EXPORT_TEXT_READONLY).objectStore(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS).get(VIDEO_EXPORT_CONSTANTS.DB_KEY_RESULTS);
      request.onsuccess = () => resolve(_.isArray(request.result?.items) ? request.result.items : []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};
export const saveStoredResults = async (items: VideoExportResultItem[]): Promise<void> => {
  try {
    const db = await openResultsDatabase();
    db.transaction(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS, VIDEO_EXPORT_TEXT_READWRITE)
      .objectStore(VIDEO_EXPORT_CONSTANTS.DB_STORE_RESULTS)
      .put({ id: VIDEO_EXPORT_CONSTANTS.DB_KEY_RESULTS, items: _.take(items, VIDEO_EXPORT_CONSTANTS.MAX_STORED_RESULTS) });
  } catch {}
};
