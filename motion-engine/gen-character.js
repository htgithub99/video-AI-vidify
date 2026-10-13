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
      sample(action, time, enabled) {
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
        group.updateMatrixWorld(true);
      },
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
  GEN.actorBounds = (actor, upper) => {
    const bounds = actor.bounds(),
      points = [],
      low = upper ? bounds.min.y + (bounds.max.y - bounds.min.y) * 0.45 : bounds.min.y;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [low, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) points.push(new T.Vector3(x, y, z));
    return points;
  };
})(typeof window !== globalThis.MotionEngineText.UNDEFINED ? window : globalThis);
