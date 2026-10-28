# Video Motion — ghi nhận phân tích và kế hoạch chuẩn bị code

Ngày ghi nhận: 18/10/2026, Asia/Saigon. Mốc mã nguồn: `1dc90c0`.

Trạng thái: tài liệu chuẩn bị triển khai. Chưa sửa mã ứng dụng theo các đề xuất trong cuộc trao đổi. Các thống kê kho và kết quả kiểm tra dưới đây là snapshot tại workspace `D:/video-AI-vidify`, không đại diện cho mọi data directory của bản app đóng gói.

Đã rà soát lại sau quyết định Claude retry thêm 2 lần rồi quay ChatGPT và yêu cầu voice đọc theo tâm trạng phân cảnh. Khi đọc tài liệu: phần 1.1 và 9 là hành vi đã chốt mới nhất, phần 6.3 là yêu cầu voice mới cùng hướng thiết kế; phần 2, 3, 6.1, 7.1–7.3 và 8 là audit mã cũ; phần 4.3, 6.2, 7.4 và 10 là thiết kế đề xuất. Không lấy cơ chế feedback/fallback của mã cũ làm yêu cầu cần giữ.

## 1. Mục tiêu và trạng thái quyết định

Người dùng yêu cầu kiểm tra toàn bộ request AI của màn Video Motion, cách đối chiếu tài nguyên kho với câu chuyện, cách gán voice cho vai; sau đó phân tích tối ưu prompt/request, khả năng dựng theo voice, xung đột tên trong kho và cơ chế vẽ phần thiếu.

| Nội dung | Trạng thái |
| --- | --- |
| Ghi lại toàn bộ phân tích và lập kế hoạch chuẩn bị code | Đã tạo tài liệu; tiếp tục cập nhật theo quyết định mới |
| Phần vẽ ưu tiên ChatGPT; chỉ chuyển Claude sau 3 lượt ChatGPT lỗi/không có dữ liệu dùng được cho tác vụ đó | Người dùng đã chỉ định; không hiểu “sai” là điểm QA ảnh thấp |
| Tác vụ vẽ kế tiếp bắt đầu lại bằng ChatGPT, không chuyển cả job sang Claude | Người dùng đã chỉ định rõ |
| Chỉ phân tích, chưa code ứng dụng | Ràng buộc hiện tại của người dùng |
| Request/model/cache phải đúng câu chuyện và style; retry không kèm feedback | Người dùng đã chốt; thay thế cách retry gửi nhận xét sửa lỗi trong đề xuất trước |
| Claude lỗi thì retry thêm 2 lần, vẫn lỗi chuyển về ChatGPT | Người dùng đã chốt qua trả lời câu hỏi; 1 lượt đầu + 2 retry = tối đa 3 lượt Claude liên tiếp; thay thế đề xuất Claude 1 lượt rồi dừng |
| Không thêm AI kiểm tra ảnh; QA không được bắt quá chặt | Người dùng đã chốt |
| Thời lượng gần mục tiêu là được | Người dùng đã chốt; không yêu cầu khớp chính xác hoặc retry vì chênh lệch nhỏ |
| Nhấn Phân tích tự chạy đến có video hoàn thành | Người dùng đã chốt; lỗi AI là nhánh lỗi dự kiến, không để QA/SEO/thời lượng nhỏ chặn luồng |
| Voice phải đọc theo tâm trạng bối cảnh/phân cảnh | Người dùng đã yêu cầu; giữ danh tính giọng, cách đọc thay đổi theo diễn biến và vai, không chỉ thêm nhãn emotion vào metadata |
| Áp dụng routing mới cho cả nhân vật, bối cảnh và đạo cụ tạo bằng AI trong kho | Phạm vi đề xuất; cần ghi rõ khi triển khai, người dùng đang nói về phần vẽ cảnh thiếu |
| Dựng cảnh theo timeline voice thật | Đã phân tích tính khả thi, CHƯA triển khai/chốt toàn bộ thiết kế |
| Gộp SFX vào staging, bỏ casting khi đủ giọng khóa, biên tập có điều kiện, dời SEO | Đề xuất tối ưu, không coi là đã duyệt tất cả |
| Sửa định danh kho, tên đối tượng, cách dùng chéo 2D/3D | Phát hiện và đề xuất sửa, CHƯA triển khai |
| 20 request sau tối ưu | Ước tính có điều kiện cho một ví dụ, không phải số cố định hay kết quả đã đo |

Khi bắt đầu code sau này, không tự chuyển các đề xuất chưa chốt thành yêu cầu sản phẩm đã được phê duyệt.

### 1.1. Quyết định mới nhất: retry không feedback, QA nhẹ, tự hoàn thành video

Mục này thay thế đề xuất QA chặt và vòng sửa theo feedback trước đó. Các mục “hiện trạng” bên dưới vẫn mô tả mã đang có, không có nghĩa giữ nguyên những nhánh đó khi triển khai.

| Thành phần | Hành vi cần triển khai |
| --- | --- |
| Request | Gắn đúng video/job/task/entity/revision; dùng nội dung, style và thiết lập đã chốt. Không áp dụng kết quả cũ/sai task. |
| Model/provider | Vẽ bằng ChatGPT tối đa 3 lượt; nếu vẫn lỗi chuyển Claude. Claude có 1 lượt đầu + tối đa 2 retry lỗi kỹ thuật; vẫn lỗi quay ChatGPT, bắt đầu lại nhịp 3 lượt cho cùng tác vụ. Tác vụ mới luôn bắt đầu ChatGPT. Không tự chuyển provider khác. |
| Retry, không feedback | Khi AI lỗi hoặc không có dữ liệu dựng được, gửi lại yêu cầu gốc với cùng story/style/constraints. Không đính kèm danh sách nhận xét, điểm QA, prompt “fix previous” hoặc JSON sai trước đó làm feedback để AI sửa. Chi tiết lỗi chỉ dùng cho log và quyết định retry; ngữ cảnh phòng chat cũ không được âm thầm mang kết quả sai vào lần mới. |
| Claude | Retry thêm 2 lần khi lỗi kỹ thuật, rồi chuyển về ChatGPT nếu vẫn lỗi. Claude không còn là điểm dừng vĩnh viễn; nhận kết quả dùng được ngay, không QA ảnh/feedback. |
| Style | Mọi lượt vẽ/retry/chuyển AI luôn mang cùng style kit/Video DNA/drawing mode của câu chuyện. Cache và kho phải khớp style; không đổi sang style khác để chạy tiếp. Không gọi AI xem/chấm ảnh để xác nhận style. |
| QA | Không có bước AI review ảnh hoặc vòng feedback thẩm mỹ. Chỉ kiểm tra tối thiểu để đọc/render/phát được và không lẫn asset/voice/revision. Những thiếu sót tùy chọn và gợi ý bố cục không được chặn hoàn thành. |
| Thời lượng | Gần mục tiêu là được. Lấy voice thực tế làm mốc timeline; không gọi AI lại chỉ vì chênh lệch nhỏ, không ép đúng từng giây. Ngưỡng “gần” là chi tiết triển khai cần đề xuất, không tự gán tỷ lệ đã được người dùng duyệt. |
| Tâm trạng voice | Dựa vào diễn biến phân cảnh, nội dung câu và trạng thái người nói để chọn cách đọc. Giữ giọng của vai; narrator có cách kể phù hợp riêng. Chỉ dẫn phải tác động thật vào TTS/cách đọc, không dừng ở prompt hoặc chỉnh âm lượng. Không thêm bước AI nghe chấm rồi feedback. |
| Cache | Dùng lại kết quả đúng chữ ký story/style/voice/revision và file còn dùng được. Cache không khớp thì bỏ qua/tạo lại; không biến cache miss thành lỗi QA cuối job. |
| Trạng thái job | Nhấn Phân tích tự tiếp tục tới render/xuất video. Chỉ completed khi có file video thực, phát được; partial là checkpoint để resume, không phải video hoàn thành. |

Mục tiêu trải nghiệm: khi AI trả dữ liệu dùng được, hệ thống tự hoàn tất video; không dừng vì điểm QA, trường sáng tạo tùy chọn, SEO/thumbnail/SFX tùy chọn hoặc lệch thời lượng nhỏ. Không dùng một kết quả khác câu chuyện/style để che lỗi.

“Đúng style” được thực hiện bằng một hồ sơ style thống nhất từ câu chuyện/ảnh tham chiếu/preset, đưa vào prompt vẽ và kiểm tra định danh cache/asset; không phải thêm một model chấm ảnh. Chưa có ảnh tham chiếu thì dùng style đã suy ra từ câu chuyện. Chuyển provider không được tự chọn lại style. Không hứa một kiểm chứng thị giác tự động khi người dùng đã yêu cầu bỏ bước đó.

### 1.2. Phân loại lỗi để QA không chặn video

