import type { BrowserContext, Locator, Page } from "playwright";
import _ from "lodash";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../types.js";
import { CINEMATIC_CHAT_MODEL_LABELS, CINEMATIC_CHAT_PLANNING_CONFIG, EXTERNAL_URLS } from "../../constants/index.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { appLog, appWarn } from "../../lib/logger.js";
import { getOrLaunchGlobalBrowser, scheduleGlobalBrowserCleanup, SimpleMutex } from "./imageGeneratorService.js";

export interface ChatRoomAttachment {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

interface ChatPlanningRequest {
  provider: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  prompt: string;
  projectId: string;
  chromeHeadless?: boolean;
  expectedSceneIds?: string[];
  workerId?: string;
  signal?: AbortSignal;
  attachments?: ChatRoomAttachment[];
  completionMarker?: string;
  closeRoomOnComplete?: boolean;
}

const planningMutexes = new Map<string, SimpleMutex>();
const geminiRooms = new Map<string, Page>();
const grokRooms = new Map<string, Page>();
const chatGptRooms = new Map<string, Page>();
interface ActivePlanningController {
  controller: AbortController;
  provider: AiPlanningFallbackProvider;
}

const activePlanningControllers = new Map<string, Map<string, ActivePlanningController>>();

export const beginChatPlanningRun = (
  runId: string,
  startedAt: number,
  workerId: string = CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID,
  provider: AiPlanningFallbackProvider = AiPlanningFallbackProvider.Disabled,
): { signal: AbortSignal; cancel: () => void; complete: () => void } => {
  if (_.isEmpty(_.trim(runId)) || startedAt <= 0) {
    const unversionedController = new AbortController();
    unversionedController.abort();
    return { signal: unversionedController.signal, cancel: _.noop, complete: _.noop };
  }
  const runControllers = activePlanningControllers.get(runId) || new Map<string, ActivePlanningController>();
  runControllers.get(workerId)?.controller.abort();
  const controller = new AbortController();
  runControllers.set(workerId, { controller, provider });
  activePlanningControllers.set(runId, runControllers);
  const complete = () => {
    const currentRunControllers = activePlanningControllers.get(runId);
    if (!_.isEqual(currentRunControllers?.get(workerId)?.controller, controller)) return;
    currentRunControllers?.delete(workerId);
    if (_.isEmpty(currentRunControllers)) activePlanningControllers.delete(runId);
  };
  return {
    signal: controller.signal,
    cancel: () => {
      controller.abort();
      complete();
    },
    complete,
  };
};

export const cancelChatPlanningRun = (runId?: string): boolean => {
  const normalizedRunId = _.trim(runId);
  if (!_.isEmpty(normalizedRunId)) {
    const controllers = activePlanningControllers.get(normalizedRunId);
    if (!controllers) return false;
    _.forEach([...controllers.values()], (record) => record.controller.abort());
    activePlanningControllers.delete(normalizedRunId);
    return true;
  }
  const controllers = _.flatMap([...activePlanningControllers.values()], (runControllers) => [...runControllers.values()]);
  _.forEach(controllers, (record) => record.controller.abort());
  activePlanningControllers.clear();
  return !_.isEmpty(controllers);
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

const getPlanningRoomKey = (request: ChatPlanningRequest): string =>
  _.join(
    [request.provider, request.projectId, request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID],
    CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR,
  );

const getProviderRooms = (provider: AiPlanningFallbackProvider): Map<string, Page> | undefined => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return geminiRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return grokRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return chatGptRooms;
  return undefined;
};

const closeChatPlanningRoomPage = async (request: ChatPlanningRequest): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  if (!rooms) return;
  const roomKey = getPlanningRoomKey(request);
  const page = rooms.get(roomKey);
  rooms.delete(roomKey);
  if (page && !page.isClosed()) await page.close().catch(() => undefined);
  scheduleGlobalBrowserCleanup();
};

