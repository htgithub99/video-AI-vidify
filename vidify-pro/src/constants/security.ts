export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum GasActions {
  GET_API_KEYS = 'get_api_keys',
  GET_ACCOUNTS = 'get_accounts',
  UPDATE_API_KEYS = 'update_api_keys',
  ADD_ACCOUNT = 'add_account',
  UPDATE_ACCOUNT_STATUS = 'update_account_status',
  VERIFY_KEY = 'verify_key',
  UPDATE_USAGE = 'update_usage',
}

export enum AccountStatus {
  ACTIVE = 'Active',
  ERROR = 'Error',
}

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  PRO_LIFETIME = 'PRO_LIFETIME',
  PRO_MONTHLY = 'PRO_MONTHLY',
  PRO_WEEKLY = 'PRO_WEEKLY',
}

export enum FeatureType {
  VIDEO = 'video',
  IMAGE = 'image',
  VOICE = 'voice',
}

const _xor = (encodedHex: string): string => {
  const key = 'vidify_secret_key_2026';
  try {
    let result = '';
    for (let i = 0; i < encodedHex.length; i += 2) {
      const byte = parseInt(encodedHex.substring(i, i + 2), 16);
      const keyChar = key.charCodeAt((i / 2) % key.length);
      result += String.fromCharCode(byte ^ keyChar);
    }
    return result;
  } catch (e) {}
  return '';
};

export const SecurityConstants = {
  get ADMIN_APP_KEY() { return _xor('202c20202020003e243026202600202020006a696869475b57'); },
  LOCAL_STORAGE_LICENSE_KEY: 'vidify_license_key',
  get GAS_API_URL() { return _xor('1e1d10191543705c1600000c042b45021630555c5718150609460b183c010a105d165b1e2003003c504a7975302e0d1d271a0b2a323b442e331c3b5736137e6a64591b5b20241f302a215c3920532d1226394c3c7f62500335515c2532113b233c342b5c171659522c26645e1d530e0c07'); },
  DEVICE_ID_FILE_NAME: 'device_id.json',
  HEADER_LICENSE_KEY: 'x-license-key',
  TOAST_DURATION: 3000,
  LICENSE_MISSING_CODE: 'LICENSE_MISSING',
  LICENSE_INVALID_CODE: 'LICENSE_INVALID',
  LICENSE_INACTIVE_CODE: 'LICENSE_INACTIVE',
  QUOTA_EXCEEDED_CODE: 'QUOTA_EXCEEDED',
  LICENSE_INFO_KEY: 'licenseInfo',
  QUOTAS_PRO_UNLIMITED: 'quotas.pro_unlimited',
  QUOTAS_LIFETIME_UNLIMITED: 'quotas.lifetime_unlimited',
  USAGE_PREFIX: 'usage.',
  QUOTAS_PRO_PREFIX: 'quotas.pro_',
  QUOTAS_FREE_PREFIX: 'quotas.free_',
  QUOTAS_LIFETIME_PREFIX: 'quotas.lifetime_',
  HTTP_POST: 'POST',
  CONTENT_TYPE_JSON: 'application/json',
  UTF8_ENCODING: 'utf8',
  QUOTA_TYPE_TOTAL: 'TOTAL',
  QUOTA_TYPE_DAILY: 'DAILY',
  UNKNOWN_PLAN_NAME: 'UNKNOWN',
  HTTP_BAD_REQUEST: 400,
  ACCEPT_ALL_JSON: 'application/json, text/plain, */*',
  FETCH_VOICES_FALLBACK_WARN: 'External voice registry load failed. Falling back to high-quality local voices database.',
  DIVIDER_LINE: '----------------------------------------------------',
  QUOTA_KEYWORD: 'quota',
  LIMITS_VIDEO: 'limits.video',
  LIMITS_IMAGE: 'limits.image',
  LIMITS_VOICE: 'limits.voice',
  LIMITS_UNLIMITED: 'limits.unlimited',
  USAGE_VIDEO: 'usage.video',
  USAGE_IMAGE: 'usage.image',
  USAGE_VOICE: 'usage.voice',
  USAGE_VIDEO_KEY: 'usage.video',
  USAGE_IMAGE_KEY: 'usage.image',
  USAGE_VOICE_KEY: 'usage.voice',
  ERROR_KEY: 'error',
  STATUS_KEY: 'status',
  PLAN_ID_KEY: 'plan.id',
  PLAN_NAME_KEY: 'plan.name',
  QUOTA_TYPE_KEY: 'quota_type',
  EXPIRES_AT_KEY: 'expires_at',
  PLAN_QUOTA_VIDEO: 'plan.quota_video',
  PLAN_QUOTA_IMAGE: 'plan.quota_image',
  PLAN_QUOTA_VOICE: 'plan.quota_voice',
  PLAN_IS_UNLIMITED: 'plan.is_unlimited',
  DEVICE_ID_KEY: 'deviceId',
  STORE_LICENSE_KEY: 'licenseKey',
  ALGORITHM_SHA256: 'sha256',
  ENCODING_HEX: 'hex',
  HEADER_CONTENT_TYPE: 'Content-Type',
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  HTTP_INTERNAL_ERROR: 500,
  DEFAULT_AMOUNT: 1,
  ZERO: 0,
  REQUIRE_LICENSE_ERROR_LOG: 'RequireLicense Middleware Error',
  THEME_LIGHT_TOOLTIP: 'Sáng',
  THEME_DARK_TOOLTIP: 'Tối',
  LOGOUT_KEY_TOOLTIP_VI: 'Đăng xuất & Đổi License Key mới',
  LOGOUT_KEY_TOOLTIP_EN: 'Logout & Change License Key',
  LOGOUT_KEY_LABEL_VI: 'Đổi Key',
  LOGOUT_KEY_LABEL_EN: 'Change Key',
  LICENSE_MGMT_TITLE_VI: 'Quản Lý Bản Quyền',
  LICENSE_MGMT_TITLE_EN: 'License Management',
  LICENSE_MGMT_TOOLTIP_VI: 'Quản Lý Bản Quyền (License Key)',
  LICENSE_MGMT_TOOLTIP_EN: 'License Key Management',
  PLAN_LABEL_VI: 'Gói',
  PLAN_LABEL_EN: 'Plan',
  ACTIVATED_LABEL_VI: 'Đã kích hoạt',
  ACTIVATED_LABEL_EN: 'Activated',
  NOT_AVAILABLE: 'N/A',
  LOGOUT_TOOLTIP_VI: 'Đăng xuất để nhập License Key mới',
  LOGOUT_TOOLTIP_EN: 'Log out to enter a new License Key',
  LOGOUT_LABEL_VI: 'Đăng xuất / Đổi Key',
  LOGOUT_LABEL_EN: 'Logout / Change Key',
  HYPHEN: '-',
  SUBSTRING_LEN_32: 32,
  DOT: '.',
  LIMITS_PREFIX_LOWER: 'limits',
  STORE_PLAN_TYPE_KEY: 'planType',
  KEY_PREVIEW_LEN: 10,
  ELLIPSIS: '...',
};

