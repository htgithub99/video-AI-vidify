import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { MOTION_THUMBNAIL as T } from "../../../../constants/motionThumbnail.js";
import { MOTION_AI_ROLE } from "../../../../constants/motionAiFallback.js";
import { MOTION_RESPONSE_SCHEMAS } from "../../../../constants/motionResponseContract.js";
import { motionResponseErrors, motionResponseRepair, withMotionResponsePrompt } from "../../../../lib/motionResponseContract.js";
import { motionVideoGenrePackaging } from "../../../../constants/motionGenre.js";
import { motionVisualSettingsFor } from "../../../../lib/motionVisual.js";
import { normalizeMotionVector } from "../../../../lib/motionVectorAsset.js";
import { resolveMotionSceneExecution } from "../../lib/motionSceneAi.js";
import { getDownloadedImageMimeType } from "../../../../server/utils/imageMedia.js";
import { readBase64ImageDimensions } from "../../../../server/utils/imageAspectRatio.js";
import { runMotionAi, motionAiRoutes, type MotionAiImage } from "./motionStoryService.js";
import { requestMotionAiContract, type MotionAiResponseContract } from "./motionAiContractService.js";
import { rasterizeMotionSvgs } from "./motionRenderService.js";
import { getMotionWorkDirectory } from "./motionLibraryService.js";
import { genPreviewDir } from "./puppet/genState.js";
import { motionThumbnailStyle, prepareMotionThumbnailReferences } from "./motionThumbnailReferences.js";
import type { MotionAiExecution, MotionSeoOption, MotionStoryAnalysis, MotionStoryScript } from "../../../../types/motionVideo.js";
import type { MotionVisualSettings } from "../../../../types/motionVisual.js";
const dependencies = { runMotionAi, rasterizeMotionSvgs, prepareMotionThumbnailReferences };
export const createMotionThumbnailService = (overrides: Partial<typeof dependencies> = {}) => {
  const deps = { ...dependencies, ...overrides };
  return async (analysis: MotionStoryAnalysis, seo: MotionSeoOption | undefined, opts: { language: string; aspect?: string; note?: string; script?: MotionStoryScript; visualSettings?: MotionVisualSettings; exec: MotionAiExecution; chromeHeadless?: boolean; signal?: AbortSignal; log?: (s: string) => void }): Promise<{ thumbnail: string; prompt: string }> => {
    opts.signal?.throwIfAborted();
    const portrait = opts.aspect === MR.MOTION_TEXT_9_16;
    const width = portrait ? T.OUTPUT_HEIGHT : T.OUTPUT_WIDTH;
    const height = portrait ? T.OUTPUT_WIDTH : T.OUTPUT_HEIGHT;
    const title = seo?.title || analysis.title;
    const settings = motionVisualSettingsFor({ visualSettings: opts.visualSettings, analysis, script: opts.script });
    const style = motionThumbnailStyle(analysis, opts.script, settings);
    const exec = { ...resolveMotionSceneExecution(opts.exec), role: MOTION_AI_ROLE.DRAW };
    const references = await deps.prepareMotionThumbnailReferences(analysis, opts.script, settings, seo, opts);
    opts.log?.(references.length ? T.LOG_REFERENCE(references.length) : T.LOG_PROFILE);
    const requestId = randomUUID();
    const directory = getMotionWorkDirectory(requestId);
    const images: MotionAiImage[] = [];
    try {
      for (const [index, reference] of references.entries()) {
        const match = reference.match(/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/u);
        if (!match) continue;
        const buffer = Buffer.from(match[2], "base64");
        if (!getDownloadedImageMimeType(buffer)) continue;
        const name = `${T.FILE_PREFIX}${requestId}-${index}.${match[1].split("/")[1]}`;
        const file = path.join(directory, name);
        await fs.promises.writeFile(file, buffer);
        images.push({ name, mimeType: match[1], path: file });
      }
      const brief = {
        requestId,
        videoTitle: title,
        logline: analysis.logline,
        language: opts.language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_ENGLISH : MR.MOTION_TEXT_VIETNAMESE,
        width,
        height,
        audience: analysis.videoDna?.audienceProfile,
        sceneStyle: style,
        visualSettings: settings,
        selectedSeo: seo ? { title: seo.title, description: seo.description.slice(0, 1200) } : undefined,
        cast: analysis.cast.map(({ key, name, look, appearanceOf }) => ({ key, name, look, appearanceOf })),
        accent: analysis.accent,
        keyMoments: analysis.chapters.slice(0, 6).map((chapter) => chapter.hook || chapter.title),
        genre: motionVideoGenrePackaging(analysis.videoGenre),
        userNote: opts.note || "",
      };
      const prompt = withMotionResponsePrompt(T.ARTIFACT, [T.DRAW_TASK, T.LAYOUT, T.REFERENCE_RULE, T.STYLE_RULE + style, stringifyJson(brief)].join("\n"));
      const contract: MotionAiResponseContract = {
        schema: MOTION_RESPONSE_SCHEMAS[T.ARTIFACT],
        attempts: T.DRAW_ATTEMPTS,
        routeAttempts: T.DRAW_ATTEMPTS,
        budget: T.DRAW_ATTEMPTS * motionAiRoutes(exec).length,
        assess: (raw) => {
          const errors = motionResponseErrors(raw, MOTION_RESPONSE_SCHEMAS[T.ARTIFACT]);
          if (errors.length) return { value: raw, errors };
          try {
            const vector = normalizeMotionVector(raw.svg, requestId, requestId, title, true);
            if (vector.width !== width || vector.height !== height) return { value: raw, errors: [T.VIEWBOX_ERROR] };
            return { value: vector, errors: [] };
          } catch (error) {
            return { value: raw, errors: [String((error as Error).message)] };
          }
        },
        repair: (question, draft, errors) => motionResponseRepair(question, { draft, errors }),
        failure: (errors) => new Error(MR.MOTION_TEMPLATE_CHUA_TAO_DUOC_THUMBNAIL(errors.join("; "))),
      };
      const vector = overrides.runMotionAi ? await requestMotionAiContract(prompt, exec, (question) => deps.runMotionAi(question, T.ARTIFACT, exec, opts.signal, opts.log, images), contract, opts.signal) : await deps.runMotionAi(prompt, T.ARTIFACT, exec, opts.signal, opts.log, images, 0, contract);
      opts.signal?.throwIfAborted();
      const file = genPreviewDir(`${T.FILE_PREFIX}${requestId}.png`);
      await fs.promises.writeFile(file.replace(/\.png$/u, ".svg"), vector.svg);
      opts.log?.(T.RENDER_LOG);
      for (let attempt = 0; attempt < T.RENDER_ATTEMPTS; attempt++) {
        opts.signal?.throwIfAborted();
        if (attempt) opts.log?.(T.RENDER_RETRY);
        await deps.rasterizeMotionSvgs([{ svg: vector.svg, file, width, height }]).catch((error) => {
          opts.signal?.throwIfAborted();
          opts.log?.(String((error as Error).message));
        });
        opts.signal?.throwIfAborted();
        const buffer = await fs.promises.readFile(file).catch(() => undefined);
        if (!buffer || buffer.length < T.PNG_HEADER_BYTES || getDownloadedImageMimeType(buffer) !== MR.MOTION_TEXT_IMAGE_PNG) continue;
        const base64 = buffer.toString("base64");
        const dimensions = readBase64ImageDimensions(base64);
        if (dimensions?.width !== width || dimensions.height !== height) continue;
        opts.log?.(MR.MOTION_TEXT_THUMBNAIL_XONG);
        return { thumbnail: MR.MOTION_TEMPLATE_DATA_BASE64(MR.MOTION_TEXT_IMAGE_PNG, base64), prompt };
      }
      throw new Error(T.RENDER_ERROR);
    } finally {
      await fs.promises.rm(directory, { recursive: true, force: true }).catch(() => opts.log?.(T.CLEANUP_WARNING));
    }
  };
};
export const generateMotionThumbnail = createMotionThumbnailService();
