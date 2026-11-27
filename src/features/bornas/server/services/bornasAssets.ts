import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { reupFfmpeg } from "../../../reup/server/services/reupFfmpeg.js";
import { BORNAS_ANN, BORNAS_BUSTS, BORNAS_DIR, BORNAS_KIND_SIZES, BORNAS_LIMITS, BORNAS_OBJECT_KINDS, BORNAS_RENDER, BORNAS_SIZES, BORNAS_TOPIC_LIBS, BORNAS_SIZE_RANGE } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasAiSettings, BornasDrawChoice, BornasAssetPlan, BornasBackground, BornasBgAnn, BornasJob, BornasScript, BornasSprite, BornasSpriteAnn, BornasVideo } from "../../types/bornas.js";
import { annotateBackgrounds, annotateSprites, bornasBadAnn } from "./bornasAnnotate.js";
import { bornasVideoDir } from "./bornasVoice.js";
import { BORNAS_ABORTED, bornasDraw, bornasLib, isBornasAbort, readJson, runKitPy, slug, writeJson } from "./bornasTools.js";
const sizeOf = (name: string, kind: string, guess: number): number => {
  const n = name.toLowerCase().replace(/_/g, " "),
    r = BORNAS_SIZES.find((x) => x.re.test(n)) || BORNAS_KIND_SIZES[kind] || BORNAS_KIND_SIZES.prop;
  return Number.isFinite(guess) && guess >= r.min && guess <= r.max ? guess : r.std;
};
type Log = (text: string, level?: "info" | "warn" | "error") => void;
interface LibItem {
  sheet: string;
  era?: string;
  kind: string;
  heightM: number;
  facing?: "l" | "r";
  px?: number[];
  note?: string;
  ann?: BornasSpriteAnn;
}
interface LibBg {
  era?: string;
  px?: number[];
  ground?: number;
  desc?: string;
  ann?: BornasBgAnn;
  openV?: number;
}
interface LibCatalog {
  style?: string;
  items: Record<string, LibItem>;
  backgrounds: Record<string, LibBg>;
}
const catalogFile = (lib: string): string => bornasLib(lib, "catalog.json");
const bgMeasured = (b: LibBg): boolean => b.ann?.v === BORNAS_ANN.BG_VERSION || b.openV === BORNAS_ANN.BG_VERSION;
const readCatalog = (lib: string): LibCatalog => {
  const cat = readJson<LibCatalog>(catalogFile(lib), { items: {}, backgrounds: {} });
  return { ...cat, items: cat.items || {}, backgrounds: cat.backgrounds || {} };
};
const pngSize = (file: string): [number, number] => {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const words = (name: string): string => name.replace(/^[a-z0-9]+__/, "").replace(/_/g, " ");
type Wanted = { name: string; desc: string; kind?: string };
const cropEdge = new Map<string, boolean>();
const copyCrop = (src: string, dst: string): void => {
  fs.copyFileSync(src, dst);
  if (cropEdge.has(path.resolve(src))) cropEdge.set(path.resolve(dst), cropEdge.get(path.resolve(src))!);
};
const edgeOf = (file: string): boolean | undefined => cropEdge.get(path.resolve(file));
const matchCrops = async (job: BornasJob, files: string[], wanted: Wanted[], prefix: string, log: Log, signal?: AbortSignal): Promise<(string | undefined)[]> => {
  const contact = `${prefix}_crops.jpg`;
  await runKitPy("crop_contact.py", [contact, ...files], log, signal);
  const raw = (await runMotionAi(BORNAS_PROMPT.MATCH_CROPS(wanted, files.length), BORNAS_ARTIFACT.MATCH, reupExec(job.ai.visionAi), signal, (line) => line && log(line), [{ name: "crops.jpg", mimeType: "image/jpeg", path: contact }]).catch(() => undefined)) as { items?: { name?: string; crop?: number }[] } | undefined;
  const pick = new Map((raw?.items || []).map((m) => [String(m.name || ""), Number(m.crop)]));
  const used = new Set<number>();
  return wanted.map((w) => {
    const n = pick.get(w.name);
    if (!n || n < 1 || n > files.length || used.has(n)) return undefined;
    used.add(n);
    return files[n - 1];
  });
};
const keyedSplit = async (job: BornasJob, raw: string, prefix: string, wanted: Wanted[], log: Log, signal?: AbortSignal): Promise<(string | undefined)[]> => {
  const keyed = `${prefix}_key.png`;
  await runKitPy("alpha_key.py", [raw, keyed], log, signal);
  const out = JSON.parse(_.last((await runKitPy("sheet_split.py", [keyed, prefix, String(wanted.length)], log, signal)).trim().split(/\r?\n/)) || "{}") as { files?: string[]; edges?: boolean[] };
  fs.rmSync(keyed, { force: true });
  const files = out.files || [];
  files.forEach((f, i) => cropEdge.set(path.resolve(f), out.edges?.[i] === true));
  log(BORNAS_LOG.SPLIT(files.length, wanted.length), files.length === wanted.length ? "info" : "warn");
  if (wanted.length === 1 && files.length === 1) {
    if (BORNAS_OBJECT_KINDS.has(wanted[0].kind || "")) await runKitPy("alpha_key.py", ["--objects", files[0], files[0]], log, signal);
    return files;
  }
  const matched = await matchCrops(job, files, wanted, prefix, log, signal);
  if (files.length === wanted.length && matched.every((f) => !f)) {
    log(BORNAS_LOG.MATCH_FAILED(wanted.length), "warn");
    return files;
  }
  const swapped = matched.filter((f, k) => f && f !== files[k]).length;
  if (swapped) log(BORNAS_LOG.MATCH_REORDERED(swapped), "warn");
  const missing = wanted.filter((_w, k) => !matched[k]).map((w) => w.name);
  if (missing.length) log(BORNAS_LOG.SPLIT_MISSING(missing), "warn");
  if (missing.length === wanted.length) fs.rmSync(raw, { force: true });
  const objects = matched.flatMap((f, k) => (f && BORNAS_OBJECT_KINDS.has(wanted[k].kind || "") ? [f, f] : []));
  if (objects.length) await runKitPy("alpha_key.py", ["--objects", ...objects], log, signal);
  return matched;
};
const drawSheet = async (prompt: string, file: string, what: string, draw: BornasDrawChoice, log: Log, misses: { count: number }, signal?: AbortSignal, refs: string[] = []): Promise<boolean> => {
  for (let attempt = 0; attempt <= BORNAS_LIMITS.DRAW_RETRIES; attempt++) {
    signal?.throwIfAborted();
    try {
      log(BORNAS_LOG.DRAW(what));
      const used = await bornasDraw(prompt, file, draw, refs);
      if (used !== draw.provider) log(BORNAS_LOG.DRAW_FALLBACK(what, used), "warn");
      misses.count = 0;
      return true;
    } catch (error) {
      if (isBornasAbort(error) || signal?.aborted) throw new Error(BORNAS_ABORTED);
      log(BORNAS_LOG.DRAW_FAIL(what, String((error as Error)?.message || error)), "warn");
      if (++misses.count >= BORNAS_LIMITS.DRAW_DOWN) throw new Error(BORNAS_ERROR.DRAW_DOWN(misses.count));
    }
  }
  return false;
};
export const drawBornasSingle = async (job: BornasJob, prompt: string, raw: string, name: string, desc: string, log: Log, signal?: AbortSignal, refs: string[] = []): Promise<string | undefined> => {
  const ok = fs.existsSync(raw) || (await drawSheet(prompt, raw, name, job.ai.drawAi, log, { count: 0 }, signal, refs));
  if (!ok) return undefined;
  const [file] = await keyedSplit(job, raw, raw.replace(/\.png$/, ""), [{ name, desc }], log, signal);
  return file;
};
const cleanPlan = (raw: unknown, items: Record<string, LibItem>, bgs: Record<string, LibBg>): BornasAssetPlan => {
  const r = (raw || {}) as Record<string, unknown>;
  const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
  const cast = arr(r.cast)
    .slice(0, BORNAS_LIMITS.CAST_MAX)
    .map((c) => ({
      id: slug(String(c.id || "hero"), 24),
      desc: String(c.desc || "").trim(),
      heightM: _.clamp(Number(c.heightM) || 1.75, 0.5, 2.1),
      poses: _.uniqBy(
        arr(c.poses)
          .slice(0, BORNAS_LIMITS.POSES_MAX)
          .map((p) => ({ name: slug(String(p.name || "pose"), 20), desc: String(p.desc || "").trim() })),
        "name",
      ),
    }))
    .filter((c) => c.desc && c.poses.length);
  return {
    cast: _.uniqBy(cast, "id"),
    items: _.uniq((Array.isArray(r.items) ? r.items : []).map(String).filter((n) => items[n])),
    backgrounds: _.uniq((Array.isArray(r.backgrounds) ? r.backgrounds : []).map(String).filter((n) => bgs[n])),
    newItems: _.uniqBy(
      arr(r.newItems)
        .slice(0, BORNAS_LIMITS.NEW_ITEMS_MAX)
        .map((it) => ({ name: slug(String(it.name || "item"), BORNAS_LIMITS.NAME_MAX), desc: String(it.desc || "").trim(), kind: String(it.kind || "prop"), heightM: sizeOf(String(it.name || ""), String(it.kind || "prop"), Number(it.heightM)) }))
        .filter((it) => it.desc),
      "name",
    ),
    newBackgrounds: _.uniqBy(
      arr(r.newBackgrounds)
        .slice(0, BORNAS_LIMITS.NEW_BG_MAX)
        .map((b) => ({ name: slug(String(b.name || "bg_new"), BORNAS_LIMITS.NAME_MAX).replace(/^(?!bg_)/, "bg_"), desc: String(b.desc || "").trim() }))
        .filter((b) => b.desc),
      "name",
    ),
  };
};
export const prepareBornasAssets = async (job: BornasJob, video: BornasVideo, script: BornasScript, log: Log, signal?: AbortSignal): Promise<void> => {
  const libs = BORNAS_TOPIC_LIBS[job.channel.topic].filter((lib) => fs.existsSync(catalogFile(lib)));
  const home = libs[0];
  const cats = Object.fromEntries(libs.map((lib) => [lib, readCatalog(lib)])) as Record<string, LibCatalog>;
  const itemLib: Record<string, string> = {};
  const bgLib: Record<string, string> = {};
  for (const lib of libs) {
    for (const n of Object.keys(cats[lib].items)) itemLib[n] ||= lib;
    for (const n of Object.keys(cats[lib].backgrounds)) bgLib[n] ||= lib;
  }
  const allItems = Object.fromEntries(Object.entries(itemLib).flatMap(([n, lib]) => (cats[lib].items[n]?.ann && bornasBadAnn(cats[lib].items[n].ann!) ? [] : [[n, cats[lib].items[n]]])));
  const allBgs = Object.fromEntries(Object.entries(bgLib).map(([n, lib]) => [n, cats[lib].backgrounds[n]]));
  const assets = bornasVideoDir(job, video, BORNAS_DIR.ASSETS);
  const planFile = path.join(assets, `plan_${createHash("sha1").update(JSON.stringify(script.lines)).digest("hex").slice(0, 12)}.json`);
  if (!fs.existsSync(planFile)) log(BORNAS_LOG.PLAN);
  const raw =
    readJson<unknown>(planFile, null) ??
    (await runMotionAi(
      BORNAS_PROMPT.ASSETS({
        script,
        items: Object.entries(allItems)
          .slice(0, BORNAS_LIMITS.CATALOG_PROMPT_MAX * 4)
          .map(([n, it]) => `${n} | ${it.kind} | ${it.heightM}`)
          .join("\n"),
        backgrounds: Object.entries(allBgs)
          .map(([n, b]) => `${n}: ${b.desc || words(n)}`)
          .join("\n"),
        analysis: job.analysis!,
        topic: job.channel.topic,
      }),
      BORNAS_ARTIFACT.ASSETS,
      reupExec(job.ai.directAi),
      signal,
      (line) => line && log(line),
    ));
  const plan = cleanPlan(raw, allItems, allBgs);
  if (!plan.cast.length && !plan.items.length) throw new Error(BORNAS_ERROR.NO_PLAN);
  if (!fs.existsSync(planFile)) writeJson(planFile, raw);
  log(BORNAS_LOG.PLAN_DONE(plan.items.length, plan.backgrounds.length, plan.cast.length, plan.newItems.length + plan.newBackgrounds.length));
  const png = path.join(assets, "png");
  const raws = path.join(assets, BORNAS_DIR.RAW);
  const render = bornasVideoDir(job, video, BORNAS_DIR.RENDER);
  fs.mkdirSync(png, { recursive: true });
  fs.mkdirSync(raws, { recursive: true });
  const sprites: BornasSprite[] = [];
  const misses = { count: 0 };
  const add = (name: string, file: string, kind: string, heightM: number, facing: "l" | "r", desc: string, pool?: string) => {
    const dst = path.join(png, `${name}.png`);
    if (path.resolve(file) !== path.resolve(dst)) copyCrop(file, dst);
    const [w, h] = pngSize(dst);
    const [lo, hi] = BORNAS_SIZE_RANGE[kind] || BORNAS_SIZE_RANGE.prop;
    const size = heightM >= lo && heightM <= hi ? heightM : _.clamp(sizeOf(name, kind, NaN), lo, hi);
    if (size !== heightM) log(BORNAS_LOG.SIZE_CLAMPED(name, heightM, size), "warn");
    sprites.push({ name, kind, heightM: size, facing, aspect: w / Math.max(1, h), desc, ...(pool ? { pool } : {}) });
  };
  const castRef: Record<string, string> = {};
  const personOf = (id: string): string => id.split("_")[0];
  for (const c of _.sortBy(plan.cast, (c) => (c.poses.some((p) => /bust/.test(p.name)) ? 0 : 1))) {
    const files: (string | undefined)[] = [];
    for (const [k, group] of _.chunk(c.poses, BORNAS_LIMITS.CAST_ROW).entries()) {
      const raw = path.join(raws, `cast_${c.id}_${k}.png`);
      const ref = castRef[personOf(c.id)];
      const ok = fs.existsSync(raw) || (await drawSheet(BORNAS_PROMPT.CAST_SHEET(c.desc, group, !!ref), raw, c.id, job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
      if (ok && !ref) castRef[personOf(c.id)] = raw;
      files.push(...(ok ? await keyedSplit(job, raw, path.join(raws, `cast_${c.id}_${k}`), group, log, signal) : group.map(() => undefined)));
    }
    const poses = c.poses.filter((_p, i) => files[i]);
    const names = poses.map((p) => {
      const name = `${c.id}_${p.name}`;
      copyCrop(files[c.poses.indexOf(p)]!, path.join(png, `${name}.png`));
      return name;
    });
    for (const [i, pose] of poses.entries()) {
      if (!/bust/.test(pose.name)) continue;
      const single = path.join(raws, `bust_${c.id}.png`);
      const drawn = fs.existsSync(single) || (await drawSheet(BORNAS_PROMPT.BUST_SINGLE(c.desc, pose.desc), single, `${c.id} ${pose.name}`, job.ai.drawAi, log, misses, signal));
      const [file] = drawn ? await keyedSplit(job, single, path.join(raws, `bust_${c.id}`), [pose], log, signal) : [];
      if (file) copyCrop(file, path.join(png, `${names[i]}.png`));
    }
    names.forEach((name, i) => add(name, path.join(png, `${name}.png`), /bust/.test(poses[i].name) ? "bust" : "person", c.heightM, "r", `${c.desc}; ${poses[i].desc}`));
    if (BORNAS_BUSTS.SKIP.test(c.id) || !poses.length) continue;
    const triple = path.join(raws, `busts_${c.id}.png`);
    const drew = fs.existsSync(triple) || (await drawSheet(BORNAS_PROMPT.BUST_TRIPLE(c.desc), triple, `${c.id} busts`, job.ai.drawAi, log, misses, signal));
    if (!drew) continue;
    const keyed = path.join(raws, `busts_${c.id}_key.png`);
    await runKitPy("alpha_key.py", ["--edge", triple, keyed], log, signal);
    const parts = (JSON.parse(_.last((await runKitPy("bust_split.py", [keyed, path.join(raws, `busts_${c.id}`)], log, signal)).trim().split(/\r?\n/)) || "{}").files || []) as string[];
    fs.rmSync(keyed, { force: true });
    log(BORNAS_LOG.SPLIT(parts.length, BORNAS_BUSTS.VIEWS.length), parts.length === BORNAS_BUSTS.VIEWS.length ? "info" : "warn");
    parts.slice(0, BORNAS_BUSTS.VIEWS.length).forEach((file, i) => {
      const view = BORNAS_BUSTS.VIEWS[i];
      add(`${c.id}${BORNAS_BUSTS.SUFFIX}${view}`, file, "bust", c.heightM, BORNAS_BUSTS.FACING[view], `${c.desc}; bust ${view}`);
    });
  }
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const added: { lib: string; names: string[] } = { lib: home, names: [] };
  for (const [k, group] of _.chunk(plan.newItems, BORNAS_LIMITS.SHEET_ITEMS).entries()) {
    const cols = Math.min(6, group.length),
      rows = Math.ceil(group.length / cols);
    const sheet = `auto_${stamp}_${job.id.slice(0, 6)}_${video.index + 1}${k}`;
    const raw = bornasLib(home, "raw", `${sheet}.jpg`);
    const tmp = path.join(raws, `${sheet}.png`);
    const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.ITEM_SHEET(group, cols, rows), tmp, group.map((g) => g.name).join(", "), job.ai.drawAi, log, misses, signal));
    if (!ok) continue;
    await reupFfmpeg(["-y", "-i", tmp, "-q:v", "2", raw], { signal });
    const files = await keyedSplit(job, tmp, path.join(raws, sheet), group, log, signal);
    const pairs = group.flatMap((it, i) => (files[i] ? [{ f: files[i]!, it, name: `${sheet}__${it.name}` }] : []));
    for (const { f, name } of pairs) copyCrop(f, bornasLib(home, "sprites", `${name}.png`));
    const cat = readCatalog(home);
    for (const { name, it } of pairs) {
      const [w, h] = pngSize(bornasLib(home, "sprites", `${name}.png`));
      cat.items[name] = { ...cat.items[name], sheet, era: job.channel.topic, kind: it.kind, heightM: it.heightM, facing: "r", px: [w, h], note: it.desc };
      cats[home].items[name] = cat.items[name];
      itemLib[name] = home;
      plan.items.push(name);
      added.names.push(name);
    }
    writeJson(catalogFile(home), cat);
  }
  for (const b of plan.newBackgrounds) {
    const tmp = path.join(raws, `${b.name}.png`);
    const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.BACKGROUND(b.desc), tmp, b.name, job.ai.drawAi, log, misses, signal));
    if (!ok) continue;
    fs.mkdirSync(bornasLib(home, "bg"), { recursive: true });
    await reupFfmpeg(["-y", "-i", tmp, "-q:v", "2", bornasLib(home, "bg", `${b.name}.jpg`)], { signal });
    fs.copyFileSync(bornasLib(home, "bg", `${b.name}.jpg`), bornasLib(home, "raw", `${b.name}.jpg`));
    const cat = readCatalog(home);
    cat.backgrounds[b.name] = { era: job.channel.topic, px: [1376, 768], desc: b.desc };
    cats[home].backgrounds[b.name] = cat.backgrounds[b.name];
    bgLib[b.name] = home;
    plan.backgrounds.push(b.name);
    writeJson(catalogFile(home), cat);
    added.names.push(b.name);
  }
  if (added.names.length) log(BORNAS_LOG.LIB_ADD(added.names.length, added.lib));
  for (const name of plan.items) {
    const it = cats[itemLib[name]].items[name];
    const file = bornasLib(itemLib[name], "sprites", `${name}.png`);
    if (fs.existsSync(file)) add(name, file, it.kind, it.kind === "person" ? it.heightM : sizeOf(name.split("__").pop() || name, it.kind, it.heightM), it.facing === "l" ? "l" : "r", it.note || words(name));
  }
  const pooled = new Set(plan.items);
  let poolCount = 0;
  for (const name of plan.items) {
    const lib = itemLib[name],
      it = cats[lib]?.items[name];
    if (!it || !BORNAS_LIMITS.POOL_KINDS.includes(it.kind)) continue;
    const sheet = name.split("__")[0];
    const sibs = Object.keys(cats[lib].items).filter((n) => n !== name && !pooled.has(n) && n.split("__")[0] === sheet && cats[lib].items[n].kind === it.kind && !(cats[lib].items[n].ann && bornasBadAnn(cats[lib].items[n].ann!)) && fs.existsSync(bornasLib(lib, "sprites", `${n}.png`)));
    for (const n of sibs.slice(0, BORNAS_LIMITS.POOL_PER_ITEM)) {
      if (poolCount >= BORNAS_LIMITS.POOL_MAX) break;
      pooled.add(n);
      itemLib[n] = lib;
      poolCount++;
      const sib = cats[lib].items[n];
      add(n, bornasLib(lib, "sprites", `${n}.png`), sib.kind, sib.kind === "person" ? sib.heightM : sizeOf(n.split("__").pop() || n, sib.kind, sib.heightM), sib.facing === "l" ? "l" : "r", sib.note || words(n), name);
    }
  }
  const usedBgs = plan.backgrounds.filter((n) => fs.existsSync(bornasLib(bgLib[n], "bg", `${n}.jpg`)));
  for (const n of usedBgs) await reupFfmpeg(["-y", "-i", bornasLib(bgLib[n], "bg", `${n}.jpg`), "-vf", `scale=${BORNAS_RENDER.WIDTH}:${BORNAS_RENDER.HEIGHT}:flags=lanczos`, path.join(render, `${n}.png`)], { signal });
  const libOf = (name: string): string | undefined => itemLib[name];
  const needSprites = sprites.filter((sp) => {
    const lib = libOf(sp.name);
    return !(lib && cats[lib].items[sp.name]?.ann?.v === BORNAS_ANN.VERSION);
  });
  const castAnnFile = path.join(assets, BORNAS_ANN.CAST_FILE);
  const castAnn = readJson<Record<string, BornasSpriteAnn>>(castAnnFile, {});
  const fresh = await annotateSprites(
    needSprites.filter((sp) => libOf(sp.name) || castAnn[sp.name]?.v !== BORNAS_ANN.VERSION).map((sp) => ({ name: sp.name, png: path.join(png, `${sp.name}.png`), kind: sp.kind, want: sp.desc, edge: edgeOf(path.join(png, `${sp.name}.png`)) })),
    job.ai,
    log,
    signal,
  );
  for (const lib of _.uniq(
    Object.keys(fresh)
      .map(libOf)
      .filter((l): l is string => !!l),
  )) {
    const cat = readCatalog(lib);
    for (const [n, ann] of Object.entries(fresh)) if (libOf(n) === lib && cat.items[n]) cat.items[n].ann = ann;
    cats[lib].items = cat.items;
    writeJson(catalogFile(lib), cat);
  }
  writeJson(castAnnFile, { ...castAnn, ...Object.fromEntries(Object.entries(fresh).filter(([n]) => !libOf(n))) });
  const annOf = (n: string): BornasSpriteAnn | undefined => fresh[n] || (libOf(n) ? cats[libOf(n)!].items[n]?.ann : castAnn[n]);
  const keep = sprites.filter((sp) => {
    const a = annOf(sp.name);
    return !a || !bornasBadAnn(a);
  });
  if (keep.length < sprites.length) log(BORNAS_LOG.ANN_DROP(sprites.filter((sp) => !keep.includes(sp)).map((sp) => sp.name)), "warn");
  const finalSprites = keep.map((sp) => {
    const a = annOf(sp.name);
    return { ...sp, ...(a ? { ann: a, facing: libOf(sp.name) ? sp.facing : a.facing } : {}) };
  });
  const castOf = (n: string) => plan.cast.find((c) => n.startsWith(`${c.id}_`));
  const failed = sprites.filter((sp) => !keep.includes(sp) && (castOf(sp.name) || added.names.includes(sp.name)));
  if (failed.length) {
    log(BORNAS_LOG.REDRAW(failed.map((sp) => sp.name)));
    const redone: BornasSprite[] = [];
    for (const [who, list] of Object.entries(_.groupBy(failed, (sp) => (castOf(sp.name) ? personOf(castOf(sp.name)!.id) : "")))) {
      for (const [k, group] of _.chunk(list, BORNAS_LIMITS.SHEET_ITEMS).entries()) {
        const cols = Math.min(6, group.length),
          rows = Math.ceil(group.length / cols);
        const sheet = `fix_${stamp}_${job.id.slice(0, 6)}_${video.index + 1}${who}${k}`;
        const tmp = path.join(raws, `${sheet}.png`);
        const ref = who ? castRef[who] : undefined;
        const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.FIX_SHEET(group, cols, rows, !!ref), tmp, group.map((sp) => sp.name).join(", "), job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
        if (!ok) continue;
        const files = await keyedSplit(job, tmp, path.join(raws, sheet), group, log, signal);
        group.forEach((sp, i) => {
          if (!files[i]) return;
          const name = castOf(sp.name) ? `${sp.name}_r` : `${sheet}__${sp.name.split("__").pop()}`;
          const dst = path.join(png, `${name}.png`);
          copyCrop(files[i]!, dst);
          if (!castOf(sp.name)) copyCrop(files[i]!, bornasLib(home, "sprites", `${name}.png`));
          const [w, h] = pngSize(dst);
          redone.push({ ...sp, name, aspect: w / Math.max(1, h) });
        });
      }
    }
    const ann2 = await annotateSprites(
      redone.map((sp) => ({ name: sp.name, png: path.join(png, `${sp.name}.png`), kind: sp.kind, want: sp.desc, edge: edgeOf(path.join(png, `${sp.name}.png`)) })),
      job.ai,
      log,
      signal,
    );
    const good = redone.filter((sp) => ann2[sp.name] && !bornasBadAnn(ann2[sp.name]));
    log(BORNAS_LOG.REDRAW_OK(good.length, failed.length));
    const cat = readCatalog(home);
    for (const sp of good) {
      if (castOf(sp.name)) continue;
      const [w, h] = pngSize(path.join(png, `${sp.name}.png`));
      cat.items[sp.name] = { sheet: sp.name.split("__")[0], era: job.channel.topic, kind: sp.kind, heightM: sp.heightM, facing: "r", px: [w, h], note: sp.desc, ann: ann2[sp.name] };
    }
    writeJson(catalogFile(home), cat);
    writeJson(castAnnFile, { ...readJson<Record<string, BornasSpriteAnn>>(castAnnFile, {}), ...Object.fromEntries(good.filter((sp) => castOf(sp.name)).map((sp) => [sp.name, ann2[sp.name]])) });
    for (const sp of good) finalSprites.push({ ...sp, ann: ann2[sp.name], facing: ann2[sp.name].facing });
  }
  const needBgs = usedBgs.filter((n) => !bgMeasured(cats[bgLib[n]].backgrounds[n]));
  const { ann: bgAnn, open: bgOpen } = await annotateBackgrounds(
    needBgs.map((n) => ({ name: n, png: path.join(render, `${n}.png`) })),
    job.ai,
    log,
    signal,
  );
  for (const lib of _.uniq([...Object.keys(bgAnn), ...bgOpen].map((n) => bgLib[n]))) {
    const cat = readCatalog(lib);
    for (const [n, ann] of Object.entries(bgAnn)) if (bgLib[n] === lib && cat.backgrounds[n]) cat.backgrounds[n] = { ...cat.backgrounds[n], ann, ground: Math.round(ann.ground[1]) };
    for (const n of bgOpen) if (bgLib[n] === lib && cat.backgrounds[n]) cat.backgrounds[n] = { ...cat.backgrounds[n], openV: BORNAS_ANN.BG_VERSION };
    cats[lib].backgrounds = cat.backgrounds;
    writeJson(catalogFile(lib), cat);
  }
  const backgrounds: BornasBackground[] = usedBgs.map((n) => {
    const b = cats[bgLib[n]].backgrounds[n];
    return { name: n, ground: b.ann ? Math.round(b.ann.ground[1]) : b.ground || BORNAS_LIMITS.GROUND, desc: b.desc || words(n), ...(b.ann ? { ann: b.ann } : {}) };
  });
  const castNames = finalSprites.filter((s) => plan.cast.some((c) => s.name.startsWith(`${c.id}_`))).map((s) => s.name);
  writeJson(path.join(assets, "catalog.json"), { actor: castNames.length ? `^(${castNames.map(_.escapeRegExp).join("|")})$` : "^$", facing: Object.fromEntries(finalSprites.filter((s) => s.facing === "l").map((s) => [s.name, "l"])), faceFix: {} });
  writeJson(path.join(assets, "faces.json"), Object.fromEntries(finalSprites.filter((s) => s.ann?.face).map((s) => [s.name, s.ann!.face])));
  sprites.splice(0, sprites.length, ...finalSprites);
  video.plan = plan;
  video.sprites = sprites;
  video.backgrounds = backgrounds;
};
export const annotateBornasLibrary = async (lib: string, ai: BornasAiSettings, log: Log, signal?: AbortSignal): Promise<{ sprites: number; bgs: number }> => {
  const cat = readCatalog(lib);
  const items = Object.entries(cat.items).filter(([n, it]) => it.ann?.v !== BORNAS_ANN.VERSION && fs.existsSync(bornasLib(lib, "sprites", `${n}.png`)));
  let sprites = 0;
  for (const part of _.chunk(items, BORNAS_ANN.LIB_BATCH)) {
    const ann = await annotateSprites(
      part.map(([n, it]) => ({ name: n, png: bornasLib(lib, "sprites", `${n}.png`), kind: it.kind })),
      ai,
      log,
      signal,
    );
    const now = readCatalog(lib);
    for (const [n, a] of Object.entries(ann)) if (now.items[n]) now.items[n].ann = a;
    writeJson(catalogFile(lib), now);
    sprites += Object.keys(ann).length;
  }
  const bgs = Object.keys(cat.backgrounds).filter((n) => !bgMeasured(cat.backgrounds[n]) && fs.existsSync(bornasLib(lib, "bg", `${n}.jpg`)));
  const { ann, open } = await annotateBackgrounds(
    bgs.map((n) => ({ name: n, png: bornasLib(lib, "bg", `${n}.jpg`) })),
    ai,
    log,
    signal,
  );
  const now = readCatalog(lib);
  for (const [n, a] of Object.entries(ann)) if (now.backgrounds[n]) now.backgrounds[n] = { ...now.backgrounds[n], ann: a, ground: Math.round(a.ground[1]) };
  for (const n of open) if (now.backgrounds[n]) now.backgrounds[n] = { ...now.backgrounds[n], openV: BORNAS_ANN.BG_VERSION };
  writeJson(catalogFile(lib), now);
  return { sprites, bgs: Object.keys(ann).length };
};
