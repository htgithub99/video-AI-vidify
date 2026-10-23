# Sửa nhịp kể Video Motion — 22/10/2026

## Yêu cầu

Giọng kể chậm, đều và liền ý, phù hợp nghe trước khi ngủ; lời thoại nhân vật vẫn có cảm xúc. Sửa quy tắc chung của pipeline, không vá riêng một truyện.

## Nguyên nhân xác định từ code và audio đã tạo

1. `motionPacedLines` từng chia lời kể ở dấu phẩy và liên từ, rồi gửi từng mảnh sang TTS. Có bản gồm 68 clip cho 27 cảnh, trung vị 9–10 âm tiết/clip. Câu mở đầu bị tách thành “Các bạn biết không,” / “nhà tôi chôn mẹ vừa tròn trăm ngày” / “thì anh trai tôi nằm vật ra chết ngay bên mép nước.” Mỗi mảnh có thể khởi động lại ngữ điệu.
2. Khoảng nghỉ cuối cảnh, đầu cảnh và khoảng cách của timeline hình được cộng dồn. Bản `voice-vieneu-ef35402232e5c33cb58ffa1bce293c8e.wav` có 25 lần nghỉ giữa clip khoảng 1,03 giây. Đổi cảnh hình không đồng nghĩa hết một ý kể.
3. Tham số tổng hợp, tốc độ hậu kỳ và âm lượng người kể thay đổi theo tâm trạng từng cảnh. Vì vậy cùng một người kể có thể nghe nhanh/chậm và mạnh/yếu khác nhau.
4. Hệ số tốc độ được học lại từ từng clip; feedback lại dùng tổng thời lượng có cả khoảng lặng để sửa hệ số chung. Điều này khiến kết quả phụ thuộc thứ tự tạo và số lần bấm tạo lại.
5. Cache chưa phản ánh đầy đủ hệ số tốc độ thực dùng. Ngoài ra, khi track không còn hợp lệ, bước compile vẫn có thể lấy lại chính audio cũ qua `audioId` dự phòng.

## Thay đổi

- Giữ nguyên mỗi lượt lời khi gửi TTS; bỏ cách băm lời kể ở liên từ và dấu phẩy. Engine vẫn có thể chia nội bộ khi chạm giới hạn độ dài của nó.
- Với chế độ truyện ma, giữ cố định nhiệt độ tổng hợp, tốc độ nền và âm lượng của người kể qua các tâm trạng. Không dùng tốc độ thay đổi từng câu do AI đề xuất cho người kể trong chế độ này. Lời thoại nhân vật vẫn được diễn cảm.
- Tốc độ nền của người kể là 0,94 lần trước khi áp dụng hệ số giọng. Giữ thiết lập tốc độ và giọng mẫu đã lưu của người dùng. Nếu có nhịp được đo từ mẫu audio, dùng cấu hình nhịp mẫu đó.
- Tính khoảng nghỉ một lần trên chuỗi lời đọc xuyên qua ranh giới cảnh: mặc định 0,16 giây khi nối vế, khoảng 0,4 giây hết câu, 0,65 giây ở dấu lửng, 0,85 giây đổi chương. Có giới hạn cho gợi ý nghỉ của AI; đổi người nói có nhịp riêng.
- Timeline hình, phụ đề và clip nói dùng cùng thời gian thực của track. Với track kể liên tục, bỏ khoảng đệm hình vốn làm cộng thêm im lặng và tránh chuyển cảnh trễ sau khi câu mới đã bắt đầu.
- Khóa hệ số tốc độ theo giọng trong mỗi lượt tạo. Giọng chưa có số đo chỉ hiệu chỉnh một lần từ câu đủ dài; câu quá ngắn không được dùng học tốc độ. Cache mẫu hiệu chỉnh không được làm mất bước đo lại khi số đo đã bị xóa.
- Feedback tổng thời lượng chỉ ghi log, không thay đổi hệ số dựa trên các khoảng lặng. Đổi tốc độ làm hết hạn track và clip đã xử lý; có thể tái dùng âm thanh TTS gốc để tránh tổng hợp thừa.
- Compile trả cờ `voiceStale` khi track đã hết hạn và không trộn lại audio đó qua đường dự phòng. Luồng xuất tạo lại giọng trước khi tiếp tục; audio tải lên thủ công vẫn hoạt động.
- Tăng phiên bản cache của plan, clip, track và chữ ký giọng để audio cũ không được coi là kết quả của pipeline mới.

