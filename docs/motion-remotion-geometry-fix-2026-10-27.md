# Sửa bố trí Remotion ngày 27/10/2026

## Nguyên nhân

- Bộ bố trí dùng bounds của phần hình nhìn thấy để tính kích thước nhưng lại kiểm tra cả khung SVG, gồm vùng trong suốt. Bộ kiểm tra trước xuất cũng kiểm tra cả khung SVG, nên hai nơi cùng từ chối hình hợp lệ.
- Kiến trúc và nền sàn bị áp giới hạn đáy 90% dành cho chủ thể. Thu nhỏ không giải quyết được vì kiến trúc giữ kích thước theo vùng lắp.
- Bàn, ghế đặt bằng `mount: floor` bị căn xuống tận đáy vùng sàn; một số nền còn cho đường đứng vượt quá vùng an toàn. Hình thu nhỏ vẫn bị báo tràn.
- Suy luận vai trò ưu tiên `mount` hơn loại vật, khiến kệ/bàn không ghi role bị coi là kiến trúc và phóng lớn theo cả vùng sàn.

## Đã sửa

- Dùng chung `remotionVisibleRect` và `remotionNodeFitsFrame` cho bố trí và kiểm tra spec. Phần trong suốt được phép nằm ngoài khung; phần hình nhìn thấy vẫn phải nằm trong vùng hợp lệ.
- Kiến trúc dùng toàn khung; chủ thể dùng vùng đáy 90%. Đường đứng tối đa 88% để chừa phần hình thấp hơn điểm tiếp xúc.
- Đồ vật đặt trên sàn dùng điểm base theo đường đứng và giữ slot trái/giữa/phải. Đồ vật đặt trên vật khác vẫn giữ nguyên quan hệ anchor.
- Suy luận đồ vật từ tên chủ thể trước khi suy luận kiến trúc từ mount; role ghi rõ vẫn được ưu tiên.
- Quan hệ đứng sau và kiểm tra đổi bên dùng điểm base/vùng nhìn thấy, tránh bị ảnh hưởng bởi padding.
- Bounds không chuẩn hóa, target thiếu, quan hệ vòng, điểm tiếp xúc thiếu và SVG không hợp lệ vẫn bị chặn.
- Giữ revision tài nguyên và khóa ảnh để dùng lại ảnh đã có, không yêu cầu vẽ lại chỉ vì sửa hình học.

## Kiểm chứng

`node --import tsx scripts/verify-motion-remotion-geometry.ts storage/output/motion-video/story-jobs/dc89a35e-561d-40d1-883f-428a95b55ed8.json`

- Dữ liệu đã lưu: 21 phân cảnh thuộc 18 đoạn, 71 tài nguyên. Có 18 phân cảnh đủ ảnh, 3 phân cảnh phụ chưa đủ ảnh.
- 18/18 phân cảnh đủ ảnh qua bố trí, kiểm tra spec và đối chiếu điểm tiếp xúc ở cả 4 tỷ lệ khung hình.
- Kiểm tra riêng padding ngoài khung, kiến trúc toàn khung, bàn gắn sàn, vật trên bàn, người ngồi và vật cầm tay. Hình thật bị tràn và metadata sai vẫn bị từ chối.
- Đọc dữ liệu đã lưu, không sửa checkpoint, không gọi AI/TTS, không tạo video.
- `verify-motion-remotion.ts` với AI giả lập và `tsc --noEmit` đều đạt.

Các kết quả trên xác nhận sửa lỗi hình học đã phát hiện; 3 phân cảnh thiếu ảnh vẫn cần lượt dựng tiếp thông thường sau khi nạp code backend mới.
