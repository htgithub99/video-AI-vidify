from seed_texts import SeedText as KST
from core import *
import re
from illustration_texts import IllustrationText as IT
from fixed_compositions import CHARACTERS as FIXED_CHARACTERS
ARCH = {
    KST.GHOST_WOMAN: dict(name=KST.GHOST_WOMAN_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.GHOST, hair=KST.LONG, hairc=KST.VALUE_141214, face=KST.E6EDF0, body=KST.E3E6E8, sleeve=KST.D6DADD, dress=KST.ROBE, height=1.0, desc=KST.FEMALE_GHOST_IN_A_LONG_WHITE_ROBE_LONG_LOOSE_BLACK_HAIR_PALE_FACE),
    KST.WATER_GHOST: dict(name=KST.WATER_GHOST_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.GHOST, hair=KST.WET, hairc=KST.VALUE_1D2A26, face=KST.B9CBC6, body=KST.VALUE_5F7A72, sleeve=KST.VALUE_55706A, dress=KST.ROBE, height=1.0, desc=KST.DROWNED_WATER_GHOST_GREY_GREEN_WET_SKIN_DRIPPING_HAIR_RAGGED_DARK_CLOTHES),
    KST.GHOST_CHILD: dict(name=KST.GHOST_CHILD_LABEL, gender=KST.MALE, age=KST.CHILD, group=KST.GHOST, hair=KST.SHORT, hairc=KST.VALUE_1B1A1C, face=KST.DFE8EC, body=KST.CFD6DA, sleeve=KST.C3CACF, dress=KST.SHIRT, height=0.72, desc=KST.PALE_GHOST_CHILD_IN_A_FADED_WHITE_SHIRT),
    KST.SHADOW_FIGURE: dict(name=KST.SHADOW_FIGURE_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.GHOST, hair=KST.NONE, hairc=KST.VALUE_0C0C0F, face=KST.VALUE_151519, body=KST.VALUE_111114, sleeve=KST.VALUE_111114, dress=KST.ROBE, height=1.1, desc=KST.FACELESS_BLACK_SHADOW_FIGURE_A_DARK_PRESENCE),
    KST.CORPSE: dict(name=KST.CORPSE_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.GHOST, hair=KST.BAND, hairc=KST.VALUE_2A2724, face=KST.B8B6A8, body=KST.D9D4C4, sleeve=KST.CFC9B8, dress=KST.ROBE, height=1.0, band=KST.F2EFE6, desc=KST.WALKING_CORPSE_IN_A_WHITE_BURIAL_SHROUD_WITH_A_WHITE_MOURNING_BAND_GREY_SKIN),
    KST.DEMON: dict(name=KST.DEMON_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.GHOST, hair=KST.HORNS, hairc=KST.VALUE_1A1012, face=KST.VALUE_9E3A34, body=KST.VALUE_3A1D1F, sleeve=KST.VALUE_4A2326, dress=KST.ROBE, height=1.15, desc=KST.FOLK_DEMON_WITH_DARK_RED_SKIN_SMALL_HORNS_AND_A_BLACK_RAGGED_ROBE),
    KST.SHAMAN: dict(name=KST.SHAMAN_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.SPIRITUAL, hair=KST.WRAP, hairc=KST.VALUE_9C2C2A, face=KST.F1DCC3, body=KST.VALUE_24202A, sleeve=KST.VALUE_24202A, dress=KST.ROBE, sash=KST.B8343C, height=1.0, desc=KST.VILLAGE_SHAMAN_IN_A_BLACK_ROBE_WITH_A_RED_HEADWRAP_AND_RED_SASH),
    KST.MONK: dict(name=KST.MONK_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.SPIRITUAL, hair=KST.BALD, hairc=KST.E6CFB3, face=KST.F1DCC3, body=KST.B5652B, sleeve=KST.A65A25, dress=KST.ROBE, height=1.0, desc=KST.BUDDHIST_MONK_WITH_A_SHAVED_HEAD_IN_A_SAFFRON_BROWN_ROBE),
    KST.MEDIUM: dict(name=KST.MEDIUM_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.SPIRITUAL, hair=KST.WRAP, hairc=KST.C9A03A, face=KST.F1DCC3, body=KST.B8343C, sleeve=KST.B8343C, dress=KST.DRESS, sash=KST.D9A93B, height=0.95, desc=KST.SPIRIT_MEDIUM_WOMAN_IN_A_RED_DRESS_WITH_A_GOLDEN_HEADWRAP),
    KST.TEMPLE_KEEPER: dict(name=KST.TEMPLE_KEEPER_LABEL, gender=KST.MALE, age=KST.SENIOR, group=KST.SPIRITUAL, hair=KST.WHITE, hairc=KST.E8E4DC, face=KST.ECD5B9, body=KST.VALUE_6B4A32, sleeve=KST.VALUE_6B4A32, dress=KST.ROBE, beard=True, height=0.92, desc=KST.OLD_TEMPLE_KEEPER_WITH_WHITE_HAIR_AND_BEARD_IN_A_BROWN_ROBE),
    KST.OLD_MAN: dict(name=KST.OLD_MAN_LABEL, gender=KST.MALE, age=KST.SENIOR, group=KST.VILLAGER, hair=KST.WHITE, hairc=KST.E8E4DC, face=KST.ECD5B9, body=KST.VALUE_5B6168, sleeve=KST.VALUE_5B6168, dress=KST.SHIRT, beard=True, height=0.9, desc=KST.OLD_VILLAGE_MAN_WITH_WHITE_HAIR_AND_A_SHORT_BEARD_GREY_CLOTHES),
    KST.OLD_WOMAN: dict(name=KST.OLD_WOMAN_LABEL, gender=KST.FEMALE, age=KST.SENIOR, group=KST.VILLAGER, hair=KST.BUN, hairc=KST.B9B4AC, face=KST.ECD5B9, body=KST.VALUE_3E3A44, sleeve=KST.VALUE_3E3A44, dress=KST.DRESS, height=0.86, desc=KST.OLD_VILLAGE_WOMAN_WITH_A_GREY_BUN_DARK_BLOUSE),
    KST.VILLAGE_CHIEF: dict(name=KST.VILLAGE_CHIEF_LABEL, gender=KST.MALE, age=KST.SENIOR, group=KST.VILLAGER, hair=KST.TURBAN, hairc=KST.VALUE_1A1A1E, face=KST.ECD5B9, body=KST.VALUE_1F2230, sleeve=KST.VALUE_1F2230, dress=KST.ROBE, beard=True, height=0.98, desc=KST.VILLAGE_CHIEF_IN_A_BLACK_TURBAN_AND_DARK_LONG_TUNIC),
    KST.BOY: dict(name=KST.BOY_LABEL, gender=KST.MALE, age=KST.CHILD, group=KST.VILLAGER, hair=KST.SHORT, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.VALUE_3A5E8F, sleeve=KST.VALUE_3A5E8F, dress=KST.SHIRT, height=0.72, desc=KST.VILLAGE_BOY_IN_A_BLUE_SHIRT),
    KST.GIRL: dict(name=KST.GIRL_LABEL, gender=KST.FEMALE, age=KST.CHILD, group=KST.VILLAGER, hair=KST.BOB, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.C45A6A, sleeve=KST.C45A6A, dress=KST.DRESS, height=0.7, desc=KST.VILLAGE_GIRL_WITH_A_BOB_HAIRCUT_IN_A_PINK_BLOUSE),
    KST.VILLAGER_MAN_1: dict(name=KST.VILLAGER_MAN_1_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.VILLAGER_MAN, hair=KST.SHORT, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.VALUE_6E5A43, sleeve=KST.VALUE_6E5A43, dress=KST.SHIRT, height=1.0, desc=KST.VILLAGE_MAN_IN_A_BROWN_WORK_SHIRT),
    KST.VILLAGER_MAN_2: dict(name=KST.VILLAGER_MAN_2_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.VILLAGER_MAN, hair=KST.SPIKY, hairc=KST.VALUE_1B1A1C, face=KST.ECD2B4, body=KST.VALUE_2F3A5A, sleeve=KST.VALUE_2F3A5A, dress=KST.SHIRT, height=1.02, desc=KST.VILLAGE_MAN_IN_A_NAVY_SHIRT),
    KST.VILLAGER_MAN_3: dict(name=KST.VILLAGER_MAN_3_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.VILLAGER_MAN, hair=KST.BAND, hairc=KST.VALUE_1B1A1C, face=KST.E8CDB0, body=KST.VALUE_5D6B55, sleeve=KST.VALUE_5D6B55, dress=KST.SHIRT, band=KST.VALUE_7A5A3A, height=0.98, desc=KST.VILLAGE_MAN_IN_AN_OLIVE_SHIRT_WITH_A_HEADBAND),
    KST.VILLAGER_WOMAN_1: dict(name=KST.VILLAGER_WOMAN_1_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.VILLAGER_WOMAN, hair=KST.BUN, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.VALUE_7A6878, sleeve=KST.VALUE_7A6878, dress=KST.DRESS, height=0.95, desc=KST.VILLAGE_WOMAN_WITH_A_BUN_IN_A_MAUVE_BLOUSE),
    KST.VILLAGER_WOMAN_2: dict(name=KST.VILLAGER_WOMAN_2_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.VILLAGER_WOMAN, hair=KST.LONG, hairc=KST.VALUE_1B1A1C, face=KST.ECD2B4, body=KST.VALUE_3A7A6A, sleeve=KST.VALUE_3A7A6A, dress=KST.DRESS, height=0.94, desc=KST.VILLAGE_WOMAN_WITH_LONG_HAIR_IN_A_TEAL_BLOUSE),
    KST.VILLAGER_WOMAN_3: dict(name=KST.VILLAGER_WOMAN_3_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.VILLAGER_WOMAN, hair=KST.WRAP, hairc=KST.VALUE_2F3A5A, face=KST.F1DCC3, body=KST.VALUE_8E5A43, sleeve=KST.VALUE_8E5A43, dress=KST.DRESS, height=0.93, desc=KST.VILLAGE_WOMAN_WITH_A_DARK_HEADSCARF_IN_A_RUST_BLOUSE),
    KST.TOWN_MAN: dict(name=KST.TOWN_MAN_LABEL, gender=KST.MALE, age=KST.ADULT, group=KST.TOWN, hair=KST.SHORT, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.VALUE_3A5E8F, sleeve=KST.VALUE_3A5E8F, dress=KST.SHIRT, height=1.0, desc=KST.YOUNG_TOWN_MAN_IN_A_BLUE_SHIRT_AND_JEANS_MODERN_DAYS),
    KST.TOWN_WOMAN: dict(name=KST.TOWN_WOMAN_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.TOWN, hair=KST.LONG, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.C46A7A, sleeve=KST.C46A7A, dress=KST.DRESS, height=0.94, desc=KST.YOUNG_TOWN_WOMAN_WITH_LONG_HAIR_IN_A_PINK_BLOUSE_MODERN_DAYS),
    KST.HMONG_WOMAN: dict(name=KST.HMONG_WOMAN_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.VILLAGER_WOMAN, hair=KST.BUN, hairc=KST.VALUE_141214, face=KST.ECD2B4, body=KST.VALUE_26324F, sleeve=KST.VALUE_26324F, dress=KST.DRESS, sash=KST.B8343C, height=0.93, desc=KST.HIGHLAND_ETHNIC_WOMAN_WITH_A_HAIR_BUN_INDIGO_CLOTHES_AND_A_RED_SASH),
    KST.HIGHLAND_ELDER: dict(name=KST.HIGHLAND_ELDER_LABEL, gender=KST.MALE, age=KST.SENIOR, group=KST.VILLAGER, hair=KST.WRAP, hairc=KST.VALUE_2F3A5A, face=KST.E3C7A6, body=KST.VALUE_6B4A32, sleeve=KST.VALUE_6B4A32, dress=KST.SHIRT, beard=True, height=0.92, desc=KST.OLD_HIGHLAND_VILLAGE_MAN_WITH_A_DARK_HEADSCARF_LONG_MOUSTACHE_AND_A_BROWN_SH),
    KST.NURSE: dict(name=KST.NURSE_LABEL, gender=KST.FEMALE, age=KST.ADULT, group=KST.TOWN, hair=KST.BOB, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.EEF1F2, sleeve=KST.EEF1F2, dress=KST.DRESS, height=0.94, desc=KST.NURSE_IN_A_WHITE_UNIFORM),
    KST.SCHOOLBOY: dict(name=KST.SCHOOLBOY_LABEL, gender=KST.MALE, age=KST.CHILD, group=KST.VILLAGER, hair=KST.SHORT, hairc=KST.VALUE_1B1A1C, face=KST.F1DCC3, body=KST.F1F1EE, sleeve=KST.F1F1EE, dress=KST.SHIRT, height=0.74, desc=KST.SCHOOLBOY_IN_A_WHITE_SHIRT),
}
MIN_FACE = KST.E9EEF1
ARCH.update(FIXED_CHARACTERS)
class CT(T):
    @property
    def lw(self):
        return 10 if self.key == KST.MINIMAL_MASK else 7
