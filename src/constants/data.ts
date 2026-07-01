export interface PipelineNode {
  id: string;
  nameVi: string;
  nameEn: string;
  stageGroup: number; 
  descVi: string;
  descEn: string;
}

export const pipelineNodes: PipelineNode[] = [
  { id: 'In', nameVi: 'Đầu Vào', nameEn: 'Input Source', stageGroup: 0, descVi: 'Thu thập kịch bản thô hoặc ý tưởng ban đầu.', descEn: 'Captures raw Original Script or short Story Idea.' },
  { id: 'HKG', nameVi: 'Tạo lời dẫn', nameEn: 'Hook Generator', stageGroup: 1, descVi: 'Thiết kế câu mở đầu, câu giữ chân và kêu gọi hành động.', descEn: 'Calculates high click-rate Opening, Retention and CTA hooks.' },
  { id: 'SRW', nameVi: 'Viết Lại Kịch Bản', nameEn: 'Script Rewriter', stageGroup: 2, descVi: 'Viết lại và điều chỉnh độ độc bản của câu chuyện.', descEn: 'Rewrites original words to bypass redundant phrases.' },
  { id: 'SEH', nameVi: 'Nâng Cấp Văn Phong', nameEn: 'Script Enhancer', stageGroup: 2, descVi: 'Tối ưu độ trôi chảy và kịch tính hóa hội thoại.', descEn: 'Injects flow dramatic triggers and flow patterns.' },
  { id: 'LFE', nameVi: 'Mở Rộng Thời Lượng', nameEn: 'Long Form Expander', stageGroup: 2, descVi: 'Mở rộng cốt truyện lên tới 60 phút bằng cách thêm bối cảnh.', descEn: 'Expands script lengths dynamically by adding contextual side stories.' },
  { id: 'FCK', nameVi: 'Kiểm Chứng Thực Tế', nameEn: 'Fact Checker', stageGroup: 2, descVi: 'Rà soát tên riêng, năm, địa danh lịch sử chuẩn xác.', descEn: 'Validates factual events, metrics and chronologies.' },
  { id: 'CGT', nameVi: 'Thiết lập chương truyện', nameEn: 'Chapter Generator', stageGroup: 2, descVi: 'Trực quan hóa cấu trúc câu chuyện thành chương mục.', descEn: 'Breaks large scripts into core semantic chapters.' },
  { id: 'SGE', nameVi: 'Dựng phân cảnh', nameEn: 'Storyboard Generator', stageGroup: 3, descVi: 'Lập sơ độ phân cảnh chi tiết đồng bộ mốc thời gian.', descEn: 'Forms coordinates linking timing, narration, and screen actions.' },
  { id: 'SSP', nameVi: 'Phân dòng cảnh', nameEn: 'Scene Splitter', stageGroup: 3, descVi: 'Cắt nhỏ kịch bản bám sát diễn biến bối cảnh.', descEn: 'Splits chapter narratives into granular scenes.' },
  { id: 'TGE', nameVi: 'Thiết Kế Sơ Đồ Thời Gian', nameEn: 'Timeline Generator', stageGroup: 3, descVi: 'Ước lượng thời gian và thời lượng cho từng khung hình.', descEn: 'Calculates start-end frames based on reading speeds.' },
  { id: 'VPL', nameVi: 'Kế Hoạch Hình Ảnh', nameEn: 'Visual Planner', stageGroup: 4, descVi: 'Định lượng số lượng ảnh cần thiết cho đoạn phim.', descEn: 'Optimizes assets count, preventing duplicate images.' },
  { id: 'ASM', nameVi: 'Tài nguyên hình ảnh', nameEn: 'Asset Manager', stageGroup: 4, descVi: 'Nhập dữ liệu hình ảnh tải lên hoặc tự động khởi tạo.', descEn: 'Mixes imported CSV elements and system default textures.' },
  { id: 'PGE', nameVi: 'Mô tả hình ảnh', nameEn: 'Prompt Generator', stageGroup: 4, descVi: 'Dựng từ khóa vẽ tranh chi tiết cho công cụ.', descEn: 'Enhances descriptive painting formulas for high quality.' },
  { id: 'CCM', nameVi: 'Duy Trì Nhân Vật', nameEn: 'Character Consistency', stageGroup: 4, descVi: 'Khóa diện mạo, trang phục và tỷ lệ cơ thể nhân vật.', descEn: 'Locks key faces, clothing features and colors.' },
  { id: 'IMG', nameVi: 'Tạo Ảnh Thần Tốc', nameEn: 'Image Generator', stageGroup: 4, descVi: 'Thực thi quy trình lập hình ảnh tự động.', descEn: 'Runs the latent diffusion rendering pipeline.' },
  { id: 'VGE', nameVi: 'Tạo giọng nói', nameEn: 'Voice Generator', stageGroup: 5, descVi: 'Chuyển đổi văn bản thành tệp thu âm diễn cảm.', descEn: 'Transforms text strings into full wave audio files.' },
  { id: 'SGE_sub', nameVi: 'Hệ Thống Phụ Đề', nameEn: 'Subtitle Generator', stageGroup: 5, descVi: 'Tạo tệp phụ đề định dạng chuẩn bám sát giọng đọc.', descEn: 'Drafts exact SRT subtitle alignments.' },
  { id: 'FAL', nameVi: 'Căn Khớp Giọng Nói', nameEn: 'Forced Alignment', stageGroup: 5, descVi: 'Áp dụng thuật toán khớp âm thanh thực tế với chữ.', descEn: 'Aligns speech phonemes directly to text stamps.' },
  { id: 'TNG', nameVi: 'Thiết kế ảnh bìa', nameEn: 'Thumbnail Generator', stageGroup: 4, descVi: 'Khởi sinh các mẫu ảnh bìa tăng tỷ lệ nhấn xem.', descEn: 'Generates high engagement MrBeast or History layouts.' },
  { id: 'TTG', nameVi: 'Dựng Tiêu Đề', nameEn: 'Title Generator', stageGroup: 6, descVi: 'Tối ưu tiêu đề dễ tìm kiếm và thu hút đám đông.', descEn: 'Creates clickbait and standard search terms.' },
  { id: 'DSG', nameVi: 'Tạo phần mô tả', nameEn: 'Description Generator', stageGroup: 6, descVi: 'Soạn nội dung giới thiệu tối ưu tìm kiếm.', descEn: 'Writes descriptive templates fitted for algorithm reach.' },
  { id: 'HSG', nameVi: 'Đề xuât chủ đề', nameEn: 'Hashtag Generator', stageGroup: 6, descVi: 'Gợi ý các thẻ nổi bật thịnh hành.', descEn: 'Finds trending tags.' },
  { id: 'TAG', nameVi: 'Từ Khóa Tìm Kiếm', nameEn: 'Tag Generator', stageGroup: 6, descVi: 'Tổng hợp bộ nhãn tìm kiếm phim siêu tốc.', descEn: 'Compiles search key phrases.' },
  { id: 'VDA', nameVi: 'Hệ thống điều phối', nameEn: 'Video Director AI', stageGroup: 7, descVi: 'Tổng hợp điều khiển góc quay máy ảnh chuyển tiếp.', descEn: 'Ensures scene flow, camera transitions and visuals fit.' },
  { id: 'AVE', nameVi: 'Trình Biên Tập Tự Động', nameEn: 'Auto Video Editor', stageGroup: 7, descVi: 'Tổng hòa các dải âm thanh, phụ đề và dữ liệu thành phim hoàn chỉnh.', descEn: 'Fuses visuals, subtitle layers and music track.' },
  { id: 'QCH', nameVi: 'Kiểm Soát Chất Lượng', nameEn: 'Quality Checker', stageGroup: 7, descVi: 'Đánh giá tỷ lệ nén tệp tin, chuẩn khung hình và độ trong âm thanh.', descEn: 'Verifies file compressions and safely scales.' },
  { id: 'EXP', nameVi: 'Xuất bản phim', nameEn: 'Exporter Engine', stageGroup: 7, descVi: 'Hỗ trợ tải tệp phim độ tương thích cao cực nhanh.', descEn: 'Allows professional raw file export in XML format.' }
];



