import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { transform } from "esbuild";
import _ from "lodash";
import * as ST from "../src/constants/sourceText.ts";
import { MUSIC_PLANNING as P } from "../src/constants/musicPlanning.ts";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";
import { MUSIC_CREATOR_CONSTANTS } from "../src/constants/refactor.ts";
import { MUSIC_CREATOR_TEXTS } from "../src/constants/texts.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { AiPlanningFallbackProvider } from "../src/types.ts";
import { compactMusicSongs, musicReviewOrder, readMusicPlanResponse, validMusicEditorialReview } from "../src/lib/musicPlanning.ts";
import { musicPlanReporter } from "../src/server/services/musicPlanProgress.ts";
import { reviewMusicSongBatch } from "../src/server/services/musicSongReviewService.ts";
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
const route = code.slice(code.indexOf("router.post(ROUTER_PATHS.MUSIC_PLAN,"), code.indexOf("router.post(ROUTER_PATHS.MUSIC_SEO_REGENERATE,"));
const executable = (await transform(route, { loader: "ts", format: "cjs" })).code;
const checkpoints = new Map();
async function run(streaming: boolean, rankingFails = false, seoFails = false, failBatch = false, cancelRanking = false, cancelSeo = false, legacy = false) {
  let handler: any;
  const requested = songs.slice(0, 5).map((song) => structuredClone(song));
  const requestId = `test-${streaming}-${rankingFails}-${seoFails}-${failBatch}-${cancelRanking}-${cancelSeo}-${legacy}`;
  if (legacy) checkpoints.set(requestId, { signature: JSON.stringify([5, "Bolero", [], "", AiPlanningFallbackProvider.GeminiChat, undefined]), updatedAt: Date.now(), styleAnalysis: profile, batches: new Map([1, 3, 5].map((start) => [start, requested.slice(start - 1, start + 1).map(({ editorialReview, ...song }) => song)])) });
  const controller = new AbortController();
  const calls: any[] = [];
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
    parseAndValidateMusicPlanRequest: () => ({ isValid: true, payload: { requestedSongCount: 5, style: "Bolero", referenceSongs: [], projectId: requestId, requestId, sunoInspo: "", execution: { provider: AiPlanningFallbackProvider.GeminiChat } } }),
    writeMusicDiagnostic: async () => {},
    musicErrorDetails: () => ({}),
    logger: { warn() {}, error() {} },
    createAppError: (message: string) => new Error(message),
    beginChatPlanningRun: () => ({ signal: controller.signal, cancel: () => controller.abort(), complete: () => {} }),
    closeChatPlanningRoomsForProject: async () => {},
    scheduleGlobalBrowserCleanup() {},
    closeChatBrowserIfIdle: async () => {},
    prepareChatPlanningRoom: async () => {},
    isRetryableMusicRoomError: (error: any) => !controller.signal.aborted && error.message !== "fatal-batch",
    validateMusicStyleAnalysisContract: (value: any) => !!value?.market,
    getMusicStyleAnalysisContractIssues: () => [],
    validateMusicPlanSongContract: (value: any, count: number, start = 1) => value?.songs?.length === count && value.songs.every((song: any, i: number) => song.songId === requested[start + i - 1].songId),
    getMusicPlanSongContractIssues: () => [],
    validateMusicSongRankingContract: (value: any) => value?.orderedSongIds?.length === 5 && new Set(value.orderedSongIds).size === 5 && value.orderedSongIds.every((id: string) => requested.some((song) => song.songId === id)),
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
        if (failBatch && start > 2) throw new Error("fatal-batch");
        await new Promise((resolve) => setTimeout(resolve, start === 1 ? 1 : 8));
        answer.songs = requested.slice(start - 1, start + 1);
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
  if (failBatch || cancelRanking || cancelSeo) {
    assert.equal(result.success, false);
    const partial = events.filter((event) => event.data?.songs?.length).at(-1);
    assert.ok(partial?.data.songs.length > 0, "Failures must retain completed songs");
    if (cancelRanking) assert.ok(!calls.some((call) => call.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS), "Cancellation must not fall through to settings");
  } else {
    if (legacy) {
      assert.ok(!calls.some((call) => call.artifactType === MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE), "Existing checkpoint lyrics must never be recomposed for missing reviews");
      assert.equal(calls.filter((call) => call.artifactType === P.REVIEW_ARTIFACT).length, 3);
    }
    assert.equal(result.success, true);
    assert.equal(result.data.songs.length, 5);
    for (const song of result.data.songs) assert.equal(song.lyrics, requested.find((original) => original.songId === song.songId)!.lyrics);
    assert.equal(result.data.songs[0].songId, "song_005");
    assert.ok(result.data.sunoSettings);
    assert.equal(result.data.playlistSeoOptions.length, seoFails ? 0 : 1);
    if (seoFails) assert.ok(result.data.seoWarning);
    if (streaming) {
      assert.ok(events.findIndex((event) => event.data?.songs?.length > 0) < events.findIndex((event) => event.progress?.stage === P.STAGES.RANKING));
      assert.equal(events.filter((event) => event.type === "progress").at(-1).progress.completedSongs, 5);
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
  return { result, calls, events, requestId };
}
await run(true);
await run(false);
await run(true, true, true);
await run(true, false, false, true);
await run(true, false, false, false, true);
await run(true, false, false, false, false, true);
await run(true, false, false, false, false, false, true);
await assert.rejects(
  readMusicPlanResponse(new Response('{"type":"progress","progress":{"stage":"writing"}}\n', { headers: { "content-type": P.STREAM_TYPE } }), () => {}),
  { message: P.STREAM_ENDED },
);
console.log("Music planning passed: 30-song bounded prompts, 2-room production route, streaming partial lyrics/UTF-8, JSON compatibility, ranking fallback, optional SEO failure, cancellation and receipt/partial review recovery. No live AI or Suno requests.");
console.log(JSON.stringify(Object.fromEntries(Object.entries(prompts).map(([name, prompt]) => [name, prompt.length]))));
