import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import _ from "lodash";
import { GEMINI_MODEL_ENCODING } from "../../constants/geminiChatModels.js";
import {
  SOURCE_TEMPLATE_MUSICDIAGNOSTICS_LOG_WRITE_FAILED,
  SOURCE_TEXT_ACTUALCHARS,
  SOURCE_TEXT_ATTACHMENTCOUNT,
  SOURCE_TEXT_ATTEMPT,
  SOURCE_TEXT_BATCH,
  SOURCE_TEXT_BATCHSIZE,
  SOURCE_TEXT_BODY,
  SOURCE_TEXT_BUSY,
  SOURCE_TEXT_BYTES,
  SOURCE_TEXT_CANDIDATECHARS,
  SOURCE_TEXT_CHECKPOINT,
  SOURCE_TEXT_CHUNK,
  SOURCE_TEXT_CHUNKCOUNT,
  SOURCE_TEXT_CODE,
  SOURCE_TEXT_CREATEDCOUNT,
  SOURCE_TEXT_ELAPSEDMS,
  SOURCE_TEXT_ERRORMESSAGE,
  SOURCE_TEXT_ERRORNAME,
  SOURCE_TEXT_EXPECTEDCHARS,
  SOURCE_TEXT_FORMAT,
  SOURCE_TEXT_IDENTITYMATCH,
  SOURCE_TEXT_ISSUECOUNT,
  SOURCE_TEXT_ISSUES,
  SOURCE_TEXT_LONG_QUOTED_TEXT,
  SOURCE_TEXT_MODEL,
  SOURCE_TEXT_MUSIC_WORKFLOW_JSONL,
  SOURCE_TEXT_PARSED,
  SOURCE_TEXT_PATH_2,
  SOURCE_TEXT_PLAYLISTID,
  SOURCE_TEXT_PROMPTCHARS,
  SOURCE_TEXT_PROVIDER,
  SOURCE_TEXT_PURPOSE,
  SOURCE_TEXT_RECOVEREDCOUNT,
  SOURCE_TEXT_REDACTED,
  SOURCE_TEXT_RESPONSECHARS,
  SOURCE_TEXT_RESPONSECOUNT,
  SOURCE_TEXT_RETRYABLE,
  SOURCE_TEXT_RUNID,
  SOURCE_TEXT_SELECTEDCOUNT,
  SOURCE_TEXT_SONGCOUNT,
  SOURCE_TEXT_SONGID,
  SOURCE_TEXT_SONGINDEX,
  SOURCE_TEXT_STABLEPOLLS,
  SOURCE_TEXT_STAGE,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_TRACKCOUNT,
  SOURCE_TEXT_URL_2,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_WORKERID,
} from "../../constants/sourceText";
import fs from "fs";
import path from "path";
import { getLogsDirectory } from "../utils/paths.js";
import { logger } from "../../lib/logger.js";
import { ANSI_ESCAPE_SEQUENCE_REGEX } from "../../constants/regexes.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
const logPath = path.join(getLogsDirectory(), SOURCE_TEXT_MUSIC_WORKFLOW_JSONL);
const safeKeys = new Set([
  GEMINI_MODEL_ENCODING.DIAGNOSTIC_PHASE,
  RT_SERVER.PROMPTREVISION,
  RT_SERVER.UPLOADPENDING,
  RT_SERVER.UPLOADFAILED,
  RT_SERVER.UPLOADSTATUS,
  RT_SERVER.UPLOADHOST,
  RT_SERVER.UPLOADNETWORKERROR,
  RT_SERVER.UPLOADMESSAGE,
  RT_SERVER.UPLOADMETHOD,
  RT_SERVER.UPLOADFILECOUNT,
  RT_SERVER.UPLOADCOMPLETED,
  RT_SERVER.UPLOADPROCESSING,
  RT_SERVER.UPLOADFILEERRORS,
  SOURCE_TEXT_RUNID,
  SOURCE_TEXT_STAGE,
  SOURCE_TEXT_PROVIDER,
  SOURCE_TEXT_MODEL,
  SOURCE_TEXT_WORKERID,
  SOURCE_TEXT_ATTEMPT,
  SOURCE_TEXT_BATCH,
  SOURCE_TEXT_BATCHSIZE,
  SOURCE_TEXT_SONGINDEX,
  SOURCE_TEXT_SONGID,
  SOURCE_TEXT_SONGCOUNT,
  SOURCE_TEXT_TRACKCOUNT,
  SOURCE_TEXT_SELECTEDCOUNT,
  SOURCE_TEXT_ATTACHMENTCOUNT,
  SOURCE_TEXT_RESPONSECHARS,
  SOURCE_TEXT_ISSUECOUNT,
  SOURCE_TEXT_ELAPSEDMS,
  SOURCE_TEXT_FORMAT,
  SOURCE_TEXT_STATUS,
  SOURCE_TEXT_CREATEDCOUNT,
  SOURCE_TEXT_RECOVEREDCOUNT,
  SOURCE_TEXT_CHUNK,
  SOURCE_TEXT_CHUNKCOUNT,
  SOURCE_TEXT_CODE,
  SOURCE_TEXT_ERRORNAME,
  SOURCE_TEXT_ERRORMESSAGE,
  SOURCE_TEXT_RETRYABLE,
  SOURCE_TEXT_CHECKPOINT,
  SOURCE_TEXT_STABLEPOLLS,
  SOURCE_TEXT_CANDIDATECHARS,
  SOURCE_TEXT_RESPONSECOUNT,
  SOURCE_TEXT_BUSY,
  SOURCE_TEXT_IDENTITYMATCH,
  SOURCE_TEXT_PLAYLISTID,
  SOURCE_TEXT_BODY,
  SOURCE_TEXT_EXPECTEDCHARS,
  SOURCE_TEXT_ACTUALCHARS,
  SOURCE_TEXT_PROMPTCHARS,
  SOURCE_TEXT_BYTES,
  SOURCE_TEXT_PURPOSE,
  SOURCE_TEXT_ISSUES,
  SOURCE_TEXT_PARSED,
] as string[]);
const sanitizeText = (value: unknown): string =>
  String(value ?? "")
    .replace(ANSI_ESCAPE_SEQUENCE_REGEX, "")
    .split(/\r?\n/, 1)[0]
    .replace(/(?:Bearer\s+|api[_-]?key[=:]\s*|token[=:]\s*)[^\s,;]+/gi, SOURCE_TEXT_REDACTED)
    .replace(/https?:\/\/[^\s]+/gi, SOURCE_TEXT_URL_2)
    .replace(/[A-Z]:\\[^\s]+/gi, SOURCE_TEXT_PATH_2)
    .replace(/\/[\w./-]+\.(?:mp3|wav|png|jpg)/gi, SOURCE_TEXT_PATH_2)
    .replace(/(["'`]).{80,}?\1/g, SOURCE_TEXT_LONG_QUOTED_TEXT)
    .slice(0, 400);
export const musicErrorDetails = (error: unknown): Record<string, string> => {
  const source = error instanceof Error ? error : new Error(String(error));
  const phase = _.get(error, [GEMINI_MODEL_ENCODING.DIAGNOSTICS, RT_SERVER.PHASE] as string[]);
  return { errorName: sanitizeText(source.name), errorMessage: sanitizeText(source.message), ...(typeof phase === "string" ? { [GEMINI_MODEL_ENCODING.DIAGNOSTIC_PHASE]: sanitizeText(phase) } : {}) };
};
export const musicUploadDetails = (upload?: { pending: number; failed: boolean; lastFailure?: { url: string; status?: number; errorText?: string } }): Record<string, unknown> => {
  let uploadHost: string | undefined;
  try {
    if (upload?.lastFailure?.url) uploadHost = new URL(upload.lastFailure.url).hostname;
  } catch {}
  return { uploadPending: upload?.pending, uploadFailed: upload?.failed, uploadStatus: upload?.lastFailure?.status, uploadHost, uploadNetworkError: upload?.lastFailure?.errorText };
};
export const writeMusicDiagnostic = async (event: string, details: Record<string, unknown> = {}): Promise<void> => {
  try {
    const safeDetails: Record<string, unknown> = {};
    for (const [key, value] of _.toPairs(details)) {
      if (!safeKeys.has(key) || value === undefined || value === null) continue;
      safeDetails[key] = typeof value === "string" ? sanitizeText(value) : typeof value === "number" || typeof value === "boolean" ? value : undefined;
    }
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
    await fs.promises.appendFile(logPath, `${stringifyJson({ timestamp: new Date().toISOString(), event: sanitizeText(event), ...safeDetails })}${RT_SHARED.SYMBOL_01BA47}`, SOURCE_TEXT_UTF8);
  } catch (error) {
    logger.warn(SOURCE_TEMPLATE_MUSICDIAGNOSTICS_LOG_WRITE_FAILED(`${musicErrorDetails(error).errorMessage}`));
  }
};
