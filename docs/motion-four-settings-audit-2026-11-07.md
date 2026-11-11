# Audit bốn cấu hình Video Motion — 07/11/2026

## Phạm vi và kết luận

Ảnh người dùng: Remotion, kiểu hình Lịch sử, thể loại Phán quyết, thời lượng khoảng 2 phút, tiếng Anh, cách kể Sinh động, một giọng, nhịp đổi hình Thưa khoảng 14 giây/hình.

Đã lần theo UI → request → analysis → prompt viết → biên tập → phân cảnh → compiler/timeline. Đọc 57 production có kịch bản và kiểm lại prompt/hành vi writer hiện tại bằng 12 tổ hợp bốn thể loại × ba cách kể với phản hồi fixture. Không gọi AI/TTS thật, không thay runtime hoặc production nguồn.

| Cấu hình | Kết luận hiện tại |
| --- | --- |
| Thể loại | Giá trị đi đúng vào backend và prompt. Nội dung hướng dẫn có các ràng buộc cứng và mâu thuẫn giữa bước phân tích và viết; riêng Phán quyết đang quá nhiều thủ tục cho bản 2 phút. |
| Cách kể | Ba option thực sự chọn ba bộ chỉ dẫn khác nhau. Đây là chỉ dẫn prompt và cách giãn nguồn/khoảng nghỉ; không phải cơ chế bảo đảm hấp dẫn/kịch tính. Một phần khác biệt bị chìm dưới hợp đồng thể loại chung. |
| Thời lượng | Có tính ngân sách lời theo tốc độ đọc, nhưng lệch lớn vẫn được chấp nhận. Bước sau TTS chỉ cần audio có thời lượng dương để tiếp tục; không đưa tổng về gần mốc chọn. |
| Nhịp đổi hình | Giá trị 14/9/6 được truyền đúng tới prompt phân cảnh, nhưng là gợi ý mềm và không đi vào prompt viết nhịp ban đầu. Luật một ý/một hình và đổi góc/chủ thể làm tăng số cảnh. Kết quả lưu không nhất quán. |

## 1. Bằng chứng từ production đã lưu

| ID | Chọn | Cách kể / nhịp | Giọng đã lưu | Cảnh | Phạm vi kết luận |
| --- | --- | --- | --- | --- | --- |
| `52e7f8ca40b832a39fc5ea8eb8487d0b` | 120 giây | lively / medium | 223,637 giây | 34 cảnh, compiled 223,667 giây | Production completed; timeline trung bình 6,58 giây/hình thay vì khoảng 9. Không xuất lại MP4 trong audit này. |
| `afb14c2591179aa5b0c2c5600de29cd2` | 120 giây | lively / few | 179,774 giây | 29 cảnh đã lập | Lượt cancelled, chưa có compiled cuối. Tỉ lệ tổng giọng/số cảnh khoảng 6,20 giây, không phải đo frame của video đã xuất. |
| `77a73efcd86bce887cd4e3368d7aa06a` | 120 giây | lively / few | 256,903 giây | 19 cảnh đã lập, 14 cảnh có composition | Lượt gần nhất trùng cấu hình ảnh, status error, chưa xuất hoàn chỉnh. Tỉ lệ giọng/số cảnh khoảng 13,52 giây khá gần nhịp Thưa; không được kết luận đã có video đúng nhịp toàn bộ. |
| `f23221404611151c1a4d1e9a00c2f3fa` | 120 giây | gripping / medium | 213,592 giây | 18 cảnh đã lập | Status error, chưa có compiled cuối. Không dùng nó để kết luận gripping tốt hơn/kém hơn lively. |
| `f82fe2c76c1ab22004a52e6147acdf2c` | 720 giây | lively / medium | 671,594 giây | 98 cảnh; compiled 671,6 giây | Có trường hợp thời lượng khá gần mốc chọn: lệch khoảng -6,7%. Nhịp trung bình 6,85 giây/hình, 24/98 cảnh dưới 6 giây. |

