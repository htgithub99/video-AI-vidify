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
  GAS_API_URL: 'https://script.google.com/macros/s/AKfycbx26p481i1m5HpuPDIlsaupE16Qf5-9WuO-1EU3c0UUdaWaaAEXY97pwW0x514XsBg/exec',
  DEVICE_ID_FILE_NAME: 'device_id.json',
  HEADER_LICENSE_KEY: 'x-license-key',
  TOAST_DURATION: 3000,
  LICENSE_MISSING_CODE: 'LICENSE_MISSING',
  LICENSE_INVALID_CODE: 'LICENSE_INVALID',
  LICENSE_INACTIVE_CODE: 'LICENSE_INACTIVE',
  QUOTA_EXCEEDED_CODE: 'QUOTA_EXCEEDED'
};

export const SecurityMessages = {
  MISSING_LICENSE_KEY: 'Không tìm thấy Mã Bản Quyền (License Key). Vui lòng kích hoạt lại.',
  INVALID_OR_REVOKED_LICENSE: 'Tài khoản của bạn không hợp lệ hoặc đã bị khóa/hết hạn.',
  QUOTA_EXCEEDED_TEMPLATE: 'Bạn đã đạt giới hạn tạo {0} cho {1} hôm nay.',
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
  ACTIVATE_BUTTON: 'Kích Hoạt Ngay',
  PRO_VERSION: '✨ PRO Version',
  FREE_VERSION: '✨ FREE Version',
  CHANGE_KEY: 'Đổi Key',
  TOAST_ERROR: 'Lỗi',
  TOAST_SUCCESS: 'Thành Công'
};
