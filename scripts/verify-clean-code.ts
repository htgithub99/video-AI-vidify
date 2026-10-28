import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { getCommentRanges, parseCode } from "./codeMaintenance.js";
const files = fs
  .readdirSync("src", { recursive: true })
  .filter((file) => /\.tsx?$/.test(String(file)))
  .map((file) => path.join("src", String(file)));
const violations: string[] = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const tree = parseCode(source, file);
  if (getCommentRanges(source, tree).length) violations.push(`${file}: comment`);
  const visit = (node: ts.Node): void => {
    if (path.normalize(file) !== path.normalize("src/utils/logger.ts") && ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "console" && ["log", "warn", "error", "info", "debug"].includes(node.name.text)) violations.push(`${file}: direct-console`);
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
if (violations.length) throw new Error(`Clean-code verification failed: ${violations.join(", ")}`);
process.stdout.write("Clean-code source assertions passed\n");
