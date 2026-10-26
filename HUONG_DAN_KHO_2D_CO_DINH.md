# Hướng dẫn làm kho tài nguyên 2D và cố định vị trí theo video mẫu

## Kho hoạt động mới ngày 26/10/2026

Hai gói đóng đã chuyển sang kho mô-đun v3; không chọn lại cảnh cũ vẽ liền đồ vật. Nền sạch + mảnh độc lập + mẫu ghép có ID nguồn, slot và điểm đặt được dùng chung khi tạo video. Kho cũ nằm ngoài lựa chọn, trong `storage/output/motion-video/kit-library-archive/modular-v3-20261026`; không dùng làm fallback. Nhân vật Chibi chân khép và đạo cụ đã đạt được giữ sau chuẩn hóa. Xem [báo cáo phát hành, số lượng, vị trí lưu và cách vận hành](docs/motion-modular-library-release-2026-10-26.md). Các hướng dẫn migration cũ phía dưới chỉ còn dùng cho dữ liệu lịch sử/thư mục thử.


Cập nhật đối ứng 26/10/2026: [báo cáo từng mục và phần còn mở](docs/motion-production-root-fix-implementation-2026-10-26.md). Metadata kho dùng chung `src/constants/motionResourceSchema.json` cho TypeScript/Python; quản trị, seed và migration phải chuẩn hóa/kiểm trước ghi. Production đóng không sửa kho, đọc snapshot cũ không tự migration. Đã chuyển 789 cảnh thành recipe được runtime đọc; nền trích một phần vẫn là `recipeOnly`, không coi là nền sạch dùng tùy ý. Còn 471 cảnh giữ adapter/plan cũ cần tiếp tục phân loại, không xóa hoặc ép metadata để báo đủ. Bàn di chuyển được có phạm vi dùng riêng với nền; ghép cảnh phải đủ số điểm đặt đồng thời. Quan hệ bát trên khay, khay trên bàn chỉ dùng khi có bằng chứng và được kiểm theo surface, không cho mọi vật chiếm cùng một điểm. Bằng chứng kiểm ngày 26 là fixture và ảnh tĩnh; chưa tạo video hoặc restart backend.

Cập nhật luồng sản xuất 25/10/2026: [bản triển khai, kiểm chứng và phần còn lại](docs/motion-production-root-fix-implementation-2026-10-25.md). Trong hai gói đóng, AI lập kế hoạch minh họa; code chọn nhân vật, bối cảnh, đồ vật và bố cục từ kho bằng ràng buộc. Đã bỏ lượt AI chọn `choiceId` và bảng ảnh ứng viên trong đường sản xuất thường. `choiceId` hiện là mã nội bộ để khóa và kiểm kết quả. Không gộp khả năng của nhiều cảnh thành một cảnh giả. Có thể ghép thành phần đã có, không vẽ thêm. Sau khi kịch bản đủ chương, dựng hình và tạo giọng chạy song song; compile đợi cả hai và chốt timeline theo giọng thật. Review AI tắt vẫn kiểm dữ liệu, tiếp xúc và lỗi engine. Các báo cáo ngày 24/10 dưới đây mô tả phiên bản trước; dùng cập nhật này khi có khác biệt.

Cập nhật nhân vật Chibi theo ảnh Khăn Piêu 24/10/2026: [thiết kế và kiểm chứng](docs/chibi-pieu-redesign-2026-10-24.md), [bảng ảnh nhân vật, tư thế và trước–sau](scratch/chibi-pieu-closed-legs-20261024/index.html). Bộ Chibi hiện dùng `chibiDesignVersion: 3`: đầu lớn, thân gọn, áo ngắn, phần thân dưới khép liền, không có khe giữa hai ống quần hoặc hai bàn chân rời; tóc/khuôn mặt/trang phục dựng lại cho 59 nhân vật; ngồi/quỳ/ngồi xổm chỉ lưu thân/chân, engine ghép đầu/mặt/tay một lần. Tỷ lệ và khuôn mặt dùng chung từ `src/constants/motionChibi.json` cho TypeScript và Python. Dùng bộ này khi xây kho hoặc dựng dự án mới; không khôi phục bộ thân dài và sprite có đầu/mặt vẽ sẵn từ bản chuẩn hóa trước. Giữ snapshot của dự án đã dựng cho đến khi người dùng yêu cầu dựng lại.

