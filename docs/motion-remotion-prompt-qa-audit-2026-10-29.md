# Rà soát prompt và QA Remotion — 29/10/2026

## Phạm vi và trạng thái

Đã kiểm tra luồng nguồn → DNA → phát triển truyện → viết chương → phân cảnh → dựng SVG → chuyển động → duyệt/sửa ảnh → SEO/giọng → biên dịch timeline. Các mục 1–5 ghi nhận hiện trạng tại thời điểm audit, trước khi sửa. Phần 6 cập nhật kết quả triển khai sau khi người dùng yêu cầu đối ứng và giữ nguyên cấu trúc prompt dựng cảnh của ba kiểu hình.

## 1. Luồng prompt thực tế

| Công việc | AI sử dụng | Khi nào phát sinh | Nhận xét |
| --- | --- | --- | --- |
| Đọc nguồn theo phần, tạo sổ sự kiện | Hỗ trợ nội dung | Nguồn cần chia nhỏ | Cần giữ dữ kiện và kết truyện; không chia vụn chỉ vì hướng dẫn phong cách dài |
| Phân tích nguồn và DNA lõi | Hỗ trợ nội dung | Lượt mới hoặc dữ liệu không còn phù hợp | Prompt lớn, vẫn nhận hướng dẫn tạo hình chi tiết qua capability |
| Bổ sung hồ sơ DNA | Hỗ trợ nội dung | Hồ sơ chưa đủ hoặc sai schema | Có giới hạn, thất bại có thể giữ DNA lõi; không phải luôn chạy |
| Xác định chủ đề, phát triển truyện mới, DNA truyện mới | Hỗ trợ nội dung | Thể loại sáng tác tương ứng | Cần giữ phân biệt nguồn và truyện mới; có hướng dẫn hình bị lặp |
| Viết chương và sửa trường bị lỗi | Hỗ trợ nội dung | Theo chương/cụm sự kiện | Giữ sửa từng phần; số chữ thông thường hiện đã là cảnh báo |
| Biên tập lời kể | Hỗ trợ nội dung | Hoàn thành nhiều chương, editorPass bật | Lượt riêng có mục đích khác với dựng cảnh; có checkpoint và xử lý lỗi riêng |
| Đọc/chia phân cảnh Remotion | Hỗ trợ nội dung | Nhóm lời kể chưa có phân cảnh hợp lệ | Cần bảo đảm mỗi câu thoại nằm đúng một khoảng cảnh; chưa phải lượt vẽ |
| Trả design + SVG + layers + animations | Dựng video minh họa | Cảnh mới hoặc người dùng tạo lại cảnh | Đã gộp thiết kế và vẽ; tầng gửi tin và contract vẫn có thể phát sinh nhiều lượt |
| Bổ sung chuyển động | Dựng video minh họa | Review bật và QA báo thiếu kênh | Có nguy cơ gọi thêm vì chuyển động phụ |
| Duyệt ảnh | Hỗ trợ nội dung | Review bật | Render ảnh tại máy rồi gửi review; có tối đa 3 vòng duyệt |
| Sửa cảnh bị từ chối | Dựng video minh họa | QA kỹ thuật hoặc review từ chối | Các contract có ngân sách riêng; chưa có một ngân sách chung cho toàn bộ cảnh |
| Chọn giọng, phân lời thoại | Hỗ trợ nội dung | Chưa có lựa chọn/utterances hợp lệ | Không dùng AI dựng hình; không cần truyền bộ luật vẽ SVG |
| SEO | Hỗ trợ nội dung | Chưa có kết quả phù hợp kịch bản | Prompt tương đối ngắn, sửa riêng phương án thiếu/sai |
| Ghép timeline, camera, phụ đề, xuất video | Code | Đủ đầu vào để dựng | Không cần thêm AI thiết kế cảnh |

Nguồn chính: `src/server/services/motionStoryService.ts`, `motionProductionActions.ts`, `motionProductionService.ts`, `motionSeoService.ts`, `motionVoiceDirectionService.ts`, `remotion/scenePipeline.ts` và `remotion/storyCompiler.ts`.

## 2. Các phát hiện cần xử lý

### P0 — Tắt review vẫn tự gọi sửa cảnh

