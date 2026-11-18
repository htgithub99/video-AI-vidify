// The film shot scale the master frame follows (share of the measured frame side, see motionMasterBase): an extreme
// wide shot (establishing) shows a person at 1/8 of the frame, a wide shot at 1/4, a room's wide shot a little closer.
export type MotionMasterShot = "ews" | "ws" | "interior" | "map";
export const MOTION_MASTER = {
  SHOTS: { ews: [0.1, 0.14], ws: [0.22, 0.28], interior: [0.3, 0.36], map: [0, 1] } as Record<MotionMasterShot, readonly [number, number]>,
  // The genre's lean inside the wide-shot range.
  GENRE: { horror: 0.22, documentary: 0.24, story: 0.27, default: 0.25 },
  GENRE_WORDS: {
    horror: /horror|kinh dị|ghost|ma quái|mystery|bí ẩn|creepy|thriller|dread/i,
    story: /kid|child|thiếu nhi|explain|giải thích|education|giáo dục|tutorial|comedy|hài|fable|cổ tích|dialogue|đối thoại|verdict|story ?time|kể chuyện/i,
    documentary: /history|lịch sử|war|chiến|battle|trận|documentary|tài liệu|pov|witness|nhân chứng|chronicle|biên niên|military|quân sự/i,
  },
  // A portrait frame measures people against its width times this.
  PORTRAIT_WIDTH: 1.6,
  // The focal subject that is a thing: its longest side against the frame side it lies along.
  THING: { ews: [0.15, 0.25], ws: [0.3, 0.45], interior: [0.3, 0.45], map: [0, 1] } as Record<MotionMasterShot, readonly [number, number]>,
  // Old scenes are shrunk to the target only when the lead stands above the range's top, and never below this scale.
  LEAST_SCALE: 0.45,
} as const;
