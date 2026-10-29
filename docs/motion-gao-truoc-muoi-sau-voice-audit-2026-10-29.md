# Kiểm tra giọng — Gạo trước, muối sau

## Phạm vi và bằng chứng

- Dự án `fb184c3a7f5488efa9e109e481f97e45`, MP4 `storage/output/motion-video/gao-truoc-muoi-sau-16x9-draft-1793262766022.mp4`, dài 133,1 giây.
- 21 đoạn audio: 19 đoạn người kể, 2 đoạn em gái. Kiểm tra WAV gốc, WAV đã xử lý, track ghép, MP4, cấu hình, log và code. Không gọi TTS mới, không dựng lại video, không thay đổi code ứng dụng hoặc cấu hình.
- Dữ liệu đo: `scratch/voice-gao-audit-20261029/audit.json`; đối chiếu, tái hiện lỗi chọn giọng và ASR từng đoạn: `details.json`; nhận dạng toàn track: `track-asr.json` cùng thư mục. Hai script kiểm tra cũng được lưu tại đây.
- Đây là kiểm tra bằng tín hiệu âm thanh, dữ liệu và nhận dạng cục bộ; không coi ASR là xác nhận cảm nhận nghe hoặc phát âm sai từng chữ.

## 1. Đã xác nhận: bỏ qua giọng người kể của kênh

Kênh Truyện ma trong `storage/vieneu/voice-channels.json` chỉ định `custom-thantrung-narrator-v2-20261025` — **Thần trùng · Người kể v2**, nam. File voice vẫn có trong kho và không bị ẩn. Bản phân tích cũng xác định Tôi là con trai lớn, nam trưởng thành, `narrator: true`.

Tuy nhiên, toàn bộ 19 WAV người kể trong dự án dùng **Trúc Ly**, nữ. Vai Tôi dùng chung Trúc Ly. Đây là lệch cấu hình thực tế, không phải chỉ khác tốc độ.

Chuỗi nguyên nhân:

1. `src/lib/motionAudioDirection.ts:48` nối các mô tả giọng kể từ DNA nguồn. Đầu ra vẫn chứa mô tả người vợ, đứa con và Quỳnh Lập của nguồn; hai mô tả còn bị lặp.
2. `src/lib/motionVoice.ts:130` tạo vai narrator tổng quát với `description = direction.narrationStyle`, không lấy giới tính của nhân vật đã đánh dấu narrator.
3. `motionSpeakerTraits` tại `src/lib/motionAudioDirection.ts:7` dò từ khóa trên toàn mô tả. Nhắc đến người vợ làm vai narrator bị suy luận thành nữ.
4. `src/lib/motionVoice.ts:143` và `:146` yêu cầu giọng đã khóa cũng phải hợp giới tính suy luận. Giọng nam của kênh bị loại; nhánh fallback tại `:157` chọn Trúc Ly.

Đã tái hiện trực tiếp với dữ liệu hiện tại: giữ mô tả DNA → chọn Trúc Ly; chỉ thay mô tả tổng quát, giữ nguyên kênh và kho → chọn đúng Thần trùng và `locked: true`. Không gọi AI hoặc tạo giọng trong phép tái hiện.

## 2. Đã xác nhận: cùng một lời thoại bị chia sang hai giọng

| Mốc video | Dữ liệu được đọc | Vấn đề |
| --- | --- | --- |
| 00:39,30–00:41,60 | Người kể: “Nó nói: Gạo rải ra đường trước, muối rải sau.” | Lời trực tiếp của em gái vẫn nằm trong vai người kể. |
| 00:42,02–00:44,53 | Em gái: “Làm ngược thì cô hồn không đi đâu hết.” | Chỉ câu sau của cùng lời cảnh báo mới đổi giọng. |
| 01:40,76–01:42,83 | Em gái: “Anh rải muối trước rồi, phải không?” | Câu này đã tách riêng vai đúng. |

Lỗi có sẵn trong `script.beats[].utterances`, được giữ nguyên trong voice plan và WAV. `normalizeMotionUtterances`/`motionSpeechResponseIssues` kiểm tra khớp văn bản và speaker hợp lệ, chưa xác định đầy đủ phạm vi lời nói trực tiếp. `needsDialogue` tại `motionVoiceDirectionService.ts:61` chỉ phát hiện trường hợp **tất cả** các dòng đều là người kể; một nhịp có ít nhất một dòng thoại vẫn lọt trường hợp tách thiếu như trên.

