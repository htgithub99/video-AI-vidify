import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getCinematicCharacterProviderRepairPrompt,
  getCinematicSceneImageProviderRepairPrompt,
  getCinematicThumbnailProviderRepairPrompt,
} from "../src/constants/cinematicPrompts";
import { CINEMATIC_GENERATION_RECOVERY_CONFIG, FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_MEDIA_CONFIG } from "../src/constants/config";
import { isProviderGenerationRejection } from "../src/services/projectImageGenerationService";
import { isSharedChromeFlowLoginRequiredState } from "../src/server/services/imageGeneratorService";

const providerRejection = "Gemini từ chối tạo nội dung: I can't generate the image due to interests of third-party content providers.";

assert.equal(CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS, 2);
assert.equal(isProviderGenerationRejection(providerRejection), true);
assert.equal(isProviderGenerationRejection("Google Flow đã từ chối cảnh hiện tại"), true);
assert.equal(isProviderGenerationRejection("Không thành công vì vi phạm quy tắc cộng đồng"), true);
assert.equal(isProviderGenerationRejection("temporary network timeout"), false);
assert.equal(FLOW_VIDEO_MEDIA_CONFIG.DOWNLOADABLE_URL_PATTERN.test("https://flow-content.google/video/42d2fb8c-0329-47fd-9336-6b422eb397d9"), true);
assert.equal(isSharedChromeFlowLoginRequiredState("https://labs.google/", "flow-project-1"), true);
assert.equal(isSharedChromeFlowLoginRequiredState("https://flow.google.com/about", "flow-project-1"), true);
assert.equal(isSharedChromeFlowLoginRequiredState("https://flow.google.com/project/flow-project-1", "flow-project-1"), false);
assert.match(FLOW_DIRECT_VIDEO_CONFIG.SHARED_CHROME_LOGIN_REQUIRED_ERROR, /đăng nhập Google Flow/i);

const sceneRepairPrompt = getCinematicSceneImageProviderRepairPrompt("Sun Wukong faces the celestial gate.", { id: "scene_001", script: "The hero faces the gate." });
assert.match(sceneRepairPrompt, /same approved story moment/i);
assert.match(sceneRepairPrompt, /visible characters, identity anchors, action, composition/i);
assert.match(sceneRepairPrompt, /scene_001/);

const thumbnailRepairPrompt = getCinematicThumbnailProviderRepairPrompt("Epic key art for the final confrontation.", { id: "film_cover_1", layoutId: "solo_left_arrow_right" });
assert.match(thumbnailRepairPrompt, /approved layout and exact visible headline/i);

const characterRepairPrompt = getCinematicCharacterProviderRepairPrompt("A highly detailed original mythic warrior character reference.", {
  id: "char_001",
  name: "Warrior",
  description: "Adult original fantasy warrior",
});
assert.match(characterRepairPrompt, /Google Flow Characters/i);
assert.match(characterRepairPrompt, /complete standalone prompt/i);

const imageGeneratorSource = resolveSourceTextConstants(readFileSync(new URL("../src/server/services/imageGeneratorService.ts", import.meta.url), "utf8"));
assert.match(imageGeneratorSource, /terminalWarning = errorMessage/);
assert.match(imageGeneratorSource, /warning: terminalWarning/);
assert.match(imageGeneratorSource, /const connectToSharedChromeBrowser = async/);
assert.match(imageGeneratorSource, /chromium\.connectOverCDP\(EXTERNAL_URLS\.PLAYWRIGHT_CDP\)/);
assert.match(imageGeneratorSource, /launchBrowserForAccount\(chromeHeadless\?: boolean, preferSharedChrome: boolean = true\)/);
assert.match(imageGeneratorSource, /getOrLaunchGlobalBrowser\(options\.chromeHeadless, true\)/);
assert.match(
  imageGeneratorSource,
  /const sharedBrowser = \(await connectToSharedChromeBrowser\(\)\) \|\| \(chromeHeadless === false \? await launchSharedChromeBrowser\(\) : null\);\s*if \(sharedBrowser\) return sharedBrowser;\s*throw new Error\(REFACTOR_CONSTANTS\.MSG_ALL_ACC_FAILED\)/,
);
assert.match(imageGeneratorSource, /preserveExternalPages: true/);
assert.match(imageGeneratorSource, /if \(activeBrowserInstance\.preserveExternalPages\)/);
assert.match(imageGeneratorSource, /const sharedChromePage = activeBrowserInstance\?\.preserveExternalPages/);

