// Scene layout bench: renders fixed kit scenes (no AI) in every drawing style and checks layout rules
// (no sky below the ground line, nothing standing on open water or in the sky, small loose props, large objects
// inside the frame, visible motion) plus kit parity between skins (props honour width, sizes agree across styles).
// Step 1 (any machine): writes storage/tmp/scene-bench/<style>__<fixture>.html and probe pages.
// Step 2 (needs Chrome): node scripts/motion-scene-bench-check.mjs [chromePath] renders and checks them.
import fs from "node:fs";
import path from "node:path";
import { motionHtmlWithKit } from "../src/lib/motionHtmlKit.js";
import { MOTION_DRAW_STYLES, MOTION_DRAW_STYLE_ALIAS } from "../src/constants/motionDrawStyles/index.js";

const dir = path.resolve("scripts/fixtures/motion-scene-bench");
const out = path.resolve(process.argv[2] || "storage/tmp/scene-bench");
fs.mkdirSync(out, { recursive: true });
const shell = fs.readFileSync(path.join(dir, "_shell.txt"), "utf8");
const fixtures = fs.readdirSync(dir).filter((name) => name.endsWith(".js"));
const styles = [...Object.keys(MOTION_DRAW_STYLES), ...Object.keys(MOTION_DRAW_STYLE_ALIAS)];
const probe = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body style=\"margin:0;background:transparent\"><canvas id=\"motion-canvas\" width=\"1280\" height=\"720\"></canvas></body></html>";
const written: string[] = [];
for (const style of styles) {
  for (const fixture of fixtures) {
    const body = fs.readFileSync(path.join(dir, fixture), "utf8");
    const file = `${style}__${fixture.replace(/\.js$/, "")}.html`;
    fs.writeFileSync(path.join(out, file), motionHtmlWithKit(shell.replace("/*BODY*/", body), style, 1241));
    written.push(file);
  }
  fs.writeFileSync(path.join(out, `${style}__probe.html`), motionHtmlWithKit(probe, style, 1241));
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ styles, fixtures: fixtures.map((name) => name.replace(/\.js$/, "")) }, null, 1));
console.log(`scene bench: ${written.length} scenes for ${styles.length} styles in ${out}`);
