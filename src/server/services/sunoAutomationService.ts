import _ from "lodash";
import type { Locator, Page } from "playwright";
import { chromium } from "playwright-extra";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { getDataDirectory } from "../utils/paths.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";
import {
  SUNO_AUTOMATION_CONFIG,
  SUNO_AUTOMATION_PATTERNS,
  SUNO_AUTOMATION_SELECTORS,
  SUNO_AUTOMATION_TEXTS,
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
export interface SunoAdvancedSettings { excludeStyles?: string; vocalGender?: "male" | "female" | "auto"; duration?: "auto"; maxMode?: boolean; weirdness?: number; styleInfluence?: number; variety?: number; personalize?: boolean }

const SUNO_PROFILE_DIR = path.join(process.env.LOCALAPPDATA || getDataDirectory(), "VideoAI-Vidify", SUNO_AUTOMATION_CONFIG.SUNO_PROFILE_DIR_NAME);
const SUNO_CDP_URL = `http://${SUNO_AUTOMATION_CONFIG.SUNO_CDP_HOST}:${SUNO_AUTOMATION_CONFIG.SUNO_CDP_PORT}`;

export const launchSunoLoginBrowser = async (): Promise<{ message: string; profilePath: string; cdpPort: number }> => {
  fs.mkdirSync(SUNO_PROFILE_DIR, { recursive: true });
  try {
    const browser = await chromium.connectOverCDP(SUNO_CDP_URL);
    const page = browser.contexts()[0]?.pages()[0] || await browser.contexts()[0]!.newPage();
    await page.goto(SUNO_AUTOMATION_CONFIG.SUNO_CREATE_URL, { waitUntil: "domcontentloaded", timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS }).catch(() => undefined);
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

const firstVisible = async (page: Page, selectors: readonly string[] | string[]): Promise<Locator | null> => {
  for (const selector of selectors) {
    const candidates = page.locator(selector);
    const count = await candidates.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
  }
  return null;
};

const fillEditable = async (locator: Locator, value: string): Promise<void> => {
  await locator.click();
  await locator.fill(value).catch(async () => {
    await locator.press("Control+A");
    await locator.pressSequentially(value, { delay: 1 });
  });
};

const formatNumberedSongTitle = (title: string, index: number): string =>
  `${index + 1}. ${_.trim(title).replace(/^\d+[.)]\s*/, "")}`;

const collectSongIds = async (page: Page): Promise<string[]> => {
  const hrefs = await page.locator(SUNO_AUTOMATION_SELECTORS.SONG_ANCHOR).evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href)).catch(() => [] as string[]);
  return _.uniq(_.compact(_.map(hrefs, (href) => href.match(SUNO_AUTOMATION_PATTERNS.SONG_URL)?.[1])));
};

const verifySunoAccount = async (page: Page): Promise<void> => {
  const advancedControl = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED);
  if (!advancedControl) {
    await page.locator(SUNO_AUTOMATION_SELECTORS.ADVANCED.join(", ")).first()
      .waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.CREATE_FORM_TIMEOUT_MS })
      .catch(() => undefined);
  }
  const bodyText = await page.locator(SUNO_AUTOMATION_SELECTORS.BODY).innerText().catch(() => "");
  const hasExpectedWorkspace = SUNO_AUTOMATION_PATTERNS.EXPECTED_SUNO_PROFILE.test(bodyText);
  const hasCreateWorkspace = SUNO_AUTOMATION_PATTERNS.BODY_CREATE.test(bodyText)
    && SUNO_AUTOMATION_PATTERNS.BODY_LIBRARY_STUDIO.test(bodyText);
  const hasCreationForm = /Advanced/i.test(bodyText) && /(Lyrics|Styles|Inspo)/i.test(bodyText);
  const hasSignedInWorkspace = hasExpectedWorkspace && hasCreateWorkspace && hasCreationForm;
  if (hasSignedInWorkspace) return;
  const diagnostic = bodyText.replace(/\s+/g, " ").trim().slice(0, 240);
  throw new Error(`${SUNO_AUTOMATION_TEXTS.formatProfileNotSignedInErr(SUNO_AUTOMATION_CONFIG.EXPECTED_ACCOUNT_EMAIL)} Suno hiện hiển thị: ${diagnostic || "trang trống"}`);
};

