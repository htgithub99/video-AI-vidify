import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { getAuthoredFiles, parseCode } from "./codeMaintenance.js";
const options = ts.convertCompilerOptionsFromJson(ts.readConfigFile("tsconfig.json", ts.sys.readFile).config.compilerOptions, process.cwd()).options;
const featureOf = (file: string): string | undefined => file.replaceAll("\\", "/").match(/^src\/features\/([^/]+)\//)?.[1];
const sharedConsumers = new Set(["auto-video", "cinematic"]);
let imports = 0;
for (const file of (await getAuthoredFiles()).filter((file) => file.startsWith("src/") && /\.tsx?$/.test(file))) {
  const tree = parseCode(await fs.readFile(file, "utf8"), file);
  const visit = (node: ts.Node): void => {
    const specifier = ts.isImportDeclaration(node) || ts.isExportDeclaration(node) ? node.moduleSpecifier : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? node.arguments[0] : undefined;
    if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith(".")) {
      if (specifier.text.endsWith(".css")) {
        assert.ok(ts.sys.fileExists(path.resolve(path.dirname(file), specifier.text)), `${file}: missing stylesheet`);
        return;
      }
      const resolved = ts.resolveModuleName(specifier.text, path.resolve(file), options, ts.sys).resolvedModule;
      assert.ok(resolved, `${file}: unresolved ${specifier.text}`);
      const target = path.relative(process.cwd(), resolved.resolvedFileName).replaceAll("\\", "/");
      const sourceFeature = featureOf(file),
        targetFeature = featureOf(target);
      if (sourceFeature && targetFeature) assert.ok(sourceFeature === targetFeature || (targetFeature === "video-generation" && sharedConsumers.has(sourceFeature)), `${file} imports another menu's implementation: ${target}`);
      if (/^src\/(?:components|hooks|lib|services)\//.test(file)) assert.equal(targetFeature, undefined, `${file}: shared code imports a menu implementation: ${target}`);
      if (file === "src/App.tsx" && targetFeature) assert.equal(target, "src/features/screens.ts", "App must load menus through the lazy screen entry");
      imports++;
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
process.stdout.write(`Feature boundaries and ${imports} local imports passed\n`);
