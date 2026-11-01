# Ghi chú các thay đổi về mở rộng nội dung và thời lượng

> Cập nhật 01/11/2026: theo yêu cầu người dùng, phần mở rộng thời lượng và thay đổi profile POV đi kèm đã được hoàn tác. Tài liệu bên dưới ghi nhận lịch sử trước khi hoàn tác, không còn mô tả cấu hình đang chạy. Các sửa lỗi độc lập về JSON, số lượng và nhận diện sự kiện lên ngôi được giữ lại. Chi tiết: `docs/motion-writing-duration-rollback-2026-11-01.md`.

Ngày ghi: 01/11/2026. Trạng thái: ghi nhận code hiện tại sau lượt test POV và Câu hỏi lớn; chưa sửa tiếp các lỗi phát hiện trong lượt test đó.

## 1. Yêu cầu đã thống nhất

- Thời lượng người dùng chọn là định hướng biên tập, không cần khớp chính xác.
- Ví dụ 8–12 phút khi chọn 10 phút chỉ là minh họa, không phải khoảng giới hạn được cài vào code.
- Khi nguồn ngắn, AI khai thác sâu hơn ngay trong lượt phân tích và viết đang có, theo đúng thể loại được chọn.
- Chấp nhận thời lượng tự nhiên khi hết nội dung có giá trị; không độn câu, kể lại sự kiện, bịa dữ kiện hoặc kéo giãn âm thanh.
- Không thêm request chỉ để đạt thời lượng. Request sửa lỗi cấu trúc/nội dung và request phục hồi khi AI lỗi vẫn có thể phát sinh.

## 2. Các thay đổi trực tiếp cho hướng mở rộng thời lượng

| File | Phần đã thay đổi | Tác động |
| --- | --- | --- |
| `src/constants/motionWriting.ts` | Tăng `REVISION` từ 5 lên 6; thêm `DEVELOPMENT.DURATION`, `DEVELOPMENT.COMMON` và `DEVELOPMENT.GENRE`. | Đưa mục tiêu thời lượng vào phân tích như định hướng; yêu cầu phát triển chiều sâu có căn cứ trong cùng lượt, giữ qualifier và phân biệt dữ kiện với suy luận. |
| `src/lib/motionWriting.ts` | Thêm `motionWritingDevelopmentPrompt`; đưa phần hướng dẫn chung và riêng thể loại vào `motionWritingChapterPrompt`. | Lượt viết chương nhận hướng phát triển tương ứng thể loại đã chọn. |
| `src/features/motion/server/services/motionStoryService.ts` | Gắn hướng dẫn phát triển vào yêu cầu phân tích và yêu cầu biên tập; phân tích nhận cả thời lượng người dùng chọn lẫn thời lượng dùng để lập kế hoạch. | Áp dụng xuyên phân tích → viết chương → biên tập; biên tập giữ chiều sâu hợp lệ thay vì tự rút ngắn hoặc kéo dài. |
| `src/constants/motionQa.ts` | Thay `CHAPTER_LENGTH_RULE`: bỏ chỉ tiêu tổng số từ và từ mỗi beat khỏi lời nhắc đang dùng; thay bằng thời lượng/hình đại diện mang tính gợi ý. | Một hình có thể đi với nhiều câu có ích; không bắt buộc đủ từ hoặc giới hạn lời dẫn theo số từ. `LEGACY_CHAPTER_LENGTH_RULE` vẫn còn cho việc nhận diện dữ liệu/prompt cũ tương thích. |
| `src/constants/motionStoryTimeline.ts` | Đổi `CONTENT.RULE` từ “nguồn chỉ đủ khoảng N beat” sang gợi ý N hình đại diện, không phải trần lời dẫn; cập nhật log tương ứng. | Nguồn ngắn vẫn có thể được giải thích sâu qua quan hệ nguyên nhân, giới hạn và hệ quả; kết thúc tự nhiên. |

### Hướng phát triển riêng từng thể loại