Cập nhật minh họa tĩnh và sửa kho cũ 24/10/2026: [triển khai và kiểm chứng](docs/motion-illustrated-library-implementation-2026-10-24.md), [bảng ảnh kho và so sánh Chibi trước–sau](scratch/illustration-library-20261024/index.html). Đã xử lý danh sách 1.991 hồ sơ cũ: chuẩn hóa 1.680 hồ sơ có thể chọn, giữ nguyên 311 hồ sơ lịch sử; dựng lại hình của 59 nhân vật Chibi và sửa nguồn sinh. Không đồng nghĩa mọi hình đã được duyệt nội dung. Video dùng hình minh họa đơn giản: chọn tư thế/kết quả có sẵn, không đòi mô phỏng từng động tác. Công tắc **AI duyệt ảnh cảnh** nằm trong cài đặt tạo video, mặc định bật và lưu cùng dự án; tắt công tắc vẫn kiểm dữ liệu và lỗi engine. Hai gói đóng không tự vẽ thêm. Các quy tắc mới này được ưu tiên khi mâu thuẫn với hướng dẫn animation hoặc thiếu thì vẽ ở phần cũ.

Cập nhật kho đóng 24/10/2026: [bản triển khai và phạm vi kiểm chứng](docs/motion-closed-pack-placement-implementation-2026-10-24.md), [bảng ảnh hai gói](docs/video-references/closed-pack-20261024/index.html). Video mới dùng `minimal_mask` hoặc `chibi_folk` chỉ chọn/ghép tài nguyên seed đúng gói, không gọi AI vẽ thêm. `gen.puppet.pack` lưu bản chụp nội dung và nguồn thành phần; compile/render đọc bản chụp này. Ghép cảnh, đóng/mở cửa và bật/tắt đèn dùng thành phần đã có, lưu theo dự án. Đã cài 144 bản ghi bổ sung từ 12 thiết kế cảnh, 18 đạo cụ và 6 mảnh cảnh cho hai gói. Các hướng dẫn “thiếu thì vẽ” bên dưới chỉ còn áp dụng cho chế độ không dùng hai gói đóng hoặc quy trình xây kho riêng.

Cập nhật chia hình 24/10/2026: [lập nhịp hình theo sự việc, độc lập với câu thoại](docs/motion-storyboard-rework-2026-10-24.md). Pipeline hiện tại lập storyboard trước READ và chọn tài nguyên: một hình có thể phủ nhiều câu/người nói/beat, một câu có thể tách tại cụm từ chính xác. Dữ liệu mới dùng `gen.puppet.storyboard`; không dùng số câu làm số hình. Quy tắc này thay thế cách chia hình theo câu trong các phần tài liệu cũ. Kiểm hồi quy: `npm run test:motion-storyboard`.

Cập nhật 24/10/2026: [sửa nguyên nhân mất sự kiện và trạng thái xuyên cảnh](docs/motion-visual-root-cause-2026-10-24.md). Luồng mới truyền `scenePlan` đến READ/COMPOSE/QA, dùng khóa theo lần xuất hiện, có bộ nhớ trạng thái và quyền sở hữu đồ vật tách hiện tại/hồi tưởng. `effectSource` đi cùng `effectTarget` và `effectMode` (`rise`, `ground`, `toward`); phần mô tả khói cũ bên dưới cần đọc theo thay đổi này. Hình tự sửa phải dựng và kiểm lại; AI trả thiếu kết quả không được coi là kiểm đạt. Dựng mới dùng `visualContractVersion` và `visualInputKey` để tránh giữ cache hình sai. Kiểm hồi quy: `npm run test:motion-visual-contract`.

Cập nhật 22/10/2026: [bộ 34 mẫu bổ sung và cách cố định theo câu kể](docs/motion-fixed-library-2026-10-22.md), [bảng ảnh kiểm tra cả hai phong cách](docs/video-references/fixed-library-20261022/index.html). Nguồn mới nằm ở `python_scripts/kit_seed/fixed_compositions.py`; dùng installer chọn lọc được mô tả trong báo cáo, không chép toàn bộ staging vào kho chính.

Tài liệu này dành cho một AI khác (hoặc người) muốn tiếp tục làm phần 2D puppet của **video-AI-vidify** giống cách đã làm từ c97y đến c98c. Đọc hết trước khi sửa code.

---

## 0. Nguyên tắc bắt buộc

Chốt ngày 25/10/2026: hình chỉ là minh họa tĩnh. Ưu tiên đúng người, vị trí, bối cảnh, đồ vật và trạng thái quan trọng; động tác khó/cử chỉ phụ có thể để lời kể diễn đạt. AI đọc sự việc, code xét nhiều bố cục hợp lệ rồi chọn theo độ rõ và tính liên tục; không có lượt AI chọn mã hoặc tự đặt tọa độ. Giọng lấy file Thần trùng làm chuẩn, kiểm rõ chữ và khoảng nghỉ độc lập với review ảnh.

