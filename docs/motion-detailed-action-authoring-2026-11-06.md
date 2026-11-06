# Chi tiết hành động từ viết kịch bản và phân cảnh

Ngày 06/11/2026. Bổ sung theo yêu cầu làm rõ đầu vào trước lượt vẽ, giữ AI là bên viết và thực hiện động tác.

## Hai giai đoạn AI viết

**Viết kịch bản:** mỗi nhịp có `motionIntent` tách khỏi lời đọc. Prompt yêu cầu AI mô tả START, SUBJECT ACTIONS, INTERACTIONS, END và ENVIRONMENT/CAMERA. Mỗi chủ thể/nhóm được nêu riêng, có hướng/tiến độ, cách các bộ phận thực hiện động tác qua các pha, điểm tựa và liên kết. Người đứng yên hoặc vật tĩnh phải giữ đúng vai trò. Cho phép AI diễn giải cơ chế hiển thị của hành động đã có trong nguồn, không bịa thêm cuộc đánh, cú ngã, thương tích, vật dụng hay kết cục mới.

**Phân cảnh:** nhận nguyên văn các mô tả viết ở trên và cụ thể hóa cho đúng phạm vi lời dẫn của từng shot. Không chỉ chép đoạn tổng quát hoặc ghi tư thế ban đầu. AI trả thêm `scene.actionPlan` trong cùng phản hồi phân cảnh:

```text
start
subjects[]:
  nodeId              ID thật trong nodes của cảnh
  action              hành động của chủ thể
  parts[]:
    name              tên bộ phận bằng lời, AI tự chọn
    change            thay đổi tương đối và phối hợp với phần còn lại
  phases[]:
    phase             pha thực hiện do AI mô tả
    description       diễn biến cụ thể của pha
  end                 trạng thái cuối của chủ thể
interactions[]        trình tự tác động/phản ứng, cầm/tựa/trao/nhả
end                   trạng thái cuối toàn cảnh
environment           chuyển động môi trường hoặc giữ tĩnh
camera                camera phù hợp shot hoặc cố định
```

Đây là cấu trúc dữ liệu cho **AI tự viết**, không phải bộ mẫu động tác do code áp đặt. Với nhóm/unit, mô tả phải bao phủ các thành viên thấy được và đang tham gia. Với sơ đồ/bản đồ/quy trình/card, AI mô tả phần trình diễn đúng dữ kiện thay vì gán động tác người. Không yêu cầu thêm chân cho người trong profile horror. Cấu trúc khung hình hiện có vẫn giữ nguyên.

## Truyền sang vẽ và lưu

- Prompt vẽ nhận nguyên văn `motionIntent` của nhịp nguồn và toàn bộ `actionPlan` của shot. AI tự thiết kế cấu trúc SVG và keyframe để thực hiện các thay đổi tương đối đó trong cùng lần vẽ.
- Bỏ câu phân cảnh cũ nói chỉ cần hình và ambient animation tùy chọn; pose ngắn chỉ mô tả trạng thái đầu, không thay thế hành động xuyên thời gian.
- Giữ đầy đủ đoạn văn dài của kế hoạch hành động; không cắt theo giới hạn trường camera, pose hoặc support.
- Cảnh mới có mô tả viết kịch bản mà thiếu actionPlan bị báo thiếu dữ liệu ở bước phân cảnh, trước khi gửi vẽ. nodeId trong actionPlan phải trỏ vào node của cảnh. Đây là kiểm hợp đồng dữ liệu, không thêm QA hình hay vòng sửa sau vẽ.
- Cache tính cả mô tả cảnh; hai hình có cùng bố cục nhưng actionPlan khác nhau không bị gộp mất một hành động. Khi không có trường mới, dữ liệu và khóa cảnh cũ vẫn tương thích. Không tự viết lại hoặc dựng lại toàn bộ dự án cũ.
- Giữ một phản hồi vẽ/cảnh, không gọi director/QA/repair sau vẽ, không thêm hoặc sửa keyframe bằng code. Giữ 5 room, model và cấu hình xuất.

## Kiểm chứng

