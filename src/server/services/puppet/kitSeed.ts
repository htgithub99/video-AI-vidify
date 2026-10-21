import _ from "lodash";
import { PUPPET as P, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { PUPPET_SEED_DEFAULT, PUPPET_SEED_PACKS, PUPPET_SEED_PROPS_PER_ROUND, PUPPET_SEED_SETS_PER_ROUND, PUPPET_SEED_SETTING, PUPPET_SEED_TAG, PUPPET_SEED_USES } from "../../../constants/motionPuppetSeed.js";
import type { PuppetProp, PuppetSet, PuppetStylePack } from "../../../types/motionPuppet.js";
import { drawPuppetProps, drawPuppetSets, ensureSetVariant, puppetLanes } from "./kitDraw.js";
import { mapMotionAiPool } from "../motionStoryService.js";
import { listPuppets, readPuppet, writePuppet } from "./kitLibrary.js";
import { presetStyle, type PuppetRunOptions } from "./stylePack.js";

export interface PuppetSeedReport { style: string; sets: number; props: number; variants: number; skipped: number; }

export const seedPuppetKit = async (styleId: string, genre: string, o: PuppetRunOptions, progress: (v: number) => void): Promise<PuppetSeedReport> => {
  const style = readPuppet<PuppetStylePack>(PUPPET_TYPES.STYLE, styleId) || presetStyle(styleId);
  const pack = PUPPET_SEED_PACKS[genre] || PUPPET_SEED_PACKS[PUPPET_SEED_DEFAULT];
  const report: PuppetSeedReport = { style: style.name, sets: 0, props: 0, variants: 0, skipped: 0 };
  const seeded = (tags: string[], key: string) => _.includes(tags, PUPPET_SEED_TAG) && _.includes(tags, key);
  const haveSets = listPuppets<PuppetSet>(PUPPET_TYPES.SET, (s) => s.styleId === style.id && _.includes(s.tags, PUPPET_SEED_TAG) && !s.name.includes(P.VARIANT_SEP));
  const haveProps = listPuppets<PuppetProp>(PUPPET_TYPES.PROP, (p) => p.styleId === style.id);
  const places = _.filter(pack.places, (pl) => !_.some(haveSets, (s) => seeded(s.tags, pl.key)));
  const props = _.filter(pack.props, (pr) => !_.some(haveProps, (p) => p.key === pr.key));
  report.skipped = pack.places.length - places.length + pack.props.length - props.length;
  o.log(P.LOG_SEED_START(style.name, pack.name, places.length, props.length, report.skipped));
  const nightAi = _.includes(P.VARIANT_AI_DETAIL, style.detail);
  const total = Math.max(1, places.length + props.length + (nightAi ? _.filter(places, (pl) => pl.night).length : 0));
  let done = 0;
  const step = (n: number) => progress(Math.min(0.99, (done += n) / total));

  for (const round of _.chunk(places, PUPPET_SEED_SETS_PER_ROUND)) {
    if (o.signal?.aborted) break;
    const drawn = await drawPuppetSets(style, _.map(round, (pl) => ({ key: pl.key, place: { key: pl.key, name: pl.name, desc: pl.desc, interior: pl.interior, time: P.DAY }, uses: PUPPET_SEED_USES })), o);
    const nightJobs: PuppetSet[] = [];
    for (const pl of round) {
      const set = drawn[pl.key];
      if (!set) continue;
      const saved = writePuppet<PuppetSet>({ ...set, desc: pl.desc, tags: _.uniq([...set.tags, PUPPET_SEED_TAG, ...pl.tags]) });
      report.sets++;
      if (nightAi && pl.night) nightJobs.push(saved);
    }
    step(round.length);
    for (const set of nightJobs) {
      if (o.signal?.aborted) break;
      if (await ensureSetVariant(set, P.NIGHT, o, style)) report.variants++;
      step(1);
    }
  }

  for (const round of _.chunk(props, PUPPET_SEED_PROPS_PER_ROUND)) {
    if (o.signal?.aborted) break;
    const notes = _.fromPairs(_.map(round, (pr) => [pr.key, pr.name + P.DASH + pr.note]));
    const groups = _.chunk(_.map(round, (pr) => pr.key), P.PROPS_PER_CALL);
    const made = Object.assign({}, ...(await mapMotionAiPool(groups, (g) => drawPuppetProps(style, g, notes, PUPPET_SEED_SETTING, o), puppetLanes(o.exec)))) as Record<string, PuppetProp>;
    for (const pr of round) {
      const p = made[pr.key];
      if (!p) continue;
      writePuppet<PuppetProp>({ ...p, name: pr.name, desc: pr.note, tags: _.uniq([...p.tags, PUPPET_SEED_TAG, ...pr.tags]) });
      report.props++;
    }
    step(round.length);
  }
  o.log(P.LOG_SEED_DONE(report.sets, report.variants, report.props));
  return report;
};
