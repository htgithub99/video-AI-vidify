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
  filter: function (arr, fn) { const res = []; for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) res.push(arr[i]); } return res; },
  find: function (arr, fn) { for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return arr[i]; } return undefined; },
  toUpper: function (str) { return String(str).toUpperCase(); },
  split: function (str, sep) { return String(str).split(sep); },
  some: function (arr, fn) { for (let i = 0; i < arr.length; i++) { if (fn(arr[i], i)) return true; } return false; },
  cloneDeep: function (obj) { return JSON.parse(JSON.stringify(obj)); }
};

const UserCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, USERNAME: 3, LICENSE_KEY: 4, PLAN_ID: 5, STATUS: 6, EXPIRES_AT: 7, DEVICE_ID: 8, QUOTA_TYPE: 9 };
const UsageCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, LICENSE_KEY: 3, VIDEO: 4, IMAGE: 5, VOICE: 6, LAST_RESET: 7 };
const PlanCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, NAME: 3, VIDEO: 4, IMAGE: 5, VOICE: 6, UNLIMITED: 7 };
const AdminCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, USERNAME: 3, PASSWORD: 4, TOKEN: 5 };
const HttpCode = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, INTERNAL_ERROR: 500 };
const KeysCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, ASSIGNED_TO: 3, GEMINI_KEY: 4, AI33_KEY: 5 };
const AccountsCols = { ID: 0, CREATED_AT: 1, UPDATED_AT: 2, EMAIL: 3, PASSWORD: 4, RECOVERY_EMAIL: 5, STATUS: 6, ASSIGNED_TO: 7 };

const Config = {
  SHEET_USERS: "users",
  SHEET_USAGE: "usage",
  SHEET_PLANS: "plans",
  SHEET_ADMINS: "admins",
  SHEET_KEYS: "keys",
  SHEET_ACCOUNTS: "accounts",
  HEADERS: {
    ADMINS: ["ID", "CREATED_AT", "UPDATED_AT", "USERNAME", "PASSWORD", "TOKEN"],
    PLANS: ["ID", "CREATED_AT", "UPDATED_AT", "NAME", "QUOTA_VIDEO", "QUOTA_IMAGE", "QUOTA_VOICE", "IS_UNLIMITED"],
    USERS: ["ID", "CREATED_AT", "UPDATED_AT", "USERNAME", "LICENSE_KEY", "PLAN_ID", "STATUS", "EXPIRES_AT", "DEVICE_ID", "QUOTA_TYPE"],
    USAGE: ["ID", "CREATED_AT", "UPDATED_AT", "LICENSE_KEY", "VIDEO_COUNT", "IMAGE_COUNT", "VOICE_CHARS", "LAST_RESET"],
    KEYS: ["ID", "CREATED_AT", "UPDATED_AT", "ASSIGNED_TO", "GEMINI_KEY", "AI33_KEY"],
    ACCOUNTS: ["ID", "CREATED_AT", "UPDATED_AT", "EMAIL", "PASSWORD", "RECOVERY_EMAIL", "STATUS", "ASSIGNED_TO"]
  }
};

const StatusEnum = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED"
};

const QuotaType = {
  DAILY: "DAILY",
  TOTAL: "TOTAL"
};

const PlanType = {
  FREE: "FREE",
  PRO: "PRO",
  PRO_LIFETIME: "PRO_LIFETIME"
};

const FeatureEnum = {
  VIDEO: "video",
  IMAGE: "image",
  VOICE: "voice"
};

