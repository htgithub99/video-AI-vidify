import type { BrowserContext, Page } from "playwright";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { BROWSER_BLANK_PAGE } from "../../constants/browserLifecycle.js";
const chatRoomPages = new WeakSet<Page>();
export const isChatRoomPage = (page: Page): boolean => chatRoomPages.has(page);
export const blankChromePage = (context: BrowserContext): Page | undefined => context.pages().find((page) => !page.isClosed() && !chatRoomPages.has(page) && BROWSER_BLANK_PAGE.test(page.url()));
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
export const sharedChromeFlowPage = async (context: BrowserContext): Promise<Page> => context.pages().find((page) => !page.isClosed() && !chatRoomPages.has(page) && (page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW) || page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME))) || blankChromePage(context) || context.newPage();