1. **Sửa từ gốc, áp dụng cho mọi video.** Không vá riêng cho một video hay một câu truyện. Nếu một video sai thì tìm quy tắc chung gây ra lỗi đó (prompt, layout, kho, engine) và sửa quy tắc.
2. **Không viết comment trong code.** Chuỗi và regex phải đặt trong file constants (`src/constants/motionPuppet*.ts`), không viết thẳng trong logic.
3. **Học cách dựng từ video mẫu, không chép nội dung.** Học bố cục, góc máy, vị trí người, cách che, cách vẽ ma. Không chép nhân vật, câu chuyện hay hình vẽ.
4. **Kiểm bằng ảnh tĩnh (stills), không render video thử** trừ khi được yêu cầu.
5. **Kiểu xuống dòng:** file `.ts` và `.js` trên máy người dùng dùng CRLF; file `.py` và `.json` dùng LF.
6. **Trước khi deploy:** lấy file đang chạy trên máy về và so diff với bản mình sửa, để không ghi đè thay đổi của người khác.
7. **Báo cáo bằng tiếng Việt.**

---

## 1. Toàn cảnh pipeline

```
Truyện → STORYBOARD (nhịp hình và phạm vi lời kể) → READ (AI đọc từng nhịp hình)
       → chọn/ghép bối cảnh → code tạo, kiểm và chọn phương án đặt hình
       → compile kiểm hồ sơ đã khóa → engine dựng ảnh → duyệt ảnh nếu bật
       → tạo giọng → khớp thời gian hình/giọng → ffmpeg
```

| Bước | File | Làm gì |
|---|---|---|
| STORYBOARD | `src/server/services/puppet/storyboard.ts` → `planPuppetStoryboard` (prompt `motion-puppet-storyboard`) | Chọn hình đại diện cho sự việc/đầu mối/phản ứng, gắn phạm vi lời kể bằng chỉ số nguồn và cụm từ chính xác; không đổi hình chỉ vì hết câu hoặc đổi người nói |
| READ | `src/server/services/puppet/director.ts` → `readPuppetLines` (prompt `motion-puppet-read`) | Mỗi nhịp hình ra `focus`, `who`, `place`, `object` (có `type` và `mount`), `action`, `emotion`, `light`, `overlays`; giữ đầy đủ kế hoạch nguồn của các beat được nhịp đó phủ |
| Bối cảnh | `kitDraw.ts` → `matchLibrarySets`; `setComposer.ts` → `buildPuppetSets` | Hai gói đóng: chọn cảnh đủ điểm đỡ/tư thế/bố cục và vùng đặt; khi cần ghép, code tìm tổ hợp mảnh và slot có sẵn, kiểm đủ yêu cầu rồi mới nhận. Không gọi AI đề xuất mảnh hoặc vẽ mới. Cùng địa điểm giữ hình học gốc khi đổi trạng thái cửa/đèn |
| Nhân vật | `kitDraw.ts` → `matchArchetypes` | Hai gói đóng: code ghép vai với nhân vật seed theo tuổi/giới/vai, không gọi AI ghép mẫu; dùng lại cùng danh tính cho phiên bản ma. Không vẽ nhân vật/sprite mới |
| Đồ vật | `kitDraw.ts` → `matchLibraryProps` | Hai gói đóng: chọn đúng loại, trạng thái, kích thước và chỗ cầm/đeo/đặt; kiểm thiếu trước COMPOSE và âm thanh |
| COMPOSE | Hai gói đóng: `packSceneChoices.ts` → `composePuppetPackLines` | Code tạo, kiểm và xếp hạng các phương án hoàn chỉnh; không gọi AI hoặc render bảng lựa chọn. Ghi nguồn `deterministic`. Chế độ ngoài hai gói đóng giữ `director.ts` → `composePuppetLines` |
| Layout | `layout.ts`, `packPlacement.ts` | Tính và kiểm vị trí trước khi khóa. Các góc giữ cùng cách đặt người/đồ vật. Kiểm vùng che khuất dùng hộp hình học gần đúng, không thay cho duyệt ảnh |
| Compile | `compilePuppet.ts`, `packSelectionContract.ts` | Khung mới có `selectionVersion` phải khớp READ, mã lựa chọn, ID tài nguyên và hash khung; compile dùng vị trí đã khóa. Khung lịch sử chưa có hợp đồng mới giữ luồng tương thích cũ cho đến khi dựng lại |
| Engine | `motion-engine/puppet2d.js` | Vẽ canvas: cảnh, lớp che (`data-occ`) xen giữa các nhân vật theo độ sâu, ma, bóng đen, overlay, split, inset, trail |

Mọi chuỗi prompt, regex, đội hình, khoảng cách và hằng số nằm ở `src/constants/motionPuppet.ts` (`P`), `motionPuppetSets.ts` (`Q`, `PUPPET_SLOTS`) và `motionPuppetSeed.ts` (danh mục nơi chốn và đồ vật dựng sẵn).

---

## 2. Kho tài nguyên (kit-library)

**Vị trí trên máy:** `D:\video-AI-vidify\storage\output\motion-video\kit-library\<type>\<id>.json`

**Đọc và ghi:** dùng `kitLibrary.ts`: `readPuppet`, `writePuppet`, `listPuppets`, `newPuppetId(type, seed)`. Id phải khớp `ID_RE`. Nếu tự đặt id sai mẫu thì asset sẽ không được nạp.

