

const UserCols = { USERNAME: 0, LICENSE_KEY: 1, PLAN_TYPE: 2, STATUS: 3, CREATED_AT: 4, EXPIRES_AT: 5, DEVICE_ID: 6 };
const UsageCols = { LICENSE_KEY: 0, VIDEO: 1, IMAGE: 2, VOICE: 3, LAST_RESET: 4 };
const ConfigCols = { KEY: 0, VALUE: 1 };
const AdminCols = { USERNAME: 0, PASSWORD: 1, TOKEN: 2 };
const HttpCode = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, INTERNAL_ERROR: 500 };

const KeysCols = { KEY: 0, VALUE: 1, ASSIGNED_TO: 2 };
const AccountsCols = { EMAIL: 0, PASSWORD: 1, RECOVERY_EMAIL: 2, STATUS: 3, ASSIGNED_TO: 4 };

const Config = {
  SHEET_USERS: "Users",
  SHEET_USAGE: "Usage",
  SHEET_CONFIG: "Config",
  SHEET_ADMINS: "Admins",
  SHEET_KEYS: "Keys",
  SHEET_ACCOUNTS: "Accounts",
  CONFIG_KEYS: [
    "free_quota_video", "free_quota_image", "free_quota_voice",
    "pro_quota_video", "pro_quota_image", "pro_quota_voice", "pro_unlimited"
  ]
};

const StatusEnum = {
  ACTIVE: "ACTIVE",
  REVOKED: "REVOKED",
  EXPIRED: "EXPIRED"
};

const PlanType = {
  FREE: "FREE"
};

const Messages = {
  INVALID_ACTION: "Hành động không hợp lệ",
  SERVER_ERROR: "Lỗi hệ thống máy chủ",
  INVALID_TOKEN: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
  MISSING_CREDENTIALS: "Vui lòng nhập tài khoản và mật khẩu",
  INVALID_CREDENTIALS: "Sai tài khoản hoặc mật khẩu",
  MISSING_KEY: "Thiếu thông tin Mã Bản Quyền (License Key)",
  MISSING_DEVICE: "Thiếu thông tin Thiết Bị (Device ID)",
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
  SEED_SUCCESS: "Tạo Seed Data thành công! Bạn có thể xem các Sheet ở bên dưới."
};

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    if (action === 'admin_login') return adminLogin(params);

    if (action && action.startsWith('admin_')) {
      if (!validateAdminToken(params.admin_token)) {
        return jsonResponse({ error: Messages.INVALID_TOKEN, code: HttpCode.UNAUTHORIZED });
      }
      if (action === 'admin_get_users') return adminGetUsers();
      if (action === 'admin_create_key') return adminCreateKey(params);
      if (action === 'admin_revoke_key') return adminRevokeKey(params);
      if (action === 'admin_delete_key') return adminDeleteKey(params);
      if (action === 'admin_update_key') return adminUpdateKey(params);
      if (action === 'admin_reset_device') return adminResetDevice(params);
      if (action === 'admin_get_config') return adminGetConfig();
      if (action === 'admin_update_config') return adminUpdateConfig(params);
      if (action === 'admin_get_api_keys') return adminGetApiKeys();
      if (action === 'admin_get_accounts') return adminGetAccounts();
      if (action === 'admin_update_api_keys') return updateApiKeys(params); // reuse same function since it just updates
      if (action === 'admin_add_account') return addAccount(params);
      if (action === 'admin_update_account') return updateAccountAdmin(params);
      if (action === 'admin_delete_account') return deleteAccountAdmin(params);
      if (action === 'admin_delete_api_keys') return deleteApiKeysAdmin(params);
      if (action === 'admin_update_account_status') return updateAccountStatus(params);
    }
    
    if (action === 'verify_key') return verifyKey(params);
    if (action === 'update_usage') return updateUsage(params);
    
    // New Settings endpoints
    if (action === 'get_api_keys') return getApiKeys(params);
    if (action === 'update_api_keys') return updateApiKeys(params);
    if (action === 'get_accounts') return getAccounts(params);
    if (action === 'add_account') return addAccount(params);
    if (action === 'update_account_status') return updateAccountStatus(params);
    
    return jsonResponse({ error: Messages.INVALID_ACTION, code: HttpCode.BAD_REQUEST });
  } catch (error) {
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
  const key = params.license_key;
  const device = params.device_id;
  
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY, code: HttpCode.BAD_REQUEST });
  if (!device) return jsonResponse({ error: Messages.MISSING_DEVICE, code: HttpCode.BAD_REQUEST });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();
  const quotas = getConfig();
  const maxDevices = parseInt(quotas.max_devices) || 1;
  
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);
  
  if (rowIndex > 0) {
    const row = data[rowIndex];
    const savedDeviceStr = row[UserCols.DEVICE_ID] || "[]";
    let savedDevices = [];
    
    try {
      savedDevices = JSON.parse(savedDeviceStr);
      if (!Array.isArray(savedDevices)) savedDevices = [];
    } catch (e) {
      savedDevices = savedDeviceStr ? [savedDeviceStr] : [];
    }
    
    if (!savedDevices.includes(device)) {
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
    
    const usage = getUsageData(key);
    
    return jsonResponse({
      status: currentStatus,
      plan_type: row[UserCols.PLAN_TYPE],
      expires_at: expiresAt || null,
      usage: usage,
      quotas: quotas
    });
  }
  
  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: 404 });
}

