import type { BrowserContext, Page } from "playwright";
import _ from "lodash";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../types.js";
import { CINEMATIC_CHAT_MODEL_LABELS, CINEMATIC_CHAT_PLANNING_CONFIG, EXTERNAL_URLS } from "../../constants/index.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { appLog } from "../../lib/logger.js";
import { getOrLaunchGlobalBrowser, getOrLaunchGrokBrowser, scheduleGlobalBrowserCleanup, SimpleMutex } from "./imageGeneratorService.js";

interface ChatPlanningRequest {
  provider: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  prompt: string;
  projectId: string;
  chromeHeadless?: boolean;
  expectedSceneIds?: string[];
}

const planningMutex = new SimpleMutex();
const geminiRooms = new Map<string, Page>();
const grokRooms = new Map<string, Page>();
const chatGptRooms = new Map<string, Page>();

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
  useBodyJsonFallback: boolean,
  previousBodyResponse: string,
  previousLastResponse: string,
): Promise<string> => {
  const startedAt = Date.now();
  let previousText = "";
  let stablePolls = 0;
  while (Date.now() - startedAt < CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS) {
    const responses = page.locator(responseSelector);
    const count = await responses.count().catch(() => 0);
    const responseTexts = _.map(await responses.allTextContents().catch(() => []), (value) => _.trim(value));
    const lastResponse = _.trim(_.last(responseTexts) || "");
    const changedLastResponse = !_.isEmpty(lastResponse) && !_.isEqual(lastResponse, previousLastResponse) ? lastResponse : "";
    const newResponseTexts = count > initialCount ? _.slice(responseTexts, initialCount) : [];
    const responseCandidates = _.compact([...newResponseTexts, changedLastResponse]);
    const selectedResponse =
      _.findLast(_.map(responseCandidates, (value) => extractPlanningJsonFromBody(value, expectedSceneIds)), (value) => !_.isEmpty(value)) ||
      _.last(responseCandidates) ||
      "";
    const extractedBodyResponse = useBodyJsonFallback
      ? extractPlanningJsonFromBody(await page.locator("body").innerText().catch(() => ""), expectedSceneIds)
      : "";
    const bodyResponse = !_.isEqual(extractedBodyResponse, previousBodyResponse) ? extractedBodyResponse : "";
    const latestText = bodyResponse || selectedResponse;
    const isBusy = await page.locator(busySelector).first().isVisible().catch(() => false);
    const belongsToCurrentRequest = _.isEmpty(expectedSceneIds) || isPlanningResponseForScenes(latestText, expectedSceneIds);
    if (_.gte(latestText.length, CINEMATIC_CHAT_PLANNING_CONFIG.MIN_RESPONSE_CHARACTERS) && belongsToCurrentRequest && !isBusy) {
      stablePolls = _.isEqual(latestText, previousText) ? _.add(stablePolls, 1) : 0;
      previousText = latestText;
      if (_.gte(stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS)) return latestText;
    } else {
      stablePolls = 0;
      previousText = latestText;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  throw new Error("AI Chat chưa hoàn tất phản hồi kế hoạch phim trong thời gian cho phép.");
};

const submitPrompt = async (
  page: Page,
  prompt: string,
  inputSelector: string,
  sendSelector: string,
  responseSelector: string,
  busySelector: string,
  expectedSceneIds: string[],
  useBodyJsonFallback = false,
): Promise<string> => {
  const input = page.locator(inputSelector).last();
  await input.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const initialCount = await page.locator(responseSelector).count().catch(() => 0);
  const previousLastResponse = _.trim(await page.locator(responseSelector).last().innerText().catch(() => ""));
  const previousBodyResponse = useBodyJsonFallback
    ? extractPlanningJsonFromBody(await page.locator("body").innerText().catch(() => ""), expectedSceneIds)
    : "";
  await input.fill(`${prompt}\n\n${CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE}`);
  const sendButton = page.locator(sendSelector).last();
  if ((await sendButton.count()) > 0 && (await sendButton.isVisible().catch(() => false)) && (await sendButton.isEnabled().catch(() => false))) await sendButton.click();
  else await input.press("Enter");
  return waitForStableResponse(page, responseSelector, busySelector, initialCount, expectedSceneIds, useBodyJsonFallback, previousBodyResponse, previousLastResponse);
};

const selectChatModel = async (page: Page, model: AiPlanningChatModel | undefined, buttonSelector: string): Promise<void> => {
  if (!model || _.isEqual(model, AiPlanningChatModel.ChatGptAuto)) return;
  const modelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const button = page.locator(buttonSelector).first();
  await button.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await button.click();
  const option = page.getByRole("menuitem", { name: modelLabel }).or(page.getByRole("menuitemradio", { name: modelLabel })).first();
  await option.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await option.click();
};

const generateWithGeminiChat = async (request: ChatPlanningRequest): Promise<string> => {
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
    true,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithGrokChat = async (request: ChatPlanningRequest): Promise<string> => {
  const browser = await getOrLaunchGrokBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, request.projectId);
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_MODEL_BUTTON_SELECTOR);
  return submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    true,
  );
};

const generateWithChatGptUi = async (request: ChatPlanningRequest): Promise<string> => {
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, request.projectId);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    true,
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
  const release = await planningMutex.acquire();
  try {
    appLog(`[AI Chat Planning] Đang sử dụng ${providerNames[request.provider]} cho project ${request.projectId}.`);
    const generator = providerGenerators[request.provider];
    if (!generator) throw new Error("AI Chat dự phòng chưa được hỗ trợ.");
    const text = await generator(request);
    return { text, provider: request.provider };
  } finally {
    release();
  }
};
