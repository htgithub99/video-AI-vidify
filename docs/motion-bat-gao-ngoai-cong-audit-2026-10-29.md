# Kiểm tra Bát Gạo Ngoài Cổng — 29/10/2026

## Phạm vi và kết luận

Bản kiểm tra: `bat-gao-ngoai-cong-16x9-draft-1793272109947.mp4`, production `0171ab25909369c6e9f2ca0dec29ff64`, xuất lúc 18:09 ngày 29/10/2026. Dài 128,8 giây, 1280×720, 30 fps, 18 nhịp lời kể ghép thành 12 cảnh Remotion.

**Bản xuất hoàn tất, nhưng hình chưa truyền đạt đủ các dấu hiệu quan trọng của truyện. Nhịp người kể đã đều theo phép đo; còn lỗi xác định nguồn giọng cho nhân vật bị nhập.** Không đánh đồng trạng thái hoàn tất với việc hình và tiếng đã đạt chất lượng mong muốn.

Đã xem ảnh lấy trực tiếp từ cả 12 cảnh trong MP4, đối chiếu với lời kể, schema, SVG và cấu hình. Kiểm tra thêm các cặp hình trong cùng cảnh ở các thời điểm khác nhau. Phần âm thanh được đo trên WAV từng câu, track tổng và MP4, kết hợp nhận dạng lời nói cục bộ. Phiên kiểm tra này không có công cụ nghe cảm nhận trực tiếp: nhận dạng sai chỉ là nghi vấn về độ rõ chữ, không phải bằng chứng chắc chắn TTS phát âm sai.

Lượt audit đầu không sửa code ứng dụng hoặc tạo lại video. Sau yêu cầu kiểm tra sâu hơn, đã bổ sung cấu hình SFX trên UI; chưa sửa logic dựng hình, phân vai hoặc lập SFX, chưa tạo lại video. Chi tiết và trạng thái: [kế hoạch sửa chung](motion-bat-gao-general-root-plan-2026-10-29.md).

## Cấu hình thực tế

- Cách dựng: Remotion; kiểu hình Truyện ma; chia cảnh `few`.
- AI nội dung DeepSeek Auto; AI dựng cảnh Gemini Flash · Trung bình.
- Chuyển động nhân vật bật; nhân vật `simple`, hiệu ứng và camera `gentle`.
- Phân vai giọng bật; người kể dùng `custom-thantrung-narrator-v2-20261025`.
- AI duyệt ảnh tắt; kiểm giọng bằng ASR trong lượt tạo gốc tắt.
- Hiệu ứng âm thanh bật, âm lượng 0,5; nhưng kết quả `sfxCues=[]`, `soundSelections=[]`.
- Phụ đề bật; xuất chất lượng nháp.

## Kiểm tra từng cảnh

