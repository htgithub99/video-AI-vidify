# Thử Remotion truyện ma có chuyển động nhân vật — 27/10/2026

## Yêu cầu và lượt chạy

- Tạo lại khoảng một phút bằng luồng production thật của tool, bật chuyển động nhân vật.
- Cả hai nhóm AI dùng DeepSeek Standard, strict provider; không chuyển sang nhà cung cấp khác.
- Review ảnh AI tắt; hiệu ứng cảnh nhẹ; camera cố định; phụ đề bật.
- Production cuối: `1c9d6d7d-9c57-4a78-8ce4-2e4454503e88`. Lượt đối chiếu trước đó: `59f0612f-3b7b-41df-80eb-cf8f77ef3f49`.
- Giữ câu chuyện Bát tro trên bàn thờ dì Tư để đối chiếu với bản trước. Kịch bản/giọng được đo và sửa theo thời lượng trong chính luồng production.

## Đối chiếu mẫu

Mốc đối chiếu: [ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY](https://www.youtube.com/watch?v=a6oQO7GqGwo&t=385s). Đã xem các khung lưu khoảng 4:29, 6:24 và quan sát thêm một số khung trong đoạn phát từ khoảng 6:25 tới 13:53. Không coi đây là khảo sát toàn bộ chuyển động từng frame của video mẫu.

Mẫu dùng người thân thon, mặt sáng, màu đêm trầm; phòng có chiều sâu và quan hệ người–đồ vật rõ. Có toàn cảnh, cảnh người cạnh quan tài và hình cận mặt/manh mối. Không cần diễn mọi động từ. Bật chuyển động không đủ để đạt chất lượng mẫu nếu sai bố cục hoặc tỷ lệ.

## Sửa trong lượt này

1. Người đứng cạnh/đằng sau người khác vẫn được cử động nhẹ. Chỉ khóa khi có tiếp xúc vật lý như nằm/ngồi trên vật đỡ.
2. Nhịp thở nhẹ, chu kỳ bảy giây, biên độ 0,6%; chân giữ điểm tựa. Vật cầm và dấu in gắn vào vật đi theo cùng chủ thể để không trượt khỏi tay.
3. Nhận diện vai trò bàn/bàn thờ, đồ nhỏ, dấu in bằng cả tiếng Việt và tiếng Anh trước khi dùng role AI. Bàn thờ kê trên sàn; cổng ở xa nằm trong vùng ngoài nhà; người sau cổng cùng độ sâu.
4. Dấu tay là vết in phẳng, không phải bàn tay rời dựng đứng; giữ dấu in ở các cảnh tiếp nối cùng vật và trạng thái.
5. Sửa đảo chiều quan hệ `heldBy` người–đồ vật. Rút quan hệ đứng cạnh/đằng sau khai báo vòng giữa hai người thành một phụ thuộc bố trí, giữ cả hai nhân vật.
6. Giới hạn kích thước đồ nhỏ theo tỷ lệ người trưởng thành, kể cả khi nằm trên bàn lớn.
7. Khi tiếp tục dựng, đánh giá lại bản phân cảnh đã lưu bằng quy tắc hiện tại trước khi gửi AI. Bản đã hợp lệ không bị khóa bởi bộ đếm lỗi cũ.
8. Với video ngắn 30–120 giây, bổ sung một lượt sửa lời theo thời lượng giọng thực khi lệch trên 15%; giữ giới hạn phục hồi hiện có.
9. Ngưỡng sửa lời cho video ngắn thống nhất với ngưỡng đo giọng; phân bổ phần mở rộng theo các đoạn kể, tránh dồn hết vào câu kết. Bản 43 giây được viết lại thành 220 đơn vị lời, giọng thực 64,89 giây.
10. Lược lớp vách/sàn/trần thừa khi kiến trúc đã thuộc nền và không có chủ thể phụ thuộc vào lớp ấy. Giữ các bề mặt đang có vật/manh mối gắn vào; không hạ kiểm tra nền trong suốt để chấp nhận lớp phủ kín video.
11. Khi tư thế nói rõ đứng ngoài/sau cổng và cảnh chỉ có một cổng, chuẩn hóa quan hệ đặt người với cổng. Không suy luận từ việc chỉ tay về phía cổng.
12. Dấu in trên mặt bát/đĩa/khay được ép theo mặt vật, kể cả AI khai báo `on` thay vì `inside`.
13. Sửa phép giới hạn vị trí khung cận từng kéo chủ thể sát mép trái/trên. Cảnh nhấn dấu in ưu tiên dấu và vật mang dấu, tăng cỡ hình bằng góc cắt cố định để đọc được manh mối; camera cố định vẫn không chạy zoom.

Các sửa chữa áp dụng theo loại chủ thể/quan hệ, không dựa vào tên truyện hoặc nhân vật. Nhánh sử dụng kho không bị thay bằng nhánh Remotion.

## Kết quả thực

Lượt production cuối đã hoàn tất lúc 23:18:58 sau khi nạp backend PID 86156. Lượt dựng phục hồi đủ 9/9 cảnh lúc 23:16:14, không gửi thêm AI; giữ giọng thực 64,89 giây.

- Video: [Bát tro trên bàn thờ dì Tư](../storage/output/motion-video/bat-tro-tren-ban-tho-di-tu-16x9-draft-1793117930852.mp4).
- MP4 thực: **64,933333 giây**, 1280×720, 30 fps, H.264 + AAC; 2.119.131 byte.
- [Bảng 9 cảnh trích từ MP4](../scratch/deepseek-motion-one-minute-final-20261027/contact-sheet.jpg), [dữ liệu kiểm](../scratch/deepseek-motion-one-minute-final-20261027/audit.json), [đo chuyển động](../scratch/deepseek-motion-one-minute-final-20261027/motion-check.json).
- Cấu hình thực trong kết quả xuất: `actors=simple`, `sceneEffects=gentle`, `camera=fixed`, phụ đề bật, horror/Remotion, draft. Hai cấu hình AI đều DeepSeek Standard với `strictProvider=true`; review AI tắt.
- Hai khung ở 48,133 và 51,633 giây: chiều cao nhân vật thay đổi khoảng **2,355 pixel ở 720p**, điểm tựa chân không đổi. Có 1.350/39.900 pixel trong vùng cắt thay đổi trên ngưỡng 15 mức màu. Chênh pixel còn có ảnh hưởng nén video; bằng chứng chuyển động kết hợp tọa độ renderer và ảnh giải mã từ MP4, không chỉ dựa vào cấu hình bật.
- Âm lượng đo trên file cuối: -14,05 LUFS, true peak -0,83 dBTP, LRA 1,70 LU. Chưa nghiệm thu độ rõ chữ bằng nghe toàn bộ file trong lượt này.

## So với mẫu và giới hạn còn lại

| Mục | Kết quả thực |
| --- | --- |
| Tỷ lệ/quan hệ | Bàn thờ thấp hơn người; bát/đèn nhỏ hơn bản đầu; ma áo trắng đặt sau cổng ở vùng ngoài nhà. |
| Khung hình | Có toàn cảnh và hình cận bát tro ở đầu/cuối; sửa lỗi khung cận kéo vật sát mép và để manh mối quá nhỏ. Cảnh cận có thể chủ động cắt người ngoài tiêu điểm. |
| Hình thức | Nét viền, người thon, màu trầm và áo trắng đã gần hướng minh họa mẫu. Mắt/mặt nhân vật còn hiền, nét SVG sạch và hình học hơn mẫu. |
| Chuyển động | Đã có nhịp thở nhẹ và hiệu ứng nguồn sáng; đây chưa phải hệ hoạt ảnh đầu/tay/biểu cảm phong phú. Bật cấu hình này không đủ để khẳng định ngang video mẫu. |
| Nhịp cảnh | 9 hình trong khoảng 65 giây. Có đoạn dẫn “Nó thì thầm” khoảng 0,93 giây trước hình cận câu kết; hai cảnh cận cuối cùng giữ cùng tiêu điểm nên không tạo một lần đảo bố cục mới. |
| Tính ổn định | Production đã phục hồi rồi xuất thành công sau sửa. Kết quả này không chứng minh mọi loại truyện tương lai đều không phát sinh lỗi. |

Đã xem đủ chín ảnh đại diện từ file cuối; chưa tuyên bố đã phân tích chuyển động từng frame hoặc nghe toàn bộ mẫu. Các bộ kiểm Remotion (integration, geometry, staging, QA, cutouts), behavior, field repair, production runner, TypeScript và diff check đạt. Kiểm thử không gọi AI không được dùng thay cho kết quả video thật.

Trước đó đã xuất qua API tool để kiểm hình, phát hiện và sửa vị trí ma, độ phẳng của dấu tay và cách lấy khung cận. Các bản xuất trung gian được giữ để đối chiếu; không dùng chúng để tuyên bố lượt production đã hoàn tất.

Hệ thống phê duyệt tự động đã chặn một lần restart PID 86240. Người dùng đã cho phép khởi động lại; sau khi xác minh không có production hoạt động và các bản xuất đã xong, backend được nạp lại rồi tiếp tục đúng production đã lưu.