Các record có thể được sinh dưới phiên bản prompt khác nhau. Chúng chứng minh trải nghiệm đã xảy ra, không phải benchmark A/B kiểm soát cùng model/phiên bản/nguồn. Những kết luận về code hiện tại bên dưới được đối chiếu source và probe mới riêng.

Trong record mới nhất, cả input, analysis, script và remotion state đều lưu `pacing=few`; input/analysis đều lưu `verdict` và `lively`. Không có bằng chứng các nút bị gửi nhầm giá trị trong record này.

## 2. Thể loại: đúng đường truyền nhưng đang bị đóng khuôn

### F1 — Phán quyết có hợp đồng số ứng viên và cấu trúc mâu thuẫn

- `src/constants/motionVerdictStory.ts`: kế hoạch yêu cầu ít nhất hai ứng viên, một chương mở, mỗi ứng viên một chương, một chương kết.
- `src/constants/motionGenres/verdict/rules.ts:13`: hợp đồng đưa vào writer yêu cầu ít nhất ba ứng viên.
- `src/constants/motionWriting.ts:4` và `src/lib/motionWriting.ts:7`: riêng verdict bị đặt tối thiểu bốn chương, kể cả chọn 120 giây. Các thể loại khác ở 120 giây nhận gợi ý một chương từ helper này.
- Nếu thực hiện đúng yêu cầu ba ứng viên + mở riêng + kết riêng thì cần tối thiểu năm chương, trong khi hàm lại gợi ý bốn. AI phải tự quyết định bỏ, gộp hoặc nhồi nội dung.
- Stage opening/candidate/verdict đều có `SOLO=true`, và chỉ dẫn stage yêu cầu các stage SOLO có chương riêng, giảm khả năng rút gọn cho bản ngắn.

Trong record mới nhất, phần kết còn gánh thêm nội dung ứng viên “Phalanx Crossing and Mercenary Annihilation”, trong khi hai chương giữa mới là hai candidate stage. Đây phù hợp với tình trạng kế hoạch bị dồn cấu trúc; không tự suy ra đây là lỗi sự kiện lịch sử.

### F2 — Mở đầu được chỉ đạo khác nhau giữa phân tích và viết

- Profile ở `motionVerdictStory.ts` yêu cầu 2–4 nhịp cold open rồi mới đặt câu hỏi.
- Contract writer ở `motionGenres/verdict/rules.ts:12` yêu cầu câu hỏi và stakes ngay dòng đầu.
- Cả hai là chỉ dẫn có thật, áp ở hai bước khác nhau. Kế hoạch cold open có thể bị hợp đồng viết sau đó lấn át.

### F3 — Quá nhiều thủ tục bắt buộc trong từng chương

Phán quyết yêu cầu lặp cấu trúc mốc ngày/địa điểm → kể sự việc → hỏi lại → trả lời → nhãn phán quyết → câu nối. Mở đầu còn giới thiệu tiêu chí/phương pháp và cuối video nhắc lại nhãn từng ứng viên.

Đây là kỹ thuật hợp lệ cho video dài, nhưng source chưa có biến thể gọn theo thời lượng ngắn. Khi mọi phần đều được coi phải giữ, AI dễ ưu tiên thủ tục thay vì tình huống, mâu thuẫn và diễn biến.

Trong opening đã lưu có câu “We will weigh each moment by our criterion…”. Việc kể theo tiêu chí/nhãn thực sự xuất hiện, không phải chỉ có trong metadata. Nhận xét rằng nó có thể tạo cảm giác thuyết trình là đánh giá biên tập, không phải kết luận đo bằng máy.

Các thể loại khác cũng có khung spine, motifs, giới hạn câu và stage riêng. Không thấy chúng bị ánh xạ sang một thể loại khác. Tuy nhiên audit này không sinh tác phẩm AI mới để chứng nhận chất lượng ngôi kể/kịch tính của toàn bộ bốn thể loại.

