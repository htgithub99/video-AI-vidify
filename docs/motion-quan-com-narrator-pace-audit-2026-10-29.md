# Kiểm tra nhịp người kể — Quán Cơm Nửa Đêm Bị Đoạt Hồn

## Phạm vi

- Kiểm tra dữ liệu lượt dựng `c2b69d9d2b6dffb8f6195f085cd10375`, 18 đoạn người kể, video khoảng 124,57 giây.
- Đối chiếu bằng phép đo audio và đọc code; chưa sửa pipeline, tạo giọng mới hoặc xuất lại video.
- File mẫu đúng là `C:/Users/Admin/Downloads/Thần trùng - Trùng tang kỳ truyện.mp3`. SHA-256 khớp manifest cấu hình: `c30903fb126f71e71d9638113a2d7196458579e877406a704b3ef6a703337331`.
- Mốc tham chiếu hiện tại được lấy từ giây 120–180 của file mẫu. Giọng clone lấy đoạn 128,3–135,25; đoạn dùng lấy màu giọng và đoạn đo nhịp có mục đích khác nhau.
- Kết quả chi tiết: `scratch/voice-pace-quan-com-20261029/audit.json`; script đọc và đo: `audit.ts` cùng thư mục.

## Kết quả

Chuẩn đã lưu: 3,633 tiếng/giây tính cả khoảng nghỉ; tỷ lệ thời gian có tiếng 70,2%; tốc độ khi phát âm khoảng 5,18 tiếng/giây. Đây là chuẩn của đoạn tham chiếu, không phải khẳng định cả file mẫu luôn có tốc độ chính xác đó.

| Đoạn trong video | Tiếng/giây tính cả nghỉ bên trong đoạn | Tiếng/giây khi phát âm, ước tính |
| --- | ---: | ---: |
| 00:41,805–00:48,865 — “Bỗng ngoài bến…” | 3,40 | 4,90 |
| 01:15,950–01:21,970 — “Tôi lay mạnh…” | 3,82 | 5,61 |
| 01:35,360–01:41,485 — “Sáng hôm sau…” | 3,43 | 4,77 |
| 01:49,175–01:55,305 — “Khi nhìn ra…” | 3,92 | 5,07 |

Tốc độ các đoạn nằm trong khoảng 3,40–3,92 tiếng/giây, chênh khoảng 15,2% giữa hai cực. Ước tính tốc độ phát âm nằm trong khoảng 4,77–5,61, chênh khoảng 17,7%. Trung bình tốc độ phát âm của 18 đoạn khoảng 5,18, gần chuẩn; số trung bình đã che mất khác biệt từng đoạn.

Phép đếm tiếng dựa trên văn bản cần đọc, giả định TTS đọc đủ; phép tách thời gian có tiếng dựa trên năng lượng âm thanh nên có sai số. Không dùng các con số này làm QA cứng hoặc chứng nhận phát âm đúng từng chữ.

## Nguyên nhân trong code

1. `motionAudioService.ts:316` khóa một hệ số hiệu chỉnh theo voice cho cả lượt. `motionVoiceSpeedService.ts:129` lấy hệ số từ tốc độ trung bình lưu theo voice. TTS vẫn tạo các đoạn với tốc độ tự nhiên khác nhau; một hệ số chung chỉ giữ tỷ lệ nhanh/chậm, không cân bằng tốc độ đầu ra.
2. `motionAudioService.ts:175` chỉ xử lý đoạn vượt trần tốc độ; chưa có hiệu chỉnh hai chiều theo nhịp thực tế của từng đoạn. Đoạn chậm tiếp tục chậm.
3. Giới hạn tốc độ được đo trước bước cắt khoảng lặng ở đầu/cuối (`motionAudioService.ts:180`). Cắt xong thời lượng thay đổi nhưng không đo lại; đoạn cuối có thể vượt ngưỡng vừa kiểm tra.
4. `python_scripts/motion_vieneu_speech.py` ghép các chunk và thêm khoảng nghỉ trước khi `atempo` áp vào cả audio. Do đó tốc độ phát âm và khoảng nghỉ bị thay đổi cùng nhau. Hai thông số này cần được điều khiển riêng khi khớp nhịp tham chiếu.
5. `motionAudioService.ts:438` chỉ ghi phép đo tổng sau khi ghép, chưa kiểm tra độ lệch giữa các đoạn. Các kiểm tra hiện có xác nhận cùng hệ số tempo và trần tốc độ, chưa mô phỏng các mẫu TTS có tốc độ tự nhiên khác nhau.

Các dòng `speed` 0,9/0,95/1 trong kịch bản không trực tiếp gây lệch ở lượt này: nhánh paced tại `motionAudioService.ts:155` dùng `delivery.tempo`; cả 18 đoạn có tempo 1. Giọng cũng không bị đổi giữa các đoạn. Bước ghép MP4 không áp atempo riêng.

## Hướng sửa chung

