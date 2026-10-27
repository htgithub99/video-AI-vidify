# Đề xuất ban đầu: Room Chat AI + Remotion Engine

> **Cập nhật theo yêu cầu dùng Remotion ngày 26/10/2026:** phương án áp dụng cho tool hiện tại nằm trong [Plan tích hợp Remotion](motion-visual-modes-remotion-integration-plan-2026-10-26.md). Thêm cấu hình **Phương thức dựng video: Sử dụng kho tài nguyên / Dựng bằng Remotion**; mục 4 quy định UI, payload, lưu/khôi phục lựa chọn và nghiệm thu cho hai nhánh. Nhánh mới dùng React/SVG dựng cảnh theo dữ liệu; thiết kế nhân vật theo câu chuyện, chỉ duy trì nhận dạng của entity tái xuất hiện. Không bắt tạo một bộ nhân vật/tư thế cố định trước production. Artwork bổ sung là khả năng nội bộ khi cần; giữ các bản sửa kho, voice và room đã làm. Mục 15 nêu thiết kế chi tiết và gate V10–V13. Nội dung phía dưới được giữ để tra cứu ý tưởng gốc; API, contract, fallback và trạng thái hoàn thành ở bản gốc chưa là runtime đã triển khai.

- **Ngày lập:** 26/10/2026
- **Tác giả:** AI Assistant (Antigravity Senior Fullstack Pair)
- **Tài liệu mục tiêu:** `docs/motion-remotion-room-chat-explainer-plan-2026-10-26.md`
- **Mục đích:** Xây dựng hệ thống tự động hóa sản xuất video kể chuyện (documentary / explainer / history / mythology) theo phong cách đặc trưng của kênh **Unknown Frequencies** (nền bản đồ lo-fi, nhân vật người que vẽ tay MS Paint, camera pan/zoom điện ảnh, mũi tên chiến thuật, phụ đề kinetic và âm thanh chiến trận) bằng cách kết hợp cơ chế **Room Chat Automation** hiện có với **Remotion Rendering Engine**.

---

## 1. Mục tiêu & Phạm vi Hệ thống

### 1.1. Mục tiêu cốt lõi
1. **Đa dạng hóa thể loại (Multi-genre Coverage):** Không hardcode cho một video cụ thể (như Achilles hay Thế chiến), mà phục vụ được bất kỳ chủ đề nào:
   - Thần thoại & Cổ tích (Hy Lạp, Bắc Âu, Ai Cập, Dân gian).
   - Lịch sử & Chiến tranh (Cổ đại La Mã, Tam Quốc, Thế chiến 1 & 2, Chiến dịch Điện Biên Phủ...).
   - Khoa học, Triết học & Địa chính trị (Thuyết tương đối, Big Bang, Chiến tranh Lạnh...).
   - Tiểu sử danh nhân & anh hùng dân tộc.
2. **Chuẩn hóa ngôn ngữ thị giác (Unknown Frequencies Style):**
   - Bản đồ địa lý / giấy da cổ / nền giấy thô làm không gian sự kiện.
   - Nhân vật 2D Stick Figure / Lo-Fi Paint với các phụ kiện nhận diện thời đại (mũ giáp, khiên, súng, cờ hiệu...).
   - Chuyển động Camera (Pan & Zoom / Ken Burns) bám sát các sự kiện trên bản đồ.
   - Mũi tên hành quân (Tactical Arrows) tự vẽ nét động theo lời kể.
   - Phụ đề Kinetic đồng bộ từng từ theo giọng đọc.
3. **Phân tách trách nhiệm triệt để (Separation of Concerns):**
   - **Tầng AI (Semantic & Directing):** Sử dụng cơ chế Room Chat (`chatUiPlanningService.ts`) để tư duy cốt truyện, chia nhịp hình (`storyboard.ts`), và chỉ định đạo diễn (`director.ts`).
   - **Tầng Kỹ thuật (Deterministic Rendering):** Remotion & Code tính toán tọa độ, nội suy chuyển động và render video chính xác từng khung hình (frame-accurate).

---

## 2. Kiến trúc Luồng Dữ liệu Tổng thể (End-to-End Pipeline)

