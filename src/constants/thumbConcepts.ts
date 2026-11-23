export const THUMB_CONCEPTS = ["trophy", "split", "action", "curiosity", "mood"] as const;
export type ThumbConcept = (typeof THUMB_CONCEPTS)[number];
export const THUMB_CONCEPT_TEXT = { vi: { trophy: "Thành quả", split: "Đối lập", action: "Cao trào", curiosity: "Tò mò", mood: "Điện ảnh", signature: "Mẫu kênh" }, en: { trophy: "Trophy", split: "Split", action: "Mid-action", curiosity: "Curiosity", mood: "Cinematic mood", signature: "Channel look" } } as const;
export const THUMB_CONCEPT_BRIEF: Record<ThumbConcept, string> = {
  trophy: "TROPHY: the most impressive result of the video (the finished meal, the catch, the finished build) pushed close to the lens and large, with the place or the person softly blurred or in contrast behind it, so the viewer sees the reward first and wants to know how it was made.",
  split: "SPLIT: the frame divided in two halves with one strong contrast (cold storm outside vs warm glowing inside, bare site vs finished build, homemade vs expensive), each half instantly readable.",
  action: "MID-ACTION: the peak moment frozen mid-motion (the axe splitting a big log, the rod bending as the fish fights, flames bursting into the dark), dynamic angle, a feeling of movement and urgency.",
  curiosity: "CURIOSITY GAP: one unusual or unfinished element as the visual question (a strange corner of the build, an object partly hidden or circled, a surprised face looking at something outside the frame) that only the video answers.",
  mood: "CINEMATIC MOOD: beautiful natural light (golden hour, morning mist, firelight at night) with a still subject (the person and the animal warming up by the stove), a cosy place the viewer wants to escape into.",
};
export type ThumbCaption = "top" | "topleft" | "topright" | "bottom";
export const THUMB_CAPTION: Record<ThumbConcept, ThumbCaption> = { trophy: "topleft", split: "top", action: "topright", curiosity: "topleft", mood: "bottom" };
export const THUMB_CAPTION_SPACE: Record<ThumbCaption, string> = {
  top: "Caption space: keep the top 26% of the frame calm and darker (sky, wall, roof or shadow) with nothing important in it; every head sits below that band.",
  topleft: "Caption space: keep the top-left area (left 60%, top 34% of the frame) calm and simple (sky, wall, trees or shadow) with nothing important in it; the main character and the highlight stay out of it.",
  topright: "Caption space: keep the top-right area (right 60%, top 34% of the frame) calm and simple (sky, wall, trees or shadow) with nothing important in it; the main character and the highlight stay out of it.",
  bottom: "Caption space: keep the bottom 26% of the frame calm and darker (floor, ground, table edge or shadow) with nothing important in it; faces and the highlight sit above it.",
};
export const THUMB_GOLDEN_RULES = "Thumbnail rules: one single focal point that is still recognisable when the picture is shrunk to the size of a thumb; no clutter of small details; text (if any) 2-4 words that add emotion or a surprise and never repeat the title, numbers only if the video shows them.";
export const thumbConceptPick = <T extends string>(order: readonly T[], taken: readonly string[], previous?: string): T => order.find((c) => c !== previous && !taken.includes(c)) || order.find((c) => c !== previous) || order[0];
