# Kiểm từng cảnh: Tro cúng trước cửa — 27/10/2026

## Phạm vi và giới hạn

- Lượt mới nhất: production `67db8d3633f8370955e89404f2ba33fd`, chế độ Remotion, kiểu hình truyện ma.
- Đọc script và ảnh SVG từ job `dc89a35e-561d-40d1-883f-428a95b55ed8`.
- 18 đoạn lời kể, chia thành 21 phân cảnh. Đã tái dựng và xem trực tiếp 18 ảnh bằng renderer Remotion hiện tại; 3 phân cảnh chưa có đủ ảnh chỉ được kiểm tra dữ liệu.
- Đây là ảnh xem trước tái dựng sau sửa hình học, không phải khung hình trích từ một video đã xuất. Lượt này chưa có video hoàn chỉnh.
- Không gọi AI, tạo voice, tạo video hay sửa code ứng dụng trong lượt phân tích này. Không thay dữ liệu sản xuất đã lưu.
- Kết quả 18/18 ở lượt sửa trước xác nhận qua kiểm tra hình học. Các ảnh dưới cho thấy vẫn có lỗi về nội dung, vị trí, che khuất và tỷ lệ.

## Xem ảnh

[Toàn bộ cảnh và lời kể](../scratch/remotion-scene-audit-20261027/index.html)

[Bảng ảnh 1](../scratch/remotion-scene-audit-20261027/board-1.jpg) · [Bảng ảnh 2](../scratch/remotion-scene-audit-20261027/board-2.jpg) · [Bảng ảnh 3](../scratch/remotion-scene-audit-20261027/board-3.jpg) · [Bảng ảnh 4](../scratch/remotion-scene-audit-20261027/board-4.jpg)

[Kiểm riêng đồ vật và điểm đặt](../scratch/remotion-scene-audit-20261027/assets-1.jpg) · [Kiểm riêng nhân vật và cửa](../scratch/remotion-scene-audit-20261027/assets-2.jpg)

## Từng cảnh

### 01-1 — Đổ tro trước cửa

Lời kể: “Tôi đổ tro cúng ra lối đi trước cửa, và đêm đó trong nhà tôi có người nói giọng không phải của mình.”

- Ảnh: cổng thành thanh ngang dài trên tường; người kể đứng sau bàn, tay có chổi; vệt tro nhạt ở giữa sân, không thể hiện rõ đường từ bàn ra cửa.
- Gốc lỗi: cổng gắn `mount: wall` nhận toàn vùng tường. Vệt tro được đặt giữa sàn, chưa có điểm đầu/cuối gắn với bàn và cửa. Chổi đã nằm trong ảnh nhân vật gốc, đồng thời phân cảnh còn tạo một node chổi riêng.
- Minh họa đủ: người kể cạnh lối đi, vệt tro rõ trước cửa, bàn cúng lệch trái, một cổng có kích thước hợp lý. Không cần vẽ động tác đổ tro.

### 02-1 — Ba dặn dọn bát nhang

- Ảnh: bát nhang bị ghép chồng vào bát có sẵn trong ảnh bàn thờ; bàn thờ và ghế chồng nhau; đèn nằm dưới sàn. Người kể vẫn cầm chổi.
- Kiểm riêng SVG xác nhận `node_bantho` đã chứa bát nhang. Node bát nhang riêng tiếp tục được đặt vào anchor `surface` nằm ngay phần bát đó.
- Gốc lỗi: một tài nguyên chứa nhiều vật nhưng vẫn được dùng như bàn trống; câu “đèn trên bàn thờ” chỉ nằm trong description/pose, không có `relation: on`, nên code đặt đèn xuống đường đứng.
- Ba đứng thay ngồi có thể chấp nhận theo yêu cầu minh họa. Bát bị trùng và đèn sai chỗ cần sửa.

### 02-2 — Dặn chôn tro sau gốc chuối

