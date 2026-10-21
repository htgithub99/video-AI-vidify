import sys, os, asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chars import ARCH, build_char, inner
from render import render, sheet
style = sys.argv[1]
P = {'chibi_folk': dict(head=0.48, headW=1.06, bodyW=0.82, overlap=0.06, eyeY=0.57, eyeGap=0.36, mouthY=0.75), 'minimal_mask': dict(head=0.36, headW=1.0, bodyW=1.22, overlap=0.08, eyeY=0.41, eyeGap=0.3, mouthY=0.74)}[style]
items = []
for k in ARCH:
    c = build_char(k, style)
    parts = []
    for i, view in enumerate(['front', 'side', 'back']):
        total = 330 * c['height']
        hh = total * P['head']; hw = hh * P['headW']; bh = total - hh * (1 - P['overlap']); bw = hw * P['bodyW']
        x0 = 70 + i * 150; base = 380
        if c['body']:
            parts.append('<svg x="%f" y="%f" width="%f" height="%f" viewBox="0 0 400 600" preserveAspectRatio="none">%s</svg>' % (x0 - bw / 2, base - bh, bw, bh, inner(c['body'][view])))
        else:
            parts.append('<path d="M%f %f L%f %f Q%f %f %f %f Z" fill="%s" stroke="#0b0b0d" stroke-width="6"/>' % (x0 - bw / 2, base + 20, x0 - bw / 2, base - bh + 30, x0, base - bh - 30, x0 + bw / 2, base - bh + 30, c['colors']['body']))
        hy = base - bh - hh + hh * P['overlap']
        parts.append('<svg x="%f" y="%f" width="%f" height="%f" viewBox="0 0 400 400" preserveAspectRatio="none">%s</svg>' % (x0 - hw / 2, hy, hw, hh, inner(c['head'][view])))
        if view != 'back':
            off = 0 if view == 'front' else hw * 0.12
            for ex in ([0.5 - P['eyeGap'] / 2, 0.5 + P['eyeGap'] / 2] if view == 'front' else [0.59]):
                parts.append('<ellipse cx="%f" cy="%f" rx="%f" ry="%f" fill="#111"/>' % (x0 - hw / 2 + ex * hw + off, hy + P['eyeY'] * hh, hw * (0.11 if style == 'minimal_mask' else 0.03), hh * (0.18 if style == 'minimal_mask' else 0.03)))
    sp = ''
    if c['sprites']:
        for j, n in enumerate(['sit', 'lie', 'kneel']):
            sp += '<svg x="%d" y="20" width="120" height="120" viewBox="0 0 500 500">%s</svg>' % (480 + j * 0, inner(c['sprites'][n]['svg'])) if False else '<svg x="%d" y="%d" width="110" height="110" viewBox="0 0 500 500">%s</svg>' % (500, 10 + j * 125, inner(c['sprites'][n]['svg']))
    items.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" style="background:#d8cfbf">%s%s<text x="10" y="390" font-size="22">%s</text></svg>' % (''.join(parts), sp, k))
imgs = asyncio.run(render(items, 320, 200))
sheet(imgs, 5, 'chars_%s.jpg' % style)
