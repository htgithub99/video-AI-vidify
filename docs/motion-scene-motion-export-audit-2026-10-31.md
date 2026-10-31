# Chuyển động cảnh và thời gian xuất Remotion — 31/10/2026

Phần camera đã được cập nhật tiếp: gộp hoàn toàn vào công tắc Chuyển động cảnh và quay theo hành động chính. Xem `motion-action-camera-2026-10-31.md`. Nội dung kiểm tra thời gian xuất bên dưới vẫn giữ nguyên.

## Cấu hình

- Đổi tên “Chuyển động nhân vật” thành “Chuyển động cảnh”.
- Bật: yêu cầu AI tạo chuyển động phù hợp với nội dung trong cùng lượt dựng cảnh, gồm người/ngựa chạy, vải/lá trong gió, dòng nước, lửa, mưa, khói khi thực sự có trong cảnh. Camera là tùy chọn riêng khi đã bật chuyển động cảnh.
- Tắt: toàn bộ hình trong cảnh đứng yên, gồm người, miệng, động vật, đồ vật, hiệu ứng và camera. Không ảnh hưởng âm thanh, phụ đề và việc chuyển sang cảnh kế tiếp.
- Bỏ công tắc hiệu ứng độc lập để không còn trạng thái tắt chuyển động nhưng hiệu ứng vẫn chạy. Các cấu hình cũ được chuẩn hóa theo công tắc chính.
- Giữ nguyên cấu trúc nhân vật của ba kiểu hình. Chuyển động chỉ áp dụng vào các bộ phận/nguồn phù hợp; không thay đổi bố cục hoặc tỷ lệ bằng code.
- Các cảnh mới nhận prompt mới. Bật cấu hình không tự bổ sung chuyển động còn thiếu vào SVG đã dựng trước đó; cần dựng lại những cảnh này. Tắt vẫn chặn các track có sẵn khi phát/xuất.
- AI có thể trả thiếu chuyển động; việc bật cấu hình không bảo đảm mọi phản hồi AI đều đạt yêu cầu. Cảnh không có nguồn chuyển động phù hợp được phép để tĩnh.

## Kiểm chứng

- `npm run test:motion-behavior`: đạt, gồm cả Canvas và Remotion, chuẩn hóa cấu hình cũ, chân người chạy, ngựa ở layer prop, gió/nước và ba prompt kiểu hình.
- `npx tsx scripts/verify-motion-scene-motion.ts --render`: đạt với bộ dựng ảnh Remotion thật. Ảnh tại frame 0 và 30 khác nhau khi bật; hai PNG giống hệt từng byte khi tắt.
- Các kiểm tra composition, scene consistency, prompt transport, TypeScript và diff whitespace đều đạt.
- UI: bật cho phép chọn camera; tắt hiển thị “Toàn cảnh tĩnh”, camera cố định và bị vô hiệu hóa. Đã trả cấu hình UI về trạng thái tắt ban đầu.
- Backend chạy qua `tsx watch`; tiến trình server hiện tại khởi tạo lúc 21:47:06, sau các file server dùng trong thay đổi này.

Ảnh kiểm chứng và video thử: `scratch/motion-control-export-audit-20261031/`.

## Video The Battle of the Nile, 47 BC

Nguồn: render job `storage/output/motion-video/render-jobs/a8e495a1-5c68-412b-8443-e0c2ec2bcd02.json` và production `storage/output/motion-video/productions/751bcdf4eff453af3e6131fc7968fd7b.json`.

| Mục | Giá trị |
| --- | --- |
| Nội dung | 111,133 giây, 10 cảnh |
| Timeline | 3.334 frame, 30 FPS |
| Đầu ra | 1280 × 720, nháp, 12,5 MB |
| Tổng thời gian xuất | 646 giây = 10 phút 46 giây |
| Encoder | CPU libx264 |
| Số luồng log cũ ghi | 1 |

Mốc log: nhận yêu cầu 16:40:38; bắt đầu Remotion 16:40:39; chuẩn hóa âm lượng 16:51:11; ghép âm thanh 16:51:21; kiểm độ to 16:51:24; hoàn tất 16:51:25.

Khoảng 632 giây trước mốc chuẩn hóa âm lượng bao gồm dựng hình, kiểm tra video và chuẩn bị âm thanh/nhạc. Log cũ không có mốc kết thúc Remotion nên chưa thể quy toàn bộ khoảng này cho việc vẽ frame. Số luồng cũ cũng được tính riêng trước khi renderer tự tính lại; không đủ bằng chứng khẳng định renderer luôn dùng đúng 1 luồng.

Luồng hiện tại dùng Chromium dựng từng frame và libx264 mã hóa CPU, giới hạn tối đa 2 luồng theo CPU/RAM trống. Chưa có cache frame tĩnh hoặc tiếp tục xuất từ phần đã xong như nhánh Canvas. Camera nhẹ khiến hình vẫn thay đổi theo frame, kể cả cảnh không có track chuyển động nhân vật. Không thấy bằng chứng xuất video bị lặp lượt dựng AI.

Máy kiểm tra: i7-4900MQ, 4 nhân/8 luồng, RAM khoảng 16 GB. RAM trống tại thời điểm kiểm tra không chứng minh RAM trống lúc video gốc được xuất.

## Đo thử và thay đổi ghi log

Đo 60 frame / 2 giây của SVG lớn nhất trong video bằng renderer thật, 720p: bật chuyển động/camera 8,450 giây; tắt 7,514 giây. Cảnh này không có animation track nên chênh lệch chủ yếu liên quan camera. Phép đo ngắn có chi phí mở trình duyệt, chọn composition và mã hóa; không được suy ra tốc độ toàn video hoặc mức giảm bảo đảm.

Đã thêm:

- Tính số luồng một lần rồi truyền cùng giá trị cho renderer và log.
- Log số frame, số luồng thực tế, encoder CPU.
- FPS render và thời gian còn lại ước tính từ tiến độ.
- Log thời gian kết thúc phần dựng hình, trước kiểm video và ghép âm thanh.

Chưa thay đổi giới hạn 2 luồng hoặc thuật toán xuất. Chưa có kết quả xuất lại toàn bộ video chứng minh nhanh hơn. Hướng tối ưu tiếp theo là cache frame cho các khoảng thực sự tĩnh và đo các mức đồng thời trên máy này; cần kiểm tra phụ đề/camera trước khi tái sử dụng frame.
