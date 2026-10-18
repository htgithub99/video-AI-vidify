# Video Motion — kế hoạch sửa độ trung thành với style ảnh mẫu (global)

Ngày lập: 18/10/2026. Mốc mã nguồn: `86de4df` (`main`).

Trạng thái: kế hoạch chuẩn bị code, chưa sửa mã. Phạm vi là **toàn bộ pipeline vẽ cho mọi bộ ảnh mẫu, mọi preset style và mọi thể loại**, không chỉnh riêng cho một video hay một bộ ảnh.

## 1. Quyết định đã chốt

| Nội dung | Quyết định |
| --- | --- |
| Phạm vi | Fix global: mọi style kit (ảnh mẫu người dùng và preset), mọi thể loại, 2D và 3D. Không có nhánh code hay câu prompt viết riêng cho một bộ ảnh. |
| Gửi kèm ảnh mẫu khi vẽ nhân vật/bối cảnh/tư thế | **Không làm.** Giữ như hiện tại: ảnh chỉ được đọc một lần ở bước style, các bước vẽ nhận style kit dạng chữ. |
| Nguồn sự thật về hình thức | Style kit (từ ảnh mẫu hoặc preset). Story, Video DNA, thể loại quyết định *vẽ cái gì*; kit quyết định *vẽ như thế nào*. |
| Retry/QA | Giữ nguyên chính sách đã chốt: không AI chấm ảnh, không feedback; chỉ kiểm tra kỹ thuật bằng code. |
| Cache style | Giữ cache hiện tại; không bắt người dùng đọc lại ảnh để hưởng bản sửa (ràng buộc mới suy ra bằng code từ kit đã có). |

## 2. Bằng chứng

Kiểm tra trên bộ ảnh "người mặt nạ" (cache `reference-styles/d46c71….json`, version 2): style kit đọc **đúng** (flat, 1 tông, viền dày, mặt trắng `#EEF3F6`, không tóc/mũi/mày/tai, thân viên nang, tay nét tròn, không thấy chân, mọi nhân vật chỉ khác màu khối, nền nhìn thẳng, ban đêm bằng phủ tông, không sương/mưa/glow). Vậy nguyên nhân nằm ở **các bước sau khi đọc style**: những quy tắc chung trong prompt và code không hỏi kit trước khi áp dụng.

Ba kit cũ (version 1) cho thấy cùng vấn đề sẽ xảy ra với kiểu khác: nhân vật không tay (`c5d2…`, "búp bê gỗ", `arms/hands/legs: none`), hay kiểu cel có tóc/quần áo (`6b57…`). Một fix chỉ cho "mặt nạ trắng" sẽ không bảo vệ các kiểu này.

## 3. Nguyên nhân gốc (global)

Không có một lớp "ràng buộc style" dùng chung. Mỗi prompt và mỗi đoạn code tự mang quy tắc mặc định, và khi quy tắc mặc định trái với kit thì AI nhận hai mệnh lệnh ngược nhau.

