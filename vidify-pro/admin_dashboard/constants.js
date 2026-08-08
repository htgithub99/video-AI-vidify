const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz3lTshREEk-51ftQ0OGfSs4HOMb5S_nMXRc8XctL23HizwXEYx9i5uwuXZN-uK5U5X/exec';

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
    KEY_PREVIEW_LENGTH: 5,
    KEY_MASK_SUFFIX_LENGTH: 4,
    COLSPAN_USERS: 8,
    COLSPAN_KEYS: 7,
    COLSPAN_ACCOUNTS: 6,
    MAX_ITEMS_SELECT: 1,
    DEFAULT_MAX_DEVICES: 1,
    DEFAULT_QUOTA: 0,
    DEFAULT_QUOTA_STR: '0',
    ACTION_DEVICE: 'device',
    ACTION_COPY: 'copy',
    ACTION_EDIT: 'edit',
    ACTION_DELETE: 'delete',
    ACTION_EDIT_ACC: 'edit_acc',
    ACTION_DELETE_ACC: 'delete_acc',
    ACTION_DELETE_KEYS: 'delete_keys',
    ACTION_EDIT_KEYS: 'edit_keys',
    ACTION_EDIT_PLAN: 'edit_plan',
    ACTION_DELETE_PLAN: 'delete_plan',
    PAGINATION_PREV: '«',
    PAGINATION_NEXT: '»',
    DATE_T_SPLIT: 'T',
    EMPTY_STR: '',
    PARSE_TRUE: 'true',
    MIN_PAGE: 1,
    DATE_ISO_INDEX: 0,
    PLAN_ALL_LABEL: 'Tất cả',
    PLAN_FREE_LABEL: 'Gói FREE',
    PLAN_PRO_LABEL: 'Gói PRO',
    PLAN_LIFETIME_LABEL: 'Vĩnh Viễn',
    PLAN_NAME_FREE: 'Gói FREE',
    PLAN_NAME_PRO: 'Gói PRO',
    PLAN_NAME_LIFETIME: 'Vĩnh Viễn',
    PLAN_NAME_NEW: 'Gói Mới',
    PLAN_UNASSIGNED: 'Chưa gán',
    TOGGLE_UNLIMITED_ON: 'Không giới hạn',
    TOGGLE_UNLIMITED_OFF: 'Giới hạn',
    TYPE_API_KEY: 'api_key',
    TYPE_PLAN: 'plan',
    TYPE_ACCOUNT: 'account',
    DELETE_TYPE_SOFT: 'soft',
    DELETE_TYPE_HARD: 'hard',
    RESOURCE_DELETE_MODAL_ID: 'resource-delete-modal',
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
    PLUGIN_REMOVE_BUTTON: 'remove_button',
    BODY_TAG: 'body',
    SELECTED: 'selected',
    UNKNOWN_STR: 'unknown',
    SPLIT_DASH: '-',
    GLOBAL_PLANS: 'adminPlans',
    GLOBAL_USERS: 'adminUsersData',
    GLOBAL_API_KEYS: 'adminApiKeysData',
    GLOBAL_ACCOUNTS: 'adminAccountsData',
    PLAN_VIP: 'VIP',
    PLAN_LIFETIME: 'LIFETIME',
    PLAN_NAME_PATH: 'plan.name',
    TARGET_VALUE_PATH: 'target.value',
    PAGE_PREFIX: 'page-',
    NAV_TAB_PREFIX: 'nav-tab-',
    TAB_CONTENT_PREFIX: 'tab-content-',
    TAB_BTN_PREFIX: 'tab-btn-',
    PAGE_RESOURCES: 'resources',
    PAGE_CONFIG: 'config',
    PAGE_USERS: 'users',
    COMMA_SPLIT: ',',
    COMMA_JOIN: ', '
};

const AdminStorage = {
    get: (key) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set: (key, val) => {
        try { localStorage.setItem(key, val); } catch (e) { }
    },
    remove: (key) => {
        try { localStorage.removeItem(key); } catch (e) { }
    }
};

