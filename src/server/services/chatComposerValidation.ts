import { SOURCE_TEXT_CONTENT_MISSING, SOURCE_TEXT_CONTENT_SHORT, SOURCE_TEXT_DIRECTIVE_MISSING, SOURCE_TEXT_NFC, SOURCE_TEXT_REQUEST_MISSING, SOURCE_TEXT_VERIFIED } from "../../constants/sourceText";
export const normalizeChatComposerText = (value: string): string => value.normalize(SOURCE_TEXT_NFC).replace(/[\s\u00a0\u200b\u200c\u200d]/g, "");
export const assessChatComposerContent = (submittedPrompt: string, directive: string, requestId: string | undefined, readings: string[]): { valid: boolean; actualChars: number; reason: string } => {
  const expected = normalizeChatComposerText(submittedPrompt);
  const directiveEnd = normalizeChatComposerText(directive).slice(-60);
  const identity = normalizeChatComposerText(requestId || "");
  const expectedStart = expected.slice(0, 60);
  const expectedMiddle = expected.slice(Math.floor(expected.length / 2), Math.floor(expected.length / 2) + 60);
  const requiresIdentity = identity.length > 0 && expected.includes(identity);
  let actualChars = 0;
  let reason: string = SOURCE_TEXT_CONTENT_MISSING;
  for (const reading of readings) {
    const actual = normalizeChatComposerText(reading);
    actualChars = Math.max(actualChars, reading.length);
    const hasDirective = actual.includes(directiveEnd);
    const hasRequest = requiresIdentity ? actual.includes(identity) : actual.includes(expectedStart) && actual.includes(expectedMiddle);
    const hasEnoughContent = actual.length >= expected.length * 0.7;
    if (hasDirective && hasRequest && hasEnoughContent) return { valid: true, actualChars: reading.length, reason: SOURCE_TEXT_VERIFIED };
    reason = !hasRequest ? SOURCE_TEXT_REQUEST_MISSING : !hasDirective ? SOURCE_TEXT_DIRECTIVE_MISSING : SOURCE_TEXT_CONTENT_SHORT;
  }
  return { valid: false, actualChars, reason };
};
