import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import { PUPPET as P, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import type { MotionSpec, MotionStoryAnalysis } from "../../../types/motionVideo.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import { genPreviewDir, genPreviewRel } from "./genState.js";
import { openStillSession } from "../motionRenderService.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import type { PuppetRunOptions } from "./stylePack.js";
import type { PuppetTimedFrame } from "./compilePuppet.js";

export interface PuppetSheetItem { t: number; text: string; line: string; lines: string[]; file: string; abs: string; }

const frameLook = (f: PuppetTimedFrame): string => JSON.stringify([f.shot, f.set, f.light, f.prop, _.map(f.actors, (a) => [a.char, a.pose, a.expr, a.face])]);

export const puppetSheet = async (spec: MotionSpec, lines: PuppetLine[] = [], merge = false): Promise<PuppetSheetItem[]> => {
  const text = _.fromPairs(_.map(lines, (l) => [l.key, l.text]));
  const seen = new Set<string>();
  const picks: { t: number; line: string; lines: string[]; text: string; look: string }[] = [];
  for (const shot of _.filter(spec.shots, { template: P.TEMPLATE })) {
    for (const f of _.castArray(((shot.params || {}) as { frames?: PuppetTimedFrame[] }).frames || [])) {
      const k = f.line + P.VARIANT_SEP + f.start;
      if (!f.line || seen.has(k)) continue;
      seen.add(k);
      const t = +(f.start + (f.end - f.start) * P.QA_AT).toFixed(3);
      const sub = _.find(spec.subtitles || [], (u) => u.start <= t && u.end > t);
      const say = text[f.line] || sub?.text || f.line;
      const look = frameLook(f);
      const last = _.last(picks);
      if (merge && last && last.look === look) {
        if (!_.includes(last.lines, f.line)) {
          last.lines.push(f.line);
          last.text += P.SPACE + say;
        }
        continue;
      }
      picks.push({ t, line: f.line, lines: [f.line], text: say, look });
    }
  }
  if (!picks.length) return [];
  const key = createHash(P.SHA).update(JSON.stringify([picks, _.map(spec.shots, (s) => s.params), _.keys(spec.kit?.sets || {}), _.keys(spec.kit?.characters || {})])).digest(P.HEX).slice(0, 16);
  const dir = genPreviewDir(P.QA_DIR, key);
  const session = await openStillSession();
  try {
    const out = await session.render(spec, _.map(picks, (p, i) => ({ id: P.SHEET_ID(i), t: p.t })), dir, { width: P.QA_W, height: P.QA_H });
    return _.map(out, (o, i) => ({ t: o.t, text: picks[i].text, line: picks[i].line, lines: picks[i].lines, file: genPreviewRel(o.file), abs: o.file }));
  } finally {
    await session.close();
  }
};

export const qaPuppet = async (sheet: PuppetSheetItem[], analysis: MotionStoryAnalysis, o: PuppetRunOptions): Promise<Record<string, string>> => {
  if (!sheet.length) return {};
  const groups = _.chunk(_.map(sheet, (f, i) => ({ ...f, i })), P.QA_PER_CALL);
  o.log(P.LOG_QA(sheet.length, groups.length));
  const cast = _.map(analysis.cast, (c) => [c.key, c.name, _.truncate(c.look || c.description || P.EMPTY, { length: 80 })].join(P.SEP)).join(P.NL);
  const story = analysis.title + P.DASH + analysis.logline;
  const bad: Record<string, string> = {};
  await mapMotionAiPool(
    groups,
    async (group) => {
      const raw = await (o.ai || runMotionAi)(
        PR.QA({ story, cast, frames: _.map(group, (f, j) => [j, f.text].join(P.SEP)).join(P.NL) }),
        P.ARTIFACT_QA,
        o.exec,
        o.signal,
        o.log,
        _.map(group, (f) => ({ name: path.basename(f.abs), mimeType: P.JPEG_MIME, path: f.abs })),
      ).catch((e: any) => {
        if (o.signal?.aborted) throw e;
        o.log(P.LOG_QA_FAIL(String(e?.message || e)));
        return null;
      });
      for (const c of _.castArray(raw?.checks || [])) {
        const f = group[Number(c?.i)];
        if (!f || c?.ok !== false) continue;
        const why = _.truncate(_.compact([_.toString(c.problem), _.toString(c.fix)]).join(P.SEP), { length: 240 });
        for (const line of f.lines) bad[line] = why;
      }
    },
    puppetLanes(o.exec),
  );
  o.log(_.size(bad) ? P.LOG_QA_BAD(_.size(bad), sheet.length) : P.LOG_QA_OK(sheet.length));
  return bad;
};
