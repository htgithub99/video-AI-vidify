import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from "@neplex/vectorizer";
import fs from "fs";
const [inp, out] = process.argv.slice(2);
const t = Date.now();
const svg = await vectorize(fs.readFileSync(inp), { colorMode: ColorMode.Color, colorPrecision: 8, filterSpeckle: 4, spliceThreshold: 45, cornerThreshold: 60, hierarchical: Hierarchical.Stacked, mode: PathSimplifyMode.Spline, layerDifference: 6, lengthThreshold: 4, maxIterations: 2, pathPrecision: 1 });
const body = (svg.match(/<path[^>]*\/>/g) || []).join("");
const W = +svg.match(/width="(\d+)"/)[1], H = +svg.match(/height="(\d+)"/)[1];
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`);
console.log(out, Date.now() - t, "ms", body.length);
