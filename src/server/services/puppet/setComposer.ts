import { puppetTimestamp as now, puppetKeyOf as keyOf } from "../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { puppetAssetName, puppetEnglish, puppetSceneFeatureFits } from "../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { PUPPET_SET as Q, PUPPET_SET_PROMPTS as QR, PUPPET_SLOTS } from "../../../constants/motionPuppetSets.js";
import type { PuppetBase, PuppetLight, PuppetPiece, PuppetPlace, PuppetSet, PuppetSetPlan, PuppetSpot, PuppetStylePack } from "../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { listPuppets, newPuppetId, puppetHash, writePuppet } from "./kitLibrary.js";
import { cleanPuppetSvg, svgShapes } from "./svg.js";
import { puppetStyleImages, puppetStyleText, type PuppetRunOptions } from "./stylePack.js";
const W = P.SET_W;
const H = P.SET_H;
const persp = (y: number, hz: number, fy: number): number => _.clamp(P.PERSP_MIN + (P.PERSP_SPAN * (y - hz)) / Math.max(1, fy - hz), P.PERSP_MIN, 1);
const prefixIds = (svg: string, n: string): string => svg.replace(Q.ID_RE, (_m, id) => Q.ID_ATTR(Q.PREFIX(n, id))).replace(Q.URL_RE, (_m, id) => Q.URL_REF(Q.PREFIX(n, id)));
const splitSvg = (svg: string): { defs: string; inner: string } => {
  const m = svg.match(Q.INNER_RE);
  const body = m ? m[1] : P.EMPTY;
  const d = body.match(Q.DEFS_RE);
  return { defs: d ? d[1] : P.EMPTY, inner: d ? body.replace(d[0], P.EMPTY) : body };
};
const between = (s: string, a: string, b: string): string => {
  const i = s.indexOf(a);
  if (i < 0) return P.EMPTY;
  const from = i + a.length;
  const j = b ? s.indexOf(b, from) : -1;
  const body = j < 0 ? s.slice(from) : s.slice(from, j);
  return body.endsWith(Q.G_CLOSE) ? body.slice(0, -Q.G_CLOSE.length) : body;
};
const baseParts = (svg: string) => {
  const { defs } = splitSvg(svg);
  return { defs, sky: between(svg, Q.BASE_MARK_SKY, Q.BASE_MARK_BACK), back: between(svg, Q.BASE_MARK_BACK, Q.BASE_MARK_FLOOR), floor: between(svg, Q.BASE_MARK_FLOOR, Q.SVG_END) };
};
const swapSides = (s: string): string => s.replace(Q.LEFT_RIGHT_RE, (m) => Q.SWAP[m] || m);
const swapKey = (k: string): string => swapSides(k.split(Q.KEY_SPLIT).join(Q.KEY_JOIN)).split(Q.KEY_JOIN).join(Q.KEY_SPLIT);
export const puppetBaseFamily = (b: Pick<PuppetBase, "interior">): string => (b.interior ? Q.FAMILY_INTERIOR : Q.FAMILY_EXTERIOR);
export const puppetPieces = (styleId: string): PuppetPiece[] => listPuppets<PuppetPiece>(PUPPET_TYPES.PIECE, (p) => p.styleId === styleId);
export const puppetBases = (styleId: string): PuppetBase[] => listPuppets<PuppetBase>(PUPPET_TYPES.BASE, (b) => b.styleId === styleId);
export interface PuppetComposed {
  svg: string;
  spots: PuppetSpot[];
  lights: PuppetLight[];
  floorY: number;
  horizonY: number;
}
export const composePuppetSet = (base: PuppetBase, placed: { slot: string; piece: PuppetPiece }[], night: boolean, mirror: boolean): PuppetComposed => {
  const slots = PUPPET_SLOTS[puppetBaseFamily(base)];
  const hz = base.horizonY,
    fy = base.floorY;
  const b = _.mapValues(baseParts(night && base.night ? base.night : base.svg), (part) => prefixIds(part, Q.BASE_PREFIX));
  const layers: Record<string, string[]> = _.fromPairs(_.map(Q.LAYERS, (l) => [l, [] as string[]]));
  const defs: string[] = [b.defs];
  const spots: PuppetSpot[] = [];
  const lights: PuppetLight[] = [];
  const occ: string[] = [];
  const items = _.sortBy(
    _.compact(
      _.map(placed, ({ slot, piece }) => {
        const sd = slots[slot];
        if (!sd) return null;
        const ty = sd.wall != null ? hz * sd.wall : hz + (sd.d || 0) * (fy - hz);
        return { slot, piece, sd, tx: sd.x * W, ty };
      }),
    ),
    (it) => it.ty,
  );
  items.forEach(({ piece, sd, tx, ty }, i) => {
    const box = piece.box,
      a = piece.anchor;
    let s = piece.native ? persp(ty, hz, fy) / persp(a[1], piece.native.hz, piece.native.fy) : (((piece.size || P.SIZE_DEFAULT) / P.PERSON_M) * P.PERSON_H * H * persp(ty, hz, fy)) / (Math.max(box[2], box[3]) * P.PROP_FILL);
    if (sd.maxW && box[2] * s > sd.maxW * W) s = (sd.maxW * W) / box[2];
    const src = splitSvg(prefixIds(night && piece.night ? piece.night : piece.svg, Q.PIECE_PREFIX(i)));
    defs.push(src.defs);
    const nested = Q.NESTED(tx - (a[0] - box[0]) * s, ty - (a[1] - box[1]) * s, box[2] * s, box[3] * s, Q.VB(box), src.inner);
    layers[sd.layer].push(nested);
    if (piece.front && _.includes(Q.OCC_LAYERS, sd.layer)) occ.push(Q.OCC(ty, mirror ? Q.MIRROR(nested) : nested));
    for (const sp of piece.spots || []) spots.push({ key: sp.key, kind: sp.kind, ...(sp.face ? { face: sp.face } : {}), x: Math.round(tx + (sp.x - a[0]) * s), y: Math.round(ty + (sp.y - a[1]) * s), ...(sp.groundY != null ? { groundY: Math.round(ty + (sp.groundY - a[1]) * s) } : {}), ...(sp.seatY != null ? { seatY: Math.round(ty + (sp.seatY - a[1]) * s) } : {}), label: sp.label });
    for (const l of piece.lights || []) lights.push({ x: Math.round(tx + (l.x - a[0]) * s), y: Math.round(ty + (l.y - a[1]) * s), color: Q.LIGHT_COLOR, kind: l.kind });
  });
  for (const [key, x, label] of P.SPOT_FRONT) spots.push({ key, kind: P.SPOT_STAND, x: Math.round(x * W), y: fy - P.SPOT_INSET, label });
  spots.push({ key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL });
  spots.push({ key: P.SPOT_FLOOR_KEY, kind: P.SPOT_LIE, x: W / 2, y: fy - P.SPOT_INSET, label: P.SPOT_FLOOR_LABEL });
  const seen: Record<string, number> = {};
  let out = _.map(spots, (sp) => {
    seen[sp.key] = (seen[sp.key] || 0) + 1;
    return seen[sp.key] > 1 ? { ...sp, key: Q.DUP(sp.key, seen[sp.key]) } : sp;
  });
  let outLights = lights;
  const back = b.back + layers.back.join(P.EMPTY) + b.floor;
  let groups = [back, layers.mid.join(P.EMPTY), layers.floor.join(P.EMPTY), layers.fg.join(P.EMPTY)];
  if (mirror) {
    groups = _.map(groups, (g) => (g ? Q.MIRROR(g) : g));
    out = _.map(out, (sp) => ({ ...sp, ...(sp.face ? { face: swapSides(sp.face) } : {}), x: W - sp.x, key: swapKey(sp.key), label: swapSides(sp.label) }));
    outLights = _.map(lights, (l) => ({ ...l, x: W - l.x }));
  }
  return { svg: Q.SET_SVG(defs.join(P.EMPTY), b.sky, groups[0], groups[1], groups[2], groups[3], occ.join(P.EMPTY)), spots: _.take(out, P.SPOTS_MAX * 2), lights: _.take(outLights, P.LIGHTS_MAX), floorY: fy, horizonY: hz };
};
export interface PuppetSetNeed {
  place: PuppetPlace;
  must: string[];
  uses: string;
}
interface PlanRaw {
  key: string;
  base: PuppetBase;
  pieces: { slot: string; key: string }[];
  fresh: { key: string; desc: string; kind: string; slot: string }[];
}
const fitSlot = (slot: string, piece: { slots: string[]; kind: string }, family: string, taken: Set<string>): string | null => {
  const fam = PUPPET_SLOTS[family];
  const pool = _.filter(_.uniq([slot, ...piece.slots, ...(Q.KIND_SLOTS[piece.kind] || [])]), (s) => !!fam[s] && !taken.has(s));
  return _.includes(pool, slot) ? slot : pool[0] || null;
};
export const planPuppetSets = async (style: PuppetStylePack, needs: PuppetSetNeed[], o: PuppetRunOptions): Promise<PlanRaw[]> => {
  const bases = puppetBases(style.id);
  const pieces = puppetPieces(style.id);
  if (!bases.length || !needs.length) return [];
  o.log(Q.LOG_PLAN(needs.length));
  const slotText = _.map(PUPPET_SLOTS, (slots, fam) => fam + P.SEP + _.keys(slots).join(P.COMMA)).join(P.SEP);
  const raw = await (o.ai || runMotionAi)(
    QR.PLAN({
      bases: _.map(bases, (b) => Q.BASE_LIST(b)).join(P.NL),
      pieces: _.map(
        _.uniqBy(pieces, (p) => p.key),
        (p) => Q.PIECE_LIST(p),
      ).join(P.NL),
      slots: slotText,
      places: _.map(needs, (n) => Q.PLACE_LIST({ key: n.place.key, name: n.place.name, desc: _.truncate(n.place.desc, { length: 160 }), side: n.place.interior ? P.INSIDE : P.OUTSIDE, must: n.must.join(P.COMMA), uses: _.truncate(n.uses, { length: 220 }) })).join(P.NL),
    }),
    Q.ARTIFACT_PLAN,
    o.exec,
    o.signal,
    o.log,
  ).catch((e: any) => {
    if (o.signal?.aborted) throw e;
    return null;
  });
  const byBase = _.keyBy(bases, (b) => b.key);
  const byPiece = _.keyBy(pieces, (p) => p.key);
  const out: PlanRaw[] = [];
  for (const it of _.castArray(raw?.sets || [])) {
    const need = _.find(needs, (n) => n.place.key === _.toString(it?.key));
    if (!need) continue;
    const family = need.place.interior ? Q.FAMILY_INTERIOR : Q.FAMILY_EXTERIOR;
    const base = byBase[_.toString(it?.base)]?.interior === need.place.interior ? byBase[_.toString(it?.base)] : _.find(bases, (b) => b.interior === need.place.interior);
    if (!base) continue;
    const taken = new Set<string>();
    const list: { slot: string; key: string }[] = [];
    for (const pc of _.castArray(it?.pieces || [])) {
      const piece = byPiece[_.toString(pc?.piece)];
      const slot = piece ? fitSlot(_.toString(pc?.slot), piece, family, taken) : null;
      if (!piece || !slot || (piece.environment && piece.environment !== family)) continue;
      taken.add(slot);
      list.push({ slot, key: piece.key });
    }
    const fresh: PlanRaw["fresh"] = [];
    for (const nw of _.take(_.castArray(it?.new || []), Q.MAX_NEW)) {
      const key = keyOf(nw?.key);
      const kind = _.includes(Q.PIECE_KINDS, nw?.kind) ? _.toString(nw.kind) : Q.KIND_DEFAULT;
      const slot = key ? fitSlot(_.toString(nw?.slot), { slots: [], kind }, family, taken) : null;
      if (!key || !slot) continue;
      taken.add(slot);
      if (byPiece[key] && (!byPiece[key].environment || byPiece[key].environment === family)) list.push({ slot, key });
      else if (byPiece[key]) continue;
      else fresh.push({ key, desc: puppetEnglish(nw?.desc) ? _.truncate(nw.desc, { length: 160 }) : puppetAssetName(key), kind, slot });
    }
    out.push({ key: need.place.key, base, pieces: list, fresh });
  }
  return out;
};
export const drawPuppetPieces = async (style: PuppetStylePack, wanted: { key: string; desc: string; kind: string }[], o: PuppetRunOptions): Promise<Record<string, PuppetPiece>> => {
  const out: Record<string, PuppetPiece> = {};
  if (!wanted.length) return out;
  o.log(Q.LOG_NEW_PIECES(_.map(wanted, (w) => w.key)));
  const refs = puppetStyleImages(style, [P.REF_INTERIOR, P.REF_EXTERIOR], 3);
  await mapMotionAiPool(
    _.chunk(wanted, Q.PIECES_PER_CALL),
    async (group) => {
      const raw = await (o.ai || runMotionAi)(QR.PIECES({ style: puppetStyleText(style, P.PART_SET), items: _.map(group, (g) => [g.key, g.kind, g.desc].join(P.SEP)).join(P.NL) }), Q.ARTIFACT_PIECES, o.exec, o.signal, o.log, refs.length ? refs : undefined).catch((e: any) => {
        if (o.signal?.aborted) throw e;
        return null;
      });
      for (const g of group) {
        const it = _.find(_.castArray(raw?.pieces || []), (x: any) => keyOf(x?.key) === g.key);
        try {
          const svg = cleanPuppetSvg(it?.svg, P.SVG_PROP_BYTES);
          if (svgShapes(svg) < P.PROP_MIN_SHAPES) continue;
          out[g.key] = writePuppet<PuppetPiece>({
            id: newPuppetId(PUPPET_TYPES.PIECE, style.id + g.key + puppetHash(svg)),
            type: PUPPET_TYPES.PIECE,
            styleId: style.id,
            key: g.key,
            name: Q.AI_NAME(g.key),
            desc: g.desc,
            kind: g.kind,
            slots: Q.KIND_SLOTS[g.kind] || [],
            svg,
            box: [...Q.AI_BOX],
            anchor: [...Q.AI_ANCHOR],
            size: _.clamp(Number(it?.size) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX),
            spots: [],
            lights: [],
            tags: [g.key],
            source: P.PIECE_SOURCE_AI,
            uses: 0,
            updatedAt: now(),
          });
        } catch (e: any) {
          o.log(P.LOG_PROP_FAIL(g.key, String(e?.message || e)));
        }
      }
    },
    1,
  );
  return out;
};
export const buildPuppetSets = async (style: PuppetStylePack, needs: PuppetSetNeed[], o: PuppetRunOptions, seed: string): Promise<Record<string, PuppetSet>> => {
  const plans = await planPuppetSets(style, needs, o);
  const pieces = _.keyBy(puppetPieces(style.id), (p) => p.key);
  const fresh = _.uniqBy(
    _.flatMap(plans, (p) => p.fresh),
    (f) => f.key,
  );
  Object.assign(
    pieces,
    await drawPuppetPieces(
      style,
      _.filter(fresh, (f) => !pieces[f.key]),
      o,
    ),
  );
  const out: Record<string, PuppetSet> = {};
  for (const plan of plans) {
    const need = _.find(needs, (n) => n.place.key === plan.key)!;
    const placed = _.compact(_.map([...plan.pieces, ..._.map(plan.fresh, (f) => ({ slot: f.slot, key: f.key }))], (pc) => (pieces[pc.key] ? { slot: pc.slot, piece: pieces[pc.key] } : null)));
    const evidence = [plan.base.key, plan.base.desc, ...placed.flatMap(({ piece }) => [piece.key, piece.desc])].join(P.SPACE);
    if ((need.place.sceneFeatures || []).some((key) => !puppetSceneFeatureFits(key, evidence))) continue;
    const mirror = puppetHash(seed + plan.key).charCodeAt(0) % 2 === 1;
    const dayTime = need.place.time === P.NIGHT ? P.NIGHT : P.DAY;
    const make = (night: boolean, variant: boolean): PuppetSet => {
      const c = composePuppetSet(plan.base, placed, night, mirror);
      const planOut: PuppetSetPlan = { base: plan.base.key, pieces: _.map(placed, (p) => ({ slot: p.slot, piece: p.piece.key })), mirror };
      return {
        id: newPuppetId(PUPPET_TYPES.SET),
        type: PUPPET_TYPES.SET,
        styleId: style.id,
        group: P.COMPOSED_GROUP(seed, plan.key),
        name: need.place.name + (variant ? P.VARIANT_SEP + (night ? P.NIGHT : P.DAY) : P.EMPTY),
        desc: need.place.desc,
        tags: [need.place.key, need.place.interior ? P.INTERIOR_TAG : P.EXTERIOR_TAG, P.COMPOSED_TAG],
        interior: need.place.interior,
        time: night ? P.NIGHT : P.DAY,
        svg: c.svg,
        floorY: c.floorY,
        horizonY: c.horizonY,
        spots: c.spots,
        plan: planOut,
        lights: c.lights,
        uses: 0,
        updatedAt: now(),
      };
    };
    const main = make(dayTime === P.NIGHT, false);
    const other = writePuppet(make(dayTime !== P.NIGHT, true));
    out[plan.key] = writePuppet<PuppetSet>({ ...main, variants: { [other.time]: other.id } });
    o.log(Q.LOG_COMPOSED(need.place.name, plan.base.key, _.map(placed, (p) => p.piece.key).join(P.COMMA)));
  }
  const missing = _.filter(needs, (n) => !out[n.place.key]);
  if (missing.length) o.log(Q.LOG_PLAN_FAIL(_.map(missing, (n) => n.place.name).join(P.COMMA)));
  return out;
};
