# Rà soát yêu cầu bốn thể loại sau thay đổi mở rộng thời lượng

> Cập nhật 01/11/2026: sau báo cáo này, người dùng yêu cầu hoàn tác đợt mở rộng thời lượng và chỉnh POV đi kèm. Các nhận xét bên dưới mô tả bản được audit trước khi hoàn tác. Xem `docs/motion-writing-duration-rollback-2026-11-01.md` để biết phạm vi hoàn tác.

Ngày: 01/11/2026. Phạm vi: đọc code hiện tại, so sánh profile với Git HEAD, kiểm tra cách ghép chỉ dẫn phân tích/viết/biên tập và chạy các phép kiểm tra offline về chỗ bộ kiểm tra bỏ sót. Không sửa code sản phẩm; không gọi AI, tạo giọng hoặc xuất video trong lượt rà soát này.

## Kết luận

Không có bằng chứng cả bốn thể loại đã bị chuyển sang cùng một phong cách. Router vẫn chọn đúng profile theo `videoGenre`, và API yêu cầu phân tích lại nếu thể loại được gửi lên khác thể loại trong kết quả phân tích. Tuy nhiên không thể khẳng định bản sắc từng thể loại đã được giữ đầy đủ:

1. Profile POV đã bị viết lại đáng kể trong đợt mở rộng thời lượng, vượt phạm vi chỉ thay cách phát triển nguồn.
2. Quy tắc dùng chung có điểm xung đột với quy tắc riêng; mô hình kế hoạch chưa thực sự tách theo thể loại.
3. Kiểm tra sau viết còn thiếu khả năng xác nhận đúng cấu trúc, ngôi kể và cách kết của từng thể loại.

Git HEAD là mốc so sánh trong kho hiện tại, không phải một bộ yêu cầu đã được người dùng duyệt hay một bản chắc chắn không có lỗi. Kết luận về việc profile riêng có thay đổi chỉ áp dụng trong phạm vi so sánh này.

## 1. Yêu cầu riêng hiện có và mức ảnh hưởng

| Thể loại | Bản sắc trong profile | Tình trạng |
| --- | --- | --- |
| POV – Nhập vai | Người xem là nhân vật, ngôi thứ hai, hiện tại, trải nghiệm trực tiếp, cảm xúc qua cơ thể và hành động, tiến trình trải nghiệm liên tục. | Core ngôi kể còn, nhưng profile đã đổi lớn: bỏ cấu trúc đời thường/gắn bó/kỷ vật/đồng đội/mất mát/trở về/hồi tưởng bắt buộc và thay ví dụ phong cách. Có nguy cơ làm bài thành kể sự kiện thêm chữ “bạn”. |
| Người trong cuộc kể lại – Kỳ truyện | Một người xưng tôi nhớ lại, câu ngắn, tiếng Việt nói mộc mạc vùng Bắc, gọi người bằng quan hệ/tên, kể điều thấy/nghe trước giải thích; với truyện sáng tác có quy tắc đổi tên và giữ chuỗi nhân quả. | File profile không đổi so với HEAD. Nhận thêm hướng phát triển chung/riêng; còn rủi ro chung ép motif/quy tắc truyện vào nguồn không có chúng và QA chấp nhận giọng không đúng. Chưa chạy lại AI thật cho thể loại này trong lượt test hai bài trước. |
| Toàn bộ lịch sử trong N phút – Biên niên | Mở bằng cao trào về sau, quay về đầu, kể theo thời kỳ có tên, mốc nguồn, nhịp tài liệu, cầu nối nhân quả; cuối trở lại cảnh mở rồi đến kết quả cuối được nguồn hỗ trợ. | File profile không đổi so với HEAD. Phần mở rộng vẫn dùng hướng biên niên riêng; có xung đột cũ về legacy ở cuối và nguy cơ tên/tiêu đề hứa đúng N phút trong khi độ dài hiện chấp nhận tự nhiên. Chưa chạy lại AI thật trong lượt test hai bài trước. |
| Câu hỏi lớn – Phán quyết | Một câu hỏi trung tâm, ít nhất hai ứng viên có căn cứ, cùng tiêu chí, thiết bị ẩn dụ, mỗi ứng viên một nhãn, phần kết cân lại đúng các nhãn và lý do. | File profile không đổi so với HEAD. Khung vẫn có ở test thật, nhưng bước kiểm tra chưa bắt nhãn ở phần tổng kết bị đổi, ngày sai, diễn giải tuyệt đối. |

## 2. Các chỗ lệch hoặc xung đột xác nhận được

### A. POV bị sửa sâu trong đợt thay đổi thời lượng

`src/constants/motionPovStory.ts`: thay toàn bộ PROFILE, PLAN, SAMPLE, CHECK, TIMELINE và nhiều STAGES. Trước đó profile yêu cầu chủ động xây dựng một nhân vật tổng hợp với đời sống, người thân, đồng đội và motif; bản mới hạn chế nhiều thành phần này khi nguồn không cung cấp.