const Messages = {
  INVALID_ACTION: "Hành động không hợp lệ",
  SERVER_ERROR: "Lỗi hệ thống máy chủ",
  INVALID_TOKEN: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
  MISSING_CREDENTIALS: "Vui lòng nhập tài khoản và mật khẩu",
  INVALID_CREDENTIALS: "Sai tài khoản hoặc mật khẩu",
  MISSING_KEY: "Thiếu thông tin Mã Bản Quyền (License Key)",
  MISSING_DEVICE: "Thiếu thông tin Thiết Bị (Device ID)",
  MISSING_ID: "Thiếu ID",
  MISSING_ACCOUNT_INFO: "Thiếu thông tin tài khoản",
  ACCOUNT_NOT_FOUND: "Không tìm thấy tài khoản",
  KEY_NOT_FOUND: "Không tìm thấy Mã Bản Quyền này",
  USER_NOT_FOUND: "Không tìm thấy người dùng",
  KEY_REVOKED: "Tài khoản của bạn đã bị khóa hoặc hết hạn",
  KEY_EXPIRED: "Tài khoản của bạn đã hết hạn sử dụng",
  DEVICE_LIMIT: "Mã kích hoạt đã đạt giới hạn số thiết bị cho phép",
  SHEET_NOT_FOUND: "Lỗi kết nối cơ sở dữ liệu (Không tìm thấy Sheet)",
  SUCCESS_CREATED: "Tạo tài khoản thành công",
  SUCCESS_REVOKED: "Khóa tài khoản thành công",
  SUCCESS_DELETED: "Xóa vĩnh viễn tài khoản thành công",
  SUCCESS_UPDATED: "Cập nhật thành công",
  SUCCESS_RESET: "Gỡ thiết bị thành công",
  OPTIONS_OK: "ok",
  GET_RUNNING: "API is running. Please use POST method.",
  SEED_SUCCESS: "Tạo Seed Data thành công! Bạn có thể xem các Sheet ở bên dưới.",
  RES_SUCCESS: "success",
  PLAN_NOT_FOUND: "Không tìm thấy gói"
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
  ADMIN_UPDATE_PLAN: "admin_update_plan",
  ADMIN_GET_API_KEYS: "admin_get_api_keys",
  ADMIN_GET_ACCOUNTS: "admin_get_accounts",
  ADMIN_UPDATE_API_KEYS: "admin_update_api_keys",
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
  UPDATE_ACCOUNT_STATUS: "update_account_status",
  ADMIN_PREFIX: "admin_"
};

const Constants = {
  UNKNOWN: "Unknown",
  EMPTY_ARRAY: "[]",
  EMPTY_STRING: "",
  ALL: "ALL",
  GEMINI_API_KEY: "GEMINI_API_KEY",
  AI33_API_KEY: "AI33_API_KEY",
  ACTIVE_LOWER: "Active",
  COLOR_ADMIN: "#d9ead3",
  COLOR_CONFIG: "#c9daf8",
  COLOR_USERS: "#fff2cc",
  COLOR_USAGE: "#fce5cd",
  DATE_SPLIT_CHAR: "T",
  UUID_SPLIT_CHAR: "-",
  STRING_TRUE: "true"
};

const AppLogger = {
  info: function (message) {
    Logger.log(message);
  },
  error: function (message, err) {
    if (err) {
      Logger.log(`ERROR: ${message} - ${err.toString()}`);
    } else {
      Logger.log(`ERROR: ${message}`);
    }
  }
};

function generateUUID() {
  return Utilities.getUuid();
}

function getCurrentISO() {
  return new Date().toISOString();
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = _.get(params, 'action');

    if (action === AppActions.ADMIN_LOGIN) return adminLogin(params);

    if (!_.isNil(action) && _.startsWith(action, AppActions.ADMIN_PREFIX)) {
      if (!validateAdminToken(_.get(params, 'admin_token'))) {
        return jsonResponse({ error: Messages.INVALID_TOKEN, code: HttpCode.UNAUTHORIZED });
      }
      if (action === AppActions.ADMIN_GET_USERS) return adminGetUsers();
      if (action === AppActions.ADMIN_CREATE_KEY) return adminCreateKey(params);
      if (action === AppActions.ADMIN_REVOKE_KEY) return adminRevokeKey(params);
      if (action === AppActions.ADMIN_DELETE_KEY) return adminDeleteKey(params);
      if (action === AppActions.ADMIN_UPDATE_KEY) return adminUpdateKey(params);
      if (action === AppActions.ADMIN_RESET_DEVICE) return adminResetDevice(params);
      if (action === AppActions.ADMIN_GET_PLANS) return adminGetPlans();
      if (action === AppActions.ADMIN_UPDATE_PLAN) return adminUpdatePlan(params);
      if (action === AppActions.ADMIN_GET_API_KEYS) return adminGetApiKeys();
      if (action === AppActions.ADMIN_GET_ACCOUNTS) return adminGetAccounts();
      if (action === AppActions.ADMIN_UPDATE_API_KEYS) return updateApiKeys(params);
      if (action === AppActions.ADMIN_ADD_ACCOUNT) return addAccount(params);
      if (action === AppActions.ADMIN_UPDATE_ACCOUNT) return updateAccountAdmin(params);
      if (action === AppActions.ADMIN_DELETE_ACCOUNT) return deleteAccountAdmin(params);
      if (action === AppActions.ADMIN_DELETE_API_KEYS) return deleteApiKeysAdmin(params);
      if (action === AppActions.ADMIN_UPDATE_ACCOUNT_STATUS) return updateAccountStatus(params);
    }

    if (action === AppActions.VERIFY_KEY) return verifyKey(params);
    if (action === AppActions.UPDATE_USAGE) return updateUsage(params);

    if (action === AppActions.GET_API_KEYS) return getApiKeys(params);
    if (action === AppActions.UPDATE_API_KEYS) return updateApiKeys(params);
    if (action === AppActions.GET_ACCOUNTS) return getAccounts(params);
    if (action === AppActions.ADD_ACCOUNT) return addAccount(params);
    if (action === AppActions.UPDATE_ACCOUNT_STATUS) return updateAccountStatus(params);

    return jsonResponse({ error: Messages.INVALID_ACTION, code: HttpCode.BAD_REQUEST });
  } catch (error) {
    AppLogger.error(Messages.SERVER_ERROR, error);
    return jsonResponse({ error: error.toString(), code: HttpCode.INTERNAL_ERROR });
  }
}

