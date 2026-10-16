import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import { CHAT_PLANNING_RUNTIME as C, CHAT_JSON_PATTERNS as JP } from "../../constants/chatPlanningRuntime.js";
import * as ST from "../../constants/sourceText.js";
import { throwIfPlanningCancelled } from "../../lib/chatPlanningUtils.js";
import * as MR from "../../constants/motionRuntime.js";
import {
  SOURCE_TEMPLATE_SYMBOL_683,
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEMPLATE_SYMBOL_86,
  SOURCE_TEXT_ABORT,
  SOURCE_TEXT_0_2,
  SOURCE_TEXT_A,
  SOURCE_TEXT_ALERTDIALOG,
  SOURCE_TEXT_ALREADY_SELECTED,
  SOURCE_TEXT_ARIA_DISABLED,
  SOURCE_TEXT_ARTIFACTTYPE,
  SOURCE_TEXT_BASE_MODEL_UNAVAILABLE,
  SOURCE_TEXT_BODY,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_CHAT_ATTACHMENT_COMPLETED,
  SOURCE_TEXT_CHAT_ATTACHMENT_FAILED,
  SOURCE_TEXT_CHAT_ATTACHMENT_STARTED,
  SOURCE_TEXT_CHAT_ATTEMPT_FAILED,
  SOURCE_TEXT_CHAT_ATTEMPT_STARTED,
  SOURCE_TEXT_CHAT_COMPOSER_MISMATCH,
  SOURCE_TEXT_CHAT_INPUT_FAILED,
  SOURCE_TEXT_CHAT_MODEL_SELECTED,
  SOURCE_TEXT_CHAT_MODEL_SELECTION_FAILED,
  SOURCE_TEXT_CHAT_PENDING_RESPONSE_RESUMED,
  SOURCE_TEXT_CHAT_PLANNING_ROOM_UNAVAILABLE_FOR_RELOAD,
  SOURCE_TEXT_CHAT_PREVIOUS_REQUEST_COMPLETED,
  SOURCE_TEXT_CHAT_PREVIOUS_REQUEST_WAIT_STARTED,
  SOURCE_TEXT_CHAT_PROVIDER_ALERT,
  SOURCE_TEXT_CHAT_PROVIDER_RESPONSE_ERROR,
  SOURCE_TEXT_CHAT_PROVIDER_RETRY_SAME_ROOM,
  SOURCE_TEXT_CHAT_PROVIDER_ROOM_RELOAD,
  SOURCE_TEXT_CHAT_REQUEST_FAILED,
  SOURCE_TEXT_CHAT_REQUEST_STARTED,
  SOURCE_TEXT_CHAT_RESPONSE_COMPLETED,
  SOURCE_TEXT_CHAT_RESPONSE_TIMEOUT,
  SOURCE_TEXT_CHAT_RESPONSE_UI_CONFIRMED,
  SOURCE_TEXT_CHAT_ROOM_IDLE_FAILED,
  SOURCE_TEXT_CHAT_ROOM_PREVIOUS_RESPONSE_STILL_RUNNING,
  SOURCE_TEXT_CHAT_SEND_BUTTON_CHECKED,
  SOURCE_TEXT_CHAT_SUBMISSION_CHECKED,
  SOURCE_TEXT_CHAT_SUBMISSION_UNCERTAIN_WAITING_RESPONSE,
  SOURCE_TEXT_CHATGPT,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_CODE,
  SOURCE_TEXT_COMPLETIONMARKER,
  SOURCE_TEXT_CONFIRMED,
  SOURCE_TEXT_DIALOG,
  SOURCE_TEXT_DISABLED,
  SOURCE_TEXT_DOMCONTENTLOADED,
  SOURCE_TEXT_ESCAPE,
  SOURCE_TEXT_FILECHOOSER,
  SOURCE_TEXT_GEMINI_CHAT,
  SOURCE_TEXT_GROK_CHAT,
  SOURCE_TEXT_GROK_CHAT_NOT_READY_OR_LOGIN,
  SOURCE_TEXT_GROK_CHAT_PAGE_CLOSED_DURING_BOOTSTRAP,
  SOURCE_TEXT_GROK_COM,
  SOURCE_TEXT_GROK_COM_2,
  SOURCE_TEXT_GROK_SECURITY_VERIFICATION_TIMEOUT,
  SOURCE_TEXT_HEADING,
  SOURCE_TEXT_HEX,
  SOURCE_TEXT_HIDDEN,
  SOURCE_TEXT_HREF,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_IDENTITY,
  SOURCE_TEXT_INPUT_TYPE_FILE,
  SOURCE_TEXT_MENUITEM,
  SOURCE_TEXT_MENUITEMRADIO,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_MODEL_PICKER,
  SOURCE_TEXT_MODEL_UNAVAILABLE,
  SOURCE_TEXT_MUSIC_MIXER_RANKING,
  SOURCE_TEXT_NONE,
  SOURCE_TEXT_NOT_REQUIRED,
  SOURCE_TEXT_OPTION,
  SOURCE_TEXT_PAGE,
  SOURCE_TEXT_PATH,
  SOURCE_TEXT_PICKER_NOT_FOUND,
  SOURCE_TEXT_PLANNING,
  SOURCE_TEXT_READY,
  SOURCE_TEXT_REQUESTID,
  SOURCE_TEXT_ROLE_ALERT,
  SOURCE_TEXT_ROLE_LISTBOX_ROLE_OPTION_ROLE_MENU,
  SOURCE_TEXT_ROLE_MENU_ROLE_LISTBOX_ROLE_DIALOG,
  SOURCE_TEXT_ROLE_MENU_ROLE_MENUITEM,
  SOURCE_TEXT_SCENES,
  SOURCE_TEXT_SELECTED,
  SOURCE_TEXT_SELECTED_WITH_THINKING_LEVEL,
  SOURCE_TEXT_SHA256,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_SYMBOL_34,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_TEXT,
  SOURCE_TEXT_THINKING_LEVEL_UNAVAILABLE,
  SOURCE_TEXT_TRUE,
  SOURCE_TEXT_UNAVAILABLE,
  SOURCE_TEXT_UNCONFIRMED,
  SOURCE_TEXT_VISIBLE,
  SOURCE_TEXT_XPATH,
  SOURCE_TEXT_XPATH_2,
} from "../../constants/sourceText.js";
import { parseJson } from "../../lib/jsonStringify.js";
import { createHash } from "crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import _ from "lodash";
import type { BrowserContext, Locator, Page } from "playwright";
import { waitForMusicMixerUploads } from "./musicMixerUploadReadiness.js";
import { CINEMATIC_CHAT_MODEL_LABELS, CINEMATIC_CHAT_PLANNING_CONFIG, EXTERNAL_URLS, GEMINI_CHAT_BASE_MODEL_LABELS, GEMINI_CHAT_THINKING_LEVEL_LABELS, normalizeCinematicArtifactIdentity, SecurityConstants } from "../../constants/index.js";
import { CHAT_UI_AUTOMATION_MESSAGES } from "../../constants/messages.js";
import { MOTION_TEMPLATE_SYMBOL_12, MOTION_TEMPLATE_SYMBOL_26, MOTION_TEXT_ALERT, MOTION_TEXT_RESPONSE, MOTION_TEXT_ROOMPAGE, MOTION_TEXT_SYMBOL_27, MOTION_TEXT_SYMBOL_35, MOTION_TEXT_SYMBOL_36, MOTION_TEXT_SYMBOL_37 } from "../../constants/motionRuntime.js";
import { jsonUtils } from "../../lib/json.js";
import { appLog, appWarn } from "../../lib/logger.js";
import { delayAsync } from "../../lib/shared-utils.js";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../types.js";
import { assessChatComposerContent } from "./chatComposerValidation.js";
import { getClaudeComposerScope, observeClaudeUploads, waitForClaudeUploads } from "./claudeUploadReadiness.js";
import { selectClaudeChatModel } from "./claudeModelService.js";
import { DEEPSEEK_CHAT_CONFIG as D } from "../../constants/deepseekChat.js";
import { selectDeepSeekChatModel } from "./deepseekModelService.js";
import { createDeepSeekRetryRecovery } from "./deepseekRetryService.js";
import { getDeepSeekComposerScope, observeDeepSeekUploads, waitForDeepSeekUploads } from "./deepseekUploadReadiness.js";
import { closeAppBrowserAfterTask, closeIdleSharedChrome, closeOwnedGrokBrowserIfIdle, getOrLaunchGlobalBrowser, getOrLaunchGrokBrowser, scheduleGlobalBrowserCleanup, SimpleMutex } from "./imageGeneratorService.js";
import { musicErrorDetails, writeMusicDiagnostic } from "./musicDiagnosticService.js";
interface ChatRoomAttachment { name: string; mimeType: string; buffer?: Buffer; path?: string; }
interface ChatResponseSnapshot { identity: string; text: string; }
interface PendingRoomResponse { page: Page; prompt: string; initialCount: number; initialResponseSnapshots: ChatResponseSnapshot[]; expectedSceneIds: string[]; completionMarker?: string; artifactType?: string; requestId?: string; }
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
export interface ChatPlanningRoomIdentity { provider: AiPlanningFallbackProvider; projectId: string; workerId?: string; }
const planningMutexes = new Map<string, SimpleMutex>();
const geminiRooms = new Map<string, Page>();
const grokRooms = new Map<string, Page>();
const chatGptRooms = new Map<string, Page>();
const claudeRooms = new Map<string, Page>();
const deepseekRooms = new Map<string, Page>();
const pendingRoomResponses = new Map<string, PendingRoomResponse>();
let activeMusicMixerRequests = 0;
const scheduleChatBrowserCleanup = (): void => {
  if (activeMusicMixerRequests === 0) scheduleGlobalBrowserCleanup();
};
const providerErrorCounts = new Map<string, number>();
const grokBootstrapMutexes = new WeakMap<BrowserContext, SimpleMutex>();
const grokReadyContexts = new WeakSet<BrowserContext>();
interface ActivePlanningController { controller: AbortController; provider: AiPlanningFallbackProvider; }
const activePlanningControllers = new Map<string, Map<string, ActivePlanningController>>();
export const beginChatPlanningRun = (runId: string, startedAt: number, workerId: string = CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID, provider: AiPlanningFallbackProvider = AiPlanningFallbackProvider.Disabled): { signal: AbortSignal; cancel: () => void; complete: () => void } => {
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
const normalizeRoomPrompt = (prompt: string): string => _.trim(_.replace(_.replace(prompt, CINEMATIC_CHAT_PLANNING_CONFIG.WINDOWS_LINE_ENDING_PATTERN, MOTION_TEXT_SYMBOL_27), CINEMATIC_CHAT_PLANNING_CONFIG.EXCESS_BLANK_LINES_PATTERN, MOTION_TEXT_SYMBOL_37));
const closesString = (rest: string, isKey: boolean): boolean => {
  const tail = rest.trimStart();
  if (isKey) return tail.startsWith(MR.MOTION_TEXT_SYMBOL_39);
  if (!tail) return true;
  if (tail[0] === MR.MOTION_TEXT_COMMA) return JP.VALUE_AFTER_COMMA.test(tail.slice(1));
  if (tail[0] === MR.MOTION_TEXT_SYMBOL_36 || tail[0] === MR.MOTION_TEXT_SYMBOL_51) return JP.AFTER_CONTAINER.test(tail.slice(1));
  return false;
};
export const repairLooseJson = (text: string): string => {
  let out: string = MR.MOTION_TEXT_EMPTY,
    inString = false,
    isKey = false,
    escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === MR.MOTION_TEXT_SYMBOL_49) escaped = true;
      else if (ch === MR.MOTION_TEXT_SYMBOL_47) {
        if (!closesString(text.slice(i + 1), isKey)) {
          out += MR.MOTION_TEXT_SYMBOL_53;
          continue;
        }
        inString = false;
      }
      out += ch;
      continue;
    }
    if (ch === MR.MOTION_TEXT_SYMBOL_47) {
      inString = true;
      isKey = JP.OBJECT_KEY_PREFIX.test(out) && !JP.ARRAY_PREFIX.test(out) && closesString(text.slice(text.indexOf(MR.MOTION_TEXT_SYMBOL_47, i + 1) + 1), true);
      out += ch;
      continue;
    }
    if (ch === MR.MOTION_TEXT_COMMA) {
      const rest = text.slice(i + 1).match(JP.CONTAINER_END);
      if (rest) continue;
    }
    if (JP.IDENTIFIER_START.test(ch) && JP.OBJECT_KEY_PREFIX.test(out)) {
      const key = text.slice(i).match(JP.UNQUOTED_KEY);
      if (key) {
        out += MR.MOTION_TEXT_SYMBOL_47 + key[1] + MR.MOTION_TEXT_SYMBOL_47;
        i += key[1].length + key[2].length - 1;
        continue;
      }
    }
    out += ch;
  }
  return out;
};
const parseStrictRoomJson = (text: string): unknown => {
  const trimmed = _.trim(text);
  try {
    return parseJson(trimmed);
  } catch {
    const start = trimmed.indexOf(MOTION_TEXT_SYMBOL_35);
    const end = trimmed.lastIndexOf(MOTION_TEXT_SYMBOL_36);
    if (start < 0 || end <= start) return undefined;
    const candidate = trimmed.slice(start, end + 1);
    try {
      return parseJson(candidate);
    } catch {
      try {
        const cleaned = candidate.replace(JP.JSON_FENCE, MR.MOTION_TEXT_EMPTY).replace(JP.CODE_FENCE, MR.MOTION_TEXT_EMPTY).trim();
        const cleanStart = cleaned.indexOf(MOTION_TEXT_SYMBOL_35);
        const cleanEnd = cleaned.lastIndexOf(MOTION_TEXT_SYMBOL_36);
        if (cleanStart >= 0 && cleanEnd > cleanStart) {
          const body = cleaned.slice(cleanStart, cleanEnd + 1);
          try {
            return parseJson(body);
          } catch {
            return parseJson(repairLooseJson(body));
          }
        }
      } catch {
        return undefined;
      }
      return undefined;
    }
  }
};
const getPlanningRoomKey = (request: ChatPlanningRoomIdentity): string => _.join([request.provider, request.projectId, request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID], CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR);
const getProviderRooms = (provider: AiPlanningFallbackProvider): Map<string, Page> | undefined => {
  if (_.isEqual(provider, AiPlanningFallbackProvider.GeminiChat)) return geminiRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return grokRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return chatGptRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ClaudeChat)) return claudeRooms;
  if (_.isEqual(provider, AiPlanningFallbackProvider.DeepSeekChat)) return deepseekRooms;
  return undefined;
};
const hasActiveChatRooms = (): boolean => _.some([geminiRooms, grokRooms, chatGptRooms, claudeRooms, deepseekRooms], (rooms) => _.some([...rooms.values()], (page) => !page.isClosed()));
export const closeChatBrowserIfIdle = async (): Promise<boolean> => {
  if (hasActiveChatRooms()) return false;
  const grokClosed = await closeOwnedGrokBrowserIfIdle();
  return grokClosed && ((await closeAppBrowserAfterTask(true)) || (await closeIdleSharedChrome()));
};
export const closeChatPlanningRoom = async (request: ChatPlanningRoomIdentity): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  if (!rooms) return;
  const roomKey = getPlanningRoomKey(request);
  const page = rooms.get(roomKey);
  rooms.delete(roomKey);
  pendingRoomResponses.delete(roomKey);
  if (page && !page.isClosed()) await page.close().catch(() => undefined);
  if (!hasActiveChatRooms()) scheduleChatBrowserCleanup();
};
export const closeChatPlanningRoomsForProject = async (request: Pick<ChatPlanningRoomIdentity, "provider" | "projectId">): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  if (!rooms || _.isEmpty(request.projectId)) return;
  const prefix = SOURCE_TEMPLATE_SYMBOL_683(String(request.provider), String(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR), String(request.projectId), String(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR));
  const roomKeys = _.filter([...rooms.keys()], (key) => _.startsWith(key, prefix));
  await Promise.allSettled(
    _.map(roomKeys, async (key) => {
      const page = rooms.get(key);
      rooms.delete(key);
      pendingRoomResponses.delete(key);
      if (page && !page.isClosed()) await page.close().catch(() => undefined);
    }),
  );
  await closeChatBrowserIfIdle();
};
const reloadChatPlanningRoom = async (request: ChatPlanningRoomIdentity): Promise<void> => {
  const rooms = getProviderRooms(request.provider);
  const roomKey = getPlanningRoomKey(request);
  const page = rooms?.get(roomKey);
  pendingRoomResponses.delete(roomKey);
  if (!page || page.isClosed()) throw new Error(SOURCE_TEXT_CHAT_PLANNING_ROOM_UNAVAILABLE_FOR_RELOAD);
  await page.reload({
    waitUntil: SOURCE_TEXT_DOMCONTENTLOADED,
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS,
  });
};
const getProviderConversationSelectors = (provider: AiPlanningFallbackProvider): { item: string; action: string; ready: string; sidebarOpen: string; sidebarReady: string; url: string } | undefined => {
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
  (await item.getAttribute(SOURCE_TEXT_HREF).catch(() => null)) ||
  (await item
    .locator(SOURCE_TEXT_A)
    .first()
    .getAttribute(SOURCE_TEXT_HREF)
    .catch(() => null)) ||
  (await item.innerText().catch(() => MR.MOTION_TEXT_EMPTY));
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
    const parentActionButton = item.locator(SOURCE_TEXT_XPATH).locator(actionSelector).last();
    const containerActionButton = item.locator(SOURCE_TEXT_XPATH_2).locator(actionSelector).last();
    const actionButton = _.gt(await directActionButton.count().catch(() => 0), 0) ? directActionButton : _.gt(await parentActionButton.count().catch(() => 0), 0) ? parentActionButton : containerActionButton;
    const actionCount = await actionButton.count().catch(() => 0);
    if (_.isEqual(actionCount, 0)) {
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_OPTION_BUTTON_NOT_FOUND(provider));
      continue;
    }
    const actionVisible = await actionButton
      .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
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
      .getByRole(SOURCE_TEXT_MENUITEM, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN })
      .or(page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
      .or(page.locator(SOURCE_TEXT_ROLE_MENU_ROLE_MENUITEM).filter({ hasText: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
      .filter({ visible: true })
      .last();
    const deleteVisible = await deleteMenuItem
      .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    if (!deleteVisible) {
      const visibleMenuText = _.join(
        _.compact(
          _.map(
            await page
              .locator(SOURCE_TEXT_ROLE_MENU_ROLE_LISTBOX_ROLE_DIALOG)
              .allTextContents()
              .catch(() => []),
            (value) => _.trim(value),
          ),
        ),
        SOURCE_TEXT_SYMBOL_34,
      );
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_DELETE_COMMAND_NOT_FOUND(provider, visibleMenuText));
      continue;
    }
    await deleteMenuItem.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
    const dialog = page.getByRole(SOURCE_TEXT_DIALOG).or(page.getByRole(SOURCE_TEXT_ALERTDIALOG)).filter({ visible: true }).last();
    const hasDialog = await dialog
      .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_CONFIRM_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_DIALOG_VISIBILITY(provider, hasDialog));
    if (hasDialog) {
      const confirmButton = dialog
        .getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_PATTERN })
        .or(dialog.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CONVERSATION_DELETE_FALLBACK_PATTERN }))
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
      await page
        .locator(itemSelector)
        .count()
        .catch(() => 0),
      await getConversationIdentity(page.locator(itemSelector).first()),
    ),
  );
  return false;
};
const deleteAllGeminiActivity = async (page: Page, detectedConversationCount: number): Promise<number> => {
  await page.goto(EXTERNAL_URLS.GEMINI_ACTIVITY, {
    waitUntil: SOURCE_TEXT_DOMCONTENTLOADED,
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS,
  });
  const deleteActivityButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true }).filter({ visible: true }).first();
  await deleteActivityButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await deleteActivityButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const allTimeOption = page.getByRole(SOURCE_TEXT_MENUITEM, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_ALL_TIME_PATTERN }).filter({ visible: true }).first();
  await allTimeOption.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await allTimeOption.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const confirmDialog = page
    .getByRole(SOURCE_TEXT_DIALOG)
    .filter({ has: page.getByRole(SOURCE_TEXT_HEADING, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_CONFIRM_HEADING_PATTERN }) })
    .filter({ visible: true })
    .last();
  await confirmDialog.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const confirmButton = confirmDialog.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_ACTIVITY_DELETE_PATTERN, exact: true }).filter({ visible: true }).last();
  await confirmButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await confirmButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmDialog.waitFor({ state: SOURCE_TEXT_HIDDEN, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ALL_ACTIVITY_DELETED(AiPlanningFallbackProvider.GeminiChat));
  return detectedConversationCount;
};
const deleteAllChatGptConversations = async (page: Page, detectedConversationCount: number): Promise<number> => {
  await page.goto(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DATA_CONTROLS_URL, {
    waitUntil: SOURCE_TEXT_DOMCONTENTLOADED,
    timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS,
  });
  const settingsDialog = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_SETTINGS_DIALOG_SELECTOR).filter({ visible: true }).last();
  await settingsDialog.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  await settingsDialog.getByText(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DATA_CONTROLS_HEADING_PATTERN, { exact: true }).first().waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const deleteAllButton = settingsDialog
    .getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CHATS_PATTERN })
    .or(settingsDialog.locator(SOURCE_TEXT_BUTTON).filter({ hasText: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CHATS_PATTERN }))
    .filter({ visible: true })
    .last();
  await deleteAllButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await deleteAllButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const confirmationDialog = page
    .getByRole(SOURCE_TEXT_DIALOG)
    .or(page.getByRole(SOURCE_TEXT_ALERTDIALOG))
    .filter({ has: page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CONFIRM_PATTERN }) })
    .filter({ visible: true })
    .last();
  await confirmationDialog.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_CONFIRM_TIMEOUT_MS });
  const confirmButton = confirmationDialog.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_DELETE_ALL_CONFIRM_PATTERN }).filter({ visible: true }).last();
  await confirmButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await confirmationDialog.waitFor({ state: SOURCE_TEXT_HIDDEN, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ALL_ACTIVITY_DELETED(AiPlanningFallbackProvider.ChatGptUi));
  return detectedConversationCount;
};
const deleteAllGrokConversations = async (page: Page, detectedConversationCount: number): Promise<number> => {
  const bulkButton = page
    .getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_DELETE_ALL_PATTERN })
    .or(page.getByRole(SOURCE_TEXT_MENUITEM, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_DELETE_ALL_PATTERN }))
    .filter({ visible: true })
    .last();
  await bulkButton.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  await bulkButton.click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
  const confirmation = page
    .getByRole(SOURCE_TEXT_DIALOG)
    .or(page.getByRole(SOURCE_TEXT_ALERTDIALOG))
    .filter({ has: page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_DELETE_ALL_PATTERN }) })
    .filter({ visible: true })
    .last();
  if (await confirmation.isVisible().catch(() => false)) {
    await confirmation.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.GROK_DELETE_ALL_PATTERN }).filter({ visible: true }).last().click({ timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS });
    await confirmation.waitFor({ state: SOURCE_TEXT_HIDDEN, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  }
  appLog(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ALL_ACTIVITY_DELETED(AiPlanningFallbackProvider.GrokChat));
  return detectedConversationCount;
};
const deleteProviderConversationHistory = async (page: Page, provider: AiPlanningFallbackProvider): Promise<number> => {
  const selectors = getProviderConversationSelectors(provider);
  if (!selectors) return 0;
  if (_.isEqual(provider, AiPlanningFallbackProvider.ChatGptUi)) return deleteAllChatGptConversations(page, 0);
  if (!_.includes(page.url(), new URL(selectors.url).hostname)) {
    await page.goto(selectors.url, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
  }
  await page.locator(selectors.ready).last().waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  const sidebarReady = page.locator(selectors.sidebarReady).filter({ visible: true }).first();
  const sidebarOpenButton = page.locator(selectors.sidebarOpen).filter({ visible: true }).first();
  if (!(await sidebarReady.isVisible().catch(() => false)) && (await sidebarOpenButton.isVisible().catch(() => false))) {
    await sidebarOpenButton.click({ force: true, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => sidebarOpenButton.evaluate((element: HTMLElement) => element.click()));
  }
  const sidebarLoaded = await sidebarReady
    .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS })
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
  if (_.isEqual(provider, AiPlanningFallbackProvider.GrokChat)) return _.isEqual(initialConversationCount, 0) ? 0 : deleteAllGrokConversations(page, initialConversationCount);
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
  const mutexPrefix = SOURCE_TEMPLATE_SYMBOL_75(String(provider), String(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR));
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
    return { closedRoomCount: pages.length, deletedConversationCount, deletedAll: _.includes([AiPlanningFallbackProvider.ChatGptUi, AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.GrokChat], provider) };
  } catch (error) {
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.CLEANUP_ERROR(provider, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
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
const createRoom = async (context: BrowserContext, url: string, rooms: Map<string, Page>, projectId: string, signal?: AbortSignal): Promise<Page> => {
  throwIfPlanningCancelled(signal);
  const existingRoom = getLiveRoom(rooms, projectId);
  if (existingRoom) return existingRoom;
  const page = await context.newPage();
  try {
    throwIfPlanningCancelled(signal);
    rooms.set(projectId, page);
    await page.goto(url, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
    throwIfPlanningCancelled(signal);
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
    .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
  if (becameVisible) return visibleCandidate;
  for (let index = (await candidates.count()) - 1; index >= 0; index--) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  throw Object.assign(new Error(CHAT_UI_AUTOMATION_MESSAGES.INPUT_AREA_NOT_FOUND), { [MR.MOTION_TEXT_ROOMPAGE]: page });
};
export const getChatResponseSnapshots = async (page: Page, responseSelector: string): Promise<ChatResponseSnapshot[]> =>
  page
    .locator(responseSelector)
    .evaluateAll(
      (elements, browserPayload) => {
        const { ST } = browserPayload.sharedTexts;
        const { SOURCE_TEXT_HIDDEN, SOURCE_TEXT_NONE, SOURCE_TEXT_SYMBOL_16, MOTION_TEXT_EMPTY } = browserPayload.texts;
        const identityConfig = browserPayload.payload;
        return elements
          .filter((element) => {
            if (elements.some((other) => other !== element && element.contains(other))) return false;
            if (!(element instanceof HTMLElement)) return false;
            const style = window.getComputedStyle(element);
            return style.visibility !== SOURCE_TEXT_HIDDEN && style.display !== SOURCE_TEXT_NONE && element.getClientRects().length > 0;
          })
          .map((element, index) => {
            const identityElement = element.closest(identityConfig.selector) || element;
            const messageId = identityElement.getAttribute(identityConfig.messageIdAttribute) || MOTION_TEXT_EMPTY;
            const testId = identityElement.getAttribute(identityConfig.testIdAttribute) || identityElement.getAttribute(identityConfig.legacyTestIdAttribute) || MOTION_TEXT_EMPTY;
            const identity = messageId || (testId ? testId + SOURCE_TEXT_SYMBOL_16 + index : identityElement.id);
            const codeText = browserPayload.preferCodeBlocks
              ? Array.from(element.querySelectorAll(browserPayload.codeSelector))
                  .map((block) => block.textContent || MOTION_TEXT_EMPTY)
                  .join(ST.SOURCE_TEXT_SYMBOL_56)
              : MOTION_TEXT_EMPTY;
            const visibleText = codeText.trim() || (element instanceof HTMLElement ? element.innerText : element.textContent || MOTION_TEXT_EMPTY);
            return { identity, text: visibleText.trim() };
          });
      },
      {
        preferCodeBlocks: responseSelector === CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RESPONSE_SELECTOR || responseSelector === D.RESPONSE,
        codeSelector: responseSelector === D.RESPONSE ? D.CODE : C.CODE_BLOCK_SELECTOR,
        payload: {
          selector: responseSelector === D.RESPONSE ? XRT.RESPONSE_ROW_SELECTOR : CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_IDENTITY_SELECTOR,
          messageIdAttribute: responseSelector === D.RESPONSE ? XRT.RESPONSE_ROW_ATTRIBUTE : CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MESSAGE_ID_ATTRIBUTE,
          testIdAttribute: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TEST_ID_ATTRIBUTE,
          legacyTestIdAttribute: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_LEGACY_TEST_ID_ATTRIBUTE,
        },
        texts: { SOURCE_TEXT_HIDDEN, SOURCE_TEXT_NONE, SOURCE_TEXT_SYMBOL_16, MOTION_TEXT_EMPTY: MR.MOTION_TEXT_EMPTY },
        sharedTexts: { C: { CODE_BLOCK_SELECTOR: C.CODE_BLOCK_SELECTOR }, ST: { SOURCE_TEXT_SYMBOL_56: ST.SOURCE_TEXT_SYMBOL_56 } },
      },
    )
    .catch(() => []);
const isPlanningResponseForScenes = (text: string, expectedSceneIds: string[]): boolean => {
  if (_.isEmpty(text)) return false;
  const parsed = parseStrictRoomJson(text);
  const scenes = _.isArray(parsed) ? parsed : _.get(parsed, SOURCE_TEXT_SCENES);
  if (!_.isArray(scenes)) return false;
  const returnedSceneIds = _.map(scenes, (item) => _.toString(_.get(item, SOURCE_TEXT_ID)));
  return _.isEqual(returnedSceneIds.length, expectedSceneIds.length) && _.isEqual(_.uniq(returnedSceneIds).length, returnedSceneIds.length) && _.isEmpty(_.difference(expectedSceneIds, returnedSceneIds)) && _.isEmpty(_.difference(returnedSceneIds, expectedSceneIds));
};
const throwIfGrokRateLimited = async (page: Page, busySelector: string): Promise<void> => {
  if (busySelector === D.BUSY) {
    const alerts = await page
      .locator(D.ALERT)
      .filter({ visible: true })
      .allTextContents()
      .catch(() => []);
    if (alerts.some((alert) => D.RATE_LIMIT.test(alert))) throw new Error(D.RATE_LIMIT_ERROR);
    return;
  }
  if (_.isEqual(busySelector, CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_BUSY_SELECTOR)) {
    const alerts = await page
      .locator(C.CLAUDE_USAGE_NOTICE_SELECTOR)
      .filter({ visible: true })
      .allTextContents()
      .catch(() => []);
    if (alerts.some((alert) => CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_PATTERN.test(alert))) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_ERROR);
    return;
  }
  if (!_.isEqual(busySelector, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_BUSY_SELECTOR)) return;
  const alerts = await page
    .locator(SOURCE_TEXT_ROLE_ALERT)
    .allTextContents()
    .catch(() => []);
  if (_.some(alerts, (alert) => CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RATE_LIMIT_PATTERN.test(alert))) {
    throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RATE_LIMIT_ERROR);
  }
};
const waitForStableResponse = async (page: Page, responseSelector: string, busySelector: string, initialCount: number, expectedSceneIds: string[], initialResponseSnapshots: ChatResponseSnapshot[], completionMarker?: string, artifactType?: string, requestId?: string, signal?: AbortSignal, prompt?: string): Promise<string> => {
  const startedAt = Date.now();
  const absoluteDeadline = startedAt + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_MAX_TIMEOUT_MS;
  let activityDeadline = startedAt + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MS;
  const initialResponseSet = new Set(_.map(initialResponseSnapshots, (snapshot) => _.trim(snapshot.text)));
  const initialResponseIdentitySet = new Set(_.compact(_.map(initialResponseSnapshots, SOURCE_TEXT_IDENTITY)));
  let previousText: string = MR.MOTION_TEXT_EMPTY;
  let stablePolls = 0;
  let lastResponseCount = initialCount;
  let lastCandidateLength = 0;
  let lastBusyState = false;
  let lastIdentityMatch = false;
  let lastObservedResponseCount = initialCount;
  let lastObservedCandidate: string = MR.MOTION_TEXT_EMPTY;
  let busyWaitLogged = false;
  let lastJsonCandidate: string = MR.MOTION_TEXT_EMPTY;
  const recoverDeepSeek = busySelector === D.BUSY ? createDeepSeekRetryRecovery(page, prompt, signal) : undefined;
  while (Date.now() < absoluteDeadline) {
    throwIfPlanningCancelled(signal);
    await throwIfGrokRateLimited(page, busySelector);
    if (await recoverDeepSeek?.()) {
      stablePolls = 0;
      activityDeadline = Math.min(absoluteDeadline, Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_ACTIVITY_GRACE_MS);
      await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
      continue;
    }
    const visibleAlerts = await page
      .locator(SOURCE_TEXT_ROLE_ALERT)
      .filter({ visible: true })
      .allTextContents()
      .catch(() => []);
    const providerErrorAlert = _.find(visibleAlerts, (alert) => CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_PATTERN.test(alert));
    if (providerErrorAlert) {
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PROVIDER_ALERT, { runId: requestId ? createHash(SOURCE_TEXT_SHA256).update(requestId).digest(SOURCE_TEXT_HEX).slice(0, 12) : undefined, stage: artifactType, errorMessage: providerErrorAlert });
      throw _.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR), { diagnostics: { source: MOTION_TEXT_ALERT, elapsedMs: Date.now() - startedAt, lastCandidate: _.toString(providerErrorAlert) } });
    }
    const responseSnapshots = await getChatResponseSnapshots(page, responseSelector);
    const count = responseSnapshots.length;
    const responseTexts = _.map(responseSnapshots, SOURCE_TEXT_TEXT);
    const lastResponse = _.trim(_.last(responseTexts) || MR.MOTION_TEXT_EMPTY);
    const changedLastResponse = !_.isEmpty(lastResponse) && !initialResponseSet.has(lastResponse) ? lastResponse : MR.MOTION_TEXT_EMPTY;
    const newResponseTexts = count > initialCount ? _.slice(responseTexts, initialCount) : [];
    const responsesNotPresentBeforeSubmission = _.filter(responseTexts, (value) => !_.isEmpty(value) && !initialResponseSet.has(value));
    const responsesWithNewIdentity = _.map(
      _.filter(responseSnapshots, (snapshot) => !_.isEmpty(snapshot.identity) && !initialResponseIdentitySet.has(snapshot.identity)),
      SOURCE_TEXT_TEXT,
    );
    const responseCandidates = _.uniq(_.compact([...responsesWithNewIdentity, ...newResponseTexts, ...responsesNotPresentBeforeSubmission, changedLastResponse]));
    const normalizedExpectedRequestId = normalizeCinematicArtifactIdentity(requestId);
    const matchingJsonResponse = _.findLast(responseCandidates, (candidate) => {
      const parsedCandidate = parseStrictRoomJson(candidate);
      if (_.isUndefined(parsedCandidate)) return false;
      const returnedArtifactType = _.trim(_.toString(_.get(parsedCandidate, SOURCE_TEXT_ARTIFACTTYPE)));
      const returnedRequestId = normalizeCinematicArtifactIdentity(_.get(parsedCandidate, SOURCE_TEXT_REQUESTID));
      return (_.isEmpty(artifactType) || _.isEqual(returnedArtifactType, artifactType)) && (_.isEmpty(normalizedExpectedRequestId) || _.isEqual(returnedRequestId, normalizedExpectedRequestId));
    });
    const parseableJsonResponse = _.maxBy(
      _.filter(responseCandidates, (candidate) => !_.isUndefined(parseStrictRoomJson(candidate))),
      (candidate) => candidate.length,
    );
    if (parseableJsonResponse) lastJsonCandidate = parseableJsonResponse;
    const selectedResponse = matchingJsonResponse || parseableJsonResponse || _.maxBy(responseCandidates, (candidate) => candidate.length) || MR.MOTION_TEXT_EMPTY;
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
    const returnedCompletionMarker = _.trim(_.toString(_.get(parsedLatest, SOURCE_TEXT_COMPLETIONMARKER)));
    const returnedArtifactType = _.trim(_.toString(_.get(parsedLatest, SOURCE_TEXT_ARTIFACTTYPE)));
    const returnedRequestId = normalizeCinematicArtifactIdentity(_.get(parsedLatest, SOURCE_TEXT_REQUESTID));
    const hasRequiredCompletionMarker = _.isEmpty(completionMarker) || _.isEqual(returnedCompletionMarker, completionMarker);
    const hasRequiredArtifactIdentity = (_.isEmpty(artifactType) || _.isEqual(returnedArtifactType, artifactType)) && (_.isEmpty(normalizedExpectedRequestId) || _.isEqual(returnedRequestId, normalizedExpectedRequestId));
    const belongsToCurrentRequest = (_.isEmpty(expectedSceneIds) || isPlanningResponseForScenes(latestText, expectedSceneIds)) && hasRequiredCompletionMarker && hasRequiredArtifactIdentity;
    lastResponseCount = count;
    lastCandidateLength = latestText.length;
    lastBusyState = isBusy;
    lastIdentityMatch = belongsToCurrentRequest;
    const isCompleteJson = !_.isUndefined(parsedLatest);
    if (_.gte(latestText.length, CINEMATIC_CHAT_PLANNING_CONFIG.MIN_RESPONSE_CHARACTERS) && !isBusy) {
      stablePolls = _.isEqual(latestText, previousText) ? _.add(stablePolls, 1) : 0;
      previousText = latestText;
      if (_.gte(stablePolls, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_STABLE_POLLS)) {
        const mayUseUnmarkedJsonFallback = _.isEmpty(expectedSceneIds) && _.isEmpty(completionMarker) && _.isEmpty(artifactType) && _.isEmpty(normalizedExpectedRequestId) && isCompleteJson;
        if (isCompleteJson && (belongsToCurrentRequest || mayUseUnmarkedJsonFallback)) {
          if (!belongsToCurrentRequest) {
            appWarn(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RAW_CONTRACT_FALLBACK(_.join(expectedSceneIds, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEXT_NOT_REQUIRED, completionMarker || SOURCE_TEXT_NOT_REQUIRED));
          }
          appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RESPONSE_COMPLETE(latestText.length));
          await writeMusicDiagnostic(SOURCE_TEXT_CHAT_RESPONSE_UI_CONFIRMED, { runId: requestId ? createHash(SOURCE_TEXT_SHA256).update(requestId).digest(SOURCE_TEXT_HEX).slice(0, 12) : undefined, stage: artifactType, responseChars: latestText.length, stablePolls, elapsedMs: Date.now() - startedAt, identityMatch: belongsToCurrentRequest });
          return jsonUtils.safeStringify(parsedLatest);
        }
        if (!isCompleteJson && !_.isEmpty(responseCandidates) && stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_STABLE_POLLS) {
          appWarn(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_PREVIEW_LOG(_.truncate(latestText, { length: 800 })));
          if (CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_PATTERN.test(latestText)) {
            await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PROVIDER_RESPONSE_ERROR, { stage: artifactType, errorMessage: latestText });
            throw _.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR), { diagnostics: { source: MOTION_TEXT_RESPONSE, responseCount: count, initialCount, candidateChars: latestText.length, elapsedMs: Date.now() - startedAt, lastCandidate: latestText } });
          }
          throw _.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR), { diagnostics: { responseCount: count, initialCount, candidateChars: latestText.length, busy: isBusy, identityMatch: false, elapsedMs: Date.now() - startedAt, lastCandidate: latestText } });
        }
        if (isCompleteJson && !_.isEmpty(responseCandidates) && stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_STABLE_POLLS) {
          throw _.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR), { diagnostics: { responseCount: count, initialCount, candidateChars: latestText.length, busy: isBusy, identityMatch: false, elapsedMs: Date.now() - startedAt, lastCandidate: latestText } });
        }
      }
    } else {
      stablePolls = 0;
      previousText = latestText;
    }
    if (!isBusy && Date.now() >= activityDeadline) break;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  appWarn(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_RESPONSE_TIMEOUT_LOG(lastResponseCount, initialCount, lastCandidateLength, lastBusyState, lastIdentityMatch, completionMarker || SOURCE_TEXT_NOT_REQUIRED));
  await writeMusicDiagnostic(SOURCE_TEXT_CHAT_RESPONSE_TIMEOUT, { runId: requestId ? createHash(SOURCE_TEXT_SHA256).update(requestId).digest(SOURCE_TEXT_HEX).slice(0, 12) : undefined, stage: artifactType, responseCount: lastResponseCount, candidateChars: lastCandidateLength, busy: lastBusyState, identityMatch: lastIdentityMatch, elapsedMs: Date.now() - startedAt });
  const timeoutError = new Error(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MESSAGE);
  Object.defineProperty(timeoutError, MOTION_TEXT_ROOMPAGE, { value: page, enumerable: false });
  _.assign(timeoutError, {
    code: CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE,
    diagnostics: { responseCount: lastResponseCount, initialCount, candidateChars: lastCandidateLength, busy: lastBusyState, identityMatch: lastIdentityMatch, elapsedMs: Date.now() - startedAt, lastCandidate: lastJsonCandidate || lastObservedCandidate },
  });
  throw timeoutError;
};
const isPendingResponseForRequest = (pendingResponse: PendingRoomResponse, page: Page, expectedSceneIds: string[], completionMarker?: string, artifactType?: string, requestId?: string): boolean =>
  _.isEqual(pendingResponse.page, page) &&
  !page.isClosed() &&
  _.isEqual(pendingResponse.expectedSceneIds, expectedSceneIds) &&
  _.isEqual(pendingResponse.completionMarker || MR.MOTION_TEXT_EMPTY, completionMarker || MR.MOTION_TEXT_EMPTY) &&
  _.isEqual(pendingResponse.artifactType || MR.MOTION_TEXT_EMPTY, artifactType || MR.MOTION_TEXT_EMPTY) &&
  _.isEqual(normalizeCinematicArtifactIdentity(pendingResponse.requestId), normalizeCinematicArtifactIdentity(requestId));
