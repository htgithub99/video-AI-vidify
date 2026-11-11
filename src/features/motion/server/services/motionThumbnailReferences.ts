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
import type { MotionVisualSettings } from "../../../../types/motionVisual.js";
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
const dependencies = { rasterizeMotionSvgs };
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
        .filter((scene) => scene.composition && scene.build?.status !== COMMON_RUNTIME.SOURCE_TEXT_FAILED)
        .map((scene) => ({ scene, text: [scene.purpose, scene.text, ...scene.nodes.map((node) => node.description)].join(COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52) })),
      title,
    );
    const unique = [...new Map(candidates.map((entry) => [entry.scene.composition!.assetKey, entry])).values()].slice(0, T.REFERENCES);
    const jobs = unique.flatMap(({ scene }, index) => {
      const asset = state.assets[scene.composition!.assetKey];
      if (!asset?.svg) return [];
      const vector = normalizeMotionVector(asset.svg, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, RUNTIME_VALUES.THUMBNAIL_REFERENCE_65789A74, true);
      return [{ svg: vector.svg, file: path.join(directory, `${RUNTIME_VALUES.SCENE_A3EAA842}${index}${COMMON_RUNTIME.SOURCE_TEXT_PNG_2}`), width: T.WIDTH, height: Math.max(1, Math.round((T.WIDTH * vector.height) / vector.width)) }];
    });
    files.push(...(await deps.rasterizeMotionSvgs(jobs)));
    opts.signal?.throwIfAborted();
    return files.slice(0, T.REFERENCES).map((file) => `${COMMON_RUNTIME.SOURCE_BROWSER_TEXT_DATA_IMAGE}${/\.jpe?g$/iu.test(file) ? COMMON_RUNTIME.SOURCE_TEXT_JPEG : /\.webp$/iu.test(file) ? COMMON_RUNTIME.SOURCE_TEXT_WEBP : COMMON_RUNTIME.SOURCE_TEXT_PNG}${COMMON_RUNTIME.SOURCE_TEXT_BASE64_2}${fs.readFileSync(file).toString(COMMON_RUNTIME.SOURCE_TEXT_BASE64)}`);
  } catch (error) {
    if (opts.signal?.aborted) throw error;
    opts.log?.(T.LOG_REFERENCE_ERROR);
    return [];
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
};
