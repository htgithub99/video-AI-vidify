# Đối ứng minh họa đơn giản và phục hồi dữ liệu Video Motion

Ngày: 26/10/2026. Triển khai theo `motion-simple-illustration-root-audit-2026-10-26.md`.

## Đã thay đổi

### Minh họa và chọn tài nguyên

- Dùng chung chính sách minh họa tĩnh cho khâu lập nhịp hình, READ, kiểm kế hoạch và dựng hình từ kho. Ngồi/quỳ/cúi phụ có thể dùng hình đứng; bỏ cử chỉ tay phụ. Giữ người, nơi, vị trí quan trọng và manh mối. Giữ tư thế nằm mặc định; tư thế có `essential: true` không bị đơn giản hóa.
- Bỏ quy tắc cũ bắt giữ mọi tư thế ngồi chỉ vì lời kể có chữ “ngồi”, bỏ schema READ trùng tại prompt lập nhịp hình và điều kiện tách hình theo động tác phụ. Không thêm hoạt họa để diễn từng động từ.
- Giữ chọn tài nguyên trong gói đóng. Catalog lập kế hoạch có thêm yêu cầu trạng thái của đạo cụ; kiểm trạng thái `inverted`/`upside_down` để tên gần giống không tự khớp sang hình bình thường.
- READ nhận và kiểm bằng chứng chủ vật, vị trí của người/vật. Câu yêu cầu cầm/mở không phải bằng chứng đã cầm/mở. Một trích dẫn người khác cầm vật không đủ chứng minh người đang được gán sở hữu cầm vật.
- Bổ sung kiểm bảo thủ cho vị trí được nói rõ như cạnh cửa, đầu giường, bậu cửa. Các trường hợp nhận ra được nhưng thiếu vị trí có cấu trúc được đưa về sửa trường tương ứng. Dùng chung cách đọc tên điểm tựa cho `bed`, `beside_bed`, v.v. để không báo thiếu vị trí khi dữ liệu đã có.
- Đạo cụ đặt bàn/sàn có thể khóa theo một điểm tựa. Điểm sàn gần cửa/giường được suy ra từ hình học có sẵn; không vẽ thêm tài nguyên. Cả vật chính và vật phụ đều giữ `propAt` đã chọn nếu hợp lệ.
- Bộ chọn xét vị trí của đạo cụ ở cảnh trước theo danh tính vật, kể cả khi đổi vật chính/vật phụ. Ràng buộc vị trí và kiểm hình học chạy trước bước chấm bố cục; không giữ vị trí cũ nếu vị trí đó sai yêu cầu mới.
- Tăng phiên bản chuẩn hóa READ và hồ sơ lựa chọn cảnh để dữ liệu cũ cần được kiểm lại theo hợp đồng mới khi người dùng tiếp tục lượt.

### Phản hồi AI sai một phần

- Tách kiểm truyện và kiểm `illustrationNeeds`. Truyện đã hợp lệ không bị viết lại chỉ vì một nhu cầu minh họa sai.
- Sửa từng nhu cầu và từng đường dẫn trường lỗi. Giữ trường đúng, chương truyện, nhân vật và bối cảnh đã xác nhận. Prompt sửa chỉ mang ngữ cảnh cần thiết; catalog chỉ gửi khi trường cần sửa liên quan tài nguyên.
- Loại key JSON lạ khỏi đối tượng trước khi sửa, nhưng không đoán giá trị `mount`/`size` từ key hỏng. JSON sửa không đọc được không bị trích mảnh rồi áp dụng tùy tiện.
- Lưu kết quả sửa một phần cùng bộ đếm theo nhu cầu và tuyến AI. Gián đoạn rồi tiếp tục chỉ xử lý phần chưa đạt.
- Phân biệt hết lượt sửa của một tuyến với hết tổng ngân sách: tối đa hai phản hồi không đạt mỗi tuyến, tối đa mười phản hồi không đạt mỗi phần. Chế độ khóa AI vẫn giữ khóa; chế độ cho phép đổi AI đi theo danh sách cấu hình. Resume không xóa bộ đếm.
- Draft cũ ở revision 1 được chuyển hợp đồng một lần, giữ lịch sử lỗi. Nếu truyện đã đạt và chỉ nhu cầu minh họa sai, đi thẳng vào sửa nhu cầu.
- Giữ lý do lỗi phản hồi JSON trong lỗi phục hồi; lỗi sửa nhu cầu còn chi tiết trường sai, không chỉ thông báo chung “phân tích lại”.

### UI

- Hàng nút trong `MotionVideoCreator.tsx` bỏ ô đệm rỗng và `justify-between`. “Tiếp tục lượt này” và “Tạo video” nằm liền nhau, cách 8 px, căn phải và có xuống dòng khi thiếu chiều rộng.

