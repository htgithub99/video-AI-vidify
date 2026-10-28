# Sửa playlist Suno và upload Gemini — 28/10/2026

## Phạm vi đã triển khai

- Giữ nguyên **5 cặp bài = 10 MP3 mỗi lượt đánh giá**, giữ toàn bộ thời lượng. Phần sáng tác vẫn dùng 3 bài/room và 3 room đồng thời.
- Tạo playlist bằng nút `Add to Playlist` của bài hát. Không chọn nhầm menu bình luận.
- Lưu ID playlist ngay sau khi tạo; khi thử lại chỉ thêm ID bài còn thiếu. Đọc lại thành viên playlist và chỉ báo thành công khi đủ bài.
- Lưu danh sách bài và tên playlist đang chờ vào trạng thái giao diện để tải lại trang vẫn tiếp tục được.
- Upload đường dẫn cục bộ bằng CDP, hỗ trợ input nằm trong composer và input tạm do file chooser tạo. Menu chọn file dùng hàng đợi ngắn; tối đa năm room upload và đánh giá đồng thời trong một browser context. Mở các phòng ngay khi bắt đầu từng lượt năm nhóm, song song với chuẩn bị MP3. Giải phóng lượt chọn tệp ngay sau khi đính kèm, không chờ upload mạng của room khác.
- Giữ nguyên file đã đính kèm đúng khi thử lại. Xóa thẻ lỗi trước khi đính kèm lại; đối chiếu tên một lần cho từng file, hỗ trợ Gemini không hiện đuôi audio.
- Lỗi quota/dung lượng/định dạng/đăng nhập/xác minh hoặc HTTP 4xx được dừng; lỗi tạm thời có khoảng chờ tăng dần; hủy tác vụ dừng thử lại.
- Chuẩn bị tối đa hai file âm thanh đồng thời. MP3 cache dùng được ngay khi chưa có WAV. Mỗi nhóm bắt đầu đánh giá sau khi chuẩn bị xong, không chờ toàn bộ playlist.
- Log upload có HTTP status, host, tình trạng chờ/lỗi, thông báo nhà cung cấp và phương thức đính kèm; không lưu token hoặc query URL.
- Stream tiến độ vào **Nhật ký hoạt động → Sáng tác nhạc**: room, lần thử, số tệp nhận/sẵn sàng/đang xử lý/lỗi, thời gian, xác nhận tin nhắn đã gửi và kết quả đánh giá. Lỗi đánh giá có trạng thái riêng với lỗi upload.
- Đọc tên đầy đủ từ tooltip `aria-describedby`, vì tên trên chip bị rút gọn và nút xóa chỉ hiện khi hover. Chỉ xác nhận upload khi đủ số lượng/tên, từng chip có tín hiệu sẵn sàng, không busy/lỗi/request upload đang chờ. Sau gửi phải thấy tin nhắn mới chứa đúng đủ tệp; nếu chưa xác nhận thì dừng để tránh gửi trùng.
- Chờ menu upload render, tái sử dụng menu đã mở và đóng menu bằng Escape theo từng tab. Khi thử lại chỉ xóa tệp lỗi/sai, giữ tệp đúng và thêm tệp thiếu.

## Định dạng âm thanh

Nguồn tải về vẫn là WAV gốc từ dịch vụ tải Suno. Gemini nhận MP3 96 kbps đủ thời lượng. Xuất WAV dùng bản gốc; xuất MP3 chuyển từ WAV với cấu hình xuất hiện có. MP3 đánh giá không thay thế WAV khi xuất.

## Kiểm tra đã đạt

- `npx tsc --noEmit --pretty false`.
- `npm run test:music-transfer`: playlist 50 bài, tiếp tục sau lỗi thêm bài, không tạo playlist thứ hai, chỉ thêm 49 bài thiếu; đúng 10 đường dẫn MP3 Unicode; input đúng loại; input tạm/isolated world; tên audio không có đuôi; từ chối sai tên/trùng tên; giải phóng file chooser; lỗi tạm thời/lỗi cần dừng; hủy tác vụ; log đã làm sạch.
- `scripts/verify-music-audio-preparation.ts` chạy đoạn điều phối thật của controller: cache MP3 không có WAV, giới hạn hai file trên các lời gọi đồng thời, xuất vẫn lấy WAV, hủy, và đánh giá nhóm đầu trước khi nhóm sau chuẩn bị xong.
- `scripts/verify-chat-upload-readiness.ts`: hồi quy ChatGPT/Gemini, ảnh, số lượng/tên file, thẻ lỗi, mạng chờ/lỗi và nút gửi.
- `scripts/verify-music-planning-ui.ts`: lỗi playlist → lưu trạng thái → reload → thử lại cùng tên và ID bài với `songs: []`; xóa trạng thái chờ sau thành công.
- `scripts/verify-music-planning-recovery.ts`: sáng tác 3 bài/room, 3 room; khôi phục và hủy.
- `scripts/verify-music-download-resume.ts`: tiếp tục tải và xuất WAV/MP3 từ bản WAV lưu sẵn.
- `scripts/verify-gemini-music-upload.ts`: menu render chậm, tên tooltip đầy đủ với nút xóa ẩn, năm lượt upload chồng thời gian, từ chối trạng thái chưa rõ, giữ chín tệp tốt và tải lại một tệp lỗi, xác nhận đúng tin nhắn mới kèm mười tệp.
- `scripts/verify-music-upload-progress.ts`: stream HTTP thực → parser → kho Nhật ký hoạt động; tiến độ 8/10 và 10/10, lỗi, làm sạch thông tin và tương thích JSON.

