# Sửa kịch bản, giọng và hình minh họa — 23/10/2026

Luồng viết truyện mới trước đây chủ yếu lưu nhận xét về không khí và cách kể, đồng thời yêu cầu khác truyện nguồn ở hầu hết chi tiết. Bước phát triển chỉ đọc bốn đoạn trích khi nguồn dài; phản hồi thiếu chương vẫn có thể giữ lại chương cũ. Những điều này làm mất cơ chế gây căng thẳng và có thể trộn hai cốt truyện.

Đã sửa:

- Đọc toàn văn nguồn trong ngưỡng xử lý; nguồn dài hơn dùng bảng sự kiện toàn nguồn. Nguồn chỉ có văn bản cũng được đọc khi không có đoạn thời gian.
- Lưu `sourceCore`: tình thế, điều nhân vật có thể mất, chuỗi nguyên nhân–hậu quả, cách leo thang, điều bị đảo nghĩa và ý nghĩa kết thúc. Lưu riêng `storySpine` của truyện mới, gồm hành động theo chương và chi tiết được chuẩn bị rồi giải đáp.
- Kiểm tra đủ chương, đủ cấu trúc nhân quả, thứ tự chuẩn bị–giải đáp; phản hồi thiếu được yêu cầu sửa, không ghép chương cũ. Truyền cấu trúc này vào Video DNA, người viết từng chương và biên tập viên. Yêu cầu cắt đoạn lặp, lời bình chung chung và phần kéo dài chỉ để đủ phút.
- Truyện mới cụ thể: [Người khách ở bến cạn](nguoi-khach-o-ben-can-2026-10-23.md). Đây là bản viết để duyệt, chưa phải kết quả chạy thử đầy đủ qua mọi AI của tool.

## Giọng

Kênh `Truyện ma`, mã `ch-b56df36d`, đã cập nhật:

| Vai | Nguồn đang dùng |
|---|---|
| Người kể | `MeoDen_giong_ke_goc.mp3`, đoạn 67,50–73,50 giây |
| Nam trưởng thành | `Thần trùng - Trùng tang kỳ truyện.mp3`, 120,00–128,15 giây |
| Nam cao tuổi | Cùng file Thần trùng, 216,80–220,90 và 225,10–228,00 giây |
| Nữ cao tuổi | Cùng file Thần trùng, 184,70–189,50 giây |
| Nữ trưởng thành | Giọng đọc truyện Quỳnh Anh sẵn có |
| Trẻ em | Giữ mẫu Việt Bách hiện có, áp dụng nhịp mới; chưa tìm được đoạn trẻ em đủ sạch để thay mẫu |

Các đoạn cắt là tham chiếu cho những lượt thoại tương ứng trong bản thu; không khẳng định đó là các diễn viên khác nhau. Đã đăng ký tham chiếu với VieNeu, không train LoRA. GPU hiện tại có 2 GB; không khởi chạy tác vụ train vượt khả năng máy. Có bản sao cấu hình và thư viện giọng trước khi đổi trong `scratch/story-voice-rework-20261023/backup`.

Bộ TTS đang dùng phân loại khoảng nghỉ nội bộ và bỏ qua tham số khoảng lặng cũ của ứng dụng. Đã nối khoảng nghỉ đo từ mẫu vào bước ghép các đoạn thực sự, dùng chung một đường xử lý cho đọc đơn và theo lô, giữ âm thanh mỗi đoạn và chỉ bù phần im lặng còn thiếu. Giữ thêm hơi ở hai đầu câu, giữ tốc độ ổn định theo vai, cập nhật phiên bản cache và đưa thời điểm đổi kênh giọng vào nhận diện bản thu để tránh dùng lại giọng cũ.

