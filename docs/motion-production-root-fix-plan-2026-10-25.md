# Kế hoạch chuẩn hóa Video Motion và chia nhỏ prompt — 25/10/2026

Bản rà code và kế hoạch tiếp nối ngày 26/10/2026: [kế hoạch chi tiết mới](motion-production-root-fix-plan-2026-10-26.md). Bản mới giữ đủ 82 mã bên dưới, phân biệt phần đã có, phần còn thiếu và nghiệm thu; bảo vệ các sửa đổi minh họa/field repair/UI vừa làm ngày 26/10. Đây là cập nhật tài liệu, chưa triển khai các đầu việc mới.

Hai bổ sung về **tách kho bối cảnh thành nền/mảnh/recipe cố định** và **sửa nguyên nhân lỗi ghép “Bến sông trước nhà”** nằm tại mục 11 của [plan ngày 26/10](motion-production-root-fix-plan-2026-10-26.md), đã nối vào R03–R07 và các mục phục hồi/UI/nghiệm thu/dọn code liên quan. Chưa sửa code, kho hoặc chạy lại video trong lượt cập nhật này.

## 1. Phạm vi, trạng thái và yêu cầu giữ nguyên

Bản này hợp nhất các mục sửa gốc, rút bước, dọn code và [audit prompt](motion-prompt-audit-2026-10-25.md). Đã triển khai nhiều mục theo lệnh tiếp theo của người dùng. Trạng thái và bằng chứng của đủ 82 mã A01–K06 nằm tại [báo cáo triển khai](motion-production-root-fix-implementation-2026-10-25.md#trạng-thái-từng-mã-trong-plan); các tiêu chí bên dưới tiếp tục là yêu cầu nghiệm thu, không mặc nhiên là phần chưa có code.

Đợt đối ứng tiếp theo có sửa code và kiểm cục bộ: AI/TTS giả lập, fixture trình duyệt chỉ kết nối localhost, ảnh tĩnh và tệp media tổng hợp vài giây. Không khởi động backend sản xuất, gọi AI/TTS thật hoặc tạo/resume video 20 phút. Các ghi chép lượt 20 phút trong báo cáo là lịch sử trước lệnh cấm chạy thử này.

Yêu cầu sản phẩm tiếp tục giữ:

- Một lần bấm Tạo video có một production, nguồn và cấu hình được khóa; giữ phần đạt, sửa đúng phần sai, tiếp tục được sau gián đoạn, dừng rồi reload không tự chạy lại.
- Hai gói **Tối giản mặt nạ** và **Chibi màu dân gian** chỉ dùng tài nguyên đã có trong gói. Hình minh họa tĩnh đúng người, nơi, đồ vật và quan hệ vị trí thiết yếu; động tác khó không thiết yếu được giản lược. Không tạo tài nguyên mới trong production hoặc đổi manh mối để lấp thiếu kho.
- Giữ mỹ thuật theo mẫu đã chốt, gồm dáng chibi và chân sát người; hồn ma liên kết đúng danh tính, khói/mùi phát đúng nguồn. Người kể không làm nhân vật cử động miệng; chỉ người có thoại mới nói khi bật chuyển động.
- Ngôn từ tự nhiên với người Việt, cốt truyện rõ nhân quả, giữ tinh túy kể chuyện của nguồn khi sáng tác mới. Đối chiếu giọng **Thần trùng** cho người kể và các nhân vật: rõ chữ, nhịp hợp lý, không nói nhanh cục bộ hoặc kéo chậm quá mức.
- Bỏ giật khung; zoom/pan rất chậm, chuyển cảnh nhẹ, sub không nền và không nhấp nháy. Review ảnh là tùy chọn; tắt review vẫn kiểm dữ liệu và hình học.
- SEO, thumbnail, SFX và nhạc có trạng thái riêng; lỗi tùy chọn không làm mất video chính. Không công bố MP4 thiếu lời hoặc sai phiên bản là thành công.
- Không hứa dịch vụ ngoài luôn thành công. CAPTCHA, hết hạn mức, lỗi máy/dịch vụ phải chờ hoặc dừng có lý do, có dữ liệu để tiếp tục; không retry vô hạn hoặc âm thầm hạ điều kiện đúng.

**Nguyên tắc chia nhỏ:** chia đến đơn vị ngữ nghĩa nhỏ nhất còn xử lý đúng được. Số phần việc trong plan, số mục kiểm và số lần gọi AI là ba thứ khác nhau. Không biến mỗi trường dữ liệu thành một lượt AI, không thêm một bộ điều phối/retry mới cạnh bộ đang có.

## 2. Đối chiếu ban đầu và cập nhật sau triển khai

“Có trong code” chưa đồng nghĩa đã nghiệm thu đầu ra. Bảng này ghi các điểm audit ban đầu; bảng 82 mã trong báo cáo là trạng thái mới hơn.

| Khu vực | Hiện có trong code | Phần còn phải hoàn thiện/kiểm |
|---|---|---|
| Điều phối | motionProductionService, actions dùng chung UI/API, production store và khóa owner; đầu vào sao chép sâu | Chuẩn hóa trạng thái chờ/gián đoạn và revision ở đường sửa riêng; kiểm xuyên bước/đa dự án |
| Lưu/hủy | Checkpoint, token/PID, ghi nguyên tử có retry lỗi khóa file; hủy chặn ghi tiếp | Nhất quán lỗi ghi job con/production, dữ liệu hỏng, phục hồi và cửa sổ crash; không thêm Map làm nguồn sự thật |
| Contract | motionAiContractService, MotionRepairLedger, merge theo trường; DNA/chương/storyboard/READ/SEO có draft/repair | Schema/ngân sách chưa đồng nhất hoàn toàn; kiểm sửa lấn, ID trùng/lạ, cấu trúc và quan hệ sau merge |
| Prompt dài | Trên 24.000 ký tự cắt thành phần 18.000, hỏi receipt rồi thực thi cả yêu cầu | Đây là chia tin vận chuyển; còn context/kho lặp và repair kèm original task |
| Room | Phiên biên tập cho DNA/kịch bản/SEO; worker cảnh riêng, provider gate; sửa nội dung không reset room | Kiểm vòng đời qua handoff/render/restart và tổng retry; session ID không tự chứng minh cùng room vật lý |
| Kiểm kho sớm | checkPuppetPlanReadiness chọn thử nhân vật/địa điểm trước viết dài; lưu record.illustration | Chưa đủ vật/manh mối và tổ hợp vị trí thiết yếu; binding sớm chưa truyền thành đầu vào khóa cho dựng |
| Kho đóng | Bỏ dịch hồ sơ bắt buộc, AI ghép cast/set và AI chọn choiceId; code lọc/rank/ghép | Metadata và suy diễn nghĩa vẫn có giới hạn; prop còn lấy ứng viên đầu thỏa puppetPropFits; phải chứng minh fit đủ nghĩa |
| Bố cục | composePuppetPackLines chọn phương án hợp lệ tại máy, có selection/hash/binding | Preflight/compose còn tìm lại choices; hình học đúng không tự chứng minh READ hiểu đúng lời |
| Storyboard/READ | Read hợp lệ bỏ qua READ thừa; giữ draft, lọc frames/reads theo khóa còn dùng; có repair gọn | Nhóm theo số dòng/từ, context nhiều lớp; một missing row có thể kéo nhóm sang prompt đầy đủ; thay batch phải giữ resume |
| Giọng | Hình/TTS song song trong production; TTS không bắt buộc chờ hình; cache/ASR/pacing/filter | Track cache còn nhánh kiểm size/tồn tại; REVIEW không đồng nghĩa đạt; chưa nghiệm thu giọng cuối theo mẫu |
| Thời lượng | Tối đa hai vòng sửa khi lệch quá ngưỡng hiện tại 15% | Runner còn đưa toàn bộ chapter IDs vào hiệu chỉnh; cần chọn đúng khoảng cần sửa, đo lệch cục bộ |
| Tùy chọn | Review/SFX/previews đã truyền vào pipeline, tắt có guard | Giữ và kiểm hồi quy; không ghi lại việc truyền cờ SFX như chưa có |
| SEO/Chrome | SEO khởi chạy sau render; render handoff giải phóng editorial sessions | Luồng bình thường chưa bảo đảm DNA/kịch bản/SEO cùng room; dời phần ngôn ngữ SEO sớm, timestamp tính cục bộ |
| Render | Probe cache phần, kiểm audio/MP4/giải mã, kiểm đen/im lặng theo chủ ý; manifest công bố | Nghiệm thu crash/cache/file thật; phạm vi handoff toàn trình duyệt cần kiểm đa production |
| Log/UI | Lưu production/job và lịch sử UI, reload theo dõi lại; reset khi tạo mới | Buffer backend giới hạn 400 dòng; tách cửa sổ hiển thị khỏi lịch sử đầy đủ theo production |
| 2D/3D | Production puppet cố định settings 2D/drawn; renderer/spec có gen3d | Lập ma trận thật; không tuyên bố 3D tương đương hoặc âm thầm ép lựa chọn 3D thành 2D |

### Bản đồ đường gọi dùng làm căn cứ

- UI/lệnh: src/features/motion/hooks/useMotionStudio.ts, src/components/motion-video/ và motionApi.ts.
- API: src/features/motion/server/routes/motionVideoRoutes.ts, src/features/motion/server/controllers/motionVideoController.ts, src/server/services/motionProductionActions.ts.
- Production/lưu trong src/server/services/: motionProductionService, motionProductionStore, motionProductionPreflight, motionStoryJobService, motionStoryCheckpointService, motionTaskCheckpoint, motionFileUtils.
- AI/room trong src/server/services/: motionStoryService, motionAiContractService, motionAiWorkerPool, motionEditorialContextService, chatUiPlanningService, chatContextReceipt, chatSubmissionRecovery. Hợp đồng trong src/lib/: motionAiRepair, motionChapterRepair, motionDnaRepair, motionBrowserLifecycle.
- Minh họa trong src/server/services/puppet/: pipelinePuppet, planReadiness, storyboard, director, visualContract, readContinuity, packCatalog, packPolicy, packLocation, packInventory, kitDraw, setComposer, packSceneChoices, packSelectionContract, spatialPlacement, layout, blocking, compilePuppet, qa, sound.
- Giọng trong src/server/services/: motionAudioService, motionVoiceDirectionService, motionVoiceSourceService, motionVoiceLibraryService, motionVoiceReferenceService, motionVoiceSpeedService, motionVoicePaceService, motionVoiceQualityService, motionSpeechRateService, vieneuTtsService; worker/texts trong python_scripts/.
- Timeline/xuất trong src/server/services/: motionDirectorService, motionRenderService, motionMediaValidation, motionRenderPublication, motionSoundMixService, motionSeoService, motionThumbnailService; src/lib/motionOutputQuality.ts; motion-engine/core.js, puppet2d.js, texts.js.
- Dữ liệu/quản trị: types/constants/lib liên quan, kitLibrary/kitAdmin/kitSeed/assetProfiles, scripts migration/verify, python_scripts/kit_seed/. Import động, route, script package, file dự án cũ và caller ngoài tiến trình phải kiểm trước khi xóa.

Đây là rà soát đường gọi và điểm rủi ro của Video Motion; không phải chứng nhận đã chạy mọi nhánh hoặc đã xem/duyệt từng tài nguyên trong kho.

## 3. Luồng đích và hợp đồng chung

Nguồn/cấu hình → preflight cục bộ → đọc nguồn theo phần nếu cần → khóa khung truyện/DNA → khóa khả năng minh họa thiết yếu → viết từng cụm sự kiện trong chương khi cần → kiểm/biên tập phần cần thiết → kế hoạch minh họa có cấu trúc → dựng kho và tạo giọng song song → chốt timeline theo tiếng thật → kiểm trước xuất → render từng phần → kiểm/công bố MP4.

SEO ngôn ngữ bắt đầu từ kịch bản đã đạt trong phiên biên tập còn sống; timestamp chương ghép bằng code sau khi có tiếng thật. Thumbnail/SFX/review chỉ làm khi bật hoặc được yêu cầu. Kế hoạch đã đủ thông tin chỉ kiểm tại máy, không thêm một lượt AI diễn giải lại.

### Danh tính, lưu và phụ thuộc

| Trường | Quy tắc |
|---|---|
| projectId/productionId/revision/configHash | Phân biệt dự án/lượt/phiên bản; kết quả cũ không ghi vào phiên bản mới |
| stageId/itemId/sourceRange | ID bền vững cho sự kiện/chương/beat/thoại/hình; index chỉ dùng truyền tải cục bộ |
| requestId/responseTo/inputHash | Ghép phản hồi/bản sửa đúng yêu cầu và phiên bản |
| dependencyHash/schemaVersion/packVersion/voiceProfileVersion | Cache đúng phụ thuộc/phiên bản; không tính lại hash để che thay đổi không rõ nguồn |
| accepted/draft/issues/allowedFields | Lưu mục đạt/nháp/lỗi/path; bỏ trường là giữ, xóa dùng null/thao tác schema cho phép |
| contentAttempts/serviceAttempts/roomGeneration | Ngân sách riêng, lưu bền; đổi batch/room/provider không tự reset lượt sửa |

Sửa một mục phải kiểm quan hệ có thể kéo dài qua nhiều cảnh. Ví dụ đổi owner vật: đi tiếp trong cùng scene/timeline đến khi trạng thái hội tụ hoặc có mốc chuyển rõ; không chỉ kiểm một cảnh kế bên, cũng không xóa mọi hình/clip.

Trạng thái phân biệt: chờ, chạy, chờ dịch vụ, chờ xác minh, sửa nội dung, gián đoạn, dừng/hủy, hoàn thành, lỗi cần xử lý. Reload không phát sinh lại việc; backend chỉ phục hồi lượt còn quyền tiếp tục.

## 4. Quy chuẩn chia prompt cho mọi bước

### 4.1. Đơn vị chia và ngân sách

1. Dựng payload từ dữ liệu có kiểu, đo **prompt cuối cùng** sau schema/identity/context/catalog/wrapper/JSON directive. Tính riêng ảnh và output dự kiến; ký tự không phải token hoặc chi phí ảnh.
2. Budget là cấu hình theo artifact/provider/model, không hardcode rải rác. Mốc khởi đầu 12.000–18.000 ký tự cuối cho request động; 24.000 là ngưỡng gửi hiện tại, không phải context limit của model hay bảo đảm hết treo.
3. Chọn nhóm ngữ nghĩa nhỏ nhất đủ phụ thuộc: cụm sự kiện, cuộc thoại, một hình với mọi người/vật liên quan; gộp vài đơn vị nhỏ khi vẫn gọn để tránh thừa lượt chờ.
4. Quá budget: bỏ dữ liệu lặp → rút context chung thành bản chuẩn có ID → lọc catalog → giảm item theo ngữ nghĩa. Một item vẫn quá lớn thì chia nhiệm vụ phụ có hợp đồng; không cắt ngang câu/JSON hoặc bỏ thông tin thiết yếu cho vừa trần.
5. Chia tin/receipt chỉ là vận chuyển ngoại lệ. Ghi generation/hash/phần đã xác nhận; đổi room phục hồi đúng phần, không giả định phần của room cũ tồn tại ở room mới.
6. Dữ liệu đã đạt, việc code tính được hoặc tùy chọn tắt phải có **0 lượt AI bổ sung**. Không hỏi AI kiểm lại ID/geometry mà code đã kiểm.

### 4.2. Hợp đồng mỗi request

- Phần chung: artifact/schema/version, bất biến gọn, context room đã xác nhận nếu dùng. Chỉ hydrate schema/catalog ổn định khi version/hash/generation đúng; dữ liệu chuẩn luôn ở máy.
- Phần riêng: target IDs, nguồn cần thiết, state đầu/cuối, ứng viên đúng gói. Phân biệt dữ liệu nguồn với lệnh; truyện/tài liệu đính kèm không trở thành chỉ dẫn hệ thống.
- Kết quả đầu: chỉ target IDs và schema tối thiểu. Không yêu cầu nhắc lại nguồn, catalog, mọi hướng dẫn hoặc giải thích dài không được dùng.
- Bản sửa: pending IDs, allowedFields, draft liên quan, lỗi cụ thể, ràng buộc/ứng viên cần cho lỗi và hàng lân cận cần thiết. Không kèm toàn original task/full draft theo mặc định.
- Sau nhận: parse/kiểm/merge tại máy, lưu từng mục đạt; kiểm quan hệ nhóm tại máy khi cần. Không buộc AI trả lại mọi mục chỉ để kiểm độ phủ.

### 4.3. Quyết định từng loại prompt

| Loại | Đơn vị/định hướng tối thiểu | Phần phải giữ chung và tránh làm lại |
|---|---|---|
| Source ledger | Phần nguồn theo sự kiện, ID/timestamp; khoảng 10.000 ký tự là trần khởi đầu chưa cộng wrapper | Nhân quả/manh mối; tổng hợp có hạn mức, dài thì phân cấp, không mất đoạn cuối |
| DNA/khung truyện | Khung toàn cục gọn trước; profile thể hiện tách riêng chỉ khi vượt budget | Twist/setup/payoff/danh tính/kết thúc dùng một bản chuẩn |
| Truyện mới | Khung nhân quả nhất quán, chi tiết chương/sự kiện sau khóa | Không gửi nguyên truyện mẫu ở mọi repair hoặc phát minh lại twist từng chương |
| Viết chương | Chương gọn một lượt; lớn thì cụm sự kiện có đầu/cuối/quỹ từ | Không lặp mở đầu/tóm tắt; giữ manh mối/nhịp/kết chương |
| Repair DNA/truyện/chương | Nhóm nhỏ trường/beat có phụ thuộc | Narration đồng bộ utterances; trường đạt giữ; duration chọn đúng đoạn |
| Editor | Chương/cụm sự kiện; kiểm mạch toàn truyện qua ledger gọn | Budget tính đủ lời đã viết và output, không chỉ phần nguồn |
| Storyboard + READ có sẵn | Cụm sự việc liền mạch, giới hạn boundary và JSON READ đầu ra | Hiểu đủ một lần không đọc lại; coverage kiểm bằng code; không mỗi câu một hình |
| READ thiếu | Một hình với mọi người/vật, có thể nhóm khoảng 2–4 hình nhẹ | A đứng/B nằm/giường/owner/hiệu ứng xét chung; lọc catalog, không gửi cả kho |
| Repair READ | Tách missing row khỏi field repair có draft | Giữ nhánh sửa gọn, missing row không kéo mọi mục sang full schema/catalog |
| Chọn kho/bố cục | Code dùng ứng viên/binding/hash hợp lệ | Không thêm prompt chọn choiceId/camera/tọa độ/dịch title |
| Review ảnh | Chỉ khi bật, khoảng 2–4 khung nặng và ảnh trước cần đối chiếu | Budget ảnh + text; chỉ trả lỗi target, không lặp mọi plan/sourcePlans |
| Casting | Tập giọng nhỏ đã lọc; một bảng vai nhất quán | Vai khóa rồi bỏ qua; không chia catalog chọn các giọng xung đột |
| Tách thoại | Cuộc thoại hoặc khoảng 4–8 beat nặng; nhóm nhẹ có thể lớn hơn | Chữ/người nói/câu dẫn; thoại đạt không suy luận lại |
| TTS | Clip/cụm đọc tự nhiên theo engine, cache theo phụ thuộc | Tạo tiếng riêng, không cắt tùy tiện theo budget chat làm đứt ngữ điệu |
| SFX | Cảnh/cụm beat, catalog truy hồi đã có, budget thực | Tắt thì bỏ; giữ ambience/nguồn, không gửi toàn kho |
| SEO | Một brief gọn cho bộ phương án; sửa option/trường thiếu | Title/description/hashtags/tags cùng định hướng; không full script |
| Thumbnail | Một concept hoàn chỉnh/lượt | Chủ thể/bố cục/màu/chữ cùng ảnh, không chia thêm khi đã gọn |
| Vẽ tự do/quản trị | Một tài nguyên hoặc nhóm piece nhỏ nếu có caller | Giữ style/reference/identity; không tạo mới trong kho đóng production |

Số nhóm là cấu hình khởi đầu để đo, không ép mọi request cùng số item. Đổi cách chia không được mất ID, accepted/draft, state nối tiếp hoặc số lần đã thử.

Số đo trước sửa: chương khoảng 45–46 nghìn ký tự; repair một narration mẫu 59.211; editor 34.205; READ 43.701. Sau đối ứng cùng dữ liệu: chương 20.090–20.881; repair narration 8.497; editor 10.527; READ đầu 23.334; pending READ mẫu 24.194; SEO 4.918. Chưa cộng mọi wrapper và analysis mẫu không có đủ DNA; đây là mẫu request đầu, không phải cực đại hoặc số đo độ trễ dịch vụ. Xem audit và scratch/motion-prompt-after-20261025/measurements.json.

## 5. Các đầu việc nhỏ và tiêu chí đạt

Mỗi mã là một đầu việc review riêng. Tái sử dụng phần hiện có; chỉ đánh dấu đạt khi có thay đổi/bằng chứng tương ứng.

### A — Đường chạy, trạng thái và dữ liệu

Code: production/actions/store/job/checkpoint/controller/routes, useMotionStudio, types/constants.

- **A01 — Inventory caller:** phân loại production, sửa thủ công, preview/spec, quản trị kho, script/dự án cũ. Đạt khi mỗi đường có owner và bảng keep/replace/remove có căn cứ.
- **A02 — Danh tính/revision:** kiểm production/session/stage/input/dependency khi nhận kết quả; giữ sửa job nhận chung đã có. Gửi lặp chỉ một việc, hai dự án không lẫn, phản hồi cũ không ghi đè.
- **A03 — Một điều phối:** production sở hữu chuỗi; UI sửa riêng gửi lệnh có phạm vi. Chỉ xóa auto-chain thật sự trùng, giữ thao tác thủ công còn dùng.
- **A04 — Checkpoint/owner:** kiểm crash, EPERM, file hỏng, owner sống/chết và kết quả sau hủy. Job con không chỉ log lỗi ghi rồi báo bền vững như thành công; giữ payload/báo khả năng phục hồi.
- **A05 — Chờ/tiếp tục:** lưu nguyên nhân/retryAt/budget. Reload chỉ theo dõi; đã dừng thì restart không resume; tiếp tục đúng production và nháp.
- **A06 — Phiên bản dữ liệu:** adapter dự án cũ, input/result tách sâu; pack/profile đổi invalidate đúng phụ thuộc, không tính lại hash che snapshot sai.

### B — Dựng prompt và chia nhóm dùng chung

Code: builder story/puppet/voice/SEO, chatUiPlanningService, constants theo miền; mở rộng helper có sẵn hoặc module có trách nhiệm rõ.

- **B01 — Đo trước tối ưu:** log ký tự/token ước tính, context/catalog/dynamic, target/output dự kiến, ảnh, số tin, receipt/generation time, repair/provider. Không đưa toàn dữ liệu nhạy cảm lên UI.
- **B02 — Budget cuối:** một cơ chế tính dùng chung theo artifact/provider; cộng wrapper/context/directive. Mọi đường gửi được đo và có nhánh xử lý quá lớn rõ ràng.
- **B03 — Payload tối thiểu:** DTO chọn đúng trường; bỏ lặp scenePlan/visualUnit/sourcePlans và chỉ dẫn mâu thuẫn. Kiểm hợp đồng chứng minh dữ kiện thiết yếu còn đủ.
- **B04 — Context chuẩn:** ledger/xương sống truyện, cast/place/voice bindings và state gọn có version; không gửi toàn nguồn/chương khác ở mỗi nhóm.
- **B05 — Lọc catalog:** tìm theo semantic/thuộc tính, đúng pack/version; candidates có ID và thuộc tính phân biệt. Không có thì mở rộng tìm có kiểm trong gói, không bỏ đúng ứng viên vì khác tên Việt/Anh.
- **B06 — Adaptive batch:** chia sự kiện/thoại/hình theo input/output thật, nhỏ nhất đủ nghĩa. Giảm batch không đổi thứ tự, coverage hoặc quan hệ trong hình.
- **B07 — Checkpoint độc lập batch:** accepted/draft theo item ID/dependency, không chỉ group hash/index; adapter draft hiện tại. Chia lại hoặc subset resume giữ phần đúng và budget.
- **B08 — Repair tối thiểu:** bỏ original task/full draft không liên quan; chỉ pending fields/context cần thiết, giữ null/omission và schema đặc thù.
- **B09 — Chia tin ngoại lệ:** receipt đúng ID/hash/generation, đủ phần mới execute; không resend phần đã xác nhận trong đúng room. Arbitrary slice không là chiến lược chia nhiệm vụ chính.
- **B10 — Đo trước/sau:** cùng input so request/tin/text/output/latency/độ đúng. Không coi tăng số prompt nhỏ là tăng tốc nếu tổng roundtrip tăng mà chất lượng không tăng.

### C — Contract và bảo toàn mục đạt

Code: motionAiContractService, src/lib/motionAiRepair và validator/repair chuyên biệt.

- **C01 — Schema/identity:** requestId/responseTo/target/version, ID trùng/lạ; đảo thứ tự vẫn merge theo ID.
- **C02 — Khóa/lưu mục:** ghi accepted ngay, draft/issues/path/allowedFields riêng; không đợi cả nhóm.
- **C03 — Patch phạm vi:** merge đúng path, states theo char/identity; chặn sửa ID/nguồn/cấu hình/mục khóa; null chỉ xóa trường được phép.
- **C04 — Quan hệ sau merge:** owner/support/placement, narration–utterances, boundary/coverage, evidence/state. Kiểm nhóm bằng code không yêu cầu AI viết lại nhóm.
- **C05 — Ngân sách duy nhất:** lập bảng attempts/budget theo item/stage; code hiện có nhánh nhân budget theo số route nên kiểm cả tầng. Đổi AI/room/batch/resume/duration round không tự reset.
- **C06 — JSON hỏng:** giữ phục hồi cú pháp có bằng chứng, không sáng tác nội dung bị cắt; parse xong vẫn kiểm identity/schema. Không đọc được thì sửa phần còn thiếu, giữ accepted.
- **C07 — Dọn trùng:** đưa lưu/merge/budget chung về contract/ledger, giữ validator đặc thù; xóa cơ chế cũ cùng đợt sau chuyển caller.

### D — Room, provider, CAPTCHA và bàn giao Chrome

Code: motionStoryService, chatUiPlanningService, recovery/receipt/model picker, worker pool/browser lifecycle.

- **D01 — Room theo vai:** DNA/kịch bản/SEO ngôn ngữ chung phiên; worker hình độc lập, chat tiếp room của mình. Không mutex toàn thời gian AI trả lời khiến worker khác chờ.
- **D02 — Loại lỗi:** nội dung/JSON khác readiness/UI/timeout/dịch vụ/CAPTCHA/hạn mức. Nội dung sửa cùng room, chỉ lỗi phù hợp mới reload/đổi provider.
- **D03 — Phục hồi hữu hạn:** reload room tối đa hai lần rồi mới thay khi cần; lưu generation/accepted và tổng budget. Service wait hiện 10 phút/tối đa hai lần phải hiển thị rõ, không giả đang sinh đáp án.
- **D04 — Model sau readiness:** chờ input/model/thinking thật sẵn, giữ sửa Gemini simplified-input. Không kết luận model không khả dụng khi UI chưa tải đủ.
- **D05 — Route/khóa AI:** khóa xuyên UI/API/worker; main/draw theo cấu hình, mặc định DeepSeek Standard trước ChatGPT Auto; log route thực, không đổi trái khóa.
- **D06 — CAPTCHA:** đúng năm tiếng, giữ room/nháp, chờ người giải; kiểm nhiều tab/hủy; hết thời gian không đồng nghĩa giải xong.
- **D07 — Context phiên bản:** hydrate khi room/generation thực đổi hoặc reload mất context; invalidate receipt/catalog cache; chỉ nhìn provider chưa đủ.
- **D08 — SEO/handoff:** dời SEO ngôn ngữ từ sau render sang sau script đạt, chạy trong lúc hình/TTS; timestamp tính cục bộ. Trước xuất, SEO optional chỉ có budget chờ hữu hạn; chưa xong giữ pending/draft và lỗi riêng, không giữ Chrome/MP4 vô hạn. Người dùng làm lại sau đóng room thì hydrate room mới, ghi rõ ngoại lệ, không gọi đó là room cũ.
- **D09 — Phạm vi browser/tài nguyên:** gate render toàn trình duyệt không đóng phiên hợp lệ của production khác hoặc kẹt vì TTS cục bộ. Chỉ giữ browser lease khi thật cần AI. Đóng Chrome tool sau AI bắt buộc, trước render; không tăng tab/timeout vô hạn hoặc đóng app khác.

### E — Nguồn, khung truyện, DNA, chương và editor

Code: motionStoryService, source fetch/clean/chunks, DNA/chapter repair, actions, src/lib/motionProduction.

- **E01 — Nguồn đủ:** phần có ID/timestamp/liên kết sự kiện, checkpoint đúng phụ thuộc; hạn mức tổng ledger và fallback nguyên văn; không phình theo toàn truyện hoặc mất kết.
- **E02 — Khung chung:** khóa động cơ/nhân quả/manh mối/setup/payoff/twist/kết; phân biệt sáng tác/factual. Chỉ tách profile khi cần, không phân tích lại cốt truyện ở mọi bước.
- **E03 — Nhu cầu minh họa:** người/nơi/vật/quan hệ thiết yếu có schema và evidence; kiểm kho trước viết dài và sau chương. Chi tiết AI tự thêm không mặc nhiên bắt buộc.
- **E04 — Viết phần đủ nghĩa:** chương gọn một lượt; lớn chia sự kiện có targetUnits/đầu cuối, chỉ cast/place/kho liên quan. Phần phụ thuộc viết theo thứ tự; chỉ song song phần độc lập.
- **E05 — Repair nhỏ:** đúng pending fields, giữ ID/thứ tự/manh mối/kết, narration khớp utterances; không lấy dàn ý/nháp lỗi thay chương hoàn chỉnh.
- **E06 — Editor mục tiêu:** budget đủ input/output; kiểm lời Việt/dài dòng/nhịp/mạch, chỉ trả patch/nhận xét có tác dụng. Lỗi editor optional không bỏ kiểm bắt buộc.
- **E07 — Gate script:** assertMotionScriptComplete hiện chủ yếu kiểm mỗi chương có narration; thêm pending/schema/độ dài/quan hệ cho script mới/cũ mang vào. Không mở TTS chỉ vì mỗi chương có một câu.

### F — Kho cũ/mới, binding, vị trí và nhịp hình

Code: planReadiness, catalog/policy/semantics, kitDraw/setComposer/location/inventory, storyboard/director/continuity, choices/selection/layout/spatial/compile.

- **F01 — Một schema:** semantic ID, hồ sơ Anh/nhãn Việt/alias, loại/chất liệu/màu/state, size/anchor/contact/layer/posture/support/version; seed/import/migration chung quy tắc.
- **F02 — Cũ/trùng:** ID trùng, hình trùng và gần nghĩa là ba loại; giữ biến thể cần thiết. Map tham chiếu/xem ảnh trước gộp/xóa; số liệu migration lịch sử không thay audit dữ liệu hiện tại.
- **F03 — Mỹ thuật:** đối chiếu hình/tư thế hai gói với mẫu thật, chibi chân sát người/tỷ lệ/đồ mặc/ghost. Geometry không thay xem ảnh; bảng nhiều cảnh gọn, file mở được.
- **F04 — Binding sớm:** mở rộng readiness cast/place sang vật/manh mối/chỗ tựa/tổ hợp thiết yếu; truyền binding đã kiểm sang dựng với pack/dependency hash, không chọn lại mẫu khác vô cớ.
- **F05 — Tra cứu nghĩa:** thuộc tính bắt buộc/loại nơi có kiểu quyết định hợp lệ; điểm keyword chỉ rank ứng viên hợp lệ. Unknown không cho qua; chọn đầu tiên phải chứng minh fit đủ nghĩa.
- **F06 — Thiếu kho:** phân biệt suy diễn thừa/metadata thiếu/lọc hẹp/tư thế phụ với thiếu cốt lõi. Tìm alias/biến thể/tổ hợp có sẵn; hành động phụ khó dùng minh họa tĩnh đúng. Thiếu cốt lõi sửa kế hoạch sáng tác trước khóa hoặc báo bổ sung kho ngoài production; không sinh mới/đổi vật sai/cảnh trống.
- **F07 — Một kế hoạch hình:** source range/người/vật/state/owner/support/quan hệ; đủ thì bỏ READ. Repair boundary chỉ lỗi và lân cận, code kiểm coverage cả nhóm.
- **F08 — READ nhỏ:** B03–B08, mọi người/vật trong một hình cùng request; missing row riêng field repair. Trích đúng câu chưa chứng minh suy diễn đúng; kiểm state/kế thừa.
- **F09 — Compose code:** giữ rank/geometry/selection; dùng lại preflight có chữ ký nếu context liên tục khớp. Previous state khác phải tính lại, không cache chỉ theo text/read.
- **F10 — State/invalidation:** identity/owner/mount/fixture/địa điểm/bố cục nối tiếp từ sự kiện rõ. Sửa lan đến hội tụ; giữ hình/clip không ảnh hưởng và ảnh khi chỉ đổi timestamp.
- **F11 — Nhịp/effect/miệng:** đổi theo việc cần thấy, không mỗi câu hoặc lặp ảnh mâu thuẫn. Cùng nơi được giữ; ghost/khói/mùi/mouth theo binding/clip thật.
- **F12 — Review tùy chọn:** tắt không AI/render chỉ phục vụ review; local compile/geometry còn. Bật nhóm nhỏ/context gọn, sửa đúng lỗi chứng minh; không bắt diễn mọi động từ.

### G — Giọng rõ chữ, nhịp và thời lượng

Code: audio/direction/source/library/reference/speed/pace/quality/speech, Python VieNeu worker/texts, constants.

- **G01 — Một owner TTS:** production dựng autoVoice=false như hiện có; phân biệt sửa thủ công. TTS cục bộ không bị browser gate khi không cần chat; casting/tách thoại thiếu mới lấy room.
- **G02 — Vai/giọng khóa:** giữ binding hợp lệ, ít candidates khi cần, bỏ casting lặp; chỉ tách thoại chưa đạt, nguyên chữ/người nói, không biến narration thành thoại.
- **G03 — Thần trùng:** đo tốc độ/articulation/nghỉ/âm lượng/độ rõ, khóa profile/version cho narrator và mọi vai; không dùng Mèo Đen thay mẫu hiện tại.
- **G04 — Xử lý tiếng:** noise/compression/EQ/tempo cho mọi vai; giữ phụ âm/đầu cuối chữ, không cắt dấu câu quá nhỏ hoặc kéo để đủ dài. Nghe clip đại diện trước áp dụng hàng loạt khi được yêu cầu chạy thử.
- **G05 — Quality/cache:** header/PCM/giải mã/thời lượng/signature; phân biệt PASSED/REVIEW/UNAVAILABLE/UNCHECKED. Bổ sung kiểm nhánh chỉ size/tồn tại; không tái tạo vô hạn vì ASR nghi vấn hoặc gọi REVIEW là chứng nhận rõ chữ.
- **G06 — Tạo lại cục bộ:** chỉ câu lỗi/đổi text/voice/profile, giữ clip khác/budget; key gồm engine/filter/pacing/ASR version; clip hỏng không xóa cả track.
- **G07 — Duration:** đo tiếng thật, chọn chương/đoạn gây lệch thay mọi chapter IDs; giữ nhịp/kết, đổi đúng TTS/hình phụ thuộc, không reset budget qua duration round.
- **G08 — Ngưỡng:** 15%/hai vòng là hành vi hiện tại, chưa là chuẩn người dùng duyệt; chốt ngưỡng trước nghiệm thu, kiểm cả thoại nhanh cục bộ; thiếu tiếng/sai version không xuất đạt.

### H — Timeline, sub, camera và tùy chọn

Code: director/compilePuppet/storyboardTiming/track, engine, sound/SFX/music/SEO/thumbnail.

- **H01 — Tiếng thật:** một nguồn mốc clip/beat/hình/sub/thoại; đổi clip cập nhật mốc sau cần đổi. Ước lượng chỉ preview/tiến độ.
- **H02 — Boundary/sub:** căn manh mối/người nói bằng mốc đáng tin; sub không nền/chớp/cụt câu, chuyển nhẹ; tắt sub vẫn kiểm audio theo speechRanges.
- **H03 — Camera:** bỏ shake/giật; giới hạn biên độ/vận tốc zoom/pan theo giây, easing/chuyển nhẹ; không reset mỗi câu. Kiểm cảnh ngắn/dài, transition không che manh mối.
- **H04 — SFX/nhạc:** giữ guard tắt/retriever/nguồn phát; giữ volume/override qua reload; lỗi riêng, không thay track lời hoặc retry cả dựng.
- **H05 — SEO:** brief truyện cuối; phương án tiêu đề gần nguồn theo yêu cầu nhưng đúng truyện; repair option/trường, timestamp cục bộ. Duration sửa nghĩa mới invalidate SEO, đổi timestamp đơn thuần không gọi lại.
- **H06 — Thumbnail:** concept theo title/gói cuối, prompt/kết quả riêng; không gọi nếu không yêu cầu/bật. Lỗi thumbnail không hủy MP4, không biến ảnh này thành tài nguyên mới của kho đóng.

### I — Preflight, render và công bố

Code: production preflight, render/media/publication/library/store/browser lifecycle.

- **I01 — Điều kiện:** nguồn/gói/voice/FFmpeg/renderer/quyền ghi/dung lượng dự kiến; kiểm lại mốc dài. AI kiểm lần dùng đầu, không thêm prompt ping mỗi bước.
- **I02 — Handoff:** D08–D09, chờ đúng AI bắt buộc, đóng Chrome tool tại ranh giới xuất; không đóng phòng còn việc hợp lệ/app khác.
- **I03 — Render phần:** hash spec/assets/audio/options, probe cache mới dùng; phần hỏng tạo lại riêng. GPU→CPU giữ đầu ra; lỗi không tiếp tục dừng đúng workers, giữ phần đạt.
- **I04 — Audio bắt buộc:** voice signature/profile đúng, đủ dài, mux thật; không silent fallback cho truyện. Không tiếng chỉ cho yêu cầu riêng có chủ ý.
- **I05 — File thật:** probe/giải mã/codec/kích thước/fps/frame/duration/hình–tiếng/khả năng phát; đen/im lặng theo chủ ý; không nuốt checkOutput.
- **I06 — Công bố:** manifest/metadata idempotent qua crash trước/sau rename/add-result/completed; cancel không công bố muộn; giữ/hoàn thiện cơ chế có sẵn, không thêm publication service trùng.

### J — UI, log và khả năng 2D/3D

Code: hook/components/API/controller/types/log/activity/settings.

- **J01 — Lệnh/poll:** production/revision cho tạo/dừng/tiếp tục/sửa; reload không submit, kết quả cũ không gắn dự án khác; giữ voice/SFX/override/upload hợp lệ.
- **J02 — Log đủ:** lịch sử production có sequence/cursor/lưu backend, UI có thể phân trang; 400 dòng không là lịch sử duy nhất. Tạo mới đổi phiên log đang xem, không xóa dữ liệu phục hồi cũ.
- **J03 — Tiến độ:** đạt/pending/sửa, request/receipt, chờ dịch vụ/CAPTCHA/retryAt rõ; badge AI ngắn một dòng, settings hai item/hàng theo yêu cầu khi phù hợp màn hình.
- **J04 — Settings:** AI nội dung/dựng, lock/model, review/motion/sub/SFX/preview/autoExport/profile phản ánh snapshot; không giấu/ghi đè cờ quan trọng.
- **J05 — Ma trận mode:** UI→API→settings→builder→renderer→validator/test; không hỗ trợ thì báo sớm, không ép 3D sang 2D. Không tự mở dự án làm 3D mới; giữ gen3d/spec/preview còn caller.

### K — Dọn code sai/thừa và quy chuẩn

- **K01 — Bảng xóa:** mỗi hàm/export/route/task/constant có caller/dữ liệu cũ/thay thế/kiểm bảo vệ; không xóa nguyên file quản trị vì production không dùng.
- **K02 — Dọn cùng đợt:** chuyển caller/schema/cache → kiểm → xóa đường cũ/import/text/script; không service V2 hoặc cờ luồng cũ vô thời hạn.
- **K03 — Bỏ việc trước tối ưu:** không làm bền vững lại AI chọn choiceId/dịch title/đọc lại READ đạt đã quyết định bỏ; phần hiện đã bỏ chỉ kiểm và dọn sót theo caller.
- **K04 — Chung đúng miền:** dùng contract/parser/cache/DTO/component lặp; text/URL/label/tooltip/prompt theo miền, không một common khổng lồ/wrapper vô nghĩa.
- **K05 — Code gọn:** không comment trong code sản phẩm; giải thích ở docs, format 400/dòng gọn theo cấu hình và chỉ phạm vi sửa; không reset Git/xóa diff người dùng.
- **K06 — Dữ liệu riêng:** ảnh/tài nguyên/cache/output có owner/tham chiếu khác source; kiểm định dạng/path/file trước dọn. Chỉ xóa trùng sau chuyển tham chiếu và chứng minh không dùng, giữ bằng chứng tái hiện.

## 6. Bảng thay/xóa theo khu vực

| Khu vực | Giữ/chuẩn hóa | Thay/xóa có điều kiện |
|---|---|---|
| useMotionStudio | State/lệnh/poll, sửa thủ công | Auto-chain/retry trùng production, giữ manual còn dùng |
| Production/store/job/actions | Một đường chung, lock/checkpoint | State/Map làm nguồn thật cạnh tranh, chặn job thiếu danh tính |
| motionStoryService | Biên tập/session/recovery còn dùng | Context/retry/fallback sai phạm vi; tách trách nhiệm khi contract ổn định |
| Contract/repair/ledger | Patch theo path, validators riêng | Full-task repair, merge/budget trùng sau chuyển caller |
| Storyboard/director | Một kế hoạch, field repair, coverage/state | READ trùng, group-only ID, context/full catalog dư |
| Pack/catalog/kit/set/choices | Rank/geometry/binding và quản trị | AI chọn ID/camera/vẽ mới production, tìm choices lặp cùng phụ thuộc |
| Audio/Python/profile | Clip cache/pacing/filter/ASR/tiếng thật | TTS trùng, cache chỉ size, hardcode nhịp/filter, REVIEW hiểu thành đạt |
| Render/media/publication | Cache phần/probe/audio/manifest | Silent fallback, log-only kiểm lỗi, checkpoint cạnh tranh |
| SEO/thumbnail/sound | Brief/pending repair/tùy chọn | Full script, AI khi tắt, SEO luôn chạy sau đóng room |
| BOARD2D_SHEET/board2d/creativeBlueprint | Caller/adapter thật | Chỉ đổi/xóa sau chuyển client/project cũ; tên cũ không tự là code chết |
| Constants/types/scripts/package | Schema/text/hồi quy | Export/error/artifact/entry chỉ phục vụ nhánh đã bỏ, kiểm caller động/worker |

## 7. Thứ tự triển khai

1. **Đợt 0 — A01/B01:** inventory, số đo, trạng thái từng mã. Kiểm hiện có trước gắn nhãn thiếu.
2. **Đợt 1 — A02–A06/C01–C06/B07:** danh tính/checkpoint/patch/budget, đổi batch an toàn; giữ sửa hiện có và bổ sung thiếu.
3. **Đợt 2 — B02–B06/B08/E05/F08/E06:** giảm repair chương/truyện, READ/editor, bỏ full original task/context lặp, giữ accepted/validator; đo trước/sau.
4. **Đợt 3 — D01–D09/B09:** room/provider/receipt/CAPTCHA/SEO trước handoff; worker độc lập theo tài nguyên.
5. **Đợt 4 — E01–E04/E07/F01–F07:** khung truyện/catalog/semantic/binding/gate trước viết/TTS; tách task lớn giữ khung chung. Việc dữ liệu độc lập có thể thực hiện song song, không ngụ ý cần nhiều agent.
6. **Đợt 5 — F09–F12/G01–G08/H01–H06:** vị trí/nhịp hình/giọng/timeline/tùy chọn, giữ nghệ thuật/hành vi đã duyệt.
7. **Đợt 6 — I01–I06/J01–J05:** xuất/công bố/log/UI/mode/tương thích và kiểm xuyên luồng.
8. **Mỗi đợt:** C07/K01–K06, type/compile/kiểm mục tiêu và B10 đo lại; không dồn xóa đường cũ đến cuối.

Lỗi trộn dự án/mất dữ liệu/hủy sai phạm vi phải sửa nền trước tối ưu. Không giảm ký tự bằng bỏ điều kiện làm sai hình/lời.

## 8. Ma trận kiểm và điều kiện nghiệm thu

| Nhóm | Ca bắt buộc |
|---|---|
| Prompt/batch | Một item dài/nhiều item ngắn; wrapper/context/ảnh/catalog; đổi batch/subset giữ accepted/draft/budget; boundary không hở/chồng |
| Repair | 10 sai 1; path lồng; null/omission; sửa lấn mục đạt; ID lạ/trùng/đảo; JSON hỏng/cắt cuối; phản hồi cũ; không resend toàn task |
| Nguồn/truyện | Ngắn/dài/nhiều chương/twist cuối/manh mối xuyên chương/sáng tác–factual/lời Việt; script còn draft lỗi không qua gate |
| Kho/vị trí | Hai gói/cũ/mới/alias/unknown/thiếu thật; đứng–nằm/ngồi–đứng/thoại/cầm–đặt/ghế cạnh giường/lớp/ghost/khói; không sinh asset |
| Liên tục | Owner/fixture/nơi đổi lan đến hội tụ; timestamp đổi không mất ảnh; một hình đổi không xóa mọi reads/frames; không lặp trái sự kiện |
| Room/dịch vụ | Ba worker độc lập, chat tiếp, readiness/model, reload hai lần, khóa/fallback, CAPTCHA năm tiếng, hydrate generation, không nhân retry |
| Job/phục hồi | Hai dự án/duplicate/reload/đóng UI/restart/EPERM/file hỏng/owner cũ/hủy–reload/kết quả muộn; không tự chạy lượt dừng |
| Giọng | Mọi vai, thoại nhanh cục bộ, câu ngắn/dài/tên/dấu câu, lọc/nén/phụ âm, ASR nghi vấn/lỗi thật/cache hỏng/nối đoạn/Thần trùng |
| Timeline/hình | Tiếng thật, đổi clip, mouth/manh mối/sub; camera chậm/không shake, transition/sub không chớp |
| Xuất | GPU/CPU/cache hỏng/hết đĩa/thiếu tiếng/mux/codec/frame/duration/đen–im lặng/crash công bố/MP4 phát được |
| Tùy chọn/UI | Tắt không AI tương ứng; SEO lỗi không hủy MP4; dùng phiên biên tập trước handoff; log đủ/reload/settings giữ |
| Khả năng | Ngắn/dài/nhiều người–nơi–chương/tỷ lệ hỗ trợ; 2D và gen3d/spec kiểm riêng; mode thiếu báo sớm |

Tận dụng scripts hiện có: verify-motion-production-runner, production-lock, production, field-repair, read-contract, storyboard, pack-selection, closed-pipeline, closed-pack, ai-recovery, cancellation, editorial-ui; verify-chat-room-lifecycle, chat-submission-recovery; các bộ voice/media/render. Chỉ bổ sung kiểm rủi ro mới, không test chỉ chép implementation hoặc buộc một batch size hardcode.

Mock/fixture không thay nghe/xem. Khi người dùng yêu cầu thử, chốt nguồn/thời lượng/gói/phạm vi, dùng đúng UI/API production, xem hình cùng lời/mốc, nghe mọi vai/câu nghi vấn, kiểm MP4. Kiểm khả năng dài bằng fixture/checkpoint cục bộ trước; không tự chạy 20 phút vì plan có ca video dài.

### Điều kiện chốt

- Từng mã có trạng thái/bằng chứng: đã có, cần sửa, kiểm cục bộ, kiểm dịch vụ thật, nghiệm thu; không đánh đồng.
- Giảm dữ liệu/lượt AI có số đo và giữ/cải thiện độ đúng; việc rõ nghĩa không AI chọn kho/bố cục/đọc lại thừa.
- Giữ accepted qua batch/room/provider/restart; job/hủy/revision/owner đúng.
- Đúng người–nơi–vật–vị trí, giọng rõ/nhịp đúng, timeline/sub/effect và MP4 thật đạt khi có phạm vi nghiệm thu được yêu cầu.
- Đường sai/thừa đã xóa nơi chuyển xong; ngoại lệ có caller/dữ liệu/điều kiện kết thúc; không dọn tùy tiện kho hoặc làm hỏng dự án cũ.

## 9. Đối chiếu bao phủ plan trước

| Mục bản trước | Tương ứng bản chuẩn hóa |
|---|---|
| 1–2: mục tiêu/kiến trúc/danh tính | 1–3, A, I, J |
| 3: giữ đúng/sửa sai | 3–4, B07–B09, C |
| 4/giai đoạn 0–1: inventory/điều phối | A, K, đợt 0–1 |
| 4/giai đoạn 2–3: contract/room | B–D |
| 4/giai đoạn 4: cốt truyện/kho sớm | E, F01–F06 |
| 4/giai đoạn 5: kho/vị trí/nhịp hình | F, H01–H03 |
| 4/giai đoạn 6: giọng/thời lượng | G, H01–H02 |
| 4/giai đoạn 7: render/công bố | I, D08–D09 |
| 4/giai đoạn 8: UI/tùy chọn/2D–3D | H04–H06, J |
| 5–6: dọn/quy chuẩn code | K, bảng mục 6 |
| 7–8: nghiệm thu/thứ tự | Mục 7–8 |
| 9: rút bước/chọn tài nguyên | Hiện trạng mục 2, F, bảng thay/xóa; bỏ mô tả luồng cũ như đang chạy |
| Audit prompt mới | Mục 4, B, C05, D07–D08, E/F/G/H |

**Trạng thái cập nhật:** đã đối ứng code, kiểm cục bộ và đo prompt sau sửa; bảng 82 mã trong báo cáo phân biệt phần đã kiểm, phần mới đạt một phần và phần còn cần nghiệm thu. Không đánh dấu toàn bộ plan hoàn tất và không tự chạy video 20 phút.