| Tình huống | Cách xử lý mục tiêu |
| --- | --- |
| AI timeout, hết lượt, mất kết nối, không trả lời hoặc đầu ra không đủ dùng sau chuẩn hóa kỹ thuật | Retry yêu cầu gốc; riêng phần vẽ theo chu kỳ ChatGPT/Claude ở phần 9. Không báo completed giả trong lúc đang retry. |
| JSON có thể bỏ markdown fence/parse hoặc thiếu trường kỹ thuật tùy chọn có giá trị mặc định rõ | Chuẩn hóa bằng code, tiếp tục; không thêm lượt AI sửa JSON. |
| AI trả dữ liệu hình học không render được, thiếu toàn bộ phần tạo bắt buộc hoặc reference không thể resolve | Xem là đầu ra AI chưa dùng được; retry yêu cầu gốc sau khi đã loại lỗi runtime nội bộ. Không gửi feedback. |
| Bố cục chưa đẹp, thiếu mô tả tùy chọn, điểm QA thấp, metadata tuổi/vùng chưa rõ, lệch thời lượng nhỏ | Không thêm gate và không retry vì các lý do này. Không lấy metadata không có làm bằng chứng sai chắc chắn. |
| Cache/asset khác story, style, voice hoặc revision | Cache miss/bỏ ứng viên; lấy asset tương thích hoặc tạo mới. Không biến thành lỗi cuối job hay tự dùng style khác. |
| Preview lỗi nhưng dữ liệu/cảnh vẫn dùng được | Phục hồi preview hoặc tiếp tục render video chính; preview không thành gate thẩm mỹ. Không nhầm ảnh preview với file video hoàn thành. |
| Lỗi tải model/phối âm/render/runtime cục bộ | Phân loại và tự phục hồi bằng code/checkpoint nếu có thể, giữ câu chuyện/style. Không gửi prompt đánh giá/sửa vì lỗi hạ tầng và không gắn nhãn sai là lỗi AI. |
| Người dùng bấm Hủy | Dừng chuỗi và các retry có liên quan, ghi cancelled; không chuyển AI thêm và không tính là lỗi AI. |

Chỉ completed khi file video thực đã được encode/mux, đọc được và có audio dự kiến. Đây là kiểm tra kỹ thuật nhẹ, không phải vòng AI review. Sự cố môi trường không thể phục hồi phải được báo đúng nguyên nhân và giữ checkpoint; không thể đảm bảo file được tạo nếu bản thân môi trường không ghi/render được.

Lỗi AI cần retry theo policy. Lỗi kỹ thuật nội bộ cần tự phục hồi bằng code, giữ checkpoint và tiếp tục khi có thể; không quy lỗi ổ đĩa/runtime/render thành “AI lỗi”, và không báo completed khi chưa có video thật. Đây là mục tiêu độ bền của pipeline, không phải giả định rằng nhà cung cấp AI luôn sẵn sàng.

Tối ưu số request không thêm lượt review ảnh. Các lượt retry do AI lỗi vẫn phải tính riêng; con số 20 là ví dụ có điều kiện, không phải hạn mức bắt buộc.

## 2. Luồng hiện tại

```text
Đọc/chuẩn hóa nguồn
→ Đọc ảnh style mới nếu có; trích sự kiện nếu nguồn dài
→ Phân tích câu chuyện và Video DNA
→ Viết chương
→ Biên tập lời dẫn khi đủ chương
→ Tạo SEO trong luồng tự động
→ Phân vai/định hướng âm thanh
→ Lấy tài nguyên kho, thiết kế phần thiếu
→ Dàn dựng cảnh
→ Chỉ đạo SFX
→ Tạo voice
→ Compile preview, phối âm và xuất video
```

- Tự tiếp tục mặc định bật; tự xuất mặc định tắt.
- Hành vi mục tiêu mới: nút Phân tích chạy liên tục tới xuất video, không phụ thuộc người dùng bấm thêm hoặc bật auto export; đây là thay đổi dự kiến, chưa có trong mã snapshot.
- Thumbnail là thao tác riêng.
- Một endpoint UI có thể gọi nhiều request AI phía sau.
- Bấm xuất có thể kích hoạt dựng/tạo voice trước nếu tài nguyên hoặc voice thiếu/hết hiệu lực. Bản thân render bằng engine/media tools không phải request lập kế hoạch AI.

### Endpoint chính

Tiền tố: `/api/motion-video`.

| Endpoint | Vai trò |
| --- | --- |
| `/story/parse` | Đọc nguồn; không gọi LLM trong nhánh đã kiểm tra |
| `/story/analyze` | Style, nguồn dài và phân tích tổng thể |
| `/story/script` | Viết chương và biên tập |
| `/story/seo` | Tạo SEO |
| `/story/scenes` | Casting, tài nguyên, staging, SFX, tự tạo voice |
| `/story/voice` | Lập kế hoạch voice và tạo audio |
| `/story/thumbnail` | Prompt thumbnail rồi tạo ảnh |
| `/story/compile` | Ghép spec, timeline và audio bằng code |
| `/check`, `/render`, `/status/:jobId` | Kiểm tra/dựng/theo dõi kỹ thuật; không đồng nghĩa AI xem hình |
| `/story/status/:jobId`, `/story/cancel`, `/cancel` | Theo dõi/hủy job nội dung hoặc render |

## 3. Danh mục request AI hiện tại

### 3.1. Mười ba nhóm lập kế hoạch/sinh JSON

Đây là snapshot mã hiện tại, không phải budget hay hợp đồng retry mới. Các số lần bên dưới là giới hạn ở tầng nghiệp vụ; retry/fallback tầng thực thi có thể cộng thêm. Những vòng sửa bằng feedback trong snapshot phải được thay bằng retry yêu cầu gốc theo quyết định mới, không giữ lại vì đã có trong mã.

| Tác vụ/artifact | Đầu vào chính | Đầu ra và điều kiện gọi |
| --- | --- | --- |
| `motion-style-kit` | Tối đa 4 ảnh style | Style kit, màu, tỷ lệ, mô tả từng ảnh. Chỉ gọi khi cache ảnh không hợp lệ; tối đa 4 lần, hai lần sau có chuyển Gemini/ChatGPT. Không đọc được style thì dừng. |
| `motion-story-ledger` | Nguồn không phải brief, dài từ 100.000 ký tự; chia khoảng 35.000 ký tự/phần | Sự kiện, thời gian, người liên quan, trích dẫn. Khoảng 1 lượt/phần. Phần lỗi dùng trích đoạn nguồn tối đa 12.000 ký tự làm dự phòng. |
| `motion-story-analysis` | Nguồn/ledger, thiết lập video, style, catalog nếu AI chọn kho | Chương, nhân vật, địa điểm, facts, Video DNA, mood nhạc. Tối đa 2 lần phân tích; có nhánh giữ hồ sơ chưa đủ hoặc tiếp tục với kế hoạch chưa có DNA hoàn chỉnh. |
| `motion-story-chapter` | Nguồn của chương, kế hoạch chung, thời lượng, cast/places, ngữ cảnh trước | Beats, narration, action, scenePlan, utterances. Tối đa 3 lần/lần xử lý; có bản tốt nhất/dàn ý dự phòng và controller có thể thử lại chương lỗi. |
| `motion-story-edit` | Nhóm tối đa 4 chương, nguồn tương ứng, lời dẫn, giọng kể | Sửa chọn lọc, khoảng 15% số beat, tối thiểu 2. Nhóm cũng được tách theo khoảng 60.000 ký tự nguồn. Lỗi thì giữ lời dẫn cũ. |
| `motion-story-seo` | Tóm tắt, facts, chương, audience, 3 beat đầu | Mục tiêu 5 phương án SEO, tối đa 2 lần. Có thể nhận ít hơn 5. Điểm SEO do AI tự trả, không phải số đo YouTube. |
| `motion-audio-casting` | Cast, catalog voice, định hướng và trích đoạn kịch bản | Đề xuất voice/tuổi/giới tính/mode. Code quyết định cuối; kế hoạch có cache. Có lời gọi trước dựng và khi tạo voice, nhưng lần sau có thể dùng cache. |
| `motion-voice-direction` | Những beat còn thiếu phân vai, có dấu hiệu lời thoại trực tiếp | Tách câu theo speaker, emotion, speed, pause, emphasis. Tối đa 24 beat/nhóm. Nội dung ghép lại phải khớp lời gốc; không hợp lệ thì về narrator. |
| `motion-gen-bible` | Cast cần thiết kế, era, style, schema, lỗi cũ | JSON nhân vật: parts/anchors/poses/motions. Nhóm tối đa 4 vai; hiện tối đa 3 vòng cho phần còn lỗi. Không phải tạo ảnh bitmap. |
| `motion-gen-location` | Địa điểm, sử dụng trong các beat, era/style, catalog model/prop, schema | JSON môi trường. Hiện mặc định 1 vòng, tối đa 3 lượt tạo/sửa định dạng. Sau đó render hai góc; không có AI xem ảnh đang hoạt động. |
| `motion-gen-staging` | Cast/design, hình học địa điểm, narration/action/scenePlan, continuity | Vị trí, pose/motion, props/hide, cameras, có chỉ dẫn âm thanh. Nhóm khoảng 3–8 beat và theo chương; tối đa 3 vòng sửa. Video trên 60 scene beat ưu tiên beat nhấn/mở chương, tối đa 12 beat/nhóm. |
| `motion-sound-direction` | Cảnh đã dựng, motion, đối tượng, catalog SFX | Sự kiện SFX và marker motion. Có version/cache; video nhiều beat giảm phần gửi AI. Không sinh file âm thanh mới ở request này. |
| `motion-story-thumbnail-prompt` | SEO title, logline, audience, visual DNA, key moments | Prompt ảnh; tối đa 2 lần, có prompt dự phòng bằng code. |

