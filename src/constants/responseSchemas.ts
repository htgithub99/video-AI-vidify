const stringSchema = { type: "string" } as const;
const numberScoreSchema = { type: "integer", minimum: 0, maximum: 100 } as const;
const stringArraySchema = { type: "array", items: stringSchema } as const;
const narrativeBeatTypeSchema = { type: "string", enum: ["hook", "setup", "temptation", "decision", "reward", "escalation", "reversal", "false_victory", "collapse", "payoff"] } as const;
const characterArcSchema = {
  type: "object",
  additionalProperties: false,
  required: ["initialState", "emotionalLack", "externalGoal", "internalNeed", "temptation", "firstCompromise", "escalatingChoices", "pointOfNoReturn", "falseVictory", "collapse", "finalCost", "realization"],
  properties: {
    initialState: stringSchema,
    emotionalLack: stringSchema,
    externalGoal: stringSchema,
    internalNeed: stringSchema,
    temptation: stringSchema,
    firstCompromise: stringSchema,
    escalatingChoices: stringArraySchema,
    pointOfNoReturn: stringSchema,
    falseVictory: stringSchema,
    collapse: stringSchema,
    finalCost: stringSchema,
    realization: stringSchema,
  },
} as const;
const narrativePlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["viewerPromise", "centralQuestion", "protagonist", "beats", "callbacks", "endingPayoff"],
  properties: {
    viewerPromise: stringSchema,
    centralQuestion: stringSchema,
    protagonist: characterArcSchema,
    beats: {
      type: "array",
      minItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "type", "event", "characterStateBefore", "characterStateAfter", "visibleAction", "retentionPurpose", "targetDurationSeconds"],
        properties: {
          id: stringSchema,
          type: narrativeBeatTypeSchema,
          event: stringSchema,
          characterStateBefore: stringSchema,
          characterStateAfter: stringSchema,
          visibleAction: stringSchema,
          retentionPurpose: stringSchema,
          targetDurationSeconds: { type: "number", minimum: 1 },
          callbackId: stringSchema,
        },
      },
    },
    callbacks: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "setupBeatId", "payoffBeatId", "motif", "changedMeaning"], properties: { id: stringSchema, setupBeatId: stringSchema, payoffBeatId: stringSchema, motif: stringSchema, changedMeaning: stringSchema } },
    },
    endingPayoff: stringSchema,
  },
} as const;
const chapterPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "description", "purpose", "requiredBeatIds", "characterStartState", "characterEndState", "callbackSetupIds", "callbackPayoffIds", "forbiddenRepetition", "handoffToNextChapter"],
  properties: {
    id: stringSchema,
    title: stringSchema,
    description: stringSchema,
    purpose: stringSchema,
    requiredBeatIds: stringArraySchema,
    characterStartState: stringSchema,
    characterEndState: stringSchema,
    callbackSetupIds: stringArraySchema,
    callbackPayoffIds: stringArraySchema,
    forbiddenRepetition: stringArraySchema,
    handoffToNextChapter: stringSchema,
  },
} as const;

export const CONTENT_SAFETY_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sensitiveTopic", "trueCase", "minorsInvolved", "sexualExploitationRisk", "victimExploitationRisk", "privacyRisk", "likenessRisk", "copyrightRisk", "requiredDisclosures", "blockingErrors", "warnings"],
  properties: {
    sensitiveTopic: { type: "boolean" },
    trueCase: { type: "boolean" },
    minorsInvolved: { type: "boolean" },
    sexualExploitationRisk: { type: "boolean" },
    victimExploitationRisk: { type: "boolean" },
    privacyRisk: { type: "boolean" },
    likenessRisk: { type: "boolean" },
    copyrightRisk: { type: "boolean" },
    requiredDisclosures: stringArraySchema,
    blockingErrors: stringArraySchema,
    warnings: stringArraySchema,
  },
} as const;

