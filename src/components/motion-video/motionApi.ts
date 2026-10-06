import { MOTION_DESIGN_REDRAW_SUFFIX, MOTION_TEMPLATE_DESIGN_FILE_URL, MOTION_TEMPLATE_DESIGN_ITEM_URL } from "../../constants/motionRuntime.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import _ from "lodash";
import { API_ROUTES } from "../../constants/apiRoutes.js";
import { MOTION_TEMPLATE_GB, MOTION_TEMPLATE_MB, MOTION_TEMPLATE_SYMBOL_10, MOTION_TEMPLATE_SYMBOL_11, MOTION_TEXT_0, MOTION_TEXT_ABORTED, MOTION_TEXT_ABORTERROR, MOTION_TEXT_APPLICATION_JSON, MOTION_TEXT_ID, MOTION_TEXT_KHONG_TAI_DUOC_MOTION_ENGINE, MOTION_TEXT_MOTION_ENGINE_LOI_KHOI_TAO, MOTION_TEXT_POST, MOTION_TEXT_REQUEST_FAILED, MOTION_TEXT_SCRIPT } from "../../constants/motionRuntime.js";
import type { MotionCatalog, MotionCharacterDef } from "../../types/motionVideo.js";
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
  customCharacters?: Record<string, MotionCharacterDef>;
  registry: { characters: Record<string, MotionCharacterDef>; assets: Record<string, any>; environments: Record<string, any>; actions: Record<string, any>; templates: Record<string, any> };
  createRenderer: (canvas: HTMLCanvasElement, spec: unknown, opts?: Record<string, unknown>) => { duration: number; drawFrame: (t: number) => void; width: number; height: number };
  drawCharacter: (g: CanvasRenderingContext2D, ch: unknown, o?: Record<string, unknown>) => void;
  drawAsset: (g: CanvasRenderingContext2D, id: string, x: number, y: number, o?: Record<string, unknown>, s?: number) => void;
  catalog: () => MotionCatalog;
  registerDesigned?: (designs: Record<string, unknown>[]) => string[];
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
export const registerCustomCharacters = (ME: MotionEngineGlobal, custom: MotionCharacterDef[]) => {
  ME.customCharacters = _.keyBy(custom, MOTION_TEXT_ID);
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
export const motionDesignUrl = (id: string, redesign = false): string => MOTION_TEMPLATE_DESIGN_ITEM_URL(API_ROUTES.MOTION_VIDEO_DESIGNS, encodeURIComponent(id), redesign ? MOTION_DESIGN_REDRAW_SUFFIX : "");
export const motionDesignFileUrl = (relativePath: string): string => MOTION_TEMPLATE_DESIGN_FILE_URL(API_ROUTES.MOTION_VIDEO_DESIGNS_FILE, encodeURIComponent(relativePath));
