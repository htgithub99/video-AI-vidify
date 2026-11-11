# Video Motion: một lượt sinh hình và chuyển động

Triển khai ngày 06/11/2026 theo yêu cầu giữ prompt vẽ hiện tại, trả luôn chuyển động và bỏ QA/vẽ lại tự động sau sinh.

## Luồng đã áp dụng

1. Giữ phân cảnh nguồn, nhân vật, phong cách, tham chiếu vật/cảnh và cấu hình người dùng.
2. Tối đa 5 room dựng cảnh. Mỗi cảnh dùng một yêu cầu sinh trên model vẽ đã chọn, trả đủ `svg`, `layers`, `animations`, `design`, `continuityNotes`.
3. Chỉ đọc dữ liệu và kiểm cú pháp/ID/keyframe để render được, rồi lưu nguyên chuyển động AI trả kèm. Ánh xạ metadata nhân vật về entity nguồn theo đúng ID nhóm, không sửa hình hoặc keyframe.
4. Không gọi AI đạo diễn motion, AI review, đo cơ thể/khớp, chụp frame chấm hình, sửa tư thế/khung, phục hồi hình lỗi sau lượt đầu hoặc vòng vẽ lại thẩm mỹ.
5. Không thêm nhún/lắc/effect mặc định, bỏ track hoặc thay biên độ/đường đi của cảnh mới. Cảnh cũ giữ cách đọc/render cũ.
6. Sau khi đủ dữ liệu cảnh, compile/render với giọng, phụ đề, SFX và thiết lập xuất hiện có.

Không thay logic biên tập kịch bản, tạo giọng/ASR, SEO, menu dự án khác hoặc QA của chế độ ghép kho. Bỏ nút duyệt ảnh và nút kiểm tra frame trong giao diện Remotion; chế độ kho vẫn giữ các điều khiển cũ. API kiểm Remotion chỉ còn kiểm dữ liệu kỹ thuật, không render các frame QA.

## Prompt

- Giữ bộ dựng brief và khung nhân vật/phong cách hiện có.
- Đổi chỉ dẫn “mỗi người một loop nhỏ/giữ chân đứng yên” thành thực hiện đúng hành động theo brief; cảnh tĩnh giữ tĩnh.
- Đưa thời lượng cảnh vào yêu cầu. Yêu cầu AI phối hợp trạng thái đầu–giữa–cuối, mọi thành viên tham gia hành động, chi/điểm cầm/điểm ngồi và chân chống.
- Chuyển động một chiều không dùng `period`; loop thực sự trở về đúng giá trị đầu. Giữ cấu trúc transform/path giữa các keyframe và giới hạn dữ liệu hiện có.
- Xóa câu “bước motion riêng sẽ làm sau”; yêu cầu vẽ và animate trong cùng phản hồi.

## Một lượt sinh và tiếp tục

- Contract sinh cảnh có ngân sách 1; không chuyển model/provider để sửa nội dung, không gọi prompt repair sau phản hồi lỗi.
- Từ chối nội dung/JSON sai của yêu cầu một lượt không kích hoạt native regenerate. Phục hồi lỗi giao diện/kết nối của các tác vụ khác vẫn giữ native Retry → 2 lần cùng room → room mới. Cấu hình Chrome dự phòng vẫn được giữ.
- Lưu trạng thái `generation` theo input cảnh. Cảnh đã lưu được dùng lại. Cảnh đã bắt đầu nhưng chưa xong/lỗi không tự sinh lại khi tiếp tục.
- Phản hồi gốc còn trong checkpoint có thể được đọc/lưu lại sau sửa lỗi xử lý dữ liệu mà không gọi AI thêm.
- Người dùng vẫn có thể chủ động tạo lại riêng cảnh. Lỗi kỹ thuật không bị gắn nhãn “đã hoàn thành”; các cảnh khác và dữ liệu nguồn được giữ.
- Tránh lấy room chat làm trang Flow dùng chung; phát hiện room Gemini chuyển origin để dừng chờ sai trang, giữ URL cuộc trò chuyện để đọc lại yêu cầu cũ.

## Render

- Cảnh mới mang `animationSource: ai-complete`; renderer dùng nguyên các track AI. Không áp bộ giới hạn/chuyển loop dịch chuyển thành đường đi mặc định dành cho cảnh cũ.
- Lấy mẫu theo frame xuất, không dùng cache lượng tử hóa 12/15 fps cho cảnh mới. Giữ nguyên FPS/độ phân giải/CRF cấu hình.
- Lưu thời lượng dùng lúc vẽ và ánh xạ thời gian sang thời lượng giọng cuối cùng để cảnh hoàn tất hành động khi clip kết thúc. Preview dùng thời lượng cảnh thay vì nén toàn hành động vào một giây.

