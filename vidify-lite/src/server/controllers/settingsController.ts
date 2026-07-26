import { Request, Response } from "express";
import _ from "lodash";
import { appError } from "../../lib/logger.js";
import { SecurityConstants, SecurityMessages, GasActions } from "../../constants/security.js";

export const getSettingsFromGAS = async (req: Request, res: Response) => {
  try {
    const licenseInfo = _.get(req, SecurityConstants.LICENSE_INFO_KEY, {});
    const licenseKey = _.get(licenseInfo, SecurityConstants.STORE_LICENSE_KEY, SecurityConstants.EMPTY_STRING);
    const planType = _.get(licenseInfo, SecurityConstants.PROP_PLAN_TYPE, SecurityConstants.EMPTY_STRING);

    const keysRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({ 
        action: GasActions.GET_API_KEYS, 
        license_key: licenseKey, 
        plan_id: planType, 
        plan_type: planType 
      })
    });
    const keysData: any = await keysRes.json();
    
    const accountsRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({ 
        action: GasActions.GET_ACCOUNTS, 
        license_key: licenseKey, 
        plan_id: planType, 
        plan_type: planType 
      })
    });
    const accountsData: any = await accountsRes.json();

    const keysErr = _.get(keysData, SecurityConstants.ERROR_KEY);
    const accsErr = _.get(accountsData, SecurityConstants.ERROR_KEY);

    if (_.some([keysErr, accsErr], (err) => !_.isEmpty(err))) {
      return res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: keysErr || accsErr });
    }

    res.json({ 
      success: true, 
      apiKeys: _.get(keysData, SecurityConstants.API_KEYS_KEY), 
      accounts: _.get(accountsData, SecurityConstants.ACCOUNTS_KEY) 
    });
  } catch (error: any) {
    appError(SecurityConstants.LOG_GET_SETTINGS_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.GAS_FETCH_ERROR) });
  }
};

export const saveApiKeys = async (req: Request, res: Response) => {
  try {
    const geminiKey = _.get(req.body, SecurityConstants.REQ_BODY_GEMINI_KEY);
    const ai33Key = _.get(req.body, SecurityConstants.REQ_BODY_AI33_KEY);

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({ action: GasActions.UPDATE_API_KEYS, geminiKey, ai33Key })
    });
    const data: any = await response.json();
    
    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ success: true, message: SecurityMessages.SAVE_API_KEYS_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_SAVE_API_KEYS_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.SAVE_API_KEYS_ERROR) });
  }
};

export const addGoogleAccount = async (req: Request, res: Response) => {
  try {
    const account = _.get(req.body, SecurityConstants.REQ_BODY_ACCOUNT);
    if (_.isEmpty(account)) return res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ error: SecurityMessages.MISSING_REQUEST_INFO });

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({ action: GasActions.ADD_ACCOUNT, account })
    });
    const data: any = await response.json();

    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ success: true, message: SecurityMessages.ADD_ACCOUNT_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_ADD_ACCOUNT_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.ADD_ACCOUNT_ERROR) });
  }
};

export const updateGoogleAccountStatus = async (req: Request, res: Response) => {
  try {
    const rowIndex = _.get(req.body, SecurityConstants.REQ_BODY_ROW_INDEX);
    const status = _.get(req.body, SecurityConstants.REQ_BODY_STATUS);
    if (_.isNil(rowIndex) || _.isEmpty(status)) return res.status(SecurityConstants.HTTP_BAD_REQUEST).json({ error: SecurityMessages.MISSING_REQUEST_INFO });

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: SecurityConstants.HTTP_POST,
      headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
      body: JSON.stringify({ action: GasActions.UPDATE_ACCOUNT_STATUS, rowIndex, status })
    });
    const data: any = await response.json();

    if (_.has(data, SecurityConstants.ERROR_KEY)) throw new Error(_.get(data, SecurityConstants.ERROR_KEY));
    res.json({ success: true, message: SecurityMessages.UPDATE_STATUS_SUCCESS });
  } catch (error: any) {
    appError(SecurityConstants.LOG_UPDATE_ACCOUNT_ERROR, error);
    res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: _.get(error, SecurityConstants.REQ_BODY_MESSAGE, SecurityMessages.UPDATE_ACCOUNT_ERROR) });
  }
};
