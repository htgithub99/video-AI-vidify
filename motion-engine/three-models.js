(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    MF = root.MotionEngineTemplate;
  const ME = root.MotionEngine;
  const K = ME.T3;
  if (!K || !K.ok) return;
  const T = K.T;
  const U = ME.util,
    C = ME.color;
  const PI = Math.PI;
  const PX = K.PX;
  const { mesh, box, cyl, sph, cap, ico, cone, mat, group, profile } = K;
  const M = (K.models = {});
  const shade = (c, k) => C.shade(c, k);
  const HAIR_COL = MT.VALUE_2A1E18;
  K.EXT = K.EXT || { hats: {}, outfits: {}, acc: {}, fx: {}, longSkirt: new Set(), hideHair: new Set() };
  K.character = (chIn) => {
    const ch = typeof chIn === MT.STRING ? ME.registry.characters[chIn] || (ME.customCharacters && ME.customCharacters[chIn]) || ME.registry.characters.man_casual : chIn || ME.registry.characters.man_casual;
    const d = ME.charDims(ch);
    const pal = ME.charPalette(ch, {});
    const s = d.s;
    const fem = ch.gender === MT.FEMALE;
    const b = { slim: 0.86, normal: 1, heavy: 1.3, athletic: 1.08 }[ch.build] || 1;
    const outfit = ch.outfit || MT.CASUAL;
    const acc = ch.accessories || [];
    const longSkirt = outfit === MT.GOWN || outfit === MT.ROBE || K.EXT.longSkirt.has(outfit);
    const L = (px) => px * PX * s;
    const top = pal.top,
      bottom = outfit === MT.DRESS ? pal.skin : pal.bottom,
      skin = pal.skin;
    const root = new T.Group();
    const body = new T.Group();
    root.add(body);
    const torsoG = new T.Group();
    body.add(torsoG);
    const torsoLen = L(d.torso);
    const chestW = (fem ? 0.33 : 0.38) * b * s,
      chestD = (fem ? 0.2 : 0.22) * Math.sqrt(b) * s;
    const chest = mesh(cap(0.5, 0.9, 10), top, 0, torsoLen * 0.62, 0, { sx: chestD, sy: torsoLen * 0.38, sz: chestW });
    const belly = mesh(cap(0.5, 0.6, 10), outfit === MT.OVERALLS ? pal.bottom : top, 0, torsoLen * 0.2, 0, { sx: chestD * (d.belly ? 1.25 : 0.95), sy: torsoLen * 0.3, sz: chestW * (fem ? 0.82 : 0.9) });
    torsoG.add(chest, belly);
    if (outfit === MT.UNIFORM || outfit === MT.MILITARY) torsoG.add(mesh(cyl(0.5, 0.5, 1, 14), pal.accent || MT.VALUE_222, 0, torsoLen * 0.06, 0, { sx: chestD * 1.02, sy: 0.045 * s, sz: chestW * 0.93 }));
    if (outfit === MT.SUIT || acc.includes(MT.TIE)) torsoG.add(mesh(box(0.012, torsoLen * 0.5, 0.05 * s), pal.accent, chestD * 0.5, torsoLen * 0.6, 0));
    if (acc.includes(MT.VEST)) torsoG.add(mesh(cap(0.5, 0.7, 10), shade(top, -0.25), 0.005, torsoLen * 0.5, 0, { sx: chestD * 1.05, sy: torsoLen * 0.42, sz: chestW * 0.96 }));
    if (acc.includes(MT.SCARF)) torsoG.add(mesh(new T.TorusGeometry(0.075 * s, 0.03 * s, 8, 16), pal.accent, 0, torsoLen * 0.98, 0, { rx: PI / 2 }));
    if (acc.includes(MT.CAMERA)) torsoG.add(mesh(box(0.07 * s, 0.06 * s, 0.11 * s), MT.VALUE_1B1D22, chestD * 0.62, torsoLen * 0.55, 0.04 * s));
    if (acc.includes(MT.BACKPACK)) torsoG.add(mesh(box(0.14 * s, 0.34 * s, 0.28 * s), shade(top, -0.3), -chestD * 0.7, torsoLen * 0.55, 0));
    if (acc.includes(MT.TANK)) {
      torsoG.add(mesh(cyl(0.065 * s, 0.065 * s, 0.5 * s, 12), MT.C9CDD2, -chestD * 0.75, torsoLen * 0.55, 0.07 * s));
      torsoG.add(mesh(cyl(0.065 * s, 0.065 * s, 0.5 * s, 12), MT.C9CDD2, -chestD * 0.75, torsoLen * 0.55, -0.07 * s));
    }
    if (outfit === MT.COAT || outfit === MT.TRENCH || outfit === MT.ROBE) {
      const len = outfit === MT.ROBE ? L(d.thigh + d.shin) * 0.95 : L(d.thigh) * 1.05;
      const skirt = mesh(cyl(chestW * 0.5, chestW * (outfit === MT.ROBE ? 0.7 : 0.62), len, 16, true), outfit === MT.ROBE ? top : shade(top, -0.04), 0, -len / 2 + 0.02, 0, { sx: (chestD / chestW) * 1.15 });
      body.add(skirt);
    }
    if (outfit === MT.DRESS) {
      const len = L(d.thigh) * 1.1;
      body.add(mesh(cyl(chestW * 0.42, chestW * 0.78, len, 18), top, 0, -len / 2 + 0.04, 0, { sx: 0.75 }));
    }
    if (outfit === MT.GOWN) {
      const len = L(d.thigh + d.shin) * 1.02;
      body.add(mesh(cyl(chestW * 0.42, chestW * 1.15, len, 22), top, 0, -len / 2 + 0.04, 0, { sx: 0.85 }));
      torsoG.add(mesh(cyl(0.5, 0.5, 1, 14), pal.accent || MT.E2B33A, 0, torsoLen * 0.08, 0, { sx: chestD * 1.02, sy: 0.03 * s, sz: chestW * 0.9 }));
    }
    if (outfit === MT.AO_DAI_2) {
      const len = L(d.thigh + d.shin * 0.55);
      body.add(mesh(box(0.012 * s, len, chestW * 0.62), top, chestD * 0.42, -len / 2 + 0.03, 0));
      body.add(mesh(box(0.012 * s, len, chestW * 0.62), shade(top, -0.08), -chestD * 0.42, -len / 2 + 0.03, 0));
    }
    if (outfit === MT.TUNIC || outfit === MT.ARMOR) {
      const len = L(d.thigh) * 0.55;
      body.add(mesh(cyl(chestW * 0.5, chestW * 0.62, len, 14, true), outfit === MT.ARMOR ? shade(top, -0.12) : top, 0, -len / 2 + 0.02, 0, { sx: (chestD / chestW) * 1.2 }));
      torsoG.add(mesh(cyl(0.5, 0.5, 1, 14), outfit === MT.ARMOR ? shade(top, -0.35) : pal.accent || MT.VALUE_5A3A22, 0, torsoLen * 0.06, 0, { sx: chestD * 1.04, sy: 0.05 * s, sz: chestW * 0.95 }));
    }
    if (outfit === MT.ARMOR) {
      const metal = { m: 0.75, r: 0.35 };
      torsoG.add(mesh(cap(0.5, 0.9, 12), K.mat(top, metal), 0.01, torsoLen * 0.62, 0, { sx: chestD * 1.08, sy: torsoLen * 0.4, sz: chestW * 1.04 }));
      for (const z of [chestW * 0.55, -chestW * 0.55]) torsoG.add(mesh(sph(0.085 * s, 12), K.mat(shade(top, 0.1), metal), 0, torsoLen * 0.92, z, { sy: 0.8 }));
    }
    if (outfit === MT.SPACESUIT) {
      torsoG.add(mesh(box(0.05 * s, 0.12 * s, 0.16 * s), MT.VALUE_5A6A7A, chestD * 0.52, torsoLen * 0.62, 0));
      torsoG.add(mesh(box(0.2 * s, 0.4 * s, 0.32 * s), MT.D8DDE2, -chestD * 0.75, torsoLen * 0.58, 0));
    }
    if (outfit === MT.SPORT) torsoG.add(mesh(box(0.01, torsoLen * 0.7, 0.02 * s), pal.accent || MT.FFF, chestD * 0.49, torsoLen * 0.5, chestW * 0.3));
    if (outfit === MT.APRON) torsoG.add(mesh(box(0.012, torsoLen * 0.75 + L(d.thigh) * 0.4, chestW * 0.7), (ch.colors && ch.colors.apron) || MT.F2EFE6, chestD * 0.5, torsoLen * 0.25, 0));
    if (acc.includes(MT.NECKLACE)) torsoG.add(mesh(new T.TorusGeometry(0.07 * s, 0.008 * s, 6, 18), K.mat(MT.E2B33A, { m: 0.8, r: 0.3 }), 0.01, torsoLen * 0.93, 0, { rx: PI / 2 }));
    if (acc.includes(MT.MEDAL)) torsoG.add(mesh(cyl(0.025 * s, 0.025 * s, 0.01 * s, 14), K.mat(MT.E2B33A, { m: 0.8, r: 0.3 }), chestD * 0.52, torsoLen * 0.7, chestW * 0.22, { rz: PI / 2 }));
    if (acc.includes(MT.SWORD)) {
      const sw = K.group(mesh(box(0.035 * s, 0.75 * s, 0.05 * s), MT.VALUE_3A2A1E, 0, -0.38 * s, 0), mesh(box(0.04 * s, 0.03 * s, 0.16 * s), MT.C9A23A, 0, 0.0, 0), mesh(cyl(0.015 * s, 0.015 * s, 0.14 * s, 8), MT.VALUE_4A3020, 0, 0.08 * s, 0));
      sw.position.set(-0.02 * s, 0.02, -chestW * 0.5);
      sw.rotation.z = 0.6;
      body.add(sw);
    }
    if (acc.includes(MT.CAPE)) {
      const capeCol = (ch.colors && ch.colors.cape) || pal.accent || MT.VALUE_8A1A1A;
      const len = torsoLen * 0.9 + L(d.thigh) * 1.2;
      const cape = mesh(box(0.02 * s, len, chestW * 1.05), K.mat(capeCol, { side: 2 }), -chestD * 0.62, torsoLen * 0.92 - len / 2, 0, { rz: -0.08 });
      torsoG.add(cape);
    }
    const headR = L(d.head) * 0.95;
    const headG = new T.Group();
    headG.position.y = torsoLen + L(d.neck);
    torsoG.add(headG);
    torsoG.add(mesh(cyl(0.045 * s, 0.05 * s, L(d.neck) * 1.6, 10), skin, 0, torsoLen + L(d.neck) * 0.4, 0));
    headG.add(mesh(sph(1, 18), skin, 0.01 * s, headR * 0.85, 0, { sx: headR * 1.02, sy: headR * 1.1, sz: headR * 0.95 }));
    const hairCol = pal.hair || HAIR_COL;
    const hair = ch.hair || MT.SHORT;
    if (hair !== MT.BALD && !K.EXT.hideHair.has(ch.headwear)) headG.add(mesh(sph(1, 16), hairCol, -headR * 0.12, headR * 1.1, 0, { sx: headR * 1.0, sy: headR * 0.85, sz: headR * 1.0 }));
    if (hair === MT.LONG) headG.add(mesh(box(headR * 0.7, headR * 2.4, headR * 1.8), hairCol, -headR * 0.75, headR * 0.1, 0));
    if (hair === MT.PONYTAIL) headG.add(mesh(cap(headR * 0.28, headR * 1.2, 8), hairCol, -headR * 1.15, headR * 0.6, 0, { rz: -0.5 }));
    if (hair === MT.BUN || hair === MT.CROWN_BUN) headG.add(mesh(sph(headR * 0.45, 12), hairCol, -headR * 0.85, headR * 1.45, 0));
    if (hair === MT.CURLY) for (let i = 0; i < 6; i++) headG.add(mesh(sph(headR * 0.38, 8), hairCol, -headR * 0.3 + Math.cos(i) * headR * 0.5, headR * 1.55, Math.sin(i * 1.7) * headR * 0.6));
    if (acc.includes(MT.BEARD) || ch.facial === MT.BEARD) headG.add(mesh(sph(1, 12), hairCol, headR * 0.45, headR * 0.35, 0, { sx: headR * 0.6, sy: headR * 0.55, sz: headR * 0.8 }));
    if (acc.includes(MT.MUSTACHE) || ch.facial === MT.MUSTACHE) headG.add(mesh(box(headR * 0.15, headR * 0.12, headR * 0.7), hairCol, headR * 0.98, headR * 0.6, 0));
    if (acc.includes(MT.GLASSES)) headG.add(mesh(box(headR * 0.08, headR * 0.22, headR * 1.3), MT.VALUE_141414, headR * 1.0, headR * 0.98, 0));
    if (acc.includes(MT.EYEPATCH)) headG.add(mesh(cyl(headR * 0.24, headR * 0.24, headR * 0.06, 12), MT.VALUE_111, headR * 0.95, headR * 0.98, headR * 0.3, { rz: PI / 2 }));
    if (acc.includes(MT.FACE_MASK)) headG.add(mesh(sph(1, 12), (ch.colors && ch.colors.mask) || MT.CFE3EE, headR * 0.42, headR * 0.5, 0, { sx: headR * 0.65, sy: headR * 0.42, sz: headR * 0.88 }));
    const hw = ch.headwear || MT.NONE;
    const hat = pal.hat;
    const hatY = headR * 1.55;
    const hcol = (def) => (ch.colors && ch.colors.hat ? hat : def);
    const metalM = (c) => K.mat(c, { m: 0.75, r: 0.35 });
    if (hw === MT.CROWN || hw === MT.TIARA) {
      const c = hcol(hw === MT.CROWN ? MT.E2B33A : MT.E8E4F2);
      const ring = mesh(cyl(headR * 0.98, headR * 0.95, headR * (hw === MT.CROWN ? 0.45 : 0.15), 18, true), metalM(c), 0, headR * 1.6, 0);
      ring.material = K.mat(c, { m: 0.75, r: 0.35, side: 2 });
      headG.add(ring);
      const n = hw === MT.CROWN ? 7 : 3;
      for (let i = 0; i < n; i++) {
        const a = hw === MT.CROWN ? (i / n) * PI * 2 : -0.4 + i * 0.4;
        headG.add(mesh(cone(headR * 0.14, headR * (hw === MT.CROWN ? 0.45 : 0.35), 6), metalM(c), Math.cos(a) * headR * 0.95, headR * (hw === MT.CROWN ? 2.02 : 1.82), Math.sin(a) * headR * 0.95));
      }
      if (hw === MT.CROWN) headG.add(mesh(sph(headR * 0.12, 8), MT.C42A3A, headR * 0.98, headR * 1.6, 0, { cast: false }));
    } else if (hw === MT.KNIGHT_HELMET) {
      headG.add(mesh(sph(headR * 1.25, 18), metalM(hcol(MT.A3ABB3)), 0, headR * 0.95, 0, { sy: 1.05 }));
      headG.add(mesh(box(headR * 0.1, headR * 0.14, headR * 1.1), MT.VALUE_111, headR * 1.2, headR * 1.05, 0));
      headG.add(mesh(cap(headR * 0.18, headR * 1.2, 8), (ch.colors && ch.colors.accent) || MT.B02A2A, -headR * 0.6, headR * 2.1, 0, { rz: 1.1 }));
    } else if (hw === MT.COWBOY_HAT || hw === MT.STRAW_HAT) {
      const c = hcol(hw === MT.COWBOY_HAT ? MT.VALUE_8A5A32 : MT.D9B86A);
      headG.add(mesh(cyl(headR * 2.0, headR * 2.0, headR * 0.07, 24), c, 0, headR * 1.4, 0));
      headG.add(mesh(cyl(headR * 0.85, headR * 1.0, headR * (hw === MT.COWBOY_HAT ? 0.95 : 0.6), 18), c, 0, headR * (hw === MT.COWBOY_HAT ? 1.85 : 1.7), 0));
      headG.add(mesh(cyl(headR * 1.01, headR * 1.01, headR * 0.15, 18), hw === MT.COWBOY_HAT ? shade(c, -0.35) : (ch.colors && ch.colors.accent) || MT.B02A2A, 0, headR * 1.5, 0));
    } else if (hw === MT.WIZARD_HAT || hw === MT.SANTA_HAT) {
      const c = hw === MT.SANTA_HAT ? MT.C42A2A : hcol(MT.VALUE_3A2A6A);
      if (hw === MT.WIZARD_HAT) headG.add(mesh(cyl(headR * 1.9, headR * 1.9, headR * 0.06, 24), c, 0, headR * 1.45, 0));
      headG.add(mesh(cone(headR * 1.0, headR * (hw === MT.WIZARD_HAT ? 2.6 : 1.8), 16), c, -headR * 0.2, headR * (hw === MT.WIZARD_HAT ? 2.75 : 2.3), 0, { rz: 0.35 }));
      if (hw === MT.SANTA_HAT) {
        headG.add(mesh(new T.TorusGeometry(headR * 1.0, headR * 0.2, 8, 20), MT.F4F2EE, 0, headR * 1.45, 0, { rx: PI / 2 }));
        headG.add(mesh(sph(headR * 0.26, 10), MT.F4F2EE, -headR * 0.85, headR * 3.0, 0));
      }
    } else if (hw === MT.TRICORN) {
      const c = hcol(MT.VALUE_1A1A1E);
      headG.add(mesh(cyl(headR * 1.6, headR * 1.6, headR * 0.45, 3), c, 0, headR * 1.6, 0, { ry: PI / 6 }));
      headG.add(mesh(cyl(headR * 0.95, headR * 1.0, headR * 0.6, 16), c, 0, headR * 1.7, 0));
    } else if (hw === MT.TURBAN || hw === MT.KHAN_DONG) {
      const c = hcol(hw === MT.TURBAN ? MT.E8DCC0 : MT.VALUE_1C1A22);
      headG.add(mesh(new T.TorusGeometry(headR * 0.95, headR * 0.32, 10, 22), c, 0, headR * 1.45, 0, { rx: PI / 2 }));
      headG.add(mesh(sph(headR * 1.02, 16), c, 0, headR * 1.45, 0, { sy: hw === MT.TURBAN ? 0.75 : 0.45 }));
    } else if (hw === MT.HIJAB) {
      const c = hcol(MT.VALUE_4A5A7A);
      headG.add(mesh(sph(headR * 1.18, 18), c, -headR * 0.18, headR * 0.95, 0, { sx: 1.0, sy: 1.15 }));
      headG.add(mesh(cyl(headR * 0.9, headR * 1.4, headR * 1.2, 18), c, -headR * 0.15, -headR * 0.15, 0));
    } else if (hw === MT.HEADBAND) headG.add(mesh(cyl(headR * 1.04, headR * 1.04, headR * 0.25, 18, true), K.mat((ch.colors && (ch.colors.hat || ch.colors.accent)) || MT.C42A2A, { side: 2 }), 0, headR * 1.3, 0));
    else if (hw === MT.TOP_HAT) {
      const c = hcol(MT.VALUE_16161A);
      headG.add(mesh(cyl(headR * 1.45, headR * 1.45, headR * 0.06, 22), c, 0, headR * 1.4, 0));
      headG.add(mesh(cyl(headR * 0.85, headR * 0.85, headR * 1.6, 18), c, 0, headR * 2.2, 0));
    } else if (hw === MT.GRAD_CAP) {
      const c = hcol(MT.VALUE_16161A);
      headG.add(mesh(sph(headR * 1.04, 16), c, 0, headR * 1.15, 0, { sy: 0.6 }));
      headG.add(mesh(box(headR * 2.4, headR * 0.08, headR * 2.4), c, 0, headR * 1.65, 0, { ry: PI / 4 }));
    } else if (hw === MT.BUBBLE_HELMET) {
      headG.add(mesh(sph(headR * 1.6, 22), K.mat(MT.CFE8FF, { r: 0.05, m: 0.1, t: 0.25 }), 0, headR * 0.9, 0, { cast: false }));
      headG.add(mesh(cyl(headR * 1.3, headR * 1.3, headR * 0.3, 18), MT.D8DDE2, 0, -headR * 0.55, 0));
    }
    if (hw === MT.CAP || hw === MT.POLICE_CAP) {
      headG.add(mesh(sph(headR * 1.06, 16), hat, -headR * 0.05, headR * 1.15, 0, { sy: 0.62 }));
      headG.add(mesh(box(headR * 1.1, headR * 0.1, headR * 1.5), hat, headR * 0.75, headR * 1.15, 0));
      if (hw === MT.POLICE_CAP) headG.add(mesh(cyl(headR * 1.12, headR * 1.05, headR * 0.6, 18), hat, 0, hatY, 0));
    } else if (hw === MT.FEDORA) {
      headG.add(mesh(cyl(headR * 1.8, headR * 1.8, headR * 0.08, 24), hat, 0, headR * 1.38, 0));
      headG.add(mesh(cyl(headR * 0.95, headR * 1.05, headR * 0.75, 18), hat, 0, headR * 1.75, 0));
    } else if (hw === MT.BERET) headG.add(mesh(sph(headR * 1.2, 14), hat, -headR * 0.1, headR * 1.55, 0, { sy: 0.4 }));
    else if (hw === MT.HELMET || hw === MT.HARDHAT) {
      headG.add(mesh(sph(headR * 1.18, 18), hat, 0, headR * 1.1, 0, { sy: 0.85 }));
      if (hw === MT.HARDHAT) headG.add(mesh(cyl(headR * 1.45, headR * 1.45, headR * 0.08, 20), hat, 0, headR * 1.1, 0));
    } else if (hw === MT.BEANIE) headG.add(mesh(sph(headR * 1.1, 16), hat, -headR * 0.05, headR * 1.2, 0, { sy: 0.8 }));
    else if (hw === MT.HEADLAMP) {
      headG.add(mesh(cyl(headR * 1.03, headR * 1.03, headR * 0.2, 18), MT.VALUE_222, 0, headR * 1.2, 0));
      headG.add(mesh(box(headR * 0.25, headR * 0.3, headR * 0.35), MT.E9E2C8, headR * 1.05, headR * 1.2, 0, { cast: false }));
    } else if (hw === MT.HOOD) headG.add(mesh(sph(headR * 1.3, 16), hat, -headR * 0.2, headR * 0.95, 0));
    else if (hw === MT.CONICAL) headG.add(mesh(cone(headR * 2.4, headR * 1.4, 24), ch.colors && ch.colors.hat ? hat : MT.D9C48F, 0, headR * 2.0, 0));
    else if (hw === MT.CHEF_HAT) headG.add(mesh(cyl(headR * 0.9, headR * 0.8, headR * 1.2, 16), MT.F4F4F2, 0, headR * 2.2, 0));
    else if (K.EXT.hats[hw]) K.EXT.hats[hw](headG, { headR, hat, hcol, metalM, ch, pal, s });
    const X3 = { body, torsoG, torsoLen, chestW, chestD, top, pal, L, d, s, ch, headG, headR };
    if (K.EXT.outfits[outfit]) K.EXT.outfits[outfit](X3);
    for (const ax of acc) if (K.EXT.acc[ax]) K.EXT.acc[ax](X3);
    const limb = (len, r, col) => mesh(cap(r, Math.max(0.01, len - r * 2), 8), col, 0, -len / 2, 0);
    const arms = [0, 1].map((i) => {
      const side = i === 0 ? 1 : -1;
      const sh = new T.Group();
      sh.position.set(0, torsoLen * 0.9, side * chestW * 0.55);
      torsoG.add(sh);
      const up = L(d.upper),
        fo = L(d.fore);
      const sleeve = i === 0 ? top : shade(top, -0.18);
      sh.add(limb(up, 0.048 * Math.sqrt(b) * s, sleeve));
      const el = new T.Group();
      el.position.y = -up;
      sh.add(el);
      el.add(limb(fo, 0.04 * Math.sqrt(b) * s, sleeve));
      const hand = new T.Group();
      hand.position.y = -fo;
      el.add(hand);
      hand.add(mesh(sph(0.045 * s, 10), skin));
      return { sh, el, hand };
    });
    const legs = [0, 1].map((i) => {
      const side = i === 0 ? 1 : -1;
      const hip = new T.Group();
      hip.position.set(0, 0, side * chestW * 0.24);
      body.add(hip);
      const th = L(d.thigh),
        sn = L(d.shin);
      const col = i === 0 ? bottom : shade(bottom, -0.18);
      hip.add(limb(th, 0.07 * b * s, col));
      const kn = new T.Group();
      kn.position.y = -th;
      hip.add(kn);
      kn.add(limb(sn, 0.055 * Math.sqrt(b) * s, col));
      const foot = new T.Group();
      foot.position.y = -sn;
      kn.add(foot);
      foot.add(mesh(box(0.25 * s, 0.07 * s, 0.1 * s), pal.shoes, 0.06 * s, -0.02 * s, 0));
      return { hip, kn, foot };
    });
    const held = new T.Group();
    arms[0].hand.add(held);
    let heldKind = null;
    const setHeld = (kind) => {
      if (kind === heldKind) return;
      heldKind = kind;
      while (held.children.length) held.remove(held.children[0]);
      if (!kind) return;
      if (kind === MT.BRIEFCASE) held.add(mesh(box(0.38 * s, 0.28 * s, 0.09 * s), MT.VALUE_3A2A1E, 0, -0.18 * s, 0));
      else if (kind === MT.FLASHLIGHT) held.add(mesh(cyl(0.025 * s, 0.03 * s, 0.22 * s, 10), MT.VALUE_222, 0.09 * s, -0.02, 0, { rz: -PI / 2 }));
      else if (kind === MT.PICKAXE) {
        held.add(mesh(cyl(0.018 * s, 0.018 * s, 0.85 * s, 8), MT.VALUE_6A4A2A, 0, 0.1 * s, 0));
        held.add(mesh(box(0.5 * s, 0.05 * s, 0.05 * s), MT.VALUE_777, 0.05 * s, 0.5 * s, 0, { rz: 0.15 }));
      } else if (kind === MT.TORCH || kind === MT.DRILL) held.add(mesh(box(0.3 * s, 0.07 * s, 0.07 * s), kind === MT.DRILL ? MT.E2A22A : MT.VALUE_555, 0.15 * s, 0, 0));
      else if (kind === MT.BAG_SHOULDER || kind === MT.BAG_DRAG) held.add(mesh(cap(0.16 * s, 0.35 * s, 10), MT.VALUE_3B4A3A, 0, -0.2 * s, 0, { rz: PI / 2 }));
      else if (kind === MT.BOX) held.add(mesh(box(0.4 * s, 0.3 * s, 0.4 * s), MT.A07A4A, 0.12 * s, 0, 0));
      else if (kind === MT.PHONE) held.add(mesh(box(0.02 * s, 0.14 * s, 0.07 * s), MT.VALUE_111, 0, 0, 0));
      else if (kind === MT.BOTTLE) held.add(mesh(cyl(0.03 * s, 0.035 * s, 0.25 * s, 10), MT.VALUE_2A4A2A, 0, 0.08 * s, 0));
      else if (kind === MT.MARKER) held.add(mesh(cyl(0.012 * s, 0.012 * s, 0.14 * s, 8), MT.C42A2A, 0.05 * s, 0, 0, { rz: -PI / 2 }));
      else if (ME.registry.assets[kind]) {
        try {
          const obj = K.asset(kind, {});
          if (obj) {
            const box = new T.Box3().setFromObject(obj);
            const sz = box.getSize(new T.Vector3());
            const target = (((ME.REAL_SIZE && ME.REAL_SIZE[kind]) || 24) / 100) * s;
            const k = target / Math.max(0.001, sz.x, sz.y, sz.z);
            obj.scale.multiplyScalar(k);
            obj.position.set(0.02 * s, -sz.y * k * 0.45, 0.04 * s);
            held.add(obj);
          }
        } catch (e) {
          void e;
        }
      }
    };
    if (acc.includes(MT.BRIEFCASE)) setHeld(MT.BRIEFCASE);
    if (acc.includes(MT.STAFF)) {
      const st = K.group(mesh(cyl(0.02 * s, 0.025 * s, 1.7 * s, 8), MT.VALUE_6A4A2A, 0, 0.2 * s, 0), mesh(sph(0.06 * s, 12), K.mat((ch.colors && ch.colors.accent) || MT.VALUE_8AD0FF, { e: (ch.colors && ch.colors.accent) || MT.VALUE_8AD0FF, ei: 1.5 }), 0, 1.07 * s, 0, { cast: false }));
      arms[1].hand.add(st);
    }
    if (acc.includes(MT.SHIELD)) {
      const sc = (ch.colors && ch.colors.shield) || pal.accent || MT.VALUE_2A4A8A;
      const sh = K.group(mesh(cyl(0.26 * s, 0.26 * s, 0.04 * s, 20), K.mat(MT.VALUE_8D949C, { m: 0.7, r: 0.4 }), 0, 0, 0, { rz: PI / 2 }), mesh(cyl(0.22 * s, 0.22 * s, 0.045 * s, 20), sc, 0.004, 0, 0, { rz: PI / 2 }));
      sh.position.set(0.04 * s, -L(d.fore) * 0.5, 0.07 * s);
      arms[0].el.add(sh);
    }
    if (acc.includes(MT.HANDBAG)) arms[1].hand.add(mesh(box(0.08 * s, 0.18 * s, 0.26 * s), (ch.colors && ch.colors.bag) || MT.VALUE_7A3A2A, 0, -0.12 * s, 0));
    const beam = K.lightCone(MT.FFF2CF, 6, 1.1, 0.13);
    beam.visible = false;
    beam.position.set(0, -0.08, 0);
    arms[0].hand.add(beam);
    root.traverse((o) => {
      if (o.isMesh && o !== beam) o.castShadow = true;
    });
    const STAND_FOOT_Y = -3.1;
    const LOCK = { walk: 0, carry: 0, sneak: 0, drag: 0, push: 0, hands_pocket: 0, look_around: 0, run: 7 };
    const setPose = (pose, opts = {}) => {
      const sk = ME.skeleton(ch, pose);
      let lockPx = 0;
      if (!pose.rot && LOCK[opts.action] != null) {
        const lowest = Math.max(sk.legs[0].foot[1], sk.legs[1].foot[1]);
        lockPx = Math.max(0, STAND_FOOT_Y - lowest - LOCK[opts.action]);
      }
      body.position.y = (-sk.hip[1] - lockPx) * PX * s;
      body.rotation.z = -(pose.rot || 0);
      const lean = sk.lean;
      torsoG.rotation.z = -lean;
      headG.rotation.z = -(pose.head || 0) - lean * 0.2;
      arms.forEach((a, i) => {
        const [ang, e] = pose.a[i];
        a.sh.rotation.z = ang + lean * 1.3;
        a.el.rotation.z = e;
      });
      legs.forEach((l, i) => {
        let [ang, k] = pose.l[i];
        if (longSkirt && Math.abs(ang) < 0.9) {
          ang *= 0.4;
          k *= 0.5;
        }
        l.hip.rotation.z = ang;
        l.kn.rotation.z = -k;
        l.foot.rotation.z = -ang + k;
      });
      const hk = pose.hold || (opts.hold ? (ME.HOLDABLE && ME.HOLDABLE[opts.hold]) || opts.hold : null) || (acc.includes(MT.BRIEFCASE) ? MT.BRIEFCASE : null);
      setHeld(hk);
      beam.visible = hk === MT.FLASHLIGHT;
    };
    setPose(ME.registry.actions.stand.pose(0, 0, {}), { action: MT.STAND });
    const rigOut = { root, body, setPose, ch, hand: arms[0].hand, height: L(d.torso + d.thigh + d.shin + d.neck + d.head * 2) };
    if (ch.fx && K.EXT.fx[ch.fx]) K.EXT.fx[ch.fx](rigOut);
    return rigOut;
  };
  const wheelGeo = (r, w) => K.geo(MF.WHL(`${r}`, `${w}`), () => new T.CylinderGeometry(r, r, w, 20).rotateX(PI / 2));
  const wheel = (r, w, x, z) => {
    const g = new T.Group();
    g.position.set(x, r, z);
    g.add(mesh(wheelGeo(r, w), MT.VALUE_141518, 0, 0, 0));
    g.add(mesh(wheelGeo(r * 0.58, w + 0.01), MT.VALUE_9AA0A6, 0, 0, 0, { m: 0.5, r: 0.4 }));
    g.add(mesh(box(r * 1.1, r * 0.12, w + 0.02), MT.VALUE_5B6168, 0, 0, 0));
    g.userData.wheel = r;
    return g;
  };
  const addWheels = (g, r, w, xs, track) => {
    for (const x of xs) for (const z of [track / 2, -track / 2]) g.add(wheel(r, w, x, z));
  };
  const lamps = (g, x, y, z, night, col = MT.FFF6D6) => {
    g.add(mesh(box(0.05, 0.1, 0.22), col, x, y, z, { e: night ? col : MT.VALUE_000000, ei: night ? 2 : 0, cast: false }));
    g.add(mesh(box(0.05, 0.1, 0.22), col, x, y, -z, { e: night ? col : MT.VALUE_000000, ei: night ? 2 : 0, cast: false }));
  };
  const car = (o, spec) => {
    const g = new T.Group();
    const night = !!o.night || !!o.lights;
    const col = o.color || spec.color;
    const w = spec.w || 1.8;
    g.add(profile(spec.body, w, col, { bevel: 0.05 }));
    if (spec.glass) for (const gl of spec.glass) g.add(profile(gl, w * 0.92, K.glass(!!o.night)));
    if (spec.extra) spec.extra(g, o, w, col);
    const L2 = spec.len / 2;
    lamps(g, L2 - 0.02, spec.lampY || 0.62, w * 0.36, night);
    g.add(mesh(box(0.04, 0.08, 0.2), MT.VALUE_9B1C1C, -L2 + 0.02, spec.lampY || 0.62, w * 0.36, { e: night ? MT.FF2A1A : MT.VALUE_000, ei: 1.5, cast: false }));
    g.add(mesh(box(0.04, 0.08, 0.2), MT.VALUE_9B1C1C, -L2 + 0.02, spec.lampY || 0.62, -w * 0.36, { e: night ? MT.FF2A1A : MT.VALUE_000, ei: 1.5, cast: false }));
    addWheels(g, spec.r || 0.32, 0.24, spec.wheels, w - 0.1);
    if (night && o.lights !== false) {
      const beam = K.lightCone(MT.FFF2C8, 9, 2.2, 0.1);
      beam.rotation.z = PI / 2;
      beam.position.set(L2, spec.lampY || 0.62, 0);
      g.add(beam);
      g.userData.headlight = { x: L2, y: spec.lampY || 0.62 };
    }
    return g;
  };
  const SEDAN = {
    len: 4.2,
    body: [
      [-2.08, 0.22],
      [-2.1, 0.62],
      [-1.7, 0.76],
      [-1.0, 0.8],
      [-0.66, 1.22],
      [0.84, 1.22],
      [1.26, 0.82],
      [1.94, 0.76],
      [2.1, 0.44],
      [2.06, 0.22],
    ],
    glass: [
      [
        [-0.58, 0.84],
        [-0.46, 1.16],
        [0.78, 1.16],
        [1.14, 0.84],
      ],
    ],
    wheels: [-1.26, 1.26],
  };
  M.car_sedan = (o) => car(o, Object.assign({ color: MT.VALUE_7A2B2B }, SEDAN));
  M.car_vintage = (o) =>
    car(
      o,
      Object.assign({ color: MT.C9B48A }, SEDAN, {
        body: [
          [-2.0, 0.22],
          [-2.0, 0.66],
          [-1.2, 0.76],
          [-0.7, 1.2],
          [0.7, 1.2],
          [1.1, 0.8],
          [2.0, 0.74],
          [2.0, 0.22],
        ],
      }),
    );
  M.police_car = (o) =>
    car(
      o,
      Object.assign({ color: MT.E9ECEF }, SEDAN, {
        extra: (g, oo, w) => {
          g.add(mesh(box(4.0, 0.12, w + 0.02), MT.VALUE_1F3C88, 0, 0.5, 0, { cast: false }));
          const k = Math.sin((oo.t || 0) * 12) > 0;
          g.add(mesh(box(0.25, 0.1, 0.5), MT.VALUE_2F6BFF, 0.1, 1.3, 0.28, { e: k ? MT.VALUE_2F6BFF : MT.VALUE_000, ei: 3 }));
          g.add(mesh(box(0.25, 0.1, 0.5), MT.FF2D2D, 0.1, 1.3, -0.28, { e: k ? MT.VALUE_000 : MT.FF2D2D, ei: 3 }));
        },
      }),
    );
  M.taxi = (o) => car(o, Object.assign({ color: MT.E7B416 }, SEDAN, { extra: (g) => g.add(mesh(box(0.5, 0.14, 0.3), MT.VALUE_222, 0.1, 1.3, 0)) }));
  M.sports_car = (o) =>
    car(o, {
      color: MT.D0302A,
      len: 4.4,
      body: [
        [-2.18, 0.2],
        [-2.2, 0.58],
        [-0.8, 0.7],
        [-0.2, 1.04],
        [0.4, 1.0],
        [1.0, 0.78],
        [2.2, 0.5],
        [2.2, 0.2],
      ],
      glass: [
        [
          [-0.4, 0.74],
          [-0.08, 0.98],
          [0.4, 0.96],
          [0.8, 0.74],
        ],
      ],
      wheels: [-1.3, 1.4],
      r: 0.3,
      lampY: 0.5,
    });
  M.limousine = (o) =>
    car(o, {
      color: MT.VALUE_16181C,
      len: 6,
      body: [
        [-2.95, 0.22],
        [-3.0, 0.64],
        [-2.1, 0.8],
        [-1.7, 1.18],
        [1.7, 1.18],
        [2.1, 0.82],
        [2.95, 0.7],
        [3.0, 0.22],
      ],
      glass: [
        [
          [-1.6, 0.84],
          [-1.5, 1.12],
          [1.6, 1.12],
          [1.9, 0.84],
        ],
      ],
      wheels: [-2.0, 2.0],
    });
  const vanBody = (len, h) => [
    [-len / 2, 0.25],
    [-len / 2, h],
    [len / 2 - 0.9, h],
    [len / 2 - 0.05, h * 0.55],
    [len / 2, 0.25],
  ];
  M.van = (o) =>
    car(o, {
      color: o.color || MT.E9E6DD,
      len: 4.6,
      w: 1.9,
      body: vanBody(4.6, 1.95),
      glass: [
        [
          [1.25, 1.2],
          [1.35, 1.85],
          [1.4, 1.85],
          [2.2, 1.15],
        ],
      ],
      wheels: [-1.5, 1.4],
      r: 0.34,
      lampY: 0.7,
    });
  M.ambulance = (o) =>
    car(o, {
      color: MT.F2F2EE,
      len: 4.8,
      w: 1.95,
      body: vanBody(4.8, 2.1),
      glass: [
        [
          [1.35, 1.3],
          [1.45, 2.0],
          [1.5, 2.0],
          [2.3, 1.2],
        ],
      ],
      wheels: [-1.6, 1.5],
      r: 0.36,
      lampY: 0.7,
      extra: (g, oo, w) => {
        g.add(mesh(box(4.7, 0.16, w + 0.02), MT.C42A2A, 0, 1.0, 0, { cast: false }));
        const k = Math.sin((oo.t || 0) * 12) > 0;
        g.add(mesh(box(0.3, 0.12, 0.5), MT.FF3B3B, 1.2, 2.18, 0.3, { e: k ? MT.FF3B3B : MT.VALUE_000, ei: 3 }));
        g.add(mesh(box(0.3, 0.12, 0.5), MT.VALUE_3A6BFF, 1.2, 2.18, -0.3, { e: k ? MT.VALUE_000 : MT.VALUE_3A6BFF, ei: 3 }));
      },
    });
  const truck = (o, spec) => {
    const g = new T.Group();
    const night = !!o.night || !!o.lights;
    const w = spec.w || 2.3;
    const cabL = spec.cabL || 1.8,
      len = spec.len;
    g.add(mesh(box(len - cabL - 0.1, spec.boxH, w), o.boxColor || spec.boxColor || MT.C9C9C4, -cabL / 2 - 0.05, 0.5 + spec.boxH / 2, 0));
    const cab = profile(
      [
        [0, 0.3],
        [0, 2.4],
        [cabL - 0.5, 2.4],
        [cabL, 1.4],
        [cabL, 0.3],
      ],
      w,
      o.color || spec.color,
      { bevel: 0.05 },
    );
    cab.position.x = len / 2 - cabL;
    g.add(cab);
    const gl = profile(
      [
        [cabL - 0.52, 2.25],
        [cabL - 0.08, 1.45],
        [cabL - 0.05, 1.45],
        [cabL - 0.05, 2.25],
      ],
      w * 0.9,
      K.glass(!!o.night),
    );
    gl.position.x = len / 2 - cabL;
    g.add(gl);
    g.add(mesh(box(len - 0.2, 0.18, w * 0.9), MT.VALUE_2A2A2A, 0, 0.42, 0));
    lamps(g, len / 2, 0.75, w * 0.38, night);
    addWheels(g, 0.48, 0.34, spec.wheels, w - 0.2);
    if (spec.extra) spec.extra(g, o, w, len);
    if (night) {
      const beam = K.lightCone(MT.FFF2C8, 9, 2.2, 0.1);
      beam.rotation.z = PI / 2;
      beam.position.set(len / 2, 0.75, 0);
      g.add(beam);
    }
    return g;
  };
  M.truck = (o) => truck(o, { len: 7.5, boxH: 2.6, color: MT.VALUE_2F5F8A, wheels: [-2.6, -1.6, 2.6] });
  M.armored_truck = (o) => truck(o, { len: 6.5, boxH: 2.2, color: MT.VALUE_4A5048, boxColor: MT.VALUE_5A6058, wheels: [-2.1, 2.2] });
  M.fire_truck = (o) =>
    truck(o, {
      len: 8.5,
      boxH: 1.8,
      color: MT.C0281F,
      boxColor: MT.C0281F,
      wheels: [-3, -2, 2.9],
      extra: (g, oo, w) => {
        g.add(mesh(box(6, 0.12, 0.5), MT.CFD4D8, -1, 2.7, 0));
        const k = Math.sin((oo.t || 0) * 12) > 0;
        g.add(mesh(box(0.3, 0.14, 1.2), MT.FF3B3B, 3.4, 2.55, 0, { e: k ? MT.FF3B3B : MT.VALUE_400, ei: 3 }));
      },
    });
  M.pickup_truck = (o) => truck(o, { len: 5.2, boxH: 0.6, cabL: 2.6, color: MT.VALUE_3B5A7A, boxColor: MT.VALUE_3B5A7A, wheels: [-1.7, 1.7] });
  M.bus = (o) => {
    const g = new T.Group();
    const L = 11,
      w = 2.5;
    const col = o.color || MT.D4552A;
    g.add(mesh(box(L, 2.8, w), K.facadeMat(col, 10, 2, { night: o.night, seed: 5, win: MT.VALUE_2A3A4A, lit: 0.9 }), 0, 1.75, 0));
    g.add(mesh(box(L, 0.5, w * 1.01), shade(col, -0.25), 0, 0.55, 0));
    lamps(g, L / 2, 0.75, w * 0.38, !!o.night);
    addWheels(g, 0.5, 0.34, [-3.5, 3.6], w - 0.2);
    return g;
  };
  M.jeep = (o) => {
    const g = car(o, {
      color: MT.VALUE_5A6A3A,
      len: 3.8,
      w: 1.8,
      body: [
        [-1.9, 0.4],
        [-1.9, 1.15],
        [1.9, 1.15],
        [1.95, 0.4],
      ],
      wheels: [-1.2, 1.2],
      r: 0.38,
      lampY: 0.95,
    });
    g.add(
      profile(
        [
          [-0.4, 1.1],
          [-0.4, 1.75],
          [0.8, 1.75],
          [0.9, 1.1],
        ],
        1.7,
        K.glass(!!o.night),
      ),
    );
    g.add(mesh(cyl(0.38, 0.38, 0.24, 18), MT.VALUE_222, -2.0, 0.85, 0, { rz: PI / 2 }));
    return g;
  };
  M.tractor = (o) => {
    const g = new T.Group();
    const col = o.color || MT.C8452A;
    g.add(mesh(box(2.2, 0.75, 1.0), col, 0.4, 1.15, 0));
    g.add(mesh(box(1.0, 1.0, 1.3), K.glass(!!o.night), -0.6, 2.0, 0));
    g.add(mesh(box(1.05, 0.08, 1.35), MT.VALUE_2A2D33, -0.6, 2.55, 0));
    g.add(wheel(0.75, 0.45, -0.6, 0.85));
    g.add(wheel(0.75, 0.45, -0.6, -0.85));
    g.add(wheel(0.42, 0.3, 1.2, 0.7));
    g.add(wheel(0.42, 0.3, 1.2, -0.7));
    return g;
  };
  const tube = (a, b, r, col) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const m = mesh(cyl(r, r, len, 8), col, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
    m.rotation.z = Math.atan2(dy, dx) - PI / 2;
    return m;
  };
  const ringWheel = (r, x) => {
    const g = new T.Group();
    g.position.set(x, r, 0);
    g.add(mesh(new T.TorusGeometry(r * 0.92, r * 0.09, 8, 28), MT.VALUE_151619));
    for (let i = 0; i < 6; i++) g.add(mesh(box(r * 1.8, 0.012, 0.012), MT.VALUE_8A9096, 0, 0, 0, { rz: (i * PI) / 6, cast: false }));
    g.userData.wheel = r;
    return g;
  };
  M.bicycle = (o) => {
    const g = new T.Group();
    const col = o.color || MT.VALUE_2F6A8A;
    g.add(ringWheel(0.34, -0.52), ringWheel(0.34, 0.52));
    g.add(tube([-0.52, 0.34], [-0.05, 0.42], 0.02, col), tube([-0.05, 0.42], [0.42, 0.85], 0.02, col), tube([-0.52, 0.34], [-0.12, 0.85], 0.02, col), tube([-0.12, 0.85], [0.42, 0.85], 0.02, col), tube([0.52, 0.34], [0.42, 0.95], 0.02, col));
    g.add(mesh(box(0.22, 0.05, 0.12), MT.VALUE_222, -0.12, 0.92, 0), mesh(box(0.05, 0.03, 0.5), MT.VALUE_222, 0.42, 0.97, 0));
    return g;
  };
  const moto = (o, col, scooter) => {
    const g = new T.Group();
    g.add(wheel(0.32, 0.14, -0.72, 0), wheel(0.32, 0.14, 0.72, 0));
    if (scooter) {
      g.add(
        profile(
          [
            [-0.95, 0.35],
            [-0.85, 0.85],
            [-0.2, 0.9],
            [0.2, 0.42],
            [0.5, 0.42],
            [0.62, 1.15],
            [0.72, 1.15],
            [0.6, 0.35],
          ],
          0.42,
          col,
          { bevel: 0.04 },
        ),
      );
    } else {
      g.add(
        profile(
          [
            [-0.7, 0.5],
            [-0.75, 0.8],
            [0.0, 0.95],
            [0.45, 0.95],
            [0.55, 0.55],
            [0.0, 0.42],
          ],
          0.32,
          col,
          { bevel: 0.03 },
        ),
      );
      g.add(mesh(box(0.62, 0.1, 0.3), MT.VALUE_1A1A1A, -0.3, 0.98, 0));
      g.add(tube([0.72, 0.32], [0.5, 1.1], 0.03, MT.VALUE_777));
    }
    g.add(mesh(box(0.05, 0.04, 0.62), MT.VALUE_222, 0.52, 1.12, 0));
    const night = !!o.night || !!o.lights;
    g.add(mesh(sph(0.07, 10), MT.FFF6D6, 0.68, 0.98, 0, { e: night ? MT.FFF6D6 : MT.VALUE_000, ei: 2, cast: false }));
    return g;
  };
  M.motorbike = (o) => moto(o, o.color || MT.VALUE_2A2D33, false);
  M.scooter = (o) => moto(o, o.color || MT.VALUE_9FD0C8, true);
  M.vespa = (o) => moto(o, o.color || MT.VALUE_9FD0C8, true);
  M.cyclo = (o) => {
    const g = M.bicycle({ color: MT.VALUE_2A2A2A });
    g.add(mesh(box(1.0, 0.55, 0.9), o.color || MT.VALUE_2F5F8A, 1.15, 0.75, 0));
    g.add(mesh(box(0.15, 0.7, 0.9), shade(o.color || MT.VALUE_2F5F8A, -0.2), 0.7, 1.05, 0));
    g.add(ringWheel(0.32, 1.35), ringWheel(0.32, 1.0));
    return g;
  };
  const railCar = (o, len, col) => {
    const g = new T.Group();
    g.add(mesh(box(len, 2.6, 2.8), K.facadeMat(col, Math.round(len / 1.6), 2, { night: o.night, seed: 7, win: MT.VALUE_2A3A4A, lit: 0.95 }), 0, 1.9, 0));
    g.add(mesh(box(len, 0.25, 2.82), shade(col, -0.3), 0, 0.6, 0));
    for (const x of [-len / 2 + 1.5, len / 2 - 1.5]) addWheels(g, 0.42, 0.2, [x - 0.5, x + 0.5], 2.2);
    return g;
  };
  M.train = (o) => {
    const g = new T.Group();
    for (let i = 0; i < 3; i++) {
      const c = railCar(o, 9, o.color || MT.VALUE_2F4F78);
      c.position.x = -i * 9.4;
      g.add(c);
    }
    return g;
  };
  M.tram = (o) => railCar(o, 10, o.color || MT.D8B13A);
  const plane = (o, L, col, prop) => {
    const g = new T.Group();
    const r = L * 0.06;
    g.add(mesh(cap(r, L - r * 2, 14), col, 0, 0, 0, { rz: PI / 2 }));
    g.add(mesh(box(L * 0.18, 0.08, L * 0.95), shade(col, -0.05), 0.02 * L, -r * 0.3, 0));
    g.add(mesh(box(L * 0.08, 0.06, L * 0.32), col, -L * 0.45, r * 0.4, 0));
    g.add(mesh(box(L * 0.1, L * 0.14, 0.06), col, -L * 0.45, L * 0.08, 0));
    if (prop) {
      const pr = mesh(box(0.05, L * 0.25, 0.08), MT.VALUE_222, L * 0.5 + 0.03, 0, 0);
      pr.userData.spin = 40;
      g.add(pr);
    } else for (const z of [L * 0.22, -L * 0.22]) g.add(mesh(cyl(r * 0.35, r * 0.35, L * 0.12, 12), MT.VALUE_9AA0A6, 0.06 * L, -r * 0.8, z, { rz: PI / 2 }));
    g.position.y = 0;
    const holder = new T.Group();
    holder.add(g);
    g.position.y = 6;
    return holder;
  };
  M.airplane = (o) => plane(o, 30, o.color || MT.F2F2EF, false);
  M.small_plane = (o) => plane(o, 9, o.color || MT.D8452A, true);
  M.helicopter = (o) => {
    const g = new T.Group();
    g.add(mesh(sph(1.2, 16), o.color || MT.VALUE_2A4A6A, 0, 4, 0, { sx: 1.4, sy: 0.9 }));
    g.add(mesh(cyl(0.12, 0.25, 5, 10), o.color || MT.VALUE_2A4A6A, -3.3, 4.2, 0, { rz: PI / 2 }));
    const rotor = mesh(box(9, 0.04, 0.25), MT.VALUE_222, 0, 5.2, 0);
    rotor.userData.spinY = 30;
    g.add(rotor);
    g.add(mesh(box(2.4, 0.06, 0.06), MT.VALUE_333, 0, 2.9, 0.7), mesh(box(2.4, 0.06, 0.06), MT.VALUE_333, 0, 2.9, -0.7));
    return g;
  };
  M.hot_air_balloon = (o) => {
    const g = new T.Group();
    const cols = o.colors || [MT.E2553A, MT.F2C14E, MT.VALUE_3A7BD5];
    for (let i = 0; i < 12; i++) {
      const seg = new T.SphereGeometry(4, 6, 16, (i / 12) * PI * 2, PI / 6);
      g.add(mesh(seg, cols[i % cols.length], 0, 14, 0, { sy: 1.15 }));
    }
    g.add(mesh(box(1.4, 1.0, 1.4), MT.VALUE_8A5A32, 0, 7, 0));
    return g;
  };
  M.drone = (o) => {
    const g = new T.Group();
    g.add(mesh(box(0.35, 0.1, 0.35), o.color || MT.VALUE_2A2D33, 0, 3, 0));
    for (const [x, z] of [
      [0.3, 0.3],
      [-0.3, 0.3],
      [0.3, -0.3],
      [-0.3, -0.3],
    ]) {
      const p = mesh(box(0.3, 0.01, 0.04), MT.VALUE_555, x, 3.08, z);
      p.userData.spinY = 60;
      g.add(p);
    }
    return g;
  };
  const hull = (o, L, H, w, col) =>
    profile(
      [
        [-L / 2, 0.15],
        [-L / 2 + 0.2, H],
        [L / 2 + 0.3, H + 0.1],
        [L / 2 - 0.4, 0],
      ],
      w,
      col,
      { bevel: 0.04 },
    );
  const boat = (o, L, H, w, col, extra) => {
    const g = new T.Group();
    g.add(hull(o, L, H, w, col));
    if (extra) extra(g);
    g.userData.bob = 0.06;
    return g;
  };
  M.boat = (o) => boat(o, 6, 0.8, 2.0, o.color || MT.VALUE_2F6B8A, (g) => g.add(mesh(box(1.6, 1.0, 1.4), MT.E9E2CC, -0.5, 1.3, 0)));
  M.fishing_boat = (o) =>
    boat(o, 8, 1.0, 2.6, o.color || MT.VALUE_2F6B8A, (g) => {
      g.add(mesh(box(2.0, 1.4, 1.8), MT.E9E2CC, -0.8, 1.7, 0));
      g.add(mesh(cyl(0.06, 0.06, 5, 8), MT.VALUE_5A4A3A, 1.8, 3.4, 0));
    });
  M.speedboat = (o) =>
    boat(o, 5, 0.6, 1.8, o.color || MT.F0F0EC, (g) =>
      g.add(
        profile(
          [
            [-0.3, 0.6],
            [0.2, 1.0],
            [0.9, 1.0],
            [1.2, 0.6],
          ],
          1.4,
          K.glass(!!o.night),
        ),
      ),
    );
  M.ship = (o) =>
    boat(o, 30, 3, 7, o.color || MT.VALUE_5A2A2A, (g) => {
      const r = U.rng(3);
      for (let i = 0; i < 10; i++) g.add(mesh(box(2.5, 1.2, 2.2), [MT.C44A2A, MT.VALUE_2A6AD0, MT.E2A23A, MT.VALUE_3A8A4A][i % 4], -12 + i * 2.6, 3.7 + (r() > 0.5 ? 1.2 : 0), 0));
      g.add(mesh(box(3, 4, 5), MT.E9E2CC, 12, 5, 0));
    });
  M.sailboat = (o) =>
    boat(o, 6, 0.7, 2, o.color || MT.F2EFE8, (g) => {
      g.add(mesh(cyl(0.05, 0.05, 7, 8), MT.VALUE_6A5A4A, 0.3, 4.2, 0));
      const sail = new T.Shape();
      sail.moveTo(0, 0);
      sail.lineTo(0, 6);
      sail.lineTo(2.8, 0);
      sail.closePath();
      g.add(mesh(new T.ShapeGeometry(sail), mat(MT.F6F3EA, { side: 2 }), 0.35, 1.0, 0));
    });
  M.rowboat = (o) => boat(o, 3.5, 0.5, 1.3, o.color || MT.VALUE_8A5A32);
  M.raft = (o) => {
    const g = new T.Group();
    g.add(mesh(cap(0.25, 2.0, 10), o.color || MT.E2702A, 0, 0.25, 0.5, { rz: PI / 2 }), mesh(cap(0.25, 2.0, 10), o.color || MT.E2702A, 0, 0.25, -0.5, { rz: PI / 2 }));
    g.add(mesh(box(2.2, 0.08, 1.0), MT.VALUE_5A4A3A, 0, 0.2, 0));
    return g;
  };
  M.basket_boat = (o) => {
    const g = new T.Group();
    g.add(mesh(new T.SphereGeometry(1.0, 20, 10, 0, PI * 2, PI / 2, PI / 2), mat(o.color || MT.VALUE_6A5236, { side: 2 }), 0, 0.5, 0));
    return g;
  };
  const blobTree = (o, trunkH, trunkR, blobs, col, trunkCol = MT.VALUE_4A3626) => {
    const g = new T.Group();
    g.add(mesh(cyl(trunkR * 0.7, trunkR, trunkH, 8), trunkCol, 0, trunkH / 2, 0));
    const r = U.rng(5 + (o.seed || 0));
    for (const [x, y, z, rad] of blobs) g.add(mesh(ico(rad, 1), mat(r() > 0.5 ? col : shade(col, -0.08), { flat: true }), x, y, z, { ry: r() * 3 }));
    g.userData.sway = 0.015;
    return g;
  };
  M.tree_round = (o) =>
    blobTree(
      o,
      1.9,
      0.16,
      [
        [0, 2.6, 0, 1.25],
        [0.7, 2.3, 0.4, 0.8],
        [-0.7, 2.35, -0.3, 0.85],
      ],
      o.color || MT.VALUE_3F6B3A,
    );
  M.tree_oak = (o) =>
    blobTree(
      o,
      2.3,
      0.28,
      [
        [-0.6, 3.0, 0, 1.5],
        [0.8, 3.2, 0.3, 1.5],
        [0, 4.0, -0.2, 1.4],
        [0.2, 2.9, 0.9, 1.1],
      ],
      o.color || MT.VALUE_3D6A35,
    );
  M.tree_autumn = (o) =>
    blobTree(
      o,
      2.0,
      0.18,
      [
        [0, 2.7, 0, 1.3],
        [0.7, 2.4, 0.3, 0.9],
        [-0.6, 2.5, -0.3, 0.9],
      ],
      o.color || MT.C9762E,
    );
  M.tree_blossom = (o) =>
    blobTree(
      o,
      1.8,
      0.14,
      [
        [0, 2.5, 0, 1.0],
        [0.8, 2.2, 0.3, 0.7],
        [-0.7, 2.3, -0.4, 0.75],
        [0.2, 3.0, 0.2, 0.7],
      ],
      o.color || MT.F2A7C0,
      MT.VALUE_4A2F26,
    );
  M.tree_jungle = (o) =>
    blobTree(
      o,
      3.2,
      0.25,
      [
        [0, 3.8, 0, 1.8],
        [1.2, 3.4, 0.5, 1.2],
        [-1.1, 3.5, -0.4, 1.3],
      ],
      o.color || MT.VALUE_2A4F26,
    );
  M.bush = (o) =>
    blobTree(
      o,
      0.01,
      0.01,
      [
        [0, 0.5, 0, 0.7],
        [0.6, 0.4, 0.2, 0.5],
        [-0.6, 0.42, -0.2, 0.55],
      ],
      o.color || MT.VALUE_3E6A38,
    );
  M.tree_birch = (o) => {
    const g = blobTree(
      o,
      3.6,
      0.1,
      [
        [0, 3.6, 0, 0.8],
        [0.2, 3.0, 0.2, 0.6],
      ],
      o.color || MT.VALUE_9CB54A,
      MT.ECE9DF,
    );
    return g;
  };
  M.tree_pine = (o) => {
    const g = new T.Group();
    const col = o.color || MT.VALUE_2C4A36;
    g.add(mesh(cyl(0.1, 0.14, 1.0, 8), MT.VALUE_3E2C1E, 0, 0.5, 0));
    for (let i = 0; i < 4; i++) g.add(mesh(cone(1.3 - i * 0.24, 1.5, 10), mat(shade(col, i * 0.04), { flat: true }), 0, 1.2 + i * 0.75, 0));
    g.userData.sway = 0.008;
    return g;
  };
  M.tree_cypress = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(0.08, 0.12, 0.6, 8), MT.VALUE_3E2C1E, 0, 0.3, 0));
    g.add(mesh(sph(1, 12), mat(o.color || MT.VALUE_24402C, { flat: true }), 0, 2.6, 0, { sx: 0.55, sy: 2.3, sz: 0.55 }));
    return g;
  };
  M.tree_palm = (o) => {
    const g = new T.Group();
    const col = o.color || MT.VALUE_3D7A3F;
    for (let i = 0; i < 8; i++) g.add(mesh(cyl(0.14, 0.17, 0.6, 8), MT.VALUE_7A5B3A, Math.sin(i * 0.25) * 0.25, 0.3 + i * 0.55, 0, { rz: -0.04 * i }));
    const top = new T.Group();
    top.position.set(0.45, 4.6, 0);
    for (let i = 0; i < 7; i++) {
      const leaf = mesh(box(2.4, 0.04, 0.42), mat(col, { side: 2 }), 1.1, -0.25, 0);
      const holder = new T.Group();
      holder.rotation.y = (i / 7) * PI * 2;
      holder.rotation.z = -0.35;
      holder.add(leaf);
      top.add(holder);
    }
    g.add(top);
    g.userData.sway = 0.02;
    return g;
  };
  M.tree_bare = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(0.1, 0.18, 2.6, 8), MT.VALUE_4A3A2E, 0, 1.3, 0));
    for (let i = 0; i < 5; i++) {
      const b = mesh(cyl(0.03, 0.06, 1.3, 6), MT.VALUE_4A3A2E, 0, 0.65, 0);
      const h = new T.Group();
      h.position.y = 1.6 + i * 0.25;
      h.rotation.set(0, i * 1.3, 0.7);
      h.add(b);
      g.add(h);
    }
    return g;
  };
  M.tree_willow = (o) => {
    const g = blobTree(o, 2.0, 0.2, [[0, 3.0, 0, 1.4]], o.color || MT.VALUE_6F9A4A);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * PI * 2;
      g.add(mesh(cyl(0.05, 0.03, 2.2, 5), o.color || MT.VALUE_6F9A4A, Math.cos(a) * 1.2, 1.9, Math.sin(a) * 1.2, { cast: false }));
    }
    return g;
  };
  M.banana_tree = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(0.12, 0.16, 2.2, 8), MT.VALUE_7A8A4A, 0, 1.1, 0));
    for (let i = 0; i < 6; i++) {
      const h = new T.Group();
      h.position.y = 2.2;
      h.rotation.set(0, i * 1.05, 0.9);
      h.add(mesh(sph(1, 8), mat(o.color || MT.VALUE_5F9A3A, { flat: true }), 0, 0.8, 0, { sx: 0.3, sy: 0.9, sz: 0.05 }));
      g.add(h);
    }
    return g;
  };
  M.bamboo = (o) => {
    const g = new T.Group();
    const r = U.rng(4);
    for (let i = 0; i < 9; i++) {
      const h = 4 + r() * 1.5;
      g.add(mesh(cyl(0.05, 0.06, h, 6), o.color || MT.VALUE_6A9A3A, -0.6 + r() * 1.2, h / 2, -0.4 + r() * 0.8, { rz: (r() - 0.5) * 0.12 }));
    }
    g.add(mesh(ico(1.2, 1), mat(shade(o.color || MT.VALUE_6A9A3A, -0.05), { flat: true }), 0, 4.6, 0, { sy: 0.6 }));
    return g;
  };
  M.cactus = (o) => {
    const g = new T.Group();
    const col = o.color || MT.VALUE_4A7A46;
    g.add(mesh(cap(0.22, 1.8, 10), col, 0, 1.1, 0));
    g.add(mesh(cap(0.14, 0.6, 8), col, -0.45, 1.3, 0), mesh(cap(0.12, 0.25, 8), col, -0.3, 0.95, 0, { rz: PI / 2 }));
    return g;
  };
  M.hedge = (o) =>
    mesh(
      K.geo(MT.HEDGE, () => new T.BoxGeometry(4, 1, 0.8, 4, 2, 2)),
      mat(o.color || MT.VALUE_35603A, { flat: true }),
      0,
      0.5,
      0,
    );
  M.rock = (o) =>
    mesh(
      K.geo(MT.ROCK, () => new T.DodecahedronGeometry(0.6, 0)),
      mat(o.color || MT.VALUE_7A7670, { flat: true }),
      0,
      0.35,
      0,
      { sy: 0.7 },
    );
  M.mountain = (o) => mesh(cone(7, 6, 8), mat(o.color || MT.VALUE_5A6A7A, { flat: true }), 0, 3, 0);
  const pitched = (w, d, h, col) => {
    const sh = new T.Shape();
    sh.moveTo(-d / 2 - 0.2, 0);
    sh.lineTo(0, h);
    sh.lineTo(d / 2 + 0.2, 0);
    sh.closePath();
    const geo = K.geo(MF.ROOF(`${w}`, `${d}`, `${h}`), () => {
      const gg = new T.ExtrudeGeometry(sh, { depth: w + 0.4, bevelEnabled: false });
      gg.translate(0, 0, -(w + 0.4) / 2);
      gg.rotateY(PI / 2);
      return gg;
    });
    return mesh(geo, mat(col, { flat: true }));
  };
  const building = (o, spec) => {
    const g = new T.Group();
    const w = spec.w,
      h = spec.h,
      d = spec.d || 8;
    const wall = o.color || spec.color;
    const front = K.facadeMat(wall, spec.cols, spec.rows, { night: !!o.night, seed: o.seed || spec.seed || 1, ground: spec.groundFloor, lit: spec.lit });
    const side = mat(shade(wall, -0.12));
    const geo = box(w, h, d);
    const mats6 = [side, side, mat(shade(wall, -0.2)), side, front, side];
    const m = new T.Mesh(geo, mats6);
    m.position.set(0, h / 2, -d / 2);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    if (spec.roof === MT.PITCHED) {
      const r = pitched(w, d, spec.roofH || 2, spec.roofColor || MT.VALUE_8A3B2A);
      r.position.set(0, h, -d / 2);
      g.add(r);
    } else if (spec.roof === MT.MANSARD) {
      g.add(mesh(box(w * 0.98, 1.6, d * 0.9), mat(spec.roofColor || MT.VALUE_4A4F58), 0, h + 0.8, -d / 2));
      for (let i = 0; i < Math.max(1, Math.round(w / 3)); i++) g.add(mesh(box(0.8, 0.9, 0.5), mat(shade(wall, 0.05)), -w / 2 + 1.5 + i * 3, h + 0.9, 0.05));
    } else g.add(mesh(box(w + 0.2, 0.25, d + 0.2), shade(wall, -0.25), 0, h + 0.12, -d / 2));
    if (spec.balconies) for (let j = 1; j < spec.rows - 1; j++) g.add(mesh(box(w * 0.94, 0.08, 0.5), MT.VALUE_2A2A2E, 0, (h / spec.rows) * (spec.rows - j) - 0.25, 0.25));
    if (spec.extra) spec.extra(g, o, w, h, d, wall);
    return g;
  };
  M.building_haussmann = (o) => building(o, { w: (o.w || 380) * PX * 1.6, h: (o.h || 560) * PX * 2.2, color: MT.D8C7A6, cols: 5, rows: 6, roof: MT.MANSARD, balconies: true, groundFloor: true });
  M.building_modern = (o) => building(o, { w: 10, h: 22, color: MT.VALUE_7D8F9F, cols: 6, rows: 10, lit: 0.45 });
  M.skyscraper = (o) => building(o, { w: 12, h: 60, color: MT.VALUE_5F7488, cols: 8, rows: 30, lit: 0.3 });
  M.apartment_block = (o) => building(o, { w: 14, h: 18, color: MT.CFC4B2, cols: 8, rows: 6, balconies: true });
  M.house = (o) => building(o, { w: 7, h: 3.2, d: 7, color: MT.E6D6BF, cols: 3, rows: 1, roof: MT.PITCHED, roofH: 2.4, groundFloor: false });
  M.farmhouse = (o) => building(o, { w: 9, h: 3.4, d: 7, color: MT.B9A88C, cols: 3, rows: 1, roof: MT.PITCHED, roofH: 2.4, roofColor: MT.VALUE_9A4B30 });
  M.shop_front = (o) =>
    building(o, {
      w: 6,
      h: 4.2,
      d: 6,
      color: MT.E4DCCB,
      cols: 2,
      rows: 2,
      groundFloor: true,
      extra: (g, oo, w, h) => {
        for (let i = 0; i < 8; i++) g.add(mesh(box(w / 8, 0.06, 1.2), i % 2 ? oo.awning || MT.VALUE_7A2A2A : MT.EFE7D6, -w / 2 + (i + 0.5) * (w / 8), h * 0.55, 0.6, { rx: 0.35 }));
      },
    });
  M.tube_house = (o) =>
    building(o, {
      w: 4,
      h: (o.h || 520) * PX * 2.2,
      d: 12,
      color: o.color || [MT.E8C96A, MT.D9E3C4, MT.F2B8A0, MT.BCD6E0, MT.E9E1CF][(o.seed || 0) % 5],
      cols: 1,
      rows: 4,
      groundFloor: true,
      extra: (g, oo, w, h) => {
        for (let j = 1; j < 4; j++) g.add(mesh(box(w * 0.9, 0.08, 0.6), MT.VALUE_2A2A2A, 0, (h / 4) * j - 0.1, 0.3));
        g.add(mesh(box(w * 0.95, 0.5, 0.12), oo.sign || MT.B8322A, 0, h / 4 + 0.2, 0.08));
      },
    });
  M.bank_facade = (o) =>
    building(o, {
      w: 16,
      h: 9,
      d: 10,
      color: MT.E6DCC8,
      cols: 6,
      rows: 2,
      extra: (g, oo, w, h) => {
        for (let i = 0; i < 6; i++) g.add(mesh(cyl(0.35, 0.4, h * 0.7, 14), MT.F1E9DA, -w * 0.35 + i * (w * 0.14), h * 0.35, 0.8));
        const ped = new T.Shape();
        ped.moveTo(-w * 0.45, 0);
        ped.lineTo(0, 2.2);
        ped.lineTo(w * 0.45, 0);
        ped.closePath();
        g.add(mesh(new T.ExtrudeGeometry(ped, { depth: 1.2, bevelEnabled: false }), MT.EFE6D4, 0, h * 0.72, 0.2));
        g.add(mesh(box(w * 0.92, 0.5, 1.4), MT.EFE6D4, 0, h * 0.7, 0.8));
        g.add(mesh(box(w * 0.7, 0.4, 2.4), MT.D9CFBA, 0, 0.2, 1.2));
      },
    });
  M.courthouse = M.bank_facade;
  M.church = (o) =>
    building(o, {
      w: 9,
      h: 8,
      d: 14,
      color: MT.D9D0BF,
      cols: 2,
      rows: 2,
      roof: MT.PITCHED,
      roofH: 4,
      roofColor: MT.VALUE_5A5048,
      extra: (g) => {
        g.add(mesh(box(3, 14, 3), MT.D9D0BF, 0, 7, 1.5));
        g.add(mesh(cone(2.2, 6, 4), mat(MT.VALUE_5A5048, { flat: true }), 0, 17, 1.5, { ry: PI / 4 }));
      },
    });
  M.warehouse = (o) => building(o, { w: 18, h: 7, d: 14, color: MT.VALUE_8A7A6A, cols: 6, rows: 1, roof: MT.PITCHED, roofH: 1.6, roofColor: MT.VALUE_6A6A6A });
  M.factory = (o) =>
    building(o, {
      w: 20,
      h: 8,
      d: 14,
      color: MT.VALUE_8A7A6A,
      cols: 8,
      rows: 1,
      extra: (g) => {
        g.add(mesh(cyl(0.8, 1.0, 16, 12), MT.VALUE_6A5A4A, 6, 8, -4), mesh(cyl(0.7, 0.9, 13, 12), MT.VALUE_6A5A4A, 8.5, 6.5, -4));
      },
    });
  M.hospital = (o) =>
    building(o, {
      w: 18,
      h: 14,
      d: 12,
      color: MT.EEF0EE,
      cols: 9,
      rows: 5,
      lit: 0.6,
      extra: (g, oo, w, h) => {
        g.add(mesh(box(1.6, 1.6, 0.3), MT.D23A3A, 0, h + 1.3, 0.2), mesh(box(0.5, 1.3, 0.35), MT.FFF, 0, h + 1.3, 0.2), mesh(box(1.3, 0.5, 0.35), MT.FFF, 0, h + 1.3, 0.2));
      },
    });
  M.school = (o) => building(o, { w: 18, h: 7, d: 10, color: MT.F0D27A, cols: 8, rows: 2, roof: MT.PITCHED, roofH: 2.5, roofColor: MT.VALUE_9A3A2A });
  M.prison_wall = (o) => mesh(box(16, 5, 0.8), mat(o.color || MT.VALUE_8A847A, { flat: true }), 0, 2.5, 0);
  M.control_tower = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(1.2, 1.6, 18, 12), MT.D9D6CF, 0, 9, 0));
    g.add(mesh(cyl(2.6, 2.2, 2.4, 12), K.glass(!!o.night), 0, 19.2, 0));
    g.add(mesh(cyl(2.8, 2.8, 0.3, 12), MT.VALUE_3A3D43, 0, 20.5, 0));
    return g;
  };
  M.lighthouse = (o) => {
    const g = new T.Group();
    for (let i = 0; i < 6; i++) g.add(mesh(cyl(1.3 - i * 0.12, 1.42 - i * 0.12, 2.6, 16), i % 2 ? MT.C43A2A : MT.EFEFE9, 0, 1.3 + i * 2.6, 0));
    g.add(mesh(cyl(0.9, 0.9, 1.6, 12), K.mat(MT.FFF1B0, { e: o.night ? MT.FFF1B0 : MT.VALUE_000, ei: 2 }), 0, 16.4, 0));
    g.add(mesh(cone(1.1, 1.4, 12), MT.VALUE_2A2D33, 0, 17.9, 0));
    return g;
  };
  M.windmill = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(1.4, 2.2, 9, 8), mat(o.color || MT.D9CDB4, { flat: true }), 0, 4.5, 0));
    g.add(mesh(cone(1.8, 2.2, 8), MT.VALUE_6A4A32, 0, 10.1, 0));
    const blades = new T.Group();
    blades.position.set(1.6, 9, 0);
    for (let i = 0; i < 4; i++) {
      const b = new T.Group();
      b.rotation.x = (i * PI) / 2;
      b.add(mesh(box(0.1, 5, 0.9), MT.EFE9D8, 0, 2.6, 0));
      blades.add(b);
    }
    blades.userData.spinX = 1.2;
    g.add(blades);
    return g;
  };
  M.pagoda = (o) => {
    const g = new T.Group();
    const roof = o.roof || MT.VALUE_8A3A2A,
      wall = o.color || MT.E9D8B0;
    g.add(mesh(box(10, 0.6, 8), MT.B8A888, 0, 0.3, 0));
    g.add(mesh(box(8, 3.2, 6), wall, 0, 2.2, 0));
    for (let i = -2; i <= 2; i++) g.add(mesh(cyl(0.18, 0.18, 3.2, 10), MT.VALUE_7A2A22, i * 1.9, 2.2, 3.05));
    const eave = (y, w, d, h) => {
      const r = mesh(cone(1, 1, 4), mat(roof, { flat: true }), 0, y, 0, { ry: PI / 4 });
      r.scale.set((w / Math.SQRT2) * 1.05, h, (d / Math.SQRT2) * 1.05);
      return r;
    };
    g.add(eave(4.5, 11, 9, 2.4));
    g.add(mesh(box(5, 2, 4), wall, 0, 6.2, 0));
    g.add(eave(7.9, 7.5, 6, 2));
    g.add(mesh(sph(0.3, 10), MT.E3B24A, 0, 9.1, 0));
    return g;
  };
  M.gas_station = (o) => {
    const g = new T.Group();
    g.add(mesh(box(9, 0.6, 6), o.color || MT.D23A2A, 0, 4.4, 0));
    for (const [x, z] of [
      [-4, 2.6],
      [4, 2.6],
      [-4, -2.6],
      [4, -2.6],
    ])
      g.add(mesh(cyl(0.15, 0.15, 4.2, 8), MT.CCC, x, 2.1, z));
    for (const x of [-1.5, 1.5]) g.add(mesh(box(0.6, 1.6, 0.8), MT.EEE, x, 0.8, 0));
    return g;
  };
  M.tent = (o) => {
    const g = new T.Group();
    const r = mesh(cone(1.6, 1.8, 4), mat(o.color || MT.D0702A, { flat: true }), 0, 0.9, 0, { ry: PI / 4 });
    r.scale.set(1.3, 1, 1);
    g.add(r);
    return g;
  };
  M.street_lamp = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(0.07, 0.1, 4.6, 8), MT.VALUE_2A2D33, 0, 2.3, 0));
    g.add(mesh(box(0.9, 0.06, 0.06), MT.VALUE_2A2D33, 0.42, 4.55, 0));
    const night = !!o.night;
    g.add(mesh(box(0.35, 0.12, 0.3), K.mat(MT.FFF2C8, { e: night ? MT.FFD9A0 : MT.VALUE_000, ei: night ? 3 : 0 }), 0.85, 4.45, 0, { cast: false }));
    if (night) {
      const c = K.lightCone(MT.FFD9A0, 4.4, 1.7, 0.09);
      c.position.set(0.85, 4.4, 0);
      g.add(c);
      g.userData.pointLight = { x: 0.85, y: 4.2, color: MT.FFCF8A, intensity: 14, distance: 9 };
    }
    return g;
  };
  M.traffic_light = (o) => {
    const g = new T.Group();
    g.add(mesh(cyl(0.07, 0.07, 3.2, 8), MT.VALUE_2A2D33, 0, 1.6, 0));
    g.add(mesh(box(0.3, 0.9, 0.3), MT.VALUE_1A1A1A, 0, 3.4, 0));
    const k = Math.floor(((o.t || 0) / 4) % 3);
    [MT.FF3A2A, MT.FFC22A, MT.VALUE_3AD06A].forEach((c, i) => g.add(mesh(sph(0.09, 8), K.mat(c, { e: i === k ? c : MT.VALUE_000, ei: 2 }), 0.16, 3.7 - i * 0.28, 0, { cast: false })));
    return g;
  };
  M.bench = () => K.group(mesh(box(1.8, 0.08, 0.5), MT.VALUE_6A4A32, 0, 0.48, 0), mesh(box(1.8, 0.5, 0.06), MT.VALUE_6A4A32, 0, 0.78, -0.22), mesh(box(0.06, 0.48, 0.45), MT.VALUE_2A2A2A, -0.8, 0.24, 0), mesh(box(0.06, 0.48, 0.45), MT.VALUE_2A2A2A, 0.8, 0.24, 0));
  M.fence = (o) => {
    const g = new T.Group();
    for (let i = 0; i < 9; i++) g.add(mesh(box(0.08, 1.1, 0.08), o.color || MT.VALUE_6A5A4A, -2 + i * 0.5, 0.55, 0));
    g.add(mesh(box(4.2, 0.08, 0.05), o.color || MT.VALUE_6A5A4A, 0, 0.85, 0), mesh(box(4.2, 0.08, 0.05), o.color || MT.VALUE_6A5A4A, 0, 0.4, 0));
    return g;
  };
  M.power_pole = () => K.group(mesh(cyl(0.12, 0.15, 8, 8), MT.VALUE_5A4A3A, 0, 4, 0), mesh(box(0.1, 0.1, 1.8), MT.VALUE_5A4A3A, 0, 7.4, 0));
  M.phone_booth = () => K.group(mesh(box(1.0, 2.4, 1.0), MT.B8322A, 0, 1.2, 0), mesh(box(0.8, 1.6, 1.02), K.glass(false), 0, 1.3, 0));
  M.mailbox = () => K.group(mesh(cyl(0.05, 0.05, 1.0, 8), MT.VALUE_333, 0, 0.5, 0), mesh(box(0.45, 0.35, 0.3), MT.C4A42A, 0, 1.1, 0));
  M.signpost = () => K.group(mesh(cyl(0.05, 0.05, 2.6, 8), MT.VALUE_666, 0, 1.3, 0), mesh(box(0.05, 0.5, 0.9), MT.VALUE_2A6AD0, 0, 2.4, 0));
  M.cafe_table = () => K.group(mesh(cyl(0.4, 0.4, 0.04, 16), MT.E9E2CF, 0, 0.75, 0), mesh(cyl(0.04, 0.04, 0.75, 8), MT.VALUE_333, 0, 0.37, 0), mesh(cyl(0.02, 0.02, 2.2, 6), MT.VALUE_555, 0, 1.1, 0), mesh(cone(1.3, 0.5, 12), MT.B8322A, 0, 2.3, 0));
  M.bus_stop = () => K.group(mesh(box(3, 0.1, 1.4), MT.VALUE_3A4A5A, 0, 2.5, 0), mesh(box(3, 2.2, 0.05), K.mat(MT.AAC8DC, { t: 0.35 }), 0, 1.3, -0.6), mesh(box(2.2, 0.08, 0.4), MT.VALUE_6A4A32, 0, 0.5, -0.3));
  M.fire_hydrant = () => K.group(mesh(cyl(0.15, 0.17, 0.7, 12), MT.C4281F, 0, 0.35, 0), mesh(sph(0.15, 10), MT.C4281F, 0, 0.72, 0));
  M.trash_bin = (o) => mesh(cyl(0.3, 0.26, 1.0, 14), o.color || MT.VALUE_2A6A3A, 0, 0.5, 0);
  M.traffic_cone = () => K.group(mesh(cone(0.18, 0.7, 14), MT.F2701A, 0, 0.38, 0), mesh(box(0.45, 0.04, 0.45), MT.VALUE_222, 0, 0.02, 0));
  M.barrel = (o) => mesh(cyl(0.3, 0.3, 0.9, 14), o.color || MT.VALUE_3A5A7A, 0, 0.45, 0);
  M.crate = (o) => mesh(box(0.8, 0.8, 0.8), o.color || MT.A07A4A, 0, 0.4, 0);
  M.manhole = () => mesh(cyl(0.4, 0.4, 0.02, 20), MT.VALUE_2A2A2A, 0, 0.01, 0, { cast: false });
  M.flag = (o) => K.group(mesh(cyl(0.04, 0.04, 6, 8), MT.BBB, 0, 3, 0), mesh(box(1.4, 0.9, 0.02), o.color || MT.VALUE_2A3A8A, 0.72, 5.5, 0));
  M.fountain = () => K.group(mesh(cyl(2, 2.1, 0.6, 24), MT.CFC6B4, 0, 0.3, 0), mesh(cyl(1.8, 1.8, 0.05, 24), K.mat(MT.VALUE_6AA8C8, { r: 0.1 }), 0, 0.55, 0), mesh(cyl(0.2, 0.3, 1.6, 10), MT.CFC6B4, 0, 1.1, 0));
  M.billboard = (o) => K.group(mesh(cyl(0.15, 0.15, 3, 8), MT.VALUE_555, 0, 1.5, 0), mesh(box(4.2, 1.8, 0.15), o.color || MT.E8C34A, 0, 3.8, 0));
  const legs4 = (g, w, d, h, col, r = 0.03) => {
    for (const [x, z] of [
      [w / 2 - 0.05, d / 2 - 0.05],
      [-w / 2 + 0.05, d / 2 - 0.05],
      [w / 2 - 0.05, -d / 2 + 0.05],
      [-w / 2 + 0.05, -d / 2 + 0.05],
    ])
      g.add(mesh(cyl(r, r, h, 6), col, x, h / 2, z));
  };
  M.table = (o) => {
    const g = K.group(mesh(box(1.6, 0.06, 0.9), o.color || MT.VALUE_7A5236, 0, 0.75, 0));
    legs4(g, 1.6, 0.9, 0.72, MT.VALUE_4A3220);
    return g;
  };
  M.picnic_table = (o) => {
    const g = K.group(mesh(box(1.8, 0.05, 0.8), o.color || MT.VALUE_8A6A4A, 0, 0.74, 0), mesh(box(1.8, 0.04, 0.25), MT.VALUE_8A6A4A, 0, 0.45, 0.6), mesh(box(1.8, 0.04, 0.25), MT.VALUE_8A6A4A, 0, 0.45, -0.6));
    legs4(g, 1.6, 0.6, 0.72, MT.VALUE_5A4A3A);
    return g;
  };
  M.desk = (o) => {
    const g = K.group(mesh(box(1.5, 0.05, 0.75), o.color || MT.VALUE_6A4A32, 0, 0.76, 0), mesh(box(0.5, 0.7, 0.7), shade(o.color || MT.VALUE_6A4A32, -0.1), 0.45, 0.37, 0));
    legs4(g, 1.5, 0.75, 0.74, MT.VALUE_3A2A1E);
    return g;
  };
  M.school_desk = M.desk;
  M.chair = (o) => {
    const g = K.group(mesh(box(0.45, 0.05, 0.45), o.color || MT.VALUE_6A4A32, 0, 0.46, 0), mesh(box(0.05, 0.5, 0.45), o.color || MT.VALUE_6A4A32, -0.2, 0.72, 0));
    legs4(g, 0.45, 0.45, 0.45, MT.VALUE_3A2A1E, 0.02);
    return g;
  };
  M.sofa = (o) => K.group(mesh(box(2.0, 0.45, 0.85), o.color || MT.VALUE_7A3A32, 0, 0.3, 0), mesh(box(2.0, 0.6, 0.2), o.color || MT.VALUE_7A3A32, 0, 0.7, -0.33), mesh(box(0.2, 0.55, 0.85), shade(o.color || MT.VALUE_7A3A32, -0.1), -1.0, 0.45, 0), mesh(box(0.2, 0.55, 0.85), shade(o.color || MT.VALUE_7A3A32, -0.1), 1.0, 0.45, 0));
  M.bed = (o) => K.group(mesh(box(2.0, 0.4, 1.5), MT.VALUE_5A4232, 0, 0.2, 0), mesh(box(1.95, 0.2, 1.45), o.color || MT.E9E2D6, 0, 0.5, 0), mesh(box(0.5, 0.15, 1.2), MT.FFFFFF, -0.7, 0.66, 0));
  M.hospital_bed = (o) => K.group(mesh(box(2.0, 0.15, 0.95), MT.DFE4E8, 0, 0.62, 0), mesh(box(1.95, 0.12, 0.9), MT.FFFFFF, 0, 0.75, 0), mesh(box(0.05, 0.6, 0.95), MT.VALUE_9AA0A6, -1.0, 0.9, 0), mesh(cyl(0.02, 0.02, 0.6, 6), MT.VALUE_9AA0A6, 0.95, 0.3, 0.4), mesh(cyl(0.02, 0.02, 0.6, 6), MT.VALUE_9AA0A6, -0.95, 0.3, 0.4));
  M.air_mattress = (o) => mesh(cap(0.12, 1.7, 10), o.color || MT.VALUE_3A6AB0, 0, 0.12, 0, { rz: PI / 2, sz: 3.5 });
  M.bookshelf = (o) => {
    const g = K.group(mesh(box(1.4, 2.0, 0.4), o.color || MT.VALUE_5A3A24, 0, 1.0, 0));
    const r = U.rng(4);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) g.add(mesh(box(0.1, 0.32, 0.3), [MT.VALUE_8A2A2A, MT.VALUE_2A4A7A, MT.VALUE_3A6A3A, MT.C49A3A][Math.floor(r() * 4)], -0.55 + i * 0.13, 0.25 + j * 0.48, 0.06));
    return g;
  };
  M.wardrobe = (o) => mesh(box(1.2, 2.1, 0.6), o.color || MT.VALUE_7A5236, 0, 1.05, 0);
  M.fridge = () => mesh(box(0.8, 1.8, 0.7), MT.E9ECEE, 0, 0.9, 0);
  M.kitchen_stove = () => mesh(box(1.4, 0.9, 0.65), MT.D9D2C4, 0, 0.45, 0);
  M.safe_deposit_wall = (o) => {
    const w = (o.w || 600) * PX * 1.2,
      h = (o.h || 620) * PX * 1.2;
    const tex = K.canvasTex(MF.SDW(`${o.opened || 0}`, `${o.seed || 0}`), 512, 512, (g) => {
      g.fillStyle = MT.VALUE_8A8576;
      g.fillRect(0, 0, 512, 512);
      const r = U.rng(o.seed || 3);
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 10; i++) {
          const open = r() < (o.opened || 0);
          g.fillStyle = open ? MT.VALUE_1A1916 : r() < 0.5 ? MT.B7B09C : MT.C4BDA8;
          g.fillRect(i * 51 + 3, j * 32 + 3, 45, 26);
          g.fillStyle = MT.VALUE_6A6558;
          g.fillRect(i * 51 + 20, j * 32 + 14, 8, 4);
        }
    });
    return mesh(box(w, h, 0.4), new T.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.35 }), 0, h / 2, -0.2);
  };
  M.vault_door = (o) => {
    const g = new T.Group();
    g.add(mesh(box(4.2, 4.2, 0.3), MT.VALUE_5A5850, 0, 2.4, -0.2));
    const door = new T.Group();
    door.add(mesh(cyl(1.8, 1.8, 0.5, 40), K.mat(MT.B8BCC0, { m: 0.7, r: 0.35 }), 0, 0, 0, { rx: PI / 2 }));
    door.add(mesh(cyl(0.5, 0.5, 0.2, 24), K.mat(MT.VALUE_888C90, { m: 0.8, r: 0.3 }), 0, 0, 0.35, { rx: PI / 2 }));
    for (let i = 0; i < 4; i++) door.add(mesh(box(1.6, 0.12, 0.12), MT.D9DDE0, 0, 0, 0.5, { rz: (i * PI) / 4 }));
    door.position.set(0, 2.4, 0.05);
    if (o.open) door.rotation.y = -o.open * 1.6;
    g.add(door);
    return g;
  };
  M.prison_bars = () => {
    const g = new T.Group();
    for (let i = 0; i < 12; i++) g.add(mesh(cyl(0.03, 0.03, 2.6, 6), MT.VALUE_3A3D43, -1.65 + i * 0.3, 1.3, 0));
    g.add(mesh(box(3.6, 0.08, 0.08), MT.VALUE_3A3D43, 0, 2.6, 0), mesh(box(3.6, 0.08, 0.08), MT.VALUE_3A3D43, 0, 1.2, 0));
    return g;
  };
  M.gold_bars = () => {
    const g = new T.Group();
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) g.add(mesh(box(0.25, 0.07, 0.12), K.mat(MT.E3B440, { m: 0.9, r: 0.25 }), -0.4 + i * 0.27 + j * 0.13, 0.04 + j * 0.075, 0));
    return g;
  };
  M.cash_stack = () => {
    const g = new T.Group();
    for (let i = 0; i < 5; i++) g.add(mesh(box(0.16, 0.05, 0.07), MT.VALUE_6A9A5A, 0, 0.03 + i * 0.05, 0, { ry: i * 0.1 }));
    return g;
  };
  M.duffel_bag = (o) => mesh(cap(0.22, 0.5, 10), o.color || MT.VALUE_3B4A3A, 0, 0.22, 0, { rz: PI / 2 });
  M.money_bag = (o) => mesh(sph(0.3, 14), o.color || MT.A8895A, 0, 0.3, 0, { sy: 1.2 });
  M.briefcase = () => mesh(box(0.45, 0.32, 0.1), MT.VALUE_3A2A1E, 0, 0.16, 0);
  M.suitcase = (o) => mesh(box(0.5, 0.7, 0.25), o.color || MT.VALUE_3A4A6A, 0, 0.35, 0);
  M.toolbox = () => mesh(box(0.5, 0.25, 0.25), MT.C4281F, 0, 0.13, 0);
  M.gas_tank = () => K.group(mesh(cyl(0.16, 0.16, 1.2, 12), MT.VALUE_2A5A3A, 0, 0.6, 0), mesh(cyl(0.05, 0.05, 0.15, 8), MT.VALUE_888, 0, 1.25, 0));
  M.ladder = () => {
    const g = K.group(mesh(box(0.05, 3, 0.05), MT.A07A4A, 0, 1.5, 0.25), mesh(box(0.05, 3, 0.05), MT.A07A4A, 0, 1.5, -0.25));
    for (let i = 0; i < 9; i++) g.add(mesh(box(0.04, 0.04, 0.5), MT.A07A4A, 0, 0.3 + i * 0.32, 0));
    g.rotation.z = 0.2;
    return g;
  };
  M.rubble = (o) => {
    const g = new T.Group();
    const r = U.rng(o.seed || 2);
    for (let i = 0; i < 9; i++)
      g.add(
        mesh(
          K.geo(MT.ROCK, () => new T.DodecahedronGeometry(0.6, 0)),
          mat(MT.VALUE_6A6258, { flat: true }),
          -0.6 + r() * 1.2,
          0.1,
          -0.4 + r() * 0.8,
          { s: 0.2 + r() * 0.3 },
        ),
      );
    return g;
  };
  M.pipe = () => mesh(cyl(0.2, 0.2, 4, 14), MT.VALUE_6A6E72, 0, 0.2, 0, { rz: PI / 2 });
  M.window = (o) => K.group(mesh(box(1.4, 1.6, 0.08), MT.E9E2D6, 0, 1.8, -0.05), mesh(box(1.2, 1.4, 0.1), K.mat(o.night ? MT.VALUE_1A2230 : MT.BCD6E8, { e: o.night ? MT.VALUE_000 : MT.VALUE_5A7A9A, ei: 0.4 }), 0, 1.8, 0));
  M.door = () => mesh(box(1.0, 2.2, 0.12), MT.VALUE_5A3A2A, 0, 1.1, 0);
  M.tv_old = () => K.group(mesh(box(0.6, 0.5, 0.45), MT.VALUE_3A2A22, 0, 0.25, 0), mesh(box(0.02, 0.36, 0.4), K.mat(MT.VALUE_2A3A3A, { e: MT.VALUE_406060, ei: 0.6 }), 0.31, 0.27, 0));
  M.computer = () => K.group(mesh(box(0.06, 0.4, 0.55), MT.VALUE_2A2D33, 0, 0.3, 0), mesh(box(0.02, 0.34, 0.48), K.mat(MT.VALUE_4A7AB0, { e: MT.VALUE_4A7AB0, ei: 0.8 }), 0.04, 0.3, 0));
  M.laptop = () => K.group(mesh(box(0.32, 0.02, 0.24), MT.VALUE_9AA0A6, 0, 0.01, 0), mesh(box(0.01, 0.22, 0.24), K.mat(MT.VALUE_4A7AB0, { e: MT.VALUE_4A7AB0, ei: 0.8 }), -0.16, 0.12, 0, { rz: -0.2 }));
  M.camera_tripod = () => {
    const g = K.group(mesh(box(0.2, 0.15, 0.12), MT.VALUE_1A1A1A, 0, 1.5, 0));
    for (let i = 0; i < 3; i++) g.add(mesh(cyl(0.015, 0.015, 1.5, 6), MT.VALUE_333, Math.cos(i * 2.1) * 0.25, 0.72, Math.sin(i * 2.1) * 0.25, { rz: Math.cos(i * 2.1) * 0.3, rx: -Math.sin(i * 2.1) * 0.3 }));
    return g;
  };
  M.studio_light = (o) => {
    const g = K.group(mesh(cyl(0.02, 0.02, 2, 6), MT.VALUE_333, 0, 1, 0), mesh(box(0.5, 0.5, 0.1), K.mat(MT.FFFFFF, { e: MT.FFF4E0, ei: o.night ? 2 : 0.6 }), 0, 2.1, 0, { ry: -0.6 }));
    return g;
  };
  M.plant_pot = (o) => K.group(mesh(cyl(0.18, 0.14, 0.35, 12), MT.A85A32, 0, 0.17, 0), mesh(ico(0.35, 1), mat(o.color || MT.VALUE_4A7A3A, { flat: true }), 0, 0.55, 0));
  M.wine_bottle = () => K.group(mesh(cyl(0.04, 0.04, 0.22, 10), MT.VALUE_2A4A2A, 0, 0.11, 0), mesh(cyl(0.015, 0.03, 0.1, 8), MT.VALUE_2A4A2A, 0, 0.27, 0));
  M.candle = (o) => K.group(mesh(cyl(0.03, 0.03, 0.18, 10), MT.F2EAD8, 0, 0.09, 0), mesh(sph(0.02, 8), K.mat(MT.FFCF6A, { e: MT.FFB040, ei: 3 }), 0, 0.2, 0, { cast: false }));
  M.alarm_clock = () => K.group(mesh(cyl(0.12, 0.12, 0.08, 20), MT.C4281F, 0, 0.14, 0, { rx: PI / 2 }), mesh(cyl(0.1, 0.1, 0.09, 20), MT.F4F2EA, 0, 0.14, 0.005, { rx: PI / 2 }), mesh(sph(0.05, 10), MT.D4D4D4, -0.07, 0.27, 0), mesh(sph(0.05, 10), MT.D4D4D4, 0.07, 0.27, 0));
  K.asset = (id, params = {}) => {
    if (K.assetHook) {
      const real = K.assetHook(id, params);
      if (real) return real;
    }
    const make = M[id];
    let obj = null;
    if (make) {
      try {
        obj = make(params || {});
      } catch (e) {
        if (typeof console !== MT.UNDEFINED) console.warn(MT.MOTION3D_MODEL_FAILED, id, e);
      }
    }
    if (!obj) obj = K.cardFrom2D(id, params);
    if (obj) obj.userData.assetId = id;
    return obj;
  };
  K.has3D = (id) => !!M[id];
  K.animate = (obj, t, distance) => {
    obj.traverse((o) => {
      if (o.userData.wheel) o.rotation.z = -(distance || 0) / o.userData.wheel;
      if (o.userData.spin) o.rotation.x = t * o.userData.spin;
      if (o.userData.spinY) o.rotation.y = t * o.userData.spinY;
      if (o.userData.spinX) o.rotation.x = t * o.userData.spinX;
    });
    if (obj.userData.sway) obj.rotation.z = Math.sin(t * 1.3 + (obj.userData.seed || 0)) * obj.userData.sway;
    if (obj.userData.bob) obj.position.y = Math.sin(t * 1.6) * obj.userData.bob;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
