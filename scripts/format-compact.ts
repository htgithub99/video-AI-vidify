import fs from "node:fs/promises";
import { compactCode, getAuthoredFiles, writeCodeFile } from "./codeMaintenance.js";
const check = process.argv.includes("--check");
const target = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const files = (await getAuthoredFiles()).filter((file) => !target || file === target || file.startsWith(`${target.replaceAll("\\", "/").replace(/\/$/, "")}/`));
let changed = 0;
for (const file of files) {
  const original = await fs.readFile(file, "utf8");
  const formatted = await compactCode(original, file);
  if (original === formatted) continue;
  changed++;
  if (check) process.stderr.write(`${file}\n`);
  else await writeCodeFile(file, formatted);
}
process.stdout.write(`${check ? "Unformatted" : "Formatted"}: ${changed}/${files.length} files\n`);
if (check && changed) process.exitCode = 1;
