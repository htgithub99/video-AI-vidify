import _ from "lodash";
import { QualityMode, SceneAssetStatus, StoryboardScene } from "../types";
import { appendAssetRevision } from "./dependencyHashService";
import { selectScenesForUpscale } from "./qualityProfileService";
export const IMAGE_UPSCALE_LIMITS = {
  SCALE: 2,
  MAX_WIDTH: 3840,
  MAX_HEIGHT: 3840,
  JPEG_QUALITY: 0.92,
  MIN_SCALE_GAIN: 1.05,
} as const;
export const IMAGE_UPSCALE_LOGS = {
  START: (count: number): string =>
    `[UPSCALE] Processing ${count} approved image assets.`,
  COMPLETE: (changed: number, total: number): string =>
    `[UPSCALE] Completed ${changed}/${total} image assets.`,
  SKIPPED: (sceneId: string, reason: string): string =>
    `[UPSCALE] Skipped ${sceneId}: ${reason}`,
  UNKNOWN_ERROR: "image_upscale_unknown_error",
} as const;
export interface ImageUpscaleResult {
  assetUrl: string;
  changed: boolean;
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
}
export interface ApprovedSceneUpscaleOptions {
  scenes: StoryboardScene[];
  validatedSceneIds: Set<string>;
  qualityMode?: QualityMode;
  persistAsset: (dataUrl: string) => Promise<string>;
  persistCheckpoint: () => Promise<void>;
  onLog: (message: string) => void;
}
const loadImage = (assetUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_upscale_source_load_failed"));
    image.src = assetUrl;
  });
export const calculateUpscaleDimensions = (
  width: number,
  height: number,
): { width: number; height: number; changed: boolean } => {
  if (!_.every([_.isFinite(width), _.isFinite(height), width > 0, height > 0]))
    return { width, height, changed: false };
  const scale = _.min([
    IMAGE_UPSCALE_LIMITS.SCALE,
    IMAGE_UPSCALE_LIMITS.MAX_WIDTH / width,
    IMAGE_UPSCALE_LIMITS.MAX_HEIGHT / height,
  ])!;
  if (scale < IMAGE_UPSCALE_LIMITS.MIN_SCALE_GAIN)
    return { width, height, changed: false };
  return {
    width: _.round(width * scale),
    height: _.round(height * scale),
    changed: true,
  };
};
export const upscaleImageAsset = async (
  assetUrl: string,
): Promise<ImageUpscaleResult> => {
  if (_.isEmpty(assetUrl)) throw new Error("image_upscale_source_missing");
  const image = await loadImage(assetUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const output = calculateUpscaleDimensions(sourceWidth, sourceHeight);
  if (!output.changed)
    return {
      assetUrl,
      changed: false,
      sourceWidth,
      sourceHeight,
      outputWidth: sourceWidth,
      outputHeight: sourceHeight,
    };
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("image_upscale_canvas_unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, output.width, output.height);
  const preserveAlpha = _.startsWith(_.toLower(assetUrl), "data:image/png");
  const mimeType = preserveAlpha ? "image/png" : "image/jpeg";
  const result = canvas.toDataURL(
    mimeType,
    preserveAlpha ? undefined : IMAGE_UPSCALE_LIMITS.JPEG_QUALITY,
  );
  canvas.width = 1;
  canvas.height = 1;
  return {
    assetUrl: result,
    changed: true,
    sourceWidth,
    sourceHeight,
    outputWidth: output.width,
    outputHeight: output.height,
  };
};
export const upscaleApprovedSceneAssets = async ({
  scenes,
  validatedSceneIds,
  qualityMode,
  persistAsset,
  persistCheckpoint,
  onLog,
}: ApprovedSceneUpscaleOptions): Promise<number> => {
  const targets = selectScenesForUpscale(
    scenes,
    validatedSceneIds,
    qualityMode,
  );
  if (_.isEmpty(targets)) return 0;
  onLog(IMAGE_UPSCALE_LOGS.START(_.size(targets)));
  let count = 0;
  for (const group of _.chunk(targets, 2)) {
    await Promise.all(
      _.map(group, async (scene) => {
        try {
          const result = await upscaleImageAsset(scene.assetUrl!);
          if (!result.changed) return;
          const url = await persistAsset(result.assetUrl);
          scene.assetUrl = url;
          scene.assetUrls = [url];
          const revision = appendAssetRevision(
            scene,
            url,
            SceneAssetStatus.Approved,
          );
          revision.operation = "upscale";
          count = _.add(count, 1);
          await persistCheckpoint();
        } catch (error) {
          onLog(
            IMAGE_UPSCALE_LOGS.SKIPPED(
              scene.id,
              error instanceof Error
                ? error.message
                : IMAGE_UPSCALE_LOGS.UNKNOWN_ERROR,
            ),
          );
        }
      }),
    );
  }
  onLog(IMAGE_UPSCALE_LOGS.COMPLETE(count, _.size(targets)));
  return count;
};
