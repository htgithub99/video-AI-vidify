# Plan sửa Motion và kiểm chứng trên Chrome thật bằng dữ liệu lần chạy mới nhất

Ngày lập: 05/11/2026. Trạng thái: đã triển khai patch và hoàn tất đợt kiểm chứng có phạm vi, bằng chứng và giới hạn tại [báo cáo QA bổ sung](qa/motion-real-data-chrome-report-2026-11-05.md).

## 1. Mục tiêu và phạm vi

### Giới hạn thay đổi đã chốt

Mục tiêu là tăng tốc độ và sửa lỗi sai, giữ chức năng và quy tắc nghiệp vụ hiện có. Mọi mục triển khai dưới đây phải tuân theo giới hạn này.

- Chỉ đổi thứ tự điều phối theo yêu cầu đã nêu: vẽ đủ cảnh, phục hồi cảnh lỗi ngay sau lượt đầu, rồi thực hiện đầy đủ các bước tiếp theo. Không bỏ bước duyệt/sửa, tạo chuyển động, kiểm tra hoặc lưu dữ liệu để tăng tốc.
- Giữ cách dựng nội dung và hình, lựa chọn model/mức suy nghĩ, phong cách, tham chiếu, continuity, quy tắc motion/camera, điều kiện duyệt và cấu hình bật/tắt hiện có. Sửa prompt chỉ tại ràng buộc đã xác định sai hoặc mâu thuẫn và đã nằm trong yêu cầu, giữ nguyên phần hợp lệ.
- Sửa lỗi vận chuyển/Retry, định dạng, tham chiếu và log đúng nguyên nhân; giữ validation nghiệp vụ. Không mặc định đổi format, bỏ node/effect, hạ model hoặc giảm chất lượng để được tính là thành công.
- Giữ API và cấu trúc dữ liệu hiện có khi có thể; checkpoint cũ, lưu/tiếp tục, tạo lại từng cảnh, hủy và Chrome dự phòng phải tiếp tục hoạt động. Chỉ làm mất hiệu lực cache/checkpoint thực sự phụ thuộc dữ liệu bị sửa, tránh dựng lại cảnh đã đạt.
- Với cùng dữ liệu hợp lệ và cùng phản hồi AI, đối chiếu trước/sau phải giữ nội dung, hình, chuyển động và quyết định validation; khác biệt dự kiến chỉ ở lịch thực hiện, thời gian chờ và log được sửa đúng. Với phản hồi AI mới, dùng tiêu chí chất lượng/identity/continuity gốc để nghiệm thu.
- Mỗi patch phải chỉ rõ lỗi gốc hoặc thời gian chờ được khắc phục và bằng chứng hồi quy bằng dữ liệu dự án trên Chrome thật. Các thay đổi thiết kế nghiệp vụ không phục vụ lỗi đã xác định nằm ngoài phạm vi plan.

### Luồng chốt theo yêu cầu mới nhất của người dùng

Quy tắc này ưu tiên hơn mô tả triển khai trước đó trong tài liệu: **vẽ đủ hình toàn bộ cảnh trước, rồi mới làm các bước tiếp theo**.

1. Vẽ lượt đầu bằng pool tối đa 5 room, giữ phụ thuộc cảnh mẫu/tham chiếu cần thiết. Kiểm tra cấu trúc, ID, chủ thể và khả năng render ngay khi nhận từng kết quả; ảnh placeholder và phản hồi từ chối không tính là có hình hợp lệ.
2. Sau khi mọi tác vụ vẽ lượt đầu kết thúc, quay lại ngay các cảnh thiếu/hỏng bằng các slot khả dụng trong pool 5 room. Giữ các cảnh đã đạt; chưa chạy vòng sửa thẩm mỹ/tư thế/khung hoặc gọi AI đạo diễn chuyển động. Phục hồi room vẫn theo Thử lại → 2 lần cùng room → thay room trong phạm vi ngân sách chung đã thiết kế.
3. Chỉ khi tất cả cảnh có hình hợp lệ mới chuyển sang sửa tư thế/khung và các bước chất lượng tiếp theo. Nếu một lần sửa thất bại, giữ bản hình hợp lệ trước đó và trạng thái chưa đạt rõ ràng; không lặng lẽ thay bằng placeholder hoặc hạ yêu cầu chất lượng.
4. Sau sửa tư thế/khung mới chạy AI đạo diễn chuyển động. Giữ duyệt ảnh AI theo cấu hình ở sau chuyển động như chức năng hiện có, để ảnh lấy mẫu vẫn kiểm được chuyển động. Khi duyệt yêu cầu sửa SVG, tạo lại motion dựa trên SVG mới trước lần duyệt tiếp theo; không dùng rig cũ. Sau đó kiểm preview/lưu/render.
5. Khi còn cảnh thiếu/hỏng, bước vẽ chưa hoàn tất và chưa được đi tiếp. Hủy, quota, CAPTCHA hoặc hết ngân sách có thể làm tạm dừng với checkpoint và lý do rõ; không báo thành công hoặc retry vô hạn không kiểm soát.

