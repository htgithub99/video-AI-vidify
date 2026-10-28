import assert from "node:assert/strict";
import path from "node:path";
import { FOLK_QA as Q } from "./motionFolkStoryVerificationTexts.js";
import { raw, ids, STORY_CRAFT_QA as V } from "./motionStoryCraftVerificationTexts.js";
import { MOTION_FOLK_STORY as F } from "../src/constants/motionFolkStory.js";
import { motionKnownFolkContract, motionFolkStoryErrors, motionFolkTopicErrors, motionFolkTopicValid, motionFolkTopicContract, motionFolkCopied, scopeMotionFolkStoryRepair, motionFolkTextDrifts } from "../src/lib/motionFolkStory.js";
const oldStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(Q.STORAGE(process.pid));
try {
  const { developCreativeStory, writeChapterBeats, editScript } = await import("../src/server/services/motionStoryService.js");
  const { videoDnaSourceKey } = await import("../src/lib/motionVideoDna.js");
  const source: any = { title: Q.TITLE, text: Q.SOURCE, segments: [], sourceSeconds: 60, kind: V.BRIEF };
  const locked = motionKnownFolkContract(source.title, source.text, videoDnaSourceKey(source))!;
  assert.equal(locked.profileId, F.PROFILE_ID);
  assert.equal(motionKnownFolkContract(Q.TITLE, Q.UNKNOWN_SOURCE + " ma da ma da ma da", "fixture")!.topic.id, locked.topic.id);
  assert.deepEqual(motionFolkStoryErrors(raw, locked, source.text), []);
  for (const change of [{ belief: undefined }, { belief: { name: "Ma da" } }, { topicId: "ma_da" }, { topicEvidence: [] }, { topicEvidence: [{ chapterId: ids[0], quote: "invented evidence" }] }, { topicEvidence: [{ chapterId: "unknown", quote: Q.NEW_EVENT }] }]) assert.ok(motionFolkStoryErrors({ ...raw, ...change }, locked, source.text).includes(F.ALIGNMENT_ERROR));
  assert.ok(motionFolkCopied(Q.COPY.toUpperCase(), Q.COPY));
  assert.equal(motionFolkCopied(Q.ORIGINAL, Q.COPY), false);
  assert.ok(motionFolkTextDrifts("Ma da kéo người xuống nước.", locked, Q.NEW_EVENT));
  assert.equal(motionFolkTextDrifts("Ma da là điều người kể từng nghi nhầm.", locked, "Người kể từng nghi nhầm ma da."), false);
  assert.deepEqual(scopeMotionFolkStoryRepair({ patch: { chapters: raw.chapters.map((chapter: any) => ({ ...chapter, summary: "changed" })), title: "wrong" } }, [F.COPY_ERROR(ids[1])]), { patch: { chapters: [{ ...raw.chapters[1], summary: "changed" }] } });
  const analysis: any = { videoGenre: V.GENRE, title: V.OLD_TITLE, logline: V.OLD, chapters: ids.map((id) => ({ id, title: id, summary: V.OLD_CHAPTER, keyPoints: [V.OLD_EVENT], targetSeconds: 30 })), cast: [], places: [], facts: [] };
  const prompts: string[] = [];
  const developed = await developCreativeStory(analysis, source, {
    language: V.LANGUAGE,
    exec: {},
    ai: async (prompt) => {
      prompts.push(prompt);
      return prompts.length === 1 ? { ...raw, topicId: "ma_da", belief: { name: "Ma da" } } : { patch: { topicId: raw.topicId, topicEvidence: raw.topicEvidence, belief: raw.belief } };
    },
  });
  assert.equal(prompts.length, 2);
  assert.ok(prompts.every((prompt) => prompt.includes(F.PROFILE) && prompt.includes(locked.topic.id)));
  assert.ok(prompts[1].includes(F.ALIGNMENT_ERROR));
  assert.deepEqual(developed.storySpine, raw.storySpine);
  assert.deepEqual(
    developed.chapters.map((chapter) => chapter.summary),
    raw.chapters.map((chapter: any) => chapter.summary),
  );
  assert.deepEqual(developed.folkStoryContract, locked);
  const unknownSource: any = { ...source, title: Q.UNKNOWN_NAME, text: Q.UNKNOWN_SOURCE };
  const topic = { name: Q.UNKNOWN_NAME, meaning: Q.UNKNOWN_MEANING, aliases: [Q.UNKNOWN_NAME], evidence: Q.UNKNOWN_SOURCE.split(".")[0] };
  assert.ok(motionFolkTopicValid(topic, unknownSource.text));
  assert.equal(motionFolkTopicValid({ ...topic, evidence: Q.SOURCE }, unknownSource.text), false);
  assert.deepEqual(motionFolkTopicErrors({ ...topic, aliases: ["unrelated subject"] }, unknownSource.text), [F.TOPIC_ALIAS_ERROR]);
  assert.ok(F.TOPIC_PROMPT(unknownSource.text).includes("copy that alias from the quote"));
  const unknownContract = motionFolkTopicContract(topic, videoDnaSourceKey(unknownSource));
  const unknownRaw = {
    ...raw,
    sourceCore: { ...raw.sourceCore, premise: Q.NEW_UNKNOWN_EVENT },
    storySpine: { ...raw.storySpine, steps: raw.storySpine.steps.map((step: any) => ({ ...step, cause: Q.NEW_UNKNOWN_EVENT })) },
    topicId: unknownContract.topic.id,
    belief: { ...raw.belief, name: Q.UNKNOWN_NAME },
    topicEvidence: [{ chapterId: ids[0], quote: Q.NEW_UNKNOWN_EVENT }],
    chapters: raw.chapters.map((chapter: any) => ({ ...chapter, summary: Q.NEW_UNKNOWN_EVENT })),
  };
  let draft: any = { inputKey: "fixture", rejected: 0, folkTopic: { raw: { ...topic, aliases: ["unrelated subject"] }, state: { rejected: 2, errors: [F.TOPIC_ERROR], routes: { '["room-only","deepseek-chat","deepseek-standard"]': 2 } } } };
  let topicCalls = 0;
  const interrupted = new Error(Q.TOPIC_STATE);
  await assert.rejects(
    developCreativeStory(analysis, unknownSource, {
      language: V.LANGUAGE,
      exec: {},
      draft,
      onDraft: (value) => {
        draft = structuredClone(value);
      },
      ai: async (_prompt, artifact) => {
        if (artifact === F.TOPIC_ARTIFACT) {
          topicCalls++;
          return topic;
        }
        throw interrupted;
      },
    }),
  );
  assert.equal(topicCalls, 1);
  assert.equal(draft.folkTopic.state.recovery.revision, F.TOPIC_RECOVERY_REVISION);
  assert.deepEqual(draft.folkTopic.contract, unknownContract);
  await developCreativeStory(analysis, unknownSource, {
    language: V.LANGUAGE,
    exec: {},
    draft,
    ai: async (_prompt, artifact) => {
      assert.notEqual(artifact, F.TOPIC_ARTIFACT);
      return unknownRaw;
    },
  });
  const chapterPrompts: string[] = [];
  const chapterAnalysis = { ...developed, stylePreset: "minimal_mask" };
  await writeChapterBeats({ ...source, text: Q.COPY }, chapterAnalysis, developed.chapters[0], {
    language: V.LANGUAGE,
    exec: {},
    isFirst: true,
    isLast: false,
    ai: async (prompt) => {
      chapterPrompts.push(prompt);
      return { beats: [{ id: "a:beat:1", narration: chapterPrompts.length === 1 ? Q.COPY : Q.ORIGINAL, visual: V.VISUAL, place: V.PLACE }] };
    },
  });
  assert.equal(chapterPrompts.length, 2);
  assert.ok(chapterPrompts.every((prompt) => (prompt.includes(F.PROFILE) || prompt.includes(F.CHAPTER_PROFILE)) && prompt.includes(locked.topic.id)));
  assert.ok(!chapterPrompts[0].includes(Q.COPY));
  const beat: any = { id: "dialogue", chapterId: ids[0], narration: V.DIALOGUE, visual: V.VISUAL, place: V.PLACE, utterances: [{ id: "line", speaker: V.SPEAKER, role: V.ROLE, text: V.DIALOGUE, emotion: "neutral", speed: 0.95, pauseAfter: 0.3 }] };
  const edited = await editScript({ ...source, text: Q.COPY }, developed, [beat], {
    language: V.LANGUAGE,
    exec: {},
    ai: async (prompt) => {
      assert.ok(prompt.includes(F.PROFILE));
      assert.ok(prompt.includes(Q.COPY.slice(0, Math.floor(Q.COPY.length / developed.chapters.length))));
      return { edits: [{ id: beat.id, narration: Q.DIALOGUE, utterances: [{ speaker: V.SPEAKER, role: V.ROLE, text: Q.DIALOGUE }] }] };
    },
  });
  assert.equal(edited.beats[0].narration, Q.DIALOGUE);
  assert.equal(edited.beats[0].utterances![0].speaker, beat.utterances[0].speaker);
  assert.equal(edited.beats[0].utterances![0].speed, beat.utterances[0].speed);
  for (const utterances of [undefined, [{ speaker: "wrong", role: V.ROLE, text: Q.DIALOGUE }], [{ speaker: V.SPEAKER, role: V.ROLE, text: Q.ORIGINAL }]]) {
    const result = await editScript(source, developed, [beat], { language: V.LANGUAGE, exec: {}, ai: async () => ({ edits: [{ id: beat.id, narration: Q.DIALOGUE, utterances }] }) });
    assert.deepEqual(result.beats[0], beat);
  }
  process.stdout.write(Q.PASS);
} finally {
  if (oldStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = oldStorage;
}
