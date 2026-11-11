export const MOTION_OUTPUT_CONFORMANCE = {
  RATIO_TOLERANCE: 0.02,
  DURATION_TOLERANCE: 0.1,
  ASPECT: (expected: string, actual: string) => `Tỉ lệ khung hình ${actual} khác cấu hình ${expected}`,
  FPS: (expected: number, actual: number) => `FPS ${actual} khác cấu hình ${expected}`,
  QUALITY: (expected: string, actual: string) => `Chất lượng ${actual} khác cấu hình ${expected}`,
  SIZE: (aspect: string, width: number, height: number) => `Kích thước ${width}×${height} không đúng tỉ lệ ${aspect}`,
  SUBTITLES_OFF: "Cấu hình tắt phụ đề nhưng video vẫn có phụ đề",
  SUBTITLES_ON: "Cấu hình bật phụ đề nhưng video không có phụ đề",
  DURATION: (expected: number, actual: number) => `Thời lượng video ${actual.toFixed(2)}s khác timeline ${expected.toFixed(2)}s`,
  FAILED: (issues: string[]) => `Video xuất ra không khớp cấu hình đã chọn: ${issues.join("; ")}. Không đánh dấu hoàn tất; hãy xuất lại.`,
  PASSED: "Kiểm cấu hình video: khớp tỉ lệ, FPS, chất lượng, phụ đề và thời lượng đã chọn.",
} as const;