def ellipse_head(t, a, face):
    return ell(t, 200, 205, 188, 190, face, True)
def hair_front(t, a, view):
    h, c = (a[KST.HAIR], a[KST.HAIRC])
    out = []
    if h in (KST.NONE, KST.BALD):
        return out
    if h == KST.LONG:
        out.append(path(t, KST.M30_215_Q_20_40_200_20_Q_380_40_370_215_L_392_400_L_330_400_L_320_190_Q_300, c, True))
    elif h == KST.CAP:
        out += [path(t, KST.M40_120_L65_35_Q200_5_335_35_L360_120Z, c, True), rect(t, 42, 110, 316, 40, KST.VALUE_263F60, True), ell(t, 200, 150, 174, 18, c, True)]
    elif h == KST.HELMET:
        out += [path(t, KST.M20_150_Q35_10_200_8_Q365_10_380_150Z, c, True), ell(t, 200, 150, 196, 30, c, True), circ(t, 200, 85, 14, KST.D9A93B, True)]
    elif h == KST.WET:
        out.append(path(t, KST.M28_220_Q_30_30_200_22_Q_370_30_372_220_L_360_360_L_330_300_L_320_190_Q_200, c, True))
    elif h == KST.BOB:
        out.append(path(t, KST.M22_260_Q_10_30_200_18_Q_390_30_378_260_L_330_260_L_330_175_Q_200_120_70_175, c, True))
    elif h == KST.BUN:
        out.append(circ(t, 200, 26, 54, c, True))
        out.append(path(t, KST.M22_200_Q_30_40_200_34_Q_370_40_378_200_Q_300_130_200_140_Q_100_130_22_200_Z, c, True))
        out.append(line(t, 140, 30, 270, 10, KST.D9D2C2, 8))
    elif h == KST.SHORT:
        out.append(path(t, KST.M20_210_Q_30_30_200_22_Q_370_30_380_210_Q_330_130_260_150_Q_230_120_200_150, c, True))
    elif h == KST.SPIKY:
        out.append(path(t, KST.M20_210_L_40_90_L_90_110_L_110_30_L_170_80_L_210_10_L_250_80_L_300_30_L_320, c, True))
    elif h in (KST.WRAP, KST.TURBAN):
        out.append(path(t, KST.M16_190_Q_20_20_200_14_Q_380_20_384_190_Q_300_150_200_150_Q_100_150_16_190_Z, c, True))
        for k in range(3):
            out.append(spath(KST.M_S_S_Q_200_S_S_S % (f(30 + k * 6), f(150 - k * 40), f(120 - k * 40), f(370 - k * 6), f(150 - k * 40)), shade(c, 0.3), 5))
    elif h == KST.WHITE:
        out.append(path(t, KST.M24_200_Q_40_60_200_50_Q_360_60_376_200_Q_330_150_300_160_Q_200_110_100_160, c, True))
    elif h == KST.BAND:
        out.append(path(t, KST.M22_200_Q_30_34_200_26_Q_370_34_378_200_Q_200_140_22_200_Z, c, True))
        out.append(path(t, KST.M18_150_Q_200_105_382_150_L_380_182_Q_200_137_20_182_Z, a.get(KST.BAND, KST.VALUE_7A5A3A), True))
    elif h == KST.HORNS:
        out.append(path(t, KST.M22_200_Q_30_40_200_30_Q_370_40_378_200_Q_200_150_22_200_Z, c, True))
        out.append(poly(t, [(90, 80), (60, 0), (140, 60)], KST.E6DDC8))
        out.append(poly(t, [(310, 80), (340, 0), (260, 60)], KST.E6DDC8))
    if view == KST.SIDE and h in (KST.LONG, KST.BOB, KST.BUN, KST.SHORT, KST.WHITE, KST.BAND, KST.WRAP, KST.TURBAN, KST.WET, KST.SPIKY, KST.HORNS):
        out.append(path(t, KST.M20_210_Q_10_60_120_30_L_150_230_Q_80_260_40_330_Z, c, True))
    return out
