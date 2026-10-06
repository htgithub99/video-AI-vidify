import { stringifyJson } from "../src/lib/jsonStringify.js";
import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA, createCinematicFilmPackageResponseSchema } from "../src/constants/responseSchemas";
import { CINEMATIC_CONFIG, CINEMATIC_SCRIPT_ARTIFACT_CONFIG } from "../src/constants/config";
import { getCinematicGlobalEditDecisionPrompt, getCinematicFilmPackagePrompt, getCinematicFilmPackageRepairPrompt, getCinematicFinalVideoQualityPrompt, getCinematicSeoPrompt, getCinematicThumbnailPrompt, getCinematicThumbnailProviderRepairPrompt, getCinematicThumbnailTechnicalRepairPrompt, getCinematicVideoPlanningPrompt } from "../src/constants/cinematicPrompts";
import { CINEMATIC_PLANNING_MESSAGES, CINEMATIC_POLICY_CONFIG, CINEMATIC_PROGRESS_MESSAGES, CINEMATIC_ROOM_STAGE } from "../src/constants/cinematicConstants";
import { getThumbnailTechnicalPlanningIssues, normalizeThumbnailIdeas, resolveThumbnailGenerationPrompt } from "../src/services/thumbnailPromptService";
import { ThumbnailLayoutId, ThumbnailTypographyId } from "../src/constants/thumbnail";
import type { ThumbnailItem } from "../src/types";
assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.required, ["artifactType", "requestId", "scriptSegment", "chapters", "characters", "scenes", "intro", "completionMarker"]);
assert("completionMarker" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties);
assert(!("continuityScore" in CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties));
assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties.scenes.items.required, ["id", "chapterId", "script", "subtitle", "characterIds"]);
assert.deepEqual(CINEMATIC_FILM_PACKAGE_RESPONSE_SCHEMA.properties.intro.required, ["id", "script", "subtitle", "introTitle", "generationPrompt", "characterIds"]);
const exactSceneSchema = createCinematicFilmPackageResponseSchema(12);
assert.equal(exactSceneSchema.properties.scenes.minItems, 12);
assert.equal(exactSceneSchema.properties.scenes.maxItems, 12);
const prompt = getCinematicFilmPackagePrompt("A courier must cross a flooded city.", "cinematic_episode", false, 900, 30, 10, "run:film_package");
assert.match(prompt, /Write a complete, coherent and engaging film from the input/i);
assert.match(prompt, /Make all creative choices yourself/i);
assert.match(prompt, /language=English.*genre=cinematic_episode.*targetWords≈900.*exactScenes=30.*secondsPerScene=10/i);
assert.match(prompt, /Include every character who is visibly present in each scene in characterIds/i);
assert.match(prompt, /exclude names that are absent, off-screen or only mentioned/i);
assert.match(prompt, /Write all screenplay, scene summaries, dialogue and subtitles in natural English/i);
assert.match(prompt, /reusable Flow Character/i);
assert.match(prompt, /Show only that character/i);
assert.match(prompt, /full body in a natural three-quarter standing view/i);
assert.match(prompt, /exact character name/i);
assert.match(prompt, /completionMarker must be the final property/i);
assert.match(prompt, /return exactly 30 ordered, non-duplicated content scenes/i);
assert.match(prompt, /character identity and referenceGenerationPrompt fields in English/i);
assert.match(prompt, /establish who the protagonist is, what they want, why the conflict happens now/i);
assert.match(prompt, /show the consequence and a real ending/i);
assert.match(prompt, /one separate intro clip/i);
assert.match(prompt, /premium television-style opening/i);
assert.match(prompt, /premium television-style character introduction/i);
assert.match(prompt, /at least 4 clearly distinct, motivated camera setups/i);
assert.match(prompt, /reveal the protagonist with their exact name and identity anchors/i);
assert.match(prompt, /introduce each other principal character in a separate readable visual beat/i);
assert.match(prompt, /do not create a random trailer montage/i);
assert.doesNotMatch(prompt, /escalating sequence arc|attack-counter tactics|exact defence|lateral tracking|dance-like fighting/i);
assert.doesNotMatch(prompt, /YouTube|TikTok|viewer retention/i);
assert.match(getCinematicFilmPackageRepairPrompt(prompt, ["scenes:missing"]), /Return the complete valid JSON again/i);
const videoDirectorPrompt = getCinematicVideoPlanningPrompt("[]", "[]", "", "", "", 10);
assert.match(videoDirectorPrompt, /restate each visible recurring character's exact supplied name/i);
assert.match(videoDirectorPrompt, /coherent multi-shot character introduction with at least 4 motivated camera setups/i);
assert.match(videoDirectorPrompt, /omit absent and off-screen characters/i);
assert.match(videoDirectorPrompt, /separate starting position, action, weapon or prop, and reaction/i);
assert.match(videoDirectorPrompt, /never merge, swap, replace or duplicate identities/i);
const cinematicThumbnailPrompt = getCinematicThumbnailPrompt({
  requestId: "run:thumbnails",
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
assert.match(cinematicThumbnailPrompt, /every generationPrompt and all visual\/directorial metadata .* in English/i);
assert.match(cinematicThumbnailPrompt, /approved layout library/i);
assert.match(cinematicThumbnailPrompt, /solo_left_arrow_right/i);
assert.match(cinematicThumbnailPrompt, /locked typography/i);
assert.match(cinematicThumbnailPrompt, /original public-domain interpretation/i);
assert.match(cinematicThumbnailPrompt, /Never imitate a modern film, television series, game, animation, actor likeness/i);
assert.doesNotMatch(cinematicThumbnailPrompt, /Quick Video|YouTube thumbnail|TikTok|CTR strategist|viewer retention/i);
const vietnameseThumbnailPrompt = getCinematicThumbnailPrompt({
  requestId: "run:thumbnails",
  rewrittenScript: "Người đưa thư băng qua thành phố ngập nước.",
  thumbnailCount: 1,
  referenceDirection: "Rain-soaked photorealism",
  isVi: true,
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
});
assert.match(vietnameseThumbnailPrompt, /only the exact visible headline uses the selected screenplay language/i);
assert.match(vietnameseThumbnailPrompt, /natural Vietnamese phrase with correct diacritics/i);
assert.match(vietnameseThumbnailPrompt, /all surrounding visual direction inside generationPrompt remains English/i);
const thumbnailRepairPrompt = getCinematicThumbnailTechnicalRepairPrompt(vietnameseThumbnailPrompt, "{}", ["thumbnail_generation_prompt_missing"]);
assert.match(thumbnailRepairPrompt, /generationPrompt and all visual\/directorial metadata are English/i);
assert.match(thumbnailRepairPrompt, /only the exact visible headline may use the selected screenplay language/i);
const providerRepairPrompt = getCinematicThumbnailProviderRepairPrompt('Mythological hero with exact headline "ĐẠI CHIẾN"', {
  layoutId: "interaction_arrow_headline",
  textText: "ĐẠI CHIẾN",
});
assert.match(providerRepairPrompt, /without mistaking the subject for third-party entertainment content/i);
assert.match(providerRepairPrompt, /original public-domain interpretation/i);
assert.match(providerRepairPrompt, /Preserve the same story event, character identity, composition, approved layout and exact visible headline/i);
const editPrompt = getCinematicGlobalEditDecisionPrompt([{ sceneId: "scene_001" }], [{ sceneId: "scene_001", segments: [] }]);
assert.match(editPrompt, /deterministic libraries have already produced a complete renderable cut/i);
assert.match(editPrompt, /never tighten, expand or create a time boundary/i);
assert.match(editPrompt, /No production audio is attached/i);
assert.doesNotMatch(editPrompt, /expected to contain at least three|shot_count_below_3/i);
assert.match(getCinematicFinalVideoQualityPrompt("Screenplay", "Promise"), /creative improvements in warnings/i);
const cinematicSeoPrompt = getCinematicSeoPrompt("Screenplay", false, 3, 2, 5, 6, "drama", "adult", "run:seo");
assert.match(cinematicSeoPrompt, /accurate film publishing metadata/i);
assert.doesNotMatch(cinematicSeoPrompt, /Quick Video|YouTube|TikTok|growth template|viewer retention/i);
assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, 2);
assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_MAX_INPUT_CHARACTERS, 24000);
assert.equal(CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT, 1);
assert.deepEqual(Object.values(CINEMATIC_ROOM_STAGE), ["film-planning-room", "film-planning-room", "film-planning-room", "video-room"]);
assert.match(CINEMATIC_PROGRESS_MESSAGES.vi.THUMBNAIL_START, /ảnh bìa.*SEO/i);
assert.match(CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_START, /Bước 3\/4.*Flow.*Character/i);
assert.match(CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_READY, /Flow Character.*dùng lại/i);
assert.match(CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_PARTIAL, /Flow Character.*chưa hoàn tất/i);
const aiThumbnailPrompt = "AI-authored key-art prompt preserved byte-for-byte.\n";
const aiThumbnail = {
  id: "th_ai_1",
  generationPrompt: `${aiThumbnailPrompt} 16:9 composition with a curved arrow and the exact headline "FINAL CROSSING".`,
  prompt: "legacy prompt must not be used",
  hasText: true,
  textText: "FINAL CROSSING",
  layoutId: ThumbnailLayoutId.SoloLeftArrowRight,
  typographyId: ThumbnailTypographyId.CondensedImpact,
  style: "cinematic key art",
  layout: "subject left, headline right",
  layoutRationale: "The subject and headline form one readable conflict",
  typography: "condensed impact uppercase",
  accentWords: ["FINAL"],
  colorSuggestion: "deep blue and amber",
  subjectFocus: "the protagonist at the final crossing",
} as ThumbnailItem;
assert.equal(resolveThumbnailGenerationPrompt(aiThumbnail, true, "ignored", "16:9"), `${aiThumbnail.generationPrompt} --ar 16:9`);
assert.equal(normalizeThumbnailIdeas([aiThumbnail], 1)[0].generationPrompt, aiThumbnail.generationPrompt);
assert.deepEqual(getThumbnailTechnicalPlanningIssues([aiThumbnail], 1), []);
const incompleteThumbnailIssues = getThumbnailTechnicalPlanningIssues([{ id: "th_ai_1", generationPrompt: "" }], 1);
assert(incompleteThumbnailIssues.includes("thumbnail_generation_prompt_missing"));
assert(incompleteThumbnailIssues.includes("thumbnail_layout_not_in_catalog"));
assert(incompleteThumbnailIssues.includes("thumbnail_headline_missing"));
assert(incompleteThumbnailIssues.includes("thumbnail_style_missing"));
const controllerSource = resolveSourceTextConstants(fs.readFileSync("src/server/controllers/pipelineController.ts", "utf8"));
const pipelineSource = resolveSourceTextConstants(fs.readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8"));
const filmSetupSource = resolveSourceTextConstants(fs.readFileSync("src/components/cinematic/CinematicFilmSetupSection.tsx", "utf8"));
const chatSettingsSource = resolveSourceTextConstants(fs.readFileSync("src/components/common/ChatPlanningSettingsBlock.tsx", "utf8"));
const generatorSource = resolveSourceTextConstants(fs.readFileSync("src/components/AutoVideoGenerator.tsx", "utf8"));
const episodeServiceSource = resolveSourceTextConstants(fs.readFileSync("src/services/cinematicEpisodeService.ts", "utf8"));
const imageGeneratorSource = resolveSourceTextConstants(fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8"));
const cinematicPromptSource = resolveSourceTextConstants(fs.readFileSync("src/constants/cinematicPrompts.ts", "utf8"));
const sharedPromptSource = resolveSourceTextConstants(fs.readFileSync("src/constants/prompts.ts", "utf8"));
assert.match(controllerSource, /cinematicFilmPackage/);
assert.match(controllerSource, /schemaVersion: CINEMATIC_SCRIPT_ARTIFACT_CONFIG\.FILM_PACKAGE_SCHEMA_VERSION/);
assert.match(controllerSource, /getCinematicThumbnailPrompt/);
assert.match(controllerSource, /getCinematicFinalVideoQualityPrompt/);
assert.match(controllerSource, /isCinematicSeo[\s\S]*getCinematicSeoPrompt/);
assert.match(controllerSource, /roomCompletionMarker: CINEMATIC_SCRIPT_ARTIFACT_CONFIG\.COMPLETION_MARKER/);
assert.doesNotMatch(controllerSource, /closeCurrentRoomExecution/);
assert.match(controllerSource, /productionScenes: _\.castArray\(cinematicFilmPackage\?\.scenes/);
assert.doesNotMatch(controllerSource, /getCinematicScreenplayEditorialPrompt/);
assert.doesNotMatch(controllerSource, /getCinematicNarrativePlanPrompt/);
assert.match(pipelineSource, /const shouldAnalyzeCharacters\s*=\s*!isCinematicPipeline/);
assert.match(pipelineSource, /requiresCinematicVisualPromptLanguageUpgrade/);
assert.match(pipelineSource, /cinematicScriptArtifacts: scriptData\.cinematicScriptArtifacts \|\| newProj\.cinematicScriptArtifacts/);
assert.match(pipelineSource, /const characterReferencesComplete = Boolean/);
assert.match(pipelineSource, /PIPELINE_ENSURE_FLOW_CHARACTERS/);
assert.match(pipelineSource, /CINEMATIC_PLANNING_MESSAGES\.VI_CHARACTER_PACK_PARTIAL/);
assert.match(pipelineSource, /PIPELINE_CLOSE_CHAT_PLANNING_ROOMS/);
assert.match(pipelineSource, /THUMBNAIL_PROVIDER_REJECTION_PURPOSE/);
assert.match(pipelineSource, /VI_THUMBNAIL_RETRYING/);
assert.match(pipelineSource, /VI_THUMBNAIL_REQUIRED/);
assert.match(pipelineSource, /const thumbnailPlanningAttempted = Boolean\(thumbnailPlanRequest\)/);
assert.match(pipelineSource, /else if \(!thumbnailPlanningAttempted\)/);
assert.match(pipelineSource, /existingCinematicThumbnailContractIssues/);
assert.match(controllerSource, /const normalizedThumbnails = normalizeThumbnailIdeas/);
assert.match(controllerSource, /getThumbnailTechnicalPlanningIssues\(thumbsResult\.thumbnails, thumbnailCount, thumbnailTextMode\)/);
assert.doesNotMatch(controllerSource, /_\.lt\(_\.size\(normalizedThumbnails\), thumbnailCount\)/);
assert.match(filmSetupSource, /allowHybrid=\{false\}/);
assert.match(filmSetupSource, /AiPlanningExecutionMode\.ApiOnly/);
assert.doesNotMatch(filmSetupSource, /roomOnly/);
assert.match(chatSettingsSource, /value=\{AiPlanningExecutionMode\.ApiOnly\}/);
assert.match(chatSettingsSource, /texts\.PLANNING_API_ONLY/);
assert.doesNotMatch(filmSetupSource, /seriesMode|episodeCount/);
assert.match(generatorSource, /\[planningChromeHeadless, setPlanningChromeHeadless\] = useState<boolean>\(CINEMATIC_CONFIG\.GENERATION_DEFAULTS\.CHROME_HEADLESS\)/, "planning Chrome must use the centralized background-mode default");
assert.equal(CINEMATIC_CONFIG.GENERATION_DEFAULTS.CHROME_HEADLESS, true, "cinematic planning and video Chrome must default to background mode");
assert.match(generatorSource, /useState<SubtitleMode>\(SubtitleMode\.None\)/);
assert.match(generatorSource, /Math\.ceil\(clips \/ FLOW_DIRECT_VIDEO_CONFIG\.PROMPTS_PER_BATCH\)/);
assert.match(episodeServiceSource, /GenerateType\.Video\) \? _\.toString\(scene\.generationPrompt\) : basePrompt/);
assert.match(imageGeneratorSource, /itemVisualConfig\.preserveAiPromptText[\s\S]*item\.prompt \|\| ""/);
assert.match(imageGeneratorSource, /PROVIDER_REJECTION_PATTERN/);
assert.match(imageGeneratorSource, /image_generation_rejected/);
assert.match(imageGeneratorSource, /attachFlowCharactersByName/);
assert.match(imageGeneratorSource, /ensureFlowCharacters/);
assert.match(imageGeneratorSource, /if \(grokBrowser\?\.isConnected\(\)\) await grokBrowser\.close/);
assert.match(pipelineSource, /PIPELINE_ANALYZE_CINEMATIC_CLIPS[\s\S]*PIPELINE_CLEAN_BATCH_IMAGES[\s\S]*const renderPayload/);
assert.match(CINEMATIC_SCRIPT_ARTIFACT_CONFIG.SCENE_COUNT_MISMATCH_TEMPLATE, /scenes:count_mismatch/);
assert.match(controllerSource, /SCENE_COUNT_MISMATCH_TEMPLATE/);
assert.match(cinematicPromptSource, /getCinematicFilmPackagePrompt/);
assert.doesNotMatch(cinematicPromptSource, /Quick Video|YouTube|TikTok|viewer retention/i);
assert.doesNotMatch(sharedPromptSource, /getCinematicFilmPackagePrompt|getCinematicVideoPlanningPrompt|getCinematicThumbnailPrompt/);
process.stdout.write(stringifyJson({ passed: true, promptBatchSize: CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE, planningRooms: 1 }));
