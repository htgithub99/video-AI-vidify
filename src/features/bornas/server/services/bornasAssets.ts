import fs from "fs";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { reupFfmpeg } from "../../../reup/server/services/reupFfmpeg.js";
import { BORNAS_AGE_WORDS, BORNAS_AI_CACHE, BORNAS_CAST_STAND, BORNAS_ANN, BORNAS_LIB_KEEP, BORNAS_LONG, BORNAS_POSTURE, BORNAS_BUSTS, BORNAS_DIR, BORNAS_KIND_SIZES, BORNAS_LIMITS, BORNAS_OBJECT_KINDS, BORNAS_RENDER, BORNAS_SIZES, bornasStyleLine, BORNAS_TOPIC_LIBS, BORNAS_SIZE_RANGE } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_BUST_LOOKS, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasPosture, BornasAiSettings, BornasDrawChoice, BornasAssetPlan, BornasBackground, BornasBgAnn, BornasJob, BornasScript, BornasSprite, BornasSpriteAnn, BornasVideo } from "../../types/bornas.js";
import { annotateBackgrounds, annotateSprites, bornasBadAnn } from "./bornasAnnotate.js";
import { bornasVideoDir } from "./bornasVoice.js";
import { bornasAiCached } from "./bornasAiCache.js";
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
// Width/height of a PNG or a JPEG (Gemini downloads are often JPEG even when saved as .png).
const pngSize = (file: string): [number, number] => {
  const b = fs.readFileSync(file);
  if (b[0] === 0x89 && b[1] === 0x50) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let i = 2; b[0] === 0xff && b[1] === 0xd8 && i + 9 < b.length; ) {
    if (b[i] !== 0xff) return [0, 0];
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  return [0, 0];
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
// Every split writes its pieces into its own empty folder (raw/parts/<sheet>/p_0.png …), so a piece can never share a
// name with another sheet (the mood bust sheet busts_X_2.png was the third piece of busts_X) and pieces left from an
// earlier run are never picked up again.
const partsPrefix = (prefix: string): string => {
  const dir = path.join(path.dirname(prefix), BORNAS_DIR.PARTS, path.basename(prefix));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "p");
};
// Crowd variants must be the same kind of person or animal: a cavalry crowd once took a vaquero, a cowboy and an
// outlaw from the same sheet, and a horse herd took a coyote and a rattlesnake. Without a group, no variants.
const headNoun = (it: LibItem): string => (it.ann?.is || "").toLowerCase().split(/[^a-z]+/).filter(Boolean).pop() || "";
const sameGroup = (a: LibItem, b: LibItem): boolean => (a.kind === "person" ? !!a.ann?.group && a.ann.group === b.ann?.group : !!headNoun(a) && headNoun(a) === headNoun(b));
const keyedSplit = async (job: BornasJob, raw: string, sheetPrefix: string, wanted: Wanted[], log: Log, signal?: AbortSignal): Promise<(string | undefined)[]> => {
  const prefix = partsPrefix(sheetPrefix);
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
// Gemini often returns JPEG bytes; every drawn sheet is stored as a real PNG so all readers see one format.
const realPng = async (file: string, signal?: AbortSignal): Promise<void> => {
  const head = Buffer.alloc(2);
  const fd = fs.openSync(file, "r");
  fs.readSync(fd, head, 0, 2, 0);
  fs.closeSync(fd);
  if (head[0] !== 0xff || head[1] !== 0xd8) return;
  const tmp = `${file}.tmp.png`;
  await reupFfmpeg(["-y", "-i", file, tmp], { signal });
  fs.renameSync(tmp, file);
};
const drawSheet = async (prompt: string, file: string, what: string, draw: BornasDrawChoice, log: Log, misses: { count: number }, signal?: AbortSignal, refs: string[] = []): Promise<boolean> => {
  for (let attempt = 0; attempt <= BORNAS_LIMITS.DRAW_RETRIES; attempt++) {
    signal?.throwIfAborted();
    try {
      log(BORNAS_LOG.DRAW(what));
      const used = await bornasDraw(prompt, file, draw, refs);
      await realPng(file, signal);
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
  const prompt = BORNAS_PROMPT.ASSETS({
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
  });
  log(BORNAS_LOG.PLAN);
  const raw = await bornasAiCached<unknown>({ dir: assets, prefix: BORNAS_AI_CACHE.PLAN_PREFIX, ai: job.ai.directAi, prompt, artifact: BORNAS_ARTIFACT.ASSETS, log, signal, ok: (r) => !!r && typeof r === "object" });
  const plan = cleanPlan(raw, allItems, allBgs);
  if (!plan.cast.length && !plan.items.length) throw new Error(BORNAS_ERROR.NO_PLAN);
  log(BORNAS_LOG.PLAN_DONE(plan.items.length, plan.backgrounds.length, plan.cast.length, plan.newItems.length + plan.newBackgrounds.length));
  const png = path.join(assets, "png");
  const raws = path.join(assets, BORNAS_DIR.RAW);
  const render = bornasVideoDir(job, video, BORNAS_DIR.RENDER);
  fs.mkdirSync(png, { recursive: true });
  fs.mkdirSync(raws, { recursive: true });
  const sprites: BornasSprite[] = [];
  const misses = { count: 0 };
  const add = (name: string, file: string, kind: string, heightM: number, facing: "l" | "r", desc: string, pool?: string, who?: { char: string; person: string; posture?: BornasPosture }) => {
    const dst = path.join(png, `${name}.png`);
    if (path.resolve(file) !== path.resolve(dst)) copyCrop(file, dst);
    const [w, h] = pngSize(dst);
    const [lo, hi] = BORNAS_SIZE_RANGE[kind] || BORNAS_SIZE_RANGE.prop;
    let size = heightM >= lo && heightM <= hi ? heightM : _.clamp(sizeOf(name, kind, NaN), lo, hi);
    const long = (kind === "prop" || kind === "weapon") && BORNAS_LONG.find((x) => x.re.test(words(name).toLowerCase()));
    if (long) {
      const across = Math.max(1, w / Math.max(1, h));
      const length = size >= long.min && size <= long.max ? size : size * across >= long.min && size * across <= long.max ? size * across : long.std;
      size = _.round(length / across, 3);
    }
    if (size !== heightM) log(BORNAS_LOG.SIZE_CLAMPED(name, heightM, size), "warn");
    sprites.push({ name, kind, heightM: size, facing, aspect: w / Math.max(1, h), desc, ...(pool ? { pool } : {}), ...(who || {}) });
  };
  const castRef: Record<string, string> = {};
  // The same person across ages: the cast id without its trailing age words (sitting_bull_boy → sitting_bull).
  // Before, only the first word was kept, so "sitting_bull_father" shared the hero's reference picture.
  const personOf = (id: string): string => {
    const w = id.split("_");
    while (w.length > 1 && BORNAS_AGE_WORDS.test(w[w.length - 1])) w.pop();
    return w.join("_");
  };
  const postureOf = (text: string): BornasPosture => BORNAS_POSTURE.find(([, re]) => re.test(text.replace(/_/g, " ")))?.[0] || "stand";
  for (const c of _.sortBy(plan.cast, (c) => (c.poses.some((p) => /bust/.test(p.name)) ? 0 : 1))) {
    const files: (string | undefined)[] = [];
    for (const [k, group] of _.chunk(c.poses, BORNAS_LIMITS.CAST_ROW).entries()) {
      const raw = path.join(raws, `cast_${c.id}_${k}.png`);
      const ref = castRef[personOf(c.id)];
      const ok = fs.existsSync(raw) || (await drawSheet(BORNAS_PROMPT.CAST_SHEET(bornasStyleLine(job.channel.topic), c.desc, group, !!ref), raw, c.id, job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
      if (ok && !ref) castRef[personOf(c.id)] = raw;
      files.push(...(ok ? await keyedSplit(job, raw, path.join(raws, `cast_${c.id}_${k}`), group, log, signal) : group.map(() => undefined)));
    }
    // Poses Gemini left out of the sheet are drawn once more on their own sheet; without this a hero could end up
    // with only a sitting pose and every shot of that age reused it.
    const lost = c.poses.flatMap((p, i) => (!files[i] && !/bust/.test(p.name) ? [i] : []));
    for (const [k, idx] of _.chunk(lost, BORNAS_LIMITS.CAST_ROW).entries()) {
      const group = idx.map((i) => c.poses[i]);
      const raw = path.join(raws, `cast_${c.id}_redo${k}.png`);
      const ref = castRef[personOf(c.id)];
      log(BORNAS_LOG.POSE_REDO(c.id, group.map((g) => g.name)), "warn");
      const ok = fs.existsSync(raw) || (await drawSheet(BORNAS_PROMPT.CAST_SHEET(bornasStyleLine(job.channel.topic), c.desc, group, !!ref), raw, c.id, job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
      const got = ok ? await keyedSplit(job, raw, path.join(raws, `cast_${c.id}_redo${k}`), group, log, signal) : [];
      idx.forEach((i, j) => (files[i] ||= got[j]));
    }
    // every age of a character needs one standing pose: without it every shot of that age reused a sitting or riding pose
    const body = c.poses.filter((p, i) => files[i] && !/bust/.test(p.name));
    if (body.length && !body.some((p) => postureOf(`${p.name} ${p.desc}`) === "stand")) {
      const stand = { name: BORNAS_CAST_STAND.name, desc: BORNAS_CAST_STAND.desc };
      const raw = path.join(raws, `cast_${c.id}_stand.png`);
      const ref = castRef[personOf(c.id)];
      log(BORNAS_LOG.POSE_REDO(c.id, [stand.name]), "warn");
      const ok = fs.existsSync(raw) || (await drawSheet(BORNAS_PROMPT.CAST_SHEET(bornasStyleLine(job.channel.topic), c.desc, [stand], !!ref), raw, c.id, job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
      const [file] = ok ? await keyedSplit(job, raw, path.join(raws, `cast_${c.id}_stand`), [stand], log, signal) : [];
      if (file) {
        c.poses.push(stand);
        files.push(file);
      }
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
      const drawn = fs.existsSync(single) || (await drawSheet(BORNAS_PROMPT.BUST_SINGLE(bornasStyleLine(job.channel.topic), c.desc, pose.desc), single, `${c.id} ${pose.name}`, job.ai.drawAi, log, misses, signal));
      const [file] = drawn ? await keyedSplit(job, single, path.join(raws, `bust_${c.id}`), [pose], log, signal) : [];
      if (file) copyCrop(file, path.join(png, `${names[i]}.png`));
    }
    names.forEach((name, i) => add(name, path.join(png, `${name}.png`), /bust/.test(poses[i].name) ? "bust" : "person", c.heightM, "r", `${c.desc}; ${poses[i].desc}`, undefined, { char: c.id, person: personOf(c.id), ...(/bust/.test(poses[i].name) ? {} : { posture: postureOf(`${poses[i].name} ${poses[i].desc}`) }) }));
    if (BORNAS_BUSTS.SKIP.test(c.id) || !poses.length) continue;
    for (const sheet of BORNAS_BUSTS.SHEETS) {
      const triple = path.join(raws, `busts_${c.id}${sheet.file}.png`);
      let parts: string[] = [];
      for (let tries = 1; tries <= BORNAS_BUSTS.TRIES; tries++) {
        const drew = fs.existsSync(triple) || (await drawSheet(BORNAS_PROMPT.BUST_TRIPLE(bornasStyleLine(job.channel.topic), c.desc, sheet.views), triple, `${c.id} busts${sheet.file}`, job.ai.drawAi, log, misses, signal));
        if (!drew) break;
        const keyed = path.join(raws, `busts_${c.id}${sheet.file}_key.png`);
        await runKitPy("alpha_key.py", ["--edge", triple, keyed], log, signal);
        parts = (JSON.parse(_.last((await runKitPy("bust_split.py", [keyed, partsPrefix(path.join(raws, `busts_${c.id}${sheet.file}`))], log, signal)).trim().split(/\r?\n/)) || "{}").files || []) as string[];
        fs.rmSync(keyed, { force: true });
        // a part narrower than MIN_WIDE of its height is a sliver (an arm, a feather), not a bust
        const whole = parts.length === sheet.views.length && parts.every((f) => pngSize(f)[0] >= pngSize(f)[1] * BORNAS_BUSTS.MIN_WIDE && pngSize(f)[1] >= BORNAS_BUSTS.MIN_PX);
        const tall = whole ? Math.min(...parts.map((f) => pngSize(f)[1])) / pngSize(triple)[1] : 0;
        if (tall >= BORNAS_BUSTS.MIN_TALL || tries === BORNAS_BUSTS.TRIES) break;
        log(BORNAS_LOG.BUST_SMALL(c.id, Math.round(tall * 100)), "warn");
        fs.rmSync(triple, { force: true });
      }
      log(BORNAS_LOG.SPLIT(parts.length, sheet.views.length), parts.length === sheet.views.length ? "info" : "warn");
      // never label pieces by position when the sheet did not split into exactly one bust per view
      if (parts.length !== sheet.views.length || parts.some((f) => pngSize(f)[0] < pngSize(f)[1] * BORNAS_BUSTS.MIN_WIDE)) continue;
      parts.slice(0, sheet.views.length).forEach((file, i) => {
        const view = sheet.views[i];
        add(`${c.id}${BORNAS_BUSTS.SUFFIX}${view}`, file, "bust", c.heightM, BORNAS_BUSTS.FACING[view], `${c.desc}; bust, ${BORNAS_BUST_LOOKS[view]}`, undefined, { char: c.id, person: personOf(c.id) });
      });
    }
  }
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const added: { lib: string; names: string[] } = { lib: home, names: [] };
  // Pictures of a main character (a portrait of the hero, the hero's horse by name) stay with this video only:
  // they are drawn into the library folder but never written to its catalog, so other videos cannot reuse them.
  const castWords = new Set(plan.cast.flatMap((c) => `${c.id} ${String(c.desc || "").split(BORNAS_LIB_KEEP.NAME_END)[0]} ${script.hero || ""}`.toLowerCase().split(/[^a-z]+/)).filter((w) => w.length >= BORNAS_LIB_KEEP.MIN_WORD && !BORNAS_LIB_KEEP.GENERIC.includes(w)));
  const personal = (name: string, desc = ""): boolean => `${name} ${desc}`.toLowerCase().split(/[^a-z]+/).some((w) => castWords.has(w));
  for (const [k, group] of _.chunk(plan.newItems, BORNAS_LIMITS.SHEET_ITEMS).entries()) {
    const cols = Math.min(6, group.length),
      rows = Math.ceil(group.length / cols);
    const sheet = `auto_${stamp}_${job.id.slice(0, 6)}_${video.index + 1}${k}`;
    const raw = bornasLib(home, "raw", `${sheet}.jpg`);
    const tmp = path.join(raws, `${sheet}.png`);
    const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.ITEM_SHEET(bornasStyleLine(job.channel.topic), group, cols, rows), tmp, group.map((g) => g.name).join(", "), job.ai.drawAi, log, misses, signal));
    if (!ok) continue;
    await reupFfmpeg(["-y", "-i", tmp, "-q:v", "2", raw], { signal });
    const files = await keyedSplit(job, tmp, path.join(raws, sheet), group, log, signal);
    // items Gemini left out are drawn once more on their own sheet
    const lost = group.flatMap((_it, i) => (files[i] ? [] : [i]));
    if (lost.length) {
      const redo = path.join(raws, `${sheet}_redo.png`);
      const sub = lost.map((i) => group[i]);
      log(BORNAS_LOG.ITEM_REDO(sub.map((g) => g.name)), "warn");
      const c2 = Math.min(6, sub.length);
      const drew = fs.existsSync(redo) || (await drawSheet(BORNAS_PROMPT.ITEM_SHEET(bornasStyleLine(job.channel.topic), sub, c2, Math.ceil(sub.length / c2)), redo, sub.map((g) => g.name).join(", "), job.ai.drawAi, log, misses, signal));
      const got = drew ? await keyedSplit(job, redo, path.join(raws, `${sheet}_redo`), sub, log, signal) : [];
      lost.forEach((i, j) => (files[i] ||= got[j]));
    }
    const pairs = group.flatMap((it, i) => (files[i] ? [{ f: files[i]!, it, name: `${sheet}__${it.name}` }] : []));
    for (const { f, name } of pairs) copyCrop(f, bornasLib(home, "sprites", `${name}.png`));
    const cat = readCatalog(home);
    for (const { name, it } of pairs) {
      const [w, h] = pngSize(bornasLib(home, "sprites", `${name}.png`));
      cat.items[name] = { ...cat.items[name], sheet, era: job.channel.topic, kind: it.kind, heightM: it.heightM, facing: "r", px: [w, h], note: it.desc };
      cats[home].items[name] = cat.items[name];
      itemLib[name] = home;
      plan.items.push(name);
      if (personal(it.name, it.desc)) delete cat.items[name];
      else added.names.push(name);
    }
    writeJson(catalogFile(home), cat);
  }
  for (const b of plan.newBackgrounds) {
    const tmp = path.join(raws, `${b.name}.png`);
    const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.BACKGROUND(bornasStyleLine(job.channel.topic), b.desc), tmp, b.name, job.ai.drawAi, log, misses, signal));
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
    const sibs = Object.keys(cats[lib].items).filter((n) => n !== name && !pooled.has(n) && n.split("__")[0] === sheet && cats[lib].items[n].kind === it.kind && sameGroup(it, cats[lib].items[n]) && !(cats[lib].items[n].ann && bornasBadAnn(cats[lib].items[n].ann!)) && fs.existsSync(bornasLib(lib, "sprites", `${n}.png`)));
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
        const ok = fs.existsSync(tmp) || (await drawSheet(BORNAS_PROMPT.FIX_SHEET(bornasStyleLine(job.channel.topic), group, cols, rows, !!ref), tmp, group.map((sp) => sp.name).join(", "), job.ai.drawAi, log, misses, signal, ref ? [ref] : []));
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
  // Extras that look the same (the same crop under two names, two near-identical drawings) count as one person,
  // so the kit never puts both in one shot or one crowd.
  const extras = finalSprites.filter((s) => !s.char && (s.kind === "person" || s.kind === "animal"));
  if (extras.length > 1) {
    const out = await runKitPy("look_alike.py", extras.map((s) => path.join(png, `${s.name}.png`)), log, signal).catch(() => "");
    const pairs = (() => {
      try {
        return (JSON.parse(_.last(out.trim().split(/\r?\n/)) || "{}").alike || []) as [number, number, number][];
      } catch {
        return [];
      }
    })();
    for (const [i, j] of pairs) extras[j].person = extras[i].person || extras[i].name;
    if (pairs.length) log(BORNAS_LOG.ALIKE(pairs.map(([i, j]) => `${extras[i].name.split("__").pop()} = ${extras[j].name.split("__").pop()}`)), "warn");
  }
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
