import assert from "node:assert/strict";
import fs from "node:fs";
import { CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA } from "../src/constants/responseSchemas";
import {
  getCinematicEditDecisionPrompt,
  getCinematicEditSceneMediaLabel,
  getCinematicFilmPackagePrompt,
  getCinematicFilmPackageRepairPrompt,
  getCinematicFinalVideoQualityPrompt,
  getCinematicSeoPrompt,
  getCinematicThumbnailPrompt,
} from "../src/constants/cinematicPrompts";
import { CINEMATIC_POLICY_CONFIG, CINEMATIC_ROOM_STAGE } from "../src/constants/cinematicConstants";
import {
  getThumbnailTechnicalPlanningIssues,
  preserveAiThumbnailIdeas,
  resolveThumbnailGenerationPrompt,
} from "../src/services/thumbnailPromptService";
import type { ThumbnailItem } from "../src/types";

assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.required, ["scriptSegment", "chapters", "characters", "scenes", "completionMarker"]);
assert("completionMarker" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties);
assert(!("continuityScore" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties));
assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties.scenes.items.required, ["id", "chapterId", "script", "subtitle", "characterIds"]);

const prompt = getCinematicFilmPackagePrompt("A courier must cross a flooded city.", "cinematic_episode", false, 900, 30, 10);
assert.match(prompt, /FINAL usable film package/i);
assert.match(prompt, /Application code will store these fields unchanged/i);
assert.match(prompt, /Let the later video-prompt director decide shot count/i);
assert.match(prompt, /characterIds containing only IDs from characters (?:who are )?visibly present/i);
assert.match(prompt, /completionMarker must be the final property/i);
assert.doesNotMatch(prompt, /YouTube|TikTok|viewer retention/i);
assert.match(getCinematicFilmPackageRepairPrompt(prompt, ["scenes:missing"]), /Return one complete film package again from the beginning/i);

const cinematicThumbnailPrompt = getCinematicThumbnailPrompt({
  rewrittenScript: "A courier crosses a flooded city.",
  thumbnailCount: 1,
  referenceDirection: "Rain-soaked photorealism",
  isVi: false,
  aspectRatio: "16:9",
  textMode: "headline",
  backgroundMode: "contextual",
  focusMode: "subject",
  backgroundDirective: "Flooded city",
  focusDirective: "Courier and sealed package",
  charactersJson: "[]",
  genre: "drama",
  writingStyle: "restrained",
  audience: "adult",
  hasThumbnailReference: true,
});
assert.match(cinematicThumbnailPrompt, /theatrical key art grounded in the completed film/i);
assert.match(cinematicThumbnailPrompt, /application code sends it unchanged/i);
assert.doesNotMatch(cinematicThumbnailPrompt, /Quick Video|YouTube thumbnail|TikTok|CTR strategist|approved layout library|viewer retention/i);

const editPrompt = getCinematicEditDecisionPrompt([{ sceneId: "scene_001" }]);
assert.match(editPrompt, /continuous take is valid/i);
assert.doesNotMatch(editPrompt, /expected to contain at least three|shot_count_below_3/i);
assert.match(getCinematicEditSceneMediaLabel("scene_001"), /SCENE scene_001: chronological contact sheet/i);
assert.match(getCinematicFinalVideoQualityPrompt("Screenplay", "Promise"), /creative improvements in warnings/i);
const cinematicSeoPrompt = getCinematicSeoPrompt("Screenplay", false, 3, 2, 5, 6, "drama", "adult");
assert.match(cinematicSeoPrompt, /accurate film publishing metadata/i);
assert.doesNotMatch(cinematicSeoPrompt, /Quick Video|YouTube|TikTok|growth template|viewer retention/i);

assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, 3);
assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT, 1);
assert.deepEqual(Object.values(CINEMATIC_ROOM_STAGE), ["script-room", "prompt-room", "thumbnail-room", "video-room"]);

