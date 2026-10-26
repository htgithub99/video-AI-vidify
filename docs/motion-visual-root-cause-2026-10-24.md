# Sửa nguyên nhân hình sai sự kiện trong Video Motion

Áp dụng chung cho luồng puppet 2D của cả Tối giản mặt nạ và Chibi màu dân gian. Không chứa tên nhân vật, mã phân đoạn hoặc điều kiện riêng của Tiếng Cào Đêm Tiết Khí trong logic xử lý.

## Nguyên nhân và sửa đổi

| Nguyên nhân trong code | Hậu quả | Sửa ở luồng chung |
|---|---|---|
| `puppetBeatLines` chỉ giữ câu, địa điểm và người nói; bỏ `scenePlan`, quan hệ, trước/sau và điều kiện chấp nhận. READ nhận chủ yếu câu và ba câu trước. | Có kế hoạch cảnh trong kịch bản nhưng bước dựng không dùng; phản ứng có thể đổi sang nơi chỉ được nhắc tới. | Giữ kế hoạch, hành động và thời gian trên dòng dựng. READ nhận chuỗi sự kiện toàn truyện; READ/COMPOSE/QA đều nhận kế hoạch của đoạn. Chỉ vẽ sự kiện đã tới trong câu hiện tại. |
| Khóa hình là nội dung câu chuẩn hóa; `collectPuppetLines` loại câu trùng toàn truyện. | Cùng câu ở hai lần xuất hiện có thể lấy chung hình dù người, nơi hoặc trạng thái khác. | Khóa theo beat + thứ tự xuất hiện + câu. Thời gian giọng vẫn khớp theo nội dung câu. Compiler còn đọc được dữ liệu khóa cũ; bản dựng mới không tái dùng cache cũ. |
| Chỉ có trạng thái người theo cảnh; thiếu bộ nhớ cho vật, chủ sở hữu và trạng thái đồ gắn trong nền. | Rựa đã gãy lại nguyên, cửa đã mở lại đóng, đèn đã tắt lại sáng, đồ đổi chủ khi đổi trọng tâm. | READ trả bằng chứng hình cần thấy và các thay đổi vật lý. Chuẩn hóa theo trình tự, tách dòng hiện tại/hồi tưởng; giữ trạng thái và quyền sở hữu đến khi có thay đổi rõ. Vật đang cầm hoặc vác vẫn theo người ở câu sau dù không nhắc lại, dừng sau hành động đặt xuống/chuyển chủ. Cận cảnh không biến vật của người ngoài khung thành vật rơi trên nền. Tạo khóa tài nguyên theo trạng thái; nền thay đổi có biến thể riêng với SVG/điểm đặt nền gốc làm tham chiếu. Không ghép nền nguyên trạng để thay cho biến thể có trạng thái khác. |
| `effectSource` chỉ mô tả nguồn, engine chỉ vẽ hơi đi lên. | Không thể diễn đạt khói bò sát nền hoặc vào đúng miệng dù đã chọn đúng tài nguyên. | Thêm `effectTarget` và `effectMode`: rise/ground/toward, truyền qua READ → COMPOSE → layout → compiler → engine. Đích người được lấy tại miệng sau biến đổi tư thế; khói sát nền dùng điểm chân. Không lấy người cuối danh sách làm đích. |
| Compiler gộp khung quá ngắn chỉ theo người nói, không so nội dung hình. | Sự kiện mới bị nuốt dù READ/COMPOSE đã dựng đúng. | Chỉ gộp khung ngắn khi hình và cảnh phụ giống nhau; giữ toàn bộ ID câu của khung gộp để QA vẫn kiểm đủ nội dung. |
| QA thiếu kế hoạch/trạng thái; bỏ qua kết quả thiếu, gộp kiểm theo câu thay vì từng ảnh; sửa một lượt rồi không kiểm lại. Lỗi dựng sheet bị đổi thành danh sách rỗng. | Không kiểm được vẫn có thể đi tiếp; hình tự sửa chưa được xác nhận. | Kiểm từng ảnh với lời, kế hoạch, trạng thái và ảnh trước nhóm; đọc lại kết quả thiếu. Tự sửa tối đa hai lượt, mỗi lượt dựng lại ảnh và kiểm lại. Thay đổi trạng thái làm dựng lại cả các dòng sau bị ảnh hưởng. Lưu lỗi còn lại; không đổi việc chưa kiểm thành báo thành công. |
| Cache không có phiên bản yêu cầu hình và dấu vết đầu vào kế hoạch. | Sửa prompt hoặc kế hoạch vẫn dùng lại hình cũ. | `visualContractVersion` và `visualInputKey`; UI tự dựng lại khi bản cũ, đầu vào đổi hoặc còn lỗi hình. Tài nguyên thư viện hợp lệ vẫn được giữ để tái dùng. |

