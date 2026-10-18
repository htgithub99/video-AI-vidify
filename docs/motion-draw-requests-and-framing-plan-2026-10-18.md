# Plan: tối ưu request vẽ (nhân vật, bối cảnh) và sửa khung hình sai theo style

Ngày: 2026-10-18 · Nền: nhánh `motion-style-fidelity-plan` (đã có `motionStyleConstraints`)

Nguyên tắc chung (giữ như các plan trước):
- Sửa global, áp dụng cho mọi style, không sửa riêng một video.
- Retry không kèm feedback, không dùng AI chấm ảnh.
- Không có comment trong `src/`; chuỗi literal đặt trong constants.
- Không có bộ style thì hành vi giữ nguyên như cũ.

---

## Phần A — Tối ưu số request vẽ nhân vật và bối cảnh

### A0. Hiện trạng (video 30 phút, đọc từ code)

| Phần vẽ | Lý tưởng | Thực tế có retry |
|---|---|---|
| Nhân vật (`designBible`, 4 người/request) | 2–3 | 3–5 |
| Bổ sung tư thế (`completeCastPoses`) | 0–4 | 2–8 |
| Bối cảnh (`designLocation`, 1 bối cảnh/request, ~12 bối cảnh) | 12 | 15–25 |
| **Tổng** | **14–19** | **20–38** |

Kích thước các khối prompt cố định:

| Khối | Số ký tự |
|---|---|
| `MOTION_GEN_DSL_GUIDE` | ~7.950 |
| `MOTION_GEN_DSL_EXAMPLE` | ~2.700 |
| JSON bộ style (kit mặt nạ) | ~11.400 (`DRAW_STYLE` chỉ gửi một phần) |

Ước tính một request bối cảnh dài khoảng 15–25 nghìn ký tự. Trong đó khoảng 10–11 nghìn là phần hướng dẫn và ví dụ lặp lại y nguyên ở mọi request.

Nguyên nhân tốn lượt:
- Mỗi bối cảnh một request.
- Phân cảnh có `place` lạ sinh ra bối cảnh mới (`withBeatPlaces`).
- Lỗi hình học nhỏ hoặc JSON lỗi thì bỏ cả bối cảnh.
- Không có trần lượt (`runMotionDrawTask` không có `maxAttempts`).

### Mục tiêu

Phần vẽ còn **5–8 request** cho video 30 phút, có **trần cứng** (mặc định 15). Mỗi request vẫn dưới khoảng **40 nghìn ký tự prompt** và đầu ra không bị cắt.

### A1. Bộ đếm request vẽ (làm trước để đo)
- Đếm theo nhóm: nhân vật, tư thế, bối cảnh. Ghi số lượt, số retry, độ dài prompt và độ dài trả lời của từng request.
- Log tổng kết cuối bước vẽ, ví dụ: `Vẽ: 6 request (nhân vật 2, tư thế 0, bối cảnh 4) · prompt TB 21k ký tự`.
- File: `motionDrawRoutingService.ts` (hook trong `runMotionDrawTask`), constants log mới.

### A2. Gộp bối cảnh trùng trước khi vẽ
- `withBeatPlaces`: place lạ được ghép vào place đã có nếu key hoặc tên gần giống (chuẩn hóa bỏ dấu, bỏ từ nối, so tập từ). Chỉ tạo bối cảnh mới khi không ghép được.
- Cùng nơi khác `time`/`weather` thì dùng một bối cảnh (staging đã hỗ trợ ghi đè `time` theo phân cảnh).
- Log danh sách đã ghép.
- Test: các cặp `san_nha`/`san_truoc_nha` được ghép; các nơi khác hẳn nhau không bị ghép nhầm.

### A3. Sửa lỗi nhỏ bằng code thay vì vẽ lại
- Quá nhiều bản sao: cắt bớt về đúng giới hạn.
- `def` sai tên hoặc không phải mảng: bỏ riêng `def` đó và các node tham chiếu tới nó.
- JSON bị cắt hoặc sai cú pháp: thử sửa (đóng ngoặc, bỏ dấu phẩy thừa) trước khi coi là hỏng.
- Chỉ vẽ lại khi `nodes` rỗng hoặc không đọc được gì.
- File: `motionGenService.ts` (`designLocation`), hàm sửa mới trong `src/lib/`. Không đổi validator của engine.