| type | prefix id | Schema (`src/types/motionPuppet.ts`) | Nội dung |
|---|---|---|---|
| `style_pack` | `stl-` | `PuppetStylePack` | Phong cách: tỉ lệ thân, mặt, nét, bảng màu |
| `character_kit` | `chr-` | `PuppetCharacter` | `head`/`body` gồm các góc front/side/back (SVG), `sprites` (sit, kneel…), `colors`, `height`, `group` (vd `ghost`), `archetype` |
| `set` | `set-` | `PuppetSet` | SVG cả cảnh 1920×1080, `floorY`, `horizonY`, `spots`, `lights`, `variants.night`, `interior`, `time` |
| `prop` | `prp-` | `PuppetProp` | SVG 512×512, `base` [256,480], `height`, `size` (tỉ lệ so với chiều cao người), `mount` |
| `set_base` | `bas-` | `PuppetBase` | Khuôn cảnh trống (phòng hoặc ngoài trời): `horizonY`, `floorY`, `interior`, SVG có các nhóm `sky`/`back`/`floor` |
| `set_piece` | `pcs-` | `PuppetPiece` | Một món cảnh: `kind`, `slots`, `box`, `anchor`, `native`, `spots`, `lights`, `front` |

**Hai gói phong cách dựng sẵn:**
- `minimal_mask` = `stl-ba8ca635c716c880`: mặt nạ tối giản, không có thân rời và không có sprite;
- `chibi_folk` = `stl-e70fac00bbf44662`: chibi dân gian, có thân và sprite.

**Id dựng sẵn cố định:** `prefix + sha256("seedv1:<style>:<key>[:vN][:night]")[:16]`. Nhờ vậy chạy seed lại thì đè đúng file cũ, không sinh bản trùng.

---

## 3. Cách tạo tài nguyên vào kho (bộ seed Python)

**Thư mục:** `python_scripts/kit_seed/` trên máy (bản làm việc ở scratchpad `seed/`). Mọi thứ vẽ bằng code SVG, không dùng ảnh.

| File | Vai trò |
|---|---|
| `core.py` | `W,H = 1920,1080`; `THEMES` (bảng màu của 2 gói: line, lw, sky, wall, wood…); class `T(style, night, seed, v)` giữ màu (`t.c('wood')`), nét (`t.lw`, `t.line`), `t.detail`, `t.defs`; hàm vẽ `rect`, `ell`, `circ`, `line`, `path`; `svg(t, sky, back, mid, floor, fg, occ='')` |
| `parts.py`, `interior.py` | Các bộ phận dùng lại: mái ngói, cửa, bàn thờ, nhang (`incense`), quan tài (`coffin`), mộ (`grave`)… |
| `scenes.py` | Mỗi nơi là 1 hàm trả `S(sky, back, mid, floor, fg, floorY, lights, occ)`. `HB = 750` (đường chân trời ngoài trời), `IB = 720` (chân tường trong nhà). `build(key, style, night, v)` ra SVG |
| `spots.py` | Mỗi nơi có 1 hàm trả danh sách `sp(key, kind, x, y, label)`; `spots_for()` tự lật trái/phải cho biến thể v1, v3 |
| `props.py` + `refprops.py` | Đồ vật: hàm vẽ trong khung 512×512, đáy ở y≈480. `REF_PROPS = {key: (fn, size, mount)}` |
| `chars.py` | `ARCH = {key: dict(name, gender, age, group, hair, hairc, face, body, sleeve, dress, height, desc)}`; `build_char` sinh head/body views và sprites |
| `pieces.py` + `refkit.py` | Món cảnh `P(...)` và khuôn cảnh `BASES` |
| `build_assets.py <out>` | Ghi `set` (4 biến thể × ngày/đêm), `prop`, `character_kit` cho cả 2 gói |
| `export_pieces.py <out>` | Dựng món và khuôn, đo `getBBox` bằng Chromium để ra `box` |
| `build_pieces.py <src> <out>` | Ghi `set_piece` và `set_base` |
| `preview_*.py`, `render.py` | Dựng ảnh xem trước (sheet) để kiểm |

### 3.1 Thêm một **nơi chốn** (cảnh trọn trong kho)

1. Thêm vào `PUPPET_SEED_PACKS.ghost_tale.places` trong `src/constants/motionPuppetSeed.ts`:
   `{ key, name, desc (tiếng Anh, liệt kê đồ đạc), interior, night, tags: [từ khóa Việt + Anh] }`.
   `build_assets.py` assert rằng số nơi chốn ở đây bằng `SCENES`.
2. Viết hàm vẽ trong `scenes.py` và đăng ký vào `SCENES`.
   - Chia lớp: `sky` (trời), `back` (tường, núi xa), `mid` (đồ ở giữa), `floor` (nền), `fg` (cận cảnh).
   - Đồ đạc che người (quầy, quan tài, mộ, thành giếng, sạp…) **không** để trong `mid`. Cho vào `occ=[(y_chân, items)]`.
