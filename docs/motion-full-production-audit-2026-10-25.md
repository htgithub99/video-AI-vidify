# Rà soát toàn bộ luồng Video Motion — 25/10/2026

## Kết luận

Chưa đủ cơ sở xác nhận tool hiện đáp ứng yêu cầu bấm Tạo video rồi tự hoàn thành một video đúng nội dung, hình và tiếng. Đã có nhiều lớp bảo vệ tốt, nhưng còn lỗ hổng ở danh tính tác vụ, điều phối toàn lượt, phục hồi AI, kiểm chất lượng và xác nhận đầu ra. Không thể giải quyết chỉ bằng tăng retry hoặc thêm tài nguyên.

Lần rà soát này đọc code hiện tại, đối chiếu log thật của lượt 20 phút, tái hiện lỗi nhận nhầm job trong tiến trình và thư mục dữ liệu riêng, chạy hai kiểm thử cục bộ. Không sửa code sản phẩm, không khởi động lại backend, không hủy tác vụ giọng đang chạy và không gửi thêm yêu cầu AI.

## Luồng hiện tại

1. Giao diện lấy nguồn truyện, thời lượng, gói, giọng và cấu hình AI. Khi bắt đầu, tạo phiên biên tập và lần lượt gọi API cho từng bước.
2. Đọc nguồn và Phân tích Video DNA: phân tích cốt truyện, nhân vật, địa điểm, cấu trúc chương. Đã đưa khả năng minh họa của gói vào chỉ dẫn AI.
3. Kịch bản & Phân cảnh: viết theo chương, có bản lưu từng phần và phục hồi chương thiếu. Bản kiểm bắt buộc hiện chủ yếu bảo đảm mỗi chương có ít nhất một beat có lời kể.
4. SEO YouTube: chạy nối tiếp sau viết truyện, dùng phiên biên tập chung. Tuy giao diện hiển thị cảnh báo khi SEO lỗi trong chế độ tự động, lớp chạy job vẫn tạm dừng chuỗi tự động.
5. Dựng cảnh: khóa kho theo gói → chuẩn hóa hồ sơ tiếng Anh → tách dòng/sự việc → lập nhịp hình → đọc ý nghĩa → lấy lựa chọn hữu hạn trong kho → ghép bố cục → kiểm hình học → dựng bảng ảnh → review AI nếu bật. Nhánh sản xuất đang gọi pipeline puppet 2D; trong pipeline có ép drawingMode về 2D. Sự tồn tại của renderer 3D không chứng minh toàn luồng 3D tương đương đã được nghiệm thu.
6. Tạo giọng: chọn giọng, tổng hợp từng câu, điều chỉnh nhịp, xử lý âm, kiểm tín hiệu/ASR và lưu cache từng clip. Trong pipeline dựng cảnh hiện tại, prepareAudio được khởi động gần cuối sau bảng ảnh/review đầu. Script thử 20 phút chạy giọng riêng song song; không nên lấy hành vi script thử làm mô tả cho toàn bộ UI.
7. Compile: lấy thời lượng giọng, dựng timeline, cảnh, phụ đề, chuyển cảnh và âm thanh. Có kiểm chữ ký giọng và dữ liệu cảnh. Một số mốc từ vẫn được ước lượng khi thiếu timestamp đáng tin cậy.
8. Xuất MP4: đợi bàn giao Chrome → thăm dò encoder/renderer → render từng phần, tái sử dụng cache → nối video → trộn tiếng → ghi nhận kết quả. Kiểm đen/im lặng/loudness hiện trả log, chưa phải điều kiện nghiệm thu bắt buộc.

Các bước nối tiếp được điều phối chủ yếu bởi useMotionStudio trên trình duyệt, chưa có một tác vụ sản xuất bền vững ở backend sở hữu toàn bộ chuỗi từ nguồn đến MP4.

## Những phần đã có và cần giữ

