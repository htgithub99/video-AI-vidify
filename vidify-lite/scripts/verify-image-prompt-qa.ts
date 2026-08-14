import { appendImagePromptAspectRatio, enforceImagePromptStyle, evaluateImagePrompts, removeGeneratedTextRequests, sanitizeImagePrompt } from "../src/services/imagePromptQualityService.ts";
import { BackgroundMode, TextInImageMode } from "../src/types.ts";
import { compileImagePrompt } from "../src/services/imagePromptCompilerService.ts";

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
const aiPrompt = "Stunning high-quality design depicting: Nam at a table, Realistic Cinematic, 3D Render, Dramatic Lighting";
const preservedPrompt = enforceImagePromptStyle(aiPrompt, referenceStyle, "Nam sits at a table", "medium shot", TextInImageMode.Auto, "16:9");
assert(preservedPrompt === `${aiPrompt} --ar 16:9`, "Application changed AI-authored prompt content.");
assert(!evaluateImagePrompts([createScene("sc_1", "Realistic Cinematic 3D render of Nam at a table, medium shot")], { targetStyle: referenceStyle }).passed, "Cross-style prompt drift was accepted.");
const aiViolation = "AI prompt with its own --ar 4:3";
assert(appendImagePromptAspectRatio(aiViolation, "16:9") === aiViolation, "Application silently rewrote an AI aspect-ratio violation.");

const softStylePrompt = compileImagePrompt({
  id: "sc_soft",
  script: "A broker signs a property contract in a modern office.",
  subtitle: "A broker signs a property contract in a modern office.",
  visualIntent: "Show a high-pressure property agreement in a modern office",
  visibleAction: "A broker signs a contract while a client watches",
  expectedSubjectCount: 2,
  characterIds: [],
  propIds: [],
  shotSize: "medium shot",
  cameraAngle: "eye-level angle",
  composition: "contract and both faces remain readable",
  layout: "single_frame",
  allowBackgroundPeople: false,
  textAllowed: false,
} as any, {
  aspectRatio: "16:9",
  targetStyle: "Dark dungeon with a candle and wooden door",
  visualBible: {
    visualStyle: "Dark dungeon with a candle and wooden door",
    styleProfile: {
      medium: "2D hand-drawn cartoon",
      characterDna: "rounded heads and simplified bodies",
      lineDna: "bold organic outlines",
      colorDna: "muted low-saturation palette",
      renderingDna: "flat color with restrained shadows",
      periodCues: "",
      worldRendering: "simplified readable environments",
      adaptiveElements: "lighting and composition follow each scene",
      sampleSpecificContent: ["dark dungeon", "candle", "wooden door"],
    },
  },
});
assert(/property contract|modern office/i.test(softStylePrompt), "Script-grounded narrative was lost.");
assert(!/dungeon|candle|wooden door/i.test(softStylePrompt), "Sample-specific content leaked into the prompt.");
assert(softStylePrompt.split(/\s+/).length <= 160, "Soft style prompt became overly constrained.");

const exactStyleLock = "Flat stickman illustration with round heads, pill torsos, thin stick limbs, bold outlines and flat colors";
const actionLockedScene = {
  ...createScene("sc_action", `${exactStyleLock}. Vũ leans forward while his left hand holds one watch and his right hand removes the strap, eyes fixed on the clasp, medium eye-level shot composition`),
  visualIntent: "Show Vũ removing one watch",
  visibleAction: "Vũ removes one watch",
  expectedSubjectCount: 1,
  characterIds: [],
  propIds: [],
  shotPurpose: "action",
  shotSize: "medium shot",
  cameraAngle: "eye-level angle",
  composition: "hands and clasp remain readable",
};
assert(evaluateImagePrompts([actionLockedScene], { requireStructuredPlan: true, targetStyle: exactStyleLock }).passed, "An exact shared Style Lock was rejected.");
assert(!evaluateImagePrompts([{ ...actionLockedScene, prompt: actionLockedScene.prompt.replace(exactStyleLock, "Flat cartoon") }], { requireStructuredPlan: true, targetStyle: exactStyleLock }).passed, "A prompt missing the exact shared Style Lock was accepted.");

process.stdout.write("Image prompt QA assertions passed.\n");
