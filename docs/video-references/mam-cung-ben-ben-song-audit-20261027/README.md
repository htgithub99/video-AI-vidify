# Kiểm tra video Mâm Cúng Bên Bến Sông

Ngày kiểm: 27/10/2026. Đây là video người dùng vừa tạo, xuất xong lúc **15:35:58**, dài **138,967 giây**, 18 cảnh, 1280×720, 30 fps.

## Kết luận

Video vẫn lặp các lỗi bố cục trước đó. Có hai nguyên nhân đã xác định: **backend chưa nạp các bản sửa** và **khóa checkpoint phân cảnh chưa buộc nâng contract cũ**. Input từ UI đã có cấu hình mới, nhưng dữ liệu dựng/spec/kết quả xuất vẫn mang contract cũ.

Lượt sửa trước mới được kiểm offline và chưa restart backend. Việc chưa đưa code mới vào backend đang phục vụ người dùng là phần thiếu của quá trình áp dụng bản sửa. Không được coi bài test offline đã qua là bằng chứng lượt xuất này dùng bản sửa.

Ngoài việc nạp backend, hình của lượt này cần được dựng lại theo contract mới. Chỉ xuất lại cùng compiled spec không tạo ra thiết kế nền/anchor/state/effect còn thiếu. Tài nguyên mới vẫn cần kiểm hình, không khẳng định restart là đủ để mọi cảnh đạt.

### Thiếu sót còn lại trong code migration

Đã chạy đối chiếu thuần trên dữ liệu lưu, không gọi AI: **18/18 beat** có cả `state.inputKeys[beat.id]` và `scene.sourceKey` khớp `remotionBeatKey()` hiện tại, mặc dù scene được tạo bởi contract cũ và chưa có mount/contact/effects/state mới.

Nguyên nhân:

- `sceneKeys.ts` chỉ hash `V.VERSION`, visual settings, era/cast/places, beat và note; chưa có scene contract revision. Đổi prompt/cấu trúc scene không làm checkpoint này hết hiệu lực.
- `scenePipeline.ts:195` dựa trên các key đó để quyết định hỏi lại phân cảnh. Với dữ liệu này nó có thể bỏ qua cả 18 đoạn.
- `sceneContinuity.ts:53,123` gán `layoutRevision` mới sau khi resolve bằng code; dấu này không chứng minh scene đã được lập lại theo contract mới.
- Đổi nền theo layer revision không tự sửa quan hệ sai đã lưu: khói vẫn có thể là một prop rời, muối vẫn có thể là node `inside` bàn, cửa sổ thiếu mount.

Vì vậy bản sửa migration trước **chưa hoàn chỉnh**. Cần version riêng cho scene contract/planning, chỉ đánh dấu đạt sau assess/repair thành công, invalidate compiled/review phụ thuộc đúng phạm vi và giữ voice/SEO. Không dùng tăng layoutRevision hoặc restart thay cho bước này.

## Bằng chứng về phiên bản thực thi

| Bằng chứng đã đọc trực tiếp | Kết quả |
| --- | --- |
| Process backend đang nghe cổng 3002 | PID `9788`, tạo lúc **11:46:02**, lệnh `node --import tsx server.ts`, không có watch |
| Code sửa trên đĩa | `storyCompiler.ts` 13:02:31; `motionRemotion.ts` 13:38:34; `scenePipeline.ts` 13:46:12; `motionProductionService.ts` 13:28:11 |
| Production | `53c01d81007bf76dbed7f4ad42f72999`, bắt đầu **14:34:41** |
| Input đã lưu từ UI | `renderBehavior={version:1,actors:"fixed",sceneEffects:"gentle",camera:"fixed"}`, `characterMotion=false`, `aiReview=false` |
| Script.gen.remotion | Không có `renderBehavior`, `layoutRevision`, `locations`; tất cả 62 asset không có `layerRevision` |
| Compiled spec thực sự dùng xuất | Có `motion:false`; không có `renderBehavior` hay `resolvedSettings`. 18 cảnh không có effect track/region/mount/contact mới |
| Kết quả render | Không có `resolvedSettings`, khác đường lưu kết quả của code mới |
| Log | Không có log mới `Cấu hình dựng`, `Phân cảnh Remotion`, `Bố trí cảnh`, migration bố cục |

