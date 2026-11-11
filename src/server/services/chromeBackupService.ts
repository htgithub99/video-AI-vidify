import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { CHROME_BACKUP as C } from "../../constants/chromeBackup.js";
import { AI_AVAILABILITY as A } from "../../constants/aiAvailability.js";
import { MOTION_AI_FALLBACK } from "../../constants/motionAiFallback.js";
import { getDataDirectory } from "../utils/paths.js";
import { appWarn } from "../../lib/logger.js";
import { sharedChromeTasks, waitChromeTask } from "./chromeTaskCoordinator.js";
import { aiUnavailableUntil, classifyAiError, clearAiUnavailability, formatAiUntil, listAiUnavailability, markAiUnavailable, tagAiAvailability, type AiAvailabilityClass } from "./aiAvailabilityService.js";
export interface BackupChrome {
  id: string;
  name: string;
  profile: string;
  port: number;
  ready: boolean;
}
export interface AiFallbackRoute {
  provider: string;
  model: string;
  enabled: boolean;
}
export type ChromeWaitPolicy = (typeof A.WAIT_POLICY)[keyof typeof A.WAIT_POLICY];
interface StoredSettings {
  enabled: boolean;
  pinned: string | null;
  waitPolicy: ChromeWaitPolicy;
  chromes: BackupChrome[];
  fallbackChain: AiFallbackRoute[];
  mainReady: boolean;
}
export interface ChromeBackupSettings extends StoredSettings {
  activeId: string;
  useBackup: boolean;
  ready: boolean;
  active: boolean;
  switching: boolean;
  error?: string;
  availability: (ReturnType<typeof listAiUnavailability>[number] & { untilText: string; kindLabel: string; chromeName: string })[];
}
let activeId: string | undefined;
let changeBrowser: ((targetId: string) => Promise<void>) | undefined;
let syncBrowserMode: (() => Promise<void>) | undefined;
const recentProviders = new Map<string, number>();
export const registerChromeBackupSwitch = (change: (targetId: string) => Promise<void>): void => {
  changeBrowser = change;
};
export const registerChromeBackupModeSync = (sync: () => Promise<void>): void => {
  syncBrowserMode = sync;
};
const settingsFile = () => path.join(getDataDirectory(), C.SETTINGS_FILE);
let cached: StoredSettings | undefined;
const readStored = (): StoredSettings => {
  if (cached) return cached;
  cached = parseStored();
  return cached;
};
const nextPort = (chromes: { port?: number }[]): number => {
  let port = C.PORT_BASE;
  while (chromes.some((chrome) => chrome.port === port) || C.RESERVED_PORTS.includes(port)) port++;
  return port;
};
export const normalizeFallbackChain = (input: unknown): AiFallbackRoute[] => {
  const defaults = MOTION_AI_FALLBACK.MAIN.map((route) => ({ provider: route.provider, model: route.model, enabled: true }));
  const saved = (Array.isArray(input) ? input : []).filter((route): route is AiFallbackRoute => !!route && defaults.some((item) => item.provider === route.provider));
  const unique = saved.filter((route, index) => saved.findIndex((item) => item.provider === route.provider) === index).map((route) => ({ provider: route.provider, model: typeof route.model === C.STRING ? route.model : C.EMPTY, enabled: route.enabled !== false }));
  return [...unique, ...defaults.filter((route) => !unique.some((item) => item.provider === route.provider))];
};
const parseStored = (): StoredSettings => {
  const saved = fs.existsSync(settingsFile()) ? parseJson(fs.readFileSync(settingsFile(), C.JSON)) : {};
  const raw: Partial<BackupChrome>[] = Array.isArray(saved.chromes) ? saved.chromes : [{ id: C.LEGACY_ID, name: C.DEFAULT_NAME(1), profile: C.PROFILE, ready: saved.ready === true }];
  const chromes: BackupChrome[] = [];
  for (const chrome of raw) {
    if (!chrome || typeof chrome.id !== C.STRING || typeof chrome.profile !== C.STRING) continue;
    const port = Number.isInteger(chrome.port) && !chromes.some((item) => item.port === chrome.port) ? chrome.port! : nextPort(chromes);
    chromes.push({ id: chrome.id, name: String(chrome.name || chrome.id), profile: chrome.profile, port, ready: chrome.ready === true });
  }
  return {
    enabled: saved.enabled === true,
    pinned: Array.isArray(saved.chromes) ? (typeof saved.pinned === C.STRING ? saved.pinned : null) : saved.useBackup === true ? C.LEGACY_ID : null,
    waitPolicy: saved.waitPolicy === A.WAIT_POLICY.STOP ? A.WAIT_POLICY.STOP : A.WAIT_POLICY.WAIT,
    chromes,
    fallbackChain: normalizeFallbackChain(saved.fallbackChain),
    mainReady: saved.mainReady !== false,
  };
};
const writeStored = (next: StoredSettings): void => {
  cached = next;
  const file = settingsFile();
  const temp = file + randomUUID();
  try {
    fs.writeFileSync(temp, stringifyJson(next), { encoding: C.JSON, flush: true });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
};
const knownChrome = (stored: StoredSettings, id: string | null | undefined): boolean => id === A.MAIN || stored.chromes.some((chrome) => chrome.id === id);
export const activeChromeId = (): string => {
  const stored = readStored();
  if (!activeId || !knownChrome(stored, activeId)) activeId = stored.pinned && knownChrome(stored, stored.pinned) ? stored.pinned : A.MAIN;
  return activeId;
};
export const chromeName = (id: string, stored = readStored()): string => (id === A.MAIN ? C.MAIN_NAME : stored.chromes.find((chrome) => chrome.id === id)?.name || id);
export const chromeProfilePath = (id = activeChromeId()): string => path.join(getDataDirectory(), readStored().chromes.find((chrome) => chrome.id === id)?.profile || C.PROFILE);
export const chromeDebugPort = (id = activeChromeId()): number => readStored().chromes.find((chrome) => chrome.id === id)?.port || C.PORT_BASE;
export const aiFallbackChain = (): AiFallbackRoute[] => readStored().fallbackChain.filter((route) => route.enabled);
export const chromeBackupAccountEmail = (id = activeChromeId()): string => C.ACCOUNT_PREFIX + id;
export const sessionChromeId = (email?: string): string => (email === C.PROFILE ? C.LEGACY_ID : email?.startsWith(C.ACCOUNT_PREFIX) ? email.slice(C.ACCOUNT_PREFIX.length) : A.MAIN);
export const chromeSessionMismatch = (email?: string): boolean => sessionChromeId(email) !== activeChromeId();
export const isBackupChromeActive = (): boolean => activeChromeId() !== A.MAIN;
export const readChromeBackupSettings = (): ChromeBackupSettings => {
  const stored = readStored();
  const current = activeChromeId();
  return {
    ...stored,
    activeId: current,
    useBackup: stored.pinned !== null && stored.pinned !== A.MAIN,
    ready: stored.chromes.some((chrome) => chrome.ready),
    active: current !== A.MAIN,
    switching: sharedChromeTasks.switching,
    error: sharedChromeTasks.failureMessage,
    availability: listAiUnavailability().map((entry) => ({ ...entry, untilText: formatAiUntil(entry.until), kindLabel: A.KIND_LABEL[entry.kind], chromeName: chromeName(entry.chromeId, stored) })),
  };
};
const moveTo = (target: string) => {
  if (target === activeChromeId()) return;
  activeId = target;
  sharedChromeTasks.resetFailure();
  sharedChromeTasks.generation++;
  if (syncBrowserMode) void syncBrowserMode().catch(() => undefined);
};
export const saveChromeBackupSettings = (patch: Partial<Pick<StoredSettings, "enabled" | "pinned" | "waitPolicy" | "fallbackChain">> & { useBackup?: boolean; ready?: boolean; readyId?: string }): ChromeBackupSettings => {
  const stored = readStored();
  const pinned = patch.useBackup !== undefined ? (patch.useBackup ? stored.chromes[0]?.id || null : null) : patch.pinned !== undefined ? (patch.pinned && knownChrome(stored, patch.pinned) && patch.pinned !== A.MAIN ? patch.pinned : null) : stored.pinned;
  const readyId = patch.readyId || activeChromeId();
  const chromes = patch.ready === undefined ? stored.chromes : stored.chromes.map((chrome) => (chrome.id === readyId ? { ...chrome, ready: patch.ready! } : chrome));
  const mainReady = patch.ready !== undefined && readyId === A.MAIN ? patch.ready : stored.mainReady;
  writeStored({ enabled: patch.enabled ?? stored.enabled, pinned, waitPolicy: patch.waitPolicy === A.WAIT_POLICY.STOP || patch.waitPolicy === A.WAIT_POLICY.WAIT ? patch.waitPolicy : stored.waitPolicy, chromes, fallbackChain: patch.fallbackChain ? normalizeFallbackChain(patch.fallbackChain) : stored.fallbackChain, mainReady });
  if (patch.useBackup !== undefined || patch.pinned !== undefined) moveTo(pinned || A.MAIN);
  else if (patch.enabled !== undefined) sharedChromeTasks.resetFailure();
  return readChromeBackupSettings();
};
export const addBackupChrome = (name?: string): ChromeBackupSettings => {
  const stored = readStored();
  let index = stored.chromes.length + 1;
  while (stored.chromes.some((chrome) => chrome.id === C.ID_PREFIX + index)) index++;
  const id = C.ID_PREFIX + index;
  writeStored({ ...stored, chromes: [...stored.chromes, { id, name: String(name || C.EMPTY).trim().slice(0, C.NAME_MAX) || C.DEFAULT_NAME(index), profile: path.join(C.PROFILES_DIR, id), port: nextPort(stored.chromes), ready: false }] });
  return readChromeBackupSettings();
};
export const renameBackupChrome = (id: string, name: string): ChromeBackupSettings => {
  const stored = readStored();
  const clean = String(name || C.EMPTY).trim().slice(0, C.NAME_MAX);
  if (clean) writeStored({ ...stored, chromes: stored.chromes.map((chrome) => (chrome.id === id ? { ...chrome, name: clean } : chrome)) });
  return readChromeBackupSettings();
};
export const removeBackupChrome = (id: string): ChromeBackupSettings => {
  const stored = readStored();
  if (id === activeChromeId() || sharedChromeTasks.switching) throw new Error(C.REMOVE_ACTIVE);
  writeStored({ ...stored, pinned: stored.pinned === id ? null : stored.pinned, chromes: stored.chromes.filter((chrome) => chrome.id !== id) });
  clearAiUnavailability(id);
  return readChromeBackupSettings();
};
export const clearChromeAvailability = (chromeId?: string, provider?: string): ChromeBackupSettings => {
  clearAiUnavailability(chromeId, provider);
  return readChromeBackupSettings();
};
export const isGeminiFlashQuotaError = (error: unknown): boolean => error instanceof Error && error.message.startsWith(C.QUOTA_CODE);
export const backupChromeFailure = (message: string): Error => Object.assign(new Error(message), { [C.ERROR_FLAG]: true });
export const markProviderRecent = (provider: string): void => {
  recentProviders.set(provider, Date.now());
};
const candidates = (stored: StoredSettings, current: string): string[] => {
  const order = [A.MAIN, ...stored.chromes.filter((chrome) => chrome.ready).map((chrome) => chrome.id)];
  const start = Math.max(0, order.indexOf(current));
  return [...order.slice(start + 1), ...order.slice(0, start)].filter((id) => id !== current);
};
export const pickChromeFor = (provider: string, current = activeChromeId()): string | undefined => {
  const stored = readStored();
  const recent = [...recentProviders].filter(([name, at]) => name !== provider && Date.now() - at < A.RECENT_MS).map(([name]) => name);
  return candidates(stored, current).find((id) => !aiUnavailableUntil(id, provider) && recent.every((name) => !aiUnavailableUntil(id, name)));
};
export const earliestProviderReset = (provider: string): number => {
  const stored = readStored();
  const all = [A.MAIN, ...stored.chromes.filter((chrome) => chrome.ready).map((chrome) => chrome.id)];
  return Math.min(...all.map((id) => aiUnavailableUntil(id, provider) || Date.now()));
};
export const chromeWaitPolicy = (): ChromeWaitPolicy => readStored().waitPolicy;
export const aiOutageMs = (provider: string): number => (readStored().waitPolicy !== A.WAIT_POLICY.WAIT ? 0 : Math.max(0, (readStored().enabled ? earliestProviderReset(provider) : aiUnavailableUntil(activeChromeId(), provider)) - Date.now()));
export const isAutoChromeSwitchEnabled = (): boolean => readStored().enabled;
export const withChromeBackupRecovery = async <T>(work: () => Promise<T>, signal?: AbortSignal, log?: (line: string) => void, provider?: string): Promise<T> => {
  if (sharedChromeTasks.nested) return work();
  const stored = readStored();
  const maxHops = stored.chromes.length + 2;
  for (let hop = 0; ; hop++) {
    let generation = sharedChromeTasks.generation;
    const chromeId = activeChromeId();
    if (provider) markProviderRecent(provider);
    try {
      return await sharedChromeTasks.run(() => {
        generation = sharedChromeTasks.generation;
        return work();
      }, signal);
    } catch (error) {
      if (signal?.aborted || !provider) throw error;
      if ((sharedChromeTasks.switching || generation !== sharedChromeTasks.generation) && hop < maxHops) continue;
      const found = await classifyAiError(error, provider);
      if (!found) throw error;
      markAiUnavailable(chromeId, found);
      tagAiAvailability(error, found);
      if (!readStored().enabled || !changeBrowser || hop >= maxHops) throw tagAiAvailability(error, { ...found, until: earliestProviderReset(provider) } as AiAvailabilityClass, true);
      const tried = new Set<string>();
      let moved = false;
      for (let target = pickChromeFor(provider, chromeId); target && !tried.has(target); target = pickChromeFor(provider, chromeId)) {
        tried.add(target);
        log?.(A.LOG.SWITCH(provider, chromeName(chromeId), chromeName(target), A.KIND_LABEL[found.kind]));
        try {
          await waitChromeTask(
            sharedChromeTasks.switch(
              generation,
              async () => {
                const previous = activeChromeId();
                activeId = target;
                try {
                  await changeBrowser!(target);
                } catch (cause) {
                  activeId = previous;
                  if (target !== A.MAIN) saveChromeBackupSettings({ ready: false, readyId: target });
                  throw cause;
                }
              },
              log,
            ),
            signal,
          );
          moved = true;
          break;
        } catch (switchError) {
          if (signal?.aborted) throw switchError;
          sharedChromeTasks.resetFailure();
        }
      }
      if (!moved) {
        log?.(A.LOG.NO_CHROME(provider, A.KIND_LABEL[found.kind]));
        throw tagAiAvailability(error, { ...found, until: earliestProviderReset(provider) }, true);
      }
    }
  }
};
export const saveChatResponse = (request: { projectId: string; workerId?: string; requestId?: string; artifactType?: string }, text: string): boolean => {
  try {
    const settings = readStored();
    if (!sharedChromeTasks.switching && !settings.enabled && !settings.pinned) return false;
    const directory = path.join(getDataDirectory(), C.RESULTS);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, randomUUID() + C.JSON_EXT), stringifyJson({ ...request, text, at: Date.now(), generation: sharedChromeTasks.generation }), { encoding: C.JSON, flush: true });
    return true;
  } catch (cause) {
    appWarn(C.SAVE_WARNING(String((cause as Error)?.message || cause)));
    sharedChromeTasks.fail(Object.assign(new Error(C.SAVE_FAILED, { cause }), { [C.ERROR_FLAG]: true }));
    return false;
  }
};