function updateUsage(params) {
  const key = params.license_key;
  const feature = params.feature;
  const amount = parseInt(params.amount) || 1;
  
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usersData = usersSheet.getDataRange().getValues();
  
  const isValid = usersData.some((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key && row[UserCols.STATUS] === StatusEnum.ACTIVE);
  if (!isValid) return jsonResponse({ error: Messages.KEY_REVOKED, code: HttpCode.FORBIDDEN });
  
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  const data = usageSheet.getDataRange().getValues();
  const usageIndex = data.findIndex((row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === key);
  
  if (usageIndex > 0) {
    const row = data[usageIndex];
    if (feature === 'video') usageSheet.getRange(usageIndex + 1, UsageCols.VIDEO + 1).setValue(parseInt(row[UsageCols.VIDEO] || 0) + amount);
    if (feature === 'image') usageSheet.getRange(usageIndex + 1, UsageCols.IMAGE + 1).setValue(parseInt(row[UsageCols.IMAGE] || 0) + amount);
    if (feature === 'voice') usageSheet.getRange(usageIndex + 1, UsageCols.VOICE + 1).setValue(parseInt(row[UsageCols.VOICE] || 0) + amount);
  } else {
    const newRow = [key, 0, 0, 0, new Date().toISOString()];
    if (feature === 'video') newRow[1] = amount;
    if (feature === 'image') newRow[2] = amount;
    if (feature === 'voice') newRow[3] = amount;
    usageSheet.appendRow(newRow);
  }
  
  return jsonResponse({ status: "success" });
}

function adminLogin(params) {
  const username = params.username;
  const password = params.password;
  
  if (!username || !password) return jsonResponse({ error: Messages.MISSING_CREDENTIALS });

  const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
  if (!adminsSheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });

  const data = adminsSheet.getDataRange().getValues();
  const adminIndex = data.findIndex((row, idx) => idx > 0 && row[0] == username && row[1] == password);
  
  if (adminIndex > 0) {
    const newToken = Utilities.getUuid();
    adminsSheet.getRange(adminIndex + 1, AdminCols.TOKEN + 1).setValue(newToken);
    return jsonResponse({ status: "success", token: newToken });
  }
  
  return jsonResponse({ error: Messages.INVALID_CREDENTIALS, code: HttpCode.UNAUTHORIZED });
}

function validateAdminToken(token) {
  if (!token) return false;
  const adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ADMINS);
  if (!adminsSheet) return false;
  
  const data = adminsSheet.getDataRange().getValues();
  return data.some((row, idx) => idx > 0 && row[AdminCols.TOKEN] === token);
}