def ears(t, a):
    if a[KST.HAIR] in (KST.LONG, KST.WET, KST.BOB, KST.WRAP, KST.TURBAN, KST.NONE):
        return []
    return [circ(t, 18, 245, 26, a[KST.FACE], True), circ(t, 382, 245, 26, a[KST.FACE], True)]
def beard(t, a):
    if not a.get(KST.BEARD):
        return []
    return [path(t, KST.M150_350_Q_200_420_250_350_Q_200_372_150_350_Z, a[KST.HAIRC], True, sw=t.lw * 0.6)]
def head_views(t, a, minimal=False):
    face = MIN_FACE if minimal and a[KST.GROUP] not in (KST.GHOST,) else a[KST.FACE]
    if minimal and a[KST.KEY] in (KST.SHADOW_FIGURE,):
        face = a[KST.FACE]
    views = {}
    for view in (KST.FRONT, KST.SIDE, KST.BACK):
        items = []
        if view == KST.BACK:
            plain = minimal and a[KST.HAIR] not in (KST.LONG, KST.WET, KST.NONE)
            items.append(ellipse_head(t, a, face if plain or a[KST.HAIR] in (KST.NONE, KST.BALD) else a[KST.HAIRC]))
            if a[KST.HAIR] == KST.BUN and (not minimal):
                items.append(circ(t, 200, 40, 60, a[KST.HAIRC], True))
            if a[KST.HAIR] in (KST.LONG, KST.WET):
                items.append(path(t, KST.M20_200_L_20_400_L_380_400_L_380_200_Z, a[KST.HAIRC], True))
            if a[KST.HAIR] in (KST.WRAP, KST.TURBAN, KST.BAND):
                items.append(path(t, KST.M30_92_Q_200_44_370_92_L_376_124_Q_200_78_24_124_Z if minimal else KST.M18_150_Q_200_105_382_150_L_380_182_Q_200_137_20_182_Z, a.get(KST.BAND, a[KST.HAIRC]), True))
        elif minimal:
            items.append(ellipse_head(t, a, face))
            if a[KST.HAIR] in (KST.LONG, KST.WET):
                items += hair_front(t, a, view)
            elif a[KST.HAIR] in (KST.WRAP, KST.TURBAN, KST.BAND):
                items.append(path(t, KST.M30_92_Q_200_44_370_92_L_376_124_Q_200_78_24_124_Z, a.get(KST.BAND, a[KST.HAIRC]) if a[KST.HAIR] == KST.BAND else a[KST.HAIRC], True))
            elif a[KST.HAIR] == KST.HORNS:
                items += [poly(t, [(90, 70), (60, 0), (140, 40)], KST.E6DDC8), poly(t, [(310, 70), (340, 0), (260, 40)], KST.E6DDC8)]
        else:
            items += ears(t, a)
            items.append(ellipse_head(t, a, face))
            items += hair_front(t, a, view)
            items += beard(t, a)
            if a[KST.GROUP] != KST.GHOST:
                items.append(ell(t, 110 if view == KST.FRONT else 230, 290, 26, 14, KST.E8A49A, False, extra=op(0.55)))
                if view == KST.FRONT:
                    items.append(ell(t, 290, 290, 26, 14, KST.E8A49A, False, extra=op(0.55)))
        if minimal and a[KST.HAIR] == KST.HELMET:
            items += hair_front(t, a, view)
        views[view] = KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_400_400_S_SVG % KST.EMPTY.join(items)
    return views
