# Rà soát gốc: minh họa đơn giản và khả năng hoàn tất Video Motion

Ngày: 26/10/2026. Trạng thái: phân tích để chuẩn bị sửa, chưa thay đổi code chạy, chưa tạo hoặc tiếp tục video.

## 1. Phạm vi và kết luận

Đối chiếu source hiện tại, log và dữ liệu production, 19 ảnh đại diện của bản thử `root-live-2m-20261025`, cùng bộ ảnh/phân tích Piêu lưu trong dự án. Đã mở lại bảng ảnh mẫu `review-03.jpg` và bảng ảnh bản thử. Không tuyên bố đã xem lại toàn bộ 22 video hoặc nghe nghiệm thu lại âm thanh trong lượt rà soát này.

Yêu cầu của người dùng: hình minh họa đúng người, nơi, quan hệ vị trí và đồ vật quan trọng. Có thể thay ngồi bằng đứng, bỏ động tác tay, bước đi hoặc mở cửa nếu hình đại diện vẫn diễn đạt đúng tình huống. Chỉ giữ tư thế/trạng thái khi nó quyết định ý nghĩa tình tiết.

Gốc lỗi không chỉ là số lượng tài nguyên. Hệ thống có điểm đặt cố định và chọn bố cục bằng code, nhưng việc xác định cần đặt ai/vật gì cạnh đâu vẫn phụ thuộc dữ liệu AI đọc ra. Thiếu quan hệ vị trí có thể qua kiểm tra; một ràng buộc hành động phụ được khai báo lại có thể trở thành điều kiện bắt buộc và làm dừng cả lượt.

Có hai nhóm lỗi độc lập:

1. Xuất được MP4 nhưng hình sai ý nghĩa hoặc sai vị trí.
2. Một phần phản hồi AI không đạt làm workflow dừng, kể cả chưa bắt đầu dựng hình.

## 2. Chuẩn minh họa cần áp dụng

| Lời kể | Hình có thể chấp nhận | Điều cần tránh |
| --- | --- | --- |
| Người con ngồi canh bố | Con đứng hoặc ngồi cạnh giường, đúng người và đúng phòng | Vì thiếu ghế mà dừng cả video; chuyển con sang phòng khác |
| Người con bước tới, đưa tay mở cửa | Con đứng cạnh cửa; không cần hoạt họa bước chân, tay hoặc tháo then | Vẫn đứng cạnh giường khi cửa là điểm tập trung của đoạn; tự cho cầm then |
| Người ngoài cửa gọi xin vào | Hình trong phòng hướng về cửa, người gọi có thể ngoài hình | Lấy câu yêu cầu làm bằng chứng người trong phòng đã thực hiện |
| Bố bệnh nằm liệt giường | Giữ hình nằm khi tình trạng bệnh là yếu tố chính | Áp dụng quy tắc đổi mọi tư thế thành đứng làm sai tình trạng nhân vật |
| Phát hiện vệt bùn ở bậu cửa | Vệt bùn/chi tiết tương thích đặt ở bậu cửa, có thể dùng hình cận | Dùng một vũng nước ở vị trí sàn bất kỳ |
| Một vật bị đổi trạng thái tạo thành manh mối | Hình thể hiện được đặc điểm thiết yếu của manh mối | Tên tài nguyên có từ tương tự nhưng hình không thể hiện đặc điểm đó |

Không bắt buộc tách hình theo mỗi động từ hoặc người nói. Giữ cùng cảnh qua nhiều câu là phù hợp nếu tình huống không đổi. Không tăng chuyển động/zoom để che thiếu hình hoặc vị trí sai.

## 3. Những lỗi trong bản thử 2 phút

Bản thử đã xuất MP4 khoảng 112,3 giây; kiểm giải mã thành công không đồng nghĩa hình đã đạt.

| Mốc đại diện | Bằng chứng | Chẩn đoán |
| --- | --- | --- |
| 42,372–90,857 giây | Nhân vật con cầm thanh then lớn, ngay từ đoạn tiếng gọi ngoài cửa | READ đã gán `wooden_door_bar`, `mount: held`, `owner: toi`, `transition: false`. Chưa có hành động lấy then làm cơ sở. |
| 59,883–64,568 giây | Lời kể tới cửa/chạm then nhưng con vẫn ở cạnh giường | State chỉ có `posture: idle`, không có quan hệ đặt cạnh cửa. Bố cục hợp lệ theo dữ liệu nhưng dữ liệu bỏ sót vị trí cần có. |
| 70,827 giây | Nhang cắm ngược là manh mối; hình chưa làm rõ. Đĩa gạo vẫn ở bàn xa đầu giường | Mô tả bằng chữ chưa được chuyển đầy đủ thành vị trí/trạng thái có thể kiểm chứng. Cần kiểm khả năng thể hiện manh mối trước khi chốt truyện mới. |
| 108,275 giây | Vệt bùn ngoài bậu cửa hiện như vũng dưới ghế | READ chọn `water_puddle`, `mount: floor`, `support: floor`. Câu mô tả có vị trí nhưng cấu trúc chỉ còn sàn chung. |

