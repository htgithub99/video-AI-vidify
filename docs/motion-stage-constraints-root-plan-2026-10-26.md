# Plan sửa chọn và ghép bối cảnh theo ràng buộc chung

## Phạm vi

Áp dụng mọi truyện, mọi địa điểm và cả hai gói cố định. Giữ hình minh họa tĩnh, snapshot kho, nhân vật/đạo cụ và tiến độ đã đạt; không thêm tài nguyên bằng AI hoặc chạy video để kiểm. Không gắn logic theo tên truyện, ID job hoặc tên Sân trước. Plan này mở rộng mục 11 trong plan sản xuất chung; các hạng mục giọng, nội dung, provider và xuất bản vẫn theo plan đó.

## Gốc lỗi đã tái hiện

Job `c56d8b4c-8e4b-422d-ac9c-b82f9475fb99` đã đọc 31/31 cảnh. Khâu chọn bối cảnh kiểm tư thế/mặt đỡ nhưng bỏ sót vị trí tương đối; khâu ghép không nhận đủ nhu cầu điểm neo; `floor + support:table + placement:table` trộn mặt đỡ với vật làm mốc. Catch chung gửi READ lại để chữa geometry, dẫn tới prompt thừa và ràng buộc mới mâu thuẫn.

## Các đầu việc và điều kiện đạt

| Mã  | Thay đổi chung                                                                                   | Điều kiện đạt                                                                                                                                                                    | Trạng thái               |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| S01 | Chuẩn hóa mount, support và placement tại đầu vào, checkpoint và preflight                       | Vật trên sàn cạnh bàn không bị hiểu là nằm trên bàn; giữ vật trên bàn và vật trên vật; không xóa chứng cứ hoặc đổi mặt đỡ thiết yếu                                              | Đã làm, kiểm offline đạt |
| S02 | Dùng cùng bộ kiểm điểm neo và phân phối vị trí trong chọn set, preflight, assembly và dựng frame | Kiểm được at/beside/behind/between, đủ chỗ riêng cho người, đúng tư thế và mặt đỡ; không chọn set rồi mới phát hiện thiếu cổng                                                   | Đã làm, kiểm offline đạt |
| S03 | Phân biệt vùng không gian với chi tiết vật lý                                                    | Sân/phòng là vùng từ metadata nền đã biết; cổng/cửa/bàn cần mảnh hoặc điểm thật. Không gắn nhãn cổng vào điểm đứng chung                                                         | Đã làm, kiểm offline đạt |
| S04 | Tổng hợp nhu cầu mọi cảnh cùng địa điểm vào tìm kho và ghép                                      | Truyền anchor/support/kind/count, đủ mảnh trong cùng gói, chọn cục bộ và kiểm geometry/render trước khi chấp nhận; giữ continuity ánh sáng và fixture                            | Đã làm, kiểm offline đạt |
| S05 | Phục hồi theo lỗi, chẩn đoán cụ thể, loại catch cũ                                               | Thiếu mảnh/neo/bố cục phải ghép hoặc chọn lại; không READ lại cảnh đúng. Chỉ sửa READ khi chứng minh diễn giải blocking mâu thuẫn với tư thế độc lập và có cảnh thay thế khả thi | Đã làm, kiểm offline đạt |
| S06 | Kiểm bằng fixture thật và tình huống đối chứng, hai gói                                          | Sân+cổng+cửa+bàn; phòng+giường+người cạnh giường; bến sông+bàn; nhiều người cùng anchor; đối chứng neo không tồn tại, vật sai mặt đỡ, sprite thiếu; không AI/TTS/video mới       | Đã làm, kiểm offline đạt |
| S07 | Nạp backend và bảo toàn dữ liệu                                                                  | Kiểm type/diff, không ngắt lượt đang chạy, checksum tiến độ không đổi, API sẵn sàng, không resume                                                                                | Chờ                      |

## Thứ tự thực hiện

1. S01 và S03: chuẩn hóa nghĩa trước khi tra kho, hỗ trợ checkpoint cũ qua cùng adapter.
2. S02 và S04: kiểm toàn bộ ràng buộc trên ứng viên thật, ghép lại khi checkpoint cũ không phù hợp.
3. S05: giữ phần đã đạt, chỉ phục hồi đúng miền; bỏ vòng READ chữa lỗi kho.
4. S06 và S07: kiểm offline, xem ảnh minh họa đại diện, nạp bản sửa không tự chạy video.

## Giữ nguyên và giới hạn

- Giữ các sửa trước về object identity, sửa từng field, cảnh thuộc storyboard, giới hạn retry, phục hồi provider chung, log chia mục, xoay đạo cụ tĩnh, tư thế minh họa đơn giản và snapshot kho.
- Không giảm QA người/vật/địa điểm thiết yếu để ép xuất. Nếu mảnh cốt lõi thực sự không có, báo đúng tài nguyên/ràng buộc thiếu và giữ tiến độ.
- Đợt này sửa tầng chọn/ghép/đặt cảnh; không đánh dấu toàn bộ plan sản xuất hoặc chất lượng giọng/video cuối là hoàn tất.

## Kết quả triển khai và bằng chứng

