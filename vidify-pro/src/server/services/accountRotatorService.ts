import path from "path";
import fs from "fs";
import _ from "lodash";
import { getDataDirectory } from "../utils/paths.js";
import { logger } from "../../lib/logger.js";
import {
  SecurityConstants,
  GasActions,
  AccountStatus,
  SecurityMessages,
} from "../../constants/security.js";
import { requestContext } from "../utils/requestContext.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";
import { jsonUtils } from "../../lib/json.js";

export interface GoogleAccount {
  email: string;
  password?: string;
  recoveryEmail?: string;
  status?: string;
}

function getAccountsFilePath(): string {
  return path.join(getDataDirectory(), REFACTOR_CONSTANTS.ACCOUNTS_FILE);
}

export function getLocalAccounts(): GoogleAccount[] {
  const filePath = getAccountsFilePath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, REFACTOR_CONSTANTS.ENCODING_UTF8);
    return jsonUtils.safeParse<GoogleAccount[]>(data, []);
  } catch (err) {
    logger.error(REFACTOR_CONSTANTS.LOG_READ_ACC_ERR, err);
    return [];
  }
}

export function saveLocalAccounts(accounts: GoogleAccount[]): void {
  const filePath = getAccountsFilePath();
  try {
    fs.writeFileSync(
      filePath,
      jsonUtils.safeStringify(accounts, null, 2),
      REFACTOR_CONSTANTS.ENCODING_UTF8,
    );
    logger.info(REFACTOR_CONSTANTS.LOG_SAVE_ACC_OK.replace("{0}", filePath));
  } catch (err) {
    logger.error(REFACTOR_CONSTANTS.LOG_SAVE_ACC_ERR, err);
    throw err;
  }
}

async function getGasAccounts(): Promise<GoogleAccount[]> {
  try {
    const ctx = requestContext.getStore();
    const licenseKey = _.get(
      ctx,
      SecurityConstants.STORE_LICENSE_KEY,
      SecurityConstants.EMPTY_STRING,
    );
    const planType = _.get(
      ctx,
      SecurityConstants.STORE_PLAN_TYPE_KEY,
      SecurityConstants.EMPTY_STRING,
    );

    if (_.isEmpty(licenseKey)) {
      logger.warn(REFACTOR_CONSTANTS.LOG_GAS_MISSING_KEY);
      return [];
    }

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: {
        [SecurityConstants.HEADER_CONTENT_TYPE]:
          SecurityConstants.CONTENT_TYPE_JSON,
      },
      body: JSON.stringify({
        action: GasActions.GET_ACCOUNTS,
        license_key: licenseKey,
        plan_id: planType,
        plan_type: planType,
      }),
    });
    const data: any = await response.json();

    if (_.has(data, SecurityConstants.ERROR_KEY)) {
      logger.error(
        `${SecurityMessages.GAS_FETCH_ERROR}: ${_.get(data, SecurityConstants.ERROR_KEY)}`,
      );
      return [];
    }

    const accounts = _.get(data, SecurityConstants.ACCOUNTS_KEY, []);
    return _.map(accounts, (acc: any) => ({
      email: _.get(acc, SecurityConstants.PROP_EMAIL, ""),
      password: _.get(acc, SecurityConstants.PASSWORD_PROP, ""),
      recoveryEmail: _.get(acc, SecurityConstants.RECOVERY_EMAIL_PROP, ""),
      status: _.get(acc, SecurityConstants.PROP_STATUS, ""),
    }));
  } catch (error) {
    logger.error(REFACTOR_CONSTANTS.LOG_GAS_FETCH_ERR, error);
    return [];
  }
}

export async function getNextAccount(
  lastEmail?: string,
): Promise<GoogleAccount | null> {
  const localAccounts = getLocalAccounts();
  const activeLocal = _.filter(
    localAccounts,
    (acc) => !_.isEqual(_.toUpper(acc.status), _.toUpper(AccountStatus.ERROR)),
  );

  if (!_.isEmpty(activeLocal)) {
    let selected = _.first(activeLocal)!;
    if (lastEmail) {
      const idx = _.findIndex(activeLocal, { email: lastEmail });
      if (idx !== -1 && idx + 1 < activeLocal.length) {
        selected = activeLocal[idx + 1];
      }
    }
    logger.info(
      REFACTOR_CONSTANTS.LOG_ROTATE_LOCAL.replace("{0}", selected.email),
    );
    return selected;
  }

  logger.info(REFACTOR_CONSTANTS.LOG_NO_LOCAL_ACC);
  const gasAccounts = await getGasAccounts();
  const activeGas = _.filter(gasAccounts, (acc) =>
    _.isEqual(_.toUpper(acc.status), _.toUpper(AccountStatus.ACTIVE)),
  );

  if (_.isEmpty(activeGas)) {
    logger.warn(REFACTOR_CONSTANTS.LOG_NO_ACC_AVAIL);
    return null;
  }

  let selected = _.first(activeGas)!;
  if (lastEmail) {
    const idx = _.findIndex(activeGas, { email: lastEmail });
    if (idx !== -1 && idx + 1 < activeGas.length) {
      selected = activeGas[idx + 1];
    }
  }
  logger.info(REFACTOR_CONSTANTS.LOG_ROTATE_GAS.replace("{0}", selected.email));
  return selected;
}

export async function markAccountError(email: string): Promise<void> {
  logger.warn(REFACTOR_CONSTANTS.LOG_MARK_ERR.replace("{0}", email));

  const localAccounts = getLocalAccounts();
  const localIdx = _.findIndex(localAccounts, { email });
  if (localIdx !== -1) {
    localAccounts[localIdx].status = AccountStatus.ERROR;
    saveLocalAccounts(localAccounts);
    return;
  }

  try {
    const gasAccounts = await getGasAccounts();
    const gasAcc = _.find(gasAccounts, { email });
    if (gasAcc) {
      await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: {
          [SecurityConstants.HEADER_CONTENT_TYPE]:
            SecurityConstants.CONTENT_TYPE_JSON,
        },
        body: JSON.stringify({
          action: GasActions.UPDATE_ACCOUNT_STATUS,
          email: email,
          status: AccountStatus.ERROR,
        }),
      });
      logger.info(REFACTOR_CONSTANTS.LOG_REPORT_GAS_ERR.replace("{0}", email));
    }
  } catch (err) {
    logger.error(
      REFACTOR_CONSTANTS.LOG_REPORT_GAS_ERR_FAILED.replace("{0}", email),
      err,
    );
  }
}
