# MP4 đã xuất bị ẩn khỏi Xem trước — 31/10/2026

## Nguyên nhân

Màn Chrome đang mở có video **The Battle of the Nile, 47 BC**, thời lượng 111,133 giây. Log xác nhận hoàn tất và video ở phần kết quả tải thành công (`readyState=4`, không có media error), nhưng khung Xem trước báo chờ xuất.

`renderedVideoUrl` trước đây yêu cầu chữ ký cấu hình lúc xuất trùng tuyệt đối với trạng thái hiện tại. Đổi cấu hình, hoặc cập nhật phiên bản camera, làm chữ ký lệch và ẩn MP4. Nhánh tự động xuất chỉ thấy không có URL nên hiện thông báo chờ dù file đã tồn tại. Khi tải lại trang, khôi phục bản nháp còn phụ thuộc compilation đang khớp nên cũng có thể bỏ qua video đã xuất.

## Sửa

- Tách việc xem lại file đã xuất với việc kiểm tra nó có phản ánh cấu hình mới nhất hay chưa.
- Giữ MP4 hoàn tất của lượt hiện tại trong Xem trước, ở cả chế độ tự động và thủ công.
- Nếu cấu hình/nội dung/phiên bản thay đổi, hiển thị chú thích rằng đây là video đã xuất gần nhất và cần xuất lại để áp dụng thay đổi mới.
- Khôi phục video đã xuất độc lập với compilation dùng cho xem trực tiếp; vẫn kiểm tra đúng bản nháp và ID đầu ra.
- Giữ việc xóa kết quả và dựng lại cảnh làm mất liên kết MP4 cũ. Không lấy video của kiểu hình hoặc câu chuyện khác làm kết quả hiện tại.
- Badge hiển thị **MP4 · Đã xuất** khi xem file, **2D · Remotion** khi xem trực tiếp Remotion, **2D · Canvas** cho Canvas.

## Kiểm tra

- `verify-motion-exported-preview.ts`: chữ ký cũ, sửa cấu hình, thiếu compilation, khôi phục bản nháp, xóa/dựng lại, job chưa hoàn tất, cách ly câu chuyện/kiểu hình — đạt.
- `verify-motion-scene-rebuild.ts`: luồng hook thật ở cả hai cách dựng; không hồi sinh MP4 sau dựng lại, xử lý kết quả đến muộn, giữ MP4 và báo cũ khi chỉ đổi cấu hình — đạt.
- `verify-motion-visual-drafts.ts --fixture`: đổi cách dựng/kiểu hình, tải lại trang, khôi phục dữ liệu và loại câu chuyện không khớp — đạt.
- TypeScript và kiểm tra whitespace đạt.
- Đã xác minh trực tiếp trên tab Chrome của người dùng: khung Xem trước tải đúng MP4 1:51, thay thông báo chờ bằng video và chú thích cấu hình mới. Không tạo lại video, AI hoặc giọng đọc.
