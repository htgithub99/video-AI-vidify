import { stringifyJson } from "../src/lib/jsonStringify.js";
import ts from "typescript";
import { readFileSync } from "node:fs";
import * as sourceTexts from "../src/constants/sourceText";
const constantsTree = ts.createSourceFile("sourceText.ts", readFileSync(new URL("../src/constants/sourceText.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const templates = new Map<string, Array<string | number>>();
const quoteLiteral = (value: string): string => (value.includes('"') ? "'" + stringifyJson(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'") + "'" : stringifyJson(value));
for (const statement of constantsTree.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !ts.isArrowFunction(declaration.initializer)) continue;
    const arrow = declaration.initializer;
    const parts: Array<string | number> = [];
    const flatten = (node: ts.Node): void => {
      if (ts.isBinaryExpression(node)) {
        flatten(node.left);
        flatten(node.right);
      } else if (ts.isStringLiteral(node)) parts.push(node.text);
      else if (ts.isIdentifier(node)) parts.push(arrow.parameters.findIndex((parameter) => parameter.name.getText(constantsTree) === node.text));
    };
    flatten(arrow.body);
    templates.set(declaration.name.text, parts);
  }
}
export const resolveSourceTextConstants = (source: string): string => {
  let tree = ts.createSourceFile("source.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if ((tree as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics.length) tree = ts.createSourceFile("source.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits: Array<{ start: number; end: number; value: string }> = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && templates.has(node.expression.text)) {
      const parts = templates.get(node.expression.text)!;
      const value =
        "`" +
        parts
          .map((part) => {
            if (typeof part === "string") return stringifyJson(part).slice(1, -1).replace(/\\"/g, '"').replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
            const argument = node.arguments[part];
            const expression = ts.isTemplateExpression(argument) && argument.head.text === "" && argument.templateSpans.length === 1 && argument.templateSpans[0].literal.text === "" ? argument.templateSpans[0].expression : argument;
            return "${" + resolveSourceTextConstants(expression.getText(tree)) + "}";
          })
          .join("") +
        "`";
      edits.push({ start: node.getStart(tree), end: node.end, value });
      return;
    }
    if (ts.isIdentifier(node)) {
      const value = sourceTexts[node.text as keyof typeof sourceTexts];
      if (typeof value === "string" && !ts.isBindingElement(node.parent)) edits.push({ start: node.getStart(tree), end: node.end, value: ts.isShorthandPropertyAssignment(node.parent) ? `${node.text}: ${quoteLiteral(value)}` : quoteLiteral(value) });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  const resolvedTree = ts.createSourceFile("resolved.tsx", source, ts.ScriptTarget.Latest, true, tree.languageVariant === ts.LanguageVariant.JSX ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const spacingEdits: Array<{ start: number; end: number; value: string }> = [];
  const collect = (node: ts.Node): void => {
    if (ts.isArrowFunction(node)) spacingEdits.push({ start: node.equalsGreaterThanToken.end, end: node.body.getStart(resolvedTree), value: " " });
    const items = ts.isCallExpression(node) || ts.isNewExpression(node) ? node.arguments : ts.isArrayLiteralExpression(node) ? node.elements : undefined;
    if (items?.length) {
      spacingEdits.push({ start: items.pos, end: items[0].getStart(resolvedTree), value: "" });
      for (let index = 1; index < items.length; index++) spacingEdits.push({ start: items[index - 1].end, end: items[index].getStart(resolvedTree), value: ", " });
      spacingEdits.push({ start: items[items.length - 1].end, end: node.end - 1, value: "" });
    }
    ts.forEachChild(node, collect);
  };
  collect(resolvedTree);
  for (const edit of spacingEdits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  return source;
};
