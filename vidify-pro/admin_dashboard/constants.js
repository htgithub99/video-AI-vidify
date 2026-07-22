const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbx9Trr0RGA3f-fAuclZVsMYlGpGasTV-GjT3fRdv6vucSP4muWq6Znv60JFTR5ZOmvY/exec';

const AdminConstants = {
    TOKEN_KEY: 'adminToken',
    API_URL_KEY: 'apiUrl',
    PLAN_PRO: 'PRO',
    PLAN_FREE: 'FREE',
    PLAN_PRO_LIFETIME: 'PRO_LIFETIME',
    STATUS_ACTIVE: 'ACTIVE',
    STATUS_REVOKED: 'REVOKED',
    STATUS_EXPIRED: 'EXPIRED',
    TOAST_DURATION: 3000,
    TOAST_ANIMATION_MS: 300,
    FILTER_ALL: 'ALL',
    MODAL_FADE_DELAY: 1500,
    DEFAULT_PAGE_SIZE: 10,
    DEFAULT_PAGE: 1,
    API_ERROR_UNAUTHORIZED: 401,
    ACCOUNT_STATUS_ACTIVE: 'Active',
    ACCOUNT_STATUS_ERROR: 'Error',
    ASSIGN_ALL: 'ALL',
    KEY_PREVIEW_LENGTH: 8,
    COLSPAN_USERS: 8,
    COLSPAN_KEYS: 4,
    COLSPAN_ACCOUNTS: 6,
    MAX_ITEMS_SELECT: 1,
    DEFAULT_MAX_DEVICES: 1,
    DEFAULT_QUOTA: 0,
    ACTION_DEVICE: 'device',
    ACTION_COPY: 'copy',
    ACTION_EDIT: 'edit',
    ACTION_DELETE: 'delete',
    ACTION_EDIT_ACC: 'edit_acc',
    ACTION_DELETE_ACC: 'delete_acc',
    ACTION_DELETE_KEYS: 'delete_keys',
    ACTION_EDIT_KEYS: 'edit_keys',
    PAGINATION_PREV: '«',
    PAGINATION_NEXT: '»',
    DATE_T_SPLIT: 'T',
    EMPTY_STR: '',
    PARSE_TRUE: 'true',
    MIN_PAGE: 1,
    DATE_ISO_INDEX: 0,
    PLAN_ALL_LABEL: 'Tất cả gói',
    PLAN_FREE_LABEL: 'Gói FREE',
    PLAN_PRO_LABEL: 'Gói PRO',
    PLAN_LIFETIME_LABEL: 'Gói Vĩnh Viễn',
    INFINITY_SIGN: '∞',
    HTML_ENTITIES: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    },
    HTTP_POST: 'POST',
    PLUGIN_DROPDOWN: 'dropdown_input',
    SELECTED: 'selected',
    UNKNOWN_STR: 'unknown',
    SPLIT_DASH: '-'
};

const DataAttributes = {
    MODAL: 'data-modal',
    ACTION: 'data-action',
    KEY: 'data-key',
    ACCOUNT_ID: 'data-account-id',
    ASSIGNEE: 'data-assignee',
    ID: 'data-id'
};

