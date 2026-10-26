import assert from "node:assert/strict";
import { planningPromptTransport } from "../src/lib/chatPlanningUtils.js";
import { motionPromptBudget, motionPromptMeasurement } from "../src/lib/motionPrompt.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
const source = "Một đoạn nguồn 🛶 có lời kể. ".repeat(900);
for (const requested of [6000, 12000, 16000, 24000]) {
  const transport = planningPromptTransport(source, source.length + 150, requested);
  assert.equal(transport.limit, requested);
  assert.equal(transport.parts.join(""), source);
  for (const [index, part] of transport.parts.entries()) {
    const message = C.CONTEXT_PART("fixture_" + index, "fixture", index + 1, transport.parts.length, part);
    assert.ok(message.length + 150 < requested);
    assert.ok(!/[\uD800-\uDBFF]$/.test(part));
  }
}
assert.deepEqual(planningPromptTransport("short", 300, 16000).parts, []);
assert.equal(planningPromptTransport("short", 300, -1).limit, 6000);
const budget = motionPromptBudget("motion-puppet-read", "gemini-chat", "gemini-flash::low");
const wrapped = "x".repeat(budget + 1);
const measured = motionPromptMeasurement("x", wrapped, 0, 2, budget);
assert.equal(measured.overflow, true);
assert.equal(measured.wrapperChars, budget);
assert.equal(measured.images, 2);
assert.ok(planningPromptTransport(wrapped, wrapped.length, measured.budget).parts.length > 1);
console.log(JSON.stringify({ passed: true, finalWrapperBudget: true, transportUsesTaskBudget: true, unicodeIntact: true, videoCreated: false }));