### 3.2. AI media và thao tác hỗ trợ

- Tạo thumbnail: Gemini Chat/Imagen, tối đa 3 lượt ở tầng thumbnail; cấu hình hiện không đính kèm lại ảnh style làm reference cho bước tạo ảnh.
- VieNeu TTS: local, `v3turbo`, clip theo câu, có cache. Worker nhận text/voice/file, không nhận đầy đủ chỉ đạo diễn xuất.
- AI33 TTS: dùng khi voice ID thuộc AI33; tạo task, polling trạng thái và tải audio. Một lần tổng hợp không tương đương một HTTP request.
- ASR: faster-whisper model `small`, local, mặc định tắt. Có mốc từng từ; có thể tạo lại câu tối đa 2 lần nếu sai, rồi vẫn có nhánh giữ audio còn sai và ghi log.
- Đăng ký voice mẫu và nghe thử giọng có xử lý riêng/cache; VieNeu dùng mẫu tham chiếu local.
- SFX lấy từ kho; nhạc nền trong nhánh đã kiểm tra được tổng hợp bằng code, không phải một request LLM riêng.

### 3.3. Routing và thực thi

- AI chính mặc định khai báo Gemini Flash / Room only / headless; không khẳng định đây là thiết lập đang lưu của mọi phiên.
- Hiện vẽ nhân vật/bối cảnh cố định Claude Sonnet 5.5, effort medium. `motionSceneAiExecution` còn đổi API only thành Room only.
- Staging, sound direction, casting, tách thoại, SEO, viết nội dung theo AI chính.
- `runMotionAi` thêm artifactType/requestId và yêu cầu một JSON object; parse/salvage JSON rồi trả về validator nghiệp vụ.
- Nhánh API hiện gắn capability `ScriptWriting` chung, chưa phân biệt đúng mọi tác vụ. Không truyền trực tiếp model UI để khóa model API.
- Text API có thể thử Cerebras, Groq rồi Gemini theo router/key. Media payload bỏ qua nhánh Cerebras/Groq hiện tại.
- Tối đa 5 worker; Gemini/ChatGPT gate 3 lượt đồng thời, khoảng cách gửi 8 giây; nhóm vẽ Claude hiện tuần tự.
- Room timeout: khoảng 12 phút cho analysis/chapter, 6 phút tác vụ khác.
- Fallback chung hiện có Claude → ChatGPT; Gemini ↔ ChatGPT theo lỗi; DeepSeek/Grok → Gemini. Có trạng thái provider tạm ngưng tùy lỗi.
- Bộ đếm hiện tính qua `runMotionAi`, theo provider, từng job; không phải tổng mọi inference/HTTP request của video.

## 4. Đánh giá prompt và tính cần thiết

### 4.1. Những phần nên giữ

- Một kế hoạch tổng thể trước khi viết từng chương.
- Style analysis riêng với cache theo ảnh.
- Giới hạn engine, quy tắc căn cứ nguồn, phân biệt factual/fictional, kiểm tra lời thoại giữ nguyên chữ.
- Thiết kế tài nguyên trước staging: staging cần hình học và pose/motion thực tế.
- Không gộp toàn bộ video thành một request lớn chỉ để giảm số lượt.

### 4.2. Vấn đề đã xác định

1. **Chỉ dẫn mâu thuẫn:** storyboard yêu cầu static nhưng ví dụ đi qua sảnh/mở ngăn kéo; vẫn có quy tắc static chung khi motion được bật. Prompt địa điểm tự nhận video 3D dù hỗ trợ 2D. Guide giới hạn emissiveIntensity 0..0.85 nhưng ví dụ dùng 2/3.
2. **Ví dụ JSON cũ:** ví dụ viết chương chưa minh họa scenePlan/utterances hiện được yêu cầu, dễ tạo lỗi thiếu trường và retry.
3. **Ngữ cảnh lặp:** DNA bị chèn hai lần trong đường prompt nhân vật. Staging gửi design toàn bộ cast dù nhóm beat chỉ dùng ít vai. Quy tắc graphic/SFX được gửi rộng hơn nhu cầu.
4. **Trường AI trả chưa được dùng tương xứng:** casting reason không giữ; narrationStyle/soundStyle AI đề xuất bị dựng lại từ mode/DNA. Emphasis voice tham gia khóa cache nhưng chưa điều khiển nhấn từ trong TTS.
5. **Kỳ vọng khác dữ liệu:** casting nói đọc complete script nhưng nhận scriptExcerpts. SEO self-score chưa có dữ liệu thị trường/kênh xác thực.
6. **Dữ liệu phụ thuộc sau biên tập:** editScript thay narration nhưng giữ utterances cũ; có thể làm bước voice phải sửa/tách lại hoặc về narrator.
7. **Chồng trách nhiệm âm thanh:** bible, staging và sound direction đều chứa chỉ dẫn SFX. Cần chọn nơi chịu trách nhiệm chính.
8. **Phân biệt kỹ thuật và thị giác:** validator cấu trúc không chứng minh ảnh khớp câu chuyện. Theo quyết định mới, xử lý bằng prompt/style/data identity nhất quán và kiểm thử offline, không thêm AI review ảnh hay gate thẩm mỹ vào mỗi video.

Đo khối tĩnh, chưa tính nguồn/DNA/catalog: guide địa điểm 7.953 ký tự + ví dụ 2.693; prompt nhân vật khoảng 7.812; staging khoảng 6.984; storyboard rules khoảng 6.583. Đây là số ký tự, không phải token/cost, và độ dài tự nó chưa chứng minh prompt kém.

### 4.3. Hướng tối ưu đã đề xuất, chưa coi là duyệt toàn bộ

| Nhóm | Hướng chuẩn bị |
| --- | --- |
| Analysis/chapter | Giữ; giảm trùng trường DNA, đồng bộ schema/ví dụ/validator, xuất đủ utterances/scenePlan ngay |
| Ledger | Có điều kiện theo nguồn/ngữ cảnh; giữ bằng chứng và timestamps |
| Editorial | Phương án đề xuất mới: bỏ lượt tự review/rewrite mặc định khỏi đường hoàn thành video; yêu cầu viết đúng được đưa vào prompt chapter gốc. Chỉnh sửa chủ động của người dùng vẫn cập nhật dữ liệu phụ thuộc đúng beat. Chưa triển khai. |
| Casting | Bỏ qua khi mọi giọng cần thiết đã khóa và traits đủ; chỉ suy luận phần chưa biết |
| Dialogue split | Chỉ tạo phân vai cho beat thiếu; nếu AI lỗi thì retry yêu cầu phân vai gốc của beat đó, không gửi feedback sửa kết quả cũ |
| Bible/location | Giữ khi thiếu asset; chỉ gửi dữ liệu cần; prompt theo drawing mode/capabilities |
| Staging/SFX | Phương án đề xuất để triển khai: staging xuất SFX cơ bản cùng cảnh; code chọn/mix từ kho. Chỉ tạo sound plan mới cho phần chưa có khi thật sự cần, không có lượt sound review/feedback sau staging và không yêu cầu hai nơi làm lại toàn bộ. Chưa được coi là lựa chọn người dùng đã chốt. |
| SEO/thumbnail prompt | Chạy sau kịch bản chốt; có thể ghép ý tưởng/prompt thumbnail vào gói SEO |
| Output contract | API dùng schema khi hỗ trợ; phòng chat cùng hợp đồng. Kiểm tra kỹ thuật tối thiểu, tự chuẩn hóa trường tùy chọn; không dựng thêm QA ngữ nghĩa/ảnh bắt buộc |

## 5. Số request: baseline và kỳ vọng

Ví dụ đã dùng trong trao đổi: 4 chương, 32 scene beat chia đều, 8 nhân vật mới, 3 bối cảnh mới; không cache, không ảnh mẫu, không ledger, không dialogue repair, không retry.

