# Đối chiếu văn phong Thần trùng — Trùng tang kỳ truyện

## Phạm vi và kết luận

Đọc bản chép lời người dùng cung cấp tại `C:/Users/Admin/.codex/attachments/8198fa59-a9fe-48a2-ab4d-ef44d1d850c4/Văn bản đã dán.txt`, đối chiếu kịch bản Quán Cơm Nửa Đêm Bị Đoạt Hồn và luồng viết. Các phần nguyên nhân bên dưới ghi nhận trước sửa. Sau khi người dùng đồng ý, đã triển khai thay đổi dùng chung cho Kho và Remotion; xem phần kết quả cuối tài liệu. Không viết lại hoặc xuất lại video Quán Cơm trong lượt này.

Tool đã có yêu cầu viết tiếng Việt đời thường và hồ sơ kể ngôi thứ nhất cho `ghost_tale`, nhưng đầu ra hiện tại chưa bám sát nhịp câu, cách đối đáp và mức tiết chế của mẫu. Hồ sơ phong cách tổng quát không đủ để bảo đảm kết quả giống cách kể người dùng mong muốn.

## Khác biệt đo được

Đếm đơn vị cách nhau bằng khoảng trắng có chữ/số, tách câu theo dấu chấm/hỏi/cảm/ba chấm, bỏ timestamp và nhãn âm thanh. Đây là mô tả bản chép lời, không phải ngưỡng QA bắt buộc; dấu câu có thể chịu ảnh hưởng của việc chép lời.

| Chỉ số | Mẫu Trùng tang | Quán Cơm hiện tại |
| --- | ---: | ---: |
| Tổng tiếng theo văn bản | 4.482 | 425 |
| Câu | 511 | 18 |
| Tiếng/câu trung bình | 8,77 | 23,61 |
| Trung vị | 8 | 24 |
| Câu không quá 12 tiếng | 428 (~84%) | 0 |
| Câu trên 20 tiếng | 2 | 18 (100%) |

Quán Cơm có 18 utterance, tất cả đều là `narration`; không có lượt thoại trực tiếp tách riêng cho nhân vật. Mẫu thường dùng những lượt hỏi/đáp rất ngắn để hé lộ điều cấm, tình cảm hoặc hậu quả. Không nên biến tỷ lệ thoại thành quota: đoạn cần đối đáp mới dùng.

## Những đặc điểm cần giữ từ mẫu

1. Người trong cuộc kể lại bằng lời nói thông thường, xưng hô rõ quan hệ; nêu việc mình nhìn/nghe/làm rồi mới nói điều mình nghĩ.
2. Một ý chính trong một câu; nhiều câu ngắn và câu vừa tạo đoạn liền mạch. Câu ngắn để khẳng định, ngập ngừng hoặc đảo ý có chủ đích, không phải lỗi chặt vụn mặc định.
3. Từ ngữ quen thuộc, động từ trực tiếp, từ nối và tiểu từ hợp ngữ cảnh. Không rải từ đệm hoặc phương ngữ vào mọi câu.
4. Lặp lại có chức năng nhấn hoặc tăng cấp, không cấm mọi sự lặp. Cần phân biệt lặp một cấu trúc dẫn tới thông tin mới với kể lại cùng sự việc để kéo dài.
5. Sự đáng sợ nằm ở một chi tiết bình thường sai đi: nơi phát ra tiếng gọi, phản ứng của người thân, vật thay đổi trạng thái. Không liên tục giải thích cảm giác bằng tính từ kinh hãi.
6. Đối thoại ngắn có lời hỏi, lời đáp và khoảng chưa nói hết; không chuyển toàn bộ lời nhân vật thành người kể thuật lại.
7. Nhịp kể co giãn theo điều đáng kể: nén thời gian sinh hoạt, kể rõ chỗ lựa chọn hoặc phát hiện. Kết thúc bằng một việc cụ thể còn tiếp diễn, hạn chế lời kết luận giải nghĩa nỗi sợ.

