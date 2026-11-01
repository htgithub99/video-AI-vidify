import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-thumbnail-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = directory;
try {
  const { createMotionThumbnailService } = await import("../src/features/motion/server/services/motionThumbnailService.js");
  const { prepareMotionThumbnailReferences, motionThumbnailStyle, rankMotionThumbnailScenes } = await import("../src/features/motion/server/services/motionThumbnailReferences.js");
  const { MOTION_THUMBNAIL: T } = await import("../src/constants/motionThumbnail.js");
  const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.js");
  const analysis: any = { title: "Tiếng gọi ngoài sân", logline: "Người chị nghe tiếng gọi bên chiếc giếng.", look: "OLD GENERIC 3D LOOK", videoGenre: "witness", cast: [{ key: "sister", name: "Người chị", look: "Áo xanh" }], chapters: [{ id: "c1", title: "Chiếc giếng" }] };
  const seo: any = { title: "TIẾNG GỌI BÊN GIẾNG", description: "Người chị áo xanh nghe tiếng gọi bên chiếc giếng cũ." };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6M/wAAAAASUVORK5CYII=", "base64");
  const reference = "data:image/png;base64," + png.toString("base64");
  const remotion: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
  const library: any = { version: 1, mode: "library", engine: "canvas", packId: "minimal_mask" };
  const script: any = { title: analysis.title, language: "vi", beats: [{ id: "b1", narration: analysis.logline, place: "well", visual: "scene" }], gen: { previews: {} } };
  const snapshot = JSON.stringify({ analysis, script });
  const { rasterizeMotionSvgs } = await import("../src/features/motion/server/services/motionRenderService.js");
  const { motionAiRoutes } = await import("../src/features/motion/server/services/motionStoryService.js");
  const { AiPlanningFallbackProvider, AiPlanningChatModel } = await import("../src/types.js");
  const { readBase64ImageDimensions } = await import("../src/server/utils/imageAspectRatio.js");
  const svg = (width: number, height: number, color = "#192d46") => `<svg viewBox='0 0 ${width} ${height}'><rect width='${width}' height='${height}' fill='${color}'/><circle cx='${width * 0.75}' cy='${height * 0.5}' r='80' fill='white'/><text x='40' y='160' fill='white' font-size='50'>NEW THUMBNAIL</text></svg>`;
  const fixtures = new Map<string, Buffer>();
  for (const [width, height] of [
    [1280, 720],
    [720, 1280],
  ]) {
    const file = path.join(directory, `${width}.png`);
    assert.deepEqual(await rasterizeMotionSvgs([{ svg: svg(width, height), width, height, file }]), [file]);
    fixtures.set(`${width}x${height}`, fs.readFileSync(file));
  }
  const providers = [
    { provider: AiPlanningFallbackProvider.GeminiChat, model: "gemini-flash::low" },
    { provider: AiPlanningFallbackProvider.ChatGptUi, model: AiPlanningChatModel.ChatGptAuto },
    { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekStandard },
  ];
  for (const visualSettings of [remotion, library])
    for (const selected of providers)
      for (const allowFallback of [false, true]) {
        let drawings = 0,
          renders = 0;
        const referencePaths: string[] = [];
        const service = createMotionThumbnailService({
          prepareMotionThumbnailReferences: async (_analysis, _script, settings) => {
            assert.deepEqual(settings, visualSettings);
            return [reference];
          },
          runMotionAi: async (prompt, artifact, execution, _signal, _log, images) => {
            drawings++;
            assert.equal(artifact, T.ARTIFACT);
            assert.equal(execution.provider, selected.provider);
            assert.equal(execution.model, selected.model);
            assert.equal(execution.mode, "room-only");
            assert.equal(execution.chromeHeadless, false);
            assert.equal(execution.allowFallback, allowFallback);
            assert.equal(execution.role, "draw");
            assert.equal(motionAiRoutes(execution).length > 1, allowFallback);
            assert.ok(prompt.includes(T.DRAW_TASK) && prompt.includes(T.LAYOUT) && prompt.includes(T.REFERENCE_RULE));
            assert.ok(prompt.includes(seo.description));
            assert.ok(!prompt.includes(analysis.look));
            assert.equal(images?.length, 1);
            assert.deepEqual(fs.readFileSync(images![0].path), png);
            referencePaths.push(images![0].path);
            return { svg: svg(720, 1280) };
          },
          rasterizeMotionSvgs: async (jobs) => {
            renders++;
            for (const job of jobs) fs.writeFileSync(job.file, fixtures.get(`${job.width}x${job.height}`)!);
            return jobs.map((job) => job.file);
          },
        });
        const options = { language: "vi", visualSettings, script, aspect: "9:16", exec: { ...selected, chromeHeadless: false, allowFallback } };
        const first = await service(analysis, seo, options);
        const second = await service(analysis, seo, options);
        assert.equal(drawings, 2, "One drawing request per click, no separate prompt-planning stage");
        assert.equal(renders, 2);
        assert.match(first.thumbnail, /^data:image\/png;base64,/);
        assert.deepEqual(readBase64ImageDimensions(first.thumbnail), { width: 720, height: 1280 });
        assert.notEqual(first.thumbnail, reference);
        assert.notEqual(first.prompt, second.prompt, "Every click has a new request identity");
        assert.equal(new Set(referencePaths.map((file) => path.basename(file))).size, referencePaths.length, "Reference filenames must be unique between thumbnail requests");
        assert.ok(
          referencePaths.every((file) => !fs.existsSync(file)),
          "Temporary reference files are cleaned after the response",
        );
      }
  let repairs = 0,
    repairRenders = 0;
  const repair = createMotionThumbnailService({
    prepareMotionThumbnailReferences: async () => [],
    runMotionAi: async (prompt) => {
      repairs++;
      if (repairs === 1) return { svg: [] };
      assert.ok(prompt.includes("svg: expected string"));
      return { svg: svg(1280, 720) };
    },
    rasterizeMotionSvgs: async (jobs) => {
      repairRenders++;
      if (repairRenders === 1) throw new Error("Transient renderer failure");
      for (const job of jobs) fs.writeFileSync(job.file, fixtures.get("1280x720")!);
      return jobs.map((job) => job.file);
    },
  });
  const repaired = await repair(analysis, seo, { language: "en", visualSettings: { ...remotion, profileId: "history" }, exec: { ...providers[0], allowFallback: false } });
  assert.equal(repairs, 2, "Malformed SVG response gets a bounded structural repair");
  assert.equal(repairRenders, 2, "A PNG export failure retries the accepted drawing without another AI call");
  assert.deepEqual(readBase64ImageDimensions(repaired.thumbnail), { width: 1280, height: 720 });
  let failedRequests = 0,
    failedRenders = 0;
  const failed = createMotionThumbnailService({
    prepareMotionThumbnailReferences: async () => [],
    runMotionAi: async () => {
      failedRequests++;
      throw Object.assign(new Error("Uncertain response"), { motionSubmissionUncertain: true });
    },
    rasterizeMotionSvgs: async () => {
      failedRenders++;
      return [];
    },
  });
  await assert.rejects(failed(analysis, seo, { language: "en", visualSettings: remotion, exec: { ...providers[0], allowFallback: false } }), /Uncertain response/);
  assert.equal(failedRequests, 1);
  assert.equal(failedRenders, 0, "A failed AI task must not continue to an unrelated renderer and falsely report success");
  const { startStoryJob, getStoryJob } = await import("../src/features/motion/server/services/motionStoryJobService.js");
  const { MotionStoryJobKind } = await import("../src/types/motionVideo.js");
  const job = startStoryJob(true, MotionStoryJobKind.THUMBNAIL, async () => repaired);
  const deadline = Date.now() + 10000;
  while (getStoryJob(job.id)?.status !== "completed" && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 25));
  const completed = getStoryJob(job.id)!;
  assert.equal(completed.status, "completed");
  assert.equal((completed.result as any).thumbnail, repaired.thumbnail);
  const saved = JSON.parse(fs.readFileSync(path.join(directory, "output", "motion-video", "story-jobs", `${job.id}.json`), "utf8"));
  assert.equal(saved.job.result.thumbnail, repaired.thumbnail, "A successful PNG reaches the completed job and persisted result");
  assert.equal(JSON.stringify({ analysis, script }), snapshot);
  const makeScene = (id: string, text: string, status = "accepted") => ({ id, text, purpose: text, nodes: [], composition: { assetKey: id }, build: { status } });
  const sceneScript: any = {
    ...script,
    gen: {
      remotion: {
        settings: remotion,
        scenes: { b1: [makeScene("irrelevant", "Một người bên đường"), makeScene("well", seo.title), makeScene("failed", seo.title, "failed")] },
        assets: { irrelevant: { svg: "<svg viewBox='0 0 1280 720'><rect width='1280' height='720' fill='#222222'/></svg>" }, well: { svg: "<svg viewBox='0 0 1280 720'><defs><radialGradient id='light'><stop offset='0' stop-color='#555555'/><stop offset='1' stop-color='#111111'/></radialGradient></defs><rect width='1280' height='720' fill='url(#light)'/></svg>" } },
      },
    },
  };
  let remotionReferences = 0;
  let temporary: string | undefined;
  const refs = await prepareMotionThumbnailReferences(
    analysis,
    sceneScript,
    remotion,
    seo,
    {},
    {
      rasterizeMotionSvgs: async (jobs) => {
        remotionReferences++;
        assert.equal(jobs.length, 2);
        assert.ok(jobs[0].svg.includes("radialGradient"));
        for (const job of jobs) {
          fs.mkdirSync(path.dirname(job.file), { recursive: true });
          fs.writeFileSync(job.file, png);
        }
        temporary = path.dirname(jobs[0].file);
        return jobs.map((job) => job.file);
      },
    },
  );
  assert.equal(remotionReferences, 1);
  assert.equal(refs.length, 2);
  assert.ok(refs.every((image) => image.startsWith("data:image/png;base64,")));
  assert.equal(fs.existsSync(temporary!), false, "Temporary reference images must be cleaned after encoding");
  assert.equal(rankMotionThumbnailScenes([{ text: "Đêm qua" }, { text: "Chiếc giếng cũ" }], "TIẾNG GỌI BÊN GIẾNG")[0].text, "Chiếc giếng cũ");
  const file = path.join(directory, "library-reference.png");
  fs.writeFileSync(file, png);
  const libraryScript: any = { ...script, gen: { previews: {}, puppet: { styleId: "stl-ba8ca635c716c880", sheet: [{ text: seo.title, file: "scene.png" }] } } };
  assert.deepEqual(await prepareMotionThumbnailReferences(analysis, libraryScript, library, seo, {}, { resolveGenPreview: () => file }), [reference]);
  assert.ok(fs.existsSync(file), "Reference extraction must not delete the original library scene");
  const sourceFile = fs.readFileSync("src/features/motion/server/controllers/motionVideoController.ts", "utf8");
  const endpoint = sourceFile.slice(sourceFile.indexOf("export const thumbnailMotionStory"), sourceFile.indexOf("export const scenesMotionStory"));
  assert.ok(endpoint.includes("generateMotionThumbnail(analysis, seo"));
  assert.ok(!endpoint.includes("renderRemotionStill") && !endpoint.includes("spec.subtitles"), "The API must not bypass fresh generation for Remotion");
  console.log("Motion thumbnails passed: fresh generation for both modes, scene style references, SEO-specific left-text/right-subject layout, language/aspect/headless settings, selected scene provider/model/fallback, bounded SVG repair, PNG retry, completed-job persistence and reference cleanup. No live AI/TTS/video.");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  fs.rmSync(directory, { recursive: true, force: true });
}