const ApiFields = {
    ACTION: 'action',
    ADMIN_TOKEN: 'admin_token',
    ERROR: 'error',
    CODE: 'code',
    STATUS: 'status',
    TOKEN: 'token',
    USERNAME: 'username',
    PASSWORD: 'password',
    USERS: 'users',
    LICENSE_KEY: 'license_key',
    PLAN_ID: 'plan_id',
    EXPIRES_AT: 'expires_at',
    CREATED_AT: 'created_at',
    USAGE_VIDEO: 'usage.video',
    USAGE_IMAGE: 'usage.image',
    USAGE_VOICE: 'usage.voice',
    DEVICE_ID: 'device_id',
    CONFIG: 'config',
    FREE_VIDEO: 'free_video',
    FREE_IMAGE: 'free_image',
    FREE_VOICE: 'free_voice',
    PRO_VIDEO: 'pro_video',
    PRO_IMAGE: 'pro_image',
    PRO_VOICE: 'pro_voice',
    PRO_UNLIMITED: 'pro_unlimited',
    MAX_DEVICES: 'max_devices',
    QUOTA_TYPE: 'quota_type',
    COUNT: 'count',
    KEYS: 'keys',
    PLANS: 'plans',
    ACCOUNTS: 'accounts',
    KEY: 'key',
    VALUE: 'value',
    ASSIGNED_TO: 'assignedTo',
    EMAIL: 'email',
    RECOVERY_EMAIL: 'recoveryEmail',
    ACCOUNT: 'account',
    ID: 'id',
    ROW_INDEX: 'rowIndex',
    GEMINI_KEY: 'geminiKey',
    AI33_KEY: 'ai33Key',
    MESSAGE: 'message',
    CREATED_AT_CAMEL: 'createdAt',
    UPDATED_AT_CAMEL: 'updatedAt'
};

const EventTypes = {
    CLICK: 'click',
    INPUT: 'input',
    CHANGE: 'change'
};

const TagNames = {
    DIV: 'div',
    BUTTON: 'button',
    OPTION: 'option'
};

const AdminClasses = {
    ACTIVE: 'active',
    BTN_LOADING: 'btn-loading',
    REMOVING: 'removing',
    TOAST: 'toast',
    TOAST_SUCCESS: 'toast-success',
    TOAST_ERROR: 'toast-error',
    DISPLAY_FLEX: 'flex',
    DISPLAY_NONE: 'none',
    DISPLAY_BLOCK: 'block',
    BADGE_PRO: 'pro',
    BADGE_FREE: 'free',
    BADGE_REVOKED: 'revoked',
    BADGE_EXPIRED: 'expired',
    PAGE_BTN: 'page-btn'
};

const AdminSelectors = {
    NUMERIC_INPUT: '.numeric-input',
    MODAL_CLOSE_BTN: '.modal-close-btn',
    ACTION_BTNS: '.action-btn, .copy-btn',
    ACC_STATUS_SELECT: '.acc-status-select',
    TOAST_CLOSE: '.toast-close'
};

