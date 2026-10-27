import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
export const motionVectorCutoutIssue = (svg: string): string | undefined => {
  const box = svg
    .match(/\bviewBox\s*=\s*["']\s*([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)[\s,]+([-+\deE.]+)\s*["']/i)
    ?.slice(1)
    .map(Number);
  if (!box) return undefined;
  const root = svg.match(/^<svg\b([^>]*)>/)?.[1] || "";
  if (/\b(?:style|opacity|fill-opacity|transform|clip-path|mask|visibility|display)\s*=/.test(root)) return undefined;
  const inheritedFill = root.match(/\bfill\s*=\s*(["'])(.*?)\1/)?.[2];
  const stack: string[] = [];
  for (const match of svg.matchAll(/<(\/?)([\w:-]+)\b([^<>]*?)(\/?)>/g)) {
    const [, closing, name, attributes, selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    if (name === "rect" && stack.length === 1 && stack[0] === "svg") {
      const attrs = Object.fromEntries([...attributes.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((attr) => [attr[1], attr[3]]));
      const length = (value: string | undefined, full: number, fallback: number) => (value === undefined ? fallback : value.endsWith("%") ? (Number.parseFloat(value) * full) / 100 : Number(value.replace(/px$/, "")));
      const fill = attrs.fill || inheritedFill || "black";
      if (
        !attrs.transform &&
        !attrs.style &&
        !attrs["clip-path"] &&
        !attrs.mask &&
        !attrs.visibility &&
        !attrs.display &&
        !Number(attrs.rx || 0) &&
        !Number(attrs.ry || 0) &&
        Number(attrs.opacity ?? 1) >= V.CUTOUT.OPAQUE_RATIO &&
        Number(attrs["fill-opacity"] ?? 1) >= V.CUTOUT.OPAQUE_RATIO &&
        !/^(?:none|transparent|inherit|url\(|rgba\(|hsla\()/i.test(fill) &&
        !/^#[\da-f]{4}(?:[\da-f]{4})?$/i.test(fill)
      ) {
        const x = length(attrs.x, box[2], 0),
          y = length(attrs.y, box[3], 0);
        if (x <= box[0] && y <= box[1] && x + length(attrs.width, box[2], 0) >= box[0] + box[2] && y + length(attrs.height, box[3], 0) >= box[1] + box[3]) return V.CUTOUT.BACKDROP;
      }
    }
    if (!selfClosing) stack.push(name);
  }
  return undefined;
};