- **POV:** quan sát → giới hạn tức thời → hiểu thận trọng → phản ứng nhỏ → điều thay đổi; không ép đủ năm bước ở mọi câu.
- **Nhân chứng (`witness`):** điều nhớ đã thấy, hiểu biết có giới hạn lúc đó và hệ quả; tách ký ức khỏi kiến thức biết sau này.
- **Biên niên (`chronicle`):** trình tự, bối cảnh liên quan, nguyên nhân và trạng thái mới sau mỗi bước ngoặt.
- **Câu hỏi lớn (`verdict`):** cùng câu hỏi/tiêu chí cho từng ứng viên; chứng cứ mạnh nhất, cơ chế, giới hạn và phán quyết có căn cứ; phân biệt điều kiện hỗ trợ với nguyên nhân quyết định.

Đây là mở rộng cách khai thác nguồn được cung cấp, không phải tự tìm thêm nguồn ngoài.

## 3. Thay đổi riêng POV thực hiện cùng đợt

Đây là thay đổi về phong cách và ranh giới hư cấu, có thể ảnh hưởng độ dài và cảm xúc của bài, không chỉ là điều chỉnh thời lượng.

| File | Phần đã sửa |
| --- | --- |
| `src/constants/motionPovStory.ts` | Viết lại profile, kế hoạch, ví dụ và quy tắc kiểm tra: giữ ngôi thứ hai/hiện tại/góc nhìn giới hạn; bỏ yêu cầu bắt buộc bịa tuổi, quê, người thân, ít nhất hai đồng đội, kỷ vật, mất mát và đoạn nhiều năm sau. Các yếu tố này chỉ dùng khi nguồn/brief cho phép. Thêm hướng phát triển trải nghiệm. |
| `src/constants/motionGenre.ts` | Khi tạo chỉ dẫn POV, truyền cờ cho phép bỏ stage không phù hợp và không bắt buộc motif. |
| `src/constants/motionGenreStage.ts` | Thêm tham số tùy chọn cho stage/motif; POV cho phép 0–6 motif. Quy tắc nối số phận nhân vật không được tự bịa cái chết, chia tay hoặc đoàn tụ khi nguồn không có. |
| `src/constants/motionGenreReview.ts` | Bỏ kiểm tra bắt buộc POV phải có countdown ở đoạn thử thách (`ordeal`). Các kiểm tra khác vẫn còn. |

Lưu ý: nếu đã chọn motif, cơ chế giữ motif và nhắc lại ở câu cuối vẫn tồn tại. Đó là một điểm có thể dẫn đến câu kết gượng, như lượt test mới đã cho thấy.

## 4. Sửa liên quan được ghi riêng, không phải cơ chế tăng thời lượng

| File | Phần đã sửa |
| --- | --- |
| `src/lib/motionWritingNumbers.ts` | Nhận diện cách viết số như “a thousand”/“an …” để phát hiện số lượng không có trong nguồn. |
| `src/constants/motionStoryTimeline.ts` | Thu hẹp mẫu nhận diện sự kiện lên ngôi: nhắc tới “throne” chưa đủ để coi là đã lên ngôi. Tránh nhầm việc ủng hộ quyền kế vị với kết quả đăng quang. |
| `src/lib/motionChapterRepair.ts` | Đưa `scenePlan` có mặt trong phản hồi vào kiểm tra schema, thay vì loại khỏi phần kiểm tra. |
| `src/lib/motionEditorialMetadata.ts` | Chuẩn hóa trường `scenePlan.acceptance` dạng chuỗi hợp lệ thành mảng một phần tử; giữ kiểm tra cho dữ liệu sai khác. |
| `scripts/verify-motion-writing-development.ts` | Thêm kiểm tra offline cho prompt phát triển của bốn thể loại; bản ngắn/dài không gọi sửa chỉ vì thời lượng; sửa tập trung `scenePlan`; chuẩn hóa metadata; số lượng ngoài nguồn và sự kiện chính trị khác nhau. |

Test offline xác nhận cách truyền prompt và hành vi code với phản hồi giả lập; không chứng minh chất lượng bài do AI thật viết.

## 5. Phần không được thay đổi thành cơ chế mới trong đợt này

