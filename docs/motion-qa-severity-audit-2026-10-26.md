# Phân mức QA Video Motion — 26/10/2026

## Nguyên nhân lỗi 134 đơn vị / 68 giây

Lượt thật của **Người Đứng Ngoài Sân** dừng tại kiểm độ dài ước tính của phần kịch bản. Phần 68 giây có 134 từ/âm tiết, thấp hơn ngưỡng suy từ tốc độ đọc cấu hình (khoảng 217 đơn vị). QA đưa `narration` và `utterances` vào danh sách phải sửa dù dữ liệu đã đủ, rồi dùng hết bộ đếm sửa. Đây chưa phải kết quả đo thời lượng tiếng nói thật.

Prompt cũ đồng thời yêu cầu gần số chữ mục tiêu và đặt `HARD LIMIT`. Hướng dẫn này dễ khiến AI ưu tiên bộ đếm, gây viết thêm hoặc cắt câu không cần thiết. Khi hạ QA, nếu chỉ bỏ điều kiện với phản hồi mới thì bản nháp đã lưu vẫn có pending và bộ đếm cũ, tiếp tục bị chặn.

## Chính sách hiện hành

| Phần | Cách xử lý |
| --- | --- |
| Số chữ/âm tiết ước tính từng chương | Chỉ là hướng dẫn trong prompt; lệch quá ±35% ghi cảnh báo, không buộc viết lại. Không thêm lời lan man để đủ chữ. |
| Thời lượng tiếng thật so với mục tiêu | Trong ±25% tiếp tục bình thường. Ngoài khoảng này nhưng còn 50–175% mục tiêu: cảnh báo, dùng timeline theo clip thật. Không kéo tốc độ giọng để ép khớp. |
| Thời lượng tiếng thật lệch nghiêm trọng | Dưới 50% hoặc trên 175%: tối đa một lượt chỉnh các chương lệch, giữ phần đã đạt. Sau chỉnh vẫn lệch nghiêm trọng thì giữ tiến độ và báo lỗi. |
| Tư thế/cử chỉ phụ, góc máy, thẩm mỹ | Góp ý từ AI duyệt ảnh không làm dựng lại hình hợp lệ. Đứng thay ngồi hoặc đứng cạnh cửa thay động tác mở cửa được chấp nhận nếu không phá quan hệ/sự kiện quan trọng. |
| AI duyệt ảnh thiếu kết quả hoặc dịch vụ lỗi | Thử bổ sung có giới hạn rồi cảnh báo chưa xác nhận; kiểm dữ liệu/vị trí/dựng hình tại máy vẫn chạy. Không ghi nhận sai là toàn bộ ảnh đã đạt. |
| Sai người/nơi/vị trí/đồ vật, chỗ tựa, trạng thái hay manh mối quan trọng | Vẫn sửa và chặn nếu chưa giải quyết. Phản hồi âm tính kiểu cũ chưa có phân loại vẫn xử lý thận trọng. |

Các ngưỡng dùng chung ở `src/constants/motionQa.ts`. Chỉ kiểm độ dài chữ khi đang chỉnh một sai lệch **tiếng thật nghiêm trọng**, với khoảng dung sai rộng ±30%; không áp dụng cho lượt viết đầu.

### Những phần đã nhẹ từ trước, được giữ

- Góp ý scene plan trong bước viết: cảnh báo.
- Biên tập phụ lỗi: giữ kịch bản gốc đã đạt.
- ASR không khả dụng hoặc chưa đạt sau các lần thử có giới hạn: giữ clip tốt nhất với trạng thái cần xem lại; PCM hỏng hoặc không có tiếng dùng được vẫn chặn.
- SEO, thumbnail và hiệu ứng âm thanh phụ không phải điều kiện bắt buộc để có video chính.

### Bảo vệ vẫn bắt buộc

- Có đủ chương, lời kể không rỗng, ID/cast/place/speaker hợp lệ, thoại giữ đúng chữ và người nói.
- Giữ chủ đề truyện đã khóa, sự kiện chính, tính nguyên bản; không bỏ manh mối hoặc đổi thành chủ đề khác để vượt kiểm tra.
- Tài nguyên thuộc kho/gói đã chọn; vị trí, vật đỡ, quyền sở hữu và kết quả quan trọng đúng dữ liệu.
- Có tiếng dùng được cho kịch bản hiện tại; audio/video không hỏng, đủ track và phạm vi lời, không công bố file thiếu tiếng hoặc bị cụt.
- Dừng theo yêu cầu, lưu tiến độ, chữ ký phụ thuộc và tính toàn vẹn bản lưu.

Đây là minh họa tĩnh theo truyện; không cần thể hiện mọi động từ. Việc giảm QA không cho phép bỏ người, đổi nơi hoặc giấu lỗi xuất file.

## Phục hồi bản nháp

Chấp nhận khóa input từ prompt cũ chỉ khi khớp chính xác biến thể quy tắc độ dài đã thay. Đọc lại các hàng đã lưu bằng QA hiện hành trước khi xét bộ đếm lỗi. Không xóa bộ đếm, bỏ kiểm nội dung hay nhận bản nháp của input khác.

Kiểm tra chỉ đọc trên bản lưu thật `2206ca7c6fd2fa0ef22c36e7987bcdfc`: phục hồi chương `c1` gồm 7 đoạn / 309 đơn vị (hai phần 175 và 134), pending bằng 0, gọi AI bằng 0, file bản lưu không đổi. Chưa tiếp tục dự án; người dùng tự chạy lại.

## Kiểm chứng

- `npx tsc --noEmit`.
- `npm run test:motion-qa-policy`: 134 đơn vị được nhận, bản nháp cũ hết budget được đánh giá lại, ngưỡng duration, review phụ/thiếu/dịch vụ lỗi và Dừng.
- `verify-motion-production-runner`: tiếng ngắn hơn 35% không sửa lại script/hình/giọng; lệch nghiêm trọng vẫn có sửa giới hạn; phục hồi lần sửa voice đang lỗi không bị bỏ qua.
- `verify-motion-response-contracts`, `verify-motion-prompt-resume`, `verify-motion-field-repair`, `verify-motion-visual-contract`: qua.

Tất cả dùng dữ liệu lưu hoặc dịch vụ giả. Không gọi AI/TTS thật, không tạo/render/xuất hay tiếp tục video người dùng.

Đã nạp backend lúc 15:59, PID 62320, cổng 3002. Bảy production đều đã kết thúc trước khi nạp; 92 file production/task draft/story job giữ nguyên SHA-256 sau khi nạp. Không tự tiếp tục dự án.
