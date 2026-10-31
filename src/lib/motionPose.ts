import { motionSemanticText } from "./motionResourceSemantics.js";
export interface MotionPoseInput {
  posture?: string;
  pose?: string;
  description?: string;
}
const specialPose = (text: string, bare = true) =>
  /\b(?:riding|mounted|cuoi ngua)\b/.test(text)
    ? "riding"
    : /\b(?:lying|reclin\w*|lies?)\b|\b(?:dang nam|nam (?:tren|duoi|ngua|sap|nghieng))\b/.test(text) || (bare && text === "nam")
      ? "lying"
      : /\b(?:crouch\w*|squat\w*|ngoi xom)\b/.test(text)
        ? "crouching"
        : /\bkneel\w*\b|\b(?:dang quy|quy (?:xuong|tren|mot|hai|bang|truoc|goi))\b/.test(text) || (bare && text === "quy")
          ? "kneeling"
          : /\b(?:cross.?legged|lotus|xep bang)\b/.test(text)
            ? "crossLegged"
            : /\b(?:seated|sitting|sit|ngoi)\b/.test(text)
              ? "seated"
              : undefined;
export const motionPose = (node: MotionPoseInput) => {
  const explicit = motionSemanticText([node.posture, node.pose].filter(Boolean).join(" "));
  const special = specialPose(motionSemanticText(node.pose || "")) || specialPose(motionSemanticText(node.posture || ""));
  if (special) return { kind: special, text: explicit };
  const subject = motionSemanticText(node.description || "").split(/\b(?:looks? at|watches?|beside|behind|near|nhin|canh|phia sau)\b/)[0];
  const described = !/\b(?:standing|walking|running|dung|di bo|chay)\b/.test(subject) && specialPose(subject, false);
  return { kind: described || "standing", text: described ? subject : explicit };
};
