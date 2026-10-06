(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  if (!ME) return;
  const hasAsset = (id) => !!ME.registry.assets[id];
  const hasChar = (id) => !!ME.registry.characters[id];
  const seat = (dx, h) => ({ dx, h });
  const seatRow = (n, gap, h) => Array.from({ length: n }, (_, i) => seat((i - (n - 1) / 2) * gap, h));
  const AFFORD = {
    chair: { seat: [seat(0, 50)], faces: MT.RIGHT },
    rocking_chair: { seat: [seat(0, 50)], faces: MT.RIGHT },
    wheelchair: { seat: [seat(0, 56)], faces: MT.RIGHT },
    wheelchair_old: { seat: [seat(0, 56)], faces: MT.RIGHT },
    sofa: { seat: seatRow(3, 90, 70) },
    bench: { seat: seatRow(2, 80, 48) },
    picnic_table: { seat: seatRow(2, 90, 46), work: { mode: MT.BEHIND, seated: true } },
    throne: { seat: [seat(0, 130)], role: MT.ROYAL },
    airplane_seat: { seat: [seat(-2, 48)], faces: MT.RIGHT },
    pilot_seat: { seat: [seat(-2, 48)], faces: MT.RIGHT, role: MT.PILOT },
    desk: { work: { mode: MT.BESIDE, seated: true, dx: 175 }, surface: { h: 96, w: 240 } },
    school_desk: { work: { mode: MT.BEHIND, seated: true }, surface: { h: 100, w: 160 } },
    table: { work: { mode: MT.BEHIND, seated: true }, surface: { h: 66, w: 190 } },
    cafe_table: { work: { mode: MT.BEHIND, seated: true }, surface: { h: 74, w: 120 } },
    lab_bench: { work: { mode: MT.BEHIND, seated: false }, surface: { h: 110, w: 300 } },
    cash_register: { work: { mode: MT.BEHIND, seated: false, dx: 90 }, surface: { h: 120, w: 200 } },
    kitchen_stove: { work: { mode: MT.BESIDE, seated: false, dx: 150 } },
    blackboard: { work: { mode: MT.BESIDE, seated: false, dx: 270 } },
    piano: { work: { mode: MT.BESIDE, seated: true, dx: 220 } },
    altar_vn: { work: { mode: MT.BESIDE, seated: false, dx: 170 } },
    incense_altar: { work: { mode: MT.BESIDE, seated: false, dx: 150 } },
    bed: { bed: { dx: 10, h: 60 } },
    hospital_bed: { bed: { dx: 10, h: 80 } },
    gurney: { bed: { dx: 0, h: 78 } },
    air_mattress: { bed: { dx: 0, h: 30 } },
    door: { door: { dx: 0, param: MT.OPEN } },
    vault_door: { door: { dx: 0, param: MT.OPEN } },
    cockpit_door: { door: { dx: 0, param: MT.OPEN } },
    crate: { cover: { h: 100 } },
    barrel: { cover: { h: 120 } },
    sandbags: { cover: { h: 90 } },
    rubble: { cover: { h: 60 } },
    hay_bale: { cover: { h: 90 } },
    ruined_wall: { cover: { h: 200 } },
    rock: { cover: { h: 120 } },
    car_sedan: { cover: { h: 120 } },
    police_car: { cover: { h: 120 } },
    taxi: { cover: { h: 120 } },
    van: { cover: { h: 160 } },
    armored_truck: { cover: { h: 200 } },
    covered_wagon: { cover: { h: 160 } },
    ladder: { climb: { x0: 0, y0: 0, x1: 0, top: 360, param: MT.H, vertical: true } },
    stair_truck: { climb: { x0: -150, y0: -66, x1: 214, param: MT.H } },
    evac_slide: { slide: { x0: -250, x1: 270, y1: -8, param: MT.H } },
    airliner: {
      entry: [
        { dx: -780, y: -456, param: MT.DOOROPEN },
        { dx: -2650, y: -456, param: MT.DOOR2OPEN },
      ],
      window: [{ dx: -238, y: -566, param: MT.WINDOWOPEN }],
    },
  };
  const ACTION_NEEDS = {
    sit: { seat: true },
    sit_afraid: { seat: true },
    sit_hands_up: { seat: true },
    sit_eat: { seat: true, work: [MT.TABLE, MT.CAFE_TABLE, MT.PICNIC_TABLE, MT.DESK, MT.SCHOOL_DESK] },
    type: { seat: true, work: [MT.DESK, MT.SCHOOL_DESK, MT.LAB_BENCH, MT.TABLE, MT.SYMBOL_7], tools: [MT.TYPEWRITER, MT.COMPUTER, MT.LAPTOP] },
    fly: { seat: [MT.PILOT_SEAT] },
    lie: { bed: true },
    drink: { seat: true, work: [MT.TABLE, MT.CAFE_TABLE, MT.PICNIC_TABLE], optional: true },
    reach: { work: [MT.SYMBOL_7, MT.LAB_BENCH, MT.KITCHEN_STOVE, MT.CASH_REGISTER, MT.ALTAR_VN, MT.INCENSE_ALTAR], optional: true },
    lift: { work: [MT.LAB_BENCH, MT.KITCHEN_STOVE], optional: true },
    open_door: { door: true },
    kick_door: { door: true },
    knock: { door: true },
    take_cover: { cover: true },
    climb: { climb: true },
    slide: { slide: true },
    dig: { spawn: { asset: MT.RUBBLE, dx: 85, scale: 0.55, near: 260 } },
    drill: { spawn: { asset: MT.SAFE_DEPOSIT_WALL, dx: 115, cue: MT.SAFE, params: { w: 150, h: 190, opened: 0.35 } } },
    weld: { spawn: { asset: MT.SAFE_DEPOSIT_WALL, dx: 115, cue: MT.SAFE, params: { w: 150, h: 190, opened: 0.35 } } },
  };
  const SEATED_VARIANT = { drink: MT.SIT_EAT, hands_up: MT.SIT_HANDS_UP, surrender: MT.SIT_HANDS_UP, cower: MT.SIT_AFRAID, stand: MT.SIT, idle: MT.SIT, think: MT.SIT, look_around: MT.SIT, talk: MT.SIT, check_watch: MT.SIT, hands_pocket: MT.SIT };
  const ROLE_RULES = [
    { role: MT.GUNNER, acc: [MT.RIFLE, MT.PISTOL, MT.TACTICAL_VEST], ids: /(swat|hijacker|police|security_guard|gangster|^soldier|ww[12]_soldier|vn_soldier|sheriff|outlaw|cowboy|resistance|commando|ww2_officer|colonial_officer)/ },
    { role: MT.FIGHTER, acc: [MT.SWORD, MT.SPEAR, MT.SHIELD], outfit: [MT.ARMOR] },
    { role: MT.PILOT, ids: /(pilot|aviator)/ },
    { role: MT.CREW, ids: /(flight_attendant|sailor)/ },
    { role: MT.STUDENT, ids: /(student|schoolgirl|toon_teen|graduate|nho_sinh|child|kid|newsboy)/ },
    { role: MT.TEACHER, ids: /(teacher|ong_do|professor|greek_philosopher)/ },
    { role: MT.JUDGE, ids: /^judge/ },
    { role: MT.MEDIC, ids: /(doctor|surgeon|nurse|plague_doctor)/ },
    { role: MT.ROYAL, ids: /(^king|^queen|emperor|pharaoh|samurai_lord|egyptian_queen)/ },
    { role: MT.COOK, ids: /(chef|cook)/ },
    { role: MT.CLERK, ids: /(bank_teller|cashier|waiter|butler)/ },
    { role: MT.WORSHIPPER, ids: /(monk|nun|priest|thay_phap|ba_dong|egyptian_priest|medieval_monk)/ },
  ];
  const rolesOf = (def) => {
    if (!def) return [MT.CIVILIAN];
    if (Array.isArray(def.roles) && def.roles.length) return def.roles.slice();
    const id = String(def.id || "");
    const acc = def.accessories || [];
    const out = [];
    for (const r of ROLE_RULES) {
      const hit = (r.ids && r.ids.test(id)) || (r.acc && r.acc.some((a) => acc.indexOf(a) >= 0)) || (r.outfit && r.outfit.indexOf(def.outfit) >= 0);
      if (hit) out.push(r.role);
    }
    if (out.indexOf(MT.GUNNER) >= 0 || out.indexOf(MT.FIGHTER) >= 0) out.push(MT.ARMED);
    else out.push(MT.CIVILIAN);
    return out;
  };
  const COVER_RE = /(crate|barrel|box|sandbag|rubble|ruin|wall|rock|boulder|car|truck|van|taxi|wagon|cart|tank|hay|log|trunk)/;
  const SEAT_RE = /(chair|stool|bench|sofa|couch|throne|seat|pew)/;
  const BED_RE = /(bed|mattress|gurney|cot|bunk|hammock)/;
  const DOOR_RE = /(door|gate)$/;
  const affordOf = (id) => {
    if (AFFORD[id]) return AFFORD[id];
    const a = ME.registry.assets[id];
    if (!a) return null;
    const size = a.size || [100, 100];
    const cat = a.category || "";
    if (cat === MT.FURNITURE && SEAT_RE.test(id)) return { seat: [seat(0, Math.min(70, Math.round(size[1] * 0.42)))] };
    if (cat === MT.FURNITURE && BED_RE.test(id)) return { bed: { dx: 0, h: Math.min(90, Math.round(size[1] * 0.55)) } };
    if (DOOR_RE.test(id) && size[1] >= 180) return { door: { dx: 0, param: MT.OPEN } };
    if (COVER_RE.test(id) && size[1] >= 50 && size[1] <= 260 && cat !== MT.STRUCTURE) return { cover: { h: size[1] } };
    return null;
  };
  const crowd = (pool, fill, action) => ({ pool: pool.filter(hasChar), fill, action });
  const PEOPLE = [MT.MAN_CASUAL, MT.WOMAN_CASUAL, MT.YOUNG_WOMAN, MT.YOUNG_MAN, MT.ELDERLY_WOMAN, MT.ELDERLY_MAN, MT.BUSINESSMAN, MT.BUSINESSWOMAN, MT.TOON_HIPSTER, MT.TOON_WOMAN_AFRO, MT.TOON_CURLY_GLASSES];
  const PASSENGERS = [MT.PASSENGER_MAN, MT.PASSENGER_WOMAN, MT.PASSENGER_ELDER, MT.MAN_CASUAL, MT.WOMAN_CASUAL, MT.BUSINESSMAN, MT.YOUNG_WOMAN, MT.ELDERLY_MAN];
  const STAGING = {
    airplane_cabin: {
      rows: [{ asset: MT.AIRPLANE_SEAT, lane: MT.MID, pitch: 92, offset: 46, mode: MT.ON, facing: MT.RIGHT, fillParam: MT.PASSENGER, fill: 0.84 }],
      aisle: MT.FRONT,
      doors: [{ asset: MT.COCKPIT_DOOR, lane: MT.BACK }],
      prefer: { door: MT.COCKPIT_DOOR },
      style: MT.FLAT,
    },
    airplane_cockpit: {
      seats: [
        { x: 1120, lane: MT.MID, facing: MT.RIGHT, role: MT.PILOT, asset: MT.PILOT_SEAT },
        { x: 1230, lane: MT.FRONT, facing: MT.RIGHT, role: MT.PILOT, asset: MT.PILOT_SEAT },
      ],
      seatedRoles: [MT.PILOT],
      standLimit: { lane: MT.FRONT, maxX: 950 },
      doors: [{ x: 670, lane: MT.BACK, asset: MT.COCKPIT_DOOR }],
      prefer: { door: MT.COCKPIT_DOOR },
      style: MT.FLAT,
    },
    airport_apron: {
      anchor: { asset: MT.AIRLINER, x: 3500, lane: MT.BACK, scale: 1, replace: [MT.AIRPLANE, MT.AIRLINER, MT.SMALL_PLANE, MT.WINDOW, MT.LADDER] },
      prefer: { climb: MT.STAIR_TRUCK, slide: MT.EVAC_SLIDE },
      teams: { climb: { roles: [MT.GUNNER], pool: [MT.SWAT_OFFICER, MT.SWAT_OFFICER_2, MT.SWAT_OFFICER], count: 3 }, slide: { pool: [MT.PASSENGER_WOMAN, MT.PASSENGER_MAN, MT.PASSENGER_ELDER], count: 6 } },
      style: MT.FLAT,
    },
    airport: { anchorFrom: { assets: [MT.AIRPLANE, MT.AIRLINER], as: MT.AIRLINER, lane: MT.BACK, shift: 900 }, prefer: { climb: MT.STAIR_TRUCK, slide: MT.EVAC_SLIDE } },
    classroom: {
      hideProps: [MT.SCHOOL_DESK],
      rows: [{ asset: MT.SCHOOL_DESK, lane: MT.FRONT, pitch: 240, offset: 80, from: 1250, to: 2350, mode: MT.BEHIND, facing: MT.LEFT, crowd: crowd([MT.STUDENT, MT.SCHOOLGIRL, MT.TOON_TEEN_BOY, MT.TOON_TEEN_GIRL, MT.TOON_KID_BOY, MT.TOON_KID_GIRL], 0.8, MT.SIT) }],
      spots: [{ x: 1020, lane: MT.FRONT, role: MT.TEACHER, facing: MT.RIGHT, action: MT.TALK }],
      seatedRoles: [MT.STUDENT],
    },
    church_interior: {
      rows: [{ asset: MT.BENCH, lane: MT.MID, pitch: 240, offset: 0, to: 1750, mode: MT.ON, facing: MT.RIGHT, crowd: crowd([MT.ELDERLY_WOMAN, MT.ELDERLY_MAN, MT.WOMAN_CASUAL, MT.MAN_CASUAL, MT.NUN, MT.PEASANT_WOMAN], 0.8, MT.SIT) }],
      spots: [{ x: 1900, lane: MT.BACK, role: MT.WORSHIPPER, facing: MT.LEFT, action: MT.TALK }],
    },
    courtroom: {
      rows: [{ asset: MT.BENCH, lane: MT.FORE, pitch: 240, offset: 0, from: 1550, to: 2350, mode: MT.ON, facing: MT.LEFT, crowd: crowd([MT.MAN_CASUAL, MT.WOMAN_CASUAL, MT.JOURNALIST, MT.ELDERLY_MAN, MT.BUSINESSWOMAN], 0.65, MT.SIT) }],
      seats: [{ x: 1200, lane: MT.BACK, facing: MT.RIGHT, role: MT.JUDGE, asset: MT.DESK, mode: MT.BEHIND }],
      seatedRoles: [MT.JUDGE],
    },
    cafe_interior: {
      hideProps: [MT.CAFE_TABLE],
      rows: [{ asset: MT.CAFE_TABLE, lane: MT.FRONT, pitch: 620, offset: 200, mode: MT.BEHIND, facing: MT.RIGHT, crowd: crowd(PEOPLE, 0.5, MT.DRINK) }],
    },
    medieval_tavern_interior: {
      rows: [{ asset: MT.TABLE, lane: MT.FRONT, pitch: 520, offset: 200, mode: MT.BEHIND, facing: MT.RIGHT, crowd: crowd([MT.PEASANT, MT.VIKING, MT.BLACKSMITH, MT.MEDIEVAL_MERCHANT, MT.PEASANT_WOMAN, MT.KNIGHT, MT.JESTER], 0.6, MT.SIT_EAT) }],
    },
    hospital_room: { prefer: { bed: MT.HOSPITAL_BED }, spots: [{ near: MT.HOSPITAL_BED, dx: 250, lane: MT.FRONT, role: MT.MEDIC, facing: MT.LEFT, action: MT.STAND }] },
    bedroom: { prefer: { bed: MT.BED } },
    prison_cell: { prefer: { bed: MT.BED } },
    asylum_corridor: { prefer: { bed: MT.GURNEY } },
    office: { prefer: { seat: MT.CHAIR } },
    police_station: { prefer: { seat: MT.CHAIR } },
    detective_office: { prefer: { seat: MT.CHAIR } },
    castle_hall: { seats: [{ x: 1400, lane: MT.BACK, role: MT.ROYAL, asset: MT.THRONE }], seatedRoles: [MT.ROYAL] },
    laboratory: { spots: [{ near: MT.LAB_BENCH, dx: 0, lane: MT.BACK, role: MT.MEDIC, action: MT.REACH }] },
    supermarket: { spots: [{ near: MT.CASH_REGISTER, dx: 90, lane: MT.BACK, role: MT.CLERK, action: MT.STAND }] },
    kitchen: { spots: [{ near: MT.KITCHEN_STOVE, dx: 150, lane: MT.MID, role: MT.COOK, facing: MT.LEFT, action: MT.REACH }] },
    city_park: { prefer: { seat: MT.BENCH } },
    train_station: { prefer: { seat: MT.BENCH } },
    bank_lobby: { prefer: { seat: MT.BENCH } },
    city_street: { prefer: { cover: MT.CAR_SEDAN } },
    city_modern: { prefer: { cover: MT.CAR_SEDAN } },
    vn_street: { prefer: { cover: MT.CAR_SEDAN } },
    highway: { prefer: { cover: MT.CAR_SEDAN } },
    battlefield: { prefer: { cover: MT.SANDBAGS } },
    ww1_trench: { prefer: { cover: MT.SANDBAGS } },
    wild_west_town: { prefer: { cover: MT.BARREL } },
    ghost_town: { prefer: { cover: MT.BARREL } },
  };
  const DEFAULT_PREFER = { seat: MT.CHAIR, door: MT.DOOR, cover: MT.CRATE, bed: MT.BED, desk: MT.DESK };
  const TABLETOP = [
    MT.TYPEWRITER,
    MT.COMPUTER,
    MT.LAPTOP,
    MT.TELEPHONE,
    MT.DESK_LAMP,
    MT.DOCUMENTS,
    MT.CASE_FILE,
    MT.NEWSPAPER,
    MT.COFFEE_CUP,
    MT.WINE_BOTTLE,
    MT.WINE_GLASS,
    MT.FOOD,
    MT.RADIO,
    MT.GLOBE,
    MT.CANDLE,
    MT.OIL_LAMP,
    MT.ENVELOPE,
    MT.CASH_STACK,
    MT.KEYS,
    MT.MAGNIFIER,
    MT.BLUEPRINT,
    MT.LETTERS_BUNDLE,
    MT.CHEQUE,
    MT.HOURGLASS,
    MT.QUILL_INKWELL,
    MT.CRYSTAL_BALL,
    MT.TAROT_CARDS,
    MT.MUSIC_BOX,
    MT.BIRTHDAY_CAKE,
    MT.GIFT_BOX,
    MT.TROPHY,
    MT.TROPHY_CUP,
    MT.MEDKIT,
    MT.SMARTPHONE,
    MT.ALARM_CLOCK,
    MT.RED_ENVELOPE,
    MT.BANH_CHUNG,
    MT.OUIJA_BOARD,
    MT.POLAROID_PHOTOS,
    MT.POCKET_WATCH,
    MT.SCROLL,
  ];
  const ROLE_WORDS = {
    medic: { re: /(bác sĩ|y tá|doctor|nurse)/i, who: MT.DOCTOR },
    teacher: { re: /(cô giáo|thầy giáo|giáo viên|teacher)/i, who: MT.TEACHER },
    judge: { re: /(thẩm phán|quan tòa|chủ tọa|judge)/i, who: MT.JUDGE },
    cook: { re: /(đầu bếp|chef|cook)/i, who: MT.CHEF },
    clerk: { re: /(thu ngân|nhân viên quầy|cashier|teller)/i, who: MT.BANK_TELLER },
    worshipper: { re: /(linh mục|cha xứ|nhà sư|priest|monk)/i, who: MT.PRIEST },
    royal: { re: /(nhà vua|hoàng đế|king|emperor)/i, who: MT.KING },
    pilot: { re: /(phi công|cơ trưởng|cơ phó|pilot)/i, who: MT.PILOT },
  };
  for (const [envId, st] of Object.entries(STAGING)) {
    const env = ME.registry.environments[envId];
    if (!env) continue;
    if (st.rows) st.rows = st.rows.filter((r) => hasAsset(r.asset));
    env.staging = Object.assign({}, env.staging || {}, st);
  }
  const envProps = (envId) => {
    const env = ME.registry.environments[envId];
    if (!env || !env.props) return [];
    try {
      const tp = (ME.TIMES || {})[env.time || MT.DAY] || {};
      return (env.props(env.width || 3200, tp) || []).map((p) => ({ asset: p.asset, x: p.x, lane: p.lane || MT.MID, y: p.y || 0, scale: p.scale || 1, facing: p.facing }));
    } catch (e) {
      void e;
      return [];
    }
  };
  const hingeDoor = (draw, w, h) => (g, o) => {
    const open = Math.max(0, Math.min(1, +(o && o.open) || 0));
    if (open <= 0.01) return draw(g, o);
    g.save();
    g.fillStyle = MT.VALUE_14110E;
    g.fillRect(-w / 2 + 6, -h + 6, w - 12, h - 6);
    g.translate(-w / 2, 0);
    g.scale(1 - open * 0.82, 1);
    g.translate(w / 2, 0);
    draw(g, o);
    g.restore();
  };
  for (const id of [MT.DOOR]) {
    const a = ME.registry.assets[id];
    if (!a) continue;
    const [w, h] = a.size || [130, 260];
    a.draw = hingeDoor(a.draw, w, h);
    a.params = Object.assign({}, a.params || {}, { open: MT.DO_MO_0_1 });
    const T = ME.TOON;
    if (T && T.assets && T.assets[id] && T.assets[id].draw) T.assets[id] = Object.assign({}, T.assets[id], { draw: hingeDoor(T.assets[id].draw, w, h) });
  }
  ME.INTERACT = { AFFORD, ACTION_NEEDS, SEATED_VARIANT, ROLE_RULES, STAGING, DEFAULT_PREFER, TABLETOP: TABLETOP.filter(hasAsset), ROLE_WORDS };
  ME.affordOf = affordOf;
  ME.rolesOf = rolesOf;
  ME.envProps = envProps;
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