3. Viết hàm spot trong `spots.py` (xem mục 4) và thêm vào `SPOTS`.
4. Chạy `preview_spots.py <style> <v>` để xem chấm màu, rồi `build_assets.py`.

### 3.2 Thêm một **món cảnh** (để ghép)

```python
P('shop_counter', 'furniture', MIDI + BACK, 'shop counter with a cash box and goods on top',
  lambda t: shop_counter(t, 560, IB + 230, 800), 960, IB + 230, INT,
  [S('behind_counter', 'stand', 960, IB + 190, 'behind the shop counter'),
   S('counter_top', 'surface', 760, IB + 60, 'on the counter'),
   S('before_counter', 'stand', 1300, IB + 260, 'in front of the counter (customer)')],
  front=True)
```

- `kind`: building, furniture, fixture, wall hoặc scenery. Nó quyết định ô (`slots`) mà món được đặt vào (`Q.KIND_SLOTS`).
- `ax, ay`: điểm neo, thường là giữa chân món. `native`: `INT` (hz=IB, fy=950) hoặc `EXT` (hz=HB, fy=930). Khi ghép, code co món theo phối cảnh của ô.
- Tọa độ spot vẽ ở khung gốc 1920×1080; khi ghép sẽ được dịch và co theo món.
- `front=True`: món che người, được xuất thành lớp `data-occ`.
- Vẽ hàm trong `refkit.py` hoặc `interior.py`, đăng ký vào `PIECES`, rồi chạy `export_pieces.py` và `build_pieces.py`.

### 3.3 Thêm một **đồ vật**

1. Thêm `{ key, name, note, tags }` vào danh sách props trong `motionPuppetSeed.ts`.
2. Vẽ hàm trong `refprops.py` trong khung 512×512, đáy đặt ở y≈480 cho khớp `base` [256,480].
3. Thêm vào `REF_PROPS`: `'key': (fn, size, mount)`.
   - `size` là chiều cao so với người, ví dụ đồng tiền 0.04, xe máy 1.9.
   - `mount` là một trong `floor | table | hang | held | air | shoulder | wear | body`.
4. Chạy `build_assets.py`.

### 3.4 Thêm một **nhân vật dựng sẵn**

1. Thêm vào `ARCH` trong `chars.py`, kèm `desc` tiếng Anh rõ ràng. Hồn ma thì đặt `group='ghost'`.
2. Gói minimal chỉ có đầu (thân do engine vẽ). Gói chibi có thân và sprite `sit` (co gối, **không vẽ ghế**) và `kneel`. **Không dùng sprite `lie`**: engine xoay cả người để vẽ người nằm.
3. Chạy `build_assets.py`, rồi `preview_chars.py` để xem.

### 3.5 Đưa lên máy

- Copy các file JSON sinh ra vào `kit-library/<type>/` trên máy, cùng với các file `.py` và `.ts` đã sửa.
- Thư mục output dùng một tên mới cho mỗi lần deploy, ví dụ `outputs/c98d/...`.
- Mỗi lần commit tối đa 50 file, nên chia thành nhiều đợt.

---

## 4. Cách **cố định vị trí** (spot) theo video mẫu

### 4.1 Hệ tọa độ
- Khung 1920×1080. `y` là **chân** người hoặc đáy đồ vật. `y` càng lớn thì càng gần máy và người càng to.
- Phối cảnh: hệ số co = `PERSP_MIN + PERSP_SPAN × (y − horizon) / (floor − horizon)`, với `PERSP_MIN 0.68` và `PERSP_SPAN 0.32`. Hàng sau không được quá nhỏ (đã sửa ở c98c).
- `puppetHorizon(set)` là chân tường hoặc chân trời; bóng in vách (`shadow`) bị cắt tại `wallY`.

### 4.2 Loại spot (`SPOT_KINDS`) và màu chấm khi preview
| kind | màu | dùng cho |
|---|---|---|
| stand | tím | đứng (trước bàn thờ, cạnh cửa sổ, sau quầy…) |
| sit | xanh dương | ngồi (ghế dài, võng, bàn học) |
| lie | xanh lá | nằm (giường, sàn, quan tài) |
| surface | vàng | mặt để đồ (bàn, bàn thờ, quầy) |
| open | đỏ | khoảng sàn trống |
| door | trắng | cửa, nơi người vào ra |
| hang | cam | chỗ treo đồ |
| smoke | — | gốc khói (đầu nén nhang) |

