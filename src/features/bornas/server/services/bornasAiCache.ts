import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { AiPlanningExecutionMode } from "../../../../types.js";
import { BORNAS_AI_CACHE } from "../../constants/bornasConfig.js";
import { BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasAiSettings } from "../../types/bornas.js";
import { readJson, writeJson } from "./bornasTools.js";
type Choice = BornasAiSettings["directAi"];
type Log = (text: string, level?: "info" | "warn" | "error") => void;
// Cache key = AI that was asked + full prompt. A reply from a fallback AI is used but never cached,
// so the next run asks the chosen AI again instead of reusing the fallback answer forever.
export const bornasAiKey = (ai: Choice, prompt: string): string => createHash("sha1").update(`${ai.provider}|${ai.model}|${prompt}`).digest("hex").slice(0, BORNAS_AI_CACHE.KEY_LEN);
export const bornasAiCached = async <T>(opts: { dir: string; prefix: string; ai: Choice; prompt: string; artifact: string; log: Log; signal?: AbortSignal; images?: Parameters<typeof runMotionAi>[5]; ok: (res: T) => boolean }): Promise<T> => {
  const file = path.join(opts.dir, `${opts.prefix}${bornasAiKey(opts.ai, opts.prompt)}.json`);
  const hit = readJson<T | null>(file, null);
  if (hit !== null && opts.ok(hit)) return hit;
  // A fallback answer is kept only for a short while (a resume after an app restart uses the same plan),
  // then the chosen AI is asked again.
  const fbFile = file.replace(/\.json$/, BORNAS_AI_CACHE.FALLBACK_EXT);
  const fb = readJson<{ at: number; res: T } | null>(fbFile, null);
  if (fb && Date.now() - fb.at < BORNAS_AI_CACHE.FALLBACK_TTL_MS && opts.ok(fb.res)) return fb.res;
  const exec = reupExec(opts.ai);
  let used: { provider: string; model: string } | null = null;
  const res = (await runMotionAi(opts.prompt, opts.artifact, { ...exec, routeUsed: (r) => (used = r) }, opts.signal, (line) => line && opts.log(line), opts.images)) as T;
  const u = used as { provider: string; model: string } | null;
  const api = exec.mode === AiPlanningExecutionMode.ApiOnly;
  const primary = !!u && u.model === String(exec.model || "") && (api || u.provider === String(exec.provider));
  if (!opts.ok(res)) return res;
  fs.mkdirSync(opts.dir, { recursive: true });
  if (primary) writeJson(file, res);
  else {
    opts.log(BORNAS_LOG.AI_FALLBACK_NO_CACHE(u ? `${u.provider}/${u.model}` : "?"), "warn");
    writeJson(fbFile, { at: Date.now(), res });
  }
  return res;
};
