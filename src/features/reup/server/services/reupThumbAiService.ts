import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import _ from "lodash";
import { GEMINI_MEDIA_ERRORS } from "../../../../constants/config.js";
import { generateImageWithPlaywright, retainGlobalBrowser } from "../../../../server/services/imageGeneratorService.js";
import { getDownloadedImageMimeType } from "../../../../server/utils/imageMedia.js";
import { AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, PromptInputMethod } from "../../../../types.js";
import { REUP_DIR, REUP_THUMBS } from "../../constants/reupConfig.js";
import { REUP_PROMPT } from "../../constants/reupPrompts.js";
import { REUP_ERROR, REUP_LOG } from "../../constants/reupServerText.js";
import { reupThumbFallback } from "../../lib/reupThumbPlan.js";
import type { ReupJob, ReupThumbIdea } from "../../types/reup.js";
import { reupFfmpeg } from "./reupFfmpeg.js";
import { reupFileUrl, reupJobDir, reupRoot } from "./reupJobStore.js";
import { reupFrame } from "./reupMediaService.js";
type Log = (text: string, level?: "info" | "warn") => void;
const MIME_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const dataUrl = (file: string): string => `data:image/jpeg;base64,${fs.readFileSync(file).toString("base64")}`;
const styleFile = (url: string): string | undefined => {
  const name = decodeURIComponent(_.last(url.split("/")) || "");
  const file = path.join(reupRoot(), REUP_THUMBS.STYLE.DIR, name);
  return /^[a-f0-9]{40}\.jpg$/.test(name) && fs.existsSync(file) ? file : undefined;
};
export const reupSaveStyle = async (image: string): Promise<string> => {
  const match = REUP_THUMBS.STYLE.MIME.exec(image);
  if (!match) throw new Error(REUP_ERROR.STYLE_IMAGE);
  const buffer = Buffer.from(image.slice(match[0].length), "base64");
  if (!buffer.length || buffer.length > REUP_THUMBS.STYLE.BYTES || !getDownloadedImageMimeType(buffer)) throw new Error(REUP_ERROR.STYLE_IMAGE);
  const dir = path.join(reupRoot(), REUP_THUMBS.STYLE.DIR);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${createHash("sha1").update(buffer).digest("hex")}.jpg`);
  if (!fs.existsSync(file)) {
    const raw = `${file}.src`;
    fs.writeFileSync(raw, buffer);
    try {
      await reupFfmpeg(["-y", "-i", raw, "-frames:v", "1", "-vf", `scale='min(${REUP_THUMBS.STYLE.WIDTH},iw)':-2`, "-q:v", "3", file]);
    } finally {
      fs.rmSync(raw, { force: true });
    }
  }
  return reupFileUrl(file);
};
const seedOf = (text: string): number => [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const draw = async (job: ReupJob, idea: ReupThumbIdea, index: number, signal?: AbortSignal): Promise<{ image?: string; warning: string }> => {
  const styles = _.compact((job.settings.thumbStyles || []).map(styleFile));
  const style = styles.length ? styles[(index + seedOf(job.id) + (idea.image ? 1 : 0)) % styles.length] : undefined;
  const frames = await Promise.all(idea.ai!.refs.slice(0, REUP_THUMBS.AI.REFS - (style ? REUP_THUMBS.AI.STYLE_REFS : 0)).map((t) => reupFrame(job.id, job.source, t, 1280, signal, job.watermark)));
  const refs = style ? [...frames, style] : frames;
  const prompt = REUP_PROMPT.THUMB_IMAGE(idea.kind || "signature", idea.ai!.scene, idea.ai!.look, !!style);
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
