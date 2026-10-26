# Đối ứng Video Motion — 26/10/2026

## Bổ sung sửa hợp đồng kết quả AI

Sau lượt người dùng chạy thực tế lúc 14:45, đã đối ứng tiếp mâu thuẫn null tại nhu cầu minh họa và giới hạn sửa không tiến triển. [Bằng chứng và phạm vi](motion-illustration-null-root-fix-2026-10-26.md) có fixture trích từ nháp lỗi và xác nhận phục hồi bước này không cần AI. Không tự tiếp tục dự án hoặc tạo video để nghiệm thu.

Đã bổ sung schema và chẩn đoán kiểu dùng chung, chuẩn hóa an toàn lỗi `propRules`, sửa đúng vùng pending ở các bước liên quan, giữ phần đạt và giảm prompt lặp. [Báo cáo chi tiết](motion-response-contract-fix-2026-10-26.md) ghi bằng chứng từ bản nháp thật, kiểm hồi quy và lần nạp lại backend. Phần bổ sung này không tạo/tiếp tục video hoặc gọi AI/TTS thật; các mô tả chưa restart ở đợt trước bên dưới được giữ làm lịch sử.

## Bổ sung phần viết truyện

Đã bổ sung hợp đồng đề tài nguồn và hồ sơ cách kể cố định cho `ghost_tale`, nối qua lập dàn ý, DNA, viết/sửa chương và editor; sửa tham chiếu nguồn, kiểm trùng câu, giữ phân vai khi biên tập. Xem [báo cáo và kiểm hồi quy](motion-folk-story-contract-2026-10-26.md). Phạm vi này không đóng toàn bộ ma trận hoặc chứng nhận chất lượng model thật.

## Bổ sung đợt chuyển kho

Đã đối ứng tiếp R04/R05/R06/R07/R18/R22 cho kho mô-đun; dữ liệu cảnh cũ đã rời kho hoạt động. Xem [báo cáo riêng](motion-modular-library-release-2026-10-26.md). Các bảng 789/471/5.160 bên dưới ghi lần migration trước, được giữ làm lịch sử. Việc bỏ 471 cảnh khỏi kho hoạt động thay cho tiếp tục tách các cảnh đó đã hoàn tất; nghiệm thu toàn plan vẫn theo phạm vi và các giới hạn ghi trong báo cáo.


## Phạm vi và trạng thái

Đối chiếu [plan ngày 26/10](motion-production-root-fix-plan-2026-10-26.md), gồm R01–R22, 82 mã cũ A–K và hai bổ sung về kho ghép/bến sông. Giữ các bản sửa trước đó và diff đang có; không reset Git.

**Đã triển khai và kiểm cục bộ các thay đổi bên dưới. Chưa đóng toàn bộ plan:** dữ liệu kho cũ còn phần chưa tách/duyệt, một số hợp đồng cần mở rộng bằng chứng, và nghiệm thu dịch vụ/giọng/video thật chưa thực hiện. Không dùng “test qua” để khẳng định mọi truyện sẽ thành công.

Trong đợt này **không tạo, tiếp tục hoặc xuất video ở bất kỳ thời lượng nào; không gọi AI/TTS thật, không khởi động lại backend**. Kiểm dùng AI/TTS giả, PCM tổng hợp, file `.fixture` với probe giả và ảnh tĩnh renderer thật. Không chạy `verify-motion-media-validation.ts` vì script đó tạo MP4. Những bằng chứng chạy thật trong báo cáo ngày 25/10 là lịch sử, không phải kết quả của lượt này.

## Ma trận R01–R22

“Cục bộ” nghĩa là thay đổi có kiểm tại máy trong phạm vi fixture; “Một phần” còn việc kỹ thuật/dữ liệu cụ thể; “Nghiệm thu” cần người dùng chạy/nghe/xem trên dịch vụ thật.

