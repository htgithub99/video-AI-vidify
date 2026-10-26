export const MOTION_APPEARANCE = {
  VERSION: 1,
  PARTS: ["face", "clothes", "hair", "body"] as const,
  FORMS: ["human", "revealed"] as const,
  COLORS: { white: "#eeeae2", gray: "#989c9e", black: "#17191e", red: "#713d42", blue: "#415569", green: "#4b6055" },
  COLOR_WORDS: { white: /\b(?:trang(?:\s+(?:bech|toat|muot))?|khong con mot giot mau|pale|white|bloodless)\b/, gray: /\b(?:xam(?:\s+ngoet)?|grey|gray|ashen)\b/, black: /\b(?:den|black)\b/, red: /\b(?:do|red)\b/, blue: /\b(?:xanh\s+(?:duong|lam)|blue)\b/, green: /\b(?:xanh\s+(?:luc|la)|green)\b/ },
  COLOR_EVIDENCE: { white: /trắng|không còn một giọt máu|\b(?:pale|white|bloodless)\b/i, gray: /xám|\b(?:grey|gray|ashen)\b/i, black: /đen|\bblack\b/i, red: /đỏ|\bred\b/i, blue: /xanh\s+(?:dương|lam)|\bblue\b/i, green: /xanh\s+(?:lục|lá)|\bgreen\b/i },
  PART_WORDS: { face: /\b(?:guong mat|khuon mat|sac mat|lan da|nuoc da|face|skin|mat(?=\s+(?:trang bech|xam ngoet)))\b/, clothes: /\b(?:ao|quan ao|vay|trang phuc|robe|dress|clothes|clothing)\b/, hair: /\b(?:toc|hair)\b/, body: /\b(?:toan than|ca nguoi|bong ma|bong trang|hinh nhan|whole body|apparition)\b/ },
  NEGATED: /\b(?:khong|chang|chua|not|never|without)\b[^,.;!?]{0,28}$/,
  REVEAL: /\b(?:trang bech|xam ngoet|lo nguyen hinh|hien nguyen hinh|khong con mot giot mau|bloodless|revealed|ashen)\b/,
  HUMAN: /\b(?:nguoi binh thuong|nhu nguoi song|quen thuoc|giong het|normal human|looks alive|disguised)\b/,
  READ: 'When a visible person has an explicitly described appearance, include states[].appearance={face?,clothes?,hair?,body?:"white|gray|black|red|blue|green",form?:"human|revealed",evidence:"exact source quote"}. Change only the named body part: a pale face does not mean white clothes. body means the whole apparition. Use form revealed only when its supernatural appearance is exposed, human when explicitly disguised as a living person. Omit unstated fields. Preserve identity and the established appearance until changed; never replace the person with a generic ghost overlay. Simple static illustrations must retain explicit color, participant count, identity, location and important clues even when difficult gestures are omitted.',
  GHOST:
    "Reuse the person's complete library character and identity. Preserve explicitly stated face, hair, clothing or whole-body colors and supernatural transformations using the supported appearance variants. A pale face changes the face, not the outfit. A disguised apparition can look alive until revealed; a revealed apparition uses a still unsettling expression. Do not invent gore, costumes, smoke, extra people or complex actions. appearanceOf reuses the living person's base asset, while evidence-backed appearance states may differ.",
  PROFILE: {
    background: { day: 0.88, night: 0.98, saturation: 0.78, sepia: 0.1 },
    vignette: 0.22,
    contextMargin: 0.35,
    contextHeight: 2.4,
    folkShots: { bust: { head: 0.46, top: 0.12 }, duo: { head: 0.36, top: 0.12 } },
    shots: { wide: { body: 0.2, feet: 0.84 }, people: { body: 0.46, feet: 0.86 }, two: { body: 0.46, feet: 0.86 }, group: { body: 0.4, feet: 0.86 }, back: { body: 0.46, feet: 0.86 }, ots: { body: 0.46, feet: 0.84 }, bust: { head: 0.32, top: 0.18 }, duo: { head: 0.27, top: 0.18 } },
  },
} as const;
