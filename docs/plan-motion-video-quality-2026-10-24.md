# Kế hoạch hoàn thiện Video Motion — 24/10/2026

Cập nhật theo chốt ngày 25/10: hình chỉ minh họa đơn giản, đúng nhân vật/vị trí/bối cảnh/đồ vật. Động tác khó hoặc cử chỉ phụ có thể bỏ qua; không coi thiếu diễn hoạt tay là lỗi bắt buộc sửa. Chỉ cần giữ thông tin cốt truyện và kết quả quan trọng. Quy tắc này thay các yêu cầu chi tiết hành động trong bản plan ban đầu. Giọng phải rõ chữ cho cả người kể và nhân vật, lấy Thần trùng làm chuẩn.

## Mục tiêu và mẫu chuẩn

Mẫu âm thanh ưu tiên theo yêu cầu mới nhất là `C:/Users/Admin/Downloads/Thần trùng - Trùng tang kỳ truyện.mp3`. Tốc độ kể, cách nghỉ, độ rõ chữ và cách thể hiện từng vai phải đối chiếu file này. Mèo Đen là tham chiếu cũ, không dùng làm đích hiệu chỉnh trong kế hoạch này.

Hình ảnh là minh họa tĩnh đơn giản, theo hai gói Tối giản mặt nạ và Chibi màu dân gian. Đúng người, đồ, vị trí và ý thoại quan trọng hơn chuyển động phức tạp. Khi sản xuất chỉ chọn và ghép tài nguyên đã được duyệt trong đúng gói; bổ sung kho là công việc chuẩn bị riêng.

Bản kế hoạch ban đầu được lập trước khi thay code sản phẩm và cấu hình giọng. Đã bắt đầu triển khai ngày 25/10; phần thay đổi và bằng chứng mới tại [báo cáo triển khai](motion-voice-and-simple-illustration-2026-10-25.md). Các số liệu ở phần bằng chứng dưới đây là hiện trạng trước sửa. Phiên kiểm này không có công cụ nghe âm thanh trực tiếp; chưa xác minh bằng tai về cảm xúc, âm sắc hay độ rõ chữ.

## Bằng chứng hiện có

Lượt tool thật “Tiếng gõ bên cửa bếp · Kiểm kho minh họa” hoàn tất MP4 dài 148,715 giây, 21 kế hoạch hình và 26 đoạn hình trên timeline, tắt AI review ảnh. Đã giải mã toàn bộ MP4 và xem các ảnh trích. Lượt này dùng kịch bản kiểm có sẵn, chưa chứng minh chất lượng toàn tuyến nguồn → DNA → viết truyện → SEO.

### Âm thanh

Đo cả file bằng cùng một bộ ước lượng:

| Chỉ số | Bản test | Mẫu Thần trùng |
| --- | ---: | ---: |
| Nhịp âm tiết ước lượng trên toàn thời lượng | 2,844/giây | 3,553/giây |
| Nhịp âm tiết ước lượng khi có tiếng nói | 4,14/giây | 5,27/giây |
| Trung vị đoạn nói liên tục | 3,06 giây | 2,14 giây |
| Khoảng ngừng phát hiện mỗi phút | 35,5 | 32,2 |

Đây là chỉ số âm học, không phải đếm chính xác âm tiết ngôn ngữ. Mẫu Thần trùng có nhiều vai và nền âm, nên không áp toàn bộ trung bình này thành một hệ số tăng tốc cho mọi giọng.

