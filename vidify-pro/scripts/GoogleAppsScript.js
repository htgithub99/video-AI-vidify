const _ = {
  get: function (obj, path, def) {
    if (!obj) return def;
    const paths = String(path).split('.');
    let current = obj;
    for (let i = 0; i < paths.length; i++) {
      if (current === null || current === undefined) return def;
      current = current[paths[i]];
    }
    return current === undefined ? def : current;
  },
  isNil: function (val) { return val === null || val === undefined; },
  startsWith: function (str, pre) { return String(str).indexOf(pre) === 0; },
  findIndex: function (arr, fn) { for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return i; } return -1; },
  includes: function (arr, val) { return arr.indexOf(val) !== -1; },
  toInteger: function (val) { return parseInt(val, 10); },
  isArray: function (val) { return Array.isArray(val); },
  forEach: function (arr, fn) { for (let i = 0; i < arr.length; i++) fn(arr[i], i); },
  map: function (arr, fn) { const res = []; for (let i = 0; i < arr.length; i++) res.push(fn(arr[i], i)); return res; },
  filter: function (arr, fn) { const res = []; for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return res[i]; } return res; },
  find: function (arr, fn) { for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return arr[i]; } return undefined; },
  toUpper: function (str) { return String(str).toUpperCase(); },
  split: function (str, sep) { return String(str).split(sep); },
  some: function (arr, fn) { for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return true; } return false; },
  cloneDeep: function (obj) { return JSON.parse(JSON.stringify(obj)); },
  isEqual: function (a, b) { return a === b; },
  isEmpty: function (val) { return !val || val.length === 0; },
  eq: function (a, b) { return a === b; },
  orderBy: function (arr, keys, orders) {
    return arr.sort((a, b) => {
      const key = keys[0];
      const isDesc = orders[0] === 'desc';
      if (a[key] < b[key]) return isDesc ? 1 : -1;
      if (a[key] > b[key]) return isDesc ? -1 : 1;
      return 0;
    });
  },

  generateUUID: function () {
    return Utilities.getUuid();
  },

  getCurrentISO: function () {
    return new Date().toISOString();
  },

  validateClientLicense: function (licenseKey) {
    if (this.isEmpty(licenseKey)) return false;
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    if (!usersSheet) return false;
    const data = usersSheet.getDataRange().getValues();
    const cleanLicenseKey = String(licenseKey).trim();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(String(row[UserCols.LICENSE_KEY]).trim(), cleanLicenseKey));
    if (rowIndex > 0) {
      const status = String(data[rowIndex][UserCols.STATUS]).toLowerCase().trim();
      return this.isEqual(status, StatusEnum.ACTIVE.toLowerCase().trim());
    }
    return false;
  },

  doPost: function (e) {
    try {
      const contents = this.get(e, 'postData.contents');
      if (this.isNil(contents)) return this.jsonResponse({ error: Messages.MISSING_KEY, code: HttpCode.BAD_REQUEST });

      const params = JSON.parse(contents);
      const action = this.get(params, ApiFields.ACTION);

      const adminToken = this.get(params, ApiFields.ADMIN_TOKEN);
      const isAdminAction = this.startsWith(action, Constants.ADMIN_PREFIX);

      if (isAdminAction && !this.isEqual(action, AppActions.ADMIN_LOGIN)) {
        if (!this.validateAdminToken(adminToken)) {
          return this.jsonResponse({ error: Messages.INVALID_CREDENTIALS, code: HttpCode.UNAUTHORIZED });
        }

        if (this.isEqual(action, AppActions.ADMIN_GET_USERS)) return this.adminGetUsers();
        if (this.isEqual(action, AppActions.ADMIN_CREATE_KEY)) return this.adminCreateKey(params);
        if (this.isEqual(action, AppActions.ADMIN_REVOKE_KEY)) return this.adminRevokeKey(params);
        if (this.isEqual(action, AppActions.ADMIN_DELETE_KEY)) return this.adminDeleteKey(params);
        if (this.isEqual(action, AppActions.ADMIN_UPDATE_KEY)) return this.adminUpdateKey(params);
        if (this.isEqual(action, AppActions.ADMIN_RESET_DEVICE)) return this.adminResetDevice(params);
        if (this.isEqual(action, AppActions.ADMIN_GET_PLANS)) return this.adminGetPlans();
        if (this.isEqual(action, AppActions.ADMIN_CREATE_PLAN)) return this.adminCreatePlan(params);
        if (this.isEqual(action, AppActions.ADMIN_UPDATE_PLAN)) return this.adminUpdatePlan(params);
        if (this.isEqual(action, AppActions.ADMIN_DELETE_PLAN)) return this.adminDeletePlan(params);
        if (this.isEqual(action, AppActions.ADMIN_SYNC_EXPIRED)) return this.adminSyncExpired();

        if (this.isEqual(action, AppActions.ADMIN_GET_API_KEYS)) return this.adminGetApiKeys();
        if (this.isEqual(action, AppActions.ADMIN_UPDATE_API_KEYS)) return this.updateApiKeys(params);
        if (this.isEqual(action, AppActions.ADMIN_GET_ACCOUNTS)) return this.adminGetAccounts();
        if (this.isEqual(action, AppActions.ADMIN_ADD_ACCOUNT)) return this.addAccount(params);
        if (this.isEqual(action, AppActions.ADMIN_UPDATE_ACCOUNT)) return this.updateAccountAdmin(params);
        if (this.isEqual(action, AppActions.ADMIN_DELETE_ACCOUNT)) return this.deleteAccountAdmin(params);
        if (this.isEqual(action, AppActions.ADMIN_DELETE_API_KEYS)) return this.deleteApiKeysAdmin(params);
        if (this.isEqual(action, AppActions.ADMIN_UPDATE_ACCOUNT_STATUS)) return this.updateAccountStatus(params);
      }

      if (this.isEqual(action, AppActions.VERIFY_KEY)) return this.verifyKey(params);

      const licenseKey = this.get(params, ApiFields.LICENSE_KEY);
      if (!this.validateClientLicense(licenseKey)) {
        return this.jsonResponse({ error: Messages.INVALID_LICENSE_ERR, code: HttpCode.FORBIDDEN });
      }

      if (this.isEqual(action, AppActions.UPDATE_USAGE)) {
        const amount = this.toInteger(this.get(params, ApiFields.AMOUNT)) || Constants.DEFAULT_AMOUNT;
        if (amount <= Constants.ZERO) {
          return this.jsonResponse({ error: Messages.INVALID_AMOUNT_ERR, code: HttpCode.BAD_REQUEST });
        }
        return this.updateUsage(params);
      }

      if (this.isEqual(action, AppActions.GET_API_KEYS)) return this.getApiKeys(params);
      if (this.isEqual(action, AppActions.GET_ACCOUNTS)) return this.getAccounts(params);
      if (this.isEqual(action, AppActions.UPDATE_ACCOUNT_STATUS)) return this.updateAccountStatus(params);

      return this.jsonResponse({ error: Messages.INVALID_ACTION, code: HttpCode.BAD_REQUEST });
    } catch (error) {
      AppLogger.error(Messages.SERVER_ERROR, error);
      return this.jsonResponse({ error: error.toString(), code: HttpCode.INTERNAL_ERROR });
    }
  },

  doOptions: function (e) {
    return this.jsonResponse({ status: Messages.OPTIONS_OK });
  },

  doGet: function (e) {
    return this.jsonResponse({ status: Messages.GET_RUNNING });
  },

  verifyKey: function (params) {
    const adminKey = this.get(params, ApiFields.ADMIN_KEY);
    if (!this.isEqual(adminKey, this.getAppSecretKey())) return this.jsonResponse({ error: Messages.INVALID_ADMIN_KEY, code: HttpCode.FORBIDDEN });

    const key = this.get(params, ApiFields.LICENSE_KEY);
    const device = this.get(params, ApiFields.DEVICE_ID);

    if (this.isNil(key)) return this.jsonResponse({ error: Messages.MISSING_KEY, code: HttpCode.BAD_REQUEST });
    if (this.isNil(device)) return this.jsonResponse({ error: Messages.MISSING_DEVICE, code: HttpCode.BAD_REQUEST });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const data = usersSheet.getDataRange().getValues();
    const maxDevices = Config.MAX_DEVICES;

    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[UserCols.LICENSE_KEY], key));

    if (rowIndex > 0) {
      const row = data[rowIndex];
      const savedDeviceStr = row[UserCols.DEVICE_ID] || Constants.EMPTY_ARRAY;
      let savedDevices = [];

      try {
        savedDevices = JSON.parse(savedDeviceStr);
        if (!this.isArray(savedDevices)) savedDevices = [];
      } catch (e) {
        savedDevices = savedDeviceStr ? [savedDeviceStr] : [];
      }

      if (!this.includes(savedDevices, device)) {
        if (savedDevices.length < maxDevices) {
          savedDevices.push(device);
          usersSheet.getRange(rowIndex + 1, UserCols.DEVICE_ID + 1).setValue(JSON.stringify(savedDevices));
        } else {
          return this.jsonResponse({ error: `${Messages.DEVICE_LIMIT} (${maxDevices})`, code: HttpCode.FORBIDDEN });
        }
      }

      let currentStatus = row[UserCols.STATUS];
      const expiresAt = row[UserCols.EXPIRES_AT];

      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (new Date() > expiryDate) {
          usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.EXPIRED);
          currentStatus = StatusEnum.EXPIRED;
        }
      }

      const quotaType = row[UserCols.QUOTA_TYPE] || QuotaType.DAILY;
      let usage = this.getUsageData(key);

      if (this.isEqual(quotaType, QuotaType.DAILY)) {
        const today = this.getCurrentISO().split(Constants.DATE_SPLIT_CHAR)[0];
        const lastResetDate = String(usage.last_reset || Constants.EMPTY_STRING).split(Constants.DATE_SPLIT_CHAR)[0];
        if (!this.isEqual(lastResetDate, today)) {
          usage = { video: 0, image: 0, voice: 0, last_reset: this.getCurrentISO() };
        }
      }

      const planId = row[UserCols.PLAN_ID];
      const plan = this.getPlanById(planId);

      return this.jsonResponse({
        status: currentStatus,
        plan: plan,
        quota_type: quotaType,
        expires_at: expiresAt || null,
        usage: usage
      });
    }

    return this.jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  updateUsage: function (params) {
    const adminKey = this.get(params, ApiFields.ADMIN_KEY);
    if (!this.isEqual(adminKey, this.getAppSecretKey())) return this.jsonResponse({ error: Messages.INVALID_ADMIN_KEY, code: HttpCode.FORBIDDEN });

    const key = this.get(params, ApiFields.LICENSE_KEY);
    const feature = this.get(params, ApiFields.FEATURE);
    const amount = this.toInteger(this.get(params, ApiFields.AMOUNT)) || 1;

    if (this.isNil(key)) return this.jsonResponse({ error: Messages.MISSING_KEY });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const usersData = usersSheet.getDataRange().getValues();

    const isValid = this.some(usersData, (row, idx) => idx > 0 && this.isEqual(row[UserCols.LICENSE_KEY], key) && this.isEqual(row[UserCols.STATUS], StatusEnum.ACTIVE));
    if (!isValid) return this.jsonResponse({ error: Messages.KEY_REVOKED, code: HttpCode.FORBIDDEN });

    const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
    const data = usageSheet.getDataRange().getValues();
    const usageIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[UsageCols.LICENSE_KEY], key));

    if (usageIndex > 0) {
      const row = data[usageIndex];
      const userRow = this.find(usersData, (r, idx) => idx > 0 && this.isEqual(r[UserCols.LICENSE_KEY], key));
      const quotaType = userRow ? (userRow[UserCols.QUOTA_TYPE] || QuotaType.DAILY) : QuotaType.DAILY;
      const today = this.getCurrentISO().split(Constants.DATE_SPLIT_CHAR)[0];
      const lastResetDate = String(row[UsageCols.LAST_RESET] || Constants.EMPTY_STRING).split(Constants.DATE_SPLIT_CHAR)[0];

      let currentVideo = this.toInteger(row[UsageCols.VIDEO] || 0);
      let currentImage = this.toInteger(row[UsageCols.IMAGE] || 0);
      let currentVoice = this.toInteger(row[UsageCols.VOICE] || 0);

      if (this.isEqual(quotaType, QuotaType.DAILY) && !this.isEqual(lastResetDate, today)) {
        currentVideo = 0;
        currentImage = 0;
        currentVoice = 0;
        usageSheet.getRange(usageIndex + 1, UsageCols.LAST_RESET + 1).setValue(this.getCurrentISO());
      }

      if (this.isEqual(feature, FeatureEnum.VIDEO)) currentVideo += amount;
      if (this.isEqual(feature, FeatureEnum.IMAGE)) currentImage += amount;
      if (this.isEqual(feature, FeatureEnum.VOICE)) currentVoice += amount;

      usageSheet.getRange(usageIndex + 1, UsageCols.VIDEO + 1, 1, 3).setValues([[currentVideo, currentImage, currentVoice]]);
      usageSheet.getRange(usageIndex + 1, UsageCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
    } else {
      const now = this.getCurrentISO();
      const newRow = [this.generateUUID(), now, now, key, 0, 0, 0, now];
      if (this.isEqual(feature, FeatureEnum.VIDEO)) newRow[UsageCols.VIDEO] = amount;
      if (this.isEqual(feature, FeatureEnum.IMAGE)) newRow[UsageCols.IMAGE] = amount;
      if (this.isEqual(feature, FeatureEnum.VOICE)) newRow[UsageCols.VOICE] = amount;
      usageSheet.appendRow(newRow);
    }

    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  adminLogin: function (params) {
    const username = this.get(params, ApiFields.USERNAME);
    const password = this.get(params, ApiFields.PASSWORD);

    if (this.isNil(username) || this.isNil(password)) return this.jsonResponse({ error: Messages.MISSING_CREDENTIALS });

    const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
    if (!adminsSheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const data = adminsSheet.getDataRange().getValues();
    const adminIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[AdminCols.USERNAME], username) && this.isEqual(row[AdminCols.PASSWORD], password));

    if (adminIndex > 0) {
      const newToken = this.generateUUID();
      adminsSheet.getRange(adminIndex + 1, AdminCols.TOKEN + 1).setValue(newToken);
      adminsSheet.getRange(adminIndex + 1, AdminCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
      return this.jsonResponse({ status: Messages.RES_SUCCESS, token: newToken });
    }

    return this.jsonResponse({ error: Messages.INVALID_CREDENTIALS, code: HttpCode.UNAUTHORIZED });
  },

  validateAdminToken: function (token) {
    if (this.isNil(token)) return false;
    const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
    if (!adminsSheet) return false;

    const data = adminsSheet.getDataRange().getValues();
    return this.some(data, (row, idx) => idx > 0 && this.isEqual(row[AdminCols.TOKEN], token));
  },

  adminGetUsers: function () {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);

    const usersData = usersSheet.getDataRange().getValues();
    const usageData = usageSheet.getDataRange().getValues();

    const users = this.map(this.filter(usersData, (row, idx) => idx > 0), row => {
      const key = row[UserCols.LICENSE_KEY];
      const uRow = this.find(usageData, (u, i) => i > 0 && this.isEqual(u[UsageCols.LICENSE_KEY], key));

      return {
        id: row[UserCols.ID],
        username: row[UserCols.USERNAME],
        license_key: key,
        plan_id: row[UserCols.PLAN_ID],
        status: row[UserCols.STATUS],
        created_at: row[UserCols.CREATED_AT],
        updated_at: row[UserCols.UPDATED_AT],
        expires_at: row[UserCols.EXPIRES_AT],
        device_id: row[UserCols.DEVICE_ID],
        quota_type: row[UserCols.QUOTA_TYPE] || QuotaType.DAILY,
        usage: uRow ? {
          video: uRow[UsageCols.VIDEO] || 0,
          image: uRow[UsageCols.IMAGE] || 0,
          voice: uRow[UsageCols.VOICE] || 0,
          last_reset: uRow[UsageCols.LAST_RESET]
        } : { video: 0, image: 0, voice: 0, last_reset: Constants.EMPTY_STRING }
      };
    });

    return this.jsonResponse({ users: users });
  },

  getAppSecretKey: function () {
    try {
      const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_SETTINGS);
      if (settingsSheet) {
        const data = settingsSheet.getDataRange().getValues();
        const row = this.find(data, (r, idx) => idx > 0 && this.isEqual(r[SettingsCols.KEY], Constants.KEY_ADMIN_APP_KEY) && r[SettingsCols.VALUE]);
        if (row) return String(row[SettingsCols.VALUE]).trim();
      }
    } catch (e) {
      AppLogger.error('Error in getAppSecretKey', e);
    }
    return Constants.MASTER_KEY_FALLBACK;
  },

  adminCreateKey: function (params) {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const username = this.get(params, ApiFields.USERNAME, Constants.UNKNOWN);
    const planId = this.get(params, ApiFields.PLAN_ID);
    const quotaType = this.get(params, ApiFields.QUOTA_TYPE, QuotaType.DAILY);

    const generateSecureKey = () => {
      const uuid = Utilities.getUuid().replace(/-/g, '');
      const payload = uuid.substring(0, 20).toUpperCase();
      const secretKey = this.getAppSecretKey();
      const signatureBytes = Utilities.computeHmacSha256Signature(payload, secretKey);
      const signatureHex = signatureBytes.map(byte => {
        const v = (byte < 0 ? byte + 256 : byte).toString(16);
        return v.length === 1 ? '0' + v : v;
      }).join('').toUpperCase();
      const checksum = signatureHex.substring(0, 5);
      const finalKey = payload + checksum;
      return finalKey.match(/.{1,5}/g).join('-');
    };
    const newKey = generateSecureKey();

    const now = this.getCurrentISO();
    usersSheet.appendRow([this.generateUUID(), now, now, username, newKey, planId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, quotaType]);

    return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_CREATED, license_key: newKey });
  },

  adminRevokeKey: function (params) {
    const id = this.get(params, ApiFields.ID);
    if (this.isNil(id)) return this.jsonResponse({ error: Messages.MISSING_ID });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const data = usersSheet.getDataRange().getValues();

    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[UserCols.ID], id));
    if (rowIndex > 0) {
      usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.REVOKED);
      return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_REVOKED });
    }

    return this.jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  adminDeleteKey: function (params) {
    const id = this.get(params, ApiFields.ID);
    if (this.isNil(id)) return this.jsonResponse({ error: Messages.MISSING_ID });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);

    const usersData = usersSheet.getDataRange().getValues();
    const rowIndex = this.findIndex(usersData, (row, idx) => idx > 0 && this.isEqual(row[UserCols.ID], id));

    if (rowIndex > 0) {
      const licenseKey = usersData[rowIndex][UserCols.LICENSE_KEY];
      usersSheet.deleteRow(rowIndex + 1);

      const usageData = usageSheet.getDataRange().getValues();
      const usageIndex = this.findIndex(usageData, (row, idx) => idx > 0 && this.isEqual(row[UsageCols.LICENSE_KEY], licenseKey));
      if (usageIndex > 0) usageSheet.deleteRow(usageIndex + 1);
    }

    return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_DELETED });
  },

  adminUpdateKey: function (params) {
    const id = this.get(params, ApiFields.ID);
    const newPlanId = this.get(params, ApiFields.PLAN_ID);
    const newExpires = this.get(params, ApiFields.EXPIRES_AT);
    const newStatus = this.get(params, ApiFields.STATUS);
    const newQuotaType = this.get(params, ApiFields.QUOTA_TYPE);

    if (this.isNil(id)) return this.jsonResponse({ error: Messages.MISSING_ID });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const data = usersSheet.getDataRange().getValues();

    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[UserCols.ID], id));
    if (rowIndex > 0) {
      if (newPlanId) usersSheet.getRange(rowIndex + 1, UserCols.PLAN_ID + 1).setValue(newPlanId);
      if (newQuotaType) usersSheet.getRange(rowIndex + 1, UserCols.QUOTA_TYPE + 1).setValue(newQuotaType);
      usersSheet.getRange(rowIndex + 1, UserCols.EXPIRES_AT + 1).setValue(newExpires || Constants.EMPTY_STRING);

      if (newStatus) {
        usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(newStatus);
      } else if (this.isEqual(data[rowIndex][UserCols.STATUS], StatusEnum.EXPIRED)) {
        usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.ACTIVE);
      }

      usersSheet.getRange(rowIndex + 1, UserCols.UPDATED_AT + 1).setValue(this.getCurrentISO());

      return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_UPDATED });
    }

    return this.jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  adminResetDevice: function (params) {
    const id = this.get(params, ApiFields.ID);
    if (this.isNil(id)) return this.jsonResponse({ error: Messages.MISSING_ID });

    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    const data = usersSheet.getDataRange().getValues();

    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[UserCols.ID], id));
    if (rowIndex > 0) {
      usersSheet.getRange(rowIndex + 1, UserCols.DEVICE_ID + 1).setValue(Constants.EMPTY_ARRAY);
      return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_RESET });
    }

    return this.jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  adminGetPlans: function () {
    return this.jsonResponse({ plans: this.getPlans() });
  },

  adminUpdatePlan: function (params) {
    const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
    if (!plansSheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const planId = this.get(params, ApiFields.ID);
    if (this.isNil(planId)) return this.jsonResponse({ error: Messages.MISSING_ID });

    const data = plansSheet.getDataRange().getValues();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[PlanCols.ID], planId));

    if (rowIndex > 0) {
      const now = this.getCurrentISO();
      if (!this.isNil(params[ApiFields.NAME])) plansSheet.getRange(rowIndex + 1, PlanCols.NAME + 1).setValue(params[ApiFields.NAME]);
      if (!this.isNil(params[ApiFields.QUOTA_VIDEO])) plansSheet.getRange(rowIndex + 1, PlanCols.VIDEO + 1).setValue(params[ApiFields.QUOTA_VIDEO]);
      if (!this.isNil(params[ApiFields.QUOTA_IMAGE])) plansSheet.getRange(rowIndex + 1, PlanCols.IMAGE + 1).setValue(params[ApiFields.QUOTA_IMAGE]);
      if (!this.isNil(params[ApiFields.QUOTA_VOICE])) plansSheet.getRange(rowIndex + 1, PlanCols.VOICE + 1).setValue(params[ApiFields.QUOTA_VOICE]);
      if (!this.isNil(params[ApiFields.IS_UNLIMITED])) plansSheet.getRange(rowIndex + 1, PlanCols.UNLIMITED + 1).setValue(params[ApiFields.IS_UNLIMITED]);

      plansSheet.getRange(rowIndex + 1, PlanCols.UPDATED_AT + 1).setValue(now);
      return this.jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_UPDATED });
    }

    return this.jsonResponse({ error: Messages.PLAN_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  adminCreatePlan: function (params) {
    const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
    if (!plansSheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const now = this.getCurrentISO();
    const newId = this.generateUUID();
    const name = this.get(params, ApiFields.NAME, Constants.NEW_PLAN_NAME);
    const video = this.toInteger(this.get(params, ApiFields.QUOTA_VIDEO)) || 0;
    const image = this.toInteger(this.get(params, ApiFields.QUOTA_IMAGE)) || 0;
    const voice = this.toInteger(this.get(params, ApiFields.QUOTA_VOICE)) || 0;
    const unlimited = this.get(params, ApiFields.IS_UNLIMITED, false);

    plansSheet.appendRow([newId, now, now, name, video, image, voice, unlimited, Constants.ACTIVE_LOWER]);
    return this.jsonResponse({ status: Messages.RES_SUCCESS, plan_id: newId });
  },

  adminDeletePlan: function (params) {
    const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
    if (!plansSheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const planId = this.get(params, ApiFields.ID);
    const deleteType = this.get(params, ApiFields.DELETE_TYPE, Constants.DELETE_HARD);
    if (!planId) return this.jsonResponse({ error: Messages.MISSING_ID });

    const data = plansSheet.getDataRange().getValues();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[PlanCols.ID], planId));

    if (rowIndex > 0) {
      if (this.isEqual(deleteType, Constants.DELETE_SOFT)) {
        plansSheet.getRange(rowIndex + 1, PlanCols.STATUS + 1).setValue(StatusEnum.REVOKED);
        plansSheet.getRange(rowIndex + 1, PlanCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
      } else {
        plansSheet.deleteRow(rowIndex + 1);
      }
      return this.jsonResponse({ status: Messages.RES_SUCCESS });
    }

    return this.jsonResponse({ error: Messages.PLAN_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  adminSyncExpired: function () {
    const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
    if (!usersSheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const data = usersSheet.getDataRange().getValues();
    const now = new Date();

    let synced = 0;
    this.forEach(data, (row, idx) => {
      if (idx > 0 && row[UserCols.EXPIRES_AT]) {
        const expiry = new Date(row[UserCols.EXPIRES_AT]);
        if (now > expiry && this.isEqual(row[UserCols.STATUS], StatusEnum.ACTIVE)) {
          usersSheet.getRange(idx + 1, UserCols.STATUS + 1).setValue(StatusEnum.EXPIRED);
          synced++;
        }
      }
    });

    return this.jsonResponse({ status: Messages.RES_SUCCESS, message: `Đã đồng bộ ${synced} tài khoản hết hạn` });
  },

  getPlans: function () {
    const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
    if (!plansSheet) return [];

    const data = plansSheet.getDataRange().getValues();
    return this.map(this.filter(data, (row, idx) => idx > 0), row => ({
      id: row[PlanCols.ID],
      name: row[PlanCols.NAME],
      quota_video: this.toInteger(row[PlanCols.VIDEO]) || 0,
      quota_image: this.toInteger(row[PlanCols.IMAGE]) || 0,
      quota_voice: this.toInteger(row[PlanCols.VOICE]) || 0,
      is_unlimited: this.isEqual(String(row[PlanCols.UNLIMITED]), Constants.STRING_TRUE),
      status: row[PlanCols.STATUS] || Constants.ACTIVE_LOWER,
      created_at: row[PlanCols.CREATED_AT],
      updated_at: row[PlanCols.UPDATED_AT]
    }));
  },

  getPlanById: function (planId) {
    const plans = this.getPlans();
    return this.find(plans, p => this.isEqual(p.id, planId)) || {
      id: planId, name: Constants.UNKNOWN, quota_video: 0, quota_image: 0, quota_voice: 0, is_unlimited: false
    };
  },

  getUsageData: function (key) {
    const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
    if (!usageSheet) return { video: 0, image: 0, voice: 0, last_reset: Constants.EMPTY_STRING };

    const data = usageSheet.getDataRange().getValues();
    const usageRow = this.find(data, (row, idx) => idx > 0 && this.isEqual(row[UsageCols.LICENSE_KEY], key));

    if (usageRow) {
      return {
        video: usageRow[UsageCols.VIDEO] || 0,
        image: usageRow[UsageCols.IMAGE] || 0,
        voice: usageRow[UsageCols.VOICE] || 0,
        last_reset: usageRow[UsageCols.LAST_RESET]
      };
    }
    return { video: 0, image: 0, voice: 0, last_reset: Constants.EMPTY_STRING };
  },

  jsonResponse: function (data) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  },

  matchAssignedTo: function (rowAssignedTo, licenseKey, planId) {
    if (!rowAssignedTo) return false;
    if (this.isEqual(rowAssignedTo, Constants.ALL)) return true;
    if (planId && this.isEqual(rowAssignedTo, planId)) return true;
    if (licenseKey && this.isEqual(rowAssignedTo, licenseKey)) return true;
    return false;
  },

  getApiKeys: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const licenseKey = this.get(params, ApiFields.LICENSE_KEY, Constants.EMPTY_STRING);
    const planId = this.get(params, ApiFields.PLAN_ID, this.get(params, ApiFields.PLAN_TYPE_GAS, Constants.EMPTY_STRING));

    const data = sheet.getDataRange().getValues();
    let geminiKey = Constants.EMPTY_STRING;
    let ai33Key = Constants.EMPTY_STRING;
    let geminiPriority = -1;
    let ai33Priority = -1;

    const getPriority = (assigned) => {
      if (!assigned) return -1;
      const items = this.map(String(assigned).split(','), item => item.trim());

      if (!this.isEmpty(licenseKey) && this.includes(items, licenseKey)) return 2;

      const hasPlanMatch = this.some(items, (item) => {
        if (!item) return false;
        return this.isEqual(item, planId);
      });
      if (hasPlanMatch) return 1;

      const isAll = this.some(items, item => this.isEqual(item.toUpperCase(), Constants.ALL.toUpperCase()));
      if (isAll) return 0;

      return -1;
    };

    this.forEach(data, (row, i) => {
      if (this.isEqual(i, 0)) return;

      const excluded = row[KeysCols.EXCLUDED_TO] || "";
      if (excluded) {
        const isExcluded = this.some(String(excluded).split(','), (item) => {
          const trimmed = String(item).trim();
          if (!trimmed) return false;
          if (this.isEqual(trimmed, licenseKey) || this.isEqual(trimmed, planId)) return true;

          return false;
        });
        if (isExcluded) return;
      }

      const assigned = row[KeysCols.ASSIGNED_TO] || Constants.ALL;
      const prio = getPriority(assigned);

      if (prio !== -1) {
        if (row[KeysCols.GEMINI_KEY] && prio >= geminiPriority) {
          geminiKey = row[KeysCols.GEMINI_KEY];
          geminiPriority = prio;
        }
        if (row[KeysCols.AI33_KEY] && prio >= ai33Priority) {
          ai33Key = row[KeysCols.AI33_KEY];
          ai33Priority = prio;
        }
      }
    });

    return this.jsonResponse({ apiKeys: { geminiKey, ai33Key } });
  },

  adminGetApiKeys: function () {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const data = sheet.getDataRange().getValues();
    const keys = this.map(this.filter(data, (row, idx) => idx > 0), row => ({
      id: row[KeysCols.ID] || Constants.EMPTY_STRING,
      assignedTo: row[KeysCols.ASSIGNED_TO] || Constants.ALL,
      geminiKey: row[KeysCols.GEMINI_KEY] || Constants.EMPTY_STRING,
      ai33Key: row[KeysCols.AI33_KEY] || Constants.EMPTY_STRING,
      status: row[KeysCols.STATUS] || Constants.ACTIVE_LOWER,
      createdAt: row[KeysCols.CREATED_AT] || Constants.EMPTY_STRING,
      updatedAt: row[KeysCols.UPDATED_AT] || Constants.EMPTY_STRING,
      excludedTo: row[KeysCols.EXCLUDED_TO] || Constants.EMPTY_STRING
    }));

    return this.jsonResponse({ keys });
  },

  updateApiKeys: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const id = this.get(params, ApiFields.ID);
    const geminiKey = this.get(params, ApiFields.GEMINI_KEY);
    const ai33Key = this.get(params, ApiFields.AI33_KEY);
    const assignedTo = this.get(params, ApiFields.ASSIGNED_TO, Constants.ALL);
    const excludedTo = this.get(params, ApiFields.EXCLUDED_TO, Constants.EMPTY_STRING);
    const data = sheet.getDataRange().getValues();
    const now = this.getCurrentISO();

    if (id) {
      const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[KeysCols.ID], id));
      if (rowIndex > 0) {
        sheet.getRange(rowIndex + 1, KeysCols.ASSIGNED_TO + 1).setValue(assignedTo);
        sheet.getRange(rowIndex + 1, KeysCols.GEMINI_KEY + 1).setValue(geminiKey || Constants.EMPTY_STRING);
        sheet.getRange(rowIndex + 1, KeysCols.AI33_KEY + 1).setValue(ai33Key || Constants.EMPTY_STRING);
        sheet.getRange(rowIndex + 1, KeysCols.UPDATED_AT + 1).setValue(now);
        sheet.getRange(rowIndex + 1, KeysCols.EXCLUDED_TO + 1).setValue(excludedTo || Constants.EMPTY_STRING);
        return this.jsonResponse({ status: Messages.RES_SUCCESS });
      }
    }

    sheet.appendRow([this.generateUUID(), now, now, assignedTo, geminiKey || Constants.EMPTY_STRING, ai33Key || Constants.EMPTY_STRING, Constants.ACTIVE_LOWER, excludedTo || Constants.EMPTY_STRING]);
    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  deleteApiKeysAdmin: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const id = this.get(params, ApiFields.ID);
    const deleteType = this.get(params, ApiFields.DELETE_TYPE, Constants.DELETE_HARD);
    if (!id) return this.jsonResponse({ error: Messages.MISSING_ID, code: HttpCode.BAD_REQUEST });

    const data = sheet.getDataRange().getValues();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[KeysCols.ID], id));
    if (rowIndex > 0) {
      if (this.isEqual(deleteType, Constants.DELETE_SOFT)) {
        sheet.getRange(rowIndex + 1, KeysCols.STATUS + 1).setValue(StatusEnum.REVOKED);
        sheet.getRange(rowIndex + 1, KeysCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
      } else {
        sheet.deleteRow(rowIndex + 1);
      }
    }

    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  getAccounts: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const licenseKey = this.get(params, ApiFields.LICENSE_KEY, Constants.EMPTY_STRING);
    const planId = this.get(params, ApiFields.PLAN_ID, this.get(params, ApiFields.PLAN_TYPE_GAS, Constants.EMPTY_STRING));

    const data = sheet.getDataRange().getValues();
    let accounts = [];

    const getAccountPriority = (assigned) => {
      if (!assigned) return -1;
      const items = this.map(String(assigned).split(','), item => item.trim());
      if (!this.isEmpty(licenseKey) && this.includes(items, licenseKey)) return 2;
      if (!this.isEmpty(planId) && (this.includes(items, planId) || this.some(items, item => this.isEqual(this.getPlanById(item).name, planId)))) return 1;
      if (this.includes(items, Constants.ALL)) return 0;
      return -1;
    };

    this.forEach(data, (row, i) => {
      if (this.isEqual(i, 0)) return;
      const assigned = row[AccountsCols.ASSIGNED_TO] || Constants.ALL;
      const prio = getAccountPriority(assigned);
      if (!this.isEqual(prio, -1)) {
        accounts.push({
          id: i,
          email: row[AccountsCols.EMAIL] || Constants.EMPTY_STRING,
          password: row[AccountsCols.PASSWORD] || Constants.EMPTY_STRING,
          recoveryEmail: row[AccountsCols.RECOVERY_EMAIL] || Constants.EMPTY_STRING,
          status: row[AccountsCols.STATUS] || Constants.ACTIVE_LOWER,
          assignedTo: assigned,
          priority: prio
        });
      }
    });

    accounts = this.orderBy(accounts, ['priority'], ['desc']);
    return this.jsonResponse({ accounts });
  },

  adminGetAccounts: function () {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const data = sheet.getDataRange().getValues();
    const accounts = this.map(this.filter(data, (row, idx) => idx > 0), row => ({
      id: row[AccountsCols.ID] || Constants.EMPTY_STRING,
      email: row[AccountsCols.EMAIL] || Constants.EMPTY_STRING,
      password: row[AccountsCols.PASSWORD] || Constants.EMPTY_STRING,
      recoveryEmail: row[AccountsCols.RECOVERY_EMAIL] || Constants.EMPTY_STRING,
      status: row[AccountsCols.STATUS] || Constants.ACTIVE_LOWER,
      assignedTo: row[AccountsCols.ASSIGNED_TO] || Constants.ALL,
      createdAt: row[AccountsCols.CREATED_AT] || Constants.EMPTY_STRING,
      updatedAt: row[AccountsCols.UPDATED_AT] || Constants.EMPTY_STRING
    }));

    return this.jsonResponse({ accounts });
  },

  addAccount: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const acc = this.get(params, ApiFields.ACCOUNT);
    if (this.isNil(acc) || this.isNil(this.get(acc, ApiFields.EMAIL))) return this.jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

    const now = this.getCurrentISO();
    sheet.appendRow([
      this.generateUUID(),
      now,
      now,
      this.get(acc, ApiFields.EMAIL),
      this.get(acc, ApiFields.PASSWORD, Constants.EMPTY_STRING),
      this.get(acc, ApiFields.RECOVERY_EMAIL, Constants.EMPTY_STRING),
      this.get(acc, ApiFields.STATUS, Constants.ACTIVE_LOWER),
      this.get(acc, ApiFields.ASSIGNED_TO, Constants.ALL)
    ]);
    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  updateAccountStatus: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const rowIndex = this.get(params, ApiFields.ROW_INDEX_CAMEL);
    const status = this.get(params, ApiFields.STATUS);

    if (this.isNil(rowIndex) || this.isNil(status)) return this.jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

    sheet.getRange(rowIndex + 1, AccountsCols.STATUS + 1).setValue(status);
    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  updateAccountAdmin: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const acc = this.get(params, ApiFields.ACCOUNT);
    if (this.isNil(acc) || this.isNil(this.get(acc, ApiFields.ID)) || this.isNil(this.get(acc, ApiFields.EMAIL))) return this.jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

    const data = sheet.getDataRange().getValues();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[AccountsCols.ID], this.get(acc, ApiFields.ID)));

    if (rowIndex > 0) {
      sheet.getRange(rowIndex + 1, AccountsCols.EMAIL + 1).setValue(this.get(acc, ApiFields.EMAIL));
      sheet.getRange(rowIndex + 1, AccountsCols.PASSWORD + 1).setValue(this.get(acc, ApiFields.PASSWORD, Constants.EMPTY_STRING));
      sheet.getRange(rowIndex + 1, AccountsCols.RECOVERY_EMAIL + 1).setValue(this.get(acc, ApiFields.RECOVERY_EMAIL, Constants.EMPTY_STRING));
      sheet.getRange(rowIndex + 1, AccountsCols.ASSIGNED_TO + 1).setValue(this.get(acc, ApiFields.ASSIGNED_TO, Constants.ALL));
      sheet.getRange(rowIndex + 1, AccountsCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
      return this.jsonResponse({ status: Messages.RES_SUCCESS });
    }

    return this.jsonResponse({ error: Messages.ACCOUNT_NOT_FOUND, code: HttpCode.NOT_FOUND });
  },

  deleteAccountAdmin: function (params) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
    if (!sheet) return this.jsonResponse({ error: Messages.SHEET_NOT_FOUND });

    const id = this.get(params, ApiFields.ID);
    const deleteType = this.get(params, ApiFields.DELETE_TYPE, Constants.DELETE_HARD);
    if (this.isNil(id)) return this.jsonResponse({ error: Messages.MISSING_ID, code: HttpCode.BAD_REQUEST });

    const data = sheet.getDataRange().getValues();
    const rowIndex = this.findIndex(data, (row, idx) => idx > 0 && this.isEqual(row[AccountsCols.ID], id));
    if (rowIndex > 0) {
      if (this.isEqual(deleteType, Constants.DELETE_SOFT)) {
        sheet.getRange(rowIndex + 1, AccountsCols.STATUS + 1).setValue(StatusEnum.REVOKED);
        sheet.getRange(rowIndex + 1, AccountsCols.UPDATED_AT + 1).setValue(this.getCurrentISO());
      } else {
        sheet.deleteRow(rowIndex + 1);
      }
    }

    return this.jsonResponse({ status: Messages.RES_SUCCESS });
  },

  setupSeedData: function () {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const now = this.getCurrentISO();
    const freeId = this.generateUUID();
    const proId = this.generateUUID();
    const lifetimeId = this.generateUUID();

    const initSheet = (name, headers, color, columnWidths = []) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
      } else {
        sheet.clear();
      }
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground(color);
      columnWidths.forEach((width, idx) => {
        if (width) sheet.setColumnWidth(idx + 1, width);
      });
      return sheet;
    };

    const adminSheet = initSheet(Config.SHEET_ADMINS, Config.HEADERS.ADMINS, Constants.COLOR_ADMIN);
    adminSheet.appendRow([this.generateUUID(), now, now, "admin", "admin", Constants.EMPTY_STRING]);

    const plansSheet = initSheet(Config.SHEET_PLANS, Config.HEADERS.PLANS, Constants.COLOR_CONFIG);
    plansSheet.appendRow([freeId, now, now, "FREE", 3, 10, 5000, false, StatusEnum.ACTIVE]);
    plansSheet.appendRow([proId, now, now, "PRO", 50, 500, 100000, false, StatusEnum.ACTIVE]);
    plansSheet.appendRow([lifetimeId, now, now, "PRO_LIFETIME", 50, 500, 100000, true, StatusEnum.ACTIVE]);

    const usersSheet = initSheet(Config.SHEET_USERS, Config.HEADERS.USERS, Constants.COLOR_USERS);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    usersSheet.appendRow([this.generateUUID(), now, now, "Khách FREE", "FREE-12345", freeId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, QuotaType.DAILY]);
    usersSheet.appendRow([this.generateUUID(), now, now, "Khách PRO", "PRO-99999", proId, StatusEnum.ACTIVE, nextYear.toISOString(), Constants.EMPTY_ARRAY, QuotaType.DAILY]);
    usersSheet.appendRow([this.generateUUID(), now, now, "Khách VIP", "PRO-LIFE", lifetimeId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, QuotaType.TOTAL]);

    const usageSheet = initSheet(Config.SHEET_USAGE, Config.HEADERS.USAGE, Constants.COLOR_USAGE);
    usageSheet.appendRow([this.generateUUID(), now, now, "FREE-12345", 0, 0, 0, now]);
    usageSheet.appendRow([this.generateUUID(), now, now, "PRO-99999", 5, 20, 1000, now]);
    usageSheet.appendRow([this.generateUUID(), now, now, "PRO-LIFE", 10, 50, 5000, now]);

    const keysSheet = initSheet(Config.SHEET_KEYS, Config.HEADERS.KEYS, Constants.COLOR_ADMIN);
    keysSheet.appendRow([this.generateUUID(), now, now, Constants.ALL, Constants.EMPTY_STRING, Constants.EMPTY_STRING, StatusEnum.ACTIVE, Constants.EMPTY_STRING]);

    const accountsSheet = initSheet(Config.SHEET_ACCOUNTS, Config.HEADERS.ACCOUNTS, Constants.COLOR_CONFIG);
    accountsSheet.appendRow([this.generateUUID(), now, now, "sample@gmail.com", "password123", Constants.EMPTY_STRING, StatusEnum.ACTIVE, Constants.ALL]);

    const settingsSheet = initSheet(Config.SHEET_SETTINGS, Config.HEADERS.SETTINGS, Constants.COLOR_SEED_SETTINGS, [null, null, null, 200, 300, 350]);
    settingsSheet.appendRow([this.generateUUID(), now, now, "ADMIN_APP_KEY", "VIDIFY_MASTER_KEY_XYZ_123", "Khóa bảo mật Admin (Xác thực API & Băm Key)"]);

    AppLogger.info(Messages.SEED_SUCCESS);
  }
};

const UserCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, USERNAME: 3, LICENSE_KEY: 4, PLAN_ID: 5, STATUS: 6, EXPIRES_AT: 7, DEVICE_ID: 8, QUOTA_TYPE: 9 };
const UsageCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, LICENSE_KEY: 3, VIDEO: 4, IMAGE: 5, VOICE: 6, LAST_RESET: 7 };
const PlanCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, NAME: 3, VIDEO: 4, IMAGE: 5, VOICE: 6, UNLIMITED: 7, STATUS: 8 };
const AdminCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, USERNAME: 3, PASSWORD: 4, TOKEN: 5 };
const HttpCode = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INTERNAL_ERROR: 500 };
const KeysCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, ASSIGNED_TO: 3, GEMINI_KEY: 4, AI33_KEY: 5, STATUS: 6, EXCLUDED_TO: 7 };
const AccountsCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, EMAIL: 3, PASSWORD: 4, RECOVERY_EMAIL: 5, STATUS: 6, ASSIGNED_TO: 7 };
const SettingsCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, KEY: 3, VALUE: 4, DESCRIPTION: 5 };

const Config = {
  SHEET_USERS: "users",
  SHEET_USAGE: "usage",
  SHEET_PLANS: "plans",
  SHEET_ADMINS: "admins",
  SHEET_KEYS: "keys",
  SHEET_ACCOUNTS: "accounts",
  SHEET_SETTINGS: "settings",
  HEADERS: {
    ADMINS: ["ID", "CREATED_AT", "UPDATED_AT", "USERNAME", "PASSWORD", "TOKEN"],
    PLANS: ["ID", "CREATED_AT", "UPDATED_AT", "NAME", "QUOTA_VIDEO", "QUOTA_IMAGE", "QUOTA_VOICE", "IS_UNLIMITED", "STATUS"],
    USERS: ["ID", "CREATED_AT", "UPDATED_AT", "USERNAME", "LICENSE_KEY", "PLAN_ID", "STATUS", "EXPIRES_AT", "DEVICE_ID", "QUOTA_TYPE"],
    USAGE: ["ID", "CREATED_AT", "UPDATED_AT", "LICENSE_KEY", "VIDEO_COUNT", "IMAGE_COUNT", "VOICE_CHARS", "LAST_RESET"],
    KEYS: ["ID", "CREATED_AT", "UPDATED_AT", "ASSIGNED_TO", "GEMINI_KEY", "AI33_KEY", "STATUS", "EXCLUDED_TO"],
    ACCOUNTS: ["ID", "CREATED_AT", "UPDATED_AT", "EMAIL", "PASSWORD", "RECOVERY_EMAIL", "STATUS", "ASSIGNED_TO"],
    SETTINGS: ["ID", "CREATED_AT", "UPDATED_AT", "KEY", "VALUE", "DESCRIPTION"]
  },
  MAX_DEVICES: 2
};

