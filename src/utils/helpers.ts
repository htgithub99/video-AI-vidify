import React from 'react';
export { formatCleanDuration, formatCleanTime, formatTimeHelper } from '../lib/timeUtils.js';

export const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  e.stopPropagation();
};

export const preventDefault = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  e.preventDefault();
};
