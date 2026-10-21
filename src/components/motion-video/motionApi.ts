import _ from "lodash";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import {
  MOTION_TEMPLATE_GB,
  MOTION_TEMPLATE_MB,
  MOTION_TEMPLATE_SYMBOL_10,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_3,
  MOTION_TEMPLATE_V,
  MOTION_TEXT_0,
  MOTION_TEXT_ABORTED,
  MOTION_TEXT_ABORTERROR,
  MOTION_TEXT_APPLICATION_JSON,
  MOTION_TEXT_ASSETS_MOTION_VIDEO_AUDIO,
  MOTION_TEXT_KHONG_TAI_DUOC_MOTION_ENGINE,
  MOTION_TEXT_MOTION_ENGINE_LOI_KHOI_TAO,
  MOTION_TEXT_POST,
  MOTION_TEXT_REQUEST_FAILED,
  MOTION_TEXT_SCRIPT,
} from "../../constants/motionRuntime.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
export const motionRequest = async <T = any>(url: string, body?: unknown, method?: string, signal?: AbortSignal): Promise<T> => {
  const init: RequestInit = body === undefined && !method ? { signal } : { method: method || MOTION_TEXT_POST, headers: { "Content-Type": MOTION_TEXT_APPLICATION_JSON }, body: body === undefined ? undefined : stringifyJson(body), signal };
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) throw new Error(_.toString(data?.error) || response.statusText || MOTION_TEXT_REQUEST_FAILED);
  return data as T;
};
export interface MotionEngineGlobal {
  version: string;
  fontsReady?: Promise<unknown>;
  registry: { templates: Record<string, any> };
  createRenderer: (canvas: HTMLCanvasElement, spec: unknown, opts?: Record<string, unknown>) => { duration: number; drawFrame: (t: number) => void; width: number; height: number };
  PUPPET_PRELOAD?: (spec: unknown) => Promise<void>;
}
declare global {
  interface Window {
    MotionEngine?: MotionEngineGlobal;
  }
}
let enginePromise: Promise<MotionEngineGlobal> | null = null;
export const loadMotionEngineClient = (): Promise<MotionEngineGlobal> => {
  if (window.MotionEngine?.createRenderer) return Promise.resolve(window.MotionEngine);
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    const res = await fetch(API_ROUTES.MOTION_VIDEO_ENGINE);
    if (!res.ok) throw new Error(MOTION_TEXT_KHONG_TAI_DUOC_MOTION_ENGINE);
    const code = await res.text();
    const script = document.createElement(MOTION_TEXT_SCRIPT);
    script.text = code;
    document.head.appendChild(script);
    const ME = window.MotionEngine;
    if (!ME?.createRenderer) throw new Error(MOTION_TEXT_MOTION_ENGINE_LOI_KHOI_TAO);
    await Promise.race([ME.fontsReady || Promise.resolve(), new Promise((r) => setTimeout(r, 4000))]);
    return ME;
  })().catch((e) => {
    enginePromise = null;
    throw e;
  });
  return enginePromise;
};
export const pollMotionJob = async <T>(statusUrl: string, onUpdate: (job: T) => void, isDone: (job: T) => boolean, signal?: AbortSignal, intervalMs = 1000): Promise<T> => {
  for (;;) {
    if (signal?.aborted) throw new DOMException(MOTION_TEXT_ABORTED, MOTION_TEXT_ABORTERROR);
    const data = await motionRequest<{ job: T }>(statusUrl, undefined, undefined, signal);
    onUpdate(data.job);
    if (isDone(data.job)) return data.job;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
};
export const formatSeconds = (s?: number): string => {
  const v = Math.max(0, Math.round(_.toNumber(s) || 0));
  const h = Math.floor(v / 3600),
    m = Math.floor((v % 3600) / 60),
    sec = v % 60;
  return h ? MOTION_TEMPLATE_SYMBOL_10(`${h}`, `${String(m).padStart(2, MOTION_TEXT_0)}`, `${String(sec).padStart(2, MOTION_TEXT_0)}`) : MOTION_TEMPLATE_SYMBOL_11(`${m}`, `${String(sec).padStart(2, MOTION_TEXT_0)}`);
};
export const formatBytes = (b?: number): string => {
  const v = _.toNumber(b) || 0;
  return v > 1073741824 ? MOTION_TEMPLATE_GB(`${(v / 1073741824).toFixed(2)}`) : MOTION_TEMPLATE_MB(`${(v / 1048576).toFixed(1)}`);
};
export const readFileBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(_.toString(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
export const motionAudioUrl = (id?: string): string | undefined => (id ? `${MOTION_TEXT_ASSETS_MOTION_VIDEO_AUDIO}${encodeURIComponent(id)}` : undefined);
export const motionJobStatusUrl = (prefix: string, id: string): string => `${prefix}${encodeURIComponent(id)}`;
export const formatMotionProgress = (progress = 0, minimum = 0): string => MOTION_TEMPLATE_SYMBOL_3(String(Math.min(100, Math.max(minimum, Math.round(progress * 100)))));
export const genPreviewUrl = (rel?: string, stamp?: string): string => (rel ? `${API_ROUTES.MOTION_GEN_PREVIEW}${encodeURIComponent(rel)}${stamp ? MOTION_TEMPLATE_V(`${encodeURIComponent(stamp)}`) : ""}` : "");
