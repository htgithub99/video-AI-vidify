# Kiểu hình Truyện ma theo mẫu mới — 27/10/2026

## Nguồn đã xem

[ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY | Truyện Ngắn Kinh Dị](https://www.youtube.com/watch?v=a6oQO7GqGwo&t=385s), kênh Chuyện Ma Đừng Kể. Đã đối chiếu trực tiếp các khung khoảng 3:00, 4:29 và 6:24–6:25; không coi đây là phân tích toàn bộ video.

Ảnh lưu để đối chiếu:

- [Người và bối cảnh 4:29](../scratch/horror-style-reference-20261027/reference-0429.png).
- [Màu đêm và bố cục 6:24](../scratch/horror-style-reference-20261027/reference-0624.png).

## Đặc trưng cần giữ

- Minh họa 2D nét viền tối hơi không đều, mảng màu lì, ít bóng; không dùng chất liệu gỗ bóng/chuyển sắc trang trí như ảnh bàn người dùng gửi.
- Nhân vật mặt xám sáng, mắt/mày/miệng đơn giản; phân biệt tuổi và danh tính bằng mặt, tóc, trang phục. Thân thon, tay chân giản lược; đầu hơi lớn nhưng không phải chibi chân ngắn hay cơ thể tả thực.
- Bối cảnh phủ toàn khung; tường, sàn và đường phối cảnh đơn giản đủ nhận ra không gian và vị trí người/đồ.
- Đêm chủ yếu xám xanh, than, nâu/ô liu/tím trầm. Giữ người và chi tiết chính nhìn được; không phủ đen mọi cảnh ban ngày hay đổi áo trắng sang màu khác.
- Hình minh họa tĩnh thể hiện diễn biến chính; không bổ sung động tác phức tạp chỉ để khớp từng động từ.
- LIVE, giờ trên màn hình và logo kênh là nội dung của mẫu, không phải yêu cầu thêm vào sản phẩm.

## Nguyên nhân lệch trước đây

1. Profile chỉ mô tả chung Vietnamese folk horror / flat 2D / human proportions. Chưa chốt nét mặt, cơ thể, chất liệu màu và những kiểu vẽ cần tránh.
2. Màu paper của Remotion chỉ là lớp nền dưới SVG. SVG bối cảnh đã phủ kín thì đổi màu paper không làm bối cảnh tối hơn.
3. Hình cache được giữ theo settings/scene/entity. Đổi nội dung chỉ dẫn profile không làm các đường dùng lại hình cũ dựng lại chủ thể/bối cảnh.

## Bản sửa

- Chuẩn hóa direction của profile horror theo các đặc trưng trên; mọi yêu cầu dựng phân cảnh, background, character và prop đều dùng chung direction này.
- Thêm revision riêng từng profile vào trạng thái Remotion. Khi tiếp tục dựng một dự án horror dùng phiên bản nét vẽ cũ, giữ bản gốc trong invalidAssets và dựng lại lớp hình; giữ kịch bản, phân cảnh và phạm vi thoại, hủy review của hình cũ. Revision mới được lưu để tránh dựng lại ảnh ở mọi lần tiếp tục.
- Các profile khác revision 0, tương thích dữ liệu cũ; nhánh kho không dùng thay đổi này.
- Không thêm QA chấm phong cách để chặn video. Kiểm XML, anchors và độ trong suốt vẫn hoạt động.
- Không tự tiếp tục dự án đang dừng. Ảnh đang có không tự đổi màu/nét ngay khi tải lại trang; cần dựng tiếp/dựng lại để có kết quả mới.

## Kiểm chứng và giới hạn

Bộ hồi quy Remotion kiểm đổi phiên bản horror chỉ gọi dựng hình, không viết lại phân cảnh; giữ bản gốc; không lặp dựng lại ở lần tiếp theo; profile history cũ tiếp tục dùng hình đã có. Kiểm nền trong suốt của lớp chủ thể tiếp tục đạt.

Đây là chỉnh chỉ dẫn sinh SVG và cache, không phải chuyển đổi các ảnh cũ bằng bộ lọc. Chưa gửi yêu cầu AI vẽ thật hoặc tạo video thử trong lượt này; chưa thể xác nhận độ giống trên kết quả mới. Các khung mẫu được lưu để đối chiếu cục bộ, chưa gửi ảnh chụp trang YouTube vào room AI.
