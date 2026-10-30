# Chuẩn hóa mã nguồn — 30/10/2026

## Phạm vi đã thực hiện

| Yêu cầu | Kết quả |
| --- | --- |
| Bỏ comment và dồn dòng | Formatter đọc cú pháp TS/JS/JSX, CSS, HTML; Python dùng tokenizer và so sánh AST; PowerShell so sánh token. Giữ nguyên nội dung chuỗi, regex, template và chuỗi nhiều dòng. |
| Format 400 cột | Dùng Prettier `printWidth: 400` và Black 400. Bỏ dòng trống ngoài dữ liệu chuỗi ở mã TS/JS/Python/PowerShell. Không cắt chuỗi dài hoặc ép câu lệnh thành một dòng nếu parser cần xuống dòng. |
| Gom text, URL, nhãn, tooltip | 351 vị trí được chuyển về hằng số; tái sử dụng 77 hằng số đã có. Phần bổ sung nằm ở `src/constants/runtime/values.ts`; giữ các bộ text theo chức năng đã có. Audit hiện kiểm tra cả frontend, backend, Electron và mã quản trị. |
| Dùng hàm chung | JSON parse/stringify/clone; đọc Blob/FileReader; định dạng dung lượng; xử lý sao chép và thời gian phản hồi. Bỏ triển khai trùng ở Motion và các màn đã chuyển sang hook chung. |
| Dùng component chung | `CopyButton` dùng ở Flow và SEO; `FeatureWorkspace` quản lý lazy load, giữ bản nháp và khoanh vùng lỗi từng màn. |
| Tách menu | 12 màn có entry lazy riêng. Di chuyển 97 service riêng của Motion, Nhạc, Ghép nhạc vào thư mục feature; cập nhật import, re-export, fixture và đường dẫn trong mã kiểm thử. Service chẩn đoán được nhiều luồng sử dụng tiếp tục nằm ở tầng dùng chung. |
| Dọn code thừa | Bỏ các hàm cục bộ trùng đã thay bằng tiện ích chung, import dư, 29 hằng số mới không còn dùng và vị trí service cũ sau khi chuyển. Các script chuyển đổi một lần được lưu ngoài nguồn chạy, trong scratch. |

## Cấu trúc và quy tắc sửa tiếp

- Giao diện, hook, controller, service riêng của menu đặt trong `src/features/<menu>/`.
- Component dùng nhiều màn đặt trong `src/components/common/`; tiện ích thuần đặt trong `src/lib/`; hạ tầng trình duyệt, AI, media và chẩn đoán dùng chung đặt trong `src/server/`.
- Hằng số nghiệp vụ và text tiếp tục dùng các file trong `src/constants/` hoặc `src/features/<menu>/constants/`. Không tạo thêm bộ hằng số trùng giá trị đã có khi bộ hiện tại phù hợp.
- `src/features/screens.ts` là entry của các màn. Không import trực tiếp implementation của menu khác; hai luồng auto-video/cinematic được dùng thư viện video-generation chung theo quy tắc hiện tại.
- Import/module specifier, khóa schema, literal type, phép kiểm tra `typeof`, chuỗi rỗng và khai báo phụ thuộc trong HTML được giữ ở nơi cú pháp yêu cầu. Đây không phải text hiển thị cần dịch.
- Hàm gửi vào Playwright/browser phải nhận dữ liệu tường minh. Không capture import từ Node vào callback đã serialize. Camera có hàm xuất mã độc lập, truyền đủ mode qua dữ liệu JSON.
- Native JSON của luồng ứng dụng được gom vào wrapper và callback chạy độc lập trong trình duyệt. Mã quản trị, engine Canvas và công cụ xuất dữ liệu CJS chạy độc lập với TypeScript nên giữ adapter JSON phù hợp môi trường. Python dùng thư viện JSON của Python.
- Dữ liệu fixture, phản hồi AI mẫu, SVG/HTML mẫu và chuỗi dùng để kiểm thử comment phải giữ độc lập để phát hiện lỗi; không thay nội dung chỉ nhằm làm giảm số literal.
- Không xóa chức năng đang dùng hoặc dữ liệu kho/video/profile với lý do dọn file. Kiểm tra graph chưa tìm thấy file nguồn TS/JS bị bỏ rơi; kết quả này không chứng minh mọi export đều không thể thừa. TypeScript bật `noUnusedLocals` và `noUnusedParameters`.

