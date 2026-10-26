export const PLANNING_PROFILE = {
  audienceProfile: { country: "Vietnam", language: "vi", dialect: "natural", ageRange: "adult", suitability: "folklore", viewingContext: "listening", confidence: 90 },
  era: { storyPeriod: "rural Vietnam", productionStyle: "static illustration" },
  format: { primary: "story", secondary: [], factual: false, reason: "Narrated folklore" },
  editDna: { pace: "calm", rhythm: "causal events", hookPlacement: "opening clue", narratorVoice: "clear", soundBed: "quiet", segmentForms: ["scene"], visualToolkit: ["static illustration"] },
  narrativeDna: { narrativeVoice: "natural", vocabulary: "familiar Vietnamese", themes: ["family"], imagery: ["river"], callbacks: [] },
  influences: [], creativeProfile: { strengths: ["clear causal ending"] },
};
export const PLANNING_DNA = {
  intent: "Tell a causal village story", audience: "Vietnamese adults", narrative: { voice: "natural", structure: "setup clue payoff", pacing: "calm" },
  visualDna: { style: "static folklore", composition: "readable people and props", camera: "stable", lighting: "clear", palette: "warm", materials: "flat", subjectHierarchy: "essential clue first" },
  creativeProfile: { role: "storyteller", writingPrinciples: ["clear cause and effect"], productionPrinciples: ["use existing assets"] },
  mustPreserve: ["the ending"], mustVary: ["new people"], mustNotCopy: ["original wording"], uncertainties: [], evidence: [{ claim: "river story", sourceClue: "bến sông", confidence: 100 }],
  characters: { design: "existing cast", proportions: "pack", poseLanguage: "simple static", continuity: ["same people"] },
  environment: { space: "riverside", scale: "human scale", propRules: "fixed supports", continuity: ["same location"] },
  cinematography: { framing: "wide", focus: "clue", movement: "static", editing: "event cuts" },
  audioText: { narration: "clear", sound: "quiet", subtitles: "no background" }, opening: { visual: "river", purpose: "establish location", acceptance: ["river visible"] }, qualityChecks: ["correct people and props"],
};
