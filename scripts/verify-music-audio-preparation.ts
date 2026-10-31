import assert from "node:assert/strict";
import fs from "node:fs/promises";
import _ from "lodash";
import { transform } from "esbuild";
import * as ST from "../src/constants/sourceText.ts";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";
import { AsyncTaskLimiter } from "../src/lib/asyncTaskLimiter.ts";
import { RUNTIME_TEXT as RT_SERVER } from "../src/constants/runtime/server.ts";
import { RUNTIME_TEXT as RT_SHARED } from "../src/constants/runtime/shared.ts";
import { RUNTIME_TEXT as RT_MUSIC } from "../src/features/music/constants/runtimeText.ts";
import type { MusicDownloadProgress } from "../src/types/musicDownloadProgress.ts";
const source = await fs.readFile("src/server/controllers/pipelineController.ts", "utf8");
const compile = async (code: string, bindings: Record<string, unknown>, result: string) => {
  const executable = (await transform(`(async () => { ${code}\nreturn ${result}; })()`, { loader: "ts", format: "esm" })).code;
  return new Function(...Object.keys(bindings), `return ${executable}`)(...Object.values(bindings));
};
let active = 0;
let peak = 0;
let downloads = 0;
let conversions = 0;
const cached = Buffer.from("cached-mp3");
const bindings = {
  ...ST,
  _,
  SUNO_AUTOMATION_CONFIG,
  SUNO_AUTOMATION_TEXTS,
  AsyncTaskLimiter,
  process: { env: {} },
  C: { EMPTY: "" },
  SUNO_AUTOMATION_PATTERNS: { TRAILING_SLASH: /\/$/ },
  readMusicEvaluationAudio: async (_key: string, id: string) => (id === "cached" ? cached : null),
  readMusicEvaluationWav: async () => null,
  writeMusicEvaluationWav: async (_key: string, id: string) => `${id}.wav`,
  writeMusicEvaluationAudio: async () => {},
  writeSunoCuratedLog: async () => {},
  createSunoEvaluationPreview: async () => {
    conversions++;
    return Buffer.from("full-duration-mp3");
  },
  fetch: async () => {
    downloads++;
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active--;
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  },
  AbortSignal,
  Buffer,
  delayAsync: async () => {},
  logger: { error() {} },
  createAppError: (message: string) => new Error(message),
};
const download = await compile(source.slice(source.indexOf("const sunoAudioPreparationSlots ="), source.indexOf("const readMediaDurationSeconds =")), bindings, "downloadSunoEvaluationAudio");
assert.equal((await download(["cached"], "fixture")).get("cached"), cached);
assert.equal(downloads, 0, "Cached MP3 must work even when WAV is absent");
assert.equal(conversions, 0);
await Promise.all([download(["1", "2", "3"], "fixture"), download(["4", "5", "6"], "fixture")]);
assert.equal(peak, 2, "Audio preparations across concurrent callers must share two slots");
assert.equal(downloads, 6);
await download(["cached"], "fixture", undefined, false);
assert.equal(downloads, 7, "Export must still obtain the WAV original when only MP3 is cached");
assert.equal(conversions, 6, "WAV export must not convert a preview");
const abort = new AbortController();
abort.abort();
await assert.rejects(download(["cancelled"], "fixture", abort.signal));
assert.equal(downloads, 7);
const groupsByChunk = Array.from({ length: 5 }, (_, chunk) => Array.from({ length: 5 }, (_, song) => ({ title: chunk + "-" + song, candidates: [chunk + "-" + song + "-a", chunk + "-" + song + "-b"] })));
const tracks = _.flatMap(groupsByChunk, (groups) => _.flatMap(groups, (group) => group.candidates.map((songId) => ({ songId }))));
const chunks = source.slice(source.indexOf("      report.progress({ phase: RT_SERVER.PREPARING, expected: pendingTrackCount, ready: 0"), source.indexOf("      const rejectedEvaluation ="));
assert.ok(chunks.includes("const evaluationAudio = await downloadSunoEvaluationAudio"));
const runScenario = async (failure?: "audio" | "cancel" | "room") => {
  const events: string[] = [];
  const progress: MusicDownloadProgress[] = [];
  const controller = new AbortController();
  let entered!: () => void, release!: () => void, allEvaluating!: () => void;
  const enteredDownload = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const downloadGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const concurrentEvaluation = new Promise<void>((resolve) => {
    allEvaluating = resolve;
  });
  let active = 0,
    peak = 0;
  const outcome = compile(
    chunks,
    {
      ...ST,
      _,
      AsyncTaskLimiter,
      groupsByChunk,
      pendingGroupsByChunk: groupsByChunk,
      pendingTrackCount: tracks.length,
      cachedTrackChunks: [],
      checkpointKey: "fixture",
      candidateIds: tracks.map((track) => track.songId),
      saveMusicEvaluationSelections: async () => {},
      MUSIC_RECOVERY: {},
      tracks,
      evaluationRunId: "offline",
      audioCacheKey: "fixture",
      planningRun: { signal: controller.signal },
      evaluationProjectId: "offline",
      evaluationWorkerIds: ["room1", "room2", "room3", "room4", "room5"],
      req: { body: { aiExecution: {}, style: "Bolero" } },
      AiPlanningFallbackProvider: { GeminiChat: "gemini-chat" },
      C: { EMPTY: "" },
      SUNO_AUTOMATION_CONFIG,
      RT_SERVER,
      RT_SHARED,
      RT_MUSIC,
      writeSunoCuratedLog: async () => {},
      musicErrorDetails: () => ({}),
      report: { progress: (value: MusicDownloadProgress) => progress.push(value) },
      closeChatPlanningRoom: async () => {},
      downloadSunoEvaluationAudio: async (ids: string[], _key: string, signal: AbortSignal, preview: boolean, onPrepared: (ready: number) => void) => {
        assert.equal(signal, controller.signal);
        assert.equal(ids.length, 50, "Prepare audio for every candidate before opening a room");
        assert.equal(preview, true);
        events.push("download-start");
        onPrepared(20);
        entered();
        await downloadGate;
        if (failure === "audio") throw new Error("Audio download failed");
        events.push("download-complete");
        onPrepared(50);
        if (failure === "cancel") controller.abort();
        return new Map(ids.map((id) => [id, cached]));
      },
      prepareMusicEvaluationRoom: async (request: { workerId: string }) => {
        events.push("open-" + request.workerId);
        if (failure === "room" && request.workerId === "room1") throw new Error("gemini_model_ui_not_ready");
      },
      selectProfessionalSunoTracks: async (groups: (typeof groupsByChunk)[number], _style: string, _room: unknown, audio: Map<string, Buffer>) => {
        assert.equal(audio.size, 50);
        const ids = _.flatMap(groups, (group) => group.candidates);
        assert.equal(ids.length, 10, "Each room still receives five song pairs");
        assert.ok(ids.every((id) => audio.has(id)));
        events.push("evaluate-" + ids[0][0]);
        active++;
        peak = Math.max(peak, active);
        if (active === (failure === "room" ? 4 : 5)) allEvaluating();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            concurrentEvaluation,
            new Promise<never>((_resolve, reject) => {
              timer = setTimeout(() => reject(new Error("Rooms did not evaluate concurrently")), 2000);
            }),
          ]);
          return [];
        } finally {
          clearTimeout(timer);
          active--;
        }
      },
    },
    "evaluationResults",
  ).then(
    (result) => ({ result, error: undefined }),
    (error) => ({ result: undefined, error }),
  );
  await enteredDownload;
  assert.deepEqual(events, ["download-start"], "No Chrome room may open while any audio is still preparing");
  assert.ok(progress.some((value) => value.phase === "preparing" && value.ready === 20 && value.expected === 50));
  release();
  const result = await outcome;
  if (failure === "audio" || failure === "cancel") {
    assert.ok(result.error);
    assert.ok(!events.some((value) => value.startsWith("open-")), "Failed or cancelled audio preparation must not open Chrome");
    return;
  }
  assert.equal(result.error, undefined);
  assert.ok(events.filter((value) => value.startsWith("open-")).length === 5);
  assert.ok(events.indexOf("download-complete") < events.findIndex((value) => value.startsWith("open-")), "All audio must be ready before the first room opens");
  assert.equal(peak, failure === "room" ? 4 : 5);
  const settled = result.result as PromiseSettledResult<unknown>[];
  assert.equal(settled.filter((value) => value.status === "rejected").length, failure === "room" ? 1 : 0);
  if (failure === "room") {
    assert.ok(progress.some((value) => value.room === 1 && value.phase === "evaluation-failed"));
    assert.ok(!progress.some((value) => value.phase === "failed"), "Room startup errors must not be labelled as upload failures");
  }
};
await runScenario();
await runScenario("audio");
await runScenario("cancel");
await runScenario("room");
process.stdout.write("PASS: audio cache, two preparation slots and WAV export preserved; all audio finishes before five concurrent Gemini rooms; download failure/cancel opens no rooms; room errors are not upload errors. No live AI/Suno calls.\n");
