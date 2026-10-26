# Triển khai sửa gốc Video Motion — 25/10/2026

Trạng thái: đã triển khai các phần bên dưới; nghiệm thu production thật chưa hoàn tất. Không có MP4 20 phút đã nghiệm thu của lượt này. Kế hoạch đầy đủ: [motion-production-root-fix-plan-2026-10-25.md](motion-production-root-fix-plan-2026-10-25.md).

Phạm vi được người dùng chỉnh lại: đối ứng code theo plan, không tạo hoặc tiếp tục video 20 phút. Ghi nhận backend cổng 3002 dừng và production lỗi lúc 17:11 là kiểm tra ở đợt trước, không phải trạng thái được kiểm lại trong đợt này. Các ghi chép thử 20 phút bên dưới là lịch sử.

## Đợt đối ứng sau khi chuẩn hóa plan

- Chia theo sự kiện/câu nguồn và đầu ra, dùng ngân sách prompt cho editor, storyboard, READ, thoại, review và SFX; một item quá dài giữ nguyên qua đường vận chuyển có receipt, không cắt bỏ dữ kiện để đạt số ký tự.
- Sửa chương chỉ gửi mục lỗi/lân cận/hợp đồng; sửa DNA theo path; READ tách hàng thiếu khỏi sửa trường. Bỏ gửi trích đoạn mẫu ở mọi chương khi hợp đồng cốt truyện đã đủ. Giữ nháp và lượt sửa theo ID/dependency; số route AI không nhân ngân sách nội dung.
- Ledger nguồn có tổng hợp phân cấp, ID phần được bao phủ và checkpoint kết quả/lượt từ chối. Sai coverage hoặc hết lượt thì giữ toàn bộ ledger gốc, dùng transport ngoại lệ; không nhận bản rút gọn mất phần cuối. Coverage ID không chứng minh AI đã giữ đúng mọi chi tiết ngữ nghĩa.
- Casting gửi ứng viên phù hợp, bindings đã khóa và tối đa bốn trích đoạn đại diện, mỗi đoạn tối đa 600 ký tự; không gửi danh mục giọng đầy đủ. Tách thoại giữ riêng kết quả từng beat.
- SFX tính nhóm theo prompt có catalog thực, tối đa bốn beat và ranh giới chương/nơi; chỉ đánh dấu mục có kết quả hợp lệ. Hàng bị bỏ sót không còn bị báo hoàn tất; giữ trạng thái và ngân sách riêng, không chặn video chính.
- Storyboard dùng manifest nhóm có hash phụ thuộc, kiểm nhóm chồng/trùng, chuyển offset bản nháp khi nhóm dịch vị trí. Đổi danh tính cast/địa điểm hoặc nhu cầu minh họa làm mất hiệu lực cache liên quan.
- Readiness mở rộng sang nhu cầu minh họa thiết yếu được khai báo: vật/manh mối/thuộc tính, nhiều người ở tư thế khác nhau và chỗ tựa đồng thời. Binding kèm snapshot base/piece đã ghép, truyền vào dựng. Chuẩn hóa ID không làm mất evidence dài hoặc đổi sai chapter/cast/place/owner. Dữ liệu cũ không có khai báo vẫn tương thích nhưng chưa được xem là đã kiểm đủ nhu cầu thiết yếu.
- Giữ ngân sách sửa thời lượng của chương qua các vòng và thay đổi speech rate; chỉ sửa chương gây lệch. Vẫn có tối đa hai vòng duration, không kéo âm để lấp lời thiếu.
- SEO chạy sau script đạt, song song media; timestamp tính tại máy. Đến xuất chỉ đợi hữu hạn 30 giây, giữ nháp SEO và hủy việc tùy chọn còn chờ để nhả browser.
- TTS cục bộ không giữ browser gate. Hủy job vẫn hủy tất cả nhánh nếu ghi log lỗi; lỗi ghi checkpoint không báo thành công. UI theo dõi lại sau reload không tự nối bước; Stop đang chờ được gửi lại đúng job.
- Log backend JSONL có sequence/cursor, UI lấy tiếp trang và hàng phát sinh khi đang fetch; không mất lịch sử chỉ vì hơn 400 dòng. PCM đọc đầy đủ RIFF/chunk/padding, mixer dùng offset data thực, từ chối WAV cụt và cache lệch chữ/mốc.
- Production kho đóng từ chối mode 3D sớm; giữ builder/spec/preview 3D còn caller. Không âm thầm đổi yêu cầu 3D thành 2D.

### Đo lại prompt ngoại tuyến

| Mẫu cùng đầu vào đã lưu | Trước | Sau |
|---|---:|---:|
| Chương 1 | 44.922 | 20.090 |
| Chương 2–8 | 45.876–46.009 | 20.734–20.881 |
| Sửa một narration | 59.211 | 8.497 |
| Editor nhóm đầu | 34.205 | 10.527 |
| READ nhóm đầu | 43.701 | 23.334 |
| Catalog READ | 14.528 | 12.679 |
| Ngữ cảnh phục hồi editorial | khoảng 7.400 | 1.995 |
| SEO | 5.068 | 4.918 |

