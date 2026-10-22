import sys, os, json, hashlib, datetime
STYLES = {'minimal_mask': 'stl-ba8ca635c716c880', 'chibi_folk': 'stl-e70fac00bbf44662'}
NOW = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
src, out = sys.argv[1], sys.argv[2]
def pid(prefix, seed):
    return prefix + hashlib.sha256(seed.encode()).hexdigest()[:16]
n = 0
for style, sid in STYLES.items():
    d = json.load(open(os.path.join(src, style + '.json'), encoding='utf-8'))
    for kind, prefix, items in (('set_piece', 'pcs-', d['pieces']), ('set_base', 'bas-', d['bases'])):
        os.makedirs(os.path.join(out, kind), exist_ok=True)
        for key, it in items.items():
            rec = dict(it)
            rec.update(id=pid(prefix, 'seedv1:%s:%s' % (style, key)), type=kind, styleId=sid, tags=['seed', key], uses=0, updatedAt=NOW)
            if kind == 'set_piece':
                rec['source'] = 'seed'
            json.dump(rec, open(os.path.join(out, kind, rec['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
            n += 1
print(n)
