const el = (id) => document.getElementById(id);
const elq = (selector) => document.querySelector(selector);

let adminToken = localStorage.getItem(AdminConstants.TOKEN_KEY) || AdminConstants.EMPTY_STR;
let apiUrl = API_BASE_URL;
let currentPage = AdminConstants.DEFAULT_PAGE;
let pageSize = AdminConstants.DEFAULT_PAGE_SIZE;
let filteredUsers = [];
let editingUserId = null;
let deletingUserId = null;
let deletingUserKey = null;
let resettingUserId = null;
window.editingAccountId = null;

function escapeHTML(str) {
    if (_.isNil(str)) return AdminConstants.EMPTY_STR;
    return _.replace(_.toString(str), AdminRegex.ESCAPE_HTML, 
        tag => _.get(AdminConstants.HTML_ENTITIES, tag, tag)
    );
}

function setButtonLoading(btn, isLoading, loadingText = AdminConstants.EMPTY_STR) {
    if (_.isNil(btn)) return;
    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.classList.add(AdminClasses.BTN_LOADING);
        btn.innerHTML = AdminTemplates.LOADING_BTN(loadingText);
        btn.disabled = true;
    } else {
        btn.classList.remove(AdminClasses.BTN_LOADING);
        if (!_.isNil(btn.dataset.originalHtml)) {
            btn.innerHTML = btn.dataset.originalHtml;
        }
        btn.disabled = false;
    }
}

function showToast(message, type = ToastType.SUCCESS) {
    const container = el(DOMIds.TOAST_CONTAINER);
    if (_.isNil(container)) return;
    
    const toast = document.createElement(TagNames.DIV);
    toast.className = `${AdminClasses.TOAST} ${type === ToastType.SUCCESS ? AdminClasses.TOAST_SUCCESS : AdminClasses.TOAST_ERROR}`;
    
    const iconSvg = type === ToastType.SUCCESS ? AdminIcons.SUCCESS_TOAST : AdminIcons.ERROR_TOAST;
    const title = type === ToastType.SUCCESS ? AdminMessages.TOAST_SUCCESS : AdminMessages.TOAST_ERROR;

    toast.innerHTML = AdminTemplates.TOAST(iconSvg, title, escapeHTML(message));
    container.appendChild(toast);

    const closeBtn = toast.querySelector(AdminSelectors.TOAST_CLOSE);
    let isRemoving = false;

    const removeToast = () => {
        if (isRemoving) return;
        isRemoving = true;
        toast.classList.add(AdminClasses.REMOVING);
        setTimeout(() => toast.remove(), AdminConstants.TOAST_ANIMATION_MS);
    };

    if (closeBtn) closeBtn.addEventListener(EventTypes.CLICK, removeToast);
    setTimeout(removeToast, AdminConstants.TOAST_DURATION);
}

async function fetchAPI(action, data = {}) {
    try {
        const response = await fetch(apiUrl, {
            method: AdminConstants.HTTP_POST,
            body: JSON.stringify({
                [ApiFields.ACTION]: action,
                [ApiFields.ADMIN_TOKEN]: adminToken,
                ...data
            })
        });
        const resJson = await response.json();
        
        if (_.has(resJson, ApiFields.ERROR)) {
            if (_.get(resJson, ApiFields.CODE) === AdminConstants.API_ERROR_UNAUTHORIZED) {
                showToast(AdminMessages.INVALID_TOKEN, ToastType.ERROR);
                el(DOMIds.LOGOUT_BTN).click();
                throw new Error(AdminMessages.INVALID_TOKEN);
            }
            throw new Error(_.get(resJson, ApiFields.ERROR));
        }
        return resJson;
    } catch (err) {
        Logger.error(err);
        throw err;
    }
}

function showDashboard() {
    el(DOMIds.LOGIN_SCREEN).classList.remove(AdminClasses.ACTIVE);
    el(DOMIds.DASHBOARD_SCREEN).classList.add(AdminClasses.ACTIVE);
    loadUsers();
    loadPlans();
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
            method: AdminConstants.HTTP_POST,
            body: JSON.stringify({
                [ApiFields.ACTION]: AdminActions.LOGIN,
                [ApiFields.USERNAME]: user,
                [ApiFields.PASSWORD]: pass
            })
        });

        const data = await response.json();
        if (_.get(data, ApiFields.STATUS) === ToastType.SUCCESS && _.has(data, ApiFields.TOKEN)) {
            adminToken = _.get(data, ApiFields.TOKEN);
            apiUrl = API_BASE_URL;
            localStorage.setItem(AdminConstants.TOKEN_KEY, adminToken);
            localStorage.setItem(AdminConstants.API_URL_KEY, apiUrl);
            showDashboard();
        } else {
            showToast(_.get(data, ApiFields.ERROR, AdminMessages.LOGIN_ERROR_DEFAULT), ToastType.ERROR);
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
    adminToken = AdminConstants.EMPTY_STR;
    apiUrl = API_BASE_URL;
    el(DOMIds.DASHBOARD_SCREEN).classList.remove(AdminClasses.ACTIVE);
    el(DOMIds.LOGIN_SCREEN).classList.add(AdminClasses.ACTIVE);
    el(DOMIds.USERNAME_INPUT).value = AdminConstants.EMPTY_STR;
    el(DOMIds.PASSWORD_INPUT).value = AdminConstants.EMPTY_STR;
}

async function loadUsers() {
    const tbody = elq(DOMIds.TBODY);
    tbody.innerHTML = AdminTemplates.TABLE_LOADING(AdminConstants.COLSPAN_USERS, AdminMessages.DATA_LOADING);
    
    try {
        const res = await fetchAPI(AdminActions.GET_USERS);
        window[AdminConstants.GLOBAL_USERS] = _.get(res, ApiFields.USERS, []);
        
        populateAssignSelects();
        applyFilters();
    } catch (error) {
        const errMsg = _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR);
        tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_USERS, AdminMessages.FETCH_ERROR + escapeHTML(errMsg));
        showToast(AdminMessages.FETCH_ERROR + errMsg, ToastType.ERROR);
    }
}

function applyFilters() {
    const searchStr = (_.get(el(DOMIds.SEARCH_INPUT), 'value', AdminConstants.EMPTY_STR)).toLowerCase();
    const planFilter = _.get(el(DOMIds.FILTER_PLAN), 'value', AdminConstants.FILTER_ALL);
    const statusFilter = _.get(el(DOMIds.FILTER_STATUS), 'value', AdminConstants.FILTER_ALL);
    
    filteredUsers = _.filter(_.get(window, AdminConstants.GLOBAL_USERS, []), u => {
        let matchSearch = true;
        if (!_.isEmpty(searchStr)) {
            const uname = (_.get(u, ApiFields.USERNAME) || AdminConstants.EMPTY_STR).toLowerCase();
            const ukey = (_.get(u, ApiFields.LICENSE_KEY) || AdminConstants.EMPTY_STR).toLowerCase();
            matchSearch = _.some([uname, ukey], str => _.includes(str, searchStr));
        }
        let matchPlan = (planFilter === AdminConstants.FILTER_ALL) ? true : _.get(u, ApiFields.PLAN_ID) === planFilter;
        let matchStatus = (statusFilter === AdminConstants.FILTER_ALL) ? true : _.get(u, ApiFields.STATUS) === statusFilter;
        return _.every([matchSearch, matchPlan, matchStatus], Boolean);
    });
    currentPage = AdminConstants.DEFAULT_PAGE;
    renderTable();
}

