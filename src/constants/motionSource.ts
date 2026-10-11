export const MOTION_SOURCE_TIMESTAMP_PATTERN = String.raw`\(\d{1,2}:\d{2}(?::\d{2})?\)`;
export const MOTION_SOURCE_SPLIT_DECIMAL_PATTERN = String.raw`(^|[^\d.,])(\d{1,2})\.[ \t]*\n[ \t]*(${MOTION_SOURCE_TIMESTAMP_PATTERN})[ \t]*(\d+)(?=[ \t]+[a-zà-ỹ])`;