## 3. Đã xác nhận: cân tốc độ trung bình chưa khớp nhịp ngắt của mẫu

Hồ sơ đang tham chiếu đúng **Thần trùng - Trùng tang kỳ truyện.mp3**: khoảng 5,18 tiếng/giây khi phát âm; nghỉ ngắn 0,46 giây, nghỉ câu 0,58 giây. Đây là số đo đoạn mẫu đã lưu, không phải mọi câu của toàn file mẫu.

Log của lượt này đã áp dụng pacing phiên bản 9 cho 19 đoạn người kể. Đo lại WAV sau xử lý: tốc độ phát âm ước tính khoảng **5,11–5,27 tiếng/giây**, trung bình **5,16**, hệ số biến thiên khoảng **0,77%**. Do phép đo năng lượng và resample, số đo lại có sai khác nhỏ so với metadata 5,11–5,23. Không có bằng chứng tốc độ trung bình giữa các đoạn lệch lớn như lỗi cũ của Quán Cơm.

Nhưng khoảng nghỉ vẫn có vấn đề:

- 00:26,88: đoạn “Đêm đó… Bước một. Bước hai. Bước ba.” có các khoảng nghỉ nội bộ đo được 0,22–0,25 giây.
- 00:34,04: “Em gái tôi ngồi dậy…” có hai khoảng nghỉ khoảng 0,24 giây.
- 01:20,45: “Tôi gọi mẹ…” có các khoảng nghỉ khoảng 0,19–0,29 giây.
- **13/19 đoạn người kể không có khoảng nghỉ nội bộ nào đạt 0,30 giây** theo cùng phép đo năng lượng. Các mốc này là khoảng yên thấp năng lượng, không phải căn chỉnh chính xác từng dấu câu.

Nguyên nhân còn lại trong `motionVoiceCadenceService.ts`:

- Chỉ lấy khoảng nghỉ từ 0,30 giây (`motionVoice.ts:639`), nên các khoảng nghỉ đang ngắn tiếp tục bị bỏ qua.
- Khi số khoảng nghỉ không bằng số dấu câu, chọn độ dài mục tiêu gần khoảng nghỉ cũ nhất, không căn theo dấu câu thực tế (`motionVoiceCadenceService.ts:50`). Không thể bảo đảm dấu chấm dài hơn dấu phẩy.
- Một hệ số tempo cho cả đoạn; chưa kiểm soát tốc độ từng cụm bên trong đoạn.

Do đó, “đã cân nhịp” trong log hiện chỉ chứng minh mức tốc độ trung bình gần mục tiêu; chưa chứng minh nghe giống nhịp kể của mẫu.

## 4. Chọn giọng em gái theo tuổi, chưa theo trạng thái bị vong mượn giọng

Hai câu của em gái dùng `custom-8b23f99e7458320ac8e3869aff480f3f`. Mô tả voice trong kho là **AI33 Yuna · giọng trẻ em · hoạt hình, tinh nghịch**. Trong lời kể, nhân vật lại nói bằng giọng “khàn khàn, già hơn tuổi”. Đây là sự không phù hợp giữa mô tả voice và chỉ dẫn kịch bản; cần nghe đánh giá sắc thái thực tế, không kết luận cảm giác sợ từ metadata.

Giọng child đã khóa của kênh là nam, còn em gái là nữ; điều kiện tương thích làm code chọn giọng nữ thay thế. Nhánh hiện tại chọn theo speaker/giới tính/tuổi, chưa biểu diễn thay đổi người phát giọng trong cùng nhân vật như bị nhập hoặc vong mượn giọng. Các hiệu ứng serious hiện cũng không tự biến giọng trẻ em thành giọng già khàn.

## 5. Độ rõ chữ: có dấu hiệu cần nghe lại, chưa coi ASR là lỗi chắc chắn

Lượt dựng tắt `asrCheck`; toàn bộ 21 clip có trạng thái `unchecked`. Trong lượt kiểm tra này đã chạy Whisper small cục bộ, không tạo lại WAV:

- 00:07,85: “Mẹ dặn…” bị nhận thành “Này dặn…”.
- 00:34,04: “cái giọng… Giọng khàn khàn, già hơn tuổi” bị nhận lệch ở một số từ.
- 01:40,76: “Anh rải muối…” bị nhận thành “Hành giải mối…”.

