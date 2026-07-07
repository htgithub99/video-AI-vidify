import { SceneDensity } from "../utils/sceneGeneratorHelper.js";

export interface SplitStrategyConfig {
  density: SceneDensity;
  instruction: string;
}

export const SPLIT_STRATEGY_CONFIGS: Record<string, SplitStrategyConfig> = {
  ultradense: {
    density: "THEO_TU",
    instruction: `CRITICAL STYLING / ULTRA-DENSE SPLITTING MANDATE: You MUST divide the script into ultra-short rhythmic scenes (roughly 2-4 seconds each) to achieve maximum image alignment with every spoken phrase or clause. Every single scene MUST contain only a brief phrase, a single clause, or 3-8 words of text. NEVER combine sentences, and do NOT skip or summarize any segment of the script. This ensures the output images fit every word and sentence perfectly step-by-step. MANDATORY: The visual design MUST strictly align with the exact content of that phrase or short sentence. ABSOLUTELY NO LAZINESS AND NO COMBINING OF CLAUSES.`,
  },
  word: {
    density: "THEO_TU",
    instruction: `CRITICAL STYLING / ULTRA-DENSE SPLITTING MANDATE: You MUST divide the script into ultra-short rhythmic scenes (roughly 2-4 seconds each) to achieve maximum image alignment with every spoken phrase or clause. Every single scene MUST contain only a brief phrase, a single clause, or 3-8 words of text. NEVER combine sentences, and do NOT skip or summarize any segment of the script. This ensures the output images fit every word and sentence perfectly step-by-step. MANDATORY: The visual design MUST strictly align with the exact content of that phrase or short sentence. ABSOLUTELY NO LAZINESS AND NO COMBINING OF CLAUSES.`,
  },
  hyperdense: {
    density: "CAU_NGAN",
    instruction: `CRITICAL SPLITTING MANDATE: To make the video extremely dynamic and high-paced, split the script into thin scene chunks of 2-4 seconds each. Divide sentences in half if they are long. MANDATORY: The visual design MUST strictly align with the exact content of that short sentence. DO NOT COMBINE SENTENCES TOGETHER.`,
  },
  short_sentence: {
    density: "CAU_NGAN",
    instruction: `CRITICAL SPLITTING MANDATE: To make the video extremely dynamic and high-paced, split the script into thin scene chunks of 2-4 seconds each. Divide sentences in half if they are long. MANDATORY: The visual design MUST strictly align with the exact content of that short sentence. DO NOT COMBINE SENTENCES TOGETHER.`,
  },
  multi_prompt: {
    density: "DA_PHAN_CANH",
    instruction: `CRITICAL SPLITTING MANDATE: You MUST split the script by sentences. For each sentence, generate AT LEAST ONE scene and prompt. If a sentence is long, complex, contains multiple clauses, split the sentence into 2 to 3 separate sub-scenes. MANDATORY: Generate at least 1 prompt per sentence. If a sentence is long, split it into 2-3 continuous moving sub-scenes.`,
  },
  highpaced: {
    density: "CAU_NGAN",
    instruction: `CRITICAL SPLITTING MANDATE: Keep a swift, modern pacing of 4-6 seconds per scene. Cut precisely at punctuation boundaries or short sentence blocks.`,
  },
  sentence: {
    density: "CAU_DAI",
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: To make the video exceptionally dynamic, engaging, and highly visual, you MUST split the script extremely finely. Every single sentence, spoken clause, or individual thought in the script MUST correspond to EXACTLY ONE scene. NEVER combine multiple sentences or long paragraphs into a single scene! Each scene must be approx 6-8 seconds. DO NOT summarize or skip any part of the script. MANDATORY: Never combine multiple sentences into a single scene. Combining sentences will ruin the pacing and rhythm.`,
  },
  long_sentence: {
    density: "CAU_DAI",
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: To make the video exceptionally dynamic, engaging, and highly visual, you MUST split the script extremely finely. Every single sentence, spoken clause, or individual thought in the script MUST correspond to EXACTLY ONE scene. NEVER combine multiple sentences or long paragraphs into a single scene! Each scene must be approx 6-8 seconds. DO NOT summarize or skip any part of the script. MANDATORY: Never combine multiple sentences into a single scene. Combining sentences will ruin the pacing and rhythm.`,
  },
  dramatic: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Keep a punchy, dramatic pacing of 8-10 seconds per scene. Focus heavily on suspenseful chapter transitions and key narrative beats.`,
  },
  paragraph: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide the script cleanly by entire paragraphs or main thoughts. Keep visual pacing slow and steady. Each scene will be longer (approx 10-15 seconds). Maintain absolute contextual continuity. DO NOT summarize or skip any part. MANDATORY: The visual design MUST strictly align with the exact content of that paragraph.`,
  },
  epic: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Keep an epic, wide pacing of 12-18 seconds per scene. Each scene corresponds to a grand chapter development or emotional crescendo.`,
  },
  cinematic: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by main cinematic segments (roughly 15-20 seconds each) to build deep visual atmospheric focus.`,
  },
  artistic: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Keep an artistic, poetic visual rhythm of 20-25 seconds per scene. Focus heavily on details and aesthetic continuity.`,
  },
  slowpaced: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by slow-paced narrative blocks (roughly 25-30 seconds each) for documentary or storytelling.`,
  },
  super_slow: {
    density: "THEO_DOAN",
    instruction: `CRITICAL SPLITTING MANDATE: Keep a super-slow, monumental pacing of over 30 seconds per scene. Ideal for slow atmospheric documentaries and deep-focus landscape layouts.`,
  },
};
