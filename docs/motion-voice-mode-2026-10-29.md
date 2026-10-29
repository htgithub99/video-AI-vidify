# Cấu hình Phân vai giọng

## Giao diện và cách dùng

- Thêm nút **Phân vai giọng** ngay sau **Kênh giọng** trong cấu hình tạo video, dùng chung cho Kho và Remotion.
- **Bật — Nhiều giọng:** người kể và nhân vật dùng giọng riêng theo cấu hình, giữ hành vi trước đây.
- **Tắt — Một giọng:** giọng người kể đọc toàn bộ lời dẫn và lời thoại. Không gọi AI phân vai/tách thoại hoặc chọn giọng nhân vật/mượn giọng; vẫn dùng xử lý nhịp tham chiếu và kiểm tra giọng theo cấu hình.
- Giọng người kể lấy từ kênh đã chọn; gán giọng narrator thủ công được ưu tiên. Không bắt người dùng cung cấp đủ giọng nam/nữ/trẻ em khi chỉ dùng người kể. Không chọn kênh vẫn dùng cơ chế chọn narrator hiện có.
- Mặc định bật để tương thích các dự án cũ. Lưu lựa chọn khi tải lại trang. Nút khóa khi có công việc đang chạy để không đổi cấu hình giữa lượt.
- Audio tải lên không bị đổi thành một/nhiều giọng. MP4 đã xuất không tự thay đổi.

## Luồng dữ liệu

- State/UI gửi `multiVoice` vào production và bước viết kịch bản; lưu vào `script.voiceSettings.multiVoice` khi tắt. Lưu cả checkpoint viết dở và kịch bản hoàn chỉnh, giữ khi phục hồi hoặc sửa thời lượng.
- `withMotionVoiceMode` giữ nguyên kịch bản, hình và các gán giọng/lời thoại thủ công. Khi đổi chế độ, bỏ track đính kèm để tránh dùng nhầm; bật lại vẫn còn cấu hình nhân vật trước đó.
- Nhánh một giọng của `directMotionVoice` không mở phiên AI. Tạo một vai narrator và đọc nguyên văn từng beat bằng narration, không mang `voiceSpeaker` hoặc tốc độ thoại nhân vật sang người kể.
- Chữ ký plan/track đã bao gồm voiceSettings; hai chế độ có cache riêng. Chuyển trở lại chế độ cũ có thể tái dùng cache hợp lệ của chế độ đó. Không tăng phiên bản cache toàn hệ thống cho tùy chọn này.
- Phục hồi draft vẫn giữ hình đã dựng, nhưng không nhận preview âm thanh cũ nếu cấu hình giọng khác.

## Kiểm chứng

- `verify-motion-voice-attribution.ts`: khóa giọng, gán narrator thủ công, không cần đủ giọng nhân vật, không cần kênh, một giọng xuyên suốt clip, bỏ giọng mượn, không gọi AI phân vai, tách cache, từ chối track chế độ khác, khôi phục cấu hình chỉnh tay khi bật lại và hủy tác vụ.
- `verify-motion-voice-mode-ui.ts`: nút thật trong UI Kho và Remotion, mặc định của dự án cũ, tải lại trang giữ trạng thái, request production nhận đúng cả hai giá trị. Toàn bộ API được giả lập.
- `verify-motion-production-runner.ts`: mode tắt tới cả dựng cảnh/giọng/compile, tiếp tục sau lỗi cảnh vẫn giữ mode và audio đã đạt.
- `verify-motion-visual-drafts.ts --fixture`: đổi cách dựng giữ tài nguyên; đổi chế độ giọng không phục hồi nhầm preview cũ.
- TypeScript `tsc --noEmit`: đạt. Không gọi AI/TTS trực tiếp hoặc tạo video thử.

Chạy kiểm tra UI và audio bằng `npm run test:motion-voice-mode`.

## Trạng thái nạp backend

Người dùng đã cho phép khởi động lại sau khi lệnh ban đầu bị hệ thống phê duyệt tự động chặn. Đã xác nhận không có production hoặc render Motion đang chạy, rồi khởi động lại riêng backend cổng 3002: PID 75540 → 13868. Server đã nạp code mới, API trả `success: true`; dự án Gạo trước, muối sau vẫn `completed`, stage `Video đã hoàn thành`. Không tạo video mới hoặc đổi dữ liệu dự án.

Log khởi động: `scratch/voice-mode-20261029/backend-20261029-165908.stdout.log` và stderr tương ứng. Startup vẫn báo chưa kết nối trình duyệt sinh ảnh cổng 9222; đây là cảnh báo kết nối riêng, backend đã sẵn sàng.
