# Kế hoạch Video Motion: 5 room dựng cảnh, phục hồi chat và Chrome dự phòng

Ngày: 05/11/2026. Trạng thái: đã triển khai và kiểm chứng cục bộ, đã mở Chrome thật kiểm tra Settings, 5 room và bàn giao sang profile dự phòng. Yêu cầu Gemini thật vẫn gặp lỗi dịch vụ/timeout; chưa đạt nghiệm thu sinh nội dung xuyên suốt. Chi tiết: [Báo cáo kiểm chứng](qa/motion-chrome-recovery-report-2026-11-05.md).

## 1. Kết quả khảo sát trước triển khai

- `motionVideo.ts` khai báo 3 worker dựng cảnh, 2 worker nội dung. `MotionAiRoomPool` giới hạn room vật lý dùng chung giữa các phiên Motion. Mục tiêu mới là 5 room dựng cảnh + 2 room nội dung, tối đa 7 room Motion, không tính browser render và tab ngoài ứng dụng.
- `remotion/scenePipeline.ts` có cảnh mẫu theo địa điểm, ảnh nhận diện nhân vật, continuity notes và checkpoint. Cảnh phụ thuộc phải tiếp tục chờ cảnh mẫu, dù còn slot trống.
- `motionStoryService.ts` có phục hồi trên room hiện tại, nhưng lỗi giao diện trước khi gửi có nhánh mở room mới ngay. `chatUiPlanningService.ts` còn vòng retry riêng; DeepSeek có cơ chế bấm retry riêng. Cần thống nhất ngân sách để không nhân số lần thử giữa các tầng.
- `imageGeneratorService.ts` quản lý Chrome dùng chung cho nhiều luồng. Chưa thấy bộ điều phối tự chuyển Chrome dự phòng trong các service khảo sát. Có thư mục `storage/gemini_backup_profile`, nhưng sự tồn tại của thư mục chưa xác nhận tài khoản đăng nhập hoặc hạn mức còn dùng được.
- `motionVerdictStory.ts` không chỉ gợi ý cán cân: PROFILE bắt buộc một đạo cụ ẩn dụ vật lý lặp lại; SAMPLE nhắc cán cân; CHECK bắt buộc visual verdict có đạo cụ và bảng tổng kết; PACKAGING yêu cầu thumbnail có đạo cụ. Đây là nguồn gây thiên lệch hình ảnh dù cuối PROFILE có câu chỉ dùng khi hữu ích.
- Đã đọc và kiểm cấu trúc toàn bộ 429 file trong `storage/output/motion-video/story-jobs/logs`: 36.171 dòng, 0 lỗi JSON, 0 lỗi sequence/kiểu dữ liệu. Đây là kiểm tra dữ liệu lưu, chưa xác nhận toàn bộ thứ tự và trạng thái hiển thị trên UI.
- Các log gần nhất có lỗi xác nhận ngữ cảnh, phản hồi chưa hoàn tất và thiếu chương. UI hiện suy luận một phần nhóm, mức lỗi và trạng thái từ chuỗi/regex; một số dòng phục hồi room nằm trong nhóm kỹ thuật. `motionFlowLogRows` sắp xếp từ giờ có độ chính xác đến giây, cần kiểm tra khi nhiều tác vụ chạy đồng thời.

## 2. Tăng lên 5 room dựng cảnh

1. Thêm hai worker dựng cảnh, cập nhật mở sẵn room, pool vật lý, bộ chia việc và các giới hạn/test đang giả định 3 room.
2. Giữ hai slot nội dung dùng chung; duy trì hàng đợi, quyền sở hữu room, đóng room cũ thành công trước khi thay room và giới hạn riêng thực sự cần thiết của từng provider.
3. Mỗi room mới nhận cùng phiên bản DNA, nhân vật, phong cách, tài nguyên và bối cảnh đã chốt. Khi đổi room hoặc Chrome, nạp lại ngữ cảnh và ảnh tham chiếu cần thiết trước yêu cầu tiếp theo.
4. Giữ thứ tự phụ thuộc cảnh mẫu theo địa điểm; chỉ chạy song song các cảnh đã đủ tham chiếu. Checkpoint theo scene/task ID, không theo thứ tự trả lời của room.
5. Giữ chính sách của Dùng kho: chỉ gọi AI khi luồng thực sự cần; số slot không tạo thêm công việc vẽ.

