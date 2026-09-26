import type { BrowserContext, Locator, Page } from "playwright";
import { createHash } from "crypto";
import _ from "lodash";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../types.js";
import {
  CINEMATIC_CHAT_MODEL_LABELS,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  EXTERNAL_URLS,
  GEMINI_CHAT_BASE_MODEL_LABELS,
  GEMINI_CHAT_THINKING_LEVEL_LABELS,
  normalizeCinematicArtifactIdentity,
  SecurityConstants,
} from "../../constants/index.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { appLog, appWarn } from "../../lib/logger.js";
import { musicErrorDetails, writeMusicDiagnostic } from "./musicDiagnosticService.js";
import { assessChatComposerContent } from "./chatComposerValidation.js";
import { CHAT_UI_AUTOMATION_MESSAGES } from "../../constants/messages.js";
import { jsonUtils } from "../../lib/json.js";
import { closeAppBrowserAfterTask, closeOwnedGrokBrowserIfIdle, getOrLaunchGlobalBrowser, getOrLaunchGrokBrowser, scheduleGlobalBrowserCleanup, SimpleMutex } from "./imageGeneratorService.js";

interface ChatRoomAttachment {
  name: string;
  mimeType: string;
  buffer?: Buffer;
  path?: string;
}

interface ChatResponseSnapshot {
  identity: string;
  text: string;
}

interface PendingRoomResponse {
  page: Page;
  initialCount: number;
  initialResponseSnapshots: ChatResponseSnapshot[];
  expectedSceneIds: string[];
  completionMarker?: string;
  artifactType?: string;
  requestId?: string;
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
  artifactType?: string;
  requestId?: string;
  closeRoomOnComplete?: boolean;
  allowDefaultGeminiModel?: boolean;
}

export interface ChatPlanningRoomIdentity {
  provider: AiPlanningFallbackProvider;
  projectId: string;
  workerId?: string;
}

const planningMutexes = new Map<string, SimpleMutex>();
const geminiRooms = new Map<string, Page>();
const grokRooms = new Map<string, Page>();
const chatGptRooms = new Map<string, Page>();
const pendingRoomResponses = new Map<string, PendingRoomResponse>();
const providerErrorCounts = new Map<string, number>();
const grokBootstrapMutexes = new WeakMap<BrowserContext, SimpleMutex>();
const grokReadyContexts = new WeakSet<BrowserContext>();
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
  _.trim(_.replace(_.replace(prompt, CINEMATIC_CHAT_PLANNING_CONFIG.WINDOWS_LINE_ENDING_PATTERN, "\n"), CINEMATIC_CHAT_PLANNING_CONFIG.EXCESS_BLANK_LINES_PATTERN, "\n\n"));

const parseStrictRoomJson = (text: string): unknown => {
  try { return JSON.parse(_.trim(text)); }
  catch { return undefined; }
};

const getPlanningRoomKey = (request: ChatPlanningRoomIdentity): string =>
  _.join([request.provider, request.projectId, request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID], CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR);

const getProviderRooms = (provider: AiPlanningFallbackProvider): Map<string, Page> | undefined => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return geminiRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return grokRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return chatGptRooms;
  return undefined;
};

const hasActiveChatRooms = (): boolean => _.some([geminiRooms, grokRooms, chatGptRooms], (rooms) =>
  _.some([...rooms.values()], (page) => !page.isClosed()));

export const closeChatBrowserIfIdle = async (): Promise<boolean> => {
  if (hasActiveChatRooms()) return false;
  const grokClosed = await closeOwnedGrokBrowserIfIdle();
  return grokClosed && await closeAppBrowserAfterTask(true);
};

export const closeChatPlanningRoom = async (request: ChatPlanningRoomIdentity): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  if (!rooms) return;
  const roomKey = getPlanningRoomKey(request);
  const page = rooms.get(roomKey);
  rooms.delete(roomKey);
  pendingRoomResponses.delete(roomKey);
  if (page && !page.isClosed()) await page.close().catch(() => undefined);
  if (!hasActiveChatRooms()) scheduleGlobalBrowserCleanup();
};

export const closeChatPlanningRoomsForProject = async (request: Pick<ChatPlanningRoomIdentity, "provider" | "projectId">): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  if (!rooms || _.isEmpty(request.projectId)) return;
  const prefix = `${request.provider}${CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR}${request.projectId}${CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR}`;
  const roomKeys = _.filter([...rooms.keys()], (key) => _.startsWith(key, prefix));
  await Promise.allSettled(_.map(roomKeys, async (key) => {
    const page = rooms.get(key);
    rooms.delete(key);
    pendingRoomResponses.delete(key);
    if (page && !page.isClosed()) await page.close().catch(() => undefined);
  }));
  await closeChatBrowserIfIdle();
};

const reloadChatPlanningRoom = async (request: ChatPlanningRoomIdentity): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  const roomKey = getPlanningRoomKey(request);
  const page = rooms?.get(roomKey);
  pendingRoomResponses.delete(roomKey);
  if (!page || page.isClosed()) throw new Error("chat_planning_room_unavailable_for_reload");
  await page.reload({
    waitUntil: "domcontentloaded",
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS,
  });
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
  (await item.getAttribute("href").catch(() => null)) || (await item
    .locator("a")
    .first()
    .getAttribute("href")
    .catch(() => null)) || (await item.innerText().catch(() => ""));

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

const deleteFirstProviderConversation = async (page: Page, provider: AiPlanningFallbackProvider, itemSelector: string, actionSelector: string): Promise<boolean> => {
  const item = page.locator(itemSelector).first();
  const previousIdentity = await getConversationIdentity(item);
  for (let attempt = 0; attempt < CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ITEM_ATTEMPTS; attempt++) {
    appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_DELETING_ATTEMPT(provider, _.add(attempt, 1)));
    await item.scrollIntoViewIfNeeded({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => undefined);
    await item.hover({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => undefined);
    const directActionButton = item.locator(actionSelector).last();
    const parentActionButton = item.locator("xpath=..").locator(actionSelector).last();
    const containerActionButton = item.locator("xpath=../..").locator(actionSelector).last();
    const actionButton = _.gt(await directActionButton.count().catch(() => 0), 0)
      ? directActionButton
      : _.gt(await parentActionButton.count().catch(() => 0), 0)
        ? parentActionButton
        : containerActionButton;
    const actionCount = await actionButton.count().catch(() => 0);
    if (_.isEqual(actionCount, 0)) {
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_OPTION_BUTTON_NOT_FOUND(provider));
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
    appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_OPTION_BUTTON_STAT(provider, actionCount, actionVisible, actionClicked));
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
          _.map(
            await page
              .locator('[role="menu"], [role="listbox"], [role="dialog"]')
              .allTextContents()
              .catch(() => []),
            (value) => _.trim(value),
          ),
        ),
        " | ",
      );
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_DELETE_COMMAND_NOT_FOUND(provider, visibleMenuText));
      continue;
    }
    await deleteMenuItem.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
    const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog")).filter({ visible: true }).last();
    const hasDialog = await dialog
      .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_CONFIRM_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_DIALOG_VISIBILITY(provider, hasDialog));
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
      appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_CONFIRM_STAT(provider, confirmCount, confirmClicked));
    }
    if (await waitForConversationIdentityChange(page, itemSelector, previousIdentity)) return true;
  }
  appWarn(
    CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_FAILED(
      provider,
      previousIdentity,
      await page.locator(itemSelector).count().catch(() => 0),
      await getConversationIdentity(page.locator(itemSelector).first()),
    ),
  );
  return false;
};