Việc không tự bịa sự kiện lịch sử là hợp lý, nhưng việc thay cả cách dẫn dắt cảm xúc và cấu trúc phong cách là thay đổi riêng của thể loại. Không thể gọi toàn bộ thay đổi này là chỉ tăng độ sâu/thời lượng. Cần phân biệt:

- Dữ kiện thật, hành động của người thật và kết quả sự kiện phải đúng nguồn.
- Khung trải nghiệm của nhân vật tổng hợp được phép sáng tạo đến đâu là chính sách riêng cần thống nhất, không để một luật chung vô tình quyết định.

Test thật POV có 502 từ và phần lớn một câu tóm tắt mỗi cảnh. Điều này xác nhận đầu ra chưa đạt chiều sâu mong muốn, nhưng chưa chứng minh riêng một câu luật nào gây ra toàn bộ kết quả ngắn.

### B. Motif POV tùy chọn trong profile nhưng vẫn bị ép ở phần kết

`motionPovStory.ts` cho phép không có motif và không bắt nó xuất hiện ở mọi chương/câu. Tuy nhiên:

- `src/constants/motionGenreStage.ts` có `FINAL_GENRES` gồm POV và câu lỗi yêu cầu câu cuối phải quay lại đúng chữ của motif.
- `src/lib/motionGenreStage.ts` phát hiện thiếu motif ở đoạn cuối nếu analysis đã có motif.
- `src/lib/motionWriting.ts` và `motionStoryService.ts` giữ nguyên các motif khi biên tập cho thể loại không phải verdict.

Phép thử offline với motif “Lock shields” và câu cuối kết thúc bình thường vẫn bị đánh dấu buộc nhắc motif. Test thật cũng kết thúc bằng đoạn ghép “remembering the order to Lock shields”. Đây là xung đột giữa cho phép motif linh hoạt với việc ép motif ở cuối. Nó không phát sinh khi analysis không có motif.

### C. Kế hoạch dùng chung vẫn đưa mẫu của thể loại phán quyết vào các thể loại khác

`src/constants/motionWriting.ts`, `PLAN` yêu cầu mọi analysis trả về `writingPlan:{question,criterion,device,labels:[]}`, rồi mới dặn trường ứng viên/phán quyết chỉ dành riêng verdict. `normalizeMotionWritingPlan` không nhận genre, nên không loại các trường đó khỏi POV/witness/chronicle.

Bản phân tích POV thật vừa chạy đã có question, criterion, device và ba labels kiểu phân tích chiến thuật. Đây là dữ liệu kế hoạch bị lẫn hình thức; chưa đủ kết luận toàn bài POV biến thành verdict, nhưng nó tạo thêm hướng dẫn không thuộc bản sắc POV và được truyền lại vào bước viết.

### D. Kiểm tra ngôi kể chưa bảo đảm đúng trải nghiệm thể loại

`src/lib/motionGenreStyle.ts` và `src/constants/motionGenreStyle.ts`:

- POV kiểm dấu từ “bạn/you” trong cả beat, không kiểm ý nghĩa từng câu. Phép thử có “You brace your shield” rồi kể kiến thức bí mật của đối phương không bị bộ kiểm tra ngôi kể đánh dấu.
- Bản tiếng Anh witness nhận cả “we/us/our” như dấu ngôi một. Một câu giọng phân tích tập thể “We examine the rival hypotheses and deliver our verdict...” không bị bộ kiểm tra ngôi kể đánh dấu. Điều này không chứng minh giọng hồi tưởng một người đã đúng.
- Witness tiếng Việt yêu cầu phần lớn câu 5–14 âm tiết, nhưng ngưỡng tự động đánh dấu câu dài hiện là hơn 22 đơn vị. Đây là khoảng trống kiểm tra, không phải bằng chứng mọi câu dài 15–22 đều sai.

Các phép thử trên chỉ đo bộ kiểm tra ngôi kể, không khẳng định toàn bộ QA sẽ chấp nhận mọi bài có các câu đó.

### E. Câu hỏi lớn chưa kiểm tra nhãn ứng viên ở phần kết

`src/lib/motionGenreReview.ts` kiểm nhãn ở chương có stage `candidate`, chưa kiểm câu recap trong stage `verdict` so với nhãn đã duyệt.

- Test thật: testudo là `close` ở chương 2, thành `not yet` ở chương 4; QA=0.
- Phép thử offline với nhãn tổng kết sai cũng không sinh finding thuộc loại `label`. Dữ liệu giả lập còn sinh finding nối chương không liên quan; không dùng kết quả này để tuyên bố toàn bộ QA sạch.

### F. Profile của witness có điều kiện nguồn nhưng motif chung vẫn yêu cầu ít nhất một

