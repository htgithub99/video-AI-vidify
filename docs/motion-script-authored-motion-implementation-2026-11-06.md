# Chuyển động do AI viết cùng kịch bản

Ngày 06/11/2026. Đây là hướng hiện hành theo chỉ đạo mới của người dùng, thay cho bộ luật hành động ghép bằng code đã thử trước đó.

Bổ sung triển khai mới nhất và giới hạn nghiệm thu được ghi tại `motion-detailed-action-authoring-2026-11-06.md`: AI phân cảnh trả `actionPlan` có cấu trúc theo chủ thể/bộ phận/các pha và đưa nguyên dữ liệu đó vào lượt vẽ.

## Luồng hiện tại

1. AI viết kịch bản trả thêm `beat.motionIntent` trong cùng phản hồi. Đây là văn bản đạo diễn, không phải lời đọc: AI mô tả trạng thái đầu, diễn biến hành động, trạng thái cuối và các điểm cầm/nắm/tựa/cưỡi/trao vật. AI quyết định ai hoạt động, ai đứng yên và bộ phận phù hợp theo nội dung nguồn và kiểu hình.
2. Chuẩn hóa và lưu kịch bản giữ nguyên chuỗi này, không cắt 400 ký tự như trường action cũ, không sửa lời hay gán mẫu bước đi/gật đầu theo từ khóa.
3. Nếu biên tập làm đổi sự kiện, AI biên tập nhận mô tả cũ và trả mô tả đã cập nhật cùng bản sửa. Cache biên tập lưu cả mô tả này; không để mất khi tiếp tục.
4. Phân cảnh nhận dữ liệu đã viết. Khi dựng, tool chọn các nhịp nguồn thật trong `sourceBeatIds` của cảnh, không nhầm `beatId` nhóm với nhịp lời dẫn đang vẽ. Khi một hình phủ nhiều nhịp, chuyển các mô tả liên quan và lời dẫn nguồn, giữ thứ tự kịch bản. Phần chỉ phủ một đoạn dùng lời dẫn cảnh để giới hạn sự kiện được thể hiện.
   Bổ sung theo yêu cầu mới: chính AI phân cảnh trả `scene.actionPlan` chi tiết trong cùng response scenes. Dữ liệu này dùng đúng node ID của shot, nêu từng chủ thể, diễn biến bộ phận, trạng thái đầu/cuối, tương tác và liên kết. Code không tự tạo nội dung mô tả này. Đoạn văn `scene.motionIntent` của bản thử trước vẫn đọc được để tương thích, nhưng phân cảnh mới dùng các trường có cấu trúc để tránh chỉ chép lại một đoạn chung.
5. AI vẽ nhận nguyên văn các `motionIntent` trong prompt cùng các mẫu hình/nhận diện/tham chiếu hiện có. Một phản hồi trả SVG và animation hoàn chỉnh. Code không tự tạo gait/IK, chỉnh tay chân, thêm track hoặc thay keyframe.
6. Lưu và render. Không có AI đạo diễn motion sau vẽ, QA hình hay vòng tự vẽ/sửa lại. Phản hồi sai schema được giữ và báo; không đánh dấu hoàn thành hoặc lặng lẽ bỏ track lỗi.

Yêu cầu viết phần START / SUBJECT ACTIONS / INTERACTIONS / END / ENVIRONMENT-CAMERA là định dạng để AI mô tả đủ ý, không quy định sẵn ai phải chạy/đánh/ngã. Mỗi chủ thể tham gia có mục riêng: tư thế/điểm tựa ban đầu; hướng và tiến độ; các bộ phận liên quan thay đổi như thế nào qua từng pha; phản ứng và tư thế cuối; người/vật còn đứng yên. AI phân biệt chuyển cả thân/vật chở với chuyển động tương đối của bộ phận, thay vì chỉ viết “đám đông tiến lên” hoặc “đánh nhau”. Không có danh sách hành động do code suy ra từ thể loại. Mẫu hình vẫn quy định cấu trúc của profile; mẫu đó không tự quyết định chuyển động.

## Code và tương thích

