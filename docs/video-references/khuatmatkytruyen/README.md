# Kho ảnh tham khảo 22 video

Mở [thư viện](index.html), chọn video rồi bấm bảng để phóng lớn. Mỗi bảng ghép tối đa 16 ảnh theo lưới 4×4, có số ảnh và thời gian nguồn. Mở phần “Mở mốc thời gian nguồn” dưới bảng để đối chiếu trên YouTube.

Mỗi video có bảng JPEG trong `boards/`, chỉ mục `index.json` và bảng tổng quan `overview.jpg`. Trong chỉ mục, mỗi ảnh có `board` và `tile` chỉ vị trí của nó trong bảng, cùng `source_archive_entry` để tìm lại ảnh rời trong ZIP dự phòng. `packing-report.json` ghi số bảng và số ảnh được ánh xạ.

Ảnh rời và bản thư viện trước khi gom được lưu tại `scratch/rollback-talk-chair-20261022/reference-originals.zip`, đã kiểm tra CRC trước khi bỏ ảnh rời khỏi thư mục tra cứu. Hai gói ảnh gốc trong `motion-engine/style-refs` và tài nguyên đang cài không bị đổi.

Ảnh JPEG/PNG của thư viện là dữ liệu tham khảo sinh tự động, được giữ trên máy và loại khỏi danh sách Changes bằng `.gitignore`. Các tên ảnh rời cũ như `00070.jpg` không còn là đường dẫn để mở sau khi gom bảng. Nếu trình soạn thảo còn hiện danh sách cũ, làm mới Source Control rồi mở `index.html` hoặc ảnh trong `boards/`. Dữ liệu gốc vẫn nằm trong ZIP dự phòng; không cần khôi phục hàng nghìn ảnh rời để tra cứu.

## Phạm vi thực tế ngày 22/10/2026

- 20 video: giải mã toàn thời lượng, dò thay đổi hình tại 2 mẫu/giây, giữ thêm mốc kiểm tra cách nhau tối đa 20 giây. Ảnh giữ độ phân giải nguồn tải tối đa 480p.
- Video 09 và 16: nguồn video lỗi kết nối sau nhiều lần thử. Dùng storyboard YouTube 320×180, lấy mẫu lần lượt 10 và 5 giây. Mốc thời gian storyboard dùng để tham chiếu xấp xỉ.
- Ảnh được trích tự động; số ảnh không phải số cảnh riêng biệt. Cả hai phương pháp đều có thể bỏ sót cảnh ngắn hoặc giữ nhiều ảnh của cùng một cảnh.
- Đã xem bảng tổng quan 36 ảnh phân bố theo thời gian của từng video, cùng toàn bộ 90 ảnh của hai gói có sẵn. Chưa đánh giá thủ công từng ảnh trong kho, chưa nghe toàn bộ lời kể hoặc kiểm hết chuyển động.
- `audit.json` lưu kết quả kiểm tra ảnh/bảng và khoảng cách thời gian. `capture-status.json` phân biệt video giải mã trực tiếp và storyboard dự phòng. Mọi ảnh nguồn đã được kiểm tra giải mã trước khi gom bảng.

Ảnh nguồn chỉ để đối chiếu cách dựng. Không đưa hình gốc của kênh vào tài nguyên dùng để xuất video.

## Quan sát trên bảng tổng quan

