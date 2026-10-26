# Kho đóng và vị trí cố định — triển khai 24/10/2026

Video mới chọn Tối giản mặt nạ (`minimal_mask`) hoặc Chibi màu dân gian (`chibi_folk`) chỉ dùng tài nguyên seed trong đúng gói. Đã cài phần tài nguyên bổ sung vào kho thật và kiểm bằng engine. Đây là đợt triển khai kho lõi và cơ chế vị trí, chưa phải nghiệm thu mọi truyện hoặc mọi mục trong kế hoạch.

Backend dự án trên cổng 3002 đã được khởi động lại để nạp bản sửa. API kho trả thành công và trang bảng ảnh trả HTTP 200 sau khi nạp lại.

## Thay đổi ở nguyên nhân gốc

- `packPolicy.ts` giới hạn đọc theo gói, loại tài nguyên cách ly; chặn vẽ, tạo/sửa/xóa tài nguyên trong phạm vi dựng video. Cập nhật số lần dùng không ghi lại nội dung tài nguyên đã khóa.
- `pipelinePuppet.ts` buộc hai preset dùng kho kể cả khi có yêu cầu vẽ mới/ảnh tham chiếu. Kiểm toàn bộ nhu cầu cảnh, tư thế, chỗ tựa và đạo cụ trước COMPOSE/âm thanh. Bộ chọn xác định hỗ trợ khi AI không trả kết quả chọn phù hợp; không tạo tài nguyên thay thế.
- `packCatalog.ts` truyền khả năng thực tế của gói cho bước viết truyện. READ nhận danh mục đạo cụ và quy tắc giữ vật chứng, chủ sở hữu, chỗ đặt.
- `setComposer.ts` chỉ ghép nền/mảnh có sẵn; kiểm phần đồ đạc chồng vùng bố trí. Cảnh ghép là dữ liệu dự án, không ghi thành mẫu mới vào kho.
- `gen.puppet.pack` lưu tài nguyên được dùng, nguồn mảnh ghép, biến thể và SHA256 nội dung. Compile/layout đọc bản chụp và kiểm ID, gói, nguồn, chu trình. Bản dựng có snapshot không tự đổi sang tài nguyên thay thế mới khi thư viện được cập nhật.
- Cảnh gốc được chọn trước cảnh thay trạng thái. Các trạng thái cùng địa điểm phải giữ nhóm, thời điểm và hình học vị trí; không tự đổi sang bản lật hoặc phòng khác. `packFixtures.ts` thay đúng lớp cửa/đèn bằng trạng thái đã lưu trong kho, giữ nguyên đồ đạc/điểm đặt.
- `layout.ts` không dùng điểm đứng thay chỗ ngồi/nằm. Đạo cụ có mặt đỡ cụ thể, giữ điểm đặt được yêu cầu khi hợp lệ; hai bát không cùng chiếm một slot. `packLocation.ts` phân biệt mương/giếng/ao và một số nhóm địa điểm, tránh ghép theo từ gần nghĩa đơn thuần.
- `readContinuity.ts` cho hành động đứng/đi/chạy ghi đè tư thế nằm cũ; lời nói không tự đổi tư thế. `visualContract.ts` cập nhật vật cầm/đặt/đeo theo chuyển trạng thái, tránh giữ khăn cũ khi đã chuyển sang cầm bát.
- Engine dùng điểm cầm và điểm đeo cổ; biến đổi cùng tư thế nằm. Mẫu tiếp xúc dùng điểm tay/vai/miệng/thân/tai/lưng và chiều vẽ phù hợp cho bế/cõng. Chế độ tĩnh không tự sinh vệt chạy.
- UI giải thích đúng chế độ kho đóng; thao tác bối cảnh đổi thành “Dựng lại”.

## Tài nguyên đã cài

Nguồn tái tạo: `python_scripts/kit_seed/closed_pack_catalog.json` và `build_closed_pack.py`. Mỗi gói có hình riêng theo bảng màu/nét/tỉ lệ hiện tại; dùng lại nhân vật seed, không sao chép hình từ nguồn tham khảo.

| Hạng mục thiết kế bổ sung | Thiết kế | Bản ghi đã cài cho cả hai gói |
|---|---:|---:|
| Cảnh có bố cục cố định | 12 | 96, gồm hai gói × ngày/đêm × lật |
| Đạo cụ và trạng thái | 18 | 36 |
| Mảnh giường/ghế/bàn/bếp/cửa/cửa sổ | 6 | 12 |
| Tổng | 36 | 144 |

12 cảnh gồm trò chuyện gia đình, giường và người chăm, người lớn–trẻ, bế/cõng, đỡ người yếu, hai phía cửa sổ, bàn ăn, sân làm việc, đường đuổi/tìm, tiếp xúc gần, bờ mương và bếp có mặt đặt đồ.

