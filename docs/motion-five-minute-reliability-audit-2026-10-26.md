# Kiểm lượt 5 phút và độ tin cậy tạo video

## Bằng chứng

- Job `7684042e-05b2-4a16-b14e-2898e9cdb68d`, 18:53–18:58 ngày 26/10/2026.
- Đọc cảnh đạt 31/31 nhưng job dừng trước dựng và xuất, lỗi `mam_cung_state_overturned`.
- Gemini trả `chat_planning_provider_error_response`, ảnh chẩn đoán hiển thị lỗi 1095. Chưa đủ bằng chứng xác định nguyên nhân phía Google.
- Ba worker thực hiện tổng cộng 12 yêu cầu Gemini, 6 lần tải lại và 3 lần thay phòng; sau đó DeepSeek đọc được cảnh. Lỗi ghép đạo cụ vẫn còn, nên đổi AI không giải quyết được nguyên nhân dừng.
- Kiểm tại máy bằng dữ liệu đã lưu, gắn đạo cụ đúng từ snapshot kho, không gọi AI/TTS hoặc chạy tạo video: 26/31 cảnh có phương án; 5 cảnh chưa có phương án hợp lệ. Kết quả này kiểm dữ liệu checkpoint hiện tại, chưa phải kết quả chạy lại toàn bộ pipeline chọn bối cảnh.

## Các sửa đổi đã thực hiện trong lượt này

1. Trạng thái nghiêng/lật đơn giản dùng ảnh đạo cụ gốc và phép xoay tĩnh. Chỉ áp dụng đạo cụ trên sàn, đúng catalog, trạng thái có hỗ trợ; không bỏ kiểm danh tính, vật liệu và trạng thái hỏng/vỡ. Không ghi thêm ảnh vào kho.
2. Renderer giữ đáy vùng ảnh thực chạm mặt sàn khi xoay 90/180 độ. Compile giữ riêng instance trạng thái và instance bình thường dù cùng asset gốc.
3. Thiếu đạo cụ dùng lỗi tài nguyên có cấu trúc, giữ cảnh đã đọc và không gửi lại READ để giải quyết lỗi kho. Vẫn giữ sửa có giới hạn cho bố cục sai, gồm trường hợp bố cục tên tương tác xung đột với tư thế độc lập dù bối cảnh có đủ điểm đỡ.
4. Ba worker đang hoạt động bình thường vẫn chạy độc lập. Khi gặp cùng lỗi phản hồi provider/model, một worker thực hiện chuỗi phục hồi; các worker lỗi còn lại chờ kết quả chung. Giữ hai lần reload và một phòng mới, chuyển dự phòng theo cấu hình khi hết lượt. Hủy một worker đang chờ không hủy phục hồi của worker khác.
5. Tiến độ và nhật ký ghi riêng `Đọc cảnh`, `Ghép tài nguyên`, `Dựng cảnh`; không để lỗi ghép kho trông như đọc cảnh chưa xong.

## Những vấn đề còn phải xử lý từ dữ liệu lượt 5 phút

### 1. Bối cảnh đã chọn thiếu ngữ nghĩa điểm neo

Checkpoint `san_truoc` gắn `set-6c4c693bfea8da3f`. Các điểm hiện tại gồm `hut_door`, ba điểm đứng chung, `open_floor`, `floor_center`. Không có điểm neo `courtyard`, `gate` hoặc `table`.

- Cảnh `visual::1739::af427272`: người phụ nữ ở sân, yêu cầu neo `courtyard`, chưa có phương án.
- Cảnh `visual::1712::8ed96df8`: chị Hai ở cổng, người kể ở cửa; chưa có phương án.
- Cảnh `visual::1306::76c7bd35`: giữ vị trí chị Hai ở cổng từ cảnh trước; chưa có phương án.

Hướng xử lý: tổng hợp nhu cầu không gian của các cảnh trước khi chọn/giữ bối cảnh. Kiểm điểm neo và phương án đặt người trên ứng viên thật; nếu checkpoint cũ không đủ thì chọn lại hoặc ghép lại từ các mảnh trong snapshot cùng gói. Phân biệt vùng sân là một vùng ngữ nghĩa với cổng/bàn là chi tiết vật lý; không giả gắn nhãn cổng cho điểm đứng bất kỳ. Giữ vị trí liên tục giữa các cảnh sau khi chốt bố cục.