- Phiên biên tập chung cho DNA, kịch bản, SEO; nhóm dựng cảnh có các worker/phòng riêng.
- Lưu chương, nhóm storyboard, kết quả từng phần và log tác vụ. Có cơ chế giữ trạng thái dừng qua reload.
- Kho đóng theo gói, ảnh chụp dữ liệu kho dùng trong lượt chạy, kiểm tài nguyên được phép; không vẽ thêm tài nguyên trong nhánh kho đóng.
- Chọn từ ID/các phương án được code tạo và kiểm, thay vì chấp nhận tọa độ tùy ý của AI. Đã kiểm chủ sở hữu đồ vật, tư thế/chỗ tựa và quan hệ không gian.
- Tắt review AI vẫn giữ các kiểm tra cục bộ. Không cần buộc bật review AI để sửa các lỗi điều phối.
- Cache giọng theo nội dung/cấu hình và cache phần render; kiểm giọng cũ; bàn giao Chrome trước render; có phương án encoder CPU.

## Các mục cần sửa, theo mức ưu tiên

### P0.1 — Danh tính tác vụ chưa phân biệt đầy đủ dự án và đầu vào

**Đã tái hiện.** startStoryJob tìm job đang chạy bằng kind + editorialSessionId + editorialRevision. Với SCENES và VOICE không truyền phiên editorial, hai trường sau đều undefined, nên hai yêu cầu khác nhau có thể nhận cùng một job.

Thử riêng cho cả SCENES và VOICE đều thu được firstJobId bằng secondJobId. Không gọi AI hoặc dùng dữ liệu production. Bằng chứng: scratch/thantrung-voice-20261025/audit-job-identity.json; chương trình tái hiện ở audit-job-identity.ts cùng thư mục.

**Sửa:** mọi bước phải có productionId/projectId, phiên bản đầu vào và khóa yêu cầu. Chỉ tái sử dụng khi cùng lượt, cùng bước và cùng chữ ký đầu vào. Kết quả trả về chỉ được ghi vào đúng phiên bản dự án đó. Giới hạn tài nguyên dùng hàng đợi, không dùng cách trả job của một yêu cầu khác.

**Nghiệm thu:** hai dự án khác nhau không nhận chung job; cùng một yêu cầu gửi lại không chạy trùng; kết quả cũ không ghi đè dự án mới. Bằng chứng code: src/server/services/motionStoryJobService.ts:21–24.

### P0.2 — Chưa có bộ điều phối toàn lượt ở backend

**Đã xác nhận từ code.** Trình duyệt nối phân tích → kịch bản → SEO → dựng → render. Có phục hồi từng job nhưng chưa có bản ghi toàn bộ lượt, cấu hình cố định và phụ thuộc từng bước. Backend khởi động lại chuyển checkpoint đang chạy thành lỗi gián đoạn; render đang chạy giữ trong Map, chỉ kết quả hoàn thành mới được đọc lại từ danh sách lưu.

**Sửa:** thêm bộ điều phối tối thiểu ở backend, ghi bền trạng thái từng bước, đầu vào, phiên bản, kết quả đã chấp nhận, yêu cầu dừng và lỗi gốc. UI theo dõi trạng thái; đóng/reload UI không sở hữu việc chuyển bước. Khi phục hồi, chỉ chạy phần thiếu của lượt còn được phép chạy. Dừng/hủy phải có hiệu lực qua cả reload và restart. Chụp cấu hình đầu lượt; thay cấu hình cần tạo phiên bản mới hoặc sửa rõ bước bị ảnh hưởng.

**Nghiệm thu:** đóng tab, mất mạng, restart backend ở từng bước rồi nối tiếp được dữ liệu hợp lệ; dự án đã dừng không tự chạy lại; không trộn cấu hình giữa các bước. Rủi ro trộn cấu hình được nhận diện từ việc đọc stateRef ở từng bước, chưa tái hiện như một sự cố riêng.

**Code:** src/features/motion/hooks/useMotionStudio.ts:362,415,558,663,867; src/server/services/motionStoryCheckpointService.ts:22; src/server/services/motionRenderService.ts:177,602.

### P0.3 — Yêu cầu AI nặng, retry chồng tầng và mất nguyên nhân thật

