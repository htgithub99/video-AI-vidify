from core import *

ARCH = {
    'ghost_woman': dict(name='Ma nữ áo trắng', gender='female', age='adult', group='ghost', hair='long', hairc='#141214', face='#e6edf0', body='#e3e6e8', sleeve='#d6dadd', dress='robe', height=1.0, desc='female ghost in a long white robe, long loose black hair, pale face'),
    'water_ghost': dict(name='Ma da', gender='male', age='adult', group='ghost', hair='wet', hairc='#1d2a26', face='#b9cbc6', body='#5f7a72', sleeve='#55706a', dress='robe', height=1.0, desc='drowned water ghost, grey-green wet skin, dripping hair, ragged dark clothes'),
    'ghost_child': dict(name='Hồn ma đứa trẻ', gender='male', age='child', group='ghost', hair='short', hairc='#1b1a1c', face='#dfe8ec', body='#cfd6da', sleeve='#c3cacf', dress='shirt', height=0.72, desc='pale ghost child in a faded white shirt'),
    'shadow_figure': dict(name='Bóng đen', gender='male', age='adult', group='ghost', hair='none', hairc='#0c0c0f', face='#151519', body='#111114', sleeve='#111114', dress='robe', height=1.1, desc='faceless black shadow figure, a dark presence'),
    'corpse': dict(name='Xác nhập tràng', gender='male', age='adult', group='ghost', hair='band', hairc='#2a2724', face='#b8b6a8', body='#d9d4c4', sleeve='#cfc9b8', dress='robe', height=1.0, band='#f2efe6', desc='walking corpse in a white burial shroud with a white mourning band, grey skin'),
    'demon': dict(name='Quỷ dữ', gender='male', age='adult', group='ghost', hair='horns', hairc='#1a1012', face='#9e3a34', body='#3a1d1f', sleeve='#4a2326', dress='robe', height=1.15, desc='folk demon with dark red skin, small horns and a black ragged robe'),
    'shaman': dict(name='Thầy cúng', gender='male', age='adult', group='spiritual', hair='wrap', hairc='#9c2c2a', face='#f1dcc3', body='#24202a', sleeve='#24202a', dress='robe', sash='#b8343c', height=1.0, desc='village shaman in a black robe with a red headwrap and red sash'),
    'monk': dict(name='Sư thầy', gender='male', age='adult', group='spiritual', hair='bald', hairc='#e6cfb3', face='#f1dcc3', body='#b5652b', sleeve='#a65a25', dress='robe', height=1.0, desc='buddhist monk with a shaved head in a saffron brown robe'),
    'medium': dict(name='Bà đồng', gender='female', age='adult', group='spiritual', hair='wrap', hairc='#c9a03a', face='#f1dcc3', body='#b8343c', sleeve='#b8343c', dress='dress', sash='#d9a93b', height=0.95, desc='spirit medium woman in a red dress with a golden headwrap'),
    'temple_keeper': dict(name='Ông từ giữ miếu', gender='male', age='senior', group='spiritual', hair='white', hairc='#e8e4dc', face='#ecd5b9', body='#6b4a32', sleeve='#6b4a32', dress='robe', beard=True, height=0.92, desc='old temple keeper with white hair and beard in a brown robe'),
    'old_man': dict(name='Cụ ông', gender='male', age='senior', group='villager', hair='white', hairc='#e8e4dc', face='#ecd5b9', body='#5b6168', sleeve='#5b6168', dress='shirt', beard=True, height=0.9, desc='old village man with white hair and a short beard, grey clothes'),
    'old_woman': dict(name='Bà lão', gender='female', age='senior', group='villager', hair='bun', hairc='#b9b4ac', face='#ecd5b9', body='#3e3a44', sleeve='#3e3a44', dress='dress', height=0.86, desc='old village woman with a grey bun, dark blouse'),
    'village_chief': dict(name='Trưởng làng', gender='male', age='senior', group='villager', hair='turban', hairc='#1a1a1e', face='#ecd5b9', body='#1f2230', sleeve='#1f2230', dress='robe', beard=True, height=0.98, desc='village chief in a black turban and dark long tunic'),
    'boy': dict(name='Bé trai', gender='male', age='child', group='villager', hair='short', hairc='#1b1a1c', face='#f1dcc3', body='#3a5e8f', sleeve='#3a5e8f', dress='shirt', height=0.72, desc='village boy in a blue shirt'),
    'girl': dict(name='Bé gái', gender='female', age='child', group='villager', hair='bob', hairc='#1b1a1c', face='#f1dcc3', body='#c45a6a', sleeve='#c45a6a', dress='dress', height=0.7, desc='village girl with a bob haircut in a pink blouse'),
    'villager_man_1': dict(name='Dân làng (nam) 1', gender='male', age='adult', group='villager_man', hair='short', hairc='#1b1a1c', face='#f1dcc3', body='#6e5a43', sleeve='#6e5a43', dress='shirt', height=1.0, desc='village man in a brown work shirt'),
    'villager_man_2': dict(name='Dân làng (nam) 2', gender='male', age='adult', group='villager_man', hair='spiky', hairc='#1b1a1c', face='#ecd2b4', body='#2f3a5a', sleeve='#2f3a5a', dress='shirt', height=1.02, desc='village man in a navy shirt'),
    'villager_man_3': dict(name='Dân làng (nam) 3', gender='male', age='adult', group='villager_man', hair='band', hairc='#1b1a1c', face='#e8cdb0', body='#5d6b55', sleeve='#5d6b55', dress='shirt', band='#7a5a3a', height=0.98, desc='village man in an olive shirt with a headband'),
    'villager_woman_1': dict(name='Dân làng (nữ) 1', gender='female', age='adult', group='villager_woman', hair='bun', hairc='#1b1a1c', face='#f1dcc3', body='#7a6878', sleeve='#7a6878', dress='dress', height=0.95, desc='village woman with a bun in a mauve blouse'),
    'villager_woman_2': dict(name='Dân làng (nữ) 2', gender='female', age='adult', group='villager_woman', hair='long', hairc='#1b1a1c', face='#ecd2b4', body='#3a7a6a', sleeve='#3a7a6a', dress='dress', height=0.94, desc='village woman with long hair in a teal blouse'),
    'villager_woman_3': dict(name='Dân làng (nữ) 3', gender='female', age='adult', group='villager_woman', hair='wrap', hairc='#2f3a5a', face='#f1dcc3', body='#8e5a43', sleeve='#8e5a43', dress='dress', height=0.93, desc='village woman with a dark headscarf in a rust blouse'),
    'town_man': dict(name='Thanh niên thị trấn', gender='male', age='adult', group='town', hair='short', hairc='#1b1a1c', face='#f1dcc3', body='#3a5e8f', sleeve='#3a5e8f', dress='shirt', height=1.0, desc='young town man in a blue shirt and jeans (modern days)'),
    'town_woman': dict(name='Cô gái thị trấn', gender='female', age='adult', group='town', hair='long', hairc='#1b1a1c', face='#f1dcc3', body='#c46a7a', sleeve='#c46a7a', dress='dress', height=0.94, desc='young town woman with long hair in a pink blouse (modern days)'),
    'hmong_woman': dict(name='Phụ nữ vùng cao', gender='female', age='adult', group='villager_woman', hair='bun', hairc='#141214', face='#ecd2b4', body='#26324f', sleeve='#26324f', dress='dress', sash='#b8343c', height=0.93, desc='highland ethnic woman with a hair bun, indigo clothes and a red sash'),
    'highland_elder': dict(name='Già bản', gender='male', age='senior', group='villager', hair='wrap', hairc='#2f3a5a', face='#e3c7a6', body='#6b4a32', sleeve='#6b4a32', dress='shirt', beard=True, height=0.92, desc='old highland village man with a dark headscarf, long moustache and a brown shirt'),
    'nurse': dict(name='Y tá', gender='female', age='adult', group='town', hair='bob', hairc='#1b1a1c', face='#f1dcc3', body='#eef1f2', sleeve='#eef1f2', dress='dress', height=0.94, desc='nurse in a white uniform'),
    'schoolboy': dict(name='Cậu học trò', gender='male', age='child', group='villager', hair='short', hairc='#1b1a1c', face='#f1dcc3', body='#f1f1ee', sleeve='#f1f1ee', dress='shirt', height=0.74, desc='schoolboy in a white shirt'),
}

