import _ from "lodash";
import type { Locator, Page } from "playwright";
import { chromium } from "playwright-extra";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import ffmpeg from "fluent-ffmpeg";
import { getDataDirectory } from "../utils/paths.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";
import { logger } from "../../lib/logger.js";
import { musicErrorDetails, writeMusicDiagnostic } from "./musicDiagnosticService.js";
import {
  SUNO_AUTOMATION_CONFIG,
  SUNO_AUTOMATION_PATTERNS,
  SUNO_AUTOMATION_SELECTORS,
  SUNO_AUTOMATION_TEXTS,
  formatSunoPlaylistName,
  normalizeSunoPlaylistName,
} from "../../constants/sunoAutomation.js";

export interface SunoSongInput {
  songId: string;
  title: string;
  lyrics: string;
}

export interface SunoCreationResult {
  playlistUrl: string;
  createdSongIds: string[];
}
export interface SunoAdvancedSettings { excludeStyles: string; vocalGender: "male" | "female" | "auto"; duration: "auto"; maxMode: boolean; weirdness: number; styleInfluence: number; audioInfluence?: number; variety: number; personalize: boolean }
export interface ActiveSunoGeneration { title: string; songIds: string[] }
export interface SunoDownloadTrack { songId: string; title: string }
export type SunoDownloadFormat = "mp3" | "wav";

const SUNO_PROFILE_DIR = path.join(process.env.LOCALAPPDATA || getDataDirectory(), SUNO_AUTOMATION_CONFIG.APP_SUBDIR, SUNO_AUTOMATION_CONFIG.SUNO_PROFILE_DIR_NAME);
const SUNO_CDP_URL = SUNO_AUTOMATION_CONFIG.SUNO_CDP_URL;
let activeSunoPage: Page | null = null;
let sunoCancellationRequested = false;

const createSafeAudioFileName = (title: string, index: number, format: SunoDownloadFormat): string => {
  const safeTitle = _.trim(title).split("").filter((character) => character.charCodeAt(0) >= 32).join("")
    .replace(SUNO_AUTOMATION_PATTERNS.INVALID_FILE_CHARS, " ")
    .replace(SUNO_AUTOMATION_PATTERNS.WHITESPACES, " ")
    .replace(SUNO_AUTOMATION_PATTERNS.TRAILING_DOTS_SPACES, "")
    .slice(0, 140) || `${SUNO_AUTOMATION_TEXTS.DEFAULT_TRACK_PREFIX} ${index + 1}`;
  return `${safeTitle}.${format}`;
};

const resolveAvailableFilePath = (folderPath: string, fileName: string): string => {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  let candidate = path.join(folderPath, fileName);
  for (let suffix = 2; fs.existsSync(candidate); suffix += 1) candidate = path.join(folderPath, `${baseName} (${suffix})${extension}`);
  return candidate;
};


export const downloadSunoTracksToFolder = async (tracks: SunoDownloadTrack[], folderPath: string, format: SunoDownloadFormat, signal?: AbortSignal, runId?: string, resume?: {
  existingPaths?: Record<string, string>;
  sourceWavPaths?: Record<string, string>;
  onTrackDownloaded?: (songId: string, filePath: string) => Promise<void>;
}): Promise<string[]> => {
  signal?.throwIfAborted();
  const requestedFolder = _.trim(folderPath);
  if (_.isEmpty(requestedFolder) || !path.isAbsolute(requestedFolder)) throw new Error(SUNO_AUTOMATION_TEXTS.DOWNLOAD_FOLDER_INVALID_ERR);
  const resolvedFolder = path.resolve(requestedFolder);
  const folderStat = await fs.promises.stat(resolvedFolder).catch(() => null);
  if (!folderStat?.isDirectory()) throw new Error(SUNO_AUTOMATION_TEXTS.DOWNLOAD_FOLDER_INVALID_ERR);
  const validTracks = _.filter(tracks, (track) => !_.isEmpty(_.trim(track.songId)));
  if (_.isEmpty(validTracks)) throw new Error(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACKS_REQUIRED_ERR);
  if (!_.includes([SUNO_AUTOMATION_CONFIG.FORMAT_MP3, SUNO_AUTOMATION_CONFIG.FORMAT_WAV], format)) throw new Error(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR);

  const downloadedPaths: string[] = [];
  for (const [index, track] of validTracks.entries()) {
    signal?.throwIfAborted();
    const existingPath = resume?.existingPaths?.[track.songId];
    if (existingPath && path.dirname(path.resolve(existingPath)) === resolvedFolder && path.extname(existingPath).toLowerCase() === `.${format}`) {
      const existingStat = await fs.promises.stat(existingPath).catch(() => null);
      if (existingStat?.isFile() && existingStat.size > 0) {
        downloadedPaths.push(existingPath);
        await writeMusicDiagnostic("audio_track_resumed", { runId, songId: track.songId, songIndex: index + 1, format, bytes: existingStat.size });
        continue;
      }
    }
    await writeMusicDiagnostic("audio_track_started", { runId, songId: track.songId, songIndex: index + 1, trackCount: validTracks.length, format });
    const filePath = resolveAvailableFilePath(resolvedFolder, createSafeAudioFileName(track.title, index, format));
    const sourceWavPath = resume?.sourceWavPaths?.[track.songId];
    if (sourceWavPath) {
      signal?.throwIfAborted();
      try {
        if (format === SUNO_AUTOMATION_CONFIG.FORMAT_WAV) await fs.promises.copyFile(sourceWavPath, filePath);
        else await new Promise<void>((resolve, reject) => {
          ffmpeg(sourceWavPath).noVideo().audioCodec("libmp3lame").audioBitrate("256k").format("mp3")
            .on("end", () => resolve()).on("error", reject).save(filePath);
        });
      } catch (error) {
        await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
        throw error;
      }
      await resume?.onTrackDownloaded?.(track.songId, filePath);
      downloadedPaths.push(filePath);
      await writeMusicDiagnostic("audio_track_exported_from_cache", { runId, songId: track.songId, songIndex: index + 1, format });
      continue;
    }
    const downloadOrigin = _.trim(process.env.DOWNLOADER_STREAM_ORIGIN || SUNO_AUTOMATION_CONFIG.SUNO_DOWNLOAD_ORIGIN).replace(SUNO_AUTOMATION_PATTERNS.TRAILING_SLASH, "");
    const temporaryWavPath = format === SUNO_AUTOMATION_CONFIG.FORMAT_MP3 ? `${filePath}.source.wav.tmp` : filePath;
    let downloaded = false;
    let lastError: unknown;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS && !downloaded; attempt += 1) {
      signal?.throwIfAborted();
      try {
        const timeoutSignal = AbortSignal.timeout(SUNO_AUTOMATION_CONFIG.AUDIO_DOWNLOAD_WAV_TIMEOUT_MS);
        const response = await fetch(SUNO_AUTOMATION_CONFIG.formatAudioDownloadUrl(downloadOrigin, track.songId, SUNO_AUTOMATION_CONFIG.FORMAT_WAV), {
          headers: { Accept: SUNO_AUTOMATION_TEXTS.formatAudioHeaderAccept(SUNO_AUTOMATION_CONFIG.FORMAT_WAV) },
          signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
        });
        if (!response.ok || !response.body) throw new Error(SUNO_AUTOMATION_TEXTS.formatDownloadHttpError(response.status));
        await pipeline(Readable.fromWeb(response.body as any), fs.createWriteStream(temporaryWavPath));
        if (format === SUNO_AUTOMATION_CONFIG.FORMAT_MP3) {
          await new Promise<void>((resolve, reject) => {
            ffmpeg(temporaryWavPath).noVideo().audioCodec("libmp3lame").audioBitrate("256k").format("mp3")
              .on("end", () => resolve()).on("error", reject).save(filePath);
          });
          await fs.promises.rm(temporaryWavPath, { force: true });
        }
        await resume?.onTrackDownloaded?.(track.songId, filePath);
        downloadedPaths.push(filePath);
        downloaded = true;
        await writeMusicDiagnostic("audio_track_completed", { runId, songId: track.songId, songIndex: index + 1, attempt: attempt + 1, format });
      } catch (error) {
        lastError = error;
        await writeMusicDiagnostic("audio_track_attempt_failed", { runId, songId: track.songId, songIndex: index + 1, attempt: attempt + 1, format, ...musicErrorDetails(error) });
        await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
        if (temporaryWavPath !== filePath) await fs.promises.rm(temporaryWavPath, { force: true }).catch(() => undefined);
        signal?.throwIfAborted();
        if (_.includes(_.toString(_.get(error, "message", error)), "suno_download_http_502")) break;
        if (attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, SUNO_AUTOMATION_CONFIG.getAudioRetryDelayMs(attempt)));
        }
      }
    }
    if (!downloaded) {
      await writeMusicDiagnostic("audio_track_failed", { runId, songId: track.songId, songIndex: index + 1, format, ...musicErrorDetails(lastError) });
      if (_.includes(_.toString(_.get(lastError, "message", lastError)), "suno_download_http_502")) throw new Error(SUNO_AUTOMATION_TEXTS.WAV_SOURCE_UNAVAILABLE_ERR);
      throw new Error(SUNO_AUTOMATION_TEXTS.formatDownloadTrackWithCauseErr(track.title, lastError));
    }
  }
  return downloadedPaths;
};

