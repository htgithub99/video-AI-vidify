const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwnWkp3B5rph3FUGWHbuT9e4CwVklwRwPPTbREJObcD_8eQC41oGOsm1D33M67c2fUJ/exec';

const AdminConstants = {
    TOKEN_KEY: 'adminToken',
    API_URL_KEY: 'apiUrl',
    PLAN_PRO: 'PRO',
    PLAN_FREE: 'FREE',
    STATUS_ACTIVE: 'ACTIVE',
    STATUS_REVOKED: 'REVOKED',
    STATUS_EXPIRED: 'EXPIRED',
    PLAN_PRO_LIFETIME: 'PRO_LIFETIME',
    TOAST_DURATION: 3000,
    TOAST_ANIMATION_MS: 300,
    FILTER_ALL: 'ALL',
    MODAL_FADE_DELAY: 1500,
    DEFAULT_PAGE_SIZE: 10,
    API_ERROR_UNAUTHORIZED: 401,
    DISPLAY_FLEX: 'flex',
    DISPLAY_NONE: 'none',
    DISPLAY_BLOCK: 'block'
};

const ToastType = {
    SUCCESS: 'success',
    ERROR: 'error'
};

const DOMIds = {
    LOGIN_SCREEN: 'login-screen',
    DASHBOARD_SCREEN: 'dashboard-screen',
    LOGIN_BTN: 'login-btn',
    USERNAME_INPUT: 'admin-username-input',
    PASSWORD_INPUT: 'admin-password-input',
    LOGOUT_BTN: 'logout-btn',
    TBODY: '#users-table tbody',
    LOADING_MSG: 'loading-msg',
    SAVE_CONFIG_BTN: 'save-config-btn',
    FREE_QUOTA_VIDEO: 'free-quota-video',
    FREE_QUOTA_IMAGE: 'free-quota-image',
    FREE_QUOTA_VOICE: 'free-quota-voice',
    PRO_QUOTA_VIDEO: 'pro-quota-video',
    PRO_QUOTA_IMAGE: 'pro-quota-image',
    PRO_QUOTA_VOICE: 'pro-quota-voice',
    PRO_UNLIMITED: 'pro-unlimited',
    CONFIG_MAX_DEVICES: 'config-max-devices',
    TOAST_CONTAINER: 'toast-container',
    SEARCH_INPUT: 'search-input',
    FILTER_PLAN: 'filter-plan',
    FILTER_STATUS: 'filter-status',
    PAGE_SIZE: 'page-size',
    PAGINATION_CONTROLS: 'pagination-controls',
    CONFIG_TOGGLE_BTN: 'config-toggle-btn',
    CONFIG_DROPDOWN_MENU: 'config-dropdown-menu',
    OPEN_CREATE_MODAL_BTN: 'open-create-modal-btn',
    USER_MODAL_TITLE: 'user-modal-title',
    MODAL_USERNAME: 'modal-username',
    MODAL_PLAN_TYPE: 'modal-plan-type',
    MODAL_STATUS: 'modal-status',
    MODAL_EXPIRES: 'modal-expires',
    MODAL_EXPIRES_WRAPPER: 'modal-expires-wrapper',
    USER_MODAL: 'user-modal',
    SAVE_USER_BTN: 'save-user-btn',
    DELETE_KEY_DISPLAY: 'delete-key-display',
    DELETE_MODAL: 'delete-modal',
    BTN_SOFT_DELETE: 'btn-soft-delete',
    BTN_HARD_DELETE: 'btn-hard-delete',
    DEVICE_MODAL: 'device-modal',
    DEVICE_LIST_CONTAINER: 'device-list-container',
    MODAL_RESET_DEVICE_BTN: 'modal-reset-device-btn'
};

