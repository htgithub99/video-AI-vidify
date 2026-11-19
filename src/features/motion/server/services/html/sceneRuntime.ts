import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { chromium, type Browser, type Page } from "playwright";
import { createHash, randomUUID } from "node:crypto";
import { findNativeChrome } from "../../../../../server/services/nativeProxyBrowser.js";
import { motionHtmlHostDocument } from "../../../../../lib/motionHtmlHost.js";
import type { MotionFigureRender } from "../../../../../lib/motionFigures.js";
import type { MotionHtmlChange, MotionHtmlFrameInput, MotionHtmlMark } from "../../../../../types/motionHtmlScene.js";
const timedOutFrames = new Map<string, number>();
let thumbnailBrowser: Promise<Browser> | undefined;
let thumbnailUsers = 0;
let thumbnailIdle: ReturnType<typeof setTimeout> | undefined;
export const withMotionThumbnailBrowser = async <T>(idleMs: number, use: (browser: Browser) => Promise<T>): Promise<T> => {
  if (thumbnailIdle) clearTimeout(thumbnailIdle);
  thumbnailUsers++;
  try {
    let browser = await (thumbnailBrowser ||= chromium.launch({ executablePath: findNativeChrome(), headless: true }));
    if (!browser.isConnected()) {
      thumbnailBrowser = chromium.launch({ executablePath: findNativeChrome(), headless: true });
      browser = await thumbnailBrowser;
    }
    return await use(browser);
  } catch (error) {
    if (thumbnailBrowser && !(await thumbnailBrowser.then((browser) => browser.isConnected()).catch(() => false))) thumbnailBrowser = undefined;
    throw error;
  } finally {
    thumbnailUsers--;
    if (!thumbnailUsers)
      thumbnailIdle = setTimeout(() => {
        const closing = thumbnailBrowser;
        thumbnailBrowser = undefined;
        void closing?.then((browser) => browser.close()).catch(() => undefined);
      }, idleMs);
  }
};
export const openMotionHtmlRuntime = async (html: string, signal?: AbortSignal, headless = true, shared?: Browser, render?: MotionFigureRender) => {
  signal?.throwIfAborted();
  let owned = !shared?.isConnected();
  let browser = owned ? await chromium.launch({ executablePath: findNativeChrome(), headless }) : shared!;
  const contentKey = createHash(RT_MAINTENANCE.SHA256).update(html).digest(RT_MAINTENANCE.HEX);
  const stop = () => {
    if (owned) void browser.close().catch(() => undefined);
  };
  signal?.addEventListener(RT_MAINTENANCE.ABORT, stop, { once: true });
  const opened: Page[] = [];
  try {
    const openPage = async () => {
      const next = await browser.newPage();
      opened.push(next);
      await next.route(RT_MAINTENANCE.ALL_REQUESTS_PATTERN, (route) => route.abort());
      await next.setContent(motionHtmlHostDocument(html, randomUUID(), render), { waitUntil: RT_MAINTENANCE.LOAD });
      return next;
    };
    let page = await openPage();
    let blankRun = false;
    const relaunch = async () => {
      await (owned ? browser.close() : page.close()).catch(() => undefined);
      signal?.throwIfAborted();
      browser = await chromium.launch({ executablePath: findNativeChrome(), headless });
      owned = true;
      page = await openPage();
    };
    const draw = async (input: MotionHtmlFrameInput, subtitle: string, fontFamily: string, allowBlank: boolean): Promise<Buffer> => {
      signal?.throwIfAborted();
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      try {
        const frameInput = subtitle ? { ...input, subtitle: { text: subtitle, font: fontFamily } } : input;
        const operation = page.evaluate(async ({ value, allowBlank, timeout }) => (await Promise.race([(window as any).renderMotionFrame(value, allowBlank), new Promise((_, reject) => setTimeout(() => reject(new Error(timeout)), 30000))])) as string, { value: frameInput, allowBlank, timeout: RT_MAINTENANCE.CANVAS_RENDERAT_TIMED_OUT });
        const image = (await Promise.race([
          operation,
          new Promise<never>((_, reject) => {
            watchdog = setTimeout(() => reject(new Error(RT_MAINTENANCE.CANVAS_RENDERAT_TIMED_OUT)), 35000);
          }),
        ])) as string;
        return Buffer.from(image.split(RT_MAINTENANCE.COMMA)[1], RT_MAINTENANCE.BASE64);
      } catch (error) {
        signal?.throwIfAborted();
        const reason = String((error as Error).message);
        if (RT_MAINTENANCE.CANVAS_BLANK_FRAME_RE.test(reason)) throw error;
        if (/Canvas renderAt timed out/.test(reason)) {
          const key = `${contentKey}${RT_MAINTENANCE.COLON}${input.frame}${RT_MAINTENANCE.COLON}${input.width}${RT_MAINTENANCE.COLON}${input.height}`;
          const count = (timedOutFrames.get(key) || 0) + 1;
          timedOutFrames.set(key, count);
          if (timedOutFrames.size > 512) timedOutFrames.delete(timedOutFrames.keys().next().value!);
          if (count < 3) throw error;
        }
        if (!page.isClosed() && !/browser.*closed|target.*closed|crash|Connection closed/i.test(reason)) throw Object.assign(new Error(reason), { motionHtmlExecution: true });
        throw error;
      } finally {
        clearTimeout(watchdog);
      }
    };
    return {
      notes: (): Promise<[string, string][]> => page.evaluate(() => ((window as any).__motionNotes || []) as [string, string][]).catch(() => []),
      async render(input: MotionHtmlFrameInput, subtitle = "", fontFamily: string = RT_MAINTENANCE.ARIAL): Promise<Buffer> {
        const blank = (error: unknown) => {
          if (!RT_MAINTENANCE.CANVAS_BLANK_FRAME_RE.test(String((error as Error)?.message))) throw error;
        };
        try {
          const image = await draw(input, subtitle, fontFamily, false);
          blankRun = false;
          return image;
        } catch (error) {
          blank(error);
        }
        if (!blankRun) {
          await relaunch();
          try {
            return await draw(input, subtitle, fontFamily, false);
          } catch (error) {
            blank(error);
          }
        }
        blankRun = true;
        return draw(input, subtitle, fontFamily, true);
      },
      async still(image: Buffer, opts: { width: number; quality: number; mime: string; canvas: string; context: string; smoothing: string }): Promise<string> {
        return page.evaluate(
          async ({ source, opts }) => {
            const img = new Image();
            img.src = source;
            await img.decode();
            const scale = Math.min(1, opts.width / img.naturalWidth);
            const canvas = document.createElement(opts.canvas) as HTMLCanvasElement;
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            const ctx = canvas.getContext(opts.context) as CanvasRenderingContext2D;
            ctx.imageSmoothingQuality = opts.smoothing as ImageSmoothingQuality;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL(opts.mime, opts.quality);
          },
          { source: `${RT_MAINTENANCE.DATA_IMAGE_PNG_BASE64}${image.toString(RT_MAINTENANCE.BASE64)}`, opts },
        );
      },
      async diff(a: Buffer, b: Buffer, size: readonly [number, number], canvasTag: string, context: string): Promise<number> {
        return page.evaluate(
          async ({ images, size, canvasTag, context }) => {
            const pixels = await Promise.all(
              images.map(async (source) => {
                const img = new Image();
                img.src = source;
                await img.decode();
                const canvas = document.createElement(canvasTag) as HTMLCanvasElement;
                canvas.width = size[0];
                canvas.height = size[1];
                const ctx = canvas.getContext(context) as CanvasRenderingContext2D;
                ctx.drawImage(img, 0, 0, size[0], size[1]);
                return ctx.getImageData(0, 0, size[0], size[1]).data;
              }),
            );
            let sum = 0;
            for (let i = 0; i < pixels[0].length; i += 4) sum += (Math.abs(pixels[0][i] - pixels[1][i]) + Math.abs(pixels[0][i + 1] - pixels[1][i + 1]) + Math.abs(pixels[0][i + 2] - pixels[1][i + 2])) / 3;
            return sum / (pixels[0].length / 4);
          },
          { images: [a, b].map((image) => `${RT_MAINTENANCE.DATA_IMAGE_PNG_BASE64}${image.toString(RT_MAINTENANCE.BASE64)}`), size, canvasTag, context },
        );
      },
      async marks(): Promise<MotionHtmlMark[]> {
        return page.evaluate(() => ((window as any).__motionLastMarks || []) as MotionHtmlMark[]);
      },
      async change(a: Buffer, b: Buffer, size: readonly [number, number], threshold: number, canvasTag: string, context: string): Promise<MotionHtmlChange> {
        return page.evaluate(
          async ({ images, size, threshold, canvasTag, context }) => {
            const pixels = await Promise.all(
              images.map(async (source) => {
                const img = new Image();
                img.src = source;
                await img.decode();
                const canvas = document.createElement(canvasTag) as HTMLCanvasElement;
                canvas.width = size[0];
                canvas.height = size[1];
                const ctx = canvas.getContext(context) as CanvasRenderingContext2D;
                ctx.drawImage(img, 0, 0, size[0], size[1]);
                return ctx.getImageData(0, 0, size[0], size[1]).data;
              }),
            );
            const cells: number[] = [];
            let sum = 0;
            for (let i = 0; i < pixels[0].length; i += 4) {
              const delta = (Math.abs(pixels[0][i] - pixels[1][i]) + Math.abs(pixels[0][i + 1] - pixels[1][i + 1]) + Math.abs(pixels[0][i + 2] - pixels[1][i + 2])) / 3;
              sum += delta;
              if (delta > threshold) cells.push(i / 4);
            }
            return { mean: sum / (pixels[0].length / 4), changed: cells.length / (pixels[0].length / 4), cells, width: size[0], height: size[1] };
          },
          { images: [a, b].map((image) => `${RT_MAINTENANCE.DATA_IMAGE_PNG_BASE64}${image.toString(RT_MAINTENANCE.BASE64)}`), size, threshold, canvasTag, context },
        );
      },
      async close() {
        signal?.removeEventListener(RT_MAINTENANCE.ABORT, stop);
        await (owned ? browser.close() : page.close()).catch(() => undefined);
      },
    };
  } catch (error) {
    signal?.removeEventListener(RT_MAINTENANCE.ABORT, stop);
    if (owned) await browser.close().catch(() => undefined);
    else await Promise.all(opened.map((open) => open.close().catch(() => undefined)));
    throw error;
  }
};
