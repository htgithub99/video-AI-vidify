# Khôi phục room đánh giá và lưu từng nhóm nhạc

## Nguyên nhân đã xác nhận

Lượt `music-track-evaluation-1793436366088`: đủ 50 MP3 lúc 15:46:12; room 5 và 2 lỗi readiness trước bước đánh giá; room 1, 4, 3 chọn xong 15 bản. Code cũ bỏ qua vòng retry vì lỗi nằm ở bước chuẩn bị room; chỉ ghi checkpoint khi tất cả nhóm thành công. Toàn lượt dừng trước xuất file và lần sau đánh giá lại các nhóm tốt.

## Thay đổi

- Khởi tạo room nhạc dùng hàng đợi riêng, tối đa một khởi tạo mỗi thời điểm. Chỉ khóa bước chuẩn bị, giữ giới hạn năm room đánh giá đồng thời. Lỗi readiness, điều hướng tạm thời và tab đóng được thử tối đa ba lần với cùng cấu hình. Đóng riêng room lỗi trước khi mở lại; không gửi prompt trong cơ chế khôi phục này. Hủy tác vụ và lỗi model không khả dụng không thử lại.
- Lưu kết quả mỗi nhóm vào checkpoint đánh giá riêng ngay khi phân tích kết quả thành công. Ghi nguyên tử, tuần tự các cập nhật để các nhóm hoàn thành đồng thời không ghi đè nhau. Dùng chung kiểm tra cặp bài, ID, điểm và số lựa chọn cho checkpoint đầy đủ và từng phần.
- Lần tải tiếp chỉ chuẩn bị âm thanh, mở room và đánh giá nhóm còn thiếu. Nhóm đã lưu vẫn tham gia xếp hạng chung; không xuất thiếu nhóm. Checkpoint tải phiên bản 2 và các file xuất đã hoàn thành vẫn dùng được. Khóa kết quả gồm playlist, danh sách ứng viên theo thứ tự, style, model và dữ liệu styleAnalysis nếu có.
- Ưu tiên nút model có test ID chính thức, không chọn nhầm nút Pro khác. Chọn phần tử nhập thực, bỏ wrapper và trường bất hoạt; kiểm tra thêm khả năng nhập thực tế vì `isEditable()` có thể trả true cho role textbox với contenteditable false. Thử mở composer thu gọn tối đa ba lần; giữ nguyên nội dung đã nhập.
- Log lỗi chứa tình trạng hiển thị/nhập của composer, trạng thái nút model, nhãn model, số poll ổn định, lần focus, thời gian chờ và trạng thái tab. Không ghi nội dung nhạc hoặc URL xác thực trong các trường mới. Giữ đăng nhập/xác minh Google theo cơ chế chờ hiện có.
- Lỗi HTTP 502 từ nguồn WAV là lỗi dịch vụ riêng; thay đổi này không thay MP3 đánh giá thành WAV xuất.

## Kiểm chứng

- `npm run test:music-download-recovery`: chạy điều phối thật với dịch vụ thay thế, lưu 15 lựa chọn khi hai nhóm lỗi, lần sau chỉ xử lý hai nhóm và 20 file, ghi đồng thời không mất nhóm, từ chối checkpoint sai; startup phục hồi/giới hạn/hủy/lỗi terminal; một bootstrap nhưng năm đánh giá đồng thời; fixture Chromium cho readiness; chuẩn bị cache và xuất WAV/MP3.
- `scripts/verify-gemini-thinking.ts`: model/mức tư duy, menu chậm, readiness chậm qua lượt thử thứ hai, hủy, cấu hình đã lưu. Tăng thời gian fixture ngắn để đủ các lần kiểm tra DOM thực, giữ trường hợp readiness trễ hơn timeout đầu tiên.
- `scripts/verify-music-upload-progress.ts`: streaming và trạng thái Nhật ký hoạt động.
- Cập nhật kiểm tra tĩnh audio sang danh sách nhóm còn thiếu; sửa kỳ vọng playlist cũ từ cảnh báo thiếu bài sang lỗi, khớp hành vi đã tồn tại trước thay đổi này.

Các kiểm tra dùng dữ liệu và trình duyệt mô phỏng cục bộ; không gọi AI/Suno thật, không tạo bài mới. Kết quả từng nhóm của lượt cũ chỉ có trong log không tự động được chuyển thành checkpoint mới.
