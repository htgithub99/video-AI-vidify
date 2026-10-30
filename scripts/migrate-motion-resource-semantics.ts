import fs from "node:fs";
import path from "node:path";
import { MOTION_SEMANTIC_MIGRATION as M } from "../src/constants/motionResourceSemantics.js";
import { MOTION_PACK } from "../src/constants/motionPack.js";
import { puppetLibDir } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { normalizeMotionResourceSemantics } from "../src/lib/motionResourceSemantics.js";
import { motionInputKey, writeMotionJsonAtomic } from "../src/features/motion/server/services/motionFileUtils.js";
const apply = process.argv.includes(M.APPLY);
const reportRoot = path.resolve(M.ROOT);
const updates: { file: string; before: any; after: any }[] = [];
const unknown: string[] = [];
const invalidIds: string[] = [];
const seen = new Map<string, string>();
const duplicateIds: string[][] = [];
const images = new Map<string, string[]>();
const meanings = new Map<string, string[]>();
let count = 0;
for (const type of M.TYPES) {
  const directory = puppetLibDir(type);
  for (const name of fs.readdirSync(directory).filter((name) => name.endsWith(M.JSON))) {
    const file = path.join(directory, name);
    const before = JSON.parse(fs.readFileSync(file, M.ENCODING));
    if (!Object.values(MOTION_PACK.PRESETS).includes(before.styleId)) continue;
    count++;
    if (name !== before.id + M.JSON || type !== before.type) invalidIds.push(file);
    if (seen.has(before.id)) duplicateIds.push([seen.get(before.id)!, file]);
    seen.set(before.id, file);
    const after = normalizeMotionResourceSemantics(before);
    if ((type === "set" || type === "set_base") && !after.locationFamily) unknown.push(before.id);
    if (JSON.stringify(before) !== JSON.stringify(after)) updates.push({ file, before, after });
    const appearance = { styleId: before.styleId, type, svg: before.svg, head: before.head, body: before.body, colors: before.colors, sprites: before.sprites, spots: before.spots, compositions: before.compositions, base: before.base, anchor: before.anchor, box: before.box, floorY: before.floorY, horizonY: before.horizonY, height: before.height, grip: before.grip, emitter: before.emitter };
    const imageKey = motionInputKey(appearance);
    images.set(imageKey, [...(images.get(imageKey) || []), before.id]);
    const meaning = [before.styleId, type, before.key || before.archetype || before.group || before.family, before.time, before.sceneCondition, before.fixtureStates, before.age, before.gender];
    const meaningKey = motionInputKey(meaning);
    meanings.set(meaningKey, [...(meanings.get(meaningKey) || []), before.id]);
  }
}
if (invalidIds.length || duplicateIds.length) throw new Error(JSON.stringify({ invalidIds, duplicateIds }));
fs.mkdirSync(reportRoot, { recursive: true });
if (apply)
  for (const update of updates) {
    const backup = path.join(reportRoot, M.BACKUP, update.before.type, update.before.id + M.JSON);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    if (!fs.existsSync(backup)) fs.copyFileSync(update.file, backup);
    writeMotionJsonAtomic(update.file, update.after);
  }
const report = { apply, count, updated: updates.map((update) => update.before.id), unknown, invalidIds, duplicateIds, sameAppearance: [...images.values()].filter((ids) => ids.length > 1), sameSemanticVariants: [...meanings.values()].filter((ids) => ids.length > 1), deleted: [] };
const previousFile = path.join(reportRoot, M.REPORT);
if (fs.existsSync(previousFile)) {
  const previous = JSON.parse(fs.readFileSync(previousFile, M.ENCODING));
  if (previous.apply && previous.updated?.length) {
    const history = path.join(reportRoot, M.HISTORY);
    fs.mkdirSync(history, { recursive: true });
    const archive = path.join(history, motionInputKey(previous) + M.JSON);
    if (!fs.existsSync(archive)) fs.copyFileSync(previousFile, archive);
  }
}
writeMotionJsonAtomic(path.join(reportRoot, M.REPORT), report);
console.log(JSON.stringify({ apply, count, updated: updates.length, unknown: unknown.length, duplicateIds: duplicateIds.length, sameAppearance: report.sameAppearance.length, semanticVariantGroups: report.sameSemanticVariants.length, deleted: 0, report: path.join(reportRoot, M.REPORT) }));