- Chưa đủ ảnh; không có ảnh để đánh giá hình đã ghép.
- Dữ liệu có mâu thuẫn: bát ghi `relation: on`, target bàn thờ, nhưng pose lại “held in my hands at chest height”. Hai nhân vật cũng mô tả đang cầm/giữ bát.
- Gốc lỗi: hợp đồng phân cảnh kiểm quan hệ có target hợp lệ, chưa kiểm cùng một vật đang ở tay hay ở bàn. Lỗi cảnh trước trong cùng đoạn làm vòng hydrate chưa đến cảnh này.
- Minh họa đủ: bát trên bàn, hai người đứng cạnh, hoặc người kể cầm bát. Chọn một trạng thái rõ ràng.

### 03-1 — Mang bát nhang ra sân

- Bát nằm trên bàn, người kể đứng cạnh: cách giản lược này chấp nhận được, không bắt buộc phải đang ôm bát.
- Lỗi còn lại: chổi vẫn trong tay, cổng kéo dài, lớp sàn rời phủ lên nền tạo một mảng như bục nổi.
- Gốc lỗi: đồ cầm tay bị trộn vào nhận dạng nhân vật; sàn vừa có trong background vừa được thêm thành fixture mà không có quy tắc phối cảnh thống nhất.

### 04-1 — Nghĩ chôn tro lâu, tro nhiều

- Ảnh cận cắt mất đầu người kể. Bát nhang nghiêng lơ lửng cạnh chân; người vẫn cầm chổi. Hình đã thể hiện đổ tro trong lúc câu này mới nói đến ý định.
- Gốc lỗi: bát không có quan hệ cầm tay; camera detail phóng 1,8 lần theo vật, không bảo vệ phần nhân vật cần thấy sau crop. Kiểm bounds xảy ra trước camera. Scene planner đưa trạng thái thuộc câu sau vào cảnh trước.
- Minh họa đủ: cận bát đầy tro đặt trên bàn; hoặc người đứng cạnh bàn, không phải dựng động tác nghiêng/đổ.

### 04-2 — Rải tro dọc lối đi

- Chưa đủ ảnh.
- Dữ liệu đã có vệt tro, nhưng vẫn lặp bộ bàn/cổng/cửa/người cầm chổi. Chưa mô tả được ràng buộc vệt tro phải nằm trên đường từ bàn tới cửa.
- Cần cảnh tĩnh có vệt tro rõ trên lối đi, người có thể đứng cạnh.

### 05-1 — Ba, chị dâu và người kể ở trong nhà

- Đủ ba người. Đứng thay ngồi được phép giản lược.
- Ảnh: chiếu dựng nghiêng bên phải như tấm bảng; đèn trên sàn; bàn thờ và ghế chồng nhau; người kể giữ chổi không liên quan.
- Gốc lỗi: chiếu bị dùng cùng quy tắc support chung, không có hướng nằm trên mặt sàn; đèn thiếu quan hệ đặt trên bàn; các vật cùng slot được dàn ngang theo số lượng, không theo đồ đạc cố định trong phòng.
- Cần giữ đúng ba người, ghế/chiếu nằm trong vùng riêng, đèn trên mặt bàn và đồ dùng phụ đúng chỗ.

### 06-1 — Khói tụt xuống sát miệng bát

- Ảnh cận: người kể đứng án ngay trước bát, che manh mối chính; bát và cụm khói lớn; bàn/ghế bị vẽ dẹt.
- Kiểm SVG: bàn đã chứa bát; bát đã chứa chân nhang; lại thêm bát và nhang riêng. Lớp `node_khoi` là một cột khói hướng lên, trong khi lời kể yêu cầu tụt xuống.
- Gốc lỗi: nhiều lớp cùng chứa một vật; hiệu ứng được gắn `source: node_khoi` thay vì nhang/bát thật. Camera chọn bát/khói làm focus nhưng không xử lý người đứng chắn trước chúng.
- Cần cận một bát nhang với khói là đà ở miệng bát; có thể không đưa người kể vào khung.

### 07-1 — Ba nói bằng giọng lạ

