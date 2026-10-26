# Phục hồi bước biên kịch từ truyện mẫu — 24/10/2026

## Nguyên nhân

Hai yêu cầu lúc 09:33:01 và 09:33:33 ngày 24/10 nhận được JSON từ Gemini, nhưng dàn ý không qua kiểm tra nội dung. Mẫu JSON cuối prompt thiếu `sourceCore` và `storySpine`, trong khi bộ kiểm tra bắt buộc hai phần này. Kiểm tra nằm ngoài chuỗi AI dự phòng nên JSON thiếu vẫn được ghi nhận `ok`; sau hai lượt cùng AI, chương trình báo lỗi chung. Phản hồi thực tế của hai lượt cũ chưa được lưu nên không thể khẳng định chính xác trường nào thiếu trong từng lượt.

## Cách sửa chung

- Dùng một schema đầy đủ cho prompt, gồm cốt lõi truyện mẫu, mạch nhân quả, điểm gài/mở nút, chương, nhân vật và bối cảnh.
- Kiểm tra nội dung ngay trong mỗi tuyến AI, trước khi ghi nhận thành công. Mỗi AI có tối đa hai lượt; nếu chưa đạt, chuỗi dự phòng hiện có nhận bản nháp và những phần còn thiếu.
- Yêu cầu sửa bằng `patch`: giữ phần hợp lệ, bổ sung trường thiếu và ghép chương theo ID gốc. Chỉ chuẩn hóa ID khác tên khi danh sách chương đầy đủ và ánh xạ nhất quán được các tham chiếu. Không tự gộp ID trùng hoặc đổi thứ tự các ID gốc.
- Lưu phản hồi bị từ chối, bản nháp, AI/model, số lượt, ID mong đợi và lỗi cụ thể vào `storage/output/motion-video/ai-debug/`.
- Giữ nguyên chế độ chỉ một AI/API, cơ chế room, hủy tác vụ và bảo vệ yêu cầu chưa xác định đã gửi hay chưa. Không lấy truyện mẫu làm đầu ra để che lỗi.
- Bỏ cắt danh sách bước nhân quả và manh mối ở 48 phần tử trước kiểm tra, tránh báo thiếu hoặc bỏ lọt dữ liệu phía sau ở truyện dài.

Nếu tất cả AI đều không cung cấp nội dung đạt yêu cầu, tác vụ vẫn dừng có giới hạn và thông báo đúng phần thiếu; không công nhận dàn ý sai là thành công.

## Kiểm chứng

- `npx tsc --noEmit --pretty false`: đạt.
- `npm run test:motion-story-craft`: đạt; gồm sửa từng phần, giữ chương hợp lệ, ID/tham chiếu, truyện 60 chương, log chẩn đoán, giới hạn số lượt, hủy và lỗi gửi không xác định.
- `npm run test:motion-ai-recovery`: đạt; mô phỏng Gemini thiếu cả hai phần, Gemini bổ sung cốt lõi, ChatGPT bổ sung mạch truyện trên cùng bản nháp. Log chuỗi ghi Gemini thất bại rồi ChatGPT thành công. Kiểm tra chế độ một AI và mọi AI đều thiếu; kiểm tra room độc lập và tiếp tục hội thoại bằng trình duyệt cục bộ.
- `git diff --check`: đạt.
- Gọi Gemini thật qua `developCreativeStory`, với nguồn mẫu đã có trong kho và kế hoạch ba chương: tạo được **Mạch Nước Dưới Lòng Giếng Cạn**, 3 chương, 5 nhân vật, 4 bối cảnh; `motionStoryContractErrors` trả `[]`. Kết quả: `scratch/story-contract-live-20261024/result.json`. Lượt thật đạt ngay phản hồi đầu; tình huống phục hồi và đổi AI được kiểm chứng bằng transport mô phỏng.
- Đã khởi động lại backend dự án tại cổng 3002 để nạp code mới; API trả HTTP 200.

Lượt kiểm chứng trực tiếp chỉ chạy bước biên kịch, không ghi đè dự án đang mở và không xuất video. Chất lượng kể chuyện/hình ảnh cuối cùng cần được đánh giá tiếp khi dựng video.
