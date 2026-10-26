# Sửa gốc cách chia hình của Video Motion

Ngày: 24/10/2026.

Đã thêm lớp lập nhịp hình trước READ và chọn tài nguyên trong pipeline 2D puppet. Hình được tổ chức theo thông tin người xem cần thấy, thay cho việc lấy một câu làm một hình. Quy tắc dùng chung cho thể loại và định dạng video, không có điều kiện theo tên truyện, nhân vật hay video mẫu.

## Nguyên nhân và thay đổi

Trước đây, mỗi câu nguồn dẫn đến một yêu cầu READ/COMPOSE. Hình thứ hai chỉ được chèn khi khung dài hơn 20 giây rồi chia đôi thời lượng. Cách này vừa dễ sinh nhiều biến thể của một bố cục đứng nói, vừa bỏ lỡ đầu mối quan trọng xuất hiện giữa câu. Bổ sung tài nguyên đơn thuần không sửa được quyết định chia hình đó.

Pipeline hiện tại:

```
Lời kể và thoại gốc
  → storyboard: chọn nhiệm vụ hình + phạm vi lời nói
  → READ: nhân vật, trạng thái, điểm tựa, đồ vật, sự kiện cần thấy
  → kho tài nguyên / tạo phần thiếu
  → COMPOSE: một bố cục cho mỗi nhịp hình
  → compile theo thời gian từ của voice
  → ảnh kiểm tra → QA → sửa hình hoặc chia lại nhịp → kiểm lại
  → lập âm thanh từ bố cục cuối cùng
```

Không thay văn bản truyện, nội dung TTS hay phụ đề để đạt số hình mong muốn. Các câu nguồn vẫn tồn tại để đánh địa chỉ lời kể; chúng không quyết định số ảnh.

## Một nhịp hình là gì

Mỗi nhịp có một nhiệm vụ chính: xác lập quan hệ không gian, hành động/kết quả, đầu mối, phản ứng, giải thích hoặc chuyển nơi/thời gian. AI mô tả hình đại diện bằng tiếng Anh, kèm phạm vi lời nói gốc.

Một bố cục có thể đi qua nhiều câu, nhiều người nói và các beat liền nhau khi tình huống nhìn thấy vẫn đúng. Một câu có thể cần nhiều hình nếu xuất hiện một thay đổi thiết yếu. Không tách mọi động từ thành động tác diễn hoạt; hình kết quả hoặc một bố cục đại diện có thể đủ.

Việc đổi nơi, thời gian, chương hoặc có một beat đồ họa xen vào tạo ranh giới nhóm bắt buộc. Giới hạn kích thước request cũng tạo nhóm riêng. Trong mỗi nhóm, AI chọn nhịp theo nội dung; không áp định mức số cận mặt, số toàn cảnh hoặc cứ vài giây phải đổi hình.

Prompt nhận thể loại, định dạng, cách dựng và góc máy của dự án. Gợi ý 5–10 giây là tham khảo biên tập từ phân tích mẫu, không phải đồng hồ cắt hình. Thể loại thiếu nhi, tài liệu hay giải thích không bị bắt dùng cách gieo kinh dị.

## Mốc đổi hình gắn với lời nói

Storyboard dùng chỉ số dòng nguồn và một cụm từ được chép đúng từ dòng đó. Nếu cụm từ lặp, AI phải chỉ rõ lần xuất hiện. Mốc đầu tiên phải bắt đầu ở đầu nhóm; các nhịp phải đúng thứ tự và phủ toàn bộ từ nguồn đúng một lần.

Compiler quy đổi ranh giới từ sang thời gian word alignment của voice. Kiểm thử có một câu bắt đầu ở giây 16, đầu mối ở cụm “trên cửa” bắt đầu tại 19,8 giây; hình đổi tại 19,8, không chia đôi câu theo thời lượng.

Khi thiếu alignment, hệ thống nội suy và đánh dấu `estimated`. Phần lời không khớp được nội suy giữa các mốc đã khớp gần nhất. Alignment không hợp lệ hoặc đi ngược thời gian sẽ chuyển sang ước lượng có thứ tự. Vì vậy không khẳng định chính xác đến từng từ khi nguồn voice thiếu dữ liệu căn chỉnh.

## Giữ bố cục và người nói độc lập

Mỗi hình có `visualId` riêng. Khi đổi người nói, compiler tạo bản ghi thời gian riêng cho khẩu hình nhưng giữ cùng mã hình. Giữa các bản ghi cùng mã không có chuyển cảnh; camera dùng thời gian đầu/cuối của toàn nhịp nên không bắt đầu zoom lại khi sang câu hoặc beat.

Khẩu hình chỉ nhận khoảng giọng đọc của nhân vật thoại trực tiếp trong bản ghi đó. Người kể, lời nghĩ và lời ngoài hình không tự làm nhân vật trên hình mấp máy miệng. Khung đã có storyboard không sinh `shot2`; dữ liệu cũ còn nhánh tương thích nhưng khi dựng mới được chuyển sang storyboard.

Quy tắc vị trí, điểm tựa, quyền sở hữu đồ vật, trạng thái bối cảnh và khói từ lần sửa trước vẫn được dùng. Nhịp phủ nhiều beat truyền toàn bộ kế hoạch nguồn đến READ/COMPOSE/QA, tránh làm mất ngữ cảnh của beat sau.

