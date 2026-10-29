import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_FOLK_WRITING as W, motionFolkWritingGuide } from "../src/constants/motionFolkWriting.js";
import { MOTION_FOLK_STORY as F } from "../src/constants/motionFolkStory.js";
import { motionFolkStyleFindings, motionScriptEditorialPlan } from "../src/lib/motionFolkWriting.js";
import { motionVideoGenreDirective } from "../src/constants/motionGenre.js";
import { motionChapterRepairPrompt } from "../src/lib/motionChapterRepair.js";
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-folk-writing-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = directory;
try {
  const { writeChapterBeats, editScript } = await import("../src/server/services/motionStoryService.js");
  const long = "Đêm ấy tôi ở trong nhà cùng chị và nghe tiếng gọi từ ngoài sân nhưng chị vẫn ngồi im bên cửa rồi bảo tôi đừng ra ngoài một mình.";
  const clear = "Đêm ấy tôi ở trong nhà cùng chị. Tôi nghe tiếng gọi từ ngoài sân. Nhưng chị vẫn ngồi im bên cửa. Rồi chị bảo tôi đừng ra ngoài một mình.";
  const beat = (id: string, text: string): any => ({ id, chapterId: "c1", narration: text, visual: "scene", place: "home", cast: ["toi"], shot: "wide", utterances: [{ id: id + ":u1", speaker: "narrator", role: "narration", text, emotion: "neutral", speed: 0.95, pauseAfter: 0.3 }] });
  const overloaded = ["a", "b", "c", "d"].map((id) => beat(id, long));
  const natural = [beat("short", "Tôi gọi chị. Chị không quay lại. Tôi gọi thêm lần nữa. Ngoài sân có tiếng dép. Lần này tiếng ấy gần hơn.")];
  assert.equal(motionFolkStyleFindings(overloaded, "vi", "ghost_tale").length, 4);
  assert.deepEqual(motionFolkStyleFindings(natural, "Vietnamese", "ghost_tale"), []);
  assert.deepEqual(motionFolkStyleFindings(overloaded, "en", "ghost_tale"), []);
  assert.deepEqual(motionFolkStyleFindings(overloaded, "vi", "history_story"), []);
  assert.deepEqual(
    motionFolkStyleFindings(
      overloaded.map((line) => ({ ...line, utterances: line.utterances.map((utterance: any) => ({ ...utterance, speaker: "toi", role: "dialogue" })) })),
      "vi",
      "ghost_tale",
    ),
    [],
  );
  const options = { language: "vi", genre: "ghost_tale", chapterCount: 1, complete: true };
  assert.equal(motionScriptEditorialPlan(natural, options), undefined);
  assert.deepEqual(
    motionScriptEditorialPlan(overloaded, options)?.focusIds,
    overloaded.map((line) => line.id),
  );
  for (const patch of [{ complete: false }, { editorPass: false }, { only: ["c1"] }]) assert.equal(motionScriptEditorialPlan(overloaded, { ...options, ...patch }), undefined);
  assert.ok(motionScriptEditorialPlan(overloaded, { ...options, only: ["c1"], resume: true }));
  assert.equal(motionScriptEditorialPlan(natural, { ...options, chapterCount: 2 })?.focusIds, undefined);
  assert.ok(motionScriptEditorialPlan(natural, { ...options, chapterCount: 2 }));
  assert.equal(motionFolkWritingGuide("English"), W.OTHER_LANGUAGE);
  assert.ok(motionFolkWritingGuide("vi").includes(W.RULE));
  assert.ok(!motionVideoGenreDirective("ghost_tale", false).includes("from the selected library"));
  const durationPrompt = motionChapterRepairPrompt([overloaded[0]], [{ id: "a", fields: ["narration", "utterances"], targetUnits: 30 }], { language: "vi", title: "Tiếng gọi", writingProfile: motionFolkWritingGuide("vi"), originality: F.COPY_ERROR("c1") });
  assert.ok(durationPrompt.includes(W.RULE) && durationPrompt.includes(F.COPY_ERROR("c1")), "Compact duration repairs must retain the writing register and originality rules");
  const source: any = { kind: "brief", title: "Tiếng gọi", text: "Người trong gia đình nghe một tiếng gọi lạ ngoài sân.", segments: [], sourceSeconds: 120 };
  const analysis: any = {
    videoGenre: "ghost_tale",
    title: "Tiếng gọi ngoài sân",
    logline: "Người kể nghe tiếng gọi ngoài sân.",
    cast: [{ key: "toi", name: "Người kể", role: "witness", gender: "male", age: "adult" }],
    places: [{ key: "home", name: "Nhà", description: "Gian nhà và sân", interior: true, time: "night" }],
    chapters: [{ id: "c1", title: "Tiếng gọi", summary: "Người kể nghe tiếng gọi ngoài sân.", keyPoints: ["Nghe tiếng gọi", "Người chị ngăn lại"], targetSeconds: 120 }],
    facts: [],
  };
  for (const mode of ["library", "remotion"] as const) {
    for (const language of ["vi", "en"]) {
      const configured = { ...analysis, visualSettings: mode === "remotion" ? { mode, profileId: "horror" } : { mode, packId: "minimal_mask" } };
      const snapshot = JSON.stringify(configured);
      let requests = 0;
      const lines = await writeChapterBeats(source, configured, configured.chapters[0], {
        language,
        exec: {},
        isFirst: true,
        isLast: true,
        ai: async (prompt) => {
          requests++;
          assert.ok(prompt.includes(F.CHAPTER_PROFILE));
          assert.ok(prompt.includes(language === "vi" ? W.RULE : W.OTHER_LANGUAGE));
          assert.equal(prompt.includes(W.RULE), language === "vi");
          assert.ok(prompt.includes("120"), "Selected chapter duration must remain in the request");
          return { beats: [beat("a", language === "vi" ? clear : "I heard someone calling from the yard. My sister stayed by the door. She told me to wait inside.")] };
        },
      });
      assert.equal(requests, 1, mode + ": writing style must not add an AI request or hard length gate");
      assert.equal(lines.length, 1, "Sentences must not become extra scenes");
      assert.equal(JSON.stringify(configured), snapshot, "Writing must not change production settings");
    }
    let repairRequests = 0;
    const repaired = await writeChapterBeats(source, { ...analysis, visualSettings: { mode } }, analysis.chapters[0], {
      language: "vi",
      exec: {},
      ai: async (prompt) => {
        repairRequests++;
        assert.ok(prompt.includes(W.RULE), "Field repair must retain the genre register");
        return repairRequests === 1 ? { beats: [beat("a", clear), { ...beat("b", long), place: "unknown" }] } : { beats: [{ id: "c1:beat:2", place: "home", narration: "Không được sửa phần lời đã đạt." }] };
      },
    });
    assert.equal(repairRequests, 2);
    assert.equal(repaired[0].narration, clear);
    assert.equal(repaired[1].narration, long, "Repair only the invalid field, preserving accepted speech");
    assert.equal(repaired[1].place, "home");
  }
  const focusIds = ["a", "b", "c"];
  const snapshot = structuredClone(overloaded);
  let editorRequests = 0;
  const edited = await editScript(source, analysis, overloaded, {
    language: "vi",
    exec: {},
    focusIds,
    ai: async (prompt) => {
      editorRequests++;
      assert.ok(prompt.includes(W.RULE) && prompt.includes(W.FOCUS(focusIds)));
      return { edits: focusIds.map((id) => ({ id, narration: clear, utterances: [{ speaker: "narrator", role: "narration", text: clear }] })) };
    },
  });
  assert.equal(editorRequests, 1);
  assert.equal(edited.edit.reviewed, 3);
  assert.equal(edited.edit.rewritten, 3, "All focused lines may be repaired instead of the old 15% cap");
  assert.equal(edited.beats.length, 4);
  for (const [index, line] of edited.beats.entries()) {
    if (index === 3) assert.deepEqual(line, snapshot[index]);
    else {
      assert.equal(line.narration, clear);
      assert.deepEqual({ ...line, narration: long, utterances: line.utterances!.map((utterance) => ({ ...utterance, text: long })) }, snapshot[index], "Keep scene and voice metadata while changing wording");
    }
  }
  assert.deepEqual(overloaded, snapshot);
  const empty = await editScript(source, analysis, overloaded, { language: "vi", exec: {}, focusIds, ai: async () => ({ edits: [] }) });
  assert.deepEqual(empty.beats, overloaded, "Style checking is advisory, not a production blocker");
  const invalid = await editScript(source, analysis, overloaded, { language: "vi", exec: {}, focusIds: ["a"], ai: async () => ({ edits: [{ id: "a", narration: clear }] }) });
  assert.deepEqual(invalid.beats, overloaded, "An incomplete narrator rewrite must not silently discard voice attribution");
  console.log("Folk writing passed: selected language and duration in both drawing modes, one chapter request, selective soft editing, no extra scenes, preserved narration/voice metadata and accepted rows.");
} finally {
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  fs.rmSync(directory, { recursive: true, force: true });
}
