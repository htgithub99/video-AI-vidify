# Chọn phương án cảnh từ kho cố định

Ngày triển khai: 24/10/2026. Phạm vi: `minimal_mask` và `chibi_folk` trong pipeline puppet, giữ hình minh họa tĩnh. Không thay đổi chế độ vẽ tự do ngoài hai gói này.

## Kết quả và nguyên nhân gốc

Trước đây danh mục có thể gộp khả năng của nhiều biến thể, AI tự trả bố cục, rồi code mới cố sửa vị trí khi compile. Có giường và có bàn trong danh mục không chứng minh một cảnh chứa đủ cả hai. Điểm có tên đúng cũng có thể làm người đứng che người nằm.

Luồng mới dùng danh mục theo từng hồ sơ cảnh thực, tạo phương án hoàn chỉnh bằng code, rồi yêu cầu AI chỉ chọn `choiceId`. Ba góc `wide`, `people`, `group` được đưa ra khi có người; cả ba giữ cùng vị trí. Hình chỉ có bối cảnh/đồ vật dùng góc phù hợp từ bộ dựng hiện có. Không buộc tạo đủ số phương án khi kho chỉ có một cách hợp lệ.

## Các phần đã nối vào code

| Phần | Cách xử lý |
|---|---|
| Chỉ mục | `packInventory.ts` kiểm SVG, kích thước, điểm neo, vùng tiếp xúc và tham chiếu vai. `packCatalog.ts` dùng từ điển để tránh lặp nhưng giữ quan hệ từng stage, biến thể, fixture và ID thật; không lấy hợp khả năng của các cảnh khác nhau |
| Kho cũ | Tất cả bản ghi thuộc hai style được rà cấu trúc/hình học. Alias, tài nguyên cách ly và tài nguyên không thuộc nguồn seed tiếp tục bị loại theo chính sách hiện có. Không xóa/sửa kho qua bước tạo video |
| Danh tính | Tiếp tục dùng character ID cố định, vật có identity riêng, trạng thái/ownership và fixture/timeline từ visual contract. Không chọn lại cùng mẫu nhân vật cho vai khác chỉ vì AI trả trùng lựa chọn đã dùng |
| READ | Không nhận địa điểm mới chỉ nhờ `placeDesc`. Bằng chứng phải là đoạn trích có thật trong lời kể của hình; kiểm cả READ mới và READ dùng lại khi tạo phương án |
| Tạo phương án | `packSceneChoices.ts` ràng buộc toàn bộ người, tư thế độc lập, spot khác nhau, mặt đỡ, đạo cụ, chủ cầm/đeo và ID cùng gói. Phương án thiếu chi tiết thiết yếu không được đưa cho AI |
| Ghép cảnh | Yêu cầu mặt bàn của vật được đưa vào nhu cầu ghép. Bộ tìm ưu tiên tổ hợp phủ các thành phần bắt buộc, thử nhiều cách gán slot được phép và kiểm toàn bộ cảnh. Không gọi AI viết kế hoạch mảnh tự do cho hai gói đóng |
| Che khuất | `packPlacement.ts` loại vùng đặt không hữu hạn/ngoài khung và cặp người che nhau quá nhiều theo hộp hình học gần đúng. Các tiếp xúc được khai báo trong bố cục được xử lý riêng |
| Hợp đồng AI | Chỉ nhận `choices: [{ i, choiceId }]` trong danh sách của đúng hình. Từ chối mã lạ, trùng chỉ số, chỉ số ngoài yêu cầu, tọa độ hoặc trường tự do. Giữ kết quả hợp lệ khi sửa phần còn thiếu, tối đa ba lần theo hợp đồng |
| Dự phòng | Nếu AI vẫn chọn sai và lỗi không phải hủy/lỗi kết thúc phiên được tầng AI đánh dấu, code dùng phương án cùng dữ kiện đã kiểm. CAPTCHA tiếp tục do tầng phòng chat chờ người dùng xử lý. Log và hồ sơ ghi `source: deterministic`; không nhận mã lạ rồi đổi ngầm sang tài nguyên gần giống |
| Giữ vị trí | Các góc dùng cùng assignment. Bộ nhớ vị trí tách theo cảnh, timeline và địa điểm; giữ chỗ của người quay lại và điểm đặt vật theo identity khi đổi vật làm trung tâm hình |
| Ảnh | Khi bật duyệt ảnh, dựng các phương án bằng engine và gửi bảng JPEG có nhãn mã; sau khi chọn vẫn QA ảnh cuối. Khi tắt không gửi bảng/ảnh QA cho AI, vẫn dựng ảnh và kiểm engine |
| Lưu và compile | `selectionVersion`, `sceneSelections`, `choiceId`, `layoutLocked` lưu nguồn lựa chọn, các mã được phép, hash READ/khung, binding tài nguyên và bằng chứng. Lưu từng nhóm đã nhận. Compile kiểm khớp rồi dùng vị trí đã khóa, không dàn lại |
| Cache cũ | Khi dựng lại, khung thiếu phiên bản lựa chọn mới được dựng lại; READ phù hợp có thể dùng lại nhưng vẫn phải đạt kiểm bằng chứng/phương án. Render khung lịch sử chưa có hợp đồng mới giữ đường tương thích cũ |
| Trước âm thanh | Kiểm tất cả phương án, dựng ảnh và QA nếu bật trước `prepareAudio`/`resolveVoice`. Sau khi có voice dựng lại bảng kiểm theo thời gian giọng để giữ hình/thoại khớp |