## Kiểm tra duy trì

```sh
npm run format:code
npm run format:python
npm run format:powershell
npm run check:refactor
npm run audit:unused
```

`check:refactor` kiểm tra TypeScript, ESLint, literal/comment, format, hợp đồng JSON, ranh giới feature, giữ trạng thái/error isolation của màn và clipboard. Báo cáo audit được tạo trong `scratch/code-maintenance/`.

## Kết quả kiểm chứng của lượt này

- TypeScript và ESLint đạt; không còn comment hay literal runtime vi phạm trong 684 file được audit, gồm cả engine Canvas và công cụ xuất dữ liệu Node.
- Format TS/JS/CSS/HTML, Python và PowerShell đạt. Kiểm tra ngữ nghĩa formatter, JSON và định dạng media đạt.
- 3.920 import nội bộ đạt quy tắc feature; kiểm tra trình duyệt về lazy load, bản nháp, retry, lỗi độc lập và nâng cấp IndexedDB đạt.
- Clipboard: thành công, bị từ chối, kết quả đến muộn, key dạng số, hết thời gian phản hồi và unmount đều đạt.
- Frontend Vite, backend esbuild và bundle Remotion build thành công. Vite vẫn cảnh báo một số chunk vượt 500 KB; esbuild cảnh báo `import.meta` trong các bundle CJS/IIFE kiểm thử. Đây không phải lỗi build.
- Camera: 376.272 mẫu, sáu hướng, bốn tỷ lệ hình, bảo vệ chủ thể và tính tương đương với mã trong trình duyệt đều đạt.
- JSON/SVG phục hồi cục bộ, single-draw, composition, scene-plan recovery, response contracts, prompt resume, voice attribution và chapter speech đạt bằng fixture; không gọi AI/TTS hoặc tạo video mới.
- Hủy ghép nhạc qua ba provider và phục hồi Suno checkpoint đạt. Fixture hủy tác vụ được bổ sung hai export giả lập đang thiếu; test log SVG được cập nhật theo thông báo hiện hành, giữ nguyên các kiểm tra request/kết quả cảnh.

## Giới hạn của test cũ

Không kết luận toàn bộ hàng trăm test lịch sử đều đạt. `verify-music-source-composition.ts` còn yêu cầu `SUNO_CREATE_ACTION_ATTEMPTS` nằm trực tiếp trong service, trong khi bản gốc trước lượt này đã chuyển sang `runSunoCreationCheckpoint`. Các lỗi baseline đã ghi trước đó ở narrator recovery và production runner cũng chưa được dùng để thay đổi nghiệp vụ trong lượt dọn code này.

Việc tách menu giảm phụ thuộc chéo; sửa tiện ích chung vẫn cần kiểm tra các màn sử dụng tiện ích đó. Không có cam kết mỗi request AI bên ngoài luôn thành công.

## Backend

Backend đã nạp lại lúc 15:24:01 (UTC+7), PID 30180. Trang chính và engine trả HTTP 200; không có file nguồn runtime nào mới hơn thời điểm khởi động. So sánh 386 file tiến độ/bản nháp trước và sau: không có file bị đổi hoặc mất. Biên nhận nằm ở `scratch/maintenance-20261030/backend-check.json`. Không tự chạy tiếp dự án hoặc tạo video thử trong lượt refactor này.

Log khởi động vẫn có lỗi kết nối đến công cụ sinh ảnh bên ngoài, đã xuất hiện trước lượt refactor. HTTP health và build thành công không chứng minh kết nối ngoài này đã hoạt động; lượt này không thử gửi request AI để kiểm tra nó.