MIN_FACE = '#e9eef1'


class CT(T):
    @property
    def lw(self):
        return 10 if self.key == 'minimal_mask' else 7


def ellipse_head(t, a, face):
    return ell(t, 200, 205, 188, 190, face, True)


def hair_front(t, a, view):
    h, c = a['hair'], a['hairc']
    out = []
    if h in ('none', 'bald'):
        return out
    if h == 'long':
        out.append(path(t, 'M30 215 Q 20 40 200 20 Q 380 40 370 215 L 392 400 L 330 400 L 320 190 Q 300 150 200 160 Q 100 150 80 190 L 70 400 L 8 400 Z', c, True))
    elif h == 'wet':
        out.append(path(t, 'M28 220 Q 30 30 200 22 Q 370 30 372 220 L 360 360 L 330 300 L 320 190 Q 200 140 80 190 L 70 300 L 40 360 Z', c, True))
    elif h == 'bob':
        out.append(path(t, 'M22 260 Q 10 30 200 18 Q 390 30 378 260 L 330 260 L 330 175 Q 200 120 70 175 L 70 260 Z', c, True))
    elif h == 'bun':
        out.append(circ(t, 200, 26, 54, c, True))
        out.append(path(t, 'M22 200 Q 30 40 200 34 Q 370 40 378 200 Q 300 130 200 140 Q 100 130 22 200 Z', c, True))
        out.append(line(t, 140, 30, 270, 10, '#d9d2c2', 8))
    elif h == 'short':
        out.append(path(t, 'M20 210 Q 30 30 200 22 Q 370 30 380 210 Q 330 130 260 150 Q 230 120 200 150 Q 160 118 130 150 Q 70 130 20 210 Z', c, True))
    elif h == 'spiky':
        out.append(path(t, 'M20 210 L 40 90 L 90 110 L 110 30 L 170 80 L 210 10 L 250 80 L 300 30 L 320 110 L 365 90 L 380 210 Q 300 140 200 150 Q 100 140 20 210 Z', c, True))
    elif h in ('wrap', 'turban'):
        out.append(path(t, 'M16 190 Q 20 20 200 14 Q 380 20 384 190 Q 300 150 200 150 Q 100 150 16 190 Z', c, True))
        for k in range(3):
            out.append(spath('M%s %s Q 200 %s %s %s' % (f(30 + k * 6), f(150 - k * 40), f(120 - k * 40), f(370 - k * 6), f(150 - k * 40)), shade(c, 0.3), 5))
    elif h == 'white':
        out.append(path(t, 'M24 200 Q 40 60 200 50 Q 360 60 376 200 Q 330 150 300 160 Q 200 110 100 160 Q 70 150 24 200 Z', c, True))
    elif h == 'band':
        out.append(path(t, 'M22 200 Q 30 34 200 26 Q 370 34 378 200 Q 200 140 22 200 Z', c, True))
        out.append(path(t, 'M18 150 Q 200 105 382 150 L 380 182 Q 200 137 20 182 Z', a.get('band', '#7a5a3a'), True))
    elif h == 'horns':
        out.append(path(t, 'M22 200 Q 30 40 200 30 Q 370 40 378 200 Q 200 150 22 200 Z', c, True))
        out.append(poly(t, [(90, 80), (60, 0), (140, 60)], '#e6ddc8'))
        out.append(poly(t, [(310, 80), (340, 0), (260, 60)], '#e6ddc8'))
    if view == 'side' and h in ('long', 'bob', 'bun', 'short', 'white', 'band', 'wrap', 'turban', 'wet', 'spiky', 'horns'):
        out.append(path(t, 'M20 210 Q 10 60 120 30 L 150 230 Q 80 260 40 330 Z', c, True))
    return out


