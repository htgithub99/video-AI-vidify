# Kiểm tra video Mâm Cơm Cúng Bưng Vào Hiên

Ngày kiểm tra: 27/10/2026. Chế độ Remotion, kiểu hình truyện ma, profileRevision=1.

## Kết luận

Video xuất thành công nhưng hình minh họa chưa đạt về tỷ lệ, cách gắn người/vật vào bối cảnh và tính liên tục. Nguyên nhân chính nằm ở mô hình bố cục và dữ liệu phân cảnh, không phải thiếu tài nguyên trong kho. Đây là nhánh Remotion tự dựng SVG; kết quả này không chứng minh nhánh sử dụng kho có cùng lỗi.

Không cần thêm diễn hoạt phức tạp. Một ảnh tĩnh đúng người, đúng vật, đúng vị trí và trạng thái là đủ. Việc nhân vật đứng thay vì diễn động tác bưng/mở cửa không được coi là lỗi trong báo cáo này.

## Phạm vi kiểm tra

- File: `storage/output/motion-video/mam-com-cung-bung-vao-hien-16x9-draft-1793078527782.mp4`.
- Xuất lúc 12:22:30 ngày 27/10/2026; dài 118,900 giây; 1280×720; 30 fps; 3567 khung; H.264/AAC.
- Kiểm trực tiếp 17 ảnh đại diện cho đủ 17 cảnh, thêm 6 ảnh hai phía của ba lần cắt cảnh. Đây là lấy mẫu toàn bộ cảnh, không phải xem từng khung hình liên tục.
- Đối chiếu với kịch bản, node/asset SVG đã lưu, timeline giọng và hàm bố trí đang dùng. Chạy lại riêng hàm tính tọa độ để xác nhận nguyên nhân; không gọi AI và không tạo video mới.
- Scene job: `69216e40-c6eb-467b-8a97-74f9674fb29e`; voice job: `a27a1a26-d441-4fad-b631-93fd037bede9`; render job: `cda20f3b-4f20-45f8-aa18-66becebdf340`.
- Chưa nghe trực tiếp âm thanh trong lượt này. Phần âm thanh bên dưới chỉ là kết quả kỹ thuật.

## Lỗi theo thời điểm

