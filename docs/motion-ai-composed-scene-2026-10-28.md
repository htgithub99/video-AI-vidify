# Remotion: AI thiết kế trọn cảnh

## Cập nhật nhiều Kiểu hình

Bản cập nhật tiếp theo đã đưa hướng dẫn riêng cho Truyện ma, Lịch sử và Giải thích vào đầy đủ các bước; có dạng minh họa, sơ đồ, so sánh, quy trình, bản đồ, dòng thời gian và cắt lớp. Composition mới dùng revision 3, vẫn hỗ trợ preview revision 1/2. Chi tiết ở `docs/motion-remotion-multi-style-2026-10-28.md`. Gallery `scratch/motion-multi-style-20261028/index.html` chỉ chứa SVG tham chiếu kỹ thuật, không phải đầu ra AI mới.

## Phạm vi đã làm

- Chỉ thay luồng dựng hình Remotion. Nhánh dùng kho giữ cơ chế hiện có.
- AI chia nhịp hình theo nội dung, vẽ một SVG tổng thể cho mỗi cảnh, tự quyết phối cảnh, người, đồ vật, ánh sáng, lớp trước/sau và keyframe chuyển động.
- Code kiểm SVG và dữ liệu, ghép dữ liệu sửa, lưu tiến độ, đọc keyframe theo frame, đồng bộ khẩu hình với thoại và xuất bằng Remotion.
- Không chạy bộ tự đặt lại tọa độ, tự ghép cơ thể hoặc tự dựng phòng cũ vào cảnh mới. SVG cũ vẫn xem được; khi dựng lại phải dùng định dạng mới.
- Các cảnh cùng nơi dùng cảnh đã đạt làm tham chiếu nối tiếp; các nơi khác vẫn dùng pool hiện có. Giới hạn SVG tham chiếu 24.000 ký tự, ghi chú liên tục 2.400 ký tự để tránh prompt tích lũy vô hạn.
- Prompt truyện ma dùng chung có SVG toàn cảnh trích từ code người dùng cung cấp, giữ phối cảnh, sàn và liên kết giữa người với đồ vật. Đã bỏ các lớp chữ LIVE/timestamp và người phụ không cần thiết. Đây là tham chiếu chất lượng vẽ; AI phải vẽ đúng cảnh hiện tại, không tự chèn đồ tang vào các bối cảnh khác.
- Chuyển động người, hiệu ứng cảnh, camera vẫn bật/tắt độc lập. Chỉ khẩu hình của nhân vật có thoại trực tiếp mới chạy trong khoảng thoại.
- Review ảnh vẫn theo cấu hình. Kiểm XML, an toàn tài nguyên và dữ liệu không bị tắt theo review ảnh.
- Sửa trường `layers` hoặc `animations` có thể giữ SVG đã trả đúng. Mỗi mảng sửa cần trả đầy đủ danh sách của mảng đó.
- Bản cập nhật revision 2 thêm `motion_remotion_design`: AI chọn camera, phối cảnh sàn, vùng hình, thứ tự lớp, điểm đỡ và tiếp xúc trước khi vẽ. Thiết kế được lưu checkpoint và đưa vào SVG tổng thể; code không dùng nó để tự di chuyển hình. Preview revision 1 vẫn đọc được, lần dựng mới dùng revision 2.
- Có thể sửa riêng nhóm SVG bằng `groupPatches:[{id,svg}]`, giữ đúng ID và giữ nguyên các nhóm khác. Chặn sửa cùng lúc cha/con, ID trùng, thay sai đích, fragment nhiều root và mã SVG không an toàn. Bước review ảnh dùng cùng cơ chế này khi được bật.
- Prompt sửa tách khỏi tham chiếu vẽ và SVG cảnh trước, giữ các dữ liệu cảnh cần thiết cùng bản đang sửa để tránh lặp prompt dài. Đã làm rõ camera là chuỗi, palette là mảng màu và opacity phải trong khoảng 0–1.
- Chấp nhận lớp hiệu ứng mang đúng ID khi kế hoạch gọi khói/lửa là prop; không bắt AI vẽ lại chỉ vì khác tên phân loại.

## Thử một cảnh thật

Thư mục: `scratch/ai-composed-scene-test-20261028/`.

- Gọi Chrome qua `generatePlanningWithChatUi` của tool, sau đó chạy `buildRemotionScenes` → `compileRemotionStory` → renderer Remotion thật.
- Gemini không tìm được ô nhập ở lượt đầu; thử tiếp bằng DeepSeek Standard.
- Một cảnh canh tang: quan tài đóng ở giữa, người nằm trên chiếu bên phải, bóng áo trắng bên trái, bàn thờ phía sau.
- Bật chuyển động người và hiệu ứng; camera cố định; review ảnh AI tắt. Có dùng SVG mẫu người dùng đưa làm tham chiếu chất lượng ở lượt sửa hình.
- Xuất `scene-test.mp4`: một cảnh, 1280×720, 30 fps, 321 frame / 10,7 giây gồm phần giữ hình của timeline. Không tạo voice cho phép thử này.
- Đã xem frame 0 và 90. So với lượt đầu, hình người nằm và quan tài rõ hơn; khói, ngọn lửa, nhịp thở có keyframe do AI trả. Đèn bị vẽ thành nến ở lượt đầu và đã yêu cầu AI sửa thành đèn có bầu dầu.
- Sau đó đã chạy lại cùng cảnh qua prompt mặc định chỉ có các đoạn tham chiếu ngắn dùng chung, không chèn toàn bộ SVG mẫu vào riêng câu hỏi thử. Lượt này cũng xuất được clip, nhưng bối cảnh, cấu tạo đồ vật và nét mặt kém bản có tham chiếu đầy đủ. Gallery giữ cả hai bản để so sánh; không đánh dấu hình đạt chất lượng.

