# Phục hồi READ và truyền prompt nhiều phần — 26/10/2026

## Lượt lỗi đã kiểm tra

Job `480e6c65-6ae3-466e-88db-de0ea0b9a820` chạy 18:01–18:02, dùng lại 30/31 READ. Bản nháp còn lại chọn sai `offering_plate` cho mâm cúng. Gemini, DeepSeek và ChatGPT không nhận request mới vì các bộ đếm cũ đã đạt hai lượt mỗi route. Grok nhận phần 1 của prompt 17.676 ký tự ba lần, trả receipt đúng nhưng tool không chuyển sang phần 2; kết thúc bằng `chat_planning_context_not_confirmed`. Chuỗi fallback trả lỗi đầu tiên nên thông báo cuối che mất lỗi truyền prompt.

## Thay đổi

- READ kiểm tra lại bản nháp trước khi phục hồi. Chỉ bản chưa đạt, còn lỗi trường đồ vật và đã chạm giới hạn cũ được cấp ngân sách mới theo revision `canonical-object-paths-v1`. Lưu bộ đếm, lỗi và routes cũ trong `state.recovery.previous`; giữ nguyên dữ liệu nháp và phần đã đạt. Bộ đếm mới vẫn có giới hạn route/tổng hiện hành. Checkpoint giữ revision để tải lại/tiếp tục không cấp lặp ngân sách cho cùng bản sửa.
- Receipt được giữ khi URL query/hash thay đổi trong cùng conversation và khi trang gán ID cho phòng vừa tạo. Điều hướng tải document chính, chuyển conversation, rời conversation và đóng trang sẽ xóa receipt. Không còn xóa receipt cho mọi sự kiện `framenavigated`.
- Fallback trả lỗi thực thi cuối cùng; route bị bỏ qua vì hết ngân sách không ghi đè lỗi thực thi đã có. Log chuỗi AI vẫn giữ từng nguyên nhân. UI giải thích riêng lỗi xác nhận prompt và giữ log gốc trong chi tiết kỹ thuật.
- Không thay prompt nội dung, giới hạn retry hiện hành, bộ kiểm tra tài nguyên hoặc kết quả đã đạt. Không sửa hàng loạt bản lưu; migration diễn ra ở checkpoint khi người dùng chủ động tiếp tục.

## Kiểm tra

- `verify-motion-read-objects.ts`: bản nháp sai với bộ đếm cũ được sửa bằng một phản hồi mô phỏng; lịch sử được giữ; lần phục hồi mới vẫn bị chặn khi hết ngân sách và không được cấp lại khi tiếp tục; bản đã đúng không gọi AI hoặc đổi lịch sử.
- `verify-chat-submission-recovery.ts`: prompt dài được gửi đủ bốn phần và lệnh thực thi, có `pushState` sau mỗi phản hồi; receipt không mất khi query/hash đổi, bị xóa khi chuyển phòng, reload hoặc đóng trang. Chạy trình duyệt headless với máy chủ local, chặn mạng ngoài.
- `verify-motion-ai-recovery.ts`: tái hiện ba route đầu hết ngân sách, Grok lỗi context; lỗi cuối là context thay vì lỗi nội dung cũ. Bộ kiểm tra phục hồi phòng và fallback hiện có cũng đạt.
- `verify-motion-read-contract.ts`, `verify-motion-field-repair.ts`, `verify-motion-log-sections.ts` và `tsc --noEmit` đạt.

Các kiểm tra không gọi AI bên ngoài, TTS hoặc render video. Chưa xác nhận một lượt video thực tế hoàn tất; dịch vụ AI bên ngoài và CAPTCHA vẫn phụ thuộc phiên trình duyệt. Không tự tiếp tục job lỗi hoặc tạo video.

## Nạp bản sửa

Backend được nạp lại lúc 18:15 ngày 26/10, PID `84332`, cổng `3002`. API trả job `480e6c65-6ae3-466e-88db-de0ea0b9a820` vẫn ở trạng thái `error`, bước `Đọc câu thành hình`. SHA256 của 124 file tiến độ, bản nháp, job và log trước/sau restart giống nhau. Không kích hoạt lại lượt video. Log backend: `scratch/motion-context-repair-backend-20261026-181547.stdout.log` và `.stderr.log`.