const serverSource = resolveSourceTextConstants(readFileSync(new URL("../server.ts", import.meta.url), "utf8"));
assert.match(
  serverSource,
  /if \(!_\.isEqual\(process\.env\.NODE_ENV, SERVER_CONFIG\.PRODUCTION\)\) \{[\s\S]*clearTimeout\(forcedExitTimer\);[\s\S]*process\.exit\(0\);[\s\S]*return;[\s\S]*const killCmd/,
);

const pipelineSource = resolveSourceTextConstants(readFileSync(new URL("../src/hooks/useAutoVideoPipeline.ts", import.meta.url), "utf8"));
assert.match(pipelineSource, /CHARACTER_PROVIDER_REJECTION_PURPOSE/);
assert.match(pipelineSource, /VI_CHARACTER_PROMPT_REPAIRING/);
assert.match(pipelineSource, /THUMBNAIL_PROVIDER_REJECTION_PURPOSE/);
assert.match(pipelineSource, /VI_CHARACTER_REFERENCE_REQUIRED/);
assert.match(pipelineSource, /VI_THUMBNAIL_REQUIRED/);
assert.match(pipelineSource, /VI_VIDEO_PROMPT_REPAIRING/);
assert.match(pipelineSource, /requestAiRewrittenVideoPrompt\(rejectedScene, currentPrompt, \[\]\)/);
assert.match(pipelineSource, /cinematicPreflightPrompts\.set\(rejectedScene\.id, repairedPrompt\)/);
assert.match(pipelineSource, /remoteVideoDownloadPending = false/);
assert.match(pipelineSource, /const runCinematicVideoQueue = async/);
assert.match(pipelineSource, /for \(const scene of scenesToProcess\)/);
assert.match(pipelineSource, /await runSceneGeneration\(\[scene\]/);
assert.match(pipelineSource, /if \(!hasSceneAsset\(scene\)\) break/);
assert.doesNotMatch(pipelineSource, /continuing with the AI-authored identity prompt/i);
assert.doesNotMatch(pipelineSource, /clean film keyframe|keyframe sạch/i);
assert.doesNotMatch(pipelineSource, /PIPELINE_EXTRACT_THUMBNAIL_FRAME/);

const controllerSource = resolveSourceTextConstants(readFileSync(new URL("../src/server/controllers/pipelineController.ts", import.meta.url), "utf8"));
assert.match(controllerSource, /getCinematicCharacterProviderRepairPrompt/);
assert.match(controllerSource, /getCinematicSceneImageProviderRepairPrompt/);
assert.doesNotMatch(controllerSource, /EXTRACT_THUMBNAIL_FRAME/);
assert.match(controllerSource, /const recoveryWasRejected = GEMINI_MEDIA_ERRORS\.PROVIDER_REJECTION_PATTERN/);
assert.match(controllerSource, /const activeVideoProjectKeys = new Set<string>\(\)/);
assert.match(controllerSource, /const anotherPendingVideoScene = _\.find/);

assert.match(imageGeneratorSource, /oldVideoGenerationFailureCount/);
assert.match(imageGeneratorSource, /newFailureCount = _\.max\(\[SecurityConstants\.ZERO, _\.subtract\(failureCount, oldGenerationFailureCount\)\]\)/);
assert.match(imageGeneratorSource, /waitForFlowGeneratedMediaBatch/);
assert.match(imageGeneratorSource, /_\.gte\(_\.size\(confirmedDomMedia\), expectedOutputCount\)/);
assert.match(imageGeneratorSource, /_\.add\(_\.size\(confirmedDomMedia\), newFailureCount\), expectedOutputCount/);
assert.match(imageGeneratorSource, /RECOVERY_READY_TIMEOUT_MS/);
assert.match(imageGeneratorSource, /await throwIfFlowMediaCardRejected\(page, mediaId\)/);
assert.match(imageGeneratorSource, /const hasCompletionSignal = Boolean/);
assert.match(imageGeneratorSource, /state\?\.thumbnailReady && hasCompletionSignal/);
assert.match(imageGeneratorSource, /if \(state\?\.videoReady\) return resultContainer/);
assert.match(imageGeneratorSource, /const projectMediaUrls = downloadedVideo \? \[\] : await collectFlowVideoUrls\(page, mediaId\)/);
assert.match(imageGeneratorSource, /DOWNLOADABLE_URL_PATTERN\.source/);
assert.match(
  imageGeneratorSource,
  /options\.sourceUrl[\s\S]*downloadValidatedVideo\(browserInstance\.context, \[options\.sourceUrl\][\s\S]*const directMediaUrl = createFlowMediaRedirectUrl\(mediaId\)[\s\S]*downloadFlowVideoFromEditor\(page, flowProjectId, mediaId/,
);
assert.match(imageGeneratorSource, /FLOW_VIDEO_MEDIA_CONFIG\.RECOVERY_REDIRECT_TIMEOUT_MS/);
assert.match(imageGeneratorSource, /getOrLaunchGlobalBrowser\(options\.chromeHeadless, true\)/);
assert.match(imageGeneratorSource, /else if \(!isFlowVideoGeneration\) \{\s*await activePage\.reload/);
assert.match(imageGeneratorSource, /const generationWasRejected = GEMINI_MEDIA_ERRORS\.PROVIDER_REJECTION_PATTERN/);
assert.match(imageGeneratorSource, /remoteMediaIds: generationWasRejected && _\.isEmpty\(remoteVideoMediaIds\) \? \[\] : remoteVideoMediaIds/);

process.stdout.write(JSON.stringify({ passed: true, providerRetries: CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS }));
