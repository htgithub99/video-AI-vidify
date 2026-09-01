import type { BrowserContext, Page } from "playwright";
import _ from "lodash";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../types.js";
import { CINEMATIC_CHAT_MODEL_LABELS, CINEMATIC_CHAT_PLANNING_CONFIG, EXTERNAL_URLS } from "../../constants/index.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { appLog, appWarn } from "../../lib/logger.js";
import { getOrLaunchGlobalBrowser, scheduleGlobalBrowserCleanup, SimpleMutex } from "./imageGeneratorService.js";

interface ChatPlanningRequest {
  provider: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  prompt: string;
  projectId: string;
  chromeHeadless?: boolean;
  expectedSceneIds?: string[];
  signal?: AbortSignal;
}

const planningMutex = new SimpleMutex();
const geminiRooms = new Map<string, Page>();
const grokRooms = new Map<string, Page>();
const chatGptRooms = new Map<string, Page>();
let activePlanningController: AbortController | undefined;
let activePlanningStartedAt = 0;
let activePlanningRunId = "";

export const beginChatPlanningRun = (runId: string, startedAt: number): { signal: AbortSignal; cancel: () => void } => {
  if (_.isEmpty(_.trim(runId)) || startedAt <= 0) {
    const unversionedController = new AbortController();
    unversionedController.abort();
    return { signal: unversionedController.signal, cancel: _.noop };
  }
  const hasActiveDifferentRun = activePlanningStartedAt > 0 && !_.isEqual(activePlanningRunId, runId);
  const isOlderOrUnversionedRun = startedAt <= 0 || activePlanningStartedAt > startedAt;
  if (hasActiveDifferentRun && isOlderOrUnversionedRun) {
    const rejectedController = new AbortController();
    rejectedController.abort();
    return { signal: rejectedController.signal, cancel: _.noop };
  }
  activePlanningController?.abort();
  const controller = new AbortController();
  activePlanningController = controller;
  activePlanningStartedAt = startedAt > 0 ? startedAt : Date.now();
  activePlanningRunId = runId;
  return { signal: controller.signal, cancel: () => controller.abort() };
};

export const cancelChatPlanningRun = (runId?: string): boolean => {
  if (!activePlanningController) return false;
  if (!_.isEmpty(_.trim(runId)) && !_.isEqual(activePlanningRunId, runId)) return false;
  activePlanningController.abort();
  activePlanningController = undefined;
  activePlanningStartedAt = 0;
  activePlanningRunId = "";
  return true;
};

const throwIfPlanningCancelled = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
};

const normalizeRoomPrompt = (prompt: string): string =>
  _.trim(
    _.replace(
      _.replace(prompt, CINEMATIC_CHAT_PLANNING_CONFIG.WINDOWS_LINE_ENDING_PATTERN, "\n"),
      CINEMATIC_CHAT_PLANNING_CONFIG.EXCESS_BLANK_LINES_PATTERN,
      "\n\n",
    ),
  );

const getLiveRoom = (rooms: Map<string, Page>, projectId: string): Page | undefined => {
  const room = rooms.get(projectId);
  if (room && !room.isClosed()) return room;
  rooms.delete(projectId);
  return undefined;
};

const createRoom = async (context: BrowserContext, url: string, rooms: Map<string, Page>, projectId: string): Promise<Page> => {
  const existingRoom = getLiveRoom(rooms, projectId);
  if (existingRoom) return existingRoom;
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
  rooms.set(projectId, page);
  return page;
};

const extractBalancedJsonArrays = (text: string): string[] => {
  const results: string[] = [];
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== "[") continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index++) {
      const character = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === "[") depth++;
      else if (character === "]") {
        depth--;
        if (depth === 0) {
          results.push(text.slice(start, index + 1));
          start = index;
          break;
        }
      }
    }
  }
  return results;
};

const extractPlanningJsonFromBody = (text: string, expectedSceneIds: string[]): string =>
  _.findLast(extractBalancedJsonArrays(text), (candidate) =>
    _.every([
      ..._.map(expectedSceneIds, (sceneId) => new RegExp(`"id"\\s*:\\s*"${_.escapeRegExp(sceneId)}"`).test(candidate)),
    ]),
  ) || "";

const extractLatestJsonArray = (text: string): string => _.last(extractBalancedJsonArrays(text)) || "";

