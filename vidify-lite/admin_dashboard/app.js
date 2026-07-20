const API_BASE_URL = 'THAY_LINK_GOOGLE_WEB_APP_CUA_BAN_VAO_DAY';

const AdminConstants = {
    TOKEN_KEY: 'adminToken',
    API_URL_KEY: 'apiUrl',
    PLAN_PRO: 'PRO',
    PLAN_FREE: 'FREE',
    STATUS_ACTIVE: 'ACTIVE',
    PLAN_PRO_LIFETIME: 'PRO_LIFETIME'
};

const AdminMessages = {
    MISSING_LINK: "Bạn chưa thay thế đường link Google Web App vào file app.js!",
    MISSING_INFO: "Vui lòng nhập đủ thông tin!",
    LOGIN_PROGRESS: "Đang đăng nhập...",
    LOGIN_ERROR_API: "Lỗi kết nối API!",
    LOGIN_DEFAULT: "Đang Nhập",
    INVALID_TOKEN: "Token không hợp lệ!",
    FETCH_ERROR: "Lỗi khi tải dữ liệu: ",
    SAVE_PROGRESS: "Đang lưu...",
    SAVE_SUCCESS: "Đã lưu cấu hình Quota!",
    SAVE_ERROR: "Lỗi: ",
    SAVE_DEFAULT: "Lưu Cấu Hình",
    MODAL_CREATE_TITLE: "Tạo License Mới",
    MODAL_EDIT_TITLE: "Sửa License",
    MODAL_MISSING_NAME: "Vui lòng nhập tên khách hàng!",
    MODAL_UPDATE_SUCCESS: "Đã cập nhật thành công!",
    MODAL_CREATE_SUCCESS: "Tạo thành công! License Key: ",
    MODAL_SAVE_DEFAULT: "Lưu",
    DELETE_PROGRESS: "Đang xử lý...",
    HARD_DELETE_PROGRESS: "Đang xóa...",
    RESET_DEVICE_CONFIRM: "Bạn có chắc chắn muốn Reset Thiết Bị cho Key: {0}?\nLưu ý: Khách hàng sẽ có thể đăng nhập trên một máy tính mới.",
    RESET_DEVICE_ERROR: "Lỗi khi reset thiết bị: "
};

let adminToken = localStorage.getItem(AdminConstants.TOKEN_KEY) || '';
let apiUrl = API_BASE_URL;

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('admin-username-input');
const passwordInput = document.getElementById('admin-password-input');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const tbody = document.querySelector('#users-table tbody');
const loadingMsg = document.getElementById('loading-msg');
const refreshBtn = document.getElementById('refresh-btn');

const saveConfigBtn = document.getElementById('save-config-btn');
const configMsg = document.getElementById('config-msg');
const inputQuotaVideo = document.getElementById('free-quota-video');
const inputQuotaImage = document.getElementById('free-quota-image');
const inputQuotaVoice = document.getElementById('free-quota-voice');

const inputProQuotaVideo = document.getElementById('pro-quota-video');
const inputProQuotaImage = document.getElementById('pro-quota-image');
const inputProQuotaVoice = document.getElementById('pro-quota-voice');
const inputProUnlimited = document.getElementById('pro-unlimited');

inputProUnlimited.addEventListener('change', (e) => {
    const disabled = _.get(e, 'target.checked', false);
    inputProQuotaVideo.disabled = disabled;
    inputProQuotaImage.disabled = disabled;
    inputProQuotaVoice.disabled = disabled;
});

if (!_.isEmpty(adminToken) && !_.isEmpty(apiUrl) && apiUrl !== 'THAY_LINK_GOOGLE_WEB_APP_CUA_BAN_VAO_DAY') {
    showDashboard();
}

loginBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    const url = API_BASE_URL;

    if (url === 'THAY_LINK_GOOGLE_WEB_APP_CUA_BAN_VAO_DAY') {
        loginError.textContent = AdminMessages.MISSING_LINK;
        return;
    }

    if (_.some([user, pass], _.isEmpty)) {
        loginError.textContent = AdminMessages.MISSING_INFO;
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = AdminMessages.LOGIN_PROGRESS;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                action: 'admin_login',
                username: user,
                password: pass
            })
        });

        const data = await response.json();
        if (_.get(data, 'status') === 'success' && _.has(data, 'token')) {
            adminToken = _.get(data, 'token');
            apiUrl = url;
            localStorage.setItem(AdminConstants.TOKEN_KEY, adminToken);
            localStorage.setItem(AdminConstants.API_URL_KEY, apiUrl);
            showDashboard();
        } else {
            loginError.textContent = _.get(data, 'error', 'Sai tài khoản hoặc mật khẩu!');
        }
    } catch (e) {
        loginError.textContent = AdminMessages.LOGIN_ERROR_API;
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = AdminMessages.LOGIN_DEFAULT;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AdminConstants.TOKEN_KEY);
    adminToken = '';
    apiUrl = API_BASE_URL;
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    usernameInput.value = '';
    passwordInput.value = '';
});

