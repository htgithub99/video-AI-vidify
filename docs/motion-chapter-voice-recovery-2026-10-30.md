# Phục hồi kịch bản theo cấu hình giọng — 30/10/2026

## Nguyên nhân

- `multiVoice` được lưu trên dự án nhưng chưa truyền vào `writeChapterBeats`. Chế độ một người kể vẫn nhận hướng dẫn phân vai và bị chặn bởi dữ liệu `utterances` tùy chọn.
- AI có thể chép toàn bộ lời dẫn vào một dòng người kể rồi thêm lại lời thoại nhân vật. Kiểm tra phát hiện lặp là đúng; bước chuẩn hóa phía sau không thể xử lý vì QA thô đã chặn.
- Bản nháp có `repairState.rejected = 3` bị chặn ngay khi tiếp tục, dù chưa gửi request mới.
- Ghép bản sửa đang thay thế đúng trường `utterances`; không phải lỗi nối mảng.

## Thay đổi chung cho Kho và Remotion

1. Truyền cấu hình giọng từ action viết kịch bản vào từng chương, từng phần của chương và khi phục hồi. Mặc định vẫn là nhiều giọng.
2. Một giọng: yêu cầu viết nguyên lời dẫn; có thể bỏ `utterances`. Lỗi dữ liệu phân vai tùy chọn không chặn chương hợp lệ. Kiểm tra lời dẫn bắt buộc, địa điểm và nhân vật vẫn giữ.
3. Nhiều giọng: giữ kiểm tra người nói và nội dung đọc thiếu/lặp/sai thứ tự.
4. Sửa cục bộ trước QA khi chỉ có một dòng người kể chứa đầy đủ lời dẫn và mỗi dòng nhân vật khớp duy nhất một câu trích nguyên vẹn. Tách theo vị trí câu trích trong lời dẫn, giữ người nói, ID lời thoại và hướng dẫn giọng. Không suy đoán người nói, không xử lý câu trích trùng/không rõ vị trí hoặc thiếu nội dung.
5. Không thay lời dẫn; không sửa hoặc xóa dữ liệu phân vai hợp lệ để chuyển về một giọng. Dữ liệu phân vai không hợp lệ không đi vào âm thanh; luồng một giọng đọc lời dẫn đầy đủ. Nếu chuyển lại nhiều giọng và thiếu dữ liệu hợp lệ, bước phân vai hiện có chịu trách nhiệm dựng lại.
6. Chấp nhận khóa bản nháp cũ tương đương khi thay hướng dẫn giọng để không viết lại các phần đã hoàn tất. Các khác biệt nguồn/nội dung khác vẫn làm mất hiệu lực khóa.
7. Đọc lại và sửa cục bộ bản nháp trước khi kiểm ngân sách. Chỉ bản nháp hết lượt mà còn lỗi riêng `utterances` được cấp một ngân sách phục hồi theo revision `motion-chapter-speech-alignment-20261030`. Lưu lịch sử và revision vào checkpoint; tiếp tục không cấp lại vô hạn. Không đặt lại ngân sách lỗi khác hoặc ngân sách sửa thời lượng.

## Kiểm chứng

- `npm run test:motion-chapter-speech`: request đầu sửa lặp cục bộ; một/nhiều giọng; cả hai cách dựng; lỗi câu trích mơ hồ; giữ dòng đã đạt; sửa riêng trường lỗi; ngân sách hữu hạn; chương chia nhiều phần và phục hồi; không nới QA địa điểm/lời dẫn. Mock AI, không tạo video.
- Đạt: response contracts, field repair, voice attribution, QA policy, prompt resume, voice mode UI; TypeScript và ESLint các nguồn sửa.
- Phát lại offline bản nháp dự án `df31481189a1e3006e2c91b1fd3a3598`: nhận đủ 17 nhịp, chỉ sửa `c1:beat:14`, hết pending, không gọi AI. Kiểm hash xác nhận không sửa file dự án thật. Biên bản: `scratch/chapter-speech-audit-20261030/project-recovery.json`.
- Hai bài kiểm tra cũ dừng ở cùng assertion trên cả code trước và sau lượt sửa: narrator-recovery vẫn mong hai request nhưng cơ chế chia phần hiện có gửi một; production-runner dùng fixture sửa thời lượng không còn kích hoạt. Đối chứng code trước lấy từ Git index, lưu trong `scratch/chapter-speech-audit-20261030/baseline-*.json`. Chưa chỉnh các fixture này trong phạm vi sửa phân vai.

Không thay prompt dựng cảnh ba kiểu hình, bộ render, cấu hình review hoặc dữ liệu tài nguyên. Không tự chạy tiếp dự án thật trong kiểm chứng.
