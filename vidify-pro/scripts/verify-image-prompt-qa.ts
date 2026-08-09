import { evaluateImagePrompts, sanitizeImagePrompt } from "../src/services/imagePromptQualityService.ts";
import { BackgroundMode, TextInImageMode } from "../src/types.ts";

const assert = (value: unknown, message: string): void => { if (!value) throw new Error(message); };
const createScene = (id: string, prompt: string): any => ({ id, prompt, script: "Narration", subtitle: "Narration" });
const validPrompt = "Flat stickman illustration of a Vietnamese man opening a workshop door, white canvas with grounded tools, crisp solid shadow shapes, hopeful morning atmosphere, medium wide shot, eye-level composition, clear focal action and balanced subject placement";

assert(!sanitizeImagePrompt(`${validPrompt} --ar 16:9`).includes("--ar"), "Aspect-ratio flag was not removed.");
assert(evaluateImagePrompts([createScene("sc_1", validPrompt)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Valid image prompt was rejected.");
assert(!evaluateImagePrompts([createScene("sc_1", `${validPrompt}, certificate with Vietnamese text`)], { backgroundMode: BackgroundMode.White, textMode: TextInImageMode.Auto }).passed, "Readable AI text request was accepted.");
assert(!evaluateImagePrompts([createScene("sc_1", "flat illustration without camera direction")], { textMode: TextInImageMode.NoText }).passed, "Prompt without camera direction was accepted.");

process.stdout.write("Image prompt QA assertions passed.\n");
