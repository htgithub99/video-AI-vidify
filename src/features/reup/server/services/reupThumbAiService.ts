import fs from "fs";
import _ from "lodash";
import { GEMINI_MEDIA_ERRORS } from "../../../../constants/config.js";
import { generateImageWithPlaywright, retainGlobalBrowser } from "../../../../server/services/imageGeneratorService.js";
import { getDownloadedImageMimeType } from "../../../../server/utils/imageMedia.js";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, PromptInputMethod } from "../../../../types.js";
import { REUP_DIR, REUP_THUMBS } from "../../constants/reupConfig.js";
import { REUP_PROMPT } from "../../constants/reupPrompts.js";
import { REUP_LOG } from "../../constants/reupServerText.js";
import { reupThumbFallback } from "../../lib/reupThumbPlan.js";
import type { ReupJob, ReupThumbIdea } from "../../types/reup.js";
import { reupFileUrl, reupJobDir } from "./reupJobStore.js";
import { reupFrame } from "./reupMediaService.js";
type Log = (text: string, level?: "info" | "warn") => void;
const MIME_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const dataUrl = (file: string): string => `data:image/jpeg;base64,${fs.readFileSync(file).toString("base64")}`;
const draw = async (job: ReupJob, idea: ReupThumbIdea, index: number, signal?: AbortSignal): Promise<{ image?: string; warning: string }> => {
  const refs = await Promise.all(idea.ai!.refs.slice(0, REUP_THUMBS.AI.REFS).map((t) => reupFrame(job.id, job.source, t, 1280, signal, job.watermark)));
  const prompt = REUP_PROMPT.THUMB_IMAGE(idea.kind || "signature", idea.ai!.scene, idea.ai!.look);
  let warning = "";
  for (let attempt = 0; attempt < REUP_THUMBS.AI.ATTEMPTS; attempt++) {
    signal?.throwIfAborted();
    const result = await generateImageWithPlaywright({
      prompt,
      retainBrowserSession: true,
      forceNewPage: false,
      visualConfig: { chromeHeadless: job.settings.scriptAi.chromeHeadless, generateType: GenerateType.Image, skipGenerateTypeSelection: true, aspectRatio: AspectRatio.SixteenNine, generateCount: 1, imageGeneratorEngine: ImageGeneratorEngine.Imagen, generationMode: ImageGenerationMode.GeminiChat, promptInputMethod: PromptInputMethod.Paste, referenceImages: refs.map(dataUrl) },
    }).catch((error: unknown) => ({ success: false, base64: null, warning: String((error as Error)?.message || error) }));
    const encoded = _.toString(result.base64).replace(/^data:[^,]+,/, "");
    const buffer = result.success && encoded ? Buffer.from(encoded, "base64") : undefined;
    const mime = buffer && buffer.length >= REUP_THUMBS.AI.MIN_BYTES ? getDownloadedImageMimeType(buffer) : undefined;
    if (buffer && mime) {
      const file = reupJobDir(job.id, REUP_DIR.PACKAGE, `thumb_${index + 1}_${Date.now()}.${MIME_EXT[mime] || "png"}`);
      fs.writeFileSync(file, buffer);
      return { image: reupFileUrl(file), warning: "" };
    }
    warning = _.toString((result as { warning?: string }).warning) || REUP_LOG.THUMB_AI_EMPTY;
    if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(warning)) break;
  }
  return { warning };
};
export const reupClearAiThumbs = (job: ReupJob): void => (job.package?.thumbs || []).forEach((t) => removeImage(job, t.image));
const removeImage = (job: ReupJob, url?: string): void => {
  if (!url) return;
  const name = decodeURIComponent(_.last(url.split("/")) || "");
  if (/^thumb_\d+_\d+\.(png|jpg|webp)$/.test(name)) fs.rmSync(reupJobDir(job.id, REUP_DIR.PACKAGE, name), { force: true });
};
export const reupDrawAiThumb = async (job: ReupJob, index: number, log: Log, signal?: AbortSignal): Promise<boolean> => {
  const idea = job.package?.thumbs[index];
  if (!idea?.ai || !idea.kind) return false;
  log(REUP_LOG.THUMB_AI(index + 1, idea.kind));
  const done = await draw(job, idea, index, signal);
  if (done.image) {
    removeImage(job, idea.image);
    job.package!.thumbs[index] = { ...idea, layout: "ai", image: done.image };
    return true;
  }
  log(REUP_LOG.THUMB_AI_FAILED(index + 1, idea.kind, done.warning), "warn");
  if (!idea.image) job.package!.thumbs[index] = { ...idea, layout: reupThumbFallback(idea.kind), ...(idea.kind === "signature" ? { lines: [] } : {}) };
  return false;
};
export const reupDrawAiThumbs = async (job: ReupJob, log: Log, signal?: AbortSignal): Promise<void> => {
  const todo = (job.package?.thumbs || []).flatMap((t, i) => (t.ai ? [i] : []));
  if (!todo.length) return;
  const release = retainGlobalBrowser();
  try {
    let made = 0;
    for (const i of todo) if (await reupDrawAiThumb(job, i, log, signal)) made++;
    log(REUP_LOG.THUMB_AI_DONE(made, todo.length));
  } finally {
    release();
  }
};
