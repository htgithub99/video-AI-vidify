import { createHash } from "node:crypto";
import { PROMPT_REFERENCE_DOC } from "../../constants/promptSourceData.js";
export const promptReferenceChat = (url: string): string | undefined => url.match(PROMPT_REFERENCE_DOC.CHAT_ID)?.[1];
export const promptReferenceDocs = (prompt: string, sent: ReadonlySet<string> = new Set()): { prompt: string; attachments: { name: string; mimeType: string; buffer: Buffer }[]; keys: string[] } => {
  const attachments: { name: string; mimeType: string; buffer: Buffer }[] = [];
  const keys: string[] = [];
  const next = prompt.replace(PROMPT_REFERENCE_DOC.BLOCK, (_match: string, name: string, body: string) => {
    const key = createHash(PROMPT_REFERENCE_DOC.HASH).update(name).update(body).digest(PROMPT_REFERENCE_DOC.HEX);
    if (sent.has(key)) return PROMPT_REFERENCE_DOC.REF_EARLIER(name);
    keys.push(key);
    attachments.push({ name, mimeType: PROMPT_REFERENCE_DOC.MIME, buffer: Buffer.from(body, PROMPT_REFERENCE_DOC.ENCODING) });
    return PROMPT_REFERENCE_DOC.REF(name);
  });
  return { prompt: next, attachments, keys };
};
