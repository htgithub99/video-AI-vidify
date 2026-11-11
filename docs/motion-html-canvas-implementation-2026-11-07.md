# Báo cáo triển khai Video Motion HTML Canvas

Ngày 07/11/2026. Thay đổi nằm trong source của workspace; chưa đóng gói bản cài Electron và chưa tạo commit.

Chỉ dẫn gửi AI và mô tả sản xuất trong template dùng tiếng Anh, gồm tiêu đề mục 0–4, hành động, continuity và SFX. Lời đọc, thoại, phụ đề, tiêu đề dành cho khán giả và chữ trong video theo ngôn ngữ người dùng chọn. Tên riêng, ID, trích dẫn nguồn và chữ cần hiển thị nguyên văn được giữ. AI diễn đạt phần mô tả từ nguồn/ghi chú khác ngôn ngữ trong cùng phản hồi; không thêm lượt dịch hoặc QA. Cảnh đã lưu vẫn giữ prompt gốc khi resume/retry; lượt viết/phân cảnh mới dùng chính sách tiếng Anh.

## Luồng đã triển khai

```text
Phân tích theo thể loại/cách kể/thời lượng
→ Viết lời + sceneTemplateDraft mục 0–4 trong cùng phản hồi
→ Phân cảnh thành sceneTemplate hoàn chỉnh, ánh xạ dòng lời
→ Một phản hồi AI trả trọn HTML Canvas/Vanilla JS
→ Lưu raw, prompt, HTML và trạng thái yêu cầu
→ Phát thật qua renderAt trong iframe cô lập
→ Chrome dựng Canvas theo timeline → FFmpeg → MP4 + audio/phụ đề/nhạc/SFX
```

Cả history, horror và explainer dùng luồng này, với mô tả phong cách riêng bằng chữ. API vẫn giữ engine/mode `remotion` để tương thích các caller hiện có; discriminator `renderer: "html-canvas"` chọn đường mới. HTML không nằm trong trường SVG hoặc asset giả.

Nhánh mới không gọi bộ chấm điểm, chọn bản tốt nhất, QA hình/chuyển động, normalize/patch SVG, frame người/vật/thú, object sheet, rig hoặc tác vụ director/repair sau dựng. `nodes: []` chỉ là vỏ tương thích type cũ. Dữ liệu nhận dạng đưa vào prompt được chọn từ các trường mô tả bằng chữ.

Thành công nghĩa vận hành: tài liệu được tải và vẽ được frame sử dụng thực tế. Không có phép đo hình đẹp, đủ chi tiết, đúng tiếp xúc hay chất lượng lịch sử. Một kết quả chạy được nhưng vẽ chưa tốt không bị code gọi AI sửa.

## Lỗi, tiếp tục và xuất video

- Giữ kết quả chạy được đầu tiên; không sinh thêm lượt motion/QA.
- Lỗi thực thi của HTML làm tạo lại toàn bộ cảnh từ prompt đã lưu, không gửi patch. Không có trần ba/năm lần thử.
- Chờ retry tăng tới 30 giây, trả slot AI để cảnh khác làm tiếp; nút dừng vẫn hủy được.
- Lỗi ghi file/Chrome/FFmpeg dùng lại phản hồi hoặc HTML đã có. Timeout chưa rõ nguyên nhân được chạy lại trước khi phân loại lỗi thực thi tái hiện.
- Request ID, worker, URL phòng và trạng thái đã gửi được lưu để đọc tiếp yêu cầu cũ. Khi chưa rõ kết quả, không tự gửi trùng.
- Cảnh đã hoàn tất được giữ khi resume, bao gồm resume cùng một thao tác dựng lại. Thao tác dựng lại mới có mã ý định mới.
- Lỗi JavaScript chỉ xuất hiện giữa video được xử lý khi xuất tới frame đó; tạo lại đúng cảnh và cập nhật hash cache segment.
- Preview có play/pause/tua và chế độ thử tương tác riêng; export theo diễn biến tự chạy. Tắt motion giữ hình tĩnh, audio/phụ đề/timeline vẫn chạy.
- Dự án SVG cũ giữ renderer cũ. Đã có điều phối preview/export cho dự án trộn SVG và Canvas. Chế độ kho tiếp tục dùng nhánh hiện có.

## Bốn cấu hình nội dung

