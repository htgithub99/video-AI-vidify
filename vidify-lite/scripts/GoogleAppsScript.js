/**
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Tạo 1 file Google Sheets mới.
 * 2. Đổi tên Sheet 1 thành "Users", tạo dòng đầu (Header): username | license_key | plan_type | status | created_at | expires_at
 * 3. Tạo Sheet 2 tên "Usage", tạo dòng đầu (Header): license_key | video_count | image_count | voice_chars | last_reset
 * 4. Tạo Sheet 3 tên "Config", tạo dòng đầu (Header): key | value
 *    (Các key dự kiến: free_quota_video, free_quota_image, free_quota_voice, pro_quota_video, pro_quota_image, pro_quota_voice, pro_unlimited)
 * 5. Tạo Sheet 4 tên "Admins", tạo dòng đầu (Header): username | password | token
 *    (Điền sẵn 1 dòng tài khoản Admin của bạn vào cột A và B. Cột C để trống)
 * 6. Vào menu Tiện ích mở rộng (Extensions) -> Apps Script.
 * 7. Xóa hết code cũ, dán toàn bộ đoạn code này vào.
 * 8. Bấm "Triển khai" (Deploy) -> "Bản triển khai mới" (New deployment).
 * 9. Chọn loại: Ứng dụng web (Web app).
 * 10. Quyền truy cập: "Bất kỳ ai" (Anyone).
 * 11. Copy cái URL cấp phát lại (Web App URL) để dùng cho Ứng dụng và Admin Dashboard.
 */

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    
    if (action === 'admin_login') return adminLogin(params);

    // --- ADMIN ACTIONS ---
    if (action.startsWith('admin_')) {
      if (!validateAdminToken(params.admin_token)) {
        return jsonResponse({ error: "Invalid or Expired Session Token", code: 401 });
      }
      if (action === 'admin_get_users') return adminGetUsers();
      if (action === 'admin_create_key') return adminCreateKey(params);
      if (action === 'admin_revoke_key') return adminRevokeKey(params);
      if (action === 'admin_delete_key') return adminDeleteKey(params);
      if (action === 'admin_update_key') return adminUpdateKey(params);
      if (action === 'admin_reset_device') return adminResetDevice(params);
      if (action === 'admin_get_config') return adminGetConfig();
      if (action === 'admin_update_config') return adminUpdateConfig(params);
    }
    
    // --- CLIENT ACTIONS ---
    if (action === 'verify_key') return verifyKey(params);
    if (action === 'update_usage') return updateUsage(params);
    
    return jsonResponse({ error: "Invalid action", code: 400 });
  } catch (error) {
    return jsonResponse({ error: error.toString(), code: 500 });
  }
}

// Bật CORS cho phép gọi từ trình duyệt
function doOptions(e) {
  return jsonResponse({ status: "ok" });
}
function doGet(e) {
  return jsonResponse({ status: "API is running. Please use POST method." });
}

// ============================================
// CLIENT FUNCTIONS
// ============================================

function verifyKey(params) {
  var key = params.license_key;
  var device = params.device_id;
  
  if (!key) return jsonResponse({ error: "Missing license_key", code: 400 });
  if (!device) return jsonResponse({ error: "Missing device_id", code: 400 });
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = usersSheet.getDataRange().getValues();
  var quotas = getConfig();
  var maxDevices = parseInt(quotas.max_devices) || 1;
  
  for (var i = 1; i < data.length; i++) { // Bỏ qua Header
    if (data[i][1] === key) {
      
      var savedDeviceStr = data[i][7] || "[]";
      var savedDevices = [];
      try {
        savedDevices = JSON.parse(savedDeviceStr);
        if (!Array.isArray(savedDevices)) savedDevices = [];
      } catch (e) {
        // Nếu chuỗi cũ không phải JSON (VD: thiết bị cũ), convert thành mảng 1 phần tử
        savedDevices = savedDeviceStr ? [savedDeviceStr] : [];
      }
      
      if (savedDevices.indexOf(device) === -1) {
         // Thiết bị chưa có trong danh sách
         if (savedDevices.length < maxDevices) {
            savedDevices.push(device);
            usersSheet.getRange(i + 1, 8).setValue(JSON.stringify(savedDevices));
         } else {
            return jsonResponse({ error: "Mã kích hoạt đã đạt giới hạn số thiết bị cho phép (" + maxDevices + ")", code: 403 });
         }
      }

      if (data[i][3] !== 'ACTIVE') {
        return jsonResponse({ error: "License is revoked or expired", code: 403, status: data[i][3] });
      }

      // Check Expiration
      var expiresAt = data[i][5];
      if (expiresAt) {
        var expiryDate = new Date(expiresAt);
        if (new Date() > expiryDate) {
          usersSheet.getRange(i + 1, 4).setValue("EXPIRED");
          return jsonResponse({ error: "License has expired", code: 403, status: "EXPIRED" });
        }
      }
      
      // Lấy thông tin Usage hiện tại
      var usage = getUsageData(key);
      
      return jsonResponse({
        status: "ACTIVE",
        plan_type: data[i][2],
        expires_at: expiresAt || null,
        usage: usage,
        quotas: quotas
      });
    }
  }
  return jsonResponse({ error: "License key not found", code: 404 });
}

