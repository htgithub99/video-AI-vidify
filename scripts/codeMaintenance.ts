import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import * as prettier from "prettier";
import postcss from "postcss";
import { parse } from "parse5";
export const CODE_PATTERN = /\.(?:[cm]?[jt]sx?|css|html)$/;
export const writeCodeFile = async (file: string, source: string): Promise<void> => {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.writeFile(file, source, "utf8");
      return;
    } catch (error) {
      if (attempt >= 5 || !["UNKNOWN", "EBUSY", "EPERM"].includes((error as NodeJS.ErrnoException).code || "")) throw error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
};
export const getAuthoredFiles = async (): Promise<string[]> => {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  const existing = await Promise.all([...new Set(files)].map(async (file) => ((await fs.stat(file).catch(() => undefined))?.isFile() ? file : undefined)));
  return existing.filter((file): file is string => !!file && !file.startsWith("docs/") && CODE_PATTERN.test(file));
};
export const parseCode = (source: string, file = "source.tsx"): ts.SourceFile => ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
export const getCommentRanges = (source: string, tree: ts.SourceFile): ts.CommentRange[] => {
  const ranges = new Map<number, ts.CommentRange>();
  const visit = (node: ts.Node): void => {
    for (const range of [...(ts.getLeadingCommentRanges(source, node.pos) || []), ...(ts.getTrailingCommentRanges(source, node.end) || [])]) ranges.set(range.pos, range);
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return [...ranges.values()].sort((a, b) => a.pos - b.pos);
};
export const removeCodeComments = (source: string, file: string): string => {
  const tree = parseCode(source, file);
  const ranges: { pos: number; end: number }[] = getCommentRanges(source, tree);
  let result = source;
  let nextStart = source.length;
  for (const range of ranges.sort((a, b) => b.pos - a.pos || b.end - a.end)) {
    if (range.end > nextStart) continue;
    result = result.slice(0, range.pos) + source.slice(range.pos, range.end).replace(/[^\r\n]/g, " ") + result.slice(range.end);
    nextStart = range.pos;
  }
  return result;
};
export const compactTrivia = (source: string, file: string): string => {
  const tree = parseCode(source, file);
  const protectedRanges: { pos: number; end: number }[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isTemplateLiteral(node) || ts.isRegularExpressionLiteral(node) || ts.isJsxText(node)) {
      protectedRanges.push({ pos: node.getStart(tree), end: node.end });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  let cursor = 0;
  let result = "";
  for (const range of protectedRanges.sort((a, b) => a.pos - b.pos)) {
    result += source.slice(cursor, range.pos).replace(/^[\t ]*\r?\n/gm, "") + source.slice(range.pos, range.end);
    cursor = range.end;
  }
  return result + source.slice(cursor).replace(/^[\t ]*\r?\n/gm, "");
};
export const compactCode = async (source: string, file = "source.tsx"): Promise<string> => {
  const config = await prettier.resolveConfig(path.resolve(file));
  let prepared = source;
  if (/\.[cm]?[jt]sx?$/.test(file)) prepared = compactTrivia(removeCodeComments(source, file), file);
  else if (file.endsWith(".css")) {
    const tree = postcss.parse(source, { from: file });
    tree.walkComments((comment) => {
      comment.remove();
    });
    tree.walk((node) => {
      if (node.raws.before) node.raws.before = node.raws.before.replace(/\r?\n[\t ]*(?=\r?\n)/g, "");
    });
    prepared = tree.toString();
  } else if (file.endsWith(".html")) {
    const ranges: { start: number; end: number }[] = [];
    const visit = (node: ReturnType<typeof parse> | any): void => {
      if (node.nodeName === "#comment" && node.sourceCodeLocation) ranges.push({ start: node.sourceCodeLocation.startOffset, end: node.sourceCodeLocation.endOffset });
      for (const child of node.childNodes || []) visit(child);
      if (node.content) visit(node.content);
    };
    visit(parse(source, { sourceCodeLocationInfo: true }));
    for (const range of ranges.sort((a, b) => b.start - a.start)) prepared = prepared.slice(0, range.start) + prepared.slice(range.end);
  }
  return prettier.format(prepared, { ...config, filepath: file, printWidth: 400 });
};
