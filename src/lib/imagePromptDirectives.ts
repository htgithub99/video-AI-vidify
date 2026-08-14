import _ from "lodash";
import { BackgroundMode, ImageFocusMode, TextInImageMode } from "../types";
import { BACKGROUND_MODE_CONFIG, IMAGE_FOCUS_MODE_CONFIG, TEXT_IN_IMAGE_MODE_CONFIG } from "../constants/config";
import { REFACTOR_CONSTANTS } from "../constants/refactor";

const appendDirectiveBeforeAspectRatio = (prompt: string, directive: string): string => {
  if (_.isEmpty(directive)) return prompt;
  const aspectRatio = _.head(prompt.match(REFACTOR_CONSTANTS.AVG_AR_REGEX) || []);
  const promptWithoutAspectRatio = _.trim(_.replace(prompt, REFACTOR_CONSTANTS.AVG_AR_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING));
  const promptWithDirective = _.includes(_.toLower(promptWithoutAspectRatio), _.toLower(_.trim(directive)))
    ? promptWithoutAspectRatio
    : _.join(_.compact([promptWithoutAspectRatio, directive]), REFACTOR_CONSTANTS.AVG_BLANK);
  return _.join(_.compact([promptWithDirective, aspectRatio]), REFACTOR_CONSTANTS.AVG_BLANK);
};

export const resolveImageFocusDirective = (mode: ImageFocusMode, backgroundMode: BackgroundMode): string => {
  const constrainedDirective = _.some(IMAGE_FOCUS_MODE_CONFIG.BACKGROUND_CONSTRAINED_MODES, (modeValue) => _.isEqual(modeValue, backgroundMode))
    ? _.get(IMAGE_FOCUS_MODE_CONFIG.BACKGROUND_CONSTRAINED_DIRECTIVES, mode)
    : undefined;
  return _.defaultTo(constrainedDirective, IMAGE_FOCUS_MODE_CONFIG.DIRECTIVES[mode]);
};

export const applyBackgroundMode = (prompt: string, mode: BackgroundMode): string => (
  appendDirectiveBeforeAspectRatio(prompt, BACKGROUND_MODE_CONFIG.DIRECTIVES[mode])
);

export const applyTextInImageMode = (prompt: string, mode: TextInImageMode): string => (
  appendDirectiveBeforeAspectRatio(prompt, TEXT_IN_IMAGE_MODE_CONFIG.DIRECTIVES[mode])
);

export const applyImageFocusMode = (prompt: string, mode: ImageFocusMode, backgroundMode: BackgroundMode): string => (
  appendDirectiveBeforeAspectRatio(prompt, resolveImageFocusDirective(mode, backgroundMode))
);
