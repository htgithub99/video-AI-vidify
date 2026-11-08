import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { HORROR_CHARACTER_DIRECTION as H } from "../constants/motionProfiles/horror/characterDirection.js";
export const motionHorrorAppearance = (value: string): string => {
  if (!H.lowerAnatomy.test(value)) return value;
  return value
    .split(H.identitySeparators)
    .flatMap((part) => (H.lowerAnatomy.test(part) ? part.split(H.identityConjunctions) : [part]))
    .map((part) => part.trim())
    .filter((part) => part && !H.lowerAnatomy.test(part))
    .join(RT_MAINTENANCE.SEMICOLON_SPACE);
};
const cleanAppearance = (record: Record<string, any>, field: string) => (typeof record?.[field] === "string" ? { ...record, [field]: motionHorrorAppearance(record[field]) } : record);
export const motionHorrorSceneContext = (context: Record<string, any>): Record<string, any> => ({
  ...context,
  ...(Array.isArray(context.cast) ? { cast: context.cast.map((member: Record<string, any>) => cleanAppearance(member, RT_MAINTENANCE.LOOK)) } : {}),
  ...(Array.isArray(context.groups) ? { groups: context.groups.map((group: Record<string, any>) => cleanAppearance(group, RT_MAINTENANCE.LOOK)) } : {}),
  ...(Array.isArray(context.identityMemory) ? { identityMemory: context.identityMemory.map((memory: Record<string, any>) => cleanAppearance(memory, RT_MAINTENANCE.APPEARANCE)) } : {}),
  ...(Array.isArray(context.identityContrast) ? { identityContrast: context.identityContrast.map((entry: Record<string, any>) => ({ ...entry, ...(Array.isArray(entry.traits) ? { traits: entry.traits.map((trait: string) => motionHorrorAppearance(trait)).filter(Boolean) } : {}) })) } : {}),
  ...(context.continuity ? { continuity: cleanAppearance(context.continuity, RT_MAINTENANCE.NOTES) } : {}),
});