def body_shape(a, view):
    w = 1.0 if view != KST.SIDE else 0.72
    cx = 200
    def X(dx):
        return cx + dx * w
    if a[KST.DRESS] == KST.ROBE:
        return KST.M_S_6_L_S_6_Q_S_40_S_70_L_S_590_L_S_590_L_S_70_Q_S_40_S_6_Z % (f(X(-60)), f(X(60)), f(X(110)), f(X(116)), f(X(150)), f(X(-150)), f(X(-116)), f(X(-110)), f(X(-60)))
    if a[KST.DRESS] == KST.DRESS:
        return KST.M_S_6_L_S_6_Q_S_40_S_70_L_S_380_L_S_560_L_S_560_L_S_380_L_S_70_Q_S_40_S_6_Z % (f(X(-56)), f(X(56)), f(X(108)), f(X(114)), f(X(118)), f(X(140)), f(X(-140)), f(X(-118)), f(X(-114)), f(X(-108)), f(X(-56)))
    return KST.M_S_6_L_S_6_Q_S_40_S_70_L_S_400_L_S_400_L_S_70_Q_S_40_S_6_Z % (f(X(-56)), f(X(56)), f(X(108)), f(X(114)), f(X(122)), f(X(-122)), f(X(-114)), f(X(-108)), f(X(-56)))
