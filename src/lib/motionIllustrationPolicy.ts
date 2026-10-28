import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../constants/motionIllustrationPolicy.js";
import type { PuppetActorState } from "../types/motionPuppet.js";
export const illustrationSemanticText = (text: string): string =>
  text
    .normalize(RT_CORE.NFD)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, RT_CORE.D)
    .replace(/Đ/g, RT_CORE.D_3F39D5)
    .toLowerCase();
export const simplePuppetStates = (states: PuppetActorState[], evidence?: string): PuppetActorState[] =>
  states.map((state) => {
    if (!state || state.essential === true) return state;
    const optional = (I.OPTIONAL_POSTURES as readonly string[]).includes(state.posture || state.action) || (state.posture === RT_SHARED.LIE && state.essential === false) || (state.support && I.INCIDENTAL_SUPPORT.test(state.support) && (!state.posture || state.posture === RT_SHARED.IDLE));
    if (!optional) return state;
    const placement = state.placement || (state.support && !I.INCIDENTAL_SUPPORT.test(state.support) && evidence ? { relation: RT_SHARED.AT, anchor: state.support, evidence } : undefined);
    return { ...state, posture: RT_SHARED.IDLE, action: RT_CORE.STAND, support: undefined, gesture: undefined, target: undefined, placement };
  });