| Nhóm | Lượt lập kế hoạch trong ví dụ |
| --- | ---: |
| Analysis | 1 |
| Chapter | 4 |
| Editorial | 1 |
| SEO | 1 |
| Casting | 1 |
| Bible | 2 |
| Location | 3 |
| Staging theo cách chia nhóm hiện tại | 8 |
| Sound direction | 5 |
| Tổng | 26 |

- Nếu khóa đủ giọng, bỏ 1 casting, và gộp 5 sound call vào staging: dự kiến 20.
- Nếu vẫn cần casting: dự kiến 21 với các giả định còn lại giống trên.
- Chưa tính TTS/ASR, tạo ảnh thumbnail, prompt thumbnail riêng, seed kho và retry/fallback.
- Routing ChatGPT 3 lần rồi Claude có thể tăng lượt ở tác vụ lỗi; không cam kết mọi video còn 20.
- Chưa benchmark chất lượng/tốc độ/cost sau tối ưu. Không ghi 20 như kết quả đã đạt.
- Quyết định mới không thêm request AI kiểm tra ảnh; việc bỏ/thu gọn editorial hoặc tác vụ tùy chọn có thể làm ví dụ thay đổi. Cần đo lại sau khi chốt luồng, không cộng QA ảnh vào baseline mục tiêu.
- Ví dụ 20/21 vẫn giữ 1 lượt editorial để đối chiếu cuộc trao đổi trước. Nếu áp dụng đề xuất bỏ editorial mặc định, cùng các giả định đó còn khoảng 19/20 lượt. Tất cả đều là phép tính thiết kế, chưa đo, không phải cam kết số request sau sửa.

Telemetry đề xuất: video/job/task/entity ID, artifact, provider/model yêu cầu và thực tế, lần thử, lý do đổi AI, thời gian, cache hit, validator result, token/chi phí khi có. Đếm riêng LLM call, media inference và HTTP polling.

## 6. Voice: hiện trạng và hướng đồng bộ cảnh

### 6.1. Phân vai hiện tại

- Narrator tách riêng; vai nhân vật tham chiếu theo cast.key.
- Lọc voice theo ngôn ngữ, giữ voice pin của channel; AI đề xuất, code chọn cuối theo traits/catalog/channel.
- Channel có narrator và 5 nhóm: nam trưởng thành, nữ trưởng thành, trẻ em, ông lão, bà lão; chưa khóa riêng từng nhân vật.
- Đã tái hiện: hai vai nam cùng nhóm, vai đầu nhận giọng khóa; vai sau có thể nhận giọng khác vì ưu tiên tránh trùng ID.
- Thiếu giọng có thể dùng lại; thiếu gender phù hợp có thể báo lỗi.
- Explicit utterances hợp lệ được giữ; thiếu thoại rõ speaker mới gửi AI; không hợp lệ/không xác định thì narrator.
- emotion/speed chủ yếu ảnh hưởng hậu kỳ tốc độ, gain và khoảng nghỉ; chưa phải điều khiển diễn xuất đầy đủ của model TTS.
- Có cache kế hoạch, từng clip và track; signature bảo vệ khỏi dùng track cũ khác kịch bản. ASR mặc định tắt.

### 6.2. Dùng voice để dựng cảnh

Hiện staging nhận narration/action/scenePlan và thời lượng ước tính; voice được tạo sau. Compile dùng thời lượng voice thật và speech ranges theo speaker, có thể có word timestamps, nhưng AI staging chưa nhận timeline audio thật.

Thiết kế đề xuất:

```text
Chốt narration + utterances + speaker
→ Chọn giọng, tạo clip và đo thời gian
→ Staging nhận nội dung + timeline voice + hình học + motion khả dụng
→ Gắn camera/action/SFX vào câu và khoảng nghỉ
→ Phối stereo/SFX cuối sau staging
→ Preview/export cùng một timeline
```

- Nội dung/câu chuyện quyết định hành động và bối cảnh. Voice timing quyết định nhịp; không tự chuyển sang biển chỉ vì nhân vật trong nhà nói “ngày mai ra biển”.
- AI nên tham chiếu utterance ID và before/during/after/offset; code chuyển sang giây. Đổi tốc độ voice có thể retime bằng code khi ý nghĩa không đổi.
- Tách tạo clip khỏi phối âm không gian: audio service hiện phụ thuộc staging để pan, tránh vòng phụ thuộc voice ↔ staging.
- Không cần thêm lượt LLM nghe audio nếu text/speaker/timing đã có. ASR tùy nhu cầu kiểm tra/mốc từ.
- Theo quyết định QA nhẹ, ASR không thành gate mặc định hay vòng feedback; thời lượng/cú cắt dùng mốc voice gần hợp lý, không tối ưu cứng tới từng giây.
- Với audio upload chưa có transcript/attribution, không hứa giữ nguyên số request hay áp dụng tự động như voice tạo từ script.
- Voice-first là hướng thiết kế đề xuất, chưa phải bằng chứng có pipeline mới. Có thể tạo clip voice song song với chuẩn bị tài nguyên, sau đó staging chờ cả hai; không tạo lại audio chỉ để pan vì final spatial mix thực hiện cuối.

### 6.3. Voice đọc theo tâm trạng phân cảnh — yêu cầu mới

Người dùng yêu cầu voice không chỉ đúng người nói/chữ mà còn đọc ra tâm trạng của bối cảnh đó. Bối cảnh ở đây là tình huống và diễn biến của từng beat, không chỉ tên location. Cùng một căn phòng có thể có đoạn bình yên, căng thẳng rồi nhẹ nhõm; không gán một cảm xúc cố định cho toàn location hoặc cả video.

#### Dữ liệu và thứ tự xác định cách đọc

- Giữ audio direction chung từ Video DNA, nhưng mỗi beat có sceneMood và mức cường độ phù hợp.
- Mỗi utterance có trạng thái/cảm xúc riêng của speaker và delivery cần thiết; cảm xúc của nhân vật có thể khác không khí chung của cảnh.
- Lấy từ chỉ dẫn người dùng, lời thoại/diễn biến nguồn và scenePlan/action; dùng DNA làm nền. Không suy diễn nỗi sợ chỉ vì cảnh tối, hoặc tự thêm phấn khích vì nhạc vui.
- Narrator giữ chất kể và mức tiết chế phù hợp thể loại; không buộc narrator diễn giống nhân vật đang nói. Nội dung tài liệu vẫn có cảm xúc phù hợp nhưng không biến thành kịch hóa trái nguồn.
- Khi nguồn không cho thấy cảm xúc rõ, dùng cách đọc tự nhiên/tiết chế; không bắt AI bịa cảm xúc để điền đủ schema.

| Tình huống minh họa | Hướng đọc dự kiến |
| --- | --- |
| Cảnh mất mát, buồn | Nhịp chậm hơn vừa phải, ngắt nghỉ mềm, sắc thái trầm/lắng; không chỉ giảm volume |
| Cảnh hồi hộp | Nhịp và ngắt câu có căng thẳng, nhấn ở từ phù hợp; không đọc gấp toàn đoạn |
| Nhân vật hoảng sợ | Cách đọc lo lắng/hốt hoảng theo câu, giữ dễ hiểu; không tự chèn tiếng hét hay chữ mới |
| Cảnh vui/nhẹ nhõm | Giọng sáng và nhịp linh hoạt hơn theo khả năng TTS |
| Đoạn giải thích/tài liệu | Rõ ràng, tiết chế, nhấn thông tin; tránh thêm diễn xuất không có căn cứ |

Đây là minh họa thiết kế, không phải bộ template ép mọi câu chuyện theo 5 mood. Cảm xúc có thể chuyển giữa các câu; không đổi voice ID chỉ vì đổi mood và không thêm acting tags vào phần chữ được đọc.

#### Cách nối vào TTS và cache

1. Đưa sceneMood/speaker emotion/delivery vào đầu ra của request viết chương/phân vai đang có. Không mặc định tạo thêm một request LLM đọc tâm trạng cho từng beat.
2. Chốt chỉ dẫn đọc trước tạo clip. Nếu đi theo voice-first, dùng tình huống/scenePlan ở kịch bản để xác định mood trước staging cuối, tránh vòng staging → emotion → tạo lại voice → staging.
3. Có lớp ánh xạ delivery sang khả năng thực tế từng TTS: nhịp, ngắt nghỉ, ngữ điệu/cường độ và nhấn từ khi engine hỗ trợ. Giữ chữ/nội dung và voice ID đã chọn.
4. Kiểm tra khả năng VieNeu/AI33 thực tế trước triển khai: worker VieNeu hiện chỉ truyền text/voice cho infer; lời gọi Motion sang AI33 hiện cũng không truyền bộ chỉ dẫn cảm xúc. Không ghi thành “đã có expressive voice” chỉ vì đã có emotion trong JSON hoặc time-stretch/gain ở FFmpeg.
5. Nếu engine không hỗ trợ mức diễn xuất cần thiết, ghi rõ phần có thể làm bằng nhịp/ngắt nghỉ và phần chưa đạt; cần quyết định tích hợp TTS có khả năng phù hợp, không tự đổi nhà cung cấp/giọng hoặc hứa cảm xúc đầy đủ bằng tham số không có tác dụng.
6. Clip cache dùng chữ ký của chỉ dẫn đọc đã resolve thực sự và phiên bản engine/adapter. Cùng chữ và voice nhưng mood/cách đọc khác thì không lấy lại audio trung tính cũ; chỉ tạo lại clip bị ảnh hưởng. Đổi nhãn không làm thay âm thanh thì không tự tạo lại vô ích.
7. Đo lại thời lượng clip sau cách đọc, retime cảnh gần hợp lý. Không ép tốc độ để triệt tiêu sắc thái chỉ nhằm khớp thời lượng chính xác.