Đạo cụ gồm chổi, bát cháo, khăn tang trắng/ướt, cơm nổi trên nước, đũa, then cửa, chăn gấp, bao gạo, lược tre, khay gỗ, bát nước, mái chèo, gói thuốc, vải liệm, vũng nước, dấu chân bùn và giỏ thức ăn.

Sau khi gộp phần này với kho seed hiện có và loại bản ghi bị cách ly, mỗi gói có 59 nhân vật, 151 đạo cụ, 584 bản cảnh, 20 nền và 97 mảnh. 584 bản cảnh không có nghĩa là 584 thiết kế độc lập; thống kê theo tag đầu có 96 nhóm cảnh. Danh mục có composition cho 26 họ tương tác; mỗi họ vẫn có giới hạn biến thể.

## Bằng chứng kiểm thử

- `npm run test:motion-closed-pack`: 854 phép kiểm và 82 ảnh engine. Kiểm hash tài nguyên đã cài, cách ly gói, chặn vẽ/ghi, hình học, vai, biến thể cửa/đèn, bản chụp bị sửa, ID thiếu, bố trí hai bát, khăn đeo, cơm trên mương và chuyển tư thế. Không có lời gọi AI vẽ.
- `npm run test:motion-closed-pipeline`: hai gói chạy luồng thực `buildScenesPuppet` với phản hồi AI giả lập có kiểm soát. Ba hình người bệnh/người chăm/cửa đóng–mở, compile thật; resume từ JSON giữ fingerprint và không gọi AI lại. Hash nội dung kho không đổi. Vật chứng không có trong kho bị phát hiện trước COMPOSE/âm thanh.
- TypeScript `npx tsc --noEmit --pretty false` đạt. Các bộ visual-contract, storyboard, fixed-compositions, placement-general, blocking và folk-blocking đạt trong đợt triển khai này.
- [11 bảng ảnh kiểm](video-references/closed-pack-20261024/index.html) gộp 82 ảnh; không đưa từng ảnh riêng vào thư mục tài liệu. `coverage.json` ghi thống kê và mức độ đối chiếu nguồn.

Kiểm pipeline dùng phản hồi AI giả lập nên không chứng minh AI bên ngoài luôn hiểu mọi truyện đúng. Đợt này kiểm ảnh tĩnh theo hướng dẫn kho, chưa tạo video MP4 mới để nghiệm thu thoại–hình toàn truyện.

## Giới hạn và phần còn lại

- 22 video nguồn hiện có tổng quan và các cảnh được chọn, chưa có sổ toàn bộ cảnh và lời thoại từng video. Không đánh dấu đã phân tích đầy đủ 22 video.
- Mẫu bế/cõng/tiếp xúc là minh họa tĩnh đơn giản. Ghé miệng/cắn vai hiện dùng nghiêng thân và hiệu chỉnh ngang, chưa phải bộ giải xương nhiều khớp hoặc kiểm sai số tiếp xúc số học cho mọi kích thước nhân vật.
- Có 26 họ không đồng nghĩa đã kiểm mọi tổ hợp đứng/ngồi/nằm, số người, camera và đạo cụ. Bước tiếp theo cần mở rộng ảnh hồi quy theo truyện mới và các khoảng thiếu có bằng chứng.
- Ghép từ các phần có sẵn đã có. Hệ thống tự phân rã mọi hành động khó thành hình trước–sau/insert vẫn chưa hoàn chỉnh. Nếu thiếu khả năng thiết yếu, hiện báo thiếu sớm; không tự đổi vật chứng hoặc vẽ thêm để báo thành công.
- Job cũ chưa có snapshot vẫn đọc theo cơ chế tương thích cũ để không làm hỏng dự án. Khi dựng lại bằng hai preset, job đi qua phạm vi kho đóng. Chế độ không chọn hai gói này vẫn giữ cơ chế thiết kế tự do.

## Tái tạo và bảo trì

```powershell
python python_scripts/kit_seed/build_closed_pack.py
python python_scripts/kit_seed/build_closed_pack.py --apply
npm run test:motion-closed-pack
npm run test:motion-closed-pipeline
python python_scripts/kit_seed/review_closed_pack.py
```

Installer có ID xác định, kiểm hình học, ghi nguyên tử, từ chối đè bản ghi không thuộc bộ bổ sung và lưu bản sao trước khi cập nhật tài nguyên đã có. Manifest/hash nằm trong `scratch/closed-pack-20261024/installed.json`; ảnh gốc và kết quả pipeline ở cùng thư mục. Đây là công cụ bảo trì kho, không chạy tự động trong lúc người dùng tạo video.