Đơn vị là ký tự JavaScript; chưa cộng mọi wrapper/directive/ảnh, mẫu không có DNA đầy đủ. Pending READ mẫu vẫn 24.194 ký tự, phải vận chuyển nhiều tin; không tuyên bố tất cả request đã dưới 16.000 hoặc nhanh hơn theo một tỷ lệ cố định. Dữ liệu: `scratch/motion-prompt-after-20261025/measurements.json`.

### Bằng chứng kiểm cục bộ

Các script dưới đây dùng fixture/AI giả lập; kiểm voice dùng PCM tổng hợp và dependency TTS/ASR giả. Không tạo video truyện hoặc tiếp tục production cũ. Media validation tạo các tệp màu/âm sine 2–6 giây để kiểm codec/audio/crash, không đi qua luồng tạo truyện.

| Script | Nội dung đã kiểm |
|---|---|
| `verify-motion-prompt-resume.ts` | Item dài không cắt; nhóm async tính cả catalog; READ mixed/subset/legacy budget; chia chương creative/factual; editor/voice/SFX giữ accepted; storyboard dependency/migration; ledger coverage/fallback/resume; duration không reset budget |
| `verify-motion-persistence-integrity.ts` | 1.004 dòng log qua restart/phân trang, snapshot hỏng, lỗi ghi đầu/giữa, hủy mọi job khi log lỗi, PCM chunk/truncation, cache text/timeline và gate script/3D |
| `verify-motion-plan-readiness.ts` | Hai gói, A đứng/B nằm/bát cháo, snapshot tài nguyên, evidence sai/vật thiếu/support thiếu bị từ chối, chuẩn hóa ID giữ evidence dài |
| `verify-motion-story-craft.ts`, `verify-motion-storyboard.ts` | Hợp đồng truyện, repair/chương/độ phủ; hình giữ qua câu/beat và cue, ảnh tĩnh renderer thật |
| `verify-motion-closed-pipeline.ts` | Hai gói, đứng–nằm/ghế/đồ vật, thiếu kho, review bật/tắt, resume không gọi AI lại khi dữ liệu đủ, không thêm tài nguyên kho |
| `verify-chat-room-lifecycle.ts` | Chrome headless chỉ localhost: ba composer độc lập, chat tiếp, reload hai lần cùng URL; prompt 23.999 ký tự cộng directive vượt trần, receipt dùng lại trong room và mất hiệu lực sau reload |
| `verify-motion-ai-recovery.ts` | Provider/khóa AI, lỗi nội dung khác dịch vụ, budget không nhân route, cùng phiên cho READ |
| `verify-motion-cancellation.ts`, `verify-motion-production-runner.ts` | Stop/reload, không auto-chain, fetch log đang chờ, production song song/tiếp tục/idempotency/optional SEO/fencing |
| `verify-motion-voice-quality.ts` | Giữ âm đầu/cuối nhỏ, silence/retry, pause/cache REVIEW, không tin word timing không chắc chắn; không chứng nhận chất giọng bằng tai |
| `verify-motion-atomic-writes.ts`, `verify-motion-media-validation.ts` | EPERM hữu hạn giữ file cũ; giải mã MP4, thiếu tiếng/file cụt/kích thước/thời lượng sai; công bố qua crash trước/sau rename và phục hồi lặp |

Fixture room ban đầu dùng timeout click 1 giây và lỗi actionability trên tab nền. Đã đổi riêng fixture sang 5 giây (production vẫn 30 giây), giữ kiểm deadlock 15 giây; không tăng timeout production. Mock SFX cũ trả `beats:[]` đã sửa thành các hàng silence hợp lệ để ca “resume đủ dữ liệu không gọi AI” đúng contract. Ca riêng vẫn kiểm hàng thiếu không bị đánh dấu đạt.

## Trạng thái từng mã trong plan

**Cục bộ**: phần đối ứng nêu ở cột bằng chứng có code và kiểm cục bộ. **Một phần**: còn việc được ghi cụ thể. **Cần nghiệm thu**: có cơ chế/code từ đợt này hoặc đợt trước, cần xem/nghe/dịch vụ thật theo phạm vi được yêu cầu. Không có trạng thái nào là chứng nhận mọi video thật sẽ đạt.