### 2. Đạo cụ đúng ảnh vẫn có thể thiếu vị trí hợp lệ

- Cảnh `visual::1448::e2f8bb33`: mâm lật đặt trên sàn cạnh bàn nhưng bối cảnh checkpoint không có bàn làm điểm neo.
- Cảnh `visual::1787::929ae70a`: cơ chế giữ liên tục mang mâm và neo bàn sang cảnh kết, tiếp tục không tìm được chỗ đặt.

Hướng xử lý: kiểm đồng thời tài nguyên, mặt đỡ, vị trí tương đối và phạm vi nhìn thấy. Đạo cụ cố định chỉ được giữ trong cùng không gian thực và khi thuộc vùng hình đang minh họa. Không xóa chứng cứ thiết yếu để vượt kiểm, không coi ảnh đạo cụ đúng là bố cục đã đúng.

### 3. Thiếu nhân vật quan trọng trong cảnh kết

Lời kể có “ba bóng người” nhưng READ cảnh cuối có `who: []`, `focus: place`, overlay `ghost`. Overlay không xác nhận ba cá thể đúng vị trí.

Hướng xử lý: kiểm số lượng và đối tượng được nhìn thấy theo chứng cứ của nhịp hình. Dùng nhân vật/nhân vật phụ có sẵn trong gói, xử lý mờ theo kiểu hồn ma đã chọn; không lấy hiệu ứng chung thay người khi số lượng/người là thông tin chính. Cho phép phong cảnh trống khi lời kể không yêu cầu thấy người.

### 4. Phục hồi phải đúng loại lỗi và giữ phần đạt

Lỗi dịch vụ AI, lỗi dữ liệu phản hồi, lỗi điểm neo, thiếu vật liệu và lỗi xuất cần các đường xử lý riêng. Chỉ hỏi lại phần READ sai; lỗi ghép kho cần tìm lại tổ hợp cục bộ. Không lặp toàn bộ cảnh đã đạt. CAPTCHA cần giữ tiến độ và chờ xác minh, không báo hoàn thành.

### 5. Điều kiện công bố hoàn thành

Một lượt chỉ hoàn thành khi có file video đọc được, đủ track hình/âm thanh và liên kết đầu ra hợp lệ. Lượt này dừng trước xuất nên chưa có bằng chứng đánh giá giọng đọc, phụ đề hoặc chất lượng file video cuối của chính lượt 5 phút này. Không thể suy ra những phần đó đạt từ trạng thái READ 31/31.

## Kiểm tra đã đạt

- `verify-motion-prop-rest.ts`: đối tượng lỗi thật, hai gói hiện hành, giữ SVG gốc và kiểm pixel tiếp xúc sàn khi xoay 90/180 độ; ảnh đối chiếu `scratch/motion-prop-rest-20261026.png`.
- `verify-motion-closed-pipeline.ts`: hai gói, tiếp tục không gọi AI lại, sửa bố cục tương tác sai trước voice, thiếu đạo cụ không đọc lại cảnh, giữ kho không đổi, người đứng cạnh người nằm và bát trên bàn.
- `verify-motion-ai-recovery.ts`: phục hồi provider chung ba worker, hai reload/một thay phòng trên worker dẫn, dự phòng ba yêu cầu, cooldown một lần; giữ các kiểm phục hồi/cancel trước đó.
- `verify-motion-read-objects.ts`, `verify-motion-read-scene.ts`: các hồi quy dữ liệu READ đã sửa trước đây.
- `verify-motion-log-sections.ts`: phân nhóm và trạng thái UI, thêm bước ghép tài nguyên.

Không tạo, tiếp tục hoặc xuất video trong đợt kiểm này.

## Nạp backend

Backend đã được khởi động lại để nạp bốn nhóm sửa, PID mới `80224`. Giữ nguyên 127 file trạng thái/tiến độ được kiểm SHA-256. Không gọi resume, không tạo video.
