import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { CHIBI_REVIEW as Q } from "./motionChibiReviewTexts.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { listPuppets } from "../src/server/services/puppet/kitLibrary.js";
import { layoutPuppetFrame } from "../src/server/services/puppet/layout.js";
import { openStillSession } from "../src/server/services/motionRenderService.js";
import type { PuppetCharacter, PuppetStylePack, PuppetSet, PuppetFrame, PuppetProp } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const root = path.resolve(Q.ROOT);
const manifest = JSON.parse(fs.readFileSync(path.join(root, Q.MANIFEST), "utf8"));
const read = (row: any, before = false) => JSON.parse(fs.readFileSync(before ? row.backup : row.staged, "utf8"));
const styleRow = manifest.records.find((row: any) => row.type === Q.STYLE);
const characters = manifest.records.filter((row: any) => row.type === Q.CHARACTER);
const props = Object.fromEntries(
  listPuppets<PuppetProp>("prop")
    .filter((prop) => prop.styleId === read(styleRow).id && ["rice_bowl", "tea_cup", "open_book", "comb"].includes(prop.key))
    .map((prop) => [prop.key, prop]),
);
const output = path.join(root, Q.STILLS);
fs.mkdirSync(output, { recursive: true });
const session = await openStillSession();
const results: any[] = [];
const render = async (id: string, style: PuppetStylePack, cast: Record<string, PuppetCharacter>, frame: PuppetFrame, set?: PuppetSet) => {
  const spec: MotionSpec = { title: Q.TITLE, aspect: "16:9", fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, subtitles: [], kit: { style, sets: { room: set || { svg: Q.SVG, floorY: 940, horizonY: 500 } }, characters: cast, props, motion: false }, shots: [{ id, start: 0, end: 4, template: P.TEMPLATE, params: { frames: [{ ...frame, start: 0, end: 4 }] } }] };
  const [result] = await session.render(spec, [{ id, t: 1 }], output, { width: 1280, height: 720 });
  assert.deepEqual(result.issues, [], id);
  results.push({ id, file: result.file, issues: result.issues });
};
try {
  for (const row of characters) {
    for (const before of [true, false]) {
      const character = read(row, before);
      const style = read(styleRow, before);
      const poses = Q.POSES.slice(0, 4);
      const cast = Object.fromEntries(poses.map((pose) => [pose, character]));
      await render(row.id + (before ? "-before" : "-after"), style, cast, { shot: "wide", set: Q.ROOM, actors: poses.map((pose, index) => ({ char: pose, pose, face: "front", expr: "neutral", x: 0.14 + index * 0.24, y: 940, k: 1.35 })) });
    }
    if (results.length % 20 === 0) process.stdout.write(JSON.stringify({ images: results.length }) + "\n");
  }
  const style = read(styleRow);
  for (const key of ["festival_woman", "hmong_woman", "highland_man", "old_woman", "boy", "ghost_woman"]) {
    const row = characters.find((row: any) => read(row).archetype === key)!;
    const character = read(row);
    for (let group = 0; group < Math.ceil(Q.POSES.length / 6); group++) {
      const poses = Q.POSES.slice(group * 6, group * 6 + 6);
      const cast = Object.fromEntries(poses.map((pose) => [pose, character]));
      await render(key + "-actions-" + group, style, cast, {
        shot: "wide",
        set: Q.ROOM,
        actors: poses.map((pose, index) => ({ char: pose, pose: pose === "read" ? "idle" : pose, ...(pose === "read" ? { gesture: pose } : {}), ...(["give", "hold", "drink", "read"].includes(pose) ? { hold: pose === "read" ? "open_book" : pose === "drink" ? "tea_cup" : "rice_bowl" } : {}), face: "front", expr: Q.EXPRESSIONS[index], x: 0.08 + index * 0.168, y: 940, k: 1.1 })),
      });
    }
    const faces = ["front", "left", "right", "back"];
    await render(key + "-views", style, Object.fromEntries(faces.map((face) => [face, character])), { shot: "wide", set: Q.ROOM, actors: faces.map((face, index) => ({ char: face, face, pose: "idle", expr: "neutral", x: 0.14 + index * 0.24, y: 940, k: 1.35 })) });
  }
  const sets = listPuppets<PuppetSet>("set").filter((set) => set.styleId === style.id);
  for (const kind of ["dining", "bedside", "grooming", "two_patients"]) {
    const set = sets.find((set) => set.compositions?.some((entry) => entry.kind === kind));
    assert.ok(set, kind);
    const composition = set.compositions!.find((entry) => entry.kind === kind)!;
    const roles = Object.entries(composition.roles);
    const cast = Object.fromEntries(roles.map(([role], index) => [role, read(characters.find((row: any) => read(row).archetype === ["hmong_woman", "highland_man", "old_woman"][index % 3]))]));
    const frame = layoutPuppetFrame(
      {
        shot: "wide",
        set: Q.ROOM,
        blocking: { kind, roles: Object.fromEntries(roles.map(([role]) => [role, role])) },
        actors: roles.map(([role, spotKey]) => {
          const spot = set.spots!.find((spot) => spot.key === spotKey)!;
          return { char: role, pose: spot.kind === "stand" ? "idle" : spot.kind, spot: spot.key, face: spot.face || "front", expr: "neutral" };
        }),
      } as PuppetFrame,
      { set, body: style.body, heights: Object.fromEntries(Object.entries(cast).map(([key, character]) => [key, character.height])) },
    );
    if (kind === "grooming") {
      frame.contacts = [{ actor: "groomer", target: "subject", point: "hand", targetPoint: "head", mode: "reach" }];
      Object.assign(frame.actors.find((actor) => actor.char === "groomer")!, { hold: "comb", gesture: "hold" });
    }
    if (kind === "dining") for (const actor of frame.actors) Object.assign(actor, { hold: "rice_bowl", gesture: "hold" });
    await render("scene-" + kind, style, cast, frame, set);
  }
} finally {
  fs.writeFileSync(path.join(root, Q.RESULTS), JSON.stringify(results, null, 2));
  await session.close();
}
process.stdout.write(JSON.stringify({ images: results.length, issues: results.flatMap((row) => row.issues) }) + "\n");
