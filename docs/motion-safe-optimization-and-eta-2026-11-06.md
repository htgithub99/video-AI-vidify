# Tối ưu an toàn và ước tính thời gian video Granicus

Ngày 06/11/2026. Đây là phân tích và đề xuất, chưa triển khai thêm source chức năng trong lượt này.

## Phạm vi và bằng chứng

Video thực tế: **Battle of the Granicus 334 BC: The Deciding Moment**, production `f82fe2c76c1ab22004a52e6147acdf2c`. Có 98 cảnh, dài 671,6 giây, 1920×1080, 30 fps, 20.148 frame. Giữ model, mức suy nghĩ, brief, nhận diện/continuity, chuyển động, SFX, cấu hình review và chất lượng xuất của dự án.

Thời gian theo đồng hồ 7 giờ 37 phút gồm khoảng 2 giờ không có log trước khôi phục và khoảng 16 phút giữa các lượt kịch bản. Không tính các khoảng đó là hiệu năng xử lý và không nhận toàn bộ phần giảm đó là thành quả tối ưu code. Xem timeline chi tiết tại `motion-workflow-latency-audit-2026-11-06.md`.

## Những phần có thể sửa bằng code

| Phần | Bằng chứng từ lần chạy | Cách sửa và điều kiện giữ chất lượng |
| --- | --- | --- |
| Rig motion thiếu đích | 38/98 rig chạm trần 64 parts; có ID thật trong SVG nhưng bị bỏ khỏi rig; label bị loại vẫn xuất hiện trong mô tả | Chọn parts theo chủ thể/action bắt buộc và quan hệ cha con; phân biệt layer mô tả và target được phép. Nếu cần chia task phải ghép và validate đủ, không bỏ hình/hiệu ứng để vừa ngân sách. |
| Retry bỏ sót phản hồi lỗi | Có refusal dạng “công nghệ trí tuệ nhân tạo dựa trên văn bản” không khớp matcher hiện tại | Nhận diện theo phản hồi thật/UI/artifact; bấm Thử lại trước, sau đó tối đa 2 retry trong room rồi mới đổi room. Giữ phân loại quota/CAPTCHA/refusal nội dung và tránh gửi trùng task đang chạy. |
| Resume nhầm attempted là hoàn tất | `motionTried` ghi trước khi request có kết quả; cảnh 6 còn fallback thay cho AI motion | Tách attempted/accepted/failed retryable, cache theo source/SVG/model/config; tiếp tục đúng motion còn lỗi, không vẽ lại ảnh đã đạt. |
| Context motion tăng dần | 48 request qua transport trung bình 128,33s so với 57 request trực tiếp 34,46s; bible tích lũy 98 mục | Context có phiên bản, room ACK đúng bản, gửi delta xác nhận; room mới nạp đủ. Giữ đường gửi đầy đủ khi chưa xác nhận. Không cắt mất bible/continuity để giảm token. |
| Slot motion chỉ có 2 | Tổng 8.124 worker-seconds cho 105 request motion; 5 room hình thực sự chạy song song nhưng chưa được tái sử dụng cho motion | Sau barrier đủ ảnh/sửa khung mới dùng pool hình cho motion, tối đa 5. Đúng model mainExec, snapshot bible có phiên bản và merge xác định; đo throughput hợp lệ, giảm tải nếu quota/UI nghẽn. Không giả định cảnh phụ thuộc có thể độc lập hoàn toàn. |
| SFX nằm ở cuối | 9 nhóm, 10 phút 33 giây sau motion | Chuẩn bị phần độc lập với SVG sớm trên script đã chốt, dùng slot nội dung rảnh. Kết quả gắn hash, không đè narration/scene mới. Giữ dependency nào thực sự cần dữ liệu muộn và chính sách optional hiện tại. |
| Render quá nhiều worker | Full run 7 worker đạt khoảng 3 fps; hai thứ tự benchmark cùng cho 1 worker nhanh hơn 7 trên sample | Đo nhiều loại cảnh để chọn concurrency theo máy/workload. Sample giữ 1080p30/H264/CRF23, SSIM giữa hai clip thử là 1.000000. Không giảm FPS, resolution, chi tiết SVG hoặc hiệu ứng. |
| Log dễ gây hiểu nhầm | Request có thể gồm ACK/context/sửa, không tương ứng số cảnh; hình đạt chưa chứng minh plan nguồn đầy đủ | Log riêng queue/submit/model/ACK/validate/save, số task và tin nhắn; trạng thái plan/ảnh/motion/review riêng, sequence thời gian rõ. Không thay policy chất lượng để làm log xanh. |