function adminGetUsers() {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  
  const usersData = usersSheet.getDataRange().getValues();
  const usageData = usageSheet.getDataRange().getValues();
  
  const users = usersData.filter((row, idx) => idx > 0).map(row => {
    const key = row[1];
    const uRow = usageData.find((u, i) => i > 0 && u[0] === key);
    
    return {
      username: row[0],
      license_key: key,
      plan_type: row[UserCols.PLAN_TYPE],
      status: row[UserCols.STATUS],
      created_at: row[4],
      expires_at: row[UserCols.EXPIRES_AT],
      device_id: row[UserCols.DEVICE_ID],
      usage: uRow ? {
        video: uRow[UsageCols.VIDEO] || 0,
        image: uRow[UsageCols.IMAGE] || 0,
        voice: uRow[UsageCols.VOICE] || 0,
        last_reset: uRow[UsageCols.LAST_RESET]
      } : { video: 0, image: 0, voice: 0, last_reset: "" }
    };
  });
  
  return jsonResponse({ users: users });
}

function adminCreateKey(params) {
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const username = params.username || "Unknown";
  const planType = params.plan_type || PlanType.FREE;
  const newKey = Utilities.getUuid().split('-')[0].toUpperCase();
  
  const now = new Date().toISOString();
  usersSheet.appendRow([username, newKey, planType, StatusEnum.ACTIVE, now, "", "[]"]);
  
  return jsonResponse({ status: "success", message: Messages.SUCCESS_CREATED, license_key: newKey });
}

function adminRevokeKey(params) {
  const key = params.license_key;
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();
  
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);
  if (rowIndex > 0) {
    usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.REVOKED);
    return jsonResponse({ status: "success", message: Messages.SUCCESS_REVOKED });
  }
  
  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: 404 });
}

function adminDeleteKey(params) {
  const key = params.license_key;
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  
  const usersData = usersSheet.getDataRange().getValues();
  const rowIndex = usersData.findIndex((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);
  if (rowIndex > 0) usersSheet.deleteRow(rowIndex + 1);
  
  const usageData = usageSheet.getDataRange().getValues();
  const usageIndex = usageData.findIndex((row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === key);
  if (usageIndex > 0) usageSheet.deleteRow(usageIndex + 1);
  
  return jsonResponse({ status: "success", message: Messages.SUCCESS_DELETED });
}

function adminUpdateKey(params) {
  const key = params.license_key;
  const newPlan = params.plan_type;
  const newExpires = params.expires_at;
  const newStatus = params.status;
  
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();
  
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);
  if (rowIndex > 0) {
    if (newPlan) usersSheet.getRange(rowIndex + 1, UserCols.PLAN_TYPE + 1).setValue(newPlan);
    usersSheet.getRange(rowIndex + 1, UserCols.EXPIRES_AT + 1).setValue(newExpires || "");
    if (newStatus) {
      usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(newStatus);
    } else if (data[rowIndex][UserCols.STATUS] === StatusEnum.EXPIRED) {
      usersSheet.getRange(rowIndex + 1, UserCols.STATUS + 1).setValue(StatusEnum.ACTIVE);
    }
    return jsonResponse({ status: "success", message: Messages.SUCCESS_UPDATED });
  }
  
  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: 404 });
}

function adminResetDevice(params) {
  const key = params.license_key;
  if (!key) return jsonResponse({ error: Messages.MISSING_KEY });
  
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USERS);
  const data = usersSheet.getDataRange().getValues();
  
  const rowIndex = data.findIndex((row, idx) => idx > 0 && row[UserCols.LICENSE_KEY] === key);
  if (rowIndex > 0) {
    usersSheet.getRange(rowIndex + 1, UserCols.DEVICE_ID + 1).setValue("[]");
    return jsonResponse({ status: "success", message: Messages.SUCCESS_RESET });
  }
  
  return jsonResponse({ error: Messages.KEY_NOT_FOUND, code: 404 });
}

function adminGetConfig() {
  return jsonResponse({ config: getConfig() });
}

function adminUpdateConfig(params) {
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_CONFIG);
  if (!configSheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  let data = configSheet.getDataRange().getValues();
  
  Config.CONFIG_KEYS.forEach(keyName => {
    const val = params[keyName];
    if (val !== undefined) {
      const rowIndex = data.findIndex((row, idx) => idx > 0 && row[ConfigCols.KEY] === keyName);
      if (rowIndex > 0) {
        configSheet.getRange(rowIndex + 1, ConfigCols.VALUE + 1).setValue(val);
      } else {
        configSheet.appendRow([keyName, val]);
        data = configSheet.getDataRange().getValues();
      }
    }
  });
  
  return jsonResponse({ status: "success", config: getConfig() });
}