```text
[Yêu cầu người dùng: Chủ đề bất kỳ]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. ROOM CHAT PLANNING LAYER (chatUiPlanningService.ts)      │
│    - Gửi Prompt qua Trình duyệt Web (ChatGPT/Claude/Gemini) │
│    - Turn 1: Kịch bản lời dẫn (Narrative Script Lines)       │
│    - Turn 2: Phân nhịp hình Storyboard (Visual Units)       │
│    - Turn 3: Đạo diễn thị giác (Scene Directing Contract)   │
│    - Bộ cứu lỗi: salvageRoomJson / extractMotionRoomJson    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON Artifact
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AUDIO & TIMESTAMPS GENERATION                            │
│    - TTS Engine (ElevenLabs/Azure/OpenAI Voice)             │
│    - Bóc tách thời gian từng từ: Whisper Word Alignment     │
│    - Chuyển đổi giây ➔ Frame Number (FPS = 30)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Audio + Timestamps
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. REMOTION VIDEO CONTRACT COMPILER                         │
│    - Ánh xạ nhịp hình Room Chat sang Remotion Sequences     │
│    - Khớp mốc thời gian lời thoại với hoạt ảnh thị giác     │
│    - Xuất ExplainerVideoContract hoàn chỉnh                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Video Data Contract
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. REMOTION RENDERING ENGINE (React + SVG Canvas)           │
│    - MapCameraController: Nội suy Camera Pan & Zoom         │
│    - Modular StickFigureKit: Người que + Phụ kiện thời kỳ   │
│    - TacticalArrow: Mũi tên hành quân SVG tự vẽ nét         │
│    - KineticSubtitles: Highlight từng chữ theo lời nói      │
│    - AudioMixer: Lồng Voiceover, SFX sự kiện, BGM ducking   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                   [FILE VIDEO MP4 FULL HD 1080P]
```

---

## 3. Thiết kế Hợp đồng Dữ liệu (Explainer Video Contract)

Hợp đồng dữ liệu chuẩn là cầu nối giữa kết quả phân tích của Room Chat và Remotion Engine:

```typescript
export interface ExplainerVideoContract {
  meta: {
    title: string;
    theme: "ancient_greece" | "world_war" | "medieval" | "modern_cold_war" | "mythology" | "science";
    fps: number;
    width: number;
    height: number;
  };
  audio: {
    voiceoverUrl: string;
    bgmUrl: string;
    bgmMood: "epic" | "tense" | "somber" | "triumphant";
  };
  subtitles: Array<{
    word: string;
    startFrame: number;
    endFrame: number;
  }>;
  scenes: Array<{
    id: string;
    startFrame: number;
    durationInFrames: number;
    camera: {
      targetX: number;       // Tọa độ tâm ngắm trên bản đồ (0 - 100%)
      targetY: number;       // Tọa độ tâm ngắm trên bản đồ (0 - 100%)
      zoom: number;          // Mức độ zoom (1.0 = toàn cảnh, 2.5 = cận cảnh)
      easing: "linear" | "smooth";
    };
    actors: Array<{
      id: string;
      role: "general" | "soldier" | "king" | "god" | "thinker";
      skin: string;          // Bộ phụ kiện: spartan_armor, ww2_helmet, crown, toga...
      position: [number, number]; // Tọa độ logic [x, y]
      action: "enter" | "idle" | "attack" | "fall" | "retreat";
      delayFrame: number;
    }>;
    tacticalElements?: Array<{
      type: "arrow" | "cross_mark" | "flag" | "circle_highlight";
      from?: [number, number];
      to?: [number, number];
      position?: [number, number];
      color: "red" | "blue" | "gold" | "black";
      startFrame: number;
    }>;
    sfxEvents?: Array<{
      sound: "sword_clash" | "arrow_whoosh" | "cannon_fire" | "march_drums" | "ocean_waves";
      atFrame: number;
    }>;
  }>;
}
```

---

## 4. Chi tiết Cơ chế Sử dụng Room Chat AI

### 4.1. Tận dụng hạ tầng Room Chat hiện có
Hệ thống sử dụng các hàm có sẵn trong:
- `src/server/services/chatUiPlanningService.ts`:
  - `prepareChatPlanningRoom`: Khởi tạo session trình duyệt web (ChatGPT, Claude, Gemini).
  - `generatePlanningWithChatUi`: Gửi prompt và thu thập phản hồi.
- `src/server/services/motionStoryService.ts`:
  - `salvageRoomJson` & `extractMotionRoomJson`: Bóc tách JSON hợp lệ ngay cả khi Room Chat trả kèm văn bản giải thích.

### 4.2. Quy trình 3 lượt gọi Room Chat (Multi-turn Room Planning)

#### Lượt 1: Lập Kịch bản Lời dẫn (Narrative Script Generation)
- **Đầu vào:** Chủ đề do người dùng nhập, thời lượng dự kiến, văn phong sử thi/tài liệu.
- **Nhiệm vụ Room Chat:** Viết kịch bản dẫn chuyện gồm 40–80 câu thoại ngắn, mỗi câu gắn liền với một diễn biến cụ thể trên bản đồ hoặc trận địa.
- **Đầu ra:** Danh sách các dòng lời kể (`lines: [{ index, text, speaker }]`).

