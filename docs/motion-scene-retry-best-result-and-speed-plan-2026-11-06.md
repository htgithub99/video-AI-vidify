# Plan v2: Tối giản quy trình, chạy song song tối đa, dùng hết 5 room vẽ, retry giữ bản tốt nhất

Ngày lập: 06/11/2026. Trạng thái: **đã triển khai một phần** — xem mục 11 (đã làm, kiểm chứng, phần còn lại).
Kế thừa: `motion-script-authored-motion-implementation-2026-11-06.md`, `motion-detailed-action-authoring-2026-11-06.md`, `motion-workflow-latency-audit-2026-11-06.md`.

Mục tiêu: video đúng cấu hình người dùng chọn, không lỗi kỹ thuật, hình và chuyển động đúng hành động trong kịch bản. Video 17 phút giảm từ khoảng 5 giờ xuống khoảng 2–2,5 giờ.

Nguyên tắc chung:
1. **AI chỉ làm phần sáng tạo**: viết kịch bản, phân cảnh/hành động, vẽ cảnh. Không dùng AI cho việc kiểm, sửa định dạng hay tính toán.
2. **Code làm phần xác định được**: chuẩn hóa ID/JSON, chấm điểm, timing, ghép, kiểm cấu hình, và sửa lỗi kỹ thuật không đổi nội dung.
3. **Không bước nào chờ khi đã đủ đầu vào**: điều phối theo dependency, không theo phase cứng.
4. **Room không được rảnh khi còn việc**.

---

## 0. Hiện trạng đo được

Lượt chạy gần nhất trên UI: 7 bước, Xuất video **7012 giây (~117 phút)**, file 386 MB.

Điều phối thực tế trong code:

| Bước | Code | Chạy thế nào hiện nay | Vấn đề |
| --- | --- | --- | --- |
| 1. Phân tích DNA | `step(ANALYZE)` | Tuần tự | Hợp lý (mọi bước phụ thuộc nó) |
| 2. Kịch bản | `step(SCRIPT)` | Theo chương, rồi biên tập toàn bộ | Phải xong **toàn bộ** mới bắt đầu giọng và phân cảnh |
| 3. SEO | `startSeo()` | Song song từ đầu buildMedia | OK, nhưng chiếm room nội dung (37 phút, nhiều recovery) |
| 4a. Phân cảnh | `planGroup` trong `mapMotionAiPool(..., 5, DRAW)` | 5 lane, nhưng request dùng `mainExec` → qua `acquireProviderGate` **chỉ có 2 worker** (`WORKER_IDS`) | **Phân cảnh bị nghẽn ở 2 room**, 5 room vẽ ngồi chờ |
| 4b. Object sheet | `await ensureSheet()` mỗi group | Chặn trước khi vẽ group | Thêm 1–2 request AI trên đường găng |
| 4c. Vẽ | `drawingSlots` 5 room | Cảnh mẫu (anchor) của mỗi địa điểm phải vẽ **xong** thì cảnh khác cùng địa điểm mới được vẽ | Đầu job và mỗi địa điểm mới đều có giai đoạn chỉ 1–2 room chạy |
| 4d. SFX | `directMotionSound` cuối `buildRemotionScenes` | Sau khi vẽ xong 100% | Đuôi 10–15 phút |
| 5. Giọng | `step(VOICE)` | Song song với 4 | OK |
| 6. Compile + render | `renderRemotionVideo` | Sau khi tất cả xong, 1 render toàn video, `concurrency` tới 8 worker | **~117 phút**, không chồng lên bước nào |
| — | Duration repair | Vòng viết lại kịch bản → giọng → cảnh | Hiện chỉ chạy khi thời lượng ≤ 0; vẫn còn code vòng lặp |

Kết luận: đường găng hiện là **Kịch bản → Phân cảnh (2 room) → Vẽ (bị anchor làm tuần tự từng phần) → SFX → Render 117 phút**. Gần như không có chồng lấn.

---

## 1. Quy trình mục tiêu (dependency graph, không theo phase cứng)

