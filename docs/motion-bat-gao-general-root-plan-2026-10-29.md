# Nguyên nhân gốc và kế hoạch sửa chung sau Bát Gạo Ngoài Cổng

## Phạm vi

Kiểm tra toàn bộ các vấn đề đã trao đổi về hình, voice, giơ tay và SFX. Đối chiếu production `0171ab25909369c6e9f2ca0dec29ff64` với đường chạy code; không xem đây là lỗi riêng một truyện.

Trạng thái ngày 29/10/2026: **đã triển khai các sửa logic chung và kiểm tra offline/giả lập.** Không gọi AI/TTS thật, không tạo video mới và không sửa dữ liệu production gốc. Quy tắc mới áp dụng khi người dùng dựng/tạo lại cảnh; file MP4 cũ không tự thay đổi. Phần hình mới chưa được kiểm chứng bằng một lượt AI vẽ thực tế.

## Các kết luận đã kiểm chứng

| Mục | Chỗ sai đầu tiên / nguyên nhân | Đối ứng chung | Trạng thái |
|---|---|---|---|
| Giơ tay thừa | `motionIllustrationProfiles.ts`: planning ra lệnh người nói/nhấn mạnh giơ tay; drawing dùng một mẫu tay dựng cao; motion thêm vẫy tay. | Mặc định tay nghỉ; ra hiệu là lựa chọn có lý do. Người kể đang thuật lại không khiến mọi nhân vật phải vẫy tay. Giữ cách dựng một request/cảnh. | **Đã triển khai, kiểm tra offline** |
| Tự thêm vẫy tay | `motionHorrorComposition.ts`: fallback có thể thêm arm rotation theo tên nhóm/pivot, không xét hành động cần thiết. | Nếu thiếu chuyển động thì ưu tiên thở nhẹ. Chỉ xoay tay khi có chỉ định phù hợp và vật cầm có liên kết đúng. Log phải phản ánh đúng chuyển động thực sự được thêm. | **Đã triển khai, kiểm tra offline** |
| Cận bàn tay thành cả người | Cảnh 10 khai báo `ban_tay_toi` thành `character/toi`; template lại bắt mọi character vẽ đầy đủ. | Phân biệt thực thể với phần được nhìn thấy/crop. Cho phép hình cận bộ phận hợp lệ, hoặc đổi sang chén làm chủ thể và người đứng cạnh nếu động tác không quan trọng. Không tạo thêm toàn thân chỉ vì cùng entityId. | **Đã triển khai, kiểm tra offline** |
| Đồ vật không theo tay | Cảnh 3: node có heldBy nhưng SVG `bat_gao` chỉ là con scene_canvas. Renderer áp dụng transform, không giải liên kết vật–tay. | Trong cùng lượt vẽ, đặt vật cầm trong nhóm tay/chủ thể hoặc nhóm liên kết chung. Nếu cấu trúc không cho phép cầm rõ ràng, dùng tư thế tĩnh có vật đỡ. Không ép animation làm vật lơ lửng. | **Đã triển khai, kiểm tra offline** |
| Mất áo hoa/nhận diện | Horror profile yêu cầu chỉ đổi ID, vị trí, kích thước, một màu thân, xung đột với ngữ pháp chung về trang phục động theo truyện. | Giữ style và hình học; cho phép lớp áo/phụ kiện đơn giản do truyện yêu cầu. Chi tiết nhận diện phục vụ cốt truyện ưu tiên hơn ví dụ màu/template. Không cần tăng mức chi tiết giải phẫu. | **Đã triển khai, kiểm tra offline** |
| Quay lưng thành lộ mặt; đứng trên ghế | Node có pose nhưng template mặt trước/thân đứng là mẫu bắt buộc, thiếu biến thể quay lưng/ngồi. Quan hệ bố chỉ beside bàn, không biểu diễn rõ vật đỡ ghế. | Có biến thể tĩnh tối thiểu: đứng nghỉ, quay lưng, ngồi có vật đỡ, cầm đồ trước thân. Cho phép đơn giản hóa đứng cạnh ghế khi tư thế không ảnh hưởng truyện. Hướng quay lưng là thông tin thiết yếu nếu tạo suspense. | **Đã triển khai, kiểm tra offline** |
| Hai trạng thái đồ vật cùng hiện | Gộp câu cho ăn và bỏ chén lại thành một cảnh; tạo `bat_gao` và `chen_lanh` như hai node riêng. | Quy về cùng vật nếu nguồn cho thấy cùng vật; chọn một thời điểm minh họa đại diện. Chỉ tách trước/sau khi đổi trạng thái có vai trò nội dung, không chia mọi động từ thành cảnh. Không tự gộp mọi bát/chén trong các truyện khác thành một vật. | **Đã triển khai, kiểm tra offline** |
| Chén chủ đề quá nhỏ | Bước phân cảnh/chọn chủ thể vẫn dùng toàn cảnh dù lời tập trung vào một vật. | Ưu tiên khung đồ vật cho dấu hiệu lạnh, vết máu, lá bùa… khi chúng là trọng tâm. Không đòi thêm hành động chi tiết. | **Đã triển khai, kiểm tra offline** |
| Sai giọng nhập hồn | `motionVoiceAttribution.ts` lọc ghost qua name/key. Cô hồn chiếm thân tên người lạ bị loại, hồn nạn nhân được chọn. | Xác định quan hệ nguồn giọng–cơ thể–hồn bị đẩy ra bằng vai trò và bằng chứng. Không chọn chỉ vì tên có chữ ma. Khi mơ hồ, không tự đổi sang nguồn chưa được xác nhận. Tôn trọng chế độ một/nhiều voice và sửa thủ công. | **Đã triển khai, kiểm tra offline** |
| Bật SFX nhưng 0 cue | Nhánh Remotion trong `motionProductionActions.ts` không truyền/nối SFX planning; pipeline Remotion không có bước lập event. Compiler chỉ đọc beat.data.soundEvents nên danh sách trống. | Nối lập tiếng động bằng AI nội dung khi SFX bật, tái sử dụng event đã đạt. Không dùng AI vẽ để làm SFX. Tắt thì bỏ lập/trộn SFX; nhạc nền vẫn độc lập. Event thiếu hoặc cố ý im lặng không được chặn video. | **Đã triển khai, kiểm tra offline** |
| Không thấy SFX trên UI | `useMotionStudio` có sfx=true và sfxVolume=0.5 nhưng màn cấu hình không render điều khiển. | Toggle **Âm thanh cảnh (SFX)** cạnh Nhạc nền cho cả hai cách dựng, lưu lựa chọn, gửi đúng request. Hiện “Bật · chưa có tiếng động” khi có kết quả biên dịch trống và không còn tác vụ chạy. | **Đã thêm, đã kiểm tra** |