const deleteAllGeminiActivity = async (page: Page, detectedConversationCount: number): Promise<number> => {
  await page.goto(EXTERNAL_URLS.GEMINI_ACTIVITY, {
    waitUntil: "domcontentloaded",
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS,
  });
  const deleteActivityButton = page.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true }).filter({ visible: true }).first();
  await deleteActivityButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await deleteActivityButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const allTimeOption = page.getByRole("menuitem", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_ALL_TIME_PATTERN }).filter({ visible: true }).first();
  await allTimeOption.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await allTimeOption.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const confirmDialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_CONFIRM_HEADING_PATTERN }) })
    .filter({ visible: true })
    .last();
  await confirmDialog.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const confirmButton = confirmDialog.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true }).filter({ visible: true }).last();
  await confirmButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await confirmButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmDialog.waitFor({ state: "hidden", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ALL_ACTIVITY_DELETED(AiPlanningFallbackProvider.GeminiChat));
  return detectedConversationCount;
};

const deleteAllChatGptConversations = async (page: Page, detectedConversationCount: number): Promise<number> => {
  await page.goto(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DATA_CONTROLS_URL, {
    waitUntil: "domcontentloaded",
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS,
  });
  const settingsDialog = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SETTINGS_DIALOG_SELECTOR).filter({ visible: true }).last();
  await settingsDialog.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await settingsDialog
    .getByText(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DATA_CONTROLS_HEADING_PATTERN, { exact: true })
    .first()
    .waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });

  const deleteAllButton = settingsDialog
    .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CHATS_PATTERN })
    .filter({ visible: true })
    .last();
  await deleteAllButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await deleteAllButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });

  const confirmationDialog = page
    .getByRole("dialog")
    .or(page.getByRole("alertdialog"))
    .filter({ has: page.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CONFIRM_PATTERN }) })
    .filter({ visible: true })
    .last();
  await confirmationDialog.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_CONFIRM_TIMEOUT_MS });
  const confirmButton = confirmationDialog
    .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CONFIRM_PATTERN })
    .filter({ visible: true })
    .last();
  await confirmButton.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmationDialog.waitFor({ state: "hidden", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ALL_ACTIVITY_DELETED(AiPlanningFallbackProvider.ChatGptUi));
  return detectedConversationCount;
};

const deleteProviderConversationHistory = async (page: Page, provider: AiPlanningFallbackProvider): Promise<number> => {
  const selectors = getProviderConversationSelectors(provider);
  if (!selectors) return 0;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return deleteAllChatGptConversations(page, 0);
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
  if (
    !sidebarLoaded &&
    _.isEqual(
      await page
        .locator(selectors.item)
        .count()
        .catch(() => 0),
      0,
    )
  ) {
    appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_NO_CONVERSATIONS(provider));
    return 0;
  }
  if (!sidebarLoaded) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
  await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_SETTLE_MS);
  const initialConversationCount = await page.locator(selectors.item).count();
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_CONVERSATIONS_FOUND(provider, initialConversationCount));
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return _.isEqual(initialConversationCount, 0) ? 0 : deleteAllGeminiActivity(page, initialConversationCount);
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

export const clearChatPlanningRooms = async (provider: AiPlanningFallbackProvider): Promise<{ closedRoomCount: number; deletedConversationCount: number; deletedAll: boolean }> => {
  const rooms = getProviderRooms(provider);
  const selectors = getProviderConversationSelectors(provider);
  if (!rooms || !selectors) return { closedRoomCount: 0, deletedConversationCount: 0, deletedAll: false };
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
  await Promise.allSettled(_.map(pages, (page) => (page.isClosed() ? Promise.resolve() : page.close())));
  await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_SETTLE_MS);
  let cleanupPage: Page | undefined;
  try {
    const browser = await getOrLaunchGlobalBrowser(true, true);
    cleanupPage = await browser.context.newPage();
    const deletedConversationCount = await deleteProviderConversationHistory(cleanupPage, provider);
    return { closedRoomCount: pages.length, deletedConversationCount, deletedAll: _.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi) };
  } catch (error) {
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ERROR(provider, _.toString(_.get(error, "message", error))));
    throw error;
  } finally {
    rooms.clear();
    const pagesToClose = _.uniq(_.compact([...pages, cleanupPage]));
    await Promise.allSettled(_.map(pagesToClose, (page) => (page.isClosed() ? Promise.resolve() : page.close())));
    await closeChatBrowserIfIdle();
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
  rooms.set(projectId, page);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
    return page;
  } catch (error) {
    rooms.delete(projectId);
    if (!page.isClosed()) await page.close().catch(() => undefined);
    throw error;
  }
};

