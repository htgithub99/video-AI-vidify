import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { transform } from "esbuild";
const text = fs.readFileSync("src/server/services/imageGeneratorService.ts", "utf8");
const source = ts.createSourceFile("imageGeneratorService.ts", text, ts.ScriptTarget.Latest, true);
const declaration = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "getOrLaunchGlobalBrowser")!;
assert.ok(declaration);
const compiled = await transform(declaration.getText(source).replace(/^export /, ""), { loader: "ts", target: "es2022" });
const create = new Function(
  "fixture",
  `
let activeBrowserTimeout = null;
let activeBrowserInstance = fixture.active;
let activeBrowserHeadless = fixture.headless;
let activeBrowserLaunchPromise = fixture.pending || null;
const _ = {isEqual:(a,b)=>a===b};
const SOURCE_TEXT_CLOSE_2 = 'close';
const ImageGenMessages = {};
const FLOW_AUTOMATION_MESSAGES = {};
const appLog = () => {};
const isSharedChromeRunning = async () => !!fixture.shared;
const closeActiveBrowser = async () => {fixture.closed++; activeBrowserInstance = null; activeBrowserHeadless = undefined;};
const launchBrowserForAccount = async () => {fixture.launched++; return fixture.next;};
${compiled.code}
return getOrLaunchGlobalBrowser;
`,
);
const session = (preserveExternalPages = false) => ({ preserveExternalPages, context: { on() {} }, page: { url: () => "https://gemini.google.com/app/retained-room" } });
const active = session();
const next = session();
const visible = { active, next, headless: false, closed: 0, launched: 0 };
assert.equal(await create(visible)(true, false), active);
assert.equal(visible.closed, 0);
assert.equal(visible.launched, 0);
const hidden = { active, next, headless: true, closed: 0, launched: 0 };
assert.equal(await create(hidden)(false, false), next);
assert.equal(hidden.closed, 1);
assert.equal(hidden.launched, 1);
const shared = { active: session(true), next, headless: true, shared: true, closed: 0, launched: 0 };
assert.equal(await create(shared)(false), shared.active);
assert.equal(shared.closed, 0);
const pending = { active, next, headless: false, pending: Promise.resolve(active), closed: 0, launched: 0 };
assert.equal(await create(pending)(true, false), active);
assert.equal(pending.closed, 0);
assert.equal(pending.launched, 0);
console.log("Browser reuse: visible Chrome and its rooms survive later headless preferences; CAPTCHA visibility upgrades and external browser ownership are preserved.");
