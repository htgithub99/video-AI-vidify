import { MOTION_HISTORY_STAGING, MOTION_HISTORY_STORYBOARD } from "./motionHistory.js";
import { MOTION_SOUND_PROMPT } from "./motionSound.js";
import { MOTION_SFX_MOODS } from "./motionAudio.js";
export const MOTION_GEN_CONFIG = {
  ARTIFACT_BIBLE: "motion-gen-bible",
  OTHER_CAST: "OTHER CAST – context only, do NOT design them here; make this character clearly distinguishable from them:\n",
  LEGACY_SCHEMA: "Legacy character schema is not supported; return parts/anchors/poses/motions instead of: ",
  ARTIFACT_LOCATION: "motion-gen-location",
  ARTIFACT_LOCATION_REVIEW: "motion-gen-location-review",
  ARTIFACT_STAGING: "motion-gen-staging",
  ARTIFACT_STAGING_REVIEW: "motion-gen-staging-review",
  LOCATION_ROUNDS: 1,
  STAGING_TRIES: 3,
  LONG_VIDEO_SCENE_BEATS: 60,
  LONG_LOCATION_ROUNDS: 1,
  SCORE_KEY: "score",
  NOTE_KEY: "note",
  REVIEW_OFF_LOG: "Đã tắt bước AI xem ảnh (Cấu hình AI) – chỉ sửa theo lỗi máy tự phát hiện.",
  BEATS_PER_STAGING_CALL: 8,
  MIN_BEATS_PER_AI_CALL: 3,
  REVIEW_IMAGES_PER_CALL: 6,
  PREVIEW_FOLDER: "gen-preview",
  PREVIEW_WIDTH: 960,
  REVIEW_WIDTH: 768,
  REVIEW_HEIGHT: 432,
  ASSET_ORIGIN: "https://motion-assets.local",
  BIBLE_BATCH: 4,
  SERIAL_PROVIDERS: ["claude-chat"] as string[],
  BATCH_CAST: "DESIGN EVERY CHARACTER BELOW in one answer: return one cast entry per key, each clearly distinguishable from the others:\n",
  KEY_BEATS_PER_STAGING_CALL: 12,
  AUTO_SHOTS: ["medium", "wide", "close", "over_shoulder", "medium", "low"],
  AUTO_ANGLES: [0, 18, -18, 32, -32, 10],
  AUTO_MOVES: ["static", "dolly_in", "pan_left", "static", "truck_right", "dolly_out"],
  AUTO_EMPHASIS_MOVE: "dolly_in",
  AUTO_STRAIGHT_SHOTS: ["wide", "aerial"] as string[],
  AUTO_FOCUS_SHOTS: ["close", "extreme_close", "over_shoulder", "low", "insert"] as string[],
  AUTO_MOVE_AMOUNT: 0.45,
  AUTO_SECOND_CAMERA_SECONDS: 6,
  AUTO_SECOND_CAMERA_AT: 0.55,
  AUTO_SPACING: 1.3,
  AUTO_MIN_GAP: 0.9,
  AUTO_ARC: 0.3,
  AUTO_TWO_SHOT: "over_shoulder",
  AUTO_GROUP_SHOT: "wide",
  AUTO_EMPTY_SHOT: "wide",
  AUTO_FALLBACK_SHOT: "medium",
  AUTO_FACE_CAMERA: "camera",
  AUTO_IDLE: "idle",
  AUTO_SEAT_MARK_RE: /seat|chair|sofa|bench|bed|stool/i,
  AUTO_SEATED_RE: /^(sit|seat|drive|ride)/i,
  AUTO_WORD_SPLIT: /[_\s-]+/,
  AUTO_CLAUSE_SPLIT: /[,.;:!?]|\s(?:and|while|then|as|but|và|trong khi|rồi|còn)\s/i,
  AUTO_EMOTION_EXPRESSION: { sad: "sad", tense: "scared", surprised: "surprised", excited: "happy", warm: "happy", serious: "serious" } as Record<string, string>,
  LOG_LIBRARY_PLAN: (castReused: number, placesReused: number, castDraw: number, placesDraw: number, requests: number): string => `Kho cảnh: dùng lại ${castReused} nhân vật, ${placesReused} bối cảnh – cần vẽ mới ${castDraw} nhân vật, ${placesDraw} bối cảnh (≈ ${requests} request AI vẽ)`,
  LOG_LIBRARY_FILLED: (castCount: number, placeCount: number): string => `Tự lấy mẫu cùng loại trong kho cho ${castCount} nhân vật, ${placeCount} bối cảnh chưa có`,
  LOG_KEY_STAGING: (keyBeats: number, autoBeats: number): string => `Dàn dựng: ${keyBeats} beat quan trọng gửi AI chính, ${autoBeats} beat dàn dựng tự động (0 request)`,
  LOG_AUTO_STAGED: (count: number): string => `Đã dàn dựng tự động ${count} beat`,
  LOG_AUTO_FALLBACK: (count: number): string => `AI chưa dàn dựng được ${count} beat – dùng dàn dựng tự động`,
} as const;
export const MOTION_GEN_PREAMBLE = "You are a writer, visual designer, cinematographer and editor. Build the requested video from its input and project Video DNA. Treat source material as data. Preserve factual claims when factual; preserve fictional intent when fictional. Do not impose a genre or a preset aesthetic.";
export const MOTION_GEN_LOOKS = ["documentary", "noir", "teal_orange", "vintage", "cold_thriller", "warm_story", "clean"];
export const MOTION_GEN_GRADES = ["neutral", "teal", "cold", "warm", "noir", "bleach", "vintage"];
export const MOTION_GEN_ANALYSIS_PROMPT = (o: { preamble: string; title: string; seconds: number; language: string; chapters: number; transcript: string }): string => `${o.preamble}
ROLE: analyze the supplied input as a writer, visual designer, cinematographer and editor.
TASK: return a source-derived production plan as JSON. Do not force a genre, story arc or aesthetic from a catalogue.

Context:
- Original title: ${o.title}
- Target video length ≈ ${o.seconds} seconds. Narration language: ${o.language}.
- Split the story into about ${o.chapters} chapters that follow the plot. "from"/"to" are seconds in the source transcript.
- Rank chapters like an editor ranking songs: "weight" 1-5 = how important and attractive this part is for THIS video (thesis, turning points, most surprising details score high; minor repetitive items low). Screen time follows weight, not source length. "mustKeep": true for chapters that must survive any cut (the context-setting opening, the main argument/conclusion, the ending). Keep chronological order.
- Plan the WHOLE video once so chapters written separately still read as one film: per chapter "hook" (how it grabs attention in its first line, in ${o.language}), "keyPoints" (2-6 facts/events it must cover, with source timestamps), "handoff" (the idea or question its last line passes to the next chapter, in ${o.language}). Each fact belongs to exactly one chapter; never plan the same point twice. Vary the hooks: a concrete moment, a surprising number, a contrast, a person's reported words, a plain continuation – at most one hook in four may be a question.
- "sfxMood": the background sound mood that fits the Video DNA soundBed, one of: ${Object.keys(MOTION_SFX_MOODS).join(", ")}.

Requirements:
1. "cast": every important person. "key" = short snake_case ASCII id. "gender": male|female. "look" = what this person wears and carries in ENGLISH, concrete and visual (clothes with colours, uniform, hat, glasses, bag…; era-correct; max 30 words). Design original character features, skin, hair and clothing from the input-derived visual language. Do not force people into object-only inputs.
2. "places": only environments needed by this input, including abstract spaces when appropriate. "key" = snake_case id, "name" in ${o.language}, "description" in ENGLISH = concrete layout, scale, materials, palette, relevant objects, usable subject stations and motivated light (max 120 words), following the Video DNA. "interior": true/false. "time": day|dusk|night|dawn|overcast|interior|interior_dark, as appropriate to the input. Merge equivalent environments. Do not invent extra rooms or people to meet a count.
3. "era": the period and country of the story in English (e.g. "1976, Nice, France").
4. "facts": proper names, dates, numbers and places that auto-transcripts often get wrong. status = ok | uncertain | wrong, short "note". Never invent facts. At most 12.
5. "look": the closest renderer option among ${MOTION_GEN_LOOKS.join(", ")}; this is a technical rendering option, not a genre rule. The Video DNA defines the actual look. "accent": a hex accent colour supported by that blueprint.
6. Write "title", "logline", chapter "title"/"summary", cast "name"/"role"/"description", place "name" and fact "claim"/"note" in ${o.language}.
7. Keep it compact: chapter summary ≤ 35 words, cast description ≤ 20 words.
8. No gore or explicit violence. Leave out sexual content and anything the audience suitability excludes; do not list it in facts or cast, and never give it a chapter or a chapter title (if the source spends time on it, fold that time into a neighbouring chapter).
9. "genre" and "genre2": optional descriptive metadata, use "" when unnecessary. They must not select narration, sets, light, structure or camera rules. "factual": true for an account presented as real events, false for fiction; note uncertainty in the Video DNA when the input does not establish this.
10. Return one complete "videoDna" object following the contract below. Do not return the obsolete "dna" or "creativeBlueprint" fields. Keep "chapters", "cast", "places", "facts", "look", "accent", "era" and "sfxMood" at the JSON root, as siblings of "videoDna". The field "videoDna.visualDna.palette" must be one non-empty string describing the colours; if a reference supplies a colour array, describe those colours in this string.

JSON format:
{"title":"…","logline":"…","genre":"","genre2":"","factual":true,"videoDna":{…},"look":"clean","accent":"#ffb070","era":"…",
 "sfxMood":"history","chapters":[{"id":"c1","title":"…","summary":"…","from":0,"to":95,"weight":3,"mustKeep":false,"hook":"…","keyPoints":["(01:12) …"],"handoff":"…"}],
 "cast":[],
 "places":[{"key":"main_space","name":"…","description":"…","interior":false,"time":"day"}],
 "facts":[{"claim":"…","status":"uncertain","note":"…"}]}

TRANSCRIPT:
${o.transcript}`;
export const MOTION_GEN_STORYBOARD_RULES = (language: string): string => `STORYBOARD RULES – the picture must tell the same story as the words:
- Every beat has "visual": scene | title | chapter | quote | stats | counter | map | timeline | starmap | bitmap | headline | ending | geomap | icons.
- "scene" = a scene rendered in the selected 2D or 3D mode; actors are optional. Fields: "place" (a place key), "time" (day|dusk|night|dawn|overcast|interior|interior_dark), "weather" (none|rain|snow|fog), "shot" (wide|medium|close|over_shoulder|low|high|aerial|insert), "cast" (only visible people; may be empty), "action": ONE concrete English sentence describing the visible state, subject, camera emphasis and relevant props. Humans hold static poses; camera and props may move. Represent events through supported visual states, not impossible character animation. Follow the project-specific visual language and pacing.
- Choose scenes or supported graphics according to the input and Video DNA. Use stats, counter, map, timeline, starmap, bitmap, quote and headline only when needed by the content. Do not enforce a fixed scene-to-graphic ratio.
- Do not add explanatory scene labels or floating captions; narration subtitles provide the explanation.
- "emphasis": true for the 1–2 key moments of the chapter.
- "data" for the other visuals:
  title: {"kicker","title","subtitle"}; chapter: {"number","title"}; quote: {"text","author","highlight":[words],"sourceQuote"} – a quote card with an author must quote words that really exist in the transcript: "sourceQuote" = those exact words copied from the transcript in its original language (at least 5 words), "text" = their faithful translation. Never quote a line marked [audio quote not in transcript], never turn a paraphrase or summary into quotation marks; if the exact words are not in the transcript, narrate the idea in a scene beat as reported speech ("X warned that…") instead;
  stats: {"title","items":[{"value":8,"prefix":"","suffix":" m","label":"…"}]} (1–4 numbers); counter: {"from":0,"to":60,"label":"NIGHTS","format":"int|clock"};
  map: {"title","points":[{"id","x":0..1,"y":0..1,"label","sub"}],"routes":[{"from","to"}]} (schematic diagram for invented or abstract places only; for any real country, city, battle or route use geomap);
  timeline: {"title","events":[{"date","text"}]}; starmap: {"title","stars":[{"id","x":0..1,"y":0..1,"label","sub","center":true|false}],"links":[{"from","to","label":"4.2 light-years"}]} (space chart for stars, planets, probes and distances; 2–12 stars); bitmap: {"title","rows":["0110…","1001…"],"caption"} (a pixel grid of 0/1 rows, at most 48 columns × 64 rows, for transmitted messages, pixel images or binary data – the rows must really draw the described picture); headline: {"paper":"a generic newspaper name, never a real one","date","headline","sub"}; ending: {"text","sub"};
${MOTION_HISTORY_STORYBOARD}
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
  outline?: string;
  rules: string;
  role: string;
  genre: string;
  cast: string;
  places: string;
  transcript: string;
}): string => `${o.preamble}
ROLE: ${o.role}. Write the narration and the shot list (JSON) for one chapter.
Story: "${o.title}" — ${o.logline}
CHAPTER ${o.chapterId}: "${o.chapterTitle}" — ${o.chapterSummary}