const DataAttributes = {
    MODAL: 'data-modal',
    ACTION: 'data-action',
    KEY: 'data-key',
    ACCOUNT_ID: 'data-account-id',
    ASSIGNEE: 'data-assignee',
    ID: 'data-id',
    PLAN_ID: 'data-plan-id'
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
    CEREBRAS_KEY: 'cerebrasKey',
    GROQ_KEY: 'groqKey',
    AI33_KEY: 'ai33Key',
    MESSAGE: 'message',
    CREATED_AT_CAMEL: 'createdAt',
    UPDATED_AT_CAMEL: 'updatedAt',
    EXCLUDED_TO: 'excludedTo',
    DELETE_TYPE: 'delete_type',
    IS_UNLIMITED: 'is_unlimited',
    QUOTA_VIDEO: 'quota_video',
    QUOTA_IMAGE: 'quota_image',
    QUOTA_VOICE: 'quota_voice',
    NAME: 'name'
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
    TOAST_CLOSE: '.toast-close',
    ADMIN_PAGE_CONTENT: '.admin-page-content',
    NAV_TAB_BTN: '.nav-tab-btn',
    SUB_TAB_CONTENT: '.sub-tab-content',
    SUB_TAB_BTN: '.sub-tab-btn',
    PLAN_UNLIMITED_INPUT: '.plan-unlimited-input',
    DELETE_PLAN_BTN: '.delete-plan-btn',
    PLAN_VIDEO_INPUT_BY_ID: (pId) => `.plan-video-input[data-plan-id="${pId}"]`,
    PLAN_IMAGE_INPUT_BY_ID: (pId) => `.plan-image-input[data-plan-id="${pId}"]`,
    PLAN_VOICE_INPUT_BY_ID: (pId) => `.plan-voice-input[data-plan-id="${pId}"]`,
    PLAN_NAME_INPUT_BY_ID: (pId) => `.plan-name-input[data-plan-id="${pId}"]`,
    PLAN_UNLIMITED_INPUT_BY_ID: (pId) => `.plan-unlimited-input[data-plan-id="${pId}"]`,
    TOGGLE_TEXT_BY_ID: (pId) => `.toggle-text[data-plan-id="${pId}"]`,
    QUOTA_ROW_INPUT: '.quota-row-input',
    PLAN_ROW_BY_ID: (planId) => `.quota-${planId}`
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
    ADD_PLAN_BTN: 'add-plan-btn',
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
    PAGINATION_CONTAINER: 'pagination-container',
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
    BTN_RESOURCE_SOFT_DELETE: 'btn-resource-soft-delete',
    BTN_RESOURCE_HARD_DELETE: 'btn-resource-hard-delete',
    DEVICE_MODAL: 'device-modal',
    DEVICE_LIST_CONTAINER: 'device-list-container',
    MODAL_RESET_DEVICE_BTN: 'modal-reset-device-btn',
    TAB_KEYS_BTN: 'tab-btn-keys',
    TAB_ACCOUNTS_BTN: 'tab-btn-accounts',
    TAB_CONTENT_KEYS: 'tab-content-keys',
    TAB_CONTENT_ACCOUNTS: 'tab-content-accounts',
    SAVE_KEYS_BTN: 'save-keys-btn',
    KEYS_GEMINI_INPUT: 'keys-gemini-input',
    KEYS_CEREBRAS_INPUT: 'keys-cerebras-input',
    KEYS_GROQ_INPUT: 'keys-groq-input',
    KEYS_AI33_INPUT: 'keys-ai33-input',
    KEYS_ASSIGNEE_INPUT: 'keys-assignee-input',
    KEYS_EXCLUDED_INPUT: 'keys-excluded-input',
    ADD_ACC_BTN: 'add-acc-btn',
    ACC_EMAIL_INPUT: 'acc-email-input',
    ACC_PASSWORD_INPUT: 'acc-pwd-input',
    ACC_RECOVERY_INPUT: 'acc-recovery-input',
    ACC_ASSIGNEE_INPUT: 'acc-assign-input',
    SYNC_BTN: 'sync-expired-btn',
    CONFIRM_MODAL: 'confirm-modal',
    CONFIRM_MESSAGE_DISPLAY: 'confirm-message-display',
    BTN_CONFIRM_ACTION: 'btn-confirm-action',
    PLANS_CONTAINER: 'plans-container',
    PLAN_MODAL_TITLE: 'plan-modal-title',
    PLAN_NAME_INPUT_MODAL: 'plan-name-input-modal',
    PLAN_VIDEO_INPUT_MODAL: 'plan-video-input-modal',
    PLAN_IMAGE_INPUT_MODAL: 'plan-image-input-modal',
    PLAN_VOICE_INPUT_MODAL: 'plan-voice-input-modal',
    PLAN_UNLIMITED_INPUT_MODAL: 'plan-unlimited-input-modal',
    PLAN_UNLIMITED_LABEL_MODAL: 'plan-unlimited-label-modal',
    ACC_STATUS_INPUT: 'acc-status-input',
    PLAN_MODAL: 'plan-modal',
    KEY_MODAL: 'key-modal',
    KEY_MODAL_TITLE: 'key-modal-title',
    ACCOUNT_MODAL: 'account-modal',
    ACCOUNT_MODAL_TITLE: 'account-modal-title',
    OPEN_PLAN_CREATE_MODAL_BTN: 'open-plan-create-modal-btn',
    SAVE_PLAN_BTN: 'save-plan-btn',
    PAGE_SIZE_SELECT: 'page-size-select',
    HEADER_PAGE_TITLE: 'header-page-title'
};