const getLastVisibleLocator = async (page: Page, selector: string, timeoutMs: number = CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS): Promise<Locator> => {
  const candidates = page.locator(selector);
  const visibleCandidate = candidates.filter({ visible: true }).last();
  const becameVisible = await visibleCandidate
    .waitFor({ state: "visible", timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
  if (becameVisible) return visibleCandidate;
  for (let index = (await candidates.count()) - 1; index >= 0; index--) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  throw new Error(CHAT_UI_AUTOMATION_MESSAGES.INPUT_AREA_NOT_FOUND);
};

const getChatResponseSnapshots = async (page: Page, responseSelector: string): Promise<ChatResponseSnapshot[]> =>
  page
    .locator(responseSelector)
    .evaluateAll(
      (elements, identityConfig) =>
        elements.filter((element) => {
          if (elements.some((other) => other !== element && element.contains(other))) return false;
          if (!(element instanceof HTMLElement)) return false;
          const style = window.getComputedStyle(element);
          return style.visibility !== "hidden" && style.display !== "none" && element.getClientRects().length > 0;
        }).map((element, index) => {
          const identityElement = element.closest(identityConfig.selector) || element;
          const messageId = identityElement.getAttribute(identityConfig.messageIdAttribute) || "";
          const testId = identityElement.getAttribute(identityConfig.testIdAttribute) || identityElement.getAttribute(identityConfig.legacyTestIdAttribute) || "";
          const identity = messageId || (testId ? `${testId}:${index}` : identityElement.id);
          const visibleText = element instanceof HTMLElement ? element.innerText : element.textContent || "";
          return { identity, text: visibleText.trim() };
        }),
      {
        selector: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_IDENTITY_SELECTOR,
        messageIdAttribute: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MESSAGE_ID_ATTRIBUTE,
        testIdAttribute: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TEST_ID_ATTRIBUTE,
        legacyTestIdAttribute: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_LEGACY_TEST_ID_ATTRIBUTE,
      },
    )
    .catch(() => []);

const isPlanningResponseForScenes = (text: string, expectedSceneIds: string[]): boolean => {
  if (_.isEmpty(text)) return false;
  const parsed = parseStrictRoomJson(text);
  const scenes = _.isArray(parsed) ? parsed : _.get(parsed, "scenes");
  if (!_.isArray(scenes)) return false;
  const returnedSceneIds = _.map(scenes, (item) => _.toString(_.get(item, "id")));
  return (
    _.isEqual(returnedSceneIds.length, expectedSceneIds.length) &&
    _.isEqual(_.uniq(returnedSceneIds).length, returnedSceneIds.length) &&
    _.isEmpty(_.difference(expectedSceneIds, returnedSceneIds)) &&
    _.isEmpty(_.difference(returnedSceneIds, expectedSceneIds))
  );
};

const throwIfGrokRateLimited = async (page: Page, busySelector: string): Promise<void> => {
  if (!_.isEqual(busySelector, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR)) return;
  const alerts = await page.locator('[role="alert"]').allTextContents().catch(() => []);
  if (_.some(alerts, (alert) => CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RATE_LIMIT_PATTERN.test(alert))) {
    throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RATE_LIMIT_ERROR);
  }
};

const waitForStableResponse = async (
  page: Page,
  responseSelector: string,
  busySelector: string,
  initialCount: number,
  expectedSceneIds: string[],
  initialResponseSnapshots: ChatResponseSnapshot[],
  completionMarker?: string,
  artifactType?: string,
  requestId?: string,
  signal?: AbortSignal,
): Promise<string> => {
  const startedAt = Date.now();
  const absoluteDeadline = startedAt + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MAX_TIMEOUT_MS;
  let activityDeadline = startedAt + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS;
  const initialResponseSet = new Set(_.map(initialResponseSnapshots, (snapshot) => _.trim(snapshot.text)));
  const initialResponseIdentitySet = new Set(_.compact(_.map(initialResponseSnapshots, "identity")));
  let previousText = "";
  let stablePolls = 0;
  let lastResponseCount = initialCount;
  let lastCandidateLength = 0;
  let lastBusyState = false;
  let lastIdentityMatch = false;
  let lastObservedResponseCount = initialCount;
  let lastObservedCandidate = "";
  let busyWaitLogged = false;
  while (Date.now() < absoluteDeadline) {
    throwIfPlanningCancelled(signal);
    await throwIfGrokRateLimited(page, busySelector);
    const visibleAlerts = await page.locator('[role="alert"]').filter({ visible: true }).allTextContents().catch(() => []);
    const providerErrorAlert = _.find(visibleAlerts, (alert) => CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_PATTERN.test(alert));
    if (providerErrorAlert) {
      await writeMusicDiagnostic("chat_provider_alert", { runId: requestId ? createHash("sha256").update(requestId).digest("hex").slice(0, 12) : undefined, stage: artifactType, alertChars: providerErrorAlert.length });
      throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR);
    }
    const responseSnapshots = await getChatResponseSnapshots(page, responseSelector);
    const count = responseSnapshots.length;
    const responseTexts = _.map(responseSnapshots, "text");
    const lastResponse = _.trim(_.last(responseTexts) || "");
    const changedLastResponse = !_.isEmpty(lastResponse) && !initialResponseSet.has(lastResponse) ? lastResponse : "";
    const newResponseTexts = count > initialCount ? _.slice(responseTexts, initialCount) : [];
    const responsesNotPresentBeforeSubmission = _.filter(responseTexts, (value) => !_.isEmpty(value) && !initialResponseSet.has(value));
    const responsesWithNewIdentity = _.map(
      _.filter(responseSnapshots, (snapshot) => !_.isEmpty(snapshot.identity) && !initialResponseIdentitySet.has(snapshot.identity)),
      "text",
    );
    const responseCandidates = _.uniq(_.compact([...responsesWithNewIdentity, ...newResponseTexts, ...responsesNotPresentBeforeSubmission, changedLastResponse]));
    const normalizedExpectedRequestId = normalizeCinematicArtifactIdentity(requestId);
    const matchingJsonResponse = _.findLast(responseCandidates, (candidate) => {
      const parsedCandidate = parseStrictRoomJson(candidate);
      if (_.isUndefined(parsedCandidate)) return false;
      const returnedArtifactType = _.trim(_.toString(_.get(parsedCandidate, "artifactType")));
      const returnedRequestId = normalizeCinematicArtifactIdentity(_.get(parsedCandidate, "requestId"));
      return (
        (_.isEmpty(artifactType) || _.isEqual(returnedArtifactType, artifactType)) &&
        (_.isEmpty(normalizedExpectedRequestId) || _.isEqual(returnedRequestId, normalizedExpectedRequestId))
      );
    });
    const selectedResponse = matchingJsonResponse || _.last(responseCandidates) || "";
    const latestText = selectedResponse;
    const isBusy = await page
      .locator(busySelector)
      .filter({ visible: true })
      .count()
      .then((visibleCount) => visibleCount > 0)
      .catch(() => false);
    const responseProgressed = count > lastObservedResponseCount || (!_.isEmpty(latestText) && !_.isEqual(latestText, lastObservedCandidate));
    if (responseProgressed || isBusy) {
      activityDeadline = _.min([absoluteDeadline, Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_ACTIVITY_GRACE_MS]) || absoluteDeadline;
    }
    if (isBusy && !busyWaitLogged && Date.now() - startedAt >= CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS) {
      busyWaitLogged = true;
      appLog(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_BUSY_WAIT_LOG);
    }
    lastObservedResponseCount = count;
    lastObservedCandidate = latestText;
    const parsedLatest = parseStrictRoomJson(latestText);
    const returnedCompletionMarker = _.trim(_.toString(_.get(parsedLatest, "completionMarker")));
    const returnedArtifactType = _.trim(_.toString(_.get(parsedLatest, "artifactType")));
    const returnedRequestId = normalizeCinematicArtifactIdentity(_.get(parsedLatest, "requestId"));
    const hasRequiredCompletionMarker = _.isEmpty(completionMarker) || _.isEqual(returnedCompletionMarker, completionMarker);
    const hasRequiredArtifactIdentity =
      (_.isEmpty(artifactType) || _.isEqual(returnedArtifactType, artifactType)) &&
      (_.isEmpty(normalizedExpectedRequestId) || _.isEqual(returnedRequestId, normalizedExpectedRequestId));
    const belongsToCurrentRequest =
      (_.isEmpty(expectedSceneIds) || isPlanningResponseForScenes(latestText, expectedSceneIds)) && hasRequiredCompletionMarker && hasRequiredArtifactIdentity;
    lastResponseCount = count;
    lastCandidateLength = latestText.length;
    lastBusyState = isBusy;
    lastIdentityMatch = belongsToCurrentRequest;
    const isCompleteJson = !_.isUndefined(parsedLatest);
    if (_.gte(latestText.length, CINEMATIC_CHAT_PLANNING_CONFIG.MIN_RESPONSE_CHARACTERS) && !isBusy) {
      stablePolls = _.isEqual(latestText, previousText) ? _.add(stablePolls, 1) : 0;
      previousText = latestText;
      if (_.gte(stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS)) {
        const mayUseUnmarkedJsonFallback = _.isEmpty(expectedSceneIds) && _.isEmpty(completionMarker)
          && _.isEmpty(artifactType) && _.isEmpty(normalizedExpectedRequestId) && isCompleteJson;
        if (belongsToCurrentRequest || mayUseUnmarkedJsonFallback) {
          if (!belongsToCurrentRequest) {
            appWarn(
              CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RAW_CONTRACT_FALLBACK(
                _.join(expectedSceneIds, ",") || "not-required",
                completionMarker || "not-required",
              ),
            );
          }
          appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RESPONSE_COMPLETE(latestText.length));
          await writeMusicDiagnostic("chat_response_ui_confirmed", { runId: requestId ? createHash("sha256").update(requestId).digest("hex").slice(0, 12) : undefined, stage: artifactType, responseChars: latestText.length, stablePolls, elapsedMs: Date.now() - startedAt, identityMatch: belongsToCurrentRequest });
          return jsonUtils.safeStringify(parsedLatest);
        }
        if (!isCompleteJson && !_.isEmpty(responseCandidates) && stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_STABLE_POLLS) {
          appWarn(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_PREVIEW_LOG(_.truncate(latestText, { length: 800 })));
          if (CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_PATTERN.test(latestText)) {
            throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR);
          }
          throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR);
        }
        if (isCompleteJson && !_.isEmpty(responseCandidates) && stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_STABLE_POLLS) {
          throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR);
        }
      }
    } else {
      stablePolls = 0;
      previousText = latestText;
    }
    if (!isBusy && Date.now() >= activityDeadline) break;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  appWarn(
    CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RESPONSE_TIMEOUT_LOG(
      lastResponseCount,
      initialCount,
      lastCandidateLength,
      lastBusyState,
      lastIdentityMatch,
      completionMarker || "not-required",
    ),
  );
  await writeMusicDiagnostic("chat_response_timeout", { runId: requestId ? createHash("sha256").update(requestId).digest("hex").slice(0, 12) : undefined, stage: artifactType, responseCount: lastResponseCount, candidateChars: lastCandidateLength, busy: lastBusyState, identityMatch: lastIdentityMatch, elapsedMs: Date.now() - startedAt });
  const timeoutError = new Error(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MESSAGE);
  Object.assign(timeoutError, { code: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE });
  throw timeoutError;
};