def ears(t, a):
    if a['hair'] in ('long', 'wet', 'bob', 'wrap', 'turban', 'none'):
        return []
    return [circ(t, 18, 245, 26, a['face'], True), circ(t, 382, 245, 26, a['face'], True)]


def beard(t, a):
    if not a.get('beard'):
        return []
    return [path(t, 'M150 350 Q 200 420 250 350 Q 200 372 150 350 Z', a['hairc'], True, sw=t.lw * 0.6)]


def head_views(t, a, minimal=False):
    face = MIN_FACE if minimal and a['group'] not in ('ghost',) else a['face']
    if minimal and a['key'] in ('shadow_figure',):
        face = a['face']
    views = {}
    for view in ('front', 'side', 'back'):
        items = []
        if view == 'back':
            plain = minimal and a['hair'] not in ('long', 'wet', 'none')
            items.append(ellipse_head(t, a, face if plain or a['hair'] in ('none', 'bald') else a['hairc']))
            if a['hair'] == 'bun' and not minimal:
                items.append(circ(t, 200, 40, 60, a['hairc'], True))
            if a['hair'] in ('long', 'wet'):
                items.append(path(t, 'M20 200 L 20 400 L 380 400 L 380 200 Z', a['hairc'], True))
            if a['hair'] in ('wrap', 'turban', 'band'):
                items.append(path(t, 'M30 92 Q 200 44 370 92 L 376 124 Q 200 78 24 124 Z' if minimal else 'M18 150 Q 200 105 382 150 L 380 182 Q 200 137 20 182 Z', a.get('band', a['hairc']), True))
        else:
            if minimal:
                items.append(ellipse_head(t, a, face))
                if a['hair'] in ('long', 'wet'):
                    items += hair_front(t, a, view)
                elif a['hair'] in ('wrap', 'turban', 'band'):
                    items.append(path(t, 'M30 92 Q 200 44 370 92 L 376 124 Q 200 78 24 124 Z', a.get('band', a['hairc']) if a['hair'] == 'band' else a['hairc'], True))
                elif a['hair'] == 'horns':
                    items += [poly(t, [(90, 70), (60, 0), (140, 40)], '#e6ddc8'), poly(t, [(310, 70), (340, 0), (260, 40)], '#e6ddc8')]
            else:
                items += ears(t, a)
                items.append(ellipse_head(t, a, face))
                items += hair_front(t, a, view)
                items += beard(t, a)
                if a['group'] != 'ghost':
                    items.append(ell(t, 110 if view == 'front' else 230, 290, 26, 14, '#e8a49a', False, extra=op(0.55)))
                    if view == 'front':
                        items.append(ell(t, 290, 290, 26, 14, '#e8a49a', False, extra=op(0.55)))
        views[view] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">%s</svg>' % ''.join(items)
    return views


