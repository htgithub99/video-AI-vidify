export const MUSIC_CREATOR_RUNTIME = { EMPTY: "", ABORT_ERROR_NAME: "AbortError", SEO_SECTION_SEPARATOR: "\n\n", SEO_OPTION_SEPARATOR: "\n----------------------------------------\n\n", MUSIC_PLAN_STAGE: "music-plan", SEO_TRACKLIST_HEADING: "DANH SÁCH CA KHÚC:", DEFAULT_PLAYLIST_NAME: "Playlist" } as const;
export const MUSIC_CREATOR_REGEXES = { TIMESTAMP_LINE: /^(\s*(?:\d{1,2}:)?\d{1,2}:\d{2})\s+\S.*$/, NUMBERED_LINE: /^\s*\d+[.)]\s+/, EMOJI: /\p{Extended_Pictographic}/gu, EMOJI_PREFIX: /^\s*\p{Extended_Pictographic}\uFE0F?\s+/u } as const;
export const MUSIC_CREATOR_FORMAT = {
  JOIN_WITH_SPACE: (first: unknown, second: unknown): string => `${first} ${second}`,
  TRACKLIST: (heading: unknown, lines: unknown, suffix: unknown): string => `${heading}\n${lines}${suffix}`,
  PARAGRAPH: (value: unknown): string => `\n\n${value}`,
  UTF8_BOM: (value: unknown): string => `\uFEFF${value}`,
  PERCENTAGE: (value: unknown): string => `${value}%`,
} as const;
