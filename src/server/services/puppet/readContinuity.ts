import { puppetSupportTokens } from "../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { PuppetActorState, PuppetRead } from "../../../types/motionPuppet.js";
import { puppetStatePose } from "./layout.js";
export const normalizePuppetReadContinuity = (lines: PuppetLine[], reads: Record<string, PuppetRead>): Record<string, PuppetRead> => {
  const aliases = new Map<string, Map<string, string>>();
  for (const read of Object.values(reads)) {
    const place = read.place || P.EMPTY;
    const names = aliases.get(place) || new Map<string, string>();
    for (const object of _.compact([read.object, ...(read.objects || [])])) {
      if (!_.includes(P.FEATURE_OBJECT_TYPES, object.type)) continue;
      names.set(_.snakeCase(object.word), object.key);
      names.set(object.key, object.key);
    }
    aliases.set(place, names);
  }
  const output = { ...reads };
  let scope: string = P.EMPTY;
  let previous = new Map<string, PuppetActorState>();
  const tokens = (support: string) => puppetSupportTokens(support).filter((token) => !_.includes(P.FEATURE_RELATIONS, token));
  for (const line of lines) {
    const read = reads[line.key];
    if (!read) {
      previous.clear();
      continue;
    }
    const place = read.place || line.place || P.EMPTY;
    const current = [line.chapterId, place, read.overlays.includes(P.FLASHBACK), read.light].join(P.SEP);
    if (current !== scope) previous = new Map();
    scope = current;
    const states = (read.states || []).map((state) => {
      const support = state.support ? aliases.get(place)?.get(state.support) || state.support : undefined;
      const before = previous.get(state.char);
      const compatible = !support || (!!before?.support && _.intersection(tokens(support), tokens(before.support)).length > 0);
      const physical = P.POSTURE_ACTIONS[state.action];
      const posture = physical || state.posture || (before && compatible && _.includes(P.SEATED_ACTIONS, state.action) && _.includes(P.LOW_POSES, puppetStatePose(before)) ? puppetStatePose(before) : undefined);
      const next = { ...state, support: support || (posture && before && compatible && _.includes(P.SEATED_ACTIONS, state.action) ? before.support : undefined), ...(posture ? { posture } : {}) };
      previous.set(state.char, next);
      return next;
    });
    output[line.key] = { ...read, states };
  }
  return output;
};