- `scenePipeline.ts:89–106` đặt singleResponse/strictProvider nhưng lấy attempts, routeAttempts và budget từ `C.GUARD.ATTEMPTS`.
- Giá trị hiện tại là **3**, tại `src/constants/motionSceneComposition.ts:29`.
- `requestMotionAiContract` vẫn gọi `contract.repair(...)` nếu assess từ chối và còn lượt. singleResponse ở lớp kết nối không vô hiệu hóa vòng sửa nội dung này.
- `compositionMissingNodes` được gọi cả khi review tắt; thiếu nhóm theo ID vẫn bị từ chối.
- Mô phỏng đúng `buildRemotionScenes`: review=false, SVG có nền render được nhưng thiếu nhóm nhân vật → **3 yêu cầu dựng, có prompt Repair, cuối cùng cảnh failed**. Không gọi AI thật.

Hướng xử lý: review tắt chỉ cho một phản hồi dựng. Chuẩn hóa kỹ thuật tại máy, giữ hình render được theo chính sách đã chốt, ghi cảnh báo phù hợp; ảnh không render được dùng placeholder và cho tạo lại riêng cảnh. Không tự gửi sửa nội dung/SVG, bổ sung chuyển động hoặc đổi AI.

### P0 — Prompt cơ sở đã vượt ngân sách trước khi có dữ liệu cảnh

Đo bằng chính `C.PROMPT`, `motionIllustrationDirection` và `motionCompositionReference` hiện tại, với context chỉ chứa profile, artDirection và drawingReference:

| Kiểu hình | Ký tự prompt cơ sở | Đã bao gồm lời kể/cast/scene đầy đủ? |
| --- | ---: | --- |
| Truyện ma | 22.584 | Chưa |
| Lịch sử | 22.535 | Chưa |
| Giải thích | 17.602 | Chưa |

- Riêng hướng dẫn chung `C.PROMPT({})`: **7.539 ký tự**.
- Schema composition được tầng gọi bổ sung: **1.293 ký tự**, chưa tính chỉ thị SVG, requestId và chỉ thị giao diện chat.
- Ngân sách Motion hiện là **16.000 ký tự**. Đây là ngưỡng do tool đặt, không phải giới hạn ngữ cảnh đã xác minh của model.
- `planningPromptTransport` chia thành phần ngữ cảnh có xác nhận, sau đó gửi lệnh thực thi. Một yêu cầu vẽ logic có thể thành 2–3 phần nạp và một lệnh thực thi; xác nhận sai còn có thể phát sinh prompt sửa biên nhận.
- Log request trong ảnh `motion_remotion_composition-1d16bda7`: 18.957 ký tự, 2 phần nạp.
- Log ngày 29/10 có 3 bản ghi composition, cả 3 vượt ngân sách: 18.957–20.042 ký tự. Đây là số của các lượt đã ghi log, khác với phép đo prompt cơ sở trên code hiện tại.

Hướng xử lý: rút gọn và đo toàn bộ tin cuối sau mọi lớp bọc. Prompt dựng cảnh phải có chính sách gửi một tin riêng; không chỉ tăng một hằng số rồi vẫn để tầng transport tự chia. Với ngữ cảnh lớn, thu gọn dữ liệu có cấu trúc và loại phần trùng trước; giữ các dữ kiện chính của cảnh.

### P0 — Prompt sửa không tách được context nên mang lại cả prompt gốc

- `repairContext()` lấy phần sau `Context:\n` rồi JSON.parse toàn bộ phần còn lại.
- `C.PROMPT` hiện đặt `FINAL REMINDER` phía sau JSON context, làm JSON.parse thất bại.
- Nhánh catch trả nguyên chuỗi base. Prompt sửa vì vậy lại chứa hướng dẫn gốc, drawingReference hoặc continuity, rồi thêm draft SVG và errors.
- Kiểm tra sentinel đã xác nhận prompt sửa chứa nguyên base dưới dạng chuỗi, vẫn giữ reference và continuity vốn dự định bỏ ra.

Hướng xử lý: truyền context dạng object trực tiếp vào builder sửa; không cắt/parse prompt văn bản. Chỉ gửi nhóm cần sửa, lỗi cụ thể, dữ kiện liên quan và phần hình cần đối chiếu. Không chép cả SVG hai lần khi đã có acceptedScene/draft.

