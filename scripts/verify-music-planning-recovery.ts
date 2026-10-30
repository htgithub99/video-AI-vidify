import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { transform } from "esbuild";
import _ from "lodash";
import * as ST from "../src/constants/sourceText.ts";
import { RUNTIME_TEXT as RT_SERVER } from "../src/constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../src/constants/runtime/shared.js";
import { stringifyJson, parseJson } from "../src/lib/jsonStringify.js";
import { MUSIC_PLANNING as P } from "../src/constants/musicPlanning.ts";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";
import { MUSIC_CREATOR_CONSTANTS } from "../src/constants/refactor.ts";
import { MUSIC_CREATOR_TEXTS } from "../src/constants/texts.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { AiPlanningFallbackProvider } from "../src/types.ts";
import { GEMINI_MODEL_ENCODING } from "../src/constants/geminiChatModels.ts";
import { musicErrorDetails } from "../src/server/services/musicDiagnosticService.ts";
import { compactMusicSongs, musicReviewOrder, readMusicPlanResponse, validMusicEditorialReview } from "../src/lib/musicPlanning.ts";
import { musicPlanReporter } from "../src/features/music/server/services/musicPlanProgress.ts";
import { reviewMusicSongBatch } from "../src/features/music/server/services/musicSongReviewService.ts";
import { confirmChatContextPart, parseChatContextReceipt } from "../src/server/services/chatContextReceipt.ts";
const review = { version: 1, impact: 75, wording: 81, singability: 79, originality: 80, fit: 88, hook: "Nỗi nhớ trong đêm", strength: "Lời tự nhiên", risk: "Cao trào còn nhẹ" };
const songs = Array.from({ length: 30 }, (_, i) => ({
  songId: `song_${String(i + 1).padStart(3, "0")}`,
  title: `Câu Hát Đêm ${i + 1}`,
  lyrics: `[Verse]\n${"Lời ca tự nhiên về một miền quê xa. ".repeat(100)}\n[Chorus]\nTiếng ai gọi bên thềm xưa.\n[Outro]\nVẫn thương người xa.`,
  genre: "Bolero",
  mood: "Hoài niệm",
  tempoBpm: 70,
  structure: ["Verse", "Chorus", "Outro"],
  originalityNotes: ["Câu chuyện và hình ảnh mới"],
  editorialReview: { ...review, impact: 70 + i },
}));
const profile = { market: { country: "Việt Nam", region: "Miền Nam", language: "Vietnamese", dialect: "Miền Nam", audienceAge: "adults", lyricalCharacterAge: "adults", contentSuitability: "general", confidence: 90 }, musicalDna: { rhythm: "Bolero chậm", instrumentation: ["Guitar", "Piano"] }, mustPreserve: ["Câu từ gần gũi"] };
const prompts = {
  ranking: SUNO_AUTOMATION_TEXTS.buildMusicRankingPrompt(30, "ranking", songs, profile),
  rankingRepair: SUNO_AUTOMATION_TEXTS.buildMusicRankingCorrectionPrompt(30, "ranking", songs, profile),
  settings: SUNO_AUTOMATION_TEXTS.buildSunoSettingsPrompt("Bolero", profile, songs, "settings", ""),
  settingsRepair: SUNO_AUTOMATION_TEXTS.buildSunoSettingsCorrectionPrompt("Bolero", profile, songs, "settings", ""),
  seo: SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoPrompt(30, "Bolero", "seo", 5, songs, profile, "Tiêu đề gốc\n" + "Nguồn tham khảo. ".repeat(4000)),
  seoRepair: SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt(songs, "Bolero", 5, "seo", [], profile, "Nguồn. ".repeat(4000)),
  seoRegenerate: SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoRegenerationPrompt(songs, "Bolero", "seo", 5, profile),
};
for (const [name, prompt] of Object.entries(prompts)) {
  assert.ok(prompt.length < 23000, `${name}: prompt must fit one chat message (${prompt.length})`);
  assert.ok(!prompt.includes(songs[0].lyrics), `${name}: must not resend complete lyrics`);
  for (const song of songs) assert.ok(prompt.includes(song.title), `${name}: missing song`);
}
assert.equal(compactMusicSongs(songs).length, 30);
assert.equal(musicReviewOrder(songs)[0].songId, "song_030");
const receipt = { artifactType: CINEMATIC_CHAT_PLANNING_CONFIG.CONTEXT_ARTIFACT, requestId: "part_3", receivedPart: 3 };
assert.deepEqual(parseChatContextReceipt('{"artifactType":"chat-planning-context","requestId":"part_3","received' + JSON.stringify(receipt)), receipt);
const sent: string[] = [];
await confirmChatContextPart("source part", "part_3", 3, async (question) => {
  sent.push(question);
  if (sent.length === 1) throw new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR);
  return receipt;
});
assert.equal(sent.length, 2);
assert.equal(sent[1], CINEMATIC_CHAT_PLANNING_CONFIG.CONTEXT_ACK_REPAIR("part_3", 3));
let repairedCalls = 0;
const missingReviews = songs.slice(0, 2).map(({ editorialReview, ...song }) => song);
const reviewed = await reviewMusicSongBatch(
  missingReviews,
  profile,
  "reviews",
  async (prompt, artifact, id) => {
    repairedCalls++;
    assert.equal(prompt.includes(missingReviews[0].songId), repairedCalls === 1);
    return { text: JSON.stringify({ artifactType: artifact, requestId: id, reviews: [{ songId: missingReviews[repairedCalls - 1].songId, editorialReview: review }] }) };
  },
  new AbortController().signal,
  () => true,
);
assert.equal(repairedCalls, 2);
assert.ok(reviewed.every((song) => validMusicEditorialReview(song.editorialReview)));
assert.equal(reviewed[0].lyrics, missingReviews[0].lyrics);
const code = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const selectionError = Object.assign(new Error(GEMINI_MODEL_ENCODING.UNAVAILABLE("gemini-argon::high")), { [GEMINI_MODEL_ENCODING.DIAGNOSTICS]: { phase: "thinking_level" } });
assert.equal(musicErrorDetails(selectionError)[GEMINI_MODEL_ENCODING.DIAGNOSTIC_PHASE], "thinking_level");
assert.equal(SUNO_AUTOMATION_TEXTS.MUSIC_ROOM_NON_RETRYABLE_ERROR.test(selectionError.message), true);
const route = code.slice(code.indexOf("router.post(ROUTER_PATHS.MUSIC_PLAN,"), code.indexOf("router.post(ROUTER_PATHS.MUSIC_SEO_REGENERATE,"));
const executable = (await transform(route, { loader: "ts", format: "cjs" })).code;
const checkpoints = new Map();
async function run(streaming: boolean, rankingFails = false, seoFails = false, failBatch = false, cancelRanking = false, cancelSeo = false, legacy = false, smallerBatch = 0, unavailable = false, songCount = 10) {
  let handler: any;
  const requested = songs.slice(0, songCount).map((song) => structuredClone(song));
  const requestId = `test-${streaming}-${rankingFails}-${seoFails}-${failBatch}-${cancelRanking}-${cancelSeo}-${legacy}-${smallerBatch}-${unavailable}-${songCount}`;
  if (legacy) checkpoints.set(requestId, { signature: JSON.stringify([requested.length, "Bolero", [], "", AiPlanningFallbackProvider.GeminiChat, undefined]), updatedAt: Date.now(), styleAnalysis: profile, batches: new Map(_.range(1, requested.length + 1, 3).map((start) => [start, requested.slice(start - 1, start + 2).map(({ editorialReview, ...song }) => song)])) });
  const controller = new AbortController();
  const calls: any[] = [];
  const preparedRooms: string[] = [];
  let activeCompositions = 0;
  let maxActiveCompositions = 0;
  const mockReq: any = new EventEmitter();
  mockReq.body = { streamProgress: streaming };
  const response: any = new EventEmitter();
  const events: any[] = [];
  response.setHeader = () => {};
  response.flushHeaders = () => {};
  response.write = (value: string) => {
    if (value.trim()) events.push(JSON.parse(value));
    return true;
  };
  response.status = (status: number) => {
    response.statusCode = status;
    return response;
  };
  response.json = (result: any) => {
    response.result = result;
    response.end();
  };
  response.end = () => {
    response.writableEnded = true;
    response.emit("finish");
  };
  const context: any = {
    RT_SERVER,
    RT_SHARED,
    stringifyJson,
    parseJson,
    ...ST,
    _,
    SUNO_AUTOMATION_CONFIG,
    SUNO_AUTOMATION_TEXTS,
    MUSIC_CREATOR_CONSTANTS,
    MUSIC_CREATOR_TEXTS,
    CINEMATIC_CHAT_PLANNING_CONFIG,
    AiPlanningFallbackProvider,
    MUSIC_PLAN: P,
    musicPlanReporter,
    validMusicEditorialReview,
    musicReviewOrder,
    reviewMusicSongBatch,
    router: { post: (_path: string, callback: any) => (handler = callback) },
    ROUTER_PATHS: { MUSIC_PLAN: "/music-plan" },
    C: { EMPTY: "" },
    HttpStatus: { BAD_REQUEST: 400, INTERNAL_SERVER_ERROR: 500 },
    jsonUtils: {
      safeStringify: JSON.stringify,
      safeParse: (value: string, fallback: any) => {
        try {
          return JSON.parse(value);
        } catch {
          return fallback;
        }
      },
    },
    musicPlanCheckpoints: checkpoints,
    activeMusicPlanCleanup: new Map(),
    activeMusicPlanRuns: 0,
    parseAndValidateMusicPlanRequest: () => ({ isValid: true, payload: { requestedSongCount: requested.length, style: "Bolero", referenceSongs: [], projectId: requestId, requestId, sunoInspo: "", execution: { provider: AiPlanningFallbackProvider.GeminiChat } } }),
    writeMusicDiagnostic: async () => {},
    musicErrorDetails: () => ({}),
    logger: { warn() {}, error() {} },
    createAppError: (message: string) => new Error(message),
    beginChatPlanningRun: () => ({ signal: controller.signal, cancel: () => controller.abort(), complete: () => {} }),
    closeChatPlanningRoomsForProject: async () => {},
    scheduleGlobalBrowserCleanup() {},
    closeChatBrowserIfIdle: async () => {},
    prepareChatPlanningRoom: async (request: any) => {
      preparedRooms.push(request.workerId);
    },
    isRetryableMusicRoomError: (error: any) => !controller.signal.aborted && error.message !== "fatal-batch" && error.code !== CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE && !SUNO_AUTOMATION_TEXTS.MUSIC_ROOM_NON_RETRYABLE_ERROR.test(error.message),
    validateMusicStyleAnalysisContract: (value: any) => !!value?.market,
    getMusicStyleAnalysisContractIssues: () => [],
    validateMusicPlanSongContract: (value: any, count: number, start = 1) => value?.songs?.length === count && value.songs.every((song: any, i: number) => song.songId === requested[start + i - 1].songId),
    getMusicPlanSongContractIssues: () => [],
    validateMusicSongRankingContract: (value: any) => value?.orderedSongIds?.length === requested.length && new Set(value.orderedSongIds).size === requested.length && value.orderedSongIds.every((id: string) => requested.some((song) => song.songId === id)),
    validateSunoSettingsContract: (value: any) => !!value?.settings,
    hasUsableSunoSettingsResult: (value: any) => !!value?.settings,
    validateMusicPlaylistSeoContract: (value: any) => !!value?.seoOptions?.length,
    getMusicPlaylistSeoContractIssues: () => [],
    generatePlanningWithChatUi: async (request: any) => {
      calls.push(request);
      controller.signal.throwIfAborted();
      const answer: any = { artifactType: request.artifactType, requestId: request.requestId };
      if (request.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS) Object.assign(answer, profile);
      else if (request.artifactType === MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE) {
        const start = Number(request.requestId.match(/_batch_(\d+)/)[1]);
        const range = request.prompt.match(/songs (\d+)-(\d+)/)!;
        const count = Number(range[2]) - Number(range[1]) + 1;
        if (failBatch && start > 3) throw new Error("fatal-batch");
        if (unavailable && start > 3) throw new Error(GEMINI_MODEL_ENCODING.UNAVAILABLE("gemini-argon::high"));
        activeCompositions++;
        maxActiveCompositions = Math.max(maxActiveCompositions, activeCompositions);
        await new Promise((resolve) => setTimeout(resolve, start === 1 ? 1 : 8));
        activeCompositions--;
        answer.songs = smallerBatch && count > smallerBatch ? [] : requested.slice(start - 1, start - 1 + count);
      } else if (request.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING) {
        if (cancelRanking) {
          controller.abort();
          controller.signal.throwIfAborted();
        }
        answer.orderedSongIds = rankingFails ? ["wrong"] : [...requested].reverse().map((song) => song.songId);
      } else if (request.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS) answer.settings = { weirdness: 35 };
      else if (request.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO) {
        if (cancelSeo) {
          controller.abort();
          controller.signal.throwIfAborted();
        }
        if (seoFails) throw new Error("seo-unavailable");
        answer.seoOptions = [{ title: "Playlist hoàn chỉnh" }];
      } else if (request.artifactType === P.REVIEW_ARTIFACT) answer.reviews = requested.filter((song) => request.prompt.includes(song.songId)).map((song) => ({ songId: song.songId, editorialReview: song.editorialReview }));
      else throw new Error("Unexpected artifact " + request.artifactType);
      return { text: JSON.stringify(answer), provider: request.provider };
    },
  };
  new Function(...Object.keys(context), executable)(...Object.values(context));
  await handler(mockReq, response);
  const result = streaming ? events.find((event) => event.type === "result")?.result : response.result;
  if (failBatch || cancelRanking || cancelSeo || unavailable) {
    assert.equal(result.success, false);
    const partial = events.filter((event) => event.data?.songs?.length).at(-1);
    assert.ok(partial?.data.songs.length > 0, "Failures must retain completed songs");
    if (cancelRanking) assert.ok(!calls.some((call) => call.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS), "Cancellation must not fall through to settings");
    if (unavailable) {
      assert.ok(result.error.includes(GEMINI_MODEL_ENCODING.UNAVAILABLE_CODE), "Preserve the actual model selection error");
      assert.equal(calls.filter((call) => call.requestId.includes("_batch_4")).length, 1, "Unavailable model must not retry or split batches");
      assert.equal(partial.data.songs.length, 3, "Keep the completed batch");
    }
  } else {
    if (legacy) {
      assert.ok(!calls.some((call) => call.artifactType === MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE), "Existing checkpoint lyrics must never be recomposed for missing reviews");
      assert.equal(calls.filter((call) => call.artifactType === P.REVIEW_ARTIFACT).length, Math.ceil(requested.length / 3));
    }
    assert.equal(result.success, true);
    assert.equal(result.data.songs.length, requested.length);
    for (const song of result.data.songs) assert.equal(song.lyrics, requested.find((original) => original.songId === song.songId)!.lyrics);
    assert.equal(result.data.songs[0].songId, requested.at(-1)!.songId);
    assert.equal(new Set(result.data.songs.map((song: any) => song.songId)).size, requested.length);
    assert.ok(result.data.sunoSettings);
    assert.equal(result.data.playlistSeoOptions.length, seoFails ? 0 : 1);
    if (seoFails) assert.ok(result.data.seoWarning);
    if (streaming) {
      assert.ok(events.findIndex((event) => event.data?.songs?.length > 0) < events.findIndex((event) => event.progress?.stage === P.STAGES.RANKING));
      assert.equal(events.filter((event) => event.type === "progress").at(-1).progress.completedSongs, requested.length);
      const wire = events.map((event) => JSON.stringify(event)).join("\n");
      const bytes = new TextEncoder().encode(wire);
      const stream = new ReadableStream({
        start(output) {
          for (let i = 0; i < bytes.length; i += 17) output.enqueue(bytes.slice(i, i + 17));
          output.close();
        },
      });
      const seen: any[] = [];
      const decoded = await readMusicPlanResponse(new Response(stream, { headers: { "content-type": P.STREAM_TYPE } }), (event) => seen.push(event));
      assert.deepEqual(decoded, result);
      assert.ok(seen.some((event) => event.data?.songs?.[0]?.title === requested[0].title));
    }
  }
  return { result, calls, events, requestId, preparedRooms, maxActiveCompositions };
}
const normal = await run(true);
const batchCalls = normal.calls.filter((call) => call.artifactType === MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE);
assert.equal(batchCalls.length, 4);
assert.deepEqual(normal.preparedRooms, [SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, SUNO_AUTOMATION_CONFIG.MUSIC_SECOND_ROOM_WORKER_TYPE, SUNO_AUTOMATION_CONFIG.MUSIC_THIRD_ROOM_WORKER_TYPE]);
assert.equal(new Set(batchCalls.map((call) => call.workerId)).size, 3, "Three independent rooms must compose songs");
assert.equal(normal.maxActiveCompositions, 3, "Three rooms must compose concurrently");
for (const call of batchCalls) assert.match(call.prompt, /exactly [13] original songs/);
assert.equal(batchCalls.filter((call) => /exactly 3 original songs/.test(call.prompt)).length, 3);
for (const count of [1, 3, 6, 9, 30]) {
  const runResult = await run(true, false, false, false, false, false, false, 0, false, count);
  assert.equal(runResult.preparedRooms.length, Math.min(3, Math.ceil(count / 3)));
  assert.equal(runResult.maxActiveCompositions, Math.min(3, Math.ceil(count / 3)));
}
await run(false);
await run(true, true, true);
await run(true, false, false, true);
await run(true, false, false, false, true);
await run(true, false, false, false, false, true);
await run(true, false, false, false, false, false, true);
for (const limit of [2, 1]) {
  const fallback = await run(true, false, false, false, false, false, false, limit);
  const sizes = fallback.calls
    .filter((call) => call.artifactType === MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE)
    .map((call) => {
      const match = call.prompt.match(/songs (\d+)-(\d+)/)!;
      return Number(match[2]) - Number(match[1]) + 1;
    });
  assert.ok(sizes.includes(3) && sizes.includes(2) && sizes.includes(limit));
}
await run(true, false, false, false, false, false, false, 0, true);
await assert.rejects(
  readMusicPlanResponse(new Response('{"type":"progress","progress":{"stage":"writing"}}\n', { headers: { "content-type": P.STREAM_TYPE } }), () => {}),
  { message: P.STREAM_ENDED },
);
console.log("Music planning passed: three songs per room, three concurrent rooms, 1/3/6/9/10/30-song coverage, 3→2→1 batch recovery, unavailable model stops once with its actual cause, 30-song bounded prompts, streaming partial lyrics/UTF-8, JSON compatibility, ranking fallback, optional SEO failure, cancellation and receipt/partial review recovery. No live AI or Suno requests.");
console.log(JSON.stringify(Object.fromEntries(Object.entries(prompts).map(([name, prompt]) => [name, prompt.length]))));
