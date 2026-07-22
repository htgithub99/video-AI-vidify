import { appLog, appError } from "../../lib/logger.js";
import { autoLoginGoogle } from "./autoLoginGoogle.js";
import { Page } from "playwright";

import _ from "lodash";
import { SecurityConstants, SecurityMessages, GasActions, AccountStatus } from "../../constants/security.js";
import { requestContext } from "../utils/requestContext.js";

export async function switchGoogleAccount(page: Page): Promise<boolean> {
  try {
    const ctx = requestContext.getStore();
    const licenseKey = _.get(ctx, 'licenseKey', "");
    const planType = _.get(ctx, 'planType', "");

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.GET_ACCOUNTS, license_key: licenseKey, plan_type: planType })
    });
    const data: any = await response.json();
    
    if (data.error) {
      appLog(`${SecurityMessages.GAS_FETCH_ERROR}: ${data.error}`);
      return false;
    }

    const accounts = _.get(data, 'accounts', []);

    const activeAccounts = _.filter(accounts, (acc: any) => _.isEqual(acc.status, AccountStatus.ACTIVE));
    
    if (_.isEmpty(activeAccounts)) {
      appLog(SecurityMessages.NO_ACTIVE_ACCOUNT);
      return false;
    }

    const accountToUse = _.first(activeAccounts);
    appLog(`${SecurityMessages.TRY_ROTATING_ACCOUNT}${accountToUse.email}`);

    const loginSuccess = await autoLoginGoogle(page, accountToUse);
    if (loginSuccess) {
      return true;
    } else {
      appLog(`${SecurityMessages.MARK_ACCOUNT_ERROR}${accountToUse.email}`);
      
      await fetch(SecurityConstants.GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: GasActions.UPDATE_ACCOUNT_STATUS, rowIndex: accountToUse.id, status: AccountStatus.ERROR })
      });
      
      return await switchGoogleAccount(page);
    }

  } catch (error: any) {
    appError(SecurityMessages.ROTATION_ERROR, error);
    return false;
  }
}
