# Dọn thư mục gốc và thu gọn UI chương — 06/11/2026

## Phạm vi đã dọn

Kiểm tra các tệp ở thư mục gốc theo ảnh người dùng, gồm tham chiếu trong source, Python, script cài đặt, đóng gói và tài liệu. Thư mục gốc giảm từ 48 xuống 14 tệp.

| Tệp đang dùng | Vị trí mới |
|---|---|
| FFmpeg | `tools/ffmpeg/ffmpeg.exe` |
| Cài FFmpeg | `scripts/setup/install-ffmpeg.ps1` |
| Cài Python | `scripts/setup/setup-python.ps1` |
| Đóng gói ứng dụng | `scripts/build/package-app.ps1` |
| Dependency Python cho dev | `scripts/setup/requirements-dev.txt` |
| Hướng dẫn kho 2D | `docs/guides/HUONG_DAN_KHO_2D_CO_DINH.md` |
| Hướng dẫn tải trực tiếp | `docs/guides/TAI-TRUC-TIEP-KHONG-LUU-HOSTING.md` |
| Device ID cục bộ | `storage/device_id.json` |

Giữ nguyên nội dung binary FFmpeg và Device ID, xác nhận bằng SHA-256 trước/sau. Dịch vụ nhận diện thiết bị đọc vị trí dữ liệu mới, vẫn có fallback đọc vị trí cũ khi chạy checkout chưa chuyển dữ liệu. Không gọi API cấp phép trong kiểm chứng.

Xóa 26 tệp: 25 log/tệp chẩn đoán `scratch_*`, `scratch-*.log`, loader Vite `vite.config.ts.timestamp-*`; và `metadata.json` scaffold AI Studio không được runtime/build dùng. Tệp Python chỉ nhắc tên metadata trong danh sách loại trừ của bộ chọn JSON, không đọc nội dung metadata.

Đã cập nhật:

- Bộ tìm tài nguyên Node nhận FFmpeg ở thư mục mới, giữ fallback tài nguyên Electron và vị trí gốc cũ.
- PATH của tiến trình server/tiến trình con nhận `tools/ffmpeg`, không phụ thuộc FFmpeg cài hệ thống.
- Python CapCut nhận thư mục công cụ mới.
- Mapping electron-builder vẫn đưa FFmpeg về `resources/ffmpeg.exe` trong bản đóng gói.
- Script setup/build tính đường dẫn theo workspace; cập nhật lệnh npm, liên kết tài liệu và README.
- `.gitignore` bỏ qua các log/tệp kiểm tra tạm ở gốc để hạn chế tái xuất hiện.

Giữ ở gốc các tệp chuẩn cần cho Node/Vite/TypeScript/lint/Python analyzer: `package.json`, lockfile, `index.html`, `server.ts`, `vite.config.ts`, `tsconfig.json`, `knip.json`, `pyrefly.toml`, README và các dotfile cấu hình/môi trường. Không di chuyển source, dự án, video, profile hoặc thư viện người dùng.

## UI chương

Chương hiển thị hai cột trên màn hình rộng, một cột trên điện thoại. Header và nút sao chép thu nhỏ, mốc giờ tách khỏi tiêu đề, bỏ ô nền và khoảng cách lớn từng dòng. Dùng nguyên văn kết quả `chapterLines`, giữ thứ tự, lọc mốc, mốc đầu 00:00 và định dạng khi sao chép/xuất TXT.

Chrome thật: panel 5 chương rộng 982 px cao 123 px; ở viewport 360 px, panel rộng khoảng 318 px cao 194 px, không tràn ngang. Đã xem ảnh desktop/mobile/light và kiểm nút sao chép bằng clipboard fixture cô lập, không ghi đè clipboard hệ thống.

## Kiểm chứng

- TypeScript: đạt.
- ESLint các tệp thay đổi trong đợt này: đạt.
- Parser PowerShell cho setup/build/shared texts: đạt; không chạy tải/cài/đóng gói ứng dụng thật.
- Parser Python cho CapCut: đạt.
- FFmpeg vừa chuyển: chạy `-version` từ PATH không có FFmpeg hệ thống; encode MP4 64×64, 3 frame; ffprobe đọc đúng.
- Đường dẫn tài nguyên mới, fallback root cũ và Electron resources: đạt trên fixture tách riêng.
- Giữ hash của binary, Device ID và requirements: đạt.
- Chrome cài thật mở cửa sổ, dữ liệu 5 chương từ dự án đã chạy; desktop/mobile, copy đúng dữ liệu: đạt.

Bằng chứng:

- [Danh sách tệp chuyển](D:/video-AI-vidify/scratch/root-cleanup-20261106/moves.json)
- [Danh sách tệp xóa và lý do](D:/video-AI-vidify/scratch/root-cleanup-20261106/deleted.json)
- [Đường dẫn và encode FFmpeg](D:/video-AI-vidify/scratch/root-cleanup-20261106/paths-verification.json)
- [UI và clipboard](D:/video-AI-vidify/scratch/root-cleanup-20261106/chapters-verification.json)
- [Ảnh UI gọn](D:/video-AI-vidify/scratch/root-cleanup-20261106/chapters-desktop.png)
