# Dựng lại toàn bộ: nguyên nhân và sửa luồng kết quả

## Phạm vi

Áp dụng chung cho hai cách dựng: Remotion và sử dụng kho; dựng toàn bộ, dựng tiếp hoặc dựng lại cảnh được chọn. Giữ các cấu hình AI, ba phòng dựng cảnh, cấu trúc prompt của ba kiểu hình và cơ chế duyệt ảnh hiện có.

## Kết quả kiểm tra từ đầu đến cuối

1. Nút `Dựng lại toàn bộ` gửi `restart: true`, không giới hạn cảnh, nhịp hoặc địa điểm.
2. Remotion bỏ checkpoint, kế hoạch, hình và trạng thái request cũ khi restart. Chế độ kho bỏ `script.gen` trước khi chọn và ghép lại; vẫn sử dụng tài nguyên của kho.
3. Lỗi nằm ở luồng kết quả phía frontend: `buildScenes` chưa vô hiệu hóa bản xem trước, job xuất cũ và ID kết quả đã lưu. Khung tự xuất đọc trực tiếp `renderJob.result` nên có thể hiện MP4 cũ.
4. Dựng cảnh thủ công chưa nối sang xuất video khi bật cấu hình Xuất video tự động, dù mô tả cấu hình có hứa bước này.
5. Request biên dịch cũ chỉ so sánh khóa nội dung; khi dựng lại cho ra cùng dữ liệu, phản hồi cũ vẫn có thể được chấp nhận. Chỉ đặt `compiled = null` còn để lại khóa chống biên dịch lặp nên bản mới có thể không được biên dịch lại.
6. Nút dựng cảnh chưa chặn tình huống đang xuất MP4; bấm liên tiếp cũng cần được chặn ngay bằng trạng thái đồng bộ trước khi React cập nhật giao diện.

## Đối ứng

- Vô hiệu hóa compiled preview, render job, render signature và lastRenderJobId khi bắt đầu dựng cảnh; cập nhật cả bản nháp của đúng phương thức/kiểu hình đang dùng. Giữ nguyên bản nháp của phương thức khác và danh sách video đã xuất.
- Dừng theo dõi job xuất cũ và tăng revision biên dịch để phản hồi cũ không thể gắn lại vào lượt mới.
- Reset khóa chống biên dịch lặp; chấp nhận phản hồi biên dịch chỉ khi cả revision và khóa nội dung còn khớp. Không tự biên dịch trong khi luồng thao tác đang chạy.
- Sau một lượt dựng cảnh độc lập hoàn tất, nếu cấu hình tự xuất vẫn bật, không có cảnh lỗi và chưa bị dừng, chạy compile/voice cần thiết/export trên cảnh vừa dựng. Bỏ qua bước gọi lại dựng cảnh khi chuyển sang xuất, tránh request AI dư hoặc vòng lặp.
- Nếu đang được gọi bên trong luồng xuất thủ công thì không mở thêm lượt tự xuất.
- Khung xem trước tự xuất dùng URL của kết quả hoàn tất còn khớp cấu hình. Kết quả cũ chưa có render signature vẫn giữ khả năng đọc tương thích; thao tác dựng mới luôn xóa liên kết tới kết quả cũ.
- Chặn dựng cảnh khi đang xuất MP4 và chặn yêu cầu dựng trùng. Các nút xem ảnh và phân trang không bị khóa thêm.

## Kiểm chứng

- `npx tsx scripts/verify-motion-scene-rebuild.ts`: mô phỏng hook thật trong Chrome; cả hai cách dựng, request toàn bộ/cảnh chọn, bỏ bản xem trước cũ, lưu trạng thái vô hiệu hóa, cảnh trả về không đổi vẫn biên dịch lại, một lượt tự xuất không gọi dựng cảnh lần nữa, cảnh lỗi, lỗi dịch vụ, hủy, phản hồi compile/render cũ trả về trễ và ngăn dựng trùng hoặc dựng trong khi xuất.
- `npx tsx scripts/verify-motion-single-draw.ts`: pipeline Remotion thật với AI giả lập và storage tạm; bổ sung kiểm tra restart bắt buộc lập kế hoạch và vẽ lại toàn bộ dù có checkpoint và cảnh cũ.
- `npx tsx scripts/verify-motion-visual-drafts.ts --fixture`: đổi phương thức/kiểu hình/gói, lưu và khôi phục bản nháp vẫn đạt.
- TypeScript, ESLint các file nguồn thay đổi và audit source: đạt; audit ghi nhận không có comment hoặc runtime literal vi phạm.
- `verify-motion-preview-recovery.ts` còn timeout tại dòng 107 khi chờ response của request bị hủy sau đổi nguồn. Đã chạy lại bằng mã hook tại HEAD, chưa có sửa của lượt này, và tái hiện cùng timeout. Không thay đổi test đó hoặc chức năng đổi nguồn để che lỗi kiểm thử.

Không gọi AI, TTS hay dựng video thật trong lượt kiểm chứng này. Không yêu cầu khởi động lại backend vì thay đổi hành vi nằm ở frontend; phần backend chỉ được kiểm chứng lại.
