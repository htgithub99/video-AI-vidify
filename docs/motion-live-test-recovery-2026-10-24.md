# Lượt kiểm Video Motion ngày 24/10/2026

Lượt thử dùng truyện “Tiếng gõ bên cửa bếp”, gói Chibi màu dân gian, nhân vật đứng/ngồi/nằm độc lập, hai bát cháo, cửa đóng và chuyển đêm sang sáng. Tắt AI review ảnh, giữ các kiểm tra dữ liệu và dựng hình. Chạy qua API thật của tool bằng `scripts/run-motion-illustration-acceptance.ts`, thư mục `scratch/pack-selection-20261024/live-2m`.

## Các nguyên nhân đã sửa

- Trích dẫn đúng nội dung nhưng khác hoa/thường, Unicode hoặc khoảng trắng bị loại: đối chiếu với đoạn nguồn gốc và giữ lại chính văn bản nguồn; không chấp nhận diễn giải hoặc từ bị cắt giữa chừng.
- Mã định danh riêng của đồ vật bị dùng làm yêu cầu hình học: kiểm năng lực tài nguyên bằng `catalogKey`, vẫn giữ riêng identity, trạng thái và quyền sở hữu.
- Nhu cầu của cảnh có trạng thái cửa không được gộp về phòng gốc: gộp vật đỡ và mặt đặt đồ trước khi chọn/ghép bố cục.
- Tìm biến thể ánh sáng sao chép toàn bộ kho trong từng phương án thử: chỉ sao chép biến thể tìm được; kiểm cặp ngày/đêm trong phạm vi thử riêng, không ghi phương án bị loại vào kho.
- Vòng tìm bố cục không nhường event loop: thêm điểm nhường xử lý và kiểm tra hủy theo lô hữu hạn.
- Mô tả kỹ thuật `kitchen_door: closed` khiến phòng ăn bị phân loại thành bếp: nhận diện địa điểm từ cảnh gốc và phần mô tả địa điểm, loại phần metadata trạng thái khỏi phép phân loại.
- Phản hồi chọn cảnh đúng có `artifactType` và `requestId` bị bộ kiểm coi là trường lạ: chấp nhận hai trường giao thức, kiểm đúng loại tác vụ; vẫn loại mã lựa chọn ngoài danh sách và dữ liệu sửa vị trí.
- Kho có hình bàn/giường nhưng thiếu năng lực đặt đồng thời: bổ sung mặt bàn thứ ba, hai ghế ngồi mép giường và bố cục người nằm/người ngồi bên cạnh cho cả hai gói. Dùng hình có sẵn, không vẽ tài nguyên trong quá trình tạo video. Migration có sao lưu ở `scratch/closed-contacts-20261024`.

## Cách chạy tiếp

- Điểm cửa dùng tọa độ tiếp xúc làm chân khiến nhân vật đứng lơ lửng: đứng/đi dùng `groundY`; chỉ ưu tiên cửa khi nội dung cần vị trí đó.
- Người đứng che bát trên bàn: kiểm độ che khuất đồ vật trước khi khóa lựa chọn; bổ sung điểm đứng hai bên bàn trong bộ sinh và migration của cả hai gói. Không tự buộc bố cục tương tác khi phần đọc cảnh chưa yêu cầu.
- Nâng phiên bản lựa chọn lên 2 và làm mới snapshot kho cũ khi nâng phiên bản, tránh dùng lại hình học đã thiếu điểm đặt.
- Tạo âm thanh nhận kịch bản đầu vào thay vì bản vừa dựng: truyền chính bản đã có khung hình sang bước tạo voice. Giữ mã hình theo lời thoại nguồn khi kế hoạch âm thanh chia/gộp câu đọc.

Các hồi quy cho điểm chân, che khuất đạo cụ, phiên bản lựa chọn, truyền kịch bản sang âm thanh và chia lời đọc đã chạy thành công. TypeScript không báo lỗi. Kiểm tái hiện bằng dữ liệu thật dựng được 21 khung; lượt chạy thật và MP4 vẫn cần được kiểm riêng.

## Kiểm ảnh sau lượt dựng thật

Lượt tiếp theo đã hoàn tất hình và voice, nhưng ảnh kiểm cho thấy bát biến mất ở câu không nhắc lại, hai người đứng sai quan hệ với cửa/giường và thân người nằm nổi trên nệm. Vì vậy chưa bàn giao MP4 từ lượt này.

