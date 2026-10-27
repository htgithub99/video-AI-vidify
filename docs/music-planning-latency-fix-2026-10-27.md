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
8. Heartbeat giữ luồng HTTP hoạt động; đóng kết nối hủy lượt đang chạy. Giao diện giữ bài đã nhận khi mất kết nối hoặc dừng; bài được lưu qua cơ chế lưu workspace hiện có.
9. Thumbnail chỉ báo đang tạo khi thật sự gửi yêu cầu tạo ảnh. Khi nhận bài mới, xóa liên kết ảnh và kết quả tải cũ để không ghép nhầm sang lượt mới.
10. Lỗi SEO vẫn là cảnh báo, giữ bài và cấu hình đã đạt. Hủy trong bước SEO phải dừng, không bị chuyển thành kết quả thành công.

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
- `npx tsx scripts/verify-music-planning-ui.ts`: đạt; dùng component thật trên trình duyệt cục bộ, kiểm tra tiến độ, lời hiện sớm, mất kết nối/tải lại, thứ tự cuối, thời điểm tạo thumbnail và dừng.
- `npx tsx scripts/verify-chat-composer-validation.ts`: đạt.
- `npx tsx scripts/verify-chat-response-snapshots.ts`: đạt; bao gồm xác nhận ghép lỗi, sai request ID và việc tiếp tục từ chối JSON sản xuất bị ghép lỗi.
- Bộ static cũ `verify-music-source-composition.ts` còn assertion không khớp biểu thức `TRACK_EVALUATION_WORKER_ID` đã chuyển qua hàm hằng chuỗi. Không dùng kết quả bộ này để khẳng định toàn bộ luồng Suno đã qua kiểm thử.

Không gửi yêu cầu thật đến AI hoặc Suno, không tạo video thử. Thời gian còn phụ thuộc độ dài nguồn, số bài, tốc độ model và CAPTCHA. Checkpoint backend vẫn ở bộ nhớ với thời hạn hiện có; khởi động lại backend không phục hồi checkpoint này. Tải lại giao diện giữ bài đã nhận, không tự nối lại lượt AI đang chạy.

## Nạp bản sửa

Đã khởi động lại backend sau khi kiểm tra lượt sáng tác đã dừng và không có production video đang chạy. Backend mới trả HTTP 200 tại `http://127.0.0.1:3002/`. Lúc khởi động chưa có Chrome sinh ảnh tại cổng 9222; chưa kiểm tra tạo thumbnail thật.