def body_views(t, a):
    views = {}
    for view in (KST.FRONT, KST.SIDE, KST.BACK):
        w = 1.0 if view != KST.SIDE else 0.72
        items = []
        if a[KST.HAIR] in (KST.LONG, KST.WET) and view == KST.BACK:
            items.append(path(t, KST.M80_0_L_320_0_L_300_260_L_100_260_Z, a[KST.HAIRC], True))
        if a[KST.DRESS] == KST.SHIRT:
            items.append(rect(t, 200 - 100 * w, IT.LEG_TOP, 90 * w, IT.LEG_HEIGHT, KST.VALUE_2B2A33, True))
            items.append(rect(t, 200 + 10 * w, IT.LEG_TOP, 90 * w, IT.LEG_HEIGHT, KST.VALUE_2B2A33, True))
        for fx in (-60, 60) if view != KST.SIDE else (10,):
            items.append(ell(t, 200 + fx * w, 580, 50 * w + 10, 20, KST.VALUE_1F1B1A, True))
        shape = body_shape(a, view)
        if a[KST.DRESS] == KST.SHIRT:
            shape = re.sub(IT.SHIRT_PATH_OLD, IT.SHIRT_PATH_NEW, shape)
        items.append(path(t, shape, a[KST.BODY], True))
        if view == KST.FRONT:
            if a[KST.DRESS] in (KST.SHIRT, KST.DRESS):
                items.append(path(t, KST.M150_8_L_200_70_L_250_8, KST.NONE, True))
                for k in range(4):
                    items.append(circ(t, 200, 110 + k * 60, 8, shade(a[KST.BODY], 0.4), False))
            else:
                items.append(path(t, KST.M150_8_L_200_120_L_250_8, KST.NONE, True))
                items.append(line(t, 200, 120, 200, 590, shade(a[KST.BODY], 0.35), 5))
            if t.detail and a[KST.GROUP] != KST.GHOST:
                items.append(line(t, 200 - 118, 380, 200 + 118, 380, a.get(KST.SASH, shade(a[KST.BODY], 0.3)), 14))
                items.append(line(t, 200 - 118, 380, 200 + 118, 380, KST.D9A93B, 3, extra=KST.STROKE_DASHARRAY_10_8))
            elif a.get(KST.SASH):
                items.append(line(t, 200 - 118, 330, 200 + 118, 330, a[KST.SASH], 16))
        if a[KST.GROUP] == KST.GHOST and a[KST.KEY] != KST.SHADOW_FIGURE:
            items.append(path(t, KST.M_S_590_L_S_560_L_S_592_L_S_556_L_S_590 % (f(200 - 150 * w), f(200 - 90 * w), f(200 - 20 * w), f(200 + 60 * w), f(200 + 150 * w)), KST.NONE, True, sw=t.lw * 0.6))
        if a[KST.HAIR] in (KST.LONG, KST.WET) and view == KST.FRONT:
            items.append(path(t, KST.M60_0_L_100_0_L_92_200_L_64_230_Z, a[KST.HAIRC], True))
            items.append(path(t, KST.M340_0_L_300_0_L_308_200_L_336_230_Z, a[KST.HAIRC], True))
        views[view] = KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_400_600_S_SVG % KST.EMPTY.join(items)
    return views
