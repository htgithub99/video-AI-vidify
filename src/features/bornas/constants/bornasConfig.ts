import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import type { ReupAiChoice } from "../../reup/types/reup.js";
import type { BornasAiSettings, BornasChannel, BornasStepId, BornasTopic } from "../types/bornas.js";
export const BORNAS_STEPS: readonly BornasStepId[] = ["sample", "script", "voice", "assets", "shots", "build", "render"];
export const BORNAS_VIDEO_STEPS: readonly BornasStepId[] = ["voice", "assets", "shots", "build", "render"];
export const BORNAS_API = { SOURCE: "/source", START: "/start", APPROVE: "/approve", RERUN: "/rerun", CANCEL: "/cancel", STATUS: "/status/:jobId", JOBS: "/jobs", DELETE: "/delete", SAVE_VIDEO: "/save-video", ANNOTATE: "/annotate", DELETE_VIDEOS: "/delete-videos" } as const;
export const BORNAS_URL = {
  SOURCE: "/api/bornas/source",
  START: "/api/bornas/start",
  APPROVE: "/api/bornas/approve",
  RERUN: "/api/bornas/rerun",
  CANCEL: "/api/bornas/cancel",
  STATUS: (jobId: string): string => `/api/bornas/status/${encodeURIComponent(jobId)}`,
  JOBS: "/api/bornas/jobs",
  DELETE: "/api/bornas/delete",
  SAVE_VIDEO: "/api/bornas/save-video",
  DELETE_VIDEOS: "/api/bornas/delete-videos",
} as const;
export const BORNAS_STORAGE = { STATE: "bornas_state_v1" } as const;
export const BORNAS_DIR = { OUTPUT: "output", ROOT: "bornas", SAMPLES: "_samples", SHEETS: "sheets", JOB_FILE: "job.json", ASSETS_URL: "/assets/bornas/", PYENV: "pyenv", KIT: ["tools", "born-as-kit"], LIB: ["tools", "born-as-lib"], VIDEO: "video", ASSETS: "assets", RAW: "raw", RENDER: "render", VOICE: "voice", SHOTS: "shots", PREVIEW: "preview_720p.mp4" } as const;
export const BORNAS_TOPIC_LIBS: Record<BornasTopic, string[]> = {
  world: ["ancient", "medieval", "eastasia", "ww", "modern"],
  ww: ["ww"],
  ancient: ["ancient"],
  medieval: ["medieval"],
  eastasia: ["eastasia"],
  vietnam: ["vietnam"],
  modern: ["modern"],
  game: ["game"],
  wildwest: ["wildwest"],
};
export const BORNAS_SIZES: { re: RegExp; min: number; max: number; std: number }[] = [
  { re: /(?:nightstand|bedside|side_table)s?\b/, min: 0.5, max: 0.85, std: 0.7 },
  { re: /(?:bed|cot|couch|sofa)s?\b/, min: 0.6, max: 1.4, std: 1 },
  { re: /(?:chair|stool|bench)s?\b/, min: 0.45, max: 1.3, std: 1 },
  { re: /(?:table|desk|counter)s?\b/, min: 0.7, max: 1.2, std: 0.8 },
  { re: /(?:revolver|pistol|derringer|colt)s?\b/, min: 0.08, max: 0.3, std: 0.15 },
  { re: /(?:rifle|shotgun|winchester|musket|carbine)s?\b/, min: 0.08, max: 0.35, std: 0.18 },
  { re: /(?:glass|cup|mug)s?\b/, min: 0.06, max: 0.2, std: 0.12 },
  { re: /(?:bottle|flask)s?\b/, min: 0.15, max: 0.45, std: 0.3 },
  { re: /(?:hourglass)s?\b/, min: 0.12, max: 0.45, std: 0.25 },
  { re: /(?:watch|coin|badge|ring)s?\b/, min: 0.02, max: 0.12, std: 0.06 },
  { re: /(?:hat|cap)s?\b/, min: 0.08, max: 0.3, std: 0.15 },
  { re: /(?:book|diploma|scroll|letter|paper|map|handkerchief)s?\b/, min: 0.03, max: 0.45, std: 0.25 },
  { re: /(?:bag|satchel|sack)s?\b/, min: 0.2, max: 0.8, std: 0.4 },
  { re: /(?:barrel|crate|chest)s?\b/, min: 0.4, max: 1.2, std: 0.9 },
  { re: /(?:lamp|lantern|candle)s?\b/, min: 0.1, max: 0.6, std: 0.35 },
  { re: /(?:chicken|hen|rooster|cat)s?\b/, min: 0.25, max: 0.6, std: 0.4 },
  { re: /(?:dog|wolf|coyote)s?\b/, min: 0.45, max: 1, std: 0.7 },
  { re: /(?:horse|mule|cow|ox|bull|buffalo|bison)s?\b/, min: 1.3, max: 2.8, std: 1.8 },
  { re: /(?:locomotive|train|boxcar|railcar|railroad|caboose|freight_car|tender)s?\b/, min: 3.5, max: 5.5, std: 4.3 },
  { re: /(?:steamship|steamer|liner|ship|ferry)s?\b/, min: 8, max: 40, std: 16 },
  { re: /(?:rowboat|canoe|raft|skiff|boat)s?\b/, min: 0.6, max: 3, std: 1.2 },
  { re: /(?:wagon|coach|cart|carriage)s?\b/, min: 1.5, max: 3.2, std: 2.4 },
  { re: /(?:fence|rail|hitching)s?\b/, min: 0.8, max: 1.8, std: 1.2 },
  { re: /(?:cactus)s?\b/, min: 0.8, max: 9, std: 3 },
  { re: /(?:tree)s?\b/, min: 3, max: 20, std: 9 },
  { re: /(?:house|cabin|saloon|church|store|building|barn|bank|jail|hotel)s?\b/, min: 3, max: 14, std: 6 },
];
export const BORNAS_KIND_SIZES: Record<string, { min: number; max: number; std: number }> = { person: { min: 1, max: 2.1, std: 1.75 }, animal: { min: 0.2, max: 3, std: 1 }, vehicle: { min: 1, max: 6, std: 2.4 }, weapon: { min: 0.08, max: 1.5, std: 0.3 }, prop: { min: 0.03, max: 3, std: 0.5 }, structure: { min: 0.8, max: 30, std: 3 }, nature: { min: 0.3, max: 30, std: 2 } };
export const BORNAS_ANN = { VERSION: 1, BG_VERSION: 5, BUST_FACE: 0.33, LIE_ASPECT: 1.25, SEATS: ["bed", "bench", "sofa", "chair"], TMP_PREFIX: "bornas_ann_", CAST_FILE: "ann.json", GROUND_MIN: 420, GROUND_MAX: 1075, PERSON_MIN: 80, PERSON_MAX: 820, PERSON_DEFAULT: 420, LIB_BATCH: 240 } as const;
export const BORNAS_REVIEW = { TEXT_DELAY: 0.7, SNAP_BATCH: 40, FIXES: ["wide", "tag", "drop_text"] } as const;
export const BORNAS_TOPIC_GRADE: Partial<Record<BornasTopic, string>> = { wildwest: "old" };
export const BORNAS_TOPICS = Object.keys(BORNAS_TOPIC_LIBS) as BornasTopic[];
export const BORNAS_LENGTHS = [60, 120, 180, 300, 480, 600] as const;
export const BORNAS_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10] as const;
export const BORNAS_LIMITS = {
  HERO_SAME: 0.6,
  HERO_STOP: ["the", "and", "von", "van", "der", "del", "tuoi", "age", "ages", "years", "nam"],
  POLL_MS: 2500,
  LOGS: 1500,
  SHEETS: 4,
  SHEET_COLS: 5,
  SHEET_ROWS: 4,
  SHEET_TILE: 384,
  SCENE_CUT: 0.12,
  WORDS_PER_SECOND: 2.6,
  CAST_MAX: 4,
  POSES_MAX: 6,
  NEW_ITEMS_MAX: 12,
  NEW_BG_MAX: 4,
  SHEET_ITEMS: 12,
  SHOT_LINES: 12,
  PAUSE: 0.3,
  BREAK_PAUSE: 0.7,
  LUFS: -16,
  PX_PER_M: 240,
  GROUND: 960,
  DRAW_RETRIES: 1,
  DRAW_DOWN: 4,
  AI_IMAGES: 8,
  SERIES_MAX: 30,
  NAME_MAX: 40,
  CATALOG_PROMPT_MAX: 260,
} as const;
export const BORNAS_RENDER = { FPS: 30, WIDTH: 1920, HEIGHT: 1080, HYPERFRAMES: "hyperframes@0.9.87", PREVIEW_HEIGHT: 720, PREVIEW_CRF: 24, SHEET_TILES: "8x6", RUNTIME: ["gsap.min.js", "DrawSVGPlugin.min.js", "MorphSVGPlugin.min.js", "MotionPathPlugin.min.js", "SplitText.min.js", "CustomEase.min.js", "CustomWiggle.min.js", "noise.min.js", "kit.js", "grain.png", "fonts"] } as const;
export const BORNAS_PY = { PACKAGES: ["pillow", "numpy", "scipy", "rembg", "onnxruntime"], READY: "ready.json", VERSION: 1 } as const;
export const BORNAS_SAME_PERSON = " This is the same person as in the attached reference image: keep the same face shape, nose, eyes, eyebrows, hair colour and skin tone; only the age, clothes and pose change as described.";
export const BORNAS_REVIEW_CONTEXT = "These are original drawings for a family-friendly educational cartoon about history: no real people, no photos, any fight shown only as cartoon falls. Your job is only a layout check of positions, sizes, text and picture edges; describe problems in neutral words.";
export const BORNAS_STYLE_LINE = "Bold cartoon illustration, thick black outlines, flat cel shading, warm muted colours, consistent with a history explainer cartoon";
const AI_DEFAULT: ReupAiChoice = { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiPro, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: true, allowFallback: true, multiRoom: true };
export const BORNAS_AI_DEFAULT: BornasAiSettings = { mainAi: AI_DEFAULT, visionAi: AI_DEFAULT, lightAi: { ...AI_DEFAULT, model: AiPlanningChatModel.GeminiFlash }, drawHeadless: true };
export const bornasNewChannel = (id: string, name: string): BornasChannel => ({ id, name, topic: "world", voiceChannel: "", language: "vi", count: 3, seconds: 120, review: false });