## Các điểm không được sửa sai hướng

1. **Mặt nạ là style đang được khóa**, không gọi bản thân mặt nạ là lỗi SVG. Chỉ sửa xung đột với nhận diện và thông tin cốt truyện.
2. **Bật chuyển động không bắt buộc giơ tay.** Tắt chuyển động chỉ dừng track, không đổi hình gốc sang tư thế nghỉ.
3. **AI duyệt ảnh tắt thì tiếp tục nhận hình và cho người dùng tạo lại riêng cảnh**. Không tự thêm lượt review, sửa ảnh hoặc QA thẩm mỹ chặn dự án.
4. Cùng địa điểm xuất hiện lại không phải lỗi lặp cảnh nếu câu chuyện quay lại nơi đó.
5. Nhịp người kể của bản này đo được đã ổn định. ASR nhầm từ chưa đủ để kết luận TTS đọc sai; không tăng tốc/lọc/nén thêm khi chưa nghe đối chứng.
6. Đây là bản Remotion tự vẽ SVG; các lỗi trên không phải bằng chứng thiếu tài nguyên trong kho. Nhánh dùng kho cần giữ hoạt động và cấu hình âm thanh đúng.

## Các phần đã triển khai

### A. Hợp đồng cảnh và template

- Sửa một nơi quy định độ ưu tiên giữa dữ kiện truyện và ví dụ style, tránh vá từ khóa cho tên nhân vật/địa điểm cụ thể.
- Bỏ quy tắc mặc định nói = giơ tay; bổ sung tư thế nghỉ và biến thể đơn giản.
- Phân biệt toàn thân và cận bộ phận; diễn đạt quan hệ vật đỡ, vật cầm và trạng thái bằng dữ liệu rõ.
- Hợp đồng scene planning chọn thời điểm đại diện; duy trì cùng objectId theo mạch truyện.
- Giữ khung prompt ba kiểu hình đang dùng; chỉ thay các quy tắc gây xung đột, không thêm chuỗi request thiết kế riêng.

