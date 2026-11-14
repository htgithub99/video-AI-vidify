import fs from "node:fs";
import path from "node:path";
import { format } from "node:util";
import { getLogsDirectory } from "./utils/paths.js";
import { CONSOLE_LOG as L } from "../constants/crashLog.js";
let installed = false;
let stream: fs.WriteStream | undefined;
let written = 0;
const open = (): fs.WriteStream | undefined => {
  try {
    const file = path.join(getLogsDirectory(), L.FILE);
    written = fs.existsSync(file) ? fs.statSync(file).size : 0;
    if (written >= L.MAX_BYTES) {
      fs.renameSync(file, path.join(getLogsDirectory(), L.BACKUP));
      written = 0;
    }
    return fs.createWriteStream(file, { flags: "a" });
  } catch {
    return undefined;
  }
};
const append = (level: string, args: unknown[]): void => {
  try {
    if (!stream || written >= L.MAX_BYTES) {
      stream?.end();
      stream = open();
    }
    if (!stream) return;
    const line = `${new Date().toISOString()} ${level.toUpperCase()} ${format(...args).replace(L.ANSI, "")}${L.NEWLINE}`;
    written += Buffer.byteLength(line);
    stream.write(line);
  } catch {
    return;
  }
};
// Mirrors the backend console into storage/logs/backend-console.log so runs can be diagnosed after the fact.
export const installConsoleLog = (): void => {
  if (installed) return;
  installed = true;
  for (const level of L.METHODS) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      append(level, args);
    };
  }
};
