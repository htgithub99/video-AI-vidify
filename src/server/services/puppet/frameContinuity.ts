import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { puppetSupportCompatible } from "../../../lib/motionPlacement.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { PuppetFrame, PuppetFrameActor, PuppetRead, PuppetSpot } from "../../../types/motionPuppet.js";
import { fitPuppetRead } from "./director.js";
export const normalizePuppetFrameContinuity = (lines: PuppetLine[], frames: Record<string, PuppetFrame>, reads: Record<string, PuppetRead>, spots: (place?: string, light?: string) => PuppetSpot[]): Record<string, PuppetFrame> => {
  const output = { ...frames };
  const previous = new Map<string, PuppetFrameActor>();
  let scope: string = P.EMPTY;
  for (const line of lines) {
    const frame = output[line.key],
      read = reads[line.key];
    if (!frame || !read) {
      previous.clear();
      continue;
    }
    const place = read.place || frame.set || line.place;
    const current = read.visual ? [read.visual.timeline, read.visual.scene].join(P.SEP) : [line.chapterId, place, read.light, read.overlays.includes(P.FLASHBACK)].join(P.SEP);
    if (scope !== current) previous.clear();
    const actors = frame.actors.map((actor) => {
      const before = previous.get(actor.char);
      const state = read.states?.find((s) => s.char === actor.char);
      const compatible = before && !state?.transition && (P.POSE_KIND[before.pose] || P.SPOT_STAND) === (P.POSE_KIND[actor.pose] || P.SPOT_STAND) && !(P.TRAVEL_ACTIONS as readonly string[]).includes(state?.action || actor.pose) && ((!before.support && !actor.support) || (!!before.support && !!actor.support && puppetSupportCompatible(actor.support, before.support, true)));
      const validSpot = before?.spot && spots(place, frame.light || read.light).some((spot) => spot.key === before.spot);
      return compatible && validSpot ? { ...actor, spot: before.spot, x: before.x } : actor;
    });
    const stable = fitPuppetRead({ ...frame, actors }, read, spots(place, frame.light || read.light));
    output[line.key] = stable;
    for (const actor of (stable.shot2 || stable).actors) previous.set(actor.char, actor);
    scope = current;
  }
  return output;
};