| Mốc | Quan sát trên video | Mức ảnh hưởng / nguyên nhân |
| --- | --- | --- |
| 00:00–00:08 | Di ảnh gần cao bằng người đứng bên cạnh; bàn thờ thấp và nhỏ, tỷ lệ không tự nhiên. | Cả di ảnh, cửa, bàn, đèn đều đi qua cùng quy tắc kích thước `prop`. Không có tỷ lệ riêng theo vật và vật đỡ. |
| 00:08–00:18 | Chén gạo muối rất lớn so với bàn. Lời kể phân biệt rắc gạo trước, muối sau nhưng dữ liệu hình yêu cầu một chén trộn gạo và muối. | Lệch cả tỷ lệ lẫn ý nghĩa của đạo cụ. Không cần vẽ động tác rắc, chỉ cần hai vật/phần được phân biệt nếu đây là quy tắc chính của truyện. |
| 00:18–00:26 | Có một cặp cột/khung nhỏ đứng giữa sàn, ngoài các cột đã có trong nền. Nhang cũng lớn so với người. | `node_porch_pillars` là cột đỡ mái nhưng bị xử lý như đạo cụ rời cao 30% khung. Không được gắn vào kiến trúc nền. |
| 00:26–00:32 | Mâm đã đặt trên bàn, chị Hai đứng cạnh: cách giản lược này chấp nhận được. | Không cần diễn động tác bưng/đặt. Tuy nhiên nền và mẫu bàn không được giữ ổn định sang cảnh tiếp. |
| 00:32–00:40 | Có ba chén, khoai và bánh; khói là vài nét mảnh phía trên nhang. Vị trí cửa chính không rõ để đọc được ý khói là đà sát mép cửa. | Vật được vẽ bên trong một SVG mâm tổng hợp; không có quan hệ riêng khói–ngưỡng cửa. Đây là dấu hiệu cần rõ hơn, không phải yêu cầu thêm hoạt hình khói. |
| 00:40–00:47 | Cửa gỗ thành một bộ cửa nhỏ dựng rời trên sàn, không khép lối vào thật. Chén bị nghiêng, gạo muối đã đổ ra. | Node cửa không liên kết với cửa của nền. Dữ liệu tự thêm `tipped, spilled` dù lời kể ở thời điểm này mới nói bỏ quên chén muối. |
| 00:47–00:55 | Nhân vật ngồi có hai bàn chân đặt trên mặt ghế, toàn thân bị nâng lên như đứng trên ghế. | Quan hệ `on` dùng điểm đáy/chân của người đặt lên `surface` của ghế, không dùng điểm tiếp xúc của tư thế ngồi. Đây là lỗi ghép, không phải vấn đề cần diễn hoạt chi tiết hơn. |
| 00:55–01:00 | Giữ mâm trong hiên tối để gợi tiếng động, chưa lộ người lạ. | Cách minh họa tĩnh và trì hoãn lộ diện phù hợp. Nhưng mâm/bàn lại thay mẫu giữa các cảnh. |
| 01:00–01:09 | Người lạ có dáng ngồi thụp, màu tái và áo nâu tối. Mâm ở trên một bàn cao bên trái, không gần tay/miệng người ăn; đường nét tay khá rối. | `beside` chỉ đặt hai hộp cạnh nhau, chưa bảo đảm mâm ở vị trí có thể ăn. Có thể bỏ động tác ăn, giữ người ngồi sát mâm ở đúng độ cao là đủ. |
| 01:09–01:23 | Chị Hai ở góc bếp rồi chuyển sang một căn bếp có cấu trúc/ánh sáng khác; người em mất khỏi khung. | Đổi góc nhìn có thể hợp lệ, nhưng ở đây không có bố cục nền chung hay camera được xác lập để chứng minh đó là cùng góc bếp. Nét mặt trừng trừng còn nhỏ và ít nổi bật. |
| 01:23–01:29 | Hiên buổi sáng có thêm cặp cột nhỏ rời giữa sàn như cảnh 3. | Lỗi phân loại kiến trúc thành đạo cụ tiếp tục lặp lại. |
| 01:29–01:35 | Đang sáng lại trở về nền hiên tối, có mưa như ban đêm. Dấu chân bùn nhỏ, tối, khó đọc thành đường đi qua ngạch cửa. | Cảnh này dùng lại đúng backgroundKey của cảnh 5 ban đêm. Dấu chân là một prop độc lập, không được gắn vào đường đi/cửa của nền. |
| 01:35–01:42 | Ngạch cửa thành một thanh gỗ nằm rời trên sàn; gạo muối chỉ ở một cụm trên thanh gỗ. | Ngưỡng cửa bị tách khỏi kiến trúc nhưng không có cách lắp trở lại. Dấu vết giẫm/vung vãi khắp lối chưa rõ. |
| 01:42–01:47 | Mâm cơm sáng rất lớn, che gần hết ngực và tay chị Hai, nhìn như bàn tròn xuyên qua người. | `heldBy` chỉ gắn đáy mâm vào một điểm tay; mâm không được thu theo bề ngang người/tay. |
| 01:47–01:52 | Di ảnh đặt dưới sàn cạnh chị Hai; bàn thờ biến thành loại treo tường. | Node di ảnh không có `on → altar_table`, nên bị đặt xuống đường chân mặc định. Nền cũng được tạo riêng và thay loại bàn thờ. |
| 01:52–01:59 | Lại trở về bàn thờ chân đứng và bố cục gần như cảnh đầu; mâm cơm sáng biến mất. | Cảnh lời thoại được lập độc lập, không giữ trạng thái của cảnh ngay trước. Mất liên tục ở đoạn kết quan trọng. |

## Nguyên nhân từ code và dữ liệu

### 1. Kích thước chung chưa biểu diễn kích thước thực của từng vật

`src/lib/motionRemotion.ts:51` đặt chiều cao cơ sở nhân vật bằng 48% khung và đạo cụ bằng 30%, có giới hạn bề ngang. Quy tắc này được áp cho cả di ảnh, bát, cột, cửa, bàn và mâm. `scale` cuối hàm chỉ giúp cả cụm nằm gọn trong khung; không sửa tương quan người–vật.