function getConfig() {
  const defaultConfig = { 
    free_video: 0, free_image: 0, free_voice: 0,
    pro_video: 0, pro_image: 0, pro_voice: 0, pro_unlimited: false
  };
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_CONFIG);
  if (!configSheet) return defaultConfig;
  
  const data = configSheet.getDataRange().getValues();
  const conf = { ...defaultConfig };
  
  data.filter((row, idx) => idx > 0).forEach(row => {
    const k = row[0];
    const v = row[1];
    
    if (k === "free_quota_video") conf.free_video = parseInt(v) || 0;
    if (k === "free_quota_image") conf.free_image = parseInt(v) || 0;
    if (k === "free_quota_voice") conf.free_voice = parseInt(v) || 0;
    if (k === "pro_quota_video") conf.pro_video = parseInt(v) || 0;
    if (k === "pro_quota_image") conf.pro_image = parseInt(v) || 0;
    if (k === "pro_quota_voice") conf.pro_voice = parseInt(v) || 0;
    if (k === "pro_unlimited") conf.pro_unlimited = (v === true || v === "true");
    if (k === "max_devices") conf.max_devices = parseInt(v) || 1;
  });
  
  return conf;
}

function getUsageData(key) {
  const usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_USAGE);
  if (!usageSheet) return { video: 0, image: 0, voice: 0, last_reset: "" };
  
  const data = usageSheet.getDataRange().getValues();
  const usageRow = data.find((row, idx) => idx > 0 && row[UsageCols.LICENSE_KEY] === key);
  
  if (usageRow) {
    return {
      video: usageRow[1] || 0,
      image: usageRow[2] || 0,
      voice: usageRow[3] || 0,
      last_reset: usageRow[4]
    };
  }
  return { video: 0, image: 0, voice: 0, last_reset: "" };
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function matchAssignedTo(rowAssignedTo, licenseKey, planType) {
  if (!rowAssignedTo) return false;
  if (rowAssignedTo === "ALL") return true;
  if (planType && rowAssignedTo === planType) return true;
  if (licenseKey && rowAssignedTo === licenseKey) return true;
  return false;
}

function getApiKeys(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const licenseKey = params.license_key || "";
  const planType = params.plan_type || "";

  const data = sheet.getDataRange().getValues();
  let geminiKey = "";
  let ai33Key = "";
  
  // Chúng ta sẽ ưu tiên gán theo thứ tự: ALL -> PlanType -> LicenseKey
  // Bằng cách duyệt và cập nhật liên tục nếu độ ưu tiên cao hơn
  let geminiPriority = -1;
  let ai33Priority = -1;
  
  const getPriority = (assigned) => {
    if (assigned === "ALL") return 0;
    if (assigned === planType) return 1;
    if (assigned === licenseKey) return 2;
    return -1;
  };

  for (let i = 1; i < data.length; i++) {
    const k = data[i][KeysCols.KEY];
    const v = data[i][KeysCols.VALUE] || "";
    const assigned = data[i][KeysCols.ASSIGNED_TO] || "ALL";
    const prio = getPriority(assigned);
    
    if (prio !== -1) {
      if (k === "GEMINI_API_KEY" && prio >= geminiPriority) {
        geminiKey = v;
        geminiPriority = prio;
      }
      if (k === "AI33_API_KEY" && prio >= ai33Priority) {
        ai33Key = v;
        ai33Priority = prio;
      }
    }
  }
  
  return jsonResponse({ apiKeys: { geminiKey, ai33Key } });
}

function adminGetApiKeys() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const data = sheet.getDataRange().getValues();
  const keys = [];
  for (let i = 1; i < data.length; i++) {
    keys.push({
      id: i,
      key: data[i][KeysCols.KEY] || "",
      value: data[i][KeysCols.VALUE] || "",
      assignedTo: data[i][KeysCols.ASSIGNED_TO] || "ALL"
    });
  }
  return jsonResponse({ keys });
}

