# Tách ba kiểu hình Remotion

## Cấu trúc

Mỗi kiểu hình nằm riêng trong `src/constants/motionProfiles/horror`, `history`, `explainer`:

- `metadata.ts`: tên, bảng màu và phiên bản riêng để nhận diện cache.
- `artDirection.ts`: phong cách, phân cảnh, bố cục, cơ thể, chuyển động và tiêu chí duyệt riêng.
- `scenePrompt.ts`: câu lệnh thiết kế và vẽ trong một phản hồi.
- `references.ts` và các tệp mẫu: tham chiếu riêng; không nhập mẫu của kiểu hình khác.
- `policy.ts`: xử lý bố cục, cận cảnh và nhãn riêng.
- `identity.ts`: nhận diện và tóc mặc định riêng; Truyện ma không tự thêm tóc.
- `motion.ts`: biên độ, thời gian và đích chuyển động dự phòng riêng.

Các tệp tổng hợp chỉ chọn cấu hình theo ID. Một thư mục kiểu hình không được nhập trực tiếp hoặc gián tiếp thư mục kiểu hình khác. Những mẫu được chuyển vị trí, không để lại bản triển khai cũ song song.

## Phần kỹ thuật dùng chung

`sceneContract.ts` chỉ mô tả JSON, SVG và cấu trúc animation. Code xử lý cú pháp SVG, hợp nhất bản sửa, xác thực dữ liệu, điều phối request, thời gian và Remotion vẫn dùng chung. Khi sửa hạ tầng chung cần chạy kiểm tra cả ba kiểu.

## Đối ứng

- Truyện ma: giữ đầu mặt nạ và thân con rối; nằm dùng đầu có điểm tựa cùng một khối thân ngang liền mạch, không xoay mẫu đứng; ngồi/quỳ dùng khối áo đơn giản có điểm tựa.
- Lịch sử: giữ phong cách đầu lớn, thân gọn và trang phục theo truyện; giữ mẫu ngồi/quỳ; nhiều người cùng tư thế chỉ gửi một SVG ví dụ và tham chiếu lại. Được phép che tự nhiên phần chân xa, không ép đủ mọi khớp.
- Giải thích: mẫu đứng chỉ quy định tỷ lệ/phong cách; được đổi đường nét để ngồi/quỳ/nằm; sơ đồ không bị ép có người hoặc sàn.
- Loại chuyển động toàn thân phá điểm tựa. Chuyển động dự phòng chỉ áp dụng cho nhóm ngực được tách rõ, không chứa đầu, tay, hông, chân hoặc đồ vật. Không có nhóm an toàn thì giữ hình tĩnh, không gọi thêm AI.
- Hiệu ứng đã vẽ có nhóm riêng có thể nhận chuyển động nhẹ theo cấu hình kiểu hình, độc lập với nhân vật. Giữ độ trong suốt đã vẽ; không tạo thêm hiệu ứng hoặc di chuyển cả đèn/nồi làm nguồn. Nhóm không xác định được hoặc chứa người/đồ vật thì không tự chuyển động.
- Giữ một yêu cầu vẽ ban đầu cho mỗi cảnh, tùy chọn AI duyệt ảnh, cơ chế phục hồi sau lượt đầu và cổng kiểm đủ cảnh trước xuất video.

## Kiểm tra

Chạy `npm run test:motion-profile-isolation` và `npx tsc --noEmit`. Bài kiểm tra bao gồm phụ thuộc giữa thư mục, thay riêng prompt/phiên bản, 24 trường hợp tư thế, bật/tắt độc lập, giới hạn opacity, khôi phục không trùng chuyển động, dữ liệu hiệu ứng, mẫu lịch sử và luồng một yêu cầu vẽ/duyệt tùy chọn. Các kiểm tra dùng dữ liệu giả lập, không đánh giá chất lượng ảnh từ một lượt AI mới.
