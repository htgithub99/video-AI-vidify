import _ from "lodash";
import { THUMBNAIL_OVERLAY_CONFIG } from "../constants/thumbnail";

const loadImage = (source: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = THUMBNAIL_OVERLAY_CONFIG.CROSS_ORIGIN;
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(THUMBNAIL_OVERLAY_CONFIG.LOAD_ERROR));
  image.src = source;
});

const fitFontSize = (
  context: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number,
): number => {
  const maximumSize = Math.round(canvasHeight * THUMBNAIL_OVERLAY_CONFIG.MAX_FONT_RATIO);
  const minimumSize = Math.round(canvasHeight * THUMBNAIL_OVERLAY_CONFIG.MIN_FONT_RATIO);
  const step = _.max([1, Math.round(canvasHeight * THUMBNAIL_OVERLAY_CONFIG.FONT_STEP_RATIO)]) || 1;
  const maximumWidth = canvasWidth * THUMBNAIL_OVERLAY_CONFIG.MAX_TEXT_WIDTH_RATIO;
  for (let size = maximumSize; size >= minimumSize; size -= step) {
    context.font = `${THUMBNAIL_OVERLAY_CONFIG.FONT_WEIGHT} ${size}px ${THUMBNAIL_OVERLAY_CONFIG.FONT_FAMILY}`;
    if (context.measureText(text).width <= maximumWidth) return size;
  }
  return minimumSize;
};

export const renderThumbnailTextOverlay = async (source: string, headline: string): Promise<string> => {
  if (_.isEmpty(source) || _.isEmpty(_.trim(headline))) return source;
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext(THUMBNAIL_OVERLAY_CONFIG.CANVAS_CONTEXT);
  if (!context) throw new Error(THUMBNAIL_OVERLAY_CONFIG.CONTEXT_ERROR);
  context.drawImage(image, 0, 0);
  const gradientStart = canvas.height * THUMBNAIL_OVERLAY_CONFIG.GRADIENT_START_RATIO;
  const gradient = context.createLinearGradient(0, gradientStart, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.5, `rgba(0,0,0,${THUMBNAIL_OVERLAY_CONFIG.GRADIENT_MIDDLE_ALPHA})`);
  gradient.addColorStop(1, `rgba(0,0,0,${THUMBNAIL_OVERLAY_CONFIG.GRADIENT_END_ALPHA})`);
  context.fillStyle = gradient;
  context.fillRect(0, gradientStart, canvas.width, canvas.height - gradientStart);
  const normalizedHeadline = _.toUpper(_.trim(headline));
  const fontSize = fitFontSize(context, normalizedHeadline, canvas.width, canvas.height);
  context.font = `${THUMBNAIL_OVERLAY_CONFIG.FONT_WEIGHT} ${fontSize}px ${THUMBNAIL_OVERLAY_CONFIG.FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillStyle = THUMBNAIL_OVERLAY_CONFIG.TEXT_COLOR;
  context.strokeStyle = THUMBNAIL_OVERLAY_CONFIG.OUTLINE_COLOR;
  context.lineJoin = "round";
  context.lineWidth = _.max([2, canvas.height * THUMBNAIL_OVERLAY_CONFIG.OUTLINE_RATIO]) || 2;
  context.shadowColor = THUMBNAIL_OVERLAY_CONFIG.SHADOW_COLOR;
  context.shadowBlur = canvas.height * THUMBNAIL_OVERLAY_CONFIG.SHADOW_BLUR_RATIO;
  const baseline = canvas.height * (1 - THUMBNAIL_OVERLAY_CONFIG.BOTTOM_MARGIN_RATIO);
  context.strokeText(normalizedHeadline, canvas.width / 2, baseline);
  context.fillText(normalizedHeadline, canvas.width / 2, baseline);
  return canvas.toDataURL(THUMBNAIL_OVERLAY_CONFIG.OUTPUT_MIME_TYPE);
};
