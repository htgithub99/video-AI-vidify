export const CHAT_ROOM_LIFECYCLE_VERIFICATION = {
  SOURCE: "src/server/services/chatUiPlanningService.ts",
  SOURCE_PATTERN: /chatUiPlanningService\.ts$/,
  HOOK: "await writeComposer(page, input, submittedPrompt, responseDirective, requestId, signal);",
  INJECT: "await globalThis.__chatRoomLifecycle.hold(roomKey); await writeComposer(page, input, submittedPrompt, responseDirective, requestId, signal);",
  ENTRY: "export { createRoom, getPlanningRoomKey, geminiRooms, providerGenerators, waitForRoomIdle }; export { CINEMATIC_CHAT_PLANNING_CONFIG as config } from '../../constants/cinematicConstants.js';",
  PLUGIN: "isolated-chat-room-lifecycle",
  BUNDLE: (pid: number) => `node_modules/.cache/chat-room-lifecycle-${pid}.mjs`,
  STORAGE: (pid: number) => `scratch/chat-room-lifecycle-${pid}`,
  CHROME: "chrome",
  HOST: "127.0.0.1",
  CONTENT_TYPE: "Content-Type",
  HTML_TYPE: "text/html; charset=utf-8",
  NETWORK: "**/*",
  URL: (port: number, worker: string) => `http://127.0.0.1:${port}/app/${worker}`,
  WORKERS: ["room-a", "room-b", "room-c"],
  PROJECT: "chat-room-lifecycle",
  ARTIFACT: "motion-puppet-read",
  REQUEST: (worker: string, index: number) => `${worker}-${index}`,
  PROMPT: (id: string) => `Return JSON with artifactType "motion-puppet-read" and requestId "${id}".`,
  GENERATOR: `async request => {
    const f = globalThis.__chatRoomLifecycle;
    const roomKey = getPlanningRoomKey(request);
    const page = await createRoom(f.context, f.url(request.workerId), geminiRooms, roomKey, request.signal);
    await page.evaluate(value => { window.nextResponse = value; }, { artifactType: request.artifactType, requestId: request.requestId, ready: true });
    return submitPrompt(page, roomKey, request.prompt, 'textarea', 'button', '.answer', '.busy', [], [], undefined, request.artifactType, request.requestId, request.signal, request.submission);
  }`,
  SET_GENERATOR: "export const installFixtureGenerator = () => { providerGenerators['gemini-chat'] = ",
  GENERATOR_END: "; };",
  DOCUMENT: `<textarea></textarea><button>Send</button><script>
    window.sendCount = 0;
    window.fixturePrompts = [];
    document.querySelector('button').onclick = () => {
      window.sendCount++;
      const prompt = document.querySelector('textarea').value;
      window.fixturePrompts.push(prompt);
      const receipt = prompt.match(/For this message only return raw JSON: (\\{[^\\n]*\\})/);
      document.querySelector('textarea').value = '';
      const answer = document.createElement('div');
      answer.className = 'answer';
      answer.textContent = JSON.stringify(receipt ? JSON.parse(receipt[1]) : window.nextResponse);
      document.body.append(answer);
    };
  </script>`,
  WAIT_MS: 15000,
  SLOW_READ_MS: 80,
  IDLE_WAIT_MS: 700,
  IDLE_POLLS: 12,
  BUSY_SELECTOR: ".busy",
  ANSWER_SELECTOR: ".answer",
  DEADLOCK: "Another room blocked the composer",
  PASSED: "Real browser room lifecycle passed: three independent composers, continued conversations without navigation, current response identity and two reloads preserving the conversation URL. No external AI requests.\n",
} as const;