| # | Vị trí | Quy tắc mặc định trái với kit |
| --- | --- | --- |
| G1 | `MOTION_GEN_BIBLE_PROMPT` (`src/constants/motionGenPrompts.ts`) | "Every character must have a clearly different silhouette (height, build, hair, clothing shape)" — áp dụng cả khi kit cho mọi nhân vật chung một hình. Mâu thuẫn trực tiếp với `DRAW_STYLE` ("distinguish characters using only variations allowed"). |
| G2 | `MOTION_GEN_BIBLE_PROMPT` | Mặc định "real skin tone (not white/cream)", mắt ≥ 1/8 đầu, mặt "face plate"… — đúng khi kit im lặng, nhưng được viết như luật chung. |
| G3 | `MOTION_SCENE_CATALOG_PROMPT.CHARACTER_SCHEMA` (`src/constants/motionSceneCatalog.ts`) | Gợi ý vật liệu `hair/top/bottom/shoes` và phụ kiện ẩn `opt_hat/opt_beard…` cho mọi kiểu. |
| G4 | `MOTION_GEN_POSE_PROMPTS.RULE`, `MOTION_POSES`, `motionProceduralPose` (`src/constants/motionPoses.ts`, `src/lib/motionPoses.ts`) | Đòi anchor `arm_l/arm_r/leg_l/leg_r`, tư thế `walk/run/sit/kneel/lie`; với kiểu không chân/không tay, điều này đẩy AI vẽ thêm chi. |
| G5 | `MOTION_REFERENCE_PROMPTS.MOTION_ON` (`src/constants/motionReference.ts`) | "Author motion keyframes… walking paths moveTo…" không xét kit có chân hay không. |
| G6 | `MOTION_GEN_LOCATION_PROMPT`, `MOTION_GEN_LOCATION_FIX_PROMPT`, `MOTION_GEN_DSL_GUIDE`, `MOTION_GEN_DSL_EXAMPLE` | "production designer of a 3D story video", "Improve the 3D location", "simple 3D shapes", ví dụ hầm xe 3D chi tiết — kể cả khi chọn 2D phẳng nhìn thẳng. |
| G7 | `DIRECTIVES` thể loại (`src/constants/motionGenre.ts`) | Mỗi thể loại chèn chỉ dẫn hình ảnh: horror "night, fog, dim interiors", kids "bright daytime"… — cạnh tranh với `kit.fx`/`kit.render.lighting` (ví dụ kit "no fog/glow"). |
| G8 | Video DNA `visualDna` + `analysis.look` ("Visual direction") | Hướng hình ảnh suy từ câu chuyện/thể loại được gửi song song với kit; không có quy tắc kit thắng ở trường trùng nhau. |
| G9 | Lặp ngữ cảnh | Kit gửi 2 lần (preamble `PROFILE` + `DRAW_STYLE`), DNA gửi 2 lần (`genPreamble` + `planningPrompt` trong `designBible`). Prompt dài, nhiều nguồn hình ảnh cạnh tranh. |
| G10 | `DRAW_STYLE` phát hiện phẳng (`/flat|vector/`) và `kitRenderStyle` (`FACE_SHADING: /cel|gradient|painterly/`) | Phân loại bằng một chữ trong `render.mode`: kit 2D "cel" mất hướng dẫn phẳng và bị bật đổ bóng mặt, dù `shadingTones` có thể là 1. |
| G11 | `outlineWidth` → engine (`gen-character.js` clamp 0.06) | Độ dày viền chỉ lấy số 0..0.06 do AI ước lượng; mô tả "thick/thin" trong `kit.render.outline` không được dùng. |
| G12 | Trang phục/biến thể khi dùng lại kho (`motionApplyCostume`, `applyCharacterVariant`) | Khi chế độ kho bật, code mặc thêm quần áo/biến thể màu theo loại nhân vật mà không hỏi kit có cho phép chi tiết quần áo không. |
| G13 | Không có kiểm tra sau vẽ theo kit | Thiết kế trả về có thể chứa part mà kit nói "none" (tóc, mũi, chân…); hiện không có bước code nào phát hiện. |

## 4. Thiết kế: lớp ràng buộc style dùng chung

### 4.1. `MotionStyleConstraints` — suy ra bằng code từ kit

Thêm `src/lib/motionStyleConstraints.ts`: một hàm thuần `motionStyleConstraints(referenceStyle, drawingMode)` chuyển kit (ảnh mẫu hoặc preset) thành dữ liệu có cấu trúc. Không gọi AI, không đổi cache, chạy được với mọi kit cũ (version 1/2) và preset.

| Trường | Ý nghĩa | Cách suy ra (code, có test) |
| --- | --- | --- |
| `absent` | Bộ phận chắc chắn không có: `hair, nose, brows, ears, arms, hands, legs, mouth, eyes…` | Trường `kit.character.<part>` khớp "none / omitted / no … / absent / bald…" |
| `hidden` | Có thể có nhưng không thấy (ví dụ chân bị cắt khung) | "not visible / cropped / hidden by clothing" |
| `sharedFigure` | Mọi nhân vật dùng chung một hình, chỉ khác theo `variation` | Từ `body/clothing/headShape/images[].details`: "identical / same … / each figure is a single flat colour block / share" |
| `variation` | Trục được phép để phân biệt nhân vật: `colour`, `hair`, `clothing`, `height`, `build`, `accessories` | Mặc định đủ các trục; loại trục ứng với `absent` và trục bị nói "no detail"; `sharedFigure` → chỉ `colour` (+ trục kit nêu rõ) |
| `faceFill` | Màu mặt khi kit nêu (kể cả không phải da) | `kit.character.skin` / `headShape` có `#hex` |
| `shading` | `flat` \| `cel` \| `soft` và số tông | `render.mode` **kết hợp** `render.shadingTones` (cel 1 tông = flat) |
| `outline` | `none` \| `silhouette` \| `all`, độ dày `thin|medium|thick` → số | `render.outline` + `outlineWidth`; bảng ánh xạ chữ → độ rộng |
| `fx` | Hiệu ứng được phép/cấm: `fog, rain, glow, particles, beams` | `kit.fx` + `render.lighting` ("no fog", "no glow"…) |
| `night` | Cách thể hiện đêm: `tint` \| `lights` | `render.lighting` |
| `perspective` | `front` \| `side` \| `three-quarter` \| `deep` | `kit.background.perspective` |
| `detail` | `low` \| `medium` \| `high` | `background.detail`, `clothing` |