```
Phân tích DNA (AI, room nội dung)
   │
   ▼
Kịch bản theo chương (AI, room nội dung) ── chương k xong + biên tập chương k ──┐
   │                                                                              │
   ├──► Giọng chương k (TTS, CPU) ─────────────────────────────┐                 │
   ├──► SEO (AI, room nội dung, ưu tiên thấp, khi rảnh)        │                 │
   ├──► SFX từ script + timing (AI, room nội dung, khi rảnh)   │                 │
   └──► Phân cảnh nhóm cảnh (AI, ROOM VẼ, 5 room) ──► Vẽ cảnh (AI, ROOM VẼ) ──► │
                                                         │                       │
                                         Chấm điểm (code) + retry ≤ 2           │
                                                         ▼                       ▼
                                  Render clip từng cảnh (CPU) khi có hình + timing giọng
                                                         │
                                                         ▼
                                 Ghép clip + mix giọng/nhạc/SFX/phụ đề (ffmpeg) ──► Kiểm cấu hình (code) ──► MP4
```

### 1.1. Bảng song song: bước nào chạy chung với bước nào

| Bước | Bắt đầu khi | Chạy song song với | Tài nguyên |
| --- | --- | --- | --- |
| Phân tích | Ngay | — | Room nội dung |
| Kịch bản chương k | Phân tích xong; chương k-1 xong (để giữ mạch) | Giọng/phân cảnh/vẽ của các chương trước | Room nội dung |
| Giọng chương k | Chương k đã biên tập | Mọi bước AI | CPU/TTS |
| Phân cảnh nhóm | Chương chứa nhóm đã biên tập | Kịch bản chương sau, vẽ | **Room vẽ** (5) |
| Vẽ cảnh | Nhóm đã phân cảnh; cảnh mẫu địa điểm có **bản hợp lệ đầu tiên** (không cần chờ retry) | Phân cảnh nhóm khác, giọng, render | Room vẽ (5) |
| SEO | Kịch bản đủ | Tất cả | Room nội dung, khi rảnh |
| SFX | Kịch bản đủ + timing giọng | Vẽ, render | Room nội dung, khi rảnh |
| Render clip cảnh | Cảnh accepted + timing giọng của các dòng trong cảnh | Vẽ cảnh khác | CPU, số tiến trình tự điều chỉnh |
| Ghép + mix | Mọi clip + giọng + SFX + nhạc | — | ffmpeg |

Hai thay đổi lớn nhất:
- **Room vẽ dùng cho cả phân cảnh lẫn vẽ** qua một hàng đợi chung có ưu tiên. Không còn chờ 2 room nội dung phân cảnh trong khi 5 room vẽ rảnh.
- **Render cuốn chiếu theo cảnh**: render chồng lên lúc vẽ, không còn chờ 117 phút ở cuối.

### 1.2. Bỏ barrier "biên tập toàn bộ kịch bản xong mới làm tiếp"
- Kịch bản đã viết theo chương. Biên tập (editor pass) chạy theo chương ngay sau khi chương đó viết xong, với ledger sự kiện các chương trước làm ngữ cảnh.
- Chương đã chốt được phát sự kiện `chapterReady(k)` để giọng và phân cảnh của chương k bắt đầu ngay.
- Nếu biên tập chương sau buộc phải sửa chương trước (hiếm), chỉ beat bị sửa mới đổi hash; cảnh của beat đó bị vô hiệu và tự vẽ lại. Các beat khác giữ nguyên cache.
- Tiết kiệm: thời gian viết các chương còn lại (~20–30 phút) được chồng lên phân cảnh/vẽ.

---

## 2. Dùng hết 5 room vẽ

### 2.1. Hàng đợi room vẽ thống nhất
Thay `mapMotionAiPool(groups, plan → ensureSheet → anchor → vẽ)` bằng **một scheduler** giữ 5 room luôn bận:

```
DrawScheduler (5 slot = 5 room vẽ)
  queue ưu tiên:
    P0  vẽ cảnh mẫu (anchor) của địa điểm chưa có hình   ← mở khóa nhiều cảnh nhất
    P1  phân cảnh nhóm kế tiếp theo timeline               ← nuôi hàng đợi vẽ
    P2  vẽ cảnh thường (theo thứ tự timeline)              ← để render cuốn chiếu được sớm
    P3  retry lượt 2/3 của cảnh chưa đạt                   ← không chặn cảnh mới
  slot rảnh → lấy task ưu tiên cao nhất đã đủ dependency
```

- Phân cảnh chạy trên room vẽ với model của `mainExec` (tham số model/mức suy nghĩ theo request, không theo room). Nếu provider không cho đổi model trong cùng room, dành **1 trong 5 room** cố định cho phân cảnh khi còn nhóm chưa phân cảnh, rồi tự trả về cho vẽ khi hết.
- Bỏ giới hạn 2 worker (`WORKER_IDS`) cho phân cảnh trong `acquireProviderGate` khi task chạy trên room vẽ.
- Retry để ở P3 để không chiếm slot của cảnh mới; khi hàng đợi mới cạn thì retry tự lên chạy.
- Telemetry: `slotBusy%` mỗi room, thời gian chờ queue. Mục tiêu: **≥ 90% thời gian 5 room đều bận** trong phase vẽ.

### 2.2. Cảnh mẫu (anchor) không còn chặn cả địa điểm
- Hiện tại: cảnh khác cùng địa điểm chờ anchor **accepted**.
- Mới:
  - Anchor ưu tiên P0 nên mọi địa điểm có anchor sớm nhất có thể.
  - Cảnh khác chỉ chờ anchor có **bản render hợp lệ đầu tiên** (không chờ retry/chấm điểm xong).
  - Nếu địa điểm chưa có anchor trong khi room rảnh, cảnh không cần tham chiếu nền (cận cảnh, card, diagram, map, timeline) được vẽ trước.
- Continuity giữ nguyên: cảnh sau vẫn nhận `continuityNotes`/asset của anchor.

### 2.3. Object sheet không chặn đường găng
- `ensureSheet()` hiện được `await` trước khi vẽ mỗi group.
- Mới: sheet sinh **một lần** sau khi phân cảnh nhóm đầu tiên và chạy ở P1. Cảnh nào cần vật trong sheet thì chờ sheet; cảnh không dùng vật đặc thù thì vẽ ngay.
- Gộp yêu cầu sheet vào prompt phân cảnh (AI phân cảnh liệt kê luôn mô tả vật quan trọng) để bỏ hẳn 1–2 request AI riêng, nếu thử nghiệm cho thấy mô tả đủ ổn định.


---

## 3. Vẽ cảnh: hành động chi tiết → 1 request → retry ≤ 2, giữ bản tốt nhất

### 3.1. Đầu vào
- Viết kịch bản: `beat.motionIntent` (START / SUBJECT ACTIONS / INTERACTIONS / END / ENVIRONMENT-CAMERA).
- Phân cảnh: `scene.actionPlan` có cấu trúc. **Kiểm bằng code** (không gọi AI): `nodeId` tồn tại; mọi node hành động có mục; thú/xe/vật chở có `parts` cho chân/bánh. Sai thì AI phân cảnh sửa tối đa 2 lần, gửi danh sách lỗi cụ thể.
- Prompt vẽ: brief + actionPlan nguyên văn + mẫu nhận diện + thời lượng cảnh + **checklist tự kiểm** (mỗi subject có track, bộ phận chuyển động tương đối, trong khung, đủ thời lượng).

### 3.2. Retry

| Lượt | Khi nào | Cách gửi |
| --- | --- | --- |
| 1 | Luôn | Prompt đầy đủ |
| 2 | Lượt 1 lỗi kỹ thuật hoặc điểm < 80 | Sửa trong cùng room: gửi danh sách lỗi cụ thể, yêu cầu trả lại JSON hoàn chỉnh |
| 3 | Lượt 2 vẫn chưa đạt | Sinh lại sạch ở room rảnh bất kỳ: prompt đầy đủ + tóm tắt lỗi 2 lượt trước |

