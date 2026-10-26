# Kiểm tra video Người Đứng Ngoài Sân

Ngày kiểm tra: 26/10/2026. Kết luận: xuất file thành công, nhưng nội dung hình minh họa chưa đạt.

## Phạm vi và bằng chứng

- Video: `storage/output/motion-video/nguoi-dung-ngoai-san-16x9-draft-1793022601593.mp4`.
- Xuất lúc 20:50:44, dài 211,97 giây, 1280×720, 30 fps, gói Tối giản mặt nạ.
- Kiểm 42 ảnh lấy mẫu xuyên suốt video, thêm 6 ảnh đúng thời điểm, đối chiếu lời kể/kịch bản, dữ liệu phân cảnh đã lưu và code renderer. Đây không phải kiểm từng khung hình.
- Dữ liệu: job dựng cảnh `3f3e896e-e0e0-45c4-8e47-0790f511d46a`, job render `adbb0a23-d8d2-4f90-a96c-dd5eb12a2d0b`.
- Chưa thẩm định giọng bằng nghe trực tiếp trong lượt này vì công cụ hiện tại không nhận được âm thanh đầu vào. Các số liệu giọng bên dưới chỉ là kiểm tra kỹ thuật.

## Các lỗi nhìn thấy

| Thời điểm | Hình và lời kể | Nguyên nhân xác định được |
| --- | --- | --- |
| 00:02–00:05 | Chị Hai bị cắt ở mép phải. | Frame đã khóa bố cục vẫn có actor x=0.9724, k=0.998. Khóa tọa độ chưa đồng nghĩa nằm trọn khung hình. |
| 00:52–00:58 | Lời kể cháu đụng bàn làm muối gạo văng; cháu đứng cạnh nhà, xa bàn, hình còn là chiếc đĩa. | Minh họa chưa thể hiện kết quả quan trọng là gạo muối rơi ở ngưỡng cửa. Có thể bỏ động tác đụng bàn, nhưng cần giữ đúng dấu vết và vị trí. |
| 01:02–01:17 | Khói nhang bò sát đất là điềm chính nhưng ảnh gần như giữ nguyên người và bàn. | Chưa có nguồn hiệu ứng/vị trí khói đủ rõ trong frame. Cuối video cũng mất lớp khói dù READ yêu cầu smoke. |
| Khoảng 01:44–01:55 và 02:13–02:20 | Lời kể mở cửa hoặc cửa khép hờ; hình vẫn là cửa đóng. | Dữ liệu đọc cảnh lưu fixtureStates rỗng, trạng thái cửa chưa được truyền thành yêu cầu hình. Không cần diễn mở cửa; chỉ cần ảnh trạng thái đúng. |
| 02:22, 02:27, 02:37 | Chồng hai bóng người, giường và cửa khi chuyển giữa bố cục. | Cùng phòng nhưng actor/camera đổi vị trí, sau đó hòa toàn khung hình. Renderer đang fade cùng bối cảnh 1,2 giây, có giới hạn theo độ dài frame. |
| 03:07–03:13 | Đang giải thích vệt muối gạo ở ngưỡng cửa nhưng ảnh phóng một then cửa lớn. | READ gán từ “ngưỡng cửa” sang wooden_door_latch; gạo muối còn mang catalogKey ritual_rice_salt_plate. Có tài nguyên không có nghĩa đã chọn đúng nghĩa và trạng thái. |
| 03:22–03:31 | Lời kể ba bóng người nhưng hình chỉ có một bóng. | READ có who=[]; frame actors=[], overlays=[ghost]. Hiệu ứng ghost chỉ vẽ một nhân vật ma đầu tiên trong kit. Số lượng và danh tính đã mất trước renderer. |

![Sáu thời điểm cần sửa](key-issues.jpg)

## Vấn đề xuyên suốt

1. **Không giữ cùng một nơi ổn định.** “Nhà tôi” ban ngày và “Sân trước” ban đêm được chọn thành hai set khác nhau, nhìn thành hai kiến trúc khác nhau dù cùng câu chuyện. Đổi sáng/tối nên giữ nguyên nền và cấu trúc của địa điểm.
2. **Nhiều câu tạo lại một bố cục gần giống nhau.** Có 24 nhịp truyện nhưng 31 unit/31 group. Giữ một hình cho nhiều câu là phù hợp phong cách minh họa; lỗi là vừa lặp hình ít thông tin vừa đổi vị trí khi chưa cần, còn các dấu hiệu quan trọng lại không được thể hiện.
3. **Kết truyện thiếu cầu nối nhân quả.** Kịch bản có một kẻ giả Chị Hai rồi nhảy tới cả ba người đổi tính và ba hồn lạc. Đứa cháu gần như vắng ở đoạn giữa. Chưa có diễn biến đủ rõ dẫn tới việc cả ba đều bị chiếm chỗ.

