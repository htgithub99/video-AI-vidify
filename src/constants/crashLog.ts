export const CRASH_LOG = {
  FILE: "backend-crash.jsonl",
  MONITOR: "uncaughtExceptionMonitor",
  EXIT: "exit",
  WARNING: "warning",
  SIGNALS: ["SIGTERM", "SIGINT", "SIGHUP", "SIGBREAK"] as NodeJS.Signals[],
  PARENT: "parent",
  HEARTBEAT_FILE: "backend-heartbeat.json",
  HEARTBEAT_MS: 10000,
  PREVIOUS: "previous-run-last-heartbeat",
  ENCODING: "utf8",
  EMPTY: "",
  NEWLINE: "\n",
  MB: 1048576,
} as const;
export const CONSOLE_LOG = {
  FILE: "backend-console.log",
  BACKUP: "backend-console.1.log",
  MAX_BYTES: 20 * 1048576,
  METHODS: ["log", "info", "warn", "error"] as const,
  ANSI: /\u001b\[[0-9;]*m/g,
  NEWLINE: "\n",
} as const;
