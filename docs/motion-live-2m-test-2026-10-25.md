# Kiểm thử production 2 phút — 25/10/2026

## Phạm vi

Người dùng yêu cầu tạo video 2 phút để thử lại luồng hiện tại. Chỉ chạy production `root-live-2m-20261025`, không chạy hoặc tiếp tục video 20 phút.

Chạy API production thật trên backend của dự án, gói Chibi màu dân gian, Gemini Flash Low cho nội dung và dựng cảnh, giọng kênh Truyện ma với mẫu Thần trùng, ASR bật, review ảnh tắt, hình tĩnh, phụ đề và âm thanh môi trường bật. Mục tiêu 120 giây, bản nháp 16:9/24 fps/CPU, tự xuất MP4.

Nguồn ngắn “Tiếng gọi sau cánh cửa”, kiểm quan hệ người bệnh nằm trên giường/người chăm đứng hoặc ngồi cạnh, đồ vật và manh mối. Biên kịch tự chuyển thành truyện “Nén nhang cắm ngược”. Cấu hình và dữ liệu kiểm tra lưu ở `scratch/motion-live-2m-root-20261025/`.

## Lỗi thực tế đã phát hiện và sửa

### Hợp đồng nhu cầu minh họa báo lỗi quá chung

20:54:45, production dừng sau hai phản hồi dàn ý không đạt. Phản hồi thật: `motion-story-doctor-f5053005.json` và `motion-story-doctor-040cc3a6.json` trong `storage/output/motion-video/ai-debug/`.

- Câu bằng chứng ở hình đầu không chứa các danh từ “đĩa gạo”, “đèn dầu” đã khai báo. Lượt sửa chỉ thay câu bằng chứng nhưng vẫn giữ đồ vật không được câu đó hỗ trợ.
- Các `support` dùng mã bối cảnh `chai_bep` thay vì fixture cụ thể như `bed`, `chair`, `table`.
- Bộ kiểm cũ trả boolean và thông báo chung, nên yêu cầu sửa không chỉ rõ row/trường đang sai.

Đối ứng chung:

- Thêm chẩn đoán theo đường dẫn row/trường, vẫn giữ API boolean cho caller cũ.
- Prompt nêu rõ mỗi danh từ vật phải nằm trong câu bằng chứng, chỗ tựa phải là fixture; vật phụ có thể bỏ, manh mối thiết yếu phải giữ.
- Repair chỉ kèm hướng dẫn hợp đồng đang lỗi, không yêu cầu viết lại dàn ý đã đạt.
- Migration hợp đồng một lần, giữ bản nháp và số phản hồi lỗi cũ, thêm tối đa hai lượt sửa; tiếp tục lại không tự cấp ngân sách mới.
- Log đếm từ có fallback khi đầu vào API không truyền `words`; request thử ban đầu thiếu trường này. Không thay input/hash production đã lưu.

Đã qua TypeScript, `verify-motion-plan-readiness.ts`, `verify-motion-story-craft.ts` và regression dùng chính phản hồi lỗi thật `verify-needs-recovery.ts`. Regression kiểm thông báo từng trường, giữ truyện đạt, migration hữu hạn và không gọi lại AI khi draft đã đạt.

20:57:54 nạp backend mới và tiếp tục cùng production. 20:58:33, repair đạt sau một yêu cầu, chuyển sang DNA của truyện mới.

## Nghiệm thu

Đang chạy; chưa có kết luận video hoàn chỉnh, chất lượng hình hoặc giọng nghe. Kết quả kiểm cục bộ không thay cho nghiệm thu MP4 cuối.

### Tiếp tục lượt thử lúc 21:26