const StatusEnum = {
  ACTIVE: "Active",
  REVOKED: "Revoked",
  EXPIRED: "Expired"
};

const QuotaType = {
  DAILY: "DAILY",
  TOTAL: "TOTAL"
};

const FeatureEnum = {
  VIDEO: "video",
  IMAGE: "image",
  VOICE: "voice"
};

const Constants = {
  EMPTY_STRING: "",
  EMPTY_ARRAY: "[]",
  STRING_TRUE: "true",
  ACTIVE_LOWER: "Active",
  ALL: "ALL",
  UNKNOWN: "Unknown",
  DATE_SPLIT_CHAR: "T",
  COLOR_ADMIN: "#dbeafe",
  COLOR_CONFIG: "#e0e7ff",
  COLOR_USERS: "#dcfce7",
  COLOR_USAGE: "#fef3c7",
  NEW_PLAN_NAME: "New Plan",
  ZERO: 0,
  DEFAULT_AMOUNT: 1,
  ADMIN_PREFIX: "admin_",
  DELETE_HARD: "hard",
  DELETE_SOFT: "soft",
  KEY_ADMIN_APP_KEY: "ADMIN_APP_KEY",
  MASTER_KEY_FALLBACK: "VIDIFY_MASTER_KEY_XYZ_123",
  COLOR_SEED_SETTINGS: "#f3f4f6"
};

