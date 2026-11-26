import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { getDataDirectory, getPythonCommand, getStaticResourcePath } from "../../../../server/utils/paths.js";
import { getFfmpegPath } from "../../../../server/services/shortsPreprocessService.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { generateImageWithGeminiChat, generateImageWithPlaywright } from "../../../../server/services/imageGeneratorService.js";
import { GenerateType, ImageGenerationMode } from "../../../../types.js";
import { REFACTOR_CONSTANTS } from "../../../../constants/refactor.js";
import { BORNAS_DIR, BORNAS_DRAW_PROVIDERS, BORNAS_PY } from "../../constants/bornasConfig.js";
import type { BornasDrawChoice, BornasDrawProvider } from "../../types/bornas.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
export const BORNAS_ABORTED = "BORNAS_ABORTED";
export const isBornasAbort = (error: unknown): boolean => (error as Error)?.message === BORNAS_ABORTED;
export const bornasKit = (...parts: string[]): string => path.join(getStaticResourcePath(path.join(...BORNAS_DIR.KIT)), ...parts);
export const bornasLib = (...parts: string[]): string => path.join(getStaticResourcePath(path.join(...BORNAS_DIR.LIB)), ...parts);
export const runTool = (cmd: string, args: string[], opts: { signal?: AbortSignal; cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean; onLine?: (line: string) => void } = {}): Promise<string> =>
  new Promise((resolve, reject) => {
    if (opts.signal?.aborted) return reject(new Error(BORNAS_ABORTED));
    const child = spawn(cmd, args, { windowsHide: true, cwd: opts.cwd, env: { ...process.env, PYTHONIOENCODING: "utf-8", ...opts.env }, shell: opts.shell });
    let out = "",
      err = "";
    const abort = () => {
      try {
        child.kill("SIGKILL");
      } catch {}
    };
    opts.signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (c: Buffer) => {
      out += c.toString();
      if (opts.onLine) for (const line of c.toString().split(/\r?\n/)) if (line.trim()) opts.onLine(line.trim());
    });
    child.stderr.on("data", (c: Buffer) => {
      err = (err + c.toString()).slice(-4000);
      if (opts.onLine) for (const line of c.toString().split(/\r?\n/)) if (line.trim()) opts.onLine(line.trim());
    });
    child.on("error", (error) => {
      opts.signal?.removeEventListener("abort", abort);
      reject(error);
    });
    child.on("close", (code) => {
      opts.signal?.removeEventListener("abort", abort);
      if (opts.signal?.aborted) return reject(new Error(BORNAS_ABORTED));
      if (code === 0) resolve(out);
      else reject(new Error(_.trim(_.last(_.compact(err.split(/\r?\n/)))) || `${path.basename(cmd)} ${code}`));
    });
  });
