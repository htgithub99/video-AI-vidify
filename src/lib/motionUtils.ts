import _ from "lodash";
import { MOTION_TEXT_MESSAGE } from "../constants/motionRuntime.js";
export const getMotionErrorMessage = (error: unknown, length?: number): string => { const message = _.toString(_.get(error, MOTION_TEXT_MESSAGE, error)); return length === undefined ? message : _.truncate(message, { length }); };
export const getMotionErrorSummary = (error: unknown): string => getMotionErrorMessage(error, 160);
export const normalizeMotionText = (value: unknown, length: number, omission?: string): string => _.truncate(_.trim(_.toString(value)), { length, ...(omission === undefined ? {} : { omission }) });
export const trimMotionText = (value: string, length = 1200): string => value.trim().slice(0, length);