### B. Render và continuity

- Không sửa tọa độ AI đã vẽ bằng heuristic riêng cho từng truyện.
- Bảo đảm vật cầm và bộ phận chuyển động có nhóm SVG liên kết; không tự vẫy tay khi liên kết không rõ.
- Các kiểm tra kỹ thuật được giữ: SVG an toàn/render được, ID hợp lệ, không có tham chiếu hỏng. Bố cục/nhận diện có thể cảnh báo khi review tắt, không dừng cả video.
- Đổi revision phù hợp khi đổi hợp đồng để dữ liệu cũ không được báo đã áp dụng quy tắc mới. Không tự xóa bản đã xuất hay dựng lại mọi cảnh.

### C. Voice và SFX

- Sửa suy luận nguồn giọng bằng quan hệ vai trò, tách hồn nạn nhân khỏi cô hồn đang chiếm thân; kiểm tra với nhiều ma/người, trả hồn, tự chọn voice và một người kể.
- Tách/reuse lập SFX thành phần dùng chung, đầu vào từ kịch bản, lời thoại và thời gian voice. Không phụ thuộc phải có kho puppet thì mới lập được âm thanh.
- Không tự phát tiếng do chỉ thấy danh từ; ưu tiên âm thanh thực sự được kể/được yêu cầu, như “tiếng đũa gõ vành bát”. Cảnh im lặng hợp lệ.
- Cấu hình bật/tắt áp dụng cả bước lập event, biên dịch/trộn, xem trước và xuất; lập lại chỉ phần âm thanh thiếu, không dựng lại hình/voice đã đạt.

## Bằng chứng và kiểm tra đã chạy

- `scratch/bat-gao-audit-20261029/root-repro.ts`: tái hiện 4 vấn đề trên production lưu sẵn: gán giọng, 0 sound event/cue, loại node bàn tay, nhóm SVG bát tách khỏi chủ thể cầm. Kết quả `root-repro.json`.
- `npx tsc --noEmit`: đạt.
- `npx tsx scripts/verify-motion-sfx-ui.ts`: đạt; UI thật trong trình duyệt headless, cả Dùng kho và Remotion; mặc định bật của dữ liệu cũ, reload giữ tắt, request gửi đúng bật/tắt, không đổi nhạc nền, hiển thị bật nhưng cue trống. API mock hoàn toàn, không gọi AI/TTS/render.
- Báo cáo ảnh/voice chi tiết: [audit](motion-bat-gao-ngoai-cong-audit-2026-10-29.md).


## Sửa phát hiện thêm trong quá trình triển khai

- `remotion/sceneKeys.ts` trước đây đưa toàn bộ `beat.data` vào khóa hình. Lập SFX xong làm khóa thay đổi và compiler báo cảnh chưa hoàn tất. Khóa hình nay bỏ riêng event, im lặng và trạng thái lập âm thanh; dữ liệu hình thật vẫn làm mất hiệu lực cache khi thay đổi.
- Không ghi/giữ nhãn `soundPlanVersion` khi dựng với SFX tắt ở nhánh kho; event đã lưu vẫn được giữ để dùng lại khi phù hợp. Tăng version kế hoạch âm thanh để bản cũ không giả vờ đã áp dụng logic mới.
- Bật SFX trên cảnh đã dựng: lập riêng âm thanh; không vẽ lại, không lập lại phân cảnh chỉ vì thêm cue. Kết quả hợp lệ được dùng lại khi tiếp tục. Lượt AI âm thanh do AI hỗ trợ nội dung thực hiện.
- Khi nội dung âm thanh đổi, bỏ event/im lặng của đầu vào cũ; lỗi dịch vụ âm thanh cũng tính vào giới hạn thử lại. Không phát cue cũ sai truyện khi AI tạm lỗi.
- Chuyển động có nguy cơ làm vật rời tay bị bỏ ngay ở track; không sửa tọa độ hình hoặc gửi thêm prompt. Hình giữ nguyên để người dùng có thể tạo lại riêng cảnh nếu cần.
- Xuất thủ công lấy nguồn voice, SFX và các cấu hình xuất từ cùng trạng thái hiện tại, tránh trộn lựa chọn cũ trước khi chờ dựng/voice với lựa chọn mới.
- Đã bỏ code tự tạo vẫy tay và các hằng số không còn dùng; chuyển phần lập SFX trùng vào service chung, giữ adapter bối cảnh và giới hạn song song của kho.