**Đề xuất:** thống nhất một hợp đồng thể loại dùng xuyên phân tích–viết–biên tập; chọn số ứng viên và số phần theo nguồn/thời lượng; giữ câu hỏi, so sánh công bằng và phán quyết, cho phép rút gọn các thủ tục ở bản ngắn. Giữ nguyên yêu cầu không bịa sự kiện/số liệu/lời nói của người có thật; đó không phải nguyên nhân cần loại bỏ để tạo kịch tính.

## 3. Cách kể: option có tác dụng nhưng không tương đương mức hấp dẫn được bảo đảm

Nguồn: `src/constants/motionStorytelling.ts`, `src/lib/motionStorytelling.ts`, `motionStoryService.ts:2042–2061`.

| Option | Hook bổ sung | Texture được phép sau sự kiện | Khoảng nghỉ kịch tính | Giãn nguồn ngắn đối với verdict |
| --- | --- | --- | --- | --- |
| Bám sát nguồn (`plain`) | off | 0 | tắt phần dramaticAudio | ×1 |
| Sinh động (`lively`) | light | tối đa 1 nhịp | bật | ×1,5 |
| Cuốn hút tối đa (`gripping`) | full | tối đa 2 nhịp | bật, khoảng nghỉ dài hơn | ×2 |

POV/witness có mức giãn ×2,5/×3; chronicle ×1,2/×1,5. Vì thế cùng option cách kể còn thay đổi khả năng kéo dài theo thể loại, không chỉ thay văn phong.

Probe writer hiện tại xác nhận đủ 12 tổ hợp: plain không nhận prompt retention/texture bổ sung; lively nhận retention light và texture; gripping nhận retention full và texture. Giá trị chọn không bị mất.

### F4 — Các mức vẫn dùng chung khung kể cứng và chưa có phân cấp ưu tiên rõ

- Khung thể loại, số chương và thủ tục phán quyết vẫn áp dụng cho cả ba mức.
- “Cuốn hút tối đa” bổ sung các kỹ thuật cụ thể như một dự đoán của người kể, callback cuối, so sánh và recap căng thẳng. Nó không thay thế khung dài bằng một kết cấu hấp dẫn phù hợp 120 giây.
- `motionHookFindings` chủ yếu tìm nhãn `hook=open/close` và một số quy tắc hình/câu hỏi. Thiếu vòng mở/đóng được ghi log. Có nhãn không chứng minh nội dung thực sự tạo tò mò hoặc giải tỏa đúng lúc.
- Trong fixture writer, tất cả 12 phản hồi không có hook vẫn được nhận ở bước viết. Đây chỉ chứng minh hook không phải gate writer; bước biên tập có thể ghi nhận/góp ý sau đó. Không dùng fixture này để đánh giá văn hay/dở.

**Đề xuất:** thời lượng quyết định ngân sách; thể loại quyết định cơ chế kể; cách kể quyết định cường độ và cách dùng kỹ thuật trong cùng ngân sách. Lively/gripping cần hướng dẫn cụ thể về stakes, chuỗi nguyên nhân–hệ quả, vị trí giấu/tiết lộ thông tin, chuyển biến và payoff. Không giải quyết bằng thêm bộ chấm hấp dẫn vào runtime.

## 4. Thời lượng: có ngân sách đầu vào nhưng không được giữ gần mục tiêu

### F5 — Mục tiêu có thể bị giảm trước khi viết

`resolveTargetSeconds` ở `motionStoryService.ts:254` lấy min giữa thời lượng chọn và độ dài nguồn nhân hệ số giãn, với các ngoại lệ cho brief/mốc ngắn.

Probe bằng helper thật, nguồn transcript 40 giây và chọn 120 giây:

| Cách kể / verdict | Mục tiêu helper trả |
| --- | --- |
| plain | 40 giây |
| lively | 60 giây |
| gripping | 80 giây |

Trong case ảnh, nguồn khoảng 897 giây nên clamp này không phải nguyên nhân làm dài hơn 120 giây. Đây là vấn đề khác ở các nguồn ngắn.