def body_shape(a, view):
    w = 1.0 if view != 'side' else 0.72
    cx = 200
    def X(dx):
        return cx + dx * w
    if a['dress'] == 'robe':
        return 'M%s 6 L %s 6 Q %s 40 %s 70 L %s 590 L %s 590 L %s 70 Q %s 40 %s 6 Z' % (f(X(-60)), f(X(60)), f(X(110)), f(X(116)), f(X(150)), f(X(-150)), f(X(-116)), f(X(-110)), f(X(-60)))
    if a['dress'] == 'dress':
        return 'M%s 6 L %s 6 Q %s 40 %s 70 L %s 380 L %s 560 L %s 560 L %s 380 L %s 70 Q %s 40 %s 6 Z' % (f(X(-56)), f(X(56)), f(X(108)), f(X(114)), f(X(118)), f(X(140)), f(X(-140)), f(X(-118)), f(X(-114)), f(X(-108)), f(X(-56)))
    return 'M%s 6 L %s 6 Q %s 40 %s 70 L %s 400 L %s 400 L %s 70 Q %s 40 %s 6 Z' % (f(X(-56)), f(X(56)), f(X(108)), f(X(114)), f(X(122)), f(X(-122)), f(X(-114)), f(X(-108)), f(X(-56)))


def body_views(t, a):
    views = {}
    for view in ('front', 'side', 'back'):
        w = 1.0 if view != 'side' else 0.72
        items = []
        if a['hair'] in ('long', 'wet') and view == 'back':
            items.append(path(t, 'M80 0 L 320 0 L 300 260 L 100 260 Z', a['hairc'], True))
        if a['dress'] == 'shirt':
            items.append(rect(t, 200 - 100 * w, 380, 90 * w, 180, '#2b2a33', True))
            items.append(rect(t, 200 + 10 * w, 380, 90 * w, 180, '#2b2a33', True))
        for fx in ((-60, 60) if view != 'side' else (10,)):
            items.append(ell(t, 200 + fx * w, 580, 50 * w + 10, 20, '#1f1b1a', True))
        items.append(path(t, body_shape(a, view), a['body'], True))
        if view == 'front':
            if a['dress'] in ('shirt', 'dress'):
                items.append(path(t, 'M150 8 L 200 70 L 250 8', 'none', True))
                for k in range(4):
                    items.append(circ(t, 200, 110 + k * 60, 8, shade(a['body'], 0.4), False))
            else:
                items.append(path(t, 'M150 8 L 200 120 L 250 8', 'none', True))
                items.append(line(t, 200, 120, 200, 590, shade(a['body'], 0.35), 5))
            if t.detail and a['group'] != 'ghost':
                items.append(line(t, 200 - 118, 380, 200 + 118, 380, a.get('sash', shade(a['body'], 0.3)), 14))
                items.append(line(t, 200 - 118, 380, 200 + 118, 380, '#d9a93b', 3, extra=' stroke-dasharray="10 8"'))
            elif a.get('sash'):
                items.append(line(t, 200 - 118, 330, 200 + 118, 330, a['sash'], 16))
        if a['group'] == 'ghost' and a['key'] != 'shadow_figure':
            items.append(path(t, 'M%s 590 L %s 560 L %s 592 L %s 556 L %s 590' % (f(200 - 150 * w), f(200 - 90 * w), f(200 - 20 * w), f(200 + 60 * w), f(200 + 150 * w)), 'none', True, sw=t.lw * 0.6))
        if a['hair'] in ('long', 'wet') and view == 'front':
            items.append(path(t, 'M60 0 L 100 0 L 92 200 L 64 230 Z', a['hairc'], True))
            items.append(path(t, 'M340 0 L 300 0 L 308 200 L 336 230 Z', a['hairc'], True))
        views[view] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">%s</svg>' % ''.join(items)
    return views


