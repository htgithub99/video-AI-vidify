import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { MotionProductionStore } from "../src/server/services/motionProductionStore.js";
const childDirectory = process.argv[process.argv.indexOf("--child") + 1];
if (process.argv.includes("--child")) {
  const store = new MotionProductionStore(childDirectory);
  try {
    const owner = store.acquire("shared");
    process.stdout.write(JSON.stringify({ acquired: true, owner }) + "\n");
    process.stdin.resume();
    await once(process.stdin, "data");
    process.stdin.pause();
    store.release("shared", owner);
  } catch {
    process.stdout.write(JSON.stringify({ acquired: false }) + "\n");
  }
} else {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "motion-lock-race-"));
  const children: ReturnType<typeof spawn>[] = [];
  try {
    fs.writeFileSync(path.join(directory, "shared.lock"), JSON.stringify({ pid: 2147483647, token: "previous-owner", updated: 0 }));
    const results = await Promise.all(
      Array.from({ length: 4 }, async () => {
        const child = spawn(process.execPath, ["--import", "tsx", path.resolve("scripts/verify-motion-production-lock.ts"), "--child", directory], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
        children.push(child);
        let buffer = "";
        return await new Promise<{ acquired: boolean; owner?: { pid: number; token: string; updated: number } }>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("Lock contender timed out")), 30000);
          child.on("error", reject);
          child.stdout!.on("data", (data) => {
            buffer += data.toString();
            if (!buffer.includes("\n")) return;
            clearTimeout(timer);
            resolve(JSON.parse(buffer.split("\n")[0]));
          });
        });
      }),
    );
    assert.equal(results.filter((result) => result.acquired).length, 1);
    const winner = results.find((result) => result.acquired)!;
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, "shared.lock"), "utf8")).token, winner.owner!.token);
    assert.throws(() => new MotionProductionStore(directory).acquire("shared"));
    for (const child of children) if (child.exitCode === null) child.stdin!.write("finish\n");
    await Promise.all(children.map((child) => (child.exitCode === null ? once(child, "exit") : Promise.resolve())));
    const store = new MotionProductionStore(directory);
    const owner = store.acquire("shared");
    store.release("shared", owner);
    console.log("Cross-process production lock: four contenders reclaim one dead owner; exactly one wins and live ownership is fenced.");
  } finally {
    for (const child of children) if (child.exitCode === null) child.kill();
    assert.ok(directory.startsWith(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