- Không đặt khoảng chấp nhận cố định 8–12 phút.
- Không thêm một lượt AI chuyên viết dài thêm chỉ vì bài ngắn.
- Không bảo đảm bài luôn đạt thời lượng đã chọn.
- Không thay đổi tốc độ giọng hoặc kéo giãn video để bù thời lượng.
- Không thay đổi công thức chia số chương trong `motionWritingChapterCount` cho hướng mở rộng này.
- Không thay profile riêng của Câu hỏi lớn trong `motionVerdictStory.ts`; thể loại này nhận thêm hướng phát triển qua phần dùng chung.

## 6. Kết quả test thật sau thay đổi

Nguồn chung: transcript tiếng Việt của video tái hiện trận sông Nile bằng Total War. Viết tiếng Anh, chọn 5 phút, Gemini Flash `gemini-flash::medium`, room-only, không fallback, có biên tập tự động.

| Thể loại | Kết quả cuối | Đánh giá |
| --- | --- | --- |
| POV | 2 chương, 24 beat, 502 từ; ước tính 138 giây theo 3,633 từ/giây. | Chưa phát triển chiều sâu đủ tốt; còn kể toàn tri và dữ kiện vượt nguồn dù QA=0. |
| Câu hỏi lớn | 4 chương, 41 beat, 1.029 từ; ước tính 283 giây. | Đúng khung thể loại hơn, nhưng còn tự đổi ngày tháng, thêm số đo và nhãn recap mâu thuẫn với nhãn ứng viên dù QA=0. |

Chưa tạo giọng hoặc MP4, nên các thời lượng trên chỉ là ước tính.

POV ghi nhận 15 lượt theo bộ đếm tool, trong đó báo cáo biên tập ghi 8 yêu cầu edit. Câu hỏi lớn ghi nhận 6 lượt trước khi backend bị ngắt và 2 lượt khi viết tiếp, trong đó 1 yêu cầu edit. Prompt dài còn gửi nhiều tin nhắn ngữ cảnh, nên đây không phải số tin nhắn Gemini. Không có bảo đảm “một pass biên tập = một request”.

Lượt Câu hỏi lớn bị gián đoạn do backend khởi động lại, sau đó hoàn tất bằng chức năng viết tiếp từ 32 beat đã lưu. Nguyên nhân backend khởi động lại chưa được xác định trong bài test.

## 7. Giới hạn kết luận

- Việc bỏ chỉ tiêu từ và giảm cấu trúc POV bắt buộc là các thay đổi có thể ảnh hưởng độ dài. Chưa có thử A/B kiểm soát để lượng hóa ảnh hưởng riêng của từng thay đổi.
- Bịa chi tiết đã xuất hiện ở bản test trước. Bản được đánh giá tốt trước đó đã trải qua các yêu cầu sửa tập trung sau khi đọc; không phải bằng chứng luồng tự động cũ luôn tốt hơn.
- QA hiện chưa kiểm chứng đầy đủ ý nghĩa từng mệnh đề, ngày tháng giữa chương, khả năng quan sát của nhân vật hoặc nhãn phán quyết ở phần tổng kết.
- Bản sửa hiện tại chưa đạt mục tiêu chất lượng. Không dùng QA=0 làm kết luận bài đã đúng nguồn.

## 8. Bằng chứng đã lưu

- Báo cáo test và nguyên đầu ra: `scratch/writing-pov-verdict-5min-20261101/index.html`.
- Mã băm các file sản phẩm khi bắt đầu test: `scratch/writing-pov-verdict-5min-20261101/code-snapshot.json`.
- Đánh giá thủ công: `pov-manual-review.json`, `verdict-manual-review.json` trong cùng thư mục test.
- Các nguyên nhân và hướng xử lý còn tồn tại: `root-findings.json` trong cùng thư mục test.
- Đánh giá sửa tập trung của lần test trước: `scratch/motion-writing-live-20261101/pov-manual-review.json` và `verdict-manual-review.json`.

Ghi chú này chỉ bổ sung tài liệu, không sửa hành vi code hoặc khởi động lại backend.