| Mã | Trạng thái | Bằng chứng hoặc phần còn thiếu |
|---|---|---|
| A01 | Một phần | Bảng keep/replace/remove bên dưới; chưa chứng minh mọi route/caller động đã rà hết |
| A02 | Một phần | Production/job/input hash và fencing có kiểm; revision cho mọi thao tác sửa riêng chưa đồng nhất |
| A03 | Cục bộ | Actions dùng chung, backend điều phối, reload không auto-chain; runner/cancellation |
| A04 | Cục bộ | Checkpoint lỗi không thành công; corruption/EPERM/late owner/cancel; persistence/atomic/runner |
| A05 | Cục bộ | Chờ dịch vụ có budget, Stop bền, UI chỉ theo dõi; recovery/cancellation |
| A06 | Một phần | Deep clone/hash, adapter draft và dependency; chưa đủ ma trận mọi bản dự án cũ |
| B01 | Một phần | Đo prompt/response/receipt; chưa có đo token/output/ảnh và latency đủ mọi artifact |
| B02 | Một phần | Helper ngân sách và trần transport sau JSON directive; chưa có budget riêng mọi provider/model |
| B03 | Cục bộ | DTO chương/READ/editor/voice/SEO; bỏ context và original task thừa trong repair |
| B04 | Một phần | Contract/cốt truyện, ledger phân cấp và context gọn; fallback giữ nguyên nguồn vẫn có thể dài |
| B05 | Một phần | Catalog READ nén lossless, casting/SFX lọc; chưa có semantic retrieval/expansion đủ an toàn để thu hẹp READ |
| B06 | Cục bộ | Nhóm sự kiện/câu/READ/editor/thoại/review/SFX theo prompt, giữ một hình đồng thời |
| B07 | Một phần | READ/voice/editor từng item, storyboard manifest/migration; chưa đủ mọi thay đổi phân hoạch chapter/legacy |
| B08 | Cục bộ | Repair DNA/chương/truyện/READ theo pending/path, giữ null/omission; prompt-resume/field repair |
| B09 | Cục bộ | Receipt theo hash/page, navigation invalidate; fixture kiểm directive vượt ngưỡng và reload |
| B10 | Một phần | Đã đo trước/sau cùng input; chưa đo latency/chất lượng dịch vụ thật |
| C01 | Cục bộ | Contract/identity/target/ID, parse rồi validate; recovery/field repair |
| C02 | Cục bộ | Accepted/draft được checkpoint trước khi nhóm xong; mixed READ/resume |
| C03 | Cục bộ | Khóa path/ID/mục đạt, array theo identity; field repair/prompt-resume |
| C04 | Một phần | Coverage/utterances/support/owner có kiểm; chưa chứng minh mọi lan truyền state đến hội tụ |
| C05 | Cục bộ | Bỏ nhân route, giữ budget qua READ subset/legacy và duration rate/round; recovery/prompt-resume |
| C06 | Cục bộ | Phục hồi container có bằng chứng, không điền phần nội dung cụt, vẫn kiểm identity |
| C07 | Một phần | Dùng contract/ledger chung; còn cơ chế riêng có caller cần kiểm trước dọn thêm |
| D01 | Cục bộ | Editorial chung phiên, worker riêng; fixture ba room không đợi kết quả nhau |
| D02 | Cục bộ | Content/service/readiness/CAPTCHA phân biệt; recovery |
| D03 | Cục bộ | Phục hồi hữu hạn, checkpoint service wait/budget; runner/recovery |
| D04 | Cần nghiệm thu | Readiness/model picker có hồi quy và bằng chứng UI lịch sử; chưa gọi lại provider thật đợt này |
| D05 | Cục bộ | Provider/model lock và thứ tự fallback; AI recovery |
| D06 | Cần nghiệm thu | Cơ chế năm tiếng/chờ CAPTCHA còn; cần kiểm âm thanh thông báo trên máy người dùng |
| D07 | Cục bộ | Receipt gắn page/hash, invalidate navigation/close; headless fixture đã qua |
| D08 | Cục bộ | SEO sau script, chạy trong lúc media, chờ hữu hạn rồi nhả room; runner |
| D09 | Một phần | Local TTS bỏ browser lease; còn kiểm browser/render lease khi nhiều production thật đồng thời |
| E01 | Một phần | Đọc phần/cache/ledger phân cấp, ID coverage và fallback nguyên vẹn; chưa chứng minh tóm tắt giữ mọi sự kiện về nghĩa |
| E02 | Một phần | sourceCore/spine/causal/clue contract khóa; global outline/profile lớn vẫn có thể phải dùng transport |
| E03 | Một phần | illustrationNeeds có schema/evidence/kiểm kho; legacy hoặc AI không khai báo chưa có coverage đầy đủ |
| E04 | Cục bộ | Chương lớn chia sự kiện/factual sentence theo thứ tự, quỹ từ/thời lượng, child draft |
| E05 | Cục bộ | Repair beat/path, giữ mục đạt và đồng bộ utterances; prompt-resume/craft |
| E06 | Cục bộ | Editor nhóm nhỏ theo prompt, checkpoint beat, lỗi optional không bỏ script gate |
| E07 | Cục bộ | Chặn chapter thiếu/pending con/ID trùng/không đủ lời; production/persistence |
| F01 | Một phần | Semantic metadata và binding có kiểu; seed/import/migration chưa dùng chung schema đầy đủ |
| F02 | Một phần | Audit ID/hình/near-duplicate lịch sử; chưa xem đủ biến thể để gộp an toàn |
| F03 | Cần nghiệm thu | Giữ mẫu/chibi chân sát người; hồi quy geometry không thay đối chiếu mỹ thuật từng ảnh |
| F04 | Một phần | Nhu cầu khai báo kiểm vật/thuộc tính/support đồng thời, snapshot truyền sang dựng; chưa đủ nhu cầu bị bỏ khai báo |
| F05 | Một phần | Fit có kiểu/thuộc tính và alias được hỗ trợ; chưa có từ điển ngữ nghĩa bao phủ mọi vật Việt/Anh |
| F06 | Một phần | Ghép base/piece, minh họa tĩnh và repair bounded; thiếu cốt lõi chưa tự sửa kế hoạch sáng tác có kiểm trước khóa |
| F07 | Cục bộ | Một storyboard/read hợp lệ, bỏ lượt READ trùng, coverage tại máy; storyboard/closed pipeline |
| F08 | Cục bộ | READ nhỏ, missing row riêng field repair, giữ budget; read-contract/prompt-resume |
| F09 | Cục bộ | Compose/rank/geometry cục bộ, chữ ký selection/binding; closed pipeline/pack selection |
| F10 | Một phần | Hash phụ thuộc cast/place/line và fixture continuity; chưa đủ ma trận owner/state lan đến hội tụ |
| F11 | Cần nghiệm thu | Mouth/effect/nhịp hình có guard và hồi quy; cần xem hình cùng lời của bản truyện thật |
| F12 | Cục bộ | Review flag, nhóm tối đa bốn, tắt vẫn local validate; closed pipeline |
| G01 | Cục bộ | Một owner voice, TTS local không browser gate; runner/voice fixture |
| G02 | Cục bộ | Vai khóa bỏ casting, shortlist khi thiếu, thoại checkpoint giữ chữ/người; prompt-resume |
| G03 | Cần nghiệm thu | Profile Thần trùng được giữ; cần nghe đối chiếu mọi vai, không dùng fixture để chứng nhận giống giọng |
| G04 | Cần nghiệm thu | Filter/pacing cho mọi vai, giữ phụ âm/âm nhỏ; voice quality qua, cần nghe thực |
| G05 | Cục bộ | RIFF/PCM đầy đủ, offset data thực, cache text/mốc, trạng thái quality; persistence/voice quality |
| G06 | Cục bộ | Clip key/phụ thuộc/quality và giữ cache không đổi; voice quality |
| G07 | Cục bộ | Chọn chương lệch theo tiếng thật, state sửa duration giữ qua rate/round; production/prompt-resume |
| G08 | Một phần | Ngưỡng 15%/hai vòng hiện hành chưa được nghiệm thu theo mong muốn tốc độ cuối |
| H01 | Cục bộ | Timeline từ clip thật, retime storyboard/SEO; closed pipeline/runner |
| H02 | Cần nghiệm thu | Sub không nền/chớp, speechRanges khi tắt sub; cần xem cue/sub trên video truyện thật |
| H03 | Cần nghiệm thu | Camera chậm/bỏ shake có code và fixture; chưa nghiệm thu độ dễ chịu đầu ra mới |
| H04 | Cục bộ | SFX riêng trạng thái/accepted/budget, nhóm theo catalog thực; optional không mất track lời |
| H05 | Cục bộ | SEO brief/field repair, chạy sau script, timestamp tính cục bộ; SEO/runner |
| H06 | Cần nghiệm thu | Thumbnail optional có guard/caller; chưa tạo ảnh mới đợt này |
| I01 | Cục bộ | Preflight nguồn/kho/quyền ghi/đĩa/voice/tools; runner/persistence |
| I02 | Một phần | Handoff và SEO bounded đã sửa; còn ma trận nhiều production dùng browser thật |
| I03 | Cần nghiệm thu | Cache render/probe/GPU–CPU có code; chưa chạy renderer production dài đợt này |
| I04 | Cục bộ | Audio bắt buộc/signature/mux; thiếu tiếng không công bố; media validation |
| I05 | Cục bộ | ffprobe/giải mã/kích thước/duration/audio/file cụt, black/silence theo speechRanges |
| I06 | Cục bộ | Manifest idempotent qua crash trước/sau rename và repeated recovery; media validation |
| J01 | Cục bộ | Reload không submit/auto-chain, Stop đúng job, queue log/cancellation/runner |
| J02 | Cục bộ | JSONL/cursor, 1.004 dòng/restart, hàng phát sinh trong fetch và legacy log giữ nguyên |
| J03 | Một phần | Diagnostic request/response và badge gọn; chưa có toàn bộ chỉ số budget/receipt trên UI |
| J04 | Cần nghiệm thu | Snapshot settings/review/mode có code; cần kiểm đầy đủ màn hình với dữ liệu thật |
| J05 | Cục bộ | Production báo sớm mode 3D chưa hỗ trợ, giữ standalone 3D còn caller; chưa chứng nhận production 3D |
| K01 | Một phần | Bảng giữ/xóa theo caller bên dưới; không kết luận mọi export động đã chết |
| K02 | Cục bộ | Chuyển caller rồi dọn constants/nhánh đã thay, không thêm service V2 |
| K03 | Cục bộ | Giữ bỏ AI choiceId/dịch kho/READ đủ; kiểm closed pipeline |
| K04 | Cục bộ | Helpers theo miền prompt/ledger/repair/checkpoint/PCM/log; text/prompt constants |
| K05 | Cục bộ | Format phạm vi sửa width 400/CRLF, không thêm comment code sản phẩm, giữ diff có sẵn |
| K06 | Một phần | Tách source/cache/output, không xóa tài nguyên người dùng; chưa dọn asset trùng thiếu bằng chứng |