- Hai người hiện rõ; không cần bắt nhân vật ngồi hay diễn khẩu hình.
- Ảnh: bàn thờ và ghế đổi thành hai dải gỗ sát đất so với cảnh 02/05; chiếu tiếp tục dựng lên; đèn vẫn dưới sàn.
- Gốc lỗi: cùng đồ vật được tạo ảnh khác theo pose/mount/targetAspect. Nhận dạng vật và asset thiết kế chưa được khóa thống nhất. Quan hệ đèn trên bàn thiếu nên giữ vị trí mặc định sai.
- Cần giữ đồ đạc như cảnh trong nhà trước, người ba và người kể ở vị trí dễ hiểu.

### 08-1 — Chị dâu mang mâm cơm, chấm muối

- Ảnh có chị dâu và mâm, nhưng thịt/muối rất nhỏ; chén muối chưa đủ rõ để làm manh mối. Chiếu và đồ đạc phía sau vẫn sai như các cảnh trong nhà.
- Ngoại hình chị dâu giả thay đổi tóc/nét mặt so với chị dâu thật, chưa có quan hệ hình ảnh đủ chặt.
- Gốc lỗi: bố cục toàn cảnh dù trọng tâm là mâm/chén; con ma có `appearanceOf` trong cast nhưng chưa dùng SVG người thật làm gốc ở `baseCharacter`.
- Cần một cảnh người cầm mâm có chén muối/đồ ăn đọc được, hoặc cận mâm. Không cần mô phỏng gắp và chấm.

### 09-1 — Nằm nghe tiếng chân ngoài sân

- Ảnh có người nằm rất nhỏ, tách khỏi chiếu; chiếu ở bên phải còn người nằm bên trái. Phần lớn khung hình trống.
- Gốc lỗi: pose “lying … on the mat” không đi kèm relation/target chiếu. Nhân vật nằm bị giới hạn theo chiều rộng chung của nhân vật nên co rất nhỏ. Chiếu giữ slot cũ trong continuity dù pose mới nói nằm bên trái.
- Cần người nằm gọn trên chiếu/giường hoặc một góc phòng đơn giản thể hiện người đang nghe động tĩnh. Không cần diễn động tác.

### 10-1 — Ra mở cửa, thấy ba và chị

- Cả ba nhân vật bị dồn lên khu vực cao ở mép phải, chân không chạm sân, kích thước co nhỏ.
- Gốc lỗi: `inside` dùng điểm inside của cả người và cửa, nên căn người vào giữa chiều cao cửa thay vì đặt chân trên ngưỡng. Ba đứng beside người kể nên kế thừa đường chân cao đó; chị behind ba tiếp tục kế thừa. Chỉ thu nhỏ toàn bộ khi tràn, không sửa được mặt tiếp xúc.
- Cần người kể cạnh cửa, ba ngoài sân, chị phía sau ba, chân cùng mặt sân phù hợp.

### 11-1 — Gọi ba từ phía cửa

- Ba hầu như bị cửa đặc che kín; người kể đứng phía trái sân, không làm rõ vị trí đang ở phía trong cửa.
- Gốc lỗi: `behind` hạ depth xuống sau lớp cửa đặc; chưa kiểm diện tích chủ thể còn nhìn thấy. Pose ghi “inside the doorway” nhưng không có quan hệ đặt tương ứng cho người kể.
- Cần hai vị trí trong/ngoài cửa rõ ràng, có thể để cả hai đứng tĩnh. Không bắt buộc phải diễn mở cửa.

### 12-1 — Chị nhìn vệt tro dưới chân

- Ba nhân vật chen chồng ở mép phải. Mặt người kể bị khuất một phần. Vệt tro ở xa vị trí chân chị nên manh mối không rõ.
- Gốc lỗi: quan hệ beside/behind được giải từng cặp, chưa kiểm va chạm của toàn nhóm. `pose` nhìn xuống vệt tro không tạo ràng buộc “vệt tro dưới chân chị”. Có focus nhưng `view: wide`, nên focus không tạo khung cận.
- Cần chị đứng ngay cạnh/trên mép vệt tro nhìn thấy rõ; người kể không chen vào che mặt.

### 13-1 — Em trai khóc ngoài cổng

