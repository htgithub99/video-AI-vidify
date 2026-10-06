(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const K = ME.T3;
  const R = (ME.REAL = ME.REAL || {});
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const SKY = {
    urban: { day: MT.WIDE_STREET_01, dusk: MT.VENICE_SUNSET, night: MT.SHANGHAI_BUND },
    modern: { day: MT.CANARY_WHARF, dusk: MT.SUNSET_JHBCENTRAL, night: MT.NEUER_ZOLLHOF },
    field: { day: MT.KLOOFENDAL_48D_PARTLY_CLOUDY_PURESKY, dusk: MT.KLOPPENHEIM_06_PURESKY, night: MT.MOONLESS_GOLF },
    sunset: { day: MT.BELFAST_SUNSET_PURESKY, dusk: MT.BELFAST_SUNSET_PURESKY, night: MT.MOONLESS_GOLF },
    rural: { day: MT.SMALL_RURAL_ROAD, dusk: MT.EVENING_FIELD, night: MT.MOONLESS_GOLF },
    park: { day: MT.PARK_PARKING, dusk: MT.EVENING_FIELD, night: MT.POND_BRIDGE_NIGHT },
    forest: { day: MT.MISTY_PINES, dusk: MT.LILIENSTEIN, night: MT.POND_BRIDGE_NIGHT },
    jungle: { day: MT.RAINFOREST_TRAIL, dusk: MT.LILIENSTEIN, night: MT.POND_BRIDGE_NIGHT },
    coast: { day: MT.SPIAGGIA_DI_MONDELLO, dusk: MT.UMHLANGA_SUNRISE, night: MT.MOONLESS_GOLF },
    desert: { day: MT.GOEGAP, dusk: MT.ROGLAND_SUNSET, night: MT.ROGLAND_MOONLIT_NIGHT },
    snow: { day: MT.SNOWY_FIELD, dusk: MT.WINTER_LAKE_01, night: MT.WINTER_EVENING },
    overcast: { day: MT.OVERCAST_SOIL_PURESKY, dusk: MT.INDUSTRIAL_SUNSET_PURESKY, night: MT.MOONLESS_GOLF },
    harbor: { day: MT.ABANDONED_SLIPWAY, dusk: MT.VENICE_SUNSET, night: MT.SHANGHAI_BUND },
    room: { all: MT.HOTEL_ROOM },
    office: { all: MT.UNFINISHED_OFFICE, night: MT.UNFINISHED_OFFICE_NIGHT, interior_dark: MT.UNFINISHED_OFFICE_NIGHT },
    studio: { all: MT.BROWN_PHOTOSTUDIO_02 },
    hall: { all: MT.DANCING_HALL },
    lobby: { all: MT.CINEMA_LOBBY },
    warehouse: { all: MT.EMPTY_WAREHOUSE_01 },
    cellar: { all: MT.CASTLE_ZAVELSTEIN_CELLAR },
    cosy: { all: MT.FIREPLACE },
    bare_room: { all: MT.SMALL_EMPTY_ROOM_1 },
    playroom: { all: MT.EMPTY_PLAY_ROOM },
  };
  const TEX = {
    grass: { id: MT.LEAFY_GRASS, tile: 3 },
    sparse_grass: { id: MT.SPARSE_GRASS, tile: 3 },
    mud: { id: MT.BROWN_MUD_LEAVES_01, tile: 3 },
    dry_mud: { id: MT.BROWN_MUD_DRY, tile: 3 },
    forest: { id: MT.FOREST_LEAVES_02, tile: 3 },
    asphalt: { id: MT.ASPHALT_02, tile: 4 },
    pavement: { id: MT.PAVEMENT_02, tile: 2.5 },
    cobble: { id: MT.COBBLESTONE_FLOOR_04, tile: 2.5 },
    beach_sand: { id: MT.COAST_SAND_01, tile: 3 },
    sand: { id: MT.SAND_01, tile: 3 },
    snow: { id: MT.SNOW_02, tile: 3 },
    rock: { id: MT.ROCKY_TERRAIN_02, tile: 4 },
    gravel: { id: MT.GRAVEL_FLOOR, tile: 2.5 },
    wood_floor: { id: MT.LAMINATE_FLOOR_02, tile: 2.5 },
    old_wood: { id: MT.WOOD_FLOOR, tile: 2.5 },
    tiles: { id: MT.FLOOR_TILES_06, tile: 2 },
    stone_tiles: { id: MT.STONE_TILES_02, tile: 2.5 },
    marble: { id: MT.MARBLE_01, tile: 2.5 },
    concrete: { id: MT.CONCRETE_FLOOR_02, tile: 3 },
    plaster: { id: MT.PAINTED_PLASTER_WALL, tile: 3 },
    brick: { id: MT.RED_BRICK_03, tile: 2.5 },
    castle_stone: { id: MT.MEDIEVAL_BLOCKS_03, tile: 3 },
  };
  const MODELS = {
    boulder_01: { bind: [MT.ROCK], size: 1.4 },
    shrub_02: { bind: [MT.BUSH, MT.HEDGE] },
    fern_02: { bind: [] },
    rock_moss_set_01: { bind: [] },
    grass_medium_01: { bind: [MT.GRASS] },
    dead_tree_trunk_02: { bind: [] },
    tree_stump_01: { bind: [] },
    street_lamp_01: { bind: [MT.STREET_LAMP], light: { y: 0.92, color: MT.FFD9A0 } },
    street_lamp_02: { bind: [] },
    painted_wooden_bench: { bind: [MT.BENCH] },
    wooden_crate_01: { bind: [MT.CRATE] },
    barrel_03: { bind: [MT.BARREL] },
    wine_barrel_01: { bind: [] },
    fire_hydrant: { bind: [MT.FIRE_HYDRANT] },
    Lantern_01: { bind: [MT.LANTERN] },
    treasure_chest: { bind: [MT.TREASURE_CHEST] },
    cannon_01: { bind: [MT.CANNON] },
    wooden_picnic_table: { bind: [MT.PICNIC_TABLE] },
    wooden_table_02: { bind: [MT.TABLE, MT.DESK] },
    dining_chair_02: { bind: [MT.CHAIR] },
    sofa_02: { bind: [MT.SOFA] },
    GothicBed_01: { bind: [MT.BED] },
    GothicCabinet_01: { bind: [MT.WARDROBE] },
    Television_01: { bind: [MT.TV_OLD] },
    alarm_clock_01: { bind: [MT.ALARM_CLOCK] },
    wine_bottles_01: { bind: [MT.WINE_BOTTLE] },
    potted_plant_02: { bind: [MT.PLANT_POT] },
    desk_lamp_arm_01: { bind: [MT.DESK_LAMP] },
    stone_fire_pit: { bind: [MT.CAMPFIRE] },
    dutch_ship_large_01: { bind: [MT.SHIP, MT.PIRATE_SHIP] },
    outdoor_table_chair_set_01: { bind: [MT.CAFE_TABLE] },
    CoffeeCart_01: { bind: [MT.STREET_VENDOR_CART] },
    modern_arm_chair_01: { bind: [] },
    concrete_road_barrier: { bind: [] },
    wooden_bucket_01: { bind: [] },
    Chandelier_01: { bind: [] },
    Rockingchair_01: { bind: [MT.ROCKING_CHAIR] },
    brass_candleholders: { bind: [MT.CANDELABRA] },
    vintage_oil_lamp: { bind: [MT.OIL_LAMP] },
    ornate_mirror_01: { bind: [MT.HAUNTED_MIRROR] },
    fancy_picture_frame_01: { bind: [MT.PORTRAIT_CREEPY] },
    wooden_bookshelf_worn: { bind: [MT.SECRET_BOOKCASE, MT.BOOKSHELF] },
    large_iron_gate: { bind: [MT.IRON_GATE] },
    dead_tree_trunk: { bind: [MT.DEAD_TREE_TWISTED] },
    gothic_statue: { bind: [MT.GREEK_STATUE] },
    vintage_grandfather_clock_01: { bind: [] },
    wooden_barrels_01: { bind: [] },
  };
  const RX = (o) => Object.assign({ sky: MT.FIELD, ground: MT.GRASS, road: null, set: false, cards: MT.NONE, grass: 0, scatter: [], walls: null }, o);
  const RECIPES = {
    city_street: RX({ sky: MT.URBAN, ground: MT.COBBLE, road: MT.ASPHALT }),
    city_modern: RX({ sky: MT.MODERN, ground: MT.PAVEMENT, road: MT.ASPHALT }),
    vn_street: RX({ sky: MT.FIELD, ground: MT.PAVEMENT, road: MT.ASPHALT, set: true }),
    riviera_promenade: RX({ sky: MT.COAST, ground: MT.PAVEMENT, set: true }),
    courtyard: RX({ sky: MT.FIELD, ground: MT.STONE_TILES, set: true }),
    countryside: RX({
      sky: MT.RURAL,
      ground: MT.GRASS,
      road: MT.GRAVEL,
      grass: 1,
      scatter: [
        { m: MT.SHRUB_02, n: 6 },
        { m: MT.BOULDER_01, n: 3 },
      ],
    }),
    forest: RX({
      sky: MT.FOREST,
      ground: MT.FOREST,
      grass: 0.5,
      trees: 14,
      scatter: [
        { m: MT.FERN_02, n: 14 },
        { m: MT.DEAD_TREE_TRUNK_02, n: 2 },
        { m: MT.ROCK_MOSS_SET_01, n: 4 },
      ],
    }),
    jungle: RX({
      sky: MT.JUNGLE,
      ground: MT.MUD,
      grass: 0.8,
      trees: 12,
      scatter: [
        { m: MT.FERN_02, n: 20 },
        { m: MT.SHRUB_02, n: 8 },
      ],
    }),
    desert_road: RX({ sky: MT.DESERT, ground: MT.SAND, road: MT.ASPHALT, scatter: [{ m: MT.BOULDER_01, n: 4 }] }),
    mountain_road: RX({ sky: MT.RURAL, ground: MT.ROCK, road: MT.ASPHALT, scatter: [{ m: MT.BOULDER_01, n: 6 }] }),
    harbor: RX({ sky: MT.HARBOR, ground: MT.CONCRETE, water: true }),
    airport: RX({ sky: MT.FIELD, ground: MT.CONCRETE, road: MT.ASPHALT }),
    highway: RX({ sky: MT.RURAL, ground: MT.DRY_MUD, road: MT.ASPHALT, grass: 0.4 }),
    open_sea: RX({ sky: MT.COAST, ground: MT.WATER }),
    beach: RX({ sky: MT.COAST, ground: MT.BEACH_SAND, water: true, set: true }),
    rice_field: RX({ sky: MT.FIELD, ground: MT.PAINTED, set: true }),
    vn_village: RX({ sky: MT.FIELD, ground: MT.DRY_MUD, grass: 0.6, set: true }),
    vn_market: RX({ sky: MT.FIELD, ground: MT.DRY_MUD, cards: MT.ALL }),
    train_station: RX({ sky: MT.URBAN, ground: MT.CONCRETE, cards: MT.FAR }),
    medieval_village: RX({ sky: MT.FIELD, ground: MT.GRASS, road: MT.GRAVEL, grass: 0.8, set: true }),
    castle_courtyard: RX({ sky: MT.FIELD, ground: MT.CASTLE_STONE, set: true }),
    imperial_palace: RX({ sky: MT.FIELD, ground: MT.STONE_TILES, set: true }),
    ancient_ruins: RX({ sky: MT.DESERT, ground: MT.ROCK, set: true, scatter: [{ m: MT.BOULDER_01, n: 3 }] }),
    desert_dunes: RX({ sky: MT.DESERT, ground: MT.SAND, set: true }),
    wild_west_town: RX({ sky: MT.DESERT, ground: MT.DRY_MUD, set: true }),
    snow_mountain: RX({ sky: MT.SNOW, ground: MT.SNOW, set: true }),
    city_park: RX({
      sky: MT.PARK,
      ground: MT.GRASS,
      road: MT.GRAVEL,
      grass: 1,
      trees: 8,
      scatter: [
        { m: MT.PAINTED_WOODEN_BENCH, n: 2 },
        { m: MT.SHRUB_02, n: 6 },
      ],
    }),
    stadium: RX({ sky: MT.FIELD, ground: MT.PAINTED, cards: MT.ALL }),
    battlefield: RX({
      sky: MT.OVERCAST,
      ground: MT.MUD,
      grass: 0.35,
      cards: MT.FAR,
      scatter: [
        { m: MT.DEAD_TREE_TRUNK_02, n: 2 },
        { m: MT.BOULDER_01, n: 3 },
      ],
    }),
    graveyard: RX({ sky: MT.OVERCAST, ground: MT.GRASS, grass: 0.6, set: true }),
    home_interior: RX({ sky: MT.ROOM, ground: MT.WOOD_FLOOR }),
    office: RX({ sky: MT.OFFICE, ground: MT.CONCRETE }),
    police_station: RX({ sky: MT.OFFICE, ground: MT.CONCRETE }),
    laboratory: RX({ sky: MT.OFFICE, ground: MT.TILES }),
    photo_studio: RX({ sky: MT.STUDIO, ground: MT.CONCRETE }),
    bank_lobby: RX({ sky: MT.LOBBY, ground: MT.MARBLE }),
    hospital_room: RX({ sky: MT.BARE_ROOM, ground: MT.TILES }),
    classroom: RX({ sky: MT.PLAYROOM, ground: MT.WOOD_FLOOR }),
    cafe_interior: RX({ sky: MT.COSY, ground: MT.OLD_WOOD }),
    bedroom: RX({ sky: MT.ROOM, ground: MT.WOOD_FLOOR }),
    kitchen: RX({ sky: MT.ROOM, ground: MT.TILES }),
    warehouse_interior: RX({ sky: MT.WAREHOUSE, ground: MT.CONCRETE }),
    bank_vault: RX({ sky: MT.CELLAR, ground: MT.CONCRETE, cards: MT.ALL, hideBg: true }),
    prison_cell: RX({ sky: MT.CELLAR, ground: MT.CONCRETE, cards: MT.ALL, hideBg: true }),
    courtroom: RX({ sky: MT.HALL, ground: MT.OLD_WOOD, cards: MT.ALL, hideBg: true }),
    castle_hall: RX({ sky: MT.CELLAR, ground: MT.CASTLE_STONE, cards: MT.ALL, hideBg: true }),
    supermarket: RX({ sky: MT.WAREHOUSE, ground: MT.TILES, cards: MT.ALL, hideBg: true }),
    airplane_cabin: RX({ sky: MT.BARE_ROOM, ground: MT.PAINTED, cards: MT.ALL, hideBg: true }),
    concert_stage: RX({ sky: MT.HALL, ground: MT.OLD_WOOD, cards: MT.ALL, hideBg: true }),
    vn_house_tet: RX({ sky: MT.ROOM, ground: MT.TILES, cards: MT.ALL, hideBg: true }),
    space_station: RX({ sky: null, ground: MT.PAINTED, cards: MT.ALL }),
  };
  const TALES_RX = {
    haunted_mansion_ext: { sky: MT.OVERCAST, ground: MT.GRASS, grass: 0.4 },
    foggy_alley: { sky: MT.URBAN, ground: MT.COBBLE },
    dark_forest: { sky: MT.FOREST, ground: MT.FOREST, grass: 0.4 },
    swamp: { sky: MT.FOREST, ground: MT.MUD },
    misty_lake: { sky: MT.FOREST, ground: MT.GRASS, water: true },
    ghost_town: { sky: MT.DESERT, ground: MT.DRY_MUD },
    vn_banyan_night: { sky: MT.FIELD, ground: MT.DRY_MUD, grass: 0.3 },
    vn_communal_courtyard: { sky: MT.FIELD, ground: MT.STONE_TILES },
    vn_citadel: { sky: MT.FIELD, ground: MT.STONE_TILES },
    egypt_pyramids: { sky: MT.DESERT, ground: MT.SAND },
    roman_forum: { sky: MT.FIELD, ground: MT.MARBLE },
    colosseum_arena: { sky: MT.DESERT, ground: MT.SAND },
    greek_acropolis: { sky: MT.FIELD, ground: MT.ROCK },
    japanese_village: { sky: MT.FIELD, ground: MT.GRAVEL, grass: 0.3 },
    ww1_trench: { sky: MT.OVERCAST, ground: MT.MUD },
    viking_village: { sky: MT.FIELD, ground: MT.GRASS, grass: 0.6 },
    haunted_hall: { sky: MT.HALL, ground: MT.OLD_WOOD, hideBg: true },
    attic: { sky: MT.ROOM, ground: MT.OLD_WOOD, hideBg: true },
    crypt: { sky: MT.CELLAR, ground: MT.CASTLE_STONE, hideBg: true },
    catacombs: { sky: MT.CELLAR, ground: MT.CASTLE_STONE, hideBg: true },
    asylum_corridor: { sky: MT.BARE_ROOM, ground: MT.TILES, hideBg: true },
    detective_office: { sky: MT.OFFICE, ground: MT.OLD_WOOD, hideBg: true },
    old_library: { sky: MT.COSY, ground: MT.OLD_WOOD, hideBg: true },
    church_interior: { sky: MT.HALL, ground: MT.STONE_TILES, hideBg: true },
    cave: { sky: MT.CELLAR, ground: MT.ROCK, hideBg: true },
    vn_old_house_interior: { sky: MT.ROOM, ground: MT.OLD_WOOD, hideBg: true },
    egypt_tomb: { sky: MT.CELLAR, ground: MT.STONE_TILES, hideBg: true },
    bunker_interior: { sky: MT.CELLAR, ground: MT.CONCRETE, hideBg: true },
    medieval_tavern_interior: { sky: MT.COSY, ground: MT.OLD_WOOD, hideBg: true },
    dungeon: { sky: MT.CELLAR, ground: MT.CASTLE_STONE, hideBg: true },
  };
  for (const id of Object.keys(TALES_RX)) if (!RECIPES[id]) RECIPES[id] = RX(Object.assign({ cards: MT.ALL }, TALES_RX[id]));
  const KEEP = new Set([MT.SEWER_TUNNEL, MT.UNDERGROUND_SECTION, MT.ABSTRACT_DARK, MT.NIGHT_SKY, MT.UNDERWATER, MT.MOON_SURFACE, MT.OUTER_SPACE]);
  R.SKY = SKY;
  R.TEX = TEX;
  R.MODELS = MODELS;
  R.RECIPES = RECIPES;
  R.manifest = R.manifest || { items: [], envs: {} };
  R.base = R.base || "";
  let index = { bind: new Map(), src: new Map(), byId: new Map() };
  R.setManifest = (m, base) => {
    R.manifest = m && Array.isArray(m.items) ? m : { items: [], envs: {} };
    if (base != null) R.base = base;
    const bind = new Map(),
      src = new Map(),
      byId = new Map();
    const items = R.manifest.items.slice().sort((a, b) => (a.source === MT.IMPORT ? 1 : 0) - (b.source === MT.IMPORT ? 1 : 0));
    for (const it of items) {
      byId.set(it.id, it);
      if (it.sourceId) src.set(MF.SYMBOL_5(`${it.source}`, `${it.sourceId}`), it);
      const binds = (it.bind || []).concat(it.newId ? [it.newId] : []);
      if (it.source === MT.POLYHAVEN && it.kind === MT.MODEL && MODELS[it.sourceId] && !(it.bind || []).length) binds.push(...MODELS[it.sourceId].bind);
      for (const b of binds) bind.set(b, it);
    }
    index = { bind, src, byId };
    for (const it of R.manifest.items) {
      if (!it.newId || it.kind === MT.CHARACTER) continue;
      if (ME.registry.assets[it.newId] && !ME.registry.assets[it.newId].__real) continue;
      const baseDef = ME.registry.assets[it.base] || ME.registry.assets.crate;
      ME.registerAsset(it.newId, Object.assign({}, baseDef, { id: it.newId, name: it.name, category: it.category || baseDef.category, tags: (it.tags || []).concat([MT.VALUE_3D_THAT]), __real: true }));
    }
  };
  R.hasAny = () => R.manifest.items.length > 0;
  R.item = (id) => index.byId.get(id) || null;
  R.bound = (libId) => index.bind.get(libId) || null;
  R.bySource = (source, id) => index.src.get(MF.SYMBOL_5(`${source}`, `${id}`)) || null;
  R.url = (rel) => (R.base || "") + String(rel).split(MT.SYMBOL_6).map(encodeURIComponent).join(MT.SYMBOL_6);
  R.recipe = (envId) => {
    if (KEEP.has(envId)) return null;
    const def = RECIPES[envId] || RX({});
    const over = (R.manifest.envs || {})[envId];
    return over ? Object.assign({}, def, over) : def;
  };
  const skyId = (recipe, timeKey) => {
    if (!recipe || !recipe.sky) return null;
    if (recipe.hdri) return recipe.hdri;
    const s = SKY[recipe.sky];
    if (!s) return null;
    const tk = timeKey === MT.INTERIOR ? MT.DAY : timeKey === MT.INTERIOR_DARK ? MT.NIGHT : timeKey;
    return s[timeKey] || s[tk] || s.all || s.day;
  };
  R.skyId = skyId;
  R.requirements = (spec) => {
    const need = new Map();
    const add = (type, id) => id && need.set(MF.SYMBOL_5(`${type}`, `${id}`), { type, id });
    for (const sh of (spec && spec.shots) || []) {
      if (!sh || (sh.template !== MT.SCENE && sh.template !== MT.SCENE3D)) continue;
      const p = sh.params || {};
      const env = ME.registry.environments[p.env] || {};
      const recipe = R.recipe(p.env);
      if (recipe) {
        const tk = p.time || env.time || MT.DAY;
        add(MT.HDRIS, skyId(recipe, tk));
        if (TEX[recipe.ground]) add(MT.TEXTURES, TEX[recipe.ground].id);
        if (TEX[recipe.road]) add(MT.TEXTURES, TEX[recipe.road].id);
        if (TEX[recipe.walls]) add(MT.TEXTURES, TEX[recipe.walls].id);
        for (const s of recipe.scatter || []) add(MT.MODELS, s.m);
      }
      const items = (env.props ? safeProps(env) : []).concat(p.items || []);
      for (const it of items) {
        const id = it && it.asset;
        if (!id) continue;
        for (const ph in MODELS) if (MODELS[ph].bind.includes(id)) add(MT.MODELS, ph);
      }
    }
    return Array.from(need.values());
  };
  const safeProps = (env) => {
    try {
      return env.props(env.width || 3200, ME.TIMES.day) || [];
    } catch (e) {
      return [];
    }
  };
  if (!K || !K.ok) return;
  const T = K.T;
  const X = T.addons || {};
  const PX = K.PX;
  const cache = { gltf: new Map(), hdri: new Map(), tex: new Map(), pmrem: new Map() };
  const once = (map, key, make) => {
    if (!map.has(key)) {
      let pr = null;
      pr = make().then(
        (v) => ((pr.__v = v), v),
        (e) => {
          if (typeof console !== MT.UNDEFINED) console.warn(MT.REAL3D, key, e && e.message);
          pr.__v = null;
          return null;
        },
      );
      map.set(key, pr);
    }
    return map.get(key);
  };
  let gltfLoader = null;
  const loaderGLTF = () => {
    if (gltfLoader) return gltfLoader;
    gltfLoader = new X.GLTFLoader();
    if (X.MeshoptDecoder) gltfLoader.setMeshoptDecoder(X.MeshoptDecoder);
    return gltfLoader;
  };
  const loadGLTF = (item) =>
    once(cache.gltf, item.id, async () => {
      const url = R.url(item.file);
      const g = await loaderGLTF().loadAsync(url);
      g.scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) if (m) m.__shared = true;
        }
      });
      return prepModel(item, g);
    });
  const loadHDRI = (item) =>
    once(cache.hdri, item.id, async () => {
      const tex = await new X.RGBELoader().loadAsync(R.url(item.file));
      tex.mapping = T.EquirectangularReflectionMapping;
      tex.__info = analyseHDR(tex);
      return tex;
    });
  const texLoader = () => (R._tl = R._tl || new T.TextureLoader());
  const loadTexSet = (item) =>
    once(cache.tex, item.id, async () => {
      const maps = item.maps || {};
      const get = async (rel, srgb) => {
        if (!rel) return null;
        const t = await texLoader().loadAsync(R.url(rel));
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.anisotropy = 8;
        if (srgb) t.colorSpace = T.SRGBColorSpace;
        return t;
      };
      const [map, normalMap, arm] = await Promise.all([get(maps.diff, true), get(maps.nor), get(maps.arm)]);
      return { map, normalMap, arm };
    });
  const analyseHDR = (tex) => {
    try {
      const img = tex.image;
      const w = img.width,
        h = img.height,
        d = img.data;
      const half = tex.type === T.HalfFloatType;
      const val = (i) => (half ? T.DataUtils.fromHalfFloat(d[i]) : d[i]);
      const ch = d.length / (w * h);
      let best = 0,
        bx = 0,
        by = 0,
        sum = 0,
        n = 0;
      const step = Math.max(1, Math.floor(w / 256));
      for (let y = 0; y < h; y += step)
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * ch;
          const l = 0.2126 * val(i) + 0.7152 * val(i + 1) + 0.0722 * val(i + 2);
          if (y < h * 0.5) {
            sum += l;
            n++;
          }
          if (l > best) {
            best = l;
            bx = x;
            by = y;
          }
        }
      const avg = sum / Math.max(1, n);
      let hr = 0,
        hg = 0,
        hb = 0,
        hn = 0;
      for (let y = Math.floor(h * 0.44); y < Math.floor(h * 0.5); y += Math.max(1, Math.floor(step / 2)))
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * ch;
          hr += val(i);
          hg += val(i + 1);
          hb += val(i + 2);
          hn++;
        }
      const horizon = [hr / Math.max(1, hn), hg / Math.max(1, hn), hb / Math.max(1, hn)];
      const u = (bx + 0.5) / w,
        v = 1 - (by + 0.5) / h;
      const phi = (u - 0.5) * 2 * PI,
        lat = (v - 0.5) * PI;
      const dir = new T.Vector3(Math.cos(phi) * Math.cos(lat), Math.sin(lat), Math.sin(phi) * Math.cos(lat)).normalize();
      return { peak: best, avg, dir, horizon };
    } catch (e) {
      return { peak: 1, avg: 0.3, dir: new T.Vector3(-0.5, 0.7, 0.4).normalize(), horizon: [0.6, 0.65, 0.7] };
    }
  };
  const pmremOf = (key, tex) => {
    if (cache.pmrem.has(key)) return cache.pmrem.get(key);
    const gen = new T.PMREMGenerator(K.renderer(64, 64));
    const rt = gen.fromEquirectangular(tex);
    gen.dispose();
    cache.pmrem.set(key, rt.texture);
    return rt.texture;
  };
  R.prepare = async (spec) => {
    if (!R.hasAny()) return { loaded: 0, missing: [] };
    const jobs = [];
    const missing = [];
    for (const req of R.requirements(spec)) {
      const it = R.bySource(MT.POLYHAVEN, req.id);
      if (!it) {
        missing.push(req);
        continue;
      }
      if (it.kind === MT.HDRI) jobs.push(loadHDRI(it));
      else if (it.kind === MT.TEXTURE) jobs.push(loadTexSet(it));
      else jobs.push(loadGLTF(it));
    }
    const libIds = new Set();
    for (const sh of spec.shots || []) {
      const p = (sh && sh.params) || {};
      if (!sh || (sh.template !== MT.SCENE && sh.template !== MT.SCENE3D)) continue;
      const env = ME.registry.environments[p.env] || {};
      for (const it of (env.props ? safeProps(env) : []).concat(p.items || [])) {
        if (it.asset) libIds.add(it.asset);
        for (const rd of it.riders || []) libIds.add(charId(spec, rd.who || rd.character));
      }
      for (const a of p.actors || []) libIds.add(charId(spec, a.who || a.character));
      for (const c of p.crowds || []) libIds.add(charId(spec, c.who || c.character));
    }
    for (const id of libIds) {
      const it = boundFor(id);
      if (it && it.kind !== MT.HDRI && it.kind !== MT.TEXTURE) jobs.push(loadGLTF(it));
    }
    for (const it of R.manifest.items) if (it.kind === MT.ANIMATION) jobs.push(loadGLTF(it));
    await Promise.all(jobs);
    return { loaded: jobs.length, missing };
  };
  const charId = (spec, who) => {
    if (!who) return MT.MAN_CASUAL;
    if (typeof who === MT.OBJECT) return who.id || MT.MAN_CASUAL;
    const cast = spec.cast || {};
    const c = cast[who];
    if (c) return typeof c === MT.STRING ? c : c.characterId || c.id || c.character || MT.MAN_CASUAL;
    return who;
  };
  const boundFor = (libId) => {
    const it = R.bound(libId);
    if (it) return it;
    const ch = ME.registry.characters[libId] || (ME.customCharacters && ME.customCharacters[libId]);
    if (ch) {
      if (ch.realModel && R.item(ch.realModel)) return R.item(ch.realModel);
      return R.bound(ch.gender === MT.FEMALE ? MT.FEMALE_2 : MT.MALE_2) || R.bound(MT.SYMBOL_7) || null;
    }
    return null;
  };
  R.boundFor = boundFor;
  const prepModel = (item, gltf) => {
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(src);
    const size = box.getSize(new T.Vector3());
    const isChar = item.kind === MT.CHARACTER;
    const hasSkin = !!findSkinned(src);
    let s = item.scale || 1;
    if (item.size) {
      const ref = isChar ? size.y : Math.max(size.x, size.y, size.z);
      if (ref > 0) s = item.size / ref;
    } else if (isChar && size.y > 0) s = 1.75 / size.y;
    else if (size.y > 50) s = 0.01;
    const center = box.getCenter(new T.Vector3());
    return {
      item,
      scene: src,
      animations: (gltf.animations || []).map((c) => cleanClip(c, item)),
      scale: s,
      offset: new T.Vector3(-center.x, -box.min.y, -center.z),
      yaw: ((item.yaw || 0) * PI) / 180 + (item.source === MT.POLYHAVEN ? 0 : PI / 2),
      size: size.clone().multiplyScalar(s),
      skinned: hasSkin,
      handBone: findBone(src, /right.?hand$|hand_r$|r_hand$|righthand/i),
    };
  };
  const findSkinned = (o) => {
    let f = null;
    o.traverse((x) => {
      if (!f && x.isSkinnedMesh) f = x;
    });
    return f;
  };
  const findBone = (o, re) => {
    let f = null;
    o.traverse((x) => {
      if (!f && x.isBone && re.test(x.name.replace(/^mixamorig\d*:?/i, ""))) f = x;
    });
    return f;
  };
  const boneKey = (n) =>
    String(n)
      .replace(/^mixamorig\d*[:_]?/i, "")
      .replace(/^.*[|:]/, "")
      .toLowerCase();
  const cleanClip = (clip, item) => {
    const c = clip.clone();
    if (item && item.clipNames && item.clipNames[clip.name]) c.name = item.clipNames[clip.name];
    for (const tr of c.tracks) {
      const [node, prop] = splitTrack(tr.name);
      if (prop === MT.POSITION && /hips|pelvis|root/i.test(node)) {
        const v = tr.values;
        const x0 = v[0],
          z0 = v[2];
        for (let i = 0; i < v.length; i += 3) {
          v[i] = x0;
          v[i + 2] = z0;
        }
      }
    }
    return c;
  };
  const splitTrack = (name) => {
    const i = name.lastIndexOf(MT.SYMBOL_8);
    return [name.slice(0, i), name.slice(i + 1)];
  };
  const retarget = (clip, rootObj) => {
    const names = new Map();
    rootObj.traverse((o) => {
      if (o.isBone || o.type === MT.BONE || o.isObject3D) names.set(boneKey(o.name), o.name);
    });
    const tracks = [];
    for (const tr of clip.tracks) {
      const [node, prop] = splitTrack(tr.name);
      const target = names.get(boneKey(node));
      if (!target) continue;
      if (prop === MT.SCALE) continue;
      const t2 = tr.clone();
      t2.name = MF.SYMBOL_9(`${target}`, `${prop}`);
      tracks.push(t2);
    }
    return tracks.length ? new T.AnimationClip(clip.name, clip.duration, tracks) : null;
  };
  const placeModel = (prep, params) => {
    const holder = new T.Group();
    const inner = prep.skinned ? X.SkeletonUtils.clone(prep.scene) : prep.scene.clone(true);
    if (prep.skinned) inner.traverse((o) => o.isSkinnedMesh && (o.frustumCulled = false));
    inner.position.copy(prep.offset);
    const scaler = new T.Group();
    scaler.scale.setScalar(prep.scale);
    scaler.add(inner);
    scaler.rotation.y = prep.yaw;
    holder.add(scaler);
    holder.userData.real = true;
    holder.userData.inner = inner;
    const def = MODELS[prep.item.sourceId];
    if (def && def.light && params && (params.night || params.lights)) {
      holder.userData.pointLight = { x: 0, y: prep.size.y * def.light.y, color: def.light.color, intensity: 30, distance: 14 };
    }
    return holder;
  };
  const ready = (map, id) => {
    const pr = map.get(id);
    return pr ? pr.__v : undefined;
  };
  const realAsset = (libId, params) => {
    const it = R.bound(libId);
    if (!it || it.kind === MT.CHARACTER || it.kind === MT.HDRI || it.kind === MT.TEXTURE || it.kind === MT.ANIMATION) return null;
    const prep = ready(cache.gltf, it.id);
    if (!prep) return null;
    const o = placeModel(prep, params);
    o.userData.assetId = libId;
    return o;
  };
  R.asset = realAsset;
  const ACTION_HINTS = {
    stand: /idle|breath|stand/i,
    walk: /walk/i,
    run: /run|sprint|jog/i,
    sneak: /sneak|crouch.?walk|creep/i,
    sit: /sit/i,
    talk: /talk|convers|explain/i,
    point: /point/i,
    wave: /wave|greet/i,
    look_around: /look|search/i,
    phone: /phone|text/i,
    dig: /dig|shovel/i,
    carry: /carry|box/i,
    push: /push/i,
    pull: /pull/i,
    type: /typ|keyboard/i,
    cheer: /cheer|celebrat|victory/i,
    fight: /punch|fight|box|sword|attack|slash/i,
    attack: /attack|slash|sword|stab|strike/i,
    charge: /run|sprint|charge/i,
    shoot_bow: /bow|archer|arrow/i,
    die: /death|dying|die/i,
    lie: /lying|sleep|lay/i,
    drive: /driv|sitting/i,
    ride_moto: /driv|sitting|ride/i,
    ride_bike: /cycl|bike|ride|sitting/i,
    ride_passenger: /sitting/i,
    dance: /danc|samba|hip.?hop/i,
    pray: /pray|kneel/i,
    kneel: /kneel/i,
    jump: /jump/i,
    climb: /climb/i,
    swim: /swim/i,
    hands_pocket: /idle/i,
    think: /think|idle/i,
    sad: /sad|cry/i,
    angry: /angry|yell/i,
    sweep_light: /walk|search/i,
    drag: /drag|pull|walk/i,
  };
  const MOVING = new Set([MT.WALK, MT.RUN, MT.SNEAK, MT.CHARGE, MT.DRAG, MT.SWEEP_LIGHT, MT.CARRY, MT.PUSH]);
  const STRIDE = { walk: 1.45, run: 2.6, sneak: 1.0, charge: 2.6, drag: 1.0, carry: 1.3, push: 1.1, sweep_light: 1.3 };
  const clipsFor = (prep) => {
    if (prep.__clips) return prep.__clips;
    const all = [];
    for (const c of prep.animations) all.push(c);
    for (const it of R.manifest.items) {
      if (it.kind !== MT.ANIMATION) continue;
      const ap = ready(cache.gltf, it.id);
      if (!ap) continue;
      for (const c of ap.animations) {
        const rc = retarget(c, prep.scene);
        if (rc) {
          rc.name = c.name;
          rc.__asset = it.id;
          all.push(rc);
        }
      }
    }
    const map = Object.assign({}, prep.item.actionMap || {});
    const byName = (n) => all.find((c) => c.name === n || MF.SYMBOL_5(`${c.__asset}`, `${c.name}`) === n);
    const resolved = {};
    for (const act of Object.keys(ACTION_HINTS)) {
      const chosen = (map[act] && byName(map[act])) || all.find((c) => ACTION_HINTS[act].test(c.name));
      if (chosen) resolved[act] = chosen;
    }
    resolved.stand = resolved.stand || all.find((c) => /idle/i.test(c.name)) || all[0] || null;
    resolved.walk = resolved.walk || resolved.run || resolved.stand;
    prep.__clips = { all, resolved };
    return prep.__clips;
  };
  const realCharacter = (ch) => {
    const it = boundFor(ch && ch.id);
    if (!it || it.kind !== MT.CHARACTER) return null;
    const prep = ready(cache.gltf, it.id);
    if (!prep) return null;
    const root = placeModel(prep, {});
    const inner = root.userData.inner;
    const hScale = (ch.height || 1) * (ch.age === MT.CHILD ? 0.62 : ch.age === MT.TEEN ? 0.9 : 1);
    root.scale.setScalar(hScale);
    const mixer = new T.AnimationMixer(inner);
    const { resolved } = clipsFor(prep);
    const hand = prep.handBone ? inner.getObjectByName(prep.handBone.name) : null;
    let cur = null;
    const play = (clip, time, w) => {
      const a = mixer.clipAction(clip);
      a.enabled = true;
      a.setEffectiveWeight(w);
      a.play();
      a.time = time % Math.max(0.001, clip.duration);
      return a;
    };
    const rig = {
      root,
      ch,
      hand,
      real: true,
      height: 1.75 * hScale,
      setAction(action, t, o = {}) {
        const clip = resolved[action] || (MOVING.has(action) ? resolved.walk : resolved.stand);
        if (!clip) return;
        mixer.stopAllAction();
        const stride = STRIDE[action] || 1.4;
        const time = o.moving && MOVING.has(action) ? ((o.dist || 0) / stride) * clip.duration : t * (o.speed || 1) + (o.phase || 0) * clip.duration;
        cur = play(clip, time, 1);
        if (o.prev && o.blend != null && o.blend < 1) {
          const pc = resolved[o.prev] || resolved.stand;
          if (pc && pc !== clip) {
            cur.setEffectiveWeight(o.blend);
            play(pc, t, 1 - o.blend);
          }
        }
        mixer.update(0);
      },
      setPose() {},
    };
    return rig;
  };
  R.character = realCharacter;
  const groundMat = (key, tp, repeatW, repeatD) => {
    const def = TEX[key];
    if (!def) return null;
    const it = R.bySource(MT.POLYHAVEN, def.id);
    const set = it && ready(cache.tex, it.id);
    if (!set || !set.map) return null;
    const rep = (t) => {
      if (!t) return null;
      const c = t.clone();
      c.repeat.set(repeatW / def.tile, repeatD / def.tile);
      c.needsUpdate = true;
      return c;
    };
    const m = new T.MeshStandardMaterial({ map: rep(set.map), normalMap: rep(set.normalMap), roughnessMap: rep(set.arm), aoMap: rep(set.arm), metalness: 0, roughness: 1 });
    if (set.arm) m.metalnessMap = null;
    m.normalScale.set(1, 1);
    return m;
  };
  const plane = (scene, mat, x0, x1, z0, z1, y = 0) => {
    const geo = new T.PlaneGeometry(x1 - x0, z1 - z0);
    geo.rotateX(-PI / 2);
    geo.setAttribute(MT.UV1, geo.attributes.uv.clone());
    const m = new T.Mesh(geo, mat);
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const leafTex = () =>
    K.canvasTex(MT.LEAFCARDS, 256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const r = U.rng(9);
      for (let i = 0; i < 260; i++) {
        const a = r() * PI * 2,
          d = Math.sqrt(r()) * w * 0.44;
        const x = w / 2 + Math.cos(a) * d,
          y = h / 2 + Math.sin(a) * d;
        const s = 6 + r() * 9;
        const k = 0.65 + r() * 0.5;
        g.fillStyle = MF.RGB(`${Math.round(52 * k)}`, `${Math.round(88 * k + r() * 20)}`, `${Math.round(34 * k)}`);
        g.save();
        g.translate(x, y);
        g.rotate(r() * PI * 2);
        g.beginPath();
        g.ellipse(0, 0, s, s * 0.45, 0, 0, PI * 2);
        g.fill();
        g.restore();
      }
    });
  const barkTex = () =>
    K.canvasTex(
      MT.BARKREAL,
      128,
      256,
      (g, w, h) => {
        g.fillStyle = MT.VALUE_4A3A2C;
        g.fillRect(0, 0, w, h);
        const r = U.rng(4);
        for (let i = 0; i < 140; i++) {
          g.fillStyle = MF.RGBA_2(`${r() < 0.5 ? MT.EXTRA_0 : MT.EXTRA_1}`, `${0.15 + r() * 0.3}`);
          g.fillRect(r() * w, r() * h, 1 + r() * 4, 10 + r() * 50);
        }
      },
      { repeat: true },
    );
  const realTree = (seed, height = 9, tint = 1) => {
    const r = U.rng(seed);
    const g = new T.Group();
    const bark = new T.MeshStandardMaterial({ map: barkTex(), roughness: 0.95 });
    bark.__shared = true;
    const trunk = new T.Mesh(K.cyl(0.16, 0.3, height * 0.62, 9), bark);
    trunk.position.y = height * 0.31;
    trunk.castShadow = trunk.receiveShadow = true;
    g.add(trunk);
    const leaf = new T.MeshStandardMaterial({ map: leafTex(), alphaTest: 0.45, side: T.DoubleSide, roughness: 0.8, color: new T.Color(tint, tint, tint) });
    const depth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: leafTex(), alphaTest: 0.45 });
    const geo = K.geo(MT.LEAFCARD, () => new T.PlaneGeometry(2.4, 2.4));
    const crownY = height * 0.68,
      crownR = height * 0.3;
    for (let i = 0; i < 46; i++) {
      const a = r() * PI * 2,
        e = (r() - 0.35) * PI * 0.6,
        d = Math.sqrt(r()) * crownR;
      const m = new T.Mesh(geo, leaf);
      m.position.set(Math.cos(a) * Math.cos(e) * d, crownY + Math.sin(e) * d * 1.1, Math.sin(a) * Math.cos(e) * d);
      m.rotation.set(r() * PI, r() * PI, r() * PI);
      m.scale.setScalar(0.7 + r() * 0.8);
      m.castShadow = true;
      m.customDepthMaterial = depth;
      g.add(m);
    }
    for (let i = 0; i < 5; i++) {
      const b = new T.Mesh(K.cyl(0.04, 0.09, height * 0.3, 6), bark);
      const a = r() * PI * 2;
      b.position.set(Math.cos(a) * 0.4, height * (0.5 + r() * 0.2), Math.sin(a) * 0.4);
      b.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8);
      g.add(b);
    }
    return g;
  };
  const TREE_IDS = new Set([MT.TREE_ROUND, MT.TREE_OAK, MT.TREE_AUTUMN, MT.TREE_BIRCH, MT.TREE_JUNGLE, MT.TREE_WILLOW, MT.TREE_BLOSSOM]);
  R.tree = realTree;
  const grassField = (scene, x0, x1, z0, z1, density, tp, seed = 3) => {
    const area = (x1 - x0) * (z1 - z0);
    const count = Math.min(120000, Math.round(area * 30 * density));
    if (count < 10) return null;
    const blade = K.geo(MT.GRASSCLUMP, () => {
      const pos = [],
        col = [];
      const r = U.rng(5);
      for (let b = 0; b < 7; b++) {
        const a = r() * PI,
          h = 0.06 + r() * 0.12,
          w = 0.022,
          lean = (r() - 0.5) * 0.25;
        const ox = (r() - 0.5) * 0.18,
          oz = (r() - 0.5) * 0.18;
        const cx = Math.cos(a) * w,
          cz = Math.sin(a) * w;
        const tipX = ox + lean,
          tipZ = oz;
        pos.push(ox - cx, 0, oz - cz, ox + cx, 0, oz + cz, tipX, h, tipZ);
        col.push(0.018, 0.032, 0.007, 0.018, 0.032, 0.007, 0.075, 0.115, 0.026);
      }
      const gg = new T.BufferGeometry();
      gg.setAttribute(MT.POSITION, new T.Float32BufferAttribute(pos, 3));
      gg.setAttribute(MT.COLOR, new T.Float32BufferAttribute(col, 3));
      gg.computeVertexNormals();
      return gg;
    });
    const mat = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.9, color: tp.night ? MT.VALUE_7A8A9A : MT.FFFFFF });
    const mesh = new T.InstancedMesh(blade, mat, count);
    const r = U.rng(seed);
    const m4 = new T.Matrix4(),
      q = new T.Quaternion(),
      s = new T.Vector3(),
      p = new T.Vector3(),
      up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      p.set(x0 + r() * (x1 - x0), 0, z0 + r() * (z1 - z0));
      q.setFromAxisAngle(up, r() * PI * 2);
      const k = 0.6 + r() * 0.6;
      s.set(k, k * (0.7 + r() * 0.6), k);
      m4.compose(p, q, s);
      mesh.setMatrixAt(i, m4);
      const k2 = 0.75 + r() * 0.55;
      mesh.setColorAt(i, new T.Color(k2 * (0.9 + r() * 0.25), k2, k2 * (0.8 + r() * 0.2)));
    }
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    scene.add(mesh);
    return mesh;
  };
  const waterPlane = (scene, x0, x1, z0, z1, tp) => {
    const nrm = K.canvasTex(
      MT.WATERNRM,
      256,
      256,
      (g, w, h) => {
        g.fillStyle = MT.RGB_128_128_255;
        g.fillRect(0, 0, w, h);
        const r = U.rng(3);
        for (let i = 0; i < 600; i++) {
          const x = r() * w,
            y = r() * h;
          g.fillStyle = MF.RGBA_255_0_35(`${100 + r() * 56}`, `${100 + r() * 56}`);
          g.beginPath();
          g.ellipse(x, y, 6 + r() * 14, 2 + r() * 4, 0, 0, PI * 2);
          g.fill();
        }
      },
      { repeat: true, linear: true },
    );
    const n = nrm.clone();
    n.wrapS = n.wrapT = T.RepeatWrapping;
    n.repeat.set((x1 - x0) / 6, (z1 - z0) / 6);
    n.needsUpdate = true;
    const mat = new T.MeshStandardMaterial({ color: tp.night ? MT.VALUE_0A1622 : MT.VALUE_1F4A5E, roughness: 0.08, metalness: 0.1, normalMap: n, normalScale: new T.Vector2(0.35, 0.35) });
    const m = plane(scene, mat, x0, x1, z0, z1, -0.05);
    m.userData.water = n;
    return m;
  };
  R.setupScene = (scene, info) => {
    const { env, tp, timeKey, WW, interior } = info;
    const recipe = R.recipe(env.id);
    if (!recipe) return null;
    const hdriItem = R.bySource(MT.POLYHAVEN, skyId(recipe, timeKey)) || (recipe.hdriItem && R.item(recipe.hdriItem));
    const hdr = hdriItem && ready(cache.hdri, hdriItem.id);
    const out = { cards: recipe.cards || MT.NONE, set: !!recipe.set, groundPainted: recipe.ground === MT.PAINTED, recipe, extras: [] };
    const xa = -WW * 0.6 * PX,
      xb = WW * 1.6 * PX;
    const inside = interior || [MT.ROOM, MT.OFFICE, MT.STUDIO, MT.HALL, MT.LOBBY, MT.WAREHOUSE, MT.CELLAR, MT.COSY, MT.BARE_ROOM, MT.PLAYROOM].includes(recipe.sky);
    const wide = recipe.wide != null ? recipe.wide : [MT.FIELD, MT.SUNSET, MT.OVERCAST, MT.DESERT, MT.SNOW, MT.COAST].includes(recipe.sky) || !!recipe.water;
    out.wide = wide;
    if (hdr) {
      const info2 = hdr.__info || { peak: 1, avg: 0.3, dir: new T.Vector3(-0.5, 0.7, 0.4) };
      const sunA = Math.atan2(-info2.dir.z, info2.dir.x);
      const want = Math.atan2(-0.55, -0.75);
      const rot = inside ? 0 : want - sunA;
      scene.environment = pmremOf(hdriItem.id, hdr);
      scene.environmentRotation = new T.Euler(0, rot, 0);
      if (!recipe.hideBg) {
        scene.background = hdr;
        scene.backgroundRotation = new T.Euler(0, rot, 0);
        scene.backgroundBlurriness = inside ? 0.04 : 0.0;
      } else scene.background = new T.Color(MT.VALUE_0B0A09);
      const night = timeKey === MT.NIGHT || timeKey === MT.INTERIOR_DARK;
      const exposure = U.clamp(Math.pow(0.45 / Math.max(0.002, info2.avg), 0.55), 0.35, night ? 6 : 2.2);
      scene.backgroundIntensity = 1;
      scene.environmentIntensity = 1;
      const sunStrength = inside ? 0 : U.clamp(Math.log10(1 + info2.peak) * 1.3, 0.15, 3.2);
      const sun = new T.DirectionalLight(night ? MT.BCD0FF : MT.FFF1DC, sunStrength);
      const dir = info2.dir.clone().applyAxisAngle(new T.Vector3(0, 1, 0), rot);
      if (dir.y < 0.15) dir.y = 0.15;
      dir.normalize();
      sun.castShadow = sunStrength > 0.2;
      sun.shadow.mapSize.set(4096, 4096);
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.02;
      sun.shadow.radius = 3;
      const sc = sun.shadow.camera;
      sc.near = 1;
      sc.far = 160;
      scene.add(sun, sun.target);
      const hemi = new T.HemisphereLight(night ? MT.VALUE_2A3550 : MT.FFFFFF, night ? MT.VALUE_0A0C10 : MT.VALUE_6A5A48, night ? 0.15 : 0.12);
      scene.add(hemi);
      if (!recipe.hideBg && !inside && wide) {
        const hz = info2.horizon || [0.6, 0.65, 0.7];
        const fc = new T.Color(hz[0], hz[1], hz[2]).multiplyScalar(exposure * 0.9);
        fc.r = Math.min(1, fc.r);
        fc.g = Math.min(1, fc.g);
        fc.b = Math.min(1, fc.b);
        scene.fog = new T.Fog(fc.convertLinearToSRGB(), 40, 420);
      }
      out.light = { sun, hemi, L: { sunPos: [dir.x * 60, dir.y * 60, dir.z * 60], exposure }, real: true };
    } else {
      out.light = null;
    }
    const zBack = inside ? -9 : -60;
    if (recipe.ground === MT.WATER) {
      waterPlane(scene, xa - 200, xb + 200, -400, 30, tp);
    } else if (!out.groundPainted) {
      const far = inside ? 12 : wide ? 600 : 46;
      const gm = groundMat(recipe.ground, tp, xb - xa + (wide ? far * 2 : 160), far + 30);
      if (gm) {
        const gp = plane(scene, gm, xa - (wide ? far : 80), xb + (wide ? far : 80), -far, 30);
        if (!wide && !inside) {
          gm.transparent = true;
          gm.depthWrite = true;
          gm.onBeforeCompile = (sh) => {
            sh.vertexShader = sh.vertexShader.replace(MT.VOID_MAIN, MT.VARYING_FLOAT_VFADEZ_VOID_MAIN).replace(MT.INCLUDE_PROJECT_VERTEX, MT.INCLUDE_PROJECT_VERTEX_VFADEZ_MODELMATRIX_VEC4_TRANSFORMED_1);
            sh.fragmentShader = sh.fragmentShader.replace(MT.VOID_MAIN, MT.VARYING_FLOAT_VFADEZ_VOID_MAIN).replace(MT.INCLUDE_ALPHATEST_FRAGMENT, MT.DIFFUSECOLOR_A_SMOOTHSTEP_44_0_22_0_VFADEZ);
          };
          gm.customProgramCacheKey = () => MT.GROUNDFADE;
          gp.renderOrder = -1;
        }
      } else out.groundPainted = true;
      if (!out.groundPainted && recipe.road) {
        const rm = groundMat(recipe.road, tp, xb - xa + 200, 7);
        if (rm) {
          plane(scene, rm, xa - 100, xb + 100, -7.6, -1.4, 0.005);
          const kerb = new T.Mesh(K.box(xb - xa + 200, 0.14, 0.25), K.mat(MT.VALUE_9A968E));
          kerb.position.set((xa + xb) / 2, 0.07, -1.35);
          kerb.receiveShadow = kerb.castShadow = true;
          scene.add(kerb);
        }
      }
      if (recipe.water) waterPlane(scene, xa - 200, xb + 200, -400, -16, tp);
    }
    if (recipe.grass && !inside && !out.groundPainted) {
      const cx0 = xa,
        cx1 = xb;
      grassField(scene, cx0, cx1, -26, recipe.road ? -8 : 6, recipe.grass * (tp.night ? 0.7 : 1), tp, 7);
      if (recipe.road) grassField(scene, cx0, cx1, -1.2, 6, recipe.grass * 0.6, tp, 9);
    }
    const r = U.rng(env.id.length * 31 + 7);
    for (let i = 0; i < (recipe.trees || 0); i++) {
      const tr = realTree(i + 3, 7 + r() * 6, tp.night ? 0.45 : 1);
      tr.position.set(xa + r() * (xb - xa), 0, -14 - r() * 30);
      tr.rotation.y = r() * PI * 2;
      scene.add(tr);
    }
    for (const s of recipe.scatter || []) {
      const it = R.bySource(MT.POLYHAVEN, s.m);
      const prep = it && ready(cache.gltf, it.id);
      if (!prep) continue;
      for (let i = 0; i < s.n; i++) {
        const o = placeModel(prep, {});
        o.position.set(xa + r() * (xb - xa), 0, -11 - r() * 18);
        o.rotation.y = r() * PI * 2;
        o.scale.multiplyScalar(0.7 + r() * 0.6);
        scene.add(o);
      }
    }
    out.floor = { tex: null, zBack, backdrop: null };
    return out;
  };
  const composers = new Map();
  R.render = (S, camera, W, H, ctx) => {
    const r = K.renderer(W, H, { shadows: true });
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = (S.light && S.light.L && S.light.L.exposure) || 1;
    const q = ctx.quality || {};
    const fx = q.bloom !== false && X.EffectComposer;
    if (!fx) {
      r.render(S.scene, camera);
      return r.domElement;
    }
    const key = MF.X(`${W}`, `${H}`);
    let c = composers.get(key);
    if (!c) {
      const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: q.layerScale >= 1 ? 4 : 0 });
      const comp = new X.EffectComposer(r, rt);
      comp.setPixelRatio(1);
      comp.setSize(W, H);
      const rp = new X.RenderPass(S.scene, camera);
      comp.addPass(rp);
      let ao = null;
      if (X.GTAOPass && q.layerScale >= 1) {
        ao = new X.GTAOPass(S.scene, camera, W, H);
        ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1, thickness: 1, scale: 1 });
        ao.blendIntensity = 0.85;
        comp.addPass(ao);
      }
      const bloom = new X.UnrealBloomPass(new T.Vector2(W, H), 0.22, 0.55, 0.92);
      comp.addPass(bloom);
      comp.addPass(new X.OutputPass());
      c = { comp, rp, ao };
      composers.set(key, c);
    }
    c.rp.scene = S.scene;
    c.rp.camera = camera;
    if (c.ao) {
      c.ao.scene = S.scene;
      c.ao.camera = camera;
      if (c.ao.gtaoMaterial && c.ao.gtaoMaterial.uniforms.cameraNear) {
        c.ao.gtaoMaterial.uniforms.cameraNear.value = camera.near;
        c.ao.gtaoMaterial.uniforms.cameraFar.value = camera.far;
        c.ao.gtaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
        c.ao.gtaoMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
      }
    }
    c.comp.render();
    return r.domElement;
  };
  R.animateWater = (scene, t) =>
    scene.traverse((o) => {
      if (o.userData.water) o.userData.water.offset.set(t * 0.02, t * 0.035);
    });
  const BAKE = new Map();
  const bakeCrowd = (ch, action, makeRig, quality) => {
    const key = MF.SYMBOL_10(`${ch.id || U.stringifyJson(ch)}`, `${action}`, `${quality}`);
    if (BAKE.has(key)) return BAKE.get(key);
    const F = 8,
      fw = quality >= 1 ? 192 : 128,
      fh = fw * 2;
    const r = K.renderer(fw * F, fh, { shadows: false });
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight(MT.FFFFFF, MT.VALUE_8A8070, 2.2));
    const key1 = new T.DirectionalLight(MT.FFFFFF, 1.6);
    key1.position.set(3, 5, 6);
    scene.add(key1);
    const rig = makeRig();
    scene.add(rig.root);
    const cam = new T.OrthographicCamera(-0.55, 0.55, 2.05, -0.15, 0.1, 50);
    cam.position.set(0, 0, 10);
    cam.lookAt(0, 0, 0);
    const oldClear = r.getClearAlpha();
    r.setClearColor(0x000000, 0);
    r.setScissorTest(true);
    const act = ME.registry.actions[action] || ME.registry.actions.stand;
    for (let f = 0; f < F; f++) {
      const ph = (f / F) * PI * 2;
      if (rig.setAction) rig.setAction(action, (f / F) * 1.0, { moving: MOVING.has(action), dist: (f / F) * (STRIDE[action] || 1.4) });
      else rig.setPose(act.pose(ph, f / F, {}), { action });
      rig.root.rotation.y = -0.35;
      r.setViewport(f * fw, 0, fw, fh);
      r.setScissor(f * fw, 0, fw, fh);
      r.render(scene, cam);
    }
    r.setScissorTest(false);
    r.setViewport(0, 0, fw * F, fh);
    r.setClearColor(0x000000, oldClear);
    const canvas = ME.makeCanvas(fw * F, fh);
    canvas.getContext(MT.VALUE_2D).drawImage(r.domElement, 0, 0);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    const frames = [];
    for (let f = 0; f < F; f++) {
      const t = tex.clone();
      t.repeat.set(1 / F, 1);
      t.offset.set(f / F, 0);
      t.needsUpdate = true;
      frames.push(t);
    }
    const out = { frames, F, h: 2.2 * (rig.height ? rig.height / 1.75 : 1), w: 1.1 * (rig.height ? rig.height / 1.75 : 1) };
    BAKE.set(key, out);
    return out;
  };
  const formation = (c) => {
    const n = Math.max(1, Math.min(6000, Math.round(c.count || 40)));
    const gap = c.spacing || (c.formation === MT.SCATTER ? 1.6 : 1.05);
    const pts = [];
    const r = U.rng(n * 7 + (c.seed || 1));
    if (c.formation === MT.LINE) for (let i = 0; i < n; i++) pts.push([(i - n / 2) * gap, 0]);
    else if (c.formation === MT.COLUMN) {
      const cols = c.cols || 4;
      for (let i = 0; i < n; i++) pts.push([-Math.floor(i / cols) * gap, -(i % cols) * gap]);
    } else if (c.formation === MT.SCATTER) {
      const side = Math.sqrt(n) * gap * 1.4;
      for (let i = 0; i < n; i++) pts.push([(r() - 0.5) * side * 1.6, -r() * side]);
    } else if (c.formation === MT.BLOCKS) {
      const per = Math.max(20, Math.min(400, Math.round(n / Math.max(1, Math.round(n / 160)))));
      const units = Math.ceil(n / per);
      const cols = Math.ceil(Math.sqrt(per * 2.2)),
        rows = Math.ceil(per / cols);
      for (let u = 0; u < units; u++)
        for (let k = 0; k < per && pts.length < n; k++) {
          const ux = (u - (units - 1) / 2) * (cols * gap + 6);
          pts.push([ux + ((k % cols) - cols / 2) * gap, -Math.floor(k / cols) * gap - (u % 3 === 1 ? rows * gap * 0.35 : 0)]);
        }
    } else {
      const cols = c.cols || Math.ceil(Math.sqrt(n * 2.5)),
        rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) pts.push([((i % cols) - cols / 2) * gap, -Math.floor(i / cols) * gap]);
      void rows;
    }
    return pts.map(([x, z]) => [x + (r() - 0.5) * gap * 0.22, z + (r() - 0.5) * gap * 0.22, r()]);
  };
  K.crowd = (scene, c, ctx, info) => {
    const ch = info.character;
    const action = c.action || MT.STAND;
    const quality = (ctx.quality && ctx.quality.layerScale) || 1;
    const makeRig = () => (R.character && info.real && R.character(ch)) || K.character(ch);
    const bake = bakeCrowd(ch, action, makeRig, quality);
    const pts = formation(c);
    const geo = K.geo(MF.CROWDQUAD(`${bake.w.toFixed(2)}`, `${bake.h.toFixed(2)}`), () => {
      const g = new T.PlaneGeometry(bake.w, bake.h);
      g.translate(0, bake.h / 2 - 0.08, 0);
      return g;
    });
    const tint = info.tint || 1;
    const meshes = bake.frames.map((map) => {
      const mat = new T.MeshBasicMaterial({ map, alphaTest: 0.45, side: T.DoubleSide, color: new T.Color(tint, tint, tint), fog: true });
      const m = new T.InstancedMesh(geo, mat, pts.length);
      m.count = 0;
      m.castShadow = true;
      m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map, alphaTest: 0.45 });
      m.frustumCulled = false;
      scene.add(m);
      return m;
    });
    const flags = [];
    if (c.banners) {
      const bm = K.mat(c.bannerColor || MT.VALUE_9A1A1A, { side: 2 });
      for (let i = 0; i < pts.length; i += Math.max(30, Math.round(pts.length / 8))) {
        const f = K.group(K.mesh(K.cyl(0.03, 0.03, 3.6, 6), MT.VALUE_5A4A3A, 0, 1.8, 0), K.mesh(K.box(0.04, 0.9, 0.7), bm, 0, 3.1, 0.35));
        scene.add(f);
        flags.push({ f, i });
      }
    }
    return { meshes, pts, bake, flags, spec: c, moving: MOVING.has(action) };
  };
  const _m4 = new T.Matrix4(),
    _q = new T.Quaternion(),
    _s = new T.Vector3(),
    _p = new T.Vector3(),
    _up = new T.Vector3(0, 1, 0);
  K.updateCrowd = (cr, base, t, camera, facing) => {
    const counts = new Array(cr.meshes.length).fill(0);
    const F = cr.bake.F;
    const speed = cr.spec.cadence || (cr.moving ? 1.6 : 0.6);
    for (let i = 0; i < cr.pts.length; i++) {
      const [x, z, rnd] = cr.pts[i];
      const wx = base.x + x * facing,
        wz = base.z + z;
      const fr = Math.floor((t * speed + rnd) * F) % F;
      const m = cr.meshes[fr];
      const k = counts[fr]++;
      _p.set(wx, base.y, wz);
      const yaw = Math.atan2(camera.position.x - wx, camera.position.z - wz);
      _q.setFromAxisAngle(_up, yaw);
      const sc = (cr.spec.scale || 1) * (0.94 + rnd * 0.12);
      _s.set(sc * facing, sc, sc);
      _m4.compose(_p, _q, _s);
      m.setMatrixAt(k, _m4);
    }
    cr.meshes.forEach((m, i) => {
      m.count = counts[i];
      m.instanceMatrix.needsUpdate = true;
    });
    for (const fl of cr.flags) {
      const [x, z] = cr.pts[fl.i];
      fl.f.position.set(base.x + x * facing, base.y, base.z + z - 0.3);
      fl.f.rotation.y = facing < 0 ? PI : 0;
    }
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