export const HOOK_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["audience", "triggers", "angles", "versions"],
  properties: {
    audience: stringSchema,
    triggers: stringArraySchema,
    angles: { type: "array", items: { type: "object", required: ["name", "rationale"], properties: { name: stringSchema, rationale: stringSchema } } },
    versions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "content", "type"],
        properties: {
          id: stringSchema,
          content: stringSchema,
          type: stringSchema,
          score: {
            type: "object",
            required: ["retention", "clarity", "emotion", "factualSafety", "unsupportedClaim", "reasons"],
            properties: {
              retention: numberScoreSchema,
              clarity: numberScoreSchema,
              emotion: numberScoreSchema,
              factualSafety: numberScoreSchema,
              unsupportedClaim: { type: "boolean" },
              reasons: stringArraySchema,
            },
          },
        },
      },
    },
  },
} as const;

export const CHAPTER_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scriptSegment"],
  properties: { scriptSegment: stringSchema },
} as const;

export const FINAL_SCRIPT_EDIT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scriptSegment", "continuityScore", "repetitionScore", "factualityScore", "emotionalArcScore", "conversationalScore", "hookPayoffScore", "warnings", "suggestedPatches"],
  properties: {
    scriptSegment: stringSchema,
    continuityScore: numberScoreSchema,
    repetitionScore: numberScoreSchema,
    factualityScore: numberScoreSchema,
    emotionalArcScore: numberScoreSchema,
    conversationalScore: numberScoreSchema,
    hookPayoffScore: numberScoreSchema,
    warnings: stringArraySchema,
    suggestedPatches: stringArraySchema,
  },
} as const;

export const SCRIPT_PLAN_RESPONSE_SCHEMA = {
  type: "object",
  required: ["theme", "characterSpecs", "preferredTerms", "factCheckNotes", "creativeBrief", "narrativePlan", "factPack", "chapters"],
  properties: {
    theme: stringSchema,
    characterSpecs: stringSchema,
    preferredTerms: stringArraySchema,
    factCheckNotes: stringSchema,
    creativeBrief: { type: "object" },
    narrativePlan: narrativePlanSchema,
    factPack: { type: "object" },
    chapters: { type: "array", minItems: 3, items: chapterPlanSchema },
  },
} as const;

const visualQaProperties = {
  anatomy: numberScoreSchema,
  subjectCount: numberScoreSchema,
  promptAlignment: numberScoreSchema,
  narrativeAlignment: numberScoreSchema,
  environmentRelevance: numberScoreSchema,
  characterConsistency: numberScoreSchema,
  composition: numberScoreSchema,
  styleConsistency: numberScoreSchema,
  editability: numberScoreSchema,
  usableForVideo: { type: "boolean" },
  blockingErrors: stringArraySchema,
  unwantedText: { type: "boolean" },
  multiPanelLayout: { type: "boolean" },
  duplicatedSubjects: { type: "boolean" },
  warnings: stringArraySchema,
} as const;
export const VISUAL_QA_RESPONSE_SCHEMA = { type: "object", additionalProperties: false, required: Object.keys(visualQaProperties), properties: visualQaProperties } as const;

export const VISUAL_STYLE_PROFILE_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["medium", "characterType", "characterDna", "lineDna", "shapeLanguage", "colorDna", "colorPhilosophy", "renderingDna", "lightingStyle", "texture", "detailLevel", "visualComplexity", "periodCues", "worldRendering", "compositionLanguage", "facialExpressionLanguage", "overallMood", "adaptiveElements", "negativeStylePrompt", "sampleSpecificContent", "lockedStyleElements", "flexibleElements"],
  properties: {
    medium: stringSchema,
    characterType: stringSchema,
    characterDna: stringSchema,
    lineDna: stringSchema,
    shapeLanguage: stringSchema,
    colorDna: stringSchema,
    colorPhilosophy: stringSchema,
    renderingDna: stringSchema,
    lightingStyle: stringSchema,
    texture: stringSchema,
    detailLevel: stringSchema,
    visualComplexity: stringSchema,
    periodCues: stringSchema,
    worldRendering: stringSchema,
    compositionLanguage: stringSchema,
    facialExpressionLanguage: stringSchema,
    overallMood: stringSchema,
    adaptiveElements: stringSchema,
    negativeStylePrompt: stringSchema,
    sampleSpecificContent: stringArraySchema,
    lockedStyleElements: stringArraySchema,
    flexibleElements: stringArraySchema,
  },
} as const;