### 4.3 Cách đặt một spot
1. Xem video mẫu và ghi lại: người thường đứng ở đâu so với món đồ? Ví dụ: người bán đứng sau quầy và bị che tới thắt lưng; học trò ngồi sau bàn; ma ló sau mộ; người khóc quỳ trước quan tài.
2. Mỗi món đồ quan trọng cần đủ các phía: `before_*` (trước), `behind_*` (sau, bị che), `beside_*_left/right`, `*_top` (surface), và các chỗ ngồi hoặc nằm trên nó.
3. Spot `behind_*` có `y` nằm **giữa mặt trên và chân** món che, để món che được nửa dưới người. Nếu y gần chân quá thì người bị che mất hết; nếu xa quá thì không bị che. Các giá trị đã chỉnh:
   - quan tài: IB+100;
   - mộ lẻ: HB+10;
   - mộ trong nghĩa địa: HB+60;
   - giếng: HB+130;
   - sạp chợ: HB−20.
4. Món dài (bàn học) có nhiều chỗ cạnh nhau: `school_desk_left`, `school_desk`, `school_desk_right`, và một lối đi `desk_aisle`.
5. `label` viết tiếng Anh, mô tả rõ (vd `'in front of the hollow (peek in)'`), vì AI COMPOSE chọn spot dựa vào label này (`puppetSpotsText`).
6. Biến thể lật ngang (v1, v3) tự đổi left↔right trong key và label (`mirror_word`). Không viết tay bản lật.
7. **Luôn kiểm bằng sheet chấm màu** (`preview_spots.py`, hoặc `e2e/compose.ts --new` cho cảnh ghép). Chấm phải nằm đúng chân người, không lơ lửng, không chui vào tường.

### 4.4 Đồ đạc che người (occluder)
- Cảnh kho thì đặt `occ=[(y, items)]` trong `scenes.py`; `build()` xuất ra `<g data-occ="y">`, có lật theo nếu cảnh là bản lật.
- Cảnh ghép thì món `front=True` được `setComposer.ts` xuất thành `Q.OCC(y, ...)`.
- Engine `splitFg` tách các nhóm `data-occ`, rồi `drawStage` vẽ chúng xen giữa nhân vật theo `y`: người có y nhỏ hơn món thì bị che, người có y lớn hơn thì đứng trước món.

### 4.5 Ghim chỗ (pinned)
- Nếu AI đặt một người vào spot gắn với đồ đạc (spot không phải `front_*` và không nằm trong `FREE_SPOTS = open_floor, floor_center`), layout **giữ nguyên** vị trí đó.
- Đội hình chỉ xếp những người còn lại. Đừng để đội hình tự động kéo người ra khỏi quầy, võng hay giường.

---

## 5. Đội hình (`FORMS`)

| form | khi nào | khoảng cách (`FORM_GAP`, đơn vị thân người) |
|---|---|---|
| single | 1 người | — |
| pair | 2 người đứng cạnh nhau | 0.95 |
| talk | 2 người nói chuyện, quay mặt vào nhau | 2.4 |
| whisper | thì thầm, sát nhau | 0.75 |
| apart | xa cách, giận nhau | 2.6 |
| row | từ 3 người trở lên | 1.15 |
| cluster | 2 cụm (lớp học, khán giả) | 0.62 |
| search | đi tìm, cầm đuốc, so le | 1.6 |
| file | hàng người đi xa dần (đưa tang) | `FILE_DX`, `FILE_DY` |
| attend | có người nằm: người chăm quỳ đầu giường | `ATTEND_SLOTS` |
| around | quanh một vật | `AROUND_SLOTS` |
| crowd | người phụ đứng một hàng phía sau | — |

- Khi AI không ghi `form`, code tự suy ra bằng `puppetFormOf`: có người nằm thì attend; khung object có ≥2 người thì around; 2 người thì talk hoặc pair; từ 3 người thì row.
- Thêm một đội hình mới cần 4 việc:
  1. thêm vào `FORMS` và `FORM_GAP`;
  2. thêm nhánh xếp trong `layoutPuppetFrame`;
  3. thêm mô tả vào phần GROUPS của prompt COMPOSE;
  4. thêm cảnh kiểm vào `e2e/stills.ts --forms`.

---

## 6. Cố định nhân vật

- **Ma** được quyết định bởi **vai trong truyện** (`puppetCastIsGhost`: `GHOST_NAME_RE` / `GHOST_LOOK_RE`), không phải bởi nhân vật dựng sẵn được ghép vai.
  - `HUMAN_ROLE_RE` (thầy, sư, bà đồng, nhân chứng…) không bao giờ là ma.
  - Bước ghép vai cấm ghép nhân vật nhóm ghost cho người thường, và ngược lại.