function updateApiKeys(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const { geminiKey, ai33Key, assignedTo = "ALL" } = params;
  const data = sheet.getDataRange().getValues();
  
  const updateOrAdd = (key, value) => {
    // Chỉ ghi đè nếu tồn tại cùng AssignedTo
    const rowIndex = data.findIndex((row, idx) => idx > 0 && row[KeysCols.KEY] === key && (row[KeysCols.ASSIGNED_TO] || "ALL") === assignedTo);
    if (rowIndex > 0) {
      sheet.getRange(rowIndex + 1, KeysCols.VALUE + 1).setValue(value || "");
    } else {
      sheet.appendRow([key, value || "", assignedTo]);
    }
  };
  
  updateOrAdd("GEMINI_API_KEY", geminiKey);
  updateOrAdd("AI33_API_KEY", ai33Key);
  
  return jsonResponse({ status: "success" });
}

function deleteApiKeysAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_KEYS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const { assignedTo } = params;
  if (!assignedTo) return jsonResponse({ error: "Thiếu assignedTo", code: HttpCode.BAD_REQUEST });
  
  const data = sheet.getDataRange().getValues();
  // Xóa từ dưới lên để không bị lệch index
  for (let i = data.length - 1; i > 0; i--) {
    if ((data[i][KeysCols.ASSIGNED_TO] || "ALL") === assignedTo) {
      sheet.deleteRow(i + 1);
    }
  }
  
  return jsonResponse({ status: "success" });
}

function getAccounts(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const licenseKey = params.license_key || "";
  const planType = params.plan_type || "";

  const data = sheet.getDataRange().getValues();
  const accounts = [];
  for (let i = 1; i < data.length; i++) {
    const assigned = data[i][AccountsCols.ASSIGNED_TO] || "ALL";
    if (matchAssignedTo(assigned, licenseKey, planType)) {
      accounts.push({
        id: i, // row index
        email: data[i][AccountsCols.EMAIL] || "",
        password: data[i][AccountsCols.PASSWORD] || "",
        recoveryEmail: data[i][AccountsCols.RECOVERY_EMAIL] || "",
        status: data[i][AccountsCols.STATUS] || "Active",
        assignedTo: assigned
      });
    }
  }
  return jsonResponse({ accounts });
}

function adminGetAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const data = sheet.getDataRange().getValues();
  const accounts = [];
  for (let i = 1; i < data.length; i++) {
    accounts.push({
      id: i,
      email: data[i][AccountsCols.EMAIL] || "",
      password: data[i][AccountsCols.PASSWORD] || "",
      recoveryEmail: data[i][AccountsCols.RECOVERY_EMAIL] || "",
      status: data[i][AccountsCols.STATUS] || "Active",
      assignedTo: data[i][AccountsCols.ASSIGNED_TO] || "ALL"
    });
  }
  return jsonResponse({ accounts });
}

function addAccount(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const acc = params.account;
  if (!acc || !acc.email) return jsonResponse({ error: "Thiếu thông tin tài khoản", code: HttpCode.BAD_REQUEST });
  
  sheet.appendRow([acc.email, acc.password || "", acc.recoveryEmail || "", acc.status || "Active", acc.assignedTo || "ALL"]);
  return jsonResponse({ status: "success" });
}

function updateAccountStatus(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const { rowIndex, status } = params;
  if (!rowIndex || !status) return jsonResponse({ error: "Thiếu thông tin", code: HttpCode.BAD_REQUEST });
  
  sheet.getRange(rowIndex + 1, AccountsCols.STATUS + 1).setValue(status);
  return jsonResponse({ status: "success" });
}

function updateAccountAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const acc = params.account;
  if (!acc || !acc.id || !acc.email) return jsonResponse({ error: "Thiếu thông tin tài khoản", code: HttpCode.BAD_REQUEST });
  
  sheet.getRange(acc.id + 1, AccountsCols.EMAIL + 1).setValue(acc.email);
  sheet.getRange(acc.id + 1, AccountsCols.PASSWORD + 1).setValue(acc.password || "");
  sheet.getRange(acc.id + 1, AccountsCols.RECOVERY_EMAIL + 1).setValue(acc.recoveryEmail || "");
  sheet.getRange(acc.id + 1, AccountsCols.ASSIGNED_TO + 1).setValue(acc.assignedTo || "ALL");
  
  return jsonResponse({ status: "success" });
}

