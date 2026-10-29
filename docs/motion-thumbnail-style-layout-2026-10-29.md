# Ảnh bìa mới theo phong cách cảnh — 29/10/2026

## Yêu cầu và cách xử lý

Mỗi lần bấm **Tạo ảnh bìa** gọi AI vẽ hình mới cho phương án SEO đang chọn, áp dụng chung cho Kho và Remotion. Bỏ nhánh Remotion lấy nguyên khung cảnh rồi chèn tiêu đề.

- AI nội dung lập ý tưởng/prompt theo tiêu đề, mô tả SEO, câu chuyện và danh sách nhân vật của dự án.
- Khóa phong cách theo profile Remotion hoặc style pack của Kho. Hồ sơ DNA suy ra từ nguồn không được ghi đè phong cách dựng đã chọn.
- Lấy tối đa hai hình cảnh đã dựng làm tham chiếu nét vẽ, hình dáng, màu sắc và nhận dạng. Xếp ưu tiên cảnh theo từ khóa tiêu đề SEO; đây chỉ là cách chọn tham chiếu, AI vẫn thiết kế bố cục mới.
- Remotion: chuyển SVG hoàn chỉnh đã dựng thành PNG tham chiếu, bỏ cảnh lỗi/placeholder; không dựng lại phân cảnh hoặc gọi AI sửa cảnh.
- Kho: đọc ảnh cảnh đã có; nếu chưa có ảnh xem trước thì kết xuất ảnh tham chiếu từ cảnh Kho đã ghép. Không tạo hoặc ghi thêm tài nguyên vào kho.
- Nếu chưa có hình cảnh phù hợp/không đọc được ảnh, ghi log và tiếp tục theo phong cách của gói/profile đã chọn. Không lấy ảnh bìa cũ làm kết quả dự phòng.
- Ảnh cuối luôn do luồng tạo hình mới trả về. Nếu provider trả nguyên dữ liệu ảnh tham chiếu thì thử lại, không báo thành công với ảnh cảnh cũ.

## Bố cục theo ảnh mẫu

Chữ lớn, đậm, bên trái; vài từ quan trọng từ tiêu đề, đúng dấu tiếng Việt hoặc ngôn ngữ đọc đã chọn; tối đa hai hoặc ba dòng gọn. Nhân vật/đồ vật trọng tâm bên phải. Nền ít chi tiết, tương phản rõ khi xem nhỏ, có khoảng trống giữa hình và chữ. Truyện ma dùng nền tối trầm, điểm sáng/vignette nhẹ; lịch sử/giải thích giữ palette và nét vẽ riêng, chỉ học bố cục của mẫu. Không đưa giao diện YouTube, thời lượng, progress bar, logo hoặc tên truyện của mẫu vào ảnh.

## Cấu hình và dữ liệu

- Giữ tỉ lệ 16:9 hoặc 9:16, ngôn ngữ, tùy chọn Chrome hiện/ẩn và AI nội dung của người dùng. Luồng tạo ảnh vẫn dùng provider ảnh Gemini như trước.
- Thumbnail là hình tĩnh; không cần chạy lại voice, review ảnh cảnh, chuyển động hoặc xuất video.
- Callback nút ảnh bìa đọc `stateRef.current` khi bấm để lấy script/cảnh/SEO/cấu hình mới nhất; cập nhật đúng phương án và giữ các ảnh bìa phương án khác.
- Không dùng lại cache thumbnail giữa các lần bấm; mỗi lần có request lập prompt và request vẽ mới.
- Giữ dữ liệu kịch bản, cảnh, giọng và video hiện có. Prompt dựng cảnh cho ba kiểu hình không đổi.

## Kiểm chứng

- `npm run test:motion-thumbnail`: kiểm service với mock AI, xử lý ảnh tham chiếu và kiểm trình duyệt với toàn bộ API giả lập. Cả hai cách dựng gửi đúng cảnh mới nhất, đúng phương án SEO, giữ các ảnh còn lại. Kiểm tỉ lệ/ngôn ngữ/hiện Chrome, fallback, từ chối trả nguyên ảnh tham chiếu, dọn file tạm và giữ ảnh nguồn.
- `npx tsc --noEmit`: kiểm TypeScript.
- Đã chạy hàm lấy tham chiếu trên production `fb184c3a7f5488efa9e109e481f97e45`: đọc được hai ảnh từ cảnh thật. Đã xem PNG kết xuất, giữ đúng nhân vật mặt nạ, màu áo và bối cảnh của cảnh hiện tại. File kiểm tra: `scratch/motion-thumbnail-reference-20261029/scene-style.png`.
- Không gọi AI tạo ảnh thật hoặc tạo video trong lượt này. Chất lượng chữ và mức bám nét của ảnh bìa mới cần kiểm khi provider trả hình thực tế; mock không chứng minh được chất lượng hình cuối.
- Đã nạp backend khi không có job đang chạy, PID mới 3100, cổng 3002; HTTP 200 và production hiện tại vẫn `completed`. Log: `storage/logs/backend-thumbnail-20261029-155232.log`.