- `storage/vieneu/voice-speed.json` vẫn lưu `target.title = MeoDen_giong_ke_goc.mp3`, rate 2,841. Đây là cấu hình tham chiếu cần đổi khi triển khai; không chỉ sửa cách diễn giải báo cáo.
- Cả 19 khoảng ghép giữa 20 clip đều được đặt 0,48 giây; clip còn có phần im lặng đầu/cuối. Cần tính tổng khoảng nghỉ thực thay vì cộng chồng khoảng nghỉ.
- Đã nhận dạng riêng 20 clip: 16 người kể, hai Út, hai bà. Có các cờ nghi vấn ở tên Út và một số từ; chưa đủ bằng chứng khẳng định phát âm sai vì bộ nhận dạng cũng có thể nhầm tên riêng, vùng giọng và thanh điệu.
- Không phát hiện mẫu âm bị clipping trong 20 clip; âm lượng RMS các vai tương đối gần nhau. Chưa có bằng chứng cần tăng âm lượng đồng loạt.
- Bộ lọc voice hiện đã nhẹ. Cần so bản thô và bản sau xử lý trước khi quy lỗi mất phụ âm cho bộ lọc.
- Lượt test đặt `asrCheck:false`. Khi bật, code hiện cho giữ câu sau khi hết retry dù điểm lệch còn cao. Cần phân biệt câu đã đạt, câu nghi vấn và câu xác nhận lỗi nội dung.
- Nam chưa có lời thoại trong test này; chưa thể kết luận giọng nam nhân vật đã đạt.

### Hình ảnh và chia cảnh

- 19/26 đoạn hình là góc rộng; người và bát khá nhỏ, nhiều vùng tường trống. Vấn đề là thiếu trọng tâm theo diễn biến, không phải truyện chỉ dùng hai địa điểm.
- Khoảng 94,6 giây, lời kể nói Nam ra hiệu cho em im lặng nhưng hình vẫn để tay xuống. Theo chốt mới, cử chỉ phụ này được phép để lời kể diễn đạt, không bắt buộc sửa hình.
- Câu Út đẩy bát về phía anh chưa thể hiện rõ kết quả vị trí bát. Nên minh họa trạng thái sau khi đẩy, không cần diễn hoạt tay liên tục.
- Người nằm đã được sửa tiếp xúc nệm nhưng vẫn có dáng xoay từ hình đứng; cần tư thế nằm được thiết kế riêng.
- `packSceneChoices.ts` dừng sau bố cục hợp lệ đầu tiên, rồi sinh các biến thể góc từ bố trí đó. Đạt hình học chưa đồng nghĩa bố cục tốt nhất cho ý kể.
- Các kiểm tra hình học chưa đủ để chứng minh cử chỉ, kết quả hành động và trọng tâm câu chuyện đều đã được thể hiện.

Các sửa đã có như giữ hai bát riêng, vị trí đứng sau theo cửa, chân chạm đất, mắt nhắm/mở theo dẫn chứng, truyền đúng kịch bản sang voice và giữ khung hợp lệ phải được bảo toàn. Chi tiết tại `docs/motion-live-test-recovery-2026-10-24.md`.

## Thứ tự thực hiện

### 1. Khóa mẫu giọng Thần trùng và sửa kiểm tra âm thanh

Phạm vi: `motionVoiceSpeedService.ts`, `motionVoicePaceService.ts`, `motionAudioService.ts`, `motionVoiceDirectionService.ts`, `src/constants/motionVoice.ts` và cấu hình kênh giọng.

