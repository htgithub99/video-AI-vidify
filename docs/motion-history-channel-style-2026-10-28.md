# Kiểu hình Lịch sử theo hướng Unknown Frequencies

## Phạm vi quan sát

- Kênh người dùng chọn: https://www.youtube.com/@unknownfrequencies-tv/videos.
- Đã đọc danh sách video trực tiếp trên YouTube; không khẳng định đã xem toàn bộ video của kênh.
- Đã xem lại sáu khung Achilles lưu tại `docs/video-references/achilles-third-mode-20261026/reference-board.jpg`. Nguồn: https://www.youtube.com/watch?v=L-dBHh-9wug. Có nhân vật đầu lớn, nét đen, nền trắng, cảnh cảng/cửa thành, vật và nhãn quan hệ.
- Đã xem thêm các khung khoảng 02:32, 04:48 và 07:40 của What Life Was Like in German-Occupied France: https://www.youtube.com/watch?v=33K8vBXBpQ8. Hai ảnh lưu tại `scratch/history-channel-style-20261028/france-0448.jpg` và `france-0740.jpg`. Nhân vật đầu tròn trắng, biểu cảm gọn, thân áo màu và tay chân mảnh; bối cảnh đường phố/nhà cửa và đồ vật giàu chi tiết hơn nhân vật.
- Những khung này cung cấp hướng hình ảnh cho lịch sử cổ đại/thần thoại và lịch sử hiện đại; chưa đủ để kết luận nhịp chuyển động, giọng hoặc toàn bộ cách chia cảnh của kênh.

## Nguyên nhân lệch phong cách

1. Hướng dẫn Lịch sử cũ yêu cầu thân người cân đối, chân dài và cấm người que/chibi; ngược với tỷ lệ minh họa của các khung mẫu.
2. Nền giấy vàng được áp mặc định, trong khi nguồn dùng cả nền trắng lẫn không gian giàu lớp.
3. SVG tham chiếu cũ vẽ người thân dài trong căn phòng; AI nhận tín hiệu thị giác khác hướng cần làm.
4. Hướng dẫn anatomy chung có thể kéo hình về cơ thể người bình thường. Nhánh bản đồ dùng ví dụ giấy vàng chung, các dạng so sánh khác lại lấy ví dụ phong cách Giải thích.
5. Chỉ sửa chữ mà không tăng revision có thể dùng lại kế hoạch/thiết kế/hình của phong cách cũ.

## Đã thay đổi

| Phần | Đối ứng |
| --- | --- |
| Nhân vật | Đầu tròn sáng màu, biểu cảm đơn giản, thân áo gọn, tay chân nét mảnh nối đúng khớp. Phụ kiện, tóc, trang phục theo người và thời đại của dự án. Tỷ lệ 2,5–3,5 đầu chỉ là chỉ dẫn vẽ gần đúng, không phải QA bắt số. |
| Bối cảnh | Giữ phối cảnh, mặt nền và chi tiết đủ nhận ra địa điểm/thời đại; không ép mọi cảnh vào căn phòng ít chi tiết. Chi tiết nền yên hơn nhân vật chính. |
| Nền trắng | Dùng cho giải thích, quan hệ, cận vật khi phù hợp; không bắt thêm tường, sàn hoặc đường chân trời vào dạng này. |
| Bản đồ/nhãn | Ví dụ nét vẽ riêng cho Lịch sử, nền trắng, ít màu; chỉ vẽ địa lý, mốc, tuyến và nhãn có trong nguồn. Ví dụ hình A/B/C không phải bản đồ lịch sử để sao chép. |
| Prompt | Cập nhật direction, phân cảnh, thiết kế, vẽ, anatomy, chuyển động và review. Thêm anatomy tùy chọn theo kiểu, các kiểu khác tiếp tục dùng hướng dẫn cũ. |
| Review | Chấp nhận đầu tròn trắng, tay chân nét mảnh và bàn tay giản lược. Vẫn kiểm người/vật chính, thời đại, ý nghĩa, vị trí và quan hệ quan trọng. Không thêm lượt QA hoặc điều kiện chặn mới. |
| Chuyển động | Giữ các công tắc người/hiệu ứng/camera. Kiểu hình không tự bật zoom, pan, phụ đề động hoặc chuyển động nhanh. |
| Tái sử dụng | Lịch sử revision 1 → 2. Khóa phân cảnh, checkpoint, thiết kế và hình đã bao gồm revision. Không tự dựng lại hoặc ghi đè MP4 cũ. |

SVG kỹ thuật mới là minh họa tự viết cho prompt, không lấy người, nền hoặc hình của kênh làm tài nguyên production. Không cố định cast/giáp Hy Lạp/đồ châu Âu cho mọi dự án. Hai gói Dùng kho, Truyện ma, Giải thích và phân công AI nội dung/dựng cảnh giữ nguyên.

## Kiểm tra

- TypeScript `npx tsc --noEmit --pretty false`: đạt.
- `scripts/verify-motion-illustration-profiles.ts`: kiểm pipeline phân cảnh → thiết kế → vẽ → review/sửa, AI theo đúng vai trò, tham chiếu bản đồ riêng, các dạng Lịch sử/so sánh/quy trình/cắt lớp, vignette có người không cần mặt sàn, giữ phiên bản và bỏ cache cũ khi revision đổi. Đồng thời kiểm các kiểu còn lại.
- Chuẩn hóa SVG kỹ thuật và xem trực tiếp trang đối chiếu qua trình duyệt.
- Trang xem: http://127.0.0.1:3002/scratch/history-channel-style-20261028/index.html.
- Chưa tạo cảnh AI hoặc video mới để nghiệm thu độ giống mẫu. SVG kỹ thuật hiển thị trong trang là tham chiếu của prompt, không được tính là kết quả Gemini.

## File

- `src/constants/motionVisual.ts`
- `src/constants/motionIllustrationProfiles.ts`
- `src/constants/motionHistoryCraftExamples.ts`
- `src/constants/motionCompositionStyleExamples.ts`
- `src/lib/motionIllustrationProfile.ts`
- `scripts/verify-motion-illustration-profiles.ts`
