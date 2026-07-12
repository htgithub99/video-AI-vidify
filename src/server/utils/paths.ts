import path from "path";
import fs from "fs";
import _ from "lodash";

const CONFIG_KEYS = {
  APP_DATA_DIR: "APP_DATA_DIR",
  ELECTRON_RUNNING: "ELECTRON_RUNNING",
} as const;

const DIRECTORIES = {
  DATA: "data",
} as const;

const PLATFORMS = {
  WIN32: "win32",
} as const;

const PYTHON_COMMANDS = {
  PYTHON: "python",
  PYTHON3: "python3",
} as const;

export function getDataDirectory(): string {
  const appDataPath = process.env[CONFIG_KEYS.APP_DATA_DIR];
  if (!_.isEmpty(appDataPath)) {
    const dataDir = path.join(appDataPath!, DIRECTORIES.DATA);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }
  return process.cwd();
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
  return _.isEqual(process.platform, PLATFORMS.WIN32)
    ? PYTHON_COMMANDS.PYTHON
    : PYTHON_COMMANDS.PYTHON3;
}