**Đã xác nhận ở lượt 20 phút.** Một nhóm nguồn chỉ có một câu tạo prompt 54.918 ký tự, trong đó danh mục kho chiếm 49.408 ký tự (~90%). Nếu gửi thành công qua cơ chế chia hiện tại cần bốn tin ngữ cảnh và một tin thực hiện. Log có 26 lần GeminiChatRequestRejected:8:1095, nhưng cuối cùng người dùng thấy lỗi kế hoạch không phủ lời kể. Chưa nhận được kế hoạch hợp lệ ở các yêu cầu đó để kết luận nó sai mốc.

**Sửa:** truy vấn danh mục liên quan tại máy, nạp ngữ cảnh có phiên bản một lần mỗi room, gửi phần thay đổi ngắn cho từng nhóm. Kiểm ID và ràng buộc vẫn đối chiếu toàn kho tại máy. Chỉ một tầng quản lý phục hồi dịch vụ, theo đúng chính sách reload room hai lần rồi mới thay. Tầng sửa JSON chỉ chạy khi thực sự nhận JSON sai. Các phòng làm độc lập khi bình thường; khi cùng bị chặn thì dùng thời gian chờ chung theo nhà cung cấp. Khóa Gemini phải được giữ; chỉ chuyển provider khi cấu hình cho phép.

**Nghiệm thu:** lỗi nhà cung cấp giữ nguyên nguyên nhân/giai đoạn, không biến thành lỗi vị trí; không gửi lặp theo nhiều tầng; phần đã chấp nhận không bị viết lại. CAPTCHA chuyển sang chờ xác minh, giữ tiến độ và báo người dùng. Không tự vượt xác minh.

Không có bằng chứng giải nghĩa mã 1095. Lượt đối chứng ngắn bị Google chuyển sang /sorry trước khi gửi, xác nhận tình trạng chặn truy cập ở thời điểm kiểm, chưa chứng minh mọi 1095 đều là CAPTCHA. Chi tiết: docs/motion-20m-root-cause-2026-10-25.md.

### P0.4 — Cần kiểm khả năng dựng các tình tiết thiết yếu trước khi chốt truyện

**Đã có chỉ dẫn khả năng kho trong prompt; chưa đủ để bảo đảm đầu ra của AI luôn dựng được.** Kho nhiều tài nguyên không đồng nghĩa có mọi tổ hợp đồ vật, tư thế, chỗ tựa và quan hệ mà một truyện có thể cần. Lỗi dựng muộn không nên chỉ dẫn đến yêu cầu vẽ thêm.

**Sửa:** trước khi khóa kịch bản, lập danh sách nhân vật, địa điểm, vật làm manh mối, trạng thái và quan hệ bắt buộc; gắn chúng với lựa chọn có thật trong đúng gói và kiểm bằng code. Với truyện sáng tác mới, điều chỉnh chi tiết trước khi viết dài nếu kho không hỗ trợ. Với nội dung cần giữ đúng, chọn cách minh họa giản lược trung thực. Hành động khó, không thiết yếu có thể bỏ khỏi hình; không tự đổi vật làm manh mối hoặc đổi người thực hiện.

**Nghiệm thu:** truyện được chốt có phương án minh họa bằng kho cho mọi tình tiết thiết yếu. Không thêm tài nguyên lúc chạy. Người A đứng, người B nằm phải dùng đúng hai tư thế và đúng chỗ tựa; thiếu phương án phải xử lý trước bước tạo hàng trăm câu giọng.

**Code:** src/server/services/motionStoryService.ts:1193,1295,1580; src/server/services/puppet/packSceneChoices.ts; packSelectionContract.ts; packPlacement.ts.

### P0.5 — Điều kiện hoàn thành MP4 chưa bắt buộc đủ hình và tiếng hợp lệ

**Đã xác nhận nhánh code; chưa tái hiện xuất video im lặng trong lượt 20 phút.** Renderer có thể xuất bản silent khi không tìm thấy mixedPath; giao diện có kiểm giọng trước đó nhưng backend render chưa gắn điều kiện bắt buộc tương đương cho dự án có lời kể. checkOutput nuốt lỗi kiểm rồi trả danh sách log. Cache phần render chỉ kiểm tồn tại và size > 0 trước khi tái sử dụng.

