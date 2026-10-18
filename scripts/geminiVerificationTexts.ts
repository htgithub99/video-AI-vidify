export const GEMINI_VERIFICATION_TEXTS = {
  RELOAD_PRESERVES_GEMINI_MODEL_AND_THINKING_LEVEL: "Reload preserves Gemini model and thinking level",
  GEMINI_ARGON_MAX: "gemini-argon::max",
  GEMINI_UNKNOWN_LOW: "gemini-unknown::low",
  GEMINI_ARGON_HIGH_LOW: "gemini-argon::high::low",
  GEMINI_ARGON: "gemini-argon::",
  GEMINI_DEEP_THINK_HIGH: "gemini-deep-think::high",
  CLAUDE_AUTO_LOW: "claude-auto::low",
  CHROME: "chrome",
  READY: "ready",
  THINKING_LEVEL: "Thinking level",
  THINKING_LABEL: "Cấp độ tư duy",
  SELECTED: "Selected",
  DA_CHON: "Đã chọn",
  LOW: "low",
  RECOGNIZE_THE_ALREADY_SELECTED_DA_CHON_THAP_MENU_ITEM: "Recognize the already-selected Đã chọn Thấp menu item",
  HIGH: "high",
  MEDIUM: "medium",
  VERIFY_A_SELECTION_AFTER_GEMINI_ADDS_ITS_SELECTED_ICON_ACCESSIBLE_LABEL: "Verify a selection after Gemini adds its selected-icon accessible label",
  MENU: "menu",
  CLOSE_THE_PICKER_AFTER_VERIFICATION: "Close the picker after verification",
  MISSING: "missing",
  DISABLED: "disabled",
  IGNORE_LEVEL: "ignore-level",
  IGNORE_MODEL: "ignore-model",
  PATTERN_GEMINI_THINKING_UNAVAILABLE: /gemini_thinking_unavailable/,
  CLOSE_THE_PICKER_AFTER_FAILURE: "Close the picker after failure",
  PATTERN_CHAT_PLANNING_CANCELLED: /chat_planning_cancelled/,
  UI_ENTRY:
    "\n        import React, { useState } from 'react';\n        import { createRoot } from 'react-dom/client';\n        import Settings from './src/components/common/ChatPlanningSettingsBlock';\n        function Fixture() {\n          const [provider, setProvider] = useState('gemini-chat');\n          const [model, setModel] = useState(() => localStorage.getItem('gemini-test-model') || 'gemini-argon');\n          const [mode, setMode] = useState('room-only');\n          const saveModel = value => { localStorage.setItem('gemini-test-model', value); setModel(value); };\n          return <><Settings provider={provider} model={model} executionMode={mode} chromeHeadless={false}\n            onProviderChange={setProvider} onModelChange={saveModel} onExecutionModeChange={setMode} onChromeHeadlessChange={() => {}} />\n            <output>{model}</output></>;\n        }\n        createRoot(document.getElementById('root')).render(<Fixture />);\n      ",
  TSX: "tsx",
  BROWSER: "browser",
  IIFE: "iife",
  AUTOMATIC: "automatic",
  EMPTY: "{}",
  SETTINGS_ROUTE: "http://gemini-settings.test/**",
  TEXT_HTML: "text/html",
  ROOT_HTML: '<div id="root"></div>',
  SETTINGS_URL: "http://gemini-settings.test/",
  COMBOBOX: "combobox",
  MODEL_LABEL: "Mô hình",
  OPTION: "option",
  THEO_GEMINI: "Theo Gemini",
  THAP: "Thấp",
  TRUNG_BINH: "Trung bình",
  CAO: "Cao",
  OUTPUT: "output",
  GEMINI_ARGON_HIGH: "gemini-argon::high",
  KEEP_THE_LEVEL_WHEN_CHANGING_THE_BASE_MODEL: "Keep the level when changing the base model",
  GEMINI_PRO_HIGH: "gemini-pro::high",
  RELOAD_RESTORES_THE_LEVEL_WITHOUT_RESETTING_THE_MODEL: "Reload restores the level without resetting the model",
  EMPTY_2: "",
  GEMINI_PRO: "gemini-pro",
  PRESERVE_LEGACY_DEEP_THINK_WITHOUT_CONFLICTING_NUMERIC_LEVELS: "Preserve legacy Deep Think without conflicting numeric levels",
  SELECT: "select",
  OTHER_PROVIDERS_DO_NOT_SHOW_GEMINI_THINKING_CONTROLS: "Other providers do not show Gemini thinking controls",
  SRC_SERVER_SERVICES_MOTIONSTORYSERVICE_TS: "src/server/services/motionStoryService.ts",
  NODE: "node",
  ESM: "esm",
  EXTERNAL: "external",
  ISOLATED_GEMINI_ROOM: "isolated-gemini-room",
  PATTERN_CHATUIPLANNINGSERVICE_JS: /chatUiPlanningService\.js$/,
  ROOM: "room",
  GEMINI_TEST: "gemini-test",
  PATTERN_EMPTY: /.*/,
  JS: "js",
  ROOM_STUB:
    "\n        export const beginChatPlanningRun = () => ({signal: new AbortController().signal, complete() {}, cancel() {}});\n        export const closeChatBrowserIfIdle = async () => true;\n        export const closeChatPlanningRoom = async () => {};\n        export const prepareChatPlanningRoom = async request => globalThis.__geminiRoomTest.calls.push({stage: 'prepare', model: request.model});\n        export const generatePlanningWithChatUi = async request => {\n          globalThis.__geminiRoomTest.calls.push({stage: 'send', model: request.model});\n          if (globalThis.__geminiRoomTest.fail) throw new Error('gemini_thinking_unavailable');\n          return {text: '{\"ok\":true}', provider: request.provider};\n        };\n      ",
  SCRATCH: "scratch",
  GEMINI_THINKING_TEST: "gemini-thinking-test",
  TEST: "test",
  PREPARE: "prepare",
  SEND: "send",
  MOTION_PRESERVES_THE_SELECTED_LEVEL_THROUGH_PREPARE_AND_SEND: "Motion preserves the selected level through prepare and send",
  AN_UNAVAILABLE_EXPLICIT_LEVEL_MUST_NOT_FALL_BACK_TO_ANOTHER_MODEL_OR_API: "An unavailable explicit level must not fall back to another model or API",
  PASSED: "Gemini thinking passed: low/medium/high UI, persistence, routing, legacy compatibility, verified browser selection in Vietnamese/English and unavailable-level failures.\n",
} as const;
export const GEMINI_VERIFICATION_FORMATS = {
  PICKER_HTML: (mode: unknown, models: unknown, choices: unknown, materialMenu: unknown, thinkingLabel: unknown, selectedLabel: unknown): string => `
    <button data-test-id="bard-mode-menu-button" aria-expanded="false" onclick="toggleMenu()">4 Argon</button>
    <div role="menu" id="menu" hidden></div>
    <div role="menu" id="levels" hidden></div>
    <script>
      (() => {
      window.mode = ${mode}; window.current = 'gemini-argon'; window.level = 'low';
      const models = ${models};
      const choices = ${choices};
      const button = document.querySelector('button');
      const menu = document.getElementById('menu'), levels = document.getElementById('levels');
      const materialMenu = ${materialMenu};
      function hide() { menu.hidden = true; levels.hidden = true; button.setAttribute('aria-expanded', 'false'); }
      function toggleMenu() {
        const open = menu.hidden; hide(); if (!open) return;
        menu.hidden = false; button.setAttribute('aria-expanded', 'true');
        menu.innerHTML = models.map(model => '<div role="menuitemradio" tabindex="0" data-model="' + model.value + '">' + model.label + '</div>').join('')
          + (mode === 'missing' ? '' : '<div role="menuitem" tabindex="0" id="thinking">${thinkingLabel}</div>');
        menu.querySelectorAll('[data-model]').forEach(item => item.onclick = () => {
          if (mode !== 'ignore-model') { window.current = item.dataset.model; button.textContent = item.textContent; }
          hide();
        });
        const trigger = document.getElementById('thinking');
        if (trigger) { trigger.onmouseenter = showLevels; trigger.onclick = showLevels; }
      }
      function showLevels() {
        levels.hidden = false;
        levels.innerHTML = choices.map(choice => {
          const selected = window.level === choice.value;
          const marker = selected && materialMenu ? '<gem-icon aria-label="${selectedLabel}"><mat-icon aria-hidden="true" style="display:inline-block;width:12px;height:12px" data-mat-icon-name="check" fonticon="check"></mat-icon></gem-icon> ' : '';
          return '<div role="' + (materialMenu ? 'menuitem' : 'menuitemradio') + '" tabindex="0" '
            + (materialMenu ? 'class="' + (selected ? 'selected' : '') + '"' : 'aria-checked="' + selected + '"')
            + ' aria-disabled="' + (mode === 'disabled') + '" data-level="' + choice.value + '">' + marker + choice.label + '<span> Description</span></div>';
        }).join('');
        levels.querySelectorAll('[data-level]').forEach(item => item.onclick = () => {
          if (mode !== 'ignore-level' && mode !== 'disabled') window.level = item.dataset.level;
          hide();
        });
      }
      document.onkeydown = event => { if (event.key === 'Escape') hide(); };
      window.toggleMenu = toggleMenu;
      })();
    </script>
  `,
  MOTION_BUNDLE_PATH: (pid: unknown): string => `scratch/gemini-motion-test-${pid}.mjs`,
} as const;