const isPlanningResponseForScenes = (text: string, expectedSceneIds: string[]): boolean => {
  if (_.isEmpty(text)) return false;
  try {
    const parsed = JSON.parse(text);
    if (!_.isArray(parsed)) return false;
    const returnedSceneIds = _.map(parsed, (item) => _.toString(_.get(item, "id")));
    return _.every(expectedSceneIds, (sceneId) => _.includes(returnedSceneIds, sceneId));
  } catch {
    return false;
  }
};

const waitForStableResponse = async (
  page: Page,
  responseSelector: string,
  busySelector: string,
  initialCount: number,
  expectedSceneIds: string[],
  previousLastResponse: string,
  signal?: AbortSignal,
): Promise<string> => {
  const startedAt = Date.now();
  let previousText = "";
  let stablePolls = 0;
  let lastResponseCount = initialCount;
  let lastCandidateLength = 0;
  let lastBusyState = false;
  let lastIdentityMatch = false;
  while (Date.now() - startedAt < CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS) {
    throwIfPlanningCancelled(signal);
    const responses = page.locator(responseSelector);
    const count = await responses.count().catch(() => 0);
    const responseTexts = _.map(await responses.allTextContents().catch(() => []), (value) => _.trim(value));
    const lastResponse = _.trim(_.last(responseTexts) || "");
    const changedLastResponse = !_.isEmpty(lastResponse) && !_.isEqual(lastResponse, previousLastResponse) ? lastResponse : "";
    const newResponseTexts = count > initialCount ? _.slice(responseTexts, initialCount) : [];
    const responseCandidates = _.compact([...newResponseTexts, changedLastResponse]);
    const selectedResponse =
      _.findLast(_.map(responseCandidates, (value) => extractPlanningJsonFromBody(value, expectedSceneIds)), (value) => !_.isEmpty(value)) ||
      _.findLast(_.map(responseCandidates, extractLatestJsonArray), (value) => !_.isEmpty(value)) ||
      _.last(responseCandidates) ||
      "";
    const latestText = selectedResponse;
    const isBusy = await page.locator(busySelector).first().isVisible().catch(() => false);
    const belongsToCurrentRequest = _.isEmpty(expectedSceneIds) || isPlanningResponseForScenes(latestText, expectedSceneIds);
    lastResponseCount = count;
    lastCandidateLength = latestText.length;
    lastBusyState = isBusy;
    lastIdentityMatch = belongsToCurrentRequest;
    if (_.gte(latestText.length, CINEMATIC_CHAT_PLANNING_CONFIG.MIN_RESPONSE_CHARACTERS) && !isBusy) {
      stablePolls = _.isEqual(latestText, previousText) ? _.add(stablePolls, 1) : 0;
      previousText = latestText;
      if (_.gte(stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS)) return latestText;
    } else {
      stablePolls = 0;
      previousText = latestText;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  throw new Error(
    `AI Chat chưa hoàn tất phản hồi kế hoạch phim trong thời gian cho phép (responses=${lastResponseCount}, initial=${initialCount}, candidateLength=${lastCandidateLength}, busy=${lastBusyState}, identityMatch=${lastIdentityMatch}).`,
  );
};

const submitPrompt = async (
  page: Page,
  prompt: string,
  inputSelector: string,
  sendSelector: string,
  responseSelector: string,
  busySelector: string,
  expectedSceneIds: string[],
  signal?: AbortSignal,
): Promise<string> => {
  throwIfPlanningCancelled(signal);
  const input = page.locator(inputSelector).last();
  try {
    await input.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  } catch (error) {
    const title = await page.title().catch(() => "");
    throw new Error(
      `AI Chat chưa tìm thấy ô nhập (url=${page.url()}, title=${title}, selectorMatches=${await page.locator(inputSelector).count().catch(() => 0)}): ${_.toString(_.get(error, "message", error))}`,
    );
  }
  const initialCount = await page.locator(responseSelector).count().catch(() => 0);
  const previousLastResponse = _.trim(await page.locator(responseSelector).last().innerText().catch(() => ""));
  const normalizedPrompt = normalizeRoomPrompt(prompt);
  await input.fill(`${normalizedPrompt}\n\n${CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE}`);
  const sendButton = page.locator(sendSelector).last();
  if ((await sendButton.count()) > 0 && (await sendButton.isVisible().catch(() => false)) && (await sendButton.isEnabled().catch(() => false))) await sendButton.click();
  else await input.press("Enter");
  return waitForStableResponse(page, responseSelector, busySelector, initialCount, expectedSceneIds, previousLastResponse, signal);
};

const selectChatModel = async (page: Page, model: AiPlanningChatModel | undefined, buttonSelector: string): Promise<void> => {
  if (!model || _.isEqual(model, AiPlanningChatModel.ChatGptAuto)) return;
  const modelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const button = page.locator(buttonSelector).first();
  await button.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const currentModelLabel = _.trim(await button.innerText().catch(() => ""));
  if (modelLabel.test(currentModelLabel)) return;
  await button.click();
  const option = page.getByRole("menuitem", { name: modelLabel }).or(page.getByRole("menuitemradio", { name: modelLabel })).first();
  await option.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await option.click();
};

const ensureChatGptReady = async (page: Page, accountEmail: string): Promise<void> => {
  const input = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR).last();
  if (await input.isVisible().catch(() => false)) return;
  const cookieRejectControl = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_COOKIE_REJECT_SELECTOR).first();
  const cookieFallbackControl = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_COOKIE_ACTION_SELECTOR).last();
  if (await cookieRejectControl.isVisible().catch(() => false)) await cookieRejectControl.click();
  else if (await cookieFallbackControl.isVisible().catch(() => false)) await cookieFallbackControl.click();
  const loginControl = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_LOGIN_SELECTOR).first();
  if (await loginControl.isVisible().catch(() => false)) {
    await loginControl.evaluate((element: HTMLElement) => element.click());
    await page.waitForLoadState("domcontentloaded").catch(() => {});
  }
  const googleLoginControl = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_GOOGLE_LOGIN_SELECTOR).first();
  if (await googleLoginControl.isVisible().catch(() => false)) {
    const popupPromise = page.context().waitForEvent("page", { timeout: 5000 }).catch(() => undefined);
    await googleLoginControl.evaluate((element: HTMLElement) => element.click());
    const authPage = (await popupPromise) || page;
    await authPage.waitForLoadState("domcontentloaded").catch(() => {});
    const accountControl = authPage.getByText(accountEmail, { exact: false }).first();
    if (await accountControl.isVisible().catch(() => false)) await accountControl.click();
    if (authPage !== page) await authPage.waitForEvent("close", { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS }).catch(() => {});
  }
  try {
    await input.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  } catch (error) {
    throw new Error(
      `ChatGPT chưa hoàn tất đăng nhập (url=${page.url()}, title=${await page.title().catch(() => "")}): ${_.toString(_.get(error, "message", error))}`,
    );
  }
};

const generateWithGeminiChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, request.projectId);
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithGrokChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, request.projectId);
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_MODEL_BUTTON_SELECTOR);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithChatGptUi = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, request.projectId);
  await ensureChatGptReady(room, browser.account.email);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const providerNames: Record<AiPlanningFallbackProvider, string> = {
  [AiPlanningFallbackProvider.GeminiChat]: "Gemini Chat",
  [AiPlanningFallbackProvider.GrokChat]: "Grok Chat",
  [AiPlanningFallbackProvider.ChatGptUi]: "ChatGPT",
  [AiPlanningFallbackProvider.Disabled]: "Disabled",
};

const providerGenerators: Partial<Record<AiPlanningFallbackProvider, (request: ChatPlanningRequest) => Promise<string>>> = {
  [AiPlanningFallbackProvider.GeminiChat]: generateWithGeminiChat,
  [AiPlanningFallbackProvider.GrokChat]: generateWithGrokChat,
  [AiPlanningFallbackProvider.ChatGptUi]: generateWithChatGptUi,
};

export const generatePlanningWithChatUi = async (request: ChatPlanningRequest): Promise<{ text: string; provider: AiPlanningFallbackProvider }> => {
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.Disabled)) throw new Error("AI Chat dự phòng đang tắt.");
  throwIfPlanningCancelled(request.signal);
  const release = await planningMutex.acquire();
  try {
    throwIfPlanningCancelled(request.signal);
    appLog(`[AI Chat Planning] Đang sử dụng ${providerNames[request.provider]} cho project ${request.projectId}.`);
    const generator = providerGenerators[request.provider];
    if (!generator) throw new Error("AI Chat dự phòng chưa được hỗ trợ.");
    const text = await generator(request);
    return { text, provider: request.provider };
  } catch (error) {
    if (!_.isEqual(_.toString(_.get(error, "message", error)), CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)) {
      appWarn(`[AI Chat Planning] ${providerNames[request.provider]} chưa hoàn tất: ${_.toString(_.get(error, "message", error))}`);
    }
    throw error;
  } finally {
    release();
  }
};
