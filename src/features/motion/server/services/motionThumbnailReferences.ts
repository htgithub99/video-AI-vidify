import * as COMMON_RUNTIME from "../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../constants/runtime/values.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MOTION_THUMBNAIL as T } from "../../../../constants/motionThumbnail.js";
import { MOTION_VISUAL as V } from "../../../../constants/motionVisual.js";
import { normalizeMotionVector } from "../../../../lib/motionVectorAsset.js";
import { getMotionWorkDirectory } from "./motionLibraryService.js";
import { rasterizeMotionSvgs } from "./motionRenderService.js";
import type { MotionSeoOption, MotionStoryAnalysis, MotionStoryScript } from "../../../../types/motionVideo.js";
import type { MotionRemotionScene, MotionVisualSettings } from "../../../../types/motionVisual.js";
import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { motionSceneKitMatches } from "../../../../lib/motionVisual.js";
import { openMotionHtmlRuntime } from "./html/sceneRuntime.js";
export const motionThumbnailStyle = (_analysis: MotionStoryAnalysis, _script: MotionStoryScript | undefined, settings: MotionVisualSettings): string => V.PROFILES[settings.profileId].direction;
const words = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .normalize(COMMON_RUNTIME.SOURCE_TEXT_NFD)
      .replace(/\p{M}/gu, "")
      .replace(/đ/gu, COMMON_RUNTIME.SOURCE_TEXT_D)
      .match(/[\p{L}\p{N}]{3,}/gu) || [],
  );
export const rankMotionThumbnailScenes = <T extends { text: string }>(items: T[], title: string): T[] => {
  const target = words(title);
  return items
    .map((item, index) => ({ item, index, score: [...words(item.text)].filter((word) => target.has(word)).length }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
};
const htmlReady = (scene: MotionRemotionScene, settings: MotionVisualSettings): boolean =>
  !!scene.html && (scene.html.status === RT_MAINTENANCE.READY || scene.html.status === RT_MAINTENANCE.RENDERED) && motionSceneKitMatches(scene.html, settings) && !!(scene.html.thumbnail || scene.html.html || scene.html.file);
const htmlSource = (scene: MotionRemotionScene): string => scene.html?.html || (scene.html?.file && fs.existsSync(scene.html.file) ? fs.readFileSync(scene.html.file, RT_MAINTENANCE.UTF8) : "");
const renderHtmlReference = async (scene: MotionRemotionScene, signal: AbortSignal | undefined, open: typeof openMotionHtmlRuntime): Promise<string | undefined> => {
  const html = htmlSource(scene);
  if (!html) return scene.html?.thumbnail;
  const runtime = await open(html, signal);
  try {
    const frame = Math.round(T.REFERENCE_PROGRESS * T.REFERENCE_SECONDS * T.REFERENCE_FPS);
    const image = await runtime.render({ time: T.REFERENCE_PROGRESS * T.REFERENCE_SECONDS, progress: T.REFERENCE_PROGRESS, frame, fps: T.REFERENCE_FPS, duration: T.REFERENCE_SECONDS, width: scene.aspect === MR.MOTION_TEXT_9_16 ? T.OUTPUT_HEIGHT : T.OUTPUT_WIDTH, height: scene.aspect === MR.MOTION_TEXT_9_16 ? T.OUTPUT_WIDTH : T.OUTPUT_HEIGHT, mode: RT_MAINTENANCE.PREVIEW, motionEnabled: true, sceneEffectsEnabled: true, seed: scene.html?.seed || scene.id, speaking: [] } as Parameters<typeof runtime.render>[0]);
    return `${RT_MAINTENANCE.DATA_IMAGE_PNG_BASE64}${image.toString(RT_MAINTENANCE.BASE64)}`;
  } catch {
    return scene.html?.thumbnail;
  } finally {
    await runtime.close();
  }
};
const dependencies = { rasterizeMotionSvgs, openMotionHtmlRuntime };
export const prepareMotionThumbnailReferences = async (analysis: MotionStoryAnalysis, script: MotionStoryScript | undefined, settings: MotionVisualSettings, seo: MotionSeoOption | undefined, opts: { signal?: AbortSignal; log?: (line: string) => void }, overrides: Partial<typeof dependencies> = {}): Promise<string[]> => {
  if (!script?.gen) return [];
  const deps = { ...dependencies, ...overrides };
  const directory = getMotionWorkDirectory(randomUUID());
  const files: string[] = [];
  const title = seo?.title || analysis.title;
  try {
    opts.signal?.throwIfAborted();
    const state = script.gen.remotion;
    if (!state || state.settings.mode !== RUNTIME_VALUES.REMOTION_D1BD7A5B || state.settings.profileId !== settings.profileId) return [];
    const candidates = rankMotionThumbnailScenes(
      Object.values(state.scenes)
        .flat()
        .filter((scene) => (scene.composition && scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED) || htmlReady(scene, settings))
        .map((scene) => ({ scene, text: [scene.purpose, scene.text, ...(scene.nodes || []).map((node) => node.description)].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52) })),
      title,
    );
    const unique = [...new Map(candidates.map((entry) => [entry.scene.composition?.assetKey || entry.scene.html?.hash || entry.scene.id, entry])).values()].slice(0, T.REFERENCES);
    const encode = (file: string) => `${COMMON_RUNTIME.SOURCE_BROWSER_TEXT_DATA_IMAGE}${/\.jpe?g$/iu.test(file) ? COMMON_RUNTIME.SOURCE_TEXT_JPEG : /\.webp$/iu.test(file) ? COMMON_RUNTIME.SOURCE_TEXT_WEBP : COMMON_RUNTIME.SOURCE_TEXT_PNG}${COMMON_RUNTIME.SOURCE_TEXT_BASE64_2}${fs.readFileSync(file).toString(COMMON_RUNTIME.SOURCE_TEXT_BASE64)}`;
    const references: string[] = [];
    for (const [index, { scene }] of unique.entries()) {
      opts.signal?.throwIfAborted();
      if (!scene.composition && scene.html) {
        const image = await renderHtmlReference(scene, opts.signal, deps.openMotionHtmlRuntime);
        if (image) references.push(image);
        continue;
      }
      const asset = scene.composition ? state.assets[scene.composition.assetKey] : undefined;
      if (!asset?.svg) continue;
      const vector = normalizeMotionVector(asset.svg, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, true);
      const rendered = await deps.rasterizeMotionSvgs([{ svg: vector.svg, file: path.join(directory, `${RUNTIME_VALUES.SCENE_A3EAA842}${index}${COMMON_RUNTIME.SOURCE_TEXT_PNG_2}`), width: T.WIDTH, height: Math.max(1, Math.round((T.WIDTH * vector.height) / vector.width)) }]);
      files.push(...rendered);
      references.push(...rendered.map(encode));
    }
    opts.signal?.throwIfAborted();
    return references.slice(0, T.REFERENCES);
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    opts.log?.(T.LOG_REFERENCE_ERROR);
    return [];
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
};
