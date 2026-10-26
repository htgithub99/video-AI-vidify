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
export const parseMotionSourceLedgerPart = (raw: any, segments: { id: string; t: number; text: string }[], partId: string): MotionSourceLedgerNode | undefined => {
  if (motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS["motion-story-ledger"].anyOf![0]).length) return;
  const ids = segments.map((segment) => segment.id);
  if (!Array.isArray(raw?.reviewedSegments) || raw.reviewedSegments.length !== ids.length || new Set(raw.reviewedSegments).size !== ids.length || !ids.every((id) => raw.reviewedSegments.includes(id)) || !Array.isArray(raw.events) || !raw.events.length) return;
  const seen = new Set<string>(),
    facts: MotionSourceLedgerFact[] = [];
  let lastSourceIndex = -1;
  for (const event of raw.events) {
    const index = ids.indexOf(event?.sourceId),
      source = segments[index];
    if (
      !event ||
      typeof event.id !== "string" ||
      !event.id.trim() ||
      seen.has(event.id) ||
      !source ||
      index < lastSourceIndex ||
      !(P.LEDGER_KINDS as readonly string[]).includes(event.kind) ||
      typeof event.point !== "string" ||
      !event.point.trim() ||
      typeof event.quote !== "string" ||
      !event.quote.trim() ||
      !source.text.includes(event.quote) ||
      !Array.isArray(event.causes) ||
      new Set(event.causes).size !== event.causes.length ||
      event.causes.some((id: unknown) => typeof id !== "string" || !seen.has(id))
    )
      return;
    facts.push({ id: partId + ":" + event.id, sourceId: source.id, t: source.t, kind: event.kind, point: event.point, quote: event.quote, causes: event.causes.map((id: string) => partId + ":" + id) });
    seen.add(event.id);
    lastSourceIndex = index;
  }
  const boundary = (segment: (typeof segments)[number]) => {
    const sentences = segment.text.split(P.CHAPTER_SENTENCES).filter((text) => text.trim());
    return { sourceId: segment.id, t: segment.t, first: sentences[0] || segment.text, last: sentences.at(-1) || segment.text };
  };
  return { ids: [partId], text: facts.map((fact) => fact.id + ": " + fact.point).join(P.SEPARATOR), facts, boundaries: [...new Set([segments[0], segments.at(-1)!])].map(boundary) };
};
export const compactMotionSourceLedger = async (parts: (string | MotionSourceLedgerNode)[], options: { draft: MotionSourceLedgerDraft; request: (prompt: string) => Promise<unknown>; key: (value: unknown) => string; checkpoint: () => void; signal?: AbortSignal; fallback?: () => void; map?: <T, R>(items: T[], worker: (item: T, index: number) => Promise<R>) => Promise<R[]> }): Promise<string> => {
  const initial = parts.map((part, index) => (typeof part === "string" ? { ids: [String(index + 1)], text: part } : part));
  const join = (nodes: MotionSourceLedgerNode[]) => nodes.map((node) => JSON.stringify({ parts: node.ids, events: node.text, ...(node.facts?.length ? { facts: node.facts } : {}), ...(node.boundaries?.length ? { sourceBoundaries: node.boundaries } : {}) })).join(P.SEPARATOR);
  let nodes = initial;
  while (join(nodes).length > P.LEDGER_TOTAL_CHARS) {
    options.signal?.throwIfAborted();
    if (join(nodes.map((node) => ({ ...node, text: "" }))).length > P.LEDGER_TOTAL_CHARS) {
      options.fallback?.();
      return join(nodes);
    }
    const groups = motionPromptGroups(nodes, (group) => P.LEDGER_COMPACT(group, P.LEDGER_SUMMARY_CHARS), 4);
    const limit = Math.min(P.LEDGER_SUMMARY_CHARS, Math.max(P.LEDGER_MIN_SUMMARY_CHARS, Math.floor(P.LEDGER_TOTAL_CHARS / groups.length) - 200));
    const reduce = async (group: MotionSourceLedgerNode[]): Promise<MotionSourceLedgerNode | undefined> => {
      const ids = group.flatMap((node) => node.ids);
      const facts = group.flatMap((node) => node.facts || []),
        boundaries = group.flatMap((node) => node.boundaries || []);
      const key = options.key([group, limit, P.LEDGER_COMPACT(group, limit)]);
      const saved = options.draft.nodes?.[key];
      const valid = (node: MotionSourceLedgerNode | undefined): node is MotionSourceLedgerNode =>
        !!node && typeof node.text === "string" && !!node.text.trim() && node.text.length <= limit && Array.isArray(node.ids) && node.ids.length === ids.length && new Set(node.ids).size === ids.length && ids.every((id) => node.ids.includes(id)) && JSON.stringify(node.facts || []) === JSON.stringify(facts) && JSON.stringify(node.boundaries || []) === JSON.stringify(boundaries);
      if (valid(saved)) {
        return saved;
      }
      let accepted: MotionSourceLedgerNode | undefined;
      let diagnostics: unknown;
      while ((options.draft.attempts?.[key] || 0) < P.LEDGER_REPAIRS) {
        options.signal?.throwIfAborted();
        const prompt = P.LEDGER_COMPACT(group, limit);
        const raw = (await options.request(diagnostics ? motionResponseRepair(prompt, diagnostics) : prompt)) as { coveredParts?: string[]; summary?: string } | undefined;
        const candidate = { ids: raw?.coveredParts!, text: raw?.summary!, ...(facts.length ? { facts } : {}), ...(boundaries.length ? { boundaries } : {}) };
        if (valid(candidate)) {
          (options.draft.nodes ||= {})[key] = candidate;
          options.checkpoint();
          accepted = candidate;
          break;
        }
        diagnostics = { expectedIds: ids, summaryMaxCharacters: limit, issues: motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS["motion-story-ledger"].anyOf![1]), actual: R.VALUE(raw) };
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
    if (reduced.some((row) => !row)) {
      options.fallback?.();
      return join(initial);
    }
    const next = reduced as MotionSourceLedgerNode[];
    if (join(next).length >= join(nodes).length) {
      options.fallback?.();
      return join(initial);
    }
    nodes = next;
  }
  return join(nodes);
};