Đo file Mèo Đen bằng bộ phân tích âm thanh hiện có: 2,841 âm tiết/giây ước tính; ngắt cụm 0,30 giây, hết câu 0,48, trước điểm căng 0,82, hết đoạn 0,87. Đo mẫu mới qua luồng TTS và xử lý âm thanh của tool: 51,216 giây, khoảng 2,753 âm tiết/giây ước tính. Tốc độ theo chữ của từng đoạn: người kể 2,81; nam 2,80; nam cao tuổi 2,82; nữ cao tuổi 2,83; nữ trưởng thành 3,07; trẻ em 2,91. Nhận dạng lời nói đã kiểm tra các mẫu đăng ký; các số đo và ASR không thay thế việc người nghe đánh giá âm sắc.

Mẫu nghe: `storage/output/motion-video/giong-moi-truyen-ma-20261023.mp3`. Đoạn trẻ em cuối là câu riêng để thử giọng, không thuộc truyện mới.

## Hình và phụ đề

- Hồn ma giữ toàn thân và màu quần áo, độ đậm 55%, làm mềm nhẹ; bỏ quầng sáng, phủ màu lạnh, làm mất chân, nhấp nháy và lơ lửng. Áp dụng cả tư thế nằm. Hồn ma có `appearanceOf` dùng đúng tài nguyên của người ấy khi còn sống. Tài nguyên ma kiểu cũ phải được chọn/vẽ lại khi chạy bước dựng cảnh; không tiếp tục lấy mẫu ma cũ từ cache.
- Đạo cụ có thể khai báo `emitter` tại đầu nhang, miệng ấm hoặc nguồn phát thực tế. Đồ cũ chưa có điểm này dùng mép hình có nét vẽ thực, thay vì mép hộp rỗng. Renderer lấy phép biến đổi thực của đạo cụ, gồm vị trí, xoay, cầm tay và camera; đồ phụ cũng được xét. Mùi cần nguồn rõ ràng, không tự gắn vào bàn thờ hoặc nguồn sáng gần đó. Các sợi khói bắt đầu chung tại điểm phát, không nhảy khỏi nguồn theo thời gian.
- Phụ đề không có hộp nền ở các kiểu hiển thị, chữ trắng đậm vừa, viền tối, không trượt dọc và không tô màu/nghiêng lời thoại. Chuyển độ mờ 0,08 giây.
- Cache đọc câu và bố cục có phiên bản hiệu ứng riêng để bước dựng cảnh cập nhật các quyết định cũ. Không thay đổi toàn bộ phiên bản kho tài nguyên.

Ảnh kiểm tra hai gói: [bảng ảnh](video-references/story-rework-20261023/ghost-emitter-subtitles.jpg).

## Kiểm chứng

- `npm run test:motion-story-craft`: toàn văn có chi tiết nằm ngoài cửa sổ trích cũ; phản hồi thiếu/nhân đôi chương, đảo thứ tự bước truyện, giải đáp trước chuẩn bị đều bị phát hiện; lượt sửa giữ đủ cấu trúc và không lấy lại chương cũ.
- `verify-effects.ts` trong thư mục kiểm tra: điểm phát khớp phép biến đổi toán học; đồ cầm tay và đồ phụ có nguồn; không tự gắn vào bàn thờ; ảnh canvas hai gói giữ đủ thân ma, giảm alpha đúng mức; phụ đề không gọi lệnh vẽ nền và không đổi tọa độ chữ giữa lúc chuyển.
- `verify_speech.py`: khoảng nghỉ tham chiếu được áp dụng trong đoạn; đường đơn và lô cùng kết quả phân nhóm, không trộn nội dung giữa yêu cầu.
- Kiểm tra lại TypeScript, ESLint các file sửa, các bài hồi quy về lời thoại, nhịp đọc và điểm đặt.
- Backend đã nạp lại; giao diện, API kênh giọng và engine đều trả HTTP 200. Engine phục vụ bản mới có tham số chuyển phụ đề và hàm xác định điểm phát hiệu ứng. MP3 mẫu giải mã hết không lỗi.

Chưa xuất lại toàn bộ video dài. Video MP4 đã tạo trước đó vẫn chứa kịch bản và bản thu cũ. Để áp dụng cho dự án ấy cần chạy lại phần kịch bản, dựng cảnh và giọng rồi xuất bản mới; việc đổi renderer không thể sửa một MP4 đã mã hóa.
