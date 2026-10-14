(function (root) {
  "use strict";
  const MT = root.MotionEngineText,
    GEN = root.MotionEngine.GEN,
    T = GEN.T;
  if (!T) return;
  const DEG = Math.PI / 180;
  const transform = (object, value) => {
    if (value.pos) object.position.fromArray(value.pos);
    if (value.rot) object.rotation.set(...value.rot.map((x) => x * DEG));
    if (value.scale) object.scale.fromArray(value.scale);
    if (value.visible !== undefined) object.visible = value.visible;
  };
  GEN.createActor = (design, opts = {}) => {
    const checked = GEN.validateCharacter(design);
    if (!checked.value.parts.length) throw new Error(MT.CHARACTER_GEOMETRY_REQUIRED);
    const definition = checked.value,
      group = new T.Group(),
      model = new T.Group(),
      parts = Object.create(null),
      base = Object.create(null);
    group.add(model);
    const env = GEN.newBuildEnv({ root: model, materials: definition.materials, shadowBudget: 0 });
    for (const part of definition.parts) {
      const object = new T.Group();
      object.name = part.id;
      transform(object, part);
      parts[part.id] = object;
      base[part.id] = { pos: object.position.toArray(), rot: [object.rotation.x / DEG, object.rotation.y / DEG, object.rotation.z / DEG], scale: object.scale.toArray() };
      GEN.buildNodes(part.nodes, env, object);
    }
    for (const part of definition.parts) (parts[part.parent] || model).add(parts[part.id]);
    const faces = (definition.expressions = definition.expressions || {}),
      shownBy = new Set(),
      hiddenBy = new Set();
    for (const expression of Object.values(faces))
      for (const [id, value] of Object.entries(expression || {})) {
        if (value && value.visible === true) shownBy.add(id);
        if (value && value.visible === false) hiddenBy.add(id);
      }
    const variantOf = (id) => {
      const match = MT.FACE_VARIANT_RE.exec(id);
      return match && parts[match[1]] && MT.FACE_FEATURE_RE.test(id) ? match[1] : null;
    };
    for (const part of definition.parts) {
      if (part.visible !== undefined) continue;
      if ((shownBy.has(part.id) && !hiddenBy.has(part.id)) || (!shownBy.has(part.id) && !hiddenBy.has(part.id) && variantOf(part.id))) {
        parts[part.id].visible = false;
        base[part.id].visible = false;
      }
    }
    if (!faces[MT.TALK]) {
      const open = definition.parts.find((part) => variantOf(part.id) && /mouth|lip/i.test(part.id));
      if (open) faces[MT.TALK] = { [variantOf(open.id)]: { visible: false }, [open.id]: { visible: true } };
    }
    if (!faces[MT.BLINK]) {
      const eyes = definition.parts.find((part) => /^eyes?$/i.test(part.id));
      if (eyes) faces[MT.BLINK] = { [eyes.id]: { scale: [1, 0.12, 1] } };
    }
    const style = opts.style || {};
    if (style.outlineWidth > 0) {
      const meshes = [];
      model.traverse((object) => {
        if (object.isMesh) meshes.push(object);
      });
      for (const mesh of meshes) {
        const geometry = mesh.geometry.clone();
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new T.Vector3()),
          size = geometry.boundingBox.getSize(new T.Vector3()),
          flat = Math.min(size.x, size.y, size.z) < 0.0001,
          material = new T.MeshBasicMaterial({ color: style.outlineColor || MT.VALUE_111111, side: flat ? T.DoubleSide : T.BackSide, toneMapped: false, polygonOffset: flat, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
          width = Math.min(0.06, style.outlineWidth);
        geometry.translate(-center.x, -center.y, -center.z);
        geometry.scale(1 + width, 1 + width, 1 + width);
        geometry.translate(center.x, center.y, center.z);
        const outline = new T.Mesh(geometry, material);
        outline.position.copy(mesh.position);
        outline.quaternion.copy(mesh.quaternion);
        outline.scale.copy(mesh.scale);
        outline.userData.outlineOf = mesh;
        mesh.parent.add(outline);
        env.disposables.push(geometry, material);
      }
    }
    const actor = {
      group,
      model,
      parts,
      bounds() {
        group.updateMatrixWorld(true);
        return new T.Box3().setFromObject(model);
      },
      anchor(name) {
        const target = parts[definition.anchors[name]] || parts[name];
        if (target) return target.getWorldPosition(new T.Vector3());
        const bounds = actor.bounds(),
          point = bounds.getCenter(new T.Vector3());
        if (name === MT.HEAD) point.y = bounds.max.y - (bounds.max.y - bounds.min.y) * 0.15;
        if (name === MT.BASE) point.y = bounds.min.y;
        return point;
      },
      sample(action, time, enabled, face) {
        for (const [id, object] of Object.entries(parts)) transform(object, base[id]);
        const pose = definition.poses[action] || definition.poses[MT.IDLE] || {};
        for (const [id, value] of Object.entries(pose)) if (parts[id]) transform(parts[id], value);
        const motion = enabled && definition.motions[action];
        if (motion) {
          const seconds = motion.loop ? ((time % motion.duration) + motion.duration) % motion.duration : Math.max(0, Math.min(motion.duration, time));
          for (const track of motion.tracks) {
            const value = {};
            for (const key of [MT.POS, MT.ROT, MT.SCALE]) {
              const keys = track.keys.filter((frame) => frame[key]);
              if (!keys.length) continue;
              const before = keys.filter((frame) => frame.t <= seconds).pop() || keys[0],
                after = keys.find((frame) => frame.t > seconds) || keys[keys.length - 1];
              const mix = Math.max(0, Math.min(1, (seconds - before.t) / Math.max(0.0001, after.t - before.t)));
              value[key] = before[key].map((x, index) => x + (after[key][index] - x) * mix);
            }
            transform(parts[track.part], value);
          }
        }
        const apply = (name) => {
          for (const [id, value] of Object.entries(faces[name] || {})) if (parts[id]) transform(parts[id], value);
        };
        if (face) {
          if (face.expression && faces[face.expression]) apply(face.expression);
          const clock = face.time || 0;
          if (face.talking && faces[MT.TALK] && Math.floor(clock * 7 + face.seed) % 2 === 0) apply(MT.TALK);
          if (faces[MT.BLINK] && (clock + face.seed * 1.7) % 3.6 < 0.13) apply(MT.BLINK);
        }
        for (const [id, angle] of Object.entries(actor.limbSplay)) parts[id].rotation.z += angle;
        for (const [id, delta] of Object.entries(actor.partShift)) parts[id].position.add(delta);
        group.updateMatrixWorld(true);
      },
      animatedFace: !!(faces[MT.BLINK] || faces[MT.TALK]),
      limbSplay: {},
      partShift: {},
      hold(nodes, part) {
        GEN.buildNodes(nodes, env, parts[definition.anchors[part]] || parts[part] || model);
      },
      dispose() {
        GEN.disposeEnv(env);
        group.removeFromParent();
      },
    };
    actor.sample(MT.IDLE, 0, false);
    return actor;
  };
  const V3 = () => new T.Vector3();
  const shownIn = (o, stop) => {
    for (let n = o; n && n !== stop; n = n.parent) if (!n.visible) return false;
    return true;
  };
  const under = (o, root) => {
    for (let n = o; n; n = n.parent) if (n === root) return true;
    return false;
  };
  const colorOf = (o) => {
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    return m && m.color;
  };
  const skinLike = (o) => {
    const raw = colorOf(o),
      c = raw && T.ColorManagement && T.ColorManagement.enabled && raw.clone().convertLinearToSRGB ? raw.clone().convertLinearToSRGB() : raw;
    return !!c && c.r > 0.45 && c.r >= c.g && c.g >= c.b && c.r - c.b > 0.05 && c.r - c.b < 0.45;
  };
  const isPart = (actor, node) => actor.parts[node.name] === node;
  const shiftZ = (actor, node, dz, outlines) => {
    if (!dz) return;
    const world = node.getWorldPosition(V3()),
      from = node.parent.worldToLocal(world.clone()),
      delta = node.parent.worldToLocal(world.add(new T.Vector3(0, 0, dz))).sub(from);
    if (isPart(actor, node)) {
      const prev = actor.partShift[node.name];
      actor.partShift[node.name] = prev ? prev.add(delta) : delta;
    } else for (const o of [node, ...outlines.filter((line) => line.userData.outlineOf === node)]) o.position.add(delta);
    node.updateMatrixWorld(true);
  };
  GEN.revealFace = (actor, style = {}) => {
    actor.sample(MT.IDLE, 0, false);
    const model = actor.model,
      meshes = [],
      outlines = [];
    model.traverse((o) => {
      if (o.isMesh) (o.userData.outlineOf ? outlines : meshes).push(o);
    });
    const visible = meshes.filter((o) => shownIn(o, model));
    const featureTop = (o) => {
      let top = null;
      for (let n = o; n && n !== model; n = n.parent) if (MT.FACE_FEATURE_RE.test(n.name || MT.EMPTY)) top = n;
      return top;
    };
    const features = visible.filter(featureTop);
    if (!features.length) return 0;
    const facePart = Object.values(actor.parts).find((p) => MT.FACE_SKIN_RE.test(p.name));
    const ray = new T.Raycaster(),
      box = new T.Box3(),
      down = new T.Vector3(0, 0, -1),
      cast = (x, y) => {
        ray.set(new T.Vector3(x, y, 50), down);
        return ray.intersectObjects(
          visible.filter((o) => o.visible),
          false,
        );
      };
    const centres = features.map((f) => box.setFromObject(f).getCenter(V3()));
    let plate = null;
    if (!facePart) {
      const votes = new Map();
      features.forEach((f, i) => {
        const hits = cast(centres[i].x, centres[i].y).filter((h) => !features.includes(h.object)),
          own = box.setFromObject(f).getCenter(V3()).z,
          pick = hits.find((h) => skinLike(h.object)) || hits.find((h) => h.point.z < own);
        if (pick) votes.set(pick.object, (votes.get(pick.object) || 0) + 1);
      });
      plate = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }
    const featureTops = new Set();
    for (const o of meshes) {
      const top = featureTop(o);
      if (top) featureTops.add(top);
    }
    const tops = [...featureTops].filter((t) => !(facePart && under(t, facePart)));
    const roots = [...(facePart ? [facePart] : []), ...(plate ? [plate] : []), ...tops];
    const inGroup = (o) => roots.some((r) => under(o, r));
    const isFeature = (o) => !!featureTop(o);
    const isCore = (o) => {
      const top = featureTop(o);
      return !!top && MT.FACE_CORE_RE.test(top.name || MT.EMPTY);
    };
    const plateHit = (hits) => hits.find((h) => inGroup(h.object) && !isFeature(h.object));
    const skins = visible.filter((o) => inGroup(o) && !isFeature(o) && skinLike(o));
    if (skins.length > 1 && !style.faceShading) {
      const area = (o) => {
        const sz = box.setFromObject(o).getSize(V3());
        return sz.x * sz.y;
      };
      const main = skins.reduce((a, b) => (area(b) > area(a) ? b : a)),
        mainBox = new T.Box3().setFromObject(main);
      for (const o of skins) if (o !== main && mainBox.containsPoint(box.setFromObject(o).getCenter(V3())) && area(o) < area(main) * 0.8) for (const m of [o, ...outlines.filter((line) => line.userData.outlineOf === o)]) m.visible = false;
    }
    const core = features.filter(isCore).length ? features.filter(isCore) : features;
    const occluders = new Set(),
      covering = new Set();
    for (const f of core) {
      const c = box.setFromObject(f).getCenter(V3()),
        hits = cast(c.x, c.y),
        back = plateHit(hits);
      for (const h of hits) if (!inGroup(h.object)) covering.add(h.object);
      for (const h of hits) {
        if (back && h === back) break;
        if (!back && h.object === f) break;
        if (!inGroup(h.object)) occluders.add(h.object);
      }
    }
    const area = new T.Box3();
    for (const f of core) area.expandByObject(f);
    const size = area.getSize(V3()),
      pad = Math.max(size.x, size.y) * 0.25;
    let lift = 0;
    if (occluders.size) {
      const N = 9;
      for (let ix = 0; ix < N; ix++)
        for (let iy = 0; iy < N; iy++) {
          const hits = cast(area.min.x - pad + ((size.x + pad * 2) * ix) / (N - 1), area.min.y - pad + ((size.y + pad * 2) * iy) / (N - 1)),
            g = hits.findIndex((h) => inGroup(h.object));
          for (let k = 0; k < g; k++) if (occluders.has(hits[k].object)) lift = Math.max(lift, hits[k].point.z - hits[g].point.z + 0.006);
        }
      lift = Math.min(lift, Math.max(size.x, size.y) * 2 + 0.05);
      for (const r of roots) shiftZ(actor, r, lift, outlines);
    }
    let placed = 0;
    for (const o of visible) {
      if (inGroup(o) || covering.has(o)) continue;
      let named = false;
      for (let n = o; n && n !== model; n = n.parent) if (MT.HEAD_DECOR_RE.test(n.name || MT.EMPTY)) named = true;
      if (!named) continue;
      const b = box.setFromObject(o),
        sz = b.getSize(V3()),
        c = b.getCenter(V3());
      let need = 0;
      for (const [fx, fy] of [
        [0, 0],
        [-0.3, 0],
        [0.3, 0],
        [0, -0.3],
        [0, 0.3],
      ]) {
        const hits = cast(c.x + fx * sz.x, c.y + fy * sz.y),
          mine = hits.find((h) => h.object === o),
          back = plateHit(hits);
        if (mine && back) need = Math.max(need, back.point.z - mine.point.z + 0.002);
      }
      if (need > 0) {
        shiftZ(actor, o, need, outlines);
        placed++;
      }
    }
    let featureLift = 0;
    for (const f of features) {
      const c = box.setFromObject(f).getCenter(V3()),
        hits = cast(c.x, c.y),
        own = hits.findIndex((h) => h.object === f);
      for (let k = 0; k < own; k++) if (!isFeature(hits[k].object)) featureLift = Math.max(featureLift, hits[k].point.z - hits[own].point.z + 0.003);
    }
    featureLift = Math.min(featureLift, 0.2);
    if (featureLift > 0) for (const t of featureTops) shiftZ(actor, t, featureLift, outlines);
    actor.sample(MT.IDLE, 0, false);
    return (lift > 0 ? 1 : 0) + placed + (featureLift > 0 ? 1 : 0);
  };
  GEN.revealLimbs = (actor) => {
    actor.sample(MT.IDLE, 0, false);
    const model = actor.model,
      meshes = [];
    model.traverse((o) => {
      if (o.isMesh && !o.userData.outlineOf && shownIn(o, model)) meshes.push(o);
    });
    const ray = new T.Raycaster(),
      box = new T.Box3(),
      down = new T.Vector3(0, 0, -1),
      centre = actor.bounds().getCenter(V3());
    const roots = Object.values(actor.parts).filter((p) => MT.LIMB_RE.test(p.name) && !(p.parent && MT.LIMB_RE.test(p.parent.name || MT.EMPTY)) && !/leg|foot|tail/i.test(p.name));
    const seen = (root) => {
      model.updateMatrixWorld(true);
      const own = meshes.filter((o) => under(o, root));
      if (!own.length) return true;
      let hand = own[0],
        low = Infinity;
      for (const o of own) {
        const b = box.setFromObject(o);
        if (b.min.y < low) ((low = b.min.y), (hand = o));
      }
      const p = box.setFromObject(hand).getCenter(V3());
      ray.set(new T.Vector3(p.x, p.y, 50), down);
      const hit = ray.intersectObjects(meshes, false)[0];
      return !hit || under(hit.object, root);
    };
    let fixed = 0;
    for (const root of roots) {
      if (seen(root)) continue;
      const side = Math.sign(root.getWorldPosition(V3()).x - centre.x);
      if (!side) continue;
      const start = root.rotation.z;
      for (let deg = 6; deg <= 36; deg += 6) {
        root.rotation.z = start + side * deg * DEG;
        if (seen(root)) {
          actor.limbSplay[root.name] = side * deg * DEG;
          fixed++;
          break;
        }
      }
      root.rotation.z = start;
    }
    actor.sample(MT.IDLE, 0, false);
    return fixed;
  };
  GEN.actorBounds = (actor, upper) => {
    const bounds = actor.bounds(),
      points = [],
      low = upper ? bounds.min.y + (bounds.max.y - bounds.min.y) * 0.45 : bounds.min.y;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [low, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new T.Vector3(x, y, z));
    return points;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
