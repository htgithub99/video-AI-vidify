if __package__:
    from .runtime_text import RuntimeText as _CODE_TEXT
else:
    from runtime_text import RuntimeText as _CODE_TEXT
import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chars import ARCH, build_char, inner
from render import render, sheet
style = sys.argv[1]
from chibi_design import BODY, FACE
P = {_CODE_TEXT.CHIBI_FOLK: {**BODY, **FACE}, _CODE_TEXT.MINIMAL_MASK: dict(head=0.36, headW=1.0, bodyW=1.22, overlap=0.08, eyeY=0.41, eyeGap=0.3, mouthY=0.74)}[style]
items = []
for k in ARCH:
    c = build_char(k, style)
    parts = []
    for i, view in enumerate([_CODE_TEXT.FRONT, _CODE_TEXT.SIDE, _CODE_TEXT.BACK]):
        total = 330 * c[_CODE_TEXT.HEIGHT]
        hh = total * P[_CODE_TEXT.HEAD]
        hw = hh * P[_CODE_TEXT.HEADW]
        bh = total - hh * (1 - P[_CODE_TEXT.OVERLAP])
        bw = hw * P[_CODE_TEXT.BODYW]
        x0 = 70 + i * 150
        base = 380
        if c[_CODE_TEXT.BODY]:
            parts.append(_CODE_TEXT.SVG_X_F_Y_F_WIDTH_F_HEIGHT_F_VIEWBOX_0_0_400_600_PRESERVEASP % (x0 - bw / 2, base - bh, bw, bh, inner(c[_CODE_TEXT.BODY][view])))
        else:
            parts.append(_CODE_TEXT.PATH_D_M_F_F_L_F_F_Q_F_F_F_F_Z_FILL_S_STROKE_0B0B0D_STROKE_W % (x0 - bw / 2, base + 20, x0 - bw / 2, base - bh + 30, x0, base - bh - 30, x0 + bw / 2, base - bh + 30, c[_CODE_TEXT.COLORS][_CODE_TEXT.BODY]))
        hy = base - bh - hh + hh * P[_CODE_TEXT.OVERLAP]
        parts.append(_CODE_TEXT.SVG_X_F_Y_F_WIDTH_F_HEIGHT_F_VIEWBOX_0_0_400_400_PRESERVEASP % (x0 - hw / 2, hy, hw, hh, inner(c[_CODE_TEXT.HEAD][view])))
        if view != _CODE_TEXT.BACK:
            off = 0 if view == _CODE_TEXT.FRONT else hw * 0.12
            for ex in ([0.5 - P[_CODE_TEXT.EYEGAP] / 2, 0.5 + P[_CODE_TEXT.EYEGAP] / 2] if view == _CODE_TEXT.FRONT else [0.59]):
                parts.append(_CODE_TEXT.ELLIPSE_CX_F_CY_F_RX_F_RY_F_FILL_111 % (x0 - hw / 2 + ex * hw + off, hy + P[_CODE_TEXT.EYEY] * hh, hw * (0.11 if style == _CODE_TEXT.MINIMAL_MASK else 0.03), hh * (0.18 if style == _CODE_TEXT.MINIMAL_MASK else 0.03)))
    sp = ''
    if c[_CODE_TEXT.SPRITES]:
        for j, n in enumerate(c[_CODE_TEXT.SPRITES]):
            sp += _CODE_TEXT.SVG_X_D_Y_20_WIDTH_120_HEIGHT_120_VIEWBOX_0_0_500_500_S_SVG % (480 + j * 0, inner(c[_CODE_TEXT.SPRITES][n][_CODE_TEXT.SVG_ACDB13])) if False else _CODE_TEXT.SVG_X_D_Y_D_WIDTH_110_HEIGHT_110_VIEWBOX_0_0_500_500_S_SVG % (500, 10 + j * 125, inner(c[_CODE_TEXT.SPRITES][n][_CODE_TEXT.SVG_ACDB13]))
    items.append(_CODE_TEXT.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_640_400_STYLE % (''.join(parts), sp, k))
imgs = asyncio.run(render(items, 320, 200))
sheet(imgs, 5, _CODE_TEXT.CHARS_S_JPG % style)
