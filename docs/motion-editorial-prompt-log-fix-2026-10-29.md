# Điều chỉnh prompt, QA và trạng thái log — 29/10/2026

## Phạm vi

Áp dụng chung cho Dùng kho và Remotion. Giữ cấu trúc ba prompt vẽ cảnh. Không tạo video, gọi AI thật hoặc tạo giọng trong lượt kiểm tra này.

## Prompt và QA

- Bỏ hàm gọi AI bổ sung hồ sơ phong cách riêng. Phân loại định dạng và đối tượng có thể trả ngay trong lần phân tích chính khi có bằng chứng. Giữ từng trường hợp lệ; phần mô tả phụ được bổ sung từ DNA đã có. Thông tin đối tượng/niên đại chưa rõ được giữ là chưa xác định, không tự coi là dữ kiện.
- DNA truyện mới chỉ yêu cầu cập nhật nội dung, bằng chứng, người/bối cảnh, mở đầu và các ràng buộc truyện mới. Kế thừa phong cách kể và kiểu hình; không kế thừa cốt truyện, danh tính và bằng chứng nguồn. Không gọi lại AI phân tích hồ sơ phong cách sau đó.
- Bổ sung quy tắc viết ngắn các trường mô tả DNA; giữ đủ sự kiện, dấu vết, quan hệ nhân quả và số chương.
- Chuẩn hóa metadata phụ trước QA: bỏ góc máy/nhãn phụ không hỗ trợ, giới hạn tốc độ và khoảng nghỉ. Sai ID nhân vật/địa điểm, sai người nói hoặc mất lời thoại vẫn phải sửa.
- Chương có ngữ cảnh gọn dùng sức chứa tối đa 720 từ/âm tiết thay vì luôn chia từ 360. Ngữ cảnh lớn vẫn chia nhỏ. Bản nháp mới lưu phương án chia; bản nháp cũ tiếp tục theo cách chia cũ để giữ phần đã đạt.
- Kho: AI kiểm nhu cầu minh họa không phải lặp lại danh sách ID/dấu vết chỉ để xác nhận. Code lưu danh sách và kiểm ID, bằng chứng, tài nguyên, quan hệ ghép. Lượt sửa nhu cầu/độ phủ giới hạn bốn phản hồi chưa đạt thay vì mười; giữ các hàng hợp lệ.
- Giữ kiểm tra chương thiếu/trùng, lời kể, người nói, lệch chủ đề, sao chép dài và khả năng ghép kho. Các bước biên tập nhiều chương và đọc nguồn dài vẫn phục vụ chức năng nội dung.

## Trạng thái log

- Backend công bố `stepStates` cho các bước, gồm ID tác vụ, trạng thái, thời điểm, tiến độ và lỗi. SEO nền cập nhật trong khi chạy, không chỉ lúc kết thúc.
- Kiểm phương án kho có trạng thái riêng thuộc nhóm Phân tích DNA.
- UI ưu tiên trạng thái tác vụ từng bước; log cũ hoặc câu “Hoàn tất” của lượt trước không ghi đè trạng thái chạy lại.
- Thăm dò SEO cập nhật ngay trạng thái và giữ qua reload. Gộp trạng thái có xét thời điểm để phản hồi cũ không ghi đè phản hồi mới.
- Giữ đường đọc log cũ. Nếu backend cũ còn công bố `seoJobId`, UI nhận biết SEO còn chạy khi tiến trình tổng chưa kết thúc.
- Áp dụng cho sáu nhóm: DNA, kịch bản, SEO, dựng cảnh, giọng và xuất video; gồm chạy riêng, song song, phục hồi, hoàn tất, lỗi và dừng.

## Kiểm chứng

- `verify-motion-editorial-policy.ts`: mock AI cho cả hai chế độ; kiểm số lượt, metadata phụ, QA thiết yếu, kế thừa phong cách và sáu nhóm trạng thái qua reload.
- `verify-motion-production-runner.ts`: công bố trạng thái SEO nền trong khi dựng cảnh; các kiểm tra phục hồi, hủy, lưu tiến độ và xuất video đều dùng mock.
- Các kiểm tra sẵn có: DNA repair, prompt resume, story craft, folk story và log sections.

Các kiểm tra trên xác nhận luồng code, không khẳng định chất lượng phản hồi của dịch vụ AI thật hoặc chất lượng video chưa chạy.
