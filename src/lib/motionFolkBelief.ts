import _ from "lodash";
import { MOTION_FOLK_BELIEFS, MOTION_FOLK_BELIEF_MATCH as M } from "../constants/motionFolkBeliefs.js";
import type { MotionFolkBelief } from "../types/motionVideo.js";
const plain = (text: string): string => M.SPACE + String(text || M.EMPTY).normalize(M.NFC).toLowerCase().replace(M.SPACE_RE, M.SPACE) + M.SPACE;
const hits = (text: string, alias: string): number => text.split(M.SPACE + alias + M.SPACE).length - 1;
const strip = (entry: (typeof MOTION_FOLK_BELIEFS)[number]): MotionFolkBelief => _.omit(entry, [M.ALIASES]) as MotionFolkBelief;
export const findFolkBeliefs = (text: string): MotionFolkBelief[] => {
  const body = plain(text);
  const scored = _.filter(_.map(MOTION_FOLK_BELIEFS, (entry) => ({ entry, count: _.sumBy(entry.aliases, (alias) => hits(body, alias)) })), (x) => x.count >= M.MIN_HITS);
  return _.map(_.take(scored.sort((a, b) => b.count - a.count), M.MAX), (x) => strip(x.entry));
};
export const knownFolkBelief = (name: string): MotionFolkBelief | undefined => {
  const body = plain(name);
  const entry = _.find(MOTION_FOLK_BELIEFS, (item) => _.some(item.aliases, (alias) => hits(body, alias) > 0));
  return entry ? strip(entry) : undefined;
};
