import { puppetSupportCompatible } from "../../../lib/motionPlacement.js";
import { canonicalPuppetReadObjects, puppetReadObjects } from "../../../lib/motionReadObjects.js";
import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { PuppetActorState, PuppetBlocking, PuppetRead } from "../../../types/motionPuppet.js";
import { puppetStatePose } from "./layout.js";
export const normalizePuppetReadContinuity = (lines: PuppetLine[], reads: Record<string, PuppetRead>): Record<string, PuppetRead> => {
  const aliases = new Map<string, Map<string, string>>();
  for (const read of Object.values(reads)) {
    const place = read.place || P.EMPTY;
    const names = aliases.get(place) || new Map<string, string>();
    for (const object of puppetReadObjects(read)) {
      if (!_.includes(P.FEATURE_OBJECT_TYPES, object.type)) continue;
      names.set(_.snakeCase(object.word), object.key);
      names.set(object.key, object.key);
    }
    aliases.set(place, names);
  }
  const output = { ...reads };
  let scope: string = P.EMPTY;
  let lastLight: string | null | undefined;
  let lastBlocking: PuppetBlocking | undefined;
  let previous = new Map<string, PuppetActorState>();
  for (const line of lines) {
    const read = reads[line.key] && canonicalPuppetReadObjects(reads[line.key]);
    if (!read) {
      previous.clear();
      lastBlocking = undefined;
      continue;
    }
    const place = read.place || line.place || P.EMPTY;
    const base = read.visual ? [read.visual.timeline, place].join(P.SEP) : [line.chapterId, place, read.overlays.includes(P.FLASHBACK)].join(P.SEP);
    if (read.visual ? scope !== base : !scope.startsWith(base + P.SEP)) lastLight = undefined;
    const light = read.light || lastLight;
    const current = read.visual ? base : [base, light].join(P.SEP);
    if (current !== scope) {
      previous = new Map();
      lastBlocking = undefined;
    }
    lastLight = light;
    scope = current;
    const supplied = read.states || [];
    const visible = [...supplied, ...read.who.filter((char) => !supplied.some((state) => state.char === char) && previous.has(char)).map((char) => ({ ...previous.get(char)!, action: P.ACTION_DEFAULT, transition: false }))];
    const states = visible.map((state) => {
      const moving = _.includes(P.TRAVEL_ACTIONS, state.action);
      const support = !moving && state.support ? aliases.get(place)?.get(state.support) || state.support : undefined;
      const before = previous.get(state.char);
      const compatible = !support || (!!before?.support && puppetSupportCompatible(support, before.support, true));
      const physicalAction = state.posture && state.posture !== P.POSE_DEFAULT ? state.posture : before && state.posture === P.POSE_DEFAULT && state.transition === false && state.action === P.ACTION_DEFAULT ? undefined : P.POSTURE_ACTIONS[state.action];
      const explicitChange = !!before && !!physicalAction && physicalAction !== puppetStatePose(before);
      const unchanged = before && compatible && state.transition === false && !moving && !explicitChange;
      const physical = unchanged ? (_.includes(P.LOW_POSES, puppetStatePose(before)) ? puppetStatePose(before) : P.POSE_DEFAULT) : state.posture && state.posture !== P.POSE_DEFAULT ? state.posture : P.POSTURE_ACTIONS[state.action];
      const posture = moving ? P.POSE_DEFAULT : physical || (state.posture !== P.POSE_DEFAULT ? state.posture : undefined) || (before && compatible && _.includes(P.SEATED_ACTIONS, state.action) && _.includes(P.LOW_POSES, puppetStatePose(before)) ? puppetStatePose(before) : state.posture);
      const placement = state.placement || (unchanged && before.placement?.targets?.every((char) => read.who.includes(char)) ? before.placement : undefined);
      const next = { ...state, eyes: state.eyes || before?.eyes, placement, transition: state.transition || moving || explicitChange, support: support || (!moving && !explicitChange && posture && before && compatible && (unchanged || _.includes(P.SEATED_ACTIONS, state.action)) ? before.support : undefined), ...(posture ? { posture } : {}) };
      previous.set(state.char, next);
      return next;
    });
    const blocking = read.blocking || (lastBlocking && !states.some((state) => state.transition) && Object.values(lastBlocking.roles).every((char) => read.who.includes(char)) ? lastBlocking : undefined);
    if (read.blocking) lastBlocking = read.blocking;
    else if (states.some((state) => state.transition)) lastBlocking = undefined;
    output[line.key] = { ...read, light, blocking, states };
  }
  return output;
};