## Đường code liên quan

- `src/lib/motionPuppetAssets.ts:14`: khớp danh từ theo alias chính xác; nếu không thuộc nhóm đã biết thì puppetObjectNounFits trả true. Trường hợp “ngưỡng cửa” lọt qua khi catalogKey là then cửa cho thấy cần kiểm nghĩa, loại đối tượng và cách gắn trong cảnh.
- `src/server/services/puppet/frameContinuity.ts:18`: continuity dùng visual.scene; khi AI đổi scene ID dù vẫn cùng phòng thì previous bị xóa. Đây là điều kiện làm mất giữ vị trí, không phải bằng chứng rằng mọi thay đổi camera đều sai.
- `motion-engine/texts.js:46`, `motion-engine/puppet2d.js:1426`: hòa hai khung toàn cảnh tạo bóng chồng khi vị trí khác nhau.
- `motion-engine/puppet2d.js:1254`: drawGhostPeek chọn một ghost đầu tiên, không biểu diễn số lượng ba người hay danh tính cụ thể.
- Job báo missing=0 và visualIssues={} nhưng các ảnh trên vẫn sai. QA hiện có kiểm được tài nguyên tồn tại/bố cục hợp lệ ở một số mặt, chưa chứng minh hình khớp toàn bộ ý nghĩa lời kể.

## Âm thanh: kết quả kỹ thuật

- Giọng dài 211,961 giây, khớp thời lượng video 211,967 giây.
- Toàn video -14,0 LUFS, true peak -0,8 dBFS; chưa thấy bằng chứng clipping từ phép đo này.
- 28 clip giọng đều lưu quality.status=unchecked; chưa có xác nhận độ rõ chữ bằng QA giọng.
- Câu “Chị Hai mới về đó hả chị?” khoảng 4,23 đơn vị cách trắng/giây; “Em ơi, mở cửa cho chị!” khoảng 2,82; “Sao nhà cửa tối om…” khoảng 3,49. Đây là tốc độ thô của từng clip, không đủ để kết luận chất giọng hoặc độ rõ chữ.

## Ưu tiên xử lý chung cho các video sau

1. Giữ đúng thực thể, số lượng, quan hệ không gian và dấu vết quan trọng khi đổi từ lời kể sang READ/frame. Kiểm và sửa cục bộ mục sai.
2. Tách đặc điểm của nền như cửa/ngưỡng cửa khỏi đạo cụ rời; trạng thái mở/đóng và vãi/đựng trong đĩa phải có biểu diễn riêng.
3. Giữ một cấu trúc nền và vị trí theo địa điểm thực; chỉ thay khi đổi nơi hoặc có lý do trong truyện.
4. Giữ hình cho nhiều câu liên quan; tránh hòa hai bố cục khác nhau gây nhân đôi người. Không cần thêm động tác phức tạp.
5. QA kết quả minh họa tập trung các mục ảnh hưởng nghĩa truyện: người nào, bao nhiêu người, ở đâu, cạnh vật nào, dấu hiệu chính có xuất hiện không. Tư thế phụ có thể đơn giản hóa.
6. Kiểm cầu nối nhân quả của đoạn kết và nghe nghiệm thu giọng trước khi kết luận chất lượng tổng thể.

## Bổ sung theo phản hồi: ngoại hình ma, màu cảnh và tỷ lệ nhân vật

Đối chiếu trực tiếp lại bảng `Chiếc khăn Piêu`, nhất là các mốc #228–#237 (24:42–26:03) và bảng placement-examples. Yêu cầu: minh họa đơn giản, đúng nội dung lời kể, có không khí truyện ma; không tăng độ phức tạp động tác.

### Sai khác và nguyên nhân

