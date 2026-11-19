import fs from "node:fs";
import path from "node:path";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { MOTION_HTML_WRITING as W } from "../../../../constants/motionHtmlWriting.js";
interface Opening {
  at: number;
  genre: string;
  language: string;
  title: string;
  opening: string;
}
const file = () => path.join(getMotionRootDirectory(), W.OPENINGS.FILE);
const read = (): Opening[] => {
  try {
    const rows = JSON.parse(fs.readFileSync(file(), "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
};
export const motionRecentOpenings = (genre: string, language: string, title: string): string[] =>
  read()
    .filter((row) => row.genre === genre && row.language === language && row.title !== title && row.opening)
    .slice(-W.OPENINGS.SHOWN)
    .map((row) => row.opening);
export const recordMotionOpening = (genre: string, language: string, title: string, narration: string): void => {
  const opening = (narration.match(W.OPENINGS.FIRST_SENTENCE)?.[0] || narration).trim().slice(0, W.OPENINGS.MAX_CHARS);
  if (!opening || !title) return;
  try {
    const rows = [...read().filter((row) => !(row.title === title && row.genre === genre && row.language === language)), { at: Date.now(), genre, language, title, opening }].slice(-W.OPENINGS.KEPT);
    fs.writeFileSync(file(), JSON.stringify(rows, null, 1));
  } catch {}
};
