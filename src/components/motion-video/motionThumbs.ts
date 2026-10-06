import { stringifyJson } from "../../lib/jsonStringify.js";
import {
  MOTION_TEMPLATE_A,
  MOTION_TEMPLATE_A3,
  MOTION_TEMPLATE_C,
  MOTION_TEMPLATE_C3,
  MOTION_TEMPLATE_E,
  MOTION_TEMPLATE_E3,
  MOTION_TEMPLATE_TOON_THUMB_KEY,
  MOTION_TEXT_16_9,
  MOTION_TEXT_2D,
  MOTION_TEXT_3D,
  MOTION_TEXT_ASSET,
  MOTION_TEXT_CANVAS,
  MOTION_TEXT_CHARACTER,
  MOTION_TEXT_DOCUMENTARY,
  MOTION_TEXT_HIGH,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_IMAGE_PNG,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_STAND,
  MOTION_TEXT_TODATAURL,
  MOTION_TEXT_TOON,
  MOTION_TEXT_TOON_ASSET,
  MOTION_TEXT_TOON_CHARACTER,
  MOTION_TEXT_TOON_ENV,
} from "../../constants/motionRuntime.js";
import type { MotionEngineGlobal } from "./motionApi";
const cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();
const idle = () => new Promise<void>((r) => setTimeout(r, 0));
const schedule = <T>(fn: () => Promise<T> | T): Promise<T> => {
  const p = queue.then(async () => {
    await idle();
    return fn();
  });
  queue = p.catch(() => undefined);
  return p;
};
const cropToContent = (src: HTMLCanvasElement, w: number, h: number, pad = 0.1): string => {
  const g = src.getContext(MOTION_TEXT_2D, { willReadFrequently: true })!;
  const { width, height } = src;
  const data = g.getImageData(0, 0, width, height).data;
  let x0 = width,
    y0 = height,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < height; y += 2) {
    const row = y * width * 4;
    for (let x = 0; x < width; x += 2) {
      if (data[row + x * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const out = document.createElement(MOTION_TEXT_CANVAS);
  out.width = w;
  out.height = h;
  if (x1 <= x0 || y1 <= y0) return out.toDataURL(MOTION_TEXT_IMAGE_PNG);
  const bw = x1 - x0 + 2,
    bh = y1 - y0 + 2;
  const s = Math.min((w * (1 - pad * 2)) / bw, (h * (1 - pad * 2)) / bh);
  const og = out.getContext(MOTION_TEXT_2D)!;
  og.imageSmoothingQuality = MOTION_TEXT_HIGH;
  og.drawImage(src, x0, y0, bw, bh, (w - bw * s) / 2, (h - bh * s) / 2 + (h * pad) / 2, bw * s, bh * s);
  return out.toDataURL(MOTION_TEXT_IMAGE_PNG);
};
export const assetThumb = (ME: MotionEngineGlobal, id: string, params: Record<string, unknown> = {}): Promise<string> => {
  const key = MOTION_TEMPLATE_A(`${id}`, `${stringifyJson(params)}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    c.width = 2400;
    c.height = 2000;
    const g = c.getContext(MOTION_TEXT_2D)!;
    try {
      ME.drawAsset(g, id, 1200, 1500, params, 1);
    } catch {}
    const url = cropToContent(c, 240, 160);
    cache.set(key, url);
    return url;
  });
};
export const characterThumb = (ME: MotionEngineGlobal, ch: unknown, action: string = MOTION_TEXT_STAND, t = 0.4): Promise<string> => {
  const key = MOTION_TEMPLATE_C(`${stringifyJson(ch)}`, `${action}`, `${t}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    c.width = 600;
    c.height = 600;
    const g = c.getContext(MOTION_TEXT_2D)!;
    g.translate(300, 520);
    try {
      ME.drawCharacter(g, ch, { action, t, phase: t * 5, scale: 2, shadow: false });
    } catch {}
    const url = cropToContent(c, 160, 220, 0.06);
    cache.set(key, url);
    return url;
  });
};
export const environmentThumb = (ME: MotionEngineGlobal, env: string, time?: string): Promise<string> => {
  const key = MOTION_TEMPLATE_E(`${env}`, `${time || ""}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    const spec = { aspect: MOTION_TEXT_16_9, look: MOTION_TEXT_DOCUMENTARY, shots: [{ start: 0, end: 4, template: MOTION_TEXT_SCENE, params: { env, time, camera: { zoom: 1 } } }] };
    try {
      const r = ME.createRenderer(c, spec, { width: 384, height: 216, quality: { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.5 } });
      r.drawFrame(1.6);
    } catch {}
    const url = c.toDataURL(MOTION_TEXT_IMAGE_JPEG, 0.85);
    cache.set(key, url);
    return url;
  });
};
type T3Api = { ok: boolean; preview: (kind: string, id: unknown, o?: Record<string, unknown>) => HTMLCanvasElement | OffscreenCanvas | null; hasWebGL: () => boolean };
const t3 = (ME: MotionEngineGlobal): T3Api | null => {
  const k = (ME as unknown as { T3?: T3Api }).T3;
  return k && k.ok && k.hasWebGL() ? k : null;
};
export const has3D = (ME: MotionEngineGlobal): boolean => !!t3(ME);
const canvasUrl = async (c: HTMLCanvasElement | OffscreenCanvas | null): Promise<string> => {
  if (!c) return "";
  if (MOTION_TEXT_TODATAURL in c) return (c as HTMLCanvasElement).toDataURL(MOTION_TEXT_IMAGE_JPEG, 0.88);
  const blob = await (c as OffscreenCanvas).convertToBlob({ type: MOTION_TEXT_IMAGE_JPEG, quality: 0.88 });
  return await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
};
export const assetThumb3D = (ME: MotionEngineGlobal, id: string): Promise<string> => {
  const key = MOTION_TEMPLATE_A3(`${id}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(async () => {
    const k = t3(ME);
    const url = k ? await canvasUrl(k.preview(MOTION_TEXT_ASSET, id, { width: 240, height: 170 })) : "";
    cache.set(key, url);
    return url;
  });
};
export const characterThumb3D = (ME: MotionEngineGlobal, ch: unknown, action: string = MOTION_TEXT_STAND): Promise<string> => {
  const key = MOTION_TEMPLATE_C3(`${stringifyJson(ch)}`, `${action}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(async () => {
    const k = t3(ME);
    const url = k ? await canvasUrl(k.preview(MOTION_TEXT_CHARACTER, ch, { width: 170, height: 230, action, yaw: -0.5 })) : "";
    cache.set(key, url);
    return url;
  });
};
export const environmentThumb3D = (ME: MotionEngineGlobal, env: string): Promise<string> => {
  const key = MOTION_TEMPLATE_E3(`${env}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    const spec = { aspect: MOTION_TEXT_16_9, look: MOTION_TEXT_DOCUMENTARY, renderMode: MOTION_TEXT_3D, shots: [{ start: 0, end: 4, template: MOTION_TEXT_SCENE, params: { env, camera: { zoom: 1 } } }] };
    try {
      const r = ME.createRenderer(c, spec, { width: 384, height: 216, quality: { supersample: 1, motionBlur: 1, bloom: true, grain: false, layerScale: 1 } });
      r.drawFrame(1.6);
    } catch {}
    const url = c.toDataURL(MOTION_TEXT_IMAGE_JPEG, 0.85);
    cache.set(key, url);
    return url;
  });
};
export interface MotionToonApi {
  wrap: <R>(style: string, fn: () => R) => R;
  list: { assets: string[]; envs: string[] };
  characters: string[];
}
export const toonApi = (ME: MotionEngineGlobal | null): MotionToonApi | null => (ME ? (ME as unknown as { TOON?: MotionToonApi }).TOON || null : null);
export const toonAssetThumb = (ME: MotionEngineGlobal, id: string, style: string): Promise<string> => {
  const key = MOTION_TEMPLATE_TOON_THUMB_KEY(`${MOTION_TEXT_TOON_ASSET}`, `${id}`, `${style}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    c.width = 2400;
    c.height = 2000;
    const g = c.getContext(MOTION_TEXT_2D)!;
    const api = toonApi(ME);
    try {
      if (api) api.wrap(style, () => ME.drawAsset(g, id, 1200, 1500, {}, 1));
    } catch {}
    const url = cropToContent(c, 240, 160);
    cache.set(key, url);
    return url;
  });
};
export const toonCharacterThumb = (ME: MotionEngineGlobal, ch: unknown, style: string, action: string = MOTION_TEXT_STAND): Promise<string> => {
  const key = MOTION_TEMPLATE_TOON_THUMB_KEY(`${MOTION_TEXT_TOON_CHARACTER}`, `${stringifyJson(ch)}${action}`, `${style}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    c.width = 600;
    c.height = 600;
    const g = c.getContext(MOTION_TEXT_2D)!;
    g.translate(300, 540);
    const api = toonApi(ME);
    try {
      if (api) api.wrap(style, () => ME.drawCharacter(g, ch, { action, t: 0.4, phase: 2, scale: 2, shadow: false }));
    } catch {}
    const url = cropToContent(c, 160, 220, 0.06);
    cache.set(key, url);
    return url;
  });
};
export const toonEnvironmentThumb = (ME: MotionEngineGlobal, env: string, style: string, time?: string): Promise<string> => {
  const key = MOTION_TEMPLATE_TOON_THUMB_KEY(`${MOTION_TEXT_TOON_ENV}`, `${env}${time || ""}`, `${style}`);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  return schedule(() => {
    const c = document.createElement(MOTION_TEXT_CANVAS);
    const spec = { aspect: MOTION_TEXT_16_9, look: MOTION_TEXT_DOCUMENTARY, renderMode: MOTION_TEXT_TOON, toonStyle: style, shots: [{ start: 0, end: 4, template: MOTION_TEXT_SCENE, params: { env, time, camera: { zoom: 1 } } }] };
    try {
      const r = ME.createRenderer(c, spec, { width: 384, height: 216, quality: { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.5 } });
      r.drawFrame(1.6);
    } catch {}
    const url = c.toDataURL(MOTION_TEXT_IMAGE_JPEG, 0.85);
    cache.set(key, url);
    return url;
  });
};
