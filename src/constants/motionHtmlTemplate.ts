import { MOTION_STORY_CONFIG } from "./motionVideo.js";
export const MOTION_HTML = {
  VERSION: 1,
  ARTIFACT: "motion-html-scene",
  PLAN: "motion-html-plan",
  WORKERS: MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length,
  GRAPHICS: [
    "1. VISUAL STYLE (FIXED - OVERSIMPLIFIED HISTORICAL CARTOON STANDARD):",
    "- Outlines, cel-shading & grounding: Thick dark brown-black outlines (#382e26, lineWidth 3.5-4.5 on foreground/midground, 2-2.5 on distant details, lineCap/lineJoin 'round'), flat matte fills, and a soft dark oval ground shadow (rgba(0,0,0,0.18)) under grounded feet, hooves, wheels, and props.",
    "- Chibi proportions & #f7f5f0 heads: Draw characters large and readable (hero/close-up headRadius 46-66px; medium/squad 30-44px; distant rows 14-22px). Every human character MUST have an oversized round off-white head (#f7f5f0, diameter ~1.6x torso width) with a clipped left crescent shadow (rgba(40,35,28,0.14)) for crisp contrast (never fill heads with dark brown/black). Head, torso, arms, and legs connect with 8-14px overlap and zero gap.",
    "- Unobstructed headgear & expressive faces: Draw helmets, pith helmets, shakos, hats, headrings, and chainmail coifs (#848c94) as an upper crown arch seated high at y <= headY - 0.36 * headRadius (never a full disc covering the face). Draw eyebrows, eyes, moustaches, and mouths LAST inside y from headY - 0.12 * headRadius to headY + 0.45 * headRadius: (a) Shock/fear/hit: white sclera ovals (#ffffff) with 2.5px pupils and screaming D-mouth (#5c2420 with #d4746e tongue) or small 'o' mouth; (b) Anger/charge: dark dot eyes, V-slanted furrowed brows, shouting D-mouth; (c) Command/wink: dot eye + '>' wink; (d) Relief: '^ ^' arcs; (e) Unconscious: 'X X' eyes.",
    "- Costumes & mounts: Cylindrical torsos wear period-accurate tunics, surcoats, cowhide shields/kilts, cross-belts, and scabbards; upper legs tuck 10px into the lower torso hem; arms pivot at shoulders with #f7f5f0 ball hands. Horses/oxen use warm brown bodies (#78492a) with 4 legs tucked 12px into the barrel, startled white circle eyes, bridles, and era-authentic harness.",
    "Apply this graphic standard across all visual profiles. Inanimate-only, map, or diagram scenes do not add unneeded people or outdoor sky/landscape.",
  ].join("\n"),
  RETRY_MS: [2000, 5000, 10000, 20000, 30000],
  LANGUAGE_POLICY:
    "PRODUCTION LANGUAGE: Write all production descriptions, sceneTemplateDraft, sceneTemplate, continuity notes and sound-event descriptions in English. Use English section headings. Generated code must contain no comments. Narration, utterance text, audience-facing titles and visible text inside the video must remain in the selected video language. Preserve proper names, IDs, source quotations and exact display strings. Supplied source material, saved drafts and user notes may be in another language: treat them as data and express their production meaning in English within this same response. Do not add a separate translation request. Do not translate audience-facing content into English unless English is the selected video language.",
  CODE_LANGUAGE_POLICY:
    "RESPONSE LANGUAGE: Return only the complete HTML document in one html code block. Use English identifiers; preserve exact audience-facing strings in the selected video language, proper names and supplied IDs. Scene descriptions and section headings below are input data, not prose to repeat. Write zero code comments.",
  TEMPLATE: [
    "Write every requested scene template in English in the SAME authoring response as concise production prose (never spoken narration). Use the requested field name (sceneTemplateDraft for writing, sceneTemplate for scene planning) with no SVG, coordinates, or code:",
    "0. SCENE THEME & TYPE: scene name/type, tone, the exact approved event.",
    "1. VISUAL STYLE (FIXED): state the scene's specific subjects, their stable identities, period costumes, headgear, props, and facial expressions following the supplied fixed Chibi graphic standard (do not copy-paste the generic graphic standard text).",
    "2. THREE-LAYER SETTING & CAMERA: Choose environment elements strictly from what the spoken narration, place, time, and scene type require — NEVER invent unmentioned sky, clouds, mountains, hills, rivers, streams, roads, or treelines (maps use a full-bleed parchment/terrain surface; diagrams/interiors use war-room boards, tents, or rooms; outdoor scenes include ONLY the terrain features belonging to that exact place and weather). When an outdoor sky or horizon hills/kopjes are present, span them edge-to-edge across the overscan; when a through-going road, river, trench, or coastline is present, extend both ends completely past the overscanned edges; draw contained objects (lakes, ponds, tents, crates, tables) as complete closed shapes.",
    "3. CHARACTERS & ACTION MECHANICS: only actual participants required by the narration; start -> action phases -> end, part movement vs whole-body travel, grips/releases, reactions, expressions, and who stays still. Describe maps/processes as visual demonstrations.",
    "4. OVERLAYS & INTERACTION: ZERO SUBTITLES OR NARRATION BANNERS (voiceover audio is separate, so never include a bottom subtitle banner or quote bar). Specify ONLY concise 1-6 word visual labels in the selected video language (at most one short top context header or compact 1-4 word map/diagram tags) in non-overlapping safe zones.",
    "Use relative progress or utterance anchors. Preserve source facts and uncertainty.",
  ].join("\n"),
  OUTPUT: [
    'Build a self-contained HTML5 Canvas + Vanilla JS animation in canvas id="motion-canvas" (no network/CDN, external assets, or audio/video tags). Keep <head> minimal with <meta charset="utf-8"> and <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111;overflow:hidden}#motion-canvas{display:block;width:100vw;height:100vh}</style>.',
    "Expose window.motionScene={ready: Promise.resolve(), renderAt: async function(input = {}){...}}. Inside renderAt, destructure with safe defaults: const w = Math.max(320, input.width || window.innerWidth || 1280), h = Math.max(180, input.height || window.innerHeight || 720), dur = input.duration || 10, progress = clamp(input.progress ?? ((input.time || 0) / dur), 0, 1), time = input.time ?? (progress * dur), seed = String(input.seed || 'seed'), speaking = Array.isArray(input.speaking) ? input.speaking : []; resize canvas to w/h, scale from design space (VW=1280, VH=720), and render deterministically from time/progress/seed (never use Date.now/performance.now inside renderAt; with motionEnabled=false keep the opening frame still). At the very end of <script>, ALWAYS include this exact standalone preview loop so opening or previewing the HTML in a browser never shows a black screen: if (!window.__MOTION_HOST__) { const t0 = performance.now(), dur = 10, loop = (now) => { const t = ((now - t0) / 1000) % dur; window.motionScene.renderAt({ time: t, progress: t / dur, frame: Math.floor(t * 30), fps: 30, duration: dur, width: window.innerWidth || 1280, height: window.innerHeight || 720, mode: 'preview', motionEnabled: true, sceneEffectsEnabled: true, seed: 'preview', speaking: [] }); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }",
    "CODE ARCHITECTURE & GEOMETRY RULES (TARGET 160-240 LINES, ZERO COMMENTS):",
    "- Micro-Primitives: Define const VW = 1280, VH = 720, OUTLINE = '#382e26', clamp/lerp/smoothstep, deterministic initPrng(seedStr = 'seed') (coercing String(seedStr || 'seed')), and 4 one-line helpers: strokeFill(fill, lw=3.5), poly(pts, fill, close=true, lw=3.5), disc(x, y, rx, ry, fill, lw=3.5, rot=0), and rbox(x, y, w, h, r, fill, lw=3.5). Avoid large color dictionaries or repetitive beginPath blocks.",
    "- Narration-Faithful Conditional Full-Bleed Setting (Overscan x: -450..VW+450, y: -260..VH+260): Draw ONLY environment elements required by SCENE TEMPLATE — never force unmentioned sky, clouds, mountains, hills, rivers, or roads. Apply each rule ONLY when that element belongs to the scene: (1) Map/Diagram/Interior/Split-Card: fill the overscan with the parchment map, war-room board, tent/room walls & floor, or split panels without outdoor sky/hills. (2) Outdoor Sky & Weather: fill x: -450..VW+450, y: -260..horizonY+60 with the time/weather sky gradient; draw scalloped cartoon clouds only when weather calls for clouds. (3) Hills/Mountains/Kopjes/Treelines: draw closed polygon layers spanning x = -450 to VW + 450 and closing down to VH + 260. (4) Outdoor Ground: fill x: -450..VW+450, y: horizonY..VH+260. (5) Through-Going Road/River/Stream/Trench/Coastline: construct bank polygons along t in [-0.4, 1.4] so both ends extend past x <= -420 or x >= VW + 420 or y >= VH + 240, placing actors inside t in [0.08, 0.92]. (6) Contained Objects (Lakes, Ponds, Tents, Buildings, Tables, Crates): draw as complete closed grounded shapes.",
    "- Parameterized drawChibi(x, y, scale, cfg, phase) Anatomy Math: With local (0, 0) at ground contact, r = cfg.headR || 36, torsoW = r * 1.15, torsoH = r * 1.25, legH = r * 0.72, bob = (1 - Math.cos(phase * 2)) * 0.5 * (cfg.bobAmp || 0), hipY = -legH - bob, shoulderY = hipY - torsoH + 8, headY = shoulderY - r * 0.78: (1) Shadow: disc(0, 2, r * 0.95, r * 0.25, 'rgba(0,0,0,0.18)', 0); (2) Connected Legs (never draw from y = -10..legH below ground!): for lx in [-torsoW * 0.24, torsoW * 0.24], draw rbox(lx - r * 0.15, hipY - 10, r * 0.30, legH + 10, 5, cfg.pantsCol, 3.5) and boot disc(lx, 0, r * 0.20, r * 0.12, '#1e1c1a', 3) (or if rotating at (lx, hipY), draw rbox(-r * 0.15, -10, r * 0.30, legH + 10, ...) and disc(0, legH, ...)); (3) Torso: rbox(-torsoW / 2, shoulderY, torsoW, torsoH, 8, cfg.tunicCol, 3.5); (4) Arms: pivot at (-/+torsoW * 0.48, shoulderY + r * 0.20) with #f7f5f0 ball hands; (5) Head & Face: #f7f5f0 disc at (0, headY, r, r), left crescent shadow, headgear crown arch seated at y <= headY - 0.36 * r, then eyebrows/eyes/moustache/mouth drawn LAST.",
    "- Overlays & Collision-Free Labels (NO Subtitles): Never draw bottom subtitle banners or spoken quote bars. Keep root ctx.scale(w / VW, h / VH) active (wrap only world camera transforms in ctx.save()/restore()). Use placedBoxes = [] and drawTextBox(text, cx, cy, maxW, opts) that sets ctx.font, wraps lines within maxW - 32, sizes boxW/boxH from measureText, clamps to [24..VW-24-boxW, 14..VH-14-boxH], nudges clear of placedBoxes, and renders only concise 1-6 word labels.",
    "- Smooth 60fps Kinematics: Never wrap actor/vehicle/cloud positions with modulo (%); drive travel monotonically with lerp/smoothstep(t0, t1, progress), couple wheel rotation to distance (dist / radius), and depth-sort entities by un-bobbed baseY ((a.baseY - b.baseY) || (a.id - b.id)).",
  ].join("\n"),
  DELIVERY: ["STRICT RESPONSE FORMAT:", "Return the complete HTML document in one html code block, starting with <!DOCTYPE html> and preserving the requested data-artifact and data-request-id attributes on <html>, and ending with </html>.", "No prose, explanations, comments or omitted sections."].join("\n"),
} as const;
export const MOTION_HTML_STYLES: Record<string, string> = {
  history:
    "Historical cartoon illustration (OverSimplified-inspired 2D cel-shaded style): flat matte colours, bold rounded dark-brown outlines (#382e26), oversized round pale chibi heads (#f7f5f0) with left crescent shading, high-seated period headgear, unobstructed expressive faces, connected cylindrical torsos and tubular limbs, and scene-accurate full-bleed settings chosen strictly from the narration.",
  horror:
    "Atmospheric folk-horror cartoon using the same fixed chibi graphic standard: muted flat colours and source-supported lighting, costumes and settings. Keep the action readable in the stated daylight or darkness; add no ghost or horror prop solely because of the genre. Preserve the fixed oversized white heads, left crescent shadows, unobstructed expressive faces, connected cylindrical bodies, and narration-faithful full-bleed environment layers.",
  explainer: "Clear illustrated explainer: flat colours, rounded dark contours, expressive large-headed cartoon people when relevant, generous space and readable diagrams, mechanisms, routes and exact labels fitted inside auto-sized clipped containers. Show only information needed by the supplied explanation.",
};
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