### F6 — Vượt ngân sách lời vẫn được nhận

Writer có ngân sách theo `seconds × speechRate`, trừ một phần khoảng nghỉ. Có tính tốc độ đã đo theo kênh giọng và hệ số an toàn khi chưa đo.

Nhưng ở `motionStoryService.ts:2208`, lệch ngoài khoảng 65–135% chỉ ghi log rồi giữ lời kể. Không có bước đưa tổng lời về gần mục tiêu trong lượt viết bình thường.

Probe trực tiếp writer: yêu cầu một chương 30 giây, tốc độ 2,4 đơn vị/giây. Fixture trả 192 đơn vị, tương đương 80 giây; tất cả 12 tổ hợp đều được nhận sau đúng một callback, chỉ có cảnh báo. Không có lời gọi provider thật.

### F7 — Điều kiện sau TTS chỉ kiểm thời lượng dương

`motionProductionService.ts:532`:

```ts
const durationFits = () => Number.isFinite(result.voice!.totalSeconds) && result.voice!.totalSeconds > 0;
```

Hàm không so với `targetSeconds`. Vì vậy vòng mang tên duration repair không được kích hoạt chỉ vì audio dài gấp đôi mốc chọn; cuối luồng có thể ghi cảnh báo rồi dùng timeline giọng thực.

Lượt mới nhất có 626 đơn vị lời, giọng 256,903 giây, tương đương khoảng 2,44 đơn vị/giây. Tốc độ này phù hợp bản đo trong log. Sự lệch lớn xuất hiện ở lượng lời, không có căn cứ quy hết cho TTS đọc quá chậm.

**Đề xuất:** giữ riêng `selectedTargetSeconds`, mục tiêu khả thi theo nguồn và thời lượng audio thực; không âm thầm coi chúng là một. Phân ngân sách tổng và từng phần từ tốc độ giọng, dành trước phần pause/hook/kết. Giải quyết lượng lời ngay trong viết/phân cảnh và biên tập có sẵn, không thêm QA ảnh hoặc kéo tốc độ giọng để ép về mốc. Có thể lấy khoảng ±10% làm mục tiêu thiết kế cần thống nhất, chưa coi đó là hành vi hiện đã có hoặc bảo đảm mọi phản hồi đầu đạt.

## 5. Nhịp đổi hình: đúng giá trị nhưng khác điều người dùng có thể hiểu

### F8 — Nhịp không điều khiển cách viết hình ngay từ đầu

- UI gửi `few/medium/many`, backend giữ đúng.
- Writer `CHAPTER_SCENES` yêu cầu “ONE BEAT = ONE SPOKEN IDEA = ONE PICTURE”, tối đa hai câu ngắn, đổi hành động/thời điểm có thể thành nhịp mới.
- Cũng trong prompt writer, `CHAPTER_LENGTH_RULE` lại nói nhiều câu có thể chung một beat/utterance/picture. Cả hai câu hiện cùng xuất hiện trong đủ 12 prompt probe.
- Prompt viết không có chỉ dẫn `Visual pacing` theo lựa chọn; chỉ đến phân cảnh mới ghép 14/9/6 vào context.
- Prompt phân cảnh yêu cầu đổi hình khi thay shot, subject, điểm nhấn, cảm xúc, vật hoặc manh mối. Các yêu cầu này dễ thắng gợi ý giữ hình lâu.

### F9 — 14/9/6 là gợi ý và thời gian tính chưa phải giọng thực

