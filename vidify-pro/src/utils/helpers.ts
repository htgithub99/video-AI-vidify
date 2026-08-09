import React from "react";

export const stopPropagation = (
  event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent,
) => {
  event.stopPropagation();
};