Các mục “Một phần” là việc còn mở, không được xem là đã hoàn tất vì đã có một ca test. Ngoài nghiệm thu dịch vụ/hình/giọng, ưu tiên tiếp là semantic schema kho chung, coverage nhu cầu thiết yếu, repair kế hoạch sáng tác theo kho trước khóa, budget theo model và ma trận revision/lease đa dự án.

## Các phần đã triển khai

| Phần | Thay đổi và giới hạn |
|---|---|
| Danh tính công việc | SCENES/VOICE phân biệt theo production/session, loại việc và hash toàn đầu vào; bỏ ghép việc bằng editorial ID rỗng. |
| Điều phối | `motionProductionService.ts` sở hữu toàn lượt. UI gửi lệnh, theo dõi hoặc tiếp tục; reload UI không nối lại chuỗi cũ. Cấu hình gốc được sao chép sâu, khóa hash; không dùng chung tham chiếu với kết quả. |
| Lưu và hủy | Checkpoint nguyên tử, token/PID sở hữu, chặn ghi từ chủ cũ. Lượt đã hủy không tự chạy lại. Bản lưu sai hash trả lỗi phục hồi kèm kết quả/log còn đọc được, không biến thành 404 và không bị yêu cầu mới ghi đè. |
| Công việc độc lập | Hình và giọng chạy song song sau khi đủ kịch bản. Lỗi đầu tiên được giữ làm nguyên nhân chính, không bị lỗi hủy của nhánh kia che đi. SEO tùy chọn không chặn video chính. |
| Sửa nội dung | Dùng ledger khóa trường đạt, sửa trường sai theo ID. Chương, storyboard, READ, DNA, truyện mới/retune DNA và SEO lưu nháp cùng ngân sách sửa; các đoạn ledger nguồn có cache theo phụ thuộc. Task draft được cách ly theo production, loại việc và hash đầu vào; file hỏng được giữ và trả lỗi. READ giữ số nhóm nguồn khi phục hồi chỉ còn một tập con. Lỗi dịch vụ không tiêu lượt sửa nội dung. |
| Room | DNA/kịch bản/SEO giữ phiên biên tập; worker cảnh có phòng độc lập. Nội dung sai không reset room. Lỗi dịch vụ phục hồi đúng room hai lần rồi mới thay. Giữ Chrome đang hiện khi yêu cầu sau có tùy chọn headless, tránh phá tab vừa xác minh. Tôn trọng khóa provider. Production giữ bước bị lỗi dịch vụ tạm thời, chờ 10 phút rồi thử tiếp tối đa hai lần; lưu thời điểm và số lượt qua restart, không hủy nhánh song song đã chạy đúng. |
| Giảm bước | Kho đóng bỏ dịch toàn bộ hồ sơ trước dựng, AI ghép nhân vật, AI chọn bối cảnh, AI chọn `choiceId`, bảng ảnh các phương án và lượt READ trùng khi kế hoạch minh họa đã đủ dữ liệu. |
| Kho và vị trí | Code lọc đúng gói, tuổi/giới/vai, loại địa điểm, điểm đỡ, chủ vật và hình học; xếp hạng bố cục hợp lệ theo tính liên tục. Gate trước viết dài kiểm cast/place và vật/support đồng thời được khai báo trong illustrationNeeds, giữ snapshot/binding. Chưa bảo đảm mọi nhu cầu đều được khai báo. Tắt review không bỏ kiểm tại máy; chỉ ghép base/piece có sẵn. |
| Thuộc tính vật | Cụm từ gốc như “chỉ đen”, “khăn trắng”, “gỗ”, “tre”, “sắt” được dùng để kiểm mẫu đã chọn ngay cả khi AI quên requirements. Không suy diễn “đồng tiền” thành vật bằng đồng. Đây là tập thuộc tính hỗ trợ, không phải bộ hiểu mọi danh từ tiếng Việt. |
| Thời lượng/giọng | Cache clip theo phụ thuộc và chất lượng; chốt timeline từ giọng thực, không yêu cầu hoàn tất hình chỉ để tạo tiếng. Nếu lệch mục tiêu quá 15%, tối đa hai vòng sửa riêng phần văn bản cần thiết theo tốc độ đo được, dùng lại hình/clip không đổi. Kiểm sửa gián đoạn/tiếp tục đã có; chưa nghiệm thu nghe và thời lượng bản 20 phút. |
| Render/công bố | Kiểm FFmpeg, audio, clip/đoạn cache; kiểm MP4 bằng ffprobe và giải mã thật. Đối chiếu khoảng đen với fade/dip và khoảng im lặng với thời gian clip giọng thực, kể cả tắt sub; giữ khoảng nghỉ kể chuyện hợp lệ. Manifest công bố giữ kết quả khi ngắt trước/sau đổi tên file, phục hồi metadata idempotent trước khi khôi phục production. Thiếu audio bắt buộc/file hỏng không được công bố đạt. |

