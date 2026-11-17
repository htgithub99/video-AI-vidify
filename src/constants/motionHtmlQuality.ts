import { MOTION_FIGURE_VOCAB as V } from "./motionFigureVocabulary.js";
// The plan's list of what a scene draws, in the figure vocabulary's words: the drawing request copies it, and both
// renderers draw exactly these (motionFigureVocabulary).
const FIGURES_LINE = `8. FIGURES: one line \`FIGURES: id: fn, options; id: fn, options\` listing every person, animal, vehicle, building, tree and prop the picture draws (the REQUIRED ids first, a crowd as one entry with its count), each written only in these words so both renderers draw the same thing. person: outfit ${V.OUTFITS.join("|")}; colours of top, pants, cape or robe as #hex; head ${V.HEADS.filter((h) => h !== "none").join("|")}; hold ${V.HOLDS.join("|")}; pose per phase (a -> b) from ${V.POSES.join("|")}; expression per phase from ${V.EXPRESSIONS.join("|")}; barefoot, wounded, bandage head|arm|hand, tied, wet, dirty only when the narration says so. animal: kind and pose stand|walk|run|graze|lie. Any other thing: its plain noun (wagon, raft, tent, log, campfire) and what it is built of. A held thing outside the hold words is its own prop entry held in the hand. Nothing else describes a figure. Example: \`FIGURES: you: person, outfit soldier, top #6e5038, hold crossbow, pose sit -> sit, expression worried -> surprised; drover: person, outfit peasant, wounded, pose walk -> point, expression sad; log: prop log; tents: building tent, canvas\``;
export const MOTION_HTML_QUALITY = {
  KEY_PROGRESS: 0.5,
  // Seconds of the cut-out style's dip to black at a jump in time.
  DIP_SECONDS: 0.45,
  // When a still frame's place and time title is caught: fully shown.
  TITLE_STILL_SECONDS: 1.2,
  START_PROGRESS: 0.1,
  END_PROGRESS: 0.9,
  TAIL_FROM: 0.93,
  TAIL_TO: 1,
  TAIL_MIN_CHANGED: 0.002,
  TAIL_ISSUE: "đoạn cuối cảnh đứng hình (không còn chuyển động sau khi hành động chính kết thúc)",
  MAP_NO_ARROW: "bản đồ không có mũi tên chỉ hướng di chuyển",
  MAP_NO_LABEL: "bản đồ không ghi tên địa danh",
  PHASE_SPLIT: /\s*->\s*/,
  PHASE_MAX: 5,
  PHASE_MIN_CHANGED: 0.004,
  PHASE_ISSUE: (phases: number[]) => `pha ${phases.join(", ")} của cảnh không tạo thay đổi nhìn thấy so với pha trước`,
  MAP_ARROW: /FIG\.arrow\s*\(/,
  MAP_LABEL: /FIG\.label\s*\(|\.fillText\s*\(/,
  CHANGE_SIZE: [96, 54] as readonly [number, number],
  CHANGE_THRESHOLD: 24,
  MIN_CHANGED: 0.012,
  MARK_MOVE: 0.02,
  MARK_GROW: 0.06,
  FOCAL_MIN: 0.12,
  FOCAL_MIN_WIDE: 0.08,
  WIDE_SHOTS: ["wide", "overhead", "establishing", "map"] as readonly string[],
  VISIBLE_MIN: 0.5,
  QUALITY_RETRIES: 1,
  FLAT_MIN_CHARS: 2000,
  SNIPPET_RADIUS: 90,
  SNIPPET_MAX: 2,
  SIGNATURE_DROP: [/page\.evaluate:\s*/gi, /\b(?:Uncaught\s+)?Error:\s*/g, /\s+at\s+<anonymous>[^\n]*/g, /\d+/g, /\s+/g] as readonly RegExp[],
  UNDEFINED_NAME: /([A-Za-z_$][\w$]*) is not defined/,
  REQUIRED_LINE: /^[ \t]*(?:\d+\.\s*)?REQUIRED\s*:\s*(.+)$/im,
  REQUIRED_ITEM: /^\s*([^:(]{1,40}?)\s*(?:\((focal|support)\))?\s*(?::|—|$)\s*(.*)$/i,
  REQUIRED_SEP: /\s*;\s*/,
  FOCAL: "focal",
  STACK_LINE: /:(\d+)\s*$/m,
  TEMPLATE: [
    "5. REQUIRED: one line `REQUIRED: id (focal): what it is; id (support): what it is` listing the 1-5 elements a viewer must see for this line to read: every person, animal or object that performs or receives the narrated action, the actor first and marked focal; ids are short lowercase words (king, banner, cattle, bridge). Focal elements stand in the foreground or midground at readable size (a focal person at least about an eighth of the frame height, larger in medium shots); 'small', 'distant' or 'in the background' describes only setting extras and crowd masses, never a focal element. A map lists the moving force (focal), the place it starts from and the place it is heading to (take the destination from the story even when these lines do not name it), the opposing force or the site of the fight when the story has one, and the rivers, mountains or borders that matter (support).",
    "6. MOTION: one line `MOTION: <focal subject> <start state> -> <end state>` naming the visible change across the scene (travel, gesture, turn, fall) plus the ambient motion; the key moment of the narrated action happens around the middle of the scene. When the covered lines tell several actions in a row, list them in spoken order as phases (`<subject> a -> b -> c`) so the picture shows each one while its line is spoken, instead of only the first. Say when an action repeats (marches, rows, fights, works) so it keeps going until the scene ends; never plan a scene whose only action is over in its first half.",
    "7. INTERACT: one line `INTERACT: id -> id; id -> id` naming only physical contact or a face-to-face exchange between REQUIRED ids at the same spot (grabs, hands over, strikes, pulls, speaks to; looking at, watching or reacting to something distant is not listed) (the refugee grabs the protagonist: `refugee -> protagonist`; the sergeant hands over the chains: `sergeant -> protagonist`), or `INTERACT: none`. REQUIRED ids say what the element is: a named cast member by its CAST key (the same id in every scene), another person by role, a group by a plural noun (soldiers, riders, villagers), a thing by its noun (wagon, bridge, tent, shield). Focal elements are people, groups, large vehicles or buildings; a small hand-held object (cup, letter, shield, chain) is always support and belongs to the person who holds it. Section 1 and FIGURES state every must-see body detail of a person the narration gives (barefoot, wounded, bound hands, soaked). Section 2 names only set dressing that belongs to this place and moment; nothing is added as filler.",
    FIGURES_LINE,
    "Consecutive scenes never repeat the same shot size with the same subject placement: change the shot size, the camera angle or the side the focal subject stands on. A loose prop (rope, tool, basket, stone) stays at most about half a standing person's height unless the narration makes it the subject. A map labels every place the narration names and draws an arrow for each movement; every arrow starts at a named place and ends at a named place, and the site of a battle or siege carries a battle mark, so a viewer who only sees the map knows who goes from where to where and where the fight is. In a scene with a river, lake or sea, say for every subject whether it is on the near bank, the far bank, a bridge, a boat or in the water.",
  ].join("\n"),
  // Scene rules for every scene (written against the figure table; the kit is never on the page while it is written).
  // The last lines of the drawing prompt: the AI checks its own page before answering.
  CHECKLIST: [
    "CHECK BEFORE ANSWERING (fix the code until every line holds):",
    "1. The MESSAGE reads at a glance: the acting subjects are whole, in the open, not covered by anything nearer, and the key object is visible in a hand or in the open.",
    "2. Exactly the SCENE's FIGURES line is drawn, each item through its FIG function with only the OPTIONS words; nothing else is added.",
    "3. Each of your FIG functions draws only what its o says, inside the box o gives (x, y on the ground, h tall, w wide), and returns it; no function draws another figure inside itself.",
    "4. Every REQUIRED id is marked on the call that draws it.",
    "5. Only the DEVICES listed are drawn, with no words in them; no camera transform, no arrow outside a map.",
    "6. Every variable is declared before use, no division can be by zero, no value can be NaN, every save() has its restore() and every clip() closes right after its detail.",
    "7. At progress 0, 0.5 and 1 the main subjects are inside the frame with a margin and nothing jumps between frames.",
  ].join("\n"),
  OUTPUT: [
    "FIGURES LINE: draw the SCENE's FIGURES line (when it has none: the REQUIRED line and the people and things sections 1-3 name) item by item with exactly its options (barefoot, wounded, bandage, the pose and expression of each phase, hold); add nothing it does not list. A bridge crosses water with both ends on land: from the near bank (from) to the far bank (to), never on dry ground or cut by the frame edge.",
    "REQUIRED MARKS: for each id in the SCENE's REQUIRED line pass mark: 'id' to the FIG call that draws it (one figure of a group carries the group's id); only for a shape you draw yourself call window.motionMark && window.motionMark(ctx, 'id', x, y, w, h) with its bounding box inside the same transforms; never mark what you did not draw.",
    "MOTION (you write it, first frame to last, the same in both renderers). KEEP IT SIMPLE: each acting subject has at most three phases and 3-6 keyframes, each pose held about 1.5 s or more. 1. One keyframe list per acting person, animal, group or vehicle in the spoken order of the SCENE's MOTION line: const ph = MotionFigures.phase(input.progress, 3, input.cues); const heroKeys = [{at: 0, x: 300, y: 610, pose: 'stand', facing: 1}, {at: ph.at[1], x: 520, y: 610, pose: 'walk'}, {at: ph.at[2], x: 520, y: 610, pose: 'point'}, {at: 1, x: 520, y: 610, pose: 'stand'}] (ph.at[i] = when phase i's line starts). 2. Every frame: const hero = MotionFigures.track(heroKeys, input.progress) (hero.moving, hero.distance); FIG.person(ctx, {...look, x: hero.x, y: hero.y, h, w, pose: hero.moving ? 'walk' : hero.pose, distance: hero.distance, facing: hero.facing}). Walk, run or ride only while the keyframes move the subject; poses change where the subject has stopped. Every position and size comes from a track or one clamped smoothstep: nothing jumps, restarts or slides. 3. No camera: the video's layout frames the scene. 4. Living motion (breathing, flags, flame, smoke, water) is a smooth sin/cos of input.time; background people only bob and turn their heads; the main action is still completing in the final tenth. 5. No % wrap, no move played twice, no fading of people, animals or vehicles.",
    "Smoke, fire and loose foreground objects never cover a face or the acting subject. Loose ground props stay under half a standing person's height unless the SCENE makes them the subject. Declare every variable before use and end every statement with a semicolon.",
  ].join("\n"),
  BLANK: {
    BYTES_PER_PIXEL: 0.008,
    RETRIES: 2,
    LOG: (id: string, frame: number, attempt: number) => `Xuất video: khung ${frame} của cảnh ${id} ra một màu trơn (trang mất canvas) – mở lại trang và vẽ lại khung này (lần ${attempt}).`,
    KEPT_LOG: (id: string) => `Xuất video: cảnh ${id} vẫn ra khung một màu sau khi mở lại trang – giữ nguyên và ghi cảnh báo.`,
  },
  MAP_TEXT: "this map names every place the SCENE mentions in clear inked text in the video language, at least 22px tall on the 1280x720 design (FIG.label), beside its marker, names never overlapping or leaving the frame, and draws an arrow for each movement",
  MAP_RULES: [
    "MAP SCENE (this scene is a map, not a staged scene: the figure, ground-line, scale and cast rules above do not apply, and no person, animal, vehicle or building is drawn at scene size).",
    "1. Surface: the map surface is your own drawing over the full 1280x720 in the chosen drawing style (parchment or flat land and sea, coastlines, rivers, hills and forests as inked shapes), with no border line, running past every frame edge. Never leave the surface as an empty sheet.",
    "2. Places: every place the SCENE names gets a marker (FIG.icon kind pin, house, flag or crown, or a dot or ring) and its name with FIG.label, at most 6 names, spread so no two overlap.",
    "3. Movement: each march, retreat, voyage or attack is one FIG.arrow whose grow follows the progress of its phase (MotionFigures.phase), so the route draws itself while the narrator tells it; each force is a FIG.icon (infantry, cavalry, armor, fleet, or a flag) with a short FIG.label, travelling along its arrow. Every arrow starts at a labelled place and its head lands on a labelled destination marker, never in empty space: when the SCENE names no destination, end the arrow at the place the REQUIRED line gives as the destination, or label the arrow's end with where it leads. The site of a battle, ambush or siege is marked with FIG.icon kind 'swords' and its name; an opposing force has its own icon, colour and label, placed where it waits or comes from.",
    "4. Focus and life: the place being spoken about pulses (a ring driven by input.time) and small motion (pulsing markers, drifting waves or clouds) continues until the last frame.",
  ].join("\n"),
  VARIETY: (shot: string, setting: string) =>
    `VARIETY: the previous scene is also a ${shot} shot of ${setting}; frame this one differently (another framing or height, the focal subject on the other side, different depth layering) while keeping the SCENE's shot size.`,
  RUNTIME_FEEDBACK: (reason: string, snippets: string[]) =>
    `PREVIOUS ANSWER FAILED WHEN RUN: ${reason}.${snippets.length ? ` Code near the failure: ${snippets.map((s) => JSON.stringify(s)).join(" … ")}.` : ""} Fix that cause (declare every variable before use, end every statement with a semicolon) and answer again with the complete HTML.`,
  // An option outside the figure vocabulary (motionFigureVocabulary) is left out of the call for both renderers; the
  // figure table reports each one as !fault:drop:fn.key and the scene keeps them as one warning.
  DROP_PREFIX: "!fault:drop:",
  DROP_ISSUE: (keys: string[]) => `Tuỳ chọn ngoài bộ từ bị bỏ (cả hai cách dựng đều không vẽ): ${keys.join(", ")}`,
  OWN_EXTRA_ISSUE: (items: string[]) => `Hàm vẽ của AI vẽ thêm ngoài tuỳ chọn (chỉ hiện ở Dựng cảnh AI, Bộ vẽ chuẩn không có): ${items.join(", ")}`,
  MISSING_ITEM: (id: string, why: "unmarked" | "outside" | "small", size?: number, min = 0.12) =>
    why === "unmarked" ? `${id} (not drawn or not marked)` : why === "outside" ? `${id} (mostly outside the frame)` : `${id} (${((size || 0) * 100).toFixed(0)}% of the frame, needs ${Math.round(min * 100)}%)`,
  MAX_TOP_CUT: 0.25,
  CUT_ISSUE: (items: string[]) => `vật lớn bị mép trên cắt: ${items.join(", ")}`,
  REVIEW_ARTIFACT: "motion-html-review",
  REVIEW_FILE: "review-",
  MOTION_LINE: /^[ \t]*(?:\d+\.\s*)?MOTION\s*:\s*(.+)$/im,
  EVENT_LINE: /Exact approved event:\s*([^\n]+)/i,
  // The picture check asks what the frame says before it is told: a viewer who sees it for two seconds must get the
  // scene's message.
  REVIEW_PROMPT: (c: { narration: string; message: string; keyVisual: string; required: string; motion: string; event: string }) =>
    [
      "You check one frame (the middle of the scene) of an illustrated story video. A viewer sees it for two seconds while the narrator speaks; the picture must make the scene's message clear. Judge only content, never drawing style, colours or small details.",
      "First write in \"shows\" one short sentence of what the frame shows, as a viewer would say it. Then compare it with what the scene must say:",
      c.message ? `MESSAGE: ${c.message}` : "",
      c.keyVisual ? `KEY VISUAL: ${c.keyVisual}` : "",
      `NARRATION: ${c.narration}`,
      c.event ? `EVENT TO SHOW: ${c.event}` : "",
      c.required ? `MUST BE VISIBLE: ${c.required}` : "",
      c.motion ? `ACTION: ${c.motion}` : "",
      "Answer with JSON only: {\"shows\": \"...\", \"ok\": true} when a viewer gets the message, or {\"shows\": \"...\", \"ok\": false, \"problems\": [\"...\"]} with at most 5 short, concrete problems: the key subject, action or object missing, too small or unrecognisable, the eye drawn to something else, people or things in impossible places (fire or people standing on open water, things floating in the sky, a bridge that does not cross the water, a building cut in half), the wrong side of a river, or a frame that contradicts the narration (night for day, a crowd for one man, the wrong era).",
    ].filter(Boolean).join("\n"),
  REVIEW_FEEDBACK: (problems: string[]) =>
    `PREVIOUS ANSWER REJECTED BY THE PICTURE CHECK: ${problems.join("; ")}. Redraw the scene so the middle frame makes the MESSAGE clear at a glance and answer again with the complete HTML.`,
  REVIEW_LOG: (id: string, problems: string[]) => `Cảnh HTML ${id}: AI duyệt ảnh thấy chưa đúng nội dung (${problems.join("; ")}) – tạo lại 1 lần kèm yêu cầu sửa.`,
  REVIEW_SKIP_LOG: (id: string, reason: string) => `Cảnh HTML ${id}: bỏ qua bước AI duyệt ảnh (${reason}).`,
  FLAT_ISSUE: "Câu trả lời của AI bị mất xuống dòng nên code dính thành một dòng và lỗi cú pháp",
  REPEAT_LOG: (id: string, from: string, to: string) => `Cảnh HTML ${id}: ${from} lặp lại cùng một lỗi – chuyển cảnh này sang ${to}.`,
  STATIC_ISSUE: (changed: number) => `cảnh gần như đứng yên (thay đổi ${(changed * 100).toFixed(1)}%)`,
  MISSING_ISSUE: (items: string[]) => `thiếu hoặc quá nhỏ: ${items.join(", ")}`,
  WARN_LOG: (id: string, issues: string[]) => `Cảnh HTML ${id}: vẫn chưa đạt sau khi tạo lại (${issues.join("; ")}) – nhận cảnh và gắn cảnh báo.`,
} as const;