const isPendingResponseForRequest = (
  pendingResponse: PendingRoomResponse,
  page: Page,
  expectedSceneIds: string[],
  completionMarker?: string,
  artifactType?: string,
  requestId?: string,
): boolean =>
  _.isEqual(pendingResponse.page, page) &&
  !page.isClosed() &&
  _.isEqual(pendingResponse.expectedSceneIds, expectedSceneIds) &&
  _.isEqual(pendingResponse.completionMarker || "", completionMarker || "") &&
  _.isEqual(pendingResponse.artifactType || "", artifactType || "") &&
  _.isEqual(normalizeCinematicArtifactIdentity(pendingResponse.requestId), normalizeCinematicArtifactIdentity(requestId));

const isResponseTimeoutError = (error: unknown): boolean => _.isEqual(_.toString(_.get(error, "code")), CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE);

const setLocalFilePathsViaCdp = async (page: Page, filePaths: string[]): Promise<boolean> => {
  if (_.isEmpty(filePaths)) return false;
  const session = await page.context().newCDPSession(page).catch(() => null);
  if (!session) return false;
  try {
    await session.send(CINEMATIC_CHAT_PLANNING_CONFIG.CDP_DOM_ENABLE as any);
    const { nodes } = await session.send(CINEMATIC_CHAT_PLANNING_CONFIG.CDP_DOM_GET_FLATTENED_DOCUMENT as any, { depth: -1, pierce: true });
    const fileInputNode = _.findLast(nodes, (node) => {
      if (!_.isEqual(_.toUpper(node.nodeName), CINEMATIC_CHAT_PLANNING_CONFIG.CDP_INPUT_TAG_NAME)) return false;
      const attributes = _.chunk(node.attributes || [], 2);
      return _.some(attributes, ([name, value]) => _.isEqual(_.toLower(String(name)), CINEMATIC_CHAT_PLANNING_CONFIG.CDP_INPUT_TYPE_ATTR) && _.isEqual(_.toLower(String(value)), CINEMATIC_CHAT_PLANNING_CONFIG.CDP_INPUT_FILE_VALUE));
    });
    if (!fileInputNode?.backendNodeId) return false;
    await session.send(CINEMATIC_CHAT_PLANNING_CONFIG.CDP_DOM_SET_FILE_INPUT_FILES as any, { files: filePaths, backendNodeId: fileInputNode.backendNodeId });
    return true;
  } catch {
    return false;
  } finally {
    await session.detach().catch(() => undefined);
  }
};

const attachRoomFiles = async (page: Page, attachments: ChatRoomAttachment[]): Promise<void> => {
  const localFilePaths = _.compact(_.map(attachments, "path"));
  const usesOnlyLocalPaths = _.size(localFilePaths) === _.size(attachments);
  const inputFiles = _.map(attachments, (attachment) => attachment.path || {
    name: attachment.name,
    mimeType: attachment.mimeType,
    buffer: attachment.buffer as Buffer,
  });
  const removableAttachments = page.locator(
    CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_REMOVABLE_BUTTON_SELECTOR,
  );
  for (let index = (await removableAttachments.count().catch(() => 0)) - 1; index >= 0; index--) {
    await removableAttachments
      .nth(index)
      .click()
      .catch(() => undefined);
  }

  let uploaded = false;
  let lastUploadError: unknown;
  const fileInputs = page.locator('input[type="file"]');
  if (usesOnlyLocalPaths) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
  else for (let index = 0; index < (await fileInputs.count().catch(() => 0)); index++) {
    try {
      await fileInputs.nth(index).setInputFiles(inputFiles as any);
      uploaded = true;
      break;
    } catch (error) { lastUploadError = error; }
  }

  if (!uploaded) {
    const attachmentButton = page
      .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_BUTTON_NAME_PATTERN })
      .or(page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_BUTTON_SELECTOR))
      .filter({ visible: true })
      .last();
    let chooser = await Promise.all([
      page.waitForEvent("filechooser", { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => null),
      attachmentButton.click().catch((error) => { lastUploadError = error; }),
    ]).then(([fileChooser]) => fileChooser);
    if (!chooser) {
      const revealedFileInputs = page.locator('input[type="file"]');
      if (usesOnlyLocalPaths) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
      else for (let index = 0; index < (await revealedFileInputs.count().catch(() => 0)); index++) {
        try {
          await revealedFileInputs.nth(index).setInputFiles(inputFiles as any);
          uploaded = true;
          break;
        } catch (error) { lastUploadError = error; }
      }
    }
    if (!chooser && !uploaded) {
      const uploadMenuItem = page
        .getByRole("menuitem", { name: CINEMATIC_CHAT_PLANNING_CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN })
        .or(page.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN }))
        .filter({ visible: true })
        .last();
      if (await uploadMenuItem.count().catch(() => 0)) chooser = await Promise.all([
        page.waitForEvent("filechooser", { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => null),
        uploadMenuItem.click().catch((error) => { lastUploadError = error; }),
      ]).then(([fileChooser]) => fileChooser);
    }
    if (chooser && !uploaded) {
      if (usesOnlyLocalPaths) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
      else try {
        await chooser.setFiles(inputFiles);
        uploaded = true;
      } catch (error) { lastUploadError = error; }
    }
  }

  if (!uploaded) throw new Error(`${CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_FALLBACK_ERROR_PREFIX} ${_.toString(_.get(lastUploadError, "message", ""))}`.trim());
};