const ensureSunoNotCancelled = (): void => {
  if (sunoCancellationRequested) throw new Error(SUNO_AUTOMATION_TEXTS.CANCELLED_ERR);
};

const waitWithCancellation = async (page: Page, durationMs: number): Promise<void> => {
  const deadline = Date.now() + durationMs;
  while (Date.now() < deadline) {
    ensureSunoNotCancelled();
    await page.waitForTimeout(Math.min(500, deadline - Date.now()));
  }
};

const closeSunoChrome = async (page: Page | null): Promise<void> => {
  if (!page || page.isClosed()) return;
  const session = await page.context().newCDPSession(page).catch(() => null);
  if (!session) {
    await page.close().catch(() => undefined);
    return;
  }
  await session.send(SUNO_AUTOMATION_SELECTORS.BROWSER_CLOSE_CMD).catch(() => undefined);
  await session.detach().catch(() => undefined);
};

export const cancelActiveSunoCreation = async (): Promise<void> => {
  sunoCancellationRequested = true;
  await closeSunoChrome(activeSunoPage);
};

export const launchSunoLoginBrowser = async (): Promise<{ message: string; profilePath: string; cdpPort: number }> => {
  fs.mkdirSync(SUNO_PROFILE_DIR, { recursive: true });
  try {
    const browser = await chromium.connectOverCDP(SUNO_CDP_URL);
    const page = browser.contexts()[0]?.pages()[0] || await browser.contexts()[0]!.newPage();
    await page.goto(SUNO_AUTOMATION_CONFIG.SUNO_CREATE_URL, { waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_DOM_LOADED, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS }).catch(() => undefined);
    return { message: SUNO_AUTOMATION_TEXTS.CHROME_OPENED, profilePath: SUNO_PROFILE_DIR, cdpPort: SUNO_AUTOMATION_CONFIG.SUNO_CDP_PORT };
  } catch {}
  if (!fs.existsSync(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH)) throw new Error(SUNO_AUTOMATION_TEXTS.CHROME_NOT_FOUND_ERR);
  spawn(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH, [
    `--remote-debugging-port=${SUNO_AUTOMATION_CONFIG.SUNO_CDP_PORT}`,
    SUNO_AUTOMATION_CONFIG.CHROME_ARG_REMOTE_ORIGINS,
    `--user-data-dir=${SUNO_PROFILE_DIR}`,
    `--profile-directory=${SUNO_AUTOMATION_CONFIG.CHROME_DEFAULT_PROFILE}`,
    SUNO_AUTOMATION_CONFIG.CHROME_ARG_NO_FIRST_RUN,
    SUNO_AUTOMATION_CONFIG.CHROME_ARG_NO_DEFAULT_CHECK,
    SUNO_AUTOMATION_CONFIG.SUNO_CREATE_URL,
  ], { windowsHide: false, detached: true, stdio: "ignore" }).unref();
  return {
    message: SUNO_AUTOMATION_TEXTS.formatChromeLaunchedMsg(SUNO_AUTOMATION_CONFIG.EXPECTED_ACCOUNT_EMAIL),
    profilePath: SUNO_PROFILE_DIR,
    cdpPort: SUNO_AUTOMATION_CONFIG.SUNO_CDP_PORT,
  };
};

