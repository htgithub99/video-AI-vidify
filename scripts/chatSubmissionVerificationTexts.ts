export const CHAT_SUBMISSION_VERIFICATION = {
  ENTRY: 'export { submitPrompt }; export { CINEMATIC_CHAT_PLANNING_CONFIG as config } from "../../constants/cinematicConstants.js";',
  SOURCE: "src/server/services/chatUiPlanningService.ts",
  SOURCE_PATTERN: /chatUiPlanningService\.ts$/,
  PLUGIN: "isolated-chat-submission",
  CLICK: "await clickSendButton(page, sendButton, signal);",
  INJECT: "await clickSendButton(page, sendButton, signal); if (globalThis.__chatSubmissionFail) throw new Error('injected-after-send');",
  FAIL: "injected-after-send",
  BUNDLE: (pid: number) => `node_modules/.cache/chat-submission-${pid}.mjs`,
  STORAGE: (pid: number) => `scratch/chat-submission-${pid}`,
  INPUT: "textarea",
  SEND: "button",
  RESPONSE: ".answer",
  BUSY: ".busy",
  COUNTER: "window.sendCount",
  ROOM: "submission-fixture",
  ARTIFACT: "motion-puppet-character",
  REQUEST: "submission-current",
  OLD: "submission-previous",
  PROMPT: 'Return JSON with artifactType "motion-puppet-character" and requestId "submission-current".',
  DOCUMENT: `<textarea></textarea><button>Send</button><div class="answer"></div><script>
    window.sendCount = 0;
    document.querySelector('button').onclick = () => { window.sendCount++; };
  </script>`,
  NETWORK: "**/*",
  EMPTY: "",
  CANCELLED: /cancelled/i,
  PASSED: "Real chat submission passed: one click after uncertain send, read-only resume, delayed response with retained composer, stale response rejection and closed-page protection. No external requests.\n",
} as const;