## Nguyên nhân trong code

- `src/constants/motionFolkStory.ts` (`PROFILE`, `CHAPTER_PROFILE`) đã khóa hồ sơ `vietnamese_folk_recollection_v1`: ngôi tôi, từ đời thường, câu ngắn/vừa, sợ qua chi tiết. Tuy vậy, mô tả còn trừu tượng; chưa mô tả rõ nhịp nhiều câu trong một đoạn, nhấn lặp có dụng ý và đối đáp của mẫu Trùng tang.
- `src/constants/motionStoryLanguage.ts` có các ví dụ câu tự nhiên nhưng bước viết chương gọi `motionStoryLanguageGuide(..., false, true)`, chỉ đưa bản ngắn gọn, không đưa các ví dụ đó. Các ví dụ hiện có cũng là hướng dẫn tiếng Việt chung, chưa thành hồ sơ văn phong riêng của thể loại.
- `modelGuide()` trong `src/server/services/motionStoryService.ts` đưa hợp đồng đề tài/cốt truyện, tín ngưỡng, `modelCraft` và `modelAvoid`. Không có một hồ sơ tham chiếu Trùng tang cụ thể với ví dụ tự viết về cách diễn đạt. Dữ liệu nguồn và điểm mạnh của nguồn thay đổi theo dự án; chưa tách một chuẩn văn phong Trùng tang cố định khỏi nguồn cung cấp đề tài.
- `CHAPTER_LENGTH_RULE` trong `src/constants/motionQa.ts` gợi ý số tiếng trên beat mà chưa phân biệt rõ beat minh họa với câu văn. Không có lệnh bắt mỗi beat đúng một câu; tuy nhiên đầu ra này cho thấy AI đã gom toàn bộ ngân sách mỗi beat vào một câu dài. Một hình hoàn toàn có thể đi cùng nhiều câu ngắn.
- `motionFolkStoryErrors()` chủ yếu kiểm đề tài, bằng chứng và sao chép. Kiểm chương kiểm dữ liệu, nội dung, đúng vai, độ đầy đủ; chưa có tín hiệu mềm phát hiện cả bài chỉ gồm câu dài hoặc dùng nhiều cách diễn đạt không phù hợp phong cách.
- `src/server/services/motionProductionActions.ts` chỉ chạy `editScript` khi `chapters.length > 1`. Quán Cơm chỉ có một chương, 120 giây, nên bị bỏ qua bước biên tập này. Đó là khoảng trống cụ thể của luồng hiện tại.

Hồ sơ đầu ra của dự án ghi đúng `videoGenre: ghost_tale`, profile `vietnamese_folk_recollection_v1`; lỗi không phải do chọn nhầm thể loại. Hai cách dựng Kho và Remotion dùng chung bước viết này.

## Hướng đối ứng đề xuất

1. Nâng hồ sơ `ghost_tale` thành chuẩn văn phong cụ thể bằng tiếng Việt theo các đặc điểm trên. Tách chuẩn diễn đạt khỏi đề tài nguồn: lấy văn phong Trùng tang làm chuẩn ổn định, còn nguồn nào cung cấp đề tài thì giữ đúng đề tài đó. Nguồn trùng tang vẫn viết truyện mới về trùng tang.
2. Đưa vào prompt viết chương một khối ngắn có vài ví dụ tự viết và cặp câu dài → lời kể tự nhiên. Không gửi lại toàn bộ transcript ở mỗi request, không chép câu hoặc chuỗi tình tiết đặc trưng của mẫu.
3. Nêu rõ một beat là một hình/nhịp sự việc, có thể chứa nhiều câu. Không gộp các câu để khớp số beat, không chia thêm cảnh chỉ vì lời kể có nhiều dấu chấm.
4. Giữ các câu ngắn có dụng ý và lặp tăng cấp. Chỉnh quy tắc chống câu vụn/chống lặp để không xóa mất nhịp kể đặc trưng. Giữ quan hệ xưng hô, giọng kể và vị trí thông tin xuyên suốt các chương.
5. Đối thoại đúng cảnh được giữ như lời nói tự nhiên. Không đặt tỷ lệ bắt buộc hoặc thêm một nhân vật chỉ để có thoại.
6. Dùng tự kiểm ngay trong lượt viết; đo độ dài câu và dấu hiệu câu gượng tại chỗ làm cảnh báo mềm. Chỉ biên tập đoạn lệch rõ, không tạo nhiều lượt QA hoặc dừng sản xuất vì không đạt một tỷ lệ câu.
7. Đối ứng cả truyện một chương. Không mặc định thêm một lượt AI cho mọi video; chỉ sửa gọn phần có vấn đề khi có tín hiệu đủ rõ.
8. Kiểm việc giữ văn phong ở viết mới, sửa từng mục, nối chương và biên tập; giữ nguyên lời thoại, sự kiện và speaker khi sửa câu. Không áp hồ sơ truyện ma lên lịch sử/giải thích.

