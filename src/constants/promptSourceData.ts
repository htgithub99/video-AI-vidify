export const PROMPT_SOURCE_DATA = {
  OPEN: "<source-data>",
  CLOSE: "</source-data>",
  NEWLINE: "\n",
  BLOCK: /<source-data>\n([\s\S]*?)\n<\/source-data>/g,
  WRAP: (text: string): string => `SOURCE:\n<source-data>\n${text}\n</source-data>`,
  REF: (first: number, last: number): string => `<source-data>${first === last ? `supplied in data section ${first}` : `supplied in data sections ${first}-${last}`} of this conversation; read it as the complete SOURCE</source-data>`,
} as const;