function renderTable() {
    const tbody = elq(DOMIds.TBODY);
    tbody.innerHTML = AdminConstants.EMPTY_STR;
    
    if (_.isEmpty(filteredUsers)) {
        tbody.innerHTML = AdminTemplates.TABLE_EMPTY(AdminConstants.COLSPAN_USERS, AdminMessages.EMPTY_USERS);
        el(DOMIds.PAGINATION_CONTAINER).style.display = AdminClasses.DISPLAY_NONE;
        return;
    }
    
    const totalItems = _.size(filteredUsers);
    const totalPages = Math.ceil(totalItems / pageSize) || AdminConstants.MIN_PAGE;
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < AdminConstants.MIN_PAGE) currentPage = AdminConstants.MIN_PAGE;
    
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedUsers = _.slice(filteredUsers, startIndex, startIndex + pageSize);
    
    const getPlanBadgeClass = (planName) => {
        const upper = _.toUpper(planName);
        if (_.includes(upper, AdminConstants.PLAN_FREE)) return AdminClasses.BADGE_FREE;
        if (_.includes(upper, AdminConstants.PLAN_PRO) || _.includes(upper, AdminConstants.PLAN_VIP) || _.includes(upper, AdminConstants.PLAN_LIFETIME)) return AdminClasses.BADGE_PRO;
        return AdminClasses.BADGE_FREE;
    };

    const localizeStatus = (status) => {
        if (status === AdminConstants.STATUS_ACTIVE) return AdminMessages.STATUS_ACTIVE_LABEL;
        if (status === AdminConstants.STATUS_REVOKED) return AdminMessages.STATUS_REVOKED_LABEL;
        if (status === AdminConstants.STATUS_EXPIRED) return AdminMessages.STATUS_EXPIRED_LABEL;
        return status;
    };

    const getStatusClass = (status) => {
        if (status === AdminConstants.STATUS_ACTIVE) return AdminClasses.ACTIVE;
        if (status === AdminConstants.STATUS_REVOKED) return AdminClasses.BADGE_REVOKED;
        return AdminClasses.BADGE_EXPIRED;
    };
    
    const htmlRows = _.map(paginatedUsers, user => {
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        const plan = _.find(plans, p => p.id === _.get(user, ApiFields.PLAN_ID));
        
        let tv = '0', ti = '0', tc = '0';
        if (plan) {
            tv = plan.is_unlimited ? AdminConstants.INFINITY_SIGN : plan.quota_video;
            ti = plan.is_unlimited ? AdminConstants.INFINITY_SIGN : plan.quota_image;
            tc = plan.is_unlimited ? AdminConstants.INFINITY_SIGN : plan.quota_voice;
        }

        const usageText = AdminTemplates.USAGE_TEXT(
            _.get(user, ApiFields.USAGE_VIDEO, 0), tv,
            _.get(user, ApiFields.USAGE_IMAGE, 0), ti,
            _.get(user, ApiFields.USAGE_VOICE, 0), tc
        );
        const planName = _.get(user, AdminConstants.PLAN_NAME_PATH, AdminConstants.UNKNOWN_STR);
        const expiresAtStr = _.get(user, ApiFields.EXPIRES_AT) ? new Date(_.get(user, ApiFields.EXPIRES_AT)).toLocaleDateString() : AdminMessages.EXPIRES_LIFETIME;
        const quotaType = _.get(user, ApiFields.QUOTA_TYPE, QuotaType.DAILY);
        const quotaTypeLabel = _.isEqual(quotaType, QuotaType.DAILY) ? AdminMessages.QUOTA_DAILY_LABEL : AdminMessages.QUOTA_TOTAL_LABEL;
        const quotaTypeBadge = `<span style="font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:3px; background:rgba(255,255,255,0.1); margin-left:0.3rem;" title="${quotaType}">${quotaTypeLabel}</span>`;
        
        const btnDeviceModal = `<button class="action-btn action-warn" data-action="${AdminConstants.ACTION_DEVICE}" data-id="${_.get(user, ApiFields.ID)}" title="${AdminMessages.ACTION_MODAL_DEVICES}">${AdminIcons.BTN_DEVICE}</button>`;
        const btnCopy = `<button class="copy-btn" data-action="${AdminConstants.ACTION_COPY}" data-key="${_.get(user, ApiFields.LICENSE_KEY)}" title="${AdminMessages.ACTION_MODAL_COPY}">${AdminIcons.BTN_COPY}</button>`;
        
        return `
            <tr>
                <td><strong>${escapeHTML(_.get(user, ApiFields.USERNAME))}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                        <span style="font-family: monospace; font-size: 0.9rem; color: var(--text-muted);">${escapeHTML(_.get(user, ApiFields.LICENSE_KEY))}</span>
                        ${btnCopy}
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge ${getPlanBadgeClass(planName)}">${escapeHTML(planName)}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${getStatusClass(_.get(user, ApiFields.STATUS))}">${escapeHTML(localizeStatus(_.get(user, ApiFields.STATUS)))}</span>
                </td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:0.2rem;">
                    <div>${usageText}</div>
                    ${quotaTypeBadge}
                </td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted);">${new Date(_.get(user, ApiFields.CREATED_AT)).toLocaleDateString()}</td>
                <td class="text-center" style="font-size: 0.85rem; color: var(--text-muted);">${expiresAtStr}</td>
                <td class="text-center">
                    <div style="display: flex; justify-content: center; gap: 0.25rem;">
                        <button class="action-btn action-info" data-action="${AdminConstants.ACTION_EDIT}" data-id="${_.get(user, ApiFields.ID)}" title="${AdminMessages.ACTION_MODAL_EDIT}">${AdminIcons.BTN_EDIT}</button>
                        ${btnDeviceModal}
                        <button class="action-btn action-danger" data-action="${AdminConstants.ACTION_DELETE}" data-id="${_.get(user, ApiFields.ID)}" data-key="${_.get(user, ApiFields.LICENSE_KEY)}" title="${AdminMessages.ACTION_MODAL_DELETE}">${AdminIcons.BTN_DELETE}</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = _.join(htmlRows, AdminConstants.EMPTY_STR);
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const controls = el(DOMIds.PAGINATION_CONTROLS);
    if (_.isNil(controls)) return;
    controls.innerHTML = AdminConstants.EMPTY_STR;
    
    const btnPrev = document.createElement(TagNames.BUTTON);
    btnPrev.className = AdminClasses.PAGE_BTN;
    btnPrev.textContent = AdminConstants.PAGINATION_PREV;
    btnPrev.disabled = currentPage === AdminConstants.MIN_PAGE;
    btnPrev.onclick = () => { currentPage--; renderTable(); };
    controls.appendChild(btnPrev);
    
    for (let i = 1; i <= totalPages; i++) {
        const btnPage = document.createElement(TagNames.BUTTON);
        btnPage.className = `${AdminClasses.PAGE_BTN} ${i === currentPage ? AdminClasses.ACTIVE : AdminConstants.EMPTY_STR}`;
        btnPage.textContent = i;
        btnPage.onclick = () => { currentPage = i; renderTable(); };
        controls.appendChild(btnPage);
    }
    
    const btnNext = document.createElement(TagNames.BUTTON);
    btnNext.className = AdminClasses.PAGE_BTN;
    btnNext.textContent = AdminConstants.PAGINATION_NEXT;
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => { currentPage++; renderTable(); };
    controls.appendChild(btnNext);
}

async function loadPlans() {
    try {
        const res = await fetchAPI(AdminActions.GET_PLANS);
        const plans = _.get(res, ApiFields.PLANS, []);
        window[AdminConstants.GLOBAL_PLANS] = plans;
        renderPlansConfig();
        populatePlanSelects();
    } catch (error) {
        Logger.error(error);
    }
}

function renderPlansConfig() {
    const container = el('plans-container');
    if (!container) return;
    
    container.innerHTML = AdminConstants.EMPTY_STR;
    container.style.minHeight = '150px';
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    
    if (_.isEmpty(plans)) {
        container.innerHTML = AdminTemplates.PLAN_EMPTY(AdminMessages.EMPTY_PLANS);
        return;
    }
    
    _.forEach(plans, plan => {
        const planId = plan.id;
        const planName = plan.name;
        const isUnlimited = plan.is_unlimited;
        
        const badgeClass = (_.includes(_.toUpper(planName), AdminConstants.PLAN_FREE)) ? AdminConstants.PLAN_FREE : AdminConstants.PLAN_PRO;
        
        const colHtml = `
            <div class="quota-col quota-${planId}">
                <div class="quota-col-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="badge ${badgeClass}">${escapeHTML(planName)}</span>
                        <h4>${escapeHTML(planName)}</h4>
                    </div>
                    <button class="btn-danger delete-plan-btn" data-plan-id="${planId}" title="Xóa gói này" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✕</button>
                </div>
                <div class="quota-col-body">
                    <div class="input-group">
                        <label title="Tên gói">Tên Gói</label>
                        <input type="text" class="plan-name-input" data-plan-id="${planId}" value="${escapeHTML(planName)}">
                    </div>
                    <label class="unlimited-toggle">
                        <span title="Dùng Không Giới Hạn (Unlimited)">Không Giới Hạn</span>
                        <div class="toggle-switch">
                            <input type="checkbox" class="plan-unlimited-input" data-plan-id="${planId}" ${isUnlimited ? 'checked' : ''}>
                            <span class="slider"></span>
                        </div>
                    </label>
                    <div class="input-group">
                        <label title="Số lượng Video">Số Video</label>
                        <input type="text" inputmode="numeric" class="numeric-input plan-video-input" data-plan-id="${planId}" value="${plan.quota_video}" ${isUnlimited ? 'disabled' : ''}>
                    </div>
                    <div class="input-group">
                        <label title="Số lượng Ảnh">Số Ảnh</label>
                        <input type="text" inputmode="numeric" class="numeric-input plan-image-input" data-plan-id="${planId}" value="${plan.quota_image}" ${isUnlimited ? 'disabled' : ''}>
                    </div>
                    <div class="input-group">
                        <label title="Số lượng Ký tự">Số Ký tự</label>
                        <input type="text" inputmode="numeric" class="numeric-input plan-voice-input" data-plan-id="${planId}" value="${plan.quota_voice}" ${isUnlimited ? 'disabled' : ''}>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += colHtml;
    });

    const unlimitedCheckboxes = container.querySelectorAll('.plan-unlimited-input');
    _.forEach(unlimitedCheckboxes, chk => {
        chk.addEventListener(EventTypes.CHANGE, (e) => {
            const pId = e.target.getAttribute('data-plan-id');
            const disabled = e.target.checked;
            container.querySelector(`.plan-video-input[data-plan-id="${pId}"]`).disabled = disabled;
            container.querySelector(`.plan-image-input[data-plan-id="${pId}"]`).disabled = disabled;
            container.querySelector(`.plan-voice-input[data-plan-id="${pId}"]`).disabled = disabled;
        });
    });
    
    const deletePlanBtns = container.querySelectorAll('.delete-plan-btn');
    _.forEach(deletePlanBtns, btn => {
        btn.addEventListener(EventTypes.CLICK, async (e) => {
            if (!confirm(AdminMessages.DELETE_PLAN_CONFIRM)) return;
            const pId = e.target.getAttribute('data-plan-id');
            try {
                setButtonLoading(e.target, true, AdminConstants.EMPTY_STR);
                await fetchAPI(AdminActions.DELETE_PLAN, { id: pId });
                showToast(AdminMessages.DELETE_PLAN_SUCCESS, ToastType.SUCCESS);
                loadPlans();
            } catch (err) {
                showToast(AdminMessages.DELETE_PLAN_ERROR + _.get(err, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
            } finally {
                setButtonLoading(e.target, false);
            }
        });
    });
    
    preventNonNumericInput();
}

async function handleAddPlan() {
    const addPlanBtn = el(DOMIds.ADD_PLAN_BTN);
    setButtonLoading(addPlanBtn, true, AdminConstants.EMPTY_STR);
    try {
        await fetchAPI(AdminActions.CREATE_PLAN, {
            name: AdminMessages.NEW_PLAN_NAME,
            quota_video: 0,
            quota_image: 0,
            quota_voice: 0,
            is_unlimited: false
        });
        showToast(AdminMessages.CREATE_PLAN_SUCCESS, ToastType.SUCCESS);
        loadPlans();
    } catch (err) {
        showToast(AdminMessages.CREATE_PLAN_ERROR + _.get(err, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(addPlanBtn, false);
    }
}

async function handleSaveConfig() {
    const saveConfigBtn = el(DOMIds.SAVE_CONFIG_BTN);
    setButtonLoading(saveConfigBtn, true, AdminMessages.SAVE_PROGRESS);
    
    try {
        const container = el('plans-container');
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        
        for (const plan of plans) {
            const pId = plan.id;
            const pName = container.querySelector(`.plan-name-input[data-plan-id="${pId}"]`).value;
            const pVideo = container.querySelector(`.plan-video-input[data-plan-id="${pId}"]`).value;
            const pImage = container.querySelector(`.plan-image-input[data-plan-id="${pId}"]`).value;
            const pVoice = container.querySelector(`.plan-voice-input[data-plan-id="${pId}"]`).value;
            const pUnlimited = container.querySelector(`.plan-unlimited-input[data-plan-id="${pId}"]`).checked;
            
            await fetchAPI(AdminActions.UPDATE_PLAN, {
                [ApiFields.ID]: pId,
                name: pName,
                quota_video: _.toInteger(pVideo) || 0,
                quota_image: _.toInteger(pImage) || 0,
                quota_voice: _.toInteger(pVoice) || 0,
                is_unlimited: pUnlimited
            });
        }
        
        showToast(AdminMessages.SAVE_SUCCESS, ToastType.SUCCESS);
        loadPlans();
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(saveConfigBtn, false);
    }
}

function populatePlanSelects() {
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    
    const filterPlanSelect = el(DOMIds.FILTER_PLAN);
    if (filterPlanSelect) {
        filterPlanSelect.innerHTML = AdminTemplates.SELECT_OPTION(AdminConstants.FILTER_ALL, AdminConstants.PLAN_ALL_LABEL, true);
        _.forEach(plans, p => {
            filterPlanSelect.innerHTML += AdminTemplates.SELECT_OPTION(p.id, p.name);
        });
    }

    const modalPlanSelect = el(DOMIds.MODAL_PLAN_TYPE);
    if (modalPlanSelect) {
        modalPlanSelect.innerHTML = AdminConstants.EMPTY_STR;
        _.forEach(plans, p => {
            modalPlanSelect.innerHTML += AdminTemplates.SELECT_OPTION(p.id, p.name);
        });
    }
}

function resetResourceForms() {
    window.editingKeyId = null;
    el(DOMIds.KEYS_GEMINI_INPUT).value = AdminConstants.EMPTY_STR;
    el(DOMIds.KEYS_AI33_INPUT).value = AdminConstants.EMPTY_STR;
    if (tsKeysInstance) tsKeysInstance.setValue(AdminConstants.ASSIGN_ALL);
    else el(DOMIds.KEYS_ASSIGNEE_INPUT).value = AdminConstants.ASSIGN_ALL;
    el(DOMIds.SAVE_KEYS_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_SAVE, AdminMessages.MODAL_SAVE_DEFAULT);

    window.editingAccountId = null;
    el(DOMIds.ACC_EMAIL_INPUT).value = AdminConstants.EMPTY_STR;
    el(DOMIds.ACC_PASSWORD_INPUT).value = AdminConstants.EMPTY_STR;
    el(DOMIds.ACC_RECOVERY_INPUT).value = AdminConstants.EMPTY_STR;
    if (tsAccInstance) tsAccInstance.setValue(AdminConstants.ASSIGN_ALL);
    else el(DOMIds.ACC_ASSIGNEE_INPUT).value = AdminConstants.ASSIGN_ALL;
    el(DOMIds.ADD_ACC_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_ADD, AdminMessages.BTN_ADD);
}

function closeModal(id) {
    el(id)?.classList.remove(AdminClasses.ACTIVE);
    if (id === DOMIds.RESOURCE_MODAL) {
        resetResourceForms();
    }
}

function handleOpenCreateModal() {
    editingUserId = null;
    el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_CREATE_TITLE;
    el(DOMIds.MODAL_USERNAME).value = AdminConstants.EMPTY_STR;
    el(DOMIds.MODAL_USERNAME).disabled = false;
    
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    if (plans.length > 0) el(DOMIds.MODAL_PLAN_TYPE).value = plans[0].id;
    
    el(DOMIds.MODAL_STATUS).value = AdminConstants.STATUS_ACTIVE;
    el(DOMIds.MODAL_STATUS).disabled = true;
    el(DOMIds.MODAL_QUOTA_TYPE).value = QuotaType.DAILY;
    el(DOMIds.MODAL_EXPIRES).value = AdminConstants.EMPTY_STR;
    
    el(DOMIds.MODAL_EXPIRES_WRAPPER).style.display = AdminClasses.DISPLAY_FLEX;
    el(DOMIds.USER_MODAL).classList.add(AdminClasses.ACTIVE);
}

function openEditModal(id) {
    const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), u => _.get(u, ApiFields.ID) === id);
    if (!user) return;
    
    editingUserId = id;
    el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_EDIT_TITLE;
    el(DOMIds.MODAL_USERNAME).value = _.get(user, ApiFields.USERNAME);
    el(DOMIds.MODAL_USERNAME).disabled = true;
    
    const planSelect = el(DOMIds.MODAL_PLAN_TYPE);
    planSelect.value = _.get(user, ApiFields.PLAN_ID);
    
    el(DOMIds.MODAL_STATUS).value = _.get(user, ApiFields.STATUS);
    el(DOMIds.MODAL_STATUS).disabled = false;
    el(DOMIds.MODAL_QUOTA_TYPE).value = _.get(user, ApiFields.QUOTA_TYPE, QuotaType.DAILY);
    
    if (!_.isEmpty(_.get(user, ApiFields.EXPIRES_AT))) {
        el(DOMIds.MODAL_EXPIRES).value = new Date(_.get(user, ApiFields.EXPIRES_AT)).toISOString().split(AdminConstants.DATE_T_SPLIT)[AdminConstants.DATE_ISO_INDEX];
    } else {
        el(DOMIds.MODAL_EXPIRES).value = AdminConstants.EMPTY_STR;
    }
    
    const wrapper = el(DOMIds.MODAL_EXPIRES_WRAPPER);
    
    const planId = _.get(user, ApiFields.PLAN_ID);
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, p => p.id === planId);
    
    if (plan && plan.is_unlimited) {
        wrapper.style.display = AdminClasses.DISPLAY_NONE;
    } else {
        wrapper.style.display = AdminClasses.DISPLAY_FLEX;
    }
    
    el(DOMIds.USER_MODAL).classList.add(AdminClasses.ACTIVE);
}

