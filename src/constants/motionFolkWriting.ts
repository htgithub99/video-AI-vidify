import { MOTION_STORY_LANGUAGE as L } from "./motionStoryLanguage.js";
export const MOTION_FOLK_WRITING = {
  VERSION: 2,
  MIN_SENTENCES: 3,
  LONG_SENTENCE: 20,
  MEAN_WARNING: 18,
  LONG_SHARE: 0.6,
  HEAVY_PHRASES: /(?:nỗi kinh hoàng tột độ|bầu không khí quỷ dị|một thế lực vô hình|tiến hành kiểm tra khu vực)/giu,
  RULE: "VĂN PHONG KỲ TRUYỆN MA DÂN GIAN: người trong cuộc kể lại, lời quen tai, xưng hô rõ quan hệ và vùng đã chọn. Một câu một ý chính; phần lớn câu ngắn/vừa, thường khoảng 5–14 tiếng khi hợp ý, được xen câu dài tự nhiên; đây không phải quota. Một hình/beat có thể đi với nhiều câu, giữ chung utterance khi chưa đổi người nói. Dùng câu ngắn để khẳng định, ngập ngừng, đảo ý; lặp cấu trúc khi thêm thông tin hoặc tăng cấp, bỏ lặp chỉ để kéo dài. Kể việc nhìn/nghe/làm trước khi diễn giải. Gợi sợ từ điều bình thường sai đi; tiết chế chuỗi tính từ. Hỏi đáp ngắn tại chỗ nhân vật thực sự trao đổi, không ép tỷ lệ thoại hoặc thêm người. Giữ cảm xúc gia đình qua lời nói/việc làm, kết bằng việc cụ thể còn ám ảnh. Nén sinh hoạt; kể rõ phát hiện/lựa chọn/hậu quả trong thời lượng đã chọn. Đề tài nguồn, diễn biến mới, ngôn ngữ đọc và cấu hình sản xuất vẫn là chuẩn bắt buộc; không đưa đồ vật, nhân vật hoặc câu ví dụ vào truyện.",
  EXAMPLES:
    "VÍ DỤ TỰ ĐẶT CHỈ VỀ CÁCH DIỄN ĐẠT: 'Tôi vô cùng kinh hãi trước tiếng động kỳ dị ngoài sân.' → 'Ngoài sân có tiếng động. Tôi ngồi im nghe. Một lúc sau, tiếng ấy lại vang lên.' Nhấn lặp có tiến triển: 'Tôi gọi chị. Chị không quay lại. Tôi gọi thêm lần nữa.' Đối đáp khi hợp cảnh: 'Tôi hỏi chị có nghe thấy không. Chị bảo có. Mà chị không chịu nói là nghe thấy gì.' Tự đọc thầm trước khi trả kết quả; sửa câu dài gượng ngay trong lượt viết, giữ sự kiện và thứ tự lộ manh mối.",
  OTHER_LANGUAGE:
    "FOLK RECOLLECTION REGISTER: keep the selected narration language. Use everyday spoken words, clear kinship references, mostly short/medium connected sentences and brief motivated dialogue. Several sentences may accompany one picture. Purposeful repetition adds new evidence; cut padding, not emphatic speech. Fear comes from observable discrepancies and consequential choices. Keep the approved new events, source subject, duration and production settings; do not import Vietnamese expressions, example events or compulsory characters.",
  FOCUS: (ids: string[]): string =>
    `STYLE CHECK (advisory): review wording/rhythm in these existing beat ids: ${JSON.stringify(ids)}. Split overloaded sentences within the SAME beat/utterance; preserve events, clues, order, speakers, direct speech and approximate total length. Purposeful short sentences and escalating repetition are allowed. Return edits only when useful, or an empty edits array; never add a scene or a new event to satisfy style.`,
  LOG: (count: number): string => `Văn phong: ${count} đoạn cần đọc lại cách diễn đạt; biên tập riêng lời kể, giữ sự kiện và cấu hình đã chọn.`,
} as const;
export const motionFolkWritingGuide = (language: string): string => (L.VI_RE.test(language.trim()) ? [MOTION_FOLK_WRITING.RULE, MOTION_FOLK_WRITING.EXAMPLES].join("\n") : MOTION_FOLK_WRITING.OTHER_LANGUAGE);
