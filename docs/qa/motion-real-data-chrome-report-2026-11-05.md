# Motion: sửa lỗi và kiểm chứng bằng Chrome thật — 05/11/2026

## Thay đổi chức năng

- Lượt vẽ đầu dùng pool 5 room như trước. Sau lượt đầu, cảnh lỗi được phục hồi trước vòng sửa tư thế/khung; các bước tạo chuyển động và duyệt ảnh chờ đủ hình hợp lệ trong phạm vi đang dựng.
- Giữ đầy đủ bước chất lượng hiện có. AI duyệt ảnh vẫn xem khung hình có chuyển động; khi AI sửa SVG, motion được tạo lại theo SVG mới trước lần duyệt kế tiếp. Tạo lại một cảnh vẫn chỉ xử lý phạm vi đã chọn.
- Bỏ cơ chế tự cắt node/effect và giảm chi tiết/tư thế/chuyển động trong các vòng recovery. Giữ validation, nguồn, model, tham chiếu và quy tắc continuity.
- Generic refusal dạng “chỉ là một mô hình ngôn ngữ” được vào recovery. Hàm Retry nhận đúng menu Gemini và biến thể tạo lại trực tiếp; không đọc lại thuộc tính của nút đã biến mất sau click, không lấy câu trả lời cũ làm kết quả mới. Sau native Retry thất bại vẫn là hai lần cùng room rồi thay room một lần theo ngân sách chung.
- Chờ thao tác nhập hoàn tất trước khi kiểm tra/gửi; truyền signal vào các bước đọc liên quan và không coi exception là bằng chứng browser responsive. Giữ xác nhận nội dung, gửi và ACK.
- Chuẩn hóa ID render sai ký tự và ID trùng không có tham chiếu mơ hồ. Giữ ID nghiệp vụ, toàn bộ hình học và chuyển động; duplicate có tham chiếu vẫn bị chặn.
- Khi còn draft SVG bị lỗi cấu trúc, giữ draft và lỗi cụ thể để dùng luồng sửa có mục tiêu thay vì bỏ toàn bộ phần đã có. Không tự xóa thẻ/đối tượng khi chưa xác định chắc cách sửa.
- Prompt phân cảnh chỉ cho phép format có trong schema; bỏ ép thiết bị cân/bảng điểm ở các ràng buộc còn sót. Không tự đổi format không rõ nghĩa sang illustration.
- Nếu chỉ sai format, yêu cầu AI trả patch format và giữ nguyên các trường còn lại, dùng cơ chế merge sẵn có; không bắt AI viết lại nodes/camera/layout của các hàng đã có dữ liệu hợp lệ.
- Sửa mức độ log, tên bộ đếm yêu cầu nghiệp vụ, thông báo còn cảnh hoãn và phạm vi hoàn tất. Không báo “không còn cảnh lỗi” chỉ vì danh sách lỗi đủ điều kiện của một vòng đã rỗng.

## Dữ liệu gốc và cách ly kiểm chứng

- Job gốc: `f61fc4d8-bc64-4678-8ccc-40ae950dac07`; baseline commit `55ed8f99a943b7e4cc4d614cbcc2dabd2c0b230c`.
- Baseline 36 cảnh gồm 27 accepted + 9 failed; copy riêng 13 file với SHA-256, gồm job, journal, draft, phản hồi lỗi, DOM và ảnh có sẵn. Snapshot lúc bắt đầu triển khai được giữ nguyên.
- Baseline: [manifest](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/baseline/manifest.json). Kịch bản capture từ chối ghi đè baseline đã tồn tại.
- Storage/output/checkpoint của kiểm chứng nằm riêng dưới `scratch/motion-real-recovery-20261105`. Không khởi động lại job gốc. Lượt chạy gốc đã có log hủy lúc 16:55:52 trước khi kiểm chứng.
- Chrome cài thật: `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`; bản live ghi nhận `156.0.8078.80`. Kiểm chứng UI dùng cửa sổ hiển thị; render bằng renderer sản phẩm dùng Chrome cài thật với chế độ headless hiện có, rồi mở clip trong Chrome hiển thị để kiểm phát.
- Profile đăng nhập do sản phẩm cấu hình được dùng để gọi Gemini; không đưa cookie/token/profile vào fixture hoặc báo cáo Git. Các bản sao thô, prompt, DOM và ảnh ở scratch được giữ local.

## Kết quả thực tế

