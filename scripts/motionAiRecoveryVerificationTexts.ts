export const MOTION_AI_RECOVERY_VERIFICATION = {
  ENTRY:
    'export * from "./src/server/services/motionStoryService.ts"; export * from "./src/server/services/motionStoryJobService.ts"; export { MOTION_CAPTCHA } from "./src/constants/motionCaptcha.ts"; export { MOTION_AI_RECOVERY } from "./src/constants/motionAiRecovery.ts"; export { MOTION_STORY_CONFIG } from "./src/constants/motionVideo.ts"; export { drawPuppetCharacters, drawPuppetSets, drawPuppetProps } from "./src/server/services/puppet/kitDraw.ts"; export { readPuppetLines } from "./src/server/services/puppet/director.ts"; export { readPuppet } from "./src/server/services/puppet/kitLibrary.ts";',
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
    export const reloadChatPlanningRoom = async request => { f.reloaded.push(request); await f.reload(request); };
    export const closeChatPlanningRoomsForProject = async request => { f.closedProjects.push(request); };
    export const prepareChatPlanningRoom = async request => { f.prepared.push(request); await f.prepare(request); };
    export const getChatPlanningRoom = () => f.captchaPage;
    export const generatePlanningWithChatUi = async request => { f.sent.push(request); request.submission?.onAttempt?.(); return await f.send(request); };
    export const resumeChatPlanningResponse = async request => { f.resumed.push(request); return await f.resume(request); };
  `,
  API_STUB: "export const generateContentWithRetry = async () => { globalThis.__motionAiRecovery.apiCalls++; throw new Error('unexpected-live-api-call'); };",
  BUNDLE: (pid: number) => `node_modules/.cache/motion-ai-recovery-${pid}.mjs`,
  STORAGE: (pid: number) => `scratch/motion-ai-recovery-${pid}`,
  PROMPT: "Draw the supplied character using the attached reference.",
  ARTIFACT: "motion-puppet-character",
  STORY_ARTIFACT: "motion-story-chapter",
  CAST: { key: "storyteller", name: "Storyteller", role: "narrator", age: "adult", look: "A village storyteller" },
  PLACE: { key: "village_room", name: "Village room", desc: "A village room with a wooden floor", interior: true, time: "day" },
  PROP: "oil_lamp",
  STORY: "A storyteller sits in a village room beside an oil lamp.",
  SVG: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${Array.from({ length: 60 }, (_, i) => `<rect x="${(i % 10) * 40}" y="${Math.floor(i / 10) * 40}" width="36" height="36" fill="#907050"/>`).join("")}</svg>`,
  MALFORMED_SVG: "missing SVG",
  REVIEW_FAILURE: "The drawing does not match the supplied style",
  REFUSAL: "Là một mô hình ngôn ngữ, tôi không được thiết kế để trợ giúp về điều đó.",
  RUN: "isolated-recovery",
  EDITORIAL: { id: "editorial-fixture", revision: "source-revision-one", context: "Accepted DNA and approved chapters" },
  OTHER: "other-request",
  IMAGE: { name: "character-reference.png", mimeType: "image/png", path: "isolated-reference.png" },
  TRANSPORT: "page.goto: net::ERR_ABORTED; maybe frame was detached?",
  NETWORK_SUSPENDED: "page.goto: net::ERR_NETWORK_IO_SUSPENDED",
  DNS_UNAVAILABLE: "page.goto: net::ERR_NAME_NOT_RESOLVED",
  CLOSED: "Target page, context or browser has been closed",
  UNKNOWN: "response connection lost",
  MALFORMED_ENVELOPE: (artifactType: string, requestId: string) => `{"artifactType":${JSON.stringify(artifactType)},"requestId":${JSON.stringify(requestId)},"ready":true,"units":[{"from":{"line":140},"read":{"visual":{"fixtures":[]}}]}`,
  RATE_LIMIT: "You have reached the usage limit",
  CAPTCHA: "verify you are human",
  CAPTCHA_URL: "https://gemini.google.com/app/fixture-captcha",
  CAPTCHA_ROOM_URL: "https://gemini.google.com/app",
  CAPTCHA_READY: "Gemini",
  DEADLOCK: "Independent chat rooms waited for another room",
  WAIT_MS: 3000,
  PASSED: "Motion AI recovery passed: preserved model/references, bounded room replacement, provider fallback, concurrent rooms, late responses, cancellation, SVG creation/storage for both style packs and fatal-error propagation. Local SVG rasterization; no external AI or video rendering.\n",
} as const;