const setRangeByLabel = async (page: Page, label: RegExp, value: number): Promise<void> => {
  const labelLocator = page.getByText(label).first();
  if (!(await labelLocator.isVisible().catch(() => false))) return;
  const container = labelLocator.locator(SUNO_AUTOMATION_SELECTORS.RANGE_CONTAINER_XPATH);
  const range = container.locator(SUNO_AUTOMATION_SELECTORS.RANGE_INPUT).first();
  if (!(await range.count())) return;
  await range.evaluate((element: HTMLInputElement, nextValue) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, String(nextValue));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
};

const selectOptionBySection = async (page: Page, sectionLabel: RegExp, optionText: string): Promise<void> => {
  const label = page.getByText(sectionLabel).first();
  if (!(await label.isVisible().catch(() => false))) return;
  const container = label.locator("xpath=ancestor::*[.//button][1]");
  const option = container.getByText(optionText, { exact: true }).first();
  if (await option.isVisible().catch(() => false)) await option.click().catch(() => undefined);
};

const ensureAdvancedMode = async (page: Page): Promise<void> => {
  const advanced = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.ADVANCED);
  if (!advanced) throw new Error(SUNO_AUTOMATION_TEXTS.ADVANCED_MODE_NOT_FOUND_ERR);
  await advanced.click();
};

const configureAdvancedOnce = async (page: Page, style: string, aiSettings?: SunoAdvancedSettings): Promise<void> => {
  const styleInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.STYLE_INPUT);
  if (!styleInput) throw new Error(SUNO_AUTOMATION_TEXTS.STYLE_INPUT_NOT_FOUND_ERR);
  await fillEditable(styleInput, style);

  const optionsButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.OPTIONS_BUTTON);
  if (optionsButton) await optionsButton.click().catch(() => undefined);

  const normalizedStyle = style.toLocaleLowerCase("vi");
  const isGentleGenre = SUNO_AUTOMATION_PATTERNS.GENTLE_GENRE.test(normalizedStyle);
  await setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.WEIRDNESS_LABEL, aiSettings?.weirdness ?? (isGentleGenre ? SUNO_AUTOMATION_CONFIG.WEIRDNESS_GENTLE : SUNO_AUTOMATION_CONFIG.WEIRDNESS_DEFAULT));
  await setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.STYLE_INFLUENCE_LABEL, aiSettings?.styleInfluence ?? (isGentleGenre ? SUNO_AUTOMATION_CONFIG.STYLE_INFLUENCE_GENTLE : SUNO_AUTOMATION_CONFIG.STYLE_INFLUENCE_DEFAULT));
  await setRangeByLabel(page, SUNO_AUTOMATION_PATTERNS.VARIETY_LABEL, aiSettings?.variety ?? (isGentleGenre ? SUNO_AUTOMATION_CONFIG.VARIETY_GENTLE : SUNO_AUTOMATION_CONFIG.VARIETY_DEFAULT));
  const excludeInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.EXCLUDE_STYLES_INPUT);
  if (excludeInput && !_.isEmpty(_.trim(aiSettings?.excludeStyles))) await fillEditable(excludeInput, _.trim(aiSettings?.excludeStyles));
  await selectOptionBySection(page, /Duration/i, "Auto");
  await selectOptionBySection(page, /Max Mode/i, aiSettings?.maxMode ? "On" : "Off");
  await selectOptionBySection(page, /Personalize/i, aiSettings?.personalize ? "On" : "Off");

  const resolvedGender = aiSettings?.vocalGender || (SUNO_AUTOMATION_PATTERNS.FEMALE_VOICE.test(normalizedStyle) ? "female" : SUNO_AUTOMATION_PATTERNS.MALE_VOICE.test(normalizedStyle) ? "male" : "auto");
  if (resolvedGender === "female") {
    const female = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.FEMALE_BUTTON);
    if (female) await female.click().catch(() => undefined);
  } else if (resolvedGender === "male") {
    const male = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.MALE_BUTTON);
    if (male) await male.click().catch(() => undefined);
  }
};

