import { RUNTIME_TEXT as RT_MUSIC } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { parseJson } from "../../../lib/jsonStringify.js";
import type { SunoCreationProgress } from "../../../types/sunoCreationProgress.js";
import { MUSIC_PLANNING as P } from "../../../constants/musicPlanning.js";
const interrupted = RT_MUSIC.MAT_KET_NOI_KHI_TAO_NHAC_SUNO_TIEN_DO_DA;
export const readSunoCreationResponse = async (response: Response, onProgress: (progress: SunoCreationProgress) => void): Promise<any> => {
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
  } catch (error: any) {
    if (error?.name === RT_MUSIC.ABORTERROR) throw error;
    throw new Error(interrupted, { cause: error });
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error(interrupted);
  return result;
};
export const formatSunoCreationProgress = (p: SunoCreationProgress, language: string): string => {
  const vi = language !== RT_SHARED.EN;
  const counts = vi
    ? `${RT_MUSIC.DA_LUU}${p.acceptedSongs}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}${RT_MUSIC.BAI}${p.createdSongIds.length}${RT_MUSIC.BAN_HOAN_TAT_AM_THANH}${p.completedSongs}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}`
    : `${RT_MUSIC.SAVED}${p.acceptedSongs}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}${RT_MUSIC.SONGS}${p.createdSongIds.length}${RT_MUSIC.TRACKS_AUDIO_COMPLETE}${p.completedSongs}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}`;
  const labels = vi
    ? { recovered: RT_MUSIC.DOC_TIEN_DO_DA_LUU, submitting: `${RT_MUSIC.DANG_XU_LY_BAI}${p.songIndex}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}`, saved: `${RT_MUSIC.DA_LUU_ID_BAI}${p.songIndex}`, waiting: RT_MUSIC.DOI_SUNO_HOAN_TAT_AM_THANH, playlist: RT_MUSIC.DANG_THEM_VA_XAC_MINH_PLAYLIST, completed: RT_MUSIC.DA_LUU_PLAYLIST_HOAN_CHINH }
    : { recovered: RT_MUSIC.LOADED_SAVED_PROGRESS, submitting: `${RT_MUSIC.PROCESSING_SONG}${p.songIndex}${RT_SHARED.SYMBOL_8A5EDA}${p.songCount}`, saved: `${RT_MUSIC.SAVED_IDS_FOR_SONG}${p.songIndex}`, waiting: RT_MUSIC.WAITING_FOR_AUDIO_COMPLETION, playlist: RT_MUSIC.ADDING_AND_VERIFYING_PLAYLIST, completed: RT_MUSIC.SAVED_COMPLETED_PLAYLIST };
  const selection = p.selectedTracks === undefined ? "" : vi ? `${RT_MUSIC.DA_CHON}${p.selectedTracks}${RT_MUSIC.BAN_DE_THEM_CUNG_LUOT}` : `${RT_MUSIC.SELECTED_E53B9D}${p.selectedTracks}${RT_MUSIC.TRACKS_FOR_ONE_ADD}`;
  return `${labels[p.phase]}${selection}${RT_SHARED.SYMBOL_588DA4}${counts}`;
};
