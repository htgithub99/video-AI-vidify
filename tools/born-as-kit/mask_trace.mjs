import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from "@neplex/vectorizer";
import fs from "fs";
const [inp, out] = process.argv.slice(2);
const svg = await vectorize(fs.readFileSync(inp), { colorMode: ColorMode.Binary, colorPrecision: 6, layerDifference: 16, filterSpeckle: 30, cornerThreshold: 60, spliceThreshold: 45, mode: PathSimplifyMode.Spline, hierarchical: Hierarchical.Cutout, lengthThreshold: 6, maxIterations: 4, pathPrecision: 1 });
const paths = (svg.match(/<path[^>]*\/>/g) || []).map((p) => [p.match(/d="([^"]+)"/)[1], (p.match(/translate\(([-\d.]+),([-\d.]+)\)/) || [0, 0, 0]).slice(1).map(Number)]);
paths.sort((a, b) => b[0].length - a[0].length);
const [d, [tx, ty]] = paths[0];
fs.writeFileSync(out, JSON.stringify({ d, tx, ty }));
console.log(out, paths.length, d.length);
