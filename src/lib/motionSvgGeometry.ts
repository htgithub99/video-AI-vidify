import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
export type SvgBox = { minX: number; minY: number; maxX: number; maxY: number };
export type SvgMatrix = [number, number, number, number, number, number];
export interface SvgGeometry {
  ancestors: Map<string, string[]>;
  boxes: Map<string, SvgBox>;
}
const IDENTITY: SvgMatrix = [1, 0, 0, 1, 0, 0];
const NON_RENDERED = new Set<string>([RT_MAINTENANCE.DEFS, RT_MAINTENANCE.CLIPPATH, RT_MAINTENANCE.MASK, RT_MAINTENANCE.SVG_SYMBOL_TAG, RT_MAINTENANCE.PATTERN, RT_MAINTENANCE.LINEARGRADIENT, RT_MAINTENANCE.RADIALGRADIENT, RT_MAINTENANCE.FILTER, RT_MAINTENANCE.MARKER]);
const multiply = (m: SvgMatrix, n: SvgMatrix): SvgMatrix => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m: SvgMatrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const nums = (value: string): number[] => (value.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
export const parseSvgTransform = (value?: string): SvgMatrix => {
  let m = IDENTITY;
  for (const [, name, args] of (value || "").matchAll(/(translate|scale|rotate|matrix|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const a = nums(args);
    let next: SvgMatrix = IDENTITY;
    if (name === RT_MAINTENANCE.TRANSLATE_3) next = [1, 0, 0, 1, a[0] || 0, a[1] || 0];
    else if (name === RT_MAINTENANCE.SCALE_2) next = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (name === RT_MAINTENANCE.MATRIX && a.length >= 6) next = a.slice(0, 6) as SvgMatrix;
    else if (name === RT_MAINTENANCE.ROTATE_2) {
      const r = ((a[0] || 0) * Math.PI) / 180;
      const [c, s, cx, cy] = [Math.cos(r), Math.sin(r), a[1] || 0, a[2] || 0];
      next = multiply(multiply([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    } else if (name === RT_MAINTENANCE.SKEWX) next = [1, 0, Math.tan(((a[0] || 0) * Math.PI) / 180), 1, 0, 0];
    else if (name === RT_MAINTENANCE.SKEWY) next = [1, Math.tan(((a[0] || 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = multiply(m, next);
  }
  return m;
};
const ARITY: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
export const svgPathPoints = (d: string): [number, number][] => {
  const points: [number, number][] = [];
  let [x, y, sx, sy] = [0, 0, 0, 0];
  for (const [, command, args] of d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g)) {
    const upper = command.toUpperCase();
    const relative = command !== upper;
    if (upper === RT_MAINTENANCE.Z) {
      [x, y] = [sx, sy];
      continue;
    }
    const a = nums(args);
    const size = ARITY[upper];
    for (let i = 0; size && i + size <= a.length; i += size) {
      const chunk = a.slice(i, i + size);
      const [bx, by] = relative ? [x, y] : [0, 0];
      if (upper === RT_MAINTENANCE.H_2) x = bx + chunk[0];
      else if (upper === RT_MAINTENANCE.V) y = by + chunk[0];
      else if (upper === RT_MAINTENANCE.A) [x, y] = [bx + chunk[5], by + chunk[6]];
      else {
        for (let k = 0; k + 3 < chunk.length; k += 2) points.push([bx + chunk[k], by + chunk[k + 1]]);
        [x, y] = [bx + chunk[size - 2], by + chunk[size - 1]];
      }
      points.push([x, y]);
      if (upper === RT_MAINTENANCE.M && i === 0) [sx, sy] = [x, y];
    }
  }
  return points;
};
const attr = (tag: string, name: string): string | undefined => {
  const match = tag.match(new RegExp(`${RT_MAINTENANCE.S}${name}${RT_MAINTENANCE.S_S}`));
  return match ? (match[1] ?? match[2]) : undefined;
};
const num = (tag: string, name: string) => {
  const value = Number(attr(tag, name));
  return Number.isFinite(value) ? value : 0;
};
const shapePoints = (name: string, tag: string): [number, number][] => {
  if (name === RT_MAINTENANCE.RECT || name === RT_MAINTENANCE.IMAGE || name === RT_MAINTENANCE.USE) {
    const [x, y, w, h] = [num(tag, RT_MAINTENANCE.X), num(tag, RT_MAINTENANCE.Y_2), num(tag, RT_MAINTENANCE.WIDTH_2), num(tag, RT_MAINTENANCE.HEIGHT_2)];
    return w > 0 && h > 0
      ? [
          [x, y],
          [x + w, y + h],
        ]
      : [];
  }
  if (name === RT_MAINTENANCE.CIRCLE || name === RT_MAINTENANCE.ELLIPSE) {
    const [cx, cy] = [num(tag, RT_MAINTENANCE.CX), num(tag, RT_MAINTENANCE.CY_2)];
    const [rx, ry] = name === RT_MAINTENANCE.CIRCLE ? [num(tag, RT_MAINTENANCE.R_2), num(tag, RT_MAINTENANCE.R_2)] : [num(tag, RT_MAINTENANCE.RX), num(tag, RT_MAINTENANCE.RY)];
    return rx > 0 && ry > 0
      ? [
          [cx - rx, cy - ry],
          [cx + rx, cy + ry],
          [cx - rx, cy + ry],
          [cx + rx, cy - ry],
        ]
      : [];
  }
  if (name === RT_MAINTENANCE.LINE)
    return [
      [num(tag, RT_MAINTENANCE.X1), num(tag, RT_MAINTENANCE.Y1)],
      [num(tag, RT_MAINTENANCE.X2), num(tag, RT_MAINTENANCE.Y2)],
    ];
  if (name === RT_MAINTENANCE.POLYGON || name === RT_MAINTENANCE.POLYLINE) {
    const p = nums(attr(tag, RT_MAINTENANCE.POINTS) || "");
    const out: [number, number][] = [];
    for (let i = 0; i + 1 < p.length; i += 2) out.push([p[i], p[i + 1]]);
    return out;
  }
  return name === RT_MAINTENANCE.PATH ? svgPathPoints(attr(tag, RT_MAINTENANCE.D) || "") : [];
};
export const svgGeometry = (svg: string): SvgGeometry => {
  const ancestors = new Map<string, string[]>();
  const boxes = new Map<string, SvgBox>();
  const stack: { id?: string; matrix: SvgMatrix; tag: string }[] = [];
  for (const match of svg.matchAll(/<(\/?)([\w:-]+)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const [whole, closing, name, , selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    if (name === RT_MAINTENANCE.SVG_2 && !stack.length) {
      stack.push({ matrix: IDENTITY, tag: name });
      continue;
    }
    const id = attr(whole, RT_MAINTENANCE.ID);
    const matrix = multiply(stack.at(-1)?.matrix || IDENTITY, parseSvgTransform(attr(whole, RT_MAINTENANCE.TRANSFORM_3)));
    const owners = stack.flatMap((entry) => (entry.id ? [entry.id] : []));
    if (id) ancestors.set(id, owners);
    if (!stack.some((entry) => NON_RENDERED.has(entry.tag)) && !NON_RENDERED.has(name)) {
      const points = shapePoints(name, whole).map(([px, py]) => apply(matrix, px, py));
      for (const owner of points.length ? [...owners, ...(id ? [id] : [])] : []) {
        const box = boxes.get(owner) || { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
        for (const [px, py] of points) {
          box.minX = Math.min(box.minX, px);
          box.minY = Math.min(box.minY, py);
          box.maxX = Math.max(box.maxX, px);
          box.maxY = Math.max(box.maxY, py);
        }
        boxes.set(owner, box);
      }
    }
    if (!selfClosing) stack.push({ id, matrix, tag: name });
  }
  return { ancestors, boxes };
};
export const svgWithin = (geometry: SvgGeometry, id: string, target: string): boolean => target === id || !!geometry.ancestors.get(target)?.includes(id);