- Em trai treo ngang phía trên tường/cổng, chân ở khoảng 42% chiều cao ảnh thay vì chạm sân. Không thấy rõ mặt lem tro. Tỷ lệ người nhỏ chưa thể hiện rõ tuổi chín.
- Gốc lỗi: behind lấy đường chân từ base cổng đang bị lắp giữa tường. Nhân vật trẻ em dùng cùng hệ chiều cao 46% khung như người lớn; chỉ co chung nếu cả cảnh không vừa. “Face smeared with ash” không nằm trong bộ marker nhận diện ngoại hình, nên có thể tái dùng mặt sạch.
- Cần em trai thấp hơn người lớn, đứng sau một cổng thật, chân chạm nền và mặt lem tro đọc được.

### 14-1 — Em trai nói bị đuổi khỏi phòng

- Lặp lỗi em trai treo trên cổng; người kể đứng rất xa. Hình không làm rõ người kể đang nghe đứa trẻ ở bên kia cổng.
- Gốc lỗi hình: cùng quan hệ behind và socket sai như cảnh 13. Focus không có tác dụng khi vẫn là wide.
- Điểm kịch bản cần rà: câu “Mẹ ơi” rồi “trong nhà tôi làm gì có mẹ” là một chuyển ý bất thường chưa được giải thích rõ trong truyện hiện tại. Không thể tự khẳng định đây là lỗi hình; cần kiểm logic truyện trước khi chọn hình cho câu này.
- Cần một bố cục đơn giản thấy người kể và em trai ở hai phía cổng, không yêu cầu khẩu hình phức tạp.

### 15-1 — Ra vườn tìm tro cũ

- Ảnh: hố tro gần giữa khung, gốc chuối bên phải cách xa; người kể và xẻng lại bên trái. Chưa thể hiện được địa điểm “sau gốc chuối”.
- Người đứng thay quỳ không phải lỗi cần bắt theo yêu cầu minh họa.
- Gốc lỗi hình: gốc chuối có trong background nhưng không có vùng/anchor cây để gắn hố tro; “at the base of the banana clump” chỉ là văn bản. Hình nhân vật mới được yêu cầu quỳ nhưng SVG vẫn đứng; đây là lời nhắc không nên xem yêu cầu pose là bằng chứng ảnh đã đúng.
- Gốc lỗi truyện: trước đó nói không chôn mà rải tro ngoài lối đi; cảnh này lại tìm và đào tro đã chôn. Thiếu bước nối hoặc phải đổi cách xử lý tro ở đoạn này.

### 15-2 — Đào tro, đem cúng lại

- Chưa đủ ảnh. Dữ liệu còn mô tả xẻng vừa “leaning against fence” vừa `heldBy` người kể; cần chọn trạng thái rõ ràng.
- Nếu giữ hướng truyện không chôn tro ở đầu thì phải sửa logic “đào lên” trước. Không nên vẽ chi tiết hơn cho một sự kiện đang mâu thuẫn.

### 16-1 — Thắp nhang, khói bay thẳng

- Khói thẳng lên nhận ra được, đây là phần gần lời kể hơn cảnh 06.
- Ảnh vẫn có người kể cầm chổi, bát nhang quá lớn so với bàn dẹt; nhiều vật cùng được đặt vào một surface giữa bàn.
- Gốc lỗi: đồ cầm tay trong ảnh gốc; bàn bị ép tỷ lệ theo vùng sàn; nhiều node cùng một anchor không được phân vị trí trên mặt bàn; khói vừa là SVG vừa là effect.
- Cần một bát/nhang và luồng khói thẳng lên, người có thể đứng cạnh ngoài vùng cận.

### 17-1 — Lộ ba cô hồn

- Đủ ba hình người tương ứng già/đàn bà/trẻ, nhưng đứa trẻ cao bằng người lớn. Sắc thái người và ma không tách biệt đủ rõ; toàn bộ cảnh giống ba người bình thường đứng thành hàng.
- Gốc lỗi: kích thước chỉ xét `kind: character`, chưa xét age/chiều cao tương đối. `appearanceOf` chưa nối hình người thật và biến thể ma; phong cách và dấu hiệu pallor chủ yếu giao cho AI tự vẽ.
- Cần ba cô hồn có tuổi và tỷ lệ khác nhau, cùng nhận dạng với người thật; dùng mặt tái/độ mờ nhẹ, không cần thêm động tác hay quái vật phức tạp.

