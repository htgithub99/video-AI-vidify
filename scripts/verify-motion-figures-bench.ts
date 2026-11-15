// Builds the figure-table bench: every fixture scene as the browser would get it in "Dựng cảnh AI" and in "Bộ vẽ chuẩn" for
// one profile of every kit look. Check the pages with scripts/motion-figures-bench-check.mjs <dir> <chrome>.
import fs from "node:fs";
import path from "node:path";
import { MOTION_DRAW_STYLES } from "../src/constants/motionDrawStyles/index.js";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionProportionOf } from "../src/lib/motionDrawStyle.js";
import { motionSafeSceneSource, motionSceneBlueprint } from "../src/lib/motionSceneBlueprint.js";

const fixtures = path.resolve("scripts/fixtures/motion-figures");
const out = path.resolve(process.argv[2] || "storage/tmp/figures-bench");
fs.mkdirSync(out, { recursive: true });
const looks = new Map<string, string>();
for (const [id, style] of Object.entries(MOTION_DRAW_STYLES)) if (!looks.has(style.kitLook)) looks.set(style.kitLook, id);
const pages: { file: string; scene: string; mode: string }[] = [];
// The fixture scenes, plus the code-built fallback scenes, which are written on the same figure table.
const camp = motionSceneBlueprint("2. SETTING: dusty camp at dusk.\n5. REQUIRED: refugee (focal): a man; you (focal): b; riders (support): horsemen; wagon (support): covered wagon; tent (support): army tent\n6. MOTION: refugee runs in -> grabs your sleeve\n7. INTERACT: refugee -> you", { shot: "wide" })!;
const map = motionSceneBlueprint("5. REQUIRED: army (focal): tokens; pest (support): marker", { shot: "overhead", kind: "map" })!;
const scenes: [string, string][] = [
  ...fs.readdirSync(fixtures).filter((file) => file.endsWith(".html")).map((name): [string, string] => [name.replace(/\.html$/, ""), fs.readFileSync(path.join(fixtures, name), "utf8")]),
  ["fallback-camp", motionSafeSceneSource(camp)],
  ["fallback-map", motionSafeSceneSource(map)],
];
for (const [scene, html] of scenes) {
  fs.writeFileSync(path.join(out, `${scene}__ai.html`), motionHtmlFigures(html, { kit: false }));
  pages.push({ file: `${scene}__ai.html`, scene, mode: "ai" });
  for (const [look, profile] of looks) {
    const file = `${scene}__${look}.html`;
    fs.writeFileSync(path.join(out, file), motionHtmlFigures(html, { kit: true, profile, proportion: motionProportionOf({ profileId: profile }) }));
    pages.push({ file, scene, mode: look });
  }
}
fs.writeFileSync(path.join(out, "pages.json"), JSON.stringify(pages, null, 1));
console.log(`figures bench: ${pages.length} pages in ${out}`);
