# Rà soát prompt Video Motion — 25/10/2026

## Phạm vi và phương pháp

Audit ban đầu chỉ đọc code và dựng prompt ngoại tuyến. Sau lệnh triển khai, đã sửa code và đo lại bằng cùng dữ liệu lưu; không gọi AI/TTS thật, khởi động backend sản xuất hoặc tạo/tiếp tục video 20 phút. Fixture trình duyệt mới chỉ kết nối localhost.

Đọc đường phân tích nguồn/DNA → phát triển truyện → viết chương → biên tập → chia hình minh họa → READ → chọn/ghép kho → review ảnh → giọng/âm thanh → SEO/thumbnail. Phân biệt nhánh kho đóng hiện hành với nhánh vẽ tự do và các đường cũ còn caller.

Số đo trước và sau dùng dữ liệu đã lưu của production `root-fix-20m-20261025`, không phải một lượt chạy video mới. Đơn vị là độ dài chuỗi JavaScript, không phải byte hoặc token. Mẫu analysis không có `videoDna`; request đầu không đại diện cực đại của mọi dự án.

Chưa cộng wrapper nhận diện request, phục hồi editorial và chỉ thị JSON lúc gửi. Context editorial của mẫu từ khoảng 7.400 còn 1.995 ký tự. Transport thực đã kiểm trần sau khi thêm directive; ảnh không nằm trong số đo text.

Dữ liệu trước: `scratch/motion-prompt-audit-20261025/measurements.json`; sau: `scratch/motion-prompt-after-20261025/measurements.json`. Script tiêm AI giả để bắt prompt rồi hủy, không gửi ra ngoài. Repair một narration là mẫu helper có kiểm soát, không phải log gọi AI thật.

## Kết quả sau đối ứng

| Request/thành phần | Trước | Sau | Ghi chú |
|---|---:|---:|---|
| Chương 1 | 44.922 | 20.090 | Đã chia cụm sự kiện; contract đã đủ thì không gửi lại trích đoạn mẫu |
| Chương 2–8 | 45.876–46.009 | 20.734–20.881 | Mẫu phần đầu, chưa gồm wrapper |
| Repair một narration | 59.211 | 8.497 | Pending + lân cận + hợp đồng, không nguyên task |
| Editor đầu | 34.205 | 10.527 | Nhóm theo prompt và checkpoint beat |
| Storyboard đầu | 16.751 | 16.628 | Giữ đủ boundary/READ; singleton không bị cắt |
| READ đầu | 43.701 | 23.334 | DTO/context gọn; catalog nén lossless |
| Pending READ đã lưu | 43.826 | 24.194 | Không tương đương riêng nhánh field repair; vẫn phải chia tin |
| Catalog READ | 14.528 | 12.679 | Đủ props, mount, type, requirements và mô tả phân biệt |
| Context editorial | khoảng 7.400 | 1.995 | Chỉ hydrate khi cần |
| SEO | 5.068 | 4.918 | Giữ một brief; retime tại máy |
| Source ledger phần đầu | 10.790 | 10.790 | Đọc phần gọn; có tổng hợp phân cấp sau đó nếu tổng vượt budget |
| Repair DNA một path | Không so được mẫu DNA đầy đủ | 2.190 | Không dùng số này đại diện mọi DNA |

Đã bổ sung nhóm async tính cả catalog cho SFX, shortlist casting, manifest storyboard, checkpoint từng item READ/editor/voice/SFX, receipt invalidate khi navigation, budget nội dung không nhân theo route và giữ qua duration round. Ledger tổng hợp có ID coverage/checkpoint; nếu chưa rút gọn hợp lệ thì giữ nguyên ledger và đi transport, không bỏ ý nghĩa để đạt trần.