### P1 — Hướng dẫn lặp và mâu thuẫn giữa các lớp

1. `C.PROMPT` đòi code block JSON ở đầu/cuối, trong khi wrapper `MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT` yêu cầu JSON thô, không markdown. Cần một quy ước duy nhất.
2. Quy tắc không tạo ảnh raster, không HTML/JS/URL, SVG tự chứa, đủ thẻ đóng, giữ danh tính và quan hệ được nhắc ở C.PROMPT, artDirection, craft reference, VECTOR_INSTRUCTION và prompt sửa. Giữ một nguồn chuẩn cho từng loại quy tắc.
3. C.PROMPT chứa quy tắc sửa groupPatches/repairOnly ngay cả khi đang vẽ mới. Nên chỉ có ở prompt sửa.
4. Profile, grammar, anatomy, layouts và SVG mẫu cùng mô tả lại một bộ tỷ lệ/tạo hình. Chọn một mẫu nhân vật ngắn làm chuẩn, còn profile chỉ mô tả khác biệt và biến thể.
5. Luật anatomy chung nói về cổ/tay/ngón tay, còn profile truyện ma hiện dùng đầu mặt nạ, không cổ, thân dạng rối và có luật ưu tiên ghi đè. Tuy có chỉ dẫn ưu tiên, vẫn tạo tải đọc và xung đột không cần thiết. Chỉ đưa luật phù hợp profile vào prompt cuối.
6. `motionIllustrationDirection(..., 'drawing')` luôn đưa toàn bộ hướng dẫn motion/speech dù actors=fixed hoặc sceneEffects=off. Nên bỏ phần hướng dẫn kênh đã tắt ngay lúc dựng prompt.
7. `developCreativeStory` đã đặt `motionVisualCapability(...)` trong promptInput.directive, lại nối cùng capability vào prompt cuối. Cần bỏ bản lặp và chỉ giữ chỉ dẫn minh họa ở mức nội dung cho AI viết truyện.
8. `withMotionResponsePrompt` có kiểm tránh chèn lại nguyên schema khi đã có; không nên quy kết tất cả schema đều bị append hai lần. Phần cần giảm là mô tả schema lặp bằng văn xuôi/ví dụ và bộ trường không dùng cho tác vụ.

### P1 — Phân cảnh còn yêu cầu dữ liệu không phù hợp cách vẽ nguyên cảnh

- `P.SCENE` ghép `L.CONTINUITY_POLICY`, yêu cầu dùng object catalog IDs, nhưng context gọi phân cảnh không truyền object catalog tương ứng.
- Schema còn quảng bá attachmentAnchor, mount, contact và trường dùng cho ghép từng asset. Những trường này không phải điều kiện để AI tự vẽ cả cảnh.
- Context phân cảnh có cả beat đầu và beats chứa lại beat đó; cast được truyền toàn bộ. priorFacts đã có giới hạn 3.200 ký tự, không tăng vô hạn, nhưng còn có thể lọc theo địa điểm/nhân vật/vật thể liên quan.
- Profile truyện ma yêu cầu **mọi đồ vật cụ thể được nhắc phải thành prop node riêng**. Điều này có thể biến đồ vật chỉ được kể đến, đồ trang trí và chi tiết phụ thành yêu cầu bắt buộc; QA lại đòi đủ nhóm theo ID. Đây là một nguyên nhân làm cảnh rối và phát sinh sửa dù hình minh họa chính đã phù hợp.

Hướng xử lý: phân biệt chủ thể nhìn thấy, manh mối bắt buộc, chi tiết trang trí và đồ vật chỉ được nhắc. Chỉ khóa ID cho chủ thể thực sự cần thể hiện. Cùng một vật giữ danh tính khi tái xuất; không yêu cầu catalog không được cung cấp.

### P1 — Tham chiếu đang truyền quá nhiều phần trùng

- Cảnh đầu nhận luật profile, mẫu nhân vật và cả SVG craft reference.
- Cảnh cùng địa điểm nhận text, layers, design, notes và có thể toàn bộ SVG tham chiếu tối đa 24.000 ký tự.
- Các dữ liệu này cùng mô tả mặt người, trang phục, đồ đạc và vị trí. Prompt vẽ mới dài; prompt sửa còn có thể lặp lại vì lỗi repairContext.

