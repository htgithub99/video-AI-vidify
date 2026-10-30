import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { motionProgressLabel } from "../src/lib/motionProgressLabel.js";
import { MOTION_PROGRESS } from "../src/constants/motionProgress.js";
const raw = "Dựng cảnh minh họa, Cảnh 3 cần tạo lại: locator.click: Timeout 30000ms exceeded. Call log: " + "cdk-overlay-backdrop intercepts pointer events. ".repeat(60);
const short = motionProgressLabel(raw);
assert.ok(short.length <= MOTION_PROGRESS.TEXT_LIMIT);
assert.ok(!short.includes("\n"));
assert.equal(motionProgressLabel("Đang dựng cảnh 16/17"), "Đang dựng cảnh 16/17");
const entry = `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Film} from 'lucide-react'; import {ActionBtn,StopBtn} from './src/features/motion/components/MotionControls.tsx'; import {MOTION_STYLES as S} from './src/features/motion/constants/motionStyles.ts';
createRoot(document.getElementById('root')).render(<main style={{padding:16,width:'100%',boxSizing:'border-box'}}><h2>Tiến độ dựng cảnh</h2>{${JSON.stringify([short, "Dựng cảnh minh họa, Đã dựng cảnh Remotion 16/17. Còn 52 nhóm đang phân cảnh; tổng số cảnh sẽ cập nhật khi phân cảnh xong."]).replace(/</g, "\\u003c")}.map((label,i)=><div key={i} data-row={i} className={S.PRODUCTION_ACTIONS} style={{marginTop:16}}><ActionBtn busy icon={Film} onClick={()=>{}} className={S.PRODUCTION_ACTION_BUTTON}>{label}</ActionBtn><StopBtn label="Dừng AI" onClick={()=>window.stopClicks=(window.stopClicks||0)+1}/></div>)}</main>);`;
const bundled = await build({ stdin: { contents: entry, loader: "tsx", resolveDir: process.cwd() }, bundle: true, platform: "browser", format: "iife", write: false });
const cssName = fs.readdirSync("dist/assets").find((name) => /^index.*\.css$/.test(name))!;
const css = fs.readFileSync(path.join("dist/assets", cssName), "utf8");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.route("http://motion-action.test/**", (route) => route.fulfill({ contentType: "text/html", body: `<html class="dark"><head><style>${css}</style></head><body style="background:#100c18;color:#eee;margin:0"><div id="root"></div><script>${bundled.outputFiles[0].text}</script></body></html>` }));
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 260 });
    await page.goto("http://motion-action.test/");
    await page.locator("[data-row]").first().waitFor();
    for (const row of await page.locator("[data-row]").all()) {
      const metrics = await row.evaluate((element) => {
        const buttons = [...element.querySelectorAll("button")];
        return { row: element.getBoundingClientRect().toJSON(), buttons: buttons.map((button) => ({ rect: button.getBoundingClientRect().toJSON(), text: getComputedStyle(button).whiteSpace, opacity: getComputedStyle(button).opacity })), overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(metrics.overflow, false);
      assert.equal(metrics.buttons[0].rect.height, 40);
      assert.equal(metrics.buttons[1].rect.height, 40);
      assert.equal(metrics.buttons[1].text, "nowrap");
      assert.equal(metrics.buttons[0].opacity, "1");
      assert.ok(metrics.buttons[0].rect.right <= metrics.buttons[1].rect.left);
      assert.ok(metrics.buttons[1].rect.right <= metrics.row.right + 1);
      await row.getByRole("button", { name: "Dừng AI", exact: true }).click();
    }
    assert.equal(await page.evaluate(() => (window as any).stopClicks), 2);
    fs.mkdirSync("scratch/motion-scene-fallback-20261030", { recursive: true });
    await page.screenshot({ path: `scratch/motion-scene-fallback-20261030/buttons-${width}.png` });
  }
  console.log("PASS: progress/stop buttons retain 40px height, readable opacity, one-line stop, ellipsis and clicks at 360/768/1440px.");
} finally {
  await browser.close();
}