## Bản nghe thử thực tế

Giữ đúng giọng người kể đang dùng, tạo lại 5 câu mở đầu từ bản audio gần nhất. Không gọi AI viết nội dung, không thay đổi thiết lập giọng, không render video.

- Trước sửa: `scratch/voice-pacing-audit/truoc-sua.wav`.
- Sau sửa: `scratch/voice-pacing-audit/sau-sua.wav`, khoảng 33 giây.
- Metadata: `scratch/voice-pacing-audit/preview.json`.
- Số đo tín hiệu: `scratch/voice-pacing-audit/pace-measurement.json`.

Năm câu sau sửa đều có temperature 0,76, tempo nền 0,94, gain 1; bốn khoảng cách giữa clip đều 0,4 giây. File `storage/vieneu/voice-speed.json` được so sánh trước/sau và giữ nguyên.

Bộ đo tín hiệu ước lượng tốc độ tổng thể trước/sau là 3,461/3,480 âm tiết/giây; tốc độ trong lúc có tiếng là 5,46/5,32. Khoảng nghỉ dài ở phân vị cao giảm từ khoảng 1,1 xuống 0,47 giây. Các số đo là ước lượng bằng tín hiệu, không phải bản chép lời hay đánh giá nghe. Mục đích là giảm việc đọc nhanh rồi dừng lâu, giữ tổng nhịp kể chậm và liền mạch.

Chưa có công cụ nghe trực tiếp trong phiên này. Không khẳng định đã nghe toàn bộ 22 video mẫu hay bản nghe thử. Việc nghiên cứu 22 video trước đó là xem các cảnh được lấy mẫu, không phải nghe hết thời lượng. Chất giọng, độ hấp dẫn và mức phù hợp để ngủ cần được đánh giá bằng bản nghe thử; TTS vẫn có thể biến thiên ngữ điệu tự nhiên bên trong câu.

## Kiểm tra

Đã qua:

- `scripts/verify-motion-voice-pacing.ts`: giữ nguyên câu, ổn định tốc độ qua cảm xúc/câu dài ngắn, nghỉ theo ngữ cảnh xuyên cảnh, đồng bộ cảnh/phụ đề, cache tốc độ, hiệu chỉnh một lần, không học từ câu ngắn, feedback không trôi hệ số; kiểm trực tiếp compile không trộn track cũ và vẫn nhận audio tải lên.
- `scripts/verify-motion-voice-continuity.ts`: giữ tốc độ tự nhiên, tốc độ chỉ định ở chế độ thông thường, tiếng đọc không bị hụt sau xuất AAC, cache hết hạn đúng.
- `scripts/verify-motion-speech.ts`: phân biệt kể/thoại, thời gian từ, khoảng nghỉ và miệng nhân vật; chỉ dựng ảnh tĩnh.
- `scripts/verify-motion-voice-casting-skip.ts`: giữ phân vai đã khóa, không phát sinh lượt AI phân vai không cần thiết.
- `tsc --noEmit`.

Các bài kiểm tra cũ chạy thêm còn lỗi cần bảo trì riêng:

- `verify-motion-voice-timeline.ts` nhập `motionGenService.ts`, file không còn trong cây mã hiện tại.
- `verify-motion-voice-mood.ts` đòi cường độ người kể 0,4, trong khi `NARRATOR_SHARE` hiện là 0,35 nên kết quả là 0,28. File logic này không bị sửa trong lần đối ứng nhịp kể.
- `verify-motion-voice.ts` đòi gọi TTS thêm khi chỉ đổi tốc độ; hiện audio gốc được tái dùng và hậu kỳ lại. Không sửa assertion cũ để biến bài test thành xanh.

Chạy kiểm tra mới bằng `npm run test:motion-voice-pacing`. Không chạy bài kiểm tra render video.

## Phạm vi áp dụng

Đã sửa mã nguồn tại workspace và tạo bản nghe thử. Chưa build/deploy/restart ứng dụng, chưa thay audio trong video đã xuất. Cần chạy phiên bản ứng dụng có mã mới và tạo lại giọng để video cũ nhận thay đổi.
