# Chuẩn chất lượng Remotion theo video mẫu — 27/10/2026

## Mục tiêu và phạm vi

[ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY](https://www.youtube.com/watch?v=a6oQO7GqGwo&t=385s) là mốc đối chiếu cho kiểu hình Truyện ma của chế độ Remotion. Các kiểu Lịch sử/Giải thích dùng cùng nguyên tắc bố cục, nhịp cảnh và cấu hình; giữ đặc trưng tạo hình của từng kiểu.

Đã xem các ảnh khoảng 3:00, 4:29, 6:24–6:25 và phát đoạn 6:26–7:00 với các lần quan sát khung hình. Phần phát cho thấy thay đổi góc nhìn trong cùng phòng và chuyển sang hình cận. Chưa đo chuyển động liên tục từng frame hoặc phân tích hết 14:58; không suy diễn mọi người/đồ vật trong mẫu đều chuyển động.

## Điều cần học từ mẫu

| Thành phần | Yêu cầu cho tool |
| --- | --- |
| Tạo hình | Người thon, mặt xám sáng, tóc/áo nhận ra được, nét viền tối và mảng màu lì. Ma giữ hình người, sắc trắng đúng lời, không thành linh vật dễ thương. |
| Không gian | Có sàn/tường/phối cảnh rõ; cùng một nhà giữ kiến trúc và vật chính khi đổi góc/cỡ hình. |
| Quan hệ | Người nằm sát quan tài thì vị trí người/chiếu/quan tài phải thể hiện quan hệ đó. Vật cầm nhỏ vừa tay, đồ trên bàn có điểm tựa, cửa/khung cửa gắn vào kiến trúc. |
| Nhịp hình | Thiết lập toàn cảnh rồi đổi hình cận khi lời chuyển sang người/vật/manh mối. Gộp câu chung sự kiện; không thay nhà liên tục hoặc giữ mãi hình đã hết liên quan. |
| Chuyển động | Có thể giữ tư thế minh họa đơn giản. Khói/lửa/mưa cần lớp động đúng nguồn khi bật; góc nhìn di chuyển chậm khi bật camera. Không rung/lắc hoặc thêm động tác phức tạp vào mọi câu. |
| Ánh sáng | Đêm xám xanh/trầm, người và manh mối vẫn đọc được; không phủ đen mọi cảnh hoặc đổi áo trắng thành màu khác. |
| Cấu hình | Giữ tư thế chỉ khóa nhân vật. Tắt hiệu ứng cảnh không tắt âm thanh; tắt camera không tắt khói/mưa. Phụ đề giữ yêu cầu riêng của sản phẩm, không sao chép LIVE/giờ/logo mẫu. |

## Khoảng cách hiện tại, có bằng chứng

[Audit Mâm Cúng Bên Bến Sông](video-references/mam-cung-ben-ben-song-audit-20261027/README.md) đã xem đủ 18 ảnh đại diện và so ảnh cùng cảnh theo thời gian. Còn lỗi mâm/chén quá lớn, chân đặt lên giường sai, cửa/khung cửa rời kiến trúc, vệt gạo dựng đứng, ma quá nhỏ và khói đứng yên. Có 16 background keys cho 2 nơi. Đây là lỗi bố trí/lưu trạng thái/tách lớp, không thể giải quyết bằng chỉ tăng zoom.

Hai nguyên nhân áp dụng bản sửa cũng đã được xác định: backend cũ vẫn chạy và phân cảnh cũ thiếu phiên bản contract riêng. Cả 18 đoạn cũ khớp hash trước sửa, nên chỉ restart backend không đủ.

## Đã sửa bổ sung trong lượt này

1. Thêm `SCENE_REVISION` riêng vào khóa phân cảnh và checkpoint mới. Đọc checkpoint cũ làm nguồn phục hồi khi chưa có bản mới; giữ các hình đã có. Chỉ ghi `sceneRevision` khi nhận phân cảnh qua contract; resolve geometry không tự ghi dấu này.
2. Khi dựng lại, đoạn cũ/chưa đúng revision được lập lại kế hoạch theo nguồn. Bỏ thiết kế location đã lưu khi không có phân cảnh hiện hành nào bảo chứng; cùng nơi được dựng theo một thiết kế kiến trúc mới thống nhất.
3. Khi tiếp tục production có phân cảnh lỗi thời, bỏ dấu hoàn tất bước hình/xuất và compiled/result xuất cũ trong snapshot đang làm. Giữ kịch bản, voice, SEO. File video đã xuất vẫn còn nguyên trên đĩa. Compiler cũng kiểm contract trước xuất, không chỉ kiểm hash văn bản.
4. Sửa camera đang dùng thời gian toàn video nên chạm trần sau 24 giây đầu: dùng thời gian từng shot, kéo chuyển động suốt shot dài, giữ tốc độ/cường độ nhỏ và bảo vệ chủ thể sát mép. Các đoạn liền nhau cùng nơi/cỡ hình/focus dùng chung đồng hồ để không reset zoom ở mỗi beat. Camera cố định vẫn không zoom.
5. Bổ sung `view=wide/detail` và `focus=[node IDs]` vào hợp đồng chọn góc hình. Hình cận lấy người/vật được lời nhấn mạnh làm tâm, không bị mọi người/đồ trang trí kéo khung ra xa. ID focus không hợp lệ được bỏ qua, không thêm một QA chặn sản xuất.
6. Prompt mô tả các shot minh họa nhiều lớp, giữ tư thế đơn giản; tách phần động môi trường/camera khỏi tư thế. Không yêu cầu AI viết hoạt ảnh hay diễn chi tiết từng động từ.

## Công việc và nghiệm thu còn lại

| Mức | Việc | Bằng chứng cần có |
| --- | --- | --- |
| Đã nạp | Nạp backend mới | Backend PID 1944 khởi động 16:08:34 ngày 27/10/2026, nghe cổng 3002, HTTP 200; cần kiểm manifest của lượt sản xuất kế tiếp. |
| P0 | Kiểm artwork/mapping sau replan | Xem đủ các cảnh thực: đúng người, màu, số lượng, chủ sở hữu, điểm tựa, mount, tỷ lệ, nguồn khói. Không coi render thành công là hình đã đạt. |
| P0 | Kiểm kiến trúc/cắt cảnh theo lời | Cùng nơi dùng kiến trúc ổn định; cỡ hình đổi để nhấn manh mối, không đổi vật/nhà ngẫu nhiên. |
| P1 | Đối chiếu chuyển động thật | So đầu/giữa/cuối cảnh có khói/lửa/mưa; đúng nguồn/vùng và có thay đổi khi bật, đứng yên đúng cấu hình khi tắt. Camera chậm, không giật. |
| P1 | Đối chiếu tạo hình mẫu | Bảng ảnh cùng loại cảnh: tang lễ, người nằm, người cạnh cửa, hình cận ma/vật. Sửa profile/asset theo lỗi quan sát, không tăng vòng QA phong cách chung chung. |
| P1 | Nghe hình–tiếng cùng nhau | Lời tới manh mối thì hình thể hiện đúng; voice vẫn theo mẫu Thần trùng, không thay voice hoặc tốc độ trong lượt sửa hình này. |

Không đặt tiêu chí phải diễn chính xác động tác mở cửa/chạy/quỳ nếu đứng đúng vị trí vẫn kể được câu chuyện. Không áp dụng sửa riêng cho tên truyện/người/vật. Các bước khác của plan gốc tiếp tục theo [plan bố cục và cấu hình](motion-remotion-layout-settings-root-fix-plan-2026-10-27.md).

## Kiểm chứng kỹ thuật

Đã đạt: TypeScript, bộ test Remotion (integration/QA/cutouts), behavior và production runner giả lập; Prettier width 400 và diff check cho phần sửa. Hồi quy ngoại tuyến kiểm 18 đoạn của production đã lưu không bị coi là contract hiện hành; migration bằng AI giả lập lập lại đoạn cũ, giữ artwork/voice và không hỏi lại khi tiếp tục. Production runner giả lập kiểm dựng/xuất lại nhưng không chạy lại phân tích, kịch bản hoặc voice. Camera kiểm cảnh bắt đầu ở giây 120, với 24/30/60 fps, cùng trường hợp tắt, chủ thể sát mép và nối hai đoạn cùng góc hình.

Backend được nạp lại sau khi xác nhận cả 9 production lưu đang completed/cancelled/error, không có lượt chạy bị ngắt. Manifest compiled và kết quả xuất mới có thêm sceneRevision để truy phiên bản. Startup báo chưa kết nối browser sinh ảnh ở cổng debug mặc định; server vẫn phục vụ HTTP 200. Không mở room/gửi prompt để kiểm đăng nhập AI trong lượt này.

Không gọi AI/TTS thật, không tạo/resume video sản xuất trong lượt này. Kiểm kỹ thuật chưa chứng minh hình AI mới đã đạt chất lượng mẫu. Chuẩn này chỉ được nghiệm thu hình thức khi có kết quả thực để xem và nghe.