### 18-1 — Ba người thật lẫn ngoài đường

- Cả ba người thật treo trên thanh cổng. Không có đám cô hồn để thể hiện “đứng lẫn trong đám”; em trai cao ngang người lớn.
- Gốc lỗi vị trí như cảnh 13; bộ node không tạo nhóm nền, hợp đồng phân cảnh chưa đối chiếu số nhóm/chủ thể cốt lõi với câu nguồn. Sương chỉ là một mảng nhỏ, không thể thay cho đám người.
- Cần ba người thật đứng chạm đất phía ngoài cổng, thấp/cao đúng tuổi; vài bóng nền đơn giản là đủ, không cần dựng đám đông chi tiết.

## Nguyên nhân xuyên suốt trong code

### 1. Socket đang trộn vùng nền với điểm lắp một vật

`scenePipeline.ts:300` suy ra targetAspect từ mọi socket; `motionRemotion.ts:105` fit fixture theo cả vùng đó. `wall` đang rộng toàn khung nên cổng bị vẽ/đặt thành thanh dài. `floor` là cả mặt sàn nhưng cũng được dùng làm tỷ lệ vẽ bàn/ghế, gây ảnh bàn dẹt.

Cần phân biệt vùng đi/đứng, vùng lắp cổng/cửa và vùng đặt đồ đạc. Vị trí và tỷ lệ vật phải theo một điểm đặt cụ thể, không phải hình chữ nhật của cả tường/sàn.

### 2. Quan hệ inside/behind chưa phân biệt loại target

`motionRemotion.ts:114` xử lý quan hệ chung; `inside` dùng tâm/vùng trong của vật cho cả người đi qua cửa; `behind` lấy base target dù target là thanh cổng trên tường. Kết quả nằm trong bounds nhưng chân ở trên không.

Cần ràng buộc mặt đất/ngưỡng cửa cho người; z-order chỉ quyết định che trước/sau. Người đứng sau cổng vẫn phải chạm đất.

### 3. Nhận dạng nhân vật chứa cả trạng thái và đồ dùng

Cast `toi.look` có “holding a small broom”. `scenePipeline.ts:183` vẽ base character từ look đó. `canReuseRemotionCharacter` chỉ xét một số marker và pose nên ảnh có chổi được tái dùng qua hầu hết cảnh.

Cần tách ngoại hình lâu dài khỏi vật cầm tay và trạng thái theo cảnh. Ảnh base không chứa chổi/bát/mâm. `appearanceOf` cần dùng hình người thật làm gốc cho phiên bản ma.

### 4. Một lớp chứa sẵn nhiều vật nhưng vẫn bị tách và ghép thêm lần nữa

Ảnh kiểm riêng xác nhận bàn thờ chứa bát nhang và bát chứa chân nhang. Luồng vẫn thêm các node bát/nhang riêng. Bounds và XML hợp lệ không chứng minh ảnh chỉ có một chủ thể.

Cần có hợp đồng thành phần của từng asset, và sửa riêng ảnh ghép sai. Không thể chỉ đổi tọa độ để xử lý một bát đã vẽ sẵn bên trong bàn.

### 5. Continuity chưa giữ được bố cục vật lý

`sceneContinuity.ts:73` giữ slot nhưng `motionRemotion.ts:96` dàn vị trí theo số lượng peers hiện tại nên thêm/bớt một vật vẫn làm vật cũ dịch chuyển. Asset key ở `scenePipeline.ts:301` chứa pose/mount/targetAspect nên cùng objectId có nhiều bản thiết kế/tỷ lệ.

Cần khóa asset thiết kế và điểm đặt theo objectId/location, chỉ thay trạng thái có bằng chứng. Không khóa nhầm một trạng thái sai rồi phát tán nó sang cảnh sau.

### 6. Camera và che khuất chưa nằm trong kiểm tra cuối

