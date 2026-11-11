import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Page } from "playwright";
import { AI_AVAILABILITY as A } from "../../constants/aiAvailability.js";
import { MOTION_CAPTCHA } from "../../constants/motionCaptcha.js";
import { MOTION_TEXT_ROOMPAGE } from "../../constants/motionRuntime.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../constants/cinematicConstants.js";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { appLog } from "../../lib/logger.js";
import { getDataDirectory, getLogsDirectory } from "../utils/paths.js";
export type AiUnavailableKind = (typeof A.KIND)[keyof typeof A.KIND];
export interface AiUnavailability {
  chromeId: string;
  provider: string;
  kind: AiUnavailableKind;
  until: number;
  notice: string;
  at: number;
}
export interface AiAvailabilityClass {
  kind: AiUnavailableKind;
  until: number;
  notice: string;
  provider: string;
}
const file = () => path.join(getDataDirectory(), A.FILE);
const keyOf = (chromeId: string, provider: string) => chromeId + A.KEY_SEP + provider;
const load = (): Map<string, AiUnavailability> => {
  try {
    const saved = fs.existsSync(file()) ? (parseJson(fs.readFileSync(file(), A.ENCODING)) as AiUnavailability[]) : [];
    return new Map((Array.isArray(saved) ? saved : []).filter((entry) => entry && entry.until > Date.now()).map((entry) => [keyOf(entry.chromeId, entry.provider), entry]));
  } catch {
    return new Map();
  }
};
let entries = load();
const save = () => {
  const target = file();
  const temp = target + randomUUID();
  try {
    fs.writeFileSync(temp, stringifyJson([...entries.values()]), { encoding: A.ENCODING, flush: true });
    fs.renameSync(temp, target);
  } catch {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
};
const prune = () => {
  const now = Date.now();
  let changed = false;
  for (const [key, entry] of entries) {
    if (entry.until <= now) {
      entries.delete(key);
      changed = true;
    }
  }
  if (changed) save();
};
export const formatAiUntil = (until: number): string => new Date(until).toLocaleString(A.TIME_LOCALE, A.TIME_OPTIONS);
export const listAiUnavailability = (): AiUnavailability[] => {
  prune();
  return [...entries.values()].sort((a, b) => a.until - b.until);
};
export const aiUnavailableUntil = (chromeId: string, provider: string): number => {
  const entry = entries.get(keyOf(chromeId, provider));
  return entry && entry.until > Date.now() ? entry.until : 0;
};
export const aiUnavailability = (chromeId: string, provider: string): AiUnavailability | undefined => (aiUnavailableUntil(chromeId, provider) ? entries.get(keyOf(chromeId, provider)) : undefined);
export const clearAiUnavailability = (chromeId?: string, provider?: string): void => {
  for (const [key, entry] of entries) if ((!chromeId || entry.chromeId === chromeId) && (!provider || entry.provider === provider)) entries.delete(key);
  save();
};
export const markAiUnavailable = (chromeId: string, found: AiAvailabilityClass): AiUnavailability => {
  const entry: AiUnavailability = { chromeId, provider: found.provider, kind: found.kind, until: found.until, notice: found.notice, at: Date.now() };
  entries.set(keyOf(chromeId, found.provider), entry);
  save();
  try {
    fs.appendFileSync(path.join(getLogsDirectory(), A.LOG_FILE), stringifyJson(entry) + A.NEWLINE, A.ENCODING);
  } catch {
    return entry;
  }
  appLog(A.LOG.MARK(chromeId, found.provider, A.KIND_LABEL[found.kind], formatAiUntil(found.until)));
  return entry;
};
export const parseAiResetAt = (text: string, now = Date.now()): number | undefined => {
  const relative = A.RESET.RELATIVE.exec(text);
  if (relative) {
    const amount = Number(relative[1].replace(A.COMMA, A.DOT));
    const unit = relative[2];
    const ms = A.RESET.DAY_UNITS.test(unit) ? amount * 86_400_000 : A.RESET.HOUR_UNITS.test(unit) ? amount * 3_600_000 : amount * 60_000;
    if (ms > 0) return now + ms;
  }
  const clock = A.RESET.CLOCK.exec(text);
  if (clock) {
    let hour = Number(clock[1]);
    const minute = Number(clock[2] || 0);
    const meridiem = clock[3] || A.EMPTY;
    if (A.RESET.PM.test(meridiem) && hour < 12) hour += 12;
    if (A.RESET.AM.test(meridiem) && hour === 12) hour = 0;
    if (hour < 24 && minute < 60) {
      const at = new Date(now);
      at.setHours(hour, minute, 0, 0);
      if (A.RESET.TOMORROW.test(text) || at.getTime() <= now) at.setDate(at.getDate() + 1);
      return at.getTime();
    }
  }
  return undefined;
};
const codeMatch = (kind: string, text: string) => (A.CODES[kind] || []).some((code) => text.includes(code));
export const readAiAvailabilityNotices = async (page: Page | undefined): Promise<{ url: string; notices: string[] }> => {
  if (!page || page.isClosed()) return { url: A.EMPTY, notices: [] };
  try {
    const notices = await page.evaluate(
      ({ selector, max, items, space, empty }) =>
        Array.from(document.querySelectorAll(selector))
          .filter((element) => {
            const box = (element as HTMLElement).getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          })
          .slice(0, items)
          .map((element) => ((element as HTMLElement).innerText || empty).split(/\s+/).join(space).trim().slice(0, max))
          .filter(Boolean)
          .concat([document.title || empty]),
      { selector: A.NOTICE_SELECTOR, max: A.NOTICE_MAX, items: A.NOTICE_ITEMS, space: A.SPACE, empty: A.EMPTY },
    );
    return { url: page.url(), notices: Array.from(new Set(notices)) };
  } catch {
    return { url: page.isClosed() ? A.EMPTY : page.url(), notices: [] };
  }
};
export const aiAvailabilityOf = (error: unknown): AiAvailabilityClass | undefined => (error && typeof error === A.OBJECT ? ((error as Record<string, unknown>)[A.FLAG] as AiAvailabilityClass | undefined) : undefined);
export const isAiExhausted = (error: unknown): boolean => !!(error && typeof error === A.OBJECT && (error as Record<string, unknown>)[A.EXHAUSTED_FLAG]);
export const tagAiAvailability = <T>(error: T, found: AiAvailabilityClass, exhausted = false): T => {
  if (error && typeof error === A.OBJECT) {
    Object.defineProperty(error, A.FLAG, { value: found, enumerable: false, configurable: true });
    if (exhausted) Object.defineProperty(error, A.EXHAUSTED_FLAG, { value: true, enumerable: false, configurable: true });
  }
  return error;
};
const untilFor = (kind: AiUnavailableKind, provider: string, text: string): number => {
  const parsed = parseAiResetAt(text);
  const fallback = Date.now() + (kind === A.KIND.QUOTA ? A.PROVIDER_QUOTA_MS[provider] ?? A.DEFAULT_MS.quota : A.DEFAULT_MS[kind]);
  const until = parsed ? parsed + A.RESET_PAD_MS : fallback;
  return Math.min(Date.now() + A.MAX_MS, Math.max(Date.now() + A.MIN_MS, until));
};
export const classifyAiError = async (error: unknown, provider: string): Promise<AiAvailabilityClass | null> => {
  if (!error || typeof error !== A.OBJECT) return null;
  const known = aiAvailabilityOf(error);
  if (known) return known;
  const record = error as Record<string, unknown> & { message?: string; cause?: { message?: string }; name?: string };
  const message = [record.message, record.cause?.message].filter(Boolean).join(A.NEWLINE);
  if (record.name === A.ABORT_ERROR || message.includes(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)) return null;
  const { url, notices } = await readAiAvailabilityNotices(record[MOTION_TEXT_ROOMPAGE] as Page | undefined);
  const found = (kind: AiUnavailableKind, notice: string): AiAvailabilityClass => ({ kind, provider, notice: notice.slice(0, A.NOTICE_MAX), until: untilFor(kind, provider, [notice, message].join(A.NEWLINE)) });
  const pageHit = (pattern: RegExp) => notices.find((text) => pattern.test(text));
  if (codeMatch(A.KIND.QUOTA, message)) return found(A.KIND.QUOTA, pageHit(A.PAGE.quota) || message);
  if (record[MOTION_CAPTCHA.FLAG] || codeMatch(A.KIND.BLOCKED, message) || MOTION_CAPTCHA.PATTERN.test(message)) return found(A.KIND.BLOCKED, pageHit(A.PAGE.blocked) || message);
  if (codeMatch(A.KIND.LOGIN, message)) return found(A.KIND.LOGIN, message);
  if (codeMatch(A.KIND.PLAN, message)) {
    const reset = pageHit(A.PAGE.planReset) || (A.PAGE.planReset.test(message) ? message : undefined);
    return reset ? found(A.KIND.QUOTA, reset) : found(A.KIND.PLAN, message);
  }
  if (A.PAGE.loginUrl.test(url)) return found(A.KIND.LOGIN, url);
  const blocked = pageHit(A.PAGE.blocked) || pageHit(MOTION_CAPTCHA.PATTERN);
  if (blocked) return found(A.KIND.BLOCKED, blocked);
  const quota = pageHit(A.PAGE.quota);
  if (quota) return found(A.KIND.QUOTA, quota);
  const login = pageHit(A.PAGE.login);
  if (login) return found(A.KIND.LOGIN, login);
  return null;
};
export const classifyAiText = (text: string, provider: string): AiAvailabilityClass | null => {
  const clean = String(text || A.EMPTY);
  const kind = A.PAGE.blocked.test(clean) ? A.KIND.BLOCKED : A.PAGE.quota.test(clean) ? A.KIND.QUOTA : null;
  return kind ? { kind, provider, notice: clean.slice(0, A.NOTICE_MAX), until: untilFor(kind, provider, clean) } : null;
};
export const waitAiReset = async (until: number, signal?: AbortSignal): Promise<void> => {
  while (Date.now() < until) {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(done, Math.min(A.WAIT_TICK_MS, Math.max(0, until - Date.now())));
      function done() {
        signal?.removeEventListener(A.ABORT, abort);
        resolve();
      }
      function abort() {
        clearTimeout(timer);
        reject(signal?.reason);
      }
      signal?.addEventListener(A.ABORT, abort, { once: true });
    });
  }
};
export const reloadAiAvailability = () => {
  entries = load();
};
