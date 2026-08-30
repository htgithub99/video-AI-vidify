import { Locator, Page } from "playwright";
import { appLog, appError, appWarn } from "../../lib/logger.js";
import { delayAsync, randomDelay } from "../../lib/shared-utils.js";
import _ from "lodash";
import { AutoLoginConstants, SecurityConstants } from "../../constants/security.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { GoogleAccount } from "./accountRotatorService.js";
import { captureDomDiagnostics } from "./domDiagnosticsService.js";
import { getErrorMessage } from "../utils/errorUtils.js";

const captureLoginDomState = (page: Page, state: string): Promise<void> =>
  captureDomDiagnostics(page, state, {
    fileName: AutoLoginConstants.DIAGNOSTICS.FILE_NAME,
    selector: AutoLoginConstants.DIAGNOSTICS.SELECTOR,
    maxElements: AutoLoginConstants.DIAGNOSTICS.MAX_ELEMENTS,
    maxClassNameLength: AutoLoginConstants.DIAGNOSTICS.MAX_CLASS_NAME_LENGTH,
    maxTextLength: AutoLoginConstants.DIAGNOSTICS.MAX_TEXT_LENGTH,
    maxHtmlLength: AutoLoginConstants.DIAGNOSTICS.MAX_HTML_LENGTH,
    errorMessageTemplate: AutoLoginConstants.DIAGNOSTICS.ERROR_MESSAGE,
  });

interface LocatedElement {
  locator: Locator;
  selector: string;
}

const findVisibleLocator = async (page: Page, selectors: readonly string[]): Promise<LocatedElement | null> => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return { locator, selector };
  }
  return null;
};

const clickFirstEnabledLocator = async (page: Page, selectors: readonly string[]): Promise<boolean> => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    const isActionable = (await locator.isVisible().catch(() => false)) && (await locator.isEnabled().catch(() => false));
    if (isActionable) {
      await locator.click();
      return true;
    }
  }
  return false;
};

const hasVisibleLocator = async (page: Page, selectors: readonly string[]): Promise<boolean> => {
  const visibility = await Promise.all(
    _.map(selectors, (selector) =>
      page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false),
    ),
  );
  return _.some(visibility);
};

