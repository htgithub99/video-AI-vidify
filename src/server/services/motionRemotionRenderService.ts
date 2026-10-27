import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import type { openBrowser, makeCancelSignal } from "@remotion/renderer";
import { MOTION_VISUAL as V } from "../../constants/motionVisual.js";
import { validateRemotionSpec } from "../../lib/motionRemotion.js";
import type { MotionRemotionSpec } from "../../types/motionVisual.js";
import { getStaticResourcePath, getTempDirectory } from "../utils/paths.js";
import { findNativeChrome } from "./nativeProxyBrowser.js";
import { motionRemotionWebpack } from "./remotion/bundleConfig.js";
import { checkRemotionCutoutLayers } from "./remotion/vectorCutoutInspector.js";
let cached: { key: string; promise: Promise<string> } | undefined;
export const motionRemotionSourceFingerprint = (entryPoints: string[]): string => {
  const sources = new Map<string, string>();
  const visit = (file: string) => {
    if (sources.has(file)) return;
    const source = fs.readFileSync(file, "utf8");
    sources.set(file, source);
    for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const imported = path.resolve(path.dirname(file), match[1]);
      const target = [imported, imported.replace(/\.js$/, ".ts"), imported.replace(/\.js$/, ".tsx"), `${imported}.ts`, `${imported}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (target) visit(target);
    }
  };
  entryPoints.forEach(visit);
  return createHash("sha256")
    .update(
      [...sources.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, source]) => `${path.relative(process.cwd(), file)}\n${source}`)
        .join("\n"),
    )
    .digest("hex");
};
export const motionRemotionBundle = async (): Promise<string> => {
  const entryPoint = path.join(process.cwd(), "src/remotion/Root.tsx");
  if (!fs.existsSync(entryPoint)) {
    const folders = [getStaticResourcePath(V.BUNDLE_FOLDER), path.join(process.cwd(), "dist", V.BUNDLE_FOLDER)];
    const built = folders.find((folder) => fs.existsSync(path.join(folder, "index.html")));
    if (!built) throw new Error(V.BUNDLE_MISSING);
    return built;
  }
  const key = motionRemotionSourceFingerprint([entryPoint, path.join(process.cwd(), "src/server/services/remotion/bundleConfig.ts"), path.join(process.cwd(), "package.json")]);
  if (cached?.key === key) return cached.promise;
  const outDir = path.join(getTempDirectory(), V.BUNDLE_FOLDER, key);
  const promise = fs.existsSync(path.join(outDir, "index.html")) ? Promise.resolve(outDir) : import("@remotion/bundler").then(({ bundle }) => bundle({ entryPoint, outDir, publicDir: null, enableCaching: true, webpackOverride: motionRemotionWebpack }));
  cached = { key, promise };
  try {
    return await promise;
  } catch (error) {
    if (cached?.key === key) cached = undefined;
    throw error;
  }
};
export const checkRemotionRuntime = async (signal?: AbortSignal): Promise<void> => {
  signal?.throwIfAborted();
  findNativeChrome();
  await motionRemotionBundle();
  signal?.throwIfAborted();
};
const withRemotionBrowser = async <T>(signal: AbortSignal | undefined, run: (browser: Awaited<ReturnType<typeof openBrowser>>, serveUrl: string, cancelSignal: ReturnType<typeof makeCancelSignal>["cancelSignal"]) => Promise<T>): Promise<T> => {
  signal?.throwIfAborted();
  const serveUrl = await motionRemotionBundle();
  signal?.throwIfAborted();
  const { makeCancelSignal, openBrowser } = await import("@remotion/renderer");
  const { cancel, cancelSignal } = makeCancelSignal();
  const abort = () => cancel();
  signal?.addEventListener("abort", abort, { once: true });
  let browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
  try {
    browser = await openBrowser("chrome", { browserExecutable: findNativeChrome(), chromiumOptions: { headless: true }, logLevel: "error" });
    signal?.throwIfAborted();
    return await run(browser, serveUrl, cancelSignal);
  } finally {
    signal?.removeEventListener("abort", abort);
    await browser?.close({ silent: true });
  }
};
export const renderRemotionVideo = async (spec: MotionRemotionSpec, output: string, options: { width: number; height: number; crf: number; signal: AbortSignal; onProgress: (frames: number, total: number) => void }): Promise<void> => {
  validateRemotionSpec(spec);
  await checkRemotionCutoutLayers(spec, options.signal);
  const { selectComposition, renderMedia } = await import("@remotion/renderer");
  await withRemotionBrowser(options.signal, async (browser, serveUrl, cancelSignal) => {
    const inputProps = { document: spec };
    const selected = await selectComposition({ serveUrl, id: V.COMPOSITION_ID, inputProps, puppeteerInstance: browser, logLevel: "error" });
    const total = Math.ceil(spec.duration * spec.fps);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await renderMedia({
      serveUrl,
      composition: { ...selected, width: options.width, height: options.height },
      inputProps,
      outputLocation: output,
      codec: "h264",
      muted: true,
      crf: options.crf,
      pixelFormat: "yuv420p",
      concurrency: Math.max(1, Math.min(2, Math.floor(os.freemem() / 1073741824), os.cpus().length)),
      puppeteerInstance: browser,
      cancelSignal,
      logLevel: "error",
      onProgress: ({ renderedFrames }) => options.onProgress(Math.min(total, renderedFrames), total),
    });
  });
};
let stillQueue: Promise<unknown> = Promise.resolve();
export const renderRemotionStill = (spec: MotionRemotionSpec, output: string, frame = 0, signal?: AbortSignal): Promise<void> => {
  const job = stillQueue
    .catch(() => undefined)
    .then(async () => {
      validateRemotionSpec(spec);
      await checkRemotionCutoutLayers(spec, signal);
      const { selectComposition, renderStill } = await import("@remotion/renderer");
      await withRemotionBrowser(signal, async (browser, serveUrl, cancelSignal) => {
        const inputProps = { document: spec };
        const selected = await selectComposition({ serveUrl, id: V.COMPOSITION_ID, inputProps, puppeteerInstance: browser, logLevel: "error" });
        fs.mkdirSync(path.dirname(output), { recursive: true });
        await renderStill({ serveUrl, composition: selected, inputProps, frame: Math.max(0, Math.min(Math.ceil(spec.duration * spec.fps) - 1, frame)), output, imageFormat: "png", scale: Math.min(1, 960 / selected.width), puppeteerInstance: browser, cancelSignal, logLevel: "error" });
      });
    });
  stillQueue = job.catch(() => undefined);
  return job;
};