Không tính riêng việc con đứng thay ngồi là lỗi theo yêu cầu mới. Không tính việc tái sử dụng phòng là lỗi tự thân. Nhận diện hai vai và bố nằm trên giường là phần đã giữ được, nhưng chưa bù được các lỗi trên.

Dữ liệu: `scratch/motion-live-2m-root-20261025/frame-audit.json`, `frame-board.jpg`, `compiled-audit.json`.

## 4. Nguyên nhân trong code hiện tại

### 4.1. Quy tắc đơn giản hóa chưa thống nhất

- `src/constants/motionStoryboard.ts`: có yêu cầu minh họa tĩnh, bỏ cử chỉ phụ; đồng thời liệt kê thay đổi posture/support và cửa mở trong nhóm cần tách hình. Chưa có tiêu chí thống nhất phân biệt chi tiết bắt buộc với chi tiết có thể lược.
- `src/constants/motionPlanRecovery.ts`: prompt còn quy tắc `Never stand up a narrated seated/lying person`.
- `src/server/services/motionPlanRecoveryService.ts`: chỉ đơn giản hóa tư thế ngồi khi không thấy từ ngồi trong dẫn chứng/ngữ cảnh. Vì thế câu có ngồi vẫn có thể buộc tìm ghế dù người dùng chấp nhận đứng.
- `src/server/services/puppet/layout.ts`: khi support hoặc tư thế đã thành ràng buộc mà không có điểm phù hợp thì ném lỗi. Kiểm hình học này cần giữ; phải đơn giản hóa yêu cầu phụ trước khi đưa vào kiểm.

### 4.2. Đường đọc kết hợp thiếu hợp đồng vị trí tương đương

- `MOTION_STORYBOARD.PLAN_READ` trả luôn READ trong lượt lập nhịp hình, giúp giảm một lượt AI.
- Schema ngắn này chưa hướng dẫn đầy đủ trường placement và ràng buộc chủ thể/vị trí như đường READ chuyên biệt có `SELECTION.SPATIAL_PROMPT`.
- `src/server/services/puppet/director.ts:348` dùng lại READ từ storyboard nếu qua kiểm, không tự gọi READ chuyên biệt.
- `src/server/services/puppet/spatialPlacement.ts` kiểm những placement đã khai báo; state không có placement thì được bỏ qua.

Vì vậy không cần thêm một lượt review AI mặc định. Cần dùng chung hợp đồng đọc cho cả hai đường và kiểm việc thiếu quan hệ thiết yếu trước khi chọn bố cục.

### 4.3. Cố định tọa độ chưa bảo đảm đúng ý nghĩa

`src/server/services/puppet/packSceneChoices.ts` hiện liệt kê bố cục hợp lệ, chấm điểm và chọn bằng code, lưu lựa chọn có hash. AI không tự vẽ tọa độ tùy ý trong nhánh kho đóng.

Nhưng code chỉ có thể đáp ứng điều kiện đã đọc được. Nếu state thiếu vị trí cửa, điểm đứng khác vẫn có thể đạt. Nếu vật chỉ có `support: floor`, một vị trí sàn xa bậu cửa vẫn có thể đạt. Việc thêm nhiều điểm cố định không tự sửa được thiếu sót ngữ nghĩa này.

### 4.4. Dữ liệu sai ban đầu được giữ liên tục

`src/server/services/puppet/visualContract.ts:41` giữ identity, owner/mount và mang tiếp vật qua các hình trong cùng phạm vi. Cơ chế này có ích, nhưng đầu vào sai như then cửa thuộc tay con sẽ được mang tiếp khi chưa có chuyển trạng thái.

Cần xác nhận quan hệ cầm/mang/trao bằng sự kiện thực đã xảy ra, phân biệt với lời nhắc, yêu cầu, giả định và tiếng nói ngoài hình. Không dùng toàn bộ các danh từ xuất hiện trong thoại làm lệnh thêm đạo cụ.

### 4.5. Có kho nhiều nhưng kiểm khả năng vẫn có lỗ hổng