Khi kit im lặng ở một trường → giá trị "không ràng buộc" (hành vi hiện tại giữ nguyên). Khi không có kit và không có preset → không có ràng buộc (mặc định hiện tại).

### 4.2. Một nguồn quy tắc, nhiều nơi tiêu thụ

Mọi quy tắc mặc định trong §3 trở thành **có điều kiện theo constraints**, sinh bằng một hàm (`motionStyleRules(constraints, part)`) thay vì chuỗi cứng rải rác. Nguyên tắc: kit nói gì thì quy tắc chung không được nói ngược; kit im lặng thì quy tắc chung áp dụng như hiện tại.

### 4.3. Thứ tự ưu tiên ghi rõ trong prompt

`Thiết lập người dùng (2D/3D, ngôn ngữ, thời lượng) > Style kit (hình thức) > Câu chuyện/Video DNA/thể loại (nội dung, không khí, nhịp) > mặc định chung`. Thể loại và DNA chỉ được chọn *khoảnh khắc* (đêm, trong nhà, ngoài trời) và *cảm xúc*; cách thể hiện đêm, sương, ánh sáng, độ chi tiết lấy từ kit.

## 5. Gói công việc

### S1 — Constraints và bộ kiểm thử kit (nền tảng)
Files: `src/lib/motionStyleConstraints.ts` (mới), `src/types/motionVideo.ts`, `src/constants/motionReference.ts`.
- Viết hàm suy constraints + bảng từ khóa (EN/VI) trong constants.
- Fixtures: 4 kit người dùng gửi (mặt nạ trắng flat; cel mèo/mẹ/tiệm thuốc ×2; búp bê không tay) + mọi preset trong `motionStylePresets.ts` + "không kit". Fixture là *đại diện kiểu*, test assert theo tính chất (absent/variation/shading…), không theo tên bộ ảnh.
- Nghiệm thu: mặt nạ → `absent ⊇ {hair,nose,brows,ears,hands}`, `hidden ⊇ {legs}`, `sharedFigure`, `variation = [colour]`, `faceFill #EEF3F6`, `shading flat`, `fx` cấm fog/glow, `night tint`; búp bê → `absent ⊇ {arms,hands,legs,nose}`; cel mèo/mẹ → có tóc/quần áo, `shading cel 2`; preset → không làm đổi hành vi preset đang đúng.

### S2 — Prompt vẽ nhân vật theo constraints (G1–G3, G9)
Files: `src/constants/motionGenPrompts.ts`, `src/constants/motionSceneCatalog.ts`, `src/server/services/motionGenService.ts` (`designBible`), `src/lib/motionDirection.ts`.
- G1: câu "different silhouette" chỉ khi `variation` chứa trục hình dáng; ngược lại "distinguish characters only by: <variation>; all characters share <shared features>".
- G2: mặc định da/mắt chỉ khi kit im lặng ở trường đó; có `faceFill` thì dùng đúng màu.
- G3: gợi ý tên vật liệu/phụ kiện chỉ cho bộ phận không thuộc `absent`; giữ tên vật liệu chuẩn khi có (để tái màu kho).
- G9: kit gửi **một lần** (giữ `DRAW_STYLE` cho part tương ứng, bỏ bản `PROFILE` trùng trong preamble vẽ); DNA một lần. Không đổi nội dung kit gửi đi, chỉ bỏ trùng.
- Nghiệm thu: với fixture mặt nạ, prompt không chứa yêu cầu khác dáng/tóc/giày/màu da thật; với fixture cel, prompt giữ yêu cầu phân biệt bằng tóc/quần áo; với "không kit", prompt giống hiện tại.