#### Lượt 2: Phân nhịp Storyboard theo Sự việc (Event-based Storyboard)
- **Tương thích:** Kế thừa nguyên lý từ `src/server/services/puppet/storyboard.ts`.
- **Đầu vào:** Danh sách câu thoại từ Lượt 1 + Danh mục địa danh của chủ đề.
- **Nhiệm vụ Room Chat:** Gom các câu thoại theo từng biến cố lớn (`purpose`: `establish`, `action`, `reaction`, `transition`, `resolve`).
- **Đầu ra:** Mảng các `units` chứa phạm vi câu thoại bắt đầu và kết thúc (`from`, `to`).

#### Lượt 3: Đạo diễn Thị giác Chi tiết (Visual Directing)
- **Tương thích:** Kế thừa nguyên lý từ `src/server/services/puppet/director.ts`.
- **Đầu vào:** Từng nhịp Storyboard từ Lượt 2.
- **Nhiệm vụ Room Chat:** Xác định:
  1. Tọa độ hoặc địa danh tiêu điểm trên bản đồ.
  2. Nhân vật tham gia và tư thế hành động.
  3. Mũi tên tiến công hoặc đường hành quân.
  4. Nhãn hiệu ứng âm thanh cần chèn.
- **Đầu ra:** `directorPlan` theo JSON Schema đã định nghĩa.

---

## 5. Cấu trúc Mô-đun của Remotion Engine

Dự kiến cấu trúc thư mục Remotion trong hệ thống:

```text
src/remotion/
├── Root.tsx                           # Khai báo Composition chuẩn 1920x1080 @ 30fps
├── compositions/
│   └── ExplainerVideoComposition.tsx  # Điều phối toàn bộ Timeline & Sequences
├── components/
│   ├── MapCameraController.tsx        # Điều khiển Pan/Zoom camera mượt mà
│   ├── MapBackground.tsx              # Render bản đồ theo theme (Hy Lạp, Châu Âu, Thế giới)
│   ├── StickFigureKit.tsx             # Modular người que 2D + phụ kiện SVG
│   ├── TacticalArrow.tsx              # Mũi tên hành quân SVG tự vẽ nét động
│   ├── KineticSubtitles.tsx           # Phụ đề highlight từng chữ theo Whisper
│   └── AudioLayer.tsx                 # Lồng Voiceover, BGM và SFX tự động
├── utils/
│   ├── cameraMath.ts                  # Hàm tính toán ma trận Pan/Zoom an toàn
│   └── timestampParser.ts             # Quy đổi giây sang Frame Number
└── assets/
    ├── maps/                          # Bản đồ SVG/PNG độ phân giải cao
    ├── accessories/                   # Mũ, khiên, vũ khí, cờ hiệu
    └── sfx/                           # Thư viện âm thanh chuẩn
```

### Chi tiết các Component cốt lõi:
1. **`MapCameraController`**:
   - Sử dụng `interpolate()` của Remotion để tính toán tọa độ `scale`, `translateX`, `translateY`.
   - Cơ chế giới hạn an toàn (Clamp): Đảm bảo camera không bao giờ zoom quá sát vỡ hình hoặc lia ra ngoài vùng hiển thị của bản đồ.
2. **`StickFigureKit`**:
   - Khung người que 2D chuẩn nét mực đen đơn sắc.
   - Slot gắn phụ kiện trên đầu, ngực, tay trái, tay phải.
   - Hiệu ứng xuất hiện: Dùng hàm `spring({ damping: 12 })` để nhân vật nảy nhẹ vào khung hình.
3. **`TacticalArrow`**:
   - Sử dụng SVG đường cong Bézier.
   - Hiệu ứng vẽ nét: Áp dụng `strokeDasharray` và `strokeDashoffset` nội suy theo frame để mũi tên vươn dài từ căn cứ đến mục tiêu tấn công.
4. **`KineticSubtitles`**:
   - Hiển thị thanh phụ đề tối giản ở cạnh dưới.
   - Nhận diện `currentFrame` để đổi màu highlight (vàng/cam) chính xác từng từ mà giọng đọc đang phát.

---

## 6. Lộ trình Triển khai Chi tiết (Phase-by-Phase Roadmap)

### Giai đoạn 1: Thiết lập Contract & Tích hợp Room Chat
- [ ] Xây dựng file TypeScript định nghĩa Types: `src/types/explainerMotion.ts`.
- [ ] Xây dựng bộ Prompt chuẩn hóa trong `src/constants/motionExplainerPrompts.ts`.
- [ ] Viết hàm gọi Room Chat chuyên dụng `runExplainerRoomPlanning` dựa trên `chatUiPlanningService.ts`.
- [ ] Viết bài test xác thực khả năng bóc tách JSON bằng `salvageRoomJson` với các ca phản hồi dơ từ Room Chat.

