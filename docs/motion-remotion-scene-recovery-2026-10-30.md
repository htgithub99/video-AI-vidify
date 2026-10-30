# Phục hồi phân cảnh Remotion — 30/10/2026

## Phạm vi

Sửa chung cho horror, history và explainer. Giữ cấu trúc prompt vẽ trọn cảnh và các hồ sơ kiểu hình. Không gọi AI thật, tạo giọng hoặc xuất video để kiểm thử thay đổi này. Chế độ kho không đổi cách chọn và ghép tài nguyên.

## Bằng chứng gốc

Dự án `ae24227c0647387648a1cde16615e3d2`, lượt cảnh `1b9b2356-bde6-47d6-ba73-b1bf94a70498`, ngày 30/10: 17 nhịp kể, 7 nhóm phân cảnh, 9 cảnh đã lập kế hoạch, 0 SVG; 12 lần kết quả bị từ chối trước khi hủy lúc 11:58:51.

- Bản sửa đổi ID bị cộng với chi tiết sai cũ; có cảnh tích lũy 18/26/19 node trong khi giới hạn là 16.
- Đám đông quân lính bị yêu cầu dùng ID của danh sách nhân vật có danh tính.
- Quan hệ người cạnh thuyền và thuyền cạnh người bị xem là vòng phụ thuộc gắn vật thể.
- Cảnh bị loại vì node làm kiểm tra độ phủ báo thêm lỗi khoảng lời kể dù khoảng nguồn vẫn đúng.
- Thông báo ChatGPT “Thử lại trong 17 phút” không khớp bộ nhận diện, dẫn tới phục hồi phòng không cần thiết.
- Mọi nhóm phải lập xong kế hoạch mới bắt đầu vẽ; prompt phục hồi còn mang ngữ cảnh và bản nháp tích lũy.

## Thay đổi

1. Mảng node đầy đủ là danh sách thay thế; bản vá chỉ chứa trường của node vẫn cập nhật theo ID để giữ tương thích. Hàng cảnh không gửi lại được giữ. Khoảng nguồn gộp lại thay được các hàng cũ nằm trọn trong khoảng đó.
2. `anonymous=true` biểu diễn người phụ/đám đông không có danh tính, không giả dùng ID nhân vật chính. Hỗ trợ qua kế hoạch, lớp SVG, kiểm tra và chuyển động. Một số tên nhóm thông dụng từ phản hồi cũ được chuẩn hóa; ID nhân vật có danh tính không hợp lệ vẫn cần sửa.
3. Kiểm vòng phụ thuộc áp dụng cho `on`, `inside`, `heldBy`; mô tả tương đối `beside`, `behind` không làm vòng phụ thuộc gắn vật thể. Kiểm tra đích tồn tại, ID trùng, khoảng nguồn thiếu hoặc chồng vẫn giữ.
4. Kiểm độ phủ dùng khoảng nguồn của các hàng, độc lập với lỗi node, tránh báo lỗi nguồn kéo theo.
5. Phục hồi phiên bản 2 xóa bản nháp phân cảnh chưa đạt và ngân sách yêu cầu kế hoạch cũ khi tiếp tục. Cảnh đã đạt, SVG, giọng và nội dung không bị xóa; không ép dựng lại toàn bộ cảnh đã hoàn thành.
6. Prompt kế hoạch tự chứa ngữ cảnh cần dùng, không chèn lại toàn bộ phiên biên tập. Loại mô tả phong cách lặp và QA nhịp kể khỏi ngữ cảnh lập cảnh; giữ lời kể chính xác, quan hệ, đạo cụ, nhận dạng và dữ kiện liên tục. Yêu cầu sửa chỉ mang hàng và phần lời kể liên quan, cùng hướng dẫn cần thiết.
7. Mỗi nhóm đã lập được cảnh tiến sang dựng ngay, không chờ toàn bộ nhóm khác. Dùng chung cảnh tham chiếu theo địa điểm và giới hạn ba lượt dựng đồng thời; tài nguyên phụ thuộc được giải phóng sau khi các lượt đang chạy kết thúc. Log ghi rõ khi còn nhóm phân cảnh chưa xong.
8. Nhận diện giới hạn ChatGPT ở cả thông báo trạng thái và thông báo gần ô nhập. Phân loại là giới hạn dịch vụ thay vì lỗi nút gửi.
9. Tên file chẩn đoán được chuẩn hóa để dấu `:` trong khóa kế hoạch không tạo NTFS alternate data stream trên Windows.

## Chính sách duyệt ảnh

