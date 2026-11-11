export const CHAT_EXECUTION_POLICY = {
  SINGLE_ROOMS: 1,
  MULTI_ROOMS: 2,
  PROVIDER_BLOCK_MS: 120_000,
  MULTI_ROOM_PATHS: ["aiExecution.multiRoom", "execution.multiRoom", "multiRoom", "planningMultiRoom", "config.planningMultiRoom", "visualConfig.planningMultiRoom"],
  ALLOW_FALLBACK_PATHS: ["aiExecution.allowFallback", "execution.allowFallback", "allowFallback", "planningAllowFallback", "config.planningAllowFallback", "visualConfig.planningAllowFallback"],
  STORAGE_KEY: (screen: string): string => `chat-execution-policy:${screen}`,
  SCREENS: { MUSIC: "music", MUSIC_MIXER: "music-mixer", SHORTS: "shorts", FLOW: "flow", VIDEO_EXPORT: "video-export", VIDEO_GENERATION: "video-generation", CINEMATIC: "cinematic" },
  WORKER_ID: (base: string, index: number): string => (index === 0 ? base : `${base}-${index + 1}`),
} as const;
