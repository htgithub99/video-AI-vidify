import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { encodeClaudeChatModel } from "../../../constants/claudeChatModels.js";
import type { ReupAiChoice } from "../../reup/types/reup.js";
import type { BornasAiField, BornasAiSettings, BornasDrawProvider, BornasChannel, BornasLine, BornasGenre, BornasLanguage, BornasMusicChoice, BornasStepId, BornasTopic } from "../types/bornas.js";
export const BORNAS_STEPS: readonly BornasStepId[] = ["sample", "script", "voice", "assets", "shots", "build", "package", "render"];
export const BORNAS_VIDEO_STEPS: readonly BornasStepId[] = ["voice", "assets", "shots", "build", "package", "render"];
export const BORNAS_API = { SOURCE: "/source", START: "/start", APPROVE: "/approve", RERUN: "/rerun", CANCEL: "/cancel", STATUS: "/status/:jobId", STATE: "/state", JOBS: "/jobs", DELETE: "/delete", SAVE_VIDEO: "/save-video", ANNOTATE: "/annotate", DELETE_VIDEOS: "/delete-videos" } as const;
export const BORNAS_URL = {
  SOURCE: "/api/bornas/source",
  START: "/api/bornas/start",
  APPROVE: "/api/bornas/approve",
  RERUN: "/api/bornas/rerun",
  CANCEL: "/api/bornas/cancel",
  STATUS: (jobId: string): string => `/api/bornas/status/${encodeURIComponent(jobId)}`,
  JOBS: "/api/bornas/jobs",
  STATE: "/api/bornas/state",
  DELETE: "/api/bornas/delete",
  SAVE_VIDEO: "/api/bornas/save-video",
  DELETE_VIDEOS: "/api/bornas/delete-videos",
} as const;
export const BORNAS_STORAGE = { STATE: "bornas_state_v1" } as const;
export const BORNAS_STATE = { FILE: "bornas-state.json", CHANNELS_MAX: 40, DONE_MAX: 300, DONE_CHARS: 120, DONE_JOIN: ", ", DONE_SPLIT: /[,\n]/ } as const;
export const bornasHeroName = (hero: string): string => hero.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().slice(0, BORNAS_STATE.DONE_CHARS);
export const bornasDoneList = (raw: unknown): string[] => [...new Map((Array.isArray(raw) ? raw : []).map((x) => String(x ?? "").trim().slice(0, BORNAS_STATE.DONE_CHARS)).filter(Boolean).map((x) => [x.toLowerCase(), x] as const)).values()].slice(0, BORNAS_STATE.DONE_MAX);
export const BORNAS_DIR = { OUTPUT: "output", ROOT: "bornas", SAMPLES: "_samples", SHEETS: "sheets", JOB_FILE: "job.json", ASSETS_URL: "/assets/bornas/", PYENV: "pyenv", KIT: ["tools", "born-as-kit"], LIB: ["tools", "born-as-lib"], VIDEO: "video", ASSETS: "assets", RAW: "raw", RENDER: "render", SHORT: "short", VOICE: "voice", SHOTS: "shots", PREVIEW: "preview_720p.mp4" } as const;
export const BORNAS_TOPIC_LIBS: Record<BornasTopic, string[]> = { world: ["ancient", "medieval", "eastasia", "ww", "modern"], ww: ["ww"], ancient: ["ancient"], medieval: ["medieval"], eastasia: ["eastasia"], vietnam: ["vietnam"], modern: ["modern"], game: ["game"], wildwest: ["wildwest"], anime: [] };
export const BORNAS_SIZES: { re: RegExp; min: number; max: number; std: number }[] = [
  { re: /\b(?:mounted|galloping|riding|rider|horseman|cavalryman)\b/, min: 1.8, max: 2.8, std: 2.4 },
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
export const BORNAS_CTA: Record<string, { TITLE: string; SUB: string }> = { vi: { TITLE: "BÌNH LUẬN NGAY", SUB: "NHÂN VẬT TIẾP THEO LÀ AI?" }, en: { TITLE: "COMMENT BELOW", SUB: "WHO SHOULD BE NEXT?" }, ja: { TITLE: "コメントで教えて", SUB: "次は誰がいい？" }, ko: { TITLE: "댓글을 남겨주세요", SUB: "다음 인물은 누구?" } };
export const BORNAS_SHORT = { CUT: 46.5, CUT_PAD: 0.25, BEAT_GAP: 0.3, END_HOLD: 3.6, END_LEAD: 0.2, FADE: 0.25, TALK: "talk", SERIES_SPLIT: /[·|:]/, HERO_SPLIT: /[|(/,]/, BG_FILE: /^bg_.*\.(png|jpg)$/ } as const;
export const BORNAS_SHORT_TEXT: Record<string, { LINE: string; CTA: string; END: string; END_SUB: string }> = {
  vi: { LINE: "NẾU BẠN SINH RA LÀ", CTA: "XEM ĐẦY ĐỦ TRÊN KÊNH", END: "XEM TRỌN CÂU CHUYỆN", END_SUB: "Video đầy đủ trên kênh" },
  en: { LINE: "WHAT IF YOU WERE BORN AS", CTA: "FULL STORY ON THE CHANNEL", END: "WATCH THE FULL STORY", END_SUB: "Full video on the channel" },
  ja: { LINE: "もしあなたが生まれたら", CTA: "フルストーリーはチャンネルで", END: "続きは本編で", END_SUB: "チャンネルで公開中" },
  ko: { LINE: "만약 당신이 태어난다면", CTA: "전체 이야기는 채널에서", END: "전체 이야기 보기", END_SUB: "채널에서 전체 영상" },
};
export const BORNAS_SCALE = { EYE_M: 1.6, PERSON_M: 1.75, REFS: { door: 2.05, table: 0.78, counter: 1.05, chair: 0.9, barrel: 0.9, fence: 1.2, wagon_wheel: 1.3, stove: 1.0, bed: 0.55 } as Record<string, number>, MIN_PX: 25, AGREE: 120, HORIZON_MIN: -2000, GROUND_GAP: 60, LINE_CONF: 0.45, LINE_MIN: 12 } as const;
export const BORNAS_SCALE_CHECK = { MIN: 0.5, MAX: 2, TOL: 0.12, KEEP: 2 } as const;
export const BORNAS_SEO = { OPTIONS: 2, TITLE_MAX: 70, WORD_MAX: 14, NAME_MAX: 16, DIR: "seo", FILE: "seo.txt", BABY: "thumb_baby" } as const;
export const BORNAS_THUMB_TEXT: Record<string, { AGE: string; BORN: string }> = { vi: { AGE: "0 TUỔI", BORN: "BẠN SINH RA LÀ" }, en: { AGE: "AGE 0", BORN: "YOU WERE BORN AS" }, ja: { AGE: "0歳", BORN: "あなたの正体は" }, ko: { AGE: "0세", BORN: "당신은 태어났다" } };
export const BORNAS_CHAPTER = { MIN_SECONDS: 180, CARD_SECONDS: 1.8, LEAD: 0.15, TITLE_MAX: 40, MAX: 8 } as const;
export const bornasChapterLines = (lines: BornasLine[], seconds: number): number[] => (seconds >= BORNAS_CHAPTER.MIN_SECONDS ? lines.flatMap((l, i) => (i && l.chapter ? [i] : [])).slice(0, BORNAS_CHAPTER.MAX) : []);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export const BORNAS_CHAPTER_LABEL: Record<string, (n: number) => string> = { vi: (n) => `CHƯƠNG ${ROMAN[n - 1] || n}`, en: (n) => `CHAPTER ${ROMAN[n - 1] || n}`, ja: (n) => `第${n}章`, ko: (n) => `제${n}장` };
export const BORNAS_ROTATION = { ORDER: ["wide", "L", "two", "prop", "R", "wide", "talk"], RECENT: 8, VIEW: { L: "r", R: "l", talk: "talk" }, PROP_KINDS: ["prop", "weapon"] } as const;
export const BORNAS_BUSTS = { VIEWS: ["r", "talk", "l"], FACING: { r: "r", talk: "r", l: "l" }, SUFFIX: "_b_", SKIP: /baby|bust/, MIN_TALL: 0.7, TRIES: 2 } as const;
export const BORNAS_SIZE_RANGE: Record<string, [number, number]> = { person: [0.5, 2.3], bust: [0.5, 2.3], animal: [0.08, 4.5], vehicle: [0.8, 7], prop: [0.02, 3], weapon: [0.1, 2.6], structure: [0.8, 60], building: [2, 80], nature: [0.1, 45] };
export const BORNAS_ANN = { VERSION: 2, BG_VERSION: 6, BUST_FACE: 0.33, LIE_ASPECT: 1.25, SEATS: ["bed", "bench", "sofa", "chair"], TMP_PREFIX: "bornas_ann_", CAST_FILE: "ann.json", GROUND_MIN: 420, GROUND_MAX: 1075, PERSON_MIN: 80, PERSON_MAX: 820, PERSON_DEFAULT: 420, LIB_BATCH: 240 } as const;
export const BORNAS_REVIEW = { TEXT_DELAY: 0.7, SNAP_BATCH: 40, FIXES: ["wide", "tag", "drop_text", "apart"], TARGET_FIXES: ["drop", "flip"] } as const;
export const BORNAS_TOPICS = Object.keys(BORNAS_TOPIC_LIBS) as BornasTopic[];
export const BORNAS_LENGTHS = [60, 120, 180, 300, 480, 600] as const;
export const BORNAS_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10] as const;
export const BORNAS_LIMITS = {
  END_HOLD: 2.5,
  POOL_KINDS: ["person", "animal"] as string[],
  POOL_PER_ITEM: 3,
  POOL_MAX: 16,
  FRAGMENT_SECONDS: 1.4,
  LINE_SECONDS: 0.8,
  LINE_TARGET_SECONDS: 2.6,
  LINE_SPEECH_SECONDS: 2.3,
  LENGTH_SLACK: 1.08,
  MIN_WORDS: 60,
  SAMPLE_RATE: 2.7,
  STYLE_CHECK_LANGS: ["vi", "en"] as BornasLanguage[],
  HERO_SAME: 0.6,
  HERO_STOP: ["the", "and", "von", "van", "der", "del", "tuoi", "age", "ages", "years", "nam"],
  POLL_MS: 2500,
  LOGS: 1500,
  AVOID_MAX: 120,
  STATE_SAVE_MS: 600,
  SHEETS: 4,
  SHEET_COLS: 5,
  SHEET_ROWS: 4,
  SHEET_TILE: 384,
  SCENE_CUT: 0.12,
  CAST_MAX: 4,
  POSES_MAX: 6,
  CAST_ROW: 3,
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
export const BORNAS_RENDER = {
  FPS: 30,
  WIDTH: 1920,
  HEIGHT: 1080,
  HYPERFRAMES: "hyperframes@0.9.87",
  ENCODE: ["--crf", "20", "--max-bitrate", "12M", "--keyframe-interval", "2"],
  TMP_DIR: "_hf_tmp",
  ONE_WORKER: ["--workers", "1"],
  DISK_FULL: /temporary frame storage|ENOSPC/i,
  PREVIEW_HEIGHT: 720,
  PREVIEW_CRF: 24,
  SHEET_TILES: "8x6",
  RUNTIME: ["gsap.min.js", "DrawSVGPlugin.min.js", "MorphSVGPlugin.min.js", "MotionPathPlugin.min.js", "SplitText.min.js", "CustomEase.min.js", "CustomWiggle.min.js", "noise.min.js", "kit.js", "grain.png", "fonts"],
} as const;
export const BORNAS_PY = { PACKAGES: ["pillow", "numpy", "scipy", "rembg", "onnxruntime", "opencv-python-headless"], READY: "ready.json", VERSION: 2 } as const;
export const BORNAS_SAME_PERSON = " This is the same person as in the attached reference image: keep the same face shape, nose, eyes, eyebrows, hair colour and skin tone; only the age, clothes and pose change as described.";
export const BORNAS_REVIEW_CONTEXT = "These are original drawings for a family-friendly educational cartoon about history: no real people, no photos, any fight shown only as cartoon falls. Your job is only a layout check of positions, sizes, text and picture edges; describe problems in neutral words.";
const BORNAS_STYLE_LINES = { cartoon: "Bold cartoon illustration, thick black outlines, flat cel shading, warm muted colours, consistent with a history explainer cartoon", anime: "Anime illustration in the style of a hand-drawn 1990s Japanese TV anime, clean bold black outlines, flat cel shading, soft muted colours, expressive but realistic adult proportions" };
const AI_DEFAULT: ReupAiChoice = { provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiFlash, mode: AiPlanningExecutionMode.RoomOnly, chromeHeadless: true, allowFallback: true, multiRoom: true };
const CLAUDE: ReupAiChoice = { ...AI_DEFAULT, provider: AiPlanningFallbackProvider.ClaudeChat, model: encodeClaudeChatModel(AiPlanningChatModel.ClaudeSonnet55, "medium") };
const CHATGPT: ReupAiChoice = { ...AI_DEFAULT, provider: AiPlanningFallbackProvider.ChatGptUi, model: AiPlanningChatModel.ChatGptAuto };
export const BORNAS_AI_DEFAULT: BornasAiSettings = { writeAi: CLAUDE, directAi: AI_DEFAULT, factAi: CHATGPT, visionAi: AI_DEFAULT, drawAi: { provider: "gemini-chat", chromeHeadless: true, allowFallback: false } };
export const BORNAS_AI_FIELDS: BornasAiField[] = ["writeAi", "directAi", "factAi", "visionAi"];
export const BORNAS_VISION_PROVIDERS: AiPlanningFallbackProvider[] = [AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.ChatGptUi, AiPlanningFallbackProvider.ClaudeChat];
export const BORNAS_DRAW_PROVIDERS: BornasDrawProvider[] = ["gemini-chat", "labs-flow"];
export const BORNAS_LIBRARY_DRAW: BornasDrawProvider = "gemini-chat";
type LegacyAi = Partial<BornasAiSettings> & { mainAi?: BornasAiSettings["writeAi"]; drawHeadless?: boolean };
export const bornasAiSettings = (raw: LegacyAi | undefined): BornasAiSettings => {
  const main = raw?.mainAi;
  const pick = (field: BornasAiField, legacy?: BornasAiSettings["writeAi"]) => ({ ...BORNAS_AI_DEFAULT[field], ...legacy, ...raw?.[field] });
  const vision = pick("visionAi");
  return {
    writeAi: pick("writeAi", main),
    factAi: pick("factAi", main),
    directAi: pick("directAi"),
    visionAi: BORNAS_VISION_PROVIDERS.includes(vision.provider as AiPlanningFallbackProvider) ? vision : { ...vision, provider: AiPlanningFallbackProvider.GeminiChat },
    drawAi: { ...BORNAS_AI_DEFAULT.drawAi, ...(raw?.drawHeadless === undefined ? {} : { chromeHeadless: raw.drawHeadless }), ...raw?.drawAi, provider: BORNAS_DRAW_PROVIDERS.includes(raw?.drawAi?.provider as BornasDrawProvider) ? (raw!.drawAi!.provider as BornasDrawProvider) : "gemini-chat" },
  };
};
export const bornasNewChannel = (id: string, name: string): BornasChannel => ({ id, name, topic: "world", voiceChannel: "", language: "vi", genre: "bornas", music: "library", count: 3, seconds: 120, review: false, short: true, done: [] });
export const BORNAS_GENRES: BornasGenre[] = ["bornas", "survive", "worst", "day", "whatif"];
export const BORNAS_MUSIC_CHOICES: BornasMusicChoice[] = ["off", "library"];
export const bornasStyleLine = (topic: BornasTopic): string => (topic === "anime" ? BORNAS_STYLE_LINES.anime : BORNAS_STYLE_LINES.cartoon);
export const bornasMusicChoice = (raw: unknown): BornasMusicChoice => (BORNAS_MUSIC_CHOICES.includes(raw as BornasMusicChoice) ? (raw as BornasMusicChoice) : "off");
export const BORNAS_MUSIC = { DIR: "bornas-music", FALLBACK_TOPIC: "world", BED_FILE: "music_bed.wav", MIX_FILE: "voice_mix.wav", MUSIC_DB: -17, DUCK: "threshold=0.03:ratio=6:attack=80:release=600", LOUDNORM: "loudnorm=I=-16:TP=-1.5", RATE: 48000 } as const;
export const bornasGenre = (raw: unknown): BornasGenre => (BORNAS_GENRES.includes(raw as BornasGenre) ? (raw as BornasGenre) : "bornas");
export const BORNAS_TOKEN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[^\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu;
export const BORNAS_WORD = /[\p{L}\p{N}]/u;
export const bornasTokens = (text: string): string[] => (text.match(BORNAS_TOKEN) || []).filter((t) => BORNAS_WORD.test(t));
export const BORNAS_OBJECT_KINDS = new Set(["vehicle", "structure", "building", "prop", "nature", "weapon", "ship", "aircraft"]);