## Ma trận cấu hình đã rà

| Nhóm | Dùng kho | Remotion | Kiểm chứng / giới hạn |
|---|---|---|---|
| Nguồn, ngôn ngữ, thời lượng, số phần, thể loại | Đi qua production và biên kịch | Cùng đường nội dung | Kiểm tra request UI và production runner; thời lượng vẫn là mục tiêu mềm, không cam kết đúng từng giây |
| AI nội dung / AI dựng cảnh | Tác vụ nội dung và lập SFX dùng MAIN; dựng dùng DRAW | Phân cảnh/SFX/review dùng MAIN; vẽ dùng DRAW | Test chọn provider/model/browser và request thật của UI với API giả lập |
| Cách dựng, gói kho / kiểu hình, mật độ cảnh | Dùng pack và storyboard của kho | Dùng profile horror/history/explainer và pacing | Test profile, pacing, cache và draft; quy tắc template mới không buộc kho vẽ thêm tài nguyên |
| Chuyển động nhân vật | Chỉ kênh actor | Actor/speech được gated; không tự vẫy tay | Test 8 tổ hợp actor/effect/camera; vật cầm không tách khỏi chủ thể do track bổ sung |
| Hiệu ứng cảnh, camera | Công tắc độc lập | Công tắc độc lập | Tắt actor vẫn có thể có mưa/khói; cần hình/cảnh có track hiệu ứng tương ứng. Không tự thêm request khi AI không vẽ track |
| AI duyệt ảnh | Giữ đường review đã có | Tắt: một lượt vẽ, không AI sửa/review; bật: duyệt tùy chọn | Test single-draw, tiếp tục, tạo lại riêng cảnh, budget review và lỗi cô lập |
| Kênh voice, phân vai, kiểm tra chữ | Lựa chọn chung | Lựa chọn chung | Test 1/nhiều giọng, sửa thủ công, cache tách biệt, giọng nhập hồn. Không thay tốc độ/lọc/nén giọng trong lượt sửa này |
| SFX, âm lượng, chọn tiếng thủ công | Lập qua service chung và compile/mix | Đã nối service và compile/mix | UI giữ khi reload, gửi đúng bật/tắt; im lặng hợp lệ; chỉ bổ sung fallback cho âm thanh nghe được trong lời kể, không vì chỉ có danh từ đồ vật |
| Nhạc nền | Độc lập SFX | Độc lập SFX | Tắt được chuẩn hóa ở render input; mood/volume đi vào chữ ký bản xuất. **Preview tương tác trước khi xuất hiện chỉ có voice/SFX; nhạc được trộn ở bước xuất.** Đây là giới hạn hiện tại, không ghi nhận là đã có nhạc trong preview |
| Phụ đề, tỷ lệ, FPS | Hook/production áp dụng spec xuất | Compiler áp dụng spec | Test tắt phụ đề, timing theo voice, 4 tỷ lệ và FPS; đổi lựa chọn làm bản xem trước/xuất cũ mất hiệu lực phù hợp |
| Chất lượng, encoder | Dùng lựa chọn hỗ trợ | Hiện xuất CPU bằng Remotion | Không hứa GPU cho Remotion; UI/request dùng CPU ở chế độ này |
| Tự chạy tiếp / tự xuất | Điều khiển chuỗi và xuất | Cùng runner | Test persistence, resume, hủy, optional SEO và chống chạy trùng; không chạy video thật |

## Kiểm tra sau triển khai

Đã đạt:

