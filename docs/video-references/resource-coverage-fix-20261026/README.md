# Kết quả đối ứng kho và ghép cảnh — 26/10/2026

## Đã làm

- Sửa nhận diện thành phần thực trong cảnh; không suy ra món đã có chỉ vì tên yêu cầu chứa tên món.
- Sửa tìm tổ hợp theo số chỗ thực; cho dùng một mảnh nhiều lần ở các slot khác nhau; giữ người trên đúng sàn cao.
- Thêm điểm sàn cho nhiều người và đồ vật, phân đồ vật đồng thời, loại chồng người/đồ và cắt khung; tính tỷ lệ người theo mảnh ghép.
- Sửa metadata võng, nôi, giường bệnh, giường, quan tài, tủ, nhà sàn và lớp ghép; bổ sung nền bệnh viện sạch.
- Thêm 7 loại thiếu ở cả hai gói: giàn giáo, xe khách, rạp tang, laptop, đồng hồ điện tử 3:12, máy quay, chân máy.
- Thêm bát/đĩa chứa chất đỏ, gương phủ vải; cửa và tủ có đóng/mở/hé; khăn phủ theo thân người nằm. Đây là hình SVG rời, không lấy ảnh nhân vật từ video nguồn.

## Số lượng mỗi gói

| Gói | Nhân vật | Đạo cụ | Nền sạch | Mảnh | Tổ hợp | Tổng gồm hồ sơ phong cách |
|---|---:|---:|---:|---:|---:|---:|
| minimal_mask | 62 | 157 | 27 | 98 | 174 | 519 |
| chibi_folk | 62 | 157 | 27 | 98 | 174 | 519 |

Kho trước: 508 mục/gói. Kho mới: 519 mục/gói, thêm 11 mục/gói; giữ ID tài nguyên cũ. Tổ hợp cảnh không phải nền dính sẵn đồ vật.

## Kiểm tra

- Ban đầu 30/56 phép thử dựng được lựa chọn, 26 bị chặn. Sau sửa: 88/88 phép thử trong bộ mở rộng dựng được lựa chọn, không gọi AI hoặc tạo video.
- Đã duyệt 11 ảnh ghép / 88 hình minh họa: hai người nằm sàn/giường; người trên sàn cao; võng người lớn và em bé; camera trên chân máy; hai người trên cùng một thuyền; vật mới; cửa/tủ hé.
- Đo pixel khăn phủ ở 4 ảnh riêng (đứng/nằm × 2 gói), xác nhận vải xoay theo thân thay vì vuông lớn dựng ngang thân.
- Sửa một đầu vào kiểm cũ: mourning từng khai báo khăn phủ là mount=table, support=bed; bộ sau khai báo mount=body, owner=actor_0. Vì vậy không trình bày 56 ca trước/sau là đầu vào giống tuyệt đối. Các đầu vào gốc giữ nguyên trong báo cáo cũ.
- Bản mới chỉ kích hoạt sau khi khớp hash tài nguyên, kết quả kiểm và 11 ảnh đã duyệt. Giữ bản kho cũ để khôi phục, không xóa lịch sử dự án.

## Giới hạn chưa nghiệm thu

Đã nạp kho `modular-v3-reference-20261026`; backend PID 71548, cổng 3002. API danh sách và 14 thumbnail mới của hai gói trả thành công. Sau nạp, SHA-256 của 108 file tiến độ/job/checkpoint không đổi. Bằng chứng: `post-activation-integrity.json`.

- Che phần thân người dưới mặt nước theo đúng lớp nước.
- Phản chiếu đúng người và đồ vật đang đổi trong gương.
- Đặt trẻ bên trong bát hoặc vật chứa có vành che.
- Bát nghi lễ treo bằng dây với điểm treo riêng.

Đồng hồ mới là hình tĩnh 3:12, chưa có bộ mọi thời điểm. Một số tư thế ngồi không thiết yếu vẫn được chuẩn hóa thành đứng cạnh vật như chính sách minh họa đơn giản. Trạng thái ngồi/nằm thiết yếu được kiểm riêng.

Không khẳng định đã đủ mọi cảnh của cả 22 video. Phạm vi nguồn giữ nguyên: 22 overview/792 ô, 85 mốc đối chiếu; chưa xem/nghe trọn 14.050 ảnh và toàn bộ thoại; video 09/16 dùng storyboard dự phòng. Không suy tỷ lệ bao phủ 22 video từ tỷ lệ phép thử.

[Xem ảnh kết quả](index.html) · [Báo cáo gốc](../resource-coverage-20261026/index.html)
