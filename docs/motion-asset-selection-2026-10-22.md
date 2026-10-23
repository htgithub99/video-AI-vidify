# Sửa luồng chọn tài nguyên Video Motion — 22/10/2026

Đã bỏ bước AI xem lại ảnh đạo cụ sau khi vẽ (`motion-puppet-props-check`). Việc phân loại, chuẩn hóa hồ sơ và kiểm tra liên kết được đưa về trước bước sử dụng tài nguyên. Kiểm tra SVG bằng code, review nhân vật/bối cảnh và review khung tổng vẫn hoạt động theo luồng riêng.

## Luồng mới

1. Chuẩn hóa tên, vai trò, ngoại hình nhân vật và mô tả bối cảnh thành tiếng Anh bằng AI chính. Kết quả được cache theo nội dung đầu vào và phiên bản. Hồ sơ thiếu nhân vật, đổi key hoặc còn văn bản có dấu ở các trường cần dịch sẽ bị từ chối. Code giữ giới tính, tuổi, interior/time theo dữ liệu gốc, kể cả khi AI tự đổi các trường đó.
2. READ vẫn nhận câu kể/thoại tiếng Việt nguyên văn. `word` phải trích đúng câu nguồn. Thông tin vật thể gồm mô tả tiếng Anh, phân loại, đặc điểm bắt buộc, chủ sở hữu và key tiếng Anh có phân biệt trạng thái.
3. Chặn các nhóm âm thanh, giờ giấc, đám đông, bộ phận cơ thể khỏi đạo cụ rời. Địa hình/cây cối đi vào yêu cầu bối cảnh; đồ đạc hỗ trợ tư thế vẫn dùng cơ chế spot. Đám đông tiếp tục dùng actor phụ theo prompt READ.
4. Chọn đạo cụ bằng key chuẩn và danh sách từ đồng nghĩa được khai báo rõ, kiểm tra loại và đặc điểm vật lý. Bỏ cách AI tự chọn tùy ý theo tag gần giống. Không ghép được thì vẽ mới. Không xem mount làm danh tính vật thể: cùng một đồ vật có thể được cầm hoặc đặt xuống.
5. Áp dụng kiểm tra ở cả tài nguyên trong dự án, series và kho. Bản seed được ưu tiên khi trùng key; thứ tự chọn ổn định. Không dùng dao thay đục, quạ thường thay quạ mỏ đỏ, chỉ đứt thay chỉ nguyên hoặc đồng xu thường thay đồng xu gỉ.
6. Khi cần vẽ mới, gửi tên, mô tả và yêu cầu hình dáng bằng tiếng Anh. Kiểm tra SVG bằng code và thử lại khi lỗi; không gửi ảnh đạo cụ đi review. SVG trống hoặc hết lượt vẫn thiếu kết quả sẽ báo lỗi thay vì tiếp tục với đạo cụ vô hình.
7. Phiên bản puppet được nâng lên 2 để lần dựng tiếp theo không dùng lại READ/khung từ cơ chế cũ. Giữ nguyên ID tài nguyên và key nhân vật/bối cảnh của dự án. Nhận diện người kể được lấy trước khi dịch hồ sơ.

Ghép bối cảnh cũng kiểm tra yêu cầu cảnh vật khi chọn lại tài nguyên. Nếu bản ghép không có thành phần đáp ứng yêu cầu đó thì chuyển sang cách vẽ bối cảnh đầy đủ. Khi review khung yêu cầu thay đổi cảnh vật, cache trong cùng lượt chạy được xét lại theo yêu cầu mới.

## Dữ liệu đã cập nhật trên máy

Đã chuẩn hóa metadata cho **1.131 tài nguyên**: 86 nhân vật, 629 bối cảnh, 215 đạo cụ, 40 khuôn và 161 món cảnh. Tên và mô tả tài nguyên được kiểm tra không còn ký tự tiếng Việt có dấu; các mô tả truyện riêng được dịch thủ công theo dữ liệu gốc. Tên/mô tả gốc được lưu ở `originalName`/`originalDesc` khi thay đổi. Narration, thoại, tiêu đề series và tag tìm kiếm tiếng Việt được giữ lại.

- Cách ly 17 mục khỏi lựa chọn/danh sách đạo cụ, gồm vật vốn là thành phần cảnh, âm thanh, thời gian, đám đông, bộ phận người và hình chỉ đứt suy ra từ tiếng “Phựt”. File hình vẫn còn để dự án cũ đọc được.
- Gỡ 21 liên kết sai trong 2 series; không thay bằng một vật gần giống khác.
- Sửa metadata giới tính của các bản nhân vật bé Khôi theo mô tả gốc là cháu trai. Không sửa thiết lập giọng đã lưu.
- Cập nhật tên trong catalog seed và mã tạo nhân vật để tạo lại kho không đưa tên tiếng Việt cũ trở lại.

Sao lưu trước khi ghi:

`D:\video-AI-vidify\scratch\asset-catalog-migration\2026-10-22T07-40-18-507Z`