def inner(svg_):
    return svg_[svg_.index(KST.CLOSE_ANGLE) + 1 : svg_.rindex(KST.SVG_CLOSE_TAG)]
def face_marks(t, x, y, s, closed=False):
    if closed:
        return [spath(KST.M_S_S_Q_S_S_S_0 % (f(x - 40 * s), f(y), f(12 * s), f(10 * s), f(24 * s)), KST.VALUE_1A1616, 5 * s), spath(KST.M_S_S_Q_S_S_S_0 % (f(x + 16 * s), f(y), f(12 * s), f(10 * s), f(24 * s)), KST.VALUE_1A1616, 5 * s)]
    return [ell(t, x - 28 * s, y, 7 * s, 10 * s, KST.VALUE_1A1616, False), ell(t, x + 28 * s, y, 7 * s, 10 * s, KST.VALUE_1A1616, False), line(t, x - 10 * s, y + 46 * s, x + 10 * s, y + 46 * s, KST.VALUE_1A1616, 4 * s)]
def sprites(t, a, head, body):
    out = {}
    hb, bb = (inner(head[KST.FRONT]), inner(body[KST.FRONT]))
    hs, bs = (inner(head[KST.SIDE]), inner(body[KST.SIDE]))
    s = 0.42
    g_head = lambda x, y, sc, inn, rot=0: KST.G_TRANSFORM_TRANSLATE_S_S_ROTATE_S_SCALE_S_S_G % (f(x), f(y), f(rot), f(sc), inn)
    sit = []
    sit.append(path(t, KST.M215_386_L340_386_Q370_386_370_420_L370_470_L330_470_L330_425_L215_425Z, KST.VALUE_2B2A33, True))
    sit.append(ell(t, 350, 478, 50, 15, KST.VALUE_1F1B1A, True))
    sit.append(KST.SVG_X_170_Y_250_WIDTH_160_HEIGHT_144_VIEWBOX_0_0_400_400_OVERFLOW_HIDDEN_S_S % bb)
    sit.append(g_head(162, 96, 0.44, hb))
    sit += face_marks(t, 250, 210, 1.0)
    out[KST.SIT] = {KST.SVG: KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_500_500_S_SVG % KST.EMPTY.join(sit), KST.W: 1.0, KST.H: 0.9, KST.ANCHOR: [0.5, 0.97]}
    lie = [KST.G_TRANSFORM_TRANSLATE_160_330_ROTATE_90_SCALE_0_3_0_5_S_G % bb, g_head(20, 290, 0.38, hb)]
    lie += face_marks(t, 96, 360, 0.85, True)
    out[KST.LIE] = {KST.SVG: KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_500_500_S_SVG % KST.EMPTY.join(lie), KST.W: 1.4, KST.H: 0.7, KST.ANCHOR: [0.5, 0.97]}
    kneel = [path(t, KST.M218_386_L280_386_L325_434_Q350_460_320_470_L205_470_L205_440_L268_440_L218, KST.VALUE_2B2A33, True), ell(t, 206, 478, 44, 15, KST.VALUE_1F1B1A, True), KST.SVG_X_170_Y_250_WIDTH_160_HEIGHT_144_VIEWBOX_0_0_400_400_OVERFLOW_HIDDEN_S_S % bb, g_head(162, 96, 0.44, hb)]
    kneel += face_marks(t, 250, 210, 1.0)
    out[KST.KNEEL] = {KST.SVG: KST.SVG_XMLNS_HTTP_WWW_W3_ORG_2000_SVG_VIEWBOX_0_0_500_500_S_SVG % KST.EMPTY.join(kneel), KST.W: 1.0, KST.H: 0.85, KST.ANCHOR: [0.5, 0.97]}
    for key in (KST.SIT, KST.KNEEL):
        out[key][KST.H] = IT.SPRITE_HEIGHT
        out[key][KST.RIG] = dict(headW=IT.CHIBI_HEAD * IT.CHIBI_HEAD_WIDTH, headH=IT.CHIBI_HEAD, headCy=IT.SPRITE_HEAD_CENTER, bodyH=IT.SPRITE_BODY_HEIGHT, bodyW=IT.SPRITE_BODY_WIDTH)
        root = out[key][KST.SVG]
        old_head = g_head(162, 96, 0.44, hb)
        scale = IT.CHIBI_HEAD / IT.SPRITE_HEIGHT * 500 / 400
        x = 250 - scale * 200
        y = 485 + (IT.SPRITE_HEAD_CENTER - IT.CHIBI_HEAD / 2) / IT.SPRITE_HEIGHT * 500
        new_head = IT.HEAD_GROUP % (f(x), f(y), f(scale), hb)
        out[key][KST.SVG] = root.replace(old_head, new_head)
    return out