- `npm run test:motion-script-intent`: kiểm dịch vụ viết/editor, 96 tổ hợp profile/genre/format và 45 tổ hợp unit/profile, pipeline 18 cảnh với đỉnh 5 worker. Prompt nhận nguyên văn dữ liệu của AI viết và AI phân cảnh.
- Bổ sung kiểm actionPlan nhiều đoạn dài, lưu/tiếp tục, hash thay theo actionPlan và không gộp hai hướng dẫn hành động khác nhau. Giữ kiểm tắt motion và cảnh legacy.
- `npx tsc --noEmit`, test camera, compatibility rig và log liên quan được chạy trong đợt này. Không đưa các test nghiệm thu thành runtime QA.

## Case thực tế

Nguồn: production Granicus `f82fe2c76c1ab22004a52e6147acdf2c`, lời dẫn của cảnh 41. Toàn bộ thao tác dùng bản sao, không sửa production gốc.

- `storage/output/motion-video/clip-demo/detailed-actions-authoring-20261106`: Gemini Flash low trả lại lời dẫn đã duyệt cùng mô tả hành động. Response gốc và prompt giữ đầy đủ. Có tin ACK nạp ngữ cảnh; một lời gọi viết nội dung, không phải một cảnh cho mỗi tin chat.
- `detailed-actions-planning-drawing-20261106`: thử yêu cầu phân cảnh bằng đoạn văn; AI vẫn chép lại mô tả chung, chưa tách theo node. Giữ kết quả này; không coi đây là nghiệm thu độ chi tiết. Lượt vẽ một lần sau đó chỉ chứng minh đường truyền, không chứng minh chất lượng đã đạt.
- `detailed-actions-structured-20261106`: thử đầu ra actionPlan có cấu trúc qua pipeline thực tế. AI phân cảnh trả 4 mục chủ thể (Alexander, ngựa của ông, hai nhóm kỵ binh), có các phần `parts/change`, `phases`, `interactions` và trạng thái cuối. Lượt đầu có một ID khác với node và `kind=horse` không thuộc enum, nên AI sửa phân cảnh một lần **trước khi vẽ**. Tổng cộng 2 lời gọi phân cảnh và **1 lời gọi vẽ**, không có sửa/vẽ lại sau sinh. Giữ nguyên 17 animation track AI trả về và production gốc không đổi.
- Đã compile được spec, nhưng xuất MP4 bằng Remotion/Chrome thật bị timeout khi đặt frame 102 sau ngưỡng chờ 28 giây. Ghi ở `failure.json`; không tăng timeout, hạ FPS/độ phân giải hoặc gọi AI vẽ lại để báo đạt. Preview SVG dùng cùng hàm production được kiểm riêng bằng Chrome có cửa sổ; kết quả preview không thay cho kết luận export thành công.
- Preview riêng đã phát hết 254 frame của spec compile từ script một nhịp, không lỗi trang, giữ nguyên animation và hash production nguồn. Bằng chứng `preview-verification.json`, `preview-start.png`, `preview-middle.png`, `preview-end.png`. Đây là phát SVG qua hàm production trên Chrome thật, không phải MP4 Remotion xuất thành công và không phải video gốc được dựng lại.
- Phạm vi chất lượng: kế hoạch có cấu trúc cụ thể hơn đoạn văn chung, nhưng trong dữ liệu thử hai nhóm kỵ binh vẫn thiếu mô tả riêng bộ phận ngựa so với mô tả tay/thân người. Animation trả về vẫn chưa có track chân riêng cho sáu ngựa phụ. Vì vậy **chưa nghiệm thu chất lượng bằng mốc 6 ngựa đã duyệt**. Prompt đã nhấn mạnh không được bỏ cơ chế chuyển động của con vật/vật chở/phương tiện khi cụ thể hóa nhóm; câu nhấn mạnh cuối này được kiểm hợp đồng cục bộ, chưa chạy một lượt live mới riêng cho nó.

Kiểm chứng cuối: `npm run test:motion-script-intent`, TypeScript, test camera/rig/render behavior/log liên quan và `git diff --check` đạt. Bản dev tự nạp source; chưa đóng gói phát hành. Dữ liệu kịch bản/phân cảnh đã accepted từ trước không tự viết lại chỉ do thay prompt.

Các lần thử prompt khác nhau trong phát triển được lưu riêng; không cộng các lần thử đó rồi báo là “một lượt vẽ đã đạt”. Chất lượng chỉ kết luận theo video thực tế, không theo số track, độ dài mô tả hoặc việc JSON render được. Chưa có kết luận full video/đủ mọi tổ hợp live hay bảo đảm 100% chất lượng phản hồi đầu.