| Cấu hình | Thay đổi |
| --- | --- |
| Thể loại | Một hợp đồng tác giả xuyên phân tích/viết/biên tập; bỏ yêu cầu mâu thuẫn về số ứng viên, ngôi kể, thứ tự mở đầu và số chương cố định cho nhánh mới. |
| Cách kể | Bám nguồn/sinh động/cuốn hút có hướng dẫn khác nhau về stakes, nhịp câu, tiết lộ và payoff trong cùng ngân sách lời. |
| Thời lượng | Mốc chọn cố định không tự nhân theo cách kể hoặc clamp theo nguồn. Tổng chương giữ ngân sách chung; writer nhận tốc độ đọc và phần pause dành trước. Lưu riêng mốc chọn, dự kiến, ước tính lời/pause và audio thực. |
| Nhịp hình | Truyền mục tiêu 14/9/6 giây vào authoring. Một Canvas phủ được nhiều beat/câu; biểu cảm, cử chỉ hoặc đổi chủ thể được nhắc không tự buộc tách file cảnh. Hiển thị thời lượng từng cảnh từ timeline. |

Đây là thay chỉ dẫn và cơ chế ngân sách. Độ hấp dẫn và việc audio thật đạt 108–132 giây cho mốc hai phút cần nghiệm thu bằng nội dung/giọng thật; JSON hợp lệ và ngân sách đúng không chứng minh hai điều đó.

## Các cấu hình còn lại

Snapshot lưu đủ 19 mục trong ảnh. Giữ ngôn ngữ, đổi tên, số phần, kênh giọng, một/đa giọng, ASR, nhạc, SFX, motion, phụ đề, tự viết, tự xuất và cleanup Gemini.

ASR thuộc pipeline giọng, hoạt động độc lập với việc bỏ QA cảnh. SFX lấy sidecar trong cùng phản hồi phân cảnh; không cần nodes. Đổi phụ đề/motion/âm lượng dùng cấu hình compile/export, không bắt AI sinh hình lại. Tắt tự xuất không bị auto-run bật ngược lại.

Cleanup Gemini giữ phạm vi chức năng hiện có: hoạt động **Một ngày qua** của tài khoản, sau khi tác vụ AI nhả và dữ liệu được lưu. Đã kiểm đường truyền cấu hình bằng mô phỏng; không thực hiện phép thử xóa lịch sử thật.

## Bằng chứng kiểm tra

| Kiểm tra | Kết quả/phạm vi |
| --- | --- |
| `npm run test:motion-html` | Qua transport DOM Gemini/ChatGPT trả nguyên HTML; ba profile; hơn ba lần lỗi rồi thành công; resume; Chrome Canvas thật; MP4 thật; 36 tổ hợp tác giả; 19-control snapshot; lỗi frame muộn. Nội dung AI dùng fixture. |
| `npm run test:motion-html-export` | Qua luồng job/cache/mux/publication ở 1920×1080, 30fps, có audio/SFX/phụ đề và video trộn SVG/Canvas. Audio tổng hợp bằng FFmpeg, không phải TTS thật. |
| `npm run test:motion-settings` | Qua backend ma trận 16 tổ hợp profile/thể loại và UI Chrome với hook/API, IndexedDB/reload/resume, ASR và output stale. Provider/media trong các bài này được mô phỏng. |
| `scripts/verify-motion-production-runner.ts` | Qua công việc song song, resume theo bước, idempotency, hủy và lưu dữ liệu. |
| `scripts/verify-chat-response-snapshots.ts` | Qua hồi quy trích phản hồi của các tác vụ JSON hiện có. |
| TypeScript/lint/build | `tsc --noEmit`, ESLint các file thay đổi và Vite build đã qua; Vite còn cảnh báo kích thước chunk hiện có. |

Tệp bằng chứng:

- `scratch/motion-html-implementation-20261107/verification.json`
- `scratch/motion-html-settings-20261107/verification.json`
- `scratch/motion-html-recovery-20261107/verification.json`
- `scratch/motion-html-export-20261107/verification.json`
- `scratch/motion-html-export-20261107/canvas-with-audio.mp4`
- `scratch/motion-html-export-20261107/mixed-legacy-canvas.mp4`

Lượt Gemini thật đã thành công tại `scratch/motion-html-live-1794038595678/verification.json`: Gemini Flash low viết lời và phân cảnh, Flash medium trả HTML 28.003 ký tự; đúng ba yêu cầu nội dung, cảnh chạy được ngay lượt đầu. HTML được compile và xuất thành `scene.mp4` 640×360, 30fps, 10,7 giây theo timeline thử. Đây là thử bằng thời lượng gán cho lời, **không có TTS thật**. File `writing.json`, `script.json` và artifact raw/HTML lưu kèm để truy ngược.