`planReadiness.ts` đã kiểm nhân vật, bối cảnh và tổ hợp nhu cầu được khai báo. Nếu khai báo thiếu quan hệ hoặc trạng thái của manh mối thì kiểm đầu lượt không bảo đảm được khả năng minh họa đầy đủ.

Ngược lại, một tổ hợp chứa nhiều tư thế/support phụ có thể bị coi là kho thiếu dù có cách minh họa đơn giản hợp lệ. Phục hồi ở `motionPlanRecoveryService.ts` còn nhận diện lỗi thiếu bối cảnh qua tiền tố thông báo, các loại thiếu khác có thể ném thẳng ra. Nhánh dựng có retry READ hữu hạn nhưng chưa phải một chuỗi đơn giản hóa chung.

Không chọn cách vẽ thêm ngoài kho hoặc thay bừa manh mối để vượt kiểm tra. Với truyện mới, cần chọn tình tiết thiết yếu phù hợp khả năng gói trước khi chốt; với nội dung bắt buộc giữ nguyên, phải nêu chính xác điều kiện chưa thể đáp ứng.

### 4.6. Workflow dừng vì sửa dữ liệu chưa đủ nhỏ

Ảnh UI của người dùng thể hiện lượt thật `91d9d75d41be32eb5a1117616af90b2a` lỗi ở 1%, trước bước dựng hình. Đây là lỗi khác với vị trí trong bản thử 2 phút:

- Phản hồi dàn ý sai key `size`/`mount`, thiếu dẫn chứng cho một số đồ vật.
- Phản hồi sửa tiếp theo sai JSON tại `requirements`.
- Repair vẫn gửi phạm vi `illustrationNeeds` lớn, chưa cô lập mỗi mục/trường sai.
- `motionAiContractService.ts` tiêu hết budget sẽ gắn `CONTRACT_EXHAUSTED`.
- `motionStoryService.ts:815` ném lại cờ đó, không chuyển AI ở trường hợp này dù danh sách có nhiều AI.
- Resume giữ nguyên budget đã hết nên có thể dừng ngay mà không gửi request mới. Cần phục hồi có giới hạn cho phần còn lỗi, không reset mù số lần sửa.

Prompt lớn là khoảng trống tối ưu đã xác nhận; không đủ bằng chứng để quy mọi lỗi JSON cho độ dài prompt. Chi tiết trong `docs/motion-live-production-stop-audit-2026-10-25.md`.

### 4.7. Các phần đã có phải giữ và ghi nhận đúng

- Backend production giữ bước, tiến độ và log; không dựa vào trang web để điều phối toàn bộ.
- Sau kịch bản, hình và voice chạy song song; SEO là phần tùy chọn, có thời hạn chờ riêng.
- Review ảnh có cấu hình; khi tắt, không gọi vòng QA ảnh AI. Kiểm catalog/hình học vẫn chạy.
- Compile kiểm track giọng và kết quả render cần qua kiểm media.
- Production từ kho hiện chỉ hỗ trợ 2D (`assertMotionProductionMode`, `MOTION_PRODUCTION.DRAWING_MODE`). Renderer còn nhánh WebGL/3D không có nghĩa production kho 3D đã tương đương hoặc được nghiệm thu.
- Trong `buildMedia`, một nhánh lỗi cuối cùng sẽ hủy các job chưa hoàn tất rồi kết thúc lượt. Vì thế cần xử lý lỗi có thể phục hồi bên trong nhánh, giữ artifact đã đạt, trước khi nâng thành lỗi toàn lượt.

Các sửa trước về catalogKey, tư thế nằm, cache khi resume và sức chứa bố cục vẫn có giá trị. Kiểm các phần đó chưa bao phủ việc AI đọc sai ý nghĩa và phản hồi JSON hỏng của dàn ý nhiều chương.

## 5. Hướng sửa gốc đề nghị