| Mã | Trạng thái | Thay đổi và bằng chứng | Giới hạn còn lại |
|---|---|---|---|
| R01 | Cục bộ | Giữ backend production owner; bảng caller bên dưới phân biệt production/manual/admin/preview/seed. `production-runner`, `editorial-ui`, `cancellation`. | Bảng chỉ bao phủ Video Motion và các dependency trực tiếp; không chứng nhận mọi export động trong repo đã chết. |
| R02 | Một phần | Beat ID bền theo nội dung/chapter, giữ ID hợp lệ cũ; READ checkpoint theo item và dependency; signature voice bỏ title/visual/place. `root-contracts`, `prompt-resume`, `persistence-integrity`. | Không tự map mọi nháp chapter legacy khi đổi partition; cần xác minh dependency, không suy đoán theo index. |
| R03 | Cục bộ | Coverage phân biệt chưa kiểm/đã kiểm rỗng/đã kiểm có need, gắn chapter dependency/clue IDs; thiếu chỉ bổ sung vùng thiếu, giữ truyện. `motionIllustrationRepairService`, `plan-readiness`, `root-contracts`. | Khai báo và exact evidence không chứng minh AI hiểu hết nghĩa; cần nghiệm thu manh mối với lời kể thật. |
| R04 | Cục bộ | Schema JSON dùng chung TS/Python; normalizer dùng tại migration và cửa ghi `writePuppet`, admin/seed đi qua kiểm tương ứng. Piece kind, môi trường, extracted contacts, prop surface, location patterns chung. `resource-writes`: 12 ca TS/Python tương đương, giữ file khi ghi lỗi, legacy rename và guard kho đóng. | Không tự sửa snapshot khi đọc. Bản cũ chỉ đổi tên/đếm uses vẫn được giữ để chẩn đoán; thay geometry phải qua kiểm. Unknown family không bị ép thành loại cụ thể. |
| R05 | Một phần | Audit 5.160 hồ sơ; 789 cảnh thành recipe v2, 3.810 hồ sơ tạo/cập nhật trong đợt migration; backup/dry-run idempotent. `resource-recipes`: 789 cảnh, 4.537 style/set/base/piece được quét. | 471 cảnh còn adapter/recipe có sẵn; 12 hồ sơ chưa phân loại; 67 nhóm cùng appearance chưa đủ bằng chứng gộp/xóa. Chi tiết bên dưới. |
| R06 | Cục bộ | Typed resource diagnostics phân biệt metadata/filter/support/search/missing/combination; tìm và ghép có capacity, mở rộng trong gói; no-progress guard, local failure không hỏi AI lặp vô ích. `plan-readiness`, `assembly-capacity`, `root-contracts`. | Thiếu thiết yếu thật vẫn cần bổ sung kho ngoài production; không thay sai vật hoặc xuất hình trống để báo đạt. Prefix thiếu SET chỉ còn adapter cho lỗi legacy. |
| R07 | Một phần | Chuyển owner/đặt xuống làm hết hiệu lực bằng chứng cầm cũ; lịch sử liên tiếp theo scene/place, không gom mọi lần ghé cùng nơi. Nested bowl→tray→table, root propAt giữ đúng; reset resting scope khi đổi nơi/chapter. `root-contracts`, `visual-contract`, `posture-continuity`. | Parser quy tắc hỗ trợ tập diễn đạt đã kiểm; chưa chứng minh mọi hồi tưởng, đại từ hoặc lan truyền đến hội tụ trong mọi truyện. |
| R08 | Cục bộ | Bỏ tự tăng budget theo fixed context; đo wrapper/context/payload/final/images; single item overflow có quyết định transport. Truyền budget tới lớp gửi browser của 5 provider, giữ Unicode và receipt. Queue/provider/CAPTCHA không tiêu response deadline. `prompt-transport`, `ai-recovery`, `prompt-resume`. | Mặc định vận hành 16.000 ký tự; không phải context limit của model. Override artifact/model có đường dùng nhưng chưa có benchmark để đặt riêng. API native vẫn atomic full prompt; không nói mọi request API dưới 16k. |
| R09 | Một phần | Nguồn có ledger theo segment/event/cause/clue/setup/payoff/outcome, quote và boundary được giữ độc lập; DNA core/profile tách; creative/retune dùng response contract giữ draft. `source-planning`, `dna-repair`, `prompt-resume`. | Ledger bảo vệ bằng chứng đã trích, không chứng minh AI chưa bỏ sót sự kiện ngoài khai báo. Protected facts lớn vẫn dùng transport, không cắt đoạn kết để đạt số ký tự. |
| R10 | Cục bộ | DTO nhiệm vụ, cast/place/phần lời liên quan; READ item cache và context gần; repair chỉ pending/path, chỉ kèm catalog khi sửa trường cần vật. Source/editor/voice dùng worker snapshot khi độc lập. `read-contract`, `field-repair`, `prompt-resume`. | Không cắt danh mục đến mức mất khóa/thuộc tính phân biệt. Một hình đồng thời vẫn xử lý chung; chương nối tiếp giữ dependency. |
| R11 | Một phần | Contract route/total ledger, partial accepted lưu ngay, no-progress và legacy marker giữ budget; core DNA/retune/source-part chuyển contract. Casting không nuốt service/cancel/uncertain. Inventory bộ đếm ở dưới. | Những vòng có semantics riêng vẫn giữ caller và validator; chưa có cơ sở ép tất cả về cùng một ngưỡng hoặc xóa mọi vòng cũ. |
| R12 | Cục bộ | Pool chung theo retained production: room chính và hai helper, helper nhận việc tiếp khi xong; room giữ hội thoại. Provider cap chung, CAPTCHA theo provider; handoff chỉ release editorial owner, renderer riêng khi owner khác còn giữ Chrome. `ai-recovery`, `production-runner`. | Fixture chứng minh scheduler/lease, chưa đo mức song song/tốc độ trên dịch vụ thật. Một tài khoản CAPTCHA có thể chặn nhiều room cùng provider. |
| R13 | Cục bộ | Fencing/input hash/checkpoint/log/cancel giữ nền cũ; fault injection ghi lỗi/crash/late owner không báo complete giả. `persistence-integrity`, `production-runner`, `cancellation`, `job-polling`. | Không phải chứng nhận mọi sự cố mất điện/phần mềm giữ file Windows; lỗi ghi dai dẳng vẫn phải hiện và giữ payload. |
| R14 | Cục bộ | Voice signature theo spoken content/cast voice traits/profile; casting checkpoint riêng dialogue rows; sửa visual/SEO không reset PCM. AI voice dùng worker room giữ tiếp, nhả trước TTS local. `voice-continuity`, `prompt-resume`, `root-contracts`. | Đổi text/speaker/profile/filter vẫn invalidate đúng clip. Fallback narrator có log, không coi như đã phân đúng vai. |
| R15 | Nghiệm thu | Giữ profile Thần trùng, kiểm rõ chữ/pacing/continuity cho narrator và vai, không chuyển chuẩn Mèo Đen. `voice-clarity` dùng PCM tổng hợp, `voice-pacing` dùng TTS giả. | Chưa nghe raw→filtered→mixed của lượt mới với file Thần trùng; chưa chứng nhận giọng giống mẫu hay rõ chữ mọi câu. Không tự đổi toàn bộ voice binding. |
| R16 | Nghiệm thu | Giữ camera chậm/bỏ shake, speechRanges độc lập sub, mouth theo speaker, effect theo nguồn và identity ghost. `camera-comfort`, `effect-routing`, `frame-references`, `visual-contract`. | Độ dễ chịu chuyển cảnh/zoom, nhịp sub và hình với thoại cần xem video người dùng chạy. |
| R17 | Cục bộ + nghiệm thu | Check cancel sát publish và khi recovery trước/sau await probe; publication idempotent trước/sau rename, invalid media không publish. `publication-faults` dùng `.fixture` và probe giả. | Không thực thi encoder/GPU/CPU hoặc giải mã MP4 mới trong đợt này; giữ validator thật sẵn có. |
| R18 | Một phần | Phase chờ slot/provider/readiness/response/CAPTCHA, room generation/target IDs/thời điểm trong activity và badge gọn; review toggle và hai nút cạnh nhau giữ nguyên. `editorial-ui`, `job-polling`. 3D production báo không hỗ trợ trước AI. | Cần nghiệm thu UI thật màn lớn/nhỏ; chưa có dashboard mọi chỉ số token/output/receipt/latency. Standalone spec/gen3d/preview còn riêng, không tuyên bố production 3D đã hỗ trợ. |
| R19 | Nghiệm thu | Giữ readiness/model picker sau load, reload cùng room hai lần rồi thay, pending submission không gửi trùng, CAPTCHA năm tiếng và provider lock/fallback. `ai-recovery`/fixture browser. | Chưa gọi Gemini/ChatGPT/DeepSeek/Grok/Claude thật hoặc kiểm âm thanh CAPTCHA trên máy. |
| R20 | Nghiệm thu | Hai gói qua 854 kiểm/82 ảnh tĩnh; thêm 6 ảnh từ installed library: bến sông, bát trên khay, đứng–nằm. Không AI/TTS, kho không đổi trong bài kiểm. | Không tuyên bố đã xem lại 22 video; mỹ thuật toàn kho/chibi/ghost và lời–hình thực vẫn cần duyệt. |
| R21 | Cục bộ + nghiệm thu | SEO chỉ từ script cuối, timestamp cục bộ, draft/field repair/optional giữ video chính; thêm Stop guard để callback hủy không gọi AI thêm. `seo`, `production-runner`. | Thumbnail thật không sinh trong đợt này; cần xem đúng truyện khi người dùng yêu cầu tạo. |
| R22 | Một phần | Chuyển caller trong helper hiện có, bỏ nhánh đã thay, giữ free drawing/admin/legacy data; format width400/CRLF các TS/JS sửa. Schema loại mảnh không chép lại ở constants TS. | Không xóa ảnh/trùng/route chỉ vì ít import. Chưa đủ bằng chứng gộp toàn bộ 67 nhóm cùng hình hoặc xóa mọi export động. |