- Tối đa **3 request nội dung/cảnh**. Retry giao diện (Thử lại → 2 lần cùng room → đổi room) là tầng riêng, không tính lượt và không gửi trùng.
- Mọi phản hồi và điểm được lưu `requestKey#attempt`; resume đọc lại, không gửi lại.
- Hết lượt mà chưa đạt: **giữ bản điểm cao nhất render được**, trạng thái `accepted-with-warnings`, **không dừng production**.
- Chỉ `failed` khi cả 3 lượt đều không render được. Cuối phase có một vòng vẽ lại cảnh failed; vẫn lỗi thì báo danh sách và cho người dùng tạo lại từng cảnh.

### 3.3. Chấm điểm bằng code (< 1 giây/cảnh)
**Cổng kỹ thuật (bắt buộc):** schema JSON, SVG parse được, viewBox, ID (sau `normalizeSceneRenderIds`), target tồn tại, keyframe hợp lệ, giới hạn 96 track / 20 keyframe / 150.000 ký tự, không script/URL ngoài.

**Điểm 0–100:**

| Tiêu chí | Đo | Trọng số |
| --- | --- | --- |
| Phủ actionPlan | Mỗi `subjects[].nodeId` có track trên layer của nó/layer con | 30 |
| Phủ bộ phận | Subject có `parts` thì có track trên phần tử con khác nhau, không chỉ dịch nguyên cụm | 25 |
| Trong khung | Bounding box layer chính tại keyframe đầu/giữa/cuối nằm trong viewBox (parser transform/path, không Chrome) | 20 |
| Thời lượng | Track chính phủ ≥ 80% `duration`; một chiều không lặp sai | 10 |
| Nhận diện | `entityId` khớp cast; dấu hiệu đặc trưng của mẫu còn trong SVG | 10 |
| Tĩnh đúng chỗ | Node ghi đứng yên không có chuyển động lớn | 5 |

### 3.4. Sửa bằng code trước khi tính lượt retry (không đổi nội dung)
Các lỗi kỹ thuật sau được code tự sửa, **không** tốn lượt AI:
- ID trùng/không hợp lệ (đã có `normalizeSceneRenderIds`).
- JSON bọc markdown, dấu phẩy thừa, nháy kép trong attribute SVG.
- Thiếu `xmlns`, viewBox lệch kích thước → fit về viewBox chuẩn (đã có trong `normalizeFirstSceneComposition`).
- Keyframe không tăng dần → sắp xếp; giá trị `NaN` → bỏ đúng keyframe đó và ghi cảnh báo.
- Track trỏ tới ID đã được đổi tên → remap.

Chỉ lỗi về **nội dung** (thiếu subject, sai hành động, ra khung) mới dùng lượt AI.

---

## 4. Loại bỏ phần không còn dùng

| Thành phần | Trạng thái | Hành động |
| --- | --- | --- |
| `motionClipDirector.ts`, `motionCompositionMotion.ts` (AI đạo diễn motion riêng) | Không còn gọi từ pipeline Remotion; chỉ còn tham chiếu trong `motionSceneComposition.ts`/`motionRemotionPrompts.ts` | Gỡ nhánh đọc `composition.motion` cho cảnh mới; giữ hàm đọc dữ liệu cũ chỉ nếu checkpoint cũ còn dùng, rồi xóa module và prompt liên quan |
| `motionSceneReviewFrames.ts`, review frame QA, nút duyệt ảnh | Đã bỏ khỏi UI Remotion | Xóa module, prompt `REVIEW`, các field `reviewKey`, `crop`, `focus` cho cảnh mới |
| `compositionGeometryInspector.ts` (Chrome đo hình) | Pipeline vẫn nhận option `geometry` nhưng không dùng | Xóa option và `geometry?.close()`; thay bằng chấm khung bằng code (3.3) |
| Vòng quality redraw, deferred, recovery round (`QUALITY.ROUNDS`, `DEFER_ROUNDS`, `RECOVERY_ROUNDS`) | Phần đã stage còn, phần chưa stage đã gỡ | Gỡ hẳn hằng số, log và `qualityNote/qualityRedraws/deferred/failStreak/motionTried`; dọn dữ liệu cũ một lần khi đọc checkpoint (`clearLegacySceneFlags`) |
| `durationRepair` (viết lại kịch bản theo thời lượng) | Chỉ còn kích hoạt khi tổng thời lượng ≤ 0 | Thay bằng lỗi rõ ràng "giọng không hợp lệ"; xóa vòng lặp script → voice → scenes |
| `motionSceneQuality.ts` và hằng số QA cảnh | Kiểm lại người gọi | Xóa phần chỉ phục vụ redraw; giữ phần dùng cho thư viện (library mode) |
| Option `aiReview` truyền vào `scenesMotionStoryInput` cho Remotion | Không còn tác dụng | Bỏ khỏi request Remotion; giữ cho library mode |

