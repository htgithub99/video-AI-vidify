export type LogLang = 'en' | 'vi';

let currentLang: LogLang = 'vi'; // Default to Vietnamese

export const setLogLanguage = (lang: LogLang) => {
  currentLang = lang;
};

export const getLogLanguage = (): LogLang => {
  return currentLang;
};

/**
 * Translates raw tech action names to friendly, plain-language descriptions.
 */
export const getFriendlyActionName = (actionName: string, lang: 'vi' | 'en' = 'vi'): string => {
  const dictionary: Record<string, { vi: string; en: string }> = {
    handleCloseVoiceModal: {
      vi: "Đóng cửa sổ chọn giọng đọc",
      en: "Close voice selection dialog"
    },
    handleProcessInputAndConfig: {
      vi: "Bắt đầu phân tích kịch bản gốc và chuẩn bị biên kịch...",
      en: "Starting script analysis and preparing rewrite..."
    },
    handleTriggerStoryboardSplit: {
      vi: "Bắt đầu phân chia kịch bản thành các phân cảnh chi tiết...",
      en: "Starting scene splitting and storyboarding..."
    },
    handleRenderSceneImage: {
      vi: "Bắt đầu gửi yêu cầu tạo hình ảnh cho phân cảnh...",
      en: "Submitting request to generate scene image..."
    },
    handleUploadSceneImage: {
      vi: "Tải lên hình ảnh tùy chỉnh cho phân cảnh",
      en: "Uploading custom image for scene"
    },
    handleCopyPrompt: {
      vi: "Sao chép mô tả hình ảnh (prompt) thành công",
      en: "Copied scene visual prompt to clipboard"
    },
    handleCopyHook: {
      vi: "Sao chép nội dung mở đầu (hook) thành công",
      en: "Copied hook content to clipboard"
    },
    handleCopyAllPrompts: {
      vi: "Sao chép toàn bộ mô tả hình ảnh của kịch bản phân cảnh",
      en: "Copied all storyboard scene prompts"
    },
    handleReferenceImagesUpload: {
      vi: "Tải lên hình ảnh mẫu tham chiếu phong cách",
      en: "Uploading style reference images"
    },
    handleExtractStyle: {
      vi: "Bắt đầu trích xuất phong cách thiết kế từ hình ảnh tham chiếu...",
      en: "Starting style extraction from reference images..."
    },
    handleApplyStyleToScenes: {
      vi: "Đang áp dụng phong cách thiết kế mẫu lên toàn bộ phân cảnh...",
      en: "Applying visual style to all storyboard scenes..."
    },
    handleAnalyzeCharacter: {
      vi: "Bắt đầu phân tích các đặc điểm nhân vật...",
      en: "Starting character analysis..."
    },
    handleCharacterImagesUpload: {
      vi: "Tải lên ảnh mẫu của nhân vật",
      en: "Uploading character sample images"
    },
    handleApplyCharacterToScenes: {
      vi: "Đang áp dụng đặc điểm nhân vật lên toàn bộ phân cảnh liên quan...",
      en: "Applying character prompt to all relevant scenes..."
    },
    handleBulkUploadImages: {
      vi: "Đang tải lên hàng loạt hình ảnh cho các phân cảnh...",
      en: "Uploading bulk images for scenes..."
    },
    handlePrevSlide: {
      vi: "Chuyển về khung hình trước đó",
      en: "Navigated to previous frame"
    },
    handleThumbnailReferenceImagesUpload: {
      vi: "Tải lên ảnh mẫu tham chiếu cho ảnh thu nhỏ (thumbnail)",
      en: "Uploading thumbnail style reference images"
    },
    handleExtractThumbnailStyle: {
      vi: "Bắt đầu trích xuất phong cách thiết kế cho ảnh thu nhỏ...",
      en: "Starting style extraction for thumbnail..."
    },
    handleNextSlide: {
      vi: "Chuyển sang khung hình tiếp theo",
      en: "Navigated to next frame"
    },
    handleDeleteSceneImage: {
      vi: "Xóa hình ảnh đã chọn của phân cảnh",
      en: "Deleting selected scene image"
    },
    handleDeleteAllSceneImages: {
      vi: "Xóa toàn bộ hình ảnh phân cảnh đã tạo",
      en: "Deleting all generated scene images"
    },
    handleBatchGenerateAllImages: {
      vi: "Bắt đầu tiến trình tạo hàng loạt hình ảnh cho tất cả phân cảnh...",
      en: "Starting batch image generation for all scenes..."
    },
    handleGenerateDetailedPrompt: {
      vi: "Đang mở rộng mô tả hình ảnh chi tiết cho phân cảnh...",
      en: "Generating detailed visual prompt for scene..."
    },
    handleSaveSceneEdits: {
      vi: "Đang lưu các thay đổi chỉnh sửa của phân cảnh...",
      en: "Saving custom scene edits..."
    },
    handleTriggerAssetAndThumbnail: {
      vi: "Bắt đầu thiết lập nội dung và ảnh thu nhỏ...",
      en: "Initializing assets and thumbnail configuration..."
    },
    handleRenderThumbnailImage: {
      vi: "Bắt đầu gửi yêu cầu tạo ảnh thu nhỏ (thumbnail)...",
      en: "Submitting request to generate thumbnail..."
    },
    handleDownloadVoice: {
      vi: "Tải tệp âm thanh giọng đọc thành công",
      en: "Downloaded speech audio successfully"
    },
    handleRegenerateUnifiedVoice: {
      vi: "Yêu cầu tạo lại toàn bộ tệp giọng đọc hợp nhất...",
      en: "Re-generating unified project voiceover..."
    },
    handleTriggerVoiceGenerate: {
      vi: "Bắt đầu chuyển kịch bản phân đoạn thành giọng nói AI...",
      en: "Starting voiceover synthesis for script segment..."
    },
    handleTriggerAllSceneVoices: {
      vi: "Bắt đầu tạo giọng đọc AI hàng loạt cho tất cả các phân cảnh...",
      en: "Starting batch voiceover synthesis for all scenes..."
    },
    handleTriggerStoryboardAndVoices: {
      vi: "Bắt đầu đồng bộ kịch bản phân cảnh và giọng đọc AI...",
      en: "Starting synchronization of storyboard scenes and voice..."
    },
    handleTriggerSEOBoost: {
      vi: "Bắt đầu tiến trình tối ưu hóa SEO (Tiêu đề, Mô tả, Từ khóa)...",
      en: "Starting SEO optimization (Titles, Descriptions, Keywords)..."
    },
    handleOpenExportCenter: {
      vi: "Mở trung tâm xuất dữ liệu (Export Center)",
      en: "Opened project Export Center"
    },
    handleOfflineRenderWebM: {
      vi: "Bắt đầu kết xuất (render) video ngoại tuyến định dạng WebM...",
      en: "Starting offline WebM video rendering..."
    },
    handleDownloadJSONProject: {
      vi: "Đang chuẩn bị xuất tệp tin dự án định dạng JSON...",
      en: "Preparing to export project JSON file..."
    },
    handleDownloadSRT: {
      vi: "Đang chuẩn bị xuất tệp tin phụ đề định dạng SRT...",
      en: "Preparing to export subtitles SRT file..."
    },
    handleDownloadCapcutLink: {
      vi: "Đang chuẩn bị xuất định dạng liên kết CapCut...",
      en: "Preparing to export CapCut project link..."
    },
    handleDownloadPremiereXML: {
      vi: "Đang chuẩn bị xuất tệp tin dòng thời gian XML cho Premiere...",
      en: "Preparing to export Premiere XML timeline file..."
    }
  };

  if (!actionName) return "";

  if (actionName.startsWith("handleExtractCharacter")) {
    return lang === 'vi' 
      ? "Bắt đầu trích xuất đặc điểm nhân vật..." 
      : "Extracting character traits from script...";
  }

  const match = dictionary[actionName];
  if (match) {
    return match[lang];
  }

  // Formatting helper for unknown actions
  const cleanName = actionName
    .replace(/^handle/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
  return lang === 'vi' ? `Yêu cầu thực thi: ${cleanName}` : `Requested execution: ${cleanName}`;
};

export const LOG_DICTIONARY = {
  // Project / Voice Errors
  PROJECT_READ_ERR: {
    en: "Unable to read project list database (projects.json):",
    vi: "Không thể đọc dữ liệu danh sách dự án (projects.json):"
  },
  PROJECT_WRITE_ERR: {
    en: "Unable to write project list database (projects.json):",
    vi: "Không thể lưu dữ liệu danh sách dự án (projects.json):"
  },
  FETCH_VOICES_ERR: {
    en: "Error loading the available voices list from server:",
    vi: "Không thể tải danh sách giọng đọc từ máy chủ:"
  },

  // TTS API Errors
  TTS_API_ERROR_MSG: {
    en: "Speech service warning: {0}",
    vi: "Dịch vụ chuyển giọng nói cảnh báo: {0}"
  },
  TTS_NO_TASK_ID: {
    en: "Speech service could not create a process identifier (task_id): {0}",
    vi: "Dịch vụ giọng nói không tạo được mã tiến trình (task_id): {0}"
  },
  TTS_POLL_FAILED: {
    en: "Speech creation process was interrupted: {0}",
    vi: "Tiến trình tạo giọng nói bị gián đoạn: {0}"
  },
  TTS_TASK_ERROR_MSG: {
    en: "AI Voice Generation encountered an issue: {0}",
    vi: "Gặp lỗi trong quá trình tạo giọng nói AI: {0}"
  },
  TTS_TASK_TIMED_OUT: {
    en: "AI voice generation timed out. Please try again.",
    vi: "Hết thời gian chờ tạo giọng nói AI. Vui lòng thử lại."
  },
  FAILED_DOWNLOAD_AUDIO: {
    en: "Unable to download the generated voice audio file.",
    vi: "Không thể tải về tệp âm thanh đã được tạo."
  },

  // Gemini Service / Rotation
  GEMINI_START_ROTATION: {
    en: "[AI Service] Connecting to AI service. Rotating through {0} models, starting from index {1}.",
    vi: "[Trí tuệ nhân tạo] Bắt đầu kết nối dịch vụ AI. Hệ thống hỗ trợ xoay vòng qua {0} mô hình, bắt đầu từ mô hình {1}."
  },
  GEMINI_CALLING_MODEL: {
    en: "[AI Service] Activating AI model {0}/{1}: {2} (Index: {3})",
    vi: "[Trí tuệ nhân tạo] Đang gọi mô hình AI vòng {0}/{1}: {2} (Vị trí: {3})"
  },
  GEMINI_SUCCESS: {
    en: "[AI Service] ✅ Successfully completed via model: {0} after {1} attempts.",
    vi: "[Trí tuệ nhân tạo] ✅ Gửi yêu cầu thành công tới mô hình AI: {0} (sau {1} lần thử)."
  },
  GEMINI_ERROR: {
    en: "[AI Service] ❌ Failed with model {0} (Attempt {1}): {2}",
    vi: "[Trí tuệ nhân tạo] ❌ Lỗi khi gửi yêu cầu tới mô hình AI {0} (Lần thử {1}): {2}"
  },
  GEMINI_UNSUPPORTED_FALLBACK: {
    en: "[AI Service] ⚠️ Model {0} is currently unavailable or exhausted. Auto-switching to next model...",
    vi: "[Trí tuệ nhân tạo] ⚠️ Mô hình AI {0} không phản hồi hoặc hết lượt dùng thử. Đang tự động chuyển sang mô hình tiếp theo..."
  },
  GEMINI_RETRYABLE_ERROR: {
    en: "[AI Service] ⏳ Connection issue. Retrying model {0} in {1}ms...",
    vi: "[Trí tuệ nhân tạo] ⏳ Gặp sự cố kết nối tạm thời. Đang thử lại mô hình {0} sau {1} mili-giây..."
  },
  GEMINI_MODEL_FAILED: {
    en: "[AI Service] 💀 Model {0} could not fulfill request. Skipping to next model...",
    vi: "[Trí tuệ nhân tạo] 💀 Mô hình AI {0} không thể hoàn thành yêu cầu. Đang bỏ qua và chuyển sang mô hình tiếp theo..."
  },
  GEMINI_COOLDOWN: {
    en: "[AI Service] ⏳ Cooldown active (2 seconds) before switching to next model...",
    vi: "[Trí tuệ nhân tạo] ⏳ Đang chờ 2 giây trước khi kết nối mô hình tiếp theo để tránh quá tải..."
  },
  GEMINI_ALL_FAILED: {
    en: "[AI Service] 🚨 Tested all {0} models but all connections timed out. Process halted.",
    vi: "[Trí tuệ nhân tạo] 🚨 Đã thử kết nối tất cả {0} mô hình AI nhưng đều không phản hồi! Tiến trình bị tạm dừng."
  },
  GEMINI_SDK_NOT_INIT: {
    en: "GoogleGenAI Service has not been initialized properly.",
    vi: "Dịch vụ GoogleGenAI chưa được khởi tạo đúng cách."
  },
  GEMINI_GENERATION_FAILED_ALL: {
    en: "AI generation failed across all fallback models.",
    vi: "Yêu cầu tạo nội dung thất bại trên tất cả mô hình AI dự phòng."
  },

  // Google TTS Fallback
  GOOGLE_TTS_FALLBACK_SYNTHESIZING: {
    en: "[Speech Fallback] Synthesizing segment {0}/{1} ({2} characters)",
    vi: "[Hệ thống giọng nói dự phòng] Đang chuyển đổi đoạn hội thoại {0}/{1} (độ dài: {2} ký tự) thành giọng đọc..."
  },
  GOOGLE_TTS_FALLBACK_FETCH_FAILED: {
    en: "[Speech Fallback Warning] Failed to load segment {0}: {1}",
    vi: "[Hệ thống giọng nói dự phòng] Không thể tải đoạn hội thoại {0}: {1}"
  },
  GOOGLE_TTS_FALLBACK_CRITICAL: {
    en: "[Speech Fallback Critical] Permanent error on segment {0}",
    vi: "[Hệ thống giọng nói dự phòng] Gặp sự cố nghiêm trọng không thể khắc phục ở đoạn hội thoại {0}"
  },

  // Backend controllers / errors
  STYLE_EXTRACTION_ERROR: {
    en: "Error analyzing image style: {0}",
    vi: "Gặp lỗi khi phân tích phong cách hình ảnh: {0}"
  },
  BATCH_STYLE_REWRITE_FAILED_CHUNK: {
    en: "Bulk style sync failed for segment: {0}",
    vi: "Ghi đè phong cách hàng loạt thất bại cho phân đoạn: {0}"
  },
  REWRITE_PROMPTS_ERROR: {
    en: "Unable to rewrite visual prompts: {0}",
    vi: "Lỗi ghi đè mô tả hình ảnh (prompt): {0}"
  },
  BATCH_STYLE_REWRITE_FAILED_THUMBNAILS: {
    en: "Bulk style rewrite failed for thumbnails: {0}",
    vi: "Ghi đè phong cách hàng loạt thất bại cho ảnh thu nhỏ: {0}"
  },
  REWRITE_THUMBNAILS_ERROR: {
    en: "Thumbnail rewrite failed: {0}",
    vi: "Lỗi ghi đè ảnh thu nhỏ: {0}"
  },
  CHARACTER_ANALYSIS_ERROR: {
    en: "Character analysis error: {0}",
    vi: "Gặp lỗi khi phân tích đặc điểm nhân vật: {0}"
  },
  CHARACTER_EXTRACTION_ERROR: {
    en: "Failed to extract character attributes from description: {0}",
    vi: "Không thể nhận diện đặc điểm nhân vật từ mô tả: {0}"
  },
  BATCH_CHARACTER_REWRITE_FAILED_CHUNK: {
    en: "Bulk character update failed for segment: {0}",
    vi: "Ghi đè nhân vật hàng loạt thất bại cho phân đoạn: {0}"
  },
  REWRITE_PROMPTS_CHARACTER_ERROR: {
    en: "Failed to apply character attributes to visual prompts: {0}",
    vi: "Không thể áp dụng đặc điểm nhân vật vào các mô tả hình ảnh: {0}"
  },
  ERROR_GENERATING_HOOKS: {
    en: "Error in Hook multi-step flow: {0}",
    vi: "Gặp sự cố trong tiến trình tạo nội dung thu hút (Hook): {0}"
  },
  ERROR_REWRITING_SCRIPT: {
    en: "Unable to rewrite script: {0}",
    vi: "Không thể biên tập lại kịch bản: {0}"
  },
  DETAILED_PROMPT_ERROR: {
    en: "Error expanding visual prompt: {0}",
    vi: "Gặp lỗi khi mở rộng mô tả hình ảnh chi tiết: {0}"
  },
  ERROR_GENERATING_STORYBOARD_CHUNKING: {
    en: "Error partitioning script during storyboarding: {0}",
    vi: "Gặp sự cố khi xử lý chia nhỏ để dàn cảnh kịch bản: {0}"
  },
  ERROR_GENERATING_STORYBOARD_GEMINI: {
    en: "AI storyboard generation failed: {0}",
    vi: "Trí tuệ nhân tạo gặp sự cố khi dàn dựng phân cảnh kịch bản: {0}"
  },
  ERROR_GENERATING_SEO: {
    en: "Failed to generate SEO optimization package: {0}",
    vi: "Không thể tối ưu bộ thông tin SEO (Tiêu đề, Mô tả): {0}"
  },
  ERROR_GENERATING_THUMBNAILS_PROMPTS: {
    en: "Error creating thumbnail visual prompts: {0}",
    vi: "Gặp lỗi khi tạo mô tả ảnh thu nhỏ: {0}"
  },
  TTS_PIPELINE_ERROR: {
    en: "Speech pipeline issue: {0}",
    vi: "Đường ống xử lý giọng đọc gặp sự cố: {0}"
  },
  FAILED_RELOAD_PAGE_RETRY: {
    en: "Failed to reload page on retry: {0}",
    vi: "Tải lại trang thất bại khi thử lại: {0}"
  },
  LABS_SANDBOX_API_ERROR: {
    en: "[Labs Sandbox API Error] Connection issue: {0}",
    vi: "[Kết nối Google Labs] Gặp sự cố kết nối: {0}"
  },
  ERROR_READ_MERGED_AUDIO: {
    en: "Unable to read merged audio file: {0}",
    vi: "Không thể đọc dữ liệu âm thanh đã ghép: {0}"
  },
  ERROR_FFMPEG_MERGE: {
    en: "Audio merging error: {0}",
    vi: "Quá trình ghép trộn âm thanh gặp sự cố: {0}"
  },
  UNEXPECTED_ERROR_MERGE_AUDIO: {
    en: "Unexpected error during audio merging: {0}",
    vi: "Lỗi phát sinh ngoài dự kiến khi ghép âm thanh: {0}"
  },

  // Server-side / Playwright
  PLAYWRIGHT_TOKEN_CAPTURED: {
    en: "✅ Image creation account authenticated successfully!",
    vi: "✅ Đã kết nối và xác thực tài khoản sinh ảnh thành công!"
  },
  PLAYWRIGHT_CONNECT_ERR: {
    en: "❌ Connection error to visual generator:",
    vi: "❌ Lỗi kết nối đến công cụ hỗ trợ sinh ảnh:"
  },
  PLAYWRIGHT_CHROME_MANDATE: {
    en: "⚠️ PLEASE ENSURE THE BROWSER COMPONENT IS INITIATED BEFORE LAUNCHING SERVER:",
    vi: "⚠️ VUI LÒNG ĐẢM BẢO KHỞI ĐỘNG TRÌNH DUYỆT TRƯỚC KHI VẬN HÀNH HỆ THỐNG:"
  },
  PLAYWRIGHT_CHROME_COMMAND: {
    en: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"',
    vi: '👉 start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\chrome_debug_profile"'
  },
  PLAYWRIGHT_CONNECTING: {
    en: "🔗 Connecting to browser visual generator...",
    vi: "🔗 Đang kết nối tới trình duyệt sinh ảnh..."
  },
  PLAYWRIGHT_ACCESSING_LABS: {
    en: "🌐 Accessing Google Labs library...",
    vi: "🌐 Đang truy cập thư viện tạo ảnh của Google Labs..."
  },
  PLAYWRIGHT_LOGIN_PROMPT: {
    en: "\n⚠️ [ATTENTION] Please log in to your Google account in the browser...",
    vi: "\n⚠️ [CHÚ Ý] Vui lòng đăng nhập tài khoản Google trên trình duyệt..."
  },
  PLAYWRIGHT_TOKEN_TIMEOUT: {
    en: "⏳ Authentication timed out.",
    vi: "⏳ Hết thời gian chờ đăng nhập tài khoản."
  },
  PLAYWRIGHT_CONFIG_NEW: {
    en: "Applying visual synchronization profile...",
    vi: "Đang áp dụng cấu hình đồng bộ sinh ảnh mới..."
  },
  PLAYWRIGHT_CONFIG_SUCCESS: {
    en: "Visual profile sync successful!",
    vi: "Áp dụng cấu hình sinh ảnh thành công!"
  },
  PLAYWRIGHT_CONFIG_SKIP: {
    en: "Skipping automated configuration:",
    vi: "Bỏ qua cấu hình tự động:"
  },
  PLAYWRIGHT_INPUT_NOT_FOUND: {
    en: "Visual prompt input field could not be located.",
    vi: "Không tìm thấy vùng nhập dữ liệu mô tả hình ảnh"
  },
  PLAYWRIGHT_SUBMIT_NOT_FOUND: {
    en: "Image submission button could not be located.",
    vi: "Không tìm thấy nút Tạo ảnh"
  },
  PLAYWRIGHT_WAITING_GEN: {
    en: "⏱️ System is rendering and completing your image...",
    vi: "⏱️ Trình duyệt đang tiến hành vẽ và hoàn thiện hình ảnh..."
  },
  PLAYWRIGHT_DECODE_ERR: {
    en: "Error processing the retrieved image structure.",
    vi: "Gặp lỗi khi xử lý định dạng hình ảnh nhận được."
  },
  PLAYWRIGHT_REDIRECT_LOG: {
    en: "🌐 Launching Project Flow: ",
    vi: "🌐 Đang mở tiến trình luồng dự án: "
  },
  PLAYWRIGHT_INPUT_LOG: {
    en: "Visual Prompt: ",
    vi: "Mô tả hình ảnh: "
  },
  PLAYWRIGHT_PASTE_LOG: {
    en: "Filling visual prompt into engine...",
    vi: "Đang điền mô tả hình ảnh vào hệ thống..."
  },
  PLAYWRIGHT_TYPE_LOG: {
    en: "Typing visual prompt into engine...",
    vi: "Đang điền mô tả hình ảnh vào hệ thống..."
  },
  PLAYWRIGHT_SUBMIT_LOG: {
    en: "👆 Submitting request to Google creative library...",
    vi: "👆 Đang gửi yêu cầu sinh ảnh đến hệ thống tạo ảnh của Google..."
  },
  PLAYWRIGHT_BASE64_SUCCESS: {
    en: "📸 Image synchronized and stored successfully!",
    vi: "📸 Đã lưu trữ và đồng bộ hình ảnh thành công!"
  },
  PLAYWRIGHT_REQUIRED: {
    en: "Visual engine activation required.",
    vi: "Yêu cầu kích hoạt trình duyệt sinh ảnh Playwright."
  },
  PLAYWRIGHT_SANDBOX_ERR: {
    en: "Visual sandbox connection error.",
    vi: "Lỗi kết nối Sandbox."
  },
  PLAYWRIGHT_RECAPTCHA: {
    en: "reCAPTCHA verification required on screen.",
    vi: "Yêu cầu xác minh reCAPTCHA trên màn hình trình duyệt."
  },
  PLAYWRIGHT_REASON: {
    en: "Reason: ",
    vi: "Chi tiết: "
  },

  // Cache service
  CACHE_BYPASS: {
    en: "[Temporary Memory] Bypassing cached response for {0}",
    vi: "[Bộ nhớ tạm] Bỏ qua dữ liệu lưu trữ tạm thời theo yêu cầu cho {0}"
  },
  CACHE_HIT: {
    en: "[Temporary Memory] Restored previously processed data for {0}",
    vi: "[Bộ nhớ tạm] Đã khôi phục dữ liệu đã xử lý trước đó nhanh chóng cho {0}"
  },
  CACHE_EVICT: {
    en: "[Temporary Memory] Cleared expired storage for {0}",
    vi: "[Bộ nhớ tạm] Đang dọn dẹp dữ liệu lưu trữ đã hết hạn cho {0}"
  },
  CACHE_NEW: {
    en: "[Temporary Memory] Saved new results to speed up future sessions for {0}",
    vi: "[Bộ nhớ tạm] Đã lưu kết quả mới vào bộ nhớ tạm thời để tái sử dụng cho {0}"
  },
  CACHE_ERROR: {
    en: "[Temporary Memory Error] Failed to store result:",
    vi: "[Bộ nhớ tạm] Gặp lỗi khi lưu kết quả vào bộ nhớ tạm:"
  },

  // Helpers / Parsing
  JSON_PARSE_WARNING: {
    en: "Data structure parse failed. Activating automated recovery fallback: {0}",
    vi: "Không thể phân tích cấu hình dữ liệu nhận được. Hệ thống đang tự động khôi phục: {0}"
  },

  // Sandbox / configuration
  ERROR_LOADING_SANDBOX: {
    en: "Error loading local configuration:",
    vi: "Lỗi khi tải cấu hình môi trường:"
  },
  ERROR_SYNCING_SANDBOX: {
    en: "Error syncing local configuration:",
    vi: "Lỗi khi đồng bộ cấu hình môi trường:"
  },

  // Audio / Video processing
  PREVIEW_PLAYBACK_FAILED: {
    en: "Unable to play audio preview:",
    vi: "Không thể phát thử bản ghi âm thanh này:"
  },
  PREVIEW_DSP_FAILED: {
    en: "Audio enhancement module issue. Activating raw audio fallback:",
    vi: "Bộ xử lý tối ưu âm thanh gặp sự cố, hệ thống tự động phát âm thanh gốc:"
  },
  CLOUD_PREVIEW_FAILED: {
    en: "Cloud rendering preview issue. Activating browser-side fallback:",
    vi: "Lấy bản thử từ máy chủ thất bại, đang chuyển sang xử lý trực tiếp trên trình duyệt:"
  },
  FAILED_LOAD_VOICES: {
    en: "Failed to load voices list from database",
    vi: "Không thể tải danh sách giọng đọc từ máy chủ"
  },
  FAILED_RESTORE_BLOB: {
    en: "Failed to restore audio structure",
    vi: "Không thể phục hồi tệp dữ liệu âm thanh"
  },
  FAILED_COPY_PROMPTS: {
    en: "Failed to copy visual prompts list:",
    vi: "Không thể sao chép danh sách mô tả hình ảnh:"
  },
  ERROR_READING_REF_IMAGES: {
    en: "Error reading visual style references",
    vi: "Không thể đọc các hình ảnh tham chiếu phong cách"
  },
  ERROR_READING_CHAR_IMAGES: {
    en: "Error reading character references",
    vi: "Không thể đọc hình ảnh đặc trưng nhân vật"
  },
  ERROR_READ_MATCHED_FILE: {
    en: "Error reading aligned metadata file: {0}",
    vi: "Không thể đọc tệp dữ liệu tương thích: {0}"
  },
  ERROR_READ_SEQ_FILE: {
    en: "Error reading sequential file structure: {0}",
    vi: "Không thể đọc tệp tin tuần tự: {0}"
  },
  ERROR_READ_THUMB_REF_IMAGES: {
    en: "Error reading thumbnail style references",
    vi: "Không thể đọc hình ảnh mẫu của ảnh thu nhỏ"
  },
  ERROR_RENDERING_SCENE_BATCH: {
    en: "Error during batch image creation for Scene {0}:",
    vi: "Gặp lỗi khi tạo hình ảnh cho phân cảnh {0} trong tiến trình hàng loạt:"
  },
  BATCH_GEN_FAILURE: {
    en: "Batch image creation was interrupted:",
    vi: "Tiến trình tạo ảnh hàng loạt gặp sự cố:"
  },
  ERROR_GEN_DETAILED_PROMPT: {
    en: "Error generating detailed visual description:",
    vi: "Gặp lỗi khi tạo mô tả hình ảnh chi tiết:"
  },
  SYNTHESIZE_ON_THE_FLY_FAILED: {
    en: "Real-time speech creation was interrupted:",
    vi: "Chuyển đổi giọng đọc tức thời gặp sự cố:"
  },
  UNIFIED_SCENE_VOICE_GEN_FAILED: {
    en: "Unified scene voice generation failed:",
    vi: "Tạo giọng đọc hợp nhất cho phân cảnh thất bại:"
  },
  UNIFIED_SEGMENT_VOICE_GEN_FAILED: {
    en: "Unified segment voice generation failed:",
    vi: "Tạo giọng đọc hợp nhất cho phân đoạn thất bại:"
  },
  OFFLINE_RENDERING_ERROR: {
    en: "Video export process was interrupted:",
    vi: "Quá trình xuất video (render) ngoại tuyến gặp lỗi:"
  },
  COVER_IMAGE_CANVAS_CAPTURE_FAILED: {
    en: "Thumbnail canvas capture failed. Applying automated graphic placeholder...",
    vi: "Chụp ảnh bìa từ trình duyệt gặp sự cố, hệ thống sử dụng ảnh thay thế"
  },
  FAILED_FETCH_SCENE_IMAGE: {
    en: "Failed to download image for Scene {0}:",
    vi: "Không thể tải hình ảnh cho phân cảnh {0}:"
  },
  IMAGE_UPLOAD_SUCCESS: {
    en: "Image uploaded and synced for Scene {0}!",
    vi: "Đã tải lên và áp dụng hình ảnh thành công cho phân cảnh {0}!"
  },
  CHUNK_RETRY_WARNING: {
    en: "[Segment {0}] Recoverable error (Attempt {1}/{2}). Retrying automatically...",
    vi: "[Phân đoạn {0}] Xử lý gặp lỗi nhẹ (Lần thử {1}/{2}). Đang tiến hành thử lại tự động..."
  },
  STYLE_EXTRACTION_ERR: {
    en: "Failed to analyze reference image style:",
    vi: "Không thể trích xuất phong cách hình ảnh mẫu:"
  },
  APPLY_STYLE_ERROR: {
    en: "Failed to apply visual style preset:",
    vi: "Không thể áp dụng phong cách hình ảnh mẫu:"
  },
  PROMPT_GEN_ERROR: {
    en: "Failed to create visual descriptions:",
    vi: "Không thể tạo mô tả hình ảnh:"
  },
  THUMBNAIL_PIPELINE_ERROR: {
    en: "Thumbnail design pipeline encountered an issue:",
    vi: "Quá trình thiết kế ảnh thu nhỏ gặp sự cố:"
  },
  VOICE_SYNTH_ERROR: {
    en: "AI voice creation encountered an issue:",
    vi: "Tiến trình tạo giọng nói AI gặp sự cố:"
  },
  ERROR_GENERATING_VOICEOVER: {
    en: "Voiceover script synthesis encountered an issue:",
    vi: "Quá trình lồng tiếng thuyết minh gặp sự cố:"
  },
  SEO_PIPELINE_ERROR: {
    en: "Search engine optimization pipeline issue:",
    vi: "Không thể tối ưu hóa SEO:"
  },
  STORYBOARD_PIPELINE_ERROR: {
    en: "Storyboard alignment pipeline issue:",
    vi: "Gặp sự cố khi xử lý phân cảnh:"
  },
  SCRIPT_PIPELINE_ERROR: {
    en: "Script rewriting pipeline issue:",
    vi: "Gặp sự cố khi biên tập kịch bản:"
  },

  // Header / Navigation
  ERROR_PARSING_SANDBOX_HEADER: {
    en: "Failed to parse system configurations in header bar:",
    vi: "Gặp lỗi khi phân tích cấu hình môi trường ở thanh tiêu đề:"
  },

  // Voice Selection
  FAILED_FETCH_VOICES_REGISTRY: {
    en: "Failed to load voices library:",
    vi: "Không thể tải danh sách giọng nói từ thư viện:"
  },
  AUDIO_PLAYBACK_FAILED: {
    en: "Unable to play selected audio sample",
    vi: "Không thể phát thử tệp âm thanh này"
  },

  // Audio Context / Processors
  FAILED_RESUME_AUDIO_CONTEXT: {
    en: "Failed to resume audio drivers:",
    vi: "Không thể kích hoạt lại hệ thống âm thanh trình duyệt:"
  },
  AUDIO_CONTEXT_INIT_FAILED: {
    en: "Audio drivers not ready. Activating video-only recording:",
    vi: "Hệ thống âm thanh của trình duyệt chưa sẵn sàng, đang chuyển sang lưu trữ dạng chỉ có hình ảnh:"
  },

  // Shared utils
  SYSTEM_FLOW_ERROR: {
    en: "[System Issue] {0}:",
    vi: "[Hệ thống gặp sự cố] {0}:"
  },
  SYSTEM_ACTION_START: {
    en: "[System Action] {0}",
    vi: "[Hệ thống] {0}"
  },

  // Scene generator helper
  LOAD_CUSTOM_MODEL_ERR: {
    en: "Failed to retrieve the specialized AI models list:",
    vi: "Lỗi tải danh sách mô hình tùy chỉnh:"
  },

  // Projects management (App.tsx)
  ERROR_PARSING_PROJECTS: {
    en: "Failed to load existing projects structure:",
    vi: "Lỗi phân tích dữ liệu danh sách dự án:"
  },
  ERROR_FETCHING_PROJECTS: {
    en: "Failed to fetch project files from storage:",
    vi: "Lỗi khi lấy danh sách dự án từ cơ sở dữ liệu:"
  },
  ERROR_CREATING_PROJECT: {
    en: "Failed to write new project file to storage:",
    vi: "Lỗi khi tạo dự án mới trong cơ sở dữ liệu:"
  },
  ERROR_AUTO_SAVING_PROJECT: {
    en: "Automated project backup failed:",
    vi: "Lỗi khi tự động lưu dự án:"
  },
  ERROR_DELETING_PROJECT: {
    en: "Failed to remove project file:",
    vi: "Lỗi khi xóa dự án:"
  },
  ERROR_UPDATING_PROJECT: {
    en: "Failed to sync changes to project file:",
    vi: "Lỗi khi cập nhật dự án:"
  },

  // Server bootstrap / signals
  SERVER_RUNNING: {
    en: "Server running at http://localhost:{0}",
    vi: "Hệ thống đã khởi động thành công và sẵn sàng tại http://localhost:{0}"
  },
  SERVER_START_ERROR: {
    en: "Server failed to initiate:",
    vi: "Khởi động hệ thống thất bại:"
  },
  PLAYWRIGHT_CLEANING: {
    en: "Closing visual creator processes...",
    vi: "Đang dọn dẹp các tiến trình trình duyệt sinh ảnh..."
  },

  // General Status
  GENERAL_ERROR: {
    en: "Error:",
    vi: "Gặp sự cố:"
  },
  GENERAL_SUCCESS: {
    en: "Success:",
    vi: "Thành công:"
  }
};

export type LogKey = keyof typeof LOG_DICTIONARY;

/**
 * Formats a message template by replacing placeholders like {0}, {1} with provided arguments.
 */
export const formatLogMessage = (template: string, ...args: any[]): string => {
  let result = template;
  args.forEach((arg, index) => {
    const val = arg !== undefined && arg !== null ? String(arg) : "";
    result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), val);
  });
  return result;
};

