import sys, os, re, json, hashlib, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scenes import SCENES, build
from props import PROPS, build_prop
from chars import ARCH, build_char
from spots import spots_for
from scenes import T

SRC = '/home/claude/w/src/constants/motionPuppetSeed.ts'
OUT = sys.argv[1]
STYLES = {'minimal_mask': 'stl-ba8ca635c716c880', 'chibi_folk': 'stl-e70fac00bbf44662'}
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

text = open(SRC, encoding='utf-8').read()
places, props = [], []
for m in re.finditer(r'\{ key: "([a-z_]+)", name: "([^"]+)", desc: "([^"]+)", interior: (true|false), night: (true|false), tags: (\[[^\]]*\]) \}', text):
    places.append(dict(key=m[1], name=m[2], desc=m[3], interior=m[4] == 'true', night=m[5] == 'true', tags=json.loads(m[6])))
for m in re.finditer(r'\{ key: "([a-z_]+)", name: "([^"]+)", note: "([^"]+)", tags: (\[[^\]]*\]) \}', text):
    props.append(dict(key=m[1], name=m[2], note=m[3], tags=json.loads(m[4])))
assert len(places) == len(SCENES), (len(places), len(SCENES))
assert len(props) == len(PROPS), (len(props), len(PROPS))


def pid(prefix, seed):
    return prefix + hashlib.sha256(seed.encode()).hexdigest()[:16]


def write(kind, asset):
    d = os.path.join(OUT, kind)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, asset['id'] + '.json'), 'w', encoding='utf-8') as fh:
        json.dump(asset, fh, ensure_ascii=False)


SIZE = {'coffin': 2.0, 'grave_mound': 2.2, 'tombstone': 0.9, 'rope': 1.2, 'firewood': 0.8, 'bones': 0.6, 'machete': 0.6, 'axe': 0.8, 'red_wedding_dress': 1.4, 'embroidered_scarf': 1.2, 'white_mourning_headband': 0.6, 'walking_stick': 1.1, 'torch': 0.8, 'temple_bell': 1.2, 'paper_effigy': 1.0}
MOUNT = {'coffin': 'floor', 'grave_mound': 'floor', 'tombstone': 'floor', 'water_jar': 'floor', 'bamboo_basket': 'floor', 'firewood': 'floor', 'paper_effigy': 'floor', 'black_cat': 'floor', 'temple_bell': 'hang', 'cooking_pot': 'floor',
         'walking_stick': 'held', 'torch': 'held', 'axe': 'held', 'machete': 'held', 'ghost_fire': 'air', 'crow': 'floor', 'owl': 'hang', 'rope': 'hang', 'red_wedding_dress': 'hang', 'bones': 'floor', 'conical_hat': 'table'}
count = 0
VARIANTS = 4
for style, sid in STYLES.items():
    for pl in places:
        tag_side = 'interior' if pl['interior'] else 'exterior'
        tags = list(dict.fromkeys([pl['key'], tag_side, 'seed'] + pl['tags']))
        for v in range(VARIANTS):
            suffix = '' if v == 0 else ':v%d' % v
            base_id = pid('set-', 'seedv1:%s:%s%s' % (style, pl['key'], suffix))
            night_id = pid('set-', 'seedv1:%s:%s%s:night' % (style, pl['key'], suffix))
            svg_d, fy, lights = build(pl['key'], style, False, v)
            fy = max(600, min(960, fy))
            svg_n, _, _ = build(pl['key'], style, True, v)
            name = pl['name'] if v == 0 else '%s (%d)' % (pl['name'], v + 1)
            sp = spots_for(pl['key'], T(style, False, seed=0, v=v), fy, v)
            common = dict(type='set', styleId=sid, group='seed:' + pl['key'], desc=pl['desc'], interior=pl['interior'], floorY=fy, spots=sp, lights=lights, uses=0, updatedAt=NOW)
            write('set', dict(id=night_id, name=name + '~night', tags=tags + ['night'], time='night', svg=svg_n, **common))
            write('set', dict(id=base_id, name=name, tags=tags, time='day', svg=svg_d, variants={'night': night_id}, **common))
            count += 2
    for pr in props:
        svg, h = build_prop(pr['key'], style)
        write('prop', dict(id=pid('prp-', 'seedv1:%s:%s' % (style, pr['key'])), type='prop', styleId=sid, key=pr['key'], name=pr['name'], desc=pr['note'],
                           tags=list(dict.fromkeys([pr['key'], 'seed'] + pr['tags'])), svg=svg, base=[256, 480], height=h, size=SIZE.get(pr['key'], h), mount=MOUNT.get(pr['key'], 'table'), uses=0, updatedAt=NOW))
        count += 1
    for key, a in ARCH.items():
        c = build_char(key, style)
        write('character_kit', dict(id=pid('chr-', 'seedv1:%s:char:%s' % (style, key)), type='character_kit', styleId=sid, archetype=key, group=a['group'], gender=a['gender'], age=a['age'],
                                    name=a['name'], role=a['group'], desc=a['desc'], tags=['seed', 'archetype', key, a['group'], a['gender'], a['age']], story='', height=c['height'], colors=c['colors'],
                                    head=c['head'], body=c['body'], sprites=c['sprites'], uses=0, updatedAt=NOW))
        count += 1
print(count)
