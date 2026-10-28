(function () {
  function updateKPICards() {
    const users = _.get(window, AdminConstants.GLOBAL_USERS, []);
    const totalUsers = _.size(users);
    const activeUsers = _.size(_.filter(users, (u) => _.isEqual(_.get(u, AdminRuntimeText.STATUS), AdminConstants.STATUS_ACTIVE)));
    const premiumUsers = _.size(
      _.filter(users, (u) => {
        const plan = _.find(_.get(window, AdminConstants.GLOBAL_PLANS, []), (p) => _.isEqual(_.get(p, AdminRuntimeText.ID), _.get(u, AdminRuntimeText.PLAN_ID)));
        if (!plan) return false;
        const planNameUpper = _.toUpper(_.get(plan, AdminRuntimeText.NAME));
        return _.some([AdminConstants.PLAN_PRO, AdminConstants.PLAN_VIP, AdminConstants.PLAN_LIFETIME], (key) => _.includes(planNameUpper, key));
      }),
    );
    const apiKeys = _.get(window, AdminConstants.GLOBAL_API_KEYS, []);
    const totalKeys = _.size(apiKeys);
    const accounts = _.get(window, AdminConstants.GLOBAL_ACCOUNTS, []);
    const totalAccounts = _.size(accounts);
    const elTotalLicenses = document.getElementById(AdminRuntimeText.KPI_TOTAL_LICENSES);
    const elActiveLicenses = document.getElementById(AdminRuntimeText.KPI_ACTIVE_LICENSES);
    const elTotalKeys = document.getElementById(AdminRuntimeText.KPI_TOTAL_KEYS);
    const elTotalAccounts = document.getElementById(AdminRuntimeText.KPI_TOTAL_ACCOUNTS);
    const elPremiumUsers = document.getElementById(AdminRuntimeText.KPI_PREMIUM_USERS);
    if (elTotalLicenses) elTotalLicenses.textContent = totalUsers;
    if (elActiveLicenses) elActiveLicenses.textContent = activeUsers;
    if (elTotalKeys) elTotalKeys.textContent = totalKeys;
    if (elTotalAccounts) elTotalAccounts.textContent = totalAccounts;
    if (elPremiumUsers) elPremiumUsers.textContent = premiumUsers;
  }
  const observer = new MutationObserver(() => {
    updateKPICards();
  });
  document.addEventListener(AdminRuntimeText.DOMCONTENTLOADED, () => {
    const checkTableInterval = setInterval(() => {
      const targetTableBody = document.querySelector(AdminRuntimeText.USERS_TABLE_TBODY);
      if (targetTableBody) {
        clearInterval(checkTableInterval);
        observer.observe(targetTableBody, { childList: true });
        updateKPICards();
      }
    }, 500);
    document.addEventListener(AdminRuntimeText.CLICK, (e) => {
      if (e.target.closest(AdminRuntimeText.NAV_TAB_BTN) || e.target.closest(AdminRuntimeText.SUB_TAB_BTN) || e.target.closest(AdminRuntimeText.BUTTON_C3E2D7)) {
        setTimeout(updateKPICards, 150);
      }
    });
    const origSwitchPage = window.switchAdminPage;
    if (origSwitchPage) {
      window.switchAdminPage = function (pageId) {
        origSwitchPage(pageId);
        const titleMap = { [AdminConstants.PAGE_USERS]: AdminRuntimeText.NGUOI_DUNG, [AdminConstants.PAGE_RESOURCES]: AdminRuntimeText.TAI_NGUYEN, [AdminConstants.PAGE_CONFIG]: AdminRuntimeText.CAU_HINH_9DFC0B };
        const elTitle = document.getElementById(AdminRuntimeText.HEADER_PAGE_TITLE);
        if (elTitle && _.has(titleMap, pageId)) {
          elTitle.textContent = _.get(titleMap, pageId);
        }
        updateKPICards();
      };
    }
  });
})();
