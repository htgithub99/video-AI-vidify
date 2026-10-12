(function (root) {
  "use strict";
  const MT = root.MotionEngineText;
  const ME = root.MotionEngine;
  const U = ME.util;
  const GEN = ME.GEN;
  const T = GEN.T;
  if (!T) return;
  const X = GEN.X;
  const MQ = (GEN.MQ = { ready: false, base: "", clips: {}, loading: null });
  const FILES = { male: MT.MANNEQUIN_MALE_GLB, female: MT.MANNEQUIN_FEMALE_GLB, ual1: MT.MANNEQUIN_ANIMS_UAL1_GLB };
  const SIDE = { l: MT.L_2, r: MT.R };
  const MAP = { root: MT.ROOT, [MT.DEF_HIPS]: MT.PELVIS, [MT.DEF_SPINE001]: MT.SPINE_01, [MT.DEF_SPINE002]: MT.SPINE_02, [MT.DEF_SPINE003]: MT.SPINE_03, [MT.DEF_NECK]: MT.NECK_01, [MT.DEF_HEAD]: MT.HEAD_2 };
  for (const s of [MT.L_3, MT.R_2]) {
    const S = SIDE[s];
    MAP[MT.DEF_SHOULDER + S] = MT.CLAVICLE + s;
    MAP[MT.DEF_UPPER_ARM + S] = MT.UPPERARM + s;
    MAP[MT.DEF_FOREARM + S] = MT.LOWERARM + s;
    MAP[MT.DEF_HAND + S] = MT.HAND + s;
    for (const f of [MT.INDEX, MT.MIDDLE, MT.PINKY, MT.RING]) for (const k of [MT.VALUE_01, MT.VALUE_02, MT.VALUE_03]) MAP[MT.DEF_F + f + k + S] = f + MT.SYMBOL_10 + k + MT.SYMBOL_10 + s;
    for (const k of [MT.VALUE_01, MT.VALUE_02, MT.VALUE_03]) MAP[MT.DEF_THUMB + k + S] = MT.THUMB + k + MT.SYMBOL_10 + s;
    MAP[MT.DEF_THIGH + S] = MT.THIGH_2 + s;
    MAP[MT.DEF_SHIN + S] = MT.CALF + s;
    MAP[MT.DEF_FOOT + S] = MT.FOOT + s;
    MAP[MT.DEF_TOE + S] = MT.BALL + s;
  }
  const loadGLB = (url) => new Promise((res, rej) => { const L = new X.GLTFLoader(); if (X.MeshoptDecoder) L.setMeshoptDecoder(X.MeshoptDecoder); L.load(url, res, undefined, (e) => rej(new Error(MT.MANNEQUIN_LOAD_FAILED + url + MT.SYMBOL_3 + (e && e.message ? e.message : e)))); });
  GEN.loadMannequin = (base) => {
    if (MQ.ready && MQ.base === base) return Promise.resolve(MQ);
    if (MQ.loading && MQ.base === base) return MQ.loading;
    MQ.base = base;
    MQ.loading = (async () => {
      const [male, female, ual1] = await Promise.all([loadGLB(base + FILES.male), loadGLB(base + FILES.female), loadGLB(base + FILES.ual1)]);
      MQ.male = male;
      MQ.female = female;
      MQ.ual1 = ual1;
      MQ.ual2Clips = {};
      for (const c of male.animations) MQ.ual2Clips[c.name] = c;
      MQ.ual1Clips = {};
      for (const c of ual1.animations) MQ.ual1Clips[c.name] = c;
      male.scene.updateMatrixWorld(true);
      ual1.scene.updateMatrixWorld(true);
      MQ.rest = restInfo(male.scene);
      MQ.restF = restInfo(female.scene);
      MQ.ready = true;
      return MQ;
    })();
    MQ.loading.catch(() => {
      MQ.loading = null;
    });
    return MQ.loading;
  };
  const restInfo = (scene) => {
    const info = { bones: {}, order: [] };
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isBone && o.name !== MT.ROOT) return;
      const wq = new T.Quaternion(), wp = new T.Vector3();
      o.getWorldQuaternion(wq);
      o.getWorldPosition(wp);
      info.bones[o.name] = { wq, wp, lq: o.quaternion.clone(), lp: o.position.clone(), ls: o.scale.clone(), parent: o.parent ? o.parent.name : null };
      info.order.push(o.name);
    });
    return info;
  };
  const bakeUal1 = (name) => {
    const src = MQ.ual1;
    const clip = MQ.ual1Clips[name];
    if (!clip) return null;
    const scene = src.scene;
    const rest = MQ.rest;
    const srcRest = {};
    scene.traverse((o) => {
      if (MAP[o.name]) { const q = new T.Quaternion(); o.getWorldQuaternion(q); srcRest[o.name] = q; }
    });
    const mixer = new T.AnimationMixer(scene);
    const action = mixer.clipAction(clip);
    action.play();
    const fps = 30;
    const n = Math.max(2, Math.round(clip.duration * fps) + 1);
    const times = new Float32Array(n);
    const tgtNames = rest.order;
    const inv = {};
    for (const k of Object.keys(MAP)) inv[MAP[k]] = k;
    const qv = {}, pelvisPos = new Float32Array(n * 3), rootPos = new Float32Array(n * 3);
    for (const b of tgtNames) if (inv[b]) qv[b] = new Float32Array(n * 4);
    const srcNodes = {};
    scene.traverse((o) => {
      if (MAP[o.name]) srcNodes[o.name] = o;
    });
    const tmpQ = new T.Quaternion(), tmpP = new T.Vector3(), worldNow = {}, rootM = new T.Matrix4(), invRoot = new T.Matrix4();
    for (let i = 0; i < n; i++) {
      const t = Math.min(clip.duration, i / fps);
      times[i] = t;
      mixer.setTime(t);
      scene.updateMatrixWorld(true);
      for (const b of tgtNames) {
        const R = rest.bones[b];
        const parentW = R.parent && worldNow[R.parent] ? worldNow[R.parent] : new T.Quaternion();
        const sName = inv[b];
        let w;
        if (sName && srcNodes[sName]) { srcNodes[sName].getWorldQuaternion(tmpQ); w = tmpQ.clone().multiply(srcRest[sName].clone().invert()).multiply(R.wq); const local = parentW.clone().invert().multiply(w); qv[b].set([local.x, local.y, local.z, local.w], i * 4); } else w = parentW.clone().multiply(R.lq);
        worldNow[b] = w;
      }
      const sr = srcNodes.root;
      rootPos.set([sr.position.x, sr.position.y, sr.position.z], i * 3);
      rootM.compose(sr.position, new T.Quaternion().fromArray(qv.root.subarray(i * 4, i * 4 + 4)), rest.bones.root.ls);
      invRoot.copy(rootM).invert();
      srcNodes[MT.DEF_HIPS].getWorldPosition(tmpP);
      tmpP.applyMatrix4(invRoot);
      pelvisPos.set([tmpP.x, tmpP.y, tmpP.z], i * 3);
    }
    mixer.stopAllAction();
    mixer.uncacheRoot(scene);
    const tracks = [];
    for (const b of Object.keys(qv)) tracks.push(new T.QuaternionKeyframeTrack(b + MT.QUATERNION, times, qv[b]));
    tracks.push(new T.VectorKeyframeTrack(MT.PELVIS_POSITION, times, pelvisPos));
    tracks.push(new T.VectorKeyframeTrack(MT.ROOT_POSITION, times, rootPos));
    return new T.AnimationClip(name, clip.duration, tracks);
  };
  const inPlace = (clip) => { for (const tr of clip.tracks) { if (tr.name !== MT.ROOT_POSITION) continue; const v = tr.values; for (let i = 0; i < v.length; i += 3) { v[i] = 0; v[i + 1] = 0; } } return clip; };
  GEN.clipFor = (actionId) => {
    const A = GEN.ACTIONS[actionId] || GEN.ACTIONS.idle;
    const key = A.src + MT.SYMBOL_15 + A.clip;
    if (MQ.clips[key]) return MQ.clips[key];
    let clip = null;
    if (A.src === MT.UAL2) { const c = MQ.ual2Clips[A.clip]; if (c) clip = c.clone(); } else clip = bakeUal1(A.clip);
    if (!clip) clip = MQ.clips[MT.UAL1_IDLE_LOOP] || bakeUal1(MT.IDLE_LOOP);
    clip = inPlace(clip);
    MQ.clips[key] = clip;
    return clip;
  };
  GEN.prebake = (actionIds) => {
    for (const id of actionIds) GEN.clipFor(id);
  };
  const domBone = (geo, skeleton) => { const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight; const out = new Int16Array(si.count); for (let i = 0; i < si.count; i++) { let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } } out[i] = best; } return out; };
  const SEG_CHILD = {
    pelvis: MT.SPINE_01,
    spine_01: MT.SPINE_02,
    spine_02: MT.SPINE_03,
    spine_03: MT.NECK_01,
    neck_01: MT.HEAD_2,
    clavicle_l: MT.UPPERARM_L,
    clavicle_r: MT.UPPERARM_R,
    upperarm_l: MT.LOWERARM_L,
    upperarm_r: MT.LOWERARM_R,
    lowerarm_l: MT.HAND_L,
    lowerarm_r: MT.HAND_R,
    hand_l: MT.MIDDLE_01_L,
    hand_r: MT.MIDDLE_01_R,
    thigh_l: MT.CALF_L,
    thigh_r: MT.CALF_R,
    calf_l: MT.FOOT_L,
    calf_r: MT.FOOT_R,
    foot_l: MT.BALL_L,
    foot_r: MT.BALL_R,
  };
  const FINGERS = [MT.INDEX, MT.MIDDLE, MT.PINKY, MT.RING, MT.THUMB_2];
  const both = (rules) => { const out = []; for (const r of rules) { if (r[0].endsWith(MT.X)) { out.push([r[0].replace(MT.X, MT.L_4)].concat(r.slice(1))); out.push([r[0].replace(MT.X, MT.R_3)].concat(r.slice(1))); } else out.push(r); } return out; };
  const ALL = [-9, 9];
  const TORSO = [ [MT.SPINE_01, -9, 9, { yminRel: [MT.PELVIS, 0.06] }], [MT.SPINE_02, ...ALL], [MT.SPINE_03, ...ALL], [MT.CLAVICLE_X, ...ALL], [MT.NECK_01, -9, 0.25], ];
  const regionRules = (layer) => {
    const k = layer.kind;
    const sleeves = layer.sleeves || (k === MT.TSHIRT || k === MT.POLO ? MT.SHORT : k === MT.TANK || k === MT.VEST ? MT.NONE : MT.LONG);
    const arm = sleeves === MT.NONE ? [] : sleeves === MT.SHORT ? [[MT.UPPERARM_X, -9, 0.62]] : [ [MT.UPPERARM_X, ...ALL], [MT.LOWERARM_X, -9, 0.97], ];
    const untucked = layer.style === MT.UNTUCKED || k === MT.SWEATER || k === MT.HOODIE || k === MT.POLO;
    const hip = untucked ? [ [MT.PELVIS, -9, 9, { yminRel: [MT.PELVIS, -0.06] }], [MT.SPINE_01, ...ALL], ] : [];
    const coatLen = layer.length === MT.KNEE || layer.length === MT.LONG ? 0.62 : layer.length === MT.THIGH ? 0.35 : 0;
    switch (k) {
      case MT.TSHIRT:
      case MT.SHIRT:
      case MT.POLO:
      case MT.SWEATER:
      case MT.HOODIE:
      case MT.UNIFORM_TOP:
        return both([...TORSO, ...arm, ...hip]);
      case MT.TANK:
        return both([ [MT.SPINE_01, -9, 9, { yminRel: [MT.PELVIS, 0.06] }], [MT.SPINE_02, ...ALL], [MT.SPINE_03, ...ALL], ]);
      case MT.VEST:
        return both([...TORSO, [MT.PELVIS, -9, 9, { yminRel: [MT.PELVIS, 0.0] }]]);
      case MT.JACKET:
      case MT.BLAZER:
      case MT.COAT:
        return both([...TORSO, ...arm, [MT.PELVIS, -9, 9, { yminRel: [MT.PELVIS, coatLen ? -0.3 : -0.08] }], [MT.SPINE_01, ...ALL], ...(coatLen ? [[MT.THIGH_X, -9, coatLen]] : [])]);
      case MT.DRESS:
        return both([...TORSO, ...arm, [MT.SPINE_01, ...ALL], [MT.PELVIS, ...ALL]]);
      case MT.TROUSERS:
      case MT.JEANS:
        return both([ [MT.PELVIS, ...ALL], [MT.SPINE_01, -9, 9, { ymaxRel: [MT.PELVIS, 0.1] }], [MT.THIGH_X, ...ALL], [MT.CALF_X, -9, layer.length === MT.SHORT ? 0.6 : 0.95], ]);
      case MT.SHORTS:
        return both([ [MT.PELVIS, ...ALL], [MT.SPINE_01, -9, 9, { ymaxRel: [MT.PELVIS, 0.1] }], [MT.THIGH_X, -9, layer.length === MT.LONG ? 0.85 : 0.55], ]);
      case MT.SKIRT:
        return [];
      case MT.SHOES:
      case MT.SNEAKERS:
        return both([ [MT.FOOT_X, ...ALL], [MT.BALL_X, ...ALL], [MT.BALL_LEAF_X, ...ALL], [MT.CALF_X, 0.94, 9], ]);
      case MT.BOOTS:
        return both([ [MT.FOOT_X, ...ALL], [MT.BALL_X, ...ALL], [MT.BALL_LEAF_X, ...ALL], [MT.CALF_X, layer.length === MT.SHORT ? 0.8 : 0.45, 9], ]);
      case MT.SOCKS:
        return both([ [MT.FOOT_X, ...ALL], [MT.BALL_X, ...ALL], [MT.CALF_X, 0.75, 9], ]);
      case MT.GLOVES: {
        const r = [ [MT.HAND_X, ...ALL], [MT.LOWERARM_X, 0.93, 9], ];
        for (const f of FINGERS) for (const n of [MT.VALUE_01, MT.VALUE_02, MT.VALUE_03, MT.VALUE_04_LEAF]) r.push([f + MT.SYMBOL_10 + n + MT.X, ...ALL]);
        return both(r);
      }
      case MT.HAIR: {
        const st = layer.style || MT.SHORT;
        const cut = st === MT.BUZZ ? 0.185 : st === MT.BALD ? 99 : 0.165;
        const r = [[MT.HEAD_2, -9, 9, { yminRel: [MT.HEAD_2, cut] }]];
        if (st !== MT.BALD) r.push([MT.HEAD_2, -9, 9, { zmaxRel: [MT.HEAD_2, 0.04], yminRel: [MT.HEAD_2, st === MT.BUZZ ? 0.14 : 0.12] }]);
        if (st === MT.BOB || st === MT.LONG || st === MT.PONYTAIL || st === MT.BUN) r.push([MT.HEAD_2, -9, 9, { zmaxRel: [MT.HEAD_2, -0.02], yminRel: [MT.HEAD_2, st === MT.BOB || st === MT.LONG ? -0.02 : 0.05] }]); else r.push([MT.HEAD_2, -9, 9, { zmaxRel: [MT.HEAD_2, -0.03], yminRel: [MT.HEAD_2, 0.06] }]);
        return r;
      }
      case MT.CAP:
      case MT.BEANIE:
        return [[MT.HEAD_2, -9, 9, { yminRel: [MT.HEAD_2, k === MT.CAP ? 0.13 : 0.11] }]];
      case MT.BELT:
        return both([ [MT.PELVIS, -9, 9, { yminRel: [MT.PELVIS, 0.06], ymaxRel: [MT.PELVIS, 0.115] }], [MT.SPINE_01, -9, 9, { yminRel: [MT.PELVIS, 0.06], ymaxRel: [MT.PELVIS, 0.115] }], ]);
    }
    return [];
  };
  const THICK = { tshirt: 0.009, shirt: 0.01, polo: 0.01, uniform_top: 0.011, sweater: 0.014, hoodie: 0.017, tank: 0.009, vest: 0.02, jacket: 0.022, blazer: 0.02, coat: 0.027, dress: 0.011, trousers: 0.012, jeans: 0.013, shorts: 0.013, shoes: 0.016, sneakers: 0.018, boots: 0.02, socks: 0.007, gloves: 0.006, hair: 0.014, cap: 0.016, beanie: 0.02, belt: 0.024 };
  const PATTERN_ID = { plain: 0, stripes: 1, check: 2, denim: 3, knit: 4, leather: 5, camo: 6, dots: 7 };
  const clothMaterial = (layer, style) => {
    const pat = PATTERN_ID[layer.pattern] || (layer.kind === MT.JEANS ? 3 : 0);
    const params = { color: new T.Color(layer.color), roughness: pat === 5 ? 0.38 : Math.max(0.72, layer.roughness == null ? 0.85 : layer.roughness), metalness: 0 };
    const mat = layer.kind === MT.HAIR ? new T.MeshStandardMaterial(Object.assign(params, { roughness: 0.55 })) : pat === 5 || layer.kind === MT.BOOTS || layer.kind === MT.SHOES ? new T.MeshPhysicalMaterial(Object.assign(params, { clearcoat: 0.35, clearcoatRoughness: 0.4 })) : new T.MeshStandardMaterial(params);
    const c2 = new T.Color(layer.color2 || (pat === 3 ? MT.VALUE_9FB3C8 : pat === 6 ? MT.VALUE_3E4A32 : MT.F0F0F0));
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uPat = { value: pat };
      sh.uniforms.uC2 = { value: c2 };
      sh.vertexShader = MT.ATTRIBUTE_VEC3_AREST_VARYING_VEC3_VREST + sh.vertexShader.replace(MT.INCLUDE_BEGIN_VERTEX, MT.INCLUDE_BEGIN_VERTEX_VREST_AREST);
      sh.fragmentShader = MT.UNIFORM_INT_UPAT_UNIFORM_VEC3_UC2_VARYING + sh.fragmentShader.replace(MT.INCLUDE_COLOR_FRAGMENT, MT.INCLUDE_COLOR_FRAGMENT_FLOAT_M_0_0);
    };
    mat.customProgramCacheKey = () => MT.CLOTH + pat;
    return mat;
  };
  const buildShell = (srcMesh, rules, rest, thickness, mat, name, paint) => {
    const geo = srcMesh.geometry;
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    const dom = domBone(geo, srcMesh.skeleton);
    const boneNames = srcMesh.skeleton.bones.map((b) => b.name);
    const bind = srcMesh.bindMatrix;
    const wv = new T.Vector3();
    const n = pos.count;
    const world = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      wv.fromBufferAttribute(pos, i);
      srcMesh.applyBoneTransform(i, wv);
      wv.applyMatrix4(srcMesh.matrixWorld);
      world[i * 3] = wv.x;
      world[i * 3 + 1] = wv.y;
      world[i * 3 + 2] = wv.z;
    }
    const keep = new Uint8Array(n);
    const bp = (name) => rest.bones[name] && rest.bones[name].wp;
    for (const r of rules) {
      const bi = boneNames.indexOf(r[0]);
      if (bi < 0) continue;
      const a = bp(r[0]);
      const childName = SEG_CHILD[r[0]];
      const b = childName ? bp(childName) : null;
      const opt = r[3] || {};
      const ab = b ? new T.Vector3().subVectors(b, a) : null;
      const len2 = ab ? Math.max(1e-6, ab.lengthSq()) : 1;
      for (let i = 0; i < n; i++) {
        if (dom[i] !== bi) continue;
        const x = world[i * 3], y = world[i * 3 + 1], z = world[i * 3 + 2];
        if (ab) { const t = ((x - a.x) * ab.x + (y - a.y) * ab.y + (z - a.z) * ab.z) / len2; if (t < r[1] || t > r[2]) continue; }
        if (opt.yminRel && y < bp(opt.yminRel[0]).y + opt.yminRel[1]) continue;
        if (opt.ymaxRel && y > bp(opt.ymaxRel[0]).y + opt.ymaxRel[1]) continue;
        if (opt.zmaxRel && z > bp(opt.zmaxRel[0]).z + opt.zmaxRel[1]) continue;
        keep[i] = 1;
      }
    }
    const idx = geo.index ? geo.index.array : null;
    const triCount = idx ? idx.length / 3 : n / 3;
    const tris = [];
    for (let t = 0; t < triCount; t++) {
      const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2;
      if (keep[a] + keep[b] + keep[c] >= 1) tris.push(a, b, c);
    }
    if (!tris.length) return null;
    if (paint) { const col = paint.geometry.attributes.color; for (let i = 0; i < tris.length; i++) col.setXYZ(tris[i], paint.color.r, paint.color.g, paint.color.b); col.needsUpdate = true; }
    const scale = new T.Vector3();
    bind.decompose(new T.Vector3(), new T.Quaternion(), scale);
    const local = thickness / (scale.x || 1);
    const remap = new Map();
    const P = [], N = [], R = [], SI = [], SW = [], I = [];
    const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    const v = new T.Vector3(), nn = new T.Vector3();
    for (const id of tris) {
      let k = remap.get(id);
      if (k == null) {
        k = remap.size;
        remap.set(id, k);
        v.fromBufferAttribute(pos, id);
        nn.fromBufferAttribute(nor, id).normalize();
        P.push(v.x + nn.x * local, v.y + nn.y * local, v.z + nn.z * local);
        N.push(nn.x, nn.y, nn.z);
        R.push(world[id * 3], world[id * 3 + 1], world[id * 3 + 2]);
        SI.push(si.getComponent(id, 0), si.getComponent(id, 1), si.getComponent(id, 2), si.getComponent(id, 3));
        SW.push(sw.getComponent(id, 0), sw.getComponent(id, 1), sw.getComponent(id, 2), sw.getComponent(id, 3));
      }
      I.push(k);
    }
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.Float32BufferAttribute(P, 3));
    g.setAttribute(MT.NORMAL, new T.Float32BufferAttribute(N, 3));
    g.setAttribute(MT.AREST, new T.Float32BufferAttribute(R, 3));
    g.setAttribute(MT.SKININDEX, new T.Uint16BufferAttribute(SI, 4));
    g.setAttribute(MT.SKINWEIGHT, new T.Float32BufferAttribute(SW, 4));
    g.setIndex(I);
    const m = new T.SkinnedMesh(g, mat);
    m.name = name;
    m.position.copy(srcMesh.position);
    m.quaternion.copy(srcMesh.quaternion);
    m.scale.copy(srcMesh.scale);
    m.bind(srcMesh.skeleton, srcMesh.bindMatrix);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    m.userData.keep = keep;
    m.userData.tris = tris;
    m.userData.remap = remap;
    return m;
  };
  const cullCovered = (inner, keep) => {
    const src = inner.userData.tris, rm = inner.userData.remap;
    const left = [], I = [];
    for (let t = 0; t < src.length; t += 3) {
      const a = src[t], b = src[t + 1], c = src[t + 2];
      if (keep[a] && keep[b] && keep[c]) continue;
      left.push(a, b, c);
      I.push(rm.get(a), rm.get(b), rm.get(c));
    }
    inner.userData.tris = left;
    inner.geometry.setIndex(I);
    inner.visible = I.length > 0;
  };
  const SOCKET_DEF = {
    head: [MT.HEAD_2, [0, 0.12, 0.0]],
    face: [MT.HEAD_2, [0, 0.1, 0.105]],
    neck: [MT.NECK_01, [0, 0.02, 0.02]],
    chest: [MT.SPINE_03, [0, 0.04, 0.11]],
    back: [MT.SPINE_03, [0, 0.02, -0.13]],
    waist: [MT.PELVIS, [0, 0.09, 0.0]],
    forearm_r: [MT.LOWERARM_R, [0, 0, 0]],
    forearm_l: [MT.LOWERARM_L, [0, 0, 0]],
    upperarm_r: [MT.UPPERARM_R, [0, 0, 0]],
    upperarm_l: [MT.UPPERARM_L, [0, 0, 0]],
    thigh_r: [MT.THIGH_R, [0, 0, 0]],
    thigh_l: [MT.THIGH_L, [0, 0, 0]],
    calf_r: [MT.CALF_R, [0, 0, 0]],
    calf_l: [MT.CALF_L, [0, 0, 0]],
    foot_r: [MT.FOOT_R, [0, 0, 0]],
    foot_l: [MT.FOOT_L, [0, 0, 0]],
    hand_r: [MT.HAND_R, [0, 0, 0]],
    hand_l: [MT.HAND_L, [0, 0, 0]],
  };
  const handBasis = (rest, side) => {
    const h = rest.bones[MT.HAND + side].wp, mid = rest.bones[MT.MIDDLE_01 + side].wp;
    const y = new T.Vector3().subVectors(mid, h).normalize();
    const z = new T.Vector3(0, -1, 0);
    const x = new T.Vector3().crossVectors(y, z).normalize();
    z.crossVectors(x, y).normalize();
    const m = new T.Matrix4().makeBasis(x, y, z);
    const q = new T.Quaternion().setFromRotationMatrix(m);
    const p = h.clone().addScaledVector(y, 0.075).addScaledVector(z, 0.025);
    return { q, p };
  };
  const addSocket = (model, rest, bones, socket, bodyPart = false) => {
    let boneName, off, restQ;
    if (!bodyPart && (socket === MT.HAND_R || socket === MT.HAND_L)) {
      const side = socket.slice(-1);
      boneName = MT.HAND + side;
      const hb = handBasis(rest, side);
      restQ = hb.q;
      off = hb.p;
    } else {
      const d = SOCKET_DEF[socket] || SOCKET_DEF.chest;
      boneName = d[0];
      restQ = new T.Quaternion();
      off = rest.bones[boneName].wp.clone().add(new T.Vector3(d[1][0], d[1][1], d[1][2]));
      if (bodyPart) {
        const next = { upperarm_r: MT.LOWERARM_R, upperarm_l: MT.LOWERARM_L, forearm_r: MT.HAND_R, forearm_l: MT.HAND_L, hand_r: MT.MIDDLE_01_R, hand_l: MT.MIDDLE_01_L, thigh_r: MT.CALF_R, thigh_l: MT.CALF_L, calf_r: MT.FOOT_R, calf_l: MT.FOOT_L }[socket];
        if (next && rest.bones[next]) { const direction = rest.bones[next].wp.clone().sub(rest.bones[boneName].wp).normalize(); restQ.setFromUnitVectors(new T.Vector3(0, -1, 0), direction); }
      }
    }
    const bone = bones[boneName];
    const R = rest.bones[boneName];
    const s = new T.Object3D();
    const invBone = R.wq.clone().invert();
    s.quaternion.copy(invBone.clone().multiply(restQ));
    s.position.copy(off.clone().sub(R.wp).applyQuaternion(invBone));
    const bs = new T.Vector3();
    bone.matrixWorld.decompose(new T.Vector3(), new T.Quaternion(), bs);
    if (bs.x && Math.abs(bs.x - 1) > 1e-3) { s.position.divideScalar(bs.x); s.scale.setScalar(1 / bs.x); }
    bone.add(s);
    return s;
  };
  const skirtMesh = (layer, rest, mat) => {
    const len = { mini: 0.28, short: 0.3, knee: 0.48, midi: 0.62, long: 0.82, ankle: 0.86 }[layer.length || MT.KNEE] || 0.48;
    const top = 0.17, bot = 0.17 + len * 0.42;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      pts.push(new T.Vector2(U.lerp(top, bot, Math.pow(k, 0.85)), -k * len));
    }
    const g = new T.LatheGeometry(pts, 40);
    g.scale(1, 1, 0.8);
    const R = [];
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) R.push(pos.getX(i), pos.getY(i) + 1, pos.getZ(i));
    g.setAttribute(MT.AREST, new T.Float32BufferAttribute(R, 3));
    const m = new T.Mesh(g, mat);
    mat.side = T.DoubleSide;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const bodyMaterial = (style, main) => {
    const col = new T.Color((style && style.skin) || MT.EBE8E3);
    const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
    if (lum < 0.58) col.lerp(new T.Color(MT.E9EAEC), 0.72);
    if (!main) col.multiplyScalar(0.9);
    const gloss = U.clamp(style && style.gloss != null ? style.gloss : 0.28, 0.15, 0.42);
    return new T.MeshPhysicalMaterial({ color: col, vertexColors: true, roughness: U.lerp(0.75, 0.22, gloss), metalness: 0, clearcoat: gloss, clearcoatRoughness: U.lerp(0.5, 0.12, gloss), sheen: 0.2, sheenColor: new T.Color(MT.FFFFFF) });
  };
  GEN.staticWardrobe = (actor) => {
    if (actor.outfit.drawnBody && actor.outfit.drawnBody.length) return;
    if (actor.wardrobeBuilt) return;
    actor.wardrobeBuilt = true;
    const tops = [MT.TSHIRT, MT.SHIRT, MT.POLO, MT.UNIFORM_TOP, MT.SWEATER, MT.HOODIE, MT.VEST, MT.JACKET, MT.BLAZER, MT.COAT];
    const layers = actor.outfit.layers || [];
    const top = layers.filter((l) => tops.includes(l.kind)).pop();
    if (!top) return;
    actor.group.updateMatrixWorld(true);
    const point = (name) => actor.group.worldToLocal(actor.bones[name].getWorldPosition(new T.Vector3()));
    const cloth = new T.Group();
    cloth.name = MT.STATICWARDROBE;
    actor.group.add(cloth);
    const mat = clothMaterial(top, actor.style);
    actor.disposables.push(mat);
    const mesh = (geo, material = mat) => { if (!geo.attributes[MT.AREST]) geo.setAttribute(MT.AREST, geo.attributes.position.clone()); const o = new T.Mesh(geo, material); o.castShadow = true; o.receiveShadow = true; cloth.add(o); actor.disposables.push(geo); return o; };
    const pelvis = point(MT.PELVIS), neck = point(MT.NECK_01);
    if (neck.y - pelvis.y < 0.25) { actor.group.remove(cloth); return; }
    const left = point(MT.UPPERARM_L), right = point(MT.UPPERARM_R);
    const center = left.clone().add(right).multiplyScalar(0.5);
    const shoulder = Math.max(0.25, left.distanceTo(right) * 0.5 + 0.06);
    const longCoat = top.kind === MT.COAT && [MT.KNEE, MT.LONG, MT.THIGH].includes(top.length);
    const bottom = pelvis.y - (longCoat ? 0.35 : 0.08);
    const height = Math.max(0.3, neck.y + 0.035 - bottom);
    const P = [], I = [], UV = [];
    const radial = 40;
    const rings = [ [0, 0.88], [0.18, 0.9], [0.48, 0.86], [0.78, 1], [0.94, 1.02], [1, 0.4], ];
    rings.forEach(([v, width], row) => {
      for (let i = 0; i <= radial; i++) {
        const a = (i / radial) * Math.PI * 2;
        P.push(center.x + Math.sin(a) * shoulder * width, bottom + v * height, center.z + Math.cos(a) * shoulder * width * 0.66);
        UV.push(i / radial, v);
        if (row && i) { const c = row * (radial + 1) + i; I.push(c, c - 1, c - radial - 1, c - 1, c - radial - 2, c - radial - 1); }
      }
    });
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.Float32BufferAttribute(P, 3));
    g.setAttribute(MT.UV, new T.Float32BufferAttribute(UV, 2));
    g.setAttribute(MT.AREST, new T.Float32BufferAttribute(P, 3));
    g.setIndex(I);
    g.computeVertexNormals();
    mesh(g);
    const sleeve = (a, b, radius) => { const delta = b.clone().sub(a); const geo = new T.CapsuleGeometry(radius, Math.max(0.01, delta.length() - radius * 2), 8, 24); const o = mesh(geo); o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); geo.setAttribute(MT.AREST, geo.attributes.position.clone()); };
    const sleeves = top.sleeves || ([MT.TSHIRT, MT.POLO].includes(top.kind) ? MT.SHORT : top.kind === MT.VEST ? MT.NONE : MT.LONG);
    if (sleeves !== MT.NONE)
      for (const side of [MT.L_3, MT.R_2]) {
        const upper = point(MT.UPPERARM + side), elbow = point(MT.LOWERARM + side), hand = point(MT.HAND + side);
        if (sleeves === MT.SHORT) sleeve(upper, upper.clone().lerp(elbow, 0.65), 0.095); else { const start = upper.clone().lerp(center, 0.12); const curve = new T.CatmullRomCurve3([start, elbow, elbow.clone().lerp(hand, 0.96)]); const tube = new T.TubeGeometry(curve, 24, 0.085, 20, false); tube.setAttribute(MT.AREST, tube.attributes.position.clone()); mesh(tube); }
      }
    const trousers = layers.filter((l) => [MT.TROUSERS, MT.JEANS].includes(l.kind)).pop();
    if (trousers) {
      const legMat = clothMaterial(trousers, actor.style);
      actor.disposables.push(legMat);
      const hip = mesh(new T.SphereGeometry(1, 32, 24), legMat);
      hip.position.copy(pelvis).add(new T.Vector3(0, -0.035, 0));
      hip.scale.set(0.18, 0.15, 0.13);
      for (const side of [MT.L_3, MT.R_2]) {
        const thigh = point(MT.THIGH + MT.SYMBOL_10 + side), knee = point(MT.CALF + side), ankle = point(MT.FOOT + side);
        const curve = new T.CatmullRomCurve3([thigh.clone().lerp(pelvis, 0.12), knee, knee.clone().lerp(ankle, 0.98)]);
        mesh(new T.TubeGeometry(curve, 32, 0.085, 24, false), legMat);
      }
    }
    actor.model.traverse((o) => {
      if (!o.isSkinnedMesh || o.userData.keep) return;
      const dom = domBone(o.geometry, o.skeleton);
      const covered = new Set([MT.SPINE_01, MT.SPINE_02, MT.SPINE_03, MT.PELVIS, MT.CLAVICLE_L, MT.CLAVICLE_R, MT.HEAD_2, MT.NECK_01]);
      if (sleeves === MT.LONG) { covered.add(MT.UPPERARM_L); covered.add(MT.UPPERARM_R); covered.add(MT.LOWERARM_L); covered.add(MT.LOWERARM_R); }
      if (trousers) for (const side of [MT.L_3, MT.R_2]) { covered.add(MT.THIGH + MT.SYMBOL_10 + side); covered.add(MT.CALF + side); }
      const index = o.geometry.index.array, remaining = [];
      for (let i = 0; i < index.length; i += 3) {
        const ids = [index[i], index[i + 1], index[i + 2]];
        if (ids.some((v) => covered.has(o.skeleton.bones[dom[v]].name))) continue;
        remaining.push(...ids);
      }
      o.geometry.setIndex(remaining);
    });
    actor.model.traverse((o) => {
      if (o.isSkinnedMesh && (tops.includes(o.name) || o.name === MT.HAIR || (trousers && [MT.TROUSERS, MT.JEANS].includes(o.name)))) o.visible = false;
    });
    const skin = bodyMaterial(actor.style, true);
    skin.vertexColors = false;
    actor.disposables.push(skin);
    const head = point(MT.HEAD_2).add(new T.Vector3(0, 0.09, 0));
    const face = mesh(new T.SphereGeometry(1, 40, 28));
    face.material = skin;
    face.scale.set(0.105, 0.135, 0.11);
    face.position.copy(head);
    const collarY = bottom + height * 0.94, chinY = head.y - 0.105;
    const neckMesh = mesh(new T.CylinderGeometry(0.048, 0.054, Math.max(0.06, chinY - collarY), 28));
    neckMesh.material = skin;
    neckMesh.position.set(head.x, (collarY + chinY) * 0.5, head.z);
    const hair = layers.find((l) => l.kind === MT.HAIR);
    if (hair) { const hairMat = new T.MeshStandardMaterial({ color: hair.color, roughness: 0.86 }); actor.disposables.push(hairMat); const cap = mesh(new T.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.38)); cap.material = hairMat; cap.position.copy(head); cap.scale.set(0.108, 0.139, 0.114); }
    const trim = new T.MeshStandardMaterial({ color: MT.DDD8CC, roughness: 0.86 });
    actor.disposables.push(trim);
    if ([MT.SHIRT, MT.UNIFORM_TOP, MT.JACKET, MT.BLAZER, MT.COAT].includes(top.kind)) {
      const frontZ = (v, x) => { let row = 1; while (row < rings.length - 1 && rings[row][0] < v) row++; const lo = rings[row - 1], hi = rings[row]; const radius = shoulder * U.lerp(lo[1], hi[1], (v - lo[0]) / (hi[0] - lo[0])); return center.z + Math.sqrt(Math.max(0, radius * radius - x * x)) * 0.66 + 0.006; };
      const panel = (points, material) => {
        const geo = new T.BufferGeometry();
        const vertices = [], subdivisions = 12;
        for (let k = 1; k < points.length - 1; k++) {
          const a = points[0], b = points[k], c = points[k + 1];
          const vertex = (i, j) => { const x = a[0] + ((b[0] - a[0]) * i) / subdivisions + ((c[0] - a[0]) * j) / subdivisions; const v = a[1] + ((b[1] - a[1]) * i) / subdivisions + ((c[1] - a[1]) * j) / subdivisions; vertices.push(center.x + x, bottom + height * v, frontZ(v, x)); };
          for (let i = 0; i < subdivisions; i++)
            for (let j = 0; j < subdivisions - i; j++) {
              vertex(i, j);
              vertex(i + 1, j);
              vertex(i, j + 1);
              if (i + j < subdivisions - 1) { vertex(i + 1, j); vertex(i + 1, j + 1); vertex(i, j + 1); }
            }
        }
        geo.setAttribute(MT.POSITION, new T.Float32BufferAttribute(vertices, 3));
        geo.computeVertexNormals();
        const o = mesh(geo);
        o.material = material;
        material.side = T.DoubleSide;
        return o;
      };
      const tailored = [MT.BLAZER, MT.COAT, MT.VEST].includes(top.kind);
      if (tailored) { const under = layers.filter((l) => [MT.SHIRT, MT.TSHIRT, MT.UNIFORM_TOP].includes(l.kind)).pop(); const shirtMat = new T.MeshStandardMaterial({ color: under?.color || MT.DED8CA, roughness: 0.9 }); actor.disposables.push(shirtMat); panel( [ [-0.07, 0.94], [0.07, 0.94], [0, 0.57], ], shirtMat, ); }
      panel(
        [
          [-0.006, 0.12],
          [0.006, 0.12],
          [0.006, tailored ? 0.56 : 0.91],
          [-0.006, tailored ? 0.56 : 0.91],
        ],
        mat,
      );
      for (let i = 0; i < 4; i++) {
        const button = mesh(new T.SphereGeometry(0.008, 10, 8));
        button.material = trim;
        const v = 0.2 + i * (tailored ? 0.1 : 0.18);
        button.position.set(center.x, bottom + height * v, frontZ(v, 0) + 0.008);
      }
      const lapelMat = new T.MeshStandardMaterial({ color: new T.Color(top.color).multiplyScalar(1.18), roughness: 0.88 });
      actor.disposables.push(lapelMat);
      for (const sign of [-1, 1]) {
        panel(
          [
            [sign * 0.075, 0.94],
            [sign * 0.12, 0.84],
            [sign * 0.035, tailored ? 0.57 : 0.81],
          ],
          lapelMat,
        );
      }
    }
  };
  GEN.createActor = (outfit, opts) => {
    opts = opts || {};
    const female = outfit.body === MT.FEMALE;
    const src = female ? MQ.female : MQ.male;
    const rest = female ? MQ.restF : MQ.rest;
    const model = X.SkeletonUtils.clone(src.scene);
    const group = new T.Group();
    const disposables = [];
    const style = Object.assign({}, opts.style || {}, outfit.skin ? { skin: outfit.skin } : {});
    const bodyMain = bodyMaterial(style, true), bodyJoint = bodyMaterial(style, false);
    disposables.push(bodyMain, bodyJoint);
    const bones = {};
    const skinned = [];
    model.traverse((o) => {
      if (o.isBone) bones[o.name] = o;
      if (o.isSkinnedMesh) {
        skinned.push(o);
        const joint = o.material && /joint/i.test(o.material.name);
        o.geometry = o.geometry.clone();
        const cnt = o.geometry.attributes.position.count;
        const cols = new Float32Array(cnt * 3).fill(1);
        o.geometry.setAttribute(MT.COLOR, new T.BufferAttribute(cols, 3));
        disposables.push(o.geometry);
        o.material = joint ? bodyJoint : bodyMain;
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    bones.root = model.getObjectByName(MT.ROOT);
    model.updateMatrixWorld(true);
    const layers = (outfit.drawnBody && outfit.drawnBody.length ? [] : outfit.layers || []).slice();
    const order = [MT.SOCKS, MT.TSHIRT, MT.TANK, MT.SHIRT, MT.POLO, MT.UNIFORM_TOP, MT.DRESS, MT.TROUSERS, MT.JEANS, MT.SHORTS, MT.SKIRT, MT.BELT, MT.SWEATER, MT.HOODIE, MT.VEST, MT.BLAZER, MT.JACKET, MT.COAT, MT.GLOVES, MT.SHOES, MT.SNEAKERS, MT.BOOTS, MT.HAIR, MT.BEANIE, MT.CAP];
    layers.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    const used = {};
    const shellsOf = new Map();
    for (const layer of layers) {
      const mat = clothMaterial(layer, style);
      disposables.push(mat);
      let thick = THICK[layer.kind] || 0.012;
      used[layer.kind] = (used[layer.kind] || 0) + 1;
      if ([MT.JACKET, MT.BLAZER, MT.COAT, MT.VEST, MT.SWEATER, MT.HOODIE].includes(layer.kind) && (used.jacket || 0) + (used.blazer || 0) + (used.coat || 0) + (used.vest || 0) + (used.sweater || 0) + (used.hoodie || 0) > 1) thick += 0.006;
      if (layer.kind === MT.SKIRT || (layer.kind === MT.DRESS && layer.length !== MT.NONE)) { const sk = skirtMesh(layer, rest, mat); const sock = addSocket(model, rest, bones, MT.WAIST); sk.position.y = layer.kind === MT.DRESS ? 0.02 : 0.03; sock.add(sk); disposables.push(sk.geometry); if (layer.kind === MT.SKIRT) continue; }
      const rules = regionRules(layer);
      if (!rules.length) continue;
      for (const sm of skinned) {
        const shell = buildShell(sm, rules, rest, sm.material === bodyJoint ? thick * 1.5 : thick, mat, layer.kind, { geometry: sm.geometry, color: new T.Color(layer.color).multiplyScalar(0.55) });
        if (shell) { const prev = shellsOf.get(sm) || []; if (layer.kind !== MT.HAIR) for (const inner of prev) cullCovered(inner, shell.userData.keep); prev.push(shell); shellsOf.set(sm, prev); sm.parent.add(shell); disposables.push(shell.geometry); }
      }
      if (layer.kind === MT.CAP) { const brim = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.012, 24, 1, false, -Math.PI / 2 - 0.9, 1.8), mat); brim.scale.set(1, 1, 1.25); brim.position.set(0, 0.035, 0.075); brim.rotation.x = -0.12; addSocket(model, rest, bones, MT.HEAD).add(brim); disposables.push(brim.geometry); }
      if (layer.kind === MT.HAIR && (layer.style === MT.LONG || layer.style === MT.PONYTAIL || layer.style === MT.BUN)) {
        const hm = layer.style === MT.BUN ? new T.Mesh(new T.SphereGeometry(0.055, 16, 12), mat) : new T.Mesh(new T.CapsuleGeometry(layer.style === MT.PONYTAIL ? 0.035 : 0.09, layer.style === MT.PONYTAIL ? 0.16 : 0.2, 4, 12), mat);
        if (layer.style === MT.LONG) { hm.scale.set(1.25, 1, 0.45); hm.position.set(0, -0.12, -0.085); } else if (layer.style === MT.PONYTAIL) hm.position.set(0, -0.06, -0.12); else hm.position.set(0, 0.04, -0.1);
        addSocket(model, rest, bones, MT.HEAD).add(hm);
        disposables.push(hm.geometry);
      }
      if (layer.kind === MT.BELT) { const bk = new T.Mesh(new T.BoxGeometry(0.06, 0.045, 0.012), new T.MeshStandardMaterial({ color: MT.B9B4A8, metalness: 0.9, roughness: 0.3 })); const s = addSocket(model, rest, bones, MT.WAIST); bk.position.set(0, -0.005, 0.135); s.add(bk); disposables.push(bk.geometry, bk.material); }
    }
    const env = GEN.newBuildEnv({ materials: opts.materials || {}, shadowBudget: 0 });
    for (const acc of outfit.accessories || []) {
      const s = addSocket(model, rest, bones, acc.socket);
      GEN.buildNodes(acc.nodes, env, s);
    }
    if (outfit.drawnBody && outfit.drawnBody.length) {
      model.traverse((o) => {
        if (o.isMesh) o.visible = false;
      });
      for (const part of outfit.drawnBody) {
        const socket = addSocket(model, rest, bones, part.socket, true);
        socket.name = MT.DRAWNBODY_2 + part.socket;
        GEN.buildNodes(part.nodes, env, socket);
        const successor = { upperarm_r: MT.LOWERARM_R, upperarm_l: MT.LOWERARM_L, forearm_r: MT.HAND_R, forearm_l: MT.HAND_L, thigh_r: MT.CALF_R, thigh_l: MT.CALF_L, calf_r: MT.FOOT_R, calf_l: MT.FOOT_L }[part.socket];
        if (successor) {
          model.updateMatrixWorld(true);
          const inverse = socket.matrixWorld.clone().invert(), bounds = new T.Box3();
          socket.traverse((o) => {
            if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); bounds.union(o.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld))); }
          });
          const length = rest.bones[successor].wp.distanceTo(rest.bones[SOCKET_DEF[part.socket][0]].wp);
          if (!bounds.isEmpty() && bounds.max.y - bounds.min.y > 0.01) { const fit = (length + 0.024) / (bounds.max.y - bounds.min.y); for (const child of socket.children) { child.position.y = child.position.y * fit + 0.012 - bounds.max.y * fit; child.scale.y *= fit; } }
        }
        if (part.socket === MT.CHEST) {
          model.updateMatrixWorld(true);
          const bounds = new T.Box3();
          socket.traverse((o) => {
            if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); bounds.union(box); }
          });
          if (!bounds.isEmpty()) {
            const top = rest.bones[MT.NECK_01].wp.y + 0.025;
            const bottom = rest.bones[MT.PELVIS].wp.y + 0.08;
            const span = bounds.max.y - bounds.min.y;
            const fit = span > 0.01 ? (top - bottom) / span : 1;
            for (const child of socket.children) {
              child.position.y = child.position.y * fit + (bottom - bounds.min.y * fit + socket.getWorldPosition(new T.Vector3()).y * (fit - 1));
              child.scale.y *= fit;
            }
          }
        }
      }
    }
    const holdSockets = {};
    const scaleK = (outfit.height || 1.78) / 1.83;
    const buildK = outfit.build || 0;
    model.scale.set(scaleK * (1 + buildK * 0.12), scaleK, scaleK * (1 + buildK * 0.1));
    group.add(model);
    const mixer = new T.AnimationMixer(model);
    const actions = {};
    const actionFor = (id) => { if (!actions[id]) { const a = mixer.clipAction(GEN.clipFor(id)); a.enabled = true; a.setEffectiveWeight(0); a.play(); a.paused = true; actions[id] = a; } return actions[id]; };
    const actor = {
      outfit,
      style,
      group,
      model,
      bones,
      rest,
      mixer,
      env,
      height: outfit.height || 1.78,
      phase: (opts.seed || 0) % 7,
      disposables,
      hold(nodes, hand) {
        const key = hand || MT.HAND_R;
        if (!holdSockets[key]) holdSockets[key] = addSocket(model, rest, bones, key);
        GEN.buildNodes(nodes, env, holdSockets[key]);
      },
      pose(list, t) {
        const used = new Set(list.map((x) => x.id));
        for (const id of Object.keys(actions)) if (!used.has(id)) actions[id].setEffectiveWeight(0);
        for (const it of list) {
          const a = actionFor(it.id);
          const clip = a.getClip();
          const A = GEN.ACTIONS[it.id] || {};
          let tt = it.time;
          if (A.hold != null) tt = clip.duration * A.hold - 0.001; else if (A.once) tt = U.clamp(tt, 0, clip.duration - 0.001); else if (A.settle != null) tt = tt >= clip.duration * (A.cycles || 1) ? clip.duration * A.settle : U.mod(Math.max(0, tt), clip.duration); else tt = U.mod(tt, clip.duration);
          a.time = tt;
          a.setEffectiveWeight(it.weight);
        }
        mixer.update(0);
        let calm = 0;
        for (const it of list) if ((GEN.ACTIONS[it.id] || {}).calm) calm += it.weight;
        if (calm > 0.001) GEN.calmPose(actor, calm, t);
        model.updateMatrixWorld(true);
      },
      dispose() {
        mixer.stopAllAction();
        mixer.uncacheRoot(model);
        for (const d of disposables) {
          try {
            d.dispose();
          } catch (e) {
            void e;
          }
        }
        GEN.disposeEnv(env);
      },
    };
    return actor;
  };
  const vA = new T.Vector3(), vB = new T.Vector3(), qA = new T.Quaternion(), qB = new T.Quaternion(), qC = new T.Quaternion();
  const aimBone = (bone, child, dirWorld, w) => {
    if (!bone || !child || w <= 0) return;
    bone.getWorldPosition(vA);
    child.getWorldPosition(vB);
    const cur = vB.sub(vA).normalize();
    const q = qA.setFromUnitVectors(cur, dirWorld.clone().normalize());
    if (w < 1) q.slerp(qC.identity(), 1 - w);
    bone.getWorldQuaternion(qB);
    const parentQ = new T.Quaternion();
    bone.parent.getWorldQuaternion(parentQ);
    bone.quaternion.copy(parentQ.invert().multiply(q.clone().multiply(qB)));
    bone.updateMatrixWorld(true);
  };
  const orientHand = (actor, side, fingerDir, palmDir, w) => {
    const b = actor.bones;
    const hand = b[MT.HAND + side];
    if (!hand || w <= 0) return;
    hand.getWorldPosition(vA);
    b[MT.MIDDLE_01 + side].getWorldPosition(vB);
    const y0 = vB.clone().sub(vA).normalize();
    const pi = b[MT.INDEX_01 + side].getWorldPosition(new T.Vector3()), pp = b[MT.PINKY_01 + side].getWorldPosition(new T.Vector3());
    const across = pi.sub(pp).normalize();
    let z0 = new T.Vector3().crossVectors(across, y0).normalize();
    if (side === MT.R_2) z0.negate();
    const x0 = new T.Vector3().crossVectors(y0, z0).normalize();
    const y1 = fingerDir.clone().normalize();
    const x1 = new T.Vector3().crossVectors(y1, palmDir).normalize();
    const z1 = new T.Vector3().crossVectors(x1, y1).normalize();
    const m0 = new T.Matrix4().makeBasis(x0, y0, z0), m1 = new T.Matrix4().makeBasis(x1, y1, z1);
    const q0 = new T.Quaternion().setFromRotationMatrix(m0), q1 = new T.Quaternion().setFromRotationMatrix(m1);
    const delta = q1.multiply(q0.invert());
    if (w < 1) delta.slerp(new T.Quaternion(), 1 - w);
    hand.getWorldQuaternion(qB);
    const parentQ = new T.Quaternion();
    hand.parent.getWorldQuaternion(parentQ);
    hand.quaternion.copy(parentQ.invert().multiply(delta.multiply(qB)));
    hand.updateMatrixWorld(true);
  };
  const tiltHead = (actor, pitch, yaw, w) => {
    const neck = actor.bones.neck_01, head = actor.bones.Head;
    if (!neck || !head || w <= 0) return;
    const q = new T.Quaternion();
    const gq = new T.Quaternion();
    actor.group.getWorldQuaternion(gq);
    const axisX = new T.Vector3(1, 0, 0).applyQuaternion(gq), axisY = new T.Vector3(0, 1, 0).applyQuaternion(gq);
    for (const [bone, k] of [
      [neck, 0.45],
      [head, 0.55],
    ]) {
      q.setFromAxisAngle(axisX, pitch * k * w).multiply(new T.Quaternion().setFromAxisAngle(axisY, yaw * k * w));
      bone.getWorldQuaternion(qB);
      const pq = new T.Quaternion();
      bone.parent.getWorldQuaternion(pq);
      bone.quaternion.copy(pq.invert().multiply(q.clone().multiply(qB)));
      bone.updateMatrixWorld(true);
    }
  };
  const POSES = {
    phone: { r: { up: [-0.1, -0.97, 0.2], fo: [0.5, 0.3, 0.81], finger: [0.1, 0.75, 0.66], palm: [0.0, 0.62, -0.78] }, l: { up: [0.1, -0.97, 0.2], fo: [-0.62, 0.2, 0.76], finger: [-0.45, 0.35, 0.82], palm: [0.55, 0.6, -0.5] }, head: 0.48 },
    behind_back: { r: { up: [-0.22, -0.92, -0.32], fo: [0.72, -0.42, -0.55], finger: [0.7, -0.5, -0.2], palm: [0, 0, -1] }, l: { up: [0.22, -0.92, -0.32], fo: [-0.72, -0.42, -0.55], finger: [-0.7, -0.5, -0.2], palm: [0, 0, -1] } },
    hands_up: { r: { up: [-0.7, 0.68, 0.15], fo: [-0.1, 1, 0.08], finger: [0, 1, 0.1], palm: [0, 0, 1] }, l: { up: [0.7, 0.68, 0.15], fo: [0.1, 1, 0.08], finger: [0, 1, 0.1], palm: [0, 0, 1] } },
    point: { r: { up: [-0.25, 0.12, 0.96], fo: [-0.15, 0.12, 1] } },
    wave: { r: { up: [-0.82, 0.3, 0.2], fo: [-0.15, 1, 0.15], wave: 1 } },
    restrain: { r: { up: [-0.1, -0.55, 0.83], fo: [0.12, -0.25, 0.96] }, l: { up: [0.1, -0.55, 0.83], fo: [-0.12, -0.25, 0.96] } },
    hips: { r: { up: [-0.6, -0.75, -0.05], fo: [0.55, -0.4, 0.2] }, l: { up: [0.6, -0.75, -0.05], fo: [-0.55, -0.4, 0.2] } },
    think: { r: { up: [-0.12, -0.75, 0.55], fo: [0.3, 0.85, 0.35] }, l: { up: [0.12, -0.85, 0.45], fo: [-0.8, 0.15, 0.5] }, head: 0.12 },
    cover_face: { r: { up: [-0.1, -0.35, 0.93], fo: [0.25, 0.92, 0.22] }, l: { up: [0.1, -0.35, 0.93], fo: [-0.25, 0.92, 0.22] }, head: 0.3 },
  };
  GEN.POSES = POSES;
  const CALM_BONES = [MT.PELVIS, MT.SPINE_01, MT.SPINE_02, MT.SPINE_03, MT.NECK_01, MT.HEAD_2, MT.THIGH_L, MT.THIGH_R, MT.CALF_L, MT.CALF_R, MT.FOOT_L, MT.FOOT_R, MT.BALL_L, MT.BALL_R, MT.CLAVICLE_L, MT.CLAVICLE_R];
  const RELAX = { r: { up: [-0.13, -0.99, 0.03], fo: [-0.04, -0.96, 0.24] }, l: { up: [0.13, -0.99, 0.03], fo: [0.04, -0.96, 0.24] } };
  GEN.calmPose = (actor, w, t) => {
    const R = actor.rest.bones;
    const k = Math.min(1, w) * 0.92;
    for (const n of CALM_BONES) {
      const b = actor.bones[n];
      if (b && R[n]) b.quaternion.slerp(R[n].lq, k);
    }
    for (const side of [MT.L_3, MT.R_2])
      for (const f of [MT.INDEX, MT.MIDDLE, MT.PINKY, MT.RING])
        for (const j of [MT.VALUE_01, MT.VALUE_02, MT.VALUE_03]) {
          const b = actor.bones[f + MT.SYMBOL_10 + j + MT.SYMBOL_10 + side];
          if (b && R[b.name]) b.quaternion.slerp(R[b.name].lq, k * 0.55);
        }
    const pel = actor.bones.pelvis;
    if (pel && R.pelvis) pel.position.lerp(R.pelvis.lp, k);
    const breathe = Math.sin(t * 1.6 + actor.phase) * 0.012;
    const sp = actor.bones.spine_02;
    if (sp) sp.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), breathe * w));
    actor.model.updateMatrixWorld(true);
    const gq = new T.Quaternion();
    actor.group.getWorldQuaternion(gq);
    const b = actor.bones;
    for (const side of [MT.R_2, MT.L_3]) {
      const s = RELAX[side];
      const sway = Math.sin(t * 0.9 + actor.phase + (side === MT.L_3 ? 1 : 0)) * 0.02;
      aimBone(b[MT.UPPERARM + side], b[MT.LOWERARM + side], new T.Vector3(s.up[0], s.up[1], s.up[2] + sway).applyQuaternion(gq), k);
      aimBone(b[MT.LOWERARM + side], b[MT.HAND + side], new T.Vector3(s.fo[0], s.fo[1], s.fo[2] + sway).applyQuaternion(gq), k);
    }
  };
  GEN.applyPose = (actor, poseId, w, t, extra) => {
    const P = POSES[poseId];
    const gq = new T.Quaternion();
    actor.group.getWorldQuaternion(gq);
    const toW = (v) => new T.Vector3(v[0], v[1], v[2]).applyQuaternion(gq);
    const b = actor.bones;
    if (P && w > 0) {
      for (const side of [MT.R_2, MT.L_3]) {
        const s = P[side];
        if (!s) continue;
        aimBone(b[MT.UPPERARM + side], b[MT.LOWERARM + side], toW(s.up), w);
        let fo = s.fo;
        if (s.wave) fo = [fo[0] + Math.sin(t * 7) * 0.35, fo[1], fo[2]];
        aimBone(b[MT.LOWERARM + side], b[MT.HAND + side], toW(fo), w);
        if (s.finger) orientHand(actor, side, toW(s.finger), toW(s.palm), w);
      }
      if (P.head) tiltHead(actor, P.head, 0, w);
    }
    if (extra && extra.headDown) tiltHead(actor, extra.headDown, 0, 1);
    if (extra && extra.look) tiltHead(actor, 0.05, Math.sin(t * 0.9) * 0.6, 1);
  };
  GEN.actorBounds = (actor, upper) => {
    const pts = [];
    for (const n of upper ? [MT.HEAD_2, MT.HAND_L, MT.HAND_R, MT.PELVIS, MT.SPINE_03] : [MT.HEAD_2, MT.HAND_L, MT.HAND_R, MT.FOOT_L, MT.FOOT_R, MT.PELVIS, MT.BALL_L, MT.BALL_R]) {
      const b = actor.bones[n];
      if (!b) continue;
      const v = new T.Vector3();
      b.getWorldPosition(v);
      pts.push(v);
    }
    const head = actor.bones.Head.getWorldPosition(new T.Vector3());
    const top = head.clone();
    top.y += 0.26 * (actor.height / 1.78);
    pts.push(top);
    return pts;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
