# Ngôn từ kể chuyện tiếng Việt

Đã đọc toàn bộ bản chép lời người dùng cung cấp của “Ván bài định mệnh - Thần Trùng P2”, từ mở đầu tới đoạn kết khoảng phút 27. Nguồn kiểm tra là file đính kèm `C:/Users/Admin/.codex/attachments/feb21382-8127-4d3a-91d2-1030b649e130/Văn bản đã dán.txt`; nhận xét dưới đây dựa trên văn bản, không phải đánh giá âm thanh video.

## Cách dùng lời trong mẫu

- Động từ và đồ dùng quen thuộc: kêu, lượm, dìu, lặt rau, gài nút, chén cháo, túi áo, bậc cửa. Câu cho biết việc gì xảy ra trước khi giải thích cảm xúc.
- Xưng hô theo quan hệ: tôi, vợ tôi, bà ngoại, má vợ, sư, chú tiểu. Các từ vô, kêu, má, bồng, thằng cu tạo sắc thái Nam Bộ của câu chuyện này. Không có nghĩa mọi truyện phải dùng phương ngữ đó.
- Có sinh hoạt gia đình xen vào chuyện lạ: nấu cháo, hỏi món ăn, lo chuyện sinh con, gọi nhau vào ăn cơm. Những việc này gắn với điều nhân vật có thể mất, không chỉ thêm vào để đủ thời lượng.
- Luật siêu nhiên được nhân vật hỏi và đáp bằng lời ngắn, dễ theo dõi. Cái khó nằm ở tình thế và lựa chọn, không nằm ở từ ngữ.
- Câu vừa và ngắn xen nhau. Chỗ nhấn có câu rất ngắn, nhưng vẫn có câu nối để giữ mạch. Không nên bắt chước bằng cách chặt toàn bộ lời kể thành câu rời; điều đó còn làm voice ngắt vụn.
- Chi tiết cũ đổi nghĩa: tên người lúc đầu gắn với nỗi sợ, về sau gắn với việc gọi người thân. Ý nghĩa đi qua việc xảy ra trong truyện, ít cần lời bình trừu tượng.
- Các từ chánh điện, hồi hướng, tam quan, giỗ đầu có vai trò cụ thể trong bối cảnh. Giữ khi cần; làm rõ qua hành động hoặc một câu giải thích ngắn nếu người nghe chưa biết.

Bản chép lời có chỗ cần đọc theo ngữ cảnh: “dỗ đầu” phải là “giỗ đầu”, “sâu chuỗi” phải là “xâu chuỗi”; tên Tỉnh An có đoạn bị ghi thành Tình An. Đây là ví dụ lỗi chép lời, không phải cách viết cần học. Không sao chép lỗi đó vào truyện mới.

## Những câu nên viết khác

Các ví dụ dưới đây tự đặt để minh họa cách diễn đạt, không phải trích truyện do tool đã tạo.

| Câu gượng | Cách nói gần gũi hơn |
|---|---|
| Tôi quyết định tiến hành kiểm tra khu vực phía sau ngôi nhà. | Tôi ra sau nhà xem thử. |
| Nỗi bất an bủa vây tâm trí tôi khi tiếng động ấy một lần nữa vọng tới. | Tiếng động ấy lại vang lên. Tôi bắt đầu thấy lo. |
| Bà yêu cầu tôi tuyệt đối không được phản hồi khi nghe âm thanh gọi tên mình. | Bà dặn: Nghe ai gọi tên thì đừng trả lời, con nhé. |

Không thay từ bằng một bảng máy móc: “phản hồi” có thể hợp trong tài liệu kỹ thuật, “hồi hướng” cần thiết trong cảnh đọc kinh. Câu mới phải giữ đúng người nói, sự kiện, bằng chứng, điều nhân vật biết và điều người nghe chưa được biết.

## Thay đổi trong tool

Bộ hướng dẫn dùng chung nằm ở `src/constants/motionStoryLanguage.ts`. Áp dụng khi ngôn ngữ là tiếng Việt ở phân tích/lập kế hoạch, tạo truyện mới, lập Video DNA, viết từng chương và biên tập. Hồ sơ phong cách cũ thiên về lời cầu kỳ được yêu cầu nhường ưu tiên cho lời Việt rõ nghĩa.

Đã sửa chỉ dẫn giọng kể kỳ truyện để chọn cách xưng hô theo vùng và thời đại, giảm yêu cầu dùng câu cửa miệng hoặc lời báo trước. Biên tập được yêu cầu xem câu dịch máy, đại từ mơ hồ, xưng hô sai và câu bị chặt vụn là vấn đề cần sửa. Không thêm vòng gọi AI, không thêm danh sách từ cấm hay điều kiện dừng dự án mới.

Giữ nguyên cơ chế bảo vệ cảnh và các lượt thoại đã phân vai khi biên tập. Lời thoại của truyện mới nhận hướng dẫn ngay ở bước viết chương. Không tự sửa kịch bản, voice hoặc MP4 đã lưu của dự án đang dừng.

## Kiểm chứng và giới hạn

`npm run test:motion-story-craft` kiểm tra hướng dẫn đi tới bước lập truyện, viết chương và biên tập trong luồng kỳ truyện và truyện thông thường; bản tiếng Anh không nhận quy tắc tiếng Việt. Bài kiểm tra cũng xác nhận sửa lời kể vẫn giữ dữ liệu cảnh và không ghi đè lời thoại đã phân vai.

Đây là thay đổi hướng dẫn cho AI, không phải chứng minh mọi câu AI sinh ra đều tự nhiên. Chưa tạo một truyện dài mới qua AI ngoài để đánh giá toàn bộ văn phong trong lần sửa này.
