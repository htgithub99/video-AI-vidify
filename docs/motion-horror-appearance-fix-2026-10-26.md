# Ngoại hình ma, màu cảnh và tỷ lệ nhân vật — 26/10/2026

Đối ứng phản hồi sau video **Người Đứng Ngoài Sân**. Áp dụng đường dựng Puppet của hai gói **Tối giản mặt nạ** và **Chibi màu dân gian**. Không tạo video mới, không gọi AI vẽ hoặc tạo voice trong đợt này.

## Nguyên nhân và thay đổi

| Nguyên nhân đã kiểm | Cách sửa dùng chung |
|---|---|
| Ma chỉ là nhân vật gốc áp trong suốt/mờ, không có màu và trạng thái theo lời kể | READ nhận `states[].appearance`, gắn với ID nhân vật, có trích dẫn nguyên văn. Kiểm màu mặt, áo, tóc, toàn thân riêng; không hiểu mặt trắng thành áo trắng |
| Prompt giữ màu gốc tuyệt đối, làm mất đặc điểm siêu nhiên được mô tả | Giữ danh tính nhưng cho phép biến thể màu có bằng chứng, phân biệt giả người sống và lộ hình; không tự thêm máu hoặc hành động phức tạp |
| Trạng thái ngoại hình có thể mất ở câu/cảnh sau | Giữ theo nhân vật và dòng thời gian; hồi tưởng tách trạng thái, trở về hiện tại lấy lại trạng thái hiện tại |
| Mặt trung tính và độ trong suốt giống nhau cho mọi ma | Khi lộ hình, dùng ánh mắt tĩnh và tương phản rõ hơn, giảm độ mờ. Giữ trạng thái ngủ/khóc đã có. Khi được mô tả như người sống, giữ hình đặc và bóng chân |
| Màu nền sáng/chói, giảm sáng chung dễ làm mất người và vật | Hạ độ bão hòa, thêm sắc trầm cho lớp nền; giữ màu người và đạo cụ riêng, tăng tối nhẹ viền khung. Ban đêm không ép giảm sáng mạnh thêm trên nền vốn đã tối |
| Trung cảnh gom cả đồ nội thất xa làm nhân vật quá nhỏ | Chỉ lấy thêm bounds đồ ở gần vùng người; giữ toàn cảnh rộng. Chuẩn hóa toàn/trung/cận theo gói, cận Chibi có tỷ lệ đầu riêng |

Biến thể được tạo từ SVG của nhân vật trong kho tại bước biên dịch, không ghi đè tài nguyên gốc và không vẽ mới bằng AI. Không thay rig/chân đã duyệt. Màu hỗ trợ hiện tại: trắng, xám, đen, đỏ, xanh dương, xanh lá; các mô tả ngoài tập này chưa có biến thể tự động.

Không tự gán màu cho người duy nhất trong `who` chỉ từ một câu có nhắc màu: câu có thể đang nói về người khác. Chỉ nhận ngoại hình ở trạng thái chỉ rõ ID nhân vật; trường không có bằng chứng hợp lệ bị bỏ, giữ hình hiện có. Điều này tránh nhuộm nhầm người kể, nhưng chưa chứng minh AI luôn gắn đúng chủ thể trong mọi câu phức tạp.

## Kiểm tra

- 12 trường hợp mô tả, gồm mặt trắng/áo trắng/toàn thân xám, phủ định, “áo đó” và không lây màu sang bộ phận khác.
- Hai lượt READ mô phỏng AI qua hàm thật, một cho mỗi gói; kiểm giữ trạng thái qua cảnh, tách hồi tưởng và quay về hiện tại.
- Đối chứng một người xuất hiện nhưng không có trạng thái ngoại hình: không tự gán màu từ câu nhắc người khác.
- 36 ảnh bằng engine thật: ngày/đêm, ngoại hình gốc/mặt tái/áo trắng/thân xám/giả người sống, toàn/trung/hai người/cận và một người nằm–một người đứng cạnh giường.
- Kiểm không đổi tài nguyên nguồn, không lỗi JavaScript khi vẽ, màu biến thể và tỷ lệ người trong khung cạnh giường. Hash inventory: `33241d781dbf25c16b1e0eac0b1cd6c8582ec0da7dc76c3cb5fc51b0c6d78404`.
- Typecheck cùng các kiểm tra READ, visual contract, posture continuity, effect routing và reference upgrade đã đạt. Reference upgrade gồm 88 tình huống tổng hợp và bốn ảnh cover; không phải 88 cảnh của video mới.

[Bảng ảnh đối chiếu](video-references/horror-appearance-fix-20261026/index.html) · [Kết quả 36 ảnh](video-references/horror-appearance-fix-20261026/verification.json)

Backend đã được khởi động lại khi production/render không chạy để nạp bản sửa (PID mới 8856). HTTP backend và trang ảnh đều trả 200; 107 tệp production/job/draft giữ nguyên SHA256. Không resume job cũ. [Biên bản kiểm](video-references/horror-appearance-fix-20261026/backend-verification.json). Log khởi động có thông báo chưa kết nối trình duyệt hỗ trợ sinh ảnh; đợt này không kiểm dịch vụ AI trực tiếp và không mở lại Chrome để chạy tác vụ.

## Phạm vi còn lại

Đây là kiểm code và ảnh tĩnh, chưa phải nghiệm thu MP4 mới hoặc xác nhận cảm giác sợ/giống hoàn toàn video mẫu. Video cũ không tự đổi sau khi sửa code; tiến độ/READ đã chấp nhận của dự án cũ không bị xóa để chạy lại AI. Muốn áp dụng ngoại hình mới cần có dữ liệu `appearance` từ READ mới hoặc trạng thái đã được lưu rõ.

Các lỗi khác trong [audit video](video-references/nguoi-dung-ngoai-san-audit-20261026/README.md), như số lượng bóng ma, cửa/ngưỡng cửa, trạng thái gạo muối, hòa hình nhân đôi, giữ địa điểm và cầu nối đoạn kết, chưa được đóng bởi đợt sửa này. Không đánh dấu hoàn tất toàn bộ plan sản xuất.
