import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { chromium, type Browser, type Page } from "playwright";
import { createHash, randomUUID } from "node:crypto";
import { findNativeChrome } from "../../../../../server/services/nativeProxyBrowser.js";
import { motionHtmlHostDocument } from "../../../../../lib/motionHtmlHost.js";
import type { MotionHtmlFrameInput } from "../../../../../types/motionHtmlScene.js";
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
export const openMotionHtmlRuntime = async (html: string, signal?: AbortSignal, headless = true, shared?: Browser) => {
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
      await next.setContent(motionHtmlHostDocument(html, randomUUID()), { waitUntil: RT_MAINTENANCE.LOAD });
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
          const operation = page.evaluate(
            async ({ payload: { value, text, font, allowBlank }, maintenanceTexts: RT_MAINTENANCE }) => {
              const result = (await Promise.race([(window as any).renderMotionFrame(value, allowBlank), new Promise((_, reject) => setTimeout(() => reject(new Error(RT_MAINTENANCE.CANVAS_RENDERAT_TIMED_OUT)), 30000))])) as string;
              if (!text) return result;
              const image = new Image();
              image.src = result;
              await image.decode();
              const canvas = document.createElement(RT_MAINTENANCE.CANVAS);
              canvas.width = value.width;
              canvas.height = value.height;
              const ctx = canvas.getContext(RT_MAINTENANCE.VALUE_2D)!;
              ctx.drawImage(image, 0, 0);
              const size = Math.max(20, value.height * 0.04);
              ctx.font = `${RT_MAINTENANCE.BOLD}${size}${RT_MAINTENANCE.PX}${font}`;
              ctx.textAlign = RT_MAINTENANCE.CENTER;
              ctx.textBaseline = RT_MAINTENANCE.BOTTOM;
              const lines: string[] = [];
              let line = "";
              for (const word of text.split(/\s+/)) {
                const next = line ? `${line}${RT_MAINTENANCE.SPACE}${word}` : word;
                if (line && ctx.measureText(next).width > value.width * 0.86) {
                  lines.push(line);
                  line = word;
                } else line = next;
              }
              if (line) lines.push(line);
              ctx.fillStyle = RT_MAINTENANCE.WHITE;
              ctx.strokeStyle = RT_MAINTENANCE.BLACK;
              ctx.lineWidth = 3;
              ctx.lineJoin = RT_MAINTENANCE.ROUND;
              lines.forEach((entry, index) => {
                const y = value.height * 0.96 - (lines.length - index - 1) * size * 1.25;
                ctx.strokeText(entry, value.width / 2, y);
                ctx.fillText(entry, value.width / 2, y);
              });
              return canvas.toDataURL(RT_MAINTENANCE.IMAGE_PNG);
            },
            {
              payload: { value: input, text: subtitle, font: fontFamily, allowBlank },
              maintenanceTexts: {
                CANVAS_RENDERAT_TIMED_OUT: RT_MAINTENANCE.CANVAS_RENDERAT_TIMED_OUT,
                CANVAS: RT_MAINTENANCE.CANVAS,
                VALUE_2D: RT_MAINTENANCE.VALUE_2D,
                BOLD: RT_MAINTENANCE.BOLD,
                PX: RT_MAINTENANCE.PX,
                CENTER: RT_MAINTENANCE.CENTER,
                BOTTOM: RT_MAINTENANCE.BOTTOM,
                SPACE: RT_MAINTENANCE.SPACE,
                WHITE: RT_MAINTENANCE.WHITE,
                BLACK: RT_MAINTENANCE.BLACK,
                ROUND: RT_MAINTENANCE.ROUND,
                IMAGE_PNG: RT_MAINTENANCE.IMAGE_PNG,
              },
            },
          );
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
            if (count < 2) throw error;
          }
          if (!page.isClosed() && !/browser.*closed|target.*closed|crash|Connection closed/i.test(reason)) throw Object.assign(new Error(reason), { motionHtmlExecution: true });
          throw error;
        } finally {
          clearTimeout(watchdog);
        }
    };
    return {
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