export const VISUAL_BIBLE_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["colorPalette", "characterSpecs", "landscapeSpecs", "lightingMood", "visualStyle", "background", "lineStyle", "colorMode", "shading", "textPolicy", "locations", "props"],
  properties: {
    colorPalette: stringSchema,
    characterSpecs: stringSchema,
    landscapeSpecs: stringSchema,
    lightingMood: stringSchema,
    visualStyle: stringSchema,
    background: stringSchema,
    lineStyle: stringSchema,
    colorMode: stringSchema,
    shading: stringSchema,
    textPolicy: stringSchema,
    locations: {
      type: "array",
      minItems: 1,
      items: { type: "object", additionalProperties: false, required: ["id", "name", "visualAnchors", "geography", "timeProgression"], properties: { id: stringSchema, name: stringSchema, visualAnchors: stringArraySchema, geography: stringSchema, timeProgression: stringSchema } },
    },
    props: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "name", "visualAnchors", "narrativeFunction"], properties: { id: stringSchema, name: stringSchema, visualAnchors: stringArraySchema, narrativeFunction: stringSchema } } },
  },
} as const;

export const FINAL_VIDEO_QA_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["visualScore", "cropScore", "continuityScore", "pacingScore", "transitionVarietyScore", "promiseAlignmentScore", "audioMixScore", "subtitleLegibilityScore", "blockingErrors", "warnings"],
  properties: {
    visualScore: numberScoreSchema,
    cropScore: numberScoreSchema,
    continuityScore: numberScoreSchema,
    pacingScore: numberScoreSchema,
    transitionVarietyScore: numberScoreSchema,
    promiseAlignmentScore: numberScoreSchema,
    audioMixScore: numberScoreSchema,
    subtitleLegibilityScore: numberScoreSchema,
    blockingErrors: stringArraySchema,
    warnings: stringArraySchema,
  },
} as const;

export const CINEMATIC_EDIT_DECISION_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sceneId", "bestInSeconds", "bestOutSeconds", "takeDecision", "recommendedTransition", "audioBridgeMode", "continuityScore", "storyClarityScore", "performanceScore", "entryStateObserved", "exitStateObserved", "dominantAction", "supportShotType", "reason", "warnings"],
        properties: {
          sceneId: stringSchema,
          bestInSeconds: { type: "number", minimum: 0 },
          bestOutSeconds: { type: "number", minimum: 0 },
          takeDecision: { type: "string", enum: ["use", "trim", "omit"] },
          recommendedTransition: { type: "string", enum: ["cut", "match_cut", "cross_dissolve", "fade_black"] },
          audioBridgeMode: { type: "string", enum: ["hard", "j_cut", "l_cut", "ambience"] },
          continuityScore: numberScoreSchema,
          storyClarityScore: numberScoreSchema,
          performanceScore: numberScoreSchema,
          entryStateObserved: stringSchema,
          exitStateObserved: stringSchema,
          dominantAction: stringSchema,
          supportShotType: { type: "string", enum: ["none", "reaction", "insert", "environment", "aftermath"] },
          reason: stringSchema,
          warnings: stringArraySchema,
        },
      },
    },
  },
} as const;

export const VIDEO_PROMPT_POLICY_REPAIR_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["violatesPolicy", "repairedPrompt", "risks", "rationale"],
  properties: { violatesPolicy: { type: "boolean" }, repairedPrompt: stringSchema, risks: stringArraySchema, rationale: stringSchema },
} as const;
