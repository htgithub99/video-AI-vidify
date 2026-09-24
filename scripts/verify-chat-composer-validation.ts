import assert from "node:assert/strict";
import { assessChatComposerContent } from "../src/server/services/chatComposerValidation.ts";

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

process.stdout.write("Gemini, ChatGPT and Grok composer validation passed.\n");