Hướng xử lý: giữ hồ sơ nhân vật/địa điểm ngắn, trạng thái đang có và phần tham chiếu cần cho cảnh. Dùng SVG tham chiếu khi thật sự cần cấu trúc hình; không vừa gửi nhiều mô tả dài vừa gửi nguyên hình nếu chúng không bổ sung thông tin. Không lược bỏ danh tính, màu được thoại nêu hoặc quan hệ quan trọng.

### P1 — QA review bật còn bắt chuyển động và metadata quá sớm

- `motionCompositionMissingChannels` xem thiếu actor/effect channel là thiếu cấu hình trong các trường hợp tương ứng.
- Khi review bật, code gọi bổ sung chuyển động trước `ensureActorMotion()`, dù hàm sau có thể bổ sung một số chuyển động nhẹ tại máy.
- Chỉ một lớp effect chưa có animation cũng có thể kích hoạt yêu cầu bổ sung; prompt lại cho animations=[] khi không có chuyển động phù hợp.
- Nhánh review bật dùng normalizeSceneComposition nghiêm: design hiện diện nhưng sai đơn vị/box hoặc một animation lỗi có thể từ chối cả phản hồi có SVG tốt. Nhánh review tắt đã biết bỏ design/animation không hợp lệ và giữ SVG.
- Sau đó còn vòng review ảnh tối đa 3 lượt; mỗi review/repair là contract riêng, có thể phát sinh nhiều phản hồi. Không được hiểu 3 vòng là tối đa 3 request cho cả cảnh.

Hướng xử lý: thiếu chuyển động phụ, nháy mắt, miệng, nhịp thở hoặc metadata thiết kế không nên tự động làm hỏng hình minh họa hợp lệ. Lọc track lỗi và ghi cảnh báo; chỉ yêu cầu sửa khi ảnh có lỗi nội dung chính đã được duyệt xác nhận. Giữ công tắc chuyển động độc lập với review.

### P2 — Còn prompt cũ và test chưa đồng bộ

- Không tìm thấy caller chạy production cho `MOTION_REMOTION_PROMPTS.ASSET`, `ANCHOR_REPAIR`, `SCENE_POLICY` trong luồng mới. ASSET vẫn được test cũ sử dụng.
- Không xóa toàn bộ renderer/layout/anchor cũ chỉ vì prompt cũ không còn được gọi: chúng vẫn có nhánh đọc dữ liệu cảnh cũ, preview và kiểm spec. Cần tách tương thích dữ liệu cũ khỏi đường tạo mới trước.
- Hai test hiện thất bại ở kỳ vọng số request chuyển động, cho thấy chính sách mới và test chưa đồng bộ; chưa thể coi bộ single-draw/profile đang xanh hoàn toàn.

## 3. QA nên giữ và QA nên hạ

| Nhóm | Mức đề xuất | Xử lý |
| --- | --- | --- |
| Không có JSON/SVG sử dụng được, XML hỏng không phục hồi được, script/tài nguyên ngoài, kích thước không hữu hạn | Bắt buộc về kỹ thuật | Không render dữ liệu lỗi; cô lập cảnh, giữ thoại/timeline và cho tạo lại |
| Timeline bỏ sót/trùng câu thoại, ID nhân vật không xác định, audio rỗng/hỏng, frame không liên tục | Bắt buộc | Sửa đúng dữ liệu lỗi; không nới đến mức làm sai nội dung hoặc mất tiếng |
| Sai người, màu được thoại nêu, địa điểm, số lượng quan trọng, chủ sở hữu, manh mối chính, quan hệ không gian gây hiểu sai | Duyệt nội dung khi review bật | Sửa đúng phần có bằng chứng nhìn thấy; không chép lại cả cảnh chỉ vì góp ý chung |
| Design thiếu/sai tọa độ phụ, tên lớp không khớp nhưng hình render được, track chuyển động lỗi | Chuẩn hóa/cảnh báo | Giữ hình, bỏ metadata không dùng được theo chính sách review; không tự sinh thêm request khi review tắt |
| Tư thế phụ, mở cửa/đi lại/nhìn/ngồi, trang trí, bố cục ưa thích, chi tiết phong cách nhỏ | Góp ý | Không chặn cảnh hoặc video |
| Không có nháy mắt, cử động miệng, thở hoặc hiệu ứng phụ | Góp ý | Không từ chối ảnh tĩnh phù hợp chỉ vì thiếu animation |
| Số chữ từng chương | Giữ cơ chế cảnh báo hiện tại | Hiện code đã không viết lại chỉ để khớp số chữ khi viết bình thường |
| Thời lượng thực | Khoảng mềm, không đúng tuyệt đối | Hiện ±25% là warning, dưới 50% hoặc trên 175% là error; sau một vòng sửa vẫn có thể dừng. Với audio đầy đủ và ưu tiên hoàn thành, nên cho tiếp tục bằng thời lượng thật kèm cảnh báo thay vì cố ép đúng mục tiêu |