export const genreLabels: Record<string, string>  = {
                              Storytelling: "Kể chuyện",
                              History: "Lịch sử",
                              Documentary: "Phim tài liệu",
                              Explanation: "Giải thích",
                              Review: "Đánh giá / Review",
                              Education: "Giáo dục",
                              News: "Tin tức",
                              "Top List": "Bảng xếp hạng / Top list",
                              "True Crime": "Trinh thám / Thám án",
                              Science: "Khoa học",
                              Psychology: "Tâm lý học",
                              Philosophy: "Triết học",
                            };

export const audLabels: Record<string, string>  = {
                              "General Audience": "Khán giả đại chúng",
                              Kids: "Trẻ em",
                              Teenagers: "Thanh thiếu niên",
                              Adults: "Người lớn",
                              Seniors: "Người cao tuổi",
                            };

export const styleLabels: Record<string, string>  = {
                              Professional: "Chuyên nghiệp",
                              Documentary: "Tài liệu chân thực",
                              Viral: "Lan truyền / Đề xuất",
                              Mystery: "Bí ẩn / Kịch tính",
                              Drama: "Kịch tính / Gây cấn",
                              Educational: "Mang tính giáo dục",
                              Scientific: "Khoa học thực tiễn",
                            };

export const motionLabels: Record<
                                        string,
                                        string
                                      >  = {
                                        "Zoom In": "Phóng to",
                                        "Zoom Out": "Thu nhỏ",
                                        "Pan Left": "Góc trái",
                                        "Pan Right": "Góc phải",
                                        Static: "Tĩnh",
                                      };

