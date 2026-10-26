# Kho bố cục và tài nguyên truyện dân gian — 23/10/2026

Đã cài gói `folk_blocking_v1` vào `storage/output/motion-video/kit-library`. Tài nguyên mới là SVG gốc được dựng cùng bộ hình học của kho, tách riêng hai phong cách **Tối giản mặt nạ** và **Chibi màu dân gian**. Hình nguồn chỉ dùng đối chiếu bố cục; không cắt nhân vật, phông nền của kênh rồi dùng làm tài nguyên xuất phim.

## Tài nguyên đã bổ sung

| Loại | Thiết kế mới | File đã cài |
|---|---:|---:|
| Bối cảnh | 32 | 256: hai phong cách × trái/phải × ngày/đêm |
| Đồ vật | 32 | 64 |
| Nhân vật | 18 | 36 |
| Cụm nội thất | 8 | 16 |
| Tổng | 90 | 372 |

Kho thật sau khi cài có 1.149 bối cảnh, 400 đồ vật, 160 nhân vật, 202 cụm ghép, 40 nền và 2 gói phong cách. Các số này bao gồm tài nguyên đã có từ trước. 372 file là phần tăng thêm của đợt này.

Bối cảnh mới gồm nhà sàn có hai người bệnh, phòng bệnh, giường và ghế thăm, chải tóc ngồi/đứng phía sau, sàn cao và cầu thang, chõng cạnh cột, giàn thợ mộc, nôi, canh linh cữu, rạp tang, bàn lễ, tiếp khách nhà chùa, bàn bài, quầy tạp hóa, tiệm sửa xe, cửa phòng trọ, bến cứu người, thuyền, bụi tre cúng cơm, rừng, sân bản, mộ, giếng, miếu cây đa, vườn chuối, đường ruộng, cầu gỗ, bếp cũ, lớp học, gác chuông và võng rừng.

Phần mở rộng dân gian được gắn `folkloreExtension` riêng: miếu cây đa, vườn chuối, đường ruộng cạnh mộ, biến thể cầu và bếp, cùng quạt mo, sáo, lục lạc, kiếm gỗ, gáo nước, đó cá, chuông tay, dao bổ cau, thầy lang và người gác đêm. Đây là mô típ minh họa do dự án bổ sung, không được ghi là đã xuất hiện nguyên dạng trong video nguồn.

## Thay đổi cách dựng

1. READ trả riêng tư thế, chỗ tựa, mục tiêu và dấu thay đổi vị trí của từng người. `blocking.roles` chỉ định ai là người bệnh, người chăm, người đứng trên sàn, người ở dưới… Khi thiếu tư thế của người trong nhóm, yêu cầu AI đọc lại trước khi chọn/vẽ bối cảnh.
2. Bối cảnh có `compositions`: nhóm điểm đặt theo vai. Mỗi người giữ một điểm riêng; quần chúng không chiếm điểm đã dành cho nhóm. Bộ dàn đội hình không kéo nhóm ra khỏi ghế, giường hoặc sàn cao.
3. Chọn kho phải khớp cả nhóm, tư thế và chỗ tựa. Bối cảnh có đủ số điểm nhưng thiếu quan hệ yêu cầu không được xem là khớp. Nếu kho chưa khớp, luồng ghép/vẽ mới hiện có nhận cả yêu cầu nhóm và các tổ hợp tư thế, rồi kiểm lại tọa độ.
4. Cụm nội thất cũng giữ nhóm vai khi ghép. Slot `scene_center` dành đủ chiều ngang cho cụm nhiều người; không thu nhỏ cả cụm vào ô đồ vật nhỏ khiến người lớn hơn giường. Điểm đặt và mặt bàn được biến đổi cùng hình.
5. Giữ tư thế và điểm đặt qua lời thoại, cận cảnh và khi quay về cảnh chung trong cùng địa điểm/chương/ánh sáng. Đứng dậy, đi lại hoặc đổi bối cảnh mới giải phóng vị trí cũ. Người nằm nói vẫn nằm, người ngồi nói vẫn ngồi.
6. Ngày/đêm dùng cùng tọa độ. Lật ngang đổi cả hình, mặt quay, điểm chạm, tên trái/phải và nhóm vai tương ứng. Kiểm tra camera bao đủ người trên cao và người ở dưới; sửa thứ tự nền sàn/nội thất để sàn không che chân cầu thang hoặc cột.
7. Cache READ/frame có `blockingVersion`; thay đổi nhóm điểm đặt làm đổi khóa bố cục. Khung cũ chưa có dữ liệu nhóm không được dùng lại như kết quả mới đã kiểm.

