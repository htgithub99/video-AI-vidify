# Plan vẽ hình và chuyển động một lượt cho toàn bộ kiểu hình, thể loại

Ngày: 06/11/2026. Trạng thái: **kế hoạch chuẩn bị code**, chưa triển khai các thay đổi trong tài liệu này. Tiếp nối `motion-one-pass-scene-implementation-2026-11-06.md` và làm rõ phần hình/chuyển động thay cho hướng motion riêng trong plan tối ưu cũ.

**Cập nhật theo chỉ đạo khi triển khai:** AI phải viết mô tả chuyển động chi tiết cùng kịch bản; code chỉ chuyển nguyên văn vào prompt vẽ, không ghép luật hành động theo nhóm người/thú/xe. Đây là hướng thay thế phần dựng chỉ dẫn bằng code trong plan ban đầu. Xem `motion-script-authored-motion-implementation-2026-11-06.md`.

## 1. Mục tiêu và phạm vi

- Mỗi cảnh có một yêu cầu sinh nội dung: AI trả SVG hoàn chỉnh, layers và toàn bộ animations trong cùng phản hồi. Không có yêu cầu AI lập motion riêng, QA, sửa hình hay tự vẽ lại sau sinh.
- Đưa những chỉ dẫn cụ thể giúp bản mẫu tốt lên vào **prompt đầu**, thay vì chờ nhìn thấy lỗi rồi mới yêu cầu AI sửa.
- Bao phủ toàn bộ danh mục hiện có: 3 kiểu hình `history/horror/explainer`; 4 thể loại `pov/witness/chronicle/verdict`; 8 dạng hình `illustration/diagram/comparison/map/timeline/process/cutaway/card`; 7 góc nhìn; toàn bộ 15 cụm tương tác trong `MOTION_UNITS`, các loài và lớp đồ vật hiện khai báo.
- Các đề tài lịch sử, dân gian, chiến tranh, đời sống, khoa học… dùng nội dung nguồn và tổ hợp hành động phù hợp. Không tạo một luật chuyển động riêng cho mỗi đề tài, không tuyên bố đã hỗ trợ các engine/kiểu hình chưa có trong tool.
- Giữ model, mức suy nghĩ, tham chiếu, nhận diện, chi tiết hình, continuity, số người theo nguồn, giọng, phụ đề, SFX, FPS, độ phân giải và CRF. Giữ các menu/engine khác.
- Giữ 5 room và phụ thuộc cảnh mẫu/địa điểm hiện có; không bỏ phụ thuộc để ép 5 tác vụ luôn chạy đồng thời.

## 2. Những khoảng trống đã xác nhận

| Khoảng trống | Bằng chứng hiện tại | Hướng xử lý |
| --- | --- | --- |
| Mẫu tốt chưa chứng minh chất lượng lượt đầu | Bản cảnh 41 đã duyệt là lượt AI sửa bản trước: 48 track, có chân/khớp 6 ngựa tiến lại; bản mới qua pipeline có 13 track, phần lớn ngựa phụ chỉ dịch nguyên cụm | Dùng bản tốt làm mốc hành động, dùng phản hồi đầu để nghiệm thu phương án một lượt; không lấy clip đã sửa để báo lượt đầu đạt |
| Hướng dẫn rig bỏ sót cụm và đám đông | `motionSceneRigLines` loại người có `unit`, người anonymous/crowd và vật đã nằm trong unit khỏi các chỉ dẫn khớp chi tiết | Mở rộng hướng dẫn theo từng thành viên/cấu trúc unit, kể cả các bản thể trong nhóm |
| Chỉ dẫn chung xung đột kiểu hình | `COMPLETE_MOTION` yêu cầu bước chân rộng; kiểu horror cấm chân/bàn chân ở người, động vật vẫn có giải phẫu riêng | Chọn quy tắc theo loại chủ thể và profile trước khi thêm hướng dẫn hành động |
| Có chỉ dẫn cũ cần rà đường gọi | `motionProfileMotion.ts` còn câu giữ chân/cơ thể ngồi đứng yên và loop nhỏ | Kiểm đường gọi thật; chỉ sửa câu tác động tới pipeline một lượt, giữ hành vi engine cũ |
| Comparison còn gợi ý cán cân | Quy tắc comparison chung và verdict hiện không bắt buộc cán cân, nhưng `explainer/artDirection.ts` còn ví dụ “simple balance” | Thống nhất: chỉ vẽ cán cân/đạo cụ phán quyết khi visual brief hoặc nguồn thực sự yêu cầu |
| Ngân sách dữ liệu có trần | 96 animation track, 20 keyframe/track, SVG 150.000 ký tự; cảnh đông/chuyển động phức tạp có thể chạm trần | Đo bằng case thật; không cắt track, bớt người, giảm chi tiết hoặc chia thành nhiều lượt AI để giấu việc vượt trần |

