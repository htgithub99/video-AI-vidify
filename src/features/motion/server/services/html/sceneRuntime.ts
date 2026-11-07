import { chromium } from "playwright";
import { createHash, randomUUID } from "node:crypto";
import { findNativeChrome } from "../../../../../server/services/nativeProxyBrowser.js";
import { motionHtmlHostDocument } from "../../../../../lib/motionHtmlHost.js";
import type { MotionHtmlFrameInput } from "../../../../../types/motionHtmlScene.js";
const timedOutFrames = new Map<string, number>();
export const openMotionHtmlRuntime = async (html: string, signal?: AbortSignal, headless = true) => {
  signal?.throwIfAborted();
  const browser = await chromium.launch({ executablePath: findNativeChrome(), headless });
  const contentKey = createHash("sha256").update(html).digest("hex");
  const stop = () => { void browser.close().catch(() => undefined); };
  signal?.addEventListener("abort", stop, { once: true });
  try {
    const page = await browser.newPage();
    await page.route("**/*", (route) => route.abort());
    await page.setContent(motionHtmlHostDocument(html, randomUUID()), { waitUntil: "load" });
    return {
      async render(input: MotionHtmlFrameInput, subtitle = "", fontFamily = "Arial"): Promise<Buffer> {
        signal?.throwIfAborted();
        let watchdog: ReturnType<typeof setTimeout> | undefined;
        try {
          const operation = page.evaluate(async ({ value, text, font }) => {
            const result = await Promise.race([(window as any).renderMotionFrame(value), new Promise((_, reject) => setTimeout(() => reject(new Error("Canvas renderAt timed out")), 30000))]) as string;
            if (!text) return result;
            const image = new Image(); image.src = result; await image.decode();
            const canvas = document.createElement("canvas"); canvas.width = value.width; canvas.height = value.height;
            const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0);
            const size = Math.max(20, value.height * .04); ctx.font = `bold ${size}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
            const lines: string[] = []; let line = "";
            for (const word of text.split(/\s+/)) { const next = line ? `${line} ${word}` : word; if (line && ctx.measureText(next).width > value.width * .86) { lines.push(line); line = word; } else line = next; }
            if (line) lines.push(line);
            ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 3; ctx.lineJoin = "round";
            lines.forEach((entry, index) => { const y = value.height * .96 - (lines.length - index - 1) * size * 1.25; ctx.strokeText(entry, value.width / 2, y); ctx.fillText(entry, value.width / 2, y); });
            return canvas.toDataURL("image/png");
          }, { value: input, text: subtitle, font: fontFamily });
          const image = await Promise.race([operation, new Promise<never>((_, reject) => { watchdog = setTimeout(() => reject(new Error("Canvas renderAt timed out")), 35000); })]) as string;
          return Buffer.from(image.split(",")[1], "base64");
        } catch (error) {
          signal?.throwIfAborted();
          const reason = String((error as Error).message);
          if (/Canvas renderAt timed out/.test(reason)) {
            const key = `${contentKey}:${input.frame}:${input.width}:${input.height}`;
            const count = (timedOutFrames.get(key) || 0) + 1;
            timedOutFrames.set(key, count);
            if (timedOutFrames.size > 512) timedOutFrames.delete(timedOutFrames.keys().next().value!);
            if (count < 2) throw error;
          }
          if (!page.isClosed() && !/browser.*closed|target.*closed|crash|Connection closed/i.test(reason)) throw Object.assign(new Error(reason), { motionHtmlExecution: true });
          throw error;
        } finally { clearTimeout(watchdog); }
      },
      async close() { signal?.removeEventListener("abort", stop); await browser.close().catch(() => undefined); },
    };
  } catch (error) {
    signal?.removeEventListener("abort", stop);
    await browser.close().catch(() => undefined);
    throw error;
  }
};