const getComposerReadings = async (input: Locator): Promise<string[]> => {
  const value = await input.inputValue().catch(() => "");
  const visibleText = await input.innerText().catch(() => "");
  const domText = await input.textContent().catch(() => "");
  return [value, visibleText, domText];
};

const getComposerText = async (input: Locator): Promise<string> =>
  _.trim(_.maxBy(await getComposerReadings(input), (text) => text.length) || "");

const waitForSendButtonReady = async (sendButtons: Locator[], timeoutMs: number, signal?: AbortSignal): Promise<Locator | null> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    throwIfPlanningCancelled(signal);
    for (const sendButton of sendButtons) {
      if ((await sendButton.count().catch(() => 0)) > 0 && (await sendButton.isVisible().catch(() => false)) && (await sendButton.isEnabled().catch(() => false))) return sendButton;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_POLL_MS);
  }
  return null;
};

const waitForSubmissionConfirmation = async (
  input: Locator,
  page: Page,
  responseSelector: string,
  initialResponseSnapshots: ChatResponseSnapshot[],
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<boolean> => {
  const startedAt = Date.now();
  const initialResponseTexts = new Set(_.map(initialResponseSnapshots, (snapshot) => _.trim(snapshot.text)));
  const initialResponseIds = new Set(_.compact(_.map(initialResponseSnapshots, "identity")));
  while (Date.now() - startedAt < timeoutMs) {
    throwIfPlanningCancelled(signal);
    const responseSnapshots = await getChatResponseSnapshots(page, responseSelector).catch(() => []);
    if (responseSnapshots.length > initialResponseSnapshots.length || _.some(responseSnapshots, (snapshot) =>
      (!_.isEmpty(snapshot.identity) && !initialResponseIds.has(snapshot.identity)) ||
      (!_.isEmpty(_.trim(snapshot.text)) && !initialResponseTexts.has(_.trim(snapshot.text))))) return true;
    if (!(await input.isVisible().catch(() => false))) {
      await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_POLL_MS);
      continue;
    }
    const composerIsEmpty = (await getComposerText(input)).length <= CINEMATIC_CHAT_PLANNING_CONFIG.COMPOSER_EMPTY_MAX_CHARACTERS;
    if (composerIsEmpty) return true;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_POLL_MS);
  }
  return false;
};

