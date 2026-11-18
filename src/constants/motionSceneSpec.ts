// The scene spec: what the AI is asked for (one JSON object per scene), the words the engine knows, the real sizes code
// checks the AI's sizes against, and the warnings code writes when it repairs or leaves out something.
export const MOTION_SCENE_SPEC = {
  VERSION: 1,
  // Bumped whenever the engine draws differently: pictures captured with an older engine are captured again (no AI).
  ENGINE: 2,
  WIDTH: 1280,
  HEIGHT: 720,
  FNS: ["person", "animal", "vehicle", "building", "prop", "tree", "wall", "bridge", "sticker"] as const,
  WALL_KINDS: ["wall", "palisade", "fence", "wagonFort", "gate", "sandbags", "barbedWire", "stakeRow", "earthwork"] as const,
  SCATTER: ["rock", "boulder", "grass", "stump", "log", "reeds", "flowers", "stuckArrow"] as const,
  EFFECTS: ["darkSmoke", "whiteSmoke", "smokeColumn", "dustTrail", "bonfire", "burning", "embers", "sandstorm", "heat", "rays", "steam", "sparks", "splash", "ripple", "shockwave", "crater", "glow", "fireflies", "leaves", "petals", "explosion"] as const,
  WATER: ["river", "lake", "sea", "stream", "pond", "swamp"] as const,
  DEVICES: ["thought", "inset", "emote", "count", "time", "sound", "speed", "impact", "spotlight"] as const,
  SIGNS: ["alarm", "question", "sweat", "sleep", "shiver", "anger"] as const,
  TIMES: ["day", "dawn", "dusk", "night"] as const,
  GROUNDS: ["dirt", "grass", "sand", "snow", "mud", "stone"] as const,
  // Width of one drawing for its height (the engine uses the same numbers to keep things apart).
  ASPECT: { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1, bridge: 4, sticker: 1, rider: 1.35 } as Record<string, number>,
  // Real height of a thing against an adult standing next to it (1 = person). A size the AI gives that is off by more
  // than SIZE_TOLERANCE either way is set to this.
  SIZE: {
    person: 1, rider: 1.35, animal: 0.95, horse: 0.95, warHorse: 1, packHorse: 0.9, mule: 0.85, donkey: 0.75, ox: 0.85, cow: 0.8, oxTeam: 0.85, camel: 1.2, elephant: 1.8, dog: 0.4, sheep: 0.45, goat: 0.45, pig: 0.4, chicken: 0.18, wolf: 0.45, bear: 0.75,
    wagon: 0.85, cart: 0.7, chariot: 0.75, catapult: 1.2, trebuchet: 2.6, rowboat: 0.45, boat: 0.7, canoe: 0.35, raft: 0.3, ferry: 0.75,
    tent: 1.5, campTent: 1.1, yurt: 1.5, hut: 1.6, house: 2.2, cottage: 2, longhouse: 2.2, barn: 2.6, church: 4, temple: 4, castle: 5, tower: 4.5, windmill: 4,
    barrel: 0.45, crate: 0.4, sack: 0.35, basket: 0.3, stump: 0.3, log: 0.25, rock: 0.3, boulder: 0.6, campfire: 0.35, bonfirePit: 0.4, well: 0.9, haystack: 0.9, woodpile: 0.5, banner: 1.8, torch: 0.9, table: 0.45, chair: 0.55, bench: 0.3, chest: 0.4, weaponRack: 0.9, spearStand: 1, anvil: 0.45, cauldron: 0.5, cookpot: 0.35, warDrum: 0.5, scarecrow: 1.2, signpost: 1.3,
    fence: 0.55, palisade: 1.4, wall: 2, gate: 2.2, sandbags: 0.5, barbedWire: 0.5, wagonFort: 0.85, stakeRow: 0.65, earthwork: 0.6, villageCluster: 2.6,
    oak: 3, pine: 3.2, birch: 2.8, willow: 2.8, palm: 3, bamboo: 2.6, bush: 0.7, dead: 2.4, cypress: 3, fruit: 2.4, cherry: 2.4, banana: 2.2, banyan: 3.4,
  } as Record<string, number>,
  SIZE_TOLERANCE: 2.5,
  SIZE_TOLERANCE_LOOSE: 4,
  LOOSE: ["rock", "boulder", "log", "stump", "bush", "oak", "pine", "birch", "willow", "palm", "bamboo", "dead", "cypress", "fruit", "cherry", "banana", "banyan", "haystack", "woodpile", "campfire", "bonfirePit"] as readonly string[],
  // A thing's size is checked against people within this share of their distance below the horizon.
  DEPTH_BAND: 0.25,
  // A sticker under this size (px) cannot be seen in the video and is left out.
  STICKER_MIN: 40,
  HAZE_MAX: 0.35,
  // How far the focal box may be covered by a thing drawn in front of it before that thing is moved.
  COVER_MAX: 0.2,
  SAMPLES: [0, 0.25, 0.5, 0.75, 1],
  HORIZON: [120, 560] as [number, number],
  // Things the plan names that the library has under another word of the same period (the catalogue's own names are
  // checked first). A word with no entry here and no catalogue entry is left out of the scene.
  NEAR: {
    pony: "horse", steed: "horse", charger: "warHorse", destrier: "warHorse", cattle: "ox", bullock: "ox", oxen: "ox", calf: "cow",
    ferryboat: "ferry", barge: "ferry", skiff: "rowboat", dinghy: "rowboat",
    cookfire: "campfire", firepit: "campfire", fire: "campfire", lance: "spear", standard: "banner", flag: "banner", pennant: "banner",
    canopy: "campTent", shelter: "campTent", pavilion: "tent", bush: "bush", shrub: "bush", stone: "rock", rocks: "rock", stones: "rock",
    palisades: "palisade", stockade: "palisade", rampart: "earthwork", ramparts: "earthwork", embankment: "earthwork", parapet: "wall",
  } as Record<string, string>,
  WARN: {
    DROPPED_KIND: (id: string, kind: string): string => `Bỏ "${id}": kho không có "${kind}" (cũng không có đồ gần đúng cùng thời đại)`,
    NEAR_KIND: (id: string, kind: string, near: string): string => `"${id}": kho không có "${kind}", dùng "${near}" thay`,
    RESIZED: (id: string, from: number, to: number): string => `"${id}": cỡ ${Math.round(from)}px không hợp lý, đã sửa thành ${Math.round(to)}px`,
    INTO_FRAME: (id: string): string => `"${id}" nằm ngoài khung – đã kéo vào trong`,
    GROUNDED: (id: string): string => `"${id}" ở trên trời – đã đặt xuống mặt đất`,
    SEAT: (id: string): string => `"${id}" ngồi lên vật không có – bỏ chỗ ngồi`,
    MOVED: (id: string, focus: string): string => `"${id}" che "${focus}" – đã dời sang bên`,
    MOVED_BACK: (id: string, focus: string): string => `"${id}" che "${focus}" – đã lùi ra sau`,
    DROPPED_COVER: (id: string, focus: string): string => `Bỏ "${id}": che "${focus}" mà không dời được`,
    MISSING: (ids: string[]): string => `Cảnh thiếu: ${ids.join(", ")}`,
    STICKER: (id: string): string => `Bỏ hình tự vẽ "${id}": quá nhỏ hoặc kho đã có`,
    INSET: (of: string): string => `Bỏ ô phóng to vào "${of}": thứ được phóng không rõ`,
    HAZE: "Khói/bụi quá dày – đã giảm",
    FOCUS: (id: string): string => `Chọn "${id}" làm chủ thể chính`,
    FALLBACK: "Cảnh dựng bằng code từ phân cảnh (AI không trả bản mô tả dùng được)",
    PARSE: "Bản mô tả của AI hỏng JSON – đã tự sửa",
  },
  // The WARN lines that tell of something the scene lacks (DROPPED_KIND, DROPPED_COVER, MISSING, FALLBACK); every other
  // line is a repair code made on its own.
  ISSUE: /^Bỏ "[^"]*": (?:kho không có|che )|^Cảnh thiếu:|^Cảnh dựng bằng code/,
  FALLBACK_LOG: (id: string, tries: number): string => `Cảnh ${id}: AI không trả bản mô tả dùng được sau ${tries} lượt – dựng cảnh từ phân cảnh bằng code.`,
  PARSE_ERROR: "Bản mô tả cảnh không đọc được (không phải JSON hoặc thiếu items)",
  // The page every scene is: the spec, read by the engine the figure table adds when the scene is shown.
  PAGE: (data: string): string =>
    `<!DOCTYPE html>\n<html data-artifact="motion-html-scene" data-motion-spec="1"><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111;overflow:hidden}#motion-canvas{display:block;width:100vw;height:100vh}</style></head>\n<body><canvas id="motion-canvas"></canvas><script>window.__motionSpec=${data};</script></body></html>`,
  PAGE_MARK: /data-motion-spec="1"/,
  SPEC_DATA: /window\.__motionSpec=(\{[\s\S]*?\});<\/script>/,
} as const;

