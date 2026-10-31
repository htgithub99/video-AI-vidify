import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build, transform } from "esbuild";
import _ from "lodash";
import * as ST from "../src/constants/sourceText.js";
import { SUNO_AUTOMATION_CONFIG } from "../src/constants/sunoAutomation.js";
import { MUSIC_DOWNLOAD_RECOVERY as R } from "../src/features/music/constants/musicDownloadRecovery.js";
import { RUNTIME_TEXT as RT_SERVER } from "../src/constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../src/constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MUSIC } from "../src/features/music/constants/runtimeText.js";
import { AsyncTaskLimiter } from "../src/lib/asyncTaskLimiter.js";
import { musicErrorDetails } from "../src/server/services/musicDiagnosticService.js";
await fs.mkdir("scratch", { recursive: true });
const root = await fs.mkdtemp(path.resolve("scratch/music-download-recovery-"));
const oldStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
const checkpoints = await import("../src/features/music/server/services/musicDownloadCheckpointService.js");
try {
  const groupsByChunk = Array.from({ length: 5 }, (_, chunk) => Array.from({ length: 5 }, (_, song) => ({ title: `${chunk}-${song}`, candidates: [`${chunk}-${song}-a`, `${chunk}-${song}-b`] })));
  const candidateIds = groupsByChunk.flatMap((groups) => groups.flatMap((group) => group.candidates));
  const checkpointKey = checkpoints.createMusicDownloadCheckpointKey("https://suno.com/playlist/offline", candidateIds, "R&B", "gemini-flash::medium");
  assert.notEqual(checkpointKey, checkpoints.createMusicDownloadCheckpointKey("https://suno.com/playlist/offline", candidateIds, "R&B", "gemini-flash::medium", { groove: "different" }));
  const source = await fs.readFile("src/server/controllers/pipelineController.ts", "utf8");
  const snippet = source.slice(source.indexOf("      const savedEvaluation ="), source.indexOf("      const selectedTrackChunks ="));
  assert.ok(snippet.includes("saveMusicEvaluationSelections"));
  const evaluated: number[] = [],
    opened: number[] = [],
    prepared: number[] = [];
  const progress: any[] = [];
  const run = async (fail: number[]) => {
    const controller = new AbortController();
    const bindings = {
      ...ST,
      _,
      ...checkpoints,
      SUNO_AUTOMATION_CONFIG,
      AsyncTaskLimiter,
      MUSIC_RECOVERY: R,
      RT_SERVER,
      RT_SHARED,
      RT_MUSIC,
      C: { EMPTY: "" },
      AiPlanningFallbackProvider: { GeminiChat: "gemini-chat" },
      groupsByChunk,
      candidateIds,
      checkpointKey,
      tracks: candidateIds.map((songId) => ({ songId })),
      evaluationWorkerIds: groupsByChunk.map((_groups, index) => `room-${index}`),
      evaluationRunId: "offline",
      evaluationProjectId: "offline",
      audioCacheKey: "offline",
      planningRun: { signal: controller.signal },
      req: { body: { aiExecution: { model: "gemini-flash::medium" }, style: "R&B" } },
      writeSunoCuratedLog: async () => {},
      musicErrorDetails,
      report: { progress: (event: unknown) => progress.push(event) },
      closeChatPlanningRoom: async () => {},
      downloadSunoEvaluationAudio: async (ids: string[]) => {
        prepared.push(ids.length);
        return new Map(ids.map((id) => [id, Buffer.from("cached")]));
      },
      prepareMusicEvaluationRoom: async (request: { workerId: string }) => {
        opened.push(Number(request.workerId.split("-")[1]));
      },
      selectProfessionalSunoTracks: async (groups: (typeof groupsByChunk)[number]) => {
        const index = Number(groups[0].title.split("-")[0]);
        evaluated.push(index);
        if (fail.includes(index)) throw new Error("offline-room-failure");
        await new Promise((resolve) => setTimeout(resolve, index));
        return groups.map((group) => ({ songId: group.candidates[0], title: group.title, qualityScore: 90 }));
      },
    };
    const executable = (await transform(`(async () => { ${snippet}; return evaluationResults; })()`, { loader: "ts", format: "esm" })).code;
    return new Function(...Object.keys(bindings), `return ${executable}`)(...Object.values(bindings));
  };
  await assert.rejects(run([1, 4]), /offline-room-failure/);
  const partial = await checkpoints.readMusicEvaluationCheckpoint(checkpointKey, candidateIds);
  assert.equal(partial?.selectedTracks.length, 15, "All three successful groups persist despite two failures");
  assert.equal(await checkpoints.readMusicDownloadCheckpoint(checkpointKey, candidateIds), null, "Partial evaluation cannot be exported as a complete download");
  assert.deepEqual(evaluated.sort(), [0, 1, 2, 3, 4]);
  evaluated.length = opened.length = 0;
  await run([]);
  assert.deepEqual(evaluated.sort(), [1, 4], "Retry evaluates only missing groups");
  assert.deepEqual(opened.sort(), [1, 4], "Cached groups open no browser rooms");
  assert.deepEqual(prepared, [50, 20], "Resume prepares audio only for missing groups");
  assert.equal((await checkpoints.readMusicEvaluationCheckpoint(checkpointKey, candidateIds))?.selectedTracks.length, 25);
  assert.equal(progress.filter((event) => event.message === R.SELECTION_RESUMED).length, 3);
  evaluated.length = opened.length = 0;
  await run([]);
  assert.equal(evaluated.length + opened.length, 0, "All cached results require no AI or rooms");
  const savedBytes = await fs.readFile(path.join(root, "music-download-checkpoints", checkpointKey + ".evaluation.json"), "utf8");
  await assert.rejects(checkpoints.saveMusicEvaluationSelections(checkpointKey, candidateIds, [{ songId: candidateIds[0], title: "bad", qualityScore: 101 }]));
  await assert.rejects(
    checkpoints.saveMusicEvaluationSelections(
      checkpointKey,
      candidateIds,
      candidateIds.slice(0, 2).map((songId) => ({ songId, title: "same-pair", qualityScore: 90 })),
    ),
  );
  assert.equal(await fs.readFile(path.join(root, "music-download-checkpoints", checkpointKey + ".evaluation.json"), "utf8"), savedBytes);
  assert.equal(await checkpoints.readMusicEvaluationCheckpoint(checkpointKey, [...candidateIds].reverse()), null);
  const harness = { calls: new Map<string, number>(), closed: [] as string[], active: 0, peak: 0, fail: 0, terminal: false, abort: undefined as AbortController | undefined };
  (globalThis as any).__musicRecovery = harness;
  const bundle = await build({
    entryPoints: ["src/features/music/server/services/musicEvaluationRoomService.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    packages: "external",
    plugins: [
      {
        name: "offline-rooms",
        setup(builder) {
          builder.onResolve({ filter: /chatUiPlanningService\.js$/ }, () => ({ path: "rooms", namespace: "offline" }));
          builder.onResolve({ filter: /chatUploadRecovery\.js$/ }, () => ({ path: "wait", namespace: "offline" }));
          builder.onLoad({ filter: /.*/, namespace: "offline" }, (args) => ({
            loader: "js",
            contents:
              args.path === "wait"
                ? "export const waitForMusicEvaluationRetry = async () => {};"
                : `
      export const closeChatPlanningRoom = async request => { globalThis.__musicRecovery.closed.push(request.workerId); };
      export const prepareChatPlanningRoom = async request => {
        const h = globalThis.__musicRecovery;
        const count = (h.calls.get(request.workerId) || 0) + 1;
        h.calls.set(request.workerId, count); h.active++; h.peak = Math.max(h.peak, h.active);
        try {
          await new Promise(resolve => setTimeout(resolve, 5));
          if (h.abort) { h.abort.abort(); throw new Error('gemini_model_ui_not_ready'); }
          if (h.terminal) throw new Error('gemini_thinking_unavailable');
          if (count <= h.fail) throw new Error('gemini_model_ui_not_ready: page_ready');
        } finally { h.active--; }
      };
    `,
          }));
        },
      },
    ],
  });
  const modulePath = path.join(root, "rooms.mjs");
  await fs.writeFile(modulePath, bundle.outputFiles[0].text);
  const { prepareMusicEvaluationRoom } = await import(pathToFileURL(modulePath).href);
  const request = (workerId: string, signal?: AbortSignal) => ({ provider: "gemini-chat", prompt: "", projectId: "offline", workerId, signal, model: "gemini-flash::medium" });
  const retries: number[] = [];
  harness.fail = 2;
  await prepareMusicEvaluationRoom(request("recover"), async (_error: unknown, attempt: number) => {
    retries.push(attempt);
  });
  assert.deepEqual(retries, [2, 3]);
  assert.equal(harness.calls.get("recover"), 3);
  harness.fail = 10;
  await assert.rejects(
    prepareMusicEvaluationRoom(request("bounded"), async () => {}),
    /gemini_model_ui_not_ready/,
  );
  assert.equal(harness.calls.get("bounded"), R.ROOM_ATTEMPTS);
  harness.fail = 0;
  harness.terminal = true;
  await assert.rejects(
    prepareMusicEvaluationRoom(request("terminal"), async () => {}),
    /gemini_thinking_unavailable/,
  );
  assert.equal(harness.calls.get("terminal"), 1);
  harness.terminal = false;
  harness.abort = new AbortController();
  await assert.rejects(prepareMusicEvaluationRoom(request("cancelled", harness.abort.signal), async () => {}));
  assert.equal(harness.calls.get("cancelled"), 1);
  harness.abort = undefined;
  let activeEvaluation = 0,
    peakEvaluation = 0,
    release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await Promise.all(
    Array.from({ length: 5 }, async (_value, index) => {
      await prepareMusicEvaluationRoom(request(`parallel-${index}`), async () => {});
      activeEvaluation++;
      peakEvaluation = Math.max(peakEvaluation, activeEvaluation);
      if (activeEvaluation === 5) release();
      await gate;
      activeEvaluation--;
    }),
  );
  assert.equal(harness.peak, 1, "Bootstrap is serialized");
  assert.equal(peakEvaluation, 5, "Evaluation retains five simultaneous rooms");
  process.stdout.write("PASS: startup recovery/cancellation/terminal failures; serialized bootstrap with five evaluations; partial results survive group failures, resume only missing audio/AI, validate atomic checkpoint writes. Offline only.\n");
} finally {
  delete (globalThis as any).__musicRecovery;
  if (oldStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = oldStorage;
  await fs.rm(root, { recursive: true, force: true });
}
