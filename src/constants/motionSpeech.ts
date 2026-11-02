export const MOTION_SPEECH = { ROLES: ["narration", "dialogue", "thought", "offscreen"], QUOTE_HEAD: 12, QUOTE_LOOKBACK: 4, QUOTE_BEFORE: /["“«'‘:：—–-]\s*$/, QUOTE_EDGES: /^["“«'‘—–\s]+|["”»'’\s]+$/g, WHITESPACE: /\s+/g, SPACE: " ", EMPTY: "" } as const;
export const MOTION_SPEECH_ATTRIBUTION = {
  REVISION: "speech-attribution-v1",
  LEAD: /^\s*([^.!?…:："“”«»‘’'\n]{1,140}?(?<![\p{L}\p{N}])(?:nói|hỏi|đáp|dặn|bảo|thì thào|quát|kêu|rít lên|gào|hét|said|says|asked|replied|whispered|shouted|screamed)\s*[:：]\s*)/iu,
  SELF: /^(?:toi|ta|tao|minh|chung toi|chung ta|i|we)\b/u,
  THIRD_PERSON: /^(?:a|no|han|co|anh|ba|ong|ga|nang|he|she)\b/u,
  QUOTES: { '"': '"', "“": "”", "«": "»", "‘": "’", "'": "'" } as Record<string, string>,
  OPEN_QUOTE: /^(?:\\)?["“«‘']/u,
  LETTER: /[\p{L}\p{N}]/u,
  SENTENCE_END: /[.!?…](?:\s+|$)/u,
  RESUME: /(?<=[.!?…])\s+(?:Nói xong|Hỏi xong|Dứt lời|Having said that|After saying that)\b/iu,
  NARRATOR_EMOTION: "neutral" as const,
  NARRATOR_INTENSITY: 0.3,
  RULE: 'Speech attribution outside quotations belongs to narrator: for Thầy Hai bảo: "Về đi.", split narrator="Thầy Hai bảo:" and thay_hai="Về đi." Apply this to every speaker, including "Ả rít lên:". Keep narrative text after the closing quote with narrator. A character quoting someone inside their own speech keeps that entire inner quotation in the character voice. Never alter, add or omit spoken words.',
} as const;
