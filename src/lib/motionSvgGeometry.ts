/** Lightweight static SVG geometry (no browser): affine transforms, ancestry and canvas-space boxes per id. */
export type SvgBox = { minX: number; minY: number; maxX: number; maxY: number };
export type SvgMatrix = [number, number, number, number, number, number];
export interface SvgGeometry {
  /** id → ids of its ancestors that carry an id (outermost first). */
  ancestors: Map<string, string[]>;
  /** id → bounding box of its drawn shapes and descendants, in canvas units. */
  boxes: Map<string, SvgBox>;
}
const IDENTITY: SvgMatrix = [1, 0, 0, 1, 0, 0];
const NON_RENDERED = new Set(["defs", "clipPath", "mask", "symbol", "pattern", "linearGradient", "radialGradient", "filter", "marker"]);
const multiply = (m: SvgMatrix, n: SvgMatrix): SvgMatrix => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m: SvgMatrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const nums = (value: string): number[] => (value.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || []).map(Number);
export const parseSvgTransform = (value?: string): SvgMatrix => {
  let m = IDENTITY;
  for (const [, name, args] of (value || "").matchAll(/(translate|scale|rotate|matrix|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const a = nums(args);
    let next: SvgMatrix = IDENTITY;
    if (name === "translate") next = [1, 0, 0, 1, a[0] || 0, a[1] || 0];
    else if (name === "scale") next = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (name === "matrix" && a.length >= 6) next = a.slice(0, 6) as SvgMatrix;
    else if (name === "rotate") {
      const r = ((a[0] || 0) * Math.PI) / 180;
      const [c, s, cx, cy] = [Math.cos(r), Math.sin(r), a[1] || 0, a[2] || 0];
      next = multiply(multiply([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    } else if (name === "skewX") next = [1, 0, Math.tan(((a[0] || 0) * Math.PI) / 180), 1, 0, 0];
    else if (name === "skewY") next = [1, Math.tan(((a[0] || 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = multiply(m, next);
  }
  return m;
};
const ARITY: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };
/** End and control points of a path in user units, following relative commands. */
export const svgPathPoints = (d: string): [number, number][] => {
  const points: [number, number][] = [];
  let [x, y, sx, sy] = [0, 0, 0, 0];
  for (const [, command, args] of d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g)) {
    const upper = command.toUpperCase();
    const relative = command !== upper;
    if (upper === "Z") {
      [x, y] = [sx, sy];
      continue;
    }
    const a = nums(args);
    const size = ARITY[upper];
    for (let i = 0; size && i + size <= a.length; i += size) {
      const chunk = a.slice(i, i + size);
      const [bx, by] = relative ? [x, y] : [0, 0];
      if (upper === "H") x = bx + chunk[0];
      else if (upper === "V") y = by + chunk[0];
      else if (upper === "A") [x, y] = [bx + chunk[5], by + chunk[6]];
      else {
        for (let k = 0; k + 3 < chunk.length; k += 2) points.push([bx + chunk[k], by + chunk[k + 1]]);
        [x, y] = [bx + chunk[size - 2], by + chunk[size - 1]];
      }
      points.push([x, y]);
      if (upper === "M" && i === 0) [sx, sy] = [x, y];
    }
  }
  return points;
};
const attr = (tag: string, name: string): string | undefined => {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
  return match ? (match[1] ?? match[2]) : undefined;
};
const num = (tag: string, name: string) => {
  const value = Number(attr(tag, name));
  return Number.isFinite(value) ? value : 0;
};
const shapePoints = (name: string, tag: string): [number, number][] => {
  if (name === "rect" || name === "image" || name === "use") {
    const [x, y, w, h] = [num(tag, "x"), num(tag, "y"), num(tag, "width"), num(tag, "height")];
    return w > 0 && h > 0 ? [[x, y], [x + w, y + h]] : [];
  }
  if (name === "circle" || name === "ellipse") {
    const [cx, cy] = [num(tag, "cx"), num(tag, "cy")];
    const [rx, ry] = name === "circle" ? [num(tag, "r"), num(tag, "r")] : [num(tag, "rx"), num(tag, "ry")];
    return rx > 0 && ry > 0 ? [[cx - rx, cy - ry], [cx + rx, cy + ry], [cx - rx, cy + ry], [cx + rx, cy - ry]] : [];
  }
  if (name === "line") return [[num(tag, "x1"), num(tag, "y1")], [num(tag, "x2"), num(tag, "y2")]];
  if (name === "polygon" || name === "polyline") {
    const p = nums(attr(tag, "points") || "");
    const out: [number, number][] = [];
    for (let i = 0; i + 1 < p.length; i += 2) out.push([p[i], p[i + 1]]);
    return out;
  }
  return name === "path" ? svgPathPoints(attr(tag, "d") || "") : [];
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
    if (name === "svg" && !stack.length) {
      stack.push({ matrix: IDENTITY, tag: name });
      continue;
    }
    const id = attr(whole, "id");
    const matrix = multiply(stack.at(-1)?.matrix || IDENTITY, parseSvgTransform(attr(whole, "transform")));
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
/** True when `target` is `id` or one of its descendants. */
export const svgWithin = (geometry: SvgGeometry, id: string, target: string): boolean => target === id || !!geometry.ancestors.get(target)?.includes(id);