1. Ghi rõ mẫu đang dùng trên UI và trong snapshot dự án: tên file, dấu vân tay, phiên bản hồ sơ. Dự án mới dùng hồ sơ Thần trùng; dự án cũ có chuyển đổi rõ ràng, không âm thầm dùng lại cache hiệu chỉnh Mèo Đen.
2. Chia mẫu thành đoạn người kể và các vai có thể xác định được; chọn đoạn sạch đại diện câu kể, hội thoại, cảnh căng thẳng. Đo theo từng vai và cửa sổ ngắn. Không dùng đoạn nhạc hoặc trung bình hỗn hợp để đặt tốc độ cho mọi vai.
3. Tách ba vấn đề: tốc độ phát âm trong câu, khoảng nghỉ theo ý và cảm xúc. Hiệu chỉnh giọng TTS trước, chỉ đổi tempo trong giới hạn giữ rõ chữ. Không tăng toàn bản theo tỷ lệ 3,553/2,844.
4. Tính khoảng nghỉ từ dấu câu, mệnh đề, đổi người nói, phản ứng, tiết lộ và đổi chương. Trừ phần im lặng đã có ở đầu/cuối clip, giữ phụ âm đầu/cuối. Bỏ cách ghép khiến mọi biên đều 0,48 giây.
5. So bản thô với bản sau lọc, nén và đổi tốc độ cho cả người kể lẫn nhân vật. Điều chỉnh theo bằng chứng mất chữ; không tăng gain hoặc giảm lọc hàng loạt khi chưa xác định nguyên nhân.
6. Kiểm thiếu/lặp câu, thời lượng bất thường, im lặng, clipping, đoạn nói quá dồn và âm lượng giữa vai. Dùng ASR với ngữ cảnh tên riêng để phát hiện nghi vấn; không coi mọi khác biệt ASR là lỗi phát âm.
7. Lỗi nội dung đã xác nhận phải tạo lại đúng câu theo số lần hữu hạn, giữ các câu đạt. Câu nghi vấn sau retry phải được ghi trạng thái rõ; không gắn nhãn đạt chỉ vì hết lượt. Không thay phụ đề chuẩn bằng văn bản nhận dạng nhầm.
8. Lưu hồ sơ người kể và từng nhân vật độc lập, tránh đổi giọng giữa truyện. Giữ sắc thái vừa phải, không ép mọi câu thành sợ hãi. Thêm trường hợp nam trưởng thành vì test hiện tại chưa có.

Điều kiện hoàn thành: hồ sơ hiệu chỉnh tham chiếu đúng Thần trùng; không mất/lặp lời; khoảng nghỉ phù hợp loại biên; không clipping; các vai đều qua kiểm tra và có đối chiếu nghe A/B trước khi chốt cảm nhận. AI review ảnh tắt không được làm tắt kiểm tra âm thanh độc lập.

### 2. Chốt ý truyện và nhu cầu minh họa trước khi chọn kho

Phạm vi: `motionStoryService.ts`, `motionStoryJobService.ts`, các module story craft/storyboard/visual contract.

1. Bóc riêng tuyến nhân quả, bí ẩn, manh mối, cao trào và kết truyện từ nguồn. Khi viết truyện mới giữ cơ chế gây tò mò và tính hợp lý, thay nhân vật/sự kiện theo yêu cầu, giảm diễn giải dài dòng. Dùng lời Việt gần gũi, nhất quán xưng hô.
2. Tách nhịp lời kể khỏi nhịp hình. Một hình có thể phủ nhiều câu cùng tình huống; đổi hình khi đổi thông tin, phản ứng, người nói hoặc vật trọng tâm. Không bắt mỗi câu mở một cảnh mới, không chia đều theo số giây.
3. Mỗi nhịp hình ghi điều bắt buộc thấy: ai, ở đâu, đứng/ngồi/nằm, quan hệ với ai/đồ nào, vật thuộc ai, trạng thái trước/sau và dẫn chứng từ nguồn.
4. Chi tiết không cần hình có thể kể ngoài hình. Chi tiết cốt lõi được lời kể khẳng định phải có hình thể hiện đúng hoặc bố cục minh họa tương đương đã được duyệt, không tự bỏ vì khó dựng.
5. Kiểm năng lực đúng gói trước khi khóa kịch bản. Chọn cách kể/hình tương đương trong kho khi không đổi sự kiện cốt lõi. Nếu thật sự thiếu khả năng thể hiện chi tiết bắt buộc, phát hiện sớm và liệt kê chính xác; không chờ đến xuất mới lỗi hoặc tạo ảnh ngoài kho.

Điều kiện hoàn thành: truyện có diễn biến rõ; mọi nhu cầu hình bắt buộc ánh xạ được vào năng lực kho; lời đọc và kế hoạch hình dùng cùng phiên bản kịch bản.

### 3. Chọn bố cục tốt trong các phương án cố định hợp lệ

Phạm vi: `packSceneChoices.ts`, `packPlacement.ts`, `spatialPlacement.ts`, `frameContinuity.ts`, `packSelectionContract.ts`.

