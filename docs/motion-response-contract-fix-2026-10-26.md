# Sửa gốc hợp đồng kết quả AI Video Motion — 26/10/2026

## Bổ sung sau lượt chạy thực tế lúc 14:45

Lượt mới bộc lộ validator nhu cầu minh họa chưa đồng bộ với các trường tùy chọn nullable trong schema. Đã chuẩn hóa tại các cửa đọc/kiểm/ghép/lưu và thêm giới hạn cho chuỗi sửa không đổi. Xem [báo cáo nguyên nhân, fixture nháp thực tế và kiểm chứng](motion-illustration-null-root-fix-2026-10-26.md). Các kiểm cục bộ bên dưới không đủ để kết luận trước đó toàn luồng đã ổn định; phần mới được ghi riêng để giữ đúng lịch sử.

## Nguyên nhân đã xác minh

Production `7ab3d31924a2ac8ef43d8d98f8846fbd` dừng lúc 12:43:38 vì `videoDna.environment.propRules needs concrete guidance`. Bản nháp thực tế chứa **5 quy tắc có nội dung**, nhưng ở dạng mảng chuỗi trong khi validator nhận một chuỗi. Thông báo cũ không chỉ ra kiểu cần trả; yêu cầu sửa chưa cung cấp đủ chẩn đoán về kiểu. Vì vậy cùng lỗi biểu diễn có thể tiêu hết số lần thử dù nội dung đã đủ.

Đọc lại bản nháp thực tế bằng code mới, không ghi ngược vào dữ liệu:

```json
{
  "before": ["videoDna.environment.propRules: expected string(min 1 chars); received array"],
  "after": [],
  "rulesBefore": 5,
  "allRulesPreserved": true
}
```

## Thay đổi

| Phần | Đối ứng |
|---|---|
| Kiểu kết quả chung | `src/constants/motionResponseContract.ts` khai báo object/array/string/number/integer/boolean/null, trường bắt buộc, enum và giới hạn. Prompt và kiểm kiểu dùng cùng khai báo. |
| Tiện ích chung | `src/lib/motionResponseContract.ts` sinh quy định đầu ra gọn, lỗi có đường dẫn/kiểu cần/kiểu nhận/giá trị và yêu cầu sửa. `string+` chỉ chuỗi không rỗng. |
| DNA | Chỉ chuẩn hóa mảng chuỗi không rỗng thành chuỗi ở các trường mô tả. Giữ nguyên từng quy tắc và các mảng đúng nghĩa. Không ép object, số, boolean, mảng hỗn hợp, enum hoặc mức tin cậy thành kiểu khác. |
| Nháp đã hết lượt | Chuẩn hóa biểu diễn tương đương trước khi xét ngân sách; bản nháp có nội dung hợp lệ có thể tiếp tục mà không gọi AI lại cho lỗi này. Không mở lại ngân sách cho dữ liệu thực sự sai. |
| Phân tích và hồ sơ bổ sung | Kiểm cấu trúc tối thiểu của title/logline/cast/places/chapters và DNA. Sửa đúng đường dẫn lỗi; giữ ID, thứ tự và trường đã đạt. Hồ sơ phong cách bổ sung giữ bản nháp qua từng lượt. |
| Viết chương | Kiểm trường được cung cấp trước khi normalizer có thể mặc định hoặc bỏ dữ liệu sai. Báo rõ key nhân vật/địa điểm lạ, kiểu và enum sai. Hướng dẫn sửa chỉ chứa mục còn thiếu/sai và ngữ cảnh cần thiết. |
| Editor | Giữ chỉnh sửa hợp lệ, chỉ thử sửa đề xuất chưa đạt trong giới hạn. Giữ phân vai/thứ tự thoại và đối chiếu chữ với lời kể. Lượt sửa vẫn có hướng dẫn tiếng Việt và hồ sơ thể loại. |
| Phân thoại | Lưu lỗi theo beat; kiểm thiếu/trùng ID, người nói không hợp lệ, metadata sai và chữ không khớp. Lượt sau chỉ gửi beat chưa đạt. Nhánh dự phòng người kể không khóa vĩnh viễn một lượt tách thoại chưa thành công. |
| SEO/thumbnail | SEO kiểm kiểu theo trường và giữ mục đạt. Thumbnail không ép mảng/object thành prompt chuỗi; lượt sửa nhận chẩn đoán và vẫn giữ dự phòng cục bộ. |
| Storyboard/READ/compose/review | Thống nhất quy định đầu ra theo artifact; compose kiểm chỉ số trùng/sai kiểu, review gửi chỉ số còn thiếu và lỗi kiểu ở lượt sửa. Giữ kiểm ngữ nghĩa, bố trí, danh mục và geometry hiện có. |
| Sổ nguồn | Lượt sửa nêu rõ ID phần nguồn, dạng kết quả và lỗi kiểu; vẫn kiểm trích dẫn, nguyên nhân và bảo toàn nguồn. |
| Âm thanh | Cho phép im lặng hoặc hiệu ứng có căn cứ, không ép đủ số lượng và không tự thêm tiếng bước chân cho hình đứng yên. |
| Độ dài prompt | Bỏ quy định đầu ra lặp khi đã có đầy đủ hoặc đang sửa trường với chẩn đoán kiểu. DNA lõi không chèn thêm schema của nhiệm vụ khác vào phân tích nguồn. Storyboard, READ, editor, sound và review tính phần quy định đầu ra trong prompt chia nhóm. Gộp đoạn READ lặp về vật và hình minh họa, giữ các ràng buộc cần thiết. |