Ví dụ: A đứng cạnh B nằm trên giường → `bedside(patient=B,caregiver=A)`, B `posture=lie`, A `posture=idle`. Người chăm ngồi cạnh giường vẫn dùng cùng nhóm nhưng chọn biến thể có ghế. Hai người bệnh và thầy đứng giữa → `two_patients(patient_left=A,patient_right=B,caregiver=C)`. Việc nói, cầm đồ hay đổi cỡ cảnh không tự biến người nằm thành người đứng.

Có 17 loại quan hệ trong giao thức. Kho mới có mẫu dựng sẵn cho 16 loại; `offering` cần bố cục phù hợp từ kho/AI, `watching` dùng các sân/đường có cặp vị trí. Chưa bổ sung cơ chế gắn cơ thể cho bế người hoặc hai người khiêng một người; không coi những hành động này đã được giải quyết bằng hai điểm đứng.

## Đối chiếu 22 video

Đã xem bảng tổng quan của cả 22 video và các ảnh chọn lọc; video Chiếc khăn Piêu có bản phân tích riêng 341 khoảng hình. Không có kết luận rằng đã kiểm thủ công mọi cảnh, nghe mọi câu thoại hoặc đưa toàn bộ vật thể trong 14.050 ảnh vào kho. Video 09 và 16 dùng storyboard định kỳ, có thể thiếu cảnh ngắn.

Bảng sau là liên kết thiết kế mới với nhóm mô típ dùng tham khảo. Không phải danh mục toàn bộ cảnh của từng video. `reference-coverage.json` ghi rõ `exhaustiveSceneInventory:false` và phần mở rộng riêng.

| ID video | Tên nguồn | Bối cảnh liên quan | Đồ vật mới | Nhân vật mới |
|---|---|---|---:|---:|
| ZrgIi8a8dyA | Chiếc khăn Piêu - Bùa Yêu Kỳ Truyện | stilt_hearth_patients, village_two_patient_room, porch_seated_hair_grooming, raised_daybed_and_column | 1 | 0 |
| FFTF1CM4aBI | Người con anh hùng - Hồi ức ấu thơ | bedroom_standing_caregiver, funeral_bier_and_watchers, forest_hammock_companion | 0 | 1 |
| m9WhpDtE9xE | Cuốn sổ nợ - Hình nhân thế mạng kỳ truyện | bedroom_standing_caregiver, grocery_ledger_counter | 1 | 1 |
| P0xXIU5Lyr8 | Ván bài định mệnh - Thần Trùng P2 | cradle_and_mother_room, ritual_altar_visitors, monk_and_guest_reception, village_card_table, temple_bell_landing | 0 | 1 |
| nk48rQqJmc0 | Ván bài định mệnh - Thần Trùng Kỳ Truyện P1 | monk_and_guest_reception, village_card_table, river_ferry_boat, grave_watch_clearing | 1 | 1 |
| xS4lEGgdVCQ | Ác Giả Ác Báo - Bùa Lỗ Ban Kỳ Truyện | hospital_bedside_visit, carpenter_roof_scaffold | 1 | 1 |
| 1MBYdq1F-hE | Người mới, trọ cũ - Ma ăn hồn kỳ truyện | village_two_patient_room, boarding_room_doorway | 0 | 0 |
| U_2hRTsJ3So | Tình mẹ - Ma nữ mất con Kỳ Truyện | cradle_and_mother_room, old_village_bridge | 0 | 3 |
| 5tEEkZaXW3U | Én ơi, anh về rồi - Ma vọng phu kỳ truyện | stilt_hearth_patients, stilt_house_landing_stairs, river_landing_rescue | 0 | 0 |
| tUWV2SqMrpg | Chén cơm đất - Ma giấu người kỳ truyện | bamboo_grove_earth_bowl | 3 | 0 |
| XYjyI0EQ7tk | Trả nợ -Ma báo oán kỳ truyện | repair_shop_roller_door | 1 | 1 |
| 2ygTaMHUri0 | Anh Hai ơi, em xin lỗi - Heo 5 móng kỳ truyện |  | 1 | 1 |
| -Hb-Tn7OaHo | Thần trùng - Trùng tang kỳ truyện | bedroom_standing_caregiver, funeral_canopy_courtyard, grave_watch_clearing | 3 | 1 |
| vy7G-ATxNnM | Con nhớ nhà lắm - Ma da kỳ truyện | river_landing_rescue, river_ferry_boat | 1 | 1 |
| HSUbahCf3nU | Kẻ dẫn lối không đường về - Ma Trành kỳ truyện | forest_tiger_path, highland_village_meeting | 1 | 0 |
| Y_6PRdEk4Rk | Đứa con oan nghiệt - Con ranh con lộn kỳ truyện #tamlinh  #tamlinhthanbi | cradle_and_mother_room, grave_watch_clearing, bamboo_well_yard | 3 | 2 |
| brNfRbyVX0M | Tình duyên muôn kiếp - Cắt tiền duyên kỳ truyện | hospital_bedside_visit, ritual_altar_visitors | 2 | 0 |
| P3SOdALyYnA | Ma cà rồng Tây Bắc - Phí Phông kỳ truyện | stilt_house_landing_stairs, forest_tiger_path, highland_village_meeting, village_school_bench | 0 | 1 |
| Cyak0swNZEo | Đêm không ngủ - Quỷ nhập tràng kỳ truyện | funeral_bier_and_watchers | 2 | 2 |
| wtR75Nr2Whc | Bùa chú An Giang - Thư ếm kỳ truyện | ritual_altar_visitors, abandoned_kitchen_hearth | 4 | 1 |
| mmg9idL64rQ | Chú thuật phản phệ - Thiên Linh Cái Kỳ Truyện | ritual_altar_visitors | 2 | 1 |
| y9UmyNlC_g0 | Chuyến đi làm thuê trên bản - Ma xó Kỳ Truyện | stilt_house_landing_stairs, highland_village_meeting | 3 | 1 |

