import { Request, Response } from "express";
import fetch from "node-fetch";
import _ from "lodash";
import { appError } from "../../lib/logger.js";
import { SecurityConstants, SecurityMessages, GasActions } from "../../constants/security.js";
export const getSettingsFromGAS = async (req: Request, res: Response) => {
  try {
    const licenseInfo = (req as any).licenseInfo;
    const licenseKey = _.get(licenseInfo, 'license_key', "");
    const planType = _.get(licenseInfo, 'plan_type', "");

    const keysRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.GET_API_KEYS, license_key: licenseKey, plan_type: planType })
    });
    const keysData: any = await keysRes.json();
    
    const accountsRes = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.GET_ACCOUNTS, license_key: licenseKey, plan_type: planType })
    });
    const accountsData: any = await accountsRes.json();

    if (keysData.error || accountsData.error) {
      return res.status(500).json({ error: keysData.error || accountsData.error });
    }

    res.json({ 
      success: true, 
      apiKeys: keysData.apiKeys, 
      accounts: accountsData.accounts 
    });
  } catch (error: any) {
    appError("GET_SETTINGS_ERROR", error);
    res.status(500).json({ error: error.message || SecurityMessages.GAS_FETCH_ERROR });
  }
};

export const saveApiKeys = async (req: Request, res: Response) => {
  try {
    const { geminiKey, ai33Key } = req.body;

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.UPDATE_API_KEYS, geminiKey, ai33Key })
    });
    const data: any = await response.json();
    
    if (data.error) throw new Error(data.error);
    res.json({ success: true, message: SecurityMessages.SAVE_API_KEYS_SUCCESS });
  } catch (error: any) {
    appError("SAVE_API_KEYS_ERROR", error);
    res.status(500).json({ error: error.message || SecurityMessages.SAVE_API_KEYS_ERROR });
  }
};
export const addGoogleAccount = async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    if (_.isEmpty(account)) return res.status(400).json({ error: SecurityMessages.MISSING_REQUEST_INFO });

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.ADD_ACCOUNT, account })
    });
    const data: any = await response.json();

    if (data.error) throw new Error(data.error);
    res.json({ success: true, message: SecurityMessages.ADD_ACCOUNT_SUCCESS });
  } catch (error: any) {
    appError("ADD_ACCOUNT_ERROR", error);
    res.status(500).json({ error: error.message || SecurityMessages.ADD_ACCOUNT_ERROR });
  }
};
export const updateGoogleAccountStatus = async (req: Request, res: Response) => {
  try {
    const { rowIndex, status } = req.body;
    if (_.isNil(rowIndex) || _.isEmpty(status)) return res.status(400).json({ error: SecurityMessages.MISSING_REQUEST_INFO });

    const response = await fetch(SecurityConstants.GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: GasActions.UPDATE_ACCOUNT_STATUS, rowIndex, status })
    });
    const data: any = await response.json();

    if (data.error) throw new Error(data.error);
    res.json({ success: true, message: SecurityMessages.UPDATE_STATUS_SUCCESS });
  } catch (error: any) {
    appError("UPDATE_ACCOUNT_ERROR", error);
    res.status(500).json({ error: error.message || SecurityMessages.UPDATE_ACCOUNT_ERROR });
  }
};