### A4. Gộp nhiều bối cảnh vào một request
- Prompt mới `MOTION_GEN_LOCATIONS_PROMPT`: phần DSL guide, ví dụ, ràng buộc style và DRAW_STYLE chỉ gửi một lần. Danh sách bối cảnh nằm ở cuối, trả về `{"locations":{key:{…}}}`.
- Chia nhóm theo ngân sách ký tự: mỗi nhóm 2–4 bối cảnh, tổng mô tả bối cảnh trong nhóm ≤ 4 nghìn ký tự, tổng prompt ≤ ~40 nghìn.
- Bối cảnh bị thiếu hoặc lỗi trong câu trả lời gộp thì chỉ vẽ lại riêng bối cảnh đó bằng prompt đơn như hiện tại.
- Vẽ lại theo ghi chú người dùng (`o.note`) vẫn dùng prompt sửa đơn.
- Thứ tự: bối cảnh dùng cho nhiều phân cảnh được vẽ trước.

### A5. Gộp nhân vật và tư thế
- `BIBLE_BATCH` thành cấu hình theo ngân sách ký tự, khoảng 6–8 nhân vật mỗi request khi mô tả ngắn.
- Yêu cầu đủ tư thế cần dùng ngay lúc vẽ nhân vật (đã có `needs`). Tư thế còn thiếu ưu tiên dùng tư thế sinh bằng code. Chỉ gọi AI bổ sung khi code không sinh được.

### A6. Trần cứng và phương án dự phòng
- Thêm cấu hình `MOTION_DRAW_BUDGET` (mặc định 15 request cho phần vẽ), chia theo nhóm.
- Bối cảnh hết lượt: dựng bối cảnh đơn giản bằng code theo style constraints (màu nền, sàn, tường lấy từ palette kit, phối cảnh theo kit) và ghi rõ trong log.
- Nhân vật hết lượt: dùng hình mẫu tối giản theo kit (đầu, thân, màu mặt, các bộ phận có trong kit).
- `runMotionDrawTask` nhận `maxAttempts` cho từng việc.

### A7. Test
- Đếm request bằng `ai` giả lập: kịch bản 12 bối cảnh có trùng sẽ ra ≤ 5 request bối cảnh.
- JSON bị cắt được sửa; câu trả lời gộp thiếu một bối cảnh thì chỉ vẽ lại bối cảnh đó.
- Vượt trần thì dùng bản dự phòng, không vượt số request cấu hình.
- Không có kit thì prompt đơn giữ nguyên như cũ.

---

## Phần B — Sửa ảnh sai (c1_b3, c1_b4, c1_b7) — đã đối chiếu với `motion-gen.json` thật

### B0. Kết quả phân tích dữ liệu thật

Thiết kế nhân vật (`gen.cast`: `di_tu`, `ong_noi`, `liet_si_thanh`) **đúng theo kit**:
- màu thân `#6b5a3a`, `#5a6068`, `#7b6a4f`;
- mặt `#eef3f6`;
- mọi chất liệu đều `unlit`;
- không tóc, mũi, tai, bàn tay, chân;
- không có nhãn áo.

Vậy lỗi không nằm ở màu do AI chọn, mà ở **cách AI dựng viền** và **cách engine canh khung**.

**Lỗi 1 — thân và tay bị đen, có vệt sáng, có "váy xám" (cả 3 ảnh):**

AI tự vẽ viền bằng cách đặt một khối đen to hơn ngay sau khối màu:

| Khối | Hình | Bán kính | Vị trí z | Mặt trước tại z |
|---|---|---|---|---|
| Viền thân (`line`) | capsule | 0,30 | −0,02 | **0,28** |
| Thân (`top`) | capsule | 0,28 | 0 | **0,28** |
| Viền tay (`line`) | capsule | 0,08 | −0,005 | **0,075** |
| Tay (`top`) | capsule | 0,066 | 0 | 0,066 |
| Đáy thân (`top_low`) | capsule | 0,28 | +0,005 | **0,285** |