Các kiểm tra tự động trên dùng fixture cục bộ, không tạo bài Suno hoặc gửi prompt AI thật.

## Giới hạn xác nhận trực tiếp

`npx tsx scripts/check-music-upload-live.ts --live` chỉ mở tab thử nghiệm riêng, đính kèm 10 MP3 cache và không gửi prompt. Tab riêng được đóng sau kiểm tra.

- Lần đầu bị Google chuyển sang trang xác minh người dùng.
- Một lần đã đính kèm được 10 MP3 và Gemini bật nút gửi; readiness cũ vẫn hết hạn (đủ 10 thẻ, không busy, không báo lỗi, mạng không pending). Đã bổ sung nhận diện tên audio không hiện phần đuôi và ca kiểm tra tương ứng.
- Kiểm tra đường file chooser cũng phát hiện cần xử lý input tạm và thời điểm bắt đầu timeout chờ chooser; đã sửa và kiểm tra bằng fixture trình duyệt thật.
- Các lần kiểm tra trước gặp timeout điều hướng Gemini 60 giây trước bước upload.

### Kiểm tra Chrome thật sau khi cập nhật log và nhận diện chip

Run `music-track-evaluation-1793169688603`, ngày 28/10/2026, playlist `f76b9e58-ceda-422d-a8bb-710c5d9ef7ef`:

| Room | Xác nhận upload 10/10 (UTC) | Tin nhắn mới kèm đúng 10 tệp (UTC) |
| --- | --- | --- |
| 3 | 06:41:57 | 06:42:10 |
| 1 | 06:42:11 | 06:42:21 |
| 2 | 06:42:15 | 06:42:24 |

Room 3 trả kết quả chọn năm bài lúc 06:42:27; room 4 bắt đầu lúc 06:42:32, sau khi có slot trống. Nhật ký hoạt động hiển thị các trạng thái thật. Ảnh: `storage/logs/music-upload-activity-live-2026-10-28.jpg`.

Lượt này bị hủy trong lúc kiểm tra lúc 06:42:40, chưa xuất hết 25 bài. Lượt tiếp `music-track-evaluation-1793169878353` bị Google chuyển tới xác minh người dùng (`gemini_user_verification_required`). **Đã xác nhận ba room upload/gửi thành công; chưa xác nhận toàn bộ bước xuất file cuối trên dịch vụ thật.** Không tự vượt xác minh Google.

### Điều chỉnh theo yêu cầu giữ tab xác minh

- Khi Google yêu cầu xác minh hoặc đăng nhập, giữ nguyên tab và giữ Chrome khỏi cơ chế tự đóng khi idle. Tạm dừng tác vụ, không reload hoặc thao tác vào CAPTCHA.
- Nhật ký hoạt động → Sáng tác nhạc ghi trạng thái đang chờ xác minh, nhắc lại mỗi 30 giây và ghi trạng thái tiếp tục khi Gemini đã trở lại, ô nhập dùng được.
- Không giới hạn thời gian người dùng xác minh. Thời gian chờ này được loại khỏi timeout upload, kiểm tra tệp trong tin nhắn và đợi phản hồi. Dọn phòng chỉ diễn ra sau khi tác vụ tiếp tục/kết thúc, người dùng hủy hoặc đóng tab.
- `scripts/verify-gemini-session-wait.ts` dùng trang mô phỏng trong Chromium để kiểm tra giữ tab/browser, không chạy thao tác khi đang chờ, tiếp tục sau xác minh, loại thời gian chờ khỏi timeout gửi tệp, hủy và đóng tab. Chưa xác nhận trực tiếp bằng một lần giải CAPTCHA Google thật sau bản sửa này.

### Điều chỉnh số tab đánh giá lên năm

- Theo yêu cầu mới, `EVALUATION_ROOM_CONCURRENCY = 5` dùng chung cho giới hạn phòng đánh giá và upload Gemini. Với 50 MP3 có năm nhóm, mở cả năm tab trước khi chờ chuẩn bị âm thanh; mỗi tab nhận đúng mười MP3. Nếu có nhiều hơn năm nhóm, nhóm tiếp theo nhận slot sau khi phòng trước hoàn tất và đóng.
- Giới hạn chuẩn bị âm thanh vẫn dùng chung hai file để tránh nghẽn xử lý cục bộ. Phòng nào có MP3 sẵn thì bắt đầu upload/đánh giá ngay.
- Kiểm thử đoạn controller thật xác nhận năm phòng mở trước khi nhóm MP3 đầu chuẩn bị xong và cả năm đánh giá đồng thời. Fixture trình duyệt kiểm tra năm upload chồng thời gian. Bằng chứng Chrome thật ở mục trên thuộc phiên bản ba phòng; chưa chạy lại năm phòng trên dịch vụ thật.

Backend chạy từ source tại cổng 3002. Các log khởi động cũ: `storage/logs/backend-music-fix.out.log` và `storage/logs/backend-music-fix.err.log`.