- Bóng ma trong video hiện tại vẫn dùng tài nguyên Village Market Woman với thân nâu #916c50 giống Chị Hai. `drawGhost` chỉ vẽ lại nhân vật rồi áp alpha=0.55 và blur; không có bước chuyển ngoại hình theo lời kể. Overlay ghost còn dùng expr=neutral. Bởi vậy người xem chủ yếu thấy một người bình thường trong suốt.
- Prompt `MOTION_EFFECTS.GHOST` hiện yêu cầu giữ normal face/hair/clothes/colors và cấm monster face. Quy tắc giữ danh tính là cần thiết, nhưng viết tuyệt đối như vậy làm thiếu ngoại lệ cho các đặc điểm siêu nhiên được lời kể xác nhận. Không nên để yêu cầu giữ danh tính xóa màu/trạng thái được mô tả rõ.
- Trong kịch bản đã lưu, câu “trắng bệch” nói về gương mặt, sau đó có “hình nhân xám ngoét”. Cần bảo toàn cả bộ phận được mô tả và thứ tự biến đổi. Nếu một truyện khác nói áo trắng/toàn bóng trắng thì biến thể phải thể hiện đúng áo/toàn bóng; không dùng một lớp mờ chung cho mọi trường hợp.
- Mẫu #233–#236 có khối tóc/thân tối, mặt sáng nổi bật, mắt và dáng khác người sống, đặt gần bếp trong phòng tối. Đây là ví dụ hình minh họa tĩnh đã tạo được cảm giác bất an; không cần diễn động tác chi tiết hay thêm hiệu ứng giật.
- Màu tổng thể mẫu thiên nâu gỗ trầm và nguồn sáng cục bộ; cảnh tối vẫn tách được mặt, người nằm và nồi. Video hiện tại có sân sáng nhạt, còn trong phòng phủ xanh đen khá đều. Chỉ giảm sáng toàn video sẽ làm khó đọc hình mà chưa tạo được không khí tương tự.
- Tỷ lệ phải xét theo góc. Mẫu có toàn cảnh người nhỏ trong không gian, trung cảnh thấy quan hệ, cận cảnh thấy mặt/dấu hiệu. Không dùng một kích thước nhân vật chung hoặc lấy gói Tối giản mặt nạ để kết luận hình dáng Chibi đã khớp mẫu.

### Các mục cần xử lý chung

1. Giữ danh tính gốc nhưng cho phép biến thể có sẵn trong kho cho màu mặt/áo/thân, vẻ tái, ánh mắt, tóc và dáng khi lời kể có bằng chứng. Màu chỉ đổi trên bộ phận được mô tả; giữ trạng thái qua các hình kế tiếp cho tới khi truyện cho đổi. Không tự vẽ thêm khi chạy production.
2. Phân biệt ma giả người đang che giấu với lúc đã lộ hình; không cho mọi ma mang mặt trung tính và cùng độ trong suốt ngay từ đầu. Ưu tiên hình tĩnh, hình khối và tương phản; không tự thêm máu, răng nanh hoặc vẻ hài hước.
3. Có thiết lập màu theo gói và thời điểm: nền trầm hơn, giảm màu chói, tối vùng không quan trọng; giữ rõ mặt/vật đầu mối và nguồn sáng hợp lý. Giữ cùng nền khi chuyển ngày/đêm.
4. Dùng bố cục theo toàn/trung/cận từ ảnh mẫu để chuẩn hóa chiều cao nhân vật trong khung, phần thân nhìn thấy, khoảng cách và tỷ lệ người–cửa–giường–bàn. Dáng đứng/ngồi có thể thay bằng tư thế đơn giản khi không ảnh hưởng nghĩa; màu, danh tính, số lượng và vị trí được lời kể nhấn mạnh phải đúng.
5. Nghiệm thu bằng bảng ảnh so sánh cùng loại góc và cùng loại sáng với mẫu; kiểm cảnh đứng, hai người, cạnh cửa, cạnh giường, ma lộ hình. Không xác nhận “giống mẫu” chỉ từ kích thước SVG hoặc kiểm tra render không lỗi.

Phần này ghi yêu cầu tại thời điểm audit. Sau đó đã triển khai ngoại hình theo bằng chứng, màu nền trầm và lấy khung theo gói; xem [báo cáo đối ứng](../../motion-horror-appearance-fix-2026-10-26.md) và [36 ảnh kiểm](../horror-appearance-fix-20261026/index.html). Chưa tạo MP4 mới hoặc đóng các lỗi khác trong audit.

## Phân biệt với bản sửa kho mới

Video xuất lúc 20:50:44; pointer kho modular-v3-reference-20261026 được ghi lúc 22:20:17. Video này chưa chứng minh chất lượng đầu ra của kho vừa cập nhật. Guard biên nhân vật mới đã có kiểm tra riêng, nhưng chưa render lại video để xác nhận hết cắt mép. Các lỗi chọn nghĩa, số lượng, giữ địa điểm và chuyển cảnh nêu trên vẫn cần được đối chiếu/xử lý riêng; thêm tài nguyên không tự sửa được chúng.

Lượt này chỉ kiểm tra và tạo báo cáo, không sửa production code, không chạy lại video.

## Bảng ảnh toàn tuyến

![00:02–00:57](board-1.jpg)
![01:02–01:57](board-2.jpg)
![02:02–02:57](board-3.jpg)
![03:02–03:27](board-4.jpg)
