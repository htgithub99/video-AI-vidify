# Đối ứng cấu hình Video Motion — 06/11/2026

Đã xử lý các điểm F1–F6 trong [bản audit](D:/video-AI-vidify/docs/motion-settings-path-audit-2026-11-06.md). Giữ pipeline AI viết động tác trong script → lập actionPlan → một phản hồi vẽ SVG và animation; không bổ sung QA ảnh hoặc sửa động tác bằng code.

## Thay đổi

| Điểm | Hành vi sau sửa |
|---|---|
| F1 — Kết quả theo cấu hình cũ | Backend trả `outputSettings` từ cấu hình đã lưu của lượt tạo. Frontend tính khóa preview/video từ cấu hình đó, không đóng dấu theo lựa chọn UI mới. Đã kiểm tra trường hợp bật phụ đề trong lúc đang chạy và tiếp tục sau khi đổi FPS/SFX volume |
| F2 — Dùng lại giọng khi bật ASR | Track mới lưu phiên bản và trạng thái đã yêu cầu kiểm tra ASR. Giọng chưa kiểm không đáp ứng ASR ON; xuất sẽ lấy giọng đáp ứng yêu cầu. ASR OFF vẫn dùng lại được giọng đã kiểm. Resume chỉ làm lại giọng/compile/export nếu giọng lưu chưa đáp ứng cấu hình ASR của lượt, giữ script và hình hoàn thành |
| F3 — Cách kể/đổi tên khác phân tích | Có đối chiếu chung ở frontend và backend trước khi viết. Nếu cách kể, đổi tên, thể loại hoặc thời lượng khác bản phân tích, hiển thị yêu cầu phân tích lại và không gửi job viết sai cấu hình. UI giải thích ngôn ngữ/số phần mới áp dụng ở bước nào |
| F4 — AUTO/CPU báo cũ sai | Chuẩn hóa encoder hiệu lực: Remotion dùng CPU khi tính khóa kết quả; kho hình vẫn phân biệt AUTO/CPU/GPU. Nhịp mặc định theo thể loại cũng được chuẩn hóa để không báo khác chỉ vì một bên lưu tường minh và bên kia dùng mặc định |
| F5 — Đổi AI dự phòng cho cảnh | Remotion ẩn toggle đổi nhà cung cấp cho cảnh, hiển thị chính sách một lần vẽ và gửi `allowFallback=false`. Toggle AI nội dung và toggle của kho hình vẫn có. Setting chuyển Chrome dự phòng khi Flash hết quota giữ cơ chế riêng |
| F6 — Cán cân trong cảnh so sánh | Bỏ gợi ý cán cân/sổ cái/khay lễ mặc định trong profile Lịch sử và Truyện ma. Bố cục theo các đối tượng/bằng chứng thực tế. Đồ vật này vẫn được vẽ khi nguồn hoặc yêu cầu cảnh nói rõ; không cấm đồ vật có thật |

“Tiếp tục” vẫn dùng cấu hình đã lưu, chỉ lấy giá trị mới của tùy chọn xóa chat Gemini. UI đã hiển thị rõ. Thay đổi cấu hình mới không âm thầm hủy các bước đã hoàn thành.

## Khôi phục và dữ liệu cũ

- `applyProduction` và khôi phục bản nháp dùng chung cách tính khóa theo snapshot.
- Phản hồi cũ không có metadata cấu hình vẫn có thể khôi phục hình; không được chứng nhận preview/video là khớp cấu hình mới. Có thể compile/xuất lại từ hình đã có.
- Giọng cũ không có trường ASR mới được nhận diện từ trạng thái kiểm tra của từng clip khi đủ bằng chứng; audio không có bằng chứng kiểm tra không được coi là đã kiểm.
- Trạng thái ASR đã thực hiện không đồng nghĩa mọi câu đều được nhận dạng hoàn hảo. Cơ chế giữ phương án tốt nhất và thông báo `review/unavailable` vẫn giữ nguyên.
- Không tự vẽ lại các cảnh có sẵn chỉ vì cập nhật prompt comparison. Prompt mới áp dụng cho lượt vẽ mới hoặc yêu cầu tạo lại riêng cảnh.

## Các tệp chính

- [Snapshot cấu hình đầu ra](D:/video-AI-vidify/src/lib/motionOutputSettings.ts)
- [Khóa preview, render và khôi phục](D:/video-AI-vidify/src/features/motion/lib/motionVisualDraft.ts)
- [Dùng cấu hình trong studio](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts)
- [Production và resume](D:/video-AI-vidify/src/features/motion/server/services/motionProductionService.ts)
- [Điều kiện dùng lại giọng](D:/video-AI-vidify/src/lib/motionVoice.ts)
- [Lưu/đọc metadata giọng](D:/video-AI-vidify/src/features/motion/server/services/motionAudioService.ts)
- [Đối chiếu cấu hình với phân tích](D:/video-AI-vidify/src/lib/motionSettingsCompatibility.ts)
- [UI cấu hình](D:/video-AI-vidify/src/features/motion/components/MotionVideoCreator.tsx)
- [UI AI vẽ](D:/video-AI-vidify/src/features/motion/components/MotionAiSettings.tsx)

