import type { BrowserContext, Page } from "playwright";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { watchHungPage } from "./pageWatchdog.js";
import { PAGE_WATCHDOG } from "../../constants/pageWatchdog.js";
import { BROWSER_BLANK_PAGE, BROWSER_BLANK_PAGE_STALE_MS } from "../../constants/browserLifecycle.js";
const chatRoomPages = new WeakSet<Page>();
export const isChatRoomPage = (page: Page): boolean => chatRoomPages.has(page);
export const blankChromePage = (context: BrowserContext): Page | undefined => context.pages().find((page) => !page.isClosed() && !chatRoomPages.has(page) && BROWSER_BLANK_PAGE.test(page.url()));
const blankSince = new WeakMap<Page, number>();
export const pruneBlankChromePages = async (context: BrowserContext): Promise<void> => {
  const now = Date.now();
  const open = context.pages().filter((page) => !page.isClosed());
  const blanks = open.filter((page) => !chatRoomPages.has(page) && BROWSER_BLANK_PAGE.test(page.url()));
  open.filter((page) => !blanks.includes(page)).forEach((page) => blankSince.delete(page));
  const stale = blanks.filter((page) => {
    if (!blankSince.has(page)) blankSince.set(page, now);
    return now - blankSince.get(page)! >= BROWSER_BLANK_PAGE_STALE_MS;
  });
  await Promise.all(stale.slice(1).map((page) => page.close().catch(() => undefined)));
};
export const claimBlankChatRoom = (context: BrowserContext): Page | undefined => {
  const page = blankChromePage(context);
  if (page) chatRoomPages.add(page);
  return page;
};
export const claimChatRoom = (page: Page): Page => {
  chatRoomPages.add(page);
  return page;
};
export const releaseChatRoom = (page: Page): void => {
  chatRoomPages.delete(page);
};
export const sharedChromeFlowPage = async (context: BrowserContext): Promise<Page> => watchHungPage(await findSharedChromeFlowPage(context), PAGE_WATCHDOG.LABEL.FLOW);
const findSharedChromeFlowPage = async (context: BrowserContext): Promise<Page> => context.pages().find((page) => !page.isClosed() && !chatRoomPages.has(page) && (page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW) || page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME))) || blankChromePage(context) || context.newPage();