const submitPrompt = async (
  page: Page,
  roomKey: string,
  prompt: string,
  inputSelector: string,
  sendSelector: string,
  responseSelector: string,
  busySelector: string,
  expectedSceneIds: string[],
  attachments: ChatRoomAttachment[] = [],
  completionMarker?: string,
  artifactType?: string,
  requestId?: string,
  signal?: AbortSignal,
): Promise<string> => {
  throwIfPlanningCancelled(signal);
  const diagnosticRunId = requestId ? createHash("sha256").update(requestId).digest("hex").slice(0, 12) : undefined;
  const pendingResponse = pendingRoomResponses.get(roomKey);
  if (pendingResponse && isPendingResponseForRequest(pendingResponse, page, expectedSceneIds, completionMarker, artifactType, requestId)) {
    await writeMusicDiagnostic("chat_pending_response_resumed", { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
    appLog(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_RESUME_LOG);
    try {
      const resumedResponse = await waitForStableResponse(
        page,
        responseSelector,
        busySelector,
        pendingResponse.initialCount,
        expectedSceneIds,
        pendingResponse.initialResponseSnapshots,
        completionMarker,
        artifactType,
        requestId,
        signal,
      );
      pendingRoomResponses.delete(roomKey);
      return resumedResponse;
    } catch (error) {
      if (!isResponseTimeoutError(error)) pendingRoomResponses.delete(roomKey);
      throw error;
    }
  }
  if (pendingResponse && !page.isClosed()) {
    await writeMusicDiagnostic("chat_previous_request_wait_started", { runId: diagnosticRunId, stage: artifactType });
    try {
      await waitForStableResponse(
        page, responseSelector, busySelector, pendingResponse.initialCount,
        pendingResponse.expectedSceneIds, pendingResponse.initialResponseSnapshots,
        pendingResponse.completionMarker, pendingResponse.artifactType,
        pendingResponse.requestId, signal,
      );
      pendingRoomResponses.delete(roomKey);
      await writeMusicDiagnostic("chat_previous_request_completed", { runId: diagnosticRunId, stage: artifactType });
    } catch (error) {
      if (!isResponseTimeoutError(error)) pendingRoomResponses.delete(roomKey);
      throw error;
    }
  }
  pendingRoomResponses.delete(roomKey);
  const uiReadyStartedAt = Date.now();
  appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_WAITING_INPUT);
  const input = await getLastVisibleLocator(page, inputSelector);
  try {
    await input.waitFor({ state: "visible", timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  } catch (error) {
    const title = await page.title().catch(() => "");
    const selectorMatches = await page.locator(inputSelector).count().catch(() => 0);
    await writeMusicDiagnostic("chat_input_failed", { runId: diagnosticRunId, stage: artifactType, status: String(selectorMatches), ...musicErrorDetails(error) });
    throw new Error(
      CHAT_UI_AUTOMATION_MESSAGES.INPUT_NOT_FOUND_DETAIL(
        page.url(),
        title,
        selectorMatches,
        _.toString(_.get(error, "message", error)),
      ),
    );
  }
  appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_INPUT_READY(Date.now() - uiReadyStartedAt));
  let initialResponseSnapshots: ChatResponseSnapshot[] = [];
  let initialCount = 0;
  const normalizedPrompt = normalizeRoomPrompt(prompt);
  let submissionConfirmed = false;
  const markPendingSubmission = (): void => {
    pendingRoomResponses.set(roomKey, {
      page, initialCount, initialResponseSnapshots,
      expectedSceneIds: _.clone(expectedSceneIds), completionMarker, artifactType, requestId,
    });
  };
  {
    await throwIfGrokRateLimited(page, busySelector);
    try {
      await waitForRoomIdle(page, busySelector, responseSelector, signal);
    } catch (error) {
      await writeMusicDiagnostic("chat_room_idle_failed", { runId: diagnosticRunId, stage: artifactType, ...musicErrorDetails(error) });
      throw error;
    }
    initialResponseSnapshots = await getChatResponseSnapshots(page, responseSelector);
    initialCount = initialResponseSnapshots.length;
    if (!_.isEmpty(attachments)) {
      throwIfPlanningCancelled(signal);
      await writeMusicDiagnostic("chat_attachment_started", { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
      try {
        await attachRoomFiles(page, attachments);
        await writeMusicDiagnostic("chat_attachment_completed", { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
      } catch (error) {
        await writeMusicDiagnostic("chat_attachment_failed", { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length, ...musicErrorDetails(error) });
        throw error;
      }
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_INPUT_SETTLE_MS);
    const submittedPrompt = `${normalizedPrompt}\n\n${CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE}`;
    await input.fill(submittedPrompt);
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.HUMAN_ACTION_SETTLE_MS);
    await page.waitForTimeout(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_SUBMIT_SETTLE_MS);
    const composerAssessment = assessChatComposerContent(
      submittedPrompt,
      CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE,
      requestId,
      await getComposerReadings(input),
    );
    if (!composerAssessment.valid) {
      await writeMusicDiagnostic("chat_composer_mismatch", { runId: diagnosticRunId, stage: artifactType, expectedChars: submittedPrompt.length, actualChars: composerAssessment.actualChars, status: composerAssessment.reason });
      throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.COMPOSER_CONTENT_MISMATCH_ERROR);
    }
    {
      const configuredSendButton = page.locator(sendSelector).filter({ visible: true }).last();
      const semanticSendButton = page
        .getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.SEMANTIC_SEND_BUTTON_NAME_PATTERN })
        .filter({ visible: true })
        .last();
      const sendButton = await waitForSendButtonReady(
        [configuredSendButton, semanticSendButton],
        _.isEmpty(attachments) ? CINEMATIC_CHAT_PLANNING_CONFIG.SEND_BUTTON_READY_TIMEOUT_MS : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS,
        signal,
      );
      await writeMusicDiagnostic("chat_send_button_checked", { runId: diagnosticRunId, stage: artifactType, status: sendButton ? "ready" : "unavailable", attachmentCount: attachments.length });
      if (sendButton) {
        await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.HUMAN_ACTION_SETTLE_MS);
        markPendingSubmission();
        await sendButton.click();
      }
      else throw new Error(_.isEmpty(attachments)
        ? CINEMATIC_CHAT_PLANNING_CONFIG.SEND_BUTTON_NOT_READY_ERROR
        : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SUBMIT_BLOCKED_ERROR);
      submissionConfirmed = await waitForSubmissionConfirmation(
        input,
        page,
        responseSelector,
        initialResponseSnapshots,
        _.isEmpty(attachments)
          ? CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_VERIFY_TIMEOUT_MS
          : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SUBMISSION_VERIFY_TIMEOUT_MS,
        signal,
      );
      await writeMusicDiagnostic("chat_submission_checked", { runId: diagnosticRunId, stage: artifactType, status: submissionConfirmed ? "confirmed" : "unconfirmed", attachmentCount: attachments.length });
    }
  }
  if (!submissionConfirmed) {
    await writeMusicDiagnostic("chat_submission_uncertain_waiting_response", { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
  } else {
    appLog(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_CONFIRMED_LOG.replace("{0}", _.toString(normalizedPrompt.length)));
  }
  try {
    const response = await waitForStableResponse(
      page,
      responseSelector,
      busySelector,
      initialCount,
      expectedSceneIds,
      initialResponseSnapshots,
      completionMarker,
      artifactType,
      requestId,
      signal,
    );
    pendingRoomResponses.delete(roomKey);
    return response;
  } catch (error) {
    if (!isResponseTimeoutError(error)) pendingRoomResponses.delete(roomKey);
    throw error;
  }
};

const getChatModelOption = (page: Page, modelLabel: RegExp) =>
  page
    .getByRole("menuitem", { name: modelLabel })
    .or(page.getByRole("menuitemradio", { name: modelLabel }))
    .or(page.getByRole("option", { name: modelLabel }))
    .or(page.locator('[role="listbox"] [role="option"], [role="menu"] button, [role="dialog"] button').filter({ hasText: modelLabel }))
    .filter({ visible: true })
    .first();

const clickChatModelOption = async (page: Page, modelLabel: RegExp): Promise<boolean> => {
  const option = getChatModelOption(page, modelLabel);
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const count = await option.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = option.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) continue;
      if (!(await candidate.isEnabled().catch(() => false))) continue;
      if (_.isEqual(await candidate.getAttribute("aria-disabled").catch(() => null), "true")) continue;
      await candidate.click();
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
};

const waitForRoomIdle = async (page: Page, busySelector: string, responseSelector: string, signal?: AbortSignal): Promise<void> => {
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_IDLE_WAIT_TIMEOUT_MS;
  let previousResponse = "";
  let stablePolls = 0;
  while (Date.now() < deadline) {
    throwIfPlanningCancelled(signal);
    await throwIfGrokRateLimited(page, busySelector);
    const busy = await page.locator(busySelector).filter({ visible: true }).count().then((count) => count > 0);
    const snapshots = await getChatResponseSnapshots(page, responseSelector);
    const latestResponse = _.trim(_.last(snapshots)?.text || "");
    stablePolls = !busy && _.isEqual(latestResponse, previousResponse) ? stablePolls + 1 : 0;
    previousResponse = latestResponse;
    if (stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_IDLE_STABLE_POLLS) return;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  throw new Error("chat_room_previous_response_still_running");
};

const waitForSelectedModelLabel = async (page: Page, buttonSelector: string, modelLabel: RegExp): Promise<boolean> => {
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const button = page.locator(buttonSelector).filter({ visible: true }).last();
    if (modelLabel.test(_.trim(await button.innerText().catch(() => "")))) return true;
    await page.waitForTimeout(100);
  }
  return false;
};

const selectChatModel = async (page: Page, model: AiPlanningChatModel | undefined, buttonSelector: string): Promise<void> => {
  if (!model || _.isEqual(model, AiPlanningChatModel.ChatGptAuto)) return;
  const modelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const button = await getLastVisibleLocator(page, buttonSelector, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS).catch(() => undefined);
  if (!button) {
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.MODEL_PICKER_NOT_FOUND);
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.MODEL_PICKER_NOT_FOUND);
  }
  const currentModelLabel = _.trim(await button.innerText().catch(() => ""));
  if (modelLabel.test(currentModelLabel)) return;
  await button.click();
  if (await clickChatModelOption(page, modelLabel) && await waitForSelectedModelLabel(page, buttonSelector, modelLabel)) return;
  await page.keyboard.press("Escape").catch(() => undefined);
  appWarn(CHAT_UI_AUTOMATION_MESSAGES.SELECTED_MODEL_UNAVAILABLE);
  throw new Error(CHAT_UI_AUTOMATION_MESSAGES.SELECTED_MODEL_UNAVAILABLE);
};

