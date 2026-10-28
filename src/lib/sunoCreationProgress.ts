import type { SunoCreationProgress } from '../types/sunoCreationProgress.js';
import { MUSIC_PLANNING as P } from '../constants/musicPlanning.js';

const interrupted = 'Mất kết nối khi tạo nhạc Suno. Tiến độ đã lưu trên máy chủ; bấm Tạo nhạc lại để kiểm tra và tiếp tục phần còn thiếu.';
export const readSunoCreationResponse = async (response: Response, onProgress: (progress: SunoCreationProgress) => void): Promise<any> => {
  if (!response.headers.get(P.STREAM_HEADER)?.includes(P.STREAM_TYPE) || !response.body) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let result: any;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'progress') onProgress(event.progress);
    else if (event.type === 'result') result = event.result;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      lines.forEach(consume);
      if (done) break;
    }
    consume(pending);
  } catch (error: any) {
    if (error?.name === 'AbortError') throw error;
    throw new Error(interrupted, { cause: error });
  } finally { reader.releaseLock(); }
  if (!result) throw new Error(interrupted);
  return result;
};

export const formatSunoCreationProgress = (p: SunoCreationProgress, language: string): string => {
  const vi = language !== 'en';
  const counts = vi ? `Đã lưu ${p.acceptedSongs}/${p.songCount} bài · ${p.createdSongIds.length} bản · Hoàn tất âm thanh ${p.completedSongs}/${p.songCount}`
    : `Saved ${p.acceptedSongs}/${p.songCount} songs · ${p.createdSongIds.length} tracks · Audio complete ${p.completedSongs}/${p.songCount}`;
  const labels = vi ? { recovered: 'Đọc tiến độ đã lưu', submitting: `Đang xử lý bài ${p.songIndex}/${p.songCount}`, saved: `Đã lưu ID bài ${p.songIndex}`, waiting: 'Đợi Suno hoàn tất âm thanh', playlist: 'Đang thêm và xác minh playlist', completed: 'Đã lưu playlist hoàn chỉnh' }
    : { recovered: 'Loaded saved progress', submitting: `Processing song ${p.songIndex}/${p.songCount}`, saved: `Saved IDs for song ${p.songIndex}`, waiting: 'Waiting for audio completion', playlist: 'Adding and verifying playlist', completed: 'Saved completed playlist' };
  const selection = p.selectedTracks === undefined ? '' : vi ? ` · Đã chọn ${p.selectedTracks} bản để thêm cùng lượt` : ` · Selected ${p.selectedTracks} tracks for one add`;
  return `${labels[p.phase]}${selection} · ${counts}`;
};
