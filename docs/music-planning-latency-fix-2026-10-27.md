# Sửa luồng Sáng tác nhạc — 27/10/2026

## Nguyên nhân đã xác định

Lượt `music_1793094047658_r5qp1w529l9` trong `storage/logs/music-workflow.jsonl`, giờ Việt Nam:

| Bước | Thời gian | Kết quả |
| --- | --- | --- |
| Phân tích phong cách | 16:40:47–16:44:56 | Nguồn và prompt 51.187 ký tự, chia ba phần |
| Viết bài hát | 16:44:56–16:56:54 | Đã viết đủ 25 bài qua 13 lô, hai room độc lập |
| Xếp hạng | Từ 16:56:54 | Gửi lại toàn bộ lời và metadata: 125.395 ký tự, bảy phần xác nhận tuần tự |
| Phục hồi | Đến 17:09:59 | JSON xác nhận lỗi làm gửi lại dữ liệu nhiều lần, sau đó mới gửi yêu cầu thực thi |
| Kết thúc | 17:11:49 | Bị hủy với `chat_planning_cancelled`, tổng khoảng 31 phút |

Chậm chủ yếu ở việc gửi lại toàn bộ lời để xếp hạng và cách xử lý xác nhận lỗi. Giao diện trước đây chỉ nhận kết quả cuối, che cả những bài đã viết xong và báo tạo thumbnail trước khi thật sự gửi yêu cầu tạo ảnh.

## Đã sửa

1. Mỗi lô viết bài trả thêm đánh giá ngắn theo cùng thang điểm, ngay trong phản hồi có lời hoàn chỉnh. Lời bài hát vẫn được giữ đầy đủ.
2. Lô cũ hoặc phản hồi thiếu đánh giá chỉ yêu cầu đánh giá những bài còn thiếu, tối đa hai lượt. Không viết lại bài đã đạt. Đánh giá thiếu không làm mất lời bài hát.
3. Xếp hạng dùng đủ ID, tiêu đề, trích điệp khúc và đánh giá ngắn; không gửi lại toàn bộ lời. Sau hai kết quả xếp hạng không hợp lệ, dùng điểm đã có; bài chưa có điểm giữ thứ tự viết. Giao diện hiển thị cảnh báo.
4. Cấu hình Suno, sửa cấu hình, SEO và tạo lại SEO dùng dữ liệu tóm lược theo công việc. Phân tích nguồn và viết bài vẫn có dữ liệu cần thiết để giữ phong cách và chất lượng sáng tác.
5. Chỉ đối với xác nhận truyền dữ liệu, có thể lấy một JSON xác nhận hoàn chỉnh trong phản hồi bị ghép lỗi. Vẫn kiểm tra đúng loại, request ID và số phần. Khi xác nhận sai, yêu cầu sửa ngay trong room, không gửi lại toàn bộ dữ liệu.
6. Kết quả sản xuất thông thường vẫn giữ kiểm tra JSON và định danh; không áp dụng cách đọc xác nhận nới hơn cho lời bài hát, kịch bản hoặc dữ liệu khác.
7. API hỗ trợ NDJSON để gửi tên bước, số bài hoàn thành/tổng, lượt thử và dữ liệu từng lô. Client cũ không yêu cầu streaming vẫn nhận JSON cuối như trước.
8. Heartbeat giữ luồng HTTP hoạt động; đóng kết nối hủy lượt đang chạy. Bài nhận từng lô được lưu qua cơ chế lưu workspace hiện có, nhưng khi còn sáng tác, giao diện luôn dùng loading cũ và chỉ hiện toàn bộ kết quả sau phản hồi hoàn tất. Đã bỏ khung “Tiến độ sáng tác” theo yêu cầu người dùng. Mất kết nối hoặc dừng vẫn giữ bài đã nhận để phục hồi.
9. Thumbnail chỉ báo đang tạo khi thật sự gửi yêu cầu tạo ảnh. Khi nhận bài mới, xóa liên kết ảnh và kết quả tải cũ để không ghép nhầm sang lượt mới.
10. Lỗi SEO vẫn là cảnh báo, giữ bài và cấu hình đã đạt. Hủy trong bước SEO phải dừng, không bị chuyển thành kết quả thành công.
11. Mặc định viết năm bài mỗi lượt, hai room độc lập. Khi phản hồi không đạt, chia lô theo thứ tự `5 → 2 → 1`; giữ toàn bộ các lô đã hoàn thành. Phản hồi nhỏ cuối danh sách không phải đủ năm bài nếu số bài còn lại ít hơn.
12. `gemini_thinking_unavailable` được phân loại là lỗi cấu hình model không thể sửa bằng cách viết lại lời hoặc chia lô nhỏ. Giữ nguyên lỗi thực tế, không thử lại năm lần rồi thay thành lỗi JSON. Log mới có `selectionPhase` để phân biệt lỗi ở chọn model và chọn mức tư duy. Không tự đổi model hoặc giảm mức tư duy đã chọn.

## Lượt lỗi mới và đánh giá lô năm bài