const AdminMessages = {
    MISSING_LINK: "Chưa cấu hình API",
    MISSING_INFO: "Thiếu thông tin!",
    LOGIN_PROGRESS: "Đang xử lý...",
    LOGIN_ERROR_API: "Kết nối thất bại. Vui lòng thử lại sau.",
    LOGIN_DEFAULT: "Đăng Nhập",
    LOGIN_ERROR_DEFAULT: "Sai tài khoản",
    INVALID_TOKEN: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    FETCH_ERROR: "Tải dữ liệu thất bại. Vui lòng thử lại sau.",
    SAVE_PROGRESS: "Đang lưu...",
    SAVE_SUCCESS: "Đã lưu thành công",
    SAVE_ERROR: "Không thể lưu dữ liệu. Vui lòng thử lại sau.",
    SAVE_DEFAULT: "Lưu",
    MODAL_CREATE_TITLE: "Tạo Mới",
    MODAL_EDIT_TITLE: "Sửa",
    MODAL_MISSING_NAME: "Vui lòng nhập tên khách hàng.",
    MODAL_UPDATE_SUCCESS: "Cập nhật thành công!",
    MODAL_CREATE_SUCCESS: "Đã tạo license mới: ",
    MODAL_SAVE_DEFAULT: "Lưu",
    BTN_UPDATE: "Cập Nhật",
    BTN_CANCEL: "Hủy",
    SAVE_USER_PROGRESS: "Đang xử lý...",
    SAVE_USER_SUCCESS: "Đã lưu license!",
    SAVE_USER_DEFAULT: "Lưu",
    DELETE_SOFT_SUCCESS: "Đã khóa tạm thời tài nguyên",
    DELETE_HARD_SUCCESS: "Đã xóa vĩnh viễn tài nguyên",
    DELETE_ERROR_DEFAULT: "Không thể thực hiện xóa dữ liệu.",
    RESET_DEVICE_CONFIRM: "Bạn có muốn gỡ thiết bị của: {0} không?",
    RESET_DEVICE_ERROR: "Gỡ thiết bị thất bại. Vui lòng thử lại.",
    RESET_DEVICE_SUCCESS: "Đã gỡ thiết bị thành công!",
    SYNC_SUCCESS: "Đã đồng bộ hết hạn: {0} tài khoản",
    TOAST_SUCCESS: "Thành Công",
    TOAST_ERROR: "Lỗi",
    EMPTY_DEVICE_MSG: "Chưa kết nối thiết bị",
    DEVICE_CONNECTED: "Đang kết nối",
    COPY_SUCCESS: "Đã sao chép khóa thành công!",
    COPY_ERROR: "Không thể sao chép.",
    ACTION_LOADING_SOFT_DELETE: "Đang khóa...",
    ACTION_LOADING_HARD_DELETE: "Đang xóa...",
    ACTION_LOADING_RESET_DEVICE: "Đang gỡ...",
    ACTION_LOADING_SYNC: "Đang đồng bộ...",
    DATA_LOADING: "Đang tải dữ liệu...",
    PLAN_FREE_LABEL: "FREE",
    PLAN_PRO_LABEL: "PRO",
    PLAN_LIFETIME_LABEL: "LIFETIME",
    STATUS_ACTIVE_LABEL: "Hoạt động",
    STATUS_REVOKED_LABEL: "Bị khóa",
    STATUS_EXPIRED_LABEL: "Hết hạn",
    EXPIRES_LIFETIME: "Vĩnh viễn",
    VALIDATION_NEED_KEY: "Vui lòng cung cấp ít nhất một API Key.",
    KEYS_SAVE_SUCCESS: "Đã lưu API Key thành công",
    ACCS_SAVE_SUCCESS: "Đã thêm tài khoản Google thành công",
    ACCOUNT_UPDATE_SUCCESS: "Cập nhật tài khoản Google thành công",
    ACCOUNT_DELETE_SUCCESS: "Đã xóa tài khoản Google",
    DELETE_CONFIRM: "Bạn có chắc chắn muốn xóa mục này không?",
    MISSING_ACC_INFO: "Vui lòng nhập địa chỉ email Google.",
    DELETE_KEYS_CONFIRM: "Xóa API Keys của: {0}?",
    DELETE_KEYS_SUCCESS: "Đã xóa API Keys",
    DELETE_KEYS_ERROR: "Xóa API Keys thất bại.",
    DELETE_ACCOUNT_CONFIRM: "Bạn có muốn xóa tài khoản này không?",
    DELETE_ACCOUNT_SUCCESS: "Đã xóa tài khoản Google",
    DELETE_ACCOUNT_ERROR: "Xóa tài khoản Google thất bại.",
    LOADING_SAVE: "Đang lưu...",
    LOADING_UPDATE: "Đang cập nhật...",
    LOADING_ADD: "Đang thêm...",
    UPDATE_STATUS_SUCCESS: "Đã cập nhật trạng thái",
    UPDATE_STATUS_ERROR: "Cập nhật trạng thái thất bại.",
    NO_DATA: "Chưa có dữ liệu",
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
    QUOTA_TOTAL_LABEL: "Theo hạn",
    EMPTY_USERS: "Không tìm thấy người dùng phù hợp.",
    EMPTY_PLANS: "Không tìm thấy gói dịch vụ nào.",
    CREATE_PLAN_SUCCESS: "Tạo gói dịch vụ thành công",
    CREATE_PLAN_ERROR: "Tạo gói dịch vụ thất bại.",
    DELETE_PLAN_SUCCESS: "Xóa gói dịch vụ thành công",
    DELETE_PLAN_ERROR: "Xóa gói dịch vụ thất bại.",
    DELETE_PLAN_CONFIRM: "Bạn có chắc chắn muốn xóa gói dịch vụ này?",
    NEW_PLAN_NAME: "NEW_PLAN",
    SAVE_ERROR_USER: "Lưu thông tin thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
    PLAN_TITLE_CREATE: "Thêm Gói Dịch Vụ Mới",
    PLAN_TITLE_EDIT: "Chỉnh Sửa Gói Dịch Vụ",
    PLAN_NAME_REQUIRED: "Vui lòng nhập tên gói dịch vụ.",
    PLAN_SAVE_SUCCESS: "Đã lưu cấu hình gói dịch vụ.",
    
    // Thêm các hằng số dịch chuyển từ logic app.js
    REVOKED_BADGE: 'ĐÃ KHÓA',
    STATUS_REVOKED_BADGE: 'BỊ KHÓA',
    TOOLTIP_DELETE_PLAN: 'Xóa gói này',
    TOOLTIP_PLAN_NAME: 'Tên gói',
    LABEL_PLAN_NAME: 'Tên Gói',
    TOOLTIP_UNLIMITED: 'Dùng Không Giới Hạn (Unlimited)',
    LABEL_UNLIMITED: 'Không Giới Hạn',
    TOOLTIP_VIDEO: 'Số lượng Video',
    LABEL_VIDEO: 'Số Video',
    TOOLTIP_IMAGE: 'Số lượng Ảnh',
    LABEL_IMAGE: 'Số Ảnh',
    TOOLTIP_VOICE: 'Số lượng Ký tự',
    LABEL_VOICE: 'Số Ký tự',
    LOADING_PROCESS: 'Đang xử lý...',
    SOFT_DELETE_SUCCESS: 'Đã khóa tài nguyên thành công',
    HARD_DELETE_SUCCESS: 'Đã xóa tài nguyên thành công',
    ERROR_PREFIX: 'Lỗi: ',
    LOADING_DELETE: 'Đang xóa...',
    KEYS_TITLE_CREATE: "Thêm API Key mới",
    KEYS_TITLE_EDIT: "Chỉnh Sửa API Key",
    BTN_SAVE_KEY: "Lưu Key",
    ACC_TITLE_CREATE: "Thêm Tài Khoản Google",
    ACC_TITLE_EDIT: "Sửa Tài Khoản Google",
    BTN_ADD_ACC: "Thêm Tài Khoản",
    LIMIT_QUOTA_LABEL: "Giới hạn Quota",
    UNLIMITED_LABEL: "Không giới hạn",
    ERROR_GENERIC: "Có lỗi xảy ra. Vui lòng thử lại sau.",
    ERROR_CONNECTION: "Lỗi kết nối máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
    ERROR_SAVE_FAILED: "Lưu thông tin thất bại. Vui lòng kiểm tra lại.",
    ERROR_DELETE_FAILED: "Xóa thông tin thất bại. Vui lòng thử lại.",
    ERROR_RESET_DEVICE: "Không thể reset thiết bị. Vui lòng thử lại."
};

