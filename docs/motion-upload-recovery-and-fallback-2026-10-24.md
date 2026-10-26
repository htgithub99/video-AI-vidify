# Phục hồi upload tham chiếu và thứ tự AI

Gemini từng ghi nhận `attachment_completed` sau thời gian chờ cố định dù các tile `prop_00`–`prop_03` báo tải lỗi. Sau đó nút Gửi bị khóa và lỗi `chat_planning_attachments_not_ready` chuyển thẳng AI, bỏ qua hai lần phục hồi room. File tham chiếu trong hai gói đều là JPEG hợp lệ. Không có dữ liệu mạng của lần lỗi cũ để xác định nguyên nhân HTTP.

## Thay đổi

- Gemini xác nhận số lượng, tên ảnh, trạng thái xử lý, tile lỗi, mạng upload và nút Gửi. Chấp nhận cách Gemini hiển thị tên ảnh không có phần mở rộng. Xác nhận lại trước khi gửi; chỉ ghi upload hoàn tất khi đã đạt kiểm tra.
- Tải file trong composer hiện tại, dùng file chooser khi cần, không chọn input cuối cùng toàn trang cho Gemini. Xóa được nút `close prop_00` và kiểm tra ảnh lỗi đã được dọn. Yêu cầu không có ảnh cũng dọn ảnh cũ.
- Lỗi upload Gemini, ChatGPT, Claude, DeepSeek và lỗi không đính kèm được đều đi qua: thử ban đầu, reload room hai lần, tạo room mới, sau đó mới chuyển AI nếu vẫn lỗi. Giữ model và tham chiếu qua các lần phục hồi. Nhánh kiểm tra yêu cầu đã gửi và CAPTCHA được giữ nguyên.
- Khi đã hết các lần phục hồi upload, tạm bỏ qua provider/model đó trong phiên hiện tại 10 phút. Hết thời gian này, tác vụ dựng tiếp theo có thể thử AI ưu tiên lại. Phiên biên tập tiếp tục giữ AI đã thành công cho DNA, kịch bản và SEO.
- Lưu host/path, HTTP status hoặc lỗi kết nối của upload khi có; bỏ query string. HTTP 3xx không bị coi là lỗi upload, bao gồm trạng thái 308 của upload tiếp nối.
- Thứ tự mặc định MAIN: Gemini → DeepSeek Standard → ChatGPT Auto → Grok → Claude. DRAW: Gemini → DeepSeek Standard → ChatGPT Auto → Grok. AI người dùng chọn vẫn đứng đầu, không thêm trùng provider. Không thay đổi model đã chọn của AI đầu tiên.
- Danh sách khung hình hai cột từ breakpoint `sm`, một cột trên màn hình hẹp. Card, nội dung và điều khiển có giới hạn chiều rộng.
- Luồng upload âm thanh của Music Mixer tiếp tục dùng bộ kiểm tra chuyên biệt hiện có.

## Kiểm tra

- TypeScript; `test:motion-ai-recovery`, `test:motion-scene-ai`, `test:claude`, `test:chat-responses`.
- Fixture trình duyệt chạy hàm gửi thật: ảnh lỗi không bấm Gửi; ảnh thành công được gửi đúng một lần; xóa ảnh cũ và không sử dụng input file không liên quan.
- Fixture trạng thái upload: thiếu/sai/trùng tên, số lượng sai, nút gửi khóa, tile lỗi, mạng còn chạy, HTTP lỗi và HTTP 308.
- Fixture component `MotionPuppetPanel` cùng CSS Tailwind thực tế: hai cột ở 720 px, một cột ở 375 px, không tràn ngang. Ảnh kiểm tra ở `scratch/motion-puppet-grid-desktop-20261024.png` và `scratch/motion-puppet-grid-mobile-20261024.png`.

Chưa thực hiện lượt gọi Gemini trực tiếp hoặc xuất video toàn trình với bản sửa. Lệnh khởi động lại backend bị hệ thống phê duyệt tự động từ chối (`blocked by policy`); backend đang chạy cần được khởi động lại để nạp code server mới.
