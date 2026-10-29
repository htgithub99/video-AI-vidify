# Sửa SEO bị dừng khi dựng cảnh

## Nguyên nhân đã xác nhận

- Lượt `ee943120ab98349020287160378e5741` viết xong kịch bản lúc 23:06:20, SEO bị hủy lúc 23:06:21, trước khi gửi request AI. Hình và giọng vẫn tiếp tục.
- Khóa revision của phòng nội dung hash cả cấu hình thực thi. Dựng cảnh và giọng thêm `role: main`, còn SEO không có trường này. Cùng nguồn và cùng AI vì thế thành hai revision khác nhau.
- Khi nhận revision mới, dịch vụ job hủy tác vụ revision cũ trong cùng phiên. Đây là nguyên nhân SEO bị hủy, không phải AI từ chối viết SEO.
- Bộ chạy đánh dấu SEO `done: true` với mọi trạng thái kết thúc, kể cả hủy hoặc lỗi. Cùng khóa kịch bản sau đó luôn bị bỏ qua.

## Thay đổi

1. Khóa phòng dùng nguồn, ghi chú nguồn, ngôn ngữ và provider/model/mode. Những cờ thực thi như role, singleResponse, chained, chromeHeadless và strictProvider không đổi revision.
2. Thay nguồn, ngôn ngữ hoặc model vẫn thay revision và dừng tác vụ cũ. Log ghi rõ lý do thay ngữ cảnh.
3. SEO chỉ hoàn tất khi có kết quả chứa phương án và đúng khóa kịch bản. SEO bị hủy, lỗi hoặc mất job được phục hồi riêng, tối đa hai lần cho mỗi kịch bản trong một lượt chạy.
4. Khi hết lượt phục hồi hoặc hết thời gian chờ, giữ bản nháp và xuất video chính. Log nêu rõ SEO chưa hoàn tất. Không để UI tiếp tục theo dõi một job SEO đã dừng.
5. Khi người dùng tiếp tục một lượt đã hoàn thành video nhưng thiếu SEO, chỉ phục hồi SEO; không viết lại truyện, dựng lại hình, tạo lại giọng hay render lại. Giao diện có nút **Tiếp tục SEO** cho trường hợp này. Bản lưu cũ đánh dấu nhầm `done` cũng phục hồi được.
6. SEO hoàn tất được dùng lại. Mốc chương luôn được cập nhật theo giọng thật, kể cả khi SEO xong trước giọng.
7. Dừng toàn bộ lượt sẽ dừng cả SEO và không tự khởi chạy lại. Chỉ thao tác tiếp tục rõ ràng của người dùng mới mở lại lượt đã dừng.

## Kiểm chứng

- `scripts/verify-motion-editorial-session.ts`: chạy job không có request AI; kiểm cùng khóa qua các cờ thực thi, SEO không bị hủy bởi cảnh/giọng, thay model thật vẫn hủy tác vụ cũ và ghi lý do.
- `scripts/verify-motion-production-runner.ts`: giả lập hủy SEO, lỗi dịch vụ, hết lượt, timeout, dừng người dùng, bản lưu cũ, tiếp tục riêng SEO, giữ nguyên MP4 và cập nhật mốc chương.
- Không chạy sản xuất video hoặc gọi AI thật để kiểm chứng thay đổi này.