const AdminRegex = {
    ESCAPE_HTML: /[&<>'"]/g,
    NUMBERS_ONLY: /[^0-9]/g
};

const ToastType = {
    SUCCESS: 'success',
    ERROR: 'error'
};

const QuotaType = {
    DAILY: 'DAILY',
    TOTAL: 'TOTAL'
};

const DOMIds = {
    LOGIN_SCREEN: 'login-screen',
    DASHBOARD_SCREEN: 'dashboard-screen',
    LOGIN_BTN: 'login-btn',
    USERNAME_INPUT: 'admin-username-input',
    PASSWORD_INPUT: 'admin-password-input',
    LOGOUT_BTN: 'logout-btn',
    TBODY: '#users-table tbody',
    KEYS_TBODY: '#keys-table tbody',
    ACCS_TBODY: '#accounts-table tbody',
    LOADING_MSG: 'loading-msg',
    SAVE_CONFIG_BTN: 'save-config-btn',
    FREE_QUOTA_VIDEO: 'free-quota-video',
    FREE_QUOTA_IMAGE: 'free-quota-image',
    FREE_QUOTA_VOICE: 'free-quota-voice',
    PRO_QUOTA_VIDEO: 'pro-quota-video',
    PRO_QUOTA_IMAGE: 'pro-quota-image',
    PRO_QUOTA_VOICE: 'pro-quota-voice',
    PRO_UNLIMITED: 'pro-unlimited',
    LIFETIME_QUOTA_VIDEO: 'lifetime-quota-video',
    LIFETIME_QUOTA_IMAGE: 'lifetime-quota-image',
    LIFETIME_QUOTA_VOICE: 'lifetime-quota-voice',
    LIFETIME_UNLIMITED: 'lifetime-unlimited',
    CONFIG_MAX_DEVICES: 'config-max-devices',
    TOAST_CONTAINER: 'toast-container',
    SEARCH_INPUT: 'search-input',
    FILTER_PLAN: 'filter-plan',
    FILTER_STATUS: 'filter-status',
    PAGE_SIZE: 'page-size-select',
    PAGINATION_CONTROLS: 'pagination-controls',
    CONFIG_TOGGLE_BTN: 'config-toggle-btn',
    CONFIG_DROPDOWN_MENU: 'config-dropdown-menu',
    RESOURCE_TOGGLE_BTN: 'resource-toggle-btn',
    RESOURCE_MODAL: 'resource-modal',
    OPEN_CREATE_MODAL_BTN: 'open-create-modal-btn',
    USER_MODAL_TITLE: 'user-modal-title',
    MODAL_USERNAME: 'modal-username',
    MODAL_PLAN_TYPE: 'modal-plan-type',
    MODAL_STATUS: 'modal-status',
    MODAL_EXPIRES: 'modal-expires',
    MODAL_EXPIRES_WRAPPER: 'modal-expires-wrapper',
    MODAL_QUOTA_TYPE: 'modal-quota-type',
    USER_MODAL: 'user-modal',
    SAVE_USER_BTN: 'save-user-btn',
    DELETE_KEY_DISPLAY: 'delete-key-display',
    DELETE_MODAL: 'delete-modal',
    BTN_SOFT_DELETE: 'btn-soft-delete',
    BTN_HARD_DELETE: 'btn-hard-delete',
    DEVICE_MODAL: 'device-modal',
    DEVICE_LIST_CONTAINER: 'device-list-container',
    MODAL_RESET_DEVICE_BTN: 'modal-reset-device-btn',
    TAB_KEYS_BTN: 'tab-btn-keys',
    TAB_ACCOUNTS_BTN: 'tab-btn-accounts',
    TAB_CONTENT_KEYS: 'tab-content-keys',
    TAB_CONTENT_ACCOUNTS: 'tab-content-accounts',
    SAVE_KEYS_BTN: 'save-keys-btn',
    KEYS_GEMINI_INPUT: 'keys-gemini-input',
    KEYS_AI33_INPUT: 'keys-ai33-input',
    KEYS_ASSIGNEE_INPUT: 'keys-assignee-input',
    ADD_ACC_BTN: 'add-acc-btn',
    ACC_EMAIL_INPUT: 'acc-email-input',
    ACC_PASSWORD_INPUT: 'acc-pwd-input',
    ACC_RECOVERY_INPUT: 'acc-recovery-input',
    ACC_ASSIGNEE_INPUT: 'acc-assign-input',
    SYNC_BTN: 'sync-expired-btn',
    CONFIRM_MODAL: 'confirm-modal',
    CONFIRM_MESSAGE_DISPLAY: 'confirm-message-display',
    BTN_CONFIRM_ACTION: 'btn-confirm-action'
};

const AdminMessages = {
    MISSING_LINK: "Chưa cấu hình API",
    MISSING_INFO: "Thiếu thông tin!",
    LOGIN_PROGRESS: "Đang xử lý...",
    LOGIN_ERROR_API: "Lỗi kết nối",
    LOGIN_DEFAULT: "Đăng Nhập",
    LOGIN_ERROR_DEFAULT: "Sai tài khoản",
    INVALID_TOKEN: "Phiên hết hạn!",
    FETCH_ERROR: "Lỗi tải: ",
    SAVE_PROGRESS: "Đang lưu...",
    SAVE_SUCCESS: "Lưu thành công",
    SAVE_ERROR: "Lỗi lưu: ",
    SAVE_DEFAULT: "Lưu",
    MODAL_CREATE_TITLE: "Tạo Mới",
    MODAL_EDIT_TITLE: "Sửa",
    MODAL_MISSING_NAME: "Nhập tên khách",
    MODAL_UPDATE_SUCCESS: "Đã cập nhật!",
    MODAL_CREATE_SUCCESS: "Mã mới: ",
    MODAL_SAVE_DEFAULT: "Lưu",
    BTN_UPDATE: "Cập Nhật",
    BTN_CANCEL: "Hủy",
    SAVE_USER_PROGRESS: "Đang lưu...",
    SAVE_USER_SUCCESS: "Đã lưu!",
    SAVE_USER_DEFAULT: "Lưu",
    DELETE_SOFT_SUCCESS: "Đã khóa",
    DELETE_HARD_SUCCESS: "Đã xóa",
    DELETE_ERROR_DEFAULT: "Lỗi xóa",
    RESET_DEVICE_CONFIRM: "Gỡ thiết bị của: {0}?",
    RESET_DEVICE_ERROR: "Lỗi gỡ: ",
    RESET_DEVICE_SUCCESS: "Đã gỡ!",
    SYNC_SUCCESS: "Hết hạn: {0}",
    TOAST_SUCCESS: "Thành Công",
    TOAST_ERROR: "Lỗi",
    EMPTY_DEVICE_MSG: "Trống",
    DEVICE_CONNECTED: "Kết nối",
    COPY_SUCCESS: "Đã chép: ",
    COPY_ERROR: "Lỗi chép",
    ACTION_LOADING_SOFT_DELETE: "Đang khóa...",
    ACTION_LOADING_HARD_DELETE: "Đang xóa...",
    ACTION_LOADING_RESET_DEVICE: "Đang gỡ...",
    ACTION_LOADING_SYNC: "Đồng bộ...",
    DATA_LOADING: "Đang tải...",
    PLAN_FREE_LABEL: "FREE",
    PLAN_PRO_LABEL: "PRO",
    PLAN_LIFETIME_LABEL: "LIFETIME",
    STATUS_ACTIVE_LABEL: "Hoạt động",
    STATUS_REVOKED_LABEL: "Bị khóa",
    STATUS_EXPIRED_LABEL: "Hết hạn",
    EXPIRES_LIFETIME: "Vĩnh viễn",
    VALIDATION_NEED_KEY: "Thiếu Key",
    KEYS_SAVE_SUCCESS: "Đã lưu",
    ACCS_SAVE_SUCCESS: "Đã thêm",
    ACCOUNT_UPDATE_SUCCESS: "Đã cập nhật",
    ACCOUNT_DELETE_SUCCESS: "Đã xóa",
    DELETE_CONFIRM: "Xóa mục này?",
    MISSING_ACC_INFO: "Thiếu thông tin",
    DELETE_KEYS_CONFIRM: "Xóa Keys của: {0}?",
    DELETE_KEYS_SUCCESS: "Đã xóa",
    DELETE_KEYS_ERROR: "Lỗi xóa: ",
    DELETE_ACCOUNT_CONFIRM: "Xóa tài khoản?",
    DELETE_ACCOUNT_SUCCESS: "Đã xóa",
    DELETE_ACCOUNT_ERROR: "Lỗi xóa: ",
    LOADING_SAVE: "Đang lưu...",
    LOADING_UPDATE: "Cập nhật...",
    LOADING_ADD: "Đang thêm...",
    UPDATE_STATUS_SUCCESS: "Đã cập nhật",
    UPDATE_STATUS_ERROR: "Lỗi cập nhật: ",
    NO_DATA: "Trống",
    ACTION_MODAL_DEVICES: "Thiết bị",
    ACTION_MODAL_COPY: "Copy",
    ACTION_MODAL_EDIT: "Sửa",
    ACTION_MODAL_DELETE: "Xóa",
    BTN_ADD: "Thêm",
    BTN_SAVE: "Lưu",
    ASSIGN_ALL_LABEL: "Tất cả",
    ASSIGN_FREE_LABEL: "Gói FREE",
    ASSIGN_PRO_LABEL: "Gói PRO",
    ASSIGN_SPECIFIC_LABEL: "Gán riêng",
    SEARCH_PLACEHOLDER: "Tìm kiếm...",
    PASSWORD_MASK: "••••••••",
    USAGE_FORMAT: "V:{0} | I:{1} | C:{2}",
    LOG_COPY_FAILED: "Lỗi sao chép",
    ARRAY_EMPTY_JSON: "[]",
    QUOTA_DAILY_LABEL: "Theo ngày",
    QUOTA_TOTAL_LABEL: "Theo hạn"
};

const AdminActions = {
    LOGIN: 'admin_login',
    GET_USERS: 'admin_get_users',
    GET_PLANS: 'admin_get_plans',
    UPDATE_PLAN: 'admin_update_plan',
    CREATE_KEY: 'admin_create_key',
    UPDATE_KEY: 'admin_update_key',
    REVOKE_KEY: 'admin_revoke_key',
    DELETE_KEY: 'admin_delete_key',
    RESET_DEVICE: 'admin_reset_device',
    SYNC_EXPIRED: 'admin_sync_expired',
    GET_API_KEYS: 'admin_get_api_keys',
    UPDATE_API_KEYS: 'admin_update_api_keys',
    DELETE_API_KEYS: 'admin_delete_api_keys',
    GET_ACCOUNTS: 'admin_get_accounts',
    ADD_ACCOUNT: 'admin_add_account',
    UPDATE_ACCOUNT: 'admin_update_account',
    DELETE_ACCOUNT: 'admin_delete_account',
    UPDATE_ACCOUNT_STATUS: 'admin_update_account_status'
};

const Logger = {
    info: (...args) => { if (window.console && window.console.info) window.console.info('[INFO]', ...args); },
    error: (...args) => { if (window.console && window.console.error) window.console.error('[ERROR]', ...args); },
    warn: (...args) => { if (window.console && window.console.warn) window.console.warn('[WARN]', ...args); }
};

const AdminIcons = {
    SPINNER: `<svg class="spinning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    SUCCESS_TOAST: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><path d="M20 6 9 17l-5-5"/></svg>`,
    ERROR_TOAST: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    CLOSE_TOAST: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    DEVICE_EMPTY: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    DEVICE_ICON: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    BTN_ADD: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    BTN_SAVE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    BTN_EDIT: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
    BTN_DELETE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    BTN_DEVICE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    BTN_COPY: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    BTN_REFRESH: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    BTN_SYNC: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>`,
    BTN_CONFIG: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    BTN_RESOURCE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`
};

const AdminTemplates = {
    LOADING_BTN: (text) => `<div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">${AdminIcons.SPINNER} <span>${text}</span></div>`,
    TABLE_LOADING: (colspan, msg) => `<tr><td colspan="${colspan}" class="text-center" style="padding: 3rem; color: var(--text-muted); font-style: italic;">${msg}</td></tr>`,
    TABLE_ERROR: (colspan, msg) => `<tr><td colspan="${colspan}" class="text-center" style="padding: 3rem; color: var(--error);">${msg}</td></tr>`,
    TOAST: (icon, title, message) => `
        ${icon}
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">${AdminIcons.CLOSE_TOAST}</button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `,
    DEVICE_EMPTY: (msg) => `
        <div class="empty-device">
            ${AdminIcons.DEVICE_EMPTY}
            <p>${msg}</p>
        </div>
    `,
    DEVICE_CARD: (dId, status) => `
        <div class="device-card">
            <div class="device-icon">${AdminIcons.DEVICE_ICON}</div>
            <div class="device-info">
                <span class="device-id" title="${dId}">${dId}</span>
                <span class="device-status">${status}</span>
            </div>
        </div>
    `,
    BTN_WITH_ICON: (icon, text) => `${icon} ${text}`,
    SELECT_OPTION: (val, label, selected = false) => `<option value="${val}" ${selected ? AdminConstants.SELECTED : AdminConstants.EMPTY_STR}>${label}</option>`,
    OPTGROUP: (label, options) => `<optgroup label="${label}">${options}</optgroup>`,
    USAGE_TEXT: (uv, tv, ui, ti, uc, tc) => `<span title="Ảnh">Ảnh: ${ui}/${ti}</span> <span style="color:var(--input-bg)">|</span> <span title="Video">Video: ${uv}/${tv}</span> <span style="color:var(--input-bg)">|</span> <span title="Voice">Voice: ${uc}/${tc}</span>`,
    DANGER_TEXT: (text) => `<span style="color:var(--danger)">${text}</span>`
};