- Bộ giữ trạng thái nay lưu đồ đặt trên bàn/sàn/treo theo địa điểm gốc và timeline, kể cả khi quay lại phòng. Chuyển chủ, chuyển chỗ hoặc trạng thái removed/absent/gone/consumed kết thúc vị trí cũ. Hồi tưởng tách biệt. Đã kiểm tính chạy lại không làm đổi kết quả.
- Phần đọc cảnh có `states[].placement` với dẫn chứng nguyên văn, mốc đồ nội thất và quan hệ beside/behind/between. Bộ tìm điểm đặt kiểm quan hệ trước khi tạo mã lựa chọn, nên AI chọn mã không thể sửa lại vị trí tùy ý. Đây là ràng buộc hình minh họa tĩnh.
- Kho hai gói có thêm điểm đứng cạnh giường cho người thứ hai và phía đối diện; migration chỉ thay hình học, có sao lưu riêng ở `scratch/closed-contacts-spatial-20261024`.
- Engine dịch phần thân khi nằm theo tỷ lệ đầu để thân cũng tiếp xúc nệm, thay vì chỉ xoay cả hình đứng và để đầu lớn đỡ thân lơ lửng.
- Phiên bản visual contract 2 và selection 4 làm mới dữ liệu đọc/bố cục cũ; giữ storyboard và voice hợp lệ.
- Trích dẫn giữ nguyên thứ tự và đủ từ nhưng bỏ dấu câu được đối chiếu về đúng đoạn nguồn. Vẫn từ chối thay từ, thiếu từ hoặc ghép sai thứ tự.
- Khi AI sửa bằng cách bỏ một placement sai, loại dữ liệu placement cũ khỏi bản nháp, tránh merge giữ lại lỗi qua mọi lượt thử.
- Đặt danh sách mục tiêu đang chờ ở cuối prompt, sau ngữ cảnh và cảnh đã chấp nhận, để giảm việc AI lặp hàng xóm của mục tiêu.
- Các mã mới do lượt AI khác đặt cho cùng loại đồ, cùng số lượng, vị trí và chủ sở hữu được liên kết lại với định danh đã có nếu không có sự kiện chuyển/đưa thêm. Giữ ánh xạ một-một giữa các đồ cùng loại trong một khung. Đã kiểm hồi quy trường hợp hai đồ bị đổi mã ở lần quay lại phòng.

`node --import tsx scripts/run-motion-illustration-acceptance.ts --root=scratch/pack-selection-20261024/live-2m --no-review --resume --follow`

Không dùng `--retry` vì cờ này xóa kế hoạch hình đã làm. `--resume` giữ trạng thái trung gian. Khi hoàn thành dựng hình và voice, dùng cùng runner với `--render`.

## Ràng buộc hướng đứng theo mốc nội thất

Ảnh thật cho thấy kiểm độ sâu đơn thuần chưa đủ cho câu “Út đứng sau Nam” khi Nam đứng ở cửa: Út vẫn có thể gần cửa hơn Nam. Bộ kiểm nay đối chiếu thêm khoảng cách đến chính mốc mà người phía trước đang đứng, ưu tiên điểm sát mốc cho quan hệ `at`, và yêu cầu người đứng sau xa mốc hơn. Khoảng cách đến mốc dùng trục ngang vì tọa độ mặt bàn/cửa và tọa độ chân không cùng loại tiếp xúc. Các mốc ưu tiên điểm cửa, mặt đặt đồ, chỗ nằm rồi chỗ ngồi.

Bộ kiểm lựa chọn đã lưu cũng chạy lại ràng buộc không gian, nên chỉ khung bị sai được dựng lại; không xóa voice hoặc các khung hợp lệ. Trước lượt resume9, bộ kiểm dữ liệu thật xác định đúng một khung cửa không hợp lệ trong 21 khung. TypeScript và kiểm hồi quy quan hệ không gian đều thành công.

## Trạng thái mắt tách khỏi tư thế

