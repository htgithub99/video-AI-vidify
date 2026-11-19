export const MOTION_SCENE_REVISE = {
  REVISION: 2,
  RIDER: 1.35,
  HORSES: ["horse", "warHorse", "packHorse", "pony", "mule", "donkey"],
  MOUNT_NEAR: 0.55,
  MOUNT_DEPTH: 0.08,
  MOUNT_POSES: ["rear", "buck", "kick", "fall", "lie", "graze", "drink", "eat"],
  MIN_SIDE: { THING: 0.015, KEY: 0.03, SHOT: 0.025 },
  LONG: 6,
  HOLE: "^(moat|ditch|trench|crater|hole|pit|canal|irrigationCanal|breach)$",
  PEOPLE_BAND: 0.12,
  PEOPLE_DEPTH: 0.25,
  SMALL_BUILD: ["child", "small", "tiny", "dwarf"],
  WET_SHORE: 0.03,
  WATER_MARGIN: 0.025,
  NEAR_BANK: 0.86,
  TREMBLE: { HZ: 4, AMP: 0.015, FULL: 1.2, FADE: 1.5, REST: 0.3, NEAR: 0.12, GROUP: 2 },
  SPOT: { MIN: 0.18, LEAST: 0.05, DIM: 0.3, NIGHT: 0.22, EDGE: 0.06, SOFT: 0.08 },
  BUBBLE: { FILL: 0.7, LEAST: 0.14, MAIN: ["person", "animal", "vehicle", "building"] },
  COUNT: { MAX: 10, ALL: 12, ROW: 5, ROUND: [1, 2, 5], SIZE: 0.066, WIDE: 0.4, COVER: 0.08 },
  FREE: { PAD: 0.04, STEP: 0.08, COVER: 0.02 },
  CROWD: { TONE: 0.08, OVERLAP: 0.3, DEPTH: 0.1, HAIR: ["#2a1e16", "#3b2a1e", "#4a3526", "#5c4632", "#6e5a44"] },
  DECK_SINK: -0.12,
  REPEAT: { CELL: 0.125, SAME: 0.55, FAR: 0.22 },
  FACTION: { NEAR: 70, MIX: 0.4, TINT: { steppe: "#8a3424", europe: "#2f5486", eastAsia: "#2e6a52", japan: "#3a3a6a", vietnam: "#7a5a1e", middleEast: "#8a6a20", southAsia: "#8a4a1a", africa: "#6a2a5a", americas: "#2a6a6a" } as Record<string, string> },
  DEBRIS: { KINDS: ["brokenWheel", "planks", "rubble", "debris", "splinters", "wreckage"], WRECK: "(^|_)(wrecked|wreck|broken|smashed|shattered|destroyed|ruined|crushed)(_|$)", NEAR: 1.5, DEPTH: 0.3 },
  REGION_KIND: { steppe: { campTent: "yurt", tent: "yurt", pavilionTent: "yurt" } },
  REGION_NEAR: 2.5,
  CROSS: { KINDS: ["river", "stream", "moat", "ravine", "road"], STAND: ["road"], BOATS: ["river", "stream", "moat"], SPAN: 1.35, X: 0.6, X_RANGE: [0.35, 0.65], WIDE: 0.24, WIDE_RANGE: [0.12, 0.35], BOTTOM: 0.36, GROW: 0.7, BASE: 0.45, BRIDGE_H: 0.2, NEAR: 0.3, FAR_MIN: 0.06, BEND: 0.12, EDGE: 0.8, FILE: 4, POSES: ["fight", "thrust", "block", "aim", "push", "raise"] },
  TRAIL: { KINDS: ["dustTrail", "dust", "splash"], WET: ["river", "stream", "lake", "sea", "pond", "swamp", "moat"], NEAR: 1.2, BEHIND: 0.45, R: 0.3, SPLASH: 0.55, MIN: 0.18, MAX: 0.45 },
  HURLED: ["boulder", "rock", "stonePile", "firePot"],
  HURL_MIN: 0.3,
  OPENING: "(^|_)(gap|breach|opening|hole_in)(_|$)",
  HELD: {
    KIND: {
      crossbow: ["crossbow"],
      bow: ["bow"],
      longbow: ["bow"],
      spear: ["spear", "pike"],
      lance: ["spear", "pike"],
      pike: ["pike", "spear"],
      sword: ["sword", "sabre", "katana"],
      sabre: ["sabre", "sword"],
      katana: ["katana", "sword"],
      axe: ["axe"],
      club: ["club"],
      torch: ["torch"],
      banner: ["flag"],
      warDrum: ["drum"],
      flag: ["flag"],
      standard: ["flag"],
      horn: ["horn"],
      warHorn: ["horn"],
      drum: ["drum"],
      shield: ["shield"],
      lantern: ["lantern"],
      musket: ["musket", "rifle"],
      rifle: ["rifle", "musket"],
      pistol: ["pistol"],
      gun: ["pistol", "rifle", "musket", "smg"],
      staff: ["staff"],
      hammer: ["hammer"],
      pickaxe: ["pickaxe"],
      shovel: ["shovel"],
      oar: ["oar"],
      scroll: ["scroll"],
      letter: ["letter"],
      book: ["book"],
      basket: ["basket"],
      bucket: ["bucket"],
      sack: ["sack"],
      bundle: ["bundle"],
      net: ["net"],
      sickle: ["sickle"],
      hoe: ["hoe"],
      pitchfork: ["pitchfork"],
    },
    WORN: { quiver: "quiver", backpack: "backpack", pack: "backpack", shield: "shield", cape: "cape" },
    PART: { bowstring: ["bow", "crossbow"], string: ["bow", "crossbow"], strap: ["bow", "crossbow"], sling: ["bow", "crossbow"] },
    NEAR_X: 0.6,
    NEAR_FOOT: 0.1,
    TIMES: [0, 0.5, 1],
  },
  WORDS: {
    WET: ["rain", "storm", "drench", "soak", "wade", "swim", "dripping", "flood", "splash", "downpour", "mưa", "ướt", "lội", "bơi", "sũng", "lluvia", "mojad", "pluie", "mouillé", "trempé", "regen", "nass", "chuva", "molhad"],
    SMASH: ["crush", "wreck", "smash", "shatter", "collapse", "crumble", "splinter", "burst apart", "caved in", "đập vỡ", "vỡ tan", "sập", "đổ sập", "tan tành", "destroz", "derrumb", "fracass", "effondr", "zerschmett", "einstürz"],
    APART: [
      "drop",
      "dropped",
      "drops",
      "slip",
      "slips",
      "slipped",
      "fall from",
      "falls from",
      "fell from",
      "throw",
      "throws",
      "threw",
      "thrown",
      "hand over",
      "hands over",
      "handed",
      "lay down",
      "lays down",
      "laid down",
      "on the ground",
      "spare",
      "second",
      "discard",
      "tossed",
      "đánh rơi",
      "rơi khỏi",
      "tuột",
      "ném",
      "trao",
      "đưa cho",
      "đặt xuống",
      "dưới đất",
      "dự phòng",
      "thứ hai",
      "suelta",
      "lanza",
      "tira",
      "laisse tomber",
      "jette",
    ],
    FORD: ["ford", "wade", "wading", "swim", "splash across", "plunge into the river", "cross the river", "crossing the river", "through the water", "lội", "vượt sông", "qua sông", "bơi qua", "vadear", "à gué"],
    ON_DECK: ["on the bridge", "on the span", "across the bridge", "onto the bridge", "on the crossing", "trên cầu", "giữa cầu", "lên cầu", "sobre el puente", "sur le pont"],
    ACROSS: ["across", "far bank", "far side", "other side", "opposite bank", "opposite shore", "beyond the river", "bên kia", "bờ bên kia", "phía bên kia", "bờ đối diện", "al otro lado", "de l'autre côté", "auf der anderen seite", "do outro lado"],
  },
} as const;
export const MOTION_SCENE_SPEC = {
  VERSION: 1,
  ENGINE: 5,
  WIDTH: 1280,
  HEIGHT: 720,
  FNS: ["person", "animal", "vehicle", "building", "prop", "tree", "wall", "bridge", "sticker"] as const,
  WALL_KINDS: ["wall", "palisade", "fence", "wagonFort", "gate", "sandbags", "barbedWire", "stakeRow", "earthwork"] as const,
  SCATTER: ["rock", "boulder", "grass", "stump", "log", "reeds", "flowers", "stuckArrow"] as const,
  EFFECTS: ["darkSmoke", "whiteSmoke", "smokeColumn", "dustTrail", "bonfire", "burning", "embers", "sandstorm", "heat", "rays", "steam", "sparks", "splash", "ripple", "shockwave", "crater", "glow", "fireflies", "leaves", "petals", "explosion"] as const,
  WATER: ["river", "lake", "sea", "stream", "pond", "swamp", "moat", "ravine", "road"] as const,
  DEVICES: ["thought", "inset", "emote", "count", "time", "sound", "speed", "impact", "spotlight"] as const,
  SIGNS: ["alarm", "question", "sweat", "sleep", "shiver", "anger"] as const,
  TIMES: ["day", "dawn", "dusk", "night"] as const,
  GROUNDS: ["dirt", "grass", "sand", "snow", "mud", "stone"] as const,
  ASPECT: { person: 0.42, animal: 1.35, vehicle: 1.7, building: 1.1, prop: 1, tree: 0.7, wall: 1, bridge: 4, sticker: 1, rider: 1.35 } as Record<string, number>,
  RIDER: MOTION_SCENE_REVISE.RIDER,
  PLACE_TYPES: ["city", "river", "sea", "region", "mountain"] as readonly string[],
  TERRAIN: { water: ["river", "lake", "sea", "water", "stream", "pond", "ford", "shore", "riverbank", "bank"], ground: ["road", "field", "ground", "plain", "plains", "mud", "grass", "earth", "dust"], sky: ["sky", "sun", "moon", "stars", "clouds", "horizon"] },
  DISTANCES: ["near", "mid", "far"] as readonly string[],
  SIZE_TOLERANCE: 1.6,
  SIZE_TOLERANCE_SMALL: 1.4,
  SIZE_TOLERANCE_LOOSE: 2.5,
  LOOSE: ["rock", "boulder", "log", "stump", "bush", "oak", "pine", "birch", "willow", "palm", "bamboo", "dead", "cypress", "fruit", "cherry", "banana", "banyan", "haystack", "woodpile", "campfire", "bonfirePit"] as readonly string[],
  DEPTH_BAND: 0.25,
  STICKER_MIN: 40,
  HAZE_MAX: 0.35,
  COVER_MAX: 0.2,
  SAMPLES: [0, 0.25, 0.5, 0.75, 1],
  HORIZON: [120, 560] as [number, number],
  NEAR: {
    pony: "horse",
    steed: "horse",
    charger: "warHorse",
    destrier: "warHorse",
    cattle: "ox",
    bullock: "ox",
    oxen: "ox",
    calf: "cow",
    ferryboat: "ferry",
    barge: "ferry",
    skiff: "rowboat",
    dinghy: "rowboat",
    cookfire: "campfire",
    firepit: "campfire",
    fire: "campfire",
    lance: "spear",
    standard: "banner",
    flag: "banner",
    pennant: "banner",
    canopy: "campTent",
    shelter: "campTent",
    pavilion: "tent",
    bush: "bush",
    shrub: "bush",
    stone: "rock",
    rocks: "rock",
    stones: "rock",
    palisades: "palisade",
    stockade: "palisade",
    rampart: "earthwork",
    ramparts: "earthwork",
    embankment: "earthwork",
    parapet: "wall",
    ditch: "ditch",
    moatDitch: "ditch",
    firepot: "firePot",
    firePots: "firePot",
    milestone: "milestone",
    warHorn: "horn",
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
  ISSUE: /^Bỏ "[^"]*": (?:kho không có|che )|^Cảnh thiếu:|^Cảnh dựng bằng code/,
  REVISE_LABELS: {
    ford: "người lội qua sông (có bọt nước)",
    trail: "bụi/bọt nước bám theo người đang chạy",
    deck: "người giao chiến đặt lên mặt cầu",
    side: "người dời về bờ của phe",
    region: "đồ đổi theo vùng của phe",
    wreck: "vật vỡ vẽ bằng trạng thái, mảnh rời trùng đã bỏ",
    gap: "khe hở đổi thành chỗ trống của tường",
    held: "vật trùng với đồ đang cầm đã bỏ",
    bridge: "cầu đã đặt bắc qua sông",
    mount: "ngựa thừa đã gộp",
    wet: "cờ ướt đã bỏ",
    tiny: "vật quá nhỏ đã bỏ",
    rider: "người cưỡi đã chỉnh cỡ",
    bank: "đưa lên bờ",
    water: "vật trong nước đã bỏ",
    time: "giờ đã sửa",
    bubble: "bong bóng đã bỏ",
    count: "ô đếm đã bỏ",
    spot: "spotlight đã bỏ",
    faction: "màu phe đã chỉnh",
    crowd: "nhóm chồng nhau đã giãn",
    person: "người đứng lệch cỡ đã chỉnh",
    shore: "dời dải nước cho có bờ gần",
    inset: "ô phóng to đã bỏ",
    vary: "đảo nền xa (cảnh giống cảnh trước)",
    story: "lời kể có đổ vỡ mà hình không có (chỉ báo)",
  } as Record<string, string>,
  SLOW_MS: 15000,
  SLOW_LOG: (id: string, ms: number): string => `Cảnh ${id} mở chậm: ${Math.round(ms / 1000)} s đến khung đầu tiên`,
  REVISE_LOG: (id: string, notes: [string, string][], labels: Record<string, string>): string =>
    `Cảnh ${id} – sửa khi dựng: ${Object.entries(notes.reduce((n, [k]) => ({ ...n, [k]: (n[k] || 0) + 1 }), {} as Record<string, number>))
      .map(([k, n]) => `${labels[k] || k} ${n}`)
      .join(", ")}`,
  FALLBACK_LOG: (id: string, tries: number): string => `Cảnh ${id}: AI không trả bản mô tả dùng được sau ${tries} lượt – dựng cảnh từ phân cảnh bằng code.`,
  PARSE_ERROR: "Bản mô tả cảnh không đọc được (không phải JSON hoặc thiếu items)",
  PAGE: (data: string): string =>
    `<!DOCTYPE html>\n<html data-artifact="motion-html-scene" data-motion-spec="1"><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#111;overflow:hidden}#motion-canvas{display:block;width:100vw;height:100vh}</style></head>\n<body><canvas id="motion-canvas"></canvas><script>window.__motionSpec=${data};</script></body></html>`,
  PAGE_MARK: /data-motion-spec="1"/,
  SPEC_DATA: /window\.__motionSpec=(\{[\s\S]*?\});<\/script>/,
} as const;
export const MOTION_SCENE_SPEC_PROMPT = {
  SIZES: "person 1×0.6, rider on a horse 1.35×1.4; the size of each animal, vehicle, building and wall is next to its name in the LIBRARY",
  SIZE_OF: (id: string, h: string, l: string): string => `${id}(${h}×${l})`,
  ROLE: `You are the scene director of an animated history video. You compose ONE scene as a precise SCENE SPEC (JSON) — with the same care and detail you would put into writing the scene's canvas code: exact pixel positions, sizes, timing and changes. A drawing engine draws every item from its library in the art style the user chose, so you never draw people, animals, vehicles, buildings or scenery yourself.

WHAT MATTERS MOST, in this order:
1. A viewer understands the scene at a glance: who it is about, where we are, what is happening.
2. It is beautiful: a clear, balanced picture with depth and a rich, detailed setting that shows the place and the time.
3. Never wrong: nothing in a wrong place, no extra limbs or stray objects, nothing from another period. Leaving something out is fine; showing it wrong is not.
4. The plan's details — but only those that read clearly on screen. Leave out what the library cannot show well or what would be too small to see (a cut on a knuckle, a cord in a fist, a frayed string): show the moment with what reads instead (pose, expression, the main object).

OUTPUT: one JSON object only (no prose, no comments).`,
  FRAME: (f: { w: number; h: number; lead: string; establish: boolean; groundLo: number; groundHi: number; sizes: string }): string => `THE FRAME
- ${f.w} x ${f.h} pixels, x to the right, y downward. No camera moves (the app frames the shot itself).
- "horizon": the y of the horizon line (usually ${Math.round(f.h * 0.32)}-${Math.round(f.h * 0.53)}). Ground below it, sky above.
- Every item stands on the ground at its ground point (x, y) = the middle of its feet/base, and "h" is its full height in pixels (a person: feet to top of head; a rider: hooves to the rider's head).
- Perspective: things further back stand higher (smaller y) and are smaller. Keep h proportional to (y − horizon): an item at y has h ≈ h_ref × (y − horizon) / (y_ref − horizon) compared with any other item.
- Real sizes against a standing person (height × person, then length × person): ${f.sizes}. Small things held in a hand are small (a whetstone 0.05, a cup 0.07, a dagger 0.18 of a person).
- Things in the air (birds, aircraft, a thrown stone, arrows) are not on the ground: give "dist": "near"|"mid"|"far" (their size is their real size × the focal person × 0.6 | 0.2 | 0.07) and keys for their way; an aircraft on the ground has "pose": "parked", a rocket on its pad "pose": "launch".
- Real widths for spacing (from h): standing person ≈ 0.6h (arms and held things), running person ≈ 0.9h, rider on horse ≈ 1.25h, horse ≈ 1.25h, wagon ≈ 1.7h, tent ≈ 2.4h, house ≈ 1.1h, tree ≈ 0.7h. A group needs width ≥ members per row × member width × 0.8 for people, × 0.95 for riders, animals, carts and tents; use more rows (each row ≈ 0.3 × h further back) before squeezing.
- THE MASTER SHOT (film shot scale): compose every scene as the whole stage seen from far enough back${f.establish ? ", here an extreme wide shot (establishing)" : ", a wide shot"}, whatever the plan's shot says (the app's camera cuts the closer shots out of it). The focal person stands ${f.lead} tall, whole from head to feet, ground point y ${f.groundLo}-${f.groundHi}; the setting shows all around. A scene inside a room (interior) is a little closer. A focal subject that is a thing (a ship, a plane, an animal, a building) is about a third of the frame along its longest side. Keep named people and the focal subject at least 8 % of the width from the side edges. The plan's shot (wide, medium, close) only tells the camera what to favour.`,
  SCHEMA: `SCHEMA
{
 "horizon": 300,
 "time": "day"|"dawn"|"dusk"|"night",
 "ground": "dirt"|"grass"|"sand"|"snow"|"mud"|"stone",
 "ridge": "none"|"low"|"hills",
 "interior": { "wall": "#rrggbb", "floor": "#rrggbb" },   // only for a scene inside a tent, house or hall (then no sky, ridge or water)
 "sky": { "clouds": 0-6, "birds": true|false, "sun": true|false, "sunX": px },
 "water": [ { "kind": "river"|"lake"|"sea"|"stream"|"moat"|"ravine"|"road", "y": top px, "h": band height px } ],
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
   "burning": true, "state": "broken"|"collapsed",
   "shape": "ring", "bank": "near"|"far",
   "w": px, "heldBy": <id>, "hand": "front"|"back", "code": "<canvas JS>"
 } ],
 "devices": [ { "kind": <device>, ... } ]
}
- keys: the item's track. "at" is scene progress 0..1. Numbers (x, y, h) glide smoothly from key to key; other values (pose, expression…) switch when their key starts. Before the first key the item holds that key; after the last key it holds it. A person or animal whose x changes runs (or walks with "pose": "walk") and turns to face its direction by itself. Things that only change pose/expression need keys too (e.g. { "at": 0.7, "expression": "worried" }).
- group: n alike members in a block "width" px wide, "rows" deep (each back row "depth" px higher). mount: the person rides that animal; h = the whole rider. on: sits on that item (the seat is put under the hip). from/to: walls, palisades, fences, wagonFort: their length along the ground at this y; gaps: open stretches in it (a breach, an opening in a wagon fort). bridge: a bridge across a river or ditch, its deck at this y, "x" its middle, "w" its length in px, "h" the drop from the deck to the water, look { "build": "wood"|"stone" }. z: draw order (default: by y, lower y first). focal: the scene's main subject, exactly one. fade: fades out between p0 and p1. at: only shown between p0 and p1. burning: the thing itself burns.
- Every id on the plan's REQUIRED line must be an item id (lower case, as written), except a thing held or worn by a person (written "held by <id>", or the same thing as a person's hold, quiver, shield or backpack): it is that person's hold or worn flag, never a second item.`,
  DEVICES: `DEVICES (only those the plan's DEVICES line lists)
- { "kind": "emote", "of": <person id>, "sign": "alarm"|"question"|"sweat"|"sleep"|"shiver"|"anger", "at": [p0, p1] } — a sign over that head.
- { "kind": "thought", "of": <person id>, "x": px, "y": px, "r": 70-130, "at": [p0, p1], "items": [ 1-3 small library items (x, y relative to the bubble centre, h 30-70), the first a person, animal, vehicle or building that reads at once ] } — a picture bubble rising from that head; it ends when its main item is gone.
- { "kind": "inset", "of": <person id>, "part": "head"|"hand", "r": 90-140, "zoom": 2-4, "at": [p0, p1] } — a round close-up drawn over the frame: "head" for the face's reaction; "hand" for the thing in their hand, which is their hold (only a small thing the library cannot hold, such as a whetstone, is a small prop item next to the hand). The app places it in a free corner.
- { "kind": "impact", "x": px, "y": px, "r": px, "at": [p0, p1] } — a burst where a blow, shot or stone lands.
- { "kind": "sound", "of": <id> or "x"/"y", "r": px, "facing": ±1, "at": [p0, p1] } — rings from a horn, drum or shout.
- { "kind": "speed", "of": <moving id>, "at": [p0, p1] } — streaks behind it.
- { "kind": "count", "x": px, "y": px, "w": px, "h": px, "groups": [ { "n": 300, "of": <person or group item id> }, { "n": 20000, "of": <id> } ] } — small figures drawn like each counted item, with the number under them, shown in a clear part of the sky, for numbers and odds; each group names the item it counts.
- { "kind": "time", "x": px, "y": px, "r": px, "body": "sun"|"moon" } — the sun or moon moving along the sky for time passing.
- { "kind": "spotlight", "of": <id>, "at": [p0, p1] } — light on the subject, the rest dimmed.`,
  MAP: `THIS SCENE IS A MAP. Return instead:
{
 "map": {
   "paper": "#rrggbb",
   "land": [ [[x,y],[x,y],...], ... ],        // coastlines / land outlines as closed point lists (8-30 points each), frame pixels
   "water": [ [[x,y],...], ... ],             // seas or lakes as closed point lists
   "rivers": [ [[x,y],...], ... ],            // rivers as open point lists, source to mouth
   "places": [ { "name": "<in the video language>", "type": "city"|"river"|"sea"|"region"|"mountain", "x": px, "y": px, "big": true|false } ],
   "forces": [ { "id": "<REQUIRED id>", "side": "<who>", "color": "#rrggbb", "x": px, "y": px, "size": 14-30, "keys": [ { "at": 0-1, "x": px, "y": px } ] } ],
   "arrows": [ { "from": [x,y], "to": [x,y], "color": "#rrggbb", "at": [p0, p1], "curve": -0.4..0.4 } ]
 },
 "items": [ map symbols only: { "id", "fn": "building", "kind": "mountain"|"town"|"castle"|"camp", "x", "y", "h": 20-60 } | { "id", "fn": "wall", "kind": "wagonFort"|"wall", "x", "y", "from", "to" } (a fort or wagon ring) | { "id", "fn": "vehicle", "kind": "ship", "x", "y", "h" } | { "id", "fn": "person", "kind": "troops", "x", "y", "h", "color" }; each may have "at": [p0, p1] (appears at p0) and "keys" ],
 "devices": [ ... only "count" or "time" if the plan lists them ... ]
}
- Draw the real geography of the region at a readable scale (north up): the coast, the main rivers and the places the plan names, placed where they really are relative to each other. Forces are tokens that move along their keys; arrows grow over their "at" window to show routes. A force that marches along an arrow has the arrow's colour and starts at its tail: it rides the arrow's head as it grows.
- A river's or a sea's name is a place of type "river"/"sea" put on the water (it is written along it, no dot); towns and battles are "city" (a dot).
- Names are the only text: short place names in the video language, nothing else.`,
  LIBRARY: (lists: { pose: string; expression: string; outfit: string; head: string; hold: string; other: string; animals: string; animalPose: string; vehicles: string; buildings: string; props: string; flying: string; trees: string; walls: string; scatter: string; effects: string }): string => `LIBRARY (use these words exactly; they are the things of this story's period)
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
  in flight (anything shot or thrown: give keys from where it leaves to where it goes; it points along its way): ${lists.flying}
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
11. Nothing the narration does not need: no extra people, animals, things or effects. A rider is one item with "mount" (never a separate saddled animal at the same spot); a rider's h is ${MOTION_SCENE_REVISE.RIDER} times a person standing at that depth. Long thin things (spears, chains, strings, poles, oars) are given by their length. A broken thing is that thing with "state" (no loose wheels or planks beside it as its wreck). A crossing (a bridge over a river, moat, ravine or road) is one band in "water" of that kind plus the bridge item on it; the app turns the band to run into the distance under the bridge and keeps each side on its own bank for the whole place.
12. Flags mean exactly this: "wet" only in rain or snow or for someone in or just out of water (mud, sweat or damp air are not wet; mud is "dirty"); "state": "broken" or "collapsed" only for a thing the narration says is smashed or fallen; "shape": "ring" for a wall or wagon fort that closes round a camp. With water across the frame, everyone stands on a bank, given as "bank": "near" (below the water, the default) or "far" (only when the narration puts that item across the water).
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