Review hiện đã coi aesthetic/incidental_pose/framing/uncertain là advisory khi không có check thuộc nhóm critical. Tuy nhiên prompt review nói có thể chặn chủ thể bị cắt/không đọc được hoặc giải phẫu rời nghiêm trọng, trong khi category framing được coi nhẹ và chưa có category riêng cho giải phẫu. Cần thống nhất prompt, category và mức độ; không giải quyết bằng cách cho mọi góp ý framing quyền chặn.

## 4. Thứ tự đối ứng đề xuất

1. Khóa đúng chính sách review OFF: một phản hồi dựng; không sửa bằng AI; lỗi một cảnh không dừng các cảnh còn lại.
2. Tách builder mới/sửa/review/bổ sung metadata; truyền object context thay vì parse lại chuỗi prompt.
3. Rút gọn prompt theo profile và kênh bật, thống nhất JSON output, bỏ capability lặp và luật cũ không liên quan.
4. Đo sau mọi wrapper và chỉ thị giao diện; bảo đảm tin vẽ cuối đi một lượt. Không cắt tùy tiện nguồn hoặc nâng ngưỡng toàn bộ các tác vụ khác.
5. Giảm schema phân cảnh xuống dữ liệu thật sự phục vụ vẽ nguyên cảnh; tách vật bắt buộc khỏi vật phụ/được nhắc.
6. Chuẩn hóa QA: kỹ thuật bắt buộc, nội dung chính theo review, metadata/chuyển động/chi tiết phụ cảnh báo. Đặt ngân sách request cho cả cảnh khi review bật.
7. Tách và dọn prompt asset cũ sau khi xác nhận tương thích dữ liệu cũ; giữ luồng kho tài nguyên.
8. Sửa test theo hành vi đã chốt, kiểm mock đủ ba profile và tổ hợp công tắc; không dùng số request sửa cao làm tiêu chí đúng.

## 5. Kiểm chứng đã chạy

- Đo chiều dài builder, schema và từng phần artDirection bằng code thật.
- Sentinel xác nhận lỗi repairContext giữ nguyên base/reference/continuity.
- Mock buildRemotionScenes xác nhận review OFF vẫn có 3 yêu cầu khi thiếu nhóm; không AI thật, không video.
- `verify-motion-prompt-transport.ts`: PASS. Test đang xác nhận cơ chế chia prompt hoạt động; không chứng minh yêu cầu một tin mỗi cảnh đã đạt.
- `verify-motion-remotion-qa.ts`: PASS. Bao gồm JSON/SVG/XML, bằng chứng/tư thế phụ, sửa ngữ nghĩa và khoảng câu nguồn.
- `verify-motion-single-draw.ts`: FAIL tại dòng 249, số prompt bổ sung chuyển động thực tế 0, kỳ vọng 4. Chưa chạy đến các ca nằm sau điểm thất bại.
- `verify-motion-illustration-profiles.ts`: FAIL tại dòng 139, số yêu cầu composition thực tế 2, kỳ vọng 4. Không kết luận các ca sau đã đạt.

Kết luận: nguyên nhân tăng request và gián đoạn nằm ở cả cách ghép prompt, tầng transport và chính sách QA/repair. Cần sửa chung các tầng này cho ba profile; chỉ rút ngắn một prompt mẫu hoặc chỉ tăng ngưỡng ký tự sẽ không giải quyết đủ.

## 6. Đã triển khai sau audit

### Ràng buộc được giữ

