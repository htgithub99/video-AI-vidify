import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../../../constants/motionIllustrationPolicy.js";
import { illustrationSemanticText } from "../../../lib/motionIllustrationPolicy.js";
import { puppetKeyOf, puppetSourceQuote, puppetSupportTokens } from "../../../lib/motionPuppetValues.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { PuppetObject, PuppetRead } from "../../../types/motionPuppet.js";
import type { MotionCastMember } from "../../../types/motionVideo.js";
import type { MotionFieldIssue } from "../../../lib/motionAiRepair.js";
import { puppetObjectNounFits } from "../../../lib/motionPuppetAssets.js";
import { puppetReadObjects } from "../../../lib/motionReadObjects.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../../../constants/motionIllustrationNeeds.js";
import { puppetObjectParent, puppetObjectParentEvidence } from "../../../lib/motionPropSupport.js";
import { MOTION_STAGE_CONSTRAINTS as C } from "../../../constants/motionStageConstraints.js";
export const cleanPuppetObjectPlacement = (raw: any, text: string): PuppetObject["placement"] => {
  const anchor = puppetKeyOf(raw?.anchor);
  const evidence = typeof raw?.evidence === "string" && puppetSourceQuote(text, raw.evidence);
  return anchor && evidence ? { anchor, evidence } : undefined;
};
export const puppetObjectReleaseEvidence = (object: PuppetObject, line: PuppetLine): boolean =>
  line.text.split(I.CLAUSE).some((clause) => {
    const text = illustrationSemanticText(clause);
    const action = text.match(I.RELEASE_ACTION);
    return !!action && !I.NON_ACTUAL.test(text.slice(0, action.index)) && text.slice(action.index).includes(illustrationSemanticText(object.word));
  });
