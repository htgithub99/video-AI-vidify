# Luồng viết và biên tập kết hợp

## Phạm vi

Áp dụng vào phân tích, viết chương và biên tập của Video Motion cho cả phương thức Library và Remotion. Giữ nguyên prompt dựng hình của ba kiểu hình.

## Cách xử lý

- Tận dụng request phân tích đang có để lập kế hoạch sự kiện, trạng thái đầu/cuối chương và đóng góp mới của mỗi chương.
- Với thể loại phán quyết: giữ một câu hỏi và một tiêu chí xuyên suốt; tách nhãn đánh giá khỏi motif bắt buộc bảo toàn. Không ép các nhãn mâu thuẫn cùng tồn tại khi biên tập.
- Đưa kế hoạch và trạng thái các chương trước vào request viết đang có. Câu nối chỉ dẫn đến câu hỏi tiếp theo, không kể trước câu trả lời.
- Chuẩn hóa số/ngày rõ nghĩa trong narration và utterances bằng code. Giữ nguyên ngày viết tắt, số thập phân, mã định danh không rõ nghĩa để tránh đoán sai.
- Gom đủ các câu cần sửa theo nhóm. Cập nhật lời kể, lời thoại và action/scenePlan liên quan cùng nhau; bảo toàn người nói.
- Kiểm tra lại sau biên tập. Tối đa một lượt sửa bổ sung theo nhóm cho lỗi nguồn, nhãn và nối chương còn tồn tại. Các cảnh báo còn lại được ghi rõ, không lặp vô hạn.
- Kiểm tra nội dung cũng chạy sau sửa thời lượng; các bản cũ thiếu metadata kế hoạch vẫn dùng được.

## Request

Kế hoạch được thêm vào request phân tích/viết hiện có nên không tạo request lập kế hoạch riêng. Chuẩn hóa số và chạy bộ phát hiện lỗi không gọi AI. Nếu không có lỗi, bỏ qua biên tập; nếu sau biên tập không còn lỗi cần sửa bổ sung thì số request bổ sung bằng không.

Mỗi nhóm biên tập chứa tối đa tám câu và còn được chia theo ngân sách ký tự. Số request phụ thuộc số nhóm thực tế. Cần tách lượt sửa nội dung bổ sung khỏi lượt sửa JSON/utterances và lượt gửi lại vì lỗi Gemini. Bộ đếm trong nhật ký tính lượt gọi tầng AI của tool, không phải số tin nhắn nhận ngữ cảnh từng phần trên trang Gemini.

Riêng Phán quyết: công thức cũ gợi ý khoảng hai chương cho 300 giây, làm kế hoạch bỏ bớt ứng viên để chừa mở/kết. Công thức mới gợi ý tối thiểu bốn chương: mở, ít nhất hai ứng viên, kết. Với video năm phút, phần viết có thể tăng từ hai lên bốn request chương; đây là lượt viết nội dung chính, không phải QA. Số chương được AI chọn thực tế và việc chia phần do độ dài vẫn cần đọc trong log.

## Kiểm thử thật

Kết quả và nhật ký lưu ở `scratch/motion-writing-live-20261101/`. Dùng các API analyze/script/status của tool, nguồn Nile đã lưu, tiếng Anh, cấu hình 5min, Gemini 3.8 Flash Trung bình, khóa AI dự phòng.

Đây là kiểm thử kịch bản và phân cảnh với mục tiêu 300 giây. Chưa tạo voice hoặc xuất MP4 nên chưa đo thời lượng âm thanh. Bộ phát hiện lỗi không thay thế việc đọc đối chiếu nội dung hoặc thẩm định lịch sử độc lập.

## Vấn đề phát hiện khi kiểm thử

