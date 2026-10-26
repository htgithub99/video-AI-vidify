# Lỗi ghép Nhà tôi / altar table — 26/10/2026

## Bằng chứng từ lượt thật

- Production `2206ca7c6fd2fa0ef22c36e7987bcdfc`, gói `minimal_mask`, dừng ở kiểm kho sau khi phân tích đã hoàn tất.
- Địa điểm `nha_toi` có `interior: false`. Mô tả là nhà có sân trước, bàn cúng ngoài sân và phòng ngủ phía sau.
- Bộ nhận diện cũ duyệt danh sách mẫu theo thứ tự, lấy `bedroom` từ mô tả. Kết quả là tất cả khuôn sân ngoài trời bị loại.
- Ba đạo cụ trong cùng minh họa cần ba điểm `surface` trên `altar table`. Kho có `offering_table` dùng được ngoài trời và ba điểm đặt riêng, nhưng các điểm chỉ mang tên `table_top_*`; bộ so khớp đòi cả từ `altar` và `table`, nên không nhận ra bàn cúng này.
- Sau khi giải hai lỗi trên, cổng kiểm thành phần vẫn bỏ qua các điểm đặt được khai báo trên mảnh, chỉ đọc tên/mô tả. Vì vậy cửa có sẵn vẫn có thể bị loại. Đây là bất nhất giữa bộ tìm và bộ kiểm, không phải Gemini không trả lời hoặc kho không có nhà.

## Đối ứng dùng chung

1. Xác định họ địa điểm từ định danh chính; tên nhà chung được xét với mô tả, thứ tự xuất hiện và cờ trong/ngoài. Phòng ngủ được nhắc phía sau không đổi cảnh sân thành phòng ngủ. Ghi họ đã xác định vào cảnh ghép.
2. Chuẩn hóa các cách gọi bàn cúng `altar table`, `offering table`, `ritual table`; vẫn không cho bàn thường hoặc kệ thờ treo tường thay bàn cúng.
3. Khai báo fixture bàn cúng cho các điểm có sẵn, dùng cùng phép xử lý khi tìm mảnh, ghép, đọc lại plan, chẩn đoán và cung cấp catalog. TypeScript và Python dùng chung schema; không thêm điểm giả hoặc sửa tọa độ.
4. Đồng bộ cách gọi bậc cửa/ngưỡng cửa và số nhiều `doors`; tính cả khóa điểm đặt/fixture vào bằng chứng thành phần, và họ khuôn vào bằng chứng môi trường.
5. Loại mảnh nhà đổ nát khi mô tả không yêu cầu hư hại; không chọn tòa nhà cửa hàng/đền cho nhà dân chỉ vì có một điểm cửa.
6. Tiếp tục kiểm ba điểm đặt độc lập, giới hạn môi trường, hình học và tài nguyên đúng gói. Tài nguyên thật sự không có vẫn phải báo lỗi, không tự vẽ hoặc thay sai.

## Kiểm chứng

- `npm run test:motion-house-readiness`: fixture rút từ bản phân tích thật, cả hai gói, ba địa điểm/bốn minh họa, ba điểm bề mặt riêng, bậc cửa, snapshot đọc lại, kho không đổi, support lạ bị chặn; TypeScript/Python cho kết quả fixture tương đương.
- `npx tsc --noEmit`.
- `npx tsx scripts/verify-motion-plan-readiness.ts`.
- `npx tsx scripts/verify-motion-resource-writes.ts`.
- `npx tsx scripts/verify-motion-assembly-capacity.ts`.
- `npm run test:motion-illustration-nulls`.

Các kiểm tra đều chạy cục bộ, không gọi AI/TTS và không tạo video. Kiểm kho đạt không phải chứng nhận toàn bộ video của dự án đã chạy hoàn chỉnh; người dùng sẽ chạy lại lượt thật.

## Nạp bản sửa

Backend đã được khởi động lại lúc 15:32, PID mới `84616`, HTTP 200 tại cổng 3002. Trước khi khởi động lại: cả năm production đều đã kết thúc (`error` hoặc `cancelled`), không có publication chờ. So sánh hash sau khởi động: năm bản production, bản nháp phân tích thật và snapshot standalone cũ đều giữ nguyên (7/7). Không tự tiếp tục dự án.