Với khối tròn (capsule), khối viền to hơn nhô ra trước bằng hoặc hơn khối màu:
- Thân: viền và thân cùng mặt trước tại z = 0,28 nên chồng hình (z-fighting). Thân hiện đen, lốm đốm.
- Tay: viền nằm hẳn trước tay, nên tay đen, chỉ lộ vệt màu ở mép. Đó chính là "vệt sáng".
- Đáy thân (`top_low`, xám đậm) nhô trước viền, nên hiện thành "váy hoặc chân xám" ở c1_b7.
- Khi nhân vật quay ngang (c1_b3: `face` ±90) hoặc quay lưng (c1_b7: `face` 180), lệch z không còn tác dụng, nên khối viền đen che hết thân.

Cách vẽ viền này chỉ đúng với hình phẳng như disc (đầu, mắt vẫn ổn). Ngoài ra engine **đã tự vẽ viền cho mọi khối** (`gen-character.js:77–93`), nên viền AI vẽ vừa thừa vừa gây lỗi. Viền của engine lại đang tính theo **tỉ lệ kích thước khối** (`scale 1 + width`), nên khối nhỏ có viền rất mảnh, không ra được "viền dày đều" như kit yêu cầu.

**Lỗi 2 — khung hình, với số đo thật:**
- `ong_noi`: đầu ở y = 1,1, bán kính 0,44, nên đầu chiếm y 0,66–1,54, tức hơn **55% chiều cao cơ thể** (người thật khoảng 13%).
- c1_b4 là cảnh **medium** (không phải cận). `sizeShot` đo 60% trên cơ thể (`gen-scene.js:409`), mà đoạn này gần như chỉ là đầu, rồi phóng đoạn đó lên 60% khung. Cộng thêm `dolly_in 0,4`, đầu tràn hết khung. Tay giơ `salute` (xoay 145°) nằm cạnh mặt và bị đen do lỗi 1.
- c1_b3 là cảnh **close**, hai người: khung cận cố định 1,1 m, nhắm vào giữa đầu và không tính người thứ hai, nên hai cái đầu bị cắt ngang thân.
- c1_b7 là cảnh **wide**: khung đúng ý kit. Chỉ sai màu thân do lỗi 1.

### B1. Bỏ viền tự vẽ, dùng viền của engine (sửa lỗi 1)
- **Code (chính):** hàm mới `motionStripOutlineShells(design)` trong `src/lib/`, chạy trong `designBible` và khi nạp nhân vật đã lưu (để sửa luôn các project cũ như project này).
  - Nhận diện "vỏ viền": cùng part, cùng loại hình với một khối khác, màu bằng `outlineColor` hoặc rất tối, kích thước lớn hơn ≤ 25%, tâm lệch ≤ 0,05.
  - Xóa các vỏ viền này. Đầu, mắt dạng disc phẳng giữ nguyên vì không lỗi.
- **Prompt:** thêm luật "The renderer outlines every shape automatically with the kit's line weight; never add enlarged dark copies behind shapes as outlines" vào prompt nhân vật và bối cảnh.
- **Engine viền dày đều:** đổi viền nhân vật từ phóng theo tỉ lệ sang **độ dày tuyệt đối**: đẩy đỉnh theo pháp tuyến một khoảng `outlineWidth`, khối phẳng dùng độ dày tương đương. Như vậy tay nhỏ và thân to có viền dày như nhau.
- **Kiểm tra bằng code sau khi vẽ:** với mỗi khối màu của nhân vật, nếu có khối đen nằm trước nó từ hướng camera thì ghi issue và tự xóa khối đen đó.
- **Bối cảnh:** áp dụng cùng quy tắc cho bối cảnh. `san_gach` cũng dùng vật liệu `line`, và có `lamp_glow` dù kit cấm glow. `lamp_glow` sẽ bị bỏ theo danh sách hiệu ứng cấm đã có từ patch style fidelity.

### B2. Canh khung theo đầu thật của nhân vật (sửa lỗi 2)
- Hàm `GEN.framingOf(actor)`: lấy hộp bao part `head` (anchor) và cả thân, suy ra `headTop`, `headBottom`, `headH`, `bodyH`.
- Khung theo cỡ cảnh:
  - `close`: đỉnh đầu (+8% headroom) đến `headBottom − 0,35·bodyBelowHead`, không cắt quá 70% thân.
  - `medium`: đỉnh đầu đến giữa phần thân dưới đầu.
  - `extreme_close`: chỉ khuôn mặt.
  - `wide`: toàn thân.