Số track chỉ giúp chẩn đoán. Nhiều track không đồng nghĩa động tác đúng; nghiệm thu phải xem hành động thực tế trong Chrome.

## 3. Cấu trúc prompt đề xuất

Tạo một bộ dựng chỉ dẫn từ dữ liệu cảnh đang có, chạy cục bộ và không gọi AI thêm. Không dùng một đoạn tiếng Anh dài giống nhau cho mọi cảnh.

Thứ tự ghép prompt:

1. Nội dung nguồn, mục đích cảnh, nhân vật/đồ vật và hành động đã có trong scene brief.
2. Quy tắc tạo hình và mẫu tham chiếu của profile; các quy tắc nhận diện, tỷ lệ, số lượng và continuity.
3. Dạng hình, góc nhìn và cấu hình render đã chuẩn hóa theo hành vi hiện tại.
4. Yêu cầu hành động riêng cho các chủ thể tham gia: ai làm gì, liên hệ với ai/vật nào, phần nào cần chuyển động, quan hệ hỗ trợ/cầm/nắm/cưỡi/kéo/chở.
5. Thời lượng; trạng thái đầu–diễn biến–cuối; phần chuyển động một chiều và phần thực sự lặp.
6. Schema JSON hiện có, cách dùng local delta, pivot, cấu trúc keyframe và ngân sách dữ liệu thống nhất với parser.

Không thêm một bước AI phân tích chuyển động. Việc suy diễn tư thế/khớp/timing diễn ra trong cùng lần AI vẽ. Bộ dựng chỉ dẫn chỉ gom dữ liệu, quy tắc và quan hệ đã biết; không dùng từ khóa trong narration để tự thay sự kiện hay thêm hành động không có trong brief. Trường chưa rõ được giữ nguyên mô tả để AI giải quyết trong cảnh, không tự gán đi/chạy/gật đầu mặc định.

Chỉ đưa các quy tắc liên quan vào prompt. Có mục dự phòng cho chủ thể/hành động chưa khớp danh mục: mô tả theo brief, chọn cấu trúc chuyển động phù hợp profile, không ép thành con người hai chân hoặc tự chuyển sang cảnh tĩnh.

## 4. Quy tắc theo kiểu hình và thể loại

| Kiểu hình | Yêu cầu giữ nguyên | Cách thể hiện chuyển động |
| --- | --- | --- |
| History | Cấu trúc người có chi, tỷ lệ và nhận diện hiện có; đúng thời kỳ/đồ dùng | Đi/chạy dùng khớp hông–gối–cổ chân khi được thấy; tay/vật cầm phối hợp; động vật và cơ giới theo cấu trúc riêng |
| Horror | Đầu mặt nạ, thân áo liền, người không có chân/bàn chân; động vật giữ giải phẫu của loài | Di chuyển thân áo và tay theo cách biểu đạt hiện có, giữ thân liền và chỗ tựa; không thêm chân để đáp ứng luật đi bộ; không tự thêm ma/bay/rung vì nhãn kinh dị |
| Explainer | Người cùng cấu trúc outlined hiện có; nhãn, sơ đồ và thứ tự đọc rõ | Người làm đúng việc; sơ đồ/bản đồ/quy trình diễn giải đúng thông tin bằng phần tử tương ứng, không ép thành gait của nhân vật |

Thể loại định hướng câu chuyện và nhịp diễn, không thay giải phẫu/profile hoặc tạo đạo cụ:

- **POV:** giữ điểm nhìn/cảnh nguồn hiện có; không biến mọi cảnh thành tay nhìn ngôi thứ nhất.
- **Witness:** cử chỉ, hồi tưởng và tương tác theo cảnh; không tự thêm một người kể đứng trong mọi khung.
- **Chronicle:** hành động, địa lý và mốc thời gian theo nguồn; không biến mọi cảnh thành bản đồ/timeline.
- **Verdict:** thể hiện nhân vật, sự kiện và chứng cứ đang được xét; không tự vẽ cán cân, con dấu, bảng điểm hoặc thêm nhãn không có trong scene.

