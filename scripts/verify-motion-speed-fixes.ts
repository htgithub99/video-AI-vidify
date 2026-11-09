import path from "node:path";
import os from "node:os";
process.env.VIDIFY_STORAGE_DIR = path.join(os.tmpdir(), "motion-speed-fixes-" + process.pid);
import assert from "node:assert/strict";
import { waitMotionProviderReady } from "../src/features/motion/server/services/motionProviderRecovery.js";
import { MOTION_AI_RECOVERY as R } from "../src/constants/motionAiRecovery.js";
import { motionStepElapsedMs, motionStepSegment } from "../src/lib/motionStepTime.js";
import { MotionAiWorkerPool } from "../src/features/motion/server/services/motionAiWorkerPool.js";

let remaining = 5 * 60 * 60 * 1000;
const pauses: number[] = [];
let probes = 0;
const events: string[] = [];
const ok = await waitMotionProviderReady(
  () => remaining,
  async (ms) => { pauses.push(ms); },
  async () => { probes++; if (probes < 3) throw new Error("rate limited"); remaining = 0; },
  { waiting: () => events.push("wait"), checking: (n) => events.push("check" + n), ready: () => events.push("ready"), notReady: () => events.push("not") },
);
assert.equal(ok, true);
assert.deepEqual(pauses, [15000, 30000, 60000], "probe early instead of waiting the 5h block");
assert.equal(probes, 3);
assert.deepEqual(events, ["wait", "check1", "not", "wait", "check2", "not", "wait", "check3", "ready"]);
assert.equal(await waitMotionProviderReady(() => 0, async () => assert.fail(), async () => assert.fail(), { waiting: () => assert.fail(), checking: () => assert.fail(), ready: () => assert.fail(), notReady: () => assert.fail() }), false);
let expiring = 10000; let probed = false;
await waitMotionProviderReady(() => expiring, async (ms) => { expiring -= ms; }, async () => { probed = true; }, { waiting() {}, checking() {}, ready() {}, notReady() {} });
assert.equal(probed, false, "short block expires without a probe");
const abort = new AbortController();
await assert.rejects(waitMotionProviderReady(() => 1e9, async () => { abort.abort(); }, async () => { throw new Error("x"); }, { waiting() {}, checking() {}, ready() {}, notReady() {} }, abort.signal));
assert.ok(R.LIMIT_BACKOFF_MS.every((ms) => ms <= 10 * 60 * 1000));

const t0 = 1_000_000;
const first = { id: "a", startedAt: t0, ...motionStepSegment(undefined, "a", t0), updatedAt: t0 + 60000 };
assert.equal(motionStepElapsedMs(first), 60000);
const resumed = { ...first, ...motionStepSegment(first, "b", t0 + 3_600_000), id: "b", updatedAt: t0 + 3_600_000 + 30000 };
assert.equal(resumed.startedAt, t0);
assert.equal(motionStepElapsedMs(resumed), 90000, "resume keeps earlier work time and skips the paused hour");
assert.equal(motionStepElapsedMs(resumed, t0 + 3_600_000 + 45000), 105000, "live tick while active");
const same = { ...resumed, ...motionStepSegment(resumed, "b", t0 + 9_999_999) };
assert.equal(same.segmentAt, resumed.segmentAt, "same job keeps its segment");
assert.equal(motionStepElapsedMs({ startedAt: t0, updatedAt: t0 + 5000 }), 5000, "legacy records still show a duration");

const pool = new MotionAiWorkerPool(["w1", "w2", "w3"]);
const a = await pool.acquire(undefined, { pin: "w3" });
const b = await pool.acquire();
const c = await pool.acquire();
assert.deepEqual([a.workerId, b.workerId, c.workerId].sort(), ["w1", "w2", "w3"]);