const selectInspoPlaylist = async (page: Page, inspo: string): Promise<void> => {
  const targetName = _.trim(inspo);
  if (_.isEmpty(targetName)) return;
  const inspoButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.INSPO_BUTTON);
  if (!inspoButton) throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_BUTTON_NOT_FOUND_ERR);
  await inspoButton.click();

  const searchInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.INSPO_SEARCH_INPUT);
  if (!searchInput) throw new Error(SUNO_AUTOMATION_TEXTS.INSPO_SEARCH_NOT_FOUND_ERR);
  await fillEditable(searchInput, targetName);
  await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.INSPO_SEARCH_WAIT_MS);

  const dialog = page.locator(SUNO_AUTOMATION_SELECTORS.DIALOG_ROLE).last();
  const exactResult = (await dialog.count().catch(() => 0))
    ? dialog.getByText(targetName, { exact: true })
    : page.getByText(targetName, { exact: true });
  const resultCount = await exactResult.count().catch(() => 0);
  let selected = false;
  for (let index = 0; index < resultCount; index += 1) {
    const candidate = exactResult.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    await candidate.click();
    selected = true;
    break;
  }
  if (!selected) throw new Error(SUNO_AUTOMATION_TEXTS.formatInspoNotFoundErr(targetName));
  await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.INSPO_SELECT_WAIT_MS);
};

const createOneSong = async (page: Page, song: SunoSongInput): Promise<string[]> => {
  const lyricsInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.LYRICS_INPUT);
  const titleInput = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.TITLE_INPUT);
  if (!lyricsInput || !titleInput) throw new Error(SUNO_AUTOMATION_TEXTS.formatInputsNotFoundErr(song.title));
  await fillEditable(lyricsInput, song.lyrics);
  await fillEditable(titleInput, song.title);

  const beforeIds = await collectSongIds(page);
  const createButton = await firstVisible(page, SUNO_AUTOMATION_SELECTORS.CREATE_BUTTON);
  if (!createButton || (await createButton.isDisabled().catch(() => true))) throw new Error(SUNO_AUTOMATION_TEXTS.formatCreateButtonNotReadyErr(song.title));
  const generationResponse = page.waitForResponse(
    (response) => response.request().method() === "POST" && SUNO_AUTOMATION_PATTERNS.GENERATE_API.test(response.url()),
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
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.POLL_INTERVAL_MS);
    const nextIds = _.difference(await collectSongIds(page), beforeIds);
    if (!_.isEmpty(nextIds)) return nextIds;
  }
  throw new Error(SUNO_AUTOMATION_TEXTS.formatSongIdTimeoutErr(song.title));
};

const addSongIdsByPlaylistId = async (
  page: Page,
  requestHeaders: Record<string, string>,
  playlistId: string,
  songIds: string[],
): Promise<void> => {
  const response = await page.request.post(`${SUNO_AUTOMATION_CONFIG.SUNO_STUDIO_API_URL}/api/playlist/update_clips/`, {
    headers: {
      authorization: requestHeaders.authorization,
      "browser-token": requestHeaders["browser-token"],
      "device-id": requestHeaders["device-id"],
      "content-type": "application/json",
    },
    data: {
      playlist_id: playlistId,
      update_type: "add",
      metadata: { clip_ids: songIds },
      recommendation_metadata: {},
    },
  });
  if (!response.ok()) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_BATCH_ADD_FAILED_ERR);
};

