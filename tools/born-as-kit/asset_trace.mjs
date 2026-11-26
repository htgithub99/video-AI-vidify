import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from "@neplex/vectorizer";
import fs from "fs";
const [inp, out] = process.argv.slice(2);
const svg = await vectorize(fs.readFileSync(inp), { colorMode: ColorMode.Color, colorPrecision: 7, filterSpeckle: 6, spliceThreshold: 45, cornerThreshold: 60, hierarchical: Hierarchical.Stacked, mode: PathSimplifyMode.Spline, layerDifference: 8, lengthThreshold: 4, maxIterations: 2, pathPrecision: 1 });
const W = +svg.match(/width="(\d+)"/)[1], H = +svg.match(/height="(\d+)"/)[1];
const paths = svg.match(/<path[^>]*\/>/g) || [];
const near = (c) => { const m = c.match(/#([0-9a-f]{6})/i); if (!m) return false; const v = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)); return Math.min(...v) > 200 && Math.max(...v) - Math.min(...v) < 40; };
let kept = [], minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
for (const p of paths) {
  const fill = (p.match(/fill="([^"]+)"/) || [])[1] || "";
  const tr = p.match(/translate\(([-\d.]+),([-\d.]+)\)/);
  const dm = p.match(/d="([^"]+)"/); if (!dm) continue;
  const nums = (dm[1].match(/-?[\d.]+/g) || []).map(Number);
  const ox = tr ? +tr[1] : 0, oy = tr ? +tr[2] : 0;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < nums.length; i += 2) { x0 = Math.min(x0, nums[i] + ox); x1 = Math.max(x1, nums[i] + ox); y0 = Math.min(y0, nums[i + 1] + oy); y1 = Math.max(y1, nums[i + 1] + oy); }
  const touchesEdge = x0 <= 2 || y0 <= 2 || x1 >= W - 2 || y1 >= H - 2;
  if (near(fill) && (touchesEdge || (x1 - x0) * (y1 - y0) < 0.004 * W * H)) continue;
  kept.push(p); minx = Math.min(minx, x0); miny = Math.min(miny, y0); maxx = Math.max(maxx, x1); maxy = Math.max(maxy, y1);
}
const meta = { w: Math.round(maxx - minx), h: Math.round(maxy - miny), x: Math.round(minx), y: Math.round(miny) };
fs.writeFileSync(out, JSON.stringify({ meta, body: kept.join("") }));
console.log(out, paths.length, "->", kept.length, JSON.stringify(meta));