Hiển thị tiến độ theo từng bước: `Vẽ hình: 27/36 đạt, 9 cần vẽ lại` → `Sửa tư thế/khung` → `Tạo chuyển động` → `Duyệt ảnh AI` (nếu bật) → `Preview/render`. Thứ tự này giữ kiểm tra chuyển động trong duyệt ảnh và tuân theo yêu cầu vẽ đủ trước. Không dùng số thứ tự cảnh cuối được gửi như tín hiệu toàn bộ đã xong.

Ca nghiệm thu bắt buộc trên Chrome thật: từ dữ liệu 27 accepted + 9 failed của lần chạy này, xác nhận không có request motion hay quality redraw trước khi đủ 36 hình hợp lệ; sau lượt đầu chín cảnh lỗi được phục hồi ngay; pool tối đa 5, không lẫn cảnh hoặc mất tham chiếu; sau khi đủ hình mới chạy các bước sau. Phần logic hiện đang gọi motion trong drawScene cần được tách theo luồng này.

- Sửa các lỗi đã xác định mà giữ chất lượng hình, chuyển động, nội dung, model, ảnh tham chiếu và tính nhất quán giữa cảnh.
- Đúng thứ tự phục hồi: bấm Thử lại của câu trả lời hiện tại → tối đa 2 lần phục hồi trong cùng room → thay room một lần khi lỗi vẫn còn. Dừng ngay nếu thành công; dùng chung ngân sách giữa các tầng gọi.
- Giữ cơ chế riêng cho quota, CAPTCHA, hủy và yêu cầu chưa rõ đã gửi. Không gửi lại khi chưa xác định trạng thái yêu cầu trước.
- Nghiệm thu các thay đổi bằng Google Chrome cài thật, có cửa sổ hiển thị. Kiểm thử tĩnh chỉ bổ sung; test pass với HTML đơn giản không chứng minh Gemini thật đã hoạt động.
- Hồi quy pool 5 room dựng cảnh + 2 room nội dung, Settings dùng chung, Chrome dự phòng, lưu/tiếp tục và log.

## 2. Chốt nguồn dữ liệu thực tế trước khi sửa

Nguồn chính đang mới nhất khi kiểm tra: job dựng cảnh `f61fc4d8-bc64-4678-8ccc-40ae950dac07`. File job có envelope `{version, job}`. Journal:

`storage/output/motion-video/story-jobs/logs/f61fc4d8-bc64-4678-8ccc-40ae950dac07.jsonl`

Bản ghi đọc lúc lập plan đã tới 16:40:37, gồm 36 cảnh và log bộ đếm 89 lúc 16:39:01. Đây là mốc dữ liệu trên đĩa, không phải kết luận rằng job hiện vẫn đang chạy trong bộ nhớ. Không dùng số 89 như số lần HTTP gửi thực tế.

Khi bắt đầu code:

1. Kiểm tra lại job mới nhất và tạo bản sao dữ liệu kiểm chứng ở thư mục riêng. Ghi mốc thời gian, SHA-256 của từng file, commit gốc và diff hiện có.
2. Lập manifest: case ID, job/request/scene/worker, model và mức suy nghĩ, prompt đầy đủ, các phần ngữ cảnh và ACK, ảnh tham chiếu, phản hồi thô, lỗi, DOM/ảnh nếu có, checkpoint trước lỗi.
3. Lấy dữ liệu từ `ai-debug`, `ai-ledgers`, `scene-checkpoints`, `storage/chat-results`, journal và diagnostic tương ứng. Phân biệt ID hoạt động trong log với requestId của artifact; nối bằng dữ liệu thực, không đoán theo vị trí dòng.
4. Nếu thiếu prompt đầy đủ, đọc từ nguồn lưu hoặc dựng lại bằng đúng builder và đầu vào đã lưu, ghi rõ là dựng lại; chưa đủ dữ liệu thì không gọi là replay nguyên bản.
5. Chọn cả cảnh hợp lệ làm đối chứng, gồm người/đạo cụ, cảnh đông người, cảnh có hiệu ứng và cảnh có chuyển động/camera nếu dữ liệu có. Bản sao dùng storage/checkpoint/output riêng.
6. Giữ cookie, token và profile đăng nhập ngoài bộ dữ liệu/báo cáo được đưa vào Git.

