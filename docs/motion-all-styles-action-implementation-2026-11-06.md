# Triển khai chỉ dẫn hành động cho mọi kiểu hình và thể loại

Ngày 06/11/2026. Theo plan `motion-one-pass-all-styles-genres-plan-2026-11-06.md`.

**Đã thay hướng theo phản hồi tiếp theo của người dùng:** các phần mô tả code ghép luật chuyển động theo unit/chủ thể bên dưới là lịch sử thử nghiệm, không còn là cơ chế hiện hành. Hiện tại AI viết `motionIntent` ngay trong kịch bản, tool chuyển nguyên văn sang vẽ. Bộ live theo hướng cũ đã dừng; xem `motion-script-authored-motion-implementation-2026-11-06.md` để biết triển khai và nghiệm thu hiện tại.

## Thay đổi trong tool

- `src/lib/motionSceneActionBrief.ts`: chiếu nguyên dữ liệu chủ thể/hành động/quan hệ từ scene brief, không dùng từ khóa lời dẫn để tự viết sự kiện. AI thiết kế tư thế đầu–diễn biến–cuối và keyframe trong cùng lần vẽ.
- `src/constants/motionSceneAction.ts`: quy tắc theo profile, 15 unit, 13 lớp đồ vật và 8 format; các chủ thể chưa khớp danh mục giữ mô tả nguồn và giải phẫu phù hợp.
- Phủ cả thành viên trong crowd/unit, không loại người cưỡi thú hoặc vật nằm trong unit khỏi hướng dẫn khớp. Số người hiện rõ trong brief được liệt kê thành các đơn vị tương ứng; số lớn vẫn dùng phạm vi ID mà không giảm số lượng.
- Người horror giữ thân áo liền và không có chân. Chỉ dẫn ID của người trong unit cũng đã tách theo profile; động vật không bị áp giải phẫu người horror. Cá/rắn không bị ép có bốn chân.
- Có ví dụ transform delta: vị trí/scale nằm trong SVG, animation không lặp lại vị trí ban đầu. Hướng dẫn gắn tay/vật cầm có thời điểm nhả/trao vật, không buộc vật theo tay cũ sau khi trao.
- Comparison explainer bỏ gợi ý cán cân mặc định. Verdict không tạo cán cân, bảng điểm hay con dấu chỉ vì tên thể loại.
- Bỏ việc dùng từ khóa đi/chạy/cưỡi trong narration để ép thêm cảnh nền cuộn. AI chọn cách biểu đạt theo brief, profile và khung hình đã yêu cầu.
- Prompt production và thử riêng cảnh cùng gọi `motionSceneBrief`. Không thêm AI phân tích, director, QA hoặc vòng sửa/vẽ lại sau sinh. Renderer không tự viết gait/IK hay thay keyframe.

## Tương thích và lỗi kỹ thuật

- Policy prompt hiện tại có revision riêng, dùng trong request key và `scene.generation`. Input key của hình accepted được giữ để không làm cảnh cũ tự dựng lại. Resume giữ nguyên provenance của cảnh cũ, kể cả cảnh lỗi thuộc policy trước; tạo lại vẫn là thao tác chủ động.
- Sửa lỗi validator từ chối layer vô danh hợp lệ của phản hồi hoàn chỉnh vì ID layer không trùng một node nguồn. Giữ layer, SVG và keyframe; named entity ngoài phép ánh xạ node nguồn vẫn phải hợp lệ. Hành vi validator của dữ liệu legacy giữ nguyên.
- Marker bản đồ/biểu tượng đã được scene khai báo là prop được ánh xạ về đúng loại theo **ID nguồn trùng chính xác** nếu AI ghi metadata character. Không suy đoán danh tính từ tên gần giống, không sửa artwork/animation và không chấp nhận channel ngoài schema.
- Loop sai được báo rõ: thời điểm bắt đầu, chu kỳ hoặc giá trị cuối khác giá trị đầu. Không quy mọi lỗi thành lỗi miệng/thoại. Nhánh một lượt báo dữ liệu chưa hợp lệ và giữ phản hồi gốc, không thông báo như sắp có vòng AI sửa.
- Các trần 96 track, 20 keyframe/track và SVG 150.000 ký tự giữ nguyên. Chưa có bằng chứng để nâng trần; không cắt track hoặc giảm người để vượt qua giới hạn.

## Kiểm chứng cục bộ

