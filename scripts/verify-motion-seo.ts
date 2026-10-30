import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MOTION_SEO } from "../src/constants/motionSeo.ts";
import * as MR from "../src/constants/motionRuntime.ts";
import type { MotionSeoOption, MotionStoryAnalysis, MotionStoryScript } from "../src/types/motionVideo.ts";
import { MOTION_SEO_VERIFICATION as V } from "./motionSeoVerificationTexts.ts";
const output = path.resolve(V.BUNDLE(process.pid));
try {
  const bundled = await build({
    stdin: { contents: V.ENTRY, loader: "ts", resolveDir: process.cwd() },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onResolve({ filter: V.SERVICE_IMPORT }, (args) => ({ path: args.path, namespace: V.NAMESPACE }));
          builder.onLoad({ filter: /.*/, namespace: V.NAMESPACE }, () => ({ loader: "js", contents: V.STUB }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const service: typeof import("../src/features/motion/server/services/motionSeoService.ts") & typeof import("../src/lib/motionSeo.ts") = await import(pathToFileURL(output).href);
  const chapters = V.CHAPTER_IDS.map((id, i) => ({ id, title: V.CHAPTER_TITLE(i), summary: V.NARRATION }));
  const analysis = { title: V.REWRITTEN_TITLE, logline: V.NARRATION, chapters, facts: [], cast: [], places: [] } as MotionStoryAnalysis;
  const script: MotionStoryScript = { title: V.REWRITTEN_TITLE, language: V.VI, beats: chapters.map((chapter, i) => ({ id: V.BEAT_ID(i), chapterId: chapter.id, narration: V.NARRATION, visual: V.NARRATION })) };
  const alternatives: MotionSeoOption[] = Array.from({ length: service.SEO_OPTION_COUNT }, (_, i) => ({ title: V.CREATIVE_TITLE(i), description: V.DESCRIPTION.replace("{CHAPTERS}", service.SEO_CHAPTERS_TOKEN), hashtags: [V.HASHTAG], tags: [V.TAG], seoScore: 50 + i * 10 }));
  const prompts: string[] = [];
  const generate = (source?: { title: string } | null, options = alternatives, language = V.VI as string) =>
    service.generateMotionSeo(analysis, script, {
      source,
      language,
      exec: {},
      durations: [12, 18, 15],
      ai: async (prompt) => {
        prompts.push(prompt);
        return { seoOptions: options, chapterTitles: chapters };
      },
    });
  for (const language of [V.VI, V.EN]) {
    const pack = await generate({ title: V.SOURCE_TITLE + V.SOURCE_SUFFIX }, alternatives, language);
    assert.equal(pack.options.length, service.SEO_OPTION_COUNT);
    assert.equal(pack.options[0].title, V.SOURCE_TITLE);
    assert.equal(pack.options[0].sourceTitleBased, true);
    assert.equal(pack.options[0].seoScore, alternatives[0].seoScore);
    assert.equal(pack.options[0].description, alternatives[0].description);
    assert.deepEqual(pack.options[0].hashtags, alternatives[0].hashtags);
    assert.deepEqual(pack.options[0].tags, alternatives[0].tags);
    assert.deepEqual(
      pack.options.slice(1).map((option) => option.title),
      alternatives
        .slice(1)
        .reverse()
        .map((option) => option.title),
    );
    assert.ok(prompts.at(-1)!.includes(JSON.stringify(V.SOURCE_TITLE)));
    assert.ok(prompts.at(-1)!.includes(MOTION_SEO.SOURCE_TITLE_RULE));
    assert.deepEqual(
      pack.chapters.map((chapter) => chapter.t),
      [0, 12, 30],
    );
    assert.ok(service.renderSeoDescription(pack.options[0], pack).includes("00:12"));
    assert.equal(service.retimeSeoPack(pack, script.beats, chapters, true, [15, 20, 15]).options[0].title, V.SOURCE_TITLE);
  }
  const alreadyMatched = alternatives.map((option, i) => ({ ...option, title: i === 3 ? V.SOURCE_TITLE : option.title }));
  const matchedPack = await generate({ title: V.SOURCE_TITLE }, alreadyMatched);
  assert.equal(matchedPack.options[0].seoScore, alreadyMatched[3].seoScore);
  assert.equal(matchedPack.options.filter((option) => option.title === V.SOURCE_TITLE).length, 1);
  assert.deepEqual(
    matchedPack.options.slice(1).map((option) => option.title),
    [4, 2, 1, 0].map((index) => alreadyMatched[index].title),
  );
  for (const source of [undefined, null, { title: "" }, { title: MR.MOTION_TEXT_CAU_CHUYEN }, { title: V.URL }]) {
    const pack = await generate(source);
    assert.deepEqual(pack.options, [...alternatives].reverse());
    assert.ok(!prompts.at(-1)!.includes(MOTION_SEO.SOURCE_TITLE_RULE));
  }
  const longPack = await generate({ title: V.LONG_TITLE });
  assert.equal(longPack.options[0].title, V.LONG_TITLE.slice(0, MOTION_SEO.TITLE_MAX_CHARACTERS));
  assert.equal(service.motionSeoSourceTitle({ title: V.SOURCE_TITLE + V.SOURCE_SUFFIX }), V.SOURCE_TITLE);
  assert.equal(service.motionSeoSourceTitle({ title: 42 } as any), "");
  let draft: import("../src/features/motion/server/services/motionSeoService.ts").MotionSeoDraft | undefined;
  let calls = 0;
  const controller = new AbortController();
  const incomplete = { ...alternatives[1], tags: [] };
  await assert.rejects(
    service.generateMotionSeo(analysis, script, {
      language: V.VI,
      exec: {},
      signal: controller.signal,
      ai: async () => {
        calls++;
        return { seoOptions: [alternatives[0], incomplete] };
      },
      onDraft: (value) => {
        draft = value;
        controller.abort();
      },
    }),
  );
  assert.equal(draft?.rejected, 1);
  const restored = await service.generateMotionSeo(analysis, script, {
    language: V.VI,
    exec: {},
    draft,
    ai: async (prompt) => {
      calls++;
      assert.ok(prompt.includes(MOTION_SEO.OPTION_ID(1)));
      const repair = JSON.parse(prompt.slice(prompt.indexOf("\n") + 1));
      assert.ok(!repair.pending.some((row: any) => row.id === MOTION_SEO.OPTION_ID(0)));
      return { seoOptions: alternatives.map((option, index) => ({ ...option, id: MOTION_SEO.OPTION_ID(index), title: V.REWRITTEN_TITLE })) };
    },
  });
  assert.equal(calls, 2);
  assert.equal(restored.options.length, service.SEO_OPTION_COUNT);
  assert.ok(restored.options.some((option) => option.title === alternatives[0].title));
  assert.ok(restored.options.some((option) => option.title === incomplete.title));
  process.stdout.write(V.PASSED);
} finally {
  await rm(output, { force: true });
}
