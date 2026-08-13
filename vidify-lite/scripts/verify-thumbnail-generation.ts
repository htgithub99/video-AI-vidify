import assert from "node:assert/strict";
import { getThumbnailLayoutPrompt } from "../src/constants/prompts.ts";
import { ThumbnailLayoutId } from "../src/constants/thumbnail.ts";
import { resolveBatchTabCount } from "../src/services/batchGenerationPolicy.ts";
import { createSourceGroundedThumbnailIdeas, createThumbnailGenerationPrompt, normalizeThumbnailIdeas, resolveThumbnailReferenceImages } from "../src/services/thumbnailPromptService.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const generated = [
  {
    id: "ai_1",
    prompt: "An anxious player studies an empty wallet while a gaming machine looms behind him",
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "TIỀN MẸ BAY",
    layoutId: ThumbnailLayoutId.SubjectLeftTextRight,
    subjectFocus: "Anxious player and empty wallet",
  },
  {
    id: "ai_2",
    prompt: "A hostess reveals the hidden mechanism behind the game",
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "BẪY TÂM LÝ",
    layoutId: ThumbnailLayoutId.SubjectLeftTextRight,
    subjectFocus: "Hostess and gaming mechanism",
  },
];
const thirdGenerated = [{
  prompt: "Player walks away from the gaming table",
  style: "flat editorial stickman illustration",
  hasText: false,
  subjectFocus: "Player leaving the table",
}];

const thumbnails = normalizeThumbnailIdeas([...generated, ...thirdGenerated], 3);
assert.equal(thumbnails.length, 3);
assert.deepEqual(thumbnails.map(thumbnail => thumbnail.id), ["th_1", "th_2", "th_3"]);
assert.equal(new Set(thumbnails.map(thumbnail => thumbnail.layoutId)).size, 3);

const sourceScript = "A player studies an empty wallet. A hostess reveals the hidden mechanism. The player walks away.";
const sourceThumbnails = createSourceGroundedThumbnailIdeas(sourceScript, 3, "flat editorial illustration");
assert.equal(sourceThumbnails.length, 3);
assert.equal(sourceThumbnails.every(thumbnail => sourceScript.includes(thumbnail.subjectFocus || "")), true);

const noTextThumbnails = normalizeThumbnailIdeas(generated, 2, "no_text");
assert.equal(noTextThumbnails[0].hasText, false);
assert.equal(noTextThumbnails[0].textText, "");

const prompt = createThumbnailGenerationPrompt(thumbnails[0], thumbnails[0].style, "16:9", true);
assert.ok(prompt.endsWith("--ar 16:9"));
assert.match(prompt, /background without typography/i);
assert.match(prompt, /attached thumbnail reference images/i);
assert.match(prompt, /flat editorial stickman illustration/i);
assert.doesNotMatch(prompt, new RegExp(thumbnails[0].textText || "", "i"));

const references = resolveThumbnailReferenceImages({
  thumbnailReferenceImages: ["thumb-style.png"],
});
assert.deepEqual(references, ["thumb-style.png"]);

const nodeReferences = resolveThumbnailReferenceImages({
  thumbnailReferenceImages: ["thumb-style.png"],
  characters: [
    { id: "char_1", name: "Player", description: "Player", images: ["player.png"] },
    { id: "char_2", name: "Hostess", description: "Hostess", images: ["hostess.png"] },
  ],
}, true);
assert.deepEqual(nodeReferences, ["thumb-style.png", "player.png", "hostess.png"]);

assert.equal(resolveBatchTabCount(3, 1, 3), 3);
assert.equal(resolveBatchTabCount(4, 2), 2);
assert.equal(resolveBatchTabCount(3, 5, 4), 3);

const directorPrompt = getThumbnailLayoutPrompt("A story about a gambling trap", 3, "flat stickman reference", true, "16:9", "auto");
assert.match(directorPrompt, /EXACTLY 3/);
assert.match(directorPrompt, /subject_left_text_right/);
assert.doesNotMatch(directorPrompt, /EVERY single design.*hasText: true/i);
assert.doesNotMatch(directorPrompt, /overall image style must be highly cinematic/i);
assert.match(directorPrompt, /application appends only one aspect-ratio suffix/i);
assert.match(directorPrompt, /complete standalone generation-ready prompt/i);

writeVerificationLog("Thumbnail generation assertions passed");
