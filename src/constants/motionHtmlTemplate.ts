import { MOTION_HTML_QUALITY } from "./motionHtmlQuality.js";
import { MOTION_STORY_CONFIG } from "./motionVideo.js";
export const MOTION_HTML = {
  VERSION: 1,
  ARTIFACT: "motion-html-scene",
  PLAN: "motion-html-plan",
  WORKERS: MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length,
  GRAPHICS: [
    "VISUAL STYLE (the base look every scene is drawn in; the chosen drawing style is applied over it when the video is shown):",
    "- Flat cartoon (OverSimplified-like): each shape is one closed Path2D of smooth quadraticCurveTo curves, filled with a flat muted colour, at most one darker shade inside it (save, clip(p), fill, restore), then stroke(p) in #26201c with round joins (about 0.08r on figures). No hatching, texture, grain, cracks, stitching or small decoration.",
    "- Simple shapes that read at a glance, each in the thing's real outline: a hut is walls, a roof and a door; a wagon a box on spoked wheels; a tree a trunk and one scalloped crown; a hill one ridgeline; a cloud one lumpy outline drifting slowly; smoke, dust, mist and steam soft radial-gradient puffs with no outline.",
    "- Light: a soft sky gradient with the sun or moon; far layers lighter and hazier; the weather and time of day the SCENE states.",
    "- Ground (outdoor): one band in the place's colour with a few tufts or stones near the front, clear around the acting subjects. Interiors: floor, walls and the furniture the SCENE names.",
    "- ONLY WHAT THE SCENE AND ITS FIGURES LINE LIST: no extra people, animals, vehicles, banners, weapons, flowers or props; CAST cards are reference only; object, map and diagram scenes add no people or landscape.",
  ].join("\n"),
  // The plan's style words: one base look for every scene, whatever drawing style is chosen (it is applied when shown).
  BASE_STYLE: "Clean hand-drawn 2D cartoon (OverSimplified-like cel style): even dark outlines, flat muted colours with at most one soft shade tone, no hatching, paper texture or grain; light, weather and time of day as the story says.",
  ERASE_PATTERN: /globalCompositeOperation\s*=\s*["'`](?:destination-out|destination-in|destination-atop|xor|copy|clear)["'`]/,
  ERASE_ISSUE: "Cảnh xóa điểm ảnh bằng chế độ hòa trộn (destination-out, xor…) nên để lại lỗ đen.",
  ERASE_REPAIRED: "Cảnh dùng chế độ hòa trộn xóa điểm ảnh (destination-out, xor…) – đã tự đổi sang vẽ thường để không có lỗ đen.",
  ERASE_SAFE: "globalCompositeOperation = 'source-over'",

  // The drawing rules are one paragraph per label; a map drops the rules about people on the ground.
  RULE_LABELS: /(?<=[.)]) (?=(?:SCALE|FRAMING|GROUND|SPACING|WHEELS|LIGHT|EFFECTS)(?: \([^)]*\))?: )/g,
  RULE_MAP_DROP: /^(?:SCALE|FRAMING|GROUND|SPACING|WHEELS|LABELS)(?: \([^)]*\))?: /,
  RETRY_MS: [2000, 5000, 10000, 20000, 30000],
  THUMBNAIL_BROWSER_IDLE_MS: 90_000,
  SAVE_THROTTLE_MS: 1000,
  // How many scenes before a group's lines its plan sees.
  PREVIOUS_SCENES: 3,
  // Devices a scene may use (thought, emote, inset, count, spotlight, time, sound, speed, impact).
  DEVICES_MAX: 2,
  THUMBNAIL_STILL: { width: 960, quality: 0.82, mime: "image/jpeg", canvas: "canvas", context: "2d", smoothing: "high" },
  ABANDON_LOG: (id: string): string => `Cảnh HTML ${id}: tab dựng không trả kết quả sau khi tự phục hồi – bỏ lượt cũ, gửi lại ở tab dựng đang trống.`,
  LANGUAGE_POLICY:
    "PRODUCTION LANGUAGE: Write all production descriptions, sceneTemplateDraft, sceneTemplate, continuity notes and sound-event descriptions in English. Use English section headings. Generated code must contain no comments. Narration, utterance text, audience-facing titles and visible text inside the video must remain in the selected video language. Preserve proper names, IDs, source quotations and exact display strings. Supplied source material, saved drafts and user notes may be in another language: treat them as data and express their production meaning in English within this same response. Do not add a separate translation request. Do not translate audience-facing content into English unless English is the selected video language.",
  CODE_LANGUAGE: (language?: string): string => `ON-SCREEN TEXT LANGUAGE: ${language || "as written in the scene"}. The SCENE is written in English for production: every visible word (header, sign, diagram text, speech) is written in this language, with proper names in their usual form in it; never copy English production wording onto the screen.`,
  SCENE_LABEL: "SCENE (source data):\n",
  // The plan's picture, first in the drawing prompt: everything else serves it.
  PICTURE: (scene: { message?: string; keyVisual?: string; devices?: string[] }): string | undefined =>
    scene.message || scene.keyVisual
      ? [
          "PICTURE (what this scene must make a viewer understand in about two seconds; every choice below serves it):",
          scene.message ? `MESSAGE: ${scene.message}` : "",
          scene.keyVisual ? `KEY VISUAL: ${scene.keyVisual} (the acting subjects stand in the open near the centre third, larger and clearer than anything else; the object the message turns on is drawn about one and a half to two times life size, held where it is seen; only the acting subjects move clearly, the rest keeps small living motion)` : "",
          `DEVICES: ${scene.devices?.length ? scene.devices.join("; ") : "none"} (FIG.device; see DEVICES in the figure guide)`,
        ]
          .filter(Boolean)
          .join("\n")
      : undefined,
  DATE_PART: /\d+/g,
  ON_SCREEN_TEXT: (time?: string, map?: boolean): string =>
    `ON-SCREEN TEXT (overrides the SCENE): ${map ? MOTION_HTML_QUALITY.MAP_TEXT : "no place sign, signpost, milestone or place-name marker in this scene"}; ${time ? `the time header (FIG.header, see LABELS) carries only the date part of this time (day, month, year or century) in the video language, never a time of day, light or weather: ${JSON.stringify(time)}` : "no top-left header in this scene: the time has not changed"}; any other header text, tag, number, slogan or unit name the SCENE lists is not written anywhere on screen, not on a sign, a banner or a box.`,
  LEGACY_PLAN_FIELD: "graphics",
  // Settings applied only when the scenes are shown (never part of a plan).
  VIEW_SETTINGS: ["profileId", "layout", "figureKit", "proportion", "movement"] as readonly string[],
  SWITCH_AFTER: 2,
  SWITCH_LOG: (id: string, from: string, to: string): string => `Cảnh HTML ${id}: ${from} lỗi 2 lần liền – chuyển cảnh này sang ${to}.`,
  IDENTITY: (artifact: string, requestId: string): string => `\n<html> carries data-artifact='${artifact}' data-request-id='${requestId}'.`,
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
  COUPLED: {
    TITLE: "COUPLED MECHANICS (shared anchor):",
    RIDER_TOKEN: "MOUNT_RIDER",
    RIDER_FREE: "as the rider option of its FIG.animal call",
    CASES: [
      { test: /\b(?:horses?|mounted|mount(?:s|ing)?|dismount\w*|rid(?:e|es|ing|er|ers)|rode|cavalry|horsem[ae]n|saddle\w*)\b/iu, text: "- Mount & rider: one anchor horseX = lerp(startX, stopX, rideP), horseY = groundY(horseX); the seated rider is drawn with the horse (MOUNT_RIDER), never positioned separately. Mount or dismount only when the SCENE says, as one continuous move between saddle and ground while the horse stands still." },
      { test: /\b(?:haul\w*|push(?:es|ed|ing)?|pull(?:s|ed|ing)?|drag(?:s|ged|ging)?|tow(?:s|ed|ing)?|draws? (?:the|a|its|their)|drawn by|limber(?:s|ed|ing)? up|carr(?:y|ies|ied|ying) (?:the|a) (?:stretcher|boat|litter))\b/iu, text: "- Hauled or pushed carts, wagons, guns, limbers, stretchers, boats: one anchor rigX = lerp(startX, endX, moveP), rigY = groundY(rigX); wheels rotate by (rigX - startX) / wheelR * facing; draft animals at rigX + facing * hitch with traces; pushers or haulers at rigX - facing * contact, leaning in with hands on the vehicle, stepping only while rigX moves." },
      { test: /\b(?:tables?|breech|targets?|touch\w*|load(?:s|ed|ing)?|grab\w*|picks? up|hands? (?:over|it)|reach\w*|lifts?|lifting|opens?|opening|writes?|writing|signs?|signing)\b/iu, text: "- Touching a prop or target: actor at propX - facing * reach with facing = sign(propX - actorX), hands on the prop." },
    ] as readonly { test: RegExp; text: string }[],
  },
  OUTPUT: [
    "Build one self-contained HTML5 Canvas + vanilla JS animation in <canvas id=\"motion-canvas\"> (no network/CDN, external assets, audio or video tags). Head: <meta charset=\"utf-8\"> and <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111;overflow:hidden}#motion-canvas{display:block;width:100vw;height:100vh}</style>.",
    "API: window.motionScene = { ready: Promise.resolve(), renderAt: async function (input = {}) {...} }. renderAt reads width, height, duration, progress, time, seed, speaking, motionEnabled with safe defaults (width >= 320, height >= 180, duration 10, progress clamped 0..1), resizes the canvas, scales from a 1280x720 design space and renders deterministically from time, progress and a seeded PRNG (no Date.now/performance.now inside renderAt; motionEnabled=false freezes the opening frame).",
    "End the script with exactly this preview loop: if (!window.__MOTION_HOST__) { const t0 = performance.now(), dur = 10, loop = (now) => { const t = ((now - t0) / 1000) % dur; window.motionScene.renderAt({ time: t, progress: t / dur, frame: Math.floor(t * 30), fps: 30, duration: dur, width: window.innerWidth || 1280, height: window.innerHeight || 720, mode: 'preview', motionEnabled: true, sceneEffectsEnabled: true, seed: 'preview', speaking: [] }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }",
    "SETTING: draw only the environment the SCENE names, at the framing its shot gives on the 1280x720 design; you never move, pan or zoom a camera (the video's layout frames and moves it), so draw no camera transform. Sky, ground and anything running through the frame extend to x -450..1730, y -260..980 so the layout's camera never reveals an edge; every ground band is filled down to y 980. Never clearRect or erase after the backdrop and never use destination-out, destination-in, xor or copy composite modes: doorways and shadows are painted dark shapes. SCALE: people by shot and depth: an establishing shot shows the place with small people (5-9% of frame height); a wide shot, the usual one for marches, camps and crowds, keeps the nearest standing people at about 12-17%; a medium shot (22-30%) when two to four people act together; a close shot only when the SCENE asks. People on one ground line share one size and shrink only with distance; animals and vehicles keep their real size against them (a horse's back about level with a standing person's head top, a cart wheel about hip high). FRAMING: the near rank's feet at about 74-82% of the frame height in a wide shot (62-72% establishing, 80-88% medium), heads at least 40px below the top edge, every subject the SCENE names whole inside the frame with a margin for the whole scene. GROUND: no roads, paths or tracks unless the SCENE puts the action on one. SPACING: near people stand at least 2.5 head radii apart; the acting subjects and anyone the narration names stay in the open, never covered by anything nearer; tall things in front only frame the picture at the left or right edge. WHEELS: a moving cart or wagon is pulled by an animal in front of it (its own FIG.animal) or by people at its shafts. LIGHT: a night, dusk, storm or firelit scene tints the whole picture with one multiply fill (night deep blue about 55%, dusk violet about 30%, storm grey about 35%) drawn before fires, torches and lit windows. EFFECTS: smoke, fire and dust never cover a face; a fire sits on the ground beside people.",
    "MOTION: a traveller faces its direction for the whole trip (facing = endX >= startX ? 1 : -1); movement toward or away from the camera is drawn from the front or back. A traveller moves only while its keyframes move it, with distance, and covers at least 15-25% of the frame width; enter or leave only via a frame edge or doorway. A gathering group closes in and advances only when the SCENE says so. Depth-sort by ground y.",
    "LABELS: no subtitles, banners, tags or callouts: never write names next to anything and never draw leader lines; FIG.arrow only on a map. Only a short time header (a date, year or century) when ON-SCREEN TEXT gives one, as FIG.header(ctx, { text }), the very last call of every frame. Text that is part of a diagram, chart or map the SCENE asks for stays inside it.",
    "CODE (compact): about 200-350 short lines. Repeated people, props, tufts and stones come from data arrays and loops (one short line per item). One shape(p, fill, shade, width) helper and one smooth(points) helper serve every outline. Each FIG function serves every call through its options, never copied variants. No dead code, debug output, comments or blank lines; English identifiers. Every save() has its restore() in the same block and every clip() sits in its own save()/restore().",
  ].join("\n"),
} as const;
export const MOTION_HTML_REPAIR = {
  EMPTY: "",
  NEWLINE: "\n",
  CR: "\r",
  STAR: "*",
  SLASH: "/",
  LINE_COMMENT: "//",
  BLOCK_OPEN: "/*",
  BLOCK_CLOSE: "*/",
  BACKSLASH: "\\",
  SINGLE_QUOTE: "'",
  DOUBLE_QUOTE: '"',
  BACKTICK: "`",
  OPEN_PAREN: "(",
  CLOSE_PAREN: ")",
  OPEN_BRACKET: "[",
  CLOSE_BRACKET: "]",
  OPEN_BRACE: "{",
  CLOSE_BRACE: "}",
  SCRIPT_BODY_HTML_CLOSE: "</script></body></html>",
  BODY_HTML_CLOSE: "</body></html>",
  BODY_CLOSE: "</body>",
  HTML_CLOSE: "</html>",
} as const;
