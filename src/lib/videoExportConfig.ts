import _ from "lodash";
import { VIDEO_EXPORT_CONSTANTS } from "../constants/videoExport";
import { ShortsReframeMode } from "../types/shorts";
import { VideoExportAspectRatio, VideoExportBitrate, VideoExportCodec, VideoExportConfig, VideoExportEffect, VideoExportFps, VideoExportResolution, VideoExportSlideMode, VideoExportTransition } from "../types/videoExport";
export const pickVideoExportEnum = <T extends string | number>(values: Record<string, T>, value: unknown, fallback: T): T => (_.includes(_.values(values), value) ? (value as T) : fallback);
export const resolveVideoExportConfig = (raw: Partial<Record<keyof VideoExportConfig, unknown>> | null | undefined, options: { coerceNumbers?: boolean; forceEvenSlides?: boolean } = {}): VideoExportConfig => {
  const value = raw ?? {};
  const pickNumber = (choices: readonly number[], requested: unknown, fallback: number): number => {
    const candidate = options.coerceNumbers ? _.toNumber(requested) : requested;
    return _.includes(choices, candidate) ? (candidate as number) : fallback;
  };
  return {
    aspectRatio: pickVideoExportEnum(VideoExportAspectRatio, value.aspectRatio, VIDEO_EXPORT_CONSTANTS.DEFAULT_ASPECT_RATIO),
    reframeMode: pickVideoExportEnum(ShortsReframeMode, value.reframeMode, VIDEO_EXPORT_CONSTANTS.DEFAULT_REFRAME_MODE),
    effect: pickVideoExportEnum(VideoExportEffect, value.effect, VIDEO_EXPORT_CONSTANTS.DEFAULT_EFFECT),
    transition: pickVideoExportEnum(VideoExportTransition, value.transition, VIDEO_EXPORT_CONSTANTS.DEFAULT_TRANSITION),
    slideMode: options.forceEvenSlides ? VideoExportSlideMode.EVEN : pickVideoExportEnum(VideoExportSlideMode, value.slideMode, VIDEO_EXPORT_CONSTANTS.DEFAULT_SLIDE_MODE),
    slideSeconds: pickNumber(VIDEO_EXPORT_CONSTANTS.SLIDE_SECONDS_OPTIONS, value.slideSeconds, VIDEO_EXPORT_CONSTANTS.DEFAULT_SLIDE_SECONDS),
    transitionSeconds: pickNumber(VIDEO_EXPORT_CONSTANTS.TRANSITION_SECONDS_OPTIONS, value.transitionSeconds, VIDEO_EXPORT_CONSTANTS.DEFAULT_TRANSITION_SECONDS),
    resolution: pickVideoExportEnum(VideoExportResolution, value.resolution, VIDEO_EXPORT_CONSTANTS.DEFAULT_RESOLUTION),
    fps: pickNumber([VideoExportFps.FPS_24, VideoExportFps.FPS_30, VideoExportFps.FPS_60], value.fps, VIDEO_EXPORT_CONSTANTS.DEFAULT_FPS),
    bitrate: pickVideoExportEnum(VideoExportBitrate, value.bitrate, VIDEO_EXPORT_CONSTANTS.DEFAULT_BITRATE),
    codec: pickVideoExportEnum(VideoExportCodec, value.codec, VIDEO_EXPORT_CONSTANTS.DEFAULT_CODEC),
  };
};