function updateUsage(params) {
  var key = params.license_key;
  var feature = params.feature; // "video", "image", "voice"
  var amount = parseInt(params.amount) || 1;
  
  if (!key) return jsonResponse({ error: "Missing license_key" });
  
  // Xác minh key trước
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var usersData = usersSheet.getDataRange().getValues();
  var isValid = false;
  var planType = 'FREE';
  
  for (var i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === key && usersData[i][3] === 'ACTIVE') {
      isValid = true;
      planType = usersData[i][2];
      break;
    }
  }
  
  if (!isValid) return jsonResponse({ error: "Invalid or revoked key", code: 403 });
  
  // Cập nhật Usage
  var usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage");
  var data = usageSheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      found = true;
      if (feature === 'video') usageSheet.getRange(i + 1, 2).setValue(parseInt(data[i][1] || 0) + amount);
      if (feature === 'image') usageSheet.getRange(i + 1, 3).setValue(parseInt(data[i][2] || 0) + amount);
      if (feature === 'voice') usageSheet.getRange(i + 1, 4).setValue(parseInt(data[i][3] || 0) + amount);
      break;
    }
  }
  
  if (!found) {
    // Tạo dòng mới
    var newRow = [key, 0, 0, 0, new Date().toISOString()];
    if (feature === 'video') newRow[1] = amount;
    if (feature === 'image') newRow[2] = amount;
    if (feature === 'voice') newRow[3] = amount;
    usageSheet.appendRow(newRow);
  }
  
  return jsonResponse({ status: "success" });
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

function adminLogin(params) {
  var username = params.username;
  var password = params.password;
  if (!username || !password) return jsonResponse({ error: "Missing username or password" });

  var adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Admins");
  if (!adminsSheet) return jsonResponse({ error: "Admins sheet not found" });

  var data = adminsSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == username && data[i][1] == password) {
      var newToken = Utilities.getUuid();
      adminsSheet.getRange(i + 1, 3).setValue(newToken); // Lưu token mới vào cột 3
      return jsonResponse({ status: "success", token: newToken });
    }
  }
  return jsonResponse({ error: "Invalid username or password", code: 401 });
}

function validateAdminToken(token) {
  if (!token) return false;
  var adminsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Admins");
  if (!adminsSheet) return false;
  
  var data = adminsSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] == token) return true;
  }
  return false;
}

function adminGetUsers() {
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage");
  
  var usersData = usersSheet.getDataRange().getValues();
  var usageData = usageSheet.getDataRange().getValues();
  
  var result = [];
  for (var i = 1; i < usersData.length; i++) {
    var key = usersData[i][1];
    if (!key) continue;
    
    // Tìm usage
    var usage = { video: 0, image: 0, voice: 0 };
    for (var j = 1; j < usageData.length; j++) {
      if (usageData[j][0] === key) {
        usage = {
          video: usageData[j][1] || 0,
          image: usageData[j][2] || 0,
          voice: usageData[j][3] || 0
        };
        break;
      }
    }
    
    result.push({
      username: usersData[i][0],
      license_key: key,
      plan_type: usersData[i][2],
      status: usersData[i][3],
      created_at: usersData[i][4],
      expires_at: usersData[i][5] || null,
      device_id: usersData[i][7] || "[]",
      usage: usage
    });
  }
  return jsonResponse({ users: result });
}

function adminCreateKey(params) {
  var username = params.username;
  var planType = params.plan_type || "FREE"; // "FREE", "PRO_LIFETIME", "PRO_MONTHLY", "PRO_WEEKLY"
  if (!username) return jsonResponse({ error: "Missing username" });
  
  var prefix = planType.indexOf("PRO") !== -1 ? "PRO-" : "FREE-";
  var newKey = prefix + Utilities.getUuid().toString().toUpperCase().substring(0, 15);
  var createdAt = new Date();
  var expiresAt = "";
  
  if (planType === "PRO_MONTHLY") {
    var d = new Date(createdAt);
    d.setDate(d.getDate() + 30);
    expiresAt = d.toISOString();
  } else if (planType === "PRO_WEEKLY") {
    var d = new Date(createdAt);
    d.setDate(d.getDate() + 7);
    expiresAt = d.toISOString();
  }
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  usersSheet.appendRow([username, newKey, planType, "ACTIVE", createdAt.toISOString(), expiresAt, "", "[]"]);
  
  var usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage");
  usageSheet.appendRow([newKey, 0, 0, 0, createdAt.toISOString()]);
  
  return jsonResponse({ status: "success", license_key: newKey });
}