const selectGeminiChatModel = async (page: Page, model: AiPlanningChatModel | undefined, allowDefaultModel = false): Promise<void> => {
  if (!model) return;
  const requestedModelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const baseModelLabel = GEMINI_CHAT_BASE_MODEL_LABELS[model];
  if (!baseModelLabel) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
  let modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS).catch(
    () => undefined,
  );
  if (!modelButton) {
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_PICKER_NOT_FOUND);
    await writeMusicDiagnostic("chat_model_selection_failed", { provider: AiPlanningFallbackProvider.GeminiChat, model, stage: "model_picker", code: "picker_not_found" });
    if (allowDefaultModel) return;
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_PICKER_NOT_FOUND);
  }
  const currentModelLabel = _.trim(await modelButton.innerText().catch(() => ""));
  if (requestedModelLabel.test(currentModelLabel)) {
    await writeMusicDiagnostic("chat_model_selected", { provider: AiPlanningFallbackProvider.GeminiChat, model, status: "already_selected" });
    return;
  }
  await modelButton.click();
  if (await clickChatModelOption(page, requestedModelLabel)
    && await waitForSelectedModelLabel(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, requestedModelLabel)) {
    await writeMusicDiagnostic("chat_model_selected", { provider: AiPlanningFallbackProvider.GeminiChat, model, status: "selected" });
    return;
  }

  const thinkingLevelLabel = GEMINI_CHAT_THINKING_LEVEL_LABELS[model];
  if (!thinkingLevelLabel) {
    await page.keyboard.press("Escape").catch(() => undefined);
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
    await writeMusicDiagnostic("chat_model_selection_failed", { provider: AiPlanningFallbackProvider.GeminiChat, model, code: "model_unavailable" });
    if (allowDefaultModel) return;
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS);
  const fallbackCurrentModelLabel = _.trim(await modelButton.innerText().catch(() => ""));
  if (!baseModelLabel.test(fallbackCurrentModelLabel)) {
    await modelButton.click();
    if (!(await clickChatModelOption(page, baseModelLabel))) {
      await page.keyboard.press("Escape").catch(() => undefined);
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_BASE_MODEL_UNAVAILABLE);
      await writeMusicDiagnostic("chat_model_selection_failed", { provider: AiPlanningFallbackProvider.GeminiChat, model, code: "base_model_unavailable" });
      if (allowDefaultModel) return;
      throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_BASE_MODEL_UNAVAILABLE);
    }
  }
  modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS);
  await modelButton.click();
  const thinkingLevelTrigger = page
    .getByRole("menuitem", { name: CINEMATIC_CHAT_PLANNING_CONFIG.THINKING_LEVEL_NAME_PATTERN })
    .or(page.getByRole("button", { name: CINEMATIC_CHAT_PLANNING_CONFIG.THINKING_LEVEL_NAME_PATTERN }))
    .filter({ visible: true })
    .first();
  if (await thinkingLevelTrigger.isVisible().catch(() => false)) await thinkingLevelTrigger.click();
  if (await clickChatModelOption(page, thinkingLevelLabel)) {
    await writeMusicDiagnostic("chat_model_selected", { provider: AiPlanningFallbackProvider.GeminiChat, model, status: "selected_with_thinking_level" });
    return;
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_THINKING_UNAVAILABLE);
  await writeMusicDiagnostic("chat_model_selection_failed", { provider: AiPlanningFallbackProvider.GeminiChat, model, code: "thinking_level_unavailable" });
  if (allowDefaultModel) return;
  throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_THINKING_UNAVAILABLE);
};

const isGrokSecurityChallengeActive = async (page: Page, chatReady: boolean): Promise<boolean> => {
  const title = await page.title().catch(() => "");
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  const hasChallengeFrame = await page
    .locator(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_FRAME_SELECTOR)
    .filter({ visible: true })
    .count()
    .then((count) => count > 0)
    .catch(() => false);
  const challengeTitleVisible = CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test(title);
  const challengeBodyVisible = !chatReady && CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_TEXT_PATTERN.test(bodyText);
  return hasChallengeFrame || challengeTitleVisible || challengeBodyVisible;
};

const isGrokChatReady = async (page: Page): Promise<boolean> => {
  if (page.isClosed()) return false;
  let currentUrl: URL;
  try {
    currentUrl = new URL(page.url());
  } catch {
    return false;
  }
  if (!(currentUrl.hostname === "grok.com" || currentUrl.hostname.endsWith(".grok.com"))) return false;
  const input = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR).filter({ visible: true }).last();
  const [visible, enabled, editable] = await Promise.all([input.isVisible().catch(() => false), input.isEnabled().catch(() => false), input.isEditable().catch(() => false)]);
  return visible && enabled && editable;
};

const ensureGrokReady = async (page: Page, request: ChatPlanningRequest): Promise<void> => {
  const context = page.context();
  const contextWasReady = grokReadyContexts.has(context);
  const startedAt = Date.now();
  let challengeWasVisible = false;
  let challengeActiveLastPoll = false;
  let stableReadyPolls = 0;
  let previousReadyUrl = "";
  while (Date.now() - startedAt < CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_WAIT_TIMEOUT_MS) {
    throwIfPlanningCancelled(request.signal);
    if (page.isClosed()) throw new Error("grok_chat_page_closed_during_bootstrap");
    const chatReady = await isGrokChatReady(page);
    const challengeActive = await isGrokSecurityChallengeActive(page, chatReady);
    if (challengeActive) {
      grokReadyContexts.delete(context);
      stableReadyPolls = 0;
      previousReadyUrl = "";
      challengeWasVisible = true;
      if (request.chromeHeadless !== false) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.ERROR_GROK_SECURITY_HEADLESS);
      if (!challengeActiveLastPoll) {
        appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLOUDFLARE_CHALLENGE_NOTICE);
        await page.bringToFront().catch(() => undefined);
      }
      challengeActiveLastPoll = true;
      await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_POLL_MS);
      continue;
    }
    challengeActiveLastPoll = false;
    const currentUrl = page.url();
    stableReadyPolls = chatReady ? (_.isEqual(currentUrl, previousReadyUrl) ? _.add(stableReadyPolls, 1) : 1) : 0;
    previousReadyUrl = chatReady ? currentUrl : "";
    const requiredStablePolls = challengeWasVisible
      ? CINEMATIC_CHAT_PLANNING_CONFIG.GROK_POST_CHALLENGE_READY_STABLE_POLLS
      : CINEMATIC_CHAT_PLANNING_CONFIG.GROK_READY_STABLE_POLLS;
    if (stableReadyPolls >= requiredStablePolls) {
      grokReadyContexts.add(context);
      appLog(
        challengeWasVisible
          ? CHAT_UI_AUTOMATION_MESSAGES.CLOUDFLARE_VERIFIED
          : contextWasReady
            ? CHAT_UI_AUTOMATION_MESSAGES.CLOUDFLARE_ROOM_READY
            : CHAT_UI_AUTOMATION_MESSAGES.CHAT_UI_READY,
      );
      return;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_POLL_MS);
  }
  throw new Error(challengeWasVisible ? "grok_security_verification_timeout" : "grok_chat_not_ready_or_login_required");
};