1. Giữ một hồ sơ nhịp tham chiếu bất biến cho mỗi lượt dựng: tốc độ phát âm, khoảng nghỉ dấu phẩy/chấm, khoảng nghỉ nối đoạn. Lấy đúng file Thần trùng đang cấu hình.
2. Sau khi có TTS, đo từng đoạn/cụm đủ dài, tách khoảng nghỉ khỏi phần phát âm. Điều chỉnh phần phát âm về vùng gần 5,18 tiếng/giây; giữ cao độ, giới hạn mức kéo giãn và không ép từng chữ có thời lượng bằng nhau. Câu quá ngắn hoặc phép đo thiếu tin cậy dùng hồ sơ của voice/lân cận.
3. Ghép khoảng nghỉ theo dấu câu và hồ sơ mẫu sau bước chỉnh tốc độ; tính cả đuôi âm đoạn trước và đầu đoạn sau để không cộng nghỉ hai lần. Không ép mọi câu có cùng tốc độ tổng vì số dấu câu khác nhau.
4. Đo lại sau cắt/ghép, kiểm tra phân bố và chênh giữa các đoạn cạnh nhau. Đây là kiểm tra chất lượng mềm, hiệu chỉnh tại chỗ; không dừng toàn bộ dự án vì lệch nhỏ.
5. Đổi phiên bản cache audio đã xử lý khi sửa thuật toán; tiếp tục dùng TTS gốc còn tốt. Cập nhật phụ đề và thời lượng hình theo audio mới, không ép giọng khớp cứng thời lượng cảnh cũ.
6. Bổ sung kiểm tra với TTS có cùng văn bản nhưng tốc độ khác nhau, các câu có nhiều/ít dấu phẩy, câu ngắn, khoảng lặng đầu/cuối dài và lần chạy có/không có cache.

Chỉ cần xử lý và xuất lại phần âm thanh/timeline của video này sau khi sửa; không cần viết lại truyện hay vẽ lại cảnh nếu tài nguyên hình vẫn hợp lệ.

## Đã triển khai

- Thêm `motionVoiceCadenceService.ts`: đo từng đoạn đủ dài bằng cùng phương pháp năng lượng như hồ sơ tham chiếu; chỉnh tốc độ phát âm hai chiều, bảo toàn cao độ bằng `atempo` và ghép khoảng nghỉ riêng. Giữ biên an toàn 30 ms quanh khoảng lặng để tránh cắt phụ âm.
- Chỉ áp dụng tự động cho người kể có hồ sơ tham chiếu bằng văn bản và thông số nhịp hợp lệ. Tốc độ thủ công và cách thể hiện giọng nhân vật vẫn theo cấu hình hiện có.
- Điều chỉnh có giới hạn 0,85–1,20; tối đa một lần hiệu chỉnh bổ sung từ nguồn, không xử lý lặp trên audio đã kéo giãn. Câu quá ngắn hoặc thiếu độ tin cậy dùng tốc độ dự phòng. Không gọi AI/ASR mới để cân nhịp, không dừng dự án vì lệch nhỏ.
- Đo lại sau khi cắt/ghép; lưu số trước/sau trong metadata clip và ghi tổng hợp khoảng tốc độ từng đoạn vào log. Giới hạn tốc độ của nhánh dự phòng được tính sau cắt khoảng lặng.
- Tăng phiên bản pacing lên 9; cache xử lý xét cả hồ sơ phát âm. Tách thông số hậu xử lý khỏi khóa TTS gốc, nhận lại cache gốc phiên bản cũ; cập nhật thời lượng và phụ đề theo audio mới.

### Kết quả xác minh

Chạy pipeline giọng trong thư mục kiểm tra riêng, tái sử dụng đủ 18 WAV gốc của Quán Cơm. Không phát sinh lời gọi AI/TTS, không ghi đè dự án hoặc MP4 đang có.

| Chỉ số tốc độ phát âm ước tính | Trước | Sau |
| --- | ---: | ---: |
| Nhỏ nhất | 4,77 | 5,12 |
| Lớn nhất | 5,61 | 5,23 |
| Trung bình | 5,18 | 5,17 |
| Hệ số biến thiên giữa các đoạn | 3,75% | 0,50% |

Độ phân tán giảm khoảng 86,6%. Đây là kết quả đo nhịp; chưa chứng nhận cảm nhận nghe hay độ rõ chữ của từng từ. Bản audio để nghe đối chiếu: `scratch/voice-pace-quan-com-20261029/quan-com-nhip-ke-da-can-bang.wav`. MP4 cũ cần xuất lại theo timeline mới để dùng giọng này.

Kiểm tra đạt: `tsc --noEmit`, `test:motion-voice-pacing` (gồm kiểm tra mới với TTS có tốc độ khác nhau), `verify-motion-voice-continuity.ts`, `verify-motion-voice-quality.ts`, và `verify-existing.ts` trên 18 đoạn thật. Kiểm tra mới bao gồm chỉnh hai chiều, giữ dấu phẩy, phụ đề theo audio, câu ngắn, cache và lựa chọn tốc độ thủ công.

Hai kiểm tra cũ trong chuỗi `test:motion-voice-continuity` đang lỗi độc lập với bản sửa: `verify-motion-voice-mood.ts` mong cường độ 0,4 trong khi hệ số code gốc đã là 0,35 (kết quả 0,28); `verify-motion-voice-timeline.ts` còn import module `motionGenService.ts` đã không tồn tại. Không đổi thuật toán cảm xúc hoặc phục hồi module dựng cảnh cũ để làm xanh các kiểm tra này.

Backend đã nạp code mới lúc 14:42 ngày 29/10/2026, PID 87600, cổng 3002. API dự án trả HTTP 200, `success: true`, dự án vẫn `completed`. Chỉ khởi động lại sau khi xác nhận không có dự án Motion đang chạy. Nhật ký: `storage/logs/backend-voice-cadence-20261029-144240.log`.
