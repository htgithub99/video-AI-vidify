import { Page } from "playwright";
import { appLog, appError } from "../../lib/logger.js";
import { delayAsync } from "../../lib/shared-utils.js";
import _ from "lodash";
import { AutoLoginConstants } from "../../constants/security.js";

export async function autoLoginGoogle(page: Page, account: any): Promise<boolean> {
  const { email, password, recoveryEmail } = account;
  appLog(`${AutoLoginConstants.LOGS.START_LOGIN}${email}`);

  try {
    await page.goto(AutoLoginConstants.URLS.SIGN_IN, { waitUntil: "networkidle" });
    
    const url = page.url();
    if (!_.includes(url, AutoLoginConstants.URLS.SIGN_IN_KEYWORD)) {
      appLog(AutoLoginConstants.LOGS.SESSION_EXISTS);
      await page.goto(AutoLoginConstants.URLS.LOGOUT, { waitUntil: "networkidle" });
      await delayAsync(2000);
      await page.goto(AutoLoginConstants.URLS.SIGN_IN, { waitUntil: "networkidle" });
    }

    await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT);
    await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, email);
    await page.keyboard.press("Enter");
    await delayAsync(3000);

    const isError = await page.locator(AutoLoginConstants.SELECTORS.NO_ACCOUNT_TEXT).count();
    if (isError > 0) throw new Error(AutoLoginConstants.ERRORS.NO_ACCOUNT);

    await page.waitForSelector(AutoLoginConstants.SELECTORS.PWD_INPUT, { timeout: 10000 });
    await page.fill(AutoLoginConstants.SELECTORS.PWD_INPUT, password);
    await page.keyboard.press("Enter");
    await delayAsync(5000);

    const needsRecovery = await page.locator(AutoLoginConstants.SELECTORS.CONFIRM_RECOVERY_TEXT).count();
    if (needsRecovery > 0) {
      if (_.isEmpty(recoveryEmail)) throw new Error(AutoLoginConstants.ERRORS.MISSING_RECOVERY);
      appLog(AutoLoginConstants.LOGS.VERIFY_RECOVERY);
      await page.click(AutoLoginConstants.SELECTORS.CONFIRM_RECOVERY_TEXT);
      await delayAsync(2000);
      await page.waitForSelector(AutoLoginConstants.SELECTORS.EMAIL_INPUT);
      await page.fill(AutoLoginConstants.SELECTORS.EMAIL_INPUT, recoveryEmail);
      await page.keyboard.press("Enter");
      await delayAsync(5000);
    }

    const phoneVerify = await page.locator(AutoLoginConstants.SELECTORS.VERIFY_IT_IS_YOU).count();
    if (phoneVerify > 0) {
      throw new Error(AutoLoginConstants.ERRORS.IDENTITY_VERIFY);
    }

    appLog(`${AutoLoginConstants.LOGS.LOGIN_SUCCESS}${email}`);
    return true;
  } catch (error: any) {
    appError(`${AutoLoginConstants.LOGS.LOGIN_ERROR}${email}`, error);
    return false;
  }
}
