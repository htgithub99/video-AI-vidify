import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import type { Response } from "express";
import { MUSIC_PLANNING as P } from "../../constants/musicPlanning.js";
import type { SunoCreationProgress } from "../../types/sunoCreationProgress.js";
export const sunoCreationReporter = (res: Response, streaming: boolean) => {
  if (streaming) {
    res.setHeader(P.STREAM_HEADER, P.STREAM_TYPE);
    res.setHeader(P.STREAM_CACHE_HEADER, P.STREAM_CACHE);
    res.setHeader(P.STREAM_BUFFER_HEADER, P.STREAM_BUFFER_OFF);
    res.flushHeaders();
  }
  const emit = (event: unknown) => {
    if (streaming && !res.destroyed && !res.writableEnded) res.write(stringifyJson(event) + RT_SHARED.SYMBOL_01BA47);
  };
  const heartbeat = streaming
    ? setInterval(() => {
        if (!res.destroyed && !res.writableEnded) res.write(RT_SHARED.SYMBOL_01BA47);
      }, P.STREAM_HEARTBEAT_MS)
    : undefined;
  heartbeat?.unref();
  const stop = () => clearInterval(heartbeat);
  res.once(RT_SERVER.CLOSE, stop);
  res.once(RT_SERVER.FINISH, stop);
  return {
    progress: (progress: SunoCreationProgress) => emit({ type: RT_SHARED.PROGRESS, progress }),
    finish: (result: unknown, status = 200) => {
      stop();
      if (res.destroyed || res.writableEnded) return;
      if (!streaming) return res.status(status).json(result);
      emit({ type: RT_SHARED.RESULT, result });
      res.end();
    },
  };
};
