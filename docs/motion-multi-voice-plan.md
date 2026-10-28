# Lời thoại tự động cho Motion Video

Cập nhật 13/10/2026. Màn Motion chỉ có bốn bước; không có panel, nút cập nhật lời thoại, chọn giọng, upload voice hoặc bảng chỉnh SFX. VieNeu-TTS đã được tích hợp vào luồng dựng cảnh, xem trước và xuất MP4. AI33 đã được bỏ khỏi Motion Video; các màn khác giữ cấu hình riêng.

## Luồng hiện tại

1. Đọc Video DNA, thể loại, dàn nhân vật và các phần kịch bản để phân biệt phim, kể chuyện, tài liệu, giải thích hoặc hỗn hợp trước khi dựng cảnh. AI tự chọn voice id từ catalogue thật; lựa chọn sai giới tính đã biết bị loại. Cùng một audio direction được đưa vào dựng hình, sound planning, voice và mix. Bước viết kịch bản xuất lượt thoại với speaker, vai trò, cách đọc, từ nhấn và khoảng nghỉ. Tổng chữ nói phải khớp lời thoại gốc. Dự án cũ được planner tách lời dẫn và hội thoại có nguồn người nói; không xác định được thì đọc nguyên văn bằng người dẫn. Không ép mọi video thành hội thoại hoặc tự thêm trích dẫn cho nội dung factual.
2. Chọn giọng từ catalogue thật và giữ một nhân vật → một giọng xuyên suốt video. Nữ/nam dùng metadata thật. Vai cao tuổi ưu tiên preset kể chuyện: lựa chọn heuristic, chưa phải catalogue tuổi đã được nghe tuyển chọn. Chất giọng/tuổi nghe được vẫn phụ thuộc catalogue VieNeu hiện có; không cam kết một preset có tuổi giọng chính xác.
3. Dựng cảnh tự gọi VieNeu trước khi hoàn tất. Dự án có cảnh sẵn nhưng thiếu voice hợp lệ cũng tự tạo khi mở lại. Đổi câu/giọng/tốc độ/khoảng nghỉ cập nhật audio tự động; clip không đổi dùng lại cache.
4. Tạo WAV 48 kHz từng câu, đo thời lượng thật và xếp cùng khoảng nghỉ. Timeline điều chỉnh cảnh, camera, SFX, chương SEO và phụ đề. Timing từng câu theo audio; chia nhỏ phụ đề trong câu vẫn theo tỷ lệ chữ, chưa có forced alignment từng từ.
5. Người dẫn ở giữa; thoại có stereo nhẹ theo vị trí người nói và camera tại đầu câu. Cân mức âm, lọc rumble, fade và hạn chế đỉnh; duck SFX/ambience theo voice. Preview và MP4 cùng dùng một master chứa lời thoại và SFX.
6. Preview chờ bản phối đúng phiên bản trước khi cho phát. Xuất xong, khung xem trước phát MP4 đã có âm thanh. Phát, dừng và tua được kiểm tra bằng trình duyệt với video/audio thực.

## Runtime

- Ghim `vieneu==3.8.3`, `onnxruntime==1.24.1`, chế độ `v3turbo`, precision fp32. Máy hiện tại đã tạo audio thực bằng CPU; chưa đo GPU.
- Lần đầu tự tạo Python venv và tải model. Runtime, model, mẫu và hồ sơ giọng nằm dưới `storage/vieneu`, hoặc data directory của app đóng gói.
- Worker giữ model trong bộ nhớ, dùng hàng đợi JSONL, đóng sau 5 phút rảnh. Có timeout, hủy đang chạy/chờ và restart cho lần tiếp theo.
- Graph ONNX và external data được tải cùng thư mục vật lý để tránh lỗi Windows/Hugging Face symlink cache.
- Python riêng: `MOTION_VIENEU_PYTHON`; backend: `MOTION_VIENEU_BACKEND`.
- Mẫu voice cần ít nhất 3 giây, tối đa 20 MB; dùng tối đa 8 giây đầu. Hồ sơ được lưu/nạp qua restart. Runtime vẫn hỗ trợ hồ sơ giọng lưu trong thư viện; giao diện không yêu cầu mẫu voice. Đầu vào ảnh style tối đa 4 ảnh.