Mốc thời gian trên theo Asia/Saigon. Tải lại trang chỉ nạp giao diện; không thay các module backend đã import trong tiến trình này.

Không kết luận mọi thành phần đều là bản cũ: giao diện đã gửi setting mới; renderer phía trình duyệt/bundle có thể nhận một phần file mới. Bằng chứng chắc chắn là các bước tạo scene, compile spec và ghi manifest của backend chưa chạy contract mới.

## Lỗi thấy trên hình

| Cảnh / thời gian | Quan sát trực tiếp | Quan hệ với dữ liệu dựng |
| --- | --- | --- |
| C01 · 00:00–00:06 | Chú Sáu ở tư thế xếp bằng nhưng treo trên phần kiến trúc phía sau; hai người lệch tỷ lệ. Bàn thợ ở xa bên trái, không ở trước chú như mô tả. | Người không có quan hệ/contact với vật đỡ; slot và kích thước chung không mô tả được chỗ ngồi. |
| C02 · 00:06–00:15 | Mâm gần bằng bề ngang toàn người, che thân và tay. | `heldBy` vẫn đi qua công thức kích thước cũ: mâm cao 324 đơn vị trên người cao 518,4. |
| C03 · 00:15–00:23 | Mâm nằm sát chân nhưng tỷ lệ vẫn quá lớn. | Dùng cùng quy tắc prop cao 30% khung, không theo công dụng/kích thước thật. |
| C04 · 00:23–00:30 | Khói thành một dải hình rời ở bên cạnh, không nối đầu nhang. | Khói được AI vẽ thành node prop, không có emitter/effect track. Hai ảnh tại **24,23s** và **28,70s** giống hệt nhau ở 590 hàng ảnh phía trên, loại vùng phụ đề. |
| C05 · 00:30–00:38 | Chén lớn hơn đầu, lơ lửng cao cạnh vai; gạo muối thành một dải rời bên trái. | Vật cầm không giới hạn theo thân/tay; dấu vết không có mặt phẳng và hướng theo lối vào. |
| C06 · 00:38–00:45 | Vệt gạo muối dựng đứng dưới bàn thay vì trải trên sàn chạy vào gầm bàn. | Dữ liệu gán `inside → workbench`, không có role decal/mặt sàn. |
| C07 · 00:45–00:52 | Chổi ngắn và phần đầu chổi nằm cao trước ngực, người không có điểm cầm đọc được. | Điểm grip/kích thước không đúng quan hệ vật cầm; không phải vì cần diễn thao tác quét. |
| C08 · 00:52–01:00 | Chân người đặt ngay trên mặt phản, toàn thân bị nâng lên. | `on` vẫn dùng base bàn chân; asset không có seat contact. |
| C09 · 01:00–01:09 | Khúc gỗ và đục phóng đại, đục gần bằng phần thân người. | Props dùng chung chiều cao 324 đơn vị, thiếu giới hạn tương quan trên vật đỡ. |
| C10 · 01:09–01:17 | Người kể được đặt cao gần ngang người ngồi, nhìn như lơ lửng; cánh tay vươn ra không nối tới người kia. | Quan hệ beside kế thừa đường chân của người đã bị nâng lên, không dùng mặt sàn. Không yêu cầu diễn nắm tay, chỉ cần đứng sát đúng vị trí. |
| C11 · 01:17–01:23 | Hai cánh cửa nhỏ đứng riêng giữa lối mở lớn; then cửa là vật rời ở bên trái. | Cửa không có mount/socket với ô cửa thật, chiều cao chỉ bằng prop thường. |
| C12 · 01:23–01:30 | Vệt gạo muối tiếp tục dựng đứng; bóng ma nhỏ/tối, khó đọc. | Vai trò dấu vết sai; cụm bóng ma cũng đi theo tỷ lệ prop và quan hệ on lên vệt. |
| C13 · 01:30–01:38 | Cụm cô hồn bé như mô hình dưới chân, không tạo cảm giác vây người. | Không có tương quan tỷ lệ của nhóm hình người với actor. |
| C14 · 01:38–01:45 | Vẻ mặt đã đổi nhưng vấn đề người ngồi trên phản và tỷ lệ vẫn còn. | Đổi SVG mặt không sửa được contact và layout cũ. |
| C15 · 01:45–01:53 | Người quỳ trong sân thể hiện được ý ngạt/sợ; cách giản lược này chấp nhận được. | Không cần bổ sung animation chạy/ngã. Đây không phải lỗi phải bắt chặt thêm. |
| C16 · 01:53–02:01 | Cửa sổ thành khung rời sát đất; bản sao đứng trước khung thay vì nhìn qua cửa sổ trên tường. | Node window chưa mount vào nền; quan hệ inside không tạo được occlusion/phối cảnh đúng. |
| C17 · 02:01–02:09 | Hai người đã có độ mờ, nhưng tỷ lệ/độ tương phản chưa tạo được cảm giác hồn ma rõ. | Độ mờ không thay thế kiểm hình/phong cách. Chưa thể coi đạt mẫu. |
| C18 · 02:09–02:19 | Khói xưởng mọc thành cụm sát đất bên phải, không phát từ mái/ống khói. | Khói vẫn là prop trên đường chân, không có source/emitter. Chênh lệch pixel giữa hai mẫu rất nhỏ, phù hợp với hình tĩnh/nhiễu nén; không dùng chênh lệch này để khẳng định có chuyển động khói. |