- Giữ production `root-live-2m-20261025`, không khởi tạo lượt 20 phút. Nạp backend v4 ở cổng 3002 để dùng các sửa đổi đã lưu; tiếp tục qua API production/resume.
- Sửa ưu tiên tư thế trong `normalizePuppetReadContinuity`: `action` mặc định `stand` không được ghi đè `posture: lie/sit` đã khai báo. Kiểm hồi quy người nằm từ hình đầu, giữ tư thế qua câu nói và đứng dậy có chuyển trạng thái đã qua.
- Đường đọc vật giữ `catalogKey` khi `key` đã đổi sang mã cá thể. Bổ sung hồi quy qua `readPuppetLines` và hai lần `normalizePuppetVisualState`, xác nhận tra kho vẫn bằng mã tài nguyên, không bằng tên cá thể. `verify-motion-visual-contract.ts` đã qua.
- Bổ sung sao chép `readNormalizationVersion` khi phục hồi gen, tránh luôn coi cảnh đã đạt là bản chuẩn hóa cũ và xóa frame. Thay đổi này được kiểm cục bộ, chưa nạp vào backend v4 đang chạy để tránh ngắt nhánh giọng.
- Tại 21:29:09, ảnh diagnostic `motion-puppet-storyboard-624c5a47.png` xác nhận Google chuyển sang trang CAPTCHA. Tool đã báo chờ xác minh và mở Chrome; đã yêu cầu người dùng xử lý các tab. Nhánh giọng vẫn chạy. Đây là chặn dịch vụ, chưa có MP4 xuất cuối.

Log backend: `scratch/motion-live-2m-root-20261025/backend-v4.log`, trạng thái: `scratch/motion-live-2m-root-20261025/status.json`. Không tính ASR nghi vấn là đã xác nhận nghe sai và không đánh dấu video đạt khi chưa có đầu ra.

21:31:38, nhánh giọng hoàn tất: log báo 112 giây, tốc độ toàn track 3,47 âm tiết/giây. Kịch bản và SEO đã hoàn tất; phần hình vẫn chờ CAPTCHA, chưa có MP4. TypeScript và `verify-motion-closed-pipeline.ts` đã qua cho cả hai gói (AI giả lập, renderer thật, kiểm tiếp tục không gọi AI và giữ frame); không thay nghiệm thu lượt thật.

### Sau xác minh lần thứ nhất

21:33:51, tool tự nhận đã xác minh và gửi tiếp hai nhóm đang chờ; không tạo production mới. 21:34:33, hoàn tất 14 nhịp hình/21 câu nguồn, đọc lại từ kế hoạch không tốn lượt AI ban đầu. Gate kho phát hiện các mã đạo cụ tự dịch như `ritual_rice_salt_plate`, `oil_lamp`; chuyển sang sửa lựa chọn từ catalog. Không nhận sai mã để xuất cho xong.

Đối chiếu prompt cho thấy `MOTION_STORYBOARD.PLAN_READ` và schema READ vẫn yêu cầu key tiếng Anh trong khi kho có ID cũ như `dia_gao_nhang`, `den_dau`; bản tóm tắt kho còn gọi prop key là semantic key. Đã thống nhất ở các hằng số storyboard/READ/illustration/pack: ID catalog phải sao chép nguyên văn kể cả tiếng Việt, description/identity dùng tiếng Anh. Không đổi ID hay tạo tài nguyên mới. TypeScript đã qua; các thay đổi prompt này chưa nạp vào backend v4 đang giữ room.

21:35:23, Google yêu cầu CAPTCHA mới ở READ; ảnh diagnostic `motion-puppet-read-4facc174` ghi URL `/sorry/`. Đã yêu cầu người dùng xử lý đợt xác minh mới. Voice vẫn giữ 112,305 giây, chưa có MP4.

### Sau xác minh lần thứ hai

Người dùng báo đã xử lý các tab. Debug targets của Chrome cổng 9222 cho thấy các tab đã ở `gemini.google.com/library` và `/app`, nhưng log vẫn báo chờ xác minh. Bộ chờ cũ chỉ chấp nhận input hiện ra, nên Library không thể thoát chờ. Thêm `motionCaptchaPageReady`: nhận Library của đúng host Gemini khi có nội dung và không có dấu hiệu challenge; vẫn kiểm sẵn sàng/model trước gửi prompt như bình thường. Thêm `rich-textarea` vào dấu hiệu giao diện đã hiện cho màn hình nhập thu gọn. Không thao tác tự giải CAPTCHA.