const AdminActions = {
    LOGIN: 'admin_login',
    GET_USERS: 'admin_get_users',
    GET_PLANS: 'admin_get_plans',
    UPDATE_PLAN: 'admin_update_plan',
    CREATE_PLAN: 'admin_create_plan',
    DELETE_PLAN: 'admin_delete_plan',
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
    TABLE_LOADING: (colspan, msg) => `<tr><td colspan="${colspan}" class="text-center" style="padding: 5rem 1rem; vertical-align: middle; color: var(--text-muted);">
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem; width:100%; height:100%;">
            <svg class="spinning" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            <span style="font-weight: 700; font-family: var(--font-mono); font-size: 0.85rem; color: #9ca3af;">${msg}</span>
        </div>
    </td></tr>`,
    TABLE_ERROR: (colspan, msg) => `<tr><td colspan="${colspan}" class="text-center" style="padding: 5rem 1rem; vertical-align: middle; color: var(--danger);">${msg}</td></tr>`,
    TABLE_EMPTY: (colspan, msg) => `<tr><td colspan="${colspan}" class="text-center" style="padding: 5rem 1rem; vertical-align: middle; color: var(--text-muted); opacity: 0.7;">
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <p style="font-family: var(--font-mono); font-size: 0.85rem;">${msg}</p>
        </div>
    </td></tr>`,
    PLAN_EMPTY: (msg) => `
        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); opacity: 0.7; padding: 2rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <p>${msg}</p>
        </div>
    `,
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
    USAGE_TEXT: (uv, tv, ui, ti, uc, tc) => `
        <div style="display: flex; items-center; justify-content: center; gap: 0.35rem; flex-wrap: wrap; font-family: var(--font-mono); font-size: 0.725rem;">
            <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #34d399; padding: 0.15rem 0.5rem; border-radius: 6px;" title="Số lượng Ảnh">🖼️ ${ui}/${ti}</span>
            <span style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.25); color: #fbbf24; padding: 0.15rem 0.5rem; border-radius: 6px;" title="Số lượng Video">🎬 ${uv}/${tv}</span>
            <span style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.25); color: #a5b4fc; padding: 0.15rem 0.5rem; border-radius: 6px;" title="Số lượng Voice">🎙️ ${uc}/${tc}</span>
        </div>
    `,
    DANGER_TEXT: (text) => `<span style="color:var(--danger)">${text}</span>`
};
