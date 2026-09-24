import fs from "fs";
import os from "os";
import path from "path";
import { logger } from "../../lib/logger.js";

const logPath = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "VideoAI-Vidify", "logs", "music-workflow.jsonl");
const safeKeys = new Set([
  "runId", "stage", "provider", "model", "workerId", "attempt", "batch", "batchSize",
  "songIndex", "songId", "songCount", "trackCount", "selectedCount", "attachmentCount", "responseChars",
  "issueCount", "elapsedMs", "format", "status", "createdCount", "recoveredCount",
  "chunk", "chunkCount", "code", "errorName", "errorMessage", "retryable", "checkpoint",
  "stablePolls", "candidateChars", "responseCount", "busy", "identityMatch",
  "expectedChars", "actualChars", "promptChars", "bytes", "purpose",
]);

const sanitizeText = (value: unknown): string => String(value ?? "")
  .replace(/\x1b\[[0-9;]*m/g, "")
  .split(/\r?\n/, 1)[0]
  .replace(/(?:Bearer\s+|api[_-]?key[=:]\s*|token[=:]\s*)[^\s,;]+/gi, "[redacted]")
  .replace(/https?:\/\/[^\s]+/gi, "[url]")
  .replace(/[A-Z]:\\[^\s]+/gi, "[path]")
  .replace(/\/[\w./-]+\.(?:mp3|wav|png|jpg)/gi, "[path]")
  .replace(/(["'`]).{80,}?\1/g, "[long quoted text]")
  .slice(0, 400);

export const musicErrorDetails = (error: unknown): Record<string, string> => {
  const source = error instanceof Error ? error : new Error(String(error));
  return { errorName: sanitizeText(source.name), errorMessage: sanitizeText(source.message) };
};

export const writeMusicDiagnostic = async (event: string, details: Record<string, unknown> = {}): Promise<void> => {
  try {
    const safeDetails: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      if (!safeKeys.has(key) || value === undefined || value === null) continue;
      safeDetails[key] = typeof value === "string" ? sanitizeText(value)
        : typeof value === "number" || typeof value === "boolean" ? value : undefined;
    }
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    await fs.promises.appendFile(logPath, `${JSON.stringify({ timestamp: new Date().toISOString(), event: sanitizeText(event), ...safeDetails })}\n`, "utf8");
  } catch (error) {
    logger.warn(`[MusicDiagnostics] log write failed: ${musicErrorDetails(error).errorMessage}`);
  }
};
