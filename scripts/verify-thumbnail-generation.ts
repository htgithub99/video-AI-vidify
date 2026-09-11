import assert from "node:assert/strict";
import { getThumbnailLayoutPrompt } from "../src/constants/prompts.ts";
import { THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, ThumbnailLayoutId, ThumbnailTypographyId } from "../src/constants/thumbnail.ts";
import { resolveBatchTabCount } from "../src/services/batchGenerationPolicy.ts";
import {
  createSourceGroundedThumbnailIdeas,
  createThumbnailGenerationPrompt,
  getThumbnailPlanningIssues,
  normalizeThumbnailIdeas,
  resolveThumbnailReferenceImages,
} from "../src/services/thumbnailPromptService.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import { GEMINI_CHAT_SPEED_TAB_COUNT, GeminiChatSpeed, ThumbnailTextMode } from "../src/types.ts";
import { PROJECT_IMAGE_FALLBACK_CONFIG } from "../src/constants/config.ts";

const projectStyleLock = "Flat stick-figure illustration; every person uses round heads, pill torsos, thin stick limbs, bold outlines and flat colors";
const generated = [
  {
    id: "ai_1",
    generationPrompt: `${projectStyleLock}. Use template solo_left_arrow_right with an anxious player on the left studying one empty wallet, render the exact Vietnamese headline 'TIỀN MẸ BAY' once on the right in heavy condensed uppercase type, with one curved black arrow pointing left toward the wallet`,
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "TIỀN MẸ BAY",
    layoutId: ThumbnailLayoutId.SoloLeftArrowRight,
    typographyId: ThumbnailTypographyId.CondensedImpact,
    subjectFocus: "Anxious player and empty wallet",
  },
  {
    id: "ai_2",
    generationPrompt: `${projectStyleLock}. Use template solo_left_arrow_right with a hostess revealing one hidden mechanism on the left, render the exact Vietnamese headline 'BẪY TÂM LÝ' once on the right in heavy condensed uppercase type, with one curved black arrow pointing left toward the evidence`,
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "BẪY TÂM LÝ",
    layoutId: ThumbnailLayoutId.SoloLeftArrowRight,
    typographyId: ThumbnailTypographyId.CondensedImpact,
    subjectFocus: "Hostess and gaming mechanism",
  },
];
const thirdGenerated = [
  {
    generationPrompt:
      "Use a catalog lineup template as the player walks away from the gaming table, render the exact Vietnamese headline 'RỜI KHỎI BẪY' once in the upper title zone",
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "RỜI KHỎI BẪY",
    subjectFocus: "Player leaving the table",
  },
];

const thumbnails = normalizeThumbnailIdeas([...generated, ...thirdGenerated], 3);
assert.equal(thumbnails.length, 3);
assert.deepEqual(
  thumbnails.map((thumbnail) => thumbnail.id),
  ["th_1", "th_2", "th_3"],
);
assert.equal(thumbnails[0].layoutId, ThumbnailLayoutId.SoloLeftArrowRight);
assert.equal(thumbnails[1].layoutId, ThumbnailLayoutId.SoloLeftArrowRight);
assert.notEqual(thumbnails[2].layoutId, undefined);
assert.equal(
  thumbnails.every((thumbnail) => thumbnail.hasText && Boolean(thumbnail.textText)),
  true,
);
assert.equal(
  thumbnails.every((thumbnail) => (thumbnail.textText || "").split(/\s+/).length <= THUMBNAIL_PROMPT_CONFIG.MAX_TEXT_WORDS),
  true,
);
assert.equal(THUMBNAIL_LAYOUT_CATALOG.length, 8);
assert.deepEqual(getThumbnailPlanningIssues(generated, ThumbnailTextMode.Headline, generated.length, projectStyleLock), []);

const sourceScript = "A player studies an empty wallet. A hostess reveals the hidden mechanism. The player walks away.";
const sourceThumbnails = createSourceGroundedThumbnailIdeas(sourceScript, 3, "flat editorial illustration");
assert.equal(sourceThumbnails.length, 3);
assert.equal(
  sourceThumbnails.every((thumbnail) => sourceScript.includes(thumbnail.subjectFocus || "")),
  true,
);
// A deterministic fallback must not manufacture or crop editorial copy. If AI is
// unavailable it preserves the visual concept and leaves headline text empty.
assert.equal(
  sourceThumbnails.every((thumbnail) => !thumbnail.textText),
  true,
);

const noTextThumbnails = normalizeThumbnailIdeas(generated, 2, "no_text");
assert.equal(noTextThumbnails[0].hasText, false);
assert.equal(noTextThumbnails[0].textText, "");

const prompt = createThumbnailGenerationPrompt(thumbnails[0], thumbnails[0].style, "16:9", true);
assert.ok(prompt.endsWith("--ar 16:9"));
assert.ok(prompt.includes(thumbnails[0].textText));
assert.doesNotMatch(prompt, /\d+(?:-\d+)?%/);
assert.match(prompt, /Do not render any other words, letters, numbers, percentages, measurements, template labels, layout annotations, or supporting copy/i);
assert.equal(
  THUMBNAIL_LAYOUT_CATALOG.every((layout) => !/\d+(?:-\d+)?%/.test(layout.composition)),
  true,
);

const references = resolveThumbnailReferenceImages({
  thumbnailReferenceImages: ["thumb-style.png"],
});
assert.deepEqual(references, ["thumb-style.png"]);

const nodeReferences = resolveThumbnailReferenceImages({
  styleReferenceImages: ["scene-style.png"],
  thumbnailReferenceImages: ["thumb-style.png", "thumb-layout.png", "thumb-extra.png"],
});
assert.deepEqual(nodeReferences, ["scene-style.png", "thumb-style.png", "thumb-layout.png"]);

assert.equal(resolveBatchTabCount(3, 1, 3), 3);
assert.equal(resolveBatchTabCount(8, 1, PROJECT_IMAGE_FALLBACK_CONFIG.TAB_CONCURRENCY), 3);
assert.equal(resolveBatchTabCount(4, 2), 2);
assert.equal(resolveBatchTabCount(3, 5, 4), 3);
assert.equal(GEMINI_CHAT_SPEED_TAB_COUNT[GeminiChatSpeed.Slow], 2);
assert.equal(GEMINI_CHAT_SPEED_TAB_COUNT[GeminiChatSpeed.Normal], 3);

const directorPrompt = getThumbnailLayoutPrompt("A story about a gambling trap", 3, "flat stickman reference", true, "16:9", ThumbnailTextMode.Headline);
assert.match(directorPrompt, /EXACTLY 3/);
assert.match(directorPrompt, /solo_left_arrow_right/);
assert.match(directorPrompt, /headline of two to five words directly inside the generated thumbnail/i);
assert.match(directorPrompt, /Keep generationPrompt below 150 English words/i);
assert.match(directorPrompt, /PROJECT STYLE LOCK/i);
assert.doesNotMatch(directorPrompt, /overall image style must be highly cinematic/i);
assert.match(directorPrompt, /Do not include --ar; the application appends it/i);
assert.match(directorPrompt, /"generationPrompt"\s*:/i);
assert.match(directorPrompt, /Choose exactly one of the eight layout IDs/i);
assert.match(directorPrompt, /sports_banner_subject/i);
assert.match(directorPrompt, /editorial_montage/i);

writeVerificationLog("Thumbnail generation assertions passed");
