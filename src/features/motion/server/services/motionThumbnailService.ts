import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import { motionLanguage } from "../../../../lib/motionLanguage.js";
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
import { genPreviewDir } from "./motionGenState.js";
import { motionThumbnailStyle, prepareMotionThumbnailReferences } from "./motionThumbnailReferences.js";
import type { MotionAiExecution, MotionSeoOption, MotionStoryAnalysis, MotionStoryScript } from "../../../../types/motionVideo.js";
import { MOTION_RENAME as RENAME } from "../../../../constants/motionRename.js";
import { motionRenameLeaks, motionRenameMapActive } from "../../../../lib/motionRename.js";
import type { MotionVisualSettings } from "../../../../types/motionVisual.js";
import { motionHtmlDrawIssue, motionHtmlGraphics } from "../../../../lib/motionHtmlPrompt.js";
import { motionHtmlKitDoc, motionHtmlKitIssue, motionHtmlWithKit } from "../../../../lib/motionHtmlKit.js";
import { motionHtmlSource } from "../../../../lib/motionHtmlScene.js";
import { openMotionHtmlRuntime } from "./html/sceneRuntime.js";
const dependencies = { runMotionAi, rasterizeMotionSvgs, prepareMotionThumbnailReferences, openMotionHtmlRuntime };
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
        const buffer = Buffer.from(match[2], RT_MAINTENANCE.BASE64);
        if (!getDownloadedImageMimeType(buffer)) continue;
        const name = `${T.FILE_PREFIX}${requestId}${RT_MAINTENANCE.DASH}${index}${RT_MAINTENANCE.DOT}${match[1].split(RT_MAINTENANCE.SLASH)[1]}`;
        const file = path.join(directory, name);
        await fs.promises.writeFile(file, buffer);
        images.push({ name, mimeType: match[1], path: file });
      }
      const brief = {
        requestId,
        videoTitle: title,
        logline: analysis.logline,
        language: motionLanguage(opts.language).promptName,
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
        ...(motionRenameMapActive(analysis).length ? { renaming: RENAME.PROMPT.THUMBNAIL } : {}),
      };
      if (settings.figureKit === true) {
        opts.log?.(T.LOG_KIT);
        const htmlExec: MotionAiExecution = { ...exec, outputFormat: RT_MAINTENANCE.HTML, singleResponse: true };
        const base = [T.HTML_TASK(width, height), T.LAYOUT, T.REFERENCE_RULE, T.HTML_HEADLINE, T.STYLE_RULE + style, motionHtmlGraphics(settings.profileId, true), motionHtmlKitDoc(settings.profileId), stringifyJson(brief)].join(RT_MAINTENANCE.NEWLINE);
        let reason = "";
        for (let attempt = 1; attempt <= T.DRAW_ATTEMPTS; attempt++) {
          opts.signal?.throwIfAborted();
          const prompt = reason ? [base, T.HTML_RETRY(reason)].join(RT_MAINTENANCE.NEWLINE) : base;
          const source = motionHtmlSource(await deps.runMotionAi(prompt, T.HTML_ARTIFACT, htmlExec, opts.signal, opts.log, images));
          const issue = motionHtmlKitIssue(source) || motionHtmlDrawIssue(source);
          if (issue) {
            reason = issue;
            opts.log?.(T.LOG_KIT_RETRY(attempt, issue));
            continue;
          }
          const html = motionHtmlWithKit(source, settings.profileId);
          const file = genPreviewDir(`${T.FILE_PREFIX}${requestId}${RT_MAINTENANCE.PNG}`);
          await fs.promises.writeFile(file.replace(/\.png$/u, T.HTML_FILE_EXT), html);
          opts.log?.(T.RENDER_LOG);
          const runtime = await deps.openMotionHtmlRuntime(html, opts.signal);
          try {
            const buffer = await runtime.render({ time: 0, progress: 0, frame: 0, fps: T.REFERENCE_FPS, duration: T.REFERENCE_SECONDS, width, height, mode: RT_MAINTENANCE.PREVIEW, motionEnabled: false, sceneEffectsEnabled: true, seed: requestId, speaking: [] } as Parameters<typeof runtime.render>[0]);
            const base64 = buffer.toString(RT_MAINTENANCE.BASE64);
            const dimensions = readBase64ImageDimensions(base64);
            if (dimensions?.width === width && dimensions.height === height) {
              await fs.promises.writeFile(file, buffer);
              opts.log?.(MR.MOTION_TEXT_THUMBNAIL_XONG);
              return { thumbnail: MR.MOTION_TEMPLATE_DATA_BASE64(MR.MOTION_TEXT_IMAGE_PNG, base64), prompt };
            }
            reason = T.VIEWBOX_ERROR;
          } catch (error) {
            opts.signal?.throwIfAborted();
            reason = String((error as Error).message);
          } finally {
            await runtime.close();
          }
          opts.log?.(T.LOG_KIT_RETRY(attempt, reason));
        }
        throw new Error(T.HTML_ERROR(reason));
      }
      const prompt = withMotionResponsePrompt(T.ARTIFACT, [T.DRAW_TASK, T.LAYOUT, T.REFERENCE_RULE, T.STYLE_RULE + style, stringifyJson(brief)].join(RT_MAINTENANCE.NEWLINE));
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
        failure: (errors) => new Error(MR.MOTION_TEMPLATE_CHUA_TAO_DUOC_THUMBNAIL(errors.join(RT_MAINTENANCE.SEMICOLON_SPACE))),
      };
      const vector = overrides.runMotionAi ? await requestMotionAiContract(prompt, exec, (question) => deps.runMotionAi(question, T.ARTIFACT, exec, opts.signal, opts.log, images), contract, opts.signal) : await deps.runMotionAi(prompt, T.ARTIFACT, exec, opts.signal, opts.log, images, 0, contract);
      opts.signal?.throwIfAborted();
      const renameMap = motionRenameMapActive(analysis);
      if (renameMap.length) {
        const leaked = [...new Set([...vector.svg.matchAll(RENAME.SVG_TEXT)].flatMap((match) => motionRenameLeaks(match[1], renameMap)))];
        if (leaked.length) opts.log?.(RENAME.LOG.THUMBNAIL_LEAK(leaked));
      }
      const file = genPreviewDir(`${T.FILE_PREFIX}${requestId}${RT_MAINTENANCE.PNG}`);
      await fs.promises.writeFile(file.replace(/\.png$/u, RT_MAINTENANCE.SVG_3), vector.svg);
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
        const base64 = buffer.toString(RT_MAINTENANCE.BASE64);
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
