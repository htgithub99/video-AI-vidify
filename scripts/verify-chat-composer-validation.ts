import assert from "node:assert/strict";
import { assessChatComposerContent } from "../src/server/services/chatComposerValidation.ts";
import { readPlanningUi } from "../src/lib/chatPlanningUtils.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.ts";
import { confirmChatContextPart } from "../src/server/services/chatContextReceipt.ts";
assert.equal(await readPlanningUi(Promise.resolve(42), undefined, 50), 42);
await assert.rejects(readPlanningUi(new Promise(() => {}), undefined, 20), { message: C.UI_READ_TIMEOUT_ERROR });
await assert.rejects(readPlanningUi(new Promise(() => {}), undefined, 20, C.UI_READ_COMPOSER), { message: C.UI_READ_TIMEOUT_ERROR, name: C.UI_READ_TIMEOUT_NAME(C.UI_READ_COMPOSER) });
const cancelled = new AbortController();
const reading = readPlanningUi(new Promise(() => {}), cancelled.signal, 1000);
cancelled.abort();
await assert.rejects(reading, { message: C.CANCELLED_ERROR });
const directive = "Return only the complete raw JSON value required by the request, parseable directly with JSON.parse.";
const requestId = "music_123_style_analysis";
const body = `Compose a detailed Vietnamese music blueprint. Request ID: ${requestId}. ${"Describe rhythm, harmony and vocal character. ".repeat(60)}`;
const expected = `${body}\n\n${directive}`;
for (const provider of ["gemini", "chatgpt", "grok"]) {
  const visualText = expected.replaceAll(" ", "\u00a0").replaceAll("\n", "\n\n");
  assert.equal(assessChatComposerContent(expected, directive, requestId, ["", visualText, ""]).valid, true, `${provider}: visible editor text`);
  assert.equal(assessChatComposerContent(expected, directive, requestId, [expected, "", ""]).valid, true, `${provider}: input value`);
  assert.equal(assessChatComposerContent(expected, directive, requestId, ["", "", expected]).valid, true, `${provider}: DOM text`);
  assert.equal(assessChatComposerContent(expected, directive, requestId, [directive]).valid, false, `${provider}: directive alone`);
  assert.equal(assessChatComposerContent(expected, directive, requestId, [expected.replace(requestId, "wrong_request")]).valid, false, `${provider}: wrong request`);
}
const part = 3;
const partId = C.CONTEXT_PART_ID(requestId, part);
assert.ok(partId.endsWith("_3"));
const questions: string[] = [];
await confirmChatContextPart(expected, partId, part, async (question) => {
  questions.push(question);
  return { artifactType: C.CONTEXT_ARTIFACT, requestId: partId, receivedPart: questions.length === 1 ? part - 1 : part };
});
assert.equal(questions.length, 2);
assert.equal(questions[0], expected);
assert.equal(questions[1], C.CONTEXT_ACK_REPAIR(partId, part));
let failedReceipts = 0;
await assert.rejects(
  confirmChatContextPart(expected, partId, part, async () => {
    failedReceipts++;
    return { artifactType: C.CONTEXT_ARTIFACT, requestId: "other-request", receivedPart: part };
  }),
  { message: C.CONTEXT_ACK_ERROR },
);
assert.equal(failedReceipts, C.CONTEXT_ACK_REPAIRS + 1);
let failedServices = 0;
await assert.rejects(
  confirmChatContextPart(expected, partId, part, async () => {
    failedServices++;
    throw new Error(C.UI_READ_TIMEOUT_ERROR);
  }),
  { message: C.UI_READ_TIMEOUT_ERROR },
);
assert.equal(failedServices, 1);
const receiptRetries: number[] = [];
const refusalQuestions: string[] = [];
await confirmChatContextPart(
  expected,
  partId,
  part,
  async (question) => {
    refusalQuestions.push(question);
    if (refusalQuestions.length <= C.CONTEXT_ACK_REPAIRS) throw new Error(C.REFUSAL_RESPONSE_ERROR);
    return { artifactType: C.CONTEXT_ARTIFACT, requestId: partId, receivedPart: part };
  },
  undefined,
  (attempt) => {
    receiptRetries.push(attempt);
  },
);
assert.deepEqual(receiptRetries, [1, 2]);
assert.deepEqual(refusalQuestions, [expected, C.CONTEXT_ACK_REPAIR(partId, part), C.CONTEXT_ACK_REPAIR(partId, part)]);
let refusals = 0;
const refusal = new Error(C.REFUSAL_RESPONSE_ERROR);
await assert.rejects(
  confirmChatContextPart(expected, partId, part, async () => {
    refusals++;
    throw refusal;
  }),
  (error: Error) => error.message === C.CONTEXT_ACK_ERROR && error.cause === refusal,
);
assert.equal(refusals, C.CONTEXT_ACK_REPAIRS + 1);
const stopRetry = new AbortController();
let cancelledReceipts = 0;
await assert.rejects(
  confirmChatContextPart(
    expected,
    partId,
    part,
    async () => {
      cancelledReceipts++;
      throw refusal;
    },
    stopRetry.signal,
    () => {
      stopRetry.abort(new Error(C.CANCELLED_ERROR));
    },
  ),
  { message: C.CANCELLED_ERROR },
);
assert.equal(cancelledReceipts, 1);
process.stdout.write("Gemini, ChatGPT and Grok composer validation passed.\n");