const isResponseTimeoutError = (error: unknown): boolean => _.isEqual(_.toString(_.get(error, SOURCE_TEXT_CODE)), CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE);
const setLocalFilePathsViaCdp = async (page: Page, filePaths: string[]): Promise<boolean> => {
  if (_.isEmpty(filePaths)) return false;
  const session = await page
    .context()
    .newCDPSession(page)
    .catch(() => null);
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
const clearQueuedRoomAttachments = async (page: Page, scopedComposer?: Locator, removeSelector: string = CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_REMOVE_ATTACHMENT_SELECTOR): Promise<void> => {
  const removableAttachments = scopedComposer ? scopedComposer.locator(removeSelector) : page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_REMOVABLE_BUTTON_SELECTOR);
  for (let index = (await removableAttachments.count().catch(() => 0)) - 1; index >= 0; index--) {
    await removableAttachments
      .nth(index)
      .click()
      .catch(() => undefined);
  }
  if (scopedComposer && (await removableAttachments.filter({ visible: true }).count())) throw new Error(removeSelector === D.REMOVE ? D.UPLOAD_NOT_READY : CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_UPLOAD_NOT_READY_ERROR);
};
const attachRoomFiles = async (page: Page, attachments: ChatRoomAttachment[], artifactType?: string, scopedComposer?: Locator, removeSelector?: string): Promise<void> => {
  const allowLocalFileFallback = Boolean(scopedComposer) || artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING;
  const localFilePaths = _.compact(_.map(attachments, SOURCE_TEXT_PATH));
  const usesOnlyLocalPaths = _.size(localFilePaths) === _.size(attachments);
  const inputFiles = usesOnlyLocalPaths
    ? localFilePaths
    : await Promise.all(
        _.map(attachments, async (attachment) => ({
          name: attachment.path ? basename(attachment.path) : attachment.name,
          mimeType: attachment.mimeType,
          buffer: attachment.path ? await readFile(attachment.path) : (attachment.buffer as Buffer),
        })),
      );
  await clearQueuedRoomAttachments(page, scopedComposer, removeSelector);
  let uploaded = false;
  let lastUploadError: unknown;
  const fileInputs = (scopedComposer || page).locator(SOURCE_TEXT_INPUT_TYPE_FILE);
  if (usesOnlyLocalPaths && !scopedComposer) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
  if (!uploaded && (!usesOnlyLocalPaths || allowLocalFileFallback))
    for (let index = 0; index < (await fileInputs.count().catch(() => 0)); index++) {
      try {
        await fileInputs.nth(index).setInputFiles(inputFiles as any);
        uploaded = true;
        break;
      } catch (error) {
        lastUploadError = error;
      }
    }
  if (!uploaded) {
    const attachmentScope = scopedComposer || page;
    const attachmentButton = attachmentScope.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_BUTTON_NAME_PATTERN }).or(attachmentScope.locator(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_BUTTON_SELECTOR)).filter({ visible: true }).last();
    let chooser = await Promise.all([
      page.waitForEvent(SOURCE_TEXT_FILECHOOSER, { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => null),
      attachmentButton.click().catch((error) => {
        lastUploadError = error;
      }),
    ]).then(([fileChooser]) => fileChooser);
    if (!chooser) {
      const revealedFileInputs = page.locator(SOURCE_TEXT_INPUT_TYPE_FILE);
      if (usesOnlyLocalPaths && !scopedComposer) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
      if (!uploaded && (!usesOnlyLocalPaths || allowLocalFileFallback))
        for (let index = 0; index < (await revealedFileInputs.count().catch(() => 0)); index++) {
          try {
            await revealedFileInputs.nth(index).setInputFiles(inputFiles as any);
            uploaded = true;
            break;
          } catch (error) {
            lastUploadError = error;
          }
        }
    }
    if (!chooser && !uploaded) {
      const uploadMenuItem = page
        .getByRole(SOURCE_TEXT_MENUITEM, { name: CINEMATIC_CHAT_PLANNING_CONFIG.UPLOAD_FILE_MENU_NAME_PATTERN })
        .or(page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_MENU_ITEM_NAME_PATTERN }))
        .filter({ visible: true })
        .last();
      if (await uploadMenuItem.count().catch(() => 0))
        chooser = await Promise.all([
          page.waitForEvent(SOURCE_TEXT_FILECHOOSER, { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_DELETE_ACTION_TIMEOUT_MS }).catch(() => null),
          uploadMenuItem.click().catch((error) => {
            lastUploadError = error;
          }),
        ]).then(([fileChooser]) => fileChooser);
    }
    if (chooser && !uploaded) {
      if (usesOnlyLocalPaths && !scopedComposer) uploaded = await setLocalFilePathsViaCdp(page, localFilePaths);
      if (!uploaded && (!usesOnlyLocalPaths || allowLocalFileFallback))
        try {
          await chooser.setFiles(inputFiles);
          uploaded = true;
        } catch (error) {
          lastUploadError = error;
        }
    }
  }
  if (!uploaded) throw new Error(MOTION_TEMPLATE_SYMBOL_12(SOURCE_TEMPLATE_SYMBOL_86(String(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_FALLBACK_ERROR_PREFIX)), SOURCE_TEMPLATE_SYMBOL_86(String(_.toString(_.get(lastUploadError, SOURCE_TEXT_MESSAGE, MR.MOTION_TEXT_EMPTY))))).trim());
  if (scopedComposer) await page.keyboard.press(SOURCE_TEXT_ESCAPE);
};
const getComposerReadings = async (input: Locator): Promise<string[]> => {
  const value = await input.inputValue().catch(() => MR.MOTION_TEXT_EMPTY);
  const visibleText = await input.innerText().catch(() => MR.MOTION_TEXT_EMPTY);
  const domText = await input.textContent().catch(() => MR.MOTION_TEXT_EMPTY);
  return [value, visibleText, domText];
};
const getComposerText = async (input: Locator): Promise<string> => _.trim(_.maxBy(await getComposerReadings(input), (text) => text.length) || MR.MOTION_TEXT_EMPTY);
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
const waitForSubmissionConfirmation = async (input: Locator, page: Page, responseSelector: string, initialResponseSnapshots: ChatResponseSnapshot[], timeoutMs: number, signal?: AbortSignal): Promise<boolean> => {
  const startedAt = Date.now();
  const initialResponseTexts = new Set(_.map(initialResponseSnapshots, (snapshot) => _.trim(snapshot.text)));
  const initialResponseIds = new Set(_.compact(_.map(initialResponseSnapshots, SOURCE_TEXT_IDENTITY)));
  while (Date.now() - startedAt < timeoutMs) {
    throwIfPlanningCancelled(signal);
    const responseSnapshots = await getChatResponseSnapshots(page, responseSelector).catch(() => []);
    if (responseSnapshots.length > initialResponseSnapshots.length || _.some(responseSnapshots, (snapshot) => (!_.isEmpty(snapshot.identity) && !initialResponseIds.has(snapshot.identity)) || (!_.isEmpty(_.trim(snapshot.text)) && !initialResponseTexts.has(_.trim(snapshot.text))))) return true;
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
const submitPrompt = async (page: Page, roomKey: string, prompt: string, inputSelector: string, sendSelector: string, responseSelector: string, busySelector: string, expectedSceneIds: string[], attachments: ChatRoomAttachment[] = [], completionMarker?: string, artifactType?: string, requestId?: string, signal?: AbortSignal): Promise<string> => {
  const isClaude = inputSelector === CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_INPUT_SELECTOR;
  const isDeepSeek = inputSelector === D.INPUT;
  const uploadObservation = attachments.length ? (isClaude ? observeClaudeUploads(page) : isDeepSeek ? observeDeepSeekUploads(page) : undefined) : undefined;
  try {
    throwIfPlanningCancelled(signal);
    const diagnosticRunId = requestId ? createHash(SOURCE_TEXT_SHA256).update(requestId).digest(SOURCE_TEXT_HEX).slice(0, 12) : undefined;
    const pendingResponse = pendingRoomResponses.get(roomKey);
    if (pendingResponse && isPendingResponseForRequest(pendingResponse, page, expectedSceneIds, completionMarker, artifactType, requestId)) {
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PENDING_RESPONSE_RESUMED, { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
      appLog(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_RESUME_LOG);
      try {
        const resumedResponse = await waitForStableResponse(page, responseSelector, busySelector, pendingResponse.initialCount, expectedSceneIds, pendingResponse.initialResponseSnapshots, completionMarker, artifactType, requestId, signal, pendingResponse.prompt);
        pendingRoomResponses.delete(roomKey);
        return resumedResponse;
      } catch (error) {
        if (!isResponseTimeoutError(error)) pendingRoomResponses.delete(roomKey);
        throw error;
      }
    }
    if (pendingResponse && !page.isClosed()) {
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PREVIOUS_REQUEST_WAIT_STARTED, { runId: diagnosticRunId, stage: artifactType });
      try {
        await waitForStableResponse(page, responseSelector, busySelector, pendingResponse.initialCount, pendingResponse.expectedSceneIds, pendingResponse.initialResponseSnapshots, pendingResponse.completionMarker, pendingResponse.artifactType, pendingResponse.requestId, signal, pendingResponse.prompt);
        pendingRoomResponses.delete(roomKey);
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PREVIOUS_REQUEST_COMPLETED, { runId: diagnosticRunId, stage: artifactType });
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
      await input.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
    } catch (error) {
      const title = await page.title().catch(() => MR.MOTION_TEXT_EMPTY);
      const selectorMatches = await page
        .locator(inputSelector)
        .count()
        .catch(() => 0);
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_INPUT_FAILED, { runId: diagnosticRunId, stage: artifactType, status: String(selectorMatches), ...musicErrorDetails(error) });
      throw new Error(CHAT_UI_AUTOMATION_MESSAGES.INPUT_NOT_FOUND_DETAIL(page.url(), title, selectorMatches, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
    }
    appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_INPUT_READY(Date.now() - uiReadyStartedAt));
    let initialResponseSnapshots: ChatResponseSnapshot[] = [];
    let initialCount = 0;
    const normalizedPrompt = normalizeRoomPrompt(prompt);
    const responseDirective = isDeepSeek ? D.DIRECTIVE : isClaude ? CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_INLINE_RESPONSE_DIRECTIVE : CINEMATIC_CHAT_PLANNING_CONFIG.JSON_ONLY_DIRECTIVE;
    const submittedPrompt = MOTION_TEMPLATE_SYMBOL_26(SOURCE_TEMPLATE_SYMBOL_86(String(normalizedPrompt)), SOURCE_TEMPLATE_SYMBOL_86(String(responseDirective)));
    let submissionConfirmed = false;
    const markPendingSubmission = (): void => {
      pendingRoomResponses.set(roomKey, {
        page,
        prompt: submittedPrompt,
        initialCount,
        initialResponseSnapshots,
        expectedSceneIds: _.clone(expectedSceneIds),
        completionMarker,
        artifactType,
        requestId,
      });
    };
    {
      await throwIfGrokRateLimited(page, busySelector);
      try {
        await waitForRoomIdle(page, busySelector, responseSelector, signal);
      } catch (error) {
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ROOM_IDLE_FAILED, { runId: diagnosticRunId, stage: artifactType, ...musicErrorDetails(error) });
        throw error;
      }
      initialResponseSnapshots = await getChatResponseSnapshots(page, responseSelector);
      initialCount = initialResponseSnapshots.length;
      const scopedComposer = isClaude ? await getClaudeComposerScope(input) : isDeepSeek ? await getDeepSeekComposerScope(input) : undefined;
      const removeSelector = isDeepSeek ? D.REMOVE : undefined;
      if (!_.isEmpty(attachments)) {
        throwIfPlanningCancelled(signal);
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ATTACHMENT_STARTED, { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
        try {
          await attachRoomFiles(page, attachments, artifactType, scopedComposer, removeSelector);
          if (isDeepSeek) {
            await waitForDeepSeekUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation);
          } else if (isClaude) {
            await waitForClaudeUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation);
          } else if (artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING) {
            await waitForMusicMixerUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal);
          } else await delayAsync(Math.min(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SETTLE_MAX_MS, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SETTLE_PER_FILE_MS * attachments.length));
          await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ATTACHMENT_COMPLETED, { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
        } catch (error) {
          await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ATTACHMENT_FAILED, { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length, ...musicErrorDetails(error) });
          throw error;
        }
      } else if (scopedComposer) {
        await clearQueuedRoomAttachments(page, scopedComposer, removeSelector);
        if (isDeepSeek) await waitForDeepSeekUploads(input, [], CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation);
        else await waitForClaudeUploads(input, [], CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation);
      }
      await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_INPUT_SETTLE_MS);
      await input.fill(submittedPrompt);
      await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.HUMAN_ACTION_SETTLE_MS);
      await page.waitForTimeout(CINEMATIC_CHAT_PLANNING_CONFIG.PROMPT_SUBMIT_SETTLE_MS);
      const composerAssessment = assessChatComposerContent(submittedPrompt, responseDirective, requestId, await getComposerReadings(input));
      if (!composerAssessment.valid) {
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_COMPOSER_MISMATCH, { runId: diagnosticRunId, stage: artifactType, expectedChars: submittedPrompt.length, actualChars: composerAssessment.actualChars, status: composerAssessment.reason });
        throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.COMPOSER_CONTENT_MISMATCH_ERROR);
      }
      {
        const configuredSendButton = page.locator(sendSelector).filter({ visible: true }).last();
        const semanticSendButton = page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.SEMANTIC_SEND_BUTTON_NAME_PATTERN }).filter({ visible: true }).last();
        const sendButton = await waitForSendButtonReady([configuredSendButton, semanticSendButton], _.isEmpty(attachments) ? CINEMATIC_CHAT_PLANNING_CONFIG.SEND_BUTTON_READY_TIMEOUT_MS : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal);
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_SEND_BUTTON_CHECKED, { runId: diagnosticRunId, stage: artifactType, status: sendButton ? SOURCE_TEXT_READY : SOURCE_TEXT_UNAVAILABLE, attachmentCount: attachments.length });
        if (sendButton) {
          await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.HUMAN_ACTION_SETTLE_MS);
          if (isClaude || isDeepSeek || (!_.isEmpty(attachments) && artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING)) {
            if (isDeepSeek) await waitForDeepSeekUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation, true);
            else if (isClaude) await waitForClaudeUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal, uploadObservation, CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_UPLOAD_STABLE_MS, true);
            else await waitForMusicMixerUploads(input, attachments, CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_READY_TIMEOUT_MS, signal);
            if (!(await sendButton.isEnabled())) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SUBMIT_BLOCKED_ERROR);
          }
          markPendingSubmission();
          await sendButton.click();
        } else throw new Error(_.isEmpty(attachments) ? CINEMATIC_CHAT_PLANNING_CONFIG.SEND_BUTTON_NOT_READY_ERROR : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SUBMIT_BLOCKED_ERROR);
        submissionConfirmed = await waitForSubmissionConfirmation(input, page, responseSelector, initialResponseSnapshots, _.isEmpty(attachments) ? CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_VERIFY_TIMEOUT_MS : CINEMATIC_CHAT_PLANNING_CONFIG.ATTACHMENT_SUBMISSION_VERIFY_TIMEOUT_MS, signal);
        if (!submissionConfirmed && !isClaude && !isDeepSeek && (await getComposerText(input)).length > CINEMATIC_CHAT_PLANNING_CONFIG.COMPOSER_EMPTY_MAX_CHARACTERS) {
          appLog(CHAT_UI_AUTOMATION_MESSAGES.SUBMIT_ENTER_FALLBACK);
          await input.focus().catch(() => undefined);
          await input.press(ST.SOURCE_TEXT_ENTER).catch(() => undefined);
          submissionConfirmed = await waitForSubmissionConfirmation(input, page, responseSelector, initialResponseSnapshots, CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_VERIFY_TIMEOUT_MS, signal);
        }
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_SUBMISSION_CHECKED, { runId: diagnosticRunId, stage: artifactType, status: submissionConfirmed ? SOURCE_TEXT_CONFIRMED : SOURCE_TEXT_UNCONFIRMED, attachmentCount: attachments.length });
      }
    }
    if (!submissionConfirmed) {
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_SUBMISSION_UNCERTAIN_WAITING_RESPONSE, { runId: diagnosticRunId, stage: artifactType, attachmentCount: attachments.length });
    } else {
      appLog(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_CONFIRMED_LOG.replace(SOURCE_TEXT_0_2, _.toString(normalizedPrompt.length)));
    }
    try {
      const response = await waitForStableResponse(page, responseSelector, busySelector, initialCount, expectedSceneIds, initialResponseSnapshots, completionMarker, artifactType, requestId, signal, submittedPrompt);
      pendingRoomResponses.delete(roomKey);
      return response;
    } catch (error) {
      if (!isResponseTimeoutError(error)) pendingRoomResponses.delete(roomKey);
      throw error;
    }
  } finally {
    uploadObservation?.dispose();
  }
};
const getChatModelOption = (page: Page, modelLabel: RegExp) =>
  page
    .getByRole(SOURCE_TEXT_MENUITEM, { name: modelLabel })
    .or(page.getByRole(SOURCE_TEXT_MENUITEMRADIO, { name: modelLabel }))
    .or(page.getByRole(SOURCE_TEXT_OPTION, { name: modelLabel }))
    .or(page.locator(SOURCE_TEXT_ROLE_LISTBOX_ROLE_OPTION_ROLE_MENU).filter({ hasText: modelLabel }))
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
      if (_.isEqual(await candidate.getAttribute(SOURCE_TEXT_ARIA_DISABLED).catch(() => null), SOURCE_TEXT_TRUE)) continue;
      await candidate.click();
      return true;
    }
    await page.waitForTimeout(100);
  }
  return false;
};
const waitForRoomIdle = async (page: Page, busySelector: string, responseSelector: string, signal?: AbortSignal): Promise<void> => {
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_IDLE_WAIT_TIMEOUT_MS;
  let previousResponse: string = MR.MOTION_TEXT_EMPTY;
  let stablePolls = 0;
  while (Date.now() < deadline) {
    throwIfPlanningCancelled(signal);
    await throwIfGrokRateLimited(page, busySelector);
    const busy = await page
      .locator(busySelector)
      .filter({ visible: true })
      .count()
      .then((count) => count > 0);
    const snapshots = await getChatResponseSnapshots(page, responseSelector);
    const latestResponse = _.trim(_.last(snapshots)?.text || MR.MOTION_TEXT_EMPTY);
    stablePolls = !busy && _.isEqual(latestResponse, previousResponse) ? stablePolls + 1 : 0;
    previousResponse = latestResponse;
    if (stablePolls >= CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_IDLE_STABLE_POLLS) return;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_POLL_MS);
  }
  throw new Error(SOURCE_TEXT_CHAT_ROOM_PREVIOUS_RESPONSE_STILL_RUNNING);
};
const waitForSelectedModelLabel = async (page: Page, buttonSelector: string, modelLabel: RegExp): Promise<boolean> => {
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const button = page.locator(buttonSelector).filter({ visible: true }).last();
    if (modelLabel.test(_.trim(await button.innerText().catch(() => MR.MOTION_TEXT_EMPTY)))) return true;
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
  const currentModelLabel = _.trim(await button.innerText().catch(() => MR.MOTION_TEXT_EMPTY));
  if (modelLabel.test(currentModelLabel)) return;
  await button.click();
  if ((await clickChatModelOption(page, modelLabel)) && (await waitForSelectedModelLabel(page, buttonSelector, modelLabel))) return;
  await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
  appWarn(CHAT_UI_AUTOMATION_MESSAGES.SELECTED_MODEL_UNAVAILABLE);
  throw new Error(CHAT_UI_AUTOMATION_MESSAGES.SELECTED_MODEL_UNAVAILABLE);
};
const selectGeminiChatModel = async (page: Page, model: AiPlanningChatModel | undefined, allowDefaultModel = false): Promise<void> => {
  if (!model) return;
  const requestedModelLabel = CINEMATIC_CHAT_MODEL_LABELS[model];
  const baseModelLabel = GEMINI_CHAT_BASE_MODEL_LABELS[model];
  if (!baseModelLabel) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
  let modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS).catch(() => undefined);
  if (!modelButton) {
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_PICKER_NOT_FOUND);
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTION_FAILED, { provider: AiPlanningFallbackProvider.GeminiChat, model, stage: SOURCE_TEXT_MODEL_PICKER, code: SOURCE_TEXT_PICKER_NOT_FOUND });
    if (allowDefaultModel) return;
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_PICKER_NOT_FOUND);
  }
  const currentModelLabel = _.trim(await modelButton.innerText().catch(() => MR.MOTION_TEXT_EMPTY));
  if (requestedModelLabel.test(currentModelLabel)) {
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTED, { provider: AiPlanningFallbackProvider.GeminiChat, model, status: SOURCE_TEXT_ALREADY_SELECTED });
    return;
  }
  await modelButton.click();
  if ((await clickChatModelOption(page, requestedModelLabel)) && (await waitForSelectedModelLabel(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, requestedModelLabel))) {
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTED, { provider: AiPlanningFallbackProvider.GeminiChat, model, status: SOURCE_TEXT_SELECTED });
    return;
  }
  const thinkingLevelLabel = GEMINI_CHAT_THINKING_LEVEL_LABELS[model];
  if (!thinkingLevelLabel) {
    await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
    appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTION_FAILED, { provider: AiPlanningFallbackProvider.GeminiChat, model, code: SOURCE_TEXT_MODEL_UNAVAILABLE });
    if (allowDefaultModel) return;
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_MODEL_UNAVAILABLE);
  }
  await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
  modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS);
  const fallbackCurrentModelLabel = _.trim(await modelButton.innerText().catch(() => MR.MOTION_TEXT_EMPTY));
  if (!baseModelLabel.test(fallbackCurrentModelLabel)) {
    await modelButton.click();
    if (!(await clickChatModelOption(page, baseModelLabel))) {
      await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_BASE_MODEL_UNAVAILABLE);
      await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTION_FAILED, { provider: AiPlanningFallbackProvider.GeminiChat, model, code: SOURCE_TEXT_BASE_MODEL_UNAVAILABLE });
      if (allowDefaultModel) return;
      throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_BASE_MODEL_UNAVAILABLE);
    }
  }
  modelButton = await getLastVisibleLocator(page, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_MODEL_BUTTON_SELECTOR, CINEMATIC_CHAT_PLANNING_CONFIG.MODEL_PICKER_TIMEOUT_MS);
  await modelButton.click();
  const thinkingLevelTrigger = page
    .getByRole(SOURCE_TEXT_MENUITEM, { name: CINEMATIC_CHAT_PLANNING_CONFIG.THINKING_LEVEL_NAME_PATTERN })
    .or(page.getByRole(SOURCE_TEXT_BUTTON, { name: CINEMATIC_CHAT_PLANNING_CONFIG.THINKING_LEVEL_NAME_PATTERN }))
    .filter({ visible: true })
    .first();
  if (await thinkingLevelTrigger.isVisible().catch(() => false)) await thinkingLevelTrigger.click();
  if (await clickChatModelOption(page, thinkingLevelLabel)) {
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTED, { provider: AiPlanningFallbackProvider.GeminiChat, model, status: SOURCE_TEXT_SELECTED_WITH_THINKING_LEVEL });
    return;
  }
  await page.keyboard.press(SOURCE_TEXT_ESCAPE).catch(() => undefined);
  appWarn(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_THINKING_UNAVAILABLE);
  await writeMusicDiagnostic(SOURCE_TEXT_CHAT_MODEL_SELECTION_FAILED, { provider: AiPlanningFallbackProvider.GeminiChat, model, code: SOURCE_TEXT_THINKING_LEVEL_UNAVAILABLE });
  if (allowDefaultModel) return;
  throw new Error(CHAT_UI_AUTOMATION_MESSAGES.GEMINI_THINKING_UNAVAILABLE);
};
const isGrokSecurityChallengeActive = async (page: Page, chatReady: boolean): Promise<boolean> => {
  const title = await page.title().catch(() => MR.MOTION_TEXT_EMPTY);
  const bodyText = await page
    .locator(SOURCE_TEXT_BODY)
    .innerText()
    .catch(() => MR.MOTION_TEXT_EMPTY);
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
  if (!(currentUrl.hostname === SOURCE_TEXT_GROK_COM || currentUrl.hostname.endsWith(SOURCE_TEXT_GROK_COM_2))) return false;
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
  let previousReadyUrl: string = MR.MOTION_TEXT_EMPTY;
  while (Date.now() - startedAt < CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_WAIT_TIMEOUT_MS) {
    throwIfPlanningCancelled(request.signal);
    if (page.isClosed()) throw new Error(SOURCE_TEXT_GROK_CHAT_PAGE_CLOSED_DURING_BOOTSTRAP);
    if (!challengeWasVisible && Date.now() - startedAt > CINEMATIC_CHAT_PLANNING_CONFIG.GROK_NOT_READY_TIMEOUT_MS && !(await isGrokChatReady(page))) break;
    const chatReady = await isGrokChatReady(page);
    const challengeActive = await isGrokSecurityChallengeActive(page, chatReady);
    if (challengeActive) {
      grokReadyContexts.delete(context);
      stableReadyPolls = 0;
      previousReadyUrl = MR.MOTION_TEXT_EMPTY;
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
    previousReadyUrl = chatReady ? currentUrl : MR.MOTION_TEXT_EMPTY;
    const requiredStablePolls = challengeWasVisible ? CINEMATIC_CHAT_PLANNING_CONFIG.GROK_POST_CHALLENGE_READY_STABLE_POLLS : CINEMATIC_CHAT_PLANNING_CONFIG.GROK_READY_STABLE_POLLS;
    if (stableReadyPolls >= requiredStablePolls) {
      grokReadyContexts.add(context);
      appLog(challengeWasVisible ? CHAT_UI_AUTOMATION_MESSAGES.CLOUDFLARE_VERIFIED : contextWasReady ? CHAT_UI_AUTOMATION_MESSAGES.CLOUDFLARE_ROOM_READY : CHAT_UI_AUTOMATION_MESSAGES.CHAT_UI_READY);
      return;
    }
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_CHALLENGE_POLL_MS);
  }
  if (challengeWasVisible) throw new Error(SOURCE_TEXT_GROK_SECURITY_VERIFICATION_TIMEOUT);
  const pageTitle = await page.title().catch(() => MR.MOTION_TEXT_EMPTY);
  throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.GROK_NOT_READY_DETAIL(SOURCE_TEXT_GROK_CHAT_NOT_READY_OR_LOGIN, page.url(), pageTitle));
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
    await page.waitForLoadState(SOURCE_TEXT_DOMCONTENTLOADED).catch(() => {});
  }
  const googleLoginControl = page.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_GOOGLE_LOGIN_SELECTOR).first();
  if (await googleLoginControl.isVisible().catch(() => false)) {
    const popupPromise = page
      .context()
      .waitForEvent(SOURCE_TEXT_PAGE, { timeout: 5000 })
      .catch(() => undefined);
    await googleLoginControl.evaluate((element: HTMLElement) => element.click());
    const authPage = (await popupPromise) || page;
    await authPage.waitForLoadState(SOURCE_TEXT_DOMCONTENTLOADED).catch(() => {});
    const accountControl = authPage.getByText(accountEmail, { exact: false }).first();
    if (await accountControl.isVisible().catch(() => false)) await accountControl.click();
    if (authPage !== page) await authPage.waitForEvent(SOURCE_TEXT_CLOSE_2, { timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS }).catch(() => {});
  }
  try {
    await input.waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS });
  } catch (error) {
    throw new Error(CHAT_UI_AUTOMATION_MESSAGES.CHATGPT_LOGIN_INCOMPLETE(page.url(), await page.title().catch(() => MR.MOTION_TEXT_EMPTY), _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
  }
};
const generateWithGeminiChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, getPlanningRoomKey(request), request.signal);
  await getLastVisibleLocator(room, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR, request.artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING ? 120000 : CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS);
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
  scheduleChatBrowserCleanup();
  return response;
};
const ensureDeepSeekReady = async (room: Page, request: ChatPlanningRequest): Promise<void> => {
  const input = room.locator(D.INPUT).filter({ visible: true }).last();
  const ready = await input
    .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  throwIfPlanningCancelled(request.signal);
  if (ready) return;
  if (request.chromeHeadless !== false) throw new Error(D.LOGIN_ERROR);
  appWarn(D.LOGIN_WAIT_LOG);
  const deadline = Date.now() + D.LOGIN_TIMEOUT_MS;
  while (Date.now() < deadline && !room.isClosed()) {
    throwIfPlanningCancelled(request.signal);
    if (await input.isVisible().catch(() => false)) return;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_POLL_MS);
  }
  throw new Error(D.LOGIN_ERROR);
};
const generateWithDeepSeekChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.DEEPSEEK_CHAT, deepseekRooms, getPlanningRoomKey(request), request.signal);
  await ensureDeepSeekReady(room, request);
  await selectDeepSeekChatModel(room, request.model, request.signal);
  const response = await submitPrompt(room, getPlanningRoomKey(request), request.prompt, D.INPUT, D.SEND, D.RESPONSE, D.BUSY, request.expectedSceneIds || [], request.attachments || [], request.completionMarker, request.artifactType, request.requestId, request.signal);
  scheduleChatBrowserCleanup();
  return response;
};
const ensureClaudeReady = async (room: Page, request: ChatPlanningRequest): Promise<void> => {
  const input = room.locator(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_INPUT_SELECTOR).filter({ visible: true }).last();
  const ready = await input
    .waitFor({ state: SOURCE_TEXT_VISIBLE, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.PAGE_READY_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  throwIfPlanningCancelled(request.signal);
  if (ready) return;
  if (request.chromeHeadless !== false) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_LOGIN_REQUIRED_ERROR);
  appWarn(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_LOGIN_WAIT_LOG);
  const deadline = Date.now() + CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_LOGIN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    throwIfPlanningCancelled(request.signal);
    if (room.isClosed()) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_LOGIN_REQUIRED_ERROR);
    if (await input.isVisible().catch(() => false)) return;
    await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.SUBMISSION_POLL_MS);
  }
  throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_LOGIN_REQUIRED_ERROR);
};
const generateWithClaudeChat = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CLAUDE_CHAT, claudeRooms, getPlanningRoomKey(request), request.signal);
  await ensureClaudeReady(room, request);
  await selectClaudeChatModel(room, request.model, request.signal);
  const response = await submitPrompt(
    room,
    getPlanningRoomKey(request),
    request.prompt,
    CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_INPUT_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_SEND_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RESPONSE_SELECTOR,
    CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_BUSY_SELECTOR,
    request.expectedSceneIds || [],
    request.attachments || [],
    request.completionMarker,
    request.artifactType,
    request.requestId,
    request.signal,
  );
  scheduleChatBrowserCleanup();
  return response;
};
export const prepareChatPlanningRoom = async (request: ChatPlanningRequest): Promise<void> => {
  throwIfPlanningCancelled(request.signal);
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.DeepSeekChat)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.DEEPSEEK_CHAT, deepseekRooms, getPlanningRoomKey(request), request.signal);
    await ensureDeepSeekReady(room, request);
    await selectDeepSeekChatModel(room, request.model, request.signal);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.ClaudeChat)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.CLAUDE_CHAT, claudeRooms, getPlanningRoomKey(request), request.signal);
    await ensureClaudeReady(room, request);
    await selectClaudeChatModel(room, request.model, request.signal);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.GeminiChat)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.GEMINI_CHAT, geminiRooms, getPlanningRoomKey(request), request.signal);
    await getLastVisibleLocator(room, CINEMATIC_CHAT_PLANNING_CONFIG.GEMINI_INPUT_SELECTOR);
    await selectGeminiChatModel(room, request.model, request.allowDefaultGeminiModel);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.ChatGptUi)) {
    const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
    const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, getPlanningRoomKey(request), request.signal);
    await ensureChatGptReady(room, browser.account.email);
    return;
  }
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.GrokChat)) {
    const browser = await getOrLaunchGrokBrowser(request.chromeHeadless);
    const releaseBootstrap = await getGrokBootstrapMutex(browser.context).acquire();
    try {
      const room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, getPlanningRoomKey(request), request.signal);
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
    room = await createRoom(browser.context, EXTERNAL_URLS.GROK_CHAT, grokRooms, getPlanningRoomKey(request), request.signal);
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
  scheduleChatBrowserCleanup();
  return response;
};
const generateWithChatGptUi = async (request: ChatPlanningRequest): Promise<string> => {
  throwIfPlanningCancelled(request.signal);
  const browser = await getOrLaunchGlobalBrowser(request.chromeHeadless, true);
  const room = await createRoom(browser.context, EXTERNAL_URLS.CHATGPT, chatGptRooms, getPlanningRoomKey(request), request.signal);
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
  scheduleChatBrowserCleanup();
  return response;
};
const providerNames: Record<AiPlanningFallbackProvider, string> = {
  [AiPlanningFallbackProvider.GeminiChat]: SOURCE_TEXT_GEMINI_CHAT,
  [AiPlanningFallbackProvider.GrokChat]: SOURCE_TEXT_GROK_CHAT,
  [AiPlanningFallbackProvider.ChatGptUi]: SOURCE_TEXT_CHATGPT,
  [AiPlanningFallbackProvider.ClaudeChat]: C.CLAUDE,
  [AiPlanningFallbackProvider.DeepSeekChat]: XRT.DEEPSEEK_NAME,
  [AiPlanningFallbackProvider.Disabled]: SOURCE_TEXT_DISABLED,
};
const providerGenerators: Partial<Record<AiPlanningFallbackProvider, (request: ChatPlanningRequest) => Promise<string>>> = {
  [AiPlanningFallbackProvider.GeminiChat]: generateWithGeminiChat,
  [AiPlanningFallbackProvider.GrokChat]: generateWithGrokChat,
  [AiPlanningFallbackProvider.ChatGptUi]: generateWithChatGptUi,
  [AiPlanningFallbackProvider.ClaudeChat]: generateWithClaudeChat,
  [AiPlanningFallbackProvider.DeepSeekChat]: generateWithDeepSeekChat,
};
export const generatePlanningWithChatUi = async (request: ChatPlanningRequest): Promise<{ text: string; provider: AiPlanningFallbackProvider }> => {
  if (_.isEqual(request.provider, AiPlanningFallbackProvider.Disabled)) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.FALLBACK_DISABLED);
  throwIfPlanningCancelled(request.signal);
  const roomKey = getPlanningRoomKey(request);
  const planningMutex = planningMutexes.get(roomKey) || new SimpleMutex();
  planningMutexes.set(roomKey, planningMutex);
  const mutexStartedAt = Date.now();
  const release = await planningMutex.acquire();
  let cancelledRoomCleanup: Promise<void> | undefined;
  const closeCancelledRoom = () => {
    cancelledRoomCleanup ??= closeChatPlanningRoom(request)
      .then(() => closeChatBrowserIfIdle())
      .then(() => undefined)
      .catch(() => undefined);
  };
  request.signal?.addEventListener(SOURCE_TEXT_ABORT, closeCancelledRoom, { once: true });
  let responseCompleted = false;
  const diagnosticBase = { runId: request.requestId || request.projectId, workerId: request.workerId, provider: request.provider, model: request.model, stage: request.artifactType || SOURCE_TEXT_PLANNING, attachmentCount: request.attachments?.length || 0 };
  await writeMusicDiagnostic(SOURCE_TEXT_CHAT_REQUEST_STARTED, { ...diagnosticBase, elapsedMs: Date.now() - mutexStartedAt });
  const isMusicMixerRequest = request.artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING;
  if (isMusicMixerRequest) activeMusicMixerRequests++;
  try {
    throwIfPlanningCancelled(request.signal);
    appLog(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_QUEUE_ACQUIRED(request.workerId || CINEMATIC_CHAT_PLANNING_CONFIG.DEFAULT_WORKER_ID, providerNames[request.provider], request.projectId, Date.now() - mutexStartedAt));
    const generator = providerGenerators[request.provider];
    if (!generator) throw new Error(CHAT_UI_AUTOMATION_MESSAGES.FALLBACK_UNSUPPORTED);
    let lastError: unknown;
    const maxRecoveryAttempts = request.artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING ? 3 : CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_ATTEMPTS;
    for (let recoveryAttempt = 0; recoveryAttempt <= maxRecoveryAttempts; recoveryAttempt++) {
      try {
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ATTEMPT_STARTED, { ...diagnosticBase, attempt: recoveryAttempt + 1 });
        await delayAsync(CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_REQUEST_COOLDOWN_MS);
        throwIfPlanningCancelled(request.signal);
        const text = await generator(request);
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_RESPONSE_COMPLETED, { ...diagnosticBase, attempt: recoveryAttempt + 1, responseChars: text.length, elapsedMs: Date.now() - mutexStartedAt });
        providerErrorCounts.delete(roomKey);
        responseCompleted = true;
        return { text, provider: request.provider };
      } catch (error) {
        await writeMusicDiagnostic(SOURCE_TEXT_CHAT_ATTEMPT_FAILED, { ...diagnosticBase, attempt: recoveryAttempt + 1, ...musicErrorDetails(error) });
        lastError = error;
        throwIfPlanningCancelled(request.signal);
        const errorMessage = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error));
        const isRetryableMusicResponseError = request.artifactType === SOURCE_TEXT_MUSIC_MIXER_RANKING && (errorMessage === CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR || errorMessage === CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR);
        if (isRetryableMusicResponseError) {
          if (recoveryAttempt < 2) {
            await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PROVIDER_RETRY_SAME_ROOM, { ...diagnosticBase, attempt: recoveryAttempt + 2 });
            await delayAsync(1500);
            continue;
          }
          if (recoveryAttempt === 2) {
            await writeMusicDiagnostic(SOURCE_TEXT_CHAT_PROVIDER_ROOM_RELOAD, { ...diagnosticBase, attempt: recoveryAttempt + 2 });
            await reloadChatPlanningRoom(request);
            await delayAsync(2000);
            continue;
          }
          throw error;
        }
        const canRecoverClosedRoom = CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_ERROR_PATTERN.test(errorMessage) && recoveryAttempt < CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_ATTEMPTS;
        if (!canRecoverClosedRoom) throw error;
        appWarn(_.replace(CINEMATIC_CHAT_PLANNING_CONFIG.CLOSED_ROOM_RECOVERY_LOG, SecurityConstants.PLACEHOLDER_0, providerNames[request.provider]));
        await closeChatPlanningRoom(request);
      }
    }
    throw lastError;
  } catch (error) {
    await writeMusicDiagnostic(SOURCE_TEXT_CHAT_REQUEST_FAILED, { ...diagnosticBase, elapsedMs: Date.now() - mutexStartedAt, ...musicErrorDetails(error) });
    if (!_.isEqual(_.toString(_.get(error, SOURCE_TEXT_MESSAGE, error)), CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR)) {
      appWarn(CHAT_UI_AUTOMATION_MESSAGES.PLANNING_PROVIDER_INCOMPLETE(providerNames[request.provider], _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
    }
    throw error;
  } finally {
    request.signal?.removeEventListener(SOURCE_TEXT_ABORT, closeCancelledRoom);
    try {
      if (request.signal?.aborted) {
        closeCancelledRoom();
        await cancelledRoomCleanup;
      } else if (responseCompleted && (request.closeRoomOnComplete ?? CINEMATIC_CHAT_PLANNING_CONFIG.CLOSE_ROOM_ON_COMPLETE)) {
        await closeChatPlanningRoom(request);
      }
    } finally {
      release();
      if (isMusicMixerRequest) {
        activeMusicMixerRequests--;
        scheduleChatBrowserCleanup();
      }
    }
  }
};
