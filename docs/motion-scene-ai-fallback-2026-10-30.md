# Motion: nút tiến độ và AI dựng cảnh

## Thay đổi

- Đổi “AI dựng video minh họa” thành “AI dựng cảnh”.
- Thêm “Tự chuyển AI dự phòng”, mặc định bật và lưu cùng cấu hình Motion.
- Bật: dùng chuỗi AI dựng cảnh khi nhà cung cấp hiện tại gặp lỗi có thể chuyển tiếp.
- Tắt: giữ nguyên nhà cung cấp và model đã chọn. Có thể phục hồi trên cùng AI, nhưng không chuyển nhà cung cấp hay API.
- Áp dụng cho yêu cầu dựng bằng kho và Remotion. AI nội dung và công tắc “AI duyệt ảnh cảnh” giữ cấu hình riêng.
- Remotion khi tắt duyệt ảnh vẫn chỉ lấy một phản hồi mỗi AI; không thêm lượt phê bình/sửa bằng AI. Khi bật dự phòng, kết quả không dùng được có thể chuyển sang AI kế tiếp trong ngân sách hữu hạn.
- Giữ xử lý CAPTCHA, hủy tác vụ và trạng thái gửi chưa rõ kết quả. Không tự chuyển AI khi các cơ chế này yêu cầu dừng/chờ.
- Cấu hình được chụp khi bắt đầu tác vụ. Tiếp tục production cũ dùng cấu hình đã lưu của production; tác vụ mới và tạo lại cảnh riêng dùng cấu hình hiện tại.

## Nguyên nhân UI

Thông báo lỗi kỹ thuật đầy đủ được đưa vào stage rồi dùng làm nhãn nút. Có trường hợp dài 2.373 ký tự. Nút không giới hạn chiều cao/chiều rộng nội dung, chữ lỗi xuống nhiều dòng và đẩy nút dừng xuống hai dòng.

Đã tách thông báo tiến độ ngắn khỏi lỗi chi tiết trong nhật ký; nhãn cũ được bỏ ANSI, gộp khoảng trắng và giới hạn 100 ký tự. Giữ nguyên số cảnh dạng 16/17. Nút có chiều cao 40px, nhãn một dòng có dấu ba chấm, nút dừng không co lại và không xuống dòng. Trạng thái bận giữ chữ rõ, bỏ hiệu ứng pulse toàn nút.

## Kiểm chứng

- TypeScript, ESLint nguồn, audit nguồn, định dạng JS/Python/PowerShell đạt.
- Kiểm tra bảo trì, ranh giới feature, workspace và clipboard đạt.
- Vite build và bundle backend đạt.
- `verify-motion-scene-routing.ts`: truyền đúng chính sách bật/tắt cho kho và Remotion; AI nội dung vẫn riêng.
- `verify-motion-scene-ai-settings.ts`: mặc định bật; tắt, lưu, tải lại và gửi request giữ false; bật lại độc lập với review.
- `verify-motion-scene-fallback.ts`: lỗi transport/kết quả không hợp lệ, bật/tắt dự phòng, chế độ một phản hồi/duyệt ảnh, giữ model và tách tuyến AI nội dung; mock toàn bộ AI.
- `verify-motion-single-draw.ts`: một lượt vẽ, review tùy chọn, tiếp tục cảnh sau, phục hồi trì hoãn và tạo lại riêng cảnh đạt.
- `verify-motion-action-layout.ts`: chiều rộng 360/768/1440px, nút cao 40px, không tràn, nút dừng một dòng và bấm được. Ảnh kiểm tra nằm trong `scratch/motion-scene-fallback-20261030/`.
- Bộ `verify-motion-ai-recovery.ts` cũ dừng ở kiểm tra nội dung editorial context. Đã chạy lại với `motionStoryService.ts` từ HEAD trước thay đổi và gặp cùng lỗi; lưu hai log trong `scratch/maintenance-20261030/scene-fallback*-recovery.log`. Không thay chính sách sản phẩm để bỏ qua kiểm tra này.

## Backend

Đã khởi động lại từ PID 30180 sang PID 80132 lúc 16:56:59 ngày 30/10/2026 (UTC+7). Cổng 3002 và `/api/motion-video/engine` trả HTTP 200. Đối chiếu SHA256 của 406 file production/draft/story-job trước và sau khởi động: không thay đổi. Không chạy tạo video hoặc gọi AI thật.
