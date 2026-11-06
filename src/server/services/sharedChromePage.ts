import type { BrowserContext, Page } from "playwright";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
export const sharedChromeFlowPage = async (context: BrowserContext): Promise<Page> => context.pages().find((page) => !page.isClosed() && (page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW) || page.url().startsWith(EXTERNAL_URLS.GOOGLE_LABS_FLOW_HOME))) || context.newPage();
