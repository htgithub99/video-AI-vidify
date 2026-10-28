import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { chromium, type Browser, type Page } from "playwright";
import { findNativeChrome } from "../nativeProxyBrowser.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../constants/motionSceneComposition.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { motionCompositionGeometryErrors } from "../../../lib/motionCompositionGeometry.js";
import { normalizeMotionVector } from "../../../lib/motionVectorAsset.js";
import type { MotionSceneComposition, MotionVectorAsset } from "../../../types/motionVisual.js";
export class MotionCompositionMeasurementError extends Error {
  constructor(cause: unknown) {
    super(C.GEOMETRY_UNAVAILABLE, { cause });
  }
}
export const createCompositionGeometryInspector = (signal?: AbortSignal) => {
  let browser: Promise<Browser> | undefined;
  let page: Promise<Page> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  const measured = new Map<string, Promise<string[]>>();
  const check = (asset: MotionVectorAsset, composition: MotionSceneComposition): Promise<string[]> => {
    const key = stringifyJson([asset.svg, composition.design]);
    if (measured.has(key)) return measured.get(key)!;
    const task = queue
      .catch(() => undefined)
      .then(async () => {
        signal?.throwIfAborted();
        if (!composition.design?.placements.length) return [];
        const safeAsset = normalizeMotionVector(asset.svg, asset.key, asset.inputKey, asset.description, true);
        browser ||= chromium.launch({ executablePath: findNativeChrome(), headless: true });
        page ||= browser.then(async (instance) => {
          const target = await instance.newPage({ javaScriptEnabled: false });
          await target.setContent(V.CUTOUT.HTML);
          return target;
        });
        const target = await page;
        const bounds = await target.evaluate(
          (__runtimePayload) => {
            const { RT_SERVER, RT_SHARED } = __runtimePayload.texts;
            const { svg, ids, width, height } = __runtimePayload.value;
            const root = document.importNode(new DOMParser().parseFromString(svg, RT_SERVER.IMAGE_SVG_XML).documentElement, true) as unknown as SVGSVGElement;
            root.setAttribute(RT_SHARED.WIDTH, String(width));
            root.setAttribute(RT_SHARED.HEIGHT, String(height));
            document.body.replaceChildren(root);
            const result: Record<string, { x: number; y: number; width: number; height: number } | null> = {};
            for (const id of ids) {
              const group = root.getElementById(id) as SVGGraphicsElement | null;
              if (!group) {
                result[id] = null;
                continue;
              }
              const box = group.getBBox();
              const matrix = group.getCTM(),
                base = root.getCTM();
              if (!matrix || !base) {
                result[id] = null;
                continue;
              }
              const transform = base.inverse().multiply(matrix);
              const points = [
                [box.x, box.y],
                [box.x + box.width, box.y],
                [box.x, box.y + box.height],
                [box.x + box.width, box.y + box.height],
              ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(transform));
              const left = Math.min(...points.map((point) => point.x)),
                top = Math.min(...points.map((point) => point.y));
              result[id] = { x: left / width, y: top / height, width: (Math.max(...points.map((point) => point.x)) - left) / width, height: (Math.max(...points.map((point) => point.y)) - top) / height };
            }
            return result;
          },
          { value: { svg: safeAsset.svg, ids: composition.design.placements.map((item) => item.id).slice(0, C.GEOMETRY.MAX_MEASUREMENTS), width: safeAsset.width, height: safeAsset.height }, texts: { RT_SERVER: { IMAGE_SVG_XML: RT_SERVER.IMAGE_SVG_XML }, RT_SHARED: { WIDTH: RT_SHARED.WIDTH, HEIGHT: RT_SHARED.HEIGHT } } },
        );
        signal?.throwIfAborted();
        return motionCompositionGeometryErrors(composition, bounds);
      })
      .catch((error) => {
        if (signal?.aborted) throw error;
        throw new MotionCompositionMeasurementError(error);
      });
    queue = task;
    measured.set(key, task);
    return task;
  };
  return {
    check,
    close: async () => {
      await queue.catch(() => undefined);
      if (browser) await browser.then((instance) => instance.close()).catch(() => undefined);
    },
  };
};
