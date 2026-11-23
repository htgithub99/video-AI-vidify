import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import { motionLanguage } from "../../../../lib/motionLanguage.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { MOTION_THUMBNAIL as T, motionThumbConcept, motionThumbHeadline } from "../../../../constants/motionThumbnail.js";
import type { ThumbConcept } from "../../../../constants/thumbConcepts.js";
import { MOTION_AI_ROLE } from "../../../../constants/motionAiFallback.js";
import { motionVideoGenrePackaging } from "../../../../constants/motionGenre.js";
import { motionVisualSettingsFor } from "../../../../lib/motionVisual.js";
import { resolveMotionSceneExecution } from "../../lib/motionSceneAi.js";
import { getDownloadedImageMimeType } from "../../../../server/utils/imageMedia.js";
import { readBase64ImageDimensions } from "../../../../server/utils/imageAspectRatio.js";
import { runMotionAi, extractJson, type MotionAiImage } from "./motionStoryService.js";
import { motionSceneSpecFix, motionSceneSpecPage, motionSceneSpecPrompt, motionSceneSpecRead } from "../../../../lib/motionSceneSpec.js";
import { getMotionWorkDirectory } from "./motionLibraryService.js";
import { genPreviewDir } from "./motionGenState.js";
import { motionThumbnailStyle, prepareMotionThumbnailReferences } from "./motionThumbnailReferences.js";
import type { MotionAiExecution, MotionSeoOption, MotionStoryAnalysis, MotionStoryScript } from "../../../../types/motionVideo.js";
import { MOTION_RENAME as RENAME } from "../../../../constants/motionRename.js";
import { motionRenameMapActive } from "../../../../lib/motionRename.js";
import type { MotionVisualSettings } from "../../../../types/motionVisual.js";
import { MOTION_LAYOUT_WIDE } from "../../../../constants/motionLayouts/index.js";
import { motionHtmlFigures } from "../../../../lib/motionFigures.js";
import { motionProportionOf } from "../../../../lib/motionDrawStyle.js";
import { motionAnalysisEraYear } from "../../../../lib/motionEra.js";
import { openMotionHtmlRuntime } from "./html/sceneRuntime.js";
const toJpeg = async (source: string, target: string): Promise<string> => {
  await promisify(execFile)(getFfmpegPath(), ["-hide_banner", "-y", "-i", source, "-filter_complex", `color=white[bg];[0:v]scale='min(${T.JPEG_WIDTH},iw)':-2[fg];[bg][fg]scale2ref[base][top];[base][top]overlay=shortest=1,format=yuvj420p`, "-frames:v", "1", "-q:v", "3", target], { windowsHide: true });
  return target;
};
const dependencies = { toJpeg, runMotionAi, prepareMotionThumbnailReferences, openMotionHtmlRuntime };
export const createMotionThumbnailService = (overrides: Partial<typeof dependencies> = {}) => {
  const deps = { ...dependencies, ...overrides };
  return async (
    analysis: MotionStoryAnalysis,
    seo: MotionSeoOption | undefined,
    opts: { language: string; aspect?: string; note?: string; script?: MotionStoryScript; visualSettings?: MotionVisualSettings; concept?: ThumbConcept; exec: MotionAiExecution; chromeHeadless?: boolean; signal?: AbortSignal; log?: (s: string) => void },
  ): Promise<{ thumbnail: string; prompt: string; concept: ThumbConcept }> => {
    opts.signal?.throwIfAborted();
    const portrait = opts.aspect === MR.MOTION_TEXT_9_16;
    const width = portrait ? T.OUTPUT_HEIGHT : T.OUTPUT_WIDTH;
    const height = portrait ? T.OUTPUT_WIDTH : T.OUTPUT_HEIGHT;
    const title = seo?.title || analysis.title;
    const concept = opts.concept || motionThumbConcept(analysis.videoGenre);
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
        const jpeg = await deps.toJpeg(file, path.join(directory, `${T.REFERENCE_PREFIX}${requestId.slice(0, T.REFERENCE_ID)}${index + 1}${T.JPEG_EXT}`)).catch(() => undefined);
        images.push(jpeg ? { name: path.basename(jpeg), mimeType: T.JPEG_MIME, path: jpeg } : { name, mimeType: match[1], path: file });
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
      opts.log?.(T.LOG_SPEC);
      const render = { profile: settings.profileId, proportion: motionProportionOf(settings), layout: MOTION_LAYOUT_WIDE, year: motionAnalysisEraYear(analysis) };
      const specExec: MotionAiExecution = { ...exec, singleResponse: true };
      const base = [motionSceneSpecPrompt({}, { year: motionAnalysisEraYear(analysis), task: T.SPEC_TASK(width, height), frame: [width, height] }), T.LAYOUT(concept), T.REFERENCE_RULE, T.STYLE_RULE + style, T.SPEC_HEADLINE, stringifyJson(brief)].join(RT_MAINTENANCE.PARAGRAPH_SEPARATOR);
      let reason = "";
      for (let attempt = 1; attempt <= T.DRAW_ATTEMPTS; attempt++) {
        opts.signal?.throwIfAborted();
        const prompt = reason ? [base, T.SPEC_RETRY(reason)].join(RT_MAINTENANCE.NEWLINE) : base;
        let page = "";
        const answer = await deps.runMotionAi(prompt, T.HTML_ARTIFACT, specExec, opts.signal, opts.log, images);
        try {
          const spec = motionSceneSpecRead(typeof answer === "string" ? extractJson(answer) : answer, [width, height]);
          if (!spec.headline?.lines.length) throw new Error(T.HEADLINE_MISSING);
          motionSceneSpecFix(spec, { year: render.year });
          spec.headline = motionThumbHeadline(spec.headline, concept, [width, height]);
          page = motionSceneSpecPage(spec);
        } catch (error) {
          opts.signal?.throwIfAborted();
          reason = String((error as Error).message);
          opts.log?.(T.LOG_SPEC_RETRY(attempt, reason));
          continue;
        }
        const file = genPreviewDir(`${T.FILE_PREFIX}${requestId}${RT_MAINTENANCE.PNG}`);
        await fs.promises.writeFile(file.replace(/\.png$/u, T.HTML_FILE_EXT), motionHtmlFigures(page, render));
        for (let show = 1; show <= T.RENDER_TRIES; show++) {
          opts.log?.(T.RENDER_LOG);
          let runtime: Awaited<ReturnType<typeof deps.openMotionHtmlRuntime>> | undefined;
          try {
            runtime = await deps.openMotionHtmlRuntime(page, opts.signal, true, undefined, render);
            const buffer = await runtime.render({ time: 0, progress: 0.5, frame: 0, fps: T.REFERENCE_FPS, duration: T.REFERENCE_SECONDS, width, height, mode: RT_MAINTENANCE.PREVIEW, motionEnabled: false, sceneEffectsEnabled: true, seed: requestId, speaking: [] } as Parameters<typeof runtime.render>[0]);
            const base64 = buffer.toString(RT_MAINTENANCE.BASE64);
            const dimensions = readBase64ImageDimensions(base64);
            const blank = buffer.length / (width * height) < T.BLANK_BYTES_PER_PIXEL;
            if (dimensions?.width === width && dimensions.height === height && !blank) {
              await fs.promises.writeFile(file, buffer);
              opts.log?.(MR.MOTION_TEXT_THUMBNAIL_XONG);
              return { thumbnail: MR.MOTION_TEMPLATE_DATA_BASE64(MR.MOTION_TEXT_IMAGE_PNG, base64), prompt, concept };
            }
            reason = blank ? T.BLANK : T.VIEWBOX_ERROR;
            break;
          } catch (error) {
            opts.signal?.throwIfAborted();
            reason = String((error as Error).message);
          } finally {
            await runtime?.close();
          }
        }
        opts.log?.(T.LOG_SPEC_RETRY(attempt, reason));
      }
      throw new Error(T.SPEC_ERROR(reason));
    } finally {
      await fs.promises.rm(directory, { recursive: true, force: true }).catch(() => opts.log?.(T.CLEANUP_WARNING));
    }
  };
};
export const generateMotionThumbnail = createMotionThumbnailService();
