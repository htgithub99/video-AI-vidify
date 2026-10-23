export const MOTION_AI_RECOVERY_VERIFICATION = {
  ENTRY: 'export * from "./src/server/services/motionStoryService.ts"; export * from "./src/server/services/motionStoryJobService.ts"; export { MOTION_STORY_CONFIG } from "./src/constants/motionVideo.ts";',
  CHAT_IMPORT: /chatUiPlanningService\.js$/,
  GEMINI_IMPORT: /geminiService\.js$/,
  ALL: /.*/,
  NAMESPACE: "motion-recovery-offline",
  CHAT: "chat",
  API: "api",
  PLUGIN: "isolated-motion-room-recovery",
  CHAT_STUB: `
    const f = globalThis.__motionAiRecovery;
    export const beginChatPlanningRun = () => ({signal: new AbortController().signal, complete() {}});
    export const closeChatBrowserIfIdle = async () => true;
    export const closeChatPlanningRoom = async request => { f.closed.push(request); };
    export const closeChatPlanningRoomsForProject = async () => {};
    export const prepareChatPlanningRoom = async request => { f.prepared.push(request); await f.prepare(request); };
    export const generatePlanningWithChatUi = async request => { f.sent.push(request); return await f.send(request); };
    export const resumeChatPlanningResponse = async request => { f.resumed.push(request); return await f.resume(request); };
  `,
  API_STUB: "export const generateContentWithRetry = async () => { globalThis.__motionAiRecovery.apiCalls++; throw new Error('unexpected-live-api-call'); };",
  BUNDLE: (pid: number) => `node_modules/.cache/motion-ai-recovery-${pid}.mjs`,
  STORAGE: (pid: number) => `scratch/motion-ai-recovery-${pid}`,
  PROMPT: "Draw the supplied character using the attached reference.",
  ARTIFACT: "motion-puppet-character",
  RUN: "isolated-recovery",
  OTHER: "other-request",
  IMAGE: { name: "character-reference.png", mimeType: "image/png", path: "isolated-reference.png" },
  TRANSPORT: "page.goto: net::ERR_ABORTED; maybe frame was detached?",
  CLOSED: "Target page, context or browser has been closed",
  UNKNOWN: "response connection lost",
  RATE_LIMIT: "You have reached the usage limit",
  PASSED: "Motion AI recovery passed: preserved model and references, bounded room repair, fallback, scoped cooldown, concurrent rooms, submission resume, cancellation and UI activity. No external AI or video rendering.\n",
} as const;