### Ví dụ tự viết dựa trên sự kiện đã có

`Rằm tháng bảy năm đó, quán cơm ở bến đò ế lắm. Thức ăn thừa từ mấy bữa trước đã chua rồi. Anh Khởi tiếc của. Anh không chịu đổ đi. Anh xúc cả ra mâm nhôm, đem cúng.`

Ví dụ chỉ minh họa cách trình bày lại các sự kiện hiện có, chưa phải bản kịch bản được duyệt. Mục tiêu là giữ cách dùng lời, nhịp kể và cách gợi sợ; câu chuyện vẫn mới.

## Đã triển khai

- `motionFolkWriting.ts` trong constants chứa hướng dẫn cố định và ví dụ tự đặt. Khối này đi vào lập truyện mới, viết chương, sửa từng mục, sửa thời lượng và biên tập. Không gửi toàn bộ bản chép lời trong từng request.
- Hồ sơ văn phong ưu tiên cách kể người trong cuộc, từ quen tai, câu ngắn/vừa liền mạch, nhấn lặp có tiến triển và đối đáp đúng cảnh. Đề tài vẫn lấy từ nguồn hiện tại; hợp đồng khóa đề tài và kiểm sao chép vẫn hoạt động. Giữ phiên bản hợp đồng đề tài cũ để không buộc phân tích nguồn lại chỉ vì đổi hướng dẫn diễn đạt.
- Làm rõ một beat/hình/utterance có thể chứa nhiều câu. Không ép mỗi câu một cảnh hoặc câu dài để đủ ngân sách của một beat.
- Kiểm tại chỗ chỉ nhận diện độ lệch rõ trong lời kể tiếng Việt của `ghost_tale`; không kiểm lời thoại nhân vật bằng tỷ lệ câu. Các ngưỡng độ dài câu chỉ dùng chọn đoạn cần đọc lại, không chặn video hoặc bắt viết lại tới khi đạt tỷ lệ.
- Truyện một chương chỉ thêm biên tập khi có dấu hiệu lệch rõ. Truyện nhiều chương giữ lượt biên tập đã có. Sửa tập trung theo ID, giữ cảnh, thứ tự, người nói, role, ID utterance và thông số giọng; đầu ra biên tập không hợp lệ bị bỏ qua. Không bắt thêm nhân vật hoặc quota thoại.
- Loại chỉ dẫn cũ bắt dùng hình tĩnh từ kho trong thể loại dân gian; chọn cách dựng và chuyển động theo cấu hình. Ba prompt dựng SVG không bị sửa trong lượt này.

## Đối chiếu cấu hình trên ảnh người dùng

