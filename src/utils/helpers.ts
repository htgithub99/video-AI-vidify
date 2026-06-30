import React from 'react';

export const formatCleanDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}`;
};

export const formatCleanTime = (time: number): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  e.stopPropagation();
};

export const preventDefault = (e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent) => {
  e.preventDefault();
};