Các lượt đầu bị ngắt phiên Chrome trước khi nhận HTML được giữ riêng tại `scratch/motion-html-live-1794036503124/failure.json`; không tính chúng là lượt chạy thành công. Bài thử sau dùng một scope riêng. Các sửa cuối về schema riêng cho template và lưu lại raw khi ghi file lỗi được nghiệm thu bằng các bài kỹ thuật bổ sung; video Gemini trên chứng minh đường tạo HTML/renderer đã hoạt động thực tế.

## Giới hạn bàn giao

- Chưa chứng minh audio TTS thật của video hai phút nằm trong ±10%; thời lượng xuất luôn dùng audio thực.
- Chưa coi ba profile đã được xem và chấp nhận về thẩm mỹ/chuyển động chỉ từ các fixture kỹ thuật.
- Không có bảo đảm tốc độ xuất 60fps; FPS video vẫn theo lựa chọn người dùng.
- Không sửa nội dung hoặc xóa production gốc để chạy các fixture. Dữ liệu test nằm trong scratch/storage riêng.
- Chưa đóng gói/cài đặt bản Electron mới; bản build ở đây là Vite frontend.


## Bổ sung: khôi phục, JSON và ranh giới bước viết/dựng cảnh

- Nút Khôi phục/Thử lại của lượt trả lời Gemini tăng từ 2 lên tối đa 5 lần cho một chu kỳ phục hồi. Luồng tạo lại nguyên cảnh khi HTML lỗi vẫn thử đến khi chạy được hoặc người dùng dừng.
- SCRIPT chỉ hoàn tất sau khi lời dẫn đã biên tập và tất cả nhóm lời dẫn đã chia thành cảnh, ánh xạ đủ dòng, lưu prompt 0–4 cùng SFX. `planMotionHtmlScenes` không tạo HTML.
- SCENES dùng duy nhất danh sách cảnh đã lưu. `buildMotionHtmlScenes` không gọi AI chia cảnh; thiếu hoặc đổi kế hoạch thì yêu cầu hoàn tất SCRIPT. Tiến độ dựng hiển thị số cảnh thật thay vì số nhóm lời dẫn.
- Production cũ có lời dẫn nhưng chưa có phân cảnh hiện hành được đưa về SCRIPT khi tiếp tục. Giữ lời dẫn và bỏ biên tập lại khi không còn chương cần viết. Không dựng sớm HTML trong lúc SCRIPT đang viết hoặc chia cảnh.
- Parser AI sửa xác định escape dấu nháy đơn `\'` trong chuỗi JSON. Giữ escape JSON hợp lệ; không tự sửa escape không biết. Dùng chung ở bước đọc phản hồi trình duyệt và đọc JSON nghiệp vụ. Phản hồi lỗi đã lưu gồm 6 cảnh được đọc lại thành công bằng code, không gửi AI thêm.
- Prompt tiếng Anh giữ đủ mục 1 của mẫu cho history/horror/explainer: viền #382e26, nét 3–4 và đầu nét/góc tròn; đầu trắng #f7f5f0, bóng trăng khuyết bên trái; thân trụ, tay chân ống xoay khớp; đủ bốn nhóm biểu cảm. Quy chuẩn cố định ưu tiên hơn mô tả style cũ; khóa cache tạo HTML cũng chứa quy chuẩn này.
- Thêm hồi quy `verify-motion-html-stages.ts` chạy action SCRIPT thật bằng AI giả lập, kiểm hoàn tất mọi nhóm trước khi kết thúc SCRIPT, giữ lời dẫn khi phục hồi, SCENES chỉ dựng và báo 3/3 cảnh. Luồng production cũ thiếu kế hoạch cũng được kiểm tra. `verify-chat-room-lifecycle.ts` thao tác menu Khôi phục Gemini trong Chrome cục bộ, kiểm thành công lần 5 và không bấm lần 6. Không gọi nhà cung cấp thật trong các kiểm thử này.

- Xác nhận sau sửa: `npm run test:motion-html`, `npm run test:motion-html-export`, `npm run test:motion-settings`, runner production, lifecycle phòng chat, TypeScript và ESLint các file thay đổi đều qua. Bài export dùng job/cache/mux thật và tách riêng handoff trình duyệt AI bằng fixture; Chrome render/FFmpeg/MP4 vẫn chạy thật. Backend dev đã tự nạp source mới, cổng 3002 trả HTTP 200. Các kiểm thử không sửa production gốc.
