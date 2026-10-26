# Kỳ truyện ma dân gian: khóa đề tài và cách kể

## Phạm vi

Nguồn tham chiếu là bản chép lời người dùng cung cấp của “Thần trùng – Trùng tang kỳ truyện”. Học cách kể đời thường, góc nhìn người trong cuộc, nén thời gian, tăng bằng chứng, đối thoại và hậu quả; không sao lại chuỗi biến cố, câu văn hoặc nghi lễ đặc trưng. Nguồn về trùng tang thì truyện mới vẫn xoay quanh trùng tang. Hợp đồng mới áp dụng cho thể loại `ghost_tale`.

## Đã sửa

- Constants `motionFolkStory.ts` giữ hồ sơ kể chuyện có phiên bản, dùng ở lập dàn ý, viết/sửa chương, tạo DNA và biên tập. Hồ sơ độc lập với danh sách DNA bị rút gọn. Cho phép kể gọn sinh hoạt và khoảng thời gian dài; không ép mỗi việc nhỏ thành cảnh hoặc bắt buộc có trẻ nhỏ/thầy/nghi lễ.
- `folkStoryContract` lưu phiên bản, profile ID, khóa nguồn, tên, nghĩa cốt lõi, tên gọi tương đương và bằng chứng nguồn. Đề tài có trong danh mục ưu tiên tên trong tiêu đề rồi tần suất trong nguồn; đề tài chưa có dùng một câu hỏi chỉ trích xuất, có checkpoint và phục hồi hữu hạn. Bước đọc nguồn không sáng tác truyện mới.
- `topicId/topicEvidence` phải khớp đề tài khóa và trích đúng sự kiện của chương mới. Kiểm chủ đề trong tiền đề, sự kiện nhân quả và bằng chứng chương; chỉ nhắc trong tiêu đề chưa đạt. Tín ngưỡng khác đề tài bị sửa theo hợp đồng đã khóa.
- Bỏ yêu cầu đổi cả luật và nguồn gốc tín ngưỡng để đạt tính mới. Phân biệt tài liệu nội bộ, dị bản địa phương, điều nhân vật tin và luật hư cấu; không gắn nhãn nghi thức AI/source sáng tác là truyền thống đã xác minh.
- Mỗi phần viết nhận mạch nhân quả/manh mối liên quan chương, hồ sơ ngắn và đề tài khóa; không gửi lại trích đoạn truyện mẫu để hướng dẫn viết. Rút gọn hướng dẫn ngôn ngữ ở planning/repair/DNA.
- Editor nhận trích đoạn nguồn thật theo chương, thay cho dàn ý truyện mới bị gắn nhãn “MODEL STORY”. Kiểm chuỗi trùng từ 20 từ liên tiếp trong dàn ý/lời kể; đây là phát hiện trùng văn bản, không phải chứng nhận bản quyền hay phát hiện mọi cách diễn đạt lại.
- Phát hiện tên tín ngưỡng khác mới xuất hiện ngoài nội dung chương đã duyệt, chuyển riêng beat đó sang sửa. Đề tài ngoài danh mục vẫn cần AI biên tập đánh giá nghĩa.
- Chỉ nhận sửa thoại nếu đủ số đoạn, cùng thứ tự, người nói/vai và toàn bộ lời nối đúng narration. Giữ ID/thông số giọng; sửa sai hoặc thiếu phân vai bị bỏ qua. Thể loại khác tiếp tục bảo vệ thoại như trước.
- Lỗi chép riêng chương chỉ cập nhật chương bị đánh dấu. Nháp cũ giữ nội dung, bổ sung hợp đồng còn thiếu; revision cho thử phục hồi hợp đồng mới một lần theo ngân sách hữu hạn. DNA nháp có khóa phụ thuộc nội dung để tránh dùng lại DNA của dàn ý đã thay đổi.

## Kiểm cục bộ

- `npm run test:motion-story-craft`: cả bài cũ và `verify-motion-folk-story.ts` đạt; kiểm đổi/mất đề tài, bằng chứng giả, chủ đề mới, gián đoạn và tiếp tục không hỏi lại đề tài, câu trùng nguồn, profile ở chương gói đóng, tham chiếu editor, thoại hợp lệ và từ chối đổi giọng/thiếu lời.
- `verify-motion-ai-recovery.ts`: đạt với browser/AI giả, giữ phục hồi room/chuyển nhà cung cấp.
- `verify-motion-simple-illustration.ts`: đạt với nháp lỗi cũ được bổ sung metadata đề tài của fixture; giữ sửa minh họa từng phần/tiến độ.
- `verify-motion-dna-repair.ts`: đạt, giữ sửa DNA theo trường và dữ kiện đã đạt.
- TypeScript và whitespace diff được kiểm.

Không tạo/tiếp tục/xuất video hoặc gọi AI/TTS thật. Chất lượng truyện trên model thật, nhịp giọng và độ hấp dẫn cần người dùng nghiệm thu bằng lượt tạo của mình. Kiểm từ khóa/bằng chứng không chứng minh toàn bộ ý nghĩa truyện, không bảo đảm mọi phản hồi AI đều đạt hoặc mọi nội dung đều không vi phạm bản quyền.

## Nạp bản sửa

Đã kiểm không có tác vụ hiện hành và khởi động lại đúng backend ở cổng 3002 để nạp module mới. API kho phản hồi thành công, giữ hai gói. Hồ sơ `rendering` lịch sử từ 18/10 không được chạy tiếp. Người dùng tải lại trang rồi dùng lượt tạo/phân tích mới để nghiệm thu nội dung; không tự viết lại video đã hoàn thành.
