import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
const out = path.resolve("scratch/motion-script-intent-20261106/writing-test");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "isolated-storage");
delete process.env.APP_DATA_DIR;
await fs.mkdir(out, { recursive: true });
const { writeChapterBeats } = await import("../src/features/motion/server/services/motionStoryService.ts");
const { requestMotionEditorResponse } = await import("../src/lib/motionEditorResponse.ts");
const p = JSON.parse(await fs.readFile("storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json", "utf8"));
const analysis = structuredClone(p.result.analysis), chapter = { ...analysis.chapters[0], from: 0, to: 10, targetSeconds: 15, keyPoints: ["The companions exchange the scroll."] };
analysis.chapters = [chapter];
const narration = "The companions exchange the scroll.", intent = "AUTHOR: One companion lifts the scroll, the other receives it, then both lower their hands.\nKeep the scroll with the actual holder at each stage; both remain seated.";
let calls = 0;
const beats = await writeChapterBeats({ kind: "brief", text: narration } as any, analysis, chapter, {
  language: "en", exec: { provider: "gemini-chat", model: "gemini-flash::medium" } as any, isFirst: true, isLast: true, multiVoice: false, section: "Cover this single scene only.",
  ai: async (prompt, artifact) => {
    calls++;
    assert.equal(artifact, "motion-story-chapter");
    assert.ok(prompt.includes("write motionIntent as a detailed natural-language description"));
    assert.ok(prompt.includes("SELECTED VISUAL CONSTRUCTION"));
    assert.ok(prompt.includes("SUBJECT ACTIONS"));
    assert.ok(prompt.includes("cause-before-reaction"));
    assert.ok(prompt.includes("not just a picture, mood"));
    return { chapterId: chapter.id, beats: [{ id: "approved_beat", narration, visual: "scene", motionIntent: intent }] };
  },
});
assert.equal(calls, 1, "Motion prose is authored with the script, not by a later director call");
assert.equal(beats[0].motionIntent, intent);
let edits = 0;
const editedIntent = "AUTHOR revision: the first companion keeps the scroll; both rest their hands. No handover occurs.";
const result = await requestMotionEditorResponse("Edit source event", beats, ["narrator"], true, async () => {
  edits++;
  return { edits: [{ id: beats[0].id, narration: "They keep the scroll.", reason: "Source event corrected", motionIntent: editedIntent }] };
}, undefined, "", 1);
assert.equal(edits, 1);
assert.equal(result.edits[0].motionIntent, editedIntent);
await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ scriptCalls: calls, separateMotionCalls: 0, intentPreserved: true, editorialIntentPreserved: true, scope: "Scriptwriter and editor production services with technical fixture responses" }, null, 2));
console.log("PASS: script AI returns motionIntent in its original response; normalization and editorial response keep it verbatim; no separate motion authoring call.");
process.exit(0);