const Messages = {
  MISSING_KEY: "Vui lòng cung cấp mã kích hoạt.",
  MISSING_DEVICE: "Không tìm thấy thông tin nhận diện thiết bị.",
  KEY_NOT_FOUND: "Mã kích hoạt không hợp lệ.",
  KEY_REVOKED: "Mã kích hoạt đã bị khóa hoặc hết hạn.",
  DEVICE_LIMIT: "Mã kích hoạt đã đạt giới hạn thiết bị tối đa.",
  INVALID_ACTION: "Yêu cầu không được hỗ trợ.",
  SERVER_ERROR: "Đã xảy ra sự cố trên hệ thống. Vui lòng quay lại sau.",
  RES_SUCCESS: "success",
  OPTIONS_OK: "OK",
  GET_RUNNING: "Hệ thống máy chủ hoạt động ổn định.",
  MISSING_ID: "Không tìm thấy thông tin định danh.",
  MISSING_CREDENTIALS: "Vui lòng nhập tài khoản và mật khẩu.",
  INVALID_CREDENTIALS: "Tài khoản hoặc mật khẩu không chính xác.",
  SHEET_NOT_FOUND: "Không thể kết nối đến cơ sở lưu trữ.",
  PLAN_NOT_FOUND: "Gói tài khoản không tồn tại.",
  SUCCESS_CREATED: "Khởi tạo thành công.",
  SUCCESS_UPDATED: "Lưu thay đổi thành công.",
  SUCCESS_DELETED: "Đã gỡ bỏ dữ liệu.",
  SUCCESS_REVOKED: "Đã khóa bản quyền thành công.",
  SUCCESS_RESET: "Đã đặt lại danh sách thiết bị thành công.",
  SEED_SUCCESS: "Khởi tạo dữ liệu hệ thống thành công.",
  MISSING_ACCOUNT_INFO: "Thông tin tài khoản không đầy đủ.",
  ACCOUNT_NOT_FOUND: "Tài khoản không tồn tại trên hệ thống.",
  INVALID_ADMIN_KEY: "Xác thực tài khoản thất bại.",
  INVALID_LICENSE_ERR: "Mã bản quyền không chính xác hoặc đã bị tạm khóa.",
  INVALID_AMOUNT_ERR: "Lượt yêu cầu sử dụng không hợp lệ."
};