Các lệch tương tự xuất hiện ở cả **WAV TTS gốc** và **WAV đã xử lý** của các đoạn này. Vì thế nếu xác nhận có phát âm chưa rõ thì không thể quy toàn bộ cho cân nhịp hoặc xuất MP4; phải xét cả chất lượng TTS và voice nguồn. Whisper small có thể nghe sai tiếng Việt rõ, nên các ví dụ trên là vị trí cần nghe lại, chưa phải kết luận bỏ/sai chữ.

Whisper toàn track còn tự nhận ra câu quảng bá kênh ở đuôi. Đã kiểm PCM từ giây 130,5 tới hết track: **toàn số 0**. Câu quảng bá đó là nhận dạng bịa trên im lặng, không có trong audio. Không đưa kết quả này thành lỗi video hoặc QA cứng.

## 6. Những điều đã kiểm tra và chưa thấy là nguyên nhân chính

- 21 WAV clip không có mẫu chạm ngưỡng clipping 16-bit; RMS các clip khoảng -19,5 đến -20,3 dBFS. Chưa thấy bằng chứng lỗi nhỏ/to thất thường lớn ở cấp clip.
- Các cửa sổ 2 giây tại 0, 26, 39, 42, 80, 100 và 119 giây: WAV ghép khớp track voice, tương quan 1; MP4 tương quan khoảng 0,998–1,000 với voice, có hệ số tăng âm lượng gần cố định. Không thấy dấu hiệu MP4 đổi tốc độ riêng hoặc nhạc che lời đáng kể tại các cửa sổ đã đo. Không suy rộng thành chứng nhận mọi thời điểm của video.
- Không phải backend chưa nạp bản cân nhịp: metadata và log của chính lượt này cho thấy phiên bản 9 đã chạy.

## Hướng sửa chung sau lượt kiểm tra ban đầu

1. Ưu tiên tuyệt đối giọng người kể do người dùng khóa trong kênh khi voice còn dùng được. Đặc điểm người kể lấy từ vai được đánh dấu narrator; không dò giới tính từ đoạn mô tả có nhiều người. Phát hiện fallback phải log rõ giọng yêu cầu, giọng thực tế và lý do. Giữ các cấu hình giọng thủ công.
2. Chỉ lấy cách kể, nhịp và sắc thái từ DNA; bỏ tên/vai nguồn và khử lặp trong ngữ cảnh phân vai. Áp dụng xuyên cả hai chế độ dựng.
3. Sửa phạm vi lời trực tiếp tại từng utterance sai; giữ nguyên các đoạn đã đúng. Tách trạng thái nhân vật và người phát giọng, hỗ trợ bị nhập/mượn giọng cho nhiều truyện, không khóa theo em gái của video này.
4. Căn khoảng nghỉ theo dấu câu và âm thanh với độ tin cậy đủ, có biên bảo vệ phụ âm. Không chỉ hạ ngưỡng 0,30 một cách mù quáng hoặc ép tempo theo thời lượng cảnh. Giữ các sửa cân tốc độ/cache đã có.
5. Kiểm tra rõ chữ theo cấu hình; dùng ASR để gợi ý đoạn nghi vấn, bỏ phần im lặng và tránh coi lỗi nhận dạng là lỗi TTS chắc chắn. Nếu cần sửa, chỉ tạo lại những clip lỗi được xác nhận.
6. Tăng phiên bản cache phần phân vai/audio bị ảnh hưởng; tái dùng các phần hình và âm thanh còn đúng, cập nhật phụ đề/timeline theo giọng mới. Chưa thực hiện các bước này trong lượt audit.

## Đã triển khai sau khi người dùng yêu cầu đối ứng

Các sửa nằm trong luồng giọng chung, áp dụng cho cả dựng bằng kho và Remotion:

- Giọng người kể khóa trong kênh được ưu tiên, kể cả khi mô tả DNA nhắc người khác hoặc vai Tôi có binding tự động từ lần trước. Lựa chọn giọng thủ công của người dùng được ưu tiên hơn cấu hình kênh. Metadata phân vai mô tả giới tính của giọng thực tế.
- Ngữ cảnh cách kể chỉ chuyển đặc điểm diễn đạt; không dùng tên và vai nhân vật nguồn làm danh tính người kể. Không đổi ba prompt dựng hình.
- Sửa phần lời trực tiếp còn nằm trong người kể khi xác định chắc người nói và phạm vi lời nói. Giữ nguyên nội dung; trường hợp mơ hồ dùng cơ chế phục hồi có giới hạn hiện có.
- Bổ sung `voiceSpeaker` tách nhân vật hiển thị khỏi nguồn phát giọng trong tình huống bị nhập/mượn giọng có bằng chứng. Không suy diễn trạng thái chỉ từ mô tả toàn truyện, không suy diễn cho nội dung factual, tôn trọng chỉnh tay và xóa trạng thái khi trở lại bình thường hoặc sang chương.
- Nhận cả khoảng nghỉ ngắn từ 0,12 giây; ghép dấu câu theo tiến độ phát âm thay vì suy từ độ dài khoảng nghỉ. Chỉ sửa các mốc khớp đủ tin cậy, giữ biên bảo vệ phụ âm và các khoảng thở chưa xác định. Giữ giới hạn tempo và không gọi thêm AI/ASR cho cân nhịp.
- Khi bật kiểm tra ASR, loại từ nhận trên khoảng im lặng hoặc timestamp không hợp lệ. Không biến kết quả nhận dạng bịa trên im lặng thành lỗi phát âm.
- Tăng phiên bản voice plan 8, track 11, pacing 10, ASR 5; giữ phiên bản clip TTS 7 để tái sử dụng WAV gốc còn hợp lệ. Cache bao gồm lựa chọn thủ công và ngữ cảnh nhân vật.

### Kiểm chứng

- TypeScript `tsc --noEmit`: đạt.
- Các kiểm tra: voice attribution, reference cadence, casting skip, pacing, clarity, continuity, voice quality và response contracts: đạt, không dùng AI/TTS trực tiếp và không tạo video mới.
- Kiểm tra hồi quy attribution bao gồm khóa kênh, override thủ công, binding vai Tôi, phân vai thoại thiếu một phần, nguồn giọng có bằng chứng, ngữ cảnh factual, cache, nhận dạng trên im lặng và routing audio.
- Script `scratch/voice-gao-audit-20261029/verify-fix.ts` kiểm tra chính dữ liệu Gạo trước, muối sau: chọn đúng `custom-thantrung-narrator-v2-20261025`; câu “Gạo rải ra đường trước, muối rải sau.” chuyển sang em gái với nguồn giọng cô hồn. Nội dung của cả 18 nhịp không thay đổi.
- Tái xử lý **bản sao 19 WAV có sẵn**, không gọi TTS: khớp 49/92 vị trí dấu câu, khoảng nghỉ nội bộ từ 0,30 giây tăng từ 11 lên 50; không clip nào vượt ngưỡng báo nhịp còn lệch. Các vị trí chưa chắc được giữ nguyên. Kết quả tại `scratch/voice-gao-audit-20261029/fix-verification/report.json`.
- Đây vẫn là WAV giọng Trúc Ly có sẵn được dùng để kiểm xử lý nhịp; chưa tạo WAV giọng người kể đúng hoặc đánh giá cảm nhận nghe của giọng mới. Không coi kết quả đo là cam kết mọi chữ rõ hoặc mọi dấu câu khớp mẫu.
- Cập nhật mock offline của response-contract test để tương thích dependency ảnh bìa mới và kiểm tra prompt có thêm khóa style/bố cục; không sửa code production ảnh bìa trong lượt này.

### Nạp backend và dữ liệu cũ

- Trước khi nạp lại: 21 production và 20 render job đều ở trạng thái hoàn tất/lỗi/hủy, không có lượt Motion đang chạy. Một story job cũ trên đĩa đã được kiểm tra API và không còn trong backend.
- Khởi động lại riêng backend cổng 3002, PID cũ 3100 → PID mới 75540. Log: `scratch/voice-gao-audit-20261029/backend-20261029-163428.stdout.log` và file stderr tương ứng.
- Sau nạp lại, API trả `success: true`, production vẫn `completed`, stage `Video đã hoàn thành`; cổng 3002 do PID 75540 lắng nghe. Startup có cảnh báo chưa kết nối trình duyệt sinh ảnh cổng 9222; lượt này không chạy tạo ảnh hoặc mở Chrome.
- Không thay WAV gốc, MP4, cấu hình voice hoặc dữ liệu production. Bản MP4 cũ không tự đổi; cần tạo lại phần giọng và xuất lại để áp dụng giọng kể/phân vai mới.
