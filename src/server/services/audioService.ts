import {
  SOURCE_TEXT_1,
  SOURCE_TEXT_AISANDBOX_PA_GOOGLEAPIS_COM,
  SOURCE_TEXT_AUTHORIZATION,
  SOURCE_TEXT_GOOGLEAPIS_COM,
  SOURCE_TEXT_IF_TYPEOF_WINDOW_UNDEFINED_IF_WINDOW,
  SOURCE_TEXT_NETWORKIDLE,
  SOURCE_TEXT_PLAYWRIGHT_ACCESSING_LABS,
  SOURCE_TEXT_PLAYWRIGHT_BORDER,
  SOURCE_TEXT_PLAYWRIGHT_BORDER_BOTTOM,
  SOURCE_TEXT_PLAYWRIGHT_CHROME_COMMAND,
  SOURCE_TEXT_PLAYWRIGHT_CHROME_MANDATE,
  SOURCE_TEXT_PLAYWRIGHT_CONNECTING,
  SOURCE_TEXT_PLAYWRIGHT_CONNECT_ERR,
  SOURCE_TEXT_PLAYWRIGHT_LOGIN_PROMPT,
  SOURCE_TEXT_PLAYWRIGHT_TOKEN_CAPTURED,
  SOURCE_TEXT_PLAYWRIGHT_TOKEN_TIMEOUT,
  SOURCE_TEXT_REQUEST,
} from "../../constants/sourceText";
import { Page } from "playwright";
import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { EXTERNAL_URLS } from "../../constants";
import { appLog, appError } from "../../lib/logger.js";
import _ from "lodash";
chromium.use(stealthPlugin());
let globalPlaywrightPage: Page | null = null;
let globalBearerToken: string | null = null;
export async function initPlaywright() {
  if (!_.isNil(globalPlaywrightPage)) {
    try {
      await globalPlaywrightPage.evaluate(SOURCE_TEXT_1);
      return;
    } catch {
      globalPlaywrightPage = null;
    }
  }
  try {
    appLog(SOURCE_TEXT_PLAYWRIGHT_CONNECTING);
    const browser = await chromium.connectOverCDP(EXTERNAL_URLS.PLAYWRIGHT_CDP);
    const ctx = browser.contexts()[0];
    const page = ctx.pages()[0] || (await ctx.newPage());
    await page.addInitScript(SOURCE_TEXT_IF_TYPEOF_WINDOW_UNDEFINED_IF_WINDOW);
    page.on(SOURCE_TEXT_REQUEST, (req) => {
      const auth = req.headers()[SOURCE_TEXT_AUTHORIZATION];
      if (auth && req.url().includes(SOURCE_TEXT_AISANDBOX_PA_GOOGLEAPIS_COM)) {
        globalBearerToken = auth;
        (global as any).globalGoogleHeaders = req.headers();
      }
    });
    appLog(SOURCE_TEXT_PLAYWRIGHT_ACCESSING_LABS);
    await page.goto(EXTERNAL_URLS.GOOGLE_LABS, { waitUntil: SOURCE_TEXT_NETWORKIDLE });
    if (_.isEmpty(globalBearerToken)) {
      appLog(SOURCE_TEXT_PLAYWRIGHT_LOGIN_PROMPT);
      page
        .waitForResponse((res) => res.url().includes(SOURCE_TEXT_GOOGLEAPIS_COM), { timeout: 300000 })
        .then(() => appLog(SOURCE_TEXT_PLAYWRIGHT_TOKEN_CAPTURED))
        .catch(() => appLog(SOURCE_TEXT_PLAYWRIGHT_TOKEN_TIMEOUT));
    } else {
      appLog(SOURCE_TEXT_PLAYWRIGHT_TOKEN_CAPTURED);
    }
    globalPlaywrightPage = page;
  } catch (e: any) {
    appError(SOURCE_TEXT_PLAYWRIGHT_CONNECT_ERR, e?.message || e);
    _.forEach([SOURCE_TEXT_PLAYWRIGHT_BORDER, SOURCE_TEXT_PLAYWRIGHT_CHROME_MANDATE, SOURCE_TEXT_PLAYWRIGHT_CHROME_COMMAND, SOURCE_TEXT_PLAYWRIGHT_BORDER_BOTTOM], (k) => appLog(k));
  }
}
export async function closePlaywright() {
  if (!_.isNil(globalPlaywrightPage)) {
    try {
      await globalPlaywrightPage.close();
    } catch (e) {}
    globalPlaywrightPage = null;
  }
}
