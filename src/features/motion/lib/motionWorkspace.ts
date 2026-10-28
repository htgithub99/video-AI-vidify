import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_TEXT_EN, MOTION_TEXT_VI } from "../../../constants/motionRuntime.js";
export const motionWorkspaceLanguage = (language: string): typeof MOTION_TEXT_EN | typeof MOTION_TEXT_VI => (language === MOTION_TEXT_EN ? MOTION_TEXT_EN : MOTION_TEXT_VI);
export const motionWorkspaceFileKey = (file: Pick<File, "name" | "size" | "lastModified">): string => stringifyJson([file.name, file.size, file.lastModified]);
export const mergeMotionWorkspaceFiles = (current: File[], incoming: File[], limit: number): File[] => {
  const files = new Map<string, File>();
  for (const file of [...current, ...incoming]) {
    const key = motionWorkspaceFileKey(file);
    if (!files.has(key)) files.set(key, file);
  }
  return Array.from(files.values()).slice(0, limit);
};
