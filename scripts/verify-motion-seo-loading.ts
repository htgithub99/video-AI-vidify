import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isMotionStageBusy } from "../src/features/motion/lib/motionJob.ts";
import { MOTION_PRODUCTION } from "../src/constants/motionProduction.ts";
import { MotionJobStatus as S, MotionStoryJobKind as K, type MotionStoryJobState } from "../src/types/motionVideo.ts";
const stage = MOTION_PRODUCTION.STAGES.SEO;
const job = { id: "production", kind: K.PRODUCTION, status: S.RENDERING, progress: 0.5, log: [], startedAt: 1 } satisfies MotionStoryJobState;
assert.equal(isMotionStageBusy(job, K.SEO, stage), false);
assert.equal(isMotionStageBusy({ ...job, kind: K.SCENES }, K.SEO, stage), false);
assert.equal(isMotionStageBusy({ ...job, kind: K.SEO }, K.SEO, stage), true);
assert.equal(isMotionStageBusy({ ...job, stepStates: { [stage]: { id: "seo", status: S.RENDERING } } }, K.SEO, stage), true);
for (const status of [S.COMPLETED, S.ERROR, S.CANCELLED]) {
  assert.equal(isMotionStageBusy({ ...job, kind: K.SEO, status }, K.SEO, stage), false);
  assert.equal(isMotionStageBusy({ ...job, stepStates: { [stage]: { id: "seo", status } } }, K.SEO, stage), false);
  assert.equal(isMotionStageBusy({ ...job, status, stepStates: { [stage]: { id: "seo", status: S.RENDERING } } }, K.SEO, stage), false);
}
const output = path.resolve("scratch", `motion-seo-loading-${process.pid}.mjs`);
try {
  const bundle = await build({
    stdin: { contents: 'import React from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {MotionSeoCard} from "./src/features/motion/components/MotionSeoCard.tsx"; export const render = props => renderToStaticMarkup(React.createElement(MotionSeoCard, props));', resolveDir: process.cwd(), loader: "tsx" },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
  });
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bundle.outputFiles[0].text);
  const { render } = await import(pathToFileURL(output).href);
  for (const mode of ["library", "remotion"]) {
    const props = { seo: { options: [], chapters: [], timingFrom: "voice" }, busy: true, canGenerate: true, onGenerate() {}, lang: "vi", mode };
    assert.doesNotMatch(render({ ...props, seoBusy: false }), /animate-spin/, "Finished SEO must stop spinning while another production stage is busy");
    assert.match(render({ ...props, seoBusy: true }), /animate-spin/, "An actual SEO request must retain its loading indicator");
    assert.match(render({ ...props, seoBusy: false }), /disabled=""/, "Separating the spinner must preserve the existing action lock during production");
  }
  process.stdout.write("PASS: SEO loading follows its own stage, stops on every terminal status and stays off during scene generation in both video modes. No live AI calls.\n");
} finally {
  await fs.rm(output, { force: true });
}
