# Sửa tham chiếu bối cảnh khi dựng khung hình

## Nguyên nhân đã xác minh

Lượt chạy `a9378a55-1c05-489e-973d-900cd9c3c25a`, truyện **Bát cơm cúng dở bên chái bếp**, dừng khi kiểm khung hình với `Fixed interaction layout unavailable: conversation`.

Bước đọc cảnh đã tạo bối cảnh biến thể có đầy đủ bố cục tương tác. Tuy nhiên, `puppetKeyOf` luôn gọi `snakeCase`, biến mã `gian_buong_nha_ngoi_visual_22d6f4896130` thành `gian_buong_nha_ngoi_visual_22_d_6_f_4896130`. Bước sửa tham chiếu không tìm được mã này rồi âm thầm lấy bối cảnh gốc từ câu kể. Bối cảnh gốc thiếu bố cục conversation hoặc điểm tựa cần thiết nên layout thất bại.

Trong dữ liệu thực tế, cả 41 khung đều trỏ sang bối cảnh khác với kết quả đọc cảnh. Trước khi sửa có 17 khung lỗi bố cục hoặc điểm tựa. Các biến thể đúng đã có trong kho của dự án; không cần vẽ lại để xử lý nguyên nhân này.

## Bản sửa

- Giữ nguyên mã tham chiếu hợp lệ, bao gồm số, hậu tố hash và tên biến thể dài. Chỉ chuẩn hóa nhãn tự do.
- Khi chọn khung hình và giữ liên tục vị trí, dùng bối cảnh đã xác định trong kết quả đọc cảnh để lấy đúng điểm đặt, trạng thái đồ vật và bố cục.
- Dùng chung `repairPuppetFrameReferences` cho pipeline và trình biên dịch khung hình. Khung cũ bị trỏ về bối cảnh gốc được liên kết lại với biến thể đã chuẩn bị, bao gồm khung phụ.
- Khi thiếu bối cảnh thực sự, báo rõ mã cần phục hồi thay vì âm thầm chuyển sang bối cảnh khác.
- Giữ các kiểm tra về vai trò, tư thế và điểm tựa; không xóa ràng buộc layout để vượt lỗi.

## Kiểm tra

- `npx tsc --noEmit`.
- `npm run test:motion-visual-contract`, gồm bài hồi quy mới `verify-motion-frame-references.ts`.
- `npm run test:motion-storyboard`.
- `npm run test:motion-ai-recovery`.
- `npx tsx scripts/verify-motion-placement-general.ts`.
- `npx tsx scripts/verify-motion-fixed-compositions.ts`.
- Bài hồi quy kiểm tra mã số/hash, tính ổn định khi chuẩn hóa lặp lại, khung cũ, khung phụ, không sửa dữ liệu đầu vào, lỗi thiếu bối cảnh, và người ngồi/người đứng tại các điểm riêng biệt. Nhánh biên dịch thực tế được kiểm tra với cả hai gói **Tối giản mặt nạ** và **Chibi màu dân gian**, trong kho tạm riêng.
- Trên lượt chạy bị lỗi: phục hồi 41/41 tham chiếu; cả 41 khung vượt kiểm tra layout; biên dịch được 42 shot, danh sách tài nguyên thiếu rỗng; dữ liệu dự án đầu vào giữ nguyên. Báo cáo tại `scratch/frame-recovery-20261024.json`.
- Dựng thử bốn ảnh watching, conversation, doorway, bedside bằng renderer thật, không có lỗi engine. Ảnh và kết quả tại `scratch/frame-recovery-20261024/` và `scratch/frame-recovery-20261024-stills.json`.

## Phạm vi xác nhận

Chưa chạy lại quy trình gọi AI, voice và xuất video toàn trình. Ảnh dựng thử từ dữ liệu cũ vẫn có đạo cụ bị xoay hoặc sai tỉ lệ; không dùng việc vượt kiểm tra layout làm bằng chứng rằng toàn bộ hình minh họa đã đạt chất lượng.

## Xác minh trên backend sau lỗi 11:46:56

Backend PID `71576` vẫn chạy từ 10:57:39, trước các thay đổi của bản sửa. Gửi cùng dữ liệu bị lỗi tới `/api/motion-video/story/compile` trên tiến trình này trả HTTP 400 với `Fixed interaction layout unavailable: conversation`, trong khi code trên đĩa biên dịch thành công 42 shot. Kết quả đối chiếu trước khi khởi động lại lưu tại `scratch/live-layout-comparison-20261024.json`.

Sau khi người dùng xác nhận cho phép khởi động lại thao tác từng bị hệ thống phê duyệt tự động chặn, backend được khởi động lại lúc 11:49:28, PID `79924`. Cùng dữ liệu được gửi lại qua API thật: HTTP 200, `success:true`, 42 shot, không thiếu tài nguyên. Kết quả tại `scratch/live-layout-after-restart-20261024.json`. Không cần thay đổi thêm thuật toán layout trong lượt đối chiếu này.

Đã lưu script và toàn bộ thông tin job lỗi tại `scratch/layout-failed-script-20261024.json` và `scratch/layout-failed-job-before-restart-20261024.json` trước khi khởi động lại. Job nằm trong bộ nhớ tiến trình cũ không còn truy vấn được sau khi khởi động lại; dự án lưu ở trình duyệt/kho dữ liệu không bị chỉnh sửa. Không tự tạo lượt chạy AI hoặc xuất video mới.
