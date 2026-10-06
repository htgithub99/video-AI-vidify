import { stringifyJson } from "../../lib/jsonStringify.js";
import fs from "fs";
import { MOTION_TEMPLATE_TMP, MOTION_TEXT_UTF8 } from "../../constants/motionRuntime.js";
export const writeMotionJsonAtomic = (file: string, data: unknown): void => {
  const temporaryPath = MOTION_TEMPLATE_TMP(`${file}`, `${process.pid}`);
  fs.writeFileSync(temporaryPath, stringifyJson(data, null, 1), MOTION_TEXT_UTF8);
  fs.renameSync(temporaryPath, file);
};