def inner(svg_):
    return svg_[svg_.index('>') + 1:svg_.rindex('</svg>')]


def face_marks(t, x, y, s, closed=False):
    if closed:
        return [spath('M%s %s q %s %s %s 0' % (f(x - 40 * s), f(y), f(12 * s), f(10 * s), f(24 * s)), '#1a1616', 5 * s), spath('M%s %s q %s %s %s 0' % (f(x + 16 * s), f(y), f(12 * s), f(10 * s), f(24 * s)), '#1a1616', 5 * s)]
    return [ell(t, x - 28 * s, y, 7 * s, 10 * s, '#1a1616', False), ell(t, x + 28 * s, y, 7 * s, 10 * s, '#1a1616', False), line(t, x - 10 * s, y + 46 * s, x + 10 * s, y + 46 * s, '#1a1616', 4 * s)]


def sprites(t, a, head, body):
    out = {}
    hb, bb = inner(head['front']), inner(body['front'])
    hs, bs = inner(head['side']), inner(body['side'])
    s = 0.42
    g_head = lambda x, y, sc, inn, rot=0: '<g transform="translate(%s %s) rotate(%s) scale(%s)">%s</g>' % (f(x), f(y), f(rot), f(sc), inn)
    sit = []
    sit.append('<g transform="translate(170 250) scale(0.4 0.36)">%s</g>' % bb)
    sit.append('<g transform="translate(150 470) scale(0.5 0.2)">%s</g>' % '<rect x="0" y="0" width="400" height="60" fill="#2b2a33" stroke="%s" stroke-width="10"/>' % t.line)
    sit.append(g_head(162, 96, 0.44, hb))
    sit += face_marks(t, 250, 210, 1.0)
    out['sit'] = {'svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">%s</svg>' % ''.join(sit), 'w': 1.0, 'h': 0.9, 'anchor': [0.5, 0.97]}
    lie = ['<g transform="translate(160 330) rotate(-90) scale(0.3 0.5)">%s</g>' % bb, g_head(20, 290, 0.38, hb)]
    lie += face_marks(t, 96, 360, 0.85, True)
    out['lie'] = {'svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">%s</svg>' % ''.join(lie), 'w': 1.4, 'h': 0.7, 'anchor': [0.5, 0.97]}
    kneel = ['<g transform="translate(170 250) scale(0.4 0.38)">%s</g>' % bb, ell(t, 250, 478, 110, 22, '#2b2a33', True), g_head(162, 96, 0.44, hb)]
    kneel += face_marks(t, 250, 210, 1.0)
    out['kneel'] = {'svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">%s</svg>' % ''.join(kneel), 'w': 1.0, 'h': 0.85, 'anchor': [0.5, 0.97]}
    return out


def build_char(key, style):
    a = dict(ARCH[key], key=key)
    t = CT(style)
    minimal = style == 'minimal_mask'
    head = head_views(t, a, minimal)
    colors = {'body': a['body'], 'sleeve': a['sleeve'], 'skin': a['face'], 'hair': a['hairc'], 'face': MIN_FACE if minimal and a['group'] != 'ghost' else a['face']}
    if minimal:
        return dict(head=head, body={}, sprites={}, colors=colors, height=a['height'])
    body = body_views(t, a)
    return dict(head=head, body=body, sprites=sprites(t, a, head, body), colors=colors, height=a['height'])
