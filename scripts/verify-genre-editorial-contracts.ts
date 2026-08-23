import assert from "node:assert/strict";
import { VI_GENRE_GUIDELINES } from "../src/constants/promptGuidelines.ts";
import { VideoGenre } from "../src/constants/enums.ts";
import { compileImagePrompt } from "../src/services/imagePromptCompilerService.ts";

const explainer = VI_GENRE_GUIDELINES[VideoGenre.NARRATIVE_EXPLAINER];
assert.match(explainer, /what happened, what concrete detail proves it/i);
assert.doesNotMatch(explainer, /Vincom|Grab|ChatGPT|đăng xuất khỏi server/i);

const documentary = VI_GENRE_GUIDELINES.History;
assert.match(documentary, /authentic archival photographs, maps, plans/i);
assert.match(documentary, /AI reconstruction as archival evidence/i);

const prompt = compileImagePrompt({
  id: "sc_1",
  visibleAction: "Linh places the rent receipt on the counter",
  storyEvidence: "the increased amount is visibly circled",
  reaction: "her shoulders tighten as she checks her wallet",
  textAllowed: false,
  characterIds: ["char_linh"],
} as any, {
  targetStyle: "cinematic photorealism",
  characters: [{
    id: "char_linh", name: "Linh", images: [], genderPresentation: "Vietnamese woman",
    ageRange: "25 years old", ethnicitySkinTone: "warm light-medium skin", bodyBuild: "slender build",
    faceShape: "sharp oval face", eyes: "almond brown eyes", nose: "straight narrow nose",
    hair: "shoulder-length straight jet-black hair with side-part bangs",
    silhouette: "slender shoulders and upright posture", accessories: "tiny beauty mark under her right eye",
  } as any],
});
assert.match(prompt, /Linh, the same recurring person in every scene/i);
assert.match(prompt, /identity lock: preserve this exact named person's gender presentation/i);

console.log("Genre and editorial contract assertions passed.");