Nguyên tắc: **chỉ xóa sau khi `git grep` xác nhận không còn người gọi** ngoài nhánh đã gỡ. Library mode và các engine khác giữ nguyên. Mỗi lần xóa đều chạy tsc và bộ test liên quan.


---

## 5. Render: phase lớn nhất (~117 phút)

| # | Tối ưu | Cơ chế | Điều kiện giữ chất lượng |
| --- | --- | --- | --- |
| R1 | **Render cuốn chiếu theo cảnh** | Cảnh accepted + đã có timing giọng thì render ngay thành clip riêng (cùng FPS/CRF/kích thước/codec), cache theo hash `scene + outputSettings + timing`. Cuối cùng concat `-c copy`, rồi mix audio/phụ đề một lần | So frame count và SSIM từng clip với render liền mạch; camera theo thời gian tuyệt đối; phụ đề/audio chỉ ghép ở cuối |
| R2 | **Concurrency theo đo thực** | Benchmark: 1 worker ~5,2 fps nhanh hơn 7 worker ~3,5 fps. Chạy N tiến trình render cảnh, mỗi tiến trình 1–2 worker; N tự chọn bằng đo 30 frame đầu, tự giảm khi room chat phản hồi chậm hoặc RAM thấp | Không đổi codec/CRF/FPS/độ phân giải |
| R3 | Cache clip | Vẽ lại 1 cảnh chỉ render lại clip đó; resume không render lại clip đã có | Hash gồm toàn bộ outputSettings |
| R4 | Vẽ theo timeline | Thứ tự P2 theo timeline để clip ra đều, ghép được sớm | Giữ dependency anchor |

---

## 6. Sửa các vấn đề đã phát hiện

| # | Vấn đề | Cách sửa |
| --- | --- | --- |
| F1 | Bước scenes lỗi thì hủy luôn voice đang chạy; test production-runner lúc đạt lúc lỗi | Không hủy voice khi scenes lỗi (chỉ hủy khi người dùng hủy/CAPTCHA/quota); test chờ voice xong trước khi assert. Chạy test 20 lần, đạt 20/20 |
| F2 | Một cảnh lỗi chặn cả production; cảnh `running` khi resume thành failed vĩnh viễn | Theo 3.2; `running` khi resume → đọc lại room/checkpoint, không có thì tính đã dùng 1 lượt và chạy tiếp |
| F3 | `"chat_planning_refusal_response"` viết cứng trong `chatRoomRecovery.ts` | Dùng `CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR` |
| F4 | Selector regenerate/menuitem viết cứng | Đưa vào `CHAT_ROOM_RECOVERY` |
| F5 | Tiêu đề prompt viết cứng trong `motionSceneActionBrief.ts` | Đưa vào `MOTION_SCENE_ACTION` |
| F6 | `motionSceneRenderIds.ts` dò CSS bằng `includes("#"+id)` | Regex có ranh giới ký tự |
| F7 | Code thừa trong `scenePipeline.ts` | Theo mục 4 |
| F8 | Chưa rõ UI có nút gửi `retryFailed` | Thêm nút "Vẽ lại cảnh lỗi/cảnh có cảnh báo" |
| F9 | Staged/unstaged chồng nhau, file mới chưa track, `.kilo/` | Commit theo cụm; `git add` đủ file; thêm `.kilo/` vào `.gitignore` |
| F10 | Tài liệu ghi production-runner "đạt" | Cập nhật sau F1 |
| F11 | UI chỉ báo "Hoàn tất", không có thời gian từng bước | Hiển thị thời lượng từng bước, số room bận, số cảnh đạt/cảnh báo/lỗi |

