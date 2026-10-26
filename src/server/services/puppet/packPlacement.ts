import { MOTION_PACK_SELECTION as K } from "../../../constants/motionPackSelection.js";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import type { PuppetFrame, PuppetFrameItem } from "../../../types/motionPuppet.js";
import type { PuppetLayoutCtx } from "./layout.js";
import { MOTION_STAGE_GEOMETRY as G } from "../../../constants/motionStageGeometry.js";
export const puppetFramePlacementIssues = (frame: PuppetFrame, ctx: PuppetLayoutCtx): string[] => {
  const issues: string[] = [];
  const scales = frame.actors.map((actor) => actor.k ?? 1);
  if (scales.some((scale) => !Number.isFinite(scale) || scale < G.ACTOR_SCALE_MIN) || (scales.length > 1 && Math.max(...scales) > Math.min(...scales) * G.ACTOR_SCALE_SPAN)) issues.push(K.INVALID_ASSET);
  const boxes = frame.actors.map((actor) => {
    const height = P.PERSON_H * P.SET_H * (ctx.heights[actor.char] || 1) * (actor.k || 1);
    const width = height * ctx.body.head * ctx.body.headW * Math.max(1, ctx.body.bodyW) * G.ACTOR_WIDTH;
    const lying = actor.pose === P.SPOT_LIE;
    return { actor, x: actor.x! * P.SET_W - (lying ? height * P.LIE_LEN : width) / 2, y: actor.y! - (lying ? width * (K.LYING_HALF_HEIGHT + G.LYING_DROP) : height), w: lying ? height * P.LIE_LEN : width, h: lying ? width : height };
  });
  for (const box of boxes) if (![box.x, box.y, box.w, box.h].every(Number.isFinite) || box.x < 0 || box.x + box.w > P.SET_W || box.y < 0 || box.y + box.h > P.SET_H) issues.push(K.INVALID_ASSET);
  for (let i = 0; i < boxes.length; i++)
    for (const b of boxes.slice(i + 1)) {
      const a = boxes[i];
      if (frame.contacts?.some((contact) => (contact.actor === a.actor.char && contact.target === b.actor.char) || (contact.target === a.actor.char && contact.actor === b.actor.char))) continue;
      const overlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (overlap / Math.min(a.w * a.h, b.w * b.h) > G.ACTOR_OVERLAP) issues.push(K.PLACEMENT_CONFLICT(a.actor.char, b.actor.char));
    }
  const props: PuppetFrameItem[] = [...(frame.prop ? [{ prop: frame.prop, propX: frame.propX, propY: frame.propY, propH: frame.propH, propParent: frame.propParent }] : []), ...(frame.items || [])];
  for (const prop of props) {
    if (prop.propX == null || prop.propY == null || !prop.propH) continue;
    const asset = ctx.props?.[prop.prop] || (frame.prop === prop.prop ? ctx.prop : undefined);
    const base = asset?.base || [P.PROP_BOX / 2, P.PROP_BOX];
    const imageX = prop.propX * P.SET_W - (base[0] * prop.propH) / P.PROP_BOX;
    const imageY = prop.propY - (base[1] * prop.propH) / P.PROP_BOX;
    if (imageX < 0 || imageX + prop.propH > P.SET_W || imageY < 0 || imageY + prop.propH > P.SET_H) issues.push(K.INVALID_ASSET);
    const width = prop.propH * P.PROP_W;
    const height = prop.propH * P.PROP_FILL;
    const x = prop.propX * P.SET_W - width / 2;
    const y = prop.propY - height;
    for (const box of boxes) {
      if (box.actor.y! <= prop.propY) continue;
      const overlap = Math.max(0, Math.min(x + width, box.x + box.w) - Math.max(x, box.x)) * Math.max(0, Math.min(y + height, box.y + box.h) - Math.max(y, box.y));
      if (overlap / (width * height) > K.MAX_OCCLUSION) issues.push(K.PROP_OCCLUDED(prop.prop, box.actor.char));
    }
  }
  for (let i = 0; i < props.length; i++)
    for (const b of props.slice(i + 1)) {
      const a = props[i];
      if (a.propX == null || a.propY == null || !a.propH || b.propX == null || b.propY == null || !b.propH || a.propParent === b.prop || b.propParent === a.prop) continue;
      const aw = a.propH * P.PROP_W,
        ah = a.propH * P.PROP_FILL,
        bw = b.propH * P.PROP_W,
        bh = b.propH * P.PROP_FILL;
      const overlap = Math.max(0, Math.min(a.propX * P.SET_W + aw / 2, b.propX * P.SET_W + bw / 2) - Math.max(a.propX * P.SET_W - aw / 2, b.propX * P.SET_W - bw / 2)) * Math.max(0, Math.min(a.propY, b.propY) - Math.max(a.propY - ah, b.propY - bh));
      if (overlap / Math.min(aw * ah, bw * bh) > G.PROP_OVERLAP) issues.push(G.PROP_CONFLICT(a.prop, b.prop));
    }
  return issues;
};