## Kiểm chứng

- 368 tổ hợp nhóm trên toàn bộ 256 bối cảnh, kiểm điểm riêng cho từng vai, tư thế độc lập, quần chúng không chiếm chỗ, ngày/đêm/lật ngang, cận cảnh rồi quay lại và chuyển tư thế rõ ràng.
- 130 ảnh dựng bằng engine thật; ghép thành 18 bảng JPEG để kiểm mắt, gồm bối cảnh, cụm ghép, nhân vật và đồ vật của cả hai phong cách. File đơn nằm trong `scratch`, bảng JPEG nằm trong thư mục tham khảo và được `.gitignore` giữ ngoài Changes.
- Kiểm cả kho cài thật: SHA-256 các file khớp manifest; `matchLibrarySets` chọn được nhóm mới theo yêu cầu tư thế mà không cần gọi AI ở trường hợp khớp chính xác.
- TypeScript, ESLint phần thay đổi, kiểm phân loại tài nguyên, kiểm bố cục chung, kiểm tư thế và 10 ca dựng × hai phong cách × bật/tắt motion đều đạt.
- Kiểm pixel thứ tự che khuất và kiểm biên camera cho người đứng ở hai độ cao khác nhau đều đạt.
- Chưa chạy lại một video đầy đủ bằng tài khoản AI sau đợt này. Bộ kiểm thử READ/COMPOSE dùng phản hồi AI giả lập cố ý sai để kiểm cơ chế sửa; ảnh kiểm tra được dựng thật. Các kiểm tra này chưa chứng minh mọi truyện mới sẽ đúng hoàn toàn.

```powershell
python -X utf8 python_scripts/kit_seed/install_folk_blocking.py
python -X utf8 python_scripts/kit_seed/install_folk_blocking.py --apply
npx tsx scripts/verify-motion-folk-blocking.ts --installed
python -X utf8 python_scripts/kit_seed/review_folk_blocking.py
npx tsc --noEmit
npx tsx scripts/verify-motion-placement-general.ts
npx tsx scripts/verify-motion-posture-continuity.ts
npx tsx scripts/verify-motion-blocking.ts
npx tsx scripts/verify-motion-depth-order.ts
```

Lệnh không có `--apply` chỉ ghi kế hoạch. Installer kiểm toàn bộ trước khi ghi, từ chối đè ID ngoài gói, giữ số lần sử dụng, lưu bản cũ và ghi từng file bằng đổi tên nguyên tử. `scratch/folk-blocking-20261023/installed.json` lưu đường dẫn và SHA-256 từng file.

Thư viện đang chạy có thể đọc tài nguyên mới ngay. Phần server của thuật toán bố cục cần nạp lại mã khi khởi động lại tiến trình; không tự ngắt server nếu có công việc khác đang dùng.

- [Xem 18 bảng ảnh kiểm chứng](video-references/folk-blocking-20261023/index.html)
- [Liên kết tham khảo của 22 video](video-references/folk-blocking-20261023/reference-coverage.json)
- [Phân tích riêng Chiếc khăn Piêu](pieu-scene-analysis-2026-10-23.md)