Nghiệm thu: có thể dùng đủ 5 slot dựng cảnh khi công việc độc lập; không vượt 5 room dựng cảnh và 2 room nội dung khi nhiều phiên, retry, CAPTCHA hoặc đổi provider; cảnh liên quan vẫn dùng đúng dữ liệu nhận diện và cảnh mẫu.

## 3. Thống nhất phục hồi room chat

Áp dụng ở lớp chat dùng chung cho các menu dự án, với adapter theo provider:

`Lỗi có thể phục hồi → bấm nút Thử lại của lượt lỗi nếu có → chờ kết quả → phục hồi tại room đó lần 1 → lần 2 → đóng room lỗi → mở room mới và phục hồi ngữ cảnh.`

- Bấm nút đúng lượt đang lỗi, kiểm tra trạng thái hiển thị và khả năng thao tác. Nút không tồn tại/không dùng được thì chuyển sang bước retry cùng room.
- Hai lần retry tại room hiện tại có thể gồm tải lại và khôi phục model, tệp, composer. Chỉ gửi lại khi đã xác nhận lượt trước kết thúc lỗi hoặc chưa gửi; nếu đang chờ phản hồi thì ưu tiên đọc kết quả cũ.
- Một bộ đếm cho một yêu cầu logic, tách rõ click retry, retry cùng room, thay room và sửa nội dung. Thay room tối đa một lần trong chu kỳ phục hồi, không đệ quy vô hạn.
- Room đã đóng/mất browser không thể bấm hoặc tải lại: ghi đúng tình trạng và chuyển bước có thể thực hiện, không ghi giả đã thử hai lần.
- Hết hạn mức Flash chuyển sang quy trình mục 4; CAPTCHA/đăng nhập chuyển trạng thái cần xử lý; hủy tác vụ kết thúc chờ và thu hồi tài nguyên. Phản hồi từ chối và dữ liệu sai hợp đồng giữ cách xử lý phù hợp với loại lỗi.
- Sau khi hết ngân sách phục hồi, trả nguyên nhân gốc cùng bước phục hồi cuối; áp dụng cấu hình AI dự phòng hiện có tại đúng điểm, tránh đổi AI trước khi quy trình đã chọn hoàn tất.

## 4. Chrome dự phòng và bàn giao an toàn

Quy ước đề xuất: Chrome dự phòng là một phiên Chrome dùng profile và tài khoản riêng đã chuẩn bị, vẫn chạy model Flash đã chọn.

1. Xác nhận thông báo hết hạn mức của model Flash được cấu hình cho yêu cầu; kiểm tra cả menu chọn model và lỗi trả về trong chat. Ảnh người dùng cung cấp ngày 05/11/2026 (`C:/Users/Admin/Desktop/download.png`) cho thấy Flash bị làm mờ kèm dòng “Hạn mức sẽ được đặt lại vào…”, còn Flash-Lite đang được chọn. Nhận diện dòng đặt lại hạn mức trong đúng mục Flash, kết hợp trạng thái disabled/aria-disabled nếu DOM có; không dựa riêng vào màu chữ, tên phiên bản hoặc model hiện trên nút composer. Nếu nhãn Flash đã tự chuyển thành Flash-Lite, vẫn kiểm tra hạn mức của Flash được yêu cầu và thực hiện bàn giao, không coi Flash-Lite là đã chọn đúng model. Mục bị vô hiệu nhưng không có bằng chứng hạn mức phải được phân biệt với lỗi model không khả dụng, timeout, lỗi mạng, CAPTCHA và thông báo cũ trong lịch sử chat.
2. Khi bật tự chuyển, chỉ một tiến trình điều phối được quyền bàn giao. Dừng cấp yêu cầu mới vào Chrome cũ ở tất cả menu dùng browser đó; tác vụ chưa gửi tiếp tục ở hàng đợi.
3. Các request đã gửi tiếp tục nhận kết quả và ghi bền vững phản hồi thô vào `storage/chat-results` trước khi nhả tác vụ Chrome. Request báo hết hạn mức được ghi nhận là đã kết thúc lỗi, không tự chờ chính nó.
4. Chờ hết tác vụ Chrome và thao tác ghi phản hồi thô; sau đó mới đóng browser. Kiểm tra hợp đồng dữ liệu, ghi artifact/checkpoint nghiệp vụ tiếp tục ở backend độc lập với browser. Chặn bàn giao nếu còn yêu cầu đã gửi nhưng chưa xác định được kết quả, lỗi ghi phản hồi hoặc hết thời gian chờ. Journal phản hồi thô chưa có cơ chế tự phát lại sau restart; không coi journal là checkpoint nghiệp vụ đã xác thực.
5. Đóng các room do ứng dụng quản lý và xác nhận Chrome cũ đã đóng. Nếu còn tác vụ chưa xác định kết quả, lỗi lưu hoặc lỗi đóng browser, giữ checkpoint và báo đúng bước đang chờ; không báo đã chuyển thành công.
6. Mở profile dự phòng, xác nhận phiên đăng nhập và model, tạo lại room trong ngân sách, nạp ngữ cảnh đã chốt rồi tiếp tục phần chưa hoàn tất.
7. Kết quả trả muộn từ phiên cũ không được ghi đè kết quả mới. Dùng định danh yêu cầu và phiên browser để chống nhận nhầm/gửi trùng.
8. Nếu profile dự phòng thiếu, chưa đăng nhập hoặc cũng hết hạn mức: lưu tiến độ và báo rõ; không chuyển qua lại vô hạn. Tab ngoài quyền quản lý của tool phải được tính đến trong điều kiện đóng Chrome an toàn.

