import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../", import.meta.url));
const gitFiles = (args) =>
  execFileSync("git", [...args, "-z", "--", "*.ts", "*.tsx"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
const changedFiles = [...new Set([...gitFiles(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]), ...gitFiles(["ls-files", "--others", "--exclude-standard"])])].map((file) => path.resolve(root, file)).filter((file) => fs.existsSync(file));
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config || {}, ts.sys, root);
const program = ts.createProgram([...new Set([...parsed.fileNames, ...changedFiles])], { ...parsed.options, noEmit: true, incremental: false });
const diagnostics = [...(config.error ? [config.error] : []), ...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) process.stdout.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: (file) => file, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
process.stdout.write(`Type-check project and ${changedFiles.length} changed TypeScript files: ${diagnostics.length} errors.\n`);
process.exitCode = diagnostics.length ? 1 : 0;