Ví dụ tính lại trên khung logic 1920×1080: cửa cao 324; cột cao 324; chén gạo muối cao 324; mâm cầm tay cao 324 và rộng 456, trong khi hộp nhân vật chị Hai rộng khoảng 254. Đây là tọa độ hợp lệ nhưng tỷ lệ sai nghĩa.

### 2. Điểm gắn có tồn tại nhưng chưa đúng loại tiếp xúc

`src/lib/motionRemotion.ts:67–73` chọn `surface` cho `on`, `grip` cho `heldBy`, rồi lấy `base` của vật/người được đặt để gắn vào đó. Vì vậy:

- Người ngồi có bàn chân chạm mặt ghế thay vì phần ngồi.
- Mâm gắn bằng đáy vào tay dù nhân vật đang có tay buông; mâm che thân.
- Kiểm điểm neo trong 0..1 không chứng minh điểm neo trùng vị trí hữu ích trên hình SVG.

Cần phân biệt gắn vật lên bàn, người ngồi trên ghế và vật được cầm. Không thể dùng một công thức điểm đáy chung cho cả ba.

### 3. Tách lớp kiến trúc nhưng chưa có hợp đồng lắp với nền

Cột hiên, cửa và ngưỡng cửa được đề xuất thành node `prop`. Nền đã có mái/cột/lối vào nhưng không cung cấp socket hay mặt phẳng gắn cho những bộ phận này. Layout chỉ biết trái/giữa/phải và đường chân mặc định.

Bởi vậy yêu cầu “tách nhỏ” chưa đủ: mỗi phần cần biết nó gắn vào chỗ nào, tỷ lệ nào và che trước/sau lớp nào. Với video minh họa, có thể giữ những thành phần kiến trúc không đổi ngay trong nền, chỉ biểu diễn trạng thái cần thay.

### 4. Lập từng nhịp riêng nên mất liên tục địa điểm và thời điểm

`src/server/services/remotion/scenePipeline.ts:180` truyền các câu của beat hiện tại, cast và thông tin place; không truyền một trạng thái cảnh trước đã chuẩn hóa. Phần beat đưa vào prompt cũng không có trường time/weather/shot riêng.

`scenePipeline.ts:202–204` sinh khóa nền từ `scene.environment`. Khi AI đổi mô tả, cùng một địa điểm có thể tạo một nền khác. Lượt này có **16 backgroundKey khác nhau cho 17 cảnh, trên ba place ID**. Không phải mọi góc khác đều sai; vấn đề quan sát được là bàn thờ, cột, cửa, màu sáng/tối đổi mà truyện không yêu cầu.

Cảnh 13 ghi môi trường ban đêm nên dùng lại nền ban đêm cảnh 5, dù câu trước đã xác định trời sáng. Ở đoạn kết, cảnh 15/16/17 cũng không chia sẻ trạng thái mâm và di ảnh.

### 5. Kiểm hợp lệ kỹ thuật chưa chứng minh hình đúng lời kể

`src/server/services/remotion/sceneContract.ts` kiểm schema, cast ID, target, vòng lặp và phủ đủ câu. `evidence` có thể được gán toàn bộ câu nguồn khi trống; nó chưa phải bằng chứng đã kiểm đúng ý nghĩa.

`src/lib/motionRemotion.ts:135` kiểm số hữu hạn, nằm trong khung, có asset và SVG hợp lệ. Các kiểm tra đó vẫn có thể cho cửa nhỏ, người đứng trên ghế hoặc di ảnh dưới sàn đi qua.

Log lưu rõ **review ảnh AI đã tắt**; 17 cảnh đều không có reviewKey; failures rỗng. Tắt review là cấu hình hợp lệ của người dùng. Tuy nhiên hệ thống vẫn cần các quy tắc ghép cơ bản đủ đúng khi review tắt, thay vì trông chờ AI review sửa lại mọi lỗi bố cục.

## Hình thức và chuyển cảnh