## Kiểm chứng

- `npm run test:motion-visual-contract`: khóa câu lặp, thời gian giọng, khung ngắn khác sự kiện, truyền kế hoạch, phục hồi kết quả READ thiếu, khôi phục người bị COMPOSE bỏ mất, trạng thái vật/đồ gắn nền, chuyển chủ, quay lại địa điểm, qua chương, hồi tưởng, tính ổn định khi chuẩn hóa lại, sửa trạng thái trước làm cập nhật đoạn sau, QA thiếu và nhiều ảnh cùng một câu; định tuyến khói trong Chromium; hồi quy tư thế nằm/ngồi và dưới gầm giường.
- `npx tsx scripts/verify-motion-placement-general.ts`: quan hệ với vật đỡ, điểm tiếp xúc, ánh sáng, biến thể và tương thích dữ liệu cũ.
- `npx tsx scripts/verify-motion-folk-blocking.ts --installed`: 368 phép kiểm, dựng 130 ảnh bằng renderer thật; hai phong cách, ngày/đêm, lật cảnh, vai trò và tài nguyên. Đã xem bảng tám ảnh đại diện; đây không phải khẳng định đã xem thủ công đủ 130 ảnh.
- `npx tsx scripts/verify-motion-asset-catalog.ts`: phân loại, danh tính và điều kiện tái dùng tài nguyên.
- `npx tsx scripts/verify-motion-depth-order.ts`: kiểm pixel thứ tự lớp và các cao độ khác nhau.
- `npx tsx scripts/verify-motion-camera-comfort.ts`: giữ hồi quy camera chậm và chuyển cảnh nhẹ.
- `npx tsx scripts/verify-motion-speech.ts`: giữ phân biệt lời kể/lời thoại, thời gian giọng và miệng nói, bao gồm câu ngắn và cảnh phụ.
- `npx tsc --noEmit --pretty false` và `git diff --check`.

[Bảng ảnh đại diện hai phong cách](../scratch/visual-contract-20261023/placement-review.jpg). [Kết quả kiểm bố cục](../scratch/folk-blocking-20261023/verification.json).

## Phạm vi xác nhận

Kiểm thử đọc/dựng/QA dùng câu trả lời AI giả lập để kiểm hành vi luồng; kiểm ảnh tài nguyên và hiệu ứng chạy Chromium thật. Lượt này chưa chạy một truyện mới qua tài khoản AI thật và chưa xuất lại video dài. Các thay đổi không tự sửa MP4 đã xuất. Backend hiện chạy bằng tiến trình không watch nên cần nạp lại tiến trình để dùng code server mới.

Không thể kết luận mọi câu chuyện sẽ luôn được AI hiểu đúng từ những kiểm thử này. Bản sửa loại bỏ các đường mất dữ liệu và bỏ qua kiểm tra đã xác định, thêm bộ nhớ trạng thái và tự sửa có kiểm lại. Chất lượng lựa chọn của AI trên truyện mới vẫn cần được xác nhận qua luồng kiểm hình đó.
