import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
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
  const inspect = async (asset: MotionVectorAsset, character = false): Promise<{ issue?: string; bounds?: MotionVisualRect }> => {
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
      async (__runtimePayload) => {
        const { RT_SHARED, RT_SERVER } = __runtimePayload.texts;
        const { source, config } = __runtimePayload.value;
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
        const canvas = document.querySelector(RT_SHARED.CANVAS)!;
        canvas.width = canvas.height = config.SIZE;
        const context = canvas.getContext(RT_SERVER.VALUE_2D, { willReadFrequently: true })!;
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
        const rows = new Array<number>(config.SIZE).fill(0);
        for (let y = 0; y < config.SIZE; y++)
          for (let x = 0; x < config.SIZE; x++) {
            const alpha = pixels[(y * config.SIZE + x) * 4 + 3];
            if (alpha) visible++;
            if (alpha > 10) {
              rows[y]++;
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
        if (config.CHARACTER) {
          const total = rows.reduce((sum, count) => sum + count, 0);
          let before = 0,
            gap = 0;
          for (let y = minY; y <= maxY; y++) {
            if (rows[y]) {
              if (gap >= Math.max(2, (maxY - minY + 1) * config.BODY_GAP_RATIO) && before >= total * config.BODY_PART_RATIO && total - before >= total * config.BODY_PART_RATIO) return { issue: config.DISCONNECTED };
              gap = 0;
            } else gap++;
            before += rows[y];
          }
          const visited = new Uint8Array(config.SIZE * config.SIZE),
            components: number[] = [];
          for (let seed = 0; seed < visited.length; seed++) {
            if (visited[seed] || pixels[seed * 4 + 3] <= 10) continue;
            const pending = [seed];
            visited[seed] = 1;
            let count = 0;
            while (pending.length) {
              const point = pending.pop()!,
                x = point % config.SIZE,
                y = Math.floor(point / config.SIZE);
              count++;
              for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                  const nx = x + dx,
                    ny = y + dy,
                    next = ny * config.SIZE + nx;
                  if (nx < 0 || ny < 0 || nx >= config.SIZE || ny >= config.SIZE || visited[next] || pixels[next * 4 + 3] <= 10) continue;
                  visited[next] = 1;
                  pending.push(next);
                }
            }
            components.push(count);
          }
          if (components.filter((count) => count >= total * config.BODY_PART_RATIO).length > 1) return { issue: config.DISCONNECTED };
        }
        return { issue: opaque / (config.SIZE * config.SIZE) >= config.OPAQUE_RATIO && cornerOpaque / (4 * config.CORNER_SIZE * config.CORNER_SIZE) >= config.CORNER_OPAQUE_RATIO ? config.BACKDROP : undefined, bounds: { x: minX / config.SIZE, y: minY / config.SIZE, width: (maxX - minX + 1) / config.SIZE, height: (maxY - minY + 1) / config.SIZE } };
      },
      {
        value: {
          source: motionVectorSource(asset.svg),
          config: {
            SIZE: character ? V.CUTOUT.CHARACTER_SIZE : V.CUTOUT.SIZE,
            CHARACTER: character,
            BODY_GAP_RATIO: V.CUTOUT.BODY_GAP_RATIO,
            BODY_PART_RATIO: V.CUTOUT.BODY_PART_RATIO,
            DISCONNECTED: V.CUTOUT.DISCONNECTED,
            OPAQUE_ALPHA: V.CUTOUT.OPAQUE_ALPHA,
            OPAQUE_RATIO: V.CUTOUT.OPAQUE_RATIO,
            CORNER_SIZE: V.CUTOUT.CORNER_SIZE,
            CORNER_OPAQUE_RATIO: V.CUTOUT.CORNER_OPAQUE_RATIO,
            TIMEOUT_MS: V.CUTOUT.TIMEOUT_MS,
            RASTER_TIMEOUT: V.CUTOUT.RASTER_TIMEOUT,
            RASTER_FAILED: V.CUTOUT.RASTER_FAILED,
            EMPTY: V.CUTOUT.EMPTY,
            BACKDROP: V.CUTOUT.BACKDROP,
          },
        },
        texts: { RT_SHARED: { CANVAS: RT_SHARED.CANVAS }, RT_SERVER: { VALUE_2D: RT_SERVER.VALUE_2D } },
      },
    );
    signal?.throwIfAborted();
    return issue;
  };
  return {
    check: async (asset: MotionVectorAsset, character = false): Promise<string | undefined> => {
      const key = `${character}${RT_SHARED.SYMBOL_E7AC07}${asset.svg}`;
      const previous = checked.get(key);
      const result = previous || chain.then(() => inspect(asset, character));
      chain = result.catch(() => {});
      checked.set(key, result);
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
    const keys = new Set(spec.scenes.flatMap((scene) => (scene.composition ? [] : scene.nodes.filter((node) => node.kind !== RT_SHARED.LABEL).map((node) => node.assetKey!))));
    for (const key of keys) {
      const asset = spec.assets[key];
      const issue = await inspector.check(
        asset,
        spec.scenes.some((scene) => scene.nodes.some((node) => node.assetKey === key && node.kind === RT_SHARED.CHARACTER)),
      );
      if (issue) throw new Error(V.SVG_ERROR(`${asset.description || key}${RT_SHARED.SYMBOL_45822F}${issue}`));
    }
  } finally {
    await inspector.close();
  }
};