const getProviderConversationSelectors = (
  provider: AiPlanningFallbackProvider,
): { item: string; action: string; ready: string; sidebarOpen: string; sidebarReady: string; url: string } | undefined => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat))
    return {
      item: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_CONVERSATION_ITEM_SELECTOR,
      action: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_CONVERSATION_ACTION_SELECTOR,
      ready: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR,
      sidebarOpen: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_SIDEBAR_OPEN_SELECTOR,
      sidebarReady: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_SIDEBAR_READY_SELECTOR,
      url: EXTERNAL_URLS.GEMINI_CHAT,
    };
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat))
    return {
      item: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CONVERSATION_ITEM_SELECTOR,
      action: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CONVERSATION_ACTION_SELECTOR,
      ready: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR,
      sidebarOpen: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SIDEBAR_OPEN_SELECTOR,
      sidebarReady: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SIDEBAR_READY_SELECTOR,
      url: EXTERNAL_URLS.GROK_CHAT,
    };
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi))
    return {
      item: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_CONVERSATION_ITEM_SELECTOR,
      action: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_CONVERSATION_ACTION_SELECTOR,
      ready: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR,
      sidebarOpen: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SIDEBAR_OPEN_SELECTOR,
      sidebarReady: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SIDEBAR_READY_SELECTOR,
      url: EXTERNAL_URLS.CHATGPT,
    };
  return undefined;
};

const getConversationIdentity = async (item: ReturnType<Page["locator"]>): Promise<string> =>
  (await item.locator("a").first().getAttribute("href").catch(() => null)) || (await item.innerText().catch(() => ""));

const waitForConversationIdentityChange = async (page: Page, itemSelector: string, previousIdentity: string): Promise<boolean> => {
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_VERIFY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const items = page.locator(itemSelector);
    if (_.isEqual(await items.count().catch(() => 0), 0)) return true;
    if (!_.isEqual(await getConversationIdentity(items.first()), previousIdentity)) return true;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_VERIFY_POLL_MS);
  }
  return false;
};

