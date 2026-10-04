import React from "react";
export { formatTimeHelper } from "../lib/timeUtils.js";
export const stopPropagation = (event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  event.stopPropagation();
};