### S3 — Tư thế và chuyển động theo bộ phận có thật (G4, G5)
Files: `src/constants/motionPoses.ts`, `src/lib/motionPoses.ts`, `src/constants/motionReference.ts`, `src/server/services/motionGenService.ts` (`completeCastPoses`, `motionCastNeeds`).
- POSE rule: anchor chỉ cho chi thuộc thiết kế và không thuộc `absent/hidden`; danh sách tư thế cần có lọc theo chi khả dụng (không chân → bỏ `walk/run/sit/kneel` khỏi "needs", thay bằng biến thể thân/tay khi có tay).
- `motionProceduralPose` đã không bịa chi khi thiếu part — giữ; thêm: không sinh tư thế dùng chi `absent`.
- `MOTION_ON`: đi lại bằng `moveTo` vẫn được (trượt nhân vật), nhưng không yêu cầu keyframe chân khi `legs ∈ absent ∪ hidden`.
- Pose patch request: chỉ xin tư thế phù hợp chi khả dụng.
- Nghiệm thu: fixture không chân không sinh/không xin `walk` cần chân; fixture không tay không có `point/wave`; fixture đủ chi giữ hành vi hiện tại.

### S4 — Bối cảnh theo chế độ vẽ và kit (G6, G10)
Files: `src/constants/motionGenPrompts.ts` (LOCATION/FIX/DSL), `src/constants/motionReference.ts` (`DRAW_STYLE`), `src/server/services/motionGenService.ts` (`kitRenderStyle`), `src/constants/motionPatterns.ts`.
- Vai trò/mô tả: "production designer of a <2D illustrated | 3D> story video" theo `drawingMode`; FIX prompt cũng vậy.
- `DSL_GUIDE`: giữ schema hình học (vẫn là khối 3D trong renderer) nhưng mô tả theo chế độ; `DSL_EXAMPLE`: thêm một ví dụ 2D nhìn thẳng tối giản, chọn ví dụ theo `drawingMode` + `perspective` + `detail`.
- G10: thay phát hiện phẳng/đổ bóng mặt bằng `constraints.shading` (mode + số tông) cho cả `DRAW_STYLE` và `kitRenderStyle`.
- Nghiệm thu: 2D không còn chữ "3D story video"/"3D location"; kit "cel 1 tông" 2D được xử lý như phẳng; kit "cel 2 tông" vẫn bật đổ bóng mặt như hiện tại; 3D không đổi.

### S5 — Thể loại và Video DNA không ghi đè hình thức (G7, G8)
Files: `src/constants/motionGenre.ts`, `src/lib/motionVideoDna.ts`, `src/lib/motionDirection.ts`, `src/constants/motionRuntime.ts`.
- Tách mỗi directive thể loại thành phần *nội dung/nhịp/âm thanh* (giữ nguyên ở mọi bước) và phần *hình ảnh* (ví dụ horror: đêm, nội thất tối, sương; kids: ban ngày sáng). Phần hình ảnh vào prompt vẽ dưới dạng "chọn khoảnh khắc", kèm câu ưu tiên: hiệu ứng/ánh sáng phải theo `constraints.fx/night`; hiệu ứng kit cấm thì không thêm.
- `visualDna`/`analysis.look`: khi có kit, chỉ giữ các trường không trùng (ví dụ mood, nhịp hình ảnh); palette/linework/lighting lấy từ kit. Không đổi schema DNA.
- Nghiệm thu: mọi thể loại × fixture có `fx` cấm sương → prompt vẽ không yêu cầu sương; thể loại vẫn giữ nhịp kể/âm thanh; không kit → như hiện tại.

### S6 — Engine và kho theo constraints (G11, G12)
Files: `src/server/services/motionGenService.ts` (`applyReferenceRenderStyle`, `kitRenderStyle`), `motion-engine/gen-character.js`, `src/server/services/motionSceneLibraryService.ts`, `src/lib/motionCostume.ts`, `src/lib/motionCharacterVariant.ts`.
- Độ dày viền: `constraints.outline` (chữ thick/medium/thin + số kit) → `gen.style.outlineWidth`; xem lại trần 0.06 cho chế độ 2D phẳng (đo trên ảnh render offline).
- Kho bật: trang phục/biến thể chỉ áp dụng khi `variation` cho phép `clothing/hair`; `sharedFigure` → chỉ đổi màu khối. Không áp dụng khi kho tắt (đã đúng).
- Nghiệm thu: kit viền dày cho viền dày hơn kit viền mảnh trên cùng nhân vật (đo pixel offline); fixture `sharedFigure` + kho bật không bị mặc thêm áo.