const firstVisible = async (page: Page, selectors: readonly string[] | string[], timeoutMs = 0): Promise<Locator | null> => {
  const deadline = Date.now() + timeoutMs;
  do {
    for (const selector of selectors) {
      const candidates = page.locator(selector);
      const count = await candidates.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = candidates.nth(index);
        if (await candidate.isVisible().catch(() => false)) return candidate;
      }
    }
    if (Date.now() < deadline) await page.waitForTimeout(Math.min(250, deadline - Date.now()));
  } while (Date.now() < deadline);
  return null;
};

export const findSunoStyleInput = async (page: Page): Promise<Locator | null> => {
  const styleHeadings = page.getByText(SUNO_AUTOMATION_PATTERNS.STYLE_HEADING, { exact: true });
  for (let index = 0; index < (await styleHeadings.count().catch(() => 0)); index += 1) {
    const heading = styleHeadings.nth(index);
    if (!(await heading.isVisible().catch(() => false))) continue;
    const sectionInput = heading
      .locator(SUNO_AUTOMATION_SELECTORS.STYLE_INPUT_CONTAINER_XPATH)
      .locator(SUNO_AUTOMATION_SELECTORS.STYLE_TEXTAREA_FILTER)
      .first();
    if (await sectionInput.isVisible().catch(() => false)) return sectionInput;
  }
  return firstVisible(page, SUNO_AUTOMATION_SELECTORS.STYLE_INPUT);
};

const dismissCookieConsent = async (page: Page): Promise<void> => {
  const consentDialog = page.locator(SUNO_AUTOMATION_SELECTORS.DIALOG_ROLE)
    .filter({ hasText: SUNO_AUTOMATION_PATTERNS.PRIVACY_CENTER });
  if (!(await consentDialog.first().isVisible().catch(() => false))) return;
  const dismissButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.COOKIE_CONSENT_BUTTON);
  if (!dismissButton) return;
  await dismissButton.click();
  await consentDialog.first().waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_HIDDEN, timeout: SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS });
};

const ensureSunoCreatePage = async (page: Page): Promise<void> => {
  for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.CREATE_PAGE_NAVIGATION_ATTEMPTS; attempt += 1) {
    await page.goto(SUNO_AUTOMATION_CONFIG.SUNO_CREATE_URL, {
      waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_DOM_LOADED,
      timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS,
    }).catch(() => undefined);
    await dismissCookieConsent(page);
    let isCreateRoute = SUNO_AUTOMATION_PATTERNS.CREATE_PATH.test(new URL(page.url()).pathname);
    if (!isCreateRoute) {
      const createNavigation = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.CREATE_NAVIGATION, SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS);
      if (createNavigation) {
        await createNavigation.click().catch(() => undefined);
        await page.waitForURL((url) => SUNO_AUTOMATION_PATTERNS.CREATE_PATH.test(url.pathname), {
          timeout: SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS,
        }).catch(() => undefined);
        isCreateRoute = SUNO_AUTOMATION_PATTERNS.CREATE_PATH.test(new URL(page.url()).pathname);
      }
    }
    const createForm = isCreateRoute
      ? await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED, SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS)
      : null;
    if (isCreateRoute && createForm) return;
  }
  throw new Error(SUNO_AUTOMATION_TEXTS.CREATE_PAGE_NOT_READY_ERR);
};

const revealSunoWindow = async (page: Page): Promise<void> => {
  await page.bringToFront();
  const session = await page.context().newCDPSession(page).catch(() => null);
  if (!session) return;
  try {
    const { windowId } = await session.send(SUNO_AUTOMATION_SELECTORS.BROWSER_GET_WINDOW_CMD);
    await session.send(SUNO_AUTOMATION_SELECTORS.BROWSER_SET_BOUNDS_CMD, { windowId, bounds: { windowState: SUNO_AUTOMATION_SELECTORS.WINDOW_STATE_NORMAL } });
  } finally {
    await session.detach().catch(() => undefined);
  }
};

const fillEditable = async (locator: Locator, value: string): Promise<void> => {
  await locator.fill(value).catch(async () => {
    await locator.click({ force: true });
    await locator.press(SUNO_AUTOMATION_SELECTORS.CONTROL_A);
    await locator.pressSequentially(value, { delay: 1 });
  });
};

const readEditable = async (locator: Locator): Promise<string> => {
  const value = await locator.inputValue().catch(() => "");
  if (!_.isEmpty(_.trim(value))) return _.trim(value);
  return _.trim(await locator.textContent().catch(() => "") || "");
};

const ensureSunoStyle = async (page: Page, style: string): Promise<void> => {
  const expectedStyle = _.trim(style);
  const styleInput = await findSunoStyleInput(page);
  if (!styleInput) throw new Error(SUNO_AUTOMATION_TEXTS.STYLE_INPUT_NOT_FOUND_ERR);
  if (!_.isEqual(await readEditable(styleInput), expectedStyle)) await fillEditable(styleInput, expectedStyle);
  if (!_.isEqual(await readEditable(styleInput), expectedStyle)) throw new Error(SUNO_AUTOMATION_TEXTS.STYLE_INPUT_NOT_APPLIED_ERR);
};

const formatNumberedSongTitle = (title: string, index: number): string =>
  `${index + 1}. ${_.trim(title).replace(SUNO_AUTOMATION_PATTERNS.LEADING_INDEX, "")}`;

const collectSongIds = async (page: Page): Promise<string[]> => {
  const hrefs = await page.locator(SUNO_AUTOMATION_SELECTORS.SONG_ANCHOR).evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href)).catch(() => [] as string[]);
  return _.uniq(_.compact(_.map(hrefs, (href) => href.match(SUNO_AUTOMATION_PATTERNS.SONG_URL)?.[1])));
};

