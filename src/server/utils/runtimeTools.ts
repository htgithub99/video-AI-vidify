import * as RT_MAINTENANCE from "../../constants/runtime/maintenance.js";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_MEDIA_TOOLS as T } from "../../constants/runtimeTools.js";
export const configureRuntimeTools = (root = process.cwd(), env: NodeJS.ProcessEnv = process.env): void => {
  const directory = path.join(root, ...T.DIRECTORY);
  if (!T.BINARIES.some((name) => fs.existsSync(path.join(directory, name)))) return;
  const key = Object.keys(env).find((name) => name.toLowerCase() === RT_MAINTENANCE.PATH) || RT_MAINTENANCE.PATH_2;
  const paths = (env[key] || "").split(path.delimiter).filter(Boolean);
  if (!paths.some((value) => path.resolve(value).toLowerCase() === directory.toLowerCase())) env[key] = [directory, ...paths].join(path.delimiter);
};