const addSongsToPlaylist = async (page: Page, songIds: string[], playlistName: string): Promise<string> => {
  const uniqueSongIds = _.uniq(_.compact(songIds));
  await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}/song/${uniqueSongIds[0]}`, {
    waitUntil: "commit",
    timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS,
  });
  const songMenu = page.getByRole("button", { name: "More menu contents" }).first();
  await songMenu.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  await songMenu.click();
  const addButton = page.getByText("Add to Playlist", { exact: true }).last();
  await addButton.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.PLAYLIST_OPTION_TIMEOUT_MS });
  await addButton.click();

  const nameInput = page.getByPlaceholder("Playlist Name").first();
  await nameInput.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  await fillEditable(nameInput, playlistName);
  const create = page.getByRole("button", { name: "Create Playlist", exact: true }).first();
  await create.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  const playlistMutation = page.waitForRequest((request) =>
    /studio-api-prod\.suno\.com\/api\/playlist\//i.test(request.url())
    && ["POST", "PUT", "PATCH"].includes(request.method()),
  { timeout: SUNO_AUTOMATION_CONFIG.PLAYLIST_OPTION_TIMEOUT_MS });
  await create.click();
  const mutationRequest = await playlistMutation;
  await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_WAIT_MS);

  await page.goto(`${SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL}/me/playlists`, { waitUntil: "commit", timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
  const playlistLink = page.getByRole("link", { name: playlistName, exact: true }).first();
  await playlistLink.waitFor({ state: "visible", timeout: SUNO_AUTOMATION_CONFIG.SONG_PAGE_READY_TIMEOUT_MS });
  const playlistHref = await playlistLink.getAttribute("href");
  if (!playlistHref) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_URL_NOT_FOUND_ERR);
  const playlistId = playlistHref.match(/\/playlist\/([^/?]+)/i)?.[1];
  if (!playlistId) throw new Error(SUNO_AUTOMATION_TEXTS.PLAYLIST_URL_NOT_FOUND_ERR);

  const requestHeaders = mutationRequest.headers();
  await addSongIdsByPlaylistId(page, requestHeaders, playlistId, uniqueSongIds);

  const playlistUrl = new URL(playlistHref, SUNO_AUTOMATION_CONFIG.SUNO_BASE_URL).toString();
  await page.goto(playlistUrl, { waitUntil: "commit", timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
  await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
  let missingIds = _.difference(uniqueSongIds, await collectSongIds(page));
  if (!_.isEmpty(missingIds)) {
    await addSongIdsByPlaylistId(page, requestHeaders, playlistId, missingIds);
    await page.reload({ waitUntil: "commit", timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.PLAYLIST_VERIFY_WAIT_MS);
    missingIds = _.difference(uniqueSongIds, await collectSongIds(page));
  }
  if (!_.isEmpty(missingIds)) throw new Error(SUNO_AUTOMATION_TEXTS.formatPlaylistMissingTracksErr(missingIds.length, uniqueSongIds.length));
  return playlistUrl;
};

export const createSunoPlaylist = async (songs: SunoSongInput[], style: string, inspo: string = "", aiSettings?: SunoAdvancedSettings, initialSongIds: string[] = []): Promise<SunoCreationResult> => {
  if ((_.isEmpty(songs) && _.isEmpty(initialSongIds)) || _.isEmpty(_.trim(style))) throw new Error(SUNO_AUTOMATION_TEXTS.MISSING_SONGS_OR_STYLE_ERR);
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
  const createdSongIds: string[] = _.uniq(_.compact(_.map(initialSongIds, (id) => _.trim(_.toString(id)))));
  try {
    await page.goto(SUNO_AUTOMATION_CONFIG.SUNO_CREATE_URL, { waitUntil: "domcontentloaded", timeout: SUNO_AUTOMATION_CONFIG.GOTO_PAGE_TIMEOUT_MS });
    await page.waitForTimeout(SUNO_AUTOMATION_CONFIG.VERIFY_ACCOUNT_WAIT_MS);
    await verifySunoAccount(page);
    if (!_.isEmpty(songs)) {
      await ensureAdvancedMode(page);
      await selectInspoPlaylist(page, inspo);
      await configureAdvancedOnce(page, style, aiSettings);
      for (const [songIndex, song] of songs.entries()) {
        const numberedSong = { ...song, title: formatNumberedSongTitle(song.title, songIndex) };
        let songIds: string[] = [];
        for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.CREATE_ATTEMPTS_PER_PROMPT && songIds.length < SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT; attempt += 1) {
          songIds = _.uniq([...songIds, ...(await createOneSong(page, numberedSong))]);
        }
        if (songIds.length < SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT) {
          throw new Error(SUNO_AUTOMATION_TEXTS.formatNotEnoughTracksErr(numberedSong.title, songIds.length, SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT));
        }
        createdSongIds.push(...songIds);
      }
    }
    const createdAt = new Date().toISOString().replace("T", " ").slice(0, 19).replace(/:/g, "-");
    const playlistName = !_.isEmpty(songs)
      ? `${_.trim(songs[0]?.title || SUNO_AUTOMATION_CONFIG.DEFAULT_COLLECTION_TITLE)} và ${Math.max(0, songs.length - 1)} bài hát - ${createdAt}`
      : `${SUNO_AUTOMATION_CONFIG.DEFAULT_COLLECTION_TITLE} - ${createdAt}`;
    const playlistUrl = await addSongsToPlaylist(page, _.uniq(createdSongIds), playlistName);
    return { playlistUrl, createdSongIds: _.uniq(createdSongIds) };
  } finally {
    await browser.close().catch(() => undefined);
  }
};
