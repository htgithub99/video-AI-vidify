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
  const SK = ME.sceneKit;
  const LANE_Z = { back: -10.2, mid: -4.8, front: 0, fore: 1.9 };
  const FOV = 30;
  const REF_D = 13;
  const SEATS = {
    motorbike: { driver: [-0.12, 0.95], passenger: [-0.55, 1.0] },
    scooter: { driver: [-0.35, 0.92], passenger: [-0.7, 0.95] },
    vespa: { driver: [-0.35, 0.92], passenger: [-0.7, 0.95] },
    bicycle: { driver: [-0.14, 0.94] },
    cyclo: { driver: [-0.14, 0.94], passenger: [1.15, 1.05] },
  };
  const floorFromGround = (env, tp, WW, interior, scene) => {
    const backPx = 150,
      frontPx = 600;
    const zBack = interior ? -8 : -12,
      zFront = 9;
    const xa = -WW * 0.6,
      xb = WW * 1.6;
    const res = Math.min(0.5, 4096 / (xb - xa));
    const cw = Math.ceil((xb - xa) * res),
      chh = Math.ceil((backPx + frontPx) * res);
    const c = ME.makeCanvas(cw, chh);
    const g = c.getContext(MT.VALUE_2D);
    g.fillStyle = tp.ground || MT.VALUE_777;
    g.fillRect(0, 0, cw, chh);
    g.scale(res, res);
    g.translate(-xa, backPx);
    try {
      if (env.ground) env.ground(g, xa, xb, tp, frontPx, 0, {});
    } catch (e) {
      void e;
    }
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    let backdrop = null;
    {
      const topPx = 1400;
      const bres = Math.min(0.45, 4096 / (xb - xa));
      const bc = ME.makeCanvas(Math.ceil((xb - xa) * bres), Math.ceil(topPx * bres));
      const bg = bc.getContext(MT.VALUE_2D);
      bg.scale(bres, bres);
      bg.translate(-xa, topPx + backPx);
      try {
        if (env.ground) env.ground(bg, xa, xb, tp, frontPx, 0, {});
      } catch (e) {
        void e;
      }
      let filled = 0;
      try {
        const data = bc.getContext(MT.VALUE_2D).getImageData(0, 0, bc.width, bc.height).data;
        for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 10) filled++;
      } catch (e) {
        filled = 0;
      }
      if (filled > 20) {
        const btex = new T.CanvasTexture(bc);
        btex.colorSpace = T.SRGBColorSpace;
        const bm = new T.Mesh(new T.PlaneGeometry((xb - xa) * PX * 1.08, topPx * PX * 1.08), new T.MeshStandardMaterial({ map: btex, transparent: true, alphaTest: 0.04, roughness: 0.95, emissive: MT.FFFFFF, emissiveMap: btex, emissiveIntensity: 0.7 }));
        bm.position.set(((xa + xb) / 2) * PX, (topPx / 2) * PX * 1.08, zBack - 0.05);
        bm.receiveShadow = true;
        scene.add(bm);
        backdrop = btex;
      }
    }
    const vMid = frontPx / (backPx + frontPx);
    const plane = (z0, z1, v0, v1) => {
      const geo = new T.PlaneGeometry((xb - xa) * PX, z1 - z0);
      geo.rotateX(-PI / 2);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * (v1 - v0));
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, roughness: interior ? 0.6 : 0.92, emissive: MT.FFFFFF, emissiveMap: tex, emissiveIntensity: tp.night || interior ? 0.32 : 0.12 }));
      m.position.set(((xa + xb) / 2) * PX, 0, (z0 + z1) / 2);
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };
    plane(zBack, 0, vMid, 1);
    plane(0, zFront, 0, vMid);
    const base = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshStandardMaterial({ color: new T.Color(tp.ground || MT.VALUE_777), roughness: 1 }));
    base.rotation.x = -PI / 2;
    base.position.set((WW / 2) * PX, -0.02, -200);
    base.receiveShadow = true;
    scene.add(base);
    return { tex, zBack, backdrop };
  };
  const layerCards = (env, tp, WW, p, interior, zBack, scene, skipFrom) => {
    const out = [];
    const xa = -WW * 0.8,
      xb = WW * 1.8;
    for (const L of env.layers || []) {
      const d = L.depth == null ? 0.5 : L.depth;
      if (skipFrom != null && d >= skipFrom) continue;
      const z = interior ? zBack - 0.25 : zBack - 1.5 - REF_D * (1 / Math.max(0.05, d) - 1) * 0.8;
      const s = interior ? 1 : (REF_D + Math.abs(z)) / (REF_D + Math.abs(zBack));
      const topH = L.top || 1500;
      const res = Math.min(interior ? 0.9 : d > 0.6 ? 0.7 : 0.35, 6144 / (xb - xa), 2048 / (topH + 60));
      const cw = Math.ceil((xb - xa) * res),
        chh = Math.ceil((topH + 60) * res);
      const c = ME.makeCanvas(cw, chh);
      const g = c.getContext(MT.VALUE_2D);
      g.scale(res, res);
      g.translate(-xa, topH);
      try {
        L.draw(g, xa, xb, tp, p);
      } catch (e) {
        void e;
      }
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 4;
      const geo = new T.PlaneGeometry((xb - xa) * PX * s, (topH + 60) * PX * s);
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.04, roughness: 0.95, fog: true, emissive: MT.FFFFFF, emissiveMap: tex, emissiveIntensity: interior ? 0.7 : 0.55 }));
      m.position.set(((xa + xb) / 2) * PX * s + (WW / 2) * PX * (1 - s), ((topH + 60) / 2 - 60) * PX * s, z);
      m.receiveShadow = !!interior;
      m.castShadow = false;
      scene.add(m);
      out.push({ m, tex });
    }
    return out;
  };
  const row = (scene, WW, z, step, make, jitter = 0) => {
    const r = U.rng(Math.round(z * 100) + step * 7);
    for (let x = -WW * 0.6 * PX; x < WW * 1.6 * PX; x += step + r() * jitter) {
      const o = make(x, r);
      if (!o) continue;
      o.position.x = x;
      o.position.z = z - (o.userData.dz || 0);
      scene.add(o);
    }
  };
  const ENV_SETS = {
    city_street: {
      minDepth: 0.6,
      build: (scene, WW, tp) => {
        const cols = [MT.D8C7A6, MT.CDB796, MT.E1D3B8, MT.C9B9A0, MT.D3C2A8];
        row(scene, WW, -12.6, 6.4, (x, r) => K.asset(MT.BUILDING_HAUSSMANN, { w: 360, h: 520 + r() * 160, color: tp.night ? C.mix(cols[Math.floor(r() * 5)], MT.VALUE_0B1322, 0.6) : cols[Math.floor(r() * 5)], night: tp.night, seed: Math.floor(r() * 9) }));
      },
    },
    city_modern: {
      minDepth: 0.55,
      build: (scene, WW, tp) => row(scene, WW, -13, 11, (x, r) => K.asset(r() > 0.7 ? MT.SKYSCRAPER : MT.BUILDING_MODERN, { night: tp.night, color: tp.night ? MT.VALUE_1A2433 : C.mix(MT.VALUE_5F7488, MT.VALUE_9FB0BF, r()), seed: Math.floor(r() * 9) }), 3),
    },
    vn_street: {
      minDepth: 0.6,
      build: (scene, WW, tp) => {
        let i = 0;
        row(scene, WW, -12.5, 4.1, (x, r) => K.asset(MT.TUBE_HOUSE, { seed: i++, h: 440 + r() * 180, night: tp.night, color: tp.night ? C.mix([MT.E8C96A, MT.D9E3C4, MT.F2B8A0, MT.BCD6E0][i % 4], MT.VALUE_0B1322, 0.6) : undefined, sign: [MT.B8322A, MT.VALUE_2A6AD0, MT.VALUE_1AA260, MT.E2A22A][i % 4] }));
      },
    },
    riviera_promenade: {
      minDepth: 0.7,
      build: (scene, WW, tp) => {
        row(scene, WW, -12.8, 4.2, () => K.asset(MT.TREE_PALM, { color: tp.night ? MT.VALUE_0F1A12 : MT.VALUE_3D7A3F }), 0.6);
        const rail = new T.Mesh(K.box(WW * 2.2 * PX, 0.08, 0.08), K.mat(MT.E9E6DD));
        rail.position.set((WW / 2) * PX, 1.0, -12.2);
        scene.add(rail);
      },
    },
    courtyard: {
      minDepth: 0.8,
      build: (scene, WW, tp) => {
        const o = K.asset(MT.COURTHOUSE, { night: tp.night });
        o.position.set((WW / 2) * PX, 0, -13);
        scene.add(o);
      },
    },
    countryside: {
      minDepth: 0.6,
      build: (scene, WW, tp) => {
        const f = K.asset(MT.FARMHOUSE, { night: tp.night });
        f.position.set((WW / 2) * PX, 0, -16);
        scene.add(f);
        row(scene, WW, -14, 3.3, (x, r) => (Math.abs(x - (WW / 2) * PX) < 6 ? null : K.asset(r() > 0.5 ? MT.TREE_CYPRESS : MT.TREE_ROUND, { color: tp.night ? MT.VALUE_101A12 : MT.VALUE_4A7A3E })), 1.5);
      },
    },
    forest: {
      minDepth: 0.4,
      build: (scene, WW, tp) => {
        row(scene, WW, -13, 1.9, () => K.asset(MT.TREE_PINE, { color: tp.night ? MT.VALUE_0D1712 : MT.VALUE_2C4A36 }), 1.2);
        row(scene, WW, -17, 2.2, () => K.asset(MT.TREE_PINE, { color: tp.night ? MT.VALUE_0B1410 : MT.VALUE_34543E }), 1.5);
      },
    },
    jungle: {
      minDepth: 0.4,
      build: (scene, WW) => {
        row(scene, WW, -13, 2.4, (x, r) => K.asset(r() > 0.5 ? MT.TREE_PALM : MT.TREE_JUNGLE, {}), 1.4);
        row(scene, WW, -17, 2.6, () => K.asset(MT.TREE_JUNGLE, { color: MT.VALUE_264A24 }), 1.6);
      },
    },
    vn_village: {
      minDepth: 0.45,
      build: (scene, WW, tp) => {
        const pg = K.asset(MT.PAGODA, { night: tp.night });
        pg.position.set((WW / 2) * PX, 0, -16);
        scene.add(pg);
        row(scene, WW, -14, 2.6, (x) => (Math.abs(x - (WW / 2) * PX) < 6 ? null : K.asset(MT.BAMBOO, { color: tp.night ? MT.VALUE_132013 : MT.VALUE_5F8F3A })), 1.2);
      },
    },
    rice_field: { minDepth: 0.2, build: (scene, WW, tp) => row(scene, WW, -16, 3.0, (x, r) => K.asset(r() > 0.6 ? MT.BANANA_TREE : MT.TREE_ROUND, { color: tp.night ? MT.VALUE_132013 : MT.VALUE_4F7F3A }), 1.5) },
    beach: { minDepth: 0.35, build: (scene, WW, tp) => row(scene, WW, -12.5, 9, () => K.asset(MT.TREE_PALM, { color: tp.night ? MT.VALUE_0E1A10 : MT.VALUE_3D7A3F }), 3) },
  };
  K.ENV_SETS = ENV_SETS;
  ME.registerTemplate(MT.SCENE3D, {
    name: MT.CANH_3D_BOI_CANH_NHAN_VAT,
    category: MT.SCENE,
    description: MT.CUNG_DU_LIEU_VOI_CANH_2_5D_NHUNG,
    init(ctx) {
      const p = ctx.params;
      const env = ME.registry.environments[p.env] || ME.registry.environments.city_street;
      const timeKey = p.time || env.time || MT.DAY;
      const tp = Object.assign({}, ME.TIMES[timeKey] || ME.TIMES.day, p.timeOverrides || {});
      const WW = p.worldWidth || env.width || 3200;
      const interior = env.category === MT.INTERIOR || env.category === MT.UNDERGROUND;
      const night = !!tp.night || timeKey === MT.DUSK;
      const dur = Math.max(0.1, ctx.shot.end - ctx.shot.start);
      const scene = new T.Scene();
      const RL = p.real && ME.REAL && ME.REAL.setupScene ? ME.REAL : null;
      const rs = RL ? RL.setupScene(scene, { env, tp, timeKey, WW, interior, p }) : null;
      const hookAsset = RL ? (id, params) => RL.asset(id, params) || (/^tree_(round|oak|autumn|birch|jungle|willow|blossom)$/.test(id) ? RL.tree(id.length * 13 + Math.round((params.seed || 0) * 7), 7.5, params.night ? 0.45 : 1) : null) : null;
      K.assetHook = hookAsset;
      if (rs && rs.light) {
      } else if (env.sky && !interior) {
        const sc = ME.makeCanvas(1024, 576);
        try {
          env.sky(sc.getContext(MT.VALUE_2D), 1024, 576, tp, p);
        } catch (e) {
          void e;
        }
        const bgTex = new T.CanvasTexture(sc);
        bgTex.colorSpace = T.SRGBColorSpace;
        scene.background = bgTex;
        scene.userData.ownBg = bgTex;
      } else K.sky(scene, tp, timeKey, interior);
      const light = rs && rs.light ? rs.light : K.lights(scene, timeKey, tp);
      if (env.fog3d && scene.fog) {
        scene.fog.color.set(env.fog3d);
        if (scene.fog.density) scene.fog.density *= env.fog3dK || 2.5;
      }
      const floor = rs && !rs.groundPainted ? rs.floor : floorFromGround(env, tp, WW, interior, scene);
      const set = rs && !rs.set ? null : ENV_SETS[env.id];
      const cardMode = rs ? rs.cards : MT.ALL;
      const cards = cardMode === MT.NONE ? [] : layerCards(env, tp, WW, p, interior, floor.zBack, scene, cardMode === MT.FAR ? Math.min(0.5, set ? set.minDepth : 0.5) : set ? set.minDepth : null);
      if (set) {
        try {
          set.build(scene, WW, tp);
        } catch (e) {
          if (typeof console !== MT.UNDEFINED) console.warn(MT.MOTION3D_ENV_SET, env.id, e);
        }
      }
      const items = (env.props ? env.props(WW, tp) : []).concat(p.items || []).map((it, i) => {
        const params = Object.assign({ night: !!tp.night, t: 0 }, it.params || {}, it.color ? { color: it.color } : {});
        const obj = K.asset(it.asset, params);
        if (obj) {
          obj.scale.multiplyScalar(it.scale || 1);
          scene.add(obj);
        }
        return { spec: it, id: it.id || MT.I + i, obj, motion: SK.buildMotion(it, WW * 0.5), lane: it.lane || MT.MID, riders: [] };
      });
      const makeRig = (ch) => (RL && RL.character(ch)) || K.character(ch);
      const actors = (p.actors || []).map((a, i) => {
        const ch = SK.resolveCharacter(ctx, a.who || a.character);
        const rig = makeRig(ch);
        scene.add(rig.root);
        return { spec: a, id: a.id || MT.A + i, rig, motion: SK.buildMotion(a, WW * (0.35 + i * 0.12)), lane: a.lane || MT.FRONT };
      });
      for (const it of items) {
        for (const rd of it.spec.riders || []) {
          const ch = SK.resolveCharacter(ctx, rd.who || rd.character);
          const rig = makeRig(ch);
          scene.add(rig.root);
          it.riders.push({ rig, seat: rd.seat || MT.DRIVER, action: rd.action || (rd.seat === MT.PASSENGER ? MT.RIDE_PASSENGER : it.spec.asset === MT.BICYCLE || it.spec.asset === MT.CYCLO ? MT.RIDE_BIKE : MT.RIDE_MOTO) });
        }
      }
      const lampLights = [];
      if (night || interior) {
        const lamps = [];
        for (const it of items) if (it.obj && it.obj.userData.pointLight) lamps.push(it);
        const cx = (p.camera && p.camera.x) || WW / 2;
        lamps.sort((a, b) => Math.abs(a.motion.at(0).x - cx) - Math.abs(b.motion.at(0).x - cx));
        for (const it of lamps.slice(0, 5)) {
          const pl = it.obj.userData.pointLight;
          const L = new T.PointLight(pl.color, pl.intensity, pl.distance, 1.6);
          L.position.set(pl.x, pl.y, 0);
          it.obj.add(L);
          lampLights.push(L);
        }
        for (const sl of env.lightsStatic ? env.lightsStatic(WW, tp) : []) {
          if (lampLights.length > 7) break;
          if (sl.type !== MT.LAMP) continue;
          const L = new T.SpotLight(sl.color || MT.FFF0D0, interior ? 40 : 20, 14, 0.7, 0.6, 1.4);
          L.position.set(sl.x * PX, 6, -2);
          L.target.position.set(sl.x * PX, 0, 0);
          scene.add(L, L.target);
          const cone = K.lightCone(sl.color || MT.FFF0D0, 6, 2.4, (sl.alpha || 0.2) * 0.45);
          cone.position.set(sl.x * PX, 6, -2.5);
          scene.add(cone);
          lampLights.push(L);
        }
      }
      let spots = 0;
      if (night) {
        for (const it of items) {
          if (spots >= 2 || !it.obj || !it.obj.userData.headlight) continue;
          const h = it.obj.userData.headlight;
          const S = new T.SpotLight(MT.FFF2C8, 60, 22, 0.42, 0.5, 1.2);
          S.position.set(h.x, h.y, 0);
          S.target.position.set(h.x + 8, 0, 0);
          it.obj.add(S, S.target);
          spots++;
        }
      }
      if (night || timeKey === MT.INTERIOR_DARK) {
        let n = 0;
        for (const a of actors) {
          if (n >= 3) break;
          const wantsLight = (a.spec.action === MT.SWEEP_LIGHT || (a.spec.actions || []).some((x) => x[1] === MT.SWEEP_LIGHT) || a.rig.ch.headwear === MT.HEADLAMP) && a.rig.hand;
          if (!wantsLight) continue;
          const sp = new T.SpotLight(MT.FFF2D8, 45, 16, 0.38, 0.55, 1.3);
          sp.position.set(0, -0.08, 0);
          sp.target.position.set(0, -5, 0);
          a.rig.hand.add(sp, sp.target);
          n++;
        }
      }
      const crowds = [];
      for (const c of p.crowds || []) {
        try {
          const ch = SK.resolveCharacter(ctx, c.who || c.character);
          const cr = K.crowd(scene, c, ctx, { character: ch, real: !!RL, tint: tp.night ? 0.42 : timeKey === MT.DUSK ? 0.8 : 1 });
          crowds.push({ cr, spec: c, motion: SK.buildMotion(c, WW * (c.pos == null ? 0.5 : c.pos)), lane: c.lane || MT.BACK });
        } catch (e) {
          if (typeof console !== MT.UNDEFINED) console.warn(MT.MOTION3D_CROWD, e);
        }
      }
      K.assetHook = null;
      const actorsAt = (id, u) => {
        const a = actors.find((x) => x.id === id) || items.find((x) => x.id === id);
        return a ? a.motion.at(u) : null;
      };
      const cy0 = -(ctx.aspect.ground - 0.5) * ctx.aspect.frameH;
      const cam2d = SK.buildCamera(p, env, WW, cy0, actorsAt, ctx.aspect.frameH);
      const camera = new T.PerspectiveCamera(FOV, ctx.W / ctx.H, 0.1, 900);
      const swing = ((ctx.shot.index || 0) % 2 ? -1 : 1) * (p.camera && p.camera.orbit != null ? p.camera.orbit : 0.1);
      return {
        scene,
        camera,
        light,
        cards,
        floor,
        items,
        actors,
        crowds,
        env,
        tp,
        timeKey,
        WW,
        interior,
        cam2d,
        swing,
        dur,
        night,
        real: !!(rs && rs.light),
        RL,
        dispose() {
          for (const c of cards) {
            c.tex.dispose();
            c.m.geometry.dispose();
            c.m.material.dispose();
          }
          if (floor.tex) floor.tex.dispose();
          if (floor.backdrop) floor.backdrop.dispose();
          if (scene.userData.ownBg) scene.userData.ownBg.dispose();
          scene.traverse((o) => {
            if (o.isMesh && o.material && o.material.map && o.material.map !== floor.tex && !o.material.__shared && o.material.dispose) o.material.dispose();
          });
        },
      };
    },
    draw(g, ctx) {
      const S = ctx.state;
      const { scene, camera, WW, dur } = S;
      const W = ctx.W,
        H = ctx.H;
      const u = ctx.u,
        t = ctx.t;
      for (const it of S.items) {
        if (!it.obj) continue;
        const vis = SK.visibility(it.spec, u, dur);
        it.obj.visible = vis > 0.5;
        const m = it.motion.at(u);
        const f = it.spec.facing === MT.LEFT || it.spec.facing === -1 ? -1 : it.spec.facing === MT.RIGHT || it.spec.facing === 1 ? 1 : it.motion.facing(u, dur);
        it.obj.position.set(m.x * PX, -(it.spec.y || 0) * PX - m.y * PX, (LANE_Z[it.lane] == null ? LANE_Z.mid : LANE_Z[it.lane]) + (it.spec.z || 0) * PX);
        it.obj.rotation.y = f < 0 ? PI : 0;
        K.animate(it.obj, t, m.dist * PX);
        if (it.obj.userData.bob) it.obj.position.y += Math.sin(t * 1.6) * it.obj.userData.bob;
        const seats = SEATS[it.spec.asset] || { driver: [0, 1], passenger: [-0.5, 1] };
        for (const rd of it.riders) {
          const act = ME.registry.actions[rd.action] || ME.registry.actions.ride_moto;
          if (rd.rig.setAction) rd.rig.setAction(rd.action, t, {});
          else rd.rig.setPose(act.pose(t * 4, t, {}), { action: rd.action });
          const seat = seats[rd.seat] || seats.driver;
          const pelvis = rd.rig.root.children[0].position.y;
          const sx = seat[0] * (f < 0 ? -1 : 1);
          rd.rig.root.position.set(it.obj.position.x + sx, it.obj.position.y + seat[1] - pelvis, it.obj.position.z);
          rd.rig.root.rotation.y = f < 0 ? PI : 0;
          rd.rig.root.visible = it.obj.visible;
        }
      }
      for (const a of S.actors) {
        const spec = a.spec;
        const vis = SK.visibility(spec, u, dur);
        a.rig.root.visible = vis > 0.5;
        const m = a.motion.at(u);
        const at = SK.actionAt(spec, u);
        const act = ME.registry.actions[at.action] || ME.registry.actions.stand;
        const phase = a.motion.moving && act.stride ? (m.dist / act.stride) * PI * 2 : t * PI * 2 * (spec.cadence || 1);
        let pose = act.pose(phase + (spec.phase || 0), t + (spec.phase || 0), {});
        if (at.prev && at.since * dur < 0.35) {
          const pa = ME.registry.actions[at.prev] || act;
          pose = ME.lerpPose(pa.pose(phase, t, {}), pose, U.smooth((at.since * dur) / 0.35));
        }
        if (a.rig.setAction) a.rig.setAction(at.action, t, { moving: a.motion.moving, dist: m.dist * PX, phase: spec.phase || 0, prev: at.prev, blend: at.prev ? U.smooth(Math.min(1, (at.since * dur) / 0.35)) : 1 });
        else a.rig.setPose(pose, { action: at.action, hold: SK.heldAt ? SK.heldAt(spec, u) : spec.hold });
        let f;
        if (spec.facing === MT.LEFT || spec.facing === -1) f = -1;
        else if (spec.facing === MT.RIGHT || spec.facing === 1) f = 1;
        else f = a.motion.facing(u, dur);
        const toCam = a.motion.moving ? 0.18 : 0.42;
        a.rig.root.rotation.y = ((1 - f) / 2) * PI - toCam * f;
        a.rig.root.position.set(m.x * PX, -(spec.y || 0) * PX - m.y * PX, (LANE_Z[a.lane] == null ? 0 : LANE_Z[a.lane]) + (spec.z || 0) * PX);
        a.rig.root.scale.setScalar(spec.scale || 1);
      }
      const c = S.cam2d(u);
      const frameW = ctx.aspect.frameH * (W / H);
      const visW = (frameW / Math.max(0.3, c.zoom)) * PX;
      const fovV = (FOV * PI) / 180;
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * (W / H));
      const D = visW / 2 / Math.tan(fovH / 2);
      const half = visW / 2;
      let cx = U.clamp(c.x * PX, Math.min(half, (WW * PX) / 2), Math.max((WW * PX) / 2, WW * PX - half));
      const cam = ctx.params.camera || {};
      if (cam.handheld || cam.shake) cx += U.fbm(t * 0.7, 1) * 0.05 * ((cam.handheld || 0) + (cam.shake || 0) * 3);
      const yaw = S.swing * (u - 0.5);
      const eye = 1.45 + D * 0.035;
      const below = (ctx.aspect.ground - 0.5) * 2;
      const alpha = Math.atan(eye / D);
      const theta = alpha - Math.atan(below * Math.tan(fovV / 2));
      const look = eye - D * Math.tan(theta);
      camera.aspect = W / H;
      camera.fov = FOV;
      camera.updateProjectionMatrix();
      const aerial = cam.aerial ? (typeof cam.aerial === MT.NUMBER ? cam.aerial : 1) : 0;
      if (aerial) {
        const h = D * (0.32 + 0.22 * aerial);
        camera.position.set(cx + Math.sin(yaw) * D, h, Math.cos(yaw) * D + 2);
        camera.lookAt(cx, 0, -D * 0.25);
      } else {
        camera.position.set(cx + Math.sin(yaw) * D, eye, Math.cos(yaw) * D);
        camera.lookAt(cx, look, 0);
      }
      camera.updateMatrixWorld();
      for (const c of S.crowds || []) {
        const vis = SK.visibility(c.spec, u, dur);
        const m = c.motion.at(u);
        const fc = c.spec.facing === MT.LEFT || c.spec.facing === -1 ? -1 : c.spec.facing === MT.RIGHT || c.spec.facing === 1 ? 1 : c.motion.facing(u, dur);
        K.updateCrowd(c.cr, { x: m.x * PX, y: 0, z: (LANE_Z[c.lane] == null ? LANE_Z.back : LANE_Z[c.lane]) + (c.spec.z || 0) * PX }, vis > 0.5 ? t : t, camera, fc);
        for (const mm of c.cr.meshes) mm.visible = vis > 0.5;
      }
      const sun = S.light.sun;
      const L = S.light.L;
      sun.position.set(cx + L.sunPos[0], L.sunPos[1], L.sunPos[2]);
      sun.target.position.set(cx, 0, -3);
      const sc = sun.shadow.camera;
      const ext = Math.max(12, half * 1.3) * (aerial ? 2.2 : 1);
      sc.left = -ext;
      sc.right = ext;
      sc.top = ext * 0.8;
      sc.bottom = -ext * 0.6;
      sc.updateProjectionMatrix();
      let out;
      if (S.real && S.RL) {
        S.RL.animateWater(scene, t);
        out = S.RL.render(S, camera, W, H, ctx);
      } else {
        const r = K.renderer(W, H, { shadows: ctx.quality.bloom !== false || ctx.quality.layerScale >= 1 });
        r.toneMappingExposure = (L.exposure || 1) * (ctx.params.exposure || 1);
        r.render(scene, camera);
        out = r.domElement;
      }
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(out, 0, 0, W, H);
      const p = ctx.params;
      if (p.weather) SK.weather(g, p.weather, W, H, t, ctx.unit, !!S.tp.night);
      if (p.dust || S.env.dust) SK.dust(g, W, H, t, ctx.unit, p.dust || 0.3);
      g.restore();
    },
  });
  K.stage = (kind, id, opts = {}) => {
    const W = opts.width || 320,
      H = opts.height || 240;
    const scene = new T.Scene();
    scene.background = new T.Color(opts.bg || MT.VALUE_1B2029);
    scene.add(new T.HemisphereLight(MT.DFE8F5, MT.VALUE_3A3026, 1.4));
    const sun = new T.DirectionalLight(MT.FFF3DF, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const ground = new T.Mesh(new T.CircleGeometry(30, 40), new T.MeshStandardMaterial({ color: opts.ground || MT.VALUE_2A303B, roughness: 1 }));
    ground.rotation.x = -PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    let obj,
      rig = null;
    if (kind === MT.CHARACTER) {
      rig = K.character(id);
      obj = rig.root;
    } else obj = K.asset(id, Object.assign({ t: 1 }, opts.params || {}));
    if (!obj) {
      K.dispose(scene);
      return null;
    }
    const pose = (action, t) => {
      if (!rig) return;
      const act = ME.registry.actions[action || MT.STAND] || ME.registry.actions.stand;
      rig.setPose(act.pose(t * 5, t, {}), { action: action || MT.STAND });
    };
    pose(opts.action, opts.t || 0.6);
    obj.rotation.y = opts.yaw == null ? -0.6 : opts.yaw;
    scene.add(obj);
    obj.updateWorldMatrix(true, true);
    const bb = new T.Box3();
    obj.traverseVisible((m) => {
      if (!m.geometry || m.material?.blending === T.AdditiveBlending) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      bb.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
    });
    if (bb.isEmpty()) bb.setFromObject(obj);
    const size = bb.getSize(new T.Vector3());
    const center = bb.getCenter(new T.Vector3());
    const radius = Math.max(size.x, size.y * 1.15, size.z) * 0.62 + 0.05;
    const camera = new T.PerspectiveCamera(30, W / H, 0.05, 2000);
    const dist = radius / Math.tan((15 * PI) / 180);
    camera.position.set(center.x + dist * 0.15, center.y + dist * 0.28, center.z + dist);
    camera.lookAt(center);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -radius * 2;
    sun.shadow.camera.right = sun.shadow.camera.top = radius * 2;
    sun.shadow.camera.far = 50 + radius * 4;
    sun.position.set(center.x - radius * 2, center.y + radius * 4, center.z + radius * 3);
    sun.target.position.copy(center);
    scene.add(sun.target);
    const out = ME.makeCanvas(W, H);
    const og = out.getContext(MT.VALUE_2D);
    return {
      canvas: out,
      render(t, o = {}) {
        if (o.action !== undefined || t !== undefined) pose(o.action || opts.action, t == null ? opts.t || 0.6 : t);
        if (o.yaw != null) obj.rotation.y = o.yaw;
        const r = K.renderer(W, H, { shadows: true });
        r.toneMappingExposure = 1.05;
        r.render(scene, camera);
        og.clearRect(0, 0, W, H);
        og.drawImage(r.domElement, 0, 0, W, H);
        return out;
      },
      dispose() {
        K.dispose(scene);
      },
    };
  };
  K.preview = (kind, id, opts = {}) => {
    const st = K.stage(kind, id, opts);
    if (!st) return null;
    const out = st.render(opts.t || 0.6);
    st.dispose();
    return out;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