---

## 7. Bảo đảm đúng cấu hình người dùng
- Mọi bước dùng `outputSettings` chụp lúc tạo (đã có); cache clip hash theo snapshot này.
- Kiểm tự động video cuối bằng ffprobe: độ phân giải, FPS, aspect, quality/CRF, phụ đề bật/tắt, SFX/nhạc và volume, có audio stream, tổng frame = tổng thời lượng giọng × FPS (sai lệch ≤ 1 frame/cảnh). Sai thì không đánh dấu hoàn tất.
- Cảnh ngắn dưới 3 giây (như cảnh báo trên UI hiện tại) vẫn giữ mốc lời kể; liệt kê trong báo cáo.

---

## 8. Dự toán thời gian video 17 phút (~150 cảnh)

| Đoạn trên đường găng | Hiện tại | Sau tối ưu |
| --- | --- | --- |
| Phân tích | ~4 phút | ~4 phút |
| Kịch bản đến khi chương 1 sẵn sàng | ~35 phút (chờ toàn bộ) | ~8–10 phút; các chương sau chồng lên vẽ |
| Phân cảnh + vẽ 150 cảnh | ~105 phút (phân cảnh 2 room, anchor tuần tự) | ~70–85 phút (5 room bận ≥ 90%, retry ở P3) |
| SFX | ~15 phút ở đuôi | 0 trên đường găng |
| Render | ~117 phút sau khi vẽ xong | Chồng lên vẽ; đuôi ~10–15 phút cho các cảnh cuối |
| Ghép + mix + kiểm | ~6 phút | ~5–8 phút |
| **Tổng** | **~5 giờ** | **~1 giờ 40 phút – 2 giờ 15 phút** |

Điều kiện: cùng máy; không quota/CAPTCHA; retry trung bình ≤ 0,5 lượt/cảnh; render cuốn chiếu theo kịp tốc độ vẽ (khoảng 1,7 cảnh/phút × ~200 frame/cảnh ≈ 6 fps cần thiết, phải đo khi 5 room Chrome đang chạy). Nếu render không theo kịp, phần đuôi tăng và tổng khoảng 2,5 giờ.

---

## 9. Thứ tự triển khai

| Giai đoạn | Nội dung | Nghiệm thu |
| --- | --- | --- |
| 1 | F1–F6, F9–F10 | Toàn bộ test hiện có đạt; production-runner 20/20 |
| 2 | Mục 4: loại bỏ phần không dùng | tsc, eslint, one-pass, library mode không đổi |
| 3 | Mục 3: chấm điểm + sửa kỹ thuật bằng code + retry giữ bản tốt nhất; F8 | Unit test score; fixture lượt 1 lỗi → lượt 2 đạt; 3 lượt kém → giữ bản tốt nhất; resume không gửi trùng |
| 4 | Mục 2: DrawScheduler 5 room, anchor không chặn, sheet không chặn | Fixture 150 cảnh: `slotBusy` ≥ 90%, đúng dependency, đúng continuity |
| 5 | Mục 1.2: kịch bản theo chương phát `chapterReady` | Phân cảnh chương 1 bắt đầu trước khi viết xong chương cuối; hash beat đúng |
| 6 | Mục 5: render cuốn chiếu + concurrency tự chọn + cache clip; F11 telemetry | MP4 ghép so với render liền mạch: frame count, SSIM ≥ 0,99, đồng bộ audio/phụ đề |
| 7 | Chạy thật trên Chrome: cảnh 41 (6 ngựa), 12 tổ hợp profile × genre, 1 video ~17 phút | Thời gian từng bước, số retry/cảnh, số cảnh cảnh báo, kiểm cấu hình đạt |