const getGrokBootstrapMutex = (context: BrowserContext): SimpleMutex => {
  const existingMutex = grokBootstrapMutexes.get(context);
  if (existingMutex) return existingMutex;
  const mutex = new SimpleMutex();
  grokBootstrapMutexes.set(context, mutex);
  return mutex;
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
    const popupPromise = page
      .context()
      .waitForEvent("page", { timeout: 5000 })
      .catch(() => undefined);
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
      CHAT_UI_AUTOMATION_MESSAGES.CHATGPT_LOGIN_INCOMPLETE(
        page.url(),
        await page.title().catch(() => ""),
        _.toString(_.get(error, "message", error)),
      ),
    );
  }
};

const generateWithGeminiChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, getPlanningRoomKey(request));
  await getLastVisibleLocator(room, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR);
  await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.HUMAN_ACTION_SETTLE_MS);
  await selectGeminiChatModel(room, request.model, request.allowDefaultGeminiModel);
  const response = await submitPrompt(
    room,
    getPlanningRoomKey(request),
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.artifactType,
    request.requestId,
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

export const prepareChatPlanningRoom = async (request: ChatPlanningRequest): Promise<void> => {
  throwIfPlanningCancelled(request.signal);
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.GeminiChat)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, getPlanningRoomKey(request));
    await getLastVisibleLocator(room, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR);
    await selectGeminiChatModel(room, request.model, request.allowDefaultGeminiModel);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.ChatGptUi)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, getPlanningRoomKey(request));
    await ensureChatGptReady(room, browser.account.email);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.GrokChat)) {
    const browser = await getOrLaunchGrokBrowser(request.chromeHeadless);
    const releaseBootstrap = await getGrokBootstrapMutex(browser.context).acquire();
    try {
      const room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, getPlanningRoomKey(request));
      await ensureGrokReady(room, request);
      await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_MODEL_BUTTON_SELECTOR);
    } finally {
      releaseBootstrap();
    }
  }
};

const generateWithGrokChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGrokBrowser(request.chromeHeadless);
  const releaseBootstrap = await getGrokBootstrapMutex(browser.context).acquire();
  let room: Page;
  try {
    room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, getPlanningRoomKey(request));
    await ensureGrokReady(room, request);
  } finally {
    releaseBootstrap();
  }
  await selectChatModel(room, request.model, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_MODEL_BUTTON_SELECTOR);
  const response = await submitPrompt(
    room,
    getPlanningRoomKey(request),
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.artifactType,
    request.requestId,
    request.signal,
  );
  scheduleGlobalBrowserCleanup();
  return response;
};

const generateWithChatGptUi = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, getPlanningRoomKey(request));
  await ensureChatGptReady(room, browser.account.email);
  const response = await submitPrompt(
    room,
    getPlanningRoomKey(request),
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.artifactType,
    request.requestId,
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
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.Disabled)) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.FALLBACK_DISABLED);
  throwIfPlanningCancelled(request.signal);
  const roomKey = getPlanningRoomKey(request);
  const planningMutex = planningMutexes.get(roomKey) || new SimpleMutex();
  planningMutexes.set(roomKey, planningMutex);
  const mutexStartedAt = Date.now();
  const release = await planningMutex.acquire();
  let responseCompleted = false;
  const diagnosticBase = { runId: request.requestId || request.projectId, workerId: request.workerId, provider: request.provider, model: request.model, stage: request.artifactType || "planning", attachmentCount: request.attachments?.length || 0 };
  await writeMusicDiagnostic("chat_request_started", { ...diagnosticBase, elapsedMs: Date.now() - mutexStartedAt });
  try {
    throwIfPlanningCancelled(request.signal);
    appLog(
      CHAT_UI_AUTOMATION_MESSAGES.PLANNING_QUEUE_ACQUIRED(
        request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID,
        providerNames[request.provider],
        request.projectId,
        Date.now() - mutexStartedAt,
      ),
    );
    const generator = providerGenerators[request.provider];
    if (!generator) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.FALLBACK_UNSUPPORTED);
    let lastError: unknown;
    for (let recoveryAttempt = 0; recoveryAttempt <= CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_ATTEMPTS; recoveryAttempt++) {
      try {
        await writeMusicDiagnostic("chat_attempt_started", { ...diagnosticBase, attempt: recoveryAttempt + 1 });
        await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_REQUEST_COOLDOWN_MS);
        const text = await generator(request);
        await writeMusicDiagnostic("chat_response_completed", { ...diagnosticBase, attempt: recoveryAttempt + 1, responseChars: text.length, elapsedMs: Date.now() - mutexStartedAt });
        providerErrorCounts.delete(roomKey);
        responseCompleted = true;
        return { text, provider: request.provider };
      } catch (error) {
        await writeMusicDiagnostic("chat_attempt_failed", { ...diagnosticBase, attempt: recoveryAttempt + 1, ...musicErrorDetails(error) });
        lastError = error;
        throwIfPlanningCancelled(request.signal);
        const errorMessage = _.toString(_.get(error, "message", error));
        if (_.isEqual(errorMessage, CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR)) {
          const providerErrorCount = (providerErrorCounts.get(roomKey) || 0) + 1;
          providerErrorCounts.set(roomKey, providerErrorCount);
          if (providerErrorCount >= 2) {
            providerErrorCounts.delete(roomKey);
            try {
              await reloadChatPlanningRoom(request);
              appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_ROOM_RELOADED(providerNames[request.provider]));
            } catch (reloadError) {
              await writeMusicDiagnostic("chat_room_reload_failed", { ...diagnosticBase, ...musicErrorDetails(reloadError) });
              appWarn(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_ROOM_RELOAD_FAILED(providerNames[request.provider], _.toString(_.get(reloadError, "message", reloadError))));
              throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_ROOM_RELOAD_FAILED_ERROR, { cause: reloadError });
            }
            throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_ROOM_RELOAD_ERROR);
          }
        }
        const canRecoverClosedRoom =
          CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_ERROR_PATTERN.test(errorMessage) && recoveryAttempt < CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_ATTEMPTS;
        if (!canRecoverClosedRoom) throw error;
        appWarn(_.replace(CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_LOG, SecurityConstants.PLACEHOLDER_0, providerNames[request.provider]));
        await closeChatPlanningRoom(request);
      }
    }
    throw lastError;
  } catch (error) {
    await writeMusicDiagnostic("chat_request_failed", { ...diagnosticBase, elapsedMs: Date.now() - mutexStartedAt, ...musicErrorDetails(error) });
    if (!_.isEqual(_.toString(_.get(error, "message", error)), CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)) {
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_PROVIDER_INCOMPLETE(providerNames[request.provider], _.toString(_.get(error, "message", error))));
    }
    throw error;
  } finally {
    if (responseCompleted && (request.closeRoomOnComplete ?? CINEMATIC_CHAT_PLANNING_CONFIG.CLOSE_ROOM_ON_COMPLETE)) {
      await closeChatPlanningRoom(request);
    }
    release();
  }
};
