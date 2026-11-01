# Hoàn tác đợt mở rộng thời lượng

Ngày: 01/11/2026. Thực hiện theo yêu cầu đưa code về trước lúc mở rộng thời lượng cho các thể loại.

## Phạm vi đã hoàn tác

Khôi phục nội dung và trạng thái index của các file sau về Git HEAD `30b190d0` (mốc trước phần mở rộng trong diff đã đối chiếu):

- `src/constants/motionWriting.ts`: revision 6 → 5, bỏ nhóm DEVELOPMENT mới.
- `src/lib/motionWriting.ts`: bỏ helper và phần chèn hướng phát triển mới.
- `src/features/motion/server/services/motionStoryService.ts`: bỏ các hướng phát triển mới khỏi phân tích/biên tập.
- `src/constants/motionQa.ts`: khôi phục hướng dẫn thời lượng/số từ trước đợt mở rộng.
- `src/constants/motionPovStory.ts`: khôi phục profile, ví dụ và cấu trúc POV trước đợt mở rộng.
- `src/constants/motionGenre.ts`: khôi phục helper tạo directive trước đợt mở rộng.
- `src/constants/motionGenreReview.ts`: khôi phục cấu hình kiểm tra trước đợt mở rộng.
- `src/constants/motionGenreStage.ts`: khôi phục quy tắc stage/motif/nhân vật trước đợt mở rộng.

Hoàn tác riêng `CONTENT.RULE` và `CONTENT.LOG` trong `src/constants/motionStoryTimeline.ts`; giữ sửa lỗi nhận diện lên ngôi ở cùng file.

Gỡ `scripts/verify-motion-writing-development.ts` được thêm cho tính năng đã hoàn tác. Bản đầy đủ được giữ trong thư mục sao lưu.

## Phần được giữ lại

- Các sửa tải ảnh, upload Gemini, phục hồi phòng AI và tạo ảnh bìa.
- Các sửa xem trước và xuất video.
- Kiểm tra/chuẩn hóa JSON và scenePlan.
- Nhận diện số lượng kiểu “a thousand” và sửa nhận diện sự kiện lên ngôi.
- Profile riêng witness/chronicle/verdict không bị sửa trong thao tác hoàn tác này.
- Dữ liệu dự án và kết quả test trước vẫn được giữ, không tự viết lại kịch bản đã lưu.

Đây là hoàn tác có chọn lọc, không reset toàn bộ kho code và không quay về trước hệ thống viết kết hợp đã có trong HEAD.

## Bản sao và đối chiếu

Thư mục: `scratch/rollback-writing-expansion-2026-11-01T12-51-49-797Z`.

- `working/`: bản sao các file đang thay đổi trước thao tác.
- `index/`: nội dung staged trước thao tác.
- `before-index.patch`, `before-working.patch`: diff trước thao tác.
- `manifest.json`: mã băm của 34 file thay đổi trước thao tác.
- `verification.json`: xác nhận 8 file khôi phục khớp HEAD, 24 file ngoài phạm vi giữ nguyên cả nội dung làm việc và staged, và diff timeline chỉ còn sửa lỗi lên ngôi.

## Kiểm tra

- Không còn tham chiếu `motionWritingDevelopmentPrompt` hoặc nhóm DEVELOPMENT mới trong `src/` và `scripts/`.
- `scripts/verify-motion-editorial-policy.ts` đạt.
- TypeScript `tsc --noEmit` đạt.
- Backend tự nạp lại sau thay đổi; trang gốc trả HTTP 200, tiến trình `server.ts` mới được xác nhận.
- Không chạy thêm AI hoặc tạo giọng/video trong thao tác này.

Các tài liệu audit và test trước thao tác là bằng chứng lịch sử của bản có mở rộng, không phải mô tả code hiện tại.
