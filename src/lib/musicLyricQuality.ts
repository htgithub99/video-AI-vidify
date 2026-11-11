import { MUSIC_LYRIC_QUALITY as Q } from "../constants/musicPlanning.js";
const words = (text: string): string[] => (String(text || "").toLowerCase().normalize("NFC").match(Q.WORD_RE) || []) as string[];
const grams = (list: string[]): Set<string> => {
  const out = new Set<string>();
  for (let i = 0; i + Q.NGRAM_WORDS <= list.length; i++) out.add(list.slice(i, i + Q.NGRAM_WORDS).join(" "));
  return out;
};
export const musicLyricQualityIssues = (songs: any[], referenceSource: string): string[] => {
  const reference = grams(words(referenceSource));
  const issues: string[] = [];
  songs.forEach((song, index) => {
    const label = `song ${index + 1}`;
    const lyrics = String(song?.lyrics || "");
    const body = lyrics.replace(/\[[^\]]*\]/g, " ");
    const jargon = body.match(Q.PRODUCTION_TERMS_RE);
    if (jargon) issues.push(Q.JARGON(label, jargon[0]));
    const direction = body.match(Q.STAGE_DIRECTION_RE);
    if (direction) issues.push(Q.DIRECTION(label, direction[1].trim().slice(0, 60)));
    if (reference.size) {
      const copied = [...grams(words(body))].find((gram) => reference.has(gram));
      if (copied) issues.push(Q.COPIED(label, copied));
    }
  });
  return issues;
};