export const verifySunoAccount = async (page: Page): Promise<void> => {
  let advancedControl = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED);
  if (!advancedControl) {
    await page.locator(SUNO_AUTOMATION_SELECTORS.ADVANCED.join(", ")).first()
      .waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS })
      .catch(() => undefined);
    advancedControl = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED);
  }
  const bodyText = await page.locator(SUNO_AUTOMATION_SELECTORS.BODY).innerText().catch(() => "");
  const hasExpectedWorkspace = SUNO_AUTOMATION_PATTERNS.EXPECTED_SUNO_PROFILE.test(bodyText);
  const hasCreateWorkspace = SUNO_AUTOMATION_PATTERNS.BODY_CREATE.test(bodyText)
    && SUNO_AUTOMATION_PATTERNS.BODY_LIBRARY_STUDIO.test(bodyText);
  const hasSignedInWorkspace = hasExpectedWorkspace && hasCreateWorkspace && Boolean(advancedControl);
  if (hasSignedInWorkspace) return;
  const diagnostic = bodyText.replace(SUNO_AUTOMATION_PATTERNS.WHITESPACES, " ").trim().slice(0, 240);
  throw new Error(`${SUNO_AUTOMATION_TEXTS.formatProfileNotSignedInErr(SUNO_AUTOMATION_CONFIG.EXPECTED_ACCOUNT_EMAIL)} ${SUNO_AUTOMATION_TEXTS.formatDiagnosticDisplay(diagnostic || SUNO_AUTOMATION_TEXTS.EMPTY_DIAGNOSTIC)}`);
};

const setRangeByLabel = async (page: Page, label: RegExp, value: number): Promise<void> => {
  let range = page.getByRole("slider", { name: label }).first();
  if (!(await range.isVisible().catch(() => false))) {
    const labelLocator = page.getByText(label, { exact: true }).first();
    if (!(await labelLocator.isVisible().catch(() => false))) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr(label.source));
    range = labelLocator.locator(SUNO_AUTOMATION_SELECTORS.RANGE_CONTAINER_XPATH).locator(SUNO_AUTOMATION_SELECTORS.RANGE_CONTROL).first();
  }
  if (!(await range.isVisible().catch(() => false))) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr(label.source));
  const container = range.locator("xpath=..");
  const tagName = await range.evaluate((element) => element.tagName.toLowerCase());
  const minimum = _.toNumber(await range.getAttribute("aria-valuemin") ?? await range.getAttribute("min") ?? 0);
  const maximum = _.toNumber(await range.getAttribute("aria-valuemax") ?? await range.getAttribute("max") ?? 100);
  const controlValue = minimum + ((maximum - minimum) * value / 100);
  const targetControlValue = tagName === "input" ? controlValue : Math.round(controlValue);
  if (tagName === "input") {
    await range.evaluate((element: HTMLInputElement, nextValue) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(element, String(nextValue));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, targetControlValue);
  } else {
    const currentValue = _.toNumber(await range.getAttribute("aria-valuenow"));
    if (!_.isFinite(currentValue)) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingNotAppliedErr(label.source));
    const difference = targetControlValue - currentValue;
    await range.focus();
    const key = difference >= 0 ? "ArrowRight" : "ArrowLeft";
    for (let step = 0; step < Math.abs(difference); step += 1) await range.press(key);
  }
  await page.waitForTimeout(250);
  const rawValue = tagName === "input" ? await range.inputValue().catch(() => "") : await range.getAttribute("aria-valuenow");
  const actualValue = _.toNumber(rawValue);
  const containerText = await container.innerText().catch(() => "");
  const applied = (_.isFinite(actualValue) && Math.abs(actualValue - targetControlValue) <= SUNO_AUTOMATION_CONFIG.RANGE_VALUE_TOLERANCE)
    || containerText.includes(`${value}%`);
  if (!applied) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingNotAppliedErr(label.source));
};

const selectOptionBySection = async (page: Page, sectionLabel: RegExp, optionText: string): Promise<void> => {
  const label = page.getByText(sectionLabel).first();
  if (!(await label.isVisible().catch(() => false))) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr(sectionLabel.source));
  const container = label.locator(SUNO_AUTOMATION_SELECTORS.formatOptionSectionXpath(optionText));
  const option = container.getByText(optionText, { exact: true }).first();
  if (!(await option.isVisible().catch(() => false))) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr(`${sectionLabel.source}: ${optionText}`));
  await option.click();
  await page.waitForTimeout(150);
  const button = option.locator("xpath=ancestor-or-self::button[1]");
  if (await button.count()) {
    const selected = await button.getAttribute("data-selected");
    if (selected !== null && selected !== SUNO_AUTOMATION_SELECTORS.VAL_TRUE) {
      throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingNotAppliedErr(`${sectionLabel.source}: ${optionText}`));
    }
  }
};

const ensureAdvancedMode = async (page: Page): Promise<void> => {
  const advanced = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED);
  if (!advanced) throw new Error(SUNO_AUTOMATION_TEXTS.ADVANCED_MODE_NOT_FOUND_ERR);
  await advanced.click();
};

const ensureMoreOptionsOpen = async (page: Page): Promise<void> => {
  const optionsButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.OPTIONS_BUTTON);
  if (!optionsButton) throw new Error(SUNO_AUTOMATION_TEXTS.MORE_OPTIONS_NOT_FOUND_ERR);
  if ((await optionsButton.getAttribute(SUNO_AUTOMATION_SELECTORS.ARIA_EXPANDED)) === SUNO_AUTOMATION_SELECTORS.VAL_TRUE) return;
  await optionsButton.click();
  const deadline = Date.now() + SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS;
  while ((await optionsButton.getAttribute(SUNO_AUTOMATION_SELECTORS.ARIA_EXPANDED)) !== SUNO_AUTOMATION_SELECTORS.VAL_TRUE) {
    ensureSunoNotCancelled();
    if (Date.now() >= deadline) throw new Error(SUNO_AUTOMATION_TEXTS.MORE_OPTIONS_NOT_FOUND_ERR);
    await page.waitForTimeout(250);
  }
};

const applySunoSetting = async (page: Page, label: string, action: () => Promise<void>): Promise<void> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.SUNO_SETTINGS_APPLY_ATTEMPTS; attempt += 1) {
    try {
      await ensureMoreOptionsOpen(page);
      await action();
      logger.info(SUNO_AUTOMATION_TEXTS.formatSettingAppliedLog(label));
      return;
    } catch (error) {
      lastError = error;
      if (attempt < SUNO_AUTOMATION_CONFIG.SUNO_SETTINGS_APPLY_ATTEMPTS - 1) {
        logger.warn(SUNO_AUTOMATION_TEXTS.formatSettingRetryLog(label, attempt + 2, _.toString(_.get(error, "message", error))));
        await page.waitForTimeout(500);
      }
    }
  }
  throw lastError;
};

