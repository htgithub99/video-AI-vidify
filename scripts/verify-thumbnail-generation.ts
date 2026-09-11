import assert from "node:assert/strict";
import { getThumbnailLayoutPrompt } from "../src/constants/prompts.ts";
import { THUMBNAIL_LAYOUT_CATALOG, THUMBNAIL_PROMPT_CONFIG, ThumbnailLayoutId, ThumbnailTypographyId } from "../src/constants/thumbnail.ts";
import { resolveBatchTabCount } from "../src/services/batchGenerationPolicy.ts";
import {
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
    layout: "subject left, headline right",
    layoutRationale: "The empty wallet is the causal evidence",
    typography: "heavy condensed uppercase",
    accentWords: ["TIỀN"],
    colorSuggestion: "black, red and cream",
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
    layout: "subject left, headline right",
    layoutRationale: "The mechanism is the reveal",
    typography: "heavy condensed uppercase",
    accentWords: ["BẪY"],
    colorSuggestion: "black, red and cream",
    subjectFocus: "Hostess and gaming mechanism",
  },
];
const thirdGenerated = [
  {
    id: "ai_3",
    generationPrompt:
      `${projectStyleLock}. Use template solo_left_arrow_right as the player walks away from the gaming table, render the exact Vietnamese headline 'RỜI KHỎI BẪY' once on the right in heavy condensed uppercase type, with one curved black arrow pointing left toward the abandoned table`,
    style: "flat editorial stickman illustration",
    hasText: true,
    textText: "RỜI KHỎI BẪY",
    layoutId: ThumbnailLayoutId.SoloLeftArrowRight,
    typographyId: ThumbnailTypographyId.CondensedImpact,
    layout: "departing subject left, headline right",
    layoutRationale: "The departure promises the resolution",
    typography: "heavy condensed uppercase",
    accentWords: ["BẪY"],
    colorSuggestion: "black, red and cream",
    subjectFocus: "Player leaving the table",
  },
];

const thumbnails = normalizeThumbnailIdeas([...generated, ...thirdGenerated], 3);
assert.equal(thumbnails.length, 3);
assert.deepEqual(
  thumbnails.map((thumbnail) => thumbnail.id),
  ["ai_1", "ai_2", "ai_3"],
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

assert.throws(() => normalizeThumbnailIdeas([{ ...generated[0], id: "" }], 1), /invalid_ai_thumbnail_artifact/);

const noTextGenerated = generated.map((item) => ({
  ...item,
  hasText: false,
  textText: "",
  accentWords: [],
  generationPrompt: `${projectStyleLock}. ${item.subjectFocus}, subject left with clear negative space and one curved black arrow pointing left toward the evidence, no text or logos, free of readable text, 16:9 composition`,
}));
const noTextThumbnails = normalizeThumbnailIdeas(noTextGenerated, 2, "no_text");
assert.equal(noTextThumbnails[0].hasText, false);
assert.equal(noTextThumbnails[0].textText, "");

const prompt = createThumbnailGenerationPrompt(thumbnails[0], thumbnails[0].style, "16:9", true);
assert.ok(prompt.endsWith("--ar 16:9"));
assert.ok(prompt.includes(thumbnails[0].textText));
assert.doesNotMatch(prompt, /\d+(?:-\d+)?%/);
assert.equal(prompt.replace(/\s*--ar\s+16:9$/, ""), thumbnails[0].generationPrompt);
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
assert.match(directorPrompt, /headline of STRICTLY 2-5 words/i);
assert.match(directorPrompt, /Keep generationPrompt below 150 English words/i);
assert.match(directorPrompt, /STYLE AND ART DIRECTION/i);
assert.doesNotMatch(directorPrompt, /overall image style must be highly cinematic/i);
assert.match(directorPrompt, /Do not include --ar; the application appends it/i);
assert.match(directorPrompt, /"generationPrompt"\s*:/i);
assert.match(directorPrompt, /Choose exactly one of the eight layout IDs/i);
assert.match(directorPrompt, /sports_banner_subject/i);
assert.match(directorPrompt, /editorial_montage/i);

writeVerificationLog("Thumbnail generation assertions passed");