| Ca | Bằng chứng | Kết quả và giới hạn |
| --- | --- | --- |
| Gửi prompt thật từng bị refusal | Prompt của `a8c3f22c` lấy từ user-query trong DOM gốc, đổi requestId; gửi 22.178 ký tự bằng service sản phẩm, Flash/medium | Gemini trả kết quả qua bộ chuẩn hóa/kiểm tra SVG hiện có; đã mở preview trên Chrome. Không gọi đây là toàn dự án hoàn tất. |
| Prompt motion dài và ACK | Cùng cảnh `c3_event_2c501575eda0:0` từng gặp lỗi; dựng lại bằng builder sản phẩm với rig/source/bible đã lưu; 17.545 ký tự, budget 16.000, Flash/low | Gemini lần đầu chưa xác nhận phần 1/2; luồng sửa ACK trong room nhận đủ hai ACK, sau đó task cuối trả motion hợp lệ ngay lần contract đầu. Không cắt dữ kiện hoặc nâng budget. Đây là prompt dựng lại từ dữ liệu thật, không phải byte replay của prompt 17.067 ký tự cũ. |
| Format verdict/scoreboard | Ba hàng bị lỗi của `7ee925...`, gửi qua prompt repair của sản phẩm tới Gemini thật | Nhận patch chỉ có line IDs + format hợp lệ; không viết lại các trường còn lại. Ghép qua sceneContract với 9 line nguồn từ script gốc cho 9 hàng hợp lệ; toàn bộ kết quả merge bằng HEAD gốc, giữ logic chuẩn hóa pose/evidence hiện có. |
| Native Retry trực tiếp trên Gemini | Hàm sản phẩm bấm tạo lại trong room kiểm chứng của ca trên, chờ phản hồi mới | Nhận 22.696 ký tự và bố cục hợp lệ; số user-query không tăng, không gửi thêm tin người dùng. [Kết quả live](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/native-retry-live-results.json). |
| Refusal + menu như ảnh | DOM/response thực của room `2ed5128df2bc9939` được phát lại trên Chrome và qua nhánh recovery của service sản phẩm | Bấm đúng Thử lại; generator chỉ gọi một lần, không submit lại prompt. Kết quả trả sau click được điều khiển trong replay; đây không phải generic refusal mới phát sinh tự nhiên trên Gemini. |
| Nút biến mất sau click | Control trực tiếp lấy từ DOM Gemini live; replay xóa control ngay khi bấm | Hàm trả đúng một click, không chờ đọc thuộc tính từ nút đã mất. Lỗi này được phát hiện bằng Chrome thật và đã sửa. |
| Hai retry cùng room rồi room mới | Service sản phẩm + Chrome hiển thị | Native Retry trước, hai retry dùng cùng page vật lý, page mới sau đó, ngữ cảnh được khôi phục; phản hồi muộn và chưa rõ đã gửi không bị submit trùng. |
| 27 đạt + 9 lỗi | Pipeline sản phẩm, dữ liệu gốc, 5 tab Chrome hiển thị; phát lại lỗi thực và điều khiển phản hồi ở adapter AI | Peak 5 request vẽ; phục hồi ngay sau lượt đầu; 0 request motion khi thiếu hình. Node/effect và composition của 27 cảnh ngoài phạm vi giữ nguyên. Khi lỗi tiếp diễn, dừng chưa hoàn tất, không báo đủ hình. |
| Tạo chuyển động sau barrier | Hai cảnh accepted thật, phát lại chính SVG và motion của từng cảnh | Chỉ gọi motion sau khi đủ hình trong phạm vi chọn. Không dùng motion của cảnh khác. |
| Chức năng duyệt ảnh | Hai cảnh trên, bật review và render khung hình bằng renderer sản phẩm | Đã xác nhận frame có AI-directed motion và build.review hợp lệ. Envelope duyệt `ok:true` là mô phỏng để kiểm điều phối/budget; không phải AI live đánh giá chất lượng ảnh. |
| ID có dấu `ptéryges` | SVG/draft gốc + bản sửa; render Chrome trước/sau | Đạt; ảnh PNG bằng nhau tại 3 mẫu keyframe, animation values giữ nguyên. |
| ID `leg-left`/`leg-right` trùng | SVG gốc có 10 ID mỗi loại; đổi tên các ID không được tham chiếu | Đạt; PNG bằng nhau tại 3 mẫu keyframe. Ca thêm tham chiếu mơ hồ vẫn bị từ chối. |
| SVG đóng thẻ sai | Draft thực `cde21f84...` được đưa vào pipeline, sau đó trả chính bản hợp lệ đã có của cùng cảnh | Pipeline giữ SVG lỗi, đưa đúng lỗi đóng thẻ vào request repair, nhận bản sửa hợp lệ. Đây là replay, không phải lượt Gemini live sửa SVG này. |
| Clip với chuyển động | Một cảnh thật cùng motion của nó, qua renderer sản phẩm | Render clip 3 giây 1920×1080; mở Chrome hiển thị, video có thời gian phát tăng và không có lỗi media. [Clip](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/actual-scene-motion.mp4). |
| Settings Chrome dự phòng | Chrome hiển thị + card/controller sản phẩm | Bật/tắt, lưu qua reload, tiếng Anh/mobile và từ chối input API sai đều đạt. |

