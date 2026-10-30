import assert from "node:assert/strict";
import fs from "node:fs";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { normalizeMotionVector } from "../src/lib/motionVectorAsset.js";
import { motionVectorCutoutIssue } from "../src/lib/motionVectorCutout.js";
import { createVectorCutoutInspector } from "../src/features/motion/server/services/remotion/vectorCutoutInspector.js";
const svg = (content: string, attrs = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>${content}</svg>`;
const isolated = svg('<path d="M35 10H65L80 90H20Z" fill="#fff"/>');
const background = svg('<rect width="100" height="100" fill="#eee"/>');
const gradient = svg('<defs><linearGradient id="paper"><stop stop-color="#fff"/><stop offset="1" stop-color="#e8ddc7"/></linearGradient></defs><rect width="100" height="100" fill="url(#paper)"/>');
const normalize = (source: string) => normalizeMotionVector(source, "fixture", "fixture", "fixture");
const inspector = createVectorCutoutInspector();
try {
  assert.equal(motionVectorCutoutIssue(background), V.CUTOUT.BACKDROP);
  assert.equal(motionVectorCutoutIssue(isolated), undefined);
  assert.equal(await inspector.check(normalize(isolated)), undefined);
  assert.equal(await inspector.check(normalize(svg('<ellipse cx="50" cy="60" rx="35" ry="20" fill="white"/>'))), undefined);
  assert.equal(await inspector.check(normalize(gradient)), V.CUTOUT.BACKDROP);
  assert.equal(await inspector.check(normalize(svg('<path d="M0 0H100V100H0Z" fill="white"/>'))), V.CUTOUT.BACKDROP);
  assert.equal(await inspector.check(normalize(svg('<rect width="100" height="100" fill="none"/>'))), V.CUTOUT.EMPTY);
  const detachedHead = normalize(svg('<ellipse cx="50" cy="20" rx="12" ry="15"/><path d="M37 44H63L70 90H30Z"/>'));
  assert.equal(await inspector.check(detachedHead), undefined);
  assert.equal(await inspector.check(detachedHead, true), V.CUTOUT.DISCONNECTED);
  assert.equal(await inspector.check(normalize(svg('<ellipse cx="50" cy="20" rx="12" ry="15"/><path d="M45 30H55V46H63L70 90H30L37 44H45Z"/>')), true), undefined);
  assert.equal(await inspector.check(normalize(svg('<path d="M35 10H65L80 85H20Z"/><ellipse cx="50" cy="96" rx="12" ry="1" opacity="0.2"/>')), true), undefined);
  for (const source of [
    svg('<rect width="100" height="100" fill="white"/>', 'opacity="0.5"'),
    svg('<rect width="100" height="100" fill="white" display="none"/>' + '<circle cx="50" cy="50" r="20"/>'),
    svg('<defs><rect width="100" height="100" fill="white"/></defs><circle cx="50" cy="50" r="20"/>'),
    svg('<defs><clipPath id="small"><circle cx="50" cy="50" r="20"/></clipPath></defs><rect width="100" height="100" fill="white" clip-path="url(#small)"/>'),
    svg('<rect width="100" height="100"/>', 'fill="none"').replace('<rect width="100" height="100"/>', '<rect width="100" height="100"/><circle cx="50" cy="50" r="20" fill="white"/>'),
  ]) {
    assert.equal(motionVectorCutoutIssue(source), undefined);
    assert.equal(await inspector.check(normalize(source)), undefined);
  }
  const originals = JSON.parse(fs.readFileSync("scripts/fixtures/motion-remotion-opaque-props-20261027.json", "utf8"));
  assert.equal(originals.length, 2);
  for (const original of originals) assert.equal(await inspector.check(original), V.CUTOUT.BACKDROP);
} finally {
  await inspector.close();
}
console.log("Legacy cutout QA passed; complete AI scenes intentionally allow opaque backgrounds. Composition preflight is verified in verify-motion-composition.ts.");
