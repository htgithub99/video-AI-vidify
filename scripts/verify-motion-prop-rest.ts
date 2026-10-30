import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import FIXTURE from "./fixtures/motion-prop-rest-20261026.json";
import { PROP_REST_QA as Q } from "./motionPropRestVerificationTexts.js";
import { COMFORT_QA as C } from "./motionComfortVerificationTexts.js";
import { puppetPropFits, puppetPropRestRotation } from "../src/lib/motionPuppetAssets.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { listPuppets } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { puppetKitSpec } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import type { PuppetObject, PuppetProp } from "../src/types/motionPuppet.js";
const object = FIXTURE as PuppetObject;
const cases: { name: string; prop: any }[] = [];
for (const [preset, styleId] of Object.entries(K.PRESETS)) {
  const prop = listPuppets<PuppetProp>(T.PROP).find((prop) => prop.styleId === styleId && prop.key === object.catalogKey)!;
  assert.ok(prop);
  assert.ok(puppetPropFits(object, prop));
  assert.equal(puppetPropRestRotation(object, prop), 180);
  assert.ok(!puppetPropFits({ ...object, catalogKey: "oil_lamp" }, prop));
  assert.ok(!puppetPropFits({ ...object, requirements: [...object.requirements!, "silver"] }, prop));
  assert.ok(!puppetPropFits({ ...object, physicalState: "broken", requirements: ["broken"] }, prop));
  assert.equal(puppetPropRestRotation({ ...object, mount: "held" }, prop), undefined);
  assert.ok(!puppetPropFits({ ...object, mount: "held" }, prop));
  const native = { ...prop, desc: prop.desc + " overturned", requirements: ["overturned"] };
  assert.equal(puppetPropRestRotation(object, native), undefined);
  assert.ok(puppetPropFits(object, native));
  const upright = { ...object, key: object.identity!, physicalState: undefined, state: undefined, requirements: [] };
  const sideways = { ...object, key: object.identity + "_state_on_side", physicalState: "on_side", state: "on_side", requirements: ["on_side"] };
  const gen: any = { styleId, characters: {}, sets: {}, props: { [object.key]: prop.id, [upright.key]: prop.id, [sideways.key]: prop.id }, reads: { turned: { objects: [object] }, upright: { objects: [upright] }, sideways: { objects: [sideways] } } };
  const spec = puppetKitSpec(gen, false)!;
  assert.equal(spec.props[object.key].restRotation, 180);
  assert.equal(spec.props[upright.key].restRotation, undefined);
  assert.equal(spec.props[sideways.key].restRotation, 90);
  assert.ok(Object.values(spec.props).every((item) => item.svg === prop.svg));
  for (const key of [upright.key, sideways.key, object.key]) cases.push({ name: preset + " · " + (spec.props[key].restRotation || 0) + "°", prop: spec.props[key] });
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1320, height: 800 } });
  await page.setContent(Q.HTML);
  for (const file of C.MOTION_ENGINE) await page.addScriptTag({ content: (await fs.readFile(file, "utf8")).replace(Q.HOOK, Q.EXPOSE) });
  const samples = await page.evaluate(
    async ({ cases, q }) => {
      const me = (window as any).MotionEngine;
      const results = [];
      for (const sample of cases) {
        const element = document.createElement("section");
        const title = document.createElement("div");
        title.textContent = sample.name;
        const canvas = document.createElement("canvas");
        canvas.width = q.WIDTH;
        canvas.height = q.HEIGHT;
        element.append(title, canvas);
        document.body.append(element);
        const g = canvas.getContext("2d")!;
        const state = { kit: { props: { item: sample.prop } } };
        await me.PUPPET_PRELOAD(state);
        if (!me.testDrawProp(g, state, "item", q.X, q.BASE, q.SIZE, 0)) throw new Error(sample.name);
        const pixels = g.getImageData(0, 0, canvas.width, canvas.height).data;
        let left = Infinity,
          right = -Infinity,
          bottom = -Infinity;
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++)
            if (pixels[(y * canvas.width + x) * 4 + 3] > 48) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
        const before = canvas.toDataURL();
        g.clearRect(0, 0, canvas.width, canvas.height);
        me.testDrawProp(g, state, "item", q.X, q.BASE, q.SIZE, 0);
        results.push({ angle: sample.prop.restRotation, bottom, center: (left + right) / 2, stable: canvas.toDataURL() === before });
        g.strokeStyle = "#d22";
        g.beginPath();
        g.moveTo(0, q.BASE);
        g.lineTo(canvas.width, q.BASE);
        g.stroke();
      }
      return results;
    },
    { cases, q: Q },
  );
  for (const sample of samples) {
    assert.ok(sample.stable);
    if (sample.angle !== undefined) {
      assert.ok(Math.abs(sample.bottom - Q.BASE) <= 3, JSON.stringify(sample));
      assert.ok(Math.abs(sample.center - Q.X) <= 2, JSON.stringify(sample));
    }
  }
  await page.screenshot({ path: Q.SCREENSHOT, fullPage: true });
  process.stdout.write(Q.PASSED);
} finally {
  await browser.close();
}