Manifest: `installed.json` trong thư mục trên. Tổng cộng 1.133 JSON thay đổi, gồm 1.131 tài nguyên và 2 series. Đối chiếu bản sao lưu xác nhận ID, SVG, head/body/sprites, geometry, spot, variant, plan và key ổn định không bị sửa. Chạy lại migration báo `changed: 0`.

Lệnh migration mặc định chỉ xem trước:

```text
npm run motion:migrate-asset-catalog
npm run motion:migrate-asset-catalog -- --apply
```

Đây là migration cho dữ liệu cũ đã kiểm tra trên máy này. Hồ sơ truyện mới đi qua bộ chuẩn hóa tiếng Anh trong pipeline.

## Kiểm thử

- `npm run test:motion-asset-catalog`: đạt. Có mock AI cho READ, dịch hồ sơ và vẽ SVG; xác nhận định tuyến AI chính, cache hồ sơ, giữ key/giới tính/tuổi/vị trí nội-ngoại/thời gian, chặn thiếu hồ sơ, phân loại sai, liên kết sai, ưu tiên seed, không có lời gọi review đạo cụ, SVG lỗi thử lại và SVG trống bị từ chối. Có kiểm tra không ghép stock sai giới tính hoặc sai nhóm tuổi.
- `npx tsc --noEmit`: đạt.
- `npx tsx scripts/verify-motion-blocking.ts`: đạt 40 ảnh tĩnh — 10 tình huống × 2 phong cách × bật/tắt chuyển động. Đã xem ảnh đại diện người đứng cạnh người nằm và em bé trong nôi.
- Kiểm tra speech, voice continuity và voice pacing: đạt.
- Parser seed vẫn khớp 38 bối cảnh, 90 đạo cụ và 35 archetype; tên nhân vật seed là ASCII tiếng Anh.
- `git diff --check`: đạt.

Hai bài kiểm tra cũ `verify-motion-library-identity.ts` và `verify-motion-draw-economy.ts` không chạy được vì còn import các module đã không tồn tại (`motionSceneLibraryService.ts`, `motionGenService.ts`). Bộ kiểm tra mới gọi trực tiếp các service puppet hiện hành.

Chưa chạy một lượt dựng toàn bộ truyện bằng AI thật và không render video thử. Các kiểm tra trên xác nhận hợp đồng dữ liệu, luồng gọi và các khung kiểm thử; không phải bảo đảm AI luôn vẽ đúng từng chi tiết. Bản video đã xuất giữ nguyên; cần dựng lại phân cảnh để nhận cơ chế mới.

## Bổ sung sau lỗi hồ sơ tiếng Anh lúc 15:03 ngày 22/10

Log xác nhận request `motion-puppet-asset-profiles-f9cd3c7d` của DeepSeek đã hoàn tất lúc 14:57:56 (giờ Việt Nam), phản hồi 3.002 ký tự. Sau đó bộ kiểm tra hồ sơ chặn pipeline. Thông báo hiển thị muộn hơn vì bước giọng chạy song song. Phản hồi thành công của lượt này không được lưu; chưa có bằng chứng để chỉ chính xác trường nào bị từ chối.

Cơ chế cũ dùng ASCII làm điều kiện kiểm tra, kiểm đúng một lần rồi báo lỗi chung. Vì vậy dấu nháy cong/gạch dài trong tiếng Anh cũng bị loại; tên riêng còn dấu, trường bị bỏ sót hoặc key không khớp đều dẫn tới cùng một thông báo. Đây là các nhược điểm đã xác nhận trong code, chưa phải kết luận về ký tự cụ thể trong phản hồi đã mất.

Cơ chế mới chuẩn hóa dấu câu, giữ lại các trường hợp lệ và dùng dữ liệu gốc khi trường đó đã đạt điều kiện. Chỉ yêu cầu AI bổ sung các trường chưa đạt, tối đa hai lần sau yêu cầu đầu tiên. Bản sửa không tự bỏ dấu trong mô tả tiếng Việt để giả thành tiếng Anh. Ghép theo đúng key gốc, không nhận hàng trùng key hay ghép theo thứ tự mảng; không dùng người/bối cảnh phát sinh ngoài nguồn. Giới tính, tuổi, nội/ngoại và thời gian luôn lấy từ nguồn. Các trường hợp lệ không bị thay lại trong lượt bổ sung.

Nếu vẫn không đạt, lỗi nêu đường dẫn trường cụ thể. Phản hồi và danh sách trường lỗi của từng lượt được lưu trong `kit-library/asset_profiles/diagnostics/`; hồ sơ lỗi không được ghi vào cache sử dụng. Cache có phiên bản riêng cho hợp đồng hồ sơ.

Đã mở rộng kiểm tra hồi quy cho dấu câu, tên chưa dịch được sửa bằng phản hồi từng phần, giữ chi tiết vật lý/định danh, trùng key, key sai, giới hạn bổ sung, cache sau sửa, lưu chẩn đoán và hủy tác vụ. Bộ kiểm tra dùng mock AI, không gửi thêm yêu cầu AI thật và không render video.
