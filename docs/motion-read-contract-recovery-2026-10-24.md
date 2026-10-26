# Phục hồi dữ liệu hình minh họa

Lượt lỗi ngày 24/10 nhận phản hồi Gemini từ chối, sau đó nhận JSON nhưng dữ liệu đọc cảnh vẫn không đạt. Trước đây, lớp điều phối ghi nhận thành công trước khi kiểm tra nội dung; lớp đọc cảnh chỉ sửa thêm một lượt rồi báo lỗi chung. UI còn lấy tiến độ render cũ sau khi dựng cảnh lỗi.

## Thay đổi

- Mỗi nhóm đọc cảnh được kiểm tra nội dung bên trong cơ chế điều phối AI. Chỉ ghi nhận thành công sau khi đủ các nhịp hình được yêu cầu và dữ liệu đã đạt kiểm tra.
- Kiểm tra chỉ số nguyên, chỉ số trùng, sự kiện hình, tư thế từng người, bố trí và đồ vật chính; bối cảnh mới phải có mô tả.
- Giữ nguyên nhịp hình đã đạt. Với bản nháp chưa đạt, giữ dữ liệu đã cung cấp để bổ sung trường thiếu, bao gồm trạng thái riêng của từng nhân vật.
- Phản hồi sửa chỉ yêu cầu nhịp hình còn thiếu, giữ nguyên chỉ số ban đầu. Prompt ghi rõ lỗi, lời kể và bản nháp liên quan.
- Mỗi tuyến AI có một lần đầu và hai lượt sửa trong room hiện tại; lần thứ tư mở room mới và chuyển tiếp phần đã đúng. Nếu vẫn không đạt, thử tuyến dự phòng được cấu hình. Các lỗi gửi không rõ kết quả và hủy vẫn tuân theo cơ chế bảo vệ hiện có.
- Nhận diện đúng câu từ chối “Tôi không được lập trình để làm điều đó.”. Bước đọc cảnh có kiểm tra nội dung có thể chuyển tuyến AI khi bị từ chối; việc này không thay đổi cách xử lý từ chối của tác vụ không có bộ kiểm tra.
- Lưu ngay kết quả đã đạt vào bản dựng dở qua `partial`, không đợi toàn bộ nhóm hoàn tất.
- Không tự chèn người nói ngoài hình vào nhịp hình đã được storyboard lựa chọn. Phân cảnh kiểu cũ vẫn giữ hành vi trước đây.
- Lưu phản hồi bị loại, bản nháp, chỉ số, mã nhịp hình, lời kể, lỗi cụ thể và tuyến AI trong thư mục `storage/output/motion-video/ai-debug`, tên bắt đầu bằng `motion-puppet-read-contract-` (hoặc thư mục lưu trữ được cấu hình tương ứng).
- Tiêu đề, tiến độ, bước hiện tại và kết quả render trong khung log dùng tác vụ đang chạy hoặc tác vụ mới nhất. Nếu tải lại trang chỉ còn lịch sử của tác vụ mới, không hiển thị tiến độ render cũ thay thế.

## Kiểm tra

- `npx tsc --noEmit`.
- `npm run test:motion-ai-recovery`: sửa nhiều lượt, đổi room, chuyển tuyến khi JSON thiếu nội dung và khi AI từ chối; giữ phần đã đạt, room độc lập và bảo vệ gửi trùng.
- `npm run test:motion-visual-contract`: dữ liệu thiếu/trùng/sai chỉ số, sửa từng trường, giữ từng trạng thái nhân vật, checkpoint, hủy, người nói ngoài hình, tiến độ sau lỗi và tải lại; hiệu ứng và liên tục tư thế.
- `npm run test:motion-storyboard`: chia nhịp hình, thoại, tái sử dụng và render ảnh thật bằng renderer cục bộ.
- `npm run test:motion-asset-catalog`: phân loại, hồ sơ tiếng Anh và tái sử dụng tài nguyên.
- `npx tsx scripts/verify-chat-response-snapshots.ts`: đọc phản hồi trong trình duyệt cục bộ, nhận diện đúng câu từ chối trong lượt lỗi.
- `npm run test:motion-editorial-ui`: log qua tải lại và UI trạng thái gọn.
- `npm run test:motion-cancellation`: dừng tác vụ, giữ bản dựng dở, tải lại trang và các tình huống hoàn tất đồng thời.

Các kiểm thử AI dùng phản hồi mô phỏng và fixture trình duyệt cục bộ. Chưa chạy thêm một video toàn trình với Gemini thật sau bản sửa này. Khi mọi tuyến đều không cung cấp được nội dung hợp lệ, tool vẫn dừng với lỗi cụ thể và giữ phần đã đạt; không tự tạo cảnh trống để báo thành công.