const ApiFields = {
  ACTION: "action",
  ADMIN_TOKEN: "admin_token",
  USERNAME: "username",
  PASSWORD: "password",
  ADMIN_KEY: "admin_key",
  LICENSE_KEY: "license_key",
  DEVICE_ID: "device_id",
  FEATURE: "feature",
  AMOUNT: "amount",
  ID: "id",
  PLAN_ID: "plan_id",
  EXPIRES_AT: "expires_at",
  STATUS: "status",
  QUOTA_TYPE: "quota_type",
  NAME: "name",
  QUOTA_VIDEO: "quota_video",
  QUOTA_IMAGE: "quota_image",
  QUOTA_VOICE: "quota_voice",
  IS_UNLIMITED: "is_unlimited",
  DELETE_TYPE: "delete_type",
  GEMINI_KEY: "geminiKey",
  AI33_KEY: "ai33Key",
  ASSIGNED_TO: "assignedTo",
  ACCOUNT: "account",
  EMAIL: "email",
  RECOVERY_EMAIL: "recoveryEmail",
  ROW_INDEX: "row_index",
  ROW_INDEX_CAMEL: "rowIndex",
  EXCLUDED_TO: "excludedTo",
  PLAN_TYPE_GAS: "plan_type"
};

const AppActions = {
  ADMIN_LOGIN: "admin_login",
  ADMIN_GET_USERS: "admin_get_users",
  ADMIN_CREATE_KEY: "admin_create_key",
  ADMIN_REVOKE_KEY: "admin_revoke_key",
  ADMIN_DELETE_KEY: "admin_delete_key",
  ADMIN_UPDATE_KEY: "admin_update_key",
  ADMIN_RESET_DEVICE: "admin_reset_device",
  ADMIN_GET_PLANS: "admin_get_plans",
  ADMIN_CREATE_PLAN: "admin_create_plan",
  ADMIN_UPDATE_PLAN: "admin_update_plan",
  ADMIN_DELETE_PLAN: "admin_delete_plan",
  ADMIN_SYNC_EXPIRED: "admin_sync_expired",
  ADMIN_GET_API_KEYS: "admin_get_api_keys",
  ADMIN_UPDATE_API_KEYS: "admin_update_api_keys",
  ADMIN_GET_ACCOUNTS: "admin_get_accounts",
  ADMIN_ADD_ACCOUNT: "admin_add_account",
  ADMIN_UPDATE_ACCOUNT: "admin_update_account",
  ADMIN_DELETE_ACCOUNT: "admin_delete_account",
  ADMIN_DELETE_API_KEYS: "admin_delete_api_keys",
  ADMIN_UPDATE_ACCOUNT_STATUS: "admin_update_account_status",
  VERIFY_KEY: "verify_key",
  UPDATE_USAGE: "update_usage",
  GET_API_KEYS: "get_api_keys",
  UPDATE_API_KEYS: "update_api_keys",
  GET_ACCOUNTS: "get_accounts",
  ADD_ACCOUNT: "add_account",
  UPDATE_ACCOUNT_STATUS: "update_account_status"
};

const AppLogger = {
  info: function (msg) {
    Logger.log("[INFO] " + msg);
  },
  error: function (msg, err) {
    Logger.log("[ERROR] " + msg + (err ? ": " + err.toString() : ""));
  }
};

// Global routing functions for Google Apps Script execution engine
function doPost(e) {
  return _.doPost(e);
}

function doGet(e) {
  return _.doGet(e);
}

function doOptions(e) {
  return _.doOptions(e);
}

function setupSeedData() {
  return _.setupSeedData();
}