Không thêm vòng nghe/chấm điểm bằng AI, không feedback rồi synthesize lại do điểm cảm xúc; chỉ retry khi gọi TTS lỗi hoặc audio không dùng được theo kiểm tra kỹ thuật. Kiểm chứng chất giọng/cảm xúc bằng nghe mẫu offline khi phát triển; cache/telemetry ghi delivery thực tế đã áp dụng để không có trường chỉ ghi nhận mà không tác động.

## 7. Kho tài nguyên: lựa chọn và lỗi định danh

### 7.1. Cách chọn hiện tại

1. Sau analysis: assignSceneLibrary gắn reuse theo mode.
2. Khi buildScenes: giữ gen còn tương thích, fillSceneLibrary bổ sung thiếu rồi applySceneLibrary đọc dữ liệu và gắn theo key câu chuyện.
3. AUTO: code chọn; AI mode: gửi catalog metadata để AI đề xuất ID rồi code có fallback; OFF: bỏ reuse nhân vật/bối cảnh, phần thiết kế vẫn có thể dùng model/prop library.
4. Filter theo kind/style và khả năng motion. Hiện shared 2D/3D được dùng chéo.
5. Nhân vật: type/gender/region và type fallback; trong pool ưu tiên ít dùng trong câu chuyện trước keyword fit, rồi uses/createdAt; clone/variant/costume trước khi gắn gen.cast.
6. Địa điểm: cùng type, ưu tiên traits phù hợp, ít dùng trong câu chuyện, rồi điểm. Điểm = 0.25 nền + 0.30 interior + 0.15 time + keyword 0.08/từ, tối đa 0.30. Ngưỡng 0.30 và kiểm tra region; era không phải chặn tuyệt đối ở mọi nhánh.
7. Nếu chưa khớp khi fill: ưu tiên vẽ tối đa 3 địa điểm theo số beat sử dụng; phần vượt budget có thể lấy gần nhất không giữ ngưỡng ban đầu. Đây không phải trần cứng khi OFF/vẽ mới hết.
8. Dữ liệu bối cảnh lệch traits có thể được redress bằng thay/xóa props trong defs đã nhận diện; chưa sửa toàn bộ kiến trúc/ngữ nghĩa.
9. apply lưu nguồn ở gen.assetSources; chọn theo metadata, không có AI nhìn ảnh xác nhận khớp câu chuyện.

### 7.2. Snapshot kiểm tra dữ liệu thật

| Hạng mục | Kết quả |
| --- | ---: |
| Tổng | 635 |
| Character / location / prop | 213 / 141 / 281 |
| shared-2d / plain-2d | 610 / 25 |
| ID trùng | 0 |
| File dữ liệu thiếu / JSON không đọc được | 0 / 0 |
| Nhóm trùng style + kind + name | 2 |
| Location có tên node literal lặp trong nodes/children | 43 |

Hai cặp tên trùng, cùng plain-2d, dữ liệu JSON khác nhau:

- “Sân gạch nhà ba gian”: loc-ec670d3a5a, loc-23a05a0036.
- “Nhà trên gian giữa”: loc-a0bed633fd, loc-c1b5820f30.

Không kết luận cả 43 location hỏng: tên lặp có thể cố ý, nhưng tham chiếu đơn lẻ bằng tên bị mơ hồ. Ví dụ paddy x2, terrace x3, step x4, column x2. Khảo sát literal chưa bao quát mọi tên trùng phát sinh từ use/repeat khi render.

### 7.3. Lỗi/rủi ro đã xác định và tái hiện

- Save tự động coi cùng style + kind + name là đã có, bỏ lưu thiết kế mới và có thể gắn assetSources vào asset cũ khác hình học. Map tra cứu lấy một ID khi có nhiều tên trùng; không phải ghi đè file cũ nhưng sai nguồn/thiếu biến thể mới.
- Import pendingBaseLibrary so kind + name trong shared style. Đã tái hiện một nhân vật đổi type/gender/design nhưng cùng tên “Ông lão áo bà ba trắng” vẫn bị bỏ qua.
- sceneStyleFits cho dùng shared của chế độ kia. Đã tái hiện query plain-3d trả 610 asset, toàn bộ shared-2d.
- Engine focusProp chọn đối tượng visible đầu tiên cùng tên; hide ẩn mọi đối tượng cùng tên. Thiếu định danh instance duy nhất cho thao tác riêng.
- normalizeAnalysis bỏ place thứ hai khi key trùng. Đã tái hiện room A/room B cùng key chỉ còn A. Cast có cách thêm hậu tố riêng.
- AI reuse được nhận mà chưa revalidate đầy đủ type/gender/era. Over-budget có thể chọn quá rộng. Số lần dùng đứng trước mức khớp trong một số bước.
- ID kho có prefix theo kind và UUID rút gọn; hiện không quan sát ID collision. Tên hiển thị trùng không tự nó là lỗi, vấn đề là dùng tên như danh tính.

### 7.4. Hướng sửa đề xuất

- Asset ID ổn định; display name được trùng. Thêm fingerprint nội dung chuẩn hóa và metadata/version phù hợp để nhận diện cùng asset.
- Phân biệt asset mẫu với instance trong câu chuyện; lưu provenance đúng phiên bản/hình học đã dùng.
- Prop/node instance có ID/path duy nhất; label/name để mô tả. Remap focus/hide/sound references khi cần.
- Chỉ dùng chéo 2D/3D khi có capability xác nhận; cùng drawing mode chưa chắc cùng phong cách.
- Lọc ràng buộc xác định được từ dữ liệu trước khi rank, ưu tiên style/drawing mode/khả năng motion và đúng entity. Metadata vùng/tuổi/era chưa rõ dùng để xếp hạng, không tự thành gate ngắt video. Không có ứng viên tương thích thì tạo mới; budget chỉ tối ưu tài nguyên, không ép dùng sai style.
- Key place trùng phải có xử lý rõ và remap reference, không âm thầm bỏ hay đổi key đơn lẻ.
- Migration giữ ID cũ và reference; không xóa/gộp tài nguyên chỉ vì cùng tên, nhất là hai cặp dữ liệu khác nhau. Backup, dry-run và báo cáo trước mọi thay đổi dữ liệu thật.

## 8. Vẽ phần thiếu: hiện trạng mã cũ

Những hành vi gửi JSON/lỗi cho AI sửa, score hoặc throw job dưới đây là audit. Khi triển khai, thay theo retry không feedback, QA nhẹ và tự tiếp tục đã chốt; không sao chép nguyên cơ chế cũ.

- Bối cảnh là location dùng chung; nhiều beat có thể dùng một location, không vẽ lại toàn bộ môi trường cho từng shot.
- Chỉ thiết kế địa điểm cần cho scene beat đang xử lý và chưa có gen.locations, hoặc được chỉ định vẽ lại.
- Prompt nhận story/era/place/style, action/scenePlan của tối đa 10 beat dùng địa điểm đó, catalog model/prop và schema hình học.
- AI trả location JSON; attach props, validate; có lỗi gửi JSON và lỗi lại, tối đa 3 lượt trong vòng mặc định hiện tại.
- Tải model cần thiết; model không tải được có thể bị loại. Chưa bảo đảm hero prop còn đủ sau loại bỏ.
- Render hai góc wide/reverse ở 768x432; score nội bộ 0, issues không được dùng như vòng AI xem ảnh. Bản render được không đồng nghĩa đúng cảnh/đẹp.
- Thành công lưu gen.locations/locationInfo, phát partial, rồi đưa vào luồng lưu kho và staging.
- Không dựng được location: throw lỗi job; không tự tạo một location mặc định thay thế.
- Staging thất bại: có autoStageBeats dự phòng bằng code.
- Preview beat lỗi render: auto restage bằng code tối đa 2 lần; không phải gọi AI xem ảnh.
- gen.failed chứa beat thiếu staging/preview hợp lệ theo điều kiện hiện tại. Auto export có thể bỏ preview từng beat, lỗi chuyển sang phát hiện lúc render.
- State tương thích có thể giữ phần đã xong để dựng tiếp; thay DNA/cast/place/style hoặc scene execution key có invalidation tương ứng.

