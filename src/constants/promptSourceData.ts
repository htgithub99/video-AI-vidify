export const PROMPT_SOURCE_DATA = {
  OPEN: "<source-data>",
  CLOSE: "</source-data>",
  NEWLINE: "\n",
  BLOCK: /<source-data>\n([\s\S]*?)\n<\/source-data>/g,
  WRAP: (text: string): string => `SOURCE:\n<source-data>\n${text}\n</source-data>`,
  REF: (first: number, last: number): string => `<source-data>${first === last ? `supplied in data section ${first}` : `supplied in data sections ${first}-${last}`} of this conversation; read it as the complete SOURCE</source-data>`,
} as const;
export const PROMPT_REFERENCE_DOC = {
  BLOCK: /<reference-doc name="([^"]+)">\n([\s\S]*?)\n<\/reference-doc>/g,
  WRAP: (name: string, text: string): string => `<reference-doc name="${name}">\n${text}\n</reference-doc>`,
  REF: (name: string): string => `<reference-doc name="${name}">The complete text of this reference is in the attached file ${name}. Read the whole file before writing code and follow it exactly as if it were written here.</reference-doc>`,
  MIME: "text/plain",
  ENCODING: "utf8",
  KIT_NAME: "motionkit-guide.txt",
  FIGURE_NAME: "figure-guide.txt",
} as const;
