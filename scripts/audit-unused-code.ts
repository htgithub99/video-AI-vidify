import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { getAuthoredFiles } from "./codeMaintenance.js";
const files = (await getAuthoredFiles()).filter((file) => /\.[cm]?[jt]sx?$/.test(file));
const known = new Set(files);
const options = ts.convertCompilerOptionsFromJson(ts.readConfigFile("tsconfig.json", ts.sys.readFile).config.compilerOptions, process.cwd()).options;
const edges = new Map<string, Set<string>>();
const roots = new Set(["src/main.tsx", "server.ts", "vite.config.ts", "src/features/motion/remotion/Root.tsx", ...files.filter((file) => /^(scripts\/|electron\/)/.test(file) || file.endsWith(".d.ts"))]);
for (const file of files) {
  const source = await fs.readFile(file, "utf8");
  const targets = new Set<string>();
  for (const entry of ts.preProcessFile(source, true, true).importedFiles) {
    const resolved = ts.resolveModuleName(entry.fileName, path.resolve(file), options, ts.sys).resolvedModule;
    if (resolved) targets.add(path.relative(process.cwd(), resolved.resolvedFileName).replaceAll("\\", "/"));
  }
  for (const match of source.matchAll(/(?:\.\/)?(src\/[\w./-]+\.[cm]?[jt]sx?)/g)) if (known.has(match[1])) targets.add(match[1]);
  edges.set(file, targets);
}
const reachable = new Set<string>();
const visit = (file: string) => {
  if (reachable.has(file)) return;
  reachable.add(file);
  for (const target of edges.get(file) || []) visit(target);
};
for (const file of roots) visit(file);
const unreachable = files.filter((file) => /^src\//.test(file) && !reachable.has(file));
const output = process.argv.find((value) => value.startsWith("--report="))?.slice(9) || "scratch/code-maintenance/unused-candidates.json";
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify({ roots: [...roots], unreachable }, null, 2));
process.stdout.write(JSON.stringify({ scanned: files.length, candidates: unreachable }) + "\n");
