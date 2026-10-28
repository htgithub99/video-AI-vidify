import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import fs from "node:fs";
import path from "node:path";
import { PCM as M } from "./legacy-motion-remotion/catalogMigration.js";
import { PA } from "../src/constants/motionPuppetAssets.js";
import { puppetAssetName, puppetEnglish, puppetObjectClass, puppetPropAllowed, puppetPropFits } from "../src/lib/motionPuppetAssets.js";
import type { PuppetProp } from "../src/types/motionPuppet.js";
const root = path.resolve(M.ROOT);
const backup = path.resolve(M.BACKUP, new Date().toISOString().replace(/[:.]/g, VT.DASH));
const apply = process.argv.includes(M.APPLY);
const assets = new Map<string, any>();
const changes: { file: string; record: any }[] = [];
const removed: { series: string; key: string; id: string }[] = [];
const characterDescriptions = new Map<string, string[]>();
for (const [id, translation] of Object.entries(M.CHARACTERS)) {
  const file = path.join(root, M.CHAR, id + PA.JSON);
  if (!fs.existsSync(file)) continue;
  const source = JSON.parse(fs.readFileSync(file, PA.UTF8));
  characterDescriptions.set(source.originalDesc || source.desc, translation);
}
for (const kind of M.TYPES)
  for (const file of fs.readdirSync(path.join(root, kind)).filter((f) => f.endsWith(PA.JSON))) {
    const relative = path.join(kind, file);
    const old = JSON.parse(fs.readFileSync(path.join(root, relative), PA.UTF8));
    const a = structuredClone(old);
    const key = a.key || a.archetype || a.tags?.[0] || a.family;
    const character = M.CHARACTERS[a.id] || characterDescriptions.get(a.originalDesc || a.desc);
    const place = M.PLACES[a.tags?.[0]];
    if (character) {
      a.name = character[0];
      a.desc = character[1];
      a.role = character[0];
      if (character[0] === M.CHARACTERS[M.BOY_ID][0]) {
        a.gender = M.MALE;
        a.tags = a.tags.map((t: string) => (t === M.FEMALE ? M.MALE : t));
      }
    } else if (place) {
      a.name = place[0] + (old.name.match(M.VARIANT)?.[1] || VT.EMPTY);
      a.desc = place[1];
    } else {
      if (a.name && !puppetEnglish(a.name)) {
        a.name = puppetAssetName(key) + (old.name.match(M.SEED_NAME)?.[0] || VT.EMPTY) + (old.name.match(M.VARIANT)?.[1] || VT.EMPTY);
      }
      if (!puppetEnglish(a.desc)) a.desc = M.PROPS[key] || M.UNKNOWN;
      if (a.role && !puppetEnglish(a.role)) a.role = a.group || a.name;
    }
    if (kind === M.PROP) {
      const category = puppetObjectClass({ key: a.key, type: a.objectType || VT.OTHER });
      if (category !== PA.PROP || M.NON_VISUAL.some((k) => k === a.key)) a.catalogStatus = PA.QUARANTINE;
      a.category = category === PA.SCENERY ? PA.SCENE_FEATURE : category === PA.EXCLUDED ? PA.EXCLUDED : PA.PROP;
    }
    if (old.name !== a.name && old.name) a.originalName ??= old.name;
    if (old.desc !== a.desc && old.desc) a.originalDesc ??= old.desc;
    a.catalogVersion = PA.VERSION;
    if (!puppetEnglish(a.desc) || a.desc === M.UNKNOWN || (a.name && !puppetEnglish(a.name))) throw new Error(relative);
    assets.set(a.id, a);
    if (JSON.stringify(a) !== JSON.stringify(old)) changes.push({ file: relative, record: a });
  }
for (const file of fs.readdirSync(path.join(root, M.SERIES)).filter((f) => f.endsWith(PA.JSON))) {
  const relative = path.join(M.SERIES, file);
  const old = JSON.parse(fs.readFileSync(path.join(root, relative), PA.UTF8));
  const a = structuredClone(old);
  for (const [key, id] of Object.entries(a.props || {})) {
    const prop = assets.get(id as string) as PuppetProp | undefined;
    if (prop && puppetPropAllowed(prop) && puppetPropFits({ key, type: VT.OTHER, word: key, note: key, size: 1, mount: VT.FLOOR }, prop)) continue;
    delete a.props[key];
    removed.push({ series: a.id, key, id: id as string });
  }
  if (JSON.stringify(a) !== JSON.stringify(old)) changes.push({ file: relative, record: a });
}
for (const change of changes) {
  if (!apply) continue;
  const target = path.join(root, change.file);
  const saved = path.join(backup, change.file);
  fs.mkdirSync(path.dirname(saved), { recursive: true });
  fs.copyFileSync(target, saved);
  const temp = target + VT.CATALOG_TMP;
  fs.writeFileSync(temp, JSON.stringify(change.record), PA.UTF8);
  fs.renameSync(temp, target);
}
const report = { apply, changed: changes.length, removed, quarantined: [...assets.values()].filter((a) => a.catalogStatus === PA.QUARANTINE).map((a) => ({ id: a.id, key: a.key })), backup: apply && changes.length ? backup : null };
if (apply && changes.length) {
  fs.mkdirSync(backup, { recursive: true });
  fs.writeFileSync(path.join(backup, M.REPORT), JSON.stringify(report, null, 2), PA.UTF8);
}
process.stdout.write(JSON.stringify(report, null, 2) + VT.NEWLINE);