- Lượt phán quyết đầu tiên bị Gemini từ chối sau khi nhận các phần ngữ cảnh. Có lưu đầy đủ lỗi, không coi là kết quả đạt.
- Lượt POV đầu tiên: 19 câu được biên tập, 18 câu đổi lời, một câu bị bỏ, không dùng lượt sửa nội dung bổ sung. Khi đọc lại phát hiện câu về việc quân Ai Cập dồn lực vào trung tâm bị nhận nhầm là kể lặp. Cần kiểm tra bảo toàn thông tin mới thay vì chỉ dựa vào các từ chung của trận đánh.
- Đã tăng độ chắc chắn của phép so sánh kể lặp; chỉ cho phép bỏ câu khi nội dung trùng nguyên văn sau chuẩn hóa. POV chạy biên tập lại từ draft thật: đủ 43 beat, không bỏ câu, giữ quyết định dồn lực vào trung tâm và không còn cảnh báo được phát hiện.
- Phản hồi chương hai của người trong cuộc thiếu dấu đóng `scenePlan` trước `utterances`. Tool gửi lại và Gemini lặp lại cùng cấu trúc sai. Bộ đọc mới chỉ bổ sung dấu đóng khi nhận diện đúng cấu trúc beat, phân tích được toàn bộ JSON và giữ nguyên mọi chuỗi dữ liệu. Đã đọc lại đủ 26 beat của phản hồi lỗi thật; các cấu trúc không rõ nghĩa vẫn bị từ chối.
- QA tiếng Anh của người trong cuộc chỉ nhận I/my mà thiếu we/our/us. Đã sửa để tương ứng với ngôi “chúng tôi” vốn đã được nhận trong tiếng Việt. Số câu bị đánh dấu giảm từ 39 xuống 14 trước kiểm tra nguồn.
- Đối chiếu bằng người đọc phát hiện draft tự thêm quân số đơn vị, số người chết, số chôn cất và lịch trình ba ngày. Đã thêm kiểm tra con số gắn với sự kiện ở nguồn factual, đối chiếu số đầy đủ giữa tiếng Anh/Việt và chữ số; không coi “ba” trong “ba nghìn” là nguồn cho “ba ngày”. Các phát hiện được giao AI sửa, không tự sửa nội dung bằng code. Độ tuổi nhân vật khung truyện và đếm bước không bị coi là số liệu lịch sử.
- Hướng dẫn biên niên trước đây vừa yêu cầu flash-forward vừa cấm kể trước mọi sự kiện. Đã làm rõ ngoại lệ mở/kết; ba beat hé lộ đầu của chương opening không bị ghi là đã kể đầy đủ sự kiện, và chương verdict được phép tóm tắt ngắn các ứng viên.
- Bài `verify-motion-production-runner.ts` có kiểm tra sửa thời lượng với voice giả 0,8 giây và mục tiêu hai giây. Code runner hiện tại chỉ yêu cầu thời lượng dương và ghi cảnh báo lệch, nên nhánh sửa thời lượng mà bài kiểm tra mong đợi không chạy. Lỗi assertion này được ghi riêng; không sửa luồng xuất video trong thay đổi viết kịch bản.
- Đọc đối chiếu bản Người trong cuộc sau biên tập vẫn thấy tình tiết thuyền chìm và chôn cất ngoài nguồn dù đã bỏ con số. Đã sửa hướng dẫn chung và riêng của thể loại: xóa con số chưa đủ để xác nhận sự kiện; không tự thêm mất mát, người đặt luật, nghi thức, lễ tang hoặc kết cục gia đình để đủ khung. Giữ bản lỗi làm bằng chứng và chạy lại bằng API thật.
- Lượt Biên niên đầu chạy xong 43 beat, sửa mốc ba giờ ngoài nguồn nhưng tự dẫn sang Pharnaces/Pontus. Prompt thể loại còn bắt buộc nhảy thời gian, kéo kết tới hiện tại và dẫn chuyện sau. Đã đổi các mục này thành điều kiện phụ thuộc nguồn; không tiếp tục sự nghiệp của nhân vật ngoài phạm vi nguồn.
- Cùng lượt Biên niên, các cảnh báo còn lại xuất phát từ việc nhắc lại ngày, địa điểm và tên có tước hiệu. Đã loại các từ định vị/số/tên đã biết khỏi phép so sánh nhịp và cụm lặp; kiểm tra con số ngoài nguồn chạy riêng. Hồi quy vẫn bắt được câu trùng thực sự và vẫn giữ nguyên văn cảnh làm chứng cứ, không tự xóa sự kiện dựa trên tương đồng.
- Ngữ cảnh biên tập đã có nguồn và lời cần sửa nên không nạp lặp toàn bộ accepted context; bỏ kế hoạch tất cả chương khỏi phần brief lặp trong mỗi nhóm. Giữ câu hỏi/tiêu chí/nhãn, giọng kể, các dữ kiện bảo toàn và phát hiện cụ thể.