- Giữ nguyên chính xác nội dung builder `MOTION_SCENE_COMPOSITION.PROMPT`, ba profile và toàn bộ tám file luật/mẫu tạo hình đã đối chiếu bằng SHA-256. Hash builder rỗng: `07e9d733d2f470b2c88fc0b8a22cb29150ef31efef8cec0bc9d899175958c1d8`.
- Vì yêu cầu này, không áp dụng các đề xuất viết lại/rút ngắn anatomy, artDirection, craft example và cấu trúc prompt vẽ mới ở mục 2. Prompt vẫn dài; đã xử lý nguyên nhân chia thành nhiều tin ở tầng gửi.
- Giữ chế độ kho và renderer/layout đọc dữ liệu Remotion cũ. Schema tương thích dữ liệu cũ được giữ; không tiếp tục dùng các prompt vẽ từng asset/anchor không có caller.

### Thay đổi đã làm

1. `motion_remotion_composition` gửi nguyên một tin chat, không tách nạp ngữ cảnh. Các tác vụ khác giữ giới hạn cũ. Log vẫn đo độ dài và báo rõ chính sách gửi một tin.
2. Wrapper composition thống nhất fenced JSON, SVG dạng văn bản với dấu nháy đơn và thẻ thường; bỏ chỉ thị vector/output mâu thuẫn ở tầng ngoài. Request ID và artifact ID vẫn được yêu cầu.
3. Review tắt: attempts/routeAttempts/budget bằng một, strict provider và single response. Không tự sửa, bổ sung animation hay fallback provider sau phản hồi lỗi. Cảnh hỏng được cô lập; tiếp tục cảnh khác, giữ lời kể và có thể tạo lại riêng cảnh.
4. Review bật: chuẩn hóa metadata/animation tại máy; thiếu ID và chẩn đoán hình học là góp ý. Bỏ lượt AI bổ sung chuyển động. Giữ duyệt nội dung chính có bằng chứng, tối đa ba vòng và ngân sách chung sáu lần gọi contract trong một lượt xử lý cảnh.
5. Review không phản hồi hợp lệ: giữ SVG dùng được, ghi cảnh báo, không gắn `reviewKey` thành công và `build.review=false`. Lỗi nghiêm trọng đã được review xác nhận vẫn sửa đúng nhóm; hết lượt thì ghi lỗi ở cảnh và tiếp tục phần còn lại.
6. Prompt sửa nhận object context, bỏ reference/continuity/acceptedScene trùng; không parse lại toàn bộ prompt hoặc sao chép prompt vẽ mới. Luật sửa theo nhóm được giữ.
7. Bỏ capability bị nối hai lần trong phát triển truyện; bỏ dữ liệu beat đầu trùng trong phân cảnh. Luật phân cảnh không còn đòi catalog không truyền vào; chỉ khóa các chủ thể/manh mối cần nhìn thấy.
8. Dọn các builder ASSET/ANCHOR_REPAIR/SCENE_POLICY cũ và năm prompt layout không có caller; giữ constants số học, anchors và renderer tương thích.
9. Remotion không tự viết lại truyện/tạo lại audio chỉ vì thời lượng audio thực khác mục tiêu; ghi cảnh báo và dùng thời lượng thực hợp lệ. Audio rỗng/hỏng và kiểm đầy đủ lời kể vẫn được giữ. Chính sách thời lượng của kho không thay đổi.

### Kiểm chứng sau triển khai

- PASS: prompt transport, single draw, composition, illustration profiles, production runner, Remotion QA, legacy cutouts, render behavior và chat response snapshots.
- Bao gồm cả ba profile, review ON/OFF, SVG tốt nhưng metadata/animation lỗi, nhóm không đúng ID, review không khả dụng, review từ chối danh tính, giới hạn số request, placeholder và tiếp tục/tạo lại riêng cảnh.
- Production runner xác nhận chế độ kho tiếp tục hoạt động và Remotion không tự tạo lại script/audio/cảnh chỉ vì lệch thời lượng audio so với mục tiêu.
- TypeScript, ESLint cho mã nguồn thay đổi và kiểm định dạng được chạy tại máy. Không gọi AI thật hoặc tạo video sản xuất trong lượt đối ứng này; các kết quả trên là kiểm tra giả lập/kỹ thuật, chưa khẳng định chất lượng phản hồi của model thực.
