# Bộ prompt kiểu hình ổn định, nội dung linh hoạt

## Đã cập nhật

- Dùng chung quy tắc giữ phong cách nhưng cho phép đổi nhân vật, tuổi, trang phục, bối cảnh và đồ vật theo từng truyện. Trong một video phải giữ nhận dạng, ID, màu trang phục, chủ vật và không gian đã thiết lập.
- Truyền quy tắc này vào phân cảnh, dựng hình, sửa và duyệt ảnh qua `motionIllustrationDirection`.
- Ưu tiên đúng người, nơi chốn, vật thiết yếu và quan hệ vị trí. Động tác phụ được giản lược thành hình minh họa tĩnh.
- Truyện ma dùng nét Bézier sạch, viền gần đen, màu lạnh trầm, tỷ lệ người lớn khoảng năm đầu và trẻ em theo tuổi. Màu, mặt, tóc và tư thế ma theo lời kể; không bắt buộc mọi ma trắng hoặc quỳ. Cảnh ngoài trời không bị ép thành phòng có nền gạch.
- Lịch sử giữ người đầu tròn lớn, thân gọn, tay chân nét mảnh có kết nối; phục trang, công cụ và kiến trúc theo thời kỳ/địa điểm. Không áp tỷ lệ người hoặc ánh sáng truyện ma. Sơ đồ, bản đồ và cảnh nền trắng vẫn hợp lệ khi cần giải thích.
- Giải thích giữ hệ màu, ký hiệu, độ dày nét và thứ bậc nhãn nhất quán. Tôn trọng hướng lực, dòng chảy, kết nối và trình tự; sơ đồ không cần người hoặc mặt sàn.
- Thay ví dụ SVG tang lễ dài của truyện ma bằng ví dụ gọn về hình người đứng và nằm, đầu/cổ/thân liền mạch. Ví dụ chỉ hướng dẫn nét vẽ và cấu trúc; không trở thành danh sách tài nguyên bắt buộc.
- Prompt ghi rõ schema thực tế của `design`, `svg`, `layers`, `animations`, `continuityNotes`; khoảng dịch chuyển theo viewBox, scale không có đơn vị pixel.
- Nêu rõ ánh xạ cấu hình: nhân vật đứng yên không tạo track actor/speech; tắt hiệu ứng không tạo track effect; camera do code điều khiển. Chuyển động nhẹ chỉ dùng khi phù hợp.

## Giữ luồng hiện tại

Một request thiết kế và vẽ trọn cảnh. Khi tắt **AI duyệt ảnh cảnh**, không thêm request sửa hoặc duyệt vì các quy tắc mới. Khi bật, review giữ tiêu chí lỗi thiết yếu hiện tại; khác biệt thẩm mỹ nhỏ vẫn là góp ý. Không thêm QA chặn video.

Tăng phiên bản ba profile để cache phân biệt hình cũ và quy tắc mới. Các lượt đã dừng không tự chạy lại; không tạo AI request hoặc video thật để triển khai thay đổi này. Nhánh dùng kho không đổi cách ghép tài nguyên.

## Ba prompt thử

Các file tại `scratch/motion-style-prompts-20261029/` được xuất bằng hàm `MOTION_SCENE_COMPOSITION.PROMPT` và profile hiện tại:

1. `01-truyen-ma.txt`: hai người trong phòng ngủ, một người đứng và một người nằm; đèn dầu trên bàn cạnh đầu giường.
2. `02-lich-su.txt`: người đưa tin tại sân đình, phân biệt người nhận thư, lính canh và ngựa. Bối cảnh hư cấu để thử nét vẽ, không khẳng định một sự kiện lịch sử thật.
3. `03-giai-thich.txt`: vòng tuần hoàn nước, đúng hướng bốc hơi, ngưng tụ, mưa và dòng chảy.

Các mẫu đã chứa nội dung và dữ liệu cảnh cụ thể, có thể sao chép toàn bộ để thử. Đây là mẫu prompt, chưa phải hình do AI vẽ hoặc bằng chứng chất lượng đầu ra thực tế.
