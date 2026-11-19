import { MOTION_FIGURE_VOCAB as V } from "./motionFigureVocabulary.js";
const FIGURES_LINE = `8. FIGURES: one line \`FIGURES: id: fn, options; id: fn, options\` listing every person, animal, vehicle, building, tree and prop the picture draws (the REQUIRED ids first, a crowd as one entry with its count), each written only in these words so both renderers draw the same thing. person: outfit ${V.OUTFITS.join("|")}; colours of top, pants, cape or robe as #hex; head ${V.HEADS.filter((h) => h !== "none").join("|")}; hold ${V.HOLDS.join("|")}; pose per phase (a -> b) from ${V.POSES.join("|")}; expression per phase from ${V.EXPRESSIONS.join("|")}; barefoot, wounded, bandage head|arm|hand, tied, wet, dirty only when the narration says so. animal: kind and pose stand|walk|run|graze|lie. Any other thing: its plain noun (wagon, raft, tent, log, campfire) and what it is built of. A held thing outside the hold words is its own prop entry held in the hand. Nothing else describes a figure. Example: \`FIGURES: you: person, outfit soldier, top #6e5038, hold crossbow, pose sit -> sit, expression worried -> surprised; drover: person, outfit peasant, wounded, pose walk -> point, expression sad; log: prop log; tents: building tent, canvas\``;
export const MOTION_HTML_QUALITY = {
  KEY_PROGRESS: 0.5,
  DIP_SECONDS: 0.45,
  TITLE_STILL_SECONDS: 1.2,
  QUALITY_RETRIES: 1,
  REQUIRED_LINE: /^[ \t]*(?:\d+\.\s*)?REQUIRED\s*:\s*(.+)$/im,
  REQUIRED_ITEM: /^\s*([^:(]{1,40}?)\s*(?:\((focal|support)\))?\s*(?::|—|$)\s*(.*)$/i,
  REQUIRED_SEP: /\s*;\s*/,
  FOCAL: "focal",
  TEMPLATE: [
    "5. REQUIRED: one line `REQUIRED: id (focal): what it is; id (support): what it is` listing the 1-5 elements a viewer must see for this line to read: every person, animal or object that performs or receives the narrated action, the actor first and marked focal; ids are short lowercase words (king, banner, cattle, bridge). Focal elements stand in the foreground or midground at readable size (a focal person at least about an eighth of the frame height, larger in medium shots); 'small', 'distant' or 'in the background' describes only setting extras and crowd masses, never a focal element. A map lists the moving force (focal), the place it starts from and the place it is heading to (take the destination from the story even when these lines do not name it), the opposing force or the site of the fight when the story has one, and the rivers, mountains or borders that matter (support).",
    "6. MOTION: one line `MOTION: <focal subject> <start state> -> <end state>` naming the visible change across the scene (travel, gesture, turn, fall) plus the ambient motion; the key moment of the narrated action happens around the middle of the scene. When the covered lines tell several actions in a row, list them in spoken order as phases (`<subject> a -> b -> c`) so the picture shows each one while its line is spoken, instead of only the first. Say when an action repeats (marches, rows, fights, works) so it keeps going until the scene ends; never plan a scene whose only action is over in its first half.",
    "7. INTERACT: one line `INTERACT: id -> id; id -> id` naming only physical contact or a face-to-face exchange between REQUIRED ids at the same spot (grabs, hands over, strikes, pulls, speaks to; looking at, watching or reacting to something distant is not listed) (the refugee grabs the protagonist: `refugee -> protagonist`; the sergeant hands over the chains: `sergeant -> protagonist`), or `INTERACT: none`. REQUIRED ids say what the element is: a named cast member by its CAST key (the same id in every scene), another person by role, a group by a plural noun (soldiers, riders, villagers), a thing by its noun (wagon, bridge, tent, shield). Focal elements are people, groups, large vehicles or buildings; a small hand-held object (cup, letter, shield, chain) is always support and belongs to the person who holds it. Section 1 and FIGURES state every must-see body detail of a person the narration gives (barefoot, wounded, bound hands, soaked). Section 2 names only set dressing that belongs to this place and moment; nothing is added as filler.",
    FIGURES_LINE,
    "Consecutive scenes never repeat the same shot size with the same subject placement: change the shot size, the camera angle or the side the focal subject stands on. A loose prop (rope, tool, basket, stone) stays at most about half a standing person's height unless the narration makes it the subject. A map labels every place the narration names and draws an arrow for each movement; every arrow starts at a named place and ends at a named place, and the site of a battle or siege carries a battle mark, so a viewer who only sees the map knows who goes from where to where and where the fight is. In a scene with a river, lake or sea, say for every subject whether it is on the near bank, the far bank, a bridge, a boat or in the water.",
  ].join("\n"),
  BLANK: { RETRIES: 2, LOG: (id: string, frame: number, attempt: number) => `Xuất video: khung ${frame} của cảnh ${id} ra một màu trơn (trang mất canvas) – mở lại trang và vẽ lại khung này (lần ${attempt}).`, KEPT_LOG: (id: string) => `Xuất video: cảnh ${id} vẫn ra khung một màu sau khi mở lại trang – giữ nguyên và ghi cảnh báo.` },
  VARIETY: (shot: string, setting: string) => `VARIETY: the previous scene is also a ${shot} shot of ${setting}; frame this one differently (another framing or height, the focal subject on the other side, different depth layering) while keeping the SCENE's shot size.`,
  REVIEW_ARTIFACT: "motion-html-review",
  REVIEW_FILE: "review-",
  MOTION_LINE: /^[ \t]*(?:\d+\.\s*)?MOTION\s*:\s*(.+)$/im,
  EVENT_LINE: /Exact approved event:\s*([^\n]+)/i,
  REVIEW_PROMPT: (c: { narration: string; message: string; keyVisual: string; required: string; motion: string; event: string }) =>
    [
      "You check one frame (the middle of the scene) of an illustrated story video. A viewer sees it for two seconds while the narrator speaks; the picture must make the scene's message clear. Judge only content, never drawing style, colours or small details.",
      'First write in "shows" one short sentence of what the frame shows, as a viewer would say it. Then compare it with what the scene must say:',
      c.message ? `MESSAGE: ${c.message}` : "",
      c.keyVisual ? `KEY VISUAL: ${c.keyVisual}` : "",
      `NARRATION: ${c.narration}`,
      c.event ? `EVENT TO SHOW: ${c.event}` : "",
      c.required ? `MUST BE VISIBLE: ${c.required}` : "",
      c.motion ? `ACTION: ${c.motion}` : "",
      'Answer with JSON only: {"shows": "...", "ok": true} when a viewer gets the message, or {"shows": "...", "ok": false, "problems": ["..."]} with at most 5 short, concrete problems: the key subject, action or object missing, too small or unrecognisable, the eye drawn to something else, people or things in impossible places (fire or people standing on open water, things floating in the sky, a bridge that does not cross the water, a building cut in half), the wrong side of a river, or a frame that contradicts the narration (night for day, a crowd for one man, the wrong era).',
    ]
      .filter(Boolean)
      .join("\n"),
  REVIEW_LOG: (id: string, problems: string[]) => `Cảnh HTML ${id}: AI duyệt ảnh thấy chưa đúng nội dung (${problems.join("; ")}) – tạo lại 1 lần kèm yêu cầu sửa.`,
  REVIEW_SKIP_LOG: (id: string, reason: string) => `Cảnh HTML ${id}: bỏ qua bước AI duyệt ảnh (${reason}).`,
} as const;
