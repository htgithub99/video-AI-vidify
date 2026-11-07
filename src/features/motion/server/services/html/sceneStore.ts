import fs from "node:fs";
import path from "node:path";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { motionInputKey, writeMotionJsonAtomic } from "../motionFileUtils.js";
import type { MotionRemotionScene } from "../../../../../types/motionVisual.js";
export const motionHtmlStore = (scope: string | undefined, scene: string, key: string) => {
  const directory = path.join(getMotionRootDirectory(), "html-scenes", motionInputKey(scope || "local"), motionInputKey(scene), key);
  const manifest = path.join(directory, "scene.json");
  return {
    read(): MotionRemotionScene | undefined { return fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : undefined; },
    save(value: MotionRemotionScene) { fs.mkdirSync(directory, { recursive: true }); writeMotionJsonAtomic(manifest, value); },
    raw(attempt: number, text: string) { fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(path.join(directory, `attempt-${attempt}.txt`), text, "utf8"); },
    html(attempt: number, text: string) { fs.mkdirSync(directory, { recursive: true }); const file = path.join(directory, `attempt-${attempt}.html`); fs.writeFileSync(file, text, "utf8"); return file; },
    manifest,
  };
};