export const configureAdvancedOnce = async (page: Page, style: string, aiSettings?: SunoAdvancedSettings, hasInspo = false): Promise<void> => {
  if (!aiSettings || !_.every([aiSettings.weirdness, aiSettings.styleInfluence, aiSettings.variety], (value) => _.isInteger(value) && _.inRange(value, 0, 101))) {
    throw new Error(SUNO_AUTOMATION_TEXTS.SUNO_SETTINGS_REQUIRED_ERR);
  }
  await ensureSunoStyle(page, style);

  await applySunoSetting(page, "Weirdness", () => setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.WEIRDNESS_LABEL, aiSettings.weirdness));
  await applySunoSetting(page, "Style Influence", () => setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.STYLE_INFLUENCE_LABEL, aiSettings.styleInfluence));
  const audioInfluenceControl = page.getByRole("slider", { name: SUNO_AUTOMATION_PATTERNS.AUDIO_INFLUENCE_LABEL }).first();
  if (hasInspo) {
    await audioInfluenceControl.waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS })
      .catch(() => { throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr("Audio Influence")); });
  }
  if (await audioInfluenceControl.isVisible().catch(() => false)) {
    if (!_.isInteger(aiSettings.audioInfluence) || !_.inRange(aiSettings.audioInfluence!, 0, 101)) throw new Error(SUNO_AUTOMATION_TEXTS.SUNO_SETTINGS_REQUIRED_ERR);
    await applySunoSetting(page, "Audio Influence", () => setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.AUDIO_INFLUENCE_LABEL, aiSettings.audioInfluence));
  } else {
    logger.info(SUNO_AUTOMATION_TEXTS.formatConditionalSettingUnavailableLog("Audio Influence"));
  }
  await applySunoSetting(page, "Variety", () => setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.VARIETY_LABEL, aiSettings.variety));
  await applySunoSetting(page, "Exclude styles", async () => {
      const excludeInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.EXCLUDE_STYLES_INPUT);
      if (!excludeInput) throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr("Exclude styles"));
      await fillEditable(excludeInput, _.trim(aiSettings.excludeStyles));
      if (!_.isEqual(_.trim(await excludeInput.inputValue()), _.trim(aiSettings.excludeStyles))) {
        throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingNotAppliedErr("Exclude styles"));
      }
  });
  await applySunoSetting(page, "Duration", () => selectOptionBySection(page, SUNO_AUTOMATION_PATTERNS.SECTION_DURATION, SUNO_AUTOMATION_CONFIG.OPTION_AUTO));
  await applySunoSetting(page, "Max Mode", () => selectOptionBySection(page, SUNO_AUTOMATION_PATTERNS.SECTION_MAX_MODE, aiSettings.maxMode ? SUNO_AUTOMATION_CONFIG.OPTION_ON : SUNO_AUTOMATION_CONFIG.OPTION_OFF));
  await applySunoSetting(page, "Personalize", () => selectOptionBySection(page, SUNO_AUTOMATION_PATTERNS.SECTION_PERSONALIZE, aiSettings.personalize ? SUNO_AUTOMATION_CONFIG.OPTION_ON : SUNO_AUTOMATION_CONFIG.OPTION_OFF));
  await applySunoSetting(page, "Vocal Gender", async () => {
      const genderButton = aiSettings.vocalGender === SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_FEMALE
        ? await firstVisible(page, SUNO_AUTOMATION_SELECTORS.FEMALE_BUTTON)
        : aiSettings.vocalGender === SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_MALE
          ? await firstVisible(page, SUNO_AUTOMATION_SELECTORS.MALE_BUTTON)
          : null;
      if (aiSettings.vocalGender !== SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_AUTO && !genderButton) {
        throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingControlNotFoundErr("Vocal Gender"));
      }
      if (genderButton) await genderButton.click();
      if (genderButton && await genderButton.getAttribute("data-selected") !== SUNO_AUTOMATION_SELECTORS.VAL_TRUE) {
        throw new Error(SUNO_AUTOMATION_TEXTS.formatSettingNotAppliedErr("Vocal Gender"));
      }
  });
};

export const selectInspoPlaylist = async (page: Page, inspo: string): Promise<void> => {
  const targetName = _.trim(inspo);
  if (_.isEmpty(targetName)) return;
  const inspoButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.INSPO_BUTTON, SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS);
  if (!inspoButton) throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_BUTTON_NOT_FOUND_ERR);
  await inspoButton.click();

  const searchInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.INSPO_SEARCH_INPUT, SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS);
  if (!searchInput) throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_SEARCH_NOT_FOUND_ERR);
  await fillEditable(searchInput, targetName);
  const inspoDialog = searchInput.locator('xpath=ancestor::*[@role="dialog"][1]');
  const exactResult = inspoDialog.getByText(targetName, { exact: true }).first();
  await exactResult.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.INSPO_RESULT_TIMEOUT_MS })
    .catch(() => { throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_NOT_APPLIED_ERR(targetName)); });
  const playlistRow = exactResult.locator(SUNO_AUTOMATION_CONFIG.XPATH_CURSOR_POINTER_DIV);
  if (await playlistRow.count().catch(() => 0)) await playlistRow.click();
  else await exactResult.click();
  await page.waitForFunction(({ conditionSelector, trackSelector }) => {
    const condition = document.querySelector(conditionSelector);
    return !!condition && condition.getClientRects().length > 0 &&
      Array.from(document.querySelectorAll(trackSelector)).some((track) => track.getClientRects().length > 0);
  }, {
    conditionSelector: SUNO_AUTOMATION_SELECTORS.INSPO_APPLIED_CONDITION,
    trackSelector: SUNO_AUTOMATION_SELECTORS.INSPO_APPLIED_TRACK,
  }, { timeout: SUNO_AUTOMATION_CONFIG.INSPO_RESULT_TIMEOUT_MS })
    .catch(() => { throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_NOT_APPLIED_ERR(targetName)); });
};