## 9. Routing phần vẽ mong muốn

Yêu cầu trực tiếp của người dùng:

```text
Tác vụ A: ChatGPT 1 → lỗi → ChatGPT 2 → lỗi → ChatGPT 3
          → vẫn lỗi → Claude lượt đầu
                        → lỗi → Claude retry 1
                                  → lỗi → Claude retry 2
                                            → vẫn lỗi → quay ChatGPT 1
                                                         → tiếp tục cùng policy

Tác vụ B: luôn bắt đầu lại ChatGPT 1
```

### Quy tắc chuẩn bị triển khai

- Thành công lần 1/2 thì kết thúc sớm, không chạy đủ 3.
- Bộ đếm gắn task/location hoặc phần nhân vật còn thiếu, không gắn provider của toàn job.
- “3 lượt ChatGPT” là tối đa 3 lượt tổng trong mỗi nhịp, không phải 1 lượt đầu + 3 retry. “Claude retry thêm 2” là 1 lượt đầu + 2 retry, tối đa 3 lượt tổng. Thành công ở bất kỳ lượt nào thì kết thúc task ngay.
- Giữ những nhân vật/asset đã dùng được; Claude chỉ nhận yêu cầu gốc của phần cần tạo cùng story/style/constraints, không nhận JSON sai và nhận xét lỗi làm feedback.
- Claude lỗi kỹ thuật ở lượt đầu được retry thêm 2 lần. Nếu cả 3 lượt Claude vẫn lỗi thì cùng tác vụ quay ChatGPT, reset bộ đếm nhịp ChatGPT về 0; không chuyển Gemini hay provider thứ ba.
- Tiếp tục policy đổi AI này tới khi có dữ liệu dùng được hoặc người dùng hủy; không tự thêm trần 1 lượt Claude rồi dừng. Có khoảng chờ retry phù hợp để không gửi dồn khi provider hết lượt/timeout; log rõ trạng thái đang thử lại.
- Tác vụ kế tiếp vẫn ưu tiên ChatGPT dù tác vụ trước dùng Claude; tránh mutation o.exec/shared state và fallback sticky.
- Routing chung hiện có ChatGPT → Gemini hoặc Claude → ChatGPT; phải có chính sách cô lập phần vẽ để không chuyển sớm hoặc thêm retry ngầm ngoài budget.
- Xác định ownership retry: một nơi quyết định lượt gửi lại, không có vòng sửa bằng feedback; log rõ nghiệp vụ và transport để không biến 3 lần thành nhiều lần không thấy.
- Hủy không được kích hoạt Claude; không bỏ kết quả tốt, không gửi thêm khi signal đã hủy.
- Tôn trọng giới hạn đồng thời/session của từng provider khi các tác vụ vẽ chạy song song.
- Một task/revision chỉ có một bộ điều phối lượt gửi. Vẽ nhóm nhân vật có thể thu hẹp sang những vai còn thiếu với dữ liệu gốc của vai đó; không đính kèm kết quả lỗi. Kết quả đúng của vai khác được giữ, không bị gọi lại để đánh giá.
- Retry cần phòng chat/ngữ cảnh sạch khi lần trước thất bại, để lịch sử JSON sai hoặc nhận xét cũ không trở thành feedback gián tiếp. Payload nghiệp vụ giữ nguyên; requestId/attempt metadata có thể đổi để chống nhận nhầm phản hồi.
- Provider đang cooldown không được làm route bỏ ChatGPT ngay hoặc tự chạy Gemini. Điều phối chờ theo backoff và hiển thị trạng thái; không đếm thời gian chờ đơn thuần như một lượt đã gửi. Hủy phải ngắt được cả chờ lẫn request.
- Checkpoint lưu task/revision, kết quả đã có và bộ đếm; mất kết nối UI hoặc mở lại chat không được tạo hai chu kỳ gửi trùng. Task mới bắt đầu ChatGPT; resume cùng task tiếp tục checkpoint của task đó.

### Các điểm đã chốt và còn cần xác định

1. Đã chốt: Claude lỗi thì retry thêm 2 lần (tổng tối đa 3 lượt liên tiếp), vẫn lỗi chuyển ChatGPT; task mới luôn bắt đầu ChatGPT. Thay thế toàn bộ quy tắc cũ “Claude là cuối, không quay lại ChatGPT”.
2. Đã chốt KHÔNG AI kiểm tra ảnh và KHÔNG feedback. Chỉ lỗi AI/đầu ra không dùng được mới cần retry; lỗi thẩm mỹ, cảnh báo QA và chênh thời lượng nhỏ không kích hoạt vòng gọi lại.
3. Phạm vi đề xuất: chung policy cho vẽ nhân vật/bối cảnh/đạo cụ qua bible/location, kể cả seed. Người dùng chưa trả lời riêng về mở rộng scope; không tự đổi AI chính của narration/voice/staging/SEO.
4. Cấu hình model đề xuất: ChatGPT Auto và Claude Sonnet 5.5 medium hiện có. Đây là lựa chọn kỹ thuật đề xuất, không ghi thành model cụ thể người dùng đã chỉ định.
5. Đường vẽ dự kiến dùng phòng chat ChatGPT/Claude. Tác vụ API khác giữ lựa chọn hiện tại; nếu có đường vẽ khác phải đưa vào scope rõ ràng, không âm thầm đổi API/room mode của toàn ứng dụng.

Đối với các tác vụ AI khác, yêu cầu không feedback và QA nhẹ áp dụng toàn luồng; riêng chu kỳ đổi provider ở đây chỉ được áp dụng cho phần vẽ thuộc scope. Budget/provider retry của tác vụ khác phải có cấu hình tường minh khi code, không tự suy ra rằng mọi request đều chuyển ChatGPT/Claude.

Chi phí một tác vụ: ChatGPT đúng lần 1 = 1 lượt; đúng lần 3 = 3; ChatGPT lỗi cả 3 và Claude dùng được ngay = 4. Một nhịp ChatGPT 3 + Claude 1 lượt đầu và 2 retry có tối đa 6 lượt; lượt tiếp theo quay ChatGPT là lượt 7 nếu mọi lượt trước đều lỗi. Đây không phải trần toàn tác vụ. Không gọi lại để chấm ảnh hoặc feedback; tổng request tăng theo lỗi AI thực tế.

## 10. Kế hoạch triển khai sau khi được yêu cầu code

### P0 — Khóa phạm vi và baseline

- Chốt các mục còn mở ở phần 9 và chiến lược SFX/voice lock.
- Lập điều kiện tối thiểu đọc/render/phát được theo phần 1.1; tách dữ liệu bắt buộc với trường sáng tạo tùy chọn. Không dùng QA chặt để ngắt pipeline.
- Thiết kế một coordinator cho toàn chuỗi Phân tích → script → tài nguyên/voice → staging → compile/mix → render/xuất, thay vì chỉ nối callback trên UI. Hoạt động độc lập với autoContinue/autoExport cũ, có checkpoint, chống nhấn lặp và không tiếp tục từ closure/state sai revision.
- Coordinator chỉ đi tiếp bằng dữ liệu dùng được hoặc chuẩn hóa kỹ thuật từ cùng yêu cầu. Không bịa chương, đổi voice hay lấy style khác để làm đầy pipeline. SEO/thumbnail/SFX tùy chọn vẫn có thể chạy và lưu trạng thái riêng; lỗi của chúng không hủy video chính, không âm thầm đánh dấu các phần đó là đã xong.
- Đọc lại mã/instructions tại thời điểm bắt đầu; snapshot có thể thay đổi.
- Ghi baseline request theo task, chất lượng và thời gian trên bộ fixture cố định.
- Xác định test đang lỗi do expectation cũ/thiếu fixture trước khi dùng làm release gate.
- Không chạy request AI thật tốn lượt chỉ để đo routing; bắt đầu bằng stub/fake có kiểm soát.

Nghiệm thu P0/coordinator: nhấn Phân tích một lần từ nguồn hợp lệ có thể nhận MP4 thật mà không bấm viết/dựng/xuất tiếp, kể cả state cũ từng tắt autoContinue/autoExport; mở lại UI tiếp tục checkpoint; nhấn lặp không sinh job/video trùng; Hủy dừng toàn chuỗi; AI lỗi hiển thị retry/đang chờ đúng nguyên nhân. Lỗi môi trường không thể phục hồi phải được báo đúng, không giả completed.

### P1 — Routing vẽ ChatGPT trước, Claude retry 2 rồi quay ChatGPT

Files dự kiến: motionSceneAi.ts, motionSceneLibrary.ts, motionGenService.ts, motionStoryService.ts; type execution nếu cần.

