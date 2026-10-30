# Phục hồi lỗi dịch vụ AI và SVG thừa thẻ đóng

## Bằng chứng

- Dự án `2e0ac4a25d2b5b71a66dd509062c113a`, “The Nile Bank: 47 BC”.
- 23:44:25 ngày 30/10: Gemini trả `Sorry, something went wrong. Please try your request again.`. Bộ đọc nhận diện là lỗi dịch vụ, không phải SVG không đạt.
- Bộ điều phối đặt thời hạn chờ theo provider/model, ba luồng dựng cùng chờ đến 23:54:25. Backend vẫn HTTP 200.
- Trạng thái chờ trước đây ghi `checking` và log một lần; giao diện tiếp tục giữ số cảnh đã đạt, gây cảm giác treo.
- Cảnh `c1_event_78ea90919ceb:1` có một thẻ `</g>` thừa ngay trước `</svg>`. Stack lúc đó chỉ còn phần tử gốc, không có nhóm tương ứng để đóng.

## Thay đổi

- Lỗi dịch vụ AI dùng thời gian chờ 120 giây. Lỗi tải ảnh/tệp tham chiếu giữ chính sách riêng 600 giây.
- Trong lúc chờ, cập nhật số giây còn lại mỗi 30 giây và dùng trạng thái `provider` (“Đang chờ dịch vụ”). Khi hết chờ, ghi rõ tiếp tục yêu cầu bằng AI đã chọn.
- Kiểm tra lại thời hạn sau mỗi khoảng chờ, xử lý đúng nếu thời hạn được gia hạn, và hủy được ngay khi người dùng dừng.
- Không chuyển AI khi cấu hình dự phòng tắt. Không coi câu báo lỗi dịch vụ là cảnh hợp lệ.
- Chỉ bỏ `</g>` không có thẻ mở tương ứng khi nó nằm ở đuôi SVG và stack chỉ còn thẻ gốc. Giới hạn tổng số thẻ sửa là 32; lỗi mơ hồ, thẻ sai loại và mã bị cắt giữa thuộc tính vẫn không được tự đoán.
- Tiếp tục kiểm tra cấu trúc và an toàn sau sửa. Không thay bố cục hoặc nét vẽ. Giữ nguyên ba prompt kiểu hình.
- Bỏ hai import không còn dùng trong production service được TypeScript phát hiện.

## Kiểm tra

- Phục hồi AI: đạt, gồm model/tham chiếu, fallback, ba phòng, kết quả đến muộn, hủy, giới hạn 120 giây, đếm ngược và thời hạn thay đổi.
- SVG: đạt, gồm thiếu/thừa thẻ đóng, tính lặp lại, giới hạn sửa, dữ liệu bị cắt, kiểm tra đầu ra đã loại nội dung nguy hiểm theo sanitizer hiện có.
- Luồng một yêu cầu dựng cảnh: đạt cho ba kiểu hình; sửa được thẻ đóng thừa mà không gọi thêm AI; giữ chốt không xuất khi thiếu cảnh.
- Đọc lại chính SVG lỗi đã lưu: bỏ đúng 4 ký tự `</g>`, giữ số lượng mọi hình path/rect/circle/ellipse/polygon/line, nhận 11 lớp hình. Không ghi vào dự án thật và không gọi AI.
- ESLint các file sửa: đạt.
- TypeScript và kiểm tra ranh giới tính năng: đạt.

## Áp dụng

- Backend đã nạp lại lúc 00:02:15 ngày 31/10/2026, PID 75104; xác nhận HTTP 200 tại cổng 3002.
- Kiểm tra trước khi nạp: không có production/story job Motion đang chạy. Không tự tiếp tục dự án người dùng đã dừng.
- Kiểm tra hash sau nạp: 431/431 file dữ liệu giữ nguyên. Không tạo video thử.

Lỗi dịch vụ bên Gemini không thể sửa nội bộ bằng SVG hoặc JavaScript của ứng dụng. Bản sửa xử lý việc chờ, phục hồi và hiển thị trạng thái; không bảo đảm dịch vụ bên ngoài luôn trả kết quả.