- Tắt duyệt: mỗi cảnh nhận một phản hồi vẽ; SVG render được được giữ, không tự gọi sửa nội dung/ảnh.
- Bật duyệt: giữ lượt duyệt và khả năng sửa lỗi hình quan trọng theo cấu hình hiện có.
- SVG không thể render, nội dung không hợp lệ hoặc dịch vụ lỗi vẫn có thể xảy ra; cảnh hỏng được đánh dấu và các cảnh khác tiếp tục. Không coi ảnh chờ dựng là ảnh đạt chất lượng.
- Lỗi phân cảnh chưa phục hồi được vẫn được báo riêng; cảnh của các nhóm khác đã dựng được lưu, không bảo đảm toàn bộ nhà cung cấp AI luôn sẵn sàng.

## Kiểm chứng

- `scripts/verify-motion-scene-plan-recovery.ts`: thay thế bản nháp, sửa trường, khoảng nguồn, đám đông, quan hệ cạnh nhau, vòng gắn vật thể thật, prompt sửa có phạm vi, giới hạn dịch vụ, dựng sớm cho cả 3 kiểu hình, dùng lại cache và di trú bản nháp cũ.
- `scripts/verify-motion-remotion-qa.ts`: phản hồi thiếu trường tùy chọn, sửa một phần và dữ liệu nguồn.
- `scripts/verify-motion-single-draw.ts`: một phản hồi vẽ khi tắt duyệt, cảnh lỗi riêng, giới hạn song song, tiếp tục không gọi AI lại, tạo lại một cảnh và duyệt ảnh theo cấu hình.
- `scripts/verify-motion-composition.ts`, `scripts/verify-motion-scene-consistency.ts`: SVG, lớp hình, kiểm tra an toàn, chuyển động/đạo cụ, cấu hình, cache và tiếp tục.
- `scripts/verify-chat-usage-limits.ts`: kiểm giới hạn ChatGPT bằng trang HTML cục bộ không có role alert, thông báo trạng thái, phân loại lỗi và nút gửi hoạt động bình thường.

Bộ kiểm tra chat tổng `verify-chat-submission-recovery.ts` còn thất bại tại fixture upload Gemini (`gemini_attachments_not_ready`). Phần upload Gemini không được sửa trong thay đổi này; kiểm tra giới hạn được tách riêng để xác nhận đúng phạm vi, không coi bộ tổng đã đạt.

Kiểm thử dùng dữ liệu cục bộ và AI giả lập. Chưa đánh giá chất lượng ảnh của một lượt AI thật sau sửa.

TypeScript (`tsc --noEmit`), ESLint trên các file nguồn thay đổi và `git diff --check` đã qua. Backend đã được nạp lại lúc 12:18 ngày 30/10, PID 89772; trang chủ và `/api/motion-video/engine` đều trả HTTP 200 lúc 12:18:46. Không có tác vụ Motion đang chạy khi khởi động lại.

## Bổ sung: sửa định dạng tại chỗ và phục hồi sau lượt đầu

### Nguyên nhân xác nhận

- Lượt `4fb4237f-c535-4b60-9f8e-69dcd3c1039c` có phản hồi cảnh 3/4 thiếu dấu đóng chuỗi JSON sau SVG. Cảnh 3 còn thiếu đóng nhóm SVG.
- Chẩn đoán của yêu cầu `motion_remotion_composition-f5cad276` lại chọn phản hồi cũ `motion_remotion_composition-edc88b30` do nhánh chọn chuỗi dài nhất.
- Trước thay đổi này, cảnh hỏng được thay bằng ảnh báo lỗi rồi bỏ qua khi tiếp tục; không có lượt tự phục hồi sau cùng. `gen.failed` chỉ phản ánh lỗi kế hoạch và trạng thái dựng có thể báo ready dù còn ảnh lỗi.

### Luồng đã triển khai