`verify-motion-captcha-readiness.ts` đã qua: Library, URL có query, trang trắng, challenge trong text/URL, host giả, sai provider, trang loading và login. TypeScript đã qua.

Lượt thử được dừng qua API để nạp backend mới; bản trước reload lưu ở `scratch/motion-live-2m-root-20261025/before-captcha-readiness-reload.json`. Lệnh khởi động lại PID 71596 bị hệ thống phê duyệt tự động từ chối với lý do `blocked by policy`, chưa thực hiện restart. Đã hỏi người dùng cho phép restart backend hiện tại. Backend v4 vẫn chạy; production đang cancelled để bảo toàn checkpoint, chưa xuất MP4.

### Backend v5 sau khi được phép khởi động lại

Người dùng đã cho phép. Backend được khởi động lại thành công thành PID 71640, nạp bản sửa CAPTCHA và tiếp tục production cũ. Log tại `scratch/motion-live-2m-root-20261025/backend-v5.log`. Đã qua khâu chọn đạo cụ nhưng bị chặn ở ghép bối cảnh; chưa có MP4.

21:47–21:50, Gemini trả `chat_planning_provider_error_response` sau phục hồi room; tool giữ AI đã chọn và chờ dịch vụ 10 phút. Không đổi provider hoặc tạo lượt 20 phút.

### Sửa tìm phương án ghép trong kho

Dữ liệu thật cần giường nằm, ghế ngồi, điểm đứng cửa, hai mặt đặt riêng cho đĩa gạo và đèn dầu. Kho có các món nhưng bộ tìm chỉ xếp hạng theo từ khóa và có/không; các nhóm không thể đặt chung chiếm beam, các slot chồng lấn hoặc điểm đặt ra ngoài ảnh chiếm ngân sách thử. Ngoài ra, phân loại cả chuỗi nội thất thành một loại phòng khiến bàn lễ có thể biến phòng ngủ thành gian thờ; khuôn không phù hợp cũng có thể chiếm danh sách đầu.

Đối ứng chung: tính nhu cầu đồng thời theo support/kind/count, gộp cùng identity để không đếm hai lần; ưu tiên số contact thật, lọc khuôn theo loại nơi; kiểm khả năng đặt chung trước khi giữ nhóm và trước khi tính lượt thử. Dùng chung phép biến đổi hình học cho tìm kiếm và ghép SVG. Phân loại khuôn riêng với nội thất; vẫn kiểm loại nơi, không chấp nhận khuôn đền hay ngoại cảnh cho phòng ngủ, không nới điều kiện chồng lấn. Ghi lý do asset geometry bị loại vào log thay vì im lặng.

Kiểm dữ liệu thật bằng `inspect-assembly.ts` đã tìm được cảnh từ món có sẵn, qua `createPuppetSceneChoices` của 14 nhịp; đây là kiểm tại máy, chưa phải nghiệm thu hình xuất. `verify-motion-assembly-capacity.ts` kiểm cả hai gói, hai mặt đặt bàn, giữ nằm/ngồi/đứng cửa, không gọi AI và vẫn từ chối chồng lấn. Bản trước nạp sửa lưu ở `scratch/motion-live-2m-root-20261025/before-assembly-reload.json`.

22:04:34, TypeScript, `verify-motion-assembly-capacity.ts` và `verify-motion-pack-selection.ts` đều qua (hai gói; 8 stills ở bài kiểm chọn cảnh). Backend v6 khởi động thành PID 58596; log `backend-v6.log` và `backend-v6-error.log` trong thư mục lượt thử. Tiếp tục cùng production để nghiệm thu thực tế, chưa xác nhận video hoàn chỉnh.

## Kết quả xuất thực tế

22:08:25, production `root-live-2m-20261025` đạt trạng thái `completed`. File:

`D:/video-AI-vidify/storage/output/motion-video/nen-nhang-cam-nguoc-16x9-draft-1792940891486.mp4`

- 112,305 giây (mục tiêu gần 2 phút), 5.081.895 byte, H.264 1280×720, 24 fps; AAC stereo 48 kHz.
- `ffprobe` đọc đủ hai stream; `ffmpeg -v error ... -f null NUL` giải mã toàn file, exit 0, không báo lỗi.
- Chrome AI đóng ở 22:06:45 trước render; xuất mất 100 giây. Log âm lượng cuối -14 LUFS.
- 14 nhịp hình, 19 ảnh kiểm theo timeline; hai nhân vật, một bố cục phòng, không vẽ thêm và review ảnh AI tắt.
- Bảng ảnh tại `scratch/motion-live-2m-root-20261025/frame-board.jpg`, dữ liệu lời kể đi kèm tại `frame-audit.json`. Đây là kiểm trực tiếp tại máy, không gửi ảnh lên AI.

## Các lỗi nội dung còn thấy trong ảnh kiểm

Luồng xuất đã chạy hết; **chưa nghiệm thu đạt về nội dung minh họa**.

| Thời điểm xấp xỉ | Quan sát | Dữ liệu và nguyên nhân còn tồn tại |
| --- | --- | --- |
| 42–94 giây | Con trai cầm thanh gỗ quá sớm và quá lâu | READ đưa `then` trong lời gọi ngoài cửa thành `mount:held, owner:toi, transition:false`. Bộ giữ liên tục bảo toàn binding sai đầu tiên. Câu “chạm vào then” sau đó cũng bị hiểu là cầm then. Gate kiểm owner có hiện diện nhưng không chứng minh được hành vi tháo/cầm. |
| 59–71 giây | Câu tiến ra cửa/chạm then nhưng người vẫn cạnh giường | READ không có `states[].placement` hoặc support cửa ở các nhịp này. Bố cục chỉ bảo đảm các ràng buộc đã được khai báo. Schema `PLAN_READ` dùng để đọc gộp ở storyboard chỉ nói spatial là tùy chọn; nó chưa dùng chung hướng dẫn spatial đầy đủ như đường READ riêng. |
| 70,8 giây | Manh mối nén nhang cắm ngược chưa được thể hiện rõ; đĩa ở bàn xa giường | READ đã giữ đĩa gạo từ nhịp đầu với support chung `table`; thiếu trạng thái đảo chiều của nhang và quan hệ đầu giường. Hai tên đĩa thường/đĩa nhang ngược từng được map cùng asset. Catalog ID khớp và điểm đặt hợp lệ không đủ chứng minh trạng thái manh mối khớp câu kể. Không thể coi alias là biến thể hình đã có. |
| 108 giây | Vệt bùn xuất hiện dưới ghế, lệch cửa | READ dùng `water_puddle`, `mount:floor, support:floor`; thiếu anchor ngưỡng cửa. Layout đặt vào điểm sàn chung, nên qua gate hình học nhưng không đúng “ngang bậu gỗ”. Ngoài vị trí còn phải kiểm lại ngữ nghĩa vệt bùn so với vũng nước. |

Các lỗi trên không được sửa bằng thay tọa độ riêng cho video này. Phần tiếp theo cần đồng nhất hợp đồng READ gộp/READ riêng, chứng cứ cho ownership/transition, anchor của đạo cụ và trạng thái manh mối từ ngay kế hoạch; chỉ giữ liên tục các binding có chứng cứ. Cần kiểm các khả năng này với kho trước khi cho biên kịch chọn manh mối. Không được nhận một trạng thái chưa có trong kho là đã dựng đúng.

Giọng đã xuất đủ nhưng ASR vẫn có 13 câu cần nghe đối chiếu. Chưa có kết luận nghe trực tiếp về độ rõ chữ; không dùng chỉ số ASR hoặc loudness để khẳng định giọng đã đạt mẫu.