## Kiểm chứng đạt

| Bài kiểm tra | Phạm vi |
|---|---|
| `npm run test:motion-settings` | Cấu hình dự án thật; 9 thay đổi ảnh hưởng compile, 3 thay đổi chỉ ảnh hưởng export; CPU/AUTO và kho hình; metadata cũ; backend 16 tổ hợp; resume chỉ làm lại giọng khi cần ASR; Chrome thật mở cửa sổ với Creator/hook/storage thật và phản hồi API cô lập |
| Chrome trong bộ trên | 19 control, bật/tắt, lưu IndexedDB/reload, nhãn resume, giới hạn AI vẽ theo adapter, chặn viết sai cách kể/đổi tên, giọng OFF→ON→OFF, nhận kết quả khi phụ đề đổi, resume sau khi đổi FPS/SFX volume |
| `npm run test:motion-script-intent` | Writer/editor giữ motionIntent, 96 case + 45 unit/profile, 18 cảnh trên 3 profile, tối đa 5 worker vẽ; QA/repair bằng 0; giữ animation và tạo lại riêng cảnh |
| `npx tsx scripts/verify-motion-production-runner.ts` | Công việc song song, resume đúng bước, lưu dữ liệu/khóa sở hữu, hủy, SEO lỗi/phục hồi/timeout; cập nhật fixture cũ theo chính sách không tự viết lại chỉ vì lệch mục tiêu thời lượng |
| `npx tsx scripts/verify-motion-scene-pacing.ts` | Nhóm cảnh, timeline/lời/phụ đề, ranh giới ngữ nghĩa, cache, đổi pacing, chữ ký nhạc và khôi phục. Fixture không còn đòi code tự thêm chuyển động thở |
| `npx tsx scripts/verify-motion-visual-drafts.ts --fixture` | Chrome mở cửa sổ; bản nháp riêng giữa adapter/profile, 18 cảnh lưu, reload, khôi phục và từ chối khác nội dung |
| `npx tsx scripts/verify-motion-voice-quality.ts` | Sinh/kiểm audio bằng dependency fixture, metadata ASR ON/OFF, giữ phương án tốt nhất, cache, khoảng im lặng; không gọi TTS/Whisper tài khoản thật |
| `npx tsc --noEmit` | Đạt |
| ESLint các tệp nguồn thay đổi trong đợt này | Đạt |
| `git diff --check` | Đạt |

Hai bài test từng dừng trong audit (`production-runner`, `scene-pacing`) nay đã chạy hết và đạt. Đã sửa fixture theo contract hiện tại, không đổi runtime để quay về tự vẽ/sửa chuyển động.

## Xuất cảnh thật trên Chrome

Đã xuất lại cảnh SVG+animation do AI trả về trước đó bằng Chrome cài thật, mở cửa sổ, rồi phát MP4 trong Chrome:

- 1920×1080, 30 FPS, 254 frame, 8.4667 giây, CRF 23, có audio.
- Dữ liệu spec và animation giữ nguyên; 0 lượt gọi AI.
- Kiểm bằng ffprobe và kiểm phát video thật. Đây là export riêng một cảnh đã lưu; không phải lượt gọi AI đầy đủ cho mọi kiểu hình/thể loại.
- Script kiểm chứng dùng thời gian chờ frame 120 giây như lần xuất riêng trước; không thay cấu hình timeout của renderer sản phẩm trong đợt này.

[Video kiểm chứng](D:/video-AI-vidify/storage/output/motion-video/clip-demo/settings-fixes-20261106/scene-reexport.mp4) · [Bằng chứng render](D:/video-AI-vidify/storage/output/motion-video/clip-demo/settings-fixes-20261106/reexport-verification.json).

Bằng chứng cấu hình:

- [Chrome](D:/video-AI-vidify/scratch/motion-settings-fixes-20261106/chrome/verification.json)
- [Payload](D:/video-AI-vidify/scratch/motion-settings-fixes-20261106/chrome/requests.json)
- [Dự án thật và kiểm tra key](D:/video-AI-vidify/scratch/motion-settings-fixes-20261106/real-project-verification.json)
- [Ma trận backend và resume ASR](D:/video-AI-vidify/scratch/motion-settings-fixes-20261106/runner-verification.json)

Chưa chạy lại một production AI/TTS đầy đủ cho tất cả tổ hợp. Những bài fixture xác nhận xử lý cấu hình và phục hồi; không chứng nhận chất lượng sáng tác AI trên mọi nội dung. Chưa tạo bản phát hành đóng gói hoặc commit.