**Sửa:** lưu yêu cầu đầu ra của lượt, phân biệt video có lời kể và video cố ý không có tiếng. Với video kể chuyện, bắt buộc track giọng đúng chữ ký, tồn tại, giải mã được, đủ độ dài và được mux vào MP4. Kiểm phần render bằng thông tin codec/frame/thời lượng trước tái sử dụng. Kiểm MP4 cuối bằng probe và giải mã, chênh lệch hình–tiếng, số frame, độ dài và khoảng đen/im lặng ngoài chủ ý. Không coi mọi khoảng im lặng hoặc màn đen có chủ đích là lỗi. Ghi file tạm, chỉ công bố sau kiểm đạt; giữ cache hữu ích để sửa phần lỗi.

**Nghiệm thu:** không báo hoàn thành khi thiếu lời kể, file hỏng hoặc sai thời lượng; sửa phần hỏng rồi nối tiếp. Code: src/server/services/motionRenderService.ts:212,457,506–554.

### P1.1 — Đúng điểm đặt chưa chứng minh hình minh họa đúng nội dung

**Đã xác nhận giới hạn của bộ kiểm.** Kiểm kho hiện xác nhận SVG hợp lệ, metadata và hình học. Nó không chứng minh chiếc giường trong ảnh trùng vị trí mà metadata mô tả, tư thế thật giống mẫu, hoặc AI đã hiểu đúng người cầm vật. Các kiểm nguồn trích dẫn và quan hệ hiện có rất cần thiết nhưng vẫn chưa phải nghiệm thu thị giác đầy đủ.

**Sửa:** nghiệm thu tài nguyên cũ và mới cùng một chuẩn gói, chuẩn hóa điểm tiếp xúc, kích thước, lớp trước/sau, điểm đặt đồ và người; loại alias/trùng nghĩa khỏi lựa chọn mà giữ liên kết dữ liệu cũ. Dùng bố cục hữu hạn cho các tình huống thường gặp. Kiểm quan hệ đã chấp nhận xuyên cảnh: ai ở đâu, ai cầm gì, vật còn hay mất, ai đang nói. Hình giữ vai trò minh họa; không thêm chuyển động khó để tăng số thao tác.

**Nghiệm thu:** ảnh đầu/giữa/cuối của các trường hợp đứng–nằm, đối thoại, ngồi bàn, đưa vật, cửa–giường, hồn ma cùng danh tính, hiệu ứng gắn đúng nguồn. Kiểm cả hai gói và nhiều truyện, không chỉ một video. Review AI là tùy chọn; bộ kiểm cục bộ luôn chạy. Code: src/server/services/puppet/packInventory.ts:6; packSceneChoices.ts; pipelinePuppet.ts:670.

### P1.2 — Chia cảnh cần nghiệm thu theo sự việc, không chỉ đủ độ phủ

Tool đã lập storyboard theo sự việc và kiểm phủ nguồn. Cần giữ cách này, không quay về ép mỗi câu một ảnh hoặc thay cảnh đều theo số giây. Lượt 20 phút chưa có MP4 nên chưa thể kết luận số cảnh lặp thực tế của lượt này.

**Sửa:** mỗi đơn vị hình ghi rõ sự việc, nhân vật, nơi chốn, trạng thái và câu dẫn chứng. Cho phép giữ cảnh khi lời kể còn cùng sự việc; khi đổi người tham gia, không gian, thời điểm hoặc tình tiết thiết yếu thì phải có hình phù hợp. So sánh trạng thái và bố cục sau chọn tài nguyên để phát hiện cùng một ảnh bị dùng cho các sự việc khác nhau. Chỉ sửa cảnh vi phạm; không cố thay ảnh liên tục cho đỡ lặp.

**Nghiệm thu:** đối chiếu bảng ảnh + lời kể + mốc giọng, nhất là lúc đổi bối cảnh/manh mối. Không dùng tỷ lệ ảnh mới đơn thuần làm thước đo chất lượng.

### P1.3 — Giọng có kiểm tra nhưng vẫn còn trường hợp chưa xác nhận chất lượng