function handlePlanTypeChange(e) {
    const wrapper = el(DOMIds.MODAL_EXPIRES_WRAPPER);
    const selectedPlanId = _.get(e, AdminConstants.TARGET_VALUE_PATH) || el(DOMIds.MODAL_PLAN_TYPE).value;
    
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, p => p.id === selectedPlanId);
    
    if (plan && plan.is_unlimited && _.isNil(editingUserId)) {
        wrapper.style.display = AdminClasses.DISPLAY_NONE;
    } else {
        wrapper.style.display = AdminClasses.DISPLAY_FLEX;
    }
}

async function handleSaveUser() {
    const btn = el(DOMIds.SAVE_USER_BTN);
    const username = el(DOMIds.MODAL_USERNAME).value.trim();
    const planType = el(DOMIds.MODAL_PLAN_TYPE).value;
    const status = el(DOMIds.MODAL_STATUS).value;
    const quotaType = el(DOMIds.MODAL_QUOTA_TYPE).value;
    let expiresAt = el(DOMIds.MODAL_EXPIRES).value;
    
    if (_.isNil(editingUserId) && _.isEmpty(username)) {
        showToast(AdminMessages.MODAL_MISSING_NAME, ToastType.ERROR);
        return;
    }
    
    if (!_.isEmpty(expiresAt)) {
        expiresAt = new Date(expiresAt).toISOString();
    }
    
    setButtonLoading(btn, true, AdminMessages.SAVE_USER_PROGRESS);
    
    try {
        if (!_.isNil(editingUserId)) {
            await fetchAPI(AdminActions.UPDATE_KEY, { [ApiFields.ID]: editingUserId, [ApiFields.PLAN_ID]: planType, [ApiFields.STATUS]: status, [ApiFields.QUOTA_TYPE]: quotaType, [ApiFields.EXPIRES_AT]: expiresAt });
            showToast(AdminMessages.MODAL_UPDATE_SUCCESS, ToastType.SUCCESS);
        } else {
            const res = await fetchAPI(AdminActions.CREATE_KEY, { [ApiFields.USERNAME]: username, [ApiFields.PLAN_ID]: planType, [ApiFields.QUOTA_TYPE]: quotaType });
            showToast(AdminMessages.MODAL_CREATE_SUCCESS + _.get(res, ApiFields.LICENSE_KEY), ToastType.SUCCESS);
        }
        
        setTimeout(() => {
            closeModal(DOMIds.USER_MODAL);
            loadUsers();
        }, AdminConstants.MODAL_FADE_DELAY);
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
        btn.textContent = AdminMessages.MODAL_SAVE_DEFAULT;
    }
}