function adminRevokeKey(params) {
  var key = params.license_key;
  if (!key) return jsonResponse({ error: "Missing license_key" });
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === key) {
      usersSheet.getRange(i + 1, 4).setValue("REVOKED");
      return jsonResponse({ status: "success", message: "Key has been revoked" });
    }
  }
  return jsonResponse({ error: "Key not found", code: 404 });
}

function adminDeleteKey(params) {
  var key = params.license_key;
  if (!key) return jsonResponse({ error: "Missing license_key" });
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage");
  
  // Xóa từ Users
  var usersData = usersSheet.getDataRange().getValues();
  for (var i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === key) {
      usersSheet.deleteRow(i + 1);
      break;
    }
  }
  
  // Xóa từ Usage
  var usageData = usageSheet.getDataRange().getValues();
  for (var j = 1; j < usageData.length; j++) {
    if (usageData[j][0] === key) {
      usageSheet.deleteRow(j + 1);
      break;
    }
  }
  
  return jsonResponse({ status: "success", message: "Key hard deleted" });
}

function adminUpdateKey(params) {
  var key = params.license_key;
  var newPlan = params.plan_type;
  var newExpires = params.expires_at; // chuỗi ISO hoặc rỗng
  
  if (!key) return jsonResponse({ error: "Missing license_key" });
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var usersData = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === key) {
      if (newPlan) usersSheet.getRange(i + 1, 3).setValue(newPlan);
      usersSheet.getRange(i + 1, 6).setValue(newExpires || "");
      // Chuyển lại trạng thái ACTIVE nếu đang EXPIRED hoặc REVOKED (tùy chọn)
      if (usersData[i][3] === "EXPIRED") {
        usersSheet.getRange(i + 1, 4).setValue("ACTIVE");
      }
      return jsonResponse({ status: "success", message: "Key updated" });
    }
  }
  return jsonResponse({ error: "Key not found", code: 404 });
}

function adminResetDevice(params) {
  var key = params.license_key;
  if (!key) return jsonResponse({ error: "Missing license_key" });
  
  var usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === key) {
      usersSheet.getRange(i + 1, 8).setValue("[]");
      return jsonResponse({ status: "success", message: "Device ID reset successful" });
    }
  }
  return jsonResponse({ error: "Key not found", code: 404 });
}

function adminGetConfig() {
  return jsonResponse({ config: getConfig() });
}

function adminUpdateConfig(params) {
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  if (!configSheet) return jsonResponse({ error: "Config sheet not found" });
  
  var keys = [
    "free_quota_video", "free_quota_image", "free_quota_voice",
    "pro_quota_video", "pro_quota_image", "pro_quota_voice", "pro_unlimited"
  ];
  var data = configSheet.getDataRange().getValues();
  
  for (var k = 0; k < keys.length; k++) {
    var keyName = keys[k];
    var val = params[keyName];
    if (val === undefined) continue;
    
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === keyName) {
        configSheet.getRange(i + 1, 2).setValue(val);
        found = true;
        break;
      }
    }
    if (!found) {
      configSheet.appendRow([keyName, val]);
      data = configSheet.getDataRange().getValues(); // refresh
    }
  }
  return jsonResponse({ status: "success", config: getConfig() });
}

// ============================================
// UTILS
// ============================================

function getConfig() {
  var defaultConfig = { 
    free_video: 0, free_image: 0, free_voice: 0,
    pro_video: 0, pro_image: 0, pro_voice: 0, pro_unlimited: false
  };
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");
  if (!configSheet) return defaultConfig;
  
  var data = configSheet.getDataRange().getValues();
  var conf = { ...defaultConfig };
  for (var i = 1; i < data.length; i++) {
    var k = data[i][0];
    var v = data[i][1];
    
    if (k === "free_quota_video") conf.free_video = parseInt(v) || 0;
    if (k === "free_quota_image") conf.free_image = parseInt(v) || 0;
    if (k === "free_quota_voice") conf.free_voice = parseInt(v) || 0;
    if (k === "pro_quota_video") conf.pro_video = parseInt(v) || 0;
    if (k === "pro_quota_image") conf.pro_image = parseInt(v) || 0;
    if (k === "pro_quota_voice") conf.pro_voice = parseInt(v) || 0;
    if (k === "pro_unlimited") conf.pro_unlimited = (v === true || v === "true");
  }
  return conf;
}

function getUsageData(key) {
  var usageSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Usage");
  var data = usageSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return {
        video: data[i][1] || 0,
        image: data[i][2] || 0,
        voice: data[i][3] || 0,
        last_reset: data[i][4]
      };
    }
  }
  return { video: 0, image: 0, voice: 0, last_reset: "" };
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
