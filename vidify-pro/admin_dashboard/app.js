// Trạng thái cục bộ
let adminToken = localStorage.getItem('adminToken') || '';
let apiUrl = localStorage.getItem('apiUrl') || '';

// Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('admin-username-input');
const passwordInput = document.getElementById('admin-password-input');
const apiUrlInput = document.getElementById('api-url-input');
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
    const disabled = e.target.checked;
    inputProQuotaVideo.disabled = disabled;
    inputProQuotaImage.disabled = disabled;
    inputProQuotaVoice.disabled = disabled;
});

// Khởi tạo
if (adminToken && apiUrl) {
    showDashboard();
} else {
    // Để url rỗng cho người dùng tự điền
    if(apiUrl) apiUrlInput.value = apiUrl;
}

// Xử lý Login
loginBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    const url = apiUrlInput.value.trim();

    if (!user || !pass || !url) {
        loginError.textContent = "Vui lòng nhập đủ thông tin!";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Đang đăng nhập...';

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
        if (data.status === 'success' && data.token) {
            adminToken = data.token;
            apiUrl = url;
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('apiUrl', apiUrl);
            showDashboard();
        } else {
            loginError.textContent = data.error || 'Sai tài khoản hoặc mật khẩu!';
        }
    } catch (e) {
        loginError.textContent = 'Lỗi kết nối API!';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Đang Nhập';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('apiUrl');
    adminToken = '';
    apiUrl = '';
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

// Fetch helper
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
        
        if (resJson.error) {
            if (resJson.code === 401) {
                alert("Token không hợp lệ!");
                logoutBtn.click();
                throw new Error("Invalid token");
            }
            throw new Error(resJson.error);
        }
        return resJson;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Load danh sách người dùng
async function loadUsers() {
    tbody.innerHTML = '';
    loadingMsg.style.display = 'block';
    
    try {
        const res = await fetchAPI('admin_get_users');
        loadingMsg.style.display = 'none';
        
        res.users.forEach(user => {
            const tr = document.createElement('tr');
            
            const usageText = `Vid: ${user.usage.video} | Img: ${user.usage.image} | Char: ${user.usage.voice}`;
            
            tr.innerHTML = `
                <td><strong>${escapeHTML(user.username)}</strong></td>
                <td>
                    <code style="background: #f1f1f1; padding: 2px 6px; border-radius: 4px;">${user.license_key}</code>
                </td>
                <td><span class="badge ${user.plan_type === 'PRO' ? 'pro' : 'free'}">${user.plan_type}</span></td>
                <td><span class="badge ${user.status === 'ACTIVE' ? 'active' : 'revoked'}">${user.status}</span></td>
                <td style="font-size: 0.85rem">${usageText}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.expires_at ? new Date(user.expires_at).toLocaleDateString() : 'Vĩnh viễn'}</td>
                <td style="font-size: 0.85rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${user.device_id || 'Chưa liên kết'}">${user.device_id ? user.device_id : '<em style="color:#9ca3af">Chưa liên kết</em>'}</td>
                <td style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    <button class="btn-primary btn-sm" onclick="openEditModal('${user.license_key}', '${escapeHTML(user.username)}', '${user.plan_type}', '${user.expires_at || ''}')">Sửa</button>
                    ${user.device_id ? `<button class="btn-secondary btn-sm" onclick="resetDevice('${user.license_key}')" style="background:#f59e0b; color:white; border:none;">Reset Thiết bị</button>` : ''}
                    <button class="btn-danger btn-sm" onclick="openDeleteModal('${user.license_key}')">Xóa/Khóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        loadingMsg.style.display = 'none';
        loadingMsg.textContent = "Lỗi khi tải dữ liệu: " + error.message;
        loadingMsg.style.display = 'block';
    }
}

refreshBtn.addEventListener('click', () => {
    loadUsers();
    loadConfig();
});

// Load config
async function loadConfig() {
    try {
        const res = await fetchAPI('admin_get_config');
        if (res.config) {
            inputQuotaVideo.value = res.config.free_video || 0;
            inputQuotaImage.value = res.config.free_image || 0;
            inputQuotaVoice.value = res.config.free_voice || 0;
            inputProQuotaVideo.value = res.config.pro_video || 0;
            inputProQuotaImage.value = res.config.pro_image || 0;
            inputProQuotaVoice.value = res.config.pro_voice || 0;
            inputProUnlimited.checked = res.config.pro_unlimited || false;
            document.getElementById('config-max-devices').value = res.config.max_devices || 1;
            
            inputProUnlimited.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error("Lỗi khi load config: ", error);
    }
}

// Lưu config
saveConfigBtn.addEventListener('click', async () => {
    saveConfigBtn.disabled = true;
    saveConfigBtn.textContent = 'Đang lưu...';
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
        configMsg.textContent = 'Đã lưu cấu hình Quota!';
        setTimeout(() => configMsg.textContent = '', 3000);
    } catch (error) {
        configMsg.className = 'error-msg';
        configMsg.textContent = 'Lỗi: ' + error.message;
    } finally {
        saveConfigBtn.disabled = false;
        saveConfigBtn.textContent = 'Lưu Cấu Hình';
    }
});

// ==========================================
// MODAL LOGIC
// ==========================================
let editingKey = null;
let deletingKey = null;

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

// 1. User Modal (Tạo / Sửa)
document.getElementById('open-create-modal-btn').addEventListener('click', () => {
    editingKey = null;
    document.getElementById('user-modal-title').textContent = 'Tạo License Mới';
    document.getElementById('modal-username').value = '';
    document.getElementById('modal-username').disabled = false;
    document.getElementById('modal-plan-type').value = 'FREE';
    document.getElementById('modal-expires').value = '';
    document.getElementById('modal-expires-wrapper').style.display = 'none';
    document.getElementById('modal-user-msg').textContent = '';
    document.getElementById('user-modal').classList.add('active');
});

window.openEditModal = function(key, username, planType, expiresAt) {
    editingKey = key;
    document.getElementById('user-modal-title').textContent = 'Sửa License';
    document.getElementById('modal-username').value = username;
    document.getElementById('modal-username').disabled = true; // Không cho sửa tên
    document.getElementById('modal-plan-type').value = planType;
    
    if (expiresAt) {
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
    if (editingKey || e.target.value !== 'FREE' && e.target.value !== 'PRO_LIFETIME') {
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
    
    if (!editingKey && !username) {
        msg.className = 'error-msg';
        msg.textContent = "Vui lòng nhập tên khách hàng!";
        return;
    }
    
    if (expiresAt) {
        expiresAt = new Date(expiresAt).toISOString();
    }
    
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    msg.textContent = '';
    
    try {
        if (editingKey) {
            await fetchAPI('admin_update_key', { license_key: editingKey, plan_type: planType, expires_at: expiresAt });
            msg.className = 'success-msg';
            msg.textContent = 'Đã cập nhật thành công!';
        } else {
            const res = await fetchAPI('admin_create_key', { username, plan_type: planType });
            msg.className = 'success-msg';
            msg.textContent = `Tạo thành công! License Key: ${res.license_key}`;
        }
        
        setTimeout(() => {
            closeModal('user-modal');
            loadUsers();
        }, 1500);
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = "Lỗi: " + error.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu';
    }
});

// 2. Delete Modal (Xóa Mềm / Xóa Cứng)
window.openDeleteModal = function(key) {
    deletingKey = key;
    document.getElementById('delete-key-display').textContent = key;
    document.getElementById('modal-delete-msg').textContent = '';
    document.getElementById('delete-modal').classList.add('active');
}

document.getElementById('btn-soft-delete').addEventListener('click', async () => {
    const msg = document.getElementById('modal-delete-msg');
    msg.textContent = 'Đang xử lý...';
    try {
        await fetchAPI('admin_revoke_key', { license_key: deletingKey });
        closeModal('delete-modal');
        loadUsers();
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = "Lỗi: " + error.message;
    }
});

document.getElementById('btn-hard-delete').addEventListener('click', async () => {
    const msg = document.getElementById('modal-delete-msg');
    msg.textContent = 'Đang xóa...';
    try {
        await fetchAPI('admin_delete_key', { license_key: deletingKey });
        closeModal('delete-modal');
        loadUsers();
    } catch (error) {
        msg.className = 'error-msg';
        msg.textContent = "Lỗi: " + error.message;
    }
});

window.resetDevice = async function(key) {
    if (!confirm(`Bạn có chắc chắn muốn Reset Thiết Bị cho Key: ${key}?\nLưu ý: Khách hàng sẽ có thể đăng nhập trên một máy tính mới.`)) return;
    
    try {
        await fetchAPI('admin_reset_device', { license_key: key });
        loadUsers();
    } catch (error) {
        alert("Lỗi khi reset thiết bị: " + error.message);
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