## Lỗi hình không nên xử lý bằng mẹo làm nhanh

- Cảnh 21, khoảng 02:21: đầu/tay Alexander bị cắt. Lần kiểm tra bổ sung dùng Chrome cài thật, cửa sổ hiển thị, phiên bản 156.0.8078.80. Root SVG `0 0 1280 720`; ngay SVG gốc đầu có top **−209,55**, tay phải **−64,88**, tay trái **−12,46**. Tại đầu/giữa/cuối animation vẫn nằm ngoài. Đây không chỉ là camera lúc xuất. Code có thể kiểm bounds thật và sửa transform của đúng nhóm quan hệ nếu chứng minh giữ được pose/contact/shot; không tự thu toàn cảnh hoặc dịch riêng đầu/tay. Nếu không bảo đảm thì yêu cầu AI sửa đúng nhóm.
- Cảnh 45, khoảng 05:08: tỷ lệ đầu/mũ cần sửa artwork có kiểm chứng. Không thu nhỏ mũ hàng loạt theo một hệ số.
- Cảnh 60 khoảng 06:50 và cảnh 67 khoảng 07:42: thiếu số người so với brief. Có thể cải thiện phát hiện và prompt sửa cục bộ, nhưng người còn thiếu phải được tạo đúng; không nhân bản hình để giả đủ số lượng.
- Bốn cảnh này đã chạm giới hạn redraw theo cấu hình hiện tại. Giữ chính sách advisory/review hiện có, hiển thị đúng cảnh báo. Nếu yêu cầu không được xuất khi còn cảnh báo, đó là thay đổi chính sách riêng và làm thời gian phụ thuộc số lần sửa hình; chưa đưa vào ETA bên dưới.

Bằng chứng bổ sung: `scratch/motion-audit-20261106/frame-bounds-chrome.json`. Script chỉ đo dự án, không sửa dữ liệu production.

## Quy trình đề nghị

1. Phân tích → viết đủ chương → biên tập. Chốt plan theo nhóm nguồn, chỉ coi tổng cảnh đầy đủ khi đủ mọi nhóm.
2. Chạy giọng/SEO và phần SFX đủ đầu vào song song; ưu tiên task nguồn khi chúng còn cần slot nội dung.
3. 5 room dựng hình theo ràng buộc cảnh mẫu/continuity. Hết lượt đầu quay lại ngay các cảnh lỗi; giữ ảnh đã đạt. Recovery theo Thử lại → 2 retry cùng room → room mới. Quota dùng nhánh chuyển Chrome đã cấu hình và chờ lưu các task còn chạy.
4. Đủ toàn bộ hình → sửa khung/tư thế theo chính sách hiện tại → tạo motion bằng pool đã rảnh. Kiểm target trước request, bible có phiên bản; không gửi phụ thuộc sai thứ tự.
5. Review trên hình có motion nếu được bật → compile khi đủ các đầu vào bắt buộc.
6. Chọn concurrency render bằng đo mẫu đại diện → render giữ nguyên chất lượng → ghép và kiểm MP4.

## Mô hình thời gian cho một video mới tương tự

**Khoảng lập kế hoạch: 3 giờ 20 phút đến 4 giờ 30 phút; nên dự trù khoảng 4 giờ.** Đây là dự báo có điều kiện sau khi các tối ưu đã triển khai và kiểm chứng, chưa phải thời gian full-run đã đo của phiên bản mới.

