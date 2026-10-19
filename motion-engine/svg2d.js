(function (root) {
  "use strict";
  const ME = root.MotionEngine;
  if (!ME || !ME.registerTemplate) return;
  const K = {
    TEMPLATE: "gen2d",
    NAME: "AI 2D vector scene",
    CATEGORY: "scene",
    DESCRIPTION: "Flat 2D vector render of the AI scene graph with 2D rigs",
    CTX2D: "2d",
    BLACK: "#000000",
    WHITE: "#ffffff",
    OUTLINE: "#17161b",
    ROUND: "round",
    SCREEN: "screen",
    LIGHTER: "lighter",
    SOURCE_OVER: "source-over",
    MULTIPLY: "multiply",
    OBJECT: "object",
    STRING: "string",
    NUMBER: "number",
    NIGHT: "night",
    DUSK: "dusk",
    DAWN: "dawn",
    INTERIOR: "interior",
    SHOT: { WIDE: "wide", MEDIUM: "medium", CLOSE: "close", EXTREME: "extreme_close", INSERT: "insert", OVER: "over_shoulder", AERIAL: "aerial", HIGH: "high", LOW: "low" },
    MOVE: { IN: "dolly_in", OUT: "dolly_out", ORBIT_L: "orbit_left", ORBIT_R: "orbit_right", PAN_L: "pan_left", PAN_R: "pan_right", PUSH: "push_in", PULL: "pull_out", CRANE_UP: "crane_up", CRANE_DOWN: "crane_down", SHAKE: "shake" },
    ACTION: { WALK: "walk", RUN: "run", TALK: "talk", SIT: "sit", SIT_TALK: "sit_talk", KNEEL: "kneel", FEAR: "fear", CRY: "cry", POINT: "point", WAVE: "wave", BOW: "bow", PRAY: "pray", LIE: "lie", SLEEP: "sleep", LAUGH: "laugh", SHOUT: "shout", THINK: "think", LOOK: "look_around", FALL: "fall", CARRY: "carry", DIG: "dig", DRINK: "drink", EAT: "eat", READ: "read", WRITE: "write", HOLD: "hold", RAISE: "raise_hands", GIVE: "give", REACH: "reach", COVER: "cover_mouth", CROSSED: "arms_crossed", BEHIND: "hands_behind", BELLY: "hold_belly", HUG: "hug", SHAKE: "shake_head", NOD: "nod", SUPPORT: "support", IDLE: "idle" },
    ACTION_ALIAS: [[/raise|hands_up|surrender|cheer|celebrat/, "raise_hands"], [/hold|carry|give|offer|show|present|grip|clutch|hand_over|receive|take/, "hold"], [/point|gesture|indicate/, "point"], [/pray|bow|kowtow|worship|incense/, "bow"], [/scare|fear|trembl|shiver|panic|flinch|recoil|startl|shock/, "fear"], [/cry|sob|weep|mourn|griev/, "cry"], [/kneel|crouch|squat/, "kneel"], [/sit|seat/, "sit"], [/lie|lying|collapse|faint|dead/, "lie"], [/fall|trip/, "fall"], [/run|flee|rush|chase/, "run"], [/walk|step|approach|enter|leave|exit|go_/, "walk"], [/look|search|glance|peer|watch|stare/, "look_around"], [/think|ponder|wonder|recall|remember/, "think"], [/wave|greet|beckon/, "wave"], [/laugh|giggl/, "laugh"], [/shout|yell|scream|call/, "shout"], [/dig|shovel/, "dig"], [/talk|speak|say|tell|explain|whisper|ask|answer|argu/, "talk"]],
    SMOOTH: { ATTACK: 0.3, RELEASE: 0.5, SWITCH: 0.35 },
    VIG: {
      TAKE_POCKET: "pocket",
      TAKE_FLOOR: "floor",
      TAKE_POCKET_RE: /túi|móc ra|pocket/,
      TAKE_FLOOR_RE: /nhặt|lượm|dưới đất|trên đất|dưới nền|trên nền|dưới sàn|trên sàn|cúi xuống|pick up|picked up|from the floor|from the ground/,
      MIN_SENT: 1.6,
      END_RE: /[.!?…]["”']?\s*$/,
      DIALOGUE_RE: /[:"“”]/,
      WEAK: ["time", "bed", "gate", "silhouette", "focus", "doorway", "baby", "meal"],
      RULES: [
        ["grab", /(bàn tay|cánh tay)[^.]{0,40}(nắm chặt|túm|chụp|níu|kéo)[^.]{0,25}(cổ chân|chân|tay)|grab/u],
        ["match", "đánh diêm|quẹt diêm|bật lửa|strike a match"],
        ["give", /(đặt|nhét|trao|đưa|dúi|gửi|trả)[^.]{0,30}(vào tay|vào lòng)|(^|[^\p{L}])trao(?=[^\p{L}]|$)|hand(ed)? (it )?over/u],
        ["burn", "đốt|thiêu|bốc cháy|ngọn lửa|burn|burned"],
        ["take", "rút|nhặt|lấy|giật lấy|cầm lên|móc ra"],
        ["wound", "vết cứa|vết thương|vết cắt|rỉ máu|chảy máu|wound"],
        ["footprints", "vết chân|dấu chân|footprint|footprints"],
        ["incense", "nhang|nén hương|hương trầm|incense"],
        ["bell", "chuông|bell"],
        ["read", /(mở|đọc|giở)[^.]{0,25}(giấy|kinh|sách|thư|sớ)|(^|[^\p{L}])read(?=[^\p{L}]|$)/u],
        ["silhouette", /bóng (ông|bà|người|ai)|có người đứng|ai đó đứng|shadow/u],
        ["climb", "leo|trèo|bước lên|lên núi|climb|climbed"],
        ["altar", "bàn thờ|di ảnh|bàn phật|altar"],
        ["hold", "trên tay|tay tôi|cầm|nắm|ôm|giữ|giấu|trong túi|túi ngực|trước ngực|hold|holding"],
        ["down", "nằm|xuất hiện|rơi|trước cửa|bậc cửa|dưới đất|úp|ngửa|appear|appeared"],
        ["baby", "sinh con|con trai|con gái|em bé|đứa nhỏ|đứa bé|thằng cu|baby"],
        ["bed", "nằm|ngủ|mê man|giường|thức trắng|kiệt sức|sleep"],
        ["meal", "ăn cơm|mâm cơm|bữa cơm|meal"],
        ["doorway", "tiếng gọi|gọi tên|tiếng ai|có tiếng"],
        ["gate", "cổng|bậc đá|bậc thang|gate|stairs"],
        ["time", "giờ sáng|nửa đêm|gà gáy|canh ba|đêm thứ|đêm đầu|đêm đó|midnight"],
      ],
      NEED_OBJ: ["take", "hold", "down", "give"],
      TIER_A: ["grab", "match", "give", "burn", "take", "wound", "footprints", "read", "silhouette", "climb"],
      TIER_B: ["hold", "down"],
      CYCLE: ["medium", "wide", "close"],
      SPEAKER_SHOTS: ["close", "medium"],
      SELF: "toi|minh|i|me|my",
      DIGITS_RE: /^\d+$/,
      MARKS_RE: /[\u0300-\u036f]/g,
      DSTROKE_RE: /đ/g,
      DSTROKE_UP_RE: /Đ/g,
      ASCII_L: "(^|[^A-Za-z])",
      ASCII_R: "($|[^A-Za-z])",
      DEFAULT_OBJ: "card",
      NFD: "NFD",
      OBJECTS: [
        ["card", "lá bài|lá tướng|lá tốt|quân bài|lá đỏ|lá đen|bài|card|cards"],
        ["beads", "chuỗi|tràng hạt|beads"],
        ["book", "cuốn kinh|quyển|sách|kinh|book"],
        ["paper", "tờ giấy|giấy|bùa|lá thư|thư|sớ|paper|letter"],
        ["incense", "nhang|nén hương|incense"],
        ["candle", "nến|đèn cầy|candle"],
        ["lamp", "đèn|lamp|lantern"],
        ["bell", "chuông|bell"],
        ["bowl", "cơm|bát|chén|bowl"],
        ["key", "chìa khóa|chìa khoá|key"],
        ["knife", "dao|knife"],
        ["money", "tiền|đồng xu|money|coin"],
        ["flower", "hoa|flower"],
        ["portrait", "di ảnh|ảnh thờ|tấm ảnh|portrait|photo"],
      ],
      COLORS: [
        ["#b8433a", "đỏ|red"],
        ["#1d1b20", "đen|black"],
        ["#ece8df", "trắng|phai|white"],
        ["#d9b23c", "vàng|yellow|gold"],
      ],
      MODS: { cold: "lạnh|cold", fade: "phai|bạc màu|trắng tinh|fade", shake: "giật|quẫy|run lên|shake", warm: "ấm|nóng|warm", out: "tắt|tắt ngấm", back: "rút ngược|lấy lại|rút ra|rút khỏi", down: "úp|face down", up: "ngửa|face up", dawn: "gà gáy|bình minh|dawn" },
      NUMBERS: { một: 1, hai: 2, ba: 3, bốn: 4, năm: 5, sáu: 6, bảy: 7, tám: 8, chín: 9, mười: 10 },
      COUNT_RE: /(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s+(lá|tấm|cái|cây|nén|vết|quân)/u,
      WORD_L: "(^|[^\\p{L}])(",
      WORD_R: ")(?=[^\\p{L}]|$)",
      MAX_COUNT: 9,
      BG: { night: ["#0b0f1a", "#1b2232"], day: ["#bfb6a2", "#8f846f"], interior: ["#1d1915", "#33291f"] },
      SPOT: "rgba(255,236,200,0.16)",
      SKIN: "#eef0f2",
      SLEEVE: "#6a6f78",
      SLEEVE_B: "#7a5c43",
      GHOST_HAND: "#9aa0a8",
      SAND: "#c8b48a",
      BRONZE: "#9a7a3a",
      WOOD: "#5a3b26",
      PAPER: "#efe3c4",
      FLAME: "#ffb347",
      BLOOD: "#a3222a",
      FROST: "#a8c8ff",
      GLOW: "#ffcf7a",
      DOOR: "#100d0b",
      ANKLE_RE: /chân|ankle|foot|leg/,
      UNDERSCORE_RE: /_/g,
      UNDERSCORE: "_",
      GHOST_RE: /lạnh|cát|ma|ghost|cold|vong/,
      EYE: "#141318",
      BOWL: "bowl",
    },
    HOLD_BOOST: 1.7,
    UNDEF: "undefined",
    FUNCTION: "function",
    INFO_DEFAULT: { skin: "#eef0f2", top: "#5a6068", bottom: null, shoes: null, hair: null, hairKind: null, beard: null, hat: null, hatKind: null, glasses: false, scarf: null, skirt: false, buttons: false, eye: "#141318", legs: false, arms: true, animal: false, brows: false, height: 1.6, template: false },
    BG: { DUR: 6, ZOOM0: 1.03, ZOOM1: 0.05, NIGHT_FILL: "rgba(18,24,40,0.45)" },
    BOARD: {
      NFC: "NFC",
      NORM_RE: /[^\p{L}\p{N}]+/gu,
      SENT_RE: /[^.!?…]+[.!?…]+["”']?|[^.!?…]+$/g,
      SVG_URL: "data:image/svg+xml;charset=utf-8,",
      SVG_MIME: "image/svg+xml",
      XMLNS: "xmlns",
      SVG_NS: "http://www.w3.org/2000/svg",
      FG_SEL: "#fg",
      PEOPLE: "people",
      CUTAWAY: "cutaway",
      FOCUS: "focus",
      UP: "up",
      DOWN: "down",
      LIT: "lit",
      PROP_BOX: 512,
      CUT_FLOOR: 0.78,
      SWAY: 2.5,
      CODE_OBJECTS: ["card", "paper", "book", "beads", "incense", "candle", "lamp", "bell", "bowl", "portrait"],
      SET_W: 1920,
      SET_H: 1080,
      SET_SPREAD: 0.8,
      SET_DEPTH: 0.03,
      INTERACT: ["give", "hug", "support", "reach"],
      FOOT_MAX: 0.9,
      INTERACT_GAP: 0.8,
      HOLD_POSES: ["hold", "give", "read"],
      LIGHT_NIGHT: "night",
      LIGHT_DAY: "day",
      LIGHT_DAWN: "dawn",
      LIGHT_LAMP: "lamp",
      LEFT: "left",
      RIGHT: "right",
      FRONT: "front",
      BACK: "back",
      MULTIPLY: "multiply",
      DARK_RE: /night|dark|midnight/,
    },
    ARM_CROSS: 12,
    LIE: { ACTIONS: /^(lie|sleep|fall)$/, BOX_W: 1.3, BOX_H: 0.42, BED_W: 0.66, BED_H: 0.14, BLANKET_H: 0.2, PILLOW: 0.16 },
    ARM_SPLIT: 0.5,
    POSE2: {
      hold_belly: [8, -75, -8, 75, 4, null],
      hug: [-55, -25, -60, -20, null, 0.6],
      arms_crossed: [10, -105, -10, 105, null, null],
      pray: [12, -120, -12, 120, 6, 0.4],
      cover_mouth: [8, 0, 0, 160, 4, null],
      think: [8, 0, -10, 150, -6, null],
      hold: [6, 0, -15, -55, null, null],
      give: [6, 0, -62, -18, null, null],
      reach: [-10, 0, -72, 0, null, null],
      support: [6, 0, -50, -22, null, null],
      read: [10, -80, -10, 80, 8, null],
      hands_behind: [14, 0, -14, 0, null, null],
    },
    ACTS: [
      ["hold_belly", "ôm bụng|xoa bụng|tay ôm bụng|ôm cái bụng|hold her belly"],
      ["hug", "ôm chầm|ôm chặt|ôm lấy|ôm con|ôm vợ|ôm mẹ|ôm bà|hug|hugged"],
      ["shake_head", "lắc đầu|shook (his|her) head|shake (his|her) head"],
      ["nod", "gật đầu|nod|nodded"],
      ["support", "dìu|đỡ|support"],
      ["kneel", "quỳ|kneel|knelt"],
      ["bow", "lạy|vái|cúi đầu|cúi lạy|chắp tay|khấn|cầu nguyện|hôn lên|bow|pray"],
      ["raise_hands", "giơ tay|giơ hai tay|mừng rỡ|reo lên|cheer"],
      ["wave", "vẫy|gọi to|vẫy tay|wave"],
      ["point", "chỉ tay|chỉ vào|chỉ ra|trỏ|point"],
      ["cry", "khóc|rên rỉ|nức nở|sụt sùi|cry|sob"],
      ["fear", "hoảng|giật mình|rùng mình|run rẩy|run lên|thót tim|sợ hãi|scared|terrified"],
      ["shout", "hét|quát|gào|thét|scream|shout"],
      ["laugh", "cười lớn|cười ha|bật cười|laugh"],
      ["sit", "ngồi|sit|sat"],
      ["lie", "nằm|mê man|ngủ say|lie|lay"],
      ["think", "suy nghĩ|nghĩ ngợi|nhớ lại|think|ponder"],
      ["look_around", "nhìn quanh|ngó|liếc|nhìn|look|stare"],
      ["talk", "hỏi|nói|bảo|thều thào|đáp|dặn|kể|ask|say|said|tell"],
    ],
    EXPRS: [
      ["happy", "mỉm cười|cười|vui|mừng|smile|happy"],
      ["sad", "thở dài|buồn|đau|khổ|kiệt sức|sigh|sad"],
      ["scared", "sợ|hoảng|run|lạnh buốt|scared|afraid"],
    ],
    SELF_KEY: "@self",
    STRONG_ACTS: ["raise_hands", "point", "fear", "cry", "wave", "bow", "kneel", "hold", "shout"],
    FRONT_BOW: { DIP: 0.05, EYE: 0.35, ARM: 12, ELBOW: 120 },
    HELD_COLOR: "#e8dcc0",
    PROP_SMALL: 0.5,
    PROP_BOOST: 1.6,
    COLOR_WORDS: [[/red|(^|[_ ])do([_ ]|$)/, "#b8433a"], [/white|trang/, "#ece8df"], [/black|(^|[_ ])den([_ ]|$)/, "#1d1b20"], [/gold|yellow|vang/, "#d6a93a"], [/green|xanh/, "#4f7d4a"], [/blue/, "#3d6f9a"], [/brown|wood|nau/, "#7a5236"], [/paper|card|giay/, "#e8dcc0"]],
    RE: {
      FEAR: /scar|fear|shock|surpris|terr/,
      SLEEPY: /sleep|tired|drows/,
      ANGRY: /angry|anger|mad|furious/,
      SAD: /sad|cry|grief|sorrow/,
      HAPPY: /happy|smil|joy|laugh/,
      PATTERN_TILE: /brick|tile|stone|paving|cobble|gach/,
      HAIR: /^hair/,
      HAIR_LONG: /hair_long|hair_bun|ponytail|braid/,
      HAIR_SPIKE: /hair_spike/,
      HAIR_SIDE: /hair_side/,
      HAT: /(hat|helmet|cap|turban|khan|non_la|conical)/,
      CONE_HAT: /(conical|non_la)/,
      BEARD: /beard|mustache/,
      GLASSES: /glasses/,
      SCARF: /scarf/,
      SKIRT: /skirt|dress/,
      BUTTON: /button/,
      SKIN: /^skin/,
      TOP: /^top/,
      BOTTOM: /^bottom/,
      SHOES: /shoe|boot|sandal/,
      EYES: /^eye|pupil/,
      GHOST: /(ghost|spirit|phantom|vong|hon_ma|oan_hon|linh_hon|bong_ma)/,
      BG_NIGHT: /night|dark|midnight/,
      ANIMAL: /^(tail|leg_fl|leg_fr|leg_bl|leg_br|fur|paw|muzzle)/,
      SWAY: /(bamboo|tree|palm|leaf|leaves|grass|reed|bush|curtain|flag|banner|lantern_string|vine|willow|rice)/,
      FLICKER: /(fire|flame|candle|lamp|lantern|torch|hearth|stove|incense|campfire|oil)/,
      SPEAKING: /^(talk|sit_talk|shout|explain|laugh)$/,
      GROUND: /(ground|floor|yard|courtyard|terrain|lawn|field|road|street|pavement|plaza|deck|san_|nen_)/,
      FLAME: /(flame|fire|candle|torch|lua|nen_|ngon)/,
      SMOKE: /(incense|joss|nhang|huong|smoke|khoi)/,
      PERSON: /(character|silhouette|person|people|figure|human|mannequin|actor|crowd_member)/,
    },
    PITCH_DEFAULT: 14,
    CAMERA_DEFAULT: { pos: [0, 1.6, 8], target: [0, 1, 0], fov: 40 },
    VIRTUAL_H: 1080,
    NEAR: 0.15,
    NEAR_CULL: 1.2,
    FOG_FAR: 60,
    MIN_OUTLINE_AREA: 140,
    GROUND_FAR: -70,
    STAR_COUNT: 90,
    EXPOSURE: { night: 0.8, dusk: 0.92, dawn: 0.95, overcast: 0.95, interior: 0.95, interior_dark: 0.75, day: 1 },
    CHAR_EXPOSURE_MIN: 0.86,
    SKY: { day: ["#5b8fd6", "#cfe0f2"], dusk: ["#2f355c", "#e39a6a"], dawn: ["#5a6fa8", "#f2c7a0"], night: ["#060a16", "#1d2a3c"], overcast: ["#7d8893", "#c9ced3"], interior: ["#1a1612", "#2a2420"], interior_dark: ["#07080b", "#121418"] },
    DEFAULT_METRICS: { headAspect: 1, bodyToHead: 1.5, bodyWidth: 0.95, eyeHeight: 0.25, eyeWidth: 0.11, eyeGap: 0.36, eyeY: -0.05, mouthHeight: 0.12, mouthWidth: 0.08, mouthY: -0.24, armThickness: 0.17, armLength: 0.6, outlinePx: 3, bodyShape: "dome" },
    PROFILE: { dome: [[-0.5, 0], [-0.5, 0.45], [-0.47, 0.7], [-0.4, 0.85], [-0.28, 0.95], [-0.14, 0.99], [0, 1]], capsule: [[-0.5, 0], [-0.5, 0.75], [-0.46, 0.86], [-0.35, 0.95], [-0.19, 0.99], [0, 1]], box: [[-0.5, 0], [-0.5, 0.94], [-0.46, 1], [0, 1]], trapezoid: [[-0.5, 0], [-0.36, 0.94], [-0.31, 1], [0, 1]] },
    HEAD_DIAMETER: 0.72,
    HEAD_OVERLAP: 0.12,
    LEG_RATIO: 0.62,
    FRAME: { close: 4.2, extreme_close: 2.6, medium: 1.3, over_shoulder: 1.25, insert: 2.2 },
    SAFE: 0.86,
    CUES: { SHAKE: /^(stinger|thunder|explosion|impact)$/, FLASH: /^(thunder|stinger)$/ },
    INTERIOR_DARK: "interior_dark",
    BACK_HEAD: "#2b2622",
    STAGE: { HORIZON_OUT: 0.56, HORIZON_IN: 0.6, BOTTOM: 1.02, FIGURE: 0.4, FIGURE_M: 1.6, BACK_SCALE: 0.78, FAR_MIN: 0.3, FAR_FALLOFF: 8, NEAR_PAD: 1.2, BACK_PAD: 1.2, FLAT: 0.08, FLAT_TOP: 0.35, GROUND_SPAN: 12, NEAR_CULL: 1.5, DECAL_BIAS: 50, FAR_NODE: 6 },
    GROUND: { EXTERIOR: "#7a4a3a", INTERIOR: "#5a4636", PLANKS: "planks", EARTH: "earth", TILE: 0.9, SPAN: 24, LINE_DARK: 0.78, LINE_W: 2, SPECKS: 260, HORIZON_SHADE: 6 },
    GRADE: { night: "#5b6a94", interior_dark: "#6a7088", dusk: "#c9a9a0", dawn: "#d9c8c0", overcast: "#c8ccd2" },
    HILLS: 2,
    HILL_DAY: "#4f6b45",
    HILL_NIGHT: "#1d2733",
    DUST: 40,
    SMOKE_RISE: 70,
    LIGHT_SPREAD: 0.35,
    LIGHT_GAIN: 0.14,
    FOG_GAIN: 1.2,
    HEADROOM: 0.75,
    GROUP_SPAN: 2.2,
    PUSH: 0.06,
    DRIFT: 0.025,
    PAN: 0.04,
    KEEP: 0.9,
    EDGE: 0.04,
    FRAME_MIN: 0.14,
    PROP_OUTLINE: 0.8,
    ACTOR_TINT: 0.88,
    LINE_ALPHA: 0.45,
    SPACING: 0.95,
    BIG_ITEM: 1.6,
    FOREGROUND: 1.2,
    LOWER_BODY: 0.22,
  };
  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const noise = (t, seed) => {
    const i = Math.floor(t),
      f = t - i;
    return lerp(hash(i + seed * 101), hash(i + 1 + seed * 101), f * f * (3 - 2 * f)) * 2 - 1;
  };
  const seedOf = (s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
    return h / 100003;
  };
  const num = (v, d) => (typeof v === K.NUMBER && isFinite(v) ? v : d);
  const vec = (v, d) => (Array.isArray(v) && v.length >= 3 ? [num(v[0], d[0]), num(v[1], d[1]), num(v[2], d[2])] : d.slice());

  const hexRgb = (hex) => {
    let h = String(hex || K.BLACK).replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgbHex = (c) => "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  const mixHex = (a, b, k) => {
    const x = hexRgb(a),
      y = hexRgb(b);
    return rgbHex([lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k)]);
  };
  const scaleHex = (a, k) => rgbHex(hexRgb(a).map((v) => v * k));
  const rgba = (hex, a) => {
    const c = hexRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  };
  const lum = (hex) => {
    const c = hexRgb(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  };

  const M = {
    ident: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul: (a, b) => {
      const o = new Array(16);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
      return o;
    },
    compose: (pos, rot, scl) => {
      const [x, y, z] = rot.map((v) => v * DEG);
      const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
      const ae = a * e, af = a * f, be = b * e, bf = b * f;
      const R = [c * e, -c * f, d, af + be * d, ae - bf * d, -b * c, bf - ae * d, be + af * d, a * c];
      const s = scl;
      return [R[0] * s[0], R[1] * s[1], R[2] * s[2], pos[0], R[3] * s[0], R[4] * s[1], R[5] * s[2], pos[1], R[6] * s[0], R[7] * s[1], R[8] * s[2], pos[2], 0, 0, 0, 1];
    },
    apply: (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]],
  };
  const nodeMatrix = (n) => {
    const s = n.scale;
    const scl = Array.isArray(s) ? [num(s[0], 1), num(s[1], 1), num(s[2], 1)] : [num(s, 1), num(s, 1), num(s, 1)];
    return M.compose(vec(n.pos, [0, 0, 0]), vec(n.rot, [0, 0, 0]), scl);
  };

  const ring = (r, y, n, plane) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(plane ? [Math.cos(a) * r, Math.sin(a) * r, y] : [Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return out;
  };
  const samples = (n) => {
    switch (n.shape) {
      case "box": {
        const [w, h, d] = vec(n.size, [1, 1, 1]).map((v) => v / 2);
        const pts = [];
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * w, sy * h, sz * d]);
        return { kind: "poly", pts };
      }
      case "cylinder": {
        const h = num(n.height, 1) / 2,
          rt = num(n.radiusTop, num(n.radius, 0.5)),
          rb = num(n.radiusBottom, num(n.radius, 0.5));
        return { kind: "poly", pts: ring(rt, h, 14).concat(ring(rb, -h, 14)) };
      }
      case "cone": {
        const h = num(n.height, 1) / 2;
        return { kind: "poly", pts: ring(num(n.radius, 0.5), -h, 14).concat([[0, h, 0]]) };
      }
      case "sphere": {
        const r = num(n.radius, 0.5),
          pts = [];
        for (let i = 0; i <= 6; i++) {
          const phi = (i / 6) * Math.PI;
          for (const p of ring(r * Math.sin(phi), r * Math.cos(phi), 12)) pts.push(p);
        }
        return { kind: "sphere", pts, r };
      }
      case "disc":
        return { kind: "poly", pts: ring(num(n.radius, 0.5), 0, 20, true) };
      case "plane": {
        const s = Array.isArray(n.size) ? n.size : [1, 1];
        const w = num(s[0], 1) / 2,
          h = num(s[1], 1) / 2;
        return { kind: "poly", pts: [[-w, -h, 0], [w, -h, 0], [w, h, 0], [-w, h, 0]] };
      }
      case "extrude": {
        const pts2 = Array.isArray(n.points) ? n.points.filter((p) => Array.isArray(p)) : [];
        const d = num(n.depth, 0.1);
        return { kind: "poly", pts: pts2.map((p) => [num(p[0], 0), num(p[1], 0), 0]).concat(pts2.map((p) => [num(p[0], 0), num(p[1], 0), d])) };
      }
      case "torus":
        return { kind: "ring", pts: ring(num(n.radius, 0.5), 0, 24, true), width: num(n.tube, 0.05) * 2 };
      case "stroke": {
        const pts2 = Array.isArray(n.points) ? n.points.filter((p) => Array.isArray(p)) : [];
        return { kind: "line", pts: pts2.map((p) => [num(p[0], 0), num(p[1], 0), num(p[2], 0)]), width: num(n.width, 0.02) };
      }
      default:
        return null;
    }
  };
  const hull = (pts) => {
    if (pts.length < 3) return pts;
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    up.pop();
    lo.pop();
    return lo.concat(up);
  };
  const area = (poly) => {
    let a = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a / 2);
  };

  function makeStage(L, VW, VH, actorZs) {
    const interior = !!(L && L.interior);
    const marks = (L && L.marks) || {};
    const stage = (L && L.stage) || {};
    const sc = Array.isArray(stage.center) ? stage.center : [0, 0];
    const ss = Array.isArray(stage.size) ? stage.size : [6, 6];
    const zs = Object.values(marks).filter((m) => Array.isArray(m)).map((m) => num(m[1], 0)).concat(actorZs);
    const zNear = Math.max.apply(null, [num(sc[1], 0) + num(ss[1], 6) / 2].concat(zs)) + K.STAGE.NEAR_PAD;
    const zBack = Math.min.apply(null, [num(sc[1], 0) - num(ss[1], 6) / 2].concat(zs)) - K.STAGE.BACK_PAD;
    const depth = Math.max(1, zNear - zBack);
    const horizon = VH * (interior ? K.STAGE.HORIZON_IN : K.STAGE.HORIZON_OUT);
    const bottom = VH * K.STAGE.BOTTOM;
    const S0 = (VH * K.STAGE.FIGURE) / K.STAGE.FIGURE_M;
    const cx = num(sc[0], 0);
    const rel = (z) => (z - zBack) / depth;
    const groundY = (z) => (z >= zBack ? lerp(horizon, bottom, clamp(rel(z), 0, 1.4)) : horizon);
    const scaleAt = (z) => (z >= zBack ? lerp(K.STAGE.BACK_SCALE, 1, clamp(rel(z), 0, 1.4)) : K.STAGE.BACK_SCALE * (K.STAGE.FAR_MIN + (1 - K.STAGE.FAR_MIN) * Math.exp((z - zBack) / K.STAGE.FAR_FALLOFF)));
    return {
      interior,
      zNear,
      zBack,
      horizon,
      bottom,
      S0,
      cx,
      VW,
      VH,
      groundY,
      scaleAt,
      map(x, y, z) {
        const s = scaleAt(z) * S0;
        return [VW / 2 + (x - cx) * s, groundY(z) - y * s];
      },
      pxPerMeter(z) {
        return scaleAt(z) * S0;
      },
    };
  }

  function buildLocation(L, stage, castKeys, grade, extra) {
    const hide = new Set(((extra && extra.hide) || []).map((h) => String(h)));
    const gradeHex = (c) => {
      if (!grade) return c;
      const a = hexRgb(c), b = hexRgb(grade);
      return rgbHex([(a[0] * b[0]) / 255, (a[1] * b[1]) / 255, (a[2] * b[2]) / 255]);
    };
    const castRes = castKeys.filter((key) => /^[a-z0-9_]+$/.test(key)).map((key) => new RegExp("(^|[^a-z0-9])" + key + "($|[^a-z0-9])"));
    const items = [], lights = [], named = {};
    const mats = (L && L.materials) || {};
    const defs = (L && L.defs) || {};
    const fog = (L && L.fog) || null;
    const colorOf = (mat) => {
      const m = typeof mat === K.STRING ? mats[mat] || {} : mat && typeof mat === K.OBJECT ? mat : {};
      return { color: m.color || "#808080", emissive: m.emissive && num(m.emissiveIntensity, 1) > 0.2 ? m.emissive : null, opacity: num(m.opacity, 1) };
    };
    const note = (label, poly) => {
      if (!label) return;
      const xs = poly.map((q) => q[0]),
        ys = poly.map((q) => q[1]);
      const bb = named[label] || (named[label] = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
      bb.x0 = Math.min(bb.x0, Math.min.apply(null, xs));
      bb.x1 = Math.max(bb.x1, Math.max.apply(null, xs));
      bb.y0 = Math.min(bb.y0, Math.min.apply(null, ys));
      bb.y1 = Math.max(bb.y1, Math.max.apply(null, ys));
    };
    const visit = (nodes, parent, guard, name, prop) => {
      if (!Array.isArray(nodes) || guard > 6) return;
      for (const n of nodes) {
        if (!n || typeof n !== K.OBJECT || n.visible === false || (n.name && hide.has(String(n.name)))) continue;
        const m = M.mul(parent, nodeMatrix(n));
        const label = String(n.name || n.ref || name || "");
        const tag = String((n.ref || "") + " " + (n.name || "") + " " + (name || "")).toLowerCase();
        if (K.RE.PERSON.test(tag) || castRes.some((re) => re.test(tag))) continue;
        if (n.shape === "light") {
          if (n.type === "point" || n.type === "spot") {
            const w = M.apply(parent, vec(n.pos, [0, 0, 0]));
            const p = stage.map(w[0], w[1], w[2]);
            lights.push({ x: p[0], y: p[1], z: w[2], color: n.color || "#ffcc88", intensity: num(n.intensity, 1), radius: num(n.distance, 6) * stage.pxPerMeter(w[2]) * K.LIGHT_SPREAD, flicker: !!n.flicker || K.RE.FLICKER.test(tag) || lum(n.color || "#ffffff") < 0.85 });
          }
          continue;
        }
        if (n.shape === "group") {
          visit(n.children, m, guard + 1, label, prop);
          continue;
        }
        if (n.shape === "use") {
          visit(defs[n.ref], m, guard + 1, label, prop);
          continue;
        }
        if (n.shape === "repeat" && n.node) {
          const count = clamp(Math.round(num(n.count, 1)), 1, 60),
            step = vec(n.step, [1, 0, 0]);
          for (let i = 0; i < count; i++) visit([n.node], M.mul(m, M.compose([step[0] * i, step[1] * i, step[2] * i], [0, 0, 0], [1, 1, 1])), guard + 1, label, prop);
          continue;
        }
        const s = samples(n);
        if (!s || !s.pts.length) continue;
        const world = s.pts.map((p) => M.apply(m, p));
        const ys = world.map((p) => p[1]),
          xs = world.map((p) => p[0]),
          zsN = world.map((p) => p[2]);
        const yMin = Math.min.apply(null, ys),
          yMax = Math.max.apply(null, ys);
        const width = Math.max.apply(null, xs) - Math.min.apply(null, xs),
          deep = Math.max.apply(null, zsN) - Math.min.apply(null, zsN);
        const zc = zsN.reduce((a, v) => a + v, 0) / zsN.length;
        const flat = yMax - yMin < K.STAGE.FLAT && yMax < K.STAGE.FLAT_TOP;
        if (flat && (width > K.STAGE.GROUND_SPAN || deep > K.STAGE.GROUND_SPAN || K.RE.GROUND.test(tag))) continue;
        if (zc > stage.zNear + K.STAGE.NEAR_CULL) continue;
        const c = colorOf(n.mat);
        const far = Math.max(0, stage.zBack - zc);
        const fk = fog ? clamp(1 - Math.exp(-num(fog.density, 0.02) * far * K.FOG_GAIN), 0, 0.8) : 0;
        const color = c.emissive ? c.emissive : gradeHex(fk > 0 ? mixHex(c.color, fog.color || c.color, fk) : c.color);
        let pts2 = flat ? world.map((p) => stage.map(p[0], 0, p[2])) : world.map((p) => stage.map(p[0], p[1], zc));
        if (prop && Math.max(width, yMax - yMin) < K.PROP_SMALL) {
          const mx = pts2.reduce((a, q) => a + q[0], 0) / pts2.length,
            my = Math.max.apply(null, pts2.map((q) => q[1]));
          pts2 = pts2.map((q) => [mx + (q[0] - mx) * K.PROP_BOOST, my + (q[1] - my) * K.PROP_BOOST]);
        }
        const item = { z: flat ? zc - K.STAGE.DECAL_BIAS : zc, color, opacity: c.opacity, emissive: !!c.emissive, sway: K.RE.SWAY.test(tag), flame: K.RE.FLAME.test(tag), smoke: K.RE.SMOKE.test(tag), seed: hash(items.length + 1), name: label, decal: flat };
        if (s.kind === "line" || s.kind === "ring") {
          Object.assign(item, { kind: s.kind, pts: pts2, width: Math.max(1, s.width * stage.pxPerMeter(zc)) });
        } else {
          const poly = hull(pts2);
          if (poly.length < 3) continue;
          Object.assign(item, { kind: "poly", pts: poly, area: area(poly) });
          note(label, poly);
        }
        const bx = item.pts.map((q) => q[0]),
          by = item.pts.map((q) => q[1]);
        item.baseX = bx.reduce((a, v) => a + v, 0) / bx.length;
        item.baseY = Math.max.apply(null, by);
        item.topY = Math.min.apply(null, by);
        item.bx0 = Math.min.apply(null, bx);
        item.bx1 = Math.max.apply(null, bx);
        item.by0 = item.topY;
        item.by1 = item.baseY;
        items.push(item);
      }
    };
    visit(L && L.nodes, M.ident(), 0, "", false);
    visit((extra && extra.props) || [], M.ident(), 0, "", true);
    items.sort((a, b) => a.z - b.z);
    const gm = L && L.ground ? colorOf(L.ground.mat) : null;
    const gmat = L && L.ground ? (typeof L.ground.mat === K.STRING ? mats[L.ground.mat] : L.ground.mat) || {} : {};
    const ground = { color: gradeHex((gm && gm.color) || (stage.interior ? K.GROUND.INTERIOR : K.GROUND.EXTERIOR)), pattern: String(gmat.pattern || (stage.interior ? K.GROUND.PLANKS : K.GROUND.EARTH)).toLowerCase() };
    const hasFar = items.some((it) => it.z < stage.zBack - K.STAGE.FAR_NODE);
    return { items, lights, named, ground, hasFar };
  }

  function designInfo(design) {
    if (design && design.info2d && typeof design.info2d === K.OBJECT) return Object.assign({}, K.INFO_DEFAULT, design.info2d);
    const info = { skin: "#eef0f2", top: "#5a6068", bottom: null, shoes: null, hair: null, hairKind: null, beard: null, hat: null, hatKind: null, glasses: false, scarf: null, skirt: false, buttons: false, eye: "#141318", legs: false, arms: true, animal: false, brows: false, height: 1.6, template: false };
    const parts = (Array.isArray(design && design.parts) ? design.parts : []).filter((p) => p && p.visible !== false);
    const byId = {};
    for (const p of parts) byId[p.id] = p;
    const firstColor = (p) => {
      for (const n of (p && p.nodes) || []) if (n && n.mat && n.mat.color) return n.mat.color;
      return null;
    };
    info.template = !!(design && design.anchors && design.anchors.body && !byId.hips);
    info.animal = parts.some((p) => K.RE.ANIMAL.test(p.id));
    info.legs = !!(byId.leg_l && byId.leg_l.nodes && byId.leg_l.nodes.length);
    info.arms = !!(byId.arm_l || byId.arm_r);
    info.brows = !!byId.brows;
    for (const p of parts) {
      const id = String(p.id || "").toLowerCase();
      if (id === "head") info.skin = firstColor(p) || info.skin;
      if (id === "eyes") info.eye = firstColor(p) || info.eye;
      if (K.RE.HAT.test(id) && !id.startsWith("hair")) {
        info.hat = firstColor(p);
        info.hatKind = K.RE.CONE_HAT.test(id) ? "cone" : /helmet/.test(id) ? "helmet" : /turban|khan/.test(id) ? "turban" : "cap";
      }
      if (K.RE.BEARD.test(id)) info.beard = firstColor(p) || "#d8dcdf";
      if (K.RE.GLASSES.test(id)) info.glasses = true;
      for (const n of p.nodes || []) {
        const nm = String((n && n.name) || "").toLowerCase();
        const col = n && n.mat && n.mat.color;
        if (!col) continue;
        if (nm === "skin" && id === "head") info.skin = col;
        if (K.RE.TOP.test(nm) && nm === "top") info.top = col;
        if (K.RE.BOTTOM.test(nm) && nm === "bottom") info.bottom = col;
        if (K.RE.SHOES.test(nm)) info.shoes = col;
        if (K.RE.HAIR.test(nm) || (id === "hair" && !info.hair)) {
          info.hair = info.hair || col;
          if (K.RE.HAIR_LONG.test(nm)) info.hairKind = "long";
          else if (K.RE.HAIR_SPIKE.test(nm) && !info.hairKind) info.hairKind = "spike";
          else if (K.RE.HAIR_SIDE.test(nm) && !info.hairKind) info.hairKind = "side";
        }
        if (K.RE.SCARF.test(nm)) info.scarf = col;
        if (K.RE.SKIRT.test(nm)) info.skirt = true;
        if (K.RE.BUTTON.test(nm)) info.buttons = true;
        if (K.RE.BEARD.test(nm)) info.beard = col;
      }
    }
    if (info.template) {
      const body = byId[design.anchors.body];
      info.top = firstColor(body) || info.top;
      const head = byId[design.anchors.head];
      info.skin = firstColor(head) || info.skin;
    }
    if (!info.hairKind && info.hair) info.hairKind = "short";
    let maxY = 0;
    const world = {};
    const order = parts.slice();
    for (let pass = 0; pass < 4; pass++)
      for (const p of order) {
        if (world[p.id]) continue;
        const parent = p.parent ? world[p.parent] : [0, 0, 0];
        if (!parent) continue;
        const pp = vec(p.pos, [0, 0, 0]);
        world[p.id] = [parent[0] + pp[0], parent[1] + pp[1], parent[2] + pp[2]];
      }
    const headPart = byId.head || (design && design.anchors && byId[design.anchors.head]);
    if (headPart && world[headPart.id]) {
      let r = 0.2;
      for (const n of headPart.nodes || []) if (n && n.shape === "sphere") r = Math.max(r, num(n.radius, 0.2));
      for (const n of headPart.nodes || []) if (n && n.shape === "cylinder") r = Math.max(r, num(n.radius, 0.2));
      maxY = world[headPart.id][1] + r;
    }
    info.height = clamp(maxY || 1.6, 0.5, 2.6);
    return info;
  }

  function buildRig(key, design, metrics, styleOutline) {
    const info = designInfo(design);
    const m = Object.assign({}, K.DEFAULT_METRICS, metrics || {});
    const D = K.HEAD_DIAMETER;
    const headH = D * m.headAspect,
      headW = D;
    const bodyH = m.bodyToHead * headH,
      bodyW = m.bodyWidth * D;
    const legH = info.legs ? bodyH * K.LEG_RATIO : 0;
    const total = legH + bodyH + headH * (1 - K.HEAD_OVERLAP);
    const unit = info.height / total;
    const profile = K.PROFILE[m.bodyShape] || K.PROFILE.dome;
    const bodyPts = profile.map(([x, y]) => [x * bodyW, -legH - y * bodyH]).concat(profile.slice(0, -1).reverse().map(([x, y]) => [-x * bodyW, -legH - y * bodyH]));
    const ghost = design && design.info2d ? design.ghost === true : K.RE.GHOST.test(String(key).toLowerCase()) || K.RE.GHOST.test(String((design && design.tags) || "").toLowerCase());
    return {
      key,
      info,
      m,
      unit,
      headH,
      headW,
      bodyH,
      bodyW,
      legH,
      bodyPts,
      ghost,
      outline: styleOutline || K.OUTLINE,
      seed: seedOf(String(key)),
      headCy: -legH - bodyH - headH / 2 + headH * K.HEAD_OVERLAP,
    };
  }

  function pathPoly(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  }
  function fillStroke(g, fill, line, width) {
    g.fillStyle = fill;
    g.fill();
    if (width > 0) {
      g.strokeStyle = line;
      g.lineWidth = width;
      g.lineJoin = K.ROUND;
      g.stroke();
    }
  }
  function arm(g, x0, y0, len, thick, angle, bend, fill, line, lw, end) {
    if (!bend) return limb(g, x0, y0, len, thick, angle, fill, line, lw, end);
    const up = len * K.ARM_SPLIT;
    const ex = x0 - up * Math.sin(angle * DEG), ey = y0 + up * Math.cos(angle * DEG);
    limb(g, x0, y0, up, thick, angle, fill, line, lw, null);
    limb(g, ex, ey, len - up + thick * 0.2, thick, angle + bend, fill, line, lw, end);
    g.beginPath();
    g.arc(ex, ey, thick * 0.46, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
  }
  function handAt(x0, y0, len, thick, angle, bend) {
    if (!bend) return [x0 - len * Math.sin(angle * DEG), y0 + len * Math.cos(angle * DEG)];
    const up = len * K.ARM_SPLIT;
    const ex = x0 - up * Math.sin(angle * DEG), ey = y0 + up * Math.cos(angle * DEG);
    const lo = len - up + thick * 0.2;
    return [ex - lo * Math.sin((angle + bend) * DEG), ey + lo * Math.cos((angle + bend) * DEG)];
  }
  function limb(g, x0, y0, len, thick, angle, fill, line, lw, end) {
    g.save();
    g.translate(x0, y0);
    g.rotate(angle * DEG);
    g.beginPath();
    g.roundRect ? g.roundRect(-thick / 2, -thick * 0.3, thick, len + thick * 0.3, thick / 2) : g.rect(-thick / 2, -thick * 0.3, thick, len + thick * 0.3);
    fillStroke(g, fill, line, lw);
    if (end) {
      g.beginPath();
      g.ellipse(0, len, end.r, end.ry || end.r, 0, 0, Math.PI * 2);
      fillStroke(g, end.color, line, lw);
    }
    g.restore();
  }

  function rigPose(R, action, t, talk, moving, env) {
    const s = R.seed * 10;
    const p = { elbowB: 0, elbowF: 0, legB: 0, legF: 0, armB: 8, armF: -8, tilt: 0, head: noise(t * 0.4, s) * 3, bob: Math.sin(t * 2.1 + s) * 0.012, eye: 1, wide: 1, dx: 0, squat: 0, mouth: talk, mouthShape: 0 };
    const A = K.ACTION;
    if (moving || action === A.WALK || action === A.RUN) {
      const run = action === A.RUN;
      const ph = t * (run ? 11 : 7.2);
      const amp = run ? 38 : 24;
      p.legB = Math.sin(ph) * amp;
      p.legF = -Math.sin(ph) * amp;
      p.armB = -Math.sin(ph) * (amp - 4);
      p.armF = Math.sin(ph) * (amp - 4);
      p.bob = -Math.abs(Math.sin(ph)) * (run ? 0.05 : 0.03);
      p.tilt = run ? 8 : 3;
    }
    const gest = K.RE.SPEAKING.test(action || "") ? Math.max(0.6, env || 0) : env || 0;
    if (gest > 0) {
      p.armF = lerp(p.armF, -22 - 16 * (0.5 + 0.5 * Math.sin(t * 1.7 + s)), gest);
      p.head += Math.sin(t * 1.9) * 2.5 * gest;
    }
    if (action === A.FEAR) {
      p.armB = 150 + Math.sin(t * 16) * 3;
      p.armF = -150 + Math.sin(t * 17) * 3;
      p.tilt = -6;
      p.dx = Math.sin(t * 19) * 0.004;
      p.wide = 1.18;
      p.mouthShape = 1;
    }
    if (action === A.POINT) p.armF = -100;
    const P2 = K.POSE2[action];
    if (P2) {
      p.armB = P2[0];
      p.elbowB = P2[1];
      p.armF = P2[2];
      p.elbowF = P2[3];
      if (P2[4] != null) p.head = P2[4];
      if (P2[5] != null) p.eye = P2[5];
      if (action === A.BELLY) {
        p.elbowB += Math.sin(t * 1.5) * 4;
        p.elbowF -= Math.sin(t * 1.5) * 4;
      }
    }
    if (action === A.CRY) {
      p.armB = 0;
      p.elbowB = -165 + Math.sin(t * 9) * 4;
      p.armF = 0;
      p.elbowF = 165 - Math.sin(t * 9) * 4;
      p.head = 8;
      p.eye = 0.35;
      p.mouthShape = 2;
    }
    if (action === A.SHAKE) p.head = Math.sin(t * 9) * 9;
    if (action === A.NOD) {
      p.head = 0;
      p.bob -= Math.max(0, Math.sin(t * 6)) * 0.03;
    }
    if (action === A.SUPPORT) p.tilt = 4;
    if (action === A.RAISE) {
      p.armB = 165 + Math.sin(t * 3) * 4;
      p.armF = -165 - Math.sin(t * 3) * 4;
    }
    if (action === A.WAVE) p.armF = -150 + Math.sin(t * 9) * 18;
    if (action === A.BOW) {
      p.tilt = 22;
      p.head = 12;
      p.armB = 40;
      p.armF = -40;
    }
    if (action === A.KNEEL) p.squat = 0.38;
    if (action === A.SIT || action === A.SIT_TALK) p.squat = 0.28;
    if (action === A.LAUGH) {
      p.head = -8 + Math.sin(t * 14) * 3;
      p.bob += Math.abs(Math.sin(t * 14)) * 0.01;
      p.mouth = Math.max(p.mouth, 0.7);
      p.mouthShape = 3;
    }
    if (action === A.SHOUT) {
      p.mouth = Math.max(p.mouth, 0.85);
      p.armB = 30;
      p.armF = -30;
    }
    if (action === A.THINK) p.armF = -135;
    if (action === A.LOOK) p.head = Math.sin(t * 1.4) * 16;
    if (action === A.DIG) {
      p.tilt = 18 + Math.sin(t * 5) * 8;
      p.armB = 60 + Math.sin(t * 5) * 25;
      p.armF = -60 + Math.sin(t * 5) * 25;
    }
    if (action === A.LIE || action === A.SLEEP || action === A.FALL) p.lie = true;
    if ((t + R.seed * 7) % 3.7 < 0.12 && action !== A.FEAR) p.eye = Math.min(p.eye, 0.1);
    if (action === A.SLEEP) p.eye = 0.08;
    return p;
  }

  function drawRig(g, R, p, facing, lw, tint) {
    const I = R.info;
    const col = (c) => (tint < 0.999 ? scaleHex(c, tint) : c);
    const line = R.outline;
    const top = col(I.top),
      skin = col(I.skin),
      bottom = col(I.bottom || scaleHex(I.top, 0.7)),
      hair = I.hair ? col(I.hair) : null;
    g.save();
    if (p.lie) {
      g.rotate(-88 * DEG * facing);
      g.translate(0, R.bodyW * 0.3);
    }
    g.translate(p.dx, -p.bob + p.squat * R.legH);
    g.scale(facing, 1);
    g.rotate(p.tilt * DEG);
    const hipY = -R.legH;
    if (I.legs) {
      const legT = Math.max(0.07, R.bodyW * 0.24);
      const lx = R.bodyW * 0.2;
      const legLen = R.legH * (1 - p.squat * 0.6);
      const foot = { r: legT * 0.75, ry: legT * 0.4, color: col(I.shoes || "#1e1c20") };
      limb(g, -lx, hipY + R.legH * p.squat * 0.6, legLen, legT, p.legB, bottom, line, lw, foot);
      limb(g, lx, hipY + R.legH * p.squat * 0.6, legLen, legT, p.legF, bottom, line, lw, foot);
    }
    const armT = Math.max(0.05, R.m.armThickness * R.headW);
    const armL = Math.max(armT * 2, R.m.armLength * R.headH);
    const shoulderY = -R.legH - R.bodyH * 0.8;
    const sx = R.bodyW / 2 - armT * 0.6;
    const hand = { r: armT * 0.55, color: skin };
    const backFront = p.armB + (p.elbowB || 0) * 0.5 < -K.ARM_CROSS;
    if (I.arms && !backFront) arm(g, -sx, shoulderY, armL, armT, p.armB, p.elbowB || 0, top, line, lw, hand);
    pathPoly(g, R.bodyPts);
    fillStroke(g, top, line, lw);
    if (I.skirt) {
      g.beginPath();
      g.moveTo(-R.bodyW * 0.5, hipY);
      g.lineTo(R.bodyW * 0.62, hipY);
      g.lineTo(R.bodyW * 0.5, hipY - R.bodyH * 0.38);
      g.lineTo(-R.bodyW * 0.5, hipY - R.bodyH * 0.38);
      g.closePath();
      fillStroke(g, bottom, line, lw);
    }
    if (I.buttons) {
      g.fillStyle = line;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(0, shoulderY + R.bodyH * (0.12 + i * 0.2), R.bodyW * 0.035, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (I.scarf) {
      g.beginPath();
      g.moveTo(-R.bodyW * 0.38, -R.legH - R.bodyH * 0.92);
      g.quadraticCurveTo(0, -R.legH - R.bodyH * 0.72, R.bodyW * 0.38, -R.legH - R.bodyH * 0.92);
      g.strokeStyle = col(I.scarf);
      g.lineWidth = R.bodyW * 0.12;
      g.lineCap = K.ROUND;
      g.stroke();
    }
    if (I.arms && backFront) arm(g, -sx, shoulderY, armL, armT, p.armB, p.elbowB || 0, top, line, lw, hand);
    if (I.arms) arm(g, sx, shoulderY, armL, armT, p.armF, p.elbowF || 0, top, line, lw, hand);
    if (p.held && p.held.length) {
      const hp = handAt(sx, shoulderY, armL, armT, p.armF, p.elbowF || 0);
      const hxp = I.arms ? hp[0] : 0,
        hyp = I.arms ? hp[1] : shoulderY + R.bodyH * 0.35;
      for (const h of p.held) {
        const w = h.w / R.unit, hh = h.h / R.unit;
        g.save();
        g.translate(hxp, hyp - hh * 0.25);
        g.rotate(h.rot * DEG);
        g.beginPath();
        g.rect(-w / 2, -hh / 2, w, hh);
        fillStroke(g, col(h.color), line, lw * 0.8);
        g.restore();
      }
      if (I.arms) {
        g.beginPath();
        g.ellipse(hxp, hyp, armT * 0.55, armT * 0.55, 0, 0, Math.PI * 2);
        fillStroke(g, skin, line, lw);
      }
    }
    const hx = 0,
      hy = R.headCy;
    g.save();
    g.translate(hx, hy + R.headH * 0.45);
    g.rotate(p.head * DEG);
    g.translate(0, -R.headH * 0.45);
    const rx = R.headW / 2,
      ry = R.headH / 2;
    if (hair && I.hairKind === "long") {
      g.beginPath();
      g.ellipse(0, ry * 0.25, rx * 1.12, ry * 1.12, 0, 0, Math.PI * 2);
      fillStroke(g, hair, line, lw);
    }
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    fillStroke(g, p.back ? hair || K.BACK_HEAD : skin, line, lw);
    if (p.back) {
      g.restore();
      g.restore();
      return;
    }
    if (hair) {
      g.beginPath();
      if (I.hairKind === "spike") {
        g.moveTo(-rx * 0.95, -ry * 0.2);
        for (let i = 0; i <= 6; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          const rr = i % 2 ? 1.28 : 1.02;
          g.lineTo(Math.cos(a) * rx * rr, Math.sin(a) * ry * rr - ry * 0.05);
        }
        g.lineTo(rx * 0.95, -ry * 0.2);
        g.quadraticCurveTo(0, -ry * 0.55, -rx * 0.95, -ry * 0.2);
      } else if (I.hairKind === "side" && lum(I.hair) > 0.7) {
        g.ellipse(-rx * 0.92, ry * 0.02, rx * 0.16, ry * 0.32, 0.2, 0, Math.PI * 2);
        g.moveTo(rx * 0.92 + rx * 0.16, ry * 0.02);
        g.ellipse(rx * 0.92, ry * 0.02, rx * 0.16, ry * 0.32, -0.2, 0, Math.PI * 2);
      } else {
        g.moveTo(-rx * 0.98, -ry * 0.1);
        g.quadraticCurveTo(-rx * 1.02, -ry * 1.12, 0, -ry * 1.04);
        g.quadraticCurveTo(rx * 1.02, -ry * 1.12, rx * 0.98, -ry * 0.1);
        g.quadraticCurveTo(rx * 0.4, -ry * 0.62, -rx * 0.98, -ry * 0.1);
      }
      fillStroke(g, hair, line, lw * 0.9);
    }
    const eyeW = (R.m.eyeWidth * R.headW) / 2,
      eyeH = (R.m.eyeHeight * R.headH) / 2,
      gap = (R.m.eyeGap * R.headW) / 2,
      ey = -R.m.eyeY * R.headH * -1;
    g.fillStyle = col(I.eye);
    for (const ex of [-gap, gap]) {
      g.beginPath();
      g.ellipse(ex, ey, eyeW * p.wide, Math.max(eyeH * 0.08, eyeH * p.eye * p.wide), 0, 0, Math.PI * 2);
      g.fill();
    }
    if (I.brows) {
      g.strokeStyle = line;
      g.lineWidth = lw * 0.9;
      for (const ex of [-gap, gap]) {
        g.beginPath();
        g.moveTo(ex - eyeW * 1.1, ey - eyeH * 1.6 - (p.mouthShape === 1 ? eyeH * 0.3 : 0));
        g.lineTo(ex + eyeW * 1.1, ey - eyeH * 1.6 + (p.mouthShape === 2 ? eyeH * 0.4 : 0));
        g.stroke();
      }
    }
    if (I.glasses) {
      g.strokeStyle = line;
      g.lineWidth = lw * 0.8;
      for (const ex of [-gap, gap]) {
        g.beginPath();
        g.arc(ex, ey, Math.max(eyeW, eyeH) * 1.35, 0, Math.PI * 2);
        g.stroke();
      }
    }
    const mw = (R.m.mouthWidth * R.headW) / 2,
      mh = (R.m.mouthHeight * R.headH) / 2,
      my = -R.m.mouthY * R.headH;
    g.fillStyle = col(I.eye);
    g.beginPath();
    if (p.mouthShape === 2) g.ellipse(0, my + mh * 0.3, mw * 0.9, mh * 0.35 + mh * p.mouth, 0, Math.PI, Math.PI * 2);
    else if (p.mouthShape === 3) g.ellipse(0, my - mh * 0.2, mw * 1.1, mh * 0.5 + mh * p.mouth, 0, 0, Math.PI);
    else g.ellipse(0, my, mw * (0.75 + 0.2 * p.mouth), Math.max(mh * 0.18, mh * (0.3 + 0.6 * p.mouth) * (p.mouthShape === 1 ? 1.4 : 1)), 0, 0, Math.PI * 2);
    g.fill();
    if (I.beard) {
      g.beginPath();
      g.moveTo(-rx * 0.5, ry * 0.55);
      g.quadraticCurveTo(-rx * 0.35, ry * 1.55, 0, ry * 1.75);
      g.quadraticCurveTo(rx * 0.35, ry * 1.55, rx * 0.5, ry * 0.55);
      g.quadraticCurveTo(0, ry * 0.85, -rx * 0.5, ry * 0.55);
      fillStroke(g, col(I.beard), line, lw * 0.8);
    }
    if (I.hat) {
      const hc = col(I.hat);
      g.beginPath();
      if (I.hatKind === "cone") {
        g.moveTo(-rx * 1.7, -ry * 0.55);
        g.lineTo(0, -ry * 1.75);
        g.lineTo(rx * 1.7, -ry * 0.55);
        g.closePath();
      } else if (I.hatKind === "helmet") {
        g.ellipse(0, -ry * 0.45, rx * 1.12, ry * 0.75, 0, Math.PI, Math.PI * 2);
        g.lineTo(rx * 1.3, -ry * 0.42);
        g.lineTo(-rx * 1.3, -ry * 0.42);
        g.closePath();
      } else if (I.hatKind === "turban") {
        g.ellipse(0, -ry * 0.7, rx * 1.02, ry * 0.42, 0, 0, Math.PI * 2);
      } else {
        g.ellipse(0, -ry * 0.62, rx * 0.95, ry * 0.5, 0, Math.PI, Math.PI * 2);
        g.lineTo(rx * 1.35, -ry * 0.6);
        g.lineTo(-rx * 0.95, -ry * 0.6);
        g.closePath();
      }
      fillStroke(g, hc, line, lw);
    }
    g.restore();
    g.restore();
  }

  function rigBounds(R, x, y, k) {
    const h = R.unit * (R.legH + R.bodyH + R.headH) * k;
    const headTop = y + R.unit * (R.headCy - R.headH / 2) * k,
      headBottom = y + R.unit * (R.headCy + R.headH / 2) * k;
    return { x, y, top: y - h, h, w: R.unit * Math.max(R.bodyW, R.headW) * k * 1.3, headTop, headBottom, headCy: (headTop + headBottom) / 2 };
  }

  function blendPose(a, b, k) {
    if (k >= 1) return b;
    const out = Object.assign({}, b);
    for (const key of Object.keys(b)) if (typeof b[key] === K.NUMBER && typeof a[key] === K.NUMBER) out[key] = lerp(a[key], b[key], k);
    if (k < 0.5) out.lie = a.lie;
    return out;
  }

  function speechEnv(ranges, t) {
    if (!Array.isArray(ranges)) return 0;
    let v = 0;
    for (const r of ranges) {
      if (!Array.isArray(r)) continue;
      const a = clamp((t - (r[0] - K.SMOOTH.ATTACK)) / K.SMOOTH.ATTACK, 0, 1),
        b = clamp((r[1] + K.SMOOTH.RELEASE - t) / K.SMOOTH.RELEASE, 0, 1);
      v = Math.max(v, ease(Math.min(a, b)));
    }
    return v;
  }

  function wordColor(text, fallback) {
    const t = String(text || "").toLowerCase();
    for (const [re, c] of K.COLOR_WORDS) if (re.test(t)) return c;
    return fallback;
  }

  function heldItems(a, mats) {
    const nodes = a && a.hold && Array.isArray(a.hold.nodes) ? a.hold.nodes : [];
    const out = [];
    for (const n of nodes) {
      if (!n || typeof n !== K.OBJECT || n.shape === "light") continue;
      const size = vec(n.size, [num(n.radius, 0.06) * 2, num(n.height, num(n.radius, 0.06) * 2), 0.02]);
      const m = typeof n.mat === K.STRING ? mats[n.mat] || {} : n.mat && typeof n.mat === K.OBJECT ? n.mat : {};
      const color = wordColor(n.mat + " " + n.name, m.color || K.HELD_COLOR);
      out.push({ w: Math.max(size[0], 0.03) * K.HOLD_BOOST, h: Math.max(size[1], size[2] > size[1] ? size[2] : 0.03) * K.HOLD_BOOST, rot: vec(n.rot, [0, 0, 0])[2], color });
    }
    return out.slice(0, 3);
  }

  function aliasAction(raw) {
    const a = String(raw || "").toLowerCase();
    if (!a) return K.ACTION.IDLE;
    if (Object.values(K.ACTION).indexOf(a) >= 0) return a;
    for (const [re, to] of K.ACTION_ALIAS) if (re.test(a)) return to;
    return K.ACTION.IDLE;
  }

  function speechLevel(ranges, t) {
    if (!Array.isArray(ranges)) return 0;
    for (const r of ranges) {
      if (!Array.isArray(r) || t < r[0] || t > r[1]) continue;
      const k = (t - r[0]) * 6.4;
      const syll = Math.max(0, Math.sin(k * Math.PI)) * (0.55 + 0.45 * hash(Math.floor(k) + r[0] * 13));
      return syll * clamp((t - r[0]) / 0.06, 0, 1) * clamp((r[1] - t) / 0.1, 0, 1);
    }
    return 0;
  }

  function actorState(a, marks, beatDur, st) {
    const resolve = (v) => {
      if (typeof v === K.STRING && marks && Array.isArray(marks[v])) return marks[v];
      if (Array.isArray(v) && v.length >= 2) return v.length >= 3 ? [v[0], v[2]] : v;
      return [0, 0];
    };
    const from = resolve(a.at != null ? a.at : a.pos);
    let x = from[0], z = from[1], moving = false, dir = 0;
    if (a.moveTo) {
      const to = resolve(a.moveTo);
      const s0 = num(a.moveStart, 0) * beatDur,
        s1 = Math.max(s0 + 0.1, num(a.moveEnd, 1) * beatDur);
      const k = clamp((st - s0) / (s1 - s0), 0, 1);
      x = lerp(from[0], to[0], ease(k));
      z = lerp(from[1], to[1], ease(k));
      moving = k > 0 && k < 1;
      dir = Math.sign(to[0] - from[0]);
    }
    let action = aliasAction(a.action), prev = null, mix = 1;
    if (a.then) {
      const switchAt = a.moveTo ? num(a.moveEnd, 1) * beatDur : num(a.thenAt, 0.6) * beatDur;
      if (st >= switchAt) {
        prev = action;
        action = aliasAction(a.then);
        mix = clamp((st - switchAt) / K.SMOOTH.SWITCH, 0, 1);
      }
    }
    if (a.moveTo && moving) action = action === K.ACTION.RUN ? K.ACTION.RUN : K.ACTION.WALK;
    const face = num(a.face, 0);
    let facing = 1;
    if (dir) facing = dir;
    else if (Math.abs(face) > 25 && Math.abs(face) < 155) facing = face > 0 ? 1 : -1;
    else if (Math.abs(face) >= 155) facing = 1;
    return { x, z, y: num(a.y, 0), action, prev, mix, moving, facing, back: !dir && Math.abs(face) >= 155, front: !dir && Math.abs(face) <= 25 };
  }

  function init(ctx) {
    const P = ctx.params || {};
    const G = (ctx.spec && ctx.spec.gen) || {};
    const L = (G.locations || {})[P.location] || {};
    const style = G.style || {};
    const rawTime = String(P.time || L.time || "day");
    const timeKey = L.interior ? (/dark|night/.test(rawTime) ? K.INTERIOR_DARK : K.INTERIOR) : rawTime;
    const VW = Math.round((K.VIRTUAL_H * ctx.W) / ctx.H),
      VH = K.VIRTUAL_H;
    const marks = L.marks || {};
    const actorZs = [];
    for (const a of P.actors || []) {
      if (!a) continue;
      for (const v of [a.at, a.moveTo]) {
        if (typeof v === K.STRING && Array.isArray(marks[v])) actorZs.push(num(marks[v][1], 0));
        else if (Array.isArray(v)) actorZs.push(num(v.length >= 3 ? v[2] : v[1], 0));
      }
    }
    const stage = makeStage(L, VW, VH, actorZs);
    const grade = K.GRADE[timeKey] || null;
    const loc = buildLocation(L, stage, Object.keys(G.cast || {}).map((key) => key.toLowerCase()), grade, { props: Array.isArray(P.props) ? P.props : [], hide: Array.isArray(P.hide) ? P.hide : [] });
    const casts = (P.actors || []).filter((a) => a && a.cast).map((a) => a.cast);
    const firstSpeaker = Object.keys(P.speech || {}).filter((c) => casts.indexOf(c) >= 0 && Array.isArray(P.speech[c]) && P.speech[c].length).sort((x, y) => num(P.speech[x][0][0], 0) - num(P.speech[y][0][0], 0))[0];
    const talker = (P.actors || []).find((a) => a && Array.isArray(a.talk));
    const focusCast = firstSpeaker || (talker && talker.cast) || casts[0] || null;
    const metrics = style.metrics || null;
    const outline = style.outlineColor || K.OUTLINE;
    const rigs = {};
    for (const a of P.actors || []) {
      if (!a || !a.cast || rigs[a.cast]) continue;
      rigs[a.cast] = buildRig(a.cast, (G.cast || {})[a.cast] || {}, metrics, outline);
    }
    const night = /night|dark|midnight/.test(timeKey);
    const sky = L.sky && L.sky.top ? [L.sky.top, L.sky.horizon || L.sky.top] : K.SKY[timeKey] || K.SKY.day;
    const stars = [];
    if (!stage.interior && night) for (let i = 0; i < K.STAR_COUNT; i++) stars.push([hash(i * 3.1) * VW * 1.4 - VW * 0.2, hash(i * 7.7) * stage.horizon * 0.8, 0.6 + hash(i) * 1.4, 0.2 + hash(i + 2) * 0.5]);
    const hills = [];
    if (!stage.interior && !loc.hasFar) {
      const seed = seedOf(String(P.location || "loc"));
      for (let i = 0; i < K.HILLS; i++) {
        const cxh = (hash(seed * 50 + i) * 1.4 - 0.2) * VW,
          w = VW * (0.25 + hash(seed * 70 + i) * 0.25),
          h = stage.horizon * (0.25 + hash(seed * 90 + i) * 0.3);
        hills.push({ cx: cxh, w, h });
      }
    }
    const cues = [];
    const fx = (ctx.spec && (ctx.spec.fxCues || (ctx.spec.sfx && ctx.spec.sfx.cues))) || [];
    for (const c of fx) if (c && typeof c.kind === K.STRING) cues.push({ t: num(c.t, 0), kind: c.kind });
    const outlinePx = num(metrics && metrics.outlinePx, num(style.outlineWidth, K.DEFAULT_METRICS.outlinePx));
    const freq = {};
    for (const sh of (ctx.spec && ctx.spec.shots) || []) for (const a of (sh.params && sh.params.actors) || []) if (a && a.cast) freq[a.cast] = (freq[a.cast] || 0) + 1;
    const narrator = Object.keys(freq).sort((x, y) => freq[y] - freq[x])[0] || focusCast;
    return { P, G, L, stage, loc, rigs, focusCast, narrator, metrics, sky, stars, hills, VW, VH, timeKey, night, grade, cues, outlinePx, outline, weather: String(P.weather || L.weather || "").toLowerCase(), dust: Array.from({ length: K.DUST }, (_, i) => [hash(i * 1.7), hash(i * 2.9), hash(i * 4.3)]) };
  }

  function subjectBox(list) {
    return {
      x0: Math.min.apply(null, list.map((a) => a.b.x - a.b.w / 2)),
      x1: Math.max.apply(null, list.map((a) => a.b.x + a.b.w / 2)),
      top: Math.min.apply(null, list.map((a) => a.b.top)),
      bottom: Math.max.apply(null, list.map((a) => a.b.y)),
    };
  }

  function frameFor(S, cam0, actors) {
    const shot = cam0.shot || K.SHOT.WIDE;
    const VW = S.VW, VH = S.VH, A = VW / VH;
    const subj = actors.filter((a) => a.b);
    const focus = subj.find((a) => a.cast === cam0.focus) || subj.find((a) => a.cast === S.focusCast) || subj[0];
    const fit = (box, padTop, padBottom) => {
      const hNeed = Math.max((box.bottom - box.top) * (1 + padTop + padBottom), (box.x1 - box.x0) / K.SAFE / A);
      return { h: hNeed, cx: (box.x0 + box.x1) / 2, cy: box.top - (box.bottom - box.top) * padTop + hNeed / 2, need: box };
    };
    const propKey = cam0.focusProp ? String(cam0.focusProp).toLowerCase() : "";
    const propName = propKey && (S.loc.named[propKey] ? propKey : Object.keys(S.loc.named).find((n) => n.toLowerCase().indexOf(propKey) === 0 || propKey.indexOf(n.toLowerCase()) === 0));
    if (shot === K.SHOT.INSERT && propName && isFinite(S.loc.named[propName].x0)) {
      const p = S.loc.named[propName];
      const box = { x0: p.x0, x1: p.x1, top: p.y0, bottom: p.y1 };
      if (focus) {
        box.x0 = Math.min(box.x0, focus.b.x - focus.b.w / 2);
        box.x1 = Math.max(box.x1, focus.b.x + focus.b.w / 2);
        box.top = Math.min(box.top, focus.b.headTop);
        box.bottom = Math.max(box.bottom, focus.b.y);
      }
      const f = fit(box, focus ? 0.12 : 0.6, focus ? 0.06 : 0.6);
      f.h = clamp(f.h, VH * K.FRAME_MIN, VH);
      return f;
    }
    if (!subj.length) return { cx: VW / 2, cy: VH / 2, h: VH, need: null };
    if (shot === K.SHOT.WIDE || shot === K.SHOT.AERIAL || shot === K.SHOT.HIGH || shot === K.SHOT.LOW) {
      const box = subjectBox(subj);
      let h = VH, cx = VW / 2, cy = VH / 2;
      const need = fit(box, 0.15, 0.06);
      if (need.h > h) h = need.h;
      if (box.x0 < cx - (h * A) / 2 + VW * 0.02 || box.x1 > cx + (h * A) / 2 - VW * 0.02) cx = clamp((box.x0 + box.x1) / 2, cx - VW * 0.2, cx + VW * 0.2);
      if (box.bottom > cy + h / 2 - VH * 0.02) cy = box.bottom - h / 2 + VH * 0.04;
      return { cx, cy, h, need: box };
    }
    const b = focus.b;
    const hh = b.headBottom - b.headTop;
    if (shot === K.SHOT.CLOSE || shot === K.SHOT.EXTREME) {
      const k = shot === K.SHOT.EXTREME ? K.FRAME.extreme_close : K.FRAME.close;
      const h = hh * k;
      const box = { x0: b.x - b.w / 2, x1: b.x + b.w / 2, top: b.headTop, bottom: b.headBottom };
      return { cx: b.x, cy: b.headTop - hh * K.HEADROOM + h / 2, h, need: box };
    }
    const group = subj.filter((a) => a === focus || Math.abs(a.b.x - b.x) < b.w * K.GROUP_SPAN);
    const box = subjectBox(shot === K.SHOT.OVER ? subj.slice(0, 2) : group);
    const f = fit(box, 0.12, 0.04);
    f.h = Math.max(f.h, b.h * K.FRAME.medium);
    f.cy = box.bottom + VH * 0.0 - f.h * 0.46;
    return f;
  }

  function finalFrame(S, f, cam0, u, abs) {
    const k = ease(clamp(u, 0, 1));
    const mv = cam0.move;
    let scale = 1, dx = 0;
    if (mv === K.MOVE.IN || mv === K.MOVE.PUSH) scale = lerp(1, 1 - K.PUSH, k);
    else if (mv === K.MOVE.OUT || mv === K.MOVE.PULL) scale = lerp(1 - K.PUSH, 1, k);
    else if (mv === K.MOVE.ORBIT_L || mv === K.MOVE.PAN_L) dx = lerp(K.PAN, -K.PAN, k);
    else if (mv === K.MOVE.ORBIT_R || mv === K.MOVE.PAN_R) dx = lerp(-K.PAN, K.PAN, k);
    else scale = lerp(1, 1 - K.DRIFT, k);
    let h = f.h * scale;
    let cx = f.cx + dx * f.h * (S.VW / S.VH),
      cy = f.cy;
    if (f.need) {
      const n = f.need;
      const minH = (n.bottom - n.top) / K.KEEP;
      if (h < minH) h = minH;
      const w = h * (S.VW / S.VH);
      if (n.x1 - n.x0 > w * K.KEEP) h = (n.x1 - n.x0) / K.KEEP / (S.VW / S.VH);
      const w2 = h * (S.VW / S.VH);
      cx = clamp(cx, n.x1 - w2 / 2 + w2 * K.EDGE, n.x0 + w2 / 2 - w2 * K.EDGE);
      cy = clamp(cy, n.bottom - h / 2 + h * K.EDGE * 0.5, n.top + h / 2 - h * K.EDGE);
    }
    let shake = cam0.move === K.MOVE.SHAKE ? 0.004 : 0,
      flash = 0;
    for (const c of S.cues) {
      const dt = abs - c.t;
      if (dt >= 0 && dt < 0.5 && K.CUES.SHAKE.test(c.kind)) shake = Math.max(shake, 0.012 * (1 - dt / 0.5));
      if (dt >= 0 && dt < 0.18 && K.CUES.FLASH.test(c.kind)) flash = Math.max(flash, 1 - dt / 0.18);
    }
    cx += noise(abs * 35, 3) * shake * h;
    cy += noise(abs * 35, 7) * shake * h;
    return { cx, cy, h, flash };
  }

  function drawGround(g, S, x0, x1) {
    const st = S.stage, gr = S.loc.ground;
    const top = st.horizon, bottom = st.VH * 2;
    g.fillStyle = gr.color;
    g.fillRect(x0, top, x1 - x0, bottom - top);
    const dark = scaleHex(gr.color, K.GROUND.LINE_DARK);
    g.strokeStyle = dark;
    g.lineWidth = K.GROUND.LINE_W;
    const p = gr.pattern;
    g.beginPath();
    if (K.RE.PATTERN_TILE.test(p)) {
      for (let z = st.zBack; z <= st.zNear + 4; z += K.GROUND.TILE) {
        const y = st.groundY(z);
        g.moveTo(x0, y);
        g.lineTo(x1, y);
      }
      for (let x = -K.GROUND.SPAN; x <= K.GROUND.SPAN; x += K.GROUND.TILE * 1.5) {
        const a = st.map(st.cx + x, 0, st.zBack),
          b = st.map(st.cx + x, 0, st.zNear + 4);
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
      }
    } else if (/plank|wood|floor|board/.test(p)) {
      for (let z = st.zBack; z <= st.zNear + 4; z += K.GROUND.TILE * 0.6) {
        const y = st.groundY(z);
        g.moveTo(x0, y);
        g.lineTo(x1, y);
      }
    }
    g.stroke();
    if (/dirt|earth|sand|soil|mud|grass|dat/.test(p) || !p) {
      g.fillStyle = dark;
      for (let i = 0; i < K.GROUND.SPECKS; i++) {
        const z = lerp(st.zBack, st.zNear + 3, hash(i * 1.3));
        const q = st.map(st.cx + (hash(i * 2.1) - 0.5) * K.GROUND.SPAN * 2, 0, z);
        if (q[0] < x0 || q[0] > x1) continue;
        g.fillRect(q[0], q[1], 3 * st.scaleAt(z), 1.5 * st.scaleAt(z));
      }
    }
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.fillRect(x0, top, x1 - x0, K.GROUND.HORIZON_SHADE);
  }

  const VR = { word: (s) => new RegExp(K.VIG.WORD_L + s + K.VIG.WORD_R, "u") };
  const vigRe = (r) => (r instanceof RegExp ? r : VR.word(r));
  const VIG_RULES = K.VIG.RULES.map(([kind, r]) => [kind, vigRe(r)]);
  const VIG_OBJECTS = K.VIG.OBJECTS.map(([key, r]) => [key, vigRe(r)]);
  const VIG_COLORS = K.VIG.COLORS.map(([c, r]) => [c, vigRe(r)]);
  const VIG_MODS = Object.fromEntries(Object.entries(K.VIG.MODS).map(([k, r]) => [k, vigRe(r)]));
  const SELF_RE = vigRe(K.VIG.SELF);
  const deburrCase = (s) => String(s || "").normalize(K.VIG.NFD).replace(K.VIG.MARKS_RE, "").replace(K.VIG.DSTROKE_RE, "d").replace(K.VIG.DSTROKE_UP_RE, "D");
  const deburr = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  function vigObjects(text) {
    const found = [];
    for (const [key, re] of VIG_OBJECTS) {
      const m = re.exec(text);
      if (m) found.push({ key, at: m.index });
    }
    return found.map((f) => f.key);
  }

  function vigColor(text, objAt) {
    let best = null, dist = Infinity;
    for (const [c, re] of VIG_COLORS) {
      const g = new RegExp(re.source, "gu");
      let m;
      while ((m = g.exec(text))) {
        const d = Math.abs(m.index - objAt);
        if (d < dist) {
          dist = d;
          best = c;
        }
      }
    }
    return best;
  }

  function vigCount(text) {
    const m = K.VIG.COUNT_RE.exec(text);
    if (!m) return 1;
    const n = K.VIG.DIGITS_RE.test(m[1]) ? parseInt(m[1], 10) : K.VIG.NUMBERS[m[1]] || 1;
    return clamp(n, 1, K.VIG.MAX_COUNT);
  }

  function vigCastHits(text, casts) {
    const t = deburr(text);
    const tc = deburrCase(text);
    const hits = [];
    const re = (w) => new RegExp(K.VIG.ASCII_L + w + K.VIG.ASCII_R);
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    for (const c of casts) {
      const words = String(c).split("_");
      const last = words[words.length - 1];
      const full = words.length > 1 ? t.search(re(words.join(" "))) : -1;
      const named = tc.search(re(cap(last)));
      const i = full >= 0 ? full : named;
      if (i >= 0) hits.push({ c, at: i });
    }
    return hits.sort((a, b) => a.at - b.at);
  }

  function vigCasts(text, casts) {
    return vigCastHits(text, casts).map((h) => h.c);
  }

  function parseVignette(text, casts) {
    const low = String(text || "").toLowerCase();
    const colon = low.indexOf(":");
    const narr = colon > 0 ? low.slice(0, colon) : low;
    const dialogue = K.VIG.DIALOGUE_RE.test(low);
    const objs = vigObjects(narr);
    const matches = VIG_RULES.filter(([, re]) => re.test(narr)).map(([kind]) => kind);
    const tier = (k) => (K.VIG.TIER_A.indexOf(k) >= 0 ? 0 : K.VIG.TIER_B.indexOf(k) >= 0 ? 1 : 2);
    const ok = matches.filter((k) => K.VIG.NEED_OBJ.indexOf(k) < 0 || objs.length);
    if (!ok.length) return null;
    ok.sort((a, b) => tier(a) - tier(b) || K.VIG.RULES.findIndex((r) => r[0] === a) - K.VIG.RULES.findIndex((r) => r[0] === b));
    const kind = ok[0];
    if (dialogue && K.VIG.WEAK.indexOf(kind) >= 0) return null;
    const firstObj = objs[0] || null;
    const objAt = firstObj ? narr.search(VIG_OBJECTS.find((o) => o[0] === firstObj)[1]) : 0;
    const mods = {};
    for (const k of Object.keys(VIG_MODS)) mods[k] = VIG_MODS[k].test(narr);
    if (mods.up) mods.down = false;
    const selfAt = deburr(narr).search(SELF_RE);
    const orig = colon > 0 ? String(text).slice(0, colon) : String(text);
    const castHits = vigCastHits(orig, casts);
    const self = selfAt >= 0 && (!castHits.length || selfAt < castHits[0].at);
    return { kind, self, objs: objs.slice(0, 2), color: firstObj ? vigColor(narr, objAt) : null, count: vigCount(narr), mods, casts: castHits.map((h) => h.c), text: narr };
  }

  const ACT_RULES = K.ACTS.map(([a, r]) => [a, vigRe(r)]);
  const EXPR_RULES = K.EXPRS.map(([a, r]) => [a, vigRe(r)]);

  function parseAct(text, casts) {
    const raw = String(text || "");
    const colon = raw.indexOf(":");
    const orig = colon > 0 ? raw.slice(0, colon) : raw;
    const narr = orig.toLowerCase();
    const hit = ACT_RULES.find(([, re]) => re.test(narr));
    const ex = EXPR_RULES.find(([, re]) => re.test(narr));
    if (!hit && !ex) return null;
    const castHits = vigCastHits(orig, casts);
    const selfAt = deburr(narr).search(SELF_RE);
    const cast = castHits.length && (selfAt < 0 || castHits[0].at < selfAt) ? castHits[0].c : selfAt >= 0 ? K.SELF_KEY : null;
    return { cast, action: hit ? hit[0] : null, expression: ex ? ex[0] : null };
  }

  const ASSETS = { props: {}, sets: {}, board: null };
  const boardKey = (t) => String(t || "").toLowerCase().normalize(K.BOARD.NFC).replace(K.BOARD.NORM_RE, " ").trim();
  const boardOf = (spec) => (spec && spec.gen && spec.gen.board2d) || null;

  async function loadSvgImage(svg) {
    if (typeof Image === K.UNDEF || !svg) return null;
    const img = new Image();
    img.src = K.BOARD.SVG_URL + encodeURIComponent(svg);
    try {
      await img.decode();
      return img;
    } catch (e) {
      return null;
    }
  }

  function splitSetSvg(svg) {
    if (typeof DOMParser === K.UNDEF) return { main: svg, fg: null };
    try {
      const doc = new DOMParser().parseFromString(svg, K.BOARD.SVG_MIME);
      const root = doc.documentElement;
      if (!root.getAttribute(K.BOARD.XMLNS)) root.setAttribute(K.BOARD.XMLNS, K.BOARD.SVG_NS);
      const fg = root.querySelector(K.BOARD.FG_SEL);
      let fgSvg = null;
      if (fg) {
        const shell = root.cloneNode(false);
        shell.appendChild(fg.cloneNode(true));
        fgSvg = new XMLSerializer().serializeToString(shell);
        fg.parentNode.removeChild(fg);
      }
      return { main: new XMLSerializer().serializeToString(root), fg: fgSvg };
    } catch (e) {
      return { main: svg, fg: null };
    }
  }

  async function preloadBoard(spec) {
    const b = boardOf(spec);
    if (!b) return;
    const jobs = [];
    for (const k of Object.keys(b.props || {})) {
      const meta = b.props[k];
      if (ASSETS.props[k] && ASSETS.props[k].meta.svg === meta.svg) continue;
      jobs.push(loadSvgImage(meta.svg).then((img) => img && (ASSETS.props[k] = { img, meta })));
    }
    for (const k of Object.keys(b.sets || {})) {
      const meta = b.sets[k];
      if (ASSETS.sets[k] && ASSETS.sets[k].meta.svg === meta.svg) continue;
      const parts = splitSetSvg(meta.svg);
      jobs.push(Promise.all([loadSvgImage(parts.main), loadSvgImage(parts.fg)]).then(([img, fg]) => img && (ASSETS.sets[k] = { img, fg, meta })));
    }
    await Promise.all(jobs);
  }
  if (ME.GEN && typeof ME.GEN.prepare === K.FUNCTION) {
    const basePrepare = ME.GEN.prepare;
    ME.GEN.prepare = async function () {
      const r = await basePrepare.apply(this, arguments);
      await preloadBoard(arguments[0]);
      return r;
    };
  }
  ME.SVG2D_PRELOAD = preloadBoard;

  function bgInit(ctx, bg) {
    ASSETS.board = boardOf(ctx.spec);
    const k = bg && bg.location;
    const a = k && ASSETS.sets[k];
    return a ? { svg2d: true, loc: k, time: bg.time } : null;
  }
  function bgDraw(g, ctx, st) {
    const a = st && ASSETS.sets[st.loc];
    if (!a) return;
    const u = clamp(num(ctx.t, 0) / Math.max(1, num(ctx.dur, K.BG.DUR)), 0, 1);
    const s = Math.max(ctx.W / K.BOARD.SET_W, ctx.H / K.BOARD.SET_H) * (K.BG.ZOOM0 + K.BG.ZOOM1 * u);
    const w = K.BOARD.SET_W * s, h = K.BOARD.SET_H * s;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(a.img, (ctx.W - w) / 2, (ctx.H - h) / 2, w, h);
    if (a.fg) g.drawImage(a.fg, (ctx.W - w) / 2, (ctx.H - h) / 2, w, h);
    if (K.RE.BG_NIGHT.test(String(st.time || "")) && !K.RE.BG_NIGHT.test(String((a.meta && a.meta.time) || ""))) {
      g.fillStyle = K.BG.NIGHT_FILL;
      g.fillRect(0, 0, ctx.W, ctx.H);
    }
  }

  function boardEntry(board, text) {
    if (!board || !board.sentences) return null;
    const parts = String(text || "").match(K.BOARD.SENT_RE) || [text];
    let best = null;
    for (const p of parts) {
      const e = board.sentences[boardKey(p)];
      if (e && (!best || (best.mode === K.BOARD.PEOPLE && e.mode !== K.BOARD.PEOPLE))) best = e;
    }
    return best || board.sentences[boardKey(text)] || null;
  }

  function boardVignette(e, text) {
    if (e.mode === K.BOARD.PEOPLE) return null;
    const objs = (e.objects || []).map((o) => o.key);
    const o0 = (e.objects || [])[0] || {};
    const low = String(text || "").toLowerCase();
    const has = (s) => (e.objects || []).some((o) => o.state === s);
    const mods = {};
    for (const k of Object.keys(VIG_MODS)) mods[k] = has(k) || VIG_MODS[k].test(low);
    if (has(K.BOARD.UP)) mods.down = false;
    if (has(K.BOARD.DOWN)) mods.up = false;
    if (has(K.BOARD.LIT)) mods.out = false;
    return { kind: e.mode === K.BOARD.CUTAWAY ? K.BOARD.CUTAWAY : e.kind, objs, color: o0.color || null, count: o0.count || 1, mods, casts: [e.subject, e.target].filter(Boolean), solo: !e.target, self: false, items: e.items || [], light: e.light || null, board: true, text: low };
  }

  function propAsset(key) {
    const b = ASSETS.board;
    return b && b.props && b.props[key] && ASSETS.props[key] && ASSETS.props[key].meta.svg === b.props[key].svg ? ASSETS.props[key] : null;
  }

  function drawPropImage(g, key, x, y, h, rot, alpha) {
    const a = propAsset(key);
    if (!a) return false;
    const m = a.meta, img = a.img;
    const box = K.BOARD.PROP_BOX;
    const s = h / box;
    g.save();
    g.translate(x, y);
    g.rotate((rot || 0) * DEG);
    if (alpha != null) g.globalAlpha = alpha;
    g.drawImage(img, -(m.base ? m.base[0] : box / 2) * s, -(m.base ? m.base[1] : box) * s, box * s, box * s);
    g.restore();
    return true;
  }

  function drawCutaway(g, ctx, S, vg, k, line, lw) {
    const W = ctx.W, H = ctx.H;
    const items = vg.items && vg.items.length ? vg.items : vg.objs.map((key, i, arr) => ({ key, x: (i + 1) / (arr.length + 1), y: 0.8, scale: 0.45 }));
    vigBackdrop(g, S, W, H, K.BOARD.CUT_FLOOR, vg.light);
    items.forEach((it, i) => {
      const enter = ease(clamp(k * 4 - i * 0.25, 0, 1));
      if (enter <= 0) return;
      const sway = Math.sin(ctx.abs * 1.3 + i * 1.7) * K.BOARD.SWAY;
      const x = it.x * W, y = it.y * H, h = it.scale * H * (0.92 + 0.08 * enter);
      g.globalAlpha = enter;
      if (!drawPropImage(g, it.key, x, y, h, sway, enter) && codeAlias(it.key)) vigObject(g, it.key, x, y - h / 2, h, { color: vg.color, rot: sway }, line, lw, ctx.abs);
      g.globalAlpha = 1;
    });
  }

  function setFit(S, set) {
    const sc = Math.max(S.VW / K.BOARD.SET_W, S.VH / K.BOARD.SET_H);
    return { sc, ox: (S.VW - K.BOARD.SET_W * sc) / 2, oy: S.VH - K.BOARD.SET_H * sc };
  }

  function drawLying(g, A, pose, lw, S, tt) {
    const R = A.R, I = R.info;
    const tot = R.legH + R.bodyH + R.headH;
    const L = K.LIE;
    const dir = A.s.facing >= 0 ? -1 : 1;
    const tint = (c) => (S.grade ? scaleHex(c, K.ACTOR_TINT) : c);
    g.beginPath();
    g.rect(-tot * L.BED_W, -tot * L.BED_H, tot * L.BED_W * 2, tot * L.BED_H);
    fillStroke(g, tint(K.VIG.WOOD), R.outline, lw);
    const hx = dir * tot * (L.BED_W - L.PILLOW * 1.2), hy = -tot * L.BED_H - R.headH * 0.32;
    g.beginPath();
    g.ellipse(hx, -tot * L.BED_H - R.headH * 0.05, R.headW * 0.62, R.headH * 0.16, 0, 0, Math.PI * 2);
    fillStroke(g, tint(K.VIG.PAPER), R.outline, lw);
    const br = 1 + Math.sin(tt * 1.6) * 0.03;
    const bx0 = Math.min(hx - dir * R.headW * 0.4, -dir * tot * (L.BED_W - 0.04)), bx1 = Math.max(hx - dir * R.headW * 0.4, -dir * tot * (L.BED_W - 0.04));
    g.beginPath();
    if (g.roundRect) g.roundRect(bx0, -tot * (L.BED_H + L.BLANKET_H * br), bx1 - bx0, tot * L.BLANKET_H * br, tot * 0.08);
    else g.rect(bx0, -tot * (L.BED_H + L.BLANKET_H * br), bx1 - bx0, tot * L.BLANKET_H * br);
    fillStroke(g, tint(I.top), R.outline, lw);
    const r = R.headH * 0.5;
    g.beginPath();
    g.arc(hx, hy, r, 0, Math.PI * 2);
    fillStroke(g, I.skin, R.outline, lw);
    g.fillStyle = I.eye || K.VIG.EYE;
    g.strokeStyle = I.eye || K.VIG.EYE;
    const closed = pose.eye < 0.5 || !K.RE.FEAR.test(String(A.a.expression || ""));
    for (const dx of [-0.36, 0.36]) {
      g.beginPath();
      if (closed) {
        g.lineWidth = r * 0.08;
        g.moveTo(hx + dx * r - r * 0.16, hy - r * 0.05);
        g.lineTo(hx + dx * r + r * 0.16, hy - r * 0.05);
        g.stroke();
      } else {
        g.ellipse(hx + dx * r, hy - r * 0.05, r * 0.15, r * 0.25, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function drawSetBack(g, ctx, S, set, sc, tx, ty) {
    const fit = setFit(S, set);
    const sw = K.BOARD.SET_W * fit.sc, sh = K.BOARD.SET_H * fit.sc;
    g.fillStyle = K.BLACK;
    g.fillRect(0, 0, ctx.W, ctx.H);
    g.setTransform(sc, 0, 0, sc, tx, ty);
    g.drawImage(set.img, fit.ox, fit.oy, sw, sh);
    if (S.grade && K.BOARD.DARK_RE.test(S.timeKey) !== K.BOARD.DARK_RE.test(String(set.meta.time || K.BOARD.LIGHT_DAY))) {
      g.globalCompositeOperation = K.BOARD.MULTIPLY;
      g.fillStyle = S.grade;
      g.fillRect(fit.ox, fit.oy, sw, sh);
      g.globalCompositeOperation = K.SOURCE_OVER;
    }
    g.globalCompositeOperation = K.LIGHTER;
    for (const l of set.meta.lights || []) {
      const x = fit.ox + l.x * fit.sc, y = fit.oy + l.y * fit.sc;
      const fl = 0.8 + 0.2 * noise(ctx.abs * 8, l.x * 0.01);
      const r = S.VH * 0.22;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, rgba(l.color, 0.3 * fl));
      gr.addColorStop(1, rgba(l.color, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = K.SOURCE_OVER;
  }

  function setOf(S) {
    const b = ASSETS.board, k = S.P.location;
    return b && b.sets && b.sets[k] && ASSETS.sets[k] && ASSETS.sets[k].meta.svg === b.sets[k].svg ? ASSETS.sets[k] : null;
  }

  function buildSentences(S, ctx) {
    const subs = (ctx.spec && Array.isArray(ctx.spec.subtitles) ? ctx.spec.subtitles : []).slice().sort((a, b) => a.start - b.start);
    const s0 = ctx.abs - ctx.t, s1 = s0 + ctx.dur;
    const groups = [];
    let cur = null;
    for (const u of subs) {
      if (!u || u.end <= s0 || u.start >= s1) continue;
      if (!cur) cur = { start: Math.max(s0, u.start), end: Math.min(s1, u.end), text: "" };
      cur.text += (cur.text ? " " : "") + String(u.text || "");
      cur.end = Math.min(s1, u.end);
      if (K.VIG.END_RE.test(String(u.text || ""))) {
        groups.push(cur);
        cur = null;
      }
    }
    if (cur) groups.push(cur);
    const merged = [];
    for (const gq of groups) {
      const prev = merged[merged.length - 1];
      if (prev && gq.end - gq.start < K.VIG.MIN_SENT) {
        prev.end = gq.end;
        prev.text += " " + gq.text;
      } else merged.push(gq);
    }
    if (merged.length) {
      merged[0].start = s0;
      for (let i = 1; i < merged.length; i++) merged[i].start = merged[i - 1].end;
      merged[merged.length - 1].end = s1;
    }
    const casts = Object.keys((S.G && S.G.cast) || {});
    const mem = vigColorMemory(ctx.spec, casts);
    const speech = S.P.speech || {};
    const tOff = num(S.P.tOffset, 0);
    return merged.map((m, i) => {
      const a = m.start - s0 + tOff, b = m.end - s0 + tOff;
      let speaker = null, best = 0;
      for (const c of Object.keys(speech)) {
        if (!S.rigs[c]) continue;
        let ov = 0;
        for (const r of speech[c] || []) if (Array.isArray(r)) ov += Math.max(0, Math.min(b, r[1]) - Math.max(a, r[0]));
        if (ov > best) {
          best = ov;
          speaker = c;
        }
      }
      const sp = best > (b - a) * 0.25 ? speaker : null;
      const e = boardEntry(boardOf(ctx.spec), m.text);
      let vg, act = null, acts = null, cam = null, light = null;
      if (e) {
        vg = boardVignette(e, m.text);
        light = e.light || null;
        if (!vg) {
          acts = {};
          for (const ac of e.actors || []) acts[ac.cast] = { action: ac.pose, expression: ac.expression, face: ac.face };
          if (sp && S.rigs[sp]) {
            for (const c of Object.keys(acts)) if (c !== sp && acts[c].action === K.ACTION.TALK) acts[c].action = K.ACTION.IDLE;
            const listener = Object.keys(acts).find((c) => c !== sp);
            if (!acts[sp]) acts[sp] = { action: K.ACTION.TALK, expression: null, face: listener || null };
            else if (acts[sp].action === K.ACTION.IDLE) acts[sp].action = K.ACTION.TALK;
          }
          cam = { shot: e.camera, focus: e.subject || sp || ((e.actors || [])[0] || {}).cast };
        }
      } else {
        vg = parseVignette(m.text, casts);
        act = parseAct(m.text, casts);
        if (act) act.cast = act.cast === K.SELF_KEY ? S.narrator : act.cast || sp;
      }
      if (vg && !vg.color && vg.objs[0] && mem[vg.objs[0]]) vg.color = mem[vg.objs[0]](m.start);
      return Object.assign(m, { i, speaker: sp, vg, act, acts, cam, light });
    });
  }

  function vigColorMemory(spec, casts) {
    if (spec.__vigMem) return spec.__vigMem;
    const subs = (Array.isArray(spec.subtitles) ? spec.subtitles : []).slice().sort((a, b) => a.start - b.start);
    const marks = {};
    for (const u of subs) {
      const v = parseVignette(u.text, casts);
      const low = String(u.text || "").toLowerCase();
      for (const o of vigObjects(low)) {
        const at = low.search(VIG_OBJECTS.find((x) => x[0] === o)[1]);
        const c = vigColor(low, at);
        if (c && !(v && v.mods.fade)) (marks[o] = marks[o] || []).push([u.start, c]);
      }
    }
    const mem = {};
    for (const o of Object.keys(marks)) {
      const list = marks[o];
      mem[o] = (t) => {
        let c = list[0][1];
        for (const [ts, col] of list) if (ts <= t) c = col;
        return c;
      };
    }
    spec.__vigMem = mem;
    return mem;
  }

  function sentenceAt(S, ctx) {
    if (!S.sents) S.sents = buildSentences(S, ctx);
    const abs = ctx.abs;
    return S.sents.find((m) => abs >= m.start && abs < m.end) || S.sents[S.sents.length - 1] || null;
  }

  function vigBackdrop(g, S, W, H, floor, light) {
    const key = light === K.BOARD.LIGHT_NIGHT ? "night" : light === K.BOARD.LIGHT_DAY || light === K.BOARD.LIGHT_DAWN ? "day" : light === K.BOARD.LIGHT_LAMP ? "interior" : S.night ? "night" : S.stage.interior ? "interior" : "day";
    const c = K.VIG.BG[key];
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, c[0]);
    gr.addColorStop(1, c[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    if (floor) {
      const fy = H * floor;
      g.fillStyle = S.loc.ground.color;
      g.fillRect(0, fy, W, H - fy);
      g.strokeStyle = scaleHex(S.loc.ground.color, K.GROUND.LINE_DARK);
      g.lineWidth = Math.max(1, H / 500);
      g.beginPath();
      for (let i = 0; i < 7; i++) {
        const y = fy + (H - fy) * Math.pow(i / 6, 1.6);
        g.moveTo(0, y);
        g.lineTo(W, y);
      }
      for (let i = -6; i <= 6; i++) {
        g.moveTo(W / 2 + i * W * 0.05, fy);
        g.lineTo(W / 2 + i * W * 0.22, H);
      }
      g.stroke();
    }
    const sp = g.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, H * 0.7);
    sp.addColorStop(0, K.VIG.SPOT);
    sp.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sp;
    g.fillRect(0, 0, W, H);
  }

  function vigArm(g, x0, y0, x1, y1, thick, sleeve, skin, line, lw, open) {
    g.lineCap = K.ROUND;
    g.strokeStyle = line;
    g.lineWidth = thick + lw * 2;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.strokeStyle = sleeve;
    g.lineWidth = thick;
    g.stroke();
    g.beginPath();
    if (open) g.ellipse(x1, y1, thick * 0.75, thick * 0.55, Math.atan2(y1 - y0, x1 - x0), 0, Math.PI * 2);
    else g.arc(x1, y1, thick * 0.62, 0, Math.PI * 2);
    fillStroke(g, skin, line, lw);
  }

  function vigPalm(g, x, y, r, skin, line, lw) {
    g.beginPath();
    g.roundRect ? g.roundRect(x - r, y - r * 1.1, r * 2, r * 2.2, r * 0.8) : g.rect(x - r, y - r * 1.1, r * 2, r * 2.2);
    fillStroke(g, skin, line, lw);
    g.beginPath();
    g.ellipse(x - r * 1.05, y + r * 0.2, r * 0.35, r * 0.7, -0.5, 0, Math.PI * 2);
    fillStroke(g, skin, line, lw);
    g.strokeStyle = line;
    g.lineWidth = lw * 0.6;
    g.beginPath();
    for (let i = 1; i < 4; i++) {
      g.moveTo(x - r + (2 * r * i) / 4, y - r * 1.1);
      g.lineTo(x - r + (2 * r * i) / 4, y - r * 0.55);
    }
    g.stroke();
  }

  function vigFace(g, x, y, r, line, lw, closed) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    fillStroke(g, K.VIG.SKIN, line, lw);
    g.fillStyle = K.VIG.EYE;
    g.strokeStyle = K.VIG.EYE;
    for (const dx of [-0.36, 0.36]) {
      g.beginPath();
      if (closed) {
        g.lineWidth = Math.max(1.5, r * 0.08);
        g.moveTo(x + dx * r - r * 0.16, y - r * 0.05);
        g.lineTo(x + dx * r + r * 0.16, y - r * 0.05);
        g.stroke();
      } else {
        g.ellipse(x + dx * r, y - r * 0.05, r * 0.16, r * 0.26, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  function codeAlias(key) {
    if (K.BOARD.CODE_OBJECTS.indexOf(key) >= 0) return key;
    return K.BOARD.CODE_OBJECTS.find((c) => String(key).split(K.VIG.UNDERSCORE).indexOf(c) >= 0) || null;
  }

  function vigObject(g, key, x, y, s, o, line, lw, t) {
    if (!propAsset(key) && codeAlias(key) && codeAlias(key) !== key) {
      const alias = codeAlias(key);
      return vigObject(g, alias, x, y, s, Object.assign({}, o, { color: o.color || wordColor(String(key).replace(K.VIG.UNDERSCORE_RE, " "), null) }), line, lw, t);
    }
    if (propAsset(key)) {
      if (o.glow) {
        const gr = g.createRadialGradient(x, y, 0, x, y, s * 1.6);
        gr.addColorStop(0, rgba(o.glow, 0.45 * (o.glowK == null ? 1 : o.glowK)));
        gr.addColorStop(1, rgba(o.glow, 0));
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, s * 1.6, 0, Math.PI * 2);
        g.fill();
      }
      drawPropImage(g, key, x, y + s / 2, s, o.rot || 0);
      return;
    }
    const col = o.color;
    g.save();
    g.translate(x, y);
    g.rotate((o.rot || 0) * DEG);
    if (o.glow) {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
      gr.addColorStop(0, rgba(o.glow, 0.45 * (o.glowK == null ? 1 : o.glowK)));
      gr.addColorStop(1, rgba(o.glow, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, s * 1.6, 0, Math.PI * 2);
      g.fill();
    }
    if (key === "card") {
      const w = s * 0.62, h = s;
      g.beginPath();
      g.roundRect ? g.roundRect(-w / 2, -h / 2, w, h, s * 0.06) : g.rect(-w / 2, -h / 2, w, h);
      if (o.faceDown) {
        fillStroke(g, K.VIG.PAPER, line, lw);
        g.save();
        g.clip();
        g.strokeStyle = scaleHex(col || K.VIG.BLOOD, 0.9);
        g.lineWidth = s * 0.04;
        for (let i = -6; i < 8; i++) {
          g.beginPath();
          g.moveTo(-w / 2 + i * s * 0.12, -h / 2);
          g.lineTo(-w / 2 + i * s * 0.12 + h, h / 2);
          g.stroke();
        }
        g.restore();
      } else {
        fillStroke(g, col || K.VIG.PAPER, line, lw);
        g.beginPath();
        g.rect(-w * 0.36, -h * 0.4, w * 0.72, h * 0.8);
        g.strokeStyle = K.VIG.PAPER;
        g.lineWidth = s * 0.03;
        g.stroke();
        g.beginPath();
        g.arc(0, 0, w * 0.2, 0, Math.PI * 2);
        g.fillStyle = K.VIG.PAPER;
        g.fill();
      }
    } else if (key === "paper" || key === "book") {
      const w = s * (key === "book" ? 1.3 : 0.8), h = s * 0.95;
      g.beginPath();
      g.rect(-w / 2, -h / 2, w, h);
      fillStroke(g, col || K.VIG.PAPER, line, lw);
      g.strokeStyle = rgba(K.BLACK, 0.45);
      g.lineWidth = s * 0.025;
      g.beginPath();
      if (key === "book") {
        g.moveTo(0, -h / 2);
        g.lineTo(0, h / 2);
      }
      const cols = key === "book" ? [-w * 0.42, w * 0.08] : [-w * 0.38];
      for (const cx of cols) for (let i = 0; i < 6; i++) {
        g.moveTo(cx, -h * 0.35 + i * h * 0.13);
        g.lineTo(cx + w * (key === "book" ? 0.34 : 0.7) * (0.6 + 0.4 * hash(i + cx)), -h * 0.35 + i * h * 0.13);
      }
      g.stroke();
    } else if (key === "beads") {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        g.beginPath();
        g.arc(Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.55, s * 0.08, 0, Math.PI * 2);
        fillStroke(g, col || K.VIG.WOOD, line, lw * 0.6);
      }
    } else if (key === "incense" || key === "candle" || key === "lamp") {
      g.beginPath();
      g.rect(-s * 0.35, s * 0.1, s * 0.7, s * 0.4);
      fillStroke(g, key === "incense" ? K.VIG.BRONZE : col || K.VIG.PAPER, line, lw);
      const sticks = key === "incense" ? [-0.15, 0, 0.15] : [0];
      for (const dx of sticks) {
        g.beginPath();
        g.moveTo(dx * s, s * 0.1);
        g.lineTo(dx * s * 1.4, -s * 0.6);
        g.strokeStyle = key === "incense" ? "#b0412f" : K.VIG.PAPER;
        g.lineWidth = key === "incense" ? s * 0.035 : s * 0.18;
        g.stroke();
        if (!o.out) {
          const fx = dx * s * 1.4, fy = -s * 0.62;
          const fl = 0.8 + 0.2 * Math.sin(t * 13 + dx * 9);
          g.beginPath();
          if (key === "incense") g.arc(fx, fy, s * 0.03, 0, Math.PI * 2);
          else g.ellipse(fx, fy - s * 0.1 * fl, s * 0.07, s * 0.14 * fl, 0, 0, Math.PI * 2);
          g.fillStyle = key === "incense" ? "#ff5a2a" : K.VIG.FLAME;
          g.fill();
          if (key === "incense") {
            for (let i = 0; i < 2; i++) {
              const ph = (t * 0.4 + i * 0.5 + dx) % 1;
              g.beginPath();
              g.moveTo(fx, fy);
              g.bezierCurveTo(fx + Math.sin(t * 2 + i) * s * 0.1, fy - s * 0.4 * ph, fx - Math.sin(t * 1.7 + i) * s * 0.15, fy - s * 0.8 * ph, fx + Math.sin(t + i) * s * 0.1, fy - s * 1.2 * ph);
              g.strokeStyle = "rgba(220,220,225," + (0.5 * (1 - ph)).toFixed(3) + ")";
              g.lineWidth = s * 0.03;
              g.stroke();
            }
          }
        }
      }
    } else if (key === "bell") {
      const sw = o.swing ? Math.sin(t * 5) * 14 : 0;
      g.rotate(sw * DEG);
      g.beginPath();
      g.moveTo(-s * 0.15, -s * 0.5);
      g.quadraticCurveTo(-s * 0.4, -s * 0.45, -s * 0.42, s * 0.3);
      g.lineTo(s * 0.42, s * 0.3);
      g.quadraticCurveTo(s * 0.4, -s * 0.45, s * 0.15, -s * 0.5);
      g.closePath();
      fillStroke(g, K.VIG.BRONZE, line, lw);
      g.beginPath();
      g.arc(0, s * 0.36, s * 0.07, 0, Math.PI * 2);
      fillStroke(g, scaleHex(K.VIG.BRONZE, 0.7), line, lw);
    } else if (key === "bowl") {
      g.beginPath();
      g.arc(0, -s * 0.05, s * 0.32, Math.PI, 0);
      fillStroke(g, K.VIG.PAPER, line, lw);
      g.beginPath();
      g.moveTo(-s * 0.45, 0);
      g.quadraticCurveTo(0, s * 0.55, s * 0.45, 0);
      g.closePath();
      fillStroke(g, col || "#3d6f9a", line, lw);
    } else if (key === "portrait") {
      g.beginPath();
      g.rect(-s * 0.35, -s * 0.45, s * 0.7, s * 0.9);
      fillStroke(g, K.VIG.WOOD, line, lw);
      g.beginPath();
      g.rect(-s * 0.27, -s * 0.37, s * 0.54, s * 0.74);
      g.fillStyle = "#d9d2c2";
      g.fill();
      g.beginPath();
      g.arc(0, -s * 0.08, s * 0.13, 0, Math.PI * 2);
      g.moveTo(-s * 0.2, s * 0.33);
      g.quadraticCurveTo(0, s * 0.02, s * 0.2, s * 0.33);
      g.fillStyle = "#3a3432";
      g.fill();
    } else {
      g.beginPath();
      g.roundRect ? g.roundRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7, s * 0.08) : g.rect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
      fillStroke(g, col || K.VIG.PAPER, line, lw);
    }
    g.restore();
  }

  function vigRig(g, S, cast, x, y, h, pose, facing, lw, dark) {
    const R = S.rigs[cast] || Object.values(S.rigs)[0];
    if (!R) return;
    const total = R.legH + R.bodyH + R.headH;
    const k = h / total;
    g.save();
    g.translate(x, y);
    g.scale(k, k);
    const p = Object.assign(rigPose(R, K.ACTION.IDLE, 0, 0, false, 0), pose || {});
    drawRig(g, R, p, facing || 1, lw / k, dark ? 0.12 : 1);
    g.restore();
  }

  function vigEnsureRig(S, c) {
    if (!c || S.rigs[c] || !(S.G.cast || {})[c]) return;
    S.rigs[c] = buildRig(c, S.G.cast[c], S.metrics, S.outline);
  }

  function drawVignette(g, ctx, S, sent) {
    const vg = sent.vg;
    vigEnsureRig(S, S.narrator);
    for (const c of vg.casts) vigEnsureRig(S, c);
    const W = ctx.W, H = ctx.H, u = H / 720;
    const line = S.outline, lw = Math.max(1.5, S.outlinePx * u);
    const k = clamp((ctx.abs - sent.start) / Math.max(0.3, sent.end - sent.start), 0, 1);
    const tt = ctx.abs;
    const castsInShot = (S.P.actors || []).map((a) => a.cast).filter((c) => S.rigs[c]);
    const who = vg.casts.filter((c) => S.rigs[c]);
    const main = (vg.self && S.narrator && S.rigs[S.narrator] ? S.narrator : who[0]) || S.focusCast || castsInShot[0];
    const other = who[1] || castsInShot.find((c) => c !== main) || main;
    const sleeveOf = (c, d) => (S.rigs[c] && S.rigs[c].info && S.rigs[c].info.top) || d;
    const skinOf = (c) => (S.rigs[c] && S.rigs[c].info && S.rigs[c].info.skin) || K.VIG.SKIN;
    const obj = vg.objs[0] || K.VIG.DEFAULT_OBJ;
    const oCol = vg.color || (obj === "paper" ? (vg.mods.fade ? K.VIG.PAPER : null) : null);
    const objStyle = (extra) => Object.assign({ color: vg.mods.fade ? mixHex(oCol || "#b8433a", K.VIG.PAPER, ease(k)) : oCol, faceDown: vg.mods.down && !vg.mods.up }, extra || {});
    const T = 0.11 * H;
    const kind = vg.kind;
    g.save();
    if (kind === K.BOARD.CUTAWAY) {
      drawCutaway(g, ctx, S, vg, k, line, lw);
    } else if (kind === K.BOARD.FOCUS) {
      vigBackdrop(g, S, W, H, 0.72, vg.light);
      const objs = vg.objs.length ? vg.objs : [obj];
      objs.forEach((o, i) => {
        const x = W * (objs.length > 1 ? 0.35 + (0.3 * i) / (objs.length - 1) : 0.5);
        const bob = Math.sin(tt * 1.4 + i) * H * 0.008;
        vigObject(g, o, x, H * 0.48 + bob, H * (objs.length > 1 ? 0.3 : 0.42), objStyle({ rot: Math.sin(tt * 0.9 + i) * 3, glow: vg.mods.cold ? K.VIG.FROST : vg.mods.warm || !vg.mods.out ? K.VIG.GLOW : null, glowK: 0.45, color: i ? null : objStyle().color }), line, lw, tt);
      });
    } else if (kind === "give" || kind === "take") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      const meet = W * 0.5, my = H * 0.58;
      const inK = ease(clamp(k / 0.35, 0, 1));
      const handA = [lerp(-W * 0.05, meet - W * 0.07, inK), my];
      const handB = [meet + W * 0.07, my + H * 0.02];
      let pass = ease(clamp((k - 0.35) / 0.25, 0, 1));
      if (vg.mods.back) pass = pass * (1 - ease(clamp((k - 0.7) / 0.2, 0, 1)));
      const outK = vg.mods.back ? 0 : ease(clamp((k - 0.7) / 0.3, 0, 1));
      const takeText = String(vg.text || sent.text || "").toLowerCase();
      const takeMode = kind !== "take" ? null : K.VIG.TAKE_POCKET_RE.test(takeText) ? K.VIG.TAKE_POCKET : K.VIG.TAKE_FLOOR_RE.test(takeText) || vg.solo || !who[1] ? K.VIG.TAKE_FLOOR : null;
      if (takeMode === K.VIG.TAKE_FLOOR) {
        const reach = ease(clamp(k / 0.4, 0, 1)), lift = ease(clamp((k - 0.45) / 0.45, 0, 1));
        const floorY = H * 0.64;
        g.fillStyle = scaleHex(S.loc.ground.color, 0.8);
        g.fillRect(0, floorY, W, H - floorY);
        g.strokeStyle = line;
        g.lineWidth = lw;
        g.beginPath();
        g.moveTo(0, floorY);
        g.lineTo(W, floorY);
        g.stroke();
        const cx = W * 0.56, cy = H * 0.74;
        const hx = lerp(lerp(W * 0.2, cx, reach), W * 0.5, lift), hy = lerp(lerp(-H * 0.1, cy - H * 0.04, reach), H * 0.4, lift);
        if (lift > 0) vigObject(g, obj, hx + T * 0.3, hy + H * 0.02, H * 0.22, objStyle({ rot: lerp(78, -8, lift) }), line, lw, tt);
        else vigObject(g, obj, cx, cy, H * 0.2, objStyle({ rot: 78 }), line, lw, tt);
        vigArm(g, -W * 0.1, -H * 0.2, hx, hy, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
      } else if (takeMode === K.VIG.TAKE_POCKET) {
        const dip = ease(clamp(k / 0.35, 0, 1)), pull = ease(clamp((k - 0.4) / 0.45, 0, 1));
        const torso = sleeveOf(main, K.VIG.SLEEVE);
        g.beginPath();
        if (g.roundRect) g.roundRect(W * 0.56, H * 0.1, W * 0.6, H * 1.05, H * 0.14);
        else g.rect(W * 0.56, H * 0.1, W * 0.6, H * 1.05);
        fillStroke(g, torso, line, lw);
        const px = W * 0.66, py = H * 0.5, pw = W * 0.17, ph = H * 0.17;
        const hx = lerp(lerp(-W * 0.05, px + pw * 0.45, dip), W * 0.44, pull), hy = lerp(lerp(H * 0.7, py + ph * 0.2, dip), H * 0.36, pull);
        if (pull > 0) vigObject(g, obj, hx + T * 0.35, hy - H * 0.05, H * 0.22, objStyle({ rot: -14 + 10 * pull }), line, lw, tt);
        else if (dip >= 1) vigObject(g, obj, px + pw * 0.5, py + ph * 0.1, H * 0.2, objStyle({ rot: -4 }), line, lw, tt);
        g.beginPath();
        g.rect(px, py, pw, ph);
        fillStroke(g, scaleHex(torso, 0.78), line, lw);
        vigArm(g, -W * 0.1, H * 0.9, hx, hy, T, torso, skinOf(main), line, lw, false);
      } else if (kind === "take") {
        const grab = ease(clamp(k / 0.45, 0, 1)), pull = ease(clamp((k - 0.55) / 0.45, 0, 1));
        vigArm(g, W * 1.05, H * 0.75, W * 0.72, H * 0.62, T, sleeveOf(other, K.VIG.SLEEVE_B), skinOf(other), line, lw, true);
        const hx = lerp(-W * 0.05, W * 0.62, grab) - pull * W * 0.5;
        vigArm(g, -W * 0.1, H * 0.6, hx, H * 0.6, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
        const ox = grab < 1 ? W * 0.68 : hx + T * 0.4;
        vigObject(g, obj, ox, H * 0.56, H * 0.22, objStyle({ rot: -8 }), line, lw, tt);
      } else {
        vigArm(g, W * 1.05, H * 0.7, handB[0], handB[1], T, sleeveOf(other, K.VIG.SLEEVE_B), skinOf(other), line, lw, true);
        const ax = handA[0] - outK * W * 0.6;
        vigArm(g, -W * 0.08, H * 0.72, ax, handA[1], T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
        const ox = lerp(ax + T * 0.5, handB[0] - T * 0.2, pass);
        const objs = vg.objs.length ? vg.objs : [obj];
        objs.forEach((o, i) => vigObject(g, o, ox + i * H * 0.12, handA[1] - H * 0.06 - i * H * 0.05, H * 0.22, objStyle({ rot: -10 + i * 14, color: i ? null : objStyle().color }), line, lw, tt));
      }
    } else if (kind === "hold") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      const shake = vg.mods.shake ? Math.sin(tt * 38) * H * 0.012 * (k > 0.3 ? 1 : 0) : 0;
      const cx = W * 0.5 + shake, cy = H * 0.5;
      const glow = vg.mods.cold ? K.VIG.FROST : vg.mods.warm ? K.VIG.GLOW : null;
      vigArm(g, W * 0.62, H * 1.15, cx + H * 0.05, cy + H * 0.16, T * 1.2, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, true);
      const st = objStyle({ rot: -6 + shake * 0.2, glow, glowK: vg.mods.cold ? ease(k) : 0.7 + 0.3 * Math.sin(tt * 3) });
      if (vg.mods.cold) st.color = mixHex(st.color || "#b8433a", K.VIG.FROST, 0.45 * ease(k));
      vigObject(g, obj, cx, cy, H * 0.34, st, line, lw, tt);
      g.beginPath();
      g.arc(cx + H * 0.07, cy + H * 0.12, T * 0.55, 0, Math.PI * 2);
      fillStroke(g, skinOf(main), line, lw);
    } else if (kind === "down") {
      vigBackdrop(g, S, W, H, 0.55, vg.light);
      g.fillStyle = K.VIG.DOOR;
      g.fillRect(W * 0.36, H * 0.12, W * 0.28, H * 0.43);
      g.fillStyle = scaleHex(S.loc.ground.color, 0.7);
      g.fillRect(W * 0.3, H * 0.55, W * 0.4, H * 0.05);
      const n = vg.count;
      for (let i = 0; i < n; i++) {
        const appear = n > 1 ? clamp((k * 1.15 - i / n) * n, 0, 1) : 1;
        if (appear <= 0) continue;
        const ang = (hash(i * 3.3) - 0.5) * 50;
        const x = n > 1 ? W * (0.2 + 0.6 * ((i + 0.5) / n)) : W * 0.5;
        const y = n > 1 ? H * (0.72 + 0.12 * hash(i * 7.1)) : H * 0.75;
        g.globalAlpha = appear;
        vigObject(g, obj, x, y, H * (n > 1 ? 0.16 : 0.24), objStyle({ rot: obj === K.VIG.DEFAULT_OBJ ? ang + 90 : 0, glow: n === 1 ? K.VIG.GLOW : null, glowK: 0.5 }), line, lw, tt);
        g.globalAlpha = 1;
      }
    } else if (kind === "footprints") {
      vigBackdrop(g, S, W, H, 0.42, vg.light);
      g.fillStyle = K.VIG.DOOR;
      g.fillRect(W * 0.42, H * 0.14, W * 0.16, H * 0.28);
      const n = Math.max(2, vg.count) * 3;
      for (let i = 0; i < n; i++) {
        const a = clamp((k * 1.2 - i / n) * n, 0, 1);
        if (a <= 0) continue;
        const z = i / n;
        const y = lerp(H * 0.95, H * 0.47, z), x = W * 0.5 + (i % 2 ? 1 : -1) * lerp(W * 0.05, W * 0.015, z);
        const sz = lerp(H * 0.06, H * 0.02, z);
        g.globalAlpha = a * 0.85;
        g.beginPath();
        g.ellipse(x, y, sz * 0.45, sz, 0, 0, Math.PI * 2);
        g.fillStyle = scaleHex(S.loc.ground.color, 0.55);
        g.fill();
        g.globalAlpha = 1;
      }
    } else if (kind === "grab" && !K.VIG.ANKLE_RE.test(vg.text || "")) {
      vigBackdrop(g, S, W, H, 0, vg.light);
      const reach = ease(clamp(k / 0.45, 0, 1));
      const ghost = K.VIG.GHOST_RE.test(vg.text || "");
      vigArm(g, W * 1.05, H * 0.62, W * 0.56, H * 0.56, T, sleeveOf(other, K.VIG.SLEEVE_B), skinOf(other), line, lw, false);
      const hx = lerp(-W * 0.05, W * 0.53, reach), hy = lerp(H * 0.75, H * 0.58, reach);
      vigArm(g, -W * 0.08, H * 0.8, hx, hy, T * 1.05, ghost ? K.VIG.GHOST_HAND : sleeveOf(main, K.VIG.SLEEVE), ghost ? scaleHex(K.VIG.GHOST_HAND, 1.15) : skinOf(main), line, lw, true);
      if (reach >= 1) {
        g.strokeStyle = line;
        g.lineWidth = lw;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(hx + T * 0.1 + i * T * 0.16, hy - T * 0.45);
          g.lineTo(hx + T * 0.2 + i * T * 0.16, hy + T * 0.1);
          g.stroke();
        }
      }
    } else if (kind === "grab") {
      vigBackdrop(g, S, W, H, 0.7, vg.light);
      const lx = W * 0.5;
      g.beginPath();
      g.rect(lx - H * 0.07, -H * 0.05, H * 0.14, H * 0.72);
      fillStroke(g, scaleHex(sleeveOf(main, K.VIG.SLEEVE), 0.75), line, lw);
      g.beginPath();
      g.ellipse(lx + H * 0.05, H * 0.7, H * 0.13, H * 0.05, 0, 0, Math.PI * 2);
      fillStroke(g, "#1e1c20", line, lw);
      const reach = ease(clamp(k / 0.5, 0, 1));
      const hx = lerp(W * 0.15, lx - H * 0.02, reach), hy = lerp(H * 1.1, H * 0.6, reach);
      vigArm(g, W * 0.05, H * 1.15, hx, hy, T * 0.9, K.VIG.GHOST_HAND, scaleHex(K.VIG.GHOST_HAND, 1.15), line, lw, true);
      g.fillStyle = K.VIG.SAND;
      for (let i = 0; i < 14; i++) g.fillRect(hx + (hash(i) - 0.5) * T, hy + (hash(i + 4) - 0.5) * T * 0.8, 2 * u, 2 * u);
      if (reach >= 1) {
        g.strokeStyle = line;
        g.lineWidth = lw;
        for (let i = 0; i < 4; i++) {
          g.beginPath();
          g.moveTo(hx - T * 0.2 + i * T * 0.18, hy - T * 0.3);
          g.lineTo(hx - T * 0.1 + i * T * 0.18, hy + T * 0.25);
          g.stroke();
        }
      }
    } else if (kind === "wound") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      vigArm(g, W * 0.5, H * 1.2, W * 0.5, H * 0.66, T * 1.5, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
      vigPalm(g, W * 0.5, H * 0.5, T * 1.25, skinOf(main), line, lw);
      const cut = ease(clamp(k / 0.6, 0, 1));
      g.strokeStyle = K.VIG.BLOOD;
      g.lineWidth = 4 * u;
      g.lineCap = K.ROUND;
      g.beginPath();
      g.moveTo(W * 0.5 - T * 0.7, H * 0.52 - T * 0.3);
      g.lineTo(W * 0.5 - T * 0.7 + T * 1.4 * cut, H * 0.52 - T * 0.3 + T * 0.6 * cut);
      g.stroke();
    } else if (kind === "match" || kind === "incense") {
      vigBackdrop(g, S, W, H, 0.68, vg.light);
      g.fillStyle = K.VIG.WOOD;
      g.fillRect(W * 0.2, H * 0.68, W * 0.6, H * 0.06);
      const strikes = kind === "match" ? Math.max(1, vg.count) : 0;
      const ph = strikes ? (k * strikes) % 1 : 1;
      const out = vg.mods.out || (kind === "match" && ph > 0.55);
      vigObject(g, "incense", W * 0.5, H * 0.55, H * 0.3, { out: vg.mods.out || kind === "match" }, line, lw, tt);
      if (kind === "match") {
        const mx = W * 0.62, my = H * 0.45;
        vigArm(g, W * 1.05, H * 0.7, mx + T * 0.4, my + T * 0.3, T, sleeveOf(main, K.VIG.SLEEVE_B), skinOf(main), line, lw, false);
        g.strokeStyle = "#d9b98a";
        g.lineWidth = 4 * u;
        g.beginPath();
        g.moveTo(mx + T * 0.3, my + T * 0.2);
        g.lineTo(mx - T * 0.4, my - T * 0.2);
        g.stroke();
        if (!out || ph < 0.55) {
          const f = ph < 0.55 ? 1 - ph / 0.55 : 0;
          const gr = g.createRadialGradient(mx - T * 0.45, my - T * 0.25, 0, mx - T * 0.45, my - T * 0.25, T * 1.8);
          gr.addColorStop(0, rgba(K.VIG.FLAME, 0.6 * f));
          gr.addColorStop(1, rgba(K.VIG.FLAME, 0));
          g.fillStyle = gr;
          g.fillRect(0, 0, W, H);
          g.beginPath();
          g.ellipse(mx - T * 0.45, my - T * 0.3, T * 0.12 * f, T * 0.25 * f, -0.4, 0, Math.PI * 2);
          g.fillStyle = K.VIG.FLAME;
          g.fill();
        }
      }
    } else if (kind === "bell") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      g.fillStyle = K.VIG.WOOD;
      g.fillRect(W * 0.3, H * 0.12, W * 0.4, H * 0.04);
      vigObject(g, "bell", W * 0.5, H * 0.42, H * 0.42, { swing: true }, line, lw, tt);
      for (let i = 0; i < 3; i++) {
        const r = ((tt * 0.6 + i / 3) % 1) * H * 0.6;
        g.strokeStyle = "rgba(220,200,150," + (0.35 * (1 - r / (H * 0.6))).toFixed(3) + ")";
        g.lineWidth = 3 * u;
        g.beginPath();
        g.arc(W * 0.5, H * 0.5, H * 0.2 + r, 0, Math.PI * 2);
        g.stroke();
      }
    } else if (kind === "read") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      const open = ease(clamp(k / 0.3, 0, 1));
      const pk = vg.objs.indexOf("book") >= 0 ? "book" : "paper";
      vigObject(g, pk, W * 0.5, H * 0.5, H * 0.4 * (0.6 + 0.4 * open), { color: vg.color, glow: K.VIG.GLOW, glowK: 0.5 }, line, lw, tt);
      vigArm(g, W * 0.15, H * 1.1, W * 0.5 - H * 0.28, H * 0.62, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
      vigArm(g, W * 0.85, H * 1.1, W * 0.5 + H * 0.28, H * 0.62, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, false);
    } else if (kind === "burn") {
      vigBackdrop(g, S, W, H, 0.7, vg.light);
      for (let i = 0; i < 7; i++) vigObject(g, obj, W * (0.42 + 0.16 * hash(i)), H * (0.7 + 0.04 * hash(i + 3)), H * 0.12, { color: vg.color || "#1d1b20", rot: hash(i + 9) * 180 }, line, lw, tt);
      for (let i = 0; i < 9; i++) {
        const fx = W * (0.42 + 0.16 * hash(i + 20)), fh = H * (0.15 + 0.12 * (0.5 + 0.5 * Math.sin(tt * 9 + i)));
        g.beginPath();
        g.moveTo(fx - H * 0.03, H * 0.71);
        g.quadraticCurveTo(fx, H * 0.71 - fh * 1.3, fx + H * 0.03, H * 0.71);
        g.fillStyle = i % 2 ? K.VIG.FLAME : "#ff6a2a";
        g.fill();
      }
    } else if (kind === "climb" || kind === "gate" || kind === "silhouette") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      const steps = 9;
      g.fillStyle = scaleHex(S.loc.ground.color, 0.8);
      for (let i = 0; i < steps; i++) {
        const y = H * (0.95 - i * 0.06), w = W * (0.7 - i * 0.05);
        g.fillRect(W / 2 - w / 2, y, w, H * 0.06);
        g.strokeStyle = scaleHex(S.loc.ground.color, 0.55);
        g.lineWidth = lw * 0.6;
        g.strokeRect(W / 2 - w / 2, y, w, H * 0.06);
      }
      const gy = H * 0.41;
      g.fillStyle = S.night ? "#0c0d12" : "#4a3a30";
      g.fillRect(W * 0.36, gy - H * 0.2, W * 0.28, H * 0.2);
      g.beginPath();
      g.moveTo(W * 0.31, gy - H * 0.2);
      g.lineTo(W * 0.5, gy - H * 0.31);
      g.lineTo(W * 0.69, gy - H * 0.2);
      g.closePath();
      g.fill();
      g.fillStyle = K.VIG.DOOR;
      g.fillRect(W * 0.46, gy - H * 0.13, W * 0.08, H * 0.13);
      if (kind === "climb") {
        const z = ease(k);
        const y = lerp(H * 0.97, H * 0.5, z), h = lerp(H * 0.34, H * 0.14, z);
        vigRig(g, S, main, W * 0.5 + Math.sin(z * 30) * W * 0.004, y, h, { back: true, bob: Math.abs(Math.sin(tt * 6)) * 0.03 }, 1, lw, false);
      } else if (kind === "silhouette") {
        g.globalAlpha = 0.6 + 0.3 * Math.sin(tt * 1.3);
        vigRig(g, S, who.find((c) => c !== S.focusCast) || main, W * 0.5, H * 0.95, H * 0.42, { eye: 0.01 }, 1, lw, true);
        g.globalAlpha = 1;
        const fog = g.createLinearGradient(0, H * 0.6, 0, H);
        fog.addColorStop(0, "rgba(180,190,205,0)");
        fog.addColorStop(1, "rgba(180,190,205,0.35)");
        g.fillStyle = fog;
        g.fillRect(0, 0, W, H);
      }
    } else if (kind === "altar") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      g.fillStyle = K.VIG.WOOD;
      g.fillRect(W * 0.18, H * 0.62, W * 0.64, H * 0.08);
      g.fillRect(W * 0.22, H * 0.7, W * 0.04, H * 0.3);
      g.fillRect(W * 0.74, H * 0.7, W * 0.04, H * 0.3);
      const n = clamp(vg.count > 1 ? vg.count : 3, 1, 5);
      for (let i = 0; i < n; i++) vigObject(g, "portrait", W * (0.3 + (0.4 * (i + 0.5)) / n), H * 0.48, H * 0.22, {}, line, lw, tt);
      vigObject(g, "incense", W * 0.5, H * 0.58, H * 0.14, { out: vg.mods.out }, line, lw, tt);
      vigObject(g, "candle", W * 0.24, H * 0.58, H * 0.12, {}, line, lw, tt);
      vigObject(g, "candle", W * 0.76, H * 0.58, H * 0.12, {}, line, lw, tt);
    } else if (kind === "bed" || kind === "baby") {
      vigBackdrop(g, S, W, H, 0.7, vg.light);
      if (kind === "bed") {
        g.beginPath();
        g.rect(W * 0.16, H * 0.62, W * 0.68, H * 0.12);
        fillStroke(g, K.VIG.WOOD, line, lw);
        g.beginPath();
        g.ellipse(W * 0.27, H * 0.58, H * 0.11, H * 0.05, 0, 0, Math.PI * 2);
        fillStroke(g, K.VIG.PAPER, line, lw);
        const br = 1 + Math.sin(tt * 1.6) * 0.015;
        g.beginPath();
        g.roundRect ? g.roundRect(W * 0.33, H * (0.62 - 0.11 * br), W * 0.48, H * 0.11 * br, H * 0.05) : g.rect(W * 0.33, H * 0.51, W * 0.48, H * 0.11);
        fillStroke(g, sleeveOf(main, K.VIG.SLEEVE), line, lw);
        vigFace(g, W * 0.29, H * 0.5, H * 0.085, line, lw, true);
      } else {
        g.beginPath();
        g.ellipse(W * 0.5, H * 0.55, H * 0.24, H * 0.16, -0.15, 0, Math.PI * 2);
        fillStroke(g, "#e9dcc4", line, lw);
        g.beginPath();
        g.arc(W * 0.5 - H * 0.12, H * 0.5, H * 0.09, 0, Math.PI * 2);
        fillStroke(g, K.VIG.SKIN, line, lw);
        g.fillStyle = "#141318";
        g.beginPath();
        g.arc(W * 0.5 - H * 0.15, H * 0.49, H * 0.012, 0, Math.PI * 2);
        g.arc(W * 0.5 - H * 0.1, H * 0.49, H * 0.012, 0, Math.PI * 2);
        g.fill();
        vigArm(g, W * 0.1, H * 1.1, W * 0.38, H * 0.66, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, true);
        vigArm(g, W * 0.9, H * 1.1, W * 0.62, H * 0.66, T, sleeveOf(main, K.VIG.SLEEVE), skinOf(main), line, lw, true);
      }
    } else if (kind === "meal") {
      vigBackdrop(g, S, W, H, 0.62, vg.light);
      g.beginPath();
      g.ellipse(W * 0.5, H * 0.7, W * 0.3, H * 0.09, 0, 0, Math.PI * 2);
      fillStroke(g, K.VIG.WOOD, line, lw);
      for (let i = 0; i < 4; i++) vigObject(g, K.VIG.BOWL, W * (0.35 + i * 0.1), H * 0.66, H * 0.2, {}, line, lw, tt);
      const sp = g.createRadialGradient(W * 0.5, H * 0.6, 0, W * 0.5, H * 0.6, H * 0.6);
      sp.addColorStop(0, rgba(K.VIG.GLOW, 0.25));
      sp.addColorStop(1, rgba(K.VIG.GLOW, 0));
      g.fillStyle = sp;
      g.fillRect(0, 0, W, H);
    } else if (kind === "time") {
      vigBackdrop(g, S, W, H, 0, vg.light);
      if (vg.mods.dawn) {
        const gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, "#2a3350");
        gr.addColorStop(1, "#c98a5a");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      } else {
        g.beginPath();
        g.arc(W * 0.72, H * 0.22, H * 0.07, 0, Math.PI * 2);
        g.fillStyle = "#e8e6d8";
        g.fill();
      }
      g.fillStyle = "#07080c";
      g.beginPath();
      g.moveTo(0, H * 0.75);
      g.lineTo(W * 0.18, H * 0.75);
      g.lineTo(W * 0.32, H * 0.6);
      g.lineTo(W * 0.68, H * 0.6);
      g.lineTo(W * 0.82, H * 0.75);
      g.lineTo(W, H * 0.75);
      g.lineTo(W, H);
      g.lineTo(0, H);
      g.closePath();
      g.fill();
    } else {
      vigBackdrop(g, S, W, H, 0, vg.light);
      g.fillStyle = K.VIG.DOOR;
      g.fillRect(W * 0.43, H * 0.2, W * 0.14, H * 0.4);
      g.beginPath();
      g.moveTo(W * 0.43, H * 0.6);
      g.lineTo(W * 0.57, H * 0.6);
      g.lineTo(W * 0.66, H);
      g.lineTo(W * 0.34, H);
      g.closePath();
      g.fillStyle = "rgba(200,200,190,0.18)";
      g.fill();
    }
    const vgn = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
    vgn.addColorStop(0, "rgba(0,0,0,0)");
    vgn.addColorStop(1, "rgba(0,0,0,0.45)");
    g.fillStyle = vgn;
    g.fillRect(0, 0, W, H);
    g.restore();
  }

  function draw(g, ctx) {
    ASSETS.board = boardOf(ctx.spec);
    const S = ctx.state;
    const P = S.P;
    const st = S.stage;
    const beatDur = Math.max(0.1, num(P.beatDur, ctx.dur));
    const stT = num(P.tOffset, 0) + ctx.t;
    const sent = sentenceAt(S, ctx);
    if (sent && sent.vg) {
      drawVignette(g, ctx, S, sent);
      return;
    }
    const baseCam = (P.cameras && P.cameras[0]) || P.camera || {};
    let cam0 = baseCam;
    if (sent && S.sents.length > 1) {
      if (sent.speaker) cam0 = Object.assign({}, baseCam, { shot: K.VIG.SPEAKER_SHOTS[sent.i % K.VIG.SPEAKER_SHOTS.length], focus: sent.speaker });
      else if (sent.i) cam0 = Object.assign({}, baseCam, { shot: K.VIG.CYCLE[sent.i % K.VIG.CYCLE.length] });
    }
    if (sent && sent.cam && sent.cam.shot) cam0 = Object.assign({}, baseCam, { shot: sent.cam.shot, focus: sent.cam.focus || baseCam.focus });
    const set = setOf(S);
    const camU = sent ? clamp((ctx.abs - sent.start) / Math.max(0.3, sent.end - sent.start), 0, 1) : ctx.u;
    const marks = S.L.marks || {};
    const speech = P.speech || {};
    const actors = [];
    const acts = sent && sent.acts;
    let roster = (P.actors || []).filter((a) => a && S.rigs[a.cast]);
    if (acts && Object.keys(acts).length) roster = roster.filter((a) => acts[a.cast]);
    if (acts) {
      const present = roster.map((a) => a.cast);
      const last = roster.length ? actorState(roster[roster.length - 1], marks, beatDur, stT) : { x: 0, z: 0 };
      let extra = 0;
      for (const c of Object.keys(acts)) {
        if (present.indexOf(c) >= 0) continue;
        vigEnsureRig(S, c);
        if (!S.rigs[c]) continue;
        extra++;
        roster.push({ cast: c, at: [last.x + extra * K.BOARD.INTERACT_GAP * 1.6, last.z], face: 0, action: K.ACTION.IDLE });
      }
    }
    for (const a0 of roster) {
      const R = S.rigs[a0.cast];
      if (!R) continue;
      let a = a0;
      const act = sent && sent.act;
      if (acts) {
        const own = acts[a0.cast];
        a = own ? Object.assign({}, a0, { action: own.action, then: null, moveTo: null, expression: own.expression || a0.expression, hold: K.BOARD.HOLD_POSES.indexOf(own.action) >= 0 ? a0.hold : null, boardFace: own.face }) : Object.assign({}, a0, { action: K.ACTION.IDLE, then: null, hold: null });
      } else if (act && act.cast === a0.cast) a = Object.assign({}, a0, act.action ? { action: act.action, then: null, hold: act.action === K.ACTION.HOLD ? a0.hold : null } : {}, act.expression ? { expression: act.expression } : {});
      else if (act && act.action && K.STRONG_ACTS.indexOf(aliasAction(a0.action)) >= 0 && !(sent.speaker === a0.cast)) a = Object.assign({}, a0, { action: K.ACTION.IDLE, then: null });
      const s = actorState(a, marks, beatDur, stT);
      let pos = st.map(s.x, s.y, s.z);
      let k = st.pxPerMeter(s.z);
      if (set) {
        const fit = setFit(S, set);
        const rel = clamp((s.z - st.zBack) / Math.max(0.1, st.zNear - st.zBack), 0, 1);
        pos = [S.VW / 2 + (pos[0] - S.VW / 2) * K.BOARD.SET_SPREAD, Math.min(fit.oy + set.meta.floorY * fit.sc + rel * K.BOARD.SET_DEPTH * S.VH, fit.oy + K.BOARD.SET_H * K.BOARD.FOOT_MAX * fit.sc)];
        k = st.S0;
      }
      const talk = speech[a.cast] ? speechLevel(speech[a.cast], stT) : Array.isArray(a.talk) ? speechLevel([[num(a.talk[0], 0) * beatDur, num(a.talk[1], 1) * beatDur]], stT) : 0;
      const b = rigBounds(R, pos[0], pos[1], k);
      const env = speech[a.cast] ? speechEnv(speech[a.cast], stT) : Array.isArray(a.talk) ? speechEnv([[num(a.talk[0], 0) * beatDur, num(a.talk[1], 1) * beatDur]], stT) : 0;
      actors.push({ a, R, s, z: s.z, x: pos[0], y: pos[1], k: k * R.unit, talk, env, speaking: talk > 0, b, cast: a.cast, held: heldItems(a, S.L.materials || {}) });
    }
    const lieBox = (A) => {
      if (!K.LIE.ACTIONS.test(A.s.action || "")) return;
      A.lying = true;
      A.b = Object.assign({}, A.b, { w: A.b.h * K.LIE.BOX_W, top: A.y - A.b.h * K.LIE.BOX_H, h: A.b.h * K.LIE.BOX_H, headTop: A.y - A.b.h * K.LIE.BOX_H, headBottom: A.y });
    };
    for (const A of actors) lieBox(A);
    const byX = actors.slice().sort((p, q) => p.x - q.x);
    for (let i = 1; i < byX.length; i++) {
      const prev = byX[i - 1], cur = byX[i];
      const gap = ((prev.b.w + cur.b.w) / 2) * K.SPACING;
      if (cur.x - prev.x < gap) {
        const push = gap - (cur.x - prev.x);
        cur.x += push / 2;
        for (let j = 0; j < i; j++) byX[j].x -= push / 2;
      }
    }
    if (set && actors.length) {
      const mx = (Math.min.apply(null, actors.map((A) => A.x)) + Math.max.apply(null, actors.map((A) => A.x))) / 2;
      for (const A of actors) A.x += S.VW / 2 - mx;
    }
    for (const A of actors) {
      A.b = rigBounds(A.R, A.x, A.y, A.k / A.R.unit);
      lieBox(A);
    }
    if (acts) {
      const byCast = {};
      for (const A of actors) byCast[A.cast] = A;
      for (const A of actors) {
        const face = A.a.boardFace;
        const T = face && byCast[face] && byCast[face] !== A ? byCast[face] : null;
        if (T) {
          A.s.facing = T.x >= A.x ? 1 : -1;
          A.s.back = false;
          if (K.BOARD.INTERACT.indexOf(A.s.action) >= 0) {
            const gap = ((A.b.w + T.b.w) / 2) * K.BOARD.INTERACT_GAP;
            A.x = T.x - A.s.facing * gap;
            A.b = rigBounds(A.R, A.x, A.y, A.k / A.R.unit);
          }
        } else if (face === K.BOARD.LEFT) A.s.facing = -1;
        else if (face === K.BOARD.RIGHT) A.s.facing = 1;
        else if (face === K.BOARD.BACK) A.s.back = true;
        else if (face === K.BOARD.FRONT) {
          A.s.back = false;
          A.s.front = true;
        }
      }
    }
    if (actors.some((A) => A.lying) && (cam0.shot === K.SHOT.CLOSE || cam0.shot === K.SHOT.EXTREME)) cam0 = Object.assign({}, cam0, { shot: K.SHOT.MEDIUM, focus: null });
    const f0 = frameFor(S, cam0, actors);
    const f = finalFrame(S, f0, cam0, camU, ctx.abs);
    if (set) {
      const fit = setFit(S, set);
      const sw = K.BOARD.SET_W * fit.sc, sh = K.BOARD.SET_H * fit.sc;
      f.h = Math.min(f.h, sh, (sw * ctx.H) / ctx.W);
      const vw = (f.h * ctx.W) / ctx.H;
      f.cx = clamp(f.cx, fit.ox + vw / 2, fit.ox + sw - vw / 2);
      f.cy = clamp(f.cy, fit.oy + f.h / 2, fit.oy + sh - f.h / 2);
    }
    const sc = ctx.H / f.h;
    const tx = ctx.W / 2 - f.cx * sc,
      ty = ctx.H / 2 - f.cy * sc;
    const vx0 = f.cx - (f.h * (ctx.W / ctx.H)) / 2 - 10,
      vx1 = f.cx + (f.h * (ctx.W / ctx.H)) / 2 + 10;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (set) drawSetBack(g, ctx, S, set, sc, tx, ty);
    else {
    const skyG = g.createLinearGradient(0, ty, 0, ty + st.horizon * sc);
    skyG.addColorStop(0, S.sky[0]);
    skyG.addColorStop(1, S.sky[1]);
    g.fillStyle = skyG;
    g.fillRect(0, 0, ctx.W, ctx.H);
    g.setTransform(sc, 0, 0, sc, tx, ty);
    for (const s of S.stars) {
      g.globalAlpha = s[3] * (0.7 + 0.3 * Math.sin(ctx.abs * 2 + s[0]));
      g.fillStyle = K.WHITE;
      g.beginPath();
      g.arc(s[0], s[1], s[2] / sc, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    for (const hl of S.hills) {
      g.beginPath();
      g.moveTo(hl.cx - hl.w / 2, st.horizon + 2);
      g.lineTo(hl.cx - hl.w * 0.32, st.horizon - hl.h * 0.85);
      g.lineTo(hl.cx - hl.w * 0.05, st.horizon - hl.h);
      g.lineTo(hl.cx + hl.w * 0.3, st.horizon - hl.h * 0.7);
      g.lineTo(hl.cx + hl.w / 2, st.horizon + 2);
      g.closePath();
      g.fillStyle = S.night ? K.HILL_NIGHT : S.grade ? mixHex(K.HILL_DAY, S.grade, 0.5) : K.HILL_DAY;
      g.fill();
    }
    drawGround(g, S, vx0, vx1);
    }
    const lw = (S.outlinePx * (ctx.H / 1080)) / sc;
    const minArea = K.MIN_OUTLINE_AREA / (sc * sc);
    const wind = /wind|storm|gio|bao/.test(S.weather) ? 1 : 0.3;
    const smokes = [];
    const drawItem = (it) => {
      g.globalAlpha = it.opacity;
      const swing = it.sway ? (Math.sin(ctx.abs * 1.3 + it.seed * 9) * 0.8 + wind * Math.sin(ctx.abs * 2.7 + it.seed * 5) * 1.6) * DEG : 0;
      const flick = it.flame ? 0.85 + 0.25 * noise(ctx.abs * 10, it.seed * 20) : 1;
      if (swing || it.flame) {
        g.save();
        g.translate(it.baseX, it.baseY);
        if (swing) g.rotate(swing);
        if (it.flame) g.scale(0.9 + 0.1 * flick, flick);
        g.translate(-it.baseX, -it.baseY);
      }
      if (it.kind === "line" || it.kind === "ring") {
        g.beginPath();
        g.moveTo(it.pts[0][0], it.pts[0][1]);
        for (let i = 1; i < it.pts.length; i++) g.lineTo(it.pts[i][0], it.pts[i][1]);
        if (it.kind === "ring") g.closePath();
        g.strokeStyle = it.color;
        g.globalAlpha = it.opacity * (it.kind === "line" ? K.LINE_ALPHA : 1);
        g.lineWidth = it.width;
        g.lineCap = K.ROUND;
        g.stroke();
      } else {
        pathPoly(g, it.pts);
        fillStroke(g, it.color, S.outline, it.decal || it.area < minArea ? 0 : lw * K.PROP_OUTLINE);
      }
      if (swing || it.flame) g.restore();
      g.globalAlpha = 1;
      if (it.smoke) smokes.push(it);
    };
    const order = actors.slice().sort((p, q) => p.z - q.z);
    const actorArea = actors.length ? Math.max.apply(null, actors.map((A) => A.b.w * A.b.h)) : 0;
    const maxZ = actors.length ? Math.max.apply(null, actors.map((A) => A.z)) : -Infinity;
    const overlaps = (it) => actors.some((A) => !(it.bx1 < A.b.x - A.b.w / 2 || it.bx0 > A.b.x + A.b.w / 2 || it.by1 < A.b.top || it.by0 > A.b.y));
    const coversBody = (it) => actors.some((A) => A.z < it.z && !(it.bx1 < A.b.x - A.b.w / 2 || it.bx0 > A.b.x + A.b.w / 2) && it.by0 < A.b.y - A.b.h * K.LOWER_BODY && it.by1 > A.b.top);
    const front = [];
    let ai = 0;
    if (set) {
      for (const A of order) drawActor(A);
      if (set.fg) {
        const fit = setFit(S, set);
        g.drawImage(set.fg, fit.ox, fit.oy, K.BOARD.SET_W * fit.sc, K.BOARD.SET_H * fit.sc);
      }
      ai = order.length;
    }
    for (const it of set ? [] : S.loc.items) {
      const inFront = it.z > maxZ + K.FOREGROUND && !it.decal;
      const blocking = !it.decal && (((it.area || 0) > actorArea * K.BIG_ITEM && overlaps(it)) || coversBody(it));
      if (inFront && !blocking) {
        front.push(it);
        continue;
      }
      if (!blocking) while (ai < order.length && order[ai].z < it.z) drawActor(order[ai++]);
      drawItem(it);
    }
    while (ai < order.length) drawActor(order[ai++]);
    for (const it of front) drawItem(it);
    function drawActor(A) {
      const tt = stT + A.R.seed * 5;
      let pose = rigPose(A.R, A.s.action, tt, A.talk, A.s.moving, A.env);
      if (A.s.prev && A.s.mix < 1) pose = blendPose(rigPose(A.R, A.s.prev, tt, A.talk, A.s.moving, A.env), pose, ease(A.s.mix));
      pose.held = A.held;
      if (A.s.action === K.ACTION.BOW || A.s.action === K.ACTION.PRAY) {
        pose.tilt = 0;
        pose.head = 0;
        pose.bob = -K.FRONT_BOW.DIP * (0.6 + 0.4 * Math.sin(tt * 1.3));
        pose.eye = Math.min(pose.eye, K.FRONT_BOW.EYE);
        pose.armB = K.FRONT_BOW.ARM;
        pose.elbowB = -K.FRONT_BOW.ELBOW;
        pose.armF = -K.FRONT_BOW.ARM;
        pose.elbowF = K.FRONT_BOW.ELBOW;
      }
      const ex = String(A.a.expression || "");
      if (K.RE.FEAR.test(ex)) {
        pose.wide = Math.max(pose.wide, 1.1);
        pose.mouthShape = pose.mouthShape || 1;
      } else if (K.RE.SAD.test(ex)) pose.mouthShape = pose.mouthShape || 2;
      else if (K.RE.HAPPY.test(ex)) pose.mouthShape = pose.mouthShape || 3;
      if (K.RE.SLEEPY.test(ex)) pose.eye = Math.min(pose.eye, 0.3);
      if (K.RE.ANGRY.test(ex)) {
        pose.mouthShape = pose.mouthShape || 2;
        pose.eye = Math.min(pose.eye, 0.75);
      }
      pose.back = A.s.back;
      g.save();
      g.translate(A.x, A.y);
      g.scale(A.k, A.k);
      if (A.lying && !A.R.ghost) {
        drawLying(g, A, pose, lw / A.k, S, tt);
        g.restore();
        return;
      }
      if (A.R.ghost) {
        g.globalAlpha = 0.5 + 0.12 * Math.sin(ctx.abs * 2.3) + 0.08 * noise(ctx.abs * 12, 5);
        g.translate(noise(ctx.abs * 3, 9) * 0.02, -0.08 + Math.sin(ctx.abs * 1.8) * 0.03);
      } else {
        g.beginPath();
        g.ellipse(0, 0, A.R.bodyW * 0.6, A.R.bodyW * 0.12, 0, 0, Math.PI * 2);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fill();
      }
      drawRig(g, A.R, pose, A.s.facing, lw / A.k, S.grade ? K.ACTOR_TINT : 1);
      g.restore();
      g.globalAlpha = 1;
    }
    for (const it of smokes) {
      g.lineCap = K.ROUND;
      for (let i = 0; i < 3; i++) {
        const ph = (ctx.abs * 0.35 + i / 3) % 1;
        const x = it.baseX + (hash(i + it.seed) - 0.5) * 6;
        const y = it.topY - ph * K.SMOKE_RISE;
        g.strokeStyle = "rgba(220,220,225," + (0.35 * (1 - ph)).toFixed(3) + ")";
        g.lineWidth = 2 + ph * 6;
        g.beginPath();
        g.moveTo(x, it.topY);
        g.bezierCurveTo(x + Math.sin(ctx.abs * 2 + i) * 10, it.topY - K.SMOKE_RISE * 0.3, x - Math.sin(ctx.abs * 1.6 + i) * 14, y + K.SMOKE_RISE * 0.2, x + Math.sin(ctx.abs + i) * 8, y);
        g.stroke();
      }
    }
    g.globalCompositeOperation = K.LIGHTER;
    for (const Lg of S.loc.lights) {
      const fl = Lg.flicker ? 0.75 + 0.25 * noise(ctx.abs * 9, Lg.x) : 1;
      const r = clamp(Lg.radius, 40, st.VH);
      const gr = g.createRadialGradient(Lg.x, Lg.y, 0, Lg.x, Lg.y, r);
      const a = clamp(Lg.intensity * K.LIGHT_GAIN * fl, 0, 0.5);
      gr.addColorStop(0, rgba(Lg.color, a));
      gr.addColorStop(0.45, rgba(Lg.color, a * 0.3));
      gr.addColorStop(1, rgba(Lg.color, 0));
      g.fillStyle = gr;
      g.beginPath();
      g.arc(Lg.x, Lg.y, r, 0, Math.PI * 2);
      g.fill();
    }
    if (S.night && actors.length) {
      const fa = actors.find((a) => a.speaking) || actors[0];
      const r = fa.b.h * 1.4;
      const gr = g.createRadialGradient(fa.x, fa.y - fa.b.h * 0.55, 0, fa.x, fa.y - fa.b.h * 0.55, r);
      gr.addColorStop(0, "rgba(140,160,200,0.16)");
      gr.addColorStop(1, "rgba(140,160,200,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(fa.x, fa.y - fa.b.h * 0.55, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = K.SOURCE_OVER;
    if (S.night || S.stage.interior) {
      g.fillStyle = "rgba(230,230,240,0.35)";
      for (const d of S.dust) {
        const x = vx0 + ((d[0] * (vx1 - vx0) + ctx.abs * 6 * (d[2] - 0.5)) % (vx1 - vx0));
        const y = f.cy - f.h / 2 + ((d[1] * f.h - ctx.abs * 8 * d[2]) % f.h + f.h) % f.h;
        g.fillRect(x, y, 2 / sc, 2 / sc);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (/rain|mua/.test(S.weather)) {
      g.strokeStyle = "rgba(200,215,230,0.3)";
      g.lineWidth = Math.max(1, ctx.H / 720);
      g.beginPath();
      for (let i = 0; i < 160; i++) {
        const x = ((hash(i) * ctx.W + ctx.abs * 260 * (0.6 + hash(i + 1))) % (ctx.W + 60)) - 30;
        const y = (hash(i + 5) * ctx.H + ctx.abs * ctx.H * 1.6 * (0.8 + hash(i + 2) * 0.6)) % ctx.H;
        g.moveTo(x, y);
        g.lineTo(x - ctx.H * 0.012, y + ctx.H * 0.045);
      }
      g.stroke();
    }
    if (f.flash > 0) {
      g.fillStyle = rgba("#e6eef4", 0.2 * f.flash);
      g.fillRect(0, 0, ctx.W, ctx.H);
    }
    g.restore();
  }

  ME.SVG2D = { init, draw, parseVignette, buildRig, designInfo, rigPose, drawRig, makeStage, buildLocation, bgInit, bgDraw };
  ME.registerTemplate(K.TEMPLATE, {
    name: K.NAME,
    category: K.CATEGORY,
    description: K.DESCRIPTION,
    init(ctx) {
      return init(ctx);
    },
    draw(g, ctx) {
      draw(g, ctx);
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