- `motionScenePacing.ts:42` ghi rõ SOFT guidance, không quota/gate.
- `scenePipeline.ts:297` chỉ ghi nhận khi AI chia quá số hình gợi ý.
- `motionBeatVisualSeconds` tính từ số đơn vị lời chia tốc độ mặc định ngôn ngữ; không dùng trực tiếp các khoảng giọng thật đã có.
- Few và medium dùng cùng giới hạn nhóm 60 giây / 12 beat / 48 line nếu cùng địa điểm; khác chủ yếu ở prompt và điều kiện giữ địa điểm.
- Compiler lấy các ranh giới cảnh đã lập và gắn thời gian lời thật; không tự đưa mỗi cảnh về 14/9/6 giây.
- Chỉ các cảnh có signature giống hệt mới được `mergeEquivalentRemotionDrafts` gộp. Signature gồm purpose, nodes, motionIntent, actionPlan, nên đây không phải bộ gộp ngữ nghĩa cho nhịp Thưa.

Các record gần đây cho thấy few có thể ra 29 cảnh/~180 giây hoặc 19 cảnh/~257 giây. Bản mới nhất gần 14 giây về tỉ lệ tổng, nhưng chưa xuất thành công; không thể gọi toàn bộ lựa chọn nhịp đã được nghiệm thu đúng.

**Đề xuất:** truyền nhịp ngay vào viết và phân cảnh, tách beat lời đọc khỏi scene hình. Một Canvas có thể chứa nhiều câu và diễn biến liên tiếp. AI lập nhóm lời cho mỗi hình theo nhịp chọn và chuyển cảnh thực sự cần thiết; compiler gắn các nhóm đó với mốc audio. Với 120 giây, mục tiêu tham khảo là khoảng 9/13/20 hình cho few/medium/many, có ngoại lệ theo nội dung. Không dùng code gộp máy móc các nodes/actionPlan khác nhau để đạt con số.

## 6. Ưu tiên sửa trong kế hoạch HTML Canvas

1. Thống nhất hợp đồng thể loại, đặc biệt số ứng viên, cold open và cấu trúc bản ngắn. Bỏ gán một ý lời đọc thành một hình bắt buộc.
2. Phân ngân sách thời lượng rõ ngay ở phân tích/viết; cách kể sử dụng cùng ngân sách thay vì tự làm nở số phần và lượng lời.
3. Đưa cả genre, storytelling, target duration và picture pacing vào dữ liệu tác giả của mẫu 0–4. Mỗi trường có trách nhiệm rõ, không nối nhiều bộ quy tắc mâu thuẫn.
4. AI phân cảnh trả các phạm vi lời dùng chung một Canvas theo nhịp; runtime chỉ thực thi timeline, không chấm hay sửa hình.
5. Giữ snapshot cấu hình theo lượt. Resume dùng cấu hình đã lưu; đổi UI không có nghĩa kịch bản/cảnh cũ đã được viết lại.

Việc thay renderer sang HTML Canvas tự nó không sửa được các vấn đề viết kịch bản này. Cần đưa chúng vào cùng đợt thay luồng, trước khi bật cơ chế mới làm mặc định.

## 7. Bằng chứng audit

- `scratch/motion-four-settings-audit-20261107/inspect.ts`: đọc production, tính metric và gọi các helper cấu hình thuần dữ liệu.
- `scratch/motion-four-settings-audit-20261107/evidence.json`: metric 57 production và các trường hợp cấu hình.
- `scratch/motion-four-settings-audit-20261107/probe.ts`: gọi writer thật với callback fixture, cô lập storage; không gọi provider.
- `scratch/motion-four-settings-audit-20261107/probe-results.json`: 12 tổ hợp, clamp mục tiêu và kết quả thử compile preview.
- `scratch/motion-four-settings-audit-20261107/prompt-*.txt`: prompt thực tế writer ghép cho từng tổ hợp.

Ba lần thử compile preview các record gần nhất đều bị chặn bởi cảnh/spec chưa hoàn tất hoặc không hợp lệ; không có video mới từ các lần thử đó. Audit dùng duration audio đã lưu và compiled spec đã tồn tại khi có; không trình bày chúng như kết quả xuất mới.

Không thay code sản phẩm, không gọi AI/TTS mới, không chạy trình duyệt và không ghi vào production nguồn. Chỉ thêm tài liệu và dữ liệu audit riêng.