// The request for one scene: everything the AI needs to lay the scene out, nothing about how to draw it.
export const MOTION_SCENE_SPEC_PROMPT = {
  ROLE: `You are the scene director of an animated history video. You compose ONE scene as a precise SCENE SPEC (JSON) — with the same care and detail you would put into writing the scene's canvas code: exact pixel positions, sizes, timing and changes. A drawing engine draws every item from its library in the art style the user chose, so you never draw people, animals, vehicles, buildings or scenery yourself.

WHAT MATTERS MOST, in this order:
1. A viewer understands the scene at a glance: who it is about, where we are, what is happening.
2. It is beautiful: a clear, balanced picture with depth and a rich, detailed setting that shows the place and the time.
3. Never wrong: nothing in a wrong place, no extra limbs or stray objects, nothing from another period. Leaving something out is fine; showing it wrong is not.
4. The plan's details — but only those that read clearly on screen. Leave out what the library cannot show well or what would be too small to see (a cut on a knuckle, a cord in a fist, a frayed string): show the moment with what reads instead (pose, expression, the main object).

OUTPUT: one JSON object only (no prose, no comments).`,
  FRAME: `THE FRAME
- 1280 x 720 pixels, x to the right, y downward. No camera moves (the app frames the shot itself).
- "horizon": the y of the horizon line (usually 230-380). Ground below it, sky above.
- Every item stands on the ground at its ground point (x, y) = the middle of its feet/base, and "h" is its full height in pixels (a person: feet to top of head; a rider: hooves to the rider's head).
- Perspective: things further back stand higher (smaller y) and are smaller. Keep h proportional to (y − horizon): an item at y has h ≈ h_ref × (y − horizon) / (y_ref − horizon) compared with any other item.
- Real sizes against a standing person (1): rider on horse 1.35, horse 0.95, wagon 0.85, tent 1.5, camp tent 1.1, house 2.2, tree 3, barrel 0.45, crate 0.4, sack 0.35, stump 0.3, campfire 0.35, boulder 0.6, palisade 1.4, wall 2.
- Real widths for spacing (from h): standing person ≈ 0.6h (arms and held things), running person ≈ 0.9h, rider on horse ≈ 1.25h, horse ≈ 1.25h, wagon ≈ 1.7h, tent ≈ 2.4h, house ≈ 1.1h, tree ≈ 0.7h. A group needs width ≥ members per row × member width × 0.8 for people, × 0.95 for riders, animals, carts and tents; use more rows (each row ≈ 0.3 × h further back) before squeezing.
- THE MASTER SHOT: compose every scene as the whole stage seen from far enough back, whatever the plan's shot says (the app's camera cuts the medium and close shots out of it). The focal person stands 220-320 px tall (30-45 % of the frame), whole from head to feet, ground point y 560-680; the setting shows on both sides. Keep named people and the focal subject at least 8 % of the width from the side edges. The plan's shot (wide, medium, close) only tells the camera what to favour.`,
  SCHEMA: `SCHEMA
{
 "horizon": 300,
 "time": "day"|"dawn"|"dusk"|"night",
 "ground": "dirt"|"grass"|"sand"|"snow"|"mud"|"stone",
 "ridge": "none"|"low"|"hills",
 "interior": { "wall": "#rrggbb", "floor": "#rrggbb" },   // only for a scene inside a tent, house or hall (then no sky, ridge or water)
 "sky": { "clouds": 0-6, "birds": true|false, "sun": true|false, "sunX": px },
 "water": [ { "kind": "river"|"lake"|"sea"|"stream", "y": top px, "h": band height px } ],
 "scatter": [ { "kind": <scatter word>, "count": n, "area": [x0, y0, x1, y1] } ],
 "haze": { "kind": "dust"|"smoke"|"mist", "amount": 0-0.35, "at": [p0, p1], "frontOf": y },   // in front of everything above y frontOf, behind the rest
 "effects": [ { "kind": <effect word>, "x": px, "y": px, "r": px, "at": [p0, p1] } ],
 "items": [ {
   "id": "...", "fn": "person"|"animal"|"vehicle"|"building"|"prop"|"tree"|"wall"|"bridge"|"sticker",
   "kind": <library word (not for person)>,
   "x": px, "y": px, "h": px, "facing": 1 (looks right) | -1 (looks left),
   "look": { options below },
   "keys": [ { "at": 0-1, "x": px, "y": px, "h": px, "facing": ±1, <any look option> }, ... ],
   "group": { "count": n, "width": px, "rows": 1-3, "depth": px },
   "mount": <animal kind>, "mountLook": { animal options },
   "on": <id>,
   "from": px, "to": px, "gaps": [[x0, x1], ...],
   "z": number,
   "focal": true,
   "fade": [p0, p1],
   "at": [p0, p1],
   "burning": true,
   "w": px, "heldBy": <id>, "hand": "front"|"back", "code": "<canvas JS>"
 } ],
 "devices": [ { "kind": <device>, ... } ]
}
- keys: the item's track. "at" is scene progress 0..1. Numbers (x, y, h) glide smoothly from key to key; other values (pose, expression…) switch when their key starts. Before the first key the item holds that key; after the last key it holds it. A person or animal whose x changes runs (or walks with "pose": "walk") and turns to face its direction by itself. Things that only change pose/expression need keys too (e.g. { "at": 0.7, "expression": "worried" }).
- group: n alike members in a block "width" px wide, "rows" deep (each back row "depth" px higher). mount: the person rides that animal; h = the whole rider. on: sits on that item (the seat is put under the hip). from/to: walls, palisades, fences, wagonFort: their length along the ground at this y; gaps: open stretches in it (a breach, an opening in a wagon fort). bridge: a bridge across a river or ditch, its deck at this y, "x" its middle, "w" its length in px, "h" the drop from the deck to the water, look { "build": "wood"|"stone" }. z: draw order (default: by y, lower y first). focal: the scene's main subject, exactly one. fade: fades out between p0 and p1. at: only shown between p0 and p1. burning: the thing itself burns.
- Every id on the plan's REQUIRED line must be an item id (lower case, as written).`,
  DEVICES: `DEVICES (only those the plan's DEVICES line lists)
- { "kind": "emote", "of": <person id>, "sign": "alarm"|"question"|"sweat"|"sleep"|"shiver"|"anger", "at": [p0, p1] } — a sign over that head.
- { "kind": "thought", "of": <person id>, "x": px, "y": px, "r": 70-130, "at": [p0, p1], "items": [ 1-3 small library items (x, y relative to the bubble centre, h 30-70) ] } — a picture bubble rising from that head.
- { "kind": "inset", "of": <person id>, "part": "head"|"hand", "r": 90-140, "zoom": 2-4, "at": [p0, p1] } — a round close-up drawn over the frame: "head" for the face's reaction; "hand" for the small thing at their hand (give that thing as a small prop item next to the hand, e.g. a whetstone or letter, or as their hold). The app places it in a free corner.
- { "kind": "impact", "x": px, "y": px, "r": px, "at": [p0, p1] } — a burst where a blow, shot or stone lands.
- { "kind": "sound", "of": <id> or "x"/"y", "r": px, "facing": ±1, "at": [p0, p1] } — rings from a horn, drum or shout.
- { "kind": "speed", "of": <moving id>, "at": [p0, p1] } — streaks behind it.
- { "kind": "count", "x": px, "y": px, "w": px, "h": px, "groups": [ { "n": 300, "color": "#rrggbb" }, { "n": 20000, "color": "#rrggbb" } ] } — blocks of small figures for numbers and odds.
- { "kind": "time", "x": px, "y": px, "r": px, "body": "sun"|"moon" } — the sun or moon moving along the sky for time passing.
- { "kind": "spotlight", "of": <id>, "at": [p0, p1] } — light on the subject, the rest dimmed.`,
  MAP: `THIS SCENE IS A MAP. Return instead:
{
 "map": {
   "paper": "#rrggbb",
   "land": [ [[x,y],[x,y],...], ... ],        // coastlines / land outlines as closed point lists (8-30 points each), frame pixels
   "water": [ [[x,y],...], ... ],             // seas or lakes as closed point lists
   "rivers": [ [[x,y],...], ... ],            // rivers as open point lists, source to mouth
   "places": [ { "name": "<in the video language>", "x": px, "y": px, "big": true|false } ],
   "forces": [ { "id": "<REQUIRED id>", "side": "<who>", "color": "#rrggbb", "x": px, "y": px, "size": 14-30, "keys": [ { "at": 0-1, "x": px, "y": px } ] } ],
   "arrows": [ { "from": [x,y], "to": [x,y], "color": "#rrggbb", "at": [p0, p1], "curve": -0.4..0.4 } ]
 },
 "items": [],
 "devices": [ ... only "count" or "time" if the plan lists them ... ]
}
- Draw the real geography of the region at a readable scale (north up): the coast, the main rivers and the places the plan names, placed where they really are relative to each other. Forces are tokens that move along their keys; arrows grow over their "at" window to show routes.
- Names are the only text: short place names in the video language, nothing else.`,
  LIBRARY: (lists: { pose: string; expression: string; outfit: string; head: string; hold: string; other: string; animals: string; animalPose: string; vehicles: string; buildings: string; props: string; trees: string; walls: string; scatter: string; effects: string }): string => `LIBRARY (use these words exactly; they are the things of this story's period)
person look: pose, expression, outfit, top, pants, boots, cape, robe, armor, hair, hairColor, beard, head, headColor, hold, itemColor, shield, shieldColor, quiver, backpack, bandage, wet, barefoot, build, region, view
  pose: ${lists.pose}
  expression: ${lists.expression}
  outfit: ${lists.outfit}
  head: ${lists.head}
  hold: ${lists.hold}
  ${lists.other}
  colours "#rrggbb" · true/false: wet barefoot quiver backpack cape robe
animal kinds: ${lists.animals}
  animal look: pose (${lists.animalPose}), color, saddle, blanket, armor
vehicle kinds: ${lists.vehicles}
building kinds: ${lists.buildings}
prop kinds: ${lists.props}
wall kinds (with from/to): ${lists.walls}
tree kinds: ${lists.trees}
scatter words: ${lists.scatter}
effect words: ${lists.effects}`,
  STICKERS: `STICKERS — only for an object that is central to the scene, that the library has no word for, AND that is big enough to see (at least 40 px): "fn": "sticker", "w"/"h" in px, held ("heldBy" + "hand", centred on that hand) or standing at x, y (bottom-centre). "code" = the BODY of function(c, w, h, t, p): Canvas 2D in a w×h box, outline #2a2522, flat colours, under 12 lines, multiplications written with *; t = seconds, p = progress 0..1 for its own small motion. No text. Otherwise leave the object out.`,
  COMPOSITION: `COMPOSITION
1. One clear subject. The focal item is big enough for the shot, inside the frame for the whole scene, in a clean area (nothing in front of it, nothing busy right behind its head), placed off-centre on a third with room in front of it in the direction it faces or moves.
2. Depth in three bands, each filled:
   - far band (just under the horizon, small and many): what says WHERE and WHEN — camps, wagons, tents of the right kind, towers, woods, herds, smoke columns, riders far off. Usually 4-8 items or groups spread across the width.
   - middle band: the setting the action happens in — set dressing that fits the place and the secondary groups.
   - near band: the focal subject plus 1-3 framing things at the edges (rocks, grass, a wagon or tree partly cut by the frame edge) that give the picture a front.
   The sky is never empty: clouds 2-5, smoke or birds where they fit. Inside, the room is furnished with what the place has.
3. Readable masses. Groups (crowds, troops, riders, herds) are one item with "group", with the real width their members need (see THE FRAME) and 1-3 rows. Keep separate groups apart from each other and from the focal subject; a leader (a king before his knights) is his own item at the head of the group, a little nearer or larger. Named people standing at the same depth do not overlap by more than a quarter of their width, unless the plan has them act on each other (holding, pulling, handing over); with no room side by side, put one a little further back.
4. Never cover what matters: no item drawn in front (larger y) may overlap the focal subject's box (x ± width/2, y−h … y) or hide a key object of the plan at any moment. Check at p = 0, 0.25, 0.5, 0.75, 1 with the widths above.
5. Movement that reads: keys follow the plan's MOTION and ACTION timing ("in the middle" ≈ 0.3-0.7, "at the end" ≥ 0.7); movers keep one direction; things enter or leave past the edges only when the plan says so. Prefer a few clear moves over many small ones.
6. Effects stay light: smoke, dust and mist are mood, not walls — haze at most 0.35, effects behind or beside the action, never on the subject.
7. Looks that are right for the period and the people: outfit, head, armor and hold as they were then and there (a padded coat for a common levy, mail for knights, steppe coats and fur hats for steppe riders…); hurt in one place = "bandage" there; a burning thing = "burning": true on it (no extra fire on the same spot). The library's "tent" is a striped pavilion (lords, tournaments); "campTent" is a plain canvas soldiers' tent.
8. Only real, visible things are items. An idea (an escape route, a gap, a direction, a target, a plan) is shown by how things are placed — an empty stretch, an opening ("gaps" in a wall), people heading somewhere — never by an item named after it.
9. The foreground's framing things at the bottom corners are natural ones only (rocks, bushes, grass, stumps, reeds), at most 18 % of the frame tall; everything else stands inside the frame.
10. No text, labels, arrows or camera moves (maps excepted, see MAP). The scene is always seen from eye level or a little above (no view from straight overhead).
Before answering, picture the frame at p = 0, 0.5 and 1: is the subject clear and uncovered, is every band filled, is everything right for the period, would a viewer understand the scene in one second? Fix it until the answer is yes.`,
  LANGUAGE: (language: string): string => `VIDEO LANGUAGE: ${language} (map place names and any other word shown are written in it)`,
  YEAR: (year?: number): string => (Number.isFinite(year) ? `STORY YEAR: ${year}` : "STORY YEAR: not stated (use the period the plan describes)"),
  SCENE: (shot?: string, kind?: string, devices?: string[]): string => `SCENE: shot "${shot || "medium"}", type "${kind || "here"}"${devices?.length ? `\nDEVICES: ${devices.join(" | ")}` : "\nDEVICES: none"}`,
  CAST: (looks: string): string => `NAMED PEOPLE keep these looks in every scene (give only what changes): ${looks}`,
  PLAN: "PLAN:\n",
  NOTE: "USER NOTE (must be followed): ",
  REVIEW: (problems: string[]): string => `A reviewer found these problems in your last spec for this scene; return the corrected spec: ${problems.join("; ")}`,
  REDO: (reason: string): string => `Your last answer could not be read (${reason}). Return the spec again as one valid JSON object.`,
} as const;
