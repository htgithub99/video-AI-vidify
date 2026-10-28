# QA Video Motion: ưu tiên hoàn thành video hợp lệ

## Nguyên nhân đã xác định

- Luồng tạo video có thêm điều kiện lệch tối đa 15% cho video ngắn, nghiêm hơn chính sách thời lượng chung. Điều kiện này khiến giọng 76 giây của yêu cầu 60 giây bị viết lại dù vẫn có thể xuất video tự nhiên.
- Nhánh sửa lời kể cũng dùng số âm tiết dự kiến như điều kiện bắt buộc, làm AI sửa nhiều lần vì đếm tiếng không chính xác. Thời lượng văn bản chỉ là ước tính; âm thanh thực mới là timeline cuối.
- Duyệt ảnh kho coi nhận xét thiếu category là lỗi chặn; Remotion trước đây dùng một cờ ok và danh sách issues, chưa lọc riêng góp ý phụ bằng code.

## Chính sách sau sửa

| Mục | Xử lý |
| --- | --- |
| Chênh số từ/âm tiết, độ dài câu | Cảnh báo; không bắt viết lại vì số đếm |
| Thời lượng giọng lệch vừa phải | Tiếp tục, timeline theo giọng thực; lệch trên 25% ghi cảnh báo |
| Âm thanh dưới một nửa hoặc trên 1,75 lần thời lượng chọn | Cho một lượt điều chỉnh có giới hạn; không ép chính xác từng giây |
| Không có âm thanh hợp lệ, thời lượng không hữu hạn hoặc không dương | Chặn vì không thể xuất video đúng |
| Tư thế phụ, động tác mở cửa/nhìn/nói, thiếu trang trí, khác góc máy nhẹ | Góp ý; giữ hình minh họa hợp lệ |
| Nhận xét ảnh chưa phân loại hoặc chưa có bằng chứng | Cảnh báo; không tự coi là lỗi nghiêm trọng |
| Sai nhân vật, bối cảnh chính, đồ vật/manh mối thiết yếu, quan hệ không gian làm sai nội dung | Giữ kiểm tra; Remotion chỉ sửa khi có category nghiêm trọng và bằng chứng cụ thể |
| SVG không đọc được, nhóm chủ thể cần thiết bị thiếu, dữ liệu chuyển động hỏng | Giữ kiểm tra kỹ thuật để tránh mất hình hoặc render lỗi |
| Thiếu chuyển động nhân vật nhưng hình tĩnh vẫn hợp lệ | Cảnh báo đang dùng minh họa tĩnh |
| Sai người nói, mất câu thoại, thiếu chương, âm thanh cũ không khớp lời hiện tại | Giữ kiểm tra nội dung và đồng bộ |
| SEO hoặc bước duyệt bổ sung không khả dụng | Không dùng làm lý do dừng phần video hợp lệ |

Không đổi tốc độ giọng hoặc cắt mất câu để ép khớp số phút. Khi thật sự cần hiệu chỉnh thời lượng, đo giọng trước rồi mới dựng lại hình; giữ clip và hình còn phù hợp. Giới hạn thử lại của mỗi lượt hiệu chỉnh được tách riêng, nhưng tiếp tục cùng lượt không tự cấp lại vô hạn.

## Kiểm chứng

- `verify-motion-qa-policy.ts`: số chữ khác dự kiến không chặn, kể cả nhánh hiệu chỉnh; 62/60 giây hợp lệ, 76/60 giây chỉ cảnh báo; giữ lỗi thiết yếu.
- `verify-motion-production-runner.ts`: hiệu chỉnh có giới hạn, dùng giọng thực, trường hợp 76/60 giây tiếp tục và không sinh thêm vòng sửa vì lệch vừa phải.
- `verify-motion-prompt-resume.ts`: giữ ID và phần đã đạt; ngân sách sửa được giữ khi resume và tách theo lượt hiệu chỉnh.
- `verify-motion-illustration-profiles.ts`: lỗi ảnh có bằng chứng vẫn được sửa; góp ý trang trí không tạo thêm vòng sửa cho cả ba kiểu hình.

Lượt thử đang lưu: `37810897-856c-4a26-a51f-96f06ae0c285`, DeepSeek Standard nội dung, Gemini 3.5 Flash-Lite dựng cảnh. Giọng hiện đo 62,15 giây; chưa coi là video đã hoàn tất khi còn đang dựng hình.