const AdminMessages = {
    MISSING_LINK: "Bạn chưa thay thế đường link Google Web App vào file app.js!",
    MISSING_INFO: "Vui lòng nhập đầy đủ thông tin!",
    LOGIN_PROGRESS: "Đang đăng nhập...",
    LOGIN_ERROR_API: "Lỗi kết nối đến máy chủ!",
    LOGIN_DEFAULT: "Đăng Nhập",
    LOGIN_ERROR_DEFAULT: "Sai tài khoản hoặc mật khẩu!",
    INVALID_TOKEN: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!",
    FETCH_ERROR: "Lỗi khi tải dữ liệu: ",
    SAVE_PROGRESS: "Đang lưu...",
    SAVE_SUCCESS: "Đã lưu cấu hình thành công!",
    SAVE_ERROR: "Có lỗi xảy ra: ",
    SAVE_DEFAULT: "Lưu Cấu Hình",
    MODAL_CREATE_TITLE: "Tạo License Mới",
    MODAL_EDIT_TITLE: "Sửa License",
    MODAL_MISSING_NAME: "Vui lòng nhập tên khách hàng!",
    MODAL_UPDATE_SUCCESS: "Đã cập nhật thành công!",
    MODAL_CREATE_SUCCESS: "Tạo thành công! License Key: ",
    MODAL_SAVE_DEFAULT: "Lưu",
    SAVE_USER_PROGRESS: "Đang lưu...",
    SAVE_USER_SUCCESS: "Lưu thông tin thành công!",
    SAVE_USER_DEFAULT: "Lưu",
    DELETE_SOFT_SUCCESS: "Đã khóa tài khoản thành công!",
    DELETE_HARD_SUCCESS: "Đã xóa vĩnh viễn tài khoản!",
    DELETE_ERROR_DEFAULT: "Lỗi khi xóa!",
    RESET_DEVICE_CONFIRM: "Bạn có chắc chắn muốn Reset Thiết Bị cho Key: {0}?\nLưu ý: Khách hàng sẽ có thể đăng nhập trên một máy tính mới.",
    RESET_DEVICE_ERROR: "Lỗi khi reset thiết bị: ",
    RESET_DEVICE_SUCCESS: "Đã reset thiết bị thành công!",
    SYNC_SUCCESS: "Đã đồng bộ! Có {0} tài khoản hết hạn.",
    TOAST_SUCCESS: "Thành Công",
    TOAST_ERROR: "Lỗi",
    EMPTY_DEVICE_MSG: "Chưa có thiết bị nào liên kết",
    DEVICE_CONNECTED: "Đang kết nối",
    COPY_SUCCESS: "Đã copy License Key: ",
    COPY_ERROR: "Không thể copy. Vui lòng thử lại!",
    ACTION_LOADING_SOFT_DELETE: "Đang khóa...",
    ACTION_LOADING_HARD_DELETE: "Đang xóa...",
    ACTION_LOADING_RESET_DEVICE: "Đang gỡ...",
    ACTION_LOADING_SYNC: "Đang đồng bộ...",
    DATA_LOADING: "Đang tải dữ liệu...",
    PLAN_FREE_LABEL: "Miễn phí (FREE)",
    PLAN_PRO_LABEL: "Trả phí (PRO)",
    PLAN_LIFETIME_LABEL: "Vĩnh viễn (PRO_LIFE)",
    STATUS_ACTIVE_LABEL: "Hoạt động",
    STATUS_REVOKED_LABEL: "Bị khóa",
    STATUS_EXPIRED_LABEL: "Hết hạn",
    EXPIRES_LIFETIME: "Vĩnh viễn",
    ACTION_MODAL_DEVICES: "Quản lý Thiết bị",
    ACTION_MODAL_COPY: "Copy",
    ACTION_MODAL_EDIT: "Sửa",
    ACTION_MODAL_DELETE: "Xóa / Khóa"
};

const AdminActions = {
    LOGIN: 'admin_login',
    GET_USERS: 'admin_get_users',
    GET_CONFIG: 'admin_get_config',
    UPDATE_CONFIG: 'admin_update_config',
    CREATE_KEY: 'admin_create_key',
    UPDATE_KEY: 'admin_update_key',
    REVOKE_KEY: 'admin_revoke_key',
    DELETE_KEY: 'admin_delete_key',
    RESET_DEVICE: 'admin_reset_device',
    SYNC_EXPIRED: 'admin_sync_expired'
};

