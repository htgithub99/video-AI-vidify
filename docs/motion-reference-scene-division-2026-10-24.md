# Cách chia cảnh của Chiếc khăn Piêu và đối chiếu Video Motion

Ngày phân tích bổ sung: 24/10/2026. Nguồn: [Chiếc khăn Piêu – Bùa Yêu Kỳ Truyện](https://www.youtube.com/watch?v=ZrgIi8a8dyA).

Đã triển khai vào pipeline chung: [thay đổi chia hình và kết quả kiểm thử](motion-storyboard-rework-2026-10-24.md).

Kết luận: mẫu tổ chức hình theo sự việc, đầu mối và cảm xúc cần cho người xem thấy. Một bố cục có thể đi qua nhiều câu và nhiều lượt nói; một câu có nhiều thao tác vẫn có thể chỉ cần một hình đại diện. Dấu chấm câu không phải lý do đủ để đổi hình.

## Bằng chứng và giới hạn

Đối chiếu lại 9 bảng ảnh chứa đủ 341 mốc hình trong [thư viện đã phân tích](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/index.html), ghi chú từng mốc và phụ đề tự động cục bộ. Các đoạn chải tóc, gọi Ơn, chăm hai người bệnh và trao khăn được đối chiếu thêm thời gian lời kể.

341 là số khoảng hình/góc/trạng thái được phát hiện, không phải khẳng định đúng 341 cảnh dựng hoặc 341 lần cắt. Có mốc là chuyển hình hay đổi trạng thái trong cùng bố cục; phép dò có thể bỏ sót thay đổi ngắn. Các ranh giới xấp xỉ, có thể lệch khoảng 0,5–1 giây. 28 phần trong tài liệu cũ là cách chúng ta nhóm diễn biến để phân tích, không phải số chương do tác giả công bố.

Bản nguồn cục bộ không có âm thanh. Phân tích này nói về tổ chức hình theo phụ đề và thời gian, không kết luận nhịp thở, nhấn giọng hay thông số hòa hình chính xác. Phụ đề tự động có lỗi tên riêng. Không chép lại toàn bộ lời nguồn vào báo cáo.

## 1. Cần phân biệt ba cấp

| Cấp | Ví dụ trong mẫu | Điều thay đổi |
|---|---|---|
| Cụm sự việc | Xoan chải tóc Ơn và bị người kể bắt gặp | Một chuỗi có mở đầu, đầu mối và phản ứng; không phải mỗi câu một cụm mới |
| Không gian và thời điểm | Sàn nhà cao, người kể dưới sân, ban ngày | Sơ đồ người–sàn–sân phải nối đúng qua các góc |
| Góc minh họa | Thấy hai người trên sàn → cận Ơn → cận lược → người quan sát | Đổi trọng tâm để bổ sung thông tin, thường không cần địa điểm mới |

Vì vậy, “cảnh bị lặp” phải xét hình có đang bổ sung ý nghĩa hay không. Quay lại cùng gian bếp để thấy người đã ngồi dậy là có thông tin mới. Đổi hình hai người đứng sang một hình hai người đứng khác mà không thấy chiếc then vừa nhấc vẫn không kể được sự việc.

## 2. Nhịp hình đo được

Tính từ `analysis-20261023/analysis.json`, bao gồm mở và kết kênh:

| Chỉ số | Kết quả |
|---|---:|
| Thời lượng | 38 phút 14,6 giây |
| Khoảng hình phát hiện | 341 |
| Thời lượng trung bình một khoảng | 6,73 giây |
| Trung vị | 6 giây |
| Một nửa số khoảng nằm trong vùng | Khoảng 5–8 giây |
| Từ 5 đến dưới 10 giây | 231/341, khoảng 67,7% |
| Dưới 2 giây | 2/341 |
| Từ 10 đến dưới 15 giây | 35/341 |
| Từ 15 giây trở lên | 4/341 |
| Khoảng dài nhất | #252, 25,5 giây |

Đây là mô tả kết quả phát hiện, không phải công thức cứ 6 giây phải đổi hình. Mẫu có cả nhịp ngắn và nhịp dài; vị trí đầu mối và cảm xúc quyết định cách chia. Không dùng bảng này để suy ra tốc độ zoom hoặc số ảnh nền độc lập.

## 3. Ví dụ rõ nhất: chải tóc, 09:08–09:35

| Mốc | Khoảng thời gian | Hình và nhiệm vụ |
|---|---|---|
| #082 | 09:08,25–09:14,25; 6 giây | Xoan ngồi sau Ơn trên sàn cao; người kể nhìn từ dưới sân. Xác lập ai làm gì cho ai và người quan sát ở đâu. |
| #083 | 09:14,25–09:18,25; 4 giây | Cận Ơn nhắm mắt, Xoan ở sau đầu. Chuyển trọng tâm sang trạng thái ngoan ngoãn khác thường. |
| #084 | 09:18,25–09:25,25; 7 giây | Cận chiếc lược có tóc, nền Xoan làm mềm. Biến chi tiết nhỏ thành đầu mối người xem nhớ được. |
| #085 | 09:25,25–09:30,75; 5,5 giây | Trở lại quan hệ trên sàn–dưới sân khi Xoan nhận ra người kể. |
| #086 | 09:30,75–09:35,25; 4,5 giây | Cận người kể sợ hãi. Kết chuỗi bằng tác động tâm lý của điều vừa thấy. |

Đường đi của sự chú ý là: **quan hệ không gian → trạng thái Ơn → đầu mối chiếc lược → bị phát hiện → phản ứng**. Năm hình này có năm nhiệm vụ khác nhau, dù chỉ là một việc tại cùng khu nhà.

Đáng học nhất là lời ở #084 kể một chuỗi gỡ tóc, cuộn và cất. Hình đại diện nhấn chiếc lược và tóc; mẫu không cần tạo ba động tác đầy đủ. Với tool, nên chọn bằng chứng hình quan trọng và lưu trạng thái kết quả, không bắt mỗi động từ thành một hoạt cảnh.

[Xem bảng #081–#120](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/boards/review-03.jpg). [Đối chiếu video tại 09:08](https://www.youtube.com/watch?v=ZrgIi8a8dyA&t=548s).

## 4. Khi nào giữ nguyên hình qua nhiều câu và nhiều người nói?

#252, 27:50,75–28:16,25, giữ một bố cục đại diện trong 25,5 giây: Yến trước trái, ông mo cạnh phải, người kể phía sau. Phụ đề đi qua lời dẫn Yến tiến lên, lời Yến gọi Ơn, rồi lời người kể tiếp tục gọi và nhắc tình bạn cũ.

Không gian, đích gọi và cảm xúc chung vẫn là một việc. Đến khi đuốc bùng sáng lại, mẫu chuyển sang cận lửa #253. Như vậy, **đổi người nói không bắt buộc đổi góc; một dấu hiệu mới có ý nghĩa mới là lý do rõ để đổi**.

Ảnh đại diện không chứng minh khung hình bất động hoàn toàn suốt 25,5 giây. Kết luận chắc hơn là không phát hiện một bố cục minh họa mới trong khoảng này. Khi áp dụng, vẫn phải thay điều khiển miệng đúng người đang nói dù giữ nguyên bố cục.

[Xem bảng #241–#280](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/boards/review-07.jpg). [Video tại 27:50](https://www.youtube.com/watch?v=ZrgIi8a8dyA&t=1670s).

## 5. Một câu dài cũng có thể chỉ cần một hình kết quả

#273, 30:32,75–30:41,25, lời kể gom việc Yến chuẩn bị chăm Xoan, nấu nước lá, lau người và canh bên bếp. Hình đặt Yến bên nồi và Xoan nằm bên phải. Đó là bố cục đại diện cho việc chăm bệnh, không phải mô phỏng đủ mọi lần nhấc tay.

Khi lời đổi sang câu hỏi của người kể, #274 dùng góc qua vai; khi Yến giải thích tình cảm, #275 dùng cận Yến nhưng vẫn thấy bối cảnh chăm bệnh. Sang đoạn hai người bệnh nằm hai phía và Yến đi lại chăm, #276 trở lại góc trên xuống để người xem đọc được sơ đồ.

Điều cần học: hình rộng dành cho quan hệ vị trí; hình cận dành cho cảm xúc hoặc đầu mối. Không dùng cận mặt thay cho việc phải thấy hai người nằm ở hai phía. Cũng không dựng thêm 4–5 hình chỉ vì một câu liệt kê 4–5 thao tác chăm sóc.

## 6. Hành động khó được chia bằng những trạng thái dễ hiểu

Chuỗi #069–#072, 07:35,75–07:58,25:

1. Người kể tới gần Ơn ở sân; mẹ còn ở trên sàn.
2. Góc cao cho thấy người kể nghiêng/ngã khi bị đẩy.
3. Cận người kể đã nằm trên đất.
4. Người nằm ở tiền cảnh, Ơn quay lưng bỏ đi ở xa.

Mẫu cho thấy nguyên nhân, kết quả và quan hệ sau hành động. Không cần mô phỏng vật lý cú ngã liên tục. Sai lầm cần tránh là giữ cả hai người đứng rồi chỉ thay nét mặt qua ba câu.

Ngay sau đó, #073–#077 chuyển sang ký ức cứu nhau lúc nhỏ: nước, bờ đá, hai đứa trẻ và người mẹ. Hồi tưởng là một nhánh minh họa có chủ đích, không phải thêm trẻ em thật vào hiện tại ở sân. #078 trở lại người kể ở hiện tại.

[Bảng #041–#080](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/boards/review-02.jpg).

## 7. Cận đồ vật và phản ứng xuất hiện ở nút truyện

- #012–#014: từ nhóm bên bếp tới lời mẹ dặn rồi góc trên xuống nồi. Nồi được cho thấy trước để người xem nhận ra khi truyện nhắc lại.
- #026–#033: thêu khăn, hình giải thích chiếc khăn, Ơn cầm khăn rồi nói chuyện với bạn. Có hình sinh hoạt, hình giải thích và hình hiện tại; không phải tất cả đều là một hành động xảy ra liên tục.
- #136–#142: vật liệu và túi trên xà được tách ra khi ông mo giải thích, rồi nối với Ơn. Đầu mối có vị trí riêng trong chuỗi dựng.
- #324–#328, 36:31,25–36:56,25: Yến đưa khăn → góc cao xác lập người tham gia/chứng kiến → Ơn nhận và xin cưới → phản ứng Yến → cả nhà vui. Hình theo đường đi của chiếc khăn và tác động tình cảm.

Cận đồ vật cần có lý do kể chuyện. Không phải bất kỳ danh từ nào xuất hiện trong lời cũng phải thành một ảnh cận mới. Những hình giải thích, ký ức và lớp chồng phải được phân biệt với vật/người đang có mặt ở hiện tại.

[Bảng đoạn kết](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/boards/review-09.jpg).

## 8. Chuyển thời gian khác với đổi góc trong cùng việc

Mẫu dùng toàn bản ngày/đêm, mưa, mùa xuân, đường đi hoặc mặt ngoài nhà để đưa người xem sang giai đoạn khác. Các mốc #194, #210, #258, #317 là ví dụ có nhiệm vụ báo thời gian/không khí.

Trong cùng sự việc, đổi từ hai người sang cận mặt hoặc cận lược không đồng nghĩa phải có nền mới hay hiệu ứng mạnh. #282 và #298 dùng hình tối có khe sáng để biểu đạt mở mắt; không nên biến mỗi đổi người nói thành một chuyển kiểu này. Ảnh tĩnh không đủ để đo chính xác kiểu cắt/hòa và thời lượng của mọi lần chuyển.

## 9. Tool hiện tại còn khác ở đâu?

Đây là đối chiếu code tại thời điểm lập báo cáo, sau bản sửa giữ kế hoạch và trạng thái ngày 24/10; không dùng lỗi MP4 cũ để kết luận code mới đã dựng thất bại.

| Luồng hiện tại | Hạn chế so với mẫu |
|---|---|
| `splitPuppetSentences` và `puppetBeatLines` tách theo dấu kết câu | Đơn vị hình đầu tiên vẫn bám đơn vị văn bản; chưa có bước lập danh sách hình độc lập phủ một hoặc nhiều câu/đoạn câu. |
| Prompt READ yêu cầu một hình cho mỗi câu; pacing của horror/story vẫn ghi `one picture per sentence` | Có thể buộc AI chọn hình mới dù thông tin đang tiếp nối; trái với đoạn #252 giữ cùng bố cục qua nhiều câu và lượt nói. |
| Compiler đặt đầu khung theo đầu câu trong voice | Chưa chọn riêng thời điểm lộ đầu mối ở giữa câu. Có thể đưa vật/kết quả vào sớm khi câu chưa kể tới. |
| Chỉ gộp khung hình giống nhau khi một khung ngắn dưới 0,9 giây và cùng người nói | Bảo toàn sự kiện ngắn là đúng, nhưng chưa hợp nhất những câu bình thường cùng một nhiệm vụ hình; đổi người nói vẫn tạo một bản ghi riêng. |
| `shot2` chỉ chạy khi khung dài trên 20 giây, chia ở chính giữa | Mốc nửa câu không nhất thiết là lúc lộ đầu mối. Một câu ngắn hơn 20 giây vẫn có thể cần hai thông tin hình; một câu dài có thể chỉ cần một hình. |
| Giữ kế hoạch, trạng thái, quyền sở hữu, bố cục và QA đã được bổ sung | Giúp hình đúng sự việc hơn, nhưng chưa thay thế việc lập nhịp hình theo cách mẫu kể chuyện. |

Tham chiếu: `src/lib/motionPuppet.ts`, `src/constants/motionPuppet.ts`, `src/server/services/puppet/compilePuppet.ts`.

Trong MP4 Tiếng Cào Đêm Tiết Khí cũ, trung bình/trung vị khoảng hình là 5,309/4,896 giây; mẫu là 6,729/6 giây. Hai bộ mốc lấy bằng phương pháp khác nhau, chỉ dùng để định hướng. Video cũ không thiếu số lần đổi hình. Nó thiếu những lần đổi đúng nhiệm vụ: vết cào, then cửa, vết thương, đích khói và trạng thái sau biến cố.

## 10. Hướng áp dụng phù hợp hai gói hình

Đây là đề xuất sau phân tích, chưa đổi code chia cảnh trong lượt này.

1. Lập cụm sự việc theo không gian, thời điểm và hành động trọng tâm trước khi chọn ảnh. Mỗi cụm giữ sơ đồ vị trí và trạng thái chung.
2. Trong từng cụm, lập các hình cần thiết. Mỗi hình trả lời: người xem cần hiểu thêm gì ở đây? Các mục đích có thể là định vị, hành động/kết quả, đầu mối, phản ứng, giải thích/hồi tưởng hoặc chuyển thời gian. Không ép phải có đủ mọi loại.
3. Cho phép một hình phủ nhiều câu/lượt thoại; một câu có thể có một hoặc nhiều hình. Không bắt buộc thay hình khi đổi người nói. Điều khiển miệng và người nói vẫn theo voice riêng.
4. Gắn ranh giới hình với đoạn lời chứa sự kiện hoặc đầu mối. Khi có thời gian từ/cụm từ thì dùng để đặt mốc; tránh mặc định chia đôi thời lượng câu. Không hiện kết quả trước lúc lời kể tới.
5. Chỉ bắt buộc vẽ bằng chứng thiết yếu. Các thao tác phụ được gom thành ảnh đại diện hoặc ảnh kết quả, miễn đúng người, mặt đỡ, chủ đồ và trạng thái sau việc.
6. Dùng khoảng 5–10 giây như gợi ý ban đầu cho nhịp thông thường, không là giới hạn cứng. Giữ dài hơn nếu cùng một việc; cắt ngắn khi cần nhấn dấu hiệu/phản ứng. Không kéo dài vô ích để đạt trung bình của mẫu.
7. Kiểm cả chuỗi hình: có thấy nguyên nhân–đầu mối–kết quả không, có hiện sớm không, có đổi góc vô cớ không, có giữ hình quá lâu sau khi việc đã đổi không. Kiểm từng ảnh riêng chưa đủ đánh giá cách kể.
8. Dùng cùng kế hoạch hình và quan hệ vị trí cho Tối giản mặt nạ và Chibi màu dân gian; hình dáng, tỉ lệ và điểm tiếp xúc được giải theo gói. Không nhân đôi hai bộ quy tắc kể chuyện.

Thứ tự nên làm là sửa đơn vị lập hình và mốc theo lời trước, rồi mới điều chỉnh thời lượng/hiệu ứng. Chỉ tăng số nền hoặc tăng thời gian giữ hình sẽ không tạo ra cách chia cảnh của mẫu.
