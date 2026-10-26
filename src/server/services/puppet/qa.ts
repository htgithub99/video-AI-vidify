import _ from "lodash";
import path from "path";
import { createHash } from "crypto";
import { PUPPET as P, PUPPET_PROMPTS as PR } from "../../../constants/motionPuppet.js";
import { MOTION_PLACEMENT as M } from "../../../constants/motionPlacement.js";
import { MOTION_QA as Q } from "../../../constants/motionQa.js";
import { motionVisualCheckBlocks } from "../../../lib/motionQa.js";
import type { MotionSpec, MotionStoryAnalysis } from "../../../types/motionVideo.js";
import { puppetFrameLook as frameLook, type PuppetLine } from "../../../lib/motionPuppet.js";
import { genPreviewDir, genPreviewRel } from "./genState.js";
import { openStillSession } from "../motionRenderService.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import type { PuppetRunOptions } from "./stylePack.js";
import type { PuppetTimedFrame } from "./compilePuppet.js";
import type { PuppetRead } from "../../../types/motionPuppet.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../constants/motionVisualContract.js";
import { MOTION_STORYBOARD as SB } from "../../../constants/motionStoryboard.js";
import { MOTION_ILLUSTRATION as I } from "../../../constants/motionIllustration.js";
import { MOTION_PROMPT as PROMPT } from "../../../constants/motionPrompt.js";
import { motionPromptGroups } from "../../../lib/motionPrompt.js";
import { puppetLineContext } from "./visualContract.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as RESPONSE } from "../../../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponseRepair, withMotionResponsePrompt } from "../../../lib/motionResponseContract.js";
export interface PuppetSheetItem {
  t: number;
  text: string;
  line: string;
  lines: string[];
  file: string;
  abs: string;
  context?: string;
}
export const puppetSheet = async (spec: MotionSpec, lines: PuppetLine[] = [], merge = false, reads: Record<string, PuppetRead> = {}): Promise<PuppetSheetItem[]> => {
  const text = _.fromPairs(_.map(lines, (l) => [l.key, l.text]));
  const seen = new Set<string>();
  const byKey = new Map(lines.map((line) => [line.key, line]));
  const picks: { t: number; line: string; lines: string[]; text: string; look: string; context: string }[] = [];
  for (const shot of _.filter(spec.shots, { template: P.TEMPLATE })) {
    for (const f of _.castArray(((shot.params || {}) as { frames?: PuppetTimedFrame[] }).frames || [])) {
      const k = f.line + P.VARIANT_SEP + f.start;
      if (!f.line || seen.has(k)) continue;
      seen.add(k);
      const t = +(f.start + (f.end - f.start) * P.QA_AT).toFixed(3);
      const sub = _.find(spec.subtitles || [], (u) => u.start <= t && u.end > t);
      const keys = f.lines?.length ? f.lines : [f.line];
      const say = f.narration || keys.map((key) => text[key] || sub?.text || key).join(P.SPACE);
      const look = frameLook(f);
      const last = _.last(picks);
      if (merge && last && last.look === look && last.line === f.line) {
        if (!_.includes(last.lines, f.line)) {
          last.lines.push(f.line);
          last.text += P.SPACE + say;
        }
        continue;
      }
      picks.push({
        t,
        line: f.line,
        lines: keys,
        text: say,
        look,
        context: JSON.stringify({
          events: keys.map((key) => ({ source: byKey.has(key) ? JSON.parse(puppetLineContext(byKey.get(key)!)) : undefined, visual: reads[key]?.visual, fixtureStates: reads[key]?.fixtureStates, states: reads[key]?.states, objects: reads[key]?.objects })),
          frame: { shot: f.shot, set: f.set, light: f.light, actors: f.actors, prop: f.prop, items: f.items, effectSource: f.effectSource, effectTarget: f.effectTarget, effectMode: f.effectMode },
        }),
      });
    }
  }
  if (!picks.length) return [];
  const key = createHash(P.SHA)
    .update(JSON.stringify([picks, _.map(spec.shots, (s) => s.params), spec.kit]))
    .digest(P.HEX)
    .slice(0, 16);
  const dir = genPreviewDir(P.QA_DIR, key);
  const session = await openStillSession();
  try {
    const out = await session.render(
      spec,
      _.map(picks, (p, i) => ({ id: P.SHEET_ID(i), t: p.t })),
      dir,
      { width: P.QA_W, height: P.QA_H },
    );
    const issues = _.uniq(out.flatMap((item) => item.issues || []));
    if (issues.length) throw new Error(I.ENGINE_ERROR(issues));
    return _.map(out, (o, i) => ({ t: o.t, text: picks[i].text, line: picks[i].line, lines: picks[i].lines, context: picks[i].context, file: genPreviewRel(o.file), abs: o.file }));
  } finally {
    await session.close();
  }
};
export const qaPuppet = async (sheet: PuppetSheetItem[], analysis: MotionStoryAnalysis, o: PuppetRunOptions): Promise<Record<string, string>> => {
  o.signal?.throwIfAborted();
  if (!sheet.length) return {};
  const cast = _.map(analysis.cast, (c) => [c.key, c.name, _.truncate(c.look || c.description || P.EMPTY, { length: 80 })].join(P.SEP)).join(P.NL);
  const story = analysis.title + P.DASH + analysis.logline;
  const question = (pending: (PuppetSheetItem & { i: number })[]) => {
    const preceding = sheet.slice(Math.max(0, pending[0].i - V.QA_OVERLAP), pending[0].i);
    const images = [...preceding, ...pending];
    const frames = images.map((frame, index) => [index, index < preceding.length ? V.QA_CONTEXT : P.EMPTY, frame.text, frame.context || P.EMPTY].join(P.SEP)).join(P.NL);
    return { preceding, images, prompt: withMotionResponsePrompt(P.ARTIFACT_QA, PR.QA({ story, cast, frames }) + P.NL + SB.QA + P.NL + I.QA_PROMPT + P.NL + Q.REVIEW_PROMPT) };
  };
  const groups = motionPromptGroups(
    sheet.map((frame, i) => ({ ...frame, i })),
    (pending) => question(pending).prompt,
    Math.min(P.QA_PER_CALL, PROMPT.QA_ITEMS),
  );
  o.log(P.LOG_QA(sheet.length, groups.length));
  const bad: Record<string, string> = {};
  const checked = new Set<number>();
  await mapMotionAiPool(
    groups,
    async (group) => {
      let diagnostics: unknown;
      for (let attempt = 0; attempt < V.QA_ATTEMPTS; attempt++) {
        const pending = group.filter((frame) => !checked.has(frame.i));
        if (!pending.length) break;
        const { preceding, images, prompt } = question(pending);
        const raw = await (o.ai || runMotionAi)(
          diagnostics ? motionResponseRepair(prompt, diagnostics) : prompt,
          P.ARTIFACT_QA,
          o.exec,
          o.signal,
          o.log,
          images.map((frame) => ({ name: path.basename(frame.abs), mimeType: P.JPEG_MIME, path: frame.abs })),
        ).catch((e: any) => {
          if (o.signal?.aborted) throw e;
          o.log(Q.REVIEW_UNAVAILABLE(String(e?.message || e)));
          return null;
        });
        o.signal?.throwIfAborted();
        const checks = _.castArray(raw?.checks || []);
        const counts = _.countBy(checks, (check) => check?.i);
        for (const check of checks) {
          const index = check?.i == null ? NaN : Number(check.i);
          const frame = Number.isInteger(index) && index >= preceding.length ? pending[index - preceding.length] : undefined;
          if (!frame || checked.has(frame.i) || counts[index] !== 1 || !_.isBoolean(check?.ok)) continue;
          checked.add(frame.i);
          if (check.ok) continue;
          if (!motionVisualCheckBlocks(check)) {
            o.log(Q.REVIEW_ADVISORY(frame.i, _.toString(check.problem || check.fix || check.category)));
            continue;
          }
          if (check.replan === true) o.replan?.(frame.lines);
          const why = _.truncate(_.compact([_.toString(check.problem), _.toString(check.fix)]).join(P.SEP), { length: 600 }) || V.QA_MISSING;
          for (const line of frame.lines) bad[line] = bad[line] ? bad[line] + P.SEP + why : why;
        }
        diagnostics = { issues: motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS[P.ARTIFACT_QA]), pendingIndices: pending.flatMap((frame, index) => (checked.has(frame.i) ? [] : [preceding.length + index])), expected: RESPONSE.DUPLICATE_ID };
      }
    },
    puppetLanes(o.exec),
  );
  if (checked.size < sheet.length) o.log(Q.REVIEW_UNCHECKED(checked.size, sheet.length));
  o.log(_.size(bad) ? P.LOG_QA_BAD(_.size(bad), sheet.length) : checked.size === sheet.length ? P.LOG_QA_OK(sheet.length) : M.QA_PARTIAL(checked.size, sheet.length));
  return bad;
};
