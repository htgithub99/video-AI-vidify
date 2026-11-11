import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, RT_MAINTENANCE.REGEXP_ESCAPE_REPLACEMENT);
