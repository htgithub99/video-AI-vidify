# Kiểm tra Suno bằng Chrome thật — 28/10/2026

## Giao diện quan sát được

- Workspace `musicaivietnam`, màn Songs / Advanced, model đang chọn v6.
- Lyrics dùng Lexical editor (`role=textbox`, `aria-label="Lyrics editor"`). Styles vẫn nằm trong `data-testid="create-form-styles-wrapper"`; placeholder thay đổi theo gợi ý.
- Nút tạo có `aria-label="Create song"`. Dùng nhãn này và fallback đúng chữ Create để tránh bắt nhầm Create playlist.
- Inspo vẫn mở bằng `Add inspiration from a playlist`; chọn Liana Eli đã hiện đủ bốn track tham khảo. Audio Influence xuất hiện sau khi áp dụng Inspo.
- Male/Female là nút toggle: bấm nút đang chọn sẽ bỏ chọn; cả hai bỏ chọn tương ứng Auto. Đã sửa để áp dụng lặp lại không bật/tắt ngoài ý muốn, đợi trạng thái cập nhật và xóa lựa chọn cũ khi dùng Auto. Dùng tên chính xác để Male không khớp Female.
- Trang chi tiết có nút `title="Add to Playlist"`. Hộp `role=dialog`, tên Add to Playlist, placeholder `Playlist name`, nút `Create playlist`.
- Nội dung trang bài xuất hiện trước các điều khiển tài khoản. Đã thêm chờ nút Profile menu và request xác thực, kiểm tra hộp sau mỗi lần bấm, thử lại có giới hạn khi hộp chưa mở. Không bấm lại khi hộp đã mở.
- Dùng chung cách đọc ID clip thật từ hàng playlist cho xác minh và tải nhạc; không lấy nhầm ID hàng chứa clip.
- Gỡ nhãn v3.5 cố định trên giao diện ứng dụng; hiển thị Suno vì model được chọn ở Suno.

## Lần tạo nhạc thật đầu tiên

Bấm Test Suno trong ứng dụng `http://localhost:3002/`, dùng cùng flow backend với tạo nhạc và giới hạn một bài đã có để kiểm tra.

Run `suno-create-1793161945888`:

- Đã áp dụng style, Inspo Liana Eli, Weirdness 45, Style Influence 75, Audio Influence 60, Variety 0, exclude styles, Duration Auto, Max Mode Off, Personalize Off, Vocal Gender.
- Suno trả về hai bản 1. Curtain Gap, tạo xong và có thời lượng khoảng 3:14 / 3:17.
- ID: `5d338ec0-f16a-4593-a505-6ffdf1643da6`, `8a98c3a3-1656-4d16-a75c-a14937790998`.
- Lần đầu lỗi chờ hộp playlist sau khi bấm +. Đã lưu trạng thái để tiếp tục cùng hai ID, không tạo lại nhạc.

## Kiểm thử cục bộ

- `npx tsc --noEmit`.
- `npm run test:suno-style`: điều khiển hiện/ẩn, Lyrics, Styles, Inspo, slider; gender lặp lại, đổi Male/Female, trả về Auto; fixture đặt Female trước Male để bắt lỗi khớp chuỗi con.
- `npm run test:music-transfer`: hộp playlist v6, bấm lần đầu chưa mở rồi phục hồi, hộp đã mở không bấm lại, 50 thành viên, checkpoint/resume, không tạo playlist hay thành viên trùng, 10 MP3 mỗi batch và kiểm tra upload.

## Tiếp tục playlist thật: đã thành công

- Run `suno-create-1793163581646` đã tạo playlist `d6d584ab-7bc6-43d2-bfc7-f84d70d5de52`. Suno chỉ thêm bản đầu khi tạo playlist. API thêm bản thứ hai trả HTTP 401.
- Đã bổ sung đường khôi phục qua giao diện đang đăng nhập khi API mutation trả 401/403; chọn đúng tên playlist đã checkpoint, không tạo playlist khác. Sau đó vẫn xác minh thành viên qua API đọc.
- Run `suno-create-1793163832000` bắt đầu với `songCount=0`, `recoveredCount=2`. Tự thêm bản còn thiếu bằng hộp Add to Playlist lúc 12:04:35 giờ Việt Nam; xác minh đủ 2/2 lúc 12:04:36; trả thành công lúc 12:04:39.
- Playlist: https://suno.com/playlist/d6d584ab-7bc6-43d2-bfc7-f84d70d5de52
- Fixture cục bộ cũng kiểm tra đường API 401 → UI → đủ thành viên, không tạo playlist thứ hai.

## Khởi động giao diện

Sau khởi động lại, request module chính trả được 200 nhưng khi tải đầy đủ giao diện thì backend kẹt. Giới hạn quét Tailwind về `src/` và `index.html` đã khôi phục được HTTP và Chrome tải lại ứng dụng. Thay đổi chỉ ở ba dòng khai báo nguồn đầu `src/index.css`; giữ nguyên các thay đổi CSS có sẵn khác. Cú pháp theo tài liệu chính thức: https://tailwindcss.com/docs/detecting-classes-in-source-files

## Kiểm tra lại từ đầu

Run `suno-create-1793165098196` dừng trước tạo bài (`createdCount=0`) vì selector CSS exact-text không khớp nút gender có span lồng nhau. Đã chuyển sang `getByRole` với tên chính xác, bổ sung span lồng nhau trong fixture. Đây là lý do cần kiểm thử thật ngoài fixture.

## Kết quả cuối: tạo mới từ đầu đã thành công

Run `suno-create-1793165326468`, bấm Test Suno trong Chrome thật:

- 12:28:46: bắt đầu với `songCount=1`, `recoveredCount=0`.
- 12:30:35: qua toàn bộ cấu hình, bắt đầu tạo nhạc.
- 12:30:37: nhận đủ hai ID mới `27bb8579-5f7e-4562-8f6a-ae8e259dc8ea`, `d126b242-93a8-4b09-8b22-773f62df3195`.
- 12:30:56: hai bản đã hoàn tất xử lý; chuyển bước playlist.
- 12:31:28: tự thêm bản còn thiếu qua UI sau API 401.
- 12:31:29: xác minh đủ 2/2; 12:31:30: trả thành công.
- Playlist `TEST - CURTAIN GAP-1DB1E0A31123`: https://suno.com/playlist/05e04a21-af5c-4764-8315-fd9637493812
- Đã mở playlist trong Chrome để xác nhận trực quan: hiển thị 2 songs, hai bản V6 dài 3:15 / 3:10. Ảnh: `storage/logs/suno-live-success-2026-10-28.png`.

Đây là lượt một bài / hai bản để kiểm tra trọn backend tạo nhạc; chưa chạy mới toàn bộ 25 bài trong lần kiểm tra này. Phần upload vẫn giữ 10 MP3 mỗi lượt và phần sáng tác lời vẫn giữ 3 bài mỗi room, 3 room cùng lúc.