function deleteAccountAdmin(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(Config.SHEET_ACCOUNTS);
  if (!sheet) return jsonResponse({ error: Messages.SHEET_NOT_FOUND });
  
  const { rowIndex } = params;
  if (!rowIndex) return jsonResponse({ error: "Thiếu thông tin rowIndex", code: HttpCode.BAD_REQUEST });
  
  sheet.deleteRow(rowIndex + 1);
  return jsonResponse({ status: "success" });
}

function setupSeedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let adminSheet = ss.getSheetByName(Config.SHEET_ADMINS);
  if (!adminSheet) {
    adminSheet = ss.insertSheet(Config.SHEET_ADMINS);
    adminSheet.appendRow(["username", "password", "token"]);
    adminSheet.appendRow(["admin", "admin", ""]);
    adminSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#d9ead3");
  }

  let configSheet = ss.getSheetByName(Config.SHEET_CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(Config.SHEET_CONFIG);
    configSheet.appendRow(["key", "value"]);
    const configs = [
      ["free_quota_video", 3],
      ["free_quota_image", 10],
      ["free_quota_voice", 5000],
      ["pro_quota_video", 50],
      ["pro_quota_image", 500],
      ["pro_quota_voice", 100000],
      ["pro_unlimited", false],
      ["max_devices", 2]
    ];
    configs.forEach(cfg => configSheet.appendRow(cfg));
    configSheet.getRange("A1:B1").setFontWeight("bold").setBackground("#c9daf8");
  }

  let usersSheet = ss.getSheetByName(Config.SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(Config.SHEET_USERS);
    usersSheet.appendRow(["username", "license_key", "plan_type", "status", "created_at", "expires_at", "device_id"]);
    const now = new Date().toISOString();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    usersSheet.appendRow(["Khách FREE", "FREE-12345", "FREE", StatusEnum.ACTIVE, now, "", "[]"]);
    usersSheet.appendRow(["Khách PRO", "PRO-99999", "PRO", StatusEnum.ACTIVE, now, nextYear.toISOString(), "[]"]);
    usersSheet.appendRow(["Khách VIP", "PRO-LIFE", "PRO_LIFETIME", StatusEnum.ACTIVE, now, "", "[]"]);
    
    usersSheet.getRange("A1:G1").setFontWeight("bold").setBackground("#fff2cc");
  }

  let usageSheet = ss.getSheetByName(Config.SHEET_USAGE);
  if (!usageSheet) {
    usageSheet = ss.insertSheet(Config.SHEET_USAGE);
    usageSheet.appendRow(["license_key", "video_count", "image_count", "voice_chars", "last_reset"]);
    const nowStr = new Date().toISOString();
    usageSheet.appendRow(["FREE-12345", 0, 0, 0, nowStr]);
    usageSheet.appendRow(["PRO-99999", 5, 20, 1000, nowStr]);
    usageSheet.appendRow(["PRO-LIFE", 10, 50, 5000, nowStr]);
    usageSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#fce5cd");
  }

  let keysSheet = ss.getSheetByName(Config.SHEET_KEYS);
  if (!keysSheet) {
    keysSheet = ss.insertSheet(Config.SHEET_KEYS);
    keysSheet.appendRow(["Key", "Value", "AssignedTo"]);
    keysSheet.appendRow(["GEMINI_API_KEY", "", "ALL"]);
    keysSheet.appendRow(["AI33_API_KEY", "", "ALL"]);
    keysSheet.getRange("A1:C1").setFontWeight("bold").setBackground("#d9ead3");
  }

  let accountsSheet = ss.getSheetByName(Config.SHEET_ACCOUNTS);
  if (!accountsSheet) {
    accountsSheet = ss.insertSheet(Config.SHEET_ACCOUNTS);
    accountsSheet.appendRow(["Email", "Password", "RecoveryEmail", "Status", "AssignedTo"]);
    accountsSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#c9daf8");
  }

  SpreadsheetApp.getUi().alert(Messages.SEED_SUCCESS);
}