## Cache, sửa lại và giao diện

Storyboard có phiên bản và chữ ký nguồn cùng hồ sơ thể loại/định dạng. Thay nguồn hoặc hồ sơ thì dựng lại kế hoạch; cache khung theo câu cũ không được dùng cho kế hoạch mới. Danh sách khung và trạng thái hoàn thành trong UI lấy nhịp hình thực tế.

QA có thể yêu cầu `replan:true` khi sai nằm ở phạm vi lời kể, ranh giới hoặc nhiệm vụ hình, thay vì chỉ vẽ lại cùng một bố cục. Pipeline lập lại nhóm bị ảnh hưởng, giữ nhóm không lỗi, đọc/dựng phần đổi rồi chụp ảnh kiểm lại. Nếu QA vẫn chưa đạt sau số lượt sửa cho phép thì báo lỗi cụ thể; không coi kết quả thiếu kiểm tra là thành công.

Âm thanh được lập sau vòng sửa hình, có mã nhịp hình và nhiệm vụ hình trong ngữ cảnh. Các beat có hình được dựng lại sẽ bỏ dấu cache âm thanh cũ để lập lại theo bố cục cuối cùng. Điều này tránh dùng kế hoạch âm thanh đã lập trước lúc QA chia lại hình.

## Các file chính

| Phần | File |
|---|---|
| Quy tắc và prompt | `src/constants/motionStoryboard.ts`, `src/constants/motionPuppet.ts` |
| Nguồn, phạm vi từ, chữ ký, chuyển sang nhịp hình | `src/lib/motionStoryboard.ts`, `src/lib/motionPuppet.ts` |
| Lập kế hoạch và sửa kế hoạch | `src/server/services/puppet/storyboard.ts`, `pipelinePuppet.ts` |
| Quy đổi sang thời gian voice | `src/server/services/puppet/storyboardTiming.ts`, `compilePuppet.ts` |
| Kiểm ảnh và yêu cầu chia lại | `src/server/services/puppet/qa.ts` |
| Camera và chuyển cảnh liên tục | `motion-engine/core.js`, `motion-engine/puppet2d.js` |

## Kiểm chứng

- TypeScript: `npx tsc --noEmit --pretty false`.
- `npm run test:motion-storyboard`: phủ nguồn, cụm từ lặp, dấu tiếng Việt NFC/NFD, nhiều câu/người nói/beat chung hình, tách trong câu, ranh giới nơi/thời gian/chương/đồ họa, giữ nhóm không lỗi khi lập lại, hồ sơ bốn thể loại, retry/hủy, READ/COMPOSE, compiler đầy đủ với clip voice, beat ngắn, timing thiếu/lỗi, ngữ cảnh âm thanh và cache.
- Cùng bộ trên render thật 5 ảnh tĩnh bằng Chromium; kiểm chính sách chuyển cảnh, camera liên tục và so sánh pixel trước/sau mốc đổi hình. Ảnh đã được mở kiểm tra. Đây là fixture nhỏ kiểm hành vi renderer, không phải mẫu đánh giá chất lượng hình do AI tạo.
- `npm run test:motion-visual-contract`: sự kiện/trạng thái, khói và duy trì tư thế.
- `npx tsx scripts/verify-motion-speech.ts`: phân biệt người kể/thoại/lời nghĩ/ngoài hình và giới hạn khẩu hình.
- `npx tsx scripts/verify-motion-camera-comfort.ts`: tốc độ camera và chuyển cảnh nhẹ.
- `npx tsx scripts/verify-motion-placement-general.ts`: điểm tựa, tiếp xúc và vị trí cho hai gói kiểu vẽ.
- `npx tsx scripts/verify-motion-folk-blocking.ts --installed`: đạt 368 kiểm tra, render lại 130 ảnh tĩnh từ tài nguyên đang cài cho cả hai phong cách, ngày/đêm và lật cảnh. Số này thuộc bộ hồi quy bố cục/tài nguyên, không phải 130 cảnh được AI lập mới trong lần sửa này.

`npm run test:motion-sound` cũ không chạy được vì import `src/server/services/motionGenService.ts` đã không còn trong dự án. Không ghi nhận bộ này là đạt. Luồng lập âm thanh 2D hiện tại được kiểm bằng AI giả lập trong bộ storyboard.

Không chạy một lượt AI/TTS/video hoàn chỉnh trong lần sửa này. Các câu trả lời AI ở kiểm thử là dữ liệu giả lập; việc chọn hình thực tế vẫn cần được QA trên từng dự án. Không cam kết AI luôn chọn đúng mọi tình tiết chỉ bằng prompt mới.

Backend đang chạy bằng `node --import tsx server.ts`, không có watcher. Cần khởi động lại backend để nạp thay đổi; lần sửa này chưa dừng tiến trình đang chạy vì chưa có bằng chứng đủ về các tác vụ đang nằm trong bộ nhớ của tiến trình đó.

Phân tích tham chiếu: [cách chia cảnh của Chiếc khăn Piêu](motion-reference-scene-division-2026-10-24.md). Bản nguồn tham chiếu cục bộ không có âm thanh; nhận xét chia hình dựa vào ảnh và phụ đề, không phải nghe âm thanh.
