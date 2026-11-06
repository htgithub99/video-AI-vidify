import assert from "node:assert/strict";
import { scoreMotionScene } from "../src/lib/motionSceneScore.js";
import { svgGeometry, svgPathPoints } from "../src/lib/motionSvgGeometry.js";
import { normalizeSceneRenderIds } from "../src/lib/motionSceneRenderIds.js";
import { MOTION_SCENE_SCORE as S } from "../src/constants/motionSceneScore.js";
import type { MotionSceneActionPlan, MotionSceneAnimation, MotionSceneLayer } from "../src/types/motionVisual.js";

const W = 1280,
  H = 720;
const svg = (horseX: number) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}'>
<g id='bg'><rect x='0' y='0' width='${W}' height='${H}' fill='#ccc'/></g>
<g id='horse' transform='translate(${horseX} 400)'><rect x='0' y='0' width='200' height='120'/><g id='leg_front'><path d='M10 120 l0 80'/></g><g id='leg_back'><path d='M180 120 l0 80'/></g></g>
<g id='king'><circle cx='640' cy='300' r='40'/></g>
<g id='guard'><rect x='900' y='250' width='60' height='160'/></g>
</svg>`;
const nodes = [
  { id: "horse", kind: "character" as const, entityId: "horse_1" },
  { id: "king", kind: "character" as const, entityId: "alexander" },
  { id: "guard", kind: "character" as const, entityId: "guard_1" },
];
const layers: MotionSceneLayer[] = [
  { id: "bg", kind: "background" },
  { id: "horse", kind: "character", entityId: "horse_1" },
  { id: "king", kind: "character", entityId: "alexander" },
  { id: "guard", kind: "character", entityId: "guard_1" },
];
const plan: MotionSceneActionPlan = {
  start: "",
  subjects: [
    { nodeId: "horse", action: "gallops forward", parts: [{ name: "front leg", change: "swings" }, { name: "back leg", change: "swings" }], phases: [{ phase: "gallop", description: "legs alternate" }], end: "slows" },
    { nodeId: "king", action: "raises sword", parts: [], phases: [{ phase: "raise", description: "arm up" }], end: "points" },
    { nodeId: "guard", action: "stands still", parts: [], phases: [], end: "remains still" },
  ],
  interactions: [],
  end: "",
  environment: "",
  camera: "",
};
const track = (target: string, frames: [number, string][]): MotionSceneAnimation => ({ target, channel: "actor", attribute: "transform", keyframes: frames.map(([at, value]) => ({ at, value })) });
const good = [
  track("horse", [[0, "translate(0 0)"], [5, "translate(300 0)"]]),
  track("leg_front", [[0, "rotate(0)"], [2.5, "rotate(20)"], [5, "rotate(0)"]]),
  track("leg_back", [[0, "rotate(0)"], [2.5, "rotate(-20)"], [5, "rotate(0)"]]),
  track("king", [[0, "rotate(0)"], [5, "rotate(10)"]]),
];
const base = { svg: svg(100), layers, nodes, actionPlan: plan, duration: 5, width: W, height: H, motion: true };

// 1. A complete answer passes.
const pass = scoreMotionScene({ ...base, animations: good });
assert.equal(pass.passed, true, JSON.stringify(pass));
assert.equal(pass.score, 100);

// 2. Horse only slides as a whole: the parts criterion fails with a concrete instruction.
const rigid = scoreMotionScene({ ...base, animations: [good[0], good[3]] });
assert.ok(rigid.criteria.parts < 1);
assert.ok(rigid.issues.some((issue) => issue.includes("horse")));

// 3. Missing subject track: coverage drops.
const missing = scoreMotionScene({ ...base, animations: good.slice(0, 3) });
assert.ok(missing.criteria.coverage < 1 && missing.issues.some((issue) => issue.includes("king")));

// 4. Subject drawn above the canvas (scene 21 regression): frame criterion fails.
const clipped = scoreMotionScene({ ...base, svg: base.svg.replace("cy='300'", "cy='-200'"), animations: good });
assert.ok(clipped.criteria.frame < 1 && clipped.issues.some((issue) => issue.includes("king")));

// 5. Motion carries a subject off-canvas by the end.
const offscreen = scoreMotionScene({ ...base, animations: [track("horse", [[0, "translate(0 0)"], [5, "translate(1400 0)"]]), ...good.slice(1)] });
assert.ok(offscreen.criteria.frame < 1);

// 6. Short motion over a long scene.
const short = scoreMotionScene({ ...base, duration: 20, animations: good });
assert.ok(short.criteria.duration < 1);

// 7. Still subject that moves.
const restless = scoreMotionScene({ ...base, animations: [...good, track("guard", [[0, "translate(0 0)"], [5, "translate(200 0)"]])] });
assert.ok(restless.criteria.stillness < 1);

// 8. Wrong entityId.
const wrong = scoreMotionScene({ ...base, layers: layers.map((layer) => (layer.id === "king" ? { ...layer, entityId: "darius" } : layer)), animations: good });
assert.ok(wrong.criteria.identity < 1);

// 9. Motion OFF: motion criteria do not apply, static frame still checked.
const off = scoreMotionScene({ ...base, motion: false, animations: [] });
assert.equal(off.passed, true);

// 9b. No actionPlan (older script): a still character is a valid choice.
const legacy = scoreMotionScene({ ...base, actionPlan: undefined, animations: [] });
assert.equal(legacy.passed, true, JSON.stringify(legacy));

// 10. Geometry: relative path commands and nested transforms.
assert.deepEqual(svgPathPoints("M10 10 l5 5 h10 v-3 z").at(-1), [25, 12]);
const geometry = svgGeometry(base.svg);
assert.equal(geometry.boxes.get("horse")!.minX, 100);
assert.equal(geometry.boxes.get("leg_front")!.maxY, 600);
assert.deepEqual(geometry.ancestors.get("leg_back"), ["horse"]);

// 11. Render-id CSS reference uses a word boundary: #a must not match #ab.
const ids = normalizeSceneRenderIds({ svg: "<svg><style>#ab{fill:red}</style><g id='a'/><g id='a'/><g id='ab'/></svg>", layers: [] }, []);
assert.ok(typeof ids.svg === "string" && (ids.svg.match(/id='a(?:_2)?'/g) || []).length === 2, ids.svg);

assert.equal(S.ATTEMPTS, 3);
console.log(JSON.stringify({ pass: true, cases: 12, threshold: S.THRESHOLD, attempts: S.ATTEMPTS }));