| Cảnh | Thời gian | Quan sát và đối chiếu |
|---|---|---|
| 1 | 00:00–00:07 | Có chén lạnh trên bàn, đúng vật và nơi cơ bản. Nhưng chén khá nhỏ trong toàn cảnh, dấu hiệu lạnh dựa vào những nét giống hơi nóng; chưa phải hình mở đầu làm nổi bật vật bất thường. |
| 2 | 00:07–00:20 | Có cây, sân, cổng và hai người. Người lạ không có dấu hiệu trang phục rách hoặc khăn nhận diện; cách đặt hai người cùng phía trước cổng chưa làm rõ người trong nhà và người ngoài cổng. Không cần thêm động tác xin gạo phức tạp. |
| 3 | 00:20–00:35 | Có cả `bat_gao` đang được cầm và `chen_lanh` trên trụ cổng suốt cảnh. Hai trạng thái trước/sau của vật chứa trong mạch kể bị vẽ cùng lúc. Ảnh tại 22s và 32s xác nhận không chuyển trạng thái theo lời. Bát trên tay nằm sát đầu, chưa đọc rõ quan hệ cầm. Người khách vẫn ở đó khi lời đã kể đi khỏi; có thể dùng một hình hậu cảnh sau khi khách đi, không cần hoạt họa bước chân. |
| 4 | 00:35–00:50 | Có bố, người kể, bàn, chén và cửa. Bố đứng trên ghế/đôn trong hình, thay vì được ghế đỡ đúng tư thế; đây là lỗi tiếp xúc với vật đỡ, không phải yêu cầu phải diễn tả chi tiết ngồi uống trà. |
| 5 | 00:50–00:56 | Hình bếp đêm và bát đũa phù hợp ý chính. Thiếu cue âm thanh cho tiếng đũa gõ bát mà lời đang kể. Không cần thêm người vào cảnh này. |
| 6 | 00:56–01:03 | Thể hiện mâm đồ cúng, chạn bát và người kể. Ý bát đũa đã dọn tương đối đọc được; cảnh này không cần buộc thêm hành động tìm kiếm. |
| 7 | 01:03–01:15 | Khói được vẽ đổ xuống từ bát hương, phù hợp chi tiết siêu nhiên. Nhưng chị Sáu đã lộ mặt nhìn ra khán giả và đứng cạnh chạn, trái chi tiết quay lưng trong bóng tối sau chạn. Áo hoa mất. Khói chủ yếu thay độ trong; không có dòng chuyển động đi xuống rõ, dù hình tĩnh đã chỉ đúng hướng. |
| 8 | 01:15–01:30 | Người kể ở cửa bếp là đúng. Chị Sáu vẫn lộ mặt, giơ đũa cao, trong khi lời nhấn chị không quay đầu lại. Vấn đề cần giữ là hướng và che giấu khuôn mặt; không cần hoạt họa lùa cơm. Miệng và tay có animation nhưng không sửa được sai hướng nhìn. |
| 9 | 01:30–01:46 | Có người lạ ở bàn và người kể. Tuy nhiên người lạ chỉ là puppet xanh trơn giống chị Sáu; không có áo hoa như lời kể. Vì khuôn mặt mọi người giống nhau, người xem khó thấy cú lật người lạ chiếm chỗ chị. |
| 10 | 01:46–01:53 | Chén còn trên bàn, đúng sự tiếp nối. Góc rộng làm chén nhỏ; nên ưu tiên hình đồ vật để đọc dấu hiệu lạnh, thay vì bắt buộc động tác chạm chính xác. |
| 11 | 01:53–01:59 | Hồn trắng mờ ngoài ngõ và sương phù hợp; không bị lỗi đổi sang màu ma khác. Nhưng hồn không có dấu hiệu riêng để nhận ra đó là chị Sáu, vì nhân vật sống đã thiếu dấu hiệu nhận diện. |
| 12 | 01:59–02:08 | Trở lại nhà và chén trên bàn phù hợp kết truyện. Dùng lại cùng địa điểm là hợp lý; không tính việc này thành lỗi lặp cảnh. Chưa làm vật gây ám nổi bật bằng bố cục cận hơn. |

## Nguyên nhân trong code và dữ liệu

### 1. Style đang khóa cả những phần cần thay đổi theo truyện

`src/constants/motionVisual.ts`, profile horror revision 12, chủ động yêu cầu mọi người có đầu mặt nạ trắng, mắt đen, thân một màu, không tóc/mũi/tai. Đây là chủ đích style hiện tại, không phải SVG bị hỏng hay Remotion làm mất khuôn mặt.

`src/constants/motionIllustrationProfiles.ts`, horror.drawing, còn yêu cầu chép chính xác puppet template và **chỉ đổi ID, X/Y, S và BODY**. Điều này xung đột với quy tắc chung cùng file rằng nhân vật, quần áo, tuổi và nhận diện phải thay đổi theo truyện. Đầu vào cảnh 9 đã ghi rõ áo hoa nhí xanh nhưng hình cuối vẫn xanh trơn.

Hướng sửa chung: giữ hình học puppet và nét vẽ; cho phép dấu nhận diện và lớp trang phục được kịch bản yêu cầu. Đặc biệt, vật/áo phục vụ cú lật nội dung không thể bị coi là trang trí tùy chọn. Không cần đổi sang giải phẫu hiện thực hoặc bắt AI vẽ nhiều chi tiết.

