import { MOTION_ILLUSTRATION_POLICY as I } from "../constants/motionIllustrationPolicy.js";
import type { PuppetActorState } from "../types/motionPuppet.js";
export const illustrationSemanticText = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export const simplePuppetStates = (states: PuppetActorState[], evidence?: string): PuppetActorState[] =>
  states.map((state) => {
    if (!state || state.essential === true) return state;
    const optional = (I.OPTIONAL_POSTURES as readonly string[]).includes(state.posture || state.action) || (state.posture === "lie" && state.essential === false) || (state.support && I.INCIDENTAL_SUPPORT.test(state.support) && (!state.posture || state.posture === "idle"));
    if (!optional) return state;
    const placement = state.placement || (state.support && !I.INCIDENTAL_SUPPORT.test(state.support) && evidence ? { relation: "at" as const, anchor: state.support, evidence } : undefined);
    return { ...state, posture: "idle", action: "stand", support: undefined, gesture: undefined, target: undefined, placement };
  });
