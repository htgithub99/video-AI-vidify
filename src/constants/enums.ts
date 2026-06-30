export enum THEME_MODES {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum PIPELINE_STEPS {
  SCRIPT = 1,
  STORYBOARD = 2,
  THUMBNAIL = 3,
  SEO = 4,
  EXPORT = 5,
}

export enum CAMERA_MOTIONS {
  STATIC = 'Static',
  ZOOM_IN = 'Zoom In',
  ZOOM_OUT = 'Zoom Out',
  PAN_LEFT = 'Pan Left',
  PAN_RIGHT = 'Pan Right',
  PAN_UP = 'Pan Up',
  PAN_DOWN = 'Pan Down',
}

export const MAX_RETRY_COUNT = 3;
export const DEFAULT_DEBOUNCE_MS = 300;
