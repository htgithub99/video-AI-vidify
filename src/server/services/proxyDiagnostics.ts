import { stringifyJson } from "../../lib/jsonStringify.js";
import { SOURCE_TEXT_REDACTED, SOURCE_TEXT_1_REDACTED_2, SOURCE_TEXT_PROXY_2, SOURCE_TEXT_LOGS, SOURCE_TEXT_PROXY_DIAGNOSTICS_JSONL, SOURCE_TEMPLATE_PREVIOUS, SOURCE_TEMPLATE_SYMBOL_79, SOURCE_TEXT_UTF8, SOURCE_TEXT_PROXY_KHONG_GHI_DUOC_FILE_LOG_CHAN } from "../../constants/sourceText.js";
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { logger } from "../../utils/logger.js";
export function createProxyDiagnostics(directory: string, profileId: string, operation: string) {
  const operationId = randomUUID();
  const started = Date.now();
  const secrets: string[] = [];
  const redact = (value: string) => secrets.reduce((text, secret) => text.split(secret).join(SOURCE_TEXT_REDACTED), value).replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, SOURCE_TEXT_1_REDACTED_2);
  return {
    protect(...values: (string | undefined)[]) {
      for (const value of values) {
        if (value) secrets.push(value, encodeURIComponent(value));
      }
      secrets.sort((left, right) => right.length - left.length);
    },
    event(stage: string, details: Record<string, unknown> = {}, error?: unknown) {
      const entry = { timestamp: new Date().toISOString(), operationId, profileId, operation, stage, elapsedMs: Date.now() - started, ...details, ...(error ? { error: redact(error instanceof Error ? error.message : String(error)).slice(0, 4000) } : {}) };
      const line = stringifyJson(entry);
      logger.info(SOURCE_TEXT_PROXY_2, line);
      try {
        const logs = path.join(directory, SOURCE_TEXT_LOGS);
        mkdirSync(logs, { recursive: true });
        const file = path.join(logs, SOURCE_TEXT_PROXY_DIAGNOSTICS_JSONL);
        if (existsSync(file) && statSync(file).size > 2 * 1024 * 1024) renameSync(file, SOURCE_TEMPLATE_PREVIOUS(`${file}`));
        appendFileSync(file, SOURCE_TEMPLATE_SYMBOL_79(`${line}`), SOURCE_TEXT_UTF8);
      } catch {
        logger.warn(SOURCE_TEXT_PROXY_KHONG_GHI_DUOC_FILE_LOG_CHAN);
      }
    },
  };
}
