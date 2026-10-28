# Phục hồi lượt tạo nhạc Suno — 28/10/2026

## Lỗi được xác nhận

Lượt `suno-create-1793174860645` ngắt ở bài 20/25. Nhật ký trình duyệt báo `Failed to fetch` lúc 15:11:57. Backend không còn nghe cổng 3002; chưa có bằng chứng xác định vì sao tiến trình dừng. Log đã xác nhận 19 bài / 38 ID, nhưng phiên bản cũ chỉ giữ ID trong bộ nhớ cho đến bước playlist.

## Thay đổi

- Lưu checkpoint riêng cho cả lượt tạo trong `storage/music-creation-checkpoints/`, bằng file tạm và đổi tên nguyên tử. Ghi trước khi bấm Create, ngay khi nhận ID, sau khi xác nhận âm thanh complete, và khi playlist đã đủ thành viên.
- Khóa lượt tạo ngay trước thao tác bất đồng bộ đầu tiên để hai request không chạy đồng thời.
- Khóa phục hồi dựa trên toàn bộ lời/tên bài, style, Inspo, settings và chế độ test. Không phụ thuộc hậu tố ngẫu nhiên của tên playlist; vẫn dùng tên playlist đầu tiên.
- Bấm lại cùng dữ liệu sẽ đọc file, bỏ qua bài có ID đã nhận, kiểm tra lại trạng thái âm thanh, chỉ tạo phần còn thiếu. Playlist lỗi sẽ dùng lại tất cả ID. Lượt đã hoàn tất trả lại kết quả đã lưu.
- Nếu tiến trình ngắt sau khi bấm Create nhưng chưa lưu được đủ ID, giữ trạng thái chưa xác định và dừng để đối chiếu, không tự bấm Create lần hai. ID nhận được một phần vẫn được lưu.
- Checkpoint hỏng hoặc không đọc được sẽ báo lỗi; không âm thầm khởi tạo lại.
- Stream tiến độ và heartbeat về giao diện. Nhật ký hoạt động ghi số bài có ID, số bản, số bài hoàn tất âm thanh, bước playlist. Mất kết nối giữa luồng vẫn giữ checkpoint server và các ID giao diện đã nhận.
- Giữ tương thích pending playlist của phiên bản cũ; pending của luồng tạo mới tiếp tục gửi toàn bộ kế hoạch để server xác định đúng phần còn thiếu.

## Khôi phục dữ liệu cũ

Đã đọc Chrome thật, thu thập đủ 38 ID theo tên bài 1–19, đồng thời lưu toàn bộ 25 tên/lời đang hiển thị làm điều kiện đối chiếu. File `recovered-suno-create-1793174860645.json` chỉ được nhập khi toàn bộ kế hoạch trùng khớp, và được ràng buộc với khóa checkpoint sau lần nhập đầu.

## Kiểm thử

- `npm run test:suno-recovery`: khởi động lại ở 19/25; đúng 6 bài còn thiếu được gửi, retry playlist không gửi lại bài, kết quả hoàn tất được dùng lại, chặn lượt chưa rõ kết quả, giữ ID một phần, chặn checkpoint hỏng, đối chiếu kế hoạch legacy, stream lỗi/chia chunk/ngắt kết nối và ghi Nhật ký hoạt động.
- `npm run test:suno-style`: đạt sau khi giữ đúng chuỗi cấu hình của luồng mới.
- `npx tsx scripts/verify-music-playlist-upload.ts`: đạt, 50 thành viên và phục hồi playlist không trùng.
- `npx tsc --noEmit`: đạt.
- Bộ `npm run test:activity` tổng thể bị lỗi ở fixture Motion do VM không có biến `crypto` (`verify-workflow-activity.ts:154`); phần ghi hoạt động Suno mới đã được kiểm tra riêng trong `test:suno-recovery` và Chrome thật.

## Kiểm tra Chrome thật

Run `suno-create-1793176410744`, bấm Tạo Suno trong ứng dụng:

