import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import fs from "node:fs";
import path from "node:path";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import { motionInputKey, writeMotionJsonAtomic } from "../motionFileUtils.js";
import type { MotionRemotionScene } from "../../../../../types/motionVisual.js";
export const motionHtmlStore = (scope: string | undefined, scene: string, key: string) => {
  const directory = path.join(getMotionRootDirectory(), RT_MAINTENANCE.HTML_SCENES, motionInputKey(scope || RT_MAINTENANCE.LOCAL), motionInputKey(scene), key);
  const manifest = path.join(directory, RT_MAINTENANCE.SCENE_JSON);
  return {
    read(): MotionRemotionScene | undefined {
      return fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, RT_MAINTENANCE.UTF8)) : undefined;
    },
    save(value: MotionRemotionScene) {
      fs.mkdirSync(directory, { recursive: true });
      writeMotionJsonAtomic(manifest, value);
    },
    raw(attempt: number, text: string) {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, `${RT_MAINTENANCE.ATTEMPT_2}${attempt}${RT_MAINTENANCE.TXT}`), text, RT_MAINTENANCE.UTF8);
    },
    html(attempt: number, text: string) {
      fs.mkdirSync(directory, { recursive: true });
      const file = path.join(directory, `${RT_MAINTENANCE.ATTEMPT_2}${attempt}${RT_MAINTENANCE.HTML_3}`);
      fs.writeFileSync(file, text, RT_MAINTENANCE.UTF8);
      return file;
    },
    manifest,
  };
};