**Đã xác nhận từ code và log.** Sau số lần thử hữu hạn, clip tốt nhất có thể được giữ với trạng thái REVIEW. Cache REVIEW có thể dùng lại; timestamp từ chỉ được nạp trong nhánh PASSED. Tổng track ghi số câu cần đối chiếu nhưng vẫn có thể đi tiếp. ASR lệch không tự chứng minh giọng phát âm sai.

**Sửa:** tách lỗi tín hiệu thật, sai/mất chữ có bằng chứng và nghi vấn ASR. Chỉ tái tạo các câu cần sửa; kiểm lại câu REVIEW theo tiêu chí rõ thay vì mặc định tin hoặc tái tạo vô hạn. Đối chiếu tốc độ, khoảng nghỉ và độ rõ chữ của cả người kể lẫn nhân vật với mẫu Thần trùng. Giữ xử lý phụ âm nhẹ; đánh giá bằng nghe A/B cùng với chỉ số. Không đổi tốc độ toàn bộ để che câu đọc hỏng.

**Nghiệm thu:** nghe mẫu đại diện nhiều giọng và đoạn dài nối liền; không nuốt phụ âm, tăng tốc đột ngột, khoảng nghỉ gãy câu hoặc clipping. Trạng thái chưa xác nhận phải được phản ánh đúng trong báo cáo chất lượng. Code: src/server/services/motionAudioService.ts:115,186–203,337.

### P1.4 — Thời lượng và đồng bộ hình–lời cần khóa bằng giọng thực

**Đã xác nhận từ code.** Viết chương dùng ngân sách chữ dựa trên thời lượng và tốc độ ước tính/đo được, nhưng kiểm đầy đủ kịch bản cuối chỉ buộc có lời kể ở từng chương. Timeline từ có nhánh ước lượng khi không có dữ liệu từ phù hợp. Chưa có bằng chứng lượt đang chạy thực sự ra đúng 20 phút.

**Sửa:** kiểm cả tiến triển cốt truyện, độ dài và kết thúc trước dựng dài. Sau khi có giọng thật, tính lại timeline một lần; căn các mốc đổi hình/manh mối/đối thoại theo dữ liệu âm thanh đáng tin. Nếu thiếu thời lượng đáng kể, sửa phần truyện cần thiết, tái tạo phần bị ảnh hưởng; không kéo giãn tiếng quá mức hoặc chèn im lặng. Ngân sách và sai số thời lượng phải được định nghĩa rõ cho sản phẩm.

**Nghiệm thu:** thời lượng MP4 so với lựa chọn và thời lượng giọng nằm trong ngưỡng chấp nhận đã đặt; hình, phụ đề và người đang nói khớp đoạn nghe thật. Code: src/lib/motionProduction.ts:3; src/server/services/motionStoryService.ts:1554; src/server/services/puppet/storyboardTiming.ts.

### P1.5 — SEO và phần tùy chọn không nên chặn video chính

**Đã xác nhận từ chuỗi gọi UI.** SEO chạy trước dựng cảnh; lỗi ở runStoryJob gọi pauseAutomation nên chuỗi có thể không đi tiếp, dù generateSeo ở chế độ quiet chỉ hiển thị warning.

**Sửa:** tách thành phần bắt buộc và thành phần tùy chọn. SEO, thumbnail, nhạc/SFX thiếu không làm mất kết quả video chính. SEO có thể chạy sau khi chốt truyện hoặc sau khi có thời lượng thật; nếu chưa có thì đánh dấu chờ bổ sung, không báo đã có. Lỗi giọng bắt buộc hoặc sai hình thiết yếu vẫn phải được sửa trước công bố.

**Nghiệm thu:** làm lỗi SEO có chủ đích nhưng video vẫn hoàn thành; làm lỗi giọng bắt buộc thì không xuất bản silent để che lỗi. Code: src/features/motion/hooks/useMotionStudio.ts:362,592,615.

### P1.6 — Kiểm điều kiện máy và tài nguyên trước việc dài

Hiện có thăm dò encoder, browser/renderer và phương án dự phòng ở bước xuất. Chưa thấy một kiểm tra đầu lượt bao quát toàn bộ điều kiện của video dài.