### 2. Một hình đang chứa nhiều trạng thái khác thời điểm

Cảnh 3 gộp hai nhịp lời kể: đang cho ăn và đã bỏ chén lại. Dữ liệu lại tạo hai node `bat_gao` và `chen_lanh`, không có cùng objectId và diễn tiến trạng thái. Hai node cùng hiện suốt cảnh; animation chỉ là nhấp nhô người, giơ tay và hơi lạnh.

Hướng sửa chung: thống nhất vật thể được gọi bằng nhiều tên; chọn một thời điểm minh họa chủ đạo khi gom câu. Với trạng thái quan trọng không thể cùng tồn tại, dùng ảnh trước/sau hoặc một lần thay trạng thái đơn giản. Không cần tách cảnh cho mọi động từ.

### 3. Hướng nhìn và vật đỡ có trong yêu cầu nhưng hình cuối không tuân theo

Node chị Sáu ở cảnh 7 đã yêu cầu `back turned`; SVG vẫn dùng mặt trước của template. Cảnh bố có ghế nhưng thân người không tiếp xúc với mặt ghế theo tư thế phù hợp. Thêm mô tả vào node chưa bảo đảm AI vẽ đúng khi template đang mạnh hơn yêu cầu cảnh.

Hướng sửa chung: template cần biến thể quay lưng và ngồi có vật đỡ, hoặc cho AI chọn hình đứng cạnh ghế khi tư thế không quan trọng. Giữ hướng quay lưng nếu đó là dấu hiệu gây hồi hộp của truyện. Không ép mọi động tác phải đúng từng khung hình.

### 4. Tắt review đã được thực thi đúng, nên các sai hình trên được chấp nhận

`src/server/services/remotion/scenePipeline.ts` truyền profile, nodes, cast, lời cảnh và hình cảnh trước vào một lượt vẽ. Khi review tắt, composition mang `unchecked:true`; không gọi AI review hay tự sửa chỉ vì hình chưa đẹp. Đây là hành vi người dùng đã yêu cầu, không phải lỗi cần đảo lại.

Nâng chất lượng ở hợp đồng đầu vào và khả năng của template. Có thể ghi cảnh báo để người dùng tạo lại riêng cảnh; không tự bật review hay chặn cả video bằng QA thẩm mỹ.

### 5. Nguồn giọng nhập hồn bị suy ra từ tên

Ở 01:20,698–01:22,445, câu “Đói quá, cho ăn nữa đi” có `speaker=chi_sau` nhưng `voiceSpeaker=co_hon_sau`. Cast xác định `co_hon_sau` là hồn chị Sáu bị đẩy ra ngoài, còn `ba_khach` mới là cô hồn xin gạo chiếm thân.

Trong `src/lib/motionVoiceAttribution.ts`, `resolveMotionVoiceSources` lọc ứng viên ma qua **name và key**, không qua vai trò/quan hệ chiếm thân. Người đàn bà lạ có vai trò cô hồn nhưng tên/key không chứa từ nhận diện ma, nên bị bỏ khỏi ứng viên; hồn chị Sáu lại được chọn. Kịch bản gốc của câu thoại chưa có voiceSpeaker, còn clip cuối đã có giá trị trên.

Hướng sửa chung: xác định quan hệ cơ thể đang hiện / người đang phát giọng / linh hồn bị đẩy ra khỏi cơ thể bằng vai trò và bằng chứng. Không tự chọn một nguồn chỉ vì tên có chữ “cô hồn”. Khi thiếu bằng chứng, giữ phân vai ổn định thay vì suy ra nguồn không đúng.

### 6. Bật SFX không đồng nghĩa đã có sound event

18 nhịp kịch bản không có `data.soundEvents`. `src/server/services/remotion/soundCompiler.ts` chỉ biên dịch các event đó, nên trả về danh sách trống. MP4 vẫn có lời và nhạc nền; riêng SFX không được tạo trong bản này.

Hướng sửa chung: bảo đảm bước lập âm thanh ghi nhận tiếng được lời kể nhấn mạnh, ví dụ đũa gõ bát. Có thể cảnh báo thiếu cue; không biến các âm trang trí thành điều kiện chặn xuất video.

