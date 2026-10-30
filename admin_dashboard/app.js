const el = (id) => document.getElementById(id);
const elq = (selector) => document.querySelector(selector);
let adminToken = AdminStorage.get(AdminConstants.TOKEN_KEY) || AdminConstants.EMPTY_STR;
let apiUrl = API_BASE_URL;
let currentPage = AdminConstants.DEFAULT_PAGE;
let pageSize = AdminConstants.DEFAULT_PAGE_SIZE;
let filteredUsers = [];
let editingUserId = null;
let deletingUserId = null;
let deletingUserKey = null;
let resettingUserId = null;
window.editingAccountId = null;
let deletingResourceId = null;
let deletingResourceType = null;
let tsKeysInstance = null;
let tsAccInstance = null;
let tsExcludedInstance = null;
let tsKeysModalInstance = null;
let tsExcludedModalInstance = null;
let tsAccModalInstance = null;
function escapeHTML(str) {
  if (_.isNil(str)) return AdminConstants.EMPTY_STR;
  return _.replace(_.toString(str), AdminRegex.ESCAPE_HTML, (tag) => _.get(AdminConstants.HTML_ENTITIES, tag, tag));
}
function formatPlanDisplayName(nameOrId) {
  if (_.isNil(nameOrId) || _.isEqual(nameOrId, AdminConstants.UNKNOWN_STR)) {
    return AdminConstants.PLAN_UNASSIGNED;
  }
  const str = _.trim(_.toString(nameOrId));
  const upper = _.toUpper(str);
  if (_.includes([AdminConstants.PLAN_FREE], upper)) return AdminConstants.PLAN_NAME_FREE;
  if (_.includes([AdminConstants.PLAN_PRO], upper)) return AdminConstants.PLAN_NAME_PRO;
  if (_.some([AdminConstants.PLAN_PRO_LIFETIME, AdminConstants.PLAN_LIFETIME], (val) => _.isEqual(val, upper))) return AdminConstants.PLAN_NAME_LIFETIME;
  if (_.isEqual(upper, AdminMessages.NEW_PLAN_NAME)) return AdminConstants.PLAN_NAME_NEW;
  return str;
}
function normalizeStatus(status) {
  return _.toUpper(_.trim(_.toString(status || AdminConstants.EMPTY_STR)));
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
  toast.className = `${AdminClasses.TOAST}${AdminRuntimeText.SYMBOL_36A9E7}${type === ToastType.SUCCESS ? AdminClasses.TOAST_SUCCESS : AdminClasses.TOAST_ERROR}`;
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
    const response = await fetch(apiUrl, { method: AdminConstants.HTTP_POST, body: AdminJson.stringifyJson({ [ApiFields.ACTION]: action, [ApiFields.ADMIN_TOKEN]: adminToken, ...data }) });
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
async function showDashboard() {
  el(DOMIds.LOGIN_SCREEN).classList.remove(AdminClasses.ACTIVE);
  el(DOMIds.DASHBOARD_SCREEN).classList.add(AdminClasses.ACTIVE);
  await loadPlans();
  await loadUsers();
  await loadApiKeysAdmin();
  await loadAccountsAdmin();
}
window.switchAdminPage = function (pageId) {
  if (typeof resetResourceForms === "function") resetResourceForms();
  _.forEach(document.querySelectorAll(AdminSelectors.ADMIN_PAGE_CONTENT), (p) => p.classList.remove(AdminClasses.ACTIVE));
  _.forEach(document.querySelectorAll(AdminSelectors.NAV_TAB_BTN), (b) => b.classList.remove(AdminClasses.ACTIVE));
  const targetPage = el(`${AdminConstants.PAGE_PREFIX}${pageId}`);
  const targetBtn = el(`${AdminConstants.NAV_TAB_PREFIX}${pageId}`);
  if (targetPage) targetPage.classList.add(AdminClasses.ACTIVE);
  if (targetBtn) targetBtn.classList.add(AdminClasses.ACTIVE);
  if (_.isEqual(pageId, AdminConstants.PAGE_RESOURCES)) {
    loadApiKeysAdmin();
    loadAccountsAdmin();
  } else if (_.isEqual(pageId, AdminConstants.PAGE_CONFIG)) {
    loadPlans();
  } else if (_.isEqual(pageId, AdminConstants.PAGE_USERS)) {
    loadUsers();
  }
};
window.switchResourceSubTab = function (subTabId) {
  if (typeof resetResourceForms === "function") resetResourceForms();
  _.forEach(document.querySelectorAll(AdminSelectors.SUB_TAB_CONTENT), (c) => (c.style.display = AdminClasses.DISPLAY_NONE));
  _.forEach(document.querySelectorAll(AdminSelectors.SUB_TAB_BTN), (b) => b.classList.remove(AdminClasses.ACTIVE));
  const targetContent = el(`${AdminConstants.TAB_CONTENT_PREFIX}${subTabId}`);
  const targetBtn = el(`${AdminConstants.TAB_BTN_PREFIX}${subTabId}`);
  if (targetContent) targetContent.style.display = AdminClasses.DISPLAY_BLOCK;
  if (targetBtn) targetBtn.classList.add(AdminClasses.ACTIVE);
};
async function handleLogin() {
  const user = _.trim(el(DOMIds.USERNAME_INPUT).value);
  const pass = _.trim(el(DOMIds.PASSWORD_INPUT).value);
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
    const response = await fetch(API_BASE_URL, { method: AdminConstants.HTTP_POST, body: AdminJson.stringifyJson({ [ApiFields.ACTION]: AdminActions.LOGIN, [ApiFields.USERNAME]: user, [ApiFields.PASSWORD]: pass }) });
    const data = await response.json();
    if (_.isEqual(_.get(data, ApiFields.STATUS), ToastType.SUCCESS) && _.has(data, ApiFields.TOKEN)) {
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
    tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_USERS, _.join([AdminMessages.FETCH_ERROR, escapeHTML(errMsg)], AdminConstants.EMPTY_STR));
    showToast(_.join([AdminMessages.FETCH_ERROR, errMsg], AdminConstants.EMPTY_STR), ToastType.ERROR);
  }
}
function applyFilters() {
  const searchStr = _.toLower(_.get(el(DOMIds.SEARCH_INPUT), AdminRuntimeText.VALUE, AdminConstants.EMPTY_STR));
  const planFilter = _.get(el(DOMIds.FILTER_PLAN), AdminRuntimeText.VALUE, AdminConstants.FILTER_ALL);
  const statusFilter = _.get(el(DOMIds.FILTER_STATUS), AdminRuntimeText.VALUE, AdminConstants.FILTER_ALL);
  filteredUsers = _.filter(_.get(window, AdminConstants.GLOBAL_USERS, []), (u) => {
    let matchSearch = true;
    if (!_.isEmpty(searchStr)) {
      const uname = _.toLower(_.get(u, ApiFields.USERNAME, AdminConstants.EMPTY_STR));
      const ukey = _.toLower(_.get(u, ApiFields.LICENSE_KEY, AdminConstants.EMPTY_STR));
      matchSearch = _.some([uname, ukey], (str) => _.includes(str, searchStr));
    }
    let matchPlan = _.isEqual(planFilter, AdminConstants.FILTER_ALL) ? true : _.isEqual(_.get(u, ApiFields.PLAN_ID), planFilter);
    let matchStatus = _.isEqual(statusFilter, AdminConstants.FILTER_ALL) ? true : _.isEqual(normalizeStatus(_.get(u, ApiFields.STATUS)), normalizeStatus(statusFilter));
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
  const totalPages = _.ceil(totalItems / pageSize) || AdminConstants.MIN_PAGE;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < AdminConstants.MIN_PAGE) currentPage = AdminConstants.MIN_PAGE;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = _.slice(filteredUsers, startIndex, startIndex + pageSize);
  const getPlanBadgeClass = (planName) => {
    const upper = _.toUpper(planName);
    if (_.includes(upper, AdminConstants.PLAN_FREE)) return AdminClasses.BADGE_FREE;
    if (_.some([AdminConstants.PLAN_PRO, AdminConstants.PLAN_VIP, AdminConstants.PLAN_LIFETIME], (key) => _.includes(upper, key))) return AdminClasses.BADGE_PRO;
    return AdminClasses.BADGE_FREE;
  };
  const localizeStatus = (status) => {
    status = normalizeStatus(status);
    if (_.isEqual(status, AdminConstants.STATUS_ACTIVE)) return AdminMessages.STATUS_ACTIVE_LABEL;
    if (_.isEqual(status, AdminConstants.STATUS_REVOKED)) return AdminMessages.STATUS_REVOKED_LABEL;
    if (_.isEqual(status, AdminConstants.STATUS_EXPIRED)) return AdminMessages.STATUS_EXPIRED_LABEL;
    return status;
  };
  const getStatusClass = (status) => {
    status = normalizeStatus(status);
    if (_.isEqual(status, AdminConstants.STATUS_ACTIVE)) return AdminClasses.ACTIVE;
    if (_.isEqual(status, AdminConstants.STATUS_REVOKED)) return AdminClasses.BADGE_REVOKED;
    return AdminClasses.BADGE_EXPIRED;
  };
  const htmlRows = _.map(paginatedUsers, (user) => {
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), _.get(user, ApiFields.PLAN_ID)));
    let tv = AdminConstants.DEFAULT_QUOTA_STR,
      ti = AdminConstants.DEFAULT_QUOTA_STR,
      tc = AdminConstants.DEFAULT_QUOTA_STR;
    if (plan) {
      const isUnlimited = _.get(plan, ApiFields.IS_UNLIMITED);
      tv = isUnlimited ? AdminConstants.INFINITY_SIGN : _.get(plan, ApiFields.QUOTA_VIDEO);
      ti = isUnlimited ? AdminConstants.INFINITY_SIGN : _.get(plan, ApiFields.QUOTA_IMAGE);
      tc = isUnlimited ? AdminConstants.INFINITY_SIGN : _.get(plan, ApiFields.QUOTA_VOICE);
    }
    const usageText = AdminTemplates.USAGE_TEXT(_.get(user, ApiFields.USAGE_VIDEO, AdminConstants.DEFAULT_QUOTA), tv, _.get(user, ApiFields.USAGE_IMAGE, AdminConstants.DEFAULT_QUOTA), ti, _.get(user, ApiFields.USAGE_VOICE, AdminConstants.DEFAULT_QUOTA), tc);
    const planName = plan ? _.get(plan, ApiFields.NAME) : AdminConstants.UNKNOWN_STR;
    const expiresAtStr = _.get(user, ApiFields.EXPIRES_AT) ? new Date(_.get(user, ApiFields.EXPIRES_AT)).toLocaleDateString() : AdminMessages.EXPIRES_LIFETIME;
    const quotaType = _.get(user, ApiFields.QUOTA_TYPE, QuotaType.DAILY);
    const quotaTypeLabel = _.isEqual(quotaType, QuotaType.DAILY) ? AdminMessages.QUOTA_DAILY_LABEL : AdminMessages.QUOTA_TOTAL_LABEL;
    const quotaTypeBadge = `${AdminRuntimeText.SPAN_STYLE_FONT_SIZE_0_65REM_PADDING_0_15REM_0_5REM_BORDER_RADIUS}${quotaType}${AdminRuntimeText.SYMBOL_AB2CD7}${quotaTypeLabel}${AdminRuntimeText.SPAN}`;
    const btnDeviceModal = `${AdminRuntimeText.BUTTON_CLASS_ACTION_BTN_ACTION_WARN_DATA_ACTION}${AdminConstants.ACTION_DEVICE}${AdminRuntimeText.DATA_ID}${_.get(user, ApiFields.ID)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_DEVICES}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_DEVICE}${AdminRuntimeText.BUTTON}`;
    const btnCopy = `${AdminRuntimeText.BUTTON_CLASS_COPY_BTN_DATA_ACTION}${AdminConstants.ACTION_COPY}${AdminRuntimeText.DATA_KEY}${_.get(user, ApiFields.LICENSE_KEY)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_COPY}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_COPY}${AdminRuntimeText.BUTTON}`;
    return `${AdminRuntimeText.TR_TD_STRONG}${escapeHTML(_.get(user, ApiFields.USERNAME))}${AdminRuntimeText.STRONG_TD_TD_DIV_STYLE_DISPLAY_FLEX_ALIGN_ITEMS_CENTER_GAP_0_5REM}${escapeHTML(_.get(user, ApiFields.LICENSE_KEY))}${AdminRuntimeText.SPAN_34A77C}${btnCopy}${AdminRuntimeText.DIV_TD_TD_CLASS_TEXT_CENTER_SPAN_CLASS_BADGE}${getPlanBadgeClass(planName)}${AdminRuntimeText.SYMBOL_AB2CD7}${escapeHTML(formatPlanDisplayName(planName))}${AdminRuntimeText.SPAN_TD_TD_CLASS_TEXT_CENTER_SPAN_CLASS_BADGE}${getStatusClass(_.get(user, ApiFields.STATUS))}${AdminRuntimeText.SYMBOL_AB2CD7}${escapeHTML(localizeStatus(_.get(user, ApiFields.STATUS)))}${AdminRuntimeText.SPAN_TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_SIZE_0_85REM_COLOR_VAR_TE}${usageText}${AdminRuntimeText.DIV}${quotaTypeBadge}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_SIZE_0_85REM_COLOR_VAR_TEXT_MU}${new Date(_.get(user, ApiFields.CREATED_AT)).toLocaleDateString()}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_SIZE_0_85REM_COLOR_VAR_TEXT_MU_FD0636}${expiresAtStr}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_DIV_STYLE_DISPLAY_FLEX_JUSTIFY_CONTENT_CE}${AdminConstants.ACTION_EDIT}${AdminRuntimeText.DATA_ID}${_.get(user, ApiFields.ID)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_EDIT}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_EDIT}${AdminRuntimeText.BUTTON_EB54FD}${btnDeviceModal}${AdminRuntimeText.BUTTON_CLASS_ACTION_BTN_ACTION_DANGER_DATA_ACTION}${AdminConstants.ACTION_DELETE}${AdminRuntimeText.DATA_ID}${_.get(user, ApiFields.ID)}${AdminRuntimeText.DATA_KEY}${_.get(user, ApiFields.LICENSE_KEY)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_DELETE}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_DELETE}${AdminRuntimeText.BUTTON_DIV_TD_TR}`;
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
  btnPrev.onclick = () => {
    currentPage--;
    renderTable();
  };
  controls.appendChild(btnPrev);
  _.forEach(_.range(1, totalPages + 1), (i) => {
    const btnPage = document.createElement(TagNames.BUTTON);
    btnPage.className = `${AdminClasses.PAGE_BTN}${AdminRuntimeText.SYMBOL_36A9E7}${i === currentPage ? AdminClasses.ACTIVE : AdminConstants.EMPTY_STR}`;
    btnPage.textContent = i;
    btnPage.onclick = () => {
      currentPage = i;
      renderTable();
    };
    controls.appendChild(btnPage);
  });
  const btnNext = document.createElement(TagNames.BUTTON);
  btnNext.className = AdminClasses.PAGE_BTN;
  btnNext.textContent = AdminConstants.PAGINATION_NEXT;
  btnNext.disabled = currentPage === totalPages;
  btnNext.onclick = () => {
    currentPage++;
    renderTable();
  };
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
  const container = el(DOMIds.PLANS_CONTAINER);
  if (!container) return;
  container.innerHTML = AdminConstants.EMPTY_STR;
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  if (_.isEmpty(plans)) {
    container.innerHTML = AdminTemplates.PLAN_EMPTY(AdminMessages.EMPTY_PLANS);
    return;
  }
  let rowsHtml = "";
  _.forEach(plans, (plan) => {
    const planId = _.get(plan, ApiFields.ID);
    const planName = _.get(plan, ApiFields.NAME);
    const isUnlimited = _.get(plan, ApiFields.IS_UNLIMITED);
    const isRevoked = _.isEqual(normalizeStatus(_.get(plan, ApiFields.STATUS)), AdminConstants.STATUS_REVOKED);
    const statusBadge = isRevoked ? `${AdminRuntimeText.SPAN_CLASS_BADGE_REVOKED_STYLE_MARGIN_LEFT_0_5REM}${AdminMessages.REVOKED_BADGE}${AdminRuntimeText.SPAN}` : "";
    const limitBadge = isUnlimited ? `${AdminRuntimeText.SPAN_CLASS_BADGE_ACTIVE}${AdminMessages.UNLIMITED_LABEL}${AdminRuntimeText.SPAN}` : `${AdminRuntimeText.SPAN_CLASS_BADGE_FREE}${AdminMessages.LIMIT_QUOTA_LABEL}${AdminRuntimeText.SPAN}`;
    rowsHtml += `${AdminRuntimeText.TR_STYLE}${isRevoked ? AdminRuntimeText.OPACITY_0_6 : ""}${AdminRuntimeText.TD_DIV_STYLE_DISPLAY_FLEX_ALIGN_ITEMS_CENTER_GAP_0_5REM_STRONG}${escapeHTML(formatPlanDisplayName(planName))}${AdminRuntimeText.STRONG}${statusBadge}${AdminRuntimeText.DIV_TD_TD_CLASS_TEXT_CENTER}${limitBadge}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_FAMILY_VAR_FONT_MONO_FONT_WEIG}${isUnlimited ? AdminRuntimeText.SYMBOL_78D9CE : _.get(plan, ApiFields.QUOTA_VIDEO)}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_FAMILY_VAR_FONT_MONO_FONT_WEIG}${isUnlimited ? AdminRuntimeText.SYMBOL_78D9CE : _.get(plan, ApiFields.QUOTA_IMAGE)}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_STYLE_FONT_FAMILY_VAR_FONT_MONO_FONT_WEIG}${isUnlimited ? AdminRuntimeText.SYMBOL_78D9CE : Number(_.get(plan, ApiFields.QUOTA_VOICE)).toLocaleString()}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_DIV_STYLE_DISPLAY_FLEX_GAP_0_5REM_JUSTIFY}${AdminConstants.ACTION_EDIT_PLAN}${AdminRuntimeText.DATA_ID}${planId}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_EDIT}${AdminRuntimeText.SYMBOL_9CF383}${AdminIcons.BTN_EDIT}${AdminRuntimeText.BUTTON_BUTTON_CLASS_ACTION_BTN_ACTION_DANGER_DATA_ACTION}${AdminConstants.ACTION_DELETE_PLAN}${AdminRuntimeText.DATA_ID}${planId}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_DELETE}${AdminRuntimeText.SYMBOL_9CF383}${AdminIcons.BTN_DELETE}${AdminRuntimeText.BUTTON_DIV_TD_TR_427FAD}`;
  });
  container.innerHTML = `${AdminRuntimeText.TABLE_ID_PLANS_TABLE_THEAD_TR_TH_GOI_DICH_VU_TH_TH_CLASS_TEXT_CEN}${rowsHtml}${AdminRuntimeText.TBODY_TABLE}`;
}
window.openCreatePlanModal = function () {
  window.editingPlanId = null;
  el(DOMIds.PLAN_MODAL_TITLE).textContent = AdminMessages.PLAN_TITLE_CREATE;
  el(DOMIds.PLAN_NAME_INPUT_MODAL).value = AdminConstants.EMPTY_STR;
  el(DOMIds.PLAN_VIDEO_INPUT_MODAL).value = AdminConstants.DEFAULT_QUOTA_STR;
  el(DOMIds.PLAN_IMAGE_INPUT_MODAL).value = AdminConstants.DEFAULT_QUOTA_STR;
  el(DOMIds.PLAN_VOICE_INPUT_MODAL).value = AdminConstants.DEFAULT_QUOTA_STR;
  const unlimitChk = el(DOMIds.PLAN_UNLIMITED_INPUT_MODAL);
  unlimitChk.checked = false;
  const label = el(DOMIds.PLAN_UNLIMITED_LABEL_MODAL);
  if (label) label.textContent = AdminMessages.LIMIT_QUOTA_LABEL;
  el(DOMIds.PLAN_VIDEO_INPUT_MODAL).disabled = false;
  el(DOMIds.PLAN_IMAGE_INPUT_MODAL).disabled = false;
  el(DOMIds.PLAN_VOICE_INPUT_MODAL).disabled = false;
  el(DOMIds.PLAN_MODAL).classList.add(AdminClasses.ACTIVE);
};
window.openEditPlanModal = function (planId) {
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), planId));
  if (!plan) return;
  window.editingPlanId = planId;
  el(DOMIds.PLAN_MODAL_TITLE).textContent = AdminMessages.PLAN_TITLE_EDIT;
  el(DOMIds.PLAN_NAME_INPUT_MODAL).value = _.get(plan, ApiFields.NAME, AdminConstants.EMPTY_STR);
  el(DOMIds.PLAN_VIDEO_INPUT_MODAL).value = _.get(plan, ApiFields.QUOTA_VIDEO, AdminConstants.DEFAULT_QUOTA_STR);
  el(DOMIds.PLAN_IMAGE_INPUT_MODAL).value = _.get(plan, ApiFields.QUOTA_IMAGE, AdminConstants.DEFAULT_QUOTA_STR);
  el(DOMIds.PLAN_VOICE_INPUT_MODAL).value = _.get(plan, ApiFields.QUOTA_VOICE, AdminConstants.DEFAULT_QUOTA_STR);
  const isUnlimited = _.get(plan, ApiFields.IS_UNLIMITED, false);
  const unlimitChk = el(DOMIds.PLAN_UNLIMITED_INPUT_MODAL);
  unlimitChk.checked = isUnlimited;
  const label = el(DOMIds.PLAN_UNLIMITED_LABEL_MODAL);
  if (label) label.textContent = isUnlimited ? AdminMessages.UNLIMITED_LABEL : AdminMessages.LIMIT_QUOTA_LABEL;
  el(DOMIds.PLAN_VIDEO_INPUT_MODAL).disabled = isUnlimited;
  el(DOMIds.PLAN_IMAGE_INPUT_MODAL).disabled = isUnlimited;
  el(DOMIds.PLAN_VOICE_INPUT_MODAL).disabled = isUnlimited;
  el(DOMIds.PLAN_MODAL).classList.add(AdminClasses.ACTIVE);
};
window.handleSavePlan = async function () {
  const btn = el(DOMIds.SAVE_PLAN_BTN);
  const name = _.trim(el(DOMIds.PLAN_NAME_INPUT_MODAL).value);
  const video = _.trim(el(DOMIds.PLAN_VIDEO_INPUT_MODAL).value);
  const image = _.trim(el(DOMIds.PLAN_IMAGE_INPUT_MODAL).value);
  const voice = _.trim(el(DOMIds.PLAN_VOICE_INPUT_MODAL).value);
  const isUnlimited = el(DOMIds.PLAN_UNLIMITED_INPUT_MODAL).checked;
  if (!name) {
    showToast(AdminMessages.PLAN_NAME_REQUIRED, ToastType.ERROR);
    return;
  }
  const isEditing = !_.isNil(window.editingPlanId);
  setButtonLoading(btn, true, isEditing ? AdminMessages.LOADING_UPDATE : AdminMessages.LOADING_ADD);
  try {
    const payload = { [ApiFields.NAME]: name, [ApiFields.QUOTA_VIDEO]: _.toInteger(video) || AdminConstants.DEFAULT_QUOTA, [ApiFields.QUOTA_IMAGE]: _.toInteger(image) || AdminConstants.DEFAULT_QUOTA, [ApiFields.QUOTA_VOICE]: _.toInteger(voice) || AdminConstants.DEFAULT_QUOTA, [ApiFields.IS_UNLIMITED]: isUnlimited };
    if (isEditing) {
      payload[ApiFields.ID] = window.editingPlanId;
      await fetchAPI(AdminActions.UPDATE_PLAN, payload);
      showToast(AdminMessages.PLAN_SAVE_SUCCESS, ToastType.SUCCESS);
    } else {
      await fetchAPI(AdminActions.CREATE_PLAN, payload);
      showToast(AdminMessages.PLAN_SAVE_SUCCESS, ToastType.SUCCESS);
    }
    closeModal(DOMIds.PLAN_MODAL);
    loadPlans();
  } catch (error) {
    Logger.error(error);
    showToast(AdminMessages.SAVE_ERROR_USER, ToastType.ERROR);
  } finally {
    setButtonLoading(btn, false);
  }
};
function populatePlanSelects() {
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  const filterPlanSelect = el(DOMIds.FILTER_PLAN);
  if (filterPlanSelect) {
    filterPlanSelect.innerHTML = AdminTemplates.SELECT_OPTION(AdminConstants.FILTER_ALL, AdminConstants.PLAN_ALL_LABEL, true);
    _.forEach(plans, (p) => {
      filterPlanSelect.innerHTML += AdminTemplates.SELECT_OPTION(_.get(p, ApiFields.ID), formatPlanDisplayName(_.get(p, ApiFields.NAME)));
    });
  }
  const modalPlanSelect = el(DOMIds.MODAL_PLAN_TYPE);
  if (modalPlanSelect) {
    modalPlanSelect.innerHTML = AdminConstants.EMPTY_STR;
    _.forEach(plans, (p) => {
      modalPlanSelect.innerHTML += AdminTemplates.SELECT_OPTION(_.get(p, ApiFields.ID), formatPlanDisplayName(_.get(p, ApiFields.NAME)));
    });
  }
}
function addOptionWithLabel(tsInstance, value) {
  if (!tsInstance || !value) return;
  const trimmed = _.trim(_.toString(value));
  if (tsInstance.options[trimmed]) return;
  let label = trimmed;
  if (_.isEqual(trimmed, AdminConstants.ASSIGN_ALL)) {
    label = AdminMessages.ASSIGN_ALL_LABEL;
  } else {
    const plans = window[AdminConstants.GLOBAL_PLANS] || [];
    const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), trimmed) || _.isEqual(_.get(p, ApiFields.NAME), trimmed));
    if (plan) {
      label = formatPlanDisplayName(_.get(plan, ApiFields.NAME));
    } else {
      const users = window[AdminConstants.GLOBAL_USERS] || [];
      const user = _.find(users, (u) => _.isEqual(_.get(u, ApiFields.LICENSE_KEY), trimmed));
      if (user) {
        label = `${_.get(user, ApiFields.USERNAME)}${AdminRuntimeText.SYMBOL_4F5A2A}${trimmed}${AdminRuntimeText.SYMBOL_BA5EC5}`;
      }
    }
  }
  tsInstance.addOption({ value: trimmed, text: label });
}
function resetResourceForms() {
  window.editingKeyId = null;
  el(DOMIds.KEYS_GEMINI_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_CEREBRAS_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_GROQ_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_AI33_INPUT).value = AdminConstants.EMPTY_STR;
  if (tsExcludedModalInstance) tsExcludedModalInstance.clear();
  else el(DOMIds.KEYS_EXCLUDED_INPUT).value = AdminConstants.EMPTY_STR;
  if (tsKeysModalInstance) tsKeysModalInstance.clear();
  else el(DOMIds.KEYS_ASSIGNEE_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.SAVE_KEYS_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_SAVE, AdminMessages.MODAL_SAVE_DEFAULT);
  window.editingAccountId = null;
  el(DOMIds.ACC_EMAIL_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.ACC_PASSWORD_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.ACC_RECOVERY_INPUT).value = AdminConstants.EMPTY_STR;
  el(DOMIds.ACC_STATUS_INPUT).value = AdminConstants.ACCOUNT_STATUS_ACTIVE;
  if (tsAccModalInstance) tsAccModalInstance.setValue(AdminConstants.ASSIGN_ALL);
  else el(DOMIds.ACC_ASSIGNEE_INPUT).value = AdminConstants.ASSIGN_ALL;
  el(DOMIds.ADD_ACC_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_ADD, AdminMessages.BTN_ADD);
}
function closeModal(id) {
  el(id)?.classList.remove(AdminClasses.ACTIVE);
  if (_.isEqual(id, DOMIds.KEY_MODAL) || _.isEqual(id, DOMIds.ACCOUNT_MODAL)) {
    resetResourceForms();
  }
}
function handleOpenCreateModal() {
  editingUserId = null;
  el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_CREATE_TITLE;
  el(DOMIds.MODAL_USERNAME).value = AdminConstants.EMPTY_STR;
  el(DOMIds.MODAL_USERNAME).disabled = false;
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  if (!_.isEmpty(plans)) el(DOMIds.MODAL_PLAN_TYPE).value = _.get(plans[0], ApiFields.ID);
  el(DOMIds.MODAL_STATUS).value = AdminConstants.STATUS_ACTIVE;
  el(DOMIds.MODAL_STATUS).disabled = true;
  el(DOMIds.MODAL_QUOTA_TYPE).value = QuotaType.DAILY;
  el(DOMIds.MODAL_EXPIRES).value = AdminConstants.EMPTY_STR;
  el(DOMIds.MODAL_EXPIRES_WRAPPER).style.display = AdminClasses.DISPLAY_FLEX;
  el(DOMIds.USER_MODAL).classList.add(AdminClasses.ACTIVE);
}
function openEditModal(id) {
  const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), (u) => _.isEqual(_.get(u, ApiFields.ID), id));
  if (!user) return;
  editingUserId = id;
  el(DOMIds.USER_MODAL_TITLE).textContent = AdminMessages.MODAL_EDIT_TITLE;
  el(DOMIds.MODAL_USERNAME).value = _.get(user, ApiFields.USERNAME);
  el(DOMIds.MODAL_USERNAME).disabled = true;
  const planSelect = el(DOMIds.MODAL_PLAN_TYPE);
  planSelect.value = _.get(user, ApiFields.PLAN_ID);
  el(DOMIds.MODAL_STATUS).value = normalizeStatus(_.get(user, ApiFields.STATUS));
  el(DOMIds.MODAL_STATUS).disabled = false;
  el(DOMIds.MODAL_QUOTA_TYPE).value = _.get(user, ApiFields.QUOTA_TYPE, QuotaType.DAILY);
  if (!_.isEmpty(_.get(user, ApiFields.EXPIRES_AT))) {
    el(DOMIds.MODAL_EXPIRES).value = _.get(_.split(new Date(_.get(user, ApiFields.EXPIRES_AT)).toISOString(), AdminConstants.DATE_T_SPLIT), AdminConstants.DATE_ISO_INDEX, AdminConstants.EMPTY_STR);
  } else {
    el(DOMIds.MODAL_EXPIRES).value = AdminConstants.EMPTY_STR;
  }
  const wrapper = el(DOMIds.MODAL_EXPIRES_WRAPPER);
  const planId = _.get(user, ApiFields.PLAN_ID);
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), planId));
  if (plan && _.get(plan, ApiFields.IS_UNLIMITED)) {
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
  const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), selectedPlanId));
  if (plan && _.get(plan, ApiFields.IS_UNLIMITED) && _.isNil(editingUserId)) {
    wrapper.style.display = AdminClasses.DISPLAY_NONE;
  } else {
    wrapper.style.display = AdminClasses.DISPLAY_FLEX;
  }
}
async function handleSaveUser() {
  const btn = el(DOMIds.SAVE_USER_BTN);
  const username = _.trim(el(DOMIds.MODAL_USERNAME).value);
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
  const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), (u) => _.isEqual(_.get(u, ApiFields.ID), resettingUserId));
  const keyStr = user ? _.get(user, ApiFields.LICENSE_KEY) : AdminConstants.UNKNOWN_STR;
  const confirmMsg = _.replace(AdminMessages.RESET_DEVICE_CONFIRM, AdminRuntimeText.VALUE_0_A00644, keyStr);
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
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(AdminMessages.COPY_SUCCESS + text, ToastType.SUCCESS);
    })
    .catch((err) => {
      Logger.error(AdminMessages.LOG_COPY_FAILED, err);
      showToast(AdminMessages.COPY_ERROR, ToastType.ERROR);
    });
}
function openDeviceModal(id) {
  const user = _.find(_.get(window, AdminConstants.GLOBAL_USERS, []), (u) => _.isEqual(_.get(u, ApiFields.ID), id));
  if (!user) return;
  const container = el(DOMIds.DEVICE_LIST_CONTAINER);
  let deviceIdStr = AdminTemplates.DEVICE_EMPTY(AdminMessages.EMPTY_DEVICE_MSG);
  try {
    const parsedDevices = AdminJson.parseJson(_.get(user, ApiFields.DEVICE_ID, AdminMessages.ARRAY_EMPTY_JSON));
    if (_.isArray(parsedDevices) && !_.isEmpty(parsedDevices)) {
      deviceIdStr = _.join(
        _.map(parsedDevices, (d) => AdminTemplates.DEVICE_CARD(d, AdminMessages.DEVICE_CONNECTED)),
        AdminConstants.EMPTY_STR,
      );
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
    showToast(_.replace(AdminMessages.SYNC_SUCCESS, AdminRuntimeText.VALUE_0_A00644, count), ToastType.SUCCESS);
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
  const numericInputs = document.querySelectorAll(`${AdminSelectors.NUMERIC_INPUT}${AdminRuntimeText.SYMBOL_A39912}${DOMIds.PLAN_VIDEO_INPUT_MODAL}${AdminRuntimeText.SYMBOL_A39912}${DOMIds.PLAN_IMAGE_INPUT_MODAL}${AdminRuntimeText.SYMBOL_A39912}${DOMIds.PLAN_VOICE_INPUT_MODAL}`);
  _.forEach(numericInputs, (input) => {
    input.addEventListener(EventTypes.INPUT, function () {
      this.value = _.replace(this.value, AdminRegex.NUMBERS_ONLY, AdminConstants.EMPTY_STR);
    });
  });
}
function delegateModalCloses() {
  const closeBtns = document.querySelectorAll(`${AdminSelectors.MODAL_CLOSE_BTN}${AdminRuntimeText.MODAL_CLOSE_BTN}`);
  _.forEach(closeBtns, (btn) => {
    btn.addEventListener(EventTypes.CLICK, function () {
      const modalId = this.getAttribute(DataAttributes.MODAL);
      if (modalId) closeModal(modalId);
    });
  });
}
function delegateTableActions() {
  document.addEventListener(EventTypes.CLICK, function (e) {
    const target = e.target.closest(`${AdminSelectors.ACTION_BTNS}${AdminRuntimeText.DATA_ACTION}`);
    if (!target) return;
    const action = target.getAttribute(DataAttributes.ACTION) || target.getAttribute(AdminRuntimeText.DATA_ACTION_AF03C5);
    const key = target.getAttribute(DataAttributes.KEY) || target.getAttribute(AdminRuntimeText.DATA_KEY_CAB768);
    const accountId = target.getAttribute(DataAttributes.ACCOUNT_ID) || target.getAttribute(AdminRuntimeText.DATA_ACCOUNT_ID);
    const uid = target.getAttribute(DataAttributes.ID) || target.getAttribute(AdminRuntimeText.DATA_ID_B04FC0);
    if (_.isEqual(action, AdminConstants.ACTION_EDIT) && uid) openEditModal(uid);
    if (_.isEqual(action, AdminConstants.ACTION_DEVICE) && uid) openDeviceModal(uid);
    if (_.isEqual(action, AdminConstants.ACTION_DELETE) && uid) openDeleteModal(uid, key);
    if (_.isEqual(action, AdminConstants.ACTION_COPY) && key) copyToClipboard(key);
    if (_.isEqual(action, AdminConstants.ACTION_EDIT_ACC) && accountId) editAccountAdmin(accountId);
    if (_.isEqual(action, AdminConstants.ACTION_DELETE_ACC) && accountId) deleteAccountAdmin(accountId);
    const keyId = target.getAttribute(DataAttributes.ID) || target.getAttribute(AdminRuntimeText.DATA_ID_B04FC0);
    if (_.isEqual(action, AdminConstants.ACTION_DELETE_KEYS) && keyId) deleteApiKeysAdmin(keyId);
    if (_.isEqual(action, AdminConstants.ACTION_EDIT_KEYS) && keyId) editApiKeysAdmin(keyId);
    if (_.isEqual(action, AdminConstants.ACTION_EDIT_PLAN) && uid) openEditPlanModal(uid);
    if (_.isEqual(action, AdminConstants.ACTION_DELETE_PLAN) && uid) {
      deletingResourceId = uid;
      deletingResourceType = AdminConstants.TYPE_PLAN;
      el(AdminConstants.RESOURCE_DELETE_MODAL_ID)?.classList.add(AdminClasses.ACTIVE);
    }
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
  el(DOMIds.OPEN_PLAN_CREATE_MODAL_BTN)?.addEventListener(EventTypes.CLICK, openCreatePlanModal);
  el(DOMIds.SAVE_PLAN_BTN)?.addEventListener(EventTypes.CLICK, handleSavePlan);
  el(DOMIds.PLAN_UNLIMITED_INPUT_MODAL)?.addEventListener(AdminRuntimeText.CHANGE, function (e) {
    const disabled = e.target.checked;
    el(DOMIds.PLAN_VIDEO_INPUT_MODAL).disabled = disabled;
    el(DOMIds.PLAN_IMAGE_INPUT_MODAL).disabled = disabled;
    el(DOMIds.PLAN_VOICE_INPUT_MODAL).disabled = disabled;
    const label = el(DOMIds.PLAN_UNLIMITED_LABEL_MODAL);
    if (label) {
      label.textContent = disabled ? AdminMessages.UNLIMITED_LABEL : AdminMessages.LIMIT_QUOTA_LABEL;
    }
  });
  el(DOMIds.OPEN_CREATE_MODAL_BTN)?.addEventListener(EventTypes.CLICK, handleOpenCreateModal);
  el(DOMIds.MODAL_PLAN_TYPE)?.addEventListener(EventTypes.CHANGE, handlePlanTypeChange);
  el(DOMIds.SAVE_USER_BTN)?.addEventListener(EventTypes.CLICK, handleSaveUser);
  el(DOMIds.BTN_SOFT_DELETE)?.addEventListener(EventTypes.CLICK, handleSoftDelete);
  el(DOMIds.BTN_HARD_DELETE)?.addEventListener(EventTypes.CLICK, handleHardDelete);
  el(DOMIds.BTN_RESOURCE_SOFT_DELETE)?.addEventListener(EventTypes.CLICK, handleResourceSoftDelete);
  el(DOMIds.BTN_RESOURCE_HARD_DELETE)?.addEventListener(EventTypes.CLICK, handleResourceHardDelete);
  el(DOMIds.MODAL_RESET_DEVICE_BTN)?.addEventListener(EventTypes.CLICK, handleResetDevice);
  el(DOMIds.SAVE_KEYS_BTN)?.addEventListener(EventTypes.CLICK, handleSaveKeys);
  el(DOMIds.ADD_ACC_BTN)?.addEventListener(EventTypes.CLICK, handleSaveAccount);
  el(DOMIds.SEARCH_INPUT)?.addEventListener(EventTypes.INPUT, applyFilters);
  el(DOMIds.FILTER_PLAN)?.addEventListener(EventTypes.CHANGE, applyFilters);
  el(DOMIds.FILTER_STATUS)?.addEventListener(EventTypes.CHANGE, applyFilters);
  el(DOMIds.PAGE_SIZE)?.addEventListener(EventTypes.CHANGE, (e) => {
    pageSize = _.toInteger(_.get(e, AdminConstants.TARGET_VALUE_PATH, AdminConstants.DEFAULT_PAGE_SIZE));
    currentPage = AdminConstants.DEFAULT_PAGE;
    renderTable();
  });
  el(AdminRuntimeText.OPEN_KEYS_MODAL_BTN)?.addEventListener(EventTypes.CLICK, () => {
    resetResourceForms();
    window.editingKeyId = null;
    el(DOMIds.KEY_MODAL_TITLE).textContent = AdminMessages.KEYS_TITLE_CREATE;
    el(DOMIds.SAVE_KEYS_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_SAVE, AdminMessages.BTN_SAVE_KEY);
    el(DOMIds.KEY_MODAL).classList.add(AdminClasses.ACTIVE);
  });
  el(AdminRuntimeText.OPEN_ACCOUNT_MODAL_BTN)?.addEventListener(EventTypes.CLICK, () => {
    resetResourceForms();
    window.editingAccountId = null;
    el(DOMIds.ACCOUNT_MODAL_TITLE).textContent = AdminMessages.ACC_TITLE_CREATE;
    el(DOMIds.ADD_ACC_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_ADD, AdminMessages.BTN_ADD_ACC);
    el(DOMIds.ACCOUNT_MODAL).classList.add(AdminClasses.ACTIVE);
  });
  document.addEventListener(EventTypes.CHANGE, function (e) {
    if (e.target.classList.contains(AdminSelectors.ACC_STATUS_SELECT.substring(1))) {
      const accId = e.target.getAttribute(DataAttributes.ACCOUNT_ID);
      const status = e.target.value;
      if (accId) updateAccStatus(Number(accId), status);
    }
  });
}
async function handleSaveKeys() {
  const btn = el(DOMIds.SAVE_KEYS_BTN);
  const getSelectValue = (tsInstance, defaultElId) => {
    if (!tsInstance) return _.trim(el(defaultElId).value);
    const val = tsInstance.getValue();
    return _.isArray(val) ? _.join(val, AdminConstants.COMMA_SPLIT) : _.trim(_.toString(val));
  };
  const assignee = getSelectValue(tsKeysModalInstance, DOMIds.KEYS_ASSIGNEE_INPUT) || AdminConstants.ASSIGN_ALL;
  const gemini = _.trim(el(DOMIds.KEYS_GEMINI_INPUT).value);
  const cerebras = _.trim(el(DOMIds.KEYS_CEREBRAS_INPUT).value);
  const groq = _.trim(el(DOMIds.KEYS_GROQ_INPUT).value);
  const ai33 = _.trim(el(DOMIds.KEYS_AI33_INPUT).value);
  const excluded = getSelectValue(tsExcludedModalInstance, DOMIds.KEYS_EXCLUDED_INPUT);
  if (!gemini && !cerebras && !groq && !ai33) {
    showToast(AdminMessages.VALIDATION_NEED_KEY, ToastType.ERROR);
    return;
  }
  setButtonLoading(btn, true, AdminMessages.LOADING_SAVE);
  try {
    const payload = { [ApiFields.GEMINI_KEY]: gemini, [ApiFields.CEREBRAS_KEY]: cerebras, [ApiFields.GROQ_KEY]: groq, [ApiFields.AI33_KEY]: ai33, [ApiFields.ASSIGNED_TO]: assignee, [ApiFields.EXCLUDED_TO]: excluded };
    if (window.editingKeyId) {
      payload[ApiFields.ID] = window.editingKeyId;
    }
    await fetchAPI(AdminActions.UPDATE_API_KEYS, payload);
    showToast(AdminMessages.KEYS_SAVE_SUCCESS, ToastType.SUCCESS);
    closeModal(DOMIds.KEY_MODAL);
    loadApiKeysAdmin();
  } catch (e) {
    showToast(AdminMessages.SAVE_ERROR + e.message, ToastType.ERROR);
  } finally {
    setButtonLoading(btn, false);
  }
}
async function handleSaveAccount() {
  const btn = el(DOMIds.ADD_ACC_BTN);
  const email = _.trim(el(DOMIds.ACC_EMAIL_INPUT).value);
  const pwd = _.trim(el(DOMIds.ACC_PASSWORD_INPUT).value);
  const recovery = _.trim(el(DOMIds.ACC_RECOVERY_INPUT).value);
  const assign = _.trim(el(DOMIds.ACC_ASSIGNEE_INPUT).value) || AdminConstants.ASSIGN_ALL;
  const status = el(DOMIds.ACC_STATUS_INPUT).value;
  if (!email) {
    showToast(AdminMessages.MISSING_ACC_INFO, ToastType.ERROR);
    return;
  }
  const isEditing = !_.isNil(window.editingAccountId);
  setButtonLoading(btn, true, isEditing ? AdminMessages.LOADING_UPDATE : AdminMessages.LOADING_ADD);
  try {
    if (isEditing) {
      await fetchAPI(AdminActions.UPDATE_ACCOUNT, { [ApiFields.ACCOUNT]: { [ApiFields.ID]: window.editingAccountId, [ApiFields.EMAIL]: email, [ApiFields.PASSWORD]: pwd, [ApiFields.RECOVERY_EMAIL]: recovery, [ApiFields.STATUS]: status, [ApiFields.ASSIGNED_TO]: assign } });
      showToast(AdminMessages.ACCOUNT_UPDATE_SUCCESS, ToastType.SUCCESS);
      window.editingAccountId = null;
      btn.innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_ADD, AdminMessages.BTN_ADD);
    } else {
      await fetchAPI(AdminActions.ADD_ACCOUNT, { [ApiFields.ACCOUNT]: { [ApiFields.EMAIL]: email, [ApiFields.PASSWORD]: pwd, [ApiFields.RECOVERY_EMAIL]: recovery, [ApiFields.STATUS]: status, [ApiFields.ASSIGNED_TO]: assign } });
      showToast(AdminMessages.ACCS_SAVE_SUCCESS, ToastType.SUCCESS);
    }
    closeModal(DOMIds.ACCOUNT_MODAL);
    loadAccountsAdmin();
  } catch (e) {
    Logger.error(e);
    showToast(AdminMessages.SAVE_ERROR_USER, ToastType.ERROR);
  } finally {
    setButtonLoading(btn, false);
  }
}
function populateAssignSelects() {
  const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
  let optionsHtml = AdminTemplates.SELECT_OPTION(AdminConstants.ASSIGN_ALL, AdminMessages.ASSIGN_ALL_LABEL);
  _.forEach(plans, (p) => {
    optionsHtml += AdminTemplates.SELECT_OPTION(p.id, formatPlanDisplayName(p.name));
  });
  const users = _.get(window, AdminConstants.GLOBAL_USERS, []);
  if (!_.isEmpty(users)) {
    let userOptions = AdminConstants.EMPTY_STR;
    _.forEach(users, (u) => {
      const keyStr = _.get(u, ApiFields.LICENSE_KEY);
      const uname = _.get(u, ApiFields.USERNAME);
      userOptions += AdminTemplates.SELECT_OPTION(keyStr, `${uname}${AdminRuntimeText.SYMBOL_4F5A2A}${keyStr}${AdminRuntimeText.SYMBOL_BA5EC5}`);
    });
    optionsHtml += AdminTemplates.OPTGROUP(AdminMessages.ASSIGN_SPECIFIC_LABEL, userOptions);
  }
  const keysSelect = el(DOMIds.KEYS_ASSIGNEE_INPUT);
  const accSelect = el(DOMIds.ACC_ASSIGNEE_INPUT);
  const excludedSelect = el(DOMIds.KEYS_EXCLUDED_INPUT);
  if (tsKeysModalInstance) {
    try {
      tsKeysModalInstance.destroy();
    } catch (e) {}
    tsKeysModalInstance = null;
  }
  if (tsAccModalInstance) {
    try {
      tsAccModalInstance.destroy();
    } catch (e) {}
    tsAccModalInstance = null;
  }
  if (tsExcludedModalInstance) {
    try {
      tsExcludedModalInstance.destroy();
    } catch (e) {}
    tsExcludedModalInstance = null;
  }
  if (keysSelect) {
    keysSelect.innerHTML = optionsHtml;
    tsKeysModalInstance = new TomSelect(keysSelect, { create: true, maxItems: null, placeholder: AdminMessages.SEARCH_PLACEHOLDER, dropdownParent: AdminConstants.BODY_TAG, plugins: [AdminConstants.PLUGIN_DROPDOWN, AdminConstants.PLUGIN_REMOVE_BUTTON] });
  }
  if (accSelect) {
    accSelect.innerHTML = optionsHtml;
    tsAccModalInstance = new TomSelect(accSelect, { create: true, maxItems: AdminConstants.MAX_ITEMS_SELECT, placeholder: AdminMessages.SEARCH_PLACEHOLDER, dropdownParent: AdminConstants.BODY_TAG, plugins: [AdminConstants.PLUGIN_DROPDOWN] });
  }
  if (excludedSelect) {
    excludedSelect.innerHTML = optionsHtml;
    tsExcludedModalInstance = new TomSelect(excludedSelect, { create: true, maxItems: null, placeholder: AdminMessages.SEARCH_PLACEHOLDER, dropdownParent: AdminConstants.BODY_TAG, plugins: [AdminConstants.PLUGIN_DROPDOWN, AdminConstants.PLUGIN_REMOVE_BUTTON] });
  }
}
function editApiKeysAdmin(keyId) {
  const keys = _.get(window, AdminConstants.GLOBAL_API_KEYS, []);
  const keyRecord = _.find(keys, (k) => _.isEqual(_.get(k, ApiFields.ID), keyId));
  if (!keyRecord) return;
  const assignedTo = _.get(keyRecord, ApiFields.ASSIGNED_TO) || AdminConstants.EMPTY_STR;
  const assignedArray = assignedTo ? _.map(_.split(assignedTo, AdminConstants.COMMA_SPLIT), (s) => _.trim(s)) : [];
  if (tsKeysModalInstance) {
    _.forEach(assignedArray, (val) => addOptionWithLabel(tsKeysModalInstance, val));
    tsKeysModalInstance.setValue(assignedArray);
  } else {
    el(DOMIds.KEYS_ASSIGNEE_INPUT).value = assignedTo;
  }
  el(DOMIds.KEYS_GEMINI_INPUT).value = _.get(keyRecord, ApiFields.GEMINI_KEY) || AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_CEREBRAS_INPUT).value = _.get(keyRecord, ApiFields.CEREBRAS_KEY) || AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_GROQ_INPUT).value = _.get(keyRecord, ApiFields.GROQ_KEY) || AdminConstants.EMPTY_STR;
  el(DOMIds.KEYS_AI33_INPUT).value = _.get(keyRecord, ApiFields.AI33_KEY) || AdminConstants.EMPTY_STR;
  const excludedTo = _.get(keyRecord, ApiFields.EXCLUDED_TO) || AdminConstants.EMPTY_STR;
  const excludedArray = excludedTo ? _.map(_.split(excludedTo, AdminConstants.COMMA_SPLIT), (s) => _.trim(s)) : [];
  if (tsExcludedModalInstance) {
    _.forEach(excludedArray, (val) => addOptionWithLabel(tsExcludedModalInstance, val));
    tsExcludedModalInstance.setValue(excludedArray);
  } else {
    el(DOMIds.KEYS_EXCLUDED_INPUT).value = excludedTo;
  }
  window.editingKeyId = keyId;
  el(DOMIds.SAVE_KEYS_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_EDIT, AdminMessages.BTN_UPDATE);
  el(DOMIds.KEY_MODAL_TITLE).textContent = AdminMessages.KEYS_TITLE_EDIT;
  el(DOMIds.KEY_MODAL).classList.add(AdminClasses.ACTIVE);
}
function deleteApiKeysAdmin(keyId) {
  deletingResourceId = keyId;
  deletingResourceType = AdminConstants.TYPE_API_KEY;
  el(AdminConstants.RESOURCE_DELETE_MODAL_ID)?.classList.add(AdminClasses.ACTIVE);
}
function editAccountAdmin(id) {
  const accs = _.get(window, AdminConstants.GLOBAL_ACCOUNTS, []);
  const acc = _.find(accs, (a) => _.isEqual(_.get(a, ApiFields.ID), id));
  if (!acc) return;
  el(DOMIds.ACC_EMAIL_INPUT).value = _.get(acc, ApiFields.EMAIL);
  el(DOMIds.ACC_PASSWORD_INPUT).value = _.get(acc, ApiFields.PASSWORD);
  el(DOMIds.ACC_RECOVERY_INPUT).value = _.get(acc, ApiFields.RECOVERY_EMAIL);
  el(DOMIds.ACC_STATUS_INPUT).value = _.get(acc, ApiFields.STATUS) || AdminConstants.ACCOUNT_STATUS_ACTIVE;
  if (tsAccModalInstance) {
    const assignVal = _.get(acc, ApiFields.ASSIGNED_TO);
    addOptionWithLabel(tsAccModalInstance, assignVal);
    tsAccModalInstance.setValue(assignVal);
  } else {
    el(DOMIds.ACC_ASSIGNEE_INPUT).value = _.get(acc, ApiFields.ASSIGNED_TO);
  }
  window.editingAccountId = id;
  el(DOMIds.ADD_ACC_BTN).innerHTML = AdminTemplates.BTN_WITH_ICON(AdminIcons.BTN_EDIT, AdminMessages.BTN_UPDATE);
  el(DOMIds.ACCOUNT_MODAL_TITLE).textContent = AdminMessages.ACC_TITLE_EDIT;
  el(DOMIds.ACCOUNT_MODAL).classList.add(AdminClasses.ACTIVE);
}
function deleteAccountAdmin(id) {
  deletingResourceId = id;
  deletingResourceType = AdminConstants.TYPE_ACCOUNT;
  el(AdminConstants.RESOURCE_DELETE_MODAL_ID)?.classList.add(AdminClasses.ACTIVE);
}
async function handleResourceSoftDelete() {
  const btn = el(DOMIds.BTN_RESOURCE_SOFT_DELETE);
  setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_SOFT_DELETE);
  try {
    const action = _.isEqual(deletingResourceType, AdminConstants.TYPE_API_KEY) ? AdminActions.DELETE_API_KEYS : _.isEqual(deletingResourceType, AdminConstants.TYPE_PLAN) ? AdminActions.DELETE_PLAN : AdminActions.DELETE_ACCOUNT;
    await fetchAPI(action, { [ApiFields.ID]: deletingResourceId, [ApiFields.DELETE_TYPE]: AdminConstants.DELETE_TYPE_SOFT });
    showToast(AdminMessages.SOFT_DELETE_SUCCESS, ToastType.SUCCESS);
    closeModal(AdminConstants.RESOURCE_DELETE_MODAL_ID);
    if (_.isEqual(deletingResourceType, AdminConstants.TYPE_API_KEY)) loadApiKeysAdmin();
    else if (_.isEqual(deletingResourceType, AdminConstants.TYPE_PLAN)) loadPlans();
    else loadAccountsAdmin();
  } catch (e) {
    showToast(AdminMessages.ERROR_PREFIX + e.message, ToastType.ERROR);
  } finally {
    setButtonLoading(btn, false);
  }
}
async function handleResourceHardDelete() {
  const btn = el(DOMIds.BTN_RESOURCE_HARD_DELETE);
  setButtonLoading(btn, true, AdminMessages.ACTION_LOADING_HARD_DELETE);
  try {
    const action = _.isEqual(deletingResourceType, AdminConstants.TYPE_API_KEY) ? AdminActions.DELETE_API_KEYS : _.isEqual(deletingResourceType, AdminConstants.TYPE_PLAN) ? AdminActions.DELETE_PLAN : AdminActions.DELETE_ACCOUNT;
    await fetchAPI(action, { [ApiFields.ID]: deletingResourceId, [ApiFields.DELETE_TYPE]: AdminConstants.DELETE_TYPE_HARD });
    showToast(AdminMessages.HARD_DELETE_SUCCESS, ToastType.SUCCESS);
    closeModal(AdminConstants.RESOURCE_DELETE_MODAL_ID);
    if (_.isEqual(deletingResourceType, AdminConstants.TYPE_API_KEY)) loadApiKeysAdmin();
    else if (_.isEqual(deletingResourceType, AdminConstants.TYPE_PLAN)) loadPlans();
    else loadAccountsAdmin();
  } catch (e) {
    showToast(AdminMessages.ERROR_PREFIX + e.message, ToastType.ERROR);
  } finally {
    setButtonLoading(btn, false);
  }
}
async function loadApiKeysAdmin() {
  const tbody = elq(DOMIds.KEYS_TBODY);
  tbody.innerHTML = AdminTemplates.TABLE_LOADING(AdminConstants.COLSPAN_KEYS, AdminMessages.DATA_LOADING);
  const getAssignBadge = (assignee) => {
    if (_.isEqual(assignee, AdminConstants.ASSIGN_ALL)) return AdminClasses.BADGE_FREE;
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), assignee));
    if (plan) {
      return _.includes(_.toUpper(_.get(plan, ApiFields.NAME)), AdminConstants.PLAN_FREE) ? AdminClasses.BADGE_FREE : AdminClasses.BADGE_PRO;
    }
    return AdminClasses.BADGE_PRO;
  };
  const getAssignName = (assignee) => {
    if (!assignee) return AdminMessages.ASSIGN_ALL_LABEL;
    const items = _.split(_.toString(assignee), AdminConstants.COMMA_SPLIT);
    const mapped = _.map(items, (item) => {
      const trimmed = _.trim(item);
      if (_.isEqual(trimmed, AdminConstants.ASSIGN_ALL)) return AdminMessages.ASSIGN_ALL_LABEL;
      const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
      const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), trimmed) || _.isEqual(_.get(p, ApiFields.NAME), trimmed));
      if (plan) return formatPlanDisplayName(_.get(plan, ApiFields.NAME));
      const users = _.get(window, AdminConstants.GLOBAL_USERS, []);
      const user = _.find(users, (u) => _.isEqual(_.get(u, ApiFields.LICENSE_KEY), trimmed));
      if (user) return `${_.get(user, ApiFields.USERNAME)}${AdminRuntimeText.SYMBOL_4F5A2A}${trimmed.slice(0, AdminConstants.KEY_PREVIEW_LENGTH)}${AdminRuntimeText.SYMBOL_715390}`;
      return formatPlanDisplayName(trimmed);
    });
    return _.join(mapped, AdminConstants.COMMA_JOIN);
  };
  const formatExcludedDisplay = (excludedTo) => {
    if (!excludedTo) return AdminMessages.NO_DATA;
    const items = _.split(excludedTo, AdminConstants.COMMA_SPLIT);
    const mapped = _.map(items, (item) => {
      const trimmed = _.trim(item);
      if (_.isEqual(trimmed, AdminConstants.ASSIGN_ALL)) return AdminMessages.ASSIGN_ALL_LABEL;
      const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
      const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), trimmed));
      if (plan) return formatPlanDisplayName(_.get(plan, ApiFields.NAME));
      const users = _.get(window, AdminConstants.GLOBAL_USERS, []);
      const user = _.find(users, (u) => _.isEqual(_.get(u, ApiFields.LICENSE_KEY), trimmed));
      if (user) return `${_.get(user, ApiFields.USERNAME)}${AdminRuntimeText.SYMBOL_4F5A2A}${trimmed.slice(0, AdminConstants.KEY_PREVIEW_LENGTH)}${AdminRuntimeText.SYMBOL_715390}`;
      return trimmed;
    });
    return _.join(mapped, AdminConstants.COMMA_JOIN);
  };
  try {
    const res = await fetchAPI(AdminActions.GET_API_KEYS);
    const keys = _.get(res, ApiFields.KEYS, []);
    window[AdminConstants.GLOBAL_API_KEYS] = keys;
    tbody.innerHTML = _.join(
      _.map(keys, (k) => {
        const assignee = _.get(k, ApiFields.ASSIGNED_TO, AdminConstants.ASSIGN_ALL);
        const badgeClass = getAssignBadge(assignee);
        const assigneeLabel = getAssignName(assignee);
        const geminiValue = _.get(k, ApiFields.GEMINI_KEY);
        const cerebrasValue = _.get(k, ApiFields.CEREBRAS_KEY);
        const groqValue = _.get(k, ApiFields.GROQ_KEY);
        const ai33Value = _.get(k, ApiFields.AI33_KEY);
        const excludedValue = formatExcludedDisplay(_.get(k, ApiFields.EXCLUDED_TO));
        const keyId = _.get(k, ApiFields.ID);
        const formatValue = (v) => (v ? AdminMessages.PASSWORD_MASK + v.slice(-AdminConstants.KEY_MASK_SUFFIX_LENGTH) : AdminTemplates.DANGER_TEXT(AdminMessages.NO_DATA));
        const isRevoked = _.isEqual(normalizeStatus(_.get(k, ApiFields.STATUS)), AdminConstants.STATUS_REVOKED);
        const rowStyle = isRevoked ? AdminRuntimeText.OPACITY_0_5_BACKGROUND_RGBA_239_68_68_0_05 : "";
        const statusBadge = isRevoked ? `${AdminRuntimeText.SPAN_CLASS_BADGE_REVOKED_STYLE_MARGIN_LEFT_0_5REM_FONT_SIZE_0_65R}${AdminMessages.REVOKED_BADGE}${AdminRuntimeText.SPAN}` : "";
        return `${AdminRuntimeText.TR_STYLE}${rowStyle}${AdminRuntimeText.TD_CLASS_TEXT_CENTER_SPAN_CLASS_BADGE}${badgeClass}${AdminRuntimeText.SYMBOL_AB2CD7}${escapeHTML(assigneeLabel)}${AdminRuntimeText.SPAN}${statusBadge}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE}${formatValue(geminiValue)}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE}${formatValue(cerebrasValue)}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE}${formatValue(groqValue)}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE}${formatValue(ai33Value)}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE_FONT_SIZE_}${escapeHTML(excludedValue)}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_DIV_STYLE_DISPLAY_FLEX_GAP_0_5REM_JUSTIFY}${AdminConstants.ACTION_EDIT_KEYS}${AdminRuntimeText.DATA_ID}${escapeHTML(keyId)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_EDIT}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_EDIT}${AdminRuntimeText.BUTTON_BUTTON_CLASS_ACTION_BTN_ACTION_DANGER_DATA_ACTION_F053F9}${AdminConstants.ACTION_DELETE_KEYS}${AdminRuntimeText.DATA_ID}${escapeHTML(keyId)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_DELETE}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_DELETE}${AdminRuntimeText.BUTTON_DIV_TD_TR}`;
      }),
      AdminConstants.EMPTY_STR,
    );
  } catch (e) {
    tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_KEYS, e.message);
  }
}
async function loadAccountsAdmin() {
  const tbody = elq(DOMIds.ACCS_TBODY);
  tbody.innerHTML = AdminTemplates.TABLE_LOADING(AdminConstants.COLSPAN_ACCOUNTS, AdminMessages.DATA_LOADING);
  const getAssignBadge = (assignee) => {
    if (_.isEqual(assignee, AdminConstants.ASSIGN_ALL)) return AdminClasses.BADGE_FREE;
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), assignee));
    if (plan) {
      return _.includes(_.toUpper(_.get(plan, ApiFields.NAME)), AdminConstants.PLAN_FREE) ? AdminClasses.BADGE_FREE : AdminClasses.BADGE_PRO;
    }
    return AdminClasses.BADGE_PRO;
  };
  const getAssignName = (assignee) => {
    if (_.isEqual(assignee, AdminConstants.ASSIGN_ALL)) return AdminMessages.ASSIGN_ALL_LABEL;
    const plans = _.get(window, AdminConstants.GLOBAL_PLANS, []);
    const plan = _.find(plans, (p) => _.isEqual(_.get(p, ApiFields.ID), assignee));
    if (plan) return formatPlanDisplayName(_.get(plan, ApiFields.NAME));
    return formatPlanDisplayName(assignee);
  };
  try {
    const res = await fetchAPI(AdminActions.GET_ACCOUNTS);
    const accs = _.get(res, ApiFields.ACCOUNTS, []);
    window[AdminConstants.GLOBAL_ACCOUNTS] = accs;
    tbody.innerHTML = _.join(
      _.map(accs, (a) => {
        const assignee = _.get(a, ApiFields.ASSIGNED_TO, AdminConstants.ASSIGN_ALL);
        const badgeClass = getAssignBadge(assignee);
        const status = normalizeStatus(_.get(a, ApiFields.STATUS));
        let statusBadge = "";
        if (_.isEqual(status, normalizeStatus(AdminConstants.ACCOUNT_STATUS_ACTIVE))) {
          statusBadge = `${AdminRuntimeText.SPAN_CLASS_BADGE_ACTIVE}${AdminMessages.STATUS_ACTIVE_LABEL}${AdminRuntimeText.SPAN}`;
        } else if (_.isEqual(status, AdminConstants.ACCOUNT_STATUS_ERROR)) {
          statusBadge = `${AdminRuntimeText.SPAN_CLASS_BADGE_EXPIRED}${AdminConstants.ACCOUNT_STATUS_ERROR}${AdminRuntimeText.SPAN}`;
        } else {
          statusBadge = `${AdminRuntimeText.SPAN_CLASS_BADGE_REVOKED}${AdminMessages.STATUS_REVOKED_LABEL}${AdminRuntimeText.SPAN}`;
        }
        const isRevoked = _.isEqual(status, AdminConstants.STATUS_REVOKED);
        const rowStyle = isRevoked ? AdminRuntimeText.OPACITY_0_5_BACKGROUND_RGBA_239_68_68_0_05 : "";
        return `${AdminRuntimeText.TR_STYLE}${rowStyle}${AdminRuntimeText.TD_STYLE_FONT_WEIGHT_600}${escapeHTML(_.get(a, ApiFields.EMAIL))}${AdminRuntimeText.TD_TD_STYLE_COLOR_VAR_TEXT_MUTED}${escapeHTML(_.get(a, ApiFields.RECOVERY_EMAIL) || AdminMessages.NO_DATA)}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER}${statusBadge}${AdminRuntimeText.TD_TD_CLASS_TEXT_CENTER_SPAN_CLASS_BADGE}${badgeClass}${AdminRuntimeText.SYMBOL_AB2CD7}${escapeHTML(getAssignName(_.get(a, ApiFields.ASSIGNED_TO)))}${AdminRuntimeText.SPAN_TD_TD_STYLE_COLOR_VAR_TEXT_MUTED_FONT_FAMILY_MONOSPACE}${_.get(a, ApiFields.PASSWORD) ? AdminMessages.PASSWORD_MASK : AdminConstants.EMPTY_STR}${AdminRuntimeText.TD_TD_DIV_CLASS_ACTIONS_CELL_STYLE_JUSTIFY_CONTENT_CENTER_DISPLAY}${AdminConstants.ACTION_EDIT_ACC}${AdminRuntimeText.DATA_ACCOUNT_ID_F5CE46}${_.get(a, ApiFields.ID)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_EDIT}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_EDIT}${AdminRuntimeText.BUTTON_BUTTON_CLASS_ACTION_BTN_ACTION_DANGER_DATA_ACTION_F053F9}${AdminConstants.ACTION_DELETE_ACC}${AdminRuntimeText.DATA_ACCOUNT_ID_F5CE46}${_.get(a, ApiFields.ID)}${AdminRuntimeText.TITLE}${AdminMessages.ACTION_MODAL_DELETE}${AdminRuntimeText.SYMBOL_AB2CD7}${AdminIcons.BTN_DELETE}${AdminRuntimeText.BUTTON_DIV_TD_TR}`;
      }),
      AdminConstants.EMPTY_STR,
    );
  } catch (e) {
    tbody.innerHTML = AdminTemplates.TABLE_ERROR(AdminConstants.COLSPAN_ACCOUNTS, e.message);
  }
}
async function updateAccStatus(id, status) {
  try {
    await fetchAPI(AdminActions.UPDATE_ACCOUNT_STATUS, { [ApiFields.ROW_INDEX]: id, [ApiFields.STATUS]: status });
    showToast(AdminMessages.UPDATE_STATUS_SUCCESS, ToastType.SUCCESS);
  } catch (e) {
    Logger.error(e);
    showToast(AdminMessages.SAVE_ERROR_USER, ToastType.ERROR);
  }
}
function init() {
  initEventListeners();
  if (_.every([adminToken, apiUrl], (val) => !_.isEmpty(val))) {
    showDashboard();
  }
}
init();
