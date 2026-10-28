# Phân công AI nội dung và AI dựng hình

## Quy tắc

| Công việc | Cấu hình AI |
| --- | --- |
| Phân tích nguồn, DNA, viết/sửa kịch bản và SEO | AI hỗ trợ nội dung |
| Chia nhịp hình, đọc yêu cầu cảnh, chọn tài nguyên từ kho | AI hỗ trợ nội dung |
| Review ảnh khi người dùng bật | AI hỗ trợ nội dung |
| Phân vai giọng, chỉ đạo giọng và lập âm thanh | AI hỗ trợ nội dung |
| Thiết kế bố cục, dựng SVG toàn cảnh, keyframe và sửa hình | AI dựng video minh họa |
| Ghép bố cục từ tài nguyên trong kho | AI dựng video minh họa khi cần AI; các lựa chọn xác định được vẫn xử lý tại máy |
| Timeline, đồng bộ voice/phụ đề, ghép nhạc và xuất | Code/Remotion/renderer hiện có |

Tạo hoặc sửa hình tài nguyên qua chức năng quản trị vẫn dùng AI dựng hình; các bước kiểm tra hình đi kèm nhận cấu hình AI nội dung. Hai gói cố định không tự sinh tài nguyên mới trong lượt tạo video.

## Đường truyền cấu hình

- Request dựng cảnh giữ `aiExecution` cho AI dựng hình và thêm `mainAiExecution` cho AI nội dung.
- Lượt production lấy hai lựa chọn từ snapshot ban đầu và gửi riêng vào dựng cảnh; tạo voice dùng `base.aiExecution` của nội dung.
- Lượt dựng/xuất thủ công lấy lựa chọn hiện tại trên UI. Đổi AI không xóa các hình, kịch bản và giọng đã đạt.
- `buildRemotionScenes` dùng `mainExec` cho phân cảnh/review và `exec` cho thiết kế/vẽ/sửa. Các lượt sửa hợp đồng tiếp tục dùng đúng vai trò của tác vụ gốc.
- Nhánh kho truyền riêng lựa chọn cho đọc/chọn/kiểm/âm thanh và cho dựng bố cục/vẽ. Kiểm ảnh tài nguyên bên trong hàm vẽ cũng dùng AI nội dung khi cấu hình này được cung cấp.
- Chuỗi dự phòng MAIN/DRAW vẫn độc lập. Không lấy lựa chọn AI dựng hình làm phương án dự phòng riêng cho giọng.
- Caller cũ chưa gửi cấu hình nội dung vẫn dùng lựa chọn đã gửi làm phương án tương thích; vai trò công việc được phân lại. UI mới và production luôn gửi đủ hai cấu hình.

## Kiểm tra

- `scripts/verify-motion-scene-routing.ts`: kiểm action dựng cảnh của kho/Remotion, auto voice, voice riêng và lựa chọn model nghiêm ngặt với hai AI khác nhau; cập nhật fixture theo kiến trúc action service hiện tại.
- `scripts/verify-motion-scene-ai-settings.ts`: hai cấu hình UI độc lập, lưu/reload và payload thực tế chứa đủ AI nội dung + AI dựng hình.
- `scripts/verify-motion-illustration-profiles.ts`: cả ba Kiểu hình, review và sửa riêng trường/nhóm đều nhận đúng provider/model/role.
- `scripts/verify-motion-production-runner.ts`: production truyền riêng cấu hình, voice dùng AI nội dung; giữ retry/resume và chạy song song.
- `scripts/verify-motion-closed-pipeline.ts`: hai gói kho vẫn đóng, không tạo ngoài kho, các lời gọi đọc/chọn/review/âm thanh nhận vai trò nội dung.
- Kiểm hồi quy Remotion, giảm phân cảnh và TypeScript.

## Thử Gemini Argon

- Thư mục kết quả: `scratch/motion-argon-styles-20261028/`.
- Ba kiểu: Truyện ma, Lịch sử, Giải thích. Mỗi kiểu một đề bài chung cho `gemini-argon::low` và `gemini-argon::medium`.
- Sáu cảnh độc lập qua service chat Chrome thật và pipeline phân cảnh → thiết kế → SVG → compiler → renderer Remotion.
- Giới hạn đúng một cảnh mỗi phép thử, camera cố định, bật chuyển động người/hiệu ứng, review ảnh AI tắt; không gọi TTS hoặc tạo video sản xuất dài.
- Phép so sánh đặt cả hai vai trò cùng model đang thử; kiểm hồi quy dùng hai provider/model khác nhau để xác minh tách vai trò.
- Lưu prompt, response, checkpoint, SVG, thiết kế, hai ảnh ở frame 0/90 và clip một cảnh. `requests.json` ghi provider/model/role; `results.json` ghi trạng thái và thời gian.
- Không tự chuyển sang nhà cung cấp hoặc model khác nếu Argon lỗi. Không sửa tọa độ/SVG bằng tay để làm đẹp kết quả thử.
- Xuất được clip và qua kiểm dữ liệu không đồng nghĩa đã đạt chất lượng video mẫu hoặc bảo đảm nhất quán trên video dài.

### Kết quả lượt thử thực tế

| Kiểu hình | Argon thấp | Argon trung bình |
| --- | --- | --- |
| Truyện ma | Chưa có clip: hết thời gian chờ phản hồi dựng SVG sau khi đã có phân cảnh và thiết kế | Chưa có clip: hết thời gian chờ phân cảnh |
| Lịch sử | Đã xuất clip 10,7 giây, 3 request, 5 animation track | Chưa có clip: đã có phân cảnh, hết thời gian chờ thiết kế |
| Giải thích | Đã xuất clip 10,7 giây, 4 request, 4 animation track | Chưa có clip: đã có phân cảnh, hết thời gian chờ thiết kế |

Đã xem ảnh đầu và frame 90 của hai clip hoàn tất. Cảnh Lịch sử đặt chỉ huy trái, bàn giữa, lính phải; đèn và bản đồ trên bàn, chân người tiếp đất. Cảnh Giải thích có đủ ba nhãn và chiều mũi tên bốc hơi/mưa đúng. Đây là minh họa đơn giản; chưa kiểm chứng trang phục lịch sử và chưa đủ dữ liệu kết luận mức tư duy nào cho hình tốt hơn.

Các lượt lỗi ghi `candidateChars=0`, không có phản hồi mới để đánh giá hình. Ảnh tự lưu của Truyện ma trung bình là trang chat trống; Truyện ma thấp còn hiển thị xác nhận nhận phần ngữ cảnh 2/2. Log xác nhận gửi hiện dựa cả vào việc ô nhập rỗng, nên chưa chứng minh được lỗi do năng lực model. Không tự đổi model, không tự ghép hình giả để điền đủ sáu mẫu.

Công cụ điều khiển Chrome trực tiếp đã dừng do không xác minh được URL an toàn trên Windows; không thực hiện thêm thao tác trực tiếp hay thử lại qua đường điều khiển khác. Chỉ đợi các lượt đang chạy trước đó kết thúc và đọc log/ảnh chúng tự lưu. Bốn mẫu còn thiếu được giữ checkpoint để làm tiếp khi có thể điều khiển hợp lệ. Harness đã bổ sung giữ browser suốt batch cho lượt thử sau; thay đổi này chưa được kiểm thực tế trong batch đã kết thúc và chưa được kết luận là cách sửa timeout.
