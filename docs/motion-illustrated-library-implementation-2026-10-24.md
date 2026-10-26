# Kho minh họa tĩnh và sửa tài nguyên cũ — 24/10/2026

Triển khai theo [kế hoạch đã thống nhất](motion-illustrated-library-plan-2026-10-24.md). Hai gói Tối giản mặt nạ và Chibi màu dân gian dựng bằng hình minh họa có sẵn. Tập trung đúng người, tư thế, vật chứng, chỗ tựa và trạng thái; không yêu cầu mô phỏng mọi động từ trong lời kể.

## Luồng dựng đã sửa

- Storyboard và READ được cung cấp khả năng thực tế của gói: địa điểm, ngày/đêm, tư thế, chỗ tựa và các bố cục đã có. Danh mục dùng bảng tham chiếu chung cho bố cục trùng; giảm khoảng 109.000 xuống 49.000 ký tự mà vẫn giữ quan hệ vật lý. Prompt làm rõ đây là lập kế hoạch JSON, ứng dụng tự dựng hình.
- Dùng composition đã có trước. Trò chuyện/nhóm/người lớn–trẻ/tìm kiếm đơn giản có thể gán điểm có sẵn tương thích, kiểm khoảng cách và độ sâu. Không tạo điểm giường/ghế giả để vượt kiểm tra.
- Tìm cả biến thể có dấu `~`; tìm ngược liên kết ngày/đêm khi bản biến thể thiếu liên kết đi ra. Không nhầm tài nguyên đã có thành thiếu.
- Nếu cần ghép, chỉ dùng nền và mảnh cùng gói. Sau kế hoạch AI, bộ ghép xác định thử các phương án từ kho, kể cả khi AI không trả kết quả. Mỗi phương án phải qua kiểm trước khi đăng ký vào snapshot dự án. Không ghi mẫu mới vào kho trong lúc dựng video.
- Mẫu hình đạo cụ tách khỏi từng vật: hai bát có thể cùng mẫu nhưng giữ ID riêng; thay chủ sở hữu không tạo vật khác. Tách timeline hiện tại/hồi tưởng. Giữ catalog key khi vật đổi trạng thái và kiểm đúng biến thể trạng thái.
- Nóng/nguội không đòi hình bát mới; nhiệt độ giữ trong trạng thái kể chuyện và hiệu ứng thích hợp. Các trạng thái thay đổi hình như gãy/vỡ vẫn phải khớp tài nguyên thật. Schema và các hướng dẫn cũ đã được thống nhất về `key` mẫu hình và `identity` từng vật.
- Danh mục đạo cụ được gửi một lần mỗi request READ, thay vì lặp lại trong ghi chú từng nhịp hình. Các phương án ghép được chia ngân sách cho từng nền để nền đầu không chiếm hết lượt thử.
- Nếu preflight không chọn được, tối đa hai lượt đối chiếu lại READ với lời kể, yêu cầu bị thiếu và kho thật. Không bỏ vật chứng/quan hệ thiết yếu để báo đạt. Chọn đạo cụ xong mới chọn bối cảnh, tránh job đã lỗi nhưng tác vụ ghép nền vẫn tiếp tục chạy phía sau. Thiếu thật vẫn dừng trước voice.
- Compile/layout toàn bộ kế hoạch trước khi bắt đầu voice. QA dùng thời lượng voice cuối. Hủy job hoặc lỗi hình sẽ hủy phần voice liên quan.
- Khi tắt chuyển động nhân vật, engine không còn tự tạo bob đi bộ hoặc rung lắc. Giữ các giới hạn camera dịu đã có.

## Sửa kho cũ đã cài

Manifest và backup nằm ở [thư mục chuyển đổi](../scratch/illustration-library-20261024/). Danh sách bao phủ từng ID cũ, hash trước/sau, đường dẫn backup, việc sửa và trạng thái duyệt.

| Hạng mục | Kết quả |
|---|---:|
| Hồ sơ cũ kiểm kê | 1.991 |
| Hồ sơ được chuẩn hóa, còn chờ duyệt nội dung hình đầy đủ | 1.680 |
| Hồ sơ lịch sử giữ nguyên, không chọn cho sản xuất mới | 311 |
| Nhân vật Chibi được sinh lại hình đứng/ngồi và chỉnh rig | 59 |
| Bản ghi bổ sung đợt trước giữ nguyên | 144 |
| Công thức lớp SVG phục vụ kiểm kê | 1.072 |
| Mảnh SVG đã khử trùng trong dữ liệu kiểm kê | 2.536 |

Sửa tỷ lệ Chibi trong dữ liệu lưu và nguồn sinh: giảm đầu, kéo dài chân đứng, căn đầu/rig tư thế ngồi. Chuẩn hóa slot/tag, liên kết biến thể, alias đạo cụ và thêm bố cục tĩnh từ spot thật. Sửa nguồn tạo SVG để không phát sinh thuộc tính trùng gây lỗi ảnh.

