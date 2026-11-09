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
assert.doesNotMatch(scenePrompt, /Return the complete HTML|SELECTED VIDEO LANGUAGE|kopje|cowhide|chainmail|screaming|Unconscious/i);
assert.ok(scenePrompt.length < 9200, "scene prompt stays bounded: " + scenePrompt.length);
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
const { motionHtmlCastCards, motionHtmlContinuity } = await import("../src/lib/motionHtmlCast.js");
const castAnalysis: any = {
  cast: [
    { key: "pulleine", name: "Colonel Henry Pulleine", look: "British officer in red coat, white helmet, moustache", marks: ["moustache"], skin: "pale" },
    { key: "durnford", name: "Colonel Anthony Durnford", look: "British colonial officer, red coat, left arm held stiff", skin: "pale" },
    { key: "narrator", name: "Narrator", look: "Unseen voice", narrator: true },
  ],
  groups: [{ key: "zulu", name: "Zulu impi", look: "warriors with cowhide shields", gear: "assegai" }],
};
const cardsA = motionHtmlCastCards(castAnalysis, [{ cast: ["pulleine", "narrator"] }], "Pulleine waits while Durnford rides in; the Zulu impi gathers.");
const cardsB = motionHtmlCastCards(castAnalysis, [{ cast: ["pulleine"] }], "Durnford and Pulleine study the map; Zulu warriors on the ridge.");
const lineOf = (cards: string, name: string) => cards.split("\n").find((line) => line.includes(name));
assert.ok(cardsA.includes("Colonel Henry Pulleine") && cardsA.includes("Colonel Anthony Durnford") && cardsA.includes("Zulu impi"));
assert.ok(!cardsA.includes("Narrator"), "narrator is not drawn");
assert.equal(lineOf(cardsA, "Pulleine"), lineOf(cardsB, "Pulleine"), "a character card is identical in every scene");
assert.notEqual(lineOf(cardsA, "Pulleine")!.split("signature")[1], lineOf(cardsA, "Durnford")!.split("signature")[1], "two officers get different signatures");
assert.match(motionHtmlContinuity("Durnford is already on foot."), /STARTS FROM[\s\S]*already on foot/);
const castCtrl = new AbortController();
let castPrompt = "";
await assert.rejects(
  generateMotionHtmlScene({ id: "c2_b1:html:0", sceneTemplate: "0. Durnford rides in." } as any, { width: 1280, height: 720, seconds: 6, profile: "history", scope: "t-cast-" + Date.now(), language: "en", cast: cardsA, continuity: motionHtmlContinuity("Durnford is mounted.") }, {
    exec: { provider: "gemini-chat", model: "gemini-flash", allowFallback: false } as any,
    ai: (async (prompt: string) => {
      castPrompt = prompt;
      castCtrl.abort();
      throw new Error("stop");
    }) as any,
    signal: castCtrl.signal,
    log: () => undefined,
  }),
);
assert.ok(castPrompt.includes(cardsA) && castPrompt.indexOf(cardsA) < castPrompt.indexOf("SCENE (source data)"), "cast cards precede the scene");
assert.match(castPrompt, /faces its direction[\s\S]*seated rider is drawn inside drawHorse/, "motion direction and the rider rule are in a riding scene");
assert.doesNotMatch(scenePrompt, /COUPLED MECHANICS/, "a scene without riders, vehicles or props gets no coupled mechanics");
const { motionHtmlMechanics } = await import("../src/lib/motionHtmlMechanics.js");
assert.match(motionHtmlMechanics("Gunners haul the field guns forward."), /rigX/);
assert.doesNotMatch(motionHtmlMechanics("Gunners haul the field guns forward."), /horseX|propX/);
const onlyNamed = motionHtmlCastCards(castAnalysis, [{ cast: ["pulleine", "durnford"] }], "The Zulu impi gathers on the ridge.");
assert.ok(!onlyNamed.includes("Pulleine") && !onlyNamed.includes("Durnford") && onlyNamed.includes("Zulu impi"), "only people the scene names get a card");
assert.equal(motionHtmlCastCards(castAnalysis, [], "A colonel waits."), "", "a title alone does not pull in a named officer");
const { motionHtmlFigureDoc } = await import("../src/lib/motionHtmlFigure.js");
assert.ok(scenePrompt.includes(motionHtmlFigureDoc("history")) && horrorPrompt.includes(motionHtmlFigureDoc("horror")), "scene prompts carry the measured figure design of their profile");
assert.match(motionHtmlFigureDoc("history"), /groundY/, "figures stand on the drawn ground");
assert.match(scenePrompt, /hand-drawn[\s\S]*one Path2D/, "outline belongs to its shape");
assert.match(scenePrompt, /only advances when the SCENE says/, "a gathering group does not charge");
assert.match(scenePrompt, /never drawn while a clip is active/, "a ground clip cannot hide the figures");
assert.match(motionHtmlFigureDoc("history"), /legs visible from the hem at -0.9r/, "legs show below the torso");
assert.match(motionHtmlFigureDoc("horror"), /The hem never reaches the shoes/, "horror legs show too");
assert.match(scenePrompt, /never a flat strip, bar or crown/, "clouds have a rounded underside");
assert.match(scenePrompt, /camX follows groupX at most 1:1[\s\S]*distance travelled/, "the camera never outruns marchers and steps follow distance");
assert.doesNotMatch(motionHtmlFigureDoc("history"), /torsoY=-28|headR\+4/, "no fixed pixel offsets");
assert.doesNotMatch(scenePrompt, /overlapping (?:outlined )?(?:puffs|circles)|lumpy blobs|capsule|corner radius/, "no geometric shape recipes");
assert.doesNotMatch(scenePrompt, /legs down both flanks/, "one rider rule only");
assert.ok(!scenePrompt.includes("MotionKit"), "the AI draws every figure itself");
const bare = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body><script>window.motionScene={}</script></body></html>";
const { motionHtmlHostDocument } = await import("../src/lib/motionHtmlHost.js");
const { MOTION_REMOTION_RENDER } = await import("../src/constants/motionRemotionRender.js");
const hostDoc = motionHtmlHostDocument(bare, "t");
assert.ok(hostDoc.includes("blank:true") && hostDoc.includes("allowBlank") && hostDoc.includes("Canvas blank frame"), "export frames that come back empty are rejected and redrawn instead of encoded as black");
assert.ok(MOTION_REMOTION_RENDER.SEGMENT_VERSION >= 3, "segments cached before the blank-frame check are rendered again");
const { motionOutputQualityIssues } = await import("../src/lib/motionOutputQuality.js");
const { MOTION_LOUDNESS } = await import("../src/constants/motionLoudness.js");
assert.equal(motionOutputQualityIssues("black_start:44.53 black_end:50.57", { renderer: "html-canvas", engine: "remotion", scenes: [], duration: 82, fps: 30 } as any).length, 0, "a dark html scene is reported, not a failed export");
assert.ok(MOTION_LOUDNESS.KEEP_LINES.test("[blackdetect @ 0x1] black_start:44.5333 black_end:50.5663") && !MOTION_LOUDNESS.KEEP_LINES.test("frame= 1428 fps=257"), "black and silence events survive the stderr tail");
assert.equal(MOTION_LOUDNESS.LOG.BLACK(MOTION_LOUDNESS.LOG.RANGE(44.5333, 50.5663)), "Cảnh báo: có hình đen ≥ 1 giây ở 44.5–50.6 giây");
console.log("Speed fixes: readiness probe instead of long cooldown, step time kept across resume, stalled scene tab released passed.");
