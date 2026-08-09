import fs from "node:fs";
import path from "node:path";
import _ from "lodash";
import {
  ASSETS_DIR_NAME,
  BASE64_DATA_URL_REGEX,
  CONTENT_TYPE_HEADER,
  CONTENT_TYPES,
  getBackendMsg,
  MimeType,
  REFACTOR_CONSTANTS,
  STYLE_EXTRACTION_CONFIG,
} from "../../constants/index.js";
import { getDataDirectory } from "../utils/paths.js";

export interface EncodedImageAsset {
  data: string;
  mimeType: string;
}

const getImageMimeType = (filePath: string): MimeType =>
  _.isEqual(_.toLower(path.extname(filePath)), ".png")
    ? MimeType.PNG
    : MimeType.JPEG;

const resolveContainedAssetPath = (
  assetUrl: string,
  rootDirectory: string,
): string | undefined => {
  const relativePath = _.trimStart(
    _.first(_.split(assetUrl, "?")) || assetUrl,
    "/\\",
  );
  const resolvedRoot = path.resolve(rootDirectory);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const normalizedRoot = _.toLower(
    _.join([resolvedRoot, path.sep], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
  );
  return _.every(
    [
      _.startsWith(_.toLower(resolvedPath), normalizedRoot),
      fs.existsSync(resolvedPath),
    ],
    Boolean,
  )
    ? resolvedPath
    : undefined;
};

export const readEncodedProjectImage = (
  assetUrl: string,
): EncodedImageAsset | undefined => {
  const dataUrlMatch = assetUrl.match(
    REFACTOR_CONSTANTS.IMAGE_DATA_URL_CAPTURE_REGEX,
  );
  if (dataUrlMatch) return { mimeType: dataUrlMatch[1], data: dataUrlMatch[2] };
  const assetPath = resolveContainedAssetPath(assetUrl, getDataDirectory());
  if (!assetPath) return undefined;
  return {
    mimeType: getImageMimeType(assetPath),
    data: fs
      .readFileSync(assetPath)
      .toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding),
  };
};

export const readStyleReferenceImage = async (
  imageSource: string,
): Promise<EncodedImageAsset> => {
  let data = imageSource;
  let mimeType: string = CONTENT_TYPES.JPEG;
  if (_.startsWith(imageSource, "data:")) {
    const match = imageSource.match(BASE64_DATA_URL_REGEX);
    if (match) {
      mimeType = match[1];
      data = match[2];
    }
  } else if (_.startsWith(imageSource, STYLE_EXTRACTION_CONFIG.ASSET_PREFIX)) {
    const assetRoot = path.resolve(getDataDirectory(), ASSETS_DIR_NAME);
    const assetPath = resolveContainedAssetPath(
      imageSource,
      getDataDirectory(),
    );
    if (
      !assetPath ||
      !_.startsWith(
        _.toLower(assetPath),
        _.toLower(
          _.join([assetRoot, path.sep], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
        ),
      )
    ) {
      throw new Error(getBackendMsg("IMAGES_REQUIRED", true));
    }
    data = fs
      .readFileSync(assetPath)
      .toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding);
    mimeType = _.get(
      STYLE_EXTRACTION_CONFIG.MIME_BY_EXTENSION,
      _.toLower(path.extname(assetPath)),
      CONTENT_TYPES.JPEG,
    );
  } else if (
    _.some(STYLE_EXTRACTION_CONFIG.HTTP_PREFIXES, (prefix) =>
      _.startsWith(imageSource, prefix),
    )
  ) {
    const response = await fetch(imageSource);
    if (!response.ok) throw new Error(getBackendMsg("IMAGES_REQUIRED", true));
    data = Buffer.from(await response.arrayBuffer()).toString(
      REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding,
    );
    mimeType = response.headers.get(CONTENT_TYPE_HEADER) || CONTENT_TYPES.JPEG;
  }
  return { data, mimeType };
};