| Phase nằm trên đường hoàn tất | Số đo hiện tại | Dự toán sau tối ưu |
| --- | --- | --- |
| Phân tích + đủ kịch bản + biên tập | Khoảng 25 phút xử lý qua các lượt, loại khoảng chờ 16 phút | 25–35 phút |
| Plan/hình mới đủ 98 cảnh + sửa theo chính sách hiện tại | Lượt đầu 70m42; tới đủ 98 ảnh cần thêm khoảng 11 phút hoạt động ở lượt tiếp tục, còn quality repair | 70–90 phút; chưa giả định vẽ mới chỉ mất 4m36 của checkpoint cuối |
| Motion đủ 98 cảnh | 69m28, peak 2 task; tổng request-duration 8.124 giây | 25–40 phút, có điều kiện pool/context/rig tốt và không vướng quota |
| Render frame | 112m47, khoảng 3 fps | 75–100 phút, cần xác nhận khoảng 3,36–4,48 fps trên nhiều cảnh và full run |
| Compile, ghép/kiểm tiếng, MP4 | Khoảng 4 phút + compile 24s | 4–6 phút |
| Giọng, SEO, SFX | 18m38, 37m42, 10m33 | Chồng với phase hình/motion nếu đủ đầu vào và tài nguyên; không cộng lần nữa khi đã hoàn tất trước barrier |

Cộng các phase tuần tự: **199–271 phút**, làm tròn **3h20–4h30**. Nếu giọng/SEO/SFX chưa xong tại barrier thì cộng đúng phần đuôi còn lại. Không cộng toàn bộ thời gian các nhánh song song.

Cơ sở và giới hạn của hai dự báo chính:

- Motion: 8.124 / 5 = **1.624,8 giây ≈ 27 phút** là phép tính chia tải lý tưởng với cùng tổng request-duration, chưa tính phụ thuộc/contestion. Context versioned có thể giảm duration, nhưng quota, phụ thuộc continuity và room mới có thể tăng nó. Khoảng 25–40 phút là ngân sách mục tiêu cần đo, không chứng minh 5 room nhanh gấp 2,5 lần.
- Render: benchmark 60 frame trên một cảnh nặng cho 1 worker khoảng 5,2 fps, 7 worker khoảng 3,5–3,7 fps. Không nhân thẳng 5,2 fps cho cả phim. Dự toán 75–100 phút dùng throughput thấp hơn sample tốt nhất; vẫn cần nhiều cảnh đại diện để xác nhận. Nếu render giữ 112m47 như cũ thì tổng tăng thêm khoảng **13–38 phút** so với dự toán này.

Điều kiện: cùng máy, cùng video khoảng 11m12/98 cảnh/1080p30, cùng model/cấu hình, review AI vẫn tắt như đầu vào thật; dịch vụ phản hồi tương đương, không hết quota, CAPTCHA, restart hoặc chờ người dùng. Nếu yêu cầu sửa hết bốn cảnh báo hình hiện tại trước khi xuất, thời gian sửa thêm chưa thể định lượng từ dữ liệu này.

Đối với dự án đang có đủ 98 ảnh, chi phí tiếp tục khác tạo mới: tận dụng checkpoint hợp lệ và chỉ làm phần còn thiếu/sai. Không nên cho chạy lại 98 cảnh để chứng minh tốc độ.

## Kiểm chứng bắt buộc trước khi coi dự báo là số đo

Lấy các response/SVG/task lỗi thật của production này. Kiểm retry trên Chrome cài thật; xác nhận không gửi trùng, không bỏ bước, không mất kết quả khi đổi room/Chrome. Kiểm motion đủ subject/anchor và continuity khi hoàn thành lệch thứ tự; cache/resume chỉ bỏ qua kết quả accepted. Benchmark render ở cảnh nhẹ/nặng/đông người, so frame và âm thanh trước/sau, kiểm FPS/frame count/duration. Sau đó đo một full run mới cùng cấu hình, báo thời gian theo phase và số cảnh đạt/cảnh báo/fallback. Các kiểm tra ngắn hiện có chưa thay thế full run này.
