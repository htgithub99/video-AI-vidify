export type MotionMasterShot = "ews" | "ws" | "interior" | "map";
export const MOTION_MASTER = {
  SHOTS: { ews: [0.1, 0.14], ws: [0.22, 0.28], interior: [0.3, 0.36], map: [0, 1] } as Record<MotionMasterShot, readonly [number, number]>,
  GENRE: { horror: 0.22, documentary: 0.24, story: 0.27, default: 0.25 },
  GENRE_WORDS: { horror: /horror|kinh dị|ghost|ma quái|mystery|bí ẩn|creepy|thriller|dread/i, story: /kid|child|thiếu nhi|explain|giải thích|education|giáo dục|tutorial|comedy|hài|fable|cổ tích|dialogue|đối thoại|verdict|story ?time|kể chuyện/i, documentary: /history|lịch sử|war|chiến|battle|trận|documentary|tài liệu|pov|witness|nhân chứng|chronicle|biên niên|military|quân sự/i },
  PORTRAIT_WIDTH: 1.6,
  THING: { ews: [0.15, 0.25], ws: [0.3, 0.45], interior: [0.3, 0.45], map: [0, 1] } as Record<MotionMasterShot, readonly [number, number]>,
  LEAST_SCALE: 0.45,
} as const;