NARRATION:
- ${o.languageNote}. The "narration" field MUST be written in ${o.language}.
- Write original narration according to the project's purpose and voice. Preserve established facts in factual work and the supplied premise in fiction; do not invent real-world claims. Do not translate the source sentence by sentence.
- Total ≈ ${o.units} ${o.unitName} (≈${o.seconds} s of speech). HARD LIMIT: never more than ${o.units} ${o.unitName} for all beats together. About ${o.beats} beats, each 1–3 short sentences (≈${o.perBeat} ${o.unitName}).
- Spell out numbers a TTS voice may misread.${o.firstNote}${o.lastNote}
${o.previous}
${o.outline || ""}
${o.genre}

${o.rules}

CAST (keys):
${o.cast}

PLACES (keys):
${o.places}

JSON (example shape – a different story):
{"chapterId":"${o.chapterId}","beats":[
 {"narration":"…","visual":"scene","place":"bank_lobby","time":"day","weather":"none","shot":"wide","cast":["courier"],"action":"The courier in a grey suit walks through the marble bank lobby toward the counter, carrying a brown briefcase"},
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
- sphere {"radius", "hemisphere":true (optional)}; cone {"radius","height"}; capsule {"radius","height"}; torus {"radius","tube","arc"} – stands upright like a wheel (XY plane); rotate [90,0,0] to lay it flat (hat brims, rings on a table)
- plane {"size":[w,h]} (faces +Z; rotate [-90,0,0] to lie flat); disc {"radius"}; ring {"radius","inner"}
- ORIENTATION CHECK for flat round things built from several shapes (a record, coin, clock face, wheel, medal, dish): disc, ring and torus already face +Z with no rot; a cylinder only faces +Z after rot [90,0,0]. All layers of one object must end up facing the same way (e.g. cylinder rot [90,0,0] + ring/disc/torus with NO rot), otherwise a rim or ring sticks out sideways or the object shows edge-on as a line.
- extrude {"points":[[x,y],…] (a 2D outline in the XY plane, 3–64 points), "depth", "bevel", "holes":[[[x,y],…]]} – extruded along Z and centred. Best for car bodies (side profile), arches, stairs, signs, roofs, furniture outlines.
- lathe {"points":[[radius,y],…]} – revolved around Y: bottles, vases, columns, lamp shades, cups, tyres.
- tube {"path":[[x,y,z],…], "radius"} – pipes, cables, railings, hoses.
- text {"text":"…","height":0.3,"color":"#fff","bg":"#123" (optional),"glow":true (neon),"billboard":true (always turns to the camera – for floating labels)} – signs, plates, numbers, labels (≤ 60 chars).
- arrow {"from":[x,y,z],"to":[x,y,z],"radius":0.03,"color":"#ffd34d"} – a glowing pointer arrow (no "pos" needed); with a billboard text it makes an on-screen annotation.
- group {"children":[nodes]} – children positions are relative to the group; the group's "mat" is inherited.
- use {"ref":"def_name", "tint":"#hex" (optional)} – a copy of a component from "defs".
- model {"ref":"<ref from the MODEL LIBRARY list>", "length":4.5 | "height":3 | "width":2 (optional real size in metres – omit to use the listed size), "tint":"#hex" (optional colour tint)} – a ready-made high-quality 3D model (car, building, furniture, tree, boat…). For a model "pos" is the centre of its FOOTPRINT and pos y is the floor it stands on (usually 0); "rot":[0,yaw,0] turns it (yaw 0 = its front faces +Z). Prefer library models for every object that has a good match (vehicles, buildings, furniture, trees, props) – they look far better than shapes; draw with shapes only what the list does not have (walls, floors, rooms, era-specific or unusual objects). Exception: when a PROJECT STYLE KIT is given, use a library model only if its look matches the kit (models keep their own catalogue colours and shading); otherwise draw that object yourself in the kit's style. Use ONLY refs from the list.
- repeat {"node":{one node}, "count":[nx,ny,nz], "step":[dx,dy,dz], "jitter":0.3 (optional), "skip":0.2 (optional random gaps)} – rows of pillars, windows, parked cars, trees, seats.
- light {"type":"point"|"spot"|"sun"|"hemi"|"ambient", "pos", "target" (spot/sun), "color", "intensity" (1 = normal lamp, 3 = strong, 6 = very strong; sun 1–3), "distance", "angle" (spot), "penumbra", "shadow":true (max 2), "flash":{"hz":2,"colors":["#ff2020","#2050ff"],"duty":0.5} (police/alarm lights), "flicker":0.3 (fire, broken neon)}.
MATERIALS: "materials":{"name":{"color":"#hex","roughness":0..1,"metalness":0..1,"pattern":one of concrete|asphalt|road|gravel|tiles|checker|brick|wood|planks|marble|metal|rust|fabric|carpet|leather|grass|dirt|sand|water|stone|plaster|panels|stripes|noise,"patternColor":"#hex","scale":metres per pattern repeat,"cols":n,"rows":n,"glass":true,"opacity":0..1,"emissive":"#hex","emissiveIntensity":0..0.85,"clearcoat":0..1 (car paint),"double":true}}. Glass reflects the surroundings, so give glass a dark tint and put something across the street/room for it to reflect. Lamps, screens, neon and car lights use "emissive".
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
- Draw the place richly and recognisably: correct geometry and materials rather than a target node count, real proportions, era-correct details, several materials (surface patterns only where the style shows texture), small props that tell the story. Walls of an interior: floor, walls, ceiling, a door, windows/light fixtures. Outdoor: ground, roads/pavements, buildings around (also BEHIND the camera so glass and car paint reflect something), sky colours.
- Derive palette, material texture, reflectance, lighting contrast and background treatment from the PROJECT STYLE KIT when one is given (it wins over everything else, including the example below), otherwise from the project Video DNA, and from each actual object. Do not impose dark walls, warm accents, cool rims, a restricted colour count or a documentary aesthetic. Keep important subjects readable without washing out material distinctions. Choose supported patterns at a believable scale and metalness only where physically or stylistically justified.
- Everything stands on the ground or on another object – nothing floats, nothing intersects through the stage.
- Light it like a film: at night or inside, add motivated lights (lamps, windows, street lights, car headlights, police lights) – at least 2–6 lights; keep the stage readable.
- Never draw characters – the actors are added separately.
- Name the important objects ("name") so later shots can refer to them.
- Definitions are invisible until instantiated: place every required story object inside nodes with shape use, ref and pos. All lights also belong inside nodes, never a separate lights array. Include the key object in the actual set, not just its component definition. Keep its visible working surface directed toward an accessible camera position.
- Build recognisable hero objects with their functional details (controls, display, moving component, trim, supporting structure), using child geometry and distinct materials. Do not substitute an unadorned cube or cylinder for the story's central object.`;
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
export const MOTION_GEN_LOCATION_PROMPT = (o: { preamble: string; guide: string; example: string; era: string; story: string; key: string; name: string; description: string; interior: boolean; time: string; uses: string; style: string; note: string; library: string }): string => `${o.preamble}
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
export const MOTION_GEN_LOCATION_REVIEW_PROMPT = (o: { preamble: string; key: string; description: string; uses: string; engineNotes: string }): string => `${o.preamble}
ROLE: art director. The two attached images are test renders in the selected drawing mode of the location "${o.key}" (wide view and reverse view). The stage dimensions and object coordinates define scene scale.
The location should be: ${o.description}
It will be used for: ${o.uses}
Automatic checks: ${o.engineNotes || "none"}
Judge: does it clearly look like that place (architecture, era, key objects)? Are sizes consistent with the supplied stage and object dimensions? Anything floating, cut through, missing or ugly? Is the subject readable in the selected drawing mode (not black, not burnt out)? For 2D evaluate flat colour separation rather than photorealistic lighting. Is the stage free for the actors?
Return JSON: {"score":0..10,"issues":["concrete fix instruction with object names and numbers", …]} – max 8 issues, [] if it is already excellent (score ≥ 8).`;
export const MOTION_GEN_LOCATION_FIX_PROMPT = (o: { preamble: string; guide: string; library: string; key: string; description: string; previous: string; issues: string; errors: string }): string => `${o.preamble}
ROLE: production designer. Improve the 3D location "${o.key}" (${o.description}).
${o.errors ? `The previous JSON had format errors – fix them:\n${o.errors}\n` : ""}${o.issues ? `Art director notes – apply ALL of them:\n${o.issues}\n` : ""}
${o.guide}

MODEL LIBRARY (ref | name | default size width×height×depth in metres):
${o.library}

PREVIOUS LOCATION JSON:
${o.previous}

Return JSON: {"location":{ …the full corrected LOCATION JSON… }}`;
export const MOTION_GEN_BIBLE_PROMPT = (o: { preamble: string; story: string; era: string; look: string; cast: string; errors: string }): string => `${o.preamble}
ROLE: character artist. Design original characters for NEW scenes from the story. When a PROJECT STYLE KIT or uploaded reference images exist they are authoritative: follow kit.character exactly (head:body ratio, head shape, eyes, brows, mouth, nose, hair, arms, hands, legs, clothing detail, expressions) and kit.animals for animals; they override generic visual direction and cast descriptions. Without references, choose proportions that suit this story, its audience and Video DNA – realistic, semi-realistic or cartoon are all valid; do not default to big heads, armless bodies or pill/cylinder bodies. Every character must have a clearly different silhouette from the others (height, build, hair, clothing shape) and the body parts the style shows (arms and hands when the style has them). Animals keep their own anatomy (e.g. a cat: four legs, tail, ears, muzzle). No body templates, compulsory anatomy, fixed heights or automatic proportion fitting exist in the renderer.
STORY: ${o.story}
ERA / COUNTRY: ${o.era}. Visual direction: ${o.look}.
CAST: ${o.cast}
${o.errors ? `Correct these failures: ${o.errors}` : ""}
Every node uses the key "shape" (never "type"). Do not use legacy fields body/height/build/layers/drawnBody/socket. Return JSON {"style":{"grade":"neutral","notes":"project-specific visual direction"},"cast":{"each_cast_key":{"materials":{},"parts":[{"id":"silhouette","pos":[0,0,0],"nodes":[...]}],"anchors":{"body":"silhouette"},"poses":{"idle":{}},"motions":{}}}}.
A character is a FREE hierarchy of named parts. Each part has id, optional parent (another part id), pos [x,y,z], optional rot [degrees] and scale [x,y,z], and nodes in that part's local coordinates. Parent links must be acyclic. Use as few or as many parts as the design needs; no prescribed joint names or count. Clothing, face, hair and silhouette are drawn geometry. Coordinates use scene metres, +Y up and +Z forward. Place the base at y=0; choose actual geometry dimensions to preserve reference proportions without normalization. Include expressive eyes/mouth and distinctive silhouettes when shown in references, rather than generic blocks.
Nodes support box (size [w,h,d], bevel), sphere (radius, scale), cylinder/cone (radius,height; the axis is vertical, so a flat face-on disc with thickness needs rot [90,0,0]), capsule (radius,height), torus (radius,tube), plane (size [w,h]), disc/ring (radius), extrude (points [[x,y],...], depth), lathe (points [[radius,y],...]), tube (path [[x,y,z],...],radius), stroke (points [[x,y],...] in the local XY plane facing +Z, width, optional closed, fill, straight – a smooth drawn line or filled curve for eyebrows, eyelids, mouths, lips, nose lines, hair locks, wrinkles, tears, sweat drops, whiskers, cracks; place it just in front of the surface it is drawn on), and group (children). Supply pos, optional rot in degrees and mat {color:'#hex',roughness:0..1,metalness:0..1,unlit:true} or a key in materials. Use shallow geometry/extruded silhouettes for flat cartoons and authored volumes for 3D. No external character models, lights or annotation text.
Faces must read at a medium shot. Skin colour, eye/mouth shape and size and line weight come from the style kit and the reference image details; where they say nothing, use a real skin tone (not the white/cream of clothing or background), eyes at least 1/8 of the head height and strokes at least 1/30 of the head width. Features sit just in front of the face surface on the +Z side. Hair, hoods, hats and buns sit on top/behind (negative z) and never cover the face. The face plate (flat skin, or with the kit's own shading tones when kit.render uses shading) must be the front-most surface of the head where the eyes and mouth are: a head ball, hood shell or cap dome must not bulge in front of it (keep their front z behind the face plate, or draw a hood as a ring around the face opening). Human and animal heads follow the head shape of the style kit or references (usually round or oval); do not build a person's head or face from a plain box unless the style is blocky (voxel, papercraft, robot) or the references show square heads. Arms hang outside the torso silhouette: with +Z toward the camera, rot z>0 swings a hanging limb toward +X, so the arm on the -X side uses a small negative z rotation and the arm on the +X side a positive one; hands must be visible from the front. Alternate face shapes (mouth_open, eyes_wide…) are hidden until an expression shows them. Draw facial features as separate small parts (eyes, brows, mouth, extras such as tears/blush/sweat) so they can change. Optional "expressions" map names to part transforms layered over any pose, with "visible":false|true to swap shapes, e.g. {"sad":{"brows":{"rot":[0,0,-12]},"mouth":{"scale":[1,-1,1]},"tears":{"visible":true}},"talk":{"mouth":{"visible":false},"mouthOpen":{"visible":true}},"blink":{"eyes":{"scale":[1,0.12,1]}}}. Author the emotions the story needs (e.g. happy, sad, scared, angry, surprised, crying) when the style shows faces; "talk" and "blink" are played automatically. Parts may start hidden with "visible":false. Optional anchors map head/body/base or any attachment name to authored part ids; positions come from the design. poses map action names to part transforms, e.g. {"sit":{"leg":{"rot":[-70,0,0]}}}. Transforms replace the part's rest transform; omitted fields preserve it. Design named poses needed by the story; the renderer has no preset action library. All pivots and geometry lengths are authored by you.
When AUTHORITATIVE CHARACTER MOTION is enabled, author motions for story actions: {"wave":{"duration":2,"loop":true,"tracks":[{"part":"arm","keys":[{"t":0,"rot":[0,0,-20]},{"t":1,"rot":[0,0,20]},{"t":2,"rot":[0,0,-20]}]}]}}. Keys use seconds and absolute local pos/rot/scale; omitted properties preserve the selected pose. Animate only existing parts while preserving geometry and proportions. Motion is optional; no external animation clips are loaded. When disabled, poses still apply and motion tracks stay frozen.
${MOTION_SOUND_PROMPT}
Return only style and cast.`;
export const MOTION_GEN_ACTIONS_GUIDE = (): string => `ACTIONS are names from each character's authored poses and motions in CAST.design. Choose an existing name, or idle for the rest design. Do not assume any action has a built-in animation.
- Follow AUTHORITATIVE CHARACTER MOTION: when enabled, authored motion tracks, safe moveTo paths and then transitions may play; when disabled, use a single fixed authored pose and omit movement/transitions.
- For held objects use hold:{part:"authored part id or anchor name",nodes:[complete geometry nodes]}. Local coordinates belong to that attachment part. No automatic hand attachments or default props exist.`;
export const MOTION_GEN_STAGING_PROMPT = (o: { preamble: string; story: string; actions: string; cast: string; locations: string; beats: string; continuity: string; notes: string }): string => `${o.preamble}
ROLE: film director. Stage each beat according to AUTHORITATIVE CHARACTER MOTION, with readable poses, props and cameras.
STORY: ${o.story}
CAST (keys, visual designs, authored poses and motions):
${o.cast}

LOCATIONS (coordinates in metres, Y up, ground y=0; stage = free floor; marks = named spots; objects = named things with their centre and size):
${o.locations}

${o.actions}

STAGING JSON per beat:
{"id":"beat id","location":"location key","time":"optional override",
 "actors":[{"cast":"key","action":"action id","at":[x,z] or "mark name","face":degrees (0 = toward +Z/the camera side, 90 = toward +X, 180 = away, -90 = toward -X) or "camera" or a cast key or [x,z],
            "hold":{"part":"authored attachment part or anchor","nodes":[complete local geometry nodes]},"y":base height (optional),"ghost":true (optional for ghosts and spirits),"expression":"an expression name authored in this character's design (optional, matches the emotion of the beat)","talk":true or [from,to] fractions of the beat when this character is the one speaking aloud (optional; mouth moves only if the design has a talk expression)}],
 "props":[extra nodes only needed for this beat, same shape format, e.g. a document on the table, a dropped bag, sparks],
 "hide":["names of location objects to hide in this beat"],
 "weather":"none|rain|snow|fog|dust",
 "cameras":[{"at":0,"shot":"wide|medium|close|extreme_close|over_shoulder|low|high|aerial|insert","pos":[x,y,z],"target":[x,y,z],"fov":20..60,"move":"static|dolly_in|dolly_out|pan_left|pan_right|orbit_left|orbit_right|crane_up|crane_down|truck_left|truck_right|follow|handheld","amount":0.3..1.5,"focus":"cast key (optional)","focusProp":"exact existing node name for object detail (required on insert)","follow":"cast key for move follow","dof":0..1 (background blur, close shots)}]}
RULES:
- For actor framing set camera view to front, profile or rear when the story calls for it. A deliberate rear/over-shoulder composition is supported. Otherwise choose a clear view on the actor's facing side rather than its back.
- props must contain COMPLETE scene graph nodes: explicit pos [x,y,z], dimensions and mat, including all children for composite objects. Never return placeholder object descriptions. Objects already listed in the location exist; do not duplicate them in props. Use focusProp with their exact name. If changing an object state, hide the original by name and replace it at the same world position with full geometry.
- Show exactly the "action" sentence of each beat: the right people, the right place, the right objects and what happens to them.
- Put actors on FREE floor: never inside furniture, cars or walls (check the object sizes). Use spacing appropriate to authored character dimensions; subjects who talk or interact face each other; groups form a natural arc toward the camera.
- Explain actions with camera framing and visible props. Do not add floating billboard text, explanatory captions or annotation arrows. Keep only text physically belonging to the scene, such as an EXIT sign or instrument display.
${MOTION_HISTORY_STAGING}
- Ghosts and spirits: an actor with "ghost":true; reveal it slowly (far away, half hidden, in fog or at the end of a corridor) rather than in plain view.
- Follow AUTHORITATIVE CHARACTER MOTION: static poses when disabled; supported animation and safe grounded paths when enabled. Keep the same coordinates and numeric facing across consecutive beats in the same place unless the input explicitly cuts to a new tableau. Choose framing, subject size, negative space and relevant detail targets from the project's visual DNA. People are optional and must not dominate an object-led scene.
- Object actions (opening, taking, putting, writing, digging…): do NOT animate the contact. Stage the actor next to the object in a fitting pose, then cut (a second camera) to an "insert" close-up of the object already in its result state (use "props" and "hide": the box already open, the clock already inside, the note already on the table).
- A visible change needs distinct before and after states across its beats. Do not show the final state in every scene while narration says it changes. Preserve the same object's identity, location and scale; use complete replacement props and hide the exact original child when changing its state. Human animation follows AUTHORITATIVE CHARACTER MOTION.
- Sitting: choose an existing authored seated pose with exact seated coordinates and numeric facing aligned with an existing seat. The engine preserves coordinates and never moves an actor to a nearby chair. Include a chair prop if no seat exists.
- Shot names matter: "wide" = the whole body small in a big space, "medium" = from the waist up, "close" = head and shoulders, "extreme_close" = the face. The engine corrects the camera distance to match the shot name, so pick the name you mean and aim "target" at the person (chest for medium, face for close).
- Poses: choose readable authored poses and motions that match this beat. Non-looping motions hold their final keyframe.
- Choose camera count, shot duration, angle, movement or deliberate stillness from the project's camera grammar and pacing. Do not impose a wide-medium-close sequence, mandatory orbit, thirds composition or a fixed number of cuts. Maintain clear sightlines and appropriate subject scale. An insert must target the actual relevant named prop, not a guessed actor position.
- Working on an object: select an existing authored pose or motion, set "face" to the object's [x,z] and choose distance based on actual character dimensions. Put the camera at the side or three-quarter front of the actor (about 60–90° from where the actor looks) so the face, the hands and the object are all visible – never behind the actor's back.
- Use numeric "face" or a fixed object coordinate. Only emit moveTo/then when AUTHORITATIVE CHARACTER MOTION is enabled; avoid complex contact interactions.
- Camera: derive height, distance and target from actual authored character geometry and anchors. Stylized subjects can have any proportions or height. Keep the camera inside interior walls and clear of objects.
- One to four supported cameras per beat: cuts use "at" times (0..1). Use only the camera coverage needed by this input and blueprint; preserve spatial continuity between views.
${o.continuity}
${o.notes}
BEATS TO STAGE:
${o.beats}

Return JSON: {"beats":[ …one staging object per beat, same ids… ]}`;
export const MOTION_GEN_STAGING_REVIEW_PROMPT = (o: { preamble: string; beats: string; sceneData?: string }): string => `${o.preamble}
ROLE: film editor. The attached images are test renders of these shots, in this order (one image per shot, the shot id is written in the corner):
${o.beats}
ACTUAL SCENE AND SHOT DATA: ${o.sceneData || "not supplied"}
Use these transforms to prescribe exact corrected coordinates, facing and focusProp names. For object detail target the relevant child surface (not a support stand's origin). State changes need actual changed geometry, not narration alone. For a front/profile character shot, place the camera on that actor's facing side using its numeric face or faceAt, never behind it. Return concrete numeric fixes grounded in this data.
  For each shot check: does the picture show what the narration/action says (right people, place, objects, action)? Is it readable and well framed (people not cut, not tiny, not hidden behind objects, camera not inside a wall)? People inside furniture or each other?
Compare consecutive images for narrated object-state changes: the initial state and result must visibly differ. A final-state object repeated throughout does not demonstrate an event. Ask for corrected before/after geometry, not character animation.
If an existing set object lacks functional details, has buried surfaces or wrong geometry/materials, report locationFix separately. Camera/staging changes cannot repair the set geometry. Check layered surfaces: dial/display/controls must be in front of the casing, not inside an opaque cap. Use staging fix only for actor positions, facing, extra props and camera.
The film is staged "camera first": actors mostly hold still poses and the camera moves; an object action may be shown as the actor beside the object plus a close-up of the result. That is intended – never ask for more character movement or for hands to touch objects; judge content, readability and framing only.
Return JSON: {"beats":[{"id":"…","ok":true|false,"fix":"staging correction, empty when ok","locationFix":"set geometry/material/light correction, empty if none"}]}`;