## Kho cũ, nền/mảnh/recipe và bến sông

### Kết quả migration đã áp dụng

- Semantic: **5.160 hồ sơ**, đợt apply trước đã cập nhật 3.013 hồ sơ. Sau hợp nhất helper, dry-run cuối **0 thay đổi**, **0 trùng ID**, **12 chưa phân loại**, **67 nhóm cùng appearance**, **402 nhóm biến thể semantic**; **0 xóa**.
- Scene components v2: **789 cảnh**, **3.810 hồ sơ tạo/cập nhật**. Recipe runtime khôi phục SVG đúng bản đã cài; snapshot lấy đủ base/pieces và chặn reference thiếu. Dry-run v2 **0 cảnh/0 hồ sơ mới**.
- Các mảnh v1 chưa đủ transform/contact giữ `recipeOnly`; base trích một phần giữ `recipeOnly`/`decomposition:partial`. Không xem chúng là nền sạch dùng tùy ý.
- Seed toàn bộ đã chạy vào `scratch/motion-seed-root-20261026/kit-library`: 1.092 generated, hook migration 485 scenes/2.224 assets; không cài đè kho production. Các cửa seed bổ sung đều gọi semantic/geometry trước ghi.

**471 cảnh giữ lại:** 315 `no_extractable_components`, 56 `composed_recipe_retained`, 52 `source_not_verified`, 48 `named_source_not_verified`. Nhóm 56 đã có base/piece plan. Nhóm 315 không có thành phần qua helper đã xác minh; không đủ bằng chứng gọi là nền sạch. Hai nhóm 52/48 cần đối chiếu nguồn/hình trước tách tiếp. Đây là việc dữ liệu còn mở của R05/R20; không giải quyết bằng cách gán metadata “clean” hoặc xóa cảnh.

