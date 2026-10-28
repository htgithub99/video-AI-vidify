import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
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
    const source = fs.readFileSync(file, RT_SERVER.UTF8);
    sources.set(file, source);
    for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const imported = path.resolve(path.dirname(file), match[1]);
      const target = ([imported, imported.replace(/\.js$/, RT_SERVER.TS), imported.replace(/\.js$/, RT_SERVER.TSX), `${imported}${RT_SERVER.TS}`, `${imported}${RT_SERVER.TSX}`] as string[]).find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (target) visit(target);
    }
  };
  entryPoints.forEach(visit);
  return createHash(RT_SERVER.SHA256)
    .update(
      [...sources.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, source]) => `${path.relative(process.cwd(), file)}${RT_SHARED.SYMBOL_01BA47}${source}`)
        .join(RT_SHARED.SYMBOL_01BA47),
    )
    .digest(RT_SERVER.HEX);
};
export const motionRemotionBundle = async (): Promise<string> => {
  const entryPoint = path.join(process.cwd(), RT_SERVER.SRC_FEATURES_MOTION_REMOTION_ROOT_TSX);
  if (!fs.existsSync(entryPoint)) {
    const folders = [getStaticResourcePath(V.BUNDLE_FOLDER), path.join(process.cwd(), RT_SERVER.DIST, V.BUNDLE_FOLDER)] as string[];
    const built = folders.find((folder) => fs.existsSync(path.join(folder, RT_SERVER.INDEX_HTML)));
    if (!built) throw new Error(V.BUNDLE_MISSING);
    return built;
  }
  const key = motionRemotionSourceFingerprint([entryPoint, path.join(process.cwd(), RT_SERVER.SRC_SERVER_SERVICES_REMOTION_BUNDLECONFIG_TS), path.join(process.cwd(), RT_SERVER.PACKAGE_JSON)] as string[]);
  if (cached?.key === key) return cached.promise;
  const outDir = path.join(getTempDirectory(), V.BUNDLE_FOLDER, key);
  const publicDir = path.join(getTempDirectory(), V.BUNDLE_FOLDER, V.BUNDLE_PUBLIC_FOLDER);
  fs.mkdirSync(publicDir, { recursive: true });
  const promise = fs.existsSync(path.join(outDir, RT_SERVER.INDEX_HTML)) ? Promise.resolve(outDir) : import("@remotion/bundler").then(({ bundle }) => bundle({ entryPoint, outDir, publicDir, enableCaching: true, webpackOverride: motionRemotionWebpack }));
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
  signal?.addEventListener(RT_SHARED.ABORT, abort, { once: true });
  let browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
  try {
    browser = await openBrowser(RT_SERVER.CHROME, { browserExecutable: findNativeChrome(), chromiumOptions: { headless: true }, logLevel: RT_SHARED.ERROR });
    signal?.throwIfAborted();
    return await run(browser, serveUrl, cancelSignal);
  } finally {
    signal?.removeEventListener(RT_SHARED.ABORT, abort);
    await browser?.close({ silent: true });
  }
};
export const renderRemotionVideo = async (spec: MotionRemotionSpec, output: string, options: { width: number; height: number; crf: number; signal: AbortSignal; onProgress: (frames: number, total: number) => void }): Promise<void> => {
  validateRemotionSpec(spec);
  await checkRemotionCutoutLayers(spec, options.signal);
  const { selectComposition, renderMedia } = await import("@remotion/renderer");
  await withRemotionBrowser(options.signal, async (browser, serveUrl, cancelSignal) => {
    const inputProps = { document: spec };
    const selected = await selectComposition({ serveUrl, id: V.COMPOSITION_ID, inputProps, puppeteerInstance: browser, logLevel: RT_SHARED.ERROR });
    const total = Math.ceil(spec.duration * spec.fps);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    await renderMedia({
      serveUrl,
      composition: { ...selected, width: options.width, height: options.height },
      inputProps,
      outputLocation: output,
      codec: RT_SERVER.H264,
      muted: true,
      crf: options.crf,
      pixelFormat: RT_SERVER.YUV420P,
      concurrency: Math.max(1, Math.min(2, Math.floor(os.freemem() / 1073741824), os.cpus().length)),
      puppeteerInstance: browser,
      cancelSignal,
      logLevel: RT_SHARED.ERROR,
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
        const selected = await selectComposition({ serveUrl, id: V.COMPOSITION_ID, inputProps, puppeteerInstance: browser, logLevel: RT_SHARED.ERROR });
        fs.mkdirSync(path.dirname(output), { recursive: true });
        await renderStill({ serveUrl, composition: selected, inputProps, frame: Math.max(0, Math.min(Math.ceil(spec.duration * spec.fps) - 1, frame)), output, imageFormat: RT_SERVER.PNG, scale: Math.min(1, 960 / selected.width), puppeteerInstance: browser, cancelSignal, logLevel: RT_SHARED.ERROR });
      });
    });
  stillQueue = job.catch(() => undefined);
  return job;
};
