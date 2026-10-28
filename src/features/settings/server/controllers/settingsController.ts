import { Request, Response } from "express";
import _ from "lodash";
import { appError } from "../../../../lib/logger.js";
import { SecurityConstants, SecurityMessages, GasActions } from "../../../../constants/security.js";
import { jsonUtils } from "../../../../lib/json.js";
export const getSettingsFromGAS = async (req: Request, res: Response) => {
  try {
    const licenseInfo = _.get(req, SecurityConstants.LICENSE_INFO_KEY, SecurityConstants.EMPTY_OBJECT);
    const licenseKey = _.get(licenseInfo, SecurityConstants.STORE_LICENSE_KEY, SecurityConstants.EMPTY_STRING);
    const planType = _.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE, SecurityConstants.EMPTY_STRING);
    const keysRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: jsonUtils.safeStringify({ [SecurityConstants.PROP_ACTION]: GasActions.GET_API_KEYS, [SecurityConstants.PROP_LICENSE_KEY_GAS]: licenseKey, [SecurityConstants.PROP_PLAN_ID_GAS]: planType, [SecurityConstants.PROP_PLAN_TYPE_GAS]: planType }),
    });
    const keysData: any = await keysRes.json();
    const accountsRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: jsonUtils.safeStringify({ [SecurityConstants.PROP_ACTION]: GasActions.GET_ACCOUNTS, [SecurityConstants.PROP_LICENSE_KEY_GAS]: licenseKey, [SecurityConstants.PROP_PLAN_ID_GAS]: planType, [SecurityConstants.PROP_PLAN_TYPE_GAS]: planType }),
    });
    const accountsData: any = await accountsRes.json();
    const keysErr = _.get(keysData, SecurityConstants.ERROR_KEY);
    const accsErr = _.get(accountsData, SecurityConstants.ERROR_KEY);
    if (_.some([keysErr, accsErr], (err) => !_.isEmpty(err))) {
      return res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ [SecurityConstants.ERROR_KEY]: keysErr || accsErr });
    }
    res.json({ [SecurityConstants.SUCCESS_KEY]: true, [SecurityConstants.API_KEYS_KEY]: _.get(keysData, SecurityConstants.API_KEYS_KEY), [SecurityConstants.ACCOUNTS_KEY]: _.get(accountsData, SecurityConstants.ACCOUNTS_KEY) });
  } catch (error: any) {
    appError(SecurityConstants.LOG_GET_SETTINGS_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ [SecurityConstants.ERROR_KEY]: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.GAS_FETCH_ERROR) });
  }
};
export const saveApiKeys = async (req: Request, res: Response) => {
  try {
    const geminiKey = _.get(req.body, SecurityConstants.REQ_BODY_GEMINI_KEY);
    const cerebrasKey = _.get(req.body, SecurityConstants.REQ_BODY_CEREBRAS_KEY);
    const groqKey = _.get(req.body, SecurityConstants.REQ_BODY_GROQ_KEY);
    const ai33Key = _.get(req.body, SecurityConstants.REQ_BODY_AI33_KEY);
    const id = _.get(req.body, SecurityConstants.REQ_BODY_ID);
    const assignedTo = _.get(req.body, SecurityConstants.REQ_BODY_ASSIGNED_TO);
    const excludedTo = _.get(req.body, SecurityConstants.REQ_BODY_EXCLUDED_TO);
    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: jsonUtils.safeStringify({
        [SecurityConstants.PROP_ACTION]: GasActions.UPDATE_API_KEYS,
        [SecurityConstants.REQ_BODY_GEMINI_KEY]: geminiKey,
        [SecurityConstants.REQ_BODY_CEREBRAS_KEY]: cerebrasKey,
        [SecurityConstants.REQ_BODY_GROQ_KEY]: groqKey,
        [SecurityConstants.REQ_BODY_AI33_KEY]: ai33Key,
        [SecurityConstants.REQ_BODY_ID]: id,
        [SecurityConstants.REQ_BODY_ASSIGNED_TO]: assignedTo,
        [SecurityConstants.REQ_BODY_EXCLUDED_TO]: excludedTo,
      }),
    });
    const data: any = await response.json();
    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ [SecurityConstants.SUCCESS_KEY]: true, [SecurityConstants.REQ_BODY_MESSAGE]: SecurityMessages.SAVE_API_KEYS_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_SAVE_API_KEYS_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ [SecurityConstants.ERROR_KEY]: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.SAVE_API_KEYS_ERROR) });
  }
};
export const addGoogleAccount = async (req: Request, res: Response) => {
  try {
    const account = _.get(req.body, SecurityConstants.REQ_BODY_ACCOUNT);
    if (_.isEmpty(account)) return res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ [SecurityConstants.ERROR_KEY]: SecurityMessages.MISSING_REQUEST_INFO });
    const response = await fetch(SecurityConstants.GAS_API_URL, { method: SecurityConstants.HTTP_POST, headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON }, body: jsonUtils.safeStringify({ [SecurityConstants.PROP_ACTION]: GasActions.ADD_ACCOUNT, [SecurityConstants.REQ_BODY_ACCOUNT]: account }) });
    const data: any = await response.json();
    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ [SecurityConstants.SUCCESS_KEY]: true, [SecurityConstants.REQ_BODY_MESSAGE]: SecurityMessages.ADD_ACCOUNT_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_ADD_ACCOUNT_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ [SecurityConstants.ERROR_KEY]: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.ADD_ACCOUNT_ERROR) });
  }
};
export const updateGoogleAccountStatus = async (req: Request, res: Response) => {
  try {
    const rowIndex = _.get(req.body, SecurityConstants.REQ_BODY_ROW_INDEX);
    const status = _.get(req.body, SecurityConstants.REQ_BODY_STATUS);
    if (_.isNil(rowIndex) || _.isEmpty(status)) return res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ [SecurityConstants.ERROR_KEY]: SecurityMessages.MISSING_REQUEST_INFO });
    const response = await fetch(SecurityConstants.GAS_API_URL, { method: SecurityConstants.HTTP_POST, headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON }, body: jsonUtils.safeStringify({ [SecurityConstants.PROP_ACTION]: GasActions.UPDATE_ACCOUNT_STATUS, [SecurityConstants.REQ_BODY_ROW_INDEX]: rowIndex, [SecurityConstants.REQ_BODY_STATUS]: status }) });
    const data: any = await response.json();
    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ [SecurityConstants.SUCCESS_KEY]: true, [SecurityConstants.REQ_BODY_MESSAGE]: SecurityMessages.UPDATE_STATUS_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_UPDATE_ACCOUNT_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ [SecurityConstants.ERROR_KEY]: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.UPDATE_ACCOUNT_ERROR) });
  }
};