48 cảnh named chưa xác minh gồm sáu họ, mỗi họ 8 biến thể: `fixed_chase_path`, `fixed_workyard`, `banyan_spirit_shrine`, `banana_grove_path`, `forest_tiger_path`, `highland_village_meeting`. 52 cảnh còn lại gồm 36 nhóm rỗng và 16 placement custom. Giữ adapter để dự án/snapshot cũ không mất hình.

Báo cáo và backup: `scratch/motion-semantic-migration-20261025/audit.json`, thư mục `backup`/`history`; `scratch/motion-scene-components-v2-20261026/report.json`, `backup`; dry-run riêng `scratch/motion-scene-components-v2-dry-20261026/report.json`.

### Sửa gốc bến sông và quan hệ đồ vật

Bàn di chuyển được có phạm vi sử dụng độc lập môi trường của nền; kiến trúc vẫn bị giới hạn. Retrieval truyền đủ số điểm đặt từ READ, không coi “có bàn” là đủ cho nhiều vật. Các đạo cụ độc lập cần điểm riêng; bát trên khay dùng surface của khay và chỉ khay chiếm điểm bàn. Chỉ ghép nested khi có bằng chứng, không ép mọi vật dùng chung một điểm.

Ca installed library dùng river base `bas-054eef4576422017` và table `pcs-8343a505136335d8`. Hai gói đều qua river/table/tray/rice/paperboat, nested bowl/tray, standing/lying bedside. `rootFrame.propAt` được giữ khi ghép nested; bằng chứng cũ hết hiệu lực sau câu nhấc vật/đổi nơi. READ schema action sửa từ `idle` sang các action hợp lệ; `idle` là posture/pose.

Ảnh tĩnh: [bảng sáu hình](../scratch/motion-root-illustrations-20261026/contact-sheet.jpg), [report có lời và frame](../scratch/motion-root-illustrations-20261026/report.json). Các ảnh minh họa không chứng nhận mọi tài nguyên có mỹ thuật đạt; minimal bedside vẫn có chi tiết cradle foreground của cảnh legacy.

## Caller: giữ, thay, bỏ

| Entry/caller | Owner/dữ liệu | Quyết định |
|---|---|---|
| UI Tạo/Tiếp tục/Dừng → routes/controller → production actions/service | Backend owner, production input/hash/checkpoint | Giữ một orchestrator; reload UI chỉ polling, không submit/auto-chain. |
| Sửa script/analysis/SEO/voice/build riêng ở controller/actions | Thao tác có chủ ý, dependency riêng | Giữ; không xóa vì production tự động đã có. |
| DNA/kịch bản/SEO | Retained editorial chính | Giữ room chính tuần tự, context hash/generation; helper độc lập tách khỏi gate chính. |
| Source parts/editor/READ/review/SFX/phân thoại | Worker scope cùng production, provider gate chung | Thay ép một luồng toàn cục bằng helper pool; vẫn giữ dependency chương và thứ tự trong một room. |
| TTS local | Một voice owner, clip cache/quality | Nhả browser sau AI voice; không giữ lease cả quá trình PCM. |
| Compile/render/publication | Pack snapshot → renderer riêng → file/manifest | Release đúng editorial owner; không đóng Chrome của lượt khác; kiểm cancel trước publish. |
| `writePuppet`, admin rename, seed TS, free drawing/composer | Live library ngoài scope production đóng | Dùng normalizer/validator trước ghi; guard đóng chạy trước normalization. Metadata-only legacy được giữ; geometry mới phải đạt. |
| Seed Python/build/migration | Schema JSON chung, backup/staged/report | Giữ công cụ quản trị, chạy có chủ ý; không gọi sinh kho trong production. |
| `assetProfiles`, vẽ SVG/sprite/set | Nhánh tự do/admin còn caller | Giữ. Production đóng bỏ dịch toàn kho/AI cast match/AI chọn choiceId. |
| Legacy choiceId/provenance/snapshot/recipe v1 | Dữ liệu lịch sử đang đọc | Giữ adapter; không đổi fingerprint để hợp thức hóa dữ liệu bị sửa. |
| Prefix lỗi thiếu SET | Caller legacy | Chỉ adapter tương thích; đường mới dùng `MotionResourceError`. |
| `motionPromptPayloadBudget` tự nới trần và watchdog trùm queue | Helper hiện có | Đã thay; không thêm helper/orchestrator V2 song song. |
| Đồ vật trích contact bằng bbox đơn thuần | Migration/seed | Thay bằng bbox + semantic fixture match; key dựa tag ổn định để đổi tên không biến bàn thành scenery. |
| Production 3D và standalone spec/gen3d/preview | Khả năng khác nhau | Production 3D vẫn chặn sớm; giữ standalone còn dùng. |