- Tách policy vẽ và executor một lượt; không tự đổi lựa chọn AI của tác vụ khác. Rà soát retry/fallback chung để bảo đảm không chuyển ngoài policy hoặc nhận đầu ra chưa đạt.
- ChatGPT tối đa 3 lượt cho phần chưa dùng được; sau đó Claude 1 lượt đầu + tối đa 2 retry lỗi kỹ thuật. Claude vẫn lỗi thì quay ChatGPT cho cùng task; task mới luôn reset về ChatGPT.
- Cùng policy cho mọi entrypoint thuộc scope, gồm vẽ mới/vẽ lại/dựng tiếp và seed nếu được chọn.
- Mọi retry dùng yêu cầu gốc và cùng style; không tạo prompt feedback/correction. Giữ phần đã dùng được, không ghi đè bằng lần lỗi.
- Bỏ retry/correction lồng nhau cho cùng tác vụ; cấu hình transport thấp hơn không được tự đổi provider hoặc gửi nhiều inference mà coordinator không biết. Một chủ sở hữu cho bộ đếm, kể cả lỗi parse/JSON/schema không dùng được.
- Dùng requestId và task revision để bỏ phản hồi cũ; reset/đóng ngữ cảnh lỗi khi retry, giữ backoff/cancellation và checkpoint của từng task.
- Log provider/model, attempt, validation failure và lý do fallback.

Nghiệm thu: đúng ngay không gọi Claude; ba lỗi ChatGPT mới gọi Claude; Claude dùng được thì nhận ngay; Claude lỗi đủ 1+2 lượt thì lượt tiếp theo là ChatGPT; task mới bắt đầu ChatGPT; không Gemini/provider ngoài policy; cancellation dừng cả chu kỳ/chờ; không nhân retry ngầm; task song song không ảnh hưởng nhau; mọi retry giữ yêu cầu/style gốc, không feedback cả trực tiếp lẫn lịch sử phòng chat. Log tổng lượt không mất khi reset bộ đếm từng provider.

### P2 — Sửa hợp đồng prompt

Files dự kiến: motionGenPrompts.ts, motionRuntime.ts, motionVideoDna.ts, motionDirection.ts, motionAudioDirection.ts, các validator/service liên quan.

- Đồng bộ schema + ví dụ + validator theo tác vụ; cập nhật mẫu scenePlan/utterances.
- Sửa mâu thuẫn motion/static, 2D/3D, thông số vật liệu và ví dụ.
- Loại DNA lặp; chỉ gửi cast/place/catalog/capability cần thiết. Phân biệt constraints bắt buộc với gợi ý thẩm mỹ.
- Bỏ trường đầu ra không dùng hoặc nối chúng vào consumer thật; không invalidation audio vì chỉ metadata không tác động tiếng nói.
- Khi editorial đổi lời, invalidation/rebuild dữ liệu phụ thuộc đúng beat.
- Loại các nhánh tạo prompt correction/feedback đang nằm trong analysis, chapter, bible, location, staging và các request liên quan. Tách yêu cầu mới chủ động của người dùng khỏi feedback tự sinh: ghi chú người dùng vẫn là đầu vào hợp lệ của một revision mới.
- Áp dụng kiểm tra kỹ thuật tối thiểu cho lượt đầu và retry; lỗi AI/không có dữ liệu dùng được thì gửi lại yêu cầu gốc. Không có prompt fix previous, điểm QA, danh sách lỗi hay JSON cũ gửi cho AI làm feedback.
- Tự hoàn thiện trường kỹ thuật/tùy chọn có thể suy ra bằng code; không yêu cầu model tạo lại vì thiếu một trường mô tả hoặc lệch thời lượng nhỏ. Không thay nội dung và style đã chốt.
- Cache theo từng tầng: plan/asset/voice clip/track/render dùng đúng phần chữ ký liên quan. Thay FPS/chất lượng xuất không tự làm mất cache voice/thiết kế; thay câu hoặc style chỉ invalidate phần phụ thuộc. Không yêu cầu cache có chứng nhận QA ảnh.

Nghiệm thu: fixture 2D/3D/motion on-off, factual/fictional, object-only, nhiều vai dùng đúng style/thiết lập; dữ liệu đủ render được tiếp tục ngay, thiếu tùy chọn không chặn; không phát sinh request feedback/AI review ảnh hoặc retry vì chênh thời lượng nhỏ.

### P3 — Định danh và tương thích kho

Files dự kiến: motionSceneLibraryService.ts, motionGenService.ts, motionStoryService.ts, motionVideo.ts types, gen-build/gen-scene/gen-core và UI kho nếu cần.

- Sửa dedup/save/import theo ID/fingerprint/version, không dựa tên.
- Provenance phản ánh asset thực tế; hỗ trợ cùng tên khác nội dung.
- ID/path instance cho camera/hide/SFX; remap đầy đủ và tương thích cảnh cũ.
- Giữ cùng style/drawing mode và khả năng motion cần thiết theo dữ liệu xác định được; không đưa metadata tuổi/vùng/era chưa rõ thành điều kiện làm job lỗi. Không khớp kho thì tạo mới theo cùng style, không lấy gần nhất khác style vì hết budget.
- Sau tải/chỉnh asset, xử lý references/model thiếu bằng code hoặc tạo lại theo yêu cầu gốc khi cần; không dùng asset khác style để né lỗi và không thêm vòng AI chấm hình. Cảnh báo chi tiết bố cục không chặn video.
- Xử lý place key trùng với references nhất quán.
- Chuẩn bị migration backup/dry-run; giữ asset và ID đang được dự án cũ dùng.
- Làm đường đọc tương thích ID cũ trước; migration làm sạch dữ liệu là thao tác riêng, không tự chạy khi người dùng nhấn Phân tích và không thành điều kiện bắt buộc để tạo video mới.

Nghiệm thu: cùng tên khác geometry/type/gender được giữ đúng; import lặp cùng nội dung không nhân bản vô ích; focus/hide đúng instance; không mất place; mở lại/xuất dự án cũ không gãy refs.

### P4 — Cảnh theo timeline voice

Files dự kiến: motionVoiceDirectionService.ts, motionAudioService.ts, motionGenService.ts, motionDirectorService.ts, controller/hook/types.

- Tách plan/clip timing khỏi final spatial mix.
- Chốt utterance ID/speaker trước; đưa duration và speech windows vào staging.
- Thực hiện sceneMood và delivery theo phần 6.3 trước khi tạo clip; narrator và vai có chỉ dẫn riêng nhưng giữ voice identity. Gắn điều khiển có tác dụng thật của engine, không coi gain/tempo đơn thuần là đã đủ yêu cầu đọc tâm trạng.
- Dàn dựng/SFX tham chiếu câu và mốc; code resolve/retime, giới hạn theo motion khả dụng.
- Chỉ retime khi thay tốc độ/pause; thay lời/hành động cần invalidate phần liên quan.
- Giữ location/câu chuyện làm nguồn không gian; không dựng hành động chỉ vì danh từ trong lời kể.
- Kiểm tra speaker/voice/text/revision và audio dùng được trước dùng cache; không dùng audio cũ khác lời. Duration thực tế là cơ sở timeline, không là điều kiện khớp thời lượng mục tiêu cứng. ASR tùy chọn, không làm QA gate mặc định.

Nghiệm thu: đúng người nói, cách đọc phù hợp tâm trạng từng đoạn trên mẫu nghe offline, nhịp cảnh theo voice ở mức hợp lý; đổi mood tạo lại đúng clip và giữ voice ID; không chỉ đổi metadata. Đổi tốc độ không gọi lại LLM khi không đổi ý nghĩa; preview/export cùng timeline và stereo; không dừng do sai số nhỏ hoặc thêm runtime QA cảm xúc/feedback. Phần engine chưa hỗ trợ phải được nêu rõ, không khẳng định đã đạt.

### P5 — Giảm request và đo lại

- Bỏ casting khi đủ khóa; chốt cách chia sẻ giọng nhóm hay unique voice từng nhân vật.
- Phân vai bổ sung chỉ phần thiếu, retry yêu cầu gốc nếu AI lỗi; không dialogue repair bằng feedback.
- Áp dụng chiến lược staging/SFX đã duyệt; metadata đầy đủ để không chạy lại ngoài ý muốn.
- Không thêm vòng QA/biên tập feedback; SEO/thumbnail packaging sau script chốt và không chặn render video nếu là phần tùy chọn.
- Đo số request thực tế, retry, thời gian, token/cost nếu có; không dùng 20 làm hard quota.
- Không thêm AI xem ảnh. Giữ story/style qua dữ liệu đầu vào và cache/asset identity; đánh giá chất lượng offline khi phát triển, không biến thành gate gọi lại trong mọi video.

Nghiệm thu: giảm call, không feedback/AI review ảnh; một lần nhấn Phân tích tự tạo video thực khi AI trả dữ liệu dùng được; QA, tác vụ phụ và sai số thời lượng nhỏ không ngắt luồng.