Chưa xong: budget theo model/output/ảnh, semantic retrieval đủ an toàn để thu hẹp READ, tách global outline/profile khi final payload thật quá lớn, coverage nhu cầu minh họa còn optional và đo latency/chất lượng trên dịch vụ thật. Không hứa mọi prompt dưới 16.000 ký tự hoặc luôn chạy nhanh. Bảng chi tiết 82 mã: [báo cáo triển khai](motion-production-root-fix-implementation-2026-10-25.md#trạng-thái-từng-mã-trong-plan).

Các phần dưới lưu kết luận và đề xuất tại thời điểm audit trước sửa; dùng bảng trên để đọc trạng thái hiện tại.

## Kết luận tại audit ban đầu

1. Cơ chế chia tin hiện tại không giảm độ lớn của nhiệm vụ AI phải trả lời. Prompt trên 24.000 ký tự bị cắt thành các phần 18.000 ký tự, xác nhận từng phần rồi mới yêu cầu ghép và làm toàn bộ.
2. Hai nguyên nhân làm phình rõ nhất là ngữ cảnh/kho lặp lại ở từng nhóm và prompt sửa vẫn mang cả yêu cầu gốc cùng bản nháp đầy đủ.
3. Nhiều bước đã chia theo chương hoặc số dòng, nhưng chưa tính tổng input thực tế và output dự kiến. Cùng 8 hình hoặc 24 beat có thể tạo tải rất khác nhau.
4. Nên chia theo công việc có đầu ra riêng và lưu được kết quả; mỗi nhóm giữ ngữ cảnh nhân quả, nhân vật và quan hệ không gian cần thiết. Không cắt JSON, câu hoặc một quan hệ tương tác thành các phần độc lập.
5. Không nên tăng số lượt AI ở bước đã ngắn hoặc bước code đã giải quyết được. SEO và thumbnail nhìn chung giữ một yêu cầu.
6. Độ dài là một yếu tố gây chậm. Chưa có bằng chứng rằng riêng prompt dài giải thích toàn bộ lỗi `page_unresponsive`; áp lực RAM, trình duyệt, mạng và dịch vụ cũng cần được phân biệt bằng log.

## Số đo trước đối ứng

| Prompt mẫu | Ký tự | Số lượt gửi tối thiểu theo cơ chế chia hiện tại | Nhận xét |
|---|---:|---:|---|
| Đọc phần nguồn đầu để lập sổ sự kiện | 10.790 | 1 | Đã chia nguồn; còn cần giới hạn bản tổng hợp |
| Viết chương 1 | 44.922 | 4 | 3 phần ngữ cảnh và 1 yêu cầu thực thi |
| Viết các chương 2–8 | 45.876–46.009 | 4 mỗi chương | Đã chia chương nhưng phần chung vẫn lớn |
| Sửa một narration bị thiếu trong chương 1 | 59.211 | 5 | Kịch bản thử ngoại tuyến, không phải log sửa thật |
| Biên tập nhóm chương đầu | 34.205 | 3 | Giới hạn nhóm chưa tính đủ dữ liệu prompt |
| Storyboard nhóm đầu | 16.751 | 1 | Mẫu ngắn; giới hạn hiện theo lời và số dòng |
| READ nhóm 8 đơn vị hình đầu | 43.701 | 4 | Có danh mục prop và nhiều lớp kế hoạch |
| READ nhóm pending đầu đã lưu | 43.826 | 4 | Không dùng làm số đo riêng cho nhánh sửa gọn v8 |
| SEO | 5.068 | 1 | Chưa cần chia nhỏ |

“Số lượt tối thiểu” chỉ tính prompt mẫu qua ngưỡng chia, chưa gồm sửa receipt, retry nội dung/dịch vụ, wrapper hoặc khôi phục room. Một request nghiệp vụ có thể tương ứng nhiều lần AI trả lời.

Các thành phần đáng chú ý:

- Tóm tắt khả năng toàn gói cho viết truyện: 16.982 ký tự; bản lọc theo bối cảnh của analysis: 10.265 ký tự.
- Danh mục prop cho READ: 14.528 ký tự, khoảng 33% prompt READ mẫu.
- Hướng dẫn DNA planning + profile: 5.645 ký tự, chưa gồm dữ liệu DNA, nguồn và các hướng dẫn khác.
- Mẫu sửa DNA trong scratch có draft không chứa `videoDna`, vì vậy không dùng số đo đó để kết luận kích thước sửa DNA thật.

## Quyết định chia prompt từ audit ban đầu

| Nhóm | Hiện tại | Cách đối ứng phù hợp | Phần phải giữ cùng nhau |
|---|---|---|---|
| Đọc nguồn dài | Chia phần khoảng 10.000 ký tự; ghép tất cả kết quả, phần lỗi có thể dùng lại nguyên văn | Giữ đọc theo phần, ưu tiên ranh giới sự kiện; schema sự kiện có ID/timestamp, giới hạn phần tóm tắt và tổng hợp phân cấp khi cần | Nguyên nhân, manh mối, hệ quả và nguồn đối chiếu; không làm mất đoạn cuối hoặc twist |
| Phân tích Video DNA | Một yêu cầu chứa nguồn/sổ sự kiện, dàn ý, DNA và profile hình/giọng/khán giả | Có thể tách hiểu cốt truyện/dàn ý được duyệt trước, sau đó hồ sơ thể hiện dựa trên bản cốt truyện gọn; chỉ tách khi tổng ngân sách thực sự lớn | Cốt lõi toàn truyện, trình tự nhân quả, setup/payoff và kết thúc phải là một hợp đồng chung |
| Phát triển truyện mới | Gửi truyện mẫu, kế hoạch cũ, khả năng kho và hợp đồng truyện mới; sửa có thể gửi lại toàn bộ | Tách bản khung truyện toàn cục gọn và chi tiết chương sau khi khóa khung; repair chỉ các trường/chương sai kèm phụ thuộc liên quan | Không phát minh twist hoặc danh tính nhân vật độc lập ở từng nhóm |
| Viết chương | Đã một chương/lượt; vẫn gửi nhiều thông tin toàn cục và khả năng kho | Rút ngữ cảnh thành xương sống truyện, mục tiêu chương, kết chương trước, ràng buộc chương sau, cast/địa điểm và tài nguyên liên quan. Chương quá dài mới chia theo cụm sự kiện có ID | Quỹ thời lượng/từ của chương, manh mối và điểm kết; tránh lặp đoạn nối |
| Sửa chương | Toàn bộ bản nháp + toàn bộ yêu cầu gốc, kể cả lỗi một trường | Chỉ ID/trường lỗi, giá trị nháp liên quan, mục tiêu độ dài và hàng lân cận cần cho nối truyện; code giữ trường đạt | Khi sửa narration phải đồng bộ utterances nguyên văn và speaker; giữ ID/thứ tự/kết chương |
| Biên tập | Tối đa 4 chương hoặc 60.000 ký tự tính trên phần nguồn/mẫu; sau đó mới cộng lời đã viết và ngữ cảnh | Giới hạn theo prompt hoàn chỉnh; sửa theo chương/cụm sự kiện. Kiểm liên tục toàn truyện bằng bản ledger gọn nếu cần | Mạch truyện và các manh mối xuyên chương; không gửi lại mọi đoạn chỉ để sửa vài câu |
| Storyboard | Nhóm theo chương/nơi/thời gian, tối đa 48 dòng/1.100 từ; yêu cầu cả boundary và READ có cấu trúc | Giữ chia ngữ nghĩa, thêm ngân sách JSON/output. Có thể chia nhóm lớn hơn thành các đoạn sự kiện nhỏ. Không mặc định thêm một lượt READ cho mọi hình | Ranh giới câu/từ, độ phủ đủ đúng một lần, cảnh liền trước và trạng thái tiếp nối |
| READ nhân vật/đồ vật | 8 đơn vị/lượt, danh mục prop toàn gói, text + scenePlan + visualUnit + sourcePlans | Giảm nhóm thích ứng, thử khoảng 2–4 hình cho nhóm nặng; lọc ứng viên kho bằng code, loại dữ liệu kế hoạch lặp, vẫn gửi thuộc tính phân biệt và quan hệ cần thiết | A đứng/B nằm, chỗ tựa, người cầm đồ vật, nguồn hiệu ứng và bố cục của cùng một hình phải xét cùng nhau |
| Sửa READ | Đã có nhánh sửa gọn khi mọi mục pending đều có draft; nếu một mục chưa có draft có thể dùng prompt đầy đủ | Giữ nhánh sửa gọn; tách nhóm thiếu toàn row khỏi nhóm chỉ sai trường. Chỉ gửi catalog khi trường đồ vật cần sửa | Trường đã đạt được bảo toàn; `null` xóa rõ ràng, bỏ qua trường không đồng nghĩa xóa |
| Review ảnh | 8 khung/lượt cộng khung trước để so liên tục; nhiều lớp context và ảnh | Nếu bật, chia khoảng 2–4 khung nặng kèm khung trước cần thiết; giới hạn cả text lẫn ảnh; trả chỉ lỗi cần xử lý | Nhân vật/đồ vật trong cùng hình và liên tục giữa hai hình liên quan |
| Chọn giọng | Nếu chưa khóa: toàn danh mục giọng và trích đoạn; lượng trích đoạn ước theo narration | Lọc ứng viên theo vai/tuổi/giới/kênh bằng code rồi chọn trong tập nhỏ; giữ một bảng phân vai nhất quán | Cùng nhân vật phải cùng giọng, phân biệt người kể/thoại; không chọn độc lập từ các mảnh catalog |
| Tách thoại | Các beat đã có utterances đạt được bỏ qua; phần thoại chưa rõ chia tối đa 24 beat | Chia thích ứng, thử 4–8 beat khi nhiều thoại; chỉ gửi người xuất hiện và ngữ cảnh xác định người nói | Lời gốc, người nói, câu dẫn cần thiết; không cắt giữa một cuộc thoại gây mất danh tính |
| Hiệu ứng âm thanh | 14 beat/lượt; catalog đã truy hồi theo nội dung, tối đa 32 asset | Giữ truy hồi có sẵn, chia theo cảnh và ngân sách text khi nhóm nặng; không gửi toàn kho | Âm nền nối cảnh và nguồn phát âm cần đồng bộ |
| SEO YouTube | Brief gọn, mở đầu 3 beat và tóm tắt chương; đã sửa pending bằng ledger | Giữ một yêu cầu; lỗi thì sửa mục/option thiếu. Giới hạn summary đầu vào nếu dự án quá nhiều chương | Tiêu đề, mô tả, hashtag và tag của một phương án cùng định hướng |
| Thumbnail | Brief, hồ sơ hình, tối đa 6 khoảnh khắc và tiêu đề; prompt ảnh kết quả có giới hạn | Giữ một concept/lượt; không tách nhân vật, bối cảnh và chữ thành các yêu cầu độc lập | Chủ thể, bố cục, màu, tiêu đề và quan hệ trong cùng ảnh |

Các số 2–4/4–8 là điểm khởi đầu cho điều chỉnh, không phải mức đảm bảo thành công cho mọi model. Phải quyết định theo dữ liệu thực của nhóm và output dự kiến.

## Các phần không nên tách rời

1. Không chia theo số ký tự giữa JSON, một câu hoặc một yêu cầu ràng buộc. Cơ chế chia tin hiện tại chỉ nên là đường dự phòng khi gửi dữ liệu lớn thực sự không thể phân nhiệm vụ.
2. Không tách “chọn A”, “chọn B”, “chọn ghế” thành ba lần AI không biết nhau. Một hợp đồng hình phải chứa actor, posture, support, ownership, vị trí tương đối và vật thể liên quan. Code sau đó khóa/chọn vị trí từ kho.
3. Không gửi riêng danh sách asset ở các nhóm độc lập rồi chọn kết quả thắng tùy ý. Lọc bằng thuộc tính/semantic có kiểm soát, giữ trường phân biệt. Thiếu ứng viên phải mở rộng phạm vi tìm trong gói hoặc báo thiếu đúng dữ kiện, không thay bằng vật sai.
4. Không dựa hoàn toàn vào trí nhớ của room. Có thể gửi catalog/schema ổn định một lần theo version/hash và xác nhận, nhưng khi đổi/reload room phải phục hồi đúng phiên bản. Request cần ngữ cảnh động tối thiểu đủ để được kiểm tra.
5. Không chia tác vụ ngắn thành quá nhiều lượt; mỗi lượt tăng chi phí chờ, xác nhận, retry và rủi ro lệch kết quả.

## Đường đang chạy và đường cần phân biệt

- Với kho đóng, `pipelinePuppet.ts` gọi `composePuppetPackLines`: code chọn/kiểm/ghép bố cục từ kho. Không có lý do thêm AI chọn vị trí hoặc AI vẽ tài nguyên ở đây.
- Các prompt match, tạo style, vẽ sprite, SVG, set/piece ở nhánh tự do/quản trị kho còn caller; không được tính chúng thành những bước AI chắc chắn đang chạy ở production kho đóng.
- Nếu dùng nhánh tự do, có thể nhóm theo một character/set/prop hoặc vài piece; giữ cùng phong cách và tham chiếu định danh. Không đưa việc tạo mới trở lại đường kho đóng.
- Mẫu số đo là pipeline rối 2D. Không dùng số đo này để chứng nhận mọi prompt/đường dựng 3D tương đương. Phần chung DNA, chương, giọng và SEO vẫn có cùng nguyên tắc chia.

## Thứ tự sửa đề xuất

### P1 — Giảm tải ở các request lặp nhiều nhất

1. Sửa chương và phát triển truyện: bỏ đính kèm cả original task trong repair khi chỉ sai một phần; giữ merge/validator và checkpoint.
2. READ: ngân sách tổng text/output, lọc catalog đúng gói, rút các lớp context trùng; tách missing row khỏi field repair. Giữ bỏ qua READ khi storyboard đã cung cấp read hợp lệ.
3. Viết chương và editor: ngữ cảnh toàn cục gọn, chỉ tài nguyên liên quan; tính giới hạn sau khi dựng prompt đầy đủ.

### P2 — Phân nhiệm vụ lớn ở đầu luồng

4. DNA/phát triển truyện: giữ một khung nhân quả được khóa, tách hồ sơ thể hiện khi vượt ngân sách; tránh lặp phân tích nội dung đã được duyệt ở các bước sau.
5. Giới hạn/chuẩn hóa ledger tổng hợp, lưu ID nguồn và checkpoint từng phần; không để bản tổng hợp phình theo tổng nguyên văn.
6. Storyboard: tính số đơn vị/JSON đầu ra; nhóm theo sự kiện, giữ độ phủ và kiểm liên tục. Không thêm hàng loạt bước AI trùng chức năng.

### P3 — Các bước phụ và phép đo

7. Lọc catalog giọng; điều chỉnh nhóm thoại, âm thanh và review ảnh theo dữ liệu thật. Giữ SEO/thumbnail gọn như hiện có.
8. Ghi log từng logical request và từng tin thực: ký tự/tokens ước tính, context chung/dữ liệu riêng, số item, ảnh, số phần, thời gian receipt và thời gian sinh đáp án, lượt repair, kích thước output. Từ đó biết chậm do gửi nhiều phần hay do dịch vụ/model.

Mục tiêu đề xuất: phần lớn request động nằm trong khoảng 12.000–18.000 ký tự cả wrapper nếu đủ ngữ cảnh; kiểm trần 24.000 theo cơ chế gửi hiện tại. Đây là ngân sách ban đầu để đo lại, không phải giới hạn context của model hoặc cam kết hết lỗi. Không cắt bỏ ý nghĩa chỉ để đạt số ký tự.

## Vị trí code tại audit ban đầu

- `src/server/services/chatUiPlanningService.ts:1146`: chia phần và yêu cầu thực thi sau khi xác nhận.
- `src/constants/cinematicConstants.ts:130`: ngưỡng 24.000 và phần 18.000.
- `src/server/services/motionStoryService.ts:1085`: nguồn/ledger; `:1170`: DNA truyện mới; `:1206`: phát triển truyện; `:1318`: phân tích; `:1389`: editor; `:1602`: model guide; `:1609`: viết chương.
- `src/constants/motionChapterRepair.ts:12`: repair chương kèm nháp đầy đủ và original task.
- `src/lib/motionDnaRepair.ts:4`: sửa DNA kèm toàn DNA và cả planning/profile instructions.
- `src/server/services/puppet/storyboard.ts:75`: chia storyboard và dựng prompt.
- `src/server/services/puppet/director.ts:289`: READ và nhánh sửa gọn.
- `src/server/services/puppet/packCatalog.ts:84`: khả năng viết truyện; `:94`: danh mục READ.
- `src/server/services/puppet/visualContract.ts:40`: line context chứa scenePlan, visualUnit và sourcePlans.
- `src/server/services/puppet/pipelinePuppet.ts:592`: chọn nhánh ghép kho đóng bằng code.
- `src/server/services/puppet/qa.ts:89`: review nhiều khung/ảnh.
- `src/server/services/motionVoiceDirectionService.ts:78`: casting; `:132`: nhóm thoại.
- `src/server/services/puppet/sound.ts:30`, `src/server/services/motionSfxLibraryService.ts:124`: âm thanh và catalog đã truy hồi.
- `src/server/services/motionSeoService.ts:48`, `src/server/services/motionThumbnailService.ts:25`: SEO và thumbnail.

## Trạng thái

Đã triển khai nhiều thay đổi và đo lại ngoại tuyến. Đã kiểm hồi quy fixture/AI giả, chưa đo hiệu năng dịch vụ thật hoặc nghiệm thu video truyện mới; không tạo/resume test 20 phút.