const createOneSong = async (page: Page, song: SunoSongInput): Promise<string[]> => {
  ensureSunoNotCancelled();
  const lyricsInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.LYRICS_INPUT);
  const titleInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.TITLE_INPUT);
  if (!lyricsInput || !titleInput) throw new Error(SUNO_AUTOMATION_TEXTS.formatInputsNotFoundErr(song.title));
  await fillEditable(lyricsInput, song.lyrics);
  await fillEditable(titleInput, song.title);

  const beforeIds = await collectSongIds(page);
  const createButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.CREATE_BUTTON);
  if (!createButton || (await createButton.isDisabled().catch(() => true))) throw new Error(SUNO_AUTOMATION_TEXTS.formatCreateButtonNotReadyErr(song.title));
  const generationResponse = page.waitForResponse(
    (response) => response.request().method() === SUNO_AUTOMATION_CONFIG.HTTP_METHOD_POST && SUNO_AUTOMATION_PATTERNS.GENERATE_API.test(response.url()),
    { timeout: SUNO_AUTOMATION_CONFIG.GENERATE_RESPONSE_TIMEOUT_MS },
  ).catch(() => null);
  await createButton.click();

  const response = await generationResponse;
  if (response?.ok()) {
    const payload = await response.json().catch(() => null);
    const responseIds = _.uniq(_.compact(_.map(_.castArray(_.get(payload, "clips", [])), (clip) => _.trim(_.toString(_.get(clip, "id"))))));
    if (!_.isEmpty(responseIds)) return responseIds;
  }

  const deadline = Date.now() + SUNO_AUTOMATION_CONFIG.CREATE_SONG_DEADLINE_MS;
  while (Date.now() < deadline) {
    ensureSunoNotCancelled();
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.POLL_INTERVAL_MS);
    const nextIds = _.difference(await collectSongIds(page), beforeIds);
    if (!_.isEmpty(nextIds)) return nextIds;
  }
  throw new Error(SUNO_AUTOMATION_TEXTS.formatSongIdTimeoutErr(song.title));
};

const getSunoClipStatus = async (page: Page, songId: string): Promise<string> => {
  const response = await page.request.get(`${SUNO_AUTOMATION_CONFIG.SUNO_STUDIO_API_URL}/api/clip/${songId}`).catch(() => null);
  if (!response?.ok()) return SUNO_AUTOMATION_CONFIG.STATUS_PENDING;
  const payload = await response.json().catch(() => null);
  return _.toLower(_.trim(_.toString(_.get(payload, "status", SUNO_AUTOMATION_CONFIG.STATUS_PENDING))));
};

const removeCompletedGenerations = async (page: Page, active: ActiveSunoGeneration[]): Promise<void> => {
  const terminalFailures = new Set<string>(SUNO_AUTOMATION_CONFIG.STATUS_TERMINAL_FAILURES);
  const statusesByGeneration = await Promise.all(active.map(async (generation) => ({
    generation,
    statuses: await Promise.all(generation.songIds.map((songId) => getSunoClipStatus(page, songId))),
  })));
  const failed = statusesByGeneration.find(({ statuses }) => statuses.some((status) => terminalFailures.has(status)));
  if (failed) throw new Error(`${SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR} ${failed.generation.title}`);
  _.remove(active, (generation) => {
    const current = statusesByGeneration.find((entry) => entry.generation === generation);
    return Boolean(current && current.statuses.length > 0 && current.statuses.every((status) => status === SUNO_AUTOMATION_CONFIG.STATUS_COMPLETE));
  });
};

const waitForGenerationCapacity = async (page: Page, active: ActiveSunoGeneration[], targetActiveCount: number): Promise<void> => {
  const deadline = Date.now() + SUNO_AUTOMATION_CONFIG.CREATE_SONG_DEADLINE_MS;
  while (active.length > targetActiveCount) {
    ensureSunoNotCancelled();
    await removeCompletedGenerations(page, active);
    if (active.length <= targetActiveCount) return;
    if (Date.now() >= deadline) throw new Error(SUNO_AUTOMATION_TEXTS.GENERATION_QUEUE_TIMEOUT_ERR);
    await waitWithCancellation(page, SUNO_AUTOMATION_CONFIG.GENERATION_SLOT_POLL_MS);
  }
};

const addSongIdsByPlaylistId = async (
  page: Page,
  requestHeaders: Record<string, string>,
  playlistId: string,
  songIds: string[],
): Promise<void> => {
  const uniqueSongIds = _.uniq(_.compact(songIds));
  if (_.isEmpty(uniqueSongIds)) return;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.PLAYLIST_ADD_ATTEMPTS; attempt += 1) {
  const response = await page.request.post(`${SUNO_AUTOMATION_CONFIG.SUNO_STUDIO_API_URL}/api/playlist/update_clips/`, {
    headers: {
      authorization: requestHeaders.authorization,
      [SUNO_AUTOMATION_CONFIG.HEADER_BROWSER_TOKEN]: requestHeaders[SUNO_AUTOMATION_CONFIG.HEADER_BROWSER_TOKEN],
      [SUNO_AUTOMATION_CONFIG.HEADER_DEVICE_ID]: requestHeaders[SUNO_AUTOMATION_CONFIG.HEADER_DEVICE_ID],
      [SUNO_AUTOMATION_CONFIG.HEADER_CONTENT_TYPE]: SUNO_AUTOMATION_CONFIG.MIME_APPLICATION_JSON,
    },
    data: {
      playlist_id: playlistId,
      update_type: SUNO_AUTOMATION_SELECTORS.UPDATE_TYPE_ADD,
      metadata: { clip_ids: uniqueSongIds },
      recommendation_metadata: {},
    },
  });
    lastStatus = response.status();
    lastBody = await response.text().catch(() => "");
    if (response.ok()) return;
    if (!SUNO_AUTOMATION_CONFIG.PLAYLIST_ADD_RETRY_STATUS_CODES.includes(lastStatus as 429 | 500 | 502 | 503 | 504)) break;
    await page.waitForTimeout(500 * (attempt + 1));
  }
  await writeMusicDiagnostic(SUNO_AUTOMATION_CONFIG.EVENT_PLAYLIST_ADD_RESPONSE, {
    playlistId,
    songCount: uniqueSongIds.length,
    code: String(lastStatus),
    body: _.truncate(lastBody, { length: 500 }),
  });
  throw new Error(SUNO_AUTOMATION_TEXTS.formatPlaylistBatchAddFailedErr(lastStatus));
};

