import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normalizeMotionNarratorSpeakers } from "../src/lib/motionVoice.js";
import { motionSpeechResponseIssues } from "../src/lib/motionSpeechResponse.js";
import { motionLogSections } from "../src/features/motion/lib/motionLogSections.js";
import { mergeMotionLogHistory, motionRestoredStoryJobId } from "../src/features/motion/lib/motionLogHistory.js";
import { motionPromptEditorialContext } from "../src/lib/motionPrompt.js";
import { motionChapterRepairPrompt } from "../src/lib/motionChapterRepair.js";
import { withMotionResponsePrompt } from "../src/lib/motionResponseContract.js";
import { MOTION_PROMPT as P } from "../src/constants/motionPrompt.js";
import { MOTION_LOG_SECTIONS as L } from "../src/features/motion/constants/motionLogSections.js";
import { MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT as envelope } from "../src/constants/motionRuntime.js";
import { MotionJobStatus as S, MotionStoryJobKind as K, type MotionStoryJobState } from "../src/types/motionVideo.js";
process.env.VIDIFY_STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "motion-narrator-recovery-"));
delete process.env.APP_DATA_DIR;
const fixture = JSON.parse(fs.readFileSync(new URL("./fixtures/motion-narrator-remotion-20261027.json", import.meta.url), "utf8"));
const { writeChapterBeats } = await import("../src/server/services/motionStoryService.js");
const narration = "Tôi nghe tiếng nước chảy dưới mái, còn chị Hai vẫn nhìn ra khoảng sân trước mặt.";
const dialogue = "Chị để tôi xem thử một chút đã.";
const raw = [
  { speaker: "toi", role: "narration", text: narration },
  { speaker: "toi", role: "dialogue", text: dialogue },
];
const normalized = normalizeMotionNarratorSpeakers(raw, "toi") as typeof raw;
assert.equal(normalized[0].speaker, "narrator");
assert.equal(normalized[1].speaker, "toi");
assert.equal(raw[0].speaker, "toi");
assert.equal(motionSpeechResponseIssues(normalized, ["narrator", "toi"], narration + " " + dialogue).length, 0);
for (const role of ["thought", "offscreen", "dialogue"]) assert.deepEqual(normalizeMotionNarratorSpeakers([{ ...raw[0], role }], "toi"), [{ ...raw[0], role }]);
assert.ok(motionSpeechResponseIssues(normalizeMotionNarratorSpeakers([{ speaker: "unknown", role: "narration", text: narration }], "toi"), ["narrator", "toi"], narration).length);
assert.ok(motionSpeechResponseIssues(normalizeMotionNarratorSpeakers(raw, undefined), ["narrator", "toi"], narration + " " + dialogue).length);
const prompts: string[] = [];
const analysis = fixture.analysis;
const chapter = analysis.chapters[0];
const beats = await writeChapterBeats(fixture.source, analysis, chapter, {
  language: "vi",
  exec: {},
  isFirst: true,
  isLast: true,
  ai: async (prompt) => {
    prompts.push(prompt);
    return { beats: [{ narration: narration + " “" + dialogue + "”", visual: "scene", place: analysis.places[0].key, cast: ["toi"], utterances: structuredClone(raw) }] };
  },
});
assert.equal(prompts.length, 2);
assert.ok(beats.every((beat) => beat.utterances?.[0].speaker === "narrator" && beat.utterances?.[1].speaker === "toi"));
assert.ok(prompts.every((prompt) => !prompt.includes("STORYBOARD RULES") && !prompt.includes(P.ILLUSTRATION_NEEDS) && !prompt.includes("geomap:")));
const sizes = prompts.map((prompt) => envelope(withMotionResponsePrompt("motion-story-chapter", prompt), "offline-regression").length);
assert.ok(
  sizes.every((size) => size <= P.TARGET_CHARS),
  JSON.stringify(sizes),
);
assert.equal(motionPromptEditorialContext("motion-story-chapter", "duplicate source"), "");
assert.ok(motionPromptEditorialContext("motion-story-seo", "accepted continuity").includes("accepted continuity"));
for (const point of chapter.keyPoints) assert.ok(prompts.some((prompt) => prompt.includes(point)));
for (const member of analysis.cast) assert.ok(prompts.every((prompt) => prompt.includes(member.key)));
for (const clue of analysis.storySpine.clues) assert.ok(prompts.every((prompt) => prompt.includes(clue.payoff)));
const repair = motionChapterRepairPrompt([{ id: "b1", narration, utterances: raw, cast: ["toi"], place: "porch", scenePlan: { composition: "UNRELATED_LAYOUT_SENTINEL" } }], [{ id: "b1", fields: ["utterances"] }], {});
assert.ok(!repair.includes("UNRELATED_LAYOUT_SENTINEL"));
assert.ok(repair.includes(narration) && repair.includes('"utterances"'));
const base = new Date(2026, 9, 27, 7, 0).getTime();
let logs = mergeMotionLogHistory([], "old-production", K.PRODUCTION, ["07:00:00 · [Phân tích nội dung] Hoàn tất", "07:11:37 · Chưa ghép đủ điểm đặt cho Hiên nhà: table | sit | 1"], base, { status: S.ERROR, stage: "Ghép hình từ kho", error: "Chưa ghép đủ điểm đặt cho Hiên nhà" });
logs = mergeMotionLogHistory(logs, "new-script", K.SCRIPT, ["07:35:20 · Viết lời dẫn chương 1/1", "07:44:19 · Hoàn tất"], base + 35 * 60000, { status: S.COMPLETED });
const oldJob = { id: "old-production", kind: K.PRODUCTION, status: S.ERROR, startedAt: base, stage: "Ghép hình từ kho", error: "Chưa ghép đủ điểm đặt cho Hiên nhà", log: [] } as MotionStoryJobState;
assert.equal(motionRestoredStoryJobId(undefined, logs, oldJob.id), "new-script");
assert.equal(motionRestoredStoryJobId("running-job", logs, oldJob.id), "running-job");
assert.equal(motionRestoredStoryJobId(undefined, [...logs, { id: "render", kind: "render", lines: [] }], oldJob.id), "new-script");
for (const current of [undefined, oldJob, { id: "new-script", kind: K.SCRIPT, status: S.COMPLETED, startedAt: base + 35 * 60000, log: [] } as MotionStoryJobState]) {
  const groups = motionLogSections(logs, "vi", current);
  assert.equal(groups.find((group) => group.key === "script")?.state, "done");
  assert.equal(groups.find((group) => group.key === "scenes")?.state, "previous_error");
  assert.equal(groups.find((group) => group.key === "scenes")?.summary, L.TEXT.vi.previousError);
  assert.ok(groups.find((group) => group.key === "scenes")?.rows.some((row) => row.raw.includes("table | sit")));
}
const activeScenes = { id: "new-scenes", kind: K.SCENES, status: S.RENDERING, startedAt: base + 45 * 60000, log: [] } as MotionStoryJobState;
assert.equal(motionLogSections(logs, "vi", activeScenes).find((group) => group.key === "scenes")?.state, "active");
const failedScenes = { ...activeScenes, status: S.ERROR, error: "new failure" };
assert.equal(motionLogSections(logs, "vi", failedScenes).find((group) => group.key === "scenes")?.state, "error");
const retriedLogs = mergeMotionLogHistory(logs, "new-scenes", K.SCENES, ["07:45:00 · Đọc và dựng cảnh Remotion 1/17", "07:46:00 · Hoàn tất"], activeScenes.startedAt, { status: S.COMPLETED });
assert.equal(motionLogSections(retriedLogs, "vi", oldJob).find((group) => group.key === "scenes")?.state, "done");
const overlappingLogs = mergeMotionLogHistory(logs.slice(0, 1), "parallel-seo", K.SEO, ["07:10:00 · Tạo SEO YouTube", "07:12:00 · Hoàn tất"], base + 10 * 60000, { status: S.COMPLETED });
assert.equal(motionLogSections(overlappingLogs, "vi", oldJob).find((group) => group.key === "scenes")?.state, "error");
assert.equal(motionLogSections(logs, "vi", { ...activeScenes, kind: K.SCRIPT }).find((group) => group.key === "script")?.state, "active");
const statusOnly = mergeMotionLogHistory(logs, "new-script", K.SCRIPT, logs[1].lines, base + 35 * 60000, { status: S.ERROR, error: "terminal change" });
assert.equal(statusOnly[1].status, S.ERROR);
assert.equal(statusOnly[1].lines.length, logs[1].lines.length);
process.stdout.write(JSON.stringify({ passed: true, chapterRequests: prompts.length, promptCharsWithSchemaAndEnvelope: sizes, narratorAndDialogue: "preserved", logs: "previous failure retained separately" }) + "\n");
