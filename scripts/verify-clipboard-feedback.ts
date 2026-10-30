import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { useClipboardFeedback } from "./src/hooks/useClipboardFeedback";
      import { CopyButton } from "./src/components/common/CopyButton";
      const fixture = globalThis.clipboardFixture = { writes: [], callbacks: 0, mode: "success", pending: null, copied: null };
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: text => {
        fixture.writes.push(text);
        if (fixture.mode === "failure") return Promise.reject(new Error("clipboard denied"));
        if (fixture.mode === "pending") return new Promise(resolve => { fixture.pending = resolve; });
        return Promise.resolve();
      } } });
      const root = createRoot(document.getElementById("root"));
      function App() {
        const { copiedKey, copyText } = useClipboardFeedback({ duration: 400, language: "en" });
        Object.assign(fixture, { copied: copiedKey, copy: (key) => copyText("text-" + key, key, "Copied", () => { fixture.callbacks++; }) });
        return <CopyButton title="Copy text" copiedTitle="Copied text" copied={copiedKey !== null} onClick={() => fixture.copy("button")} />;
      }
      fixture.unmount = () => root.unmount();
      root.render(<App />);
    `,
  },
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("button", { name: "Copy text", exact: true }).click();
  await page.getByRole("button", { name: "Copied text", exact: true }).waitFor();
  assert.deepEqual(
    await page.evaluate(() => {
      const f = (globalThis as any).clipboardFixture;
      return { writes: f.writes, callbacks: f.callbacks, copied: f.copied };
    }),
    { writes: ["text-button"], callbacks: 1, copied: "button" },
  );
  await page.getByRole("button", { name: "Copy text", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(async () => {
      const f = (globalThis as any).clipboardFixture;
      f.mode = "failure";
      return f.copy("failure");
    }),
    false,
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const f = (globalThis as any).clipboardFixture;
      return [f.copied, f.callbacks];
    }),
    [null, 1],
  );
  await page.evaluate(() => {
    const f = (globalThis as any).clipboardFixture;
    f.mode = "pending";
    f.result = f.copy(2);
  });
  assert.equal(await page.evaluate(() => (globalThis as any).clipboardFixture.copied), null);
  await page.evaluate(() => (globalThis as any).clipboardFixture.pending());
  await page.waitForFunction(() => (globalThis as any).clipboardFixture.copied === 2);
  await page.evaluate(() => {
    const f = (globalThis as any).clipboardFixture;
    f.result = f.copy("after-unmount");
    f.unmount();
    f.pending();
  });
  assert.equal(await page.evaluate(() => (globalThis as any).clipboardFixture.result), false);
  assert.equal(await page.evaluate(() => (globalThis as any).clipboardFixture.callbacks), 2);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
process.stdout.write("Clipboard success, failure, deferred completion, numeric keys, feedback expiry and unmount cleanup passed\n");
