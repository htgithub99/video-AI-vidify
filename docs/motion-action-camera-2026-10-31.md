# Camera theo hành động chính — 31/10/2026

## Cấu hình

Chỉ còn công tắc **Chuyển động cảnh**. Bật đồng thời cho phép chuyển động nhân vật, môi trường và camera theo hành động chính. Tắt đóng băng toàn cảnh và camera. Dữ liệu cũ được chuẩn hóa theo công tắc chính, kể cả cấu hình từng bật chuyển động nhưng tắt camera.

## Dựng cảnh

Trong cùng lượt vẽ SVG, AI chọn `design.cameraMotion` gồm `mode`, `subjectId` và điểm `focus` mô tả vị trí ban đầu của chủ thể:

- `follow`: bám chuyển động thực tế của cả nhóm nhân vật/động vật hoặc nhóm cha chứa chúng.
- `push`: tiến nhẹ về nhân vật, biểu cảm hoặc cử chỉ quan trọng.
- `pull`: lùi nhẹ để mở cảnh.
- `hold`: giữ khung cho cảnh yên, sơ đồ hoặc không có chủ thể rõ ràng.

Không thêm lượt AI riêng. Dữ liệu camera mô tả hình AI đã vẽ; không dùng để sửa tỷ lệ hoặc bố cục SVG. Ba kiểu hình giữ nguyên cấu trúc nhân vật. Canvas dùng cùng công tắc và hỗ trợ `camera:{move,subject}`.

Renderer đọc transform thực tế ở nhóm chủ thể và nhóm cha, kể cả nhóm không có ID, rồi tính chuyển động camera có giới hạn tốc độ. Không bám theo mắt, miệng hoặc chân tay riêng. Mức zoom tối đa 4,5%; giới hạn khung tránh lộ viền trống và bảo vệ các nhân vật có dữ liệu placement. Khi chủ thể đi quá xa, giới hạn khung được ưu tiên nên camera không bảo đảm giữ chủ thể đúng một vị trí tuyệt đối.

Camera cũ chọn hướng bằng hash mã cảnh đã được bỏ. Cảnh cũ không có chỉ dẫn camera hay track di chuyển thích hợp được giữ khung; cần dựng lại để AI bổ sung hướng quay theo hành động. AI vẫn có thể trả thiếu dữ liệu; trường camera tùy chọn sai không làm hỏng hoặc loại bỏ cảnh.

## Kiểm chứng

- TypeScript: đạt.
- `npm run test:motion-behavior`: đạt; hai trạng thái công tắc, Canvas thật, bám nhóm cha, bỏ qua chuyển động chân tay riêng, giới hạn tốc độ, bảo vệ chủ thể, seek xác định, chịu được metadata sai.
- `verify-motion-camera-comfort.ts`: 376.272 mẫu, 6 hướng, 4 tỷ lệ, tốc độ và viền khung; hàm tuần tự hóa cho Canvas khớp TypeScript.
- `verify-motion-action-camera.ts --render`: đạt với ảnh Remotion thật, gồm follow, chỉ camera tiến nhẹ, và toàn cảnh tĩnh. Chỉ camera tiến nhẹ cũng làm hai ảnh khác nhau; tắt cho ảnh giống hệt từng byte.
- Prompt transport: đạt, giữ ba kiểu hình và một tin nhắn dựng cảnh.
- UI: không còn switch Camera; chỉ switch Chuyển động cảnh và tooltip mới. Đã trả switch về trạng thái tắt ban đầu sau kiểm tra.
- Backend tự nạp qua `tsx watch`; đã xác nhận tiến trình server mới sau khi sửa.

Ảnh bằng chứng, JSON fixture và kết quả dựng ở `scratch/motion-action-camera-20261031/`. Đây là kiểm tra bằng dữ liệu có kiểm soát, chưa phải đánh giá một video AI mới từ đầu đến cuối.