function doOptions(e) {
  return jsonResponse({ status: Messages.OPTIONS_OK });
}

function doGet(e) {
  return jsonResponse({ status: Messages.GET_RUNNING });
}

function verifyKey(params) {
  const key = _.get(params, 'license_key');
  const device = _.get(params, 'device_id');

  if (_.isNil(key)) return jsonResponse({ error: Messages.MISSING_KEY, code: HttpCode.BAD_REQUEST });
  if (_.isNil(device)) return jsonResponse({ error: Messages.MISSING_DEVICE, code: HttpCode.BAD_REQUEST });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();
  const maxDevices = 1;

  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);

  if (rowIndex > 0) {
    const row = data[rowIndex];
    const savedDeviceStr = row[UserCols.DEVICE_ID] || Constants.EMPTY_ARRAY;
    let savedDevices = [];

    try {
      savedDevices = JSON.parse(savedDeviceStr);
      if (!_.isArray(savedDevices)) savedDevices = [];
    } catch (e) {
      savedDevices = savedDeviceStr ? [savedDeviceStr] : [];
    }

    if (!_.includes(savedDevices, device)) {
      if (savedDevices.length < maxDevices) {
        savedDevices.push(device);
        usersSheet.getRange(rowIndex + 1, UserCols.DEVICE_ID + 1).setValue(JSON.stringify(savedDevices));
      } else {
        return jsonResponse({ error: `${Messages.DEVICE_LIMIT} (${maxDevices})`, code: HttpCode.FORBIDDEN });
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
    let usage = getUsageData(key);


    if (quotaType === QuotaType.DAILY) {
      const today = getCurrentISO().split(Constants.DATE_SPLIT_CHAR)[0];
      const lastResetDate = String(usage.last_reset || Constants.EMPTY_STRING).split(Constants.DATE_SPLIT_CHAR)[0];
      if (lastResetDate !== today) {
        usage = { video: 0, image: 0, voice: 0, last_reset: getCurrentISO() };
      }
    }

    const planId = row[UserCols.PLAN_ID];
    const plan = getPlanById(planId);

    return jsonResponse({
      status: currentStatus,
      plan: plan,
      quota_type: quotaType,
      expires_at: expiresAt || null,
      usage: usage
    });
  }

  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function updateUsage(params) {
  const key = _.get(params, 'license_key');
  const feature = _.get(params, 'feature');
  const amount = _.toInteger(_.get(params, 'amount')) || 1;

  if (_.isNil(key)) return jsonResponse({ error: Messages.MISSING_KEY });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usersData = usersSheet.getDataRange().getValues();

  const isValid = _.some(usersData, (row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key && row[UserCols.STATUS] === StatusEnum.ACTIVE);
  if (!isValid) return jsonResponse({ error: Messages.KEY_REVOKED, code: HttpCode.FORBIDDEN });

  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  const data = usageSheet.getDataRange().getValues();
  const usageIndex = _.findIndex(data, (row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === key);

  if (usageIndex > 0) {
    const row = data[usageIndex];
    const userRow = _.find(usersData, (r, idx) => idx > 0 && r[UserCols.LICENSE_KEY] === key);
    const quotaType = userRow ? (userRow[UserCols.QUOTA_TYPE] || QuotaType.DAILY) : QuotaType.DAILY;
    const today = getCurrentISO().split(Constants.DATE_SPLIT_CHAR)[0];
    const lastResetDate = String(row[UsageCols.LAST_RESET] || Constants.EMPTY_STRING).split(Constants.DATE_SPLIT_CHAR)[0];

    let currentVideo = _.toInteger(row[UsageCols.VIDEO] || 0);
    let currentImage = _.toInteger(row[UsageCols.IMAGE] || 0);
    let currentVoice = _.toInteger(row[UsageCols.VOICE] || 0);

    if (quotaType === QuotaType.DAILY && lastResetDate !== today) {
      currentVideo = 0;
      currentImage = 0;
      currentVoice = 0;
      usageSheet.getRange(usageIndex + 1, UsageCols.LAST_RESET + 1).setValue(getCurrentISO());
    }

    if (feature === FeatureEnum.VIDEO) currentVideo += amount;
    if (feature === FeatureEnum.IMAGE) currentImage += amount;
    if (feature === FeatureEnum.VOICE) currentVoice += amount;


    usageSheet.getRange(usageIndex + 1, UsageCols.VIDEO + 1, 1, 3).setValues([[currentVideo, currentImage, currentVoice]]);
    usageSheet.getRange(usageIndex + 1, UsageCols.UPDATED_AT + 1).setValue(getCurrentISO());
  } else {
    const now = getCurrentISO();
    const freeId = generateUUID();
    const proId = generateUUID();
    const lifetimeId = generateUUID();
    const newRow = [generateUUID(), now, now, key, 0, 0, 0, now];
    if (feature === FeatureEnum.VIDEO) newRow[UsageCols.VIDEO] = amount;
    if (feature === FeatureEnum.IMAGE) newRow[UsageCols.IMAGE] = amount;
    if (feature === FeatureEnum.VOICE) newRow[UsageCols.VOICE] = amount;
    usageSheet.appendRow(newRow);
  }

  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function adminLogin(params) {
  const username = _.get(params, 'username');
  const password = _.get(params, 'password');

  if (_.isNil(username) || _.isNil(password)) return jsonResponse({ error: Messages.MISSING_CREDENTIALS });

  const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
  if (!adminsSheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const data = adminsSheet.getDataRange().getValues();
  const adminIndex = _.findIndex(data, (row, idx) => idx > 0 && row[AdminCols.USERNAME] == username && row[AdminCols.PASSWORD] == password);

  if (adminIndex > 0) {
    const newToken = generateUUID();
    adminsSheet.getRange(adminIndex + 1, AdminCols.TOKEN + 1).setValue(newToken);
    adminsSheet.getRange(adminIndex + 1, AdminCols.UPDATED_AT + 1).setValue(getCurrentISO());
    return jsonResponse({ status: Messages.RES_SUCCESS, token: newToken });
  }

  return jsonResponse({ error: Messages.INVALID_CREDENTIALS, code: HttpCode.UNAUTHORIZED });
}

function validateAdminToken(token) {
  if (_.isNil(token)) return false;
  const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
  if (!adminsSheet) return false;

  const data = adminsSheet.getDataRange().getValues();
  return _.some(data, (row, idx) => idx > 0 && row[AdminCols.TOKEN] === token);
}

function adminGetUsers() {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);

  const usersData = usersSheet.getDataRange().getValues();
  const usageData = usageSheet.getDataRange().getValues();

  const users = _.map(_.filter(usersData, (row, idx) => idx > 0), row => {
    const key = row[UserCols.LICENSE_KEY];
    const uRow = _.find(usageData, (u, i) => i > 0 && u[UsageCols.LICENSE_KEY] === key);

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

  return jsonResponse({ users: users });
}

function adminCreateKey(params) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const username = _.get(params, 'username', Constants.UNKNOWN);
  const planId = _.get(params, 'plan_id');
  const quotaType = _.get(params, 'quota_type', QuotaType.DAILY);
  const newKey = _.toUpper(_.split(generateUUID(), Constants.UUID_SPLIT_CHAR)[0]);

  const now = getCurrentISO();
  usersSheet.appendRow([generateUUID(), now, now, username, newKey, planId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, quotaType]);

  return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_CREATED, license_key: newKey });
}

function adminRevokeKey(params) {
  const id = _.get(params, 'id');
  if (_.isNil(id)) return jsonResponse({ error: Messages.MISSING_ID });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();

  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[UserCols.ID] === id);
  if (rowIndex > 0) {
    usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.REVOKED);
    return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_REVOKED });
  }

  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function adminDeleteKey(params) {
  const id = _.get(params, 'id');
  if (_.isNil(id)) return jsonResponse({ error: Messages.MISSING_ID });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);

  const usersData = usersSheet.getDataRange().getValues();
  const rowIndex = _.findIndex(usersData, (row, idx) => idx > 0 && row[UserCols.ID] === id);

  if (rowIndex > 0) {
    const licenseKey = usersData[rowIndex][UserCols.LICENSE_KEY];
    usersSheet.deleteRow(rowIndex + 1);

    const usageData = usageSheet.getDataRange().getValues();
    const usageIndex = _.findIndex(usageData, (row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === licenseKey);
    if (usageIndex > 0) usageSheet.deleteRow(usageIndex + 1);
  }

  return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_DELETED });
}