## Inventory retry và budget

| Bộ đếm | Phạm vi/lưu | Quyết định |
|---|---|---|
| `MotionAiResponseContract` route/total | Rejected content và routes trong checkpoint | Đường chuyển mới dùng 2 content rejects/route, 10 tổng; không reset khi đổi room/provider. Các task optional có budget nhỏ riêng. |
| DNA core/retune/creative/source-part/needs | Draft keyed theo dependency và legacy marker | Contract chung; giữ accepted paths và lịch sử rejects. Legacy budget không tự tăng lại mỗi resume. |
| `MotionRepairLedger` chapter/READ/storyboard/editor/SEO | Pending ID/path, omitted giữ/null theo schema | Giữ validator miền; accepted ghi ngay, nhóm lại không xóa accepted. |
| Source ledger compact | Attempt theo group key, tối đa `LEDGER_REPAIRS` | Giữ riêng vì có fallback bảo toàn facts/nguồn và không đổi nội dung truyện. Không dùng budget tổng để ép mất nguồn. |
| Optional DNA profile | Hai lần nội dung rồi giữ core/draft | Optional; không làm lại core khi profile không đạt. |
| Voice dialogue split | Attempts từng beat, tối đa `SPLIT_ATTEMPTS` (2), checkpoint từng hàng | Giữ budget theo item; service/cancel không bị nuốt hoặc tính thành content. Hết khả năng phân vai có log fallback, giữ lời. |
| Room reload/replace | Service room recovery, room generations | Hai reload cùng room rồi một room mới theo loại lỗi; không phục hồi room cho một field sai. Pending submission kiểm phản hồi cũ trước, tránh gửi trùng. |
| Provider/service wait | Cooldown và step retry persisted | Giữ cơ chế 10 phút/hữu hạn sẵn có; tách khỏi content budget và CAPTCHA wait. |
| Duration correction | Rate/round trong production | Giữ ngưỡng lệch 15%, tối đa hai vòng; chưa nghiệm thu tốc độ cuối bằng giọng thật. |
| Atomic Windows write | EPERM/EACCES/EBUSY hữu hạn | Giữ file cũ và payload tạm, không xóa đích để lách lỗi. |

Không biến mọi vòng retry khác trách nhiệm thành một hằng số. C07/R11 còn mở ở mức kiểm đầy đủ caller còn lại; không tuyên bố đã xóa mọi vòng chuyên biệt.

## Kiểm tra và bằng chứng

Kết quả kiểm cục bộ của đợt này lưu tại `scratch/check-*-20261026.log`. Một số bài có lỗi EIO/missing audio được tiêm có chủ ý; kết luận dựa assertion và exit code, không dựa việc log không có chữ “lỗi”.

| Nhóm | Bài kiểm đã qua |
|---|---|
| Type/build dữ liệu | `tsc --noEmit`; Python `compileall`; 388 seed records semantic/geometry; full scratch seed build |
| Contract nguồn/truyện | `root-contracts`, `source-planning`, `dna-repair`, `prompt-resume`, `field-repair`, `read-contract` |
| Prompt | `prompt-transport`: budget 6000/12000/16000/24000, final wrapper overflow, Unicode/concatenation đủ |
| Kho | `resource-writes` 12 equivalence cases; `plan-readiness`, `assembly-capacity`, `closed-pack` 854 checks / 82 stills / 0 AI; `closed-pipeline` 2 styles; `resource-recipes` 789 scenes; `river-illustrations` 6 stills |
| Room/production | `ai-recovery`, `production-runner`, `persistence-integrity`, `cancellation`, `job-polling`, `editorial-ui` |
| Voice/ảnh/timeline | `voice-clarity` PCM tổng hợp, `voice-continuity`, `voice-pacing` mock TTS; `simple-illustration`, `placement-general`, `posture-continuity`, `visual-contract`, `frame-references`, `effect-routing`, `camera-comfort` |
| SEO/xuất | `seo`; `publication-faults` crash trước/sau rename, repeated recovery, cancel trong probe, invalid audio không publish — probe giả/file fixture, không MP4 |

Lệnh nhóm kiểm an toàn được thêm: `npm run test:motion-root-contracts` (bốn bài root/resource writes/prompt transport/publication faults). Không bao gồm gọi AI/TTS hay tạo video.

## Đối chiếu 82 mã cũ

Bảng sau giữ phạm vi và những giới hạn đã công bố ngày 25, cộng bằng chứng mới. “Cục bộ” không có nghĩa đã nghiệm thu giọng/hình/dịch vụ thật. Không cộng số test thành tỷ lệ hoàn thành sản phẩm.