## 5. Toggle trong Settings, dùng chung mọi menu dự án

- Nhãn: **Tự chuyển Chrome dự phòng khi Flash hết hạn mức**.
- Giao diện button toggle giống Video Motion, dùng thành phần chung để không tạo phụ thuộc Settings vào feature Motion; có `role=switch`, `aria-checked`, trạng thái bật/tắt và mô tả ngắn.
- Cấu hình dùng chung được lưu bền vững và backend đọc trực tiếp; mọi menu dùng cùng chính sách, kể cả chạy nền/khôi phục dự án.
- Đề xuất mặc định tắt khi nâng cấp để người dùng chuẩn bị profile trước; tắt thì tiếp tục theo chính sách hạn mức/dự phòng hiện tại.
- Bổ sung thao tác chuẩn bị/kiểm tra Chrome dự phòng và trạng thái sẵn sàng. Không coi bật toggle là đã đăng nhập thành công.
- Quy định rõ hiệu lực thay đổi: đọc giá trị mới khi quyết định chuyển; nếu bàn giao đã bắt đầu thì hoàn tất đến trạng thái an toàn, không dừng giữa bước đóng/mở Chrome.

## 6. Gỡ ép hình ảnh cán cân ở thể loại phán quyết

- Giữ cấu trúc: câu hỏi lớn, tiêu chí đánh giá, các giả thuyết dựa trên nguồn, bằng chứng và kết luận có lý do.
- Bỏ bắt buộc đạo cụ vật lý lặp lại trong PROFILE, PLAN, CHECK, STAGES và MOTIFS; sửa ví dụ SAMPLE để không kéo nội dung về cán cân.
- PACKAGING không bắt thumbnail có cân, dấu đóng hoặc bảng điểm. Dựng cảnh theo sự kiện và nhân vật thực tế; ẩn dụ hình ảnh chỉ dùng khi phù hợp hoặc người dùng yêu cầu.
- Kiểm tra prompt phân cảnh, đọc cảnh, dựng cảnh, QA và thumbnail để quy tắc cũ không được chèn lại. Giữ nguyên thiết lập phong cách hình ảnh và các thể loại khác.
- Dự án mới dùng prompt mới; nội dung đã chốt của dự án cũ được giữ. Chạy lại phần nào thì phần đó dùng quy tắc mới và xử lý cache/checkpoint liên quan có chủ đích.

## 7. Audit log từ backend tới giao diện