Xung đột được xử lý trước khi gửi: yêu cầu nội dung quyết định sự kiện, profile quyết định hình học biểu đạt, cấu hình render quyết định có chuyển động hay không. Không nới luật tạo hình để dễ animate. Không sửa logic viết kịch bản trong đợt này.

## 5. Nhóm hành động và dạng hình cần bao phủ

| Nhóm | Chỉ dẫn được bổ sung khi cảnh thực sự có yêu cầu |
| --- | --- |
| Người đứng, nói, nhìn, phản ứng | Cử chỉ đúng cảm xúc/hành động; chỉ chuyển động miệng cho người đang thoại; không nhún cả người thay lời nói |
| Đi, chạy, quay, dừng, ngồi, quỳ, nằm, ngã | Phối hợp thân với các bộ phận được profile cho phép; giữ tỷ lệ, diễn biến vào/ra tư thế và điểm tựa phù hợp |
| Cầm, trao, kéo, đẩy, nâng, dùng vật | Vật theo tay trong giai đoạn cầm; thời điểm đổi người giữ/nhả vật rõ, không gắn vĩnh viễn vào một tay sau khi đã trao |
| Đánh, đỡ, bắn và phản ứng | Đòn và phản ứng theo nguồn, thứ tự có nguyên nhân; vũ khí gắn tay, hiệu ứng phát từ nguồn tương ứng; không tự thêm bạo lực |
| Thú bốn chân, chim, cá, rắn và loài khác | Dùng cấu trúc loài hiện có: chân/cánh/vây/thân tương ứng; không mặc định mọi động vật có bốn chân |
| Người cưỡi/dắt thú | Bao phủ từng con/thành viên đang tham gia; động tác chân thú phối hợp đường đi, người ngồi theo thú, tay/cương/vũ khí giữ quan hệ |
| Xe kéo, chiến xa, xe bánh/xích, máy bay | Phối hợp người–thú kéo–dây kéo–thân xe–bánh/xích; cánh/quạt/bộ phận máy chỉ hoạt động khi nội dung cần |
| Thuyền, người chèo, buồm | Người ở trong thuyền, tay theo mái chèo, chu kỳ chèo phù hợp tiến thuyền; không để người trượt khỏi thân thuyền |
| Kíp pháo, máy công thành, máy móc, khiêng kiệu/vật chung | Phân vai từng người theo cấu trúc unit và hành động; cùng vật được giữ/đẩy/kéo có quan hệ nhất quán; không chỉ animate một thành viên |
| Đám đông | Mỗi thành viên nhìn thấy và được brief yêu cầu hành động đều tham gia; phân pha tự nhiên nếu phù hợp; không giảm số người, nhân bản để giả đủ hay chỉ cho ba người nhảy |
| Mưa, nước, khói, bụi, lửa, vải | Theo vùng/nguồn có trong cảnh và cấu hình hiện có; không thêm hiệu ứng để che thiếu hành động chính |
| Cảnh tĩnh, môi trường, vật chứng | Giữ tĩnh nếu nội dung cần; camera/hiệu ứng chỉ theo cấu hình, không ép người hoặc chuyển động không có |

Với 8 dạng hình: `illustration` thực hiện sự kiện; `diagram` chỉ chuyển động bộ phận/quan hệ cần giải thích; `comparison` làm rõ đối tượng/chứng cứ; `map` đi đúng tuyến/địa danh; `timeline` đúng mốc và thứ tự; `process` đúng quan hệ trước–sau; `cutaway` giữ cấu trúc trong/ngoài; `card` giữ nguyên chữ và nội dung. Không thêm dữ kiện hoặc biểu diễn biến động số liệu mà nguồn không cung cấp. Không đổi shot chỉ để dễ animate.

## 6. Thứ tự chuẩn bị code

