import _ from "lodash";
import { MOTION_2D as C } from "../constants/motion2d.js";
import type { MotionCastMember } from "../types/motionVideo.js";

const speciesIn = (text: string): string | null => _.find(C.SPECIES, ([, re]) => re.test(text))?.[0] || null;

export const motion2dSpecies = (c: Pick<MotionCastMember, "type" | "name" | "role"> & { look?: string; description?: string }): string | null => {
  const typed = C.SPECIES_TYPE[String(c.type || C.EMPTY)];
  const head = [c.name, c.role].join(C.SPACE).normalize(C.NFC);
  if (typed) return speciesIn(head + C.SPACE + (c.look || C.EMPTY)) || typed;
  if (C.SPECIES_NAME_RE.test(String(c.name || C.EMPTY).normalize(C.NFC))) return speciesIn(String(c.name));
  if (C.SPECIES_ROLE_RE.test(String(c.role || C.EMPTY))) return speciesIn(String(c.role)) || null;
  return null;
};

export const motion2dObjectSpecies = (key: string): string | null => speciesIn(_.last(String(key || C.EMPTY).split(C.UNDERSCORE_RE)) || C.EMPTY);
