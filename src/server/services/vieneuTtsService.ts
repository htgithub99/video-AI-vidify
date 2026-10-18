import * as MR from "../../constants/motionRuntime.js";
import fs from "fs";
import path from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { randomUUID } from "crypto";
import { createInterface } from "readline";
import { MOTION_VOICE as C } from "../../constants/motionVoice.js";
import type { MotionVoicePreset } from "../../types/motionVideo.js";
import { getDataDirectory, getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
let setup: Promise<string> | undefined;
let worker: ChildProcessWithoutNullStreams | undefined;
let queue: Promise<unknown> = Promise.resolve();
let idle: ReturnType<typeof setTimeout> | undefined;
const requests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();
export const vieneuRoot = (): string => path.join(getDataDirectory(), C.ROOT);
const execute = (python: string, args: string[], signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error(C.CANCELLED));
    const child = spawn(python, args, { windowsHide: true });
    let errors: string = MR.MOTION_TEXT_EMPTY;
    const abort = () => child.kill();
    const timer = setTimeout(abort, C.TIMEOUT);
    signal?.addEventListener(MR.MOTION_TEXT_ABORT, abort, { once: true });
    child.stderr.on(MR.MOTION_TEXT_DATA, (data) => {
      errors = (errors + data).slice(-2500);
    });
    const clear = () => {
      clearTimeout(timer);
      signal?.removeEventListener(MR.MOTION_TEXT_ABORT, abort);
    };
    child.on(MR.MOTION_TEXT_ERROR, (error) => {
      clear();
      reject(error);
    });
    child.on(MR.MOTION_TEXT_CLOSE, (code) => {
      clear();
      code === 0 && !signal?.aborted ? resolve() : reject(new Error(signal?.aborted ? C.CANCELLED : errors || C.FAILED));
    });
  });
