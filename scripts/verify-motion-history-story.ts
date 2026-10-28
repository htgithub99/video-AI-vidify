import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { MOTION_VIDEO_GENRES as G, MOTION_VIDEO_GENRE_TEXT, motionVideoGenre, motionGenreCreative, motionVideoGenreDirective, motionVideoGenreWritingProfile, motionVideoGenrePackaging } from "../src/constants/motionGenre.js";
import { MOTION_HISTORY_STORY as H } from "../src/constants/motionHistoryStory.js";
import { MOTION_MUSIC } from "../src/constants/motionMusic.js";
import { MOTION_SOUND_GENRE_ALIAS } from "../src/constants/motionSound.js";
import { MOTION_PACK } from "../src/constants/motionPack.js";
import { RESPONSE_QA as V } from "./motionResponseContractVerificationTexts.js";
import { MotionStoryLength } from "../src/types/motionVideo.js";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.join(os.tmpdir(), `motion-history-story-${process.pid}`);
try {
  const { analyzeStory, parseStorySource, writeChapterBeats, editScript } = await import("../src/server/services/motionStoryService.js");
  assert.equal(motionVideoGenre(JSON.parse(JSON.stringify({ videoGenre: G.HISTORY_STORY })).videoGenre), G.HISTORY_STORY);
  assert.equal(motionGenreCreative(G.HISTORY_STORY), false);
  assert.equal(motionGenreCreative(G.GHOST_TALE), true);
  assert.equal(motionVideoGenreWritingProfile(G.HISTORY_STORY), H.PROFILE);
  assert.equal(motionVideoGenreWritingProfile(G.AUTO), "");
  for (const language of ["vi", "en"] as const) for (const genre of Object.values(G)) assert.ok(MOTION_VIDEO_GENRE_TEXT[language].OPTIONS[genre]);
  assert.ok(motionVideoGenreDirective(G.HISTORY_STORY, false).includes(H.PROFILE));
  assert.ok(motionVideoGenrePackaging(G.HISTORY_STORY).includes(H.PACKAGING));
  assert.ok(!motionVideoGenreDirective(G.HISTORY_MAP).includes(H.PROFILE));
  assert.ok(!motionVideoGenreDirective(G.GHOST_TALE).includes(H.PROFILE));
  assert.equal(MOTION_MUSIC.GENRE_MOOD[G.HISTORY_STORY], "neutral");
  assert.equal(MOTION_SOUND_GENRE_ALIAS[G.HISTORY_STORY], "documentary");
  const source = { ...parseStorySource("Một người lái đò đưa người dân qua sông khi cây cầu bị hỏng. Nhờ vậy, họ kịp mang lương thực đến làng."), kind: "text" as const };
  const raw: any = structuredClone(V.ANALYSIS);
  raw.videoDna.format.factual = true;
  const options = { language: "vi", length: MotionStoryLength.ONE, exec: {}, videoGenre: G.HISTORY_STORY };
  const assertProfile = (prompt: string) => {
    assert.ok(prompt.includes(H.PROFILE), "Selected history writing direction must reach every initial and repair request");
    assert.equal(prompt.split(H.PROFILE).length - 1, 1, "Do not duplicate the profile in one request");
  };
  let analysisCalls = 0;
  const analysis = await analyzeStory(source, {
    ...options,
    ai: async (prompt) => {
      assertProfile(prompt);
      analysisCalls++;
      return analysisCalls === 1 ? { ...structuredClone(raw), chapters: [{ ...raw.chapters[0], summary: 8 }] } : { title: "wrong", chapters: [{ summary: raw.chapters[0].summary }] };
    },
  });
  assert.equal(analysisCalls, 2);
  assert.equal(analysis.videoGenre, G.HISTORY_STORY);
  assert.equal(analysis.factual, true);
  assert.equal(analysis.title, raw.title);
  assert.equal(analysis.chapters[0].summary, raw.chapters[0].summary);
  const core: any = structuredClone(raw.videoDna);
  for (const field of ["audienceProfile", "era", "format", "editDna", "narrativeDna", "influences"]) delete core[field];
  delete core.creativeProfile.strengths;
  const partial = structuredClone(raw.videoDna);
  delete partial.narrativeDna.vocabulary;
  let profileCalls = 0;
  await analyzeStory(source, {
    ...options,
    ai: async (prompt) => {
      assertProfile(prompt);
      profileCalls++;
      if (profileCalls === 1) return { ...raw, videoDna: core };
      if (profileCalls === 2) return { videoDna: partial };
      assert.equal(profileCalls, 3);
      return { videoDna: { narrativeDna: { vocabulary: raw.videoDna.narrativeDna.vocabulary } } };
    },
  });
  assert.equal(profileCalls, 3);
  for (const settings of [{ visualSettings: { mode: "remotion", illustrationStyle: "history" } }, ...Object.keys(MOTION_PACK.PRESETS).map((stylePreset) => ({ stylePreset }))]) {
    let chapterCalls = 0;
    const chapterAnalysis: any = { ...analysis, ...settings, videoDna: undefined };
    const beats = await writeChapterBeats(source, chapterAnalysis, analysis.chapters[0], {
      language: "vi",
      exec: {},
      isFirst: true,
      isLast: true,
      ai: async (prompt) => {
        assertProfile(prompt);
        chapterCalls++;
        return { beats: [{ id: "c1:beat:1", narration: chapterCalls === 1 ? 8 : source.text, visual: "scene", place: "river", cast: [], action: "Người lái đò bên sông.", shot: "wide" }] };
      },
    });
    assert.equal(chapterCalls, 2);
    assert.equal(beats[0].narration, source.text);
    assert.equal(beats[0].place, "river");
  }
  let editorCalls = 0;
  const beat: any = { id: "b1", chapterId: "c1", narration: source.text, visual: "scene", place: "river" };
  const edited = await editScript(source, analysis, [beat], {
    language: "vi",
    exec: {},
    ai: async (prompt) => {
      assertProfile(prompt);
      editorCalls++;
      return { edits: [{ id: beat.id, narration: editorCalls === 1 ? 8 : source.text, reason: "Rõ nghĩa hơn." }] };
    },
  });
  assert.equal(editorCalls, 2);
  assert.equal(edited.beats[0].narration, source.text);
  assert.equal(edited.beats[0].place, beat.place);
  process.stdout.write("Motion history storytelling passed: analysis and DNA repairs, Remotion and both library packs, chapter/editor field repairs, factual mode and genre isolation. No live AI, TTS or video.\n");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
