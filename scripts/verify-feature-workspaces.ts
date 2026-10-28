import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "tsx",
    contents: `
    import React, { lazy, useState } from "react";
    import { createRoot } from "react-dom/client";
    import { FeatureWorkspace } from "./src/components/common/FeatureWorkspace";
    import { openIndexedDatabase } from "./src/lib/indexedDatabase";
    const control = globalThis.workspaceFixture = { loads: 0, openIndexedDatabase };
    const Counter = ({ name, failed = false }) => { const [value, set] = useState(0); if (failed) throw new Error("fixture failure"); return <button onClick={() => set(value + 1)}>{name}:{value}</button>; };
    const A = lazy(() => { control.loads++; return new Promise(resolve => { control.resolveA = () => resolve({ default: Counter }); }); });
    function App() {
      const [showA, setA] = useState(false), [showB, setB] = useState(true), [failed, setFailed] = useState(false);
      Object.assign(control, { setA, setB, setFailed });
      return <><FeatureWorkspace feature="a" language="en" active={showA} keepMounted><A name="A" failed={failed}/></FeatureWorkspace><FeatureWorkspace feature="b" language="en" active={showB}><Counter name="B"/></FeatureWorkspace></>;
    }
    createRoot(document.getElementById("root")).render(<App/>);
  `,
  },
  bundle: true,
  platform: "browser",
  format: "iife",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  await page.setContent('<style>.hidden { display: none; }</style><div id="root"></div>');
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.getByRole("button", { name: "B:0", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => (globalThis as any).workspaceFixture.loads), 0);
  await page.evaluate(() => (globalThis as any).workspaceFixture.setA(true));
  await page.waitForFunction(() => (globalThis as any).workspaceFixture.loads === 1);
  assert.equal(await page.getByRole("button", { name: "A:0", exact: true }).count(), 0);
  await page.evaluate(() => (globalThis as any).workspaceFixture.resolveA());
  await page.getByRole("button", { name: "A:0", exact: true }).click();
  await page.getByRole("button", { name: "A:1", exact: true }).waitFor();
  await page.evaluate(() => (globalThis as any).workspaceFixture.setA(false));
  await page.getByRole("button", { name: "A:1", exact: true }).waitFor({ state: "hidden" });
  await page.evaluate(() => (globalThis as any).workspaceFixture.setA(true));
  await page.getByRole("button", { name: "A:1", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => (globalThis as any).workspaceFixture.loads), 1);
  await page.evaluate(() => (globalThis as any).workspaceFixture.setFailed(true));
  await page.getByText("This screen encountered an error", { exact: true }).waitFor();
  await page.getByRole("button", { name: "B:0", exact: true }).click();
  await page.getByRole("button", { name: "B:1", exact: true }).waitFor();
  await page.evaluate(() => (globalThis as any).workspaceFixture.setFailed(false));
  await page.getByRole("button", { name: "Open screen again", exact: true }).click();
  await page.getByRole("button", { name: "A:0", exact: true }).waitFor();
  await page.evaluate(() => (globalThis as any).workspaceFixture.setFailed(true));
  await page.getByText("This screen encountered an error", { exact: true }).waitFor();
  await page.evaluate(() => {
    const control = (globalThis as any).workspaceFixture;
    control.setA(false);
    control.setFailed(false);
  });
  await page.getByText("This screen encountered an error", { exact: true }).waitFor({ state: "hidden" });
  await page.evaluate(() => (globalThis as any).workspaceFixture.setA(true));
  await page.getByRole("button", { name: "A:0", exact: true }).waitFor();
  await page.evaluate(() => (globalThis as any).workspaceFixture.setB(false));
  await page.getByRole("button", { name: "B:1", exact: true }).waitFor({ state: "detached" });
  await page.evaluate(() => (globalThis as any).workspaceFixture.setB(true));
  await page.getByRole("button", { name: "B:0", exact: true }).waitFor();
  await page.close();
  const storage = await browser.newPage();
  await storage.route("http://workspace.test/**", (route) => route.fulfill({ contentType: "text/html", body: '<div id="root"></div>' }));
  await storage.goto("http://workspace.test/");
  await storage.addScriptTag({ content: bundle.outputFiles[0].text });
  await storage.waitForFunction(() => !!(globalThis as any).workspaceFixture);
  assert.deepEqual(
    await storage.evaluate(async () => {
      const open = (globalThis as any).workspaceFixture.openIndexedDatabase;
      const name = "workspace-refactor-storage-test";
      const first = await open(name, 1, (database: IDBDatabase) => database.createObjectStore("items"));
      await new Promise<void>((resolve, reject) => {
        const tx = first.transaction("items", "readwrite");
        tx.objectStore("items").put("preserved", "key");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      first.close();
      const next = await open(name, 2, (database: IDBDatabase) => database.createObjectStore("other"));
      const preserved = await new Promise((resolve, reject) => {
        const request = next.transaction("items").objectStore("items").get("key");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      next.close();
      let rejected = false;
      try {
        await open(name, 1);
      } catch (error) {
        rejected = (error as DOMException).name === "VersionError";
      }
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return { preserved, rejected };
    }),
    { preserved: "preserved", rejected: true },
  );
  await storage.close();
} finally {
  await browser.close();
}
process.stdout.write("Lazy screens, preserved drafts, independent errors, retry and IndexedDB upgrades passed\n");