/**
 * Retrieves the message for a given key, matching the specified or current language.
 * Falls back to English, then the key itself if not found.
 */
export const getMessage = (key: LogKey | string, lang?: LogLang, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    const activeLang = lang || currentLang;
    const template = LOG_DICTIONARY[dictionaryKey][activeLang] || LOG_DICTIONARY[dictionaryKey]['en'];
    
    if (dictionaryKey === 'SYSTEM_ACTION_START' && args.length > 0) {
      const friendlyAction = getFriendlyActionName(args[0], activeLang);
      return formatLogMessage(template, friendlyAction);
    }
    
    return formatLogMessage(template, ...args);
  }
  return formatLogMessage(String(key), ...args);
};

/**
 * Gets a bilingual message displaying both English and Vietnamese representation.
 * Useful for terminal/server outputs.
 */
export const getBilingualMessage = (key: LogKey | string, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    if (dictionaryKey === 'SYSTEM_ACTION_START' && args.length > 0) {
      const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['vi'], getFriendlyActionName(args[0], 'vi'));
      const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['en'], getFriendlyActionName(args[0], 'en'));
      if (viMsg === enMsg) return viMsg;
      return `${viMsg} | ${enMsg}`;
    }
    
    const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['vi'], ...args);
    const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['en'], ...args);
    if (viMsg === enMsg) return viMsg;
    return `${viMsg} | ${enMsg}`;
  }
  return formatLogMessage(String(key), ...args);
};


