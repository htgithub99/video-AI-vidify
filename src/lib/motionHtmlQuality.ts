import { MOTION_HTML_QUALITY as Q } from "../constants/motionHtmlQuality.js";
interface MotionHtmlRequired {
  id: string;
  focal: boolean;
}
export const motionHtmlMarkId = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
export const motionHtmlRequired = (template: string | undefined): MotionHtmlRequired[] => {
  const line = template?.match(Q.REQUIRED_LINE)?.[1];
  if (!line) return [];
  const items = line
    .split(Q.REQUIRED_SEP)
    .map((part) => part.match(Q.REQUIRED_ITEM))
    .filter((match): match is RegExpMatchArray => !!match && !!motionHtmlMarkId(match[1]))
    .map((match) => ({ id: motionHtmlMarkId(match[1]), focal: match[2]?.toLowerCase() === Q.FOCAL }));
  const unique = items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index);
  if (unique.length && !unique.some((item) => item.focal)) unique[0].focal = true;
  return unique;
};
