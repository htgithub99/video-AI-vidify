# Thể loại Lịch sử kể chuyện

## Cấu hình

Chọn **Thể loại → Lịch sử kể chuyện**. Có thể kết hợp **Dựng bằng Remotion → Kiểu hình Lịch sử** để dùng hướng hình ảnh đã bổ sung trước đó. Thể loại điều khiển cách viết; kiểu hình, chuyển động, giọng và tốc độ vẫn theo cấu hình riêng. Lựa chọn mới dùng được cả trong luồng Dùng kho, trong phạm vi tài nguyên của gói.

## Cơ sở tham khảo

- Kênh: [Unknown Frequencies](https://www.youtube.com/@unknownfrequencies-tv/videos).
- Đã đọc bản chép lời hiển thị trực tiếp của [What Life Was Like in German-Occupied France](https://www.youtube.com/watch?v=33K8vBXBpQ8). Video đặt người xem vào sinh hoạt của một gia đình, nối sức ép đời sống với lựa chọn, rủi ro và hệ quả; chuyển giữa hoàn cảnh nhỏ và diễn biến rộng hơn. Chi tiết đời thường quay lại để kết nối diễn biến. Đây là quan sát cách kể của video này, không phải kết luận đã xem toàn bộ kênh hoặc xác minh mọi khẳng định lịch sử trong video.
- Học nguyên tắc tổ chức và ngôn ngữ; không đưa lời kể, tên nhân vật minh họa, chuỗi tình huống hay đoạn văn mẫu của kênh vào prompt production.

## Hướng viết

1. Mở bằng tình huống, nghịch lý hoặc quyết định có hệ quả, có căn cứ trong nguồn. Nêu sớm ai, ở đâu, khi nào, điều gì đang bị đe dọa.
2. Kể thành mạch hoàn cảnh → áp lực → lựa chọn → hệ quả → kết cục. Điều chỉnh mạch theo thời lượng toàn video, không mở lại hook ở mỗi chương.
3. Dùng từ nói gần gũi, câu ngắn và vừa xen kẽ; giải thích tên và thuật ngữ khi xuất hiện lần đầu. Chi tiết đời sống phải dựa vào nguồn.
4. Câu hỏi dẫn dắt có lời giải, căng thẳng xen giải thích và khoảng nghỉ. Không ép mọi cảnh phải có cú ngoặt hoặc câu đùa.
5. Kết giải quyết câu hỏi mở đầu; có thể nhắc lại chi tiết có ý nghĩa. Không kéo dài bằng nhắc lại nội dung.
6. Giữ sự kiện, nhân vật, niên đại, trình tự và kết quả của nguồn. Phân biệt thần thoại, lời truyền và điều còn tranh luận. Không bịa trích dẫn, suy nghĩ riêng hoặc chứng cứ để tạo kịch tính. Ví dụ đặt người xem vào tình huống chỉ là tùy chọn và phải nói rõ tính giả định.

## Tích hợp

| Khâu                | Đối ứng                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| UI và dữ liệu       | Thêm `history_story` vào enum, nhãn Việt/Anh; dùng luồng lưu cấu hình và truyền `videoGenre` hiện có.                           |
| Phân tích/dàn ý     | Hướng kể được đưa vào yêu cầu hiện tại; giữ lại cả khi chỉ sửa trường trả sai.                                                  |
| Video DNA           | Có hướng kể trong ngữ cảnh bổ sung hồ sơ và yêu cầu sửa hồ sơ; không thêm lượt AI mới.                                          |
| Viết chương         | Áp dụng với Remotion và cả hai gói kho; ưu tiên hướng viết người dùng chọn khi giọng suy từ nguồn xung đột.                     |
| Sửa chương/biên tập | Giữ hồ sơ viết trong yêu cầu sửa từng mục; không bỏ phần đã đạt hoặc đổi danh tính người nói.                                   |
| SEO/thumbnail       | Tiêu đề hứa đúng điều video giải đáp, ảnh theo kiểu hình đã chọn; tránh bí mật hoặc mức độ nguy hiểm bịa đặt.                   |
| Nhạc/âm thanh       | Mặc định nhạc trung tính, palette tài liệu; không kế thừa trống chiến trận hoặc cấu trúc bản đồ/HUD bắt buộc của `history_map`. |

Hồ sơ prompt tập trung tại `src/constants/motionHistoryStory.ts`, chỉ đưa một lần vào mỗi yêu cầu của các đường đã kiểm. Không thêm schema, bước QA, lượt review hoặc quy định chặn vì mức độ hấp dẫn. Chỉ `ghost_tale` tiếp tục vào luồng sáng tác truyện mới hoàn toàn; lịch sử không đi vào nhánh thay sự kiện của nguồn.

Trong kiểm tra phản hồi sai kiểu đã phát hiện hai chỗ gọi `trim()` trên narration mà chưa kiểm tra chuỗi. Đã dùng chung kiểm tra kiểu để lỗi dữ liệu đi tiếp qua cơ chế sửa từng mục thay vì ném TypeError.

## Kiểm tra

- TypeScript: `npx tsc --noEmit --pretty false`.
- `scripts/verify-motion-history-story.ts`: enum/nhãn, không chuyển lịch sử thành sáng tác hư cấu, phân tích/sửa DNA, bổ sung hồ sơ/sửa hồ sơ, Remotion/hai gói kho, sửa chương/biên tập, giữ phần đã đạt và không lặp hồ sơ trong một prompt.
- `scripts/verify-motion-folk-story.ts`: luồng truyện ma dân gian và giọng nhân vật cũ.
- `scripts/verify-motion-response-contracts.ts`: phục hồi dữ liệu và sửa từng mục.
- Các bài trên dùng phản hồi giả lập, không gọi AI, tạo voice hoặc xuất video. Chưa nghiệm thu độ cuốn hút bằng video mới; cấu hình định hướng cách viết và không bảo đảm mọi lần AI đều đạt chất lượng mẫu.
- Đã kiểm giao diện thật: lựa chọn xuất hiện, chọn được và khôi phục đúng sau khi tải lại và hoàn tất tải cấu hình. Đã trả lựa chọn thử về Tự động. Ảnh xác nhận: `scratch/history-story-genre-20261028/genre-menu.png`.
- Backend đã nạp bản sửa tại cổng 3002, PID 88224; kiểm HTTP đạt 200. Trước khi khởi động lại không có khóa production, các công việc gần nhất đã hoàn tất hoặc hủy.