const Logger = {
    info: (...args) => console.info('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args)
};

const el = (id) => document.getElementById(id);
const elq = (selector) => document.querySelector(selector);

let adminToken = localStorage.getItem(AdminConstants.TOKEN_KEY) || '';
let apiUrl = API_BASE_URL;
let currentPage = 1;
let pageSize = AdminConstants.DEFAULT_PAGE_SIZE;
let filteredUsers = [];
let editingKey = null;
let deletingKey = null;

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

const spinnerSVG = `<svg class="spinning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

function setButtonLoading(btn, isLoading, loadingText = '') {
    if (!btn) return;
    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.classList.add('btn-loading');
        btn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">${spinnerSVG} <span>${loadingText}</span></div>`;
        btn.disabled = true;
    } else {
        btn.classList.remove('btn-loading');
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
        }
        btn.disabled = false;
    }
}

function showToast(message, type = ToastType.SUCCESS) {
    const container = el(DOMIds.TOAST_CONTAINER);
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconSvg = type === ToastType.SUCCESS 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><path d="M20 6 9 17l-5-5"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;

    const title = type === ToastType.SUCCESS ? AdminMessages.TOAST_SUCCESS : AdminMessages.TOAST_ERROR;

    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${escapeHTML(message)}</span>
        </div>
        <button class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    let isRemoving = false;

    const removeToast = () => {
        if (isRemoving) return;
        isRemoving = true;
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), AdminConstants.TOAST_ANIMATION_MS);
    };

    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, AdminConstants.TOAST_DURATION);
}

async function fetchAPI(action, data = {}) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: action,
                admin_token: adminToken,
                ...data
            })
        });
        const resJson = await response.json();
        
        if (_.has(resJson, 'error')) {
            if (_.get(resJson, 'code') === AdminConstants.API_ERROR_UNAUTHORIZED) {
                showToast(AdminMessages.INVALID_TOKEN, ToastType.ERROR);
                el(DOMIds.LOGOUT_BTN).click();
                throw new Error(AdminMessages.INVALID_TOKEN);
            }
            throw new Error(_.get(resJson, 'error'));
        }
        return resJson;
    } catch (err) {
        Logger.error(err);
        throw err;
    }
}

function showDashboard() {
    el(DOMIds.LOGIN_SCREEN).classList.remove('active');
    el(DOMIds.DASHBOARD_SCREEN).classList.add('active');
    loadUsers();
    loadConfig();
}

async function handleLogin() {
    const user = el(DOMIds.USERNAME_INPUT).value.trim();
    const pass = el(DOMIds.PASSWORD_INPUT).value.trim();
    const loginBtn = el(DOMIds.LOGIN_BTN);

    if (_.isEmpty(API_BASE_URL)) {
        showToast(AdminMessages.MISSING_LINK, ToastType.ERROR);
        return;
    }

    if (_.some([user, pass], _.isEmpty)) {
        showToast(AdminMessages.MISSING_INFO, ToastType.ERROR);
        return;
    }

    setButtonLoading(loginBtn, true, AdminMessages.LOGIN_PROGRESS);

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: AdminActions.LOGIN,
                username: user,
                password: pass
            })
        });

        const data = await response.json();
        if (_.get(data, 'status') === ToastType.SUCCESS && _.has(data, 'token')) {
            adminToken = _.get(data, 'token');
            apiUrl = API_BASE_URL;
            localStorage.setItem(AdminConstants.TOKEN_KEY, adminToken);
            localStorage.setItem(AdminConstants.API_URL_KEY, apiUrl);
            showDashboard();
        } else {
            showToast(_.get(data, 'error', AdminMessages.LOGIN_ERROR_DEFAULT), ToastType.ERROR);
        }
    } catch (e) {
        Logger.error(e);
        showToast(AdminMessages.LOGIN_ERROR_API, ToastType.ERROR);
    } finally {
        setButtonLoading(loginBtn, false);
        loginBtn.textContent = AdminMessages.LOGIN_DEFAULT;
    }
}

function handleLogout() {
    localStorage.removeItem(AdminConstants.TOKEN_KEY);
    adminToken = '';
    apiUrl = API_BASE_URL;
    el(DOMIds.DASHBOARD_SCREEN).classList.remove('active');
    el(DOMIds.LOGIN_SCREEN).classList.add('active');
    el(DOMIds.USERNAME_INPUT).value = '';
    el(DOMIds.PASSWORD_INPUT).value = '';
}