## Kết quả kiểm tra

- `npx tsc --noEmit --pretty false`: đạt.
- `npm run test:motion-remotion`: đạt; thay các bài kiểm tra phụ thuộc bộ ghép từng món cũ bằng kiểm tra luồng SVG tổng thể, giữ bài kiểm tra hình học/đọc SVG cũ còn dùng cho dữ liệu cũ.
- `npm run test:motion-behavior`: đạt.
- `npx tsx scripts/verify-motion-log-sections.ts`: đạt.
- `npx tsx scripts/verify-motion-closed-pipeline.ts`: đạt với cả `minimal_mask` và `chibi_folk`, không tạo video sản xuất.
- Kiểm tra mới bao gồm sửa riêng trường lỗi, giữ cảnh đạt khi cảnh khác lỗi, cache, đổi tỷ lệ, kiểm mã SVG, tách chuyển động người/hiệu ứng và khẩu hình theo thời gian voice.

## Giới hạn đã thấy

- Đạt hợp đồng SVG và xuất được clip không chứng minh hình đạt chất lượng video mẫu.
- DeepSeek vẫn cần sửa hình theo phản hồi cụ thể. Nét mặt, tay và tiếp xúc đồ vật với mặt đỡ còn có thể chưa chuẩn; bản thử chưa được xác nhận đạt 100% mẫu.
- Phép thử chỉ xác nhận một cảnh; chưa chứng minh sự nhất quán nhân vật và bối cảnh cho cả video dài.
- CAPTCHA, đăng nhập và khả năng nhận tệp của nhà cung cấp vẫn thuộc luồng phục hồi/chờ người dùng hiện có.

## Cảnh mới bằng Gemini 3.8 Flash · Trung bình

- Lựa chọn trong tool: `gemini-chat`, model `gemini-flash::medium`, nhãn `3.8 Flash · Trung bình`; không thay sang nhà cung cấp khác.
- Thư mục phép thử: `scratch/gemini-spatial-scene-20261028/`.
- Nội dung: buồng ngủ nhà gỗ ban đêm; Chú Út nằm trên giường bên phải, bóng áo trắng đứng cạnh cửa bên trái, đèn dầu trên bàn nhỏ, mưa bên ngoài cửa sổ phía sau.
- Đi qua service chat Chrome thật của tool, rồi pipeline chia cảnh → thiết kế không gian → SVG tổng thể → compiler → renderer Remotion. Một cảnh, không voice; bật chuyển động người và hiệu ứng, camera cố định, review ảnh AI tắt.
- Lượt thiết kế đầu trả `camera` và `palette` là object; sửa riêng hai trường đã thành công. SVG đầu có opacity 1.08, bị yêu cầu sửa danh sách chuyển động, giữ hình đã vẽ. Chi tiết phản hồi và prompt lưu trong thư mục thử.
- Regression mới đã đạt: thiết kế thiếu ID/điểm đỡ sai, sửa trường riêng, vá nhóm giữ nguyên hình khác, tương thích preview cũ, tiếp tục checkpoint không hỏi lại thiết kế đã đạt, review dùng vá nhóm, tách các cấu hình chuyển động và gate khẩu hình theo thoại.
- Đã xem ảnh đầu: vị trí trái/phải và các chủ thể đúng, nhưng người nằm bẹt, mặt ma còn như hình khối. Đã yêu cầu Gemini sửa đúng các nhóm `ut`, `ghost`, `background`, `oil_lamp`; phản hồi thật lưu ở `101-motion_remotion_composition.response.txt`. Tool ghép các nhóm này vào SVG đã đạt, kể cả khi AI trả dư cả SVG mới thì vẫn lấy SVG cũ làm gốc.
- Lượt gửi ảnh sau sửa để review tự động gặp `gemini_file_input_missing`. Đây là lỗi tải tệp lên Gemini, không phải SVG vẽ bị lỗi; không coi bước review này là đạt. Giữ bản sửa, tắt review ở phép xuất cuối và xem ảnh trực tiếp. `finalize.mjs` dùng các nhóm AI đã trả qua cùng bộ ghép/normalize chung, không tự vẽ hoặc sửa tọa độ hình.
- Kiểm tra sau cập nhật: TypeScript đạt; bộ Remotion, render behavior và closed pipeline đạt với cả `minimal_mask` và `chibi_folk`. Closed pipeline là phép thử dữ liệu/mocks, không tạo thêm video sản xuất.
- Đã xem frame 0 và 90 sau sửa: đúng người bên phải trên giường, ma bên trái cạnh cửa, đèn trên bàn và mưa ngoài cửa sổ. Sàn đã có đường chân tường liên tục hơn; đầu người nằm xoay theo thân; ngọn lửa không còn bay khỏi bầu đèn. Nét cơ thể và mặt ma vẫn còn thô, chưa ngang chất lượng mẫu. Không đánh dấu cảnh đạt 100% mẫu.
- Clip một cảnh: `scene-test.mp4`, 10,7 giây, 1280×720, 30 fps, không voice. Các file `before-repair-*` giữ bản trước sửa. Không có video dài nào được tạo trong lượt này.
