import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { CHROME_BACKUP as C } from "../../constants/chromeBackup.js";
import { getDataDirectory } from "../utils/paths.js";
import { appWarn } from "../../lib/logger.js";
import { sharedChromeTasks, waitChromeTask } from "./chromeTaskCoordinator.js";
export interface ChromeBackupSettings {
  enabled: boolean;
  useBackup: boolean;
  ready: boolean;
  active: boolean;
  switching: boolean;
  error?: string;
}
let backupActive = false;
let changeBrowser: (() => Promise<void>) | undefined;
let syncBrowserMode: ((useBackup: boolean) => Promise<void>) | undefined;
export const registerChromeBackupSwitch = (change: () => Promise<void>): void => {
  changeBrowser = change;
};
export const registerChromeBackupModeSync = (sync: (useBackup: boolean) => Promise<void>): void => {
  syncBrowserMode = sync;
};
const settingsFile = () => path.join(getDataDirectory(), C.SETTINGS_FILE);
export const readChromeBackupSettings = (): ChromeBackupSettings => {
  const saved = fs.existsSync(settingsFile()) ? parseJson(fs.readFileSync(settingsFile(), C.JSON)) : {};
  const useBackup = saved.useBackup === true;
  return { enabled: saved.enabled === true, useBackup, ready: saved.ready === true, active: backupActive || useBackup, switching: sharedChromeTasks.switching, error: sharedChromeTasks.failureMessage };
};
export const saveChromeBackupSettings = (patch: Partial<Pick<ChromeBackupSettings, "enabled" | "useBackup" | "ready">>): ChromeBackupSettings => {
  const current = readChromeBackupSettings();
  const nextEnabled = patch.enabled ?? current.enabled;
  const nextUseBackup = patch.useBackup ?? current.useBackup;
  const nextReady = patch.ready ?? current.ready;
  const file = settingsFile();
  const temp = file + randomUUID();
  try {
    fs.writeFileSync(temp, stringifyJson({ enabled: nextEnabled, useBackup: nextUseBackup, ready: nextReady }), { encoding: C.JSON, flush: true });
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
  if (patch.useBackup !== undefined) {
    const wasActive = current.active;
    backupActive = patch.useBackup;
    sharedChromeTasks.resetFailure();
    if (wasActive !== patch.useBackup) {
      sharedChromeTasks.generation++;
      if (syncBrowserMode) void syncBrowserMode(patch.useBackup).catch(() => undefined);
    }
  } else if (patch.enabled !== undefined) {
    sharedChromeTasks.resetFailure();
  }
  return readChromeBackupSettings();
};
export const isBackupChromeActive = (): boolean => backupActive || readChromeBackupSettings().useBackup;
export const isGeminiFlashQuotaError = (error: unknown): boolean => error instanceof Error && error.message.startsWith(C.QUOTA_CODE);
export const backupChromeFailure = (message: string): Error => Object.assign(new Error(message), { [C.ERROR_FLAG]: true });
export const withChromeBackupRecovery = async <T>(work: () => Promise<T>, signal?: AbortSignal, log?: (line: string) => void): Promise<T> => {
  if (sharedChromeTasks.nested) return work();
  let generation = sharedChromeTasks.generation;
  try {
    return await sharedChromeTasks.run(() => {
      generation = sharedChromeTasks.generation;
      return work();
    }, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    if (!isGeminiFlashQuotaError(error) || !readChromeBackupSettings().enabled) throw error;
    if (isBackupChromeActive() && generation === sharedChromeTasks.generation) throw backupChromeFailure(C.EXHAUSTED);
    if (!readChromeBackupSettings().ready || !changeBrowser) throw backupChromeFailure(C.NOT_READY);
    await waitChromeTask(
      sharedChromeTasks.switch(
        generation,
        async () => {
          await changeBrowser!();
          backupActive = true;
        },
        log,
      ),
      signal,
    );
    try {
      return await sharedChromeTasks.run(work, signal);
    } catch (nextError) {
      if (isGeminiFlashQuotaError(nextError)) throw backupChromeFailure(C.EXHAUSTED);
      throw nextError;
    }
  }
};
export const saveChatResponse = (request: { projectId: string; workerId?: string; requestId?: string; artifactType?: string }, text: string): boolean => {
  try {
    const settings = readChromeBackupSettings();
    if (!sharedChromeTasks.switching && !settings.enabled && !settings.useBackup) return false;
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
