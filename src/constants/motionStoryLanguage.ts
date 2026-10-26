export const MOTION_STORY_LANGUAGE = {
  VI_RE: /^(?:vi(?:[-_][a-z]+)*|vietnamese|tiếng việt)$/iu,
  EMPTY: "",
  SEPARATOR: "\n",
  COMPACT: "Dùng từ quen tai, động từ cụ thể và câu ngắn/vừa nối thành mạch kể; nghe một lần hiểu ai làm gì, ở đâu, vì sao. Tránh câu dịch máy, danh từ hóa, từ Hán Việt nặng, triết lý dài, nhắc lại nỗi sợ và lạm dụng rồi/bỗng/ba chấm. Giữ từ tín ngưỡng cần thiết và giải thích qua ngữ cảnh. Thoại tự nhiên, xưng hô nhất quán theo tuổi, quan hệ, vùng và thời đại; không trộn ba/má với bố/mẹ hay dùng tiếng lóng hiện đại trong truyện xưa. Giữ nguyên sự kiện, góc kể, đại từ rõ nghĩa, thứ tự lộ manh mối và lời trích thật. Học cách kể của mẫu, không chép câu/tình tiết hay lỗi chép lời. Không đọc timestamp/nhãn nhạc. Tự đọc thầm và sửa câu gượng trước khi trả kết quả.",
  RULES: [
    "NGÔN NGỮ KỂ CHUYỆN TIẾNG VIỆT — áp dụng cho lời kể, lời thoại và câu viết lại. Đây là yêu cầu về cách diễn đạt; giữ nguyên cốt truyện, góc kể, sự kiện, quan hệ và thời đại đã chọn. Nếu hồ sơ phong cách yêu cầu văn hoa hoặc câu dịch máy, ưu tiên lời Việt tự nhiên, nghe một lần hiểu ngay.",
    "Dùng lời ăn tiếng nói hằng ngày, động từ cụ thể, từ quen tai. Nói rõ ai làm gì, ở đâu, vì sao; tránh danh từ hóa, chuỗi tính từ, từ Hán Việt nặng nề và hình ảnh trừu tượng khó hình dung. Giữ từ chuyên môn, tín ngưỡng và tên đồ vật cần thiết, giải thích ngắn qua ngữ cảnh khi xuất hiện lần đầu. Không thay mọi từ Hán Việt bằng từ khác một cách máy móc.",
    "Câu ngắn và câu vừa nối nhau thành mạch kể. Chỉ ngắt thành câu rất ngắn ở chỗ cần nhấn; không chặt mọi hành động thành các mảnh rời, không nhồi nhiều vế vào một câu. Dùng từ nối khi có quan hệ thật, tránh lặp rồi, bỗng, chợt, lúc này, một cách. Không rải dấu ba chấm để kéo chậm giọng đọc.",
    "Kể cảm xúc qua việc làm, lời nói, âm thanh và cảm giác cụ thể trong cảnh. Có thể nói thẳng tôi lo, tôi sợ, tôi thương khi hợp cảnh; không thay bằng những đoạn than thở hoặc triết lý dài. Trong truyện ma, để điều bất thường và phản ứng của người trong cuộc tạo nỗi sợ; tránh lặp các cụm chung chung như một thế lực vô hình, nỗi kinh hoàng tột độ, bầu không khí quỷ dị.",
    "Lời thoại phải giống người Việt đang nói với người thân hoặc hàng xóm. Giữ xưng hô đúng tuổi, quan hệ, vùng và thời đại xuyên suốt truyện; chọn ba/má, bố/mẹ hoặc thầy/u theo bối cảnh, không trộn tùy tiện. Dạ, ừ, nè, nghe, con ơi chỉ dùng đúng người, đúng lúc. Không ép mọi truyện dùng giọng Nam Bộ; tránh tiếng lóng hiện đại trong truyện xưa. Đại từ nó chỉ dùng khi hợp quan hệ và rõ đang chỉ ai, không khiến người nghe nhầm nhân vật hoặc làm mất sự kính trọng.",
    "Học ở mẫu cách dùng từ quen, chi tiết sinh hoạt, đối thoại ngắn và cách chi tiết đổi nghĩa về sau; không chép câu, tình tiết hay lạm dụng câu cửa miệng của mẫu. Bản chép lời là dữ liệu tham khảo: sửa lỗi nhận dạng và chính tả theo ngữ cảnh, không học theo lỗi chép nhầm. Không đọc timestamp, ký hiệu >> hoặc nhãn âm nhạc thành lời kể.",
    "Trước khi trả kết quả, tự đọc thầm như đang kể cho một người Việt nghe: đổi câu gượng hoặc tối nghĩa sang câu rõ hơn, kiểm tra người được nhắc tới và xưng hô, bỏ phần giải thích lặp. Giữ nguyên bằng chứng, thứ tự lộ manh mối, điều chưa biết và ý nghĩa câu; không thêm chi tiết để minh họa cách viết, không sửa lời trích dẫn thật trong nội dung tài liệu.",
  ],
  EXAMPLE_NOTE: "Ví dụ tự đặt chỉ minh họa cách diễn đạt, không đưa các câu này vào truyện và không đổi sự kiện:",
  EXAMPLES: [
    ["Tôi quyết định tiến hành kiểm tra khu vực phía sau ngôi nhà.", "Tôi ra sau nhà xem thử."],
    ["Nỗi bất an bủa vây tâm trí tôi khi tiếng động ấy một lần nữa vọng tới.", "Tiếng động ấy lại vang lên. Tôi bắt đầu thấy lo."],
    ["Bà yêu cầu tôi tuyệt đối không được phản hồi khi nghe âm thanh gọi tên mình.", "Bà dặn: Nghe ai gọi tên thì đừng trả lời, con nhé."],
  ],
  EXAMPLE: (pair: readonly string[]): string => `Câu gượng: ${pair[0]} → Câu tự nhiên: ${pair[1]}`,
  REVIEW: "Khi biên tập tiếng Việt, câu dịch máy, từ cầu kỳ không hợp cảnh, đại từ mơ hồ, xưng hô sai vùng/vai vế và câu bị chặt vụn cũng là lỗi cần sửa. Chỉ sửa câu có vấn đề rõ ràng, giữ sự kiện, góc nhìn, manh mối, mức độ hé lộ, cảnh minh họa và độ dài tương đương; không coi từ tín ngưỡng quen dùng là lỗi chỉ vì đó là từ Hán Việt.",
} as const;
export const motionStoryLanguageGuide = (language: string, review = false, compact = false): string => (MOTION_STORY_LANGUAGE.VI_RE.test(language.trim()) ? [...(compact ? [MOTION_STORY_LANGUAGE.RULES[0], MOTION_STORY_LANGUAGE.COMPACT] : [...MOTION_STORY_LANGUAGE.RULES, MOTION_STORY_LANGUAGE.EXAMPLE_NOTE, ...MOTION_STORY_LANGUAGE.EXAMPLES.map(MOTION_STORY_LANGUAGE.EXAMPLE)]), ...(review ? [MOTION_STORY_LANGUAGE.REVIEW] : [])].join(MOTION_STORY_LANGUAGE.SEPARATOR) : MOTION_STORY_LANGUAGE.EMPTY);