def build_char(key, style):
    a = dict(ARCH[key], key=key)
    t = CT(style)
    minimal = style == KST.MINIMAL_MASK
    if not minimal:
        from chibi_design import PROFILES
        from chibi_art import heads, bodies, sprites as illustrated_sprites
        a.update(PROFILES.get(key, {}))
        head = heads(t, a)
    else:
        head = head_views(t, a, minimal)
    colors = {KST.BODY: a[KST.BODY], KST.SLEEVE: a[KST.SLEEVE], KST.SKIN: a[KST.FACE], KST.HAIR: a[KST.HAIRC], KST.FACE: MIN_FACE if minimal and a[KST.GROUP] != KST.GHOST else a[KST.FACE]}
    if minimal:
        return dict(head=head, body={}, sprites={}, colors=colors, height=a[KST.HEIGHT])
    body = bodies(t, a)
    return dict(head=head, body=body, sprites=illustrated_sprites(t, a, body), colors=colors, height=a[KST.HEIGHT])
from reference_expansion import CHAR_CATALOG
ARCH.update(CHAR_CATALOG)
import json
from pathlib import Path
for variant_key, variant in json.loads(Path(__file__).with_name("character_variants.json").read_text(encoding="utf-8")).items():
    ARCH[variant_key] = {**ARCH[variant["base"]], **{key: value for key, value in variant.items() if key != "base"}}
