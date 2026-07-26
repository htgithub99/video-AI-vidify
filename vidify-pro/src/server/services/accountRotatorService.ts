import { appLog, appError } from "../../lib/logger.js";
import { Page } from "playwright";
import _ from "lodash";
import { SecurityConstants, SecurityMessages, GasActions, AccountStatus } from "../../constants/security.js";
import { requestContext } from "../utils/requestContext.js";
import { autoLoginGoogle } from "./autoLoginGoogle.js";

export async function switchGoogleAccount(page: Page): Promise<boolean> {
  try {
    const ctx = requestContext.getStore();
    const licenseKey = _.get(ctx, SecurityConstants.STORE_LICENSE_KEY, SecurityConstants.EMPTY_STRING);
    const planType = _.get(ctx, SecurityConstants.STORE_PLAN_TYPE_KEY, SecurityConstants.EMPTY_STRING);

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({
        action: GasActions.GET_ACCOUNTS,
        license_key: licenseKey,
        plan_id: planType,
        plan_type: planType
      })
    });
    const data: any = await response.json();

    if (_.has(data, SecurityConstants.ERROR_KEY)) {
      appLog(`${SecurityMessages.GAS_FETCH_ERROR}: ${_.get(data, SecurityConstants.ERROR_KEY)}`);
      return false;
    }

    const accounts = _.get(data, SecurityConstants.ACCOUNTS_KEY, []);
    const activeAccounts = _.filter(accounts, (acc: any) => _.isEqual(_.get(acc, SecurityConstants.PROP_STATUS), AccountStatus.ACTIVE));

    if (_.isEmpty(activeAccounts)) {
      appLog(SecurityMessages.NO_ACTIVE_ACCOUNT);
      return false;
    }

    const accountToUse = _.first(activeAccounts);
    appLog(`${SecurityMessages.TRY_ROTATING_ACCOUNT}${_.get(accountToUse, SecurityConstants.PROP_EMAIL, SecurityConstants.EMPTY_STRING)}`);

    const loginSuccess = await autoLoginGoogle(page, accountToUse);
    if (loginSuccess) {
      return true;
    } else {
      appLog(`${SecurityMessages.MARK_ACCOUNT_ERROR}${_.get(accountToUse, SecurityConstants.PROP_EMAIL, SecurityConstants.EMPTY_STRING)}`);

      await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
        body: JSON.stringify({
          action: GasActions.UPDATE_ACCOUNT_STATUS,
          rowIndex: _.get(accountToUse, SecurityConstants.ACCOUNT_ID_PROP),
          status: AccountStatus.ERROR
        })
      });

      return await switchGoogleAccount(page);
    }

  } catch (error: any) {
    appError(SecurityMessages.ROTATION_ERROR, error);
    return false;
  }
}