- `npx tsc --noEmit`.
- `verify-motion-scene-consistency.ts`: vật cầm lồng nhóm / tách nhóm, bỏ chuyển động nguy hiểm, không tự vẫy tay, crop, actor/effect độc lập, hồn nhập/nạn nhân, im lặng và SFX fallback. Đối chiếu trực tiếp production Bát Gạo lưu sẵn: nguồn giọng câu “Đói quá” từ `co_hon_sau` được suy luận đúng thành `ba_khach`, không sửa file gốc.
- `verify-motion-single-draw.ts`: giữ một lượt vẽ/cảnh khi tắt review; bật SFX sau khi có hình không làm vẽ/phân cảnh lại; cache âm thanh; tiếp tục và tạo lại riêng cảnh.
- `verify-motion-sfx-ui.ts`: UI thật/real hook trong Chrome headless, hai chế độ, reload, bật/tắt và ma trận request cấu hình. Tất cả API giả lập.
- `verify-motion-render-behavior.ts`: 8 tổ hợp hai adapter, frame Canvas, vị trí vật đỡ/vật cầm và 4 tỷ lệ.
- `verify-motion-composition.ts`, `verify-motion-illustration-profiles.ts`, `verify-motion-scene-pacing.ts`.
- `verify-motion-voice-attribution.ts`, `verify-motion-voice-mode-ui.ts`, `verify-motion-scene-ai-settings.ts`.
- `verify-motion-production-runner.ts`: song song, resume đúng phần, hủy, persistence và không chạy trùng.

Các kiểm tra trên chứng minh đường code/cấu hình và các lỗi tái hiện đã sửa; **không chứng minh AI luôn vẽ đẹp/đúng ở mọi video**. Khi duyệt ảnh tắt, lỗi vẽ còn lại vẫn nhận hình và cho người dùng tạo lại riêng cảnh như yêu cầu.

## Nạp bản sửa

Backend đã được khởi động lại sau sửa cuối: PID `72436`, cổng `3002`; kiểm tra HTTP module trả `200`, `MOTION_SOUND_CONFIG.VERSION=5`. Bằng chứng tại `scratch/bat-gao-audit-20261029/backend-restart.json`. Không có production Motion đang chạy trước khi nạp. TypeScript, ESLint các file logic sửa và `git diff --check` đạt. Khởi động có cảnh báo kết nối bộ sinh ảnh chung cổng Chrome 9222; lượt này không chạy AI thật nên chưa kiểm chứng phiên đăng nhập các dịch vụ AI.


## Camera: chuyển động chậm có thể nhìn thấy (29/10/2026)

- Đã thay zoom rất nhỏ trên khoảng 24–45 giây bằng chuyển động theo từng cảnh: lia trái/phải/lên/xuống, phóng gần và lùi xa. Camera vẫn dùng công tắc hiện tại; tắt là cố định.
- Toán chuyển động dùng chung giữa Remotion và Canvas của kho; phụ đề nằm ngoài camera. Không thêm request AI hoặc thay cấu trúc prompt vẽ ba kiểu hình.
- Biên độ tối đa 4,5%; cảnh ngắn giảm biên độ, dưới 2 giây giữ khung. Chuyển động vào/ra êm, không rung hoặc lắc qua lại. Khi biết vị trí chủ thể, giải giới hạn hai đầu để giữ phần chủ thể đang thấy trong khung; cảnh chật có thể giảm biên độ. Bối cảnh không lộ viền do lia.
- Các ảnh khác nhau cùng địa điểm có nhịp camera riêng; chỉ nối liên tục khi thực sự dùng chung ảnh và kiểu khung. Thêm revision bản xuất để tránh dùng chữ ký xuất cũ, không làm vẽ lại cảnh hoặc tạo lại giọng.
- Đã bỏ hàm zoom cũ và bảng MOVE quá nhỏ không còn dùng. Giá trị `puppetCameraProgress` cũ còn phục vụ hiệu ứng bóng ma và được giữ riêng, không điều khiển camera mới.
- Kiểm chứng: TypeScript, ESLint các file sửa, 376.272 mẫu về tốc độ/viền/chủ thể/seek/4 tỷ lệ/6 hướng; runtime Canvas nhận đúng cùng hàm; 8 tổ hợp actor/effect/camera và staging đạt.
- Đã render bốn khung PNG từ production Bát Gạo lưu sẵn, không gọi AI/TTS hoặc chạy production mới. Khi actor/effect tắt: camera tắt có hash đầu/cuối giống nhau, bật có hash khác nhau. Bằng chứng: `scratch/motion-camera-20261029/`.
- Giới hạn bảo vệ chủ thể phụ thuộc dữ liệu bố cục: SVG nguyên cảnh thiếu placement vẫn dùng biên độ nhỏ; không cam kết suy ra chính xác mọi hình thể từ SVG. MP4 đã xuất không tự thay đổi, cần xuất lại để có camera mới.
