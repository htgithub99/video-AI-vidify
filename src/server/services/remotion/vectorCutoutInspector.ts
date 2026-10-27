import { chromium, type Browser, type Page } from "playwright";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { motionVectorSource } from "../../../lib/motionVectorAsset.js";
import { motionVectorCutoutIssue } from "../../../lib/motionVectorCutout.js";
import type { MotionVectorAsset, MotionRemotionSpec, MotionVisualRect } from "../../../types/motionVisual.js";
import { findNativeChrome } from "../nativeProxyBrowser.js";
export const createVectorCutoutInspector = (signal?: AbortSignal) => {
  let browser: Promise<Browser> | undefined;
  let page: Promise<Page> | undefined;
  let chain: Promise<unknown> = Promise.resolve();
  const checked = new Map<string, Promise<{ issue?: string; bounds?: MotionVisualRect }>>();
  const inspect = async (asset: MotionVectorAsset): Promise<{ issue?: string; bounds?: MotionVisualRect }> => {
    signal?.throwIfAborted();
    const obvious = motionVectorCutoutIssue(asset.svg);
    if (obvious) return { issue: obvious };
    browser ||= chromium.launch({ executablePath: findNativeChrome(), headless: true });
    page ||= browser.then(async (instance) => {
      const target = await instance.newPage();
      await target.setContent(V.CUTOUT.HTML);
      return target;
    });
    const target = await page;
    const issue = await target.evaluate(
      async ({ source, config }) => {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error(config.RASTER_TIMEOUT)), config.TIMEOUT_MS);
          image.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          image.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(config.RASTER_FAILED));
          };
          image.src = source;
        });
        const canvas = document.querySelector("canvas")!;
        canvas.width = canvas.height = config.SIZE;
        const context = canvas.getContext("2d", { willReadFrequently: true })!;
        context.clearRect(0, 0, config.SIZE, config.SIZE);
        context.drawImage(image, 0, 0, config.SIZE, config.SIZE);
        const pixels = context.getImageData(0, 0, config.SIZE, config.SIZE).data;
        let opaque = 0,
          visible = 0,
          cornerOpaque = 0;
        let minX: number = config.SIZE,
          minY: number = config.SIZE,
          maxX = -1,
          maxY = -1;
        for (let y = 0; y < config.SIZE; y++)
          for (let x = 0; x < config.SIZE; x++) {
            const alpha = pixels[(y * config.SIZE + x) * 4 + 3];
            if (alpha) visible++;
            if (alpha > 10) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
            if (alpha >= config.OPAQUE_ALPHA) {
              opaque++;
              if ((x < config.CORNER_SIZE || x >= config.SIZE - config.CORNER_SIZE) && (y < config.CORNER_SIZE || y >= config.SIZE - config.CORNER_SIZE)) cornerOpaque++;
            }
          }
        if (!visible || maxX < minX) return { issue: config.EMPTY };
        return { issue: opaque / (config.SIZE * config.SIZE) >= config.OPAQUE_RATIO && cornerOpaque / (4 * config.CORNER_SIZE * config.CORNER_SIZE) >= config.CORNER_OPAQUE_RATIO ? config.BACKDROP : undefined, bounds: { x: minX / config.SIZE, y: minY / config.SIZE, width: (maxX - minX + 1) / config.SIZE, height: (maxY - minY + 1) / config.SIZE } };
      },
      {
        source: motionVectorSource(asset.svg),
        config: { SIZE: V.CUTOUT.SIZE, OPAQUE_ALPHA: V.CUTOUT.OPAQUE_ALPHA, OPAQUE_RATIO: V.CUTOUT.OPAQUE_RATIO, CORNER_SIZE: V.CUTOUT.CORNER_SIZE, CORNER_OPAQUE_RATIO: V.CUTOUT.CORNER_OPAQUE_RATIO, TIMEOUT_MS: V.CUTOUT.TIMEOUT_MS, RASTER_TIMEOUT: V.CUTOUT.RASTER_TIMEOUT, RASTER_FAILED: V.CUTOUT.RASTER_FAILED, EMPTY: V.CUTOUT.EMPTY, BACKDROP: V.CUTOUT.BACKDROP },
      },
    );
    signal?.throwIfAborted();
    return issue;
  };
  return {
    check: async (asset: MotionVectorAsset): Promise<string | undefined> => {
      const previous = checked.get(asset.svg);
      const result = previous || chain.then(() => inspect(asset));
      chain = result.catch(() => {});
      checked.set(asset.svg, result);
      const value = await result;
      if (value.bounds) asset.bounds = value.bounds;
      return value.issue;
    },
    close: async () => {
      await chain;
      if (browser) await browser.then((instance) => instance.close()).catch(() => undefined);
    },
  };
};
export const checkRemotionCutoutLayers = async (spec: MotionRemotionSpec, signal?: AbortSignal): Promise<void> => {
  const inspector = createVectorCutoutInspector(signal);
  try {
    const keys = new Set(spec.scenes.flatMap((scene) => scene.nodes.filter((node) => node.kind !== "label").map((node) => node.assetKey!)));
    for (const key of keys) {
      const asset = spec.assets[key];
      const issue = await inspector.check(asset);
      if (issue) throw new Error(V.SVG_ERROR(`${asset.description || key}: ${issue}`));
    }
  } finally {
    await inspector.close();
  }
};
