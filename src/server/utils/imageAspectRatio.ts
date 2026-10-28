import { SOURCE_TEXT_89504E470D0A1A0A, SOURCE_TEXT_BASE64, SOURCE_TEXT_HEX, SOURCE_TEXT_SYMBOL_16, SOURCE_TEXT_SYMBOL_4 } from "../../constants/sourceText";
import _ from "lodash";
const IMAGE_DIMENSION_CONFIG = {
  PNG_SIGNATURE: SOURCE_TEXT_89504E470D0A1A0A,
  PNG_WIDTH_OFFSET: 16,
  PNG_HEIGHT_OFFSET: 20,
  JPEG_START_MARKER: 0xffd8,
  JPEG_MARKER_PREFIX: 0xff,
  JPEG_SCAN_START: 2,
  JPEG_SEGMENT_LENGTH_OFFSET: 2,
  JPEG_HEIGHT_OFFSET: 5,
  JPEG_WIDTH_OFFSET: 7,
  JPEG_START_OF_FRAME_MARKERS: new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]),
  MIN_SEGMENT_LENGTH: 2,
  ASPECT_SEPARATOR: SOURCE_TEXT_SYMBOL_16,
  MAX_RELATIVE_ERROR: 0.08,
} as const;
export interface ImageDimensions {
  width: number;
  height: number;
}
const readPngDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  if (!_.startsWith(buffer.toString(SOURCE_TEXT_HEX, 0, 8), IMAGE_DIMENSION_CONFIG.PNG_SIGNATURE)) return undefined;
  return { width: buffer.readUInt32BE(IMAGE_DIMENSION_CONFIG.PNG_WIDTH_OFFSET), height: buffer.readUInt32BE(IMAGE_DIMENSION_CONFIG.PNG_HEIGHT_OFFSET) };
};
const readJpegDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  if (buffer.length < IMAGE_DIMENSION_CONFIG.JPEG_WIDTH_OFFSET || buffer.readUInt16BE(0) !== IMAGE_DIMENSION_CONFIG.JPEG_START_MARKER) return undefined;
  let offset: number = IMAGE_DIMENSION_CONFIG.JPEG_SCAN_START;
  while (_.lt(offset, _.subtract(buffer.length, IMAGE_DIMENSION_CONFIG.JPEG_WIDTH_OFFSET))) {
    if (buffer[offset] !== IMAGE_DIMENSION_CONFIG.JPEG_MARKER_PREFIX) {
      offset = _.add(offset, 1);
      continue;
    }
    const marker = buffer[_.add(offset, 1)];
    if (IMAGE_DIMENSION_CONFIG.JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      return { height: buffer.readUInt16BE(_.add(offset, IMAGE_DIMENSION_CONFIG.JPEG_HEIGHT_OFFSET)), width: buffer.readUInt16BE(_.add(offset, IMAGE_DIMENSION_CONFIG.JPEG_WIDTH_OFFSET)) };
    }
    const lengthOffset = _.add(offset, IMAGE_DIMENSION_CONFIG.JPEG_SEGMENT_LENGTH_OFFSET);
    if (_.gte(lengthOffset, _.subtract(buffer.length, 1))) return undefined;
    const segmentLength = buffer.readUInt16BE(lengthOffset);
    if (_.lt(segmentLength, IMAGE_DIMENSION_CONFIG.MIN_SEGMENT_LENGTH)) return undefined;
    offset = _.add(offset, _.add(IMAGE_DIMENSION_CONFIG.JPEG_SEGMENT_LENGTH_OFFSET, segmentLength));
  }
  return undefined;
};
export const readBase64ImageDimensions = (base64: string): ImageDimensions | undefined => {
  const encoded = _.last(_.split(base64, SOURCE_TEXT_SYMBOL_4)) || "";
  const buffer = Buffer.from(encoded, SOURCE_TEXT_BASE64);
  return readPngDimensions(buffer) || readJpegDimensions(buffer);
};
export const isImageAspectRatioCompatible = (base64: string, aspectRatio?: string): boolean => {
  const dimensions = readBase64ImageDimensions(base64);
  const ratioParts = _.map(_.split(aspectRatio || "", IMAGE_DIMENSION_CONFIG.ASPECT_SEPARATOR), _.toNumber);
  if (!dimensions || _.size(ratioParts) !== 2 || _.some(ratioParts, (value) => !_.isFinite(value) || !_.gt(value, 0))) return true;
  const expectedRatio = _.divide(ratioParts[0], ratioParts[1]);
  const actualRatio = _.divide(dimensions.width, dimensions.height);
  return _.lte(_.divide(Math.abs(_.subtract(actualRatio, expectedRatio)), expectedRatio), IMAGE_DIMENSION_CONFIG.MAX_RELATIVE_ERROR);
};