### Các case gốc đã tìm thấy

| Case | Dữ liệu thực tế | Điều phải kiểm chứng |
| --- | --- | --- |
| R1: bỏ qua native Retry | `ai-debug/motion_remotion_composition-a8c3f22c.json`, DOM/PNG cùng tên; 16:24:34; room kết thúc `2ed5128df2bc9939`; cảnh `c3_event_320edfaa76a9:1` | Phân loại generic refusal đúng; mở menu hiện tại và chọn Thử lại; không bỏ qua recovery |
| R2: lỗi lặp lại | Các refusal lúc 16:02:25, 16:12:32, 16:29:16, 16:30:54, 16:31:40 trong cùng journal | Ngân sách không bị nhân giữa service chat và pipeline; thành công giữa chừng thì dừng |
| S1: ID có dấu | `ai-debug/motion_remotion_composition-composition_99d1c2c7230b6fab5621ef6bfa9a935abbe18b1da7c735c5ea822217a2627372_c2_event_c19ae056043a_3-1.json`; `c2_node_alexander_frozen_ptéryges` | Đổi ID và mọi tham chiếu đồng bộ, không đổi hình/chuyển động |
| S2: ID khác | `ai-debug/motion_remotion_composition-composition_1ee95718db8f407d5a1af0091a58a2919fa851828de239004ed7cbe583dbe1b8_c4_event_ecf6d8536f9e_4-1.json`; `leg-left` | Tìm rõ ID thiếu, trùng hay sai chủ thể; tên này hợp lệ về ký tự, không áp dụng sửa bỏ dấu |
| S3: cấu trúc SVG | `ai-debug/motion_remotion_composition-composition_cde21f84f89b0d5c2161de6bb0f0be256d1604613a75fa4ded900869b58fa060_c3_event_2a8b3d0d29d9_0-1.json`; `</g>` không khớp `<svg>` | Không chữa bằng cách xóa node hoặc bỏ validation; yêu cầu sửa đúng cấu trúc nếu không xác định duy nhất cách sửa |
| P1: format | `ai-debug/motion_remotion_scene-plan_7ee92585776fcf026eb0592a7790cd7e93274eb0cf0852239d628057fc50f3d4-1.json`; `verdict`/`scoreboard` | Prompt/schema thống nhất; giữ mục đích, ứng viên, nhãn và quan hệ, không đổi mù sang illustration |
| C1: composer chậm | Request `motion_remotion_composition-c4eeb937`, đối chiếu diagnostic trước đây với journal | Tách thời gian chờ UI, nhập prompt, xác nhận gửi và chờ AI; không chỉ tăng timeout |
| C2: context ACK | Journal 16:40:25–16:40:37; motion prompt 17.067 ký tự, ngân sách 16.000 | Gửi đủ các phần và nhận ACK đúng phần; không cắt dữ kiện, không gửi task cuối quá sớm |
| J1: JSON lỗi | Các phản hồi invalid JSON của composition/motion trong lần chạy này; khóa file cụ thể khi tạo manifest | Chỉ sửa cú pháp không mơ hồ; dữ liệu thiếu/sai nghĩa phải repair có mục tiêu |

Các đường dẫn trong bảng tính từ `storage/output/motion-video/`, trừ khi ghi khác.

## 3. Thứ tự code

### Bước 1 — Recovery và native Retry

