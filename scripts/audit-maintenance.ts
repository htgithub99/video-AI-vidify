import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { getAuthoredFiles, getCommentRanges, parseCode } from "./codeMaintenance.js";
const reports: { file: string; comments: number; nativeJsonCalls: number; runtimeLiterals: { line: number; text: string }[] }[] = [];
for (const file of (await getAuthoredFiles()).filter((file) => /^(src\/|server\.ts|vite\.config\.ts|electron\/|admin_dashboard\/|motion-engine\/|python_scripts\/)/.test(file) && /\.[cm]?[jt]sx?$/.test(file))) {
  const source = await fs.readFile(file, "utf8");
  const tree = parseCode(source, file);
  const row = { file, comments: getCommentRanges(source, tree).length, nativeJsonCalls: 0, runtimeLiterals: [] as { line: number; text: string }[] };
  const constant = /(^|\/)(constants|types)\//.test(file) || /(?:Texts|Text|Constants|Runtime|VerificationTexts|config)\.[cm]?[jt]sx?$/.test(file) || ["src/types.ts", "admin_dashboard/constants.js", "motion-engine/texts.js", "motion-engine/geo-data.js"].includes(file);
  const record = (node: ts.Node, text: string): void => {
    if (text.trim()) row.runtimeLiterals.push({ line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1, text: text.slice(0, 150) });
  };
  const visit = (node: ts.Node): void => {
    if (ts.isTypeNode(node)) return;
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "JSON" && ["parse", "stringify"].includes(node.name.text)) row.nativeJsonCalls++;
    if (!constant && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))) {
      const parent = node.parent;
      const module = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent) || (ts.isCallExpression(parent) && (parent.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(parent.expression) && parent.expression.text === "require")));
      const key = (ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isMethodDeclaration(parent) || ts.isEnumMember(parent)) && parent.name === node;
      const compiler = ts.isExpressionStatement(parent) || (ts.isBinaryExpression(parent) && (ts.isTypeOfExpression(parent.left) || ts.isTypeOfExpression(parent.right)));
      if (!module && !key && !compiler) record(node, node.text);
    }
    if (!constant && ts.isTemplateExpression(node)) for (const fragment of [node.head, ...node.templateSpans.map((span) => span.literal)]) record(fragment, fragment.text);
    if (!constant && ts.isJsxText(node)) record(node, node.text);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  reports.push(row);
}
const output = process.argv.find((value) => value.startsWith("--report="))?.slice(9) || "scratch/code-maintenance/source-audit.json";
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(reports, null, 2));
const comments = reports.reduce((sum, row) => sum + row.comments, 0);
const violations = reports.filter((row) => row.runtimeLiterals.length);
process.stdout.write(JSON.stringify({ files: reports.length, comments, runtimeLiterals: violations.reduce((sum, row) => sum + row.runtimeLiterals.length, 0), nativeJsonCalls: reports.reduce((sum, row) => sum + row.nativeJsonCalls, 0), violations: violations.map(({ file, runtimeLiterals }) => ({ file, runtimeLiterals })), report: output }, null, 2) + "\n");
if (process.argv.includes("--check") && (comments || violations.length)) process.exitCode = 1;