## Kiểm tra hồi quy

- Đạt: TypeScript; `verify-motion-writing`; `verify-motion-editorial-policy`; `verify-motion-response-contracts`; `verify-chat-response-snapshots`; `verify-genre-editorial-contracts`; `verify-genre-style-coverage`.
- `verify-genre-editorial-blueprints` thất bại ở dòng 26 vì tìm literal chữ thường `continuing_after_final_correction` ngay trong `pipelineController.ts`, trong khi controller dùng hằng `SOURCE_TEMPLATE_CONTINUING_AFTER_FINAL_CORRECTION`. Controller này không bị sửa trong lượt đối ứng. Đây là kiểm tra văn bản đã lệch sau việc tập trung hóa text, không phải bằng chứng luồng Motion mới bị lỗi.
- Không tuyên bố toàn bộ bộ kiểm thử kho mã đều đạt; lỗi runner thời lượng được ghi ở trên.

## Bổ sung sau đọc đối chiếu bản chạy thật

- Mở rộng kiểm tra quân số sang squadron, cavalrymen, horsemen và các đơn vị quân đội tương ứng. Đây vẫn là phát hiện để giao AI xem lại, không phải phép tự xóa hoặc thay số trong câu chuyện.
- Chỉ đổi số La Mã sang lời đọc khi khớp chính xác một tên nhân vật đã biết trong cast, trong phạm vi I–XXXI. Đồng bộ narration và utterances; metadata cast, trích nguồn, mã và tên không biết được giữ nguyên.
- Cho phép bộ biên tập nhận danh sách lỗi cụ thể đã đọc đối chiếu, có ID hợp lệ; các câu này được tính vào giới hạn sửa, không bị cắt xuống hai câu. Không thêm endpoint hoặc cấu hình công khai mới.
- Test thật phát hiện một lỗi khác: AI trả lời đúng narration nhưng giữ lại action/scenePlan sai. Đầu vào trước đó chỉ gửi visual="scene" và đầu ra cho phép bỏ qua mô tả cảnh. Luồng mới gửi action/scenePlan cho lỗi nguồn và yêu cầu trả đầy đủ khi bản gốc có các trường đó. Bộ nhận từ chối sửa chỉ có lời mà thiếu phần mô tả cảnh bắt buộc. Checkpoint cũng lưu được thay đổi chỉ ở mô tả cảnh.
- Các loại sửa giọng/ngôi kể thông thường không phải gửi thêm toàn bộ scenePlan. Các nhóm lỗi nguồn có thể lớn hơn và chia thành nhiều request; số thực tế được ghi trong báo cáo, không cam kết một lượt biên tập luôn bằng một request.
- Lượt chạy script biên tập độc lập đầu tiên thiếu request context của backend nên không mở được tài khoản Google; không có câu nào được sửa. Đã lưu log bootstrap riêng và chạy lại cùng context phân giải cấu hình như backend. Không coi lần khởi tạo lỗi là kết quả đạt.
- Không xác minh độc lập sự kiện lịch sử từ Internet trong đợt này. Nguồn thử là bản transcript dịch máy có một số chỗ mơ hồ; nội dung kế hoạch và trường quote do AI sinh chưa phải bằng chứng đã đối chiếu nguyên văn. Những phát hiện thủ công chỉ xác nhận các trường hợp cụ thể đã kiểm tra.

## Kết quả cuối cùng

| Thể loại | Chương | Beat | Mục tiêu | Request biên tập ghi nhận | Trong đó bổ sung khi kiểm thử |
| --- | ---: | ---: | ---: | ---: | ---: |
| POV | 2 | 43 | 300 giây | 7 | 3 |
| Người trong cuộc | 2 | 43 | 300 giây | 7 | 3 |
| Biên niên | 2 | 43 | 300 giây | 6 | 6 |
| Phán quyết | 4 | 40 | 300 giây | 7 | 6 |