1. Thay việc lấy ngay bố cục hợp lệ đầu tiên bằng tìm hữu hạn nhiều bố cục khác nhau thực chất. Chấm điểm theo trọng tâm câu, độ rõ mặt/đồ, tiếp xúc, quan hệ vị trí và tính liên tục; nhường event loop, tôn trọng hủy và giới hạn thời gian.
2. Quan hệ bắt buộc vẫn là điều kiện cứng. AI chỉ chọn mã phương án đã kiểm; không sửa tọa độ, tư thế hay tự đề xuất tài nguyên ngoài danh sách.
3. Góc người, nhóm, đồ vật và góc rộng phải phục vụ ý kể. Giữ các vật/người cần nhìn trong khung, giảm khoảng trống vô ích. Không ép tỷ lệ cảnh cận hoặc đổi góc máy vô cớ để đạt chỉ tiêu.
4. Dùng cử chỉ tĩnh có sẵn nếu rõ và dễ dựng. Cử chỉ khó hoặc phụ có thể bỏ qua. Ưu tiên kết quả quan trọng: đồ đã về đúng người nhận, cửa đã mở, người đã nằm xuống; không thêm yêu cầu tiếp xúc tay chỉ để minh họa một động từ.
5. Liên kết trạng thái người/đồ qua các cảnh: cùng định danh, chủ sở hữu, số lượng, vị trí và ánh sáng; hồi tưởng tách trạng thái hiện tại. Kiểm cả vật không được nhắc lại trong câu tiếp theo.
6. Kiểm ngữ nghĩa sau dựng: chi tiết bắt buộc có hiện ra không, đúng người làm không, đồ có ở vị trí kết quả không. Kiểm này chạy bằng dữ liệu dù review ảnh AI tắt; review ảnh là lớp tùy chọn bổ sung.

Điều kiện hoàn thành: vị trí bát, bố cục người/đồ và trạng thái quan trọng có ca hồi quy; thiếu cử chỉ phụ không làm test thất bại. Không phá các quan hệ cửa, giường, mắt và hai bát đã đạt.

### 4. Chuẩn hóa kho cũ và bổ sung đúng các khả năng còn thiếu

Phạm vi: bộ sinh/migration `python_scripts/kit_seed`, catalog và geometry của hai gói.

1. Kiểm toàn bộ tài nguyên cũ: gói, loại, alias Anh/Việt, vai trò, kích thước chuẩn, trạng thái và năng lực tiếp xúc. Phân biệt bản trùng thật với biến thể cần thiết; không gộp hai đồ cùng loại nhưng khác định danh trong truyện.
2. Chuẩn hóa mốc chân, thân, đầu, bàn tay, chỗ ngồi/nằm, mặt bàn, nệm/gối và cửa. Lưu quan hệ theo module nội thất để ghép được, thay vì rải offset sửa riêng từng truyện.
3. Chỉ bổ sung trước trong kho khi thiếu khả năng thể hiện tư thế/vị trí thiết yếu. Dùng hình đứng chân khép, ngồi hoặc nằm có sẵn nếu đã minh họa đúng. Chibi theo ảnh và mẫu Khăn Piêu, đặc biệt tỷ lệ người và chân sát nhau. Không phát triển thêm bộ động tác phức tạp chỉ để khớp từng động từ.
4. Hồn ma dùng danh tính nhân vật tương ứng với xử lý mờ vừa phải khi phù hợp, giữ diện mạo. Hiệu ứng mùi/khói gắn đúng mốc nguồn, không đặt theo tâm khung hình.
5. Migration có sao lưu và ánh xạ ID cũ; preview cả hai gói, kiểm file tồn tại/đọc được, hash, khả năng ghép và dữ liệu trùng. Tài nguyên thiếu chỉ được bổ sung trong bước bảo trì này.

Điều kiện hoàn thành: tài nguyên cũ dùng được theo hợp đồng mới, không lạc gói/ảnh hỏng, các bố cục chuẩn dựng được từ kho mà không vẽ thêm lúc sản xuất.

