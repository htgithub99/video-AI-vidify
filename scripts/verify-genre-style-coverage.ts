import assert from "node:assert/strict";
import { GENRE_OPTION_GROUPS } from "../src/constants/data.ts";
import { CURATED_STYLE_PRESETS, GENRE_STYLE_RECOMMENDATIONS, STYLE_CATEGORIES, getRecommendedStylePresetIds } from "../src/constants/stylePresets.ts";
const genreValues = GENRE_OPTION_GROUPS.flatMap((group) => [...group.options]);
for (const genre of genreValues) {
  const recommendations = getRecommendedStylePresetIds(genre);
  assert.ok(recommendations.length >= 3, `Missing style coverage for ${genre}`);
  recommendations.forEach((id) => assert.ok(CURATED_STYLE_PRESETS[id], `Unknown preset ${id} for ${genre}`));
}
assert.ok(Object.keys(CURATED_STYLE_PRESETS).length >= 17, "Expanded multi-genre preset catalog is missing");
assert.ok(STYLE_CATEGORIES.some((category) => category.id === "documentary_editorial"));
assert.ok(STYLE_CATEGORIES.some((category) => category.id === "infographic_concept"));
assert.ok(STYLE_CATEGORIES.some((category) => category.id === "artistic_retro"));
for (const preset of Object.values(CURATED_STYLE_PRESETS)) {
  assert.ok(preset.positivePrompt.length >= 80, `${preset.id} has a weak positive prompt`);
  assert.ok(preset.negativePrompt.length >= 50, `${preset.id} has a weak negative prompt`);
  assert.match(preset.characterRule, /only|preserve|must|remain|architecture is the subject|product shape/i, `${preset.id} lacks an identity boundary`);
}
const vietnameseNames = Object.values(CURATED_STYLE_PRESETS).map((preset) => preset.nameVi);
assert.equal(new Set(vietnameseNames).size, vietnameseNames.length, "Style display names must be unique");
assert.ok(
  vietnameseNames.every((name) => name.length <= 28),
  "Style display names must remain card-friendly",
);
assert.ok(!vietnameseNames.some((name) => /Tài Liệu Tư Liệu|Gái Xinh|Mắt Híp|Lịch Sử Hội Họa|Biên Tập/.test(name)), "Legacy confusing style labels remain visible");
assert.deepEqual(GENRE_STYLE_RECOMMENDATIONS["True Crime"][0], "true_crime_evidence");
assert.deepEqual(GENRE_STYLE_RECOMMENDATIONS.History[0], "archival_documentary");
console.log("Genre style coverage assertions passed.");
