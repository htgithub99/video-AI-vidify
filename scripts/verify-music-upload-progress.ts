import assert from "node:assert/strict";
import express from "express";
import { musicDownloadReporter } from "../src/features/music/server/services/musicDownloadProgress.js";
import { readMusicDownloadResponse } from "../src/features/music/lib/musicDownloadProgress.js";
import type { MusicDownloadProgress } from "../src/types/musicDownloadProgress.js";
const values = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) } });
const { recordMusicDownloadProgressActivity } = await import("../src/features/music/services/musicDownloadActivity.js");
const { getWorkflowActivities, getEventStatusType } = await import("../src/services/workflowActivity.js");
const app = express();
app.get("/progress", (_req, res) => {
  const report = musicDownloadReporter(res, true);
  report.progress({ phase: "verification-waiting", room: 2, rooms: 3, expected: 10, message: "Đang chờ bạn xác minh Google trong tab Chrome đang mở." });
  report.progress({ phase: "verification-resumed", room: 2, rooms: 3, expected: 10, message: "Đã xác minh, tiếp tục tác vụ." });
  report.progress({ phase: "uploading", room: 2, rooms: 3, attempt: 1, expected: 10, selected: 10, ready: 8, processing: 2, failed: 0 });
  report.progress({ phase: "ready", room: 2, rooms: 3, attempt: 1, expected: 10, selected: 10, ready: 10, processing: 0, failed: 0 });
  report.progress({ phase: "failed", room: 3, rooms: 3, expected: 10, message: "HTTP 403 https://example.com/upload?token=private" });
  report.finish({ success: false, error: "upload failed" }, 400);
});
app.get("/json", (_req, res) => musicDownloadReporter(res, false).finish({ success: true }));
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
try {
  const origin = `http://127.0.0.1:${(server.address() as any).port}`;
  const progress: MusicDownloadProgress[] = [];
  const result = await readMusicDownloadResponse(await fetch(origin + "/progress"), (event) => {
    progress.push(event);
    recordMusicDownloadProgressActivity(event, "vi");
  });
  assert.equal(result.success, false);
  assert.equal(progress.length, 5);
  assert.ok(!JSON.stringify(progress).includes("private"));
  const activities = getWorkflowActivities();
  assert.equal(activities.length, 5);
  assert.ok(activities.every((entry) => entry.area === "music"));
  assert.match(activities[2].detail!, /Room 2\/3.*Sẵn sàng 8\/10.*Đang xử lý 2.*Lỗi 0/);
  assert.equal(getEventStatusType(activities[2].event), "running");
  assert.equal(getEventStatusType(activities[1].event), "success");
  assert.equal(getEventStatusType(activities[0].event), "fail");
  assert.equal(activities[4].event, "musicVerificationStart");
  assert.equal(getEventStatusType(activities[4].event), "running", "Verification is waiting, not a failure");
  assert.equal(activities[3].event, "musicVerificationResume");
  assert.equal((await readMusicDownloadResponse(await fetch(origin + "/json"), () => {})).success, true);
  const partial = new Response(
    new ReadableStream({
      start(controller) {
        for (const part of ['{"type":"progress","progress":{"phase":"queued","expected":10}}\n', '{"type":"result","result":{"success":true}}']) controller.enqueue(new TextEncoder().encode(part));
        controller.close();
      },
    }),
    { headers: { "content-type": "application/x-ndjson" } },
  );
  assert.equal((await readMusicDownloadResponse(partial, () => {})).success, true);
  console.log("PASS: streamed room progress reaches persisted Music activity, 8/10 stays running, 10/10 confirmed is success, errors are visible and sanitized, JSON compatibility and split streaming.");
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
