const stringSchema = { type: "string" } as const;
const numberScoreSchema = { type: "integer", minimum: 0, maximum: 100 } as const;
const stringArraySchema = { type: "array", items: stringSchema } as const;

export const CONTENT_SAFETY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sensitiveTopic", "trueCase", "minorsInvolved", "sexualExploitationRisk", "victimExploitationRisk", "privacyRisk", "likenessRisk", "copyrightRisk", "requiredDisclosures", "blockingErrors", "warnings"],
  properties: {
    sensitiveTopic: { type: "boolean" }, trueCase: { type: "boolean" }, minorsInvolved: { type: "boolean" },
    sexualExploitationRisk: { type: "boolean" }, victimExploitationRisk: { type: "boolean" }, privacyRisk: { type: "boolean" },
    likenessRisk: { type: "boolean" }, copyrightRisk: { type: "boolean" }, requiredDisclosures: stringArraySchema,
    blockingErrors: stringArraySchema, warnings: stringArraySchema,
  },
} as const;

export const HOOK_RESPONSE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["audience", "triggers", "angles", "versions"],
  properties: {
    audience: stringSchema, triggers: stringArraySchema,
    angles: { type: "array", items: { type: "object", required: ["name", "rationale"], properties: { name: stringSchema, rationale: stringSchema } } },
    versions: { type: "array", minItems: 1, items: { type: "object", required: ["id", "content", "type", "score"], properties: {
      id: stringSchema, content: stringSchema, type: stringSchema,
      score: { type: "object", required: ["retention", "clarity", "emotion", "factualSafety", "unsupportedClaim", "reasons"], properties: {
        retention: numberScoreSchema, clarity: numberScoreSchema, emotion: numberScoreSchema, factualSafety: numberScoreSchema,
        unsupportedClaim: { type: "boolean" }, reasons: stringArraySchema,
      } },
    } } },
  },
} as const;

export const CHAPTER_RESPONSE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["scriptSegment"], properties: { scriptSegment: stringSchema },
} as const;

export const SCRIPT_PLAN_RESPONSE_SCHEMA = {
  type: "object", required: ["theme", "characterSpecs", "preferredTerms", "factCheckNotes", "creativeBrief", "factPack", "chapters"],
  properties: {
    theme: stringSchema, characterSpecs: stringSchema, preferredTerms: stringArraySchema, factCheckNotes: stringSchema,
    creativeBrief: { type: "object" }, factPack: { type: "object" },
    chapters: { type: "array", minItems: 3, items: { type: "object", required: ["id", "title", "description"], properties: { id: stringSchema, title: stringSchema, description: stringSchema } } },
  },
} as const;

export const SCRIPT_QA_RESPONSE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["continuityScore", "repetitionScore", "factualityScore", "emotionalArcScore", "conversationalScore", "hookPayoffScore", "blockingErrors", "warnings", "suggestedPatches"],
  properties: {
    continuityScore: numberScoreSchema, repetitionScore: numberScoreSchema, factualityScore: numberScoreSchema,
    emotionalArcScore: numberScoreSchema, conversationalScore: numberScoreSchema, hookPayoffScore: numberScoreSchema,
    blockingErrors: stringArraySchema, warnings: stringArraySchema, suggestedPatches: stringArraySchema,
  },
} as const;

const visualQaProperties = {
  anatomy: numberScoreSchema, subjectCount: numberScoreSchema, promptAlignment: numberScoreSchema,
  characterConsistency: numberScoreSchema, composition: numberScoreSchema, styleConsistency: numberScoreSchema,
  editability: numberScoreSchema, usableForVideo: { type: "boolean" }, blockingErrors: stringArraySchema,
  warnings: stringArraySchema, correctivePrompt: stringSchema,
} as const;
export const VISUAL_QA_RESPONSE_SCHEMA = { type:"object",additionalProperties:false,required:Object.keys(visualQaProperties),properties:visualQaProperties } as const;

export const STORYBOARD_QA_RESPONSE_SCHEMA = { type:"object",additionalProperties:false,required:["continuityScore","shotDiversityScore","visibleActionScore","editabilityScore","blockingErrors","warnings"],properties:{continuityScore:numberScoreSchema,shotDiversityScore:numberScoreSchema,visibleActionScore:numberScoreSchema,editabilityScore:numberScoreSchema,blockingErrors:stringArraySchema,warnings:stringArraySchema} } as const;

export const FINAL_VIDEO_QA_RESPONSE_SCHEMA = { type:"object",additionalProperties:false,required:["visualScore","cropScore","continuityScore","pacingScore","transitionVarietyScore","promiseAlignmentScore","blockingErrors","warnings"],properties:{visualScore:numberScoreSchema,cropScore:numberScoreSchema,continuityScore:numberScoreSchema,pacingScore:numberScoreSchema,transitionVarietyScore:numberScoreSchema,promiseAlignmentScore:numberScoreSchema,blockingErrors:stringArraySchema,warnings:stringArraySchema} } as const;
