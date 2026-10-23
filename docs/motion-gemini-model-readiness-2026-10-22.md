# Chờ giao diện Gemini trước khi chọn model

## Nguyên nhân

Hai yêu cầu COMPOSE trong `storage/logs/music-workflow.jsonl` lúc 15:37:41 và 15:37:48 ngày 22/10/2026 (giờ Việt Nam) bị báo `gemini_thinking_unavailable` cho `gemini-flash::high`. Code cũ chuyển mọi lỗi thao tác chọn model/mức tư duy thành mã này; Motion sau đó tạm bỏ qua model đó trong 10 phút. Lỗi tải giao diện, menu chưa xuất hiện hoặc lựa chọn chưa được xác nhận vì vậy cũng có thể bị hiểu thành model không khả dụng.

Log cũ không lưu pha chọn model bị lỗi, nên không đủ bằng chứng xác định chính xác hai yêu cầu trên hỏng ở thao tác nào.

## Thay đổi

- Chờ ô nhập sửa được và nút chọn model hiển thị, bật, có nhãn ổn định qua ba lần kiểm tra trước khi chọn. Áp dụng cả khi chuẩn bị room và trước thao tác chọn model.
- Chờ model gốc đúng trước khi chọn mức tư duy; kiểm tra dấu đã chọn của mức tư duy và xác nhận lại model trước khi tiếp tục gửi prompt.
- Thử lại việc chọn trên cùng trang tối đa hai lượt. Menu/option chưa xuất hiện hoặc lựa chọn không được xác nhận dùng lỗi `gemini_model_ui_not_ready`. Chỉ option hiện rõ nhưng bị vô hiệu hóa mới được phân loại không khả dụng trong luồng chọn model/mức tư duy hợp lệ.
- Motion khôi phục room theo giới hạn hiện có với cùng model và ảnh tham chiếu nếu lỗi giao diện xảy ra trước khi gửi. Lỗi này không khóa model. Hết số lượt khôi phục thì giữ cơ chế fallback hiện có; yêu cầu tiếp theo vẫn được thử lại model chính.
- Lưu pha lỗi, model, nguyên nhân và chẩn đoán trang trong `ai-debug`, kể cả lỗi không khả dụng thật. Giữ xử lý hủy tác vụ và kiểm tra kết quả đã gửi để tránh gửi trùng.

## Ba room

Ba worker có thể chờ phản hồi AI đồng thời. Chúng vẫn có bước dùng hàng đợi chung khi chuẩn bị room và nhập/gửi prompt; các yêu cầu dùng cùng worker cũng phải xếp hàng. Khóa nhập/gửi được thả trước khi chờ phản hồi AI. Việc khôi phục một room do lỗi chọn model không khóa model của hai room còn lại.

## Kiểm chứng

- `npm run test:gemini-thinking`: fixture Playwright tiếng Việt/Anh, model/mức tư duy, menu tải trễ, ô nhập chưa sẵn sàng, lỗi click/menu tạm thời, lựa chọn bị bỏ qua, option bị vô hiệu hóa, hủy tác vụ và lưu thiết lập.
- `npm run test:motion-ai-recovery`: thử lại cùng model/ảnh, không cooldown do lỗi giao diện, fallback sau giới hạn, ba worker Gemini chờ phản hồi đồng thời khi một worker cần sửa room, cùng worker xếp hàng và tránh gửi trùng.
- `tsc --noEmit`: kiểm tra kiểu toàn dự án.

Các kiểm thử dùng trang giả lập và dịch vụ thay thế cục bộ, không gửi yêu cầu tới AI thật và không render video. Giao diện Gemini thật vẫn cần được quan sát ở lượt chạy tiếp theo; chẩn đoán mới giúp xác định đúng pha nếu có thay đổi giao diện.
