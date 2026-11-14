import fs from "node:fs";
import path from "node:path";
import { getLogsDirectory } from "./utils/paths.js";
import { CRASH_LOG as C } from "../constants/crashLog.js";
const write = (event: string, error?: unknown): void => {
  try {
    const memory = process.memoryUsage();
    const detail = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error ?? C.EMPTY) };
    fs.appendFileSync(path.join(getLogsDirectory(), C.FILE), JSON.stringify({ at: new Date().toISOString(), event, pid: process.pid, rssMb: Math.round(memory.rss / C.MB), heapMb: Math.round(memory.heapUsed / C.MB), ...detail }) + C.NEWLINE);
  } catch {
    return;
  }
};
const heartbeat = (): void => {
  try {
    const memory = process.memoryUsage();
    fs.writeFileSync(path.join(getLogsDirectory(), C.HEARTBEAT_FILE), JSON.stringify({ at: new Date().toISOString(), pid: process.pid, ppid: process.ppid, uptimeS: Math.round(process.uptime()), rssMb: Math.round(memory.rss / C.MB), heapMb: Math.round(memory.heapUsed / C.MB), externalMb: Math.round(memory.external / C.MB) }));
  } catch {
    return;
  }
};
const previousRun = (): void => {
  try {
    const file = path.join(getLogsDirectory(), C.HEARTBEAT_FILE);
    if (!fs.existsSync(file)) return;
    fs.appendFileSync(path.join(getLogsDirectory(), C.FILE), JSON.stringify({ event: C.PREVIOUS, startedPid: process.pid, ...JSON.parse(fs.readFileSync(file, C.ENCODING)) }) + C.NEWLINE);
  } catch {
    return;
  }
};
export const installCrashLog = (): void => {
  previousRun();
  heartbeat();
  setInterval(heartbeat, C.HEARTBEAT_MS).unref();
  process.on(C.MONITOR, (error, origin) => write(String(origin), error));
  process.on(C.EXIT, (code) => write(C.EXIT, code));
  process.on(C.WARNING, (warning) => write(C.WARNING, warning));
  for (const signal of C.SIGNALS) {
    const onSignal = (): void => {
      write(signal, `${C.PARENT} ${process.ppid}`);
      process.removeListener(signal, onSignal);
      try {
        process.kill(process.pid, signal);
      } catch {
        process.exit(1);
      }
    };
    process.on(signal, onSignal);
  }
};