### Giai đoạn 2: Xây dựng Kho Tài nguyên Đồ họa Nền tảng (Asset Library)
- [ ] Chuẩn bị 3 bản đồ nền SVG chuẩn:
  - Bản đồ Hy Lạp cổ đại & Biển Aegea (Thần thoại, Chiến tranh Peloponnesus).
  - Bản đồ Châu Âu (Thời kỳ Napoleon, Thế chiến 1 & 2).
  - Bản đồ Thế giới phẳng phong cách giấy da cổ.
- [ ] Thiết kế bộ Modular Stick Figure (Khung người que + 12 phụ kiện đại diện cho các thời đại).
- [ ] Xây dựng bảng âm thanh SFX chuẩn (tiếng gươm giáo, tên bay, đại bác, trống trận, sóng biển).

### Giai đoạn 3: Xây dựng Remotion Template
- [ ] Cài đặt các gói phụ thuộc Remotion (`remotion`, `@remotion/renderer`).
- [ ] Hoàn thiện `MapCameraController` với thuật toán Pan & Zoom mượt mà.
- [ ] Hoàn thiện `TacticalArrow` với hoạt ảnh vẽ nét đường cong.
- [ ] Hoàn thiện `KineticSubtitles` và `AudioLayer` (tự động ducking nhạc nền khi có voiceover).

### Giai đoạn 4: Bộ Chuyển đổi và Render Hoàn chỉnh (End-to-End Adapter)
- [ ] Xây dựng `explainerConverterService.ts` để chuyển đổi dữ liệu từ Room Chat sang Props của Remotion.
- [ ] Tích hợp dịch vụ TTS (tạo file âm thanh + mốc thời gian từng từ).
- [ ] Xây dựng lệnh render qua Node API của Remotion: `renderMedia()`.
- [ ] Xuất video thử nghiệm với chủ đề Achilles và một chủ đề Thế chiến để xác nhận tính đa dạng.

---

## 7. Ma trận Kiểm thử Bắt buộc (Mandatory Test Matrix)

| Nhóm Kiểm Thử | Tình huống Cụ thể | Kết quả Kỳ vọng |
| :--- | :--- | :--- |
| **1. Happy Path** | Nhập chủ đề chuẩn, Room Chat trả JSON sạch. | Video render trọn vẹn, camera lia đúng bản đồ, âm thanh và phụ đề khớp từng frame. |
| **2. Room Chat Malformed** | Room Chat trả JSON kẹp trong markdown thừa hoặc bị ngắt cụt câu. | `salvageRoomJson` xử lý an toàn, tự động khôi phục dữ liệu hoặc báo lỗi rõ ràng, không crash server. |
| **3. Missing Coordinates** | Room Chat chỉ định một địa danh lạ chưa có trong từ điển toạ độ. | Hệ thống tự động fallback về toạ độ trung tâm bản đồ kèm log cảnh báo. |
| **4. Audio Duration Mismatch** | Giọng đọc nói nhanh hơn hoặc chậm hơn so với thời lượng dự tính của cảnh. | Remotion tự động co giãn `durationInFrames` của cảnh dựa trên timestamps thực tế của file âm thanh. |
| **5. Multi-actor Stacking** | Có nhiều nhân vật cùng xuất hiện tại một địa điểm. | Thuật toán slot logic tự động dàn cách các nhân vật theo hàng ngang, không để hình đè lên nhau. |
| **6. Camera Clamping** | Toạ độ mục tiêu nằm sát mép biên bản đồ. | Camera tự động giới hạn vùng nhìn (clamp), không để lộ khoảng trống ngoài viền bản đồ. |

---

## 8. Bảng Nghiệm thu Quy trình (Completion Checklist)

| Bước Quy trình | Trạng thái | Bằng chứng Xác minh |
| :--- | :---: | :--- |
| **1. Phân tích yêu cầu & AC** | Đã điều chỉnh | Thêm ba chế độ và tiêu chí bảo toàn luồng cũ; xem plan tích hợp hiện hành. |
| **2. Khảo sát Codebase** | Đã rà lại | JSON helpers là nội bộ; cần dùng AI contract chung và thêm dispatch ở nhiều tầng. |
| **3. Thiết kế Data Contract** | Cần triển khai | Tách semantic plan khỏi render contract; code tính geometry/frame theo audio thật. |
| **4. Phạm vi lượt cập nhật** | Chỉ tài liệu | Không cài Remotion, không sửa runtime hoặc tạo video. |
| **5. Trạng thái Kế hoạch** | Chưa triển khai | Thực hiện V01–V09 trong plan tích hợp và nghiệm thu từng đợt. |
