import assert from "node:assert/strict";
import fs from "node:fs/promises";
import _ from "lodash";
import { transform } from "esbuild";
import * as ST from "../src/constants/sourceText.ts";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";
import { AsyncTaskLimiter } from "../src/lib/asyncTaskLimiter.ts";

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
  ...ST, _, SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS, AsyncTaskLimiter,
  process: { env: {} }, C: { EMPTY: "" }, SUNO_AUTOMATION_PATTERNS: { TRAILING_SLASH: /\/$/ },
  readMusicEvaluationAudio: async (_key: string, id: string) => id === "cached" ? cached : null,
  readMusicEvaluationWav: async () => null,
  writeMusicEvaluationWav: async (_key: string, id: string) => `${id}.wav`,
  writeMusicEvaluationAudio: async () => {}, writeSunoCuratedLog: async () => {},
  createSunoEvaluationPreview: async () => { conversions++; return Buffer.from("full-duration-mp3"); },
  fetch: async () => {
    downloads++; active++; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active--;
    return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  },
  AbortSignal, Buffer, delayAsync: async () => {}, logger: { error() {} }, createAppError: (message: string) => new Error(message),
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
const abort = new AbortController(); abort.abort();
await assert.rejects(download(["cancelled"], "fixture", abort.signal));
assert.equal(downloads, 7);

const groupsByChunk = Array.from({ length: 5 }, (_, chunk) => Array.from({ length: 5 }, (_, song) => ({ title: `${chunk}-${song}`, candidates: [`${chunk}-${song}-a`, `${chunk}-${song}-b`] })));
const events: string[] = [];
let evaluationActive = 0, evaluationPeak = 0;
let allEvaluating!: () => void;
const concurrentEvaluation = new Promise<void>((resolve) => { allEvaluating = resolve; });
const chunks = source.slice(source.indexOf("      const chunkPreparationSlots ="), source.indexOf("      const rejectedEvaluation ="));
const results = await compile(chunks, {
  ...ST, _, AsyncTaskLimiter, groupsByChunk, evaluationRunId: "offline", audioCacheKey: "fixture", planningRun: { signal: new AbortController().signal },
  evaluationProjectId: "offline", evaluationWorkerIds: ["room1", "room2", "room3", "room4", "room5"],
  req: { body: { aiExecution: {}, style: "Bolero" } }, AiPlanningFallbackProvider: { GeminiChat: "gemini-chat" }, C: { EMPTY: "" }, SUNO_AUTOMATION_CONFIG,
  writeSunoCuratedLog: async () => {}, musicErrorDetails: () => ({}),
  report: { progress: () => {} }, closeChatPlanningRoom: async () => {},
  downloadSunoEvaluationAudio: async (ids: string[]) => {
    assert.equal(ids.length, 10, "Each evaluation batch retains ten audio files");
    const chunk = ids[0][0]; events.push(`prepare-${chunk}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
    events.push(`prepared-${chunk}`); return new Map(ids.map((id) => [id, cached]));
  },
  prepareChatPlanningRoom: async (request: { workerId: string }) => { events.push(`open-${request.workerId}`); },
  selectProfessionalSunoTracks: async (groups: typeof groupsByChunk[number]) => {
    events.push(`evaluate-${groups[0].candidates[0][0]}`);
    evaluationActive++; evaluationPeak = Math.max(evaluationPeak, evaluationActive);
    if (evaluationActive === 5) allEvaluating();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([concurrentEvaluation, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Five rooms did not evaluate concurrently')), 2000); })]);
      return [];
    } finally { clearTimeout(timer); evaluationActive--; }
  },
}, "evaluationResults");
assert.ok((await results).every((result: PromiseSettledResult<unknown>) => result.status === "fulfilled"));
assert.ok(events.indexOf("evaluate-0") < events.indexOf("prepared-1"), "First evaluation must start before remaining audio is ready");
assert.equal(evaluationPeak, 5, 'All five rooms evaluate before any room finishes');
assert.ok([1, 2, 3, 4, 5].every((room) => events.indexOf(`open-room${room}`) >= 0 && events.indexOf(`open-room${room}`) < events.indexOf('prepared-0')), 'Open all five rooms before the first MP3 batch finishes preparing');
console.log("PASS: real audio preparation reuses cached MP3 without WAV, shares two slots, keeps WAV export, stops cancellation; real chunk orchestration opens five rooms upfront, evaluates all five concurrently, and keeps ten files per batch. No live AI/Suno calls.");
