import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MotionLogStore } from "../src/features/motion/server/services/motionLogStore.ts";
import { motionFlowLogRows, mergeMotionLogHistory, mergeMotionCanonicalLog } from "../src/features/motion/lib/motionLogHistory.ts";
import { motionLogSections } from "../src/features/motion/lib/motionLogSections.ts";
import { MotionJobStatus as Status } from "../src/types/motionVideo.ts";
const root = await fs.mkdtemp(path.join(os.tmpdir(), "motion-log-events-"));
try {
  const logs = new MotionLogStore(root);
  logs.append("events", "10:00:00 · Room gặp lỗi – thử lại tại room hiện tại (1/2)", { workerId: "scene-one", artifact: "motion_remotion_composition", phase: "recovering", provider: "gemini-chat", model: "gemini-flash::medium" });
  logs.append("events", "10:00:00 · Lỗi: chat_planning_provider_error_response; hãy thử lại");
  const first = logs.read("events", 0, 1);
  const second = new MotionLogStore(root).read("events", first.next, 1);
  assert.equal(first.total, 2);
  assert.equal(second.next, 2);
  assert.equal(first.events[0].severity, "warning");
  assert.equal(first.events[0].workerId, "scene-one");
  assert.equal(second.events[0].severity, "error", "Final errors mentioning retry must stay errors");
  assert.ok(first.events[0].timestamp! > 0);
  logs.seed("legacy", ["23:59:59 · Historical line"]);
  assert.equal(logs.read("legacy").events[0].timestamp, undefined);
  const a = Date.UTC(2026, 10, 5, 3);
  const entries: any[] = [
    {
      id: "parent",
      kind: "production",
      startedAt: a,
      lines: ["10:00:00 · Response received", "10:00:00 · SEO received"],
      events: [
        { sequence: 1, timestamp: a + 100, artifact: "motion_remotion_composition" },
        { sequence: 2, timestamp: a + 300, artifact: "motion-story-seo" },
      ],
    },
    { id: "child", kind: "voice", startedAt: a, lines: ["10:00:00 · Voice received"], events: [{ sequence: 1, timestamp: a + 200 }] },
  ];
  assert.deepEqual(
    motionFlowLogRows(entries).map((row) => row.line),
    [entries[0].lines[0], entries[1].lines[0], entries[0].lines[1]],
  );
  const reversed = motionFlowLogRows([
    {
      ...entries[0],
      events: [
        { sequence: 1, timestamp: a + 300 },
        { sequence: 2, timestamp: a + 100 },
      ],
    },
  ]);
  assert.ok(reversed[0].time <= reversed[1].time);
  const sections = motionLogSections(entries);
  assert.equal(sections.find((section) => section.key === "scenes")?.rows[0].message, "Response received");
  assert.equal(sections.find((section) => section.key === "seo")?.rows[0].message, "SEO received");
  const errorSections = motionLogSections([{ id: "events", kind: "scenes", lines: [...first.lines, ...second.lines], events: [...first.events, ...second.events] }]);
  assert.equal(errorSections.find((section) => section.key === "scenes")?.state, "error");
  assert.ok(errorSections.find((section) => section.key === "scenes")?.summary.includes("chat_planning_provider_error_response"));
  assert.equal(errorSections.find((section) => section.key === "scenes")?.rows.at(-1)?.visible, true);
  const provisional = { id: "paged", kind: "scenes", lines: ["tail1", "tail2", "tail3"] };
  assert.deepEqual(mergeMotionCanonicalLog(provisional, ["prefix"]), ["prefix", ...provisional.lines]);
  assert.deepEqual(mergeMotionCanonicalLog({ ...provisional, lines: ["a", "b", "c"] }, ["a", "b"]), ["a", "b", "c"]);
  const final: any = { id: "job", kind: "scenes", lines: ["saved"], status: Status.COMPLETED, stepStates: { scenes: { id: "step", status: Status.COMPLETED, updatedAt: 300, startedAt: 100 } } };
  const merged = mergeMotionLogHistory([final], final.id, final.kind, ["saved"], undefined, { status: Status.RENDERING, stepStates: { scenes: { ...final.stepStates.scenes, status: Status.RENDERING, updatedAt: 400 } } });
  assert.equal(merged[0].status, Status.COMPLETED);
  assert.equal(merged[0].stepStates?.scenes.status, Status.COMPLETED);
  console.log("PASS: persisted timestamp/severity/worker events, pagination/reload, millisecond chronology, legacy timestamps, canonical prefix/tail merge, exact root error, artifact section and terminal-state protection.");
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