## Migration tài nguyên cũ

`scripts/migrate-motion-resource-semantics.ts` kiểm 2.133 hồ sơ thuộc hai gói, thêm `locationFamily` và `semanticVersion` cho bối cảnh/base phân loại được. Ưu tiên trường có kiểu, tên và nhóm chính trước chi tiết phụ trong mô tả. Bản gốc được sao lưu tại `scratch/motion-semantic-migration-20261025/backup`.

- Không trùng ID; chưa xóa tài nguyên.
- Có 9 nhóm giống hình theo dấu vân tay dữ liệu hình và 402 nhóm biến thể gần nghĩa. Đây là ứng viên đối chiếu, không đủ bằng chứng xóa hay gộp vai.
- Còn 4 base chung: hai phòng trống và hai nền cỏ trước đồi. Giữ khả năng ghép của nền chung; không ép chúng thành phòng ngủ hay vách núi để đạt đủ số phân loại.
- Chạy lại migration không cần đổi hồ sơ đã đạt. Khi seed/import tài nguyên mới cần chạy migration/audit; nguồn seed chưa cùng dùng một schema semantic hoàn chỉnh cho mọi loại vật.

Không đánh đồng kiểm schema/geometry với việc mọi ảnh đã được xem và duyệt mỹ thuật. Bộ hồi quy chọn kho đã render 8 ảnh cho hai gói; pipeline hai gói có kiểm đứng–nằm, ghế cạnh giường, đồ vật, review bật/tắt và không ghi thêm kho.

