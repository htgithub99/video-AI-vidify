(function (root) {
  "use strict";
  const MT = root.MotionEngineText;
  const ME = root.MotionEngine;
  const U = ME.util;
  const GEN = ME.GEN;
  const T = GEN.T;
  if (!T || !ME.T3) return;
  const X = GEN.X;
  const DEG = Math.PI / 180;
  GEN.info = {};
  GEN.base = MT.EMPTY;
  const envCache = new Map();
  const TIME = {
    day: { sun: MT.FFF1DC, sunI: 3.0, elev: 48, az: -35, hemiSky: MT.BCD4F0, hemiGround: MT.VALUE_6A5F50, hemiI: 0.95, fill: 0.22, fillColor: MT.FFF4E6, exposure: 1.0, top: MT.VALUE_3F78C4, horizon: MT.CFE0EE, fog: MT.C3D3DF, envI: 1.0 },
    dawn: { sun: MT.FFC79A, sunI: 2.0, elev: 9, az: 60, hemiSky: MT.A59AC0, hemiGround: MT.VALUE_4C4038, hemiI: 0.7, fill: 0.25, fillColor: MT.FFE2C8, exposure: 1.05, top: MT.VALUE_5A6FA8, horizon: MT.F2B48A, fog: MT.C9A99A, envI: 0.85 },
    dusk: { sun: MT.FFA060, sunI: 2.2, elev: 7, az: -70, hemiSky: MT.VALUE_7B74A8, hemiGround: MT.VALUE_4A382C, hemiI: 0.6, fill: 0.25, fillColor: MT.FFD8B8, exposure: 1.05, top: MT.VALUE_30365E, horizon: MT.F08A52, fog: MT.A7808A, envI: 0.8 },
    overcast: { sun: MT.E8ECF0, sunI: 0.9, elev: 55, az: -20, hemiSky: MT.D4DAE0, hemiGround: MT.VALUE_5F5C58, hemiI: 1.35, fill: 0.2, fillColor: MT.EEF2F6, exposure: 1.0, top: MT.VALUE_8A949E, horizon: MT.C8CED4, fog: MT.B9C0C6, envI: 0.9 },
    night: { sun: MT.VALUE_9FB4E6, sunI: 0.38, elev: 42, az: 30, hemiSky: MT.VALUE_2B3858, hemiGround: MT.VALUE_0B0D12, hemiI: 0.55, fill: 0.62, fillColor: MT.B8C8FF, exposure: 1.2, top: MT.VALUE_03050C, horizon: MT.VALUE_121A2C, fog: MT.VALUE_0E1420, envI: 0.55 },
    interior: { sun: null, hemiSky: MT.F2E6D4, hemiGround: MT.VALUE_3C3128, hemiI: 0.55, fill: 0.28, fillColor: MT.FFF0DC, exposure: 1.0, background: MT.VALUE_151310, fog: MT.VALUE_2A2622, envI: 0.8 },
    interior_dark: { sun: null, hemiSky: MT.VALUE_3A4662, hemiGround: MT.VALUE_0D0E12, hemiI: 0.26, fill: 0.36, fillColor: MT.C8D4FF, exposure: 1.0, background: MT.VALUE_050608, fog: MT.VALUE_0A0C10, envI: 0.42 },
  };
  GEN.TIME = TIME;
  const skyDome = (L, tp, time) => {
    const top = new T.Color((L.sky && L.sky.top) || tp.top || MT.VALUE_000000),
      hz = new T.Color((L.sky && L.sky.horizon) || tp.horizon || MT.VALUE_202020);
    const sunDir = new T.Vector3();
    sunDir.setFromSphericalCoords(1, (90 - (tp.elev || 30)) * DEG, (tp.az || 0) * DEG);
    const mat = new T.ShaderMaterial({
      uniforms: { uTop: { value: top }, uHz: { value: hz }, uSun: { value: sunDir }, uSunCol: { value: new T.Color(tp.sun || MT.FFFFFF) }, uSunK: { value: time === MT.NIGHT ? 0.0 : time === MT.DUSK || time === MT.DAWN ? 0.9 : 0.45 }, uCity: { value: L.sky && L.sky.city != null ? L.sky.city : time === MT.NIGHT ? 0.35 : 0 } },
      vertexShader: MT.VARYING_VEC3_VDIR_VOID_MAIN_VDIR_NORMALIZE,
      fragmentShader: MT.UNIFORM_VEC3_UTOP_UNIFORM_VEC3_UHZ_UNIFORM,
      side: T.BackSide,
      depthWrite: false,
      fog: false,
    });
    const m = new T.Mesh(new T.SphereGeometry(1500, 32, 16), mat);
    m.frustumCulled = false;
    m.renderOrder = -10;
    return m;
  };
  const stars = (n, seed) => {
    const r = U.rng(seed);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2,
        e = 0.08 + r() * 1.35;
      pts.push(Math.cos(a) * Math.cos(e) * 1400, Math.sin(e) * 1400, Math.sin(a) * Math.cos(e) * 1400);
    }
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.Float32BufferAttribute(pts, 3));
    return new T.Points(g, new T.PointsMaterial({ color: MT.E8EEFF, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8, depthWrite: false }));
  };
  const RAIN_LEN = 0.32,
    RAIN_W = 0.012,
    RAIN_SLANT = 0.07;
  const rainStreaks = (center) => {
    const n = 2600,
      r = U.rng(5),
      base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      base[i * 3] = center[0] + (r() - 0.5) * 40;
      base[i * 3 + 1] = r() * 14;
      base[i * 3 + 2] = center[1] + (r() - 0.5) * 40;
    }
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.BufferAttribute(new Float32Array(n * 18), 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: MT.AAB8C8, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide, toneMapped: false, fog: false }));
    m.frustumCulled = false;
    m.userData = { base, kind: MT.RAIN, streaks: true };
    return m;
  };
  const weatherFx = (kind, center, flat) => {
    if (kind === MT.RAIN && flat) return rainStreaks(center);
    if (kind !== MT.RAIN && kind !== MT.SNOW && kind !== MT.DUST) return null;
    const n = kind === MT.RAIN ? 6000 : 2500;
    const r = U.rng(5);
    const pos = new Float32Array(n * 3),
      base = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      base[i * 3] = center[0] + (r() - 0.5) * 40;
      base[i * 3 + 1] = r() * 14;
      base[i * 3 + 2] = center[1] + (r() - 0.5) * 40;
    }
    pos.set(base);
    const g = new T.BufferGeometry();
    g.setAttribute(MT.POSITION, new T.BufferAttribute(pos, 3));
    const m = new T.Points(g, new T.PointsMaterial({ color: kind === MT.RAIN ? MT.AAB8C8 : kind === MT.DUST ? MT.C8B49A : MT.FFFFFF, size: kind === MT.RAIN ? 0.035 : 0.06, transparent: true, opacity: kind === MT.RAIN ? 0.55 : 0.85, depthWrite: false }));
    m.frustumCulled = false;
    m.userData = { base, kind };
    return m;
  };
  const updateWeather = (m, t) => {
    if (!m) return;
    const p = m.geometry.attributes.position.array,
      b = m.userData.base;
    const sp = m.userData.kind === MT.RAIN ? 11 : m.userData.kind === MT.DUST ? 0.3 : 1.1;
    if (m.userData.streaks) {
      for (let i = 0, k = 0; i < b.length; i += 3, k += 18) {
        const x = b[i],
          y = U.mod(b[i + 1] - t * sp, 14),
          z = b[i + 2],
          x2 = x - RAIN_SLANT,
          y2 = y + RAIN_LEN;
        const quad = [x, y, z, x + RAIN_W, y, z, x2 + RAIN_W, y2, z, x, y, z, x2 + RAIN_W, y2, z, x2, y2, z];
        for (let q = 0; q < 18; q++) p[k + q] = quad[q];
      }
      m.geometry.attributes.position.needsUpdate = true;
      return;
    }
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] = U.mod(b[i + 1] - t * sp, 14);
      if (m.userData.kind !== MT.RAIN) p[i] = b[i] + Math.sin(t * 0.7 + i) * 0.3;
    }
    m.geometry.attributes.position.needsUpdate = true;
  };
  const cleanGen = (spec) => {
    const G = spec.gen || (spec.gen = {});
    if (G.__clean) return G.__clean;
    const C = { locations: {}, cast: {} };
    for (const k of Object.keys(G.locations || {})) C.locations[k] = GEN.validateLocation(G.locations[k]).value;
    for (const k of Object.keys(G.cast || {})) C.cast[k] = GEN.validateCharacter(G.cast[k]).value;
    Object.defineProperty(G, MT.CLEAN, { value: C, enumerable: false });
    return C;
  };
  GEN.cleanGen = cleanGen;
  const castOf = (spec, key) => {
    const design = cleanGen(spec).cast[key];
    if (!design || !design.parts || !design.parts.some((part) => part.nodes.length)) throw new Error(MT.CUSTOM_CHARACTER_DESIGN_MISSING_FOR + key + MT.REBUILD_CHARACTERS_BEFORE_RENDERING);
    return design;
  };
  const yawTo = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const planActor = (a, dur, motion = false) => {
    if (!motion) return [{ id: a.action || MT.IDLE, t0: 0, t1: dur + 30 }];
    const end = a.then ? dur * (a.moveTo ? (a.moveEnd ?? 1) : (a.thenAt ?? 0.6)) : dur + 30;
    const list = [{ id: a.action || MT.IDLE, t0: 0, t1: end, moving: !!a.moveTo }];
    if (a.then) list.push({ id: a.then, t0: end, t1: dur + 30 });
    return list;
  };
  const actorState = (A, t) => {
    const a = A.def;
    if (!A.motion || !a.moveTo) return { pos: a.at, moving: false, dir: null };
    const start = (a.moveStart ?? 0) * A.dur,
      end = (a.moveEnd ?? 1) * A.dur;
    const progress = U.clamp((t - start) / Math.max(0.05, end - start), 0, 1);
    return { pos: [a.at[0] + (a.moveTo[0] - a.at[0]) * progress, a.at[1] + (a.moveTo[1] - a.at[1]) * progress], moving: t >= start && t < end, dir: yawTo(a.at, a.moveTo) };
  };
  const faceYaw = (A, S, t, cam) => {
    const a = A.def;
    const st = actorState(A, t);
    let base;
    if (a.face === MT.CAMERA && cam) base = yawTo(st.pos, [cam.position.x, cam.position.z]);
    else if (typeof a.face === MT.NUMBER) base = a.face * DEG;
    else if (a.faceAt) base = yawTo(st.pos, a.faceAt);
    else if (a.faceActor) {
      const o = S.actors.find((x) => x.def.cast === a.faceActor && x !== A);
      base = o ? yawTo(st.pos, actorState(o, t).pos) : 0;
    } else base = cam ? yawTo(st.pos, [cam.position.x, cam.position.z]) * 0.35 : 0;
    return base;
  };
  const ghostify = (actor, S) => {
    const mats = [];
    const tint = new T.Color(MT.GHOST_TINT);
    actor.group.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      const conv = (m) => {
        const c = m.clone();
        c.transparent = true;
        c.opacity = 0.4;
        c.depthWrite = false;
        if (c.color) c.color.lerp(tint, 0.55);
        if (c.emissive) {
          c.emissive.copy(tint);
          c.emissiveIntensity = 0.65;
        }
        mats.push(c);
        S.disposables.push(c);
        return c;
      };
      o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    });
    actor.ghostMats = mats;
  };
  const faceState = (A, S, t) => {
    const talk = A.def.talk,
      u = t / Math.max(0.01, S.dur);
    const lines = S.stg && S.stg.speech && S.stg.speech[A.def.cast];
    const talking = Array.isArray(lines) ? lines.some((r) => t >= r[0] && t <= r[1]) : !!talk && u >= talk[0] && u <= talk[1];
    return { expression: A.def.expression, talking, time: t, seed: U.strHash(A.def.cast || MT.EMPTY) % 7 };
  };
  const updateActor = (A, S, t, cam) => {
    if (!A.motion && A.poseLocked) {
      if (A.actor.animatedFace) A.actor.sample(A.lockedSegment, 0, false, faceState(A, S, t));
      return;
    }
    const faceTime = t;
    if (!A.motion) {
      t = 0;
      cam = { position: { x: S.L.camera.pos[0], z: S.L.camera.pos[2] } };
    }
    const st = actorState(A, t);
    const actor = A.actor;
    actor.group.position.set(st.pos[0], A.def.y || 0, st.pos[1]);
    if (A.def.ghost) for (const m of actor.ghostMats || []) m.opacity = 0.4;
    let yaw = st.moving ? st.dir : faceYaw(A, S, t, cam);
    const view = S.flatDrawing && S.camera ? S.camera.position : null;
    if (view && !st.moving) {
      const toCam = yawTo(st.pos, [view.x, view.z]);
      let delta = Math.atan2(Math.sin(yaw - toCam), Math.cos(yaw - toCam));
      const limit = 25 * DEG;
      if (Math.abs(delta) > limit) delta = Math.sign(delta) * limit;
      yaw = toCam + delta;
    }
    actor.group.rotation.y = yaw;
    actor.group.updateMatrixWorld(true);
    const segment = A.segs.find((item) => t >= item.t0 && t < item.t1) || A.segs[A.segs.length - 1];
    const previous = A.segs[A.segs.indexOf(segment) - 1];
    const into = previous && A.motion ? t - segment.t0 : Infinity;
    if (into < MT.POSE_BLEND) {
      actor.sample(previous.id, segment.t0 - previous.t0 + (A.def.offset || 0), A.motion, faceState(A, S, faceTime));
      const from = actor.snapshot();
      actor.sample(segment.id, into + (A.def.offset || 0), A.motion, faceState(A, S, faceTime));
      const k = into / MT.POSE_BLEND;
      actor.blendFrom(from, k * k * (3 - 2 * k));
    } else actor.sample(segment.id, A.motion ? t - segment.t0 + (A.def.offset || 0) : 0, A.motion, faceState(A, S, faceTime));
    A.poseLocked = !A.motion;
    A.lockedSegment = segment.id;
  };
  const propBounds = (S, wanted) => {
    if (!wanted) return null;
    let object = null;
    S.scene.traverseVisible((o) => {
      if (!object && o.name === wanted) object = o;
    });
    if (!object) return null;
    object.updateWorldMatrix(true, true);
    const bounds = new T.Box3().setFromObject(object);
    return bounds.isEmpty() ? null : bounds;
  };
  const shotCamera = (S, stg) => {
    const L = S.L;
    const cam = stg.camera || {};
    const focus = cam.focus ? S.actors.filter((a) => a.def.cast === cam.focus) : S.actors;
    const bounds = propBounds(S, cam.focusProp);
    const propPoint = bounds ? bounds.getCenter(new T.Vector3()).toArray() : null;
    const anchor = propPoint || (!focus.length && cam.target ? cam.target : null);
    const pts = anchor ? [[anchor[0], anchor[2]]] : focus.length ? focus.map((a) => a.def.at) : [L.stage.center];
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length,
      cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let spread = 0;
    for (const p of pts) spread = Math.max(spread, Math.hypot(p[0] - cx, p[1] - cz));
    const shot = cam.shot || MT.MEDIUM;
    const base = L.camera;
    const dir = new T.Vector3(base.pos[0] - base.target[0], 0, base.pos[2] - base.target[2]);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize();
    const fov = cam.fov || (shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT ? 32 : shot === MT.WIDE || shot === MT.AERIAL ? 45 : 38);
    const span = shot === MT.WIDE ? Math.max(6, spread * 2 + 5) : shot === MT.AERIAL ? Math.max(14, spread * 2 + 10) : shot === MT.MEDIUM ? Math.max(2.4, spread * 2 + 1.6) : shot === MT.CLOSE ? 1.1 : shot === MT.EXTREME_CLOSE ? 0.6 : shot === MT.INSERT ? 0.8 : Math.max(2.2, spread * 2 + 1.2);
    const d = span / 2 / Math.tan((fov / 2) * DEG) + 0.4;
    const ty = anchor ? anchor[1] : focus.length ? focus.reduce((sum, actor) => sum + actor.actor.anchor(shot === MT.CLOSE || shot === MT.EXTREME_CLOSE ? MT.HEAD : MT.BODY).y, 0) / focus.length : base.target[1];
    let py = ty + (shot === MT.LOW ? -0.9 : shot === MT.HIGH ? 3.5 : shot === MT.AERIAL ? d * 0.8 : 0.15);
    if (shot === MT.OVER_SHOULDER && focus.length && S.actors.length > 1) {
      const A = focus[0];
      const B = S.actors.find((x) => x !== A);
      const v = new T.Vector3(B.def.at[0] - A.def.at[0], 0, B.def.at[1] - A.def.at[1]).normalize();
      const side = new T.Vector3(-v.z, 0, v.x);
      const p = B.actor.anchor(MT.HEAD).addScaledVector(v, 0.9).addScaledVector(side, 0.45);
      return { pos: p.toArray(), target: A.actor.anchor(MT.HEAD).toArray(), fov: 36 };
    }
    const requestedAngle = Number.isFinite(Number(cam.angle)) ? Number(cam.angle) : shot === MT.WIDE ? 0 : 12;
    const yawOff = requestedAngle * DEG;
    dir.applyAxisAngle(new T.Vector3(0, 1, 0), yawOff);
    return { pos: [cx + dir.x * d, py, cz + dir.z * d], target: [cx, ty, cz], fov };
  };
  const flatPitched = (S, camDef) => {
    const fc = S.style && S.style.flatCamera;
    if (!fc || !camDef || !camDef.pos || !camDef.target || (S.stg.camera || {}).shot === MT.AERIAL) return camDef;
    const base = S.L.camera,
      dir = new T.Vector3(base.pos[0] - base.target[0], 0, base.pos[2] - base.target[2]);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize();
    const tgt = new T.Vector3(...camDef.target),
      dist = Math.max(0.5, new T.Vector3(...camDef.pos).distanceTo(tgt)),
      pitch = (Number(fc.pitch) || 0) * DEG;
    const pos = tgt
      .clone()
      .addScaledVector(dir, dist * Math.cos(pitch))
      .add(new T.Vector3(0, dist * Math.sin(pitch), 0));
    return Object.assign({}, camDef, { pos: pos.toArray() });
  };
  const project = (cam, v) => v.clone().project(cam);
  const reaches = (a) => !!a.faceAt && !a.moveTo;
  const walkBoxes = (S) => {
    if (S.walkBoxes) return S.walkBoxes;
    const boxes = [];
    for (const o of S.occluders) {
      const bb = new T.Box3().setFromObject(o);
      if (bb.max.y < 0.35 || bb.min.y > 1.2) continue;
      if (bb.max.x - bb.min.x > 30 || bb.max.z - bb.min.z > 30) continue;
      let nm = MT.EMPTY;
      for (let p = o; p && p.name !== MT.LOCATION; p = p.parent) if (p.name) nm = p.name;
      boxes.push({ bb, name: nm || MT.OBJECT });
    }
    S.walkBoxes = boxes;
    return boxes;
  };
  const solidsOf = (S) => {
    if (S.solids) return S.solids;
    S.solids = S.occluders.map((o) => ({ o, b: new T.Box3().setFromObject(o).expandByScalar(0.08) })).filter((x) => !x.b.isEmpty());
    for (const b of S.glass || []) S.solids.push({ o: { name: MT.GLASS }, b });
    return S.solids;
  };
  const clearCamera = (S, cam, tgt, issues) => {
    if (!S.occluders.length) return;
    const boxes = solidsOf(S).filter((x) => !x.b.containsPoint(tgt));
    const blocked = (v) => boxes.find((x) => x.b.containsPoint(v));
    const first = blocked(cam.position);
    if (!first) return;
    const start = cam.position.clone();
    const dir = tgt.clone().sub(start);
    const total = dir.length();
    dir.normalize();
    let best = null;
    for (let d = 0.15; d < total - 0.6; d += 0.15) {
      const v = start.clone().addScaledVector(dir, d);
      if (!blocked(v)) {
        best = v;
        break;
      }
    }
    let up = start.clone();
    for (let i = 0; i < 6; i++) {
      const hit = blocked(up);
      if (!hit) break;
      up.y = hit.b.max.y + 0.05;
    }
    if (blocked(up) || up.y > Math.max(4.5, tgt.y + 3.5)) up = null;
    const pick = best && up ? (best.distanceTo(start) <= up.distanceTo(start) ? best : up) : best || up;
    if (!pick) return;
    cam.position.copy(pick);
    issues.push(MT.CAMERA_WAS_BEHIND + (first.o.name || MT.GEOMETRY) + MT.MOVED_IN_FRONT);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(true);
  };
  const rayClear = (S, from, to) => {
    const d = to.clone().sub(from);
    const len = d.length();
    if (len < 1e-3) return true;
    const ray = new T.Raycaster(from, d.normalize(), 0.3, len);
    return !ray.intersectObjects(S.occluders, true).some((h) => h.object.material && !h.object.material.transparent);
  };
  const reangleCamera = (S, cam, want, tgt, shot, issues) => {
    if (!S.occluders.length) return;
    const wantDist = want.distanceTo(tgt);
    const minDist = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT ? 0.6 : shot === MT.MEDIUM ? 1.4 : 2.2;
    const now = cam.position.distanceTo(tgt);
    if (now >= Math.min(minDist, wantDist * 0.8) && rayClear(S, tgt, cam.position)) return;
    const boxes = solidsOf(S).filter((x) => !x.b.containsPoint(tgt));
    const free = (v) => !boxes.some((x) => x.b.containsPoint(v)) && rayClear(S, tgt, v);
    const yaw0 = Math.atan2(want.x - tgt.x, want.z - tgt.z);
    const flat = Math.hypot(want.x - tgt.x, want.z - tgt.z) || wantDist;
    let best = null;
    for (const k of [1, 0.85, 0.7, 0.55]) {
      const r = Math.max(minDist, flat * k);
      for (let i = 1; i <= 12 && !best; i++) {
        const a = yaw0 + Math.ceil(i / 2) * (Math.PI / 6) * (i % 2 ? 1 : -1);
        const v = new T.Vector3(tgt.x + Math.sin(a) * r, want.y, tgt.z + Math.cos(a) * r);
        if (free(v)) best = v;
      }
      if (best) break;
    }
    if (!best) {
      let bestScore = -Infinity;
      const reach = Math.max(flat, 3.5);
      for (let i = 0; i < 24; i++) {
        const a = yaw0 + i * (Math.PI / 12);
        let len = 0;
        for (let d = 0.4; d <= reach; d += 0.2) {
          const v = new T.Vector3(tgt.x + Math.sin(a) * d, want.y, tgt.z + Math.cos(a) * d);
          if (!free(v)) break;
          len = d;
        }
        const turn = Math.min(i, 24 - i) / 12;
        const score = Math.min(len, flat) - turn * 0.6;
        if (len >= 0.8 && score > bestScore) {
          bestScore = score;
          const r = Math.min(flat, len);
          best = new T.Vector3(tgt.x + Math.sin(a) * r, want.y, tgt.z + Math.cos(a) * r);
        }
      }
    }
    if (!best) return;
    cam.position.copy(best);
    issues.push(MT.CAMERA_WAS_BEHIND + MT.GEOMETRY + MT.MOVED_IN_FRONT);
  };
  const inStage = (S, v) => {
    const st = S.L && S.L.stage;
    return !S.interior || !st || (Math.abs(v.x - st.center[0]) <= st.size[0] / 2 + 2 && Math.abs(v.z - st.center[1]) <= st.size[1] / 2 + 2);
  };
  const limitPitch = (cam, tgt, shot, issues) => {
    if (shot === MT.HIGH || shot === MT.AERIAL || shot === MT.INSERT) return;
    const flat = Math.hypot(cam.position.x - tgt.x, cam.position.z - tgt.z);
    const dy = cam.position.y - tgt.y;
    const max = Math.tan((shot === MT.WIDE ? 40 : 32) * DEG);
    if (flat < 0.05 || dy <= flat * max) return;
    cam.position.y = Math.max(0.4, tgt.y + flat * Math.tan(18 * DEG));
    issues.push(MT.CAMERA_LOWERED);
  };
  const PARTNER_RANGE = 1.6;
  const FLAT_WIDE_FOOT = 0.1;
  const FLAT_MIN_RISE = 0.03;
  const FLAT_FLOOR_MARGIN = 0.5;
  const framedCast = (S, focus, shot) => {
    if (!focus) return S.actors;
    const lead = S.actors.filter((A) => A.def.cast === focus);
    if (!lead.length || !S.flatView || shot === MT.EXTREME_CLOSE || shot === MT.INSERT || shot === MT.OVER_SHOULDER) return lead;
    return S.actors.filter((A) => lead.includes(A) || lead.some((L) => Math.hypot(A.def.at[0] - L.def.at[0], A.def.at[1] - L.def.at[1]) <= PARTNER_RANGE));
  };
  const SHOT_SIZE = { wide: [0.28, 0.42, 0.62], medium: [0.5, 0.67, 0.85], over_shoulder: [0.4, 0.55, 0.8], close: [0.42, 0.55, 0.72], extreme_close: [0.55, 0.7, 0.9] };
  const BIG_HEAD_SIZE = { wide: SHOT_SIZE.wide, medium: [0.72, 0.82, 0.92], over_shoulder: [0.66, 0.78, 0.9], close: [0.74, 0.84, 0.94], extreme_close: [0.74, 0.84, 0.94] };
  const BIG_HEAD_SHARE = 0.3;
  const FRAMING = { close: { body: 0.3, heads: 1.6 }, over_shoulder: { body: 0.2, heads: 2.6 }, medium: { body: 0.05, heads: 4 } };
  GEN.framingOf = (actor, shot, style) => {
    const body = actor.bounds(),
      height = Math.max(0.01, body.max.y - body.min.y);
    let head = actor.headBounds ? actor.headBounds() : null;
    if (head && head.max.y - head.min.y > height * 0.9) head = null;
    const top = head ? Math.max(head.max.y, body.max.y - height * 0.02) : body.max.y,
      headBottom = head ? head.min.y : body.max.y - height * 0.13,
      headH = Math.max(0.01, top - headBottom),
      below = Math.max(0, headBottom - body.min.y),
      cropped = style && style.framing === MT.HEADS_TOP_HALF;
    if (shot === MT.WIDE || shot === MT.AERIAL) return { hi: body.max.y, lo: body.min.y, headH, height };
    if (shot === MT.EXTREME_CLOSE) return { hi: top + headH * 0.05, lo: headBottom - headH * 0.1, headH, height };
    const rule = FRAMING[shot] || FRAMING.medium;
    const lo = Math.max(body.min.y + below * (cropped && shot !== MT.MEDIUM ? Math.max(rule.body, 0.45) : rule.body), headBottom - headH * rule.heads);
    return { hi: top + headH * 0.08, lo: Math.min(lo, headBottom - headH * 0.1), headH, height };
  };
  const sizeShot = (S, cam, tgt, subjects, shot, issues) => {
    const bigHead = subjects.some((A) => {
      const f = GEN.framingOf(A.actor, shot, S.style);
      return f.headH / f.height > BIG_HEAD_SHARE;
    });
    const want = (bigHead ? BIG_HEAD_SIZE : SHOT_SIZE)[shot];
    if (!want || !subjects.length || (S.stg.camera || {}).focusProp) return;
    cam.updateMatrixWorld(true);
    let top = -Infinity,
      bot = Infinity,
      headTopY = -Infinity,
      lowY = Infinity,
      left = Infinity,
      right = -Infinity;
    const v = new T.Vector3();
    for (const A of subjects) {
      const bounds = A.actor.bounds(),
        frame = GEN.framingOf(A.actor, shot, S.style),
        head = bounds.getCenter(v.clone()),
        low = head.clone();
      head.y = frame.hi;
      low.y = frame.lo;
      headTopY = Math.max(headTopY, head.y);
      lowY = Math.min(lowY, low.y);
      const qh = project(cam, head),
        ql = project(cam, low);
      if (qh.z > 1 || ql.z > 1) return;
      top = Math.max(top, qh.y, ql.y);
      bot = Math.min(bot, qh.y, ql.y);
      for (const x of [bounds.min.x, bounds.max.x]) {
        const qx = project(cam, new T.Vector3(x, (frame.hi + frame.lo) / 2, (bounds.min.z + bounds.max.z) / 2));
        left = Math.min(left, qx.x);
        right = Math.max(right, qx.x);
      }
    }
    if (!isFinite(top)) return;
    const tallest = Math.max(...subjects.map((A) => A.actor.bounds().getSize(v.clone()).y)),
      wide = (right - left) / 2,
      frac = Math.max(((top - bot) / 2) * (shot === MT.WIDE ? Math.max(1, 1.6 / Math.max(0.1, tallest)) : 1), shot === MT.WIDE ? 0 : (wide * want[1]) / 0.9),
      inside = top <= 0.98 && bot >= -0.98;
    if (frac >= want[0] && frac <= want[2] && (inside || shot === MT.WIDE)) return;
    const center = new T.Vector3();
    for (const A of subjects) center.add(A.actor.bounds().getCenter(v.clone()));
    center.divideScalar(subjects.length);
    const midY = (headTopY + lowY) / 2;
    if (isFinite(midY)) center.y = midY;
    const dir = cam.position.clone().sub(center);
    const d = dir.length();
    if (d < 1e-3) return;
    dir.normalize();
    const goal = U.clamp((d * frac) / want[1], 0.7, 30);
    const start = cam.position.clone();
    const stepN = Math.max(1, Math.ceil(Math.abs(goal - d) / 0.2));
    let done = d;
    for (let i = 1; i <= stepN; i++) {
      const dd = d + ((goal - d) * i) / stepN;
      const p = center.clone().addScaledVector(dir, dd);
      if (S.occluders.length && solidsOf(S).some((x) => x.b.containsPoint(p) && !x.b.containsPoint(center))) break;
      if (inStage(S, start) && !inStage(S, p)) break;
      done = dd;
    }
    if (Math.abs(done - d) < 0.05 && inside) return;
    tgt.copy(center);
    cam.position.copy(tgt).addScaledVector(dir, done);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(true);
    issues.push(MT.SHOT_RESIZED + shot + MT.SHOT_RESIZED_2 + (done - d).toFixed(1) + MT.M);
  };
  const framedShare = (cam, pts, m) => {
    cam.updateMatrixWorld(true);
    let n = 0;
    for (const p of pts) {
      const q = project(cam, p);
      if (q.z < 1 && Math.abs(q.x) <= m && Math.abs(q.y) <= m) n++;
    }
    return pts.length ? n / pts.length : 1;
  };
  const rescueFraming = (S, cam, tgt, subjects, pts, shot, issues) => {
    if (!subjects.length || !pts.length) return;
    const share0 = framedShare(cam, pts, 1);
    const front = subjects[0].actor.group.rotation.y;
    const g = subjects[0].actor.group.position;
    const toCam = Math.atan2(cam.position.x - g.x, cam.position.z - g.z);
    const works = reaches(subjects[0].def) && shot !== MT.INSERT;
    const away = shot !== MT.WIDE && shot !== MT.AERIAL && Math.cos(toCam - front) < (works ? 0 : -0.5);
    const ideal = works ? (Math.PI * 70) / 180 : 0;
    if (share0 >= 0.85 && !away) return;
    const center = new T.Vector3();
    for (const p of pts) center.add(p);
    center.divideScalar(pts.length);
    const look = new T.Vector3(center.x, tgt.y, center.z);
    const boxes = S.occluders.length ? solidsOf(S).filter((x) => !x.b.containsPoint(look)) : [];
    const free = (v) => inStage(S, v) && !boxes.some((x) => x.b.containsPoint(v)) && (!S.occluders.length || rayClear(S, look, v));
    const close = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT;
    const dists = close ? [1.2, 1.5, 1.9, 2.4] : shot === MT.MEDIUM ? [2.2, 2.8, 3.4, 1.8, 4.2] : [3.6, 4.6, 2.9, 2.3, 5.6];
    const save = cam.position.clone();
    const y = cam.position.y;
    let best = null;
    for (const d of dists)
      for (let i = 0; i < 16; i++) {
        const off = Math.ceil(i / 2) * (Math.PI / 8) * (i % 2 ? 1 : -1);
        const a = front + off;
        const v = new T.Vector3(look.x + Math.sin(a) * d, y, look.z + Math.cos(a) * d);
        if (!free(v)) continue;
        cam.position.copy(v);
        cam.lookAt(look);
        const share = framedShare(cam, pts, 0.95);
        const score = share - (Math.abs(Math.abs(off) - ideal) / Math.PI) * 0.3 - Math.abs(d - dists[0]) * 0.02;
        if (!best || score > best.score) best = { v, score, share };
      }
    if (best && (away ? best.share >= Math.max(0.85, share0 - 0.05) : best.share > share0)) {
      cam.position.copy(best.v);
      tgt.copy(look);
      issues.push(MT.CAMERA_REFRAMED_ON + subjects[0].def.cast);
    } else cam.position.copy(save);
    cam.lookAt(tgt);
    const fov0 = cam.fov;
    while (framedShare(cam, pts, 1) < 0.85 && cam.fov < 68) {
      cam.fov += 4;
      cam.updateProjectionMatrix();
    }
    if (cam.fov !== fov0) issues.push(MT.FOV_WIDENED_TO + cam.fov);
  };
  const dimNearSurfaces = (S) => {
    if (!S.env || !S.env.lights) return;
    const solids = [];
    S.scene.traverse((o) => {
      if (!o.isMesh || !o.visible || S.actors.some((A) => isUnder(o, A.actor.group))) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || m.transparent || (m.emissive && m.emissiveIntensity > 0.3 && m.emissive.getHex() !== 0) || m.isMeshBasicMaterial) return;
      solids.push(o);
    });
    if (!solids.length) return;
    const cfg = S.stg.camera || {},
      focusBox = cfg.focusProp ? propBounds(S, cfg.focusProp) : null;
    if (!focusBox) return;
    focusBox.expandByScalar(0.3);
    const ray = new T.Raycaster(),
      dirs = [];
    for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) if (x || y || z) dirs.push(new T.Vector3(x, y, z).normalize());
    const wp = new T.Vector3();
    for (const light of S.env.lights) {
      if (!light.isPointLight && !light.isSpotLight) continue;
      light.getWorldPosition(wp);
      if (!focusBox.containsPoint(wp)) continue;
      let near = Infinity;
      for (const d of dirs) {
        ray.set(wp, d);
        ray.far = 0.6;
        const hit = ray.intersectObjects(solids, false)[0];
        if (hit) near = Math.min(near, hit.distance);
      }
      if (near >= 0.6 || !(light.intensity > 0)) continue;
      const f = Math.max(0.02, Math.min(1, (8 * near * near) / light.intensity));
      if (f >= 1) continue;
      light.userData.dim = (light.userData.dim || 1) * f;
      light.intensity *= f;
    }
  };
  const dimNearActors = (S, times) => {
    if (!S.actors.length || !S.env || !S.env.lights) return;
    const pts = [];
    for (const t of times) {
      for (const A of S.actors) updateActor(A, S, t, S.camera);
      for (const A of S.actors) pts.push(...GEN.actorBounds(A.actor, true));
    }
    const wp = new T.Vector3();
    for (const light of S.env.lights) {
      if (!light.isPointLight && !light.isSpotLight) continue;
      light.getWorldPosition(wp);
      let d = Infinity;
      for (const p of pts) d = Math.min(d, p.distanceTo(wp));
      if (d >= 1.8) continue;
      const f = Math.max(0.02, (d / 1.8) * (d / 1.8));
      light.userData.dim = (light.userData.dim || 1) * f;
      light.intensity *= f;
    }
  };
  const keepActorsClear = (S) => {
    const boxes = walkBoxes(S);
    if (!boxes.length) return;
    for (const A of S.actors) {
      if (!Array.isArray(A.def.at) || A.def.moveTo || A.def.heldBy || MT.REST_ACTION_RE.test(A.def.action || MT.EMPTY)) continue;
      const g = A.actor.group,
        position = g.position.clone(),
        rotation = g.rotation.clone();
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
      A.actor.sample(A.def.action || MT.IDLE, 0, false);
      const sz = A.actor.bounds().getSize(new T.Vector3());
      g.position.copy(position);
      g.rotation.copy(rotation);
      g.updateMatrixWorld(true);
      const r = Math.min(MT.ACTOR_FOOT_MAX, Math.max(MT.ACTOR_FOOT_RADIUS, Math.min(sz.x, sz.z) / 2));
      let [x, z] = A.def.at;
      for (let pass = 0; pass < MT.ACTOR_CLEAR_PASSES; pass++) {
        let moved = false;
        for (const { bb } of boxes) {
          const x0 = bb.min.x - r,
            x1 = bb.max.x + r,
            z0 = bb.min.z - r,
            z1 = bb.max.z + r;
          if (x <= x0 || x >= x1 || z <= z0 || z >= z1) continue;
          const exits = [
            [x0 - x, 0],
            [x1 - x, 0],
            [0, z0 - z],
            [0, z1 - z],
          ].sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));
          x += exits[0][0];
          z += exits[0][1];
          moved = true;
        }
        if (!moved) break;
      }
      if (x !== A.def.at[0] || z !== A.def.at[1]) A.def = Object.assign({}, A.def, { at: [x, z] });
    }
  };
  const separateActors = (S, stg, viewPos) => {
    const list = S.actors.filter((A) => Array.isArray(A.def.at) && !A.def.moveTo);
    if (list.length < 2) return;
    const size = new Map();
    for (const A of list) {
      const g = A.actor.group,
        position = g.position.clone(),
        rotation = g.rotation.clone();
      g.position.set(0, 0, 0);
      g.rotation.set(0, 0, 0);
      A.actor.sample(A.def.action || MT.IDLE, 0, false);
      const b = A.actor.bounds(),
        sz = b.getSize(new T.Vector3());
      size.set(A, { h: Math.max(0.05, sz.y), w: Math.max(0.05, sz.x), d: Math.max(0.05, sz.z) });
      g.position.copy(position);
      g.rotation.copy(rotation);
      g.updateMatrixWorld(true);
    }
    const cp = viewPos ? viewPos : stg.camera && stg.camera.pos ? stg.camera.pos : S.L.camera && S.L.camera.pos ? S.L.camera.pos : null;
    const toward = (at) => {
      const v = cp ? [cp[0] - at[0], cp[2] - at[1]] : [0, 1],
        l = Math.hypot(v[0], v[1]) || 1;
      return [v[0] / l, v[1] / l];
    };
    for (let pass = 0; pass < 3; pass++)
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i],
            b = list[j],
            dist = Math.hypot(a.def.at[0] - b.def.at[0], a.def.at[1] - b.def.at[1]),
            sa = size.get(a),
            sb = size.get(b);
          const [big, small] = sa.h >= sb.h ? [a, b] : [b, a],
            sB = size.get(big),
            sS = size.get(small);
          if (sS.h < sB.h * 0.55) {
            const need = (sB.d + sS.d) / 2 + 0.02;
            if (dist >= 0.45 || small.def.heldBy) continue;
            const f = toward(big.def.at);
            small.def = Object.assign({}, small.def, {
              at: [big.def.at[0] + f[0] * need, big.def.at[1] + f[1] * need],
              y: Math.max(0, Math.min(small.def.y || 0, sB.h * 0.45 - sS.h / 2)),
              heldBy: big.def.cast,
            });
            continue;
          }
          if (MT.CONTACT_ACTION_RE.test((a.def.action || MT.EMPTY) + MT.SYMBOL_20 + (b.def.action || MT.EMPTY))) continue;
          const need = Math.max(0.45, (sa.w + sb.w) / 2 + 0.04),
            f = toward([(a.def.at[0] + b.def.at[0]) / 2, (a.def.at[1] + b.def.at[1]) / 2]),
            side = [f[1], -f[0]],
            lateral = Math.abs((b.def.at[0] - a.def.at[0]) * side[0] + (b.def.at[1] - a.def.at[1]) * side[1]);
          if (dist >= need && (!S.flatView || lateral >= need * 0.85 || Math.abs(sa.h - sb.h) > Math.max(sa.h, sb.h) * 0.35)) continue;
          let dir = [b.def.at[0] - a.def.at[0], b.def.at[1] - a.def.at[1]];
          if (Math.hypot(dir[0], dir[1]) < 1e-4 || Math.abs(dir[0] * side[0] + dir[1] * side[1]) < 1e-4) dir = side;
          const sign = Math.sign(dir[0] * side[0] + dir[1] * side[1]) || 1,
            push = (need - Math.abs((b.def.at[0] - a.def.at[0]) * side[0] + (b.def.at[1] - a.def.at[1]) * side[1])) / 2;
          a.def = Object.assign({}, a.def, { at: [a.def.at[0] - side[0] * push * sign, a.def.at[1] - side[1] * push * sign] });
          b.def = Object.assign({}, b.def, { at: [b.def.at[0] + side[0] * push * sign, b.def.at[1] + side[1] * push * sign] });
        }
  };
  const hideBlockers = (S, cam, focus, shot, issues) => {
    const cfg = S.stg.camera || {};
    const tight = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT;
    if ((!tight && !S.flatView) || shot === MT.WIDE || shot === MT.AERIAL || (!focus.length && !cfg.focusProp)) return;
    const points = [];
    for (const A of focus) points.push(A.actor.anchor(MT.HEAD), A.actor.anchor(MT.BODY));
    if (!focus.length) {
      const box = propBounds(S, cfg.focusProp);
      if (box) points.push(box.getCenter(new T.Vector3()));
    }
    if (!points.length) return;
    const ray = new T.Raycaster();
    for (const A of S.actors) {
      if (focus.includes(A) || !A.actor.group.visible) continue;
      let block = A.actor.bounds().expandByScalar(0.25).containsPoint(cam.position);
      if (!tight) block = false;
      if (!block && S.flatView && shot !== MT.WIDE && shot !== MT.AERIAL) {
        const inside = (q) => q.z < 1 && Math.abs(q.x) < 1 && Math.abs(q.y) < 1,
          box = A.actor.bounds(),
          seen = [];
        for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) seen.push(inside(project(cam, new T.Vector3(box.min.x + ((box.max.x - box.min.x) * i) / 4, box.min.y + ((box.max.y - box.min.y) * j) / 4, (box.min.z + box.max.z) / 2))));
        const head = project(cam, A.actor.anchor(MT.HEAD));
        block = seen.some(Boolean) && (head.z >= 1 || head.y > 1 || Math.abs(head.x) > 1);
      }
      for (const p of tight ? points : []) {
        if (block) break;
        const dir = p.clone().sub(cam.position),
          len = dir.length();
        ray.set(cam.position, dir.normalize());
        ray.far = Math.max(0.01, len - 0.08);
        block = ray.intersectObject(A.actor.group, true).some((h) => h.object.isMesh && h.object.visible);
      }
      if (block) {
        A.actor.group.visible = false;
        issues.push(A.def.cast + MT.LEFT_OUT_BLOCKED_FOCUS);
      }
    }
  };
  const cameraSightClear = (S, from, to) => {
    const delta = to.clone().sub(from),
      distance = delta.length();
    if (distance < 0.25) return false;
    const ray = new T.Raycaster(from, delta.normalize(), 0.05, distance - 0.18);
    const detail = (S.stg.camera || {}).focusProp || (S.stg.camera || {}).shot === MT.INSERT;
    const roots = detail ? S.scene.children : S.scene.children.filter((o) => !S.actors.some((A) => A.actor.group === o));
    return !ray.intersectObjects(roots, true).some((h) => {
      if (!h.object.material || h.object.material.transparent) return false;
      for (let o = h.object; o && o !== S.scene; o = o.parent) if (!o.visible) return false;
      return true;
    });
  };
  const cutAway = (S, from, points) => {
    let removed = 0;
    for (const to of points)
      for (let guard = 0; guard < 6; guard++) {
        const delta = to.clone().sub(from),
          distance = delta.length();
        if (distance < 0.25) break;
        const ray = new T.Raycaster(from, delta.normalize(), 0.05, distance - 0.18);
        const roots = S.scene.children.filter((o) => !S.actors.some((A) => A.actor.group === o));
        const hit = ray.intersectObjects(roots, true).find((h) => {
          if (!h.object.isMesh || !h.object.material || h.object.material.transparent) return false;
          for (let o = h.object; o && o !== S.scene; o = o.parent) if (!o.visible) return false;
          return true;
        });
        if (!hit) break;
        hit.object.visible = false;
        removed++;
      }
    S.solids = null;
    return removed;
  };
  const interiorCameraFree = (S, pos, target) => !solidsOf(S).some((x) => x.b.containsPoint(pos)) && cameraSightClear(S, pos, target);
  const fitInteriorCamera = (S, cam, requested, target, issues) => {
    for (const A of S.actors) updateActor(A, S, S.t0, cam);
    const definition = S.stg.camera || {},
      shot = definition.shot || MT.MEDIUM;
    const subjects = framedCast(S, definition.focus, definition.shot || MT.MEDIUM);
    const detail = definition.focusProp || shot === MT.INSERT;
    const points = [],
      sightPoints = [];
    const bounds = detail && propBounds(S, definition.focusProp);
    if (bounds) for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new T.Vector3(x, y, z));
    for (const A of detail ? [] : subjects) {
      const head = A.actor.anchor(MT.HEAD);
      const chest = A.actor.anchor(MT.BODY);
      sightPoints.push(head, head.clone().lerp(chest, 0.45), chest);
      points.push(...GEN.actorBounds(A.actor, shot !== MT.WIDE));
    }
    if (subjects.length && !detail && !definition.target) {
      target.set(0, 0, 0);
      const anchors = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE ? sightPoints.filter((_, i) => i % 3 === 0) : sightPoints;
      for (const p of anchors) target.add(p);
      target.divideScalar(anchors.length);
      if (shot === MT.WIDE) target.y -= 0.25;
    }
    if (!sightPoints.length || detail) {
      sightPoints.length = 0;
      sightPoints.push(target.clone());
    }
    const yaw = Math.atan2(requested.x - target.x, requested.z - target.z);
    const minimum = shot === MT.WIDE ? 2.2 : shot === MT.MEDIUM ? 1.1 : 0.6;
    const preferred = Math.max(minimum, requested.distanceTo(target));
    const candidates = [requested.clone(), new T.Vector3(...S.L.camera.pos)];
    const distances = [preferred, 0.85, 1.2, 1.6, 2.2, 3, 4, 5.5];
    for (const distance of distances)
      for (let i = 0; i < 16; i++) {
        const angle = yaw + ((Math.ceil(i / 2) * Math.PI) / 8) * (i % 2 ? 1 : -1);
        for (const height of [target.y + 0.1, target.y + 0.4]) {
          candidates.push(new T.Vector3(target.x + Math.sin(angle) * distance, Math.max(0.5, height), target.z + Math.cos(angle) * distance));
        }
      }
    let best = null,
      fallback = null;
    const originalFov = cam.fov;
    for (const pos of candidates) {
      if (pos.distanceTo(target) < minimum) continue;
      if (solidsOf(S).some((x) => x.b.containsPoint(pos))) continue;
      const visible = sightPoints.filter((p) => cameraSightClear(S, pos, p)).length / sightPoints.length;
      if (!fallback || Math.abs(pos.distanceTo(target) - preferred) < Math.abs(fallback.distanceTo(target) - preferred) - 0.05) fallback = pos.clone();
      if (visible < 0.5) continue;
      for (const fov of [originalFov, Math.max(originalFov, 48), Math.max(originalFov, 60)]) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
        cam.position.copy(pos);
        cam.lookAt(target);
        const share = framedShare(cam, points, 0.92);
        const turn = Math.acos(U.clamp(Math.cos(Math.atan2(pos.x - target.x, pos.z - target.z) - yaw), -1, 1));
        const projected = points.map((p) => project(cam, p));
        const size = projected.length ? (Math.max(...projected.map((p) => p.y)) - Math.min(...projected.map((p) => p.y))) / 2 : 0;
        const desiredSize = shot === MT.WIDE ? 0.42 : shot === MT.MEDIUM ? 0.6 : 0.72;
        const sizingPenalty = points.length ? Math.abs(size - desiredSize) * 2 : 0;
        let facingScore = 0;
        if (!detail && subjects.length && definition.view !== MT.REAR && shot !== MT.OVER_SHOULDER) {
          for (const A of subjects) {
            const g = A.actor.group,
              direction = pos.clone().sub(g.position);
            direction.y = 0;
            direction.normalize();
            facingScore += direction.x * Math.sin(g.rotation.y) + direction.z * Math.cos(g.rotation.y);
          }
          facingScore /= subjects.length;
          facingScore = definition.view === MT.PROFILE ? -Math.abs(facingScore) : Math.min(0, facingScore);
        }
        const score = visible * 8 + share * 3 + facingScore * 3 - sizingPenalty - Math.abs(pos.distanceTo(target) - preferred) * 0.15 - turn * 0.6 - (fov - originalFov) * 0.015;
        if (!best || score > best.score) best = { pos: pos.clone(), fov, score, visible };
      }
    }
    if (best) {
      cam.position.copy(best.pos);
      cam.fov = best.fov;
      if (best.pos.distanceTo(requested) > 0.1) issues.push(MT.INTERIOR_CAMERA_RELOCATED_FOR_CLEAR_SUBJECT_VISIBILITY);
    } else {
      cam.position.copy(fallback || requested);
      cam.fov = originalFov;
      const removed = cutAway(S, cam.position, sightPoints);
      issues.push(removed ? MT.SET_CUTAWAY_FOR_VIEW : MT.NO_UNOBSTRUCTED_INTERIOR_CAMERA_FOUND_STAGING_REQUIRES_REVIEW);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(target);
    cam.updateMatrixWorld(true);
    return { pos: cam.position.clone(), tgt: target, issues };
  };
  const fitCamera = (S, camDef, sampleTimes) => {
    const cam = S.camera;
    const pos = new T.Vector3(...camDef.pos),
      tgt = new T.Vector3(...camDef.target);
    cam.fov = camDef.fov;
    cam.position.copy(pos);
    cam.lookAt(tgt);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    const issues = [];
    if (S.interior) return fitInteriorCamera(S, cam, pos, tgt, issues);
    clearCamera(S, cam, tgt, issues);
    if (!S.actors.length) return { pos: cam.position.clone(), tgt, issues };
    const focusKey = (S.stg.camera || {}).focus;
    const subjects = framedCast(S, focusKey, (S.stg.camera || {}).shot || MT.MEDIUM);
    const pts = [];
    const shot = (S.stg.camera || {}).shot || MT.MEDIUM;
    const upper = shot !== MT.WIDE && shot !== MT.AERIAL && shot !== MT.HIGH && shot !== MT.LOW;
    for (const t of sampleTimes) {
      for (const A of S.actors) updateActor(A, S, t, cam);
      for (const A of subjects) pts.push(...GEN.actorBounds(A.actor, upper));
    }
    for (const A of subjects) if (reaches(A.def)) pts.push(new T.Vector3(A.def.faceAt[0], 1.0, A.def.faceAt[1]));
    const margin = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT ? 1.15 : 0.9;
    const outside = () => {
      cam.updateMatrixWorld(true);
      let worst = 0;
      for (const p of pts) {
        const q = project(cam, p);
        if (q.z > 1) worst = Math.max(worst, 5);
        else worst = Math.max(worst, Math.abs(q.x) - margin, (q.y > 0 ? q.y : -q.y) - margin);
      }
      return worst;
    };
    const back = pos.clone().sub(tgt).normalize();
    let steps = 0;
    if (shot !== MT.CLOSE && shot !== MT.EXTREME_CLOSE && shot !== MT.INSERT) {
      while (outside() > 0 && steps < 60) {
        const nx = cam.position.clone().addScaledVector(back, 0.25);
        if (S.occluders.length && solidsOf(S).some((x) => x.b.containsPoint(nx) && !x.b.containsPoint(tgt))) break;
        if (inStage(S, cam.position) && !inStage(S, nx)) break;
        cam.position.copy(nx);
        steps++;
      }
      if (steps) issues.push(MT.CAMERA_PULLED_BACK + (steps * 0.25).toFixed(1) + MT.M_TO_FIT_ACTORS);
    }
    for (const A of S.actors) {
      if (focusKey && subjects.length && !subjects.includes(A)) continue;
      const h = A.actor.anchor(MT.HEAD);
      const dd = cam.position.distanceTo(h);
      if (dd < 0.7) {
        cam.position.addScaledVector(back, 0.8 - dd);
        issues.push(MT.CAMERA_TOO_CLOSE_TO + A.def.cast);
      }
      for (const bn of [MT.BODY, MT.BASE]) {
        const bp = A.actor.anchor(bn);
        if (!bp) continue;
        const db = cam.position.distanceTo(bp);
        if (db < 0.6) {
          cam.position.addScaledVector(back, 0.7 - db);
          issues.push(MT.CAMERA_TOO_CLOSE_TO + A.def.cast);
        }
      }
    }
    if (cam.position.y < 0.15) cam.position.y = 0.15;
    if (S.occluders.length) {
      const ray = new T.Raycaster();
      const dirToCam = cam.position.clone().sub(tgt);
      const dist = dirToCam.length();
      ray.set(tgt, dirToCam.normalize());
      ray.far = dist;
      const hits = ray.intersectObjects(S.occluders, true).filter((h) => h.object.material && !h.object.material.transparent && h.distance > 0.3);
      if (hits.length) {
        const h = hits[0];
        cam.position.copy(tgt).addScaledVector(dirToCam, Math.max(0.8, h.distance - 0.25));
        issues.push(MT.CAMERA_WAS_BEHIND + (h.object.parent && h.object.parent.name ? h.object.parent.name : h.object.name || MT.GEOMETRY) + MT.MOVED_IN_FRONT);
      }
    }
    limitPitch(cam, tgt, shot, issues);
    clearCamera(S, cam, tgt, issues);
    reangleCamera(S, cam, pos, tgt, shot, issues);
    cam.lookAt(tgt);
    rescueFraming(S, cam, tgt, subjects, pts, shot, issues);
    sizeShot(S, cam, tgt, subjects, shot, issues);
    cam.updateMatrixWorld(true);
    for (const A of subjects) {
      const bpts = GEN.actorBounds(A.actor, upper);
      const tight = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE || shot === MT.INSERT;
      const headIn = framedShare(cam, [A.actor.anchor(MT.HEAD)], 1) > 0.5;
      if (tight ? !headIn && shot !== MT.INSERT : framedShare(cam, bpts, 1) < 0.6) issues.push(A.def.cast + MT.IS_MOSTLY_OUT_OF_FRAME);
      const head = project(cam, A.actor.anchor(MT.HEAD));
      const feet = project(cam, A.actor.anchor(MT.BASE));
      if (shot === MT.WIDE && Math.abs(head.y - feet.y) < 0.08) issues.push(A.def.cast + MT.LOOKS_VERY_SMALL_IN_THE_WIDE_SHOT);
    }
    if (S.actors.length > 1) {
      for (let i = 0; i < S.actors.length; i++)
        for (let j = i + 1; j < S.actors.length; j++) {
          const a = S.actors[i].def,
            b = S.actors[j].def;
          if (!a.moveTo && !b.moveTo && !a.heldBy && !b.heldBy && Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) < 0.45) issues.push(a.cast + MT.AND + b.cast + MT.STAND_INSIDE_EACH_OTHER_CLOSER_THAN_0);
        }
    }
    return { pos: cam.position.clone(), tgt, issues };
  };
  const moveCamera = (S, u, t) => {
    const cam = S.camera;
    const c = S.cam0;
    const m = (S.stg.camera || {}).move || MT.STATIC;
    const amt = (S.stg.camera || {}).amount == null ? 1 : S.stg.camera.amount;
    const k = U.ease(u);
    const pos = c.pos.clone(),
      tgt = c.tgt.clone();
    const fwd = tgt.clone().sub(pos);
    const dist = fwd.length();
    fwd.normalize();
    const right = new T.Vector3().crossVectors(fwd, new T.Vector3(0, 1, 0)).normalize();
    const shotKind = (S.stg.camera || {}).shot || MT.MEDIUM,
      reach = shotKind === MT.CLOSE || shotKind === MT.EXTREME_CLOSE ? 0.1 : 0.22;
    switch (m) {
      case MT.STATIC:
        break;
      case MT.DOLLY_IN:
        pos.addScaledVector(fwd, dist * reach * amt * k);
        break;
      case MT.DOLLY_OUT:
        pos.addScaledVector(fwd, dist * reach * amt * (1 - k));
        break;
      case MT.PAN_LEFT:
      case MT.PAN_RIGHT: {
        const ang = (m === MT.PAN_LEFT ? 1 : -1) * 14 * amt * DEG * (k - 0.5);
        tgt
          .sub(pos)
          .applyAxisAngle(new T.Vector3(0, 1, 0), ang)
          .add(pos);
        break;
      }
      case MT.ORBIT_LEFT:
      case MT.ORBIT_RIGHT: {
        const ang = (m === MT.ORBIT_LEFT ? -1 : 1) * 22 * amt * DEG * (k - 0.5);
        pos
          .sub(tgt)
          .applyAxisAngle(new T.Vector3(0, 1, 0), ang)
          .add(tgt);
        break;
      }
      case MT.CRANE_UP:
      case MT.CRANE_DOWN: {
        const dy = (m === MT.CRANE_UP ? 1 : -1) * 1.3 * amt * (k - 0.5);
        pos.y += dy;
        tgt.y += dy * 0.3;
        break;
      }
      case MT.TRUCK_LEFT:
      case MT.TRUCK_RIGHT: {
        const dx = (m === MT.TRUCK_LEFT ? -1 : 1) * 1.6 * amt * (k - 0.5);
        pos.addScaledVector(right, dx);
        tgt.addScaledVector(right, dx);
        break;
      }
      case MT.FOLLOW: {
        const key = S.stg.camera.follow || (S.actors[0] && S.actors[0].def.cast);
        const A = S.actors.find((x) => x.def.cast === key);
        if (A) {
          const p0 = actorState(A, S.t0).pos,
            p1 = actorState(A, t).pos;
          const dx = p1[0] - p0[0],
            dz = p1[1] - p0[1];
          pos.x += dx;
          pos.z += dz;
          tgt.x += dx;
          tgt.z += dz;
        }
        break;
      }
      case MT.HANDHELD:
        break;
      default:
        pos.addScaledVector(fwd, dist * 0.035 * k);
    }
    if (m !== MT.STATIC && m !== MT.HANDHELD && !S.handheld) {
      pos.x += U.noise(t * 0.23, 11) * 0.012;
      pos.y += U.noise(t * 0.19, 13) * 0.008;
    }
    if (m === MT.HANDHELD || S.handheld) {
      pos.x += U.noise(t * 0.8, 3) * 0.035;
      pos.y += U.noise(t * 0.9, 5) * 0.025;
      tgt.x += U.noise(t * 0.6, 7) * 0.05;
      tgt.y += U.noise(t * 0.7, 9) * 0.03;
    }
    if (S.interior && !interiorCameraFree(S, pos, tgt)) {
      const desired = pos.clone();
      pos.copy(c.pos);
      for (let i = 1; i <= 12; i++) {
        const candidate = c.pos.clone().lerp(desired, i / 12);
        if (!interiorCameraFree(S, candidate, tgt)) break;
        pos.copy(candidate);
      }
    }
    if (cam.isOrthographicCamera) {
      cam.zoom = c.pos.distanceTo(c.tgt) / Math.max(0.1, pos.distanceTo(tgt));
      cam.updateProjectionMatrix();
    }
    cam.position.copy(pos);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(true);
    S.focusDist = pos.distanceTo(tgt);
  };
  const GRADE = {
    neutral: { tint: [1, 1, 1], lift: [0, 0, 0], sat: 1, con: 1.02 },
    teal: { tint: [0.9, 1.0, 1.04], lift: [0.0, 0.012, 0.022], sat: 0.82, con: 1.06 },
    cold: { tint: [0.88, 0.96, 1.08], lift: [0.0, 0.01, 0.03], sat: 0.85, con: 1.05 },
    warm: { tint: [1.06, 1.0, 0.9], lift: [0.02, 0.01, 0.0], sat: 1.0, con: 1.04 },
    noir: { tint: [1, 1, 1], lift: [0, 0, 0], sat: 0.12, con: 1.18 },
    bleach: { tint: [1.0, 1.0, 0.98], lift: [0.02, 0.02, 0.02], sat: 0.55, con: 1.15 },
    vintage: { tint: [1.05, 0.98, 0.86], lift: [0.04, 0.03, 0.02], sat: 0.75, con: 0.98 },
  };
  const gradePass = (name) => {
    const G = GRADE[name] || GRADE.neutral;
    return new X.ShaderPass({ uniforms: { tDiffuse: { value: null }, uTint: { value: new T.Vector3(...G.tint) }, uLift: { value: new T.Vector3(...G.lift) }, uSat: { value: G.sat }, uCon: { value: G.con } }, vertexShader: MT.VARYING_VEC2_VUV_VOID_MAIN_VUV_UV, fragmentShader: MT.UNIFORM_SAMPLER2D_TDIFFUSE_UNIFORM_VEC3_UTINT_UNIFORM });
  };
  const envFor = (S, renderer) => {
    const key = S.locKey + MT.SYMBOL_20 + S.time + MT.SYMBOL_20 + S.stg.props.length + MT.SYMBOL_20 + (S.stg.hide || []).join(MT.SYMBOL_14);
    if (envCache.has(key)) return envCache.get(key);
    const rt = new T.WebGLCubeRenderTarget(256, { type: T.HalfFloatType });
    const cc = new T.CubeCamera(0.1, 1500, rt);
    cc.position.set(S.L.stage.center[0], 1.6, S.L.stage.center[1]);
    const hidden = [];
    for (const A of S.actors) {
      if (A.actor.group.visible) {
        A.actor.group.visible = false;
        hidden.push(A.actor.group);
      }
    }
    cc.update(renderer, S.scene);
    for (const h of hidden) h.visible = true;
    const pm = new T.PMREMGenerator(renderer);
    const tex = pm.fromCubemap(rt.texture).texture;
    pm.dispose();
    rt.dispose();
    if (envCache.size > 12) {
      const first = envCache.keys().next().value;
      try {
        envCache.get(first).dispose();
      } catch (e) {
        void e;
      }
      envCache.delete(first);
    }
    envCache.set(key, tex);
    return tex;
  };
  GEN.buildShot = (ctx, stg, opts) => {
    opts = opts || {};
    const spec = ctx.spec;
    const G = spec.gen || {};
    const C = cleanGen(spec);
    const L = C.locations[stg.location];
    if (!L) throw new Error(MT.GEN3D_LOCATION + stg.location + MT.MISSING);
    if (!stg.__clean) {
      const v = GEN.validateStaging(stg, { locations: C.locations, cast: Object.keys(G.cast || {}) }).value;
      Object.defineProperty(v, MT.CLEAN, { value: true, enumerable: false });
      stg = v;
    }
    const time = stg.time || L.time || MT.DAY;
    const tp = Object.assign({}, TIME[time] || TIME.day);
    const interior = L.interior || time === MT.INTERIOR || time === MT.INTERIOR_DARK;
    const W = ctx.W,
      H = ctx.H;
    const renderer = ME.T3.renderer(W, H, { shadows: true });
    const scene = new T.Scene();
    const S = { locRoot: null, L, stg, scene, time, tp, interior, locKey: stg.location, actors: [], occluders: [], disposables: [], dur: stg.beatDur || ctx.dur || 5, t0: stg.tOffset || 0, shotDur: ctx.dur || 5, style: G.style || {}, characterMotion: G.characterMotion === true };
    const env = GEN.newBuildEnv({ materials: L.materials, defs: L.defs, root: scene, shadowBudget: ctx.preview ? 1 : 3 });
    S.env = env;
    if (interior) scene.background = new T.Color(L.background || tp.background || MT.VALUE_101010);
    else {
      const dome = skyDome(L, tp, time);
      scene.add(dome);
      S.disposables.push(dome.geometry, dome.material);
      if (time === MT.NIGHT && (!L.sky || L.sky.stars !== false)) {
        const st = stars(900, 7);
        scene.add(st);
        S.disposables.push(st.geometry, st.material);
      }
    }
    const fogCol = new T.Color((L.fog && L.fog.color) || tp.fog || MT.VALUE_888888);
    scene.fog = new T.FogExp2(fogCol, L.fog ? L.fog.density : 0.008);
    const hasOwnSun = (L.nodes || []).some((n) => n.shape === MT.LIGHT && n.type === MT.SUN);
    const hasOwnHemi = (L.nodes || []).some((n) => n.shape === MT.LIGHT && (n.type === MT.HEMI || n.type === MT.AMBIENT));
    if (!hasOwnHemi) {
      const hemi = new T.HemisphereLight(tp.hemiSky, tp.hemiGround, tp.hemiI * (L.ambient == null ? 1 : L.ambient));
      scene.add(hemi);
    }
    if (tp.sun && !hasOwnSun && !interior) {
      const sun = new T.DirectionalLight(tp.sun, tp.sunI);
      const sp = new T.Vector3().setFromSphericalCoords(60, (90 - tp.elev) * DEG, tp.az * DEG);
      const c = L.stage.center;
      sun.position.set(c[0] + sp.x, sp.y, c[1] + sp.z);
      sun.target.position.set(c[0], 0, c[1]);
      scene.add(sun.target);
      sun.castShadow = true;
      env.sun = sun;
      scene.add(sun);
    }
    {
      const sun = env.sun;
      if (sun) {
        const ext = Math.max(L.stage.size[0], L.stage.size[1]) * 0.75 + 8;
        sun.shadow.mapSize.set(ctx.preview ? 1024 : 2048, ctx.preview ? 1024 : 2048);
        const sc = sun.shadow.camera;
        sc.left = -ext;
        sc.right = ext;
        sc.top = ext;
        sc.bottom = -ext;
        sc.near = 1;
        sc.far = 200;
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.025;
        sun.shadow.radius = 3;
      }
    }
    if (!L.ground.none) {
      const gm = { shape: MT.PLANE, size: L.ground.size, pos: [L.stage.center[0], 0, L.stage.center[1]], rot: [-90, 0, 0], mat: L.ground.mat };
      GEN.buildNodes([gm], env, scene);
    }
    const locRoot = new T.Group();
    locRoot.name = MT.LOCATION;
    S.locRoot = locRoot;
    scene.add(locRoot);
    GEN.buildNodes(L.nodes, env, locRoot);
    if (stg.hide && stg.hide.length) locRoot.traverse((o) => o.name && stg.hide.includes(o.name) && (o.visible = false));
    GEN.buildNodes(stg.props || [], env, locRoot);
    GEN.addLightGlows(env);
    locRoot.updateMatrixWorld(true);
    locRoot.traverse((o) => {
      if (o.isMesh && o.visible && o.geometry && o.material && !o.material.transparent) {
        if (o.isInstancedMesh) o.computeBoundingBox();
        else o.geometry.computeBoundingBox();
        const bb = o.isInstancedMesh ? o.boundingBox : o.geometry.boundingBox;
        const sz = new T.Vector3();
        bb.getSize(sz);
        if (sz.x * o.scale.x > 0.6 || sz.y * o.scale.y > 0.6) S.occluders.push(o);
      } else if (o.isMesh && o.visible && o.material && o.material.transparent && (o.material.opacity == null || o.material.opacity > 0.1) && o.geometry) {
        const bb = new T.Box3().setFromObject(o);
        const sz = new T.Vector3();
        bb.getSize(sz);
        if (Math.max(sz.x, sz.y, sz.z) > 0.6 && sz.y > 0.4) (S.glass = S.glass || []).push(bb.expandByScalar(0.2));
      }
    });
    const fill = new T.DirectionalLight(tp.fillColor, tp.fill);
    scene.add(fill);
    scene.add(fill.target);
    S.fill = fill;
    if (interior && !(L.nodes || []).some((n) => n.shape === MT.LIGHT && (n.type === MT.POINT || n.type === MT.SPOT))) {
      const key = new T.PointLight(MT.FFE8CC, 30, 22, 2);
      key.position.set(L.stage.center[0], 3.2, L.stage.center[1] + 1);
      key.castShadow = !ctx.preview;
      scene.add(key);
    }
    if (!opts.noActors) {
      for (const a of stg.actors || []) {
        const design = castOf(spec, a.cast);
        const actor = GEN.createActor(design, { style: S.style });
        if (G.drawingMode === MT.VALUE_2D) {
          GEN.revealFace(actor, S.style || {});
          GEN.revealLimbs(actor);
        }
        if (interior)
          actor.model.traverse((o) => {
            if (o.material) o.material.envMapIntensity = 0.25;
          });
        if (a.hold) actor.hold(a.hold.nodes, a.hold.part);
        if (a.ghost) ghostify(actor, S);
        scene.add(actor.group);
        S.actors.push({ def: a, actor, motion: S.characterMotion, segs: null, dur: S.dur });
      }
      S.flatView = G.drawingMode === MT.VALUE_2D;
      separateActors(S, stg);
      keepActorsClear(S);
      for (const A of S.actors) A.segs = planActor(A.def, S.dur, S.characterMotion);
    }
    S.preIssues = [];
    S.lift = {};
    let cam = new T.PerspectiveCamera(40, W / H, 0.05, 3000);
    S.camera = cam;
    for (const actor of S.actors) updateActor(actor, S, S.t0, cam);
    const camDef = flatPitched(S, stg.camera && stg.camera.pos && stg.camera.target ? { pos: stg.camera.pos, target: stg.camera.target, fov: stg.camera.fov || 38 } : shotCamera(S, stg));
    const focusedBounds = propBounds(S, (stg.camera || {}).focusProp);
    if (
      focusedBounds &&
      !focusedBounds
        .clone()
        .expandByScalar(0.08)
        .containsPoint(new T.Vector3(...camDef.target))
    ) {
      camDef.target = focusedBounds.getCenter(new T.Vector3()).toArray();
      stg.camera = Object.assign({}, stg.camera, { target: camDef.target });
    }
    if (stg.camera && stg.camera.fov) camDef.fov = stg.camera.fov;
    const liftKey = (stg.camera || {}).focus;
    const lift = liftKey && S.lift[liftKey] != null ? S.lift[liftKey] : Math.max(0, ...Object.values(S.lift || {}));
    if (lift > 0 && stg.camera && stg.camera.pos) {
      camDef.pos = [camDef.pos[0], camDef.pos[1] + lift, camDef.pos[2]];
      camDef.target = [camDef.target[0], camDef.target[1] + lift, camDef.target[2]];
    }
    const fit = fitCamera(S, camDef, [S.t0, S.t0 + S.shotDur * 0.5, S.t0 + S.shotDur]);
    {
      const focusCast = (stg.camera || {}).focus;
      cam.position.copy(fit.pos);
      cam.lookAt(fit.tgt);
      cam.updateMatrixWorld(true);
      separateActors(S, stg, fit.pos.toArray());
      keepActorsClear(S);
      for (const A of S.actors) {
        A.segs = planActor(A.def, S.dur, S.characterMotion);
        A.poseLocked = false;
      }
      for (const A of S.actors) updateActor(A, S, S.t0, cam);
      hideBlockers(S, cam, focusCast ? S.actors.filter((A) => A.def.cast === focusCast) : [], (stg.camera || {}).shot || MT.MEDIUM, fit.issues);
      for (const A of focusCast ? S.actors.filter((x) => x.def.cast === focusCast && x.actor.group.visible) : []) {
        const sight = [A.actor.anchor(MT.HEAD), A.actor.anchor(MT.BODY)];
        if (sight.every((p) => !cameraSightClear(S, cam.position, p)) && cutAway(S, cam.position, sight)) fit.issues.push(MT.SET_CUTAWAY_FOR_VIEW);
      }
    }
    if (interior)
      for (const light of S.env.lights || []) {
        if (light.isPointLight || light.isSpotLight) {
          light.userData.dim = 0.22;
          light.intensity *= 0.22;
        }
      }
    dimNearActors(S, [S.t0, S.t0 + S.shotDur * 0.5, S.t0 + S.shotDur]);
    dimNearSurfaces(S);
    S.flatDrawing = G.drawingMode === MT.VALUE_2D;
    if (S.flatDrawing) {
      const halfHeight = fit.pos.distanceTo(fit.tgt) * Math.tan((cam.fov * DEG) / 2);
      cam = new T.OrthographicCamera((-halfHeight * W) / H, (halfHeight * W) / H, halfHeight, -halfHeight, 0.05, 3000);
      cam.position.copy(fit.pos);
      cam.lookAt(fit.tgt);
      {
        const focusCast = (stg.camera || {}).focus,
          shotKind = (stg.camera || {}).shot || MT.MEDIUM,
          tight = shotKind === MT.CLOSE || shotKind === MT.EXTREME_CLOSE || shotKind === MT.INSERT,
          detail = tight && !focusCast && !!(stg.camera || {}).focusProp,
          inPicture = (A) => {
            const b = A.actor.bounds();
            return [b.min, b.max, b.getCenter(new T.Vector3())].some((p) => {
              const q = p.clone().project(cam);
              return Math.abs(q.x) < 1 && Math.abs(q.y) < 1;
            });
          },
          needOf = (A) => {
            const b = A.actor.bounds(),
              h = b.max.y - b.min.y,
              frame = GEN.framingOf(A.actor, shotKind, S.style),
              top = shotKind === MT.WIDE || shotKind === MT.AERIAL ? b.max.y + h * 0.04 : frame.hi,
              low = shotKind === MT.WIDE || shotKind === MT.AERIAL ? b.max.y - h * 0.45 : frame.lo;
            let n = 1;
            for (const x of [b.min.x, b.max.x])
              for (const z of [b.min.z, b.max.z])
                for (const y of [top, low]) {
                  const q = new T.Vector3(x, y, z).project(cam);
                  n = Math.max(n, Math.abs(q.x) / 0.96, Math.abs(q.y) / 0.92);
                }
            return n;
          };
        cam.updateMatrixWorld(true);
        cam.updateProjectionMatrix();
        const flatFrame = S.style && S.style.flatCamera;
        if (flatFrame && flatFrame.wideFigure && (shotKind === MT.WIDE || shotKind === MT.AERIAL)) {
          const shown = S.actors.filter((A) => A.actor.group.visible);
          if (shown.length) {
            const boxes = shown.map((A) => A.actor.bounds()),
              tall = Math.max(...boxes.map((b) => b.max.y - b.min.y)),
              feet = Math.min(...boxes.map((b) => b.min.y)),
              mid = boxes.reduce((v, b) => v.add(b.getCenter(new T.Vector3())), new T.Vector3()).multiplyScalar(1 / boxes.length),
              halfFrame = tall / flatFrame.wideFigure / 2;
            cam.left = (-halfFrame * W) / H;
            cam.right = (halfFrame * W) / H;
            cam.top = halfFrame;
            cam.bottom = -halfFrame;
            cam.updateProjectionMatrix();
            const up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1),
              foot = new T.Vector3(mid.x, feet, mid.z).project(cam),
              shift = (foot.y - (-1 + 2 * FLAT_WIDE_FOOT)) * halfFrame;
            cam.position.addScaledVector(up, shift);
            fit.pos.addScaledVector(up, shift);
            fit.tgt.addScaledVector(up, shift);
            cam.updateMatrixWorld(true);
            fit.issues.push(MT.FLAT_WIDE_FRAMED + flatFrame.wideFigure);
          }
        }
        const subjects = [],
          bystanders = [],
          partners = framedCast(S, focusCast, shotKind);
        for (const A of S.actors) {
          if (!A.actor.group.visible) continue;
          if (focusCast ? partners.includes(A) : !detail) subjects.push(A);
          else if (inPicture(A)) bystanders.push(A);
        }
        let need = 1;
        for (const A of subjects) need = Math.max(need, needOf(A));
        need = Math.min(need, 2.2);
        const allow = tight ? Math.max(need, 1.25) : 2.2;
        for (const A of bystanders) {
          const n = needOf(A);
          if (n <= allow) need = Math.max(need, n);
          else {
            A.actor.group.visible = false;
            fit.issues.push(A.def.cast + MT.LEFT_OUT_BLOCKED_FOCUS);
          }
        }
        need = Math.min(need, 2.2);
        if (need > 1.001) {
          cam.left *= need;
          cam.right *= need;
          cam.top *= need;
          cam.bottom *= need;
          cam.updateProjectionMatrix();
          fit.issues.push(MT.FLAT_VIEW_WIDENED + need.toFixed(2));
        }
        if (shotKind !== MT.WIDE && shotKind !== MT.AERIAL)
          for (const A of S.actors) {
            if (!A.actor.group.visible || (focusCast && partners.includes(A)) || !inPicture(A)) continue;
            const head = A.actor.anchor(MT.HEAD).project(cam);
            if (Math.abs(head.x) > 1.02 || head.y > 1.02) {
              A.actor.group.visible = false;
              fit.issues.push(A.def.cast + MT.LEFT_OUT_BLOCKED_FOCUS);
            }
          }
      }
      {
        const view = new T.Vector3();
        cam.getWorldDirection(view);
        if (S.style && S.style.flatCamera && -view.y > FLAT_MIN_RISE) {
          const up = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 1),
            low = cam.position.clone().addScaledVector(up, cam.bottom / cam.zoom),
            deficit = FLAT_FLOOR_MARGIN - low.y;
          if (deficit > 0) {
            cam.position.addScaledVector(view, -deficit / -view.y);
            fit.pos.copy(cam.position);
            cam.updateMatrixWorld(true);
          }
        }
      }
      S.camera = cam;
      scene.fog = null;
      const flatMaterials = new Map();
      const setLuma = (() => {
          const list = Object.values(L.materials || {}).filter((m) => m && m.color && !m.emissive && !(m.opacity < 1));
          if (!list.length) return 0.5;
          return (
            list.reduce((sum, m) => {
              const c = new T.Color(m.color);
              if (T.ColorManagement && T.ColorManagement.enabled) c.convertLinearToSRGB();
              return sum + c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
            }, 0) / list.length
          );
        })(),
        baseTone = interior ? 1 : time === MT.NIGHT ? 0.58 : time === MT.DUSK || time === MT.DAWN ? 0.84 : 1,
        flatTone = setLuma < 0.2 ? 1 - (1 - baseTone) * 0.35 : baseTone,
        nightTint = new T.Color(MT.NIGHT_TINT),
        srgb = (c) => (T.ColorManagement && T.ColorManagement.enabled ? c.clone().convertLinearToSRGB() : c.clone()),
        linear = (c) => (T.ColorManagement && T.ColorManagement.enabled ? c.convertSRGBToLinear() : c),
        toneFlat = (color, k) =>
          k >= 1
            ? color.clone()
            : linear(
                srgb(color)
                  .multiplyScalar(k)
                  .lerp(srgb(nightTint), (1 - k) * 0.22),
              ),
        pull = (color, k) => linear(srgb(color).lerp(srgb(paletteAvg), k)),
        modelPull = Math.min(0.6, (1 - baseTone) * 1.4);
      const palette = Object.values(L.materials || {}).filter((m) => m && m.color && !m.emissive && !(m.opacity < 1)),
        paletteAvg = palette.length ? linear(palette.reduce((sum, m) => sum.add(srgb(new T.Color(m.color))), new T.Color(0, 0, 0)).multiplyScalar(0.85 / palette.length)) : null,
        fromModel = (mesh) => {
          for (let o = mesh; o; o = o.parent) if (o.userData && o.userData.ref) return true;
          return false;
        };
      const meshes = [];
      scene.traverse((o) => {
        if (o.isMesh) meshes.push(o);
      });
      for (const mesh of meshes) {
        const inActor = S.actors.some((a) => {
          let parent = mesh;
          while (parent) {
            if (parent === a.actor.group) return true;
            parent = parent.parent;
          }
          return false;
        });
        const model = !inActor && fromModel(mesh);
        const flatten = (source) => {
          if (source && source.userData && source.userData.glow) S.flatGlow = true;
          if (!source || source.isShaderMaterial) return source;
          const key = source.uuid + (model ? MT.MODEL : MT.EMPTY);
          if (source.isMeshBasicMaterial) {
            if (inActor || (source.userData && source.userData.glow) || flatTone >= 1) return source;
            if (flatMaterials.has(key)) return flatMaterials.get(key);
            const copy = source.clone();
            copy.color = toneFlat(model && paletteAvg && modelPull > 0 ? pull(source.color, modelPull) : source.color, flatTone);
            flatMaterials.set(key, copy);
            S.disposables.push(copy);
            return copy;
          }
          if (flatMaterials.has(key)) return flatMaterials.get(key);
          const glow = source.emissive && source.emissiveIntensity > 0 && source.emissive.getHex() !== 0 ? source.emissive.clone().multiplyScalar(1.4 + Math.min(1.6, source.emissiveIntensity * 0.6)) : null;
          if (glow) S.flatGlow = true;
          const def = source.userData && source.userData.def,
            patterned = !!(def && def.pattern),
            authored = patterned && def.color ? new T.Color(def.color) : source.color || new T.Color(0xffffff),
            base = toneFlat(model && paletteAvg && modelPull > 0 ? pull(authored, modelPull) : authored, inActor ? 1 - (1 - flatTone) * 0.3 : flatTone);
          const veil = !inActor && source.transparent && source.opacity < 0.5,
            beam = veil && !!glow;
          const flat = new T.MeshBasicMaterial({
            color: beam ? toneFlat(source.emissive.clone(), 1).multiplyScalar(0.9) : glow || base,
            blending: beam ? T.AdditiveBlending : T.NormalBlending,
            map: patterned ? null : source.map || null,
            alphaMap: source.alphaMap || null,
            alphaTest: source.alphaTest || 0,
            transparent: source.transparent,
            opacity: beam ? Math.min(0.14, source.opacity * 0.6) : veil ? source.opacity * 0.3 : source.opacity,
            side: source.side,
            vertexColors: source.vertexColors,
            depthWrite: source.depthWrite,
            polygonOffset: source.polygonOffset,
            polygonOffsetFactor: source.polygonOffsetFactor,
            polygonOffsetUnits: source.polygonOffsetUnits,
            toneMapped: false,
          });
          flatMaterials.set(key, flat);
          S.disposables.push(flat);
          return flat;
        };
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(flatten) : flatten(mesh.material);
        if (!S.style.outlineSilhouette && !inActor && !mesh.isInstancedMesh && !mesh.isSkinnedMesh && mesh.geometry?.attributes.position?.count < 12000 && mesh.material?.side !== T.BackSide) {
          const edges = new T.EdgesGeometry(mesh.geometry, 35);
          const ink = new T.LineBasicMaterial({ color: S.style.outlineColor || 0x263342, transparent: true, opacity: S.style.outlineWidth ? 1 : 0.35, toneMapped: false });
          mesh.add(new T.LineSegments(edges, ink));
          S.disposables.push(edges, ink);
        }
      }
    }
    if (spec.finish && spec.finish.material) finishMaterials(S, spec.finish.material);
    S.cam0 = { pos: fit.pos, tgt: fit.tgt };
    S.issues = (S.preIssues || []).concat(fit.issues);
    const wx = weatherFx(stg.weather, L.stage.center, S.flatDrawing);
    if (wx) {
      scene.add(wx);
      S.weather = wx;
      S.disposables.push(wx.geometry, wx.material);
    }
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = (L.exposure || 1) * tp.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene.environment = envFor(S, renderer);
    scene.environmentIntensity = tp.envI;
    const q = ctx.quality || {};
    if (S.flatDrawing && S.flatGlow && X.EffectComposer && X.UnrealBloomPass && !opts.noFx) {
      const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: ctx.preview ? 0 : 4 });
      const comp = new X.EffectComposer(renderer, rt);
      comp.setPixelRatio(1);
      comp.setSize(W, H);
      comp.addPass(new X.RenderPass(scene, cam));
      comp.addPass(new X.UnrealBloomPass(new T.Vector2(W / 2, H / 2), 0.5, 0.45, 1.0));
      comp.addPass(new X.OutputPass());
      S.composer = comp;
      S.disposables.push(rt);
    }
    const useFx = X.EffectComposer && !opts.noFx && !S.flatDrawing;
    if (useFx) {
      const rt = new T.WebGLRenderTarget(W, H, { type: T.HalfFloatType, samples: ctx.preview ? 0 : q.supersample > 1 ? 4 : 2 });
      const comp = new X.EffectComposer(renderer, rt);
      comp.setPixelRatio(1);
      comp.setSize(W, H);
      comp.addPass(new X.RenderPass(scene, cam));
      if (!ctx.preview && X.GTAOPass && q.ao !== false) {
        const ao = new X.GTAOPass(scene, cam, W, H);
        ao.blendIntensity = 0.85;
        ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1, thickness: 1, scale: 1 });
        comp.addPass(ao);
        S.ao = ao;
      }
      const dof = stg.camera && stg.camera.dof;
      if (!ctx.preview && X.BokehPass && dof) {
        const bk = new X.BokehPass(scene, cam, { focus: 5, aperture: 0.0016 * dof, maxblur: 0.008 * dof });
        comp.addPass(bk);
        S.bokeh = bk;
      }
      const night = time === MT.NIGHT || time === MT.INTERIOR_DARK || time === MT.DUSK;
      if (X.UnrealBloomPass) comp.addPass(new X.UnrealBloomPass(new T.Vector2(W / 2, H / 2), night ? 0.42 : 0.22, 0.55, night ? 0.86 : 0.94));
      comp.addPass(new X.OutputPass());
      comp.addPass(gradePass((S.style && S.style.grade) || MT.NEUTRAL));
      S.composer = comp;
      S.disposables.push(rt);
    }
    GEN.info[ctx.shot && ctx.shot.id != null ? ctx.shot.id : MT.X_2] = { issues: S.issues, camera: { pos: S.cam0.pos.toArray().map((v) => +v.toFixed(2)), target: S.cam0.tgt.toArray().map((v) => +v.toFixed(2)), fov: cam.fov } };
    return S;
  };
  const FINISH = MT.FINISH_MATERIAL;
  const finishTextures = {};
  const finishTexture = (kind) => {
    if (finishTextures[kind]) return finishTextures[kind];
    const size = 256,
      c = ME.makeCanvas(size, size),
      g = c.getContext(MT.VALUE_2D),
      img = g.createImageData(size, size),
      rnd = U.rng(kind.length * 977);
    const field = new Float32Array(size * size);
    for (let octave = 0, amp = 1, cell = 64; octave < 4; octave++, amp *= 0.5, cell /= 2) {
      const n = size / cell,
        grid = [];
      for (let i = 0; i < (n + 1) * (n + 1); i++) grid.push(rnd());
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const gx = x / cell,
            gy = y / cell,
            ix = Math.floor(gx) % n,
            iy = Math.floor(gy) % n,
            fx = gx - Math.floor(gx),
            fy = gy - Math.floor(gy);
          const at = (a, b) => grid[(b % n) * (n + 1) + (a % n)];
          const sx = fx * fx * (3 - 2 * fx),
            sy = fy * fy * (3 - 2 * fy);
          field[y * size + x] += amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy);
        }
    }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const f = field[y * size + x] / 1.875;
        let v = 1;
        if (kind === FINISH.CLAY) v = 0.76 + 0.24 * f + (rnd() < 0.004 ? -0.12 : 0);
        else if (kind === FINISH.WOOD) v = 0.6 + 0.3 * Math.pow(Math.sin(x * 0.18 + f * 9), 2) + 0.08 * f;
        else if (kind === FINISH.CARDBOARD) v = 0.74 + 0.2 * f + (rnd() < 0.02 ? -0.08 : 0) + 0.04 * Math.sin(y * 0.5);
        const b = Math.round(U.clamp(v) * 255),
          k = (y * size + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.colorSpace = T.SRGBColorSpace;
    finishTextures[kind] = tex;
    return tex;
  };
  const finishMaterials = (S, kind) => {
    const done = new Map();
    const kraft = new T.Color(FINISH.KRAFT);
    const remake = (m) => {
      const lit = m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial);
      const textured = kind === FINISH.CLAY || kind === FINISH.WOOD || kind === FINISH.CARDBOARD;
      if (!m || !(lit || (textured && m.isMeshBasicMaterial && m.toneMapped !== false))) return m;
      if (done.has(m)) return done.get(m);
      const n = m.clone();
      if (kind === FINISH.LOWPOLY) n.flatShading = true;
      if (kind === FINISH.PLASTIC) {
        if (n.roughness != null) n.roughness = 0.18;
        if (n.metalness != null) n.metalness = 0;
        const hsl = {};
        n.color.getHSL(hsl);
        n.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.25), hsl.l);
      } else if (kind === FINISH.CLAY || kind === FINISH.WOOD || kind === FINISH.CARDBOARD) {
        if (!n.map) n.map = finishTexture(kind);
        if (kind === FINISH.CLAY && lit) n.bumpMap = finishTexture(kind);
        if (n.bumpMap) n.bumpScale = 0.6;
        if (n.roughness != null) n.roughness = kind === FINISH.WOOD ? 0.65 : 1;
        if (n.metalness != null) n.metalness = 0;
        if (kind === FINISH.CARDBOARD) n.color.lerp(kraft, 0.5);
      }
      n.needsUpdate = true;
      S.disposables.push(n);
      done.set(m, n);
      return n;
    };
    S.scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      o.material = Array.isArray(o.material) ? o.material.map(remake) : remake(o.material);
    });
  };
  const meshDimensions = (o) => {
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const sc = o.getWorldScale(new T.Vector3()),
      radius = o.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z),
      dims = o.geometry.boundingBox.getSize(new T.Vector3()).multiply(sc);
    return { radius, thin: Math.min(dims.x, dims.y, dims.z) < Math.max(dims.x, dims.y, dims.z) * 0.35 };
  };
  const veilVolumes = (S, cam) => {
    if (!S.volumes) {
      S.volumes = [];
      S.scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || S.actors.some((A) => isUnder(o, A.actor.group))) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m || !m.transparent || !(m.opacity < 0.75) || m.blending === T.AdditiveBlending) return;
        const { radius: r, thin } = meshDimensions(o);
        if (r >= MT.HALO_MAX_RADIUS && !thin) S.volumes.push(o);
      });
      S.halos = [];
      S.scene.traverse((o) => {
        if (!o.isMesh || !o.geometry || S.actors.some((A) => isUnder(o, A.actor.group))) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material;
        if (!m || !m.transparent || !(m.opacity < MT.HALO_VEIL_OPACITY || m.blending === T.AdditiveBlending || (m.opacity < 0.75 && ((m.emissive && m.emissive.getHex() !== 0) || (m.userData && m.userData.glow))))) return;
        const { radius: r, thin } = meshDimensions(o);
        if (r >= MT.HALO_MIN_RADIUS && r < MT.HALO_MAX_RADIUS && !thin) S.halos.push({ o, r });
      });
      const cfg = S.stg.camera || {},
        subject = [];
      for (const A of S.actors) if (!cfg.focus || A.def.cast === cfg.focus) subject.push(A.actor.anchor(MT.HEAD), A.actor.anchor(MT.BODY));
      const box = cfg.focusProp ? propBounds(S, cfg.focusProp) : null;
      if (box) subject.push(box.getCenter(new T.Vector3()));
      S.veilSubject = subject;
    }
    const inside = (o, p) => {
      const local = o.worldToLocal(p.clone()),
        bs = o.geometry.boundingSphere;
      return local.distanceTo(bs.center) < bs.radius * 0.98;
    };
    for (const o of S.volumes) {
      const veil = inside(o, cam.position) || S.veilSubject.some((p) => inside(o, p));
      if (veil && o.visible) {
        o.visible = false;
        o.userData.veiled = true;
        if (!S.issues.includes(MT.VOLUME_VEIL_HIDDEN)) S.issues.push(MT.VOLUME_VEIL_HIDDEN);
      } else if (!veil && o.userData.veiled) {
        o.visible = true;
        o.userData.veiled = false;
      }
    }
  };
  const veilHalos = (S, cam) => {
    if (!S.halos || !S.halos.length) return;
    cam.updateMatrixWorld();
    const heads = S.actors.filter((A) => A.actor.group.visible).map((A) => A.actor.anchor(MT.HEAD)),
      right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0),
      aspect = cam.isPerspectiveCamera ? cam.aspect : (cam.right - cam.left) / Math.max(1e-6, cam.top - cam.bottom),
      flat = (p) => {
        const q = p.clone().project(cam);
        return new T.Vector2(q.x * aspect, q.y);
      },
      reach = (p, r) => flat(p.clone().addScaledVector(right, r)).distanceTo(flat(p));
    for (const h of S.halos) {
      const c = h.o.localToWorld(h.o.geometry.boundingSphere.center.clone()),
        r = h.o.geometry.boundingSphere.radius * Math.max(...h.o.getWorldScale(new T.Vector3()).toArray()),
        ahead = c.clone().sub(cam.position).dot(cam.getWorldDirection(new T.Vector3())) > 0,
        near = heads.some((p) => p.distanceTo(c) < r + MT.HALO_HEAD_GAP || (ahead && flat(p).distanceTo(flat(c)) < reach(c, r) + reach(p, MT.HALO_HEAD_GAP)));
      if (near && h.o.visible) {
        h.o.visible = false;
        h.o.userData.haloHidden = true;
        if (!S.issues.includes(MT.HALO_NEAR_HEAD_HIDDEN)) S.issues.push(MT.HALO_NEAR_HEAD_HIDDEN);
      } else if (!near && h.o.userData.haloHidden) {
        h.o.visible = true;
        h.o.userData.haloHidden = false;
      }
    }
  };
  const isUnder = (o, root) => {
    for (let n = o; n; n = n.parent) if (n === root) return true;
    return false;
  };
  const meterExposure = (S, renderer, cam) => {
    let k = 1;
    const base = (S.L.exposure || 1) * S.tp.exposure,
      w = 96,
      h = Math.max(8, Math.round((96 * renderer.domElement.height) / Math.max(1, renderer.domElement.width)));
    let probe;
    try {
      probe = document.createElement(MT.CANVAS);
    } catch (e) {
      return 1;
    }
    probe.width = w;
    probe.height = h;
    const pg = probe.getContext(MT.VALUE_2D, { willReadFrequently: true });
    if (!pg) return 1;
    const heads = S.actors
      .filter((A) => A.actor.group.visible)
      .map((A) => {
        const head = A.actor.anchor(MT.HEAD),
          q = head.clone().project(cam),
          up = head
            .clone()
            .add(new T.Vector3(0, 0.1, 0))
            .project(cam);
        return { x: (q.x + 1) / 2, y: (1 - q.y) / 2, r: Math.abs(up.y - q.y) / 2, front: q.z < 1 };
      })
      .filter((f) => f.front && f.x > 0 && f.x < 1 && f.y > 0 && f.y < 1);
    const headsWorld = S.actors.filter((A) => A.actor.group.visible).map((A) => A.actor.anchor(MT.HEAD));
    let dimmed = 0;
    const issue = (msg) => {
      if (S.issues && !S.issues.includes(msg)) S.issues.push(msg);
    };
    for (let i = 0; i < 9; i++) {
      renderer.toneMappingExposure = base * k;
      if (S.composer) S.composer.render();
      else renderer.render(S.scene, cam);
      pg.clearRect(0, 0, w, h);
      pg.drawImage(renderer.domElement, 0, 0, w, h);
      let px;
      try {
        px = pg.getImageData(0, 0, w, h).data;
      } catch (e) {
        return k;
      }
      const lum = (x, y) => {
        const o = (y * w + x) * 4;
        return (px[o] * 0.2126 + px[o + 1] * 0.7152 + px[o + 2] * 0.0722) / 255;
      };
      let sum = 0,
        clip = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const l = lum(x, y);
          sum += l;
          if (l > 0.94) clip++;
        }
      const mean = sum / (w * h),
        clipped = clip / (w * h);
      let face = 0;
      for (const f of heads) {
        const cx = Math.round(f.x * (w - 1)),
          cy = Math.round(f.y * (h - 1)),
          rr = Math.max(1, Math.round(f.r * h));
        const vals = [];
        for (let y = Math.max(0, cy - rr); y <= Math.min(h - 1, cy + rr); y++) for (let x = Math.max(0, cx - rr); x <= Math.min(w - 1, cx + rr); x++) vals.push(lum(x, y));
        if (vals.length) face = Math.max(face, vals.sort((a, b) => a - b)[Math.floor(vals.length * 0.4)]);
      }
      if (face > 0.9 && mean < 0.45 && dimmed < 2) {
        const lit = [];
        for (const light of (S.env && S.env.lights) || []) {
          if ((!light.isPointLight && !light.isSpotLight) || !light.visible || !(light.intensity > 0)) continue;
          const lp = light.getWorldPosition(new T.Vector3());
          let e = 0;
          for (const hp of headsWorld) {
            const d = Math.max(0.3, hp.distanceTo(lp));
            if (light.distance && d > light.distance) continue;
            let cone = 1;
            if (light.isSpotLight) {
              const axis = light.target.getWorldPosition(new T.Vector3()).sub(lp).normalize(),
                to = hp.clone().sub(lp).normalize();
              cone = Math.acos(U.clamp(axis.dot(to), -1, 1)) <= light.angle ? 1 : 0;
            }
            e = Math.max(e, (light.intensity * cone) / (d * d));
          }
          if (e > 0) lit.push({ light, e });
        }
        const top = Math.max(0, ...lit.map((x) => x.e)),
          near = lit.filter((x) => x.e >= top * 0.3).map((x) => x.light);
        if (near.length) {
          for (const light of near) {
            light.userData.dim = (light.userData.dim || 1) * 0.55;
            light.intensity *= 0.55;
          }
          dimmed++;
          issue(MT.FACE_LIGHTS_DIMMED);
          continue;
        }
      }
      if (mean > 0.62 || clipped > 0.3 || face > 0.9) {
        k *= 0.68;
        issue(MT.EXPOSURE_LOWERED);
      } else if (mean < 0.035 && clipped < 0.01 && k < 2.4) {
        k *= 1.7;
        issue(MT.EXPOSURE_RAISED);
      } else break;
      if (k < 0.08) break;
    }
    return k;
  };
  GEN.drawShot = (g, ctx, S, tl) => {
    const u = U.clamp(tl / Math.max(0.01, S.shotDur));
    const t = tl + S.t0;
    moveCamera(S, u, t);
    if (!S.drawn) {
      S.drawn = true;
      for (const A of S.actors) A.poseLocked = false;
    }
    for (const A of S.actors) updateActor(A, S, t, S.camera);
    GEN.animateTravel(S.env, t / Math.max(0.01, S.dur));
    GEN.animateLights(S.env, t);
    updateWeather(S.weather, t);
    const cam = S.camera;
    veilVolumes(S, cam);
    veilHalos(S, cam);
    if (S.env.billboards) {
      const q = new T.Quaternion();
      for (const b of S.env.billboards) {
        b.parent.getWorldQuaternion(q);
        b.quaternion.copy(q.invert().multiply(cam.quaternion));
      }
    }
    const fd = new T.Vector3();
    cam.getWorldDirection(fd);
    S.fill.position
      .copy(cam.position)
      .addScaledVector(fd, -2)
      .add(new T.Vector3(0, 1.5, 0));
    S.fill.target.position.copy(cam.position).addScaledVector(fd, 10);
    if (S.bokeh) S.bokeh.uniforms.focus.value = S.focusDist || 5;
    const renderer = ME.T3.renderer(ctx.W, ctx.H, { shadows: true });
    renderer.toneMapping = S.flatDrawing ? T.NoToneMapping : T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = !S.flatDrawing;
    if (!S.flatDrawing && S.expK == null) S.expK = meterExposure(S, renderer, cam);
    renderer.toneMappingExposure = S.flatDrawing ? 1 : (S.L.exposure || 1) * S.tp.exposure * (S.expK || 1);
    if (S.composer) S.composer.render();
    else renderer.render(S.scene, cam);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(renderer.domElement, 0, 0, ctx.W, ctx.H);
    g.restore();
  };
  GEN.disposeShot = (S) => {
    if (!S) return;
    for (const A of S.actors) A.actor.dispose();
    GEN.disposeEnv(S.env);
    for (const d of S.disposables) {
      try {
        d.dispose();
      } catch (e) {
        void e;
      }
    }
    if (S.composer) {
      try {
        S.composer.dispose();
      } catch (e) {
        void e;
      }
    }
    if (S.ao) {
      try {
        S.ao.dispose();
      } catch (e) {
        void e;
      }
    }
  };
  ME.registerTemplate(MT.GEN3D, {
    name: MT.AI_3D_SCENE,
    category: MT.SCENE,
    description: MT.SCENE_DRAWN_BY_AI_SCENE_GRAPH_WITH,
    init(ctx) {
      const S = GEN.buildShot(ctx, ctx.params);
      return { S, dispose: () => GEN.disposeShot(S) };
    },
    draw(g, ctx) {
      GEN.drawShot(g, ctx, ctx.state.S, ctx.t);
    },
  });
  GEN.bgInit = (ctx, bg) => {
    if (!bg || !bg.location || !ctx.spec.gen || !cleanGen(ctx.spec).locations[bg.location]) return null;
    const stg = { location: bg.location, time: bg.time, actors: [], props: [], hide: [], camera: Object.assign({ shot: MT.WIDE, move: MT.DOLLY_IN, amount: 0.5 }, bg.camera || {}) };
    try {
      return GEN.buildShot(Object.assign({}, ctx, { preview: true }), stg, { noActors: true });
    } catch (e) {
      return null;
    }
  };
  GEN.bgDraw = (g, ctx, S) => GEN.drawShot(g, ctx, S, ctx.t);
  GEN.modelsOfSpec = (spec) => {
    const urls = new Set();
    const visit = (list) => {
      for (const n of list || []) {
        if (!n || typeof n !== MT.OBJECT) continue;
        if (n._url && (n.shape === MT.MODEL || MT.MODEL_REF_RE.test(String(n.ref || MT.EMPTY)))) urls.add(n._url);
        if (n.children) visit(n.children);
        if (n.node) visit([n.node]);
      }
    };
    const G = spec.gen || {};
    for (const L of Object.values(G.locations || {})) {
      if (!L) continue;
      visit(L.nodes);
      for (const d of Object.values(L.defs || {})) visit(d);
    }
    for (const sh of spec.shots || []) if (sh.params && sh.params.props) visit(sh.params.props);
    return [...urls];
  };
  GEN.prepare = async (spec, base) => {
    if (base != null) GEN.base = base;
    const urls = GEN.modelsOfSpec(spec);
    if (urls.length) await GEN.loadModels(urls, GEN.base);
    return { loaded: urls.length > 0 };
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
