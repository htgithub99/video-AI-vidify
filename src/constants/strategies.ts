import { SceneDensity } from "./enums.js";

export interface SplitStrategyConfig { density: SceneDensity; instruction: string; }

export const SPLIT_STRATEGY_CONFIGS: Record<string, SplitStrategyConfig> = {
  ultradense: {
    density: SceneDensity.THEO_TU,
    instruction: `CRITICAL SPLITTING MANDATE: Emulate an ultra-fast, high-energy TikTok/Shorts pacing. Split the script into highly kinetic scenes (approx 2.5 to 3.5 seconds each). The VERY FIRST scene (the Hook) MUST be instantly engaging (approx 2 seconds). MANDATORY SEMANTIC INTEGRITY: Even with fast cuts, every single scene's narration MUST be a grammatically complete, semantically meaningful sentence (containing a clear subject and predicate). Do NOT split into meaningless 1-word fragments.`,
  },
  word: {
    density: SceneDensity.THEO_TU,
    instruction: `CRITICAL SPLITTING MANDATE: Emulate an ultra-fast, high-energy TikTok/Shorts pacing. Split the script into highly kinetic scenes (approx 2.5 to 3.5 seconds each). The VERY FIRST scene (the Hook) MUST be instantly engaging (approx 2 seconds). MANDATORY SEMANTIC INTEGRITY: Even with fast cuts, every single scene's narration MUST be a grammatically complete, semantically meaningful sentence (containing a clear subject and predicate). Do NOT split into meaningless 1-word fragments.`,
  },
  hyperdense: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Emulate a professional video editor's pacing. Split the script into scenes of approximately 3.5 to 5 seconds each to maintain high engagement without causing eye strain (avoid cutting too fast). The VERY FIRST scene (the Hook) MUST be fast and punchy (approx 2-3 seconds) to grab attention immediately. Combine very short clauses into a single scene to maintain this rhythm. MANDATORY SEMANTIC INTEGRITY: Every single scene's narration MUST be a grammatically complete, semantically meaningful sentence. Do NOT split sentences into meaningless fragments.`,
  },
  short_sentence: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Emulate a professional video editor's pacing. Split the script into scenes of approximately 3.5 to 5 seconds each to maintain high engagement without causing eye strain (avoid cutting too fast). The VERY FIRST scene (the Hook) MUST be fast and punchy (approx 2-3 seconds) to grab attention immediately. Combine very short clauses into a single scene to maintain this rhythm. MANDATORY SEMANTIC INTEGRITY: Every single scene's narration MUST be a grammatically complete, semantically meaningful sentence. Do NOT split sentences into meaningless fragments.`,
  },
  mixed_sentences: {
    density: SceneDensity.CAU_KET_HOP,
    instruction: `CRITICAL SPLITTING MANDATE: Act as a master video editor to create dynamic, highly engaging pacing. You MUST split the script dynamically to keep the viewer hooked:
1. The VERY FIRST scene (the Hook) MUST be extremely short and punchy (approx 2-3 seconds) to grab instant attention.
2. For high-action, dramatic, or emotional moments, use fast-paced cuts (approx 3-4 seconds per scene).
3. For explaining details, lore, or scenery, use moderate-paced cuts (approx 5-7 seconds per scene).
NEVER exceed 7 seconds per scene to prevent viewer drop-off. Keep each scene's narration grammatically complete and semantically meaningful.`,
  },
  highpaced: {
    density: SceneDensity.CAU_NGAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep a swift, modern pacing like a professional video editor. Split the script into scenes of approximately 3 to 4 seconds each. The VERY FIRST scene (the Hook) MUST be punchy (approx 2-3 seconds). Cut precisely at punctuation boundaries, but combine very short fragments to maintain the 3-4s rhythm. Every single scene's narration MUST be a grammatically complete, semantically meaningful sentence.`,
  },
  sentence: {
    density: SceneDensity.CAU_DAI,
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: Emulate a professional documentary pacing. Split the script so each scene corresponds to a complete, full-length sentence (approx 6-8 seconds per scene). The VERY FIRST scene (the Hook) should be slightly punchier (approx 3-4 seconds) to establish initial engagement. NEVER combine multiple long paragraphs into a single scene. Each scene's narration must be grammatically complete and coherent.`,
  },
  long_sentence: {
    density: SceneDensity.CAU_DAI,
    instruction: `CRITICAL STYLING / SPLITTING MANDATE: Emulate a professional documentary pacing. Split the script so each scene corresponds to a complete, full-length sentence (approx 6-8 seconds per scene). The VERY FIRST scene (the Hook) should be slightly punchier (approx 3-4 seconds) to establish initial engagement. NEVER combine multiple long paragraphs into a single scene. Each scene's narration must be grammatically complete and coherent.`,
  },
  dramatic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Emulate a cinematic pacing with a punchy Hook. The VERY FIRST scene MUST be gripping and moderately short (approx 4-5 seconds). Following scenes should have a dramatic pacing of 8-10 seconds per scene, focusing on suspenseful transitions and key narrative beats.`,
  },
  paragraph: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide the script cleanly by entire paragraphs or main thoughts. Keep visual pacing slow and steady (approx 10-15 seconds per scene), but ensure the VERY FIRST scene (the Hook) is concise enough (approx 5-6 seconds) to anchor the viewer. Maintain absolute contextual continuity. DO NOT summarize or skip any part.`,
  },
  epic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep an epic, wide pacing of 12-18 seconds per scene. Each scene corresponds to a grand chapter development or emotional crescendo. The VERY FIRST scene (the Hook) should be slightly faster (approx 6-8 seconds) to build initial momentum.`,
  },
  cinematic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by main cinematic segments (roughly 15-20 seconds each) to build deep visual atmospheric focus. The VERY FIRST scene (the Hook) should be around 6-8 seconds to establish the cinematic tone quickly.`,
  },
  artistic: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep an artistic, poetic visual rhythm of 20-25 seconds per scene. Focus heavily on details and aesthetic continuity. Ensure the VERY FIRST scene (the Hook) is faster (approx 6-8 seconds) to grab the viewer before slowing down.`,
  },
  slowpaced: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Subdivide by slow-paced narrative blocks (roughly 25-30 seconds each) for documentary or storytelling. The VERY FIRST scene (the Hook) MUST still be relatively engaging (approx 8-10 seconds) to set the mood before transitioning to slow blocks.`,
  },
  super_slow: {
    density: SceneDensity.THEO_DOAN,
    instruction: `CRITICAL SPLITTING MANDATE: Keep a super-slow, monumental pacing of over 30 seconds per scene. Ideal for slow atmospheric documentaries and deep-focus landscape layouts. The VERY FIRST scene (the Hook) should be around 10-12 seconds to gently immerse the viewer.`,
  },
};