- Thay `span` cố định (`gen-scene.js:259`) và mốc 0,65/0,4 (`gen-scene.js:409`) bằng khung trên. Ở 2D, thay mốc 45% (`gen-scene.js:1272`).
- Nhắm sao cho đầu nằm ở nửa trên khung, không nhắm giữa đầu.
- Nhân vật tỉ lệ người thật phải cho khung gần như cũ (test so sánh, lệch ≤ 10%).

### B3. Cảnh nhiều người, dolly và lùi camera
- Khung cận và trung tính theo khoảng cách ngang giữa các nhân vật trong khung.
- `dolly_in` không được đẩy camera vượt khung `close` của nhân vật (giới hạn `amount` theo khung tính được).
- Cảnh cận được lùi camera khi đầu hoặc thân tràn khung, tối đa tới cỡ `medium`, và ghi issue.

### B4. Gợi ý camera từ kit
- `motionStyleConstraints.framing` đọc `kit.camera`. Kit này ghi "heads fill the top half, torsos cropped at the bottom" cho cảnh cận và "characters small at the bottom" cho cảnh rộng.
- Đưa vào `gen.style.framing` để engine chỉnh mốc dưới của khung cận và vị trí nhân vật trong cảnh rộng.

### B5. Sửa project cũ không cần vẽ lại
- Khi mở project đã có (như "Người Con Anh Hùng"), tự chạy `motionStripOutlineShells` cho `gen.cast` và `gen.locations` rồi dựng lại cảnh. Không tốn request AI.

### B6. Test
- Dùng `motion-gen.json` thật làm fixture (chỉ giữ cast, locations, staging của c1_b3, c1_b4, c1_b7).
- Sau khi xóa vỏ viền: không còn khối đen nào nằm trước khối màu từ hướng camera, kể cả khi `face` là 0, 90, −90, 180.
- Khung c1_b4 (medium, đầu to): đỉnh đầu nằm trong khung, đầu chiếm 30–50% chiều cao khung, thấy được thân.
- Khung c1_b3 (close, hai người): cả hai đầu nằm trọn trong khung, đầu ở nửa trên.
- Khung với nhân vật người thật: lệch ≤ 10% so với cũ. Chạy cả 2D và 3D.
- Viền tuyệt đối: tay và thân có độ dày viền bằng nhau (± 1 px ở 960 px).
- Render 3 cảnh trước và sau bằng Playwright, đính kèm ảnh so sánh.

## Thứ tự triển khai

1. B1 + B5: bỏ viền tự vẽ, viền engine dày đều, sửa luôn project cũ (lỗi thấy rõ nhất: thân và tay đen).
2. B2–B3: khung hình theo đầu thật.
3. A1: bộ đếm request.
4. A2–A3: gộp bối cảnh trùng, sửa lỗi nhỏ bằng code.
5. A4–A5: gộp request.
6. A6: trần và phương án dự phòng.
7. B4: gợi ý camera từ kit.
8. A7, B6: test và render so sánh, xuất patch.

## Rủi ro
- Request gộp dài hơn nên dễ bị cắt hoặc hết thời gian chờ. Giảm rủi ro bằng ngân sách ký tự và chỉ vẽ lại phần thiếu.
- Ghép bối cảnh có thể ghép nhầm hai nơi khác nhau. Chỉ ghép khi độ giống cao và luôn ghi log.
- Đổi khung camera ảnh hưởng mọi style. Có test so sánh với nhân vật người thật để không làm lệch các video cũ.
- Xóa vỏ viền có thể xóa nhầm một khối tối có chủ ý (ví dụ cổ áo đen). Chỉ xóa khi cùng loại hình, lớn hơn ≤ 25% và gần như đồng tâm với một khối khác.
- Viền tuyệt đối cần pháp tuyến. Hình extrude hoặc stroke phẳng dùng cách khác (polygon offset hoặc vẽ đường viền 2D).

## Dữ liệu đã có
- `motion-gen.json` (cast, locations, staging) của project "Người Con Anh Hùng" đã xác nhận nguyên nhân B0.