export async function autoLoginGoogle(page: Page, account: GoogleAccount, isHeadless = true): Promise<boolean> {
  const email = _.get(account, SecurityConstants.PROP_EMAIL, SecurityConstants.EMPTY_STRING);
  const password = _.get(account, SecurityConstants.PASSWORD_PROP, SecurityConstants.EMPTY_STRING);
  const recoveryEmail = _.get(account, SecurityConstants.RECOVERY_EMAIL_PROP, SecurityConstants.EMPTY_STRING);

  appLog(`${AutoLoginConstants.LOGS.START_LOGIN}${email}`);

  try {
    appLog(AutoLoginConstants.LOGS.NAVIGATING_SIGN_IN);
    await page
      .goto(EXTERNAL_URLS.GOOGLE_SIGN_IN, {
        waitUntil: "load",
        timeout: AutoLoginConstants.CONFIG.NAVIGATION_TIMEOUT_MS,
      })
      .catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => {});
    await delayAsync(AutoLoginConstants.CONFIG.PAGE_READY_DELAY_MS);
    await captureLoginDomState(page, "login_page_opened");

    let url = page.url();
    appLog(AutoLoginConstants.LOGS.CURRENT_BROWSER_URL.replace("{0}", url));

    url = page.url();
    appLog(AutoLoginConstants.LOGS.SEARCHING_EMAIL.replace("{0}", url));

    const emailSelectors = AutoLoginConstants.SELECTORS.EMAIL_SELECTORS;

    const emailElement = await findVisibleLocator(page, emailSelectors);

    if (emailElement) {
      const { locator: emailInput, selector } = emailElement;
      appLog(AutoLoginConstants.LOGS.FOUND_EMAIL_SELECTOR.replace("{0}", selector));
      await randomDelay(AutoLoginConstants.CONFIG.EMAIL_DELAY_MIN_MS, AutoLoginConstants.CONFIG.EMAIL_DELAY_MAX_MS);
      await emailInput.fill(email);
      await randomDelay(AutoLoginConstants.CONFIG.EMAIL_NEXT_DELAY_MIN_MS, AutoLoginConstants.CONFIG.EMAIL_NEXT_DELAY_MAX_MS);
      const clickedNext = await clickFirstEnabledLocator(page, AutoLoginConstants.SELECTORS.EMAIL_NEXT_SELECTORS);
      if (!clickedNext) await emailInput.press("Enter");
      appLog(AutoLoginConstants.LOGS.CLICKED_EMAIL_NEXT);
      await captureLoginDomState(page, "email_next_clicked");
    } else {
      appLog(AutoLoginConstants.LOGS.EMAIL_SELECTOR_FALLBACK);
      try {
        await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT, { timeout: AutoLoginConstants.CONFIG.FALLBACK_INPUT_TIMEOUT_MS });
        await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, email);
        const fallbackEmailInput = page.locator(AutoLoginConstants.SELECTORS.EMAIL_INPUT).first();
        const clickedNext = await clickFirstEnabledLocator(page, AutoLoginConstants.SELECTORS.EMAIL_NEXT_SELECTORS);
        if (!clickedNext) await fallbackEmailInput.press("Enter");
        appLog(AutoLoginConstants.LOGS.CLICKED_EMAIL_NEXT);
        await captureLoginDomState(page, "email_next_clicked_fallback");
      } catch (err) {
        appLog(AutoLoginConstants.LOGS.EMAIL_NOT_FOUND_BLOCKED);
      }
    }

    try {
      await page.waitForSelector(AutoLoginConstants.SELECTORS.PWD_INPUT, {
        state: "visible",
        timeout: AutoLoginConstants.CONFIG.PASSWORD_SCREEN_TIMEOUT_MS,
      });
    } catch (err) {
      if (!(await hasVisibleLocator(page, AutoLoginConstants.SELECTORS.MANUAL_VERIFICATION_SELECTORS))) {
        await captureLoginDomState(page, "password_screen_missing");
        appLog(AutoLoginConstants.LOGS.PWD_SCREEN_NOT_READY);
        return false;
      }
    }

    appLog(AutoLoginConstants.LOGS.SEARCHING_PWD.replace("{0}", page.url()));

    const pwdSelectors = AutoLoginConstants.SELECTORS.PWD_SELECTORS;

    const passwordElement = await findVisibleLocator(page, pwdSelectors);

    if (passwordElement) {
      const { locator: pwdInput, selector } = passwordElement;
      appLog(AutoLoginConstants.LOGS.FOUND_PWD_SELECTOR.replace("{0}", selector));
      await randomDelay(AutoLoginConstants.CONFIG.PASSWORD_DELAY_MIN_MS, AutoLoginConstants.CONFIG.PASSWORD_DELAY_MAX_MS);
      await pwdInput.fill(password);
      await randomDelay(AutoLoginConstants.CONFIG.PASSWORD_NEXT_DELAY_MIN_MS, AutoLoginConstants.CONFIG.PASSWORD_NEXT_DELAY_MAX_MS);
      const clickedNext = await clickFirstEnabledLocator(page, AutoLoginConstants.SELECTORS.PWD_NEXT_SELECTORS);
      if (!clickedNext) await pwdInput.press("Enter");
      appLog(AutoLoginConstants.LOGS.CLICKED_PWD_NEXT);
      await captureLoginDomState(page, "password_next_clicked");
      await delayAsync(AutoLoginConstants.CONFIG.POST_PASSWORD_DELAY_MS);
    } else {
      appLog(AutoLoginConstants.LOGS.PWD_SELECTOR_FALLBACK);
      try {
        await page.waitForSelector(AutoLoginConstants.SELECTORS.PWD_INPUT, { timeout: AutoLoginConstants.CONFIG.FALLBACK_INPUT_TIMEOUT_MS });
        await page.fill(AutoLoginConstants.SELECTORS.PWD_INPUT, password);
        const fallbackPwdInput = page.locator(AutoLoginConstants.SELECTORS.PWD_INPUT).first();
        const clickedNext = await clickFirstEnabledLocator(page, AutoLoginConstants.SELECTORS.PWD_NEXT_SELECTORS);
        if (!clickedNext) await fallbackPwdInput.press("Enter");
        appLog(AutoLoginConstants.LOGS.CLICKED_PWD_NEXT);
        await captureLoginDomState(page, "password_next_clicked_fallback");
        await delayAsync(AutoLoginConstants.CONFIG.POST_FALLBACK_PASSWORD_DELAY_MS);
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
          await delayAsync(AutoLoginConstants.CONFIG.RECOVERY_STEP_DELAY_MS);
          await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT, { timeout: AutoLoginConstants.CONFIG.RECOVERY_INPUT_TIMEOUT_MS });
          await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, recoveryEmail);
          await page.keyboard.press("Enter");
          await delayAsync(AutoLoginConstants.CONFIG.POST_RECOVERY_DELAY_MS);
        } else {
          appLog(AutoLoginConstants.LOGS.RECOVERY_CONFIG_EMPTY);
        }
      }
    } catch (error: unknown) {
      appWarn(AutoLoginConstants.LOGS.RECOVERY_STEP_SKIPPED, getErrorMessage(error));
    }

    let loginOk = false;
    let manualWaitLogged = false;
    let checkedMyAccountAfterManual = false;
    const maxVerificationPolls = isHeadless ? AutoLoginConstants.CONFIG.HEADLESS_VERIFICATION_POLLS : AutoLoginConstants.CONFIG.WINDOWED_VERIFICATION_POLLS;
    for (let i = 0; i < maxVerificationPolls; i++) {
      const currentUrl = page.url();
      if (_.some([_.includes(currentUrl, REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT), _.includes(currentUrl, EXTERNAL_URLS.GEMINI_CHAT_BASE)])) {
        loginOk = true;
        break;
      }

      const needsManual = _.some([
        await hasVisibleLocator(page, AutoLoginConstants.SELECTORS.MANUAL_VERIFICATION_SELECTORS),
        _.includes(currentUrl, AutoLoginConstants.URLS.CHALLENGE_KEYWORD),
        _.includes(currentUrl, AutoLoginConstants.URLS.REJECTED_SIGN_IN_KEYWORD),
      ]);

      if (needsManual && isHeadless) {
        await captureLoginDomState(page, "manual_verification_headless");
        appError(AutoLoginConstants.LOGS.HEADLESS_MANUAL_REQUIRED);
        return false;
      }
      if (needsManual && !manualWaitLogged) {
        await captureLoginDomState(page, "manual_verification_waiting");
        appLog(AutoLoginConstants.LOGS.MANUAL_VERIFICATION_WAIT);
        manualWaitLogged = true;
      }

      const leftLoginFlow = !_.includes(currentUrl, EXTERNAL_URLS.GOOGLE_ACCOUNTS) && !_.includes(currentUrl, AutoLoginConstants.URLS.ACCOUNT_ABOUT_PATH);
      if (manualWaitLogged && leftLoginFlow && !checkedMyAccountAfterManual) {
        checkedMyAccountAfterManual = true;
        try {
          await page
            .goto(EXTERNAL_URLS.GOOGLE_MY_ACCOUNT, {
              waitUntil: "domcontentloaded",
              timeout: AutoLoginConstants.CONFIG.MANUAL_ACCOUNT_CHECK_TIMEOUT_MS,
            })
            .catch(() => undefined);
          if (_.includes(page.url(), REFACTOR_CONSTANTS.KEYWORD_MY_ACCOUNT)) {
            appLog(AutoLoginConstants.LOGS.MANUAL_VERIFICATION_DONE);
            await captureLoginDomState(page, "manual_verification_completed");
            loginOk = true;
            break;
          }
        } catch (error: unknown) {
          appWarn(AutoLoginConstants.LOGS.MANUAL_ACCOUNT_CHECK_FAILED, getErrorMessage(error));
        }
      }
      await delayAsync(AutoLoginConstants.CONFIG.MANUAL_CHECK_DELAY_MS);
    }

    if (loginOk) {
      appLog(`${AutoLoginConstants.LOGS.LOGIN_SUCCESS}${email}`);
      return true;
    } else {
      await captureLoginDomState(page, "login_verification_timeout");
      appError(AutoLoginConstants.LOGS.VERIFICATION_TIMEOUT.replace("{0}", email));
      return false;
    }
  } catch (error: unknown) {
    appError(`${AutoLoginConstants.LOGS.LOGIN_ERROR}${email}`, getErrorMessage(error));
    return false;
  }
}
