import { VIDEO_EXPORT_TEMPLATE_FFMPEG_EXITED_WITH_CODE, VIDEO_EXPORT_TEXT_ABORT, VIDEO_EXPORT_TEXT_CLOSE, VIDEO_EXPORT_TEXT_DATA, VIDEO_EXPORT_TEXT_ERROR, VIDEO_EXPORT_TEXT_HIDE_BANNER, VIDEO_EXPORT_TEXT_I, VIDEO_EXPORT_TEXT_MESSAGE, VIDEO_EXPORT_TEXT_NOSTATS, VIDEO_EXPORT_TEXT_PIPE_1, VIDEO_EXPORT_TEXT_PROGRESS, VIDEO_EXPORT_TEXT_SIGKILL } from "../../../../constants/videoExportText";
import { spawn } from "child_process";
import _ from "lodash";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { VIDEO_EXPORT_CONSTANTS, VIDEO_EXPORT_REGEX } from "../../constants/videoExport.js";
type RunFfmpegOptions = { signal?: AbortSignal; onProgressSeconds?: (seconds: number) => void };
const STDERR_TAIL_LENGTH = 4000;
const ABORT_CLOSE_TIMEOUT_MS = 5000;
const PROGRESS_ARGS = [VIDEO_EXPORT_TEXT_HIDE_BANNER, VIDEO_EXPORT_TEXT_NOSTATS, VIDEO_EXPORT_TEXT_PROGRESS, VIDEO_EXPORT_TEXT_PIPE_1];
export const isAbortError = (error: unknown): boolean => _.get(error, VIDEO_EXPORT_TEXT_MESSAGE) === VIDEO_EXPORT_CONSTANTS.PROCESS_ABORTED;
export const createAbortError = (): Error => new Error(VIDEO_EXPORT_CONSTANTS.PROCESS_ABORTED);
export const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw createAbortError();
};
export const runFfmpeg = (args: string[], options: RunFfmpegOptions = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const { signal, onProgressSeconds } = options;
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const child = spawn(getFfmpegPath(), [...PROGRESS_ARGS, ...args], { windowsHide: true });
    let stderrTail = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener(VIDEO_EXPORT_TEXT_ABORT, handleAbort);
      if (error) reject(error);
      else resolve();
    };
    const handleAbort = () => {
      try {
        child.kill(VIDEO_EXPORT_TEXT_SIGKILL);
      } catch {}
      setTimeout(() => finish(createAbortError()), ABORT_CLOSE_TIMEOUT_MS);
    };
    signal?.addEventListener(VIDEO_EXPORT_TEXT_ABORT, handleAbort, { once: true });
    child.stdout.on(VIDEO_EXPORT_TEXT_DATA, (chunk: Buffer) => {
      if (!onProgressSeconds) return;
      const matches = [...chunk.toString().matchAll(VIDEO_EXPORT_REGEX.OUT_TIME)];
      const lastMatch = _.last(matches);
      if (lastMatch) onProgressSeconds(_.toNumber(lastMatch[1]) / 1_000_000);
    });
    child.stderr.on(VIDEO_EXPORT_TEXT_DATA, (chunk: Buffer) => {
      stderrTail = `${stderrTail}${chunk.toString()}`.slice(-STDERR_TAIL_LENGTH);
    });
    child.on(VIDEO_EXPORT_TEXT_ERROR, (error) => finish(error));
    child.on(VIDEO_EXPORT_TEXT_CLOSE, (code) => {
      if (signal?.aborted) {
        finish(createAbortError());
        return;
      }
      if (code === 0) finish();
      else finish(new Error(_.trim(_.last(_.compact(stderrTail.split(/\r?\n/)))) || VIDEO_EXPORT_TEMPLATE_FFMPEG_EXITED_WITH_CODE(`${code}`)));
    });
  });
export const probeMediaDurationSeconds = (filePath: string): Promise<number> =>
  new Promise((resolve) => {
    const child = spawn(getFfmpegPath(), [VIDEO_EXPORT_TEXT_HIDE_BANNER, VIDEO_EXPORT_TEXT_I, filePath], { windowsHide: true });
    let stderr = "";
    let settled = false;
    const finish = (seconds: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(seconds);
    };
    const timeout = setTimeout(() => {
      try {
        child.kill(VIDEO_EXPORT_TEXT_SIGKILL);
      } catch {}
      finish(0);
    }, VIDEO_EXPORT_CONSTANTS.DURATION_PROBE_TIMEOUT_MS);
    child.stderr.on(VIDEO_EXPORT_TEXT_DATA, (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on(VIDEO_EXPORT_TEXT_ERROR, () => finish(0));
    child.on(VIDEO_EXPORT_TEXT_CLOSE, () => {
      const match = stderr.match(VIDEO_EXPORT_REGEX.DURATION);
      if (!match) {
        finish(0);
        return;
      }
      const seconds = _.toNumber(match[1]) * 3600 + _.toNumber(match[2]) * 60 + _.toNumber(match[3]);
      finish(Number.isFinite(seconds) && seconds > 0 ? seconds : 0);
    });
  });
