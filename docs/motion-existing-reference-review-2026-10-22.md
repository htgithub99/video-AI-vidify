# Đối chiếu 90 ảnh gốc của hai gói Video Motion

Đã kiểm tra ngày 22/10/2026: toàn bộ 90 ảnh qua 7 bảng ảnh có tên file và phóng lớn các trường hợp người đứng/người nằm, người sau bàn lễ, người đứng trên ghế, cử chỉ tay và quan tài. Đây là kiểm tra ảnh tĩnh có sẵn, không phải tuyên bố đã xem hết chuyển động hoặc nghe hết lời kể của hai video.

## Nguồn ảnh hiện có

Nguồn hai video theo người dùng xác nhận; đã mở đối chiếu trực tiếp hình của hai video:

| Gói | Nguồn | Thư mục | Số ảnh |
|---|---|---|---:|
| `chibi_folk` | [Chiếc khăn Piêu](https://www.youtube.com/watch?v=ZrgIi8a8dyA&t=1194s) | `motion-engine/style-refs/chibi_folk` | 50 |
| `minimal_mask` | [Thần trùng](https://www.youtube.com/watch?v=-Hb-Tn7OaHo&t=641s) | `motion-engine/style-refs/minimal_mask` | 40 |

50 ảnh chibi gồm: 10 nhân vật, 4 cận cảnh, 7 ngoại cảnh, 6 nội cảnh, 6 bếp, 6 phong cảnh, 6 cảnh đêm, 5 đạo cụ. 40 ảnh mặt nạ gồm: 10 nhân vật, 8 ngoại cảnh, 5 nội cảnh, 4 phong cảnh, 7 cảnh đêm, 6 đạo cụ.

Đã đối chiếu SHA-256: đủ 90 ảnh giống bản đang cài trong `storage/output/motion-video/kit-library/style_pack/<style-id>/refs`. Hai hồ sơ phong cách cũng liệt kê đủ 50 và 40 ảnh. Các ảnh hiện chỉ có tên nhóm và số thứ tự, chưa có thời gian nguồn cho từng file.

Mở [thư viện ảnh](video-references/existing-style-packs/index.html) hoặc các bảng tổng hợp trong `docs/video-references/existing-style-packs` để xem lại.

## Mức minh họa thực tế cần bám

1. **Mặt nạ rất đơn giản.** Đầu tròn, mắt và miệng dạng hình cơ bản; thân một mảng màu; tay nghỉ có thể chỉ là mẩu ngắn. Phần lớn khung trung/cận cắt thân ở mép dưới. Không cần thêm chân, bàn tay hoặc khớp chi tiết để đạt phong cách này.
2. **Chibi có nhận diện riêng nhưng dáng vẫn đơn giản.** Tóc, khăn, áo và màu giúp phân biệt vai. Các ảnh thể hiện một dáng đủ hiểu hành động; không yêu cầu giải phẫu hay mô phỏng cơ thể chính xác.
3. **Tư thế minh họa phải giữ đúng vai.** `chibi_folk/exterior_05.jpg`: một người đứng bên trái, người kia nằm nghiêng bên phải. Có thể minh họa bằng thân xoay; điều cần giữ là ai đứng, ai nằm, cùng mặt đất và không chồng lên nhau vô lý.
4. **Đồ vật có quan hệ rõ với người.** `chibi_folk/interior_03.jpg`: nhân vật ở sau bàn lễ; đồ lễ nằm trên mặt bàn. `prop_04.jpg`: người áo xanh ở trên ghế trước cửa sổ; người còn lại đứng dưới sàn; vật buộc đỏ treo riêng. Không thể chỉ cho các hình cùng xuất hiện rồi coi là đúng vị trí.
5. **Đồ quan trọng có thể được phóng lớn riêng.** `minimal_mask/prop_01.jpg`, `prop_02.jpg`, `prop_03.jpg`, `prop_05.jpg` lần lượt nhấn di ảnh, bát hương, chum và quan tài. Không bắt buộc nhét mọi người và mọi vật vào cùng một khung toàn cảnh.
6. **Thứ tự lớp và góc máy có tác dụng lớn.** Ảnh chibi dùng người nghe lớn ở tiền cảnh, quay lưng, đôi khi mờ; người chính ở xa rõ hơn. Bàn, thành đồ vật hoặc mép khung có thể che phần thân hợp lý.
7. **Bối cảnh được dùng lại.** Cùng căn nhà, vách, cửa, bếp được thể hiện ở nhiều cỡ cảnh và ánh sáng. Không có lý do vẽ mới toàn bộ một nơi chỉ vì thay câu thoại.

Ảnh tĩnh không đủ chứng minh tốc độ chuyển động, nhịp cắt hay nhịp kể. Không suy ra các thông số đó từ bộ ảnh này.

## Hướng áp dụng vào code

Ưu tiên quan hệ bố cục đơn giản: vai A/B; đứng/ngồi/nằm; bên trái/phải; trước/sau; trên mặt bàn/giường; cầm/đội/treo. Dùng ảnh và tài nguyên đúng gói. Giữ nhận diện, tỉ lệ tương đối, chỗ tựa và thứ tự lớp giữa các câu cùng cảnh.

Nếu ảnh hay món ghép đã có đồ tựa nhưng thiếu metadata, bổ sung điểm trên đúng hình hiện có. Nếu thiếu đồ, chọn hoặc tạo món minh họa tương ứng và ghép vào cảnh, rồi lưu dùng lại. `spot` là dữ liệu nội bộ giúp đặt hình; không biến việc thiếu một tên spot thành yêu cầu người dùng tự bổ sung kho.

Không mở rộng thành mô phỏng tiếp xúc bàn tay, bộ giải khớp, chuyển động phức tạp hoặc thêm chi tiết cơ thể ngoài phong cách gốc chỉ để xử lý lỗi bố trí.

## Điểm kiểm tra ở code hiện tại

`stylePack.ts::shippedRefs` chép ảnh từ thư mục mẫu vào kho phong cách. `puppetStyleImages` chọn ảnh theo nhóm và giới hạn số ảnh cho mỗi lần gọi AI. Có ảnh tham khảo đầy đủ trong dự án không đồng nghĩa mỗi phân cảnh đã được đối chiếu với ảnh có bố cục tương tự: bộ chọn hiện lấy ảnh đầu trong nhóm, chưa chọn theo quan hệ người-vật của câu kể.

Vì vậy cần sửa đúng đường đọc quan hệ → chọn/ghép cảnh → đặt hình và kiểm ảnh đầu ra. Tăng số tư thế hoặc tăng chi tiết hình vẽ không tự giải quyết sai người, sai đồ và sai vị trí.

## Kho ảnh mở rộng của 22 video

Đã lưu [trang tra cứu theo video và thời gian](video-references/khuatmatkytruyen/index.html), cùng [phạm vi kiểm tra và quan sát từng video](video-references/khuatmatkytruyen/README.md). Có 13.698 ảnh tách trực tiếp từ 20 video và 352 ảnh storyboard của hai video còn lỗi tải nguồn. Storyboard có độ phân giải 320×180, định kỳ 5–10 giây, có thể bỏ sót cảnh ngắn. Đã xem bảng tổng quan 36 ảnh của từng video; chưa đánh giá thủ công toàn bộ ảnh trong kho.
