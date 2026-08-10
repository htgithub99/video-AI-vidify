import { enforceImagePromptStyle, evaluateImagePrompts, removeGeneratedTextRequests, sanitizeImagePrompt } from "../src/services/imagePromptQualityService.ts";
import { BackgroundMode, TextInImageMode } from "../src/types.ts";

const assert = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
const createScene = (id: string, prompt: string): any => ({ id, prompt, script: "Narration", subtitle: "Narration" });
const validPrompt = "Flat stickman illustration of a Vietnamese man opening a workshop door, white canvas with grounded tools, crisp solid shadow shapes, hopeful morning atmosphere, medium wide shot, eye-level composition, clear focal action and balanced subject placement";

assert(sanitizeImagePrompt(`${validPrompt} --ar 16:9`).endsWith("--ar 16:9"), "Aspect-ratio flag was not preserved at the end.");
assert(evaluateImagePrompts([createScene("sc_1", validPrompt)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Valid image prompt was rejected.");
assert(evaluateImagePrompts([createScene("sc_1", `${validPrompt}, certificate with Vietnamese text`)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Auto text mode did not preserve the AI planner decision.");
assert(!evaluateImagePrompts([createScene("sc_1", `${validPrompt}, certificate with Vietnamese text`)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.NoText }).passed, "No-text mode accepted readable AI text.");
assert(!evaluateImagePrompts([createScene("sc_1", `${validPrompt}, a worker, objects or environment only; do not add people`)], { backgroundMode: BackgroundMode.White }).passed, "People/no-people contradiction was accepted.");
assert(!/Cáº£nh tá»‰nh/.test(removeGeneratedTextRequests("A trophy with Vietnamese text 'Cáº£nh tá»‰nh', medium shot")), "Quoted generated text request was not removed.");
assert(!evaluateImagePrompts([createScene("sc_1", "flat illustration without camera direction")], { textMode: TextInImageMode.NoText }).passed, "Prompt without camera direction was accepted.");
const referenceStyle = "chibi stickman cartoon illustration, oversized round head, small rounded bean-shaped torso, distinct stable hair silhouette, flat solid colors";
const repairedStyle = enforceImagePromptStyle("Stunning high-quality design depicting: Nam at a table, Realistic Cinematic, 3D Render, Dramatic Lighting", referenceStyle, "Nam sits at a table", "medium shot", TextInImageMode.Auto, "16:9");
assert(repairedStyle.includes("distinct stable hair silhouette") && !/realistic cinematic|3d render|dramatic lighting/i.test(repairedStyle), "Reference style was not enforced over a cinematic fallback.");
assert(evaluateImagePrompts([createScene("sc_1", repairedStyle)], { textMode: TextInImageMode.Auto, targetStyle: referenceStyle }).passed, "Repaired reference-style prompt was rejected.");
assert(!evaluateImagePrompts([createScene("sc_1", "Realistic Cinematic 3D render of Nam at a table, medium shot")], { targetStyle: referenceStyle }).passed, "Cross-style prompt drift was accepted.");
const repeatedRules = enforceImagePromptStyle(repairedStyle, referenceStyle, "Nam sits at a table", "medium shot", TextInImageMode.Auto, "16:9");
assert((repeatedRules.match(/no text or logos/gi) || []).length === 1, "No-text directive was duplicated.");
assert((repeatedRules.match(/flat solid colors/gi) || []).length === 1, "Style clauses were duplicated.");
assert(repeatedRules.endsWith("--ar 16:9"), "Final prompt does not end with the required aspect ratio.");

const video2Style = "Simple 2D cartoon style with bold black outlines, stickfigure limbs, flat colors, pure white background";
const malformedVideo2Prompt = `${video2Style}. of Simple 2D cartoon style with bold black outlines of a player lifting a bowl, medium shot --ar 16:9`;
const cleanedVideo2Prompt = enforceImagePromptStyle(malformedVideo2Prompt, video2Style, "A player lifts a bowl", "zoom_in", TextInImageMode.Auto, "16:9");
assert(!/\.\s*of\s+Simple|style\s+with\s+bold\s+black\s+outlines\s+of/i.test(cleanedVideo2Prompt), "Malformed duplicated style connector remains.");
assert((cleanedVideo2Prompt.match(/Simple 2D cartoon style/gi) || []).length === 1, "Video 2 style was duplicated.");
assert(cleanedVideo2Prompt.endsWith("--ar 16:9"), "Cleaned Video 2 prompt lost its aspect ratio.");

process.stdout.write("Image prompt QA assertions passed.\n");