Bảng tính các bản đang giữ và các lượt sửa liên quan, gồm việc phát hiện rồi sửa lỗi chỉ cập nhật lời mà chưa cập nhật mô tả cảnh. Tổng 27 request biên tập, trong đó 18 request bổ sung trong quá trình kiểm thử và điều chỉnh; đây không phải chi phí cố định cho một video mới. Những lượt thử cũ đã lưu riêng, lượt khởi tạo chưa gửi được và các lần gửi lại do Gemini lỗi không nằm trong các cột biên tập này. Nhóm được chia theo ngân sách ký tự nên một lượt sửa có thể gọi nhiều request.

- Nhật ký lượt phân tích/viết được giữ gần nhất ghi: Người trong cuộc 13 lượt gửi, Biên niên 5, Phán quyết 8, tính lũy kế trong từng phiên phân tích/viết. Không cộng lại số cuối của log phân tích vào số cuối của log viết. POV có bản đầu 10 lượt gửi và một lượt biên tập lại riêng 4 lượt; các bản/log gốc được giữ để phân biệt các lần thử.
- Cả bốn bản cuối không còn cảnh báo của bộ kiểm tra hiện tại, không còn lỗi đồng bộ utterances được phát hiện và không bỏ beat. Điều này không đồng nghĩa với xác minh toàn bộ lịch sử hoặc bảo đảm mọi kịch bản sau đều đúng.
- Đọc lại các lỗi đã ghi nhận: đã gỡ sự kiện đầu hàng/bị giẫm đạp và thuyền/bến sông ngoài nguồn; bỏ số đơn vị kỵ binh tự đặt, bối cảnh Gaul/Rubicon, tuyên bố Caesar cai trị toàn cõi và mô tả quy chế bảo hộ; giữ đồng cai trị Cleopatra/Ptolemy XIV. Mô tả cảnh được sửa bằng phản hồi AI, không thay nội dung bằng câu viết tay trong code.
- Có nhóm AI trả về không sửa thêm vì lời đã đúng và mô tả cảnh tương ứng không chứa lỗi nguồn đó. Script thử ban đầu coi số sửa bằng không là lỗi; đã sửa cách ghi nhận để phân biệt không cần sửa với lỗi vận chuyển. Các phản hồi không sửa không được tự coi là chứng nhận đúng; vẫn đọc lại trường dữ liệu. Hai lỗi mô tả cụ thể còn lại đã được sửa trong lượt tập trung riêng.
- Bổ sung hồi quy cho sai báo lặp sau khi chuyển số La Mã thành lời: so sánh không dựa vào tên vua, dạng sở hữu tên/số thứ tự và mốc ngày/địa điểm. Cụm lặp phải đủ từ mang nội dung ngoài các mốc đó. Việc Caesar ủng hộ Cleopatra và việc lập người đồng cai trị là hai quyết định khác nhau; test bảo toàn cả hai. Câu trùng sự kiện thực sự vẫn được phát hiện.
- Backend phát triển tự nạp lại sau sửa; đã kiểm tra HTTP 200 và thời điểm tiến trình mới hơn lần ghi mã nguồn. Không khởi động lại trong khi bài test API còn chạy.

Số request cho lần sử dụng mới: không thêm request lập kế hoạch riêng; tận dụng lượt phân tích và viết đang có. Nếu không có lỗi thì thêm 0 request QA. Nếu có lỗi thì biên tập theo nhóm; sau đó tối đa một lượt sửa bổ sung cho lỗi cụ thể còn tồn tại. Lỗi JSON/phản hồi thiếu trường và lỗi dịch vụ Gemini là các loại gửi lại riêng. Riêng Phán quyết năm phút gợi ý tối thiểu bốn chương nên phần viết chính tăng hai request so với công thức hai chương cũ.

Mở `scratch/motion-writing-live-20261101/index.html` để xem lời, action, scenePlan và trạng thái đọc đối chiếu. `summary.json` và `verification.json` chứa số liệu cuối; các file trước/sau và log giữ bằng chứng kiểm thử. Chưa tạo voice hoặc MP4; 300 giây là cấu hình mục tiêu.
