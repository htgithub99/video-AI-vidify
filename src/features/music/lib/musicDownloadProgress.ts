import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MUSIC } from "../constants/runtimeText.js";
import { parseJson } from "../../../lib/jsonStringify.js";
import type { MusicDownloadProgress } from "../../../types/musicDownloadProgress.js";
import { MUSIC_PLANNING as P } from "../../../constants/musicPlanning.js";
export const readMusicDownloadResponse = async (response: Response, onProgress: (progress: MusicDownloadProgress) => void): Promise<any> => {
  if (!response.headers.get(P.STREAM_HEADER)?.includes(P.STREAM_TYPE) || !response.body) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: any;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = parseJson(line);
    if (event.type === RT_SHARED.PROGRESS) onProgress(event.progress);
    else if (event.type === RT_SHARED.RESULT) result = event.result;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split(RT_SHARED.SYMBOL_01BA47);
      pending = lines.pop() || "";
      lines.forEach(consume);
      if (done) break;
    }
    consume(pending);
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error(RT_MUSIC.LUONG_TAI_VA_DANH_GIA_NHAC_BI_NGAT_TRUOC_KHI);
  return result;
};
export const formatMusicDownloadProgress = (progress: MusicDownloadProgress, language: string): string => {
  const vi = language !== RT_SHARED.EN;
  const parts = [progress.room ? `${RT_MUSIC.ROOM}${progress.room}${RT_SHARED.SYMBOL_8A5EDA}${progress.rooms || progress.room}` : "", progress.attempt ? `${vi ? RT_MUSIC.LAN : RT_MUSIC.ATTEMPT}${RT_SHARED.SYMBOL_36A9E7}${progress.attempt}` : ""] as string[];
  if (progress.phase === RT_SHARED.QUEUED) parts.push(vi ? RT_MUSIC.DANG_CHO_LUOT_UPLOAD : RT_MUSIC.WAITING_FOR_AN_UPLOAD_SLOT);
  if (progress.phase === RT_SHARED.SELECTING) parts.push(vi ? RT_MUSIC.DANG_MO_O_CHON_TEP : RT_MUSIC.OPENING_FILE_PICKER);
  if (progress.phase === RT_SHARED.SELECTED) parts.push(vi ? `${RT_SHARED.DA_CHON}${progress.expected}${RT_MUSIC.TEP_DANG_XAC_NHAN_UPLOAD}` : `${RT_MUSIC.SELECTED}${progress.expected}${RT_MUSIC.FILES_VERIFYING_UPLOAD}`);
  else if (progress.selected !== undefined) parts.push(`${vi ? RT_MUSIC.DA_NHAN : RT_MUSIC.RECEIVED}${RT_SHARED.SYMBOL_36A9E7}${progress.selected}${RT_SHARED.SYMBOL_8A5EDA}${progress.expected}`);
  if (progress.ready !== undefined) parts.push(`${vi ? RT_MUSIC.SAN_SANG : RT_MUSIC.READY}${RT_SHARED.SYMBOL_36A9E7}${progress.ready}${RT_SHARED.SYMBOL_8A5EDA}${progress.expected}`);
  if (progress.processing !== undefined) parts.push(`${vi ? RT_MUSIC.DANG_XU_LY : RT_MUSIC.PROCESSING}${RT_SHARED.SYMBOL_36A9E7}${progress.processing}`);
  if (progress.failed !== undefined) parts.push(`${vi ? RT_MUSIC.LOI : RT_MUSIC.ERRORS}${RT_SHARED.SYMBOL_36A9E7}${progress.failed}`);
  if (progress.namesMatch === false) parts.push(vi ? RT_MUSIC.TEN_TEP_CHUA_KHOP_DAY_DU : RT_MUSIC.FILE_NAMES_NOT_FULLY_MATCHED);
  if (progress.pending) parts.push(`${vi ? RT_MUSIC.REQUEST_DANG_TAI : RT_MUSIC.PENDING_UPLOADS}${RT_SHARED.SYMBOL_36A9E7}${progress.pending}`);
  if (progress.elapsedMs !== undefined) parts.push(`${Math.round(progress.elapsedMs / 1000)}${RT_MUSIC.S}`);
  if (progress.message) parts.push(progress.message);
  return parts.filter(Boolean).join(RT_SHARED.SYMBOL_588DA4).slice(0, 240);
};