- Kiểm tra các nguồn log: DNA, kịch bản, SEO/thumbnail, phân cảnh/dựng cảnh, giọng, render; bao gồm job con chạy nền và các lần tiếp tục.
- Log mới lưu thời gian mili giây, sequence, severity và metadata hoạt động sẵn có: worker/provider/model/artifact/phase. Job được xác định qua lịch sử và endpoint của nó. Mã lỗi, bước và số lần phục hồi giữ trong thông điệp gốc; chưa có trường scene/request/browser generation riêng trong mọi event. Giữ đọc được log chuỗi cũ.
- Trong mỗi job ưu tiên sequence; khi gộp nhiều job dùng thời gian sự kiện và thứ tự ổn định. Giữ thứ tự các mục giao diện theo quy trình, thứ tự dòng bên trong theo diễn biến thực tế; kiểm tra qua nửa đêm, cùng giây và phản hồi polling tới muộn.
- Hiển thị nguyên nhân cụ thể và hành động kế tiếp. Lỗi đang phục hồi phải thể hiện đang thử lại, lỗi cuối mới đưa bước sang thất bại. Lỗi cũ không ghi đè lần chạy mới; hoàn tất job con không làm cả pipeline thành hoàn tất.
- Phân biệt không gửi được, chưa rõ đã gửi, lỗi xác nhận ngữ cảnh, timeout, sai dữ liệu, hết hạn mức, CAPTCHA, lỗi lưu và lỗi browser. Không gộp các lỗi khác nhau thành một thông báo chung làm mất nguyên nhân.
- Log phổ thông hiển thị room/cảnh và retry đang diễn ra; chi tiết kỹ thuật giữ lỗi gốc, không đưa cookie, token hoặc thông tin đăng nhập ra giao diện.
- Kiểm tra phân trang/cursor, gộp lịch sử, reload, tiếp tục, chống trùng/thiếu dòng và đồng bộ `stepStates` với trạng thái thật.

## 8. Thứ tự triển khai và kiểm chứng

1. Chốt hợp đồng lỗi, bộ đếm retry, định danh request/browser và sự kiện log.
2. Làm cấu hình chung, chuẩn bị profile và bộ điều phối bàn giao; tích hợp các luồng dùng Chrome chung.
3. Tích hợp quy trình nút Thử lại → hai lần cùng room → room mới; xử lý yêu cầu chưa rõ đã gửi.
4. Tăng pool dựng cảnh lên 5; kiểm đồng nhất, checkpoint và phụ thuộc cảnh mẫu.
5. Sửa prompt thể loại phán quyết xuyên suốt các tầng.
6. Hoàn thiện hiển thị log và chạy kiểm chứng tích hợp.

Các gate bắt buộc:

- Pool 5+2 khi nhiều phiên, thay provider, retry, hủy, CAPTCHA và đóng tab thất bại; không rò room.
- Retry đúng thứ tự, đúng số lần; nút thiếu/vô hiệu, phản hồi muộn và yêu cầu chưa rõ đã gửi không tạo kết quả trùng.
- Nhiều room đồng thời báo hết hạn mức chỉ chuyển Chrome một lần; chờ lưu xong rồi đóng; room mất phản hồi không gây treo vô hạn hoặc bị coi là đã lưu.
- Fixture menu model theo ảnh người dùng: Flash bị vô hiệu kèm dòng đặt lại hạn mức, Flash-Lite được chọn; phát hiện đúng hạn mức của model yêu cầu trước khi gửi prompt. Kiểm tra biến thể nhãn/thời gian bị rút gọn, không có thuộc tính disabled chuẩn, mục Pro cũng hết hạn mức trong khi Flash vẫn dùng được, và mục Flash bị vô hiệu vì nguyên nhân khác. Không kích hoạt chuyển Chrome chỉ vì một model khác hết hạn mức.
- Profile thiếu/khóa/chưa đăng nhập, Chrome đóng lỗi, backup cũng hết hạn mức, thay toggle và hủy trong lúc chờ bàn giao.
- Hồi quy các menu dùng browser chung, cấu hình AI chính/dự phòng, ảnh tham chiếu, voice, SEO, lưu/tiếp tục và render.
- Prompt phán quyết giữ lập luận nhưng không bắt cân/đạo cụ; các kiểu hình và thể loại khác không đổi ngoài phạm vi yêu cầu.
- Replay log hiện có cùng fixture mới: lỗi phục hồi thành công, lỗi cuối, job con song song, qua nửa đêm, cùng giây, reload và polling đảo thứ tự.
- TypeScript, lint/boundary theo quy định repository; dùng mock/local HTML trước, sau đó kiểm thử tích hợp Chrome với profile đã chuẩn bị để xác nhận thao tác UI thật.

Đã gọi Gemini thật, kiểm thử Chrome hiển thị và cập nhật mã chức năng. Tín hiệu quota trong phép thử bàn giao được tiêm tại ranh giới điều phối vì hai tài khoản đang còn hạn mức; thao tác đóng Chrome cũ/mở Chrome dự phòng là thật. Toggle hiện được trả về tắt sau kiểm thử; profile dự phòng đã được xác nhận đăng nhập. Không công bố toàn bộ gate repository hay Gemini xuyên suốt đạt 100%; xem báo cáo để phân biệt kết quả đạt, giới hạn kiểm thử và lỗi test có sẵn.
