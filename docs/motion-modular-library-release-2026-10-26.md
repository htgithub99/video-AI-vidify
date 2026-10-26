# Kho hoạt động mô-đun — 26/10/2026

## Kết quả đợt này

Theo yêu cầu bỏ dữ liệu kho cũ khỏi cách làm mới, hai gói `minimal_mask` và `chibi_folk` đã chuyển sang bản `modular-v3-20261026`. Không tạo hoặc tiếp tục video; không gọi AI/TTS thật; không khởi động lại backend.

| Loại | Tổng hai gói |
|---|---:|
| Gói kiểu vẽ | 2 |
| Nhân vật | 124 |
| Đạo cụ | 300 |
| Nền sạch | 52 |
| Mảnh độc lập | 190 |
| Mẫu ghép ngày/đêm | 348 |
| Series người dùng được bảo toàn | 11 |

Mỗi gói có mẫu cho 30 gia đình bối cảnh trong catalog. Đây là phạm vi danh mục và kiểm cục bộ, không phải cam kết đáp ứng mọi sự kiện hoặc mọi tổ hợp nhân vật/đạo cụ của mọi truyện.

**Không còn cảnh cũ trong lựa chọn của kho hoạt động.** Có 4.510 hồ sơ nguồn không đưa sang bản mới, gồm toàn bộ cảnh cũ của hai gói và các nền/mảnh chưa tách an toàn, món gộp nhiều đồ, tài nguyên AI chưa được duyệt hoặc hồ sơ không đạt hợp đồng. Nhân vật và đạo cụ seed hợp lệ được giữ ID rồi chuẩn hóa phiên bản; không bỏ mẫu đã đạt chỉ vì được tạo trước đây. Ba nhân vật Chibi cao tuổi còn thiếu phiên bản thiết kế được dựng lại bằng bộ vẽ Chibi v3 chân khép, giữ ID.

## Nơi lưu và cách chuyển

- Con trỏ: `storage/output/motion-video/kit-library/active-release.json`.
- Bản hoạt động: `storage/output/motion-video/kit-library/releases/modular-v3-20261026`.
- Bản lưu nguồn: `storage/output/motion-video/kit-library-archive/modular-v3-20261026`.
- Báo cáo nguồn/hash: `release-report.json` trong bản hoạt động; `retirement-manifest.json` trong bản lưu nguồn.

Thư mục cũ theo từng loại ở gốc được chuyển vào archive, rồi thay bằng junction trỏ tới dữ liệu mới. Junction là đường tương thích cho những nơi còn dùng đường dẫn gốc; không chứa bản kho cũ thứ hai. Snapshot, MP4, âm thanh và hồ sơ production không bị chuyển/xóa.

Trước chuyển: dựng bản riêng, kiểm SVG/geometry/tham chiếu, kiểm hash nguồn chưa đổi. Khi chuyển: ghi con trỏ nguyên tử, lưu manifest, chuyển thư mục nguồn và nối đường tương thích. Chạy lại công cụ không dựng kho trùng; phần chuyển thư mục có thể hoàn tất tiếp nếu bị ngắt. Con trỏ không hợp lệ gây lỗi rõ, không tự quay lại kho cũ.

5.296 tệp nguồn trong archive đã được so hash. 78 tệp production/story-job/render-job được so hash trước và sau, không thay đổi. Một hồ sơ lịch sử còn nhãn `rendering` từ lượt cũ không được chạy tiếp hoặc sửa trạng thái trong đợt này.

## Sửa code từ hợp đồng dữ liệu

1. `setComposition.ts` giữ phép ghép thuần dùng chung. `setComposer.ts` tiếp tục giữ đường tìm/ghép hiện có, không tạo pipeline khác.
2. Plan mới lưu phiên bản, `baseId`, ID mảnh, slot và mirror. Runtime đọc đúng các nguồn này rồi dựng lại SVG, điểm đặt, composition, fixture và ánh sáng. Không chỉ gắn nhãn mô-đun lên ảnh cảnh cũ.
3. Chặn ID/slot/thành phần sai gói, tham chiếu thiếu, lặp slot và môi trường không phù hợp. Snapshot và chặn xóa nền/mảnh được mở rộng để theo đủ nguồn của plan.
4. Phép ghép xét cả hình và điểm tiếp xúc khi giới hạn tỉ lệ; tránh điểm đứng cạnh giường vượt khỏi khung. Các điểm được biến đổi cùng hình.
5. Khi một người nằm và người còn lại đứng tự do, bố cục của kho mới ưu tiên điểm đứng cạnh giường đã khai trong mảnh. Không kéo chân người đứng lên mặt giường theo đội hình chung. Mảnh giường có mẫu bedside liên kết các điểm địa phương.
6. Nền sông/ao có vùng mặt nước; mảnh thuyền có hợp đồng mặt nước và slot riêng. Không dùng slot trên đất hoặc nền không có mặt nước cho thuyền.
7. Mảnh cửa độc lập có trạng thái đóng/mở ngày/đêm. Trạng thái được truyền qua composer và resolver; đọc lại plan không làm cửa mở trở thành cửa đóng. READ đưa nhu cầu trạng thái fixture vào tìm thành phần.
8. Sửa phân loại các nền phòng bị mô tả phụ kéo sang gia đình núi/trường học. Nền đất có danh sách thích nghi rõ; kiểm địa điểm vẫn đòi bằng chứng từ mảnh tạo nên nơi đó.
9. Chặn asset chưa chuyển phiên bản và cảnh/recipe cũ quay lại kho đóng qua `writePuppet`; đọc file chép tay sai hợp đồng cũng không đưa vào lựa chọn. Không áp chặn phiên bản lên snapshot lịch sử.
10. Chặn AI prefill của hai gói đóng. Các công cụ Python seed/migration cũ bị chặn ghi vào cây thư mục đã có con trỏ phát hành, kể cả đi qua junction. Chúng vẫn dùng được tại thư mục thử riêng cho fixture/lịch sử.
11. UI đổi tên nhóm cảnh thành “Mẫu cảnh minh họa”. Bộ kiểm pipeline mặc định kiểm kho hiện hành, không tự thêm fixture cảnh cũ vào kho mới.

