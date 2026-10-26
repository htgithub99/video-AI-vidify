import { isTerminalMotionAiError } from "../chatSubmissionRecovery.js";
import { setImmediate } from "node:timers/promises";
import { puppetTimestamp as now, puppetKeyOf as keyOf } from "../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { puppetAssetName, puppetEnglish, puppetSceneFeatureFits } from "../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { PUPPET_SET as Q, PUPPET_SET_PROMPTS as QR, PUPPET_SLOTS } from "../../../constants/motionPuppetSets.js";
import type { PuppetBase, PuppetPiece, PuppetPlace, PuppetSet, PuppetSetPlan, PuppetStylePack } from "../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { listPuppets, newPuppetId, puppetHash, writePuppet } from "./kitLibrary.js";
import { assertPuppetDrawingAllowed, puppetPackActive, registerPuppetAssembly, withPuppetAssemblyTrial } from "./packPolicy.js";
import { MOTION_PACK as PACK } from "../../../constants/motionPack.js";
import { MOTION_ILLUSTRATION as I } from "../../../constants/motionIllustration.js";
import { MOTION_PACK_SELECTION as SELECTION } from "../../../constants/motionPackSelection.js";
import { puppetPackAssetIssues } from "./packInventory.js";
import { puppetPackAssemblyBaseFits, puppetPackAssemblyLocationFits } from "./packLocation.js";
import { puppetFeatureSpot, puppetSpots } from "./layout.js";
import { puppetSpotGeometryValid } from "../../../lib/motionPlacement.js";
import { motionPieceEnvironmentFits, motionPieceContactSpots, motionPlaceLocationFamily, motionPieceContextFits } from "../../../lib/motionResourceSemantics.js";
import { cleanPuppetSvg, svgShapes } from "./svg.js";
import { puppetStyleImages, puppetStyleText, type PuppetRunOptions } from "./stylePack.js";
import { composePuppetSet, piecePlacement, pieceSpots, puppetPieceSlots, boxesOverlap } from "./setComposition.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../../../constants/motionLibraryRelease.js";
import { MOTION_STAGE_CONSTRAINTS as CONSTRAINTS } from "../../../constants/motionStageConstraints.js";
export { composePuppetSet, puppetBaseFamily } from "./setComposition.js";
const W = P.SET_W;
const H = P.SET_H;
export const puppetPieces = (styleId: string): PuppetPiece[] => listPuppets<PuppetPiece>(PUPPET_TYPES.PIECE, (p) => p.styleId === styleId && !p.recipeOnly).map((piece) => ({ ...piece, spots: motionPieceContactSpots(piece) }));
export const puppetBases = (styleId: string): PuppetBase[] => listPuppets<PuppetBase>(PUPPET_TYPES.BASE, (b) => b.styleId === styleId && !b.recipeOnly);
export interface PuppetSetNeed {
  validate?: (set: PuppetSet) => string[];
  placements?: { support: string; kind: string; count: number }[];
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
      places: (puppetPackActive() ? PACK.PLAN_PROMPT + P.NL : P.EMPTY) + _.map(needs, (n) => Q.PLACE_LIST({ key: n.place.key, name: n.place.name, desc: _.truncate(n.place.desc, { length: 160 }), side: n.place.interior ? P.INSIDE : P.OUTSIDE, must: n.must.join(P.COMMA), uses: _.truncate(n.uses, { length: 220 }) })).join(P.NL),
    }),
    Q.ARTIFACT_PLAN,
    o.exec,
    o.signal,
    o.log,
  ).catch((e: any) => {
    if (isTerminalMotionAiError(e, o.signal)) throw e;
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
      if (!piece || !slot || !motionPieceEnvironmentFits(piece, family)) continue;
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
      else if (!puppetPackActive()) fresh.push({ key, desc: puppetEnglish(nw?.desc) ? _.truncate(nw.desc, { length: 160 }) : puppetAssetName(key), kind, slot });
    }
    out.push({ key: need.place.key, base, pieces: list, fresh });
  }
  return out;
};
export const drawPuppetPieces = async (style: PuppetStylePack, wanted: { key: string; desc: string; kind: string }[], o: PuppetRunOptions): Promise<Record<string, PuppetPiece>> => {
  if (wanted.length) assertPuppetDrawingAllowed();
  const out: Record<string, PuppetPiece> = {};
  if (!wanted.length) return out;
  o.log(Q.LOG_NEW_PIECES(_.map(wanted, (w) => w.key)));
  const refs = puppetStyleImages(style, [P.REF_INTERIOR, P.REF_EXTERIOR], 3);
  await mapMotionAiPool(
    _.chunk(wanted, Q.PIECES_PER_CALL),
    async (group) => {
      const raw = await (o.ai || runMotionAi)(QR.PIECES({ style: puppetStyleText(style, P.PART_SET), items: _.map(group, (g) => [g.key, g.kind, g.desc].join(P.SEP)).join(P.NL) }), Q.ARTIFACT_PIECES, o.exec, o.signal, o.log, refs.length ? refs : undefined).catch((e: any) => {
        if (isTerminalMotionAiError(e, o.signal)) throw e;
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
  const plans: PlanRaw[] = puppetPackActive() ? [] : await planPuppetSets(style, needs, o);
  if (puppetPackActive()) {
    o.log(Q.LOG_PLAN(needs.length));
    const tokens = (text: string) =>
      new Set(
        text
          .toLowerCase()
          .split(PACK.WORDS)
          .filter((word) => word.length > 2 && !(PACK.STOP_WORDS as readonly string[]).includes(word)),
      );
    for (const need of needs) {
      const wanted = tokens([need.place.key, need.place.name, need.place.desc, ...need.must].join(P.SPACE));
      const score = (text: string) => [...tokens(text)].filter((word) => wanted.has(word)).length;
      const bases = puppetBases(style.id)
        .filter((base) => puppetPackAssemblyBaseFits(need.place, base))
        .sort((a, b) => score(b.key + P.SPACE + b.desc) - score(a.key + P.SPACE + a.desc) || a.id.localeCompare(b.id))
        .slice(0, I.ASSEMBLY_BASES);
      const family = need.place.interior ? Q.FAMILY_INTERIOR : Q.FAMILY_EXTERIOR;
      const contacts = need.placements || [];
      const contactCounts = (piece: PuppetPiece) =>
        contacts.map((contact) => puppetSpots({ spots: piece.spots, floorY: piece.native?.fy || Math.max(...piece.spots.map((spot) => spot.groundY ?? spot.y), piece.anchor[1]) }).filter((spot) => (spot.kind === contact.kind || (contact.kind === P.SPOT_STAND && spot.kind === P.SPOT_DOOR)) && !!puppetFeatureSpot([{ ...spot, kind: contact.kind }], contact.support, contact.kind)).length);
      const features = (piece: PuppetPiece) => need.must.map((key) => puppetSceneFeatureFits(key, [piece.key, piece.desc, ...piece.spots.map((spot) => [spot.key, spot.fixture].filter(Boolean).join(P.SPACE))].join(P.SPACE)));
      const ranked = puppetPieces(style.id)
        .filter((piece) => motionPieceEnvironmentFits(piece, family) && motionPieceContextFits(piece, need.place) && (score(piece.key + P.SPACE + piece.desc) > 0 || contactCounts(piece).some(Boolean) || features(piece).some(Boolean)))
        .sort((a, b) => score(b.key + P.SPACE + b.desc) - score(a.key + P.SPACE + a.desc) || a.id.localeCompare(b.id));
      const candidates: PuppetPiece[] = [];
      const include = (piece?: PuppetPiece) => {
        if (piece && !candidates.includes(piece)) candidates.push(piece);
      };
      for (const [index, contact] of contacts.entries()) include([...ranked].sort((a, b) => Math.min(contact.count, contactCounts(b)[index]) - Math.min(contact.count, contactCounts(a)[index]))[0]);
      for (const [index, contact] of contacts.entries()) if (contact.count > 1) for (const piece of ranked.filter((piece) => contactCounts(piece)[index] > 0 && Math.ceil(contact.count / contactCounts(piece)[index]) <= piece.slots.length).slice(0, I.ASSEMBLY_PIECES)) include(piece);
      for (const [index] of need.must.entries()) include(ranked.find((piece) => features(piece)[index]));
      const groupsByFunction = _.groupBy(ranked, (piece) => JSON.stringify([piece.kind, piece.slots, contactCounts(piece).map((count, i) => Math.min(count, contacts[i].count)), features(piece)]));
      for (let offset = 0; candidates.length < Math.max(I.ASSEMBLY_PIECES, contacts.length + need.must.length); offset++) {
        const layer = Object.values(groupsByFunction).flatMap((group) => (group[offset] ? [group[offset]] : []));
        if (!layer.length) break;
        for (const piece of layer) {
          include(piece);
          if (candidates.length >= Math.max(I.ASSEMBLY_PIECES, contacts.length + need.must.length)) break;
        }
      }
      const coverage = (group: PuppetPiece[]): number => need.must.filter((key) => group.some((piece) => puppetSceneFeatureFits(key, [piece.key, piece.desc, ...piece.spots.map((spot) => [spot.key, spot.fixture].filter(Boolean).join(P.SPACE))].join(P.SPACE)))).length;
      const capacities = new Map(candidates.map((piece) => [piece.key, contactCounts(piece)]));
      const capacity = (group: PuppetPiece[]): number =>
        contacts.reduce(
          (sum, contact, i) =>
            sum +
            Math.min(
              contact.count,
              group.reduce((count, piece) => count + (capacities.get(piece.key)?.[i] || 0), 0),
            ),
          0,
        );
      const placements = new Map(
        bases.map((base) => [
          base.id,
          new Map(
            candidates.map((piece) => [
              piece.key,
              puppetPieceSlots(base, piece).flatMap((slot) => {
                const placement = piecePlacement(base, slot, piece);
                return placement && pieceSpots(placement).every((spot) => puppetSpotGeometryValid(spot) && spot.x >= 0 && spot.x <= W && spot.y >= 0 && spot.y <= H) ? [placement] : [];
              }),
            ]),
          ),
        ]),
      );
      const feasible = (group: PuppetPiece[]): boolean =>
        bases.some((base) => {
          const options = group.map((piece) => placements.get(base.id)!.get(piece.key)!).sort((a, b) => a.length - b.length);
          const taken = new Set<string>(),
            footprints: number[][] = [];
          const visit = (index: number): boolean => {
            if (index === options.length) return true;
            for (const placement of options[index]) {
              if (taken.has(placement.slot) || (!placement.sd.wall && footprints.some((box) => boxesOverlap(box, placement.box)))) continue;
              taken.add(placement.slot);
              if (!placement.sd.wall) footprints.push(placement.box);
              const found = visit(index + 1);
              if (!placement.sd.wall) footprints.pop();
              taken.delete(placement.slot);
              if (found) return true;
            }
            return false;
          };
          return visit(0);
        });
      const order = (a: PuppetPiece[], b: PuppetPiece[]): number => capacity(b) - capacity(a) || coverage(b) - coverage(a) || a.length - b.length || b.reduce((sum, piece) => sum + score(piece.key + P.SPACE + piece.desc), 0) - a.reduce((sum, piece) => sum + score(piece.key + P.SPACE + piece.desc), 0);
      let groups: PuppetPiece[][] = [[], ...candidates.map((piece) => [piece])].filter(feasible);
      let frontier = groups.filter((group) => group.length);
      for (let size = 2; size <= Math.min(SELECTION.ASSEMBLY_GROUP_SIZE, Math.max(2, need.must.length + contacts.reduce((sum, contact) => sum + contact.count, 0))); size++) {
        const expanded = frontier
          .flatMap((group) =>
            candidates
              .slice(candidates.indexOf(group[group.length - 1]))
              .filter((piece) => piece !== group[group.length - 1] || contacts.some((contact, index) => (capacities.get(piece.key)?.[index] || 0) > 0 && group.reduce((sum, part) => sum + (capacities.get(part.key)?.[index] || 0), 0) < contact.count))
              .map((piece) => [...group, piece]),
          )
          .filter(feasible)
          .sort(order)
          .slice(0, SELECTION.ASSEMBLY_GROUPS);
        groups.push(...expanded);
        frontier = expanded;
      }
      groups = groups.sort(order).slice(0, SELECTION.ASSEMBLY_GROUPS);
      for (const base of bases) {
        let count = 0;
        for (const group of groups) {
          if (count >= Math.floor(SELECTION.ASSEMBLY_PLANS / Math.max(1, bases.length))) break;
          if (contacts.some((contact, index) => contact.support !== P.SPOT_FLOOR_KEY && !(CONSTRAINTS.AREAS[base.locationFamily || P.EMPTY] || []).includes(contact.support) && group.reduce((sum, piece) => sum + (capacities.get(piece.key)?.[index] || 0), 0) < contact.count)) continue;
          const taken = new Set<string>();
          const placed: PlanRaw["pieces"] = [];
          const footprints: number[][] = [];
          let variants = 0;
          const place = (index: number): void => {
            if (variants >= SELECTION.ASSEMBLY_SLOTS || count >= Math.floor(SELECTION.ASSEMBLY_PLANS / Math.max(1, bases.length))) return;
            if (index === group.length) {
              plans.push({ key: need.place.key, base, pieces: [...placed], fresh: [] });
              count++;
              variants++;
              return;
            }
            const piece = group[index];
            for (const placement of placements.get(base.id)!.get(piece.key)!) {
              const slot = placement.slot;
              if (taken.has(slot) || (!placement.sd.wall && footprints.some((box) => boxesOverlap(box, placement.box)))) continue;
              taken.add(slot);
              placed.push({ slot, key: piece.key });
              if (!placement.sd.wall) footprints.push(placement.box);
              place(index + 1);
              if (!placement.sd.wall) footprints.pop();
              placed.pop();
              taken.delete(slot);
            }
          };
          place(0);
        }
      }
    }
  }
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
  const rejected = new Map<string, number>();
  let attempted = 0;
  for (const plan of plans) {
    o.signal?.throwIfAborted();
    if (++attempted % SELECTION.ASSEMBLY_YIELD === 0) await setImmediate(undefined, { signal: o.signal });
    if (out[plan.key]) continue;
    const need = _.find(needs, (n) => n.place.key === plan.key)!;
    const placed = _.compact(_.map([...plan.pieces, ..._.map(plan.fresh, (f) => ({ slot: f.slot, key: f.key }))], (pc) => (pieces[pc.key] ? { slot: pc.slot, piece: pieces[pc.key] } : null)));
    const evidence = [plan.base.key, plan.base.desc, plan.base.locationFamily || P.EMPTY, ...(CONSTRAINTS.AREAS[plan.base.locationFamily || P.EMPTY] || []), ...placed.flatMap(({ piece }) => [piece.key, piece.desc, ...piece.spots.flatMap((spot) => [spot.key, spot.fixture || P.EMPTY])])].join(P.SPACE);
    if (
      puppetPackActive() &&
      !puppetPackAssemblyLocationFits(
        need.place,
        plan.base,
        placed.map(({ piece }) => piece),
      )
    )
      continue;
    if ((need.place.sceneFeatures || []).some((key) => !puppetSceneFeatureFits(key, evidence))) continue;
    const mirror = puppetHash(seed + plan.key).charCodeAt(0) % 2 === 1;
    const dayTime = need.place.time === P.NIGHT ? P.NIGHT : P.DAY;
    const make = (night: boolean, variant: boolean): PuppetSet => {
      const c = composePuppetSet(plan.base, placed, night, mirror);
      const planOut: PuppetSetPlan = { ...(plan.base.libraryVersion === RELEASE.VERSION ? { version: RELEASE.PLAN_VERSION, baseId: plan.base.id } : {}), base: plan.base.key, pieces: _.map(placed, (p) => ({ slot: p.slot, piece: p.piece.key, assetId: p.piece.id })), mirror };
      return {
        id: newPuppetId(PUPPET_TYPES.SET),
        type: PUPPET_TYPES.SET,
        libraryVersion: plan.base.libraryVersion,
        styleId: style.id,
        group: P.COMPOSED_GROUP(seed, plan.key),
        name: need.place.name + (variant ? P.VARIANT_SEP + (night ? P.NIGHT : P.DAY) : P.EMPTY),
        desc: need.place.desc,
        tags: [need.place.key, need.place.interior ? P.INTERIOR_TAG : P.EXTERIOR_TAG, P.COMPOSED_TAG],
        interior: need.place.interior,
        locationFamily: motionPlaceLocationFamily(need.place),
        time: night ? P.NIGHT : P.DAY,
        svg: c.svg,
        floorY: c.floorY,
        horizonY: c.horizonY,
        spots: c.spots,
        features: c.features,
        framingBounds: c.framingBounds,
        compositions: c.compositions,
        fixtures: c.fixtures,
        plan: planOut,
        lights: c.lights,
        uses: 0,
        updatedAt: now(),
      };
    };
    let main: PuppetSet, otherSet: PuppetSet;
    try {
      main = make(dayTime === P.NIGHT, false);
      otherSet = make(dayTime !== P.NIGHT, true);
      main.variants = { [otherSet.time]: otherSet.id };
      otherSet.variants = { [main.time]: main.id };
      if (puppetPackActive()) {
        const issues = _.uniq([...puppetPackAssetIssues(main), ...puppetPackAssetIssues(otherSet)]);
        if (issues.length) throw new Error(issues.join(P.COMMA));
      }
      const missing = withPuppetAssemblyTrial([main, otherSet], [plan.base.id, ...placed.map(({ piece }) => piece.id)], () => need.validate?.(main) || []);
      if (missing.length) {
        for (const reason of missing) rejected.set(reason, (rejected.get(reason) || 0) + 1);
        continue;
      }
    } catch (error) {
      if (!puppetPackActive()) throw error;
      const reason = String((error as Error).message);
      rejected.set(reason, (rejected.get(reason) || 0) + 1);
      continue;
    }
    const sources = [plan.base.id, ...placed.map(({ piece }) => piece.id)];
    const save = (set: PuppetSet): PuppetSet => (puppetPackActive() ? registerPuppetAssembly(set, sources) : writePuppet(set));
    const other = save(otherSet);
    out[plan.key] = save({ ...main, variants: { [other.time]: other.id } });
    o.log(Q.LOG_COMPOSED(need.place.name, plan.base.key, _.map(placed, (p) => p.piece.key).join(P.COMMA)));
  }
  const missing = _.filter(needs, (n) => !out[n.place.key]);
  if (missing.length && rejected.size)
    o.log(
      I.ASSEMBLY_REJECTED(
        [...rejected.values()].reduce((sum, count) => sum + count, 0),
        [...rejected.keys()],
      ),
    );
  if (missing.length) o.log((puppetPackActive() ? I.ASSEMBLY_MISSING : Q.LOG_PLAN_FAIL)(_.map(missing, (n) => n.place.name).join(P.COMMA)));
  return out;
};