let pyReady: Promise<string> | undefined;
const pyRoot = (): string => path.join(getDataDirectory(), BORNAS_DIR.OUTPUT, BORNAS_DIR.ROOT, BORNAS_DIR.PYENV);
const pyExe = (): string => path.join(pyRoot(), process.platform === "win32" ? path.join("Scripts", "python.exe") : path.join("bin", "python"));
export const bornasPython = (log: (line: string) => void, signal?: AbortSignal): Promise<string> => {
  pyReady ||= (async () => {
    const ready = path.join(pyRoot(), BORNAS_PY.READY);
    const done = fs.existsSync(ready) && (parseJson(fs.readFileSync(ready, "utf8")) as { version?: number } | null)?.version === BORNAS_PY.VERSION;
    if (done && fs.existsSync(pyExe())) return pyExe();
    log(BORNAS_LOG.PYTHON);
    try {
      if (!fs.existsSync(pyExe())) await runTool(getPythonCommand(), ["-m", "venv", pyRoot()], { signal });
      await runTool(pyExe(), ["-m", "pip", "install", "--disable-pip-version-check", ...BORNAS_PY.PACKAGES], { signal });
      fs.writeFileSync(ready, stringifyJson({ version: BORNAS_PY.VERSION }));
      return pyExe();
    } catch (error) {
      pyReady = undefined;
      throw new Error(BORNAS_ERROR.PYTHON(String((error as Error)?.message || error)));
    }
  })();
  return pyReady;
};
export const runKitPy = async (script: string, args: string[], log: (line: string) => void, signal?: AbortSignal): Promise<string> => runTool(await bornasPython(log, signal), [bornasKit(script), ...args], { signal });
export const runKitNode = (script: string, args: string[], env: NodeJS.ProcessEnv, signal?: AbortSignal): Promise<string> => {
  if (!fs.existsSync(bornasKit(script))) throw new Error(BORNAS_ERROR.KIT(bornasKit()));
  return runTool(process.execPath, [bornasKit(script), ...args], { signal, env: { ELECTRON_RUN_AS_NODE: "1", FFMPEG: getFfmpegPath(), ...env } });
};
export const playwrightEnv = (): NodeJS.ProcessEnv => {
  const pw = path.join(process.cwd(), "node_modules", "playwright", "index.mjs");
  return { ...(fs.existsSync(pw) ? { PLAYWRIGHT: pw } : {}), ...(process.platform === "win32" && fs.existsSync(REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH) ? { CHROME: REFACTOR_CONSTANTS.WINDOWS_CHROME_PATH } : {}) };
};
const drawWith = async (provider: BornasDrawProvider, prompt: string, headless: boolean, referenceImages: string[]): Promise<Buffer> => {
  const visualConfig = { generateType: GenerateType.Image, aspectRatio: "16:9", chromeHeadless: headless, ...(referenceImages.length ? { referenceImages } : {}) };
  const result =
    provider === "labs-flow"
      ? await generateImageWithPlaywright({ prompt, visualConfig: { ...visualConfig, generationMode: ImageGenerationMode.LabsFlow }, sandboxConfig: {} } as Parameters<typeof generateImageWithPlaywright>[0])
      : await generateImageWithGeminiChat({ prompt, visualConfig: { ...visualConfig, generationMode: ImageGenerationMode.GeminiChat } } as Parameters<typeof generateImageWithGeminiChat>[0]);
  const r = result as { success?: boolean; base64?: string | null; base64s?: string[]; fallbackUrl?: string; warning?: string };
  const data = r.base64 || r.base64s?.[0] || (r.fallbackUrl?.startsWith("data:") ? r.fallbackUrl.split(",")[1] : "");
  if (data) return Buffer.from(data, "base64");
  if (r.fallbackUrl?.startsWith("http")) {
    const res = await fetch(r.fallbackUrl);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(BORNAS_ERROR.DRAW(r.warning || ""));
};
export const bornasDraw = async (prompt: string, file: string, draw: BornasDrawChoice, refs: string[] = []): Promise<BornasDrawProvider> => {
  const referenceImages = refs.filter((f) => fs.existsSync(f)).map((f) => `data:image/${path.extname(f).slice(1) === "jpg" ? "jpeg" : path.extname(f).slice(1)};base64,${fs.readFileSync(f).toString("base64")}`);
  const order = draw.allowFallback ? [draw.provider, ...BORNAS_DRAW_PROVIDERS.filter((p) => p !== draw.provider)] : [draw.provider];
  let last: unknown;
  for (const provider of order) {
    try {
      const buf = await drawWith(provider, prompt, draw.chromeHeadless, referenceImages);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, buf);
      return provider;
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error(BORNAS_ERROR.DRAW(""));
};
export const readJson = <T>(file: string, fallback: T): T => {
  try {
    return (parseJson(fs.readFileSync(file, "utf8")) as T) ?? fallback;
  } catch {
    return fallback;
  }
};
export const writeJson = (file: string, value: unknown): void => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".tmp", stringifyJson(value));
  fs.renameSync(file + ".tmp", file);
};
export const slug = (text: string, max = 40): string =>
  _.deburr(text)
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max) || "item";
