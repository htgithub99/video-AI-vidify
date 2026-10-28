import type { Response } from 'express';
import { MUSIC_PLANNING as P } from '../../constants/musicPlanning.js';
import type { MusicDownloadProgress } from '../../types/musicDownloadProgress.js';
import { musicErrorDetails } from './musicDiagnosticService.js';

export const musicDownloadReporter = (res: Response, streaming: boolean) => {
  if (streaming) {
    res.setHeader(P.STREAM_HEADER, P.STREAM_TYPE);
    res.setHeader(P.STREAM_CACHE_HEADER, P.STREAM_CACHE);
    res.setHeader(P.STREAM_BUFFER_HEADER, P.STREAM_BUFFER_OFF);
    res.flushHeaders();
  }
  const emit = (event: unknown) => {
    if (streaming && !res.destroyed && !res.writableEnded) res.write(JSON.stringify(event) + '\n');
  };
  const heartbeat = streaming ? setInterval(() => {
    if (!res.destroyed && !res.writableEnded) res.write('\n');
  }, P.STREAM_HEARTBEAT_MS) : undefined;
  heartbeat?.unref();
  const stop = () => clearInterval(heartbeat);
  res.once('close', stop);
  res.once('finish', stop);
  return {
    progress: (progress: MusicDownloadProgress) => emit({ type: 'progress', progress: { ...progress, message: progress.message ? musicErrorDetails(new Error(progress.message)).errorMessage : undefined } }),
    finish: (result: unknown, status = 200) => {
      stop();
      if (res.destroyed || res.writableEnded) return;
      if (!streaming) return res.status(status).json(result);
      emit({ type: 'result', result });
      res.end();
    },
  };
};
