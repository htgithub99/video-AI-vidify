import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { chromium } from "playwright";
import { createHash, randomUUID } from "node:crypto";
import { findNativeChrome } from "../../../../../server/services/nativeProxyBrowser.js";
import { motionHtmlHostDocument } from "../../../../../lib/motionHtmlHost.js";
import type { MotionHtmlFrameInput } from "../../../../../types/motionHtmlScene.js";
const timedOutFrames = new Map<string, number>();
export const openMotionHtmlRuntime = async (html: string, signal?: AbortSignal, headless = true) => {
  signal?.throwIfAborted();
  const browser = await chromium.launch({ executablePath: findNativeChrome(), headless });
  const contentKey = createHash(RT_MAINTENANCE.SHA256).update(html).digest(RT_MAINTENANCE.HEX);
  const stop = () => {
    void browser.close().catch(() => undefined);
  };
  signal?.addEventListener(RT_MAINTENANCE.ABORT, stop, { once: true });
  try {
    const page = await browser.newPage();
    await page.route(RT_MAINTENANCE.ALL_REQUESTS_PATTERN, (route) => route.abort());
    await page.setContent(motionHtmlHostDocument(html, randomUUID()), { waitUntil: RT_MAINTENANCE.LOAD });
    return {
      async render(input: MotionHtmlFrameInput, subtitle = "", fontFamily: string = RT_MAINTENANCE.ARIAL): Promise<Buffer> {
        signal?.throwIfAborted();
        let watchdog: ReturnType<typeof setTimeout> | undefined;
        try {
          const operation = page.evaluate(
            async ({ payload: { value, text, font }, maintenanceTexts: RT_MAINTENANCE }) => {
              const result = (await Promise.race([(window as any).renderMotionFrame(value), new Promise((_, reject) => setTimeout(() => reject(new Error(RT_MAINTENANCE.CANVAS_RENDERAT_TIMED_OUT)), 30000))])) as string;
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
              payload: { value: input, text: subtitle, font: fontFamily },
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
      },
      async close() {
        signal?.removeEventListener(RT_MAINTENANCE.ABORT, stop);
        await browser.close().catch(() => undefined);
      },
    };
  } catch (error) {
    signal?.removeEventListener(RT_MAINTENANCE.ABORT, stop);
    await browser.close().catch(() => undefined);
    throw error;
  }
};
