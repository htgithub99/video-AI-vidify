export const MOTION_COMPOSITION_MOTION = {
  chestSuffixes: ["_breath", "_chest"],
  breathSeconds: 4.4,
  effectSeconds: 4.8,
  HEAD_PART: /(?:^|_)head(?:_|$)/i,
  CHEST_PART: /(?:^|_)(?:breath|chest|torso)(?:_|$)/i,
  BODY_PART: /(?:^|_)(?:head|neck|chest|breath|torso|arms?|hands?|shoulders?)(?:_|$)/i,
  ATTACHED_TO_CHEST: /(?:^|_)(?:head|neck|hand|arm)(?:_|$)/i,
  CONTACT_PART: /(?:^|_)(?:hand|arm|pelvis|hip|leg|foot|feet|knee|seat)(?:_|$)/i,
  ROTATE: /rotate\(\s*([-+]?\d*\.?\d+)((?:[\s,]+[-+]?\d*\.?\d+){0,2})\s*\)/g,
  BOOST_LOG: (scene: string, count: number): string => `Cảnh ${scene}: nâng biên độ ${count} chuyển động nhân vật lên mức tối thiểu của kiểu hình.`,
} as const;