const sceneHistory = (line: PuppetLine, history: PuppetLine[]): PuppetLine[] => {
  let start = history.length - 1;
  while (start >= 0 && (!line.place || history[start].place === line.place) && (!line.visualUnit || history[start].visualUnit?.scene === line.visualUnit.scene)) start--;
  return history.slice(start + 1);
};
export const puppetParentEvidence = (object: PuppetObject, parent: PuppetObject, line: PuppetLine, history: PuppetLine[] = []): boolean => {
  for (const source of [...sceneHistory(line, history), line].reverse())
    for (const clause of source.text.split(I.CLAUSE).reverse()) {
      if (puppetObjectParentEvidence(object, parent, clause)) return true;
      const text = illustrationSemanticText(clause),
        word = illustrationSemanticText(object.word);
      const action = text.match(I.PROP_RELOCATION_ACTION);
      if (action && !I.NON_ACTUAL.test(text.slice(0, action.index)) && text.includes(word)) return false;
    }
  return false;
};
export const puppetHoldingEvidence = (object: PuppetObject, line: PuppetLine, cast: MotionCastMember[], history: PuppetLine[] = []): string | undefined => {
  const owner = cast.find((member) => member.key === object.owner);
  const labels = owner ? ([owner.key.replace(/_/g, RT_SHARED.SYMBOL_36A9E7), owner.name] as string[]).filter(Boolean).map(illustrationSemanticText) : [];
  const mentions = (text: string): boolean => labels.some((label) => new RegExp(RT_SERVER.P_L_P_N + label.replace(/[.*+?^${}()|[\]\\]/g, RT_SERVER.SYMBOL_CC839C) + RT_SERVER.P_L_P_N_581F14, RT_SERVER.U).test(text));
  const sources = sceneHistory(line, history);
  for (const source of [...sources, line].reverse())
    for (const clause of source.text.split(I.CLAUSE).reverse()) {
      const text = illustrationSemanticText(clause);
      const word = illustrationSemanticText(object.word);
      const release = text.match(I.RELEASE_ACTION);
      if (release && !I.NON_ACTUAL.test(text.slice(0, release.index)) && text.slice(release.index).includes(word)) return;
      const action = text.match(I.HOLD_ACTION);
      if (!action || I.NON_ACTUAL.test(text.slice(0, action.index)) || !text.slice(action.index).includes(word)) continue;
      if (I.TRANSFER_ACTION.test(action[0])) return mentions(text.slice(action.index! + action[0].length)) ? clause.trim() : undefined;
      if (mentions(text.slice(0, action.index)) || (source.speaker === object.owner && I.FIRST_PERSON.test(text.slice(0, action.index)))) return clause.trim();
      return;
    }
  return;
};
export const puppetIllustrationReadIssues = (read: PuppetRead, line: PuppetLine, cast: MotionCastMember[], history: PuppetLine[] = []): MotionFieldIssue[] => {
  const issues: MotionFieldIssue[] = [];
  history = sceneHistory(line, history);
  const objects = puppetReadObjects(read);
  for (const [index, object] of objects.entries()) {
    if (object.mount === RT_SHARED.FLOOR && object.support && !I.FLOOR_SUPPORT.test(object.support)) issues.push({ path: RT_SHARED.OBJECTS + index + RT_SHARED.SUPPORT, reason: C.SUPPORT_CONFLICT });
    const parent = puppetObjectParent(object, objects);
    if (parent && !puppetParentEvidence(object, parent, line, history)) issues.push({ path: RT_SHARED.OBJECTS + index + RT_SHARED.SUPPORT, reason: I.INVALID_PARENT });
    if (!puppetObjectNounFits(object)) issues.push({ path: RT_SHARED.OBJECTS + index + RT_SHARED.CATALOGKEY, reason: N.NOUN });
    if (([RT_SHARED.HELD, RT_SERVER.SHOULDER] as string[]).includes(object.mount) && !puppetHoldingEvidence(object, line, cast, history)) issues.push({ path: RT_SHARED.OBJECTS + index + RT_SERVER.OWNERSHIPEVIDENCE, reason: I.INVALID_HOLD });
  }
  const text = illustrationSemanticText(line.text);
  for (const clause of text.split(I.CLAUSE))
    for (const rule of I.ANCHORS) {
      for (const match of clause.matchAll(new RegExp(rule.pattern))) {
        const before = clause.slice(0, match.index);
        const after = clause.slice(match.index! + match[0].length);
        if (rule.key === RT_SERVER.DOOR && after.trim().startsWith(RT_SERVER.SO)) continue;
        const object = objects
          .filter((object) => {
            const at = before.lastIndexOf(illustrationSemanticText(object.word));
            return at >= 0 && before.length - at < 100;
          })
          .sort((a, b) => before.lastIndexOf(illustrationSemanticText(b.word)) - before.lastIndexOf(illustrationSemanticText(a.word)))[0];
        if (object) {
          if (([RT_SHARED.HELD, RT_SERVER.SHOULDER, RT_SERVER.WEAR, RT_SHARED.BODY] as string[]).includes(object.mount)) {
            const index = read.states?.findIndex((state) => state.char === object.owner) ?? -1;
            const state = read.states?.[index];
            if (state && state.placement?.anchor !== rule.key && !puppetSupportTokens(state.support || "").includes(rule.key)) issues.push({ path: RT_SERVER.STATES + index + RT_SERVER.PLACEMENT, reason: I.MISSING_ANCHOR(rule.key) });
            continue;
          }
          if (object.placement?.anchor !== rule.key && object.support !== rule.key && !object.support?.startsWith(rule.key + RT_SHARED.SYMBOL_D2E2AD)) issues.push({ path: RT_SHARED.OBJECTS + objects.indexOf(object) + RT_SERVER.PLACEMENT, reason: I.MISSING_ANCHOR(rule.key) });
          continue;
        }
        if (!before.trim()) continue;
        const mentions = cast
          .filter((member) => read.who.includes(member.key) && (!line.speaker || member.key === line.speaker))
          .flatMap((member) => {
            const labels = ([member.key.replace(/_/g, RT_SHARED.SYMBOL_36A9E7), member.name] as string[])
              .filter(Boolean)
              .map(illustrationSemanticText)
              .filter((label) => label.length > 1);
            return labels.flatMap((label) => [...before.matchAll(new RegExp(RT_SERVER.P_L_P_N + label.replace(/[.*+?^${}()|[\]\\]/g, RT_SERVER.SYMBOL_CC839C) + RT_SERVER.P_L_P_N_581F14, RT_SHARED.GU))].map((match) => ({ key: member.key, at: match.index! })));
          })
          .sort((a, b) => b.at - a.at);
        const char = mentions[0]?.key;
        if (!char) continue;
        const index = read.states?.findIndex((state) => state.char === char) ?? -1;
        const state = read.states?.[index];
        if (state && state.placement?.anchor !== rule.key && !puppetSupportTokens(state.support || "").includes(rule.key)) issues.push({ path: RT_SERVER.STATES + index + RT_SERVER.PLACEMENT, reason: I.MISSING_ANCHOR(rule.key) });
      }
    }
  return issues;
};
