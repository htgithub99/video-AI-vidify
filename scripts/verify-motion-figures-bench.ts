// Builds the figure-table bench: every fixture scene as the browser would get it in "Dựng cảnh AI" and in "Bộ vẽ chuẩn" for
// one profile of every kit look, and the real scenes (fixtures/motion-figures/real, from a finished project) also through
// every layout's camera. Check the pages with scripts/motion-figures-bench-check.mjs <dir> <chrome>.
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
const pages: { file: string; scene: string; mode: string; layout?: string; camera?: boolean; hops?: boolean }[] = [];
// The fixture scenes, plus the code-built fallback scenes, which are written on the same figure table.
const camp = motionSceneBlueprint("2. SETTING: dusty camp at dusk.\n5. REQUIRED: refugee (focal): a man; you (focal): b; riders (support): horsemen; wagon (support): covered wagon; tent (support): army tent\n6. MOTION: refugee runs in -> grabs your sleeve\n7. INTERACT: refugee -> you", { shot: "wide" })!;
const map = motionSceneBlueprint("5. REQUIRED: army (focal): tokens; pest (support): marker", { shot: "overhead", kind: "map" })!;
const real = JSON.parse(fs.readFileSync(path.join(fixtures, "real", "scenes.json"), "utf8")) as Record<string, { shot?: string; kind?: string }>;
const scenes: [string, string][] = [
  ...fs.readdirSync(fixtures).filter((file) => file.endsWith(".html")).map((name): [string, string] => [name.replace(/\.html$/, ""), fs.readFileSync(path.join(fixtures, name), "utf8")]),
  ...Object.keys(real).map((name): [string, string] => [name, fs.readFileSync(path.join(fixtures, "real", name + ".html"), "utf8")]),
  ["fallback-camp", motionSafeSceneSource(camp)],
  ["fallback-map", motionSafeSceneSource(map)],
];
for (const [scene, html] of scenes) {
  fs.writeFileSync(path.join(out, `${scene}__ai.html`), motionHtmlFigures(html, { kit: false, layout: "wide" }));
  pages.push({ file: `${scene}__ai.html`, scene, mode: "ai" });
  for (const [look, profile] of looks) {
    const file = `${scene}__${look}.html`;
    fs.writeFileSync(path.join(out, file), motionHtmlFigures(html, { kit: true, profile, proportion: motionProportionOf({ profileId: profile }), layout: "wide" }));
    // The fit of each look is compared over the scene as drawn. The cut-out look brings its own camera and draws walkers a
    // step ahead of their even track as they hop (both checked by verify-motion-cutout): its pages are rendered with the
    // camera off and checked for errors, blank frames and edges, not for boxes equal to the scene's own drawing.
    pages.push({ file, scene, mode: look, ...(MOTION_DRAW_STYLES[profile as keyof typeof MOTION_DRAW_STYLES].movement === "cutout" ? { camera: false, hops: true } : {}) });
  }
  // The layouts' cameras over the real scenes, as drawn by the scene and by one kit look.
  if (real[scene])
    for (const layout of ["stage", "medium", "cinematic", "close"])
      for (const [mode, render] of [["ai", { kit: false }], ["sketch", { kit: true, profile: "sketch", proportion: motionProportionOf({ profileId: "sketch" }) }]] as const) {
        const file = `${scene}__${mode}__${layout}.html`;
        fs.writeFileSync(path.join(out, file), motionHtmlFigures(html, { ...render, layout, scene: real[scene] }));
        pages.push({ file, scene, mode, layout });
      }
}
fs.writeFileSync(path.join(out, "pages.json"), JSON.stringify(pages, null, 1));
console.log(`figures bench: ${pages.length} pages in ${out}`);