- `src/constants/motionWriting.ts`, `motionPrompt.ts`: yêu cầu AI viết chuyển động cùng kịch bản; bỏ chỉ dẫn “hình tĩnh đơn giản là đủ” ở nhánh Remotion.
- `src/types/motionVideo.ts`, `motionResponseContract.ts`: thêm trường văn bản tùy chọn cho tương thích dữ liệu cũ. Kịch bản Remotion viết mới phải có trường này ở hợp đồng trả lời; không gọi thêm một AI riêng để tạo motion sau khi đã vẽ.
- `motionStoryService.ts`, `motionEditorialMetadata.ts`, `motionEditorResponse.ts`: bảo toàn trường qua viết, chuẩn hóa, biên tập, sửa nguồn và cache/tiếp tục. Các engine khác không bị yêu cầu thêm trường.
- `motionSceneActionBrief.ts`: chỉ chọn nhịp nguồn và truyền văn bản, không phân loại hành động hoặc sinh luật khớp chi cho từng loại chủ thể. Các bảng luật người/thú/xe và phần liệt kê ép chuyển động đã được gỡ.
- `scenePipeline.ts`, `sceneKeys.ts`: chuyển mô tả vào cả lập phân cảnh và vẽ; hash mô tả khi có để không dùng nhầm hình cũ sau khi mô tả thay đổi. Khi trường không tồn tại, key cũ không bị đổi chỉ do thêm tính năng. Giữ 5 room và phụ thuộc continuity hiện tại.
- `motionActionAuthoring.ts`: tách yêu cầu viết và phân cảnh, giữ chung nguyên tắc mô tả chi tiết. Prompt phân cảnh bỏ câu “optional ambient animation” và giản lược chuyển động; mô tả pose chỉ là trạng thái đầu, không thay cho hành động theo thời gian. Cảnh mới có chỉ dẫn viết từ kịch bản mà thiếu `scene.actionPlan` được báo thiếu dữ liệu ở bước phân cảnh trước khi vẽ, không code điền hoặc chờ sửa sau vẽ.
- Cấu trúc actionPlan: `start`, `subjects:[{nodeId,action,parts:[{name,change}],phases:[{phase,description}],end}]`, `interactions`, `end`, `environment`, `camera`. AI tự chọn bộ phận, viết chuyển động tương đối và từng pha. Tên part là văn bản mô tả, không phải ID SVG do code quy định. Các nodeId phải tham chiếu scene; trạng thái tĩnh được ghi rõ, không bịa hành động để điền bảng.
- Mô tả riêng cảnh được giữ toàn bộ trong schema, lưu scene và prompt vẽ; không cắt theo giới hạn 160 ký tự của camera hoặc 60 ký tự của support. Cache hình tính cả mô tả cảnh; gộp cảnh không được bỏ một mô tả khác hành động. Dữ liệu cũ chưa có trường mới vẫn tương thích, không tự chạy lại toàn dự án.
- Kịch bản/cảnh đã accepted không tự bị viết lại. Kịch bản cũ thiếu mô tả chi tiết vẫn có đường tương thích dùng brief/action đã lưu; không bịa ra motionIntent bằng code. Tính năng đầy đủ áp dụng cho kịch bản được AI viết/cập nhật có mô tả này.
- Các sửa dữ liệu kỹ thuật như ánh xạ ID/loại prop theo node nguồn giữ SVG và animation nguyên bản; chúng không tạo ra hoặc sửa hành động.

## Lỗi Chrome tìm được trong lúc kiểm chứng

`audioService.initPlaywright()` được gọi khi server khởi động. Trước đây nó lấy tab đầu tiên trong Chrome rồi điều hướng sang Labs, có thể lấy trúng room Gemini khi backend tự nạp lại source. Đã đổi sang tab mới do phần audio sở hữu; cleanup chỉ đóng tab đó.

`verify-audio-browser-tab-isolation.ts` chạy hàm bootstrap thật trong Chrome cài thật có cửa sổ, dùng route cục bộ và kết nối context được cô lập: room Gemini và trang Flow đang có giữ URL và không bị đóng khi audio khởi tạo/dọn. Không dùng token thật hoặc gọi dịch vụ ngoài trong test này. Các lần sai origin trước đó được giữ làm bằng chứng, không mặc nhiên quy mọi lần sai origin về cùng nguyên nhân.

## Kiểm chứng

- `test:motion-action-brief`: 96 tổ hợp 3 profile × 4 genre × 8 format; 45 tổ hợp unit/profile. Kiểm mô tả AI được chuyển nguyên văn, không ghép choreography theo loại, không lẫn nhịp không thuộc cảnh và tắt motion vẫn giữ tắt.
- Bổ sung kiểm mô tả cảnh dài, không bị cắt; ảnh giống nhưng hành động khác không bị gộp; hash thay khi mô tả cảnh thay. Pipeline fixture kiểm prompt vẽ nhận nguyên văn cả mô tả của AI viết lẫn AI phân cảnh.
- `verify-motion-script-intent-writing.ts`: dịch vụ viết kịch bản thật với fixture phản hồi; một lần viết trả mô tả, normalize và editor giữ nguyên văn. Không có tác vụ AI motion riêng.
- `test:motion-one-pass`: 18 cảnh fixture, đỉnh 5 worker; mọi lượt vẽ nhận đúng mô tả viết kịch bản; một phản hồi/cảnh; không QA/repair; bảo toàn animation; resume và policy cũ không tự gửi lại.
- TypeScript, rig compatibility, render behavior, camera, log, room lifecycle, Chrome backup và UI có các kiểm chứng liên quan trong đợt triển khai. Fixture/ma trận không được dùng thay kết luận chất lượng live.

