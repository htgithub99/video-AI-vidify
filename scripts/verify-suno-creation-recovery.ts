import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import express from "express";
import { openSunoCreationCheckpoint, saveSunoCreationCheckpoint, runSunoCreationCheckpoint, creationSongIds, sunoCreationKey, type SunoCreationInput } from "../src/features/music/server/services/sunoCreationCheckpointService.js";
import { sunoCreationReporter } from "../src/features/music/server/services/sunoCreationProgress.js";
import { readSunoCreationResponse, formatSunoCreationProgress } from "../src/features/music/lib/sunoCreationProgress.js";
import { WORKFLOW_ACTIVITY_EVENT, WORKFLOW_ACTIVITY_TEXT } from "../src/constants/workflowActivity.js";
import { settleSunoBrowserClose } from "../src/features/music/server/services/sunoBrowserCleanup.js";
const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "vidify-suno-recovery-"));
let cleanupCompleted = false;
await settleSunoBrowserClose(async () => {
  cleanupCompleted = true;
}, 100);
assert.equal(cleanupCompleted, true);
const cleanupStarted = Date.now();
await settleSunoBrowserClose(() => new Promise(() => {}), 20);
assert.ok(Date.now() - cleanupStarted < 1000, "A missing Browser.close reply must not hold the HTTP result open");
await settleSunoBrowserClose(async () => {
  throw new Error("Browser already closed");
}, 100);
process.env.VIDIFY_STORAGE_DIR = scratch;
const savedActivities = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => savedActivities.get(key) || null, setItem: (key: string, value: string) => savedActivities.set(key, value) } });
const { recordWorkflowActivity, getWorkflowActivities } = await import("../src/services/workflowActivity.js");
const input: SunoCreationInput = { songs: Array.from({ length: 25 }, (_, index) => ({ songId: `prompt-${index}`, title: `Title ${index}`, lyrics: `Lyrics ${index}` })), style: "R&B", inspo: "", settings: { weirdness: 45, styleInfluence: 75 }, initialSongIds: [] };
const submitted: number[] = [];
let failIndex = 19;
let playlistFails = false;
let playlistCalls = 0;
const submit = async (_song: any, index: number, persistIds: (ids: string[]) => Promise<void>, begin: () => Promise<void>) => {
  if (index === failIndex) throw new Error("Interrupted before Create");
  await begin();
  submitted.push(index);
  const ids = [randomUUID(), randomUUID()];
  await persistIds(ids);
  return ids;
};
const playlist = async (ids: string[], name: string) => {
  playlistCalls++;
  assert.equal(ids.length, 50);
  assert.equal(name, "Original playlist");
  if (playlistFails) throw new Error("Playlist disconnected");
  return "https://suno.com/playlist/recovered";
};
const adapter = { submit, wait: async () => {}, playlist };
let checkpoint = await openSunoCreationCheckpoint(input, "Original playlist");
await assert.rejects(runSunoCreationCheckpoint(checkpoint, adapter), /Interrupted/);
assert.equal(creationSongIds(checkpoint).length, 38);
assert.equal(checkpoint.songs[19].state, "pending", "No click yet: safe to resume");
checkpoint = await openSunoCreationCheckpoint(input, "Random new suffix");
assert.equal(creationSongIds(checkpoint).length, 38);
failIndex = -1;
playlistFails = true;
await assert.rejects(runSunoCreationCheckpoint(checkpoint, adapter), /Playlist disconnected/);
assert.deepEqual(
  submitted,
  Array.from({ length: 25 }, (_, i) => i),
  "Resume generates only songs 20–25",
);
checkpoint = await openSunoCreationCheckpoint(input, "Another suffix");
playlistFails = false;
const result = await runSunoCreationCheckpoint(checkpoint, adapter);
assert.equal(result.createdSongIds.length, 50);
assert.equal(submitted.length, 25, "Playlist retry does not submit songs again");
assert.equal(playlistCalls, 2);
checkpoint = await openSunoCreationCheckpoint(input, "Completed retry");
await runSunoCreationCheckpoint(checkpoint, {
  ...adapter,
  wait: async () => {
    throw new Error("Should reuse result");
  },
});
assert.equal(playlistCalls, 2, "Completed retry reuses saved result");
assert.equal(sunoCreationKey(input), sunoCreationKey({ ...input, settings: { styleInfluence: 75, weirdness: 45 } }));
assert.notEqual(sunoCreationKey(input), sunoCreationKey({ ...input, testOnly: true }));
assert.notEqual(sunoCreationKey(input), sunoCreationKey({ ...input, style: "Bolero" }));
const uncertainInput = { ...input, style: "uncertain" };
let uncertain = await openSunoCreationCheckpoint(uncertainInput, "Uncertain");
await assert.rejects(
  runSunoCreationCheckpoint(uncertain, {
    ...adapter,
    submit: async (_s, _i, _save, begin) => {
      await begin();
      throw new Error("Process lost after click");
    },
  }),
  /Process lost/,
);
uncertain = await openSunoCreationCheckpoint(uncertainInput, "Different");
await assert.rejects(runSunoCreationCheckpoint(uncertain, adapter), /chưa xác định/);
assert.equal(submitted.length, 25, "Unknown submission must not create duplicates");
const partial = await openSunoCreationCheckpoint({ ...input, style: "partial" }, "Partial");
await assert.rejects(
  runSunoCreationCheckpoint(partial, {
    ...adapter,
    submit: async (_s, _i, save, begin) => {
      await begin();
      await save([randomUUID()]);
      throw new Error("Lost after first ID");
    },
  }),
  /Lost/,
);
assert.equal(creationSongIds(await openSunoCreationCheckpoint({ ...input, style: "partial" }, "Partial")).length, 1);
const corrupt = await openSunoCreationCheckpoint({ ...input, style: "corrupt" }, "Corrupt");
await fs.writeFile(path.join(scratch, "music-creation-checkpoints", `${corrupt.key}.json`), "{broken");
await assert.rejects(openSunoCreationCheckpoint({ ...input, style: "corrupt" }, "Corrupt"), /tránh tạo trùng/);
const legacyInput = { ...input, style: "legacy" };
const legacySongs = input.songs.slice(0, 19).flatMap((song, index) => [0, 1].map(() => ({ songIndex: index + 1, title: `${index + 1}. ${song.title}`, songId: randomUUID() })));
await fs.writeFile(path.join(scratch, "music-creation-checkpoints", "recovered-suno-create-123.json"), JSON.stringify({ songCount: 25, inputSongs: input.songs, songs: legacySongs }));
const legacy = await openSunoCreationCheckpoint(legacyInput, "Legacy");
assert.equal(creationSongIds(legacy).length, 38);
const edited = await openSunoCreationCheckpoint({ ...legacyInput, songs: legacyInput.songs.map((song, i) => (i === 24 ? { ...song, lyrics: "Edited lyrics" } : song)) }, "Edited");
assert.equal(creationSongIds(edited).length, 0, "Legacy recovery requires the entire plan to match");
await saveSunoCreationCheckpoint(legacy);
const app = express();
app.get("/stream", (_req, res) => {
  const report = sunoCreationReporter(res, true);
  report.progress({ phase: "recovered", acceptedSongs: 19, completedSongs: 0, songCount: 25, playlistName: "Original playlist", createdSongIds: result.createdSongIds.slice(0, 38) });
  report.finish({ success: false, error: "fixture failure", generationCheckpoint: true }, 500);
});
app.get("/json", (_req, res) => sunoCreationReporter(res, false).finish({ success: false }, 500));
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
try {
  const origin = `http://127.0.0.1:${(server.address() as any).port}`;
  const progress: any[] = [];
  const streamed = await readSunoCreationResponse(await fetch(`${origin}/stream`), (p) => {
    progress.push(p);
    recordWorkflowActivity("music", WORKFLOW_ACTIVITY_EVENT.musicSunoProgress, undefined, formatSunoCreationProgress(p, "vi"));
  });
  assert.equal(streamed.success, false, "Streamed errors remain errors even with HTTP 200");
  assert.match(formatSunoCreationProgress(progress[0], "vi"), /19\/25.*38 bản/);
  assert.match(getWorkflowActivities()[0].detail!, /19\/25.*38 bản/);
  assert.ok([...savedActivities.values()].some((value) => value.includes("19/25")));
  assert.ok(WORKFLOW_ACTIVITY_TEXT.vi.events.musicSunoProgress);
  assert.ok(WORKFLOW_ACTIVITY_TEXT.en.events.musicSunoProgress);
  assert.equal((await fetch(`${origin}/json`)).status, 500);
  const encoder = new TextEncoder();
  const text = JSON.stringify({ type: "progress", progress: progress[0] }) + "\n";
  const ended = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    }),
    { headers: { "content-type": "application/x-ndjson" } },
  );
  let recoveredIds: string[] = [];
  await assert.rejects(
    readSunoCreationResponse(ended, (p) => {
      recoveredIds = p.createdSongIds;
    }),
    /Tiến độ đã lưu/,
  );
  assert.equal(recoveredIds.length, 38, "Progress survives interrupted response");
  const complete = JSON.stringify({ type: "result", result }) + "\n";
  const split = new Response(
    new ReadableStream({
      start(controller) {
        const bytes = encoder.encode(text + complete);
        for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
        controller.close();
      },
    }),
    { headers: { "content-type": "application/x-ndjson" } },
  );
  assert.equal((await readSunoCreationResponse(split, () => {})).createdSongIds.length, 50);
  console.log("PASS: restart at 19/25 preserves 38 IDs, only creates six missing songs, playlist-only retry, completed reuse, uncertain submission blocked, partial IDs durable, corruption blocked, verified legacy recovery, streamed activity and interrupted/split responses.");
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
