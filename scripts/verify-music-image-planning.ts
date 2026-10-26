import assert from "node:assert/strict";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_TEXTS as prompts } from "../src/constants/sunoAutomation.ts";

// Exercise the same brief -> planning request boundary used by the cover endpoint.
const note = '- Đổi chữ thành đúng 2 từ, giữ font, màu đỏ và vị trí giữa ảnh.\n- Giữ nguyên nhân vật; đổi nền.\n- Không thêm dòng "2026".';
const songs = [{ title: "Đêm Thành Phố" }, { title: "Chờ Bình Minh" }];
const market = { market: { language: "Tiếng Việt", country: "Việt Nam", region: "Miền Nam" } };
const briefs = [
  prompts.buildMusicThumbnailPrompt(songs, "Synthwave", note, true, "", market),
  prompts.buildMusicThumbnailPrompt([], "Synthwave", note, false, "Music collection context", market),
  prompts.buildMusicVideoBackgroundPrompt(songs, "Synthwave", note, true, true, market),
  prompts.buildMusicVideoBackgroundPrompt(songs, "Synthwave", note, true, false, market),
];

for (const [index, brief] of briefs.entries()) {
  const purpose = index < 2 ? "cover" : SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO;
  const requestId = `planning-regression-${index}`;
  const request = prompts.buildMusicImagePromptPlanningPrompt(brief, purpose, requestId);
  assert.ok(request.startsWith("TEXT-ONLY PROMPT WRITING TASK."));
  assert.match(request, /Do not generate, render, edit or return an image/);
  assert.match(request, /Do not invoke image-generation tools/);
  assert.match(request, /separate application step/);
  assert.doesNotMatch(request, /Return the finished image|Create a finished professional|Before producing the final image/i);

  // The complete brief is a quoted JSON value, so visual requirements cannot
  // become unquoted execution instructions after interpolation.
  const quotedBrief = request.split("\n").find((line) => line.startsWith('{"imageBrief":'));
  assert.ok(quotedBrief);
  assert.equal(JSON.parse(quotedBrief).imageBrief, brief);
  assert.ok(brief.includes(note));
  assert.ok(brief.includes("Việt Nam"));
  assert.ok(request.endsWith(`Return only the JSON object with artifactType "music_image_prompt", requestId "${requestId}" and imagePrompt.`));
  assert.match(request, /100 and 4000/);
}

assert.match(briefs[2], /01\. Đêm Thành Phố\n02\. Chờ Bình Minh/);
assert.match(briefs[3], /Do not render any song title or track list/);

for (const purpose of ["cover", SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO]) {
  const request = prompts.buildMusicImageNoteNormalizationPrompt(note, purpose, true, true, "note-regression", market);
  const quotedNote = request.split("\n").find((line) => line.startsWith('{"note":'));
  assert.ok(quotedNote);
  assert.equal(JSON.parse(quotedNote).note, note);
  assert.match(request, /text-editing task: do not generate an image/);
  assert.ok(request.endsWith("Do not create or edit an image."));
}

process.stdout.write("Music cover/background planning stays text-only and preserves quoted visual requirements.\n");