**Sửa:** đầu lượt kiểm nguồn, gói/phiên bản tài nguyên, các giọng cần dùng, mô hình TTS, khả năng ghi/lưu và dung lượng dự kiến, FFmpeg, trình render và tài khoản AI. Tái kiểm dung lượng/khả năng ghi ở các mốc dài. Không hứa preflight ngăn được mọi lỗi dịch vụ xảy ra về sau.

**Nghiệm thu:** phát hiện điều kiện thiếu trước khi tốn nhiều giờ viết/đọc giọng; điều kiện thay đổi giữa lượt đưa về trạng thái chờ có thể phục hồi. Nhánh 2D và 3D cần có kiểm riêng; không đánh dấu hỗ trợ tương đương chỉ vì dùng chung nút UI.

## Bằng chứng từ lượt 20 phút

- Dự án thử “Khói Trầm Đổi Tên”: 8 chương, 166 beat; mục tiêu 1.200 giây.
- Job dựng cảnh 11fa29a2-b030-4a33-a6ba-ad6bcca02f28 dừng lúc 12:36:12 ở “Lập nhịp hình theo sự việc”. Đã giữ 36/52 nhóm storyboard và 140 đơn vị hình; đây không phải 140 cảnh đã được dựng/render và nghiệm thu hoàn chỉnh.
- Job giọng riêng 1c3bf696-5c4e-4587-a8a6-d0cd82cba37e vẫn chạy; lần đọc API trong đợt rà soát này thấy 77/199 câu, log mới nhất 13:03:10. Có câu được gắn REVIEW do nhận dạng nghi vấn, chưa thể kết luận tất cả là lỗi phát âm.
- Chưa có built/compiled/render hoàn chỉnh hoặc MP4 20 phút của lượt này. Không lấy kết quả kiểm từng hàm để tuyên bố video đã đạt.

## Kiểm tra đã chạy trong đợt rà soát

1. audit-job-identity.ts: tái hiện nhận chung job cho hai yêu cầu khác nhau ở cả SCENES và VOICE. Đây là kiểm chứng lỗi hiện hữu, không phải bản sửa.
2. verify-motion-production.ts: đạt kiểm thiếu chương, giữ chương/log qua thoát tiến trình, gián đoạn về trạng thái dừng, hủy bền vững và giữ trạng thái cuối.
3. verify-motion-spatial-placement.ts: đạt kiểm điểm neo, kề nhau, ở giữa và dẫn chứng nguồn.

Hai kiểm thử đạt không bao phủ lỗi nhận nhầm job vừa tái hiện, chất lượng mỹ thuật, chất lượng nghe hoặc toàn lượt 20 phút.

## Thứ tự triển khai đề xuất

1. Sửa danh tính tác vụ và trạng thái toàn lượt; lưu cấu hình/phiên bản, bảo đảm dừng và phục hồi đúng.
2. Giảm ngữ cảnh AI, thống nhất retry, giữ nguyên lỗi gốc, tạm chờ khi dịch vụ bị chặn. Giữ các nhóm đã chấp nhận.
3. Ràng buộc kịch bản với khả năng kho trước khi chốt, kiểm tình tiết thiết yếu; hoàn thiện kiểm bố cục và tài nguyên theo cả hai gói.
4. Chốt giọng, thời lượng và timeline thực; sửa câu lỗi có chọn lọc; tách SEO/phần tùy chọn khỏi đường bắt buộc.
5. Siết preflight, phục hồi render, kiểm cache và nghiệm thu MP4 trước công bố.
6. Kiểm bằng nhiều truyện ngắn ở cả hai gói, có lỗi giả lập reload/restart/mất mạng/AI bị chặn/clip hỏng/thiếu tiếng, rồi chạy một lượt 20 phút đầy đủ và xem/nghe đầu–giữa–cuối cùng mọi mốc đổi tình tiết.

“Thành công” phải có nghĩa là MP4 đủ nội dung đã duyệt, đúng gói, hình minh họa đúng quan hệ thiết yếu, giọng rõ và đồng bộ, thời lượng đúng ngưỡng, file giải mã hợp lệ. Dịch vụ ngoài có thể cần người dùng xác minh hoặc chờ hoạt động lại; tool phải giữ tiến độ và nối tiếp đúng, không đánh dấu thành công bằng kết quả sai.
