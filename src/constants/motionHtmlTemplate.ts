import { MOTION_HTML_QUALITY } from "./motionHtmlQuality.js";
import { MOTION_STORY_CONFIG } from "./motionVideo.js";
export const MOTION_HTML = {
  VERSION: 1,
  ARTIFACT: "motion-html-scene",
  PLAN: "motion-html-plan",
  WORKERS: MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length,
  BASE_STYLE: "Clean hand-drawn 2D cartoon (OverSimplified-like cel style): even dark outlines, flat muted colours with at most one soft shade tone, no hatching, paper texture or grain; light, weather and time of day as the story says.",
  RETRY_MS: [2000, 5000, 10000, 20000, 30000],
  // A received answer that could not be stored or shown is tried again locally after this many ms × the try number.
  LOCAL_RETRY_MS: 250,
  THUMBNAIL_BROWSER_IDLE_MS: 90_000,
  SAVE_THROTTLE_MS: 1000,
  // How many scenes before a group's lines its plan sees.
  PREVIOUS_SCENES: 3,
  // Devices a scene may use (thought, emote, inset, count, spotlight, time, sound, speed, impact).
  DEVICES_MAX: 2,
  THUMBNAIL_STILL: { width: 960, quality: 0.82, mime: "image/jpeg", canvas: "canvas", context: "2d", smoothing: "high" },
  ABANDON_LOG: (id: string): string => `Cảnh HTML ${id}: tab dựng không trả kết quả sau khi tự phục hồi – bỏ lượt cũ, gửi lại ở tab dựng đang trống.`,
  DATE_PART: /\d+/g,
  LEGACY_PLAN_FIELD: "graphics",
  // Settings applied only when the scenes are shown (never part of a plan).
  VIEW_SETTINGS: ["profileId", "layout", "proportion", "movement"] as readonly string[],
  SWITCH_AFTER: 2,
  SWITCH_LOG: (id: string, from: string, to: string): string => `Cảnh HTML ${id}: ${from} lỗi 2 lần liền – chuyển cảnh này sang ${to}.`,
  TEMPLATE: [
    "Write each sceneTemplate in English as concise production prose (never spoken narration), with no SVG, coordinates, or code:",
    "0. SCENE THEME & TYPE: scene name/type, tone, the exact approved event. A map only shows routes, positions or movement across a region; an event that happens at one place (an attack, siege, sack or fall of a town, a battle moment, an arrival, a speech) is a story scene at that place with its people and buildings. A map scene is drawn only as a map (parchment, inked terrain, small settlement marks, routes and arrows) and never mixes in full-size buildings, trees, people or horses. The map fills the whole frame at every camera position: its surface runs past every frame edge, it has no border line, and pans and push-ins stay inside it; mountain ranges are rows of inked peaks along the range, never flat blobs; every river joins another river, a lake or the sea, or runs off the map edge, never stopping in open land.",
    "1. SUBJECTS & LOOK: only what reads at video size: named cast keep exactly their cast-library look (state only a visible change: a wound, a bandage, a lost helmet); for every other person or group the role, clothing colours, headgear, held item and expression; animals by kind and colour; vehicles, tools, props and structures by plain noun and what they are built of at that time and place (before the modern age a bridge is timber on piles or stone arches, never a smooth slab; no machine-made metal, glass or plastic where the period had none). Never fabric, stitching, dirt marks, scratches, strings, knots or other fine detail: nobody sees it. For groups give the on-screen scale that matches the stated numbers (a few near figures plus a distant mass for hundreds or thousands). Do not restate the shared drawing style.",
    "2. THREE-LAYER SETTING & CAMERA: state the weather and light plainly (rain, mist, sun, night); only environment elements the narration, place, time and scene type require (never invent clouds, hills, rivers, roads or treelines the place does not have; maps, diagrams and interiors use a map surface, board, tent or room); name concrete foreground, midground and far-layer details (ground texture, plants, structures, weather, light and time of day); outdoors, name at most two kinds of the place's own ground detail (grass, reeds, stones, mud or battle debris) and keep it sparse so the subjects read at a glance; never list loose small objects (pegs, coils, cups, scraps) as set dressing, keep tree lines only where the place has woods and vary the far layer between places with what the place really has (open horizon, fields, hills, woods, river banks; walls and roofs only where the narration or the place puts a settlement in view, never as filler); buildings keep cartoon proportions and shrink with distance (a house about two and a half people tall beside them, a church or castle about four and a half, a town on the far bank or horizon only a little taller than the far people), and every building and prop in any layer belongs to that era and region (no stilt houses outside South and Southeast Asia, no tiled modern houses, red barns or windmills where the period had none; a medieval European village is thatched cottages, longhouses, haystacks and fences, a steppe camp is yurts and tents); a major river is a broad band of water, never a thin line; then say where the main subjects stand and the shot size (the video's layout frames and moves the camera; never ask for pans or push-ins). Foreground props stay in scale and never cover the main subjects. No roads, paths or trails as scenery: travellers cross open ground and the place reads from its terrain, landmarks and buildings; name a street, bridge or railway only when the narration puts the action on it.",
    "3. CHARACTERS & ACTION MECHANICS: only actual participants required by the narration and documented at that place and moment (never put a leader where the sources place him elsewhere); at most 2-3 groups in a scene under 15 seconds; say where each stands (left/right, near/far); for each main character the pose, facing, whether mounted or on foot, entry side and travel direction (left to right, right to left, toward the camera or away from it), then one clear action in at most three phases (start -> action -> end), each long enough to read, with grips/releases and the expression change; at most three characters carry their own action, and background people keep only small living motion (breathing, a head turn). Describe maps/processes as visual demonstrations.",
    "4. OVERLAYS & INTERACTION: no subtitles, narration banners, tags, callouts, header text or sign text; the time header is decided when the scene is drawn, so only name the place and time in the setting.",
    MOTION_HTML_QUALITY.TEMPLATE,
    "Use relative progress or utterance anchors. Preserve source facts and uncertainty.",
  ].join("\n"),
} as const;