const { generateMotionHtmlScene } = await import("../src/features/motion/server/services/html/scenePipeline.js");
const ctrl = new AbortController();
const calls: any[] = [];
const logs: string[] = [];
const scene: any = { id: "c1_b1:html:0", sceneTemplate: "A farmer plants rice.", drawingNote: "" };
const ai = async (_p: string, _a: string, exec: any) => {
  calls.push({ worker: exec.worker, attempted: exec.submission?.attempted, abandoned: exec.submission?.abandoned, requestId: exec.requestId });
  if (calls.length === 1) {
    exec.workerAssigned?.("motion-scene-third");
    exec.submission.attempted = true;
    exec.submissionChanged?.();
    throw Object.assign(new Error(R.UNCERTAIN("gemini-chat")), { [R.UNCERTAIN_FLAG]: true });
  }
  ctrl.abort();
  throw new Error("stop");
};
await assert.rejects(generateMotionHtmlScene(scene, { width: 1280, height: 720, seconds: 5, profile: "history", scope: "t-abandon-" + Date.now() }, { exec: { provider: "gemini-chat", model: "gemini-flash" } as any, ai: ai as any, signal: ctrl.signal, log: (l: string) => logs.push(l) }));
assert.equal(calls.length, 2);
assert.equal(calls[1].worker, undefined, "retry is not pinned to the stalled tab");
assert.equal(calls[1].attempted, false, "retry is a fresh request");
assert.notEqual(calls[1].requestId, calls[0].requestId);
assert.ok(logs.some((l) => l.includes("bỏ lượt cũ")), logs.join("\n"));
const { MOTION_HTML } = await import("../src/constants/motionHtmlTemplate.js");
const { motionHtmlPlanSourceMatches } = await import("../src/lib/motionHtmlScene.js");
const current = JSON.stringify({ productionLanguage: "en", beats: [{ id: "b1" }], settings: { pacing: "few" } });
const legacy = JSON.stringify({ productionLanguage: "en", graphics: "old style text", beats: [{ id: "b1" }], settings: { pacing: "few" } });
assert.ok(motionHtmlPlanSourceMatches(current, current));
assert.ok(motionHtmlPlanSourceMatches(legacy, current), "plans saved with the old style text stay valid");
assert.ok(!motionHtmlPlanSourceMatches(JSON.stringify({ productionLanguage: "en", graphics: "x", beats: [{ id: "b2" }], settings: { pacing: "few" } }), current));
assert.ok(!motionHtmlPlanSourceMatches(undefined, current));
const routeCtrl = new AbortController();
const routed: { provider: string; prompt: string }[] = [];
const routeLogs: string[] = [];
await assert.rejects(
  generateMotionHtmlScene({ id: "c1_b2:html:0", sceneTemplate: "0. A farmer plants rice.\n4. OVERLAYS & INTERACTION: tag 'Spring'" } as any, { width: 1280, height: 720, seconds: 6, profile: "history", scope: "t-route-" + Date.now(), language: "en" }, {
    exec: { provider: "gemini-chat", model: "gemini-flash", mode: "room-only" } as any,
    ai: (async (prompt: string, _artifact: string, exec: any) => {
      routed.push({ provider: exec.provider, prompt });
      if (routed.length < 3) throw Object.assign(new Error(R.UNCERTAIN(exec.provider)), { [R.UNCERTAIN_FLAG]: true });
      routeCtrl.abort();
      throw new Error("stop");
    }) as any,
    signal: routeCtrl.signal,
    log: (line: string) => routeLogs.push(line),
  }),
);
assert.deepEqual(routed.slice(0, 2).map((row) => row.provider), ["gemini-chat", "gemini-chat"]);
assert.notEqual(routed[2].provider, "gemini-chat", "a scene leaves an AI that failed twice in a row");
assert.ok(routeLogs.some((line) => line.includes(routed[2].provider)));
const scenePrompt = routed[0].prompt;
assert.ok(scenePrompt.startsWith(MOTION_HTML.OUTPUT));
assert.equal(scenePrompt.split(MOTION_HTML.GRAPHICS).length, 2, "style rules appear once");
assert.doesNotMatch(scenePrompt, /Return the complete HTML|SELECTED VIDEO LANGUAGE|kopje|shako|cowhide|chainmail|screaming|Unconscious/i);
assert.ok(scenePrompt.length < 4200, "scene prompt stays compact: " + scenePrompt.length);
const horrorCtrl = new AbortController();
let horrorPrompt = "";
await assert.rejects(
  generateMotionHtmlScene({ id: "c1_b3:html:0", sceneTemplate: "0. A girl waits at the village gate in the rain." } as any, { width: 1280, height: 720, seconds: 6, profile: "horror", scope: "t-horror-" + Date.now(), language: "vi" }, {
    exec: { provider: "gemini-chat", model: "gemini-flash", allowFallback: false } as any,
    ai: (async (prompt: string) => {
      horrorPrompt = prompt;
      horrorCtrl.abort();
      throw new Error("stop");
    }) as any,
    signal: horrorCtrl.signal,
    log: () => undefined,
  }),
);
assert.ok(horrorPrompt.includes(MOTION_HTML.PROFILE_GRAPHICS.horror), "horror scenes use their own drawing style");
assert.ok(!horrorPrompt.includes(MOTION_HTML.GRAPHICS));
const { motionHtmlWritingDirection, motionHtmlAuthoringSnapshot } = await import("../src/lib/motionHtmlAuthoring.js");
const { motionRenameAutofix } = await import("../src/lib/motionRename.js");
const renamedAnalysis: any = { title: "T", chapters: [{ id: "c1", targetSeconds: 30 }], cast: [], places: [], renameEntities: true, renameMap: [{ source: "Henry Pulleine", renamed: "Arthur Hale", kind: "person" }], authoringSettings: motionHtmlAuthoringSnapshot({ length: "2min", target: 120, language: "en", profile: "history" }) };
assert.match(motionHtmlWritingDirection(renamedAnalysis), /RENAMING IS ON[\s\S]*Henry Pulleine → Arthur Hale|RENAMING IS ON[\s\S]*Arthur Hale/u, "HTML writing prompts carry the rename rule");
assert.doesNotMatch(motionHtmlWritingDirection({ ...renamedAnalysis, renameEntities: false }), /RENAMING IS ON/u, "keep source names when renaming is off");
const fixedBeats = motionRenameAutofix([{ id: "b1", chapterId: "c1", narration: "Henry Pulleine waits.", visual: "scene", sceneTemplateDraft: "4. OVERLAYS: tag 'Henry Pulleine'" } as any], renamedAnalysis);
assert.equal(fixedBeats.beats[0].narration, "Arthur Hale waits.");
assert.ok(fixedBeats.beats[0].sceneTemplateDraft!.includes("Arthur Hale"), "on-screen tags are renamed too");
const { motionUserLogLine, createMotionLogFilter } = await import("../src/lib/motionLogText.js");
assert.equal(motionUserLogLine("08:39:53 · [Dựng cảnh minh họa] [Dựng cảnh minh họa] Prompt motion-html-scene: 7.926 ký tự."), undefined);
assert.equal(motionUserLogLine("[Viết kịch bản] Số yêu cầu AI đã khởi chạy (gồm ...): deepseek-chat 4"), undefined);
assert.equal(motionUserLogLine("[Dựng cảnh minh họa] Cảnh HTML c1_b1:html:0: tạo trọn cảnh, lượt 1."), undefined);
assert.equal(motionUserLogLine("08:40:13 · [Dựng cảnh minh họa] [Dựng cảnh minh họa] Phòng chat gặp lỗi – bấm nút Thử lại của lượt hiện tại. (tab dựng cảnh 3)"), "08:40:13 · [Dựng cảnh minh họa] AI báo lỗi – tự bấm Thử lại. (tab dựng cảnh 3)");
assert.equal(motionUserLogLine("[Dựng cảnh minh họa] [Dựng cảnh] Đang mở 3 room AI dựng cảnh riêng."), "[Dựng cảnh minh họa] Đang mở 3 tab AI dựng cảnh riêng.");
assert.equal(motionUserLogLine("Cảnh HTML c2_b6:html:4: tạo trọn cảnh, lượt 3."), "Dựng lại cảnh c2-b6-4 (lần 3).");
const once = createMotionLogFilter(() => 0);
assert.ok(once("[Viết kịch bản] Đang mở 2 tab AI nội dung."));
assert.equal(once("09:00:01 · [Viết kịch bản] Đang mở 2 tab AI nội dung."), undefined, "repeated line is shown once");
console.log("Speed fixes: readiness probe instead of long cooldown, step time kept across resume, stalled scene tab released passed.");
