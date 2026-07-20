export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
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

export const SecurityConstants = {
  LOCAL_STORAGE_LICENSE_KEY: 'vidify_license_key',
  GAS_API_URL: process.env.GAS_API_URL || '',
  DEVICE_ID_FILE_NAME: 'device_id.json',
  HEADER_LICENSE_KEY: 'x-license-key',
  TOAST_DURATION: 3000,
};

export const SecurityMessages = {
  MISSING_LICENSE_KEY: 'Missing License Key',
  INVALID_OR_REVOKED_LICENSE: 'Invalid or Revoked License',
  QUOTA_EXCEEDED_TEMPLATE: 'You have reached the limit for {0} generation on your {1}.',
  PRO_PLAN: 'Pro plan',
  FREE_PLAN: 'Free plan',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  INVALID_TOKEN: 'Invalid token',
  LICENSE_VALIDATION_ERROR: 'License Validation Error:',
  FAILED_TO_CONNECT: 'Failed to connect to License Server:',
  USAGE_UPDATE_ERROR: 'Usage Update Error:',
  FAILED_TO_UPDATE_USAGE: 'Failed to update usage:',
  ERROR_READING_DEVICE_ID: 'Error reading device_id.json',
  ACTIVATING_MESSAGE: 'Đang kiểm tra bản quyền...',
  ACTIVATION_TITLE: 'Kích Hoạt Bản Quyền',
  ACTIVATION_SUBTITLE: 'Vui lòng nhập License Key để sử dụng Vidify',
  INPUT_PLACEHOLDER: 'Nhập License Key (VD: PRO-123...)',
  ACTIVATION_ERROR_MSG: 'Mã kích hoạt không hợp lệ, hoặc thiết bị bị từ chối.',
  ACTIVATION_SUCCESS_MSG: 'Kích hoạt thành công!',
  ACTIVATING_BUTTON: 'Đang kích hoạt...',
  ACTIVATE_BUTTON: 'Kích Hoạt Ngay',
  PRO_VERSION: '👑 PRO Version',
  FREE_VERSION: '🆓 FREE Version',
  CHANGE_KEY: 'Đổi Key',
  TOAST_ERROR: 'Lỗi',
  TOAST_SUCCESS: 'Thành Công'
};