### 5. Đồng bộ hình, lời, phụ đề và nhịp trình bày

1. Timeline dựa trên voice đã chốt và mã nhịp nguồn ổn định. Chia/gộp clip âm thanh không làm mất liên kết hình; sửa voice chỉ tính lại các đoạn thời gian phụ thuộc.
2. Chỉ nhân vật có lời trực tiếp và đang hiện hình mới có chuyển động miệng. Người kể và lời ngoài hình không làm người trong cảnh mấp máy miệng. Tôn trọng trạng thái nhắm mắt và tư thế độc lập.
3. Minh họa mặc định đứng yên. Loại giật khung hình, hạn chế zoom; nếu bật chuyển động thì biên độ nhỏ, tốc độ chậm, không reset gây nhảy ở đoạn ghép. Chuyển cảnh nhẹ, nhất quán; không chồng quá nhiều hiệu ứng.
4. Phụ đề bỏ nền theo yêu cầu, giữ chữ rõ và chuyển nhẹ. Ngắt theo cụm nghĩa, bám thời gian âm thanh, không lộ lời trước cao trào hoặc chạy từng chữ gây rối. Kiểm dấu tiếng Việt và vùng an toàn.
5. Bản preview và MP4 phải dùng cùng spec, asset và trạng thái. Kiểm ảnh tại biên chuyển cảnh, ngoài ảnh giữa cảnh.

Điều kiện hoàn thành: đúng lời–đúng người–đúng hình trên timeline, không giật/cắt chữ và không đổi tư thế sai khi chuyển câu.

### 6. Hoàn thiện phục hồi, phòng AI và xuất file

Các cơ chế đã có cần kiểm hồi quy trước; chỉ sửa nơi kiểm thử tái hiện được lỗi, không viết lại toàn bộ chỉ vì từng có lỗi cũ.

1. Snapshot bền vững cho từng bước, trạng thái job, lỗi, log và phòng chat. Reload UI không tự chạy lại job cancelled/completed; chỉ resume theo trạng thái và yêu cầu hợp lệ. Log giữ đến lượt tạo video mới.
2. DNA, kịch bản và SEO dùng phiên biên tập chung theo dự án. Các worker dựng hình có phòng riêng và chạy độc lập. Recoverable error reload đúng phòng tối đa hai lần rồi mới mở phòng mới; phân biệt với login, CAPTCHA, giới hạn và từ chối nội dung.
3. Chờ giao diện/model sẵn sàng trước thao tác; không đánh dấu model không khả dụng chỉ vì trang chưa tải. Giữ DeepSeek Standard trước ChatGPT Auto theo cấu hình ưu tiên đã yêu cầu.
4. CAPTCHA lưu tiến độ, báo chờ và phát đúng năm tiếng báo theo sự kiện; không quay vòng đổi phòng/model vô hạn. Xác minh xong tiếp tục đúng tác vụ còn thiếu.
5. Retry hữu hạn theo loại lỗi và phạm vi câu/khung; có timeout, tín hiệu hủy, log nguyên nhân. Cache gắn phiên bản hợp đồng, tài nguyên, giọng mẫu và xử lý âm; làm mới đúng phần phụ thuộc, giữ phần đạt.
6. Kiểm tài nguyên và dung lượng trước render. Giải phóng các tác vụ/tab AI do tool sở hữu khi chuyển sang xuất; không đóng Chrome đang còn tác vụ khác dùng. Render dùng phiên riêng, dọn tài nguyên ở cả nhánh thành công/lỗi/hủy.
7. Ghi file xuất tạm rồi công bố khi hoàn tất. Kiểm stream, thời lượng, tiếng/hình, giải mã và đồng bộ; không báo hoàn thành khi file rỗng/hỏng/thiếu tiếng.

Điều kiện hoàn thành: lỗi ngoài như CAPTCHA, mất đăng nhập, mạng hoặc tiến trình bị ngắt không làm mất phần đã đạt; UI báo đúng trạng thái, có thể tiếp tục, không tự sống lại sau hủy.

