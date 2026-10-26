import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { D } from "./motionDepthVerificationTexts.js";
const source = await Promise.all([D.TEXTS, D.CORE, process.argv[2] || D.ENGINE].map((file) => fs.readFile(file, D.UTF8)));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(D.HTML);
  for (const script of source.slice(0, 2)) await page.addScriptTag({ content: script });
  await page.addScriptTag({ content: source[2].replace(D.HOOK, D.EXPOSE) });
  const samples = await page.evaluate(
    async (d) => {
      const me = (window as any).MotionEngine;
      const canvas = document.getElementById(d.CANVAS) as HTMLCanvasElement;
      const g = canvas.getContext(d.CONTEXT) as CanvasRenderingContext2D;
      const kit = { sets: { [d.SET]: { svg: d.SET_SVG, floorY: 1000 } }, props: { [d.RED]: { svg: d.RED_SVG, base: [256, 512] }, [d.GREEN]: { svg: d.GREEN_SVG, base: [256, 512] } }, characters: {} };
      await me.PUPPET_PRELOAD({ kit });
      const out = [];
      for (const levels of d.CAMERA_LEVELS) {
        const actors = levels.map((y: number, i: number) => ({ A: { pose: d.POSE }, x: 700 + i * 500, y, k: 1, L: { total: 360, headH: 150, headW: 100 } }));
        const box = me.frameBox({ VW: 1920, VH: 1080, style: { body: { head: 0.42 } } }, { shot: d.CAMERA_SHOT }, null, actors);
        if (box.cy - box.h / 2 > Math.min(...levels) - 360 || box.cy + box.h / 2 < Math.max(...levels)) throw new Error(JSON.stringify({ levels, box }));
      }
      for (const secondary of [false, true]) {
        const prop = { prop: d.RED, propX: 0.5, propY: 1040, propH: 120 };
        const actors = [{ A: { pose: d.POSE }, x: 900, y: 700, k: 1, L: { total: 240, headH: 100, headW: 60 } }];
        const frame = { shot: d.CAMERA_SHOT, ...(secondary ? { items: [prop] } : prop) };
        const box = me.frameBox({ VW: 1920, VH: 1080, style: { body: { head: 0.42 } } }, frame, null, actors);
        if (box.cy + box.h / 2 < prop.propY || box.cy - box.h / 2 > actors[0].y - actors[0].L.total) throw new Error(JSON.stringify({ secondary, box }));
      }
      const floorKit = { sets: { [d.SET]: { svg: d.FLOOR_SET_SVG, floorY: 1000 } }, characters: {}, props: {} };
      await me.PUPPET_PRELOAD({ kit: floorKit });
      const floorFrame = { set: d.SET, shot: d.SHOT, camera: { move: d.MOVE }, actors: [] };
      const floorState = me.PUPPET2D.init({ spec: { kit: floorKit }, params: { frames: [floorFrame] } });
      me.drawStage(g, { W: 1920, H: 1080 }, floorState, floorFrame, 0, 0);
      const furniture = Array.from(g.getImageData(500, 780, 1, 1).data);
      if (JSON.stringify(furniture) !== JSON.stringify(d.EXPECTED.red)) throw new Error(JSON.stringify(furniture));
      for (const actors of [false, true])
        for (const primaryFront of [false, true])
          for (const secondaryFront of [false, true]) {
            const frame = { set: d.SET, shot: d.SHOT, camera: { move: d.MOVE }, actors: actors ? [{ char: d.ACTOR, pose: d.POSE, face: d.FACE, x: 0.1, y: 1000 }] : [], prop: d.RED, propX: 500 / 1920, propY: primaryFront ? 950 : 850, propH: 200, items: [{ prop: d.GREEN, propX: 1400 / 1920, propY: secondaryFront ? 950 : 850, propH: 200 }] };
            const state = me.PUPPET2D.init({ spec: { kit }, params: { frames: [frame] } });
            me.drawStage(g, { W: 1920, H: 1080 }, state, frame, 0, 0);
            out.push({ actors, primaryFront, secondaryFront, red: Array.from(g.getImageData(500, 780, 1, 1).data), green: Array.from(g.getImageData(1400, 780, 1, 1).data) });
          }
      return out;
    },
    { ...D, PROP_SVG: undefined, RED_SVG: D.PROP_SVG(D.RED_COLOR), GREEN_SVG: D.PROP_SVG(D.GREEN_COLOR) } as any,
  );
  for (const sample of samples) {
    assert.deepEqual(sample.red, sample.primaryFront ? D.EXPECTED.red : D.EXPECTED.fence, JSON.stringify(sample));
    assert.deepEqual(sample.green, sample.secondaryFront ? D.EXPECTED.green : D.EXPECTED.fence, JSON.stringify(sample));
  }
  process.stdout.write(D.PASSED);
} finally {
  await browser.close();
}