1. **Chốt mốc so sánh:** lưu hash và nguồn của prompt, phản hồi đầu, yêu cầu sửa và clip cảnh 41 tốt. Xác nhận đường dựng/render của tool đọc lại được SVG/48 track đã duyệt mà không thay keyframe. Đây là test tương thích, không phải bằng chứng sinh tốt một lượt.
2. **Bộ dựng chỉ dẫn chung:** bổ sung helper có type từ scene/profile/unit/object/behavior hiện có; không đổi schema AI công khai nếu không cần. Ghép vào `motionSceneBrief` để cả thử riêng cảnh và production dùng cùng một đường prompt.
3. **Phủ cấu trúc tương tác:** mở rộng chỉ dẫn rig cho single, crowd và tất cả unit; nhất quán ID bộ phận, cây cha–con, hệ tọa độ/pivot. Không bắt AI tạo các chi bị profile cấm hoặc các phần ngoài góc nhìn.
4. **Loại chỉ dẫn đối nghịch:** rà prompt sống, mẫu ví dụ và context lồng nhau; bỏ lệnh loop nhỏ/giữ chân trong cảnh di chuyển, giới hạn lại lệnh đứng yên cho đúng thời điểm và đúng hỗ trợ. Rà comparison/verdict xuyên profile.
5. **Tích hợp không phá dữ liệu cũ:** giữ renderer thực thi track nguyên bản; không thêm gait/IK/sửa khớp bằng code. Version hóa chính sách prompt trong request/input key theo cơ chế hiện có. Không tự làm mất cache hoặc chạy lại cảnh đã accepted khi nâng phiên bản; chỉ dùng policy mới cho lần sinh mới/tạo lại chủ động. Cảnh đang chạy dùng snapshot đầu vào đã gửi.
6. **Kiểm chứng và bàn giao:** kiểm thử cục bộ, chạy Gemini/Chrome thật trên bộ case bên dưới, kiểm giao diện và đóng gói/bản chạy khi triển khai thực tế. Báo rõ source đã sửa, backend/bundle đang chạy bản nào; không để bản demo chạy một prompt còn tool chạy prompt khác.

Điểm code dự kiến: `src/lib/motionSceneBrief.ts`, `src/constants/motionSceneBrief.ts`, helper/policy mới cạnh bộ dựng brief, các hằng số profile/unit cần đồng nhất, `scenePipeline.ts` và key/version liên quan. Chỉ sửa renderer/normalizer nếu case thật chứng minh lỗi đọc/render dữ liệu AI; không viết lại animation của AI để làm clip mẫu đẹp hơn.

Ngân sách 96 track/20 keyframe/150.000 ký tự phải được đánh giá trước khi chốt hỗ trợ cảnh phức tạp. Nếu cần nâng trần, thay đồng bộ prompt–parser–storage và đo Chrome/memory/thời gian render; không tự nâng vô hạn. Case vượt trần chưa được giải quyết phải báo là giới hạn còn tồn tại, không nghiệm thu “mọi cảnh” bằng cách cắt dữ liệu.

## 7. Kế hoạch kiểm chứng

Các kiểm chứng sau là công việc phát triển/nghiệm thu, **không đưa thành QA, chấm điểm hay vòng sửa trong pipeline người dùng**.

### A. Dữ liệu thật và tương thích

- Dùng production Granicus `f82fe2c76c1ab22004a52e6147acdf2c`, scene 41 và hai thư mục `scene-41-existing-prompt-motion-20261106-1793940961253` / `scene-41-existing-prompt-motion-20261106-1793941127147` dưới `storage/output/motion-video/clip-demo` để đối chiếu bản trượt nguyên cụm và bản đã duyệt.
- Rà các production hiện có để lập manifest case: productionId/sceneId, nguồn lời dẫn/brief, kiểu hình, thể loại, format, view, unit/hành động, cấu hình, hash dữ liệu và lý do chọn. Chọn lại từ dữ liệu đã chạy, không tự bịa thêm sự kiện để đủ ma trận.
- Chạy bản sao ở thư mục kiểm chứng riêng. Không sửa/ghi đè production hoặc clip gốc. Khi thiếu loại case trong dự án, ghi rõ khoảng trống; mẫu kỹ thuật bổ sung phải được gắn nhãn, không gọi là case thực tế.

### B. Kiểm tra cục bộ

