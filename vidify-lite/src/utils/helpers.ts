import React from "react";
export { formatCleanDuration, formatCleanTime, formatTimeHelper } from "../lib/timeUtils.js";

export const stopPropagation = (event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  event.stopPropagation();
};

export const preventDefault = (event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  event.preventDefault();
};