Gate của truyện thật phát hiện kho chưa có nhà sư cao tuổi đúng hồ sơ. Đã thêm sáu biến thể qua công cụ quản trị seed: nhà sư, thầy pháp và bà đồng cao tuổi cho mỗi gói. Render thật và xem bảng sáu nhân vật với tư thế đứng/ngồi/quỳ/nằm trước khi cài, giữ nguyên tài nguyên cũ. Dữ liệu nguồn: `python_scripts/kit_seed/character_variants.json`; công cụ cài idempotent: `install_character_variants.py`; ảnh kiểm: `scratch/motion-character-variants-20261025/review.jpg`. Sản xuất tiếp tục chỉ chọn kho, không sinh nhân vật theo tên truyện.

## Dọn code và đường gọi còn giữ

| Code/đường gọi | Quyết định | Bằng chứng/kiểm bảo vệ |
|---|---|---|
| Điều phối từng bước trong UI | Thay bằng lệnh production và polling; giữ thao tác sửa riêng có chủ ý | `verify-motion-production-runner.ts`, `verify-motion-editorial-ui.ts` |
| Logic controller phân tích/viết/dựng/giọng/compile/render | Đưa về `motionProductionActions.ts`, controller/API và runner dùng chung | `verify-motion-production.ts`, runner |
| AI chọn mã bố cục và render bảng phương án trong `packSceneChoices.ts` | Bỏ khỏi đường production; code tạo/kiểm/rank/khóa | `verify-motion-pack-selection.ts`: không có lượt AI chọn, không gửi ảnh, vị trí qua compile không đổi |
| Hằng số lựa chọn/retry/contact sheet không còn dùng | Xóa 20 hằng số sau kiểm import và truy cập thuộc tính; bỏ thêm CONTRACT_REPLACE và CATALOG_LIMIT khi không còn caller | Typecheck và hồi quy chọn kho |
| `motionPack.STORY_SCHEMA` cũ | Xóa; dùng schema tóm tắt đang có caller | Tìm nơi dùng và typecheck |
| Dịch hồ sơ trong pipeline kho đóng | Bỏ gọi ở nhánh đóng; giữ `assetProfiles.ts` cho nhánh tự do còn dùng | `verify-motion-asset-catalog.ts`, closed pipeline |
| CAST_MATCH/LIB_MATCH trong nhánh đóng | Thay chọn cục bộ; giữ hỗ trợ nhánh ngoài gói | Kiểm caller `kitDraw.ts`, closed pipeline |
| Đọc lại kế hoạch minh họa hoàn chỉnh | Bỏ lượt READ thừa; giữ validator và repair cho mục chưa đạt | `verify-motion-field-repair.ts`, read contract |
| `resetMotionAiRoom` khi sửa DNA/voice direction | Gỡ nơi gọi do lỗi nội dung; giữ API còn phục vụ phục hồi thật | `verify-motion-ai-recovery.ts` |
| Hàm vẽ SVG, tạo style, sprite và quản trị kho | Giữ caller ngoài production kho đóng; bị guard chặn trong scope đóng | `verify-motion-closed-pipeline.ts`, AI recovery |
| `choiceId`, provenance AI lịch sử và snapshot cũ | Giữ định danh/tương thích dữ liệu; nguồn mới là deterministic | selection contract và kiểm snapshot |

