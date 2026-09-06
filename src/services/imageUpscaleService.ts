import _ from "lodash";
import { IMAGE_UPSCALE_CONFIG } from "../constants";
import { QualityMode, SceneAssetStatus, StoryboardScene } from "../types";
import { appendAssetRevision } from "./dependencyHashService";
import { selectScenesForUpscale } from "./qualityProfileService";

const formatUpscaleMessage = (template: string, values: Record<string, string | number>): string =>
  _.reduce(values, (message, value, key) => message.replace(`{${key}}`, _.toString(value)), template);

interface ImageUpscaleResult {
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
    image.decoding = IMAGE_UPSCALE_CONFIG.IMAGE_DECODING;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(IMAGE_UPSCALE_CONFIG.SOURCE_LOAD_ERROR));
    image.src = assetUrl;
  });

export const calculateUpscaleDimensions = (width: number, height: number): { width: number; height: number; changed: boolean } => {
  if (!_.every([_.isFinite(width), _.isFinite(height), width > 0, height > 0])) return { width, height, changed: false };
  const scale = _.min([IMAGE_UPSCALE_CONFIG.SCALE, IMAGE_UPSCALE_CONFIG.MAX_WIDTH / width, IMAGE_UPSCALE_CONFIG.MAX_HEIGHT / height])!;
  if (scale < IMAGE_UPSCALE_CONFIG.MIN_SCALE_GAIN) return { width, height, changed: false };
  return { width: _.round(width * scale), height: _.round(height * scale), changed: true };
};

const upscaleImageAsset = async (assetUrl: string): Promise<ImageUpscaleResult> => {
  if (_.isEmpty(assetUrl)) throw new Error(IMAGE_UPSCALE_CONFIG.SOURCE_MISSING_ERROR);
  const image = await loadImage(assetUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const output = calculateUpscaleDimensions(sourceWidth, sourceHeight);
  if (!output.changed) return { assetUrl, changed: false, sourceWidth, sourceHeight, outputWidth: sourceWidth, outputHeight: sourceHeight };

  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext(IMAGE_UPSCALE_CONFIG.CANVAS_CONTEXT, { alpha: true });
  if (!context) throw new Error(IMAGE_UPSCALE_CONFIG.CANVAS_UNAVAILABLE_ERROR);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = IMAGE_UPSCALE_CONFIG.IMAGE_SMOOTHING_QUALITY;
  context.drawImage(image, 0, 0, output.width, output.height);
  const preserveAlpha = _.startsWith(_.toLower(assetUrl), IMAGE_UPSCALE_CONFIG.PNG_DATA_PREFIX);
  const mimeType = preserveAlpha ? IMAGE_UPSCALE_CONFIG.PNG_MIME_TYPE : IMAGE_UPSCALE_CONFIG.JPEG_MIME_TYPE;
  const upscaledAssetUrl = canvas.toDataURL(mimeType, preserveAlpha ? undefined : IMAGE_UPSCALE_CONFIG.JPEG_QUALITY);
  canvas.width = 1;
  canvas.height = 1;
  return { assetUrl: upscaledAssetUrl, changed: true, sourceWidth, sourceHeight, outputWidth: output.width, outputHeight: output.height };
};

export const upscaleApprovedSceneAssets = async ({
  scenes,
  validatedSceneIds,
  qualityMode,
  persistAsset,
  persistCheckpoint,
  onLog,
}: ApprovedSceneUpscaleOptions): Promise<number> => {
  const targets = selectScenesForUpscale(scenes, validatedSceneIds, qualityMode);
  if (_.isEmpty(targets)) return 0;
  onLog(formatUpscaleMessage(IMAGE_UPSCALE_CONFIG.START_LOG_TEMPLATE, { count: _.size(targets) }));
  let upscaledCount = 0;
  for (const targetGroup of _.chunk(targets, IMAGE_UPSCALE_CONFIG.BATCH_SIZE)) {
    await Promise.all(
      _.map(targetGroup, async (scene) => {
        try {
          const result = await upscaleImageAsset(scene.assetUrl!);
          if (!result.changed) return;
          const canonicalAssetUrl = await persistAsset(result.assetUrl);
          scene.assetUrl = canonicalAssetUrl;
          scene.assetUrls = [canonicalAssetUrl];
          const revision = appendAssetRevision(scene, canonicalAssetUrl, SceneAssetStatus.Approved);
          revision.operation = "upscale";
          upscaledCount = _.add(upscaledCount, 1);
          await persistCheckpoint();
        } catch (error) {
          onLog(
            formatUpscaleMessage(IMAGE_UPSCALE_CONFIG.SKIPPED_LOG_TEMPLATE, {
              sceneId: scene.id,
              reason: error instanceof Error ? error.message : IMAGE_UPSCALE_CONFIG.UNKNOWN_ERROR,
            }),
          );
        }
      }),
    );
  }
  onLog(
    formatUpscaleMessage(IMAGE_UPSCALE_CONFIG.COMPLETE_LOG_TEMPLATE, {
      changed: upscaledCount,
      total: _.size(targets),
    }),
  );
  return upscaledCount;
};