### P6 — Hồi quy và cập nhật tài liệu

- Bộ mẫu: ngắn/dài; 2D/3D; motion on/off; factual/fictional; object-only; có/không ảnh; kho đủ/thiếu/trùng tên; voice khóa/tự chọn; ASR on/off; resume/cancel; một task fallback rồi task kế tiếp.
- Voice mood: cùng location nhưng cảm xúc đổi theo beat; cùng câu/voice với delivery khác; narrator khác cảm xúc vai; chuyển buồn → căng thẳng → nhẹ nhõm; cache chỉ invalidate clip liên quan. Nghe offline để xác minh thay đổi thực, không chỉ test rằng emotion được truyền/hashing.
- Kiểm tra chính xác chuỗi lỗi toàn phần: ChatGPT, ChatGPT, ChatGPT, Claude, Claude, Claude, ChatGPT; kiểm tra thành công sớm, partial batch, resume, concurrency và cooldown không làm chuyển provider sớm.
- Stub routing và validator tests trước, sau đó render/audio integration theo thay đổi; chạy provider thật có kiểm soát khi cần xác nhận tích hợp.
- Chỉ chạy live/e2e khi fixture/runtime đủ; ghi rõ phần chưa xác minh.
- Kiểm tra các ca AI hết lượt/timeout/không trả dữ liệu, cache khác revision/style, phản hồi cũ về trễ và hủy. AI lỗi mới kích hoạt retry theo policy; completed phải có video thật.
- Thêm ca cần tiếp tục: thiếu metadata tùy chọn, cảnh báo thẩm mỹ, độ dài gần mục tiêu, lỗi preview/tác vụ phụ phục hồi được. Các ca này không được dừng chuỗi chỉ vì QA.
- Kiểm tra cả đường cache/resume/preview/export và auto completion từ nút Phân tích; không gọi thêm AI để review ảnh hay nhận feedback ở bất kỳ nhánh nào.
- Cập nhật tài liệu cũ sau khi implementation ổn định, không dùng tài liệu lịch sử thay mã hiện tại.

Các kiểm tra chất lượng hình ảnh/nội dung ở giai đoạn phát triển là đánh giá offline trên fixture, không được vô tình biến thành request QA hoặc điều kiện chặn trong đường chạy sản phẩm.

### 10.1. Thứ tự phụ thuộc và tiêu chí hoàn tất đợt code

1. P0/coordinator xác định điều kiện hoàn thành, checkpoint và error classification; P1/P2 cùng dùng chính sách đó để không đếm retry hai lần hoặc giữ feedback.
2. P3 sửa định danh/style kho trước khi nối đầy đủ tài nguyên vào pipeline mới. P4 tách tạo clip khỏi mix trước khi yêu cầu staging chờ timing voice.
3. P5 giảm request sau khi các producer/consumer đã thống nhất; không bỏ lượt chỉ vì muốn đạt 20.
4. P6 xác nhận cả pipeline. Không coi đợt code xong chỉ vì routing helper đúng hoặc một unit test đạt.

Nghiệm thu cuối: một lần nhấn Phân tích tạo được video có tiếng nói theo tâm trạng phân cảnh và đúng voice identity, đúng dữ liệu câu chuyện/style được truyền và tài nguyên hợp lệ; không có AI review ảnh/feedback; sai số thời lượng nhỏ không chặn; retry/provider theo đúng chu kỳ; checkpoint/cache không dùng kết quả sai revision/delivery; UI báo completed gắn với video thực. Phần chưa chạy live hoặc TTS chưa hỗ trợ phải ghi rõ, không khẳng định đã được chứng minh.

### 10.2. Các lựa chọn thiết kế còn là đề xuất

Không mở lại các quyết định retry/QA/thời lượng/tự hoàn thành đã chốt. Những lựa chọn còn cần ghi rõ khi bắt đầu triển khai gồm: scope routing ngoài bối cảnh, model cụ thể, có đưa voice-first vào ngay đợt này hay chia bước, cách gộp SFX và cách chia sẻ giọng đã khóa cho nhiều vai cùng nhóm. Các phương án đề xuất trong tài liệu không được tự gắn nhãn người dùng đã duyệt.

Voice theo tâm trạng là yêu cầu đã có, không phải tùy chọn bỏ qua; cơ chế TTS/adapter và việc thay provider nếu cần vẫn là thiết kế cần xác minh khả năng thực tế, chưa có quyền tự đổi nhà cung cấp.

## 11. Bằng chứng kiểm tra đã có và giới hạn

- `scripts/verify-motion-voice.ts`: đã chạy đạt trong lượt audit (AI/TTS được stub trong test, có kiểm tra cache/timeline/audio xử lý).
- `scripts/verify-motion-scene-contract.ts`: không đạt tại expectation ném lỗi sau 3 lần; mã hiện trả beat lỗi để luồng trên xử lý tiếp. Cần đối chiếu/hợp nhất kỳ vọng, chưa kết luận do thay đổi mới.
- `scripts/verify-motion-voice-ui.ts`: không hoàn tất do fixture trỏ tới MP4 không tồn tại, không dùng làm bằng chứng UI đã đạt.
- Kiểm tra đọc kho: 635 asset, thống kê và file như phần 7; không sửa/xóa kho.
- Ba kiểm tra tái hiện đã đạt: shared-2d lọt query 3D; import cùng tên khác nội dung bị bỏ; place key trùng bị mất một entry.
- Đã tái hiện lựa chọn voice khóa chỉ áp dụng vai đầu cùng nhóm khi voice đó đã dùng.
- Đã đo độ dài khối prompt và số lần DNA lặp bằng script, không gọi model thật.
- Lượt chuẩn bị code routing bị người dùng ngắt; không có patch mã ứng dụng được áp dụng. File log tsc rỗng không chứng minh typecheck đã đạt.
- Chưa chạy một video thật xuyên suốt để so chất lượng hình ảnh/âm thanh; chưa benchmark trước/sau các đề xuất.

## 12. Bản đồ mã nguồn

| File | Nội dung cần xem |
| --- | --- |
| `src/features/motion/hooks/useMotionStudio.ts` | Luồng UI, auto continue, compile/render, state/cache |
| `src/features/motion/server/controllers/motionVideoController.ts` | Endpoint/jobs, scenes trước voice, seed/import |
| `src/features/motion/server/routes/motionVideoRoutes.ts` | Route API |
| `src/features/motion/lib/motionSceneAi.ts` | Chọn AI vẽ hiện cố định Claude |
| `src/server/services/motionStoryService.ts` | runMotionAi, session/count/retry, analysis/chapter/edit |
| `src/server/services/geminiService.ts`, `freeAiProviderService.ts` | Routing API, fallback model/provider |
| `src/server/services/motionGenService.ts` | Bible/location/staging/sound, dùng/lưu kho, preview |
| `src/server/services/motionSceneLibraryService.ts` | ID/style/catalog/ranking/save/import/export |
| `src/constants/motionSceneTraits.ts`, `src/lib/motionSceneTraits.ts`, `motionRedress.ts` | Traits, điểm chọn, sửa đạo cụ |
| `src/server/services/motionAssetLibraryService.ts` | Kho model ngoài, chọn/tải model |
| `src/constants/motionGenPrompts.ts`, `motionRuntime.ts`, `motionReference.ts` | Prompt/schema ví dụ/style |
| `src/lib/motionDirection.ts`, `motionVideoDna.ts` | Ghép DNA và hợp đồng kế hoạch |
| `src/lib/motionVoice.ts`, `motionAudioDirection.ts` | Chọn voice, normalize, signature/direction |
| `src/server/services/motionVoiceDirectionService.ts`, `motionVoiceLibraryService.ts` | Casting, dialogue repair, channel |
| `src/server/services/motionAudioService.ts`, `motionVoiceSourceService.ts` | Clip/cache/mix, chọn VieNeu/AI33 |
| `src/server/services/vieneuTtsService.ts`, `python_scripts/motion_vieneu_worker.py`, `src/server/services/ai33TtsService.ts` | Runtime voice/ASR và remote TTS |
| `src/server/services/motionDirectorService.ts` | Compile thời lượng, speech ranges, subtitle/SFX |
| `src/server/services/motionSeoService.ts`, `motionThumbnailService.ts` | SEO và thumbnail |
| `motion-engine/gen-scene.js`, `gen-build.js`, `gen-core.js` | Render/focus/hide, node names và validation |
| `src/types/motionVideo.ts` | Types cần mở rộng khi chốt implementation |

Lưu ý: `docs/motion-multi-voice-plan.md` và `docs/motion-first-pass-production.md` có mô tả lịch sử khác mã hiện tại (ví dụ AI33, UI voice, AI review ảnh). Không ghi đè tài liệu cũ ở lượt chuẩn bị này; lúc code phải đối chiếu lại và cập nhật theo hành vi thực tế đã kiểm chứng.
