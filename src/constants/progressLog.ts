import _ from "lodash";
import { AppTheme } from "./enums";
export enum ProgressLogTone {
  Script = "script",
  Voice = "voice",
  Image = "image",
  Render = "render",
  SEO = "seo",
  Thumbnails = "thumbnails",
  Success = "success",
  Warning = "warning",
  Error = "error",
  Info = "info",
}
export enum ProgressLogContext {
  Automatic = "automatic",
  Cinematic = "cinematic",
  Editor = "editor",
}
export const PROGRESS_LOG_CONFIG = {
  TIME_PATTERN: /^\[([^\]]+)\]\s*/,
  PREFIX_PATTERN: /^(?:🚀|📌|✅|✓|⚠️?|❌|🎨|♻️?|⏱️?|🎬|🎙️?|📁|⚙️?|📝|🧩|🎉|✨|🖼️?|🎞️?)\s*/u,
  STEP_PATTERN: /^(bước\s*\d+(?:\.\d+)?(?:\/\d+)?)(?:\s*:\s*)?/i,
  EMPTY_VALUE: "",
  LIGHT_THEME: AppTheme.LIGHT,
  TOOLTIPS: { COPY_LOG: "Sao chép log", COPIED_LOG: "Đã sao chép!", COPY_ERROR: "Sao chép nội dung lỗi", COPIED_ERROR: "Đã sao chép lỗi!", COPY_WARNING: "Sao chép nội dung cảnh báo", COPIED_WARNING: "Đã sao chép cảnh báo!" },
  SEAMLESS_REPLACEMENTS: [
    { pattern: /:\s*quá trình/gi, replacement: " do quá trình" },
    { pattern: /:\s*thiếu/gi, replacement: " do thiếu" },
    { pattern: /:\s*không thể/gi, replacement: " do không thể" },
    { pattern: /:\s*lỗi/gi, replacement: " vì lỗi" },
  ],
  EXCLUDED_PATTERNS: {
    [ProgressLogContext.Automatic]: [/\b3[–-]5 shot\b/i, /native video audio/i, /character pack/i, /cinematic continuity/i],
    [ProgressLogContext.Cinematic]: [/tạo voice/i, /tạo giọng đọc/i, /giọng thuyết minh/i, /\btts\b/i, /căn khớp.*(?:voice|giọng|thuyết minh)/i, /tạo hook/i, /hook.*(?:câu mở đầu|kịch bản)/i],
    [ProgressLogContext.Editor]: [/tạo hook/i, /viết lại kịch bản/i, /tạo giọng đọc/i, /phân tích nhân vật/i, /tạo ảnh bìa/i, /seo/i],
  },
  MARKERS: { [ProgressLogTone.Error]: ["❌", "gặp sự cố", "thất bại", "failed completely"], [ProgressLogTone.Warning]: ["⚠", "cảnh báo", "warning"], [ProgressLogTone.Success]: ["✅", "✓", "thành công", "hoàn tất", "hoàn thành tạo video"] },
  KEYWORDS: {
    [ProgressLogTone.Error]: ["❌", "gặp sự cố", "thất bại", "failed"],
    [ProgressLogTone.Warning]: ["⚠️", "cảnh báo", "warning", "không thể"],
    [ProgressLogTone.Success]: ["🎉", "hoàn thành tạo video", "hoàn tất", "thành công!"],
    [ProgressLogTone.Script]: ["bước 1", "kịch bản", "storyboard", "phân cảnh"],
    [ProgressLogTone.Voice]: ["bước 2", "giọng đọc", "giọng thuyết minh", "tts", "whisper", "âm thanh", "căn khớp"],
    [ProgressLogTone.Image]: ["bước 3:", "vẽ ảnh", "vẽ tranh", "vẽ hình", "visual nhân vật", "prompt", "phong cách hình ảnh"],
    [ProgressLogTone.Render]: ["bước 4", "ghép nối", "hoàn thiện video", "ffmpeg", "render"],
    [ProgressLogTone.SEO]: ["bước 7", "seo boost", "tiêu đề, mô tả và từ khóa seo"],
    [ProgressLogTone.Thumbnails]: ["bước 8", "ảnh bìa", "thumbnails", "ý tưởng thiết kế ảnh bìa"],
  },
  CLASSES: {
    ICON: "w-3.5 h-3.5 shrink-0",
    ITEM: "flex items-start gap-3 relative group py-0.5",
    ICON_CONTAINER: "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border z-10 transition-all duration-300",
    MESSAGE: "min-w-0 flex-1 whitespace-pre-wrap break-words leading-6 text-[11.5px] font-medium",
    TIME: "shrink-0 text-[10px] font-mono tabular-nums select-none",
    TIME_LIGHT: "text-slate-400",
    TIME_DARK: "text-slate-400",
    LINE: "absolute left-[18px] -translate-x-1/2 top-[18px] bottom-[18px] w-[1px] pointer-events-none",
    LINE_LIGHT: "bg-slate-200",
    LINE_DARK: "bg-slate-800",
    STEP_LABEL: "font-extrabold uppercase mr-1.5 underline decoration-2 decoration-current",
  },
  COLORS: { MESSAGE_LIGHT: "#1f2937", MESSAGE_DARK: "#f8fafc" },
  STYLES: {
    [ProgressLogTone.Script]: { iconLight: "text-blue-600", iconDark: "text-blue-400", iconBgLight: "bg-blue-50 border-blue-200/60", iconBgDark: "bg-blue-950/40 border-blue-900/40", textLight: "text-blue-700", textDark: "text-blue-300" },
    [ProgressLogTone.Voice]: { iconLight: "text-purple-600", iconDark: "text-purple-400", iconBgLight: "bg-purple-50 border-purple-200/60", iconBgDark: "bg-purple-950/40 border-purple-900/40", textLight: "text-purple-700", textDark: "text-purple-300" },
    [ProgressLogTone.Image]: { iconLight: "text-emerald-600", iconDark: "text-emerald-400", iconBgLight: "bg-emerald-50 border-emerald-250/60", iconBgDark: "bg-emerald-955/35 border-emerald-900/45", textLight: "text-emerald-700", textDark: "text-emerald-300" },
    [ProgressLogTone.Render]: { iconLight: "text-rose-600", iconDark: "text-rose-455", iconBgLight: "bg-rose-50 border-rose-200/60", iconBgDark: "bg-rose-955/50 border-rose-900/45", textLight: "text-rose-700", textDark: "text-rose-400" },
    [ProgressLogTone.SEO]: { iconLight: "text-indigo-600", iconDark: "text-indigo-400", iconBgLight: "bg-indigo-50 border-indigo-200/60", iconBgDark: "bg-indigo-950/40 border-indigo-900/40", textLight: "text-indigo-700", textDark: "text-indigo-300" },
    [ProgressLogTone.Thumbnails]: { iconLight: "text-amber-600", iconDark: "text-amber-400", iconBgLight: "bg-amber-50 border-amber-250/60", iconBgDark: "bg-amber-950/30 border-amber-900/45", textLight: "text-amber-750", textDark: "text-amber-300" },
    [ProgressLogTone.Success]: { iconLight: "text-green-600", iconDark: "text-green-400", iconBgLight: "bg-green-50 border-green-200/60", iconBgDark: "bg-green-950/30 border-green-900/40", textLight: "text-green-700", textDark: "text-green-400" },
    [ProgressLogTone.Warning]: { iconLight: "text-orange-600", iconDark: "text-orange-400", iconBgLight: "bg-orange-50 border-orange-250/60", iconBgDark: "bg-orange-950/30 border-orange-900/45", textLight: "text-orange-700", textDark: "text-orange-400" },
    [ProgressLogTone.Error]: { iconLight: "text-red-650", iconDark: "text-red-400", iconBgLight: "bg-red-50 border-red-200/60", iconBgDark: "bg-red-950/40 border-red-900/40", textLight: "text-red-700", textDark: "text-red-400" },
    [ProgressLogTone.Info]: { iconLight: "text-slate-650", iconDark: "text-slate-400", iconBgLight: "bg-slate-50 border-slate-200", iconBgDark: "bg-slate-900 border-slate-800", textLight: "text-slate-700", textDark: "text-slate-300" },
  },
} as const;
export const isProgressLogVisible = (log: unknown, context: ProgressLogContext): boolean => !_.some(PROGRESS_LOG_CONFIG.EXCLUDED_PATTERNS[context], (pattern) => pattern.test(String(log)));
export const PIPELINE_RUNNER_LOGS = {
  aiExecutionPath: (isVi: boolean, mode: string, provider: string, model: string) => (isVi ? `[AI] Chế độ: ${mode} · Dịch vụ: ${provider} · Mô hình: ${model}.` : `[AI] Mode: ${mode} · Service: ${provider} · Model: ${model}.`),
  scriptCachedNotReady: (isVi: boolean, _issues: string) => (isVi ? `[Kịch bản] Kịch bản cũ chưa hoàn thiện. Đang tạo lại bước kịch bản...` : `[Script] Previous script incomplete. Re-running script step...`),
  storyboardCachedNotReady: (isVi: boolean, _issues: string) => (isVi ? `[Phân cảnh] Cập nhật phân cảnh và tái sử dụng hình ảnh phù hợp.` : `[Storyboard] Updating scenes and reusing suitable visuals.`),
  scriptAttemptRetry: (isVi: boolean, _mode: string, _provider: string, _model: string, attempt: number, _issues: string) => (isVi ? `[Kịch bản] Đang tạo lại kịch bản (lần ${attempt})...` : `[Script] Retrying script generation (attempt ${attempt})...`),
  scriptFailedMandatory: (isVi: boolean, issues: string) => (isVi ? `Kịch bản chưa đạt yêu cầu: ${issues}` : `Script did not meet requirements: ${issues}`),
  characterArtifactIncomplete: (isVi: boolean, issues: string) => (isVi ? `Chưa nhận đủ hồ sơ nhân vật: ${issues}` : `Incomplete character profile: ${issues}`),
  characterUsableIdentity: (isVi: boolean, _warnings: string) => (isVi ? `[Nhân vật] Đã thiết lập thông tin nhân vật thành công. Tiếp tục quy trình.` : `[Character] Character setup completed. Continuing production.`),
  storyboardAttemptRetry: (isVi: boolean, attempt: number, _issues: string) => (isVi ? `[Phân cảnh] Đang tạo lại phân cảnh (lần ${attempt})...` : `[Storyboard] Retrying storyboard (attempt ${attempt})...`),
  storyboardFailedMandatory: (isVi: boolean, issues: string) => (isVi ? `Phân cảnh chưa đạt yêu cầu: ${issues}` : `Storyboard did not meet requirements: ${issues}`),
  directorPromptVeo: (isVi: boolean) => (isVi ? "🎬 AI đang dàn dựng và chỉ đạo từng khung cảnh phim." : "🎬 AI is directing each cinematic scene."),
  editorPromptImage: (isVi: boolean) => (isVi ? "🖼️ AI đang thiết kế hình ảnh theo nội dung và phong cách từng cảnh." : "🖼️ AI is designing visuals for each scene."),
  directorPlanningScenesInRoom: (isVi: boolean, count: number) => (isVi ? `[Đạo diễn] Đang lên kế hoạch chi tiết cho ${count} cảnh quay.` : `[Director] Planning details for ${count} scenes.`),
  editorRewriteFullPlan: (isVi: boolean) => (isVi ? "[Biên tập] Kế hoạch chưa đầy đủ, đang yêu cầu AI hoàn thiện lại." : "[Editor] Incomplete plan, requesting AI to finalize."),
  promptsCompletedVeo: (isVi: boolean, count: number) => (isVi ? `✅ Đã hoàn thành kịch bản quay cho ${count} cảnh phim.` : `✅ Completed shot plans for ${count} scenes.`),
  promptsCompletedImages: (isVi: boolean, count: number) => (isVi ? `✅ Đã hoàn thành mô tả hình ảnh cho ${count} phân cảnh.` : `✅ Completed image descriptions for ${count} scenes.`),
  promptPlanIssues: (isVi: boolean, issues: string) => (isVi ? `Kế hoạch hình ảnh chưa hoàn tất: ${issues}` : `Visual plan incomplete: ${issues}`),
  cinematicContractIssues: (isVi: boolean, issues: string) => (isVi ? `[Phim AI] Kế hoạch quay cần điều chỉnh: ${issues}.` : `[AI Film] Shot plan needs adjustment: ${issues}.`),
  cinematicAllVideoMode: (isVi: boolean, count: number) => (isVi ? `[Phim AI] Đang chuyển toàn bộ ${count} cảnh sang tạo video chuyển động.` : `[AI Film] Generating motion video for all ${count} scenes.`),
  prepVisualGen: (isVi: boolean, generateType: unknown, _modeName: string, aspectRatio: string) => {
    const isVideo = generateType === "video";
    const isMixed = generateType === "mixed";
    const mediaTypeLabel = isVideo ? (isVi ? "video" : "videos") : isMixed ? (isVi ? "ảnh và video" : "images and videos") : isVi ? "hình ảnh" : "images";
    return isVi ? `🎨 Đang chuẩn bị tạo ${mediaTypeLabel} (tỷ lệ ${aspectRatio}).` : `🎨 Preparing ${mediaTypeLabel} (${aspectRatio}).`;
  },
  missingMediaContinue: (isVi: boolean) => (isVi ? "Một số cảnh chưa có hình ảnh/video. Hãy bấm Tiếp tục để hoàn thiện." : "Some scenes are missing media. Click Continue to complete."),
  promptSceneRewriteNoResponse: (sceneId: string) => `[Cảnh ${sceneId}] Giữ nguyên mô tả hình ảnh hiện tại.`,
  promptSceneRewriteWarning: (sceneId: string, _issues: string) => `[Cảnh ${sceneId}] Tiếp tục với mô tả hình ảnh đã tối ưu.`,
  promptPurposeNoReplacement: (_purpose: string) => `[Thiết kế] Giữ nguyên mô tả hình ảnh hiện tại.`,
  archivalDownloaded: (sceneId: string, _provider: string) => `Đã tải ảnh tư liệu cho cảnh ${sceneId}.`,
  archivalNotFoundFallback: (sceneId: string) => `Không có ảnh tư liệu cho cảnh ${sceneId}; chuyển sang tạo bằng AI.`,
  generatingMediaForScene: (isVi: boolean, isVideo: boolean, sceneId: string, current: number, total: number) => {
    const mediaTypeLabel = isVideo ? (isVi ? "video" : "video") : isVi ? "hình ảnh" : "image";
    return isVi ? `🎨 Đang tạo ${mediaTypeLabel} cảnh ${sceneId} (${current}/${total}).` : `🎨 Generating ${mediaTypeLabel} for scene ${sceneId} (${current}/${total}).`;
  },
  downloadedAndSavedMedia: (isVi: boolean, isVideo: boolean, sceneId: string) => {
    const mediaTypeLabel = isVideo ? (isVi ? "video" : "video") : isVi ? "hình ảnh" : "image";
    return isVi ? `✓ Đã lưu ${mediaTypeLabel} cảnh ${sceneId}.` : `✓ Saved ${mediaTypeLabel} for scene ${sceneId}.`;
  },
  flowStopRemainingSetupError: (isVi: boolean, reason: string) => (isVi ? `Tạm dừng các cảnh còn lại: ${reason}` : `Paused remaining scenes: ${reason}`),
  flowBatchSendNotice: (isVi: boolean, batchNum: number, totalBatches: number, itemCount: number) => (isVi ? `Đang tạo ${itemCount} video (đợt ${batchNum}/${totalBatches})...` : `Generating ${itemCount} videos (batch ${batchNum}/${totalBatches})...`),
  coverParallelGemini: (isVi: boolean) => (isVi ? "🎨 Đang thiết kế ảnh bìa cho phim..." : "🎨 Designing film thumbnails..."),
  archivalUnresolvedFallback: (count: number) => `[Tư liệu] Chuyển ${count} cảnh sang tạo bằng AI.`,
  mediaRetryAttempts: (isVi: boolean, attempt: number, maxAttempts: number, sceneIds: string) => (isVi ? `Thử lại cảnh chưa xong (${attempt}/${maxAttempts}): ${sceneIds}` : `Retrying pending scenes (${attempt}/${maxAttempts}): ${sceneIds}`),
  qaPhotoUnchecked: (sceneId: string) => `[Kiểm tra] Cảnh ${sceneId}: tiếp tục với ảnh hiện có.`,
  qaPhotoPassed: (sceneId: string) => `[Kiểm tra] Cảnh ${sceneId}: hình ảnh đạt tiêu chuẩn.`,
  qaPhotoWarnAfterRetry: (sceneId: string) => `[Kiểm tra] Cảnh ${sceneId}: tiếp tục hoàn thành video.`,
  qaPhotoRegenAttempt: (sceneId: string, _reasons: string, attempt: number, maxAttempts: number) => `[Kiểm tra] Cảnh ${sceneId}: đang tạo lại để đạt chất lượng tốt hơn (lần ${attempt}/${maxAttempts}).`,
  qaArchivalMismatchFallback: (sceneId: string) => `[Kiểm tra] Cảnh ${sceneId}: chuyển sang tạo hình ảnh bằng AI.`,
  qaVideoNoResponseKeep: (sceneId: string) => `[Kiểm tra] Cảnh ${sceneId}: giữ video hiện tại.`,
  qaVideoMismatchRegen: (sceneId: string, _reasons: string, attempt: number, maxAttempts: number) => `[Kiểm tra] Cảnh ${sceneId}: đang tạo lại video để đạt chất lượng tốt hơn (${attempt}/${maxAttempts}).`,
  qaTargetedTakeIssues: (issues: string) => `Video chưa đạt tiêu chuẩn chất lượng: ${issues}`,
  qaTargetedScenesPassedNotice: (sceneIds: string) => `Đã tạo và duyệt các cảnh ${sceneIds}. Bấm Ghép video khi sẵn sàng.`,
  qaInsufficientTakes: (issues: string) => `Chưa đủ cảnh đạt tiêu chuẩn để xuất video: ${issues}`,
  qaNoRealTakesError: (isVi: boolean) => (isVi ? "Chưa có đoạn video nào sẵn sàng để ghép. Vui lòng kiểm tra lại rồi tiếp tục." : "No video segments ready to assemble. Please check and resume."),
  completedMediaSummary: (isVi: boolean, complete: boolean, completed: number, total: number) => (isVi ? `${complete ? "✅" : "⚠️"} Đã hoàn thành ${completed}/${total} cảnh.` : `${complete ? "✅" : "⚠️"} Completed ${completed}/${total} scenes.`),
  coverSyncedWithProject: (isVi: boolean) => (isVi ? "✅ Đã lưu ảnh bìa vào dự án phim." : "✅ Film thumbnails saved to project."),
  cinematicKeepAudioAmbience: (isVi: boolean) => (isVi ? "[Âm thanh] Giữ nguyên giọng thoại và âm thanh hiện trường của từng cảnh phim." : "[Audio] Preserving original dialogue and ambient sound in each scene."),
  stitchingTimeline: (isVi: boolean, nativeFilmAudio: boolean) => (nativeFilmAudio ? (isVi ? "🎞️ Đang ghép nối các cảnh, cân bằng âm thanh và xuất phim..." : "🎞️ Joining scenes, balancing audio, and rendering film...") : isVi ? "🎞️ Đang căn thời lượng, ghép phụ đề, nhạc và xuất video..." : "🎞️ Aligning timing, joining subtitles, music, and rendering video..."),
  editingReviewDecision: (isVi: boolean) => (isVi ? "[Dựng phim] Đang rà soát và hoàn thiện các cảnh quay..." : "[Editing] Reviewing and refining scenes..."),
  editingSummaryAI: (realCount: number, keptCount: number, _omittedCount: number, _srcDur: number, selDur: number, _protectedDialogue: number, _repeatedOmitted: number, _wrongDialogue: number) => `[Dựng phim] Đã chọn lọc ${keptCount}/${realCount} cảnh tối ưu, thời lượng ${selDur}s (đã lọc các đoạn lặp và lỗi thoại).`,
  editingSummaryLibraryFallback: (isVi: boolean, keptCount: number, _omittedCount: number, _srcDur: number, selDur: number, _wrongDialogue: number) => (isVi ? `[Dựng phim] Tự động chọn ${keptCount} cảnh tốt nhất, thời lượng ${selDur}s.` : `[Editing] Automatically selected ${keptCount} best scenes, duration ${selDur}s.`),
  editingSummaryTechnicalFallback: (isVi: boolean, _realCount: number) => (isVi ? `[Dựng phim] Đã kiểm tra và chọn các cảnh đạt chuẩn để xuất video.` : `[Editing] Selected verified scenes to assemble the film.`),
  closeRoomBeforeFlow: (isVi: boolean) => (isVi ? "[Quy trình] Hoàn thành kịch bản; chuyển sang giai đoạn tạo video." : "[Workflow] Script complete; proceeding to video generation."),
  dialogueWarningKeepTakes: (sceneIds: string) => `Giữ nguyên các cảnh ${sceneIds} để tiếp tục dựng phim.`,
  editingOmittedCountNotice: (count: number) => `[Dựng phim] Đã lọc bớt ${count} cảnh dư thừa hoặc lặp lại.`,
  editingTimelineBuiltNotice: (shotsCount: number, acceptedCount: number, dur: number, _note: string) => `[Dựng phim] Hoàn tất bản dựng gồm ${shotsCount} đoạn từ ${acceptedCount} cảnh, thời lượng ${dur}s.`,
  editorialReleaseStatus: (isVi: boolean, status: string, warningsCount: number, blockingCount: number) => {
    if (status === "editorially_publishable") {
      return isVi ? "[Xuất bản] Video hoàn tất và đạt chuẩn chất lượng cao." : "[Release] Video completed and meets high quality standards.";
    }
    if (status === "completed_with_warnings") {
      return isVi ? `[Xuất bản] Video đã xuất xong, có ${warningsCount} lưu ý cần xem lại.` : `[Release] Video rendered; ${warningsCount} advisories for review.`;
    }
    return isVi ? `[Xuất bản] Đã tạo tệp video nhưng còn ${blockingCount} điểm cần hoàn thiện.` : `[Release] Video file created but has ${blockingCount} issues to resolve.`;
  },
} as const;