Thông tin máy đọc được:

- [Gemini live](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/gemini-live-results.json).
- [Prompt dài và ACK trên Gemini](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/context-gemini-live-results.json).
- [Sửa format trên Gemini và đối chiếu merge gốc](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/format-gemini-live-results.json).
- [Dữ liệu SVG và menu trên Chrome](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/real-data-chrome-results.json).
- [Điều phối, review và structural repair](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/drawing-order-results.json).
- [Clip đã phát trên Chrome](D:/video-AI-vidify/scratch/motion-real-recovery-20261105/actual-clip-results.json).

## Gate kỹ thuật và hồi quy

Đã qua TypeScript toàn bộ src, ESLint các source/script đã sửa, `git diff --check`, Vite production build và server bundle vào scratch. Renderer sản phẩm đã bundle và render clip thực. Build có cảnh báo chunk lớn và `import.meta` trong CJS; không coi các cảnh báo đó là lỗi mới được sửa trong phạm vi này.

Các kiểm tra liên quan đã qua:

- `verify-chat-room-lifecycle.ts` với `VIDIFY_VERIFY_CHROME_VISIBLE=1` và `VIDIFY_VERIFY_REAL_CASES=1`: composer độc lập, hội thoại giữ nguyên URL, ACK chia prompt, native Retry, exact refusal/menu và ngân sách room.
- `verify-chrome-backup.ts`: quota đúng model, Settings tắt, chuẩn bị/bàn giao đồng thời, chờ lưu, lỗi đóng/lưu, hủy và backup hết quota. Tín hiệu quota trong kiểm tra điều phối là mô phỏng.
- `verify-chrome-backup-settings.ts`, `verify-motion-room-budget.ts`, `verify-motion-ai-recovery.ts`, `verify-chat-submission-recovery.ts`.
- `verify-motion-cancellation.ts`, `verify-motion-persistence-integrity.ts`: hủy, lưu/tiếp tục, snapshot và log qua restart/phân trang.
- `verify-motion-log-events.ts`, `verify-motion-log-sections.ts`, `verify-motion-verdict-visuals.ts`, `verify-genre-editorial-contracts.ts`, `verify-motion-scene-consistency.ts`, `verify-chat-composer-validation.ts`.
- Các script mới dùng baseline thực: `verify-motion-real-data-chrome.ts`, `verify-motion-drawing-order-real.ts`, `verify-motion-gemini-real.ts`, `verify-motion-native-retry-real.ts`, `verify-motion-real-clip.ts`.
- `verify-motion-context-gemini-real.ts`, `verify-motion-format-gemini-real.ts`, `verify-motion-format-merge-real.ts`: prompt dài/ACK, patch format với Gemini live và đối chiếu logic merge với source HEAD gốc.

Một test có sẵn vẫn lỗi: `verify-motion-scene-plan-recovery.ts` kỳ vọng lỗi `entityId` ở dòng 21. Đã bundle và chạy lại test với toàn bộ source src đọc trực tiếp từ HEAD gốc, không checkout/ghi đè working tree; cùng assertion đó cũng lỗi. Không thay quy tắc phân loại nhân vật để ép test qua. Các hàm merge của sceneContract không được sửa trong patch này.

## Phạm vi chưa xác nhận

- Chưa chạy lại toàn bộ 36 cảnh qua Gemini rồi xuất toàn bộ phim. Các case live và replay được ghi riêng trong bảng; không dùng replay để tuyên bố mọi lỗi live đã tái hiện.
- Không tạo quota cạn tự nhiên để thử lại bàn giao Chrome. Bộ điều phối/quota đã được hồi quy; không thay đổi lifecycle backup trong patch này.
- Ca ACK live dùng prompt dựng lại 17.545 ký tự của đúng cảnh cũ, không có nguyên bản byte-for-byte của prompt 17.067 ký tự. Nguyên nhân mọi renderer/composer timeout ngoài đời chưa được quy về một nguyên nhân duy nhất.
- Không có cơ sở bảo đảm mọi phản hồi AI hoặc mọi tổ hợp cấu hình luôn thành công 100%. Các thay đổi giữ kiểm tra nghiệp vụ; lỗi chưa sửa được vẫn phải thể hiện chưa hoàn tất và giữ tiến độ.

## Sửa kết luận QA cũ

Báo cáo `motion-chrome-recovery-report-2026-11-05.md` trước đây chỉ kiểm Retry button trực tiếp, chưa phủ refusal/menu thật; prompt chung cũng còn ràng buộc thiết bị phán quyết. Báo cáo này bổ sung bằng chứng và giới hạn cho hai phần đó. Không dùng dòng “đã kiểm Retry” của báo cáo cũ như bằng chứng bao phủ đầy đủ UI Gemini.
