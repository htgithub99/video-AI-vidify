import { MOTION_GENRE_PREAMBLE_BASE } from "./motionGenres.js";
export const MOTION_GEN_CONFIG = {
  ARTIFACT_BIBLE: "motion-gen-bible",
  ARTIFACT_LOCATION: "motion-gen-location",
  ARTIFACT_LOCATION_REVIEW: "motion-gen-location-review",
  ARTIFACT_STAGING: "motion-gen-staging",
  ARTIFACT_STAGING_REVIEW: "motion-gen-staging-review",
  LOCATION_ROUNDS: 3,
  LOCATION_PASS_SCORE: 8,
  STAGING_TRIES: 3,
  STAGING_REVIEW_PASSES: 1,
  GENRE_PART_VISUAL: "visual" as const,
  SCORE_KEY: "score",
  NOTE_KEY: "note",
  AUTO_FIX_ISSUES: /out of frame|render error|stands inside/,
  REVIEW_OFF_LOG: "Đã tắt bước AI xem ảnh (Cấu hình AI) – chỉ sửa theo lỗi máy tự phát hiện.",
  BEATS_PER_STAGING_CALL: 8,
  REVIEW_IMAGES_PER_CALL: 6,
  PREVIEW_FOLDER: "gen-preview",
  PREVIEW_WIDTH: 960,
  REVIEW_WIDTH: 768,
  REVIEW_HEIGHT: 432,
  ASSET_ORIGIN: "https://motion-assets.local",
  MANNEQUIN_DIR: "mannequin",
  MANNEQUIN_FILES: ["male.glb", "female.glb", "anims_ual1.glb"],
} as const;
export const MOTION_GEN_PREAMBLE = MOTION_GENRE_PREAMBLE_BASE + " Retell real events factually and neutrally.";
export const MOTION_GEN_LOOKS = ["documentary", "noir", "teal_orange", "vintage", "cold_thriller", "warm_story", "clean"];
export const MOTION_GEN_GRADES = ["neutral", "teal", "cold", "warm", "noir", "bleach", "vintage"];
export const MOTION_GEN_ANALYSIS_PROMPT = (o: { preamble: string; title: string; seconds: number; language: string; chapters: number; transcript: string; genres: string; genreIds: string }): string =>
  `${o.preamble}
ROLE: story editor for YouTube storytelling videos (history, true crime, mysteries, disasters, biographies, explainers, ghost stories, folk tales, human stories).
TASK: analyse the story and return the production plan as JSON.

Context:
- Original title: ${o.title}
- Target video length ≈ ${o.seconds} seconds. Narration language: ${o.language}.
- Split the story into about ${o.chapters} chapters that follow the plot. "from"/"to" are seconds in the source transcript.

Requirements:
1. "cast": every important person. "key" = short snake_case ASCII id. "gender": male|female. "look" = what this person wears and carries in ENGLISH, concrete and visual (clothes with colours, uniform, hat, glasses, bag…; era-correct; max 30 words). People are drawn as faceless mannequins, so never describe faces or skin.
2. "places": every distinct location that appears (street, office, garage, bank vault, courtroom…). "key" = snake_case id, "name" in ${o.language}, "description" in ENGLISH = what it looks like: architecture, era, country, materials, colours, key objects, size (max 60 words). "interior": true/false. "time": day|dusk|night|dawn|overcast|interior|interior_dark (the usual time of the action there, matching the genre mood). Merge places that look the same. 2–8 places.
3. "era": the period and country of the story in English (e.g. "1976, Nice, France").
4. "facts": proper names, dates, numbers and places that auto-transcripts often get wrong. status = ok | uncertain | wrong, short "note". Never invent facts. At most 12.
5. "look": one of ${MOTION_GEN_LOOKS.join(", ")} that suits the genre; "accent": a hex accent colour.
6. Write "title", "logline", chapter "title"/"summary", cast "name"/"role"/"description", place "name" and fact "claim"/"note" in ${o.language}.
7. Keep it compact: chapter summary ≤ 35 words, cast description ≤ 20 words.
8. No gore or explicit violence.
9. "genre": decide from the SOURCE itself which ONE genre fits best (the video's narration, structure, sets, light and camera will follow it). Choose exactly one id:
${o.genres}
   "genre2": optional second genre id when the story clearly mixes two (else ""). "factual": true if the source tells real events, false for legends, fairy tales and fictional or unverified ghost stories. "genreReason": one short sentence in ${o.language} saying why.
10. "dna" = what makes THIS story unique, in ENGLISH, short: {"tone": how it should feel (≤ 15 words), "motifs": 1–4 visual motifs or objects to repeat and pay off across scenes (e.g. "the brass alarm clock"), "avoid": 0–4 story-specific things to avoid (real victims' names, disputed claims, graphic details…), "keep": one sentence on the narration voice and look to keep identical in every chapter}.

JSON format:
{"title":"…","logline":"…","genre":"${o.genreIds}","genre2":"","factual":true,"genreReason":"…","dna":{"tone":"…","motifs":["…"],"avoid":["…"],"keep":"…"},"look":"documentary","accent":"#ffb070","era":"…",
 "chapters":[{"id":"c1","title":"…","summary":"…","from":0,"to":95}],
 "cast":[{"key":"albert","name":"Albert Spaggiari","role":"…","description":"…","gender":"male","look":"tan trench coat over grey suit, dark trousers, brown leather shoes"}],
 "places":[{"key":"bank_vault","name":"…","description":"underground bank vault, 1970s France, steel walls lined with hundreds of small safe-deposit boxes, heavy round vault door, fluorescent ceiling tubes","interior":true,"time":"interior"}],
 "facts":[{"claim":"…","status":"uncertain","note":"…"}]}

TRANSCRIPT:
${o.transcript}`;
export const MOTION_GEN_STORYBOARD_RULES = (language: string): string =>
  `STORYBOARD RULES – the picture must tell the same story as the words:
- Every beat has "visual": scene | title | chapter | quote | stats | counter | map | timeline | headline | ending.
- "scene" = a 3D shot with mannequin actors. Fields: "place" (a place key), "time" (day|dusk|night|dawn|overcast|interior|interior_dark), "weather" (none|rain|snow|fog), "shot" (wide|medium|close|over_shoulder|low|high|aerial|insert), "cast" (keys of the people visible), "action": ONE English sentence that says exactly what is visible – who does what, where, with which object, how it ends (e.g. "Albert, kneeling in the tunnel, drills into the concrete wall while Bernard holds a lamp behind him"). Every event of the narration must be visible literally. Something hidden is not shown.
- Use the infographics (stats, counter, map, timeline, quote, headline) only for numbers, dates, routes and quotes, and only when the line is about them. Most beats should be scenes.
- "label": optional short place/time caption shown on screen (≤ 6 words).
- "emphasis": true for the 1–2 key moments of the chapter.
- "data" for the other visuals:
  title: {"kicker","title","subtitle"}; chapter: {"number","title"}; quote: {"text","author","highlight":[words]};
  stats: {"title","items":[{"value":8,"prefix":"","suffix":" m","label":"…"}]} (1–4 numbers); counter: {"from":0,"to":60,"label":"NIGHTS","format":"int|clock"};
  map: {"title","points":[{"id","x":0..1,"y":0..1,"label","sub"}],"routes":[{"from","to"}]} (schematic, not a real map);
  timeline: {"title","events":[{"date","text"}]}; headline: {"paper":"a generic newspaper name, never a real one","date","headline","sub"}; ending: {"text","sub"}.
  All on-screen text (data, label) must be in ${language}.
- No gore, blood or bodies; suggest violent moments with light and darkness.`;
export const MOTION_GEN_CHAPTER_PROMPT = (o: {
  preamble: string;
  title: string;
  logline: string;
  chapterId: string;
  chapterTitle: string;
  chapterSummary: string;
  languageNote: string;
  language: string;
  units: number;
  unitName: string;
  seconds: number;
  beats: number;
  perBeat: number;
  firstNote: string;
  lastNote: string;
  previous: string;
  rules: string;
  role: string;
  genre: string;
  cast: string;
  places: string;
  transcript: string;
}): string =>
  `${o.preamble}
ROLE: ${o.role}. Write the narration and the shot list (JSON) for one chapter.
Story: "${o.title}" — ${o.logline}
CHAPTER ${o.chapterId}: "${o.chapterTitle}" — ${o.chapterSummary}

NARRATION:
- ${o.languageNote}. The "narration" field MUST be written in ${o.language}.
- Retell the facts in your own words — do not translate sentence by sentence. Use only facts you are sure about.
- Total ≈ ${o.units} ${o.unitName} (≈${o.seconds} s of speech). HARD LIMIT: never more than ${o.units} ${o.unitName} for all beats together. About ${o.beats} beats, each 1–3 short sentences (≈${o.perBeat} ${o.unitName}).
- Spell out numbers a TTS voice may misread.${o.firstNote}${o.lastNote}
${o.previous}
${o.genre}

${o.rules}

CAST (keys):
${o.cast}

PLACES (keys):
${o.places}

JSON (example shape – a different story):
{"chapterId":"${o.chapterId}","beats":[
 {"narration":"…","visual":"scene","place":"bank_lobby","time":"day","weather":"none","shot":"wide","cast":["courier"],"action":"The courier in a grey suit walks through the marble bank lobby toward the counter, carrying a brown briefcase","label":"Nice, 1976"},
 {"narration":"…","visual":"scene","place":"bank_vault","time":"interior","shot":"medium","cast":["courier","clerk"],"action":"The clerk opens one small safe-deposit drawer while the courier waits beside him","emphasis":true},
 {"narration":"…","visual":"stats","data":{"title":"…","items":[{"value":3,"suffix":" days","label":"…"}]}}
]}

SOURCE TRANSCRIPT FOR THIS CHAPTER:
${o.transcript}`;
export const MOTION_GEN_DSL_GUIDE = `SCENE-GRAPH FORMAT (you draw everything yourself with simple 3D shapes):
UNITS & AXES: metres. Y is up, the ground is y=0. +Z points toward the default camera ("front"), +X to the right of the camera view. Rotations "rot" are degrees [x,y,z]. "pos" is the CENTRE of the shape (a box of height 2 standing on the ground has pos y=1).
REAL SIZES (keep them!): adult 1.6–1.85 tall; door 0.9×2.1; ceiling 2.7–3.5; table top 0.75 high; chair seat 0.45; desk 1.4×0.7; car 4.6 long × 1.8 wide × 1.45 high, wheel radius 0.33; bus 12×2.5×3.2; lamp post 4–6; storey of a building 3–3.5; stair step 0.17×0.28; window sill 0.9; kerb 0.15.

NODE (one object): {"shape":…, "name":"optional_snake_case", "pos":[x,y,z], "rot":[x,y,z], "scale":[x,y,z] or number, "mat": material name or inline {..}, "shadow":false (optional)}
SHAPES:
- box {"size":[w,h,d], "bevel":0.02 (optional rounded edges)}
- cylinder {"radius", "height", "radiusTop", "radiusBottom", "segments", "arc" (degrees, optional), "open":true (no caps)} – axis is Y; rotate [0,0,90] for wheels/pipes along X.
- sphere {"radius", "hemisphere":true (optional)}; cone {"radius","height"}; capsule {"radius","height"}; torus {"radius","tube","arc"}
- plane {"size":[w,h]} (faces +Z; rotate [-90,0,0] to lie flat); disc {"radius"}; ring {"radius","inner"}
- extrude {"points":[[x,y],…] (a 2D outline in the XY plane, 3–64 points), "depth", "bevel", "holes":[[[x,y],…]]} – extruded along Z and centred. Best for car bodies (side profile), arches, stairs, signs, roofs, furniture outlines.
- lathe {"points":[[radius,y],…]} – revolved around Y: bottles, vases, columns, lamp shades, cups, tyres.
- tube {"path":[[x,y,z],…], "radius"} – pipes, cables, railings, hoses.
- text {"text":"…","height":0.3,"color":"#fff","bg":"#123" (optional),"glow":true (neon),"billboard":true (always turns to the camera – for floating labels)} – signs, plates, numbers, labels (≤ 60 chars).
- arrow {"from":[x,y,z],"to":[x,y,z],"radius":0.03,"color":"#ffd34d"} – a glowing pointer arrow (no "pos" needed); with a billboard text it makes an on-screen annotation.
- group {"children":[nodes]} – children positions are relative to the group; the group's "mat" is inherited.
- use {"ref":"def_name", "tint":"#hex" (optional)} – a copy of a component from "defs".
- model {"ref":"<ref from the MODEL LIBRARY list>", "length":4.5 | "height":3 | "width":2 (optional real size in metres – omit to use the listed size), "tint":"#hex" (optional colour tint)} – a ready-made high-quality 3D model (car, building, furniture, tree, boat…). For a model "pos" is the centre of its FOOTPRINT and pos y is the floor it stands on (usually 0); "rot":[0,yaw,0] turns it (yaw 0 = its front faces +Z). Prefer library models for every object that has a good match (vehicles, buildings, furniture, trees, props) – they look far better than shapes; draw with shapes only what the list does not have (walls, floors, rooms, era-specific or unusual objects). Use ONLY refs from the list.
- repeat {"node":{one node}, "count":[nx,ny,nz], "step":[dx,dy,dz], "jitter":0.3 (optional), "skip":0.2 (optional random gaps)} – rows of pillars, windows, parked cars, trees, seats.
- light {"type":"point"|"spot"|"sun"|"hemi"|"ambient", "pos", "target" (spot/sun), "color", "intensity" (1 = normal lamp, 3 = strong, 6 = very strong; sun 1–3), "distance", "angle" (spot), "penumbra", "shadow":true (max 2), "flash":{"hz":2,"colors":["#ff2020","#2050ff"],"duty":0.5} (police/alarm lights), "flicker":0.3 (fire, broken neon)}.
MATERIALS: "materials":{"name":{"color":"#hex","roughness":0..1,"metalness":0..1,"pattern":one of concrete|asphalt|road|gravel|tiles|checker|brick|wood|planks|marble|metal|rust|fabric|carpet|leather|grass|dirt|sand|water|stone|plaster|panels|stripes|noise,"patternColor":"#hex","scale":metres per pattern repeat,"cols":n,"rows":n,"glass":true,"opacity":0..1,"emissive":"#hex","emissiveIntensity":1..5,"clearcoat":0..1 (car paint),"double":true}}. Glass reflects the surroundings, so give glass a dark tint and put something across the street/room for it to reflect. Lamps, screens, neon and car lights use "emissive".
DEFS: "defs":{"name":[nodes]} – reusable components (a car, a chair, a tree, a window bay). Draw a component once and place it many times with "use"/"repeat". Defs are drawn around their own origin, standing on y=0.
LOCATION JSON:
{"name","interior":true|false,"time":"day|dusk|night|dawn|overcast|interior|interior_dark",
 "sky":{"top":"#hex","horizon":"#hex","city":0..1 (glow of a city at night),"stars":true} (outdoor), "background":"#hex" (interior), "fog":{"color":"#hex","density":0.002..0.05}, "exposure":0.6..1.6, "ambient":0..2,
 "materials":{…}, "defs":{…}, "ground":{"size":[w,d],"mat":"name"} (or {"none":true} when you draw your own floor),
 "nodes":[…everything in the place…],
 "stage":{"center":[x,z],"size":[w,d]} = the free floor area where the people will stand (keep it clear of furniture except what they use),
 "marks":{"name":[x,z]} = named floor spots people use (by_the_door, at_the_counter, driver_door, behind_desk…),
 "camera":{"pos":[x,y,z],"target":[x,y,z],"fov":35..50} = a good establishing view of the stage.}
QUALITY RULES:
- Draw the place richly and recognisably: 80–400 nodes, real proportions, era-correct details, several materials with patterns, small props that tell the story. Walls of an interior: floor, walls, ceiling, a door, windows/light fixtures. Outdoor: ground, roads/pavements, buildings around (also BEHIND the camera so glass and car paint reflect something), sky colours.
- Everything stands on the ground or on another object – nothing floats, nothing intersects through the stage.
- Light it like a film: at night or inside, add motivated lights (lamps, windows, street lights, car headlights, police lights) – at least 2–6 lights; keep the stage readable.
- Never draw people, mannequins or bodies – the actors are added separately.
- Name the important objects ("name") so later shots can refer to them.`;
export const MOTION_GEN_DSL_EXAMPLE = `EXAMPLE (an underground garage – parts of a good answer):
"materials":{"conc":{"color":"#8a8e92","pattern":"concrete","roughness":0.9},"paint_black":{"color":"#0e1116","metalness":0.6,"roughness":0.32,"clearcoat":1},"glass_dark":{"color":"#0b0f14","glass":true,"opacity":0.85},"tire":{"color":"#141414","roughness":0.9},"rim":{"color":"#b8bcc2","metalness":0.9,"roughness":0.25},"head_lamp":{"color":"#ffffff","emissive":"#fff6e0","emissiveIntensity":2},"red_lens":{"color":"#ff2a2a","emissive":"#ff1010","emissiveIntensity":3},"blue_lens":{"color":"#2a5cff","emissive":"#1040ff","emissiveIntensity":3}},
"defs":{
 "wheel":[{"shape":"cylinder","radius":0.34,"height":0.24,"rot":[0,0,90],"mat":"tire"},{"shape":"cylinder","radius":0.22,"height":0.25,"rot":[0,0,90],"mat":"rim"}],
 "sedan":[{"shape":"extrude","name":"body","points":[[-2.35,0.32],[2.35,0.32],[2.4,0.62],[2.2,0.82],[1.05,0.9],[0.55,1.38],[-0.85,1.4],[-1.55,0.95],[-2.3,0.9],[-2.4,0.6]],"depth":1.8,"bevel":0.04,"rot":[0,90,0]},
   {"shape":"extrude","points":[[1.0,0.92],[0.53,1.33],[-0.82,1.35],[-1.48,0.95]],"depth":1.84,"rot":[0,90,0],"mat":"glass_dark"},
   {"shape":"use","ref":"wheel","pos":[0.86,0.34,1.45]},{"shape":"use","ref":"wheel","pos":[-0.86,0.34,1.45]},{"shape":"use","ref":"wheel","pos":[0.86,0.34,-1.45]},{"shape":"use","ref":"wheel","pos":[-0.86,0.34,-1.45]},
   {"shape":"box","size":[0.35,0.12,0.04],"pos":[0.62,0.72,2.38],"mat":"head_lamp"},{"shape":"box","size":[0.35,0.12,0.04],"pos":[-0.62,0.72,2.38],"mat":"head_lamp"}],
 "police_bar":[{"shape":"box","size":[1.1,0.1,0.28],"pos":[0,1.46,-0.1],"mat":"paint_black"},{"shape":"box","size":[0.5,0.11,0.26],"pos":[0.27,1.52,-0.1],"mat":"red_lens"},{"shape":"box","size":[0.5,0.11,0.26],"pos":[-0.27,1.52,-0.1],"mat":"blue_lens"}]},
"nodes":[{"shape":"box","name":"ceiling","size":[60,0.4,60],"pos":[0,3.6,0],"mat":"conc"},
 {"shape":"repeat","pos":[-12,1.7,-6],"count":[4,1,3],"step":[8,0,8],"node":{"shape":"box","size":[0.75,3.4,0.75],"mat":"conc"}},
 {"shape":"group","name":"police_car","pos":[-4.2,0,1.2],"rot":[0,20,0],"mat":"paint_black","children":[{"shape":"use","ref":"sedan"},{"shape":"use","ref":"police_bar"},{"shape":"light","type":"point","pos":[0.3,1.7,-0.1],"intensity":6,"distance":18,"flash":{"hz":2.2,"colors":["#ff2020"],"duty":0.45}},{"shape":"light","type":"point","pos":[-0.3,1.7,-0.1],"intensity":8,"distance":20,"flash":{"hz":2.2,"colors":["#2050ff"],"phase":0.5,"duty":0.45}}]},
 {"shape":"model","name":"parked_van","ref":"k:car-kit/van","pos":[6,0,-3],"rot":[0,-90,0],"length":4.9},
 {"shape":"light","type":"spot","pos":[0.5,3.3,1.5],"target":[0.5,0,0.5],"angle":45,"penumbra":0.7,"intensity":2,"color":"#cfdcff","shadow":true}]`;