Lượt `music_1793097318384_fq5ldxcwx8` bắt đầu 17:35:18, đã viết 18/25 bài qua chín lô. Từ 17:44:58, lô bắt đầu ở bài 19 gặp `gemini_thinking_unavailable` với `gemini-argon::high`; lô tiếp theo cũng gặp lỗi này. Tool cũ thử lại năm lần cho mỗi lô và kết thúc lúc 17:46:41 bằng lỗi định dạng, làm mất nguyên nhân ban đầu trong thông báo cuối.

Chưa có bằng chứng trong log về vượt token, cắt phản hồi hoặc lỗi lời bài hát ở hai lô đó: lỗi xảy ra khi áp dụng lựa chọn model trước bước gửi yêu cầu sáng tác. Log cũ không có pha lựa chọn hoặc thông báo hạn mức, nên chưa thể khẳng định nguyên nhân bên ngoài là hết hạn mức hay tùy chọn bị khóa ở đâu.

Chín phản hồi đạt có độ dài 8.148–8.327 ký tự cho hai bài, trung bình 8.236 ký tự. Ước tính tuyến tính năm bài khoảng 20.589 ký tự đầu ra. Đây là ước tính từ lượt chạy, không phải đo token thực tế hoặc cam kết giới hạn của Gemini web. Prompt đầu vào giữ cùng DNA và hướng dẫn, chỉ đổi phạm vi/số bài; đầu ra mỗi lượt tăng khoảng 2,5 lần nhưng tổng lời cho 25 bài gần như giữ nguyên. Nếu các lô đều đạt, số lượt sáng tác giảm từ 13 xuống 5, giúp giảm việc gửi lặp hướng dẫn và DNA.

Kiểm thử mô phỏng route đã xác nhận hai room nhận năm bài mỗi room; phản hồi không đạt có thể chia xuống hai rồi một bài; lỗi model không khả dụng chỉ được gọi một lần ở lô đó, giữ nguyên nguyên nhân và dữ liệu lô đã đạt. Không chạy sáng tác thật. Thay đổi backend này chưa được nạp vào tiến trình đang chạy nhằm giữ checkpoint của 18 bài hiện có; cần nạp lại backend trước lượt dùng chính sách mới.

## Số liệu kiểm thử mô phỏng

Bộ kiểm thử gồm 30 bài, mỗi bài có lời dài hơn 3.000 ký tự:

| Prompt | Ký tự |
| --- | ---: |
| Xếp hạng | 10.728 |
| Sửa xếp hạng | 10.090 |
| Cấu hình Suno | 9.596 |
| Sửa cấu hình | 5.487 |
| SEO | 15.160 |
| Sửa SEO | 10.772 |
| Tạo lại SEO | 10.329 |

Tất cả giữ đủ tiêu đề và ID; không chứa lại toàn bộ lời bài hát. Đây là số liệu kích thước prompt, chưa phải số đo thời gian AI trả lời thực tế.

## Xác minh

- `npx tsc --noEmit --pretty false`: đạt.
- `npx tsx scripts/verify-music-planning-recovery.ts`: đạt; thực thi route sản xuất với AI mô phỏng, hai worker, checkpoint cũ thiếu đánh giá, phục hồi từng mục, JSON tương thích, streaming UTF-8, xếp hạng dự phòng, SEO lỗi và hủy.
- `npx tsx scripts/verify-music-planning-ui.ts`: đạt; dùng component thật trên trình duyệt cục bộ, kiểm tra loading duy trì ở mọi bước dù đã lưu đủ bài, chỉ hiện danh sách khi nhận kết quả cuối; đồng thời kiểm tra mất kết nối/tải lại, thứ tự cuối, thời điểm tạo thumbnail và dừng.
- `npx tsx scripts/verify-chat-composer-validation.ts`: đạt.
- `npx tsx scripts/verify-chat-response-snapshots.ts`: đạt; bao gồm xác nhận ghép lỗi, sai request ID và việc tiếp tục từ chối JSON sản xuất bị ghép lỗi.
- Bộ static cũ `verify-music-source-composition.ts` còn assertion không khớp biểu thức `TRACK_EVALUATION_WORKER_ID` đã chuyển qua hàm hằng chuỗi. Không dùng kết quả bộ này để khẳng định toàn bộ luồng Suno đã qua kiểm thử.

Không gửi yêu cầu thật đến AI hoặc Suno, không tạo video thử. Thời gian còn phụ thuộc độ dài nguồn, số bài, tốc độ model và CAPTCHA. Checkpoint backend vẫn ở bộ nhớ với thời hạn hiện có; khởi động lại backend không phục hồi checkpoint này. Tải lại giao diện giữ bài đã nhận, không tự nối lại lượt AI đang chạy.

## Nạp bản sửa

Đã khởi động lại backend sau khi kiểm tra lượt sáng tác đã dừng và không có production video đang chạy. Backend mới trả HTTP 200 tại `http://127.0.0.1:3002/`. Lúc khởi động chưa có Chrome sinh ảnh tại cổng 9222; chưa kiểm tra tạo thumbnail thật.
