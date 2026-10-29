import { PLANNING_DNA, PLANNING_PROFILE } from "./motionPlanningVerificationFixtures.js";
export const RESPONSE_QA = {
  TITLE: "Câu chuyện ở bến sông",
  SOURCE: "Người khách trở về bến sông. Anh gặp người lái đò rồi mang chiếc khăn về nhà.",
  ROOT: "motion-response-contract-",
  PASSED: "Motion response contracts passed: typed DNA, safe normalization, exhausted-draft recovery, targeted speech repair, accepted-row preservation and thumbnail type repair; no live AI, TTS or video.\n",
  NO_LIVE_AI: "Unexpected live AI call during response-contract verification",
  RULES: ["Keep the boat at the river bank.", "One owner keeps the same scarf."],
  NARRATION: ["Nam nói: “Tôi về đây.”", "Nam nói: “Mai tôi sang.”"],
  LINES: [
    [
      { speaker: "narrator", role: "narration", text: "Nam nói:" },
      { speaker: "nam", role: "dialogue", text: "“Tôi về đây.”" },
    ],
    [
      { speaker: "narrator", role: "narration", text: "Nam nói:" },
      { speaker: "nam", role: "dialogue", text: "“Mai tôi sang.”" },
    ],
  ],
  VOICES: [
    { id: "voice_narrator", name: "Narrator", gender: "male", age: "adult", language: "vi" },
    { id: "voice_nam", name: "Nam", gender: "male", age: "adult", language: "vi" },
  ],
  THUMBNAIL: "A simple static folk illustration of the approved river scene. Keep the two visible people beside the existing river bank and show the scarf as the only focal clue. Use a calm warm palette and readable Vietnamese title.",
  THUMB_ENTRY: 'export * from "./src/features/motion/server/services/motionThumbnailService.ts";',
  STORY_IMPORT: /(?:^|\/)motionStoryService\.js$/,
  IMAGE_IMPORT: /(?:^|\/)imageGeneratorService\.js$/,
  STUB_NAMESPACE: "response-contract-offline",
  STORY_STUB: [
    "export const runMotionAi = (...args) => globalThis.__responseContractAi(...args);",
    "export const mapMotionAiPool = (items, worker) => Promise.all(items.map(worker));",
    "export const runInMotionAiWorkerSession = (_scope, action) => action();",
    'export const acquireMotionRenderBrowser = () => { throw new Error("Unexpected browser render in offline response contract test"); };',
  ].join("\n"),
  IMAGE_STUB: 'export const generateImageWithPlaywright = async () => ({success:true,base64:"A".repeat(12000)});',
  ANALYSIS: {
    title: "Câu chuyện ở bến sông",
    logline: "Một người khách trở về bến sông rồi đem chiếc khăn về nhà.",
    cast: [],
    places: [{ key: "river", name: "Bến sông", description: "Village river bank", interior: false, time: "day" }],
    chapters: [{ id: "c1", title: "Người trở về", summary: "Người khách gặp người lái đò ở bến sông.", keyPoints: ["Người khách trở về", "Người lái đò trao chiếc khăn"] }],
    videoDna: { ...PLANNING_DNA, ...PLANNING_PROFILE, creativeProfile: { ...PLANNING_DNA.creativeProfile, ...PLANNING_PROFILE.creativeProfile } },
  },
} as const;
