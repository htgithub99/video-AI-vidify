# Mã cảnh theo kế hoạch trước kiểm tra READ — 26/10/2026

## Nguyên nhân

Job `82ff0744-3021-43d1-b67c-ab7f41a18bf3` dừng 18:36 ở nhịp `visual::1712::8ed96df8`: người kể ra thềm, chị Hai thật từ ngoài cổng về. Debug `motion-puppet-read-contract-e7dba5e0-b240-41ce-bc83-47a0ce2d2e41` có đủ scene, timeline và evidence. Scene là câu mô tả dài; `puppetKeyOf` không nhận câu này làm ID. `readOf` chỉ lấy ID đã chốt trong storyboard sau khi `cleanPuppetVisualContract` thành công nên không đến được bước thay ID. Thông báo thiếu ba trường quá chung, làm AI tiếp tục sửa câu mô tả.

## Sửa

- `assessPuppetVisualContract(raw, plannedScene)` lấy mã cảnh từ kế hoạch trước khi kiểm tra. Khi có mã kế hoạch, scene do AI trả sai, thiếu hoặc là câu dài không làm hỏng READ. Với luồng cũ không có kế hoạch, scene trong READ vẫn phải là ID hợp lệ.
- Dùng một kết quả kiểm tra chung cho dữ liệu chuẩn hóa, nguyên nhân lỗi và đường sửa. Timeline và evidence vẫn bắt buộc; các dẫn chứng phải khớp câu nguồn trong gói cố định.
- Lưu visual đã chuẩn hóa vào checkpoint, giữ fixture/timeline/evidence hợp lệ. Mã cảnh đã chốt không bị đổi qua bản sửa AI sau đó. Không thay bố cục, vị trí, nhân vật hay đồ vật để vượt kiểm tra.
- Bỏ thông báo `READ_VISUAL_INVALID` chung; dùng lỗi riêng cho `visual.scene`, `visual.timeline`, `visual.evidence`. Prompt yêu cầu chép task.scene làm ID và giữ đúng các đường sửa còn thiếu.
- Không tăng ngân sách retry hoặc reset bộ đếm. Bản nháp lịch sử có đủ nội dung được kiểm lại và nhận ngay, kể cả đã hết lượt AI. File dự án không bị sửa hàng loạt; checkpoint cập nhật khi người dùng chủ động tiếp tục.

## Kiểm tra

- `npm run test:motion-read-scene`: fixture lấy từ debug thật và storyboard thật; nhận bản nháp mà không gọi AI; giữ timeline, evidence và placement; lưu ID chuẩn; phục hồi bản nháp với rejected=6 mà không reset lịch sử; cảnh có ID legacy; trường thiếu được sửa riêng; bản sửa cố đổi scene bị giữ theo kế hoạch; dẫn chứng sai vẫn bị phát hiện.
- `verify-motion-read-contract.ts`, `verify-motion-read-objects.ts`, `verify-motion-field-repair.ts`, `verify-motion-visual-contract.ts`, `tsc --noEmit`.

Không gọi AI bên ngoài, TTS hoặc render video trong các kiểm tra. Việc qua kiểm tra dữ liệu không xác nhận dịch vụ AI bên ngoài luôn hoạt động hoặc một video thực tế đã hoàn tất.

## Nạp backend

Đã nạp lúc 18:51 ngày 26/10, PID `53780`, cổng `3002`. API vẫn trả trạng thái lỗi đã lưu của job cũ; không tự tiếp tục video. Đối chiếu SHA256 của 126 file tiến độ/bản nháp/job/log: 0 file thay đổi. Log tại `scratch/motion-scene-identity-backend-20261026-185111.stdout.log` và `.stderr.log`.
