import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as sourceTexts from "../src/constants/sourceText";
import { BACKGROUND_OPTION_GROUPS } from "../src/constants/texts";
import { BackgroundModeSelect } from "../src/features/video-generation/components/BackgroundModeSelect";
import { BackgroundMode } from "../src/types";
import { blobToBase64, readBlobAsDataUrl } from "../src/lib/fileUtils";
import { getErrorMessage } from "../src/utils/errorUtils";
import { delayAsync } from "../src/lib/asyncUtils";
import { escapeRegExp } from "../src/lib/regexUtils.js";
import * as runtimeTexts from "../src/constants/runtime/maintenance.js";
import { CopyButton } from "../src/components/common/CopyButton.js";
import { MotionCopyButton } from "../src/features/motion/components/MotionCopyButton.js";
import { PlanningToggleField } from "../src/components/common/PlanningToggleField.js";
import { MotionToggle } from "../src/features/motion/components/MotionToggle.js";
import { Check } from "lucide-react";
for (const value of ["simple-id", "a.b[c](d)+e?", "a\\b^c$d|e{f}*", "Nhân vật (I)"]) assert.ok(new RegExp("^" + escapeRegExp(value) + "$").test(value));
for (const [value, expected] of [
  ['Track: "one"?.mp3', "Track_ _one__.mp3"],
  ["A\0B\x1fC\x7fD", "A_B_C\x7fD"],
  ["Nhạc 🎵.wav", "Nhạc 🎵.wav"],
])
  assert.equal(value.replace(new RegExp(runtimeTexts.INVALID_FILE_NAME_PATTERN, runtimeTexts.REGEXP_GLOBAL), "_"), expected);
assert.equal(MotionCopyButton, CopyButton);
for (const checked of [false, true]) {
  const props = { checked, label: "Toggle label", text: "Toggle text", title: "Toggle hint", icon: Check, disabled: true };
  for (const component of [React.createElement(PlanningToggleField, { ...props, onChange: () => undefined }), React.createElement(MotionToggle, { ...props, onClick: () => undefined })]) {
    const html = renderToStaticMarkup(component);
    assert.match(html, /role="switch"/);
    assert.ok(html.includes(`aria-checked="${checked}"`));
    assert.ok(html.includes('aria-label="Toggle label"'));
    assert.ok(html.includes('title="Toggle hint"'));
    assert.ok(html.includes("Toggle text"));
    assert.ok(html.includes('disabled=""'));
  }
}
for (const language of ["vi", "en"] as const) {
  const option = BACKGROUND_OPTION_GROUPS[language][0].options[0];
  const html = renderToStaticMarkup(React.createElement(BackgroundModeSelect, { value: option.value as BackgroundMode, onChange: () => undefined, language, label: "Reference label" }));
  assert.ok(html.includes("Reference label"));
  assert.ok(html.includes(option.label));
  assert.match(html, new RegExp(`<option[^>]*value="${option.value}"[^>]*selected=""`));
}
assert.equal(getErrorMessage(new Error("original"), "fallback"), "original");
assert.equal(getErrorMessage(null, "fallback"), "fallback");
assert.equal(getErrorMessage(42), "42");
await delayAsync(0);
const originalFileReader = globalThis.FileReader;
class TestFileReader {
  static result: string | ArrayBuffer = "data:audio/wav;base64,YXVkaW8=";
  static error: Error | null = null;
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(): void {
    queueMicrotask(() => {
      this.result = TestFileReader.result;
      this.error = TestFileReader.error;
      if (this.error) this.onerror?.();
      else this.onload?.();
    });
  }
}
globalThis.FileReader = TestFileReader as unknown as typeof FileReader;
try {
  const blob = new Blob(["audio"]);
  assert.equal(await readBlobAsDataUrl(blob), TestFileReader.result);
  assert.equal(await blobToBase64(blob), "YXVkaW8=");
  TestFileReader.result = "data:audio/wav;base64,";
  assert.equal(await blobToBase64(blob), TestFileReader.result);
  TestFileReader.result = new ArrayBuffer(0);
  await assert.rejects(readBlobAsDataUrl(blob), /File read error/);
  TestFileReader.error = new Error("reader failure");
  await assert.rejects(readBlobAsDataUrl(blob), /reader failure/);
} finally {
  if (originalFileReader) globalThis.FileReader = originalFileReader;
  else Reflect.deleteProperty(globalThis, "FileReader");
}
let checkedCallbacks = 0;
let selectionCallback: ts.ArrowFunction | undefined;
let selectionTree: ts.SourceFile | undefined;
const serverRoot = "src/server";
for (const relative of fs.readdirSync(serverRoot, { recursive: true }).filter((file) => /\.ts$/.test(String(file)))) {
  const file = path.join(serverRoot, String(relative));
  const tree = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["evaluate", "evaluateAll", "evaluateHandle", "waitForFunction"].includes(node.expression.name.text) && node.arguments[0] && ts.isArrowFunction(node.arguments[0])) {
      const callback = node.arguments[0];
      const auditLodash = (part: ts.Node): void => {
        if (ts.isPropertyAccessExpression(part) && ts.isIdentifier(part.expression)) assert.notEqual(part.expression.text, "_", `${file}: serialized callback captures lodash`);
        ts.forEachChild(part, auditLodash);
      };
      auditLodash(callback.body);
      if (callback.parameters.some((parameter) => parameter.name.getText(tree) === "browserPayload")) {
        const boundNames = new Set<string>();
        const references = new Set<string>();
        const collect = (part: ts.Node): void => {
          if ((ts.isBindingElement(part) || ts.isVariableDeclaration(part)) && ts.isIdentifier(part.name)) boundNames.add(part.name.text);
          if (ts.isIdentifier(part) && /^SOURCE_(?:TEXT|BROWSER_TEXT|TEMPLATE)_/.test(part.text) && !(ts.isPropertyAccessExpression(part.parent) && part.parent.name === part)) references.add(part.text);
          ts.forEachChild(part, collect);
        };
        collect(callback.body);
        for (const name of references) assert.ok(boundNames.has(name), `${file}: serialized callback captures ${name}`);
        checkedCallbacks++;
        if (callback.body.getText(tree).includes("SOURCE_TEXT_ARIA_SELECTED") && callback.body.getText(tree).includes(".some(")) {
          selectionCallback = callback;
          selectionTree = tree;
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}
assert.ok(checkedCallbacks >= 30);
assert.ok(selectionCallback && selectionTree);
const compiledCallback = ts.transpileModule(`module.exports = (${selectionCallback.getText(selectionTree)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const context = { module: { exports: undefined as unknown } };
vm.runInNewContext(compiledCallback, context);
const callback = context.module.exports as (element: { getAttribute: (name: string) => string | null }, payload: { payload: undefined; texts: typeof sourceTexts }) => boolean;
assert.equal(callback({ getAttribute: (name) => (name === "aria-selected" ? "true" : null) }, { payload: undefined, texts: sourceTexts }), true);
assert.equal(callback({ getAttribute: () => null }, { payload: undefined, texts: sourceTexts }), false);
process.stdout.write(`Shared file reads, localized UI, errors and ${checkedCallbacks} serialized browser callbacks passed\n`);
