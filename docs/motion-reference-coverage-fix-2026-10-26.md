# Đối ứng kết quả đối chiếu 22 mẫu

## Phạm vi

Sửa chung hai gói cố định, giữ minh họa tĩnh và snapshot lịch sử. Không gọi AI vẽ thêm trong production, không tạo hoặc tiếp tục video. Giữ các sửa trước về nội dung, voice, provider, checkpoint và log.

## Các mục thực hiện

| Mã | Nội dung | Nghiệm thu | Trạng thái |
|---|---|---|---|
| C01 | Giữ danh sách thành phần thực trong cảnh ghép và resolver | Món không có spot vẫn được nhận diện; không gán khả năng chỉ từ tên yêu cầu | Đã làm |
| C02 | Tách điểm tiếp xúc khỏi cao độ tính tỷ lệ, thêm chỗ trên sàn và phân đồ vật | Hai người nằm sàn, người trên/dưới, nhiều bát không chồng; đủ người trong khung | Đã làm |
| C03 | Chuẩn hóa điểm đặt/môi trường/bố cục món có sẵn | Võng, nôi, giường bệnh, bàn lễ, lớp học, nhà sàn ghép được ở cả hai gói | Đã làm trong bộ kiểm |
| C04 | Bổ sung 7 món thiếu và trạng thái hình tĩnh dùng lại | Tài nguyên rời, đúng gói, ID ổn định, không phải cảnh trọn mới | Đã làm; giới hạn dưới đây |
| C05 | Duyệt ảnh và kiểm hồi quy | Bộ tình huống trước/sau và đối chứng sai neo/sai gói/thiếu vật, không hạ QA thiết yếu | Đạt 88 phép thử, đã duyệt 11 bảng |
| C06 | Phát hành kho mới, nạp code và kiểm bảo toàn | Kho cũ giữ để khôi phục, progress không đổi, không tự chạy video | Đã nạp, kiểm API và bảo toàn đạt |

Không dùng số phép thử đạt để khẳng định đã duyệt toàn bộ 14.050 ảnh và thoại. Các yêu cầu mới chưa có bằng chứng tiếp tục được ghi riêng, không tự đánh dấu đủ 22 mẫu.

## Kết quả và bằng chứng

- Bản kho: `modular-v3-reference-20261026`, 1.038 mục, mỗi gói 519; trước là 508/gói. Thêm 7 món thiếu, ba biến thể đạo cụ (bát/đĩa chất đỏ, gương phủ vải) và một nền bệnh viện sạch cho mỗi gói. ID món cũ giữ nguyên.
- Bộ mở rộng: 88/88 tình huống dựng được lựa chọn; 4 kiểm ảnh khăn phủ đứng/nằm bằng pixel; không gọi AI, không tạo video. Một fixture `mourning` được sửa hợp đồng từ khăn đặt bàn sang khăn gắn người nằm; không coi đầu vào trước/sau giống tuyệt đối.
- TypeScript và các kiểm spatial-placement, assembly-capacity, house-readiness, stage-constraints, depth-order, closed-pipeline, prop-rest, resource-writes đã đạt. Kết quả/log lưu ở `scratch/reference-fix-20261026/`.
- [Báo cáo và 11 bảng ảnh](video-references/resource-coverage-fix-20261026/index.html).
- Đã kích hoạt pointer và 6 junction tới bản kho mới. Backend PID `71548`, cổng `3002`; API danh sách trả 157 đạo cụ/gói, 14 thumbnail mới trả SVG thành công; API status job trả HTTP 200. Đối chiếu SHA-256 108 file tiến độ/job/checkpoint sau khởi động lại: 0 thay đổi. Không tạo, tiếp tục hoặc render video. Bằng chứng: `scratch/reference-fix-20261026/post-activation-integrity.json`.

## Phần chưa nghiệm thu

Người chìm được che bởi lớp nước; phản chiếu đúng người/đồ đang đổi trong gương; trẻ bên trong bát có vành che; bát nghi lễ treo dây. Đây là khả năng ghép/lớp hình cần kiểm riêng, không kết luận chỉ cần tăng số file tài nguyên là đủ. Đồng hồ mới chỉ có hình tĩnh 3:12.
