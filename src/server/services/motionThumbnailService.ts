import * as MR from "../../constants/motionRuntime.js";
import _ from "lodash";
import { motionVideoGenrePackaging } from "../../constants/motionGenre.js";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, PromptInputMethod } from "../../types.js";
import type { MotionAiExecution, MotionSeoOption, MotionStoryAnalysis } from "../../types/motionVideo.js";
import { generateImageWithPlaywright } from "./imageGeneratorService.js";
import { runMotionAi } from "./motionStoryService.js";
import { MOTION_THUMBNAIL_SCHEMA } from "../../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponsePrompt, motionResponseRepair } from "../../lib/motionResponseContract.js";
const ARTIFACT = MR.MOTION_TEXT_MOTION_STORY_THUMBNAIL_PROMPT;
const IMAGE_ATTEMPTS = 3;
const MIN_IMAGE_CHARS = 10000;
const fallbackPrompt = (analysis: MotionStoryAnalysis, title: string, portrait: boolean): string => {
  const dna = analysis.videoDna;
  const v = dna?.visualDna;
  const drawn = dna?.settings.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_FLAT_2D_ILLUSTRATION_WITH_CLEAN_SHAPES : MR.MOTION_TEXT_CINEMATIC_3D_RENDER;
  return [
    MR.MOTION_TEMPLATE_A_STRIKING_YOUTUBE_THUMBNAIL_FOR_A_VIDEO_TITLED(portrait ? MR.MOTION_TEXT_9_16_VERTICAL : MR.MOTION_TEXT_16_9, title),
    MR.MOTION_TEMPLATE_SUBJECT(analysis.logline || analysis.title),
    MR.MOTION_TEMPLATE_STYLE(drawn, v ? MR.MOTION_TEMPLATE_PALETTE_LIGHTING_COMPOSITION(v.style, v.palette, v.lighting, v.composition) : MR.MOTION_TEMPLATE_LOOK_ACCENT_COLOUR(analysis.look, analysis.accent || MR.MOTION_TEXT_FFB070)),
    MR.MOTION_TEXT_ONE_CLEAR_FOCAL_SUBJECT_STRONG_CONTRAST_READABLE_AT_SMALL_SIZE_EM,
    MR.MOTION_TEMPLATE_LARGE_BOLD_TITLE_TEXT_ON_THE_IMAGE(_.truncate(title, { length: 32, omission: MR.MOTION_TEXT_EMPTY })),
    MR.MOTION_TEXT_NO_LOGOS_NO_WATERMARKS_NO_REAL_PEOPLE_S_FACES_NO_MISLEADING_IMAGE,
  ].join(MR.MOTION_TEXT_SYMBOL_13);
};
export const generateMotionThumbnail = async (analysis: MotionStoryAnalysis, seo: MotionSeoOption | undefined, opts: { language: string; aspect?: string; note?: string; exec: MotionAiExecution; chromeHeadless?: boolean; signal?: AbortSignal; log?: (s: string) => void }): Promise<{ thumbnail: string; prompt: string }> => {
  const portrait = opts.aspect === MR.MOTION_TEXT_9_16;
  const title = seo?.title || analysis.title;
  const dna = analysis.videoDna;
  const brief = {
    videoTitle: title,
    logline: analysis.logline,
    language: opts.language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_ENGLISH : MR.MOTION_TEXT_VIETNAMESE,
    audience: dna?.audienceProfile,
    format: dna?.format,
    tone: dna?.narrativeDna?.narrativeVoice || dna?.narrative?.voice,
    visualDna: dna?.visualDna,
    drawingMode: dna?.settings.drawingMode,
    look: analysis.look,
    accent: analysis.accent,
    keyMoments: _.take(
      _.map(analysis.chapters, (c) => c.hook || c.title),
      6,
    ),
    genre: motionVideoGenrePackaging(analysis.videoGenre) || undefined,
    userNote: opts.note || MR.MOTION_TEXT_EMPTY,
  };
  const ask = [MR.MOTION_TEMPLATE_ACT_AS_AN_EXPERIENCED_YOUTUBE_THUMBNAIL_ART_DIRECTOR_FOR_THE_AUDI(brief.language, JSON.stringify(brief), portrait ? MR.MOTION_TEXT_9_16_VERTICAL : MR.MOTION_TEXT_16_9, brief.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_FLAT_2D_ILLUSTRATION : MR.MOTION_TEXT_CINEMATIC_3D), motionResponsePrompt(ARTIFACT)].join(MR.MOTION_TEXT_SYMBOL_27);
  let prompt: string = MR.MOTION_TEXT_EMPTY;
  let diagnostics: unknown;
  for (let attempt = 0; attempt < 2 && !prompt; attempt++) {
    try {
      const raw = await runMotionAi(diagnostics ? motionResponseRepair(ask, diagnostics) : ask, ARTIFACT, opts.exec, opts.signal, opts.log);
      const issues = motionResponseIssues(raw, MOTION_THUMBNAIL_SCHEMA);
      if (!issues.length) prompt = raw.imagePrompt.trim();
      else diagnostics = issues;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      diagnostics = { error: _.truncate(_.toString((error as Error)?.message || error), { length: 240 }), issues: motionResponseIssues(undefined, MOTION_THUMBNAIL_SCHEMA) };
      opts.log?.(MR.MOTION_TEMPLATE_THUMBNAIL_LAP_PROMPT_LAN_LOI(attempt + 1, _.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
    }
  }
  if (!prompt) {
    prompt = fallbackPrompt(analysis, title, portrait);
    opts.log?.(MR.MOTION_TEXT_THUMBNAIL_DUNG_PROMPT_DUNG_TU_VIDEO_DNA);
  }
  let warning: string = MR.MOTION_TEXT_EMPTY;
  for (let attempt = 0; attempt < IMAGE_ATTEMPTS; attempt++) {
    opts.signal?.throwIfAborted();
    opts.log?.(MR.MOTION_TEMPLATE_THUMBNAIL_TAO_ANH_LAN(attempt + 1, IMAGE_ATTEMPTS));
    try {
      const result = await generateImageWithPlaywright({
        prompt,
        style: analysis.look || MR.MOTION_TEXT_EMPTY,
        retainBrowserSession: true,
        forceNewPage: true,
        visualConfig: { chromeHeadless: opts.chromeHeadless !== false, generateType: GenerateType.Image, aspectRatio: portrait ? AspectRatio.NineSixteen : AspectRatio.SixteenNine, generateCount: 1, imageGeneratorEngine: ImageGeneratorEngine.Imagen, generationMode: ImageGenerationMode.GeminiChat, promptInputMethod: PromptInputMethod.Paste, referenceImages: [], referenceImageNames: [] },
      } as any);
      const base64 = _.toString(result?.base64);
      if (result?.success && base64.length >= MIN_IMAGE_CHARS) {
        const mime = base64.startsWith(MR.MOTION_TEXT_9J) ? MR.MOTION_TEXT_IMAGE_JPEG : MR.MOTION_TEXT_IMAGE_PNG;
        opts.log?.(MR.MOTION_TEXT_THUMBNAIL_XONG);
        return { thumbnail: MR.MOTION_TEMPLATE_DATA_BASE64(mime, base64), prompt };
      }
      warning = result?.warning || MR.MOTION_TEXT_KHONG_NHAN_DUOC_ANH;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      warning = _.toString((error as Error)?.message || error);
    }
    opts.log?.(MR.MOTION_TEMPLATE_THUMBNAIL_LAN_LOI(attempt + 1, _.truncate(warning, { length: 160 })));
  }
  throw new Error(MR.MOTION_TEMPLATE_CHUA_TAO_DUOC_THUMBNAIL(_.truncate(warning, { length: 200 })));
};
