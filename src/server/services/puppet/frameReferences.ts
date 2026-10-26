import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../constants/motionVisualContract.js";
import { MOTION_PACK as K } from "../../../constants/motionPack.js";
import { puppetPackActive } from "./packPolicy.js";
import type { PuppetFrame, PuppetGen } from "../../../types/motionPuppet.js";
export const repairPuppetFrameReferences = <T extends PuppetFrame>(frame: T, gen: PuppetGen, key?: string, fallbackPlace?: string): T => {
  const read = key ? gen.reads?.[key] : undefined;
  const out = { ...frame, set: read?.place || frame.set || fallbackPlace };
  if (gen.pack || puppetPackActive()) {
    const characters = out.actors.map((actor) => actor.char).filter((key) => !gen.characters[key]);
    const props = [out.prop, ...(out.items || []).map((item) => item.prop), ...out.actors.flatMap((actor) => [actor.hold, ...(actor.wear || [])])].filter((key): key is string => !!key && !gen.props[key]);
    if (characters.length) throw new Error(K.MISSING(K.CAST, characters));
    if (props.length) throw new Error(K.MISSING(K.PROP, props));
  }
  if (out.set && !gen.sets[out.set]) throw new Error(V.FRAME_SET_MISSING(key || P.EMPTY, out.set));
  if (out.prop && !gen.props[out.prop]) {
    out.prop = null;
    if ((P.SHOT_PROP as readonly string[]).includes(out.shot)) out.shot = out.actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  }
  out.items = out.items?.filter((item) => !!gen.props[item.prop]);
  if (out.shot2) out.shot2 = repairPuppetFrameReferences(out.shot2, gen, key, fallbackPlace);
  return out;
};