| Mã | Trạng thái | Bằng chứng/việc còn lại sau đối ứng ngày 26 |
|---|---|---|
| A01 | Cục bộ | Caller production/manual/admin/seed/preview và keep/replace/remove đã lập trong báo cáo; không chứng nhận mọi export động ngoài phạm vi. |
| A02 | Một phần | Stable beat/read dependency và fencing đã kiểm; còn ma trận sửa riêng/legacy chapter partition, không tự map theo index. |
| A03 | Cục bộ | Actions dùng chung, backend điều phối, reload không auto-chain; runner/cancellation |
| A04 | Cục bộ | Checkpoint lỗi không thành công; corruption/EPERM/late owner/cancel; persistence/atomic/runner |
| A05 | Cục bộ | Chờ dịch vụ có budget, Stop bền, UI chỉ theo dõi; recovery/cancellation |
| A06 | Một phần | Normalizer ghi kho giữ snapshot đọc; voice/READ dependency đã hẹp; chưa chứng minh mọi nháp legacy chuyển partition được map. |
| B01 | Một phần | Final prompt/context/wrapper/images và submittedChars/messageLimit có diagnostic, phase/timestamp/targetIDs ở activity; chưa đủ token/output/latency benchmark thật. |
| B02 | Cục bộ | Không tự nới trần, overflow có receipt transport; default route16k và override artifact/model có caller; fixture final wrapper/Unicode qua. API vẫn native atomic. |
| B03 | Cục bộ | DTO chương/READ/editor/voice/SEO; bỏ context và original task thừa trong repair |
| B04 | Một phần | Ledger facts/quotes/boundaries bảo toàn, core/profile tách; nguồn bảo vệ quá lớn còn transport, không chứng nhận mọi tóm tắt đủ nghĩa. |
| B05 | Cục bộ | Retrieval đủ capacity/semantic và mở rộng trong pack; catalog DTO giữ khóa/mount/thuộc tính. Không tuyên bố mọi noun Việt/Anh có alias. |
| B06 | Cục bộ | Nhóm sự kiện/câu/READ/editor/thoại/review/SFX theo prompt, giữ một hình đồng thời |
| B07 | Một phần | READ item cache/stable beat và voice dependency qua regroup/insert fixture; legacy chapter mapping vẫn phải xác minh. |
| B08 | Cục bộ | Repair DNA/chương/truyện/READ theo pending/path, giữ null/omission; prompt-resume/field repair |
| B09 | Cục bộ | Receipt theo hash/page, navigation invalidate; fixture kiểm directive vượt ngưỡng và reload |
| B10 | Một phần | Có phép đo và hồi quy cùng input; chưa benchmark latency/chất lượng dịch vụ thật do không gọi AI trong đợt này. |
| C01 | Cục bộ | Contract/identity/target/ID, parse rồi validate; recovery/field repair |
| C02 | Cục bộ | Accepted/draft được checkpoint trước khi nhóm xong; mixed READ/resume |
| C03 | Cục bộ | Khóa path/ID/mục đạt, array theo identity; field repair/prompt-resume |
| C04 | Một phần | Owner transfer/release và nested bowl-tray-table, scene boundary/resting reset đã kiểm; chưa chứng minh mọi dạng đại từ/hồi tưởng/state convergence. |
| C05 | Cục bộ | Bỏ nhân route, giữ budget qua READ subset/legacy và duration rate/round; recovery/prompt-resume |
| C06 | Cục bộ | Phục hồi container có bằng chứng, không điền phần nội dung cụt, vẫn kiểm identity |
| C07 | Một phần | Core DNA/retune/source-part thêm contract; inventory phân biệt loops còn cần giữ. Chưa khẳng định mọi vòng cũ đã được thay/xóa. |
| D01 | Cục bộ | Một retained pool main+2helper, source/editor/scene/voice dùng tiếp; scheduler/provider cap fixture và ai-recovery qua. |
| D02 | Cục bộ | Content/service/readiness/CAPTCHA phân biệt; recovery |
| D03 | Cục bộ | Phục hồi hữu hạn, checkpoint service wait/budget; runner/recovery |
| D04 | Cần nghiệm thu | Readiness/model picker có hồi quy và bằng chứng UI lịch sử; chưa gọi lại provider thật đợt này |
| D05 | Cục bộ | Provider/model lock và thứ tự fallback; AI recovery |
| D06 | Cần nghiệm thu | Cơ chế năm tiếng/chờ CAPTCHA còn; cần kiểm âm thanh thông báo trên máy người dùng |
| D07 | Cục bộ | Receipt gắn page/hash, invalidate navigation/close; headless fixture đã qua |
| D08 | Cục bộ | SEO sau script, chạy trong lúc media, chờ hữu hạn rồi nhả room; runner |
| D09 | Cục bộ | TTS local nhả lease sau AI voice; handoff theo owner, giữ room owner khác và renderer riêng; fixture qua, live đa production cần nghiệm thu. |
| E01 | Một phần | Structured ledger kind/source quote/causes và boundary facts; kiểm source-planning qua. Coverage ID không tự chứng minh mọi sự kiện đã được AI trích. |
| E02 | Cục bộ | DNA core/profile tách, creative và retune contract giữ accepted; global facts lớn có overflow transport rõ, không cắt lõi truyện. |
| E03 | Cục bộ | Unknown/checked_empty/checked_needs và clue/chapter dependency gate; thiếu coverage chỉ audit phần thiếu, root-contracts/plan-readiness qua. |
| E04 | Cục bộ | Chương lớn chia sự kiện/factual sentence theo thứ tự, quỹ từ/thời lượng, child draft |
| E05 | Cục bộ | Repair beat/path, giữ mục đạt và đồng bộ utterances; prompt-resume/craft |
| E06 | Cục bộ | Editor nhóm nhỏ theo prompt, checkpoint beat, lỗi optional không bỏ script gate |
| E07 | Cục bộ | Chặn chapter thiếu/pending con/ID trùng/không đủ lời; production/persistence |
| F01 | Cục bộ | Schema semantic chung TS/Python/migration/writePuppet/admin/seed, 12 equivalence fixtures; không áp chuẩn ghi mới lên snapshot đọc. |
| F02 | Một phần | Audit mới5.160, duplicate ID 0 / same appearance 67 / semantic variant 402; 789 recipe đã áp,471retained chưa tách/duyệt toàn bộ;không xóa/gộp thiếu chứng cứ. |
| F03 | Cần nghiệm thu | Giữ mẫu/chibi chân sát người; hồi quy geometry không thay đối chiếu mỹ thuật từng ảnh |
| F04 | Cục bộ | Coverage khai báo và kiểm capacity/binding; river 2 surface / nested container qua cả 2 gói. Nghiệm thu đủ nghĩa của manh mối vẫn cần lời–hình thật. |
| F05 | Một phần | Shared key/alias/location/kind/env/surface, extracted spots theo fixture; 12 unknown và từ điển không bao phủ mọi danh từ. |
| F06 | Cục bộ | Typed recovery, local composition/capacity trước repair, no-progress bounded; thiếu cốt lõi/factual không tự đổi hoặc vẽ thêm. |
| F07 | Cục bộ | Một storyboard/read hợp lệ, bỏ lượt READ trùng, coverage tại máy; storyboard/closed pipeline |
| F08 | Cục bộ | READ nhỏ, missing row riêng field repair, giữ budget; read-contract/prompt-resume |
| F09 | Cục bộ | Compose/rank/geometry cục bộ, chữ ký selection/binding; closed pipeline/pack selection |
| F10 | Một phần | Lịch sử liền mạch, đặt xuống/chuyển người/nested relocation và rootAt đã kiểm; mọi state convergence ngoài fixture chưa chứng minh. |
| F11 | Cần nghiệm thu | Mouth/effect/nhịp hình có guard và hồi quy; cần xem hình cùng lời của bản truyện thật |
| F12 | Cục bộ | Review flag, nhóm tối đa bốn, tắt vẫn local validate; closed pipeline |
| G01 | Cục bộ | Một owner voice, TTS local không browser gate; runner/voice fixture |
| G02 | Cục bộ | Vai khóa bỏ casting, shortlist khi thiếu, thoại checkpoint giữ chữ/người; prompt-resume |
| G03 | Cần nghiệm thu | Profile Thần trùng được giữ; cần nghe đối chiếu mọi vai, không dùng fixture để chứng nhận giống giọng |
| G04 | Cần nghiệm thu | Filter/pacing cho mọi vai, giữ phụ âm/âm nhỏ; voice quality qua, cần nghe thực |
| G05 | Cục bộ | RIFF/PCM đầy đủ, offset data thực, cache text/mốc, trạng thái quality; persistence/voice quality |
| G06 | Cục bộ | Clip key/phụ thuộc/quality và giữ cache không đổi; voice quality |
| G07 | Cục bộ | Chọn chương lệch theo tiếng thật, state sửa duration giữ qua rate/round; production/prompt-resume |
| G08 | Cục bộ; cần nghe nghiệm thu | QA đã phân mức: chữ ước tính chỉ cảnh báo, thời lượng tiếng thật lệch vừa phải theo timeline thực; chỉ lệch nghiêm trọng mới sửa tối đa một vòng. Xem audit QA ngày 26. |
| H01 | Cục bộ | Timeline từ clip thật, retime storyboard/SEO; closed pipeline/runner |
| H02 | Cần nghiệm thu | Sub không nền/chớp, speechRanges khi tắt sub; cần xem cue/sub trên video truyện thật |
| H03 | Cần nghiệm thu | Camera chậm/bỏ shake có code và fixture; chưa nghiệm thu độ dễ chịu đầu ra mới |
| H04 | Cục bộ | SFX riêng trạng thái/accepted/budget, nhóm theo catalog thực; optional không mất track lời |
| H05 | Cục bộ | SEO brief/field repair, chạy sau script, timestamp tính cục bộ; SEO/runner |
| H06 | Cần nghiệm thu | Thumbnail optional có guard/caller; chưa tạo ảnh mới đợt này |
| I01 | Cục bộ | Preflight nguồn/kho/quyền ghi/đĩa/voice/tools; runner/persistence |
| I02 | Cục bộ | Handoff theo owner và shared renderer fallback; cancel sát publish/recovery probe; live đa owner/Chrome vẫn chờ nghiệm thu. |
| I03 | Cần nghiệm thu | Cache render/probe/GPU–CPU có code; chưa chạy renderer production dài đợt này |
| I04 | Cục bộ | Audio bắt buộc/signature/mux; thiếu tiếng không công bố; media validation |
| I05 | Cục bộ | ffprobe/giải mã/kích thước/duration/audio/file cụt, black/silence theo speechRanges |
| I06 | Cục bộ | Publication faults dùng fixture/probe giả qua trước/sau rename/repeat/cancel during probe; không tạo MP4 đợt này. |
| J01 | Cục bộ | Reload không submit/auto-chain, Stop đúng job, queue log/cancellation/runner |
| J02 | Cục bộ | JSONL/cursor, 1.004 dòng/restart, hàng phát sinh trong fetch và legacy log giữ nguyên |
| J03 | Một phần | Phase/roomGeneration/targetIDs/time và badge gọn;diagnostic prompt submittedChars/limit;chưa dashboard đầy đủ token/output/receipt/latency. |
| J04 | Cần nghiệm thu | Snapshot settings/review/mode có code; cần kiểm đầy đủ màn hình với dữ liệu thật |
| J05 | Cục bộ | Production báo sớm mode 3D chưa hỗ trợ, giữ standalone 3D còn caller; chưa chứng nhận production 3D |
| K01 | Cục bộ | Bảng caller/keep/replace/remove và retry inventory được chốt trong phạm vi Video Motion;không xóa dynamic export chưa có chứng cứ. |
| K02 | Cục bộ | Chuyển caller rồi dọn constants/nhánh đã thay, không thêm service V2 |
| K03 | Cục bộ | Giữ bỏ AI choiceId/dịch kho/READ đủ; kiểm closed pipeline |
| K04 | Cục bộ | Helpers theo miền prompt/ledger/repair/checkpoint/PCM/log; text/prompt constants |
| K05 | Cục bộ | Format phạm vi sửa width 400/CRLF, không thêm comment code sản phẩm, giữ diff có sẵn |
| K06 | Một phần | Backup/audit/recipe nguồn và snapshot giữ đủ;67 same appearance chưa đủ duyệt để xóa/gộp;471 legacy retained cần tiếp tục phân loại. |