async function loadUsers() {
    const tbody = elq(DOMIds.TBODY);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 3rem; color: var(--text-muted); font-style: italic;">${AdminMessages.DATA_LOADING}</td></tr>`;
    
    try {
        const res = await fetchAPI(AdminActions.GET_USERS);
        window.adminUsersData = _.get(res, 'users', []);
        applyFilters();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 3rem; color: var(--error);">${AdminMessages.FETCH_ERROR + escapeHTML(_.get(error, 'message'))}</td></tr>`;
        showToast(AdminMessages.FETCH_ERROR + _.get(error, 'message'), ToastType.ERROR);
    }
}

function applyFilters() {
    const searchStr = (el(DOMIds.SEARCH_INPUT)?.value || '').toLowerCase();
    const planFilter = el(DOMIds.FILTER_PLAN)?.value || AdminConstants.FILTER_ALL;
    const statusFilter = el(DOMIds.FILTER_STATUS)?.value || AdminConstants.FILTER_ALL;
    
    filteredUsers = _.filter(window.adminUsersData || [], u => {
        let matchSearch = true;
        if (!_.isEmpty(searchStr)) {
            const uname = (_.get(u, 'username') || '').toLowerCase();
            const ukey = (_.get(u, 'license_key') || '').toLowerCase();
            matchSearch = _.some([uname, ukey], str => _.includes(str, searchStr));
        }
        let matchPlan = (planFilter === AdminConstants.FILTER_ALL) ? true : _.get(u, 'plan_type') === planFilter;
        let matchStatus = (statusFilter === AdminConstants.FILTER_ALL) ? true : _.get(u, 'status') === statusFilter;
        return _.every([matchSearch, matchPlan, matchStatus], Boolean);
    });
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = elq(DOMIds.TBODY);
    tbody.innerHTML = '';
    
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
    
    const localizePlan = (plan) => {
        if (plan === AdminConstants.PLAN_FREE) return AdminMessages.PLAN_FREE_LABEL;
        if (plan === AdminConstants.PLAN_PRO) return AdminMessages.PLAN_PRO_LABEL;
        if (plan === AdminConstants.PLAN_PRO_LIFETIME) return AdminMessages.PLAN_LIFETIME_LABEL;
        return plan;
    };

    const localizeStatus = (status) => {
        if (status === AdminConstants.STATUS_ACTIVE) return AdminMessages.STATUS_ACTIVE_LABEL;
        if (status === AdminConstants.STATUS_REVOKED) return AdminMessages.STATUS_REVOKED_LABEL;
        if (status === AdminConstants.STATUS_EXPIRED) return AdminMessages.STATUS_EXPIRED_LABEL;
        return status;
    };

    const getStatusClass = (status) => {
        if (status === AdminConstants.STATUS_ACTIVE) return 'active';
        if (status === AdminConstants.STATUS_REVOKED) return 'revoked';
        return 'expired';
    };
    
    const htmlRows = _.map(paginatedUsers, user => {
        const usageText = `<span title="Video">V:${_.get(user, 'usage.video')}</span> <span style="color:var(--input-bg)">|</span> <span title="Image">I:${_.get(user, 'usage.image')}</span> <span style="color:var(--input-bg)">|</span> <span title="Voice">C:${_.get(user, 'usage.voice')}</span>`;
        const isPro = _.includes([AdminConstants.PLAN_PRO, AdminConstants.PLAN_PRO_LIFETIME], _.get(user, 'plan_type'));
        const expiresAtStr = _.get(user, 'expires_at') ? new Date(_.get(user, 'expires_at')).toLocaleDateString() : AdminMessages.EXPIRES_LIFETIME;
        
        const btnDeviceModal = `<button class="action-btn action-warn" onclick="openDeviceModal('${_.get(user, 'license_key')}')" title="${AdminMessages.ACTION_MODAL_DEVICES}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        </button>`;
        const btnCopy = `<button class="copy-btn" onclick="copyToClipboard('${_.get(user, 'license_key')}')" title="${AdminMessages.ACTION_MODAL_COPY}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>`;
        
        return `
            <tr>
                <td><strong>${escapeHTML(_.get(user, 'username'))}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                        <span style="font-family: monospace; font-size: 0.9rem; color: var(--text-muted);">${escapeHTML(_.get(user, 'license_key'))}</span>
                        ${btnCopy}
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge ${isPro ? 'pro' : 'free'}">${escapeHTML(localizePlan(_.get(user, 'plan_type')))}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${getStatusClass(_.get(user, 'status'))}">${escapeHTML(localizeStatus(_.get(user, 'status')))}</span>
                </td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted);">
                    ${usageText}
                </td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted);">${new Date(_.get(user, 'created_at')).toLocaleDateString()}</td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted);">${expiresAtStr}</td>
                <td class="text-center">
                    <div style="display: flex; justify-content: center; gap: 0.25rem;">
                        <button class="action-btn action-info" onclick="openEditModal('${_.get(user, 'license_key')}')" title="${AdminMessages.ACTION_MODAL_EDIT}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        ${btnDeviceModal}
                        <button class="action-btn action-danger" onclick="openDeleteModal('${_.get(user, 'license_key')}')" title="${AdminMessages.ACTION_MODAL_DELETE}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = htmlRows.join('');
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const controls = el(DOMIds.PAGINATION_CONTROLS);
    if (!controls) return;
    controls.innerHTML = '';
    
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.textContent = '«';
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => { currentPage--; renderTable(); };
    controls.appendChild(btnPrev);
    
    for (let i = 1; i <= totalPages; i++) {
        const btnPage = document.createElement('button');
        btnPage.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btnPage.textContent = i;
        btnPage.onclick = () => { currentPage = i; renderTable(); };
        controls.appendChild(btnPage);
    }
    
    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.textContent = '»';
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => { currentPage++; renderTable(); };
    controls.appendChild(btnNext);
}

async function loadConfig() {
    try {
        const res = await fetchAPI(AdminActions.GET_CONFIG);
        const q = _.get(res, 'config', {});
        
        el(DOMIds.FREE_QUOTA_VIDEO).value = _.get(q, 'free_video', 0);
        el(DOMIds.FREE_QUOTA_IMAGE).value = _.get(q, 'free_image', 0);
        el(DOMIds.FREE_QUOTA_VOICE).value = _.get(q, 'free_voice', 0);
        
        el(DOMIds.PRO_QUOTA_VIDEO).value = _.get(q, 'pro_video', 0);
        el(DOMIds.PRO_QUOTA_IMAGE).value = _.get(q, 'pro_image', 0);
        el(DOMIds.PRO_QUOTA_VOICE).value = _.get(q, 'pro_voice', 0);
        
        const isUnlimited = String(_.get(q, 'pro_unlimited', 'false')) === 'true';
        el(DOMIds.PRO_UNLIMITED).checked = isUnlimited;
        el(DOMIds.PRO_QUOTA_VIDEO).disabled = isUnlimited;
        el(DOMIds.PRO_QUOTA_IMAGE).disabled = isUnlimited;
        el(DOMIds.PRO_QUOTA_VOICE).disabled = isUnlimited;
        
        if (el(DOMIds.CONFIG_MAX_DEVICES)) {
            el(DOMIds.CONFIG_MAX_DEVICES).value = _.get(q, 'max_devices', 1);
        }
    } catch (error) {
        Logger.error(error);
    }
}

async function handleSaveConfig() {
    const saveConfigBtn = el(DOMIds.SAVE_CONFIG_BTN);
    setButtonLoading(saveConfigBtn, true, AdminMessages.SAVE_PROGRESS);
    
    try {
        await fetchAPI(AdminActions.UPDATE_CONFIG, {
            free_quota_video: parseInt(el(DOMIds.FREE_QUOTA_VIDEO).value) || 0,
            free_quota_image: parseInt(el(DOMIds.FREE_QUOTA_IMAGE).value) || 0,
            free_quota_voice: parseInt(el(DOMIds.FREE_QUOTA_VOICE).value) || 0,
            pro_quota_video: parseInt(el(DOMIds.PRO_QUOTA_VIDEO).value) || 0,
            pro_quota_image: parseInt(el(DOMIds.PRO_QUOTA_IMAGE).value) || 0,
            pro_quota_voice: parseInt(el(DOMIds.PRO_QUOTA_VOICE).value) || 0,
            pro_unlimited: el(DOMIds.PRO_UNLIMITED).checked,
            max_devices: el(DOMIds.CONFIG_MAX_DEVICES) ? (parseInt(el(DOMIds.CONFIG_MAX_DEVICES).value) || 1) : 1
        });
        showToast(AdminMessages.SAVE_SUCCESS, ToastType.SUCCESS);
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(saveConfigBtn, false);
    }
}

window.closeModal = function(id) {
    el(id)?.classList.remove('active');
}

function handleOpenCreateModal() {
    editingKey = null;
    el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_CREATE_TITLE;
    el(DOMIds.MODAL_USERNAME).value = '';
    el(DOMIds.MODAL_USERNAME).disabled = false;
    el(DOMIds.MODAL_PLAN_TYPE).value = AdminConstants.PLAN_FREE;
    el(DOMIds.MODAL_STATUS).value = AdminConstants.STATUS_ACTIVE;
    el(DOMIds.MODAL_STATUS).disabled = true;
    el(DOMIds.MODAL_EXPIRES).value = '';
    
    el(DOMIds.MODAL_EXPIRES_WRAPPER).style.display = AdminConstants.DISPLAY_FLEX;
    
    el(DOMIds.USER_MODAL).classList.add('active');
}

window.openEditModal = function(key) {
    const user = _.find(window.adminUsersData || [], u => _.get(u, 'license_key') === key);
    if (!user) return;
    
    editingKey = key;
    el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_EDIT_TITLE;
    el(DOMIds.MODAL_USERNAME).value = _.get(user, 'username');
    el(DOMIds.MODAL_USERNAME).disabled = true;
    
    const planSelect = el(DOMIds.MODAL_PLAN_TYPE);
    let hasOption = _.some(Array.from(planSelect.options), opt => _.get(opt, 'value') === _.get(user, 'plan_type'));
    if (!hasOption) {
        const newOption = document.createElement('option');
        newOption.value = _.get(user, 'plan_type');
        newOption.textContent = _.get(user, 'plan_type');
        planSelect.appendChild(newOption);
    }
    planSelect.value = _.get(user, 'plan_type');
    
    el(DOMIds.MODAL_STATUS).value = _.get(user, 'status');
    el(DOMIds.MODAL_STATUS).disabled = false;
    
    if (!_.isEmpty(_.get(user, 'expires_at'))) {
        el(DOMIds.MODAL_EXPIRES).value = new Date(_.get(user, 'expires_at')).toISOString().split('T')[0];
    } else {
        el(DOMIds.MODAL_EXPIRES).value = '';
    }
    
    const wrapper = el(DOMIds.MODAL_EXPIRES_WRAPPER);
    if (!_.includes([AdminConstants.PLAN_FREE, AdminConstants.PLAN_PRO_LIFETIME], _.get(user, 'plan_type'))) {
        wrapper.style.display = AdminConstants.DISPLAY_FLEX;
    } else {
        wrapper.style.display = AdminConstants.DISPLAY_NONE;
    }
    
    el(DOMIds.USER_MODAL).classList.add('active');
}

function handlePlanTypeChange(e) {
    const wrapper = el(DOMIds.MODAL_EXPIRES_WRAPPER);
    const selectedPlan = _.get(e, 'target.value') || el(DOMIds.MODAL_PLAN_TYPE).value;
    
    if (!_.isNil(editingKey) || selectedPlan !== AdminConstants.PLAN_PRO_LIFETIME) {
        wrapper.style.display = AdminConstants.DISPLAY_FLEX;
    } else {
        wrapper.style.display = AdminConstants.DISPLAY_NONE;
    }
}

async function handleSaveUser() {
    const btn = el(DOMIds.SAVE_USER_BTN);
    const username = el(DOMIds.MODAL_USERNAME).value.trim();
    const planType = el(DOMIds.MODAL_PLAN_TYPE).value;
    const status = el(DOMIds.MODAL_STATUS).value;
    let expiresAt = el(DOMIds.MODAL_EXPIRES).value;
    
    if (_.isNil(editingKey) && _.isEmpty(username)) {
        showToast(AdminMessages.MODAL_MISSING_NAME, ToastType.ERROR);
        return;
    }
    
    if (!_.isEmpty(expiresAt)) {
        expiresAt = new Date(expiresAt).toISOString();
    }
    
    setButtonLoading(btn, true, AdminMessages.SAVE_USER_PROGRESS);
    
    try {
        if (!_.isNil(editingKey)) {
            await fetchAPI(AdminActions.UPDATE_KEY, { license_key: editingKey, plan_type: planType, status: status, expires_at: expiresAt });
            showToast(AdminMessages.MODAL_UPDATE_SUCCESS, ToastType.SUCCESS);
        } else {
            const res = await fetchAPI(AdminActions.CREATE_KEY, { username, plan_type: planType });
            showToast(AdminMessages.MODAL_CREATE_SUCCESS + _.get(res, 'license_key'), ToastType.SUCCESS);
        }
        
        setTimeout(() => {
            closeModal(DOMIds.USER_MODAL);
            loadUsers();
        }, AdminConstants.MODAL_FADE_DELAY);
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
        btn.textContent = AdminMessages.MODAL_SAVE_DEFAULT;
    }
}

window.openDeleteModal = function(key) {
    deletingKey = key;
    el(DOMIds.DELETE_KEY_DISPLAY).textContent = key;
    el(DOMIds.DELETE_MODAL).classList.add('active');
}

async function handleSoftDelete() {
    const btn = el(DOMIds.BTN_SOFT_DELETE);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_SOFT_DELETE);
    try {
        await fetchAPI(AdminActions.REVOKE_KEY, { license_key: deletingKey });
        showToast(AdminMessages.DELETE_SOFT_SUCCESS, ToastType.SUCCESS);
        closeModal(DOMIds.DELETE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleHardDelete() {
    const btn = el(DOMIds.BTN_HARD_DELETE);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_HARD_DELETE);
    try {
        await fetchAPI(AdminActions.DELETE_KEY, { license_key: deletingKey });
        showToast(AdminMessages.DELETE_HARD_SUCCESS, ToastType.SUCCESS);
        closeModal(DOMIds.DELETE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleResetDevice() {
    if (!resettingKey) return;
    
    const confirmMsg = AdminMessages.RESET_DEVICE_CONFIRM.replace('{0}', resettingKey);
    if (!confirm(confirmMsg)) return;

    const btn = el(DOMIds.MODAL_RESET_DEVICE_BTN);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_RESET_DEVICE);

    try {
        await fetchAPI(AdminActions.RESET_DEVICE, { license_key: resettingKey });
        showToast(AdminMessages.RESET_DEVICE_SUCCESS, ToastType.SUCCESS);
        
        closeModal(DOMIds.DEVICE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.RESET_DEVICE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(AdminMessages.COPY_SUCCESS + text, ToastType.SUCCESS);
    }).catch(err => {
        Logger.error("Copy failed", err);
        showToast(AdminMessages.COPY_ERROR, ToastType.ERROR);
    });
}

window.openDeviceModal = function(key) {
    const user = _.find(window.adminUsersData || [], u => _.get(u, 'license_key') === key);
    if (!user) return;
    
    const container = el(DOMIds.DEVICE_LIST_CONTAINER);
    
    const emptyStateHtml = `
        <div class="empty-device">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <p>${AdminMessages.EMPTY_DEVICE_MSG}</p>
        </div>
    `;

    const renderCard = (dId) => `
        <div class="device-card">
            <div class="device-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div class="device-info">
                <span class="device-id" title="${escapeHTML(dId)}">${escapeHTML(dId)}</span>
                <span class="device-status">${AdminMessages.DEVICE_CONNECTED}</span>
            </div>
        </div>
    `;

    let deviceIdStr = emptyStateHtml;
    try {
        const parsedDevices = JSON.parse(_.get(user, 'device_id', '[]'));
        if (_.isArray(parsedDevices) && !_.isEmpty(parsedDevices)) {
            deviceIdStr = _.map(parsedDevices, d => renderCard(d)).join('');
        } else if (_.isString(parsedDevices) && !_.isEmpty(parsedDevices)) {
            deviceIdStr = renderCard(parsedDevices);
        }
    } catch (e) {
        if (!_.isEmpty(_.get(user, 'device_id'))) {
            deviceIdStr = renderCard(_.get(user, 'device_id'));
        }
    }
    
    container.innerHTML = deviceIdStr;
    
    const resetBtn = el(DOMIds.MODAL_RESET_DEVICE_BTN);
    if (!_.isEmpty(_.get(user, 'device_id'))) {
        resetBtn.style.display = AdminConstants.DISPLAY_FLEX;
        resetBtn.onclick = function() {
            resetDevice(key);
            closeModal(DOMIds.DEVICE_MODAL);
        };
    } else {
        resetBtn.style.display = AdminConstants.DISPLAY_NONE;
    }
    
    el(DOMIds.DEVICE_MODAL).classList.add('active');
}

async function handleSyncExpired() {
    const btn = el('sync-expired-btn');
    if (!btn) return;
    
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_SYNC);
    
    try {
        const result = await fetchAPI(AdminActions.SYNC_EXPIRED);
        const count = _.get(result, 'count', 0);
        showToast(AdminMessages.SYNC_SUCCESS.replace('{0}', count), ToastType.SUCCESS);
        if (count > 0) {
            loadUsers();
        }
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, 'message'), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

function initEventListeners() {
    el(DOMIds.LOGIN_BTN)?.addEventListener('click', handleLogin);
    el(DOMIds.LOGOUT_BTN)?.addEventListener('click', handleLogout);
    
    el('sync-expired-btn')?.addEventListener('click', handleSyncExpired);
    
    el(DOMIds.PRO_UNLIMITED)?.addEventListener('change', (e) => {
        const disabled = _.get(e, 'target.checked', false);
        el(DOMIds.PRO_QUOTA_VIDEO).disabled = disabled;
        el(DOMIds.PRO_QUOTA_IMAGE).disabled = disabled;
        el(DOMIds.PRO_QUOTA_VOICE).disabled = disabled;
    });

    el(DOMIds.SAVE_CONFIG_BTN)?.addEventListener('click', handleSaveConfig);
    
    el(DOMIds.SEARCH_INPUT)?.addEventListener('input', applyFilters);
    el(DOMIds.FILTER_PLAN)?.addEventListener('change', applyFilters);
    el(DOMIds.FILTER_STATUS)?.addEventListener('change', applyFilters);
    el(DOMIds.PAGE_SIZE)?.addEventListener('change', (e) => {
        pageSize = parseInt(_.get(e, 'target.value', AdminConstants.DEFAULT_PAGE_SIZE));
        currentPage = 1;
        renderTable();
    });

    el(DOMIds.OPEN_CREATE_MODAL_BTN)?.addEventListener('click', handleOpenCreateModal);
    el(DOMIds.MODAL_PLAN_TYPE)?.addEventListener('change', handlePlanTypeChange);
    el(DOMIds.SAVE_USER_BTN)?.addEventListener('click', handleSaveUser);
    el(DOMIds.BTN_SOFT_DELETE)?.addEventListener('click', handleSoftDelete);
    el(DOMIds.BTN_HARD_DELETE)?.addEventListener('click', handleHardDelete);

    const configToggleBtn = el(DOMIds.CONFIG_TOGGLE_BTN);
    const configDropdownMenu = el(DOMIds.CONFIG_DROPDOWN_MENU);

    if (configToggleBtn && configDropdownMenu) {
        configToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            configDropdownMenu.style.display = configDropdownMenu.style.display === AdminConstants.DISPLAY_NONE ? AdminConstants.DISPLAY_BLOCK : AdminConstants.DISPLAY_NONE;
        });

        document.addEventListener('click', (e) => {
            if (!configToggleBtn.contains(e.target) && !configDropdownMenu.contains(e.target)) {
                configDropdownMenu.style.display = AdminConstants.DISPLAY_NONE;
            }
        });

        configDropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        el(DOMIds.SAVE_CONFIG_BTN)?.addEventListener('click', () => {
            configDropdownMenu.style.display = AdminConstants.DISPLAY_NONE;
        });
    }
}

function init() {
    initEventListeners();
    if (_.every([adminToken, apiUrl], val => !_.isEmpty(val))) {
        showDashboard();
    }
}

init();