/**
 * Advanced unified logging utility supporting translation dictionary
 */
export const logger = {
  log: (key: LogKey | string, ...args: any[]) => {
    // If the key is in our dictionary and we are server-side or requested, log bilingual
    if (typeof window === 'undefined') {
      console.log(getBilingualMessage(key, ...args));
    } else {
      console.log(getMessage(key, undefined, ...args));
    }
  },
  info: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.info(getBilingualMessage(key, ...args));
    } else {
      console.info(getMessage(key, undefined, ...args));
    }
  },
  warn: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.warn(getBilingualMessage(key, ...args));
    } else {
      console.warn(getMessage(key, undefined, ...args));
    }
  },
  error: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.error(getBilingualMessage(key, ...args));
    } else {
      console.error(getMessage(key, undefined, ...args));
    }
  },
  // Explicitly logging standard language (Vietnamese)
  logVi: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, 'vi', ...args));
  },
  // Explicitly logging standard language (English)
  logEn: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, 'en', ...args));
  }
};

/**
 * Common logging function wrapping console.log / logger.log
 */
export const appLog = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.log(keyOrMessage, ...args);
};

/**
 * Common logging function wrapping console.error / logger.error
 */
export const appError = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.error(keyOrMessage, ...args);
};

/**
 * Common logging function wrapping logger.warn
 */
export const appWarn = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.warn(keyOrMessage, ...args);
};

/**
 * Common step logger function that logs the message and optionally collects it into a given logs array.
 */
export const appLogStep = (message: string, logsArray?: string[]): void => {
  appLog(message);
  if (logsArray && Array.isArray(logsArray)) {
    logsArray.push(message);
  }
};

/**
 * Common error factory that logs an error via appError and returns a new Error instance.
 * Usage: throw createAppError('ERROR_KEY', arg1, arg2);
 */
export const createAppError = (keyOrMessage: LogKey | string, ...args: any[]): Error => {
  const errMsg = typeof keyOrMessage === 'string' && LOG_DICTIONARY[keyOrMessage as LogKey]
    ? getMessage(keyOrMessage, undefined, ...args)
    : formatLogMessage(String(keyOrMessage), ...args);
  
  appError(errMsg);
  return new Error(errMsg);
};

