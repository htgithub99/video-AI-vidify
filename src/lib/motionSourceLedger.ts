import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_PROMPT as P } from "../constants/motionPrompt.js";
import { motionPromptGroups } from "./motionPrompt.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT as R } from "../constants/motionResponseContract.js";
import { motionResponseIssues, motionResponseRepair } from "./motionResponseContract.js";
export interface MotionSourceLedgerFact {
  id: string;
  sourceId: string;
  t: number;
  kind: string;
  point: string;
  quote: string;
  causes: string[];
}
export interface MotionSourceLedgerNode {
  ids: string[];
  text: string;
  facts?: MotionSourceLedgerFact[];
  boundaries?: { sourceId: string; t: number; first: string; last: string }[];
}
export interface MotionSourceLedgerDraft {
  nodes?: Record<string, MotionSourceLedgerNode>;
  attempts?: Record<string, number>;
}
const looseText = (value: string): string => value.toLowerCase().replace(P.LEDGER_LOOSE.STRIP, "").replace(P.LEDGER_LOOSE.SPACES, " ").trim();
export const motionSourceLedgerPartIssues = (raw: any, segments: { id: string; t: number; text: string }[]): string[] => {
  const schema = motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS[RT_CORE.MOTION_STORY_LEDGER].anyOf![0]);
  if (schema.length) return schema.map((issue) => R.EXPECTED(issue.path, issue.expected, issue.actual));
  const ids = segments.map((segment) => segment.id);
  const issues: string[] = [];
  const reviewed = Array.isArray(raw?.reviewedSegments) ? raw.reviewedSegments : [];
  const missing = ids.filter((id) => !reviewed.includes(id));
  if (missing.length || reviewed.length !== ids.length) issues.push(P.LEDGER_ISSUE.SEGMENTS(missing));
  if (!Array.isArray(raw?.events) || !raw.events.length) issues.push(P.LEDGER_ISSUE.EVENTS_EMPTY);
  const loose = segments.map((segment) => looseText(segment.text));
  const seen = new Set<string>();
  for (const event of Array.isArray(raw?.events) ? raw.events : []) {
    const label = String(event?.id ?? "?");
    if (!event || typeof event.id !== "string" || !event.id.trim()) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.ID));
    else if (seen.has(event.id)) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.DUPLICATE));
    seen.add(String(event?.id));
    if (!(P.LEDGER_KINDS as readonly string[]).includes(event?.kind)) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.KIND));
    if (typeof event?.point !== "string" || !event.point.trim()) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.POINT));
    if (typeof event?.quote !== "string" || !event.quote.trim()) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.QUOTE_EMPTY));
    else if (!loose.some((text) => text.includes(looseText(event.quote)))) issues.push(P.LEDGER_ISSUE.EVENT(label, P.LEDGER_ISSUE.QUOTE(event.quote)));
  }
  return issues;
};
export const parseMotionSourceLedgerPart = (raw: any, segments: { id: string; t: number; text: string }[], partId: string): MotionSourceLedgerNode | undefined => {
  if (motionSourceLedgerPartIssues(raw, segments).length) return;
  const ids = segments.map((segment) => segment.id);
  const loose = segments.map((segment) => looseText(segment.text));
  const located = (raw.events as any[]).map((event) => {
    const quote = looseText(event.quote);
    const own = ids.indexOf(event.sourceId);
    const index = own >= 0 && loose[own].includes(quote) ? own : loose.findIndex((text) => text.includes(quote));
    return { event, index, offset: loose[index].indexOf(quote) };
  });
  located.sort((a, b) => a.index - b.index || a.offset - b.offset);
  const seen = new Set<string>(),
    facts: MotionSourceLedgerFact[] = [];
  for (const { event, index } of located) {
    const source = segments[index];
    const causes = Array.isArray(event.causes) ? [...new Set(event.causes as unknown[])].filter((id): id is string => typeof id === "string" && seen.has(id)) : [];
    facts.push({ id: partId + RT_SHARED.SYMBOL_E7AC07 + event.id, sourceId: source.id, t: source.t, kind: event.kind, point: event.point, quote: event.quote, causes: causes.map((id) => partId + RT_SHARED.SYMBOL_E7AC07 + id) });
    seen.add(event.id);
  }
  const boundary = (segment: (typeof segments)[number]) => {
    const sentences = segment.text.split(P.CHAPTER_SENTENCES).filter((text) => text.trim());
    return { sourceId: segment.id, t: segment.t, first: sentences[0] || segment.text, last: sentences.at(-1) || segment.text };
  };
  return { ids: [partId], text: facts.map((fact) => fact.id + RT_SHARED.SYMBOL_45822F + fact.point).join(P.SEPARATOR), facts, boundaries: [...new Set([segments[0], segments.at(-1)!])].map(boundary) };
};
export const compactMotionSourceLedger = async (parts: (string | MotionSourceLedgerNode)[], options: { draft: MotionSourceLedgerDraft; request: (prompt: string) => Promise<unknown>; key: (value: unknown) => string; checkpoint: () => void; signal?: AbortSignal; fallback?: () => void; totalChars?: number; map?: <T, R>(items: T[], worker: (item: T, index: number) => Promise<R>) => Promise<R[]> }): Promise<string> => {
  const initial = parts.map((part, index) => (typeof part === "string" ? { ids: [String(index + 1)], text: part } : part));
  const join = (nodes: MotionSourceLedgerNode[]) => nodes.map((node) => stringifyJson({ parts: node.ids, events: node.text, ...(node.facts?.length ? { facts: node.facts } : {}), ...(node.boundaries?.length ? { sourceBoundaries: node.boundaries } : {}) })).join(P.SEPARATOR);
  let nodes = initial;
  const totalChars = options.totalChars ?? P.LEDGER_TOTAL_CHARS;
  const factWeight = (fact: MotionSourceLedgerFact): number => (P.LEDGER_FACT_PRIORITY.test(fact.point) ? 1 : 0);
  const trimFacts = (items: MotionSourceLedgerNode[]): MotionSourceLedgerNode[] => {
    const budget = Math.floor(totalChars * P.LEDGER_FACTS_SHARE);
    let current = items;
    for (let round = 0; round < P.LEDGER_FACT_ROUNDS && join(current.map((node) => ({ ...node, text: "" }))).length > budget; round++) {
      current = current.map((node) => {
        const facts = node.facts || [];
        if (facts.length <= P.LEDGER_FACT_MIN) return node;
        const ranked = facts.map((fact, index) => ({ fact, index, weight: factWeight(fact) })).sort((a, b) => a.weight - b.weight || b.index - a.index);
        const drop = new Set(ranked.slice(0, Math.max(1, Math.floor(facts.length * P.LEDGER_FACT_DROP_SHARE))).map((entry) => entry.index));
        const kept = facts.filter((_fact, index) => !drop.has(index));
        const ids = new Set(kept.map((fact) => fact.id));
        return { ...node, facts: kept.map((fact) => ({ ...fact, causes: fact.causes.filter((id) => ids.has(id)) })) };
      });
    }
    return current;
  };
  while (join(nodes).length > totalChars) {
    options.signal?.throwIfAborted();
    if (join(nodes.map((node) => ({ ...node, text: "" }))).length > totalChars) {
      nodes = trimFacts(nodes);
      if (join(nodes.map((node) => ({ ...node, text: "" }))).length > totalChars) {
        options.fallback?.();
        return join(nodes);
      }
      if (join(nodes).length <= totalChars) break;
    }
    const groups = motionPromptGroups(nodes, (group) => P.LEDGER_COMPACT(group, P.LEDGER_SUMMARY_CHARS), 4);
    const limit = Math.min(P.LEDGER_SUMMARY_CHARS, Math.max(P.LEDGER_MIN_SUMMARY_CHARS, Math.floor(totalChars / groups.length) - 200));
    const reduce = async (group: MotionSourceLedgerNode[]): Promise<MotionSourceLedgerNode | undefined> => {
      const ids = group.flatMap((node) => node.ids);
      const facts = group.flatMap((node) => node.facts || []),
        boundaries = group.flatMap((node) => node.boundaries || []);
      const key = options.key([group, limit, P.LEDGER_COMPACT(group, limit)]);
      const saved = options.draft.nodes?.[key];
      const valid = (node: Partial<MotionSourceLedgerNode> | undefined): node is MotionSourceLedgerNode =>
        !!node && typeof node.text === "string" && !!node.text.trim() && node.text.length <= limit && Array.isArray(node.ids) && node.ids.length === ids.length && new Set(node.ids).size === ids.length && ids.every((id) => node.ids.includes(id)) && stringifyJson(node.facts || []) === stringifyJson(facts) && stringifyJson(node.boundaries || []) === stringifyJson(boundaries);
      if (valid(saved)) {
        return saved;
      }
      let accepted: MotionSourceLedgerNode | undefined;
      let diagnostics: unknown;
      while ((options.draft.attempts?.[key] || 0) < P.LEDGER_REPAIRS) {
        options.signal?.throwIfAborted();
        const prompt = P.LEDGER_COMPACT(group, limit);
        const raw = (await options.request(diagnostics ? motionResponseRepair(prompt, diagnostics) : prompt)) as { coveredParts?: string[]; summary?: string } | undefined;
        const candidate = { ids: raw?.coveredParts, text: raw?.summary, ...(facts.length ? { facts } : {}), ...(boundaries.length ? { boundaries } : {}) };
        if (valid(candidate)) {
          (options.draft.nodes ||= {})[key] = candidate;
          options.checkpoint();
          accepted = candidate;
          break;
        }
        diagnostics = { expectedIds: ids, summaryMaxCharacters: limit, issues: motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS[RT_CORE.MOTION_STORY_LEDGER].anyOf![1]), actual: R.VALUE(raw) };
        (options.draft.attempts ||= {})[key] = (options.draft.attempts?.[key] || 0) + 1;
        options.checkpoint();
      }
      if (!accepted) {
        return undefined;
      }
      return accepted;
    };
    const reduced = options.map
      ? await options.map(groups, reduce)
      : await (async () => {
          const rows = [];
          for (const group of groups) {
            const row = await reduce(group);
            rows.push(row);
            if (!row) break;
          }
          return rows;
        })();
    const next = reduced.flatMap((row, index) => (row ? [row] : groups[index]));
    if (join(next).length >= join(nodes).length) {
      nodes = trimFacts(nodes);
      options.fallback?.();
      return join(nodes);
    }
    nodes = next;
  }
  return join(nodes);
};
