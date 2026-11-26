import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { BORNAS_ANN, BORNAS_LIMITS } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasAiSettings, BornasBgAnn, BornasFace, BornasSeat, BornasSpriteAnn } from "../../types/bornas.js";
import { readJson, runKitPy, writeJson } from "./bornasTools.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
type Obj = Record<string, unknown>;
export interface AnnSprite {
  name: string;
  png: string;
  kind: string;
  want?: string;
  edge?: boolean;
}
const WHOLE_EXEMPT = /bust|sit|kneel|crouch|lying|lie|fallen|dead|ride|riding|mounted|swim/i;
export const bornasBadAnn = (a: BornasSpriteAnn): boolean => a.place === "icon" || a.double || a.cut || a.mismatch === true || a.partial === true || a.furniture === true;
export interface AnnBg {
  name: string;
  png: string;
}
interface Measured {
  aspect: number;
  foot: number;
  pad: number;
  face?: BornasFace;
  mouth?: [number, number];
  suspect?: string[];
  empty?: boolean;
}
const PLACES = ["ground", "wall", "table", "hand", "icon"];
const PEOPLE = new Set(["person", "bust"]);
const num = (v: unknown): number | null => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const workDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), BORNAS_ANN.TMP_PREFIX));
const lastJson = <T>(text: string, fallback: T): T => {
  try {
    return JSON.parse(_.last(text.trim().split(/\r?\n/)) || "") as T;
  } catch {
    return fallback;
  }
};
const headFace = (head: [number, number], aspect: number): BornasFace => {
  const fh = aspect < 0.8 ? 0.11 : aspect < 1.3 ? 0.09 : 0.28;
  const fw = (fh / aspect) * 0.85;
  const [x, y] = [_.clamp(head[0] / 100, 0, 1), _.clamp(head[1] / 100, 0, 1)];
  return { l: _.round(x - fw / 2, 4), r: _.round(x + fw / 2, 4), t: _.round(y - fh / 2, 4), b: _.round(y + fh / 2, 4) };
};
export const annotateSprites = async (list: AnnSprite[], ai: BornasAiSettings, log: Log, signal?: AbortSignal): Promise<Record<string, BornasSpriteAnn>> => {
  if (!list.length) return {};
  log(BORNAS_LOG.ANN_SPRITES(list.length));
  const dir = workDir();
  try {
    const manifest = path.join(dir, "m.json");
    writeJson(manifest, list);
    const measuredFile = path.join(dir, "measured.json");
    await runKitPy("annotate.py", ["measure", manifest, measuredFile], log, signal);
    const measured = readJson<Record<string, Measured>>(measuredFile, {});
    const usable = list.filter((s) => measured[s.name] && !measured[s.name].empty);
    writeJson(
      manifest,
      usable.map((s) => ({ ...s, face: measured[s.name].face })),
    );
    const sheets = lastJson<{ file: string; names: string[]; start: number }[]>(await runKitPy("annotate.py", ["sprites", manifest, path.join(dir, "sheet")], log, signal), []);
    const answers = new Map<string, Obj>();
    for (const batch of _.chunk(sheets, BORNAS_LIMITS.AI_IMAGES)) {
      const res = (await runMotionAi(
        BORNAS_PROMPT.SPRITE_REVIEW(
          batch.map((b) => ({ start: b.start, count: b.names.length })),
          batch.flatMap((b) => b.names.map((n, k) => ({ n: b.start + k, want: usable.find((u) => u.name === n)?.want || n.replace(/^[a-z0-9_]+__/, "").replace(/_/g, " ") }))),
        ),
        BORNAS_ARTIFACT.SPRITE_REVIEW,
        reupExec(ai.visionAi),
        signal,
        (line) => line && log(line),
        batch.map((b, i) => ({ name: `sheet_${i + 1}.jpg`, mimeType: "image/jpeg", path: b.file })),
      ).catch(() => undefined)) as { items?: Obj[] } | undefined;
      const byN = new Map((res?.items || []).map((it) => [Number(it.n), it]));
      for (const b of batch) b.names.forEach((n, k) => byN.has(b.start + k) && answers.set(n, byN.get(b.start + k)!));
    }
    const out: Record<string, BornasSpriteAnn> = {};
    for (const s of usable) {
      const m = measured[s.name];
      const a = answers.get(s.name);
      if (!a) continue;
      const people = PEOPLE.has(s.kind);
      const head = Array.isArray(a.head) && a.head.length === 2 ? ([Number(a.head[0]), Number(a.head[1])] as [number, number]) : null;
      const face = people ? (a.face_ok === true && m.face ? m.face : head ? headFace(head, m.aspect) : m.face) : undefined;
      out[s.name] = {
        v: BORNAS_ANN.VERSION,
        foot: m.foot,
        pad: m.pad,
        aspect: m.aspect,
        ...(face ? { face, mouth: [_.round((face.l + face.r) / 2, 4), _.round(face.t + (face.b - face.t) * 0.78, 4)] as [number, number] } : {}),
        place: (PLACES.includes(String(a.place)) ? String(a.place) : "ground") as BornasSpriteAnn["place"],
        facing: a.facing === "l" ? "l" : "r",
        text: a.text === true,
        double: a.double === true,
        cut: (s.edge === undefined ? a.cut === true : s.edge) || (s.kind === "person" && !!face && m.aspect <= BORNAS_ANN.LIE_ASPECT && face.b - face.t > BORNAS_ANN.BUST_FACE),
        mismatch: a.match === false,
        partial: s.kind === "person" && a.whole === false && !WHOLE_EXEMPT.test(s.name),
        furniture: s.kind === "person" && !s.name.includes("__") && a.furniture === true,
        aims: a.aims === true,
        ...(typeof a.is === "string" ? { is: String(a.is).slice(0, 80) } : {}),
      };
    }
    const bad = Object.entries(out)
      .filter(([, v]) => bornasBadAnn(v))
      .map(([k]) => k);
    log(BORNAS_LOG.ANN_SPRITES_DONE(Object.keys(out).length, bad.length));
    return out;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
const cleanBg = (raw: Obj, free: [number, number, number, number][]): BornasBgAnn | undefined => {
  const sea = num(raw.water);
  const g = (Array.isArray(raw.ground) ? raw.ground : []).map(num);
  if (!g.some((v) => v !== null && v >= BORNAS_ANN.GROUND_MIN && v <= BORNAS_ANN.GROUND_MAX) && sea !== null && sea >= BORNAS_ANN.GROUND_MIN && sea <= BORNAS_ANN.GROUND_MAX) g.splice(0, g.length, sea, sea, sea);
  const known = g.filter((v): v is number => v !== null && v >= BORNAS_ANN.GROUND_MIN && v <= BORNAS_ANN.GROUND_MAX);
  if (!known.length) return undefined;
  const ground = [0, 1, 2].map((i) => {
    const v = g[i];
    return v !== null && v !== undefined && v >= BORNAS_ANN.GROUND_MIN && v <= BORNAS_ANN.GROUND_MAX ? v : _.mean(known);
  }) as [number, number, number];
  const p = (Array.isArray(raw.person) ? raw.person : []).map(num);
  const okP = p.filter((v): v is number => v !== null && v >= BORNAS_ANN.PERSON_MIN && v <= BORNAS_ANN.PERSON_MAX);
  const person = [0, 1, 2].map((i) => {
    const v = p[i];
    return Math.round(v !== null && v !== undefined && v >= BORNAS_ANN.PERSON_MIN && v <= BORNAS_ANN.PERSON_MAX ? v : okP.length ? _.mean(okP) : BORNAS_ANN.PERSON_DEFAULT);
  }) as [number, number, number];
  const triple = (v: unknown): [number, number, number] | null => {
    const t = Array.isArray(v) ? v.map(num) : [];
    return t.length >= 3 && t.slice(0, 3).every((x) => x !== null) ? (t.slice(0, 3) as [number, number, number]) : null;
  };
  const spots = (Array.isArray(raw.spots) ? raw.spots : [])
    .map(triple)
    .filter((t): t is [number, number, number] => !!t && t[0] >= 60 && t[0] <= 1860 && t[1] >= BORNAS_ANN.GROUND_MIN && t[1] <= BORNAS_ANN.GROUND_MAX && t[2] >= BORNAS_ANN.PERSON_MIN * 0.6 && t[2] <= BORNAS_ANN.PERSON_MAX)
    .slice(0, 6);
  const walls = (Array.isArray(raw.walls) ? raw.walls : [])
    .map(triple)
    .filter((t): t is [number, number, number] => !!t && t[1] > t[0] && t[2] > 80 && t[2] < 1000)
    .slice(0, 4);
  const table = triple(raw.table);
  const water = num(raw.water);
  const seats = (Array.isArray(raw.seats) ? raw.seats : [])
    .map((x) => x as Obj)
    .map((x) => ({ k: String(x.k || ""), x0: num(x.x0), x1: num(x.x1), y: num(x.y) }))
    .filter((x): x is BornasSeat => BORNAS_ANN.SEATS.includes(x.k as (typeof BORNAS_ANN.SEATS)[number]) && x.x0 !== null && x.x1 !== null && x.y !== null && x.x1 - x.x0 > 40 && x.y > 200 && x.y < 1075)
    .slice(0, 4);
  const r4 = Array.isArray(raw.rails) ? raw.rails.map(num) : [];
  const rails = r4.length >= 4 && r4.slice(0, 4).every((x) => x !== null) ? (r4.slice(0, 4) as [number, number, number, number]) : null;
  const boats = triple(raw.boats);
  return {
    v: BORNAS_ANN.BG_VERSION,
    ground,
    person,
    spots: _.sortBy(spots, (s) => s[0]),
    walls,
    table: table && table[1] > table[0] ? table : null,
    water: water && water > 100 && water < 1075 ? water : null,
    free,
    seats,
    rails: rails && rails[2] - rails[0] > 200 && [rails[1], rails[3]].every((y) => y > 200 && y < 1075) ? rails : null,
    boats: boats && boats[1] - boats[0] > 200 && boats[2] > 200 && boats[2] < 1075 ? boats : null,
  };
};
export const annotateBackgrounds = async (list: AnnBg[], ai: BornasAiSettings, log: Log, signal?: AbortSignal): Promise<{ ann: Record<string, BornasBgAnn>; open: string[] }> => {
  if (!list.length) return { ann: {}, open: [] };
  log(BORNAS_LOG.ANN_BGS(list.length));
  const dir = workDir();
  try {
    const manifest = path.join(dir, "b.json");
    writeJson(manifest, list);
    const freeFile = path.join(dir, "free.json");
    await runKitPy("annotate.py", ["free", manifest, freeFile], log, signal);
    const free = readJson<Record<string, [number, number, number, number][]>>(freeFile, {});
    const out: Record<string, BornasBgAnn> = {};
    const open: string[] = [];
    for (const batch of _.chunk(list, BORNAS_LIMITS.AI_IMAGES)) {
      const bm = path.join(dir, "batch.json");
      writeJson(bm, batch);
      const files = lastJson<{ file: string; name: string }[]>(await runKitPy("annotate.py", ["bgs", bm, path.join(dir, `bg_${Object.keys(out).length}`)], log, signal), []);
      const res = (await runMotionAi(
        BORNAS_PROMPT.BG_MEASURE(batch.map((b) => b.name)),
        BORNAS_ARTIFACT.BG_MEASURE,
        reupExec(ai.visionAi),
        signal,
        (line) => line && log(line),
        files.map((f, i) => ({ name: `bg_${i + 1}.jpg`, mimeType: "image/jpeg", path: f.file })),
      ).catch(() => undefined)) as { bgs?: Obj[] } | undefined;
      for (const r of res?.bgs || []) {
        const b = batch[Number(r.n) - 1];
        const ann = b && cleanBg(r, free[b.name] || []);
        if (ann) out[b.name] = ann;
        else if (b) open.push(b.name);
      }
    }
    log(BORNAS_LOG.ANN_BGS_DONE(Object.keys(out).length, list.length));
    if (open.length) log(BORNAS_LOG.ANN_BGS_OPEN(open));
    return { ann: out, open };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
