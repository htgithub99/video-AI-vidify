import { stringifyJson } from "../lib/jsonStringify.js";
import { MOTION_CLIP as M } from "./motionClip.js";
import type { MotionResponseSchema } from "./motionResponseContract.js";
const text: MotionResponseSchema = { type: "string", minLength: 1 };
const fraction: MotionResponseSchema = { type: "number", minimum: 0, maximum: 1 };
const point: MotionResponseSchema = { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] };
const choice = (values: readonly string[]): MotionResponseSchema => ({ type: "string", enum: values });
const clip: MotionResponseSchema = {
  type: "object",
  properties: {
    id: text,
    op: choice(M.OPS),
    target: text,
    group: { type: "array", items: text, minItems: 1 },
    amount: choice(M.LEVELS),
    speed: choice(M.SPEEDS),
    cycle: { type: "number", minimum: 0.1, maximum: M.MAX_CYCLE },
    phase: { anyOf: [{ type: "number" }, { type: "array", items: { type: "number" } }] },
    couple: text,
    lag: { type: "number", minimum: 0, maximum: 2 },
    lean: choice(["forward", "back"]),
    bounce: { type: "boolean" },
    dir: choice(M.DIRS),
    depth: { type: "number", minimum: 0, maximum: 2 },
    parent: text,
    at: text,
    particle: choice(M.PARTICLES),
    density: choice(M.LEVELS),
    mode: choice(["scroll_background", "path"]),
    from: point,
    to: point,
    start: fraction,
    end: fraction,
    facing: choice(["left", "right"]),
    joint: choice(M.SIDES),
  },
  required: ["op"],
};
const OPS_TEXT =
  'OPS (combine freely to build any motion; there are no built-in actions): swing = rotate back and forth around a joint (limbs, tails, flags, branches, oars; joint top for hanging limbs, bottom for upright heads/stems); bob = up-down oscillation (bounce:true for gaits, lean forward/back for running or braking); spin = continuous rotation (wheels, propellers, mill wheels); travel = movement through the frame (mode "path" with from/to foot points as canvas fractions, may start/end off-screen; or mode "scroll_background" to keep the subject centred while scroll layers move); scroll = a wide seamless background layer drifting (depth 0..2: far hills ~0.1, near ground 1); flow = streaks moving inside a region (rivers, waterfalls, lava, crowds on a map); emit = particles from "<partId>:<top|bottom|left|right|center>" (dust, splash, spark, leaf, smoke); pulse = gentle scale (lights, hearts, map markers); shake = small jitter (engines, impacts); reveal = draw a stroked path progressively (arrows, routes); follow = copy another target\'s motion with lag (riders, held props when not nested).';
const COMBINERS_TEXT =
  "COMBINERS: group + phase[] offsets cycles between parts (gaits: diagonal pairs share a phase); couple = id of a travel clip, so cycles, wheel roll and scroll speed follow travelled distance and nothing slides; lag delays secondary parts (mane, hair, cloak, tail); start/end are fractions 0..1 of the scene so motion can begin after a beat or stop in time with the narration; facing is the screen direction the subject looks.";