export const emotionMap: Record<string, string>  = {
                                  Normal: "Bình thường",
                                  Excited: "Hào hứng",
                                  Serious: "Trang nghiêm",
                                  Dramatic: "Kịch tính",
                                  Mysterious: "Bí ẩn",
                                };

export const stylePresetsKeywords: Record<string, string>  = {
  Realistic:
    "hyperrealistic, 8k resolution, highly detailed photographic style, natural lighting, realistic textures",
  Historical:
    "historical accuracy, period-accurate costume design, aged sepia tone, archival epic style, ancient realism, vintage atmosphere",
  Watercolor:
    "watercolor wash, soft paint strokes, artistic ink bleed, traditional texture, delicate hand-painted illustration",
  "Oil Painting":
    "classic oil on canvas, textured brush strokes, impasto technique, Rembrandt lighting, fine art masterpiece",
  Stickman:
    "minimalist stick figure drawing, simple hand-drawn sketch, clean line art, humorous whiteboard presentation style",
  Anime:
    "modern anime style, vibrant cel shading, beautiful hand-drawn key frames, Kyoto Animation style aesthetic, colorful studio lighting",
  Comic:
    "comic book illustration, bold ink outlines, halftone dot textures, dramatic marvel action panel style, colored graphic novel",
  "Black & White":
    "monochrome photography, high contrast black and white film grain, classic noir shading, deep dramatic shadows",
  Cinematic:
    "cinematic film still, anamorphic lens flare, dramatic volumetric lighting, Panavision 35mm look, shallow depth of field, blockbuster color grading",
  Documentary:
    "raw documentary photography, photojournalism style, unposed authentic moment, natural ambient light, candid coverage",
  "Low Poly":
    "3d low-poly geometric artwork, stylized faceted polygons, clean retro rendering, pastel vector gaming assets",
  "Pixel Art":
    "8-bit retro pixel art, detailed vintage sprite design, limited color palette, clean grid pixels, nostalgic 90s arcade game look",
};

export const GEMINI_UNSUPPORTED_ERROR_KEYWORDS = ['not found', '404', 'unsupported', 'Quota exceeded'];
export const GEMINI_RETRYABLE_ERROR_KEYWORDS = ['429', 'quota', '503', '500', '550', 'fetch failed', 'Timeout', 'undici'];
export const STICKMAN_KEYWORDS = ["người que", "stickman", "stick figure", "hoạt hình", "stick", "que"];

export const GENRE_OPTIONS = [
  "Storytelling",
  "History",
  "Documentary",
  "Explanation",
  "Review",
  "Education",
  "News",
  "Top List",
  "True Crime",
  "Science",
  "Psychology",
  "Philosophy",
];

export const AUDIENCE_OPTIONS = [
  "General Audience",
  "Kids",
  "Teenagers",
  "Adults",
  "Seniors",
];

export const WRITING_STYLE_OPTIONS = [
  "Professional",
  "Documentary",
  "Viral",
  "Mystery",
  "Drama",
  "Educational",
  "Scientific",
];

export const HOOK_STRATEGY_OPTIONS = [
  { value: "Auto", label: "Tự động" },
  { value: "Mystery", label: "Kỳ bí, tò mò" },
  { value: "Shock", label: "Gây sốc" },
  { value: "Drama", label: "Kịch tính" },
  { value: "Curiosity", label: "Hiếu kỳ" },
  { value: "Emotional", label: "Cảm xúc" },
  { value: "Historical", label: "Lịch sử" },
  { value: "Statistical", label: "Thống kê" },
  { value: "Question", label: "Đặt câu hỏi" },
  { value: "Story", label: "Câu chuyện" },
];

export const HOOK_POSITION_OPTIONS = [
  { value: "start", label: "Chỉ mở đầu" },
  { value: "mid", label: "Mở đầu & Giữa" },
  { value: "all", label: "Đầu, Giữa & Cuối" },
];

export const DURATION_OPTIONS = [
  { val: "2m", label: "300 từ (~2 phút)" },
  { val: "5m", label: "750 từ (~5 phút)" },
  { val: "10m", label: "1500 từ (~10 phút)" },
  { val: "15m", label: "2250 từ (~15 phút)" },
];