export const MOTION_GEN_LOCATION_PROMPT = (o: { preamble: string; guide: string; example: string; era: string; story: string; key: string; name: string; description: string; interior: boolean; time: string; uses: string; style: string; note: string; library: string }): string =>
  `${o.preamble}
ROLE: production designer of a 3D story video. Draw ONE location as a scene-graph.
STORY: ${o.story}
ERA / COUNTRY: ${o.era}
LOCATION "${o.key}" (${o.name}): ${o.description}
Interior: ${o.interior ? "yes" : "no"}. Usual time: ${o.time}.
WHAT HAPPENS HERE (the people will be added later on the stage):
${o.uses}
VISUAL STYLE: ${o.style}
${o.note}

${o.guide}

MODEL LIBRARY (ref | name | default size width×height×depth in metres) – place with {"shape":"model","ref":…}:
${o.library}

${o.example}

Return JSON: {"location":{ …the full LOCATION JSON… }}`;
export const MOTION_GEN_LOCATION_REVIEW_PROMPT = (o: { preamble: string; key: string; description: string; uses: string; engineNotes: string }): string =>
  `${o.preamble}
ROLE: art director. The two attached images are test renders of the 3D location "${o.key}" (wide view and reverse view). A 1.8 m white mannequin stands on the stage centre as a size reference.
The location should be: ${o.description}
It will be used for: ${o.uses}
Automatic checks: ${o.engineNotes || "none"}
Judge: does it clearly look like that place (architecture, era, key objects)? Are sizes right compared to the 1.8 m mannequin? Anything floating, cut through, missing or ugly? Is the lighting cinematic and readable (not black, not burnt out)? Is the stage free for the actors?
Return JSON: {"score":0..10,"issues":["concrete fix instruction with object names and numbers", …]} – max 8 issues, [] if it is already excellent (score ≥ 8).`;
export const MOTION_GEN_LOCATION_FIX_PROMPT = (o: { preamble: string; guide: string; library: string; key: string; description: string; previous: string; issues: string; errors: string }): string =>
  `${o.preamble}
ROLE: production designer. Improve the 3D location "${o.key}" (${o.description}).
${o.errors ? `The previous JSON had format errors – fix them:\n${o.errors}\n` : ""}${o.issues ? `Art director notes – apply ALL of them:\n${o.issues}\n` : ""}
${o.guide}

MODEL LIBRARY (ref | name | default size width×height×depth in metres):
${o.library}

PREVIOUS LOCATION JSON:
${o.previous}

Return JSON: {"location":{ …the full corrected LOCATION JSON… }}`;
export const MOTION_GEN_BIBLE_PROMPT = (o: { preamble: string; story: string; era: string; look: string; cast: string; errors: string }): string =>
  `${o.preamble}
ROLE: costume designer and director of photography for a 3D story video with faceless mannequin actors.
STORY: ${o.story}
ERA / COUNTRY: ${o.era}. Film look: ${o.look}.
CAST:
${o.cast}
${o.errors ? `The previous answer had errors – fix them:\n${o.errors}\n` : ""}
1. "style": {"grade": one of ${MOTION_GEN_GRADES.join(", ")}, "skin": mannequin colour (pale porcelain like "#e9eaec", or warmer "#efe6da" / colder "#e4ebf0"), "gloss": 0.2..0.8, "notes": one sentence about the film look}.
2. "cast": for EVERY key an outfit: {"body":"male"|"female","height":1.55..1.95,"build":-1..1 (slim..heavy),
   "layers":[{"kind": one of tshirt|shirt|polo|sweater|hoodie|uniform_top|tank|vest|jacket|blazer|coat|dress|trousers|jeans|shorts|skirt|belt|shoes|sneakers|boots|gloves|socks|hair|cap|beanie,
              "color":"#hex","pattern":plain|stripes|check|denim|knit|leather|camo|dots,"color2":"#hex" (second colour of the pattern),
              "sleeves":none|short|long, "length":hip|thigh|knee|mini|midi|long|short, "style": for hair short|buzz|bob|long|ponytail|bun, for shirts "untucked"}],
   "accessories":[{"socket": head|face|neck|chest|back|waist|hand_r|hand_l|forearm_r|forearm_l, "name":"…", "nodes":[small shapes in metres]}]}.
   Layers are worn from inside to outside: e.g. shirt + trousers + belt + shoes, then jacket/coat over them. Always give trousers/skirt and shoes.
   Accessory coordinates: origin at the socket, +Y up, +Z forward (the way the person faces), +X the person's LEFT. Head socket origin = centre of the head (head radius ≈ 0.1, top of head at y≈0.12); face socket = front of the face (glasses go at y≈0.02, z≈0.01); chest socket = front of the chest (badges, ties: tie = box [0.07,0.42,0.01] at [0,-0.2,0.02]); waist socket = belt line (holster at x=-0.18).
   Hats: police cap = cylinder radius 0.105 height 0.08 at y 0.07 + visor (box [0.2,0.012,0.09] at [0,0.04,0.13]); fedora = cylinder 0.1/0.11 h 0.11 + brim disc 0.17 at y 0.03. Glasses = two torus radius 0.025 tube 0.004 at x ±0.035.
   Use era-correct, story-correct clothes (police uniforms, suits, workers' overalls…). Distinguish the cast clearly by colours.
Return JSON: {"style":{…},"cast":{"key":{…},…}}`;
export const MOTION_GEN_ACTIONS_GUIDE = (actions: string[]): string =>
  `ACTIONS (body animation): ${actions.join(", ")}.
- standing: idle, talk, phone_look (reading a phone), phone_call, arms_crossed, hands_on_hips, think, point, wave, nod, shake_head, look_around, sad, cover_face, hands_up (surrender), hands_behind_back, handcuffed (arrested), restrain (holding someone's arm), aim / hold_gun / shoot (pistol).
- moving: walk, walk_formal, jog, run, sneak, carry, push – always with "moveTo".
- seated: sit, sit_talk, drive (inside a car: put the actor on the driver seat, "y" ≈ 0.25), sit_down, stand_up.
- other: crouch, kneel_fix (working on something low), interact (press, open, take), pick_up, open_chest, eat_drink, punch, jab, hit, knocked_back, fall_dead, lie, get_up, throw, climb, swim, dance, celebrate, chop, dig, torch, lantern, call_out, lean_rail.`;
export const MOTION_GEN_STAGING_PROMPT = (o: { preamble: string; story: string; actions: string; cast: string; locations: string; beats: string; continuity: string; notes: string }): string =>
  `${o.preamble}
ROLE: film director. Stage each beat below in its 3D location: place the mannequin actors, their actions and movements, extra props, and the camera(s).
STORY: ${o.story}
CAST (keys, look):
${o.cast}

LOCATIONS (coordinates in metres, Y up, ground y=0; stage = free floor; marks = named spots; objects = named things with their centre and size):
${o.locations}

${o.actions}

STAGING JSON per beat:
{"id":"beat id","location":"location key","time":"optional override",
 "actors":[{"cast":"key","action":"action id","at":[x,z] or "mark name","face":degrees (0 = toward +Z/the camera side, 90 = toward +X, 180 = away, -90 = toward -X) or "camera" or a cast key or [x,z],
            "moveTo":[x,z] or mark (optional),"moveStart":0..1,"moveEnd":0..1,"then":"action after the move or after thenAt","thenAt":0..1,
            "hold":[small shapes held in the right hand: origin = palm centre, +Y toward the fingertips, +Z out of the palm; e.g. phone = box [0.075,0.15,0.009] at [0,0.02,0.008]; pistol, torch, document, cup…],"hand":"left" (optional),"y":height of the feet (optional, e.g. on a stage or in a car),"ghost":true (optional: a translucent, softly glowing, floating apparition – only for ghosts and spirits)}],
 "props":[extra nodes only needed for this beat, same shape format, e.g. a document on the table, a dropped bag, sparks],
 "hide":["names of location objects to hide in this beat"],
 "weather":"none|rain|snow|fog|dust",
 "cameras":[{"at":0,"shot":"wide|medium|close|extreme_close|over_shoulder|low|high|aerial|insert","pos":[x,y,z],"target":[x,y,z],"fov":20..60,"move":"static|dolly_in|dolly_out|pan_left|pan_right|orbit_left|orbit_right|crane_up|crane_down|truck_left|truck_right|follow|handheld","amount":0.3..1.5,"focus":"cast key (optional)","follow":"cast key for move follow","dof":0..1 (background blur, close shots)}]}
RULES:
- Show exactly the "action" sentence of each beat: the right people, the right place, the right objects and what happens to them.
- Put actors on FREE floor: never inside furniture, cars or walls (check the object sizes). People who talk or interact stand 0.7–1.4 m apart and face each other; groups form a natural arc toward the camera.
- Explaining something: add "props" with an "arrow" and a billboard "text" label pointing at the part the narration talks about (1–3 per beat, labels in the narration language, ≤ 4 words).
- Ghosts and spirits: an actor with "ghost":true; reveal it slowly (far away, half hidden, in fog or at the end of a corridor) rather than in plain view.
- Working on an object (interact, pick_up, open_chest, kneel_fix, push…): set "face" to the object's [x,z] and stand within arm's reach (0.5–0.7 m from it). Put the camera at the side or three-quarter front of the actor (about 60–90° from where the actor looks) so the face, the hands and the object are all visible – never behind the actor's back.
- Movement: "moveTo" with walk/run etc.; distance ≈ speed × time (walk 1.3 m/s, run 5 m/s; a beat lasts ≈ 4–8 s).
- Camera: eye height 1.4–1.7 for medium shots, 0.4–0.9 for low shots, 3–8 for high shots; wide shots 7–15 m from the actors, medium 2.5–4 m, close 1.2–1.8 m. "target" = what to look at (a face is at y≈1.6, a chest at 1.3). Keep the camera inside the walls of interiors and in front of (not inside) objects.
- One to three cameras per beat: several cameras = cuts at the "at" times (0..1) – use them for dialogue (shot/reverse shot) and to reveal details. Vary angles between consecutive beats, keep the 180° rule in dialogues, and make it cinematic (foreground objects, depth, motivated light).
${o.continuity}
${o.notes}
BEATS TO STAGE:
${o.beats}

Return JSON: {"beats":[ …one staging object per beat, same ids… ]}`;
export const MOTION_GEN_STAGING_REVIEW_PROMPT = (o: { preamble: string; beats: string }): string =>
  `${o.preamble}
ROLE: film editor. The attached images are test renders of these shots, in this order (one image per shot, the shot id is written in the corner):
${o.beats}
For each shot check: does the picture show what the narration/action says (right people, place, objects, action)? Is it readable and well framed (people not cut, not tiny, not hidden behind objects, camera not inside a wall)? People inside furniture or each other?
Return JSON: {"beats":[{"id":"…","ok":true|false,"fix":"concrete instruction to fix the staging (positions, facing, camera, props) – empty when ok"}]}`;
