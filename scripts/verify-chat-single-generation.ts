import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(`scratch/chat-single-generation-${process.pid}`);
const output = path.resolve(`node_modules/.cache/chat-single-generation-${process.pid}.mjs`);
try {
  const bundle = await build({
    entryPoints: ["src/server/services/chatUiPlanningService.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "single-generation-room-fixture",
        setup(builder) {
          builder.onLoad({ filter: /chatUiPlanningService\.ts$/ }, async (args) => ({
            loader: "ts",
            contents:
              (await fs.readFile(args.path, "utf8")) +
              `
      export const verifySingleGenerationRequest = async (message, completed) => {
        let sends = 0, reloads = 0;
        const provider = AiPlanningFallbackProvider.GeminiChat;
        const request = {provider, projectId: 'single-generation', workerId: 'worker', model: AiPlanningChatModel.GeminiFlash, prompt: 'Build this scene', artifactType: 'motion-html-scene', oneGeneration: true, submission: {attempted: false, completed: false}};
        const key = getPlanningRoomKey(request);
        const prior = providerGenerators[provider];
        const locator = {filter: () => locator, count: async () => 0};
        const page = {isClosed: () => false, url: () => 'https://gemini.google.com/app/fixture', locator: () => locator, reload: async () => { reloads++; }};
        geminiRooms.set(key,page);
        providerGenerators[provider] = async () => { sends++; request.submission.attempted = true; request.submission.completed = completed; throw new Error(message); };
        try { await generatePlanningWithChatUiTask(request); throw new Error('Fixture unexpectedly succeeded'); }
        catch(error) { return {sends,reloads,message:error.message,completed:request.submission.completed,recoveryComplete:!!error[RECOVERY.COMPLETE],uncertain:!!error[AIR.UNCERTAIN_FLAG]}; }
        finally { providerGenerators[provider] = prior; geminiRooms.delete(key); }
      };
    `,
          }));
        },
      },
    ],
  });
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bundle.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  for (const [message, completed] of [
    [C.PROVIDER_ERROR_RESPONSE_ERROR, false],
    [C.INVALID_JSON_RESPONSE_ERROR, true],
    [C.UI_READ_TIMEOUT_ERROR, false],
    ["Execution context was destroyed", false],
  ] as const) {
    const result = await service.verifySingleGenerationRequest(message, completed);
    assert.equal(result.sends, 1, message);
    assert.equal(result.reloads, 0, message);
    assert.equal(result.recoveryComplete, true, message);
    const pending = message === C.UI_READ_TIMEOUT_ERROR || message === "Execution context was destroyed";
    assert.equal(result.uncertain, pending, message);
    assert.equal(result.completed, !pending, message);
  }
  process.stdout.write("Single-generation recovery passed: no reload or regenerate loops after submitted errors, definite failures remain complete and unknown responses stay pending.\n");
} finally {
  await fs.rm(output, { force: true });
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
