import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MUSIC_PLANNING as P } from "../src/constants/musicPlanning.ts";
import { MUSIC_CREATOR_TEXTS } from "../src/constants/texts.ts";
import { SUNO_AUTOMATION_CONFIG } from "../src/constants/sunoAutomation.ts";
const entry = `import React from "react";
import { createRoot } from "react-dom/client";
import MusicCreator from "./src/components/MusicCreator.tsx";
import { API_ROUTES } from "./src/constants/apiRoutes.ts";
import { SUNO_AUTOMATION_CONFIG as C } from "./src/constants/sunoAutomation.ts";
if (!localStorage.getItem("seeded")) { localStorage.setItem(C.MUSIC_CREATOR_STATE_KEY, JSON.stringify({style:"Bolero", outputCount:5, songs:[], songTitleSchemaVersion:C.MUSIC_SONG_TITLE_SCHEMA_VERSION})); localStorage.setItem("seeded","1"); }
const fixture = globalThis.musicFixture = { requests: [], send: event => fixture.output.enqueue(new TextEncoder().encode(JSON.stringify(event)+"\\n")), finish: result => { fixture.send({type:"result",result}); fixture.output.close(); }, disconnect: () => fixture.output.error(new Error("Fixture disconnected")) };
globalThis.fetch = async (url, options = {}) => {
  fixture.requests.push({url, body: JSON.parse(options.body || "{}")});
  if (url === API_ROUTES.PIPELINE_MUSIC_PLAN) return new Response(new ReadableStream({ start(output) { fixture.output=output; options.signal?.addEventListener("abort",()=> output.error(new DOMException("Aborted","AbortError"))); } }), {headers:{"content-type":"application/x-ndjson"}});
  if (url === API_ROUTES.PIPELINE_MUSIC_THUMBNAIL) return new Response(JSON.stringify({success:true,thumbnail:"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="black"/></svg>')}));
  if (url === API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN) return new Response(JSON.stringify({success:true}));
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
  const songs = Array.from({ length: 5 }, (_, i) => ({ songId: `song_${String(i + 1).padStart(3, "0")}`, title: `Lời Thương Bên Sông ${i + 1}`, lyrics: `[Verse]\nLời ca đêm quê thanh bình ${i + 1}.\n[Chorus]\nTiếng ai thương bên sông xưa.`, genre: "Bolero", mood: "Hoài niệm", tempoBpm: 70, structure: ["Verse", "Chorus", "Outro"], originalityNotes: ["Original"] }));
  const progress = async (stage: string, partial?: any[], extra: any = {}) => page.evaluate(({ stage, partial, extra }) => (window as any).musicFixture.send({ type: "progress", progress: { stage, completedSongs: partial?.length ?? 2, totalSongs: 5, ...extra }, ...(partial ? { data: { songs: partial } } : {}) }), { stage, partial, extra });
  await progress(P.STAGES.ANALYSIS, undefined, { completedSongs: 0 });
  await page.getByText(P.TEXT.vi[P.STAGES.ANALYSIS], { exact: true }).waitFor();
  await progress(P.STAGES.COMPOSITION, songs.slice(0, 2));
  await page.getByText(P.TEXT.vi.count(2, 5), { exact: true }).waitFor();
  await page.getByText(/Lời ca đêm quê thanh bình 1/).waitFor();
  assert.equal(await page.getByText(MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_CREATING_SHORT, { exact: true }).count(), 0);
  await progress(P.STAGES.RANKING, undefined, { warning: P.WARNING_RANKING });
  await page.getByText(P.WARNING_RANKING, { exact: true }).waitFor();
  await page.evaluate(() => (window as any).musicFixture.disconnect());
  await page.getByRole("alert").filter({ hasText: "Fixture disconnected" }).waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 1);
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.length === 2, SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  await page.reload();
  await page.getByText(/Lời ca đêm quê thanh bình 1/).waitFor();
  await generate.click();
  await page.waitForFunction(() => !!(window as any).musicFixture.output);
  await progress(P.STAGES.COMPOSITION, songs);
  await page.getByText(P.TEXT.vi.count(5, 5), { exact: true }).waitFor();
  const reversed = [...songs].reverse();
  await page.evaluate((songs) => (window as any).musicFixture.finish({ success: true, data: { songs, playlistSeoOptions: [], sunoSettings: { weirdness: 40, styleInfluence: 60, variety: 0, audioInfluence: 50, vocalGender: "auto", duration: "auto", maxMode: false, personalize: false, excludeStyles: "" } } }), reversed);
  await page.waitForFunction(() => (window as any).musicFixture.requests.some((request: any) => request.url.includes("music-thumbnail")));
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) || "{}").songs?.[0]?.songId === "song_005", SUNO_AUTOMATION_CONFIG.MUSIC_CREATOR_STATE_KEY);
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 5/).count(), 1);
  await generate.click();
  await progress(P.STAGES.COMPOSITION, songs.slice(0, 2));
  await page.getByRole("button", { name: MUSIC_CREATOR_TEXTS.vi.STOP_BTN, exact: true }).click();
  await page.getByText(P.TEXT.vi.stopped, { exact: true }).waitFor();
  assert.equal(await page.getByText(/Lời ca đêm quê thanh bình 1/).count(), 1);
  assert.deepEqual(errors, []);
  console.log("Music UI passed: actual component shows stages and partial lyrics while composing; disconnect/reload retains songs; final order and thumbnail timing work; stop retains partial songs. No live AI or Suno requests.");
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
