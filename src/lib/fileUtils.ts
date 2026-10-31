import { SOURCE_TEXT_FILE_READ_ERROR, SOURCE_TEXT_SYMBOL_4 } from "../constants/sourceText";
import { createAppError } from "./logger.js";
import _ from "lodash";
import { API_ROUTES } from "../constants/apiRoutes.js";
import { CONTENT_TYPE_HEADER, CONTENT_TYPES, HTTP_METHODS } from "../constants/texts.js";
import { SUNO_AUTOMATION_TEXTS } from "../constants/sunoAutomation.js";
import { jsonUtils } from "./json.js";
export const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(createAppError(SOURCE_TEXT_FILE_READ_ERROR)));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
export const saveBlobWithDialog = async (blob: Blob, suggestedName: string): Promise<boolean> => {
  const dataUrl = await readBlobAsDataUrl(blob);
  const response = await fetch(API_ROUTES.PIPELINE_SAVE_FILE, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ suggestedName, dataUrl }) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || SUNO_AUTOMATION_TEXTS.SAVE_FILE_FAILED_ERR);
  return !result.cancelled;
};
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; _.lt(i, len); i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
export const blobToBase64 = async (blob: Blob): Promise<string> => {
  const dataUrl = await readBlobAsDataUrl(blob);
  return dataUrl.split(SOURCE_TEXT_SYMBOL_4)[1] || dataUrl;
};