export const MOTION_CLIP_DIRECTOR = {
  ARTIFACT: "motion_remotion_motion",
  REVISION: 1,
  MAX_PARTS: 64,
  PART_HINTS: [
    [/(?:^|_)(?:wheels?(?:_\d+)?|rotor|propeller|mill_?wheel|water_?wheel|gear)(?:_\d+)?$/i, "center"],
    [/(?:^|_)(?:legs?|arms?|hands?|oars?|tail|mane|hair|cloak|cape|flag|banner|reins|wings?)(?:_(?:front|back|fore|hind))?(?:_(?:left|right|near|far))?(?:_\d+)?$/i, "top"],
    [/(?:^|_)(?:head|neck|torso|body|tree|stem|plant|mast)$/i, "bottom"],
  ] as readonly (readonly [RegExp, string])[],
  MIN_PART_SIZE: 1,
  BIBLE_CHARS: 240,
  BIBLE_ENTRIES: 40,
  KEY: (inputKey: string, sceneId: string) => `motion_${inputKey}_${sceneId}`,
  SALVAGE_MIN_SHARE: 0.5,
  SALVAGE_PASSES: 4,
  CLIP_INDEX: /^clip (\d+):/,
  LOG_DROPPED: (index: number, total: number, count: number, reasons: string[]) => `[Dựng cảnh] Cảnh ${index}/${total}: bỏ ${count} chuyển động AI không hợp lệ, giữ phần hợp lệ (${reasons.join("; ")}).`,
  CHARS_PER_SECOND: 15,
  SCHEMA: { type: "object", properties: { temperament: choice(M.TEMPERAMENTS), clips: { type: "array", items: clip, maxItems: M.MAX_CLIPS }, bible: { type: "array", items: { type: "object", properties: { subject: text, note: text }, required: ["subject", "note"] } } }, required: ["clips"] } as MotionResponseSchema,
  SKIP_PART: /(?:^|_)(?:shadow|outline|clip|mask|defs|gradient|label|text|scene_canvas)(?:_|$)/i,
  PROMPT: (context: unknown): string =>
    `TEXT CODING TASK: write animation data (JSON) for an existing 2D SVG illustration of a video scene. CONTEXT lists the narration and the named SVG groups (parts) already measured in the picture. Choose which parts move so a viewer instantly understands the narrated moment, as a list of motion clips. The renderer computes pivots, angles, speeds and particles from these semantic choices, so the JSON holds no SVG, coordinates or angles.\n${OPS_TEXT}\n${COMBINERS_TEXT}\n${RULES_TEXT}\nReturn one JSON object {temperament?, clips, bible?} in a json code block.\nCONTEXT: ${stringifyJson(context)}`,
  REPAIR: (context: unknown, draft: unknown, errors: string[]): string =>
    `TEXT CODING TASK: repair only the rejected motion clips in this animation JSON for an existing SVG illustration. Keep accepted clips unchanged, use only part ids from context.parts and only the supported op names and values.\n${OPS_TEXT}\nReturn the complete corrected JSON object {temperament?, clips, bible?} in a json code block.\nCONTEXT: ${stringifyJson(context)}\nDRAFT: ${stringifyJson(draft)}\nERRORS: ${stringifyJson(errors)}`,
  TEMPERAMENT: { horror: "tense", history: "lively", explainer: "lively" } as Record<string, (typeof M.TEMPERAMENTS)[number]>,
  LOG_DIRECT: (index: number, total: number) => `[Dựng cảnh] Cảnh ${index}/${total}: AI đạo diễn chuyển động.`,
  LOG_ACCEPTED: (index: number, total: number, clips: number) => `[Dựng cảnh] Cảnh ${index}/${total}: nhận ${clips} chuyển động từ AI; code ghép và kiểm tra khớp, nhịp, quãng đường.`,
  LOG_STATIC: (index: number, total: number) => `[Dựng cảnh] Cảnh ${index}/${total}: AI chọn giữ cảnh tĩnh (khoảnh khắc không có chuyển động).`,
  LOG_FAILED: (index: number, total: number, reason: string) => `[Dựng cảnh] Cảnh ${index}/${total}: chưa nhận được chuyển động hợp lệ từ AI (${reason}); giữ chuyển động vẽ kèm của cảnh.`,
  LOG_UNMEASURED: (index: number, total: number) => `[Dựng cảnh] Cảnh ${index}/${total}: chưa đo được bộ phận để đạo diễn chuyển động; giữ chuyển động vẽ kèm của cảnh.`,
  ERROR: (scene: string, errors: string[]) => `Chuyển động cảnh ${scene}: ${errors.join("; ")}`,
} as const;
const RULES_TEXT = `RULES: animate only what the narration and picture support; one clear main action per scene plus at most two supporting motions; static moments may return clips=[]. Targets must be part ids from context.parts; never move the whole background or a planted person to fake travel. Only parts marked scrollable:true may use scroll; when none is scrollable, show travel with a "path" travel clip (entering or crossing the frame) instead. emit.at always names a part id and a side, e.g. "horse_1_legs:bottom". Use each part's joint hint unless the picture clearly needs another side. Keep the same subject's motion consistent with context.bible across scenes (same gait, rhythm and amount) unless the story changes it. Respect context.temperament for the genre mood. Return at most ${M.MAX_CLIPS} clips, plus optional bible entries {subject, note} describing a recurring subject's motion in one short sentence for later scenes.`;