Các công thức/lớp SVG là dữ liệu kiểm kê, chưa phải phân rã ngữ nghĩa mọi nội thất để chạy ghép độc lập. Runtime tiếp tục dùng các mảnh cảnh độc lập trong kho và giữ nền nguyên khối tốt như preset. Không khẳng định đã vẽ lại hoặc duyệt nội dung toàn bộ 1.680 tài nguyên.

Ảnh nằm trong scratch; [bảng ảnh gọn](../scratch/illustration-library-20261024/index.html) liên kết 1.680 ảnh render và 59 cặp Chibi trước–sau. 0 lỗi render không đồng nghĩa 0 lỗi nội dung. Đã xem các bảng nhân vật, cảnh và mảnh đại diện; việc duyệt từng ảnh vẫn ghi pending trong manifest.

## Cấu hình và tương thích

**AI duyệt ảnh cảnh** nằm trong lưới cài đặt tạo video, dùng cùng AI dựng video minh họa. Mặc định bật cho cấu hình mới; giữ lựa chọn đã lưu của dự án hiện tại.

- Bật: gửi ảnh minh họa và lời tương ứng cho AI kiểm; sửa có giới hạn và duyệt lại. Thiếu phản hồi không được ghi là đạt.
- Tắt: bỏ lời gọi AI review ảnh, vẫn kiểm schema, tài nguyên, vị trí và lỗi engine. Không tắt các lời gọi lập storyboard/READ/COMPOSE.
- Snapshot dự án cũ giữ hình cũ. Dựng lại mới nhận kho sửa; đổi gói xóa cache hình và yêu cầu dựng lại. Bản dựng có khóa phiên bản minh họa để tránh xuất nhầm hình cũ.

## Kiểm chứng

- TypeScript đạt; bộ kiểm minh họa đạt ở cả hai gói: biến thể ngày/đêm, tư thế/chỗ tựa, hai vật cùng mẫu, chuyển vật và hồi tưởng, đúng trạng thái đạo cụ, ghép xác định sau phản hồi AI rỗng và loại phương án sai.
- Kho đóng: 854 phép kiểm, 82 ảnh engine. Pipeline giả lập phản hồi AI ở hai gói: dựng/compile/resume, review bật, thời lượng voice cuối và thiếu vật bị chặn trước voice.
- Kiểm UI công tắc mặc định/lưu sau reload/giá trị request; kiểm tuyến AI, camera, catalog và render toàn kho. Bảng trước–sau có 118 ảnh, không lỗi render.
- Installer/rollback được kiểm trên fixture: kiểm hash, từ chối ghi đè khi có xung đột, ghi nguyên tử và khôi phục khi lỗi.
- Kiểm phục hồi bổ sung đạt ở cả hai gói: READ gán nhầm `dining` cho người nằm/người đứng → preflight không cho qua → đọc lại đúng `bedside` → dựng/compile thành công → mới khởi động voice. Kiểm trường hợp thiếu thật vẫn dừng, không rơi vào xuất hình sai. Hash 1.991 hồ sơ cũ không đổi sau các lượt sản xuất thử.
- Nghiệm thu AI thật dùng kịch bản riêng “Tiếng gõ bên cửa bếp”, giữ nguyên dự án người dùng đang mở. Gemini đã lập 17 hình cho 42 câu nguồn; lượt đầu phát hiện yêu cầu sai về hình bát nguội, đã sửa ở hợp đồng dùng đạo cụ và kiểm hồi quy. Lượt chạy lại đang chờ Google xác minh CAPTCHA lần mới, chưa tới bước tạo voice/xuất MP4. Chưa coi fixture hoặc một lượt AI bị chặn là video hoàn chỉnh. Nhật ký ở `scratch/illustration-library-20261024/acceptance.log`.

## Bảo trì và khôi phục

```powershell
npm run test:motion-illustration
npm run motion:review-illustration-library
node --import tsx scripts/review-motion-illustration-library.ts --comparison
python python_scripts/kit_seed/illustration_gallery.py
python python_scripts/kit_seed/migrate_illustration_library.py --rollback
```

Đợt kho đã cài tại `scratch/illustration-library-20261024/manifest.json`. Installer chỉ cài khi hash nguồn/backup/bản chuẩn bị hợp lệ; rollback chỉ khôi phục khi file hiện tại vẫn khớp bản đã cài. Không ghi đè dữ liệu người dùng sửa sau đó. Khi chuẩn bị đợt bảo trì mới phải dùng thư mục output mới, không ghi lại staging của đợt đã phát hành.

Phạm vi nguồn tham khảo vẫn là các bảng và cảnh đã phân tích trước đó, chưa phải duyệt toàn bộ cảnh/thoại 22 video. Các quan hệ thiết yếu thật sự không thể dựng từ kho vẫn báo thiếu sớm; chưa có bảo đảm thành công cho mọi nội dung bất kỳ.