- 15:33:30: khôi phục đúng 19/25 bài, 38 bản; Nhật ký hoạt động hiển thị tiến độ đã lưu.
- Chỉ gửi bài 20–25. Không gửi lại bài 1–19.
- 15:35:51: đã lưu đủ 25/25 bài, 50 ID; tiếp tục đợi trạng thái âm thanh trước khi thêm playlist.
- 15:36:40: đã xác nhận âm thanh complete của toàn bộ 25 bài.
- 15:39:02: chủ động khởi động lại backend ở bước playlist để thử độ bền của checkpoint. Giao diện báo mất kết nối kèm hướng dẫn tiếp tục, 50 ID vẫn còn trên đĩa.
- 15:40:22: chạy lại, dùng cùng checkpoint và playlist `f137b446-ec43-4bf5-955e-719724085bbb`, không gửi thêm prompt tạo nhạc.

## Sửa thao tác playlist theo phản hồi người dùng

Đã dừng luồng thêm từng bài khi người dùng chỉ ra chức năng tích chọn nhiều bài của Suno.

- Quan sát trực tiếp Chrome: hàng có `data-testid="clip-row"`; nút Select clip đổi thành Deselect clip khi được chọn. Menu More options trên hàng đã chọn có thao tác Add to Playlist áp dụng cho nhóm.
- Luồng mặc định chuyển sang chọn đúng ID trong danh sách Create, mở Add to Playlist một lần cho nhóm, rồi kiểm tra thành viên thực tế. Không thử API mutation 401 trước thao tác UI và không duyệt trang chi tiết từng bài.
- Cuộn qua hàng ảo và xác minh lại trạng thái chọn trước khi thêm. Nếu các ID nằm ở nhiều trang, xử lý một nhóm cho mỗi trang Suno. Không tích tất cả khi có bài ngoài lượt hiện tại.
- Tạo playlist mới cũng dùng nhóm đang chọn. Retry chỉ chọn ID còn thiếu và dùng lại playlist cũ.
- Nhật ký hoạt động ghi số bản được chọn để thêm cùng lượt.
- `verify-music-playlist-upload.ts` đã kiểm tra danh sách ảo/phân trang: trang đầu 39 bài yêu cầu + 1 bài ngoài, trang sau 11 bài; lỗi thêm vẫn giữ playlist ID, retry thêm 11 bài trong một lần; xóa 10 thành viên rồi retry chỉ chọn đúng 10 bài còn thiếu.
- Chrome thật cho thấy danh sách tiếp tục tải thêm bài cũ khi cuộn. Đã thêm dừng ngay khi đủ ID, và dừng lượt xác minh khi đủ trạng thái chọn. `verify-suno-bulk-scroll.ts` kiểm tra 50 ID yêu cầu trước 500 bài cũ: vẫn chọn đủ 50 trong một nhóm và không cuộn xuống phần 500 bài cũ.

## Kết quả thật cuối cùng

Run `suno-create-1793178024321`:

- 16:00:42: playlist đã có 17/50 bản, xác định đúng 33 bản còn thiếu.
- 16:01:15: `suno_playlist_bulk_selected`, chọn đủ 33 ID trong một nhóm.
- 16:01:16: `suno_playlist_bulk_added_ui`, thêm 33 bản bằng một thao tác chọn playlist.
- 16:01:17: xác minh đủ 50/50 thành viên.
- 16:01:18: lưu checkpoint hoàn tất gồm 25 bài / 50 ID và link playlist. Không có prompt tạo nhạc mới trong lượt này.
- Playlist: https://suno.com/playlist/f137b446-ec43-4bf5-955e-719724085bbb
- Bằng chứng Nhật ký hoạt động: `storage/logs/suno-bulk-playlist-success-2026-10-28.png`.

Sau khi đã lưu thành công, Chrome đóng nhưng không trả lời lệnh CDP Browser.close, khiến request chưa kết thúc. Đã giới hạn bước đóng Chrome tối đa 5 giây và ngắt kết nối Playwright tối đa 2 giây. Kiểm thử có trường hợp lệnh đóng không bao giờ trả lời, vẫn trả kết quả trong giới hạn; lỗi browser đã đóng cũng không làm mất kết quả. Backend khởi động lại đọc checkpoint hoàn tất và trả lại playlist, không mở lượt tạo nhạc khác.

16:04:48, run `suno-create-1793178288470`: bấm Tạo Suno sau khởi động lại trả kết quả đã lưu trong 13 ms theo log controller. Giao diện ghi “Đã tạo nhạc trên Suno”, nút Tạo Suno trở lại sẵn sàng; không có bước connect Chrome hoặc generate trong run này. TypeScript, kiểm thử phục hồi/đóng Chrome, chọn nhóm trong danh sách dài, chọn nhóm phân trang/playlist và cấu hình Suno đều đạt.
