import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync(new URL(VT.MOTION_ENGINE_GEN_SCENE_JS, import.meta.url), VT.UTF8);
const actorCode = source.slice(source.indexOf(VT.CONST_PLANACTOR), source.indexOf(VT.CONST_PROPBOUNDS));
const MT = new Proxy({}, { get: (_, key) => String(key).toLowerCase() });
const engineRoot = { MotionEngineText: MT };
vm.runInNewContext(fs.readFileSync(new URL(VT.MOTION_ENGINE_CORE_JS, import.meta.url), VT.UTF8), engineRoot);
const calls = [];
const GEN = {};
const context = { MT, GEN, DEG: Math.PI / 180, yawTo: (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]), U: { strHash: engineRoot.MotionEngine.util.strHash, smooth: (x) => x, clamp: (x, low = 0, high = 1) => Math.max(low, Math.min(high, x)), mod: (x, n) => ((x % n) + n) % n }, T: {}, api: null };
vm.createContext(context);
vm.runInContext(`${actorCode}${VT.API_UPDATEACTOR_PLANACTOR_ACTORSTATE}`, context);
const { updateActor, planActor } = context.api;
const scene = { L: { camera: { pos: [0, 2, 9] } }, actors: [] };
for (const action of [VT.RUN, VT.POINT, VT.LIE]) {
  let evaluations = 0;
  const group = {
    position: {
      set(x, y, z) {
        this.xyz = [x, y, z];
      },
    },
    rotation: {},
    updateMatrixWorld() {},
  };
  const def = { cast: action, action, at: [2, -3], y: 0.4, face: VT.CAMERA, moveTo: [20, 20], then: VT.WALK };
  const actor = {
    group,
    sample(action, time, enabled) {
      evaluations++;
      calls.push([VT.POSE, [action, enabled], time]);
    },
  };
  const A = { def, actor, segs: planActor(def, 12), dur: 12, phase: 7.3 };
  scene.actors.push(A);
  updateActor(A, scene, 0, { position: { x: 100, z: 100 } });
  const before = JSON.stringify({ pos: group.position.xyz, yaw: group.rotation.y, calls });
  for (const t of [0.5, 4, 12, 20, 0]) updateActor(A, scene, t, { position: { x: -t * 10, z: t } });
  assert.equal(evaluations, 1, `${action}${VT.FIXED_DESIGN_MUST_EVALUATE_ONLY_ONCE}`);
  assert.equal(JSON.stringify({ pos: group.position.xyz, yaw: group.rotation.y, calls }), before);
  assert.deepEqual(group.position.xyz, [2, 0.4, -3]);
}
const animatedGroup = {
  position: {
    set(x, y, z) {
      this.xyz = [x, y, z];
    },
  },
  rotation: {},
  updateMatrixWorld() {},
};
const motionDef = { cast: VT.WALKER, action: VT.WALK, at: [0, 0], moveTo: [6, 0], moveStart: 0.2, moveEnd: 0.8, then: VT.STAND, face: 0 };
const poseTimes = [];
const animated = {
  def: motionDef,
  actor: {
    group: animatedGroup,
    sample(action, time, enabled) {
      poseTimes.push(time);
    },
  },
  motion: true,
  segs: planActor(motionDef, 10, true),
  dur: 10,
  phase: 0,
};
for (const [time, x] of [
  [0, 0],
  [5, 3],
  [10, 6],
  [0, 0],
]) {
  updateActor(animated, scene, time, { position: { x: 0, z: 9 } });
  assert.deepEqual(animatedGroup.position.xyz, [x, 0, 0]);
}
assert.equal(poseTimes.length, 4);
assert.equal(animated.poseLocked, false);
assert.equal(animated.segs[0].id, VT.WALK);
assert.equal(animated.segs[1].id, VT.STAND);
process.stdout.write(VT.CHARACTER_MOTION_PASSED_STATIC_DEFAULT_ANIMATED_POSES_SAFE_I);