Các schema là hợp đồng cấu trúc và công cụ chẩn đoán. Không dùng một bộ kiểm toàn bộ object để từ chối mọi patch thiếu trường đã được lưu: patch vẫn được ghép vào đúng vùng cho phép rồi qua kiểm ngữ nghĩa của từng bước. Các kiểm danh mục, bằng chứng nguồn, vai nói, vị trí, mặt tựa và khả năng dựng không bị bỏ để làm kết quả trông như thành công.

ScenePlan và động tác phụ vẫn phục vụ hình minh họa đơn giản; không biến tư thế/hành động khó thành yêu cầu mô phỏng mới. Giữ các bản sửa về kho đóng, viết truyện mới cùng đề tài và giọng hiện có.

## Kiểm chứng

Đã qua các phép kiểm cục bộ liên quan:

- `npx tsc --noEmit`.
- `npm run test:motion-response-contracts`: lỗi DNA, chuẩn hóa an toàn, phục hồi nháp hết lượt, bảo toàn trường đạt, sửa chương/phân thoại/editor/thumbnail, không lặp hợp đồng đầu ra.
- `npm run test:motion-story-craft`: truyện và ngôn ngữ Việt, khóa đề tài dân gian, giữ thoại và tham chiếu nguồn.
- `npx tsx scripts/verify-motion-source-planning.ts`.
- `npx tsx scripts/verify-motion-dna-repair.ts`.
- `npx tsx scripts/verify-motion-field-repair.ts`.
- `npx tsx scripts/verify-motion-seo.ts`.
- `npx tsx scripts/verify-motion-read-contract.ts`.
- `npx tsx scripts/verify-motion-prompt-resume.ts`.
- `npx tsx scripts/verify-motion-root-contracts.ts`.
- `npx tsx scripts/verify-motion-simple-illustration.ts`.
- `npx tsx scripts/verify-motion-storyboard.ts`: AI giả lập và renderer ảnh tĩnh để kiểm giữ hình/chuyển hình theo sự kiện.
- `npx tsx scripts/verify-motion-ai-recovery.ts`: provider giả lập và kiểm phục hồi cục bộ.

Không gọi AI/TTS thật, không tạo, tiếp tục hoặc xuất video trong đợt này. Bộ kiểm mới dùng thư mục tạm riêng. File production và nháp thật được giữ nguyên.

## Nạp code và giới hạn

Đã kiểm không có production hoạt động, không có standalone mới đang chạy và không có manifest xuất đang chờ; khởi động lại đúng backend tại cổng 3002 để nạp code. PID cũ `70556`, PID mới `78784`. Một snapshot standalone trạng thái rendering từ 18/10 là dữ liệu lịch sử, không được tự tiếp tục. Không gọi resume production.

Sau khi nạp, HTTP `/` trả 200; hash của sáu production và bản nháp gây lỗi đều không đổi. Log khởi động vẫn báo chưa kết nối trình duyệt sinh ảnh tại cổng debug 9222; phép kiểm HTTP không chứng nhận kết nối browser/provider thật. Không mở lượt tạo ảnh hoặc video để kiểm dịch vụ này.

Các kiểm trên chứng minh những ca lỗi và hồi quy đã nêu; chưa chứng nhận mọi phản hồi provider, chất lượng giọng hoặc video thật đều đạt. Đây là phần đối ứng hợp đồng kết quả của R02/R09/R11/R14/R18/R22, không đánh dấu hoàn tất toàn bộ plan lớn.