- Rà phân loại refusal: câu từ chối khả năng chung trong ảnh cần đi qua recovery; không gộp mọi refusal, quota hoặc CAPTCHA thành một loại.
- Sửa bộ nhận diện UI dựa trên DOM Gemini thật: xác định câu trả lời mới nhất thuộc request hiện tại, mở nút tạo lại đang có, chọn đúng Thử lại trong menu, xử lý overlay ngoài container câu trả lời.
- Xác nhận regeneration thực sự bắt đầu và chờ phản hồi mới. Không chấp nhận lại câu từ chối cũ, không bấm vào lượt cũ, không chọn Dài hơn/Ngắn hơn.
- Khi native Retry thiếu/vô hiệu/thất bại, log đúng tình trạng rồi phục hồi cùng room 1/2, 2/2, sau đó thay room một lần. Không biến nút thiếu thành một lần click thành công.
- Giữ nguyên ngữ cảnh, nguồn, model, mức suy nghĩ và tham chiếu. Kết quả sau retry vẫn phải qua schema, identity, continuity và lưu như kết quả thông thường.
- Rà đường lưu kết quả sau native Retry để bảo đảm không chỉ return sớm mà bỏ bước lưu hoặc metadata.

### Bước 2 — Composer, xác nhận gửi và ACK

- Thêm chẩn đoán đủ để phân biệt ô nhập bị thay thế, locator chờ, renderer treo và request đã gửi nhưng chưa xác nhận.
- Kiểm soát thao tác fill còn đang chạy khi hết timeout; không để lần fill cũ ghi đè lần mới hoặc gây gửi trùng.
- Kiểm tra responsive không coi exception là bằng chứng trang sẵn sàng; xử lý hủy xuyên suốt thao tác đọc/chờ.
- Giữ đầy đủ nội dung và các kiểm tra hiện có; đo nội dung thực tế trong composer và ACK từng phần. Không rút gọn prompt để làm phép thử qua.

### Bước 3 — Format và prompt thể loại phán quyết

- Thống nhất danh sách format hợp lệ xuyên suốt planner/schema/validator.
- Gỡ ràng buộc thiết bị phán quyết còn sót ở prompt chung; chỉ dùng cân/bảng điểm/thẻ khi nội dung hoặc yêu cầu thực sự cần.
- Với dữ liệu cũ có verdict/scoreboard, chỉ chuyển biểu diễn khi xác định rõ tương đương; trường hợp mơ hồ yêu cầu AI sửa trường liên quan, giữ dữ liệu đã hợp lệ.
- Không đổi thể loại, lập luận, bằng chứng, thứ tự câu hay ép một hình thức minh họa chung cho mọi cảnh.

### Bước 4 — SVG và JSON