- **S01:** dùng `normalizePuppetObjectSupport` tại READ, chuẩn hóa checkpoint và illustrationNeeds. Chỉ bỏ support bị lặp với mốc gần vật khi mount=floor; giữ mount, placement và chứng cứ. Không tự sửa xung đột khác hoặc support của vật nằm trên vật.
- **S02:** chọn tài nguyên và dựng cảnh dùng cùng bộ phân phối chỗ cho nhân vật. Nhận cả beside/behind với nhân vật và với fixture; dữ liệu thiếu targets bị loại hợp lệ, không làm crash. Chấm điểm ưu tiên neo được lời kể chỉ rõ trước tính gọn và continuity, tránh kéo người từ cổng về nhà. Tăng phiên bản lựa chọn cảnh để kiểm lại frame cũ trước khi dùng.
- **S03:** chỉ tạo alias vùng sân/phòng từ locationFamily thực. Cổng/cửa/bàn vẫn cần điểm thật của mảnh; không dùng mô tả địa điểm để gán khả năng không tồn tại.
- **S04:** tổng hợp anchor/support/kind/count của mọi cảnh cùng địa điểm. Kiểm cả khả năng tạo frame khi đã có cast/props. Cho mảnh building ngoại cảnh tương thích dùng các ô far_left/far_center/far_right đã định nghĩa; vẫn kiểm kích thước, chồng hình, ngữ cảnh và cùng gói. Cho nền trống khi không cần mảnh. Điểm đạo cụ cạnh bàn lấy cao độ sàn; không lấy cao độ mặt bàn.
- **S05:** loại vòng catch đọc lại rộng trước đây. Lỗi tài nguyên trả chẩn đoán có cấu trúc và giữ tiến độ; chỉ sửa blocking khi có ứng viên chứng minh các tư thế/đạo cụ/neo độc lập đáp ứng được. Ghi lại lý do ứng viên ghép bị loại.
- **Khung máy quay:** tính cả giới hạn trên/dưới của đạo cụ chính và phụ trong các khung toàn thân. Trước đây chỉ nới ngang nên đồ dưới sàn có thể bị cắt dù vị trí đúng. Không thêm chuyển động.

### Kiểm tra đã đạt

| Kiểm tra                                                                                         | Bằng chứng                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixture thật 5 cảnh của lượt lỗi, cả hai gói                                                     | `scripts/verify-motion-stage-constraints.ts`; ghép được cổng + bàn + nhà; mọi cảnh tạo được lựa chọn hợp lệ; kho không đổi; không gọi AI                                         |
| Minh họa đại diện từ renderer thật                                                               | `scratch/motion-stage-constraints-20261026.png`; đã xem ảnh cả hai gói, người ở cổng/cửa và mâm dưới sàn                                                                         |
| at/beside/behind/between, nhiều người cùng neo, dữ liệu thiếu targets, ưu tiên neo hơn gom người | `scripts/verify-motion-spatial-placement.ts`                                                                                                                                     |
| Nhà + bàn cúng + đồ trên bàn, vật ở cửa, phòng, sân                                              | `scripts/verify-motion-house-readiness.ts`; cả hai gói                                                                                                                           |
| Giường + ghế + bàn + cửa đồng thời                                                               | `scripts/verify-motion-assembly-capacity.ts`; cả hai gói                                                                                                                         |
| Bến sông và minh họa đơn giản                                                                    | `scripts/verify-motion-river-illustrations.ts`; 6 ví dụ, kho không đổi                                                                                                           |
| Luồng chọn/ghép/dựng với AI giả lập                                                              | `scripts/verify-motion-closed-pipeline.ts`; cả hai gói; tiếp tục không gọi AI lại, blocking sai sửa trước voice; thiếu prop hoặc neo chỉ READ một lần, không compose/sound/voice |
| Đạo cụ, chứng cứ cảnh và góc xoay tĩnh đã sửa trước                                              | `scripts/verify-motion-read-objects.ts`, `scripts/verify-motion-read-scene.ts`, `scripts/verify-motion-prop-rest.ts`                                                             |
| Khung máy quay và lớp trước/sau                                                                  | `scripts/verify-motion-depth-order.ts`; gồm đạo cụ chính/phụ thấp hơn chân người                                                                                                 |

Chạy nhóm kiểm tra trọng tâm bằng `npm run test:motion-stage-constraints`. Đây là kiểm tra offline có AI giả lập và ảnh tĩnh, không phải một lượt tạo video.

### Phạm vi đảm bảo

Bản sửa áp dụng theo ràng buộc, metadata kho và geometry cho mọi dự án dùng hai gói, không theo tên truyện hoặc ID cụ thể. Bộ kiểm bao phủ các trường hợp trên; không chứng minh mọi truyện bất kỳ đều có đủ tài nguyên. Nếu kho thật sự thiếu vật/neo thiết yếu, hệ thống vẫn phải chỉ rõ thiếu gì và giữ tiến độ. Không khẳng định đã loại mọi lỗi mạng, CAPTCHA, AI, giọng hoặc render cuối. Không tạo hoặc tiếp tục video trong đợt này.

## Nạp bản sửa

- `tsc --noEmit`: đạt, exit 0. `git diff --check`: đạt.
- Backend mới PID `61340`, cổng `3002`, đã nạp code. API status của job gần nhất trả thành công, vẫn giữ trạng thái lỗi cũ và đúng stage đã lưu; không tự tiếp tục công việc.
- Đã đối chiếu SHA-256 **129 file** job/production/render/checkpoint/draft trước và sau khởi động lại: **0 file thay đổi**. Manifest: `scratch/stage-constraints-restart-preserved.json`.
- Log backend: `scratch/motion-stage-constraints-backend.stdout.log` và `.stderr.log`.
- S01–S07 hoàn tất trong phạm vi bản sửa chọn/ghép/đặt cảnh và kiểm offline ở trên. Nghiệm thu một video sản xuất mới vẫn do người dùng chủ động chạy; không đánh dấu toàn bộ plan sản xuất là hoàn tất.