export const ensureVieneuRuntime = async (signal?: AbortSignal, log?: (value: string) => void): Promise<string> => {
  const configured = process.env[C.PYTHON_ENV];
  if (configured) return configured;
  if (!setup)
    setup = (async () => {
      const root = vieneuRoot(),
        runtime = path.join(root, C.RUNTIME),
        python = path.join(runtime, process.platform === MR.MOTION_TEXT_WIN32 ? MR.MOTION_TEXT_SCRIPTS_PYTHON_EXE : MR.MOTION_TEXT_BIN_PYTHON),
        ready = path.join(runtime, MR.MOTION_TEXT_VIENEU_VERSION_JSON);
      fs.mkdirSync(root, { recursive: true });
      if (fs.existsSync(python) && fs.existsSync(ready)) {
        const version = JSON.parse(fs.readFileSync(ready, MR.MOTION_TEXT_UTF8));
        if (version.package === C.PACKAGE && version.onnx === C.ONNX) return python;
      }
      log?.(C.SETUP);
      if (!fs.existsSync(python)) await execute(getPythonCommand(), [MR.MOTION_TEXT_M, MR.MOTION_TEXT_VENV, runtime], signal);
      await execute(python, [MR.MOTION_TEXT_M, MR.MOTION_TEXT_PIP, MR.MOTION_TEXT_INSTALL, MR.MOTION_TEXT_DISABLE_PIP_VERSION_CHECK, C.PACKAGE, C.ONNX], signal);
      fs.writeFileSync(ready, JSON.stringify({ package: C.PACKAGE, onnx: C.ONNX }));
      return python;
    })().catch((error) => {
      setup = undefined;
      throw error;
    });
  return setup;
};
let asrSetup: Promise<void> | undefined;
export const ensureVieneuAsr = (signal?: AbortSignal, log?: (value: string) => void): Promise<void> => {
  if (!asrSetup)
    asrSetup = (async () => {
      const python = await ensureVieneuRuntime(signal, log),
        marker = path.join(vieneuRoot(), C.RUNTIME, C.ASR.MARKER);
      if (fs.existsSync(marker) && JSON.parse(fs.readFileSync(marker, MR.MOTION_TEXT_UTF8)).package === C.ASR.PACKAGE) return;
      log?.(C.ASR.SETUP);
      await execute(python, [MR.MOTION_TEXT_M, MR.MOTION_TEXT_PIP, MR.MOTION_TEXT_INSTALL, MR.MOTION_TEXT_DISABLE_PIP_VERSION_CHECK, C.ASR.PACKAGE], signal);
      fs.writeFileSync(marker, JSON.stringify({ package: C.ASR.PACKAGE }));
    })().catch((error) => {
      asrSetup = undefined;
      throw error;
    });
  return asrSetup;
};
export const closeVieneuWorker = (): void => {
  clearTimeout(idle);
  const child = worker;
  worker = undefined;
  child?.kill();
  for (const pending of requests.values()) pending.reject(new Error(C.CANCELLED));
  requests.clear();
};
const request = async <T>(command: Record<string, unknown>, signal?: AbortSignal, log?: (value: string) => void): Promise<T> => {
  const work = async (): Promise<T> => {
    if (signal?.aborted) throw new Error(C.CANCELLED);
    clearTimeout(idle);
    if (!worker) {
      const python = await ensureVieneuRuntime(signal, log);
      if (signal?.aborted) throw new Error(C.CANCELLED);
      const child = spawn(python, [MR.MOTION_TEXT_U, getStaticResourcePath(C.WORKER), vieneuRoot()], { windowsHide: true, env: { ...process.env, PYTHONIOENCODING: MR.MOTION_TEXT_UTF_8 } });
      worker = child;
      let errors: string = MR.MOTION_TEXT_EMPTY;
      child.stderr.on(MR.MOTION_TEXT_DATA, (chunk) => {
        errors = (errors + String(chunk)).slice(-2000);
      });
      createInterface({ input: child.stdout }).on(MR.MOTION_TEXT_LINE, (line) => {
        try {
          const response = JSON.parse(line),
            pending = requests.get(response.id);
          if (pending) {
            requests.delete(response.id);
            response.error ? pending.reject(new Error(response.error)) : pending.resolve(response.result);
          }
        } catch {}
      });
      const failed = () => {
        if (worker !== child) return;
        worker = undefined;
        for (const pending of requests.values()) pending.reject(new Error(errors || C.FAILED));
        requests.clear();
      };
      child.on(MR.MOTION_TEXT_ERROR, failed);
      child.on(MR.MOTION_TEXT_CLOSE, failed);
      child.stdin.on(MR.MOTION_TEXT_ERROR, failed);
    }
    return new Promise<T>((resolve, reject) => {
      const id = randomUUID(),
        abort = () => closeVieneuWorker();
      const timer = setTimeout(abort, C.TIMEOUT);
      signal?.addEventListener(MR.MOTION_TEXT_ABORT, abort, { once: true });
      const clear = () => {
        clearTimeout(timer);
        signal?.removeEventListener(MR.MOTION_TEXT_ABORT, abort);
        idle = setTimeout(closeVieneuWorker, C.IDLE);
        idle.unref();
      };
      requests.set(id, {
        resolve: (value) => {
          clear();
          resolve(value);
        },
        reject: (error) => {
          clear();
          reject(error);
        },
      });
      worker!.stdin.write(JSON.stringify({ ...command, id }) + MR.MOTION_TEXT_SYMBOL_27);
    });
  };
  const pending = queue.then(work, work);
  queue = pending.catch(() => {});
  if (!signal) return pending;
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new Error(C.CANCELLED));
    signal.addEventListener(MR.MOTION_TEXT_ABORT, aborted, { once: true });
    if (signal.aborted) aborted();
    pending.then(resolve, reject).finally(() => signal.removeEventListener(MR.MOTION_TEXT_ABORT, aborted));
  });
};
export const listVieneuVoices = (signal?: AbortSignal, log?: (value: string) => void): Promise<MotionVoicePreset[]> => request({ command: MR.MOTION_TEXT_VOICES }, signal, log);
export interface VieneuDelivery { temperature?: number; silence?: number; }
export const synthesizeVieneuSpeech = (text: string, voice: string, file: string, signal?: AbortSignal, log?: (value: string) => void, delivery: VieneuDelivery = {}): Promise<{ seconds: number; sampleRate: number; backend: string }> => request({ command: MR.MOTION_TEXT_SYNTHESIZE, text, voice, file, ...delivery }, signal, log);
export const registerVieneuVoice = (voice: string, name: string, gender: string, file: string, signal?: AbortSignal): Promise<MotionVoicePreset> => request({ command: MR.MOTION_TEXT_REGISTER, voice, name, gender, file }, signal);
export const transcribeVieneuAudio = async (file: string, language: string, signal?: AbortSignal, log?: (value: string) => void): Promise<{ text: string; words: { w: string; s: number; e: number }[] }> => {
  await ensureVieneuAsr(signal, log);
  return request({ command: C.ASR.COMMAND, file, language, model: C.ASR.MODEL }, signal, log);
};
process.once(MR.MOTION_TEXT_EXIT, closeVieneuWorker);
