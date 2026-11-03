export const MOTION_CONTINUITY = {
  LOST: /(?<![\p{L}])(?:dies|died|dead|killed|slain|falls dead|crumpl\w*|lifeless|motionless|never (?:rises|moves) again|chết|tử trận|thiệt mạng|tắt thở|không cử động nữa)(?![\p{L}])/iu,
  NAME_MIN: 3,
  LOST_WINDOW: 80,
  NAME_WORD: /[\p{L}'’-]+/gu,
  HINDSIGHT: "hindsight",
  NONE: "-",
  LEDGER: (at: string, cast: string, motifs: string, told: string): string => `CONTINUITY SO FAR (kept by the application; continue from this state): at ${at} | cast ${cast} | motifs ${motifs} | events already told: ${told}. Never retell a told event; a lost person returns only as a memory.`,
  MEMBER: (name: string, first: string, last: string, lost?: string): string => `${name} (${first}${first === last ? "" : "–" + last}${lost ? `, lost in ${lost}` : ""})`,
  MOTIF: (motif: string, uses: number): string => `"${motif}" ×${uses}`,
  ISSUE: (name: string, chapter: string): string => `${name} was lost in ${chapter}; here they act or speak again as if alive. Make it a memory (marked as remembered) or replace them with someone present`,
} as const;