| Kiểm tra | Phạm vi |
| --- | --- |
| `npm run test:motion-action-brief` | 96 tổ hợp profile/genre/format; 45 tổ hợp unit/profile; 84 tổ hợp loài/profile; 39 tổ hợp lớp đồ vật/profile; 21 tổ hợp view/profile. Kiểm nguồn không bị sửa, horror không bị thêm chân, trao vật và ID từng đơn vị |
| Bản mẫu đã duyệt | Đọc phản hồi gốc cảnh 41 qua normalizer hiện tại, giữ đủ layer và nguyên 48 track; lấy mẫu nhiều thời điểm bằng đường render production |
| `npm run test:motion-one-pass` | 18 cảnh fixture, đỉnh 5 worker; không QA/repair/director; một phản hồi/cảnh; tắt motion, resume, tạo lại riêng cảnh; policy mới không tự gửi lại dữ liệu cũ |
| `verify-motion-rig-brief.ts` | Khớp người/động vật/bánh xe/crowd; tắt chuyển động; người horror legless; từ khóa hành trình không tự thêm nền cuộn |
| Regression liên quan | Render behavior, action camera, log sections, trích xuất response và vòng đời room trên Chrome có cửa sổ |
| Giao diện | Frontend đang phục vụ trên port 3002, Chrome cài thật; storage trình duyệt riêng và API đọc fixture; review ẩn trong 3 profile Remotion, chế độ kho giữ điều khiển cũ |

Bằng chứng cục bộ: `scratch/motion-all-styles-20261106/offline-verification.json`. Những kiểm tra này là nghiệm thu phát triển; không đưa thành QA khi người dùng chạy tool. Test cũ `verify-motion-profile-prompts.ts` có lỗi định dạng marker từ trước như báo cáo một lượt trước đó; không dùng test đó để kết luận ma trận mới đạt hoặc bỏ assertion để báo pass.

## Nguồn case thực tế

Manifest `scratch/motion-all-styles-20261106/source-manifest.json` ghi nhận 1.486 cảnh trong 46 production Remotion có dữ liệu phân cảnh, gồm cả các giá trị thể loại legacy. Có 452 cảnh có timed spec và plan nguồn dùng được cho việc thử không lập lại sự kiện ở phiên bản hiện tại.

Nguồn gốc hiện có ba tổ hợp hợp lệ: history/pov, history/verdict và horror/witness. Chưa có production explainer hoặc đủ 12 tổ hợp. Vì vậy bộ live dùng 3 tổ hợp gốc và các biến thể cấu hình trên bản sao scene thật cho các tổ hợp còn lại. Nội dung nguồn giữ nguyên; không gọi các biến thể này là một video hoàn chỉnh vừa viết theo thể loại mới.

Trong corpus có illustration, card, comparison, map và diagram; chưa đủ process/timeline/cutaway để tuyên bố đã kiểm live các dạng đó. Ba dạng còn thiếu được kiểm hợp đồng prompt bằng fixture. Các loài/unit khác cũng có phạm vi fixture lớn hơn phạm vi dữ liệu live; không suy rộng thành chất lượng hình đã được xác nhận.

## Thử Gemini/Chrome và giới hạn chất lượng

Các phản hồi thử trong phát triển được giữ ở các thư mục riêng; không ghi đè production. Mỗi bản policy được ghi nhận riêng, không chọn clip đã sửa để báo là lượt đầu đạt.

- Policy 1: `storage/output/motion-video/clip-demo/one-pass-production-20261106-1793945594806`. Một phản hồi, 15 track; có lỗi lặp vị trí gốc trong animation và ngựa phụ trượt nguyên cụm. Đây là ca chưa đạt chất lượng.
- Policy 2: `storage/output/motion-video/clip-demo/all-styles-actions-20261106`. Giữ cả lỗi layer vô danh, loop không khép, layer trỏ tới phần tử không phải group và sự cố harness render. Lỗi parser layer vô danh đã được sửa; bản raw được phát lại qua pipeline để kiểm tương thích mà không gọi provider thêm. Replay không phải lần AI sinh mới, thời gian replay không phải tốc độ AI.
- Policy 3: `storage/output/motion-video/clip-demo/all-styles-actions-v3-20261106`. Dùng prompt bổ sung danh sách từng đơn vị từ số lượng thật; kết quả chi tiết trong `verification.json` tại thư mục này. Case đúng dữ liệu được render/phát trên Chrome cài thật, giữ 1080p/30fps/CRF23 của bài thử.

**Không coi một phản hồi render được là chất lượng hành động đã đạt.** Các phản hồi vẫn có thể bỏ động tác khớp, dùng loop sai hoặc vi phạm schema dù đã được hướng dẫn. Giữ yêu cầu không QA/tự sửa đồng nghĩa tool sẽ giữ và báo những phản hồi đó; code không biến chúng thành động tác hoàn chỉnh bằng một thuật toán thay thế.

Chưa có số đo full video 98 cảnh của chính sách mới. Thời gian kiểm chứng từng clip không dùng để cam kết ETA hoặc chất lượng 100% cho mọi cảnh.

## Bản chạy và nghiệm thu cuối

Backend hiện chạy bằng `tsx watch server.ts`, tự nạp thay đổi trong graph import. Không dừng/restart Chrome dùng chung hoặc production đang chạy để triển khai. Đây là cập nhật source/bản dev đang chạy; chưa đóng gói Electron/release hay tạo commit.

Kết quả cuối của bộ live, nhận xét hình/chuyển động và kiểm tra TypeScript/diff sẽ được bổ sung sau khi bộ thử hoàn tất.
