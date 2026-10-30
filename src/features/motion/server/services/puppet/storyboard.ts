import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { MotionRepairLedger } from "../../../../../lib/motionAiRepair.js";
import { requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { MOTION_STORYBOARD as S } from "../../../../../constants/motionStoryboard.js";
import { MOTION_ILLUSTRATION as I } from "../../../../../constants/motionIllustration.js";
import { puppetPackStoryCapabilities } from "./packCatalog.js";
import { PUPPET as P } from "../../../../../constants/motionPuppet.js";
import { puppetKeyOf } from "../../../../../lib/motionPuppetValues.js";
import { puppetVisualInputKey, type PuppetLine } from "../../../../../lib/motionPuppet.js";
import { puppetWords, puppetStoryboardCovers, puppetStoryboardInputKey, puppetStoryboardProfile } from "../../../../../lib/motionStoryboard.js";
import type { PuppetStoryboard, PuppetVisualUnit } from "../../../../../types/motionPuppet.js";
import type { MotionBeat, MotionStoryAnalysis } from "../../../../../types/motionVideo.js";
import { mapMotionAiPool, runMotionAi } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import { motionPromptGroups, motionPromptPayloadBudget } from "../../../../../lib/motionPrompt.js";
import { motionResponsePrompt } from "../../../../../lib/motionResponseContract.js";
import { motionInputKey } from "../motionFileUtils.js";
import { MOTION_PRODUCTION } from "../../../../../constants/motionProduction.js";
import { MOTION_PROMPT } from "../../../../../constants/motionPrompt.js";
import { MOTION_PROGRESS as PROGRESS } from "../../../../../constants/motionProgress.js";
import type { PuppetRunOptions } from "./stylePack.js";
import { motionScenePacingRule, motionBeatVisualSeconds } from "../../../../../lib/motionScenePacing.js";
const boundaryPosition = (value: any, lines: PuppetLine[], offset: number): number | null => {
  const index = value?.from?.line - offset;
  if (!Number.isInteger(value?.from?.line) || index < 0 || index >= lines.length) return null;
  const counts = lines.map((line) => puppetWords(line.text).length);
  if (!counts[index]) return null;
  let word = 0;
  if (value.from.cue != null) {
    if (typeof value.from.cue !== "string") return null;
    const cue = puppetWords(value.from.cue).map((token) => token.key);
    const source = puppetWords(lines[index].text).map((token) => token.key);
    const matches = source.flatMap((_token, at) => (cue.length && cue.every((token, part) => token === source[at + part]) ? [at] : []));
    const occurrence = value.from.occurrence ?? (matches.length === 1 ? 0 : -1);
    if (!Number.isInteger(occurrence) || occurrence < 0 || occurrence >= matches.length) return null;
    word = matches[occurrence];
  }
  return counts.slice(0, index).reduce((sum, count) => sum + count, 0) + word;
};
const unitKey = (data: Omit<PuppetVisualUnit, "key">, lines: PuppetLine[], profileKey: string): string => S.UNIT_PREFIX + puppetVisualInputKey([{ text: stringifyJson([profileKey, { scene: data.scene, purpose: data.purpose, show: data.show, sources: data.sources }, data.sources.map((range) => [range.line, lines.find((line) => line.key === range.line)])]) } as PuppetLine]);
export const parsePuppetStoryboard = (raw: unknown, lines: PuppetLine[], offset: number, inputKey: string, profileKey = inputKey): PuppetVisualUnit[] | null => {
  const values = (raw as { units?: any[] })?.units;
  if (!Array.isArray(values) || !values.length) return null;
  const counts = lines.map((line) => puppetWords(line.text).length);
  const starts = counts.map((_count, index) => counts.slice(0, index).reduce((sum, count) => sum + count, 0));
  const boundaries: { position: number; scene: string; purpose: string; show: string; read?: Record<string, any> }[] = [];
  for (const value of values) {
    const position = boundaryPosition(value, lines, offset);
    const scene = typeof value.scene === "string" ? puppetKeyOf(value.scene) : P.EMPTY;
    const show = typeof value.show === "string" ? value.show.trim() : P.EMPTY;
    if (position == null || !scene || !show || !S.PURPOSES.includes(value.purpose) || (!boundaries.length && position !== 0) || (boundaries.length && position <= boundaries[boundaries.length - 1].position)) return null;
    boundaries.push({ position, scene, purpose: value.purpose, show, ...(value.read && typeof value.read === "object" && !Array.isArray(value.read) ? { read: structuredClone(value.read) } : {}) });
  }
  const total = counts.reduce((sum, count) => sum + count, 0);
  const units = boundaries.map((boundary, index) => {
    const end = boundaries[index + 1]?.position ?? total;
    const sources = lines.flatMap((line, row) => {
      const from = Math.max(0, boundary.position - starts[row]);
      const to = Math.min(counts[row], end - starts[row]);
      return to > from ? [{ line: line.key, from, to }] : [];
    });
    const data = { scene: boundary.scene, purpose: boundary.purpose, show: boundary.show, sources, ...(boundary.read ? { read: boundary.read } : {}) };
    return { ...data, key: unitKey(data, lines, profileKey) };
  });
  return puppetStoryboardCovers({ version: S.VERSION, inputKey, units }, lines) ? units : null;
};
export const planPuppetStoryboard = async (lines: PuppetLine[], beats: MotionBeat[], analysis: MotionStoryAnalysis, o: PuppetRunOptions, previous?: PuppetStoryboard, issues: Record<string, string> = {}, accepted?: (plan: PuppetStoryboard) => void): Promise<PuppetStoryboard> => {
  o.signal?.throwIfAborted();
  const inputKey = puppetStoryboardInputKey(lines, analysis);
  const profileKey = puppetVisualInputKey([{ text: stringifyJson([puppetStoryboardProfile(analysis), analysis.cast, analysis.places, analysis.illustrationNeeds]) } as PuppetLine]);
  if (previous?.inputKey === inputKey && puppetStoryboardCovers(previous, lines) && !previous.units.some((unit) => issues[unit.key])) return previous;
  const compatible = previous?.inputKey === inputKey || previous?.profileKey === profileKey;
  const drafts: NonNullable<PuppetStoryboard["drafts"]> = compatible ? { ...previous.drafts } : {};
  const repairStates: NonNullable<PuppetStoryboard["repairStates"]> = compatible ? structuredClone(previous.repairStates || {}) : {};
  const beatIndex = new Map(beats.map((beat, index) => [beat.id, index]));
  type Group = { lines: PuppetLine[]; offset: number; key: string };
  const contextOf = (line: PuppetLine, index: number) => ({ line: index, text: line.text, speaker: line.speaker, beat: line.beatId, chapter: line.chapterId, place: line.place, time: line.time, action: line.action, scenePlan: line.scenePlan });
  const groupKey = (members: PuppetLine[]) => motionInputKey([profileKey, analysis.cast, analysis.places, members]);
  const sourceOf = (group: Pick<Group, "lines" | "offset">) => S.BOUNDARIES(group.lines.map((_line, index) => index + group.offset)) + P.NL + S.REQUESTED + stringifyJson(group.lines.map((line, index) => contextOf(line, index + group.offset)));
  const capabilityCache = new Map<string, string>();
  const promptOf = (group: Pick<Group, "lines" | "offset">, earlier?: PuppetVisualUnit[]) => {
    const placeKeys = new Set(group.lines.map((line) => line.place));
    const places = analysis.places?.filter((place) => placeKeys.has(place.key)) || [];
    const contextPlaces = places.length ? places : analysis.places || [];
    const capabilityKey = stringifyJson(contextPlaces);
    if (!capabilityCache.has(capabilityKey)) capabilityCache.set(capabilityKey, puppetPackStoryCapabilities(analysis.stylePreset, { places: contextPlaces }));
    const chapters = new Set(group.lines.map((line) => line.chapterId));
    const needs = analysis.illustrationNeeds?.filter((need) => chapters.has(need.chapterId));
    return (
      [
        S.PROMPT,
        motionScenePacingRule(
          analysis.visualSettings,
          group.lines.reduce((sum, line) => sum + motionBeatVisualSeconds({ narration: line.text } as MotionBeat, o.language), 0),
        ),
        I.PROMPT,
        S.PLAN_READ,
        motionResponsePrompt(S.ARTIFACT),
        capabilityCache.get(capabilityKey),
        S.PROFILE + stringifyJson({ ...puppetStoryboardProfile(analysis), cast: analysis.cast, places: contextPlaces }),
        needs?.length ? MOTION_PROMPT.ILLUSTRATION_NEEDS + stringifyJson(needs) : P.EMPTY,
        S.CONTEXT + stringifyJson(lines.slice(Math.max(0, group.offset - S.CONTEXT_LINES), group.offset).map((line) => ({ text: line.text, place: line.place, time: line.time }))),
        sourceOf(group),
        earlier?.length ? S.REPAIR_PLAN + stringifyJson(earlier.map((unit) => ({ ...unit, problem: issues[unit.key] }))) : P.EMPTY,
      ] as string[]
    ).join(P.NL);
  };
  const groups: Group[] = [];
  const frozen = new Map<number, Group>();
  const frozenLines = new Set<string>();
  if (compatible)
    for (const saved of previous.groups || []) {
      if (!saved || !Array.isArray(saved.lines) || !saved.lines.length || new Set(saved.lines).size !== saved.lines.length || saved.lines.some((line) => typeof line !== "string" || frozenLines.has(line)) || typeof saved.key !== "string" || !Number.isInteger(saved.offset) || saved.offset < 0) throw new Error(MOTION_PRODUCTION.TASK_INVALID);
      for (const line of saved.lines) frozenLines.add(line);
      const offset = lines.findIndex((line) => line.key === saved.lines[0]);
      const members = lines.slice(offset, offset + saved.lines.length);
      if (offset < 0 || !members.length || !saved.lines.every((key, index) => members[index]?.key === key) || groupKey(members) !== saved.key) continue;
      frozen.set(offset, { lines: members, offset, key: saved.key });
      if (saved.offset !== offset && drafts[saved.key]) drafts[saved.key] = drafts[saved.key].map((row, index) => ({ ...row, id: S.ITEM_ID(offset, index), value: { ...row.value, from: { ...row.value.from, line: row.value.from?.line - saved.offset + offset } } }));
    }
  const legacy = previous?.inputKey === inputKey && !previous.groups?.length && (previous.units?.length || Object.keys(drafts).length || Object.keys(repairStates).length);
  let words = 0;
  for (const [index, line] of lines.entries()) {
    const locked = frozen.get(index);
    const previousGroup = groups[groups.length - 1];
    if (previousGroup && index < previousGroup.offset + previousGroup.lines.length) continue;
    if (locked) {
      groups.push(locked);
      words = 0;
      continue;
    }
    const before = lines[index - 1];
    const group = groups[groups.length - 1];
    const count = puppetWords(line.text).length;
    const discontinuous = before && (beatIndex.get(line.beatId)! - beatIndex.get(before.beatId)! > 1 || before.chapterId !== line.chapterId || before.place !== line.place || before.time !== line.time);
    if (!group || frozen.has(group.offset) || discontinuous || group.lines.length >= S.MAX_LINES || words + count > S.MAX_WORDS) {
      groups.push({ lines: [line], offset: index, key: P.EMPTY });
      words = count;
    } else {
      group.lines.push(line);
      words += count;
    }
  }
  const adaptive = legacy
    ? groups
    : groups.flatMap((group) => (frozen.has(group.offset) ? [group] : motionPromptGroups(group.lines, (members) => promptOf({ lines: members, offset: lines.indexOf(members[0]) }), S.MAX_LINES, motionPromptPayloadBudget(promptOf({ lines: [], offset: group.offset }).length)).map((members) => ({ lines: members, offset: lines.indexOf(members[0]), key: groupKey(members) }))));
  groups.splice(0, groups.length, ...adaptive.map((group) => ({ ...group, key: group.key || groupKey(group.lines) })));
  for (const group of groups) {
    if (legacy && drafts[String(group.offset)]) {
      drafts[group.key] = drafts[String(group.offset)];
      delete drafts[String(group.offset)];
    }
    if (legacy && repairStates[String(group.offset)]) {
      repairStates[group.key] = repairStates[String(group.offset)];
      delete repairStates[String(group.offset)];
    }
  }
  const activeKeys = new Set(groups.map((group) => group.key));
  for (const key of Object.keys(drafts)) if (!activeKeys.has(key)) delete drafts[key];
  for (const key of Object.keys(repairStates)) if (!activeKeys.has(key)) delete repairStates[key];
  o.log(S.LOG_START(lines.length, groups.length));
  const prior = new Map<number, PuppetVisualUnit[]>();
  const completed = new Map<number, PuppetVisualUnit[]>();
  for (const group of groups) {
    const keys = new Set(group.lines.map((line) => line.key));
    const units =
      previous?.version === S.VERSION && Array.isArray(previous.units)
        ? previous.units.filter((unit) => Array.isArray(unit?.sources) && unit.sources.some((range) => range && keys.has(range.line)) && (previous.inputKey === inputKey || (previous.profileKey === profileKey && unit.key === unitKey({ scene: unit.scene, purpose: unit.purpose, show: unit.show, sources: unit.sources }, lines, profileKey))))
        : [];
    if (!units.length || !puppetStoryboardCovers({ version: S.VERSION, inputKey, units }, group.lines)) continue;
    prior.set(group.offset, units);
    if (!units.some((unit) => issues[unit.key])) completed.set(group.offset, units);
  }
  const checkpoint = (): PuppetStoryboard => ({ version: S.VERSION, inputKey, profileKey, drafts, repairStates, groups: groups.map((group) => ({ key: group.key, lines: group.lines.map((line) => line.key), offset: group.offset })), units: [...completed.entries()].sort(([a], [b]) => a - b).flatMap(([, units]) => units) });
  if (completed.size) accepted?.(checkpoint());
  const results = await mapMotionAiPool(
    groups,
    async (group) => {
      const groupIndex = groups.indexOf(group) + 1;
      const report = (status: string) =>
        o.log(
          PROGRESS.GROUP(
            status,
            groupIndex,
            groups.length,
            group.offset + 1,
            group.offset + group.lines.length,
            lines.length,
            [...completed.values()].reduce((sum, rows) => sum + rows.length, 0),
          ),
        );
      const earlier = prior.get(group.offset);
      if (completed.has(group.offset)) {
        report(PROGRESS.STATUS.REUSE);
        return completed.get(group.offset)!;
      }
      report(PROGRESS.STATUS.START);
      const prompt = promptOf(group, earlier);
      let ledger: MotionRepairLedger<Record<string, any>> | undefined;
      let values: Record<string, any>[] = [];
      const repairPrompt = () => {
        const requested = new Set<number>();
        for (const pending of ledger!.pending()) {
          const index = ledger!.ids.indexOf(pending.id);
          const before = values
            .slice(0, index)
            .reverse()
            .find((row) => boundaryPosition(row, group.lines, group.offset) != null);
          const next = values.slice(index + 1).find((row) => boundaryPosition(row, group.lines, group.offset) != null);
          const from = Math.max(group.offset, before?.from.line ?? group.offset);
          const to = Math.min(group.offset + group.lines.length - 1, next?.from.line ?? group.offset + group.lines.length - 1);
          for (let line = from; line <= to; line++) requested.add(line);
        }
        const targets = ledger!.pending();
        return (
          [
            S.REPAIR_FIELDS(targets),
            S.BOUNDARIES(group.lines.map((_line, index) => group.offset + index)),
            S.REQUESTED + stringifyJson([...requested].sort((a, b) => a - b).map((index) => contextOf(lines[index], index))),
            S.READ_ONLY + stringifyJson(values.map((value, index) => ({ id: ledger!.ids[index], from: value.from, scene: value.scene, purpose: value.purpose, show: value.show }))),
          ] as string[]
        ).join(P.NL);
      };
      const assess = (raw: any) => {
        const rows = Array.isArray(raw?.units) ? raw.units.filter((row: unknown) => row && typeof row === "object" && !Array.isArray(row)) : [];
        if (!ledger && rows.length) {
          values = rows;
          ledger = new MotionRepairLedger(
            values.map((_value, index) => S.ITEM_ID(group.offset, index)),
            (value, id) => {
              const index = ledger!.ids.indexOf(id);
              values[index] = value;
              const position = boundaryPosition(value, group.lines, group.offset);
              const previousPositions = values
                .slice(0, index)
                .map((row) => boundaryPosition(row, group.lines, group.offset))
                .filter((at): at is number => at != null);
              const nextPositions = values
                .slice(index + 1)
                .map((row) => boundaryPosition(row, group.lines, group.offset))
                .filter((at): at is number => at != null);
              const fields = (
                [
                  position == null || (!index && position !== 0) || (previousPositions.length && position! <= Math.max(...previousPositions)) || (nextPositions.length && position! >= Math.min(...nextPositions)) ? RT_SERVER.FROM : P.EMPTY,
                  typeof value.scene !== "string" || !puppetKeyOf(value.scene) ? RT_SHARED.SCENE : P.EMPTY,
                  !S.PURPOSES.includes(value.purpose) ? RT_SERVER.PURPOSE : P.EMPTY,
                  typeof value.show !== "string" || !value.show.trim() ? RT_SERVER.SHOW : P.EMPTY,
                ] as string[]
              ).filter(Boolean);
              return fields.map((path) => ({ path, reason: S.INVALID_FIELD }));
            },
          );
          ledger.submit(values.map((value, index) => ({ id: ledger!.ids[index], value })));
        } else if (ledger) ledger.submit(rows.flatMap((value: any) => (typeof value.id === "string" ? [{ id: value.id, value }] : [])));
        if (!ledger) return { value: undefined, errors: [S.INVALID_FIELD] };
        drafts[group.key] = [
          ...ledger.accepted(),
          ...ledger
            .pending()
            .filter((row) => row.draft)
            .map((row) => ({ id: row.id, value: row.draft! })),
        ].sort((a, b) => ledger!.ids.indexOf(a.id) - ledger!.ids.indexOf(b.id));
        accepted?.(checkpoint());
        if (ledger.pending().length) return { value: undefined, errors: ledger.pending().map((row) => stringifyJson({ id: row.id, errors: row.errors })) };
        const units = parsePuppetStoryboard({ units: ledger.accepted().map((row) => row.value) }, group.lines, group.offset, inputKey, profileKey);
        if (!units) return { value: undefined, errors: [S.INVALID_FIELD] };
        return { value: units, errors: [] };
      };
      const restored = drafts[group.key]?.length ? assess({ units: drafts[group.key].map((row) => row.value) }) : undefined;
      if (restored?.value) {
        completed.set(group.offset, restored.value);
        delete drafts[group.key];
        delete repairStates[group.key];
        accepted?.(checkpoint());
        report(PROGRESS.STATUS.REUSE);
        return restored.value;
      }
      const contract: MotionAiResponseContract = {
        targetIds: group.lines.map((line) => line.key),
        attempts: S.ATTEMPTS,
        state: repairStates[group.key],
        checkpoint: (state) => {
          repairStates[group.key] = state;
          accepted?.(checkpoint());
        },
        start: () => (ledger ? repairPrompt() : prompt),
        assess,
        repair: () => (ledger ? repairPrompt() : prompt + P.NL + S.REPAIR),
        failure: (errors) => new Error(S.FAILURE(errors.join(P.NL))),
        rejected: (_raw, _value, errors, _route, attempt) => {
          o.log(S.LOG_RETRY(attempt) + P.SPACE + errors.join(P.SEP));
        },
      };
      const units: PuppetVisualUnit[] = o.ai ? await requestMotionAiContract(prompt, o.exec, (question) => o.ai!(question, S.ARTIFACT, o.exec, o.signal, o.log), contract, o.signal) : await runMotionAi(prompt, S.ARTIFACT, o.exec, o.signal, o.log, undefined, 0, contract);
      completed.set(group.offset, units);
      delete drafts[group.key];
      delete repairStates[group.key];
      accepted?.(checkpoint());
      report(PROGRESS.STATUS.DONE);
      o.log(S.LOG_PROGRESS(completed.size, groups.length));
      return units;
    },
    puppetLanes(o.exec),
  );
  const plan = { ...checkpoint(), units: results.flat() };
  if (!puppetStoryboardCovers(plan, lines)) throw new Error(S.INVALID);
  o.log(S.LOG_DONE(plan.units.length, lines.length));
  return plan;
};
