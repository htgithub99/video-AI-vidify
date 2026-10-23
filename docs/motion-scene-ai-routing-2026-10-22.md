# AI dựng video 2D/3D

Đổi mục “AI vẽ cảnh chính” thành “AI dựng video 2D/3D”. AI được chọn ở đây phụ trách mọi lời gọi AI trong bước Dựng cảnh 2D/3D: phong cách, hồ sơ tiếng Anh, đọc yêu cầu từng câu, chọn/vẽ nhân vật, bối cảnh, đạo cụ, dựng bố cục, kiểm tra ảnh, phân vai giọng và lập kế hoạch âm thanh. Tạo giọng riêng và tạo kho cũng dùng cấu hình này.

AI hỗ trợ nội dung tiếp tục dùng cho phân tích, viết kịch bản và SEO. Không thay model TTS, giọng đã chọn hay nội dung truyện.

Trước đây request dựng cảnh gửi cả `aiExecution` và `mainAiExecution`. Các service hồ sơ, phong cách, READ, COMPOSE và âm thanh ưu tiên `mainExec`, nên dù chọn Gemini để vẽ, nhiều công đoạn dựng vẫn gọi AI nội dung.

Request dựng, tạo kho và tạo giọng giờ chỉ dùng cấu hình dựng được chọn. Backend gắn role `draw` và không dùng trường `mainAiExecution` cũ, kể cả khi client cũ còn gửi lên. Các option của pipeline puppet chỉ còn một `exec`, các lời gọi AI và giới hạn song song đều dùng nó. Model, mức suy luận và chế độ hiện/ẩn trình duyệt được truyền nguyên theo cấu hình. Cơ chế dự phòng hiện hành vẫn hoạt động.

Kiểm tra:

- `scripts/verify-motion-scene-routing.ts`: chạy controller thật với service giả lập; xác nhận dựng mới, dựng lại từng cảnh, tạo kho, phân vai/tạo giọng tự động và tạo giọng riêng dùng cấu hình dựng, bỏ qua AI nội dung cũ.
- `scripts/verify-motion-scene-ai-settings.ts`: kiểm tra giao diện trong trình duyệt độc lập, giữ cấu hình qua tải lại và payload thực của thao tác dựng. Ảnh giao diện ở `scratch/motion-scene-ai-settings.png`.
- `scripts/verify-motion-asset-catalog.ts`: kiểm tra hồ sơ dùng AI dựng ngay cả khi caller cũ còn trường `mainExec`; giữ các kiểm tra phân loại, định danh, cache và SVG.
- `tsc --noEmit`: kiểm tra kiểu.

Lệnh `npm run test:motion-scene-ai` đã trỏ vào bộ kiểm tra controller hiện hành thay cho script cũ nhập các module đã bị xóa. Không gửi AI thật và không render video trong lượt kiểm tra này.
