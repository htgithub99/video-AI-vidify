export const DEEPSEEK_ACCOUNT_VERIFICATION = {
  SUSPENDED: "suspended",
  SUSPENDED_AFTER_SEND: "suspended-after-send",
  NOTICE: "Due to violation of user policies, your account has been suspended until November 3, 2026 01:35. If you have any questions, please Contact us.",
  BANNER: '<div style="border:1px solid orange">Due to violation of user policies, your account has been suspended until November 3, 2026 01:35. If you have any questions, please <a>Contact us.</a></div>',
  APPEND_BANNER: "}else if(mode==='suspended-after-send'){const banner=document.createElement('div');banner.textContent='Due to violation of user policies, your account has been suspended until November 3, 2026 01:35.';document.body.append(banner);}else respond();",
  RESPOND_BRANCH: "}else respond();",
  CONTENT: '<div class="ds-message"><div class="ds-collapsible-text"></div></div><div class="ds-assistant-message-main-content"></div><textarea></textarea><div hidden></div>',
  CONTENT_NODES: ".ds-collapsible-text, .ds-assistant-message-main-content, textarea, [hidden]",
  NO_RETRY: "Suspended account must fail immediately without reloading, resuming, or resending",
  NO_WAIT: "Known unavailable account must fail without waiting for the suspension to expire",
} as const;