Lượt MP4 đầu đã render thành công nhưng ảnh trích cho thấy bà mở mắt ở câu “mắt nhắm nghiền”. `lie` chỉ là tư thế, không thể suy ra luôn ngủ hay thức. Bổ sung `states[].eyes` gồm trạng thái open/closed và dẫn chứng nguyên văn; chỉ chấp nhận dẫn chứng có trong đúng câu nguồn. Trạng thái mắt riêng từng người được giữ qua các phản ứng cùng cảnh cho đến khi có thay đổi; không tự làm người khác nhắm mắt và không làm người nằm ngồi dậy khi mở mắt. Dùng biểu cảm có sẵn của engine, không vẽ thêm tài nguyên.

Hồi quy đã kiểm: nhận trích dẫn hợp lệ, loại trích dẫn sai, chỉ đóng mắt đúng người, giữ trạng thái qua phản ứng và mở lại mắt trong khi giữ tư thế. TypeScript, bộ kiểm đọc cảnh và visual contract đều thành công. Đọc lại hai mục tiêu liên quan qua AI thật để kiểm đường chạy này trước lượt MP4 cuối.

Lượt đọc thật trả đúng hai trạng thái mắt. Phát hiện thêm bộ kiểm quan hệ `at bed` chỉ đo từ tâm chỗ nằm, nên loại cả điểm đứng cuối giường đã được kho gắn với chiếc giường đó. Bộ kiểm nay chấp nhận điểm tiếp xúc cùng nội thất trước khi xét khoảng cách tới tâm; vẫn giữ ưu tiên điểm cửa và kiểm thứ tự đứng sau theo mốc cửa. Hồi quy điểm cuối giường cách tâm 640 đơn vị đã thành công. Đã giữ lại kế hoạch hợp lệ và hai bản đọc mắt có dẫn chứng, không dùng các sửa vị trí sai từ lượt AI phục hồi do lỗi bộ kiểm gây ra.

## Kiểm chứng

Bộ kiểm lựa chọn tài nguyên: hai gói, tám ảnh dựng, không có lỗi tự động. Bộ kiểm kho: 854 phép kiểm, 82 ảnh, không gọi AI vẽ. Sau resume11, dữ liệu thật có 21 khung hợp lệ, không còn lựa chọn vi phạm ràng buộc không gian; engine dựng 21 ảnh kiểm không báo lỗi. Đã xem bảng ảnh và riêng cặp nhắm/mở mắt; cảnh cửa đúng thứ tự người đứng trước/sau, giữ đủ hai bát khi trở lại bàn, và người nằm ở giữa hai cháu trong cảnh cuối buồng. TypeScript và Prettier thành công sau các thay đổi cuối.

Lượt thật có kiểm đường chuyển AI: Gemini từ chối lựa chọn cảnh, DeepSeek chưa đăng nhập, tool dùng ChatGPT thành công và tiếp tục hoàn tất hình/voice. Không cần bật review ảnh hoặc tạo tài nguyên ngoài kho. Voice dài 148,715 giây; giữ nhịp tự nhiên, không tăng tốc để ép đúng 120 giây. File kiểm có 21 nhịp hình; khi ghép với các đoạn thoại, timeline xuất gồm 26 đoạn hình.

## MP4 cuối

- Hoàn tất lúc 23:22:58 ngày 24/10/2026; job `d52814d5-e968-4ac5-90fb-28dc1da6074e`.
- File: `storage/output/motion-video/tieng-go-ben-cua-bep-kiem-kho-minh-hoa-16x9-draft-1792858959432.mp4`.
- 148,715 giây, 1280×720, 24fps, H.264/AAC stereo 48kHz; âm lượng xuất đo được -14,0 LUFS.
- Giải mã toàn bộ video và âm thanh bằng FFmpeg thành công, không báo lỗi. Đã trích 26 ảnh giữa các đoạn hình từ chính MP4 và xem bốn bảng ảnh, gồm cặp nhắm/mở mắt, cảnh cửa, cảnh nằm giữa hai cháu và cảnh sáng trở lại bàn.
- Các bảng ảnh và thông số tại `scratch/pack-selection-20261024/live-2m/final-board-*.jpg`, `media-probe.json`, `final-frame-audit.json`. Không dùng các bảng kiểm cũ trước lượt sửa làm kết quả cuối.
- Chưa đánh giá bằng nghe trực tiếp; phép kiểm âm thanh ở lượt này là thông số, thời lượng, luồng và giải mã file.
