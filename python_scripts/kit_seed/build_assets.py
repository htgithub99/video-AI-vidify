from library_release import assert_legacy_library_target
from seed_texts import SeedText as KST
import subprocess
from seed_utils import SEED_STYLES, seed_id, seed_timestamp, resource_semantics, validate_asset_geometry
import sys, os, json
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from props import PROPS, build_prop
from chars import ARCH, build_char
from chibi_design import DESCRIPTIONS, VERSION as CHIBI_VERSION
from spots import spots_for
from scenes import T
SRC = Path(__file__).resolve().parents[2] / KST.SRC / KST.CONSTANTS / KST.MOTIONPUPPETSEED_TS
OUT = sys.argv[1]
assert_legacy_library_target(OUT)
STYLES = SEED_STYLES
NOW = seed_timestamp()
catalog = json.loads(subprocess.run([os.environ.get(KST.KIT_NODE, KST.NODE), str(Path(__file__).with_name(KST.EXPORT_SEED_CATALOG_CJS)), str(SRC)], check=True, capture_output=True, text=True, encoding=KST.UTF_8).stdout)
places, props = (catalog[KST.PLACES], catalog[KST.PROPS])
assert len(places) == len(SCENES), (len(places), len(SCENES))
assert len(props) == len(PROPS), (len(props), len(PROPS))
pid = seed_id
def write(kind, asset):
    resource_semantics(asset)
    validate_asset_geometry(asset, asset[KST.ID])
    d = os.path.join(OUT, kind)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, asset[KST.ID] + KST.JSON_EXTENSION), KST.W, encoding=KST.UTF_8) as fh:
        json.dump(asset, fh, ensure_ascii=False)
SIZE = {KST.COFFIN: 2.0, KST.GRAVE_MOUND: 2.2, KST.TOMBSTONE: 0.9, KST.ROPE: 1.2, KST.FIREWOOD: 0.8, KST.BONES: 0.6, KST.MACHETE: 0.6, KST.AXE: 0.8, KST.RED_WEDDING_DRESS: 1.4, KST.EMBROIDERED_SCARF: 1.2, KST.WHITE_MOURNING_HEADBAND: 0.6, KST.WALKING_STICK: 1.1, KST.TORCH: 0.8, KST.TEMPLE_BELL: 1.2, KST.PAPER_EFFIGY: 1.0}
MOUNT = {
    KST.COFFIN: KST.FLOOR,
    KST.GRAVE_MOUND: KST.FLOOR,
    KST.TOMBSTONE: KST.FLOOR,
    KST.WATER_JAR: KST.FLOOR,
    KST.BAMBOO_BASKET: KST.FLOOR,
    KST.FIREWOOD: KST.FLOOR,
    KST.PAPER_EFFIGY: KST.FLOOR,
    KST.BLACK_CAT: KST.FLOOR,
    KST.TEMPLE_BELL: KST.HANG,
    KST.COOKING_POT: KST.FLOOR,
    KST.WALKING_STICK: KST.HELD,
    KST.TORCH: KST.HELD,
    KST.AXE: KST.HELD,
    KST.MACHETE: KST.HELD,
    KST.GHOST_FIRE: KST.AIR,
    KST.CROW: KST.FLOOR,
    KST.OWL: KST.HANG,
    KST.ROPE: KST.HANG,
    KST.RED_WEDDING_DRESS: KST.HANG,
    KST.BONES: KST.FLOOR,
    KST.CONICAL_HAT: KST.TABLE,
}
from refprops import REF_PROPS
for _k, (_fn, _h, _m) in REF_PROPS.items():
    SIZE[_k] = _h
    MOUNT[_k] = _m
count = 0
VARIANTS = 4
for style, sid in STYLES.items():
    for pl in places:
        tag_side = KST.INTERIOR if pl[KST.INTERIOR] else KST.EXTERIOR
        tags = list(dict.fromkeys([pl[KST.KEY], tag_side, KST.SEED] + pl[KST.TAGS]))
        for v in range(VARIANTS):
            suffix = KST.EMPTY if v == 0 else KST.V_D % v
            base_id = pid(KST.SET_ID_PREFIX, KST.SEEDV1_S_S_S % (style, pl[KST.KEY], suffix))
            night_id = pid(KST.SET_ID_PREFIX, KST.SEEDV1_S_S_S_NIGHT % (style, pl[KST.KEY], suffix))
            svg_d, fy, lights = build(pl[KST.KEY], style, False, v)
            fy = max(600, min(960, fy))
            svg_n, _, _ = build(pl[KST.KEY], style, True, v)
            name = pl[KST.NAME] if v == 0 else KST.S_D % (pl[KST.NAME], v + 1)
            sp = spots_for(pl[KST.KEY], T(style, False, seed=0, v=v), fy, v)
            common = dict(type=KST.SET, styleId=sid, group=KST.SEED_GROUP_PREFIX + pl[KST.KEY], desc=pl[KST.DESC], interior=pl[KST.INTERIOR], floorY=fy, spots=sp, lights=lights, uses=0, updatedAt=NOW)
            write(KST.SET, dict(id=night_id, name=name + KST.NIGHT_VARIANT_SUFFIX, tags=tags + [KST.NIGHT], time=KST.NIGHT, svg=svg_n, **common))
            write(KST.SET, dict(id=base_id, name=name, tags=tags, time=KST.DAY, svg=svg_d, variants={KST.NIGHT: night_id}, **common))
            count += 2
    for pr in props:
        svg, h = build_prop(pr[KST.KEY], style)
        write(KST.PROP, dict(id=pid(KST.PRP, KST.SEEDV1_S_S % (style, pr[KST.KEY])), type=KST.PROP, styleId=sid, key=pr[KST.KEY], name=pr[KST.NAME], desc=pr[KST.NOTE], tags=list(dict.fromkeys([pr[KST.KEY], KST.SEED] + pr[KST.TAGS])), svg=svg, base=[256, 480], height=h, size=SIZE.get(pr[KST.KEY], h), mount=MOUNT.get(pr[KST.KEY], KST.TABLE), uses=0, updatedAt=NOW))
        count += 1
    for key, a in ARCH.items():
        c = build_char(key, style)
        write(
            KST.CHARACTER_KIT,
            dict(
                id=pid(KST.CHR, KST.SEEDV1_S_CHAR_S % (style, key)),
                type=KST.CHARACTER_KIT,
                styleId=sid,
                archetype=key,
                group=a[KST.GROUP],
                gender=a[KST.GENDER],
                age=a[KST.AGE],
                name=a[KST.NAME],
                role=a[KST.GROUP],
                desc=DESCRIPTIONS.get(key, a[KST.DESC]) if style == KST.CHIBI_FOLK else a[KST.DESC],
                tags=[KST.SEED, KST.ARCHETYPE, key, a[KST.GROUP], a[KST.GENDER], a[KST.AGE]],
                story=KST.EMPTY,
                height=c[KST.HEIGHT],
                colors=c[KST.COLORS],
                head=c[KST.HEAD],
                body=c[KST.BODY],
                sprites=c[KST.SPRITES],
                uses=0,
                updatedAt=NOW,
                **(dict(chibiDesignVersion=CHIBI_VERSION) if style == KST.CHIBI_FOLK else {}),
            ),
        )
        count += 1
print(count)
from migrate_scene_components import migrate
migrate(Path(OUT).resolve(), Path(OUT).resolve().parent / "scene-component-migration", True)
