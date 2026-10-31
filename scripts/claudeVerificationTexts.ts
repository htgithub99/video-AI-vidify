export const CLAUDE_VERIFICATION_TEXTS = {
  EMPTY: "",
  PROMPT: "#prompt",
  UPLOADER_FILE_PREVIEW: "uploader-file-preview",
  FULL_NAME: "#full-name",
  READY: "ready",
  PNG_BASE64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aEl8AAAAASUVORK5CYII=",
  BASE64: "base64",
  CHAT_EDITOR_HTML: '<div data-cds="ChatComposer"><div id="attachments"></div><div><input type="file" multiple hidden><div class="ProseMirror" data-testid="chat-input" contenteditable="true" role="textbox" style="min-height:40px"></div><button type="button" aria-label="Send message" disabled>Send</button></div></div>',
  CHAT_FIXTURE: (parts: { composer: string; notice: string; uploadMenu: string; filename: string; removePreview: string; staleAttachment: string; delayedEditor: string; response: string }): string => `<!doctype html><body>
  <div data-message-id="old-message"><div class="font-claude-response">{"artifactType":"claude_test","requestId":"old","scenes":[{"id":"scene-1"}]}</div></div>
  ${parts.composer}
  ${parts.notice}
  <script>
    window.sent = 0;
    window.sentAt = 0;
    document.addEventListener('input', () => { document.querySelector('button[aria-label="Send message"]').disabled = !document.querySelector('[contenteditable]').innerText.trim(); });
    ${parts.uploadMenu}
    document.addEventListener('change', async (event) => {
      if (event.target.type !== 'file') return;
      for (const file of event.target.files) {
        const chip = document.createElement('div');
        chip.dataset.testid = 'attachment';
        chip.dataset.state = 'uploading';
        chip.textContent = ${parts.filename};
        if (file.type.startsWith('image/')) { const image = document.createElement('img'); image.src = URL.createObjectURL(file); image.style.cssText='width:32px;height:32px'; chip.append(image); }
        const progress = document.createElement('div'); progress.setAttribute('role', 'progressbar'); progress.textContent = 'Uploading'; chip.append(progress);
        const remove = document.createElement('button'); remove.type='button'; remove.setAttribute('aria-label', 'Remove file'); remove.textContent='Remove'; remove.onclick = () => chip.remove(); chip.append(remove);
        document.querySelector('#attachments').append(chip);
        const body = new FormData(); body.append('file', file);
        const response = await fetch('/api/upload-file', {method:'POST', body});
        progress.remove(); chip.dataset.state = response.ok ? 'ready' : 'error';
        ${parts.removePreview}
      }
    });
    ${parts.staleAttachment}
    ${parts.delayedEditor}
    document.addEventListener('click', (event) => {
      if (!event.target.closest('button[aria-label="Send message"]')) return;
      const input = document.querySelector('[contenteditable]');
      const requestId = input.innerText.match(/Request ID: ([\\w-]+)/)[1];
      input.innerText = '';
      window.sent++;
      window.sentAt = Date.now();
      window.sentAttachmentCount = document.querySelector('#attachments').children.length;
      document.querySelector('#attachments').replaceChildren();
      const response = document.createElement('div');
      response.dataset.messageId = 'new-' + window.sent;
      response.dataset.isStreaming = 'true';
      response.innerHTML = '<div class="font-claude-response">Thinking…</div>';
      document.body.append(response);
      ${parts.response}
    });
  </script></body>`,
  LOGIN: "login",
  VISIBLE_LOGIN: "visible-login",
  LOGIN_HTML: "<p>Log in to Claude</p>",
  MENU_UPLOAD: "menu-upload",
  INPUT_TYPE_FILE_MULTIPLE_HIDDEN: '<input type="file" multiple hidden>',
  ATTACH_BUTTON_HTML: '<button type="button" aria-label="Add files or photos">Attach</button>',
  LIMITED: "limited",
  RATE_LIMIT_HTML: '<div role="alert">You’ve reached your usage limit</div>',
  UPLOAD_MENU_SCRIPT:
    "document.querySelector('button[aria-label=\"Add files or photos\"]').onclick = () => {\n      const overlay = document.createElement('div'); overlay.id='upload-menu-overlay'; overlay.style.cssText='position:fixed;inset:0;z-index:9999';\n      document.body.append(overlay);\n      document.addEventListener('keydown', event => { if (event.key === 'Escape') overlay.remove(); });\n      const menu = document.createElement('button'); menu.type='button'; menu.setAttribute('role','menuitem'); menu.textContent='Upload files';\n      menu.onclick = () => { const input = document.createElement('input'); input.type='file'; input.multiple=true; input.hidden=true; document.body.append(input); input.click(); };\n      overlay.append(menu);\n    };",
  WRONG_FILENAME: "wrong-filename",
  OTHER_FILE_TXT: "'other-file.txt'",
  FILE_NAME: "file.name",
  MISSING_PREVIEW: "missing-preview",
  CHIP_REMOVE: "chip.remove();",
  STALE_UPLOAD: "stale-upload",
  STALE_ATTACHMENT_SCRIPT: "document.querySelector('#attachments').innerHTML = '<div data-testid=attachment>stale.png<button type=button aria-label=\"Remove file\" onclick=\"this.parentElement.remove()\">Remove</button></div>';",
  DELAYED_EDITOR_SCRIPT: (value0: unknown): string => `setTimeout(() => document.body.insertAdjacentHTML('beforeend', ${value0}), 650);`,
  PENDING: "pending",
  STREAMED_RESPONSE_SCRIPT: (value0: unknown, value1: unknown): string => `setTimeout(() => {
        response.firstChild.textContent = JSON.stringify({artifactType: 'claude_test', requestId, scenes: [{id: 'scene-1', narration: 'A complete response from the current request.'}]});
        ${value0}
        ${value1}
        response.dataset.isStreaming = 'false';
      }, 90);`,
  INVALID_JSON: "invalid-json",
  INVALID_RESPONSE_SCRIPT: "response.firstChild.textContent = 'This response contains no parseable JSON value.';",
  CODE_ARRAY: "code-array",
  ARRAY_RESPONSE_SCRIPT: 'response.firstChild.innerHTML = \'<p>JSON response</p><pre><code>[{"id":"one"},{"id":"two"}]</code></pre>\';',
  HTTPS_CLAUDE_AI: "https://claude.ai/**",
  API_UPLOAD_FILE: "/api/upload-file",
  UPLOAD_FAILED: "upload-failed",
  APPLICATION_JSON: "application/json",
  SYMBOL: "{}",
  TEXT_HTML: "text/html",
  FIXTURE_EXAMPLE_TEST: "fixture@example.test",
  SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS: "src/server/services/chatUiPlanningService.ts",
  NODE: "node",
  ESM: "esm",
  EXTERNAL: "external",
  ISOLATED_CLAUDE_BROWSER: "isolated-claude-browser",
  FIXTURE_BROWSER: "fixture-browser",
  FIXTURE: "fixture",
  BROWSER_SERVICE_FIXTURE:
    "\n        export const getOrLaunchGlobalBrowser = async () => globalThis.__claudeFixture;\n        export const getOrLaunchGrokBrowser = getOrLaunchGlobalBrowser;\n        export const scheduleGlobalBrowserCleanup = () => {};\n        export const retainGlobalBrowser = () => () => {};\n        export const closeAppBrowserAfterTask = async () => true;\n        export const closeIdleSharedChrome = async () => true;\n        export const closeOwnedGrokBrowserIfIdle = async () => true;\n        export class SimpleMutex { tail = Promise.resolve(); async acquire() { const previous = this.tail; let release; this.tail = new Promise(resolve => release = resolve); await previous; return release; } }\n      ",
  JS: "js",
  UTF8: "utf8",
  CONFIG_NUMBER_PATTERN: (value0: unknown): string => `\\b${value0}: \\d+`,
  CONFIG_NUMBER_OVERRIDE: (value0: unknown, value1: unknown): string => `${value0}: ${value1}`,
  TS: "ts",
  FIXTURE_DIAGNOSTICS: "fixture-diagnostics",
  DIAGNOSTICS: "diagnostics",
  DIAGNOSTICS_SERVICE_FIXTURE: "export const writeMusicDiagnostic = async () => {}; export const musicErrorDetails = () => ({}); export const musicUploadDetails = () => ({});",
  SERVICE_BUNDLE_PATH: (value0: unknown): string => `node_modules/.cache/verify-claude-service-${value0}.mjs`,
  FORMAT_RUN: (value0: unknown): string => `?run=${value0}`,
  CLAUDE_TEST: "claude_test",
  SCENE_1: "scene-1",
  FORMAT_WRITE_THE_SCENE_REQUEST_ID: (value0: unknown): string => `Write the scene. Request ID: ${value0}`,
  PROJECT_A: "project-a",
  FIRST: "first",
  HTTPS_CLAUDE_AI_NEW: "https://claude.ai/new",
  SECOND: "second",
  DO_NOT_REUSE_AN_OLD_RESPONSE: "Do not reuse an old response",
  REUSE_THE_CURRENT_PROJECT_ROOM: "Reuse the current project room",
  PROJECT_B: "project-b",
  THIRD: "third",
  PROJECTS_MUST_GET_DISTINCT_ROOMS: "Projects must get distinct rooms",
  A_CLAUDE_ROOM_KEEPS_THE_BROWSER_ACTIVE: "A Claude room keeps the browser active",
  VISIBLE: "visible",
  ONE: "one",
  TWO: "two",
  READ_EXACT_JSON_FROM_CLAUDE_S_CODE_BLOCK_INCLUDING_TOP_LEVEL_ARRAYS: "Read exact JSON from Claude's code block, including top-level arrays",
  IMAGE: "image",
  SAMPLE_PNG: "sample.png",
  IMAGE_PNG: "image/png",
  UPLOAD_THE_EXACT_IMAGE_BYTES: "Upload the exact image bytes",
  NEVER_SUBMIT_WHILE_UPLOAD_IS_PENDING: "Never submit while upload is pending",
  IMAGE_FIXTURE_PATH: (value0: unknown): string => `node_modules/.cache/claude-test-image-${value0}.png`,
  LOCAL: "local",
  LOCAL_PNG: "local.png",
  MULTI: "multi",
  ANH_MAU_PNG: "ảnh-mẫu.png",
  SEND_ALL_LOCAL_PATH_AND_BUFFERED_ATTACHMENTS: "Send all local-path and buffered attachments",
  STALE_TEXT_ONLY: "stale-text-only",
  CLEAR_AN_INHERITED_DRAFT_ATTACHMENT_EVEN_FOR_TEXT_ONLY_REQUESTS: "Clear an inherited draft attachment even for text-only requests",
  MENU: "menu",
  OPEN_THE_ATTACHMENT_MENU_AND_USE_THE_NATIVE_FILE_CHOOSER: "Open the attachment menu and use the native file chooser",
  DOCUMENT: "document",
  NOTES_TXT: "notes.txt",
  TEXT_PLAIN: "text/plain",
  CLAUDE_UPLOAD_TEST_DOCUMENT: "Claude upload test document",
  UPLOAD_FAILURE_TEST: "Upload failure test",
  FORMAT_MUST_BLOCK_SENDING: (value0: unknown): string => `${value0} must block sending`,
  UPLOAD_CANCEL: "upload-cancel",
  ROLE_PROGRESSBAR: '[role="progressbar"]',
  CLOSE: "close",
  CANCEL_AN_UPLOAD_WITHOUT_SUBMITTING: "Cancel an upload without submitting",
  CANCEL: "cancel",
  CANCELLATION_CLOSES_ONLY_THE_TASK_ROOM: "Cancellation closes only the task room",
  SETTINGS_UI_FIXTURE:
    "\n        import React, { useState } from 'react';\n        import { createRoot } from 'react-dom/client';\n        import Settings from './src/components/common/ChatPlanningSettingsBlock';\n        function Fixture() {\n          const [provider, setProvider] = useState('grok-chat');\n          const [model, setModel] = useState('grok-expert');\n          const [mode, setMode] = useState('room-only');\n          const [headless, setHeadless] = useState(false);\n          return <><Settings provider={provider} model={model} executionMode={mode} chromeHeadless={headless}\n            onProviderChange={setProvider} onModelChange={setModel} onExecutionModeChange={setMode} onChromeHeadlessChange={setHeadless} />\n            <output>{provider}:{model}:{mode}</output></>;\n        }\n        createRoot(document.getElementById('root')).render(<Fixture />);\n      ",
  TSX: "tsx",
  BROWSER: "browser",
  IIFE: "iife",
  AUTOMATIC: "automatic",
  DIV_ID_ROOT_DIV: '<div id="root"></div>',
  SELECT: "select",
  OUTPUT: "output",
  CLAUDE_CHAT_CLAUDE_AUTO_ROOM_ONLY: "claude-chat:claude-auto:room-only",
  BODY: "body",
  CLAUDE_HIEN_TRINH_DUYET: "Claude • Hiện trình duyệt",
  MOI_DU_AN_DUNG_PHONG_RIENG: "mỗi dự án dùng phòng riêng",
  OPTION: "option",
  INCLUDE_ALL_13_DISCOVERED_MODELS_AND_THE_CURRENT_MODEL_DEFAULT: "Include all 13 discovered models and the current-model default",
  COMBOBOX: "combobox",
  MUC_DO_NO_LUC: "Mức độ nỗ lực",
  HIGH: "high",
  CLAUDE_CHAT_CLAUDE_HAIKU_5_5_HIGH_ROOM_ONLY: "claude-chat:claude-haiku-5-5::high:room-only",
  CARRY_A_SUPPORTED_EFFORT_TO_A_DIFFERENT_CLAUDE_MODEL: "Carry a supported effort to a different Claude model",
  OPTION_VALUE_XHIGH: 'option[value="xhigh"]',
  DO_NOT_OFFER_UNSUPPORTED_LEGACY_EFFORT_LEVELS: "Do not offer unsupported legacy effort levels",
  CLAUDE_CHAT_CLAUDE_HAIKU_4_5_20251001_ROOM_ONLY: "claude-chat:claude-haiku-4-5-20251001:room-only",
  HIDE_EFFORT_WHEN_THE_MODEL_HAS_NO_NUMERIC_EFFORT_MENU: "Hide effort when the model has no numeric effort menu",
  GEMINI_CHAT_GEMINI_FLASH_LITE_ROOM_ONLY: "gemini-chat:gemini-flash-lite:room-only",
  CLAUDE_CHAT_ROUTING_NEW_ROOMS_REUSE_FRESH_STREAMED_JSON_LOGIN_LIMITS_AND_CAN: "Claude chat: routing, new rooms, reuse, fresh streamed JSON, login, limits and cancellation passed.\n",
  AI_SETTINGS_CLAUDE_SELECTION_MODEL_RESET_BADGE_LOGIN_GUIDANCE_AND_API_MODE_P: "AI settings: Claude selection, model reset, badge, login guidance and API mode passed.\n",
  CLAUDE_ATTACHMENTS_PNG_BYTES_LOCAL_FILES_MULTIPLE_IMAGES_UPLOAD_MENU_FILE_CH: "Claude attachments: PNG bytes, local files, multiple images, upload menu/file chooser, text documents, stale previews, slow uploads, failures, missing previews, wrong filenames and upload cancellation passed.\n",
  PRESERVE_THE_MODEL_AND_EFFORT_WHEN_RELOADING_A_PROJECT: "Preserve the model and effort when reloading a project",
  INVALID_AUTO_EFFORT: "claude-auto::low",
  CLAUDE_UNKNOWN: "claude-unknown",
  CLAUDE_SONNET_5_5_UNKNOWN: "claude-sonnet-5-5::unknown",
  CLAUDE_SONNET_5_5_LOW_MAX: "claude-sonnet-5-5::low::max",
  CLAUDE_SONNET_4_6_XHIGH: "claude-sonnet-4-6::xhigh",
  EFFORT_MENU_LABELS: ["Effort level", "Effort", "Mức độ nỗ lực", "Mức nỗ lực"],
  MODEL_MENU_FIXTURE: (models: string, mode: string, effortMenu = "Effort level", effortIds = true): string => `<button data-testid="model-selector-dropdown">Sonnet 5.5 Medium</button><div id="menus"></div><script>(()=>{
  const models = ${models};
  window.current = 'claude-sonnet-5-5'; window.effort = 'medium'; window.modelClicks = 0; window.upgradeClicks = 0;
  const host = document.querySelector('#menus'); const picker = document.querySelector('button');
  function update() { picker.textContent = models.find(m => m.value === window.current).label + ' ' + window.effort; }
  function modelItem(m) {
    const item = document.createElement('div'); item.dataset.modelId = m.value;
    const locked = ${mode} === 'locked' && /Opus|Fable/.test(m.label);
    item.setAttribute('role', locked ? 'menuitem' : 'menuitemradio'); item.tabIndex=0;
    item.setAttribute('aria-checked', String(window.current === m.value)); item.textContent=m.label + (locked ? ' Upgrade' : '');
    if (${mode} === 'disabled' && m.value === 'claude-haiku-5-5') item.setAttribute('data-disabled', '');
    item.onclick=()=>{if(locked){window.upgradeClicks++;return;} window.modelClicks++; if(${mode}!=='ignore-model')window.current=m.value;update();host.replaceChildren();};return item;
  }
  function menu() {
    host.replaceChildren();const main=document.createElement('div');main.setAttribute('role','menu');host.append(main);
    for(const m of models.slice(0,4))main.append(modelItem(m));
    const more=document.createElement('div');more.setAttribute('role','menuitem');more.setAttribute('aria-haspopup','menu');more.setAttribute('aria-expanded','false');more.tabIndex=0;more.textContent='More models';
    more.onmouseenter=()=>{more.setAttribute('aria-expanded','true');if(host.querySelector('#other'))return;const sub=document.createElement('div');sub.id='other';sub.setAttribute('role','menu');for(const m of models.slice(4))if(!(${mode}==='missing'&&m.value==='claude-sonnet-5'))sub.append(modelItem(m));host.append(sub);};main.append(more);
    const effort=document.createElement('div');effort.setAttribute('role','menuitem');effort.setAttribute('aria-haspopup','menu');effort.setAttribute('aria-expanded','false');effort.tabIndex=0;effort.innerHTML='<span>'+${JSON.stringify(effortMenu)}+'</span> <span>'+window.effort+'</span>';
    effort.onmouseenter=()=>{effort.setAttribute('aria-expanded','true');if(host.querySelector('#efforts'))return;const sub=document.createElement('div');sub.id='efforts';sub.setAttribute('role','menu');for(const e of models.find(m=>m.value===window.current).efforts){if(${mode}==='missing-effort'&&e==='low')continue;const item=document.createElement('div');item.setAttribute('role','menuitemradio');if(${effortIds})item.dataset.effortId=e;item.setAttribute('aria-checked',String(window.effort===e));item.textContent=(${JSON.stringify(effortMenu)}.startsWith('Mức')?{low:'Thấp',medium:'Trung bình Được đề xuất',high:'Cao',xhigh:'Cao hơn',max:'Tối đa Mức sử dụng gấp 5× trở lên'}:{low:'Low',medium:'Medium Recommended',high:'High',xhigh:'Higher',max:'Max Usage 5×'})[e];if(e==='low'&&${mode}==='disabled-effort')item.setAttribute('data-disabled','');if(e==='low'&&${mode}==='aria-disabled-effort')item.setAttribute('aria-disabled','true');item.onclick=()=>{if(${mode}!=='ignore-effort')window.effort=e;update();host.replaceChildren();};sub.append(item);}host.append(sub);};if(${mode}!=='missing-effort-menu')main.append(effort);
  }
  picker.onclick=menu; document.addEventListener('keydown',e=>{if(e.key==='Escape')host.replaceChildren();});
  })();</script>`,
  BUTTON: "button",
  LOCKED: "locked",
  DISABLED: "disabled",
  MISSING: "missing",
  IGNORE_MODEL: "ignore-model",
  IGNORE_EFFORT: "ignore-effort",
  MISSING_EFFORT_MENU: "missing-effort-menu",
  MISSING_EFFORT: "missing-effort",
  DISABLED_EFFORT: "disabled-effort",
  ARIA_DISABLED_EFFORT: "aria-disabled-effort",
  ROLE_MENU: '[role="menu"]',
  ALWAYS_DISMISS_MODEL_MENUS_ON_FAILURE: "Always dismiss model menus on failure",
  NEVER_CLICK_UPGRADE_INSTEAD_OF_SELECTING_A_MODEL: "Never click upgrade instead of selecting a model",
  CLAUDE_MODELS_ALL_13_MODEL_SELECTIONS_SUPPORTED_EFFORT_LEVELS_EXACT_VERSION: "Claude models: all 13 models, effort levels, both Vietnamese menu labels and English labels, data IDs/name fallback, exact versions, project persistence, locked/disabled/missing options, ignored selections and cancellation passed.\n",
} as const;
