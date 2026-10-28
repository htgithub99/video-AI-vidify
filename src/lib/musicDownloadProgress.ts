import type { MusicDownloadProgress } from '../types/musicDownloadProgress.js';
import { MUSIC_PLANNING as P } from '../constants/musicPlanning.js';

export const readMusicDownloadResponse = async (response: Response, onProgress: (progress: MusicDownloadProgress) => void): Promise<any> => {
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
  } finally { reader.releaseLock(); }
  if (!result) throw new Error('Luồng tải và đánh giá nhạc bị ngắt trước khi hoàn tất. Các file đã tải vẫn được giữ; hãy thử lại để tiếp tục.');
  return result;
};

export const formatMusicDownloadProgress = (progress: MusicDownloadProgress, language: string): string => {
  const vi = language !== 'en';
  const parts = [progress.room ? `Room ${progress.room}/${progress.rooms || progress.room}` : '', progress.attempt ? `${vi ? 'Lần' : 'Attempt'} ${progress.attempt}` : ''];
  if (progress.phase === 'queued') parts.push(vi ? 'Đang chờ lượt upload' : 'Waiting for an upload slot');
  if (progress.phase === 'selecting') parts.push(vi ? 'Đang mở ô chọn tệp' : 'Opening file picker');
  if (progress.phase === 'selected') parts.push(vi ? `Đã chọn ${progress.expected} tệp; đang xác nhận upload` : `Selected ${progress.expected} files; verifying upload`);
  else if (progress.selected !== undefined) parts.push(`${vi ? 'Đã nhận' : 'Received'} ${progress.selected}/${progress.expected}`);
  if (progress.ready !== undefined) parts.push(`${vi ? 'Sẵn sàng' : 'Ready'} ${progress.ready}/${progress.expected}`);
  if (progress.processing !== undefined) parts.push(`${vi ? 'Đang xử lý' : 'Processing'} ${progress.processing}`);
  if (progress.failed !== undefined) parts.push(`${vi ? 'Lỗi' : 'Errors'} ${progress.failed}`);
  if (progress.namesMatch === false) parts.push(vi ? 'Tên tệp chưa khớp đầy đủ' : 'File names not fully matched');
  if (progress.pending) parts.push(`${vi ? 'Request đang tải' : 'Pending uploads'} ${progress.pending}`);
  if (progress.elapsedMs !== undefined) parts.push(`${Math.round(progress.elapsedMs / 1000)}s`);
  if (progress.message) parts.push(progress.message);
  return parts.filter(Boolean).join(' · ').slice(0, 240);
};