function adminUpdateKey(params) {
  const id = _.get(params, 'id');
  const newPlanId = _.get(params, 'plan_id');
  const newExpires = _.get(params, 'expires_at');
  const newStatus = _.get(params, 'status');
  const newQuotaType = _.get(params, 'quota_type');

  if (_.isNil(id)) return jsonResponse({ error: Messages.MISSING_ID });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();

  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[UserCols.ID] === id);
  if (rowIndex > 0) {
    if (newPlanId) usersSheet.getRange(rowIndex + 1, UserCols.PLAN_ID + 1).setValue(newPlanId);
    if (newQuotaType) usersSheet.getRange(rowIndex + 1, UserCols.QUOTA_TYPE + 1).setValue(newQuotaType);
    usersSheet.getRange(rowIndex + 1, UserCols.EXPIRES_AT + 1).setValue(newExpires || Constants.EMPTY_STRING);

    if (newStatus) {
      usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(newStatus);
    } else if (data[rowIndex][UserCols.STATUS] === StatusEnum.EXPIRED) {
      usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.ACTIVE);
    }

    usersSheet.getRange(rowIndex + 1, UserCols.UPDATED_AT + 1).setValue(getCurrentISO());

    return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_UPDATED });
  }

  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function adminResetDevice(params) {
  const id = _.get(params, 'id');
  if (_.isNil(id)) return jsonResponse({ error: Messages.MISSING_ID });

  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();

  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[UserCols.ID] === id);
  if (rowIndex > 0) {
    usersSheet.getRange(rowIndex + 1, UserCols.DEVICE_ID + 1).setValue(Constants.EMPTY_ARRAY);
    return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_RESET });
  }

  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function adminGetPlans() {
  return jsonResponse({ plans: getPlans() });
}

