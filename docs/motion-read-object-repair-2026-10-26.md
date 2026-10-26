# Sửa đồng bộ đồ vật và áp dụng bản sửa cảnh

## Nguyên nhân đã xác minh

Lượt `2206ca7c6fd2fa0ef22c36e7987bcdfc` dừng lúc 16:49 ngày 26/10 ở nhịp hình thứ 27/31, câu “Sao nhà cửa tối om, mâm cúng đổ tháo tùm lum vậy em?”. Bản debug `motion-puppet-read-contract-9f9b30c6-2169-4742-9740-60346779babb` cho thấy AI đã trả `objects[0].catalogKey = offering_tray` nhưng `object.catalogKey` trong bản nháp còn là `offering_plate`.

`readOf` đưa `object` vào trước danh sách `objects`, rồi loại trùng theo identity. Bản cũ được giữ, bản sửa bị bỏ. Kiểm tra ngữ nghĩa báo lỗi `objects.0.catalogKey`, nhưng áp dụng bản sửa lại ghi vào mảng raw; dữ liệu thật được kiểm là bản `object` cũ. Ba AI đã lặp sửa; Grok sau đó gặp `chat_planning_context_not_confirmed`. Lỗi xác nhận ngữ cảnh là lỗi sau, không phải nguyên nhân khiến các bản sửa đúng bị bỏ.

Ngoài trường hợp trùng này, đường dẫn lỗi dùng chỉ số trong danh sách đã lọc/loại trùng. Nếu phần tử đứng trước bị loại hoặc là bản trùng, đường sửa có thể ghi nhầm phần tử raw.

## Thay đổi

- `src/lib/motionReadObjects.ts` chuẩn hóa đồ vật: danh sách là nguồn giá trị; `object` tham chiếu phần tử chính cùng identity/key. Dữ liệu cũ chỉ có `object` được đưa vào danh sách khi đọc, không sửa file dự án hàng loạt. Hai món có identity riêng vẫn tách biệt dù cùng catalog/key.
- Chuẩn hóa trước kiểm tra, trước ghép bản sửa và trước lưu checkpoint. Bản sửa chỉ được ghi vào các đường đã cho phép; các giá trị khác vẫn khóa. Phản hồi cũ sửa qua trường `object` được ánh xạ sang phần tử chính, giữ tương thích.
- Giữ ánh xạ từ đồ vật đã chuẩn hóa/lọc về vị trí raw ban đầu. Lỗi tên, chỗ tựa, quyền cầm và vị trí trỏ đúng phần tử cần sửa. Chỉ số raw của lỗi placement không bị ánh xạ lần thứ hai.
- Dùng cùng hàm đọc danh sách ở READ, chuẩn hóa trạng thái, giữ liên tục, tính chỗ đặt, kiểm quan hệ đồ vật và kiểm bố cục. Các bước sau không ưu tiên lại bản `object` cũ trong snapshot.
- Prompt giữ chỉ số mảng gốc khi trả bản sửa; phần tử không sửa dùng null placeholder. Không thêm nhiệm vụ AI hoặc thay ngân sách retry.
- Không hạ QA tên đồ vật, vị trí thiết yếu, chủ vật hoặc quan hệ chỗ tựa. Không tự chọn tài nguyên khác, tạo tài nguyên mới, reset retry hoặc viết lại cảnh đã đạt.

## Kiểm tra

- `npm run test:motion-read-objects`: fixture trích từ phản hồi thật; nhận bản sửa đã đúng mà không gọi AI; sửa một trường với phản hồi giả lập; giữ cảnh bên cạnh, các giá trị khóa và retry/routes; dữ liệu cũ chỉ có object; hai món cùng loại; chỉ số sau lọc/loại trùng; các bước chuẩn hóa và tính chỗ đặt.
- `npx tsx scripts/verify-motion-read-contract.ts`: phục hồi từng phần, hủy, ngữ cảnh, posture, placement và cảnh đã đạt.
- `npx tsx scripts/verify-motion-field-repair.ts`: đường sửa, giá trị khóa, null, ID và kế hoạch minh họa đã đủ.
- `npx tsx scripts/verify-motion-visual-contract.ts`, `verify-motion-simple-illustration.ts`, `verify-motion-posture-continuity.ts`, `verify-motion-spatial-placement.ts`: các hợp đồng hình và vị trí liên quan.
- `npx tsc --noEmit`: kiểm kiểu.
- Tái hiện offline 31 nhịp hình từ snapshot thật, dùng 30 READ đã đạt và bản sửa đúng từng được AI trả cho cảnh 27: 31/31 được nhận, 0 request AI. Đây là kiểm tra dữ liệu trong bộ nhớ, không phải chạy lại video hoặc xác nhận đã render thành công. Bản nháp cuối của lượt thật vẫn có thể cần sửa lại một trường khi người dùng tiếp tục vì các lượt sau lỗi đã ghi lại giá trị sai.

Không tự tiếp tục hoặc tạo video. Bản lưu dự án và log gốc được giữ; lượt đang lỗi vẫn dừng cho đến khi người dùng chủ động tiếp tục.

## Nạp bản sửa

Backend đã nạp lại lúc 17:44 ngày 26/10, PID `65148`, cổng `3002`. Trước khi nạp đã xác nhận các production và các story job gần nhất đều kết thúc. Đối chiếu SHA256 sau khi nạp và đọc API trạng thái: 123 file tiến độ, bản nháp, job và log được giữ nguyên, 0 file thay đổi. API vẫn trả trạng thái lỗi đã lưu cho lượt cũ; không tự chạy lại. Log backend tại `scratch/motion-read-object-backend-20261026-174458.stdout.log` và `.stderr.log`.