1. **Một hợp đồng minh họa chung:** đúng người, địa điểm, quan hệ vị trí, vật/manh mối thiết yếu. Phân biệt chi tiết bắt buộc và phụ bằng ảnh hưởng tới tình tiết; không đánh đồng mọi động từ với một sự kiện phải dựng.
2. **Chốt khả năng trước khi chốt truyện mới:** chỉ dùng ID và khả năng thật của gói đã chọn. Tên/alias không đủ chứng minh một trạng thái nhìn thấy được. Không phát sinh tài nguyên ngoài kho khi sản xuất.
3. **Hợp nhất đường đọc:** storyboard có READ và READ chuyên biệt dùng chung schema/validator về người, vị trí, chủ vật, trạng thái và nguồn bằng chứng. Chỉ yêu cầu sửa trường thiếu/sai, không thêm lượt AI đọc lại toàn bộ mỗi cảnh.
4. **Chọn hình đơn giản bằng code:** thử dùng bố cục hiện có, đổi tư thế phụ sang đứng/idle, bỏ cử chỉ và đạo cụ phụ, dùng hình đại diện khác cùng không gian khi đủ thông tin. Luôn giữ quan hệ vị trí và manh mối bắt buộc. Không biến mọi chi tiết thành tùy chọn chỉ để xuất cho xong.
5. **Sửa liên tục trạng thái:** sự kiện thật mới đổi chủ vật hoặc trạng thái; lời xin mở cửa không khiến con cầm then. Dùng vị trí có cấu trúc như cạnh cửa/đầu giường/bậu cửa thay mô tả tự do và support chung.
6. **Sửa dữ liệu từng phần:** chia theo chương, nhu cầu minh họa và trường lỗi; giữ phần đã xác nhận. Không áp dụng tùy tiện những mảnh trích từ JSON hỏng. Budget hữu hạn theo phần và AI, fallback chỉ theo cấu hình cho phép, resume có hành động phục hồi thật và giữ lỗi gốc.
7. **Trạng thái chờ có thể tiếp tục:** CAPTCHA cần xác minh; lỗi dịch vụ tạm thời chờ/retry hữu hạn. Không tự chạy lại lượt đã dừng. Thành phần tùy chọn không chặn video chính; lỗi thiết yếu phải được phục hồi trước khi báo hoàn thành.
8. **Dọn code theo đường thay thế:** bỏ prompt/schema trùng hoặc mâu thuẫn, quy tắc buộc mọi ngồi/đứng và tách hình theo thay đổi phụ. Giữ kiểm hình học, kho đóng, giọng bắt buộc, lưu tiến độ và kiểm MP4.
9. **Sửa UI tại component sở hữu hàng nút:** bỏ ô đệm rỗng, gom hai nút vào một nhóm flex với khoảng cách nhỏ và căn phải. Không đổi class dùng chung toàn ứng dụng để chữa riêng một hàng.

## 6. Nguyên nhân UI chính xác

`src/features/motion/components/MotionVideoCreator.tsx:450` dùng class `FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PT_2_GAP_2_FLEX_WRAP`; giá trị trong `src/features/motion/constants/motionStyles.ts:55` là `flex items-center justify-between pt-2 gap-2 flex-wrap`.

Hàng chứa một `<div />` rỗng và hai `ActionBtn` qua React Fragment. Fragment không tạo phần tử bao, nên khi có nút tiếp tục, flex có ba item: ô rỗng, nút tiếp tục, nút tạo. `justify-between` phân phối khoảng trống giữa ba item; vì vậy nút tiếp tục nằm gần giữa và nút tạo sát phải như ảnh.

Đích sửa: `[Tiếp tục lượt này] [Tạo video]` cùng một nhóm, cách khoảng 8 px; màn nhỏ cho xuống dòng có kiểm soát, trạng thái đang chạy/dừng vẫn cùng nhóm.

## 7. Nghiệm thu sau khi được yêu cầu triển khai

- Ngồi canh có thể minh họa đứng cạnh người bệnh khi không thay ý nghĩa; không lỗi vì thiếu ghế.
- Mở cửa không cần động tác tay; nhân vật đúng cạnh cửa và không tự cầm then chỉ do có tiếng gọi.
- Lời kể đĩa ở đầu giường/vệt bùn ở bậu cửa phải khóa đúng quan hệ đó.
- Manh mối quan trọng đọc được, không thay bằng đạo cụ chỉ giống tên.
- Lỗi một trường AI chỉ sửa phần đó; phần đạt được giữ, JSON sửa hỏng không làm mất draft.
- Hết lượt một AI, chế độ khóa AI và nút tiếp tục được kiểm riêng; không báo đang phục hồi khi thực tế dừng ngay.
- CAPTCHA giữ tiến độ và chờ người dùng; không báo hoàn thành giả.
- Hai nút sát nhau ở các độ rộng và trạng thái.
- Kiểm hồi quy trên dữ liệu lỗi thật và cả hai gói; sau đó chỉ chạy video thử ngắn khi được yêu cầu, không tự chạy video 20 phút.

Không thể bảo đảm dịch vụ AI, CAPTCHA, mạng và ổ đĩa không bao giờ lỗi. Mục tiêu kỹ thuật là không để chi tiết minh họa phụ làm hỏng lượt, tự phục hồi lỗi có thể xử lý, giữ tiến độ khi phải chờ và chỉ báo hoàn thành khi có đầu ra hợp lệ.