## Ma trận kiểm chứng trước bàn giao

| Nhóm | Ca bắt buộc |
| --- | --- |
| Hai gói kho | Tối giản mặt nạ và Chibi màu dân gian; cùng nhu cầu truyện, đúng asset từng gói |
| Vị trí | Người đứng/người nằm; hai người cạnh giường; trước/sau cửa; bên bàn; đổi ngày/đêm; quay lại địa điểm |
| Đồ và hành động | Hai đồ giống nhau; đưa/nhận; dịch vật trên bàn; cầm/đặt; vật giữ qua câu không nhắc lại; nguồn khói/mùi |
| Trạng thái | Nhắm/mở mắt; chỉ tay/im lặng; người kể ngoài hình; hồn ma cùng nhân vật; hồi tưởng |
| Voice | Người kể, nam/nữ trưởng thành, người già, trẻ; tên riêng, số, câu hỏi, câu dài/ngắn; không hội thoại; đổi vai; cao trào |
| Ngoại cảnh/năng lực | Các dạng ngoài nhà, thuyền, trẻ được bế hoặc vật khuất nếu kho hỗ trợ; nếu thiếu thì preflight phải phát hiện đúng |
| AI và phục hồi | Model tải chậm, phản hồi sai schema, refusal, mất login, CAPTCHA, timeout; worker độc lập; hai reload cùng phòng trước phòng mới |
| Lưu trạng thái | Reload UI, restart backend, resume giữa bước, hủy rồi reload; cache mới và cache cũ sau migration |
| Toàn tuyến | Nguồn → DNA → truyện mới → SEO → chọn kho → voice → render; review ảnh tắt và bật; video khoảng hai phút và một video dài hơn |

Mỗi ca phải kiểm đủ sự kiện/quan hệ bắt buộc, không chỉ kiểm “không ném exception”. Kiểm bằng artifact thực từ MP4 cùng báo cáo; có nghe đối chiếu Thần trùng cho phần cảm nhận âm thanh. Không coi test kịch bản dựng sẵn là thay thế toàn tuyến AI biên kịch.

## Thứ tự bàn giao và giới hạn cam kết

1. Chốt đúng mẫu Thần trùng, tiêu chí audio và preflight năng lực; lưu bằng chứng trước/sau.
2. Sửa bố cục, ý hành động và tài nguyên tư thế cần thiết; chạy hồi quy hai gói.
3. Hiệu chỉnh voice từng vai, khoảng nghỉ và kiểm nội dung; khóa bản đạt rồi đồng bộ timeline/phụ đề.
4. Kiểm và sửa phục hồi/phòng AI/xuất file dựa trên ca tái hiện.
5. Chạy toàn tuyến từ nguồn cho nhiều tình huống, kiểm artifact thực và bàn giao báo cáo lỗi đã khép/còn tồn.

Không thể bảo đảm dịch vụ AI bên ngoài không bao giờ lỗi hoặc mọi truyện tương lai đều nằm trong khả năng kho. Tiêu chí là không tái diễn các lớp lỗi đã biết, phát hiện thiếu năng lực trước khi làm nặng, phục hồi có giới hạn và giữ tiến độ; không âm thầm đổi nội dung để báo thành công.

## Tài liệu kiểm đã có

- `scratch/motion-quality-plan-20261024/pace-report.json`: phép đo ba file; chỉ cột Thần trùng là mẫu đích của kế hoạch mới.
- `scratch/motion-quality-plan-20261024/voice-audit.json`, `voice-summary.json`: nhận dạng và thống kê 20 clip; cờ nghi vấn không phải kết luận nghe.
- `scratch/pack-selection-20261024/live-2m/final-board-1.jpg` đến `final-board-4.jpg`: ảnh trích MP4 cuối.
- `docs/motion-live-test-recovery-2026-10-24.md`: các lỗi đã sửa và kiểm chứng lượt test.