Giữ adapter đọc recipe/plan cũ để mở snapshot lịch sử. Đây là đường tương thích còn có caller và bài kiểm, không phải dữ liệu để chọn cho dự án mới.

## Bằng chứng kiểm

- TypeScript: `npx tsc --noEmit`.
- Python: `python -m compileall -q python_scripts/kit_seed`.
- `verify-motion-library-release.ts`: 1.016 tài nguyên thuộc sáu loại, 30 gia đình/gói, đủ nguồn và variant, không trùng plan, plan sai bị chặn, không ghi lại cảnh cũ, không đặt thuyền lên đất, snapshot mới giữ nguồn.
- Đọc thêm 6 snapshot từ production đang lưu; giữ đọc snapshot cảnh cũ ngoài kho hoạt động.
- `verify-motion-river-illustrations.ts`: 6 ảnh thật qua renderer cho hai gói: bến sông có bàn/mâm/bát, bát trên khay trên bàn, người nằm và người đứng cạnh giường. Kiểm chân người đứng thấp hơn mặt giường và dùng điểm `beside`; kho không đổi.
- `verify-motion-closed-pipeline.ts`: hai gói chỉ dùng kho mới, AI giả, kiểm dựng khung/đóng mở cửa/giữ snapshot/tiếp tục/repair riêng và đạo cụ thiếu. Không xuất MP4 hoặc gọi dịch vụ AI/TTS thật.
- `verify-motion-root-contracts.ts`: coverage, stable IDs, voice dependency, chuyển chủ vật và bounded repair giữ đạt.
- `verify-motion-resource-writes.ts`: 12 ca normalizer Python/TS tương đương, giữ file khi ghi sai, đổi tên và bảo vệ kho đóng.
- Hai bảng ảnh nén, tổng 60 ô đại diện: `scratch/modular-library-release-20261026/boards/minimal_mask.jpg`, `chibi_folk.jpg`.
- `scratch/modular-library-release-20261026/activation-verification.json`: 5.296 tệp archive đúng hash, 78 tệp lượt chạy không đổi, không có cảnh cũ hoạt động.

Một lượt ảnh đầu bị hỏng phép so “kho không đổi” vì thư mục fixture dùng lại bị bài kiểm khác ghi đè. Đã chuyển mỗi lần kiểm sang thư mục riêng và chạy lại đạt. Trong quá trình chuyển, kiểm pipeline mới đã phát hiện thiếu composition bedside và trạng thái cửa; chỉ chuyển kho sau khi sửa hợp đồng và chạy lại đạt.

## Vận hành và giới hạn

Khi chuyển kho ban đầu, backend chưa được khởi động lại. Sau phản ánh ảnh xem trước ngày 26/10, đã xác nhận tiến trình cũ ở cổng 3002 trả 404 cho ảnh Nền/Mảnh cảnh, trả tên nền bằng ID, trong khi ảnh đạo cụ trả 200. Code mới trên đĩa đã hỗ trợ hai loại ảnh này nhưng tiến trình Node chạy trực tiếp không tự nạp lại module.

Đã kiểm không có production đang chạy, khởi động lại đúng backend, và dùng hàm tên tài nguyên dùng chung để tên nền đọc được từ `key`. Kiểm qua HTTP thật và giải mã ảnh bằng Chromium: 52 nền + 190 mảnh cảnh của hai gói đều trả đúng MIME SVG và giải mã được, không có tên bằng ID. TypeScript đạt. Không tạo hoặc tiếp tục video trong lượt kiểm này. Tải lại trang hoặc bấm “Tải lại” trong kho để lấy kết quả mới.

Dự án cũ có snapshot vẫn giữ tài nguyên đã khóa. Tham chiếu cũ không có snapshot không được âm thầm đổi sang món khác; cần chọn/dựng lại phần hình từ kho mới. Series chỉ giữ các tham chiếu còn hợp lệ, bản nguyên trạng có trong archive.

Không dùng kết quả kiểm giả lập thay cho nghiệm thu giọng, mỹ thuật với lời kể hoặc dịch vụ thật. Đợt này hoàn tất việc rời kho cũ khỏi kho hoạt động và sửa các hợp đồng liên quan; không tuyên bố toàn bộ plan R01–R22/82 mã đã đóng.