const deleteFirstProviderConversation = async (
  page: Page,
  provider: AiPlanningFallbackProvider,
  itemSelector: string,
  actionSelector: string,
): Promise<boolean> => {
  const item = page.locator(itemSelector).first();
  const previousIdentity = await getConversationIdentity(item);
  for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ITEM_ATTEMPTS; attempt++) {
    appLog(`[AI Chat Cleanup] ${provider}: đang xóa cuộc trò chuyện, lần ${_.add(attempt, 1)}.`);
    await item.scrollIntoViewIfNeeded({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => undefined);
    await item.hover({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => undefined);
    const directActionButton = item.locator(actionSelector).last();
    const actionButton = _.gt(await directActionButton.count().catch(() => 0), 0)
      ? directActionButton
      : item.locator("xpath=..").locator(actionSelector).first();
    const actionCount = await actionButton.count().catch(() => 0);
    if (_.isEqual(actionCount, 0)) {
      appWarn(`[AI Chat Cleanup] ${provider}: không tìm thấy nút tùy chọn.`);
      continue;
    }
    const actionVisible = await actionButton
      .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    const actionClicked = actionVisible
      ? await actionButton
          .click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
          .then(() => true)
          .catch(() => false)
      : await actionButton
          .evaluate((element: HTMLElement) => element.click())
          .then(() => true)
          .catch(() => false);
    appLog(`[AI Chat Cleanup] ${provider}: nút tùy chọn count=${actionCount}, visible=${actionVisible}, clicked=${actionClicked}.`);
    const deleteMenuItem = page
      .getByRole("menuitem", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN })
      .or(page.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
      .or(page.locator('[role="menu"] [role="menuitem"]').filter({ hasText: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
      .filter({ visible: true })
      .last();
    const deleteVisible = await deleteMenuItem
      .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    if (!deleteVisible) {
      const visibleMenuText = _.join(
        _.compact(
          _.map(await page.locator('[role="menu"], [role="listbox"], [role="dialog"]').allTextContents().catch(() => []), (value) => _.trim(value)),
        ),
        " | ",
      );
      appWarn(`[AI Chat Cleanup] ${provider}: chưa tìm thấy lệnh xóa; menu=${visibleMenuText}.`);
      continue;
    }
    await deleteMenuItem.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
    const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog")).filter({ visible: true }).last();
    const hasDialog = await dialog
      .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_CONFIRM_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    appLog(`[AI Chat Cleanup] ${provider}: hộp xác nhận visible=${hasDialog}.`);
    if (hasDialog) {
      const confirmButton = dialog
        .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_PATTERN })
        .or(dialog.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
        .filter({ visible: true })
        .last();
      const confirmCount = await confirmButton.count().catch(() => 0);
      const confirmClicked = await confirmButton
        .click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
        .then(() => true)
        .catch(() => false);
      appLog(`[AI Chat Cleanup] ${provider}: xác nhận count=${confirmCount}, clicked=${confirmClicked}.`);
    }
    if (await waitForConversationIdentityChange(page, itemSelector, previousIdentity)) return true;
  }
  appWarn(
    `[AI Chat Cleanup] ${provider}: không xóa được ${previousIdentity}; remaining=${await page.locator(itemSelector).count().catch(() => 0)}, current=${await getConversationIdentity(page.locator(itemSelector).first())}.`,
  );
  return false;
};

const deleteAllGeminiActivity = async (page: Page, detectedConversationCount: number): Promise<number> => {
  await page.goto(EXTERNAL_URLS.GEMINI_ACTIVITY, {
    waitUntil: "domcontentloaded",
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS,
  });
  const deleteActivityButton = page
    .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true })
    .filter({ visible: true })
    .first();
  await deleteActivityButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await deleteActivityButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const allTimeOption = page
    .getByRole("menuitem", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_ALL_TIME_PATTERN })
    .filter({ visible: true })
    .first();
  await allTimeOption.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await allTimeOption.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const confirmDialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_CONFIRM_HEADING_PATTERN }) })
    .filter({ visible: true })
    .last();
  await confirmDialog.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const confirmButton = confirmDialog
    .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true })
    .filter({ visible: true })
    .last();
  await confirmButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await confirmButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmDialog.waitFor({ state: "hidden", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  appLog(`[AI Chat Cleanup] ${AiPlanningFallbackProvider.GeminiChat}: đã xóa toàn bộ hoạt động và phòng trò chuyện.`);
  return detectedConversationCount;
};

const deleteProviderConversationHistory = async (page: Page, provider: AiPlanningFallbackProvider): Promise<number> => {
  const selectors = getProviderConversationSelectors(provider);
  if (!selectors) return 0;
  if (!_.includes(page.url(), new URL(selectors.url).hostname)) {
    await page.goto(selectors.url, { waitUntil: "domcontentloaded", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
  }
  await page.locator(selectors.ready).last().waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const sidebarReady = page.locator(selectors.sidebarReady).filter({ visible: true }).first();
  const sidebarOpenButton = page.locator(selectors.sidebarOpen).filter({ visible: true }).first();
  if (!(await sidebarReady.isVisible().catch(() => false)) && (await sidebarOpenButton.isVisible().catch(() => false))) {
    await sidebarOpenButton
      .click({ force: true, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
      .catch(() => sidebarOpenButton.evaluate((element: HTMLElement) => element.click()));
  }
  const sidebarLoaded = await sidebarReady
    .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  if (!sidebarLoaded && _.isEqual(await page.locator(selectors.item).count().catch(() => 0), 0)) {
    appLog(`[AI Chat Cleanup] ${provider}: không còn cuộc trò chuyện.`);
    return 0;
  }
  if (!sidebarLoaded) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
  await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_SETTLE_MS);
  const initialConversationCount = await page.locator(selectors.item).count();
  appLog(`[AI Chat Cleanup] ${provider}: tìm thấy ${initialConversationCount} cuộc trò chuyện.`);
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat))
    return _.isEqual(initialConversationCount, 0) ? 0 : deleteAllGeminiActivity(page, initialConversationCount);
  let deletedCount = 0;
  for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_MAX_CONVERSATIONS; attempt++) {
    const items = page.locator(selectors.item);
    if (_.isEqual(await items.count(), 0)) break;
    const deleted = await deleteFirstProviderConversation(page, provider, selectors.item, selectors.action);
    if (!deleted) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
    deletedCount++;
  }
  const remainingConversationCount = await page.locator(selectors.item).count();
  if (_.gt(remainingConversationCount, 0) || (_.gt(initialConversationCount, 0) && _.isEqual(deletedCount, 0))) {
    throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
  }
  return deletedCount;
};

export const clearChatPlanningRooms = async (
  provider: AiPlanningFallbackProvider,
): Promise<{ closedRoomCount: number; deletedConversationCount: number }> => {
  const rooms = getProviderRooms(provider);
  const selectors = getProviderConversationSelectors(provider);
  if (!rooms || !selectors) return { closedRoomCount: 0, deletedConversationCount: 0 };
  const pages = [...rooms.values()];
  _.forEach([...activePlanningControllers.entries()], ([runId, runControllers]) => {
    _.forEach([...runControllers.entries()], ([workerId, record]) => {
      if (!_.isEqual(record.provider, provider)) return;
      record.controller.abort();
      runControllers.delete(workerId);
    });
    if (_.isEmpty(runControllers)) activePlanningControllers.delete(runId);
  });
  const mutexPrefix = `${provider}${CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR}`;
  _.forEach([...planningMutexes.keys()], (roomKey) => {
    if (_.startsWith(roomKey, mutexPrefix)) planningMutexes.delete(roomKey);
  });
  await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_SETTLE_MS);
  let cleanupPage: Page | undefined;
  try {
    const browser = await getOrLaunchGlobalBrowser(true);
    cleanupPage = _.find(pages, (page) => !page.isClosed()) || (await browser.context.newPage());
    const deletedConversationCount = await deleteProviderConversationHistory(cleanupPage, provider);
    return { closedRoomCount: pages.length, deletedConversationCount };
  } catch (error) {
    appWarn(`[AI Chat Cleanup] ${provider}: ${_.toString(_.get(error, "message", error))}`);
    throw error;
  } finally {
    rooms.clear();
    const pagesToClose = _.uniq(_.compact([...pages, cleanupPage]));
    await Promise.allSettled(_.map(pagesToClose, (page) => (page.isClosed() ? Promise.resolve() : page.close())));
    scheduleGlobalBrowserCleanup();
  }
};

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

