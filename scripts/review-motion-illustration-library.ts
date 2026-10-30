import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ILLUSTRATION_QA as Q } from "./motionIllustrationVerificationTexts.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { listPuppets } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { layoutPuppetFrame } from "../src/features/motion/server/services/puppet/layout.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import type { PuppetAsset, PuppetCharacter, PuppetFrame, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const root = path.resolve(Q.ROOT);
const manifest = JSON.parse(fs.readFileSync(path.join(root, Q.MANIFEST), "utf8"));
const inventory = K.TYPES.flatMap((type) => listPuppets(type as any));
const migrated = manifest.records.map((row: any) => JSON.parse(fs.readFileSync(row.staged, "utf8")) as PuppetAsset);
const assets = new Map<string, PuppetAsset>([...inventory, ...migrated].map((asset) => [asset.id, asset]));
const stills = path.join(root, Q.STILLS);
fs.mkdirSync(stills, { recursive: true });
const results: any[] = [];
const comparison = process.argv.includes("--comparison");
const resultFile = path.join(root, comparison ? "comparison-review.json" : Q.RESULTS);
const session = await openStillSession();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setContent(Q.SVG_PAGE);
try {
  const rows = manifest.records
    .filter((row: any) => row.action !== "historical_not_selected" && (!comparison || row.repairs.includes("seated_head_and_rig")))
    .flatMap((row: any) =>
      comparison
        ? [
            { ...row, before: true },
            { ...row, before: false },
          ]
        : [row],
    );
  for (const row of rows) {
    const identifier = row.id + (comparison ? (row.before ? "-before" : "-after") : "");
    const asset = row.before ? (JSON.parse(fs.readFileSync(row.backup, "utf8")) as PuppetAsset) : assets.get(row.id)!;
    const styleId = "styleId" in asset ? asset.styleId : asset.id;
    const styleRow = manifest.records.find((row: any) => row.id === styleId);
    const style = row.before && styleRow ? (JSON.parse(fs.readFileSync(styleRow.backup, "utf8")) as PuppetStylePack) : (assets.get(styleId) as PuppetStylePack);
    const cast = [...assets.values()].filter((candidate): candidate is PuppetCharacter => candidate.type === T.CHARACTER && candidate.styleId === styleId && candidate.age === "adult" && candidate.group !== "ghost" && !!candidate.archetype);
    try {
      let file: string;
      let issues: string[] = [];
      if (asset.type === T.SET || asset.type === T.CHARACTER) {
        const isSet = asset.type === T.SET;
        const set = (isSet ? asset : { svg: Q.RAW_SVG, floorY: 950, spots: Q.POSES.map((pose, index) => ({ key: pose, kind: pose === Q.IDLE ? "stand" : pose, x: 420 + index * 480, y: 950, label: pose })) }) as PuppetSet;
        const composition = isSet ? Q.CASES.flatMap((kind) => set.compositions?.filter((composition) => composition.kind === kind) || [])[0] : undefined;
        const selected = composition
          ? Object.entries(composition.roles).map(([role, key]) => ({ role, spot: set.spots!.find((spot) => spot.key === key)! }))
          : isSet
            ? (set.spots || [])
                .filter((spot) => spot.kind === "stand")
                .slice(0, 1)
                .map((spot, index) => ({ role: String(index), spot }))
            : set.spots!.map((spot, index) => ({ role: String(index), spot }));
        const characters = Object.fromEntries(selected.map(({ role }, index) => [role, isSet ? cast[index % cast.length] : asset]));
        const frame = layoutPuppetFrame({ shot: Q.WIDE, set: Q.ROOM, ...(composition ? { blocking: { kind: composition.kind, roles: Object.fromEntries(selected.map(({ role }) => [role, role])) } } : {}), actors: selected.map(({ role, spot }) => ({ char: role, pose: spot.kind === "stand" ? Q.IDLE : spot.kind, spot: spot.key, face: spot.face || Q.FRONT, expr: Q.NEUTRAL })) } as PuppetFrame, {
          set,
          body: style.body,
          heights: Object.fromEntries(Object.entries(characters).map(([key, character]) => [key, (character as PuppetCharacter).height])),
        });
        const spec: MotionSpec = { title: asset.name, aspect: "16:9", fps: 24, duration: Q.DURATION, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: { ...set, wallY: set.horizonY } }, characters: characters as any, props: {}, motion: false }, shots: [{ id: row.id, start: 0, end: Q.DURATION, template: P.TEMPLATE, params: { frames: [{ ...frame, start: 0, end: Q.DURATION }] } }] };
        const [image] = await session.render(spec, [{ id: identifier, t: 1 }], stills, { width: comparison ? 1280 : 640, height: comparison ? 720 : 360 });
        file = image.file;
        issues = image.issues;
      } else {
        const svg = "svg" in asset ? asset.svg : Q.RAW_SVG;
        const data = await page.evaluate(
          async ({ svg, prefix, mime }) => {
            const image = new Image();
            image.src = prefix + btoa(unescape(encodeURIComponent(svg)));
            await image.decode();
            const canvas = document.querySelector("canvas")!;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "#ded4be";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const scale = Math.min(620 / image.width, 340 / image.height);
            ctx.drawImage(image, (640 - image.width * scale) / 2, (360 - image.height * scale) / 2, image.width * scale, image.height * scale);
            return canvas.toDataURL(mime, 0.85).split(",")[1];
          },
          { svg, prefix: Q.SVG_DATA, mime: Q.STILL_JPEG },
        );
        file = path.join(stills, row.id + ".jpg");
        fs.writeFileSync(file, Buffer.from(data, "base64"));
      }
      results.push({ id: identifier, type: row.type, styleId, name: asset.name, file, issues, repairs: row.repairs, rendered: issues.length === 0, visualReview: "pending" });
    } catch (error) {
      results.push({ id: row.id, type: row.type, styleId, name: asset.name, issues: [String((error as Error).message)], rendered: false, visualReview: "pending" });
    }
    if (results.length % Q.PROGRESS === 0) {
      fs.writeFileSync(resultFile, JSON.stringify(results));
      process.stdout.write(JSON.stringify({ rendered: results.length, failed: results.filter((row) => !row.rendered).length }) + "\n");
    }
  }
} finally {
  fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
  await session.close();
  await browser.close();
}
const failed = results.filter((row) => !row.rendered);
process.stdout.write(JSON.stringify({ records: results.length, failed }) + "\n");
if (failed.length) process.exitCode = 1;
