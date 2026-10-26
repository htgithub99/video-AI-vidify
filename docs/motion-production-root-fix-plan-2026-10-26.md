# Kế hoạch sửa gốc Video Motion — bản rà code ngày 26/10/2026

## Bổ sung sửa hợp đồng kết quả AI

Đã đối ứng lỗi kiểu dữ liệu DNA từ production thực tế, quy định đầu ra dùng chung, sửa đúng trường/beat và bảo toàn phần đạt; gộp prompt trùng và tính schema khi chia nhóm. Xem [báo cáo đối ứng và kiểm chứng](motion-response-contract-fix-2026-10-26.md). Backend đã được nạp lại trong đợt bổ sung này; không tạo hoặc tiếp tục video. Những ghi chú “không restart” ở các đợt trước bên dưới là lịch sử; toàn plan vẫn còn các mục nghiệm thu.

## Bổ sung hợp đồng viết Kỳ truyện ma dân gian

Đã đối ứng hồ sơ cách kể cố định, khóa đề tài nguồn, kiểm bằng chứng trong dàn ý mới, sửa tham chiếu nguồn ở editor và giữ phân vai khi sửa thoại. Xem [báo cáo và giới hạn kiểm cục bộ](motion-folk-story-contract-2026-10-26.md). Nguồn về trùng tang phải giữ đề tài trùng tang; sáng tác mới biến cố và cách mở nút.

## Cập nhật kho hoạt động mô-đun

Đã đưa kho cảnh cũ ra khỏi lựa chọn của hai gói, chuyển sang bản mô-đun v3: 52 nền, 190 mảnh, 348 mẫu ghép, 124 nhân vật và 300 đạo cụ. Xem [báo cáo chuyển kho và kiểm hồi quy](motion-modular-library-release-2026-10-26.md). Các số 789/471 và mô tả migration bên dưới là hiện trạng trước quyết định bỏ kho cũ, không phải số cảnh legacy đang hoạt động. Snapshot lịch sử vẫn có adapter; toàn plan chưa đóng.


## Cập nhật triển khai 26/10/2026

Đã triển khai các bản sửa và kiểm cục bộ, chi tiết tại [báo cáo R01–R22 và đủ 82 mã cũ](motion-production-root-fix-implementation-2026-10-26.md). **Plan chưa đóng toàn bộ**: 471 cảnh cũ còn adapter/phân loại, một số ma trận hợp đồng/đo lường còn mở và nghiệm thu dịch vụ/giọng/video thật do người dùng tự chạy. Không tạo hoặc tiếp tục video bất kỳ thời lượng nào trong đợt đối ứng này; không restart backend. Các đoạn ghi “chưa triển khai” phía dưới là nguyên trạng tài liệu lúc lập plan; trạng thái mới đọc theo báo cáo liên kết này.

## 1. Phạm vi và cách đọc trạng thái

Đây là kế hoạch tiếp nối code hiện tại, chưa phải báo cáo triển khai. Lượt lập tài liệu này không sửa code sản phẩm, kho, production hoặc cấu hình chạy; không gọi AI/TTS, tạo/tiếp tục video hay khởi động lại backend.

Bổ sung sau rà soát song song prompt: mục 6.1–6.5 quy định điều phối ba room từ đầu đến cuối, phần được chia và phần phải giữ thứ tự. Nội dung này được nối vào R08/R10/R12/R14/R18/R19, bảng dọn code và tiêu chí hồi quy; chưa triển khai thay đổi.

Bổ sung sau hai trao đổi về kho: mục 11 ghi hiện trạng bối cảnh còn chứa đồ vật vẽ liền và ca lỗi “Bến sông trước nhà”; nối việc chuyển kho sang nền/mảnh/recipe và sửa lọc, điểm đặt, phục hồi vào R03–R07/R11/R18/R20/R22. Đây là cập nhật kế hoạch, chưa sửa code/kho, chưa chạy hoặc tiếp tục video.

Các căn cứ:

- [Plan gốc với 82 mã A01–K06](motion-production-root-fix-plan-2026-10-25.md).
- [Ma trận triển khai và bằng chứng ngày 25/10](motion-production-root-fix-implementation-2026-10-25.md#trạng-thái-từng-mã-trong-plan).
- [Bản sửa minh họa đơn giản vừa hoàn thành ngày 26/10](motion-simple-illustration-implementation-2026-10-26.md).
- [Audit trước bản sửa minh họa](motion-simple-illustration-root-audit-2026-10-26.md), [audit prompt](motion-prompt-audit-2026-10-25.md) và [hướng dẫn kho](../HUONG_DAN_KHO_2D_CO_DINH.md).

Ma trận cũ có **45 mục kiểm cục bộ, 26 mục mới hoàn thành một phần, 11 mục cần nghiệm thu**. Đây là phân loại bằng chứng, không phải 45 mục đã bảo đảm chạy đúng trên mọi video. Những bản sửa ngày 26/10 bổ sung bảo vệ cho nhiều mã; không tự chuyển cả mã thành hoàn thành nếu phần còn lại chưa được kiểm.

Đợt rà này theo toàn bộ đường chạy Video Motion: UI/API → production/actions/store/checkpoint → nguồn/DNA/truyện/chương/editor → storyboard/READ/kho/layout/compile → voice/timeline/SEO/render/publication; đối chiếu constants/types, browser/recovery, engine và công cụ seed/migration/verify. Đây là rà code và đường gọi liên quan, không phải chứng nhận đã thực thi mọi nhánh, đọc mọi file ngoài chức năng hoặc duyệt từng hình trong kho. Không dùng việc đọc code thay cho nghe giọng, xem cảnh hoặc kiểm dịch vụ thật.

**Mục tiêu:** bấm Tạo video tạo đúng một lượt, dùng kho đúng gói, ưu tiên minh họa đơn giản đúng dữ kiện thiết yếu, sửa phần sai và giữ phần đúng. Lỗi bên ngoài phải có chờ/phục hồi hữu hạn và tiến độ bền vững; không thể cam kết dịch vụ AI luôn trả lời hoặc mọi nội dung đều biểu diễn được bằng kho hiện có.

## 2. Nền đã làm phải giữ nguyên

| Khu vực | Cơ chế phải giữ | Kiểm bảo vệ khi triển khai tiếp |
|---|---|---|
| Minh họa tĩnh | `simplePuppetStates` dùng chung: giản lược ngồi/quỳ/cúi phụ; giữ `essential:true`, nằm mặc định, quan hệ vị trí và điểm tựa cần thiết | `verify-motion-simple-illustration.ts`, posture continuity, plan readiness |
| Đồ vật | Điểm đặt bàn/sàn theo anchor; điểm gần cửa/giường từ geometry có sẵn; vật chính/phụ giữ `propAt`; continuity theo danh tính vật trước khi chấm bố cục | simple illustration, pack selection, spatial placement |
| Dữ kiện | Câu yêu cầu chưa là hành động đã xảy ra; kiểm bằng chứng chủ vật/điểm đặt; hình thường không thay manh mối `inverted`/`upside_down` | simple illustration, visual contract |
| Sửa AI | Truyện và `illustrationNeeds` sửa riêng; khóa trường đạt; sửa đúng nhu cầu/path; checkpoint phần đạt và budget | field repair, read contract, simple illustration |
| Ngân sách | Với hợp đồng mới/migrated đang áp dụng: hai phản hồi sai mỗi tuyến, mười tổng mỗi phần; route hết lượt khác tổng hết lượt; resume giữ bộ đếm, `strictProvider` giữ khóa | AI recovery, prompt resume; không ép mọi bộ sửa cũ sang con số này khi chưa chuyển hợp đồng |
| Tương thích | Draft revision 1 được chuyển một lần có lưu lịch sử; READ normalization 3, selection version 6 có ý nghĩa kiểm lại dữ liệu | simple illustration, persistence integrity, selection contract |
| Kho đóng | Đúng `minimal_mask`/`chibi_folk`; chọn/ghép tài nguyên đã có, snapshot và asset hash; không AI vẽ mới trong production | closed pack/pipeline, pack selection |
| Mỹ thuật | Chibi design version 3, chân khép liền, sprite thân/chân; ma từ đúng nhân vật/vai, không đổi mẫu đã duyệt | chibi review/verify, ảnh mẫu đã lưu |
| Production | Một backend owner, input sao chép sâu và hash, token chống ghi cũ, checkpoint nguyên tử, cancel, log backend có cursor | production runner/lock, atomic writes, cancellation, job polling |
| Room | DNA/kịch bản/SEO dùng phiên biên tập; worker cảnh có phòng độc lập; sửa nội dung không reset room; lỗi phù hợp reload cùng room hai lần rồi mới thay | AI recovery, browser reuse, room lifecycle, editorial UI |
| Giọng/xuất | Một owner TTS; hình/giọng song song; clip cache/PCM/ASR/quality; timeline từ tiếng thật; kiểm media và công bố có manifest idempotent | voice quality/continuity, media validation, production runner |
| UI | Review bật/tắt được lưu; tắt vẫn kiểm cục bộ. Hai nút Tiếp tục/Tạo video đã nằm cạnh nhau với gap 8 px | editorial UI và kiểm màn hình khi nghiệm thu |

Không reset Git, không hoàn nguyên các file vừa sửa, không tạo pipeline/service `V2` cạnh luồng hiện có. Chỉ chuyển phiên bản dữ liệu khi hợp đồng thực sự đổi và có adapter. Snapshot lịch sử không tự bị sửa theo kho mới.

## 3. Những điểm còn hở được xác định từ code mới nhất

| Điểm | Bằng chứng và giới hạn kết luận | Hệ quả cần xử lý |
|---|---|---|
| Chưa biết nhu cầu vẫn có thể qua kiểm kho | `src/lib/motionIllustrationNeeds.ts:13` chấp nhận `undefined`; `puppet/planReadiness.ts:39` dùng `illustrationNeeds || []` | Chỉ kiểm các nhu cầu AI đã khai báo chưa chứng minh truyện không bỏ sót manh mối/quan hệ cần thấy |
| Phục hồi thiếu kho còn nhận dạng bằng chuỗi lỗi | `motionPlanRecoveryService.ts:48,65,79` chỉ nhận prefix thiếu SET | Thiếu nhân vật/đạo cụ có thể thoát khỏi cơ chế sửa kế hoạch; kết quả tìm kiếm chưa ra cũng dễ bị hiểu thành kho thật sự không có |
| Trần prompt có thể tự phình | `motionPromptPayloadBudget` dùng `Math.max(budget, fixedChars + MIN_PAYLOAD_CHARS)`; `motionPromptGroupsAsync` giữ nguyên nhóm một mục dù quá budget | Chia nhiều item chưa xử lý được fixed context/catalog quá dài hoặc một item quá lớn |
| Prompt tạo đầu còn gom nhiều trách nhiệm | `analyzeStory` ghép `fullRequest`; `developCreativeStory` vẫn nhận nguồn/khung/catalog/rules toàn cục | Repair đã gọn hơn, nhưng request tạo đầu vẫn có thể dài/chậm; chia tin vận chuyển không giảm nhiệm vụ AI phải nghĩ |
| Phiên biên tập ép một luồng ở hai tầng | `motionStoryService.mapMotionAiPool` ép `parent.editorial ? 1 : limit`; `runMotionAi` ép `run.editorial ? 1 : ...`; phiên biên tập còn có gate riêng | Chỉ đổi AI_PARALLEL thành 3 chưa làm đọc nguồn/editor chạy song song; cần tách việc phụ độc lập khỏi lượt chốt trong room chính |
| Chưa có pool ba room chung cho cả production | Dựng cảnh dùng worker pool theo run/role; SEO dùng phiên biên tập; phân thoại có đường gọi riêng; provider gate Gemini/ChatGPT giới hạn ba yêu cầu, Claude một | Số tab mở không bằng số yêu cầu đang chạy; các nhánh có thể tranh slot hoặc tạo phiên ngoài pool của nhánh kia |
| AI phân thoại có thể dùng phiên ngắn theo yêu cầu | `motionStoryJobService.startStoryJob` chạy VOICE ngoài `runInMotionAiSession`; `motionAudioService` gọi voice plan; `runMotionAi` thiếu run thì tự tạo phiên và đóng khi xong | Cần giữ room cho phần AI casting/phân thoại, nhưng vẫn nhả browser lease trước TTS local; không bọc cả tác vụ voice dài vào browser lease |
| Watchdog tính cả thời gian đợi slot | `runMotionAiOnce` tạo watchdog trước `holdForCaptcha` và `acquireProviderGate` | Hàng đợi có thể tiêu timeout dù chưa gửi prompt; cần tách queue/readiness/response deadline và trạng thái tương ứng |
| CAPTCHA đang giữ chung các yêu cầu mới | `captchaHold`/`holdForCaptcha` ở cấp module | Cần xác định phạm vi provider/tài khoản/browser bị chặn; không hứa mọi room tiếp tục độc lập khi cùng chịu xác minh tài khoản |
| Identity còn gắn với cách chia | `normalizeBeats` tạo ID theo index; child draft còn part/input key; editorial revision không đại diện mọi sửa tay | Đổi partition hoặc sửa nhỏ có thể invalidate rộng, mất khả năng ghép đúng kết quả cũ nếu không có map rõ |
| Chủ vật theo lịch sử chưa đủ chuyển trạng thái | `illustrationFacts.puppetHoldingEvidence` tìm câu cầm vật lùi trong cùng nơi/scene | Có thể tìm lại bằng chứng cầm cũ sau đặt xuống/chuyển người; cần kiểm chuyển trạng thái, không chỉ tìm từ khóa |
| Handoff đóng phạm vi toàn cục | `motionStoryService.acquireMotionRenderBrowser` giải phóng mọi key trong `editorialSessions`; lifecycle giữ Set session toàn cục | A render có thể đóng phiên biên tập đang được B giữ để dùng tiếp, dù B chưa có request chạy |
| Schema kho chưa thống nhất từ nguồn sinh | Migration semantic mới chuẩn hóa chủ yếu set/base; seed/import/runtime chưa dùng đầy đủ một hợp đồng | Kho nhiều hình vẫn thiếu metadata hoặc tra cứu sai loại/màu/trạng thái/chỗ đặt; số lượng file không chứng minh đáp ứng tổ hợp |
| Bối cảnh cũ chưa tách hết thành thành phần có thể ghép | `python_scripts/kit_seed/scenes.py` còn vẽ liền bàn thờ/ghế/bàn trong `main_room`, chum/bao trong kho; migration layer/recipe chưa được runtime đọc, UI chưa hiện `set_base`/`set_piece` | Không coi SVG nhiều layer hoặc nhiều spot là đã phân tách đồ vật; phải chuyển dữ liệu, runtime và UI cùng hợp đồng ở mục 11.1 |
| Kho có mảnh phù hợp nhưng lọc sai môi trường | Ca production `1e57c6e1419281c1ec58f769ba72fd3c`: bến sông cần hai điểm mặt bàn; mảnh bàn có đủ điểm nhưng `environment: interior` bị loại khỏi exterior | Mục 11.2 phân biệt đồ vật di chuyển được với kiến trúc, yêu cầu có bằng chứng với chi tiết thêm; không báo thiếu bối cảnh chung hoặc gửi AI sửa lặp lỗi cục bộ |
| Cache/kiểm đầu ra có nhưng chưa đủ nghiệm thu | Có PCM/signal check, media decode, manifest, quality states; voice checkpoint còn phụ thuộc rộng vào analysis/voices | Không nên sửa lại cơ chế đã có; cần kiểm đúng phạm vi invalidation, nghe rõ chữ và xem hình thật |
| Mode không tương đương | Production đã chặn 3D sớm; standalone spec/gen3d/preview còn đường gọi | Giữ thông báo trung thực; không xem việc chưa có production 3D là lý do mở thêm dự án 3D trong đợt này |

Các rủi ro như ghi trạng thái khi mất điện, tranh browser nhiều production, mất mạch nguồn sau tóm tắt và sai nghĩa ngoài tập quy tắc cần fixture tái hiện trước khi kết luận từng nhánh chắc chắn lỗi. Không gộp lỗi dịch vụ, lỗi dữ liệu và thiếu tài nguyên thành một thông báo “phân tích lại”.

## 4. Luồng đích và mức chi tiết

Nguồn/cấu hình khóa → preflight → nguồn có ledger theo sự kiện → khung truyện và dữ kiện cốt lõi → khả năng minh họa thiết yếu từ kho → chương theo cụm sự kiện → script gate → một kế hoạch hình → dựng kho và TTS song song → timeline theo tiếng thật → render từng phần → kiểm/công bố.

SEO ngôn ngữ dùng script đã đạt và room biên tập còn sống; timestamp tính tại máy sau tiếng thật. Review/thumbnail/SFX/nhạc chỉ chạy khi bật và có trạng thái riêng. Không thêm lượt AI cho ID, tọa độ, geometry, timestamp, lựa chọn `choiceId` hoặc dữ liệu đã được kiểm và không đổi.

Thứ tự ưu tiên hình: **đúng người → đúng nơi → đúng manh mối/đồ vật → đúng quan hệ thiết yếu → bố cục dễ hiểu**. Ngồi thay đứng, cử chỉ tay và động tác mở cửa không phải mục tiêu riêng nếu không ảnh hưởng câu chuyện. Người bệnh đang nằm, người chết, vật đang nằm ở cửa thay vì trên bàn, người ở trong/ngoài hoặc vật thuộc người khác là những khác biệt có thể thiết yếu.

Đơn vị chia nhỏ là một nhiệm vụ đủ nghĩa, không phải một động từ. Một hình hai người và một vật phải xử lý cùng quan hệ của cả hình. Một câu sai một trường chỉ sửa trường đó; nhiều trường phụ thuộc có thể sửa chung trong một request gọn.

## 5. Các đầu việc triển khai

Mỗi mã R bên dưới là phần tiếp nối của mã A–K cũ. “Đạt” trong mục này là tiêu chí tương lai. Các test được nêu là test cần bổ sung/mở rộng khi triển khai, không phải kết quả chạy trong lượt lập plan.

### R01 — Khóa baseline, caller và phạm vi thay đổi

- **Liên quan:** A01, K01, K05; bảo vệ A03–A05, J01–J02, K02–K04.
- **Code:** `motionProductionActions.ts`, `motionProductionService.ts`, controller/routes, `useMotionStudio.ts`, `motionApi.ts`, package scripts và dynamic imports của engine.
- **Làm:** lập bảng entry point production/sửa tay/spec/preview/quản trị/migration, owner và dữ liệu đọc/ghi; phân biệt helper đang dùng với nhánh thực sự chết. Chốt danh sách fixture trước khi đổi từng miền.
- **Giữ:** production backend là owner; UI polling không thành submit; không xóa thao tác sửa riêng, upload voice hay override hợp lệ.
- **Đạt:** mọi nhánh định thay/xóa có caller/thay thế/test; diff của người dùng còn nguyên; không có thêm orchestrator hoặc retry song song.

### R02 — ID bền vững và revision theo phụ thuộc

- **Liên quan:** A02, A06, B07; bảo vệ C01–C03, J01.
- **Code:** `motionStoryService.normalizeBeats`, `motionChapterParts.ts`, `motionTaskCheckpoint.ts`, `motionStoryCheckpointService.ts`, `motionProductionActions.ts`, `motionEditorialContextService.ts`, storyboard/pipeline checkpoint.
- **Làm:** nhận diện sự kiện/beat/utterance/visual bằng ID bền và source range; index chỉ phục vụ thứ tự truyền. Map draft cũ khi partition đổi chỉ khi xác minh source/dependency tương đương; không đoán map theo index sau biên tập.
- **Làm:** revision bao gồm dữ liệu có ý nghĩa ở đường sửa tay; phản hồi gửi trước sửa không được ghi đè. Tách hash phụ thuộc tối thiểu khỏi hash toàn yêu cầu dùng cho dedup.
- **Giữ:** owner token/config hash, schema revision hiện có và lịch sử rejected counts; không cập nhật hash để hợp thức hóa snapshot bị sửa ngoài ý muốn.
- **Đạt:** chia lại nhóm, đảo thứ tự phản hồi, resume subset và sửa một beat giữ accepted/budget đúng ID; sửa tiêu đề SEO không sinh lại giọng; sửa thời gian không tự dựng lại hình.
- **Phụ thuộc:** R01; hoàn thành nền ID trước đổi partition trong R08–R10.

### R03 — Biết đã kiểm đủ nhu cầu minh họa hay chưa

- **Liên quan:** E03, F04; bảo vệ E07, F07 và bản sửa nhu cầu ngày 26/10.
- **Code:** types `motionVideo.ts`, `motionIllustrationNeeds.ts`, `motionIllustrationRepairService.ts`, `motionStoryService.ts`, `puppet/planReadiness.ts`, storyboard/visual contract.
- **Làm:** phân biệt `unknown`, đã kiểm không có nhu cầu đặc biệt và đã kiểm có nhu cầu. Coverage gắn chapter/event/source range cùng phiên bản hợp đồng; mảng rỗng đơn thuần không chứng minh đủ.
- **Làm:** dùng khung truyện/chương có cấu trúc đang được tạo để khai báo manh mối và quan hệ thiết yếu; code kiểm ID/evidence/coverage và đối chiếu sự kiện đã khóa. Khi còn mơ hồ chỉ hỏi phần thiếu trong chính bước đó; không quét mỗi danh từ bằng một request AI mới.
- **Làm:** adapter dự án cũ giữ truyện và nháp; đánh dấu vùng chưa kiểm, chỉ bổ sung vùng đó. Không đổi toàn bộ legacy thành “hợp lệ” hoặc bắt viết lại truyện.
- **Giữ:** schema/field repair hiện có, essential flags và nguyên tắc không biến đồ vật phụ thành bắt buộc.
- **Đạt:** bỏ hẳn `illustrationNeeds`, bỏ một manh mối đã khóa hoặc khai evidence sai không âm thầm qua gate; truyện thật sự không cần đạo cụ đặc biệt vẫn tiếp tục; không phát sinh READ lần hai khi kế hoạch đã đủ.
- **Phụ thuộc:** R02 cho coverage ID; R04–R06 cho kiểm khả năng.

### R04 — Schema semantic chung cho kho cũ, seed và import

- **Liên quan:** F01, F05, B05.
- **Code:** `motionPuppet.ts` types, `motionResourceSemantics.ts` constants/lib, `kitLibrary.ts`, `kitAdmin.ts`, `assetProfiles.ts`, `packInventory.ts`, seed Python và scripts migration.
- **Làm:** một hợp đồng versioned cho key semantic tiếng Anh/alias Việt, pack, loại, thuộc tính bắt buộc, trạng thái, tuổi/giới/vai, geometry/spot/support/mount/layer/anchor. Xuất dữ liệu/schema dùng được cho cả TypeScript/Python, không chép hai bảng enum khác nhau.
- **Làm:** validate tại seed/import/quản trị/migration; runtime dùng adapter cho hồ sơ cũ. Unknown có diagnostic rõ; phòng/nền chung giữ tính ghép, không gán bừa family cụ thể.
- **Bổ sung kho ghép:** phân biệt nền, kiến trúc, đồ nội thất/đạo cụ, recipe và cảnh đã ghép; tách môi trường của nền khỏi phạm vi dùng của món đồ. Metadata dùng trong/ngoài trời phải có căn cứ theo loại; không đổi mọi mảnh thành dùng mọi nơi. Hợp đồng geometry/điểm đặt và quan hệ vật nằm trên vật xem mục 11.
- **Giữ:** asset ID, SVG và chibi version đã duyệt; tên hiển thị Việt không cần bị đổi thành ID Anh; nhánh kho đóng không quay lại bước AI dịch toàn kho.
- **Đạt:** cùng một hồ sơ qua mọi cửa vào có semantic tương đương; lỗi metadata không bị báo thành không có hình; dry-run/apply idempotent, backup và đọc dự án cũ còn được.
- **Phụ thuộc:** R01; làm schema trước migration R05 và retrieval R06.

### R05 — Sửa tài nguyên cũ và xử lý trùng có bằng chứng

- **Liên quan:** F02, K06; phần mỹ thuật F03 nghiệm thu riêng ở R20.
- **Code:** `migrate-motion-resource-semantics.ts`, `python_scripts/kit_seed/*`, quản trị kho và pack snapshot/reference readers.
- **Làm:** audit mới theo schema R04, chia rõ sai metadata/sai geometry/sai hình; ba loại trùng ID, cùng hình, gần nghĩa được báo riêng. Không dùng số liệu 2.133 hồ sơ hoặc các nhóm trùng lịch sử làm số liệu hiện tại nếu chưa quét lại.
- **Làm:** lập sheet nén nhiều tài nguyên, ghi ID/pack/biến thể/spot; kiểm file mở được. Chỉ gộp khi đối chiếu hình, vai, mount, điểm đặt, ngày/đêm/lật và tất cả tham chiếu đang dùng; giữ alias/replacement map và backup.
- **Bổ sung kho ghép:** kiểm toàn bộ cảnh cũ còn vẽ liền đồ vật; chuyển thành nền không chứa đồ có thể thay đổi, mảnh tái sử dụng và recipe cố định theo mục 11.1. Xuất layer chưa được runtime đọc không tính hoàn tất; một món vẽ trong nền và đồng thời ghép thành mảnh phải bị phát hiện để tránh lặp hình.
- **Giữ:** biến thể cùng hình nhưng khác công dụng; snapshot dự án cũ; tài nguyên/output của người dùng. Không xóa ảnh để làm Git sạch.
- **Đạt:** chạy lại không tạo thêm thay đổi; cùng input chọn được cùng công dụng; references/live snapshot còn đọc được sau chuyển; mỗi mục gộp/xóa có bằng chứng duyệt.
- **Phụ thuộc:** R04; việc xóa thật chỉ sau kiểm caller/references R22.

### R06 — Tra cứu khả năng và phục hồi có kiểu

- **Liên quan:** F04–F06, E03; bảo vệ F09 và simplification mới.
- **Code:** `planReadiness.ts`, `motionPlanRecoveryService.ts`, `kitDraw.ts`, `packLocation.ts`, `packInventory.ts`, `setComposer.ts`, `packSceneChoices.ts`.
- **Làm:** thay bắt prefix thông báo bằng reason có kiểu: metadata không đủ, alias chưa biết, lọc quá hẹp, sai thuộc tính, thiếu loại người/vật, tổ hợp bất khả thi, giới hạn tìm kiếm, tư thế phụ. UI lấy text từ constants theo reason.
- **Làm:** tìm trong đúng pack theo semantic/thuộc tính; nếu shortlist không có thì mở rộng có kiểm trong kho. Tách `search exhausted` khỏi chứng minh không có tổ hợp. Chỉ rank ứng viên đã đủ điều kiện; tie-break ổn định.
- **Làm:** với dữ liệu đã chuyển, ưu tiên recipe đã kiểm từ nền/mảnh trong gói; cảnh trọn cũ chỉ tái sử dụng khi đáp ứng đúng hợp đồng và không chứa chi tiết gây sai nghĩa. Khi chưa có recipe phù hợp, ghép thành phần có kiểm → minh họa tĩnh bỏ ràng buộc phụ có căn cứ. Trong thời gian chuyển kho giữ adapter cho cảnh cũ; không xóa hoặc vô hiệu hóa hàng loạt. Giữ quan hệ/đầu mối thiết yếu. Với truyện sáng tác, chỉ điều chỉnh chi tiết phụ chưa khóa theo khả năng đã kiểm; giữ nhân quả/twist/kết và nguồn cốt lõi. Với dữ kiện gốc/chi tiết đã khóa không được tự đổi để vượt gate.
- **Bổ sung ca bến sông:** truyền đủ `puppetSetPlacementNeeds(reads)` vào tìm/ghép, thống nhất lọc khả dụng giữa preflight và pipeline; phân biệt điểm đặt thiếu, mảnh bị lọc, tổ hợp không hợp lệ và hết giới hạn tìm kiếm. Sửa nguyên nhân cục bộ trước khi cân nhắc AI repair; chi tiết tại mục 11.2.
- **Làm:** thiếu cốt lõi thật trả hồ sơ thiếu cụ thể để bổ sung kho ngoài production khi được yêu cầu; giữ tiến độ, không rẽ sang AI vẽ mới, thay vật gần tên hoặc xuất cảnh trống.
- **Giữ:** binding/preflight snapshot/asset hash và geometry hiện tại; không thêm một lượt AI chọn layout hay tọa độ.
- **Đạt:** nhà sư cao tuổi, vật lật ngược, khăn đúng màu/chất liệu, ghế cạnh giường đều báo/chọn đúng loại nguyên nhân; kho có nhưng alias khác phải tìm được; hết budget tìm kiếm không bị ghi “kho chắc chắn thiếu”.
- **Phụ thuộc:** R03–R04; có thể làm typed errors trước để giảm dừng sai sớm.

### R07 — State người/vật và lan truyền đến hội tụ

- **Liên quan:** C04, F10; bảo vệ F08–F09 và continuity ngày 26/10.
- **Code:** `illustrationFacts.ts`, `readContinuity.ts`, `frameContinuity.ts`, `visualContract.ts`, `propPlacement.ts`, `packSceneChoices.ts`, `pipelinePuppet.ts`.
- **Làm:** nối state có cấu trúc từ sự kiện đã xác nhận: actor posture/anchor, object instance/owner/mount/anchor, fixture state, scene/timeline. Thêm chuyển đặt xuống/trao/nhận/rời cảnh; hồi tưởng có state riêng.
- **Làm:** bằng chứng cầm cũ hết hiệu lực sau chuyển state. Câu mong muốn, phủ định, lời nhờ hoặc nhắc tên không thành sự kiện sở hữu; không mặc định mọi người được nhắc đều có mặt.
- **Bổ sung kho ghép:** state tham chiếu instance và anchor của recipe/cảnh đã ghép; quan hệ bát trên mâm, mâm trên bàn được biểu diễn và kiểm riêng khi có bằng chứng. Không yêu cầu mọi vật trong cùng cụm chiếm một điểm bàn độc lập, cũng không cho mọi vật dùng chung một điểm để bỏ qua chồng lấn.
- **Làm:** sau patch, kiểm lại quan hệ cùng hình và đi tiếp đến mốc state hội tụ/scene boundary có căn cứ; invalidate đúng hình/clip phụ thuộc, không xóa toàn bộ timeline. Dữ kiện mới thắng continuity score.
- **Giữ:** cả đạo cụ chính/phụ giữ điểm đặt; anchor từ lời kể; lying và essential không bị form conversation kéo đứng dậy.
- **Đạt:** A cầm → đặt bàn → B lấy không dùng lại bằng chứng A cầm; hồi tưởng không đổi hiện tại; bát ở bàn không nhảy sàn khi đổi vai vật chính; người đứng cạnh giường không bị kéo vào ghế.
- **Phụ thuộc:** R02, R04; parser quy tắc chỉ là lớp kiểm hỗ trợ, không tuyên bố hiểu được mọi cách diễn đạt tiếng Việt.

### R08 — Budget theo prompt cuối, đo được từng thành phần

- **Liên quan:** B01, B02, B10, J03.
- **Code:** `motionPrompt.ts` constants/lib, `runMotionAi`/builder trong `motionStoryService.ts`, `chatUiPlanningService.ts`, contract và diagnostic hiện có.
- **Làm:** đo sau khi đã có wrapper/schema/identity/context/catalog/JSON directive; tách fixed/dynamic/output dự kiến/ảnh/tin vận chuyển. Token chỉ là ước tính nếu không có tokenizer phù hợp.
- **Làm:** cấu hình budget theo artifact/provider/model; bỏ cơ chế tự nâng trần vì fixed context dài. Item đơn quá lớn trả quyết định split/retrieve/transport rõ, không âm thầm gửi như đã đạt budget.
- **Làm:** log thời gian readiness/upload/receipt/generation/parse/repair riêng; không kết luận AI chậm do prompt nếu phần chờ là CAPTCHA hoặc UI chưa sẵn. Benchmark cùng input/config và tổng roundtrip, không chỉ từng tin ngắn hơn.
- **Làm:** tách timeout hàng đợi/lease, readiness/upload và phản hồi AI; response deadline bắt đầu tại mốc gửi/tiếp nhận đã xác nhận. Pending submission chưa xác định vẫn giữ guard chống gửi trùng; đổi timeout không reset budget sửa.
- **Giữ:** transport receipt/generation guard, provider lock và accepted checkpoints.
- **Đạt:** mọi đường gửi có measurement và nhánh overflow; fixture wrapper đẩy request quá trần hoặc item đơn lớn đều được xử lý trước submit; báo cáo không nói ký tự là token.
- **Phụ thuộc:** R01; đặt measurement trước thay builders R09–R10 để có baseline.

### R09 — Tách nguồn, DNA và sáng tác đầu theo nghĩa

- **Liên quan:** B04, E01, E02; bảo vệ E04–E07, story/needs repair mới.
- **Code:** `motionSourceChunks.ts`, `motionSourceLedger.ts`, `motionStoryCraft.ts`, `motionStoryService.analyzeStory/developCreativeStory/newStoryDna`, các draft/repair chuyên biệt.
- **Làm:** nguồn dài chia tại sự kiện/câu đầy đủ, giữ ID/timestamp/quan hệ nguyên nhân và đoạn nguồn truy xuất được. Ledger nhiều tầng giữ core event/clue/setup/payoff/ending; chỉ đủ ID chưa là đủ nghĩa. Không ép tóm tắt làm mất kết hoặc fallback toàn nguồn vượt budget ở mọi bước sau.
- **Làm:** tách phần không phụ thuộc: DNA thể loại/nhịp/phong cách có thể riêng; xương sống động cơ–nhân quả–manh mối–twist–kết phải khóa chung khi đủ gọn. Nguồn ngắn một lượt nếu đúng budget, không bắt tách cho có nhiều bước.
- **Làm:** sáng tác từ tinh túy cấu trúc của nguồn, đổi truyện nhưng giữ lực căng nhân quả; dùng từ Việt tự nhiên, bỏ lặp nỗi sợ/recap. Nhu cầu minh họa chỉ nối vào kế hoạch đã ổn, sửa riêng không viết lại truyện đạt.
- **Giữ:** story draft và path lock hiện tại, phân biệt sáng tác với factual; không coi nháp/dàn ý là chương hoàn chỉnh.
- **Đạt:** fixture đầu mối ở đầu/cuối và twist qua nhiều chunk vẫn được giữ; sửa profile không đổi kết; giới hạn prompt tạo đầu được đo, không đẩy mọi context vào một `fullRequest` mới.
- **Phụ thuộc:** R02, R03, R08; R06 cung cấp khả năng kho trước khóa chi tiết minh họa.

### R10 — Context và catalog tối thiểu cho từng bước

- **Liên quan:** B04–B05, B07, B10; bảo vệ B03, B06, B08–B09, F07–F08, G02, H04–H05.
- **Code:** builders chương/editor/storyboard/READ trong story và puppet, `packCatalog.ts`, `motionEditorialContextService.ts`, voice direction, SEO và sound.
- **Làm:** DTO theo nhiệm vụ; phần chung đã xác nhận chỉ hydrate khi room generation/hash thật đổi. Máy vẫn giữ dữ liệu chuẩn và tự kiểm đủ coverage.
- **Làm:** retrieval trả ứng viên phân biệt đủ nghĩa, đúng pack/hash; cast/place của phần đang viết, state vào/ra và liên kết cần thiết. Nếu không có ứng viên thì mở rộng trong pack trước khi kết luận thiếu.
- **Làm:** repair chỉ pending ID/allowed paths/draft/lỗi và context đủ kiểm. Catalog chỉ có khi sửa trường cần tài nguyên. Missing cả row dùng schema row, không bắt trả lại cả nhóm đã đạt.
- **Làm:** gắn dependency và state đầu/cuối cho từng nhóm để hàng đợi ba room ở mục 6 nhận biết việc đã đủ đầu vào; không chạy song song ba chương truyện nối tiếp chỉ vì đã chia prompt nhỏ.
- **Giữ:** một hình với mọi người/vật đồng thời không bị chia thành những yêu cầu độc lập mất quan hệ; không thêm AI cho bước cục bộ.
- **Đạt:** tăng 200 beat ở xa không làm prompt READ hiện tại tăng tuyến tính; chia lại batch giữ ID/accepted/budget; tổng lời/coverage không đổi, không tăng số request vô cớ.
- **Phụ thuộc:** R02, R04, R08–R09.

### R11 — Thống nhất cơ chế repair, không tạo thêm tầng retry

- **Liên quan:** C07; bảo vệ C01–C06, D02–D03, D05 và bản sửa route budget mới.
- **Code:** `motionAiContractService.ts`, `motionAiRepair.ts`, chapter/DNA/story/needs repair, các vòng rejected còn riêng trong story/puppet/voice.
- **Làm:** inventory từng bộ đếm: item/stage/route/content/service/room/duration round; chuyển từng caller về ledger/contract chung khi tương đương, giữ validator đặc thù.
- **Làm:** content error không thành service failure; lỗi dịch vụ không tiêu content attempt; hết route chỉ đi fallback được phép, hết tổng không bị vòng cha gọi lại với budget mới. Legacy migration giữ lịch sử và có marker một lần.
- **Giữ:** omitted field là giữ, null chỉ xóa trường được phép; JSON recovery có chứng cứ, không bịa nội dung bị cụt; accepted được lưu ngay.
- **Đạt:** restart/đổi nhóm/đổi room/provider không reset ngân sách; response sửa lấn bị chặn; xóa vòng cũ trong cùng đợt chuyển caller.
- **Phụ thuộc:** R01–R02; không áp một ngưỡng mới lên mọi task chỉ vì một task đang dùng ngưỡng đó.

### R12 — Pool ba room, owner và bàn giao đúng tài nguyên

- **Liên quan:** D09, I02; bảo vệ D01–D08, G01.
- **Code:** `motionBrowserLifecycle.ts`, `motionStoryService.mapMotionAiPool/runMotionAi/runInMotionAiSession/acquireMotionRenderBrowser/releaseMotionEditorialSession`, `motionAiWorkerPool.ts`, `motionStoryJobService.ts`, `chatUiPlanningService.ts`, production SEO/handoff, render service.
- **Làm:** một hàng đợi có owner theo production, mặc định ba room/slot: một room biên tập chính và hai room hỗ trợ theo mục 6.1–6.5. Tái sử dụng worker pool/lifecycle hiện có; room xong nhận việc sẵn sàng tiếp theo, không chờ barrier cả nhóm nếu không có dependency.
- **Làm:** chuyển phần đọc nguồn/editor và việc phụ độc lập sang worker có context snapshot; giữ tuần tự mỗi room, gate chốt phiên biên tập và các chương/phần truyện còn phụ thuộc. Không bỏ hai điều kiện ép một luồng một cách toàn cục.
- **Làm:** mọi AI request của nguồn/DNA/chương/storyboard/READ/phân thoại/review/SFX/SEO đi qua cùng cơ chế cấp slot, có budget và route lock riêng; áp thêm giới hạn provider dùng chung giữa các production. Không tự thêm room khi slot đang bận.
- **Làm:** lease có production/editorial/worker owner và loại tài nguyên; release chỉ phiên thuộc lượt bàn giao. Phân biệt active request, retained idle room và render browser riêng.
- **Làm:** nếu Chrome chat dùng chung process, chỉ đóng process khi mọi owner đủ điều kiện; xếp hàng công bằng/có cancel và trạng thái chờ thật. Nếu cần cô lập, dùng context/process có owner trong service hiện có sau kiểm khả năng; không đóng B để A đạt yêu cầu đóng Chrome.
- **Làm:** SEO optional chờ hữu hạn như hiện có, giữ draft khi nhả; quay lại sau đã đóng thì hydrate phiên mới có ghi nhận. TTS local không giữ browser lease.
- **Làm:** CAPTCHA/hạn mức có phạm vi provider/tài khoản/browser đã xác định; tạm giữ các việc chịu ảnh hưởng, cho việc độc lập đủ điều kiện tiếp tục. Giữ cơ chế chống gửi trùng và xử lý challenge chung; không xóa hold chung trước khi có kiểm thay thế.
- **Giữ:** mỗi worker chat tiếp room của mình; reload cùng room hai lần rồi thay khi đúng loại lỗi; chặn gửi trùng khi submission chưa xác định; model chọn sau readiness; `strictProvider` không đổi trái khóa.
- **Đạt:** fixture ba việc độc lập chồng thời gian chờ AI; việc xong trước nhận mục tiếp theo, tổng active không vượt ba/provider cap; phụ thuộc vẫn đúng thứ tự. A handoff không phá room B của production khác; Stop A không hủy B; render không kẹt vì TTS; cancel khi chờ lease không giữ reservation chết. Có bằng chứng room được dùng tiếp qua nhiều yêu cầu.
- **Phụ thuộc:** R01–R02; kiểm fixture scheduler trước browser thật. Không bỏ gate an toàn chỉ để hết thông báo đang có tab bận.

### R13 — Phục hồi dữ liệu và lỗi ghi được phản ánh đúng

- **Liên quan:** A02, A06; kiểm bảo vệ A04–A05, I06, J01–J02.
- **Code:** production/store/job/task checkpoints, `motionFileUtils.ts`, `motionRenderPublication.ts`, log store và UI status projection.
- **Làm:** fault injection tại ghi job con/production/final log/rename/publication; kiểm durable state và public state có thống nhất. Lỗi ghi không được chỉ log rồi được UI diễn đạt là đã lưu bền.
- **Làm:** giữ terminal states qua restart; incomplete có quyền resume tiếp đúng stage/item; snapshot hỏng giữ để chẩn đoán, không auto ghi đè hoặc đổi hash. Recovery publication chạy idempotent theo manifest hiện có.
- **Giữ:** atomic write retry hữu hạn trên Windows, payload/file cũ khi ghi lỗi; log đầy đủ và reset phiên hiển thị chỉ khi tạo mới.
- **Đạt:** crash/EPERM/owner cũ/Stop và reload không nhân production hoặc công bố muộn; phần đạt tiếp tục đọc được. Chỉ sửa nhánh khi fixture chứng minh còn hở, không viết lại store.
- **Phụ thuộc:** R02; kiểm browser riêng ở R12.

### R14 — Cache giọng và phân vai theo phụ thuộc tối thiểu

- **Liên quan:** A06, G08; bảo vệ G01–G07.
- **Code:** `motionVoiceDirectionService.directMotionVoice`, `motionAudioService.ts`, `motionVoiceQualityService.ts`, `motionVoiceReferenceService.ts`, Python worker.
- **Làm:** tách checkpoint casting khỏi dialogue direction và clip PCM; hash chỉ dữ liệu ảnh hưởng thực đến mục đó. Sửa mô tả bối cảnh/SEO không reset casting/TTS; đổi người nói/voice/text/profile/filter đúng là phải invalidate phần liên quan.
- **Làm:** phần AI casting/phân thoại dùng room được cấp từ pool R12 và tiếp tục hội thoại cho các nhóm kế tiếp; khóa binding trước khi chia nhóm thoại. Chỉ giữ browser lease trong phần cần AI, nhả trước TTS local; không mở phiên ngắn mới cho mỗi prompt khi room còn hợp lệ.
- **Làm:** công khai trạng thái fallback thoại về narrator khi hết khả năng phân vai; không trình bày như đúng vai đã yêu cầu. Giữ toàn lời và cho biết phần còn cần xử lý.
- **Giữ:** kiểm WAV cấu trúc/signal/head-tail, cache raw/filtered, ASR REVIEW/UNAVAILABLE khác PASSED; không mặc định cache hiện tại chỉ kiểm file size.
- **Đạt:** đổi một thoại không sinh lại mọi clip; clip hỏng không được dùng; còn nguyên phụ âm đầu/cuối và speaker signature; budget/quality giữ qua resume.
- **Phụ thuộc:** R02, R11; không đổi filter/tốc độ khi chưa đối chiếu R15.

### R15 — Nhịp và rõ chữ theo Thần trùng cho mọi vai

- **Liên quan:** G08; nghiệm thu G03–G04.
- **Code:** voice pace/speed/speech rate/direction/audio, constants `motionAudioDirection.ts`/voice và `motion_vieneu_worker.py`/speech/texts.
- **Làm:** lấy đúng file Thần trùng đã cung cấp làm benchmark; chọn đoạn kể, đối thoại nam/nữ/già, nhỏ giọng/cảm thán và nhiều phụ âm cuối. Đo tốc độ có tiếng, khoảng nghỉ theo cụm nghĩa và đoạn nói nhanh cục bộ, không chỉ tổng phút.
- **Làm:** nghe raw → filtered → mixed; xác định phát âm chưa rõ do text/reference/model, filter, stretch hay mix rồi sửa đúng tầng. Nới filter/nén khi làm mất chữ; tránh kéo chậm mọi clip để che đoạn nói nhanh.
- **Làm:** giữ profile nhất quán mọi vai; hiệu chỉnh độ dài bằng phần văn bản cần thiết trước khi tăng stretch. Ngưỡng 15%/hai vòng hiện tại là chính sách có sẵn cần nghiệm thu, không tự đổi vì một con số toàn video.
- **Giữ:** không quay lại chuẩn Mèo Đen; không thay mọi voice binding; không dùng ASR/metric để tự chứng nhận giọng giống mẫu.
- **Đạt:** nghe rõ đầu/cuối câu, không cụm nói vội hoặc nghỉ giữa từ, không kéo chậm khó chịu; nêu rõ vai/đoạn nào còn REVIEW. Chọn profile mặc định sau đối chiếu nghe thực trong phạm vi người dùng yêu cầu.
- **Phụ thuộc:** R14 cho cache đúng; phần nghe thực là nghiệm thu riêng, không chạy trong lượt plan này.

### R16 — Timeline, sub, camera, miệng và nguồn hiệu ứng

- **Liên quan:** F11, H02–H03; bảo vệ H01, H04 và policy minh họa mới.
- **Code:** `motionDirectorService.ts`, `puppet/compilePuppet.ts`, storyboard timing, effect routing, `motion-engine/core.js`, `puppet2d.js`, `texts.js`.
- **Hiện có:** cùng set/light dùng fade 1,2 giây; khác cảnh dùng transition cấu hình; camera progress dựa mốc visual, pace 45 giây/minimum shot 8 giây. Miệng kiểm speaker trùng actor và speech range. Không xem các cơ chế này là chưa có code.
- **Làm:** kiểm tại mốc cắt và retime nhiều clip: camera không reset nhảy mỗi câu; subtitle không nền, đổi theo cụm lời ổn định; tắt sub vẫn có speechRanges cho quality/mouth. Đo crop của nhân vật/vật quan trọng trong suốt zoom, không chỉ frame đầu.
- **Làm:** xem khói/mùi/effect source và ghost theo binding; mùi không bắt buộc vẽ khói; narrator không khiến actor mở miệng theo nhịp nói. Tư thế biểu cảm miệng tĩnh khác animation nói.
- **Giữ:** bỏ shake, zoom/pan rất chậm, minh họa theo sự việc và actor motion toggle. Không thêm animation diễn mọi động tác.
- **Đạt:** không giật tại biên, sub không flash, lời–hình đúng người/vật; chậm/dễ chịu phải xem thực. Chỉ sửa khi fixture hoặc đoạn xem cho thấy còn sai.
- **Phụ thuộc:** R07, R14–R15; không cần phát sinh video dài để kiểm biên vài giây bằng media tổng hợp.

### R17 — Render và công bố: hoàn thiện kiểm cửa sổ lỗi

- **Liên quan:** I02–I03; bảo vệ I01, I04–I06.
- **Code:** `motionRenderService.runJob/renderSlice`, `motionMediaValidation.ts`, `motionOutputQuality.ts`, `motionRenderPublication.ts`.
- **Làm:** ma trận cache hợp lệ/hỏng, encoder GPU lỗi chuyển CPU khi phù hợp, render worker chết/cancel, audio signature sai, crash trước/sau rename và metadata. Reuse phần đã probe đúng; đổi encoder/schema cần cache key tương ứng.
- **Làm:** xác nhận metadata/public status chỉ báo complete khi file và manifest đạt; black/silence theo fade và speechRanges thật. Giữ khoảng nghỉ kể chuyện hợp lệ; không bỏ checkOutput để “thành công”.
- **Giữ:** manifest idempotent hiện có, MP4 có tiếng bắt buộc, renderer browser tách chat và chunk cache. Không tạo publication service mới.
- **Đạt:** file cụt/thiếu lời không được công bố; crash sau rename hoàn thiện metadata không render lại từ đầu; cancel không publish muộn; nhả lease khi mọi nhánh kết thúc.
- **Phụ thuộc:** R12–R13; production dài không nằm trong phạm vi tự chạy thử.

### R18 — UI trạng thái thật, settings và khả năng 2D/3D

- **Liên quan:** J03–J04; bảo vệ J01–J02, J05 và hàng nút vừa sửa.
- **Code:** `useMotionStudio.ts`, `MotionVideoCreator.tsx`, controls/review/voice-quality/SEO components, `motionApi.ts`, status types/constants.
- **Làm:** hiển thị đang làm/chờ dịch vụ/chờ CAPTCHA/sửa nội dung/pending và lần thử/retryAt từ backend, không suy đoán bằng một dòng log. Badge AI gọn, settings hai item/hàng khi đủ rộng; nút Tiếp tục/Tạo giữ cạnh nhau, wrap ở màn nhỏ.
- **Làm:** trạng thái từng room có nhiệm vụ, target IDs, đang chờ dependency/slot/provider hay đang gửi/chờ đáp án, room generation và thời gian từng pha. Hiển thị số yêu cầu thực sự đang chạy, không lấy số tab mở làm tiến độ song song.
- **Làm:** UI snapshot đúng AI chính/dựng, model/lock, review, motion, sub, SFX, voice profile và autoExport; reload không tự gửi lệnh. Log backend vẫn đầy đủ, UI phân trang thay vì cắt mất lịch sử.
- **Làm:** ma trận mode UI→API→actions→builder→renderer→validation: production kho đóng 2D; standalone gen3d/spec/preview giữ caller. Chọn không hỗ trợ báo trước khi mở AI, không âm thầm ép mode.
- **Đạt:** màn hình lớn/nhỏ, reload lúc chạy/lỗi/dừng, đổi dự án và callback cũ không nhận sai kết quả; công tắc review thật sự điều khiển lượt review; không sửa lại hàng nút đã đúng nếu không có lỗi hiển thị.
- **Phụ thuộc:** R02, R08, R12–R15 cho dữ liệu trạng thái.

### R19 — Readiness/model/CAPTCHA trên dịch vụ thật

- **Liên quan:** D04, D06; bảo vệ D01–D03, D05–D07.
- **Code:** Gemini/model/generation/upload readiness, submission recovery, `motionAlertBeep.ts`, room lifecycle và receipt.
- **Làm khi nghiệm thu:** cùng room tiếp nhiều tác vụ; ba room độc lập; simplified input/model picker load chậm; upload chưa nhận; pending response sau reload; CAPTCHA nhiều tab; Stop trong lúc chờ.
- **Làm khi nghiệm thu:** phân biệt CAPTCHA cùng tài khoản với provider độc lập; kiểm tổng active của dựng cảnh/phân thoại/SEO, room reuse, thứ tự nhận việc và timeout hàng đợi. Không tuyên bố nhanh gấp ba từ fixture hoặc chỉ nhìn thấy ba tab.
- **Giữ:** kiểm giao diện sẵn rồi mới chọn model, thứ tự fallback cấu hình DeepSeek Standard trước ChatGPT Auto, main/scene theo nhóm, route lock; không thay AI khi đang chờ CAPTCHA nếu khóa.
- **Đạt:** năm tiếng thông báo nghe được sau audio unlock, không đếm lặp cùng challenge thành vô hạn; người giải xong tiếp đúng request; quá thời gian không tự coi đã giải.
- **Phụ thuộc:** R11–R12, R18. Chỉ làm bằng lượt dịch vụ thật được người dùng yêu cầu; test fixture không thay bằng chứng này.

### R20 — Nghiệm thu hình minh họa và mỹ thuật hai gói

- **Liên quan:** F03, F11; kiểm bảo vệ F07–F12.
- **Code/dữ liệu:** selection/layout/engine, seed design, bộ ảnh mẫu đã lưu và report stills có ID.
- **Làm:** tạo bảng nhiều cảnh từ renderer thật khi triển khai: cùng một ca ở minimal/chibi, bật/tắt motion/review. Đọc kèm lời nguồn của từng hình, không chỉ nhìn ảnh có đẹp không.
- **Ca tối thiểu:** A đứng/B nằm; cạnh cửa; cạnh giường có ghế; vật trên bàn/sàn gần cửa; trao vật/đặt xuống; người thường/ma cùng danh tính; khói đúng nguồn; manh mối vật lật; hồi tưởng rồi quay hiện tại; cùng nơi nhiều lời không đổi ảnh vô nghĩa.
- **Giữ:** chibi chân liền, tư thế/sprite đã duyệt và bản đơn giản hóa mới. Các hình tham chiếu 22 video là nguồn phong cách đã có tài liệu; đợt này không tuyên bố đã xem lại đủ 22 video.
- **Đạt:** hình đúng người/nơi/quan hệ/manh mối; minh họa đứng cạnh cửa đủ cho lời mở cửa khi trạng thái mở không là đầu mối. Không yêu cầu diễn đúng từng tay/chân. Chỉ sửa tài nguyên sai đã có đối chiếu, cập nhật cả seed và hồ sơ cài đặt.
- **Phụ thuộc:** R04–R07; cần người dùng nghiệm thu mỹ thuật, fixture geometry không thay được.

### R21 — SEO/thumbnail và phần tùy chọn

- **Liên quan:** H06; bảo vệ D08, H04–H05.
- **Code:** `motionSeoService.ts`, `motionSeo.ts`, thumbnail service, sound/mix, production actions/runner và các card UI.
- **Làm:** SEO chỉ từ truyện/script cuối đã đạt; tiêu đề/mô tả/hashtag/tag/thumbnail cùng nội dung, có phương án gần cấu trúc tiêu đề nguồn khi cấu hình yêu cầu; không gắn nhầm video cũ. Timestamp từ timeline cuối.
- **Làm:** field repair không viết lại toàn pack; optional error giữ draft và công bố video chính nếu điều kiện bắt buộc đạt. Chưa xong SEO không giữ Chrome vô hạn.
- **Giữ:** không tạo thumbnail/SFX/nhạc/review nếu tắt; chức năng thủ công làm lại còn dùng.
- **Đạt:** đúng production/revision và nội dung, tiêu đề không hứa chi tiết không có; thumbnail thật phải xem riêng khi được yêu cầu, không tự sinh trong đợt audit.
- **Phụ thuộc:** R02, R10, R12, R18.

### R22 — Dọn code cùng đợt chuyển caller

- **Liên quan:** K01, K06; bảo vệ C07, K02–K05.
- **Code:** theo bảng ở mục 7, package scripts, constants/texts/types/tests liên quan.
- **Làm:** trước sửa lập caller/data compatibility; chuyển caller và adapter → kiểm đủ → xóa nhánh cũ/import/export/text/route/script không còn dùng trong cùng đợt. Không tích lũy cờ fallback giữ hai đường vô thời hạn.
- **Giữ:** quản trị/vẽ kho tự do, gen3d/spec/preview, dữ liệu cũ, ID `choiceId` và snapshot còn được đọc. Không xóa một file chỉ vì production kho đóng không gọi.
- **Chuẩn code:** không comment trong code sản phẩm; text/URL/label/tooltip/prompt/regex theo constants miền; helper/component dùng chung khi trùng trách nhiệm; Prettier width 400, CRLF TS/JS và LF Python/JSON, chỉ format phạm vi sửa.
- **Đạt:** không đường gọi vào code đã bỏ; typecheck và kiểm liên quan đạt; mọi xóa tài nguyên có reference audit/backup; không đụng Git diff ngoài phạm vi.
- **Phụ thuộc:** đi kèm từng R, không để toàn bộ cleanup đến cuối rồi xóa hàng loạt.

## 6. Bảng quyết định chia prompt cụ thể

Giới hạn khởi điểm phải đo theo prompt cuối và artifact; vùng 12.000–18.000 ký tự là điểm bắt đầu tinh chỉnh từ plan cũ, không phải context limit của model. Cần ngân sách output riêng. Không tự tăng trần khi fixed context quá lớn; transport là ngoại lệ có receipt, không phải cách xử lý mặc định.

| Prompt | Có thể chia nhỏ thế nào | Phần phải giữ chung / không gọi lại | Hành động khi một phần vẫn quá lớn |
|---|---|---|---|
| Đọc nguồn | Cụm sự kiện/câu đầy đủ có source ID, cache từng phần | Thứ tự, nhân quả, đầu mối và kết được truy xuất | Ledger phân cấp có nguồn tham chiếu; không cắt text tùy ý |
| DNA nguồn | Profile phong cách/nhịp tách khỏi sự kiện khi không phụ thuộc | Core/spine/clue/twist/ending đủ ngắn giữ cùng hợp đồng | Nguồn liên quan theo ledger, không kèm mọi chunk |
| Tạo truyện mới | Khung chung trước, chi tiết chương sau khi cần | Động cơ–nhân quả–setup/payoff/kết khóa, không sáng tác từng câu độc lập | Rút catalog/context; chia profile phụ trước khi tách spine |
| Nhu cầu minh họa | Nhóm sự kiện/cảnh thiết yếu; lỗi một need/path sửa riêng | Các người/vật/support đồng thời trong cùng hình | Lọc khả năng đúng pack; không một AI request mỗi danh từ |
| Viết chương | Chương nhỏ một lượt; lớn chia cụm sự kiện có state đầu/cuối | Lời thoại/nhân quả liên tiếp viết theo thứ tự | Chia sự kiện có ID, không đổi beat cũ theo index |
| Biên tập | Nhóm beat cần sửa hoặc một vấn đề xuyên đoạn | Nhân quả/manh mối, narrator–utterances giữ chữ | Trích lỗi và hàng lân cận, không gửi cả truyện |
| Storyboard | Cụm diễn biến, nhiều lời chung một hình | Coverage source/boundary, state và clue | Chia theo sự việc; local kiểm toàn coverage sau merge |
| READ | Một vài hình, mỗi hình đầy đủ người/vật liên quan | Không đọc lại kế hoạch đã đạt và đủ dữ liệu | Một hình lớn: bỏ context/catalog thừa trước; không tách từng người mất quan hệ |
| Sửa READ | ID/path lỗi; missing row dùng schema row | Accepted fields/rows, owner và state liên quan | Trường tài nguyên mới có catalog ứng viên; còn lại không kèm catalog |
| Chọn bố cục | **0 lượt AI** trong gói đóng | Geometry/filter/rank/selection tại máy | Giới hạn tìm kiếm có reason riêng, không hỏi AI đoán tọa độ |
| Casting | Chỉ vai chưa khóa, shortlist phù hợp | Vai đã khóa và narrator profile | Tách shortlist theo nhóm vai nhưng giữ voice identity |
| Phân thoại | Cụm hội thoại/beat còn pending | Đúng chữ/đúng người và liên kết lời dẫn | Câu dài chia theo cụm nghĩa, không bỏ dấu hoặc phụ âm cuối |
| Review ảnh | Chỉ khi bật, nhóm tối đa hiện hành bốn ảnh và context liên quan | Tắt: 0 lượt review, local validation vẫn chạy | Giảm ảnh/nhóm; không tăng mô tả toàn truyện |
| SFX/SEO | Chỉ cue hoặc trường pending, brief cuối có cấu trúc | Tắt thì không gọi; timestamp tính tại máy | Lọc catalog cue, giữ chữ/claim SEO đã đạt |
| Thumbnail | Một concept đủ nghĩa theo script cuối | Hình/tiêu đề cùng câu chuyện và pack đã chọn | Rút brief; không trộn prompt thumbnail với kế hoạch toàn video |
| JSON/field repair | Path sai và dependency tối thiểu | Không gửi original task/full draft theo mặc định | Phục hồi cú pháp có bằng chứng; phần nội dung cụt phải xin đúng phần thiếu |

**Gate:** mọi builder đo được request cuối; output IDs/schema/coverage không đổi khi chia; tổng số request/receipt/latency/repair không tăng vô lý. Không tuyên bố “nhanh hơn” chỉ vì từng message ngắn.

### 6.1. Mô hình ba room xuyên suốt

Mục tiêu là tận dụng ba room cho công việc độc lập đã đủ dữ liệu. Có giai đoạn chỉ một hoặc hai việc hợp lệ; không phát sinh yêu cầu thừa để làm đủ ba tab. Việc chia nhỏ prompt và việc chạy song song phải dùng cùng ID/dependency/checkpoint, không trở thành hai luồng triển khai riêng.

| Room | Trách nhiệm | Quy tắc dùng lại |
|---|---|---|
| A — biên tập chính | Chốt DNA, khung truyện, chương nối tiếp và SEO theo script cuối | Giữ cùng room cho DNA/kịch bản/SEO theo yêu cầu đã có; mỗi lần chỉ gửi một yêu cầu |
| B — worker hỗ trợ | Nhận nhóm nguồn, editor, storyboard, READ, phân thoại, review hoặc SFX đã đủ đầu vào | Nhận việc tiếp ngay sau khi xong; tiếp hội thoại trong room còn hợp lệ |
| C — worker hỗ trợ | Cùng nhóm công việc có thể tách độc lập như B | Không đợi B xong mới gửi; giữ room và checkpoint riêng |

Room A có thể nhận việc độc lập khi không cần chốt và provider/model/role phù hợp. AI nội dung và AI dựng có cấu hình khác nhau thì slot chỉ nhận việc phù hợp cấu hình đó; không đổi AI, phá khóa hoặc tạo thêm tab để giữ đủ ba yêu cầu đang chạy. Việc reuse qua loại tác vụ phải truyền schema/target/context rõ và kiểm kết quả đúng artifact, không dựa vào AI tự nhớ trạng thái chuẩn.

Pool của production cấp tối đa ba slot; provider gate toàn hệ thống vẫn áp dụng. Với cấu hình hiện tại, Gemini/ChatGPT tối đa ba yêu cầu, Claude một; nhiều production dùng cùng provider phải chia giới hạn. Phân biệt room giữ để dùng tiếp, yêu cầu đang chạy và tab riêng phục vụ CAPTCHA; tab xác minh không được tính là worker đang xử lý nội dung.

### 6.2. Ma trận chia việc và dependency từ đầu đến cuối

| Bước | Phần được chạy song song | Phần cần chờ/chốt |
|---|---|---|
| Đọc nguồn | Các chunk đầy đủ câu/sự kiện, giữ source ID và cache từng phần | Ghép đúng thứ tự, kiểm coverage và liên kết sự kiện trước lập khung |
| Phân tích DNA | Profile phong cách/nhịp/audience có đầu vào độc lập | Chốt core/spine/clue/twist/ending trong room chính |
| Lập truyện mới và nhu cầu minh họa | Việc phụ của khung đã khóa, các nhóm nhu cầu không phụ thuộc nhau | Động cơ, nhân quả, setup/payoff/kết và các quan hệ đồng thời phải thống nhất |
| Viết chương | Chỉ chương độc lập đã chứng minh đủ context/state; ưu tiên thể loại factual phù hợp | Truyện ma sáng tác và phần nối tiếp vẫn tuần tự khi cần nội dung phần trước; không bỏ await để chạy đồng loạt |
| Biên tập | Nhóm beat có context đầu/cuối và mục tiêu sửa rõ | Lỗi mạch truyện xuyên nhóm kiểm sau ghép; giữ các trường đã đạt |
| Storyboard | Nhóm sự việc với state snapshot và boundary rõ | Kiểm coverage/biên nhóm, không nhân đôi hình hoặc bỏ sự kiện |
| READ | Nhóm hình độc lập theo kế hoạch đã khóa | Cả người/vật/quan hệ của một hình xử lý cùng nhau; chuyển state phải kiểm sau ghép |
| Kho/layout | Code chọn/ghép/rank/geometry cục bộ | Không phát sinh prompt chọn mã/tọa độ hoặc tạo mới tài nguyên |
| Casting/phân thoại | Các nhóm thoại sau khi đã khóa voice/speaker bindings | Casting/identity thay đổi phải invalidate đúng phần; giữ nguyên chữ |
| Review ảnh | Nhóm ảnh khi bật review | Đợi hình hợp lệ; tắt review có 0 request review |
| SFX | Các nhóm cue khi có plan/timeline đầu vào phù hợp | Ghép/retime theo timeline cuối, tắt thì không gọi |
| SEO | Chạy cùng dựng hình/AI phân thoại/TTS khi script đạt | Ngôn ngữ SEO theo script cuối; timestamp tính sau tiếng thật; room chính giữ thứ tự |
| Thumbnail | Concept tùy chọn từ script/SEO đã chốt | Không tự thêm nhiệm vụ khi tắt hoặc chưa được yêu cầu |
| TTS/compile/render | TTS local tiếp tục độc lập với pool chat; renderer dùng tài nguyên riêng | Compile đợi đủ hình/giọng; đóng/nhả chat đúng owner trước render |

### 6.3. Hàng đợi và timeout

1. Mỗi mục có production/revision/artifact/item IDs, dependency hash, trạng thái accepted/pending, execution/provider/model/role và room generation. Số nhóm truyền tải không thay danh tính nội dung.
2. Scheduler lấy việc đã đủ dependency. Một room chỉ có một yêu cầu đang xử lý; nhiều room được chờ đáp án đồng thời. Room xong trước nhận việc sẵn sàng tiếp, không đợi kết quả toàn batch nếu việc kế không cần các kết quả đó.
3. Chốt kết quả vào checkpoint theo ID ngay khi đạt; kiểm biên/state/coverage sau ghép bằng code. Không merge bằng thứ tự hoàn thành của room hoặc ghi đè nguyên script từ từng worker.
4. Dùng hàng đợi công bằng: tác vụ bắt buộc để mở bước tiếp có ưu tiên, SEO/review/SFX optional không chiếm cả pool vô hạn; không làm một nhánh bị bỏ đói. Đặt giới hạn đầu vào hàng đợi để không tạo hàng loạt tác vụ/browser lease đang chờ.
5. Tách queue/lease deadline, readiness/upload deadline và response deadline. Chờ slot không bị ghi thành AI treo; sau gửi chưa xác định thì kiểm phản hồi cũ trước mọi lần gửi lại. Timeout không mặc nhiên là lỗi nội dung và không xóa số lượt sửa.
6. Lỗi nội dung sửa đúng mục trong room hiện có; các việc độc lập khác tiếp tục khi còn an toàn. Lỗi khiến đầu vào chung không còn hợp lệ, production bị hủy hoặc submission không xác định phải được giữ/chặn đúng phạm vi, không ép mọi nhánh tiếp tục để đủ ba room.
7. CAPTCHA/hạn mức/bộ nhớ/browser là ràng buộc có thể dùng chung. Chỉ cô lập theo provider/tài khoản/browser khi đã xác định được phạm vi; giữ thông báo năm tiếng/chờ người giải, không tự bypass hoặc đổi AI trái khóa.

### 6.4. Chuyển code hiện tại và bảo vệ phần đã làm

- Đo baseline R08 và chốt identity R02 trước đổi scheduling. Không sửa mỗi `AI_PARALLEL` hoặc xóa toàn bộ gate `editorial`; đưa leaf tasks độc lập sang worker context, còn room chính/gate từng room giữ thứ tự.
- Nối nguồn/editor/storyboard/READ/phân thoại/SFX/review/SEO vào cơ chế cấp slot hiện có đã mở rộng ở R12. Giữ validator, contract, accepted fields, budgets và dependency cache; không tạo orchestrator/retry service thứ hai.
- Chuyển phần AI của VOICE vào phiên worker được dùng tiếp, giữ TTS local ngoài browser lease. Không làm mất sửa trước đó về hình/giọng song song hoặc một owner TTS.
- Giữ room khi đổi tác vụ có execution phù hợp. Lỗi phù hợp reload đúng room hai lần rồi mới thay; khi đổi room/provider hợp lệ phải hydrate context/receipt đúng generation, giữ nháp và tổng budget.
- Dọn nhánh pool/phiên ngắn không còn caller sau khi chuyển; giữ nhánh manual/spec/admin và fallback độc lập còn hợp lệ. Khi handoff chỉ release room thuộc owner đủ điều kiện; không đóng phiên production khác.

### 6.5. Tiêu chí nghiệm thu song song

- Fixture cấp ba tác vụ độc lập có thời gian chờ khác nhau: ba yêu cầu chồng thời gian thực; room nhanh nhận tác vụ thứ tư trước khi room chậm xong. Tổng active không vượt ba hoặc provider cap thấp hơn.
- Fixture dependency A → B và state xuyên chương: B chỉ chạy sau A đạt; source/event/clue/ending không đổi so với bản tuần tự; kết quả đảo thứ tự vẫn merge đúng ID.
- Dựng cảnh, phân thoại và SEO đồng thời không tạo pool phụ vượt trần. Voice chỉ gọi AI khi cần, reuse room qua nhiều nhóm, TTS không giữ browser lease.
- Room lỗi nội dung chỉ sửa pending fields, không reset room khác; reload hai lần/replacement giữ budget, checkpoint và provider lock. Stop/reload/restart không phát sinh gửi trùng hoặc tự tiếp tục production đã dừng.
- Chờ slot lâu không tiêu response timeout; readiness chậm khác generation chậm. Submission đã gửi nhưng chưa xác định vẫn chặn resend đúng yêu cầu.
- CAPTCHA cùng tài khoản giữ các việc chịu ảnh hưởng; provider độc lập chỉ tiếp tục khi chứng minh an toàn. Handoff đa production không đóng nhầm room.
- Đo tổng thời gian, số request/receipt/repair, peak room/memory và tỷ lệ đúng cùng input/config; ghi cả thời gian hàng đợi. Không cam kết nhanh gấp ba, không chứng nhận song song chỉ bằng số tab đang mở. Thử dịch vụ thật chỉ theo phạm vi người dùng yêu cầu, không tự chạy video 20 phút.

## 7. Bảng giữ, thay và xóa

| Vị trí | Quyết định dự kiến | Điều kiện được xóa/thay | Bảo vệ |
|---|---|---|---|
| `motionPromptPayloadBudget` và nhánh single-item overflow | Thay thuật toán trong helper hiện có | Mọi caller chuyển sang budget cuối/overflow rõ | B02, R08; test fixed context lớn và một item lớn |
| Full context/catalog lặp trong builders | Thay bằng DTO/retrieval/receipt đúng phiên bản | Chứng minh dữ kiện/thuộc tính phân biệt còn đủ | R09–R10, B03/B08/B09 |
| `fullRequest` đa trách nhiệm trong analysis/creative story | Tách phần có thể độc lập khi vượt budget | Draft/ledger ID và story contract giữ được | R02/R09; không thêm story service V2 |
| Bắt lỗi thiếu SET bằng prefix text | Thay typed reason chung | Tất cả nơi catch, UI và validator chuyển đủ | R06; text chỉ để hiển thị |
| Vòng rejected/merge/save/attempt riêng trùng contract | Chuyển dần về contract rồi bỏ vòng cũ | Cùng semantics/null/array identity/legacy budget | R11, C01–C06; giữ validator riêng |
| ID chỉ theo index và checkpoint chỉ theo batch | Thay bằng item/dependency bền, adapter xác minh | Map rõ item cũ; trường hợp không map phải giữ file và báo | R02; không wipe draft |
| Dò cầm vật cũ không xét chuyển state | Giữ như kiểm hỗ trợ, thay nguồn quyết định bằng ledger state | Chuyển sở hữu/đặt xuống và timeline đã có test | R07; không mở rộng regex vô hạn |
| `release` mọi editorial session khi render | Thay bằng owner/resource scope | Scheduler/browser vật lý đã kiểm đa owner và cancel | R12; không bỏ browser safety gate |
| Ép một luồng editorial ở mọi leaf task và pool riêng theo nhánh | Chuyển leaf tasks độc lập sang pool ba room theo mục 6, giữ gate room chính | Identity/dependency, provider cap, pending/repair và nhiều production đã qua fixture | R02/R10/R12; không xóa tuần tự cùng room hoặc chương nối tiếp |
| Phiên AI ngắn tự tạo ở mỗi prompt VOICE | Chuyển casting/phân thoại sang room worker dùng tiếp | TTS local không giữ lease, một owner voice và cache/budget còn đúng | R12/R14; giữ standalone fallback còn caller |
| Watchdog bao cả provider queue và `captchaHold` chung | Tách deadline và phạm vi hold có kiểm | Không gửi trùng, timeout có reason, account challenge và cancel được kiểm | R08/R12/R19; không bỏ guard CAPTCHA hoặc pending submission |
| Migration chỉ rải semantic cho set/base | Hợp nhất quy tắc theo schema kho | Dry-run/apply/seed/import idempotent, giữ ID | R04–R05 |
| Đồ vật vẽ liền trong cảnh cũ và layer/recipe chỉ nằm ở output migration | Chuyển sang nền/mảnh/recipe được runtime và UI sử dụng | Đối chiếu từng hình, recipe có điểm đặt đã kiểm, adapter/reference/snapshot cũ còn đúng | R04–R07/R20; mục 11.1, không xóa nền/cảnh hàng loạt |
| Lọc mọi mảnh theo `interior/exterior` và preflight không truyền capacity | Thay bằng khả dụng theo loại mảnh, truyền yêu cầu điểm đặt có số lượng | Seed/import/migration/runtime cùng hợp đồng, vật di chuyển được khác kiến trúc, kiểm cả ca hợp lệ và bị cấm | R04/R06; mục 11.2, không bỏ geometry guard |
| AI chọn `choiceId`, dịch toàn kho, READ đạt bị gọi lại | Giữ việc đã bỏ; dọn phần sót nếu chứng minh chết | Kiểm cả nhánh ngoài gói/route/script/dynamic caller | Không phục hồi bước thừa để xử lý lỗi mới |
| `assetProfiles`, vẽ SVG/sprite/set và quản trị | Giữ caller ngoài production đóng | Chỉ xóa export riêng nếu không còn caller hoặc dữ liệu | Kho đóng vẫn có guard chống ghi/sinh mới |
| `choiceId`, provenance AI lịch sử, snapshot cũ | Giữ | Không được xóa vì nhánh mới deterministic | Compile/selection legacy adapter |
| Auto voice/manual build/standalone gen3d ở UI/API | Giữ đường hợp lệ; bỏ trùng orchestration có chứng cứ | Caller map R01, mode matrix R18 | Không mất sửa thủ công, upload/override |
| Metadata/ảnh trùng hoặc file bị báo mở lỗi | Audit định dạng/hash/references trước | Sheet/backup/map và người dùng không mất output | R05/R22, K06; không xóa theo tên hoặc kích thước |
| Constants/helper/component | Gộp cùng trách nhiệm; xóa import/text hết caller | Không truy cập động/export ngoài tiến trình | K04–K05; không tạo common khổng lồ |

## 8. Thứ tự triển khai và phạm vi kiểm

| Đợt | Công việc | Gate trước chuyển đợt |
|---|---|---|
| 0 | R01 + measurement R08; khóa baseline/callers và hợp đồng slot/dependency ba room | Phạm vi rõ, giữ các test/bản sửa ngày 26/10; không đổi sản phẩm chỉ để dọn |
| 1 | R02; typed reasons R06; schema R04 và coverage R03 | ID/legacy/accepted/budget không mất; missing/unknown phân biệt đúng |
| 2 | R05–R07: sửa metadata, chuyển kho nền/mảnh/recipe, retrieval, phục hồi, state theo mục 11 | Hai gói qua ca đứng–nằm/vật/anchor/transfer, không vẽ lặp món cũ, ca bến sông và phân biệt nội/ngoại thất; không tạo mới kho trong production |
| 3 | R08–R11: prompt đầu và các nhóm còn dài, thống nhất repair | Đo prompt cuối, partition/resume giữ identity/coverage; tổng request có lý do |
| 4 | R12–R14, R17–R18: pool ba room/lease, AI phân thoại, persistence, voice cache, UI | Gate mục 6.5; đa owner/cancel/crash có fixture; không đóng nhầm room, không chạy lại sau Stop |
| 5 | R15–R16, R19–R21: nghiệm thu giọng/hình/provider/tùy chọn | Bằng chứng nghe/xem và dịch vụ thật đúng phạm vi yêu cầu mới |
| Mỗi đợt | R22: chuyển caller và dọn code cũ cùng thay đổi | Typecheck + test rủi ro cụ thể đạt; không reset diff |

Kiểm khi triển khai ưu tiên dùng fixture AI/TTS giả, browser localhost, ảnh tĩnh thật và media tổng hợp ngắn tại thư mục scratch riêng. Không chạy hàng loạt script có thể gọi mạng/ghi kho nếu chưa đọc chế độ chạy. Lượt nghiệm thu video thật phải theo yêu cầu mới; **không tự chạy hoặc tiếp tục video 20 phút**. Khi được yêu cầu test 2 phút thì chỉ chạy phạm vi đó.

### Ma trận hồi quy cần có

| Rủi ro | Bài kiểm hiện có để mở rộng / ca còn cần |
|---|---|
| Đơn giản hóa quá mức | simple illustration, posture continuity: ngồi phụ được đổi đứng, nằm/essential không đổi, support thành anchor |
| Chọn kho sai | plan readiness, asset catalog, pack selection, assembly capacity: unknown coverage, alias/thuộc tính, giới hạn tìm kiếm khác thiếu thật |
| Kho ghép chưa hoàn chỉnh | Nền sạch đồ có thể thay đổi, recipe được runtime đọc và UI hiện đúng base/piece, migration idempotent, không vẽ hai lần món có sẵn; snapshot/ảnh cũ vẫn đọc được |
| Thiếu bối cảnh giả | Fixture bến sông + bàn di chuyển được + hai điểm mặt bàn; đối chứng kiến trúc interior không được ra ngoài; truyền capacity đủ, ràng buộc phụ không thành bắt buộc, local failure không gọi AI repair lặp |
| Sai vị trí | spatial placement, visual contract, closed pipeline: cạnh cửa/giường, held/table/floor, transfer/flashback và đạo cụ chính/phụ |
| Hỏng repair | field repair, read contract, prompt resume, AI recovery: một field sai, ID lạ/trùng, sửa lấn, JSON cụt, null/omission, budget qua resume |
| Phân đoạn | source ledger/story craft/storyboard: event/clue/kết không mất, một hình nhiều lời, regroup không đổi ID |
| Room/AI | browser reuse, room lifecycle, AI recovery, scene routing và mục 6.5: ba worker chồng chờ, room nhanh nhận việc tiếp, shared pool scene/voice/SEO, provider cap, dependency, timeout từng pha, CAPTCHA có phạm vi, đa owner và reload đúng room hai lần |
| Lưu/dừng | production runner/lock, atomic writes, persistence integrity, cancellation: EPERM/crash/owner cũ/log cursor/reload terminal |
| Giọng | voice quality/clarity/pacing/continuity: đổi một câu, corrupt PCM, đầu/cuối chữ, REVIEW/UNAVAILABLE, raw-filter-mix và tốc độ cục bộ |
| Timeline/effect | storyboard timing, effect routing, camera comfort/render controls: biên clip, speechRanges khi tắt sub, narrator không mouth, khói đúng nguồn |
| Xuất | media validation/publication: chunk hỏng, GPU/CPU, thiếu audio, đen/im lặng có chủ ý, crash sau rename/cancel |
| UI | editorial UI/job polling/settings: hai nút sát, review thật, badge gọn, settings hai item/hàng, reload chỉ theo dõi, mode 3D báo sớm |

Không mở rộng test vô hạn: chỉ bổ sung để tái hiện lỗ hở hoặc bảo vệ hợp đồng thay đổi. Qua gate của đợt thì chuyển việc tiếp theo. Test giả lập không đánh dấu nghiệm thu mỹ thuật/giọng/provider thật.

## 9. Đối chiếu đủ 82 mã cũ

### 9.1. Hai mươi sáu mã còn một phần

| Mã cũ | Việc còn lại trong bản mới |
|---|---|
| A01 | R01/R22: caller cả production, manual, admin, dynamic và dữ liệu cũ |
| A02 | R02/R13: revision/state phản hồi cũ và đa owner |
| A06 | R02/R04/R14: adapters và dependency cache tối thiểu |
| B01 | R08/R18: đo prompt và thời gian từng pha, UI trạng thái đúng |
| B02 | R08: budget cuối không tự phình, item đơn overflow |
| B04 | R09/R10: context chuẩn/ledger gọn, source core vẫn đủ |
| B05 | R04/R06/R10: retrieval đủ nghĩa và mở rộng trong pack |
| B07 | R02/R10: item checkpoint độc lập partition |
| B10 | R08/R10: đo tổng request/tin/latency/độ đúng trước–sau |
| C04 | R07: quan hệ owner/mount/anchor và lan truyền đến hội tụ |
| C07 | R11/R22: chuyển vòng riêng về contract rồi dọn |
| D09 | R12: ownership browser/chat/render nhiều production |
| E01 | R09: sự kiện/đầu mối/kết không mất qua ledger phân cấp |
| E02 | R09: tách profile phụ khỏi core và creative initial prompt |
| E03 | R03/R06: coverage nhu cầu và khả năng minh họa trước khóa |
| F01 | R04/R05: schema chung seed/import/migration/runtime |
| F02 | R05/R22: audit trùng có hình và reference map |
| F04 | R03/R06: binding/coverage đủ, không chỉ các need AI nhớ khai |
| F05 | R04/R06: thuộc tính/alias có kiểu, không chọn gần tên sai nghĩa |
| F06 | R06: phục hồi mọi reason, giản lược phụ và xử lý thiếu cốt lõi |
| F10 | R02/R07: state dependency và invalidation đến hội tụ |
| G08 | R14/R15: cache/profile và nghiệm thu tốc độ cục bộ/thời lượng |
| I02 | R12/R17: handoff đúng owner, cửa sổ lỗi trước render |
| J03 | R08/R18: progress/budget/receipt/wait reason từ backend |
| K01 | R01/R22: keep/replace/remove có caller và test |
| K06 | R05/R22: dữ liệu/tài nguyên/cache có owner và bằng chứng trước xóa |

### 9.2. Mười một mã cần nghiệm thu

| Mã cũ | Cách nghiệm thu |
|---|---|
| D04 | R19: model picker sau readiness thật, UI thu gọn/load chậm |
| D06 | R19: năm tiếng CAPTCHA trên máy, nhiều tab, giữ request |
| F03 | R20: xem ảnh hai gói, chân chibi/tư thế/ghost theo mẫu đã duyệt |
| F11 | R16/R20: nhịp hình với lời, miệng và nguồn hiệu ứng |
| G03 | R15: giọng narrator và từng vai theo Thần trùng |
| G04 | R15: rõ phụ âm, nhịp nghỉ và đoạn nói nhanh sau filter/mix |
| H02 | R16: sub không nền/flash, cue khớp tiếng |
| H03 | R16: zoom/pan/transition dễ chịu, không giật biên |
| H06 | R21: thumbnail và tiêu đề đúng câu chuyện, ảnh thật |
| I03 | R17: renderer/cache/encoder và video production trong phạm vi được yêu cầu |
| J04 | R18: settings thật trên UI và snapshot backend |

### 9.3. Bốn mươi lăm mã đã có code/kiểm cục bộ được bảo vệ

| Nhóm | Mã giữ và kiểm hồi quy khi đụng miền đó |
|---|---|
| A | A03, A04, A05 |
| B | B03, B06, B08, B09 |
| C | C01, C02, C03, C05, C06 |
| D | D01, D02, D03, D05, D07, D08 |
| E | E04, E05, E06, E07 |
| F | F07, F08, F09, F12 |
| G | G01, G02, G05, G06, G07 |
| H | H01, H04, H05 |
| I | I01, I04, I05, I06 |
| J | J01, J02, J05 |
| K | K02, K03, K04, K05 |

Không làm lại 45 mã này như thể chưa có. Nếu thay hợp đồng chung làm ảnh hưởng chúng thì kiểm đúng miền; nếu phát hiện fixture mới hỏng, ghi rõ bằng chứng và mở lại phạm vi tương ứng.

## 10. Điều kiện đóng từng đợt và đóng plan

Một đầu việc chỉ hoàn thành khi có: root cause tái hiện hoặc căn cứ code rõ → thay đúng module/caller → giữ phần đạt/legacy/budget → kiểm hồi quy có ý nghĩa → dọn code cũ đã thay → báo bằng chứng và giới hạn.

Toàn plan chỉ đóng khi 82 mã đều có trạng thái/bằng chứng cập nhật, các mã nghiệm thu có nghe/xem/dịch vụ thật theo phạm vi cho phép, và không còn lỗi dừng vì ràng buộc phụ hoặc chọn sai khi kho có khả năng phù hợp. Thiếu cốt lõi thật hoặc lỗi ngoài hệ thống phải được diễn đạt trung thực, bảo toàn tiến độ và có đường xử lý rõ; không đổi tiêu chuẩn đúng để ép xuất một MP4.

Ưu tiên làm trước: **coverage + typed recovery + semantic schema/tra cứu**, tiếp đến **identity/state**, rồi **prompt tạo đầu và budget**, **browser ownership/persistence**, cuối cùng **nghiệm thu giọng/hình/UI/render**. Các phần sửa vừa xong ngày 26/10 là nền bắt buộc, không phải code sẽ bị thay bỏ hàng loạt.

## 11. Bổ sung kho bối cảnh ghép và ca lỗi bến sông — 26/10/2026

Đợt triển khai bổ sung cho R03/R04/R06/R07/R11/R18: xem [plan chọn và ghép bối cảnh theo ràng buộc chung](motion-stage-constraints-root-plan-2026-10-26.md). Các mã S01–S07 sửa bộ kiểm và luồng phục hồi dùng chung, có fixture thật cùng đối chứng cho cả hai gói; không đóng các mã nghiệm thu giọng/video cuối chưa kiểm.

Hai phần dưới là yêu cầu triển khai tiếp vào các mã R hiện có, không tạo pipeline hoặc bộ retry mới. Những quan sát và phép kiểm được ghi là bằng chứng hiện tại; các tiêu chí còn lại chưa được triển khai/nghiệm thu.

### 11.1. Bối cảnh chỉ giữ nền, ghép đồ vật/người theo mẫu cố định

**Hiện trạng đã kiểm:**

- Một số ảnh kho là cảnh hoàn chỉnh có đồ vật vẽ liền. Nguồn `python_scripts/kit_seed/scenes.py` còn vẽ bàn thờ/ghế/bàn trong `main_room`, chum/bao trong cảnh kho. Có nhiều điểm đặt hoặc composition không chứng minh những đồ vật này đã tách thành tài nguyên riêng.
- Đã có base/piece nhưng runtime còn tìm cảnh hoàn chỉnh trước rồi mới thử ghép. `migrate_illustration_library.py` xuất layer/scene-recipes, nhưng luồng runtime đã kiểm chưa đọc những tệp đó; tách layer chưa đồng nghĩa đã chuyển kho sang ghép đồ vật.
- Danh sách loại hiển thị qua `PUPPET_KIT_API.TYPES_SHOWN` chưa gồm `set_base`/`set_piece`. Ảnh người dùng thấy chưa phản ánh đầy đủ thành phần có thể ghép và cũng chưa chứng minh toàn bộ kho cũ đã được chuyển.

**Hợp đồng đích và việc cần làm:**

| Phần | Yêu cầu | Nối vào |
|---|---|---|
| Nền | Giữ không gian và geometry cố định có nghĩa: nền đất/sàn, trời/nước, tường hoặc kiến trúc đặc trưng. Không vẽ liền bàn/ghế/chum và đồ có thể thay đổi theo truyện | R04/R05 |
| Mảnh | Tách tới đơn vị có thể tái sử dụng và đặt đúng: cửa, cửa sổ, bậc, giường, bàn, ghế, bàn thờ, chum… theo công dụng; không tách từng nét SVG hoặc chi tiết trang trí vô ích | R04/R05/R20 |
| Điểm đặt | Mỗi mảnh giữ tọa độ cục bộ, bounds, tỉ lệ, mặt tựa, điểm chân, anchor, layer và vùng tránh. Ghép/lật/đổi tỉ lệ phải biến đổi đồng bộ hình và điểm đặt | R04/R06/R07 |
| Recipe cố định | Tham chiếu ID nền và mảnh, transform, vị trí người/vật, quan hệ và vùng tránh đã kiểm. Lập nhiều mẫu theo gia đình cảnh: bến sông, sân, hiên, phòng, giường, cửa… cho cả hai gói; không hứa hữu hạn mẫu đáp ứng mọi truyện | R05/R06/R20 |
| Chọn khi tạo video | AI khai nhu cầu và dữ kiện thiết yếu từ danh mục hợp lệ; code chọn recipe/thành phần và bind người/vật. Không để AI tự bịa asset, tọa độ hoặc vẽ thêm; không thêm lượt AI chọn lại thứ code đã xác định | R03/R06/R10 |
| Kho cũ | Inventory từng cảnh: phần nền, món vẽ liền, món đã có riêng, spot và tham chiếu. Chỉ tái sử dụng phần tách thật sự độc lập; cảnh không tách an toàn giữ legacy hoặc sửa ngoài production theo kế hoạch được duyệt | R05/R22 |
| Tương thích | Giữ ID/tham chiếu cũ qua adapter/map có phiên bản; recipe và snapshot khóa nguồn. Không chỉnh snapshot lịch sử, không xóa cảnh cũ trước khi chuyển đủ caller và kiểm hình | R02/R05/R22 |
| Quản trị kho | Hiện nền, mảnh, recipe và cảnh ghép với preview/điểm đặt/nguồn rõ; không đếm cảnh ghép và mảnh thành nhiều tài nguyên gốc khác nhau. Dùng sheet nén để duyệt và phát hiện món bị vẽ lặp | R05/R18/R20 |

**Điều kiện nghiệm thu:** cùng một nền ghép được các mẫu khác nhau mà người/vật vẫn đúng vị trí và đúng gói; cảnh cũ sau chuyển không mất món cần thiết hoặc hiện hai lần một món; scene-recipes thực sự được đường tạo video sử dụng. Kiểm ảnh thật đại diện cho cả hai gói và đọc lại dự án cũ. Động tác phụ vẫn có thể giản lược thành đứng/ngồi tĩnh; không biến yêu cầu này thành mô phỏng hành động chi tiết.

### 11.2. Lỗi “Chưa có phương án ghép hợp lệ từ kho cho: Bến sông trước nhà”

**Bằng chứng đã kiểm:**

- Production `storage/output/motion-video/productions/1e57c6e1419281c1ec58f769ba72fd3c.json`, truyện **Thuyền Giấy Ngược Dòng Đêm Rằm**, gói `minimal_mask`; lỗi ở kiểm khả năng minh họa trong bước **Phân tích nội dung**, chưa đến script/voice/render. Log lấy nhân vật là tiến độ chọn kho, không phải lỗi thiếu các nhân vật được liệt kê.
- Place `river_dock`, tên “Bến sông trước nhà”, `interior: false`. Mô tả AI thêm bàn gỗ cạnh nước; need `need_c1_river_offering` gán `tray_c1` và `rice_c1` lên `table`. `puppetSetPlacementNeeds` tính `surface/table/count: 2`; câu evidence của need nói bày mâm ngoài bến, chưa nêu rõ bàn.
- Có 36 biến thể set thuộc nhóm sông/bến được phép trong gói ở lần kiểm, không phải 36 thiết kế riêng; không set nào qua nhu cầu hai điểm bàn này. Các mảnh có đủ điểm bàn được tìm thấy lại mang `environment: interior`, bị điều kiện lọc exterior loại. Không suy từ số lượng file rằng mọi tổ hợp đều đáp ứng.
- Phép ghép thuần trong bộ nhớ dùng base `riverside` (`bas-054eef4576422017`) và piece `fixed_component_table` (`pcs-8343a505136335d8`): đặt tại `mid_left`, `mid_center` hoặc `mid_right` đều có `puppetSetMissingRequirements` rỗng cho hai need bến sông. Đây là kiểm bố cục cục bộ, **chưa chứng minh render đẹp, không chồng lấn hình hoặc toàn video đúng**; không có tài nguyên mới được ghi.
- `setComposer.ts` kiểm `piece.environment` ở cả đọc plan và tìm ứng viên; `planReadiness.ts` truyền `must` nhưng chưa truyền `placements: puppetSetPlacementNeeds(reads)` trong khi bộ ghép có nhánh dùng `need.placements`. Việc thiếu capacity là lỗ hở tìm kiếm cần sửa, chưa được chứng minh là nguyên nhân độc lập gây ca này.
- Recovery đã thử hai lần; phương án AI không đạt hợp đồng key/option/family nên không được nhận. Chưa xác định từ thông báo chung trường cụ thể nào sai. Retry không sửa được điều kiện lọc mảnh/geometry của code; không quy lỗi này cho model hoặc mạng.

**Việc triển khai theo thứ tự:**

1. **R03/R04 — ràng buộc có nguồn:** lưu rõ support/mount bắt buộc theo lời kể hoặc manh mối, lựa chọn minh họa phụ và phần chưa rõ. Bàn AI tự thêm không tự thành dữ kiện cốt lõi; không tự chuyển mâm/bát xuống đất nếu trái nội dung đã khóa. Kiểm `catalogKey` và nghĩa của vật cùng bằng chứng, không chỉ trùng chữ.
2. **R04/R05 — môi trường đúng loại:** khai khả dụng của bàn/ghế/đồ di chuyển được riêng với môi trường nền. Chỉ sửa metadata sau kiểm hình và công dụng; giữ ràng buộc cho tường/kiến trúc/phần chỉ hợp trong nhà. Đồng bộ seed/import/migration/runtime, không chỉ sửa nhãn một mảnh cho video này.
3. **R06 — tìm và ghép đủ khả năng:** truyền support/kind/count cùng scene features vào bộ tìm recipe/assembly; thống nhất điều kiện ở các đường đọc plan, preflight và pipeline. Rank theo capacity sau lọc hợp lệ, mở rộng tìm trong gói có giới hạn, không yêu cầu AI chọn tọa độ.
4. **R07 — vật trên vật:** hỗ trợ instance/anchor cho bát trên mâm, mâm trên bàn khi phù hợp bằng chứng; phân biệt mặt tựa của bàn với vùng chứa trên mâm, kiểm kích thước/chồng lấn. Không tự coi mọi mâm đã chứa bát, không bỏ kiểm bằng cách cho mọi vật chung một spot.
5. **R06/R11 — phục hồi đúng lỗi:** diagnostic trả stage/place/need/object IDs, support thiếu, ứng viên bị loại và lý do. Lỗi metadata/filter/capacity xử lý cục bộ; AI chỉ sửa phần diễn giải chưa rõ hoặc ràng buộc phụ có quyền đổi. Không lặp cùng prompt để chữa một bất cập của code; giữ phần đạt và tổng budget.
6. **R18 — thông báo đúng:** tách “không tìm được tổ hợp trong giới hạn”, “mảnh bị lọc”, “thiếu điểm đặt”, “metadata chưa đủ” và “thiếu cốt lõi đã xác minh”. Không báo chung kho thiếu bến sông khi nền/mảnh đã có; vẫn giữ kho đóng và tiến độ.

**Fixture và nghiệm thu bắt buộc khi triển khai:**

- Bến sông ngoài trời + bàn di chuyển được + mâm/bát: tìm được recipe/assembly có đủ điểm hợp lệ mà không gọi AI vẽ mới. Kiểm cả hai gói theo tài nguyên thực có, không mặc định ID dùng chung.
- Đối chứng mảnh kiến trúc chỉ dành trong nhà vẫn bị loại ngoài trời; bàn dùng được không kéo theo mọi đồ nội thất đều được chấp nhận.
- Hai vật độc lập cần hai chỗ; quan hệ bát trên mâm dùng anchor riêng hợp lệ; vật quá lớn/đè nhau hoặc sai mặt tựa vẫn bị chặn đúng reason.
- Nguồn không đòi bàn không bị dừng chỉ vì mô tả AI thêm bàn; nguồn bắt buộc bàn/quan hệ cốt lõi thì không bị tự đổi thành đặt đất.
- Preflight và pipeline cùng đầu vào có kết luận tương đương; sửa đúng vùng pending, giữ cast/need đã đạt, không reset truyện hoặc voice/cache không liên quan.
- Kiểm render ảnh đại diện và sheet bố cục để xác nhận tỉ lệ, vị trí bờ/nước, người/đồ, mặt tựa và không trùng món vẽ liền. Phép kiểm thuần đã làm không thay nghiệm thu ảnh; không tự chạy hoặc tiếp tục video để thực hiện bản cập nhật plan này.

### Đối ứng tiếp sau kiểm kho 22 mẫu

Ngày 26/10 đã triển khai phần nhận diện món thực, capacity/điểm đặt/tỷ lệ/biên khung, metadata các mảnh và bổ sung món thiếu theo [phạm vi C01–C06](motion-reference-coverage-fix-2026-10-26.md). Kho mới `modular-v3-reference-20261026` đã nạp cho cả hai gói; 88 tình huống tổng hợp và 11 bảng ảnh đã kiểm, không tạo video. Chi tiết và khả năng chưa nghiệm thu nằm trong [báo cáo kết quả](video-references/resource-coverage-fix-20261026/index.html); không dùng kết quả này để đánh dấu toàn bộ plan sản xuất hoặc toàn bộ 22 nguồn là hoàn tất.

### Đối ứng ngoại hình ma, màu nền và góc hình

Sau audit **Người Đứng Ngoài Sân**, đã sửa hợp đồng READ về ngoại hình có bằng chứng, biến thể màu theo bộ phận và trạng thái theo nhân vật/dòng thời gian, hình ma giả người/lộ hình, màu nền trầm và lấy khung toàn–trung–cận của hai gói. Chi tiết tại [báo cáo triển khai](motion-horror-appearance-fix-2026-10-26.md), liên quan R07/R20 và F03/F11. Đã kiểm 12 ca mô tả, hai READ mô phỏng AI và 36 ảnh engine; không tạo MP4 mới. Nghiệm thu cảm giác sợ, độ giống mẫu và các lỗi nội dung/bố cục khác trong audit vẫn còn mở; không đóng toàn plan.