## 10. Rủi ro
- Điểm bằng code đo độ phủ và khung, **không đo được hành động có tự nhiên/đẹp không**. Không bảo đảm 100% cảnh đạt.
- 5 room vẽ cùng phân cảnh, vẽ, retry → nhiều request Gemini Flash hơn trong cùng khoảng thời gian; cần theo dõi quota và dùng cơ chế chuyển Chrome dự phòng sẵn có.
- Render cuốn chiếu tranh CPU với 5 Chrome room; scheduler render phải tự giảm tải.
- Biên tập theo chương có thể làm lệch văn phong giữa các chương. Cần ledger văn phong chung, và đo so với biên tập toàn bộ ở giai đoạn 5 trước khi bật mặc định.


---

## 11. Kết quả triển khai (06/11/2026)

### 11.1. Đã làm

| Hạng mục | Thay đổi | File |
| --- | --- | --- |
| F1 | Bước dựng cảnh lỗi không còn hủy job giọng đang chạy; chỉ hủy khi người dùng dừng/CAPTCHA/quota | `motionProductionService.ts` |
| F2 + mục 3 | Vẽ cảnh: tối đa **3 request/cảnh** (1 + 2 viết lại). Chấm điểm bằng code mỗi lượt; đạt ≥ 80 thì dừng; chưa đạt thì AI viết lại theo danh sách lỗi cụ thể (lượt 2) rồi vẽ lại sạch (lượt 3). Hết lượt → **giữ bản điểm cao nhất**, `accepted` kèm `warnings`, không chặn video. Chỉ `failed` khi cả 3 lượt không render được. Resume tính đúng số lượt đã dùng (kể cả lượt đang chạy dở), không bao giờ vượt 3 | `scenePipeline.ts`, `constants/motionSceneScore.ts`, `lib/motionSceneScore.ts`, `lib/motionSvgGeometry.ts` |
| Chấm điểm | 6 tiêu chí: phủ actionPlan, bộ phận chuyển động riêng, trong khung (đầu/giữa/cuối, tính cả transform cha), thời lượng, nhận diện, đứng yên đúng chỗ. Không có actionPlan (kịch bản cũ) thì không phạt hình tĩnh. Prompt lượt đầu thêm checklist tự kiểm | như trên |
| F3–F6 | Hằng số thay chuỗi cứng (refusal, selector Gemini, tiêu đề prompt); regex ID CSS có ranh giới | `chatRoomRecovery.ts`, `chromeBackup.ts`, `motionSceneAction.ts`, `motionSceneActionBrief.ts`, `motionSceneRenderIds.ts` |
| Mục 2 (5 room) | `MotionPriorityPool`: một hàng đợi ưu tiên cho cả 5 room — cảnh mẫu (0) → phân cảnh (1) → cảnh thường theo timeline (2). **Phân cảnh chạy trên room vẽ** (giữ model nội dung), không còn nghẽn ở 2 room. Cảnh card/sơ đồ/bản đồ/timeline/cận cảnh không chờ cảnh mẫu. Object sheet không giữ room và chỉ chặn cảnh thực sự cần vật đó. Log tỷ lệ bận của room | `motionPriorityPool.ts`, `scenePipeline.ts` |
| SFX sớm | Lập SFX chạy song song với phân cảnh/vẽ thay vì sau cảnh cuối | `scenePipeline.ts` |
| Mục 4 (loại bỏ) | Gỡ option `geometry`/`still` (QA Chrome, chụp review) khỏi pipeline; gom dọn field cũ vào `clearLegacySceneFlags` | `scenePipeline.ts` |
| Mục 5 (render) | Render theo **đoạn cắt tại ranh giới cảnh** (~20 s), cache theo hash nội dung đoạn: vẽ lại 1 cảnh chỉ render lại đoạn chứa nó; resume dùng lại đoạn đã có. Nhiều tiến trình hẹp (2 luồng/tiến trình, tối đa 4) thay một render rộng; ghép `concat -c copy` | `motionRemotionRenderService.ts`, `motionRenderService.ts`, `lib/motionRemotionSegments.ts`, `lib/motionRemotionPerformance.ts`, `constants/motionRemotionRender.ts` |
| F8, F11 (một phần) | Lưới cảnh hiển thị số cảnh có cảnh báo, điểm từng cảnh (tooltip lỗi), nút **“Vẽ lại N cảnh lỗi”** gửi `retryFailed` | `MotionRemotionScenes.tsx`, `motionRemotionProgress.ts`, `MotionVideoCreator.tsx`, `useMotionStudio.ts`, `constants/motionVisual.ts` |
| F9 | `.kilo/` vào `.gitignore`; thêm script `test:motion-scene-score`, `test:motion-render-segments`, `test:motion-pipeline` | `.gitignore`, `package.json` |
| Khác | `console.warn` (lỗi ESLint có từ trước) → `logger.warn` | `motionRemotionRenderService.ts` |