Theo [repo VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS), v3 Turbo có preset và voice cloning. `style` không điều khiển cảm xúc thực; tag diễn xuất còn thử nghiệm. Bản tích hợp dùng dấu câu, nghỉ, mức âm và time-stretch nhẹ giữ pitch, không coi tham số bị bỏ qua là điều khiển diễn xuất. Chưa cam kết ngữ điệu/tuổi giọng chính xác hoặc lip-sync. v4 không thuộc tích hợp này.

## Giao diện và lỗi

Voice và SFX luôn tự chạy cùng luồng dựng video, gồm cả project cũ từng tắt SFX hoặc có override thủ công. Giao diện không có bước thao tác âm thanh riêng. Lỗi kỹ thuật được thử lại có giới hạn, giữ clip tốt để dựng tiếp. Khi thay kịch bản, nhân vật hoặc thể loại, signature làm hết hạn kế hoạch/track cũ; các câu không đổi vẫn dùng lại cache.

Planner lỗi hoặc trả chữ không khớp → giữ lời thoại gốc. Cảm xúc là advisory, không chặn vì điểm QA. TTS retry kỹ thuật có giới hạn; giữ clip tốt để resume. Không âm thầm đổi giọng một câu hoặc dùng audio cũ khác nội dung. Audio rỗng/hỏng hoặc thiếu thoại được báo rõ; preview chờ audio hoàn tất. File tạm được dọn khi lỗi/hủy.

## File chính

| File | Vai trò |
| --- | --- |
| `src/constants/motionVoice.ts` | Text, URL, cấu hình và prompt |
| `src/lib/motionVoice.ts` | Chuẩn hóa câu, phân vai, signature |
| `src/server/services/vieneuTtsService.ts` | Runtime, worker, hàng đợi, hủy, catalogue |
| `python_scripts/motion_vieneu_worker.py` | VieNeu, cloning và lưu hồ sơ |
| `src/server/services/motionVoiceDirectionService.ts` | Kế hoạch câu, cache, fallback |
| `src/server/services/motionAudioService.ts` | Clip và voice stem stereo |
| `src/server/services/motionStoryService.ts` | Lượt thoại từ bước viết kịch bản |
| `src/server/services/motionDirectorService.ts` | Timeline/phụ đề theo clip |
| `src/features/motion/hooks/useMotionStudio.ts` | Tự tạo voice, invalidation, preview, xuất |
| `src/lib/motionAudioDirection.ts` | Phân biệt format, chuẩn hóa đặc điểm nhân vật và định hướng âm thanh chung |

## Kiểm chứng

- `npm run test:motion-voice`: vai ổn định, giữ chữ, cache theo câu, timing stereo, stale-track rejection/fallback; bốn giọng VieNeu thực + SFX + xuất MP4 và so PCM master; trình duyệt kiểm tra tự tạo, phát/dừng/tua, không có controls âm thanh thủ công, chuyển project cũ sang tự động và phát MP4 kết quả.
- `npm run test:motion-voice-runtime`: mẫu giọng thực, lưu/nạp qua restart, tạo bằng giọng đã lưu, hủy chờ/đang chạy và restart.
- `npm run test:motion-sound`, `npm run test:motion-controls`: hồi quy SFX, ảnh mẫu, nhân vật và điều khiển cảnh.

Fixture gồm người dẫn, nữ, nam và vai ông già dùng bốn preset riêng. TTS/mix/render chạy thực. Planner AI và lỗi provider được kiểm tra bằng test kiểm soát; chất diễn xuất/tuổi giọng vẫn cần nghe đánh giá. Khẩu hình, thoại chồng và tuyển chọn mẫu cảm xúc là phần mở rộng, không chặn xuất hiện tại.
