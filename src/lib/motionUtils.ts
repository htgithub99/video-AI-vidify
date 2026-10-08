import _ from "lodash";
import { MOTION_TEXT_MESSAGE } from "../constants/motionRuntime.js";
export const getMotionErrorMessage = (error: unknown, length?: number): string => {
  const message = _.toString(_.get(error, MOTION_TEXT_MESSAGE, error));
  return length === undefined ? message : _.truncate(message, { length });
};