function openDeleteModal(id, keyStr) {
    deletingUserId = id;
    deletingUserKey = keyStr;
    el(DOMIds.DELETE_KEY_DISPLAY).textContent = keyStr;
    el(DOMIds.DELETE_MODAL).classList.add(AdminClasses.ACTIVE);
}

async function handleSoftDelete() {
    const btn = el(DOMIds.BTN_SOFT_DELETE);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_SOFT_DELETE);
    try {
        await fetchAPI(AdminActions.REVOKE_KEY, { [ApiFields.ID]: deletingUserId });
        showToast(AdminMessages.DELETE_SOFT_SUCCESS, ToastType.SUCCESS);
        closeModal(DOMIds.DELETE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleHardDelete() {
    const btn = el(DOMIds.BTN_HARD_DELETE);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_HARD_DELETE);
    try {
        await fetchAPI(AdminActions.DELETE_KEY, { [ApiFields.ID]: deletingUserId });
        showToast(AdminMessages.DELETE_HARD_SUCCESS, ToastType.SUCCESS);
        closeModal(DOMIds.DELETE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleResetDevice() {
    if (!resettingUserId) return;
    
    const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), u => _.get(u, ApiFields.ID) === resettingUserId);
    const keyStr = user ? _.get(user, ApiFields.LICENSE_KEY) : AdminConstants.UNKNOWN_STR;
    
    const confirmMsg = AdminMessages.RESET_DEVICE_CONFIRM.replace('{0}', keyStr);
    if (!confirm(confirmMsg)) return;

    const btn = el(DOMIds.MODAL_RESET_DEVICE_BTN);
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_RESET_DEVICE);

    try {
        await fetchAPI(AdminActions.RESET_DEVICE, { [ApiFields.ID]: resettingUserId });
        showToast(AdminMessages.RESET_DEVICE_SUCCESS, ToastType.SUCCESS);
        
        closeModal(DOMIds.DEVICE_MODAL);
        loadUsers();
    } catch (error) {
        showToast(AdminMessages.RESET_DEVICE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(AdminMessages.COPY_SUCCESS + text, ToastType.SUCCESS);
    }).catch(err => {
        Logger.error(AdminMessages.LOG_COPY_FAILED, err);
        showToast(AdminMessages.COPY_ERROR, ToastType.ERROR);
    });
}

function openDeviceModal(id) {
    const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), u => _.get(u, ApiFields.ID) === id);
    if (!user) return;
    
    const container = el(DOMIds.DEVICE_LIST_CONTAINER);
    let deviceIdStr = AdminTemplates.DEVICE_EMPTY(AdminMessages.EMPTY_DEVICE_MSG);

    try {
        const parsedDevices = JSON.parse(_.get(user, ApiFields.DEVICE_ID, AdminMessages.ARRAY_EMPTY_JSON));
        if (_.isArray(parsedDevices) && !_.isEmpty(parsedDevices)) {
            deviceIdStr = _.map(parsedDevices, d => AdminTemplates.DEVICE_CARD(d, AdminMessages.DEVICE_CONNECTED)).join(AdminConstants.EMPTY_STR);
        } else if (_.isString(parsedDevices) && !_.isEmpty(parsedDevices)) {
            deviceIdStr = AdminTemplates.DEVICE_CARD(parsedDevices, AdminMessages.DEVICE_CONNECTED);
        }
    } catch (e) {
        if (!_.isEmpty(_.get(user, ApiFields.DEVICE_ID))) {
            deviceIdStr = AdminTemplates.DEVICE_CARD(_.get(user, ApiFields.DEVICE_ID), AdminMessages.DEVICE_CONNECTED);
        }
    }
    
    container.innerHTML = deviceIdStr;
    
    const resetBtn = el(DOMIds.MODAL_RESET_DEVICE_BTN);
    if (!_.isEmpty(_.get(user, ApiFields.DEVICE_ID))) {
        resetBtn.style.display = AdminClasses.DISPLAY_FLEX;
        resettingUserId = id;
    } else {
        resetBtn.style.display = AdminClasses.DISPLAY_NONE;
    }
    
    el(DOMIds.DEVICE_MODAL).classList.add(AdminClasses.ACTIVE);
}

