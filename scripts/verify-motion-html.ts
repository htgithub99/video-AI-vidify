import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("scratch/motion-html-implementation-20261107");
process.env.VIDIFY_STORAGE_DIR = path.join(root, "storage");
delete process.env.APP_DATA_DIR;
await fs.mkdir(root, { recursive: true });
const { openMotionHtmlRuntime } = await import("../src/features/motion/server/services/html/sceneRuntime.ts");
const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
const { planMotionHtmlScenes } = await import("../src/features/motion/server/services/html/scenePipeline.ts");
const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.ts");
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const { probeMotionMedia } = await import("../src/features/motion/server/services/motionMediaValidation.ts");
const { motionHtmlAuthoringSnapshot } = await import("../src/lib/motionHtmlAuthoring.ts");
const { MOTION_HTML } = await import("../src/constants/motionHtmlTemplate.ts");
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:async function(p){const c=document.getElementById('motion-canvas');c.width=p.width;c.height=p.height;const x=c.getContext('2d');x.fillStyle='#f5ead3';x.fillRect(0,0,c.width,c.height);x.fillStyle='#a64032';x.beginPath();x.arc(c.width*(.2+.6*p.progress),c.height*.5,c.height*.15,0,Math.PI*2);x.fill();x.fillStyle='#382e26';x.font='bold '+(c.height*.07)+'px Arial';x.fillText('Canvas • chuyển động',c.width*.08,c.height*.15)}};</script></body></html>`;
const base: any = { time: 0, progress: 0, frame: 0, fps: 30, duration: 2, width: 640, height: 360, mode: "preview", motionEnabled: true, sceneEffectsEnabled: true, seed: "fixture", speaking: [] };
const runtime = await openMotionHtmlRuntime(html);
try {
  const first = await runtime.render(base), last = await runtime.render({ ...base, progress: 1, frame: 59, time: 59 / 30 });
  assert.notDeepEqual(first, last);
  assert.deepEqual(await runtime.render(base), first, "Seeking back reproduces the exact frame");
  await fs.writeFile(path.join(root, "first.png"), first); await fs.writeFile(path.join(root, "last.png"), last);
} finally { await runtime.close(); }
process.stdout.write("PASS: real Chrome opaque-origin Canvas runtime, arbitrary seek and repeatable frames.\n");
const previousDelays = [...MOTION_HTML.RETRY_MS];
(MOTION_HTML as any).RETRY_MS = [1];
const records: any[] = [];
try {
  for (const profile of ["history", "horror", "explainer"]) {
    const language = profile === "horror" ? "vi" : "en";
    const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: profile, componentRevision: 1, pacing: "few" };
    const analysis: any = { title: "Canvas fixture", visualSettings: settings, authoringSettings: motionHtmlAuthoringSnapshot({ length: "2min", target: 120, language, profile, pacing: "few", videoGenre: "verdict", storytelling: "lively" }), chapters: [{ id: "c1", title: "One event", targetSeconds: 2 }], cast: [], places: [] };
    const script: any = { title: analysis.title, language, visualSettings: settings, beats: [{ id: "b1", chapterId: "c1", narration: language === "vi" ? "Dấu chỉ chạy qua trang giấy." : "The marker crosses the page.", visual: "scene", sceneTemplateDraft: "0. Theme\n1. Style\n2. Three layers\n3. Marker moves\n4. No UI" }] };
    const calls: string[] = [];
    let drawing = 0;
    const options: any = { exec: {}, scope: `${profile}-${Date.now()}`, renderBehavior: { version: 1, actors: "simple", sceneEffects: "gentle", camera: "gentle" }, log: () => undefined,
      ai: async (prompt: string, artifact: string) => {
        calls.push(artifact);
        assert.equal(prompt.includes(MOTION_HTML.PROFILE_GRAPHICS[profile] || MOTION_HTML.GRAPHICS), artifact === MOTION_HTML.ARTIFACT, "Only scene drawing receives the profile graphic standard");
        assert.doesNotMatch(prompt, /CHARACTER SVG FRAME|SELECTED VISUAL CONSTRUCTION|GENERIC HORSE|SELF-CHECK BEFORE ANSWERING|REVISION REQUEST/);
        if (artifact === MOTION_HTML.PLAN) {
          assert.match(prompt, /PRODUCTION LANGUAGE: Write all production descriptions/);
          assert.ok(prompt.includes(`SELECTED VIDEO LANGUAGE: ${language}`));
          const context = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
          return { scenes: [{ fromLineId: context.lines[0].id, toLineId: context.lines.at(-1).id, purpose: "A moving marker", sceneTemplate: script.beats[0].sceneTemplateDraft, soundEvents: [{ id: "marker", kind: "whoosh", layer: "action", at: .6, duration: .3, description: "Marker passes", source: "visible", actor: "marker" }] }] };
        }
        assert.equal(artifact, MOTION_HTML.ARTIFACT);
        assert.ok(prompt.startsWith(MOTION_HTML.OUTPUT), "Every scene generation and retry must receive the current code contract");
        assert.ok(prompt.includes(script.beats[0].sceneTemplateDraft), "Code-quality instructions must preserve the original scene functionality");
        assert.ok(prompt.includes(MOTION_HTML.CODE_LANGUAGE(language)));
        assert.ok(!prompt.includes(MOTION_HTML.LANGUAGE_POLICY), "Drawing must not inherit prose-authoring instructions");
        assert.equal(prompt.split(MOTION_HTML.PROFILE_GRAPHICS[profile] || MOTION_HTML.GRAPHICS).length, 2, "The graphic standard appears once");
        assert.doesNotMatch(prompt, /Return the complete HTML|SELECTED VIDEO LANGUAGE/, "Format and language rules are not repeated in the scene body");
        drawing++;
        return profile === "history" && drawing <= 4 ? html.replace("x.fill();", "throw Error('fixture runtime fault');") : html;
      },
    };
    await assert.rejects(buildRemotionScenes(script, analysis, options), /Hoàn tất bước viết kịch bản/);
    assert.equal(calls.length, 0, "Missing plans never trigger hidden planning at the build stage");
    const planned = await planMotionHtmlScenes(script, analysis, options);
    assert.equal(drawing, 0, "Script planning never draws HTML");
    assert.deepEqual(calls, [MOTION_HTML.PLAN]);
    const built = await buildRemotionScenes(planned, analysis, options);
    assert.equal(calls.filter((artifact) => artifact === MOTION_HTML.PLAN).length, 1, "Building never requests a new plan");
    assert.equal(drawing, profile === "history" ? 5 : 1, "Retry beyond three, stop at first executable result");
    const firstScene = Object.values(built.gen!.remotion!.scenes).flat()[0];
    assert.equal(firstScene.html?.html, html, "Saved artwork is byte-preserved");
    assert.equal(firstScene.nodes.length, 0);
    await buildRemotionScenes(built, analysis, options);
    assert.equal(drawing, profile === "history" ? 5 : 1, "Resume does not regenerate an accepted scene");
    const compiled = compileRemotionStory(built, analysis, { durations: [2], fps: 30, subtitles: true });
    assert.equal(compiled.spec.renderer, "html-canvas");
    assert.equal(compiled.spec.scenes.length, 1);
    if (profile === "history") {
      const output = path.join(root, "canvas.mp4");
      await renderRemotionVideo(compiled.spec, output, { width: 640, height: 360, crf: 23, signal: new AbortController().signal, onProgress: () => undefined });
      const media = await probeMotionMedia(output);
      assert.equal(media.streams[0].width, 640); assert.equal(media.streams[0].height, 360);
      assert.equal(Number(media.streams[0].nb_frames), Math.ceil(compiled.spec.duration * 30));
      records.push({ profile, calls, attempts: drawing, realChromeExport: media });
    } else records.push({ profile, calls, attempts: drawing });
  }
} finally { (MOTION_HTML as any).RETRY_MS = previousDelays; }
await fs.writeFile(path.join(root, "verification.json"), JSON.stringify({ realProviderCalls: 0, fixtureContent: true, records }, null, 2));
process.stdout.write("PASS: all three profiles, no SVG/rig/QA tasks, fifth-attempt recovery, resume, timeline, real Chrome→FFmpeg MP4.\n");
process.exit(0);
