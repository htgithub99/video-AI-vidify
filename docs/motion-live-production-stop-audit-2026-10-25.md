# Lượt thật dừng khi phát triển dàn ý

Production: `91d9d75d41be32eb5a1117616af90b2a`. Cấu hình do lượt thật lưu: 20 phút, Tối giản mặt nạ, Gemini Flash Low. Dàn ý mới mang tên “Tiếng Gáo Khua Dưới Đáy Lu”.

## Diễn biến đã xác nhận

| Giờ | Kết quả |
| --- | --- |
| 22:19:49 | Bắt đầu phân tích nguồn 4.027 từ; prompt phân tích 47.762 ký tự. |
| 22:22:09 | Nhận phân tích nguồn, chuyển sang biên kịch; prompt 44.125 ký tự. |
| 22:24:09 | Có dàn ý đủ 8 chương, nhưng `illustrationNeeds` sai. Lưu dàn ý và yêu cầu sửa, prompt 23.821 ký tự. |
| 22:25:47 | Phản hồi sửa JSON không hợp lệ. Dữ liệu sai vẫn còn trong draft; hết 2 lượt và dừng bước phân tích. |
| 22:38:54–55 | Tiếp tục từ checkpoint; `rejected=2, budget=2`. Dừng ngay, không có request AI mới. Thông báo bị đổi thành lỗi biên kịch chung. |

## Nguyên nhân trực tiếp

1. Phản hồi đầu sai cú pháp quanh `size`/`mount`: raw có đoạn `"size:1:1,"mount":"table"`. Dàn ý được trích xuất có key lạ `size:1:1,\"mount` thay vì hai trường riêng, nên các đạo cụ mất `mount`. Validator từ chối đúng dữ liệu này.
2. Ba từ dẫn chứng đạo cụ không nằm trong câu evidence được chọn: `lu nước`, `chăn`, `đèn dầu`. Đây là lỗi nội dung độc lập với lỗi JSON.
3. Phản hồi sửa có đoạn `"requirements":}` ở đạo cụ mâm cúng; không thành JSON hợp lệ, không được áp dụng vào draft.

## Điểm yếu của code khiến không phục hồi được

- `motionIllustrationNeedsErrors` đã trả đường dẫn lỗi, nhưng lỗi object vẫn gộp nhiều điều kiện vào một thông báo. Nó chưa chỉ thẳng trường `mount` bị thiếu do key biến dạng.
- `developCreativeStory` sửa cả `illustrationNeeds` với toàn bộ dàn ý trong ngữ cảnh; chưa chia riêng từng row/field sai. Một lỗi cú pháp ở cuối phản hồi sửa làm toàn bộ patch không dùng được.
- `requestMotionAiContract` đánh dấu hết budget là `CONTRACT_EXHAUSTED`. `runMotionAi` ném lại ngay cờ này, nên danh sách “AI 1/5” không được chuyển sang AI tiếp theo ở trường hợp này.
- Resume giữ budget đã dùng là đúng để tránh vòng lặp vô hạn, nhưng hiện không có cơ chế tiếp tục phục hồi có giới hạn phù hợp cho từng phần lỗi. `contractErrors` cục bộ chưa được khởi tạo từ lỗi draft trước khi hết budget, nên catch trả thông báo chung “Bấm Phân tích lại” dù bấm tiếp tục chưa gửi thêm yêu cầu nào.
- Prompt biên kịch và repair thực tế còn lớn. Kích thước không tự chứng minh nguyên nhân JSON sai, nhưng cho thấy nhánh dàn ý 8 chương chưa được chia nhỏ như mục tiêu tối ưu prompt.

## Dữ liệu kiểm chứng

- `storage/output/motion-video/productions/91d9d75d41be32eb5a1117616af90b2a.json`
- `storage/output/motion-video/ai-debug/motion-story-doctor-144b57e7.json`: raw đầu sai `size`/`mount`.
- `storage/output/motion-video/ai-debug/motion-story-doctor-7af443fe.json`: draft đã lưu và lỗi hợp đồng lượt 1.
- `storage/output/motion-video/ai-debug/motion-story-doctor-23ddaeb6.json`: raw patch sai `requirements`.
- `storage/output/motion-video/ai-debug/motion-story-doctor-b87b5e80.json`: vẫn giữ draft chưa sửa sau lượt 2.
- `storage/output/motion-video/task-drafts/34a78a90e77f450b11e86f3fa674e0044039e55db2ebedcb2f85972fe48722eb.json`: revision 1, rejected 2, budget 2.
- Chạy lại validator tại máy bằng `scratch/audit-live-story-stop-20261025.ts`, đầu ra `scratch/live-story-stop-20261025.json`.

## Hướng sửa chung cần thực hiện

1. Báo lỗi đúng từng trường và phát hiện key bất thường; giữ dữ liệu nguồn nguyên bản để truy vết, không tự đoán một trường bị nuốt vào tên key.
2. Tách repair từng yêu cầu minh họa/field; giữ các chương, nhân vật, đạo cụ và row đã đạt. Phản hồi hỏng một row không làm mất các row đã được xác nhận độc lập.
3. Phân biệt hết lượt sửa ở một AI với hết toàn bộ quy trình. Thiết kế budget hữu hạn theo phần/provider, tuân thủ khóa provider; chỉ chuyển AI khi cấu hình cho phép.
4. Resume phải trình bày đúng lỗi đã lưu và hành động phục hồi thực tế; không hướng dẫn thử lại khi cơ chế hiện tại sẽ dừng ngay mà không có request.
5. Thêm hồi quy từ hai raw thật, kiểm bản nháp được giữ, sửa từng phần, trạng thái hết budget và resume. Lượt thử 2 phút trước chưa kiểm đủ nhánh phản hồi hỏng này ở dàn ý 8 chương.

Lượt này dừng trước dựng hình, voice và xuất MP4. Backend vẫn chạy; việc điều tra trên không thay đổi dữ liệu production.