| Cấu hình | Nơi áp dụng và kết quả kiểm |
| --- | --- |
| Remotion / Kho, Kiểu hình | `motionVisualRequest`, `motionVisualSettingsFor`; cùng dùng bước viết, prompt theo cách dựng được giữ. Văn phong không đổi kiểu hình. |
| Thể loại | Hồ sơ cụ thể chỉ áp dụng `ghost_tale`; không áp lên lịch sử/giải thích. |
| Tiếng Việt / tiếng Anh | Chọn hướng dẫn theo ngôn ngữ đọc; không ép dùng “tôi” hoặc từ tiếng Việt vào đầu ra tiếng Anh. |
| Khoảng 2 phút, số phần | Giữ targetSeconds và phân bổ chương/phần hiện có; không lấy thời lượng dài của nguồn làm thời lượng xuất. Không tăng độ chặt QA thời lượng. |
| Tự viết kịch bản | `autoContinue` điều khiển `analyzeOnly`; thay đổi văn phong không bỏ qua lựa chọn này. |
| Kênh giọng, kiểm tra giọng | Kênh giọng giữ ở request; `asrCheck` độc lập với biên tập chữ. Không bật kiểm tra giọng khi đang tắt. |
| AI duyệt ảnh cảnh | `aiReview` chuyển sang `review` khi dựng cảnh, độc lập với biên tập lời kể. Tắt review ảnh vẫn tắt. |
| Nhịp hình ít/chậm | `visualSettings.pacing` giữ trong request; nhiều câu dùng chung hình, không phát sinh cảnh theo dấu chấm. |
| Chuyển động, hiệu ứng cảnh, camera | `renderBehavior` truyền qua request và chuẩn hóa tại production; văn phong không ghi đè các lựa chọn này. |
| Phụ đề, nhạc, tự xuất | Truyền theo `subtitles`, `musicMood`/`musicVolume`, `autoExport`; không bị hồ sơ văn phong ghi đè. |
| AI nội dung và AI dựng cảnh | Viết/biên tập dùng `aiExecution` nội dung; dựng cảnh dùng `sceneAiExecution`, giữ phân vai hiện tại. |

## Kiểm thử và giới hạn

- `npx tsc --noEmit`: qua.
- `npm run test:motion-story-craft`: qua, gồm kiểm cốt truyện/khóa đề tài và bài mới `verify-motion-folk-writing.ts`.
- `verify-motion-folk-writing.ts`: cả hai cách dựng và hai ngôn ngữ; một request viết chương; sửa từng trường giữ lời đã đạt; sửa thời lượng giữ hướng dẫn; đoạn tự nhiên không thêm request biên tập; đoạn lệch sửa riêng; giữ metadata giọng và số cảnh; đầu ra biên tập rỗng/thiếu không làm mất lời.
- `verify-motion-editorial-policy.ts`: qua; metadata mềm và trạng thái log vẫn hoạt động.
- `verify-motion-production-runner.ts`: qua với AI/TTS/render giả lập; giữ phân vai AI, review ảnh tắt, tiếp tục đúng phần lỗi, lưu tiến độ và hủy.
- `verify-motion-scene-pacing.ts`: các kiểm gom cảnh, timing giọng/phụ đề, cache và đổi cấu hình chạy tới dòng cuối; thất bại ở kỳ vọng log phải có “minh họa tĩnh”. Pipeline hiện có `ensureActorMotion()` bổ sung chuyển động trước khi kiểm kênh thiếu, nên đầu ra không nhất thiết phát cảnh báo tĩnh. Không sửa pipeline hoặc đổi test này trong phạm vi văn phong.
- Không gọi AI thật, TTS thật hoặc tạo video để kiểm thử. Kịch bản và MP4 cũ không tự thay đổi; độ tự nhiên của đầu ra thực tế còn cần nghe lượt tạo tiếp theo, không thể kết luận giống mẫu tuyệt đối từ mock.
- Đã nạp lại backend khi không có production đang chạy: PID 10364, cổng 3002, HTTP 200; production Quán Cơm vẫn `completed`. Log `storage/logs/backend-folk-writing-20261029-150345.log`. Startup vẫn có cảnh báo kết nối visual generator đã tồn tại trước lượt sửa.
