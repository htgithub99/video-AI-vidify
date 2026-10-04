import _ from "lodash";
import { BACKGROUND_MODE_CONFIG, THUMBNAIL_TEXT_MODE_CONFIG } from "../constants/config";
import { BackgroundMode, TextInImageMode, ThumbnailTextMode } from "../types";
export const SCENE_TEXT_MODE = TextInImageMode.NoText;
export const normalizeBackgroundMode = (value?: BackgroundMode): BackgroundMode => _.get(BACKGROUND_MODE_CONFIG.LEGACY_MODE_MAP, value || "", value || BackgroundMode.Contextual) as BackgroundMode;
export const normalizeThumbnailTextMode = (value?: ThumbnailTextMode | TextInImageMode): ThumbnailTextMode => _.get(THUMBNAIL_TEXT_MODE_CONFIG.LEGACY_MODE_MAP, value || "", value || ThumbnailTextMode.Headline) as ThumbnailTextMode;
