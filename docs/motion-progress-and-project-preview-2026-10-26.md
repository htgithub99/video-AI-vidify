# Log, tiến độ cảnh và preview tài nguyên theo dự án

## Nguyên nhân

- Khung log vẽ nguyên từng nhóm job theo thứ tự thêm vào. SEO là nhóm cuối nên cuộn xuống cuối luôn gặp SEO cũ, mặc dù log production phía trên vẫn tăng.
- Frontend bỏ `seoJobId` sau hoàn tất nhưng production còn gửi lại ID đó. Production chỉ nhận SEO ở cuối dựng hình/giọng nên frontend kiểm tra lặp job đã xong.
- Hai việc dựng hình và tạo giọng cùng chiếm khoảng 30–60% và dùng `max`. Giọng xong trước làm phần trăm đứng 60% trong khi hình tiếp tục. Khoảng render cũng chồng lên phần hình.
- Cảnh ghép của gói đóng nằm trong snapshot dự án. Thumbnail GET chỉ tìm kho chung, không nhận snapshot. `Nhà tôi` và `Sân trước` có SVG và plan hợp lệ trong gói nhưng đường xem ảnh cũ trả 404.
- Callback mở ảnh biến mọi tài nguyên thành `beat`, lấy tên hiển thị làm ID và mô tả làm lời dẫn. Nút dựng lại có thể gửi sai đối tượng. Ảnh lỗi vẫn hiện link tải.

## Thay đổi

### Log và tiến độ

- Giữ nguyên lịch sử lưu theo job và thứ tự thời gian trong mỗi mục. Có xử lý qua nửa đêm; UI chia thành các mục cố định theo công việc. Tăng chữ khung log lên 12px và giãn dòng.
- Production gắn nhãn việc cho log con, giữ timestamp gốc; dòng mới chưa có timestamp được đóng giờ khi phát sinh.
- Phân cảnh ghi nhóm hiện tại/tổng nhóm, phạm vi nội dung nguồn và số cảnh đã chốt. Không coi số request hoặc số câu là tổng cảnh cuối cùng.
- Khi đã chốt cảnh: đọc và dựng ghi cảnh X/N, tên nơi, trích lời kể, bắt đầu/hoàn tất và tổng đã xong. Giữ thứ tự số cảnh theo kịch bản dù nhiều room trả kết quả khác thứ tự. Cảnh đã đạt được dùng lại khi phục hồi.
- Đọc/dựng theo cả luồng gói đóng và luồng bố cục cũ có log cảnh. Bản nháp, budget sửa, khóa dữ liệu và kiểm vị trí giữ nguyên.
- SEO được thu nhận và log ngay trong lúc media đang chạy. Kết quả được cập nhật mốc theo giọng khi có giọng/finalize; ID chờ được xóa khi job kết thúc. Frontend nhớ ID đã hoàn tất, không nhận lại ID cũ từ backend đang chạy bản trước.
- Khi đọc bản lưu cũ có SEO đã `done` nhưng còn ID chờ, API trả trạng thái đã hoàn tất và bỏ ID chờ khỏi phản hồi; không sửa kịch bản hay chạy lại công việc.
- Tiến độ media có trọng số riêng: nền 30%, hình 50%, giọng 10%; render 90–99%, hoàn tất 100%. Job lỗi/hủy không tự được tính là hoàn thành. Các lần sửa giữ tiến độ tổng không lùi, còn log thể hiện phần thực sự đang làm.

### Preview

- UI tạo URL Blob từ SVG đã nằm trong snapshot. Không vẽ mới, không ghi cảnh ghép vào kho chung. URL được giữ tới khi panel đóng để popup đang mở vẫn xem/tải được khi snapshot bổ sung tài nguyên.
- GET thumbnail nhận `project` và đọc snapshot production/story job qua cùng cơ chế kiểm fingerprint/nguồn và resolve plan dùng khi dựng video. Không thay bằng tài nguyên khác nếu ID không có trong gói.
- Popup nhận đúng loại, khóa tài nguyên, mô tả và đuôi file. Bối cảnh dựng lại theo khóa `nha_toi`, không theo tên `Nhà tôi`. Nhân vật/đồ vật không bị gửi vào API dựng lại beat.
- Sheet mới giữ ánh xạ dòng nguồn; dựng lại ảnh sheet dùng đúng beat nguồn. Sheet cũ thiếu ánh xạ chỉ xem/tải, không đoán ID.
- Component ảnh chung báo đang tải hoặc lỗi; chỉ cho tải sau khi ảnh đã load. Mô tả tài nguyên không còn mang nhãn lời dẫn.

## Kiểm tra

- `npx tsc --noEmit`: qua.
- `npm run test:motion-progress-preview`: kiểm thứ tự log song song, cuộn tới dòng mới, qua nửa đêm, API helper đọc cảnh ghép theo snapshot, fingerprint sai, khóa bối cảnh và trình duyệt giải mã SVG thực của hai cảnh, thông báo ảnh lỗi.
- `verify-motion-production-runner`: SEO được nhận khi hình chưa xong, bỏ ID chờ, log SEO vào production, giọng xong không nhảy lên 60%; phục hồi lỗi giọng, hủy và fencing giữ nguyên.
- `verify-motion-editorial-ui`: log qua localStorage/IndexedDB reload, chỉ reset khi tạo mới, trạng thái gọn vẫn qua.
- `verify-motion-prompt-resume`, `verify-motion-visual-contract`, `verify-motion-storyboard`: qua.