## Kiểm chứng triển khai

Các kiểm thử dưới đây là nghiệm thu code trong lúc phát triển; không được đưa vào pipeline QA khi người dùng chạy dự án.

| Kiểm tra | Kết quả/phạm vi |
| --- | --- |
| `verify-motion-one-pass.ts` | Đạt: 18 cảnh fixture trên history/horror/explainer; đỉnh 5 worker; không gọi geometry/still/review/motion; không thêm/bỏ/thay keyframe; lỗi kỹ thuật chỉ một phản hồi; resume không gửi lại; tạo lại riêng cảnh vẫn hoạt động; giữ fixed/off và rendering cũ |
| `verify-chat-room-lifecycle.ts` với Chrome có cửa sổ | Đạt: tác vụ thông thường vẫn phục hồi UI đúng ngân sách; cảnh một lượt gặp refusal không regenerate hoặc gửi lại |
| `verify-motion-one-pass-ui.ts` | Đạt trên frontend Vite thật và Chrome cài thật: bỏ toggle review ở cả 3 phong cách Remotion; chế độ kho vẫn có; không lỗi trang. Storage trình duyệt riêng, API đọc dùng fixture và engine thật |
| `verify-chrome-backup.ts` | Đạt với dữ liệu UI/fixture: quota, lưu trước khi đóng, handoff đồng thời, hủy, tắt chuyển, thiếu/hết Chrome dự phòng. Không cố tình làm cạn quota live |
| Render behavior / action camera / log sections | Đạt các kiểm thử liên quan |
| TypeScript và diff whitespace | Đạt trước bàn giao; ghi bổ sung nếu lần kiểm cuối có thay đổi |

Test `verify-motion-profile-prompts.ts` cũ lỗi ở việc tìm chuỗi `Context:\n` trong prompt. Chạy lại test với các file nguồn trước đợt thay đổi này (lấy từ Git index) vẫn lỗi cùng chỗ; không hạ assertion để báo pass. Bằng chứng: `scratch/motion-one-pass-20261106/baseline/profile-result.json`. Bộ thử một lượt mới kiểm cả ba phong cách.

## Case Gemini và video thật

Nguồn: production Granicus `f82fe2c76c1ab22004a52e6147acdf2c`, cảnh 41, 173 frame, 5,7667 giây. Không ghi đè production nguồn.

Thư mục: `storage/output/motion-video/clip-demo/one-pass-production-20261106-1793942711924`.

- Chạy qua `buildRemotionScenes` mới, Gemini Flash medium trong Chrome thật có cửa sổ.
- **Một lời gọi sinh nội dung**, nhận SVG và 13 track animation. Không AI review, không motion director, không AI repair.
- Lượt đầu chặn metadata `entityId=alexander_focal` trong khi entity nguồn là `alexander`. Sửa cách ánh xạ metadata dựa vào ID nhóm nguồn, rồi tiếp tục để lưu lại chính phản hồi gốc từ checkpoint. Không gọi Gemini lần hai, không sửa SVG/keyframe.
- Tab cũng từng chuyển sang Labs khi đang chờ; ghi nhận lỗi và bổ sung cách chọn tab/đọc lại. Không suy đoán chắc chắn tác nhân gây chuyển trang. Thời gian 1,202 giây trong báo cáo resume chỉ là đọc/lưu phản hồi đã có, không phải thời gian Gemini sinh cảnh.
- Render bằng Remotion trên Chrome cài thật có cửa sổ, phát thử MP4, kiểm ffprobe: 1920×1080, 30 fps, 173 frame, có âm thanh.
- `verification.json` xác nhận mảng animation trong dữ liệu lưu giống hệt phản hồi Gemini, nguồn production không thay đổi.

Đây là nghiệm thu luồng một lượt, không phải kết luận chất lượng hình/động tác đạt 100%. Trong case này AI vẫn chủ yếu dịch toàn cụm ở các kỵ binh phụ; không tự sửa hoặc vẽ lại theo yêu cầu mới. Bỏ QA không đảm bảo AI sẽ luôn tạo đúng động tác. Chưa chạy full video 98 cảnh bằng luồng mới, chưa công bố ETA tổng mới.
