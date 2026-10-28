# Lượt kiểm Video Motion một phút — 28/10/2026

## Lượt chạy qua tool

- Production: `aebee1d5-ba66-4364-a4e6-8fd52307b37e`.
- Gọi `/api/motion-video/production`, thời lượng `1min`; không chạy video 5/20 phút.
- Hai nhóm AI: DeepSeek Standard, room-only, strictProvider.
- Remotion horror, chuyển động người bật, hiệu ứng nhẹ, camera cố định, review ảnh AI tắt.
- Tool đã tự phân tích nguồn, viết truyện mới **Đôi dép ướt trước hiên**, tạo 8 nhịp kịch bản và tạo giọng khoảng 54 giây.
- Đã hoàn tất cùng production, trích đủ 10 cảnh từ MP4 cuối để kiểm sau sửa; không chạy lại kịch bản hoặc tạo lại giọng.
- MP4 cuối: `storage/output/motion-video/doi-dep-uot-truoc-hien-16x9-standard-1793150070770.mp4`.
- Thời lượng thực 54,067 giây theo track giọng, 1920×1080, H.264 30 fps; âm thanh AAC 48 kHz, khoảng -14 LUFS. Đây là lượt chọn 1 phút, không phải MP4 dài đúng 60 giây.
- Trang xem video và bấm từng cảnh: `http://127.0.0.1:3002/scratch/horror-one-minute-recheck-20261028/comparison.html`.

## Lỗi phát hiện và sửa trong luồng chung

1. Người có tọa độ cố định vẫn nhận thêm độ dịch do cùng slot: chỉ chia slot khi chưa có tọa độ.
2. Cửa giữ tỷ lệ riêng nên không phủ khớp ô mở nền: fixture trong không gian chung khớp chính xác vùng lắp sau khi đo bounds.
3. Kích thước ô cửa không tính tỷ lệ video: quy đổi tỷ lệ vật lý sang tọa độ chuẩn hóa theo aspect.
4. Hai cửa dùng chung socket, ngưỡng cửa bị nhận thành cả cửa: socket riêng cho từng kiến trúc cùng loại; ngưỡng cửa là dải thấp ở mặt sàn.
5. Nền dùng cover làm sai vị trí metadata khi tỷ lệ SVG khác video: vẽ toàn bộ nền theo hệ tọa độ chuẩn hóa, không crop âm thầm.
6. Dép/giày lấy kích thước đạo cụ mặc định quá lớn: dùng giới hạn vật nhỏ theo người lớn.
7. Bàn thờ được bố trí sát vách nhưng relation=behind kéo về chân quan tài: giữ điểm đất và chiều sâu riêng của vật đỡ trong không gian chung.
8. SVG người hợp lệ XML nhưng đầu/cổ hoặc thân/chân rời nhau: kiểm alpha thực tế theo dải hàng và thành phần liên thông; yêu cầu AI sửa đúng lớp bị hỏng. Bóng mờ nhỏ và chi tiết rời nhỏ không bị coi là phần thân chính.
9. Hồ sơ người chứa cả trang phục tương lai, làm Linh mặc áo trắng từ đầu: tách mệnh đề biến đổi về sau khỏi hình cơ sở; không dùng màu tương lai để quyết định tái sử dụng hình. Ảnh tài nguyên đang chạy đã xác nhận lỗi này trước khi nạp sửa.
10. Bàn thờ tiếng Việt có cụm “có di ảnh” có thể vẽ lẫn di ảnh: tách phần chứa đồ như cách xử lý “with/containing”.
11. `mount=on` của đèn bị kiểm như vùng nền, gây yêu cầu bổ sung metadata không cần thiết: chỉ fixture mới yêu cầu socket kiến trúc; đồ đặt trên bàn dùng quan hệ và anchor của bàn.
12. Yêu cầu vẽ từng món thiếu bố cục tổng thể: bổ sung locationComposition chung và hướng chiếu cho vật chính. Quan tài có hướng trục dài rõ; người có khung dọc vừa chủ thể và yêu cầu các khớp nối liền nhau.
13. Cận cảnh bàn tay bị tách thành các đạo cụ rời: prompt ưu tiên người nguyên vẹn và khung cận hai người/thân trên; bộ phận rời chỉ dành cho nội dung thực sự mô tả bộ phận bị cắt rời.
14. Áo đang mặc bị AI tách thành đạo cụ đặt lên người: nhập trạng thái trang phục vào nhân vật, bỏ lớp áo trùng và chuyển focus về đúng người.
15. Đèn mất quan hệ với bàn thờ khi cảnh cận không trả lại bàn: khôi phục quan hệ từ ledger và bổ sung vật đỡ phụ thuộc, thay vì thả đèn xuống sàn.
16. Nền gạch bị tạo thêm thành đạo cụ tiền cảnh: lọc các thành phần kiến trúc trùng lớp nền.
17. Người ngồi dùng chiều cao người đứng, phần chân vượt khung: chiều cao theo tư thế ngồi; vẫn giữ người lớn đúng tỷ lệ so với người đứng.
18. Người ngồi trên chiếu bị kéo vào một anchor trung tâm, chồng lên người bên cạnh: giữ tọa độ ngang riêng, đặt chiếu theo nhóm người có tiếp xúc.
19. Người ngồi nhận depth của chiếu nên bị quan tài che cả thân: giữ chiều sâu tiền cảnh của người khi gắn với vật đỡ.
20. Góc nhìn thân trên/qua vai tạo ra đầu có thừa mặt: đơn giản hóa sang người nguyên vẹn ở góc ba phần tư; không giữ ảnh đã vẽ cho tư thế cũ.
21. Cảnh cận vẫn vẽ toàn bộ đồ nội thất, che manh mối hoặc để lại nửa người ở mép: chỉ vẽ focus, quan hệ trực tiếp, vật đỡ/vật cầm liên quan và kiến trúc cố định; khung toàn vẫn giữ bố cục đầy đủ.
22. Vết cổ tay dùng anchor mặt bàn và khung toàn thân: dùng anchor wrist; khung cận lấy vùng gần dấu vết, thay vì toàn bộ chiều cao người.
23. Giới hạn chiều cao decal không giảm đồng thời chiều rộng: co cả hai chiều; dấu cổ tay có giới hạn nhỏ riêng để không thành mảng bọc bàn tay.
24. Quan tài AI vẽ thành nắp mở/hai tấm rời và ngưỡng cửa thành nhiều khối: quan tài gỗ đóng thông thường và ngưỡng cửa dùng cấu trúc SVG liền khối dùng chung. Quan tài mở hoặc có màu/chất liệu đặc biệt vẫn dùng AI.
25. Nền AI vẽ thêm cửa, ngưỡng và các khối tiền cảnh dù đã loại riêng đạo cụ: nhóm phòng dân dụng tường xám đơn giản dùng hình học phòng theo spaceGuide; chỉ có các ô mở đã khai báo, đồ và người là lớp riêng. Bối cảnh đặc biệt, tường khác hoặc cần vùng ngoài trời thiết yếu vẫn dùng AI, không tự thay bối cảnh.
26. Tiếp tục lượt cũ bỏ qua thay đổi bố cục vì bước dựng đã done: kiểm phiên bản build, nền và phối cảnh đạo cụ; vô hiệu bước dựng/xuất cũ khi cần. Lượt đã xuất cũng có thể được tiếp tục khi bản dựng đã lỗi thời; vẫn giữ kịch bản và giọng.
27. Tiến độ giữ 100% từ bản đã xuất khi dựng lại: đưa tiến độ về các bước thực sự còn hợp lệ trước khi tính phần dựng/xuất mới.
28. SVG của chiếu và kiến trúc tự giữ tỷ lệ viewBox bên trong khung đặt đã tính: các lớp mặt phẳng/kiến trúc được vẽ theo đúng hệ tọa độ chuẩn hóa; người và đạo cụ thông thường vẫn giữ tỷ lệ tự nhiên.
29. Cảnh cận không kế thừa cửa cố định nên để lộ ô mở phía sau: kiến trúc persistent được giữ cả trong khung toàn và khung cận; trạng thái cửa đóng/mở vẫn đi theo ledger. Đã có kiểm hồi quy riêng cho cửa đóng ở cảnh cận không khai báo lại cửa.