| Video | Ví dụ bố cục và hành động thấy được |
|---|---|
| 01 — Chiếc khăn Piêu | Người đứng/người nằm; người sau bàn lễ; người nghe ở tiền cảnh; đồ vật cận riêng |
| 02 — Người con anh hùng | Người nằm đơn giản trên ván/võng; hai người khiêng; bàn và nến; có ảnh thật/chữ ở cuối |
| 03 — Cuốn sổ nợ | Người bán sau quầy, hàng trên kệ; người trên giường; sổ và hình nhân cận riêng |
| 04 — Ván bài định mệnh P2 | Chùa, bàn, giường; em bé nằm trong nôi riêng |
| 05 — Ván bài định mệnh P1 | Thuyền, sân và nhà dùng lại; bàn cờ cận riêng |
| 06 — Ác Giả Ác Báo | Người cạnh giường, đồ trên gối; hình nhân và sách cận riêng |
| 07 — Người mới, trọ cũ | Phòng trọ, giường, điện thoại, gương; nhóm quanh bàn |
| 08 — Tình mẹ | Mẹ và em bé; cầu, bờ sông; bát và em bé cận riêng |
| 09 — Én ơi, anh về rồi | Người trên cầu thang/sàn nhà cao, người ở dưới; người nằm và nhóm ngồi cạnh lửa |
| 10 — Chén cơm đất | Người bên bụi tre, đèn; thân xoay nằm; bát, thìa và khói cận riêng |
| 11 — Trả nợ | Tiệm dùng lại, bàn lễ giữa nhà; dép, điện thoại và giấy cận riêng |
| 12 — Anh Hai ơi, em xin lỗi | Heo ngoài chuồng, người cạnh heo; người/thuyền; tay và đồng tiền cận riêng |
| 13 — Thần trùng | Người sau màn/cửa; tay giơ đơn giản; chum, quan tài và huyệt mộ riêng |
| 14 — Con nhớ nhà lắm | Người ở cầu ván, thuyền và dưới nước; vật trôi; đầu chìm dưới mặt nước |
| 15 — Kẻ dẫn lối không đường về | Người cạnh hổ; người trên lưng hổ được minh họa bằng hình đơn giản; dấu chân cận riêng |
| 16 — Đứa con oan nghiệt | Bồng em bé ngang người; nhóm quanh đồ lễ; bàn tay, giấy và mộ cận riêng |
| 17 — Tình duyên muôn kiếp | Người nằm trên giường, người cạnh giường; bệnh viện; sách, điện thoại và nhiệt kế |
| 18 — Ma cà rồng Tây Bắc | Nhà sàn, thang; người trong lớp; người khuất sau cửa; tay, đũa và áo cận riêng |
| 19 — Đêm không ngủ | Người nằm trên ván, những người khác đứng cạnh; khung cửa, gương và nến; tư thế tay trước người |
| 20 — Bùa chú An Giang | Người sau bàn lễ; hũ, nồi và bếp; nhóm người cùng cảnh; dao và bùa cận riêng |
| 21 — Chú thuật phản phệ | Người hai phía đồ vật; bát trên mặt sàn/bàn; ghế và bàn thờ; cân, bát cận riêng |
| 22 — Chuyến đi làm thuê trên bản | Người trong nhà sàn, cửa và thang; bát và lễ vật trên mặt phẳng; người nằm dưới chăn |

Các quan sát này để tìm cảnh tương tự, không phải danh mục tài nguyên đã được tạo hoặc chứng minh cảnh trong tool đã đúng. Tên chính xác và nguồn nằm trong `videos.json`.

## Cách dùng cho Video Motion

1. Xác định người nào làm gì, ở đâu so với người và đồ vật khác trong câu kể.
2. Chọn gói phong cách, bối cảnh và ảnh tham chiếu có quan hệ tương ứng.
3. Giữ nhận diện vai, vị trí trái/phải, trước/sau và đồ vật giữa các câu cùng nơi.
4. Dùng dáng đứng/ngồi/nằm, xoay thân và cử chỉ tay đơn giản. Cần nhấn đồ vật thì dùng ảnh cận riêng.
5. Kiểm ảnh đầu ra: đúng vai, đúng vật, đúng mặt tựa, đúng lớp che và không chồng hình vô lý.

Kho hiện có nhiều ảnh không bảo đảm bước AI đang nhận đúng ảnh theo bố cục. Xem [báo cáo hai gói](../../motion-existing-reference-review-2026-10-22.md) về bộ chọn ảnh trong code.