Chưa có bằng chứng để xóa mọi export/route cũ. Việc ít import không tự chứng minh route hoặc dữ liệu dự án cũ không còn được sử dụng. Không reset Git, xóa ảnh hoặc gộp ID để làm nhỏ diff.

## Lịch sử chạy thật trước lệnh cấm test 20 phút

Lượt `root-fix-20m-20261025`, truyện “Khói Trầm Đổi Tên”, mục tiêu 1.200 giây, 8 chương/166 beat. Review ảnh tắt, khóa Gemini Flash Low, tạo giọng thật bằng VieNeu.

Sau người dùng xác minh CAPTCHA, lượt đã tiếp tục. Hai đợt kế tiếp dừng bởi Gemini `1095`/`chat_planning_provider_error_response`; một đợt có lỗi `gemini_model_ui_not_ready`. Lượt sau giữ được 39/52 nhóm storyboard, 146 đơn vị hình; đây chưa phải khung hình đã ghép và nghiệm thu. Giọng chưa có track cuối; không có MP4 hoàn chỉnh. Chi tiết: `scratch/thantrung-voice-20261025/backend-root-fix-v2*.log`, checkpoint production và AI-debug.

Cập nhật sau đó: v3 đã kiểm được cơ chế chờ dịch vụ thật 10 phút (15:56–16:06), tiếp tục nhóm còn thiếu trong khi giọng vẫn chạy. Lúc 16:10 và v4 lúc 16:20, Gemini trả JSON thiếu dấu đóng object ở cùng mục sửa boundary. Bản sửa phân loại lỗi này thành sửa nội dung trong cùng room đã được kiểm thật; ba phản hồi vẫn hỏng cú pháp nên chưa đạt nhóm. Đã bổ sung phục hồi chỉ dấu đóng container khi một dấu đóng bên ngoài chứng minh được container bên trong còn thiếu; không thêm nội dung hoặc hoàn tất phản hồi bị cắt cuối. Kết quả phục hồi bắt buộc khớp cả artifactType/requestId rồi vẫn qua ledger/validator.

Đối chiếu phản hồi thật `motion-puppet-storyboard-c40d82b9` với nháp, chỉ áp dụng trường `from` đang lỗi và kiểm lại toàn bộ kế hoạch: 52 nhóm/171 hình minh họa cho 188 câu nguồn đã đạt độ phủ, không gửi thêm yêu cầu AI hoặc đặt lại ngân sách. Bản lưu trước phục hồi giữ tại `scratch/thantrung-voice-20261025/production-before-json-container-recovery.json`; hash cấu hình gốc không đổi. Đây là kế hoạch hình, chưa phải 171 khung render đã duyệt. Backend v5 nạp xử lý cú pháp mới để tiếp tục dựng và giọng.

Trong lượt READ, ảnh/DOM của hai room mới cho thấy Gemini dùng `rich-textarea.simplified-input`: có textbox sửa được nhưng nút model chưa xuất hiện. Code cũ đợi nút model và hết thời gian dù không phải CAPTCHA. Đã sửa mở đúng textbox thu gọn một lần, sau đó vẫn chờ ổn định và kiểm model/thinking level. Kiểm trực tiếp trang Gemini thật trả `ready=true`, model `Flash`, prompt còn trống; hồi quy picker low/medium/high và ba room qua (`gemini-live-ready.log`, `gemini-collapsed-ui-final2.log`).

V5 dừng lúc 16:29 bởi `EPERM` khi đổi tên checkpoint, nguyên nhân cụ thể là Windows từ chối thao tác thay file; chưa chứng minh tiến trình nào giữ file. `writeMotionJsonAtomic` nay dùng tên tạm duy nhất và retry hữu hạn 510 ms tổng chờ cho EPERM/EACCES/EBUSY, không xóa file đích trước. Lỗi dai dẳng vẫn báo, giữ bản cũ và payload tạm. Hồi quy kiểm thành công sau hai lỗi tạm, dừng đúng ngân sách, bảo toàn file cũ và không retry ENOENT (`atomic-writes.log`). Backend v6 nạp cả hai bản sửa rồi tiếp tục lượt cũ.

V6 đã gửi cùng lúc ba yêu cầu READ lúc 16:34:13. Lượt dừng lúc 16:42:31 vì một xác nhận phần ngữ cảnh sai số: ID có đuôi `_context_2` nhưng yêu cầu `receivedPart=3`, Gemini trả 2. Đã thống nhất ID phần và số phần đều bắt đầu từ 1; sai receipt được hỏi sửa riêng tối đa hai lần trong room, không gửi lại phần nguồn/kho và không thực thi trước khi xác nhận đủ. Lỗi dịch vụ vẫn được đưa về cơ chế phục hồi dịch vụ, không bị coi là receipt sai. Hồi quy: `context-receipt.log`.