## Kiểm tra và giới hạn

- Đã qua TypeScript, integration Remotion, geometry, staging, shared-space, cutout, Remotion QA, cấu hình chuyển động và production runner. Kiểm offline không thay cho kiểm ảnh MP4 thực tế.
- Mọi xác nhận chất lượng phải dựa trên các khung trích từ MP4 cuối; không dùng các tài nguyên rời làm bằng chứng video đã đạt mẫu.
- Trang so sánh cũ vẫn phát video cũ cho đến khi có bản xuất thay thế.
- Người dùng đã cho phép khởi động lại backend. Các bản sửa được nạp bằng khởi động lại và tiếp tục production đã lưu; không tạo lượt 5/20 phút.
- Hồ sơ thử và ảnh kiểm tài nguyên: `scratch/horror-one-minute-recheck-20261028/`.

## Kết quả kiểm MP4 cuối

- Production completed, 10/10 cảnh, xuất trong khoảng 190 giây; backend đang chạy bản sửa.
- Cảnh 1/3: quan tài đóng liền khối; người ngồi không bị quan tài che; chiếu có kích thước mặt phẳng đúng khung đặt.
- Cảnh 2/4/6/7: cửa sau vẫn đóng, không biến thành ô tối khi chuyển sang khung cận.
- Cảnh 5: dép ở cạnh người; đồ nội thất không chen vào khung cận che manh mối.
- Cảnh 7: áo Linh chuyển sang trắng ở đúng đoạn biến đổi; các đoạn trước vẫn xám nâu.
- Cảnh 9: không còn nửa người thừa ở mép khung cận ngưỡng cửa.
- Cảnh 10: lấy cận vùng cổ tay, dấu vết gắn với điểm wrist.
- Đối chiếu ảnh giải mã tại giây 1 và 4: vùng người thay đổi khoảng 6,34% pixel ở ngưỡng chênh hơn 8/255; vùng tường tĩnh không đổi. Chuyển động hiện tại là nhịp thở/nháy mắt nhẹ, không phải diễn hoạt từng động tác.
- Đã xem ảnh trích ở giữa đủ 10 cảnh. Đã kiểm stream, thời lượng, giải mã và mức âm; chưa có xác nhận nghe trọn track bằng tai trong lượt này.

## Giới hạn hình còn lại

- Tạo hình và nét mặt vẫn đơn giản, nhiều người nhìn chính diện; chưa đạt mức giống video mẫu 100%.
- Chi tiết dấu dép trên cổ tay chưa đọc rõ thành hình đế dép; hiện thể hiện như một dấu ướt. Đây là giới hạn nội dung ảnh còn lại, không coi là đã đạt hoàn toàn mẫu.
- Khung ngồi còn mang tính minh họa; không xác nhận tư thế hay động tác chi tiết giống mẫu. Các bản dựng ngoài nhóm phòng dân dụng tường xám và các vật có màu/chất liệu đặc biệt vẫn phụ thuộc kết quả AI.
