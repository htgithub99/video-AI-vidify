import fs from "fs";
import path from "path";
import _ from "lodash";
import { PUPPET as P, PUPPET_PROMPTS, PUPPET_STYLE_DEFAULT, PUPPET_STYLE_DESIGN_SOURCE, PUPPET_STYLE_PRESETS, PUPPET_TYPES, type PuppetPresetDef } from "../../../constants/motionPuppet.js";
import { puppetNoPack } from "../../../lib/motionPuppet.js";
import { getMotionEngineDir } from "../motionEngineService.js";
import type { MotionStyleReference } from "../../../types/motionVideo.js";
import type { PuppetStylePack } from "../../../types/motionPuppet.js";
import { runMotionAi, type MotionAiImage } from "../motionStoryService.js";
import type { MotionAiExecution } from "../../../types/motionVideo.js";
import { withMotionReferenceFiles } from "../motionReferenceService.js";
import { listPuppets, newPuppetId, puppetHash, puppetRefsDir, readPuppet, writePuppet } from "./kitLibrary.js";
export interface PuppetRunOptions {
  exec: MotionAiExecution;
  signal?: AbortSignal;
  log: (s: string) => void;
  ai?: typeof runMotionAi;
  fresh?: boolean;
}
const num = (v: unknown, d: number, lo: number, hi: number): number => (_.isFinite(Number(v)) ? _.clamp(Number(v), lo, hi) : d);
const hex = (v: unknown, d: string): string => (_.isString(v) && P.HEX_RE.test(v) ? v.toLowerCase() : d);
const pick = (v: unknown, list: readonly string[], d: string): string => (_.isString(v) && list.includes(v) ? v : d);
const normalizeStyle = (raw: any, base: PuppetPresetDef): Pick<PuppetStylePack, "name" | "description" | "body" | "face" | "line" | "vignette" | "palette" | "sets" | "characters" | "framing" | "detail" | "gradients" | "procedural" | "bodyColors"> => {
  const b: any = base.body,
    f: any = base.face,
    l: any = base.line;
  const rb = raw?.body || {},
    rf = raw?.face || {},
    rl = raw?.line || {};
  return {
    name: _.truncate(_.toString(raw?.name || base.name), { length: 60 }),
    description: _.truncate(_.toString(raw?.description || base.description), { length: 900 }),
    body: {
      head: num(rb.head, b.head, 0.25, 0.6),
      headW: num(rb.headW, b.headW, 0.6, 1.2),
      bodyW: num(rb.bodyW, b.bodyW, 0.5, 1.5),
      legs: rb.legs === 1 || rb.legs === true ? 1 : rb.legs === 0 || rb.legs === false ? 0 : b.legs,
      overlap: num(rb.overlap, b.overlap, 0, 0.3),
      limb: pick(rb.limb, P.LIMBS, b.limb),
      limbW: num(rb.limbW, b.limbW, 0.05, 0.22),
      armLen: num(rb.armLen, b.armLen, 0.25, 0.7),
      hand: num(rb.hand, b.hand, 0, 0.2),
      shape: pick(rb.shape, P.BODY_SHAPES, b.shape),
      idleArms: pick(rb.idleArms, P.IDLE_ARMS, b.idleArms),
      limbOutline: rb.limbOutline === undefined ? b.limbOutline !== false : rb.limbOutline !== false,
    },
    face: {
      fill: hex(rf.fill, f.fill),
      eyes: pick(rf.eyes, P.EYES, f.eyes),
      eyeW: num(rf.eyeW, f.eyeW, 0.04, 0.25),
      eyeH: num(rf.eyeH, f.eyeH, 0.04, 0.32),
      eyeGap: num(rf.eyeGap, f.eyeGap, 0.2, 0.5),
      eyeY: num(rf.eyeY, f.eyeY, 0.3, 0.7),
      eyeColor: hex(rf.eyeColor, f.eyeColor),
      mouth: pick(rf.mouth, P.MOUTHS, f.mouth),
      mouthW: num(rf.mouthW, f.mouthW, 0.04, 0.2),
      mouthH: num(rf.mouthH, f.mouthH, 0.03, 0.2),
      mouthY: num(rf.mouthY, f.mouthY, 0.55, 0.88),
      brows: rf.brows === undefined ? f.brows : rf.brows === true,
      mouthRest: pick(rf.mouthRest, P.MOUTH_RESTS, f.mouthRest),
    },
    line: { width: num(rl.width, l.width, 0.004, 0.025), color: hex(rl.color, l.color) },
    vignette: num(raw?.vignette, base.vignette, 0, 0.7),
    palette: _.take(
      _.filter(_.castArray(raw?.palette || base.palette), (c) => _.isString(c) && P.HEX_RE.test(c)),
      10,
    ) as string[],
    sets: _.truncate(_.toString(raw?.sets || base.sets), { length: 900 }),
    characters: _.truncate(_.toString(raw?.characters || base.characters), { length: 400 }),
    framing: _.truncate(_.toString(raw?.framing || base.framing), { length: 600 }),
    detail: pick(raw?.detail, P.DETAILS, base.detail),
    gradients: raw?.gradients === undefined ? base.gradients : raw.gradients === true,
    procedural: raw?.procedural === undefined ? base.procedural : raw.procedural === true,
    bodyColors: _.filter(_.castArray(raw?.bodyColors || base.bodyColors), (c) => _.isString(c) && P.HEX_RE.test(c)) as string[],
  };
};
const shippedRefs = (key: string, id: string): { refs: string[]; refKinds: Record<string, string[]>; refsKey: string } => {
  const src = path.join(getMotionEngineDir(), P.REFS_SHIPPED_DIR, key);
  const files = fs.existsSync(src) ? _.sortBy(_.filter(fs.readdirSync(src), (f) => P.REF_FILE_RE.test(f))) : [];
  const dest = puppetRefsDir(id);
  for (const f of files) if (!fs.existsSync(path.join(dest, f))) fs.copyFileSync(path.join(src, f), path.join(dest, f));
  const refKinds = _.mapValues(
    _.groupBy(files, (f) => _.toLower(f.match(P.REF_FILE_RE)![1])),
    (list) => list,
  );
  return { refs: files, refKinds, refsKey: puppetHash(files.join(P.COMMA)) };
};
export const presetStyle = (key: string): PuppetStylePack => {
  const k = PUPPET_STYLE_PRESETS[key] ? key : PUPPET_STYLE_DEFAULT;
  const id = newPuppetId(PUPPET_TYPES.STYLE, P.PRESET_SEED + k);
  const base = PUPPET_STYLE_PRESETS[k];
  const refs = shippedRefs(k, id);
  const hit = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, id);
  if (hit && hit.refsKey === refs.refsKey && hit.detail) return hit;
  return writePuppet<PuppetStylePack>({ id, type: PUPPET_TYPES.STYLE, source: P.SOURCE_PRESET, preset: k, ...normalizeStyle({}, base), ...refs, ...(hit ? { name: hit.name } : {}), updatedAt: new Date().toISOString() });
};
export const puppetStyleText = (s: PuppetStylePack, part: string = P.PART_CHARACTER): string => {
  const shapes = P.DETAIL_SHAPES[s.detail] || P.DETAIL_SHAPES[P.DETAIL_DEFAULT];
  return _.compact([s.description, part === P.PART_CHARACTER ? P.CHARACTERS_LABEL + s.characters : P.SETS_LABEL + s.sets, P.DETAIL_LABEL(s.detail, shapes[0], shapes[1]), s.gradients ? P.GRADIENTS_ON : P.GRADIENTS_OFF, s.palette.length ? P.PALETTE_LABEL + s.palette.join(P.COMMA) : P.EMPTY, P.OUTLINE_LABEL + s.line.color]).join(P.NL);
};
export const puppetStyleImages = (s: PuppetStylePack, kinds: readonly string[] = [], max: number = P.REF_MAX): MotionAiImage[] => {
  const byKind = s.refKinds || {};
  const wanted = _.uniq(_.flatMap(kinds, (k) => byKind[k] || []));
  const general = byKind[P.REF_STYLE] || (_.size(byKind) ? [] : s.refs || []);
  const pool = wanted.length ? [...wanted, ...general] : general.length ? general : s.refs || [];
  return _.compact(
    _.map(_.take(_.uniq(pool), max), (f) => {
      const file = path.join(puppetRefsDir(s.id), path.basename(f));
      return fs.existsSync(file) ? { name: path.basename(file), mimeType: P.MIME_OF(file), path: file } : null;
    }),
  );
};
export interface PuppetStoryBrief {
  key: string;
  story: string;
  setting: string;
  genre: string;
}
const ownStyle = (raw: any): any => ({ ...(raw || {}), procedural: raw?.procedural === true });
const designPuppetStyle = async (brief: PuppetStoryBrief, o: PuppetRunOptions): Promise<PuppetStylePack> => {
  const designKey = puppetHash(P.DESIGN_SEED + brief.key);
  const hit = _.find(listPuppets<PuppetStylePack>(PUPPET_TYPES.STYLE), (s) => s.designKey === designKey);
  if (hit && !o.fresh) return hit;
  const out = await (o.ai || runMotionAi)(PUPPET_PROMPTS.DESIGN(brief), P.ARTIFACT_STYLE, o.exec, o.signal, o.log).catch((e: any) => {
    if (o.signal?.aborted) throw e;
    return null;
  });
  const id = newPuppetId(PUPPET_TYPES.STYLE, P.DESIGN_SEED + brief.key + Date.now());
  return writePuppet<PuppetStylePack>({ id, type: PUPPET_TYPES.STYLE, source: PUPPET_STYLE_DESIGN_SOURCE, designKey, refs: [], refKinds: {}, refsKey: designKey, ...normalizeStyle(ownStyle(out), PUPPET_STYLE_PRESETS[PUPPET_STYLE_DEFAULT]), updatedAt: new Date().toISOString() });
};
export const resolvePuppetStyle = async (references: MotionStyleReference[], preset: string | undefined, o: PuppetRunOptions, brief: PuppetStoryBrief): Promise<PuppetStylePack> => {
  if (!references.length && !puppetNoPack(preset, 0)) return readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, _.toString(preset)) || presetStyle(_.toString(preset));
  if (!references.length) return designPuppetStyle(brief, o);
  const fingerprint = puppetHash(_.map(references, (r) => r.dataUrl).join(P.EMPTY));
  const hit = _.find(listPuppets<PuppetStylePack>(PUPPET_TYPES.STYLE), (s) => s.fingerprint === fingerprint);
  if (hit) return hit;
  const id = hit?.id || newPuppetId(PUPPET_TYPES.STYLE, fingerprint);
  const raw = await withMotionReferenceFiles(references, async (images) => {
    const refs = _.map(images, (im, i) => {
      const name = P.REF_NAME(i, path.extname(im.path));
      fs.copyFileSync(im.path, path.join(puppetRefsDir(id), name));
      return name;
    });
    const out = await (o.ai || runMotionAi)(PUPPET_PROMPTS.STYLE({ names: _.map(references, (r) => r.name).join(P.COMMA) }), P.ARTIFACT_STYLE, o.exec, o.signal, o.log, images).catch((e: any) => {
      if (o.signal?.aborted) throw e;
      return null;
    });
    return { out, refs };
  });
  const style = writePuppet<PuppetStylePack>({ id, type: PUPPET_TYPES.STYLE, source: P.SOURCE_REFERENCE, fingerprint, refs: raw.refs, refKinds: { [P.REF_STYLE]: raw.refs }, refsKey: fingerprint, ...normalizeStyle(ownStyle(raw.out), PUPPET_STYLE_PRESETS[PUPPET_STYLE_DEFAULT]), updatedAt: new Date().toISOString() });
  return style;
};
export const ensurePuppetPresets = (): PuppetStylePack[] => _.map(_.keys(PUPPET_STYLE_PRESETS), presetStyle);