const extractBalancedJsonValues = (text: string): string[] => {
  const results: string[] = [];
  for (let start = 0; start < text.length; start++) {
    const opening = text[start];
    if (opening !== "[" && opening !== "{") continue;
    const closing = opening === "[" ? "]" : "}";
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
      else if (character === opening) depth++;
      else if (character === closing) {
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

const getLastVisibleLocator = async (page: Page, selector: string): Promise<Locator> => {
  const candidates = page.locator(selector);
  for (let index = (await candidates.count()) - 1; index >= 0; index--) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  throw new Error("Không tìm thấy vùng nhập đang hiển thị trong phòng AI.");
};

const extractPlanningJsonFromBody = (text: string, expectedSceneIds: string[]): string =>
  _.findLast(extractBalancedJsonValues(text), (candidate) =>
    _.every([
      ..._.map(expectedSceneIds, (sceneId) => new RegExp(`"id"\\s*:\\s*"${_.escapeRegExp(sceneId)}"`).test(candidate)),
    ]),
  ) || "";

const extractCompleteJsonValue = (text: string): string => {
  const candidate = _.reduce(extractBalancedJsonValues(text), (longest, current) => (current.length > longest.length ? current : longest), "");
  return candidate.length > 1 ? candidate : "";
};

const isPlanningResponseForScenes = (text: string, expectedSceneIds: string[]): boolean => {
  if (_.isEmpty(text)) return false;
  try {
    const parsed = JSON.parse(text);
    if (!_.isArray(parsed)) return false;
    const returnedSceneIds = _.map(parsed, (item) => _.toString(_.get(item, "id")));
    return (
      _.isEqual(returnedSceneIds.length, expectedSceneIds.length) &&
      _.isEqual(_.uniq(returnedSceneIds).length, returnedSceneIds.length) &&
      _.isEmpty(_.difference(expectedSceneIds, returnedSceneIds)) &&
      _.isEmpty(_.difference(returnedSceneIds, expectedSceneIds))
    );
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
  completionMarker?: string,
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
      _.findLast(_.map(responseCandidates, extractCompleteJsonValue), (value) => !_.isEmpty(value)) ||
      _.last(responseCandidates) ||
      "";
    const latestText = selectedResponse;
    const isBusy = await page.locator(busySelector).first().isVisible().catch(() => false);
    const hasRequiredCompletionMarker = _.isEmpty(completionMarker) || _.includes(latestText, completionMarker);
    const belongsToCurrentRequest = (_.isEmpty(expectedSceneIds) || isPlanningResponseForScenes(latestText, expectedSceneIds)) && hasRequiredCompletionMarker;
    lastResponseCount = count;
    lastCandidateLength = latestText.length;
    lastBusyState = isBusy;
    lastIdentityMatch = belongsToCurrentRequest;
    if (_.gte(latestText.length, CINEMATIC_CHAT_PLANNING_CONFIG.MIN_RESPONSE_CHARACTERS) && !isBusy) {
      stablePolls = _.isEqual(latestText, previousText) ? _.add(stablePolls, 1) : 0;
      previousText = latestText;
      if (_.gte(stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS)) {
        if (belongsToCurrentRequest) return latestText;
        let isCompleteJson = false;
        let isCompleteArray = false;
        try {
          const parsedResponse = JSON.parse(latestText);
          isCompleteJson = true;
          isCompleteArray = _.isArray(parsedResponse);
        } catch {}
        if (!_.isEmpty(completionMarker) && isCompleteJson && !hasRequiredCompletionMarker) {
          throw new Error(`${CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR}: completion_marker_missing, candidateLength=${latestText.length}`);
        }
        if (isCompleteArray) {
          throw new Error(
            `${CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR}: expected=${_.join(expectedSceneIds, ",")}, candidateLength=${latestText.length}`,
          );
        }
      }
    } else {
      stablePolls = 0;
      previousText = latestText;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  throw new Error(
    `AI Chat chưa hoàn tất phản hồi kế hoạch phim trong thời gian cho phép (responses=${lastResponseCount}, initial=${initialCount}, candidateLength=${lastCandidateLength}, busy=${lastBusyState}, identityMatch=${lastIdentityMatch}, completionMarker=${completionMarker || "not-required"}).`,
  );
};

const attachRoomFiles = async (page: Page, attachments: ChatRoomAttachment[]): Promise<void> => {
  const removableAttachments = page.locator(
    'button[aria-label*="remove attachment" i], button[aria-label*="remove file" i], button[aria-label*="xóa tệp" i], button[aria-label*="gỡ tệp" i]',
  );
  for (let index = (await removableAttachments.count().catch(() => 0)) - 1; index >= 0; index--) {
    await removableAttachments.nth(index).click().catch(() => undefined);
  }

  let uploaded = false;
  const fileInputs = page.locator('input[type="file"]');
  for (let index = 0; index < (await fileInputs.count().catch(() => 0)); index++) {
    try {
      await fileInputs.nth(index).setInputFiles(attachments);
      uploaded = true;
      break;
    } catch {}
  }

  if (!uploaded) {
    const attachmentButton = page
      .getByRole("button", { name: /attach|upload|add files?|đính kèm|tải tệp|thêm tệp|thêm tệp và ảnh/i })
      .or(page.locator('button[aria-label*="attach" i], button[aria-label*="upload" i], button[aria-label*="add file" i], button[aria-label*="đính kèm" i]'))
      .filter({ visible: true })
      .last();
    const chooser = await Promise.all([
      page.waitForEvent("filechooser", { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => null),
      attachmentButton.click().catch(() => undefined),
    ]).then(([fileChooser]) => fileChooser);
    if (chooser) {
      await chooser.setFiles(attachments);
      uploaded = true;
    }
  }

  if (!uploaded) throw new Error("Room-only AI execution could not attach the required media files to the selected chat room.");
  await page.waitForTimeout(1500);
};

const submitPrompt = async (
  page: Page,
  prompt: string,
  inputSelector: string,
  sendSelector: string,
  responseSelector: string,
  busySelector: string,
  expectedSceneIds: string[],
  attachments: ChatRoomAttachment[] = [],
  completionMarker?: string,
  signal?: AbortSignal,
): Promise<string> => {
  throwIfPlanningCancelled(signal);
  const input = await getLastVisibleLocator(page, inputSelector);
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
  if (!_.isEmpty(attachments)) await attachRoomFiles(page, attachments);
  const normalizedPrompt = normalizeRoomPrompt(prompt);
  await input.fill(`${normalizedPrompt}\n\n${CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE}`);
  const sendButton = page.locator(sendSelector).last();
  if ((await sendButton.count()) > 0 && (await sendButton.isVisible().catch(() => false)) && (await sendButton.isEnabled().catch(() => false))) await sendButton.click();
  else await input.press("Enter");
  return waitForStableResponse(page, responseSelector, busySelector, initialCount, expectedSceneIds, previousLastResponse, completionMarker, signal);
};

const selectChatModel = async (page: Page, model: AiPlanningChatModel | undefined, buttonSelector: string): Promise<void> => {
  if (!model || _.isEqual(model, AiPlanningChatModel.ChatGptAuto)) return;
  const modelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const button = page.locator(buttonSelector).first();
  await button.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const currentModelLabel = _.trim(await button.innerText().catch(() => ""));
  if (modelLabel.test(currentModelLabel)) return;
  await button.click();
  const option = page
    .getByRole("menuitem", { name: modelLabel })
    .or(page.getByRole("menuitemradio", { name: modelLabel }))
    .or(page.getByRole("option", { name: modelLabel }))
    .or(page.locator('[role="listbox"] [role="option"], [role="menu"] button').filter({ hasText: modelLabel }))
    .filter({ visible: true })
    .first();
  const optionAvailable = await option
    .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  if (optionAvailable) {
    await option.click();
    return;
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  appWarn("[AI Chat Planning] Mô hình đã chọn không xuất hiện trong tài khoản; tiếp tục bằng mô hình hiện tại.");
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
  const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, getPlanningRoomKey(request));
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithGrokChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, getPlanningRoomKey(request));
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_MODEL_BUTTON_SELECTOR);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithChatGptUi = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, getPlanningRoomKey(request));
  await ensureChatGptReady(room, browser.account.email);
  const response = await submitPrompt(
    room,
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
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
  const roomKey = getPlanningRoomKey(request);
  const planningMutex = planningMutexes.get(roomKey) || new SimpleMutex();
  planningMutexes.set(roomKey, planningMutex);
  const release = await planningMutex.acquire();
  try {
    throwIfPlanningCancelled(request.signal);
    appLog(
      `[AI Chat Planning][${request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID}] Đang sử dụng ${providerNames[request.provider]} cho project ${request.projectId}.`,
    );
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
    if (request.closeRoomOnComplete ?? CINEMATIC_CHAT_PLANNING_CONFIG.CLOSE_ROOM_ON_COMPLETE) {
      await closeChatPlanningRoomPage(request);
    }
    release();
  }
};