`remotionSceneView` ở `motionRemotionEffects.ts:17` zoom tới 1,8 theo focus. Bộ kiểm tra hình học không kiểm lại vùng nhìn thấy sau zoom/crop. Renderer vẽ theo depth; chưa phát hiện người quan trọng bị cửa/vật/người khác che kín.

Cần kiểm ảnh cuối sau camera: chủ thể cốt lõi đọc được, không cắt đầu ngoài chủ ý, manh mối không bị che. Không bắt các chi tiết động tác phụ.

### 7. Chưa có tỷ lệ tuổi và bố trí nhóm

`motionRemotion.ts` đặt visible height 46% cho mọi character. Dữ liệu age có sẵn trong cast nhưng layout không nhận nó. Nhóm quan hệ được giải từng cặp, không có kiểm tra nhóm có chen chồng không.

Cần chiều cao tương đối trẻ/người lớn/người già và bố cục nhóm đơn giản. Không cần dựng rig hay mô phỏng động tác.

### 8. Khói/lửa vừa được vẽ vào SVG vừa thành hiệu ứng

Ở cảnh 06, effect có source là `node_khoi`; chính node này lại là SVG cột khói, trái chiều lời kể. `remotionEffectGeometry` kiểm anchor có tồn tại, chưa kiểm anchor có thuộc nguồn khói vật lý thật không.

Cần chọn một nguồn vật lý: nhang/bát/đèn. Hình minh họa khói tĩnh cũng được, nhưng chiều và vị trí phải đúng manh mối.

### 9. QA đang nặng về cấu trúc, thiếu kiểm nội dung tối thiểu

`sceneContract.ts` kiểm ID, range, cast hợp lệ và target. Nó chưa đối chiếu “ngoài cổng”, “dưới chân”, “ba người trong đám”, hoặc vật vừa ở tay vừa ở bàn. `remotionSceneReadiness` xác nhận có ảnh và bố trí được. Kiểm ảnh AI chỉ chạy khi bật review ở `scenePipeline.ts:318`.

Khi review tắt vẫn cần các quy tắc rẻ và chắc chắn: chân chạm mặt đặt; trẻ không ngang người lớn; vật chỉ có một chủ sở hữu; nhân vật/manh mối chính nhìn thấy; số nhóm/chủ thể đúng. Các khác biệt đứng/ngồi, chỉ tay, mở cửa, quỳ có thể bỏ qua nếu không làm sai ý.

### 10. Logic sự kiện sai trước khi tới bước vẽ

Truyện hiện tại vừa bỏ việc chôn và rải tro ra lối đi, vừa quay lại đào tro đã chôn. Các prompt phân cảnh có priorFacts giới hạn, chủ yếu place/time/action/scenePlan, chưa phải sổ sự kiện đầy đủ và không kiểm việc “đã chôn” có từng xảy ra không.

Cần một sổ sự kiện nhỏ: vật ở đâu, ai giữ, việc nào đã xảy ra, thời điểm nào. Đây là kiểm nhất quán cốt truyện, không phải bắt độ dài câu hay mọi chi tiết văn phong.

## Thứ tự xử lý nên áp dụng

1. Chuẩn hóa mặt đất, socket cửa/cổng và quan hệ người với kiến trúc; loại bỏ hiện tượng treo người trước.
2. Tách ảnh base khỏi đồ cầm tay và tách asset bị vẽ lẫn nhiều vật; nối biến thể ma với nhân vật thật.
3. Khóa thiết kế và vị trí đồ vật trong từng địa điểm; phân kích thước theo tuổi.
4. Bố trí nhóm và khung cận sau khi vị trí vật lý đúng; kiểm manh mối không bị che.
5. Chỉ giữ một lớp khói/lửa có nguồn đúng; đảm bảo khói lên/xuống đúng lời kể.
6. Kiểm logic sự kiện, số chủ thể và vị trí cốt lõi ngay cả khi review AI tắt. Không nâng QA cho động tác phụ.

Giữ các phần sửa trước về bounds trong suốt, toast 2 dòng, reset lượt mới. Bổ sung kiểm chứng bằng các cảnh lỗi thực tế trên; kết quả “qua validator” phải được ghi riêng với kết quả “minh họa đúng lời kể”.