## Kiểm chứng

Các bài kiểm đã chạy thành công trong lượt triển khai, bao gồm các lần chạy lại sau khi phát hiện hồi quy:

| Nhóm               | Nội dung                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript         | `npx tsc --noEmit`                                                                                                                                                                |
| Minh họa đơn giản  | `verify-motion-simple-illustration.ts`: draft lỗi thật, giữ trường đúng, ngắt/kết nối lại, giới hạn AI, tư thế phụ, lỗi vị trí của ảnh thử cũ, vị trí bàn/sàn qua hàm layout thật |
| Chọn cảnh          | `verify-motion-pack-selection.ts`: hai gói, hình học, nhiều đạo cụ, giữ vị trí khi đổi vật chính/phụ                                                                              |
| Pipeline kho đóng  | `verify-motion-closed-pipeline.ts`: hai gói, renderer ảnh thật, tiếp tục từ cache, bật/tắt review, sửa bố cục trước voice, chặn đạo cụ ngoài kho                                  |
| Phục hồi AI        | `verify-motion-ai-recovery.ts`, `verify-motion-field-repair.ts`, `verify-motion-read-contract.ts`                                                                                 |
| Kịch bản/vị trí    | `verify-motion-story-craft.ts`, `verify-motion-spatial-placement.ts`, `verify-motion-plan-readiness.ts`, `verify-motion-visual-contract.ts`, `verify-motion-storyboard.ts`        |
| Điều phối/sức chứa | `verify-motion-production-runner.ts`, `verify-motion-assembly-capacity.ts`                                                                                                        |

Đã phát hiện và sửa hai hồi quy khi kiểm lại: bộ chấm bố cục chưa tính vị trí đạo cụ ở cảnh trước; bộ kiểm ngữ nghĩa chưa nhận `beside_bed` là điểm tựa đã chứa quan hệ cạnh giường. Giữ nguyên kiểm tra hồi quy thay vì bỏ điều kiện.

Các bài pipeline dùng phản hồi AI giả lập và renderer ảnh thật. Không tạo hoặc tiếp tục video mới, không gọi AI trực tiếp để nghiệm thu một MP4 trong lượt này. UI đã kiểm cấu trúc/class; chưa chụp nghiệm thu trên các kích thước màn hình.

## Nạp bản sửa

Đã kiểm cả ba bản lưu production đều ở trạng thái kết thúc trước khi khởi động lại đúng backend cổng 3002. Backend mới PID 83992, trang ứng dụng trả HTTP 200. SHA-256 của cả ba file production không đổi sau khi khởi động lại; không tạo hoặc tiếp tục lượt nào. Server tĩnh cổng 3107 được giữ nguyên.

Startup vẫn ghi nhận chưa kết nối được Chrome CDP của bộ hỗ trợ Google Labs trong `audioService.ts`; server vẫn khởi động và trả HTTP 200. Đây không phải bằng chứng các dịch vụ AI trực tiếp đã sẵn sàng, cũng không phải lỗi bài kiểm dựng từ kho. Chưa mở một lượt sản xuất để kiểm dịch vụ đó.

## Phạm vi còn giới hạn

- Kiểm ngữ nghĩa bằng quy tắc có giới hạn; không phải bộ hiểu mọi câu tiếng Việt và không chứng minh mọi cảnh tương lai sẽ đúng. Các quan hệ chưa nhận ra vẫn phụ thuộc READ/validator hiện có và cấu hình review ảnh.
- Chi tiết thiết yếu không thể thể hiện bằng kho vẫn phải được xử lý ở kiểm kế hoạch; không thay bừa hoặc báo hoàn thành khi hình sai manh mối. Lược tư thế phụ không làm kho có thêm mọi loại người/vật/trạng thái.
- Prompt sửa đã chia nhỏ theo nhu cầu/trường; prompt tạo truyện ban đầu vẫn dùng hợp đồng hiện có, chưa được tách toàn bộ thành từng phần nhỏ.
- Luồng sản xuất từ kho vẫn là 2D. Không tuyên bố nghiệm thu 3D trong thay đổi này.
- Giữ cơ chế CAPTCHA/chờ dịch vụ, log/tiến độ và điều phối production sẵn có. Chưa thay đổi giọng hoặc tốc độ đọc trong lượt sửa này.
- Không thể cam kết dịch vụ AI hoặc môi trường chạy không bao giờ lỗi. Bản sửa hướng tới phục hồi phần sai, giữ phần đúng và tránh dừng vì tư thế phụ; không bỏ kiểm nội dung thiết yếu để ép xuất video.