## Địa điểm vẫn bị dựng độc lập

Video chỉ có **hai place ID** nhưng dùng **16 backgroundKey cho 18 cảnh**. Cùng xưởng mộc thay từ mái/cột mở, sang phòng ván tối, sang cửa lớn, cửa sổ rồi cảnh mặt tiền khác. Đây là cơ chế dựng nền theo từng đoạn của backend cũ; không có location design ổn định của bản sửa.

Không nên giải quyết bằng việc bắt nhân vật diễn đủ động tác. Trọng tâm vẫn là tỷ lệ, người/vật nằm đúng mặt phẳng, kiến trúc gắn đúng vùng, khói phát đúng nguồn và giữ một thiết kế cho mỗi nơi.

## Bước cần thực hiện để bản sửa có tác dụng

1. Nạp lại đúng backend Video Motion, xác nhận phiên bản thực thi và log cấu hình mới trước khi chạy AI.
2. Với dự án này, chủ động dựng lại phần hình/phân cảnh cần migration; giữ kịch bản, voice và SEO. Không chỉ xuất lại spec đã lưu.
3. Sửa checkpoint theo scene contract revision; dữ liệu cũ chưa đạt phải được replan/repair đúng đoạn. Đã xác nhận cả 18 đoạn hiện khớp key nên đây là thiếu sót có thật, không chỉ là khả năng. Không biến mọi khói thành emitter bằng suy đoán vị trí.
4. Trước khi tốn thời gian xuất, đối chiếu các ảnh C02/C04/C06/C08/C11/C16/C18 với lời. Chưa được dùng kết quả test geometry để kết luận hình đạt.

Đợt kiểm này chỉ đọc dữ liệu, trích ảnh từ MP4 có sẵn và viết báo cáo. Không sửa code runtime, không restart backend, không gọi AI/TTS, không tạo/resume video. Chưa nghe trực tiếp audio trong lượt kiểm.

## Tệp đối chiếu

- [Cảnh 1–6](board-1.jpg)
- [Cảnh 7–12](board-2.jpg)
- [Cảnh 13–18](board-3.jpg)
- [Timeline, lời thoại và node từng cảnh](timeline.json)
- [So sánh hai mốc khói](effect-checks.json)

Nguồn đã đọc:

- `storage/output/motion-video/productions/53c01d81007bf76dbed7f4ad42f72999.json`
- `storage/output/motion-video/story-jobs/d8513b82-b096-4558-b1da-e5b6c5ee17c5.json`
- `storage/output/motion-video/render-jobs/f4b1dd61-ef5f-4243-9270-f8bf60171271.json`
- `storage/output/motion-video/mam-cung-ben-ben-song-16x9-draft-1793090088108.mp4`
