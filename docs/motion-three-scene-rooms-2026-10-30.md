# Ba room riêng cho AI dựng cảnh

## Chính sách mới

- Pool dựng cảnh có ba worker riêng: `motion-scene-first`, `motion-scene-second`, `motion-scene-third`.
- Pool và giới hạn nhà cung cấp của dựng cảnh tách khỏi nội dung. SEO, phân cảnh hoặc duyệt ảnh không chiếm ba slot vẽ.
- Bắt đầu có yêu cầu vẽ thật thì mở sẵn ba room của AI đã chọn đồng thời, không gửi prompt chỉ để mở room. Các lời gọi chuẩn bị trùng nhau dùng chung một Promise trong phiên.
- Các cảnh độc lập được gửi tối đa ba yêu cầu vẽ đồng thời; số cảnh ít hơn thì không tạo yêu cầu vẽ dư.
- Remotion giữ cảnh mẫu theo địa điểm: ba tab đã mở nhưng cảnh cần tham chiếu chờ cảnh mẫu xong. Sau đó tối đa ba cảnh vẽ đồng thời.
- Claude cũng có ba slot dựng cảnh; giới hạn tác vụ nội dung của Claude vẫn giữ nguyên.
- Luồng tạo tài nguyên của Kho dùng cùng pool vẽ. Luồng chỉ ghép tài nguyên sẵn có không gọi AI vẽ để lấp đầy slot.
- Giữ AI/model, chính sách dự phòng và cấu hình duyệt ảnh. Chuẩn bị room thất bại không ngăn các room khác; khi gửi yêu cầu thật, cơ chế phục hồi hiện tại xử lý room chưa sẵn sàng.
- Hủy trong lúc chuẩn bị không lưu Promise lỗi vào phiên; tiếp tục có thể mở lại. Hủy khi đang vẽ không gửi thêm cảnh đang chờ.

## Kiểm chứng

`scripts/verify-motion-scene-fallback.ts` đã kiểm tra bằng transport giả lập:

- Gemini, ChatGPT, DeepSeek và Claude: ba worker vẽ khác nhau cùng hoạt động.
- Một request nội dung cùng nhà cung cấp chạy đồng thời với ba request vẽ, tổng bốn request; room nội dung có ID khác.
- Ba room chuẩn bị đồng thời; chưa gửi bất kỳ prompt AI nào trong bước mở room.
- Luồng Remotion thật qua planner, chuẩn hóa SVG và checkpoint: bốn cảnh đạt, giữ cảnh mẫu đầu tiên rồi ba cảnh sau chạy song song.
- Giữ các kiểm tra dự phòng bật/tắt và duyệt ảnh.
- Hủy sáu yêu cầu đang xếp hàng chỉ gửi ba yêu cầu đã bắt đầu. Chuẩn bị ba room bị hủy rồi tiếp tục mở lại được.

TypeScript, ESLint các file sửa, audit nguồn, kiểm tra định dạng, feature boundaries, routing và `verify-motion-single-draw.ts` đạt. Bundle backend đạt. Không gọi AI thật hoặc tạo video.

`verify-motion-cancellation.ts` của giao diện vẫn lỗi tại kiểm tra lưu lịch sử: fixture kỳ vọng job analyze, nhưng poll giả lập trả kind scenes và thêm log vào job đó. Test này dùng hook frontend, không nạp các service server thay đổi trong bản sửa. Không thay luồng nhật ký để bỏ qua kiểm tra này; log tại `scratch/motion-scene-fallback-20261030/three-room-cancellation.log`.
