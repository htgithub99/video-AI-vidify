import { Page } from "playwright";
import { appLog, appError } from "../../lib/logger.js";
import { delayAsync } from "../../lib/shared-utils.js";
import _ from "lodash";
import { AutoLoginConstants, SecurityConstants } from "../../constants/security.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";

export async function autoLoginGoogle(page: Page, account: any): Promise<boolean> {
  const email = _.get(account, SecurityConstants.PROP_EMAIL, SecurityConstants.EMPTY_STRING);
  const password = _.get(account, SecurityConstants.PASSWORD_PROP, SecurityConstants.EMPTY_STRING);
  const recoveryEmail = _.get(account, SecurityConstants.RECOVERY_EMAIL_PROP, SecurityConstants.EMPTY_STRING);

  appLog(`${AutoLoginConstants.LOGS.START_LOGIN}${email}`);

  try {
    appLog(AutoLoginConstants.LOGS.NAVIGATING_SIGN_IN);
    await page.goto(AutoLoginConstants.URLS.SIGN_IN, { waitUntil: "load", timeout: 25000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    await delayAsync(3000);

    const handleAboutRedirect = async (p: Page) => {
      const currentUrl = p.url();
      if (_.includes(currentUrl, "/about") || _.includes(currentUrl, "google.com/account/about")) {
        appLog(AutoLoginConstants.LOGS.REDIRECT_ABOUT);
        const signInButton = p.locator(AutoLoginConstants.SELECTORS.ABOUT_SIGN_IN_BTN).first();
        if (await signInButton.isVisible()) {
          await signInButton.click();
          await p.waitForLoadState("networkidle").catch(() => {});
          await delayAsync(3000);
          appLog(AutoLoginConstants.LOGS.CLICKED_ABOUT_SIGN_IN.replace("{0}", p.url()));
        } else {
          appLog(AutoLoginConstants.LOGS.ABOUT_SIGN_IN_NOT_FOUND);
          await p.goto(AutoLoginConstants.URLS.SIGN_IN, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
        }
      }
    };

    await handleAboutRedirect(page);

    let url = page.url();
    appLog(AutoLoginConstants.LOGS.CURRENT_BROWSER_URL.replace("{0}", url));

    if (!_.includes(url, AutoLoginConstants.URLS.SIGN_IN_KEYWORD) && !_.includes(url, "accounts.google.com")) {
      appLog(AutoLoginConstants.LOGS.SESSION_EXISTS);
      await page.goto(AutoLoginConstants.URLS.LOGOUT, { waitUntil: "load", timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("networkidle").catch(() => {});
      await delayAsync(2000);
      await page.goto(AutoLoginConstants.URLS.SIGN_IN, { waitUntil: "load", timeout: 25000 }).catch(() => {});
      await page.waitForLoadState("networkidle").catch(() => {});
      await delayAsync(3000);
      await handleAboutRedirect(page);
    }

    url = page.url();
    appLog(AutoLoginConstants.LOGS.SEARCHING_EMAIL.replace("{0}", url));

    const emailSelectors = AutoLoginConstants.SELECTORS.EMAIL_SELECTORS;

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        const loc = page.locator(selector).first();
        if (await loc.isVisible()) {
          emailInput = loc;
          appLog(AutoLoginConstants.LOGS.FOUND_EMAIL_SELECTOR.replace("{0}", selector));
          break;
        }
      } catch (e) {}
    }

    if (emailInput) {
      await emailInput.fill(email);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle").catch(() => {});
      await delayAsync(3000);
    } else {
      appLog(AutoLoginConstants.LOGS.EMAIL_SELECTOR_FALLBACK);
      try {
        await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT, { timeout: 8000 });
        await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, email);
        await page.keyboard.press("Enter");
        await delayAsync(3000);
      } catch (err) {
        appLog(AutoLoginConstants.LOGS.EMAIL_NOT_FOUND_BLOCKED);
      }
    }

    appLog(AutoLoginConstants.LOGS.SEARCHING_PWD.replace("{0}", page.url()));

    const pwdSelectors = AutoLoginConstants.SELECTORS.PWD_SELECTORS;

    let pwdInput = null;
    for (const selector of pwdSelectors) {
      try {
        const loc = page.locator(selector).first();
        if (await loc.isVisible()) {
          pwdInput = loc;
          appLog(AutoLoginConstants.LOGS.FOUND_PWD_SELECTOR.replace("{0}", selector));
          break;
        }
      } catch (e) {}
    }

    if (pwdInput) {
      await pwdInput.fill(password);
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle").catch(() => {});
      await delayAsync(4000);
    } else {
      appLog(AutoLoginConstants.LOGS.PWD_SELECTOR_FALLBACK);
      try {
        await page.waitForSelector(AutoLoginConstants.SELECTORS.PWD_INPUT, { timeout: 8000 });
        await page.fill(AutoLoginConstants.SELECTORS.PWD_INPUT, password);
        await page.keyboard.press("Enter");
        await delayAsync(5000);
      } catch (err) {
        appLog(AutoLoginConstants.LOGS.PWD_NOT_FOUND_MANUAL);
      }
    }

    try {
      const needsRecovery = await page.locator(AutoLoginConstants.SELECTORS.CONFIRM_RECOVERY_TEXT).count();
      if (needsRecovery > 0) {
        if (!_.isEmpty(recoveryEmail)) {
          appLog(AutoLoginConstants.LOGS.VERIFY_RECOVERY);
          await page.click(AutoLoginConstants.SELECTORS.CONFIRM_RECOVERY_TEXT);
          await delayAsync(2000);
          await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT, { timeout: 5000 });
          await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, recoveryEmail);
          await page.keyboard.press("Enter");
          await delayAsync(5000);
        } else {
          appLog(AutoLoginConstants.LOGS.RECOVERY_CONFIG_EMPTY);
        }
      }
    } catch (err) {}

    let loginOk = false;
    for (let i = 0; i < 30; i++) {
      const currentUrl = page.url();
      if (_.includes(currentUrl, REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT) || _.includes(currentUrl, "gemini.google.com")) {
        loginOk = true;
        break;
      }
      
      if (i % 3 === 0 && i > 0) {
        try {
          await page.goto(REFACTOR_CONSTANTS.URL_MY_ACCOUNT, { waitUntil: "commit", timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(1000);
          if (_.includes(page.url(), REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT)) {
            loginOk = true;
            break;
          }
        } catch (e) {}
      }
      await delayAsync(2000);
    }

    if (loginOk) {
      appLog(`${AutoLoginConstants.LOGS.LOGIN_SUCCESS}${email}`);
      return true;
    } else {
      appError(AutoLoginConstants.LOGS.VERIFICATION_TIMEOUT.replace("{0}", email));
      return false;
    }
  } catch (error: any) {
    appError(`${AutoLoginConstants.LOGS.LOGIN_ERROR}${email}`, error);
    return false;
  }
}
