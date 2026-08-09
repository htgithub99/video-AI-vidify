import { enforceImagePromptStyle, evaluateImagePrompts, sanitizeImagePrompt } from "../src/services/imagePromptQualityService.ts";
import { BackgroundMode, TextInImageMode } from "../src/types.ts";

const assert = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
const createScene = (id: string, prompt: string): any => ({ id, prompt, script: "Narration", subtitle: "Narration" });
const validPrompt = "Flat stickman illustration of a Vietnamese man opening a workshop door, white canvas with grounded tools, crisp solid shadow shapes, hopeful morning atmosphere, medium wide shot, eye-level composition, clear focal action and balanced subject placement";

assert(!sanitizeImagePrompt(`${validPrompt} --ar 16:9`).includes("--ar"), "Aspect-ratio flag was not removed.");
assert(evaluateImagePrompts([createScene("sc_1", validPrompt)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Valid image prompt was rejected.");
assert(!evaluateImagePrompts([createScene("sc_1", `${validPrompt}, certificate with Vietnamese text`)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Readable AI text request was accepted.");
assert(!evaluateImagePrompts([createScene("sc_1", "flat illustration without camera direction")], { textMode: TextInImageMode.NoText }).passed, "Prompt without camera direction was accepted.");
const referenceStyle = "chibi stickman cartoon illustration, oversized round head, small rounded bean-shaped torso, distinct stable hair silhouette, flat solid colors";
const repairedStyle = enforceImagePromptStyle("Stunning high-quality design depicting: Nam at a table, Realistic Cinematic, 3D Render, Dramatic Lighting", referenceStyle, "Nam sits at a table", "medium shot", TextInImageMode.Auto);
assert(repairedStyle.includes("distinct stable hair silhouette") && !/realistic cinematic|3d render|dramatic lighting/i.test(repairedStyle), "Reference style was not enforced over a cinematic fallback.");
assert(evaluateImagePrompts([createScene("sc_1", repairedStyle)], { textMode: TextInImageMode.Auto, targetStyle: referenceStyle }).passed, "Repaired reference-style prompt was rejected.");
assert(!evaluateImagePrompts([createScene("sc_1", "Realistic Cinematic 3D render of Nam at a table, medium shot")], { targetStyle: referenceStyle }).passed, "Cross-style prompt drift was accepted.");
const repeatedRules = enforceImagePromptStyle(repairedStyle, referenceStyle, "Nam sits at a table", "medium shot", TextInImageMode.Auto);
assert((repeatedRules.match(/absolutely no readable text/gi) || []).length === 1, "No-text directive was duplicated.");
assert((repeatedRules.match(/flat solid colors/gi) || []).length === 1, "Style clauses were duplicated.");

process.stdout.write("Image prompt QA assertions passed.\n");