Witness quy định bỏ losses/rule-giver/remedy/coda không có trong nguồn. Tuy nhiên helper `STAGE.MOTIF.PLAN` chỉ được bật cờ tùy chọn cho POV; witness vẫn nhận “array of 1 to 6” với mô tả motif thiên về luật của người biết chuyện và chi tiết coda.

Với nguồn đời thực không có luật/coda tương ứng, đây là nguy cơ ép mẫu truyện vào nguồn. Chưa có lượt AI thật mới để kết luận đã xảy ra cho witness. Cơ chế cũ này đã có từ trước phần tăng thời lượng, không phải toàn bộ do thay đổi mới tạo ra.

### G. Biên niên còn hai yêu cầu kết thúc chưa đồng bộ

- PROFILE/PLAN chỉ cho legacy hiện tại hoặc câu chuyện kế tiếp khi nguồn hỗ trợ.
- TIMELINE có câu kết kèm “one closing legacy line” không nêu điều kiện tại chỗ.
- PACKAGING vẫn hứa “Entire history ... in N minutes”, trong khi quy tắc thời lượng mới chấp nhận độ dài cuối tự nhiên.

Đây là chỗ cần làm rõ, không phải lý do tự bỏ cold open, các thời kỳ hay cách kết của biên niên. File profile này không bị sửa trong diff hiện tại.

### H. Biên tập rút gọn chỉ dẫn thể loại và có thứ tự ưu tiên còn mâu thuẫn

Với các câu được chọn sửa, `motionStoryService.ts` dùng `motionVideoGenreEditorProfile`: chỉ TIMELINE và CHECK, cộng narrativeVoice tóm tắt và phần phát triển chung; không đưa toàn bộ PROFILE/SAMPLE. Điều này giúp giảm prompt nhưng không phải bằng chứng mọi đặc trưng giọng/mở/kết đều được bảo vệ.

Ngoài ra `motionStoryTimeline.ts` có `EDITOR.SCOPE` nói established story thắng outline, trong khi `motionWriting.ts` yêu cầu nguồn thắng chi tiết sai trong bản nháp. Cần phân biệt rõ giữ liên tục cho tình tiết hợp lệ với giữ nhầm một chi tiết bịa. Đây là xung đột chỉ dẫn tồn tại trong luồng hiện tại, không có nghĩa editor luôn chọn sai.

## 3. Những phần đã xác nhận vẫn tách riêng

- `motionGenre.ts` ánh xạ bốn genre tới bốn file profile riêng.
- Chỉ dẫn phân tích lấy `motionVideoGenreDirective(opts.videoGenre)`.
- Lượt viết lấy `motionVideoGenreStyleGuide(analysis.videoGenre)` và stage của thể loại đó.
- Hướng phát triển riêng chỉ lấy đúng key POV/witness/chronicle/verdict; không ghép cả bốn hướng vào cùng lượt.
- API viết kiểm tra thể loại body so với analysis; đổi thể loại phải phân tích lại.
- Ba profile witness/chronicle/verdict có nội dung không đổi so với Git HEAD; không đồng nghĩa hành vi không chịu ảnh hưởng từ luật dùng chung.

## 4. Ranh giới cần giữ khi xử lý tiếp

1. Khóa hợp đồng từng thể loại: ngôi kể, thời điểm kể, cách mở, phát triển, kết, motif/ẩn dụ và mức sáng tạo cho phép.
2. Luật mở rộng thời lượng chỉ bổ sung chiều sâu theo hợp đồng đó, không tự thay profile.
3. Tách dữ liệu kế hoạch theo genre; các trường cán cân, tiêu chí, nhãn chỉ tạo ở nơi thật sự cần.
4. Đồng bộ kiểm tra với hợp đồng: không ép motif tùy chọn, không coi chỉ có chữ “bạn/tôi” là đạt, đối chiếu nhãn recap đúng với ứng viên.
5. Giữ nguyên các điểm tốt đã có của witness, chronicle, verdict; không viết lại cả bốn profile để chữa một lỗi POV.
6. Test witness và chronicle riêng trước khi kết luận chất lượng thực tế của cả bốn thể loại. Test nguồn truyện và nguồn sự kiện cần tách vì cách cho phép sáng tạo khác nhau.

Đây là hướng đề xuất sau audit, chưa được triển khai trong lượt kiểm tra này.

## Bằng chứng

- Script kiểm tra offline: `scratch/genre-contract-audit-20261101/check.ts`.
- Kết quả và so sánh profile: `scratch/genre-contract-audit-20261101/results.json`.
- Các chuỗi chỉ dẫn hiện tại theo từng thể loại/giai đoạn: `scratch/genre-contract-audit-20261101/*-profiles.json`. Đây là các phần chỉ dẫn thể loại được helper ghép, không phải toàn bộ prompt production.
- Hai bài test AI thật trước đó: `scratch/writing-pov-verdict-5min-20261101/index.html`, các file analysis/script/audit/manual-review kèm theo.
