# Phiên biên tập chung, lịch sử log và trạng thái AI

Ba bước Phân tích Video DNA, Kịch bản & Phân cảnh và SEO YouTube dùng `editorialSessionId` được lưu cùng bản nháp. Job của mỗi bước vẫn riêng để theo dõi tiến độ, nhưng không còn quyết định danh tính phòng chat.

Backend gắn phiên với dấu vân tay nguồn, ghi chú, ngôn ngữ và cấu hình AI. Các yêu cầu trong phiên dùng một worker và được xếp hàng, kể cả yêu cầu đọc nguồn, viết chương, sửa truyện và biên tập. Các phòng dựng cảnh vẫn chạy độc lập như trước. AI dự phòng đã trả kết quả hợp lệ được tiếp tục sử dụng qua các bước trong phiên.

Lỗi giao diện hoặc kết nối: lần đầu, tải lại đúng room hai lần, sau đó đóng room lỗi và tạo room mới. Khi đã gửi mà chưa biết kết quả, đọc lại phản hồi cũ trước; hai lần tải lại chỉ để đọc, không gửi trùng trong room cũ. Nếu phải thay room, gửi lại nhiệm vụ đang lỗi cùng nguồn và dữ liệu sản xuất đã được chấp nhận. Phản hồi đúng JSON nhưng thiếu dữ liệu được yêu cầu sửa tiếp trong cuộc trò chuyện; hợp đồng truyện cho phép hai lần sửa rồi thử ở room mới trước khi đổi AI.

Room được giữ giữa các bước, giải phóng khi Dừng, bắt đầu lượt video mới, đổi nguồn/cấu hình, trước khi xuất video hoặc sau 60 phút không có hoạt động. Việc xuất video chờ các tác vụ AI đang chạy kết thúc rồi mới giải phóng room và Chrome. Khởi động lại backend tạo room mới khi có yêu cầu tiếp theo; nguồn và dữ liệu đã có được truyền từ bản nháp để tiếp tục.

Log được ghi ngay vào localStorage và sao lưu cùng bản nháp trong IndexedDB. Tải lại trang, dừng, lỗi, chuyển bước và hoàn tất render đều giữ lịch sử. Bắt đầu phân tích một lượt video mới mới xóa lịch sử. Những đoạn log server trả theo cửa sổ được ghép vào lịch sử đã có; ảnh chụp log ngắn hơn không ghi đè phần trước. Dữ liệu log đã mất trước bản cập nhật không thể tự khôi phục nếu server cũng không còn giữ.

Trạng thái AI dùng component chung một dòng, gom cùng provider/model và đếm từng trạng thái. Ví dụ: `gemini-chat · gemini-flash::low · Ưu tiên ×2 | Phục hồi`. Khi thiếu chỗ, dòng được rút gọn; tooltip vẫn chứa thông tin từng worker.

## Kiểm chứng

- `npm run test:motion-ai-recovery`: danh tính room xuyên bước, hàng đợi nội bộ, sticky fallback, đọc lại yêu cầu chưa xác nhận, hai lần reload rồi thay room, khôi phục context, sửa hợp đồng, đổi nguồn và bàn giao render; kiểm tra trình duyệt thật của tầng chat với trang giả lập cục bộ.
- `npm run test:motion-editorial-ui`: hook và component thật, localStorage/IndexedDB thật, tải lại trang, giữ hơn 30 job, xóa lịch sử khi tạo video mới, trạng thái một dòng ở cả hai kích thước màn hình.
- `npm run test:motion-cancellation`: giữ log của cảnh/render qua khôi phục bản nháp, bấm Dừng, tải lại tác vụ đã dừng và các tranh chấp hoàn tất/hủy.
- `npx tsx scripts/verify-motion-draft-preservation.ts`: giữ dữ liệu đã tạo khi đổi thiết lập, phân tích lỗi hoặc bị hủy.
- `npm run test:motion-story-craft`, TypeScript, Prettier và `git diff --check`.

Các kiểm thử phiên mới dùng AI transport giả lập; không chạy thêm một video đầy đủ hoặc gửi truyện hiện tại lên AI trong lần sửa này.