export const LocalizationConstants = {
  FEATURE_VIDEO: 'Video',
  FEATURE_IMAGE: 'Ảnh',
  FEATURE_VOICE: 'Giọng nói',
  PLAN_LIFETIME: 'Vĩnh Viễn',
  PLAN_PRO: 'PRO',
  PLAN_FREE: 'Miễn Phí',
};

export const SecurityMessages = {
  MISSING_LICENSE_KEY: 'Không tìm thấy Mã Bản Quyền (License Key). Vui lòng kích hoạt lại.',
  INVALID_OR_REVOKED_LICENSE: 'Tài khoản của bạn không hợp lệ hoặc đã bị khóa/hết hạn.',
  QUOTA_EXCEEDED_TEMPLATE: 'Bạn đã đạt giới hạn tạo {0} cho {1} hôm nay.',
  QUOTA_TOTAL_EXCEEDED: 'Tài khoản của bạn đã sử dụng hết giới hạn tạo {0} của gói {1}. Vui lòng nâng cấp hoặc mua thêm để tiếp tục!',
  QUOTA_DAILY_EXCEEDED: 'Bạn đã sử dụng hết lượt tạo {0} hôm nay (Gói {1}). Vui lòng quay lại vào ngày mai hoặc nâng cấp tài khoản!',
  INACTIVE_ACCOUNT_VIEW_ONLY: 'Tài khoản của bạn đã bị khóa hoặc hết hạn. Bạn chỉ có thể xem các dự án cũ.',
  PRO_PLAN: 'Gói Trả Phí (PRO)',
  FREE_PLAN: 'Gói Miễn Phí (FREE)',
  INTERNAL_SERVER_ERROR: 'Lỗi hệ thống máy chủ, vui lòng thử lại sau.',
  INVALID_TOKEN: 'Mã xác thực không hợp lệ',
  LICENSE_VALIDATION_ERROR: 'Lỗi xác thực bản quyền:',
  FAILED_TO_CONNECT: 'Không thể kết nối đến Máy chủ Bản quyền:',
  USAGE_UPDATE_ERROR: 'Lỗi cập nhật số lượt sử dụng:',
  FAILED_TO_UPDATE_USAGE: 'Không thể cập nhật số lượt sử dụng:',
  ERROR_READING_DEVICE_ID: 'Lỗi khi đọc file device_id.json',
  ACTIVATING_MESSAGE: 'Đang kiểm tra bản quyền...',
  ACTIVATION_TITLE: 'Kích Hoạt Bản Quyền',
  ACTIVATION_SUBTITLE: 'Vui lòng nhập License Key để sử dụng Vidify',
  INPUT_PLACEHOLDER: 'Nhập License Key (VD: PRO-123...)',
  ACTIVATION_ERROR_MSG: 'Mã kích hoạt không hợp lệ, hoặc thiết bị bị từ chối.',
  ACTIVATION_SUCCESS_MSG: 'Kích hoạt thành công!',
  ACTIVATING_BUTTON: 'Đang kích hoạt...',
  ACTIVATE_BUTTON: 'Kích Hoạt',
  PRO_VERSION: '✨ PRO Version',
  FREE_VERSION: '✨ FREE Version',
  CHANGE_KEY: 'Đổi Key',
  TOAST_ERROR: 'Lỗi',
  TOAST_SUCCESS: 'Thành Công',
  GAS_FETCH_ERROR: 'Lỗi lấy dữ liệu từ Google Apps Script',
  SAVE_API_KEYS_SUCCESS: 'Lưu API Keys thành công',
  SAVE_API_KEYS_ERROR: 'Lỗi khi lưu API Keys',
  MISSING_REQUEST_INFO: 'Thiếu thông tin yêu cầu.',
  ADD_ACCOUNT_SUCCESS: 'Thêm tài khoản thành công',
  ADD_ACCOUNT_ERROR: 'Lỗi khi thêm tài khoản',
  UPDATE_STATUS_SUCCESS: 'Cập nhật trạng thái thành công',
  UPDATE_ACCOUNT_ERROR: 'Lỗi khi cập nhật tài khoản',
  NO_ACTIVE_ACCOUNT: 'Không còn tài khoản Google nào ở trạng thái Active trong Pool.',
  TRY_ROTATING_ACCOUNT: 'Đang thử xoay vòng sang tài khoản: ',
  MARK_ACCOUNT_ERROR: 'Đăng nhập thất bại, đánh dấu tài khoản bị lỗi: ',
  ROTATION_ERROR: 'Lỗi trong quá trình xoay vòng tài khoản',
  REVOKED_STATUS: 'Tài khoản bị khóa (Chỉ xem)',
  EXPIRED_STATUS: 'Tài khoản hết hạn (Chỉ xem)',
  LICENSE_CHECK_ERROR: 'Lỗi kiểm tra bản quyền:',
  LICENSE_CONTEXT_ERROR: 'useLicense must be used within a LicenseProvider',
  MISSING_GEMINI_KEY: 'Chưa có Gemini API Key! Vui lòng nhập Key cá nhân hoặc cấu hình Key Admin trên Google Sheets.',
  MISSING_AI33_KEY: 'Chưa có AI33 API Key! Vui lòng nhập Key cá nhân hoặc cấu hình Key Admin trên Google Sheets.',
  LOG_USING_ADMIN_GEMINI_KEY: '[APIKEY_RESOLVER] Using Admin Gemini Key from Google Sheets',
  LOG_USING_ADMIN_AI33_KEY: '[APIKEY_RESOLVER] Using Admin AI33 Key from Google Sheets',
  LOG_RESOLVER_ERROR: '[APIKEY_RESOLVER] Failed to fetch Admin API Keys from Google Sheets'
};

