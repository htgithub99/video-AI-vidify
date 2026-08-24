import assert from "node:assert/strict";
import fs from "node:fs";
import { GENRE_OPTION_GROUPS } from "../src/constants/data.ts";
import { createGenreEditorialDirective, listCoveredEditorialGenres, resolveGenreEditorialBlueprint } from "../src/services/genreEditorialBlueprintService.ts";
import { resolveAutomaticMusicProfile } from "../src/services/soundDesignService.ts";
import { resolveRolloutConfig } from "../src/services/rolloutService.ts";
import { resolveGenreVoiceArc } from "../src/services/productionQualityService.ts";

const selectableGenres = GENRE_OPTION_GROUPS.flatMap(group => [...group.options]);
const coveredGenres = new Set(listCoveredEditorialGenres());
for (const genre of selectableGenres) {
  assert.ok(coveredGenres.has(genre), `Missing editorial blueprint for ${genre}`);
  const blueprint = resolveGenreEditorialBlueprint(genre);
  assert.ok(blueprint.narrativeEngine && blueprint.visualGrammar && blueprint.audioDirection && blueprint.motionPolicy && blueprint.thumbnailPromise);
  assert.equal(resolveAutomaticMusicProfile(genre), blueprint.musicProfile);
  assert.ok(resolveGenreVoiceArc(genre).setup.emotion);
  assert.match(createGenreEditorialDirective(genre), /never copy a creator/i);
}

assert.notEqual(resolveGenreEditorialBlueprint("Review").id, resolveGenreEditorialBlueprint("True Crime").id);
assert.notEqual(resolveGenreEditorialBlueprint("Science").id, resolveGenreEditorialBlueprint("History").id);

const rollout = resolveRolloutConfig("global-editorial-test");
assert.equal(rollout.qaMode, "advisory");
assert.equal(rollout.maxEditorialRepairAttempts, 1);
assert.ok(Object.values(rollout.flags).every(Boolean));

const controller = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
assert.match(controller, /createGenreEditorialDirective\(config\.genre\)/);
assert.match(controller, /continuing_after_final_correction/);
assert.match(controller, /getThumbnailContractRepairPrompt/);
const renderer = fs.readFileSync("python_scripts/ffmpeg_render.py", "utf8");
for (const profile of new Set(selectableGenres.map(resolveAutomaticMusicProfile))) {
  assert.ok(renderer.includes(`"${profile}"`), `Renderer does not implement music profile ${profile}`);
}
console.log("Genre editorial blueprint assertions passed.");
