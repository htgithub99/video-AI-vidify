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
  GEN.base = "";
  const envCache = new Map();
  const LOCOMOTION = [MT.WALK, MT.WALK_FORMAL, MT.JOG, MT.RUN, MT.SNEAK, MT.CARRY, MT.PUSH, MT.SWIM, MT.ZOMBIE_WALK, MT.SLIDE];
  GEN.LOCOMOTION = LOCOMOTION;
  const TIME = {
    day: { sun: MT.FFF1DC, sunI: 3.0, elev: 48, az: -35, hemiSky: MT.BCD4F0, hemiGround: MT.VALUE_6A5F50, hemiI: 0.95, fill: 0.22, fillColor: MT.FFF4E6, exposure: 1.0, top: MT.VALUE_3F78C4, horizon: MT.CFE0EE, fog: MT.C3D3DF, envI: 1.0 },
    dawn: { sun: MT.FFC79A, sunI: 2.0, elev: 9, az: 60, hemiSky: MT.A59AC0, hemiGround: MT.VALUE_4C4038, hemiI: 0.7, fill: 0.25, fillColor: MT.FFE2C8, exposure: 1.05, top: MT.VALUE_5A6FA8, horizon: MT.F2B48A, fog: MT.C9A99A, envI: 0.85 },
    dusk: { sun: MT.FFA060, sunI: 2.2, elev: 7, az: -70, hemiSky: MT.VALUE_7B74A8, hemiGround: MT.VALUE_4A382C, hemiI: 0.6, fill: 0.25, fillColor: MT.FFD8B8, exposure: 1.05, top: MT.VALUE_30365E, horizon: MT.F08A52, fog: MT.A7808A, envI: 0.8 },
    overcast: { sun: MT.E8ECF0, sunI: 0.9, elev: 55, az: -20, hemiSky: MT.D4DAE0, hemiGround: MT.VALUE_5F5C58, hemiI: 1.35, fill: 0.2, fillColor: MT.EEF2F6, exposure: 1.0, top: MT.VALUE_8A949E, horizon: MT.C8CED4, fog: MT.B9C0C6, envI: 0.9 },
    night: { sun: MT.VALUE_9FB4E6, sunI: 0.38, elev: 42, az: 30, hemiSky: MT.VALUE_2B3858, hemiGround: MT.VALUE_0B0D12, hemiI: 0.42, fill: 0.3, fillColor: MT.B8C8FF, exposure: 1.15, top: MT.VALUE_03050C, horizon: MT.VALUE_121A2C, fog: MT.VALUE_0E1420, envI: 0.55 },
    interior: { sun: null, hemiSky: MT.F2E6D4, hemiGround: MT.VALUE_3C3128, hemiI: 0.55, fill: 0.28, fillColor: MT.FFF0DC, exposure: 1.0, background: MT.VALUE_151310, fog: MT.VALUE_2A2622, envI: 0.8 },
    interior_dark: { sun: null, hemiSky: MT.VALUE_3A4662, hemiGround: MT.VALUE_0D0E12, hemiI: 0.2, fill: 0.22, fillColor: MT.C8D4FF, exposure: 1.2, background: MT.VALUE_050608, fog: MT.VALUE_0A0C10, envI: 0.5 },
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
  const weatherFx = (kind, center) => {
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
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] = U.mod(b[i + 1] - t * sp, 14);
      if (m.userData.kind !== MT.RAIN) p[i] = b[i] + Math.sin(t * 0.7 + i) * 0.3;
    }
    m.geometry.attributes.position.needsUpdate = true;
  };
  const DEFAULT_OUTFIT = {
    body: MT.MALE,
    layers: [
      { kind: MT.SHIRT, color: MT.VALUE_6A6F78 },
      { kind: MT.TROUSERS, color: MT.VALUE_2A2C30 },
      { kind: MT.SHOES, color: MT.VALUE_151515 },
    ],
  };
  const cleanGen = (spec) => {
    const G = spec.gen || (spec.gen = {});
    if (G.__clean) return G.__clean;
    const C = { locations: {}, cast: {} };
    for (const k of Object.keys(G.locations || {})) C.locations[k] = GEN.validateLocation(G.locations[k]).value;
    for (const k of Object.keys(G.cast || {})) C.cast[k] = GEN.validateOutfit(G.cast[k]).value;
    Object.defineProperty(G, MT.CLEAN, { value: C, enumerable: false });
    return C;
  };
  GEN.cleanGen = cleanGen;
  const castOf = (spec, key) => cleanGen(spec).cast[key] || GEN.validateOutfit(DEFAULT_OUTFIT).value;
  const yawTo = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
  const easeMove = (k) => {
    k = U.clamp(k);
    const a = 0.18;
    if (k < a) return (k * k) / (2 * a * (1 - a));
    if (k > 1 - a) return 1 - ((1 - k) * (1 - k)) / (2 * a * (1 - a));
    return (k - a / 2) / (1 - a);
  };
  const planActor = (a, dur, all) => {
    const segs = [];
    const isLoco = LOCOMOTION.includes(a.action);
    if (a.moveTo) {
      const t0 = a.moveStart * dur,
        t1 = a.moveEnd * dur;
      const move = isLoco ? a.action : MT.WALK;
      if (t0 > 0.05) segs.push({ id: isLoco ? MT.IDLE : a.action, t0: 0, t1: t0 });
      segs.push({ id: move, t0, t1, moving: true });
      segs.push({ id: a.then || MT.IDLE, t0: t1, t1: Math.max(dur, t1) + 30 });
    } else if (a.then) {
      const tt = (a.thenAt || 0.6) * dur;
      segs.push({ id: a.action, t0: 0, t1: tt });
      segs.push({ id: a.then, t0: tt, t1: dur + 30 });
    } else segs.push({ id: a.action, t0: 0, t1: dur + 30 });
    return segs;
  };
  const actorState = (A, t) => {
    const a = A.def,
      dur = A.dur;
    let pos = a.at;
    let moving = false,
      dir = null;
    if (a.moveTo) {
      const t0 = a.moveStart * dur,
        t1 = a.moveEnd * dur;
      const k = easeMove((t - t0) / Math.max(0.01, t1 - t0));
      pos = [U.lerp(a.at[0], a.moveTo[0], k), U.lerp(a.at[1], a.moveTo[1], k)];
      moving = t > t0 && t < t1;
      dir = yawTo(a.at, a.moveTo);
    }
    return { pos, moving, dir };
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
    } else if (a.moveTo) base = yawTo(a.at, a.moveTo);
    else base = cam ? yawTo(st.pos, [cam.position.x, cam.position.z]) * 0.35 : 0;
    if (a.moveTo) {
      const t0 = a.moveStart * A.dur,
        t1 = a.moveEnd * A.dur,
        dirY = yawTo(a.at, a.moveTo);
      const kIn = U.smooth((t - t0 + 0.25) / 0.5),
        kOut = U.smooth((t - t1 + 0.1) / 0.6);
      const finalYaw = a.face != null || a.faceAt || a.faceActor ? base : dirY;
      const pre = a.face != null || a.faceAt || a.faceActor ? base : dirY;
      return lerpAngle(lerpAngle(pre, dirY, kIn), finalYaw, kOut);
    }
    return base;
  };
  const lerpAngle = (a, b, k) => {
    let d = U.mod(b - a + Math.PI, Math.PI * 2) - Math.PI;
    return a + d * k;
  };
  const updateActor = (A, S, t, cam) => {
    const st = actorState(A, t);
    const actor = A.actor;
    actor.group.position.set(st.pos[0], A.def.y || 0, st.pos[1]);
    actor.group.rotation.y = faceYaw(A, S, t, cam);
    actor.group.updateMatrixWorld(true);
    const list = [];
    const fade = 0.35;
    let total = 0;
    A.segs.forEach((sg, i) => {
      let w = 0;
      if (t >= sg.t0 - (i ? fade / 2 : 0) && t < sg.t1 + fade / 2) {
        const kin = i === 0 ? 1 : U.smooth((t - (sg.t0 - fade / 2)) / fade);
        const kout = i === A.segs.length - 1 ? 1 : 1 - U.smooth((t - (sg.t1 - fade / 2)) / fade);
        w = Math.min(kin, kout);
      }
      if (w > 0.001) {
        const Ad = GEN.ACTIONS[sg.id] || {};
        let tt;
        if (sg.moving && Ad.speed) {
          const dist = Math.hypot(A.def.moveTo[0] - A.def.at[0], A.def.moveTo[1] - A.def.at[1]);
          const v = dist / Math.max(0.2, (A.def.moveEnd - A.def.moveStart) * A.dur);
          tt = (t - sg.t0) * U.clamp(v / Ad.speed, 0.5, 2.2) + A.phase;
        } else tt = Ad.once || Ad.hold != null ? t - sg.t0 : t + A.phase;
        list.push({ id: sg.id, time: tt, weight: w });
        total += w;
      }
    });
    if (!list.length) list.push({ id: MT.IDLE, time: t + A.phase, weight: 1 });
    else if (total > 0) list.forEach((x) => (x.weight /= total));
    actor.pose(list, t);
    for (const x of list) {
      const Ad = GEN.ACTIONS[x.id] || {};
      if (Ad.pose || Ad.headDown || Ad.look) GEN.applyPose(actor, Ad.pose, x.weight, t, { headDown: Ad.headDown ? Ad.headDown * x.weight : 0, look: Ad.look && x.weight > 0.5 });
    }
  };
  const SHOT_DIST = { wide: 1.0, medium: 0.55, close: 0.3, extreme_close: 0.18, over_shoulder: 0.45, low: 0.6, high: 0.8, aerial: 2.4, insert: 0.22, pov: 0.5 };
  const shotCamera = (S, stg) => {
    const L = S.L;
    const cam = stg.camera || {};
    const focus = cam.focus ? S.actors.filter((a) => a.def.cast === cam.focus) : S.actors;
    const pts = focus.length ? focus.map((a) => a.def.at) : [L.stage.center];
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
    const ty = shot === MT.CLOSE || shot === MT.EXTREME_CLOSE ? 1.55 : shot === MT.INSERT ? 1.0 : shot === MT.WIDE ? 1.2 : 1.35;
    let py = ty + (shot === MT.LOW ? -0.9 : shot === MT.HIGH ? 3.5 : shot === MT.AERIAL ? d * 0.8 : 0.15);
    if (shot === MT.OVER_SHOULDER && focus.length && S.actors.length > 1) {
      const A = focus[0];
      const B = S.actors.find((x) => x !== A);
      const v = new T.Vector3(B.def.at[0] - A.def.at[0], 0, B.def.at[1] - A.def.at[1]).normalize();
      const side = new T.Vector3(-v.z, 0, v.x);
      const p = new T.Vector3(B.def.at[0], 1.65, B.def.at[1]).addScaledVector(v, 0.9).addScaledVector(side, 0.45);
      return { pos: p.toArray(), target: [A.def.at[0], 1.5, A.def.at[1]], fov: 36 };
    }
    const yawOff = shot === MT.WIDE ? 0 : 12 * DEG;
    dir.applyAxisAngle(new T.Vector3(0, 1, 0), yawOff);
    return { pos: [cx + dir.x * d, py, cz + dir.z * d], target: [cx, ty, cz], fov };
  };
  const project = (cam, v) => v.clone().project(cam);
  const SEATED = [MT.SIT, MT.SIT_TALK, MT.SIT_DOWN, MT.STAND_UP, MT.DRIVE, MT.LIE, MT.FALL_DEAD, MT.GET_UP, MT.SWIM, MT.TREAD_WATER, MT.CLIMB, MT.KNEEL_FIX];
  const resolveOverlaps = (S) => {
    const boxes = [];
    for (const o of S.occluders) {
      const bb = new T.Box3().setFromObject(o);
      if (bb.max.y < 0.35 || bb.min.y > 1.2) continue;
      if (bb.max.x - bb.min.x > 30 || bb.max.z - bb.min.z > 30) continue;
      let nm = "";
      for (let p = o; p && p.name !== MT.LOCATION; p = p.parent) if (p.name) nm = p.name;
      boxes.push({ bb, name: nm || MT.OBJECT });
    }
    S.issues = S.issues || [];
    S.preIssues = [];
    for (const A of S.actors) {
      if (SEATED.includes(A.def.action)) continue;
      for (const key of [MT.AT_2, MT.MOVETO_2]) {
        const p = A.def[key];
        if (!p) continue;
        for (const b of boxes) {
          const m = 0.22;
          if (p[0] > b.bb.min.x - m && p[0] < b.bb.max.x + m && p[1] > b.bb.min.z - m && p[1] < b.bb.max.z + m) {
            const opts = [
              [b.bb.min.x - m - 0.05 - p[0], 0],
              [b.bb.max.x + m + 0.05 - p[0], 0],
              [0, b.bb.min.z - m - 0.05 - p[1]],
              [0, b.bb.max.z + m + 0.05 - p[1]],
            ].sort((u, v) => Math.hypot(u[0], u[1]) - Math.hypot(v[0], v[1]));
            const d = opts[0];
            if (Math.hypot(d[0], d[1]) > 1.6) {
              S.preIssues.push(A.def.cast + MT.STANDS_INSIDE + b.name + MT.SYMBOL_16);
              continue;
            }
            A.def[key] = [p[0] + d[0], p[1] + d[1]];
            S.preIssues.push(A.def.cast + MT.WAS_INSIDE + b.name + MT.MOVED + Math.hypot(d[0], d[1]).toFixed(2) + MT.M);
            break;
          }
        }
      }
    }
  };
  const solidsOf = (S) => {
    if (S.solids) return S.solids;
    const tops = new Set();
    for (const o of S.occluders) {
      let t = o;
      while (t.parent && t.parent !== S.locRoot) t = t.parent;
      tops.add(t);
    }
    S.solids = [...tops].map((o) => ({ o, b: new T.Box3().setFromObject(o).expandByScalar(0.35) })).filter((x) => !x.b.isEmpty());
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
      if (d >= 1.2) continue;
      const f = Math.max(0.1, (d / 1.2) * (d / 1.2));
      light.userData.dim = f;
      light.intensity *= f;
    }
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
    clearCamera(S, cam, tgt, issues);
    if (!S.actors.length) return { pos: cam.position.clone(), tgt, issues };
    const focusKey = (S.stg.camera || {}).focus;
    const subjects = focusKey ? S.actors.filter((a) => a.def.cast === focusKey) : S.actors;
    const pts = [];
    const shot = (S.stg.camera || {}).shot || MT.MEDIUM;
    const upper = shot !== MT.WIDE && shot !== MT.AERIAL && shot !== MT.HIGH && shot !== MT.LOW;
    for (const t of sampleTimes) {
      for (const A of S.actors) updateActor(A, S, t, cam);
      for (const A of subjects) pts.push(...GEN.actorBounds(A.actor, upper));
    }
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
        cam.position.copy(nx);
        steps++;
      }
      if (steps) issues.push(MT.CAMERA_PULLED_BACK + (steps * 0.25).toFixed(1) + MT.M_TO_FIT_ACTORS);
    }
    for (const A of S.actors) {
      const h = A.actor.bones.Head.getWorldPosition(new T.Vector3());
      const dd = cam.position.distanceTo(h);
      if (dd < 0.7) {
        cam.position.addScaledVector(back, 0.8 - dd);
        issues.push(MT.CAMERA_TOO_CLOSE_TO + A.def.cast);
      }
      for (const bn of [MT.SPINE_03, MT.PELVIS]) {
        const bp = A.actor.bones[bn] && A.actor.bones[bn].getWorldPosition(new T.Vector3());
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
    clearCamera(S, cam, tgt, issues);
    reangleCamera(S, cam, pos, tgt, shot, issues);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(true);
    for (const A of subjects) {
      const bpts = GEN.actorBounds(A.actor);
      let inFrame = 0;
      for (const p of bpts) {
        const q = project(cam, p);
        if (q.z < 1 && Math.abs(q.x) <= 1 && Math.abs(q.y) <= 1) inFrame++;
      }
      if (inFrame < bpts.length * 0.6) issues.push(A.def.cast + MT.IS_MOSTLY_OUT_OF_FRAME);
      const head = project(cam, A.actor.bones.Head.getWorldPosition(new T.Vector3()));
      const feet = project(cam, A.actor.bones.foot_l.getWorldPosition(new T.Vector3()));
      if (shot === MT.WIDE && Math.abs(head.y - feet.y) < 0.08) issues.push(A.def.cast + MT.LOOKS_VERY_SMALL_IN_THE_WIDE_SHOT);
    }
    if (S.actors.length > 1) {
      for (let i = 0; i < S.actors.length; i++)
        for (let j = i + 1; j < S.actors.length; j++) {
          const a = S.actors[i].def,
            b = S.actors[j].def;
          if (!a.moveTo && !b.moveTo && Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) < 0.45) issues.push(a.cast + MT.AND + b.cast + MT.STAND_INSIDE_EACH_OTHER_CLOSER_THAN_0);
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
    switch (m) {
      case MT.DOLLY_IN:
        pos.addScaledVector(fwd, dist * 0.22 * amt * k);
        break;
      case MT.DOLLY_OUT:
        pos.addScaledVector(fwd, dist * 0.22 * amt * (1 - k));
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
    if (m === MT.HANDHELD || S.handheld) {
      pos.x += U.noise(t * 0.8, 3) * 0.035;
      pos.y += U.noise(t * 0.9, 5) * 0.025;
      tgt.x += U.noise(t * 0.6, 7) * 0.05;
      tgt.y += U.noise(t * 0.7, 9) * 0.03;
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
  GEN.GRADES = Object.keys(GRADE);
  const gradePass = (name) => {
    const G = GRADE[name] || GRADE.neutral;
    return new X.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTint: { value: new T.Vector3(...G.tint) }, uLift: { value: new T.Vector3(...G.lift) }, uSat: { value: G.sat }, uCon: { value: G.con } },
      vertexShader: MT.VARYING_VEC2_VUV_VOID_MAIN_VUV_UV,
      fragmentShader: MT.UNIFORM_SAMPLER2D_TDIFFUSE_UNIFORM_VEC3_UTINT_UNIFORM,
    });
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
    const S = { locRoot: null, L, stg, scene, time, tp, locKey: stg.location, actors: [], occluders: [], disposables: [], dur: stg.beatDur || ctx.dur || 5, t0: stg.tOffset || 0, shotDur: ctx.dur || 5, style: G.style || {} };
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
        const outfit = castOf(spec, a.cast);
        const actor = GEN.createActor(outfit, { style: S.style, materials: L.materials, seed: U.strHash(a.cast) });
        if (a.hold) actor.hold(a.hold.nodes, a.hold.hand);
        scene.add(actor.group);
        S.actors.push({ def: a, actor, segs: planActor(a, S.dur), dur: S.dur, phase: (U.strHash(a.cast + stg.location) % 997) / 97 + (a.offset || 0) });
      }
    }
    resolveOverlaps(S);
    const cam = new T.PerspectiveCamera(40, W / H, 0.05, 3000);
    S.camera = cam;
    const camDef = stg.camera && stg.camera.pos && stg.camera.target ? { pos: stg.camera.pos, target: stg.camera.target, fov: stg.camera.fov || 38 } : shotCamera(S, stg);
    if (stg.camera && stg.camera.fov) camDef.fov = stg.camera.fov;
    const fit = fitCamera(S, camDef, [S.t0, S.t0 + S.shotDur * 0.5, S.t0 + S.shotDur]);
    dimNearActors(S, [S.t0, S.t0 + S.shotDur * 0.5, S.t0 + S.shotDur]);
    S.cam0 = { pos: fit.pos, tgt: fit.tgt };
    S.issues = (S.preIssues || []).concat(fit.issues);
    const wx = weatherFx(stg.weather, L.stage.center);
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
    const useFx = X.EffectComposer && !opts.noFx;
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
  GEN.drawShot = (g, ctx, S, tl) => {
    const u = U.clamp(tl / Math.max(0.01, S.shotDur));
    const t = tl + S.t0;
    moveCamera(S, u, t);
    for (const A of S.actors) updateActor(A, S, t, S.camera);
    GEN.animateLights(S.env, t);
    updateWeather(S.weather, t);
    const cam = S.camera;
    const fd = new T.Vector3();
    cam.getWorldDirection(fd);
    S.fill.position
      .copy(cam.position)
      .addScaledVector(fd, -2)
      .add(new T.Vector3(0, 1.5, 0));
    S.fill.target.position.copy(cam.position).addScaledVector(fd, 10);
    if (S.bokeh) S.bokeh.uniforms.focus.value = S.focusDist || 5;
    const renderer = ME.T3.renderer(ctx.W, ctx.H, { shadows: true });
    renderer.toneMappingExposure = (S.L.exposure || 1) * S.tp.exposure;
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
  GEN.actionsOfSpec = (spec) => {
    const ids = new Set([MT.IDLE]);
    for (const sh of spec.shots || []) {
      if (sh.template !== MT.GEN3D) continue;
      for (const a of (sh.params && sh.params.actors) || []) {
        const act = GEN.actionId(a.action) || MT.IDLE;
        ids.add(act);
        if (a.then && GEN.actionId(a.then)) ids.add(GEN.actionId(a.then));
        if (a.moveTo || a.to) ids.add(LOCOMOTION.includes(act) ? act : MT.WALK);
      }
    }
    return [...ids].filter((id) => GEN.ACTIONS[id]);
  };
  GEN.needsMannequin = (spec) => (spec.shots || []).some((sh) => sh.template === MT.GEN3D && sh.params && (sh.params.actors || []).length);
  GEN.prepare = async (spec, base) => {
    if (base != null) GEN.base = base;
    if (!GEN.needsMannequin(spec)) return { loaded: false };
    await GEN.loadMannequin(GEN.base);
    GEN.prebake(GEN.actionsOfSpec(spec));
    return { loaded: true };
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
