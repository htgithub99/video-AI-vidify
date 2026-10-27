# Giữ dữ liệu khi đổi Cách dựng

## Nguyên nhân

- Hàm cập nhật cấu hình xóa dữ liệu dựng cảnh của cả Kho và Remotion cùng bản xem trước khi đổi cách dựng.
- Khi tải lại trang, kiểu hình Remotion hiển thị được khôi phục nhưng giá trị kiểu hình dùng cho lần chuyển tiếp theo vẫn có thể là mặc định Lịch sử. Vì vậy chuyển về Remotion không tìm đúng cảnh Truyện ma đã dựng.

## Đã sửa

- Lưu bản dựng theo cách dựng, kiểu hình Remotion và gói trong kho. Quay lại lựa chọn trước sẽ lấy lại cảnh, tài nguyên, thumbnail và bản xem trước phù hợp.
- Lưu các bản dựng trong IndexedDB, bao gồm bản đang không được chọn.
- Kịch bản, lời đọc và SEO dùng chung. Chỉ khôi phục bản dựng khi nội dung phân tích và kịch bản còn khớp. Thay kịch bản mới sẽ không lấy cảnh từ truyện trước.
- Kiểm tra chữ ký cấu hình trước khi dùng lại bản xem trước đã lưu.
- Đồng bộ kiểu hình Remotion khi tải lại trang.
- Hủy theo dõi render cũ khi chuyển cách dựng; kết quả cũ không ghi đè sang cách dựng vừa chọn.
- Xóa video cũng bỏ tham chiếu video đó trong các bản dựng đã lưu, giữ nguyên cảnh.
- Khi bản nháp cũ đã bị xóa cảnh, thử đọc kết quả sản xuất hoặc dựng cảnh đã kết thúc, có cùng truyện và cấu hình, để lấy lại cảnh. Chỉ đọc trạng thái; không tiếp tục lượt sản xuất hoặc gửi prompt.

## Kiểm tra

- `npx tsx scripts/verify-motion-visual-drafts.ts`: đạt với dữ liệu 18 cảnh của Mâm Cúng Bên Bến Sông đã lưu.
- `npx tsx scripts/verify-motion-visual-drafts.ts --fixture`: đạt với bộ dữ liệu độc lập có 18 cảnh.
- Kiểm thử dùng hook React và nút Cách dựng thật trong trình duyệt, chuyển qua lại bốn lượt, đổi kiểu hình, đổi gói, lưu và tải lại bằng IndexedDB; kiểm tra phục hồi cảnh cũ và từ chối lấy cảnh của truyện đã sửa. API được mô phỏng, không gọi AI/TTS hoặc tạo video.
- Kiểm tra thay giọng không lấy lại bản xem trước âm thanh cũ; xóa kết quả không xóa cảnh.
- `npx tsx scripts/verify-motion-editorial-ui.ts`: đạt, log vẫn được giữ qua tải lại trang. So sánh dữ liệu log theo định dạng JSON đã lưu để bỏ qua thuộc tính undefined.
- Bài kiểm thử cũ `verify-motion-draft-preservation.ts` còn giả định đổi gói vẫn giữ nguyên tài nguyên của gói cũ ở trạng thái đang chọn và Phân tích dùng luồng API cũ. Bài này chưa được chuyển sang vòng đời sản xuất hiện tại; không dùng kết quả của nó để kết luận bản sửa đã đạt.

Không tạo hoặc tiếp tục video sản xuất trong lượt sửa này. Dữ liệu mất từ bản cũ chỉ phục hồi được nếu kết quả phù hợp vẫn còn trên máy.