function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
    loadUsers();
    loadConfig();
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
            if (_.get(resJson, 'code') === 401) {
                alert(AdminMessages.INVALID_TOKEN);
                logoutBtn.click();
                throw new Error("Invalid token");
            }
            throw new Error(_.get(resJson, 'error'));
        }
        return resJson;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function loadUsers() {
    tbody.innerHTML = '';
    loadingMsg.style.display = 'block';
    
    try {
        const res = await fetchAPI('admin_get_users');
        loadingMsg.style.display = 'none';
        
        const users = _.get(res, 'users', []);
        
        _.forEach(users, (user) => {
            const tr = document.createElement('tr');
            
            const usageText = `Vid: ${_.get(user, 'usage.video')} | Img: ${_.get(user, 'usage.image')} | Char: ${_.get(user, 'usage.voice')}`;
            
            const isPro = _.get(user, 'plan_type') === AdminConstants.PLAN_PRO;
            const isActive = _.get(user, 'status') === AdminConstants.STATUS_ACTIVE;
            const expiresAtStr = _.get(user, 'expires_at') ? new Date(_.get(user, 'expires_at')).toLocaleDateString() : 'Vĩnh viễn';
            const deviceIdStr = _.get(user, 'device_id') ? _.get(user, 'device_id') : '<em style="color:#9ca3af">Chưa liên kết</em>';
            
            const btnResetDevice = _.get(user, 'device_id') 
                ? `<button class="btn-secondary btn-sm" onclick="resetDevice('${_.get(user, 'license_key')}')" style="background:#f59e0b; color:white; border:none;">Reset Thiết bị</button>` 
                : '';

            tr.innerHTML = `
                <td><strong>${escapeHTML(_.get(user, 'username'))}</strong></td>
                <td>
                    <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 4px;">${_.get(user, 'license_key')}</code>
                </td>
                <td><span class="badge ${isPro ? 'pro' : 'free'}">${_.get(user, 'plan_type')}</span></td>
                <td><span class="badge ${isActive ? 'active' : 'revoked'}">${_.get(user, 'status')}</span></td>
                <td style="font-size: 0.85rem">${usageText}</td>
                <td>${new Date(_.get(user, 'created_at')).toLocaleDateString()}</td>
                <td>${expiresAtStr}</td>
                <td style="font-size: 0.85rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${_.get(user, 'device_id', 'Chưa liên kết')}">${deviceIdStr}</td>
                <td style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    <button class="btn-primary btn-sm" onclick="openEditModal('${_.get(user, 'license_key')}', '${escapeHTML(_.get(user, 'username'))}', '${_.get(user, 'plan_type')}', '${_.get(user, 'expires_at', '')}')">Sửa</button>
                    ${btnResetDevice}
                    <button class="btn-danger btn-sm" onclick="openDeleteModal('${_.get(user, 'license_key')}')">Xóa/Khóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        loadingMsg.style.display = 'none';
        loadingMsg.textContent = AdminMessages.FETCH_ERROR + _.get(error, 'message');
        loadingMsg.style.display = 'block';
    }
}

refreshBtn.addEventListener('click', () => {
    loadUsers();
    loadConfig();
});

async function loadConfig() {
    try {
        const res = await fetchAPI('admin_get_config');
        const config = _.get(res, 'config');
        if (!_.isNil(config)) {
            inputQuotaVideo.value = _.get(config, 'free_video', 0);
            inputQuotaImage.value = _.get(config, 'free_image', 0);
            inputQuotaVoice.value = _.get(config, 'free_voice', 0);
            inputProQuotaVideo.value = _.get(config, 'pro_video', 0);
            inputProQuotaImage.value = _.get(config, 'pro_image', 0);
            inputProQuotaVoice.value = _.get(config, 'pro_voice', 0);
            inputProUnlimited.checked = _.get(config, 'pro_unlimited', false);
            document.getElementById('config-max-devices').value = _.get(config, 'max_devices', 1);
            
            inputProUnlimited.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error("Lỗi khi load config: ", error);
    }
}

saveConfigBtn.addEventListener('click', async () => {
    saveConfigBtn.disabled = true;
    saveConfigBtn.textContent = AdminMessages.SAVE_PROGRESS;
    configMsg.textContent = '';
    
    try {
        await fetchAPI('admin_update_config', {
            free_quota_video: parseInt(inputQuotaVideo.value) || 0,
            free_quota_image: parseInt(inputQuotaImage.value) || 0,
            free_quota_voice: parseInt(inputQuotaVoice.value) || 0,
            pro_quota_video: parseInt(inputProQuotaVideo.value) || 0,
            pro_quota_image: parseInt(inputProQuotaImage.value) || 0,
            pro_quota_voice: parseInt(inputProQuotaVoice.value) || 0,
            pro_unlimited: inputProUnlimited.checked,
            max_devices: parseInt(document.getElementById('config-max-devices').value) || 1
        });
        configMsg.className = 'success-msg';
        configMsg.textContent = AdminMessages.SAVE_SUCCESS;
        setTimeout(() => configMsg.textContent = '', 3000);
    } catch (error) {
        configMsg.className = 'error-msg';
        configMsg.textContent = AdminMessages.SAVE_ERROR + _.get(error, 'message');
    } finally {
        saveConfigBtn.disabled = false;
        saveConfigBtn.textContent = AdminMessages.SAVE_DEFAULT;
    }
});

let editingKey = null;
let deletingKey = null;

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

document.getElementById('open-create-modal-btn').addEventListener('click', () => {
    editingKey = null;
    document.getElementById('user-modal-title').textContent = AdminMessages.MODAL_CREATE_TITLE;
    document.getElementById('modal-username').value = '';
    document.getElementById('modal-username').disabled = false;
    document.getElementById('modal-plan-type').value = AdminConstants.PLAN_FREE;
    document.getElementById('modal-expires').value = '';
    document.getElementById('modal-expires-wrapper').style.display = 'none';
    document.getElementById('modal-user-msg').textContent = '';
    document.getElementById('user-modal').classList.add('active');
});

window.openEditModal = function(key, username, planType, expiresAt) {
    editingKey = key;
    document.getElementById('user-modal-title').textContent = AdminMessages.MODAL_EDIT_TITLE;
    document.getElementById('modal-username').value = username;
    document.getElementById('modal-username').disabled = true;
    document.getElementById('modal-plan-type').value = planType;
    
    if (!_.isEmpty(expiresAt)) {
        document.getElementById('modal-expires').value = new Date(expiresAt).toISOString().split('T')[0];
    } else {
        document.getElementById('modal-expires').value = '';
    }
    
    document.getElementById('modal-expires-wrapper').style.display = 'flex';
    document.getElementById('modal-user-msg').textContent = '';
    document.getElementById('user-modal').classList.add('active');
}

document.getElementById('modal-plan-type').addEventListener('change', (e) => {
    const wrapper = document.getElementById('modal-expires-wrapper');
    const selectedPlan = _.get(e, 'target.value');
    if (!_.isNil(editingKey) || !_.includes([AdminConstants.PLAN_FREE, AdminConstants.PLAN_PRO_LIFETIME], selectedPlan)) {
        wrapper.style.display = 'flex';
    } else {
        wrapper.style.display = 'none';
    }
});

document.getElementById('save-user-btn').addEventListener('click', async () => {
    const btn = document.getElementById('save-user-btn');
    const msg = document.getElementById('modal-user-msg');
    
    const username = document.getElementById('modal-username').value.trim();
    const planType = document.getElementById('modal-plan-type').value;
    let expiresAt = document.getElementById('modal-expires').value;
    
    if (_.isNil(editingKey) && _.isEmpty(username)) {
        msg.className = 'error-msg';
        msg.textContent = AdminMessages.MODAL_MISSING_NAME;
        return;
    }
    
    if (!_.isEmpty(expiresAt)) {
        expiresAt = new Date(expiresAt).toISOString();
    }
    
    btn.disabled = true;
    btn.textContent = AdminMessages.SAVE_PROGRESS;
    msg.textContent = '';
    
    try {
        if (!_.isNil(editingKey)) {
            await fetchAPI('admin_update_key', { license_key: editingKey, plan_type: planType, expires_at: expiresAt });
            msg.className = 'success-msg';
            msg.textContent = AdminMessages.MODAL_UPDATE_SUCCESS;
        } else {
            const res = await fetchAPI('admin_create_key', { username, plan_type: planType });
            msg.className = 'success-msg';
            msg.textContent = AdminMessages.MODAL_CREATE_SUCCESS + _.get(res, 'license_key');
        }
        
        setTimeout(() => {
            closeModal('user-modal');
            loadUsers();
        }, 1500);
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = AdminMessages.SAVE_ERROR + _.get(error, 'message');
    } finally {
        btn.disabled = false;
        btn.textContent = AdminMessages.MODAL_SAVE_DEFAULT;
    }
});

window.openDeleteModal = function(key) {
    deletingKey = key;
    document.getElementById('delete-key-display').textContent = key;
    document.getElementById('modal-delete-msg').textContent = '';
    document.getElementById('delete-modal').classList.add('active');
}

document.getElementById('btn-soft-delete').addEventListener('click', async () => {
    const msg = document.getElementById('modal-delete-msg');
    msg.textContent = AdminMessages.DELETE_PROGRESS;
    try {
        await fetchAPI('admin_revoke_key', { license_key: deletingKey });
        closeModal('delete-modal');
        loadUsers();
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = AdminMessages.SAVE_ERROR + _.get(error, 'message');
    }
});

document.getElementById('btn-hard-delete').addEventListener('click', async () => {
    const msg = document.getElementById('modal-delete-msg');
    msg.textContent = AdminMessages.HARD_DELETE_PROGRESS;
    try {
        await fetchAPI('admin_delete_key', { license_key: deletingKey });
        closeModal('delete-modal');
        loadUsers();
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = AdminMessages.SAVE_ERROR + _.get(error, 'message');
    }
});

window.resetDevice = async function(key) {
    const confirmMessage = AdminMessages.RESET_DEVICE_CONFIRM.replace('{0}', key);
    if (!confirm(confirmMessage)) return;
    
    try {
        await fetchAPI('admin_reset_device', { license_key: key });
        loadUsers();
    } catch (error) {
        alert(AdminMessages.RESET_DEVICE_ERROR + _.get(error, 'message'));
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