## Case Gemini/Chrome thật

Nguồn Granicus `f82fe2c76c1ab22004a52e6147acdf2c`, cảnh 41, nhịp nguồn thật `c3_event_d3759fe88b27`. Production gốc không bị sửa.

- `script-intent-authoring-20261106-v2` dưới `storage/output/motion-video/clip-demo`: dịch vụ viết kịch bản gọi Gemini Flash low thật, nhận `motionIntent` trong một phản hồi nội dung. Các tin ACK nạp context được ghi riêng, không gọi chúng là cảnh.
- `script-intent-drawing-20261106`: chuyển đúng nguyên văn mô tả trên vào `buildRemotionScenes`; một lần vẽ trên Gemini Flash medium, không director/QA/repair; nhận 15 track và render/phát bằng Chrome thật. Đây là kiểm chứng đường truyền. Clip vẫn chủ yếu dùng chuyển cả cụm ở ngựa phụ, chưa đạt mốc động tác 6 ngựa đã duyệt.
- Vì mô tả đầu còn thiên về bố cục, prompt **viết kịch bản** được làm rõ các phần Start/Action/End/Contacts. Đây là chỉnh ở giai đoạn viết, không phải code sửa hình hoặc một vòng tự vẽ lại trong runtime. Các thử nghiệm phiên bản tiếp theo được lưu riêng, không thay kết quả cũ.

Phiên bản mô tả chi tiết mới lưu tại `script-intent-authoring-20261106-v3`: phản hồi AI thật có đủ Start/Action/End/Contacts. AI giữ đúng ID nhịp nguồn và lời dẫn trong response; bộ chuẩn hóa kịch bản có thể gán operational ID mới dựa trên scenePlan. Harness ban đầu chặn khác biệt ID này; đã đọc lại chính response giữ sẵn để kiểm ánh xạ ID nguồn, không gọi AI viết lần nữa và không sửa nội dung mô tả.

Lượt vẽ mới nhất lưu tại `script-intent-drawing-20261106-v3/history-verdict`:

- Policy 5, một lời gọi vẽ nội dung trên Gemini Flash medium; nhận SVG và 20 track; không có AI QA, director hay repair.
- Prompt chứa đúng toàn bộ chuỗi `motionIntent` từ response viết kịch bản. Animation lưu giống nguyên mảng AI trả về. Production nguồn không đổi hash.
- Render và phát trên Chrome cài thật, 1920×1080, 30fps, CRF23, 173 frame và âm thanh nguồn. Từ bắt đầu dịch vụ sinh/lưu khoảng 110,06 giây; render/ghép/phát kiểm khoảng 50,98 giây. Không dùng các số này để dự báo full video.
- **Chưa đạt mốc chất lượng đã duyệt:** sáu ngựa phụ vẫn chủ yếu dịch theo cả cụm, thiếu chuyển động chân độc lập; có nguy cơ trông như trượt. Đã ghi `qualityStatus` chưa đạt trong verification, không tự sửa track hoặc gửi AI vẽ lại trong pipeline.

Đường truyền và chính sách một lượt đã được kiểm chứng; mục tiêu “mỗi phản hồi đầu đều là cảnh hoàn chỉnh đúng mọi động tác” **chưa được nghiệm thu**. Không gắn chất lượng đạt chỉ vì JSON/render hợp lệ. Các lần thử prompt khác nhau trong phát triển là các thử nghiệm riêng, không gọi tổng các lần đó là một lần vẽ thành công.

Chưa chạy full video 98 cảnh hoặc xác nhận 12 tổ hợp live theo chính sách mới. Bộ 12 tổ hợp hướng luật ghép bằng code đã dừng khi người dùng đổi hướng; không dùng nó để báo chính sách mới đã kiểm đủ live.

## Trạng thái bàn giao

- `npm run test:motion-script-intent` đạt: dịch vụ viết/editor, 96 tổ hợp dữ liệu prompt, 45 tổ hợp unit/profile và pipeline 18 cảnh/5 worker.
- `npx tsc --noEmit` và `git diff --check` đạt. Git có thông báo quy đổi LF/CRLF ở test rig, không có lỗi whitespace.
- Kiểm audio bootstrap bằng Chrome có cửa sổ đạt; backend dev tự nạp source bằng `tsx watch`. Không đóng gói Electron/release, không commit/stage hay ghi đè production nguồn.
- Chức năng mới nằm trong source và đường chạy dev. Kịch bản cũ không bị tự sinh thêm mô tả hay tự dựng lại; muốn có chỉ dẫn mới cần AI viết/cập nhật kịch bản với trường mô tả này.