- **Cách vẽ ma:** engine `drawGhost` vẽ lên canvas phụ, phủ màu lạnh, giảm bão hòa, chân mờ dần thành sương, có quầng phía sau, không có bóng chân. Ma chỉ bồng bềnh và nhấp nháy khi bật chuyển động; khi tắt thì đứng yên để khung dùng lại được. Ma không bị nghiêng.
- **Người nằm:** engine xoay cả người, nên đầu và thân luôn liền nhau. Không dùng sprite `lie`.
- **Người lạ hoặc bóng người:** dùng actor `sil: true` (bóng đen đặc). Chỉ dùng với các shot trong `SIL_SHOTS`.
- **Chạy:** `trail` (bóng mờ nối đuôi), tự bật với tư thế run.
- **Gánh vai:** điểm vai được tính bằng `max(shoulder, headCy + headH × NECK)` và `SHOULDER_DROP 0.69`, nên gói chibi đầu to cũng không bị đòn gánh ngang miệng.
- **Prompt vẽ sprite ngồi:** phải ghi "sitting with bent knees, NO bench, chair or any furniture drawn", vì ghế đã có trong cảnh.

---

## 7. Cố định đồ vật (ngữ pháp vật)

READ gán `object.type`, và loại này quyết định cách vẽ:

| type | xử lý |
|---|---|
| furniture, fixture, wall | thành **món của cảnh** (ghép vào cảnh), không phải đồ vật rời |
| tool, small | cầm tay (`held`) |
| load | gánh vai (`shoulder`, tư thế shoulder) |
| wearable | `wear`, nhưng **chỉ** nhận mũ, nón, khăn, áo (`WEARABLE_RE`), và giữ suốt chương |
| vật đặt vào miệng, mắt hoặc người chết (`BODY_PLACE_RE`: ngậm, nhét…) | `body` và chuyển thành shot **insert** (cận vật). Không bao giờ vẽ lên đầu |
| container, creature, source | floor, table hoặc air tùy vật |

**Khói** chỉ bám vào vật là nguồn khói (`SMOKE_SOURCE_RE`) và không nằm trên tay hay trên người. Nếu khung không có vật như vậy thì lấy theo thứ tự:
1. spot `smoke`;
2. mặt bàn thờ trừ đi `SMOKE_TIP` 90;
3. nến hoặc lửa.

Không có nguồn nào thì không vẽ khói.

---

## 8. Khung dựng (shots và overlay) học từ video mẫu

- **SHOTS:** establishing, people, two, duo, group, wide, back, bust, ots, close, insert, object, symbol, shadow, blink, **split**.
- **split:** chia đôi khung. Bên phải dùng `set2`/`light2`; mặc định là cùng cảnh nhưng ngày đối với đêm. Engine dùng `ctx.ox` để dịch nửa phải.
- **inset:** kính lúp ở góc, hiện một nơi khác (place key).
- **shadow:** bóng in vách, đen đặc, thẳng đứng, cắt tại chân tường.
- **OVERLAYS:**
  - rain, fog, dust;
  - steam, smoke;
  - ghost: ma ló ở mép khung, không vẽ nếu trong khung đã có ma;
  - flashback: phủ nét gạch hồi tưởng;
  - lurk: hốc tối có đôi mắt.
- Mọi hiệu ứng phải chạy được ở **cả hai chế độ** bật và tắt chuyển động. Khi tắt thì phải đứng yên tuyệt đối, để bước render nhận ra khung giống nhau và dùng lại.

---

## 9. Quy trình học từ video mẫu thành case cố định

1. Xem video mẫu (YouTube): chụp khung tại các cảnh tiêu biểu. Chỉ xem, không tải.
2. Với mỗi khung, ghi lại:
   - nơi chốn và món đồ có trong cảnh;
   - số người, đội hình, ai đứng sau hay trước món nào;
   - góc máy (shot) và hiệu ứng (overlay).
   Xem ví dụ ở `claude/STUDY_REFERENCE_8_VIDEOS.md`.
3. Gom thành các case chung và đối chiếu từng case với kho:
   - đã có khuôn hay món chưa;
   - có spot đúng chỗ chưa;
   - có đội hình hay shot tương ứng chưa.
4. Phần còn thiếu thì thêm vào kho theo mục 3; thiếu cách dựng thì thêm vào engine, layout và prompt theo mục 5 và 8.
5. Cập nhật prompt READ và COMPOSE để AI **biết** có case mới: liệt kê spot, form và shot mới cùng ví dụ JSON.
6. Thêm case vào `e2e/stills.ts` và kiểm cả 2 gói, ở cả chế độ bật và tắt chuyển động.

### Ví dụ: thêm case "người bán sau sạp chợ"
1. Trong `scenes.py` → `market`, chuyển mặt sạp từ `mid` sang `occ.append((HB, [...]))`.
2. Trong `spots.py` → `market`, thêm `sp('behind_stall_mid', 'stand', x, HB - 20, 'behind the market stall (seller)')`.
3. Chạy `preview_spots.py` và xem chấm tím có nằm sau mặt sạp không.
4. Chạy `build_assets.py`, rồi `e2e/stills.ts --more` và xem người bán có bị che tới thắt lưng không.
5. Deploy các file `set` của chợ (4 biến thể × 2 gói × ngày/đêm) cùng với `scenes.py` và `spots.py`.

---

## 10. Kiểm tra trước khi deploy