Kiểm tra sâu hơn: `motionProductionActions.ts` rẽ nhánh Remotion và trả về `buildRemotionScenes` mà không truyền `sfx`; `RemotionSceneOptions` cũng chưa nhận cờ này và pipeline không gọi bước lập âm thanh. Nhánh dùng kho gọi `directPuppetSound` trong `puppet/pipelinePuppet.ts`. Vì thế nguyên nhân không chỉ là AI quên trả event: nhánh Remotion chưa nối bước tạo event vào luồng. Mở nút SFX lên UI không tự khắc phục đoạn thiếu này.

### 7. Giơ tay sai có cả nguyên nhân trong prompt, schema và cấu trúc SVG

- `horror.planning` yêu cầu người nói/nhấn mạnh giơ một tay; `horror.drawing` đưa biến thể tay cong vươn lên cao; `horror.motion` yêu cầu thêm vẫy tay cho người nói/ra hiệu. Những chỉ dẫn này khiến động tác mẫu lấn át tư thế nghỉ hay cầm vật.
- `compositionActorMotion` còn có thể thêm xoay `_arm` nếu nhân vật chưa có actor animation và arm có pivot; điều kiện không xét bằng chứng nhân vật cần ra hiệu. Với bản Bát Gạo, các track đã có trong composition; không có đủ bằng chứng để quy mọi động tác thực tế cho fallback này. Fallback là một nguy cơ chung cần sửa cùng prompt.
- Cảnh 10 đã khai báo `ban_tay_toi` là `kind: character, entityId: toi`. Template yêu cầu vẽ đầy đủ puppet cho mỗi character, nên một cận bàn tay biến thành cả người. Không phải renderer tự nhân đôi người từ một node prop hợp lệ.
- Bát `bat_gao` ở cảnh 3 có quan hệ `heldBy: ba_khach` trong node, nhưng nhóm SVG chỉ nằm trong `scene_canvas`, không nằm dưới người hay tay đang cầm. `compositionFrameSvg` chỉ nội suy và áp dụng transform lên nhóm có animation, không giải ràng buộc heldBy để kéo đồ vật theo tay. Quan hệ trong JSON chưa trở thành cấu trúc liên kết trong SVG.
- Cấu hình actors=fixed chỉ tắt track actor/speech. Nó không sửa tư thế giơ tay đã được vẽ trong hình gốc. Vì vậy tắt chuyển động không phải cách sửa lỗi tư thế.

Đã tái hiện bằng code chạy cục bộ trên bản production lưu sẵn, không gọi AI: `scratch/bat-gao-audit-20261029/root-repro.ts`; kết quả `root-repro.json`. Đồng thời tái hiện việc resolver tự gán `co_hon_sau` từ câu gốc không có voiceSpeaker và compiler trả 0 SFX.

## Cập nhật UI sau kiểm tra sâu

- Đã thêm toggle **Âm thanh cảnh (SFX)** cạnh Nhạc nền trong cấu hình chung, áp dụng cả Dùng kho và Remotion.
- Lưu trạng thái qua reload và truyền đúng `sfx:true/false` khi tạo dự án; giữ mặc định bật của dự án cũ.
- Nếu đã có bản biên dịch, không có tác vụ đang chạy và danh sách cue trống: hiển thị **Bật · chưa có tiếng động**. Đây là thông tin trung tính, không chặn xuất video hay coi cảnh cố ý im lặng là lỗi.
- Chưa có bản biên dịch thì chỉ hiện Bật/Tắt; không suy ra thiếu tiếng động khi quá trình chưa có kết quả.
- Không thay đổi nhạc nền hoặc chuyển động hình khi bật/tắt SFX.
- Đã qua `npx tsc --noEmit` và `npx tsx scripts/verify-motion-sfx-ui.ts`: UI thực, cả hai cách dựng, default, reload, request bật/tắt, độc lập nhạc nền và trạng thái bật-trống. Các API được mock, không tạo video hoặc gọi AI/TTS.