function adminUpdatePlan(params) {
  const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
  if (!plansSheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const planId = _.get(params, 'id');
  if (_.isNil(planId)) return jsonResponse({ error: Messages.MISSING_ID });

  const data = plansSheet.getDataRange().getValues();
  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[PlanCols.ID] === planId);

  if (rowIndex > 0) {
    const now = getCurrentISO();
    if (!_.isNil(params.name)) plansSheet.getRange(rowIndex + 1, PlanCols.NAME + 1).setValue(params.name);
    if (!_.isNil(params.quota_video)) plansSheet.getRange(rowIndex + 1, PlanCols.VIDEO + 1).setValue(params.quota_video);
    if (!_.isNil(params.quota_image)) plansSheet.getRange(rowIndex + 1, PlanCols.IMAGE + 1).setValue(params.quota_image);
    if (!_.isNil(params.quota_voice)) plansSheet.getRange(rowIndex + 1, PlanCols.VOICE + 1).setValue(params.quota_voice);
    if (!_.isNil(params.is_unlimited)) plansSheet.getRange(rowIndex + 1, PlanCols.UNLIMITED + 1).setValue(params.is_unlimited);

    plansSheet.getRange(rowIndex + 1, PlanCols.UPDATED_AT + 1).setValue(now);
    return jsonResponse({ status: Messages.RES_SUCCESS, message: Messages.SUCCESS_UPDATED });
  }

  return jsonResponse({ error: Messages.PLAN_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function getPlans() {
  const plansSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_PLANS);
  if (!plansSheet) return [];

  const data = plansSheet.getDataRange().getValues();
  return _.map(_.filter(data, (row, idx) => idx > 0), row => ({
    id: row[PlanCols.ID],
    name: row[PlanCols.NAME],
    quota_video: _.toInteger(row[PlanCols.VIDEO]) || 0,
    quota_image: _.toInteger(row[PlanCols.IMAGE]) || 0,
    quota_voice: _.toInteger(row[PlanCols.VOICE]) || 0,
    is_unlimited: (String(row[PlanCols.UNLIMITED]) === Constants.STRING_TRUE),
    created_at: row[PlanCols.CREATED_AT],
    updated_at: row[PlanCols.UPDATED_AT]
  }));
}

function getPlanById(planId) {
  const plans = getPlans();
  return _.find(plans, p => p.id === planId) || {
    id: planId, name: Constants.UNKNOWN, quota_video: 0, quota_image: 0, quota_voice: 0, is_unlimited: false
  };
}

function getUsageData(key) {
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  if (!usageSheet) return { video: 0, image: 0, voice: 0, last_reset: Constants.EMPTY_STRING };

  const data = usageSheet.getDataRange().getValues();
  const usageRow = _.find(data, (row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === key);

  if (usageRow) {
    return {
      video: usageRow[UsageCols.VIDEO] || 0,
      image: usageRow[UsageCols.IMAGE] || 0,
      voice: usageRow[UsageCols.VOICE] || 0,
      last_reset: usageRow[UsageCols.LAST_RESET]
    };
  }
  return { video: 0, image: 0, voice: 0, last_reset: Constants.EMPTY_STRING };
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function matchAssignedTo(rowAssignedTo, licenseKey, planId) {
  if (!rowAssignedTo) return false;
  if (rowAssignedTo === Constants.ALL) return true;
  if (planId && rowAssignedTo === planId) return true;
  if (licenseKey && rowAssignedTo === licenseKey) return true;
  return false;
}

function getApiKeys(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const licenseKey = _.get(params, 'license_key', Constants.EMPTY_STRING);
  const planId = _.get(params, 'plan_id', Constants.EMPTY_STRING);

  const data = sheet.getDataRange().getValues();
  let geminiKey = Constants.EMPTY_STRING;
  let ai33Key = Constants.EMPTY_STRING;
  let geminiPriority = -1;
  let ai33Priority = -1;

  const getPriority = (assigned) => {
    if (assigned === Constants.ALL) return 0;
    if (assigned === planId) return 1;
    if (assigned === licenseKey) return 2;
    return -1;
  };

  _.forEach(data, (row, i) => {
    if (i === 0) return;
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

  return jsonResponse({ apiKeys: { geminiKey, ai33Key } });
}

function adminGetApiKeys() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const data = sheet.getDataRange().getValues();
  const keys = _.map(_.filter(data, (row, idx) => idx > 0), row => ({
    id: row[KeysCols.ID] || Constants.EMPTY_STRING,
    assignedTo: row[KeysCols.ASSIGNED_TO] || Constants.ALL,
    geminiKey: row[KeysCols.GEMINI_KEY] || Constants.EMPTY_STRING,
    ai33Key: row[KeysCols.AI33_KEY] || Constants.EMPTY_STRING,
    createdAt: row[KeysCols.CREATED_AT] || Constants.EMPTY_STRING,
    updatedAt: row[KeysCols.UPDATED_AT] || Constants.EMPTY_STRING
  }));

  return jsonResponse({ keys });
}

function updateApiKeys(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const id = _.get(params, 'id');
  const geminiKey = _.get(params, 'geminiKey');
  const ai33Key = _.get(params, 'ai33Key');
  const assignedTo = _.get(params, 'assignedTo', Constants.ALL);
  const data = sheet.getDataRange().getValues();
  const now = getCurrentISO();

  if (id) {
    const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[KeysCols.ID] === id);
    if (rowIndex > 0) {
      sheet.getRange(rowIndex + 1, KeysCols.ASSIGNED_TO + 1).setValue(assignedTo);
      sheet.getRange(rowIndex + 1, KeysCols.GEMINI_KEY + 1).setValue(geminiKey || Constants.EMPTY_STRING);
      sheet.getRange(rowIndex + 1, KeysCols.AI33_KEY + 1).setValue(ai33Key || Constants.EMPTY_STRING);
      sheet.getRange(rowIndex + 1, KeysCols.UPDATED_AT + 1).setValue(now);
      return jsonResponse({ status: Messages.RES_SUCCESS });
    }
  }

  sheet.appendRow([generateUUID(), now, now, assignedTo, geminiKey || Constants.EMPTY_STRING, ai33Key || Constants.EMPTY_STRING]);
  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function deleteApiKeysAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const id = _.get(params, 'id');
  if (!id) return jsonResponse({ error: Messages.MISSING_ID, code: HttpCode.BAD_REQUEST });

  const data = sheet.getDataRange().getValues();
  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[KeysCols.ID] === id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
  }

  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function getAccounts(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const licenseKey = _.get(params, 'license_key', Constants.EMPTY_STRING);
  const planId = _.get(params, 'plan_id', Constants.EMPTY_STRING);

  const data = sheet.getDataRange().getValues();
  const accounts = [];

  _.forEach(data, (row, i) => {
    if (i === 0) return;
    const assigned = row[AccountsCols.ASSIGNED_TO] || Constants.ALL;
    if (matchAssignedTo(assigned, licenseKey, planId)) {
      accounts.push({
        id: i,
        email: row[AccountsCols.EMAIL] || Constants.EMPTY_STRING,
        password: row[AccountsCols.PASSWORD] || Constants.EMPTY_STRING,
        recoveryEmail: row[AccountsCols.RECOVERY_EMAIL] || Constants.EMPTY_STRING,
        status: row[AccountsCols.STATUS] || Constants.ACTIVE_LOWER,
        assignedTo: assigned
      });
    }
  });

  return jsonResponse({ accounts });
}

function adminGetAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const data = sheet.getDataRange().getValues();
  const accounts = _.map(_.filter(data, (row, idx) => idx > 0), row => ({
    id: row[AccountsCols.ID] || Constants.EMPTY_STRING,
    email: row[AccountsCols.EMAIL] || Constants.EMPTY_STRING,
    password: row[AccountsCols.PASSWORD] || Constants.EMPTY_STRING,
    recoveryEmail: row[AccountsCols.RECOVERY_EMAIL] || Constants.EMPTY_STRING,
    status: row[AccountsCols.STATUS] || Constants.ACTIVE_LOWER,
    assignedTo: row[AccountsCols.ASSIGNED_TO] || Constants.ALL,
    createdAt: row[AccountsCols.CREATED_AT] || Constants.EMPTY_STRING,
    updatedAt: row[AccountsCols.UPDATED_AT] || Constants.EMPTY_STRING
  }));

  return jsonResponse({ accounts });
}

function addAccount(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const acc = _.get(params, 'account');
  if (_.isNil(acc) || _.isNil(_.get(acc, 'email'))) return jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

  const now = getCurrentISO();
  sheet.appendRow([
    generateUUID(),
    now,
    now,
    _.get(acc, 'email'),
    _.get(acc, 'password', Constants.EMPTY_STRING),
    _.get(acc, 'recoveryEmail', Constants.EMPTY_STRING),
    _.get(acc, 'status', Constants.ACTIVE_LOWER),
    _.get(acc, 'assignedTo', Constants.ALL)
  ]);
  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function updateAccountStatus(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const rowIndex = _.get(params, 'rowIndex');
  const status = _.get(params, 'status');

  if (_.isNil(rowIndex) || _.isNil(status)) return jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

  sheet.getRange(rowIndex + 1, AccountsCols.STATUS + 1).setValue(status);
  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function updateAccountAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const acc = _.get(params, 'account');
  if (_.isNil(acc) || _.isNil(_.get(acc, 'id')) || _.isNil(_.get(acc, 'email'))) return jsonResponse({ error: Messages.MISSING_ACCOUNT_INFO, code: HttpCode.BAD_REQUEST });

  const data = sheet.getDataRange().getValues();
  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[AccountsCols.ID] === _.get(acc, 'id'));

  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, AccountsCols.EMAIL + 1).setValue(_.get(acc, 'email'));
    sheet.getRange(rowIndex + 1, AccountsCols.PASSWORD + 1).setValue(_.get(acc, 'password', Constants.EMPTY_STRING));
    sheet.getRange(rowIndex + 1, AccountsCols.RECOVERY_EMAIL + 1).setValue(_.get(acc, 'recoveryEmail', Constants.EMPTY_STRING));
    sheet.getRange(rowIndex + 1, AccountsCols.ASSIGNED_TO + 1).setValue(_.get(acc, 'assignedTo', Constants.ALL));
    sheet.getRange(rowIndex + 1, AccountsCols.UPDATED_AT + 1).setValue(getCurrentISO());
    return jsonResponse({ status: Messages.RES_SUCCESS });
  }

  return jsonResponse({ error: Messages.ACCOUNT_NOT_FOUND, code: HttpCode.NOT_FOUND });
}

function deleteAccountAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const id = _.get(params, 'id');
  if (_.isNil(id)) return jsonResponse({ error: Messages.MISSING_ID, code: HttpCode.BAD_REQUEST });

  const data = sheet.getDataRange().getValues();
  const rowIndex = _.findIndex(data, (row, idx) => idx > 0 && row[AccountsCols.ID] === id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex + 1);
  }

  return jsonResponse({ status: Messages.RES_SUCCESS });
}

function setupSeedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = getCurrentISO();
  const freeId = generateUUID();
  const proId = generateUUID();
  const lifetimeId = generateUUID();

  let adminSheet = ss.getSheetByName(Config.SHEET_ADMINS);
  if (!adminSheet) {
    adminSheet = ss.insertSheet(Config.SHEET_ADMINS);
    adminSheet.appendRow(Config.HEADERS.ADMINS);
    adminSheet.appendRow([generateUUID(), now, now, "admin", "admin", Constants.EMPTY_STRING]);
    adminSheet.getRange("A1:F1").setFontWeight("bold").setBackground(Constants.COLOR_ADMIN);
  }

  let plansSheet = ss.getSheetByName(Config.SHEET_PLANS);
  if (!plansSheet) {
    plansSheet = ss.insertSheet(Config.SHEET_PLANS);
    plansSheet.appendRow(Config.HEADERS.PLANS);




    plansSheet.appendRow([freeId, now, now, "FREE", 3, 10, 5000, false]);
    plansSheet.appendRow([proId, now, now, "PRO", 50, 500, 100000, false]);
    plansSheet.appendRow([lifetimeId, now, now, "PRO_LIFETIME", 50, 500, 100000, true]);

    plansSheet.getRange("A1:H1").setFontWeight("bold").setBackground(Constants.COLOR_CONFIG);
  }

  let usersSheet = ss.getSheetByName(Config.SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(Config.SHEET_USERS);
    usersSheet.appendRow(Config.HEADERS.USERS);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    usersSheet.appendRow([generateUUID(), now, now, "Khách FREE", "FREE-12345", freeId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, QuotaType.DAILY]);
    usersSheet.appendRow([generateUUID(), now, now, "Khách PRO", "PRO-99999", proId, StatusEnum.ACTIVE, nextYear.toISOString(), Constants.EMPTY_ARRAY, QuotaType.DAILY]);
    usersSheet.appendRow([generateUUID(), now, now, "Khách VIP", "PRO-LIFE", lifetimeId, StatusEnum.ACTIVE, Constants.EMPTY_STRING, Constants.EMPTY_ARRAY, QuotaType.TOTAL]);

    usersSheet.getRange("A1:J1").setFontWeight("bold").setBackground(Constants.COLOR_USERS);
  }

  let usageSheet = ss.getSheetByName(Config.SHEET_USAGE);
  if (!usageSheet) {
    usageSheet = ss.insertSheet(Config.SHEET_USAGE);
    usageSheet.appendRow(Config.HEADERS.USAGE);
    usageSheet.appendRow([generateUUID(), now, now, "FREE-12345", 0, 0, 0, now]);
    usageSheet.appendRow([generateUUID(), now, now, "PRO-99999", 5, 20, 1000, now]);
    usageSheet.appendRow([generateUUID(), now, now, "PRO-LIFE", 10, 50, 5000, now]);
    usageSheet.getRange("A1:H1").setFontWeight("bold").setBackground(Constants.COLOR_USAGE);
  }

  let keysSheet = ss.getSheetByName(Config.SHEET_KEYS);
  if (!keysSheet) {
    keysSheet = ss.insertSheet(Config.SHEET_KEYS);
    keysSheet.appendRow(Config.HEADERS.KEYS);
    keysSheet.appendRow([generateUUID(), now, now, Constants.ALL, Constants.EMPTY_STRING, Constants.EMPTY_STRING]);
    keysSheet.getRange("A1:F1").setFontWeight("bold").setBackground(Constants.COLOR_ADMIN);
  }

  let accountsSheet = ss.getSheetByName(Config.SHEET_ACCOUNTS);
  if (!accountsSheet) {
    accountsSheet = ss.insertSheet(Config.SHEET_ACCOUNTS);
    accountsSheet.appendRow(Config.HEADERS.ACCOUNTS);
    accountsSheet.getRange("A1:H1").setFontWeight("bold").setBackground(Constants.COLOR_CONFIG);
  }

  AppLogger.info(Messages.SEED_SUCCESS);
}
