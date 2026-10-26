# Sửa xử lý null trong nhu cầu minh họa — 26/10/2026

## Ca lỗi thực tế

Production `2206ca7c6fd2fa0ef22c36e7987bcdfc`, truyện **Người Đứng Ngoài Sân**, dừng lúc 14:45:47 trong bước phân tích nội dung. Trường `illustrationNeeds[1].objects[0].support` có giá trị `null`. Sau mười phản hồi qua năm provider, bộ kiểm vẫn từ chối cùng trường này. Các need phía sau còn `states[].support: null` và `objects[].owner: null`, tạo tổng cộng năm lỗi của bộ kiểm cũ.

Nguyên nhân nằm ở giao tiếp giữa các phần code: schema cho phép null tại trường tùy chọn; validator chỉ nhận chuỗi hoặc trường không tồn tại; bộ ghép giữ nguyên trường bị bỏ qua. AI trả null hoặc bỏ trường đều chưa thoát được vòng sửa. Đợt đối ứng trước chưa đồng bộ phần validator này.

## Quy định đã thống nhất

| Đầu vào | Xử lý |
|---|---|
| Bỏ trường trong patch | Giữ nguyên giá trị đã lưu. |
| Null tại trường tùy chọn mà schema cho phép null | Sau ghép patch, chuẩn hóa thành không khai báo trường đó. |
| Null tại trường bắt buộc hoặc không nullable | Giữ giá trị lỗi để validator báo; không xóa trường hoặc giả kết quả đạt. |
| Chuỗi rỗng, số, boolean, mảng hoặc object sai kiểu | Không ép thành chuỗi, không tự bỏ để vượt kiểm tra. |
| Số 0, boolean false hợp lệ | Giữ nguyên. |
| Patch sửa trường ngoài allowed paths | Bỏ qua thay đổi đó; giữ giá trị đã đạt. |

`normalizeMotionResponseOptionals` đọc trực tiếp schema dùng chung. `normalizeMotionIllustrationNeedOptionals` áp quy định này vào nhu cầu minh họa. Việc giản lược tư thế phụ vẫn nằm trong normalizer riêng, không được tự áp lên mọi gói khi chỉ chuẩn hóa null.

Đã nối chuẩn hóa vào các cửa:

1. Kiểm nhu cầu minh họa: nhận null tùy chọn theo cùng schema, không sửa đầu vào tại chỗ.
2. Nhận nháp để sửa: chuẩn hóa và lưu bản canonical trước khi xét lỗi hoặc gọi AI, kể cả nháp đã hết ngân sách thử.
3. Ghép bản sửa: chỉ ghép các path được phép, sau đó chuẩn hóa và kiểm lại.
4. Nhận kết quả kiểm coverage: chuẩn hóa các need trước khi ghi và tính dấu phụ thuộc.
5. Chuẩn hóa kế hoạch trước dựng: giữ cùng biểu diễn khi dữ liệu đi tiếp.

Không tăng hoặc xóa ngân sách sửa cũ để cứu ca này. Khi nội dung đã hợp lệ sau chuẩn hóa, bước sửa không cần gọi AI.

## Giới hạn sửa không tiến triển

Tận dụng bộ hợp đồng AI hiện có, thêm theo dõi tiến triển tùy chọn cho bước sửa nhu cầu minh họa. Dấu dữ liệu và lỗi được lưu cùng trạng thái theo từng need. Ba phản hồi liên tiếp giữ nguyên cả dữ liệu và lỗi sẽ chấm dứt chuỗi sửa bằng cờ stalled/exhausted, giữ bản nháp và nguyên nhân; không chuyển hết năm provider cho cùng một kết quả không thay đổi.

Trạng thái này sống qua phục hồi nháp và chuyển provider. Dữ liệu hoặc lỗi thay đổi thì đếm lại chuỗi không tiến triển; tổng ngân sách cũ vẫn có hiệu lực. Lỗi kết nối mô phỏng không bị tính như một phản hồi nội dung chưa đạt. Các bước khác không bật tùy chọn này giữ chính sách retry hiện có.

Giới hạn này không biến dữ liệu sai thành đạt. Đồ vật, chủ sở hữu, bằng chứng, chỗ tựa và vị trí thiết yếu vẫn phải qua các kiểm ngữ nghĩa và bố trí hiện có.

## Kiểm chứng

Đã trích phần kế hoạch của nháp thực tế thành fixture cố định `scripts/fixtures/motion-illustration-null-20261026.json`, gồm cả trạng thái sửa đã dùng hết mười lượt. Không ghi lại file production hoặc nháp thật.

`npm run test:motion-illustration-nulls` kiểm:

- Nháp thực tế chuẩn hóa và qua bước kiểm nhu cầu minh họa với **0 yêu cầu AI**, giữ bộ đếm cũ.
- Giữ nguyên chương, nhân vật, bối cảnh, ID và các trường đã đạt; chuẩn hóa lặp không làm đổi kết quả.
- Bỏ trường trong patch không xóa giá trị; null xóa đúng trường tùy chọn được phép.
- Null bắt buộc, giá trị sai kiểu và support dùng nhầm place key vẫn bị báo lỗi.
- Patch không được xóa chỗ tựa giường hoặc đổi tư thế nằm thiết yếu khi chỉ được sửa support của đồ vật.
- Coverage nhận và lưu need canonical.
- Ngắt mạng trong lúc sửa rồi tiếp tục vẫn giữ phần đã lưu và bộ đếm.
- Chuỗi không thay đổi dừng sau ba phản hồi, qua hai route; đọc lại nháp không gửi thêm yêu cầu cho cùng trạng thái stalled.
- Dữ liệu có thay đổi vẫn được tiếp tục trong ngân sách hiện có.

Các kiểm liên quan đã qua: TypeScript, `motion-response-contracts`, `motion-story-craft`, `verify-motion-simple-illustration`, `verify-motion-field-repair`, `verify-motion-root-contracts`, `verify-motion-prompt-resume` và `verify-motion-read-contract`.

Không gọi AI/TTS thật, không tạo hoặc tiếp tục video. Kết quả này xác nhận bước nhu cầu minh họa và hồi quy đã nêu; không chứng nhận toàn bộ đầu ra truyện/giọng/hình/video thật đã đạt.

## Nạp code

Đã kiểm không có production hoặc standalone mới đang hoạt động, không có manifest xuất đang chờ; nạp lại backend cổng 3002, PID `78784` → `24780`. Không gọi resume dự án. Việc người dùng chạy tiếp sẽ dùng chuẩn hóa mới khi đọc bản nháp.

HTTP `/` sau nạp trả 200; hash production và bản nháp gây lỗi không đổi. Log khởi động còn cảnh báo kết nối công cụ trình duyệt sinh ảnh, chưa kiểm provider thật trong lượt này. HTTP 200 chỉ xác nhận backend phục vụ, không chứng nhận dịch vụ AI/browser đã sẵn sàng.

Prompt phân tích/dàn ý khoảng 42.000 ký tự ghi trong lượt lỗi vẫn là mục tối ưu riêng. Đợt này sửa mâu thuẫn null và vòng phục hồi của nhu cầu minh họa; không tuyên bố đã giải quyết toàn bộ mục độ dài prompt hoặc đóng toàn bộ plan.