## Voice: phần đã đạt và phần chưa thể chốt

### Đã xác nhận bằng đo tín hiệu

- 18 clip người kể đều dùng đúng voice Thần trùng đang khóa.
- Tốc độ phát âm ước lượng sau khi loại khoảng nghỉ: **5,09–5,24 tiếng/giây**, trung bình **5,153**; mục tiêu trong cấu hình tham chiếu **5,18**. Độ biến thiên giữa các clip khoảng **0,71%**. Chưa có bằng chứng đoạn kể này nhanh, đoạn khác chậm rõ ở mức trung bình clip.
- 38/39 ranh giới ngắt nội bộ được bộ căn nhịp ghi nhận khớp; dấu phẩy thường khoảng 0,43–0,47s, dấu chấm 0,55–0,57s.
- RMS giọng kể giữa các clip từ -21,00 đến -20,14 dBFS. Không có mẫu clipping 16-bit trong 20 clip đã xử lý.
- Sóng lời trong MP4 tương quan 0,9949–0,9997 với track voice ở các cửa sổ có lời. Không thấy bằng chứng công đoạn xuất MP4 làm đổi nhịp từng câu. Phép đo này không khẳng định cảm nhận hòa âm hoàn hảo.
- Hai thoại nhân vật dùng nhịp riêng, không lấy chúng làm bằng chứng rằng người kể mất nhịp.

### Cần kiểm tra nghe đối chứng

ASR cục bộ nhận “trời” thành “chơi” ở phần mở, “cổng sắt gỉ” thành “cổng sắt gì”, và một số lần “chị Sáu” thành “chị xấu/Xáu/sóc”; câu nhập hồn được nhận thành “cho anh nữa đi”. Đây là **danh sách nghi vấn**, vì bản thân bộ nhận dạng cũng có thể nhầm phụ âm, thanh điệu và tên riêng. Không tự đổi chữ, tăng tốc hay lọc mạnh dựa trên kết quả này.

Nhịp trung bình ổn định không chứng minh mọi phụ âm đều rõ. Muốn kết luận độ rõ chữ so với file mẫu, cần nghe đối chứng các đoạn 00:00–00:20, 01:09–01:22 và 01:53–01:59.

## Chuyển động

MP4 có chuyển động thật: đã đối chiếu cặp ảnh cùng cảnh tại 22/32s, 65/70s, 79/81,3s và 115/116s, bỏ vùng phụ đề khi đo thay đổi. Có chuyển động nhẹ ở người/tay/miệng/hiệu ứng, không phải chỉ một ảnh bất động suốt video. Tuy nhiên phần lớn là lặp động tác nhẹ; không nên dùng thêm chuyển động để che lỗi nhận diện và bố cục.

## Thứ tự ưu tiên nếu tiến hành sửa

1. Giải quyết xung đột khóa template với nhận diện, áo hoa, hướng quay lưng và vật đỡ.
2. Chọn trạng thái minh họa nhất quán; không vẽ hai trạng thái của cùng vật cùng lúc.
3. Sửa suy luận nguồn giọng nhập hồn cho mọi truyện có chiếm thân/tráo hồn.
4. Bổ sung các sound event có vai trò kể chuyện khi SFX bật.
5. Nghe đối chứng các từ nghi vấn trước khi sửa xử lý giọng. Không đổi lại nhịp người kể chỉ vì ASR nhầm.

Giữ yêu cầu một lượt AI vẽ cảnh, review tùy cấu hình và cho phép người dùng tạo lại riêng cảnh. Không thêm chuỗi QA cứng cho cử chỉ, độ chi tiết, số giây hay các chi tiết trang trí.

## Bằng chứng

- Trang xem cảnh: [index.html](../scratch/bat-gao-audit-20261029/index.html).
- 12 cảnh: `scratch/bat-gao-audit-20261029/board-1.jpg` đến `board-3.jpg`.
- Cặp thời điểm: `scratch/bat-gao-audit-20261029/motion-pairs.jpg`.
- Dữ liệu: `summary.json`, `audio-audit.json`, `track-asr.json`, `motion-check.json` trong cùng thư mục audit.
