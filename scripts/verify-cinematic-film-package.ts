import assert from "node:assert/strict";
import fs from "node:fs";
import { CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA } from "../src/constants/responseSchemas";
import { getCinematicFilmPackagePrompt } from "../src/constants/prompts";
import { CINEMATIC_POLICY_CONFIG, CINEMATIC_ROOM_STAGE } from "../src/constants/cinematicConstants";

assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.required, ["scriptSegment", "chapters", "characters", "scenes"]);
assert(!("completionMarker" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties));
assert(!("continuityScore" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties));

const prompt = getCinematicFilmPackagePrompt("A courier must cross a flooded city.", "cinematic_episode", false, 900, 30, 10);
assert.match(prompt, /FINAL usable film package/i);
assert.match(prompt, /Application code will store these fields unchanged/i);
assert.match(prompt, /Let the later video-prompt director decide shot count/i);

assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, 3);
assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT, 1);
assert.deepEqual(Object.values(CINEMATIC_ROOM_STAGE), ["script-room", "prompt-room", "thumbnail-room", "video-room"]);

const controllerSource = fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8");
const pipelineSource = fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8");
const filmSetupSource = fs.readFileSync("src/components/cinematic/CinematicFilmSetupSection.tsx", "utf8");
const chatSettingsSource = fs.readFileSync("src/components/common/ChatPlanningSettingsBlock.tsx", "utf8");
const generatorSource = fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8");
const episodeServiceSource = fs.readFileSync("src/services/cinematicEpisodeService.ts", "utf8");
assert.match(controllerSource, /cinematicFilmPackage/);
assert.match(controllerSource, /productionScenes: _\.castArray\(cinematicFilmPackage\?\.scenes/);
assert.doesNotMatch(controllerSource, /getCinematicScreenplayEditorialPrompt/);
assert.doesNotMatch(controllerSource, /getCinematicNarrativePlanPrompt/);
assert.match(pipelineSource, /const shouldAnalyzeCharacters\s*=\s*!isCinematicPipeline/);
assert.match(pipelineSource, /PIPELINE_CLOSE_CHAT_PLANNING_ROOMS/);
assert.match(filmSetupSource, /allowHybrid=\{false\}/);
assert.match(filmSetupSource, /AiPlanningExecutionMode\.ApiOnly/);
assert.doesNotMatch(filmSetupSource, /roomOnly/);
assert.match(chatSettingsSource, /value=\{AiPlanningExecutionMode\.ApiOnly\}/);
assert.match(chatSettingsSource, /texts\.PLANNING_API_ONLY/);
assert.doesNotMatch(filmSetupSource, /seriesMode|episodeCount/);
assert.match(generatorSource, /\[planningChromeHeadless, setPlanningChromeHeadless\] = useState\(false\)/, "planning Chrome must default to visible");
assert.match(generatorSource, /useState<SubtitleMode>\(SubtitleMode\.None\)/);
assert.match(episodeServiceSource, /GenerateType\.Video\) \? _\.toString\(scene\.generationPrompt\) : basePrompt/);

process.stdout.write(JSON.stringify({ passed: true, promptBatchSize: 3, planningRooms: 1 }));