Đã bỏ gửi toàn bộ diễn biến truyện vào mỗi nhóm READ: giữ đoạn liền trước và đầy đủ lời/plan của nhóm đang xử lý. Nhánh kho đóng dùng một danh mục prop có cấu trúc, bỏ phần mô tả boilerplate giống nhau và bảng khả năng trùng. Không bỏ mã prop, mount, type hoặc requirements; mô tả chỉ rút về key khi hai bản có cùng nghĩa sau chuẩn hóa chữ. Prompt nhóm đầu của lượt thật đo được 43.343 ký tự, còn phải chia phần; không tuyên bố mọi prompt đã dưới giới hạn một tin nhắn. Kiểm READ bảo vệ trường đạt, subset resume, ngữ cảnh không tăng theo 200 beat ở xa, danh mục đủ props và không ghi kho đã qua. Backend v7 nạp phần rút gọn và sửa receipt để tiếp tục.

V7 đã lưu 31/171 READ. Một mục vị trí bị giữ lỗi vì AI trả lại row nhưng bỏ trường `placement` thay vì trả `null`; cơ chế merge đúng thiết kế giữ trường bị bỏ qua. Yêu cầu sửa trước đó vẫn kèm danh mục kho và toàn bộ hướng dẫn, gây nhiều tin ngữ cảnh cho một trường sai. V8 tách prompt sửa riêng: có draft, allowedFields và lỗi cụ thể, nhắc rõ bỏ qua không xóa giá trị; chỉ kèm danh mục prop khi trường đồ vật cần sửa. Các row thiếu toàn bộ vẫn dùng schema đầy đủ. Không đổi validator, không đặt lại ngân sách hoặc xóa trường sai thay AI. Hồi quy READ và TypeScript đã qua (`read-compact-repair.log`, `tsc-read-repair.log`). Đã dừng qua API rồi khởi động backend v8 để tiếp tục cùng production, giữ cache giọng và dữ liệu đạt.

Đợt này cũng gặp `chat_planning_page_unresponsive` và readiness khi tab tải lại. CDP xác nhận vẫn chỉ có ba room Gemini; máy có thời điểm còn khoảng 500 MB RAM trống. Đây là dấu hiệu áp lực tài nguyên, chưa phải bằng chứng kết luận thủ phạm cụ thể. Không tăng timeout vô hạn hoặc đóng ứng dụng khác của người dùng để che lỗi.

Lỗi bản lưu mất hash đã tái hiện và sửa: thay hồ sơ giọng trong kết quả làm đổi `input.script.voiceChannel` do chung tham chiếu. Bản đầu vào được phục hồi bằng đối chiếu hash với yêu cầu gốc, sao lưu trước sửa, giữ nguyên kết quả. Không tính lại hash để che thay đổi không rõ nguồn.

Các mục bắt buộc còn phải hoàn thiện/kiểm:

1. Chưa nghiệm thu đầu ra hoàn chỉnh: cần xem hình kèm lời, nghe đoạn đại diện và câu nghi vấn. Kiểm thử giả lập không thay được bước này. Không tự chạy video 20 phút; phạm vi chạy thử phải theo yêu cầu mới của người dùng.
2. Nghiệm thu gián đoạn/tiếp tục trên dịch vụ thật cho DNA/READ/SEO đã bổ sung checkpoint; hồi quy cục bộ về giữ trường đạt, ngân sách, cách ly đầu vào và file hỏng đã qua.
3. Gate có cấu trúc đã mở rộng sang vật/manh mối/support khai báo; còn thiếu cơ chế bảo đảm coverage của khai báo ở mọi nguồn/dữ liệu cũ và repair kế hoạch sáng tác sớm có kiểm.
4. Mở rộng phân loại lỗi dịch vụ ngoài tập mã đã nhận diện và nghiệm thu thực cơ chế chờ. Đã có chờ 10 phút/tối đa hai lần theo bước, checkpoint ngân sách, giữ nhánh song song, kiểm hủy/tiếp tục và dừng khi hết ngân sách; không gọi lỗi hết ngân sách là thành công.
5. Production kho rối 2D đã chặn mode 3D không hỗ trợ sớm; standalone gen3d/spec giữ riêng. Chưa xác nhận một luồng production 3D đầy đủ.
6. Tiếp tục audit near-duplicate, semantic ID/thuộc tính của mọi loại đồ vật và mỹ thuật ảnh thật. Kiểm black/silence theo chủ ý đã triển khai, có fixture MP4/FFmpeg thật, vẫn cần nghiệm thu trên bản xuất cuối.

Các phần này vẫn thuộc kế hoạch được ủy quyền; báo cáo không đánh dấu toàn bộ kế hoạch hoàn tất hoặc hứa dịch vụ ngoài luôn trả kết quả.
