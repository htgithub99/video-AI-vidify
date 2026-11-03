import type { Locator, Page, Response } from "playwright";
import { AiPlanningFallbackProvider } from "../../types.js";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { CHAT_HISTORY_CLEANUP as C } from "../../constants/chatHistoryCleanup.js";
const visible = (locator: Locator): Locator => locator.filter({ visible: true }).first();
const navigate = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: C.VERIFY_TIMEOUT_MS });
};
const click = async (locator: Locator): Promise<void> => {
  await locator.click({ timeout: C.ACTION_TIMEOUT_MS });
};
const confirmation = (page: Page, heading: RegExp): Locator =>
  page
    .getByRole("dialog")
    .or(page.getByRole("alertdialog"))
    .filter({ has: page.getByRole("heading", { name: heading }), visible: true })
    .last();
const isDeletionResponse = (response: Response, origin: string): boolean => {
  const url = new URL(response.url());
  const method = response.request().method();
  return url.origin === origin && C.CONVERSATION_PATH.test(url.pathname) && (method === "DELETE" || method === "PATCH" || (method === "POST" && C.DELETE_PATH.test(url.pathname)));
};
const confirmBulkDeletion = async (page: Page, dialog: Locator, button: RegExp): Promise<void> => {
  await dialog.waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
  const origin = new URL(page.url()).origin;
  const responsePromise = page.waitForResponse((response) => isDeletionResponse(response, origin), { timeout: C.VERIFY_TIMEOUT_MS }).catch(() => undefined);
  await click(visible(dialog.getByRole("button", { name: button, exact: true })));
  const response = await responsePromise;
  if (!response?.ok()) throw new Error(C.ERROR);
  const body = await response.json().catch(() => undefined);
  if (response.status() !== 204 && (!body || typeof body !== "object")) throw new Error(C.ERROR);
  if (body?.error || body?.errors || body?.success === false || body?.ok === false) throw new Error(C.ERROR);
  await dialog.waitFor({ state: "hidden", timeout: C.VERIFY_TIMEOUT_MS });
};
const deleteAllGeminiActivity = async (page: Page): Promise<void> => {
  await navigate(page, EXTERNAL_URLS.GEMINI_ACTIVITY);
  const remove = visible(page.getByRole("button", { name: C.DELETE, exact: true }));
  await remove
    .or(visible(page.getByText(C.GEMINI_EMPTY, { exact: true })))
    .first()
    .waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
  if (await visible(page.getByText(C.GEMINI_EMPTY, { exact: true })).count()) return;
  await click(remove);
  const allTime = visible(
    page
      .getByRole("menuitem", { name: C.ALL_TIME, exact: true })
      .or(page.getByRole("button", { name: C.ALL_TIME, exact: true }))
      .or(page.getByText(C.ALL_TIME, { exact: true })),
  );
  await click(allTime);
  const dialog = confirmation(page, C.GEMINI_CONFIRM_HEADING);
  await dialog.waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
  await click(visible(dialog.getByRole("button", { name: C.DELETE, exact: true })));
  const deadline = Date.now() + C.VERIFY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (!(await dialog.count()) && ((await visible(page.getByText(C.GEMINI_SUCCESS)).count()) || (await visible(page.getByText(C.GEMINI_EMPTY, { exact: true })).count()))) return;
    await new Promise<void>((resolve) => setTimeout(resolve, C.POLL_MS));
  }
  throw new Error(C.ERROR);
};
export const deleteProviderConversationHistory = async (page: Page, provider: AiPlanningFallbackProvider): Promise<number> => {
  if (provider === AiPlanningFallbackProvider.GeminiChat) await deleteAllGeminiActivity(page);
  else if (provider === AiPlanningFallbackProvider.ChatGptUi || provider === AiPlanningFallbackProvider.GrokChat) {
    const isGrok = provider === AiPlanningFallbackProvider.GrokChat;
    await navigate(page, isGrok ? C.GROK_SETTINGS_URL : C.CHATGPT_SETTINGS_URL);
    await visible(page.getByRole("heading", { name: C.DATA_CONTROLS, exact: true })).waitFor({ state: "visible", timeout: C.ACTION_TIMEOUT_MS });
    const deleteAll = isGrok ? C.GROK_DELETE_ALL : C.CHATGPT_DELETE_ALL;
    await click(visible(page.getByRole("button", { name: deleteAll, exact: true })));
    await confirmBulkDeletion(page, confirmation(page, isGrok ? C.GROK_CONFIRM_HEADING : C.CHATGPT_CONFIRM_HEADING), isGrok ? C.DELETE : C.CHATGPT_DELETE_ALL);
  } else throw new Error(C.UNSUPPORTED);
  return 0;
};
