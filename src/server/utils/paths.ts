import fs from "fs";
import _ from "lodash";
import path from "path";
import { SOURCE_TEXT_APP_DATA_DIR, SOURCE_TEXT_DATA_2, SOURCE_TEXT_ELECTRON_RUNNING, SOURCE_TEXT_PYTHON, SOURCE_TEXT_PYTHON3, SOURCE_TEXT_PYTHON_EXE, SOURCE_TEXT_PYTHON_RUNTIME, SOURCE_TEXT_PYTHON_SCRIPTS, SOURCE_TEXT_WIN32 } from "../../constants/sourceText";
import { STORAGE_CONFIG } from "../../constants/storage.js";
const CONFIG_KEYS = { APP_DATA_DIR: SOURCE_TEXT_APP_DATA_DIR, ELECTRON_RUNNING: SOURCE_TEXT_ELECTRON_RUNNING } as const;
const DIRECTORIES = { DATA: SOURCE_TEXT_DATA_2 } as const;
const PLATFORMS = { WIN32: SOURCE_TEXT_WIN32 } as const;
const PYTHON_COMMANDS = { PYTHON: SOURCE_TEXT_PYTHON, PYTHON3: SOURCE_TEXT_PYTHON3 } as const;
export function getDataDirectory(): string {
  const appDataPath = process.env[CONFIG_KEYS.APP_DATA_DIR];
  if (!_.isEmpty(appDataPath)) {
    const dataDir = path.join(appDataPath!, DIRECTORIES.DATA);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }
  const storageDir = process.env[STORAGE_CONFIG.ENV_DIR] || path.join(process.cwd(), STORAGE_CONFIG.DIR);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return storageDir;
}
export function getTempDirectory(): string {
  const dir = path.join(getDataDirectory(), STORAGE_CONFIG.TMP_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export function getLogsDirectory(): string {
  const dir = path.join(getDataDirectory(), STORAGE_CONFIG.LOGS_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export function usesProjectStorage(): boolean {
  return _.isEmpty(process.env[CONFIG_KEYS.APP_DATA_DIR]);
}
export function getStaticResourcePath(filename: string): string {
  const isElectronRunning = process.env[CONFIG_KEYS.ELECTRON_RUNNING];
  const resourcesPath = process.resourcesPath;
  if (!_.isEmpty(isElectronRunning) && !_.isEmpty(resourcesPath)) {
    const resourcePath = path.join(resourcesPath!, filename);
    if (fs.existsSync(resourcePath)) {
      return resourcePath;
    }
  }
  return path.join(process.cwd(), filename);
}
export function getPythonCommand(): string {
  const portablePythonPath = getStaticResourcePath(path.join(SOURCE_TEXT_PYTHON_SCRIPTS, SOURCE_TEXT_PYTHON_RUNTIME, SOURCE_TEXT_PYTHON_EXE));
  if (fs.existsSync(portablePythonPath)) {
    return portablePythonPath;
  }
  return _.isEqual(process.platform, PLATFORMS.WIN32) ? PYTHON_COMMANDS.PYTHON : PYTHON_COMMANDS.PYTHON3;
}
