if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
from library_release import assert_legacy_library_target
import sys, os, json, hashlib, datetime
from seed_utils import resource_semantics, validate_asset_geometry
STYLES = {_CODE_TEXT.MINIMAL_MASK: _CODE_TEXT.STL_BA8CA635C716C880, _CODE_TEXT.CHIBI_FOLK: _CODE_TEXT.STL_E70FAC00BBF44662}
NOW = datetime.datetime.now(datetime.timezone.utc).strftime(_CODE_TEXT.Y_M_DT_H_M_S_000Z)
src, out = sys.argv[1], sys.argv[2]
assert_legacy_library_target(out)
def pid(prefix, seed):
    return prefix + hashlib.sha256(seed.encode()).hexdigest()[:16]
n = 0
for style, sid in STYLES.items():
    d = json.load(open(os.path.join(src, style + _CODE_TEXT.JSON), encoding=_CODE_TEXT.UTF_8))
    for kind, prefix, items in ((_CODE_TEXT.SET_PIECE, _CODE_TEXT.PCS, d[_CODE_TEXT.PIECES]), (_CODE_TEXT.SET_BASE, _CODE_TEXT.BAS, d[_CODE_TEXT.BASES])):
        os.makedirs(os.path.join(out, kind), exist_ok=True)
        for key, it in items.items():
            rec = dict(it)
            rec.update(id=pid(prefix, _CODE_TEXT.SEEDV1_S_S % (style, key)), type=kind, styleId=sid, tags=[_CODE_TEXT.SEED, key], uses=0, updatedAt=NOW)
            if kind == _CODE_TEXT.SET_PIECE:
                rec[_CODE_TEXT.SOURCE] = _CODE_TEXT.SEED
            resource_semantics(rec)
            validate_asset_geometry(rec, rec[_CODE_TEXT.ID])
            json.dump(rec, open(os.path.join(out, kind, rec[_CODE_TEXT.ID] + _CODE_TEXT.JSON), _CODE_TEXT.W, encoding=_CODE_TEXT.UTF_8), ensure_ascii=False)
            n += 1
print(n)
