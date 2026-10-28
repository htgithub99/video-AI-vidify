export const MOTION_EDITORIAL_VERIFICATION = {
  ENTRY: `import React from "react";
import { createRoot } from "react-dom/client";
import { useMotionStudio } from "./src/features/motion/hooks/useMotionStudio.ts";
import { MotionAiStatusLine, MotionFlowLog } from "./src/features/motion/components/MotionControls.tsx";
import { jsonUtils } from "./src/lib/json.ts";
import { MOTION_STORY_CONFIG } from "./src/constants/motionVideo.ts";
import { MOTION_EDITORIAL } from "./src/constants/motionEditorial.ts";
import { API_ROUTES } from "./src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "./src/constants/motionVoice.ts";
import { MOTION_DRAFT_VERIFICATION as D } from "./scripts/motionDraftVerificationTexts.ts";
const oldLogs = Array.from({length: 35}, (_, i) => ({id: String(i), kind: "analyze", lines: ["09:00:00 · Accepted DNA " + i]}));
if (!localStorage.getItem("fixture-seeded")) {
  await jsonUtils.setAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {source: D.SOURCE, rawText: D.SOURCE.text, script: D.SCRIPT, analysis: D.ANALYSIS, voice: D.VOICE, uploadedAudio: D.UPLOAD, seo: D.SEO, thumbnail: D.THUMBNAIL, thumbnails: {0: D.THUMBNAIL}, soundOverrides: D.OVERRIDES, visualDrafts: {old: {gen: D.SCRIPT.gen}}, productionId: "old-production", editorialSessionId: "old-editorial", autoRun: false, autoContinue: false, autoExport: false, activeStoryJobId: D.JOB_ID, logHistory: oldLogs});
  localStorage.setItem("fixture-seeded", "1");
}
const fixture = globalThis.motionDraftFixture = {requests: [], errors: [], request: async (url, body) => {
  fixture.requests.push({url, body});
  if (url === MOTION_VOICE_LIBRARY.CHANNELS_URL) return {channels: []};
  if (url === API_ROUTES.MOTION_VIDEO_RESULTS) return {items: []};
  if (url === API_ROUTES.MOTION_STORY_CANCEL) {
    if (fixture.blockCancel) await new Promise(resolve => fixture.releaseCancel = () => {fixture.blockCancel = false; resolve();});
    return {cancelled: false};
  }
  if (url === API_ROUTES.MOTION_STORY_COMPILE) return {spec: {shots: [], duration: 5}, missing: [], sfxCues: []};
  if (url === API_ROUTES.MOTION_PRODUCTION || url === API_ROUTES.MOTION_PRODUCTION_RESUME) {
    fixture.resetSnapshot = await jsonUtils.getAsyncItem(MOTION_STORY_CONFIG.STORY_STORAGE_KEY, {});
    return {job: {id: body.productionId, productionId: body.productionId, kind: "production", status: "error", log: ["10:00:00 · New video"]}};
  }
  throw new Error(url);
}, poll: async (url, update) => {
  const fresh = !url.endsWith(D.JOB_ID);
  const id = fresh ? url.split("/").at(-1) : D.JOB_ID;
  const job = {id, productionId: fresh ? id : undefined, kind: fresh ? "production" : "scenes", status: "error", log: [fresh ? "10:00:00 · New video" : "09:59:00 · Scene response received"], error: "Isolated fixture completion"};
  update(job);
  return job;
}};
const active = Object.fromEntries(["primary", "recovering", "primary"].map((phase, index) => [String(index), {workerId: String(index), provider: "gemini-chat", model: "gemini-flash::low", phase, artifact: "motion-puppet-read"}]));
function Fixture() {
  const studio = useMotionStudio();
  globalThis.motionDraftStudio = studio;
  return <main><h2>Video Motion · Kiểm tra log và trạng thái</h2><MotionAiStatusLine activities={active}/><button onClick={() => void studio.analyze()}>Tạo video mới</button><MotionFlowLog entries={studio.logHistory} label={String}/></main>;
}
createRoot(document.getElementById("root")).render(<Fixture/>);`,
  HTML: '<!doctype html><html><meta charset="utf-8"><style>body{background:#100e18;color:#ddd;font:14px Arial;margin:24px}main{width:680px;max-width:100%;padding:20px;border:1px solid #444;border-radius:16px;box-sizing:border-box}p{line-height:20px}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button{margin:12px 0;padding:8px;background:#6b21a8;color:white;border:0;border-radius:6px}</style><div id="root"></div><script type="module" src="/fixture.js"></script></html>',
  LABEL: "gemini-chat · gemini-flash::low · Ưu tiên ×2 | Phục hồi",
  NEW_BUTTON: "Tạo video mới",
  NEW_ID: "new-video-job",
  LIVE_LINE: "09:59:00 · Scene response received",
  SCREENSHOT: "scratch/motion-editorial-ui-20261024.png",
  PASSED: "Editorial UI passed: real localStorage/IndexedDB reload, all 35 previous jobs retained, immediate log journal, new-video-only reset and one compact status line at desktop/mobile widths. No external AI calls.\n",
} as const;
