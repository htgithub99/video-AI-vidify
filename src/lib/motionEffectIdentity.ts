import { motionSemanticText } from "./motionResourceSemantics.js";
import type { MotionRemotionEffect, MotionSceneLayer } from "../types/motionVisual.js";
export const motionEffectKind = (layer: MotionSceneLayer): MotionSceneLayer["effectKind"] => {
  if (layer.effectKind) return layer.effectKind;
  const text = motionSemanticText([layer.id.replace(/[_-]/g, " "), layer.description].join(" "));
  if (/\b(?:highlight\w*|marker|emphasis|selection|vung nhan|danh dau)\b/.test(text)) return "highlight";
  if (/\b(?:rain\w*|mua)\b/.test(text)) return "rain";
  if (/\b(?:flam\w*|fire|flickering fire|lua)\b/.test(text)) return "flame";
  if (/\b(?:steam\w*|hoi nuoc)\b/.test(text)) return "steam";
  if (/\b(?:smok\w*|khoi)\b/.test(text)) return "smoke";
  if (/\b(?:fog\w*|mist\w*|suong)\b/.test(text)) return "fog";
  if (/\b(?:wind\w*|breeze|gio)\b/.test(text)) return "wind";
  if (/\b(?:water|river|ripple\w*|current\w*|song|nuoc)\b/.test(text)) return "water";
  return undefined;
};
export const motionEffectDeclaration = (layer: MotionSceneLayer, effects: MotionRemotionEffect[]) => {
  const exact = effects.find((effect) => effect.id === layer.id);
  if (exact) return exact;
  const kind = motionEffectKind(layer);
  const matches = effects.filter((effect) => (!kind || kind === effect.kind) && !!layer.sourceId && effect.source === layer.sourceId);
  return matches.length === 1 ? matches[0] : undefined;
};
