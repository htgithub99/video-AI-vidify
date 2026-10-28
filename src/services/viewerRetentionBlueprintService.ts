import {
  SOURCE_TEMPLATE_STORYBOARD_APPLICATION_ASSIGN_EACH_SCENE_ONE,
  SOURCE_TEMPLATE_VIEWER_RETENTION_PROMISE_CONTRACT_DEFINE_ONE,
  SOURCE_TEXT_COMPACT,
  SOURCE_TEXT_COMPACT_VIDEO_CADENCE_1_5_MINUTES,
  SOURCE_TEXT_LONGFORM,
  SOURCE_TEXT_LONG_FORM_CADENCE_OVER_15_MINUTES,
  SOURCE_TEXT_SHORT,
  SOURCE_TEXT_SHORT_FORM_CADENCE_UP_TO_60,
  SOURCE_TEXT_STANDARD,
  SOURCE_TEXT_STANDARD_VIDEO_CADENCE_5_15_MINUTES,
  SOURCE_TEXT_STORYTELLING,
} from "../constants/sourceText";
import _ from "lodash";
type RetentionFormat = "short" | "compact" | "standard" | "longform";
const resolveRetentionFormat = (durationSeconds: unknown): RetentionFormat => {
  const duration = _.toNumber(durationSeconds);
  if (!_.isFinite(duration) || duration <= 0) return SOURCE_TEXT_COMPACT;
  if (duration <= 60) return SOURCE_TEXT_SHORT;
  if (duration <= 300) return SOURCE_TEXT_COMPACT;
  if (duration <= 900) return SOURCE_TEXT_STANDARD;
  return SOURCE_TEXT_LONGFORM;
};
const FORMAT_CADENCE: Record<RetentionFormat, string> = { short: SOURCE_TEXT_SHORT_FORM_CADENCE_UP_TO_60, compact: SOURCE_TEXT_COMPACT_VIDEO_CADENCE_1_5_MINUTES, standard: SOURCE_TEXT_STANDARD_VIDEO_CADENCE_5_15_MINUTES, longform: SOURCE_TEXT_LONG_FORM_CADENCE_OVER_15_MINUTES };
export const createViewerRetentionDirective = (durationSeconds: unknown, genre: string = SOURCE_TEXT_STORYTELLING): string => {
  const format = resolveRetentionFormat(durationSeconds);
  return SOURCE_TEMPLATE_VIEWER_RETENTION_PROMISE_CONTRACT_DEFINE_ONE(`${format.toUpperCase()}`, `${genre || SOURCE_TEXT_STORYTELLING}`, `${FORMAT_CADENCE[format]}`);
};
export const createStoryboardRetentionDirective = (durationSeconds: unknown, genre: string = SOURCE_TEXT_STORYTELLING): string => SOURCE_TEMPLATE_STORYBOARD_APPLICATION_ASSIGN_EACH_SCENE_ONE(`${createViewerRetentionDirective(durationSeconds, genre)}`);