1. Bộ đọc ưu tiên câu trả lời mới và mã yêu cầu hiện tại. Loại phản hồi của yêu cầu cũ khỏi ứng viên khi DOM lịch sử thay đổi; không lấy chuỗi dài nhất làm mặc định. Đọc mã yêu cầu ở cấp đầu của JSON ngay cả khi phần SVG sau đó hỏng; chỉ chấp nhận sau khi kiểm tra đầy đủ hợp đồng.
2. Phục hồi dấu đóng chuỗi SVG cuối JSON khi có rõ `</svg>` và dấu kết thúc object; escape xuống dòng/tab chưa escape trong chuỗi. Áp dụng ở bộ đọc chat và bộ trích JSON. Không tự hoàn thành hình bị cắt giữa thuộc tính hay đoán nội dung.
3. Với SVG trọn cảnh, bổ sung thẻ đóng nhóm/root/hình đơn giản khi xác định được từ ngăn xếp. Không xóa tag, đổi hình học, màu, nhân vật hoặc nới bộ lọc nội dung nguy hiểm. Giới hạn 32 thẻ bổ sung; các trường hợp thẻ đóng không có thẻ mở, thuộc tính dang dở, định nghĩa gradient/filter chưa hoàn chỉnh vẫn báo lỗi. SVG sau sửa vẫn phải qua kiểm tra cấu trúc, kích thước và an toàn. Tài nguyên của chế độ kho giữ hành vi cũ.
4. Chạy hết các nhóm lập cảnh/dựng của lượt đầu rồi mới gom các cảnh hỏng để thử lại. Mỗi cảnh có tối đa hai lượt dựng ở cấp pipeline: lượt đầu và một lượt phục hồi sau cùng. Ngân sách duyệt/sửa ảnh khi bật duyệt vẫn theo cấu hình hiện có. Các lỗi dừng do người dùng và CAPTCHA không bị chuyển thành lỗi hình để tự lặp.
5. `scene.build.attempts` lưu cùng checkpoint. Khi tiếp tục sau gián đoạn giữa hai lượt chỉ phục hồi cảnh còn lượt; không vẽ lại cảnh đã đạt. Cảnh lỗi cũ chưa có trường này được tính đã thử một lượt. Tạo lại riêng một cảnh khởi đầu ngân sách mới chỉ cho cảnh đó.
6. Khi phục hồi, lấy cảnh đã đạt cùng địa điểm làm tham chiếu; không dùng ảnh báo lỗi. Giữ tối đa ba worker dựng. Giữ cấu trúc prompt ba kiểu hình, AI/model đã chọn và cách định tuyến nội dung/dựng hình.
7. `gen.failed` gồm cả lỗi kế hoạch và ID cảnh hỏng, không đếm trùng trên UI. Phân biệt trạng thái `ready` với `partial`: có thể render ảnh báo lỗi theo chính sách tiếp tục người dùng đã chọn, nhưng không coi là toàn bộ hình đã đạt. Nếu hết ngân sách, vẫn cho xem/xuất và báo rõ số cảnh cần tạo lại.
8. Runner tiếp tục cả cảnh lỗi cũ còn ngân sách, không lặp lại cảnh đã hết ngân sách. Log có lượt phục hồi, số cảnh trên tổng cảnh và tổng kết đạt/lỗi; kết quả hoàn thành có cảnh lỗi được ghi rõ.

### Kiểm chứng bổ sung

- `scripts/verify-motion-local-svg-repair.ts`: JSON thiếu dấu đóng chuỗi, newline chưa escape, SVG escape Unicode, bổ sung đóng nhóm/root, tính lặp lại ổn định, giữ hình/màu, từ chối markup dang dở và nội dung nguy hiểm, giữ hành vi kho.
- `scripts/verify-chat-response-snapshots.ts`: trang HTML cục bộ; phản hồi cũ dài hơn và bị đổi DOM trong khi đang chờ phản hồi mới, JSON mới sửa được và JSON mới thực sự hỏng; kiểm tra không lấy nhầm kết quả cũ.
- `scripts/verify-motion-single-draw.ts`: lỗi tạm thời phục hồi đúng thứ tự ở cả ba kiểu hình, không duyệt khi tắt, sửa thẻ tại chỗ không thêm request, giới hạn thử lại, checkpoint giữa hai lượt, tiếp tục không tốn thêm lượt khi đã hết ngân sách, tạo lại riêng và review bật.
- `scripts/verify-motion-composition.ts`, `scripts/verify-motion-scene-plan-recovery.ts`, `scripts/verify-motion-remotion-qa.ts`, `scripts/verify-motion-scene-consistency.ts`, `scripts/verify-motion-production-runner.ts`: kiểm tra tích hợp và tương thích bằng AI giả lập, không tạo video thật.

Bộ audit mở rộng `scripts/verify-motion-audit-fixes.ts` còn dừng tại dòng 276: fixture cũ kỳ vọng tự sửa sai bố cục dù AI duyệt trả `ok:true`, trong khi chính sách đang dùng chỉ ghi góp ý hình học. Không đổi QA hoặc mã dựng để ép qua kỳ vọng cũ này; đây không phải kiểm chứng đã đạt.

Đã chạy bộ sửa trên phản hồi thực cũ của cảnh 3/4 bằng dữ liệu lưu, không gửi yêu cầu AI: cả hai qua chuẩn hóa cấu trúc SVG (27.635 và 17.083 ký tự; 11 và 10 lớp hình). Bằng chứng tại `scratch/backend-reload-20261030/local-recovery-evidence.json`. Chỉ kết luận dùng được về cấu trúc; chưa đánh giá lại nội dung hình hay thay ảnh trong dự án đã dừng.

Các kiểm tra trọng tâm nêu trên, TypeScript, ESLint các file nguồn thay đổi và `git diff --check` đã qua. Backend nạp lại lúc 12:55:48 ngày 30/10, PID 75944. Lúc 12:56:20, trang chủ và `/api/motion-video/engine` đều HTTP 200; 361 file dự án/checkpoint/job đối chiếu hash trước và sau không thay đổi. Không có production hoặc story job đang hoạt động khi khởi động lại. Biên nhận tại `scratch/backend-reload-20261030/check-scene-local-recovery.json`.