### 11.2. Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| `npx tsc --noEmit`, ESLint 17 file thay đổi, `git diff --check` | Đạt |
| `verify-motion-production-runner` | **5/5 + 10/10** lần liên tiếp (trước: 2/4 lỗi) |
| `verify-motion-scene-score` (mới, 12 case) | Đạt: đủ điểm; ngựa trượt nguyên khối; thiếu subject; nhân vật ra khỏi khung (y = −200, như cảnh 21); bị chuyển động mang ra khỏi khung; thời lượng ngắn; vật đứng yên lại di chuyển; sai entityId; tắt chuyển động; kịch bản cũ; hình học path tương đối; regex ID CSS |
| `verify-motion-one-pass` (cập nhật) | Đạt: 18 cảnh/3 profile; đỉnh 5 room; lượt 1 kém → lượt 2 đạt (2 request); 3 lượt kém → giữ bản tốt nhất kèm cảnh báo, video vẫn `ready`; 3 lượt hỏng → `failed`, tối đa 3 request; resume không vẽ lại cảnh đã hết lượt; prompt viết lại tự đủ ngữ cảnh |
| `verify-motion-render-segments` (mới, Remotion + Chrome thật) | Đạt: 4 đoạn liền nhau, cắt đúng ranh giới cảnh; đổi hình cảnh 3 chỉ làm đổi **1/4** khóa đoạn; 321/321 frame; **SSIM 0,999281** so với render liền mạch; trên mẫu nhỏ: 2 tiến trình × 1 luồng **21,6 s** so với 1 render × 2 luồng 32,4 s |
| `scene-pacing`, `action-brief`, `script-intent-writing`, `settings-fixes`, `voice-quality` | Đạt |
| `verify-motion-single-draw`, `verify-motion-composition` | **Lỗi có từ trước**: chạy trên HEAD sạch (git worktree) cũng lỗi y hệt. Không hạ assertion |

### 11.3. Chưa làm / giới hạn

- **Mục 1.2 (biên tập theo chương, phát `chapterReady`)**: chưa làm. Đây là thay đổi ở service viết kịch bản; như plan đã nêu, cần đo độ lệch văn phong trước khi bật mặc định.
- **Render cuốn chiếu chồng lên lúc vẽ**: mới có phần nền (đoạn theo cảnh, cache, lane song song). Bước xuất video vẫn bắt đầu sau khi vẽ xong. Muốn render trong lúc vẽ cần thêm lời gọi render nền cho các đoạn đã đủ hình và timing giọng.
- **F11 đầy đủ** (thời lượng từng bước trên thẻ tiến trình), **kiểm cấu hình video cuối bằng ffprobe** (mục 7): chưa làm.
- Các script cũ `verify-motion-audit-fixes`, `verify-motion-clip-remotion`, `verify-motion-scene-consistency`, `render-motion-clip-demo` vẫn dùng module QA/geometry cũ; chưa xóa `compositionGeometryInspector.ts`, `motionSceneReviewFrames.ts`, `motionClipDirector.ts` vì các script này còn import. Cần quyết định gỡ cả script cùng module.
- Chưa chạy production thật trên Gemini/Chrome với cơ chế retry và scheduler mới; con số tốc độ của render theo lane mới đo trên mẫu 640×360 ngắn, cần đo lại ở 1080p30 khi 5 room Chrome đang chạy.