| Lệnh | Kiểm gì |
|---|---|
| `python3 preview_spots.py <style> <v>` | Sheet chấm màu spot của mọi cảnh kho |
| `npx tsx e2e/compose.ts --new` | Cảnh ghép kèm chấm spot |
| `npx tsx e2e/stills.ts --forms\|--more\|--ghost\|--fix [--chibi] [--motion]` | Ảnh tĩnh từng case |
| `npx tsx e2e/run.ts` (minimal, chibi, `--none`) | Pipeline đầy đủ không lỗi |
| `npx tsc --noEmit` | Phải đạt, không chấp nhận lỗi cũ để bỏ qua lỗi mới |

Cần nhìn ảnh và xác nhận:
- người không lơ lửng, không chui vào tường;
- món che che đúng nửa dưới người;
- ma không nghiêng;
- người nằm đầu liền thân;
- đồ đeo chỉ là mũ, nón, khăn, áo;
- khói ra từ đầu nhang;
- gói chibi không lòi ghế trong sprite ngồi.

---

## 11. Lỗi đã gặp (đừng lặp lại)

- Tự đặt id cho asset → asset không nạp. Phải dùng `newPuppetId`.
- Đội hình tự động kéo người khỏi spot AI đã chọn → thêm cơ chế ghim chỗ.
- Spot `behind_*` đặt quá sâu → người bị che mất hết.
- READ gán đồng tiền là "wearable" → đồng tiền lên đầu. Đã thắt lại `WEARABLE_RE` và `BODY_PLACE_RE`.
- Khói bám vào bất kỳ đồ vật nào → chỉ bám vào nguồn khói.
- Cờ ma lấy từ nhân vật dựng sẵn → thầy mo thành ma. Phải lấy từ vai trong truyện.
- Sprite `lie` của gói chibi → bay đầu. Engine xoay cả người.
- Split lệch nửa phải do `setTransform` → dùng `ctx.ox`.
- Chấm preview chèn vào SVG con → chèn trước `</svg>` **cuối cùng**.
- Màu trong hằng số của engine phải là hex, vì helper `rgba()` chỉ nhận hex.


---

## 12. Bố cục theo nhóm vai và gói dân gian 23/10/2026

Đã cài thêm 372 file cho hai gói: 32 thiết kế bối cảnh × ngày/đêm × lật trái/phải × hai phong cách = 256 bối cảnh; 32 đồ vật × hai = 64; 18 nhân vật × hai = 36; 8 cụm nội thất × hai = 16.

READ ghi `blocking:{kind,roles}` để gắn nhân vật trong truyện với vai trong nhóm. Bối cảnh và cụm nội thất ghi `compositions:[{key,kind,roles}]`, trong đó mỗi giá trị của `roles` là một `spot.key` có thật. Không vẽ người cố định vào SVG nền; cố định quan hệ của các điểm đặt rồi gán đúng nhân vật từ truyện.

```json
{
  "blocking": {"kind":"bedside","roles":{"patient":"ba_lao","caregiver":"nguoi_con"}},
  "states": [
    {"char":"ba_lao","action":"talk","posture":"lie","support":"bed","transition":false},
    {"char":"nguoi_con","action":"talk","posture":"idle","transition":false}
  ]
}
```

Ví dụ này giữ bà lão nằm khi nói và người con đứng cạnh. Muốn người con ngồi cần tư thế `sit`, chỗ tựa `chair` và một composition có ghế tương ứng. Không đổi tư thế theo người đang nói. `transition:true` dành cho thay đổi thể chất được truyện nêu rõ.

Mỗi vai giữ điểm riêng; quần chúng không dùng chỗ đã dành cho nhóm. Lật cảnh phải lật cả tọa độ, hình, bounds, hướng mặt và tên/vai trái/phải. Ngày/đêm dùng cùng hình học. Cụm nhiều người dùng slot `scene_center` để không bị thu nhỏ vào ô đồ vật thường. Khung hình giữ bố cục qua cận cảnh và quay về; không dàn lại đội hình sau mỗi câu.

Chọn kho kiểm cả nhóm, tư thế và chỗ tựa. Khi chưa có nhóm tương thích, luồng ghép/vẽ mới nhận yêu cầu cụ thể rồi kiểm lại; không xem một cảnh có giường bất kỳ là đủ cho mọi cảnh có người nằm. Ảnh nguồn chỉ để đối chiếu, tài nguyên cài là hình dựng riêng.

Xem [báo cáo và lệnh kiểm tra](docs/motion-folk-library-2026-10-23.md), [bảng ảnh gọn](docs/video-references/folk-blocking-20261023/index.html) và [liên kết tới 22 nguồn](docs/video-references/folk-blocking-20261023/reference-coverage.json). Phạm vi đối chiếu là bảng tổng quan và ảnh chọn lọc, chưa phải toàn bộ cảnh/thoại của 22 video; cơ chế bế/khiêng người chưa nằm trong phần đã kiểm chứng.
