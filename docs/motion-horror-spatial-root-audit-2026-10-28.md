# Kiểm tra lại người, đồ vật, bối cảnh Remotion — 28/10/2026

## Kết luận chất lượng

Video “Dấu dép quay vào” chưa đạt mẫu. Đánh giá trước chỉ nhấn mạnh diễn xuất và bàn tay đã bỏ sót lỗi lớn ở không gian, hình đồ vật và tính thống nhất của các lớp vẽ. MP4 xuất thành công không đồng nghĩa hình minh họa đúng.

## Sai nhìn thấy trên MP4 đã giao

| Phần | Sai quan sát được | Nguyên nhân trong code |
| --- | --- | --- |
| Căn phòng | Khoảng tường trống lớn, sàn mỏng và thiếu cảm giác khoảng cách | Nền được yêu cầu vẽ riêng nhưng chỉ mô tả bằng văn bản, không dùng mặt phẳng/góc nhìn chung với các lớp khác |
| Cửa | Ô mở nền và cánh cửa không khớp, cửa như đặt trên sàn | AI trả vùng nền, code tự suy vùng khi thiếu; thiết kế hình và metadata không có một hợp đồng vị trí chung |
| Quan tài | Như bàn/khay rộng ngang, khó nhận ra vật chính của cảnh | Mỗi món SVG vẽ riêng, không nhận hướng trục dài và góc nhìn của phòng; QA chỉ xác nhận XML, nền trong suốt, anchor và trong khung |
| Bàn thờ | Nhỏ, trông như ghế; không ở sát vách như lời kể | Tỷ lệ theo nhóm support, cùng đường tiếp đất với người và đồ vật phía trước |
| Người | Đổi chỗ qua các cảnh, nhỏ và như dán lên nền | Slot trái/giữa/phải từng cảnh; tránh chồng hình bằng đẩy ngang; khi tràn khung thu nhỏ toàn bộ cụm |
| Tạo hình người | Nhiều người giống cùng một búp bê nhìn thẳng | Sửa trước đã thay hình AI bằng nhân vật vector dựng cứng cho người mặc áo đơn giản |
| Cận cảnh | Bàn tay rời, không đọc được quan hệ đang nắm | Tách nhỏ đến bộ phận cơ thể nhưng thiếu góc nhìn và khung cận thiết kế riêng |

Nguồn đối chiếu: khung giữa cả 9 cảnh của MP4 trong `scratch/horror-reference-one-minute-20261027/`, khung mẫu 4:29 và 6:24 trong `scratch/horror-style-reference-20261027/`. Không đánh đồng đây với đã xem hết mẫu từng frame.

## Sửa đã thực hiện trong code

- Thêm hợp đồng không gian chung cho horror: đường chân trời, vùng sàn, vị trí ô cửa; đưa cùng hợp đồng vào yêu cầu vẽ nền và hướng vẽ đồ vật.
- Vị trí chân, chiều cao và lớp trước/sau được tính riêng cho người, bàn thờ, quan tài, ghế; không ép tất cả chung đường chân.
- Giữ tọa độ người qua các cảnh ở cùng nơi khi không có bằng chứng di chuyển.
- Không để bộ né chồng hình tùy tiện đẩy người đã có tọa độ ổn định.
- Với cảnh có không gian chung, điều chỉnh cụm tràn ngang tại chỗ; không thu nhỏ toàn cảnh để che lỗi.
- Điểm tiếp đất lấy đáy vùng hình đã đo thay vì anchor AI khai báo quá cao. Giữ quan hệ surface/seat/grip riêng.
- Bỏ đường tự thay nhân vật AI bằng người vector dựng cứng khỏi scenePipeline; nhân vật quay lại cách vẽ theo hồ sơ và ảnh gốc.
- Chỉ dùng cảnh thuộc kịch bản hiện hành để tính yêu cầu nền; cảnh cũ của hiệu chỉnh thời lượng không tham gia.
- Bổ sung xử lý hẹp cho lỗi delimiter SVG `/>>` hoặc thiếu `>` ngay sau dấu tự đóng của primitive. Sau sửa vẫn chạy kiểm XML và an toàn đầy đủ.

Các thay đổi không áp dụng mô hình không gian mới lên nhánh kho hoặc profile lịch sử/giải thích. Kiểm tích hợp giữ đường cũ.

## Lượt kiểm hình thực tế và phần chưa đạt

Chỉ gọi API dựng hình để kiểm trên kịch bản/giọng đã có; không chạy production video mới. Hồ sơ trong `scratch/horror-space-correction-20261028/`.

Ảnh mới có mặt sàn rõ chiều sâu hơn và cửa khớp vùng mở hơn, vị trí người ở hai cảnh đầu giữ nguyên. Tuy nhiên:

- Quan tài vẫn giống bàn dù prompt đã nêu hình quan tài.
- Một nhân vật bị tách đầu khỏi cổ; hình SVG hợp lệ về dữ liệu nhưng sai hình học nhìn thấy.
- Một số cảnh chưa có đủ biến thể hình người. Lượt dựng hình dừng ở kiểm bounds do backend chưa nạp sửa điểm chân mới nhất tại thời điểm chạy.

Vì vậy **chưa xác nhận đã sửa xong chất lượng hình**; không xuất thêm MP4 từ các khung này và không dùng chúng làm bằng chứng đạt mẫu.

## Hướng tiếp theo cần hoàn tất để đạt chất lượng

1. Thiết kế một khung tổng thể hoàn chỉnh cho mỗi địa điểm và góc máy trước: kiến trúc, cửa, bàn thờ, vật chính và vùng người phải có quan hệ rõ trong cùng ảnh.
2. Dùng khung đó làm căn cứ vẽ các lớp, kèm hình mẫu vật chính và nhân vật; không chỉ gửi tên và một đoạn mô tả tiếng Anh cho từng món độc lập.
3. Kiểm tra bảng ảnh tổng thể theo các lỗi nhìn thấy: vật có đúng loại, phần cơ thể có liền nhau, góc nhìn có thống nhất, có vô tình vẽ lẫn đồ khác. XML/anchor không chứng minh các mục này.
4. Giữ nguyên bối cảnh và đồ vật ổn định khi đổi cảnh; dùng crop thành khung cận. Không phân cảnh nào cũng thiết kế lại phòng.
5. Chỉ tách bộ phận cơ thể nếu cần thiết và có hình cận được thiết kế đúng. Minh họa thông thường dùng người nguyên vẹn cạnh người/vật chính.
6. Chỉ xuất lại khi bảng ảnh đối chiếu đạt. Review ảnh AI vẫn tôn trọng cấu hình; khi tắt, phải công khai rằng kiểm dữ liệu không thay được đánh giá hình ảnh.

Không thể đạt các mục này bằng tăng độ tối, thêm chớp mắt, đổi transition hoặc hạ QA dữ liệu.