const aiThumbnailPrompt = "AI-authored key-art prompt preserved byte-for-byte.\n";
const aiThumbnail = {
  id: "th_ai_1",
  generationPrompt: aiThumbnailPrompt,
  prompt: "legacy prompt must not be used",
} as ThumbnailItem;
assert.equal(resolveThumbnailGenerationPrompt(aiThumbnail, true, "ignored", "16:9"), aiThumbnailPrompt);
assert.equal(preserveAiThumbnailIdeas([aiThumbnail], 1)[0].generationPrompt, aiThumbnailPrompt);
assert.deepEqual(getThumbnailTechnicalPlanningIssues([aiThumbnail], 1), []);
assert.deepEqual(getThumbnailTechnicalPlanningIssues([{ id: "th_ai_1", generationPrompt: "" }], 1), ["thumbnail_generation_prompt_missing"]);

const controllerSource = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
const filmSetupSource = fs.readFileSync("src/components/cinematic/CinematicFilmSetupSection.tsx", "utf8");
const chatSettingsSource = fs.readFileSync("src/components/common/ChatPlanningSettingsBlock.tsx", "utf8");
const generatorSource = fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8");
const episodeServiceSource = fs.readFileSync("src/services/cinematicEpisodeService.ts", "utf8");
const imageGeneratorSource = fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8");
const cinematicPromptSource = fs.readFileSync("src/constants/cinematicPrompts.ts", "utf8");
const sharedPromptSource = fs.readFileSync("src/constants/prompts.ts", "utf8");
assert.match(controllerSource, /cinematicFilmPackage/);
assert.match(controllerSource, /getCinematicThumbnailPrompt/);
assert.match(controllerSource, /getCinematicFinalVideoQualityPrompt/);
assert.match(controllerSource, /isCinematicSeo[\s\S]*getCinematicSeoPrompt/);
assert.match(controllerSource, /roomCompletionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG\.COMPLETION_MARKER/);
assert.match(controllerSource, /finally \{\s*await closeCurrentRoomExecution\(CINEMATIC_ROOM_STAGE\.SCRIPT\)/);
assert.match(controllerSource, /productionScenes: _\.castArray\(cinematicFilmPackage\?\.scenes/);
assert.doesNotMatch(controllerSource, /getCinematicScreenplayEditorialPrompt/);
assert.doesNotMatch(controllerSource, /getCinematicNarrativePlanPrompt/);
assert.match(pipelineSource, /const shouldAnalyzeCharacters\s*=\s*!isCinematicPipeline/);
assert.match(pipelineSource, /PIPELINE_CLOSE_CHAT_PLANNING_ROOMS/);
assert.match(pipelineSource, /const thumbnailPlanningAttempted = Boolean\(thumbnailPlanRequest\)/);
assert.match(pipelineSource, /else if \(!thumbnailPlanningAttempted\)/);
assert.match(controllerSource, /isCinematicThumbnail\s*\? preserveAiThumbnailIdeas/);
assert.match(controllerSource, /if \(!isCinematicThumbnail && _\.lt\(_\.size\(normalizedThumbnails\), thumbnailCount\)\)/);
assert.match(filmSetupSource, /allowHybrid=\{false\}/);
assert.match(filmSetupSource, /AiPlanningExecutionMode\.ApiOnly/);
assert.doesNotMatch(filmSetupSource, /roomOnly/);
assert.match(chatSettingsSource, /value=\{AiPlanningExecutionMode\.ApiOnly\}/);
assert.match(chatSettingsSource, /texts\.PLANNING_API_ONLY/);
assert.doesNotMatch(filmSetupSource, /seriesMode|episodeCount/);
assert.match(generatorSource, /\[planningChromeHeadless, setPlanningChromeHeadless\] = useState\(false\)/, "planning Chrome must default to visible");
assert.match(generatorSource, /useState<SubtitleMode>\(SubtitleMode\.None\)/);
assert.match(episodeServiceSource, /GenerateType\.Video\) \? _\.toString\(scene\.generationPrompt\) : basePrompt/);
assert.match(imageGeneratorSource, /itemVisualConfig\.preserveAiPromptText[\s\S]*item\.prompt \|\| ""/);
assert.match(cinematicPromptSource, /getCinematicFilmPackagePrompt/);
assert.doesNotMatch(cinematicPromptSource, /Quick Video|YouTube|TikTok|viewer retention/i);
assert.doesNotMatch(sharedPromptSource, /getCinematicFilmPackagePrompt|getCinematicVideoPlanningPrompt|getCinematicThumbnailPrompt/);

process.stdout.write(JSON.stringify({ passed: true, promptBatchSize: 3, planningRooms: 1 }));