- Bảng màu đã thiên xanh xám/nâu tối; các ảnh kiểm tra không còn khung nền trắng quanh đạo cụ như lỗi trước.
- Hình vẫn có cảm giác từng miếng SVG được đặt lên nền: người chủ yếu nhìn chính diện, ánh sáng và tỷ lệ giữa các lớp chưa thống nhất. So với ảnh tham chiếu đã lưu của “ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY”, quan hệ người–nội thất–mặt sàn chưa tự nhiên bằng.
- Màu tối không thay thế việc làm nổi bật dấu hiệu: dấu chân, muối gạo, ánh mắt và vị trí cửa còn khó đọc.
- Renderer `src/remotion/StoryComposition.tsx:10–19` chọn một scene tại mỗi frame, không hòa hai scene. Các ảnh cặp tại 76,2/76,5; 107,2/107,5; 112,1/112,4 giây cho thấy đổi bố cục rất mạnh. Cảm giác nhảy ở đây gắn với đổi nền/người/vật, không có bằng chứng đó là hiệu ứng rung khung.
- Sub ở ảnh kiểm tra không có nền, không tràn khỏi khung. Chưa xác nhận khớp từng chữ với tiếng đọc: `buildSubtitles` chia thời lượng theo số đơn vị chữ, không phải căn chỉnh phát âm thực tế.

## Âm thanh: chỉ kết quả kỹ thuật

- Đo từ MP4 cuối: **-14,0 LUFS; true peak -0,9 dBFS; LRA 1,9 LU**. Không thấy đỉnh vượt 0 dBFS qua phép đo này.
- Có 17 clip giọng; cả 17 lưu `quality.status=unchecked`. Không thể dùng trạng thái hoàn thành để kết luận giọng đã rõ chữ.
- Nhân vật kể dùng `custom-thantrung-narrator-v2-20261025`; câu chị Hai dùng `Quỳnh Anh`. Phân vai được lưu đúng theo narrator/dialogue.
- Đo tốc độ ghi trong log: cả khoảng nghỉ khoảng 3,44 đơn vị/giây. Đây không phải kết quả nghe đánh giá độ rõ chữ, cảm xúc hoặc mức giống file mẫu Thần trùng.
- Cần nghe riêng để kết luận về phụ âm, ngắt nhịp, tiếng nền lấn giọng và giọng câu kết; báo cáo này chưa xác nhận các mặt đó.

## Hướng sửa chung nên ưu tiên

1. Giữ một cấu trúc nền/các mặt phẳng đặt vật theo địa điểm; sáng/tối là trạng thái, góc máy phải có ánh xạ. Không tạo lại cấu trúc nhà chỉ vì cách viết environment khác.
2. Phân loại kiến trúc, đồ nội thất, vật cầm, vật đặt, dấu vết và hiệu ứng; chọn tỷ lệ theo vai trò và vật/người liên quan. Không dùng một chiều cao cho mọi prop.
3. Phân biệt quan hệ ngồi trên, đặt lên, cầm và nằm trên sàn. Nếu chưa dựng đúng được tư thế khó, dùng đứng cạnh đúng chỗ; không tạo hình ghép sai vật lý.
4. Giữ sổ trạng thái ngắn giữa các cảnh: thời điểm, người/vật đang hiện diện, vị trí, vật còn đầy/rỗng, cửa mở/khép và dấu vết đã xuất hiện. Không tự thêm việc đổ/vãi hoặc làm biến mất mâm.
5. Kiểm nhẹ nhưng có mục tiêu cho lỗi ảnh hưởng nghĩa: tỷ lệ cửa/cột với người, điểm tiếp xúc, vật cần nằm trên bàn, dấu hiệu chính và liên tục sáng/tối. Sửa cục bộ cảnh/quan hệ sai; không bắt chặt mọi động tác phụ, không viết lại cả truyện.

## Bằng chứng

- [Bảng cảnh 1–6](board-1.jpg)
- [Bảng cảnh 7–12](board-2.jpg)
- [Bảng cảnh 13–17](board-3.jpg)
- [Ba lần đổi bố cục](continuity-cuts.jpg)
- [Sáu lỗi điển hình](key-issues.jpg)
- [Timeline và dữ liệu cảnh](timeline.json)
- [Tọa độ tính lại bằng hàm layout hiện tại](layout.json)

Lượt này chỉ phân tích và tạo tài liệu bằng chứng; chưa sửa code sản xuất, chưa khởi động lại backend, chưa chạy tạo video mới.