Các hằng số, prompt và thông báo mới nằm trong `src/constants/motionPackSelection.ts`. Không thêm comment vào code. Các file TypeScript được format theo cấu hình rộng 400 ký tự và CRLF của dự án.

## Kiểm chứng

Các kết quả máy đọc được và ảnh nằm ở [thư mục kiểm](../scratch/pack-selection-20261024/), gồm `inventory-audit.json`, `verification.json`, log hồi quy và [bảng ảnh 8 khung](../scratch/pack-selection-20261024/acceptance.jpg).

Ca chính: **Nam đứng cạnh giường, bà nằm, bát cháo trên bàn**. Bộ dựng phải tìm được đúng tổ hợp trong cùng gói, giữ bà nằm khi nói, giữ vị trí khi đổi góc; ca hai bát dùng hai vị trí độc lập. Các ảnh đầu đã lộ cảnh người đứng che người nằm; sau bổ sung kiểm che khuất, cảnh đó bị loại và bộ ghép dùng mảnh giường/bàn có vị trí phù hợp.

Các kiểm bao gồm mã ngoài danh sách, chèn tọa độ, trùng chỉ số, retry, dự phòng có log, hủy, thay nội dung/ID/vị trí sau khi chốt, giữ điểm đặt hai bát khi đổi vật làm trung tâm, snapshot và công tắc ảnh. Hồi quy pipeline kiểm hai gói, chạy tiếp không gọi lại AI khi không đổi đầu vào, trạng thái cửa, sửa blocking trước voice, thiếu vật chứng trước âm thanh và ca đồng thời đứng–nằm–bát trên bàn. Kho nguồn không bị thay đổi bởi các lượt kiểm này.

Lệnh:

```text
npx tsc --noEmit
npm run test:motion-pack-selection
npm run test:motion-closed-pipeline
npm run test:motion-illustration
npm run test:motion-closed-pack
npm run test:motion-visual-contract
```

Ảnh là ảnh engine thật; phản hồi AI trong kiểm thử được giả lập. Chưa coi đây là nghiệm thu AI thật hoặc đã duyệt hết kho/22 video. Kiểm hình học không tự chứng minh mô tả, trang phục hay tình tiết đều đúng: công tắc QA ảnh và kiểm nguồn vẫn cần thiết. Kho thật sự thiếu vật chứng không được thay bằng vật khác để báo thành công; phải phát hiện trước voice/render.

Kết quả kiểm cuối ngày 24/10/2026: cả sáu lệnh trên đều đạt; kiểm lựa chọn dựng 8 ảnh thật cho hai gói, mỗi gói có 911 tài nguyên đủ điều kiện theo chính sách hiện hành và không có lỗi cấu trúc trong đợt rà. Kiểm kho đóng đạt 854 kiểm với 82 ảnh; kiểm pipeline đạt cả hai gói, bao gồm chạy tiếp cảnh ghép không gọi lại AI và không đổi khung hình. Prettier và `git diff --check` đạt; Git có cảnh báo chuyển LF/CRLF ở các file Python đã thay đổi trước đó.

Backend đã khởi động lại từ đúng thư mục dự án để nạp bản sửa; tiến trình PID 79144 nghe cổng 3002, GET `/api/motion-video/kit` trả HTTP 200 và JSON hợp lệ. Không khởi động lại dự án video cũ hoặc tạo lượt AI thật trong bước kiểm này.