const addSongsToPlaylist = async (page: Page, songIds: string[], playlistName: string, runId: string): Promise<string> => {
  ensureSunoNotCancelled();
  const uniqueSongIds = _.uniq(_.compact(songIds));
  await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}/song/${uniqueSongIds[0]}`, {
    waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_COMMIT,
    timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS,
  });
  const songMenu = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.MORE_MENU_BUTTON, SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS);
  if (!songMenu) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_MENU_NOT_FOUND_ERR);
  await songMenu.scrollIntoViewIfNeeded().catch(() => undefined);
  await songMenu.click({ force: true });
  const addButton = page.getByText(SUNO_AUTOMATION_SELECTORS.ADD_TO_PLAYLIST_TEXT, { exact: true }).last();
  await addButton.waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.PLAYLIST_OPTION_TIMEOUT_MS });
  await addButton.scrollIntoViewIfNeeded().catch(() => undefined);
  await addButton.click({ force: true });

  const nameInput = page.getByPlaceholder(SUNO_AUTOMATION_SELECTORS.PLAYLIST_NAME_PLACEHOLDER).first();
  await nameInput.waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  await fillEditable(nameInput, playlistName);
  const create = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.CREATE_PLAYLIST_BUTTON, SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS);
  if (!create) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_CREATE_BUTTON_NOT_FOUND_ERR);
  const playlistMutation = page.waitForResponse((response) =>
    SUNO_AUTOMATION_PATTERNS.PLAYLIST_CREATE_API.test(response.url())
    && response.request().method() === SUNO_AUTOMATION_CONFIG.HTTP_METHOD_POST,
  { timeout: SUNO_AUTOMATION_CONFIG.PLAYLIST_OPTION_TIMEOUT_MS });
  await create.scrollIntoViewIfNeeded().catch(() => undefined);
  await create.click({ force: true });
  const mutationResponse = await playlistMutation;
  const mutationPayload = mutationResponse.ok() ? await mutationResponse.json().catch(() => null) : null;
  await writeMusicDiagnostic("suno_playlist_create_response", { runId, stage: "create_playlist", code: String(mutationResponse.status()), status: mutationResponse.ok() ? "ok" : "failed", parsed: Boolean(mutationPayload) });
  const responsePlaylistId = _.trim(_.toString(
    mutationPayload?.id || mutationPayload?.playlist?.id || mutationPayload?.playlist_id || mutationPayload?.playlistId || mutationPayload?.data?.id || "",
  ));
  let playlistId = responsePlaylistId;
  let playlistHref = playlistId ? `/playlist/${encodeURIComponent(playlistId)}` : "";
  if (!playlistId) {
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_WAIT_MS);
    await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}/me/playlists`, { waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_COMMIT, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
    const playlistLink = page.getByRole("link", { name: playlistName, exact: true }).first();
    if (await playlistLink.waitFor({ state: SUNO_AUTOMATION_SELECTORS.STATE_VISIBLE, timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS }).then(() => true).catch(() => false)) {
      playlistHref = await playlistLink.getAttribute("href") || "";
      playlistId = playlistHref.match(SUNO_AUTOMATION_PATTERNS.PLAYLIST_ID_IN_HREF)?.[1] || "";
      if (playlistId && !mutationResponse.ok()) {
        await page.goto(new URL(playlistHref, SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL).toString(), { waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_COMMIT, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
        await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
        if (_.isEmpty(_.intersection(uniqueSongIds, await collectSongIds(page)))) playlistId = "";
      }
    }
  }
  if (!playlistId) throw new Error(`${SUNO_AUTOMATION_TEXTS.PLAYLIST_URL_NOT_FOUND_ERR} (HTTP ${mutationResponse.status()})`);

  const requestHeaders = mutationResponse.request().headers();
  await addSongIdsByPlaylistId(page, requestHeaders, playlistId, uniqueSongIds);

  const playlistUrl = new URL(playlistHref, SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL).toString();
  await page.goto(playlistUrl, { waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_COMMIT, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
  await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
  let missingIds = _.difference(uniqueSongIds, await collectSongIds(page));
  if (!_.isEmpty(missingIds)) {
    await addSongIdsByPlaylistId(page, requestHeaders, playlistId, missingIds);
    await page.reload({ waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_COMMIT, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
    missingIds = _.difference(uniqueSongIds, await collectSongIds(page));
  }
  if (!_.isEmpty(missingIds)) {
    logger.warn(SUNO_AUTOMATION_TEXTS.formatPlaylistMissingTracksErr(missingIds.length, uniqueSongIds.length));
  }
  return playlistUrl;
};

export const createSunoPlaylist = async (songs: SunoSongInput[], style: string, inspo: string = "", aiSettings?: SunoAdvancedSettings, initialSongIds: string[] = [], requestedPlaylistName: string = "", runId = `suno-create-${Date.now()}`): Promise<SunoCreationResult> => {
  if (_.isEmpty(songs) && _.isEmpty(initialSongIds)) throw new Error(SUNO_AUTOMATION_TEXTS.MISSING_SONGS_OR_STYLE_ERR);
  if (activeSunoPage) throw new Error(SUNO_AUTOMATION_TEXTS.ALREADY_RUNNING_ERR);
  sunoCancellationRequested = false;
  let stage = "connect_chrome";
  await writeMusicDiagnostic("suno_stage_started", { runId, stage });
  let browser: any;
  try { browser = await chromium.connectOverCDP(SUNO_CDP_URL); } catch {
    await launchSunoLoginBrowser();
    for (let attempt = 0; attempt < 30 && !browser; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      browser = await chromium.connectOverCDP(SUNO_CDP_URL).catch(() => null);
    }
    if (!browser) throw new Error(SUNO_AUTOMATION_TEXTS.CONNECT_CDP_ERR);
  }
  const context = browser.contexts()[0];
  if (!context) throw new Error(SUNO_AUTOMATION_TEXTS.CONNECT_CDP_ERR);
  const page = context.pages()[0] || await context.newPage();
  activeSunoPage = page;
  const createdSongIds: string[] = _.uniq(_.compact(_.map(initialSongIds, (id) => _.trim(_.toString(id)))));
  try {
    stage = "open_create_page";
    await writeMusicDiagnostic("suno_stage_started", { runId, stage });
    await revealSunoWindow(page);
    await ensureSunoCreatePage(page);
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.VERIFY_ACCOUNT_WAIT_MS);
    stage = "verify_account";
    await writeMusicDiagnostic("suno_stage_started", { runId, stage });
    await verifySunoAccount(page);
    if (!_.isEmpty(songs)) {
      stage = "configure_generation";
      await writeMusicDiagnostic("suno_stage_started", { runId, stage });
      await ensureAdvancedMode(page);
      const hasInspo = !_.isEmpty(_.trim(inspo));
      if (hasInspo) await selectInspoPlaylist(page, inspo);
      await configureAdvancedOnce(page, style, aiSettings, hasInspo);
      const activeGenerations: ActiveSunoGeneration[] = [];
      for (const [songIndex, song] of songs.entries()) {
        stage = "generate_song";
        await writeMusicDiagnostic("suno_song_started", { runId, stage, songIndex: songIndex + 1, songCount: songs.length });
        ensureSunoNotCancelled();
        await waitForGenerationCapacity(page, activeGenerations, SUNO_AUTOMATION_CONFIG.MAX_CONCURRENT_PROMPTS - 1);
        const numberedSong = { ...song, title: formatNumberedSongTitle(song.title, songIndex) };
        const promptBaselineIds = await collectSongIds(page);
        let songIds: string[] = [];
        for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.SUNO_CREATE_ACTION_ATTEMPTS && songIds.length < SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT; attempt += 1) {
          if (attempt > 0) await waitWithCancellation(page, SUNO_AUTOMATION_CONFIG.RETRY_PROMPT_DELAY_MS);
          try {
            songIds = _.uniq([...songIds, ...(await createOneSong(page, numberedSong))]);
          } catch (error) {
            await writeMusicDiagnostic("suno_song_attempt_failed", { runId, stage, songIndex: songIndex + 1, attempt: attempt + 1, ...musicErrorDetails(error) });
            songIds = _.uniq([...songIds, ..._.difference(await collectSongIds(page), promptBaselineIds)]);
            if (songIds.length >= SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT) break;
            if (sunoCancellationRequested || attempt >= SUNO_AUTOMATION_CONFIG.SUNO_CREATE_ACTION_ATTEMPTS - 1) throw error;
            logger.warn(SUNO_AUTOMATION_TEXTS.formatSunoCreateRetryLog(numberedSong.title, attempt + 2, _.toString(_.get(error, "message", error))));
            await waitWithCancellation(page, SUNO_AUTOMATION_CONFIG.SUNO_CREATE_ACTION_RETRY_MS);
          }
        }
        if (songIds.length < SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT) {
          throw new Error(SUNO_AUTOMATION_TEXTS.formatNotEnoughTracksErr(numberedSong.title, songIds.length, SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT));
        }
        createdSongIds.push(...songIds);
        await writeMusicDiagnostic("suno_song_completed", { runId, stage, songIndex: songIndex + 1, createdCount: songIds.length });
        activeGenerations.push({ title: numberedSong.title, songIds });
        if (songIndex < songs.length - 1) {
          await waitWithCancellation(page, SUNO_AUTOMATION_CONFIG.BETWEEN_SONG_PROMPTS_DELAY_MS);
        }
      }
      await waitForGenerationCapacity(page, activeGenerations, 0);
    }
    stage = "create_playlist";
    await writeMusicDiagnostic("suno_stage_started", { runId, stage, createdCount: createdSongIds.length });
    const playlistName = normalizeSunoPlaylistName(requestedPlaylistName) || formatSunoPlaylistName(
      _.trim(songs[0]?.title || SUNO_AUTOMATION_CONFIG.DEFAULT_COLLECTION_TITLE),
    );
    let playlistUrl: string;
    try {
      playlistUrl = await addSongsToPlaylist(page, _.uniq(createdSongIds), playlistName, runId);
      await writeMusicDiagnostic("suno_playlist_completed", { runId, stage, createdCount: _.uniq(createdSongIds).length });
    } catch (error) {
      await writeMusicDiagnostic("suno_playlist_failed", { runId, stage, createdCount: createdSongIds.length, ...musicErrorDetails(error) });
      if (createdSongIds.length && error instanceof Error) Object.assign(error, { createdSongIds: _.uniq(createdSongIds) });
      throw error;
    }
    return { playlistUrl, createdSongIds: _.uniq(createdSongIds) };
  } catch (error) {
    await writeMusicDiagnostic("suno_stage_failed", { runId, stage, createdCount: createdSongIds.length, ...musicErrorDetails(error) });
    if (sunoCancellationRequested) throw new Error(SUNO_AUTOMATION_TEXTS.CANCELLED_ERR);
    throw error;
  } finally {
    await closeSunoChrome(page);
    activeSunoPage = null;
    await browser.close().catch(() => undefined);
  }
};

export const getSunoPlaylistSongIds = async (playlistUrl: string): Promise<string[]> => {
  const normalizedUrl = _.trim(playlistUrl);
  if (!SUNO_AUTOMATION_PATTERNS.VALID_PLAYLIST_URL.test(normalizedUrl)) {
    throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_URL_NOT_FOUND_ERR);
  }
  const playlistId = normalizedUrl.match(SUNO_AUTOMATION_PATTERNS.PLAYLIST_ID_IN_HREF)?.[1];
  if (!_.isEmpty(playlistId)) {
    const response = await fetch(SUNO_AUTOMATION_CONFIG.formatPlaylistApiUrl(playlistId)).catch(() => null);
    if (response?.ok) {
      const payload = await response.json().catch(() => null);
      const songIds = _.uniq(_.compact(_.map(_.castArray(_.get(payload, "playlist_clips", [])), (item) =>
        _.trim(_.toString(_.get(item, "clip.id"))),
      )));
      if (!_.isEmpty(songIds)) return songIds;
    }
  }
  let browser: any;
  try { browser = await chromium.connectOverCDP(SUNO_CDP_URL); } catch {
    await launchSunoLoginBrowser();
    for (let attempt = 0; attempt < 30 && !browser; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      browser = await chromium.connectOverCDP(SUNO_CDP_URL).catch(() => null);
    }
  }
  if (!browser) throw new Error(SUNO_AUTOMATION_TEXTS.CONNECT_CDP_ERR);
  const context = browser.contexts()[0];
  if (!context) throw new Error(SUNO_AUTOMATION_TEXTS.CONNECT_CDP_ERR);
  const page = context.pages()[0] || await context.newPage();
  try {
    await revealSunoWindow(page);
    await page.goto(normalizedUrl, { waitUntil: SUNO_AUTOMATION_SELECTORS.WAIT_DOM_LOADED, timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
    const songIds = _.uniq(await collectSongIds(page));
    if (_.isEmpty(songIds)) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_URL_NOT_FOUND_ERR);
    return songIds;
  } finally {
    await closeSunoChrome(page);
    await browser.close().catch(() => undefined);
  }
};
