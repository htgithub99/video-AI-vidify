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
  const analysis: any = { title: "Tiếng gọi ngoài sân", logline: "Người chị nghe tiếng gọi bên chiếc giếng.", look: "OLD GENERIC 3D LOOK", videoGenre: "ghost_tale", cast: [{ key: "sister", name: "Người chị", look: "Áo xanh" }], chapters: [{ id: "c1", title: "Chiếc giếng" }] };
  const seo: any = { title: "TIẾNG GỌI BÊN GIẾNG", description: "Người chị áo xanh nghe tiếng gọi bên chiếc giếng cũ." };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6M/wAAAAASUVORK5CYII=", "base64");
  const reference = "data:image/png;base64," + png.toString("base64");
  const remotion: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
  const library: any = { version: 1, mode: "library", engine: "canvas", packId: "minimal_mask" };
  const script: any = { title: analysis.title, language: "vi", beats: [{ id: "b1", narration: analysis.logline, place: "well", visual: "scene" }], gen: { previews: {} } };
  const snapshot = JSON.stringify({ analysis, script });
  for (const visualSettings of [remotion, library]) {
    let plans = 0,
      drawings = 0;
    const service = createMotionThumbnailService({
      prepareMotionThumbnailReferences: async (_analysis, _script, settings) => {
        assert.deepEqual(settings, visualSettings);
        return [reference];
      },
      runMotionAi: async (prompt, _artifact, execution) => {
        plans++;
        assert.deepEqual(execution, { provider: "content-ai" });
        assert.ok(prompt.includes(T.LAYOUT) && prompt.includes(T.REFERENCE_RULE));
        assert.ok(prompt.includes(seo.description));
        assert.ok(!prompt.includes(analysis.look), "Do not let old inferred style override the selected scene profile");
        return { imagePrompt: "Draw the sister in her blue clothes beside the old well, in the video's flat cartoon drawing style. Use a separate large left headline and one right-hand subject." };
      },
      generateImageWithPlaywright: async (options: any) => {
        drawings++;
        assert.deepEqual(options.visualConfig.referenceImages, [reference]);
        assert.equal(options.visualConfig.referenceImageNames.length, 1);
        assert.equal(options.visualConfig.chromeHeadless, false);
        assert.equal(options.visualConfig.aspectRatio, "9:16");
        assert.ok(options.prompt.includes(T.STYLE_RULE) && options.prompt.includes(T.LAYOUT));
        assert.equal(options.style, motionThumbnailStyle(analysis, script, visualSettings));
        return { success: true, base64: Buffer.from("new-thumbnail-" + drawings + "x".repeat(9000)).toString("base64") } as any;
      },
    });
    const options = { language: "vi", visualSettings, script, aspect: "9:16", chromeHeadless: false, exec: { provider: "content-ai" } as any };
    const first = await service(analysis, seo, options);
    const second = await service(analysis, seo, options);
    assert.equal(plans, 2);
    assert.equal(drawings, 2, "Every click must generate new artwork in both modes");
    assert.notEqual(first.thumbnail, second.thumbnail);
    assert.notEqual(first.thumbnail, reference);
  }
  let fallbackCalls = 0;
  const fallback = createMotionThumbnailService({
    prepareMotionThumbnailReferences: async () => [],
    runMotionAi: async () => {
      throw new Error("planning unavailable");
    },
    generateImageWithPlaywright: async (options: any) => {
      fallbackCalls++;
      assert.ok(options.prompt.includes(T.LAYOUT) && options.prompt.includes(V.PROFILES.history.direction));
      assert.ok(!options.style.includes(analysis.look));
      return { success: true, base64: "A".repeat(12000) } as any;
    },
  });
  await fallback(analysis, seo, { language: "en", visualSettings: { ...remotion, profileId: "history" }, exec: {} });
  assert.equal(fallbackCalls, 1, "Fallback must still draw a new image in the selected style");
  let duplicateCalls = 0;
  const duplicate = createMotionThumbnailService({
    prepareMotionThumbnailReferences: async () => ["data:image/png;base64," + "A".repeat(12000)],
    runMotionAi: async () => ({ imagePrompt: "New flat illustrated thumbnail with one character in blue on the right and the story title in large letters at the left. Keep the source palette and proportions." }),
    generateImageWithPlaywright: async () => {
      duplicateCalls++;
      return { success: true, base64: "A".repeat(12000) } as any;
    },
  });
  await assert.rejects(duplicate(analysis, seo, { language: "vi", visualSettings: remotion, exec: {} }), /ảnh tham chiếu/u);
  assert.equal(duplicateCalls, 3, "Never return a reference frame as a newly generated cover");
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
  console.log("Motion thumbnails passed: fresh generation for both modes, scene style references, SEO-specific left-text/right-subject layout, language/aspect/headless settings, fallback style, duplicate-frame rejection and reference cleanup. No live AI/TTS/video.");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  fs.rmSync(directory, { recursive: true, force: true });
}
