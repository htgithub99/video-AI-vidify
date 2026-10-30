# Khắc phục xuất video khi chưa đủ cảnh

## Nguyên nhân đã xác định

- Dự án `e4d59d890b7cbe7a22c4817ddcc82630` có 54 cảnh, 53 cảnh đạt. Cảnh 39 thất bại hai lượt vì SVG chứa `pattern`, một thẻ họa tiết nội bộ hợp lệ nhưng chưa có trong danh sách hỗ trợ.
- Trạng thái `partial` được coi là đủ để xuất; compiler trả `missing: []` dù có cảnh lỗi. Ảnh giữ chỗ vì vậy đi vào video.
- Cảnh đã hết hai lượt thử không được coi là cần phục hồi khi tiếp tục dự án.

## Thay đổi chung

1. Hỗ trợ SVG `pattern` trong cảnh hoàn chỉnh; giữ kiểm tra script, handler, tài nguyên ngoài và URL ngoài. Giữ nguyên prompt và phong cách của cả ba kiểu hình.
2. Sau lượt đầu, thử lại cảnh lỗi trong giới hạn hiện có. Lỗi nhẹ về cấu trúc SVG vẫn được sửa bằng code.
3. Khi người dùng tiếp tục, cấp lại lượt thử cho cảnh lỗi, giữ cảnh đạt, kịch bản, giọng và SEO. Có thể tái sử dụng bản SVG lỗi đã lưu nếu bộ đọc mới đã xử lý được nó. Dựng lại riêng cảnh vẫn yêu cầu kết quả mới.
4. Bước dựng cảnh báo chưa hoàn tất nếu còn cảnh lỗi, sau khi lưu kết quả từng phần. Production kiểm tra thêm trước khi đánh dấu bước này hoàn tất.
5. Compiler chặn bản chưa đủ cảnh. Chế độ xem trước nội bộ vẫn dùng được và trả đúng danh sách cảnh thiếu.
6. API xuất video và renderer có kiểm tra riêng; bản biên dịch cũ có ảnh giữ chỗ cũng bị chặn, kể cả đã bỏ metadata lỗi.
7. Loại điều kiện hoàn tất cho phép còn cảnh lỗi và điều kiện phục hồi phụ thuộc số lượt cũ. Tiến độ cuối bước dựng phản ánh số cảnh đạt.

Không tạo ảnh giữ chỗ rồi coi đó là thành công. Khi dịch vụ AI hoặc kết quả AI vẫn lỗi sau phục hồi, giữ tiến độ và báo cảnh cần tiếp tục. Không thay model hoặc bật dự phòng ngoài cấu hình đã chọn; không cam kết mọi dịch vụ AI luôn trả kết quả hợp lệ.

## Kiểm tra

- TypeScript: đạt.
- ESLint các file thay đổi: đạt.
- Kiểm tra ranh giới tính năng: đạt.
- `verify-motion-single-draw`: đạt; bao gồm ba kiểu hình, duyệt ảnh bật/tắt, phục hồi sau lượt đầu, tiếp tục cảnh hết lượt thử, bảo toàn cảnh đạt và chặn xuất tại compiler/API/renderer.
- `verify-motion-local-svg-repair`: đạt; thêm họa tiết nội bộ và từ chối nội dung không an toàn bên trong họa tiết.
- `verify-motion-remotion-qa`, `verify-motion-scene-fallback`, `verify-motion-publication-faults`: đạt.
- Kiểm tra production tập trung: đạt; mô phỏng bước dựng trả completed nhưng còn cảnh lỗi, xác nhận không compile/render, giữ voice và chỉ tiếp tục dựng cảnh trước khi xuất. Bao gồm các ca hồi quy chế độ kho ở phần đầu production runner.
- Đọc lại chính SVG thất bại của cảnh 39: nhận được 11 lớp hình, giữ họa tiết, không gửi AI và không ghi vào dự án thật.
- Bộ `verify-motion-production-runner` đầy đủ còn vướng ca cũ yêu cầu tự viết lại theo thời lượng; chạy nguyên bản từ HEAD cũng lỗi cùng ca. Không siết lại QA thời lượng để đáp ứng fixture cũ.
- Audit text toàn repo còn ba literal có sẵn ở `motionIdentityReference.ts` và `motionStoryTimeline.ts`; không phát sinh literal mới trong các file sửa lần này.

Không gọi AI trực tiếp và không tạo video thử trong lần sửa này.

## Nạp backend

- Khởi động lại lúc 22:22:23 ngày 30/10/2026; PID mới `90780`.
- Chỉ khởi động lại sau khi không còn production hoặc story job Motion đang chạy.
- Biên nhận và danh sách hash 419 file dữ liệu: `scratch/motion-complete-scenes-20261030/`.
- Xác nhận sau khởi động: HTTP 200 trên cổng 3002, PID 90780; 419/419 file dữ liệu giữ nguyên hash.