Không gọi AI/TTS thật, không tạo hoặc tiếp tục video người dùng. Kiểm thử browser dùng fixture và ảnh SVG có sẵn. Lượt thật đã tự dừng trước khi nạp backend do một lỗi đọc loại đồ vật độc lập (`catalogKey must depict this exact noun phrase`); bản sửa này không bỏ QA đó hoặc tự chạy lại lượt.

## Nạp backend

Đã nạp bản cuối lúc 17:13 ngày 26/10, PID 72012, cổng 3002. Tất cả production đã kết thúc trước khi nạp. So sánh 99 file tiến độ/kịch bản/job qua lần nạp: không có file thay đổi. Kiểm thumbnail và trạng thái sau khi nạp dùng GET; việc nhận kết quả SEO đã xong có thể cập nhật riêng trạng thái SEO trong bản lưu theo cơ chế hội tụ, không chạy lại dự án.

GET thumbnail thực của `Nhà tôi` và `Sân trước` với project hiện tại: đều HTTP 200, `image/svg+xml` (2868 và 5446 byte). Kiểm tương thích ID SEO còn sót trong bản lưu cũ đã được bổ sung vào runner, không ghi thay file fixture khi đọc.

## Cập nhật: chia log thành từng phần cố định

### Nguyên nhân phần hiển thị vẫn khó đọc

Bản sắp xếp theo thời gian vẫn dùng chung một danh sách và thêm tiêu đề khi đổi tác vụ. Các việc chạy đồng thời làm tiêu đề SEO, giọng, cảnh lặp đi lặp lại. Prompt, số request và lỗi schema cũng được in chung với tiến độ người dùng cần theo dõi.

### Cách hiển thị mới

- Sáu mục cố định: Phân tích DNA; Kịch bản & phân cảnh; SEO YouTube; Dựng cảnh; Tạo giọng; Xuất video. Thông tin chung và thao tác kho độc lập có mục bổ sung khi cần.
- Mỗi mục có trạng thái, tóm tắt mới nhất và lịch sử riêng. Các mục đang chạy hoặc gặp lỗi được mở mặc định. Khi nhiều việc chạy đồng thời, nhiều mục có thể cùng báo đang chạy.
- Dựng cảnh giữ nhãn con Phân cảnh, Đọc cảnh, Dựng cảnh hoặc Duyệt ảnh. Tiến độ cảnh X/N nằm trong đúng mục; khi chưa chốt tổng cảnh thì hiển thị tiến độ nhóm, không lấy số request làm số cảnh.
- Prompt, số request và mã kỹ thuật được thu gọn. Mọi dòng gốc vẫn có trong phần “Log gốc và chi tiết kỹ thuật”. Một số lỗi chọn đồ vật/schema/CAPTCHA được diễn đạt bằng tiếng Việt ở phần chính; không thay lỗi hoặc hạ kiểm tra của backend.
- Trạng thái dựa vào kết quả đã nhận, stage và hoạt động AI; không chỉ nhìn job cuối của danh sách. SEO hoặc giọng đã có kết quả không bị một nhãn stage/AI còn sót chuyển ngược sang đang chạy.
- Log cũ ưu tiên nhãn tác vụ/kind, rồi suy luận từ tên bước hoặc artifact; dòng chưa có nhãn kế thừa bước gần nhất của cùng job. Log cũ của các tác vụ đồng thời không có nhãn có thể không truy ngược chính xác chủ sở hữu từng dòng kỹ thuật; luôn giữ dòng gốc để đối chiếu. Các log con production mới đã có scope.
- Cuộn theo dòng mới trong từng mục; người đang cuộn lên đọc lịch sử không bị kéo xuống. Có thể mở/đóng từng mục độc lập.
- Chỉ thay lớp trình bày, không đổi dữ liệu lịch sử hoặc cơ chế giữ log qua reload và reset khi tạo video mới. Không cần khởi động lại backend cho phần cập nhật này.

### Kiểm chứng

- `npm run test:motion-log-sections`: phân nhóm log mới/cũ, sáu mục ổn định, trạng thái song song và stage còn sót, log kỹ thuật mặc định đóng, đọc lỗi gốc, tiến độ cảnh, mở mục độc lập, cuộn, reload và màn hình nhỏ.
- `npm run test:motion-progress-preview`: tiến độ cảnh nằm đúng mục và preview ảnh ghép vẫn giải mã được.
- `npx tsx scripts/verify-motion-editorial-ui.ts`: lịch sử localStorage/IndexedDB vẫn được giữ và chỉ reset khi tạo mới.
- `npx tsc --noEmit`: kiểm kiểu frontend/backend.

Kiểm tra bằng fixture offline và browser headless; không gọi AI/TTS và không chạy hoặc tiếp tục tạo video thật.