- Ma trận prompt 3 profile × 4 genre × 8 format = **96 tổ hợp**, chỉ xét trường hợp hợp lệ theo dữ liệu/config. Bao phủ 7 view và từng loài/lớp đồ vật/15 unit bằng case bổ sung phù hợp.
- Test có ý nghĩa: horror không bị yêu cầu chân người; cá/rắn không bị ép gait bốn chân; crowd/unit được hướng dẫn cho mọi thành viên; trao vật có đổi người giữ; comparison không bị ép cán cân; nhãn chính xác; scene tĩnh/tắt chuyển động giữ ngữ nghĩa hiện tại.
- Giữ bộ `test:motion-one-pass`: một lần sinh/cảnh, không AI motion/QA/repair; resume không gửi lại; tạo lại thủ công đúng cảnh; bảo toàn track, chuyển động ở từng frame và timing theo giọng.
- Lỗi kỹ thuật: JSON/SVG/target/keyframe sai, vượt giới hạn, phản hồi thiếu, hủy và tiếp tục. Giữ response gốc, báo đúng lý do, không silently drop hoặc gắn nhãn chất lượng đạt.
- Kiểm 5 room/continuity, quota/Chrome dự phòng, dữ liệu accepted và các engine/menu khác. Giữ cách chuẩn hóa cấu hình hiện có, không biến các tham số nội bộ thành công tắc độc lập mới.
- TypeScript và test liên quan; phân biệt lỗi có từ trước với regression, không bỏ assertion để báo xanh.

### C. Chạy Chrome cài thật, có cửa sổ

- Tối thiểu **12 case live** để có mỗi tổ hợp 3 profile × 4 genre một lần. Chọn case sao cho cùng bộ này phủ tối đa 8 format, người/vật/thú/crowd/cơ giới; bổ sung case cho nhóm quan trọng còn thiếu.
- Cảnh 41 thuộc bộ bắt buộc: gửi prompt qua pipeline production mới, chỉ tính **phản hồi sinh đầu**, render/phát trong Chrome thật ở 1080p/30fps như cấu hình nguồn. So với mốc đã duyệt: sáu ngựa đang tiến phải có bước, người ngồi và vũ khí giữ liên kết, hành động chính rõ. Không dùng số track làm tiêu chí chất lượng duy nhất.
- Mỗi case giữ submitted prompt, response gốc đầu tiên, dữ liệu đã lưu, log request, MP4, ảnh đầu/giữa/cuối và kết quả xem thực tế. Đếm lời gọi sinh nội dung riêng với ACK/context/đọc lại checkpoint.
- Không chọn lại chỉ các kết quả đẹp để báo đạt. Nếu phản hồi đầu sai, giữ và ghi nhận lần đó; muốn điều chỉnh prompt phải version hóa, chạy lại như một thử nghiệm khác, không gọi đó là cùng lượt thành công.
- Phục hồi UI/đọc lại response và handoff Chrome không được làm phát sinh yêu cầu vẽ nội dung trùng. Không cố làm cạn quota tài khoản; test handoff bằng fixture phải được ghi đúng là fixture.
- Kiểm preview và export dùng cùng dữ liệu; mở giao diện tool thật, xác nhận bản backend/frontend có thay đổi đã được nạp. Không chỉ render clip bằng script ngoài pipeline rồi kết luận đã áp dụng.

### D. Điều kiện nghiệm thu và thời gian

- Kiến trúc đạt khi một lần sinh trả hình+motion, không có QA/sửa tự động, dữ liệu/thiết lập/chức năng được giữ và các test tương thích đạt.
- Chất lượng chỉ được xác nhận cho những case live đã xem đạt đúng hành động; lỗi còn lại, số case đạt/tổng và loại chưa có dữ liệu phải công bố. Không suy rộng 12 mẫu thành bảo đảm mọi cảnh tương lai.
- Ghi thời gian chờ room, gửi/nhận AI, lưu, render và tổng; đo cả lỗi/quota. Đọc checkpoint không được tính là thời gian AI sinh cảnh.
- Sau bộ mẫu, kiểm một nhóm nhiều cảnh theo thứ tự thật để xác nhận throughput/continuity. Chỉ công bố ETA video dài khi đủ số đo; không lấy thời gian clip 5,77 giây nhân thẳng cho 98 cảnh.

## 8. Kết quả cần bàn giao khi triển khai

1. Prompt production và thử riêng cảnh dùng chung bộ luật theo chủ thể/profile/genre/format.
2. Manifest case thật và ma trận phạm vi đã kiểm.
3. Bộ regression cùng bằng chứng Chrome/Gemini live, bao gồm cả trường hợp chưa đạt.
4. Video cảnh 41 sinh lượt đầu đặt cạnh bản đã duyệt; video đại diện các profile/genre còn lại.
5. Báo cáo thay đổi, thời gian đo được, phiên bản app đã chạy và giới hạn còn tồn tại.

Mục tiêu là tăng xác suất hoàn chỉnh ngay lần đầu bằng đầu vào cụ thể, nhất quán. Không có cơ sở cam kết AI luôn đúng 100% cho mọi nội dung khi không có bước kiểm/sửa sau sinh.