### S7 — Kiểm tra kỹ thuật sau vẽ theo constraints (G13)
Files: `src/server/services/motionGenService.ts` (`designBible`, `completeCastPoses`), `src/lib/motionStyleConstraints.ts`.
- Sau khi nhận thiết kế nhân vật: phát hiện part trùng `absent` theo id/tên vật liệu (hair/nose/brows/ears/hand/leg…). Xử lý bằng code: ẩn hoặc bỏ part đó (tái dùng cách `motionStripForeignParts`), giữ phần còn lại; ghi log. Không gửi feedback, không retry vì lý do này.
- `faceFill`: nếu mặt (part `face`/`head` theo anchor) có vật liệu khác hẳn màu kit → đổi màu bằng code.
- Nghiệm thu: thiết kế giả có tóc/mũi với fixture mặt nạ → sau bước này không còn hiển thị tóc/mũi, log ghi rõ; fixture có tóc → không bị đụng.

### S8 — Hồi quy và đo
- Unit test cho S1–S7 bằng fixture kit, không gọi model thật.
- Snapshot prompt: với mỗi fixture × {2D, 3D} × {horror, kids, story, auto}, lưu prompt vẽ nhân vật/bối cảnh; review diff một lần, sau đó test chặn quy tắc ngược kit quay lại.
- Render offline (Chromium) vài thiết kế mẫu để kiểm viền/đổ bóng/màu mặt; không dùng AI chấm ảnh.
- Chạy đầy đủ `test:motion-*`, `verify-clean-code` (không comment trong `src/`), typecheck, eslint; so trước/sau.
- Chạy live có kiểm soát 1–2 video mỗi kiểu (mặt nạ, cel có tóc, búp bê không tay, một preset) để đánh giá bằng mắt; ghi rõ phần chưa xác minh.

## 6. Thứ tự và phụ thuộc

1. S1 trước tiên (mọi gói dùng constraints).
2. S2, S3, S4 song song sau S1 (cùng chạm `motionGenPrompts.ts` → gộp review).
3. S5 sau S2 (dùng cơ chế bỏ trùng của S2).
4. S6, S7 sau S1; S7 sau S2 (cần biết tên part/vật liệu chuẩn).
5. S8 xuyên suốt; hoàn tất khi snapshot và render offline ổn định.

## 7. Ngoài phạm vi

- Gửi kèm ảnh mẫu trong request vẽ nhân vật/bối cảnh/tư thế: **không làm**, giữ nguyên hiện tại.
- Đổi cách đọc style (prompt `ANALYZE`) hay bump `CACHE_VERSION`: không bắt buộc; constraints suy từ kit hiện có. Có thể cân nhắc riêng việc yêu cầu thêm trường `signature/variation` trong `ANALYZE` cho kit mới, nhưng code phải chạy đúng khi trường này vắng.
- AI review ảnh, vòng feedback thẩm mỹ: không thêm.
- Thay renderer hay chuyển sang vẽ bitmap: không.

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
| --- | --- |
| Suy constraints từ chữ tự do sai (ví dụ "no detail" ở clothing bị hiểu là không có quần áo) | Bảng từ khóa có test âm/dương trên fixture; trường không chắc → "không ràng buộc" thay vì cấm. |
| Bỏ quy tắc chung làm kit im lặng ra kết quả kém hơn | Chỉ nới quy tắc ở trường kit nói rõ; kit im lặng giữ mặc định hiện tại; snapshot "không kit" không đổi. |
| S7 xóa nhầm part cần thiết | Chỉ xử lý `absent` (không `hidden`), so theo id/vật liệu chuẩn, ẩn thay vì xóa khi không chắc, log đầy đủ. |
| Prompt khác đi làm cache thiết kế cũ không còn khớp | Không đổi chữ ký cache thiết kế; chỉ áp dụng cho lần vẽ mới hoặc khi người dùng vẽ lại. |
| Thể loại mất bản sắc hình ảnh | Thể loại vẫn chọn khoảnh khắc và cảm xúc; chỉ cách thể hiện hình thức theo kit. |