- Phân loại riêng ID sai ký tự, ID trùng, tham chiếu thiếu và sai chủ thể; không dùng một normalizer cho mọi lỗi ID.
- Nếu đổi ID render, dùng ánh xạ có kiểm tra va chạm cho SVG id, href/xlink:href, url(#...), CSS, layer, animation, design/placement, camera/rig/support và các tham chiếu thực tế khác. Giữ ID nghiệp vụ/entity/checkpoint gốc.
- Không đổi path, geometry, transform, màu, opacity, keyframe, timing hoặc thứ tự layer để vượt validation.
- SVG đóng thẻ sai và JSON thiếu nghĩa: dùng sửa có mục tiêu nếu không có cách sửa cấu trúc duy nhất. Không tự tạo nội dung thiếu hoặc lặng lẽ bỏ phần lỗi.

### Bước 5 — Log và báo cáo request

- Ghi scene/request/worker/room/browser generation và nguyên nhân gốc; native click, retry cùng room, thay room và kết quả lưu là sự kiện riêng.
- Phân biệt request nghiệp vụ, gửi ngữ cảnh, submit task, native regeneration và đọc lại phản hồi. Đặt tên bộ đếm theo đúng sự kiện đo được.
- Phân biệt lỗi đang phục hồi với lỗi cuối; sửa severity, giữ thứ tự thời gian/sequence, không để polling cũ ghi đè trạng thái mới.

## 4. Chạy kiểm chứng trên Chrome thật

### Chuẩn bị

- Dùng executable Google Chrome đã cài, cửa sổ hiển thị; lưu version, executable, commit/diff, cấu hình và model thực tế vào báo cáo.
- Chạy bản kiểm chứng dùng storage/output/room riêng. Không chạy lại nguyên script live cũ khi nó có thể đóng global Chrome của job người dùng. Chỉ bàn giao/đóng browser trong phiên kiểm chứng khi xác định không còn job thật bị ảnh hưởng.
- Dùng profile kiểm chứng đã đăng nhập hợp lệ, không dùng đồng thời một thư mục profile cho hai Chrome. Chỉ khởi động/chuyển cấu hình phục vụ test sau khi snapshot và kiểm tra phiên đang chạy.

### Hai mức bằng chứng đều cần

1. **Chạy trực tiếp Gemini:** gửi prompt/nguồn/tham chiếu thực tế của case, đổi requestId để phân biệt lần kiểm chứng và giữ bản gốc để đối chiếu. Quan sát menu/role trên Gemini hiện tại; dùng code sản phẩm thực hiện recovery, lưu kết quả và render preview/clip. Thao tác chọn Retry thủ công không được tính là automation pass.
2. **Phát lại lỗi thực tế trên Chrome:** dùng phản hồi/DOM đã lưu và trạng thái bắt nguồn từ dự án để kiểm đủ nhánh lặp lỗi, phản hồi muộn, nút thiếu và ngân sách retry một cách xác định. Chạy bằng service sản phẩm; adapter kiểm thử chỉ điều khiển lỗi/thời điểm ở ranh giới cần thiết. Ghi rõ là replay hoặc fault injection, không gọi là Gemini phát sinh lỗi tự nhiên.

Không đảm bảo Gemini lặp lại cùng lỗi ở lần gửi sau. Nếu live chỉ trả thành công, kết quả đó xác nhận đường thành công; nhánh lỗi vẫn cần bằng chứng riêng. Case live chưa tái hiện phải được ghi chưa xác nhận, không đổi thành pass bằng replay.

### Ma trận nghiệm thu

| Nhóm | Phép chạy trên Chrome | Điều kiện đạt |
| --- | --- | --- |
| Retry menu | R1 với Gemini thật và replay đúng menu; thêm nút thiếu/vô hiệu, câu trả lời cũ và phản hồi muộn | Đúng câu trả lời, đúng mục, có regeneration mới; không submit trùng |
| Ngân sách | R2 replay từ lỗi thực; native thất bại, lần 1/2 thất bại, lần 2/2 thất bại, thay room; thêm thành công ở từng mốc | Đúng thứ tự/số lần, dừng khi thành công, room mới nhận đủ context, không vòng lặp vô hạn |
| Composer/context | C1/C2 với toàn bộ prompt thực và model đúng case; đọc timeline UI | Đủ nội dung/ACK, không fill chồng, không gửi trùng, không kết luận đã gửi chỉ vì timeout |
| SVG/JSON | S1/S2/S3/J1 chạy qua xử lý sản phẩm và preview thật | Chẩn đoán đúng, tham chiếu còn đủ, sai chủ thể vẫn bị chặn; dữ liệu sửa hợp lệ mới được nhận |
| Format/genre | P1 và cảnh đối chứng thuộc thể loại khác; nhận plan từ Gemini và mở preview | Giữ ý nghĩa, nhãn, nhân vật/đạo cụ; không ép cân hoặc thay bố cục mù |
| Đồng thời | 5 room dựng cảnh + 2 nội dung với dữ liệu từ cùng lần chạy; quan sát dispatch/checkpoint | Không vượt pool, không lẫn kết quả/context, phụ thuộc cảnh mẫu giữ đúng |
| Chrome dự phòng | Toggle tắt/bật trong Settings và các menu; bàn giao với room đang chờ và kết quả đang lưu trong phiên kiểm chứng | Chờ kết quả an toàn/lưu theo ranh giới sản phẩm, đóng Chrome cũ rồi mở dự phòng; đúng model/context; chỉ một lần chuyển |
| Quota | DOM quota thực đã lưu + phát hiện trên UI model thật nếu xuất hiện | Đúng quota của model được yêu cầu; không hạ model. Nếu phải tiêm tín hiệu để thử bàn giao, ghi rõ; không cố tiêu hết quota để tạo lỗi |
| Log/lưu/tiếp tục | Xem log ứng dụng, reload, tải lịch sử; lỗi và kết quả từ các case trên | Thứ tự/severity/counter đúng, không mất/trùng dòng, không ghi đè cảnh đã hợp lệ, mở lại có checkpoint đúng |
| Xuyên suốt | Một bản sao dự án thực: dựng/repair cảnh cần thiết → lưu → preview → render clip và mở lại | Kết quả nghiệp vụ hợp lệ, hình và chuyển động đúng; không chỉ xác nhận đã nhận text từ Gemini |

### So sánh chất lượng

- Với thay đổi chỉ đổi ID: render SVG gốc hợp lệ theo browser và bản đã đổi ID trong cùng Chrome/viewport/font; so sánh khung đầu, giữa, cuối và các mốc keyframe/hiệu ứng/camera liên quan. Yêu cầu không có khác biệt hình do ánh xạ ID; nếu gốc không render được thì ghi không có baseline pixel hợp lệ.
- Với AI tạo lại: không dùng pixel equality vì đầu ra có thể khác. Đối chiếu lời nguồn, cast, trang phục, số người/đạo cụ, quan hệ, vị trí, nhãn, phong cách, chuyển động và liên tục với cảnh liền kề; giữ cả ảnh/clip trước và sau để xem.
- Cảnh đã hợp lệ làm đối chứng phải giữ checksum/checkpoint nếu không thuộc phạm vi thay đổi. Không coi ít lỗi validation hơn là bằng chứng chất lượng tốt hơn.

## 5. Gate hoàn tất và bằng chứng bàn giao

1. Chốt manifest/case gốc trước khi code. Kiểm chứng native Retry đầu tiên, sau đó mới mở rộng sang composer, dữ liệu và hồi quy đồng thời.
2. Chạy TypeScript/lint/build và các test liên quan phạm vi sửa để bắt lỗi tích hợp; chúng không thay thế Chrome thật.
3. Mỗi case có before/after, nguồn dữ liệu/hash, thời gian, request/scene, URL room khi phù hợp, ảnh hoặc clip, trace thao tác, timeline submit/regenerate/response/save, kết quả validation và nhận xét chất lượng.
4. Báo cáo tách rõ: live pass, replay pass, fail và chưa kiểm chứng; lỗi provider/quota thực tế không được chuyển thành pass. Không lặp vô hạn chỉ để đạt kết quả đẹp.
5. Cập nhật báo cáo QA cũ: test direct button trước đây chưa phủ menu Gemini và refusal; prompt verdict vẫn còn ràng buộc cần sửa. Không tiếp tục dùng kết luận cũ như bằng chứng nghiệm thu đầy đủ.
6. Chỉ kết luận hoàn tất trong phạm vi đã có bằng chứng; liệt kê rõ case còn thiếu dữ liệu hoặc chưa tái hiện trên Gemini thật. Không cam kết 100% cho trạng thái dịch vụ bên ngoài.

Đầu ra dự kiến khi triển khai: patch chức năng theo từng bước, manifest dữ liệu thật, script kiểm chứng Chrome có thể chạy lại, ảnh/clip/trace và báo cáo QA cập nhật.

## 6. Bổ sung: quay lại cảnh lỗi sau lượt đầu

### Bằng chứng mới từ chính lần chạy này

- 16:34:35: lượt đầu có hình 27/36; chương trình bắt đầu vòng sửa tư thế/khung cho 4 cảnh đã có hình.
- 16:43:50: các tác vụ của vòng đó đã trả về; bắt đầu vòng sửa tư thế/khung thứ 2 cho 1 cảnh. Log mới nhất đọc được tiếp tục tới 16:44:28 cho tác vụ này, chưa có sự kiện bắt đầu phục hồi 9 cảnh lỗi. Đây là trạng thái lưu trên đĩa tại thời điểm kiểm tra, không tự chứng minh tiến trình trong bộ nhớ còn sống.
- Draft `68abd24089b381c60065b00629fc0155e5c8f6b1f04bb2beb61454744eb35da0.json` có 36 cảnh: 27 accepted, 9 failed. Chín cảnh failed đều có attempts=1, failStreak=1, chưa deferred: 6 refusal, 1 page_unresponsive và 2 lỗi ID SVG. Chúng chưa bị loại vì hết ngân sách.
- `scenePipeline.ts` hiện chờ toàn bộ lượt đầu, rồi tối đa 2 vòng quality redraw (accepted + qualityNote), sau đó mới tới tối đa 5 vòng recovery cho failed, rồi 2 vòng xử lý deferred. Vì thế tác vụ quality kéo dài chặn toàn bộ bước quay lại failed dù còn room rảnh.
- Recovery hiện không phải vòng lặp tới thành công vô hạn. Có giới hạn attempts và số vòng; pipeline có thể trả kết quả còn cảnh lỗi, còn production chặn xuất khi thiếu cảnh.
- Nguy cơ chất lượng đã xác nhận: RECOVERY_STRATEGY yêu cầu đơn giản hóa dần, bớt hiệu ứng/chuyển động, tư thế nghỉ; từ vòng 3 code lọc scene.nodes chỉ giữ character/essential và xóa scene.effects. Các quy tắc này xung đột yêu cầu giữ chất lượng, cần thay trước khi coi recovery là nghiệm thu đạt.

### Phạm vi bổ sung khi code

1. Đưa cảnh failed vào hàng đợi phục hồi ngay sau lượt đầu; không bắt chúng chờ toàn bộ các vòng sửa cảnh đã có hình. Điều phối chung theo pool và phụ thuộc tham chiếu; không chạy hai tác vụ sửa cùng một scene.
2. Tiếp tục xử lý các cảnh chưa đạt theo đợt với hợp đồng chất lượng gốc, chỉ dừng tác vụ scene khi thực sự đạt; trường hợp quota/CAPTCHA/hủy hoặc hết ngân sách phải giữ trạng thái chưa hoàn tất và nêu rõ lý do/khả năng tiếp tục. Thiết kế rõ ngân sách scene và ngân sách room để không nhân retry hoặc chạy nóng vô hạn.
3. Bỏ quy tắc tự giảm yêu cầu hình, cắt node/effect hay ép tư thế nghỉ trong recovery. Giữ source, bố cục cần thiết, chuyển động và continuity; chỉ sửa lỗi được chẩn đoán.
4. Hiển thị riêng lượt đầu đã xử lý, số cảnh đạt, số cảnh lỗi đang đợi, cảnh đang phục hồi và tác vụ đang chờ AI. Không hiển thị đã hoàn tất chỉ vì đã dispatch cảnh cuối hoặc có placeholder.
5. Thêm case thực 27 accepted + 9 failed vào manifest; kiểm bằng Chrome thật: sau lượt đầu chín cảnh được xếp phục hồi, không dựng lại các cảnh đạt ngoài phạm vi, lỗi lặp lại vẫn có tiến độ/lý do dừng rõ, reload/tiếp tục giữ hàng đợi và kết quả đã đạt.

### Chốt yêu cầu ưu tiên và bằng chứng 5 room song song

- Người dùng xác nhận: hết lượt đầu phải quay lại vẽ ngay cảnh failed, trước vòng sửa tư thế/khung của các cảnh accepted. Dùng các slot khả dụng trong pool 5 room để phục hồi; không bắt đầu từ đầu hoặc làm lại cảnh đã đạt ngoài phạm vi.
- Đã nối requestId với runId SHA-256 12 ký tự trong `storage/logs/music-workflow.jsonl`, không chỉ dựa vào log dispatch. Năm tác vụ dựng cảnh có thời gian chờ phản hồi chồng nhau:

| Worker | Request suffix | UI xác nhận đã gửi (giờ Việt Nam) | Kết thúc request |
| --- | --- | --- | --- |
| motion-scene-first | 6fedcc39 | 16:31:21.098 | 16:31:38.341, refusal |
| motion-scene-second | 624441af | 16:31:23.912 | 16:32:33.535, response completed |
| motion-scene-third | aed7bd7a | 16:30:27.346 | 16:32:33.319, response completed |
| motion-scene-fourth | 268538a3 | 16:29:59.363 | 16:32:31.993, response completed |
| motion-scene-fifth | e9a66cbc | 16:29:44.201 | 16:31:49.345, response completed |

- Trong khoảng 16:31:23.912 đến trước 16:31:38, cả 5 room đều đã được UI xác nhận gửi và chưa kết thúc xử lý phản hồi. Đây là bằng chứng các tác vụ Chrome/Gemini của lần chạy thật đang chồng nhau, không phải 5 tab chỉ mở sẵn. Không suy ra cả 5 đều tạo cảnh thành công hoặc biết lịch xử lý nội bộ phía Gemini.
- Pool dựng cảnh và gate theo provider đều cho tối đa 5; mutex chat khóa theo provider/project/worker nên không tuần tự hóa cả năm room. Tuy nhiên số slot bận còn phụ thuộc cảnh mẫu, planning, tác vụ motion, retry và số cảnh đang chờ. Giai đoạn quality round 2 chỉ có 1 cảnh sẽ không lấp đầy cả 5 room, trong khi 9 failed vẫn đang bị chặn bởi thứ tự các vòng.