## Bổ sung kiểm kho Nhà tôi / altar table

Đã đối ứng lỗi độc lập phát sinh sau khi phân tích của lượt thật hoàn tất: nhận nhầm môi trường từ phòng ngủ phụ trong mô tả, thiếu đồng nghĩa bàn cúng tại điểm đặt và cổng lọc bỏ qua fixture có sẵn. Kiểm lại ba địa điểm/bốn minh họa trên cả hai gói, giữ ba điểm bề mặt riêng; không chạy video. Chi tiết và giới hạn: [motion-house-altar-root-fix-2026-10-26.md](motion-house-altar-root-fix-2026-10-26.md).

## Việc còn mở và cách nghiệm thu

Phân mức QA mới và phục hồi bản nháp hết bộ đếm cũ được ghi tại [motion-qa-severity-audit-2026-10-26.md](motion-qa-severity-audit-2026-10-26.md). Bộ đếm số chữ ước tính không còn chặn lượt viết ban đầu; các lỗi ảnh phụ hoặc AI review không khả dụng cũng không buộc làm lại minh họa hợp lệ.

1. **Dữ liệu kho R05/R20:** đối chiếu tiếp 471 cảnh giữ adapter và 67 nhóm cùng appearance, tách các cảnh còn đồ vẽ liền khi có nguồn/hình/geometry xác minh. Không coi đây chỉ là việc chạy video; phần dữ liệu vẫn chưa hoàn tất.
2. **Code/hợp đồng R02/R07/R09/R11/R18:** còn ma trận legacy partition, ngữ nghĩa state/ledger ngoài fixture, các vòng chuyên biệt và dashboard đo đầy đủ. Các bảo vệ hiện có không bị bỏ để “luôn thành công”.
3. **Người dùng chạy thật R15/R16/R17/R19/R20/R21:** kiểm room reuse/ba yêu cầu thực, CAPTCHA năm tiếng, giọng narrator/các vai so đúng Thần trùng, hình với lời/miệng/sub/effect và MP4 cuối. Đây là phần người dùng tự chạy theo chỉ đạo, không tự tạo test 5p/20p hay test 2p.
4. **Nạp code backend:** bản log/tiến độ/preview mới đã nạp ngày 26 lúc 17:13, PID 72012, cổng 3002, giữ bản sửa QA trước đó. Không tiếp tục/tạo video; 99 file tiến độ/kịch bản/job giữ nguyên hash qua lần nạp. Chi tiết: [motion-progress-and-project-preview-2026-10-26.md](motion-progress-and-project-preview-2026-10-26.md). Các thay đổi code sau mốc này cần nạp lại nếu thuộc backend.

Giữ trạng thái plan đang mở cho các mục trên. Báo cáo này thay số liệu lịch sử khi đánh giá hiện trạng ngày 26; báo cáo ngày 25 được giữ như lịch sử, không sửa lại kết quả chạy trước đó.
