import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MUSIC_PLANNING as P, MUSIC_SUNO_STYLE_FORMAT_EXAMPLE, MUSIC_STYLE_TITLE_GUIDANCE, MUSIC_STYLE_TITLE_LIMITS } from "../src/constants/musicPlanning.ts";
import { MUSIC_CREATOR_TEXTS } from "../src/constants/texts.ts";
import { SUNO_AUTOMATION_CONFIG } from "../src/constants/sunoAutomation.ts";
import { SUNO_AUTOMATION_TEXTS } from "../src/constants/sunoAutomation.ts";
import { MUSIC_CREATION_OPTIONS as O } from "../src/features/music/constants/musicCreationOptions.ts";
import { createAnalyzedMusicStyle, mergeAnalyzedMusicStyle, normalizeAnalyzedMusicStyleContent } from "../src/features/music/lib/musicStyleLibrary.ts";
import type { MusicStyleAnalysis } from "../src/types/musicPlanning.ts";
const sourceProfile: MusicStyleAnalysis = {
  title: "Dân ca mộc",
  sunoStylePrompt: "Contemporary Vietnamese folk, acoustic ballad, gentle slow groove, 75 BPM, dan bau, acoustic guitar, warm soft vocals, sparse organic arrangement",
  market: { country: "Việt Nam", region: "Miền Bắc", language: "Tiếng Việt", dialect: "Bắc", audienceAge: "Người lớn", lyricalCharacterAge: "Trưởng thành", contentSuitability: "Phổ thông", confidence: 85 },
  genre: { primary: "Dân ca đương đại", secondary: ["Acoustic"], influences: [] },
  era: { songwritingEra: "Đương đại", productionEra: "Hiện đại" },
  musicalDna: { tempoRange: "70–80 BPM", rhythm: "Nhịp chậm, mềm", harmony: "Hòa âm mộc", melodicLanguage: "Câu hát dài", hookPlacement: "Điệp khúc", songForms: ["Verse", "Chorus"], instrumentation: ["Đàn bầu", "Guitar mộc"], vocalCharacter: "Ấm, nhẹ", listeningContext: "Nghe thư giãn" },
  lyricalDna: { themes: ["Quê hương"], narrativeVoice: "Tự sự", vocabulary: "Mộc mạc", imagery: ["Bến sông"], rhymeBehavior: "Vần tự nhiên" },
  creativeProfile: { role: "Người kể chuyện bằng nhạc", strengths: ["Gần gũi"], writingPrinciples: ["Lời mới, dễ hát"], productionPrinciples: ["Phối khí thưa"] },
  historicalInfluences: [],
  mustPreserve: ["Âm sắc nhạc cụ mộc"],
  mustVary: ["Câu chuyện từng bài"],
  mustNotCopy: ["Không chép giai điệu hay lời nguồn"],
  uncertainties: ["Âm sắc giọng cần xác minh nếu chỉ có lời bài hát"],
};
const learnedStyle = createAnalyzedMusicStyle(sourceProfile)!;
assert.equal(learnedStyle.title, sourceProfile.title);
assert.equal(createAnalyzedMusicStyle({ ...sourceProfile, title: undefined })!.title, "Dân ca đương đại");
assert.equal(createAnalyzedMusicStyle({ title: "Tên phong cách: “R&B đêm khuya”", sunoStylePrompt: "Alternative R&B, nocturnal mood" })!.title, "R&B đêm khuya");
assert.equal(createAnalyzedMusicStyle({ title: "Bolero trữ tình_1", sunoStylePrompt: "Vietnamese bolero, warm vocals" })!.title, "Bolero trữ tình");
assert.equal(createAnalyzedMusicStyle({ title: "Bolero trữ tình · 76 BPM", sunoStylePrompt: "Vietnamese bolero, warm vocals" })!.title, "Bolero trữ tình");
assert.equal(createAnalyzedMusicStyle({ title: "76 BPM", sunoStylePrompt: "Vietnamese bolero, warm vocals" })!.title, "Vietnamese bolero");
const longNamedStyle = createAnalyzedMusicStyle({ title: "Dân ca Nghệ Tĩnh trữ tình da diết với giọng nữ và đàn bầu", sunoStylePrompt: "Vietnamese folk, warm female vocals" })!;
assert.ok(longNamedStyle.title.length <= MUSIC_STYLE_TITLE_LIMITS.MAX_CHARS && longNamedStyle.title.split(" ").length <= MUSIC_STYLE_TITLE_LIMITS.MAX_WORDS);
assert.equal(learnedStyle.content, sourceProfile.sunoStylePrompt);
assert.ok(createAnalyzedMusicStyle({ ...sourceProfile, sunoStylePrompt: undefined })!.content.includes("Đàn bầu"));
assert.ok(!learnedStyle.content.includes(sourceProfile.uncertainties[0]));
assert.ok(!learnedStyle.content.includes(sourceProfile.mustNotCopy[0]));
assert.ok(!learnedStyle.content.includes(sourceProfile.market.audienceAge));
assert.ok(!/Thể loại:|Nhịp và tốc độ:|\n/.test(learnedStyle.content));
const legacyStyle = "Thể loại: Dân ca đương đại; Acoustic\nKhán giả: Người lớn\nNhịp và tốc độ: Nhịp chậm, mềm; 70–80 BPM\nHòa âm và giai điệu: Hòa âm mộc; Câu hát dài; Điệp khúc\nNhạc cụ và giọng hát: Đàn bầu; Guitar mộc; Ấm, nhẹ\nKhông sao chép: Không chép giai điệu hay lời nguồn\nChưa xác minh: Âm sắc giọng cần xác minh nếu chỉ có lời bài hát";
const cleanedLegacyStyle = "Dân ca đương đại, Acoustic, Nhịp chậm, mềm, 70–80 BPM, Hòa âm mộc, Câu hát dài, Điệp khúc, Đàn bầu, Guitar mộc, Ấm, nhẹ";
assert.equal(normalizeAnalyzedMusicStyleContent(legacyStyle), cleanedLegacyStyle);
assert.equal(normalizeAnalyzedMusicStyleContent(legacyStyle.replaceAll("\n", "")), cleanedLegacyStyle);
assert.equal(normalizeAnalyzedMusicStyleContent("Genre: Folk\nGroove and tempo: Slow; 75 BPM\nInstruments and vocals: Guitar; Warm\nDo not copy: Lyrics"), "Folk, Slow, 75 BPM, Guitar, Warm");
assert.equal(normalizeAnalyzedMusicStyleContent("Sensual R&BVăn hóa và ngôn ngữ: UncertainKhán giả: AdultsNhịp và tốc độ: Uncertain because only lyrics were supplied; slow grooveNhạc cụ và giọng hát: soft pads; intimate vocalsKhông sao chép: LyricsChưa xác minh: Instruments"), "Sensual R&B, slow groove, soft pads, intimate vocals");
const obsessStyle = "Alternative R&B, dark bedroom pop, sensual breathy female vocals, slow jam, 70 bpm, heavy 808 sub bass, drenched reverb electric guitar, nocturnal, ambient trap soul, low male vocal texture, dark romance";
assert.equal(MUSIC_SUNO_STYLE_FORMAT_EXAMPLE, obsessStyle);
assert.ok(P.SUNO_STYLE_GUIDANCE.includes(obsessStyle));
assert.ok(P.SUNO_STYLE_GUIDANCE.includes("not a catalogue of every genre or song in a playlist"));
assert.ok(O.STYLE_PROMPT("Folk reference", "style-test").includes(P.SUNO_STYLE_GUIDANCE));
assert.equal(normalizeAnalyzedMusicStyleContent(obsessStyle), obsessStyle);
assert.equal(normalizeAnalyzedMusicStyleContent("Alternative R&B, dark bedroom pop, Likely a slow groove inferred from lyrics. " + "Confirm against audio before assigning instruments. ".repeat(12)), "Alternative R&B, dark bedroom pop");
assert.equal(createAnalyzedMusicStyle({ ...sourceProfile, sunoStylePrompt: "Alternative R&B, late-night mood (intimate, spacious), deep sub bass" })!.content, "Alternative R&B, late-night mood (intimate, spacious), deep sub bass");
assert.equal(createAnalyzedMusicStyle({ ...sourceProfile, sunoStylePrompt: obsessStyle })!.content, obsessStyle);
const boleroStyle = "Vietnamese bolero, sweet female vocals, slow 4/4 groove, nylon guitar, no pop drums";
assert.equal(createAnalyzedMusicStyle({ ...sourceProfile, sunoStylePrompt: boleroStyle })!.content, boleroStyle);
assert.equal(createAnalyzedMusicStyle({ title: "Bolero", sunoStylePrompt: boleroStyle })!.content, boleroStyle);
assert.ok(O.STYLE_PROMPT("Folk reference", "style-test").includes(O.STYLE_ARTIFACT));
assert.ok(!O.STYLE_PROMPT("Folk reference", "style-test").includes('"musicalDna":'));
const sourceAnalysisPrompt = SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisPrompt("Vietnamese folk", "Reference transcript", "source-style");
assert.ok(sourceAnalysisPrompt.includes('"sunoStylePrompt":""'));
assert.ok(sourceAnalysisPrompt.includes(P.SUNO_STYLE_GUIDANCE));
assert.ok(sourceAnalysisPrompt.includes('"title":""'));
assert.ok(sourceAnalysisPrompt.includes(MUSIC_STYLE_TITLE_GUIDANCE));
assert.ok(O.STYLE_PROMPT("Folk reference", "style-test").includes(MUSIC_STYLE_TITLE_GUIDANCE));
assert.ok(SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisCorrectionPrompt("source-style").includes(P.SUNO_STYLE_GUIDANCE));
assert.ok(SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisCorrectionPrompt("source-style").includes(MUSIC_STYLE_TITLE_GUIDANCE));
assert.equal(normalizeAnalyzedMusicStyleContent("Thể loại: Bolero, guitar mộc"), "Thể loại: Bolero, guitar mộc");
assert.equal(createAnalyzedMusicStyle(undefined), undefined);
const existingStyles = [learnedStyle];
assert.equal(mergeAnalyzedMusicStyle(existingStyles, { ...learnedStyle, content: "  " + learnedStyle.content.replace(/\n/g, "   ") }), existingStyles);
const entry = `import React from "react";
import { createRoot } from "react-dom/client";
import MusicCreator from "./src/features/music/components/MusicCreator.tsx";
import { API_ROUTES } from "./src/constants/apiRoutes.ts";
import { SUNO_AUTOMATION_CONFIG as C } from "./src/constants/sunoAutomation.ts";
if (!localStorage.getItem("seeded")) { localStorage.setItem(C.MUSIC_CREATOR_STATE_KEY, JSON.stringify({style:"Bolero", outputCount:5, songs:[], songTitleSchemaVersion:C.MUSIC_SONG_TITLE_SCHEMA_VERSION})); localStorage.setItem("seeded","1"); }
const fixture = globalThis.musicFixture = { requests: [], send: event => fixture.output.enqueue(new TextEncoder().encode(JSON.stringify(event)+"\\n")), finish: result => { fixture.send({type:"result",result}); fixture.output.close(); }, disconnect: () => fixture.output.error(new Error("Fixture disconnected")) };
globalThis.fetch = async (url, options = {}) => {
  fixture.requests.push({url, body: JSON.parse(options.body || "{}")});
  if (url === API_ROUTES.PIPELINE_MUSIC_STYLE_ANALYZE) return new Promise((resolve,reject)=>{
    fixture.finishStyle=result=>resolve(new Response(JSON.stringify(result)));
    options.signal?.addEventListener("abort",()=>reject(new DOMException("Aborted","AbortError")));
  });
  if (url === API_ROUTES.PIPELINE_MUSIC_PLAN) return new Response(new ReadableStream({ start(output) { fixture.output=output; options.signal?.addEventListener("abort",()=> output.error(new DOMException("Aborted","AbortError"))); } }), {headers:{"content-type":"application/x-ndjson"}});
  if (url === API_ROUTES.PIPELINE_MUSIC_THUMBNAIL) return new Response(JSON.stringify({success:true,thumbnail:"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="black"/></svg>')}));
  if (url === API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN) return new Response(JSON.stringify({success:true}));
  if (url === API_ROUTES.PIPELINE_MUSIC_SUNO_CREATE) {
    const body=JSON.parse(options.body || "{}");
    return body.initialSongIds?.length
      ? new Response(JSON.stringify({success:true,playlistUrl:"https://suno.com/playlist/offline-resumed",createdSongIds:body.initialSongIds}))
      : new Response(JSON.stringify({success:false,error:"Playlist add failed",createdSongIds:["offline-clip-1","offline-clip-2"]}),{status:400});
  }
  throw new Error("Unexpected offline request: "+url);
};
createRoot(document.getElementById("root")).render(<MusicCreator currentLang="vi"/>);`;
const bundle = await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: process.cwd() },
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
  plugins: [
    {
      name: "music-offline",
      setup(builder) {
        builder.onLoad({ filter: /[\\/]services[\\/]workflowActivity\.ts$/ }, () => ({ contents: "export const recordWorkflowActivity = () => {};" }));
        builder.onResolve({ filter: /^sonner$/ }, () => ({ path: "toast", namespace: "music-offline" }));
        builder.onLoad({ filter: /.*/, namespace: "music-offline" }, () => ({ contents: "const noop=()=>{}; export const toast={success:noop,error:noop,info:noop,warning:noop};" }));
      },
    },
  ],
});
const server = createServer((req, res) => {
  res.setHeader("Content-Type", req.url === "/fixture.js" ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8");
  res.end(req.url === "/fixture.js" ? bundle.outputFiles[0].text : '<!doctype html><meta charset="utf-8"><div id="root"></div><script type="module" src="/fixture.js"></script>');
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${(server.address() as any).port}`);
  const generate = page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.formatGenerateBtn(5), exact: true });
  await generate.click();
  await page.waitForFunction(() => !!(window as any).musicFixture.output);
  const loading = page.getByRole("status").filter({ hasText: MUSIC_CREATOR_TEXTS.vi.BLOCK_LYRICS_LOADING });
  await loading.waitFor();
  assert.equal(await page.getByRole("region", { name: P.TEXT.vi.title }).count(), 0);
  const songs = Array.from({ length: 5 }, (_, i) => ({ songId: `song_${String(i + 1).padStart(3, "0")}`, title: `Lời Thương Bên Sông ${i + 1}`, lyrics: `[Verse]\nLời ca đêm quê thanh bình ${i + 1}.\n[Chorus]\nTiếng ai thương bên sông xưa.`, genre: "Bolero", mood: "Hoài niệm", tempoBpm: 70, structure: ["Verse", "Chorus", "Outro"], originalityNotes: ["Original"] }));
  const progress = async (stage: string, partial?: any[], extra: any = {}) => page.evaluate(({ stage, partial, extra }) => (window as any).musicFixture.send({ type: "progress", progress: { stage, completedSongs: partial?.length ?? 2, totalSongs: 5, ...extra }, ...(partial ? { data: { songs: partial } } : {}) }), { stage, partial, extra });
  await progress(P.STAGES.ANALYSIS, undefined, { completedSongs: 0 });
  await loading.waitFor();
  await progress(P.STAGES.COMPOSITION, songs.slice(0, 2));
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 2, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await loading.waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 0);
  assert.equal(await page.getByText(MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_CREATING_SHORT, { exact: true }).count(), 0);
  await progress(P.STAGES.RANKING, undefined, { warning: P.WARNING_RANKING });
  await loading.waitFor();
  await page.evaluate(() => (window as any).musicFixture.disconnect());
  await page.getByRole("alert").filter({ hasText: "Fixture disconnected" }).waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 1);
  const createSuno = page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.SUNO_CREATE_BTN, exact: true });
  await createSuno.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").sunoPendingPlaylist?.songIds?.length === 2, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  const pending = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").sunoPendingPlaylist, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.reload();
  await createSuno.click();
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").sunoPlaylistUrl === "https://suno.com/playlist/offline-resumed", SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  const resumed = await page.evaluate(() => (window as any).musicFixture.requests.find((request: any) => request.url.includes("music-suno-create"))?.body);
  assert.deepEqual(resumed.initialSongIds, pending.songIds);
  assert.equal(resumed.playlistName, pending.playlistName);
  assert.deepEqual(resumed.songs, []);
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").sunoPendingPlaylist, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY), null);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 2, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.reload();
  await page.getByText(/Lời ca đêm quê thanh bình 1/).waitFor();
  await generate.click();
  await page.waitForFunction(() => !!(window as any).musicFixture.output);
  await loading.waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 0);
  await progress(P.STAGES.COMPOSITION, songs);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 5, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  for (const stage of [P.STAGES.RANKING, P.STAGES.SETTINGS, P.STAGES.SEO, P.STAGES.COMPLETE]) {
    await progress(stage, undefined, { completedSongs: 5 });
    await loading.waitFor();
    assert.equal(await page.getByText(/Lời ca đêm quê thanh bình/).count(), 0);
  }
  const reversed = [...songs].reverse();
  await page.evaluate((songs) => (window as any).musicFixture.finish({ success: true, data: { songs, playlistSeoOptions: [], sunoSettings: { weirdness: 40, styleInfluence: 60, variety: 0, audioInfluence: 50, vocalGender: "auto", duration: "auto", maxMode: false, personalize: false, excludeStyles: "" } } }), reversed);
  await page.waitForFunction(() => (window as any).musicFixture.requests.some((request: any) => request.url.includes("music-thumbnail")));
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.[0]?.songId === "song_005", SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 5/).count(), 1);
  assert.equal(await loading.count(), 0);
  await generate.click();
  await loading.waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình/).count(), 0);
  await progress(P.STAGES.COMPOSITION, songs.slice(0, 2));
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 2, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.STOP_BTN, exact: true }).click();
  await generate.waitFor();
  assert.equal(await loading.count(), 0);
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 1);
  await page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.AI_CONFIG_TITLE, exact: true }).click();
  const autoImages = page.getByRole("switch", { name: O.TEXT.vi.autoImages, exact: true });
  assert.equal(await autoImages.getAttribute("aria-checked"), "true");
  await autoImages.click();
  assert.equal(await autoImages.innerText(), O.TEXT.vi.manualImages);
  const analyze = page.getByRole("button", { name: O.TEXT.vi.analyze, exact: true });
  await analyze.click();
  assert.equal(await generate.isEnabled(), false, "Source analysis requires reference data");
  await page.getByPlaceholder(MUSIC_CREATOR_TEXTS.vi.REFERENCE_PLACEHOLDER).fill("Nguồn mẫu: dân ca đương đại với đàn bầu và guitar mộc, lời tự sự về quê hương.");
  await page.waitForFunction((key) => {
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    return state.analyzeStyleFromSource === true && state.autoCreateImages === false && !!state.referenceSongs;
  }, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.reload();
  assert.equal(await autoImages.getAttribute("aria-checked"), "false");
  assert.equal(await analyze.getAttribute("aria-pressed"), "true");
  await generate.click();
  await page.waitForFunction(() => !!(window as any).musicFixture.output);
  const sourceRequest = await page.evaluate(() => (window as any).musicFixture.requests[0]);
  assert.equal(sourceRequest.body.analyzeStyleFromSource, true);
  assert.equal(sourceRequest.body.style, O.SOURCE_STYLE_GUIDANCE);
  for (let i = 0; i < 2; i++) await page.evaluate((analysis) => (window as any).musicFixture.send({ type: "progress", progress: { stage: "style-analysis", completedSongs: 0, totalSongs: 5 }, data: { styleAnalysis: analysis } }), sourceProfile);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "[]").length === 1, SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY);
  const library = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY);
  assert.deepEqual(library, [learnedStyle], "Save once as soon as analysis is available, before songs finish");
  await page.evaluate(({ songs, analysis }) => (window as any).musicFixture.finish({ success: true, data: { songs, styleAnalysis: analysis, playlistSeoOptions: [] } }), { songs, analysis: sourceProfile });
  await generate.waitFor({ state: "visible" });
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 5, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  assert.equal(await loading.count(), 0);
  assert.equal(await page.evaluate(() => (window as any).musicFixture.requests.length), 1, "Auto images off must send no image request or extra analysis request");
  const manualCover = page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_CREATE_BTN, exact: true });
  await manualCover.click();
  await page.waitForFunction(() => (window as any).musicFixture.requests.some((request: any) => request.url.includes("music-thumbnail")));
  const coverRequest = await page.evaluate(() => (window as any).musicFixture.requests.find((request: any) => request.url.includes("music-thumbnail")));
  assert.equal(coverRequest.body.style, learnedStyle.content, "Manual image creation must use the newly analyzed style");
  await page.getByRole("button", { name: learnedStyle.title, exact: true }).click();
  assert.equal(await analyze.getAttribute("aria-pressed"), "false");
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").analyzeStyleFromSource === false, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.reload();
  assert.equal(await analyze.getAttribute("aria-pressed"), "false");
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").style, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY), learnedStyle.content);
  await page.evaluate(
    ({ libraryKey, stateKey, content, title }) => {
      localStorage.setItem(
        libraryKey,
        JSON.stringify([
          { title, content },
          { title: "Manual", content: "Warm acoustic ballad, soft guitar" },
        ]),
      );
      const state = JSON.parse(localStorage.getItem(stateKey) || "{}");
      localStorage.setItem(stateKey, JSON.stringify({ ...state, style: content }));
    },
    { libraryKey: SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY, stateKey: SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY, content: legacyStyle, title: learnedStyle.title },
  );
  await page.reload();
  await page.waitForFunction(({ libraryKey, content }) => JSON.parse(localStorage.getItem(libraryKey) || "[]")[0]?.content === content, { libraryKey: SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY, content: cleanedLegacyStyle });
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]")[1].content, SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY), "Warm acoustic ballad, soft guitar");
  assert.equal(await page.getByRole("button", { name: learnedStyle.title, exact: true }).getAttribute("title"), cleanedLegacyStyle);
  const savedStyleButton = page.getByRole("button", { name: learnedStyle.title, exact: true });
  const savedStyleCard = savedStyleButton.locator("..").locator("..");
  const reanalyze = savedStyleCard.getByRole("button", { name: O.TEXT.vi.reanalyze, exact: true });
  const stopStyle = savedStyleCard.getByRole("button", { name: O.TEXT.vi.reanalyzeStop, exact: true });
  assert.equal(await page.getByRole("button", { name: O.TEXT.vi.reanalyze, exact: true }).count(), 2);
  const preservedSongs = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").songs, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await reanalyze.click();
  await stopStyle.waitFor();
  assert.equal(await stopStyle.isEnabled(), true, "The running style action remains cancellable");
  const styleRequest = await page.evaluate(() => (window as any).musicFixture.requests[0]);
  assert.equal(styleRequest.url, "/api/pipeline/music-style-analyze");
  assert.ok(styleRequest.body.referenceSource);
  assert.ok(styleRequest.body.aiExecution.provider);
  assert.ok(!styleRequest.body.songs && !styleRequest.body.requestedSongCount);
  const reanalyzedStyle = { title: "Bolero trữ tình", content: boleroStyle };
  await page.evaluate((style) => (window as any).musicFixture.finishStyle({ success: true, style }), reanalyzedStyle);
  await reanalyze.waitFor();
  assert.equal(await savedStyleButton.getAttribute("title"), boleroStyle);
  await page.waitForFunction(({ key, content }) => JSON.parse(localStorage.getItem(key) || "{}").style === content, { key: SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY, content: boleroStyle });
  const updatedLibrary = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), SUNO_AUTOMATION_CONFIG.MUSIC_STYLE_LIBRARY_KEY);
  assert.equal(updatedLibrary.length, 2);
  assert.equal(updatedLibrary[0].title, learnedStyle.title, "Reanalysis must preserve the existing name even when AI returns a different title");
  assert.equal(await page.getByRole("button", { name: reanalyzedStyle.title, exact: true }).count(), 0);
  assert.equal(updatedLibrary[1].content, "Warm acoustic ballad, soft guitar");
  assert.deepEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "{}").songs, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY), preservedSongs);
  await reanalyze.click();
  await stopStyle.waitFor();
  await page.evaluate(() => (window as any).musicFixture.finishStyle({ success: false, error: "Provider unavailable" }));
  await reanalyze.waitFor();
  assert.equal(await savedStyleButton.getAttribute("title"), boleroStyle, "Provider errors preserve the saved style");
  assert.equal(await page.getByRole("button", { name: learnedStyle.title, exact: true }).count(), 1, "Errors preserve the saved style name");
  await reanalyze.click();
  await stopStyle.waitFor();
  await stopStyle.click();
  await reanalyze.waitFor();
  assert.equal(await savedStyleButton.getAttribute("title"), boleroStyle, "Cancel preserves the saved style");
  assert.equal(await page.evaluate(() => (window as any).musicFixture.requests.length), 3, "One style-only request per click, without song, SEO or image requests");
  await page.reload();
  await savedStyleButton.waitFor();
  assert.equal(await savedStyleButton.getAttribute("title"), boleroStyle, "Style name and content survive reload");
  assert.equal(await page.evaluate(() => (window as any).musicFixture.requests.length), 0, "Reload must not request another analysis");
  await page.getByPlaceholder(MUSIC_CREATOR_TEXTS.vi.REFERENCE_PLACEHOLDER).fill("");
  await reanalyze.click();
  assert.equal(await page.evaluate(() => (window as any).musicFixture.requests.length), 0, "Missing sources must not trigger AI");
  assert.deepEqual(errors, []);
  process.stdout.write("Music UI passed: loading/recovery, auto image toggle persistence, no images when off, manual images still work, source analysis saves reusable style immediately without duplicates or extra AI requests, saved style selection survives reload. No live AI or Suno requests.\n");
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