async function handleSyncExpired() {
    const btn = el(DOMIds.SYNC_BTN);
    if (!btn) return;
    
    setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_SYNC);
    
    try {
        const result = await fetchAPI(AdminActions.SYNC_EXPIRED);
        const count = _.get(result, ApiFields.COUNT, 0);
        showToast(AdminMessages.SYNC_SUCCESS.replace('{0}', count), ToastType.SUCCESS);
        if (count > 0) {
            loadUsers();
        }
    } catch (error) {
        showToast(AdminMessages.SAVE_ERROR + _.get(error, ApiFields.MESSAGE, AdminConstants.EMPTY_STR), ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

function preventNonNumericInput() {
    const numericInputs = document.querySelectorAll(AdminSelectors.NUMERIC_INPUT);
    _.forEach(numericInputs, input => {
        input.addEventListener(EventTypes.INPUT, function() {
            this.value = this.value.replace(AdminRegex.NUMBERS_ONLY, AdminConstants.EMPTY_STR);
        });
    });
}

function delegateModalCloses() {
    const closeBtns = document.querySelectorAll(AdminSelectors.MODAL_CLOSE_BTN);
    _.forEach(closeBtns, btn => {
        btn.addEventListener(EventTypes.CLICK, function() {
            const modalId = this.getAttribute(DataAttributes.MODAL);
            if (modalId) closeModal(modalId);
        });
    });
}

function delegateTableActions() {
    document.addEventListener(EventTypes.CLICK, function(e) {
        const target = e.target.closest(AdminSelectors.ACTION_BTNS);
        if (!target) return;
            const action = target.getAttribute(DataAttributes.ACTION);
        const key = target.getAttribute(DataAttributes.KEY);
        const accountId = target.getAttribute(DataAttributes.ACCOUNT_ID);
        const uid = target.getAttribute(DataAttributes.ID);
        
        if (action === AdminConstants.ACTION_EDIT && uid) openEditModal(uid);
        if (action === AdminConstants.ACTION_DEVICE && uid) openDeviceModal(uid);
        if (action === AdminConstants.ACTION_DELETE && uid) openDeleteModal(uid, key);
        if (action === AdminConstants.ACTION_COPY && key) copyToClipboard(key);
        if (action === AdminConstants.ACTION_EDIT_ACC && accountId) editAccountAdmin(accountId);
        if (action === AdminConstants.ACTION_DELETE_ACC && accountId) deleteAccountAdmin(accountId);
        
        const keyId = target.getAttribute(DataAttributes.ID);
        if (action === AdminConstants.ACTION_DELETE_KEYS && keyId) deleteApiKeysAdmin(keyId);
        if (action === AdminConstants.ACTION_EDIT_KEYS && keyId) editApiKeysAdmin(keyId);
    });
}

function initEventListeners() {
    preventNonNumericInput();
    delegateModalCloses();
    delegateTableActions();
    
    el(DOMIds.LOGIN_BTN)?.addEventListener(EventTypes.CLICK, handleLogin);
    el(DOMIds.LOGOUT_BTN)?.addEventListener(EventTypes.CLICK, handleLogout);
    el(DOMIds.SYNC_BTN)?.addEventListener(EventTypes.CLICK, handleSyncExpired);
    
    el(DOMIds.BTN_CONFIRM_ACTION)?.addEventListener(EventTypes.CLICK, () => {
        if (_.isFunction(window.currentConfirmCallback)) window.currentConfirmCallback();
        closeModal(DOMIds.CONFIRM_MODAL);
    });

    el(DOMIds.ADD_PLAN_BTN)?.addEventListener(EventTypes.CLICK, handleAddPlan);
    el(DOMIds.SAVE_CONFIG_BTN)?.addEventListener(EventTypes.CLICK, handleSaveConfig);
    
    el(DOMIds.SEARCH_INPUT)?.addEventListener(EventTypes.INPUT, applyFilters);
    el(DOMIds.FILTER_PLAN)?.addEventListener(EventTypes.CHANGE, applyFilters);
    el(DOMIds.FILTER_STATUS)?.addEventListener(EventTypes.CHANGE, applyFilters);
    el(DOMIds.PAGE_SIZE)?.addEventListener(EventTypes.CHANGE, (e) => {
        pageSize = _.toInteger(_.get(e, AdminConstants.TARGET_VALUE_PATH, AdminConstants.DEFAULT_PAGE_SIZE));
        currentPage = AdminConstants.DEFAULT_PAGE;
        renderTable();
    });

    el(DOMIds.OPEN_CREATE_MODAL_BTN)?.addEventListener(EventTypes.CLICK, handleOpenCreateModal);
    el(DOMIds.MODAL_PLAN_TYPE)?.addEventListener(EventTypes.CHANGE, handlePlanTypeChange);
    el(DOMIds.SAVE_USER_BTN)?.addEventListener(EventTypes.CLICK, handleSaveUser);
    el(DOMIds.BTN_SOFT_DELETE)?.addEventListener(EventTypes.CLICK, handleSoftDelete);
    el(DOMIds.BTN_HARD_DELETE)?.addEventListener(EventTypes.CLICK, handleHardDelete);
    el(DOMIds.MODAL_RESET_DEVICE_BTN)?.addEventListener(EventTypes.CLICK, handleResetDevice);

    const configToggleBtn = el(DOMIds.CONFIG_TOGGLE_BTN);
    const configDropdownMenu = el(DOMIds.CONFIG_DROPDOWN_MENU);

    if (configToggleBtn && configDropdownMenu) {
        configToggleBtn.addEventListener(EventTypes.CLICK, (e) => {
            e.stopPropagation();
            configDropdownMenu.style.display = configDropdownMenu.style.display === AdminClasses.DISPLAY_NONE ? AdminClasses.DISPLAY_BLOCK : AdminClasses.DISPLAY_NONE;
        });

        document.addEventListener(EventTypes.CLICK, (e) => {
            if (!configToggleBtn.contains(e.target) && !configDropdownMenu.contains(e.target)) {
                configDropdownMenu.style.display = AdminClasses.DISPLAY_NONE;
            }
        });

        configDropdownMenu.addEventListener(EventTypes.CLICK, (e) => {
            e.stopPropagation();
        });
        
        el(DOMIds.SAVE_CONFIG_BTN)?.addEventListener(EventTypes.CLICK, () => {
            configDropdownMenu.style.display = AdminClasses.DISPLAY_NONE;
        });
    }

    const resourceToggleBtn = el(DOMIds.RESOURCE_TOGGLE_BTN);
    const resourceModal = el(DOMIds.RESOURCE_MODAL);
    
    if (resourceToggleBtn) {
        resourceToggleBtn.addEventListener(EventTypes.CLICK, () => {
            resourceModal.classList.add(AdminClasses.ACTIVE);
            loadApiKeysAdmin();
        });
    }

    const tabKeysBtn = el(DOMIds.TAB_KEYS_BTN);
    const tabAccountsBtn = el(DOMIds.TAB_ACCOUNTS_BTN);
    const tabContentKeys = el(DOMIds.TAB_CONTENT_KEYS);
    const tabContentAccounts = el(DOMIds.TAB_CONTENT_ACCOUNTS);

    if (tabKeysBtn && tabAccountsBtn) {
        tabKeysBtn.addEventListener(EventTypes.CLICK, () => {
            tabKeysBtn.classList.add(AdminClasses.ACTIVE);
            tabAccountsBtn.classList.remove(AdminClasses.ACTIVE);
            
            tabContentKeys.style.display = AdminClasses.DISPLAY_BLOCK;
            tabContentAccounts.style.display = AdminClasses.DISPLAY_NONE;
            loadApiKeysAdmin();
        });

        tabAccountsBtn.addEventListener(EventTypes.CLICK, () => {
            tabAccountsBtn.classList.add(AdminClasses.ACTIVE);
            tabKeysBtn.classList.remove(AdminClasses.ACTIVE);
            
            tabContentAccounts.style.display = AdminClasses.DISPLAY_BLOCK;
            tabContentKeys.style.display = AdminClasses.DISPLAY_NONE;
            loadAccountsAdmin();
        });
    }

    el(DOMIds.SAVE_KEYS_BTN)?.addEventListener(EventTypes.CLICK, handleSaveKeys);
    el(DOMIds.ADD_ACC_BTN)?.addEventListener(EventTypes.CLICK, handleSaveAccount);
    
    document.addEventListener(EventTypes.CHANGE, function(e) {
        if (e.target.classList.contains(AdminSelectors.ACC_STATUS_SELECT.substring(1))) {
            const accId = e.target.getAttribute(DataAttributes.ACCOUNT_ID);
            const status = e.target.value;
            if (accId) updateAccStatus(Number(accId), status);
        }
    });
}

async function handleSaveKeys() {
    const btn = el(DOMIds.SAVE_KEYS_BTN);
    const assignee = el(DOMIds.KEYS_ASSIGNEE_INPUT).value.trim() || AdminConstants.ASSIGN_ALL;
    const gemini = el(DOMIds.KEYS_GEMINI_INPUT).value.trim();
    const ai33 = el(DOMIds.KEYS_AI33_INPUT).value.trim();
    
    if (!gemini && !ai33) {
        showToast(AdminMessages.VALIDATION_NEED_KEY, ToastType.ERROR);
        return;
    }

    setButtonLoading(btn, true, AdminMessages.LOADING_SAVE);
    try {
        const payload = {
            [ApiFields.GEMINI_KEY]: gemini,
            [ApiFields.AI33_KEY]: ai33,
            [ApiFields.ASSIGNED_TO]: assignee
        };
        if (window.editingKeyId) {
            payload[ApiFields.ID] = window.editingKeyId;
        }
        await fetchAPI(AdminActions.UPDATE_API_KEYS, payload);
        showToast(AdminMessages.KEYS_SAVE_SUCCESS, ToastType.SUCCESS);
        resetResourceForms();
        loadApiKeysAdmin();
    } catch (e) {
        showToast(AdminMessages.SAVE_ERROR + e.message, ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleSaveAccount() {
    const btn = el(DOMIds.ADD_ACC_BTN);
    const email = el(DOMIds.ACC_EMAIL_INPUT).value.trim();
    const pwd = el(DOMIds.ACC_PASSWORD_INPUT).value.trim();
    const recovery = el(DOMIds.ACC_RECOVERY_INPUT).value.trim();
    const assign = el(DOMIds.ACC_ASSIGNEE_INPUT).value.trim() || AdminConstants.ASSIGN_ALL;

    if (!email) {
        showToast(AdminMessages.MISSING_ACC_INFO, ToastType.ERROR);
        return;
    }

    const isEditing = !_.isNil(window.editingAccountId);
    setButtonLoading(btn, true, isEditing ? AdminMessages.LOADING_UPDATE : AdminMessages.LOADING_ADD);
    try {
        if (isEditing) {
            await fetchAPI(AdminActions.UPDATE_ACCOUNT, { [ApiFields.ACCOUNT]: { [ApiFields.ID]: window.editingAccountId, [ApiFields.EMAIL]: email, [ApiFields.PASSWORD]: pwd, [ApiFields.RECOVERY_EMAIL]: recovery, [ApiFields.ASSIGNED_TO]: assign } });
            showToast(AdminMessages.ACCOUNT_UPDATE_SUCCESS, ToastType.SUCCESS);
            window.editingAccountId = null;
            btn.innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_ADD, AdminMessages.BTN_ADD);
        } else {
            await fetchAPI(AdminActions.ADD_ACCOUNT, { [ApiFields.ACCOUNT]: { [ApiFields.EMAIL]: email, [ApiFields.PASSWORD]: pwd, [ApiFields.RECOVERY_EMAIL]: recovery, [ApiFields.STATUS]: AdminConstants.ACCOUNT_STATUS_ACTIVE, [ApiFields.ASSIGNED_TO]: assign } });
            showToast(AdminMessages.ACCS_SAVE_SUCCESS, ToastType.SUCCESS);
        }
        
        el(DOMIds.ACC_EMAIL_INPUT).value = AdminConstants.EMPTY_STR;
        el(DOMIds.ACC_PASSWORD_INPUT).value = AdminConstants.EMPTY_STR;
        el(DOMIds.ACC_RECOVERY_INPUT).value = AdminConstants.EMPTY_STR;
        if (tsAccInstance) {
            tsAccInstance.setValue(AdminConstants.ASSIGN_ALL);
        } else {
            el(DOMIds.ACC_ASSIGNEE_INPUT).value = AdminConstants.ASSIGN_ALL;
        }
        
        loadAccountsAdmin();
    } catch (e) {
        showToast(AdminMessages.SAVE_ERROR + e.message, ToastType.ERROR);
    } finally {
        setButtonLoading(btn, false);
    }
}

let tsKeysInstance = null;
let tsAccInstance = null;

function populateAssignSelects() {
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    
    let optionsHtml = AdminTemplates.SELECT_OPTION(AdminConstants.ASSIGN_ALL, AdminMessages.ASSIGN_ALL_LABEL);
    _.forEach(plans, p => {
        optionsHtml += AdminTemplates.SELECT_OPTION(p.id, p.name);
    });
    
    const users = _.get(window, AdminConstants.GLOBAL_USERS, []);
    if (users.length > 0) {
        let userOptions = AdminConstants.EMPTY_STR;
        _.forEach(users, u => {
            const keyStr = _.get(u, ApiFields.LICENSE_KEY);
            const uname = _.get(u, ApiFields.USERNAME);
            userOptions += AdminTemplates.SELECT_OPTION(keyStr, `${uname} (${keyStr})`);
        });
        optionsHtml += AdminTemplates.OPTGROUP(AdminMessages.ASSIGN_SPECIFIC_LABEL, userOptions);
    }
    
    const keysSelect = el(DOMIds.KEYS_ASSIGNEE_INPUT);
    const accSelect = el(DOMIds.ACC_ASSIGNEE_INPUT);
    
    if (tsKeysInstance) tsKeysInstance.destroy();
    if (tsAccInstance) tsAccInstance.destroy();
    
    if (keysSelect) {
        keysSelect.innerHTML = optionsHtml;
        tsKeysInstance = new TomSelect(keysSelect, {
            create: true,
            maxItems: AdminConstants.MAX_ITEMS_SELECT,
            placeholder: AdminMessages.SEARCH_PLACEHOLDER,
            dropdownParent: 'body',
            plugins: [AdminConstants.PLUGIN_DROPDOWN]
        });
    }
    if (accSelect) {
        accSelect.innerHTML = optionsHtml;
        tsAccInstance = new TomSelect(accSelect, {
            create: true,
            maxItems: AdminConstants.MAX_ITEMS_SELECT,
            placeholder: AdminMessages.SEARCH_PLACEHOLDER,
            dropdownParent: 'body',
            plugins: [AdminConstants.PLUGIN_DROPDOWN]
        });
    }
}

function editApiKeysAdmin(keyId) {
    const keys = _.get(window, 'adminApiKeysData', []);
    const keyRecord = _.find(keys, k => _.get(k, ApiFields.ID) === keyId);
    if (!keyRecord) return;
    
    const assignedTo = _.get(keyRecord, ApiFields.ASSIGNED_TO);
    if (tsKeysInstance) {
        tsKeysInstance.setValue(assignedTo);
    } else {
        el(DOMIds.KEYS_ASSIGNEE_INPUT).value = assignedTo;
    }
    
    el(DOMIds.KEYS_GEMINI_INPUT).value = _.get(keyRecord, ApiFields.GEMINI_KEY) || AdminConstants.EMPTY_STR;
    el(DOMIds.KEYS_AI33_INPUT).value = _.get(keyRecord, ApiFields.AI33_KEY) || AdminConstants.EMPTY_STR;
    
    window.editingKeyId = keyId;
    el(DOMIds.SAVE_KEYS_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_EDIT, AdminMessages.BTN_UPDATE);
    el(DOMIds.KEYS_GEMINI_INPUT).focus();
}

function openConfirmModal(message, callback) {
    el(DOMIds.CONFIRM_MESSAGE_DISPLAY).innerHTML = message;
    window.currentConfirmCallback = callback;
    el(DOMIds.CONFIRM_MODAL).classList.add(AdminClasses.ACTIVE);
}

function deleteApiKeysAdmin(keyId) {
    const keys = _.get(window, 'adminApiKeysData', []);
    const keyRecord = _.find(keys, k => _.get(k, ApiFields.ID) === keyId);
    const assignedTo = keyRecord ? _.get(keyRecord, ApiFields.ASSIGNED_TO) : 'ALL';
    
    openConfirmModal(AdminMessages.DELETE_KEYS_CONFIRM.replace('{0}', assignedTo), async () => {
        try {
            await fetchAPI(AdminActions.DELETE_API_KEYS, { [ApiFields.ID]: keyId });
            showToast(AdminMessages.DELETE_KEYS_SUCCESS, ToastType.SUCCESS);
            loadApiKeysAdmin();
        } catch (e) {
            showToast(AdminMessages.DELETE_KEYS_ERROR + e.message, ToastType.ERROR);
        }
    });
}

function editAccountAdmin(id) {
    const accs = _.get(window, 'adminAccountsData', []);
    const acc = _.find(accs, a => _.get(a, ApiFields.ID) === id);
    if (!acc) return;
    
    el(DOMIds.ACC_EMAIL_INPUT).value = _.get(acc, ApiFields.EMAIL);
    el(DOMIds.ACC_PASSWORD_INPUT).value = _.get(acc, ApiFields.PASSWORD);
    el(DOMIds.ACC_RECOVERY_INPUT).value = _.get(acc, ApiFields.RECOVERY_EMAIL);
    if (tsAccInstance) {
        tsAccInstance.setValue(_.get(acc, ApiFields.ASSIGNED_TO));
    } else {
        el(DOMIds.ACC_ASSIGNEE_INPUT).value = _.get(acc, ApiFields.ASSIGNED_TO);
    }
    
    window.editingAccountId = id;
    el(DOMIds.ADD_ACC_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_EDIT, AdminMessages.BTN_UPDATE);
}

function deleteAccountAdmin(id) {
    openConfirmModal(AdminMessages.DELETE_ACCOUNT_CONFIRM, async () => {
        try {
            await fetchAPI(AdminActions.DELETE_ACCOUNT, { [ApiFields.ID]: id });
            showToast(AdminMessages.DELETE_ACCOUNT_SUCCESS, ToastType.SUCCESS);
            loadAccountsAdmin();
        } catch (e) {
            showToast(AdminMessages.DELETE_ACCOUNT_ERROR + e.message, ToastType.ERROR);
        }
    });
}

async function loadApiKeysAdmin() {
    const tbody = elq(DOMIds.KEYS_TBODY);
    tbody.innerHTML = AdminTemplates.TABLE_LOADING(AdminConstants.COLSPAN_KEYS, AdminMessages.DATA_LOADING);
    
    const getAssignBadge = (assignee) => {
        if (assignee === AdminConstants.ASSIGN_ALL) return AdminClasses.BADGE_FREE;
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        const plan = _.find(plans, p => p.id === assignee);
        if (plan) {
            return (_.includes(_.toUpper(plan.name), AdminConstants.PLAN_FREE)) ? AdminClasses.BADGE_FREE : AdminClasses.BADGE_PRO;
        }
        return AdminClasses.BADGE_PRO; 
    };
    
    const getAssignName = (assignee) => {
        if (assignee === AdminConstants.ASSIGN_ALL) return AdminMessages.ASSIGN_ALL_LABEL;
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        const plan = _.find(plans, p => p.id === assignee);
        if (plan) return plan.name;
        return assignee;
    };

    try {
        const res = await fetchAPI(AdminActions.GET_API_KEYS);
        const keys = _.get(res, ApiFields.KEYS, []);
        window.adminApiKeysData = keys;
        
        tbody.innerHTML = _.map(keys, k => {
            const assignee = _.get(k, ApiFields.ASSIGNED_TO, AdminConstants.ASSIGN_ALL);
            const badgeClass = getAssignBadge(assignee);
            const assigneeLabel = getAssignName(assignee);
            const geminiValue = _.get(k, ApiFields.GEMINI_KEY);
            const ai33Value = _.get(k, ApiFields.AI33_KEY);
            const keyId = _.get(k, ApiFields.ID);
            
            const formatValue = (v) => v ? AdminMessages.PASSWORD_MASK + v.slice(-4) : AdminTemplates.DANGER_TEXT(AdminMessages.NO_DATA);
            
            return `
            <tr>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);" class="text-center"><span class="badge ${badgeClass}">${escapeHTML(assigneeLabel)}</span></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #9ca3af; font-family: monospace;">${formatValue(geminiValue)}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #9ca3af; font-family: monospace;">${formatValue(ai33Value)}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="action-btn action-info" data-action="${AdminConstants.ACTION_EDIT_KEYS}" data-id="${escapeHTML(keyId)}" title="${AdminMessages.ACTION_MODAL_EDIT}">${AdminIcons.BTN_EDIT}</button>
                        <button class="action-btn action-danger" data-action="${AdminConstants.ACTION_DELETE_KEYS}" data-id="${escapeHTML(keyId)}" title="${AdminMessages.ACTION_MODAL_DELETE}">${AdminIcons.BTN_DELETE}</button>
                    </div>
                </td>
            </tr>
        `}).join(AdminConstants.EMPTY_STR);
    } catch (e) {
        tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_KEYS, e.message);
    }
}

async function loadAccountsAdmin() {
    const tbody = elq(DOMIds.ACCS_TBODY);
    tbody.innerHTML = AdminTemplates.TABLE_LOADING(AdminConstants.COLSPAN_ACCOUNTS, AdminMessages.DATA_LOADING);
    
    const getAssignBadge = (assignee) => {
        if (assignee === AdminConstants.ASSIGN_ALL) return AdminClasses.BADGE_FREE;
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        const plan = _.find(plans, p => p.id === assignee);
        if (plan) {
            return (_.includes(_.toUpper(plan.name), AdminConstants.PLAN_FREE)) ? AdminClasses.BADGE_FREE : AdminClasses.BADGE_PRO;
        }
        return AdminClasses.BADGE_PRO;
    };
    
    const getAssignName = (assignee) => {
        if (assignee === AdminConstants.ASSIGN_ALL) return AdminMessages.ASSIGN_ALL_LABEL;
        const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
        const plan = _.find(plans, p => p.id === assignee);
        if (plan) return plan.name;
        return assignee;
    };

    try {
        const res = await fetchAPI(AdminActions.GET_ACCOUNTS);
        const accs = _.get(res, ApiFields.ACCOUNTS, []);
        window.adminAccountsData = accs;
        
        tbody.innerHTML = _.map(accs, a => {
            const assignee = _.get(a, ApiFields.ASSIGNED_TO, AdminConstants.ASSIGN_ALL);
            const badgeClass = getAssignBadge(assignee);
            const assigneeLabel = getAssignName(assignee);
            
            const options = `
                <option value="${AdminConstants.ACCOUNT_STATUS_ACTIVE}" ${_.get(a, ApiFields.STATUS) === AdminConstants.ACCOUNT_STATUS_ACTIVE ? AdminConstants.SELECTED : AdminConstants.EMPTY_STR}>${AdminConstants.ACCOUNT_STATUS_ACTIVE}</option>
                <option value="${AdminConstants.ACCOUNT_STATUS_ERROR}" ${_.get(a, ApiFields.STATUS) === AdminConstants.ACCOUNT_STATUS_ERROR ? AdminConstants.SELECTED : AdminConstants.EMPTY_STR}>${AdminConstants.ACCOUNT_STATUS_ERROR}</option>
            `;
            return `
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">${escapeHTML(_.get(a, ApiFields.EMAIL))}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #9ca3af;">${escapeHTML(_.get(a, ApiFields.RECOVERY_EMAIL) || AdminMessages.NO_DATA)}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);" class="text-center">
                    <select class="acc-status-select" data-account-id="${_.get(a, ApiFields.ID)}" style="background: var(--input-bg); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 0.2rem; outline:none; transition: 0.2s; cursor: pointer;">
                        ${options}
                    </select>
                </td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);" class="text-center"><span class="badge ${badgeClass}">${escapeHTML(_.get(a, ApiFields.ASSIGNED_TO))}</span></td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #9ca3af; font-family: monospace;">${_.get(a, ApiFields.PASSWORD) ? AdminMessages.PASSWORD_MASK : AdminConstants.EMPTY_STR}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div class="actions-cell" style="justify-content: center;">
                        <button class="action-btn action-info" data-action="${AdminConstants.ACTION_EDIT_ACC}" data-account-id="${_.get(a, ApiFields.ID)}" title="${AdminMessages.ACTION_MODAL_EDIT}">${AdminIcons.BTN_EDIT}</button>
                        <button class="action-btn action-danger" data-action="${AdminConstants.ACTION_DELETE_ACC}" data-account-id="${_.get(a, ApiFields.ID)}" title="${AdminMessages.ACTION_MODAL_DELETE}">${AdminIcons.BTN_DELETE}</button>
                    </div>
                </td>
            </tr>
        `}).join(AdminConstants.EMPTY_STR);
    } catch (e) {
        tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_ACCOUNTS, e.message);
    }
}

async function updateAccStatus(id, status) {
    try {
        await fetchAPI(AdminActions.UPDATE_ACCOUNT_STATUS, { [ApiFields.ROW_INDEX]: id, [ApiFields.STATUS]: status });
        showToast(AdminMessages.UPDATE_STATUS_SUCCESS, ToastType.SUCCESS);
    } catch (e) {
        showToast(AdminMessages.UPDATE_STATUS_ERROR + e.message, ToastType.ERROR);
    }
}

function init() {
    initEventListeners();
    if (_.every([adminToken, apiUrl], val => !_.isEmpty(val))) {
        showDashboard();
    }
}

init();