export const AutoLoginConstants = {
  URLS: {
    SIGN_IN: 'https://accounts.google.com/signin/v2/identifier?hl=en',
    LOGOUT: 'https://accounts.google.com/Logout',
    SIGN_IN_KEYWORD: 'signin',
  },
  SELECTORS: {
    EMAIL_INPUT: 'input[type="email"]',
    PWD_INPUT: 'input[type="password"]',
    NO_ACCOUNT_TEXT: "text=Couldn't find your Google Account",
    CONFIRM_RECOVERY_TEXT: 'text=Confirm your recovery email',
    VERIFY_IT_IS_YOU: "text=Verify it's you",
  },
  LOGS: {
    START_LOGIN: 'Bắt đầu đăng nhập tài khoản: ',
    SESSION_EXISTS: 'Trình duyệt đã có phiên đăng nhập, thử đăng xuất hoặc dùng account hiện tại...',
    VERIFY_RECOVERY: 'Đang xác minh Recovery Email...',
    LOGIN_SUCCESS: 'Đăng nhập thành công: ',
    LOGIN_ERROR: 'Lỗi đăng nhập ',
  },
  ERRORS: {
    NO_ACCOUNT: 'Tài khoản không tồn tại.',
    MISSING_RECOVERY: 'Cần nhập Recovery Email nhưng chưa cấu hình.',
    IDENTITY_VERIFY: 'Tài khoản bị bắt xác minh danh tính (Verify it\'s you).',
  }
};

export const ImageGenMessages = {
  LABS_NO_PROJECT: '[Google Labs] Không có projectId, đang truy cập để tạo dự án mới...',
  LABS_CREATED_PROJECT: '[Google Labs] Đã tạo dự án mới thành công: ',
  LABS_CREATE_ERR: 'Không thể lấy ID dự án sau khi tạo mới.',
  IMG_GEN_ERROR: 'Phát hiện lỗi tạo ảnh, tiến hành xoay vòng tài khoản...',
  GEMINI_CHAT_ERROR: 'Phát hiện lỗi Gemini Chat, tiến hành xoay vòng tài khoản...',
  INJECT_HELPERS_ERR: 'Failed to inject helpers on current page context:',
  IMAGE_RENDER_ERR: '[Image Render] Attempt {0} failed: {1}',
  IMAGE_RENDER_GLOBAL_ERR: '[Image Render] Error in generateImageWithPlaywright: ',
};

export const AppLogger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

export const UIConstants = {
  INFINITY: '∞',
  LANG_VI: 'VI',
  LANG_EN: 'EN'
};
